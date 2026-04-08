import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSimulation } from "@/contexts/SimulationContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  CalendarDays,
  BookOpen,
  MessageSquare,
  LogOut,
  X,
  User,
  Eye,
  ChevronRight,
  AlertTriangle,
  Book,
} from "lucide-react";
import { motion } from "framer-motion";
import { company } from "@/lib/data";

const simNavItems = [
  {
    href: "/simulate/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    description: "Student overview",
  },
  {
    href: "/simulate/book",
    label: "Book Class",
    icon: Calendar,
    description: "Booking calendar",
  },
  {
    href: "/simulate/classes",
    label: "My Classes",
    icon: BookOpen,
    description: "Upcoming & past classes",
  },
  {
    href: "/simulate/timetable",
    label: "Timetable",
    icon: CalendarDays,
    description: "Weekly schedule view",
  },
  {
    href: "/simulate/resources",
    label: "Resources",
    icon: Book,
    description: "Class resources",
  },
  {
    href: "/simulate/feedback",
    label: "Feedback",
    icon: MessageSquare,
    description: "Student feedback history",
  },
];

const SimulationLayout = ({ children }: { children: ReactNode }) => {
  const { simulatedStudent, stopSimulation } = useSimulation();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (!simulatedStudent) {
    navigate("/admin-dashboard");
    return null;
  }

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  const handleExit = () => {
    stopSimulation();
    navigate("/admin-dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Simulation Banner ───────────────────────────────────────────── */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 shadow-lg">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-amber-950/20 flex items-center justify-center flex-shrink-0">
              <Eye className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm uppercase tracking-wide">
                Admin Simulation Mode
              </span>
              <span className="hidden sm:inline text-amber-900">—</span>
              <span className="hidden sm:inline text-sm">
                Viewing as <strong>{simulatedStudent.name}</strong>
              </span>
              <Badge
                variant="outline"
                className="hidden md:flex border-amber-950/30 text-amber-950 text-xs bg-amber-400/40"
              >
                {simulatedStudent.email}
              </Badge>
              {simulatedStudent.category && (
                <Badge className="hidden lg:flex bg-amber-950/20 text-amber-950 border-0 text-xs capitalize">
                  {simulatedStudent.category}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-amber-900 hidden sm:block">
              Read-only view
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleExit}
              className="h-7 px-3 text-amber-950 hover:bg-amber-950/10 font-semibold text-xs gap-1.5"
            >
              <X className="h-3.5 w-3.5" />
              Exit Simulation
            </Button>
          </div>
        </div>
      </div>

      {/* ── Desktop Sidebar ──────────────────────────────────────────────── */}
      <aside
        className={cn(
          "fixed top-[40px] left-0 bottom-0 z-30 hidden lg:flex flex-col bg-card border-r border-amber-200 dark:border-amber-900/40 transition-all duration-300",
          sidebarOpen ? "w-[260px]" : "w-[68px]",
        )}
      >
        {/* Sidebar Header */}
        <div className="h-14 flex items-center justify-between border-b border-amber-100 dark:border-amber-900/30 px-4 bg-amber-50/50 dark:bg-amber-950/10">
          {sidebarOpen ? (
            <>
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <Eye className="h-3.5 w-3.5 text-amber-600" />
                </div>
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 truncate">
                  {company.name} — Student View
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground"
                onClick={() => setSidebarOpen(false)}
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 mx-auto text-muted-foreground"
              onClick={() => setSidebarOpen(true)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Nav Items */}
        <ScrollArea className="flex-1 py-4">
          <nav className={cn("space-y-1", sidebarOpen ? "px-3" : "px-2")}>
            {simNavItems.map((item) => {
              const active = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center rounded-lg transition-all duration-200",
                    sidebarOpen ? "px-3 py-2.5 gap-3" : "justify-center py-3",
                    active
                      ? "bg-amber-500 text-white"
                      : "text-muted-foreground hover:bg-amber-50 hover:text-amber-900 dark:hover:bg-amber-950/20 dark:hover:text-amber-300",
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {sidebarOpen && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Simulated Student Profile */}
        <div
          className={cn(
            "border-t border-amber-100 dark:border-amber-900/30 bg-amber-50/30 dark:bg-amber-950/5 p-4",
          )}
        >
          <div
            className={cn(
              "flex items-center gap-3",
              !sidebarOpen && "flex-col",
            )}
          >
            <Avatar className="h-9 w-9 border-2 border-amber-400/40 flex-shrink-0">
              <AvatarFallback className="bg-amber-100 text-amber-700 text-xs">
                {getInitials(simulatedStudent.name)}
              </AvatarFallback>
            </Avatar>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {simulatedStudent.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {simulatedStudent.email}
                </p>
                <Badge
                  variant="outline"
                  className="mt-1 text-[10px] border-amber-300 text-amber-700 capitalize px-1.5 py-0"
                >
                  {simulatedStudent.category || "student"}
                </Badge>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExit}
              className="w-full mt-3 justify-start text-amber-700 hover:text-amber-900 hover:bg-amber-100 dark:hover:bg-amber-900/20 text-xs"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Exit Simulation
            </Button>
          )}
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div
        className={cn(
          "transition-all duration-300 min-h-screen flex flex-col pt-[40px]",
          "lg:ml-[260px]",
          !sidebarOpen && "lg:ml-[68px]",
        )}
      >
        {/* Mobile Nav Strip */}
        <div className="lg:hidden flex items-center gap-1 px-4 py-2 border-b border-amber-200 bg-amber-50/50 dark:bg-amber-950/10 overflow-x-auto">
          {simNavItems.map((item) => {
            const active = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
                  active
                    ? "bg-amber-500 text-white"
                    : "text-muted-foreground hover:bg-amber-100 hover:text-amber-800",
                )}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleExit}
            className="ml-auto text-xs text-amber-700 hover:bg-amber-100 whitespace-nowrap"
          >
            <X className="h-3 w-3 mr-1" />
            Exit
          </Button>
        </div>

        {/* Read-Only Notice */}
        <div className="mx-4 lg:mx-6 mt-4 flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/40 text-sm text-amber-800 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>
            <strong>Simulation Mode:</strong> You are viewing{" "}
            <strong>{simulatedStudent.name}</strong>'s dashboard. All booking
            actions are disabled — this is a read-only view.
          </span>
        </div>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default SimulationLayout;
