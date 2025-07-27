
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ClipboardCheck, AlertCircle, CheckCircle, Clock, ArrowRight, XCircle, Lightbulb } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { saveStudentAssessmentAction, getNextAdaptiveQuestionAction, gradeAnswerAction } from '@/app/actions';
import type { Question } from '@/ai/flows/generate-assessment-questions';
import type { AnsweredQuestion } from '@/ai/schemas/adaptive-assessment-schemas';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type AssessmentStatus = "loading" | "in-progress" | "showing-feedback" | "complete" | "error";

interface AssessmentDetails {
  id: string;
  topic: string;
  grade: string;
  timer?: number;
  questions: Question[];
}

interface LastAnswerResult {
    isCorrect: boolean;
    correctAnswer: string;
    studentAnswer: string;
}

export default function TakeAssessmentPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [status, setStatus] = useState<AssessmentStatus>("loading");
  const [assessment, setAssessment] = useState<AssessmentDetails | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [answeredQuestions, setAnsweredQuestions] = useState<AnsweredQuestion[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [questionsToAsk, setQuestionsToAsk] = useState(0);
  
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [lastAnswerResult, setLastAnswerResult] = useState<LastAnswerResult | null>(null);

  const fetchAssessment = useCallback(async (assessmentId: string) => {
    setStatus("loading");
    try {
      const docRef = doc(db, 'assessments', assessmentId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as any;
        setAssessment({ ...data, id: docSnap.id });
        if (data.timer) setTimeLeft(data.timer * 60);
        setStartTime(Date.now());
        
        const totalToAsk = Math.max(1, Math.floor(data.questions.length / 3));
        setQuestionsToAsk(totalToAsk);

        const res = await getNextAdaptiveQuestionAction({ allQuestions: data.questions, answeredQuestions: [], questionsToAsk: totalToAsk });
        if (res.nextQuestion) {
            setCurrentQuestion(res.nextQuestion);
            setStatus("in-progress");
        } else {
            setStatus("complete");
            setFinalScore(res.finalScore ?? 0);
        }
      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Assessment not found.' });
        router.push('/view-assessments');
        setStatus("error");
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load the assessment.' });
      setStatus("error");
    }
  }, [router, toast]);

  useEffect(() => {
    if (id && typeof id === 'string') {
      fetchAssessment(id);
    }
  }, [id, fetchAssessment]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || status !== 'in-progress') return;
    const intervalId = setInterval(() => {
      setTimeLeft(prev => (prev ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(intervalId);
  }, [timeLeft, status]);
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSubmit = async () => {
    if (!currentQuestion || !assessment || isSubmitting) return;
    setIsSubmitting(true);
    
    try {
        const gradingResult = await gradeAnswerAction({
            questionText: currentQuestion.text,
            correctAnswer: currentQuestion.answer,
            studentAnswer: currentAnswer
        });

        const newAnsweredQuestion: AnsweredQuestion = {
            ...currentQuestion,
            studentAnswer: currentAnswer,
            isCorrect: gradingResult.isCorrect,
        };
        
        setLastAnswerResult({
            isCorrect: gradingResult.isCorrect,
            correctAnswer: currentQuestion.answer,
            studentAnswer: currentAnswer
        });
        setAnsweredQuestions(prev => [...prev, newAnsweredQuestion]);
        setStatus("showing-feedback");

    } catch (error) {
        console.error("Error during answer submission:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not grade your answer. Please try again."});
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleNextQuestion = async () => {
    if (!assessment) return;
    setIsSubmitting(true);
    setCurrentAnswer("");
    setLastAnswerResult(null);

    try {
        const res = await getNextAdaptiveQuestionAction({
            allQuestions: assessment.questions,
            answeredQuestions: answeredQuestions,
            questionsToAsk,
        });

        if (res.isComplete || !res.nextQuestion) {
            setStatus("complete");
            setFinalScore(res.finalScore ?? 0);
            
            const timeTaken = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;
            if (user) {
              await saveStudentAssessmentAction({
                  studentId: user.uid,
                  assessmentId: id as string,
                  assessmentTopic: assessment.topic,
                  questionsAttempted: answeredQuestions,
                  timeTaken,
                  adaptiveScore: res.finalScore ?? 0,
              });
            }
        } else {
            setCurrentQuestion(res.nextQuestion);
            setStatus("in-progress");
        }
    } catch (error) {
         console.error("Error fetching next question:", error);
         toast({ variant: "destructive", title: "Error", description: "An error occurred. Please try again."});
    } finally {
        setIsSubmitting(false);
    }
  };

  if (status === 'loading') {
    return <div className="flex justify-center items-center h-full"><Spinner className="w-12 h-12" /></div>;
  }
  
  if (status === 'complete') {
    return (
        <div className="flex flex-col gap-8 items-center justify-center h-full text-center">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <div className="mx-auto bg-primary/20 rounded-full p-4 w-fit mb-4"><CheckCircle className="w-16 h-16 text-primary" /></div>
                    <CardTitle className="text-3xl">Assessment Complete!</CardTitle>
                    <CardDescription>Great job! Here is your result for the "{assessment?.topic}" assessment.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="text-6xl font-bold text-primary">{finalScore?.toFixed(1)}%</div>
                     <p className="text-muted-foreground">Your score is weighted based on question difficulty.</p>
                </CardContent>
                <CardFooter>
                    <Button onClick={() => router.push('/view-assessments')} className="w-full">Back to Assessments</Button>
                </CardFooter>
            </Card>
        </div>
    );
  }

  if (status === 'error' || !assessment || !currentQuestion) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Assessment Error</AlertTitle>
        <AlertDescription>The assessment could not be loaded. Please go back and try again.</AlertDescription>
      </Alert>
    );
  }

  const progress = (answeredQuestions.length / questionsToAsk) * 100;
  const isMcq = currentQuestion.questionType === 'Multiple Choice' && currentQuestion.options && currentQuestion.options.length > 0;

  return (
    <div className="flex flex-col gap-8 max-w-3xl mx-auto">
      <PageHeader title={assessment.topic} description={`Grade: ${assessment.grade}`} Icon={ClipboardCheck} />
      <Card>
          <CardHeader>
            <div className="flex justify-between items-center mb-2">
                <CardTitle>Question {answeredQuestions.length + 1} of {questionsToAsk}</CardTitle>
                 {timeLeft !== null && (
                  <div className="flex items-center gap-2 text-lg font-semibold text-primary"><Clock className="w-6 h-6" /><span>{formatTime(timeLeft)}</span></div>
                )}
            </div>
            <Progress value={progress} />
          </CardHeader>
          <CardContent className="space-y-6">
              <div className="p-4 border rounded-lg space-y-3 bg-muted/20 min-h-[250px]">
                <div className="flex justify-between items-start">
                    <p className="text-lg font-semibold flex-1">{currentQuestion.text}</p>
                    <Badge variant="outline">Difficulty: {currentQuestion.difficulty}/5</Badge>
                </div>
                {isMcq ? (
                    <RadioGroup value={currentAnswer} onValueChange={setCurrentAnswer} className="space-y-2 pt-2">
                        {currentQuestion.options?.map((option, index) => (
                            <div key={index} className="flex items-center space-x-2 p-3 rounded-md bg-background border has-[:checked]:border-primary">
                                <RadioGroupItem value={option} id={`option-${index}`} />
                                <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">{option}</Label>
                            </div>
                        ))}
                    </RadioGroup>
                ) : (
                    <Textarea id={`answer`} placeholder="Your answer..." value={currentAnswer} onChange={(e) => setCurrentAnswer(e.target.value)} className="bg-background min-h-[150px]" />
                )}
              </div>
              {lastAnswerResult && status === 'showing-feedback' && (
                <Card className={cn("p-4", lastAnswerResult.isCorrect ? "bg-green-100 dark:bg-green-900/50" : "bg-red-100 dark:bg-red-900/50")}>
                  <CardHeader className="p-0 flex flex-row items-center gap-2">
                    {lastAnswerResult.isCorrect ? <CheckCircle className="text-green-600" /> : <XCircle className="text-red-600" />}
                    <CardTitle className="text-xl">{lastAnswerResult.isCorrect ? "Correct!" : "Not Quite"}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 pt-2 text-sm">
                    {!lastAnswerResult.isCorrect && (
                        <div className="p-2 mt-2 rounded-md bg-muted flex items-start gap-2">
                            <Lightbulb className="text-yellow-500 mt-0.5" />
                            <div><span className="font-bold">Correct Answer: </span> {lastAnswerResult.correctAnswer}</div>
                        </div>
                    )}
                  </CardContent>
                </Card>
              )}
          </CardContent>
          <CardFooter className="flex justify-end">
            {status === 'in-progress' && (
                <Button onClick={handleAnswerSubmit} disabled={isSubmitting || !currentAnswer}>
                {isSubmitting ? <Spinner className="mr-2" /> : null}
                Submit Answer
                <ArrowRight className="ml-2" />
                </Button>
            )}
            {status === 'showing-feedback' && (
                 <Button onClick={handleNextQuestion} disabled={isSubmitting}>
                    {isSubmitting ? <Spinner className="mr-2" /> : null}
                    {answeredQuestions.length === questionsToAsk ? 'Finish & See Score' : 'Next Question'}
                    <ArrowRight className="ml-2" />
                </Button>
            )}
          </CardFooter>
        </Card>
    </div>
  );
}
