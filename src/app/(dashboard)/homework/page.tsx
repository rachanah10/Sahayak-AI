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
import { generateHomeworkAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { NotebookTabs } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { GenerateHomeworkOutput, GenerateHomeworkInput } from "@/ai/flows/generate-homework";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const schema = z.object({
  topic: z.string().min(3, "Please enter a topic."),
  grade: z.string().min(1, "Please select a grade."),
  language: z.string().min(1, "Please select a language."),
  useImage: z.boolean(),
  image: z
    .any()
    .optional()
}).refine(data => {
    if (data.useImage) {
        return data.image?.length > 0;
    }
    return true;
}, {
    message: "Image is required when the checkbox is selected.",
    path: ["image"],
}).refine(data => {
    if (data.useImage && data.image?.length > 0) {
        return data.image?.[0]?.size <= MAX_FILE_SIZE;
    }
    return true;
}, {
    message: `Max file size is 5MB.`,
    path: ["image"],
}).refine(data => {
    if (data.useImage && data.image?.length > 0) {
        return ACCEPTED_IMAGE_TYPES.includes(data.image?.[0]?.type);
    }
    return true;
}, {
    message: ".jpg, .jpeg, .png and .webp files are accepted.",
    path: ["image"],
});

type FormFields = z.infer<typeof schema>;

export default function HomeworkPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [worksheets, setWorksheets] = useState<GenerateHomeworkOutput | null>(null);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormFields>({
    resolver: zodResolver(schema),
    defaultValues: {
      topic: "",
      grade: "4th Grade",
      language: "English",
      useImage: false,
    },
  });

  const useImage = watch("useImage");
  const formValues = watch();

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
      let textbookPageImage: string | undefined = undefined;
      if (data.useImage && data.image && data.image.length > 0) {
        textbookPageImage = await fileToDataUri(data.image[0]);
      }
      
      const payload: GenerateHomeworkInput = {
        topic: data.topic,
        grade: data.grade,
        language: data.language,
        textbookPageImage: textbookPageImage,
      };

      const result = await generateHomeworkAction(payload);
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
          title="Homework Generator"
          description="Generate worksheets for different learning levels based on topic, grade, and language."
          Icon={NotebookTabs}
        />
        <Card>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Homework Details</CardTitle>
              <CardDescription>Provide a topic, grade, language, and optional textbook image.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="topic">Topic *</Label>
                <Input id="topic" placeholder="e.g., Photosynthesis" {...register("topic")} />
                {errors.topic && <p className="text-sm text-destructive">{errors.topic.message}</p>}
              </div>

               <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="grade">Grade *</Label>
                    <Select onValueChange={(value) => setValue("grade", value)} defaultValue={formValues.grade}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {Array.from({length: 10}, (_, i) => `${i + 1}${i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'} Grade`).map(grade => (
                                <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.grade && <p className="text-sm text-destructive">{errors.grade.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label>Language *</Label>
                    <Select onValueChange={(value) => setValue("language", value)} defaultValue={formValues.language}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="English">English</SelectItem>
                            <SelectItem value="Hindi">Hindi</SelectItem>
                            <SelectItem value="Bengali">Bengali</SelectItem>
                            <SelectItem value="Tamil">Tamil</SelectItem>
                        </SelectContent>
                    </Select>
                     {errors.language && <p className="text-sm text-destructive">{errors.language.message}</p>}
                </div>
              </div>
              
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox id="useImage" {...register("useImage")} checked={useImage} onCheckedChange={(c) => setValue("useImage", !!c)} />
                <Label htmlFor="useImage">Base questions on uploaded content</Label>
              </div>

              {useImage && (
                <div className="space-y-2">
                  <Label htmlFor="image">Textbook Page Image *</Label>
                  <Input id="image" type="file" {...register("image")} accept={ACCEPTED_IMAGE_TYPES.join(",")} />
                  {errors.image && <p className="text-sm text-destructive">{errors.image.message?.toString()}</p>}
                </div>
              )}
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
