import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  FaArrowLeft,
  FaChartLine,
  FaBriefcase,
  FaGraduationCap,
  FaLightbulb,
  FaCheckCircle,
  FaBullseye,
  FaCode,
  FaArrowUp,
  FaSpinner,
} from "react-icons/fa";

import "../styles/CareerInsights.css";

function CareerInsights() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_URL = (
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000"
  ).replace(/\/$/, "");

  useEffect(() => {
    const fetchCareerInsights = async () => {
      try {
        setLoading(true);
        setError("");

        const token =
          localStorage.getItem("token") ||
          localStorage.getItem("talentIQToken") ||
          localStorage.getItem("authToken");

        if (!token) {
          setError(
            "Please login to view your career insights."
          );
          return;
        }

        const response = await fetch(
          `${API_URL}/api/career-insights`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const result = await response.json();

        console.log(
          "Career Insights API Response:",
          result
        );

        if (!response.ok || !result.success) {
          throw new Error(
            result.message ||
              "Unable to load career insights."
          );
        }

        if (!result.data) {
          throw new Error(
            "Career insights data was not returned by the server."
          );
        }

        setData(result.data);
      } catch (err) {
        console.error(
          "Career Insights Error:",
          err
        );

        setError(
          err.message ||
            "Unable to load career insights."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCareerInsights();
  }, [API_URL]);

  /*
  ==========================================================
  LOADING
  ==========================================================
  */

  if (loading) {
    return (
      <div className="career-insights-page">
        <div className="career-loading">
          <FaSpinner className="career-spinner" />

          <h2>
            Generating your career insights...
          </h2>

          <p>
            TalentIQ is analyzing your profile,
            skills and applications.
          </p>
        </div>
      </div>
    );
  }

  /*
  ==========================================================
  ERROR
  ==========================================================
  */

  if (error) {
    return (
      <div className="career-insights-page">
        <div className="career-error-card">
          <FaChartLine />

          <h2>Career Insights</h2>

          <p>{error}</p>

          <Link
            to="/login"
            className="career-primary-button"
          >
            Login to Continue
          </Link>
        </div>
      </div>
    );
  }

  /*
  ==========================================================
  DATA SAFETY
  ==========================================================
  */

  if (!data) {
    return (
      <div className="career-insights-page">
        <div className="career-error-card">
          <FaChartLine />

          <h2>No Career Insights Available</h2>

          <p>
            TalentIQ could not find career insight
            information for your account.
          </p>

          <Link
            to="/"
            className="career-primary-button"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  /*
  ==========================================================
  SAFE DATA
  ==========================================================
  */

  const candidate = data.candidate || {};

  const careerScore = data.careerScore || {
    score: 0,
    label: "Needs Improvement",
  };

  const recommendation =
    data.recommendation || {
      title: "Complete your profile",
      description:
        "Add more information to your TalentIQ profile.",
      direction:
        candidate.targetRole ||
        "Software Developer",
    };

  const applications =
    data.applications || {
      total: 0,
      pending: 0,
      shortlisted: 0,
      selected: 0,
    };

  const skillGaps = Array.isArray(
    data.skillGaps
  )
    ? data.skillGaps
    : [];

  const learningRecommendations =
    Array.isArray(
      data.learningRecommendations
    )
      ? data.learningRecommendations
      : [];

  const popularRoles = Array.isArray(
    data.popularRoles
  )
    ? data.popularRoles
    : [];

  const insights = Array.isArray(
    data.insights
  )
    ? data.insights
    : [];

  const candidateSkills = Array.isArray(
    candidate.skills
  )
    ? candidate.skills
    : [];

  /*
  ==========================================================
  RENDER
  ==========================================================
  */

  return (
    <div className="career-insights-page">

      {/* HERO */}

      <section className="career-insights-hero">

        <div className="career-hero-decoration career-decoration-one" />

        <div className="career-hero-decoration career-decoration-two" />

        <div className="career-hero-content">

          <Link
            to="/"
            className="career-back-link"
          >
            <FaArrowLeft />
            Back to Home
          </Link>

          <span className="career-eyebrow">
            TALENTIQ AI
          </span>

          <h1>
            Career <span>Insights</span>
          </h1>

          <p>
            Understand your career readiness,
            discover skill gaps and find the
            opportunities that match your goals.
          </p>

        </div>

      </section>

      {/* MAIN */}

      <main className="career-insights-main">

        {/* WELCOME */}

        <section className="career-welcome-card">

          <div>

            <span className="career-small-label">
              YOUR CAREER PROFILE
            </span>

            <h2>
              Welcome,{" "}
              {candidate.name || "Candidate"}
            </h2>

            <p>
              Your current target role is{" "}
              <strong>
                {candidate.targetRole ||
                  "Not specified"}
              </strong>
              .
            </p>

          </div>

          <div className="career-target-icon">
            <FaBullseye />
          </div>

        </section>

        {/* SCORE + RECOMMENDATION */}

        <section className="career-top-grid">

          <div className="career-score-card">

            <div className="career-card-header">

              <div>

                <span className="career-card-label">
                  CAREER READINESS
                </span>

                <h2>
                  {careerScore.label}
                </h2>

              </div>

              <div className="career-card-icon">
                <FaChartLine />
              </div>

            </div>

            <div className="career-score-circle">

              <div>

                <strong>
                  {careerScore.score}
                </strong>

                <span>/100</span>

              </div>

            </div>

            <p>
              Your score is based on your
              profile, technical skills and
              application activity.
            </p>

          </div>

          <div className="career-recommendation-card">

            <div className="career-card-icon">
              <FaLightbulb />
            </div>

            <span className="career-card-label">
              TALENTIQ RECOMMENDATION
            </span>

            <h2>
              {recommendation.title}
            </h2>

            <p>
              {recommendation.description}
            </p>

            <div className="career-direction">

              <span>
                Recommended direction
              </span>

              <strong>
                {recommendation.direction}
              </strong>

            </div>

          </div>

        </section>

        {/* INSIGHT CARDS */}

        <section className="career-stat-grid">

          {insights.map((item, index) => (

            <div
              className="career-stat-card"
              key={index}
            >

              <div className="career-stat-icon">

                {index === 0 && (
                  <FaChartLine />
                )}

                {index === 1 && (
                  <FaCode />
                )}

                {index === 2 && (
                  <FaBriefcase />
                )}

                {index === 3 && (
                  <FaCheckCircle />
                )}

              </div>

              <div>

                <span>
                  {item.title}
                </span>

                <strong>
                  {item.value}
                </strong>

                <p>
                  {item.description}
                </p>

              </div>

            </div>

          ))}

        </section>

        {/* SKILLS */}

        <section className="career-section-card">

          <div className="career-section-heading">

            <div className="career-section-icon">
              <FaCode />
            </div>

            <div>

              <span>
                YOUR SKILLS
              </span>

              <h2>
                Technical Skill Profile
              </h2>

            </div>

          </div>

          {candidateSkills.length > 0 ? (

            <div className="career-skills-list">

              {candidateSkills.map(
                (skill, index) => (

                  <span
                    className="career-skill-tag"
                    key={index}
                  >

                    <FaCheckCircle />

                    {skill}

                  </span>

                )
              )}

            </div>

          ) : (

            <div className="career-empty-state">

              <p>
                No technical skills have been
                detected yet. Add skills to your
                profile to improve your insights.
              </p>

            </div>

          )}

        </section>

        {/* APPLICATIONS */}

        <section className="career-section-card">

          <div className="career-section-heading">

            <div className="career-section-icon">
              <FaBriefcase />
            </div>

            <div>

              <span>
                JOB SEARCH ACTIVITY
              </span>

              <h2>
                Application Overview
              </h2>

            </div>

          </div>

          <div className="career-application-grid">

            <div>

              <span>
                Total Applications
              </span>

              <strong>
                {applications.total}
              </strong>

            </div>

            <div>

              <span>
                Pending
              </span>

              <strong>
                {applications.pending}
              </strong>

            </div>

            <div>

              <span>
                Shortlisted
              </span>

              <strong>
                {applications.shortlisted}
              </strong>

            </div>

            <div>

              <span>
                Selected
              </span>

              <strong>
                {applications.selected}
              </strong>

            </div>

          </div>

        </section>

        {/* SKILL GAPS + LEARNING */}

        <section className="career-two-column">

          {/* SKILL GAPS */}

          <div className="career-section-card">

            <div className="career-section-heading">

              <div className="career-section-icon">
                <FaArrowUp />
              </div>

              <div>

                <span>
                  SKILL GAP ANALYSIS
                </span>

                <h2>
                  Skills to Improve
                </h2>

              </div>

            </div>

            {skillGaps.length > 0 ? (

              <div className="career-gap-list">

                {skillGaps.map(
                  (item, index) => (

                    <div
                      className="career-gap-item"
                      key={index}
                    >

                      <span>
                        {item.skill}
                      </span>

                      <small>
                        {item.demand} job
                        {item.demand > 1
                          ? "s"
                          : ""}
                      </small>

                    </div>

                  )
                )}

              </div>

            ) : (

              <div className="career-empty-state">

                <p>
                  No major skill gaps detected
                  from the current job data.
                </p>

              </div>

            )}

          </div>

          {/* LEARNING */}

          <div className="career-section-card">

            <div className="career-section-heading">

              <div className="career-section-icon">
                <FaGraduationCap />
              </div>

              <div>

                <span>
                  LEARNING PLAN
                </span>

                <h2>
                  Recommended Skills
                </h2>

              </div>

            </div>

            {learningRecommendations.length >
            0 ? (

              <div className="career-learning-list">

                {learningRecommendations.map(
                  (item, index) => (

                    <div
                      className="career-learning-item"
                      key={index}
                    >

                      <div>
                        <FaCheckCircle />
                      </div>

                      <div>

                        <strong>
                          {item.skill}
                        </strong>

                        <p>
                          {item.reason}
                        </p>

                      </div>

                    </div>

                  )
                )}

              </div>

            ) : (

              <div className="career-empty-state">

                <p>
                  Learning recommendations
                  will appear based on your
                  profile and job market data.
                </p>

              </div>

            )}

          </div>

        </section>

        {/* POPULAR ROLES */}

        <section className="career-section-card">

          <div className="career-section-heading">

            <div className="career-section-icon">
              <FaBriefcase />
            </div>

            <div>

              <span>
                JOB MARKET
              </span>

              <h2>
                Popular Roles on TalentIQ
              </h2>

            </div>

          </div>

          {popularRoles.length > 0 ? (

            <div className="career-role-list">

              {popularRoles.map(
                (role, index) => (

                  <div
                    className="career-role-item"
                    key={index}
                  >

                    <div className="career-role-number">
                      {String(index + 1).padStart(
                        2,
                        "0"
                      )}
                    </div>

                    <div>

                      <strong>
                        {role.title}
                      </strong>

                      <span>
                        {role.openings} available
                        {role.openings > 1
                          ? " jobs"
                          : " job"}
                      </span>

                    </div>

                  </div>

                )
              )}

            </div>

          ) : (

            <div className="career-empty-state">

              <p>
                Job market insights will appear
                when jobs are available in TalentIQ.
              </p>

            </div>

          )}

        </section>

        {/* FINAL CTA */}

        <section className="career-final-card">

          <div className="career-final-icon">
            <FaLightbulb />
          </div>

          <div>

            <span>
              KEEP MOVING FORWARD
            </span>

            <h2>
              Build the career you want.
            </h2>

            <p>
              Continue improving your skills,
              exploring relevant jobs and using
              TalentIQ AI to make smarter career
              decisions.
            </p>

          </div>

          <Link
            to="/find-jobs"
            className="career-primary-button"
          >
            Explore Jobs
          </Link>

        </section>

      </main>

    </div>
  );
}

export default CareerInsights;