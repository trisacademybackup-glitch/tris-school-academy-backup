import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  BookOpen,
  Star,
  Clock,
  Shield,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Zap,
  ExternalLink,
  Award,
  Download,
  Loader2,
} from "lucide-react";
import { SERVER_URL } from "@/lib/server";
import { cn } from "@/lib/utils";
import { downloadCertificate } from "@/lib/certificate";

const CLASS_COMPLETION = 7;

const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-display font-bold mt-1">{value}</p>
        </div>
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </CardContent>
  </Card>
);

interface Session {
  _id: string;
  instructor: {
    _id: string;
    name: string;
    email: string;
  };
  students: Array<{
    _id: string;
    name: string;
    email: string;
  }>;
  date: string;
  startTime: string;
  endTime: string;
  status?: string;
  bookings?: Array<{
    _id: string;
    student: string;
    status: string;
    date: string;
    slot: string;
  }>;
}

interface Feedback {
  _id: string;
  instructor: {
    _id: string;
    name: string;
  };
  classSession: {
    _id: string;
    date: string;
    startTime: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
}

interface Booking {
  _id: string;
  student: string;
  classSession: string;
  status: string;
  date: string;
  slot: string;
  classSessionDetails?: Session;
}

interface BookingStats {
  category: string;
  totalActive: number;
  activeInPeriod: number;
  periodStart: string | null;
  periodEnd: string | null;
  limit: number | null;
  remaining: number | null;
  periodDays: number;
}

const StudentDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [bookingStats, setBookingStats] = useState<BookingStats | null>(null);
  const [loading, setLoading] = useState({
    sessions: true,
    feedback: true,
    bookings: true,
  });
  const [certDownloading, setCertDownloading] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    // Fetch all available sessions
    setLoading((prev) => ({ ...prev, sessions: true }));
    fetch(`${SERVER_URL}/booking/sessions`, { headers })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.sessions)) {
          setSessions(data.sessions);
        }
      })
      .catch((error) => console.error("Error fetching sessions:", error))
      .finally(() => setLoading((prev) => ({ ...prev, sessions: false })));

    // Fetch student's feedback
    setLoading((prev) => ({ ...prev, feedback: true }));
    fetch(`${SERVER_URL}/feedback/student/${user.id}`, { headers })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.feedbacks)) {
          setFeedback(data.feedbacks);
        }
      })
      .catch((error) => console.error("Error fetching feedback:", error))
      .finally(() => setLoading((prev) => ({ ...prev, feedback: false })));

    // Fetch user's bookings (if you have an endpoint for user's bookings)
    // If not, we'll derive from sessions data
    setLoading((prev) => ({ ...prev, bookings: true }));
    fetch(`${SERVER_URL}/users/${user.id}`, { headers })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          // If user has bookings array in the response
          if (data.user.bookings) {
            setMyBookings(data.user.bookings);
          }
        }
      })
      .catch((error) => console.error("Error fetching user bookings:", error))
      .finally(() => setLoading((prev) => ({ ...prev, bookings: false })));

    // Fetch booking stats for students
    if (user.role === "student") {
      fetch(`${SERVER_URL}/booking/my-stats`, { headers })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setBookingStats(data);
        })
        .catch((error) =>
          console.error("Error fetching booking stats:", error),
        );
    }
  }, [user]);

  if (!user) return null;

  // Get all sessions where the current student is booked
  const studentSessions = sessions.filter((session) =>
    session.students?.some((student) =>
      typeof student === "object"
        ? student._id === user.id
        : student === user.id,
    ),
  );

  // Get current date for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Categorize sessions
  const upcomingClasses = studentSessions.filter((session) => {
    const sessionDate = new Date(session.date);
    sessionDate.setHours(0, 0, 0, 0);
    return sessionDate >= today;
  });

  const completedClasses = studentSessions.filter((session) => {
    const sessionDate = new Date(session.date);
    sessionDate.setHours(0, 0, 0, 0);
    return sessionDate < today;
  });

  // Get all session IDs where student has given feedback
  const feedbackSessionIds = new Set(
    feedback.map((f) => f.classSession?._id).filter(Boolean),
  );

  // Get completed classes without feedback
  const completedWithoutFeedback = completedClasses.filter(
    (session) => !feedbackSessionIds.has(session._id),
  );

  // Combine all upcoming and recent activities for display
  const allActivities = [
    // Upcoming classes
    ...upcomingClasses.map((session) => ({
      id: session._id,
      type: "upcoming",
      date: session.date,
      timeSlot: session.startTime,
      instructor: session.instructor,
      status: "upcoming",
    })),
    // Completed classes
    ...completedClasses.map((session) => ({
      id: session._id,
      type: completedWithoutFeedback.some((s) => s._id === session._id)
        ? "pending-feedback"
        : "completed",
      date: session.date,
      timeSlot: session.startTime,
      instructor: session.instructor,
      status: completedWithoutFeedback.some((s) => s._id === session._id)
        ? "feedback-pending"
        : "completed",
    })),
  ]
    // Sort by date (most recent first for completed, upcoming soonest first)
    .sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      if (a.type === "upcoming" && b.type === "upcoming") {
        return dateA.getTime() - dateB.getTime(); // Ascending for upcoming
      }
      return dateB.getTime() - dateA.getTime(); // Descending for completed
    })
    .slice(0, 5); // Take only 5 most recent/relevant

  // Get feedback count (unique sessions where feedback was given)
  const uniqueFeedbackSessions = new Set(
    feedback.map((f) => f.classSession?._id).filter(Boolean),
  ).size;

  // Certificate eligibility
  const isCertEligible = completedClasses.length >= CLASS_COMPLETION;

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
      // silently fail — user will retry from MyClasses page
    } finally {
      setCertDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* <EventInvite /> */}
      <div>
        <h1 className="text-2xl font-display font-bold">
          Welcome back, {user.name?.split(" ")[0] || "Student"}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's your learning progress and upcoming classes
        </p>
      </div>

      {/* Promotional Images */}
      <div className="space-y-4 lg:space-y-0 lg:flex lg:gap-4">
        {/* Easter training image shown to everyone */}
        <div className="rounded-xl overflow-hidden flex-1 max-w-[400px] h-[450px] lg:h-[450px] lg:w-[400px]">
          <img
            src="https://res.cloudinary.com/dm7ohxd3v/image/upload/v1773760731/Tris-Easter-training-3-16-26-5_hrm7qy.png"
            alt="Easter Training"
            className="w-full h-full object-cover"
          />
        </div>

        {/* "Need More Classes" image shown only to noob students */}
        {bookingStats?.limit !== null && (
          <div className="rounded-xl overflow-hidden flex-1 max-w-[400px] h-[450px] lg:h-[450px] lg:w-[400px]">
            <img
              src="https://res.cloudinary.com/dm7ohxd3v/image/upload/v1773760736/Need-More-Classes_Tris-3-17-26_2_thlywt.png"
              alt="Need More Classes"
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Statistics Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Upcoming Classes"
          value={upcomingClasses.length}
          icon={Calendar}
          color="text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
        />
        <StatCard
          title="Completed"
          value={completedClasses.length}
          icon={BookOpen}
          color="text-green-600 dark:bg-green-900/20 dark:text-green-400"
        />
        <StatCard
          title="Total Booked"
          value={studentSessions.length}
          icon={Clock}
          color="text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"
        />
        <StatCard
          title="Feedback Given"
          value={uniqueFeedbackSessions}
          icon={Star}
          color="text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400"
        />
      </div>

      {/* ── Certificate of Completion ──────────────────────────────────── */}
      {isCertEligible && (
        <Card className="border-2 border-emerald-400 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-cyan-950/20 dark:border-emerald-700 overflow-hidden">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Award className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold text-emerald-800 dark:text-emerald-300 text-lg">
                  🎓 You've earned your Certificate of Achievement!
                </h3>
                <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-1">
                  Congratulations on completing{" "}
                  <span className="font-semibold">
                    {completedClasses.length} classes
                  </span>{" "}
                  at TRIS Motorcycle Academy. Your certificate is ready to
                  download.
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

      {/* Booking Plan Card */}
      {bookingStats && (
        <Card
          className={cn(
            "border-2",
            bookingStats.limit !== null && bookingStats.remaining === 0
              ? "border-red-300 dark:border-red-700"
              : bookingStats.limit !== null &&
                  bookingStats.remaining !== null &&
                  bookingStats.remaining <= 2
                ? "border-yellow-300 dark:border-yellow-700"
                : "border-primary/20",
          )}
        >
          <CardHeader className="pb-3">
            <CardTitle className="font-display flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-primary" />
              Your Booking Plan
              <Badge
                variant={
                  bookingStats.limit === null ? "default" : "secondary"
                }
                className="ml-auto capitalize"
              >
                {bookingStats.category}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bookingStats.limit !== null ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Bookings in current 30-day period
                  </span>
                  <span
                    className={cn(
                      "font-bold text-base",
                      bookingStats.remaining === 0
                        ? "text-red-600"
                        : bookingStats.remaining !== null &&
                            bookingStats.remaining <= 2
                          ? "text-yellow-600"
                          : "text-primary",
                    )}
                  >
                    {bookingStats.activeInPeriod} / {bookingStats.limit}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={cn(
                      "h-2 rounded-full transition-all",
                      bookingStats.remaining === 0
                        ? "bg-red-500"
                        : bookingStats.remaining !== null &&
                            bookingStats.remaining <= 2
                          ? "bg-yellow-500"
                          : "bg-primary",
                    )}
                    style={{
                      width: `${Math.min(100, (bookingStats.activeInPeriod / (bookingStats.limit || 1)) * 100)}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  {bookingStats.periodStart ? (
                    <span>
                      Period:{" "}
                      {new Date(bookingStats.periodStart).toLocaleDateString()}{" "}
                      –{" "}
                      {bookingStats.periodEnd
                        ? new Date(bookingStats.periodEnd).toLocaleDateString()
                        : "—"}
                    </span>
                  ) : (
                    <span>
                      Book your first class to start your 30-day period
                    </span>
                  )}
                  {bookingStats.remaining !== null &&
                    bookingStats.remaining > 0 && (
                      <span className="font-medium text-primary">
                        {bookingStats.remaining} remaining
                      </span>
                    )}
                </div>
                {bookingStats.remaining === 0 && (
                  <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-lg p-2">
                    <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>
                      You have reached your booking limit. New bookings will be
                      available after your current period ends.
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 text-sm text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
                <div>
                  <p className="font-medium">Unlimited bookings</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Book as many classes as you need — no restrictions on the
                    number of sessions.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Class Depleted: Feedback Prompt ─────────────────────────────── */}
      {bookingStats &&
        bookingStats.limit !== null &&
        bookingStats.remaining === 0 && (
        <Card className="border-2 border-yellow-300 dark:border-yellow-700 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center shrink-0">
                <MessageSquare className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-semibold text-yellow-800 dark:text-yellow-300">
                  You've used all your classes! 🎉
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                  Congratulations on completing your sessions. We'd love to hear
                  how your experience was — your feedback helps us improve!
                </p>
                <Button
                  onClick={() => navigate("/student-feedback")}
                  className="mt-3 bg-yellow-500 hover:bg-yellow-600 text-white"
                  size="sm"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Give Feedback
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Class Depleted: Upgrade Section ──────────────────────────────── */}
      {bookingStats &&
        bookingStats.limit !== null &&
        bookingStats.remaining === 0 && (
        <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-semibold">
                  Want to book more classes?
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Upgrade your class period to continue your learning journey.
                  Our team will get you set up with additional sessions.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    asChild
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <a
                      href={`https://wa.me/254711847481?text=${encodeURIComponent("Hello, I would like to upgrade my class period / book more driving lessons. My name is " + (user?.name || "") + ".")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Upgrade via WhatsApp
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display flex items-center justify-between">
            <span>Recent Activity</span>
            <span className="text-sm font-normal text-muted-foreground">
              {allActivities.length} activities
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {loading.sessions ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-muted rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {allActivities.length > 0 ? (
                  allActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${
                            activity.type === "upcoming"
                              ? "bg-blue-500"
                              : activity.type === "pending-feedback"
                                ? "bg-yellow-500"
                                : "bg-green-500"
                          }`}
                        />
                        <div>
                          <p className="text-sm font-medium">
                            {new Date(activity.date).toLocaleDateString(
                              "en-US",
                              {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              },
                            )}{" "}
                            at {activity.timeSlot}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Instructor: {activity.instructor?.name || "Unknown"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            activity.type === "upcoming"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                              : activity.type === "pending-feedback"
                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          }`}
                        >
                          {activity.type === "upcoming"
                            ? "Upcoming"
                            : activity.type === "pending-feedback"
                              ? "Feedback Pending"
                              : "Completed"}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground text-sm mb-2">
                      No recent activity found
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Book a class to start your learning journey
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Feedback Summary (if user has given feedback) */}
      {feedback.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Your Recent Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {feedback.slice(0, 3).map((item) => (
                <div key={item._id} className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">
                      {item.instructor?.name || "Unknown Instructor"}
                    </p>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < item.rating
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {item.comment && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      "{item.comment}"
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudentDashboardPage;
