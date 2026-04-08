import { ReactNode, useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSimulation } from "@/contexts/SimulationContext";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import {
  NotificationBanner,
  fetchLiveNotifications,
  AppNotification,
} from "@/components/NotificationBanner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  LayoutDashboard,
  Calendar,
  Users,
  MessageSquare,
  Settings,
  LogOut,
  Bell,
  UserCircle,
  BookOpen,
  Star,
  Clock,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Sun,
  Moon,
  HelpCircle,
  BarChart3,
  Book,
  Eye,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { company } from "@/lib/data";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";

const navItems = {
  student: [
    {
      href: "/student-dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      description: "Overview & stats",
    },
    {
      href: "/book",
      label: "Book Class",
      icon: Calendar,
      description: "Schedule your next lesson",
    },
    {
      href: "/my-classes",
      label: "My Classes",
      icon: BookOpen,
      description: "View upcoming classes",
    },
    {
      href: "/student-timetable",
      label: "My Timetable",
      icon: Calendar,
      description: "Weekly schedule view",
    },
    {
      href: "/student-resources",
      label: "Your Resources",
      icon: Book,
      description: "Class Resources",
    },
    {
      href: "/student-feedback",
      label: "Give Feedback",
      icon: MessageSquare,
      description: "Share your experience",
    },
  ],
  instructor: [
    {
      href: "/instructor-dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      description: "Your dashboard",
    },
    {
      href: "/instructor-schedule",
      label: "My Schedule",
      icon: Calendar,
      description: "Manage your classes",
    },
    {
      href: "/student-resources",
      label: "Resources",
      icon: Book,
      description: "Class Resources",
    },
    {
      href: "/instructor-feedback",
      label: "Feedback",
      icon: Star,
      description: "Student reviews",
    },
  ],
  admin: [
    {
      href: "/admin-dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      description: "Business overview",
    },
    {
      href: "/users",
      label: "Users",
      icon: Users,
      description: "Manage students & instructors",
    },
    {
      href: "/admin-instructors",
      label: "Instructors",
      icon: UserCircle,
      description: "Instructor management",
    },
    {
      href: "/admin-schedule",
      label: "Schedule",
      icon: Calendar,
      description: "View all sessions",
    },
    {
      href: "/bookings",
      label: "Bookings",
      icon: BookOpen,
      description: "Manage reservations",
    },
    {
      href: "/admin-feedback",
      label: "Feedback",
      icon: Star,
      description: "Review feedback",
    },
    {
      href: "/admin-slot-management",
      label: "Slots",
      icon: Clock,
      description: "Manage time slots",
    },
    {
      href: "/student-resources",
      label: "Resources",
      icon: Book,
      description: "Class Resources",
    },
    {
      href: "/settings",
      label: "Settings",
      icon: Settings,
      description: "System configuration",
    },
  ],
  manager: [
    {
      href: "/manager-schedule",
      label: "Schedule",
      icon: Calendar,
      description: "View all sessions",
    },
    {
      href: "/student-resources",
      label: "Resources",
      icon: Book,
      description: "Class Resources",
    },
  ],
};

const quickActions = {
  student: [
    {
      label: "Book a Class",
      href: "/book",
      icon: Calendar,
    },
    {
      label: "Schedule",
      href: "/my-classes",
      icon: Clock,
    },
  ],
  instructor: [
    {
      label: "Schedule",
      href: "/instructor-schedule",
      icon: Calendar,
      color: "bg-purple-500",
    },
    {
      label: "Feedback",
      href: "/instructor-feedback",
      icon: Star,
      color: "bg-yellow-500",
    },
  ],
  admin: [
    {
      label: "Add User",
      href: "/users/add",
      icon: Users,
      color: "bg-blue-500",
    },
  ],
  manager: [],
};

