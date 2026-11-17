const mongoose = require("mongoose");

const ProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    fullName: {
      type: String,
      default: "",
      trim: true,
    },

    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      default: "",
      trim: true,
    },

    location: {
      type: String,
      default: "",
      trim: true,
    },

    headline: {
      type: String,
      default: "",
      trim: true,
    },

    bio: {
      type: String,
      default: "",
    },

    dateOfBirth: {
      type: Date,
      default: null,
    },

    gender: {
      type: String,
      default: "",
    },

    portfolio: {
      type: String,
      default: "",
    },

    linkedin: {
      type: String,
      default: "",
    },

    github: {
      type: String,
      default: "",
    },

    education: {
      degree: {
        type: String,
        default: "",
      },

      college: {
        type: String,
        default: "",
      },

      graduationYear: {
        type: String,
        default: "",
      },

      percentage: {
        type: String,
        default: "",
      },
    },

    experience: {
      jobTitle: {
        type: String,
        default: "",
      },

      company: {
        type: String,
        default: "",
      },

      experienceLevel: {
        type: String,
        default: "",
      },

      years: {
        type: String,
        default: "",
      },
    },

    skills: {
      type: [String],
      default: [],
    },

    careerPreferences: {
      targetRole: {
        type: String,
        default: "",
      },

      preferredLocation: {
        type: String,
        default: "",
      },

      employmentType: {
        type: String,
        default: "Full Time",
      },

      expectedSalary: {
        type: String,
        default: "",
      },

      remotePreference: {
        type: String,
        default: "",
      },
    },

    // ==============================
    // RESUME - GRIDFS
    // ==============================

    resume: {
      type: String,
      default: "",
    },

    resumeFileId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    resumeOriginalName: {
      type: String,
      default: "",
    },

    resumeMimeType: {
      type: String,
      default: "",
    },

    resumeUploadedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Profile", ProfileSchema);