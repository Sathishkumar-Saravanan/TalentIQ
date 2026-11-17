import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  FaArrowLeft,
  FaArrowUp,
  FaCheckCircle,
  FaCode,
  FaBriefcase,
  FaGraduationCap,
  FaChartLine,
  FaSpinner,
  FaExclamationTriangle,
} from "react-icons/fa";

import "../styles/SkillGapAnalysis.css";

function SkillGapAnalysis() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_URL = (
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000"
  ).replace(/\/$/, "");

  useEffect(() => {
    const loadAnalysis = async () => {
      try {
        setLoading(true);
        setError("");

        const token =
          localStorage.getItem("token") ||
          localStorage.getItem("talentIQToken") ||
          localStorage.getItem("authToken");

        if (!token) {
          throw new Error(
            "Please login to view your Skill Gap Analysis."
          );
        }

        const response = await fetch(
          `${API_URL}/api/skill-gap-analysis`,
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
          "SKILL GAP API RESPONSE:",
          result
        );

        if (!response.ok || !result.success) {
          throw new Error(
            result.message ||
              "Unable to load Skill Gap Analysis."
          );
        }

        setData(result.data);
      } catch (err) {
        console.error(
          "SKILL GAP ERROR:",
          err
        );

        setError(
          err.message ||
            "Unable to load Skill Gap Analysis."
        );
      } finally {
        setLoading(false);
      }
    };

    loadAnalysis();
  }, [API_URL]);

  if (loading) {
    return (
      <div className="skill-gap-page">
        <div className="skill-gap-loading">
          <FaSpinner className="skill-gap-spinner" />

          <h2>
            Analyzing your skills...
          </h2>

          <p>
            TalentIQ is comparing your profile,
            resume and current job market.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="skill-gap-page">
        <div className="skill-gap-error">
          <FaExclamationTriangle />

          <h2>
            Skill Gap Analysis
          </h2>

          <p>{error}</p>

          <Link
            to="/"
            className="skill-gap-button"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const candidate =
    data.candidate || {};

  const source =
    data.source || {};

  const overview =
    data.overview || {};

  const skillGaps =
    Array.isArray(data.skillGaps)
      ? data.skillGaps
      : [];

  const learningRecommendations =
    Array.isArray(
      data.learningRecommendations
    )
      ? data.learningRecommendations
      : [];

  const jobs =
    Array.isArray(data.jobs)
      ? data.jobs
      : [];

  const candidateSkills =
    Array.isArray(candidate.skills)
      ? candidate.skills
      : [];

  return (
    <div className="skill-gap-page">

      {/* HERO */}

      <section className="skill-gap-hero">

        <div className="skill-gap-decoration skill-gap-decoration-one" />

        <div className="skill-gap-decoration skill-gap-decoration-two" />

        <div className="skill-gap-hero-content">

          <Link
            to="/"
            className="skill-gap-back-link"
          >
            <FaArrowLeft />
            Back to Home
          </Link>

          <span className="skill-gap-eyebrow">
            TALENTIQ AI
          </span>

          <h1>
            Skill Gap{" "}
            <span>Analysis</span>
          </h1>

          <p>
            Discover which skills you already
            have, which skills employers need,
            and what you should learn next.
          </p>

        </div>

      </section>

      <main className="skill-gap-main">

        {/* CANDIDATE */}

        <section className="skill-gap-profile">

          <div>

            <span>
              CAREER PROFILE
            </span>

            <h2>
              {candidate.name ||
                "Candidate"}
            </h2>

            <p>
              Target role:{" "}
              <strong>
                {candidate.targetRole ||
                  "Software Developer"}
              </strong>
            </p>

          </div>

          <div className="skill-gap-profile-icon">
            <FaCode />
          </div>

        </section>

        {/* CONNECTION STATUS */}

        <section className="skill-gap-connections">

          <div
            className={
              source.profileConnected
                ? "connected"
                : "not-connected"
            }
          >
            <FaCheckCircle />

            <div>
              <strong>
                Profile
              </strong>

              <span>
                {source.profileConnected
                  ? "Connected"
                  : "Not available"}
              </span>
            </div>
          </div>

          <div
            className={
              source.resumeConnected
                ? "connected"
                : "not-connected"
            }
          >
            <FaCheckCircle />

            <div>
              <strong>
                Resume
              </strong>

              <span>
                {source.resumeConnected
                  ? "Connected"
                  : "Not available"}
              </span>
            </div>
          </div>

          <div className="connected">

            <FaBriefcase />

            <div>

              <strong>
                Job Market
              </strong>

              <span>
                {source.activeJobsAnalyzed ||
                  0} active jobs analyzed
              </span>

            </div>

          </div>

        </section>

        {/* OVERVIEW */}

        <section className="skill-gap-overview">

          <div className="skill-gap-overview-card">

            <FaChartLine />

            <span>
              SKILL MATCH
            </span>

            <strong>
              {overview.skillMatchScore ||
                0}%
            </strong>

            <p>
              Jobs matching your skills
            </p>

          </div>

          <div className="skill-gap-overview-card">

            <FaBriefcase />

            <span>
              ACTIVE JOBS
            </span>

            <strong>
              {overview.totalActiveJobs ||
                0}
            </strong>

            <p>
              Jobs analyzed
            </p>

          </div>

          <div className="skill-gap-overview-card">

            <FaArrowUp />

            <span>
              SKILL GAPS
            </span>

            <strong>
              {overview.totalSkillGaps ||
                0}
            </strong>

            <p>
              Skills to improve
            </p>

          </div>

          <div className="skill-gap-overview-card">

            <FaCode />

            <span>
              YOUR SKILLS
            </span>

            <strong>
              {candidateSkills.length}
            </strong>

            <p>
              Skills in your profile
            </p>

          </div>

        </section>

        {/* AI SUMMARY */}

        <section className="skill-gap-summary">

          <div className="skill-gap-summary-icon">
            <FaChartLine />
          </div>

          <div>

            <span>
              TALENTIQ ANALYSIS
            </span>

            <p>
              {data.summary}
            </p>

          </div>

        </section>

        {/* CURRENT SKILLS */}

        <section className="skill-gap-section">

          <div className="skill-gap-heading">

            <div className="skill-gap-heading-icon">
              <FaCheckCircle />
            </div>

            <div>

              <span>
                YOUR CURRENT SKILLS
              </span>

              <h2>
                Skills You Already Have
              </h2>

            </div>

          </div>

          {candidateSkills.length > 0 ? (

            <div className="skill-gap-current-list">

              {candidateSkills.map(
                (skill, index) => (

                  <span
                    key={index}
                    className="skill-gap-current-tag"
                  >
                    <FaCheckCircle />
                    {skill}
                  </span>

                )
              )}

            </div>

          ) : (

            <div className="skill-gap-empty">

              <p>
                No skills were found in your
                current profile or resume.
              </p>

              <Link to="/profile">
                Update Profile
              </Link>

            </div>

          )}

        </section>

        {/* SKILL GAPS */}

        <section className="skill-gap-section">

          <div className="skill-gap-heading">

            <div className="skill-gap-heading-icon">
              <FaArrowUp />
            </div>

            <div>

              <span>
                MARKET DEMAND
              </span>

              <h2>
                Skills You Should Learn
              </h2>

            </div>

          </div>

          {skillGaps.length > 0 ? (

            <div className="skill-gap-list">

              {skillGaps.map(
                (item, index) => (

                  <div
                    key={index}
                    className="skill-gap-item"
                  >

                    <div className="skill-gap-number">
                      {String(
                        index + 1
                      ).padStart(2, "0")}
                    </div>

                    <div className="skill-gap-item-body">

                      <div className="skill-gap-item-header">

                        <strong>
                          {item.skill}
                        </strong>

                        <span
                          className={`skill-gap-priority ${String(
                            item.priority
                          ).toLowerCase()}`}
                        >
                          {item.priority}
                        </span>

                      </div>

                      <div className="skill-gap-demand">

                        <div className="skill-gap-demand-track">

                          <div
                            className="skill-gap-demand-fill"
                            style={{
                              width: `${Math.min(
                                item.demand *
                                  10,
                                100
                              )}%`,
                            }}
                          />

                        </div>

                        <span>
                          {item.demand}{" "}
                          {item.demand === 1
                            ? "job"
                            : "jobs"}
                        </span>

                      </div>

                    </div>

                  </div>

                )
              )}

            </div>

          ) : (

            <div className="skill-gap-success">

              <FaCheckCircle />

              <h3>
                Excellent!
              </h3>

              <p>
                No major skill gaps were detected
                from the current active jobs.
              </p>

            </div>

          )}

        </section>

        {/* LEARNING PLAN */}

        <section className="skill-gap-section">

          <div className="skill-gap-heading">

            <div className="skill-gap-heading-icon">
              <FaGraduationCap />
            </div>

            <div>

              <span>
                PERSONALIZED LEARNING
              </span>

              <h2>
                Recommended Learning Plan
              </h2>

            </div>

          </div>

          {learningRecommendations.length >
          0 ? (

            <div className="skill-gap-learning-list">

              {learningRecommendations.map(
                (item, index) => (

                  <div
                    key={index}
                    className="skill-gap-learning-item"
                  >

                    <div className="skill-gap-learning-number">
                      {index + 1}
                    </div>

                    <div>

                      <div className="skill-gap-learning-header">

                        <strong>
                          {item.skill}
                        </strong>

                        <span>
                          {item.priority}
                        </span>

                      </div>

                      <p>
                        {item.reason}
                      </p>

                    </div>

                  </div>

                )
              )}

            </div>

          ) : (

            <div className="skill-gap-empty">

              <p>
                Learning recommendations will
                appear when active job data is
                available.
              </p>

            </div>

          )}

        </section>

        {/* JOB MATCH ANALYSIS */}

        <section className="skill-gap-section">

          <div className="skill-gap-heading">

            <div className="skill-gap-heading-icon">
              <FaBriefcase />
            </div>

            <div>

              <span>
                JOB MATCH ANALYSIS
              </span>

              <h2>
                How Your Skills Compare
              </h2>

            </div>

          </div>

          {jobs.length > 0 ? (

            <div className="skill-gap-job-list">

              {jobs.map(
                (job) => (

                  <div
                    key={job.id}
                    className="skill-gap-job"
                  >

                    <div>

                      <strong>
                        {job.title}
                      </strong>

                      <span>
                        {job.company}
                      </span>

                    </div>

                    <div className="skill-gap-job-stats">

                      <span>
                        {job.matchCount} matched
                      </span>

                      <span>
                        {job.missingSkills.length} missing
                      </span>

                    </div>

                  </div>

                )
              )}

            </div>

          ) : (

            <div className="skill-gap-empty">

              <p>
                No active jobs are currently
                available for comparison.
              </p>

            </div>

          )}

        </section>

        {/* CTA */}

        <section className="skill-gap-cta">

          <div>

            <span>
              KEEP GROWING
            </span>

            <h2>
              Turn your skill gaps into
              opportunities.
            </h2>

            <p>
              Learn the skills employers need,
              improve your profile and explore
              matching jobs on TalentIQ.
            </p>

          </div>

          <Link
            to="/find-jobs"
            className="skill-gap-button"
          >
            Explore Jobs
          </Link>

        </section>

      </main>

    </div>
  );
}

export default SkillGapAnalysis;