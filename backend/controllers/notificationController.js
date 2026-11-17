const mongoose = require("mongoose");
const Notification = require("../models/Notification");

// ============================================================
// HELPERS
// ============================================================

const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

const normalizeNotificationType = (type) => {
    const allowedTypes = [
        "APPLICATION_SUBMITTED",
        "APPLICATION_STATUS",
        "SHORTLISTED",
        "INTERVIEW",
        "SELECTED",
        "REJECTION",
        "GENERAL",
    ];

    return allowedTypes.includes(type)
        ? type
        : "GENERAL";
};

// ============================================================
// INTERNAL NOTIFICATION CREATOR
//
// Used by application/job/interview controllers.
// This does NOT depend on req/res.
// ============================================================

const createNotificationForUser = async ({
    recipient,
    sender = null,
    type = "GENERAL",
    title,
    message,
    relatedApplication = null,
    relatedJob = null,
}) => {
    try {
        if (!recipient) {
            throw new Error(
                "Notification recipient is required"
            );
        }

        if (!title || !message) {
            throw new Error(
                "Notification title and message are required"
            );
        }

        const notification =
            await Notification.create({
                recipient,
                sender,
                type: normalizeNotificationType(type),
                title: String(title).trim(),
                message: String(message).trim(),
                relatedApplication:
                    relatedApplication || null,
                relatedJob:
                    relatedJob || null,
            });

        return await Notification.findById(
            notification._id
        )
            .populate(
                "sender",
                "fullName username email role"
            )
            .populate(
                "relatedJob",
                "title companyName recruiter"
            )
            .populate(
                "relatedApplication"
            );
    } catch (error) {
        console.error(
            "Internal Notification Creation Error:",
            error
        );

        throw error;
    }
};

// ============================================================
// CREATE NOTIFICATION
// POST /api/notifications
// ============================================================
//
// This endpoint is mainly useful for controlled frontend/admin
// notifications. Application-related notifications should ideally
// be generated from backend controllers using
// createNotificationForUser().
// ============================================================

const createNotification = async (req, res) => {
    try {
        const {
            recipient,
            sender,
            type,
            title,
            message,
            relatedApplication,
            relatedJob,
        } = req.body;

        // ====================================================
        // VALIDATION
        // ====================================================

        if (!recipient) {
            return res.status(400).json({
                success: false,
                message: "Recipient is required",
            });
        }

        if (!isValidObjectId(recipient)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid recipient ID",
            });
        }

        if (!title || !message) {
            return res.status(400).json({
                success: false,
                message:
                    "Title and message are required",
            });
        }

        if (
            sender &&
            !isValidObjectId(sender)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid sender ID",
            });
        }

        if (
            relatedApplication &&
            !isValidObjectId(
                relatedApplication
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid application ID",
            });
        }

        if (
            relatedJob &&
            !isValidObjectId(relatedJob)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid job ID",
            });
        }

        // ====================================================
        // CREATE
        // ====================================================

        const notification =
            await createNotificationForUser({
                recipient,
                sender:
                    sender ||
                    req.user?._id ||
                    null,
                type,
                title,
                message,
                relatedApplication,
                relatedJob,
            });

        return res.status(201).json({
            success: true,
            message:
                "Notification created successfully",
            notification,
        });
    } catch (error) {
        console.error(
            "Create Notification Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to create notification",
            error: error.message,
        });
    }
};

// ============================================================
// GET MY NOTIFICATIONS
// GET /api/notifications
// ============================================================

