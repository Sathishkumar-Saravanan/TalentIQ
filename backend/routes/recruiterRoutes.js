const express = require("express");

const {
  createProfile,
  getProfile,
  updateProfile,
  deleteProfile,
} = require("../controllers/recruiterController");

const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| RECRUITER PROFILE
|--------------------------------------------------------------------------
*/

router.post(
  "/profile",
  protect,
  authorize("recruiter"),
  createProfile
);

router.get(
  "/profile",
  protect,
  authorize("recruiter"),
  getProfile
);

router.put(
  "/profile",
  protect,
  authorize("recruiter"),
  updateProfile
);

router.delete(
  "/profile",
  protect,
  authorize("recruiter"),
  deleteProfile
);

module.exports = router;