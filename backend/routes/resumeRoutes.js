const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

const {
    getResume,
    saveResume,
    deleteResume,
    uploadResume,
} = require("../controllers/resumeController");

const {
    protect,
} = require("../middleware/authMiddleware");

// ============================================================
// UPLOAD DIRECTORY
// ============================================================

const uploadDirectory = path.join(
    __dirname,
    "../uploads/resumes"
);

if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, {
        recursive: true,
    });
}

// ============================================================
// MULTER STORAGE
// ============================================================

const storage = multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, uploadDirectory);
    },

    filename: (req, file, cb) => {

        const userId =
            req.user?._id ||
            req.user?.id ||
            "candidate";

        const extension =
            path.extname(file.originalname);

        cb(
            null,
            `resume-${userId}-${Date.now()}${extension}`
        );
    },
});

// ============================================================
// FILE FILTER
// ============================================================

const fileFilter = (req, file, cb) => {

    const extension =
        path.extname(
            file.originalname
        ).toLowerCase();

    const allowedExtensions = [
        ".pdf",
        ".doc",
        ".docx",
    ];

    if (
        allowedExtensions.includes(
            extension
        )
    ) {
        cb(null, true);
    } else {
        cb(
            new Error(
                "Only PDF, DOC and DOCX files are allowed."
            )
        );
    }
};

// ============================================================
// MULTER
// ============================================================

const upload = multer({

    storage,

    fileFilter,

    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});

// ============================================================
// GET RESUME
// GET /api/resumes
// ============================================================

router.get(
    "/",
    protect,
    getResume
);

// ============================================================
// SAVE RESUME DATA
// POST /api/resumes
// ============================================================

router.post(
    "/",
    protect,
    saveResume
);

// ============================================================
// UPLOAD ACTUAL RESUME FILE
// POST /api/resumes/upload
// ============================================================

router.post(
    "/upload",
    protect,
    upload.single("resume"),
    uploadResume
);

// ============================================================
// DELETE RESUME
// DELETE /api/resumes
// ============================================================

router.delete(
    "/",
    protect,
    deleteResume
);

// ============================================================
// MULTER ERROR HANDLER
// ============================================================

router.use(
    (error, req, res, next) => {

        if (
            error instanceof multer.MulterError
        ) {

            if (
                error.code ===
                "LIMIT_FILE_SIZE"
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Resume must be 5 MB or smaller.",
                });
            }
        }

        if (error) {

            return res.status(400).json({
                success: false,
                message:
                    error.message ||
                    "Resume upload failed.",
            });
        }

        next();
    }
);

module.exports = router;