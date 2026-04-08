import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, Star, Clock, TrendingUp, Award } from "lucide-react";
import { SERVER_URL } from "@/lib/server";
import { Link, useNavigate } from "react-router-dom";
// import EventInvite from "@/components/EventInvite";

const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
  trend,
  goto,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  trend?: { value: number; label: string };
  goto: string;
}) => (
  <Link to={`${goto}`}>
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-display font-bold mt-1">{value}</p>
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp
                  className={`w-3 h-3 ${trend.value >= 0 ? "text-green-500" : "text-red-500"}`}
                />
                <span
                  className={`text-xs ${trend.value >= 0 ? "text-green-500" : "text-red-500"}`}
                >
                  {trend.value}% {trend.label}
                </span>
              </div>
            )}
          </div>
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}
          >
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  </Link>
);

interface ClassSession {
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
  }>;
}

interface Feedback {
  _id: string;
  student: {
    _id: string;
    name: string;
    email: string;
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

interface Student {
  _id: string;
  name: string;
  email: string;
  phone?: string;
}

const InstructorDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState({
    sessions: true,
    feedback: true,
    students: true,
  });

  useEffect(() => {
    if (!user?.id) return;

    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    setLoading((prev) => ({ ...prev, sessions: true }));
    fetch(`${SERVER_URL}/instructor/schedule`, { headers })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.sessions)) {
          setSessions(data.sessions);
        }
      })
      .catch((error) => console.error("Error fetching schedule:", error))
      .finally(() => setLoading((prev) => ({ ...prev, sessions: false })));
    setLoading((prev) => ({ ...prev, feedback: true }));
    fetch(`${SERVER_URL}/feedback/instructor/${user.id}`, { headers })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.feedbacks)) {
          setFeedback(data.feedbacks);
        }
      })
      .catch((error) => console.error("Error fetching feedback:", error))
      .finally(() => setLoading((prev) => ({ ...prev, feedback: false })));
    setLoading((prev) => ({ ...prev, students: true }));
    fetch(`${SERVER_URL}/admin/users?role=student`, { headers })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setStudents(data.data);
        }
      })
      .catch((error) => console.error("Error fetching students:", error))
      .finally(() => setLoading((prev) => ({ ...prev, students: false })));
  }, [user]);

  if (!user) return null;

  // --- Local date helpers for alignment with schedule page ---
  const getLocalDateString = (date: string | Date) => {
    const d = typeof date === "string" ? new Date(date) : date;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const todayObj = new Date();
  todayObj.setHours(0, 0, 0, 0);
  const todayStr = getLocalDateString(todayObj);

  // Filter instructor's sessions
  const mySessions = sessions;

  // Categorize sessions
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  const nowTimeStr = pad(now.getHours()) + ":" + pad(now.getMinutes());
  const upcomingClasses = mySessions.filter((session) => {
    const sessionDateStr = getLocalDateString(session.date);
    const hasStudents =
      Array.isArray(session.students) && session.students.length > 0;
    if (!hasStudents) return false;
    if (sessionDateStr > todayStr) return true;
    if (
      sessionDateStr === todayStr &&
      session.startTime &&
      session.startTime > nowTimeStr
    )
      return true;
    return false;
  });

  // Get unique students
  const uniqueStudentIds = new Set<string>();
  mySessions.forEach((session) => {
    session.students?.forEach((student) => {
      if (typeof student === "object") {
        uniqueStudentIds.add(student._id);
      } else {
        uniqueStudentIds.add(student);
      }
    });
  });

  const totalStudents = uniqueStudentIds.size;

  // Calculate average rating
  const avgRating =
    feedback.length > 0
      ? (
          feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length
        ).toFixed(1)
      : "0.0";

  // Calculate rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: feedback.filter((f) => f.rating === star).length,
    percentage:
      feedback.length > 0
        ? (
            (feedback.filter((f) => f.rating === star).length /
              feedback.length) *
            100
          ).toFixed(1)
        : 0,
  }));

  // Get recent feedback
  const recentFeedback = [...feedback]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);

  // Get today's classes (local date match), exclude sessions with 0 students, and sort by startTime
  const todayClasses = mySessions
    .filter((session) => {
      const sessionDateStr = getLocalDateString(session.date);
      return (
        sessionDateStr === todayStr &&
        Array.isArray(session.students) &&
        session.students.length > 0
      );
    })
    .sort((a, b) => {
      // Compare startTime as HH:MM
      if (!a.startTime || !b.startTime) return 0;
      return a.startTime.localeCompare(b.startTime);
    });

  // Calculate total class hours
  const totalHours = mySessions.reduce((total, session) => {
    if (session.startTime && session.endTime) {
      const start = parseInt(session.startTime.split(":")[0]);
      const end = parseInt(session.endTime.split(":")[0]);
      return total + (end - start);
    }
    return total + 1; // Default 1 hour if no end time
  }, 0);

  return (
    <div className="space-y-6">
      {/* <EventInvite /> */}
      {/* Header with greeting */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-display font-bold">
            Welcome back, {user.name?.split(" ")[0] || "Instructor"}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's your teaching dashboard
          </p>
        </div>
        {todayClasses.length > 0 && (
          <div className="bg-primary/10 text-primary px-4 py-2 rounded-lg">
            <p className="text-sm font-medium">
              You have {todayClasses.length} class
              {todayClasses.length > 1 ? "es" : ""} today
            </p>
          </div>
        )}
      </div>

      {/* Statistics Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Upcoming Classes"
          value={upcomingClasses.length}
          icon={Calendar}
          color="bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
          goto={"/instructor-schedule"}
        />
        <StatCard
          title="Total Students"
          value={totalStudents}
          icon={Users}
          color="bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"
          goto={"/instructor-schedule"}
        />
        <StatCard
          title="Avg Rating"
          value={avgRating}
          icon={Star}
          color="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400"
          goto={"/instructor-feedback"}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Today's Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading.sessions ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="animate-pulse h-16 bg-muted rounded-lg"
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {todayClasses.length > 0 ? (
                  todayClasses.map((session) => (
                    <div
                      key={session._id}
                      className="p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors cursor-pointer"
                      onClick={() => navigate(`/instructor-schedule`)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium">
                          {session.startTime}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          {session.students?.length || 0} students
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {session.students?.length > 0
                          ? `${session.students.length} student${session.students.length > 1 ? "s" : ""} enrolled`
                          : "No students enrolled yet"}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground text-sm py-4">
                    No classes scheduled for today
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Feedback */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Recent Feedback
              </div>
              <span className="text-sm font-normal text-muted-foreground">
                Avg: {avgRating}/5.0
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading.feedback ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="animate-pulse h-20 bg-muted rounded-lg"
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {recentFeedback.length > 0 ? (
                  recentFeedback.map((item) => (
                    <div key={item._id} className="p-4 rounded-lg bg-muted/50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-medium">
                            {item.student?.name || "Anonymous Student"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(item.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </p>
                        </div>
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
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          "{item.comment}"
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground text-sm py-4">
                    No feedback received yet
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Rating Distribution */}
      {feedback.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display">Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ratingDistribution.map(({ star, count, percentage }) => (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-sm w-8">{star} ★</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-12">
                    {count} ({percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InstructorDashboardPage;
