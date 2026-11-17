const mongoose = require("mongoose");

const helpArticleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      enum: [
        "Getting Started",
        "Account",
        "Jobs",
        "Applications",
        "Resume & AI",
        "Recruiters",
        "Security",
        "Other",
      ],
    },

    icon: {
      type: String,
      default: "❓",
    },

    popular: {
      type: Boolean,
      default: false,
    },

    published: {
      type: Boolean,
      default: true,
    },

    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,

    // IMPORTANT:
    // Use the existing MongoDB collection
    // instead of creating "helparticles".
    collection: "help_articles",
  }
);

module.exports = mongoose.model(
  "HelpArticle",
  helpArticleSchema
);