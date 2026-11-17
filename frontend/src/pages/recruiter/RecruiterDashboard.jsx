import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Link, useNavigate } from "react-router-dom";

import {
  FaArrowRight,
  FaBell,
  FaBriefcase,
  FaBuilding,
  FaCheckCircle,
  FaChevronRight,
  FaClock,
  FaEnvelope,
  FaExternalLinkAlt,
  FaGlobe,
  FaLinkedin,
  FaMapMarkerAlt,
  FaPhone,
  FaPlus,
  FaRedo,
  FaShieldAlt,
  FaSpinner,
  FaUser,
  FaUserTie,
} from "react-icons/fa";

import "../../styles/recruiterDashboard.css";

// ============================================================
// API CONFIGURATION
// ============================================================

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

// ============================================================
// TOKEN HELPER
// ============================================================

const getAuthToken = () => {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken") ||
    ""
  );
};

// ============================================================
// SAFE TEXT HELPER
// ============================================================

const safeText = (value, fallback = "Not provided") => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return fallback;
  }

  if (typeof value === "object") {
    return fallback;
  }

  return String(value);
};

// ============================================================
// RECRUITER DASHBOARD
// ============================================================

const RecruiterDashboard = () => {
  const navigate = useNavigate();

  // ==========================================================
  // STATE
  // ==========================================================

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  // ==========================================================
  // AUTH TOKEN
  // ==========================================================

  const token = useMemo(
    () => getAuthToken(),
    []
  );

  // ==========================================================
  // FETCH RECRUITER PROFILE
  //
  // Backend:
  // app.use("/api/recruiters", recruiterRoutes)
  //
  // recruiterRoutes:
  // router.get("/profile", ...)
  //
  // Final URL:
  // /api/recruiters/profile
  // ==========================================================

  const fetchRecruiterProfile = useCallback(
    async (isRefresh = false) => {
      try {
        if (!token) {
          navigate("/login", {
            replace: true,
          });

          return;
        }

        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        // ======================================================
        // REAL BACKEND REQUEST
        // ======================================================

        const response = await fetch(
          `${API_URL}/api/recruiters/profile`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        // ======================================================
        // RESPONSE
        // ======================================================

        let data = {};

        try {
          data = await response.json();
        } catch {
          data = {
            success: false,
            message:
              "Invalid response received from server",
          };
        }

        console.log(
          "TALENTIQ RECRUITER PROFILE RESPONSE:",
          data
        );

        // ======================================================
        // AUTH FAILURE
        // ======================================================

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          localStorage.removeItem("token");
          localStorage.removeItem("authToken");
          localStorage.removeItem("accessToken");

          navigate("/login", {
            replace: true,
          });

          return;
        }

        // ======================================================
        // PROFILE NOT FOUND
        // ======================================================

        if (response.status === 404) {
          setProfile(null);

          setError(
            data.message ||
              "Recruiter profile has not been created yet."
          );

          return;
        }

        // ======================================================
        // OTHER ERROR
        // ======================================================

        if (!response.ok || data.success === false) {
          throw new Error(
            data.message ||
              `Unable to load recruiter profile (${response.status})`
          );
        }

        // ======================================================
        // STORE PROFILE
        // ======================================================

        setProfile(data.profile || null);

        setLastUpdated(new Date());
      } catch (err) {
        console.error(
          "RECRUITER DASHBOARD PROFILE ERROR:",
          err
        );

        setError(
          err.message ||
            "Unable to connect to TalentIQ backend."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [navigate, token]
  );

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    fetchRecruiterProfile(false);
  }, [fetchRecruiterProfile]);

  // ==========================================================
  // PROFILE VALUES
  // ==========================================================

  const user = profile?.user || {};

  const recruiterName = safeText(
    user.fullName ||
      user.name ||
      user.username,
    "Recruiter"
  );

  const companyName = safeText(
    profile?.companyName,
    "Your Company"
  );

  const designation = safeText(
    profile?.designation,
    "Recruiter"
  );

  const email = safeText(
    user.email,
    "Email not provided"
  );

  const username = safeText(
    user.username,
    "Username not provided"
  );

  const phone = safeText(
    profile?.phone,
    "Phone not provided"
  );

  const location = safeText(
    profile?.location,
    "Location not provided"
  );

  const bio = safeText(
    profile?.bio,
    "Add a short company or recruiter description from your profile."
  );

  // ==========================================================
  // PROFILE COMPLETION
  // ==========================================================

  const profileFields = [
    profile?.companyName,
    profile?.designation,
    profile?.phone,
    profile?.location,
    profile?.bio,
    profile?.website,
    profile?.linkedin,
    user?.fullName || user?.name,
    user?.email,
    user?.username,
  ];

  const completedProfileFields =
    profileFields.filter(
      (field) =>
        field !== null &&
        field !== undefined &&
        String(field).trim() !== ""
    ).length;

  const profileCompletion =
    profileFields.length > 0
      ? Math.round(
          (completedProfileFields /
            profileFields.length) *
            100
        )
      : 0;

  // ==========================================================
  // WEBSITE HANDLER
  // ==========================================================

  const normalizeUrl = (url) => {
    if (!url) {
      return "";
    }

    if (
      url.startsWith("http://") ||
      url.startsWith("https://")
    ) {
      return url;
    }

    return `https://${url}`;
  };

  const websiteUrl = normalizeUrl(
    profile?.website
  );

  const linkedinUrl = normalizeUrl(
    profile?.linkedin
  );

  // ==========================================================
  // PROFILE NOT FOUND VIEW
  // ==========================================================

  if (!loading && !profile && error) {
    return (
      <div className="recruiter-dashboard-page">
        <main className="recruiter-dashboard-container">

          {/* ==================================================
              ERROR / PROFILE SETUP
          ================================================== */}

          <section className="recruiter-dashboard-error-card">
            <div className="recruiter-error-icon">
              <FaUserTie />
            </div>

            <span className="recruiter-error-kicker">
              RECRUITER PROFILE
            </span>

            <h1>
              Complete your recruiter profile
            </h1>

            <p>
              Your recruiter account is authenticated,
              but a recruiter profile could not be loaded.
              Create your profile to show your company,
              designation and contact information here.
            </p>

            <div className="recruiter-error-actions">

              <Link
                to="/recruiter-profile"
                className="recruiter-primary-button"
              >
                <FaUser />
                Open Profile
              </Link>

              <button
                type="button"
                className="recruiter-secondary-button"
                onClick={() =>
                  fetchRecruiterProfile(true)
                }
              >
                <FaRedo />
                Try Again
              </button>

            </div>
          </section>

          {/* ==================================================
              FOOTER
          ================================================== */}

          <RecruiterFooter />

        </main>
      </div>
    );
  }

  // ==========================================================
  // LOADING VIEW
  // ==========================================================

  if (loading) {
    return (
      <div className="recruiter-dashboard-page">
        <main className="recruiter-dashboard-container">

          <section className="recruiter-loading-card">

            <div className="recruiter-loading-spinner">
              <FaSpinner />
            </div>

            <h2>
              Loading recruiter dashboard
            </h2>

            <p>
              Connecting to your TalentIQ recruiter profile...
            </p>

          </section>

          <RecruiterFooter />

        </main>
      </div>
    );
  }

  // ==========================================================
  // MAIN DASHBOARD
  // ==========================================================

  return (
    <div className="recruiter-dashboard-page">

      <main className="recruiter-dashboard-container">

        {/* ====================================================
            DASHBOARD HEADER
        ==================================================== */}

        <section className="recruiter-dashboard-header">

          <div className="recruiter-dashboard-header-content">

            <div>
              <span className="recruiter-dashboard-kicker">
                RECRUITER WORKSPACE
              </span>

              <h1>
                Welcome back,{" "}
                <span>
                  {recruiterName}
                </span>
              </h1>

              <p>
                Manage your recruitment activity
                and connect with talented candidates
                through TalentIQ.
              </p>
            </div>

            <div className="recruiter-header-actions">

              {/* REFRESH IS AN ACTION, SO KEEP onClick */}
              <button
                type="button"
                className="recruiter-refresh-button"
                onClick={() =>
                  fetchRecruiterProfile(true)
                }
                disabled={refreshing}
              >
                <FaRedo
                  className={
                    refreshing
                      ? "recruiter-spin"
                      : ""
                  }
                />

                {refreshing
                  ? "Refreshing..."
                  : "Refresh"}
              </button>

              <div className="recruiter-post-stack">

                {/* ==================================================
                    NOTIFICATION LINK
                    Change the route here if your notification
                    page uses a different route.
                ================================================== */}

                <Link
                  to="/recruiter-notifications"
                  className="recruiter-notification-button"
                  aria-label="Notifications"
                  title="Notifications"
                >
                  <FaBell />
                </Link>

                {/* ==================================================
                    POST JOB LINK
                ================================================== */}

                <Link
                  to="/recruiter/jobs/post"
                  className="recruiter-post-button"
                >
                  <FaPlus />
                  Post a Job
                </Link>

              </div>
            </div>

          </div>

          {/* ==================================================
              LAST UPDATED
          ================================================== */}

          <div className="recruiter-last-updated">

            <FaClock />

            <span>
              {lastUpdated
                ? `Updated ${lastUpdated.toLocaleTimeString(
                    [],
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}`
                : "Live recruiter profile"}
            </span>

          </div>

        </section>

        {/* ====================================================
            ERROR MESSAGE
        ==================================================== */}

        {error && (
          <div className="recruiter-dashboard-warning">

            <div className="recruiter-warning-icon">
              !
            </div>

            <div>

              <strong>
                Unable to refresh profile
              </strong>

              <p>
                {error}
              </p>

            </div>

          </div>
        )}

        {/* ====================================================
            COMPANY / RECRUITER HERO
        ==================================================== */}

        <section className="recruiter-company-card">

          <div className="recruiter-company-main">

            <div className="recruiter-company-avatar">
              <FaBuilding />
            </div>

            <div className="recruiter-company-information">

              <span className="recruiter-company-label">
                COMPANY
              </span>

              <h2>
                {companyName}
              </h2>

              <p className="recruiter-designation">
                <FaUserTie />
                {designation}
              </p>

              <p className="recruiter-location">
                <FaMapMarkerAlt />
                {location}
              </p>

            </div>

          </div>

          <div className="recruiter-company-actions">

            <Link
              to="/recruiter/profile"
              className="recruiter-outline-button"
            >
              View / Edit Profile
              <FaArrowRight />
            </Link>

          </div>

        </section>

        {/* ====================================================
            QUICK STATS / ACCOUNT CARDS
        ==================================================== */}

        <section className="recruiter-dashboard-grid">

          {/* PROFILE COMPLETION */}

          <article className="recruiter-stat-card">

            <div className="recruiter-stat-icon recruiter-stat-blue">
              <FaUser />
            </div>

            <div className="recruiter-stat-content">

              <span>
                PROFILE COMPLETION
              </span>

              <strong>
                {profileCompletion}%
              </strong>

              <div className="recruiter-progress">

                <div
                  className="recruiter-progress-fill"
                  style={{
                    width: `${profileCompletion}%`,
                  }}
                />

              </div>

              <small>
                {profileCompletion === 100
                  ? "Profile is complete"
                  : "Complete your profile for better visibility"}
              </small>

            </div>

          </article>

          {/* COMPANY */}

          <article className="recruiter-stat-card">

            <div className="recruiter-stat-icon recruiter-stat-purple">
              <FaBuilding />
            </div>

            <div className="recruiter-stat-content">

              <span>
                COMPANY
              </span>

              <strong className="recruiter-stat-text">
                {companyName}
              </strong>

              <small>
                Registered recruiter company
              </small>

            </div>

          </article>

          {/* ACCOUNT ROLE */}

          <article className="recruiter-stat-card">

            <div className="recruiter-stat-icon recruiter-stat-green">
              <FaShieldAlt />
            </div>

            <div className="recruiter-stat-content">

              <span>
                ACCOUNT TYPE
              </span>

              <strong className="recruiter-stat-text">
                Recruiter
              </strong>

              <small>
                Authenticated recruiter account
              </small>

            </div>

          </article>

          {/* LOCATION */}

          <article className="recruiter-stat-card">

            <div className="recruiter-stat-icon recruiter-stat-orange">
              <FaMapMarkerAlt />
            </div>

            <div className="recruiter-stat-content">

              <span>
                LOCATION
              </span>

              <strong className="recruiter-stat-text">
                {location}
              </strong>

              <small>
                Company / recruiter location
              </small>

            </div>

          </article>

        </section>

        {/* ====================================================
            MAIN TWO COLUMN AREA
        ==================================================== */}

        <section className="recruiter-dashboard-two-column">

          {/* ==================================================
              PROFILE INFORMATION
          ================================================== */}

          <article className="recruiter-panel recruiter-profile-panel">

            <div className="recruiter-panel-heading">

              <div>

                <span>
                  RECRUITER PROFILE
                </span>

                <h2>
                  Your professional information
                </h2>

              </div>

              <div className="recruiter-panel-heading-icon">
                <FaUserTie />
              </div>

            </div>

            <div className="recruiter-profile-details">

              {/* NAME */}

              <div className="recruiter-detail-row">

                <div className="recruiter-detail-icon">
                  <FaUser />
                </div>

                <div>

                  <span>
                    Recruiter Name
                  </span>

                  <strong>
                    {recruiterName}
                  </strong>

                </div>

              </div>

              {/* DESIGNATION */}

              <div className="recruiter-detail-row">

                <div className="recruiter-detail-icon">
                  <FaUserTie />
                </div>

                <div>

                  <span>
                    Designation
                  </span>

                  <strong>
                    {designation}
                  </strong>

                </div>

              </div>

              {/* USERNAME */}

              <div className="recruiter-detail-row">

                <div className="recruiter-detail-icon">
                  @
                </div>

                <div>

                  <span>
                    Username
                  </span>

                  <strong>
                    {username}
                  </strong>

                </div>

              </div>

              {/* EMAIL */}

              <div className="recruiter-detail-row">

                <div className="recruiter-detail-icon">
                  <FaEnvelope />
                </div>

                <div>

                  <span>
                    Email
                  </span>

                  <strong>
                    {email}
                  </strong>

                </div>

              </div>

              {/* PHONE */}

              <div className="recruiter-detail-row">

                <div className="recruiter-detail-icon">
                  <FaPhone />
                </div>

                <div>

                  <span>
                    Phone
                  </span>

                  <strong>
                    {phone}
                  </strong>

                </div>

              </div>

              {/* LOCATION */}

              <div className="recruiter-detail-row">

                <div className="recruiter-detail-icon">
                  <FaMapMarkerAlt />
                </div>

                <div>

                  <span>
                    Location
                  </span>

                  <strong>
                    {location}
                  </strong>

                </div>

              </div>

            </div>

          </article>

          {/* ==================================================
              QUICK ACTIONS
          ================================================== */}

          <article className="recruiter-panel recruiter-actions-panel">

            <div className="recruiter-panel-heading">

              <div>

                <span>
                  QUICK ACTIONS
                </span>

                <h2>
                  Recruitment workspace
                </h2>

              </div>

              <div className="recruiter-panel-heading-icon">
                <FaBriefcase />
              </div>

            </div>

            <div className="recruiter-action-list">

              {/* POST JOB */}

              <Link
                to="/recruiter/jobs/post"
                className="recruiter-action-card"
              >

                <div className="recruiter-action-icon recruiter-action-blue">
                  <FaPlus />
                </div>

                <div className="recruiter-action-content">

                  <strong>
                    Post a New Job
                  </strong>

                  <span>
                    Create and publish a new opportunity
                  </span>

                </div>

                <FaChevronRight className="recruiter-action-arrow" />

              </Link>

              {/* MANAGE JOBS */}

              <Link
                to="/recruiter/jobs"
                className="recruiter-action-card"
              >

                <div className="recruiter-action-icon recruiter-action-purple">
                  <FaBriefcase />
                </div>

                <div className="recruiter-action-content">

                  <strong>
                    Manage Jobs
                  </strong>

                  <span>
                    View and manage your job postings
                  </span>

                </div>

                <FaChevronRight className="recruiter-action-arrow" />

              </Link>

              {/* APPLICATIONS */}

              <Link
                to="/recruiter/applications"
                className="recruiter-action-card"
              >

                <div className="recruiter-action-icon recruiter-action-green">
                  <FaCheckCircle />
                </div>

                <div className="recruiter-action-content">

                  <strong>
                    Applications
                  </strong>

                  <span>
                    Review candidate applications
                  </span>

                </div>

                <FaChevronRight className="recruiter-action-arrow" />

              </Link>

              {/* CANDIDATES */}

              <Link
                to="/recruiter/candidates"
                className="recruiter-action-card"
              >

                <div className="recruiter-action-icon recruiter-action-orange">
                  <FaUserTie />
                </div>

                <div className="recruiter-action-content">

                  <strong>
                    Candidates
                  </strong>

                  <span>
                    Explore available candidate profiles
                  </span>

                </div>

                <FaChevronRight className="recruiter-action-arrow" />

              </Link>

            </div>

          </article>

        </section>

        {/* ====================================================
            COMPANY BIO
        ==================================================== */}

        <section className="recruiter-panel recruiter-bio-panel">

          <div className="recruiter-panel-heading">

            <div>

              <span>
                ABOUT THE RECRUITER / COMPANY
              </span>

              <h2>
                Professional profile summary
              </h2>

            </div>

            <div className="recruiter-panel-heading-icon">
              <FaBuilding />
            </div>

          </div>

          <p className="recruiter-bio-text">
            {bio}
          </p>

        </section>

        {/* ====================================================
            CONTACT & ONLINE PRESENCE
        ==================================================== */}

        <section className="recruiter-dashboard-two-column">

          {/* CONTACT */}

          <article className="recruiter-panel">

            <div className="recruiter-panel-heading">

              <div>

                <span>
                  CONTACT
                </span>

                <h2>
                  Contact information
                </h2>

              </div>

              <div className="recruiter-panel-heading-icon">
                <FaEnvelope />
              </div>

            </div>

            <div className="recruiter-contact-list">

              <div className="recruiter-contact-item">

                <div className="recruiter-contact-icon">
                  <FaEnvelope />
                </div>

                <div>

                  <span>
                    Email
                  </span>

                  <strong>
                    {email}
                  </strong>

                </div>

              </div>

              <div className="recruiter-contact-item">

                <div className="recruiter-contact-icon">
                  <FaPhone />
                </div>

                <div>

                  <span>
                    Phone
                  </span>

                  <strong>
                    {phone}
                  </strong>

                </div>

              </div>

              <div className="recruiter-contact-item">

                <div className="recruiter-contact-icon">
                  <FaMapMarkerAlt />
                </div>

                <div>

                  <span>
                    Location
                  </span>

                  <strong>
                    {location}
                  </strong>

                </div>

              </div>

            </div>

          </article>

          {/* ONLINE */}

          <article className="recruiter-panel">

            <div className="recruiter-panel-heading">

              <div>

                <span>
                  ONLINE PRESENCE
                </span>

                <h2>
                  Company links
                </h2>

              </div>

              <div className="recruiter-panel-heading-icon">
                <FaGlobe />
              </div>

            </div>

            <div className="recruiter-online-list">

              {/* WEBSITE */}

              {websiteUrl ? (
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="recruiter-online-card"
                >

                  <div className="recruiter-online-icon recruiter-online-blue">
                    <FaGlobe />
                  </div>

                  <div>

                    <strong>
                      Company Website
                    </strong>

                    <span>
                      Visit company website
                    </span>

                  </div>

                  <FaExternalLinkAlt />

                </a>
              ) : (
                <div className="recruiter-online-card recruiter-online-disabled">

                  <div className="recruiter-online-icon recruiter-online-blue">
                    <FaGlobe />
                  </div>

                  <div>

                    <strong>
                      Company Website
                    </strong>

                    <span>
                      No website added to profile
                    </span>

                  </div>

                </div>
              )}

              {/* LINKEDIN */}

              {linkedinUrl ? (
                <a
                  href={linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="recruiter-online-card"
                >

                  <div className="recruiter-online-icon recruiter-online-linkedin">
                    <FaLinkedin />
                  </div>

                  <div>

                    <strong>
                      LinkedIn
                    </strong>

                    <span>
                      Open LinkedIn profile
                    </span>

                  </div>

                  <FaExternalLinkAlt />

                </a>
              ) : (
                <div className="recruiter-online-card recruiter-online-disabled">

                  <div className="recruiter-online-icon recruiter-online-linkedin">
                    <FaLinkedin />
                  </div>

                  <div>

                    <strong>
                      LinkedIn
                    </strong>

                    <span>
                      No LinkedIn link added
                    </span>

                  </div>

                </div>
              )}

            </div>

          </article>

        </section>

        {/* ====================================================
            PROFILE COMPLETION CTA
        ==================================================== */}

        {profileCompletion < 100 && (
          <section className="recruiter-completion-card">

            <div className="recruiter-completion-icon">
              <FaCheckCircle />
            </div>

            <div className="recruiter-completion-content">

              <span>
                PROFILE IMPROVEMENT
              </span>

              <h2>
                Complete your recruiter profile
              </h2>

              <p>
                A complete recruiter profile gives
                candidates more information about
                your company and helps build trust.
              </p>

            </div>

            <Link
              to="/recruiter-profile"
              className="recruiter-primary-button"
            >
              Complete Profile
              <FaArrowRight />
            </Link>

          </section>
        )}

        {/* ====================================================
            FOOTER
        ==================================================== */}

        <RecruiterFooter />

      </main>
    </div>
  );
};

// ============================================================
// FOOTER COMPONENT
// ============================================================

const RecruiterFooter = () => {
  return (
    <footer className="recruiter-dashboard-footer">

      <div className="recruiter-footer-main">

        {/* BRAND */}

        <div className="recruiter-footer-brand">

          <Link
            to="/recruiter-dashboard"
            className="recruiter-footer-logo"
          >
            <img
              src="/images/TalentIQ_Logo.png"
              alt="TalentIQ"
            />
          </Link>

          <div>

            <strong>
              TalentIQ
            </strong>

            <p>
              AI-powered recruitment and
              talent management platform.
            </p>

          </div>

        </div>

        {/* FOOTER LINKS */}

        <div className="recruiter-footer-links">

          <Link to="/recruiter-dashboard">
            Dashboard
          </Link>

          <Link to="/recruiter/jobs">
            Jobs
          </Link>

          <Link to="/recruiter/applications">
            Applications
          </Link>

          <Link to="/recruiter/candidates">
            Candidates
          </Link>

          <Link to="/recruiter/profile">
            Profile
          </Link>

        </div>

      </div>

      {/* BOTTOM */}

      <div className="recruiter-footer-bottom">

        <span>
          © {new Date().getFullYear()} TalentIQ.
          All rights reserved.
        </span>

        <span>
          AI-powered recruitment platform
        </span>

      </div>

    </footer>
  );
};

export default RecruiterDashboard;