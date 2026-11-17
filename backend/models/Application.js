const mongoose = require("mongoose");

// ============================================================
// ATS RESULT SCHEMA
// ============================================================

const atsResultSchema = new mongoose.Schema(
    {
        // ------------------------------------------------------
        // OVERALL SCORE
        // ------------------------------------------------------

        score: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
        },

        strength: {
            type: String,
            enum: [
                "Strong",
                "Good",
                "Moderate",
                "Weak",
            ],
            default: "Weak",
        },

        recommendation: {
            type: String,
            enum: [
                "Highly Recommended",
                "Recommended",
                "Consider",
                "Not Recommended",
            ],
            default: "Not Recommended",
        },

        // ------------------------------------------------------
        // KEYWORD MATCHING
        // ------------------------------------------------------

        matchedKeywords: {
            type: [String],
            default: [],
        },

        missingKeywords: {
            type: [String],
            default: [],
        },

        keywordMatchPercentage: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
        },

        // ------------------------------------------------------
        // SKILL MATCHING
        // ------------------------------------------------------

        matchedSkills: {
            type: [String],
            default: [],
        },

        missingSkills: {
            type: [String],
            default: [],
        },

        skillMatchPercentage: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
        },

        // ------------------------------------------------------
        // EXPERIENCE MATCHING
        // ------------------------------------------------------

        experienceMatchPercentage: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
        },

        // ------------------------------------------------------
        // EDUCATION MATCHING
        // ------------------------------------------------------

        educationMatchPercentage: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
        },

        // ------------------------------------------------------
        // RESUME COMPLETENESS
        // ------------------------------------------------------

        resumeCompletenessPercentage: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
        },

        // ------------------------------------------------------
        // AI SUMMARY
        // ------------------------------------------------------

        summary: {
            type: String,
            default: "",
            trim: true,
        },

        // ------------------------------------------------------
        // LAST ATS CHECK TIME
        // ------------------------------------------------------

        checkedAt: {
            type: Date,
            default: null,
        },
    },
    {
        // ATS is embedded inside Application.
        // No separate MongoDB _id is required.
        _id: false,
    }
);

// ============================================================
// INTERVIEW SCHEMA
// ============================================================

const interviewSchema = new mongoose.Schema(
    {
        // ------------------------------------------------------
        // INTERVIEW STATUS
        // ------------------------------------------------------

        scheduled: {
            type: Boolean,
            default: false,
        },

        // ------------------------------------------------------
        // ROLE
        // ------------------------------------------------------

        role: {
            type: String,
            default: "",
            trim: true,
        },

        // ------------------------------------------------------
        // COMPANY
        // ------------------------------------------------------

        company: {
            type: String,
            default: "",
            trim: true,
        },

        // ------------------------------------------------------
        // LOCATION
        // ------------------------------------------------------

        location: {
            type: String,
            default: "",
            trim: true,
        },

        // ------------------------------------------------------
        // INTERVIEW DATE
        // ------------------------------------------------------

        date: {
            type: Date,
            default: null,
        },

        // ------------------------------------------------------
        // START TIME
        // ------------------------------------------------------

        startTime: {
            type: String,
            default: "",
            trim: true,
        },

        // ------------------------------------------------------
        // END TIME
        // ------------------------------------------------------

        endTime: {
            type: String,
            default: "",
            trim: true,
        },

        // ------------------------------------------------------
        // GOOGLE MEET / ONLINE MEETING LINK
        // ------------------------------------------------------

        meetLink: {
            type: String,
            default: "",
            trim: true,
        },

        // ------------------------------------------------------
        // SCHEDULED TIMESTAMP
        // ------------------------------------------------------

        scheduledAt: {
            type: Date,
            default: null,
        },
    },
    {
        // Interview is embedded inside Application.
        _id: false,
    }
);

// ============================================================
// APPLICATION SCHEMA
// ============================================================

