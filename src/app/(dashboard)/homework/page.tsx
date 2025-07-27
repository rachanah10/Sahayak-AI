
"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { generateHomeworkAction, suggestHomeworkTagsAction, saveToContentLibraryAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { NotebookTabs, Lightbulb, Save, Key, FileText } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { GenerateHomeworkOutput, GenerateHomeworkInput } from "@/ai/flows/generate-homework";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import React from "react";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const schema = z.object({
  topic: z.string().optional(),
  grade: z.string().min(1, "Please select a grade."),
  language: z.string().min(1, "Please select a language."),
  inputType: z.enum(["topic", "upload", "library"]),
  image: z.any().optional(),
  libraryContentId: z.string().optional(),
}).refine(data => {
    if (data.inputType === 'topic') return !!data.topic && data.topic.length >= 3;
    return true;
}, {
    message: "Topic must be at least 3 characters.",
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

export default function HomeworkPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [output, setOutput] = useState<GenerateHomeworkOutput | null>(null);
  const [editedWorksheet, setEditedWorksheet] = useState("");
  const [editedAnswerKey, setEditedAnswerKey] = useState("");
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [libraryContent, setLibraryContent] = useState<LibraryContent[]>([]);
  
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<FormFields>({
    resolver: zodResolver(schema),
    defaultValues: {
      grade: "4th Grade",
      language: "English",
      inputType: "topic",
    },
  });

  const formValues = watch();

  React.useEffect(() => {
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
      const { topic, grade, language, inputType, image, libraryContentId } = getValues();
      const selectedLibraryItem = libraryContent.find(item => item.id === libraryContentId);

      const result = await suggestHomeworkTagsAction({ 
        topic, 
        grade, 
        language, 
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
    setOutput(null);
    try {
      let payload: GenerateHomeworkInput = {
        topic: data.topic,
        grade: data.grade,
        language: data.language,
        tags: Array.from(selectedTags),
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

      const result = await generateHomeworkAction(payload);
      setOutput(result);
      setEditedWorksheet(result.worksheet);
      setEditedAnswerKey(result.answerKey);

    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate worksheets. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSaveToLibrary = async () => {
    if (!output || !user) return;
    setIsSaving(true);
    const { topic, grade, language, inputType, libraryContentId } = getValues();
    
    let basePrompt = topic;
    if (inputType === 'library' && !topic) {
        basePrompt = libraryContent.find(item => item.id === libraryContentId)?.prompt || "Homework";
    }

    try {
        // Save homework
        await saveToContentLibraryAction({
            prompt: `Homework: ${basePrompt}`,
            type: 'Homework',
            content: editedWorksheet,
            grade,
            language,
        }, user.uid);

        // Save answer key
         await saveToContentLibraryAction({
            prompt: `Answer Key: ${basePrompt}`,
            type: 'AnswerKey',
            content: editedAnswerKey,
            grade,
            language,
        }, user.uid);
        
        toast({
            title: "Saved to Library",
            description: "The homework and answer key have been saved.",
        });
    } catch (error) {
        console.error(error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to save to library.",
        });
    } finally {
        setIsSaving(false);
    }
  }


  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <div className="flex flex-col gap-8">
        <PageHeader
          title="Homework Generator"
          description="Generate worksheets for different learning levels using various inputs."
          Icon={NotebookTabs}
        />
        <Card>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Homework Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs defaultValue="topic" className="w-full" onValueChange={(v) => setValue("inputType", v as FormFields['inputType'])}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="topic">Topic</TabsTrigger>
                  <TabsTrigger value="upload">Upload</TabsTrigger>
                  <TabsTrigger value="library">Library</TabsTrigger>
                </TabsList>
                <TabsContent value="topic" className="pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="topic">Topic *</Label>
                    <Input id="topic" placeholder="e.g., Photosynthesis" {...register("topic")} />
                    {errors.topic && <p className="text-sm text-destructive">{errors.topic.message}</p>}
                  </div>
                </TabsContent>
                <TabsContent value="upload" className="pt-4 space-y-4">
                   <div className="space-y-2">
                        <Label htmlFor="topic-upload">Topic (Optional)</Label>
                        <Input id="topic-upload" placeholder="e.g., The chapter's main idea" {...register("topic")} />
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
              
               <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="space-y-2">
                    <Label htmlFor="grade">Grade *</Label>
                    <Select onValueChange={(value) => setValue("grade", value)} defaultValue={formValues.grade}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {Array.from({length: 10}, (_, i) => `${i + 1}${i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'} Grade`).map(grade => (
                                <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Language *</Label>
                    <Select onValueChange={(value) => setValue("language", value)} defaultValue={formValues.language}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="English">English</SelectItem>
                            <SelectItem value="Hindi">Hindi</SelectItem>
                            <SelectItem value="Bengali">Bengali</SelectItem>
                            <SelectItem value="Tamil">Tamil</SelectItem>
                        </SelectContent>
                    </Select>
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
                Generate Worksheets
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      <div className="lg:sticky top-24 space-y-8">
        {isLoading && (
          <Card className="min-h-[400px] flex justify-center items-center">
             <div className="text-center space-y-2">
                <Spinner className="w-8 h-8 mx-auto" />
                <p>Generating worksheet...</p>
             </div>
          </Card>
        )}
        {output && (
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Generated Homework</CardTitle>
                        <Button variant="outline" size="sm" onClick={handleSaveToLibrary} disabled={isSaving}>
                            {isSaving ? <Spinner className="mr-2" /> : <Save className="mr-2" />}
                            Save to Library
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="worksheet" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="worksheet"><FileText className="mr-2" /> Worksheet</TabsTrigger>
                            <TabsTrigger value="answerKey"><Key className="mr-2" /> Answer Key</TabsTrigger>
                        </TabsList>
                        <TabsContent value="worksheet" className="pt-4">
                           <Textarea 
                                value={editedWorksheet}
                                onChange={(e) => setEditedWorksheet(e.target.value)}
                                className="min-h-96"
                            />
                        </TabsContent>
                        <TabsContent value="answerKey" className="pt-4">
                            <Textarea 
                                value={editedAnswerKey}
                                onChange={(e) => setEditedAnswerKey(e.target.value)}
                                className="min-h-96"
                            />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}
