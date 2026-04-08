import { useState, useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { SERVER_URL } from "@/lib/server";
import { User, ClassSession } from "@/lib/types";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  User as UserIcon,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  BookOpen,
  CalendarDays,
  Filter,
  Info,
  Shield,
  AlertTriangle,
  Sun,
  Cloud,
  CloudRain,
  Wind,
  Headset,
  Timer,
  Stars,
  Zap,
  Navigation,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type ClassSessionWithBookings = ClassSession & {
  bookings?: Array<{
    _id?: string;
    id?: string;
    student?: { _id?: string; id?: string };
  }>;
  students?: Array<{ _id?: string; id?: string }>;
  instructor?: { _id?: string; id?: string; name?: string };
};

interface BookingSettings {
  bookingAheadDays: number;
  defaultSlots: string[];
  blockedSlots: Array<{ _id: string; date: string; from: string; to: string }>;
  unblockedSundays: string[];
  allowMultipleStudentsPerSlot: boolean;
  studentsPerSlot: number;
  allowMultipleBookingsPerDay: boolean;
  maxBookingsPerDay: number;
  dropBookingHours?: number;
}

interface BookingStats {
  category: string;
  totalActive: number;
  activeInPeriod: number;
  periodStart: string | null;
  periodEnd: string | null;
  periodElapsed: boolean;
  limit: number | null;
  remaining: number | null;
  periodDays: number;
  bookingsStartedOn?: string | null;
}

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
// Student Notes Component
const StudentNotes = () => {
  const notes = [
    {
      icon: Shield,
      title: "MSF Riders Course Required",
      description:
        "Make sure you've completed the MSF riders course before booking your first class.",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      priority: "high",
    },
    {
      icon: UserIcon,
      title: "Bring Your Balaclava",
      description:
        "Always carry your balaclava/helmet liner when coming to class for hygiene purposes.",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      priority: "medium",
    },
    {
      icon: UserIcon,
      title: "Proper Attire Required",
      description:
        "Wear jeans, closed-toe shoes, and appropriate clothing. No shorts or sandals allowed.",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      priority: "medium",
    },
    {
      icon: Cloud,
      title: "Weather Cancellations",
      description:
        "Classes may be cancelled without notice due to weather conditions or other unforeseen circumstances.",
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      priority: "info",
    },
  ];

  return (
    <Card className="border-2 border-primary/10 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden">
      <CardContent className="p-0">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="notes" className="border-0">
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Info className="h-4 w-4 text-primary" />
                </div>
                <div className="text-left">
                  <h3 className="font-display font-semibold">
                    Important Information for Students
                  </h3>
                  <p className="text-sm text-red-600 flex gap-1">
                    <Stars className="h-4 w-4" />
                    <span>Please read before booking</span>
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="grid gap-3 md:grid-cols-2">
                {notes.map((note, index) => {
                  const Icon = note.icon;
                  return (
                    <div
                      key={index}
                      className={cn(
                        "p-4 rounded-xl border flex items-start gap-3 transition-all hover:shadow-md",
                        note.bgColor,
                        note.priority === "high" &&
                          "border-blue-200 dark:border-blue-800",
                        note.priority === "medium" &&
                          "border-purple-200 dark:border-purple-800",
                        note.priority === "info" &&
                          "border-yellow-200 dark:border-yellow-800",
                      )}
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                          note.bgColor,
                        )}
                      >
                        <Icon className={cn("h-4 w-4", note.color)} />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-1">
                          {note.title}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {note.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-yellow-700 dark:text-yellow-400 mb-1">
                      Weather Advisory
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      In case of severe weather, classes may be cancelled with
                      short notice.
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs">
                      <Badge
                        variant="outline"
                        className="bg-yellow-500/10 border-yellow-500/20"
                      >
                        <Sun className="h-3 w-3 mr-1" /> Sunny
                      </Badge>
                      <Badge
                        variant="outline"
                        className="bg-blue-500/10 border-blue-500/20"
                      >
                        <CloudRain className="h-3 w-3 mr-1" /> Rain
                      </Badge>
                      <Badge
                        variant="outline"
                        className="bg-gray-500/10 border-gray-500/20"
                      >
                        <Wind className="h-3 w-3 mr-1" /> Wind
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs font-medium mb-1 flex gap-2">
                    <Timer className="h-4 w-4" /> Arrival Time
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Please arrive 10 minutes before your scheduled class
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs font-medium mb-1 flex gap-2">
                    <Headset className="h-4 w-4" /> Contact
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Call us at 0711847481 for urgent changes
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};

const CompactNotesBanner = () => (
  <Card className="border-2 border-primary/10 bg-gradient-to-r from-primary/5 to-transparent md:hidden">
    <CardContent className="p-3">
      <div className="flex items-start gap-2">
        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Info className="h-3 w-3 text-primary" />
        </div>
        <div>
          <p className="text-xs font-medium">Before you book:</p>
          <ul className="text-[10px] text-muted-foreground list-disc list-inside mt-1 space-y-0.5">
            <li>Complete MSF riders course first</li>
            <li>Bring your balaclava</li>
            <li>Wear jeans and closed shoes</li>
            <li>Weather may cause cancellations</li>
          </ul>
        </div>
      </div>
    </CardContent>
  </Card>
);

const BookingPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const getLocalToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(getLocalToday);
  const [selectedInstructor, setSelectedInstructor] = useState("all");
  const [selectedTimeCategory, setSelectedTimeCategory] = useState("all");
  const [sessions, setSessions] = useState<ClassSessionWithBookings[]>([]);
  const [instructors, setInstructors] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [bookingInProgress, setBookingInProgress] = useState<string | null>(
    null,
  );
  const [cancelModal, setCancelModal] = useState<{
    open: boolean;
    bookingId: string | null;
    date?: string;
    slot?: string;
    instructorName?: string;
  }>({ open: false, bookingId: null });
  const [bookingSettings, setBookingSettings] = useState<BookingSettings>({
    bookingAheadDays: 2,
    defaultSlots: FALLBACK_SLOTS,
    blockedSlots: [],
    unblockedSundays: [],
    allowMultipleStudentsPerSlot: false,
    studentsPerSlot: 1,
    allowMultipleBookingsPerDay: false,
    maxBookingsPerDay: 1,
    dropBookingHours: 0,
  });
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [bookingStats, setBookingStats] = useState<BookingStats | null>(null);

  // ── Fetch everything in one go so settings are never stale ────────────────
  const fetchAll = useCallback(
    (isInitial = false) => {
      if (!user) return;
      if (isInitial) setInitialLoading(true);
      else setLoading(true);

      const token = localStorage.getItem("token");

      const fetches: Promise<unknown>[] = [
        fetch(`${SERVER_URL}/booking/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.json()),
        fetch(`${SERVER_URL}/booking/sessions`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.json()),
        fetch(`${SERVER_URL}/instructor/list`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.json()),
      ];

      if (user.role === "student") {
        fetches.push(
          fetch(`${SERVER_URL}/booking/my-stats`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then((r) => r.json()),
        );
      }

      Promise.all(fetches)
        .then(([settingsData, sessionsData, instructorsData, statsData]) => {
          // ── Settings ──
          const sd = settingsData as { success: boolean } & BookingSettings;
          if (sd.success) {
            setBookingSettings({
              bookingAheadDays: sd.bookingAheadDays ?? 2,
              defaultSlots: sd.defaultSlots?.length
                ? sd.defaultSlots
                : FALLBACK_SLOTS,
              blockedSlots: sd.blockedSlots ?? [],
              unblockedSundays: sd.unblockedSundays ?? [],
              allowMultipleStudentsPerSlot:
                sd.allowMultipleStudentsPerSlot ?? false,
              studentsPerSlot: sd.studentsPerSlot ?? 1,
              allowMultipleBookingsPerDay:
                sd.allowMultipleBookingsPerDay ?? false,
              maxBookingsPerDay: sd.maxBookingsPerDay ?? 1,
              dropBookingHours: sd.dropBookingHours ?? 0,
            });
          }
          setSettingsLoaded(true);

          // ── Sessions & Instructors ──
          const sesd = sessionsData as {
            success: boolean;
            sessions: ClassSessionWithBookings[];
          };
          const insd = instructorsData as {
            success: boolean;
            instructors: User[];
          };
          if (sesd.success) setSessions(sesd.sessions);
          if (insd.success) setInstructors(insd.instructors);

          // ── Stats ──
          if (statsData) {
            const st = statsData as { success: boolean } & BookingStats;
            if (st.success) setBookingStats(st);
          }
        })
        .catch(() =>
          toast({
            title: "Error",
            description: "Failed to fetch data",
            variant: "destructive",
          }),
        )
        .finally(() => {
          setLoading(false);
          setInitialLoading(false);
        });
    },
    [user, toast],
  );

  // Initial load
  useEffect(() => {
    fetchAll(true);
  }, [user]);

  // Re-fetch sessions+stats (and settings) whenever date changes
  useEffect(() => {
    if (!user) return;
    fetchAll(false);
  }, [selectedDate]);

  const isSlotBlocked = (date: string, slot: string): boolean => {
    const slotTime = slot.length === 4 ? "0" + slot : slot;
    for (const block of bookingSettings.blockedSlots) {
      if (block.date !== date) continue;
      if (slotTime >= block.from && slotTime < block.to) return true;
    }
    return false;
  };

  const isSundayBlocked = (dateStr: string): boolean => {
    // Don't block until we know the real setting — avoids flash of "blocked"
    if (!settingsLoaded) return false;
    const d = getLocalDateObj(dateStr);
    if (d.getDay() !== 0) return false; // not Sunday
    return !bookingSettings.unblockedSundays.includes(dateStr);
  };

  if (!user) return null;

  const getLocalDateString = (date: string | Date) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const getLocalDateObj = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  // Tracks which slot buttons have their info popover open (key = "instId-slot")
  const [openTooltips, setOpenTooltips] = useState<Record<string, boolean>>({});
  const [highlightedSlot, setHighlightedSlot] = useState<{
    instId: string;
    slot: string;
  } | null>(null);
  const slotRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const toggleTooltip = (key: string) =>
    setOpenTooltips((prev) => ({ ...prev, [key]: !prev[key] }));

  const closeTooltip = (key: string) =>
    setOpenTooltips((prev) => ({ ...prev, [key]: false }));

  /**
   * Returns true when the slot time has already passed TODAY.
   * On future dates this always returns false (the date guard handles those).
   */
  const isSlotPastTime = (dateStr: string, slot: string): boolean => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    if (dateStr !== todayStr) return false;
    const [slotHour, slotMin] = slot.split(":").map(Number);
    const slotDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      slotHour,
      slotMin,
      0,
    );
    return slotDate <= now;
  };

  const sessionsByInstructor: Record<
    string,
    Record<string, ClassSessionWithBookings>
  > = {};
  sessions.forEach((s) => {
    const sessionDate = getLocalDateString(s.date);
    if (sessionDate !== selectedDate) return;
    const instId = s.instructor?._id || s.instructorId;
    if (!sessionsByInstructor[instId]) sessionsByInstructor[instId] = {};
    sessionsByInstructor[instId][s.startTime || s.timeSlot] = s;
  });

  const navigateDate = (dir: number) => {
    const d = new Date(selectedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + dir);
    const diffDays = Math.floor(
      (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    // Block navigation to past dates
    if (diffDays < 0) {
      toast({
        title: "Cannot go to past",
        description: "Bookings can only be made from today onwards.",
        variant: "destructive",
      });
      return;
    }
    if (diffDays > bookingSettings.bookingAheadDays) {
      toast({
        title: "Booking Limit",
        description: `You can only book up to ${bookingSettings.bookingAheadDays} day(s) ahead.`,
        variant: "destructive",
      });
      return;
    }
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const goToToday = () => setSelectedDate(getLocalToday());

  const handleBook = async (sessionId: string) => {
    setBookingInProgress(sessionId);
    const token = localStorage.getItem("token");
    try {
      if (classLimitReached) {
        toast({
          title: "Booking limit reached",
          description:
            bookingStats?.periodElapsed
              ? "Your current booking period has ended. Please contact admin to reset it."
              : `You have already used your ${bookingStats?.limit} allotted booking${bookingStats?.limit === 1 ? "" : "s"} in this period.`,
          variant: "destructive",
        });
        return;
      }
      const selectedDateObj = getLocalDateObj(selectedDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffDays = Math.floor(
        (selectedDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (diffDays > bookingSettings.bookingAheadDays) {
        toast({
          title: "Booking Limit",
          description: `You can only book up to ${bookingSettings.bookingAheadDays} day(s) ahead.`,
          variant: "destructive",
        });
        return;
      }
      const res = await fetch(`${SERVER_URL}/booking/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ classSessionId: sessionId }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "🎉 Class Booked Successfully!",
          description: "Your driving class has been scheduled.",
        });
        fetchAll();
      } else {
        toast({
          title: "Booking Failed",
          description: data.message || "Please try again later.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Network error. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setBookingInProgress(null);
    }
  };

  const handleCreateAndBook = async (instId: string, slot: string) => {
    setBookingInProgress(`${instId}-${slot}`);
    const token = localStorage.getItem("token");
    try {
      if (classLimitReached) {
        toast({
          title: "Booking limit reached",
          description:
            bookingStats?.periodElapsed
              ? "Your current booking period has ended. Please contact admin to reset it."
              : `You have already used your ${bookingStats?.limit} allotted booking${bookingStats?.limit === 1 ? "" : "s"} in this period.`,
          variant: "destructive",
        });
        return;
      }
      const res = await fetch(`${SERVER_URL}/booking/create-session-and-book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          instructorId: instId,
          date: selectedDate,
          timeSlot: slot,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "🎉 Class Booked Successfully!",
          description: "Your driving class has been scheduled.",
        });
        fetchAll();
      } else {
        toast({
          title: "Booking Failed",
          description: data.message || "Please try again later.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Network error. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setBookingInProgress(null);
    }
  };

  const handleCancel = async (
    bookingId: string,
    date?: string,
    slot?: string,
  ) => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${SERVER_URL}/booking/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bookingId, date, slot }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "✅ Booking Cancelled",
          description: "Your booking has been cancelled successfully.",
        });
        fetchAll();
      } else {
        toast({
          title: "Cancellation Failed",
          description: data.message || "Please try again later.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Network error. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
  const isPastDate = selectedDateObj.getTime() < todayObj.getTime();
  const isSundayRestricted = isSundayBlocked(selectedDate);

  // Compute how many classes the student has already booked on the selected date
  const maxBookingsPerDay = bookingSettings.allowMultipleBookingsPerDay
    ? (bookingSettings.maxBookingsPerDay ?? 1)
    : 1;
  const myBookingsOnSelectedDate = sessions.filter((s) => {
    const sessionDate = getLocalDateString(s.date);
    if (sessionDate !== selectedDate) return false;
    return (s as ClassSessionWithBookings).bookings?.some(
      (b) => b.student === user.id || b.student?._id === user.id,
    );
  }).length;
  const dailyLimitReached =
    user.role === "student" && myBookingsOnSelectedDate >= maxBookingsPerDay;
  const classLimitReached =
    user.role === "student" &&
    !!bookingStats &&
    bookingStats.limit !== null &&
    (bookingStats.periodElapsed || (bookingStats.remaining ?? 0) <= 0);

  const filteredInstructors = instructors.filter(
    (inst) =>
      selectedInstructor === "all" ||
      (inst._id || inst.id) === selectedInstructor,
  );

  // ── Find next available slot across all dates within booking window ─────────
  const findNextAvailableSlot = () => {
    const maxStudents = bookingSettings.allowMultipleStudentsPerSlot
      ? bookingSettings.studentsPerSlot
      : 1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (
      let dayOffset = 0;
      dayOffset <= bookingSettings.bookingAheadDays;
      dayOffset++
    ) {
      const d = new Date(today);
      d.setDate(today.getDate() + dayOffset);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;

      // Skip blocked sundays
      if (isSundayBlocked(dateStr)) continue;

      for (const instructor of instructors) {
        const instId = instructor._id || instructor.id;
        const instrExpires = (instructor as any).periodExpires;
        if (instrExpires && new Date(instrExpires) < new Date(dateStr))
          continue;

        const slots = instructor.slots?.length
          ? instructor.slots
          : bookingSettings.defaultSlots;
        const slotMap: Record<string, ClassSessionWithBookings> = {};
        sessions.forEach((s) => {
          const sDate = (() => {
            const sd = typeof s.date === "string" ? new Date(s.date) : s.date;
            return `${sd.getFullYear()}-${String(sd.getMonth() + 1).padStart(2, "0")}-${String(sd.getDate()).padStart(2, "0")}`;
          })();
          if (sDate !== dateStr) return;
          const sInstId = s.instructor?._id || s.instructorId;
          if (sInstId !== instId) return;
          slotMap[s.startTime || s.timeSlot] = s;
        });

        for (const slot of slots) {
          if (isSlotBlocked(dateStr, slot)) continue;
          if (isSlotPastTime(dateStr, slot)) continue;
          const session = slotMap[slot];
          const bookingCount = session?.bookings?.length ?? 0;
          const isMyBooking = session?.bookings?.some(
            (b) => b.student === user?.id || b.student?._id === user?.id,
          );
          if (bookingCount < maxStudents && !isMyBooking) {
            return { dateStr, instId, slot, instructorName: instructor.name };
          }
        }
      }
    }
    return null;
  };

  const handleGoToNextSlot = () => {
    if (classLimitReached) {
      toast({
        title: "Booking limit reached",
        description:
          bookingStats?.periodElapsed
            ? "Your current booking period has ended. Please contact admin to reset it."
            : `You have already used your ${bookingStats?.limit} allotted booking${bookingStats?.limit === 1 ? "" : "s"} in this period.`,
        variant: "destructive",
      });
      return;
    }
    const next = findNextAvailableSlot();
    if (!next) {
      toast({
        title: "No available slots",
        description: "No open slots found in your booking window.",
        variant: "destructive",
      });
      return;
    }
    setSelectedDate(next.dateStr);
    setSelectedInstructor("all");
    setHighlightedSlot({ instId: next.instId, slot: next.slot });
    // Scroll after a short delay so the new date renders first
    setTimeout(() => {
      const key = `${next.instId}-${next.slot}`;
      const el = slotRefs.current[key];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      // Clear highlight after 6 seconds
      setTimeout(() => setHighlightedSlot(null), 6000);
    }, 350);
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  if (initialLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
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
            Select your preferred date and time slot
            {bookingSettings.bookingAheadDays > 0 && (
              <Badge variant="outline" className="text-xs ml-1">
                Up to {bookingSettings.bookingAheadDays} day(s) ahead
              </Badge>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="outline" className="px-3 py-1">
            <BookOpen className="h-4 w-4 mr-2" />
            {instructors.length} Instructors Available
          </Badge>
          <button
            type="button"
            onClick={handleGoToNextSlot}
            className={cn(
              "notif-glow flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
            )}
            style={
              { "--notif-glow": "hsl(var(--primary))" } as React.CSSProperties
            }
          >
            <Zap className="h-4 w-4" />
            Next Available Slot
          </button>
        </div>
      </div>

      <div className="hidden md:block">
        <StudentNotes />
      </div>
      <div className="md:hidden">
        <CompactNotesBanner />
      </div>

      {/* ── Period Elapsed Banner ── */}
      {bookingStats && bookingStats.periodElapsed && (
        <div className="flex items-center gap-3 p-4 rounded-xl border text-sm bg-red-50 border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-800 dark:text-red-300">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <div className="flex-1">
            <span className="font-semibold">Booking Period Expired: </span>
            Your 30-day booking period ended on{" "}
            <strong>
              {bookingStats.periodEnd
                ? new Date(bookingStats.periodEnd).toLocaleDateString()
                : "—"}
            </strong>
            . You can no longer make new bookings. Please contact an admin to
            reset your period.
          </div>
        </div>
      )}

      {/* ── Booking Limit Banner (limited plans only) ── */}
      {bookingStats &&
        bookingStats.limit !== null &&
        !bookingStats.periodElapsed && (
          <div
            className={cn(
              "flex items-center gap-3 p-4 rounded-xl border text-sm",
              bookingStats.remaining === 0
                ? "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-800 dark:text-red-300"
                : bookingStats.remaining !== null && bookingStats.remaining <= 2
                  ? "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950/30 dark:border-yellow-800 dark:text-yellow-300"
                  : "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-300",
            )}
          >
            <Shield className="h-5 w-5 flex-shrink-0" />
            <div className="flex-1">
              <span className="font-semibold">
                {bookingStats.category.charAt(0).toUpperCase() +
                  bookingStats.category.slice(1)}{" "}
                Plan:
              </span>{" "}
              {bookingStats.remaining === 0 ? (
                <span>
                  You have used all{" "}
                  <strong>{bookingStats.limit} bookings</strong> in your
                  current 30-day period.
                </span>
              ) : (
                <span>
                  <strong>{bookingStats.remaining}</strong> of{" "}
                  <strong>{bookingStats.limit}</strong> bookings remaining in
                  your 30-day period
                  {bookingStats.periodStart && (
                    <span className="text-xs ml-2 opacity-75">
                      (period:{" "}
                      {new Date(bookingStats.periodStart).toLocaleDateString()}{" "}
                      –{" "}
                      {bookingStats.periodEnd
                        ? new Date(bookingStats.periodEnd).toLocaleDateString()
                        : "—"}
                      )
                    </span>
                  )}
                </span>
              )}
            </div>
            <Badge variant="outline" className="flex-shrink-0 text-xs">
              {bookingStats.activeInPeriod}/{bookingStats.limit} used
            </Badge>
          </div>
        )}

      {/* Ultimate badge — no limit reminder */}
      {bookingStats && bookingStats.limit === null && (
        <div className="flex items-center gap-3 p-3 rounded-xl border text-sm bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          <span>
            <span className="font-semibold">
              {bookingStats.category.charAt(0).toUpperCase() +
                bookingStats.category.slice(1)}{" "}
              Plan:
            </span>{" "}
            Unlimited
            bookings — book as many classes as you need.
          </span>
        </div>
      )}

      {/* Per-day limit info badge — shown when limit is configured but not yet reached */}
      {user.role === "student" &&
        !dailyLimitReached &&
        myBookingsOnSelectedDate > 0 &&
        bookingSettings.allowMultipleBookingsPerDay &&
        maxBookingsPerDay > 1 && (
          <div className="flex items-center gap-3 p-3 rounded-xl border text-sm bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-300">
            <Info className="h-4 w-4 flex-shrink-0" />
            <span>
              You have{" "}
              <strong>
                {maxBookingsPerDay - myBookingsOnSelectedDate} booking
                {maxBookingsPerDay - myBookingsOnSelectedDate !== 1 ? "s" : ""}
              </strong>{" "}
              remaining for this day (limit: {maxBookingsPerDay} per day).
            </span>
          </div>
        )}

      {/* Date Navigation */}
      <Card className="border-primary/10 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="p-4">
          <div className="flex flex-wrap md:flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => navigateDate(-1)}
                      disabled={isToday}
                      className="h-9 w-9"
                      title={isToday ? "Can't go to past" : "Previous Day"}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isToday ? "Can't go to past" : "Previous Day"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
                {isPastDate && (
                  <Badge variant="destructive" className="mt-1 text-xs">
                    Past — No Bookings
                  </Badge>
                )}
                {isSundayRestricted && (
                  <Badge variant="destructive" className="mt-1 text-xs">
                    Sunday — No Bookings
                  </Badge>
                )}
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => navigateDate(1)}
                      className="h-9 w-9"
                      title="Next Day"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Next Day</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button
                variant="ghost"
                size="sm"
                onClick={goToToday}
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
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading schedule...</span>
          </div>
        </div>
      )}

      {filteredInstructors.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              No instructors found
            </p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2 md:gap-6 lg:grid-cols-2">
          {filteredInstructors.map((instructor) => {
            const instId = instructor._id || instructor.id;
            // Use instructor custom slots or fall back to admin default slots
            const slots = instructor.slots?.length
              ? instructor.slots
              : bookingSettings.defaultSlots;
            const slotMap = sessionsByInstructor[instId] || {};

            const filteredSlots = slots.filter((slot) => {
              if (selectedTimeCategory === "all") return true;
              return TIME_SLOT_CATEGORIES[
                selectedTimeCategory as keyof typeof TIME_SLOT_CATEGORIES
              ]?.includes(slot);
            });

            const maxStudents = bookingSettings.allowMultipleStudentsPerSlot
              ? bookingSettings.studentsPerSlot
              : 1;

            // Check if instructor's periodExpires makes them unavailable on the selected date
            const instrExpires = (instructor as any).periodExpires;
            const instrExpiredOnDate =
              instrExpires && new Date(instrExpires) < new Date(selectedDate);

            const availableSlots = filteredSlots.filter((slot) => {
              if (instrExpiredOnDate) return false;
              const session = slotMap[slot];
              if (!session) return true;
              const bookingCount = session.bookings?.length ?? 0;
              return bookingCount < maxStudents;
            }).length;

            return (
              <Card
                key={instId}
                className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20 overflow-hidden"
              >
                <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border-2 border-primary/20">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(instructor.name || "Unknown")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="font-display text-lg">
                          {instructor.name || "Unknown Instructor"}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {availableSlots} slots available
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {filteredSlots.length} total
                          </Badge>
                          {bookingSettings.allowMultipleStudentsPerSlot && (
                            <Badge variant="outline" className="text-xs">
                              {maxStudents} per slot
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <ScrollArea className="h-fit min-h-[320px] pr-4">
                    <div className="grid grid-cols-3 gap-3">
                      {filteredSlots.map((slot) => {
                        const session = slotMap[slot];
                        const bookingCount = session?.bookings?.length ?? 0;
                        const isMyBooking = session?.bookings?.some(
                          (b) =>
                            b.student === user.id || b.student?._id === user.id,
                        );
                        const isFull =
                          bookingCount >= maxStudents && !isMyBooking;
                        // Daily limit: disable slot if the student has hit their per-day cap
                        // (but still allow interacting with their own existing booking to cancel)
                        const isDailyLimitHit =
                          user.role === "student" &&
                          dailyLimitReached &&
                          !isMyBooking;
                        const isClassLimitHit =
                          user.role === "student" &&
                          classLimitReached &&
                          !isMyBooking;
                        const isPastSlot = isSlotPastTime(selectedDate, slot);

                        // Drop restriction: is it too late to cancel this booking?
                        const isDropRestricted = (() => {
                          const dropHours =
                            bookingSettings.dropBookingHours ?? 0;
                          if (!isMyBooking || dropHours === 0) return false;
                          const [slotHour, slotMin] = slot
                            .split(":")
                            .map(Number);
                          const [year, month, day] = selectedDate
                            .split("-")
                            .map(Number);
                          const classDateTime = new Date(
                            year,
                            month - 1,
                            day,
                            slotHour,
                            slotMin,
                            0,
                          );
                          const diffHours =
                            (classDateTime.getTime() - Date.now()) /
                            (1000 * 60 * 60);
                          return diffHours < dropHours;
                        })();

                        const isBlocked =
                          isSundayRestricted ||
                          isSlotBlocked(selectedDate, slot) ||
                          isPastDate ||
                          isPastSlot ||
                          instrExpiredOnDate;
                        const isAvailable =
                          !isFull &&
                          !isDailyLimitHit &&
                          !isClassLimitHit &&
                          !isBlocked &&
                          !isDropRestricted;
                        const isBookingThis =
                          bookingInProgress === session?._id ||
                          bookingInProgress === `${instId}-${slot}`;

                        let statusText = "";
                        if (isPastDate || isPastSlot) statusText = "Past";
                        else if (isMyBooking && isDropRestricted)
                          statusText = "Locked";
                        else if (isMyBooking) statusText = "Yours";
                        else if (isBlocked) statusText = "Blocked";
                        else if (isClassLimitHit) statusText = "Class limit";
                        else if (isDailyLimitHit) statusText = "Daily limit";
                        else if (isFull) statusText = "Full";
                        else
                          statusText =
                            bookingSettings.allowMultipleStudentsPerSlot
                              ? `${bookingCount}/${maxStudents}`
                              : "Available";

                        const tooltipKey = `${instId}-${slot}`;
                        const tooltipMsg =
                          isPastDate || isPastSlot
                            ? "This time slot has already passed"
                            : isSundayRestricted
                              ? "No bookings on Sunday"
                              : isSlotBlocked(selectedDate, slot)
                                ? "Slot is blocked by admin"
                                : instrExpiredOnDate
                                  ? "Instructor not available on this date"
                                  : isMyBooking && isDropRestricted
                                    ? `Cannot cancel within ${bookingSettings.dropBookingHours}h of class`
                                    : isMyBooking
                                      ? "Click to cancel your booking"
                                      : isClassLimitHit
                                        ? `Class limit reached (${bookingStats?.limit} in current period)`
                                      : isDailyLimitHit
                                        ? `Daily limit reached (${maxBookingsPerDay} per day)`
                                        : isFull
                                          ? "Slot is fully booked"
                                          : "Click to book this slot";

                        const isHighlighted =
                          highlightedSlot?.instId === instId &&
                          highlightedSlot?.slot === slot;

                        return (
                          <div
                            key={slot}
                            className={cn(
                              "relative rounded-lg",
                              isHighlighted && "notif-glow",
                            )}
                            style={
                              isHighlighted
                                ? ({
                                    "--notif-glow": "hsl(var(--primary))",
                                  } as React.CSSProperties)
                                : undefined
                            }
                            ref={(el) => {
                              slotRefs.current[`${instId}-${slot}`] = el;
                            }}
                          >
                            <button
                              disabled={
                                isFull ||
                                isClassLimitHit ||
                                isDailyLimitHit ||
                                isBookingThis ||
                                loading ||
                                isDropRestricted ||
                                (isBlocked && !isMyBooking)
                              }
                              onClick={() => {
                                if (isBlocked && !isMyBooking) {
                                  toggleTooltip(tooltipKey);
                                  return;
                                }
                                if (isDailyLimitHit) {
                                  toggleTooltip(tooltipKey);
                                  return;
                                }
                                if (isClassLimitHit) {
                                  toggleTooltip(tooltipKey);
                                  return;
                                }
                                if (isDropRestricted) {
                                  toggleTooltip(tooltipKey);
                                  return;
                                }
                                if (isMyBooking) {
                                  setCancelModal({
                                    open: true,
                                    bookingId:
                                      session?.bookings?.find(
                                        (b) =>
                                          b.student === user.id ||
                                          b.student?._id === user.id,
                                      )?._id || null,
                                    date: session?.date,
                                    slot:
                                      session?.startTime || session?.timeSlot,
                                    instructorName: instructor.name,
                                  });
                                } else if (session && !isFull) {
                                  handleBook(session._id || session.id);
                                } else if (!session) {
                                  handleCreateAndBook(instId, slot);
                                }
                              }}
                              onMouseEnter={() =>
                                setOpenTooltips((p) => ({
                                  ...p,
                                  [tooltipKey]: true,
                                }))
                              }
                              onMouseLeave={() =>
                                setOpenTooltips((p) => ({
                                  ...p,
                                  [tooltipKey]: false,
                                }))
                              }
                              className={cn(
                                "w-full flex flex-col items-center p-3 rounded-lg border text-sm transition-all relative overflow-hidden group/button",
                                isMyBooking &&
                                  !isDropRestricted &&
                                  "bg-primary text-primary-foreground border-primary",
                                isMyBooking &&
                                  isDropRestricted &&
                                  "bg-primary/40 text-primary-foreground/70 border-primary/40 cursor-not-allowed",
                                (isFull || isDailyLimitHit || isClassLimitHit) &&
                                  !isMyBooking &&
                                  "bg-muted text-muted-foreground cursor-not-allowed opacity-50 border-muted",
                                isAvailable &&
                                  !isMyBooking &&
                                  "bg-card hover:bg-accent/10 hover:border-accent cursor-pointer hover:shadow-md",
                                isBookingThis && "animate-pulse",
                                isBlocked &&
                                  !isMyBooking &&
                                  "opacity-50 cursor-not-allowed",
                              )}
                            >
                              {isBookingThis && (
                                <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                              )}
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
                              {isAvailable && !isMyBooking && (
                                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary scale-x-0 group-hover/button:scale-x-100 transition-transform origin-left" />
                              )}
                            </button>

                            {/* Click + hover info popover */}
                            {openTooltips[tooltipKey] && (
                              <div
                                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-max max-w-[180px] px-3 py-2 rounded-lg bg-popover text-popover-foreground text-xs shadow-lg border pointer-events-none"
                                role="tooltip"
                              >
                                {tooltipMsg}
                                {/* Arrow */}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-popover" />
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
                        <CheckCircle2 className="h-3 w-3 text-primary" /> Yours
                      </span>
                      <span className="flex items-center gap-1">
                        <XCircle className="h-3 w-3" /> Full
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Available
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {filteredSlots.length} slots
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Cancel Modal */}
      <Dialog
        open={cancelModal.open}
        onOpenChange={(open) => setCancelModal((prev) => ({ ...prev, open }))}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Cancel Booking?
            </DialogTitle>
            <DialogDescription className="pt-2">
              You are about to cancel your booking with{" "}
              <span className="font-semibold">
                {cancelModal.instructorName}
              </span>{" "}
              on{" "}
              <span className="font-semibold">
                {cancelModal.date &&
                  new Date(cancelModal.date).toLocaleDateString()}
              </span>{" "}
              at <span className="font-semibold">{cancelModal.slot}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted/50 p-4 rounded-lg my-2">
            <p className="text-sm text-muted-foreground">
              ⚠️ This action cannot be undone. The slot will become available
              for other students.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setCancelModal({ open: false, bookingId: null })}
              className="w-full sm:w-auto"
            >
              Keep Booking
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (cancelModal.bookingId) {
                  await handleCancel(
                    cancelModal.bookingId,
                    cancelModal.date,
                    cancelModal.slot,
                  );
                  setCancelModal({ open: false, bookingId: null });
                }
              }}
              className="w-full sm:w-auto"
            >
              Yes, Cancel Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookingPage;
