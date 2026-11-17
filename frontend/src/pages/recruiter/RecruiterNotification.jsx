import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaBell,
  FaCheck,
  FaCheckDouble,
  FaClock,
  FaExclamationCircle,
  FaFileAlt,
  FaBriefcase,
  FaUser,
  FaRedo,
  FaTrash,
  FaTimes,
} from "react-icons/fa";

import "../../styles/recruiterNotification.css";

// ============================================================
// API
// ============================================================

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const NOTIFICATION_API =
  `${API_URL.replace(/\/+$/, "")}/api/notifications`;

// ============================================================
// TOKEN
// ============================================================

const getToken = () => {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken")
  );
};

// ============================================================
// DATE
// ============================================================

const formatDate = (dateValue) => {
  if (!dateValue) return "Unknown time";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ============================================================
// RELATIVE TIME
// ============================================================

const getRelativeTime = (dateValue) => {
  if (!dateValue) return "";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const difference = Date.now() - date.getTime();

  const seconds = Math.floor(difference / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes} min${minutes !== 1 ? "s" : ""} ago`;
  }

  if (hours < 24) {
    return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  }

  if (days < 7) {
    return `${days} day${days !== 1 ? "s" : ""} ago`;
  }

  return formatDate(dateValue);
};

// ============================================================
// NOTIFICATION ICON
// ============================================================

const getNotificationIcon = (type) => {
  const value = String(type || "").toLowerCase();

  if (
    value.includes("application") ||
    value.includes("applicant")
  ) {
    return <FaFileAlt />;
  }

  if (value.includes("job")) {
    return <FaBriefcase />;
  }

  if (value.includes("candidate") || value.includes("profile")) {
    return <FaUser />;
  }

  if (
    value.includes("warning") ||
    value.includes("error")
  ) {
    return <FaExclamationCircle />;
  }

  return <FaBell />;
};

// ============================================================
// NOTIFICATION TYPE CLASS
// ============================================================

const getTypeClass = (type) => {
  const value = String(type || "").toLowerCase();

  if (
    value.includes("application") ||
    value.includes("applicant")
  ) {
    return "application";
  }

  if (value.includes("job")) {
    return "job";
  }

  if (value.includes("candidate")) {
    return "candidate";
  }

  if (
    value.includes("warning") ||
    value.includes("error")
  ) {
    return "warning";
  }

  return "general";
};

// ============================================================
// COMPONENT
// ============================================================

const RecruiterNotification = () => {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const [processingId, setProcessingId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);

  const [activeFilter, setActiveFilter] = useState("all");

  // ============================================================
  // UNAUTHORIZED
  // ============================================================

  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("accessToken");

    navigate("/login", {
      replace: true,
    });
  }, [navigate]);

  // ============================================================
  // FETCH NOTIFICATIONS
  // ============================================================

  const fetchNotifications = useCallback(
    async (showLoading = true) => {
      const token = getToken();

      if (!token) {
        handleUnauthorized();
        return;
      }

      try {
        if (showLoading) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        setError("");
        setActionError("");

        const response = await fetch(NOTIFICATION_API, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (response.status === 401 || response.status === 403) {
          handleUnauthorized();
          return;
        }

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message ||
              data.error ||
              "Unable to load notifications."
          );
        }

        const list = Array.isArray(data.notifications)
          ? data.notifications
          : [];

        setNotifications(list);

        if (typeof data.unreadCount === "number") {
          setUnreadCount(data.unreadCount);
        } else {
          setUnreadCount(
            list.filter(
              (notification) => !notification.isRead
            ).length
          );
        }
      } catch (err) {
        console.error(
          "Recruiter notification fetch error:",
          err
        );

        setError(
          err.message ||
            "Unable to connect to the notification server."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [handleUnauthorized]
  );

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    fetchNotifications(true);
  }, [fetchNotifications]);

  // ============================================================
  // AUTO REFRESH - 30 SECONDS
  // ============================================================

  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications(false);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // ============================================================
  // MARK ONE AS READ
  // ============================================================

  const markAsRead = async (notificationId) => {
    const token = getToken();

    if (!token || !notificationId) {
      return;
    }

    setProcessingId(notificationId);
    setActionError("");

    try {
      const response = await fetch(
        `${NOTIFICATION_API}/${notificationId}/read`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to mark notification as read."
        );
      }

      setNotifications((current) =>
        current.map((notification) =>
          notification._id === notificationId
            ? {
                ...notification,
                isRead: true,
              }
            : notification
        )
      );

      setUnreadCount((current) =>
        Math.max(0, current - 1)
      );
    } catch (err) {
      console.error(
        "Mark notification read error:",
        err
      );

      setActionError(
        err.message ||
          "Unable to update notification."
      );
    } finally {
      setProcessingId(null);
    }
  };

  // ============================================================
  // MARK ALL AS READ
  // ============================================================

  const markAllAsRead = async () => {
    const token = getToken();

    if (!token || unreadCount === 0) {
      return;
    }

    setMarkingAll(true);
    setActionError("");

    try {
      const response = await fetch(
        `${NOTIFICATION_API}/read-all`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to mark all notifications as read."
        );
      }

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );

      setUnreadCount(0);
    } catch (err) {
      console.error(
        "Mark all notifications error:",
        err
      );

      setActionError(
        err.message ||
          "Unable to update notifications."
      );
    } finally {
      setMarkingAll(false);
    }
  };

  // ============================================================
  // DELETE NOTIFICATION
  // ============================================================

  const deleteNotification = async (notificationId) => {
    const token = getToken();

    if (!token || !notificationId) {
      return;
    }

    setProcessingId(notificationId);
    setActionError("");

    try {
      const response = await fetch(
        `${NOTIFICATION_API}/${notificationId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (response.status === 401 || response.status === 403) {
        handleUnauthorized();
        return;
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to delete notification."
        );
      }

      const deleted = notifications.find(
        (notification) =>
          notification._id === notificationId
      );

      setNotifications((current) =>
        current.filter(
          (notification) =>
            notification._id !== notificationId
        )
      );

      if (deleted && !deleted.isRead) {
        setUnreadCount((current) =>
          Math.max(0, current - 1)
        );
      }
    } catch (err) {
      console.error(
        "Delete notification error:",
        err
      );

      setActionError(
        err.message ||
          "Unable to delete notification."
      );
    } finally {
      setProcessingId(null);
    }
  };

  // ============================================================
  // FILTER
  // ============================================================

  const filteredNotifications = useMemo(() => {
    if (activeFilter === "unread") {
      return notifications.filter(
        (notification) => !notification.isRead
      );
    }

    if (activeFilter === "read") {
      return notifications.filter(
        (notification) => notification.isRead
      );
    }

    return notifications;
  }, [notifications, activeFilter]);

  // ============================================================
  // READ COUNT
  // ============================================================

  const readCount = useMemo(() => {
    return notifications.filter(
      (notification) => notification.isRead
    ).length;
  }, [notifications]);

  // ============================================================
  // JSX
  // ============================================================

  return (
    <div className="recruiter-notification-page">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="recruiter-notification-header">
        <div className="recruiter-notification-header-inner">

          <div className="recruiter-notification-heading">

            <Link
              to="/recruiter-dashboard"
              className="recruiter-notification-back"
              title="Back to dashboard"
            >
              <FaArrowLeft />
            </Link>

            <div>
              <div className="recruiter-notification-title-row">
                <h1>Notifications</h1>

                {unreadCount > 0 && (
                  <span className="recruiter-notification-unread-badge">
                    {unreadCount}
                  </span>
                )}
              </div>

              <p>
                Stay updated with your recruitment
                activities.
              </p>
            </div>

          </div>

          <div className="recruiter-notification-header-actions">

            <button
              type="button"
              className="recruiter-notification-refresh-button"
              onClick={() => fetchNotifications(false)}
              disabled={refreshing}
            >
              <FaRedo
                className={
                  refreshing
                    ? "recruiter-notification-spinning"
                    : ""
                }
              />

              <span>
                {refreshing
                  ? "Refreshing..."
                  : "Refresh"}
              </span>
            </button>

            <button
              type="button"
              className="recruiter-notification-read-all-button"
              onClick={markAllAsRead}
              disabled={
                markingAll || unreadCount === 0
              }
            >
              <FaCheckDouble />

              <span>
                {markingAll
                  ? "Updating..."
                  : "Mark all as read"}
              </span>
            </button>

          </div>
        </div>
      </header>

      {/* ======================================================
          MAIN
      ====================================================== */}

      <main className="recruiter-notification-main">

        {/* ====================================================
            SUMMARY
        ==================================================== */}

        <section className="recruiter-notification-summary">

          <div className="recruiter-notification-summary-card">
            <div className="recruiter-notification-summary-icon">
              <FaBell />
            </div>

            <div>
              <span>Total notifications</span>
              <strong>
                {notifications.length}
              </strong>
            </div>
          </div>

          <div className="recruiter-notification-summary-card">
            <div className="recruiter-notification-summary-icon unread">
              <FaExclamationCircle />
            </div>

            <div>
              <span>Unread</span>
              <strong>{unreadCount}</strong>
            </div>
          </div>

          <div className="recruiter-notification-summary-card">
            <div className="recruiter-notification-summary-icon read">
              <FaCheck />
            </div>

            <div>
              <span>Read</span>
              <strong>{readCount}</strong>
            </div>
          </div>

        </section>

        {/* ====================================================
            FILTERS
        ==================================================== */}

        <section className="recruiter-notification-toolbar">

          <div className="recruiter-notification-filters">

            <button
              type="button"
              className={
                activeFilter === "all"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveFilter("all")
              }
            >
              All
              <span>{notifications.length}</span>
            </button>

            <button
              type="button"
              className={
                activeFilter === "unread"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveFilter("unread")
              }
            >
              Unread
              <span>{unreadCount}</span>
            </button>

            <button
              type="button"
              className={
                activeFilter === "read"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveFilter("read")
              }
            >
              Read
              <span>{readCount}</span>
            </button>

          </div>
        </section>

        {/* ====================================================
            ERROR
        ==================================================== */}

        {error && (
          <section className="recruiter-notification-error">

            <div className="recruiter-notification-error-icon">
              <FaExclamationCircle />
            </div>

            <div className="recruiter-notification-error-content">

              <strong>
                Unable to load notifications
              </strong>

              <p>{error}</p>

              <button
                type="button"
                onClick={() =>
                  fetchNotifications(true)
                }
              >
                <FaRedo />
                Try Again
              </button>

            </div>
          </section>
        )}

        {/* ====================================================
            ACTION ERROR
        ==================================================== */}

        {actionError && (
          <div className="recruiter-notification-action-error">

            <FaExclamationCircle />

            <span>{actionError}</span>

            <button
              type="button"
              onClick={() =>
                setActionError("")
              }
              aria-label="Close error"
            >
              <FaTimes />
            </button>

          </div>
        )}

        {/* ====================================================
            LOADING
        ==================================================== */}

        {loading && !error && (
          <section className="recruiter-notification-list">

            {[1, 2, 3, 4].map((item) => (
              <div
                className="recruiter-notification-skeleton"
                key={item}
              >
                <div className="skeleton-icon" />

                <div className="skeleton-content">
                  <div className="skeleton-line skeleton-title" />
                  <div className="skeleton-line" />
                  <div className="skeleton-line short" />
                </div>

                <div className="skeleton-action" />
              </div>
            ))}

          </section>
        )}

        {/* ====================================================
            EMPTY
        ==================================================== */}

        {!loading &&
          !error &&
          filteredNotifications.length === 0 && (
            <section className="recruiter-notification-empty">

              <div className="recruiter-notification-empty-icon">
                <FaBell />
              </div>

              <h2>
                {activeFilter === "unread"
                  ? "No unread notifications"
                  : activeFilter === "read"
                  ? "No read notifications"
                  : "No notifications yet"}
              </h2>

              <p>
                {activeFilter === "unread"
                  ? "You are all caught up. New notifications will appear here."
                  : activeFilter === "read"
                  ? "Notifications you have read will appear here."
                  : "Recruitment activity notifications will appear here."}
              </p>

              {activeFilter !== "all" && (
                <button
                  type="button"
                  onClick={() =>
                    setActiveFilter("all")
                  }
                >
                  View all notifications
                </button>
              )}

            </section>
          )}

        {/* ====================================================
            NOTIFICATIONS
        ==================================================== */}

        {!loading &&
          !error &&
          filteredNotifications.length > 0 && (
            <section className="recruiter-notification-list">

              {filteredNotifications.map(
                (notification) => {
                  const typeClass =
                    getTypeClass(
                      notification.type
                    );

                  const isProcessing =
                    processingId ===
                    notification._id;

                  return (
                    <article
                      key={notification._id}
                      className={`recruiter-notification-item ${
                        notification.isRead
                          ? "is-read"
                          : "is-unread"
                      }`}
                    >

                      {/* ICON */}
                      <div
                        className={`recruiter-notification-item-icon ${typeClass}`}
                      >
                        {getNotificationIcon(
                          notification.type
                        )}

                        {!notification.isRead && (
                          <span className="unread-dot" />
                        )}
                      </div>

                      {/* CONTENT */}
                      <div className="recruiter-notification-item-content">

                        <div className="recruiter-notification-item-top">

                          <div>
                            <h3>
                              {notification.title ||
                                "Notification"}
                            </h3>

                            {notification.type && (
                              <span
                                className={`recruiter-notification-type ${typeClass}`}
                              >
                                {String(
                                  notification.type
                                ).replace(
                                  /[_-]/g,
                                  " "
                                )}
                              </span>
                            )}
                          </div>

                          {!notification.isRead && (
                            <span className="recruiter-notification-new">
                              NEW
                            </span>
                          )}

                        </div>

                        <p className="recruiter-notification-message">
                          {notification.message ||
                            "You have a new notification."}
                        </p>

                        {notification.relatedJob && (
                          <div className="recruiter-notification-related">
                            <FaBriefcase />

                            <span>
                              {notification.relatedJob.title ||
                                notification.relatedJob.jobTitle ||
                                notification.relatedJob.name ||
                                "Related job"}
                            </span>
                          </div>
                        )}

                        {notification.relatedApplication && (
                          <div className="recruiter-notification-related">
                            <FaFileAlt />
                            <span>
                              Application activity
                            </span>
                          </div>
                        )}

                        <div className="recruiter-notification-meta">

                          <FaClock />

                          <span
                            title={formatDate(
                              notification.createdAt
                            )}
                          >
                            {getRelativeTime(
                              notification.createdAt
                            )}
                          </span>

                        </div>

                      </div>

                      {/* ACTIONS */}
                      <div className="recruiter-notification-item-actions">

                        {!notification.isRead && (
                          <button
                            type="button"
                            className="notification-action read"
                            onClick={() =>
                              markAsRead(
                                notification._id
                              )
                            }
                            disabled={isProcessing}
                            title="Mark as read"
                          >
                            <FaCheck />
                            <span>
                              Mark read
                            </span>
                          </button>
                        )}

                        <button
                          type="button"
                          className="notification-action delete"
                          onClick={() =>
                            deleteNotification(
                              notification._id
                            )
                          }
                          disabled={isProcessing}
                          title="Delete notification"
                        >
                          <FaTrash />
                          <span>Delete</span>
                        </button>

                      </div>

                    </article>
                  );
                }
              )}

            </section>
          )}

      </main>
    </div>
  );
};

export default RecruiterNotification;