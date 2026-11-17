import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/JobDetails.css";

const JobDetails = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();

    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // ============================================================
    // FETCH JOB
    // ============================================================

    useEffect(() => {
        const fetchJob = async () => {
            try {
                setLoading(true);
                setError("");

                console.log("Fetching Job ID:", jobId);

                if (!jobId) {
                    throw new Error("Job ID is missing");
                }

                const response = await fetch(
                    `http://localhost:5000/api/jobs/${jobId}`
                );

                let data = {};

                try {
                    data = await response.json();
                } catch {
                    data = {};
                }

                console.log("Job API response:", data);

                if (!response.ok) {
                    throw new Error(
                        data.message || "Failed to fetch job"
                    );
                }

                setJob(data.job);

            } catch (error) {
                console.error("Job Details Error:", error);

                setError(
                    error.message || "Failed to fetch job"
                );

            } finally {
                setLoading(false);
            }
        };

        fetchJob();
    }, [jobId]);

    // ============================================================
    // LOADING
    // ============================================================

    if (loading) {
        return (
            <div className="job-details-loading">
                <div className="loader"></div>

                <h2>
                    Loading job...
                </h2>
            </div>
        );
    }

    // ============================================================
    // ERROR
    // ============================================================

    if (error || !job) {
        return (
            <div className="job-details-error">

                <div className="error-icon">
                    !
                </div>

                <h2>
                    Unable to load job
                </h2>

                <p>
                    {error || "Job not found"}
                </p>

                <button
                    type="button"
                    onClick={() => navigate("/find-jobs")}
                    className="back-btn"
                >
                    ← Back to Jobs
                </button>

            </div>
        );
    }

    // ============================================================
    // APPLY
    // ============================================================

    const handleApply = () => {
        if (!job?._id) {
            console.error("Job ID is missing");
            return;
        }

        console.log(
            "Opening application form for Job ID:",
            job._id
        );

        // CORRECT DYNAMIC APPLICATION LINK
        navigate(`/apply/${job._id}`);
    };

    // ============================================================
    // PAGE
    // ============================================================

    return (
        <div className="job-details-page">

            {/* =====================================================
                TOP ACTIONS
            ===================================================== */}

            <div className="job-details-top">

                <button
                    type="button"
                    className="back-btn"
                    onClick={() => navigate("/find-jobs")}
                >
                    ← Back to Jobs
                </button>

                <button
                    type="button"
                    className="apply-btn"
                    onClick={handleApply}
                >
                    Apply Now
                </button>

            </div>

            {/* =====================================================
                JOB HEADER
            ===================================================== */}

            <div className="job-header-card">

                <div className="company-logo">
                    {job.company || job.companyName
                        ? (job.company || job.companyName)
                            .charAt(0)
                            .toUpperCase()
                        : "J"}
                </div>

                <div className="job-header-content">

                    <h1>
                        {job.title ||
                            job.jobTitle ||
                            "Job Title"}
                    </h1>

                    <h3>
                        {job.company ||
                            job.companyName ||
                            "Company"}
                    </h3>

                    <div className="job-meta">

                        <span>
                            📍{" "}
                            {job.location ||
                                "Location not specified"}
                        </span>

                        <span>
                            💼{" "}
                            {job.jobType ||
                                job.type ||
                                "Full Time"}
                        </span>

                        <span>
                            🏠{" "}
                            {job.mode ||
                                job.workMode ||
                                "Not specified"}
                        </span>

                    </div>

                </div>

            </div>

            {/* =====================================================
                MAIN CONTENT
            ===================================================== */}

            <div className="job-details-layout">

                {/* =================================================
                    LEFT
                ================================================= */}

                <div className="job-main-content">

                    {/* =================================================
                        DESCRIPTION
                    ================================================= */}

                    <section className="job-section">

                        <h2>
                            Job Description
                        </h2>

                        <p>
                            {job.description ||
                                "No job description available."}
                        </p>

                    </section>

                    {/* =================================================
                        RESPONSIBILITIES
                    ================================================= */}

                    {job.responsibilities && (
                        <section className="job-section">

                            <h2>
                                Responsibilities
                            </h2>

                            {Array.isArray(
                                job.responsibilities
                            ) ? (
                                <ul>
                                    {job.responsibilities.map(
                                        (
                                            responsibility,
                                            index
                                        ) => (
                                            <li
                                                key={index}
                                            >
                                                {responsibility}
                                            </li>
                                        )
                                    )}
                                </ul>
                            ) : (
                                <p>
                                    {
                                        job.responsibilities
                                    }
                                </p>
                            )}

                        </section>
                    )}

                    {/* =================================================
                        REQUIREMENTS
                    ================================================= */}

                    <section className="job-section">

                        <h2>
                            Requirements
                        </h2>

                        {Array.isArray(
                            job.requirements
                        ) ? (
                            <ul>
                                {job.requirements.map(
                                    (
                                        requirement,
                                        index
                                    ) => (
                                        <li
                                            key={index}
                                        >
                                            {requirement}
                                        </li>
                                    )
                                )}
                            </ul>
                        ) : (
                            <p>
                                {job.requirements ||
                                    "No requirements specified."}
                            </p>
                        )}

                    </section>

                    {/* =================================================
                        SKILLS
                    ================================================= */}

                    <section className="job-section">

                        <h2>
                            Skills
                        </h2>

                        <div className="skills-container">

                            {Array.isArray(
                                job.skills
                            ) ? (
                                job.skills.length > 0 ? (
                                    job.skills.map(
                                        (
                                            skill,
                                            index
                                        ) => (
                                            <span
                                                key={index}
                                                className="skill-tag"
                                            >
                                                {typeof skill ===
                                                "object"
                                                    ? skill.name ||
                                                      skill.label ||
                                                      skill.title ||
                                                      "Skill"
                                                    : skill}
                                            </span>
                                        )
                                    )
                                ) : (
                                    <span>
                                        Skills not specified
                                    </span>
                                )
                            ) : (
                                <span>
                                    {job.skills ||
                                        "Skills not specified"}
                                </span>
                            )}

                        </div>

                    </section>

                </div>

                {/* =================================================
                    RIGHT SIDEBAR
                ================================================= */}

                <aside className="job-sidebar">

                    {/* =================================================
                        APPLY CARD
                    ================================================= */}

                    <div className="apply-card">

                        <h3>
                            Interested in this job?
                        </h3>

                        <p>
                            Apply now and take the next step
                            toward your career.
                        </p>

                        <button
                            type="button"
                            className="apply-btn full"
                            onClick={handleApply}
                        >
                            Apply Now →
                        </button>

                    </div>

                    {/* =================================================
                        JOB SUMMARY
                    ================================================= */}

                    <div className="summary-card">

                        <h3>
                            Job Overview
                        </h3>

                        <div className="summary-item">

                            <span>
                                Experience
                            </span>

                            <strong>
                                {job.experience ||
                                    job.experienceLevel ||
                                    "Not specified"}
                            </strong>

                        </div>

                        <div className="summary-item">

                            <span>
                                Job Type
                            </span>

                            <strong>
                                {job.jobType ||
                                    job.type ||
                                    "Full Time"}
                            </strong>

                        </div>

                        <div className="summary-item">

                            <span>
                                Work Mode
                            </span>

                            <strong>
                                {job.mode ||
                                    job.workMode ||
                                    "Not specified"}
                            </strong>

                        </div>

                        <div className="summary-item">

                            <span>
                                Location
                            </span>

                            <strong>
                                {job.location ||
                                    "Not specified"}
                            </strong>

                        </div>

                        {job.salary && (
                            <div className="summary-item">

                                <span>
                                    Salary
                                </span>

                                <strong>
                                    {job.salary}
                                </strong>

                            </div>
                        )}

                    </div>

                </aside>

            </div>

        </div>
    );
};

export default JobDetails;