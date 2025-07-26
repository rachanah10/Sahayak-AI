
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/hooks/use-auth";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PageHeader } from "@/components/page-header";
import { Library } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface LibraryContent {
  id: string;
  story: string;
  imageUrl?: string;
  prompt: string;
  grade: string;
  language: string;
  createdAt: any;
}

export default function ContentLibraryPage() {
  const { user } = useAuth();
  const [libraryContent, setLibraryContent] = useState<LibraryContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchContent() {
      if (!user) return;
      setIsLoading(true);
      try {
        const q = query(
          collection(db, "content-library"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const content = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as LibraryContent[];
        setLibraryContent(content);
      } catch (error) {
        console.error("Error fetching library content: ", error);
        // Optionally, show a toast message
      } finally {
        setIsLoading(false);
      }
    }

    fetchContent();
  }, [user]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Content Library"
        description="View and manage all your generated and saved content."
        Icon={Library}
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
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : libraryContent.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20">
            <CardTitle>Your Library is Empty</CardTitle>
            <CardDescription className="mt-2">Generated content that you save will appear here.</CardDescription>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {libraryContent.map(item => (
            <Card key={item.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="line-clamp-2 text-lg">{item.prompt}</CardTitle>
                <CardDescription>
                  {item.grade} | {item.language}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
                {item.imageUrl && (
                  <div className="relative aspect-square w-full">
                    <Image
                      src={item.imageUrl}
                      alt="Library item image"
                      fill
                      className="rounded-md border object-contain"
                    />
                  </div>
                )}
                <p className="text-sm text-muted-foreground line-clamp-4">
                  {item.story}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
