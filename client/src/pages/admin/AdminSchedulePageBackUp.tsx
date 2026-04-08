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

const AdminSchedulePage = () => {
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
        // Fetch instructors
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
        // Fetch all sessions for the week
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
  }, [user, weekOffset]);

  if (!user) return null;

  // Get the week dates
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1 + weekOffset * 7); // Monday

  const weekDates = Array.from({ length: 6 }, (_, i) => {
    // Mon-Sat
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  // Format date for comparison
  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  // Get all unique time slots from sessions or use defaults
  const getAllTimeSlots = () => {
    const slots = new Set<string>();
    sessions.forEach((session) => {
      if (session.startTime || session.timeSlot) {
        slots.add(session.startTime || session.timeSlot);
      }
    });

    // If no slots found, return default slots
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

  // Filter instructors based on selection
  const filteredInstructors = instructors.filter((inst) => {
    if (selectedInstructor === "all") return true;
    const instructorId = inst._id || inst.id;
    return instructorId === selectedInstructor;
  });

  // Check if a session exists for a specific instructor, date, and time slot
  const getSessionForSlot = (
    instructor: UserType,
    date: Date,
    timeSlot: string,
  ) => {
    // Use local date string for both session and date
    const getLocalDateString = (d) => {
      const dt = typeof d === "string" ? new Date(d) : d;
      const year = dt.getFullYear();
      const month = String(dt.getMonth() + 1).padStart(2, "0");
      const day = String(dt.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };
    const dateStr = getLocalDateString(date);
    const instructorId = instructor._id || instructor.id;

    return sessions.find((s) => {
      const sessionInstructorId = s.instructor?._id || s.instructorId;
      const sessionDate = getLocalDateString(s.date);
      const sessionTime = s.startTime || s.timeSlot;

      return (
        sessionInstructorId === instructorId &&
        sessionDate === dateStr &&
        sessionTime === timeSlot
      );
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">
            {user.role === "instructor" ? "My Schedule" : "Schedule Overview"}
          </h1>
          <p className="text-muted-foreground mt-1">
            Weekly class schedule view
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
            variant="outline"
            size="sm"
            onClick={() => setWeekOffset(0)}
            disabled={loading}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setWeekOffset((w) => w + 1)}
            disabled={loading}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          {/* Instructor Filter Dropdown */}
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

          {/* Show instructor count when filtered */}
          {selectedInstructor !== "all" && (
            <div className="text-sm text-muted-foreground">
              Showing 1 of {instructors.length} instructors
            </div>
          )}
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
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-left text-sm font-medium text-muted-foreground w-48">
                    Instructor / Time
                  </th>
                  {weekDates.map((d) => {
                    const isToday = formatDate(d) === formatDate(today);
                    return (
                      <th
                        key={d.toISOString()}
                        className={cn(
                          "p-3 text-center text-sm font-medium min-w-[120px]",
                          isToday && "bg-primary/5",
                        )}
                      >
                        <div className="font-display">
                          {d.toLocaleDateString("en-US", { weekday: "short" })}
                        </div>
                        <div
                          className={cn(
                            "text-xs mt-1",
                            isToday
                              ? "text-primary font-semibold"
                              : "text-muted-foreground",
                          )}
                        >
                          {d.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {filteredInstructors.map((instructor) => (
                  <React.Fragment key={instructor._id || instructor.id}>
                    {/* Instructor header row */}
                    <tr className="border-b bg-muted/30">
                      <td colSpan={7} className="p-2">
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

                    {/* Time slots for this instructor */}
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
                          const isToday =
                            formatDate(date) === formatDate(today);

                          return (
                            <td
                              key={formatDate(date)}
                              className={cn("p-2", isToday && "bg-primary/5")}
                            >
                              {session ? (
                                <div
                                  className={cn(
                                    "p-2 rounded-lg text-xs transition-colors",
                                    students.length > 0
                                      ? "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800"
                                      : "bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800",
                                  )}
                                >
                                  <div className="font-medium mb-1">
                                    {students.length > 0 ? (
                                      <span className="text-green-700 dark:text-green-400">
                                        {students.length} Student
                                        {students.length > 1 ? "s" : ""}
                                      </span>
                                    ) : (
                                      <div className="p-2 rounded-lg text-xs bg-muted/20 border border-dashed border-border text-muted-foreground text-center">
                                        No session
                                      </div>
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

                    {/* Empty state if no time slots */}
                    {timeSlots.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
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

      {/* Legend */}
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

export default AdminSchedulePage;
