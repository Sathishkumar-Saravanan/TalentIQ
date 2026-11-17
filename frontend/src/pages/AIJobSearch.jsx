  import React, { useMemo, useRef, useState } from "react";
  import { useNavigate } from "react-router-dom";

  import {
    FaArrowRight,
    FaBriefcase,
    FaCheckCircle,
    FaClock,
    FaExternalLinkAlt,
    FaGithub,
    FaInstagram,
    FaLaptop,
    FaLinkedinIn,
    FaMagic,
    FaMapMarkerAlt,
    FaSearch,
    FaTwitter,
  } from "react-icons/fa";

  import "../styles/AIJobSearch.css";

  const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000";

  const AIJobSearch = () => {
    const navigate = useNavigate();
    const searchSectionRef = useRef(null);

    const [searchData, setSearchData] = useState({
      keyword: "",
      location: "",
      experience: "",
      jobType: "",
      workMode: "",
    });

    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [jobs, setJobs] = useState([]);
    const [error, setError] = useState("");

    /*
    ============================================================
    TOKEN
    ============================================================
    */

    const getToken = () => {
      return (
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("token")
      );
    };

    /*
    ============================================================
    CHANGE INPUT
    ============================================================
    */

    const handleChange = (e) => {
      const { name, value } = e.target;

      setSearchData((previous) => ({
        ...previous,
        [name]: value,
      }));
    };

    /*
    ============================================================
    SEARCH
    ============================================================
    */

    const handleSearch = async (e) => {
      e.preventDefault();

      if (!searchData.keyword.trim()) {
        setError(
          "Please enter a job title, skill or keyword."
        );
        setSearched(false);
        return;
      }

      const token = getToken();

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        setSearched(false);
        setError("");
        setJobs([]);

        const params = new URLSearchParams();

        params.set(
          "keyword",
          searchData.keyword.trim()
        );

        if (searchData.location.trim()) {
          params.set(
            "location",
            searchData.location.trim()
          );
        }

        if (searchData.experience) {
          params.set(
            "experience",
            searchData.experience
          );
        }

        if (searchData.jobType) {
          params.set(
            "jobType",
            searchData.jobType
          );
        }

        if (searchData.workMode) {
          params.set(
            "workMode",
            searchData.workMode
          );
        }

        const response = await fetch(
          `${API_URL}/api/ai-job-search?${params.toString()}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("authToken");
          localStorage.removeItem("accessToken");

          navigate("/login");
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to perform AI job search."
          );
        }

        setJobs(
          Array.isArray(data.jobs)
            ? data.jobs
            : []
        );

        setSearched(true);
      } catch (err) {
        console.error(
          "AI Job Search Error:",
          err
        );

        setError(
          err.message ||
            "Unable to connect to TalentIQ server."
        );

        setJobs([]);
        setSearched(true);
      } finally {
        setLoading(false);
      }
    };

    /*
    ============================================================
    SUGGESTION
    ============================================================
    */

    const handleSuggestion = (value) => {
      setSearchData((previous) => ({
        ...previous,
        keyword: value,
      }));

      setError("");

      setTimeout(() => {
        searchSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 50);
    };

    /*
    ============================================================
    NORMALIZE VALUE
    ============================================================
    */

    const displayValue = (
      value,
      fallback = "Not specified"
    ) => {
      if (
        value === null ||
        value === undefined
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
        return value.join(", ");
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

      return fallback;
    };

    /*
    ============================================================
    NORMALIZED JOBS
    ============================================================
    */

    const normalizedJobs = useMemo(() => {
      return jobs.map((job) => {
        const company =
          displayValue(
            job.companyName ||
              job.company ||
              job.recruiterCompany,
            "Company"
          );

        const title =
          displayValue(
            job.title ||
              job.role ||
              job.position,
            "Job Opportunity"
          );

        const skills = Array.isArray(
          job.skills
        )
          ? job.skills
          : Array.isArray(
              job.requiredSkills
            )
          ? job.requiredSkills
          : [];

        return {
          ...job,

          id:
            job._id ||
            job.id,

          title,

          company,

          location:
            displayValue(
              job.location ||
                job.jobLocation
            ),

          experience:
            displayValue(
              job.experience ||
                job.experienceRequired ||
                job.experienceLevel
            ),

          type:
            displayValue(
              job.jobType ||
                job.type ||
                job.employmentType,
              "Full Time"
            ),

          mode:
            displayValue(
              job.workMode ||
                job.mode ||
                job.remotePreference
            ),

          salary:
            displayValue(
              job.salary ||
                job.salaryRange ||
                job.package,
              "Salary not disclosed"
            ),

          skills: skills.map((skill) =>
            displayValue(skill)
          ),

          matchingSkills:
            Array.isArray(
              job.matchingSkills
            )
              ? job.matchingSkills
              : [],

          missingSkills:
            Array.isArray(
              job.missingSkills
            )
              ? job.missingSkills
              : [],

          matchScore:
            Number(
              job.matchScore ??
                job.match ??
                job.aiScore ??
                0
            ),

          matchReason:
            job.matchReason ||
            job.reason ||
            "This opportunity has been ranked according to your search and profile.",
        };
      });
    }, [jobs]);

    /*
    ============================================================
    STATS
    ============================================================
    */

    const averageMatch = useMemo(() => {
      if (!normalizedJobs.length) {
        return 0;
      }

      const total =
        normalizedJobs.reduce(
          (sum, job) =>
            sum +
            Number(job.matchScore || 0),
          0
        );

      return Math.round(
        total / normalizedJobs.length
      );
    }, [normalizedJobs]);

    const bestMatch = useMemo(() => {
      if (!normalizedJobs.length) {
        return 0;
      }

      return Math.max(
        ...normalizedJobs.map(
          (job) =>
            Number(job.matchScore) || 0
        )
      );
    }, [normalizedJobs]);

    /*
    ============================================================
    VIEW JOB
    ============================================================
    */

    const handleViewJob = (job) => {
      if (!job.id) {
        navigate("/find-jobs");
        return;
      }

      navigate(
        `/find-jobs?jobId=${encodeURIComponent(
          job.id
        )}`
      );
    };

    /*
    ============================================================
    APPLY
    ============================================================
    */

    const handleApply = (job) => {
      if (!job.id) {
        navigate("/applications");
        return;
      }

      navigate("/apply", {
        state: {
          jobId: job.id,
          job,
        },
      });
    };

    /*
    ============================================================
    RENDER
    ============================================================
    */

    return (
      <div className="ai-job-search-page">

        {/* =====================================================
            HERO
        ===================================================== */}

        <section className="ai-search-hero">

          <div className="ai-hero-badge">
            <FaMagic />
            <span>
              AI POWERED JOB DISCOVERY
            </span>
          </div>

          <h1>
            Find Jobs That
            <span> Actually Fit You</span>
          </h1>

          <p>
            Search smarter with TalentIQ. Our AI
            evaluates your search criteria together
            with your profile and resume to rank
            relevant recruiter opportunities.
          </p>

        </section>

        {/* =====================================================
            SEARCH
        ===================================================== */}

        <section
          className="ai-search-container"
          ref={searchSectionRef}
        >

          <div className="ai-search-card">

            <div className="search-card-header">

              <div>
                <h2>
                  AI Job Search
                </h2>

                <p>
                  Tell us what you are looking for
                  and TalentIQ will rank relevant jobs.
                </p>
              </div>

              <div className="ai-status">
                <span className="status-dot"></span>
                AI Matching Engine
              </div>

            </div>

            <form onSubmit={handleSearch}>

              <div className="search-fields">

                {/* KEYWORD */}

                <div className="search-field search-field-large">

                  <label>
                    Job Title, Skills or Keywords
                  </label>

                  <div className="input-wrapper">

                    <FaSearch className="input-icon" />

                    <input
                      type="text"
                      name="keyword"
                      value={searchData.keyword}
                      onChange={handleChange}
                      placeholder="e.g. React Developer, MERN, Frontend"
                    />

                  </div>

                </div>

                {/* LOCATION */}

                <div className="search-field">

                  <label>
                    Location
                  </label>

                  <div className="input-wrapper">

                    <FaMapMarkerAlt className="input-icon" />

                    <input
                      type="text"
                      name="location"
                      value={searchData.location}
                      onChange={handleChange}
                      placeholder="Bangalore, Chennai..."
                    />

                  </div>

                </div>

                {/* EXPERIENCE */}

                <div className="search-field">

                  <label>
                    Experience
                  </label>

                  <div className="input-wrapper">

                    <FaClock className="input-icon" />

                    <select
                      name="experience"
                      value={searchData.experience}
                      onChange={handleChange}
                    >
                      <option value="">
                        Any Experience
                      </option>

                      <option value="Fresher">
                        Fresher
                      </option>

                      <option value="0-2 Years">
                        0-2 Years
                      </option>

                      <option value="1-3 Years">
                        1-3 Years
                      </option>

                      <option value="3-5 Years">
                        3-5 Years
                      </option>

                      <option value="5+ Years">
                        5+ Years
                      </option>

                    </select>

                  </div>

                </div>

                {/* JOB TYPE */}

                <div className="search-field">

                  <label>
                    Job Type
                  </label>

                  <div className="input-wrapper">

                    <FaBriefcase className="input-icon" />

                    <select
                      name="jobType"
                      value={searchData.jobType}
                      onChange={handleChange}
                    >
                      <option value="">
                        Any Job Type
                      </option>

                      <option value="Full Time">
                        Full Time
                      </option>

                      <option value="Part Time">
                        Part Time
                      </option>

                      <option value="Contract">
                        Contract
                      </option>

                      <option value="Internship">
                        Internship
                      </option>

                    </select>

                  </div>

                </div>

                {/* WORK MODE */}

                <div className="search-field">

                  <label>
                    Work Mode
                  </label>

                  <div className="input-wrapper">

                    <FaLaptop className="input-icon" />

                    <select
                      name="workMode"
                      value={searchData.workMode}
                      onChange={handleChange}
                    >
                      <option value="">
                        Any Work Mode
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

              </div>

              {error && (
                <div className="ai-search-error">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="ai-search-button"
                disabled={loading}
              >

                {loading ? (
                  <>
                    <span className="search-spinner"></span>
                    TalentIQ AI is searching...
                  </>
                ) : (
                  <>
                    <FaMagic />
                    Find AI Matched Jobs
                    <FaArrowRight />
                  </>
                )}

              </button>

            </form>

            <div className="search-suggestions">

              <span>
                Popular searches:
              </span>

              <button
                type="button"
                onClick={() =>
                  handleSuggestion(
                    "React Developer"
                  )
                }
              >
                React Developer
              </button>

              <button
                type="button"
                onClick={() =>
                  handleSuggestion(
                    "MERN Stack Developer"
                  )
                }
              >
                MERN Stack
              </button>

              <button
                type="button"
                onClick={() =>
                  handleSuggestion(
                    "Frontend Developer"
                  )
                }
              >
                Frontend Developer
              </button>

              <button
                type="button"
                onClick={() =>
                  handleSuggestion(
                    "Software Engineer"
                  )
                }
              >
                Software Engineer
              </button>

              <button
                type="button"
                onClick={() =>
                  handleSuggestion(
                    "JavaScript Developer"
                  )
                }
              >
                JavaScript
              </button>

            </div>

          </div>

        </section>

        {/* =====================================================
            STATS
        ===================================================== */}

        <section className="search-stats">

          <div className="stat-item">
            <strong>
              {searched
                ? normalizedJobs.length
                : "AI"}
            </strong>

            <span>
              {searched
                ? "Matching Jobs"
                : "Smart Search"}
            </span>
          </div>

          <div className="stat-divider"></div>

          <div className="stat-item">
            <strong>
              {searched
                ? `${bestMatch}%`
                : "360°"}
            </strong>

            <span>
              {searched
                ? "Best Match"
                : "Profile Analysis"}
            </span>
          </div>

          <div className="stat-divider"></div>

          <div className="stat-item">
            <strong>
              {searched
                ? `${averageMatch}%`
                : "AI"}
            </strong>

            <span>
              {searched
                ? "Average Match"
                : "Job Ranking"}
            </span>
          </div>

          <div className="stat-divider"></div>

          <div className="stat-item">
            <strong>
              24/7
            </strong>

            <span>
              Job Discovery
            </span>
          </div>

        </section>

        {/* =====================================================
            LOADING
        ===================================================== */}

        {loading && (
          <section className="ai-search-loading">

            <div className="loading-orbit">
              <FaMagic />
            </div>

            <h3>
              TalentIQ AI is finding your opportunities
            </h3>

            <p>
              Comparing your search, skills,
              experience and career preferences...
            </p>

          </section>
        )}

        {/* =====================================================
            RESULTS
        ===================================================== */}

        {searched && !loading && (
          <section className="job-results-section">

            <div className="results-header">

              <div>
                <span className="results-label">
                  TALENTIQ AI RESULTS
                </span>

                <h2>
                  AI Matched Jobs
                </h2>

                <p>
                  Jobs ranked according to your
                  search and available profile data.
                </p>
              </div>

              <div className="results-count">
                {normalizedJobs.length} Jobs Found
              </div>

            </div>

            {normalizedJobs.length === 0 ? (
              <div className="ai-empty-results">

                <div className="empty-result-icon">
                  <FaSearch />
                </div>

                <h3>
                  No matching jobs found
                </h3>

                <p>
                  Try another keyword, location or
                  remove one of the filters.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setSearchData((previous) => ({
                      ...previous,
                      location: "",
                      experience: "",
                      jobType: "",
                      workMode: "",
                    }));

                    searchSectionRef.current?.scrollIntoView({
                      behavior: "smooth",
                    });
                  }}
                >
                  Modify Search
                </button>

              </div>
            ) : (
              <div className="job-results">

                {normalizedJobs.map(
                  (job) => (
                    <article
                      className="job-result-card"
                      key={job.id}
                    >

                      <div className="job-card-top">

                        <div className="company-logo">
                          {job.company
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="job-main-info">

                          <div className="job-title-row">

                            <h3>
                              {job.title}
                            </h3>

                            <span className="ai-match-badge">
                              <FaMagic />
                              {job.matchScore}%
                            </span>

                          </div>

                          <p className="company-name">
                            {job.company}
                          </p>

                        </div>

                      </div>

                      <div className="job-details">

                        <span>
                          <FaMapMarkerAlt />
                          {job.location}
                        </span>

                        <span>
                          <FaClock />
                          {job.experience}
                        </span>

                        <span>
                          <FaBriefcase />
                          {job.type}
                        </span>

                        <span>
                          <FaLaptop />
                          {job.mode}
                        </span>

                      </div>

                      <div className="job-match-reason">

                        <FaCheckCircle />

                        <span>
                          {job.matchReason}
                        </span>

                      </div>

                      {job.matchingSkills.length > 0 && (
                        <div className="skill-analysis">

                          <div className="skill-analysis-title">
                            Matching Skills
                          </div>

                          <div className="job-skills matching">

                            {job.matchingSkills.map(
                              (skill, index) => (
                                <span
                                  key={`match-${index}`}
                                >
                                  <FaCheckCircle />
                                  {displayValue(skill)}
                                </span>
                              )
                            )}

                          </div>

                        </div>
                      )}

                      {job.missingSkills.length > 0 && (
                        <div className="skill-analysis missing-analysis">

                          <div className="skill-analysis-title">
                            Skills To Improve
                          </div>

                          <div className="job-skills missing">

                            {job.missingSkills
                              .slice(0, 6)
                              .map(
                                (skill, index) => (
                                  <span
                                    key={`missing-${index}`}
                                  >
                                    {displayValue(skill)}
                                  </span>
                                )
                              )}

                          </div>

                        </div>
                      )}

                      {job.skills.length > 0 && (
                        <div className="job-skills all-skills">

                          {job.skills
                            .slice(0, 8)
                            .map(
                              (skill, index) => (
                                <span
                                  key={`skill-${index}`}
                                >
                                  {displayValue(skill)}
                                </span>
                              )
                            )}

                        </div>
                      )}

                      <div className="job-actions">

                        <button
                          type="button"
                          className="view-job-button"
                          onClick={() =>
                            handleViewJob(job)
                          }
                        >
                          View Job
                          <FaExternalLinkAlt />
                        </button>

                        <button
                          type="button"
                          className="apply-job-button"
                          onClick={() =>
                            handleApply(job)
                          }
                        >
                          Apply Now
                          <FaArrowRight />
                        </button>

                      </div>

                    </article>
                  )
                )}

              </div>
            )}

          </section>
        )}

        {/* =====================================================
            AI FEATURES
        ===================================================== */}

        <section className="ai-features-section">

          <div className="section-heading">

            <span>
              SMARTER JOB SEARCH
            </span>

            <h2>
              More Than Just a Job Search
            </h2>

            <p>
              TalentIQ connects your search with
              your professional profile to make
              job discovery more relevant.
            </p>

          </div>

          <div className="ai-features">

            <div className="feature-card">

              <div className="feature-icon">
                <FaMagic />
              </div>

              <h3>
                AI Job Matching
              </h3>

              <p>
                Your skills and search criteria are
                compared with recruiter requirements
                to calculate a personalized match.
              </p>

            </div>

            <div className="feature-card">

              <div className="feature-icon">
                <FaBriefcase />
              </div>

              <h3>
                Profile-Aware Search
              </h3>

              <p>
                TalentIQ can use your profile,
                career preferences and resume skills
                when ranking available opportunities.
              </p>

            </div>

            <div className="feature-card">

              <div className="feature-icon">
                <FaClock />
              </div>

              <h3>
                Save Time
              </h3>

              <p>
                Stop scrolling through irrelevant
                listings. Focus on jobs with stronger
                relevance to your career.
              </p>

            </div>

          </div>

        </section>

        {/* =====================================================
            CATEGORIES
        ===================================================== */}

        <section className="job-categories">

          <div className="section-heading">

            <span>
              EXPLORE CAREERS
            </span>

            <h2>
              Popular Job Categories
            </h2>

            <p>
              Start with a role and let TalentIQ
              find relevant opportunities.
            </p>

          </div>

          <div className="category-grid">

            <button
              type="button"
              className="category-card"
              onClick={() =>
                handleSuggestion(
                  "Frontend Developer"
                )
              }
            >
              <div className="category-icon">
                <FaLaptop />
              </div>

              <h3>
                Frontend Development
              </h3>

              <p>
                React · JavaScript · HTML · CSS
              </p>

              <span>
                Search Jobs
                <FaArrowRight />
              </span>
            </button>

            <button
              type="button"
              className="category-card"
              onClick={() =>
                handleSuggestion(
                  "MERN Stack Developer"
                )
              }
            >
              <div className="category-icon">
                <FaBriefcase />
              </div>

              <h3>
                MERN Stack
              </h3>

              <p>
                MongoDB · Express · React · Node
              </p>

              <span>
                Search Jobs
                <FaArrowRight />
              </span>
            </button>

            <button
              type="button"
              className="category-card"
              onClick={() =>
                handleSuggestion(
                  "Software Engineer"
                )
              }
            >
              <div className="category-icon">
                <FaMagic />
              </div>

              <h3>
                Software Engineering
              </h3>

              <p>
                JavaScript · APIs · Git · Systems
              </p>

              <span>
                Search Jobs
                <FaArrowRight />
              </span>
            </button>

            <button
              type="button"
              className="category-card"
              onClick={() =>
                handleSuggestion(
                  "UI UX Designer"
                )
              }
            >
              <div className="category-icon">
                <FaLaptop />
              </div>

              <h3>
                UI/UX Design
              </h3>

              <p>
                Figma · Design · Research
              </p>

              <span>
                Search Jobs
                <FaArrowRight />
              </span>
            </button>

            <button
              type="button"
              className="category-card"
              onClick={() =>
                handleSuggestion(
                  "Data Analyst"
                )
              }
            >
              <div className="category-icon">
                <FaMagic />
              </div>

              <h3>
                Data & Analytics
              </h3>

              <p>
                SQL · Analytics · Power BI
              </p>

              <span>
                Search Jobs
                <FaArrowRight />
              </span>
            </button>

            <button
              type="button"
              className="category-card"
              onClick={() =>
                handleSuggestion(
                  "JavaScript Developer"
                )
              }
            >
              <div className="category-icon">
                <FaBriefcase />
              </div>

              <h3>
                JavaScript Development
              </h3>

              <p>
                JavaScript · React · Node.js
              </p>

              <span>
                Search Jobs
                <FaArrowRight />
              </span>
            </button>

          </div>

        </section>

        {/* =====================================================
            HOW AI WORKS
        ===================================================== */}

        <section className="how-ai-works">

          <div className="section-heading">

            <span>
              HOW IT WORKS
            </span>

            <h2>
              Your Career Search, Powered by AI
            </h2>

            <p>
              TalentIQ simplifies job discovery
              into three simple steps.
            </p>

          </div>

          <div className="steps-container">

            <div className="step-card">

              <div className="step-number">
                01
              </div>

              <h3>
                Tell Us What You Want
              </h3>

              <p>
                Enter your target role, skills,
                location and preferred work mode.
              </p>

            </div>

            <div className="step-line"></div>

            <div className="step-card">

              <div className="step-number">
                02
              </div>

              <h3>
                TalentIQ Analyzes
              </h3>

              <p>
                Your search is compared with
                available recruiter-posted jobs
                and your profile data.
              </p>

            </div>

            <div className="step-line"></div>

            <div className="step-card">

              <div className="step-number">
                03
              </div>

              <h3>
                Discover Better Matches
              </h3>

              <p>
                Receive ranked opportunities with
                transparent match and skill insights.
              </p>

            </div>

          </div>

        </section>

        {/* =====================================================
            WHY TALENTIQ
        ===================================================== */}

        <section className="why-talentiq">

          <div className="why-content">

            <span className="section-label">
              BUILT FOR YOUR CAREER
            </span>

            <h2>
              Stop Searching.
              <br />
              Start Finding.
            </h2>

            <p>
              Traditional job portals make you
              search through endless listings.
              TalentIQ helps prioritize jobs using
              your search criteria and professional
              information.
            </p>

            <div className="why-list">

              <div>
                <span>
                  <FaCheckCircle />
                </span>
                Personalized job matching
              </div>

              <div>
                <span>
                  <FaCheckCircle />
                </span>
                Skills-based relevance scoring
              </div>

              <div>
                <span>
                  <FaCheckCircle />
                </span>
                Resume-aware job discovery
              </div>

              <div>
                <span>
                  <FaCheckCircle />
                </span>
                Faster career discovery
              </div>

            </div>

          </div>

          <div className="ai-visual-card">

            <div className="visual-glow"></div>

            <div className="ai-circle">
              <FaMagic />
            </div>

            <h3>
              AI Career Intelligence
            </h3>

            <p>
              Connecting your skills with
              relevant opportunities.
            </p>

            <div className="visual-score">

              <span>
                {searched
                  ? `${bestMatch}%`
                  : "AI"}
              </span>

              <small>
                {searched
                  ? "BEST PROFILE MATCH"
                  : "SMART MATCHING"}
              </small>

            </div>

          </div>

        </section>

        {/* =====================================================
            CTA
        ===================================================== */}

        <section className="ai-search-cta">

          <div className="cta-content">

            <div className="cta-icon">
              <FaMagic />
            </div>

            <h2>
              Your Next Opportunity Could Be
              One Search Away.
            </h2>

            <p>
              Let TalentIQ analyze your search,
              skills and career preferences to
              discover relevant recruiter jobs.
            </p>

            <button
              type="button"
              onClick={() => {
                searchSectionRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
              }}
            >
              Start AI Job Search
              <FaArrowRight />
            </button>

          </div>

        </section>

        {/* =====================================================
    FOOTER
===================================================== */}

<footer className="talentiq-footer">

  <div className="footer-container">

    {/* =================================================
        FOOTER TOP
    ================================================= */}

    <div className="footer-top">

      {/* =================================================
          BRAND SECTION
      ================================================= */}

      <div className="footer-brand">

        <button
          type="button"
          className="footer-logo-button"
          onClick={() => navigate("/")}
          aria-label="Go to TalentIQ home"
        >
          <img
            src="/images/TalentIQ_Logo.png"
            alt="TalentIQ"
            className="footer-logo-image"
          />
        </button>

        <p className="footer-description">
          AI-powered career intelligence helping
          job seekers discover better opportunities
          and build stronger careers.
        </p>

        {/* SOCIAL MEDIA */}

        <div className="footer-socials">

          <a
            href="https://www.linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            className="footer-social-link"
          >
            <FaLinkedinIn />
          </a>

          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="footer-social-link"
          >
            <FaGithub />
          </a>

          <a
            href="https://www.instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="footer-social-link"
          >
            <FaInstagram />
          </a>

          <a
            href="https://x.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="X"
            className="footer-social-link"
          >
            <FaTwitter />
          </a>

        </div>

      </div>


      {/* =================================================
          PLATFORM
      ================================================= */}

      <div className="footer-column">

        <h4>Platform</h4>

        <button
          type="button"
          onClick={() => navigate("/")}
        >
          Home
        </button>

        <button
          type="button"
          onClick={() => navigate("/find-jobs")}
        >
          Find Jobs
        </button>

        <button
          type="button"
          onClick={() => navigate("/ai-recommendations")}
        >
          AI Recommendations
        </button>

        <button
          type="button"
          onClick={() => navigate("/ai-job-search")}
        >
          AI Job Search
        </button>

      </div>


      {/* =================================================
          CAREER
      ================================================= */}

      <div className="footer-column">

        <h4>Career</h4>

        <button
          type="button"
          onClick={() => navigate("/applications")}
        >
          Applications
        </button>

        <button
          type="button"
          onClick={() => navigate("/resume")}
        >
          Resume Builder
        </button>

        <button
          type="button"
          onClick={() => navigate("/profile")}
        >
          My Profile
        </button>

        <button
          type="button"
          onClick={() => navigate("/learning")}
        >
          Learning Path
        </button>

      </div>


      {/* =================================================
          TALENTIQ
      ================================================= */}

      <div className="footer-column">

        <h4>TalentIQ</h4>

        <button
          type="button"
          onClick={() => navigate("/about-talentiq")}
        >
          About Us
        </button>

        <button
          type="button"
          onClick={() => navigate("/about-talentiq")}
        >
          How It Works
        </button>

        <button
          type="button"
          onClick={() => navigate("/contact")}
        >
          Contact
        </button>

        <button
          type="button"
          onClick={() => navigate("/help-center")}
        >
          Help Center
        </button>

      </div>

    </div>


    {/* =================================================
        FOOTER BOTTOM
    ================================================= */}

    <div className="footer-bottom">

      <p>
        © 2026 TalentIQ. All rights reserved.
      </p>

      <div className="footer-bottom-links">

        <button
          type="button"
          onClick={() => navigate("/privacy-policy")}
        >
          Privacy Policy
        </button>

        <span className="footer-separator">
          |
        </span>

        <button
          type="button"
          onClick={() => navigate("/terms-conditions")}
        >
          Terms of Service
        </button>

      </div>

    </div>

  </div>

</footer>

      </div>
    );
  };

  export default AIJobSearch;