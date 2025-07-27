
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { createWeeklyLessonPlanAction, suggestLessonPlanTagsAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { CalendarDays, Lightbulb, Edit, CheckCircle } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import type { CreateWeeklyLessonPlanInput } from "@/ai/flows/create-weekly-lesson-plan";
import { DateRange } from "react-day-picker";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";

const grades = Array.from({ length: 10 }, (_, i) => `${i + 1}${i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'} Grade`);

const schema = z.object({
  grades: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one grade.",
  }),
  dateRange: z.object({
    from: z.date().optional(),
    to: z.date().optional(),
  }).refine(data => !!data.from && !!data.to, {
    message: "Please select a start and end date.",
  }),
  syllabus: z.string().min(10, "Syllabus must be at least 10 characters."),
});

type FormFields = z.infer<typeof schema>;

export default function LessonPlannerPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [lessonPlan, setLessonPlan] = useState("");
  const [isPlanFinalized, setIsPlanFinalized] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<FormFields>({
    resolver: zodResolver(schema),
    defaultValues: {
      grades: [],
      dateRange: { from: undefined, to: undefined }
    }
  });

  const formValues = watch();

  const onSubmit: SubmitHandler<FormFields> = async (data) => {
    setIsLoading(true);
    setLessonPlan("");
    setIsPlanFinalized(false);
    try {
      const payload: CreateWeeklyLessonPlanInput = {
        ...data,
        // @ts-ignore - Zod refinement ensures `from` and `to` exist
        dateRange: { from: format(data.dateRange.from, 'yyyy-MM-dd'), to: format(data.dateRange.to, 'yyyy-MM-dd') },
        tags: Array.from(selectedTags),
      };
      const result = await createWeeklyLessonPlanAction(payload);
      setLessonPlan(result.lessonPlan);
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

  const handleSuggestTags = async () => {
    setIsSuggesting(true);
    setSuggestedTags([]);
    try {
      const { syllabus, grades, dateRange } = getValues();
       if (!syllabus || grades.length === 0 || !dateRange.from || !dateRange.to) {
         toast({
            variant: "destructive",
            title: "Missing Information",
            description: "Please fill out all fields to get suggestions.",
         });
        return;
      }
      const result = await suggestLessonPlanTagsAction({
        syllabus,
        grades,
        dateRange: { from: format(dateRange.from, 'yyyy-MM-dd'), to: format(dateRange.to, 'yyyy-MM-dd') }
      });
      setSuggestedTags(result.suggestedTags);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to suggest tags. Please try again.",
      });
    } finally {
      setIsSuggesting(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => {
        const newSet = new Set(prev);
        if (newSet.has(tag)) newSet.delete(tag);
        else newSet.add(tag);
        return newSet;
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-1 flex flex-col gap-8">
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
              {/* Grades */}
              <div className="space-y-2">
                <Label>Grades</Label>
                <div className="grid grid-cols-3 gap-2 p-2 border rounded-md">
                  {grades.map((item) => (
                    <div key={item} className="flex items-center space-x-2">
                      <Checkbox
                        id={item}
                        checked={formValues.grades.includes(item)}
                        onCheckedChange={(checked) => {
                          const currentGrades = formValues.grades;
                          const newGrades = checked
                            ? [...currentGrades, item]
                            : currentGrades.filter((value) => value !== item);
                          setValue("grades", newGrades);
                        }}
                      />
                      <Label htmlFor={item} className="text-sm font-normal">{item}</Label>
                    </div>
                  ))}
                </div>
                {errors.grades && <p className="text-sm text-destructive">{errors.grades.message}</p>}
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <Label>Date Range</Label>
                <Calendar
                  mode="range"
                  selected={formValues.dateRange as DateRange}
                  onSelect={(range) => setValue("dateRange", range || { from: undefined, to: undefined })}
                  disabled={{ dayOfWeek: [0, 6] }}
                  className="rounded-md border p-0"
                />
                 {errors.dateRange && <p className="text-sm text-destructive">{errors.dateRange.message}</p>}
              </div>

              {/* Syllabus */}
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

               {/* Smart Assistant */}
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
                Create Plan
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      <div className="lg:col-span-2 lg:sticky top-24">
        <Card className="min-h-[600px]">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Generated Lesson Plan</CardTitle>
                    {lessonPlan && (
                       isPlanFinalized ? (
                         <Button variant="outline" size="sm" onClick={() => setIsPlanFinalized(false)}>
                            <Edit className="mr-2" />
                            Edit Plan
                        </Button>
                       ) : (
                        <Button variant="default" size="sm" onClick={() => setIsPlanFinalized(true)}>
                            <CheckCircle className="mr-2" />
                            Finalize Plan
                        </Button>
                       )
                    )}
                </div>
                <CardDescription>Review and edit the generated plan below. You can view saved plans in the main Calendar page.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading && (
                    <div className="flex justify-center items-center h-96">
                        <Spinner className="w-8 h-8" />
                    </div>
                )}
                {!isLoading && lessonPlan && (
                    isPlanFinalized ? (
                        <div className="p-4 border rounded-md prose prose-sm dark:prose-invert max-w-none min-h-96">
                           <ReactMarkdown>{lessonPlan}</ReactMarkdown>
                        </div>
                    ) : (
                        <Textarea
                            value={lessonPlan}
                            onChange={(e) => setLessonPlan(e.target.value)}
                            placeholder="Your generated lesson plan will appear here..."
                            className="min-h-96"
                        />
                    )
                )}
                 {!isLoading && !lessonPlan && (
                    <div className="flex justify-center items-center h-96 text-muted-foreground">
                        <p>Your generated lesson plan will appear here.</p>
                    </div>
                 )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
