const mongoose = require("mongoose");

const educationSchema = new mongoose.Schema(
  {
    institution: {
      type: String,
      trim: true,
    },

    degree: {
      type: String,
      trim: true,
    },

    field: {
      type: String,
      trim: true,
    },

    startDate: {
      type: String,
      trim: true,
    },

    endDate: {
      type: String,
      trim: true,
    },

    grade: {
      type: String,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },
  },
  { _id: true }
);

const experienceSchema = new mongoose.Schema(
  {
    company: {
      type: String,
      trim: true,
    },

    position: {
      type: String,
      trim: true,
    },

    location: {
      type: String,
      trim: true,
    },

    startDate: {
      type: String,
      trim: true,
    },

    endDate: {
      type: String,
      trim: true,
    },

    current: {
      type: Boolean,
      default: false,
    },

    description: {
      type: String,
      trim: true,
    },
  },
  { _id: true }
);

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },

    technologies: {
      type: [String],
      default: [],
    },

    description: {
      type: String,
      trim: true,
    },

    liveUrl: {
      type: String,
      trim: true,
    },

    githubUrl: {
      type: String,
      trim: true,
    },
  },
  { _id: true }
);

const certificationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },

    issuer: {
      type: String,
      trim: true,
    },

    date: {
      type: String,
      trim: true,
    },

    credentialUrl: {
      type: String,
      trim: true,
    },
  },
  { _id: true }
);

const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    personalInfo: {
      fullName: {
        type: String,
        trim: true,
      },

      email: {
        type: String,
        trim: true,
      },

      phone: {
        type: String,
        trim: true,
      },

      location: {
        type: String,
        trim: true,
      },

      linkedin: {
        type: String,
        trim: true,
      },

      github: {
        type: String,
        trim: true,
      },

      portfolio: {
        type: String,
        trim: true,
      },
    },

    headline: {
      type: String,
      trim: true,
    },

    summary: {
      type: String,
      trim: true,
    },

    skills: {
      type: [String],
      default: [],
    },

    education: {
      type: [educationSchema],
      default: [],
    },

    experience: {
      type: [experienceSchema],
      default: [],
    },

    projects: {
      type: [projectSchema],
      default: [],
    },

    certifications: {
      type: [certificationSchema],
      default: [],
    },

    achievements: {
      type: [String],
      default: [],
    },

    languages: {
      type: [String],
      default: [],
    },

    template: {
      type: String,
      default: "professional",
      enum: [
        "professional",
        "modern",
        "minimal",
      ],
    },

    completionPercentage: {
      type: Number,
      default: 0,
    },
  },

  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Resume", resumeSchema);