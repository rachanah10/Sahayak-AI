
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { answerStudyingQuestionAction } from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { MessageSquare, User, Bot, Mic, PlusCircle, Book, Upload, X } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import type { Message as AIMessage } from "@/ai/flows/answer-studying-question";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";


const schema = z.object({
  question: z.string().min(1, "Please enter a question."),
});
type FormFields = z.infer<typeof schema>;

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

interface LibraryContent {
  id: string;
  story: string;
  prompt: string;
}

// Extend the message type to include an optional media preview for the UI
interface DisplayMessage extends AIMessage {
    mediaPreview?: string;
    contextTitle?: string;
}

export default function StudyingAssistantPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [libraryContent, setLibraryContent] = useState<LibraryContent[]>([]);
  const [selectedContext, setSelectedContext] = useState<{title: string, content: string} | null>(null);

  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speechRecognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchContent() {
      if (!user) return;
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
      }
    }
    fetchContent();
  }, [user]);


  const { register, handleSubmit, reset, setValue, getValues } = useForm<FormFields>({
    resolver: zodResolver(schema),
  });

  // Scroll to bottom of chat on new message
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);
  
  // Set up Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      speechRecognitionRef.current = new SpeechRecognition();
      speechRecognitionRef.current.continuous = true;
      speechRecognitionRef.current.interimResults = true;
      speechRecognitionRef.current.lang = 'en-US';

      speechRecognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setValue('question', getValues('question') + finalTranscript + interimTranscript);
        // Reset silence timer on new result
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
            stopListening();
        }, 4000);
      };

      speechRecognitionRef.current.onend = () => {
        setIsListening(false);
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      };

      speechRecognitionRef.current.onerror = (event: any) => {
        toast({
            variant: "destructive",
            title: "Speech Recognition Error",
            description: event.error,
        });
        setIsListening(false);
      };
    } else {
      toast({
        title: "Unsupported Browser",
        description: "Speech recognition is not supported by your browser.",
      });
    }
  }, [setValue, toast, getValues]);
  
  const startListening = () => {
    if (isListening || !speechRecognitionRef.current) return;
    setIsListening(true);
    speechRecognitionRef.current.start();
    reset({ question: '' }); // Clear input field on start
    silenceTimerRef.current = setTimeout(() => {
        stopListening();
    }, 4000);
  };

  const stopListening = () => {
    if (!isListening || !speechRecognitionRef.current) return;
    setIsListening(false);
    speechRecognitionRef.current.stop();
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
  };
  
  const playAudio = (audioDataUri: string) => {
    if (audioRef.current) {
        audioRef.current.src = audioDataUri;
        audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
    }
  };
  
  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
            toast({ variant: 'destructive', title: "Invalid File Type", description: "Please select an image file (jpg, png, webp)." });
            return;
        }
        setMediaFile(file);
        setMediaPreview(URL.createObjectURL(file));
        setSelectedContext(null); // Clear library context if media is added
        setIsDialogOpen(false);
    }
  }

  const handleLibrarySelect = (contentId: string) => {
    const item = libraryContent.find(c => c.id === contentId);
    if (item) {
        setSelectedContext({ title: item.prompt, content: item.story });
        setMediaFile(null); // Clear media if library context is added
        setMediaPreview(null);
        setIsDialogOpen(false);
    }
  }

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
  }
  
  const removeContext = () => {
    setSelectedContext(null);
  }

  const onSubmit: SubmitHandler<FormFields> = async (data) => {
    if (!data.question.trim() && !mediaFile && !selectedContext) return;

    setIsLoading(true);

    const userMessage: DisplayMessage = {
      role: "user",
      content: data.question,
      mediaPreview: mediaPreview || undefined,
      contextTitle: selectedContext?.title,
    };
    
    // Create history from previous messages, excluding previews
    const history: AIMessage[] = messages.map(({role, content}) => ({ role, content }));
    
    setMessages((prev) => [...prev, userMessage]);
    
    // Clear the input fields after constructing the message
    reset();
    const currentMediaFile = mediaFile;
    const currentSelectedContext = selectedContext;
    removeMedia();
    removeContext();

    try {
      let mediaDataUri: string | undefined = undefined;
      if(currentMediaFile) {
        mediaDataUri = await fileToDataUri(currentMediaFile);
      }

      const result = await answerStudyingQuestionAction({
         question: data.question,
         history,
         mediaDataUri,
         context: currentSelectedContext?.content,
      });

      const assistantMessage: AIMessage = { role: "model", content: result.answer };
      setMessages((prev) => [...prev, assistantMessage]);
      
      if (result.audioDataUri) {
        playAudio(result.audioDataUri);
      }
      
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to get an answer. Please try again.",
      });
       setMessages((prev) => prev.slice(0, -1)); // Remove the user message on error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col">
       <div className="flex justify-between items-start">
            <PageHeader
                title="Studying Assistant"
                description="Your personal study buddy! Ask questions and get help with your homework."
                Icon={MessageSquare}
            />
        </div>
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
            <div className="space-y-6">
            {messages.map((message, index) => (
                <div key={index} className={`flex items-start gap-4 ${message.role === 'user' ? 'justify-end' : ''}`}>
                    {message.role === 'model' && (
                        <Avatar className="w-8 h-8 border">
                            <AvatarFallback><Bot /></AvatarFallback>
                        </Avatar>
                    )}
                    <div className={`rounded-lg p-3 max-w-xl ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        {message.mediaPreview && (
                            <Image
                                src={message.mediaPreview}
                                alt="user upload"
                                width={150}
                                height={150}
                                className="rounded-md mb-2 aspect-square object-cover"
                            />
                        )}
                        {message.contextTitle && (
                           <div className="mb-2 p-2 text-xs rounded-md bg-primary/20">
                             <p className="font-bold">Context:</p>
                             <p className="line-clamp-2">{message.contextTitle}</p>
                           </div>
                        )}
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
          <form onSubmit={handleSubmit(onSubmit)} className="flex items-start gap-2">
            <div className="relative flex-grow">
                 {(mediaPreview || selectedContext) && (
                    <div className="absolute bottom-12 left-0 p-2">
                      {mediaPreview && (
                        <div className="relative">
                            <Image src={mediaPreview} alt="media preview" width={48} height={48} className="rounded-md border aspect-square object-cover" />
                            <Button variant="ghost" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground" onClick={removeMedia}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                      )}
                      {selectedContext && (
                         <div className="relative">
                           <Badge variant="secondary" className="p-2 h-auto">
                              <Book className="mr-2 h-4 w-4" />
                              <span className="line-clamp-1">{selectedContext.title}</span>
                           </Badge>
                           <Button variant="ghost" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground" onClick={removeContext}>
                               <X className="h-4 w-4" />
                           </Button>
                        </div>
                      )}
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <PlusCircle className="w-6 h-6" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Context</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                                    <Upload className="mr-2 h-5 w-5" />
                                    Upload Media
                                </Button>
                                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept={ACCEPTED_IMAGE_TYPES.join(",")} />
                                
                                <Select onValueChange={handleLibrarySelect}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Choose from Library" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {libraryContent.length > 0 ? (
                                      libraryContent.map(item => (
                                        <SelectItem key={item.id} value={item.id}>
                                          {item.prompt}
                                        </SelectItem>
                                      ))
                                    ) : (
                                      <div className="p-4 text-sm text-center text-muted-foreground">No content in library.</div>
                                    )}
                                  </SelectContent>
                                </Select>

                            </div>
                        </DialogContent>
                    </Dialog>
                    <div className="relative flex-grow">
                        <Input
                            id="question"
                            placeholder="Ask or speak a question..."
                            {...register("question")}
                            disabled={isLoading || isListening}
                            autoComplete="off"
                            className="pr-10"
                        />
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className={cn("absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8", isListening && "text-destructive")}
                            onClick={isListening ? stopListening : startListening}
                            disabled={isLoading}
                            >
                            <Mic className="h-5 w-5" />
                        </Button>
                    </div>
                    <Button type="submit" disabled={isLoading || isListening}>
                    Ask
                    </Button>
                </div>
            </div>
          </form>
        </div>
      </div>
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
