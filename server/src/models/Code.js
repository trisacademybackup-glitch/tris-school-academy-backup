const mongoose = require("mongoose");

const codeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  category: {
    type: String,
    enum: ["noob", "ultimate"],
    required: true,
  },
  maxClasses: {
    type: Number,
    default: function defaultMaxClasses() {
      return this.category === "noob" ? 7 : null;
    },
    min: [1, "Max classes must be at least 1"],
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  used: {
    type: Boolean,
    default: false,
  },
  expirationDate: {
    type: Date,
    required: [true, "Expiration date is required for registration codes"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Code", codeSchema);
