import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import "../styles/Applications.css";

const API_BASE_URL = "http://localhost:5000";

/* ============================================================
   AUTH
============================================================ */

const getToken = () => {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken")
  );
};

/* ============================================================
   SAFE VALUE HELPERS
============================================================ */

const getSafeText = (value, fallback = "") => {
  if (
    value === null ||
    value === undefined
  ) {
    return fallback;
  }

  if (typeof value === "string") {
    return value.trim() || fallback;
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "object") {
    return (
      value.name ||
      value.title ||
      value.label ||
      value.value ||
      fallback
    );
  }

  return String(value);
};

/* ============================================================
   DATE / TIME HELPERS
============================================================ */

const formatDate = (date) => {
  if (!date) {
    return "Not specified";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not specified";
  }

  return parsedDate.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};

const formatDay = (date) => {
  if (!date) {
    return "Not specified";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not specified";
  }

  return parsedDate.toLocaleDateString(
    "en-IN",
    {
      weekday: "long",
    }
  );
};

const formatTime = (time) => {
  if (
    !time ||
    typeof time !== "string"
  ) {
    return "Not specified";
  }

  const parts = time.split(":");

  if (parts.length < 2) {
    return time;
  }

  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return time;
  }

  const suffix =
    hours >= 12 ? "PM" : "AM";

  const displayHour =
    hours % 12 || 12;

  return `${String(
    displayHour
  ).padStart(2, "0")}:${String(
    minutes
  ).padStart(2, "0")} ${suffix}`;
};

/* ============================================================
   INTERVIEW DATE/TIME HELPERS
============================================================ */

/*
  Converts interview date + time into the browser's local time.

  Example:

  date      = 2026-09-21
  startTime = 13:00
  endTime   = 14:00

  Result:

  21 September 2026
  01:00 PM -> 02:00 PM
*/

const getInterviewDateTime = (
  date,
  time
) => {
  if (!date || !time) {
    return null;
  }

  try {
    const timeParts =
      String(time).split(":");

    const hours =
      Number(timeParts[0]);

    const minutes =
      Number(timeParts[1] || 0);

    const seconds =
      Number(timeParts[2] || 0);

    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes) ||
      Number.isNaN(seconds)
    ) {
      return null;
    }

    let year;
    let month;
    let day;

    const dateString =
      String(date);

    /*
      Handles YYYY-MM-DD safely
      without UTC conversion.
    */
    const dateOnlyMatch =
      dateString.match(
        /^(\d{4})-(\d{2})-(\d{2})/
      );

    if (dateOnlyMatch) {
      year =
        Number(dateOnlyMatch[1]);

      month =
        Number(dateOnlyMatch[2]) - 1;

      day =
        Number(dateOnlyMatch[3]);
    } else {
      const parsedDate =
        new Date(dateString);

      if (
        Number.isNaN(
          parsedDate.getTime()
        )
      ) {
        return null;
      }

      year =
        parsedDate.getFullYear();

      month =
        parsedDate.getMonth();

      day =
        parsedDate.getDate();
    }

    const result = new Date(
      year,
      month,
      day,
      hours,
      minutes,
      seconds,
      0
    );

    if (
      Number.isNaN(
        result.getTime()
      )
    ) {
      return null;
    }

    return result;
  } catch (error) {
    console.error(
      "INTERVIEW DATE/TIME PARSE ERROR:",
      error
    );

    return null;
  }
};

/*
  Returns:

  before
    Interview has not started.

  active
    Interview is currently running.

  expired
    Interview has ended.

  invalid
    Interview date/time is missing or invalid.
*/

const getInterviewJoinStatus = (
  interview,
  currentTime
) => {
  if (
    !interview ||
    !interview.date ||
    !interview.startTime ||
    !interview.endTime
  ) {
    return "invalid";
  }

  const startDateTime =
    getInterviewDateTime(
      interview.date,
      interview.startTime
    );

  const endDateTime =
    getInterviewDateTime(
      interview.date,
      interview.endTime
    );

  if (
    !startDateTime ||
    !endDateTime
  ) {
    return "invalid";
  }

  const now =
    currentTime instanceof Date
      ? currentTime
      : new Date();

  const currentTimestamp =
    now.getTime();

  const startTimestamp =
    startDateTime.getTime();

  const endTimestamp =
    endDateTime.getTime();

  /*
    Invalid schedule where end is
    before start.
  */
  if (
    endTimestamp <=
    startTimestamp
  ) {
    return "invalid";
  }

  /*
    Before interview.
  */
  if (
    currentTimestamp <
    startTimestamp
  ) {
    return "before";
  }

  /*
    During interview.

    Start time is inclusive.
    End time is exclusive.

    Therefore:

    01:00 PM -> allowed
    01:59:59 PM -> allowed
    02:00 PM -> expired
  */
  if (
    currentTimestamp >=
      startTimestamp &&
    currentTimestamp <
      endTimestamp
  ) {
    return "active";
  }

  /*
    End time reached.
  */
  return "expired";
};

/* ============================================================
   STATUS HELPERS
============================================================ */

const normalizeStatus = (status) => {
  return getSafeText(
    status,
    "Applied"
  );
};

