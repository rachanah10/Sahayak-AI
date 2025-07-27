
"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { collection, query, where, getDocs, orderBy, and } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PageHeader } from "@/components/page-header";
import { ClipboardCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isPast, parse } from "date-fns";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface Assessment {
  id: string;
  subject: string;
  topic: string;
  grade: string;
  deadline?: string;
  timer?: number;
  createdAt: any;
}

const AssessmentCard = ({ assessment, isStudent }: { assessment: Assessment, isStudent: boolean }) => (
  <Card key={assessment.id} className="flex flex-col">
    <CardHeader>
      <CardTitle className="line-clamp-2 text-lg">{assessment.topic}</CardTitle>
      <CardDescription>
        {assessment.subject} | {assessment.grade}
      </CardDescription>
    </CardHeader>
    <CardContent className="flex-grow space-y-2">
      {assessment.timer && <Badge variant="secondary">Timer: {assessment.timer} mins</Badge>}
      {assessment.deadline && <Badge variant="outline">Deadline: {assessment.deadline}</Badge>}
    </CardContent>
    {isStudent && (
        <CardContent>
             <Button asChild>
                <Link href={`/assessment/${assessment.id}`}>
                    Start Assessment <ArrowRight className="ml-2" />
                </Link>
            </Button>
        </CardContent>
    )}
  </Card>
);

const EmptyState = ({ title, description }: { title: string, description: string }) => (
    <Card className="flex flex-col items-center justify-center py-20 mt-4">
        <CardTitle>{title}</CardTitle>
        <CardDescription className="mt-2">{description}</CardDescription>
    </Card>
);


export default function ViewAssessmentsPage() {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAssessments() {
      if (!user) return;
      setIsLoading(true);
      try {
        let q;
        if (user.role === 'student' && user.grade) {
            q = query(
              collection(db, "assessments"),
              where("grade", "==", user.grade)
            );
        } else if (user.role === 'teacher' || user.is_admin) {
             q = query(
              collection(db, "assessments"),
              where("userId", "==", user.uid),
              orderBy("createdAt", "desc")
            );
        } else {
            setAssessments([]);
            setIsLoading(false);
            return;
        }
        
        const querySnapshot = await getDocs(q);
        const content = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Assessment[];
        setAssessments(content);
      } catch (error) {
        console.error("Error fetching assessments: ", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAssessments();
  }, [user]);

  const { currentAssessments, completedAssessments } = useMemo(() => {
    const current: Assessment[] = [];
    const completed: Assessment[] = [];

    assessments.forEach(assessment => {
      if (assessment.deadline) {
        try {
            const deadlineDate = parse(assessment.deadline, "PPP", new Date());
            if (isPast(deadlineDate)) {
                completed.push(assessment);
            } else {
                current.push(assessment);
            }
        } catch (e) {
             completed.push(assessment);
        }
      } else {
        // For students, no-deadline tests are always current. For teachers, they are completed/archived.
        if(user?.role === 'student') {
            current.push(assessment);
        } else {
            completed.push(assessment);
        }
      }
    });

    return { currentAssessments: current, completedAssessments: completed };
  }, [assessments, user]);

  if (isLoading) {
    return (
        <div className="flex flex-col gap-8">
            <PageHeader
                title="View Assessments"
                description="Review and manage all your created assessments."
                Icon={ClipboardCheck}
            />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                <CardHeader>
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                </CardContent>
                </Card>
            ))}
            </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="View Assessments"
        description="Review and manage all your created assessments."
        Icon={ClipboardCheck}
      />
      
      <Tabs defaultValue="current" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="current">Current</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        <TabsContent value="current">
            {currentAssessments.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-4">
                    {currentAssessments.map(assessment => (
                        <AssessmentCard key={assessment.id} assessment={assessment} isStudent={user?.role === 'student'} />
                    ))}
                </div>
            ) : (
                <EmptyState title="No Current Assessments" description="Assessments with a future deadline will appear here." />
            )}
        </TabsContent>
        <TabsContent value="completed">
           {completedAssessments.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-4">
                    {completedAssessments.map(assessment => (
                         <AssessmentCard key={assessment.id} assessment={assessment} isStudent={user?.role === 'student'} />
                    ))}
                </div>
            ) : (
                <EmptyState title="No Completed Assessments" description="Assessments that are past their deadline will appear here." />
            )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
