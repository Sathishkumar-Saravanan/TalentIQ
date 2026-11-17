const express = require("express");

const router = express.Router();

const {
  createJobAlert,
  getMyJobAlerts,
  getJobAlert,
  updateJobAlert,
  toggleJobAlert,
  deleteJobAlert,
} = require("../controllers/jobAlertController");

const { protect } = require("../middleware/authMiddleware");

/*
  GET /api/job-alerts
  Get logged-in candidate's alerts
*/
router.get("/", protect, getMyJobAlerts);

/*
  POST /api/job-alerts
  Create new alert
*/
router.post("/", protect, createJobAlert);

/*
  GET /api/job-alerts/:id
*/
router.get("/:id", protect, getJobAlert);

/*
  PUT /api/job-alerts/:id
*/
router.put("/:id", protect, updateJobAlert);

/*
  PATCH /api/job-alerts/:id/toggle
*/
router.patch("/:id/toggle", protect, toggleJobAlert);

/*
  DELETE /api/job-alerts/:id
*/
router.delete("/:id", protect, deleteJobAlert);

module.exports = router;