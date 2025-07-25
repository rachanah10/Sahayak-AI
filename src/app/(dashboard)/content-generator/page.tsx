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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { generateLocalizedContentAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { BookOpen } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

const schema = z.object({
  prompt: z.string().min(10, "Please enter a prompt of at least 10 characters."),
  localizationDetails: z.string().min(5, "Please enter some localization details."),
});

type FormFields = z.infer<typeof schema>;

export default function ContentGeneratorPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedStory, setGeneratedStory] = useState("");
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormFields>({
    resolver: zodResolver(schema),
  });

  const onSubmit: SubmitHandler<FormFields> = async (data) => {
    setIsLoading(true);
    setGeneratedStory("");
    try {
      const result = await generateLocalizedContentAction(data);
      setGeneratedStory(result.localizedStory);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate localized content. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <div className="flex flex-col gap-8">
        <PageHeader
          title="Content Generator"
          description="Create localized, culturally relevant stories and worksheets based on your prompts."
          Icon={BookOpen}
        />
        <Card>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Content Details</CardTitle>
              <CardDescription>
                Provide a prompt and localization context to generate a unique story.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prompt">Prompt</Label>
                <Textarea
                  id="prompt"
                  placeholder="e.g., A story about a clever monkey outsmarting a tiger."
                  {...register("prompt")}
                  className="min-h-24"
                />
                {errors.prompt && <p className="text-sm text-destructive">{errors.prompt.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="localizationDetails">Localization Details</Label>
                <Input
                  id="localizationDetails"
                  placeholder="e.g., Set in the Sunderbans, West Bengal, India"
                  {...register("localizationDetails")}
                />
                {errors.localizationDetails && <p className="text-sm text-destructive">{errors.localizationDetails.message}</p>}
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Spinner className="mr-2" />}
                Generate Story
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      <div className="lg:sticky top-24">
        <Card className="min-h-[400px]">
          <CardHeader>
            <CardTitle>Generated Story</CardTitle>
            <CardDescription>Your localized story will appear here.</CardDescription>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert whitespace-pre-wrap">
            {isLoading && (
              <div className="flex justify-center items-center h-40">
                <Spinner className="w-8 h-8" />
              </div>
            )}
            {generatedStory}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