// ── Student Simulation Modal ──────────────────────────────────────────────────
const StudentSimulationModal = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const { startSimulation, loading, error } = useSimulation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [localError, setLocalError] = useState("");

  const handleSimulate = async () => {
    if (!email.trim()) {
      setLocalError("Please enter a student email address.");
      return;
    }
    setLocalError("");
    const success = await startSimulation(email.trim());
    if (success) {
      onClose();
      setEmail("");
      navigate("/simulate/dashboard");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSimulate();
  };

  const displayError = localError || error;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Eye className="h-4 w-4 text-amber-600" />
            </div>
            Student Simulation
          </DialogTitle>
          <DialogDescription>
            Enter a student's email address to view the app exactly as they see
            it. This is read-only — no changes will be made to their account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="sim-email">Student Email</Label>
            <Input
              id="sim-email"
              type="email"
              placeholder="student@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setLocalError("");
              }}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>

          {displayError && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <span className="text-base leading-none mt-px">⚠️</span>
              <span>{displayError}</span>
            </div>
          )}

          <div className="rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/40 p-3 text-xs text-amber-800 dark:text-amber-400 space-y-1">
            <p className="font-semibold">What you'll see:</p>
            <ul className="space-y-0.5 list-disc list-inside">
              <li>Their dashboard, bookings & class history</li>
              <li>Their booking plan and slot availability</li>
              <li>Their feedback history</li>
              <li>All in read-only mode — no actions will be taken</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => {
              onClose();
              setEmail("");
              setLocalError("");
            }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSimulate}
            disabled={loading || !email.trim()}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Looking up…
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Start Simulation
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ── Main DashboardLayout ──────────────────────────────────────────────────────
const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [liveNotifications, setLiveNotifications] = useState<AppNotification[]>(
    [],
  );
  const [dismissedBell, setDismissedBell] = useState<Set<string>>(new Set());
  const [simulationModalOpen, setSimulationModalOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    fetchLiveNotifications().then(setLiveNotifications);
    const interval = setInterval(() => {
      fetchLiveNotifications().then(setLiveNotifications);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setIsDarkMode(isDark);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    document.documentElement.classList.toggle("dark");
  };

  if (!user) return null;

  const items = navItems[user.role] || [];
  const actions = quickActions[user.role] || [];
  const currentPage = items.find((i) => i.href === location.pathname);
  const isAdminOrManager = user.role === "admin"; // Only admin can simulate students

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  const unreadCount = liveNotifications.filter(
    (n) => !dismissedBell.has(n._id),
  ).length;

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 w-[280px] z-50 lg:hidden bg-card border-r border-border"
          >
            <MobileSidebar
              user={user}
              items={items}
              currentPath={location.pathname}
              onClose={() => setMobileMenuOpen(false)}
              onLogout={handleLogout}
              getInitials={getInitials}
              isAdminOrManager={isAdminOrManager}
              onSimulate={() => {
                setMobileMenuOpen(false);
                setSimulationModalOpen(true);
              }}
            />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 bottom-0 z-30 hidden lg:flex flex-col bg-card border-r border-border transition-all duration-300",
          sidebarCollapsed ? "w-[80px]" : "w-[280px]",
        )}
      >
        <DesktopSidebar
          user={user}
          items={items}
          currentPath={location.pathname}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          onLogout={handleLogout}
          getInitials={getInitials}
          isAdminOrManager={isAdminOrManager}
          onSimulate={() => setSimulationModalOpen(true)}
        />
      </aside>

      {/* Main Content */}
      <div
        className={cn(
          "transition-all duration-300 min-h-screen flex flex-col",
          "lg:ml-[280px]",
          sidebarCollapsed && "lg:ml-[80px]",
        )}
      >
        {/* Header */}
        <header className="sticky top-0 z-20 bg-card/80 backdrop-blur-xl border-b border-border">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="hidden lg:block">
                <h1 className="text-lg font-display font-semibold">
                  {currentPage?.label || "Dashboard"}
                </h1>
                <p className="text-xs text-gray-300">
                  {currentPage?.description || "Welcome back!"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={toggleTheme}>
                      {isDarkMode ? (
                        <Sun className="h-5 w-5" />
                      ) : (
                        <Moon className="h-5 w-5" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Toggle theme</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Simulate button in header for quick access */}
              {isAdminOrManager && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSimulationModalOpen(true)}
                        className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                      >
                        <Eye className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Simulate Student</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* Notifications */}
              <DropdownMenu
                open={notificationsOpen}
                onOpenChange={setNotificationsOpen}
              >
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-destructive rounded-full ring-2 ring-background flex items-center justify-center">
                        <span className="text-[10px] text-white font-bold px-0.5">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Announcements</span>
                    {unreadCount > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {unreadCount} active
                      </Badge>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <ScrollArea className="max-h-[360px]">
                    {liveNotifications.length > 0 ? (
                      liveNotifications.map((notif) => {
                        const isDismissed = dismissedBell.has(notif._id);
                        const typeColors: Record<string, string> = {
                          info: "bg-blue-500",
                          warning: "bg-yellow-500",
                          success: "bg-green-500",
                          error: "bg-red-500",
                        };
                        return (
                          <DropdownMenuItem
                            key={notif._id}
                            className={cn(
                              "flex flex-col items-start p-3 cursor-default focus:bg-muted/50",
                              isDismissed && "opacity-50",
                            )}
                          >
                            <div className="flex items-start gap-2 w-full">
                              <div
                                className={cn(
                                  "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                                  isDismissed
                                    ? "bg-muted-foreground"
                                    : typeColors[notif.type] || "bg-primary",
                                )}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium leading-snug">
                                  {notif.message}
                                </p>
                                {(notif.date || notif.venue) && (
                                  <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                                    {notif.date && (
                                      <span>
                                        📅{" "}
                                        {new Date(
                                          notif.date + "T00:00:00",
                                        ).toLocaleDateString("en-US", {
                                          month: "short",
                                          day: "numeric",
                                          year: "numeric",
                                        })}
                                      </span>
                                    )}
                                    {notif.venue && (
                                      <span>📍 {notif.venue}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                              {!isDismissed && (
                                <button
                                  className="flex-shrink-0 opacity-40 hover:opacity-100 transition-opacity"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDismissedBell(
                                      (prev) => new Set([...prev, notif._id]),
                                    );
                                  }}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </DropdownMenuItem>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        No announcements right now
                      </div>
                    )}
                  </ScrollArea>
                  {liveNotifications.length > 0 && unreadCount > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="justify-center text-primary text-sm"
                        onClick={() =>
                          setDismissedBell(
                            new Set(liveNotifications.map((n) => n._id)),
                          )
                        }
                      >
                        Dismiss all
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{user.name}</span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {user.role}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <UserCircle className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/help")}>
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Help
                  </DropdownMenuItem>
                  {isAdminOrManager && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setSimulationModalOpen(true)}
                        className="text-amber-600 focus:text-amber-700"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Simulate Student
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="lg:hidden mb-4">
              <h1 className="text-xl font-display font-semibold">
                {currentPage?.label || "Dashboard"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {currentPage?.description || "Welcome back!"}
              </p>
            </div>
            <div className="lg:hidden grid grid-cols-2 gap-2 mb-4">
              {actions.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  onClick={() => navigate(action.href)}
                  className="justify-start h-auto py-3 text-primary hover:text-white"
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center mr-1",
                    )}
                  >
                    <action.icon className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium">{action.label}</p>
                  </div>
                </Button>
              ))}
            </div>
            <NotificationBanner />
            {children}
          </motion.div>
        </main>
      </div>

      {/* Simulation Modal */}
      <StudentSimulationModal
        open={simulationModalOpen}
        onClose={() => setSimulationModalOpen(false)}
      />
    </div>
  );
};

// ── Desktop Sidebar ───────────────────────────────────────────────────────────
interface SidebarUser {
  name: string;
  role: string;
}
interface SidebarItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

interface DesktopSidebarProps {
  user: SidebarUser;
  items: SidebarItem[];
  currentPath: string;
  collapsed: boolean;
  onToggle: () => void;
  onLogout: () => void;
  getInitials: (name: string) => string;
  isAdminOrManager: boolean;
  onSimulate: () => void;
}

const DesktopSidebar = ({
  user,
  items,
  currentPath,
  collapsed,
  onToggle,
  onLogout,
  getInitials,
  isAdminOrManager,
  onSimulate,
}: DesktopSidebarProps) => {
  return (
    <>
      <div
        className={cn(
          "h-16 flex items-center border-b border-border px-4",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        {!collapsed ? (
          <>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-lg">
                {company.name}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 py-4">
        <nav className={cn("space-y-1", collapsed ? "px-2" : "px-3")}>
          {items.map((item) => {
            const active = currentPath === item.href;
            return (
              <TooltipProvider key={item.href}>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link
                      to={item.href}
                      className={cn(
                        "flex items-center rounded-lg transition-all duration-200 group",
                        collapsed ? "justify-center py-3" : "px-3 py-2.5",
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <item.icon
                        className={cn(
                          "h-5 w-5 flex-shrink-0",
                          collapsed ? "mr-0" : "mr-3",
                        )}
                      />
                      {!collapsed && (
                        <span className="text-sm font-medium flex-1">
                          {item.label}
                        </span>
                      )}
                      {!collapsed && active && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-1.5 h-1.5 rounded-full bg-primary-foreground"
                        />
                      )}
                    </Link>
                  </TooltipTrigger>
                  {collapsed && (
                    <TooltipContent
                      side="right"
                      className="flex items-center gap-2"
                    >
                      <span>{item.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {item.description}
                      </span>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            );
          })}

          {/* Student Simulation Button — only for admin/manager */}
          {isAdminOrManager && (
            <>
              <div
                className={cn(
                  "my-2 border-t border-border",
                  collapsed ? "mx-2" : "mx-0",
                )}
              />
              <TooltipProvider>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={onSimulate}
                      className={cn(
                        "w-full flex items-center rounded-lg transition-all duration-200 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20 hover:text-amber-700",
                        collapsed ? "justify-center py-3" : "px-3 py-2.5",
                      )}
                    >
                      <Eye
                        className={cn(
                          "h-5 w-5 flex-shrink-0",
                          collapsed ? "mr-0" : "mr-3",
                        )}
                      />
                      {!collapsed && (
                        <span className="text-sm font-medium flex-1 text-left">
                          Student Simulation
                        </span>
                      )}
                    </button>
                  </TooltipTrigger>
                  {collapsed && (
                    <TooltipContent side="right">
                      <span>Student Simulation</span>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </>
          )}
        </nav>
      </ScrollArea>

      <div
        className={cn(
          "border-t border-border p-4",
          collapsed ? "text-center" : "",
        )}
      >
        <div
          className={cn("flex items-center gap-3", collapsed ? "flex-col" : "")}
        >
          <Avatar
            className={cn(
              "border-2 border-primary/20",
              collapsed ? "h-10 w-10" : "h-9 w-9",
            )}
          >
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {user.role}
              </p>
            </div>
          )}
        </div>
        {!collapsed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="w-full mt-3 justify-start text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        )}
      </div>
    </>
  );
};

// ── Mobile Sidebar ────────────────────────────────────────────────────────────
interface MobileSidebarProps {
  user: SidebarUser;
  items: SidebarItem[];
  currentPath: string;
  onClose: () => void;
  onLogout: () => void;
  getInitials: (name: string) => string;
  isAdminOrManager: boolean;
  onSimulate: () => void;
}

const MobileSidebar = ({
  user,
  items,
  currentPath,
  onClose,
  onLogout,
  getInitials,
  isAdminOrManager,
  onSimulate,
}: MobileSidebarProps) => {
  return (
    <>
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        <span className="font-display font-bold text-lg">{company.name}</span>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-muted-foreground capitalize">
              {user.role}
            </p>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 py-4">
        <nav className="px-3 space-y-1">
          {items.map((item) => {
            const active = currentPath === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="h-5 w-5" />
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs ">{item.description}</p>
                </div>
              </Link>
            );
          })}

          {isAdminOrManager && (
            <>
              <div className="my-2 border-t border-border" />
              <button
                onClick={onSimulate}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20"
              >
                <Eye className="h-5 w-5" />
                <div>
                  <p className="text-sm font-medium text-left">
                    Student Simulation
                  </p>
                  <p className="text-xs text-muted-foreground">
                    View app as a student
                  </p>
                </div>
              </button>
            </>
          )}
        </nav>
      </ScrollArea>

      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          onClick={onLogout}
          className="w-full justify-start text-muted-foreground hover:text-white"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </>
  );
};

export default DashboardLayout;
