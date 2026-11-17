import React, {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    useNavigate,
} from "react-router-dom";

import "../../styles/manageJobs.css";

// ============================================================
// API
// ============================================================

const API_BASE =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";

const JOBS_API =
    `${API_BASE}/jobs`;

const MY_JOBS_API =
    `${JOBS_API}/recruiter/my`;


// ============================================================
// COMPONENT
// ============================================================

export default function ManageJobs() {

    const navigate = useNavigate();


    // ========================================================
    // STATE
    // ========================================================

    const [jobs, setJobs] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    const [search, setSearch] =
        useState("");

    const [statusFilter, setStatusFilter] =
        useState("All");

    const [typeFilter, setTypeFilter] =
        useState("All");

    const [deleteJobId, setDeleteJobId] =
        useState(null);

    const [actionLoading, setActionLoading] =
        useState("");


    // ========================================================
    // TOKEN
    // ========================================================

    const getToken = () => {

        return (
            localStorage.getItem("token") ||
            localStorage.getItem("authToken") ||
            localStorage.getItem("accessToken")
        );

    };


    // ========================================================
    // HEADERS
    // ========================================================

    const getHeaders = () => {

        const token =
            getToken();

        return {
            "Content-Type": "application/json",

            ...(token
                ? {
                    Authorization:
                        `Bearer ${token}`,
                }
                : {}),
        };

    };


    // ========================================================
    // LOGOUT
    // ========================================================

    const logout = () => {

        localStorage.removeItem("token");
        localStorage.removeItem("authToken");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        localStorage.removeItem("userRole");

        navigate(
            "/login",
            {
                replace: true,
            }
        );

    };


    // ========================================================
    // LOAD RECRUITER JOBS
    // GET /api/jobs/recruiter/my
    // ========================================================

    const loadJobs = async () => {

        const token =
            getToken();

        if (!token) {

            logout();

            return;

        }

        setLoading(true);
        setError("");

        try {

            const response =
                await fetch(
                    MY_JOBS_API,
                    {
                        method: "GET",
                        headers: getHeaders(),
                    }
                );


            if (response.status === 401) {

                logout();

                return;

            }


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Failed to load jobs"
                );

            }


            setJobs(
                Array.isArray(data.jobs)
                    ? data.jobs
                    : []
            );


        } catch (err) {

            console.error(
                "Manage Jobs Loading Error:",
                err
            );

            setError(
                err.message ||
                "Unable to load your jobs."
            );


        } finally {

            setLoading(false);

        }

    };


    // ========================================================
    // INITIAL LOAD
    // ========================================================

    useEffect(() => {

        loadJobs();

    }, []);


    // ========================================================
    // CLEAR ALERTS
    // ========================================================

    const clearAlerts = () => {

        setError("");
        setSuccess("");

    };


    // ========================================================
    // POST NEW JOB
    // ========================================================

    const handlePostNewJob = () => {

        navigate(
            "/recruiter/jobs/post"
        );

    };


    // ========================================================
    // EDIT JOB
    // ========================================================

    const handleEditJob = (job) => {

        if (!job?._id) {
            return;
        }

        navigate(
            `/recruiter/jobs/post?edit=${job._id}`
        );

    };


    // ========================================================
    // DELETE JOB
    // DELETE /api/jobs/:jobId
    // ========================================================

    const handleDelete = async (jobId) => {

        if (!jobId) {
            return;
        }

        setActionLoading(
            `delete-${jobId}`
        );

        setError("");
        setSuccess("");

        try {

            const response =
                await fetch(
                    `${JOBS_API}/${jobId}`,
                    {
                        method: "DELETE",
                        headers: getHeaders(),
                    }
                );


            if (response.status === 401) {

                logout();

                return;

            }


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to delete job"
                );

            }


            setJobs(
                (previous) =>
                    previous.filter(
                        (job) =>
                            job._id !== jobId
                    )
            );


            setDeleteJobId(null);


            setSuccess(
                "Job deleted successfully."
            );


            setTimeout(() => {

                setSuccess("");

            }, 2500);


        } catch (err) {

            console.error(
                "Delete Job Error:",
                err
            );

            setError(
                err.message ||
                "Unable to delete job."
            );


        } finally {

            setActionLoading("");

        }

    };


    // ========================================================
    // CHANGE STATUS
    //
    // PUT /api/jobs/:jobId
    //
    // Supported statuses:
    // Active
    // Inactive
    // Closed
    // ========================================================

    const changeStatus = async (
        job,
        newStatus
    ) => {

        if (!job?._id) {
            return;
        }


        const allowedStatuses = [
            "Active",
            "Inactive",
            "Closed",
        ];


        if (!allowedStatuses.includes(newStatus)) {

            setError(
                "Invalid job status."
            );

            return;

        }


        setActionLoading(
            `status-${job._id}`
        );

        setError("");
        setSuccess("");


        try {

            const response =
                await fetch(
                    `${JOBS_API}/${job._id}`,
                    {
                        method: "PUT",

                        headers:
                            getHeaders(),

                        body:
                            JSON.stringify({
                                status:
                                    newStatus,
                            }),
                    }
                );


            if (response.status === 401) {

                logout();

                return;

            }


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to update job status"
                );

            }


            const updatedJob =
                data.job;


            setJobs(
                (previous) =>
                    previous.map(
                        (item) =>
                            item._id === job._id
                                ? {
                                    ...item,
                                    ...(updatedJob || {}),
                                    status:
                                        updatedJob?.status ||
                                        newStatus,
                                }
                                : item
                    )
            );


            const statusMessage =
                newStatus === "Inactive"
                    ? "Job deactivated successfully."
                    : newStatus === "Active"
                        ? "Job activated successfully."
                        : "Job status updated successfully.";


            setSuccess(
                statusMessage
            );


            setTimeout(() => {

                setSuccess("");

            }, 2500);


        } catch (err) {

            console.error(
                "Status Update Error:",
                err
            );


            setError(
                err.message ||
                "Unable to update job status."
            );


        } finally {

            setActionLoading("");

        }

    };


    // ========================================================
    // FILTER JOBS
    // ========================================================

    const filteredJobs =
        useMemo(() => {

            const searchValue =
                search
                    .trim()
                    .toLowerCase();


            return jobs.filter(
                (job) => {

                    const title =
                        String(
                            job.title ||
                            ""
                        ).toLowerCase();


                    const location =
                        String(
                            job.location ||
                            ""
                        ).toLowerCase();


                    const type =
                        String(
                            job.type ||
                            job.jobType ||
                            ""
                        ).toLowerCase();


                    const status =
                        String(
                            job.status ||
                            "Active"
                        ).toLowerCase();


                    const company =
                        String(
                            job.companyName ||
                            job.company ||
                            ""
                        ).toLowerCase();


                    const matchesSearch =
                        !searchValue ||
                        title.includes(searchValue) ||
                        location.includes(searchValue) ||
                        type.includes(searchValue) ||
                        company.includes(searchValue);


                    const matchesStatus =
                        statusFilter === "All" ||
                        status ===
                            statusFilter.toLowerCase();


                    const matchesType =
                        typeFilter === "All" ||
                        type ===
                            typeFilter.toLowerCase();


                    return (
                        matchesSearch &&
                        matchesStatus &&
                        matchesType
                    );

                }
            );

        }, [
            jobs,
            search,
            statusFilter,
            typeFilter,
        ]);


    // ========================================================
    // STATISTICS
    // ========================================================

    const totalJobs =
        jobs.length;


    const activeJobs =
        jobs.filter(
            (job) =>
                String(
                    job.status ||
                    ""
                ).toLowerCase() ===
                "active"
        ).length;


    const inactiveJobs =
        jobs.filter(
            (job) =>
                String(
                    job.status ||
                    ""
                ).toLowerCase() ===
                "inactive"
        ).length;


    const closedJobs =
        jobs.filter(
            (job) =>
                String(
                    job.status ||
                    ""
                ).toLowerCase() ===
                "closed"
        ).length;


    // ========================================================
    // FORMAT DATE
    // ========================================================

    const formatDate = (date) => {

        if (!date) {

            return "Recently";

        }


        const parsed =
            new Date(date);


        if (
            Number.isNaN(
                parsed.getTime()
            )
        ) {

            return "Recently";

        }


        return parsed.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );

    };


    // ========================================================
    // STATUS CLASS
    // ========================================================

    const getStatusClass = (status) => {

        return String(
            status ||
            "Active"
        )
            .toLowerCase()
            .replace(
                /\s+/g,
                "-"
            );

    };


    // ========================================================
    // LOADING SCREEN
    // ========================================================

    if (loading) {

        return (

            <div className="manage-jobs-loading">

                <div className="manage-jobs-loader">

                    <div className="manage-loader-ring"></div>

                    <h3>
                        Loading your jobs...
                    </h3>

                    <p>
                        Syncing jobs from TalentIQ.
                    </p>

                </div>

            </div>

        );

    }


    // ========================================================
    // PAGE
    // ========================================================

    return (

        <div className="manage-jobs-page">


            {/* ==================================================
                HERO / HEADER
            ================================================== */}

            <section className="manage-jobs-header">

                <div className="manage-jobs-container">

                    <div className="manage-header-content">

                        <div>

                            <span className="manage-eyebrow">
                                RECRUITER PORTAL
                            </span>


                            <h1>
                                Manage Jobs
                            </h1>


                            <p>
                                Create, edit and manage
                                your company's job
                                opportunities from one
                                place.
                            </p>

                        </div>


                        <button
                            type="button"
                            className="post-job-primary-btn"
                            onClick={
                                handlePostNewJob
                            }
                        >

                            <span>
                                +
                            </span>

                            Post New Job

                        </button>

                    </div>

                </div>

            </section>


            {/* ==================================================
                MAIN
            ================================================== */}

            <main className="manage-jobs-container">


                {/* ==================================================
                    ERROR
                ================================================== */}

                {error && (

                    <div className="manage-alert manage-alert-error">

                        <span>
                            !
                        </span>


                        <p>
                            {error}
                        </p>


                        <button
                            type="button"
                            onClick={() =>
                                setError("")
                            }
                        >
                            ×
                        </button>

                    </div>

                )}


                {/* ==================================================
                    SUCCESS
                ================================================== */}

                {success && (

                    <div className="manage-alert manage-alert-success">

                        <span>
                            ✓
                        </span>


                        <p>
                            {success}
                        </p>

                    </div>

                )}


                {/* ==================================================
                    STATISTICS
                ================================================== */}

                <section className="manage-job-stat-grid">


                    {/* TOTAL */}

                    <div className="manage-job-stat-card">

                        <div className="manage-stat-icon purple">
                            💼
                        </div>


                        <div>

                            <span>
                                Total Jobs
                            </span>


                            <strong>
                                {totalJobs}
                            </strong>

                        </div>

                    </div>


                    {/* ACTIVE */}

                    <div className="manage-job-stat-card">

                        <div className="manage-stat-icon green">
                            ✓
                        </div>


                        <div>

                            <span>
                                Active
                            </span>


                            <strong>
                                {activeJobs}
                            </strong>

                        </div>

                    </div>


                    {/* INACTIVE */}

                    <div className="manage-job-stat-card">

                        <div className="manage-stat-icon orange">
                            ⏸
                        </div>


                        <div>

                            <span>
                                Inactive
                            </span>


                            <strong>
                                {inactiveJobs}
                            </strong>

                        </div>

                    </div>


                    {/* CLOSED */}

                    <div className="manage-job-stat-card">

                        <div className="manage-stat-icon red">
                            ✓
                        </div>


                        <div>

                            <span>
                                Closed
                            </span>


                            <strong>
                                {closedJobs}
                            </strong>

                        </div>

                    </div>

                </section>


                {/* ==================================================
                    JOB MANAGEMENT
                ================================================== */}

                <section className="manage-jobs-card">


                    {/* CARD HEADER */}

                    <div className="manage-jobs-card-heading">

                        <div>

                            <span className="manage-section-label">
                                JOB MANAGEMENT
                            </span>


                            <h2>
                                Your Job Postings
                            </h2>


                            <p>
                                Manage all jobs posted
                                by your recruiter account.
                            </p>

                        </div>


                        <span className="job-count-badge">

                            {filteredJobs.length}

                            {" "}

                            {
                                filteredJobs.length === 1
                                    ? "Job"
                                    : "Jobs"
                            }

                        </span>

                    </div>


                    {/* ==================================================
                        FILTER BAR
                    ================================================== */}

                    <div className="manage-filter-bar">


                        {/* SEARCH */}

                        <div className="manage-search-box">

                            <span>
                                🔎
                            </span>


                            <input
                                type="text"
                                placeholder="Search jobs by title, company, location or type..."
                                value={search}
                                onChange={(event) =>
                                    setSearch(
                                        event.target.value
                                    )
                                }
                            />


                            {search && (

                                <button
                                    type="button"
                                    onClick={() =>
                                        setSearch("")
                                    }
                                >
                                    ×
                                </button>

                            )}

                        </div>


                        {/* STATUS */}

                        <select
                            value={statusFilter}
                            onChange={(event) =>
                                setStatusFilter(
                                    event.target.value
                                )
                            }
                        >

                            <option value="All">
                                All Status
                            </option>

                            <option value="Active">
                                Active
                            </option>

                            <option value="Inactive">
                                Inactive
                            </option>

                            <option value="Closed">
                                Closed
                            </option>

                        </select>


                        {/* TYPE */}

                        <select
                            value={typeFilter}
                            onChange={(event) =>
                                setTypeFilter(
                                    event.target.value
                                )
                            }
                        >

                            <option value="All">
                                All Types
                            </option>

                            <option value="Full Time">
                                Full Time
                            </option>

                            <option value="Part Time">
                                Part Time
                            </option>

                            <option value="Internship">
                                Internship
                            </option>

                            <option value="Contract">
                                Contract
                            </option>

                        </select>

                    </div>


                    {/* ==================================================
                        EMPTY STATE
                    ================================================== */}

                    {filteredJobs.length === 0 ? (

                        <div className="manage-empty-state">

                            <div className="manage-empty-icon">
                                💼
                            </div>


                            <h3>

                                {jobs.length === 0
                                    ? "No jobs posted yet"
                                    : "No matching jobs"}

                            </h3>


                            <p>

                                {jobs.length === 0
                                    ? "Create your first job posting to start attracting candidates."
                                    : "Try changing your search or filters."}

                            </p>


                            {jobs.length === 0 && (

                                <button
                                    type="button"
                                    onClick={
                                        handlePostNewJob
                                    }
                                >

                                    + Post Your First Job

                                </button>

                            )}

                        </div>

                    ) : (

                        /* ==================================================
                            JOB LIST
                        ================================================== */

                        <div className="manage-job-list">

                            {filteredJobs.map(
                                (job) => {

                                    const status =
                                        String(
                                            job.status ||
                                            "Active"
                                        );


                                    const statusClass =
                                        getStatusClass(
                                            status
                                        );


                                    const isDeleting =
                                        actionLoading ===
                                        `delete-${job._id}`;


                                    const isChangingStatus =
                                        actionLoading ===
                                        `status-${job._id}`;


                                    const isActive =
                                        status.toLowerCase() ===
                                        "active";


                                    const isInactive =
                                        status.toLowerCase() ===
                                        "inactive";


                                    const isClosed =
                                        status.toLowerCase() ===
                                        "closed";


                                    return (

                                        <article
                                            className="manage-job-item"
                                            key={
                                                job._id
                                            }
                                        >


                                            {/* JOB INFORMATION */}

                                            <div className="manage-job-main">


                                                <div className="manage-job-icon">
                                                    💼
                                                </div>


                                                <div className="manage-job-info">


                                                    {/* TITLE + STATUS */}

                                                    <div className="manage-job-title-row">

                                                        <h3>
                                                            {
                                                                job.title ||
                                                                "Untitled Job"
                                                            }
                                                        </h3>


                                                        <span
                                                            className={
                                                                `manage-job-status ${statusClass}`
                                                            }
                                                        >

                                                            <span></span>

                                                            {status}

                                                        </span>

                                                    </div>


                                                    {/* COMPANY */}

                                                    <p className="manage-job-company">

                                                        {
                                                            job.companyName ||
                                                            job.company ||
                                                            "Company"
                                                        }

                                                    </p>


                                                    {/* META */}

                                                    <div className="manage-job-meta">

                                                        <span>
                                                            📍{" "}
                                                            {
                                                                job.location ||
                                                                "Location not specified"
                                                            }
                                                        </span>


                                                        <span>
                                                            💼{" "}
                                                            {
                                                                job.type ||
                                                                job.jobType ||
                                                                "Full Time"
                                                            }
                                                        </span>


                                                        <span>
                                                            🏠{" "}
                                                            {
                                                                job.mode ||
                                                                job.workMode ||
                                                                "On-site"
                                                            }
                                                        </span>


                                                        <span>
                                                            👤{" "}
                                                            {
                                                                job.experience ||
                                                                "Not specified"
                                                            }
                                                        </span>

                                                    </div>


                                                    {/* DATE */}

                                                    <div className="manage-job-date">

                                                        Posted{" "}

                                                        {
                                                            formatDate(
                                                                job.createdAt
                                                            )
                                                        }

                                                    </div>

                                                </div>

                                            </div>


                                            {/* ACTIONS */}

                                            <div className="manage-job-actions">


                                                {/* VIEW */}

                                                <button
                                                    type="button"
                                                    className="manage-action-btn view"
                                                    onClick={() =>
                                                        navigate(
                                                            `/jobs/${job._id}`
                                                        )
                                                    }
                                                >
                                                    View
                                                </button>


                                                {/* EDIT */}

                                                <button
                                                    type="button"
                                                    className="manage-action-btn edit"
                                                    onClick={() =>
                                                        handleEditJob(
                                                            job
                                                        )
                                                    }
                                                >
                                                    Edit
                                                </button>


                                                {/* STATUS */}

                                                {isActive ? (

                                                    <button
                                                        type="button"
                                                        className="manage-action-btn status"
                                                        disabled={
                                                            isChangingStatus
                                                        }
                                                        onClick={() =>
                                                            changeStatus(
                                                                job,
                                                                "Inactive"
                                                            )
                                                        }
                                                    >

                                                        {
                                                            isChangingStatus
                                                                ? "..."
                                                                : "Deactivate"
                                                        }

                                                    </button>

                                                ) : isInactive ? (

                                                    <button
                                                        type="button"
                                                        className="manage-action-btn activate"
                                                        disabled={
                                                            isChangingStatus
                                                        }
                                                        onClick={() =>
                                                            changeStatus(
                                                                job,
                                                                "Active"
                                                            )
                                                        }
                                                    >

                                                        {
                                                            isChangingStatus
                                                                ? "..."
                                                                : "Activate"
                                                        }

                                                    </button>

                                                ) : (

                                                    <button
                                                        type="button"
                                                        className="manage-action-btn activate"
                                                        disabled
                                                    >
                                                        Closed
                                                    </button>

                                                )}


                                                {/* DELETE */}

                                                <button
                                                    type="button"
                                                    className="manage-action-btn delete"
                                                    disabled={
                                                        isDeleting
                                                    }
                                                    onClick={() =>
                                                        setDeleteJobId(
                                                            job._id
                                                        )
                                                    }
                                                >

                                                    {
                                                        isDeleting
                                                            ? "..."
                                                            : "Delete"
                                                    }

                                                </button>

                                            </div>

                                        </article>

                                    );

                                }
                            )}

                        </div>

                    )}

                </section>

            </main>


            {/* ==================================================
                DELETE CONFIRMATION
            ================================================== */}

            {deleteJobId && (

                <div className="delete-confirm-overlay">


                    <div className="delete-confirm-box">


                        <div className="delete-confirm-icon">
                            !
                        </div>


                        <h2>
                            Delete this job?
                        </h2>


                        <p>
                            This action cannot be
                            undone. The job posting
                            will be permanently
                            removed.
                        </p>


                        <div className="delete-confirm-actions">


                            <button
                                type="button"
                                onClick={() =>
                                    setDeleteJobId(
                                        null
                                    )
                                }
                            >
                                Cancel
                            </button>


                            <button
                                type="button"
                                className="confirm-delete"
                                disabled={
                                    actionLoading ===
                                    `delete-${deleteJobId}`
                                }
                                onClick={() =>
                                    handleDelete(
                                        deleteJobId
                                    )
                                }
                            >

                                {
                                    actionLoading ===
                                    `delete-${deleteJobId}`
                                        ? "Deleting..."
                                        : "Delete Job"
                                }

                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>

    );

}