
"use client";

import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  LayoutDashboard,
  BookOpen,
  NotebookTabs,
  MessageSquare,
  ClipboardCheck,
  CalendarDays,
  Image as ImageIcon,
  Users,
  ArrowRight,
  Library,
} from "lucide-react";
import React from 'react';
import { useAuth } from "@/hooks/use-auth";

const features = [
  {
    title: "Content Generator",
    description: "Create localized, culturally relevant stories and worksheets.",
    href: "/content-generator",
    Icon: BookOpen,
  },
   {
    title: "Content Library",
    description: "View and manage all your generated and saved content.",
    href: "/content-library",
    Icon: Library,
  },
  {
    title: "Homework",
    description: "Generate multi-level worksheets from a textbook image.",
    href: "/homework",
    Icon: NotebookTabs,
  },
  {
    title: "Teaching Assistant",
    description: "Ask teaching questions and get instant answers.",
    href: "/teaching-assistant",
    Icon: MessageSquare,
  },
  {
    title: "Assessment Generator",
    description: "Create on-demand oral or written assessment questions.",
    href: "/assessment-generator",
    Icon: ClipboardCheck,
  },
  {
    title: "Lesson Planner",
    description: "Craft weekly lesson plans based on syllabus and grade.",
    href: "/lesson-planner",
    Icon: CalendarDays,
  },
  {
    title: "Visual Aid Generator",
    description: "Generate blackboard-friendly diagrams from text.",
    href: "/visual-aid",
    Icon: ImageIcon,
  },
  {
    title: "Progress Tracker",
    description: "Log student skill levels and get AI-powered suggestions.",
    href: "/progress-tracker",
    Icon: Users,
  },
];

export default function DashboardPage({ params }: { params: {} }) {
  React.use(params);
  const { user } = useAuth();
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Welcome to Sahayak, {user?.name || 'your AI Teaching Companion'}!
        </h1>
        <p className="text-muted-foreground">
          Select a tool below to get started.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <Link href={feature.href} key={feature.href} className="group">
            <Card className="h-full transition-all duration-300 ease-in-out hover:shadow-lg hover:border-primary/50 transform hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium">
                  {feature.title}
                </CardTitle>
                <feature.Icon className="w-6 h-6 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
              <div className="flex items-center p-6 pt-0 justify-end">
                  <ArrowRight className="w-4 h-4 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-primary"/>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
