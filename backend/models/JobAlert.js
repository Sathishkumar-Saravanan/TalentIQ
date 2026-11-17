const mongoose = require("mongoose");

const jobAlertSchema = new mongoose.Schema(
  {
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    keywords: {
      type: String,
      trim: true,
      default: "",
    },

    location: {
      type: String,
      trim: true,
      default: "",
    },

    jobType: {
      type: String,
      enum: [
        "Any",
        "Full Time",
        "Part Time",
        "Internship",
        "Contract",
        "Remote",
      ],
      default: "Any",
    },

    skills: {
      type: [String],
      default: [],
    },

    frequency: {
      type: String,
      enum: ["Daily", "Weekly", "Instant"],
      default: "Daily",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("JobAlert", jobAlertSchema);