
"use client";

import React from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"


export interface CalendarEvent {
  date: Date;
  title: string;
  description: string;
}

interface CalendarViewProps {
  events: CalendarEvent[];
  month: Date;
  setMonth: (date: Date) => void;
}

export function CalendarView({ events, month, setMonth }: CalendarViewProps) {
  const [selectedDayEvents, setSelectedDayEvents] = React.useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  
  const firstDayOfMonth = startOfMonth(month);
  const lastDayOfMonth = endOfMonth(month);

  const daysInMonth = eachDayOfInterval({
    start: startOfWeek(firstDayOfMonth),
    end: endOfWeek(lastDayOfMonth),
  });

  const getEventsForDay = (day: Date) => {
    return events.filter(event => isSameDay(event.date, day));
  };
  
  const handleDayClick = (day: Date, dayEvents: CalendarEvent[]) => {
    if (dayEvents.length > 0) {
        setSelectedDate(day);
        setSelectedDayEvents(dayEvents);
        setIsDialogOpen(true);
    }
  }

  const nextMonth = () => setMonth(addMonths(month, 1));
  const prevMonth = () => setMonth(subMonths(month, 1));

  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <Button variant="outline" size="icon" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-bold">{format(month, 'MMMM yyyy')}</h2>
        <Button variant="outline" size="icon" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 text-center font-semibold text-sm text-muted-foreground">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="py-2">{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 grid-rows-5 gap-1">
        {daysInMonth.map(day => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, month);

          return (
            <div
              key={day.toString()}
              onClick={() => handleDayClick(day, dayEvents)}
              className={cn(
                "border rounded-md h-28 p-1 text-sm overflow-y-auto",
                !isCurrentMonth && "bg-muted/50 text-muted-foreground",
                isToday(day) && "bg-accent/20",
                dayEvents.length > 0 && "cursor-pointer hover:bg-muted/80 transition-colors"
              )}
            >
              <div className={cn("font-bold", isToday(day) && "text-primary")}>
                {format(day, 'd')}
              </div>
              <TooltipProvider>
                <div className="mt-1 space-y-1">
                  {dayEvents.map((event, i) => (
                     <Tooltip key={i} delayDuration={300}>
                        <TooltipTrigger asChild>
                            <Badge className="w-full text-left justify-start truncate cursor-pointer">
                                {event.title}
                            </Badge>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs whitespace-pre-wrap">
                            <p className="font-bold">{event.title}</p>
                            <p>{event.description}</p>
                        </TooltipContent>
                     </Tooltip>
                  ))}
                </div>
              </TooltipProvider>
            </div>
          );
        })}
      </div>
      
       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {selectedDate ? `Lesson Plan for ${format(selectedDate, 'PPP')}` : 'Lesson Plan'}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-4">
                    {selectedDayEvents.length > 0 ? selectedDayEvents.map((event, index) => (
                        <div key={index} className="pb-4 border-b last:border-b-0">
                            <h3 className="font-semibold text-lg mb-1">{event.title}</h3>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{event.description}</p>
                        </div>
                    )) : (
                        <p>No lesson plans for this day.</p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    </div>
  );
}