const getStatusClass = (status) => {
  return normalizeStatus(status)
    .toLowerCase()
    .replace(/\s+/g, "-");
};

const getStatusLabel = (status) => {
  return normalizeStatus(status);
};

/* ============================================================
   INTERVIEW HELPERS
============================================================ */

const isInterviewScheduled = (
  application
) => {
  const interview =
    application?.interview;

  if (!interview) {
    return false;
  }

  return Boolean(
    interview.scheduled === true ||
      (
        interview.date &&
        interview.startTime &&
        interview.endTime &&
        interview.meetLink
      )
  );
};

const openMeetLink = (
  meetLink
) => {
  const link =
    getSafeText(meetLink);

  if (!link) {
    alert(
      "The interview meeting link is not available yet."
    );

    return;
  }

  try {
    const url =
      new URL(link);

    if (
      url.protocol !== "http:" &&
      url.protocol !== "https:"
    ) {
      throw new Error(
        "Invalid protocol"
      );
    }

    window.open(
      url.href,
      "_blank",
      "noopener,noreferrer"
    );
  } catch (error) {
    console.error(
      "Invalid interview meeting URL:",
      error
    );

    alert(
      "The interview meeting link is invalid."
    );
  }
};

/* ============================================================
   JOB HELPERS
============================================================ */

const getJobTitle = (
  application
) => {
  return getSafeText(
    application?.job?.title,
    getSafeText(
      application?.interview?.role,
      "Job Position"
    )
  );
};

const getCompanyName = (
  application
) => {
  return getSafeText(
    application?.job?.companyName ||
      application?.job?.company ||
      application?.job?.recruiterCompany,
    getSafeText(
      application?.interview?.company,
      "Company"
    )
  );
};

const getLocation = (
  application
) => {
  return getSafeText(
    application?.job?.location,
    getSafeText(
      application?.interview?.location,
      "Location not specified"
    )
  );
};

const getExperience = (
  application
) => {
  return getSafeText(
    application?.job?.experience ||
      application?.job?.experienceLevel,
    "Not specified"
  );
};

/* ============================================================
   APPLICATION COMPONENT
============================================================ */

