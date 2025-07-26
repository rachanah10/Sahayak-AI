"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { generateVisualAidDiagramAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { Image as ImageIcon } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Label } from "@/components/ui/label";
import type { GenerateVisualAidDiagramInput } from "@/ai/flows/generate-visual-aid-diagram";

const schema = z.object({
  description: z.string().min(10, "Please describe the diagram in at least 10 characters."),
});

type FormFields = z.infer<typeof schema>;

export default function VisualAidPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [diagramUrl, setDiagramUrl] = useState("");
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
    setDiagramUrl("");
    try {
      const result = await generateVisualAidDiagramAction(data);
      setDiagramUrl(result.diagramDataUri);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate diagram. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <div className="flex flex-col gap-8">
        <PageHeader
          title="Visual Aid Generator"
          description="Generate simple, blackboard-friendly diagrams from a text description."
          Icon={ImageIcon}
        />
        <Card>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Diagram Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="e.g., A simple diagram of the water cycle, showing evaporation, condensation, and precipitation."
                  {...register("description")}
                  className="min-h-24"
                />
                {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Spinner className="mr-2" />}
                Generate Diagram
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      <div className="lg:sticky top-24">
        <Card className="min-h-[400px]">
          <CardHeader>
            <CardTitle>Generated Diagram</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center items-center">
            {isLoading && <Spinner className="w-8 h-8" />}
            {diagramUrl ? (
              <Image
                src={diagramUrl}
                alt="Generated diagram"
                width={400}
                height={400}
                className="rounded-lg border"
                data-ai-hint="classroom diagram"
              />
            ) : (
              !isLoading && (
                <div className="text-center text-muted-foreground">
                  <ImageIcon className="mx-auto h-12 w-12" />
                  <p>Your diagram will appear here.</p>
                </div>
              )
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
