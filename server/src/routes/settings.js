const express = require("express");
const { auth, requireRole } = require("../middleware/auth");
const Settings = require("../models/Settings");
const Booking = require("../models/Booking");
const ClassSession = require("../models/ClassSession");

const router = express.Router();

async function getSettings() {
  let settings = await Settings.findOne();
  if (!settings) settings = await Settings.create({});
  return settings;
}

// Filter notifications that are active and not yet expired
function liveNotifications(notifications) {
  const now = new Date();
  return notifications.filter(
    (n) => n.active && (!n.expiryDate || new Date(n.expiryDate) > now),
  );
}

// GET /api/settings
router.get("/", async (req, res) => {
  try {
    const settings = await getSettings();
    const settingsObj = settings.toObject();
    // Include only live (active + not expired) notifications for display
    settingsObj.activeNotifications = liveNotifications(settings.notifications);
    res.json({ success: true, settings: settingsObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/settings
router.put("/", auth, requireRole(["admin"]), async (req, res) => {
  try {
    const {
      bookingAheadDays,
      defaultSlots,
      allowMultipleStudentsPerSlot,
      studentsPerSlot,
      allowMultipleBookingsPerDay,
      maxBookingsPerDay,
      dropBookingHours,
    } = req.body;

    const settings = await getSettings();

    if (bookingAheadDays !== undefined)
      settings.bookingAheadDays = bookingAheadDays;
    if (defaultSlots !== undefined) settings.defaultSlots = defaultSlots;
    if (allowMultipleStudentsPerSlot !== undefined)
      settings.allowMultipleStudentsPerSlot = allowMultipleStudentsPerSlot;
    if (studentsPerSlot !== undefined)
      settings.studentsPerSlot = studentsPerSlot;
    if (allowMultipleBookingsPerDay !== undefined)
      settings.allowMultipleBookingsPerDay = allowMultipleBookingsPerDay;
    if (maxBookingsPerDay !== undefined)
      settings.maxBookingsPerDay = maxBookingsPerDay;
    if (dropBookingHours !== undefined)
      settings.dropBookingHours = dropBookingHours;

    settings.updatedAt = new Date();
    await settings.save();
    res.json({ success: true, settings, message: "Settings updated" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── Blocked Slots ─────────────────────────────────────────────────────────────

router.post(
  "/blocked-slots",
  auth,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const { date, from, to, reason } = req.body;
      if (!date || !from || !to) {
        return res
          .status(400)
          .json({ success: false, message: "date, from, and to are required" });
      }
      const settings = await getSettings();
      settings.blockedSlots.push({ date, from, to, reason: reason || "" });
      settings.updatedAt = new Date();
      await settings.save();
      res.json({ success: true, settings, message: "Blocked slot added" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

router.delete(
  "/blocked-slots/:id",
  auth,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const settings = await getSettings();
      settings.blockedSlots = settings.blockedSlots.filter(
        (s) => s._id.toString() !== req.params.id,
      );
      settings.updatedAt = new Date();
      await settings.save();
      res.json({ success: true, settings, message: "Blocked slot removed" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

// ── Unblocked Sundays ─────────────────────────────────────────────────────────

// POST /api/settings/unblocked-sundays/unblock-all
// Unblocks every Sunday from today for the next `months` months (default 12)
router.post(
  "/unblocked-sundays/unblock-all",
  auth,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const months = parseInt(req.body.months) || 12;
      const settings = await getSettings();

      const sundays = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Start from this coming Sunday (or today if today is Sunday)
      const startDate = new Date(today);
      const dayOfWeek = startDate.getDay();
      if (dayOfWeek !== 0) {
        startDate.setDate(startDate.getDate() + (7 - dayOfWeek));
      }

      const endDate = new Date(today);
      endDate.setMonth(endDate.getMonth() + months);

      const cursor = new Date(startDate);
      while (cursor <= endDate) {
        // Use local date parts to avoid UTC offset shifting the day
        const year = cursor.getFullYear();
        const month = String(cursor.getMonth() + 1).padStart(2, "0");
        const day = String(cursor.getDate()).padStart(2, "0");
        const dateStr = `${year}-${month}-${day}`;
        sundays.push(dateStr);
        cursor.setDate(cursor.getDate() + 7);
      }

      // Merge with existing (avoid duplicates)
      const existing = new Set(settings.unblockedSundays || []);
      sundays.forEach((d) => existing.add(d));
      settings.unblockedSundays = Array.from(existing).sort();
      settings.updatedAt = new Date();
      await settings.save();

      res.json({
        success: true,
        settings,
        message: `Unblocked ${sundays.length} Sundays over the next ${months} months`,
        count: sundays.length,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

router.post(
  "/unblocked-sundays",
  auth,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const { date } = req.body;
      if (!date)
        return res
          .status(400)
          .json({ success: false, message: "date is required" });
      const settings = await getSettings();
      if (!settings.unblockedSundays.includes(date)) {
        settings.unblockedSundays.push(date);
        settings.updatedAt = new Date();
        await settings.save();
      }
      res.json({
        success: true,
        settings,
        message: "Sunday unblocked for bookings",
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

router.delete(
  "/unblocked-sundays/:date",
  auth,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const settings = await getSettings();
      settings.unblockedSundays = settings.unblockedSundays.filter(
        (d) => d !== req.params.date,
      );
      settings.updatedAt = new Date();
      await settings.save();
      res.json({ success: true, settings, message: "Sunday re-blocked" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

// ── Notifications ─────────────────────────────────────────────────────────────

router.post(
  "/notifications",
  auth,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const { message, type, date, venue, expiryDate } = req.body;
      if (!message) {
        return res
          .status(400)
          .json({ success: false, message: "message is required" });
      }
      const settings = await getSettings();
      settings.notifications.push({
        message,
        type: type || "info",
        active: true,
        date: date || null,
        venue: venue || null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
      });
      settings.updatedAt = new Date();
      await settings.save();
      res.json({ success: true, settings, message: "Notification added" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

router.put(
  "/notifications/:id",
  auth,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const { message, type, active, date, venue, expiryDate } = req.body;
      const settings = await getSettings();
      const notif = settings.notifications.id(req.params.id);
      if (!notif) {
        return res
          .status(404)
          .json({ success: false, message: "Notification not found" });
      }
      if (message !== undefined) notif.message = message;
      if (type !== undefined) notif.type = type;
      if (active !== undefined) notif.active = active;
      if (date !== undefined) notif.date = date || null;
      if (venue !== undefined) notif.venue = venue || null;
      if (expiryDate !== undefined)
        notif.expiryDate = expiryDate ? new Date(expiryDate) : null;
      settings.updatedAt = new Date();
      await settings.save();
      res.json({ success: true, settings, message: "Notification updated" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

router.delete(
  "/notifications/:id",
  auth,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const settings = await getSettings();
      settings.notifications = settings.notifications.filter(
        (n) => n._id.toString() !== req.params.id,
      );
      settings.updatedAt = new Date();
      await settings.save();
      res.json({ success: true, settings, message: "Notification deleted" });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

// ── Delete Old Data ───────────────────────────────────────────────────────────

router.post(
  "/delete-old-data",
  auth,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const threeWeeksAgo = new Date();
      threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);

      const deletedBookings = await Booking.deleteMany({
        date: { $lt: threeWeeksAgo },
      });
      const deletedSessions = await ClassSession.deleteMany({
        date: { $lt: threeWeeksAgo },
      });

      res.json({
        success: true,
        message: `Deleted ${deletedBookings.deletedCount} booking(s) and ${deletedSessions.deletedCount} class session(s) older than 3 weeks.`,
        deletedBookings: deletedBookings.deletedCount,
        deletedSessions: deletedSessions.deletedCount,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

module.exports = router;

// ── Admin Signature ────────────────────────────────────────────────────────

// GET /api/settings/signature  (public – needed by certificate generator)
router.get("/signature", async (req, res) => {
  try {
    const settings = await getSettings();
    res.json({
      success: true,
      adminSignature: settings.adminSignature || null,
      adminSignatureName: settings.adminSignatureName || "TRIS",
      adminSignatureTitle: settings.adminSignatureTitle || "TRIS ACADEMY",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/settings/signature  (admin only)
router.put("/signature", auth, requireRole(["admin"]), async (req, res) => {
  try {
    const { adminSignature, adminSignatureName, adminSignatureTitle } =
      req.body;
    const settings = await getSettings();

    // adminSignature is a base64 data URL (image/png). Validate rough size (<= 500 KB).
    if (adminSignature !== undefined) {
      if (adminSignature !== null) {
        const bytes = Buffer.byteLength(adminSignature, "utf8");
        if (bytes > 512 * 1024) {
          return res.status(400).json({
            success: false,
            message:
              "Signature image too large (max 500 KB). Try clearing and re-signing.",
          });
        }
      }
      settings.adminSignature = adminSignature;
    }
    if (adminSignatureName !== undefined)
      settings.adminSignatureName = adminSignatureName || "TRIS";
    if (adminSignatureTitle !== undefined)
      settings.adminSignatureTitle = adminSignatureTitle || "TRIS ACADEMY";

    settings.updatedAt = new Date();
    await settings.save();
    res.json({ success: true, message: "Signature saved successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
