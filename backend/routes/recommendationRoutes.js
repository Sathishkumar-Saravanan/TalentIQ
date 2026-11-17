const express = require("express");

const router = express.Router();

const {
  getRecommendations,
} = require("../controllers/recommendationController");

const {
  protect,
} = require("../middleware/authMiddleware");

// ============================================================
// AI JOB RECOMMENDATIONS
// ============================================================

router.get(
  "/",
  protect,
  getRecommendations
);

module.exports = router;