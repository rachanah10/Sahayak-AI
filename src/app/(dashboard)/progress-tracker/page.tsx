"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { suggestFollowUpContentAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { Users } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { Student } from "@/lib/types";
import type { SuggestFollowUpContentInput } from "@/ai/flows/suggest-follow-up-content";

const mockStudents: Student[] = [
  { id: 1, name: "Aarav Sharma", skillLevel: "Beginner", topic: "Reading", performance: "" },
  { id: 2, name: "Priya Patel", skillLevel: "Intermediate", topic: "Math", performance: "" },
  { id: 3, name: "Rohan Das", skillLevel: "Advanced", topic: "Science", performance: "" },
  { id: 4, name: "Sanya Gupta", skillLevel: "Beginner", topic: "Writing", performance: "" },
];

const schema = z.object({
  studentId: z.string().min(1, "Please select a student."),
  weeklyPerformance: z.string().min(10, "Please enter performance details."),
});

type FormFields = z.infer<typeof schema>;

interface Report {
  studentName: string;
  suggestedContent: string;
  draftReport: string;
}

export default function ProgressTrackerPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormFields>({
    resolver: zodResolver(schema),
  });

  const studentId = watch("studentId");

  const handleStudentChange = (id: string) => {
    setValue("studentId", id);
    const student = mockStudents.find((s) => s.id.toString() === id);
    setSelectedStudent(student || null);
    setReport(null);
  };

  const onSubmit: SubmitHandler<FormFields> = async (data) => {
    if (!selectedStudent) return;
    setIsLoading(true);
    setReport(null);

    try {
      const result = await suggestFollowUpContentAction({
        studentName: selectedStudent.name,
        skillLevel: selectedStudent.skillLevel,
        topic: selectedStudent.topic,
        weeklyPerformance: data.weeklyPerformance,
      });
      setReport({ studentName: selectedStudent.name, ...result });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate suggestions. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <div className="flex flex-col gap-8">
        <PageHeader
          title="Progress Tracker"
          description="Log student skill levels and generate AI-powered follow-up suggestions."
          Icon={Users}
        />
        <Card>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Log Student Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select Student</Label>
                <Select onValueChange={handleStudentChange} value={studentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockStudents.map((student) => (
                      <SelectItem key={student.id} value={student.id.toString()}>
                        {student.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                 {errors.studentId && <p className="text-sm text-destructive">{errors.studentId.message}</p>}
              </div>

              {selectedStudent && (
                <div className="p-4 border rounded-lg bg-muted/50 space-y-1">
                    <p className="text-sm font-medium">{selectedStudent.name}</p>
                    <p className="text-sm text-muted-foreground">
                        Topic: {selectedStudent.topic} | Skill Level: {selectedStudent.skillLevel}
                    </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="weeklyPerformance">Weekly Performance Notes</Label>
                <Textarea
                  id="weeklyPerformance"
                  placeholder="e.g., Showed great improvement in identifying vowels, but struggles with silent letters..."
                  {...register("weeklyPerformance")}
                  className="min-h-24"
                  disabled={!selectedStudent}
                />
                {errors.weeklyPerformance && <p className="text-sm text-destructive">{errors.weeklyPerformance.message}</p>}
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading || !selectedStudent}>
                {isLoading && <Spinner className="mr-2" />}
                Generate Suggestions & Report
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

       <div className="lg:sticky top-24">
        {isLoading && (
            <Card className="min-h-[400px] flex justify-center items-center">
                <Spinner className="w-8 h-8" />
            </Card>
        )}
        {report && (
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Feedback for {report.studentName}</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full" defaultValue="suggestions">
                <AccordionItem value="suggestions">
                  <AccordionTrigger>Suggested Follow-up Content</AccordionTrigger>
                  <AccordionContent className="prose prose-sm dark:prose-invert whitespace-pre-wrap">
                    {report.suggestedContent}
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="report">
                  <AccordionTrigger>Draft Weekly Report</AccordionTrigger>
                  <AccordionContent className="prose prose-sm dark:prose-invert whitespace-pre-wrap">
                    {report.draftReport}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
