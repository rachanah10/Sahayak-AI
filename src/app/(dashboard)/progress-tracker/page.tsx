
"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Users, FileText, Search, ArrowUpDown, ChevronsRight, ChevronLeft, Lightbulb, CheckCircle, XCircle } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import type { SuggestFollowUpContentInput, SuggestFollowUpContentOutput } from "@/ai/flows/suggest-follow-up-content";
import { cn } from "@/lib/utils";

interface AssessmentAttempt {
    id: string;
    topic: string;
    subTopics: { name: string, score: number, insights: string }[];
    score: number;
    date: string;
    remarks: string;
    questions: {
        question: string;
        studentAnswer: string;
        correctAnswer: string;
        isCorrect: boolean;
    }[];
}

interface StudentPerformance {
  id: number;
  uid: string;
  name: string;
  grade: string;
  skillLevel: string;
  performance: {
    math: number;
    science: number;
    reading: number;
    writing: number;
    history: number;
  };
  assessments: Record<string, AssessmentAttempt[]>;
  reviews: { date: string, review: string }[];
}

const mockStudentData: StudentPerformance[] = [
  {
    id: 1,
    uid: "erYvJ848w6hSFjvPBfOA5zwqLK72",
    name: "Aarav Sharma",
    grade: "5th Grade",
    skillLevel: "Excelling",
    performance: { math: 85, science: 92, reading: 78, writing: 81, history: 88 },
    assessments: {
        "Science": [
            {
                id: "sci1", topic: "Photosynthesis", score: 95, date: "2024-05-15", remarks: "Very detailed and accurate explanations.",
                subTopics: [
                    { name: 'Chlorophyll', score: 100, insights: "Excellent understanding of chlorophyll's role." },
                    { name: 'Light Energy', score: 90, insights: "Good, but could explain the conversion to chemical energy more clearly." },
                    { name: 'Reactants', score: 95, insights: "Correctly identified all reactants." },
                ],
                questions: [
                    { question: "What is the primary pigment in plants?", studentAnswer: "Chlorophyll", correctAnswer: "Chlorophyll", isCorrect: true},
                    { question: "What gas do plants absorb?", studentAnswer: "Carbon Dioxide", correctAnswer: "Carbon Dioxide", isCorrect: true}
                ]
            }
        ],
        "History": [
            { id: "hist1", topic: "The Mughal Empire", score: 90, date: "2024-05-12", remarks: "Excellent recall of dates and events.",
                subTopics: [
                    { name: 'Babur', score: 95, insights: "Strong knowledge of the empire's founding." },
                    { name: 'Akbar', score: 85, insights: "Good, but some details about his administrative policies were missed." },
                    { name: 'Architecture', score: 90, insights: "Correctly identified major monuments." },
                ],
                questions: [
                    { question: "Who founded the Mughal Empire?", studentAnswer: "Babur", correctAnswer: "Babur", isCorrect: true},
                    { question: "What is the Taj Mahal made of?", studentAnswer: "Marble", correctAnswer: "White Marble", isCorrect: false}
                ]
            }
        ]
    },
    reviews: [ {date: "2024-05-16", review: "Aarav has shown great progress this week, especially in Science."} ]
  },
  {
    id: 2,
    uid: "erYvJ844w6uSFjvPBfOA5zwqLK72",
    name: "Priya Patel",
    grade: "5th Grade",
    skillLevel: "Meeting Expectations",
    performance: { math: 95, science: 88, reading: 91, writing: 94, history: 85 },
    assessments: {
        "Science": [
            { id: "pp1", topic: "Cell Biology", score: 92, date: "2024-05-11", remarks: "Strong performance.", subTopics: [], questions: [] },
        ]
    },
    reviews: []
  },
  {
    id: 3,
    uid: "erYvJ844w6hSFjvPBfOA5zwqLK72",
    name: "Rohan Das",
    grade: "4th Grade",
    skillLevel: "Needs Improvement",
    performance: { math: 72, science: 65, reading: 80, writing: 75, history: 78 },
    assessments: {
         "English": [
            { id: "rd1", topic: "Grammar and Punctuation", score: 78, date: "2024-05-13", remarks: "Struggled with comma usage.", subTopics: [], questions: [] },
        ]
    },
    reviews: []
  },
];


const NewRemarkFormSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  skillLevel: z.string().min(1, "Skill level is required"),
  weeklyPerformance: z.string().optional(),
});
type NewRemarkFormFields = z.infer<typeof NewRemarkFormSchema>;

function StudentProfileDialog({ student }: { student: StudentPerformance }) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [aiResponse, setAiResponse] = useState<SuggestFollowUpContentOutput | null>(null);
    const [editedReview, setEditedReview] = useState("");

    const { register, handleSubmit, formState: { errors } } = useForm<NewRemarkFormFields>({
        resolver: zodResolver(NewRemarkFormSchema),
        defaultValues: {
            topic: student ? Object.values(student.assessments)?.[0]?.[0]?.topic : "",
            skillLevel: student?.skillLevel || "",
        }
    });

    const onGenerate: SubmitHandler<NewRemarkFormFields> = async (data) => {
        if (!student) return;
        setIsLoading(true);
        setAiResponse(null);
        try {
            const result = await suggestFollowUpContentAction({
                ...data,
                studentName: student.name,
            });
            setAiResponse(result);
            setEditedReview(result.draftReport);
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Error", description: "Failed to generate suggestions." });
        } finally {
            setIsLoading(false);
        }
    };
    
    const onSave = () => {
        if(!editedReview) return;
        setIsSaving(true);
        // In a real app, you'd save this to the student's profile in Firestore
        console.log("Saving review:", editedReview);
        toast({ title: "Review Saved", description: `Review for ${student?.name} has been saved.` });
        setTimeout(() => setIsSaving(false), 1000); // Simulate save
    }

    if (!student) return null;

    const chartData = Object.entries(student.performance).map(([subject, score]) => ({ subject, score }));
    const chartConfig: ChartConfig = {
        score: { label: "Score" },
        math: { label: "Math", color: "hsl(var(--chart-1))" },
        science: { label: "Science", color: "hsl(var(--chart-2))" },
        reading: { label: "Reading", color: "hsl(var(--chart-3))" },
        writing: { label: "Writing", color: "hsl(var(--chart-4))" },
        history: { label: "History", color: "hsl(var(--chart-5))" },
    };

    return (
        <DialogContent className="max-w-4xl h-[90vh]">
            <DialogHeader>
                <DialogTitle>{student.name}'s Profile</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pr-4">
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Performance Overview</CardTitle>
                        </CardHeader>
                        <CardContent className="h-80">
                            <ChartContainer config={chartConfig} className="w-full h-full">
                                <ResponsiveContainer>
                                    <RadarChart data={chartData}>
                                        <PolarGrid />
                                        <PolarAngleAxis dataKey="subject" />
                                        <PolarRadiusAxis angle={30} domain={[50, 100]} />
                                        <Radar name={student.name} dataKey="score" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.6} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Assessments</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {Object.values(student.assessments).flat().slice(0, 3).map(a => (
                                    <div key={a.id} className="border-b pb-2 last:border-b-0">
                                        <div className="flex justify-between font-semibold">
                                            <span>{a.topic}</span>
                                            <span className="text-primary">{a.score}%</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{a.remarks}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>Generate New Review/Recommendation</CardTitle>
                            <CardDescription>Use AI to generate a draft based on recent performance.</CardDescription>
                        </CardHeader>
                         <form onSubmit={handleSubmit(onGenerate)}>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Primary Topic</Label>
                                    <Input {...register("topic")} />
                                    {errors.topic && <p className="text-destructive text-sm">{errors.topic.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>Current Skill Level</Label>
                                     <Input {...register("skillLevel")} />
                                    {errors.skillLevel && <p className="text-destructive text-sm">{errors.skillLevel.message}</p>}
                                </div>
                                 <div className="space-y-2">
                                    <Label>Additional Notes (Optional)</Label>
                                     <Textarea {...register("weeklyPerformance")} placeholder="e.g., Showed great improvement in class participation."/>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading && <Spinner className="mr-2"/>}
                                    Generate Draft
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>

                    {aiResponse && (
                         <Card>
                            <CardHeader>
                                <CardTitle>Generated Draft</CardTitle>
                                <CardDescription>Review and edit the draft below before saving.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                 <div>
                                    <Label className="font-bold">Suggested Follow-Up Content</Label>
                                    <p className="text-sm text-muted-foreground p-2 bg-muted/50 rounded-md">{aiResponse.suggestedContent}</p>
                                 </div>
                                  <div>
                                    <Label className="font-bold" htmlFor="editedReview">Draft Report</Label>
                                     <Textarea id="editedReview" value={editedReview} onChange={(e) => setEditedReview(e.target.value)} className="min-h-32" />
                                  </div>
                            </CardContent>
                            <CardFooter>
                                <Button onClick={onSave} disabled={isSaving}>
                                    {isSaving && <Spinner className="mr-2" />}
                                    Approve & Save Review
                                </Button>
                            </CardFooter>
                         </Card>
                    )}
                </div>
            </div>
        </DialogContent>
    )
}

function StudentView({ student }: { student: StudentPerformance }) {
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
    const [selectedAssessment, setSelectedAssessment] = useState<AssessmentAttempt | null>(null);
    
    if (!student) return null;

    const mainChartData = Object.entries(student.performance).map(([subject, score]) => ({ subject, score }));
    const mainChartConfig: ChartConfig = {
        score: { label: "Score" },
        math: { label: "Math", color: "hsl(var(--chart-1))" },
        science: { label: "Science", color: "hsl(var(--chart-2))" },
        reading: { label: "Reading", color: "hsl(var(--chart-3))" },
        writing: { label: "Writing", color: "hsl(var(--chart-4))" },
        history: { label: "History", color: "hsl(var(--chart-5))" },
    };
    
    if (selectedAssessment) {
        const assessmentChartData = selectedAssessment.subTopics.map(st => ({ name: st.name, score: st.score }));
        const assessmentChartConfig: ChartConfig = {
            score: { label: "Score" },
            ...selectedAssessment.subTopics.reduce((acc, sub, index) => {
                acc[sub.name] = { label: sub.name, color: `hsl(var(--chart-${(index % 5) + 1}))` };
                return acc;
            }, {} as ChartConfig)
        }

        return (
            <div className="flex flex-col gap-4">
                <Button variant="ghost" onClick={() => setSelectedAssessment(null)} className="self-start">
                    <ChevronLeft className="mr-2" /> Back to Assessments
                </Button>
                <Card>
                    <CardHeader>
                        <CardTitle>{selectedAssessment.topic}</CardTitle>
                        <CardDescription>Score: {selectedAssessment.score}% | Date: {selectedAssessment.date}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <h3 className="font-bold">Sub-Topic Performance</h3>
                            <div className="h-80">
                               <ChartContainer config={assessmentChartConfig} className="w-full h-full">
                                    <ResponsiveContainer>
                                        <RadarChart data={assessmentChartData}>
                                            <PolarGrid />
                                            <PolarAngleAxis dataKey="name" />
                                            <PolarRadiusAxis angle={30} domain={[0, 100]} />
                                            <Radar name="Sub-topic" dataKey="score" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.6} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </ChartContainer>
                            </div>
                            <div>
                                <h3 className="font-bold mb-2">AI-Powered Insights</h3>
                                <Accordion type="multiple" className="w-full">
                                    {selectedAssessment.subTopics.map(sub => (
                                         <AccordionItem value={sub.name} key={sub.name}>
                                            <AccordionTrigger>{sub.name}</AccordionTrigger>
                                            <AccordionContent>{sub.insights}</AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h3 className="font-bold">Questions & Answers</h3>
                            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                                {selectedAssessment.questions.map((q, i) => (
                                    <div key={i} className="border p-4 rounded-md">
                                        <p className="font-semibold mb-2">{i+1}. {q.question}</p>
                                        <div className={cn("text-sm p-2 rounded-md flex items-start gap-2", q.isCorrect ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50')}>
                                            {q.isCorrect ? <CheckCircle className="text-green-600 mt-0.5" /> : <XCircle className="text-red-600 mt-0.5" />}
                                            <div>
                                               <span className="font-bold">Your Answer: </span> {q.studentAnswer}
                                            </div>
                                        </div>
                                        {!q.isCorrect && (
                                            <div className="text-sm p-2 mt-2 rounded-md bg-muted flex items-start gap-2">
                                                <Lightbulb className="text-yellow-500 mt-0.5" />
                                                <div>
                                                   <span className="font-bold">Correct Answer: </span> {q.correctAnswer}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (selectedSubject) {
        const attempts = student.assessments[selectedSubject] || [];
        return (
            <div className="flex flex-col gap-4">
                <Button variant="ghost" onClick={() => setSelectedSubject(null)} className="self-start">
                    <ChevronLeft className="mr-2" /> Back to Subjects
                </Button>
                <Card>
                    <CardHeader>
                        <CardTitle>Assessments for {selectedSubject}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Topic</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Score</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {attempts.map(att => (
                                    <TableRow key={att.id} onClick={() => setSelectedAssessment(att)} className="cursor-pointer">
                                        <TableCell className="font-medium">{att.topic}</TableCell>
                                        <TableCell>{att.date}</TableCell>
                                        <TableCell>{att.score}%</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>Overall Performance</CardTitle>
                    <CardDescription>Your performance across all subjects.</CardDescription>
                </CardHeader>
                <CardContent className="h-96">
                    <ChartContainer config={mainChartConfig} className="w-full h-full">
                        <ResponsiveContainer>
                            <RadarChart data={mainChartData}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="subject" />
                                <PolarRadiusAxis angle={30} domain={[50, 100]} />
                                <Radar name={student.name} dataKey="score" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.6} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Subjects</CardTitle>
                    <CardDescription>Click a subject to view your assessment history.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.keys(student.assessments).map(subject => (
                        <button key={subject} onClick={() => setSelectedSubject(subject)} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors flex justify-between items-center text-left">
                            <span className="font-semibold">{subject}</span>
                            <ChevronsRight />
                        </button>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}


export default function ProgressTrackerPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentPerformance[]>(mockStudentData);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<keyof StudentPerformance>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState<StudentPerformance | null>(null);

  useEffect(() => {
    if (user?.role === "student") {
      const studentData = mockStudentData.find(s => s.uid === user.uid) || mockStudentData[0];
      setStudents([studentData]);
    }
  }, [user]);

  const sortedAndFilteredStudents = useMemo(() => {
    let result = [...students];

    // Filter
    if (gradeFilter !== "all") {
        result = result.filter(s => s.grade === gradeFilter);
    }
    if (searchQuery) {
        result = result.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    // Sort
    result.sort((a, b) => {
        const valA = a[sortKey];
        const valB = b[sortKey];
        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });

    return result;
  }, [students, searchQuery, sortKey, sortOrder, gradeFilter]);
  
  const handleSort = (key: keyof StudentPerformance) => {
    if (sortKey === key) {
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
        setSortKey(key);
        setSortOrder('asc');
    }
  }

  const uniqueGrades = useMemo(() => ["all", ...Array.from(new Set(mockStudentData.map(s => s.grade)))], []);

  if (user?.role === 'student' && students.length > 0) {
      return (
        <div className="flex flex-col gap-8">
            <PageHeader
                title={`${students[0].name}'s Progress`}
                description="Review your performance, track your growth, and get personalized insights."
                Icon={Users}
            />
            <StudentView student={students[0]} />
        </div>
      );
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Student Progress Tracker"
        description="Monitor student performance and generate AI-powered feedback."
        Icon={Users}
      />
      
      <Card>
        <CardHeader>
          <CardTitle>All Students</CardTitle>
          <CardDescription>Search, sort, and filter your student list.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input placeholder="Search by name..." className="pl-10" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                </div>
                 <Select value={gradeFilter} onValueChange={setGradeFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Filter by grade" />
                    </SelectTrigger>
                    <SelectContent>
                        {uniqueGrades.map(grade => (
                            <SelectItem key={grade} value={grade}>{grade === 'all' ? "All Grades" : grade}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort('name')}>
                        Name <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                     <Button variant="ghost" onClick={() => handleSort('grade')}>
                        Grade <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                     <Button variant="ghost" onClick={() => handleSort('skillLevel')}>
                        Overall Level <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAndFilteredStudents.map(student => (
                  <Dialog key={student.id} onOpenChange={(open) => !open && setSelectedStudent(null)}>
                      <DialogTrigger asChild>
                        <TableRow className="cursor-pointer" onClick={() => setSelectedStudent(student)}>
                            <TableCell className="font-medium">{student.name}</TableCell>
                            <TableCell>{student.grade}</TableCell>
                            <TableCell><Badge variant={student.skillLevel === 'Excelling' ? 'default' : student.skillLevel === 'Needs Improvement' ? 'destructive' : 'secondary'}>{student.skillLevel}</Badge></TableCell>
                        </TableRow>
                      </DialogTrigger>
                       {selectedStudent && selectedStudent.id === student.id && <StudentProfileDialog student={selectedStudent} />}
                  </Dialog>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
