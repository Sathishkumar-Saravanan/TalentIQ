const mongoose = require("mongoose");

const supportTicketSchema = new mongoose.Schema(
    {
        name: {
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

        subject: {
            type: String,
            required: true,
            trim: true,
        },

        category: {
            type: String,
            enum: [
                "Account",
                "Jobs",
                "Applications",
                "Resume & AI",
                "Recruiter",
                "Technical",
                "Other",
            ],
            default: "Other",
        },

        message: {
            type: String,
            required: true,
            trim: true,
        },

        status: {
            type: String,
            enum: [
                "Open",
                "In Progress",
                "Resolved",
                "Closed",
            ],
            default: "Open",
        },

        priority: {
            type: String,
            enum: [
                "Low",
                "Medium",
                "High",
            ],
            default: "Medium",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model(
    "SupportTicket",
    supportTicketSchema
);