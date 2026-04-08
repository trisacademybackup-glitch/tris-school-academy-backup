import { useState, useCallback, useEffect } from "react";
import { useSimulation } from "@/contexts/SimulationContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SERVER_URL } from "@/lib/server";
import { User, ClassSession } from "@/lib/types";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Calendar,
  CheckCircle2,
  XCircle,
  BookOpen,
  CalendarDays,
  Filter,
  Info,
  Shield,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type ClassSessionWithBookings = ClassSession & {
  bookings?: Array<{ _id?: string; student?: string | { _id?: string } }>;
  instructor?: { _id?: string; name?: string };
};

const FALLBACK_SLOTS = [
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "17:30",
];

const TIME_SLOT_CATEGORIES = {
  morning: ["10:00", "11:00", "12:00"],
  afternoon: ["13:00", "14:00", "15:00"],
  evening: ["16:00", "17:00", "17:30"],
};

const SimBookingPage = () => {
  const { simulatedStudent } = useSimulation();

  const studentId = simulatedStudent?._id || simulatedStudent?.id || "";

  const getLocalToday = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const [selectedDate, setSelectedDate] = useState(getLocalToday);
  const [selectedInstructor, setSelectedInstructor] = useState("all");
  const [selectedTimeCategory, setSelectedTimeCategory] = useState("all");
  const [sessions, setSessions] = useState<ClassSessionWithBookings[]>([]);
  const [instructors, setInstructors] = useState<User[]>([]);
  const [defaultSlots, setDefaultSlots] = useState<string[]>(FALLBACK_SLOTS);
  const [bookingAheadDays, setBookingAheadDays] = useState(2);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [allowMultipleStudentsPerSlot, setAllowMultipleStudentsPerSlot] =
    useState(false);
  const [studentsPerSlot, setStudentsPerSlot] = useState(1);

  useEffect(() => {
    if (!studentId) return;
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    fetch(`${SERVER_URL}/booking/settings`, { headers })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setDefaultSlots(
            data.defaultSlots?.length ? data.defaultSlots : FALLBACK_SLOTS,
          );
          setBookingAheadDays(data.bookingAheadDays ?? 2);
          setAllowMultipleStudentsPerSlot(
            data.allowMultipleStudentsPerSlot ?? false,
          );
          setStudentsPerSlot(data.studentsPerSlot ?? 1);
        }
      })
      .catch(() => {});
  }, [studentId]);

  const fetchData = useCallback(() => {
    if (!studentId) return;
    setLoading(true);
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${SERVER_URL}/admin/simulate/sessions?studentId=${studentId}`, {
        headers,
      }).then((r) => r.json()),
      fetch(`${SERVER_URL}/instructor/list`, { headers }).then((r) => r.json()),
    ])
      .then(([sessionsData, instructorsData]) => {
        if (sessionsData.success) setSessions(sessionsData.sessions || []);
        if (instructorsData.success)
          setInstructors(instructorsData.instructors || []);
      })
      .catch(console.error)
      .finally(() => {
        setLoading(false);
        setInitialLoading(false);
      });
  }, [studentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!simulatedStudent) return null;

  const getLocalDateString = (date: string | Date) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const getLocalDateObj = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const sessionsByInstructor: Record<
    string,
    Record<string, ClassSessionWithBookings>
  > = {};
  sessions.forEach((s) => {
    const sessionDate = getLocalDateString(s.date);
    if (sessionDate !== selectedDate) return;
    const instId = s.instructor?._id || s.instructorId;
    if (!instId) return;
    if (!sessionsByInstructor[instId]) sessionsByInstructor[instId] = {};
    sessionsByInstructor[instId][s.startTime || s.timeSlot] = s;
  });

  const navigateDate = (dir: number) => {
    const d = getLocalDateObj(selectedDate);
    d.setDate(d.getDate() + dir);
    setSelectedDate(getLocalDateString(d));
  };

  const selectedDateObj = getLocalDateObj(selectedDate);
  const dayName = selectedDateObj.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const todayObj = new Date();
  todayObj.setHours(0, 0, 0, 0);
  const isToday = selectedDateObj.getTime() === todayObj.getTime();

  const filteredInstructors = instructors.filter(
    (inst) =>
      selectedInstructor === "all" ||
      (inst._id || inst.id) === selectedInstructor,
  );

  const maxStudents = allowMultipleStudentsPerSlot ? studentsPerSlot : 1;

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  if (initialLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((j) => (
                    <Skeleton key={j} className="h-20 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Book a Driving Class
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            This is what {simulatedStudent.name} sees on their booking page
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1">
            <BookOpen className="h-4 w-4 mr-2" />
            {instructors.length} Instructors
          </Badge>
          <Badge className="bg-amber-500 text-white border-0 px-3 py-1 gap-1.5">
            <Lock className="h-3 w-3" />
            Read-only
          </Badge>
        </div>
      </div>

      {/* Date Navigation */}
      <Card className="border-primary/10 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="p-4">
          <div className="flex flex-wrap md:flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateDate(-1)}
                className="h-9 w-9"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div
                className={cn(
                  "px-6 py-2 rounded-lg border text-center min-w-[240px]",
                  isToday && "bg-primary/5 border-primary/20",
                )}
              >
                <p className="font-display font-semibold flex items-center justify-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  {dayName}
                </p>
                {isToday && (
                  <Badge variant="secondary" className="mt-1 text-xs">
                    Today
                  </Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateDate(1)}
                className="h-9 w-9"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDate(getLocalToday())}
                className="ml-2 hidden md:flex"
              >
                Today
              </Button>
            </div>
            <div className="flex flex-wrap gap-3">
              <Select
                value={selectedInstructor}
                onValueChange={setSelectedInstructor}
              >
                <SelectTrigger className="w-[200px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Instructors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Instructors</SelectItem>
                  {instructors.map((i) => (
                    <SelectItem key={i._id || i.id} value={i._id || i.id}>
                      {i.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Tabs
                value={selectedTimeCategory}
                onValueChange={setSelectedTimeCategory}
                className="w-[300px]"
              >
                <TabsList className="grid grid-cols-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="morning">Morning</TabsTrigger>
                  <TabsTrigger value="afternoon">Afternoon</TabsTrigger>
                  <TabsTrigger value="evening">Evening</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Instructor Cards */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        {filteredInstructors.map((instructor) => {
          const instId = instructor._id || instructor.id;
          const slots = instructor.slots?.length
            ? instructor.slots
            : defaultSlots;
          const slotMap = sessionsByInstructor[instId] || {};

          const filteredSlots = slots.filter((slot: string) => {
            if (selectedTimeCategory === "all") return true;
            return TIME_SLOT_CATEGORIES[
              selectedTimeCategory as keyof typeof TIME_SLOT_CATEGORIES
            ]?.includes(slot);
          });

          const availableSlots = filteredSlots.filter((slot: string) => {
            const session = slotMap[slot];
            if (!session) return true;
            return (session.bookings?.length ?? 0) < maxStudents;
          }).length;

          return (
            <Card key={instId} className="border-2 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border-2 border-primary/20">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(instructor.name || "?")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="font-display text-lg">
                        {instructor.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {availableSlots} available
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {filteredSlots.length} total
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <ScrollArea className="h-[280px] pr-4">
                  <div className="grid grid-cols-3 gap-3">
                    {filteredSlots.map((slot: string) => {
                      const session = slotMap[slot];
                      const bookingCount = session?.bookings?.length ?? 0;

                      const isMyBooking = session?.bookings?.some((b) => {
                        const bStudent =
                          typeof b.student === "object"
                            ? b.student?._id
                            : b.student;
                        return bStudent === studentId;
                      });

                      const isFull =
                        bookingCount >= maxStudents && !isMyBooking;

                      let statusText = "";
                      if (isMyBooking) statusText = "Booked ✓";
                      else if (isFull) statusText = "Full";
                      else
                        statusText = allowMultipleStudentsPerSlot
                          ? `${bookingCount}/${maxStudents}`
                          : "Available";

                      return (
                        <div
                          key={slot}
                          className={cn(
                            "w-full flex flex-col items-center p-3 rounded-lg border text-sm relative overflow-hidden cursor-default",
                            isMyBooking &&
                              "bg-primary text-primary-foreground border-primary",
                            isFull &&
                              !isMyBooking &&
                              "bg-muted text-muted-foreground opacity-50 border-muted",
                            !isMyBooking && !isFull && "bg-card border-border",
                          )}
                        >
                          <Clock
                            className={cn(
                              "w-4 h-4 mb-1",
                              isMyBooking && "text-primary-foreground",
                            )}
                          />
                          <span
                            className={cn(
                              "font-medium",
                              isMyBooking && "text-primary-foreground",
                            )}
                          >
                            {slot}
                          </span>
                          <span
                            className={cn(
                              "text-xs mt-1 flex items-center gap-1",
                              isMyBooking
                                ? "text-primary-foreground/90"
                                : "text-muted-foreground",
                            )}
                          >
                            {isMyBooking ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : isFull ? (
                              <XCircle className="h-3 w-3" />
                            ) : (
                              <Clock className="h-3 w-3" />
                            )}
                            {statusText}
                          </span>
                          {/* Lock overlay for read-only */}
                          {!isMyBooking && !isFull && (
                            <div className="absolute top-1 right-1">
                              <Lock className="h-2.5 w-2.5 text-muted-foreground/40" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>

                <Separator className="my-4" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-primary" /> Booked
                      by student
                    </span>
                    <span className="flex items-center gap-1">
                      <XCircle className="h-3 w-3" /> Full
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Available
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default SimBookingPage;
