import React, { useEffect, useState } from "react";
import { useSimulation } from "@/contexts/SimulationContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  BookOpen,
  Star,
  Clock,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { SERVER_URL } from "@/lib/server";
import { cn } from "@/lib/utils";

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
  instructor: { _id: string; name: string; email: string };
  students: Array<{ _id: string; name: string }>;
  date: string;
  startTime: string;
  bookings?: Array<{
    _id: string;
    student: string | { _id?: string };
    status: string;
  }>;
}

interface Feedback {
  _id: string;
  instructor: { _id: string; name: string };
  classSession: { _id: string; date: string; startTime: string };
  rating: number;
  comment: string;
  createdAt: string;
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

const SimDashboardPage = () => {
  const { simulatedStudent } = useSimulation();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [bookingStats, setBookingStats] = useState<BookingStats | null>(null);
  const [loading, setLoading] = useState(true);

  const studentId = simulatedStudent?._id || simulatedStudent?.id;
  const studentName = simulatedStudent?.name || "Student";

  useEffect(() => {
    if (!studentId) return;
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    setLoading(true);

    Promise.all([
      fetch(`${SERVER_URL}/admin/simulate/sessions?studentId=${studentId}`, {
        headers,
      }).then((r) => r.json()),
      fetch(`${SERVER_URL}/feedback/student/${studentId}`, { headers }).then(
        (r) => r.json(),
      ),
      fetch(`${SERVER_URL}/admin/simulate/stats?studentId=${studentId}`, {
        headers,
      }).then((r) => r.json()),
    ])
      .then(([sessionsData, feedbackData, statsData]) => {
        if (sessionsData.success) setSessions(sessionsData.sessions || []);
        if (feedbackData.success) setFeedback(feedbackData.feedbacks || []);
        if (statsData.success) setBookingStats(statsData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [studentId]);

  if (!simulatedStudent) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Sessions where this student is a participant
  const studentSessions = sessions.filter(
    (s) =>
      s.students?.some((st) =>
        typeof st === "object" ? st._id === studentId : st === studentId,
      ) ||
      s.bookings?.some((b) => {
        const bStudent =
          typeof b.student === "object" ? b.student?._id : b.student;
        return bStudent === studentId && b.status === "booked";
      }),
  );

  const upcomingClasses = studentSessions.filter((s) => {
    const d = new Date(s.date);
    d.setHours(0, 0, 0, 0);
    return d >= today;
  });

  const completedClasses = studentSessions.filter((s) => {
    const d = new Date(s.date);
    d.setHours(0, 0, 0, 0);
    return d < today;
  });

  const feedbackSessionIds = new Set(
    feedback.map((f) => f.classSession?._id).filter(Boolean),
  );

  const completedWithoutFeedback = completedClasses.filter(
    (s) => !feedbackSessionIds.has(s._id),
  );

  const allActivities = [
    ...upcomingClasses.map((s) => ({
      id: s._id,
      type: "upcoming",
      date: s.date,
      timeSlot: s.startTime,
      instructor: s.instructor,
    })),
    ...completedClasses.map((s) => ({
      id: s._id,
      type: completedWithoutFeedback.some((c) => c._id === s._id)
        ? "pending-feedback"
        : "completed",
      date: s.date,
      timeSlot: s.startTime,
      instructor: s.instructor,
    })),
  ]
    .sort((a, b) => {
      if (a.type === "upcoming" && b.type === "upcoming")
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    })
    .slice(0, 6);

  const uniqueFeedbackSessions = new Set(
    feedback.map((f) => f.classSession?._id).filter(Boolean),
  ).size;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading {studentName}'s dashboard…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">
          Welcome back, {studentName.split(" ")[0]}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's your learning progress and upcoming classes
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Upcoming Classes"
          value={upcomingClasses.length}
          icon={Calendar}
          color="bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
        />
        <StatCard
          title="Completed"
          value={completedClasses.length}
          icon={BookOpen}
          color="bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400"
        />
        <StatCard
          title="Total Booked"
          value={studentSessions.length}
          icon={Clock}
          color="bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"
        />
        <StatCard
          title="Feedback Given"
          value={uniqueFeedbackSessions}
          icon={Star}
          color="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400"
        />
      </div>

      {/* Booking Plan */}
      {bookingStats && (
        <Card
          className={cn(
            "border-2",
            bookingStats.category === "noob" && bookingStats.remaining === 0
              ? "border-red-300"
              : bookingStats.category === "noob" &&
                  bookingStats.remaining !== null &&
                  bookingStats.remaining <= 2
                ? "border-yellow-300"
                : "border-primary/20",
          )}
        >
          <CardHeader className="pb-3">
            <CardTitle className="font-display flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-primary" />
              Booking Plan
              <Badge
                variant={
                  bookingStats.category === "ultimate" ? "default" : "secondary"
                }
                className="ml-auto capitalize"
              >
                {bookingStats.category}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bookingStats.category === "noob" ? (
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
                      width: `${Math.min(100, (bookingStats.activeInPeriod / (bookingStats.limit || 7)) * 100)}%`,
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
                    <span>No bookings started yet</span>
                  )}
                  {bookingStats.remaining !== null &&
                    bookingStats.remaining > 0 && (
                      <span className="font-medium text-primary">
                        {bookingStats.remaining} remaining
                      </span>
                    )}
                </div>
                {bookingStats.remaining === 0 && (
                  <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded-lg p-2">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Booking limit reached for this period.</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 text-sm text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
                <div>
                  <p className="font-medium">Unlimited bookings</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    No restrictions on the number of sessions.
                  </p>
                </div>
              </div>
            )}
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
            {allActivities.length > 0 ? (
              allActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
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
                        {new Date(activity.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        at {activity.timeSlot}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Instructor: {activity.instructor?.name || "Unknown"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      activity.type === "upcoming"
                        ? "bg-blue-100 text-blue-700"
                        : activity.type === "pending-feedback"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700"
                    }`}
                  >
                    {activity.type === "upcoming"
                      ? "Upcoming"
                      : activity.type === "pending-feedback"
                        ? "Feedback Pending"
                        : "Completed"}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No activity found for this student
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Feedback Summary */}
      {feedback.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display">
              Recent Feedback Given
            </CardTitle>
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

export default SimDashboardPage;
