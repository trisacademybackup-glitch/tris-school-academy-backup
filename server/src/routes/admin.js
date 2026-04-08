const express = require("express");
const User = require("../models/User");
const { auth, requireRole } = require("../middleware/auth");
const CodeModel = require("../models/Code");
const router = express.Router();
const Code = require("../models/Code");
const Booking = require("../models/Booking");
const ClassSession = require("../models/ClassSession");
const Feedback = require("../models/Feedback");
const {
  getBookingLimitStats,
  normalizeLimit,
  resolveEffectiveBookingLimit,
} = require("../utils/bookingLimits");

const checkAdmin = (req, res, next) => {
  next();
};

// Create a new code
router.post("/add-code", auth, checkAdmin, async (req, res) => {
  try {
    const { code, category, expirationDate, maxClasses } = req.body;
    if (!code || !category) {
      return res
        .status(400)
        .json({ success: false, message: "Code and category required" });
    }
    if (!expirationDate) {
      return res
        .status(400)
        .json({ success: false, message: "Expiration date is required" });
    }
    const existing = await Code.findOne({ code });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "Code already exists" });
    }
    const newCode = await Code.create({
      code,
      category,
      maxClasses:
        normalizeLimit(maxClasses) ?? (category === "noob" ? 7 : null),
      issuedBy: req.userId,
      expirationDate: new Date(expirationDate),
    });
    res.json({
      success: true,
      data: newCode,
      message: "Code created successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating code",
      error: error.message,
    });
  }
});

// List all codes
router.get("/codes", auth, checkAdmin, async (req, res) => {
  try {
    const codes = await Code.find().sort({ createdAt: -1 });
    res.json({ success: true, data: codes });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching codes",
      error: error.message,
    });
  }
});

// Edit a code
router.put("/codes/:id", auth, checkAdmin, async (req, res) => {
  try {
    const { code, category, expirationDate, maxClasses } = req.body;
    const existing = await Code.findById(req.params.id);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Code not found" });
    }
    if (code && code !== existing.code) {
      const duplicate = await Code.findOne({ code });
      if (duplicate) {
        return res
          .status(400)
          .json({ success: false, message: "Code value already in use" });
      }
      existing.code = code;
    }
    if (category) existing.category = category;
    if (maxClasses !== undefined) {
      existing.maxClasses = normalizeLimit(maxClasses);
      if (existing.maxClasses === null && existing.category === "noob") {
        existing.maxClasses = 7;
      }
    } else if (category && existing.category === "noob" && !existing.maxClasses) {
      existing.maxClasses = 7;
    }
    if (expirationDate !== undefined) {
      if (!expirationDate) {
        return res
          .status(400)
          .json({ success: false, message: "Expiration date is required" });
      }
      existing.expirationDate = new Date(expirationDate);
    }
    await existing.save();
    res.json({
      success: true,
      data: existing,
      message: "Code updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating code",
      error: error.message,
    });
  }
});

// Delete a code
router.delete("/codes/:id", auth, checkAdmin, async (req, res) => {
  try {
    const code = await Code.findByIdAndDelete(req.params.id);
    if (!code) {
      return res
        .status(404)
        .json({ success: false, message: "Code not found" });
    }
    res.json({ success: true, message: "Code deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting code",
      error: error.message,
    });
  }
});

// Create a new user
router.post("/add-user", auth, checkAdmin, async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      role,
      category,
      code,
      isActive,
      periodExpires,
      bookingsStartedOn,
      maxClassesOverride,
    } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }
    const userData = { name, email, phone, password, role, category, code };
    if (isActive !== undefined) userData.isActive = isActive;
    if (periodExpires) userData.periodExpires = new Date(periodExpires);
    if (bookingsStartedOn) userData.bookingsStartedOn = new Date(bookingsStartedOn);
    if (maxClassesOverride !== undefined) {
      userData.maxClassesOverride = normalizeLimit(maxClassesOverride);
    }
    const user = await User.create(userData);
    const effectiveClassLimit = await resolveEffectiveBookingLimit(user);
    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        category: user.category,
        code: user.code,
        isActive: user.isActive,
        periodExpires: user.periodExpires,
        bookingsStartedOn: user.bookingsStartedOn,
        maxClassesOverride: user.maxClassesOverride,
        effectiveClassLimit,
      },
      message: "User created successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating user",
      error: error.message,
    });
  }
});

