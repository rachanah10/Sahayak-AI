
"use client";

import { useState, useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { generateAssessmentQuestionsAction, saveAssessmentAction, suggestAssessmentTagsAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { ClipboardCheck, CalendarIcon, FileText, CheckCircle, Save, Lightbulb } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type { GenerateAssessmentQuestionsOutput, Question } from "@/ai/flows/generate-assessment-questions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";


const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const schema = z.object({
  subject: z.string().optional(),
  topic: z.string().optional(),
  grade: z.string().min(1, "Please select a grade."),
  numQuestions: z.coerce.number().min(1, "At least 1 question is required.").max(50, "Maximum 50 questions."),
  questionType: z.enum(['Multiple Choice', 'Fill in the Blanks', 'Short Answer', 'Mix']),
  timer: z.coerce.number().optional(),
  deadline: z.date().optional(),
  inputType: z.enum(["topic", "upload", "library"]),
  image: z.any().optional(),
  libraryContentId: z.string().optional(),
}).refine(data => {
    if (data.inputType === 'topic') return !!data.subject && data.subject.length >= 2 && !!data.topic && data.topic.length >= 3;
    return true;
}, {
    message: "Subject and Topic are required.",
    path: ["topic"],
}).refine(data => {
    if (data.inputType === 'upload') return !!data.image && data.image.length > 0;
    return true;
}, {
    message: "Image is required for this input type.",
    path: ["image"],
}).refine(data => {
    if (data.inputType === 'library') return !!data.libraryContentId;
    return true;
}, {
    message: "Please select an item from the library.",
    path: ["libraryContentId"],
});


type FormFields = z.infer<typeof schema>;

interface LibraryContent {
  id: string;
  story?: string;
  worksheet?: string;
  prompt: string;
}

export default function AssessmentGeneratorPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [assessment, setAssessment] = useState<GenerateAssessmentQuestionsOutput | null>(null);
  const [editedAssessment, setEditedAssessment] = useState<GenerateAssessmentQuestionsOutput | null>(null);
  const [isPublished, setIsPublished] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [libraryContent, setLibraryContent] = useState<LibraryContent[]>([]);
  
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    control,
    watch,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<FormFields>({
    resolver: zodResolver(schema),
    defaultValues: {
      numQuestions: 10,
      questionType: "Mix",
      grade: "4th Grade",
      inputType: "topic",
    },
  });

  const formValues = watch();

  useEffect(() => {
    async function fetchContent() {
      if (!user) return;
      try {
        const q = query(
          collection(db, "content-library"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const content = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as LibraryContent[];
        setLibraryContent(content);
      } catch (error) {
        console.error("Error fetching library content: ", error);
      }
    }
    fetchContent();
  }, [user]);

  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSuggestTags = async () => {
    setIsSuggesting(true);
    setSuggestedTags([]);
    try {
      const { subject, topic, grade, inputType, image, libraryContentId } = getValues();
      const selectedLibraryItem = libraryContent.find(item => item.id === libraryContentId);

      const result = await suggestAssessmentTagsAction({ 
        subject,
        topic, 
        grade, 
        uploadedContent: inputType === 'upload' && image?.[0] ? image[0].name : undefined,
        libraryContent: inputType === 'library' ? (selectedLibraryItem?.story || selectedLibraryItem?.worksheet) : undefined,
       });
      setSuggestedTags(result.suggestedTags);
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error", description: "Failed to suggest tags." });
    } finally {
      setIsSuggesting(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => {
        const newSet = new Set(prev);
        newSet.has(tag) ? newSet.delete(tag) : newSet.add(tag);
        return newSet;
    });
  };

  const onSubmit: SubmitHandler<FormFields> = async (data) => {
    setIsLoading(true);
    setAssessment(null);
    setEditedAssessment(null);
    setIsPublished(false);
    try {
      const payload: any = {
        ...data,
        tags: Array.from(selectedTags),
        deadline: data.deadline ? format(data.deadline, "PPP") : undefined,
      };

      if (data.inputType === 'upload' && data.image && data.image.length > 0) {
        payload.uploadedContent = await fileToDataUri(data.image[0]);
      } else if (data.inputType === 'library' && data.libraryContentId) {
        const selectedItem = libraryContent.find(item => item.id === data.libraryContentId);
        payload.libraryContent = selectedItem?.story || selectedItem?.worksheet;
        if (!data.topic) {
            payload.topic = selectedItem?.prompt;
        }
      }

      const result = await generateAssessmentQuestionsAction(payload);
      setAssessment(result);
      setEditedAssessment(JSON.parse(JSON.stringify(result))); // Deep copy for editing
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate assessment. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionChange = (index: number, field: 'text' | 'answer', value: string) => {
    if (!editedAssessment) return;
    const newQuestions = [...editedAssessment.questions];
    // @ts-ignore
    newQuestions[index][field] = value;
    setEditedAssessment({ ...editedAssessment, questions: newQuestions });
  };

  const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
      if (!editedAssessment) return;
      const newQuestions = [...editedAssessment.questions];
      if (newQuestions[qIndex].options) {
        newQuestions[qIndex].options![oIndex] = value;
        setEditedAssessment({ ...editedAssessment, questions: newQuestions });
      }
  }
  
  const handlePublish = async () => {
    if (!editedAssessment || !user) return;
    
    const topicToSave = formValues.topic || editedAssessment.testTitle;
    const subjectToSave = formValues.subject;
    
    if (!topicToSave) {
        toast({
            variant: "destructive",
            title: "Missing Information",
            description: "A topic is required to save the assessment. Please enter one.",
        });
        return;
    }

    setIsSaving(true);
    try {
        await saveAssessmentAction({
            ...formValues,
            subject: subjectToSave,
            topic: topicToSave,
            deadline: formValues.deadline ? format(formValues.deadline, "PPP") : undefined,
            questions: editedAssessment.questions,
        }, user.uid);
        toast({
            title: "Test Saved & Published!",
            description: "The assessment has been saved and is available for students."
        });
        setIsPublished(true);
    } catch (error) {
         console.error(error);
         toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to save the assessment.",
         });
    } finally {
        setIsSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <div className="flex flex-col gap-8">
        <PageHeader
          title="Assessment Generator"
          description="Design and generate comprehensive tests for your students."
          Icon={ClipboardCheck}
        />
        <Card>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Assessment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <Tabs defaultValue="topic" className="w-full" onValueChange={(v) => setValue("inputType", v as FormFields['inputType'])}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="topic">Topic</TabsTrigger>
                    <TabsTrigger value="upload">Upload</TabsTrigger>
                    <TabsTrigger value="library">Library</TabsTrigger>
                  </TabsList>
                  <TabsContent value="topic" className="pt-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <Label htmlFor="subject">Subject *</Label>
                          <Input id="subject" placeholder="e.g., Science" {...register("subject")} />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="topic">Topic/Chapter *</Label>
                          <Input id="topic" placeholder="e.g., The Solar System" {...register("topic")} />
                      </div>
                    </div>
                     {errors.topic && <p className="text-sm text-destructive">{errors.topic.message}</p>}
                  </TabsContent>
                  <TabsContent value="upload" className="pt-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="topic-upload">Topic (Optional)</Label>
                        <Input id="topic-upload" placeholder="e.g., A specific theme to focus on" {...register("topic")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="image">Upload Content *</Label>
                      <Input id="image" type="file" {...register("image")} accept={ACCEPTED_IMAGE_TYPES.join(",")} />
                      {errors.image && <p className="text-sm text-destructive">{errors.image.message?.toString()}</p>}
                    </div>
                  </TabsContent>
                   <TabsContent value="library" className="pt-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="topic-library">Topic (Optional)</Label>
                        <Input id="topic-library" placeholder="e.g., A specific theme to focus on" {...register("topic")} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="libraryContentId">Select from Content Library *</Label>
                        <Select onValueChange={(v) => setValue("libraryContentId", v)}>
                            <SelectTrigger><SelectValue placeholder="Select content..." /></SelectTrigger>
                            <SelectContent>
                                {libraryContent.map(item => (
                                    <SelectItem key={item.id} value={item.id}>{item.prompt}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.libraryContentId && <p className="text-sm text-destructive">{errors.libraryContentId.message}</p>}
                    </div>
                  </TabsContent>
                </Tabs>


               <div className="space-y-2 pt-4">
                    <Label htmlFor="grade">Grade *</Label>
                    <Select onValueChange={(value) => setValue("grade", value)} defaultValue={formValues.grade}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {Array.from({length: 10}, (_, i) => `${i + 1}${i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'} Grade`).map(grade => (
                                <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.grade && <p className="text-sm text-destructive">{errors.grade.message}</p>}
                </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="numQuestions">Total Number of Questions *</Label>
                    <Input id="numQuestions" type="number" {...register("numQuestions")} />
                    {errors.numQuestions && <p className="text-sm text-destructive">{errors.numQuestions.message}</p>}
                </div>
                 <div className="space-y-2">
                    <Label>Question Type *</Label>
                    <Select onValueChange={(value) => setValue("questionType", value as FormFields['questionType'])} defaultValue={formValues.questionType}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Mix">Mix</SelectItem>
                            <SelectItem value="Multiple Choice">Multiple Choice</SelectItem>
                            <SelectItem value="Fill in the Blanks">Fill in the Blanks</SelectItem>
                            <SelectItem value="Short Answer">Short Answer</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
              </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="timer">Timer (minutes)</Label>
                        <Input id="timer" type="number" placeholder="e.g., 30" {...register("timer")} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="deadline">Deadline</Label>
                        <Popover>
                        <PopoverTrigger asChild>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "w-full justify-start text-left font-normal",
                                !formValues.deadline && "text-muted-foreground"
                            )}
                            >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formValues.deadline ? format(formValues.deadline, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                            mode="single"
                            selected={formValues.deadline}
                            onSelect={(date) => setValue("deadline", date || undefined)}
                            initialFocus
                            />
                        </PopoverContent>
                        </Popover>
                    </div>
               </div>
               
                <Card className="bg-muted/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg"><Lightbulb className="text-yellow-400" /> Smart Content Assistant</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button type="button" variant="outline" onClick={handleSuggestTags} disabled={isSuggesting}>
                        {isSuggesting ? <Spinner className="mr-2"/> : <Lightbulb className="mr-2" />}
                        Suggest Tags
                        </Button>
                        {suggestedTags.length > 0 && (
                            <div className="mt-4">
                                <Label className="font-bold">Suggested Tags</Label>
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {suggestedTags.map(tag => (
                                        <Badge key={tag} variant={selectedTags.has(tag) ? "default" : "secondary"} onClick={() => toggleTag(tag)} className="cursor-pointer">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Spinner className="mr-2" />}
                Generate Assessment
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      <div className="lg:sticky top-24 space-y-8">
        {isLoading && (
            <Card className="min-h-[400px] flex justify-center items-center">
                <div className="text-center space-y-2">
                    <Spinner className="w-8 h-8" />
                    <p className="text-muted-foreground">Generating your assessment...</p>
                </div>
            </Card>
        )}
        {editedAssessment && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{editedAssessment.testTitle}</CardTitle>
                <CardDescription>{formValues.grade} &bull; {editedAssessment.questions.length} Questions</CardDescription>
              </div>
              <Button size="sm" onClick={handlePublish} disabled={isPublished || isSaving}>
                {isSaving ? <Spinner className="mr-2 h-4 w-4" /> : isPublished ? <CheckCircle className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                {isPublished ? 'Published' : 'Save & Publish'}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
                {editedAssessment.questions.map((q, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                        <Label htmlFor={`q-text-${index}`} className="font-semibold">Question {index + 1}</Label>
                        <Badge variant="secondary">Difficulty: {q.difficulty}/5</Badge>
                    </div>
                    <Textarea
                        id={`q-text-${index}`}
                        value={q.text}
                        onChange={(e) => handleQuestionChange(index, 'text', e.target.value)}
                        className="text-base"
                    />

                    {q.options ? (
                        <div className="space-y-2 pt-2">
                            <Label className="font-semibold">Options</Label>
                            {q.options.map((opt, optIndex) => (
                                <div key={optIndex} className="flex items-center gap-2">
                                     <Input
                                        id={`q-${index}-opt-${optIndex}`}
                                        value={opt}
                                        onChange={(e) => handleOptionChange(index, optIndex, e.target.value)}
                                        className={cn("text-base", q.answer === opt && "border-primary ring-2 ring-primary")}
                                     />
                                </div>
                            ))}
                             <p className="text-xs text-muted-foreground">Correct Answer: {q.answer}</p>
                        </div>
                    ) : (
                         <div>
                            <Label htmlFor={`q-ans-${index}`} className="font-semibold text-primary">Answer</Label>
                            <Textarea
                                id={`q-ans-${index}`}
                                value={q.answer}
                                onChange={(e) => handleQuestionChange(index, 'answer', e.target.value)}
                                className="text-base"
                            />
                        </div>
                    )}
                   
                    <div className="flex flex-wrap gap-2 pt-1">
                        {q.tags.map(tag => (
                            <Badge key={tag} variant="outline">{tag}</Badge>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

    