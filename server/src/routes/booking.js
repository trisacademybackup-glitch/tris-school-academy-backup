const express = require("express");
const { auth, requireRole } = require("../middleware/auth");
const ClassSession = require("../models/ClassSession");
const Booking = require("../models/Booking");
const User = require("../models/User");
const Settings = require("../models/Settings");
const {
  getBookingLimitStats,
  validateBookingAllowance,
} = require("../utils/bookingLimits");

const router = express.Router();

// Helper: get settings (with fallback defaults)
async function getSettings() {
  let settings = await Settings.findOne();
  if (!settings) settings = await Settings.create({});
  return settings;
}

// Helper: delete session if no students remain
async function cleanupEmptySession(sessionId) {
  const session = await ClassSession.findById(sessionId);
  if (session && session.students.length === 0) {
    await ClassSession.findByIdAndDelete(sessionId);
  }
}

// Get available class sessions for booking
router.get(
  "/sessions",
  auth,
  requireRole(["student", "instructor", "manager", "admin"]),
  async (req, res) => {
    try {
      const sessions = await ClassSession.find()
        .populate("instructor students")
        .lean();
      const sessionIds = sessions.map((s) => s._id);
      const bookings = await Booking.find({
        classSession: { $in: sessionIds },
      }).lean();
      const bookingsBySession = {};
      bookings.forEach((b) => {
        const sid = b.classSession.toString();
        if (!bookingsBySession[sid]) bookingsBySession[sid] = [];
        bookingsBySession[sid].push(b);
      });
      sessions.forEach((s) => {
        s.bookings = bookingsBySession[s._id.toString()] || [];
      });
      res.json({ success: true, sessions });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

// Get settings for booking page (public-ish, requires auth)
router.get(
  "/settings",
  auth,
  requireRole(["student", "instructor", "manager", "admin"]),
  async (req, res) => {
    try {
      const settings = await getSettings();
      res.json({
        success: true,
        bookingAheadDays: settings.bookingAheadDays,
        defaultSlots: settings.defaultSlots,
        blockedSlots: settings.blockedSlots,
        unblockedSundays: settings.unblockedSundays,
        allowMultipleStudentsPerSlot: settings.allowMultipleStudentsPerSlot,
        studentsPerSlot: settings.studentsPerSlot,
        allowMultipleBookingsPerDay: settings.allowMultipleBookingsPerDay,
        maxBookingsPerDay: settings.maxBookingsPerDay,
        dropBookingHours: settings.dropBookingHours ?? 0,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

// ── GET /booking/my-stats — booking usage stats for the logged-in student ─────
// Returns: category, activeBookings, periodStart, periodEnd, remaining (noob), limit
router.get(
  "/my-stats",
  auth,
  requireRole(["student", "manager", "admin"]),
  async (req, res) => {
    try {
      const user = await User.findById(req.userId);
      if (!user)
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      const stats = await getBookingLimitStats(user);
      res.json({ success: true, ...stats });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

// Book a class session
router.post(
  "/book",
  auth,
  requireRole(["student", "manager", "admin"]),
  async (req, res) => {
    const { classSessionId } = req.body;
    try {
      const settings = await getSettings();
      const session = await ClassSession.findById(classSessionId);
      if (!session) {
        return res
          .status(404)
          .json({ success: false, message: "Class session not found" });
      }
      const bookingDate = session.date;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const user = await User.findById(req.userId);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
      // Block bookings for past dates
      if (new Date(bookingDate) < today) {
        return res.status(400).json({
          success: false,
          message: "You cannot book a class for a past date.",
        });
      }

      // Only allow booking up to bookingAheadDays ahead (from settings)
      const diffDays = Math.floor(
        (bookingDate - today) / (1000 * 60 * 60 * 24),
      );
      if (diffDays > settings.bookingAheadDays) {
        return res.status(400).json({
          success: false,
          message: `You can only book up to ${settings.bookingAheadDays} day(s) ahead.`,
        });
      }

      // Enforce per-day booking limit from settings
      const maxPerDay = settings.allowMultipleBookingsPerDay
        ? settings.maxBookingsPerDay || 1
        : 1;
      const dayBookingsCount = await Booking.countDocuments({
        student: req.userId,
        date: bookingDate,
        status: "booked",
      });
      if (dayBookingsCount >= maxPerDay) {
        const msg =
          maxPerDay === 1
            ? "You can only book one class per day."
            : `You can only book up to ${maxPerDay} classes per day.`;
        return res.status(400).json({ success: false, message: msg });
      }

      // Check if student is inactive
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: "Your account has been deactivated. Please contact admin.",
        });
      }

      const allowance = await validateBookingAllowance(user);
      if (!allowance.allowed) {
        return res.status(400).json({
          success: false,
          message: allowance.message,
          bookingStats: allowance.stats,
        });
      }

      // Multi-student slot check
      const existingBookingsCount = await Booking.countDocuments({
        classSession: classSessionId,
        status: "booked",
      });
      const maxStudents = settings.allowMultipleStudentsPerSlot
        ? settings.studentsPerSlot
        : 1;
      if (existingBookingsCount >= maxStudents) {
        return res.status(400).json({
          success: false,
          message: "This slot is fully booked.",
        });
      }

      const booking = new Booking({
        student: req.userId,
        classSession: classSessionId,
        status: "booked",
        date: session.date,
        slot: session.startTime || session.timeSlot,
      });
      await booking.save();
      // Set bookingsStartedOn if this is the student's first booking
      const userUpdate = { $push: { bookings: booking._id } };
      const freshUser = await User.findById(req.userId);
      if (freshUser && !freshUser.bookingsStartedOn) {
        userUpdate.$set = { bookingsStartedOn: new Date(session.date) };
      }
      await User.findByIdAndUpdate(req.userId, userUpdate);
      await ClassSession.findByIdAndUpdate(classSessionId, {
        $push: { students: req.userId },
      });
      res.json({ success: true, booking });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

// Cancel a booking (student self-cancel)
// Deletes the booking entirely so the student can re-book on the same day
router.post(
  "/cancel",
  auth,
  requireRole(["student", "manager", "admin"]),
  async (req, res) => {
    const { bookingId, date, slot } = req.body;
    try {
      const booking = await Booking.findOne({ _id: bookingId, date, slot });
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found for this date and slot.",
        });
      }

      // Enforce drop booking hours restriction
      const settings = await getSettings();
      const dropHours = settings.dropBookingHours ?? 0;
      if (dropHours > 0) {
        // Build the class datetime from booking date + slot (e.g. "14:00")
        const bookingDate = new Date(booking.date);
        const [slotHour, slotMin] = (slot || "0:0").split(":").map(Number);
        const classDateTime = new Date(bookingDate);
        classDateTime.setHours(slotHour, slotMin, 0, 0);

        const now = new Date();
        const diffMs = classDateTime.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours < dropHours) {
          return res.status(400).json({
            success: false,
            message: `You cannot drop a class within ${dropHours} hour(s) of the class start time.`,
          });
        }
      }

      const sessionId = booking.classSession;
      await User.findByIdAndUpdate(booking.student, {
        $pull: { bookings: booking._id },
      });
      await ClassSession.findByIdAndUpdate(sessionId, {
        $pull: { students: booking.student },
      });
      await Booking.findByIdAndDelete(bookingId);

      // Delete session if no students remain
      await cleanupEmptySession(sessionId);

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

// Create session and book (used when no session exists yet)
router.post(
  "/create-session-and-book",
  auth,
  requireRole(["student", "manager", "admin"]),
  async (req, res) => {
    const { instructorId, date, timeSlot } = req.body;
    if (!instructorId || !date || !timeSlot) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields." });
    }
    try {
      const settings = await getSettings();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const bookingDate = new Date(date);
      bookingDate.setHours(0, 0, 0, 0);

      // Block bookings for past dates
      if (bookingDate < today) {
        return res.status(400).json({
          success: false,
          message: "You cannot book a class for a past date.",
        });
      }

      // Validate ahead days
      const diffDays = Math.floor(
        (bookingDate - today) / (1000 * 60 * 60 * 24),
      );
      if (diffDays > settings.bookingAheadDays) {
        return res.status(400).json({
          success: false,
          message: `You can only book up to ${settings.bookingAheadDays} day(s) ahead.`,
        });
      }

      // Enforce per-day booking limit
      const maxPerDay = settings.allowMultipleBookingsPerDay
        ? settings.maxBookingsPerDay || 1
        : 1;
      const dayBookingsCount = await Booking.countDocuments({
        student: req.userId,
        date: bookingDate,
        status: "booked",
      });
      if (dayBookingsCount >= maxPerDay) {
        const msg =
          maxPerDay === 1
            ? "You can only book one class per day."
            : `You can only book up to ${maxPerDay} classes per day.`;
        return res.status(400).json({ success: false, message: msg });
      }

      const user = await User.findById(req.userId);
      // Check if student is inactive
      if (user && !user.isActive) {
        return res.status(403).json({
          success: false,
          message: "Your account has been deactivated. Please contact admin.",
        });
      }
      if (user) {
        const allowance = await validateBookingAllowance(user);
        if (!allowance.allowed) {
          return res.status(400).json({
            success: false,
            message: allowance.message,
            bookingStats: allowance.stats,
          });
        }
      }

      let session = await ClassSession.findOne({
        instructor: instructorId,
        date: new Date(date),
        startTime: timeSlot,
      });
      if (!session) {
        session = await ClassSession.create({
          instructor: instructorId,
          date: new Date(date),
          startTime: timeSlot,
          endTime: timeSlot,
          students: [],
        });
      }

      // Multi-student check
      const existingBookingsCount = await Booking.countDocuments({
        classSession: session._id,
        status: "booked",
      });
      const maxStudents = settings.allowMultipleStudentsPerSlot
        ? settings.studentsPerSlot
        : 1;
      if (existingBookingsCount >= maxStudents) {
        return res
          .status(400)
          .json({ success: false, message: "This slot is fully booked." });
      }

      // Already booked by this user?
      const alreadyBooked = await Booking.findOne({
        student: req.userId,
        classSession: session._id,
        status: "booked",
      });
      if (alreadyBooked) {
        return res.status(400).json({
          success: false,
          message: "You have already booked this slot.",
        });
      }

      const booking = new Booking({
        student: req.userId,
        classSession: session._id,
        status: "booked",
        date: session.date,
        slot: session.startTime || session.timeSlot,
      });
      await booking.save();
      // Set bookingsStartedOn if this is the student's first booking
      const userUpdate2 = { $push: { bookings: booking._id } };
      const freshUser2 = await User.findById(req.userId);
      if (freshUser2 && !freshUser2.bookingsStartedOn) {
        userUpdate2.$set = { bookingsStartedOn: new Date(date) };
      }
      await User.findByIdAndUpdate(req.userId, userUpdate2);
      await ClassSession.findByIdAndUpdate(session._id, {
        $push: { students: req.userId },
      });
      res.json({ success: true, booking, session });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

// ── POST /booking/admin-book — Admin books a class on behalf of a student ─────
// Bypasses ahead-days limit and noob quota; admin takes full responsibility.
router.post(
  "/admin-book",
  auth,
  requireRole(["admin", "manager"]),
  async (req, res) => {
    const { studentId, instructorId, date, timeSlot } = req.body;
    if (!studentId || !instructorId || !date || !timeSlot) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: studentId, instructorId, date, timeSlot.",
      });
    }
    try {
      const student = await User.findById(studentId);
      if (!student || student.role !== "student") {
        return res
          .status(404)
          .json({ success: false, message: "Student not found." });
      }

      if (!student.isActive) {
        return res.status(403).json({
          success: false,
          message: "This student's account is deactivated.",
        });
      }

      const instructor = await User.findById(instructorId);
      if (!instructor) {
        return res
          .status(404)
          .json({ success: false, message: "Instructor not found." });
      }

      const bookingDate = new Date(date);
      bookingDate.setHours(0, 0, 0, 0);
      const settings = await getSettings();
      const maxPerDay = settings.allowMultipleBookingsPerDay
        ? settings.maxBookingsPerDay || 1
        : 1;
      const dayBookingsCount = await Booking.countDocuments({
        student: studentId,
        date: bookingDate,
        status: "booked",
      });
      if (dayBookingsCount >= maxPerDay) {
        const msg =
          maxPerDay === 1
            ? "This student can only book one class per day."
            : `This student can only book up to ${maxPerDay} classes per day.`;
        return res.status(400).json({ success: false, message: msg });
      }

      const allowance = await validateBookingAllowance(student);
      if (!allowance.allowed) {
        return res.status(400).json({
          success: false,
          message: allowance.message,
          bookingStats: allowance.stats,
        });
      }

      // Find or create the class session for this instructor/date/slot
      let session = await ClassSession.findOne({
        instructor: instructorId,
        date: bookingDate,
        startTime: timeSlot,
      });
      if (!session) {
        session = await ClassSession.create({
          instructor: instructorId,
          date: bookingDate,
          startTime: timeSlot,
          endTime: timeSlot,
          students: [],
        });
      }

      // Check if student is already booked in this exact session
      const alreadyBooked = await Booking.findOne({
        student: studentId,
        classSession: session._id,
        status: "booked",
      });
      if (alreadyBooked) {
        return res.status(400).json({
          success: false,
          message: "This student is already booked for this slot.",
        });
      }

      // Multi-student slot capacity check (admins still respect slot capacity)
      const maxStudents = settings.allowMultipleStudentsPerSlot
        ? settings.studentsPerSlot
        : 1;
      const existingBookingsCount = await Booking.countDocuments({
        classSession: session._id,
        status: "booked",
      });
      if (existingBookingsCount >= maxStudents) {
        return res.status(400).json({
          success: false,
          message: "This slot is fully booked.",
        });
      }

      const booking = new Booking({
        student: studentId,
        classSession: session._id,
        status: "booked",
        date: bookingDate,
        slot: timeSlot,
      });
      await booking.save();

      const userUpdate = { $push: { bookings: booking._id } };
      if (!student.bookingsStartedOn && allowance.stats.limit !== null) {
        userUpdate.$set = { bookingsStartedOn: bookingDate };
      }
      await User.findByIdAndUpdate(studentId, userUpdate);
      await ClassSession.findByIdAndUpdate(session._id, {
        $push: { students: studentId },
      });

      res.json({ success: true, booking, session });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

// Get all bookings for the logged-in student (for timetable)
router.get(
  "/my-bookings",
  auth,
  requireRole(["student", "manager", "admin"]),
  async (req, res) => {
    try {
      const bookings = await Booking.find({
        student: req.userId,
        status: "booked",
      })
        .populate({
          path: "classSession",
          populate: { path: "instructor", select: "name email" },
        })
        .sort({ date: 1 });
      res.json({ success: true, bookings });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

// Get all bookings (admin/manager only)
router.get(
  "/all",
  auth,
  requireRole(["admin", "manager"]),
  async (req, res) => {
    try {
      const bookings = await Booking.find({ status: "booked" })
        .populate("student", "name email")
        .populate({
          path: "classSession",
          populate: { path: "instructor", select: "name email" },
        })
        .sort({ date: 1 });
      res.json({ success: true, bookings });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

// Reassign student to different instructor
router.post(
  "/reassign",
  auth,
  requireRole(["admin", "manager"]),
  async (req, res) => {
    const { bookingId, newInstructorId, classSessionId } = req.body;
    try {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res
          .status(404)
          .json({ success: false, message: "Booking not found" });
      }
      let newSession = await ClassSession.findOne({
        instructor: newInstructorId,
        date: booking.date,
        startTime: booking.slot,
      });
      if (!newSession) {
        newSession = await ClassSession.create({
          instructor: newInstructorId,
          date: booking.date,
          startTime: booking.slot,
          endTime: booking.slot,
          students: [],
        });
      }
      await ClassSession.findByIdAndUpdate(classSessionId, {
        $pull: { students: booking.student },
      });
      await ClassSession.findByIdAndUpdate(newSession._id, {
        $addToSet: { students: booking.student },
      });
      booking.classSession = newSession._id;
      await booking.save();

      // Cleanup old session if empty
      await cleanupEmptySession(classSessionId);

      res.json({ success: true, booking });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

// Drop student from class (admin/manager cancel)
router.post(
  "/drop",
  auth,
  requireRole(["admin", "manager"]),
  async (req, res) => {
    const { bookingId } = req.body;
    try {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res
          .status(404)
          .json({ success: false, message: "Booking not found" });
      }
      const sessionId = booking.classSession;
      await User.findByIdAndUpdate(booking.student, {
        $pull: { bookings: booking._id },
      });
      await ClassSession.findByIdAndUpdate(sessionId, {
        $pull: { students: booking.student },
      });
      await Booking.findByIdAndDelete(bookingId);

      // Cleanup empty session
      await cleanupEmptySession(sessionId);

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

// Get all students
router.get(
  "/students",
  auth,
  requireRole(["admin", "manager", "instructor"]),
  async (req, res) => {
    try {
      const users = await User.find({ role: "student" }).select("-password");
      res.json({ success: true, users });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

module.exports = router;
