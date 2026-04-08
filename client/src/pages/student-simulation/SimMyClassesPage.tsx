import React, { useEffect, useState } from "react";
import { useSimulation } from "@/contexts/SimulationContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SERVER_URL } from "@/lib/server";
import {
  Calendar,
  Clock,
  User,
  Loader2,
  CalendarCheck,
  History,
  AlertCircle,
  CheckCircle2,
  CarFront,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SessionWithBookings {
  _id: string;
  instructor?: { _id?: string; name?: string; email?: string };
  students?: Array<{ _id?: string; name?: string }>;
  date: string;
  startTime?: string;
  timeSlot?: string;
  bookings?: Array<{ student?: string | { _id?: string }; status?: string }>;
}

const SimMyClassesPage = () => {
  const { simulatedStudent } = useSimulation();
  const [sessions, setSessions] = useState<SessionWithBookings[]>([]);
  const [loading, setLoading] = useState(true);

  const studentId = simulatedStudent?._id || simulatedStudent?.id || "";

  const fetchSessions = () => {
    if (!studentId) return;
    setLoading(true);
    const token = localStorage.getItem("token");

    fetch(`${SERVER_URL}/admin/simulate/sessions?studentId=${studentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setSessions(data.sessions || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSessions();
  }, [studentId]);

  if (!simulatedStudent) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getLocalDateObj = (dateStr: string) => {
    const d = new Date(dateStr);
    return d;
  };

  // Filter sessions where this student has a booking
  const mySessions = sessions.filter((s) => {
    const inStudents = s.students?.some((st) =>
      typeof st === "object" ? st._id === studentId : st === studentId,
    );
    const inBookings = s.bookings?.some((b) => {
      const bStudent =
        typeof b.student === "object" ? b.student?._id : b.student;
      return bStudent === studentId && b.status === "booked";
    });
    return inStudents || inBookings;
  });

  const upcomingSessions = mySessions
    .filter((s) => getLocalDateObj(s.date) >= today)
    .sort(
      (a, b) =>
        getLocalDateObj(a.date).getTime() - getLocalDateObj(b.date).getTime(),
    );

  const pastSessions = mySessions
    .filter((s) => getLocalDateObj(s.date) < today)
    .sort(
      (a, b) =>
        getLocalDateObj(b.date).getTime() - getLocalDateObj(a.date).getTime(),
    );

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  const ClassCard = ({
    session,
    isPast,
  }: {
    session: SessionWithBookings;
    isPast: boolean;
  }) => {
    const sessionDate = getLocalDateObj(session.date);
    const isToday = sessionDate.toDateString() === new Date().toDateString();
    const isTomorrow =
      sessionDate.toDateString() ===
      new Date(Date.now() + 86400000).toDateString();

    return (
      <Card
        className={cn(
          "transition-all duration-200",
          isToday && !isPast && "border-primary/50 bg-primary/5",
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              {/* Date Block */}
              <div
                className={cn(
                  "w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0 text-center",
                  isPast
                    ? "bg-muted"
                    : isToday
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary/10",
                )}
              >
                <p
                  className={cn(
                    "text-[10px] font-medium uppercase",
                    isPast
                      ? "text-muted-foreground"
                      : isToday
                        ? "text-primary-foreground/80"
                        : "text-primary",
                  )}
                >
                  {sessionDate.toLocaleDateString("en-US", { month: "short" })}
                </p>
                <p
                  className={cn(
                    "text-xl font-bold leading-none",
                    isPast
                      ? "text-foreground"
                      : isToday
                        ? "text-primary-foreground"
                        : "text-primary",
                  )}
                >
                  {sessionDate.getDate()}
                </p>
                <p
                  className={cn(
                    "text-[9px]",
                    isPast
                      ? "text-muted-foreground"
                      : isToday
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground",
                  )}
                >
                  {sessionDate.toLocaleDateString("en-US", {
                    weekday: "short",
                  })}
                </p>
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold">
                    {sessionDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  {isToday && !isPast && (
                    <Badge className="text-xs">Today</Badge>
                  )}
                  {isTomorrow && !isPast && (
                    <Badge variant="secondary" className="text-xs">
                      Tomorrow
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {session.startTime || session.timeSlot || "—"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    {session.instructor?.name || "Unknown Instructor"}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  {isPast ? (
                    <Badge variant="outline" className="text-xs bg-muted">
                      <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
                      Completed
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-xs border-primary/30 text-primary"
                    >
                      <Calendar className="h-3 w-3 mr-1" />
                      Upcoming
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Instructor Avatar */}
            {session.instructor?.name && (
              <Avatar className="h-10 w-10 border-2 border-border flex-shrink-0">
                <AvatarFallback className="text-xs bg-muted">
                  {getInitials(session.instructor.name)}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <Skeleton className="h-14 w-14 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">My Classes</h1>
          <p className="text-muted-foreground mt-1">
            {simulatedStudent.name}'s upcoming and past driving sessions
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSessions}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Badges */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 border border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
          <CalendarCheck className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800 dark:text-blue-400">
            {upcomingSessions.length} upcoming
          </span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 border border-green-200 dark:bg-green-950/20 dark:border-green-800">
          <History className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-800 dark:text-green-400">
            {pastSessions.length} completed
          </span>
        </div>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList className="grid grid-cols-2 w-full max-w-xs">
          <TabsTrigger value="upcoming" className="gap-2">
            <CalendarCheck className="h-4 w-4" />
            Upcoming ({upcomingSessions.length})
          </TabsTrigger>
          <TabsTrigger value="past" className="gap-2">
            <History className="h-4 w-4" />
            Past ({pastSessions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4 space-y-3">
          {upcomingSessions.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CarFront className="h-12 w-12 text-muted-foreground/40 mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  No upcoming classes
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  This student has no classes booked yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="max-h-[600px]">
              <div className="space-y-3 pr-1">
                {upcomingSessions.map((s) => (
                  <ClassCard key={s._id} session={s} isPast={false} />
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-4 space-y-3">
          {pastSessions.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <History className="h-12 w-12 text-muted-foreground/40 mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  No past classes
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  This student hasn't attended any classes yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="max-h-[600px]">
              <div className="space-y-3 pr-1">
                {pastSessions.map((s) => (
                  <ClassCard key={s._id} session={s} isPast={true} />
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SimMyClassesPage;
