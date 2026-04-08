import React, { useState, useEffect, useCallback } from "react";
import { useSimulation } from "@/contexts/SimulationContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { SERVER_URL } from "@/lib/server";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  User as UserIcon,
  Loader2,
  RefreshCw,
  CalendarDays,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface BookingEntry {
  _id: string;
  date: string;
  slot: string;
  status: string;
  classSession?: {
    _id: string;
    startTime: string;
    instructor?: { _id: string; name: string };
  };
}

function getWeekDates(offset: number): Date[] {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - day + 1 + offset * 7);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function fmt(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const SimTimetablePage = () => {
  const { simulatedStudent } = useSimulation();
  const studentId = simulatedStudent?._id || simulatedStudent?.id || "";

  const [weekOffset, setWeekOffset] = useState(0);
  const [bookings, setBookings] = useState<BookingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeSlots, setTimeSlots] = useState<string[]>(FALLBACK_SLOTS);

  const weekDates = getWeekDates(weekOffset);
  const weekStart = weekDates[0];
  const weekEnd = weekDates[weekDates.length - 1];

  // Fetch time slots from settings once on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${SERVER_URL}/booking/settings`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (
          data.success &&
          Array.isArray(data.defaultSlots) &&
          data.defaultSlots.length > 0
        ) {
          setTimeSlots(data.defaultSlots);
        }
      })
      .catch(() => {});
  }, []);

  const fetchBookings = useCallback(
    async (isRefresh = false) => {
      if (!studentId) return;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(
          `${SERVER_URL}/admin/simulate/bookings?studentId=${studentId}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const data = await res.json();
        if (data.success) setBookings(data.bookings || []);
      } catch {
        //nill
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [studentId],
  );

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const bookingMap = new Map<string, BookingEntry>();
  bookings.forEach((b) => {
    const dateKey = b.date?.slice(0, 10);
    const slotKey = b.slot || b.classSession?.startTime || "";
    if (dateKey && slotKey) bookingMap.set(`${dateKey}_${slotKey}`, b);
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekBookings = bookings.filter((b) => {
    const d = b.date?.slice(0, 10);
    return d >= fmt(weekStart) && d <= fmt(weekEnd);
  });

  const weekLabel = () => {
    const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    return `${weekStart.toLocaleDateString(undefined, opts)} – ${weekEnd.toLocaleDateString(undefined, opts)}, ${weekEnd.getFullYear()}`;
  };

  const isToday = (d: Date) => d.toDateString() === new Date().toDateString();
  const isPast = (d: Date) => d < today;

  if (!simulatedStudent) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No student selected for simulation.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Simulation banner */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-300 text-sm">
        <Eye className="w-4 h-4 flex-shrink-0" />
        <span>
          Viewing timetable as <strong>{simulatedStudent.name}</strong> (
          {simulatedStudent.email})
        </span>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-primary" />
            Student Timetable
          </h1>
          <p className="text-muted-foreground mt-1">
            {simulatedStudent.name}'s class schedule
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchBookings(true)}
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{weekBookings.length}</p>
                <p className="text-xs text-muted-foreground">This week</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {
                    bookings.filter((b) => b.date?.slice(0, 10) >= fmt(today))
                      .length
                  }
                </p>
                <p className="text-xs text-muted-foreground">Upcoming</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{bookings.length}</p>
                <p className="text-xs text-muted-foreground">Total booked</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {weekLabel()}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setWeekOffset((o) => o - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs px-3"
                onClick={() => setWeekOffset(0)}
                disabled={weekOffset === 0}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setWeekOffset((o) => o + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea>
            <div className="min-w-[640px]">
              <div className="grid grid-cols-7 border-b bg-muted/30">
                <div className="p-3 text-xs font-medium text-muted-foreground border-r text-center">
                  Time
                </div>
                {weekDates.map((d, i) => (
                  <div
                    key={i}
                    className={cn(
                      "p-3 text-center border-r last:border-r-0",
                      isToday(d) && "bg-primary/5",
                    )}
                  >
                    <p
                      className={cn(
                        "text-xs font-medium",
                        isToday(d) ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      {SHORT_DAYS[d.getDay()]}
                    </p>
                    <p
                      className={cn(
                        "text-sm font-bold mt-0.5",
                        isToday(d) && "text-primary",
                        isPast(d) && !isToday(d) && "text-muted-foreground/60",
                      )}
                    >
                      {d.getDate()}
                    </p>
                    {isToday(d) && (
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mx-auto mt-1" />
                    )}
                  </div>
                ))}
              </div>

              {loading
                ? Array.from({ length: timeSlots.length || 6 }).map((_, i) => (
                    <div key={i} className="grid grid-cols-7 border-b">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <div key={j} className="p-2 border-r last:border-r-0">
                          <Skeleton className="h-8 w-full rounded" />
                        </div>
                      ))}
                    </div>
                  ))
                : timeSlots.map((slot) => (
                    <div
                      key={slot}
                      className="grid grid-cols-7 border-b last:border-b-0"
                    >
                      <div className="p-3 border-r flex items-center justify-center">
                        <span className="text-xs font-mono text-muted-foreground">
                          {slot}
                        </span>
                      </div>
                      {weekDates.map((d, di) => {
                        const key = `${fmt(d)}_${slot}`;
                        const booking = bookingMap.get(key);
                        const past = isPast(d);
                        return (
                          <div
                            key={di}
                            className={cn(
                              "p-1.5 border-r last:border-r-0 min-h-[52px] flex items-center justify-center",
                              isToday(d) && "bg-primary/5",
                            )}
                          >
                            {booking ? (
                              <div
                                className={cn(
                                  "w-full rounded-md px-2 py-1.5 text-xs font-medium text-center",
                                  past
                                    ? "bg-muted/60 text-muted-foreground border border-muted"
                                    : "bg-primary/15 text-primary border border-primary/30",
                                )}
                              >
                                <div className="flex items-center justify-center gap-1">
                                  <UserIcon className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate max-w-[70px]">
                                    {booking.classSession?.instructor?.name?.split(
                                      " ",
                                    )[0] || "Booked"}
                                  </span>
                                </div>
                                {past && (
                                  <span className="text-[10px] text-muted-foreground">
                                    completed
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="w-full h-full" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>

      {!loading && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Upcoming Classes</CardTitle>
          </CardHeader>
          <CardContent>
            {bookings.filter((b) => b.date?.slice(0, 10) >= fmt(today))
              .length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">
                No upcoming classes booked for this student.
              </p>
            ) : (
              <div className="space-y-2">
                {bookings
                  .filter((b) => b.date?.slice(0, 10) >= fmt(today))
                  .sort((a, b) => (a.date > b.date ? 1 : -1))
                  .slice(0, 10)
                  .map((b) => {
                    const dateStr = b.date?.slice(0, 10) || "";
                    const [yr, mo, dy] = dateStr.split("-").map(Number);
                    const d = new Date(yr, mo - 1, dy);
                    const slotTime = b.slot || b.classSession?.startTime || "";
                    const instructorName =
                      b.classSession?.instructor?.name || "TBA";
                    return (
                      <div
                        key={b._id}
                        className="flex items-center justify-between rounded-lg border px-4 py-3 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex flex-col items-center justify-center text-primary">
                            <span className="text-xs font-medium leading-none">
                              {SHORT_DAYS[d.getDay()]}
                            </span>
                            <span className="text-lg font-bold leading-none">
                              {d.getDate()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {d.toLocaleDateString(undefined, {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {slotTime} · {instructorName}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-primary/10 text-primary text-xs"
                        >
                          Booked
                        </Badge>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SimTimetablePage;
