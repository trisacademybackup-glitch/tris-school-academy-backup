const mongoose = require("mongoose");

const blockedSlotSchema = new mongoose.Schema(
  {
    date: { type: String, required: true }, // YYYY-MM-DD
    from: { type: String, required: true }, // HH:mm
    to: { type: String, required: true }, // HH:mm
    reason: { type: String, default: "" },
  },
  { _id: true },
);

const notificationSchema = new mongoose.Schema(
  {
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["info", "warning", "success", "error"],
      default: "info",
    },
    active: { type: Boolean, default: true },
    // Optional: event date shown in the banner (e.g. "2026-03-15")
    date: { type: String, default: null },
    // Optional: venue/location shown in the banner
    venue: { type: String, default: null },
    // Optional: notification stops showing after this datetime
    expiryDate: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const settingsSchema = new mongoose.Schema({
  // How many days ahead students can book
  bookingAheadDays: { type: Number, default: 2 },

  // Per-day booking limit for students
  allowMultipleBookingsPerDay: { type: Boolean, default: false },
  maxBookingsPerDay: { type: Number, default: 1 },

  // Default time slots for instructors (used when no custom slots assigned)
  defaultSlots: {
    type: [String],
    default: [
      "10:00",
      "11:00",
      "12:00",
      "13:00",
      "14:00",
      "15:00",
      "16:00",
      "17:00",
    ],
  },

  // Blocked date/time ranges (admin managed)
  blockedSlots: [blockedSlotSchema],

  // Sundays that are UNBLOCKED (exceptions - admin allows booking on these)
  unblockedSundays: { type: [String], default: [] },

  // Multi-student slot settings
  allowMultipleStudentsPerSlot: { type: Boolean, default: false },
  studentsPerSlot: { type: Number, default: 1 },

  // Minimum hours before class start that a student can drop/cancel
  // 0 means no restriction (can cancel any time)
  dropBookingHours: { type: Number, default: 0 },

  // Active notifications shown on all pages
  notifications: [notificationSchema],

  // Admin signature – stored as a base64 PNG data URL drawn on the pad
  adminSignature: { type: String, default: null },
  // Display name shown under signature on certificates
  adminSignatureName: { type: String, default: "TRIS" },
  adminSignatureTitle: { type: String, default: "TRIS ACADEMY" },

  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Settings", settingsSchema);