const Application = () => {
  const navigate =
    useNavigate();

  const [
    applications,
    setApplications,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    activeTab,
    setActiveTab,
  ] = useState("all");

  const [
    deleteLoading,
    setDeleteLoading,
  ] = useState(null);

  /* Full application popup */
  const [
    selectedApplication,
    setSelectedApplication,
  ] = useState(null);

  /* Interview details popup */
  const [
    selectedInterviewApplication,
    setSelectedInterviewApplication,
  ] = useState(null);

  /* ============================================================
     LIVE CURRENT TIME
  ============================================================ */

  /*
    This updates every second.

    It allows the Join Interview button to:
    - become active at start time
    - disappear at end time
    without refreshing the page.
  */

  const [
    currentTime,
    setCurrentTime,
  ] = useState(
    () => new Date()
  );

  useEffect(() => {
    const timer =
      setInterval(() => {
        setCurrentTime(
          new Date()
        );
      }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  /* ============================================================
     FETCH APPLICATIONS
  ============================================================ */

  const fetchApplications =
    async () => {
      try {
        setLoading(true);
        setError("");

        const token =
          getToken();

        if (!token) {
          throw new Error(
            "Authentication token not found. Please login again."
          );
        }

        const response =
          await fetch(
            `${API_BASE_URL}/api/applications/my`,
            {
              method: "GET",
              headers: {
                Authorization:
                  `Bearer ${token}`,
                "Content-Type":
                  "application/json",
              },
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to fetch applications."
          );
        }

        const receivedApplications =
          Array.isArray(
            data.applications
          )
            ? data.applications
            : Array.isArray(data)
            ? data
            : [];

        setApplications(
          receivedApplications
        );
      } catch (err) {
        console.error(
          "FETCH APPLICATIONS ERROR:",
          err
        );

        setError(
          err.message ||
            "Unable to load your applications."
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchApplications();
  }, []);

  /* ============================================================
     APPLICATION COUNTS
  ============================================================ */

  const applicationCounts =
    useMemo(() => {
      const countStatus =
        (statuses) => {
          return applications.filter(
            (application) =>
              statuses.includes(
                normalizeStatus(
                  application.status
                )
              )
          ).length;
        };

      return {
        all:
          applications.length,

        draft:
          countStatus([
            "Draft",
          ]),

        applied:
          countStatus([
            "Applied",
          ]),

        underReview:
          countStatus([
            "Under Review",
          ]),

        underConsideration:
          countStatus([
            "Under Consideration",
          ]),

        shortlisted:
          countStatus([
            "Shortlisted",
          ]),

        interview:
          countStatus([
            "Interview",
          ]),

        selected:
          countStatus([
            "Selected",
          ]),

        rejected:
          countStatus([
            "Rejected",
            "No Longer Under Consideration",
          ]),
      };
    }, [applications]);

  /* ============================================================
     FILTER APPLICATIONS
  ============================================================ */

  const filteredApplications =
    useMemo(() => {
      switch (activeTab) {
        case "draft":
          return applications.filter(
            (application) =>
              normalizeStatus(
                application.status
              ) === "Draft"
          );

        case "applied":
          return applications.filter(
            (application) =>
              normalizeStatus(
                application.status
              ) === "Applied"
          );

        case "under-review":
          return applications.filter(
            (application) =>
              normalizeStatus(
                application.status
              ) === "Under Review"
          );

        case "under-consideration":
          return applications.filter(
            (application) =>
              normalizeStatus(
                application.status
              ) ===
              "Under Consideration"
          );

        case "shortlisted":
          return applications.filter(
            (application) =>
              normalizeStatus(
                application.status
              ) === "Shortlisted"
          );

        case "interview":
          return applications.filter(
            (application) =>
              normalizeStatus(
                application.status
              ) === "Interview"
          );

        case "selected":
          return applications.filter(
            (application) =>
              normalizeStatus(
                application.status
              ) === "Selected"
          );

        case "rejected":
          return applications.filter(
            (application) =>
              normalizeStatus(
                application.status
              ) === "Rejected" ||
              normalizeStatus(
                application.status
              ) ===
                "No Longer Under Consideration"
          );

        default:
          return applications;
      }
    }, [
      applications,
      activeTab,
    ]);

  /* ============================================================
     WITHDRAW APPLICATION
  ============================================================ */

  const handleWithdrawApplication =
    async (
      applicationId
    ) => {
      if (!applicationId) {
        return;
      }

      const confirmed =
        window.confirm(
          "Are you sure you want to withdraw this application?"
        );

      if (!confirmed) {
        return;
      }

      try {
        setDeleteLoading(
          applicationId
        );

        const token =
          getToken();

        if (!token) {
          throw new Error(
            "Authentication token not found."
          );
        }

        const response =
          await fetch(
            `${API_BASE_URL}/api/applications/${applicationId}`,
            {
              method: "DELETE",
              headers: {
                Authorization:
                  `Bearer ${token}`,
                "Content-Type":
                  "application/json",
              },
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to withdraw application."
          );
        }

        setApplications(
          (previous) =>
            previous.filter(
              (application) =>
                application._id !==
                applicationId
            )
        );

        if (
          selectedApplication?._id ===
          applicationId
        ) {
          setSelectedApplication(
            null
          );
        }
      } catch (err) {
        console.error(
          "WITHDRAW APPLICATION ERROR:",
          err
        );

        alert(
          err.message ||
            "Unable to withdraw application."
        );
      } finally {
        setDeleteLoading(
          null
        );
      }
    };

  /* ============================================================
     MODAL HELPERS
  ============================================================ */

  const openApplicationDetails =
    (application) => {
      if (!application) {
        return;
      }

      setSelectedApplication(
        application
      );
    };

  const closeApplicationDetails =
    () => {
      setSelectedApplication(
        null
      );
    };

  const openInterviewDetails =
    (application) => {
      if (
        !application ||
        !isInterviewScheduled(
          application
        )
      ) {
        return;
      }

      setSelectedInterviewApplication(
        application
      );
    };

  const closeInterviewDetails =
    () => {
      setSelectedInterviewApplication(
        null
      );
    };

  /* ============================================================
     ESC KEY
  ============================================================ */

  useEffect(() => {
    const handleEscape =
      (event) => {
        if (
          event.key !== "Escape"
        ) {
          return;
        }

        setSelectedApplication(
          null
        );

        setSelectedInterviewApplication(
          null
        );
      };

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  /* ============================================================
     LOCK BODY SCROLL WHEN MODAL IS OPEN
  ============================================================ */

  useEffect(() => {
    const modalOpen =
      Boolean(
        selectedApplication ||
          selectedInterviewApplication
      );

    if (modalOpen) {
      document.body.classList.add(
        "applications-modal-open"
      );
    } else {
      document.body.classList.remove(
        "applications-modal-open"
      );
    }

    return () => {
      document.body.classList.remove(
        "applications-modal-open"
      );
    };
  }, [
    selectedApplication,
    selectedInterviewApplication,
  ]);

  /* ============================================================
     LOADING
  ============================================================ */

  if (loading) {
    return (
      <div className="applications-page">
        <div className="applications-loading">
          <div className="applications-spinner" />

          <h3>
            Loading your applications...
          </h3>

          <p>
            Please wait while we fetch your
            latest application updates.
          </p>
        </div>
      </div>
    );
  }

  /* ============================================================
     TABS
  ============================================================ */

  const tabs = [
    {
      id: "all",
      label: "All",
      count:
        applicationCounts.all,
      icon: "📋",
    },
    {
      id: "draft",
      label: "Draft",
      count:
        applicationCounts.draft,
      icon: "📝",
    },
    {
      id: "applied",
      label: "Applied",
      count:
        applicationCounts.applied,
      icon: "📨",
    },
    {
      id: "under-review",
      label: "Under Review",
      count:
        applicationCounts.underReview,
      icon: "🔍",
    },
    {
      id: "under-consideration",
      label: "Under Consideration",
      count:
        applicationCounts.underConsideration,
      icon: "👀",
    },
    {
      id: "shortlisted",
      label: "Shortlisted",
      count:
        applicationCounts.shortlisted,
      icon: "⭐",
    },
    {
      id: "interview",
      label: "Interview",
      count:
        applicationCounts.interview,
      icon: "🎥",
    },
    {
      id: "selected",
      label: "Selected",
      count:
        applicationCounts.selected,
      icon: "🎉",
    },
    {
      id: "rejected",
      label: "Rejected / Closed",
      count:
        applicationCounts.rejected,
      icon: "✕",
    },
  ];

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="applications-page">

      {/* ======================================================
          HERO
      ====================================================== */}

      <section className="applications-hero">

        <div className="applications-hero-content">

          <span className="applications-eyebrow">
            TALENTIQ APPLICATIONS
          </span>

          <h1>
            My Applications
          </h1>

          <p>
            Track every job application,
            recruitment stage and interview
            from one place.
          </p>

        </div>

        <div className="applications-hero-stat">

          <strong>
            {applications.length}
          </strong>

          <span>
            Total Applications
          </span>

        </div>

      </section>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="applications-error">

          <div className="applications-error-icon">
            !
          </div>

          <div>
            <h3>
              Unable to load applications
            </h3>

            <p>
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={
              fetchApplications
            }
          >
            Try Again
          </button>

        </div>
      )}

      {/* ======================================================
          STATUS TABS
      ====================================================== */}

      <div className="applications-tabs-wrapper">

        <div className="applications-tabs">

          {tabs.map(
            (tab) => (
              <button
                key={tab.id}
                type="button"
                className={
                  activeTab ===
                  tab.id
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveTab(
                    tab.id
                  )
                }
              >

                <span className="application-tab-icon">
                  {tab.icon}
                </span>

                <span className="application-tab-label">
                  {tab.label}
                </span>

                <strong>
                  {tab.count}
                </strong>

              </button>
            )
          )}

        </div>

      </div>

      {/* ======================================================
          DRAFT INFORMATION
      ====================================================== */}

      {activeTab ===
        "draft" && (
        <div className="draft-information">

          <div className="draft-information-icon">
            📝
          </div>

          <div>
            <h3>
              Draft Applications
            </h3>

            <p>
              Draft applications will appear
              here when draft saving is enabled
              in the backend.
            </p>
          </div>

        </div>
      )}

      {/* ======================================================
          EMPTY STATE
      ====================================================== */}

      {filteredApplications.length ===
      0 ? (
        <div className="applications-empty">

          <div className="applications-empty-icon">
            {activeTab ===
            "all"
              ? "📄"
              : "🔎"}
          </div>

          <h2>
            {activeTab ===
            "all"
              ? "No applications yet"
              : "No applications in this section"}
          </h2>

          <p>
            {activeTab ===
            "all"
              ? "Once you apply for jobs, your applications will appear here."
              : `There are currently no applications under ${
                  tabs.find(
                    (tab) =>
                      tab.id ===
                      activeTab
                  )?.label ||
                  "this category"
                }.`}
          </p>

          {activeTab ===
          "all" ? (
            <button
              type="button"
              onClick={() =>
                navigate(
                  "/find-jobs"
                )
              }
            >
              Find Jobs
            </button>
          ) : (
            <button
              type="button"
              onClick={() =>
                setActiveTab(
                  "all"
                )
              }
            >
              View All Applications
            </button>
          )}

        </div>
      ) : (

        /* ====================================================
           APPLICATION LIST
        ==================================================== */

        <div className="applications-list">

          {filteredApplications.map(
            (application) => {

              const scheduled =
                isInterviewScheduled(
                  application
                );

              const status =
                normalizeStatus(
                  application.status
                );

              const jobTitle =
                getJobTitle(
                  application
                );

              const companyName =
                getCompanyName(
                  application
                );

              const location =
                getLocation(
                  application
                );

              const experience =
                getExperience(
                  application
                );

              const interview =
                application?.interview ||
                {};

              const joinStatus =
                getInterviewJoinStatus(
                  interview,
                  currentTime
                );

              const hasMeetLink =
                Boolean(
                  getSafeText(
                    interview.meetLink
                  )
                );

              return (
                <article
                  className={`application-card ${
                    scheduled
                      ? "has-interview"
                      : ""
                  }`}
                  key={
                    application._id
                  }
                >

                  {/* ==========================================
                      CARD HEADER
                  ========================================== */}

                  <div className="application-card-header">

                    <div className="application-job-heading">

                      <div className="application-company-icon">
                        {companyName
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>

                        <h2>
                          {jobTitle}
                        </h2>

                        <p>
                          {companyName}
                        </p>

                      </div>

                    </div>

                    <span
                      className={`application-status ${getStatusClass(
                        status
                      )}`}
                    >
                      {getStatusLabel(
                        status
                      )}
                    </span>

                  </div>

                  {/* ==========================================
                      JOB DETAILS
                  ========================================== */}

                  <div className="application-job-details">

                    <div className="application-detail-item">

                      <span className="application-detail-icon">
                        📍
                      </span>

                      <div>
                        <small>
                          Location
                        </small>

                        <strong>
                          {location}
                        </strong>
                      </div>

                    </div>

                    <div className="application-detail-item">

                      <span className="application-detail-icon">
                        💼
                      </span>

                      <div>
                        <small>
                          Experience
                        </small>

                        <strong>
                          {experience}
                        </strong>
                      </div>

                    </div>

                    <div className="application-detail-item">

                      <span className="application-detail-icon">
                        📅
                      </span>

                      <div>
                        <small>
                          Applied
                        </small>

                        <strong>
                          {formatDate(
                            application.createdAt
                          )}
                        </strong>
                      </div>

                    </div>

                    <div className="application-detail-item">

                      <span className="application-detail-icon">
                        🔄
                      </span>

                      <div>
                        <small>
                          Last Updated
                        </small>

                        <strong>
                          {formatDate(
                            application.statusUpdatedAt ||
                              application.updatedAt ||
                              application.createdAt
                          )}
                        </strong>
                      </div>

                    </div>

                  </div>

                  {/* ==========================================
                      INTERVIEW SECTION
                  ========================================== */}

                  {status ===
                    "Interview" && (
                    <div
                      className={`application-interview ${
                        scheduled
                          ? "scheduled"
                          : "pending"
                      }`}
                    >

                      {scheduled ? (
                        <>

                          <div className="interview-card-content">

                            <div className="interview-calendar-icon">
                              🎥
                            </div>

                            <div className="interview-card-text">

                              <span className="interview-card-label">
                                INTERVIEW SCHEDULED
                              </span>

                              <h3>
                                Your interview is confirmed
                              </h3>

                              <p>
                                {formatDate(
                                  interview.date
                                )}
                                {" • "}
                                {formatTime(
                                  interview.startTime
                                )}
                                {" - "}
                                {formatTime(
                                  interview.endTime
                                )}
                              </p>

                              {joinStatus ===
                                "before" && (
                                <small className="interview-join-message">
                                  Join will be available when the interview starts.
                                </small>
                              )}

                              {joinStatus ===
                                "active" && (
                                <small className="interview-join-message active">
                                  Your interview is live now.
                                </small>
                              )}

                              {joinStatus ===
                                "expired" && (
                                <small className="interview-join-message expired">
                                  This interview has ended.
                                </small>
                              )}

                            </div>

                          </div>

                          <div className="interview-actions">

                            {/* BEFORE START */}
                            {joinStatus ===
                              "before" && (
                              <button
                                type="button"
                                className="join-interview-button"
                                disabled
                                title="The interview has not started yet."
                              >
                                <span>
                                  ⏰
                                </span>

                                Join Interview
                              </button>
                            )}

                            {/* DURING INTERVIEW */}
                            {joinStatus ===
                              "active" && (
                              <button
                                type="button"
                                className="join-interview-button"
                                disabled={
                                  !hasMeetLink
                                }
                                onClick={() =>
                                  openMeetLink(
                                    interview.meetLink
                                  )
                                }
                              >
                                <span>
                                  🎥
                                </span>

                                Join Interview
                              </button>
                            )}

                            {/* INVALID */}
                            {joinStatus ===
                              "invalid" && (
                              <button
                                type="button"
                                className="join-interview-button"
                                disabled
                              >
                                <span>
                                  🎥
                                </span>

                                Join Interview
                              </button>
                            )}

                            {/* EXPIRED:
                                No Join button */}

                            <button
                              type="button"
                              className="interview-details-button"
                              onClick={() =>
                                openInterviewDetails(
                                  application
                                )
                              }
                            >
                              <span>
                                ⓘ
                              </span>

                              Details
                            </button>

                          </div>

                        </>
                      ) : (

                        <div className="interview-pending-content">

                          <div className="interview-pending-icon">
                            ⏰
                          </div>

                          <div>

                            <span>
                              INTERVIEW
                            </span>

                            <h3>
                              Interview stage
                            </h3>

                            <p>
                              The recruiter has moved
                              your application to the
                              interview stage. Interview
                              details will appear here
                              once scheduled.
                            </p>

                          </div>

                        </div>

                      )}

                    </div>
                  )}

                  {/* ==========================================
                      CARD FOOTER
                  ========================================== */}

                  <div className="application-card-footer">

                    <div className="application-last-updated">

                      <span>
                        Last updated
                      </span>

                      <strong>
                        {formatDate(
                          application.statusUpdatedAt ||
                            application.updatedAt ||
                            application.createdAt
                        )}
                      </strong>

                    </div>

                    <div className="application-footer-actions">

                      <button
                        type="button"
                        className="view-application-button"
                        onClick={() =>
                          openApplicationDetails(
                            application
                          )
                        }
                      >
                        <span>
                          👁
                        </span>

                        View Application
                      </button>

                      {status ===
                        "Applied" && (
                        <button
                          type="button"
                          className="withdraw-application-button"
                          disabled={
                            deleteLoading ===
                            application._id
                          }
                          onClick={() =>
                            handleWithdrawApplication(
                              application._id
                            )
                          }
                        >
                          {deleteLoading ===
                          application._id
                            ? "Withdrawing..."
                            : "Withdraw"}
                        </button>
                      )}

                    </div>

                  </div>

                </article>
              );
            }
          )}

        </div>
      )}

      {/* ========================================================
          FULL APPLICATION DETAILS MODAL
      ======================================================== */}

      {selectedApplication && (
        <div
          className="application-details-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeApplicationDetails();
            }
          }}
        >

          <div className="application-details-modal">

            <div className="application-details-modal-header">

              <div>

                <span className="modal-eyebrow">
                  TALENTIQ APPLICATION
                </span>

                <h2>
                  Application Details
                </h2>

                <p>
                  Complete information submitted
                  for this job application.
                </p>

              </div>

              <button
                type="button"
                className="application-modal-close"
                onClick={
                  closeApplicationDetails
                }
                aria-label="Close application details"
              >
                ×
              </button>

            </div>

            {/* JOB SUMMARY */}

            <div className="application-modal-job-summary">

              <div className="application-modal-company-icon">
                {getCompanyName(
                  selectedApplication
                )
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>

                <span>
                  APPLIED POSITION
                </span>

                <h3>
                  {getJobTitle(
                    selectedApplication
                  )}
                </h3>

                <p>
                  {getCompanyName(
                    selectedApplication
                  )}
                </p>

              </div>

              <span
                className={`application-status ${getStatusClass(
                  selectedApplication.status
                )}`}
              >
                {getStatusLabel(
                  selectedApplication.status
                )}
              </span>

            </div>

            {/* PERSONAL INFORMATION */}

            <section className="application-modal-section">

              <div className="application-modal-section-title">

                <span>
                  👤
                </span>

                <div>

                  <h3>
                    Applicant Information
                  </h3>

                  <p>
                    Information submitted with
                    your application.
                  </p>

                </div>

              </div>

              <div className="application-modal-grid">

                <div className="application-modal-field">

                  <span>
                    FULL NAME
                  </span>

                  <strong>
                    {getSafeText(
                      selectedApplication.fullName,
                      "Not provided"
                    )}
                  </strong>

                </div>

                <div className="application-modal-field">

                  <span>
                    EMAIL
                  </span>

                  <strong>
                    {getSafeText(
                      selectedApplication.email,
                      "Not provided"
                    )}
                  </strong>

                </div>

                <div className="application-modal-field">

                  <span>
                    PHONE
                  </span>

                  <strong>
                    {getSafeText(
                      selectedApplication.phone,
                      "Not provided"
                    )}
                  </strong>

                </div>

                <div className="application-modal-field">

                  <span>
                    LOCATION
                  </span>

                  <strong>
                    {getLocation(
                      selectedApplication
                    )}
                  </strong>

                </div>

              </div>

            </section>

            {/* PROFESSIONAL LINKS */}

            <section className="application-modal-section">

              <div className="application-modal-section-title">

                <span>
                  🔗
                </span>

                <div>

                  <h3>
                    Professional Links
                  </h3>

                  <p>
                    Links provided in the
                    application.
                  </p>

                </div>

              </div>

              <div className="application-links-grid">

                <div className="application-link-field">

                  <span>
                    LINKEDIN
                  </span>

                  {getSafeText(
                    selectedApplication.linkedin
                  ) ? (
                    <a
                      href={
                        selectedApplication.linkedin
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open LinkedIn
                    </a>
                  ) : (
                    <strong>
                      Not provided
                    </strong>
                  )}

                </div>

                <div className="application-link-field">

                  <span>
                    PORTFOLIO
                  </span>

                  {getSafeText(
                    selectedApplication.portfolio
                  ) ? (
                    <a
                      href={
                        selectedApplication.portfolio
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open Portfolio
                    </a>
                  ) : (
                    <strong>
                      Not provided
                    </strong>
                  )}

                </div>

              </div>

            </section>

            {/* JOB INFORMATION */}

            <section className="application-modal-section">

              <div className="application-modal-section-title">

                <span>
                  💼
                </span>

                <div>

                  <h3>
                    Job Information
                  </h3>

                  <p>
                    Position details associated
                    with this application.
                  </p>

                </div>

              </div>

              <div className="application-modal-grid">

                <div className="application-modal-field">

                  <span>
                    JOB TITLE
                  </span>

                  <strong>
                    {getJobTitle(
                      selectedApplication
                    )}
                  </strong>

                </div>

                <div className="application-modal-field">

                  <span>
                    COMPANY
                  </span>

                  <strong>
                    {getCompanyName(
                      selectedApplication
                    )}
                  </strong>

                </div>

                <div className="application-modal-field">

                  <span>
                    LOCATION
                  </span>

                  <strong>
                    {getLocation(
                      selectedApplication
                    )}
                  </strong>

                </div>

                <div className="application-modal-field">

                  <span>
                    EXPERIENCE
                  </span>

                  <strong>
                    {getExperience(
                      selectedApplication
                    )}
                  </strong>

                </div>

              </div>

            </section>

            {/* RESUME */}

            <section className="application-modal-section">

              <div className="application-modal-section-title">

                <span>
                  📄
                </span>

                <div>

                  <h3>
                    Resume
                  </h3>

                  <p>
                    Resume information submitted
                    with your application.
                  </p>

                </div>

              </div>

              <div className="resume-modal-box">

                <div className="resume-modal-icon">
                  📄
                </div>

                <div>

                  <span>
                    RESUME FILE
                  </span>

                  <strong>
                    {getSafeText(
                      selectedApplication
                        ?.resume?.fileName,
                      "Resume submitted"
                    )}
                  </strong>

                </div>

                {getSafeText(
                  selectedApplication
                    ?.resume?.fileUrl
                ) && (
                  <a
                    href={
                      selectedApplication
                        .resume.fileUrl
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="resume-open-button"
                  >
                    View Resume
                  </a>
                )}

              </div>

            </section>

            {/* COVER LETTER */}

            <section className="application-modal-section">

              <div className="application-modal-section-title">

                <span>
                  ✉
                </span>

                <div>

                  <h3>
                    Cover Letter
                  </h3>

                  <p>
                    Cover letter submitted with
                    this application.
                  </p>

                </div>

              </div>

              <div className="application-text-box">

                {getSafeText(
                  selectedApplication.coverLetter
                ) ? (
                  <p>
                    {
                      selectedApplication.coverLetter
                    }
                  </p>
                ) : (
                  <span className="not-provided">
                    No cover letter was provided.
                  </span>
                )}

              </div>

            </section>

            {/* RESUME TEXT */}

            {getSafeText(
              selectedApplication.resumeText
            ) && (
              <section className="application-modal-section">

                <div className="application-modal-section-title">

                  <span>
                    🧾
                  </span>

                  <div>

                    <h3>
                      Resume Text
                    </h3>

                    <p>
                      Resume text processed by
                      TalentIQ.
                    </p>

                  </div>

                </div>

                <div className="application-text-box resume-text-box">

                  <p>
                    {
                      selectedApplication.resumeText
                    }
                  </p>

                </div>

              </section>
            )}

            {/* APPLICATION STATUS */}

            <section className="application-modal-section">

              <div className="application-modal-section-title">

                <span>
                  📊
                </span>

                <div>

                  <h3>
                    Application Status
                  </h3>

                  <p>
                    Current recruitment progress.
                  </p>

                </div>

              </div>

              <div className="application-status-timeline">

                <div className="status-timeline-item active">

                  <div className="timeline-dot">
                    ✓
                  </div>

                  <div>

                    <span>
                      CURRENT STATUS
                    </span>

                    <strong>
                      {getStatusLabel(
                        selectedApplication.status
                      )}
                    </strong>

                  </div>

                </div>

                <div className="status-date-box">

                  <span>
                    APPLIED ON
                  </span>

                  <strong>
                    {formatDate(
                      selectedApplication.createdAt
                    )}
                  </strong>

                </div>

                <div className="status-date-box">

                  <span>
                    LAST UPDATED
                  </span>

                  <strong>
                    {formatDate(
                      selectedApplication.statusUpdatedAt ||
                        selectedApplication.updatedAt ||
                        selectedApplication.createdAt
                    )}
                  </strong>

                </div>

              </div>

            </section>

            {/* INTERVIEW INFORMATION */}

            {isInterviewScheduled(
              selectedApplication
            ) && (
              <section className="application-modal-section interview-modal-section">

                <div className="application-modal-section-title">

                  <span>
                    🎥
                  </span>

                  <div>

                    <h3>
                      Interview Information
                    </h3>

                    <p>
                      Your recruiter has scheduled
                      an interview.
                    </p>

                  </div>

                </div>

                <div className="interview-modal-summary">

                  <div className="interview-modal-date">

                    <span>
                      INTERVIEW DATE
                    </span>

                    <strong>
                      {formatDate(
                        selectedApplication
                          ?.interview?.date
                      )}
                    </strong>

                    <small>
                      {formatDay(
                        selectedApplication
                          ?.interview?.date
                      )}
                    </small>

                  </div>

                  <div className="interview-modal-time">

                    <span>
                      TIME
                    </span>

                    <strong>
                      {formatTime(
                        selectedApplication
                          ?.interview?.startTime
                      )}
                      {" - "}
                      {formatTime(
                        selectedApplication
                          ?.interview?.endTime
                      )}
                    </strong>

                  </div>

                  <div className="interview-modal-location">

                    <span>
                      LOCATION
                    </span>

                    <strong>
                      {getSafeText(
                        selectedApplication
                          ?.interview?.location,
                        getLocation(
                          selectedApplication
                        )
                      )}
                    </strong>

                  </div>

                </div>

                <div className="application-modal-interview-actions">

                  {(() => {
                    const modalInterview =
                      selectedApplication?.interview;

                    const joinStatus =
                      getInterviewJoinStatus(
                        modalInterview,
                        currentTime
                      );

                    const hasMeetLink =
                      Boolean(
                        getSafeText(
                          modalInterview?.meetLink
                        )
                      );

                    if (
                      joinStatus ===
                      "expired"
                    ) {
                      return null;
                    }

                    if (
                      joinStatus ===
                      "before"
                    ) {
                      return (
                        <button
                          type="button"
                          className="modal-join-interview-button"
                          disabled
                        >
                          ⏰ Interview Not Started
                        </button>
                      );
                    }

                    if (
                      joinStatus ===
                      "invalid"
                    ) {
                      return (
                        <button
                          type="button"
                          className="modal-join-interview-button"
                          disabled
                        >
                          🎥 Join Interview
                        </button>
                      );
                    }

                    return (
                      <button
                        type="button"
                        className="modal-join-interview-button"
                        disabled={
                          !hasMeetLink
                        }
                        onClick={() =>
                          openMeetLink(
                            modalInterview?.meetLink
                          )
                        }
                      >
                        🎥 Join Interview
                      </button>
                    );
                  })()}

                  <button
                    type="button"
                    className="modal-close-secondary-button"
                    onClick={
                      closeApplicationDetails
                    }
                  >
                    Close
                  </button>

                </div>

              </section>
            )}

            {/* FOOTER */}

            <div className="application-modal-footer">

              <span>
                Application ID:
                {" "}
                {getSafeText(
                  selectedApplication._id,
                  "N/A"
                )}
              </span>

              <button
                type="button"
                onClick={
                  closeApplicationDetails
                }
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}

      {/* ========================================================
          INTERVIEW DETAILS MODAL
      ======================================================== */}

      {selectedInterviewApplication && (
        <div
          className="interview-details-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeInterviewDetails();
            }
          }}
        >

          <div className="interview-details-modal">

            <div className="interview-details-header">

              <div>

                <span>
                  TALENTIQ INTERVIEW
                </span>

                <h2>
                  Interview Details
                </h2>

                <p>
                  Complete information about
                  your scheduled interview.
                </p>

              </div>

              <button
                type="button"
                className="interview-details-close"
                onClick={
                  closeInterviewDetails
                }
                aria-label="Close interview details"
              >
                ×
              </button>

            </div>

            <div className="interview-details-hero">

              <div className="interview-details-hero-icon">
                🎥
              </div>

              <div>

                <span>
                  INTERVIEW FOR
                </span>

                <h3>
                  {getJobTitle(
                    selectedInterviewApplication
                  )}
                </h3>

                <p>
                  {getCompanyName(
                    selectedInterviewApplication
                  )}
                </p>

              </div>

            </div>

            <div className="interview-details-grid">

              <div className="interview-detail-box">

                <span>
                  COMPANY
                </span>

                <strong>
                  {getCompanyName(
                    selectedInterviewApplication
                  )}
                </strong>

              </div>

              <div className="interview-detail-box">

                <span>
                  ROLE
                </span>

                <strong>
                  {getJobTitle(
                    selectedInterviewApplication
                  )}
                </strong>

              </div>

              <div className="interview-detail-box">

                <span>
                  DATE
                </span>

                <strong>
                  {formatDate(
                    selectedInterviewApplication
                      ?.interview?.date
                  )}
                </strong>

              </div>

              <div className="interview-detail-box">

                <span>
                  DAY
                </span>

                <strong>
                  {formatDay(
                    selectedInterviewApplication
                      ?.interview?.date
                  )}
                </strong>

              </div>

              <div className="interview-detail-box">

                <span>
                  TIME
                </span>

                <strong>
                  {formatTime(
                    selectedInterviewApplication
                      ?.interview?.startTime
                  )}
                  {" - "}
                  {formatTime(
                    selectedInterviewApplication
                      ?.interview?.endTime
                  )}
                </strong>

              </div>

              <div className="interview-detail-box">

                <span>
                  LOCATION
                </span>

                <strong>
                  {getSafeText(
                    selectedInterviewApplication
                      ?.interview?.location,
                    getLocation(
                      selectedInterviewApplication
                    )
                  )}
                </strong>

              </div>

            </div>

            <div className="interview-meeting-box">

              <div className="interview-meeting-icon">
                🎥
              </div>

              <div className="interview-meeting-content">

                <span>
                  GOOGLE MEET
                </span>

                <strong>
                  Online Interview
                </strong>

                <p>
                  Use the button below to join
                  the meeting using the Google
                  Meet link provided by the
                  recruiter.
                </p>

              </div>

            </div>

            <div className="interview-details-actions">

              <button
                type="button"
                className="details-close-button"
                onClick={
                  closeInterviewDetails
                }
              >
                Close
              </button>

              {(() => {
                const detailsInterview =
                  selectedInterviewApplication?.interview;

                const joinStatus =
                  getInterviewJoinStatus(
                    detailsInterview,
                    currentTime
                  );

                const hasMeetLink =
                  Boolean(
                    getSafeText(
                      detailsInterview?.meetLink
                    )
                  );

                if (
                  joinStatus ===
                  "expired"
                ) {
                  return null;
                }

                if (
                  joinStatus ===
                  "before"
                ) {
                  return (
                    <button
                      type="button"
                      className="details-join-button"
                      disabled
                    >
                      ⏰ Interview Not Started
                    </button>
                  );
                }

                if (
                  joinStatus ===
                  "invalid"
                ) {
                  return (
                    <button
                      type="button"
                      className="details-join-button"
                      disabled
                    >
                      🎥 Join Interview
                    </button>
                  );
                }

                return (
                  <button
                    type="button"
                    className="details-join-button"
                    disabled={
                      !hasMeetLink
                    }
                    onClick={() =>
                      openMeetLink(
                        detailsInterview?.meetLink
                      )
                    }
                  >
                    🎥 Join Interview
                  </button>
                );
              })()}

            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default Application;