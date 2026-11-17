const mongoose = require("mongoose");

// ============================================================
// RECOMMENDED SKILL SCHEMA
// ============================================================

const recommendedSkillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    priority: {
      type: String,
      enum: ["HIGH", "MEDIUM", "LOW"],
      default: "MEDIUM",
    },

    reason: {
      type: String,
      default: "",
    },

    description: {
      type: String,
      default: "",
    },

    estimatedHours: {
      type: Number,
      default: 20,
    },

    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    resources: [
      {
        title: String,
        type: String,
        url: String,
      },
    ],
  },
  {
    _id: true,
  }
);

// ============================================================
// LEARNING STEP SCHEMA
// ============================================================

const learningStepSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    duration: {
      type: String,
      default: "",
    },

    skills: {
      type: [String],
      default: [],
    },

    completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: true,
  }
);

// ============================================================
// LEARNING PLAN SCHEMA
// ============================================================

const learningPlanSchema = new mongoose.Schema(
  {
    // ========================================================
    // CANDIDATE
    // ========================================================

    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ========================================================
    // TARGET JOB
    //
    // This is the job selected from AI Recommendations.
    // ========================================================

    targetJob: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      default: null,
    },

    // ========================================================
    // RESUME
    // ========================================================

    basedOnResume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
      default: null,
    },

    // ========================================================
    // TARGET CAREER
    // ========================================================

    targetRole: {
      type: String,
      default: "Full Stack Developer",
      trim: true,
    },

    // ========================================================
    // CURRENT SKILLS
    // ========================================================

    currentSkills: {
      type: [String],
      default: [],
    },

    // ========================================================
    // RECOMMENDED SKILLS
    // ========================================================

    recommendedSkills: {
      type: [recommendedSkillSchema],
      default: [],
    },

    // ========================================================
    // LEARNING STEPS
    // ========================================================

    steps: {
      type: [learningStepSchema],
      default: [],
    },

    // ========================================================
    // SCORES
    // ========================================================

    currentSkillScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    potentialScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // ========================================================
    // OVERALL PROGRESS
    // ========================================================

    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

// ============================================================
// INDEX
// ============================================================
//
// One candidate can have one active learning plan.
// The target job can change when another AI recommendation
// is selected.
//
// ============================================================

learningPlanSchema.index(
  {
    candidate: 1,
  },
  {
    unique: true,
  }
);

// ============================================================
// MODEL
// ============================================================

module.exports = mongoose.model(
  "LearningPlan",
  learningPlanSchema
);