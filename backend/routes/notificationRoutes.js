const express = require("express");

const router = express.Router();

// ============================================================
// CONTROLLERS
// ============================================================

const {
    createNotification,
    getMyNotifications,
    getNotificationById,
    markAsRead,
    markAllAsRead,
    deleteNotification,
} = require("../controllers/notificationController");

// ============================================================
// AUTH MIDDLEWARE
// ============================================================

const authModule = require("../middleware/authMiddleware");

const protect =
    typeof authModule === "function"
        ? authModule
        : authModule?.protect;

if (typeof protect !== "function") {
    throw new Error(
        "authMiddleware must export a protect function"
    );
}

// ============================================================
// GET MY NOTIFICATIONS
// GET /api/notifications
// ============================================================

router.get(
    "/",
    protect,
    getMyNotifications
);

// ============================================================
// MARK ALL AS READ
// PUT /api/notifications/read-all
// ============================================================

router.put(
    "/read-all",
    protect,
    markAllAsRead
);

// ============================================================
// CREATE NOTIFICATION
// POST /api/notifications
// ============================================================

router.post(
    "/",
    protect,
    createNotification
);

// ============================================================
// GET SINGLE NOTIFICATION
// GET /api/notifications/:id
// ============================================================

router.get(
    "/:id",
    protect,
    getNotificationById
);

// ============================================================
// MARK SINGLE AS READ
// PUT /api/notifications/:id/read
// ============================================================

router.put(
    "/:id/read",
    protect,
    markAsRead
);

// ============================================================
// DELETE NOTIFICATION
// DELETE /api/notifications/:id
// ============================================================

router.delete(
    "/:id",
    protect,
    deleteNotification
);

// ============================================================
// EXPORT
// ============================================================

module.exports = router;