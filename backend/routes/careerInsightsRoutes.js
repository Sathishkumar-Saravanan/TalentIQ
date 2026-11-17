const express = require("express");

const router = express.Router();

const {
  getCareerInsights,
} = require("../controllers/careerInsightsController");

const {
  protect,
} = require("../middleware/authMiddleware");

router.get(
  "/",
  protect,
  getCareerInsights
);

module.exports = router;