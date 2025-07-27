
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PageHeader } from "@/components/page-header";
import { Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface Assessment {
  id: string;
  subject: string;
  topic: string;
  grade: string;
  deadline?: string;
  timer?: number;
  createdAt: any;
}

export default function ViewAssessmentsPage() {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAssessments() {
      if (!user) return;
      setIsLoading(true);
      try {
        const q = query(
          collection(db, "assessments"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const content = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Assessment[];
        setAssessments(content);
      } catch (error) {
        console.error("Error fetching assessments: ", error);
        // Optionally, show a toast message
      } finally {
        setIsLoading(false);
      }
    }

    fetchAssessments();
  }, [user]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="View Assessments"
        description="Review and manage all your created assessments."
        Icon={Users}
      />

      {isLoading ? (
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
      ) : assessments.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20">
            <CardTitle>No Assessments Found</CardTitle>
            <CardDescription className="mt-2">Assessments you save will appear here.</CardDescription>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {assessments.map(item => (
            <Card key={item.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="line-clamp-2 text-lg">{item.topic}</CardTitle>
                <CardDescription>
                  {item.subject} | {item.grade}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-2">
                 {item.timer && <Badge variant="secondary">Timer: {item.timer} mins</Badge>}
                 {item.deadline && <Badge variant="outline">Deadline: {item.deadline}</Badge>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
