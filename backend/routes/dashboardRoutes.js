const express = require("express");

const router = express.Router();

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const {
  getCandidateDashboard,
  getRecruiterDashboard,
} = require("../controllers/dashboardController");

// =====================================================
// CANDIDATE DASHBOARD
// GET /api/dashboard/candidate
// =====================================================

router.get(
  "/candidate",
  protect,
  authorize("candidate"),
  getCandidateDashboard
);

// =====================================================
// RECRUITER DASHBOARD
// GET /api/dashboard/recruiter
// =====================================================

router.get(
  "/recruiter",
  protect,
  authorize("recruiter"),
  getRecruiterDashboard
);

module.exports = router;