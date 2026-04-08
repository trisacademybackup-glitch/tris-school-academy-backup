import { User, ClassSession, Feedback, Notification, UserRole } from "./types";

const USERS_KEY = "driveschool_users";
const SESSIONS_KEY = "driveschool_sessions";
const FEEDBACK_KEY = "driveschool_feedback";
const NOTIFICATIONS_KEY = "driveschool_notifications";
const CURRENT_USER_KEY = "driveschool_current_user";

function get<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function set<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Seed default data
export function seedData() {
  const users = get<User[]>(USERS_KEY, []);
  if (users.length > 0) return;

  const defaultUsers: User[] = [
    {
      id: "admin-1",
      name: "Admin User",
      email: "admin@drive.com",
      phone: "555-0100",
      role: "admin",
      code: "12345654321332",
      password: "admin123",
      createdAt: new Date().toISOString(),
    },
    {
      id: "mgr-1",
      name: "Sarah Manager",
      email: "manager@drive.com",
      phone: "555-0200",
      role: "manager",
      code: "12345654321332",

      password: "manager123",
      createdAt: new Date().toISOString(),
    },
    {
      id: "inst-1",
      name: "John Instructor",
      email: "john@drive.com",
      phone: "555-0300",
      code: "12345654321332",

      role: "instructor",
      password: "inst123",
      createdAt: new Date().toISOString(),
    },
    {
      id: "inst-2",
      name: "Emily Instructor",
      code: "12345654321332",

      email: "emily@drive.com",
      phone: "555-0301",
      role: "instructor",
      password: "inst123",
      createdAt: new Date().toISOString(),
    },
    {
      id: "stu-1",
      name: "Mike Student",
      email: "mike@student.com",
      code: "12345654321332",

      phone: "555-0400",
      role: "student",
      password: "stu123",
      createdAt: new Date().toISOString(),
    },
  ];
  set(USERS_KEY, defaultUsers);

  // Generate sessions for the next 7 days
  const sessions: ClassSession[] = [];
  const today = new Date();
  for (let d = 0; d < 7; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() + d);
    if (date.getDay() === 0) continue; // Skip Sunday
    const dateStr = date.toISOString().split("T")[0];
    const instructors = ["inst-1", "inst-2"];
    for (const instId of instructors) {
      const slots = [
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
      for (const slot of slots) {
        sessions.push({
          id: `${dateStr}-${slot}-${instId}`,
          date: dateStr,
          timeSlot: slot,
          instructorId: instId,
          studentId: null,
          status: "available",
        });
      }
    }
  }
  set(SESSIONS_KEY, sessions);
  set(FEEDBACK_KEY, []);
  set(NOTIFICATIONS_KEY, []);
}

// Users
export const getUsers = () => get<User[]>(USERS_KEY, []);
export const getUserById = (id: string) => getUsers().find((u) => u.id === id);
export const getUsersByRole = (role: UserRole) =>
  getUsers().filter((u) => u.role === role);
export const addUser = (user: User) => {
  const users = getUsers();
  users.push(user);
  set(USERS_KEY, users);
};
export const updateUser = (user: User) => {
  const users = getUsers().map((u) => (u.id === user.id ? user : u));
  set(USERS_KEY, users);
};
export const deleteUser = (id: string) => {
  set(
    USERS_KEY,
    getUsers().filter((u) => u.id !== id),
  );
};

// Auth
export const login = (email: string, password: string): User | null => {
  const user = getUsers().find(
    (u) => u.email === email && u.password === password,
  );
  if (user) set(CURRENT_USER_KEY, user);
  return user || null;
};
export const getCurrentUser = (): User | null =>
  get<User | null>(CURRENT_USER_KEY, null);
export const logout = () => localStorage.removeItem(CURRENT_USER_KEY);
export const register = (
  data: Omit<User, "id" | "role" | "createdAt">,
): User | string => {
  const existing = getUsers().find((u) => u.email === data.email);
  if (existing) return "Email already in use";
  const user: User = {
    ...data,
    id: `stu-${Date.now()}`,
    role: "student",
    createdAt: new Date().toISOString(),
  };
  addUser(user);
  set(CURRENT_USER_KEY, user);
  return user;
};

// Sessions
export const getSessions = () => get<ClassSession[]>(SESSIONS_KEY, []);
export const getSessionsByDate = (date: string) =>
  getSessions().filter((s) => s.date === date);
export const getSessionsByInstructor = (id: string) =>
  getSessions().filter((s) => s.instructorId === id);
export const getSessionsByStudent = (id: string) =>
  getSessions().filter((s) => s.studentId === id);
export const bookSession = (sessionId: string, studentId: string) => {
  const sessions = getSessions().map((s) =>
    s.id === sessionId ? { ...s, studentId, status: "booked" as const } : s,
  );
  set(SESSIONS_KEY, sessions);
};
export const cancelSession = (sessionId: string) => {
  const sessions = getSessions().map((s) =>
    s.id === sessionId
      ? { ...s, studentId: null, status: "available" as const }
      : s,
  );
  set(SESSIONS_KEY, sessions);
};
export const updateSession = (session: ClassSession) => {
  const sessions = getSessions().map((s) =>
    s.id === session.id ? session : s,
  );
  set(SESSIONS_KEY, sessions);
};

// Feedback
export const getFeedback = () => get<Feedback[]>(FEEDBACK_KEY, []);
export const getFeedbackByInstructor = (id: string) =>
  getFeedback().filter((f) => f.instructorId === id);
export const getFeedbackByStudent = (id: string) =>
  getFeedback().filter((f) => f.studentId === id);
export const addFeedback = (fb: Feedback) => {
  const all = getFeedback();
  all.push(fb);
  set(FEEDBACK_KEY, all);
};

// Notifications
export const getNotifications = (userId: string) =>
  get<Notification[]>(NOTIFICATIONS_KEY, []).filter((n) => n.userId === userId);
export const addNotification = (n: Notification) => {
  const all = get<Notification[]>(NOTIFICATIONS_KEY, []);
  all.push(n);
  set(NOTIFICATIONS_KEY, all);
};
export const markNotificationRead = (id: string) => {
  const all = get<Notification[]>(NOTIFICATIONS_KEY, []).map((n) =>
    n.id === id ? { ...n, read: true } : n,
  );
  set(NOTIFICATIONS_KEY, all);
};
