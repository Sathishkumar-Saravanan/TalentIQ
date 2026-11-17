const express = require("express");

const router = express.Router();

const { aiJobSearch } = require("../controllers/aiJobSearchController");

const { protect } = require("../middleware/authMiddleware");

/*
  AI JOB SEARCH

  GET /api/ai-job-search
*/

router.get(
  "/",
  protect,
  aiJobSearch
);

module.exports = router;