"use client";

import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { generateAssessmentQuestionsAction, saveAssessmentAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { ClipboardCheck, CalendarIcon, Key, FileText, CheckCircle, Save } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type { GenerateAssessmentQuestionsOutput, GenerateAssessmentQuestionsInput } from "@/ai/flows/generate-assessment-questions";

const schema = z.object({
  subject: z.string().min(2, "Please enter a subject."),
  topic: z.string().min(3, "Please enter a topic/chapter."),
  grade: z.string().min(1, "Please select a grade."),
  numQuestions: z.coerce.number().min(1, "At least 1 question is required.").max(20, "Maximum 20 questions."),
  questionType: z.enum(['Multiple Choice', 'Fill in the Blanks', 'Short Answer', 'Mix']),
  timer: z.coerce.number().optional(),
  deadline: z.date().optional(),
});

type FormFields = z.infer<typeof schema>;

export default function AssessmentGeneratorPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [assessment, setAssessment] = useState<GenerateAssessmentQuestionsOutput | null>(null);
  const [isPublished, setIsPublished] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormFields>({
    resolver: zodResolver(schema),
    defaultValues: {
      numQuestions: 5,
      questionType: "Mix",
      grade: "4th Grade"
    },
  });

  const formValues = watch();

  const onSubmit: SubmitHandler<FormFields> = async (data) => {
    setIsLoading(true);
    setAssessment(null);
    setIsPublished(false);
    try {
      const payload: GenerateAssessmentQuestionsInput = {
        ...data,
        deadline: data.deadline ? format(data.deadline, "PPP") : undefined,
      };
      const result = await generateAssessmentQuestionsAction(payload);
      setAssessment(result);
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
  
  const handlePublish = () => {
    setIsPublished(true);
    toast({
        title: "Test Published!",
        description: "The assessment is now available for students."
    })
  }
  
  const handleSave = async () => {
    if(!assessment) return;
    setIsSaving(true);
    try {
        await saveAssessmentAction({
            ...formValues,
            deadline: formValues.deadline ? format(formValues.deadline, "PPP") : undefined,
            testContent: assessment.testContent,
            answerKey: assessment.answerKey
        })
        toast({
            title: "Test Saved!",
            description: "The assessment has been saved to your library."
        })
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
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input id="subject" placeholder="e.g., Science" {...register("subject")} />
                    {errors.subject && <p className="text-sm text-destructive">{errors.subject.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="topic">Topic/Chapter *</Label>
                    <Input id="topic" placeholder="e.g., The Solar System" {...register("topic")} />
                    {errors.topic && <p className="text-sm text-destructive">{errors.topic.message}</p>}
                </div>
              </div>

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
                    {errors.grade && <p className="text-sm text-destructive">{errors.grade.message}</p>}
                </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="numQuestions">Number of Questions *</Label>
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
                            onSelect={(date) => setValue("deadline", date)}
                            initialFocus
                            />
                        </PopoverContent>
                        </Popover>
                    </div>
               </div>

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
        {assessment && (
            <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Generated Assessment</CardTitle>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving}>
                            {isSaving ? <Spinner className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                            Save
                        </Button>
                        <Button size="sm" onClick={handlePublish} disabled={isPublished}>
                            {isPublished ? <CheckCircle className="mr-2 h-4 w-4" /> : null}
                            {isPublished ? 'Published' : 'Publish'}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="test">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="test"><FileText className="mr-2 h-4 w-4" /> Test</TabsTrigger>
                            <TabsTrigger value="key"><Key className="mr-2 h-4 w-4"/>Answer Key</TabsTrigger>
                        </TabsList>
                        <TabsContent value="test">
                            <div className="p-4 border rounded-b-md prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                                {assessment.testContent}
                            </div>
                        </TabsContent>
                         <TabsContent value="key">
                            <div className="p-4 border rounded-b-md prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                                {assessment.answerKey}
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
            </>
        )}
      </div>
    </div>
  );
}
