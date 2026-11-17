import React, {
  useEffect,
  useState,
} from "react";

import { Link } from "react-router-dom";

import {
  FaArrowLeft,
  FaFileAlt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaPhone,
  FaUserTie,
  FaGraduationCap,
  FaBriefcase,
  FaCode,
  FaBullseye,
  FaChartLine,
  FaSpinner,
  FaLightbulb,
} from "react-icons/fa";

import "../styles/ResumeHealth.css";

function ResumeHealth() {
  const [data, setData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const API_URL = (
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000"
  ).replace(/\/$/, "");

  // ==========================================================
  // TOKEN
  // ==========================================================

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("accessToken")
    );
  };

  // ==========================================================
  // FETCH RESUME HEALTH
  // ==========================================================

  const fetchResumeHealth =
    async () => {
      try {
        setLoading(true);
        setError("");

        const token =
          getToken();

        if (!token) {
          setError(
            "Please login to view your Resume Health."
          );

          return;
        }

        const response =
          await fetch(
            `${API_URL}/api/resume-health`,
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

        if (
          response.status === 401
        ) {
          throw new Error(
            "Your session has expired. Please login again."
          );
        }

        const result =
          await response.json();

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ||
            "Unable to load Resume Health."
          );
        }

        setData(
          result.data
        );
      } catch (err) {
        console.error(
          "Resume Health Error:",
          err
        );

        setError(
          err.message ||
          "Failed to fetch"
        );
      } finally {
        setLoading(false);
      }
    };

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    fetchResumeHealth();
  }, []);

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="resume-health-page">
        <div className="resume-health-loading">

          <FaSpinner className="resume-health-spinner" />

          <h2>
            Analyzing Your Resume Health...
          </h2>

          <p>
            TalentIQ is analyzing your
            profile, skills, experience,
            education and resume.
          </p>

        </div>
      </div>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (error) {
    return (
      <div className="resume-health-page">

        <div className="resume-health-error">

          <FaExclamationTriangle />

          <h2>
            Resume Health Unavailable
          </h2>

          <p>
            {error}
          </p>

          <div className="resume-health-error-actions">

            <button
              onClick={
                fetchResumeHealth
              }
              className="resume-health-primary-btn"
            >
              Try Again
            </button>

            <Link
              to="/"
              className="resume-health-secondary-btn"
            >
              Back to Home
            </Link>

          </div>

        </div>

      </div>
    );
  }

  // ==========================================================
  // SAFETY
  // ==========================================================

  if (!data) {
    return null;
  }

  const {
    score = 0,
    label = "Needs Improvement",
    candidate = {},
    resume = {},
    profile = {},
    skills = {},
    scores = {},
    sections = [],
    improvements = [],
    summary = {},
  } = data;

  // ==========================================================
  // SCORE CLASS
  // ==========================================================

  const getScoreClass = () => {
    if (score >= 85) {
      return "excellent";
    }

    if (score >= 70) {
      return "strong";
    }

    if (score >= 50) {
      return "good";
    }

    return "needs-improvement";
  };

  return (
    <div className="resume-health-page">

      {/* ====================================================
          HERO
      ==================================================== */}

      <section className="resume-health-hero">

        <div className="resume-health-decoration one" />
        <div className="resume-health-decoration two" />

        <div className="resume-health-hero-content">

          <Link
            to="/"
            className="resume-health-back"
          >
            <FaArrowLeft />
            Back to Home
          </Link>

          <span className="resume-health-eyebrow">
            TALENTIQ AI
          </span>

          <h1>
            Resume{" "}
            <span>Health</span>
          </h1>

          <p>
            Get a real-time view of your
            resume and career profile
            strength using your TalentIQ
            account data.
          </p>

        </div>

      </section>

      {/* ====================================================
          MAIN
      ==================================================== */}

      <main className="resume-health-main">

        {/* ==================================================
            CANDIDATE
        ================================================== */}

        <section className="resume-health-welcome">

          <div>

            <span>
              YOUR RESUME PROFILE
            </span>

            <h2>
              {candidate.name ||
                "TalentIQ Candidate"}
            </h2>

            <p>
              {candidate.targetRole
                ? `Target role: ${candidate.targetRole}`
                : "Set your target role in your profile to improve your Resume Health."}
            </p>

          </div>

          <div className="resume-health-welcome-icon">
            <FaFileAlt />
          </div>

        </section>

        {/* ==================================================
            SCORE
        ================================================== */}

        <section className="resume-health-top-grid">

          <div className="resume-health-score-card">

            <div className="resume-health-card-heading">

              <div>

                <span>
                  RESUME HEALTH SCORE
                </span>

                <h2>
                  {label}
                </h2>

              </div>

              <FaChartLine />

            </div>

            <div
              className={`resume-health-score-circle ${getScoreClass()}`}
            >

              <strong>
                {score}
              </strong>

              <span>
                /100
              </span>

            </div>

            <p>
              Your score is calculated from
              your profile completeness,
              skills, professional content,
              resume availability and career
              target.
            </p>

          </div>

          {/* ==================================================
              RESUME STATUS
          ================================================== */}

          <div className="resume-health-file-card">

            <div className="resume-health-file-icon">
              <FaFileAlt />
            </div>

            <span>
              RESUME STATUS
            </span>

            <h2>
              {resume.available
                ? "Resume Available"
                : "Resume Missing"}
            </h2>

            {resume.available ? (
              <>
                <p>
                  {resume.originalName ||
                    "Resume uploaded to TalentIQ"}
                </p>

                {resume.uploadedAt && (
                  <small>
                    Uploaded{" "}
                    {new Date(
                      resume.uploadedAt
                    ).toLocaleDateString()}
                  </small>
                )}

                <div className="resume-health-status-success">
                  <FaCheckCircle />
                  Ready for AI analysis
                </div>
              </>
            ) : (
              <>
                <p>
                  Upload your resume from
                  your Profile to improve
                  your Resume Health.
                </p>

                <Link
                  to="/profile"
                  className="resume-health-primary-btn"
                >
                  Upload Resume
                </Link>
              </>
            )}

          </div>

        </section>

        {/* ==================================================
            SCORE BREAKDOWN
        ================================================== */}

        <section className="resume-health-section">

          <div className="resume-health-section-heading">

            <div className="resume-health-section-icon">
              <FaChartLine />
            </div>

            <div>
              <span>
                SCORE BREAKDOWN
              </span>

              <h2>
                Your Resume Health Analysis
              </h2>
            </div>

          </div>

          <div className="resume-health-score-grid">

            <div className="resume-health-mini-score">
              <span>
                Profile
              </span>

              <strong>
                {scores.completeness || 0}%
              </strong>
            </div>

            <div className="resume-health-mini-score">
              <span>
                Skills
              </span>

              <strong>
                {scores.skills || 0}%
              </strong>
            </div>

            <div className="resume-health-mini-score">
              <span>
                Content
              </span>

              <strong>
                {scores.content || 0}%
              </strong>
            </div>

            <div className="resume-health-mini-score">
              <span>
                Resume File
              </span>

              <strong>
                {scores.resumeFile || 0}%
              </strong>
            </div>

            <div className="resume-health-mini-score">
              <span>
                Career Target
              </span>

              <strong>
                {scores.careerTarget || 0}%
              </strong>
            </div>

          </div>

        </section>

        {/* ==================================================
            PROFILE
        ================================================== */}

        <section className="resume-health-section">

          <div className="resume-health-section-heading">

            <div className="resume-health-section-icon">
              <FaUserTie />
            </div>

            <div>
              <span>
                PROFILE
              </span>

              <h2>
                Professional Profile
              </h2>
            </div>

          </div>

          <div className="resume-health-info-grid">

            <div>
              <span>
                Full Name
              </span>

              <strong>
                {candidate.name ||
                  "Not available"}
              </strong>
            </div>

            <div>
              <span>
                Email
              </span>

              <strong>
                {candidate.email ||
                  "Not available"}
              </strong>
            </div>

            <div>
              <span>
                Phone
              </span>

              <strong>
                {profile.phone ||
                  "Not added"}
              </strong>
            </div>

            <div>
              <span>
                Location
              </span>

              <strong>
                {profile.location ||
                  "Not added"}
              </strong>
            </div>

            <div>
              <span>
                Headline
              </span>

              <strong>
                {profile.headline ||
                  "Not added"}
              </strong>
            </div>

            <div>
              <span>
                Profile Completion
              </span>

              <strong>
                {profile.completion || 0}%
              </strong>
            </div>

          </div>

        </section>

        {/* ==================================================
            SKILLS
        ================================================== */}

        <section className="resume-health-section">

          <div className="resume-health-section-heading">

            <div className="resume-health-section-icon">
              <FaCode />
            </div>

            <div>
              <span>
                SKILLS
              </span>

              <h2>
                Technical Skills
              </h2>
            </div>

          </div>

          {skills.list &&
          skills.list.length > 0 ? (

            <>

              <div className="resume-health-skills-header">

                <strong>
                  {skills.total}
                </strong>

                <span>
                  skills detected
                </span>

              </div>

              <div className="resume-health-skills">

                {skills.list.map(
                  (skill, index) => (
                    <span
                      key={index}
                      className="resume-health-skill"
                    >
                      <FaCheckCircle />
                      {skill}
                    </span>
                  )
                )}

              </div>

            </>

          ) : (

            <div className="resume-health-empty">

              <FaCode />

              <p>
                No technical skills have
                been added to your profile.
              </p>

              <Link
                to="/profile"
                className="resume-health-primary-btn"
              >
                Update Profile
              </Link>

            </div>

          )}

        </section>

        {/* ==================================================
            EDUCATION + EXPERIENCE
        ================================================== */}

        <section className="resume-health-two-column">

          <div className="resume-health-section">

            <div className="resume-health-section-heading">

              <div className="resume-health-section-icon">
                <FaGraduationCap />
              </div>

              <div>
                <span>
                  EDUCATION
                </span>

                <h2>
                  Education
                </h2>
              </div>

            </div>

            <div className="resume-health-detail-card">

              <strong>
                {profile.degree ||
                  "Education not added"}
              </strong>

              <p>
                {profile.college ||
                  "Institution not added"}
              </p>

              {profile.graduationYear && (
                <small>
                  Graduation:{" "}
                  {profile.graduationYear}
                </small>
              )}

            </div>

          </div>

          <div className="resume-health-section">

            <div className="resume-health-section-heading">

              <div className="resume-health-section-icon">
                <FaBriefcase />
              </div>

              <div>
                <span>
                  EXPERIENCE
                </span>

                <h2>
                  Experience
                </h2>
              </div>

            </div>

            <div className="resume-health-detail-card">

              <strong>
                {profile.jobTitle ||
                  "Experience not added"}
              </strong>

              <p>
                {profile.company ||
                  "Company not added"}
              </p>

              <small>
                {profile.yearsOfExperience || 0}{" "}
                years of experience
              </small>

            </div>

          </div>

        </section>

        {/* ==================================================
            SECTIONS
        ================================================== */}

        <section className="resume-health-section">

          <div className="resume-health-section-heading">

            <div className="resume-health-section-icon">
              <FaCheckCircle />
            </div>

            <div>
              <span>
                SECTION ANALYSIS
              </span>

              <h2>
                Resume Profile Sections
              </h2>
            </div>

          </div>

          <div className="resume-health-section-list">

            {sections.map(
              (section) => (
                <div
                  key={section.key}
                  className={
                    section.completed
                      ? "resume-health-section-item complete"
                      : "resume-health-section-item incomplete"
                  }
                >

                  <div className="resume-health-section-status">

                    {section.completed ? (
                      <FaCheckCircle />
                    ) : (
                      <FaExclamationTriangle />
                    )}

                  </div>

                  <div>

                    <strong>
                      {section.title}
                    </strong>

                    <p>
                      {section.description}
                    </p>

                  </div>

                  <span>
                    {section.status}
                  </span>

                </div>
              )
            )}

          </div>

        </section>

        {/* ==================================================
            IMPROVEMENTS
        ================================================== */}

        <section className="resume-health-section">

          <div className="resume-health-section-heading">

            <div className="resume-health-section-icon">
              <FaLightbulb />
            </div>

            <div>
              <span>
                TALENTIQ RECOMMENDATIONS
              </span>

              <h2>
                Improve Your Resume Health
              </h2>
            </div>

          </div>

          {improvements.length > 0 ? (

            <div className="resume-health-improvements">

              {improvements.map(
                (item, index) => (
                  <div
                    key={index}
                    className={`resume-health-improvement ${item.priority}`}
                  >

                    <FaLightbulb />

                    <div>

                      <strong>
                        {item.title}
                      </strong>

                      <p>
                        {item.description}
                      </p>

                    </div>

                  </div>
                )
              )}

            </div>

          ) : (

            <div className="resume-health-success-card">

              <FaCheckCircle />

              <div>

                <strong>
                  Your resume profile looks great!
                </strong>

                <p>
                  Keep your profile,
                  skills and resume updated
                  as your career develops.
                </p>

              </div>

            </div>

          )}

        </section>

        {/* ==================================================
            CAREER TARGET
        ================================================== */}

        <section className="resume-health-target-card">

          <div className="resume-health-target-icon">
            <FaBullseye />
          </div>

          <div>

            <span>
              CAREER TARGET
            </span>

            <h2>
              {candidate.targetRole ||
                "Target role not set"}
            </h2>

            <p>
              {candidate.preferredLocation
                ? `Preferred location: ${candidate.preferredLocation}`
                : "Set your preferred location to improve TalentIQ job matching."}
            </p>

          </div>

          <Link
            to="/profile"
            className="resume-health-primary-btn"
          >
            Update Profile
          </Link>

        </section>

        {/* ==================================================
            SUMMARY
        ================================================== */}

        <section className="resume-health-final-card">

          <FaChartLine />

          <div>

            <span>
              TALENTIQ AI SUMMARY
            </span>

            <h2>
              {summary.recommendation ||
                "Keep improving your career profile."}
            </h2>

            <p>
              {summary.completedSections || 0}
              {" "}of{" "}
              {summary.totalSections || 0}
              {" "}profile sections are
              currently complete.
            </p>

          </div>

          <Link
            to="/find-jobs"
            className="resume-health-primary-btn"
          >
            Explore Jobs
          </Link>

        </section>

      </main>

    </div>
  );
}

export default ResumeHealth;