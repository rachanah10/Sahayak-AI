
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
import { ClipboardCheck, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useForm, useFieldArray, type SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { saveStudentAssessmentAction } from '@/app/actions';
import { type Question } from '@/ai/flows/generate-assessment-questions';

interface AssessmentDetails extends Question {
  id: string;
  topic: string;
  grade: string;
  timer?: number;
  questions: Question[];
}

const formSchema = z.object({
  answers: z.array(z.object({
    questionId: z.string(),
    answer: z.string().min(1, "Please provide an answer."),
  }))
});

type FormFields = z.infer<typeof formSchema>;

export default function TakeAssessmentPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [assessment, setAssessment] = useState<AssessmentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const { register, control, handleSubmit, formState: { errors } } = useForm<FormFields>({
    resolver: zodResolver(formSchema),
    defaultValues: { answers: [] }
  });

  const { fields } = useFieldArray({ control, name: "answers" });

  useEffect(() => {
    if (id && typeof id === 'string') {
      const fetchAssessment = async () => {
        setLoading(true);
        try {
          const docRef = doc(db, 'assessments', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data() as AssessmentDetails;
            setAssessment(data);
            if (data.timer) {
              setTimeLeft(data.timer * 60);
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
      };
      fetchAssessment();
    }
  }, [id, router, toast]);

  useEffect(() => {
    if (assessment && !fields.length) {
      // Initialize form fields
      setValue('answers', assessment.questions.map((q, index) => ({
        questionId: q.no || index.toString(),
        answer: '',
      })));
    }
  }, [assessment, fields, setValue]);


  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;

    const intervalId = setInterval(() => {
      setTimeLeft(prev => (prev ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const onSubmit: SubmitHandler<FormFields> = async (data) => {
    if (!user || !assessment) return;
    setSubmitting(true);
    try {
        await saveStudentAssessmentAction({
            studentId: user.uid,
            assessmentId: id as string,
            assessmentTopic: assessment.topic,
            submittedAnswers: data.answers.map((a, index) => ({
                ...a,
                question: assessment.questions[index].text,
                correctAnswer: assessment.questions[index].answer,
                difficulty: assessment.questions[index].difficulty,
                tags: assessment.questions[index].tags,
            })),
            timeTaken: assessment.timer ? (assessment.timer * 60) - (timeLeft ?? 0) : 0,
        });

        toast({
            title: "Assessment Submitted!",
            description: "Your answers have been saved successfully.",
            variant: "default",
        });
        router.push('/view-assessments');

    } catch (error) {
        console.error("Submission error:", error);
        toast({
            variant: "destructive",
            title: "Submission Failed",
            description: "There was an error submitting your assessment. Please try again."
        });
    } finally {
        setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spinner className="w-12 h-12" />
      </div>
    );
  }

  if (!assessment) {
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

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={assessment.topic}
        description={`Grade: ${assessment.grade} | Total Questions: ${assessment.questions.length}`}
        Icon={ClipboardCheck}
      />
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle>Questions</CardTitle>
            {timeLeft !== null && (
              <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                <Clock className="w-6 h-6" />
                <span>{formatTime(timeLeft)}</span>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {assessment.questions.map((q, index) => (
              <div key={fields[index]?.id || index} className="p-4 border rounded-lg space-y-3 bg-muted/20">
                <Label htmlFor={`answer-${index}`} className="font-semibold text-base flex justify-between">
                  <span>Question {index + 1}</span>
                  <Badge variant="outline">Difficulty: {q.difficulty}/5</Badge>
                </Label>
                <p>{q.text}</p>
                <Textarea
                  id={`answer-${index}`}
                  placeholder="Your answer..."
                  {...register(`answers.${index}.answer`)}
                  className="bg-background"
                />
                {errors.answers?.[index]?.answer && (
                    <p className="text-sm text-destructive">{errors.answers[index]?.answer?.message}</p>
                )}
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Spinner className="mr-2" /> : <CheckCircle className="mr-2" />}
              Submit Assessment
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
