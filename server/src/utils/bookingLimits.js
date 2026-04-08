const Booking = require("../models/Booking");
const Code = require("../models/Code");

const PERIOD_DAYS = 30;
const DEFAULT_NOOB_LIMIT = 7;

function normalizeLimit(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.floor(parsed);
}

async function getCodeForUser(user) {
  if (!user?.code || !user?.category) return null;
  return Code.findOne({ code: user.code, category: user.category });
}

async function resolveEffectiveBookingLimit(user, codeDoc = null) {
  const overrideLimit = normalizeLimit(user?.maxClassesOverride);
  if (overrideLimit !== null) return overrideLimit;

  const resolvedCode = codeDoc ?? (await getCodeForUser(user));
  const codeLimit = normalizeLimit(resolvedCode?.maxClasses);
  if (codeLimit !== null) return codeLimit;

  return user?.category === "noob" ? DEFAULT_NOOB_LIMIT : null;
}

async function getBookingLimitStats(user, codeDoc = null) {
  const limit = await resolveEffectiveBookingLimit(user, codeDoc);
  const totalActive = await Booking.countDocuments({
    student: user._id,
    status: "booked",
  });

  let periodStart = user.bookingsStartedOn ? new Date(user.bookingsStartedOn) : null;

  if (!periodStart) {
    const firstBooking = await Booking.findOne({
      student: user._id,
      status: "booked",
    }).sort({ date: 1 });

    if (firstBooking) {
      periodStart = new Date(firstBooking.date);
    }
  }

  if (periodStart) {
    periodStart.setHours(0, 0, 0, 0);
  }

  let periodEnd = null;
  let activeInPeriod = 0;

  if (limit !== null && periodStart) {
    periodEnd = new Date(periodStart);
    periodEnd.setDate(periodStart.getDate() + PERIOD_DAYS);

    activeInPeriod = await Booking.countDocuments({
      student: user._id,
      status: "booked",
      date: { $gte: periodStart, $lte: periodEnd },
    });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const periodElapsed = limit !== null && periodEnd ? periodEnd < today : false;

  return {
    category: user.category,
    totalActive,
    activeInPeriod,
    periodStart: periodStart ? periodStart.toISOString() : null,
    periodEnd: periodEnd ? periodEnd.toISOString() : null,
    periodElapsed,
    limit,
    remaining: limit !== null ? Math.max(0, limit - activeInPeriod) : null,
    periodDays: PERIOD_DAYS,
    bookingsStartedOn: user.bookingsStartedOn,
  };
}

async function validateBookingAllowance(user, codeDoc = null) {
  const stats = await getBookingLimitStats(user, codeDoc);

  if (stats.limit === null) {
    return { allowed: true, stats };
  }

  if (stats.periodElapsed) {
    return {
      allowed: false,
      stats,
      message:
        "Your 30-day booking period has elapsed. Please contact admin to reset your period.",
    };
  }

  if (stats.remaining <= 0) {
    return {
      allowed: false,
      stats,
      message: `You have reached the maximum ${stats.limit} bookings allowed in your 30-day period.`,
    };
  }

  return { allowed: true, stats };
}

module.exports = {
  DEFAULT_NOOB_LIMIT,
  PERIOD_DAYS,
  getBookingLimitStats,
  normalizeLimit,
  resolveEffectiveBookingLimit,
  validateBookingAllowance,
};
