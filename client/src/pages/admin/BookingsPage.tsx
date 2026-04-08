import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  Clock,
  User,
  ArrowRight,
  X,
  Loader,
  RefreshCw,
  PlusCircle,
  UserCheck,
  Search,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SERVER_URL } from "@/lib/server";

interface Booking {
  _id: string;
  id?: string;
  student: {
    _id: string;
    id?: string;
    name: string;
    email?: string;
  };
  classSession: {
    _id: string;
    id?: string;
    date: string;
    startTime?: string;
    timeSlot?: string;
    instructor?: {
      _id: string;
      id?: string;
      name: string;
      email?: string;
    };
    instructorId?: string;
  };
  status: string;
  date: string;
  slot: string;
  createdAt?: string;
}

interface UserRecord {
  _id: string;
  id?: string;
  name: string;
  email?: string;
  role: string;
}

// Fallback slots used only before settings are loaded
const FALLBACK_SLOTS = [
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

// ── Admin Book For Student Modal ────────────────────────────────────────────
interface AdminBookModalProps {
  open: boolean;
  onClose: () => void;
  students: UserRecord[];
  instructors: UserRecord[];
  onSuccess: () => void;
}

const AdminBookModal = ({
  open,
  onClose,
  students,
  instructors,
  onSuccess,
}: AdminBookModalProps) => {
  const { toast } = useToast();
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedInstructor, setSelectedInstructor] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [availableSlots, setAvailableSlots] =
    useState<string[]>(FALLBACK_SLOTS);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Fetch slots from settings whenever the modal opens
  useEffect(() => {
    if (!open) return;
    setSlotsLoading(true);
    const token = localStorage.getItem("token");
    fetch(`${SERVER_URL}/booking/settings`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (
          data.success &&
          Array.isArray(data.defaultSlots) &&
          data.defaultSlots.length > 0
        ) {
          setAvailableSlots(data.defaultSlots);
        } else {
          setAvailableSlots(FALLBACK_SLOTS);
        }
      })
      .catch(() => setAvailableSlots(FALLBACK_SLOTS))
      .finally(() => setSlotsLoading(false));
  }, [open]);

  const resetForm = () => {
    setSelectedStudent("");
    setSelectedInstructor("");
    setSelectedDate("");
    setSelectedSlot("");
    setStudentSearch("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.email || "").toLowerCase().includes(studentSearch.toLowerCase()),
  );

  const handleSubmit = async () => {
    if (
      !selectedStudent ||
      !selectedInstructor ||
      !selectedDate ||
      !selectedSlot
    ) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all fields before booking.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${SERVER_URL}/booking/admin-book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentId: selectedStudent,
          instructorId: selectedInstructor,
          date: selectedDate,
          timeSlot: selectedSlot,
        }),
      });

      const data = await res.json();

      if (data.success) {
        const student = students.find(
          (s) => (s._id || s.id) === selectedStudent,
        );
        const instructor = instructors.find(
          (i) => (i._id || i.id) === selectedInstructor,
        );
        toast({
          title: "✅ Booking Created",
          description: `${student?.name} booked with ${instructor?.name} on ${selectedDate} at ${selectedSlot}.`,
        });
        resetForm();
        onSuccess();
        onClose();
      } else {
        throw new Error(data.message || "Failed to create booking");
      }
    } catch (error) {
      toast({
        title: "Booking Failed",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Min date = today
  const today = new Date();
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <UserCheck className="h-5 w-5 text-primary" />
            Book a Class for Student
          </DialogTitle>
          <DialogDescription>
            Select a student, instructor, date and time slot to create a booking
            on their behalf.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Student */}
          <div className="space-y-2">
            <Label htmlFor="student-search">Student</Label>
            <Input
              id="student-search"
              placeholder="Search by name or email..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="mb-1"
            />
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger>
                <SelectValue placeholder="Select a student" />
              </SelectTrigger>
              <SelectContent className="max-h-56">
                {filteredStudents.length === 0 ? (
                  <SelectItem value="__none" disabled>
                    No students found
                  </SelectItem>
                ) : (
                  filteredStudents.map((s) => (
                    <SelectItem key={s._id || s.id} value={s._id || s.id!}>
                      <div className="flex flex-col">
                        <span className="font-medium">{s.name}</span>
                        {s.email && (
                          <span className="text-xs text-muted-foreground">
                            {s.email}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Instructor */}
          <div className="space-y-2">
            <Label>Instructor</Label>
            <Select
              value={selectedInstructor}
              onValueChange={setSelectedInstructor}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an instructor" />
              </SelectTrigger>
              <SelectContent>
                {instructors.map((i) => (
                  <SelectItem key={i._id || i.id} value={i._id || i.id!}>
                    <div className="flex flex-col">
                      <span className="font-medium">{i.name}</span>
                      {i.email && (
                        <span className="text-xs text-muted-foreground">
                          {i.email}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="booking-date">Date</Label>
            <Input
              id="booking-date"
              type="date"
              min={minDate}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          {/* Time Slot */}
          <div className="space-y-2">
            <Label>Time Slot</Label>
            <Select
              value={selectedSlot}
              onValueChange={setSelectedSlot}
              disabled={slotsLoading}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    slotsLoading ? "Loading slots…" : "Select a time slot"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {availableSlots.map((slot) => (
                  <SelectItem key={slot} value={slot}>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      {slot}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Summary */}
          {selectedStudent &&
            selectedInstructor &&
            selectedDate &&
            selectedSlot && (
              <div className="rounded-lg border bg-muted/40 p-3 text-sm space-y-1">
                <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide mb-2">
                  Booking Summary
                </p>
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-primary" />
                  <span>
                    {
                      students.find((s) => (s._id || s.id) === selectedStudent)
                        ?.name
                    }
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">
                    {
                      instructors.find(
                        (i) => (i._id || i.id) === selectedInstructor,
                      )?.name
                    }
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  <span>
                    {new Date(selectedDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  <span>{selectedSlot}</span>
                </div>
              </div>
            )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Booking...
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4 mr-2" />
                Confirm Booking
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ── Main BookingsPage ────────────────────────────────────────────────────────
const BookingsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [instructors, setInstructors] = useState<UserRecord[]>([]);
  const [students, setStudents] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [adminBookModal, setAdminBookModal] = useState(false);
  const [search, setSearch] = useState("");
  const [dropModal, setDropModal] = useState<{
    open: boolean;
    bookingId: string | null;
    studentName: string;
    instructorName: string;
    date: string;
    slot: string;
  }>({
    open: false,
    bookingId: null,
    studentName: "",
    instructorName: "",
    date: "",
    slot: "",
  });

  useEffect(() => {
    if (!user || (user.role !== "admin" && user.role !== "manager")) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");

    try {
      const [bookingsRes, instructorsRes, studentsRes] = await Promise.all([
        fetch(`${SERVER_URL}/booking/all`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${SERVER_URL}/instructor/list`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${SERVER_URL}/booking/students`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const bookingsData = await bookingsRes.json();
      const instructorsData = await instructorsRes.json();
      const studentsData = await studentsRes.json();

      if (bookingsData.success && Array.isArray(bookingsData.bookings)) {
        setBookings(bookingsData.bookings);
      } else {
        setBookings([]);
      }

      if (
        instructorsData.success &&
        Array.isArray(instructorsData.instructors)
      ) {
        setInstructors(instructorsData.instructors);
      } else {
        setInstructors([]);
      }

      if (studentsData.success && Array.isArray(studentsData.users)) {
        setStudents(studentsData.users);
      } else {
        setStudents([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load bookings data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const reassign = async (bookingId: string, newInstructorId: string) => {
    setProcessingId(bookingId);
    const token = localStorage.getItem("token");

    try {
      const booking = bookings.find(
        (b) => b._id === bookingId || b.id === bookingId,
      );
      if (!booking) return;

      const response = await fetch(`${SERVER_URL}/booking/reassign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookingId,
          newInstructorId,
          classSessionId: booking.classSession._id || booking.classSession.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Student reassigned to new instructor",
        });
        fetchData();
      } else {
        throw new Error(data.message || "Failed to reassign");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to reassign booking",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const drop = async (bookingId: string) => {
    setProcessingId(bookingId);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${SERVER_URL}/booking/drop`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bookingId }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Student dropped from class",
        });
        fetchData();
      } else {
        throw new Error(data.message || "Failed to drop student");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to drop booking",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (!user || (user.role !== "admin" && user.role !== "manager")) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          You don't have permission to view this page
        </CardContent>
      </Card>
    );
  }

  const visibleBookings = bookings
    .filter((b) => b.status === "booked" || b.status === "cancelled")
    .filter((b) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const studentName = (b.student?.name || "").toLowerCase();
      const studentEmail = (b.student?.email || "").toLowerCase();
      const instructorName = (
        b.classSession?.instructor?.name || ""
      ).toLowerCase();
      const instructorEmail = (
        b.classSession?.instructor?.email || ""
      ).toLowerCase();
      const date = (b.date || b.classSession?.date || "").toLowerCase();
      const slot = (
        b.slot ||
        b.classSession?.startTime ||
        b.classSession?.timeSlot ||
        ""
      ).toLowerCase();
      const status = (b.status || "").toLowerCase();
      return (
        studentName.includes(q) ||
        studentEmail.includes(q) ||
        instructorName.includes(q) ||
        instructorEmail.includes(q) ||
        date.includes(q) ||
        slot.includes(q) ||
        status.includes(q)
      );
    });

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Manage Bookings</h1>
          <p className="text-muted-foreground mt-1">
            View, reassign, cancel or create student bookings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw
              className={cn("w-4 h-4 mr-2", loading && "animate-spin")}
            />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setAdminBookModal(true)}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Book for Student
          </Button>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by student name, email, instructor, date, slot or status..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Admin Book Modal ── */}
      <AdminBookModal
        open={adminBookModal}
        onClose={() => setAdminBookModal(false)}
        students={students}
        instructors={instructors}
        onSuccess={fetchData}
      />

      {/* ── Bookings List ── */}
      {loading ? (
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader className="animate-spin w-5 h-5" />
              <span>Loading bookings...</span>
            </div>
          </CardContent>
        </Card>
      ) : visibleBookings.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No bookings found</h3>
            <p className="text-muted-foreground">
              {search
                ? `No bookings match "${search}". Try a different search term.`
                : `There are no bookings at the moment. Use the "Book for Student" button to create one.`}
            </p>
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="mt-3 text-sm text-primary hover:underline"
              >
                Clear search
              </button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {search && (
            <p className="text-sm text-muted-foreground px-1">
              Showing {visibleBookings.length} result
              {visibleBookings.length !== 1 ? "s" : ""} for{" "}
              <span className="font-medium text-foreground">"{search}"</span>
            </p>
          )}
          {visibleBookings
            .sort(
              (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
            )
            .map((booking) => {
              const student = booking.student;
              const instructor =
                booking.classSession.instructor ||
                instructors.find(
                  (i) =>
                    (i._id || i.id) ===
                    (booking.classSession.instructorId ||
                      booking.classSession.instructor?._id ||
                      booking.classSession.instructor?.id),
                );
              const session = booking.classSession;
              const isProcessing = processingId === (booking._id || booking.id);

              return (
                <Card
                  key={booking._id || booking.id}
                  className={cn(
                    "transition-opacity",
                    isProcessing && "opacity-50",
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <Calendar className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">
                              {new Date(
                                session.date || booking.date,
                              ).toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                              {session.startTime ||
                                session.timeSlot ||
                                booking.slot}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <User className="w-3 h-3" />
                              {student?.name || "Unknown Student"}
                            </span>
                            <ArrowRight className="w-3 h-3 text-muted-foreground" />
                            <span className="flex items-center gap-1 font-medium text-primary">
                              <User className="w-3 h-3" />
                              {instructor?.name || "Unknown Instructor"}
                            </span>
                          </div>
                          {booking.createdAt && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Booked on{" "}
                              {new Date(booking.createdAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-16 sm:ml-0">
                        <Select
                          onValueChange={(v) =>
                            reassign(booking._id || booking.id!, v)
                          }
                          disabled={isProcessing || instructors.length <= 1}
                        >
                          <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Reassign to..." />
                          </SelectTrigger>
                          <SelectContent>
                            {instructors
                              .filter((i) => {
                                const currentId =
                                  instructor?._id || instructor?.id;
                                const instructorId = i._id || i.id;
                                return instructorId !== currentId;
                              })
                              .map((i) => (
                                <SelectItem
                                  key={i._id || i.id}
                                  value={i._id || i.id!}
                                >
                                  <div className="flex items-center gap-2">
                                    <span>{i.name}</span>
                                    {i.email && (
                                      <span className="text-xs text-muted-foreground">
                                        ({i.email})
                                      </span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            {instructors.filter((i) => {
                              const currentId =
                                instructor?._id || instructor?.id;
                              const instructorId = i._id || i.id;
                              return instructorId !== currentId;
                            }).length === 0 && (
                              <SelectItem value="none" disabled>
                                No other instructors available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setDropModal({
                              open: true,
                              bookingId: booking._id || booking.id!,
                              studentName: student?.name || "Unknown Student",
                              instructorName:
                                instructor?.name || "Unknown Instructor",
                              date: new Date(
                                session.date || booking.date,
                              ).toLocaleDateString("en-US", {
                                weekday: "long",
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                              }),
                              slot:
                                session.startTime ||
                                session.timeSlot ||
                                booking.slot,
                            })
                          }
                          disabled={isProcessing}
                          className="text-destructive border-destructive/30 hover:bg-destructive hover:text-white hover:border-destructive"
                        >
                          {isProcessing ? (
                            <Loader className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4 mr-1" />
                          )}
                          Drop
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      )}

      {/* ── Drop Confirmation Modal ── */}
      <Dialog
        open={dropModal.open}
        onOpenChange={(open) =>
          !open && setDropModal((p) => ({ ...p, open: false }))
        }
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              Drop Booking?
            </DialogTitle>
            <DialogDescription className="pt-1">
              You are about to remove a student from a scheduled class. This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {/* Booking details summary */}
          <div className="rounded-xl border bg-muted/40 p-4 space-y-3 my-2">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-background border flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                  Student
                </p>
                <p className="font-semibold">{dropModal.studentName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-background border flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                  Instructor
                </p>
                <p className="font-semibold">{dropModal.instructorName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-background border flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                  Date &amp; Time
                </p>
                <p className="font-semibold">{dropModal.date}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" />
                  {dropModal.slot}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/5 border border-destructive/20 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <p>
              The slot will be freed up and the student will lose their booking.
              They will need to rebook manually.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-1">
            <Button
              variant="outline"
              onClick={() => setDropModal((p) => ({ ...p, open: false }))}
              disabled={!!processingId}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (dropModal.bookingId) {
                  setDropModal((p) => ({ ...p, open: false }));
                  await drop(dropModal.bookingId);
                }
              }}
              disabled={!!processingId}
              className="gap-2"
            >
              {processingId ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Yes, Drop Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookingsPage;
