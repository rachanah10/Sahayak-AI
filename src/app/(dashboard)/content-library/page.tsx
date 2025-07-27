
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PageHeader } from "@/components/page-header";
import { Library, PlusCircle, Search, Upload, FileText, NotebookTabs } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"


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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      } finally {
        setIsLoading(false);
      }
    }

    fetchContent();
  }, [user]);

  const filteredContent = useMemo(() => {
    return libraryContent
      .filter(item => 
        selectedGrade === "all" || item.grade === selectedGrade
      )
      .filter(item =>
        item.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.story.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [libraryContent, selectedGrade, searchQuery]);
  
  const groupedContent = useMemo(() => {
    return filteredContent.reduce((acc, item) => {
        (acc[item.grade] = acc[item.grade] || []).push(item);
        return acc;
    }, {} as Record<string, LibraryContent[]>);
  }, [filteredContent]);

  const grades = useMemo(() => {
    const allGrades = libraryContent.map(item => item.grade);
    return ["all", ...Array.from(new Set(allGrades))];
  }, [libraryContent]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Content Library"
        description="View and manage all your generated and saved content."
        Icon={Library}
      />

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
                placeholder="Search by prompt or content..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={selectedGrade} onValueChange={setSelectedGrade}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by grade" />
            </SelectTrigger>
            <SelectContent>
              {grades.map(grade => (
                <SelectItem key={grade} value={grade}>
                  {grade === 'all' ? 'All Grades' : grade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {user?.role !== 'student' && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto">
                      <PlusCircle className="mr-2 h-5 w-5" />
                      Add Content
                  </Button>
              </DialogTrigger>
              <DialogContent>
                  <DialogHeader>
                      <DialogTitle>Add New Content</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                      <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                          <Upload className="mr-2 h-5 w-5" />
                          Upload Media
                      </Button>
                      <input type="file" ref={fileInputRef} className="hidden" />

                      <Button asChild variant="outline">
                          <Link href="/content-generator">
                              <FileText className="mr-2 h-5 w-5" />
                              Create New Content
                          </Link>
                      </Button>

                      <Button asChild variant="outline">
                          <Link href="/homework">
                              <NotebookTabs className="mr-2 h-5 w-5" />
                              Create New Homework
                          </Link>
                      </Button>
                  </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

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
            <CardDescription className="mt-2">Use the "Add Content" button to get started.</CardDescription>
        </Card>
      ) : filteredContent.length === 0 ? (
         <Card className="flex flex-col items-center justify-center py-20">
            <CardTitle>No Matching Content</CardTitle>
            <CardDescription className="mt-2">Try adjusting your search or filter.</CardDescription>
        </Card>
      ) : (
        <Accordion type="multiple" defaultValue={Object.keys(groupedContent)} className="w-full space-y-4">
            {Object.entries(groupedContent).map(([grade, items]) => (
                <AccordionItem key={grade} value={grade} className="border-none">
                    <AccordionTrigger className="text-xl font-bold p-4 bg-muted/50 rounded-lg">
                        {grade}
                    </AccordionTrigger>
                    <AccordionContent className="pt-4">
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {items.map(item => (
                                <Card key={item.id} className="flex flex-col">
                                <CardHeader>
                                    <CardTitle className="line-clamp-2 text-lg">{item.prompt}</CardTitle>
                                    <CardDescription>
                                    {item.grade} | {item.language}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow space-y-4">
                                    {item.imageUrl && (
                                    <div className="relative aspect-video w-full">
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
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
      )}
    </div>
  );
}
