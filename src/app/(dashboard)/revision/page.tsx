
"use client";

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { generateRevisionQuestionsAction, gradeAnswerAction, saveStudentAssessmentAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { BookCheck, ArrowRight, CheckCircle, XCircle } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { collection, query, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Question } from "@/ai/flows/generate-assessment-questions";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { AnsweredQuestion } from "@/ai/schemas/adaptive-assessment-schemas";

const schema = z.object({
  topic: z.string().min(1, "Please select a topic."),
  numQuestions: z.coerce.number().min(1, "At least 1 question is required.").max(20, "Maximum 20 questions."),
  questionType: z.enum(['Multiple Choice', 'Fill in the Blanks', 'Short Answer', 'Mix']),
});

type FormFields = z.infer<typeof schema>;

interface GradedAnswer extends Question {
    studentAnswer: string;
    isCorrect: boolean;
}

export default function RevisionPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [studentAnswers, setStudentAnswers] = useState<Record<string, string>>({});
  const [gradedAnswers, setGradedAnswers] = useState<GradedAnswer[] | null>(null);

  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormFields>({
    resolver: zodResolver(schema),
    defaultValues: {
      numQuestions: 5,
      questionType: "Mix",
    },
  });
  
  const formValues = watch();

  useEffect(() => {
    async function fetchTopics() {
      if (!user) return;
      try {
        const q = query(
          collection(db, `student-assessments/${user.uid}/assessments`)
        );
        const querySnapshot = await getDocs(q);
        const topics = new Set<string>();
        querySnapshot.forEach(doc => {
            const data = doc.data();
            if (data.topic) {
                topics.add(data.topic);
            }
        });
        setAvailableTopics(Array.from(topics));
      } catch (error) {
        console.error("Error fetching available topics: ", error);
      }
    }
    fetchTopics();
  }, [user]);

  const onSubmit: SubmitHandler<FormFields> = async (data) => {
    if (!user) {
        toast({ variant: "destructive", title: "Error", description: "You must be logged in." });
        return;
    }
    setIsLoading(true);
    setQuestions(null);
    setGradedAnswers(null);
    setStudentAnswers({});
    try {
      const result = await generateRevisionQuestionsAction({
          ...data,
          studentId: user.uid
      });
      setQuestions(result.questions);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate revision questions. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (questionNo: string, answer: string) => {
    setStudentAnswers(prev => ({ ...prev, [questionNo]: answer }));
  };

  const handleSubmitAnswers = async () => {
    if (!questions || !user) return;
    setIsSubmitting(true);
    
    try {
        const graded: GradedAnswer[] = [];
        for (const q of questions) {
            const studentAnswer = studentAnswers[q.no] || "";
            const result = await gradeAnswerAction({
                questionText: q.text,
                correctAnswer: q.answer,
                studentAnswer: studentAnswer,
            });
            graded.push({ ...q, studentAnswer, isCorrect: result.isCorrect });
        }
        setGradedAnswers(graded);

        // Save the revision attempt
        const correctCount = graded.filter(a => a.isCorrect).length;
        const score = (correctCount / questions.length) * 100;

        await saveStudentAssessmentAction({
            studentId: user.uid,
            assessmentId: `revision-${Date.now()}`,
            assessmentTopic: formValues.topic,
            timeTaken: 0, // Not tracking time for revisions yet
            adaptiveScore: score,
            questionsAttempted: graded.map(g => ({
                ...g,
            })),
        });

        toast({ title: "Revision Submitted!", description: "Your progress has been saved." });

    } catch (error) {
        console.error(error);
        toast({ variant: "destructive", title: "Error", description: "Could not submit your answers." });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <div className="flex flex-col gap-8">
        <PageHeader
          title="Revision Module"
          description="Practice topics where you need to improve. The AI will generate questions based on your past performance."
          Icon={BookCheck}
        />
        <Card>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Revision Setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="topic">Topic *</Label>
                <Select onValueChange={(value) => setValue("topic", value)}>
                    <SelectTrigger><SelectValue placeholder="Select a topic to revise..." /></SelectTrigger>
                    <SelectContent>
                        {availableTopics.length > 0 ? availableTopics.map(topic => (
                            <SelectItem key={topic} value={topic}>{topic}</SelectItem>
                        )) : (
                            <div className="p-4 text-center text-sm text-muted-foreground">No topics with past attempts found.</div>
                        )}
                    </SelectContent>
                </Select>
                {errors.topic && <p className="text-sm text-destructive">{errors.topic.message}</p>}
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
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Spinner className="mr-2" />}
                {gradedAnswers ? "Start New Revision" : "Generate Questions"}
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
                    <p className="text-muted-foreground">Generating your personalized questions...</p>
                </div>
            </Card>
        )}
        {questions && !gradedAnswers && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Revision Sheet</CardTitle>
                <CardDescription>Topic: {formValues.topic}</CardDescription>
              </div>
               <Button onClick={handleSubmitAnswers} disabled={isSubmitting}>
                 {isSubmitting ? <Spinner className="mr-2" /> : null}
                 Submit Answers <ArrowRight className="ml-2" />
               </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
                {questions.map((q, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                        <Label htmlFor={`q-text-${index}`} className="font-semibold">Question {index + 1}</Label>
                        <Badge variant="secondary">Difficulty: {q.difficulty}/5</Badge>
                    </div>
                    <p>{q.text}</p>
                    <Textarea
                        id={`q-ans-${index}`}
                        placeholder="Your answer..."
                        className="text-base bg-background"
                        value={studentAnswers[q.no] || ""}
                        onChange={(e) => handleAnswerChange(q.no, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
         {gradedAnswers && (
             <Card>
                <CardHeader>
                    <CardTitle>Answer Key</CardTitle>
                    <CardDescription>Review your answers below. This has been saved to your progress.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
                        {gradedAnswers.map((q, index) => (
                            <div key={index} className="p-4 border rounded-lg space-y-3">
                                <p className="font-semibold">{index+1}. {q.text}</p>
                                <div className={cn("text-sm p-2 rounded-md flex items-start gap-2", q.isCorrect ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50')}>
                                    {q.isCorrect ? <CheckCircle className="text-green-600 mt-0.5 h-4 w-4" /> : <XCircle className="text-red-600 mt-0.5 h-4 w-4" />}
                                    <div>
                                        <span className="font-bold">Your Answer: </span> {q.studentAnswer || <span className="italic">No answer provided</span>}
                                    </div>
                                </div>
                                {!q.isCorrect && (
                                     <div className="text-sm p-2 rounded-md bg-blue-100 dark:bg-blue-900/50">
                                         <span className="font-bold">Correct Answer: </span> {q.answer}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
         )}
         {!isLoading && !questions && !gradedAnswers && (
            <Card className="min-h-[400px] flex justify-center items-center">
                <div className="text-center space-y-2">
                    <p className="text-muted-foreground">Your questions will appear here.</p>
                </div>
            </Card>
        )}
      </div>
    </div>
  );
}
