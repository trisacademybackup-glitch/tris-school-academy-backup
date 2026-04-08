import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  Users,
  BookOpen,
  Star,
  TrendingUp,
  UserCheck,
  Activity,
  BarChart3,
} from "lucide-react";
import { SERVER_URL } from "@/lib/server";
import { useNavigate } from "react-router-dom";

const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
  trend,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  trend?: { value: number; label: string; positive?: boolean };
}) => (
  <Card className="hover:shadow-lg transition-shadow">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-display font-bold mt-1">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp
                className={`w-3 h-3 ${trend.positive ? "text-green-500" : "text-red-500"}`}
              />
              <span
                className={`text-xs ${trend.positive ? "text-green-500" : "text-red-500"}`}
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
);

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  createdAt: string;
}

interface ClassSession {
  _id: string;
  instructor: {
    _id: string;
    name: string;
  };
  students: Array<{
    _id: string;
    name: string;
  }>;
  date: string;
  startTime: string;
  endTime: string;
  status?: string;
  capacity?: number;
}

interface Booking {
  _id: string;
  student: {
    _id: string;
    name: string;
  };
  classSession: {
    _id: string;
    date: string;
    startTime: string;
    instructor: {
      name: string;
    };
  };
  status: string;
  date: string;
  slot: string;
  createdAt: string;
}

interface Feedback {
  _id: string;
  student: {
    _id: string;
    name: string;
  };
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

const ManagersDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState({
    users: true,
    sessions: true,
    bookings: true,
    feedback: true,
  });

