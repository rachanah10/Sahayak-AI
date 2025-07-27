"use client";

import { useState, useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { suggestFollowUpContentAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { Users, FileText } from "lucide-react";
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
import {
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { useAuth } from "@/hooks/use-auth";
import type { SuggestFollowUpContentInput } from "@/ai/flows/suggest-follow-up-content";


interface StudentPerformance {
  id: number;
  name: string;
  performance: {
    math: number;
    science: number;
    reading: number;
    writing: number;
    history: number;
  };
  assessments: {
    id: string;
    topic: string;
    score: number;
    date: string;
  }[];
}

const mockStudentData: StudentPerformance[] = [
  {
    id: 1,
    name: "Aarav Sharma",
    performance: { math: 85, science: 92, reading: 78, writing: 81, history: 88 },
    assessments: [
      { id: "as1", topic: "Algebra Basics", score: 88, date: "2024-05-10" },
      { id: "as2", topic: "The Mughal Empire", score: 90, date: "2024-05-12" },
    ],
  },
  {
    id: 2,
    name: "Priya Patel",
    performance: { math: 95, science: 88, reading: 91, writing: 94, history: 85 },
    assessments: [
      { id: "pp1", topic: "Cell Biology", score: 92, date: "2024-05-11" },
    ],
  },
  {
    id: 3,
    name: "Rohan Das",
    performance: { math: 72, science: 65, reading: 80, writing: 75, history: 78 },
    assessments: [
      { id: "rd1", topic: "Grammar and Punctuation", score: 78, date: "2024-05-13" },
    ],
  },
];


const chartConfig = {
  score: {
    label: "Score",
  },
  math: {
    label: "Math",
    color: "hsl(var(--chart-1))",
  },
  science: {
    label: "Science",
    color: "hsl(var(--chart-2))",
  },
  reading: {
    label: "Reading",
    color: "hsl(var(--chart-3))",
  },
  writing: {
    label: "Writing",
    color: "hsl(var(--chart-4))",
  },
  history: {
    label: "History",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig;

export default function ProgressTrackerPage() {
  const { user } = useAuth();
  const [selectedStudent, setSelectedStudent] = useState<StudentPerformance | null>(null);

  useEffect(() => {
    // If a student is logged in, find their data from the mock list
    if (user?.role === "student") {
      const studentData = mockStudentData.find(s => s.name === user.name);
      setSelectedStudent(studentData || null);
    }
  }, [user]);

  const handleStudentChange = (id: string) => {
    const student = mockStudentData.find((s) => s.id.toString() === id);
    setSelectedStudent(student || null);
  };
  
  const chartData = selectedStudent ? 
    Object.entries(selectedStudent.performance).map(([subject, score]) => ({ subject, score }))
    : [];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Student Progress"
        description="Visualize student performance and track assessment history."
        Icon={Users}
      />
      
      {user?.role === 'teacher' && (
        <Card>
            <CardHeader>
                <CardTitle>Select Student</CardTitle>
                <CardDescription>Choose a student to view their progress dashboard.</CardDescription>
            </CardHeader>
            <CardContent>
                <Select onValueChange={handleStudentChange}>
                    <SelectTrigger className="w-full sm:w-1/2">
                        <SelectValue placeholder="Select a student" />
                    </SelectTrigger>
                    <SelectContent>
                    {mockStudentData.map((student) => (
                        <SelectItem key={student.id} value={student.id.toString()}>
                        {student.name}
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
            </CardContent>
        </Card>
      )}

      {selectedStudent ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <Card>
            <CardHeader>
              <CardTitle>{selectedStudent.name}'s Performance</CardTitle>
              <CardDescription>Strengths and weaknesses across subjects.</CardDescription>
            </CardHeader>
            <CardContent className="h-[25rem] pb-0">
               <ChartContainer config={chartConfig} className="w-full h-full">
                <ResponsiveContainer>
                  <RadarChart data={chartData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name={selectedStudent.name}
                      dataKey="score"
                      stroke="hsl(var(--chart-1))"
                      fill="hsl(var(--chart-1))"
                      fillOpacity={0.6}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
             <CardHeader>
                <CardTitle>Recent Assessments</CardTitle>
                <CardDescription>A log of completed tests and scores.</CardDescription>
             </CardHeader>
             <CardContent>
                {selectedStudent.assessments.length > 0 ? (
                    <div className="space-y-4">
                        {selectedStudent.assessments.map(assessment => (
                            <div key={assessment.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                <div>
                                    <p className="font-semibold">{assessment.topic}</p>
                                    <p className="text-sm text-muted-foreground">Completed on {assessment.date}</p>
                                </div>
                                <div className="text-lg font-bold text-primary">{assessment.score}%</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        <FileText className="mx-auto h-12 w-12" />
                        <p className="mt-4">No assessments completed yet.</p>
                    </div>
                )}
             </CardContent>
          </Card>

        </div>
      ) : (
        user?.role === 'teacher' && (
            <Card className="flex flex-col items-center justify-center py-20">
                <CardTitle>No Student Selected</CardTitle>
                <CardDescription className="mt-2">Please select a student above to view their dashboard.</CardDescription>
            </Card>
        )
      )}
    </div>
  );
}
