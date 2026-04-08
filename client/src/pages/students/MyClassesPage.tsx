import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SERVER_URL } from "@/lib/server";
import { ClassSession } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  Clock,
  User,
  X,
  Loader2,
  CalendarCheck,
  History,
  AlertCircle,
  CheckCircle2,
  Ban,
  CarFront,
  Download,
  RefreshCw,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { downloadCertificate } from "@/lib/certificate";

const CLASS_COMPLETION = 7;

const MyClassesPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  type Booking = {
    _id?: string;
    id?: string;
    student?: string | { _id?: string; id?: string };
    status?: string;
  };

  type SessionWithBookings = ClassSession & {
    bookings: Booking[];
    instructor?: { _id?: string; id?: string; name?: string };
  };

  const [sessions, setSessions] = React.useState<SessionWithBookings[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [initialLoading, setInitialLoading] = React.useState(true);
  const [cancelModal, setCancelModal] = React.useState<{
    open: boolean;
    session: SessionWithBookings | null;
  }>({ open: false, session: null });
  const [refreshing, setRefreshing] = React.useState(false);
  const [certDownloading, setCertDownloading] = React.useState(false);

  const fetchData = React.useCallback(
    async (showRefresh = false) => {
      if (!user) return;
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(`${SERVER_URL}/booking/sessions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          const userSessions = data.sessions.filter(
            (session: SessionWithBookings) =>
              Array.isArray(session.bookings) &&
              session.bookings.some((b: Booking) => {
                const studentId =
                  typeof b.student === "object"
                    ? b.student._id || b.student.id
                    : b.student;
                return studentId === user.id;
              }),
          );
          setSessions(userSessions);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch your classes",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
        setInitialLoading(false);
        setRefreshing(false);
      }
    },
    [user, toast],
  );

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const today = new Date().toISOString().split("T")[0];

  const upcoming = sessions
    .filter(
      (s) =>
        s.date >= today &&
        s.bookings.some((b) => {
          const studentId =
            typeof b.student === "object"
              ? b.student._id || b.student.id
              : b.student;
          return b.status === "booked" && studentId === user.id;
        }),
    )
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        (a.timeSlot || a.startTime).localeCompare(b.timeSlot || b.startTime),
    );

  const past = sessions
    .filter(
      (s) =>
        s.date < today ||
        s.bookings.some((b) => {
          const studentId =
            typeof b.student === "object"
              ? b.student._id || b.student.id
              : b.student;
          return b.status === "completed" && studentId === user.id;
        }),
    )
    .sort((a, b) => b.date.localeCompare(a.date));

  const cancelled = sessions.filter((s) =>
    s.bookings.some((b) => {
      const studentId =
        typeof b.student === "object"
          ? b.student._id || b.student.id
          : b.student;
      return b.status === "cancelled" && studentId === user.id;
    }),
  );

  // Certificate eligibility: student has attended >= 7 classes
  const completedCount = past.length;
  const isCertEligible = completedCount >= CLASS_COMPLETION;

  const handleDownloadCertificate = async () => {
    if (!user?.name) return;
    setCertDownloading(true);
    try {
      await downloadCertificate({ studentName: user.name });
      toast({
        title: "🎓 Certificate Downloaded!",
        description: "Your certificate of completion has been saved.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to generate certificate. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCertDownloading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelModal.session) return;
    const session = cancelModal.session;
    const myBooking = session.bookings.find((b) => {
      const studentId =
        typeof b.student === "object"
          ? b.student._id || b.student.id
          : b.student;
      return studentId === user.id;
    });
    if (!myBooking) return;
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${SERVER_URL}/booking/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookingId: myBooking._id || myBooking.id,
          date: session.date,
          slot: session.timeSlot || session.startTime,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "✅ Booking Cancelled",
          description: "Your class has been cancelled successfully.",
          variant: "default",
        });
        fetchData();
      } else {
        toast({
          title: "Cancellation Failed",
          description: data.message || "Please try again later.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setCancelModal({ open: false, session: null });
    }
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const getTimeRemaining = (date: string, time: string) => {
    const sessionDateTime = new Date(`${date}T${time}`);
    const now = new Date();
    const diffMs = sessionDateTime.getTime() - now.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (diffHrs < 0) return "Past";
    if (diffHrs === 0) return `In ${diffMins} minutes`;
    if (diffHrs === 1) return "In 1 hour";
    if (diffHrs < 24) return `In ${diffHrs} hours`;
    return `${Math.floor(diffHrs / 24)} days left`;
  };

  if (initialLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
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
            My Classes
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <CalendarCheck className="h-4 w-4" />
            View and manage your driving lessons
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => fetchData(true)}
                  disabled={refreshing}
                >
                  <RefreshCw
                    className={cn("h-4 w-4", refreshing && "animate-spin")}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Badge variant="outline" className="px-3 py-1">
            <CarFront className="h-4 w-4 mr-2" />
            {upcoming.length} Upcoming
          </Badge>
        </div>
      </div>

      {/* ── Certificate of Completion Banner ── */}
      {isCertEligible && (
        <Card className="border-2 border-emerald-400 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-cyan-950/20 dark:border-emerald-700 overflow-hidden">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Award className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold text-emerald-800 dark:text-emerald-300 text-lg">
                  🎓 Congratulations! You've earned your certificate!
                </h3>
                <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-1">
                  You have successfully completed{" "}
                  <span className="font-semibold">
                    {completedCount} classes
                  </span>{" "}
                  at TRIS Motorcycle Academy. Download your Certificate of
                  Achievement below.
                </p>
              </div>
              <Button
                onClick={handleDownloadCertificate}
                disabled={certDownloading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 gap-2"
              >
                {certDownloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {certDownloading ? "Generating…" : "Download Certificate"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <CalendarCheck className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Upcoming</p>
                <p className="text-2xl font-bold">{upcoming.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            "bg-muted/50",
            isCertEligible &&
              "border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20",
          )}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "p-2 rounded-full bg-muted",
                  isCertEligible && "bg-emerald-100 dark:bg-emerald-900/30",
                )}
              >
                {isCertEligible ? (
                  <Award className="h-4 w-4 text-emerald-600" />
                ) : (
                  <History className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p
                  className={cn(
                    "text-2xl font-bold",
                    isCertEligible && "text-emerald-600",
                  )}
                >
                  {past.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-muted">
                <Ban className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cancelled</p>
                <p className="text-2xl font-bold">{cancelled.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-muted">
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Hours</p>
                <p className="text-2xl font-bold">{sessions.length}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loading Overlay */}
      {loading && !refreshing && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading your classes...</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="upcoming" className="relative">
            Upcoming
            {upcoming.length > 0 && (
              <Badge
                variant="secondary"
                className="ml-2 h-5 w-5 p-0 flex items-center justify-center"
              >
                {upcoming.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="past">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        {/* ── Upcoming ── */}
        <TabsContent value="upcoming" className="space-y-4">
          {upcoming.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <CalendarCheck className="h-8 w-8 text-primary" />
                </div>
                <p className="text-lg font-medium text-muted-foreground">
                  No upcoming classes
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Ready to hit the road? Book your next driving lesson!
                </p>
                <Button
                  className="mt-4"
                  onClick={() => (window.location.href = "/book")}
                >
                  Book a Class
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {upcoming.map((s) => {
                const inst = s.instructor;
                const isToday = formatDate(s.date) === "Today";
                const isTomorrow = formatDate(s.date) === "Tomorrow";
                return (
                  <Card
                    key={s._id || s.id}
                    className={cn(
                      "group hover:shadow-lg transition-all duration-300 border-l-4",
                      isToday
                        ? "border-l-primary"
                        : isTomorrow
                          ? "border-l-yellow-500"
                          : "border-l-muted",
                    )}
                  >
                    <CardContent className="p-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6">
                        <div className="flex items-start gap-4">
                          <div
                            className={cn(
                              "w-14 h-14 rounded-xl flex items-center justify-center",
                              isToday ? "bg-primary/10" : "bg-accent/10",
                            )}
                          >
                            <Calendar
                              className={cn(
                                "w-7 h-7",
                                isToday
                                  ? "text-primary"
                                  : "text-accent-foreground",
                              )}
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-lg">
                                {formatDate(s.date)}
                              </h3>
                              {isToday && (
                                <Badge variant="default" className="bg-primary">
                                  Today
                                </Badge>
                              )}
                              {isTomorrow && (
                                <Badge variant="secondary">Tomorrow</Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                <span className="font-mono">
                                  {s.timeSlot || s.startTime}
                                </span>
                              </div>
                              <Separator
                                orientation="vertical"
                                className="h-4 hidden sm:block"
                              />
                              <div className="flex items-center gap-1">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs bg-primary/10">
                                    {inst?.name ? getInitials(inst.name) : "IN"}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-muted-foreground">
                                  with{" "}
                                  <span className="font-medium text-foreground">
                                    {inst?.name || "Instructor"}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-4 sm:mt-0">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                                  onClick={() =>
                                    setCancelModal({ open: true, session: s })
                                  }
                                  disabled={loading}
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Cancel
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                Cancel this booking
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                      {isToday && (
                        <div className="bg-primary/5 px-6 py-2 border-t flex items-center gap-2 text-sm">
                          <AlertCircle className="h-4 w-4 text-primary" />
                          <span className="text-muted-foreground">
                            Your class is today! Please arrive 10 minutes early.
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── Completed ── */}
        <TabsContent value="past">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Completed Classes ({past.length})
                </div>
                {isCertEligible && (
                  <Button
                    size="sm"
                    onClick={handleDownloadCertificate}
                    disabled={certDownloading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                  >
                    {certDownloading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Award className="h-4 w-4" />
                    )}
                    {certDownloading ? "Generating…" : "Download Certificate"}
                  </Button>
                )}
              </CardTitle>
              {!isCertEligible && completedCount > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Complete {CLASS_COMPLETION - completedCount} more class
                  {CLASS_COMPLETION - completedCount !== 1 ? "es" : ""} to earn
                  your certificate 🎓
                </p>
              )}
            </CardHeader>
            <CardContent>
              {past.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No completed classes yet</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {past.map((s, idx) => {
                      const inst = s.instructor;
                      const myBooking = s.bookings.find((b) => {
                        const studentId =
                          typeof b.student === "object"
                            ? b.student._id || b.student.id
                            : b.student;
                        return studentId === user.id;
                      });
                      // Each past class gets a number: most recent = highest
                      const classNumber = past.length - idx;
                      const isEligibleClass = classNumber >= CLASS_COMPLETION;

                      return (
                        <div
                          key={s._id || s.id}
                          className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold",
                                classNumber >= CLASS_COMPLETION
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                  : "bg-green-500/10",
                              )}
                            >
                              {classNumber >= CLASS_COMPLETION ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                              ) : (
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {new Date(s.date).toLocaleDateString(
                                    "en-US",
                                    {
                                      weekday: "short",
                                      month: "short",
                                      day: "numeric",
                                    },
                                  )}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {s.timeSlot || s.startTime}
                                </Badge>
                                <span className="text-xs text-muted-foreground font-medium">
                                  Class #{classNumber}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <User className="w-3 h-3" />
                                <span>with {inst?.name}</span>
                                <>
                                  <span>•</span>
                                  <Clock className="w-3 h-3" />
                                  <span>1 hour</span>
                                </>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-500/10 text-green-600 border-green-200">
                              {myBooking?.status || "Completed"}
                            </Badge>
                            {/* Certificate download button — only shown when eligible */}
                            {isCertEligible && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                      onClick={handleDownloadCertificate}
                                      disabled={certDownloading}
                                    >
                                      {certDownloading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Award className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Download certificate
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Cancelled ── */}
        <TabsContent value="cancelled">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Ban className="h-5 w-5" />
                Cancelled Classes ({cancelled.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cancelled.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Ban className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No cancelled classes</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cancelled.map((s) => {
                    const inst = s.instructor;
                    return (
                      <div
                        key={s._id || s.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/10"
                      >
                        <div className="flex items-center gap-3">
                          <Ban className="w-4 h-4 text-red-500" />
                          <span className="font-medium">
                            {new Date(s.date).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <span className="text-muted-foreground">
                            {s.timeSlot || s.startTime}
                          </span>
                          <span className="text-muted-foreground">
                            with {inst?.name}
                          </span>
                        </div>
                        <Badge variant="destructive" className="text-xs">
                          Cancelled
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Cancel Confirmation Modal */}
      <Dialog
        open={cancelModal.open}
        onOpenChange={(open) => setCancelModal({ open, session: null })}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Cancel Booking?
            </DialogTitle>
            <DialogDescription className="pt-2">
              {cancelModal.session && (
                <>
                  You are about to cancel your class on{" "}
                  <span className="font-semibold">
                    {new Date(cancelModal.session.date).toLocaleDateString(
                      "en-US",
                      {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      },
                    )}
                  </span>{" "}
                  at{" "}
                  <span className="font-semibold">
                    {cancelModal.session.timeSlot ||
                      cancelModal.session.startTime}
                  </span>{" "}
                  with{" "}
                  <span className="font-semibold">
                    {cancelModal.session.instructor?.name}
                  </span>
                  .
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="bg-destructive/5 p-4 rounded-lg my-2 border border-destructive/20">
            <p className="text-sm text-destructive flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                ⚠️ Please note: Cancellations made less than 24 hours before the
                class may incur a fee. This action cannot be undone.
              </span>
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setCancelModal({ open: false, session: null })}
              className="w-full sm:w-auto"
            >
              Keep Booking
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Yes, Cancel Booking"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyClassesPage;
