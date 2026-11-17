const express = require("express");

const router = express.Router();

const {
  getLearningPlan,
  getLearningPlanByJob,
  createLearningPlan,
  updateLearningStep,
  deleteLearningPlan,
} = require("../controllers/learningPlanController");

const { protect } = require("../middleware/authMiddleware");

// ============================================================
// GET CURRENT USER LEARNING PLAN
// ============================================================
//
// GET /api/learning-plan
//
// ============================================================

router.get(
  "/",
  protect,
  getLearningPlan
);

// ============================================================
// GET LEARNING PLAN FOR SELECTED AI JOB
// ============================================================
//
// GET /api/learning-plan/:jobId
//
// IMPORTANT:
// This route MUST exist because LearningPath.jsx calls:
//
// /api/learning-plan/:jobId
//
// ============================================================

router.get(
  "/:jobId",
  protect,
  getLearningPlanByJob
);

// ============================================================
// CREATE / UPDATE LEARNING PLAN
// ============================================================
//
// POST /api/learning-plan
//
// ============================================================

router.post(
  "/",
  protect,
  createLearningPlan
);

// ============================================================
// UPDATE LEARNING STEP
// ============================================================
//
// PUT /api/learning-plan/step/:stepId
//
// ============================================================

router.put(
  "/step/:stepId",
  protect,
  updateLearningStep
);

// ============================================================
// DELETE LEARNING PLAN
// ============================================================
//
// DELETE /api/learning-plan
//
// ============================================================

router.delete(
  "/",
  protect,
  deleteLearningPlan
);

// ============================================================
// EXPORT
// ============================================================

module.exports = router;