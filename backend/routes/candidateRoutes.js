const express = require("express");

const {
  createProfile,
  getProfile,
  updateProfile,
  deleteProfile,
} = require("../controllers/candidateController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();


// Create candidate profile
router.post(
  "/profile",
  protect,
  authorize("candidate"),
  createProfile
);


// Get candidate profile
router.get(
  "/profile",
  protect,
  authorize("candidate"),
  getProfile
);


// Update candidate profile
router.put(
  "/profile",
  protect,
  authorize("candidate"),
  updateProfile
);


// Delete candidate profile
router.delete(
  "/profile",
  protect,
  authorize("candidate"),
  deleteProfile
);


module.exports = router;