import React, {
    useEffect,
    useMemo,
    useState,
} from "react";

import { Link } from "react-router-dom";

import {
    FaLinkedinIn,
    FaGithub,
    FaInstagram,
    FaXTwitter,
} from "react-icons/fa6";

import "../styles/FindJobs.css";

// ============================================================
// API
// ============================================================

const API_URL = "http://localhost:5000";

const PROFILE_API = `${API_URL}/api/profile`;

const JOBS_API = `${API_URL}/api/jobs`;

// AI recommendations are used ONLY to highlight matching jobs.
// Find Jobs itself continues to display every recruiter-posted job.
const RECOMMENDATIONS_API = `${API_URL}/api/jobs/recommendations`;

const SAVED_JOBS_KEY = "talentIQSavedJobs";

// ============================================================
// PAGINATION
// ============================================================

const JOBS_PER_PAGE = 10;

// ============================================================
// SAFE DISPLAY HELPER
// ============================================================

const getDisplayValue = (value, fallback = "") => {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return fallback;
    }

    if (
        typeof value === "string" ||
        typeof value === "number"
    ) {
        return String(value);
    }

    if (Array.isArray(value)) {
        return value
            .map((item) =>
                getDisplayValue(item, "")
            )
            .filter(Boolean)
            .join(", ");
    }

    if (typeof value === "object") {
        return (
            value.name ||
            value.label ||
            value.title ||
            value.value ||
            value.location ||
            value.company ||
            value.companyName ||
            value.jobTitle ||
            value.type ||
            value.mode ||
            value.experience ||
            value.salary ||
            fallback
        );
    }

    return fallback;
};

// ============================================================
// SAFE MATCH VALUE
// ============================================================

const getMatchValue = (job) => {
    const match =
        job?.match ??
        job?.aiMatch ??
        job?.matchScore ??
        job?.aiMatchScore;

    if (
        match === null ||
        match === undefined ||
        match === ""
    ) {
        return null;
    }

    if (typeof match === "object") {
        const objectMatch =
            match.score ??
            match.match ??
            match.value ??
            match.percentage;

        if (
            objectMatch !== undefined &&
            objectMatch !== null
        ) {
            return Number(objectMatch);
        }

        return null;
    }

    const numberMatch = Number(match);

    return Number.isFinite(numberMatch)
        ? numberMatch
        : null;
};

// ============================================================
// MAIN COMPONENT
// ============================================================