router.put("/update-user/:id", auth, checkAdmin, async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      role,
      category,
      code,
      isActive,
      periodExpires,
      bookingsStartedOn,
      maxClassesOverride,
    } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (email !== undefined) update.email = email;
    if (phone !== undefined) update.phone = phone;
    if (role !== undefined) update.role = role;
    if (category !== undefined) update.category = category;
    if (code !== undefined) update.code = code;
    if (isActive !== undefined) update.isActive = isActive;
    if (periodExpires !== undefined)
      update.periodExpires = periodExpires ? new Date(periodExpires) : null;
    if (bookingsStartedOn !== undefined)
      update.bookingsStartedOn = bookingsStartedOn
        ? new Date(bookingsStartedOn)
        : null;
    if (maxClassesOverride !== undefined) {
      update.maxClassesOverride = normalizeLimit(maxClassesOverride);
    }
    if (password && password.length > 0) update.password = password;

    let user = await User.findById(req.params.id).select("+password");
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    user.set(update);
    await user.save();
    const effectiveClassLimit = await resolveEffectiveBookingLimit(user);
    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        category: user.category,
        code: user.code,
        isActive: user.isActive,
        periodExpires: user.periodExpires,
        bookingsStartedOn: user.bookingsStartedOn,
        maxClassesOverride: user.maxClassesOverride,
        effectiveClassLimit,
      },
      message: "User updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating user",
      error: error.message,
    });
  }
});

// Update user by email
router.put("/update-user-email/:idOrEmail", async (req, res) => {
  try {
    const { name, email, phone, password, role, category, code } = req.body;
    const codeDoc = await CodeModel.findOne({ code, category });
    if (!codeDoc) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired code" });
    }
    const update = {};
    if (name) update.name = name;
    if (email) update.email = email;
    if (phone) update.phone = phone;
    if (role) update.role = role;
    if (category) update.category = category;
    if (code) update.code = code;
    if (password && password.length > 0) update.password = password;

    let user = await User.findOne({ email: req.params.idOrEmail }).select(
      "+password",
    );
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    user.set(update);
    await user.save();
    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        category: user.category,
        code: user.code,
      },
      message: "User updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating user",
      error: error.message,
    });
  }
});

// Get all users (with classCount for students)
router.get("/users", auth, checkAdmin, async (req, res) => {
  try {
    const { search, page = 1, limit = 1000 } = req.query;
    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
        { role: { $regex: search, $options: "i" } },
      ];
    }
    const skip = (page - 1) * limit;
    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    // Aggregate booking counts for all student users in one query
    const studentIds = users
      .filter((u) => u.role === "student")
      .map((u) => u._id);

    let classCountMap = {};
    if (studentIds.length > 0) {
      const counts = await Booking.aggregate([
        {
          $match: {
            student: { $in: studentIds },
            status: { $in: ["booked", "completed"] },
          },
        },
        { $group: { _id: "$student", count: { $sum: 1 } } },
      ]);
      counts.forEach((c) => {
        classCountMap[c._id.toString()] = c.count;
      });
    }

    const codePairs = [
      ...new Set(
        users
          .filter((u) => u.role === "student" && u.code && u.category)
          .map((u) => `${u.category}:::${u.code}`),
      ),
    ];
    const codeDocs =
      codePairs.length > 0
        ? await Code.find({
            $or: codePairs.map((pair) => {
              const [category, code] = pair.split(":::");
              return { category, code };
            }),
          })
        : [];
    const codeMap = new Map(
      codeDocs.map((doc) => [`${doc.category}:::${doc.code}`, doc]),
    );

    const usersWithCounts = await Promise.all(users.map(async (u) => {
      const obj = u.toObject();
      if (u.role === "student") {
        obj.classCount = classCountMap[u._id.toString()] || 0;
        obj.effectiveClassLimit = await resolveEffectiveBookingLimit(
          u,
          codeMap.get(`${u.category}:::${u.code}`),
        );
      }
      return obj;
    }));

    const total = await User.countDocuments(query);
    res.json({
      success: true,
      data: usersWithCounts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message,
    });
  }
});

