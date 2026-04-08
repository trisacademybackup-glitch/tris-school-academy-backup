import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SERVER_URL } from "@/lib/server";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar,
  Clock,
  Users,
  User as UserIcon,
  CalendarDays,
  Filter,
  ChevronDown,
  ChevronUp,
  Download,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { User as UserType, ClassSession } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const TIME_SLOTS = [
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

const TIME_CATEGORIES = {
  morning: ["10:00", "11:00", "12:00"],
  afternoon: ["13:00", "14:00", "15:00"],
  evening: ["16:00", "17:00", "17:30"],
};

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const InstructorSchedulePage = () => {
  const { user } = useAuth();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedInstructor, setSelectedInstructor] = useState<string>(() => {
    if (user && user.role === "instructor") return user.id;
    return "all";
  });
  const [instructors, setInstructors] = useState<UserType[]>([]);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedInstructors, setExpandedInstructors] = useState<Set<string>>(
    new Set(),
  );
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<string>("all");
  const [openTooltips, setOpenTooltips] = useState<{ [key: string]: boolean }>(
    {},
  );

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      const token = localStorage.getItem("token");

      try {
        const [instructorsRes, sessionsRes] = await Promise.all([
          fetch(`${SERVER_URL}/instructor/list`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${SERVER_URL}/booking/sessions`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const instructorsData = await instructorsRes.json();
        const sessionsData = await sessionsRes.json();

        if (
          instructorsData.success &&
          Array.isArray(instructorsData.instructors)
        ) {
          setInstructors(instructorsData.instructors);
        }

        if (sessionsData.success && Array.isArray(sessionsData.sessions)) {
          setSessions(sessionsData.sessions);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
        setInitialLoading(false);
        setRefreshing(false);
      }
    };

    fetchData();
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    const token = localStorage.getItem("token");

    try {
      const [instructorsRes, sessionsRes] = await Promise.all([
        fetch(`${SERVER_URL}/instructor/list`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${SERVER_URL}/booking/sessions`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const instructorsData = await instructorsRes.json();
      const sessionsData = await sessionsRes.json();

      if (
        instructorsData.success &&
        Array.isArray(instructorsData.instructors)
      ) {
        setInstructors(instructorsData.instructors);
      }

      if (sessionsData.success && Array.isArray(sessionsData.sessions)) {
        setSessions(sessionsData.sessions);
      }
    } catch (error) {
      console.error("Failed to refresh data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const toggleInstructor = (instructorId: string) => {
    setExpandedInstructors((prev) => {
      const next = new Set(prev);
      if (next.has(instructorId)) {
        next.delete(instructorId);
      } else {
        next.add(instructorId);
      }
      return next;
    });
  };

  if (!user) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get 7 dates for the current week view, starting from today + weekOffset * 7
  const getWeekDates = () => {
    const dates = [];
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + weekOffset * 7);

    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates();

  // Local date string (avoids UTC timezone shift issues)
  const getLocalDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const isToday = (date: Date) => {
    return getLocalDateString(date) === getLocalDateString(today);
  };

  const isPastDate = (date: Date) => {
    return getLocalDateString(date) < getLocalDateString(today);
  };

  const getSessionStatus = (session: ClassSession | undefined) => {
    if (!session) return "none";
    if (session.students && session.students.length > 0) return "booked";
    return "available";
  };

  const getStatusColor = (status: string, past: boolean) => {
    if (past) {
      switch (status) {
        case "booked":
          return "bg-green-500/10 border-green-500/20";
        case "available":
          return "bg-blue-500/10 border-blue-500/20";
        default:
          return "bg-muted/20 border-border";
      }
    }
    switch (status) {
      case "booked":
        return "bg-green-500/15 border-green-500/30";
      case "available":
        return "bg-blue-500/15 border-blue-500/30";
      default:
        return "bg-muted/30 border-border";
    }
  };

  const filteredInstructors = instructors.filter(
    (i) =>
      selectedInstructor === "all" || (i._id || i.id) === selectedInstructor,
  );

  // Get sessions visible in the current week view
  const getVisibleSessions = () => {
    const weekStart = getLocalDateString(weekDates[0]);
    const weekEnd = getLocalDateString(weekDates[6]);
    return sessions.filter((session) => {
      const sessionDate = getLocalDateString(new Date(session.date));
      return sessionDate >= weekStart && sessionDate <= weekEnd;
    });
  };

  const visibleSessions = getVisibleSessions();

  if (initialLoading) {
    return (
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-7 sm:h-8 w-40 sm:w-48" />
            <Skeleton className="h-4 w-48 sm:w-64" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-6 w-32" />
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                      <Skeleton key={j} className="h-20 w-full" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {user.role === "instructor" ? "My Schedule" : "Schedule Overview"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1 sm:gap-2">
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>
              {weekOffset === 0
                ? "Current week — starting today"
                : weekOffset < 0
                  ? `${Math.abs(weekOffset)} week${Math.abs(weekOffset) > 1 ? "s" : ""} ago`
                  : `${weekOffset} week${weekOffset > 1 ? "s" : ""} ahead`}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="h-8 w-8 sm:h-9 sm:w-9"
                >
                  <RefreshCw
                    className={cn(
                      "h-3 w-3 sm:h-4 sm:w-4",
                      refreshing && "animate-spin",
                    )}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh schedule</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Week Navigation */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setWeekOffset((w) => w - 1)}
              className="h-8 w-8 sm:h-9 sm:w-9"
            >
              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>

            <Button
              variant={weekOffset === 0 ? "default" : "outline"}
              size="sm"
              onClick={() => setWeekOffset(0)}
              disabled={false}
              className="text-xs sm:text-sm h-8 sm:h-9 min-w-[140px] sm:min-w-[160px]"
            >
              {weekOffset === 0
                ? "Today"
                : `${weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekDates[6].toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setWeekOffset((w) => w + 1)}
              className="h-8 w-8 sm:h-9 sm:w-9"
            >
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Schedule Cards */}
      {loading && !refreshing && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 sm:gap-3 text-muted-foreground">
            <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
            <span className="text-sm sm:text-base">Loading schedule...</span>
          </div>
        </div>
      )}

      {filteredInstructors.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
            </div>
            <p className="text-base sm:text-lg font-medium text-muted-foreground text-center">
              No instructors found
            </p>
            <p className="text-sm text-muted-foreground mt-1 text-center">
              {user.role === "instructor"
                ? "Your schedule will appear here"
                : "Try adjusting your filters"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {filteredInstructors.map((instructor) => {
            const instId = instructor._id || instructor.id;
            const isExpanded = expandedInstructors.has(instId);

            // All sessions for this instructor (not just future ones)
            const instructorSessions = sessions.filter(
              (s) => (s.instructor?._id || s.instructorId) === instId,
            );

            // Sessions visible in current week view
            const instructorVisibleSessions = visibleSessions.filter(
              (s) => (s.instructor?._id || s.instructorId) === instId,
            );

            // Get unique slots from ALL instructor sessions (so time rows are consistent across weeks)
            const slotsSet = new Set(
              instructorSessions.map((s) => s.startTime || s.timeSlot),
            );
            let slots = slotsSet.size > 0 ? Array.from(slotsSet) : TIME_SLOTS;

            // Apply time filter
            if (selectedTimeFilter !== "all") {
              slots = slots.filter((slot) =>
                TIME_CATEGORIES[
                  selectedTimeFilter as keyof typeof TIME_CATEGORIES
                ]?.includes(slot),
              );
            }

            // Sort slots chronologically
            slots.sort((a, b) => a.localeCompare(b));

            return (
              <Card
                key={instId}
                className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20 overflow-hidden"
              >
                {/* Instructor Header */}
                <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent p-4 sm:p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <Avatar className="h-12 w-12 sm:h-14 sm:w-14 border-2 border-primary/20">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm sm:text-base">
                          {(instructor.name || "U")
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="font-display text-lg sm:text-xl">
                          {instructor.name || "Unknown Instructor"}
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {instructorVisibleSessions.length} sessions this
                            view
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {slots.length} time slots
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Expand/Collapse Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleInstructor(instId)}
                      className="hidden sm:inline-flex"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                  {/* Horizontal Scrollable Schedule */}
                  <div className="relative">
                    <ScrollArea className="w-full whitespace-nowrap rounded-lg">
                      <div className="min-w-[900px] lg:min-w-full">
                        {/* Week Days Header */}
                        <div className="grid grid-cols-8 gap-2 mb-3 sm:mb-4 px-1">
                          <div className="col-span-1 text-xs sm:text-sm font-medium text-muted-foreground sticky left-0 bg-background z-10">
                            Time
                          </div>
                          {weekDates.map((date) => {
                            const past = isPastDate(date);
                            return (
                              <div
                                key={date.toISOString()}
                                className={cn(
                                  "col-span-1 text-center",
                                  isToday(date) && "text-primary font-semibold",
                                  past && "opacity-60",
                                )}
                              >
                                <div className="text-xs sm:text-sm font-medium">
                                  {WEEKDAYS[date.getDay()].slice(0, 3)}
                                </div>
                                <Badge
                                  variant={
                                    isToday(date) ? "default" : "outline"
                                  }
                                  className={cn(
                                    "mt-1 text-[10px] sm:text-xs",
                                    isToday(date)
                                      ? "bg-primary"
                                      : "bg-muted/50",
                                  )}
                                >
                                  {date.getDate()}
                                </Badge>
                                {past && (
                                  <div className="text-[9px] text-muted-foreground/50 mt-0.5">
                                    past
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Time Slots */}
                        <div className="space-y-2">
                          {slots.map((slot) => (
                            <div
                              key={slot}
                              className="grid grid-cols-8 gap-2 items-stretch px-1"
                            >
                              {/* Time Column */}
                              <div className="col-span-1 flex items-center text-xs sm:text-sm font-medium text-muted-foreground sticky left-0 bg-background z-10">
                                <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                                <span className="truncate">{slot}</span>
                              </div>

                              {/* Days Columns */}
                              {weekDates.map((date) => {
                                const dateStr = getLocalDateString(date);
                                const past = isPastDate(date);

                                // Search ALL sessions (not just future ones)
                                const session = sessions.find(
                                  (s) =>
                                    (s.instructor?._id || s.instructorId) ===
                                      instId &&
                                    (s.startTime || s.timeSlot) === slot &&
                                    getLocalDateString(new Date(s.date)) ===
                                      dateStr,
                                );

                                const status = getSessionStatus(session);
                                const students: Array<{
                                  name?: string;
                                  phone?: string;
                                }> = session?.students || [];

                                const cellKey = `${instId}-${slot}-${dateStr}`;

                                return (
                                  <TooltipProvider key={dateStr}>
                                    <Tooltip
                                      open={openTooltips[cellKey] || false}
                                      onOpenChange={(open) =>
                                        setOpenTooltips((prev) => ({
                                          ...prev,
                                          [cellKey]: open,
                                        }))
                                      }
                                    >
                                      <TooltipTrigger
                                        asChild
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setOpenTooltips((prev) => ({
                                            ...prev,
                                            [cellKey]: !prev[cellKey],
                                          }));
                                        }}
                                        tabIndex={0}
                                      >
                                        <div
                                          className={cn(
                                            "col-span-1 p-2 sm:p-3 rounded-lg border text-xs transition-all cursor-pointer",
                                            getStatusColor(status, past),
                                            isToday(date) &&
                                              "ring-1 ring-primary/20",
                                            past && "opacity-70",
                                          )}
                                        >
                                          {students.length > 0 ? (
                                            <div className="flex flex-col items-center justify-center min-h-[3rem] sm:min-h-[4rem]">
                                              {students &&
                                              students.length === 1 ? (
                                                <div className="text-center">
                                                  <span className="text-[8px] capitalize sm:text-xs font-medium block truncate max-w-full">
                                                    {students[0]?.name
                                                      ? students[0].name
                                                          .toLowerCase()
                                                          .split(" ")
                                                          .slice(0, 2)
                                                          .join(" ")
                                                      : "Student"}
                                                  </span>
                                                  <span className="text-[8px] capitalize sm:text-xs font-medium block truncate max-w-full">
                                                    {students[0]?.phone
                                                      ? students[0].phone
                                                      : "N/A"}
                                                  </span>
                                                  <span className="text-[8px] sm:text-[10px] text-green-600 dark:text-green-400">
                                                    {past
                                                      ? "Was Booked"
                                                      : "Booked"}
                                                  </span>
                                                </div>
                                              ) : (
                                                <>
                                                  <div className="flex -space-x-1 mb-1">
                                                    {students
                                                      .slice(0, 2)
                                                      .map(
                                                        (stu: {
                                                          _id?: string;
                                                          id: string;
                                                          name: string;
                                                          phone: string;
                                                        }) => (
                                                          <div
                                                            key={
                                                              stu._id || stu.id
                                                            }
                                                            className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-green-500 border-2 border-background flex items-center justify-center"
                                                            title={
                                                              stu.name
                                                                ?.toLowerCase()
                                                                .split(" ")
                                                                .slice(0, 2)
                                                                .join(" ") ||
                                                              "Student"
                                                            }
                                                          >
                                                            <span className="text-[8px] sm:text-[10px] font-medium text-white">
                                                              {stu.name
                                                                ? stu.name[0].toUpperCase()
                                                                : "S"}
                                                            </span>
                                                          </div>
                                                        ),
                                                      )}
                                                    {students.length > 2 && (
                                                      <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-green-500/50 border-2 border-background flex items-center justify-center">
                                                        <span className="text-[8px] sm:text-[10px] font-medium text-white">
                                                          +{students.length - 2}
                                                        </span>
                                                      </div>
                                                    )}
                                                  </div>
                                                  <span className="text-[8px] sm:text-[10px] font-medium">
                                                    {students.length} students
                                                  </span>
                                                </>
                                              )}
                                            </div>
                                          ) : status === "available" ? (
                                            <div className="flex flex-col items-center justify-center min-h-[3rem] sm:min-h-[4rem]">
                                              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 mb-1" />
                                              <span className="text-[8px] sm:text-[10px] text-blue-600 dark:text-blue-400">
                                                {past
                                                  ? "Was Available"
                                                  : "Available"}
                                              </span>
                                            </div>
                                          ) : (
                                            <div className="flex flex-col items-center justify-center min-h-[3rem] sm:min-h-[4rem]">
                                              <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground mb-1" />
                                              <span className="text-[8px] sm:text-[10px] text-muted-foreground">
                                                No session
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent
                                        side="top"
                                        className="text-xs max-w-[200px]"
                                      >
                                        {status === "booked" ? (
                                          <div className="space-y-1">
                                            <p className="font-semibold text-green-600 dark:text-green-400">
                                              {past
                                                ? "Past Booked Session"
                                                : "Booked Session"}
                                            </p>
                                            <p className="text-muted-foreground">
                                              {slot} with {instructor.name}
                                            </p>
                                            <Separator className="my-1" />
                                            <p className="font-medium">
                                              Students:
                                            </p>
                                            {students.map(
                                              (stu: {
                                                _id?: string;
                                                id: string;
                                                name: string;
                                                phone: string;
                                              }) => (
                                                <p
                                                  key={stu._id || stu.id}
                                                  className="flex items-center gap-1"
                                                >
                                                  <UserIcon className="h-3 w-3" />
                                                  {`${stu.name} (${stu.phone})`}
                                                </p>
                                              ),
                                            )}
                                          </div>
                                        ) : status === "available" ? (
                                          <div>
                                            <p className="font-semibold text-blue-600 dark:text-blue-400">
                                              {past
                                                ? "Past Available Slot"
                                                : "Available Slot"}
                                            </p>
                                            <p className="text-muted-foreground">
                                              {slot}{" "}
                                              {past
                                                ? "was available"
                                                : "is available for booking"}
                                            </p>
                                          </div>
                                        ) : (
                                          <div>
                                            <p className="font-semibold text-muted-foreground">
                                              No Session
                                            </p>
                                            <p className="text-muted-foreground">
                                              No class scheduled at {slot}
                                            </p>
                                          </div>
                                        )}
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  </div>

                  {/* Stats Footer */}
                  <div className="mt-4 pt-4 border-t flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        <span className="hidden xs:inline">Booked</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-blue-500" />
                        <span className="hidden xs:inline">Available</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <XCircle className="h-3 w-3 text-muted-foreground" />
                        <span className="hidden xs:inline">No session</span>
                      </span>
                    </div>

                    <Badge variant="outline" className="text-[10px] sm:text-xs">
                      {slots.length} time slots
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Weekly Summary Card */}
      <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/10">
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-primary">
                {visibleSessions.filter((s) => s.students?.length > 0).length}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Booked This View
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-green-500">
                {visibleSessions.filter((s) => !s.students?.length).length}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Available This View
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-blue-500">
                {instructors.length}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Instructors
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-purple-500">
                {weekDates.length}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Days Shown
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstructorSchedulePage;
