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
import { createWeeklyLessonPlanAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { CalendarDays } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import type { CreateWeeklyLessonPlanInput } from "@/ai/flows/create-weekly-lesson-plan";

const schema = z.object({
  gradeLevel: z.string().min(1, "Please enter a grade level."),
  availableTime: z.string().min(1, "Please enter available time."),
  syllabus: z.string().min(10, "Syllabus must be at least 10 characters."),
});

type FormFields = z.infer<typeof schema>;

export default function LessonPlannerPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [lessonPlan, setLessonPlan] = useState("");
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormFields>({
    resolver: zodResolver(schema),
  });

  const onSubmit: SubmitHandler<FormFields> = async (data) => {
    setIsLoading(true);
    setLessonPlan("");
    try {
      const result = await createWeeklyLessonPlanAction(data);
      setLessonPlan(result.weeklyLessonPlan);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate lesson plan. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <div className="flex flex-col gap-8">
        <PageHeader
          title="Lesson Planner"
          description="Generate a weekly lesson plan based on grade, time, and syllabus."
          Icon={CalendarDays}
        />
        <Card>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Lesson Plan Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gradeLevel">Grade Level</Label>
                <Input id="gradeLevel" placeholder="e.g., Class 4" {...register("gradeLevel")} />
                {errors.gradeLevel && <p className="text-sm text-destructive">{errors.gradeLevel.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="availableTime">Available Time (per week)</Label>
                <Input id="availableTime" placeholder="e.g., 5 hours" {...register("availableTime")} />
                {errors.availableTime && <p className="text-sm text-destructive">{errors.availableTime.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="syllabus">Syllabus / Topics to Cover</Label>
                <Textarea
                  id="syllabus"
                  placeholder="e.g., Chapter 1: Living and Non-living things, Chapter 2: Plant Life..."
                  {...register("syllabus")}
                  className="min-h-24"
                />
                {errors.syllabus && <p className="text-sm text-destructive">{errors.syllabus.message}</p>}
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Spinner className="mr-2" />}
                Create Plan
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      <div className="lg:sticky top-24">
        <Card className="min-h-[400px]">
          <CardHeader>
            <CardTitle>Generated Weekly Lesson Plan</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert whitespace-pre-wrap">
            {isLoading && (
              <div className="flex justify-center items-center h-40">
                <Spinner className="w-8 h-8" />
              </div>
            )}
            {lessonPlan}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
