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
import { useToast } from "@/hooks/use-toast";
import { generateDifferentiatedWorksheetsAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { NotebookTabs } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { GenerateDifferentiatedWorksheetsOutput, GenerateDifferentiatedWorksheetsInput } from "@/ai/flows/generate-differentiated-worksheets";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const schema = z.object({
  topic: z.string().min(3, "Please enter a topic."),
  image: z
    .any()
    .refine((files) => files?.length == 1, "Image is required.")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      ".jpg, .jpeg, .png and .webp files are accepted."
    ),
});

type FormFields = z.infer<typeof schema>;

export default function DifferentiatedWorksheetsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [worksheets, setWorksheets] = useState<GenerateDifferentiatedWorksheetsOutput | null>(null);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormFields>({
    resolver: zodResolver(schema),
  });

  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const onSubmit: SubmitHandler<FormFields> = async (data) => {
    setIsLoading(true);
    setWorksheets(null);
    try {
      const textbookPageImage = await fileToDataUri(data.image[0]);
      const result = await generateDifferentiatedWorksheetsAction({
        topic: data.topic,
        textbookPageImage,
      });
      setWorksheets(result);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate worksheets. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <div className="flex flex-col gap-8">
        <PageHeader
          title="Differentiated Worksheets"
          description="Upload a textbook page image to generate worksheets for different learning levels."
          Icon={NotebookTabs}
        />
        <Card>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Worksheet Details</CardTitle>
              <CardDescription>Provide a topic and a textbook image.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="topic">Topic</Label>
                <Input id="topic" placeholder="e.g., Photosynthesis" {...register("topic")} />
                {errors.topic && <p className="text-sm text-destructive">{errors.topic.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="image">Textbook Page Image</Label>
                <Input id="image" type="file" {...register("image")} accept={ACCEPTED_IMAGE_TYPES.join(",")} />
                {errors.image && <p className="text-sm text-destructive">{errors.image.message?.toString()}</p>}
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Spinner className="mr-2" />}
                Generate Worksheets
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
        {worksheets && (
          <Tabs defaultValue="easy" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="easy">Easy</TabsTrigger>
              <TabsTrigger value="medium">Medium</TabsTrigger>
              <TabsTrigger value="hard">Hard</TabsTrigger>
            </TabsList>
            <TabsContent value="easy">
              <Card>
                <CardHeader><CardTitle>Easy Worksheet</CardTitle></CardHeader>
                <CardContent className="prose prose-sm dark:prose-invert whitespace-pre-wrap">{worksheets.easyWorksheet}</CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="medium">
              <Card>
                <CardHeader><CardTitle>Medium Worksheet</CardTitle></CardHeader>
                <CardContent className="prose prose-sm dark:prose-invert whitespace-pre-wrap">{worksheets.mediumWorksheet}</CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="hard">
              <Card>
                <CardHeader><CardTitle>Hard Worksheet</CardTitle></CardHeader>
                <CardContent className="prose prose-sm dark:prose-invert whitespace-pre-wrap">{worksheets.hardWorksheet}</CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
