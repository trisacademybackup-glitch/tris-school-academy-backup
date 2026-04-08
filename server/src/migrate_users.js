/**
 * migrate_users.js
 *
 * Run once to backfill the new User fields on existing documents:
 *   - isActive        → default true
 *   - bookingsStartedOn → set from the user's first booking (students only)
 *   - periodExpires   → null (admin sets manually per instructor)
 *
 * Usage:
 *
 * The script is idempotent — re-running it is safe.
 */

require("dotenv").config();
const mongoose = require("mongoose");

// ── Inline minimal schemas so we don't need the full app context ─────────────

const bookingSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: String,
  date: Date,
});
const Booking =
  mongoose.models.Booking || mongoose.model("Booking", bookingSchema);

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    role: String,
    category: String,
    isActive: { type: Boolean, default: null },
    bookingsStartedOn: { type: Date, default: null },
    periodExpires: { type: Date, default: null },
  },
  { strict: false },
);
const User = mongoose.models.User || mongoose.model("User", userSchema);

// ─────────────────────────────────────────────────────────────────────────────

async function run() {
  console.log("Connecting to MongoDB…");
  await mongoose.connect("");
  console.log("Connected.\n");

  const users = await User.find({});
  console.log(`Found ${users.length} users.\n`);

  let updated = 0;

  for (const user of users) {
    const changes = {};

    // 1. isActive — set to true if not already set
    if (user.isActive === null || user.isActive === undefined) {
      changes.isActive = true;
    }

    // 2. periodExpires — leave null; admin sets manually
    if (user.periodExpires === undefined) {
      changes.periodExpires = null;
    }

    // 3. bookingsStartedOn — derive from first booking for students
    if (!user.bookingsStartedOn && user.role === "student") {
      const firstBooking = await Booking.findOne({
        student: user._id,
        status: "booked",
      })
        .sort({ date: 1 })
        .lean();

      if (firstBooking) {
        const d = new Date(firstBooking.date);
        d.setHours(0, 0, 0, 0);
        changes.bookingsStartedOn = d;
      } else {
        changes.bookingsStartedOn = null;
      }
    }

    if (Object.keys(changes).length > 0) {
      await User.updateOne({ _id: user._id }, { $set: changes });
      console.log(
        `  Updated [${user.role}] ${user.email} →`,
        JSON.stringify(changes),
      );
      updated++;
    }
  }

  console.log(`\nDone. ${updated} / ${users.length} users updated.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
