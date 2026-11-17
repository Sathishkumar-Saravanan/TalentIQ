const mongoose = require("mongoose");

const recruiterProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    companyName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    designation: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    phone: {
      type: String,
      trim: true,
      maxlength: 30,
      default: "",
    },

    location: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "",
    },

    bio: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: "",
    },

    website: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },

    linkedin: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const RecruiterProfile = mongoose.model(
  "RecruiterProfile",
  recruiterProfileSchema
);

module.exports = RecruiterProfile;