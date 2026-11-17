const express = require("express");

const router = express.Router();

const {
    getProfile,
    updateProfile,
    uploadResume,
    downloadResume,
    deleteResume,
} = require("../controllers/profileController");

// authMiddleware exports the function directly
const { protect } = require("../middleware/authMiddleware");

const multer = require("multer");

// ============================================================
// MULTER CONFIGURATION
// ============================================================

const upload = multer({
    storage: multer.memoryStorage(),

    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB
    },
});

// ============================================================
// GET PROFILE
// GET /api/profile
// ============================================================

router.get(
    "/",
    protect,
    getProfile
);

// ============================================================
// CREATE / UPDATE PROFILE
// PUT /api/profile
// ============================================================

router.put(
    "/",
    protect,
    updateProfile
);

// ============================================================
// UPLOAD RESUME
// POST /api/profile/resume
// ============================================================

router.post(
    "/resume",
    protect,
    upload.single("resume"),
    uploadResume
);

// ============================================================
// DOWNLOAD RESUME
// GET /api/profile/resume/:fileId
// ============================================================

router.get(
    "/resume/:fileId",
    protect,
    downloadResume
);

// ============================================================
// DELETE RESUME
// DELETE /api/profile/resume
// ============================================================

router.delete(
    "/resume",
    protect,
    deleteResume
);

module.exports = router;