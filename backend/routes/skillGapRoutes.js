const express = require("express");

const router = express.Router();

const {
  getSkillGapAnalysis,
} = require("../controllers/skillGapController");

const {
  protect,
} = require("../middleware/authMiddleware");

/*
============================================================
GET SKILL GAP ANALYSIS
GET /api/skill-gap-analysis
============================================================
*/

router.get(
  "/",
  protect,
  getSkillGapAnalysis
);

module.exports = router;