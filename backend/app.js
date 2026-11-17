const express = require("express");
const cors = require("cors");

// ============================================================
// ROUTES
// ============================================================

const authRoutes = require("./routes/authRoutes");
const testRoutes = require("./routes/testRoutes");
const candidateRoutes = require("./routes/candidateRoutes");
const recruiterRoutes = require("./routes/recruiterRoutes");
const aiJobSearchRoutes = require("./routes/aiJobSearchRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const profileRoutes = require("./routes/profileRoutes");
const learningPlanRoutes = require("./routes/learningPlanRoutes");
const jobAlertRoutes = require("./routes/jobAlertRoutes");
const helpRoutes = require("./routes/helpRoutes");
const contactRoutes = require("./routes/contactRoutes");
const careerInsightsRoutes = require("./routes/careerInsightsRoutes");
const skillGapRoutes = require("./routes/skillGapRoutes");
const careerCopilotRoutes = require("./routes/careerCopilotRoutes");
const resumeHealthRoutes = require("./routes/resumeHealthRoutes");
const jobRoutes = require("./routes/jobRoutes");

// AI recommendation route
const recommendationRoutes = require("./routes/recommendationRoutes");


// ============================================================
// APP
// ============================================================

const app = express();


// ============================================================
// CORS
// ============================================================

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);


// ============================================================
// BODY PARSER
// ============================================================

app.use(
  express.json({
    limit: "10mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
  })
);


// ============================================================
// AUTH ROUTES
// ============================================================

app.use(
  "/api/auth",
  authRoutes
);


// ============================================================
// TEST ROUTES
// ============================================================

app.use(
  "/api/test",
  testRoutes
);


// ============================================================
// CANDIDATE ROUTES
// ============================================================

app.use(
  "/api/candidates",
  candidateRoutes
);


// ============================================================
// RECRUITER ROUTES
// ============================================================

app.use(
  "/api/recruiters",
  recruiterRoutes
);


// ============================================================
// AI JOB SEARCH
// ============================================================

app.use(
  "/api/ai-job-search",
  aiJobSearchRoutes
);


// ============================================================
// APPLICATIONS
// ============================================================

app.use(
  "/api/applications",
  applicationRoutes
);


// ============================================================
// RESUMES
// ============================================================

app.use(
  "/api/resumes",
  resumeRoutes
);


// ============================================================
// DASHBOARD
// ============================================================

app.use(
  "/api/dashboard",
  dashboardRoutes
);


// ============================================================
// NOTIFICATIONS
// ============================================================

app.use(
  "/api/notifications",
  notificationRoutes
);


// ============================================================
// PROFILE
// ============================================================

app.use(
  "/api/profile",
  profileRoutes
);


// ============================================================
// LEARNING PLAN
// ============================================================

app.use(
  "/api/learning-plan",
  learningPlanRoutes
);


// ============================================================
// JOB ALERTS
// ============================================================

app.use(
  "/api/job-alerts",
  jobAlertRoutes
);


// ============================================================
// HELP
// ============================================================

app.use(
  "/api/help",
  helpRoutes
);


// ============================================================
// CAREER INSIGHTS
// ============================================================

app.use(
  "/api/career-insights",
  careerInsightsRoutes
);


// ============================================================
// SKILL GAP ANALYSIS
// ============================================================

app.use(
  "/api/skill-gap-analysis",
  skillGapRoutes
);


// ============================================================
// CAREER COPILOT
// ============================================================

app.use(
  "/api/career-copilot",
  careerCopilotRoutes
);


// ============================================================
// RESUME HEALTH
// ============================================================

app.use(
  "/api/resume-health",
  resumeHealthRoutes
);


// ============================================================
// CONTACT
// ============================================================

app.use(
  "/api/contact",
  contactRoutes
);


// ============================================================
// AI JOB RECOMMENDATIONS
// ============================================================
//
// recommendationRoutes.js:
//
// router.get(
//   "/",
//   protect,
//   getRecommendations
// );
//
// Therefore this:
//
// /api/jobs/recommendations
//
// +
//
// recommendationRoutes "/"
//
// becomes:
//
// GET /api/jobs/recommendations
//
// IMPORTANT:
// Keep this BEFORE /api/jobs because jobRoutes may contain
// router.get("/:id", ...).
//
// ============================================================

app.use(
  "/api/jobs/recommendations",
  recommendationRoutes
);


// ============================================================
// JOB ROUTES
// ============================================================

app.use(
  "/api/jobs",
  jobRoutes
);


// ============================================================
// ROOT
// ============================================================

app.get(
  "/",
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Welcome to TalentIQ API",
    });
  }
);


// ============================================================
// HEALTH CHECK
// ============================================================

app.get(
  "/api/health",
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "TalentIQ API is healthy",
    });
  }
);


// ============================================================
// 404 HANDLER
// ============================================================

app.use(
  (req, res) => {
    res.status(404).json({
      success: false,
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
  }
);


// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

app.use(
  (error, req, res, next) => {
    console.error(
      "GLOBAL ERROR:",
      error
    );

    res.status(
      error.status || 500
    ).json({
      success: false,
      message:
        error.message ||
        "Internal server error",
    });
  }
);


// ============================================================
// EXPORT
// ============================================================

module.exports = app;