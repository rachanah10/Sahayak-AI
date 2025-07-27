
"use client";

import { useState } from "react";
import { startOfMonth } from "date-fns";
import { PageHeader } from "@/components/page-header";
import { CalendarDays } from "lucide-react";
import { CalendarView, type CalendarEvent } from "@/components/calendar-view";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

const mockEvents: CalendarEvent[] = [
    { 
        date: new Date(2024, 7, 5), 
        title: "Intro to Photosynthesis",
        description: "5th Grade: Discuss the basic concept and importance of photosynthesis.\n7th Grade: Detail the chemical equation and the role of chlorophyll."
    },
    { 
        date: new Date(2024, 7, 7), 
        title: "The Mughal Empire",
        description: "6th Grade: Introduction to Babur and the founding of the empire."
    },
     { 
        date: new Date(2024, 7, 8), 
        title: "Algebra Basics",
        description: "8th Grade: Solving linear equations with one variable."
    },
];


export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date(2024, 7, 1)));
  const [events, setEvents] = useState<CalendarEvent[]>(mockEvents);

  return (
    <div className="flex flex-col gap-8">
        <PageHeader
            title="Calendar"
            description="View your lesson plans and events."
            Icon={CalendarDays}
        />
        
        <Alert>
            <AlertTitle>Coming Soon!</AlertTitle>
            <AlertDescription>
                We're working on integrating with Google Calendar to make managing your schedule even easier.
            </AlertDescription>
        </Alert>

        <Card>
            <CardHeader>
                <CardTitle>Lesson Calendar</CardTitle>
                <CardDescription>Your saved lesson plans are shown here.</CardDescription>
            </CardHeader>
            <CardContent>
                <CalendarView
                    events={events}
                    month={currentMonth}
                    setMonth={setCurrentMonth}
                />
            </CardContent>
        </Card>
    </div>
  );
}