const getMyNotifications = async (
    req,
    res
) => {
    try {
        const {
            page = 1,
            limit = 20,
            unreadOnly,
        } = req.query;

        const currentPage = Math.max(
            Number(page) || 1,
            1
        );

        const notificationsPerPage =
            Math.min(
                Math.max(
                    Number(limit) || 20,
                    1
                ),
                50
            );

        const skip =
            (currentPage - 1) *
            notificationsPerPage;

        const query = {
            recipient: req.user._id,
        };

        if (
            unreadOnly === "true"
        ) {
            query.isRead = false;
        }

        const totalNotifications =
            await Notification.countDocuments(
                query
            );

        const notifications =
            await Notification.find(query)
                .populate(
                    "sender",
                    "fullName username email role"
                )
                .populate(
                    "relatedJob",
                    "title companyName recruiter"
                )
                .populate(
                    "relatedApplication"
                )
                .sort({
                    createdAt: -1,
                })
                .skip(skip)
                .limit(
                    notificationsPerPage
                )
                .lean();

        const unreadCount =
            await Notification.countDocuments({
                recipient: req.user._id,
                isRead: false,
            });

        const totalPages =
            Math.ceil(
                totalNotifications /
                    notificationsPerPage
            );

        return res.status(200).json({
            success: true,
            count: notifications.length,
            unreadCount,
            notifications,
            pagination: {
                currentPage,
                totalPages,
                totalNotifications,
                limit:
                    notificationsPerPage,
                hasNextPage:
                    currentPage < totalPages,
                hasPreviousPage:
                    currentPage > 1,
            },
        });
    } catch (error) {
        console.error(
            "Get Notifications Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch notifications",
            error: error.message,
        });
    }
};

// ============================================================
// GET SINGLE NOTIFICATION
// GET /api/notifications/:id
// ============================================================

const getNotificationById = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid notification ID",
            });
        }

        const notification =
            await Notification.findById(id)
                .populate(
                    "sender",
                    "fullName username email role"
                )
                .populate(
                    "relatedJob",
                    "title companyName"
                )
                .populate(
                    "relatedApplication"
                );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message:
                    "Notification not found",
            });
        }

        if (
            notification.recipient.toString() !==
            req.user._id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You are not authorized to view this notification",
            });
        }

        return res.status(200).json({
            success: true,
            notification,
        });
    } catch (error) {
        console.error(
            "Get Notification Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch notification",
            error: error.message,
        });
    }
};

// ============================================================
// MARK SINGLE AS READ
// PUT /api/notifications/:id/read
// ============================================================

const markAsRead = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid notification ID",
            });
        }

        const notification =
            await Notification.findOne({
                _id: id,
                recipient: req.user._id,
            });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message:
                    "Notification not found",
            });
        }

        notification.isRead = true;

        await notification.save();

        return res.status(200).json({
            success: true,
            message:
                "Notification marked as read",
            notification,
        });
    } catch (error) {
        console.error(
            "Mark Notification Read Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to update notification",
        });
    }
};

// ============================================================
// MARK ALL AS READ
// PUT /api/notifications/read-all
// ============================================================

const markAllAsRead = async (
    req,
    res
) => {
    try {
        const result =
            await Notification.updateMany(
                {
                    recipient:
                        req.user._id,
                    isRead: false,
                },
                {
                    $set: {
                        isRead: true,
                    },
                }
            );

        return res.status(200).json({
            success: true,
            message:
                "All notifications marked as read",
            modifiedCount:
                result.modifiedCount || 0,
        });
    } catch (error) {
        console.error(
            "Mark All Notifications Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to update notifications",
            error: error.message,
        });
    }
};

// ============================================================
// DELETE NOTIFICATION
// DELETE /api/notifications/:id
// ============================================================

const deleteNotification = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid notification ID",
            });
        }

        const notification =
            await Notification.findOneAndDelete({
                _id: id,
                recipient: req.user._id,
            });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message:
                    "Notification not found",
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Notification deleted successfully",
        });
    } catch (error) {
        console.error(
            "Delete Notification Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to delete notification",
        });
    }
};

// ============================================================
// EXPORT
// ============================================================

module.exports = {
    createNotification,
    createNotificationForUser,
    getMyNotifications,
    getNotificationById,
    markAsRead,
    markAllAsRead,
    deleteNotification,
};