const applicationSchema = new mongoose.Schema(
    {
        // ======================================================
        // CANDIDATE
        // ======================================================

        candidate: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        // ======================================================
        // JOB
        // ======================================================

        job: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Job",
            required: true,
            index: true,
        },

        // ======================================================
        // CANDIDATE INFORMATION
        // ======================================================

        fullName: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },

        phone: {
            type: String,
            required: true,
            trim: true,
        },

        linkedin: {
            type: String,
            default: "",
            trim: true,
        },

        portfolio: {
            type: String,
            default: "",
            trim: true,
        },

        // ======================================================
        // RESUME INFORMATION
        // ======================================================

        resume: {
            fileName: {
                type: String,
                default: "",
                trim: true,
            },

            fileUrl: {
                type: String,
                default: "",
                trim: true,
            },
        },

        // ======================================================
        // RESUME TEXT
        // Used by ATS analysis
        // ======================================================

        resumeText: {
            type: String,
            default: "",
            trim: true,
        },

        // ======================================================
        // COVER LETTER
        // ======================================================

        coverLetter: {
            type: String,
            default: "",
            trim: true,
        },

        // ======================================================
        // APPLICATION STATUS
        // ======================================================

        status: {
            type: String,

            enum: [
                "Applied",
                "Under Review",
                "Under Consideration",
                "Shortlisted",
                "Interview",
                "Selected",
                "Rejected",
                "No Longer Under Consideration",
            ],

            default: "Applied",

            index: true,
        },

        // ======================================================
        // STATUS UPDATED TIME
        // ======================================================

        statusUpdatedAt: {
            type: Date,
            default: Date.now,
        },

        // ======================================================
        // RECRUITER NOTES
        // ======================================================

        recruiterNotes: {
            type: String,
            default: "",
            trim: true,
        },

        // ======================================================
        // LEGACY / SIMPLE INTERVIEW INFORMATION
        // ======================================================
        // Kept for compatibility with existing controller logic.

        interviewDate: {
            type: Date,
            default: null,
        },

        interviewType: {
            type: String,
            default: "",
            trim: true,
        },

        interviewNotes: {
            type: String,
            default: "",
            trim: true,
        },

        // ======================================================
        // COMPLETE INTERVIEW OBJECT
        // ======================================================

        interview: {
            type: interviewSchema,

            default: () => ({
                scheduled: false,
                role: "",
                company: "",
                location: "",
                date: null,
                startTime: "",
                endTime: "",
                meetLink: "",
                scheduledAt: null,
            }),
        },

        // ======================================================
        // ATS RESULT
        // ======================================================

        ats: {
            type: atsResultSchema,

            default: () => ({
                score: 0,

                strength: "Weak",

                recommendation: "Not Recommended",

                matchedKeywords: [],

                missingKeywords: [],

                matchedSkills: [],

                missingSkills: [],

                keywordMatchPercentage: 0,

                skillMatchPercentage: 0,

                experienceMatchPercentage: 0,

                educationMatchPercentage: 0,

                resumeCompletenessPercentage: 0,

                summary: "",

                checkedAt: null,
            }),
        },

        // ======================================================
        // ATS REVIEW INFORMATION
        // ======================================================

        atsReviewedByRecruiter: {
            type: Boolean,
            default: false,
        },

        atsReviewedAt: {
            type: Date,
            default: null,
        },
    },

    // ==========================================================
    // AUTOMATIC CREATED / UPDATED TIMESTAMPS
    // ==========================================================

    {
        timestamps: true,
    }
);

// ============================================================
// PREVENT DUPLICATE APPLICATION
// ============================================================
// One candidate can apply only once to the same job.
//
// candidate + job
// ============================================================

applicationSchema.index(
    {
        candidate: 1,
        job: 1,
    },
    {
        unique: true,
    }
);

// ============================================================
// ADDITIONAL INDEXES
// ============================================================

// Candidate application history
applicationSchema.index({
    candidate: 1,
    createdAt: -1,
});

// Job application history
applicationSchema.index({
    job: 1,
    createdAt: -1,
});

// Application status filtering
applicationSchema.index({
    status: 1,
    createdAt: -1,
});

// ============================================================
// PRE-SAVE NORMALIZATION
// ============================================================
//
// IMPORTANT:
// Do NOT use:
//
// applicationSchema.pre("save", function (next) {
//
// and do NOT call:
//
// next();
//
// This project uses the current Mongoose version where this
// middleware can be written as a synchronous function.
// ============================================================

applicationSchema.pre("save", function () {
    // --------------------------------------------------------
    // Normalize email
    // --------------------------------------------------------

    if (this.email) {
        this.email = this.email
            .trim()
            .toLowerCase();
    }

    // --------------------------------------------------------
    // Update status timestamp
    // --------------------------------------------------------

    if (this.isModified("status")) {
        this.statusUpdatedAt = new Date();
    }
});

// ============================================================
// EXPORT MODEL
// ============================================================

module.exports = mongoose.model(
    "Application",
    applicationSchema
);