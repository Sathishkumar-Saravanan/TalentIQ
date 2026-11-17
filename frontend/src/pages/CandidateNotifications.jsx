import React, { useCallback, useEffect, useMemo, useState } from "react";
import "../styles/CandidateNotifications.css";

// ============================================================
// API CONFIGURATION
// ============================================================

const API_URL = (
    import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const NOTIFICATIONS_API = `${API_URL}/api/notifications`;

// ============================================================
// COMPONENT
// ============================================================

const CandidateNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [actionLoading, setActionLoading] = useState("");
    const [unreadCount, setUnreadCount] = useState(0);

    // ========================================================
    // GET TOKEN
    // ========================================================

    const getToken = () => {
        return (
            localStorage.getItem("token") ||
            localStorage.getItem("accessToken") ||
            localStorage.getItem("authToken") ||
            localStorage.getItem("talentIQToken") ||
            sessionStorage.getItem("token") ||
            sessionStorage.getItem("accessToken") ||
            sessionStorage.getItem("authToken") ||
            sessionStorage.getItem("talentIQToken")
        );
    };

    // ========================================================
    // AUTH HEADERS
    // ========================================================

    const getHeaders = () => {
        const token = getToken();

        return {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        };
    };

    // ========================================================
    // FETCH NOTIFICATIONS
    // ========================================================

    const fetchNotifications = useCallback(
        async (showLoader = true) => {
            try {
                if (showLoader) {
                    setLoading(true);
                } else {
                    setRefreshing(true);
                }

                setError("");

                const token = getToken();

                if (!token) {
                    setError(
                        "You are not logged in. Please login again."
                    );
                    return;
                }

                const response = await fetch(
                    NOTIFICATIONS_API,
                    {
                        method: "GET",
                        headers: getHeaders(),
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                            "Failed to fetch notifications."
                    );
                }

                const notificationData = Array.isArray(
                    data.notifications
                )
                    ? data.notifications
                    : [];

                setNotifications(notificationData);

                setUnreadCount(
                    typeof data.unreadCount === "number"
                        ? data.unreadCount
                        : notificationData.filter(
                              (notification) =>
                                  !notification.isRead
                          ).length
                );
            } catch (err) {
                console.error(
                    "Notification Fetch Error:",
                    err
                );

                setError(
                    err.message ||
                        "Failed to load notifications."
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        []
    );

    // ========================================================
    // MARK SINGLE NOTIFICATION AS READ
    // ========================================================

    const markAsRead = async (id) => {
        try {
            setActionLoading(`read-${id}`);

            const token = getToken();

            if (!token) {
                throw new Error(
                    "Authentication token not found."
                );
            }

            const response = await fetch(
                `${NOTIFICATIONS_API}/${id}/read`,
                {
                    method: "PUT",
                    headers: getHeaders(),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Failed to mark notification as read."
                );
            }

            setNotifications((previous) =>
                previous.map((notification) =>
                    notification._id === id
                        ? {
                              ...notification,
                              isRead: true,
                          }
                        : notification
                )
            );

            setUnreadCount((count) =>
                Math.max(count - 1, 0)
            );
        } catch (err) {
            console.error(
                "Mark Read Error:",
                err
            );

            setError(
                err.message ||
                    "Failed to mark notification as read."
            );
        } finally {
            setActionLoading("");
        }
    };

    // ========================================================
    // MARK ALL AS READ
    // ========================================================

    const markAllAsRead = async () => {
        try {
            setActionLoading("all");

            const token = getToken();

            if (!token) {
                throw new Error(
                    "Authentication token not found."
                );
            }

            const response = await fetch(
                `${NOTIFICATIONS_API}/read-all`,
                {
                    method: "PUT",
                    headers: getHeaders(),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Failed to mark all notifications as read."
                );
            }

            setNotifications((previous) =>
                previous.map((notification) => ({
                    ...notification,
                    isRead: true,
                }))
            );

            setUnreadCount(0);
        } catch (err) {
            console.error(
                "Mark All Read Error:",
                err
            );

            setError(
                err.message ||
                    "Failed to mark all notifications as read."
            );
        } finally {
            setActionLoading("");
        }
    };

    // ========================================================
    // DELETE NOTIFICATION
    // ========================================================

    const deleteNotification = async (id) => {
        try {
            setActionLoading(`delete-${id}`);

            const token = getToken();

            if (!token) {
                throw new Error(
                    "Authentication token not found."
                );
            }

            const notificationToDelete =
                notifications.find(
                    (notification) =>
                        notification._id === id
                );

            const response = await fetch(
                `${NOTIFICATIONS_API}/${id}`,
                {
                    method: "DELETE",
                    headers: getHeaders(),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Failed to delete notification."
                );
            }

            setNotifications((previous) =>
                previous.filter(
                    (notification) =>
                        notification._id !== id
                )
            );

            if (
                notificationToDelete &&
                !notificationToDelete.isRead
            ) {
                setUnreadCount((count) =>
                    Math.max(count - 1, 0)
                );
            }
        } catch (err) {
            console.error(
                "Delete Notification Error:",
                err
            );

            setError(
                err.message ||
                    "Failed to delete notification."
            );
        } finally {
            setActionLoading("");
        }
    };

    // ========================================================
    // FORMAT DATE
    // ========================================================

    const formatDate = (date) => {
        if (!date) {
            return "Date unavailable";
        }

        const notificationDate = new Date(date);

        if (Number.isNaN(notificationDate.getTime())) {
            return "Date unavailable";
        }

        return notificationDate.toLocaleString(
            "en-IN",
            {
                dateStyle: "medium",
                timeStyle: "short",
            }
        );
    };

    // ========================================================
    // RELATIVE TIME
    // ========================================================

    const getRelativeTime = (date) => {
        if (!date) {
            return "";
        }

        const notificationDate = new Date(date);

        if (Number.isNaN(notificationDate.getTime())) {
            return "";
        }

        const difference =
            Date.now() - notificationDate.getTime();

        const seconds = Math.floor(
            difference / 1000
        );

        if (seconds < 60) {
            return "Just now";
        }

        const minutes = Math.floor(
            seconds / 60
        );

        if (minutes < 60) {
            return `${minutes} min${
                minutes !== 1 ? "s" : ""
            } ago`;
        }

        const hours = Math.floor(
            minutes / 60
        );

        if (hours < 24) {
            return `${hours} hour${
                hours !== 1 ? "s" : ""
            } ago`;
        }

        const days = Math.floor(
            hours / 24
        );

        if (days < 7) {
            return `${days} day${
                days !== 1 ? "s" : ""
            } ago`;
        }

        return formatDate(date);
    };

    // ========================================================
    // NOTIFICATION ICON
    // ========================================================

    const getNotificationIcon = (type) => {
        switch (type) {
            case "APPLICATION_SUBMITTED":
                return "📨";

            case "APPLICATION_STATUS":
                return "📋";

            case "SHORTLISTED":
                return "⭐";

            case "INTERVIEW":
                return "📅";

            case "SELECTED":
                return "🎉";

            case "REJECTION":
                return "✕";

            default:
                return "🔔";
        }
    };

    // ========================================================
    // NOTIFICATION TYPE LABEL
    // ========================================================

    const getNotificationType = (type) => {
        switch (type) {
            case "APPLICATION_SUBMITTED":
                return "Application";

            case "APPLICATION_STATUS":
                return "Application Update";

            case "SHORTLISTED":
                return "Shortlisted";

            case "INTERVIEW":
                return "Interview";

            case "SELECTED":
                return "Selected";

            case "REJECTION":
                return "Application Update";

            default:
                return "Notification";
        }
    };

    // ========================================================
    // SORT NOTIFICATIONS
    // ========================================================

    const sortedNotifications = useMemo(() => {
        return [...notifications].sort(
            (a, b) =>
                new Date(b.createdAt || 0) -
                new Date(a.createdAt || 0)
        );
    }, [notifications]);

    // ========================================================
    // LOAD
    // ========================================================

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // ========================================================
    // UI
    // ========================================================

    return (
        <div className="notifications-page">
            <div className="notifications-container">

                {/* ==================================================
                    PAGE HEADER
                ================================================== */}

                <section className="notifications-hero">

                    <div className="notifications-hero-content">

                        <div className="notifications-eyebrow">
                            <span className="eyebrow-icon">
                                🔔
                            </span>

                            <span>
                                TALENTIQ NOTIFICATIONS
                            </span>
                        </div>

                        <h1>
                            Your Notifications
                        </h1>

                        <p>
                            Stay updated with your
                            applications, interviews,
                            shortlist updates and
                            career opportunities.
                        </p>

                    </div>

                    <div className="notifications-hero-icon">
                        🔔
                    </div>

                </section>

                {/* ==================================================
                    TOOLBAR
                ================================================== */}

                <section className="notifications-toolbar">

                    <div className="notification-summary">

                        <div className="summary-icon">
                            ✨
                        </div>

                        <div>
                            <strong>
                                {loading
                                    ? "Checking updates..."
                                    : unreadCount > 0
                                    ? `${unreadCount} unread ${
                                          unreadCount === 1
                                              ? "notification"
                                              : "notifications"
                                      }`
                                    : "You're all caught up"}
                            </strong>

                            <span>
                                {notifications.length}{" "}
                                total{" "}
                                {notifications.length === 1
                                    ? "notification"
                                    : "notifications"}
                            </span>
                        </div>

                    </div>

                    <div className="notification-toolbar-actions">

                        <button
                            type="button"
                            className="refresh-btn"
                            onClick={() =>
                                fetchNotifications(false)
                            }
                            disabled={refreshing}
                            title="Refresh notifications"
                        >
                            <span
                                className={
                                    refreshing
                                        ? "refresh-icon spinning"
                                        : "refresh-icon"
                                }
                            >
                                ↻
                            </span>

                            <span>
                                {refreshing
                                    ? "Refreshing..."
                                    : "Refresh"}
                            </span>
                        </button>

                        {unreadCount > 0 && (
                            <button
                                type="button"
                                className="mark-all-btn"
                                onClick={markAllAsRead}
                                disabled={
                                    actionLoading === "all"
                                }
                            >
                                <span>
                                    ✓
                                </span>

                                {actionLoading === "all"
                                    ? "Updating..."
                                    : "Mark all as read"}
                            </button>
                        )}

                    </div>

                </section>

                {/* ==================================================
                    ERROR
                ================================================== */}

                {error && (
                    <div className="notification-error">
                        <div className="error-icon">
                            !
                        </div>

                        <div className="error-content">
                            <strong>
                                Something went wrong
                            </strong>

                            <span>
                                {error}
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={() => setError("")}
                            className="error-close"
                        >
                            ×
                        </button>
                    </div>
                )}

                {/* ==================================================
                    LOADING
                ================================================== */}

                {loading && (
                    <div className="notifications-card">
                        <div className="notification-loading">

                            <div className="notification-spinner">
                                <span></span>
                            </div>

                            <h3>
                                Loading notifications
                            </h3>

                            <p>
                                Checking for your latest
                                updates...
                            </p>

                        </div>
                    </div>
                )}

                {/* ==================================================
                    EMPTY STATE
                ================================================== */}

                {!loading &&
                    !error &&
                    notifications.length === 0 && (
                        <div className="notifications-card empty-state">

                            <div className="empty-icon">
                                <span>🔔</span>
                            </div>

                            <h2>
                                You're all caught up
                            </h2>

                            <p>
                                You don't have any
                                notifications right now.
                                New application and career
                                updates will appear here.
                            </p>

                            <button
                                type="button"
                                className="empty-refresh-btn"
                                onClick={() =>
                                    fetchNotifications(
                                        false
                                    )
                                }
                            >
                                ↻ Check for updates
                            </button>

                        </div>
                    )}

                {/* ==================================================
                    NOTIFICATIONS LIST
                ================================================== */}

                {!loading &&
                    notifications.length > 0 && (
                        <section className="notifications-section">

                            <div className="section-heading">
                                <div>
                                    <h2>
                                        Recent activity
                                    </h2>

                                    <p>
                                        Your latest TalentIQ
                                        account updates
                                    </p>
                                </div>

                                <span className="notification-count">
                                    {notifications.length}
                                </span>
                            </div>

                            <div className="notifications-list">

                                {sortedNotifications.map(
                                    (notification) => (
                                        <article
                                            key={
                                                notification._id
                                            }
                                            className={`notification-item ${
                                                !notification.isRead
                                                    ? "unread"
                                                    : ""
                                            }`}
                                        >

                                            {/* ICON */}

                                            <div
                                                className={`notification-icon notification-type-${(
                                                    notification.type ||
                                                    "default"
                                                )
                                                    .toLowerCase()
                                                    .replace(
                                                        /_/g,
                                                        "-"
                                                    )}`}
                                            >
                                                {getNotificationIcon(
                                                    notification.type
                                                )}
                                            </div>

                                            {/* CONTENT */}

                                            <div className="notification-content">

                                                <div className="notification-title-row">

                                                    <div className="notification-title-content">

                                                        <span className="notification-type">
                                                            {getNotificationType(
                                                                notification.type
                                                            )}
                                                        </span>

                                                        <h3>
                                                            {notification.title ||
                                                                "Notification"}
                                                        </h3>

                                                    </div>

                                                    {!notification.isRead && (
                                                        <span
                                                            className="unread-dot"
                                                            title="Unread"
                                                        ></span>
                                                    )}

                                                </div>

                                                <p className="notification-message">
                                                    {notification.message ||
                                                        "You have a new TalentIQ notification."}
                                                </p>

                                                <div className="notification-footer">

                                                    <div className="notification-time-wrapper">

                                                        <span className="notification-relative-time">
                                                            {getRelativeTime(
                                                                notification.createdAt
                                                            )}
                                                        </span>

                                                        <span className="notification-full-date">
                                                            {formatDate(
                                                                notification.createdAt
                                                            )}
                                                        </span>

                                                    </div>

                                                    <div className="notification-actions">

                                                        {!notification.isRead && (
                                                            <button
                                                                type="button"
                                                                className="read-btn"
                                                                onClick={() =>
                                                                    markAsRead(
                                                                        notification._id
                                                                    )
                                                                }
                                                                disabled={
                                                                    actionLoading ===
                                                                    `read-${notification._id}`
                                                                }
                                                            >
                                                                <span>
                                                                    ✓
                                                                </span>

                                                                {actionLoading ===
                                                                `read-${notification._id}`
                                                                    ? "Updating..."
                                                                    : "Mark as read"}
                                                            </button>
                                                        )}

                                                        <button
                                                            type="button"
                                                            className="delete-btn"
                                                            onClick={() =>
                                                                deleteNotification(
                                                                    notification._id
                                                                )
                                                            }
                                                            disabled={
                                                                actionLoading ===
                                                                `delete-${notification._id}`
                                                            }
                                                        >
                                                            <span>
                                                                ×
                                                            </span>

                                                            {actionLoading ===
                                                            `delete-${notification._id}`
                                                                ? "Deleting..."
                                                                : "Delete"}
                                                        </button>

                                                    </div>

                                                </div>

                                            </div>

                                        </article>
                                    )
                                )}

                            </div>

                        </section>
                    )}

            </div>
        </div>
    );
};

export default CandidateNotifications;