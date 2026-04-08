const express = require("express");
const { auth, requireRole } = require("../middleware/auth");
const Feedback = require("../models/Feedback");

const router = express.Router();

// Submit feedback
router.post("/submit", auth, requireRole(["student"]), async (req, res) => {
  const {
    instructorId,
    classSessionId,
    // legacy
    rating,
    comment,
    // new category fields
    instructorRating,
    instructorComment,
    gearsRating,
    gearsComment,
    motorcyclesRating,
    motorcyclesComment,
    schedulingRating,
    schedulingComment,
    referralRating,
  } = req.body;

  try {
    const feedback = new Feedback({
      student: req.userId,
      instructor: instructorId || undefined,
      classSession: classSessionId || undefined,
      // legacy
      rating: rating || undefined,
      comment: comment || undefined,
      // categories
      instructorRating: instructorRating || undefined,
      instructorComment: instructorComment || undefined,
      gearsRating: gearsRating || undefined,
      gearsComment: gearsComment || undefined,
      motorcyclesRating: motorcyclesRating || undefined,
      motorcyclesComment: motorcyclesComment || undefined,
      schedulingRating: schedulingRating || undefined,
      schedulingComment: schedulingComment || undefined,
      referralRating: referralRating || undefined,
    });
    await feedback.save();
    res.json({ success: true, feedback });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get(
  "/student/:id",
  auth,
  requireRole(["student", "manager", "admin"]),
  async (req, res) => {
    try {
      const feedbacks = await Feedback.find({
        student: req.params.id,
      }).populate("instructor classSession");
      res.json({ success: true, feedbacks });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

// Get feedback for instructor
router.get(
  "/instructor/:id",
  auth,
  requireRole(["instructor", "manager", "admin"]),
  async (req, res) => {
    try {
      const feedbacks = await Feedback.find({
        instructor: req.params.id,
      }).populate("student classSession");
      res.json({ success: true, feedbacks });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

// Get all feedback (admin/manager only)
router.get(
  "/all",
  auth,
  requireRole(["admin", "manager"]),
  async (req, res) => {
    try {
      const feedbacks = await Feedback.find({}).populate(
        "student instructor classSession",
      );
      res.json({ success: true, feedbacks });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

module.exports = router;
