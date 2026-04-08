export type UserRole = "admin" | "manager" | "instructor" | "student";

export interface User {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  code: string;
  password: string;
  createdAt?: string;
  slots?: string[];
  category?: string;
  status?: number;
  maxClassesOverride?: number | null;
  effectiveClassLimit?: number | null;
}
// Optional slots for instructors

export interface ClassSession {
  id?: string;
  _id?: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "10:00"
  startTime?: string;
  instructorId?: string;
  instructor?: { _id: string };
  studentId: string | null;
  students?: [];
  status: "available" | "booked" | "completed" | "cancelled";
}

export interface Feedback {
  id: string;
  studentId: string;
  instructorId: string;
  sessionId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export const TIME_SLOTS = [
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "17:30",
  "12:30",
  "13:30",
  "14:30",
  "15:30",
  "16:30",
  "17:30",
];
