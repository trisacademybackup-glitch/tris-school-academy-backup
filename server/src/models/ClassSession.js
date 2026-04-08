// Utility to generate sessions for a week for all instructors
// Call this after slots are updated or on schedule
const User = require("./User");

// Generate sessions for a week (Monday to Saturday) for all instructors
// This can be called from an admin route or a script
async function generateWeeklySessions(startDate) {
  // startDate: Date object for Monday of the week
  const instructors = await User.find({ role: "instructor" });
  const days = [0, 1, 2, 3, 4, 5]; // Mon-Sat (0=Mon)
  for (const instructor of instructors) {
    for (const day of days) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + day);
      for (const slot of instructor.slots) {
        // Check if session already exists
        const exists = await mongoose.model("ClassSession").findOne({
          date: date.toISOString().split("T")[0],
          startTime: slot,
          instructor: instructor._id,
        });
        if (!exists) {
          await mongoose.model("ClassSession").create({
            date: date,
            startTime: slot,
            endTime: slot, // You can adjust endTime logic as needed
            instructor: instructor._id,
            students: [],
          });
        }
      }
    }
  }
}

module.exports.generateWeeklySessions = generateWeeklySessions;
const mongoose = require("mongoose");

const classSessionSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  students: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

module.exports = mongoose.model("ClassSession", classSessionSchema);