// Get user by ID
router.get("/users/:id", auth, checkAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching user",
      error: error.message,
    });
  }
});

// Delete user
router.delete("/users/:id", auth, checkAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    res.json({ success: true, message: "Users deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting User",
      error: error.message,
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// STUDENT SIMULATION ENDPOINTS
// Admin/Manager only — view data exactly as a specific student would see it
// ══════════════════════════════════════════════════════════════════════════════

// Look up a student profile by email for simulation
// GET /admin/simulate/lookup?email=xxx
router.get(
  "/simulate/lookup",
  auth,
  requireRole(["admin", "manager"]),
  async (req, res) => {
    try {
      const { email } = req.query;
      if (!email) {
        return res
          .status(400)
          .json({ success: false, message: "Email is required" });
      }

      const student = await User.findOne({
        email: email.trim().toLowerCase(),
        role: "student",
      }).select("-password");

      if (!student) {
        return res.status(404).json({
          success: false,
          message:
            "No student found with that email address. Make sure the email belongs to a student account.",
        });
      }

      res.json({
        success: true,
        student: {
          id: student._id,
          _id: student._id,
          name: student.name,
          email: student.email,
          phone: student.phone,
          role: student.role,
          category: student.category,
          code: student.code,
          createdAt: student.createdAt,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

// Get booking stats for a specific student (mirrors /booking/my-stats)
// GET /admin/simulate/stats?studentId=xxx
router.get(
  "/simulate/stats",
  auth,
  requireRole(["admin", "manager"]),
  async (req, res) => {
    try {
      const { studentId } = req.query;
      if (!studentId) {
        return res
          .status(400)
          .json({ success: false, message: "studentId is required" });
      }

      const student = await User.findById(studentId);
      if (!student || student.role !== "student") {
        return res
          .status(404)
          .json({ success: false, message: "Student not found" });
      }

      const stats = await getBookingLimitStats(student);
      res.json({ success: true, ...stats });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

// Get all sessions with booking status from a student's perspective
// GET /admin/simulate/sessions?studentId=xxx
router.get(
  "/simulate/sessions",
  auth,
  requireRole(["admin", "manager"]),
  async (req, res) => {
    try {
      const { studentId } = req.query;
      if (!studentId) {
        return res
          .status(400)
          .json({ success: false, message: "studentId is required" });
      }

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

// Get feedback submitted by a specific student
// GET /admin/simulate/feedback?studentId=xxx
router.get(
  "/simulate/feedback",
  auth,
  requireRole(["admin", "manager"]),
  async (req, res) => {
    try {
      const { studentId } = req.query;
      if (!studentId) {
        return res
          .status(400)
          .json({ success: false, message: "studentId is required" });
      }

      const feedbacks = await Feedback.find({ student: studentId })
        .populate("instructor", "name email")
        .populate("classSession", "date startTime")
        .sort({ createdAt: -1 })
        .lean();

      res.json({ success: true, feedbacks });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

// ── Toggle user isActive ────────────────────────────────────────────────────
router.put("/users/:id/toggle-active", auth, checkAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, isActive: user.isActive });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── Reset student 30-day booking period ────────────────────────────────────
router.put(
  "/users/:id/reset-booking-period",
  auth,
  checkAdmin,
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user)
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      user.bookingsStartedOn = null;
      await user.save();
      res.json({
        success: true,
        message: "Booking period reset. It will restart on the next booking.",
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
);

// Get all bookings for a simulated student (for timetable view)
// GET /admin/simulate/bookings?studentId=xxx
router.get(
  "/simulate/bookings",
  auth,
  requireRole(["admin", "manager"]),
  async (req, res) => {
    try {
      const { studentId } = req.query;
      if (!studentId) {
        return res
          .status(400)
          .json({ success: false, message: "studentId is required" });
      }

      const bookings = await Booking.find({
        student: studentId,
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

module.exports = router;
