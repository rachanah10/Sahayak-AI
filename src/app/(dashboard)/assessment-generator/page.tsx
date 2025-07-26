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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { generateAssessmentQuestionsAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { ClipboardCheck } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import type { GenerateAssessmentQuestionsOutput, GenerateAssessmentQuestionsInput } from "@/ai/flows/generate-assessment-questions";

const schema = z.object({
  topic: z.string().min(3, "Please enter a topic."),
  lessonPlan: z.string().optional(),
  numQuestions: z.coerce.number().min(1, "At least 1 question is required.").max(10, "Maximum 10 questions."),
  type: z.enum(["oral", "written", "both"]),
});

type FormFields = z.infer<typeof schema>;

export default function AssessmentGeneratorPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState<GenerateAssessmentQuestionsOutput | null>(null);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormFields>({
    resolver: zodResolver(schema),
    defaultValues: {
      numQuestions: 5,
      type: "both",
    },
  });

  const onSubmit: SubmitHandler<FormFields> = async (data) => {
    setIsLoading(true);
    setQuestions(null);
    try {
      const result = await generateAssessmentQuestionsAction(data as GenerateAssessmentQuestionsInput);
      setQuestions(result);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate questions. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <div className="flex flex-col gap-8">
        <PageHeader
          title="Assessment Generator"
          description="Generate on-demand oral and written questions for any topic or lesson plan."
          Icon={ClipboardCheck}
        />
        <Card>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Assessment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="topic">Topic *</Label>
                <Input id="topic" placeholder="e.g., The Solar System" {...register("topic")} />
                {errors.topic && <p className="text-sm text-destructive">{errors.topic.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lessonPlan">Lesson Plan (Optional)</Label>
                <Textarea id="lessonPlan" placeholder="Paste an optional lesson plan for context..." {...register("lessonPlan")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numQuestions">Number of Questions *</Label>
                <Input id="numQuestions" type="number" {...register("numQuestions")} />
                {errors.numQuestions && <p className="text-sm text-destructive">{errors.numQuestions.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Type of Questions *</Label>
                <RadioGroup {...register("type")} defaultValue="both" className="flex gap-4 pt-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="oral" id="oral" />
                    <Label htmlFor="oral">Oral</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="written" id="written" />
                    <Label htmlFor="written">Written</Label>
                  </div>
                   <div className="flex items-center space-x-2">
                    <RadioGroupItem value="both" id="both" />
                    <Label htmlFor="both">Both</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Spinner className="mr-2" />}
                Generate Questions
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      <div className="lg:sticky top-24 space-y-8">
        {isLoading && (
            <Card className="min-h-[400px] flex justify-center items-center">
                <Spinner className="w-8 h-8" />
            </Card>
        )}
        {questions?.oralQuestions && questions.oralQuestions.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Oral Questions</CardTitle></CardHeader>
            <CardContent>
              <ul className="list-decimal list-inside space-y-2">
                {questions.oralQuestions.map((q, i) => <li key={i}>{q}</li>)}
              </ul>
            </CardContent>
          </Card>
        )}
        {questions?.writtenQuestions && questions.writtenQuestions.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Written Questions</CardTitle></CardHeader>
            <CardContent>
              <ul className="list-decimal list-inside space-y-2">
                {questions.writtenQuestions.map((q, i) => <li key={i}>{q}</li>)}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
