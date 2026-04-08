import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import {
  SimulationProvider,
  useSimulation,
} from "@/contexts/SimulationContext";
import LoginPage from "./pages/auth/LoginPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";

import SettingsPage from "./pages/SettingsPage";
import HelpPage from "./pages/HelpPage";
import DashboardLayout from "./components/DashboardLayout";
import NotFound from "./pages/NotFound";

// students
import StudentDashboardPage from "./pages/students/StudentDashboardPage";
import BookingPage from "./pages/students/BookingPage";
import MyClassesPage from "./pages/students/MyClassesPage";
import StudentTimetablePage from "./pages/students/StudentTimetablePage";
import StudentFeedbackPage from "./pages/students/StudentFeedbackPage";

// instructor
import InstructorDashboardPage from "./pages/instructors/InstructorDashboardPage";

// admin
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminInstructorsPage from "./pages/admin/AdminInstructorsPage";
import InstructorFeedbackPage from "./pages/instructors/InstructorFeedbackPage";
import AdminsFeedbackPage from "./pages/admin/AdminsFeedbackPage";
import UsersPage from "./pages/admin/UsersPage";
import BookingsPage from "./pages/admin/BookingsPage";
import AdminSlotManagement from "./pages/admin/AdminSlotManagement";
import AdminSchedulePage from "./pages/admin/AdminSchedulePage";
import MangersSchedulePage from "./pages/managers/MangersSchedulePage";
import InstructorSchedulePage from "./pages/instructors/InstructorSchedulePage";
import StudentResourcesPage from "./pages/students/StudentResourcesPage";

// student simulation
import SimulationLayout from "./pages/student-simulation/SimulationLayout";
import SimDashboardPage from "./pages/student-simulation/SimDashboardPage";
import SimBookingPage from "./pages/student-simulation/SimBookingPage";
import SimMyClassesPage from "./pages/student-simulation/SimMyClassesPage";
import SimFeedbackPage from "./pages/student-simulation/SimFeedbackPage";
import SimTimetablePage from "./pages/student-simulation/SimTimetablePage";
import TermsAndConditionsPage from "./pages/TermsAndConditionsPage";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  return <DashboardLayout>{children}</DashboardLayout>;
};

// Simulation routes — only accessible by admin/manager while logged in
const SimulationRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { isSimulating } = useSimulation();

  if (!user) return <Navigate to="/" replace />;
  if (user.role !== "admin" && user.role !== "manager") {
    return <Navigate to="/" replace />;
  }
  if (!isSimulating) return <Navigate to="/admin-dashboard" replace />;

  return <SimulationLayout>{children}</SimulationLayout>;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route
        path="/"
        element={
          user?.role === "student" && user?.category ? (
            <Navigate to="/student-dashboard" replace />
          ) : user?.role === "instructor" && user?.category ? (
            <Navigate to="/instructor-dashboard" replace />
          ) : user?.role === "admin" && user?.category ? (
            <Navigate to="/admin-dashboard" replace />
          ) : user?.role === "manager" && user?.category ? (
            <Navigate to="/manager-schedule" replace />
          ) : (
            <LoginPage />
          )
        }
      />

      {/* Students */}
      <Route
        path="/student-dashboard"
        element={
          <ProtectedRoute>
            <StudentDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/book"
        element={
          <ProtectedRoute>
            <BookingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student-timetable"
        element={
          <ProtectedRoute>
            <StudentTimetablePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-classes"
        element={
          <ProtectedRoute>
            <MyClassesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student-resources"
        element={
          <ProtectedRoute>
            <StudentResourcesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student-feedback"
        element={
          <ProtectedRoute>
            <StudentFeedbackPage />
          </ProtectedRoute>
        }
      />

      {/* Instructor */}
      <Route
        path="/instructor-dashboard"
        element={
          <ProtectedRoute>
            <InstructorDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/instructor-schedule"
        element={
          <ProtectedRoute>
            <InstructorSchedulePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/instructor-feedback"
        element={
          <ProtectedRoute>
            <InstructorFeedbackPage />
          </ProtectedRoute>
        }
      />

      {/* Manager */}

      <Route
        path="/manager-schedule"
        element={
          <ProtectedRoute>
            <MangersSchedulePage />
          </ProtectedRoute>
        }
      />

      {/* Admin */}
      <Route
        path="/admin-dashboard"
        element={
          <ProtectedRoute>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-schedule"
        element={
          <ProtectedRoute>
            <AdminSchedulePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-feedback"
        element={
          <ProtectedRoute>
            <AdminsFeedbackPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-slot-management"
        element={
          <ProtectedRoute>
            <AdminSlotManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-instructors"
        element={
          <ProtectedRoute>
            <AdminInstructorsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <UsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings"
        element={
          <ProtectedRoute>
            <BookingsPage />
          </ProtectedRoute>
        }
      />

      {/* Shared */}
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/help"
        element={
          <ProtectedRoute>
            <HelpPage />
          </ProtectedRoute>
        }
      />

      {/* ── Student Simulation Routes ───────────────────────────────────── */}
      <Route
        path="/simulate/dashboard"
        element={
          <SimulationRoute>
            <SimDashboardPage />
          </SimulationRoute>
        }
      />
      <Route
        path="/simulate/book"
        element={
          <SimulationRoute>
            <SimBookingPage />
          </SimulationRoute>
        }
      />
      <Route
        path="/simulate/classes"
        element={
          <SimulationRoute>
            <SimMyClassesPage />
          </SimulationRoute>
        }
      />
      <Route
        path="/simulate/resources"
        element={
          <SimulationRoute>
            <StudentResourcesPage />
          </SimulationRoute>
        }
      />
      <Route
        path="/simulate/timetable"
        element={
          <SimulationRoute>
            <SimTimetablePage />
          </SimulationRoute>
        }
      />
      <Route
        path="/simulate/feedback"
        element={
          <SimulationRoute>
            <SimFeedbackPage />
          </SimulationRoute>
        }
      />

      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/terms" element={<TermsAndConditionsPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SimulationProvider>
            <AppRoutes />
          </SimulationProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