  useEffect(() => {
    if (!user?.id) return;

    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    // Fetch all users
    setLoading((prev) => ({ ...prev, users: true }));
    fetch(`${SERVER_URL}/admin/users`, { headers })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setUsers(data.data);
        }
      })
      .catch((error) => console.error("Error fetching users:", error))
      .finally(() => setLoading((prev) => ({ ...prev, users: false })));

    // Fetch all sessions
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

    // Fetch all bookings (you might need a dedicated endpoint for this)
    setLoading((prev) => ({ ...prev, bookings: true }));
    fetch(`${SERVER_URL}/admin/bookings`, { headers })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.bookings)) {
          setBookings(data.bookings);
        }
      })
      .catch((error) => console.error("Error fetching bookings:", error))
      .finally(() => setLoading((prev) => ({ ...prev, bookings: false })));

    // Fetch all feedback
    setLoading((prev) => ({ ...prev, feedback: true }));
    fetch(`${SERVER_URL}/admin/feedback`, { headers })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.feedback)) {
          setFeedback(data.feedback);
        }
      })
      .catch((error) => console.error("Error fetching feedback:", error))
      .finally(() => setLoading((prev) => ({ ...prev, feedback: false })));
  }, [user]);

  if (!user) return null;

  // Filter users by role
  const students = users.filter((u) => u.role === "student");
  const instructors = users.filter((u) => u.role === "instructor");

  // Get current date for comparisons
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate session statistics
  const totalSessions = sessions.length;
  const activeSessions = sessions.filter((s) => {
    const sessionDate = new Date(s.date);
    sessionDate.setHours(0, 0, 0, 0);
    return sessionDate >= today;
  }).length;

  const completedSessions = sessions.filter((s) => {
    const sessionDate = new Date(s.date);
    sessionDate.setHours(0, 0, 0, 0);
    return sessionDate < today;
  }).length;

  // Calculate booking statistics
  const totalBookings = bookings.length;
  const todayBookings = bookings.filter((b) => {
    const bookingDate = new Date(b.date);
    bookingDate.setHours(0, 0, 0, 0);
    return bookingDate.getTime() === today.getTime();
  }).length;

  // Calculate occupancy rate
  const totalCapacity = sessions.reduce(
    (sum, s) => sum + (s.capacity || 20),
    0,
  );
  const totalEnrolled = sessions.reduce(
    (sum, s) => sum + (s.students?.length || 0),
    0,
  );
  const occupancyRate =
    totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;

  // Calculate average rating
  const avgRating =
    feedback.length > 0
      ? (
          feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length
        ).toFixed(1)
      : "0.0";

  // Get recent activities (combined and sorted)
  const recentActivities = [
    ...bookings.map((b) => ({
      id: b._id,
      type: "booking",
      title: "New Booking",
      description: `${b.student?.name || "A student"} booked a class with ${b.classSession?.instructor?.name || "an instructor"}`,
      time: b.createdAt,
      date: b.date,
      slot: b.slot,
    })),
    ...feedback.map((f) => ({
      id: f._id,
      type: "feedback",
      title: "New Feedback",
      description: `${f.student?.name || "A student"} gave ${f.rating}★ feedback to ${f.instructor?.name || "an instructor"}`,
      time: f.createdAt,
      rating: f.rating,
      comment: f.comment,
    })),
    ...users
      .filter(
        (u) =>
          new Date(u.createdAt) >
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      )
      .map((u) => ({
        id: u._id,
        type: "user",
        title: "New User",
        description: `${u.name} joined as ${u.role}`,
        time: u.createdAt,
        role: u.role,
      })),
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 10);

  // Calculate instructor performance
  const instructorPerformance = instructors
    .map((instructor) => {
      const instructorSessions = sessions.filter(
        (s) => s.instructor?._id === instructor._id,
      );
      const instructorFeedback = feedback.filter(
        (f) => f.instructor?._id === instructor._id,
      );
      const avgInstructorRating =
        instructorFeedback.length > 0
          ? (
              instructorFeedback.reduce((sum, f) => sum + f.rating, 0) /
              instructorFeedback.length
            ).toFixed(1)
          : "N/A";
      const totalStudents = new Set(
        instructorSessions.flatMap(
          (s) => s.students?.map((st) => st._id) || [],
        ),
      ).size;

      return {
        ...instructor,
        sessions: instructorSessions.length,
        students: totalStudents,
        avgRating: avgInstructorRating,
        feedbackCount: instructorFeedback.length,
      };
    })
    .sort((a, b) => {
      if (a.avgRating === "N/A") return 1;
      if (b.avgRating === "N/A") return -1;
      return parseFloat(b.avgRating) - parseFloat(a.avgRating);
    });

  // Get upcoming sessions
  const upcomingSessions = sessions
    .filter((s) => {
      const sessionDate = new Date(s.date);
      sessionDate.setHours(0, 0, 0, 0);
      return sessionDate >= today;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-display font-bold">
            Welcome back, {user.name?.split(" ")[0] || "Manager"}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's your business overview and management dashboard
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Students"
          value={students.length}
          icon={Users}
          color="bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
          trend={{ value: 12, label: "vs last month", positive: true }}
        />
        <StatCard
          title="Active Instructors"
          value={instructors.length}
          icon={UserCheck}
          color="bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"
        />
        <StatCard
          title="Active Bookings"
          value={totalBookings}
          icon={BookOpen}
          color="bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400"
          trend={{ value: 8, label: "vs last week", positive: true }}
        />
        <StatCard
          title="Avg Rating"
          value={avgRating}
          icon={Star}
          color="bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{totalSessions}</p>
              <p className="text-sm text-muted-foreground">Total Sessions</p>
              <div className="flex justify-center gap-4 mt-2 text-xs">
                <span className="text-green-600">{activeSessions} Active</span>
                <span className="text-muted-foreground">
                  {completedSessions} Completed
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">
                {occupancyRate}%
              </p>
              <p className="text-sm text-muted-foreground">Occupancy Rate</p>
              <p className="text-xs text-muted-foreground mt-2">
                {totalEnrolled}/{totalCapacity} seats filled
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{todayBookings}</p>
              <p className="text-sm text-muted-foreground">Today's Bookings</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">
                {feedback.length}
              </p>
              <p className="text-sm text-muted-foreground">Total Feedback</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Sessions */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="font-display flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Upcoming Sessions
              </div>
              <button
                onClick={() => navigate("/admin/sessions")}
                className="text-sm text-primary hover:underline"
              >
                View All
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading.sessions ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="animate-pulse h-16 bg-muted rounded-lg"
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingSessions.length > 0 ? (
                  upcomingSessions.map((session) => (
                    <div
                      key={session._id}
                      className="p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors cursor-pointer"
                      onClick={() => navigate(`/admin/sessions/${session._id}`)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium">
                          {new Date(session.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          at {session.startTime}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          {session.students?.length || 0}/
                          {session.capacity || 20}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Instructor: {session.instructor?.name || "TBD"} •{" "}
                        {session.students?.length || 0} students
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground text-sm py-4">
                    No upcoming sessions
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity Feed */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading.bookings || loading.feedback || loading.users ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="animate-pulse h-16 bg-muted rounded-lg"
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                    >
                      <div
                        className={`mt-1 w-2 h-2 rounded-full ${
                          activity.type === "booking"
                            ? "bg-green-500"
                            : activity.type === "feedback"
                              ? "bg-yellow-500"
                              : "bg-blue-500"
                        }`}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(activity.time).toLocaleString()}
                        </p>
                      </div>
                      {activity.type === "feedback" && "rating" in activity && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs font-medium">
                            {activity.rating}
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground text-sm py-4">
                    No recent activity
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructor Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Instructor Performance
            </div>
            <button
              onClick={() => navigate("/admin/instructors")}
              className="text-sm text-primary hover:underline"
            >
              Manage Instructors
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading.users || loading.sessions || loading.feedback ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-pulse h-16 bg-muted rounded-lg"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {instructorPerformance.slice(0, 5).map((instructor) => (
                <div
                  key={instructor._id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors cursor-pointer"
                  onClick={() =>
                    navigate(`/admin/instructors/${instructor._id}`)
                  }
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {instructor.name?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{instructor.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {instructor.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-sm font-medium">
                        {instructor.sessions}
                      </p>
                      <p className="text-xs text-muted-foreground">Sessions</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">
                        {instructor.students}
                      </p>
                      <p className="text-xs text-muted-foreground">Students</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <p className="text-sm font-medium">
                          {instructor.avgRating}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">Rating</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">
                        {instructor.feedbackCount}
                      </p>
                      <p className="text-xs text-muted-foreground">Feedback</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button
          onClick={() => navigate("/admin/users")}
          className="p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors text-left"
        >
          <Users className="w-5 h-5 mb-2 text-primary" />
          <p className="font-medium">Manage Users</p>
          <p className="text-xs text-muted-foreground mt-1">
            {students.length} students, {instructors.length} instructors
          </p>
        </button>
        <button
          onClick={() => navigate("/admin/sessions")}
          className="p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors text-left"
        >
          <Calendar className="w-5 h-5 mb-2 text-primary" />
          <p className="font-medium">Manage Sessions</p>
          <p className="text-xs text-muted-foreground mt-1">
            {activeSessions} upcoming sessions
          </p>
        </button>
        <button
          onClick={() => navigate("/admin/bookings")}
          className="p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors text-left"
        >
          <BookOpen className="w-5 h-5 mb-2 text-primary" />
          <p className="font-medium">View Bookings</p>
          <p className="text-xs text-muted-foreground mt-1">
            {todayBookings} bookings today
          </p>
        </button>
        <button
          onClick={() => navigate("/admin/feedback")}
          className="p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors text-left"
        >
          <Star className="w-5 h-5 mb-2 text-primary" />
          <p className="font-medium">Review Feedback</p>
          <p className="text-xs text-muted-foreground mt-1">
            {feedback.length} total feedback
          </p>
        </button>
      </div>
    </div>
  );
};

export default ManagersDashboardPage;
