import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SERVER_URL } from "@/lib/server";
import { ChevronLeft, ChevronRight, Loader, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { User as UserType, ClassSession } from "@/lib/types";

const MangersSchedulePage = () => {
  const { user } = useAuth();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedInstructor, setSelectedInstructor] = useState<string>("all");
  const [instructors, setInstructors] = useState<UserType[]>([]);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingInstructors, setLoadingInstructors] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      setLoadingInstructors(true);
      const token = localStorage.getItem("token");

      try {
        const instructorsRes = await fetch(`${SERVER_URL}/instructor/list`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const instructorsData = await instructorsRes.json();
        if (
          instructorsData.success &&
          Array.isArray(instructorsData.instructors)
        ) {
          setInstructors(instructorsData.instructors);
        } else {
          setInstructors([]);
        }
      } catch (error) {
        console.error("Error fetching instructors:", error);
        setInstructors([]);
      } finally {
        setLoadingInstructors(false);
      }

      try {
        const sessionsRes = await fetch(`${SERVER_URL}/booking/sessions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const sessionsData = await sessionsRes.json();
        if (sessionsData.success && Array.isArray(sessionsData.sessions)) {
          setSessions(sessionsData.sessions);
        } else {
          setSessions([]);
        }
      } catch (error) {
        console.error("Error fetching sessions:", error);
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (!user) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

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

  const getLocalDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getVisibleSessions = () => {
    const weekStart = getLocalDateString(weekDates[0]);
    const weekEnd = getLocalDateString(weekDates[6]);
    return sessions.filter((session) => {
      const sessionDate = getLocalDateString(new Date(session.date));
      return sessionDate >= weekStart && sessionDate <= weekEnd;
    });
  };

  const visibleSessions = getVisibleSessions();

  const getAllTimeSlots = () => {
    const slots = new Set<string>();
    sessions.forEach((session) => {
      if (session.startTime || session.timeSlot) {
        slots.add(session.startTime || session.timeSlot);
      }
    });
    if (slots.size === 0) {
      return [
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
    }
    return Array.from(slots).sort();
  };

  const timeSlots = getAllTimeSlots();

  const filteredInstructors = instructors.filter((inst) => {
    if (selectedInstructor === "all") return true;
    return (inst._id || inst.id) === selectedInstructor;
  });

  const getSessionForSlot = (
    instructor: UserType,
    date: Date,
    timeSlot: string,
  ) => {
    const dateStr = getLocalDateString(date);
    const instructorId = instructor._id || instructor.id;
    return sessions.find((s) => {
      const sessionInstructorId = s.instructor?._id || s.instructorId;
      const sessionDate = getLocalDateString(new Date(s.date));
      const sessionTime = s.startTime || s.timeSlot;
      return (
        sessionInstructorId === instructorId &&
        sessionDate === dateStr &&
        sessionTime === timeSlot
      );
    });
  };

  const isPastDate = (date: Date) =>
    getLocalDateString(date) < getLocalDateString(today);
  const isToday = (date: Date) =>
    getLocalDateString(date) === getLocalDateString(today);

  const totalBookedSessions = sessions.filter(
    (s) => s.students?.length > 0,
  ).length;
  const totalAvailableSessions = sessions.filter(
    (s) => !s.students?.length,
  ).length;
  const visibleBooked = visibleSessions.filter(
    (s) => s.students?.length > 0,
  ).length;
  const visibleAvailable = visibleSessions.filter(
    (s) => !s.students?.length,
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Schedule Overview</h1>
          <p className="text-muted-foreground mt-1">
            {weekOffset === 0
              ? "Current week — starting today"
              : weekOffset < 0
                ? `${Math.abs(weekOffset)} week${Math.abs(weekOffset) > 1 ? "s" : ""} ago`
                : `${weekOffset} week${weekOffset > 1 ? "s" : ""} ahead`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setWeekOffset((w) => w - 1)}
            disabled={loading}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant={weekOffset === 0 ? "default" : "outline"}
            size="sm"
            onClick={() => setWeekOffset(0)}
            disabled={loading}
            className="min-w-[160px] text-xs font-medium"
          >
            {weekOffset === 0
              ? "Today"
              : `${weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekDates[6].toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setWeekOffset((w) => w + 1)}
            disabled={loading}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Select
            value={selectedInstructor}
            onValueChange={setSelectedInstructor}
            disabled={loadingInstructors || instructors.length === 0}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by instructor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>All Instructors</span>
                </div>
              </SelectItem>
              {instructors.map((instructor) => (
                <SelectItem
                  key={instructor._id || instructor.id}
                  value={instructor._id || instructor.id}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{instructor.name}</span>
                    {instructor.email && (
                      <span className="text-xs text-muted-foreground">
                        ({instructor.email})
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div
              className="flex items-center justify-center gap-2"
              style={{ minHeight: 400 }}
            >
              <Loader className="animate-spin w-5 h-5" />
              <span>Loading schedule...</span>
            </div>
          ) : filteredInstructors.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center gap-4"
              style={{ minHeight: 400 }}
            >
              <User className="w-12 h-12 text-muted-foreground/50" />
              <div className="text-center">
                <h3 className="font-medium text-lg">No instructors found</h3>
                <p className="text-muted-foreground">
                  {selectedInstructor !== "all"
                    ? "The selected instructor doesn't exist or has been removed."
                    : "There are no instructors available in the system."}
                </p>
              </div>
              {selectedInstructor !== "all" && (
                <Button
                  variant="outline"
                  onClick={() => setSelectedInstructor("all")}
                >
                  View All Instructors
                </Button>
              )}
            </div>
          ) : (
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-left text-sm font-medium text-muted-foreground w-48">
                    Instructor / Time
                  </th>
                  {weekDates.map((d) => {
                    const past = isPastDate(d);
                    const todayCol = isToday(d);
                    return (
                      <th
                        key={d.toISOString()}
                        className={cn(
                          "p-3 text-center text-sm font-medium min-w-[120px]",
                          todayCol && "bg-primary/5",
                          past && "opacity-60",
                        )}
                      >
                        <div className="font-display">
                          {d.toLocaleDateString("en-US", { weekday: "short" })}
                        </div>
                        <div
                          className={cn(
                            "text-xs mt-1",
                            todayCol
                              ? "text-primary font-semibold"
                              : past
                                ? "text-muted-foreground/60"
                                : "text-muted-foreground",
                          )}
                        >
                          {d.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                        {past && (
                          <div className="text-[10px] text-muted-foreground/50 mt-0.5">
                            past
                          </div>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {filteredInstructors.map((instructor) => (
                  <React.Fragment key={instructor._id || instructor.id}>
                    <tr className="border-b bg-muted/30">
                      <td colSpan={8} className="p-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <span className="font-medium">
                              {instructor.name}
                            </span>
                            {instructor.email && (
                              <span className="text-xs text-muted-foreground ml-2">
                                {instructor.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                    {timeSlots.map((timeSlot) => (
                      <tr
                        key={`${instructor._id || instructor.id}-${timeSlot}`}
                        className="border-b last:border-0 hover:bg-muted/5"
                      >
                        <td className="p-3 text-sm font-medium text-muted-foreground bg-muted/20">
                          <div className="flex items-center gap-2">
                            <span className="w-16">{timeSlot}</span>
                            <span className="text-xs text-muted-foreground">
                              (60 min)
                            </span>
                          </div>
                        </td>
                        {weekDates.map((date) => {
                          const session = getSessionForSlot(
                            instructor,
                            date,
                            timeSlot,
                          );
                          const students = session?.students || [];
                          const todayCol = isToday(date);
                          const past = isPastDate(date);
                          return (
                            <td
                              key={getLocalDateString(date)}
                              className={cn(
                                "p-2",
                                todayCol && "bg-primary/5",
                                past && "opacity-70",
                              )}
                            >
                              {session ? (
                                <div
                                  className={cn(
                                    "p-2 rounded-lg text-xs transition-colors",
                                    students.length > 0
                                      ? "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800"
                                      : "bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800",
                                    past && "grayscale-[30%]",
                                  )}
                                >
                                  <div className="font-medium mb-1">
                                    {students.length > 0 ? (
                                      <span className="text-green-700 dark:text-green-400">
                                        {students.length} Student
                                        {students.length > 1 ? "s" : ""}
                                      </span>
                                    ) : (
                                      <span className="text-blue-700 dark:text-blue-400">
                                        Available
                                      </span>
                                    )}
                                  </div>
                                  {students.length > 0 && (
                                    <div className="space-y-1 max-h-20 overflow-y-auto">
                                      {students.map(
                                        (student: {
                                          _id: string;
                                          id: string;
                                          name: string;
                                        }) => (
                                          <div
                                            key={student._id || student.id}
                                            className="text-muted-foreground truncate"
                                            title={student.name}
                                          >
                                            • {student.name || "Student"}
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="p-2 rounded-lg text-xs bg-muted/20 border border-dashed border-border text-muted-foreground text-center">
                                  No session
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    {timeSlots.length === 0 && (
                      <tr>
                        <td
                          colSpan={8}
                          className="p-8 text-center text-muted-foreground"
                        >
                          No time slots available for this instructor
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">
              Total Instructors
            </div>
            <div className="text-2xl font-bold mt-1">{instructors.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">
              {weekOffset === 0 ? "This Week — Booked" : "Week View — Booked"}
            </div>
            <div className="text-2xl font-bold mt-1">{visibleBooked}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {totalBookedSessions} total all-time
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">
              {weekOffset === 0
                ? "This Week — Available"
                : "Week View — Available"}
            </div>
            <div className="text-2xl font-bold mt-1">{visibleAvailable}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {totalAvailableSessions} total all-time
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800"></div>
          <span className="text-muted-foreground">Booked sessions</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800"></div>
          <span className="text-muted-foreground">Available sessions</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-muted/20 border border-dashed border-border"></div>
          <span className="text-muted-foreground">No session</span>
        </div>
      </div>
    </div>
  );
};

export default MangersSchedulePage;
