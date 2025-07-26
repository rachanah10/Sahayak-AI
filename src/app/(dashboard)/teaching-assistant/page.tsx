
"use client";

import { useState, useRef, useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { answerTeachingQuestionAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { MessageSquare, User, Bot } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import type { AnswerTeachingQuestionInput } from "@/ai/flows/answer-teaching-question";

const schema = z.object({
  question: z.string().min(5, "Please enter a question."),
});
type FormFields = z.infer<typeof schema>;

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function TeachingAssistantPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, reset } = useForm<FormFields>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const onSubmit: SubmitHandler<FormFields> = async (data) => {
    setIsLoading(true);
    const userMessage: Message = { role: "user", content: data.question };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const result = await answerTeachingQuestionAction(data);
      const assistantMessage: Message = { role: "assistant", content: result.answer };
      setMessages((prev) => [...prev, assistantMessage]);
      reset();
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to get an answer. Please try again.",
      });
       setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col">
      <PageHeader
        title="Teaching Assistant"
        description="Ask teaching-related questions and get immediate, helpful answers."
        Icon={MessageSquare}
      />
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
            <div className="space-y-6">
            {messages.map((message, index) => (
                <div key={index} className={`flex items-start gap-4 ${message.role === 'user' ? 'justify-end' : ''}`}>
                    {message.role === 'assistant' && (
                        <Avatar className="w-8 h-8 border">
                            <AvatarFallback><Bot /></AvatarFallback>
                        </Avatar>
                    )}
                    <div className={`rounded-lg p-3 max-w-xl ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                     {message.role === 'user' && (
                        <Avatar className="w-8 h-8 border">
                            <AvatarFallback><User /></AvatarFallback>
                        </Avatar>
                    )}
                </div>
            ))}
             {isLoading && (
                <div className="flex items-start gap-4">
                    <Avatar className="w-8 h-8 border">
                        <AvatarFallback><Bot /></AvatarFallback>
                    </Avatar>
                    <div className="rounded-lg p-3 max-w-xl bg-muted flex items-center">
                        <Spinner className="w-5 h-5" />
                    </div>
                </div>
            )}
            </div>
        </ScrollArea>
        <Separator />
        <div className="py-4">
          <form onSubmit={handleSubmit(onSubmit)} className="flex items-center gap-4">
            <Input
              id="question"
              placeholder="e.g., How can I explain evaporation to a 4th grader?"
              {...register("question")}
              disabled={isLoading}
              autoComplete="off"
            />
            <Button type="submit" disabled={isLoading}>
              Ask
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
