const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  classSession: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ClassSession",
    required: false,
  },
  // Legacy fields (kept for backward compat)
  rating: { type: Number, min: 1, max: 5, required: false },
  comment: { type: String, required: false },

  // Category feedback fields
  instructorRating: { type: Number, min: 1, max: 5, required: false },
  instructorComment: { type: String, required: false },

  gearsRating: { type: Number, min: 1, max: 5, required: false },
  gearsComment: { type: String, required: false },

  motorcyclesRating: { type: Number, min: 1, max: 5, required: false },
  motorcyclesComment: { type: String, required: false },

  schedulingRating: { type: Number, min: 1, max: 5, required: false },
  schedulingComment: { type: String, required: false },

  referralRating: { type: Number, min: 1, max: 5, required: false },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Feedback", feedbackSchema);
