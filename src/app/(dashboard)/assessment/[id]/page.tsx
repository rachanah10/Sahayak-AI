
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
import { ClipboardCheck, AlertCircle, CheckCircle, Clock, ArrowRight, Lightbulb } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { saveStudentAssessmentAction, getNextAdaptiveQuestionAction } from '@/app/actions';
import type { Question } from '@/ai/flows/generate-assessment-questions';
import type { AnsweredQuestion } from '@/ai/schemas/adaptive-assessment-schemas';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface AssessmentDetails {
  id: string;
  topic: string;
  grade: string;
  timer?: number;
  questions: Question[];
}

export default function TakeAssessmentPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [assessment, setAssessment] = useState<AssessmentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [answeredQuestions, setAnsweredQuestions] = useState<AnsweredQuestion[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [questionsToAsk, setQuestionsToAsk] = useState(0);
  
  const [isComplete, setIsComplete] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);

  const fetchAssessment = useCallback(async (assessmentId: string) => {
    setLoading(true);
    try {
      const docRef = doc(db, 'assessments', assessmentId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as AssessmentDetails;
        setAssessment(data);
        if (data.timer) {
          setTimeLeft(data.timer * 60);
        }
        setStartTime(Date.now());
        // Set total questions to 1/3 of the total, minimum 1
        const totalToAsk = Math.max(1, Math.floor(data.questions.length / 3));
        setQuestionsToAsk(totalToAsk);

        // Get the first question
        const res = await getNextAdaptiveQuestionAction({
            allQuestions: data.questions,
            answeredQuestions: [],
            questionsToAsk: totalToAsk,
        });
        if (res.nextQuestion) {
            setCurrentQuestion(res.nextQuestion);
        } else {
            // This case shouldn't happen on first load
            setIsComplete(true);
            setFinalScore(res.finalScore ?? 0);
        }

      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Assessment not found.' });
        router.push('/view-assessments');
      }
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load the assessment.' });
    } finally {
      setLoading(false);
    }
  }, [router, toast]);

  useEffect(() => {
    if (id && typeof id === 'string') {
      fetchAssessment(id);
    }
  }, [id, fetchAssessment]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || isComplete) return;
    const intervalId = setInterval(() => {
      setTimeLeft(prev => (prev ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(intervalId);
  }, [timeLeft, isComplete]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSaveAndNext = async () => {
    if (!currentQuestion || !assessment || isSubmitting) return;

    setIsSubmitting(true);
    
    // Simple case-insensitive and whitespace-trimmed comparison for correctness
    const isCorrect = currentAnswer.trim().toLowerCase() === currentQuestion.answer.trim().toLowerCase();
    
    const newAnsweredQuestion: AnsweredQuestion = {
        ...currentQuestion,
        studentAnswer: currentAnswer,
        isCorrect,
    };
    const updatedAnsweredQuestions = [...answeredQuestions, newAnsweredQuestion];
    setAnsweredQuestions(updatedAnsweredQuestions);

    try {
        const res = await getNextAdaptiveQuestionAction({
            allQuestions: assessment.questions,
            answeredQuestions: updatedAnsweredQuestions,
            questionsToAsk,
        });

        if (res.isComplete || !res.nextQuestion) {
            setIsComplete(true);
            setFinalScore(res.finalScore ?? 0);
            
            // Final save to database
            const timeTaken = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;
            if (user) {
              await saveStudentAssessmentAction({
                  studentId: user.uid,
                  assessmentId: id as string,
                  assessmentTopic: assessment.topic,
                  questionsAttempted: updatedAnsweredQuestions,
                  timeTaken,
                  adaptiveScore: res.finalScore ?? 0,
              });
            }

        } else {
            setCurrentQuestion(res.nextQuestion);
            setCurrentAnswer(""); // Reset answer field for next question
        }

    } catch (error) {
        console.error("Error getting next question:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not proceed to the next question."});
    } finally {
        setIsSubmitting(false);
    }
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spinner className="w-12 h-12" />
      </div>
    );
  }
  
   if (isComplete) {
    return (
        <div className="flex flex-col gap-8 items-center justify-center h-full text-center">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <div className="mx-auto bg-primary/20 rounded-full p-4 w-fit mb-4">
                        <CheckCircle className="w-16 h-16 text-primary" />
                    </div>
                    <CardTitle className="text-3xl">Assessment Complete!</CardTitle>
                    <CardDescription>Great job! Here is your result for the "{assessment?.topic}" assessment.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="text-6xl font-bold text-primary">{finalScore?.toFixed(1)}%</div>
                     <p className="text-muted-foreground">Your score is weighted based on question difficulty.</p>
                </CardContent>
                <CardFooter>
                    <Button onClick={() => router.push('/view-assessments')} className="w-full">
                        Back to Assessments
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
  }

  if (!assessment || !currentQuestion) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Assessment Not Found</AlertTitle>
        <AlertDescription>
          The assessment you are looking for does not exist or could not be loaded.
        </AlertDescription>
      </Alert>
    );
  }

  const progress = (answeredQuestions.length / questionsToAsk) * 100;

  return (
    <div className="flex flex-col gap-8 max-w-3xl mx-auto">
      <PageHeader
        title={assessment.topic}
        description={`Grade: ${assessment.grade}`}
        Icon={ClipboardCheck}
      />
      <Card>
          <CardHeader>
            <div className="flex justify-between items-center mb-2">
                <CardTitle>Question {answeredQuestions.length + 1} of {questionsToAsk}</CardTitle>
                 {timeLeft !== null && (
                  <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                    <Clock className="w-6 h-6" />
                    <span>{formatTime(timeLeft)}</span>
                  </div>
                )}
            </div>
            <Progress value={progress} />
          </CardHeader>
          <CardContent className="space-y-6">
              <div className="p-4 border rounded-lg space-y-3 bg-muted/20 min-h-[250px]">
                <div className="flex justify-between items-center">
                    <p className="text-lg font-semibold">{currentQuestion.text}</p>
                    <Badge variant="outline">Difficulty: {currentQuestion.difficulty}/5</Badge>
                </div>
                <Textarea
                  id={`answer`}
                  placeholder="Your answer..."
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  className="bg-background min-h-[150px]"
                />
              </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button onClick={handleSaveAndNext} disabled={isSubmitting || !currentAnswer}>
              {isSubmitting ? <Spinner className="mr-2" /> : null}
              {answeredQuestions.length + 1 === questionsToAsk ? 'Finish & See Score' : 'Save & Next'}
              <ArrowRight className="ml-2" />
            </Button>
          </CardFooter>
        </Card>
    </div>
  );
}