function FindJobs() {

    // ============================================================
    // STATE
    // ============================================================

    const [jobsData, setJobsData] = useState([]);

    // ALL recruiter-posted jobs stay in jobsData.
    // recommendedJobs contains only jobs returned by TalentIQ AI.
    const [recommendedJobs, setRecommendedJobs] = useState([]);

    const [loadingRecommendations, setLoadingRecommendations] =
        useState(true);

    const [recommendationError, setRecommendationError] =
        useState("");

    const [keyword, setKeyword] = useState("");

    const [location, setLocation] = useState("");

    const [jobType, setJobType] = useState("All");

    const [experience, setExperience] = useState("All");

    const [workMode, setWorkMode] = useState("All");

    const [sortBy, setSortBy] = useState("AI Match");

    const [savedJobs, setSavedJobs] = useState([]);

    const [showFilters, setShowFilters] = useState(false);

    const [loadingJobs, setLoadingJobs] = useState(true);

    const [fetchError, setFetchError] = useState("");

    const [profile, setProfile] = useState(null);

    const [loadingProfile, setLoadingProfile] =
        useState(true);

    const [currentPage, setCurrentPage] =
        useState(1);

    // ============================================================
    // LOAD SAVED JOBS
    // ============================================================

    useEffect(() => {

        try {

            const storedJobs =
                localStorage.getItem(
                    SAVED_JOBS_KEY
                );

            if (storedJobs) {

                const parsedJobs =
                    JSON.parse(storedJobs);

                if (Array.isArray(parsedJobs)) {

                    setSavedJobs(parsedJobs);

                }

            }

        } catch (error) {

            console.error(
                "Saved jobs loading error:",
                error
            );

        }

    }, []);

    // ============================================================
    // SAVE JOBS TO LOCAL STORAGE
    // ============================================================

    useEffect(() => {

        try {

            localStorage.setItem(
                SAVED_JOBS_KEY,
                JSON.stringify(savedJobs)
            );

        } catch (error) {

            console.error(
                "Saved jobs storage error:",
                error
            );

        }

    }, [savedJobs]);

    // ============================================================
    // FETCH RECRUITER JOBS
    // ============================================================

    useEffect(() => {

        const fetchJobs = async () => {

            try {

                setLoadingJobs(true);

                setFetchError("");

                const response =
                    await fetch(JOBS_API);

                const data =
                    await response.json();

                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Failed to fetch jobs"
                    );

                }

                /*
                    Backend can return:

                    {
                        success: true,
                        jobs: [...]
                    }

                    OR

                    {
                        jobs: [...]
                    }

                    OR

                    [...]
                */

                const recruiterJobs =
                    Array.isArray(data)
                        ? data
                        : Array.isArray(data?.jobs)
                            ? data.jobs
                            : Array.isArray(data?.data)
                                ? data.data
                                : [];

                setJobsData(recruiterJobs);

            } catch (error) {

                console.error(
                    "Fetch Jobs Error:",
                    error
                );

                setFetchError(
                    error.message ||
                    "Unable to load jobs"
                );

            } finally {

                setLoadingJobs(false);

            }

        };

        fetchJobs();

    }, []);

    // ============================================================
    // FETCH PROFILE
    // ============================================================

    useEffect(() => {

        const fetchProfile = async () => {

            const token =
                localStorage.getItem("token") ||
                localStorage.getItem("authToken") ||
                localStorage.getItem("accessToken");

            if (!token) {

                setLoadingProfile(false);

                return;

            }

            try {

                const response =
                    await fetch(
                        PROFILE_API,
                        {
                            headers: {
                                Authorization:
                                    `Bearer ${token}`,
                            },
                        }
                    );

                if (!response.ok) {

                    throw new Error(
                        "Unable to load profile"
                    );

                }

                const data =
                    await response.json();

                setProfile(
                    data.user ||
                    data.profile ||
                    data
                );

            } catch (error) {

                console.error(
                    "Profile loading error:",
                    error
                );

            } finally {

                setLoadingProfile(false);

            }

        };

        fetchProfile();

    }, []);

    // ============================================================
    // FETCH AI RECOMMENDATIONS
    // ============================================================
    // IMPORTANT:
    // This request does NOT replace jobsData.
    // It is used only to identify which recruiter jobs should
    // receive the AI MATCH highlight.
    // ============================================================

    useEffect(() => {

        const fetchRecommendations = async () => {

            const token =
                localStorage.getItem("token") ||
                localStorage.getItem("authToken") ||
                localStorage.getItem("accessToken");

            if (!token) {

                setRecommendedJobs([]);
                setRecommendationError("");
                setLoadingRecommendations(false);
                return;

            }

            try {

                setLoadingRecommendations(true);
                setRecommendationError("");

                const response = await fetch(
                    RECOMMENDATIONS_API,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                        },
                    }
                );

                const data = await response.json();

                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Unable to load AI recommendations"
                    );

                }

                const aiJobs =
                    Array.isArray(data)
                        ? data
                        : Array.isArray(data?.jobs)
                            ? data.jobs
                            : Array.isArray(data?.recommendations)
                                ? data.recommendations
                                : Array.isArray(data?.data)
                                    ? data.data
                                    : [];

                setRecommendedJobs(aiJobs);

            } catch (error) {

                console.error(
                    "AI recommendations loading error:",
                    error
                );

                // AI recommendation failure must NOT prevent
                // recruiter jobs from being displayed.
                setRecommendedJobs([]);

                setRecommendationError(
                    error.message ||
                    "Unable to load AI recommendations"
                );

            } finally {

                setLoadingRecommendations(false);

            }

        };

        fetchRecommendations();

    }, []);

    // ============================================================
    // PROFILE COMPLETION
    // ============================================================

    const profileCompletion = useMemo(() => {

        if (!profile) {

            return 0;

        }

        const fields = [

            profile.fullName,

            profile.email,

            profile.phone,

            profile.location,

            profile.headline,

            profile.bio,

            profile.education?.degree,

            profile.education?.college,

            profile.education?.graduationYear,

            profile.experience?.jobTitle,

            profile.experience?.company,

            profile.skills?.length > 0,

            profile.careerPreferences?.targetRole,

            profile.careerPreferences?.preferredLocation,

            profile.resume,

        ];

        return Math.round(
            (
                fields.filter(Boolean).length /
                fields.length
            ) * 100
        );

    }, [profile]);

    const profileMessage =
        loadingProfile
            ? "Loading your profile details..."
            : profileCompletion >= 80
                ? "Your profile is performing well. Add a few more details to increase your job opportunities."
                : profileCompletion >= 50
                    ? "Your profile has a solid start. Add more details to improve your job opportunities."
                    : "Complete your profile to help employers understand your skills and experience.";

    // ============================================================
    // SAVE / UNSAVE JOB
    // ============================================================

    const toggleSave = (id) => {

        if (!id) {

            return;

        }

        setSavedJobs((previous) => {

            if (previous.includes(id)) {

                return previous.filter(
                    (jobId) =>
                        jobId !== id
                );

            }

            return [
                ...previous,
                id,
            ];

        });

    };

    // ============================================================
    // CLEAR FILTERS
    // ============================================================

    const clearFilters = () => {

        setKeyword("");

        setLocation("");

        setJobType("All");

        setExperience("All");

        setWorkMode("All");

        setSortBy("AI Match");

        setCurrentPage(1);

    };

    // ============================================================
    // AI RECOMMENDATION MATCH HELPERS
    // ============================================================

    const getJobId = (job) => {

        if (!job) {
            return "";
        }

        return String(
            job?._id ||
            job?.id ||
            job?.jobId ||
            job?.job?._id ||
            job?.job?.id ||
            ""
        );

    };

    const getRecommendationMatchValue = (job) => {

        const match =
            job?.matchScore ??
            job?.aiMatchScore ??
            job?.match ??
            job?.aiMatch;

        if (
            match === null ||
            match === undefined ||
            match === ""
        ) {
            return null;
        }

        if (typeof match === "object") {

            const objectMatch =
                match.score ??
                match.matchScore ??
                match.match ??
                match.value ??
                match.percentage;

            const numberMatch = Number(objectMatch);

            return Number.isFinite(numberMatch)
                ? numberMatch
                : null;

        }

        const numberMatch = Number(match);

        return Number.isFinite(numberMatch)
            ? numberMatch
            : null;

    };

    const recommendationMap = useMemo(() => {

        const map = new Map();

        recommendedJobs.forEach((recommendedJob) => {

            const id = getJobId(recommendedJob);

            if (!id) {
                return;
            }

            const score =
                getRecommendationMatchValue(
                    recommendedJob
                );

            map.set(
                id,
                score
            );

        });

        return map;

    }, [recommendedJobs]);

    const isAiRecommended = (job) => {

        const id = getJobId(job);

        return Boolean(
            id &&
            recommendationMap.has(id)
        );

    };

    const getAiMatchScore = (job) => {

        const id = getJobId(job);

        if (!id || !recommendationMap.has(id)) {
            return null;
        }

        return recommendationMap.get(id);

    };

    // ============================================================
    // FILTER AND SORT JOBS
    // ============================================================

    const filteredJobs = useMemo(() => {

        let result = [...jobsData];

        // ========================================================
        // KEYWORD SEARCH
        // ========================================================

        if (keyword.trim()) {

            const search =
                keyword
                    .toLowerCase()
                    .trim();

            result = result.filter(
                (job) => {

                    const title =
                        getDisplayValue(
                            job?.title ||
                            job?.jobTitle,
                            ""
                        ).toLowerCase();

                    const company =
                        getDisplayValue(
                            job?.company ||
                            job?.companyName,
                            ""
                        ).toLowerCase();

                    const description =
                        getDisplayValue(
                            job?.description,
                            ""
                        ).toLowerCase();

                    const skills =
                        Array.isArray(
                            job?.skills
                        )
                            ? job.skills
                            : [];

                    return (

                        title.includes(search) ||

                        company.includes(search) ||

                        description.includes(search) ||

                        skills.some(
                            (skill) =>
                                getDisplayValue(
                                    skill,
                                    ""
                                )
                                    .toLowerCase()
                                    .includes(search)
                        )

                    );

                }
            );

        }

        // ========================================================
        // LOCATION
        // ========================================================

        if (location.trim()) {

            const searchLocation =
                location
                    .toLowerCase()
                    .trim();

            result = result.filter(
                (job) => {

                    const jobLocation =
                        getDisplayValue(
                            job?.location,
                            ""
                        ).toLowerCase();

                    return jobLocation.includes(
                        searchLocation
                    );

                }
            );

        }

        // ========================================================
        // JOB TYPE
        // ========================================================

        if (jobType !== "All") {

            result = result.filter(
                (job) => {

                    const type =
                        getDisplayValue(
                            job?.type ||
                            job?.jobType ||
                            job?.employmentType,
                            ""
                        );

                    return (
                        type.toLowerCase() ===
                        jobType.toLowerCase()
                    );

                }
            );

        }

        // ========================================================
        // EXPERIENCE
        // ========================================================

        if (experience !== "All") {

            result = result.filter(
                (job) => {

                    const jobExperience =
                        getDisplayValue(
                            job?.experience ||
                            job?.experienceLevel,
                            ""
                        );

                    return (
                        jobExperience.toLowerCase() ===
                        experience.toLowerCase()
                    );

                }
            );

        }

        // ========================================================
        // WORK MODE
        // ========================================================

        if (workMode !== "All") {

            result = result.filter(
                (job) => {

                    const mode =
                        getDisplayValue(
                            job?.mode ||
                            job?.workMode,
                            ""
                        );

                    return (
                        mode.toLowerCase() ===
                        workMode.toLowerCase()
                    );

                }
            );

        }

        // ========================================================
        // SORT
        // ========================================================

        if (sortBy === "AI Match") {

            result.sort(
                (a, b) => {

                    const matchA =
                        getAiMatchScore(a) ??
                        0;

                    const matchB =
                        getAiMatchScore(b) ??
                        0;

                    return (
                        matchB - matchA
                    );

                }
            );

        }

        if (sortBy === "Newest") {

            result.sort(
                (a, b) => {

                    const dateA =
                        new Date(
                            a?.createdAt || 0
                        ).getTime();

                    const dateB =
                        new Date(
                            b?.createdAt || 0
                        ).getTime();

                    return (
                        dateB - dateA
                    );

                }
            );

        }

        return result;

    }, [
        jobsData,
        recommendedJobs,
        recommendationMap,
        keyword,
        location,
        jobType,
        experience,
        workMode,
        sortBy,
    ]);

    // ============================================================
    // RESET PAGE WHEN SEARCH/FILTER CHANGES
    // ============================================================

    useEffect(() => {

        setCurrentPage(1);

    }, [
        keyword,
        location,
        jobType,
        experience,
        workMode,
        sortBy,
    ]);

    // ============================================================
    // PAGINATION CALCULATIONS
    // ============================================================

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                filteredJobs.length /
                JOBS_PER_PAGE
            )
        );

    // ============================================================
    // PROTECT CURRENT PAGE
    // ============================================================

    useEffect(() => {

        if (
            currentPage > totalPages
        ) {

            setCurrentPage(
                totalPages
            );

        }

    }, [
        currentPage,
        totalPages,
    ]);

    // ============================================================
    // CURRENT PAGE JOBS
    // ============================================================

    const currentJobs = useMemo(() => {

        const startIndex =
            (
                currentPage - 1
            ) *
            JOBS_PER_PAGE;

        const endIndex =
            startIndex +
            JOBS_PER_PAGE;

        return filteredJobs.slice(
            startIndex,
            endIndex
        );

    }, [
        filteredJobs,
        currentPage,
    ]);

    // ============================================================
    // PAGINATION HANDLERS
    // ============================================================

    const goToPage = (page) => {

        const safePage =
            Math.min(
                Math.max(
                    1,
                    page
                ),
                totalPages
            );

        setCurrentPage(
            safePage
        );

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });

    };

    const goToPreviousPage = () => {

        if (currentPage > 1) {

            goToPage(
                currentPage - 1
            );

        }

    };

    const goToNextPage = () => {

        if (
            currentPage <
            totalPages
        ) {

            goToPage(
                currentPage + 1
            );

        }

    };

    // ============================================================
    // PAGINATION BUTTONS
    // ============================================================

    const paginationItems = useMemo(() => {

        const pages = [];

        if (totalPages <= 7) {

            for (
                let page = 1;
                page <= totalPages;
                page++
            ) {

                pages.push(page);

            }

            return pages;

        }

        pages.push(1);

        if (currentPage > 4) {

            pages.push("left-dots");

        }

        const start =
            Math.max(
                2,
                currentPage - 1
            );

        const end =
            Math.min(
                totalPages - 1,
                currentPage + 1
            );

        for (
            let page = start;
            page <= end;
            page++
        ) {

            pages.push(page);

        }

        if (
            currentPage <
            totalPages - 3
        ) {

            pages.push("right-dots");

        }

        pages.push(
            totalPages
        );

        return pages;

    }, [
        currentPage,
        totalPages,
    ]);

    // ============================================================
    // COMPANY INITIAL
    // ============================================================

    const getCompanyInitial = (
        company
    ) => {

        const companyName =
            getDisplayValue(
                company,
                "Company"
            );

        return companyName
            .charAt(0)
            .toUpperCase();

    };

    // ============================================================
    // LOADING
    // ============================================================

    if (loadingJobs) {

        return (

            <div className="find-jobs-page">

                <main className="findjobs-main">

                    <div className="jobs-loading">

                        <div className="loading-spinner"></div>

                        <h3>
                            Loading jobs...
                        </h3>

                        <p>
                            Finding the latest jobs
                            posted by recruiters.
                        </p>

                    </div>

                </main>

            </div>

        );

    }

    // ============================================================
    // RENDER
    // ============================================================

    return (

        <div className="find-jobs-page">

            {/* ======================================================
                MAIN CONTENT
            ======================================================= */}

            <main className="findjobs-main">

                {/* ====================================================
                    PAGE HERO
                ===================================================== */}

                <section className="findjobs-hero">

                    <div className="findjobs-hero-content">

                        <span className="hero-kicker">
                            AI-POWERED JOB DISCOVERY
                        </span>

                        <h1>

                            Find your next

                            <span>
                                {" "}opportunity.
                            </span>

                        </h1>

                        <p>

                            Search jobs posted by recruiters
                            and let TalentIQ's AI match you
                            with opportunities that fit your
                            skills, experience and career goals.

                        </p>

                    </div>

                    <div className="hero-stat">

                        <strong>
                            {jobsData.length}+
                        </strong>

                        <span>
                            Recruiter Jobs
                        </span>

                        <small>
                            All recruiter posted
                        </small>

                    </div>

                </section>

                {/* ====================================================
                    SEARCH BOX
                ===================================================== */}

                <section className="job-search-section">

                    <div className="search-input-group">

                        <span className="search-icon">
                            🔍
                        </span>

                        <div>

                            <label>
                                Job title, skill or company
                            </label>

                            <input
                                type="text"
                                placeholder="e.g. React Developer, Software Engineer"
                                value={keyword}
                                onChange={(e) =>
                                    setKeyword(
                                        e.target.value
                                    )
                                }
                            />

                        </div>

                    </div>

                    <div className="search-divider"></div>

                    <div className="search-input-group">

                        <span className="search-icon">
                            📍
                        </span>

                        <div>

                            <label>
                                Location
                            </label>

                            <input
                                type="text"
                                placeholder="e.g. Chennai, Bangalore"
                                value={location}
                                onChange={(e) =>
                                    setLocation(
                                        e.target.value
                                    )
                                }
                            />

                        </div>

                    </div>

                    <button
                        className="main-search-button"
                        type="button"
                        onClick={() =>
                            setCurrentPage(1)
                        }
                    >
                        Search Jobs
                    </button>

                </section>

                {/* ====================================================
                    FILTER BAR
                ===================================================== */}

                <section className="filter-bar">

                    <div className="filter-left">

                        <button
                            type="button"
                            className="filter-toggle"
                            onClick={() =>
                                setShowFilters(
                                    !showFilters
                                )
                            }
                        >
                            ⚙ Filters
                        </button>

                        {/* JOB TYPE */}

                        <select
                            value={jobType}
                            onChange={(e) =>
                                setJobType(
                                    e.target.value
                                )
                            }
                        >

                            <option value="All">
                                Job Type
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

                        {/* EXPERIENCE */}

                        <select
                            value={experience}
                            onChange={(e) =>
                                setExperience(
                                    e.target.value
                                )
                            }
                        >

                            <option value="All">
                                Experience
                            </option>

                            <option value="Fresher">
                                Fresher
                            </option>

                            <option value="0-2 Years">
                                0-2 Years
                            </option>

                            <option value="1-2 YRS">
                                1-2 YRS
                            </option>

                            <option value="2-5 Years">
                                2-5 Years
                            </option>

                            <option value="5+ Years">
                                5+ Years
                            </option>

                        </select>

                        {/* WORK MODE */}

                        <select
                            value={workMode}
                            onChange={(e) =>
                                setWorkMode(
                                    e.target.value
                                )
                            }
                        >

                            <option value="All">
                                Work Mode
                            </option>

                            <option value="Remote">
                                Remote
                            </option>

                            <option value="Hybrid">
                                Hybrid
                            </option>

                            <option value="On-site">
                                On-site
                            </option>

                        </select>

                        {/* CLEAR */}

                        <button
                            type="button"
                            className="clear-filter"
                            onClick={
                                clearFilters
                            }
                        >
                            Clear
                        </button>

                    </div>

                    {/* SORT */}

                    <div className="sort-area">

                        <span>
                            Sort by
                        </span>

                        <select
                            value={sortBy}
                            onChange={(e) =>
                                setSortBy(
                                    e.target.value
                                )
                            }
                        >

                            <option value="AI Match">
                                AI Match
                            </option>

                            <option value="Newest">
                                Newest
                            </option>

                        </select>

                    </div>

                </section>

                {/* ====================================================
                    MOBILE FILTERS
                ===================================================== */}

                {showFilters && (

                    <div className="mobile-filter-panel">

                        <div>

                            <label>
                                Job Type
                            </label>

                            <select
                                value={jobType}
                                onChange={(e) =>
                                    setJobType(
                                        e.target.value
                                    )
                                }
                            >

                                <option value="All">
                                    All
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

                        <div>

                            <label>
                                Experience
                            </label>

                            <select
                                value={experience}
                                onChange={(e) =>
                                    setExperience(
                                        e.target.value
                                    )
                                }
                            >

                                <option value="All">
                                    All
                                </option>

                                <option value="Fresher">
                                    Fresher
                                </option>

                                <option value="0-2 Years">
                                    0-2 Years
                                </option>

                                <option value="1-2 YRS">
                                    1-2 YRS
                                </option>

                                <option value="2-5 Years">
                                    2-5 Years
                                </option>

                                <option value="5+ Years">
                                    5+ Years
                                </option>

                            </select>

                        </div>

                        <div>

                            <label>
                                Work Mode
                            </label>

                            <select
                                value={workMode}
                                onChange={(e) =>
                                    setWorkMode(
                                        e.target.value
                                    )
                                }
                            >

                                <option value="All">
                                    All
                                </option>

                                <option value="Remote">
                                    Remote
                                </option>

                                <option value="Hybrid">
                                    Hybrid
                                </option>

                                <option value="On-site">
                                    On-site
                                </option>

                            </select>

                        </div>

                    </div>

                )}

                {/* ====================================================
                    CONTENT LAYOUT
                ===================================================== */}

                <section className="jobs-layout">

                    {/* ==================================================
                        LEFT COLUMN
                    =================================================== */}

                    <div className="jobs-main-column">

                        {/* RESULTS HEADER */}

                        <div className="results-header">

                            <div>

                                <h2>
                                    Recruiter Jobs
                                </h2>

                                <p>

                                    {filteredJobs.length}

                                    {" "}opportunities
                                    matching your search

                                </p>

                            </div>

                            <span className="ai-powered-label">
                                ✨ AI Powered
                            </span>

                        </div>

                        {/* AI MATCH INFO */}

                        <div className="ai-match-banner">

                            <div className="ai-banner-icon">
                                ✨
                            </div>

                            <div>

                                <strong>
                                    TalentIQ AI is matching jobs for you
                                </strong>

                                <p>

                                    All recruiter-posted jobs are shown below.
                                    AI MATCH highlights only the jobs that
                                    match your profile and resume.

                                    {!loadingRecommendations &&
                                        recommendedJobs.length > 0 && (
                                            <> {recommendedJobs.length} AI-matched job{recommendedJobs.length === 1 ? "" : "s"} found.</>
                                        )}

                                </p>

                            </div>

                            <Link to="/recommendations">
                                View AI Insights →
                            </Link>

                        </div>

                        {/* ERROR */}

                        {!fetchError && recommendationError && (

                            <div className="jobs-fetch-error">

                                <div className="error-icon">
                                    ✨
                                </div>

                                <div>

                                    <strong>
                                        AI matching is temporarily unavailable
                                    </strong>

                                    <p>
                                        All recruiter jobs are still displayed. AI MATCH will appear when recommendations are available.
                                    </p>

                                </div>

                            </div>

                        )}

                        {fetchError && (

                            <div className="jobs-fetch-error">

                                <div className="error-icon">
                                    !
                                </div>

                                <div>

                                    <strong>
                                        Unable to load jobs
                                    </strong>

                                    <p>
                                        {fetchError}
                                    </p>

                                </div>

                            </div>

                        )}

                        {/* ==================================================
                            JOB LIST
                        =================================================== */}

                        {!fetchError && (

                            <div className="jobs-list">

                                {currentJobs.length > 0 ? (

                                    currentJobs.map(
                                        (job) => {

                                            const jobId =
                                                getJobId(job);

                                            const company =
                                                getDisplayValue(
                                                    job?.company ||
                                                    job?.companyName,
                                                    "Company"
                                                );

                                            const title =
                                                getDisplayValue(
                                                    job?.title ||
                                                    job?.jobTitle,
                                                    "Job Position"
                                                );

                                            const jobLocation =
                                                getDisplayValue(
                                                    job?.location,
                                                    "Location not specified"
                                                );

                                            const type =
                                                getDisplayValue(
                                                    job?.type ||
                                                    job?.jobType ||
                                                    job?.employmentType,
                                                    "Full Time"
                                                );

                                            const experienceText =
                                                getDisplayValue(
                                                    job?.experience ||
                                                    job?.experienceLevel,
                                                    "Fresher"
                                                );

                                            const salary =
                                                getDisplayValue(
                                                    job?.salary ||
                                                    job?.salaryRange ||
                                                    job?.ctc,
                                                    "Salary not specified"
                                                );

                                            const mode =
                                                getDisplayValue(
                                                    job?.mode ||
                                                    job?.workMode,
                                                    "On-site"
                                                );

                                            const isSaved =
                                                savedJobs.includes(
                                                    jobId
                                                );

                                            return (

                                                <article
                                                    className="find-job-card"
                                                    key={jobId}
                                                >

                                                    {/* =================================================
                                                        CARD TOP
                                                    ================================================= */}

                                                    <div className="job-card-header">

                                                        {/* COMPANY LOGO */}

                                                        <div className="company-logo-large">

                                                            {getCompanyInitial(
                                                                company
                                                            )}

                                                        </div>

                                                        {/* TITLE + COMPANY */}

                                                        <div className="find-job-title">

                                                            <h3>
                                                                {title}
                                                            </h3>

                                                            <span>
                                                                {company}
                                                            </span>

                                                        </div>

                                                        {/* AI MATCH - ONLY FOR AI RECOMMENDED JOBS */}

                                                        {isAiRecommended(job) && (

                                                            <div className="job-match">

                                                                <strong>

                                                                    {getAiMatchScore(job) !== null
                                                                        ? `${getAiMatchScore(job)}%`
                                                                        : "AI"}

                                                                </strong>

                                                                <span>
                                                                    AI Match
                                                                </span>

                                                            </div>

                                                        )}

                                                        {/* SAVE */}

                                                        <button
                                                            type="button"
                                                            className={`save-button ${
                                                                isSaved
                                                                    ? "saved"
                                                                    : ""
                                                            }`}
                                                            onClick={() =>
                                                                toggleSave(
                                                                    jobId
                                                                )
                                                            }
                                                            title={
                                                                isSaved
                                                                    ? "Remove Saved Job"
                                                                    : "Save Job"
                                                            }
                                                        >

                                                            {isSaved
                                                                ? "♥"
                                                                : "♡"}

                                                        </button>

                                                    </div>

                                                    {/* =================================================
                                                        JOB INFORMATION
                                                    ================================================= */}

                                                    <div className="job-information">

                                                        <span>
                                                            📍 {jobLocation}
                                                        </span>

                                                        <span>
                                                            💼 {type}
                                                        </span>

                                                        <span>
                                                            🎓 {experienceText}
                                                        </span>

                                                        <span>
                                                            💰 {salary}
                                                        </span>

                                                        <span>
                                                            🏢 {mode}
                                                        </span>

                                                    </div>

                                                    {/* =================================================
                                                        CARD FOOTER
                                                    ================================================= */}

                                                    <div className="job-card-footer">

                                                        {isAiRecommended(job) && (

                                                            <span className="job-card-ai-label">
                                                                ✨ AI matched opportunity
                                                            </span>

                                                        )}

                                                        <div className="job-card-actions">

                                                            {/* VIEW DETAILS */}

                                                            <Link
                                                                to={`/jobs/${jobId}`}
                                                                className="view-job-button"
                                                            >
                                                                View Details
                                                            </Link>

                                                            {/* APPLY */}

                                                            <Link
                                                                to={`/apply/${jobId}`}
                                                                className="apply-button"
                                                            >
                                                                Apply Now →
                                                            </Link>

                                                        </div>

                                                    </div>

                                                </article>

                                            );

                                        }
                                    )

                                ) : (

                                    <div className="no-jobs">

                                        <div>
                                            🔍
                                        </div>

                                        <h3>
                                            No jobs found
                                        </h3>

                                        <p>

                                            No recruiter jobs match
                                            your current search or
                                            filters.

                                        </p>

                                        <button
                                            type="button"
                                            onClick={
                                                clearFilters
                                            }
                                        >
                                            Clear All Filters
                                        </button>

                                    </div>

                                )}

                            </div>

                        )}

                        {/* ==================================================
                            PAGINATION
                        =================================================== */}

                        {!fetchError &&
                            filteredJobs.length > 0 && (

                                <div className="pagination">

                                    {/* PREVIOUS */}

                                    <button
                                        type="button"
                                        className="pagination-arrow"
                                        disabled={
                                            currentPage === 1
                                        }
                                        onClick={
                                            goToPreviousPage
                                        }
                                        aria-label="Previous page"
                                    >
                                        ←
                                    </button>

                                    {/* PAGE NUMBERS */}

                                    {paginationItems.map(
                                        (item, index) => {

                                            if (
                                                item ===
                                                "left-dots" ||
                                                item ===
                                                "right-dots"
                                            ) {

                                                return (

                                                    <span
                                                        key={`${item}-${index}`}
                                                        className="pagination-dots"
                                                    >
                                                        ...
                                                    </span>

                                                );

                                            }

                                            return (

                                                <button
                                                    key={item}
                                                    type="button"
                                                    className={
                                                        currentPage ===
                                                        item
                                                            ? "active"
                                                            : ""
                                                    }
                                                    onClick={() =>
                                                        goToPage(
                                                            item
                                                        )
                                                    }
                                                >
                                                    {item}
                                                </button>

                                            );

                                        }
                                    )}

                                    {/* NEXT */}

                                    <button
                                        type="button"
                                        className="pagination-arrow"
                                        disabled={
                                            currentPage ===
                                            totalPages
                                        }
                                        onClick={
                                            goToNextPage
                                        }
                                        aria-label="Next page"
                                    >
                                        →
                                    </button>

                                </div>

                            )}

                        {/* ==================================================
                            PAGINATION INFORMATION
                        =================================================== */}

                        {!fetchError &&
                            filteredJobs.length > 0 && (

                                <div className="pagination-info">

                                    Showing{" "}

                                    <strong>
                                        {
                                            (
                                                (
                                                    currentPage -
                                                    1
                                                ) *
                                                JOBS_PER_PAGE
                                            ) + 1
                                        }
                                    </strong>

                                    {" "}-

                                    <strong>
                                        {Math.min(
                                            currentPage *
                                            JOBS_PER_PAGE,
                                            filteredJobs.length
                                        )}
                                    </strong>

                                    {" "}of{" "}

                                    <strong>
                                        {filteredJobs.length}
                                    </strong>

                                    {" "}jobs

                                </div>

                            )}

                    </div>

                    {/* ==================================================
                        RIGHT SIDEBAR
                    =================================================== */}

                    <aside className="jobs-sidebar">

                        {/* PROFILE MATCH */}

                        <div className="sidebar-card profile-match-card">

                            <div className="sidebar-card-heading">

                                <div>

                                    <span className="sidebar-kicker">
                                        AI ANALYSIS
                                    </span>

                                    <h3>
                                        Your Profile Match
                                    </h3>

                                </div>

                                <span className="sparkle">
                                    ✨
                                </span>

                            </div>

                            <div className="profile-match-circle">

                                <strong>

                                    {loadingProfile
                                        ? "..."
                                        : `${profileCompletion}%`}

                                </strong>

                                <span>
                                    Match
                                </span>

                            </div>

                            <p>
                                {profileMessage}
                            </p>

                            <Link
                                to="/profile"
                                className="sidebar-primary-button"
                            >
                                Improve Profile
                            </Link>

                        </div>

                        {/* POPULAR SEARCHES */}

                        <div className="sidebar-card">

                            <div className="sidebar-title-row">

                                <h3>
                                    Popular Searches
                                </h3>

                                <span>
                                    🔥
                                </span>

                            </div>

                            <div className="popular-searches">

                                <button
                                    type="button"
                                    onClick={() =>
                                        setKeyword(
                                            "React Developer"
                                        )
                                    }
                                >

                                    React Developer

                                    <span>
                                        1.2k
                                    </span>

                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setKeyword(
                                            "Software Engineer"
                                        )
                                    }
                                >

                                    Software Engineer

                                    <span>
                                        980
                                    </span>

                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setKeyword(
                                            "Frontend Developer"
                                        )
                                    }
                                >

                                    Frontend Developer

                                    <span>
                                        760
                                    </span>

                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setKeyword(
                                            "MERN Developer"
                                        )
                                    }
                                >

                                    MERN Developer

                                    <span>
                                        540
                                    </span>

                                </button>

                            </div>

                        </div>

                        {/* JOB ALERT */}

                        <div className="sidebar-card alert-card">

                            <div className="alert-icon">
                                🔔
                            </div>

                            <h3>
                                Never miss a job
                            </h3>

                            <p>
                                Get notified when new jobs
                                matching your profile are posted.
                            </p>

                            <Link
                                to="/job-alerts"
                                className="job-alert-link"
                            >
                                Create Job Alert
                            </Link>

                        </div>

                        {/* TRENDING SKILLS */}

                        <div className="sidebar-card">

                            <div className="sidebar-title-row">

                                <h3>
                                    Trending Skills
                                </h3>

                                <span>
                                    📈
                                </span>

                            </div>

                            <div className="trending-skills-list">

                                <div>

                                    <span>
                                        React
                                    </span>

                                    <strong>
                                        +24%
                                    </strong>

                                </div>

                                <div>

                                    <span>
                                        Node.js
                                    </span>

                                    <strong>
                                        +21%
                                    </strong>

                                </div>

                                <div>

                                    <span>
                                        TypeScript
                                    </span>

                                    <strong>
                                        +19%
                                    </strong>

                                </div>

                                <div>

                                    <span>
                                        AWS
                                    </span>

                                    <strong>
                                        +17%
                                    </strong>

                                </div>

                                <div>

                                    <span>
                                        Python
                                    </span>

                                    <strong>
                                        +15%
                                    </strong>

                                </div>

                            </div>

                        </div>

                    </aside>

                </section>

            </main>

            {/* ======================================================
                FOOTER
            ======================================================= */}

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

                                Talent

                                <span>
                                    IQ
                                </span>

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
                                <FaXTwitter />
                            </a>

                        </div>

                    </div>

                    {/* CANDIDATES */}

                    <div className="footer-column">

                        <h4>
                            For Candidates
                        </h4>

                        <Link to="/find-jobs">
                            Find Jobs
                        </Link>

                        <Link to="/recommendations">
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
                        © {new Date().getFullYear()} TalentIQ.
                        All rights reserved.
                    </span>

                    <span>
                        Built with AI to help you find the right career.
                    </span>

                </div>

            </footer>

        </div>

    );

}

export default FindJobs;