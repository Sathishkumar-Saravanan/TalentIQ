const express = require("express");

const router = express.Router();

const {
  getResumeHealth,
} = require("../controllers/resumeHealthController");

const {
  protect,
} = require("../middleware/authMiddleware");

/*
============================================================
GET RESUME HEALTH
GET /api/resume-health
============================================================
*/

router.get(
  "/",
  protect,
  getResumeHealth
);

module.exports = router;