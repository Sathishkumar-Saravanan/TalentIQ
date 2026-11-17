const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        // ====================================================
        // RECIPIENT
        // ====================================================

        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // ====================================================
        // SENDER
        // ====================================================

        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        // ====================================================
        // NOTIFICATION TYPE
        // ====================================================

        type: {
            type: String,

            enum: [
                "APPLICATION_SUBMITTED",
                "APPLICATION_STATUS",
                "SHORTLISTED",
                "INTERVIEW",
                "SELECTED",
                "REJECTION",
                "GENERAL",
            ],

            default: "GENERAL",
        },

        // ====================================================
        // TITLE
        // ====================================================

        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },

        // ====================================================
        // MESSAGE
        // ====================================================

        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000,
        },

        // ====================================================
        // RELATED APPLICATION
        // ====================================================

        relatedApplication: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Application",
            default: null,
        },

        // ====================================================
        // RELATED JOB
        // ====================================================

        relatedJob: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Job",
            default: null,
        },

        // ====================================================
        // READ STATUS
        // ====================================================

        isRead: {
            type: Boolean,
            default: false,
        },
    },

    {
        timestamps: true,
    }
);

// ============================================================
// INDEXES
// ============================================================

notificationSchema.index({
    recipient: 1,
    createdAt: -1,
});

notificationSchema.index({
    recipient: 1,
    isRead: 1,
});

// ============================================================
// MODEL
// ============================================================

const Notification = mongoose.model(
    "Notification",
    notificationSchema
);

module.exports = Notification;