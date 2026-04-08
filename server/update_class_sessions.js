// Script to update ClassSession startTime and endTime to new slot schedule
// Run this in your backend environment

const mongoose = require("mongoose");
const ClassSession = require("./src/models/ClassSession");

const slotMap = {
  "09:30": "10:00",
  "10:30": "11:00",
  "11:30": "12:00",
  "12:30": "13:00",
  "13:30": "14:00",
  "14:30": "15:00",
  "15:30": "16:00",
  "16:30": "17:00",
  "17:30": "17:30",
};

async function updateClassSessions() {
  await mongoose.connect(
    "mongodb+srv://ndegwasamuelgithinji_db_user:fcQCQnmiw3lWXy0Y@cluster0.rtggunz.mongodb.net/tris-school",
  );
  const sessions = await ClassSession.find({});
  let updated = 0;
  for (const session of sessions) {
    let newStart = slotMap[session.startTime] || session.startTime;
    let newEnd = slotMap[session.endTime] || session.endTime;
    if (session.startTime !== newStart || session.endTime !== newEnd) {
      session.startTime = newStart;
      session.endTime = newEnd;
      await session.save();
      updated++;
    }
  }
  console.log(`Updated ${updated} class sessions.`);
  mongoose.disconnect();
}

updateClassSessions();
