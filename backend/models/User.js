const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        // ========================================================
        // BASIC USER INFORMATION
        // ========================================================

        fullName: {
            type: String,
            default: "",
            trim: true,
        },

        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        password: {
            type: String,
            required: true,
        },

        // ========================================================
        // USER ROLE
        // ========================================================

        role: {
            type: String,
            enum: [
                "candidate",
                "recruiter",
            ],
            default: "candidate",
            required: true,
        },

        // ========================================================
        // ACCOUNT STATUS
        // ========================================================

        isActive: {
            type: Boolean,
            default: true,
        },

        // ========================================================
        // PASSWORD RESET
        // ========================================================

        resetPasswordToken: {
            type: String,
            default: null,
        },

        resetPasswordExpires: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

module.exports =
    mongoose.model(
        "User",
        userSchema
    );