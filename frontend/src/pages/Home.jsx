import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  FaLinkedinIn,
  FaGithub,
  FaInstagram,
  FaMagnifyingGlass,
  FaLocationDot,
  FaArrowRight,
  FaWandMagicSparkles,
  FaUser,
  FaFileLines,
  FaBullseye,
} from "react-icons/fa6";

import { FaTwitter } from "react-icons/fa";

import "../styles/home.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const Home = () => {
  const navigate = useNavigate();

  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");

  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);

  // ============================================================
  // AUTH TOKEN
  // ============================================================

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("accessToken") ||
      sessionStorage.getItem("token")
    );
  };

  // ============================================================
  // FETCH REAL JOB DATA
  // ============================================================

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setJobsLoading(true);

        const response = await fetch(
          `${API_URL}/api/jobs`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Unable to load jobs"
          );
        }

        const jobList = Array.isArray(data)
          ? data
          : Array.isArray(data.jobs)
          ? data.jobs
          : Array.isArray(data.data)
          ? data.data
          : [];

        setJobs(jobList);
      } catch (error) {
        console.error(
          "Home jobs fetch error:",
          error
        );

        setJobs([]);
      } finally {
        setJobsLoading(false);
      }
    };

    fetchJobs();
  }, []);

  // ============================================================
  // REAL JOB STATISTICS
  // ============================================================

  const jobStatistics = useMemo(() => {
    const totalJobs = jobs.length;

    const companies = new Set();

    jobs.forEach((job) => {
      const company =
        job.companyName ||
        job.company ||
        job.recruiterCompany ||
        job.recruiter?.companyName ||
        job.recruiter?.company;

      if (company) {
        companies.add(
          typeof company === "string"
            ? company.trim().toLowerCase()
            : String(company)
        );
      }
    });

    return {
      totalJobs,
      totalCompanies: companies.size,
    };
  }, [jobs]);

  // ============================================================
  // FORMAT STATISTICS
  // ============================================================

  const formatStat = (number, fallback) => {
    if (!number || number <= 0) {
      return fallback;
    }

    if (number >= 1000) {
      return `${(number / 1000).toFixed(
        number >= 10000 ? 0 : 1
      )}K+`;
    }

    return `${number}+`;
  };

  // ============================================================
  // SEARCH JOBS
  // ============================================================

  const handleSearch = (e) => {
    e.preventDefault();

    const params = new URLSearchParams();

    if (keyword.trim()) {
      params.set(
        "keyword",
        keyword.trim()
      );
    }

    if (location.trim()) {
      params.set(
        "location",
        location.trim()
      );
    }

    const queryString = params.toString();

    navigate(
      queryString
        ? `/find-jobs?${queryString}`
        : "/find-jobs"
    );
  };

  // ============================================================
  // AI RECOMMENDATIONS
  // ============================================================

  const handleAIRecommendations = () => {
    const token = getToken();

    if (!token) {
      navigate("/login", {
        state: {
          from: "/ai-recommendations",
        },
      });

      return;
    }

    navigate("/ai-recommendations");
  };

  // ============================================================
  // FEATURED REAL JOB
  // ============================================================

  const featuredJob = jobs.length > 0
    ? jobs[0]
    : null;

  const featuredJobTitle =
    featuredJob?.title ||
    featuredJob?.role ||
    featuredJob?.position ||
    "Software Engineer";

  const featuredCompany =
    featuredJob?.companyName ||
    featuredJob?.company ||
    featuredJob?.recruiterCompany ||
    "Technology Company";

  const featuredSkills =
    Array.isArray(featuredJob?.skills)
      ? featuredJob.skills.slice(0, 4)
      : Array.isArray(featuredJob?.requiredSkills)
      ? featuredJob.requiredSkills.slice(0, 4)
      : [
          "React",
          "Node.js",
          "MongoDB",
          "JavaScript",
        ];

  return (
    <div className="home-page">

      {/* ============================================================
          HERO
      ============================================================ */}

      <section className="hero-section">

        <div className="hero-content">

          <div className="hero-badge">
            <span className="badge-dot"></span>
            AI-Powered Recruitment Platform
          </div>

          <h1>
            Find the right job
            <br />
            <span>with AI.</span>
          </h1>

          <p className="hero-description">
            TalentIQ connects candidates with the right
            opportunities using AI-powered job matching,
            resume analysis and intelligent job search.
          </p>

          {/* ========================================================
              REAL JOB SEARCH
          ======================================================== */}

          <form
            className="hero-search"
            onSubmit={handleSearch}
          >

            <div className="search-field">

              <span className="search-icon">
                <FaMagnifyingGlass />
              </span>

              <input
                type="text"
                placeholder="Job title, skills or keywords"
                value={keyword}
                onChange={(e) =>
                  setKeyword(e.target.value)
                }
              />

            </div>

            <div className="location-field">

              <span className="location-icon">
                <FaLocationDot />
              </span>

              <input
                type="text"
                placeholder="Location"
                value={location}
                onChange={(e) =>
                  setLocation(e.target.value)
                }
              />

            </div>

            <button
              type="submit"
              className="search-button"
            >
              Search Jobs
            </button>

          </form>

          {/* HERO BUTTONS */}

          <div className="hero-buttons">

            <Link
              to="/find-jobs"
              className="primary-hero-button"
            >
              Explore Jobs
              <FaArrowRight />
            </Link>

            <button
              type="button"
              className="secondary-hero-button"
              onClick={handleAIRecommendations}
            >
              <FaWandMagicSparkles />
              Get AI Recommendations
            </button>

          </div>

          {/* REAL STATISTICS */}

          <div className="hero-stats">

            <div className="hero-stat">

              <strong>
                {jobsLoading
                  ? "..."
                  : formatStat(
                      jobStatistics.totalJobs,
                      "0"
                    )}
              </strong>

              <span>Jobs</span>

            </div>

            <div className="stat-divider"></div>

            <div className="hero-stat">

              <strong>
                5K+
              </strong>

              <span>Candidates</span>

            </div>

            <div className="stat-divider"></div>

            <div className="hero-stat">

              <strong>
                {jobsLoading
                  ? "..."
                  : formatStat(
                      jobStatistics.totalCompanies,
                      "0"
                    )}
              </strong>

              <span>Companies</span>

            </div>

          </div>

        </div>

        {/* ============================================================
            AI VISUAL
        ============================================================ */}

        <div className="hero-visual">

          <div className="ai-card">

            <div className="ai-card-header">

              <div className="ai-icon">
                <FaWandMagicSparkles />
              </div>

              <div>
                <h3>TalentIQ AI</h3>
                <p>Smart Job Matching</p>
              </div>

              <span className="ai-status">
                ●
              </span>

            </div>

            <div className="match-title">
              {featuredJob
                ? "Featured opportunity"
                : "Your job match"}
            </div>

            <div className="match-score">

              <div className="score-circle">
                <span>
                  AI
                </span>
              </div>

              <div>

                <strong>
                  {featuredJob
                    ? "Live Job Match"
                    : "AI Matching"}
                </strong>

                <p>
                  Based on skills & career goals
                </p>

              </div>

            </div>

            {/* REAL JOB FROM DATABASE */}

            <div className="match-job">

              <div className="company-logo">
                {String(
                  featuredCompany
                )
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="match-job-info">

                <h4>
                  {featuredJobTitle}
                </h4>

                <p>
                  {featuredCompany}
                </p>

              </div>

              <button
                type="button"
                className="match-arrow"
                onClick={() =>
                  navigate("/find-jobs")
                }
                aria-label="View jobs"
              >
                <FaArrowRight />
              </button>

            </div>

            <div className="skill-list">

              {featuredSkills.map(
                (skill, index) => (
                  <span key={index}>
                    {typeof skill === "string"
                      ? skill
                      : skill?.name ||
                        skill?.label ||
                        "Skill"}
                  </span>
                )
              )}

            </div>

          </div>

          {/* FLOATING CARD 1 */}

          <div className="floating-card floating-card-one">

            <span>
              <FaBullseye />
            </span>

            <div>
              <strong>
                AI Job Matching
              </strong>

              <small>
                Personalized opportunities
              </small>
            </div>

          </div>

          {/* FLOATING CARD 2 */}

          <div className="floating-card floating-card-two">

            <span>
              <FaFileLines />
            </span>

            <div>
              <strong>
                Resume Analysis
              </strong>

              <small>
                Improve your profile
              </small>
            </div>

          </div>

        </div>

      </section>

      {/* ============================================================
          FEATURES
      ============================================================ */}

      <section className="features-section">

        <div className="section-heading">

          <span>POWERED BY AI</span>

          <h2>
            Everything you need to
            <br />
            <strong>land your next job</strong>
          </h2>

          <p>
            TalentIQ brings job search, resume optimization
            and intelligent recommendations together in
            one platform.
          </p>

        </div>

        <div className="features-grid">

          <div className="feature-card">

            <div className="feature-icon blue">
              <FaWandMagicSparkles />
            </div>

            <h3>
              AI Job Recommendations
            </h3>

            <p>
              Get personalized job recommendations
              based on your skills, experience and
              career interests.
            </p>

            <button
              type="button"
              className="feature-link"
              onClick={handleAIRecommendations}
            >
              Explore Recommendations
              <FaArrowRight />
            </button>

          </div>

          <div className="feature-card">

            <div className="feature-icon purple">
              <FaMagnifyingGlass />
            </div>

            <h3>
              AI Job Search
            </h3>

            <p>
              Search jobs using natural language and
              let AI understand what kind of opportunity
              you are looking for.
            </p>

            <Link
              to="/ai-job-search"
              className="feature-link"
            >
              Try AI Search
              <FaArrowRight />
            </Link>

          </div>

          <div className="feature-card">

            <div className="feature-icon green">
              <FaFileLines />
            </div>

            <h3>
              AI Resume Analysis
            </h3>

            <p>
              Analyze your resume against a job
              description and discover your compatibility
              score and missing skills.
            </p>

            <Link
              to="/resume"
              className="feature-link"
            >
              Analyze Resume
              <FaArrowRight />
            </Link>

          </div>

        </div>

      </section>

      {/* ============================================================
          HOW IT WORKS
      ============================================================ */}

      <section className="how-section">

        <div className="section-heading">

          <span>HOW IT WORKS</span>

          <h2>
            Your next opportunity
            <br />
            is <strong>three steps away</strong>
          </h2>

        </div>

        <div className="steps-container">

          <div className="step-card">

            <div className="step-number">
              01
            </div>

            <div className="step-icon">
              <FaUser />
            </div>

            <h3>
              Create Your Profile
            </h3>

            <p>
              Build your professional profile with
              your skills, experience and career goals.
            </p>

          </div>

          <div className="step-line"></div>

          <div className="step-card">

            <div className="step-number">
              02
            </div>

            <div className="step-icon">
              <FaFileLines />
            </div>

            <h3>
              Upload Your Resume
            </h3>

            <p>
              Upload your resume and let TalentIQ
              analyze your skills and experience.
            </p>

          </div>

          <div className="step-line"></div>

          <div className="step-card">

            <div className="step-number">
              03
            </div>

            <div className="step-icon">
              <FaBullseye />
            </div>

            <h3>
              Get Matched
            </h3>

            <p>
              Receive AI-powered job recommendations
              that match your career profile.
            </p>

          </div>

        </div>

      </section>

      {/* ============================================================
          CANDIDATE CTA
      ============================================================ */}

      <section className="candidate-cta">

        <div className="cta-content">

          <span className="cta-badge">
            <FaWandMagicSparkles />
            TALENTIQ AI
          </span>

          <h2>
            Let AI find your
            <br />
            <span>perfect opportunity.</span>
          </h2>

          <p>
            Stop searching through thousands of jobs.
            Let TalentIQ understand your profile and
            find opportunities that actually match you.
          </p>

          <button
            type="button"
            className="cta-button"
            onClick={handleAIRecommendations}
          >
            Start Your Career Journey
            <FaArrowRight />
          </button>

        </div>

      </section>

      {/* ============================================================
          RECRUITER CTA
      ============================================================ */}

      <section className="recruiter-section">

        <div>

          <span className="recruiter-label">
            FOR RECRUITERS
          </span>

          <h2>
            Find the right talent
            <br />
            <span>faster with AI.</span>
          </h2>

          <p>
            Post jobs, discover qualified candidates and
            manage your recruitment process from one
            intelligent platform.
          </p>

        </div>

        <Link
          to="/recruiter"
          className="recruiter-button"
        >
          Explore Recruiter Portal
          <FaArrowRight />
        </Link>

      </section>

      {/* ============================================================
          FOOTER
      ============================================================ */}

      <footer className="findjobs-footer">

        <div className="footer-content">

          {/* BRAND */}

          <div className="footer-brand">

            <div className="footer-brand-logo">

              <div className="footer-logo-box">

                <img
                  src="/images/TalentIQ_Logo.png"
                  alt="TalentIQ"
                />

              </div>

              <strong>
                Talent<span>IQ</span>
              </strong>

            </div>

            <p>
              TalentIQ is an AI-powered career
              platform designed to help candidates
              discover the right opportunities,
              improve their resumes and build
              successful careers.
            </p>

            {/* SOCIAL ICONS */}

            <div className="footer-socials">

              <a
                href="https://www.linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                title="LinkedIn"
              >
                <FaLinkedinIn />
              </a>

              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                title="GitHub"
              >
                <FaGithub />
              </a>

              <a
                href="https://www.instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                title="Instagram"
              >
                <FaInstagram />
              </a>

              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X / Twitter"
                title="X / Twitter"
              >
                <FaTwitter />
              </a>

            </div>

          </div>

          {/* FOR CANDIDATES */}

          <div className="footer-column">

            <h4>
              For Candidates
            </h4>

            <Link to="/find-jobs">
              Find Jobs
            </Link>

            <Link to="/ai-recommendations">
              AI Recommendations
            </Link>

            <Link to="/resume">
              Resume Builder
            </Link>

            <Link to="/applications">
              My Applications
            </Link>

            <Link to="/profile">
              My Profile
            </Link>

          </div>

          {/* TALENTIQ AI */}

          <div className="footer-column">

            <h4>
              TalentIQ AI
            </h4>

            <Link to="/ai-job-search">
              AI Job Search
            </Link>

            <Link to="/career-insights">
              Career Insights
            </Link>

            <Link to="/skill-gap-analysis">
              Skill Gap Analysis
            </Link>

            <Link to="/career-copilot">
              Career Copilot
            </Link>

            <Link to="/resume-health">
              Resume Health
            </Link>

          </div>

          {/* SUPPORT */}

          <div className="footer-column">

            <h4>
              Support
            </h4>

            <Link to="/help-center">
              Help Center
            </Link>

            <Link to="/contact">
              Contact Us
            </Link>

            <Link to="/privacy-policy">
              Privacy Policy
            </Link>

            <Link to="/terms-conditions">
              Terms & Conditions
            </Link>

            <Link to="/about-talentiq">
              About TalentIQ
            </Link>

          </div>

        </div>

        {/* FOOTER BOTTOM */}

        <div className="footer-bottom">

          <span>
            © 2026 TalentIQ. All rights reserved.
          </span>

          <span>
            Built with AI to help you find the right career.
          </span>

        </div>

      </footer>

    </div>
  );
};

export default Home;