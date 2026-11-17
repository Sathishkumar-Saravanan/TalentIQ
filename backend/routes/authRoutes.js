const express = require("express");

const router = express.Router();

// ============================================================
// CONTROLLERS
// ============================================================

const {
    registerUser,
    loginUser,
    getCurrentUser,
    getUserById,
    deleteUser,
    forgotPassword,
    resetPassword,
} = require("../controllers/authController");

// ============================================================
// MIDDLEWARE
// ============================================================

const {
    protect,
} = require("../middleware/authMiddleware");

// ============================================================
// AUTH ROUTES
// ============================================================

// ------------------------------------------------------------
// REGISTER
// POST /api/auth/register
// ------------------------------------------------------------

router.post(
    "/register",
    registerUser
);

// ------------------------------------------------------------
// LOGIN
// POST /api/auth/login
// ------------------------------------------------------------

router.post(
    "/login",
    loginUser
);

// ------------------------------------------------------------
// CURRENT LOGGED-IN USER
// GET /api/auth/me
// ------------------------------------------------------------

router.get(
    "/me",
    protect,
    getCurrentUser
);

// ------------------------------------------------------------
// FORGOT PASSWORD
// POST /api/auth/forgot-password
// ------------------------------------------------------------

router.post(
    "/forgot-password",
    forgotPassword
);

// ------------------------------------------------------------
// RESET PASSWORD
// POST /api/auth/reset-password
// ------------------------------------------------------------

router.post(
    "/reset-password",
    resetPassword
);

// ============================================================
// USER ROUTES
// ============================================================

// ------------------------------------------------------------
// GET USER BY ID
// GET /api/auth/users/:id
// ------------------------------------------------------------

router.get(
    "/users/:id",
    protect,
    getUserById
);

// ------------------------------------------------------------
// DELETE USER BY ID
// DELETE /api/auth/users/:id
// ------------------------------------------------------------

router.delete(
    "/users/:id",
    protect,
    deleteUser
);

// ============================================================
// EXPORT
// ============================================================

module.exports = router;