const { generateWeeklySessions } = require("../models/ClassSession");
const express = require("express");
const { auth, requireRole } = require("../middleware/auth");
const ClassSession = require("../models/ClassSession");
const Booking = require("../models/Booking");
const User = require("../models/User");

const router = express.Router();

// List all instructors (with slots) — filters out inactive / expired instructors
// for the booking page.  Admin/manager calls still receive full list via query param.
router.get(
  "/list",
  auth,
  requireRole(["student", "instructor", "manager", "admin"]),
  async (req, res) => {
    try {
      const role = req.query.role; // e.g. ?role=admin to bypass filters
      const isAdminOrManager =
        role === "admin" || role === "manager" || req.query.all === "true";

      const now = new Date();
      // Calculate the date that is bookingAheadDays from now so we can hide
      // instructors whose period expires before the last bookable day
      const Settings = require("../models/Settings");
      let settings = await Settings.findOne();
      if (!settings) settings = await Settings.create({});
      const aheadDays = settings.bookingAheadDays || 7;

      // For the student booking page we want to hide instructors whose
      // periodExpires falls BEFORE today (i.e. they're no longer employed).
      // But we must NOT hide an instructor if clients can still see bookable
      // dates up to the expiry day.
      // Rule: hide instructor only if periodExpires < today (strictly past).
      const query = { role: "instructor" };
      if (!isAdminOrManager) {
        query.isActive = true;
        query.$or = [{ periodExpires: null }, { periodExpires: { $gte: now } }];
      }

      const instructors = await User.find(query).select("-password");
      res.json({ success: true, instructors });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

// Admin: Regenerate sessions for all instructors for a week
router.post(
  "/regenerate-sessions",
  auth,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      // Accept optional startDate (ISO string), default to next Monday
      let { startDate } = req.body;
      if (!startDate) {
        const now = new Date();
        const day = now.getDay();
        const diff = (day === 0 ? 1 : 8) - day; // Next Monday
        now.setDate(now.getDate() + diff);
        startDate = now;
      } else {
        startDate = new Date(startDate);
      }
      await generateWeeklySessions(startDate);
      res.json({
        success: true,
        message: "Sessions regenerated for the week.",
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

// Get slots for a specific instructor
router.get(
  "/:id/slots",
  auth,
  requireRole(["admin", "manager", "instructor", "student"]),
  async (req, res) => {
    try {
      const instructor = await User.findById(req.params.id);
      if (!instructor || instructor.role !== "instructor") {
        return res
          .status(404)
          .json({ success: false, message: "Instructor not found" });
      }
      res.json({ success: true, slots: instructor.slots });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

// Admin: Update slots for an instructor
router.put("/:id/slots", auth, requireRole(["admin"]), async (req, res) => {
  try {
    const { slots } = req.body;
    if (!Array.isArray(slots) || slots.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Slots must be a non-empty array" });
    }
    const instructor = await User.findById(req.params.id);
    if (!instructor || instructor.role !== "instructor") {
      return res
        .status(404)
        .json({ success: false, message: "Instructor not found" });
    }
    instructor.slots = slots;
    await instructor.save();
    res.json({ success: true, slots: instructor.slots });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Instructor: Get own schedule
router.get("/schedule", auth, requireRole(["instructor"]), async (req, res) => {
  try {
    const sessions = await ClassSession.find({
      instructor: req.userId,
    }).populate("students");
    res.json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Manager: Allocate student to instructor
router.post(
  "/allocate",
  auth,
  requireRole(["manager", "admin"]),
  async (req, res) => {
    const { studentId, classSessionId, instructorId } = req.body;
    try {
      await ClassSession.findByIdAndUpdate(classSessionId, {
        instructor: instructorId,
        $addToSet: { students: studentId },
      });
      res.json({ success: true, message: "Student allocated to instructor." });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

// Manager: Drop student from class
router.post(
  "/drop",
  auth,
  requireRole(["manager", "admin"]),
  async (req, res) => {
    const { studentId, classSessionId } = req.body;
    try {
      await ClassSession.findByIdAndUpdate(classSessionId, {
        $pull: { students: studentId },
      });
      res.json({ success: true, message: "Student dropped from class." });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

module.exports = router;
