// Script to update booked classes to new slot schedule
// Run this in your backend environment

const mongoose = require("mongoose");
const Booking = require("./src/models/Booking");
const ClassSession = require("./src/models/ClassSession");

// Map old slot times to new slot times
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

async function updateBookings() {
  await mongoose.connect(
    "mongodb+srv://ndegwasamuelgithinji_db_user:fcQCQnmiw3lWXy0Y@cluster0.rtggunz.mongodb.net/tris-school",
  ); // Update DB name
  const bookings = await Booking.find({});
  let updated = 0;
  for (const booking of bookings) {
    const oldSlot = booking.slot;
    let newSlot = null;
    // If booked at e.g. 9:30, 9:45, 9:50, set to 10:00
    for (const [old, mapped] of Object.entries(slotMap)) {
      if (oldSlot.startsWith(old.slice(0, 2))) {
        newSlot = mapped;
        break;
      }
    }
    if (newSlot && booking.slot !== newSlot) {
      booking.slot = newSlot;
      await booking.save();
      updated++;
    }
  }
  console.log(`Updated ${updated} bookings.`);
  mongoose.disconnect();
}

updateBookings();
