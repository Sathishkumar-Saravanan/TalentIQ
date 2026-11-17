const express = require("express");

const router = express.Router();

// ============================================================
// CONTROLLER
// ============================================================

const applicationController =
    require(
        "../controllers/applicationController"
    );

const {
    submitApplication,
    getMyApplications,
    getApplicationById,
    withdrawApplication,

    getRecruiterApplications,
    updateApplicationStatus,
    updateRecruiterNotes,
    updateInterview,
    removeApplicationByRecruiter,

    getATSResult,
    recheckATS,
} =
    applicationController;

// ============================================================
// AUTH MIDDLEWARE
// ============================================================
//
// Supports both:
// module.exports = protect
//
// and:
// module.exports = { protect }
// ============================================================

const authModule =
    require(
        "../middleware/authMiddleware"
    );

const protect =
    typeof authModule ===
    "function"
        ? authModule
        : authModule?.protect;

// ============================================================
// SAFETY CHECK
// ============================================================

if (
    typeof protect !==
    "function"
) {
    throw new Error(
        "applicationRoutes: protect middleware is not a function"
    );
}

// ============================================================
// CONTROLLER SAFETY
// ============================================================

const handlers = {
    submitApplication,
    getMyApplications,
    getApplicationById,
    withdrawApplication,

    getRecruiterApplications,
    updateApplicationStatus,
    updateRecruiterNotes,
    updateInterview,
    removeApplicationByRecruiter,

    getATSResult,
    recheckATS,
};

Object.entries(
    handlers
).forEach(
    ([name, handler]) => {
        if (
            typeof handler !==
            "function"
        ) {
            throw new Error(
                `applicationRoutes: ${name} is not a function`
            );
        }
    }
);

// ============================================================
// CANDIDATE
// ============================================================

// POST /api/applications
router.post(
    "/",
    protect,
    submitApplication
);

// GET /api/applications/my
router.get(
    "/my",
    protect,
    getMyApplications
);

// ============================================================
// RECRUITER
// ============================================================

// GET /api/applications/recruiter
router.get(
    "/recruiter",
    protect,
    getRecruiterApplications
);

// ============================================================
// ATS
// ============================================================

// GET /api/applications/:id/ats
router.get(
    "/:id/ats",
    protect,
    getATSResult
);

// PATCH /api/applications/:id/ats
router.patch(
    "/:id/ats",
    protect,
    recheckATS
);

// ============================================================
// APPLICATION STATUS
// ============================================================

// PATCH /api/applications/:id/status
router.patch(
    "/:id/status",
    protect,
    updateApplicationStatus
);

// ============================================================
// INTERVIEW
// ============================================================

// PATCH /api/applications/:id/interview
router.patch(
    "/:id/interview",
    protect,
    updateInterview
);

// ============================================================
// RECRUITER NOTES
// ============================================================

// PATCH /api/applications/:id/notes
router.patch(
    "/:id/notes",
    protect,
    updateRecruiterNotes
);

// ============================================================
// RECRUITER DELETE
// ============================================================

// DELETE /api/applications/:id/recruiter
router.delete(
    "/:id/recruiter",
    protect,
    removeApplicationByRecruiter
);

// ============================================================
// SINGLE APPLICATION
// ============================================================

// GET /api/applications/:id
router.get(
    "/:id",
    protect,
    getApplicationById
);

// ============================================================
// CANDIDATE WITHDRAW
// ============================================================

// DELETE /api/applications/:id
router.delete(
    "/:id",
    protect,
    withdrawApplication
);

// ============================================================
// EXPORT
// ============================================================

module.exports = router;