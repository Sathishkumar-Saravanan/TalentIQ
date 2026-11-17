const express = require("express");

const {
    protect,
    authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

// ============================================================
// CANDIDATE TEST ROUTE
// GET /api/test/candidate
// ============================================================

router.get(
    "/candidate",
    protect,
    authorize("candidate"),
    (req, res) => {
        return res.status(200).json({
            success: true,
            message: "Welcome Candidate",

            user: {
                id: req.user._id,
                fullName: req.user.fullName || "",
                username: req.user.username || "",
                email: req.user.email || "",
                role: req.user.role,
            },
        });
    }
);

// ============================================================
// RECRUITER TEST ROUTE
// GET /api/test/recruiter
// ============================================================

router.get(
    "/recruiter",
    protect,
    authorize("recruiter"),
    (req, res) => {
        return res.status(200).json({
            success: true,
            message: "Welcome Recruiter",

            user: {
                id: req.user._id,
                fullName: req.user.fullName || "",
                username: req.user.username || "",
                email: req.user.email || "",
                role: req.user.role,
            },
        });
    }
);

// ============================================================
// ADMIN TEST ROUTE
// GET /api/test/admin
// ============================================================
//
// IMPORTANT:
// Your current User schema only allows:
//
// candidate
// recruiter
//
// Therefore an existing user cannot have role "admin"
// unless you add "admin" to the User schema.
//
// This route is kept for future admin functionality.
// ============================================================

router.get(
    "/admin",
    protect,
    authorize("admin"),
    (req, res) => {
        return res.status(200).json({
            success: true,
            message: "Welcome Admin",

            user: {
                id: req.user._id,
                fullName: req.user.fullName || "",
                username: req.user.username || "",
                email: req.user.email || "",
                role: req.user.role,
            },
        });
    }
);

// ============================================================
// CURRENT USER TEST ROUTE
// GET /api/test/me
// ============================================================

router.get(
    "/me",
    protect,
    (req, res) => {
        return res.status(200).json({
            success: true,
            message: "Authenticated user",

            user: {
                id: req.user._id,
                fullName: req.user.fullName || "",
                username: req.user.username || "",
                email: req.user.email || "",
                role: req.user.role,
                isActive: req.user.isActive,
            },
        });
    }
);

// ============================================================
// EXPORT ROUTER
// ============================================================

module.exports = router;