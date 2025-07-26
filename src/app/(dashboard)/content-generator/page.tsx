
"use client";

import { useState } from "react";
import Image from "next/image";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { generateLocalizedContentAction, suggestTagsForContentAction, saveToContentLibraryAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { BookOpen, Lightbulb, Save } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import type { GenerateLocalizedContentOutput, GenerateLocalizedContentInput } from "@/ai/flows/generate-localized-content";
import type { SaveToContentLibraryInput } from "@/ai/flows/save-to-content-library";

const schema = z.object({
  prompt: z.string(),
  localizationDetails: z.string().optional(),
  grade: z.string().min(1, "Please select a grade level."),
  language: z.string(),
  generateContent: z.boolean(),
  generateImage: z.boolean(),
  tags: z.array(z.string()).optional(),
}).refine(data => data.generateContent || data.generateImage, {
    message: "You must select to generate either content or an image.",
    path: ["generateContent"],
});

type FormFields = z.infer<typeof schema>;

export default function ContentGeneratorPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [output, setOutput] = useState<GenerateLocalizedContentOutput | null>(null);
  const [editedStory, setEditedStory] = useState("");
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    control,
    watch,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<FormFields>({
    resolver: zodResolver(schema),
    defaultValues: {
      prompt: "",
      language: "English",
      generateContent: true,
      generateImage: true,
      grade: "4th Grade",
    },
  });

  const formValues = watch();

  const handleSuggestTags = async () => {
    setIsSuggesting(true);
    setSuggestedTags([]);
    try {
      const { prompt, localizationDetails, grade, language } = getValues();
      if (!prompt || !grade || !language) {
         toast({
            variant: "destructive",
            title: "Missing Information",
            description: "Please fill out Prompt, Grade, and Language to get suggestions.",
         });
        return;
      }
      const result = await suggestTagsForContentAction({ prompt, localizationDetails: localizationDetails || "", grade, language });
      setSuggestedTags(result.suggestedTags);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to suggest tags. Please try again.",
      });
    } finally {
      setIsSuggesting(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => {
        const newSet = new Set(prev);
        if (newSet.has(tag)) {
            newSet.delete(tag);
        } else {
            newSet.add(tag);
        }
        return newSet;
    });
  };

  const onSubmit: SubmitHandler<FormFields> = async (data) => {
    setIsGenerating(true);
    setOutput(null);
    setEditedStory("");
    try {
      const result = await generateLocalizedContentAction({ ...data, tags: Array.from(selectedTags) });
      setOutput(result);
      if (result.localizedStory) {
        setEditedStory(result.localizedStory);
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate content. Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToLibrary = async () => {
    if (!output) return;
    setIsSaving(true);
    try {
      const { prompt, grade, language } = getValues();
      const payload: SaveToContentLibraryInput = {
        prompt,
        grade,
        language,
        story: editedStory,
        imageUrl: output.diagramDataUri,
      }
      await saveToContentLibraryAction(payload);
      toast({
        title: "Saved to Library",
        description: "Your content has been saved successfully.",
      });
    } catch (error) {
        console.error(error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to save to library. Please try again.",
        });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <div className="flex flex-col gap-8">
        <PageHeader
          title="Hyper-Local Content Generator"
          description="Create culturally relevant stories, explanations, and teaching aids."
          Icon={BookOpen}
        />
        <Card>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Content Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Main Inputs */}
              <div className="space-y-2">
                <Label htmlFor="prompt">Content Prompt *</Label>
                <Textarea id="prompt" placeholder="e.g., A story about forgiveness" {...register("prompt")} />
                {errors.prompt && <p className="text-sm text-destructive">{errors.prompt.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="localizationDetails">Localization Details (Optional)</Label>
                <Input id="localizationDetails" placeholder="e.g., A village in West Bengal, use local fauna" {...register("localizationDetails")} />
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
                    <Label>Language</Label>
                    <Select onValueChange={(value) => setValue("language", value)} defaultValue={formValues.language}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="English">English</SelectItem>
                            <SelectItem value="Hindi">Hindi</SelectItem>
                            <SelectItem value="Bengali">Bengali</SelectItem>
                            <SelectItem value="Tamil">Tamil</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="flex items-center space-x-2">
                      <Switch id="generateContent" {...register("generateContent")} checked={formValues.generateContent} onCheckedChange={(c) => setValue("generateContent", c)} />
                      <Label htmlFor="generateContent">Generate Content</Label>
                  </div>
                   <div className="flex items-center space-x-2">
                      <Switch id="generateImage" {...register("generateImage")} checked={formValues.generateImage} onCheckedChange={(c) => setValue("generateImage", c)}/>
                      <Label htmlFor="generateImage">Generate Image</Label>
                  </div>
              </div>
               {errors.generateContent && <p className="text-sm text-destructive">{errors.generateContent.message}</p>}

              {/* Smart Content Assistant */}
              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg"><Lightbulb className="text-yellow-400" /> Smart Content Assistant</CardTitle>
                  <CardDescription>Get AI-powered tags to improve your content generation.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button type="button" variant="outline" onClick={handleSuggestTags} disabled={isSuggesting || !formValues.prompt}>
                    {isSuggesting ? <Spinner className="mr-2"/> : <Lightbulb className="mr-2" />}
                    Suggest Tags
                  </Button>
                  {isSuggesting && <p className="text-sm text-muted-foreground mt-2">Generating suggestions...</p>}
                  {suggestedTags.length > 0 && (
                    <div className="mt-4">
                        <Label className="font-bold">Suggested Tags</Label>
                        <p className="text-sm text-muted-foreground mb-2">Click to select tags to add context to your prompt.</p>
                        <div className="flex flex-wrap gap-2">
                            {suggestedTags.map(tag => (
                                <Badge
                                    key={tag}
                                    variant={selectedTags.has(tag) ? "default" : "secondary"}
                                    onClick={() => toggleTag(tag)}
                                    className="cursor-pointer"
                                >
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    </div>
                  )}
                </CardContent>
              </Card>

            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isGenerating || !formValues.prompt}>
                {isGenerating && <Spinner className="mr-2" />}
                Generate
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      <div className="lg:sticky top-24 space-y-8">
        {(isGenerating) && (
            <Card className="min-h-[400px] flex justify-center items-center">
                <div className="text-center space-y-2">
                    <Spinner className="w-8 h-8 mx-auto" />
                    <p className="text-muted-foreground">Generating... this may take a moment.</p>
                </div>
            </Card>
        )}
        {output && (
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <CardTitle>Generated Output</CardTitle>
                        <Button variant="outline" size="sm" onClick={handleSaveToLibrary} disabled={isSaving}>
                            {isSaving ? <Spinner className="mr-2" /> : <Save className="mr-2" />}
                            Save to Library
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {output.diagramDataUri && (
                        <div>
                            <h3 className="font-bold mb-2">Generated Image</h3>
                            <Image
                                src={output.diagramDataUri}
                                alt="Generated diagram"
                                width={512}
                                height={512}
                                className="rounded-lg border aspect-square object-contain"
                                data-ai-hint="classroom diagram"
                            />
                        </div>
                    )}
                    {output.localizedStory && (
                        <div>
                             <h3 className="font-bold mb-2">Generated Story (Editable)</h3>
                             <Textarea
                                value={editedStory}
                                onChange={(e) => setEditedStory(e.target.value)}
                                className="min-h-48"
                             />
                        </div>
                    )}
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}
