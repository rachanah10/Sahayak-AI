"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { Logo } from "@/components/logo";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  role: z.enum(["teacher", "student"]),
  school: z.string().min(2, "Please enter a school name."),
  schoolId: z.string().min(1, "Please enter a school ID."),
  schoolIdDbLocation: z.string().min(1, "Please enter the DB location."),
  grade: z.string().min(1, "Please enter a grade."),
});

type FormFields = z.infer<typeof schema>;

export default function SignUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormFields>({
    resolver: zodResolver(schema),
  });

  const onSubmit: SubmitHandler<FormFields> = async (data) => {
    setIsLoading(true);
    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      // Store additional user details in Firestore
      await setDoc(doc(db, "users", user.uid), {
        name: data.name,
        email: data.email,
        role: data.role,
        school: data.school,
        schoolId: data.schoolId,
        schoolIdDbLocation: data.schoolIdDbLocation,
        grade: data.grade,
      });

      router.push("/");
    } catch (error: any) {
      console.error("Sign up Error:", error);
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description: error.message || "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
         <CardHeader className="text-center">
           <div className="flex justify-center mb-4">
             <Logo className="w-12 h-12" />
           </div>
          <CardTitle>Create an Account</CardTitle>
          <CardDescription>Join Sahayak to empower your teaching journey.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...register("password")} />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
             <div className="space-y-2">
                <Label>I am a...</Label>
                <Select onValueChange={(value) => setValue("role", value as "teacher" | "student")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                  </SelectContent>
                </Select>
                 {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="school">School</Label>
              <Input id="school" {...register("school")} />
              {errors.school && <p className="text-sm text-destructive">{errors.school.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="schoolId">School ID</Label>
              <Input id="schoolId" {...register("schoolId")} />
              {errors.schoolId && <p className="text-sm text-destructive">{errors.schoolId.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="schoolIdDbLocation">School ID DB Location</Label>
              <Input id="schoolIdDbLocation" {...register("schoolIdDbLocation")} />
              {errors.schoolIdDbLocation && <p className="text-sm text-destructive">{errors.schoolIdDbLocation.message}</p>}
            </div>
             <div className="space-y-2">
              <Label htmlFor="grade">Grade</Label>
              <Input id="grade" {...register("grade")} />
              {errors.grade && <p className="text-sm text-destructive">{errors.grade.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Spinner className="mr-2" />}
              Sign Up
            </Button>
             <p className="text-sm text-center text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Sign In
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
