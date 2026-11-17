import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FaMagnifyingGlass,
  FaUsers,
  FaUserTie,
  FaBriefcase,
  FaLocationDot,
  FaEnvelope,
  FaPhone,
  FaFileLines,
  FaChartLine,
  FaArrowRight,
  FaXmark,
  FaRotate,
  FaFilter,
  FaCheck,
  FaClock,
  FaCalendarCheck,
  FaUserCheck,
  FaTriangleExclamation,
} from "react-icons/fa6";

import { useNavigate } from "react-router-dom";

import "../../styles/Candidates.css";

const API_URL = "http://localhost:5000";

const getToken = () => {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken") ||
    ""
  );
};

const getCandidateName = (candidate) => {
  if (!candidate) {
    return "Unknown Candidate";
  }

  return (
    candidate.fullName ||
    candidate.name ||
    candidate.username ||
    candidate.email ||
    "Unknown Candidate"
  );
};

const getCandidateId = (candidate) => {
  if (!candidate) {
    return "";
  }

  return (
    candidate._id ||
    candidate.id ||
    candidate.userId ||
    ""
  );
};

const getInitials = (name) => {
  if (!name) {
    return "C";
  }

  const words = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length >= 2) {
    return (
      words[0].charAt(0) +
      words[words.length - 1].charAt(0)
    ).toUpperCase();
  }

  return words[0]
    .substring(0, 2)
    .toUpperCase();
};

const getStatusClass = (status) => {
  switch (status) {
    case "Selected":
      return "candidate-status selected";

    case "Shortlisted":
      return "candidate-status shortlisted";

    case "Interview":
      return "candidate-status interview";

    case "Rejected":
      return "candidate-status rejected";

    case "Under Review":
      return "candidate-status review";

    case "Under Consideration":
      return "candidate-status consideration";

    case "No Longer Under Consideration":
      return "candidate-status rejected";

    default:
      return "candidate-status applied";
  }
};

const getATSClass = (score) => {
  const value = Number(score || 0);

  if (value >= 80) {
    return "ats-score excellent";
  }

  if (value >= 65) {
    return "ats-score good";
  }

  if (value >= 50) {
    return "ats-score moderate";
  }

  return "ats-score weak";
};

const getATSLabel = (score) => {
  const value = Number(score || 0);

  if (value >= 80) {
    return "Strong Match";
  }

  if (value >= 65) {
    return "Good Match";
  }

  if (value >= 50) {
    return "Moderate Match";
  }

  return "Low Match";
};

const formatDate = (date) => {
  if (!date) {
    return "Not available";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Not available";
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

const Candidates = () => {
  const navigate = useNavigate();

  const [applications, setApplications] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [atsFilter, setATSFilter] =
    useState("All");

  const [selectedCandidate, setSelectedCandidate] =
    useState(null);

  /* ============================================================
     FETCH RECRUITER APPLICATIONS
  ============================================================ */

  const fetchCandidates = async (
    showRefresh = false
  ) => {
    const token = getToken();

    if (!token) {
      setError(
        "Authentication token not found. Please login again."
      );

      setLoading(false);
      return;
    }

    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await fetch(
        `${API_URL}/api/applications/recruiter`,
        {
          method: "GET",

          headers: {
            "Content-Type": "application/json",

            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to load candidates."
        );
      }

      setApplications(
        Array.isArray(data.applications)
          ? data.applications
          : []
      );
    } catch (err) {
      console.error(
        "Candidates API error:",
        err
      );

      setError(
        err.message ||
          "Unable to load candidates."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  /* ============================================================
     BUILD UNIQUE CANDIDATES
  ============================================================ */

  const candidates = useMemo(() => {
    const candidateMap = new Map();

    applications.forEach((application) => {
      const candidate =
        application?.candidate;

      const candidateId =
        getCandidateId(candidate) ||
        application?._id;

      if (!candidateMap.has(candidateId)) {
        candidateMap.set(candidateId, {
          id: candidateId,

          candidate: candidate || {},

          applications: [],
        });
      }

      candidateMap
        .get(candidateId)
        .applications.push(application);
    });

    return Array.from(
      candidateMap.values()
    ).map((item) => {
      const candidateApplications =
        item.applications;

      const latestApplication =
        [...candidateApplications].sort(
          (a, b) =>
            new Date(
              b.createdAt || 0
            ) -
            new Date(
              a.createdAt || 0
            )
        )[0];

      const atsScores =
        candidateApplications
          .map((application) =>
            Number(
              application?.ats?.score || 0
            )
          )
          .filter((score) => score > 0);

      const averageATS =
        atsScores.length > 0
          ? Math.round(
              atsScores.reduce(
                (total, score) =>
                  total + score,
                0
              ) / atsScores.length
            )
          : Number(
              latestApplication?.ats
                ?.score || 0
            );

      return {
        ...item,

        name: getCandidateName(
          item.candidate
        ),

        email:
          item.candidate?.email ||
          latestApplication?.email ||
          "",

        phone:
          latestApplication?.phone ||
          "",

        linkedin:
          latestApplication?.linkedin ||
          "",

        portfolio:
          latestApplication?.portfolio ||
          "",

        averageATS,

        latestStatus:
          latestApplication?.status ||
          "Applied",

        latestApplication,

        latestJob:
          latestApplication?.job || {},

        applicationCount:
          candidateApplications.length,

        latestAppliedAt:
          latestApplication?.createdAt ||
          null,

        resume:
          latestApplication?.resume ||
          {},

        resumeText:
          latestApplication?.resumeText ||
          "",

        recruiterNotes:
          latestApplication
            ?.recruiterNotes || "",

        interviewDate:
          latestApplication
            ?.interviewDate || null,
      };
    });
  }, [applications]);

  /* ============================================================
     FILTER CANDIDATES
  ============================================================ */

  const filteredCandidates =
    useMemo(() => {
      const searchValue =
        search
          .trim()
          .toLowerCase();

      return candidates.filter(
        (candidate) => {
          const matchesSearch =
            !searchValue ||
            candidate.name
              .toLowerCase()
              .includes(searchValue) ||
            candidate.email
              .toLowerCase()
              .includes(searchValue) ||
            candidate.phone
              .toLowerCase()
              .includes(searchValue) ||
            String(
              candidate.latestJob
                ?.title || ""
            )
              .toLowerCase()
              .includes(searchValue) ||
            String(
              candidate.latestJob
                ?.company ||
                candidate.latestJob
                  ?.companyName ||
                ""
            )
              .toLowerCase()
              .includes(searchValue);

          const matchesStatus =
            statusFilter === "All" ||
            candidate.latestStatus ===
              statusFilter;

          const matchesATS =
            atsFilter === "All" ||
            (atsFilter === "Strong" &&
              candidate.averageATS >=
                80) ||
            (atsFilter === "Good" &&
              candidate.averageATS >=
                65 &&
              candidate.averageATS < 80) ||
            (atsFilter === "Moderate" &&
              candidate.averageATS >=
                50 &&
              candidate.averageATS < 65) ||
            (atsFilter === "Low" &&
              candidate.averageATS < 50);

          return (
            matchesSearch &&
            matchesStatus &&
            matchesATS
          );
        }
      );
    }, [
      candidates,
      search,
      statusFilter,
      atsFilter,
    ]);

  /* ============================================================
     STATISTICS
  ============================================================ */

  const statistics = useMemo(() => {
    const total = candidates.length;

    const shortlisted =
      candidates.filter(
        (candidate) =>
          candidate.latestStatus ===
          "Shortlisted"
      ).length;

    const interviews =
      candidates.filter(
        (candidate) =>
          candidate.latestStatus ===
          "Interview"
      ).length;

    const selected =
      candidates.filter(
        (candidate) =>
          candidate.latestStatus ===
          "Selected"
      ).length;

    const strongATS =
      candidates.filter(
        (candidate) =>
          candidate.averageATS >= 80
      ).length;

    return {
      total,
      shortlisted,
      interviews,
      selected,
      strongATS,
    };
  }, [candidates]);

  /* ============================================================
     VIEW CANDIDATE
  ============================================================ */

  const openCandidate = (candidate) => {
    setSelectedCandidate(candidate);
  };

  const closeCandidate = () => {
    setSelectedCandidate(null);
  };

  /* ============================================================
     ATS BUTTON
  ============================================================ */

  const handleATS = (candidate) => {
    const application =
      candidate.latestApplication;

    if (!application?._id) {
      return;
    }

    navigate(
      `/applications/${application._id}?ats=true`
    );
  };

  /* ============================================================
     RESUME
  ============================================================ */

  const handleResume = (candidate) => {
    const resumeUrl =
      candidate.resume?.fileUrl;

    if (!resumeUrl) {
      return;
    }

    window.open(
      resumeUrl,
      "_blank",
      "noopener,noreferrer"
    );
  };

  /* ============================================================
     LOADING
  ============================================================ */

  if (loading) {
    return (
      <div className="candidates-page">
        <div className="candidates-loading">
          <div className="candidates-spinner"></div>

          <h2>
            Loading Candidates
          </h2>

          <p>
            TalentIQ is loading candidate
            applications from your recruiter
            account.
          </p>
        </div>
      </div>
    );
  }

  /* ============================================================
     PAGE
  ============================================================ */

  return (
    <div className="candidates-page">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <section className="candidates-header">

        <div className="candidates-heading">

          <div>
            <span className="candidates-eyebrow">
              TALENT ACQUISITION
            </span>

            <h1>
              Candidates
              <span> & Talent Pool</span>
            </h1>

            <p>
              Review candidates who have applied
              to your recruiter-posted jobs and
              evaluate their application and ATS
              information.
            </p>
          </div>

          <button
            type="button"
            className="refresh-candidates-button"
            onClick={() =>
              fetchCandidates(true)
            }
            disabled={refreshing}
          >
            <FaRotate
              className={
                refreshing
                  ? "refresh-spinning"
                  : ""
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh Candidates"}
          </button>

        </div>

      </section>


      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="candidates-error">

          <div className="error-symbol">
            <FaTriangleExclamation />
          </div>

          <div>
            <strong>
              Unable to load candidates
            </strong>

            <p>
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              fetchCandidates()
            }
          >
            Try Again
          </button>

        </div>
      )}


      {/* ======================================================
          STATISTICS
      ====================================================== */}

      {!error && (
        <section className="candidate-stat-grid">

          <div className="candidate-stat-card">

            <div className="candidate-stat-icon blue">
              <FaUsers />
            </div>

            <div>
              <span>
                TOTAL CANDIDATES
              </span>

              <strong>
                {statistics.total}
              </strong>

              <small>
                Unique candidates
              </small>
            </div>

          </div>


          <div className="candidate-stat-card">

            <div className="candidate-stat-icon purple">
              <FaUserCheck />
            </div>

            <div>
              <span>
                SHORTLISTED
              </span>

              <strong>
                {statistics.shortlisted}
              </strong>

              <small>
                Current applications
              </small>
            </div>

          </div>


          <div className="candidate-stat-card">

            <div className="candidate-stat-icon cyan">
              <FaCalendarCheck />
            </div>

            <div>
              <span>
                INTERVIEWS
              </span>

              <strong>
                {statistics.interviews}
              </strong>

              <small>
                Interview stage
              </small>
            </div>

          </div>


          <div className="candidate-stat-card">

            <div className="candidate-stat-icon green">
              <FaCheck />
            </div>

            <div>
              <span>
                SELECTED
              </span>

              <strong>
                {statistics.selected}
              </strong>

              <small>
                Selected candidates
              </small>
            </div>

          </div>


          <div className="candidate-stat-card">

            <div className="candidate-stat-icon orange">
              <FaChartLine />
            </div>

            <div>
              <span>
                STRONG ATS
              </span>

              <strong>
                {statistics.strongATS}
              </strong>

              <small>
                80%+ ATS score
              </small>
            </div>

          </div>

        </section>
      )}


      {/* ======================================================
          FILTER BAR
      ====================================================== */}

      {!error && (
        <section className="candidate-filter-section">

          <div className="candidate-search">

            <FaMagnifyingGlass />

            <input
              type="text"
              placeholder="Search candidate, email, phone or job..."
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
                className="clear-search"
                onClick={() =>
                  setSearch("")
                }
              >
                <FaXmark />
              </button>
            )}

          </div>


          <div className="candidate-filter-group">

            <div className="filter-control">

              <FaFilter />

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

                <option value="Applied">
                  Applied
                </option>

                <option value="Under Review">
                  Under Review
                </option>

                <option value="Under Consideration">
                  Under Consideration
                </option>

                <option value="Shortlisted">
                  Shortlisted
                </option>

                <option value="Interview">
                  Interview
                </option>

                <option value="Selected">
                  Selected
                </option>

                <option value="Rejected">
                  Rejected
                </option>
              </select>

            </div>


            <div className="filter-control">

              <FaChartLine />

              <select
                value={atsFilter}
                onChange={(event) =>
                  setATSFilter(
                    event.target.value
                  )
                }
              >
                <option value="All">
                  All ATS Scores
                </option>

                <option value="Strong">
                  Strong · 80+
                </option>

                <option value="Good">
                  Good · 65–79
                </option>

                <option value="Moderate">
                  Moderate · 50–64
                </option>

                <option value="Low">
                  Low · Below 50
                </option>
              </select>

            </div>

          </div>

        </section>
      )}


      {/* ======================================================
          RESULTS HEADER
      ====================================================== */}

      {!error && (
        <div className="candidate-results-header">

          <div>
            <span>
              CANDIDATE DATABASE
            </span>

            <h2>
              {filteredCandidates.length}
              {" "}
              candidate
              {filteredCandidates.length !==
              1
                ? "s"
                : ""}
            </h2>
          </div>

          <p>
            Showing candidates from your
            applications
          </p>

        </div>
      )}


      {/* ======================================================
          EMPTY
      ====================================================== */}

      {!error &&
        filteredCandidates.length ===
          0 && (
          <div className="candidates-empty">

            <div className="empty-candidate-icon">
              <FaUsers />
            </div>

            <h2>
              No candidates found
            </h2>

            <p>
              No candidates match your current
              search and filter settings.
            </p>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("All");
                setATSFilter("All");
              }}
            >
              Clear Filters
            </button>

          </div>
        )}


      {/* ======================================================
          CANDIDATE GRID
      ====================================================== */}

      {!error &&
        filteredCandidates.length >
          0 && (
          <section className="candidate-grid">

            {filteredCandidates.map(
              (candidate) => {
                const atsScore =
                  Number(
                    candidate.averageATS ||
                      0
                  );

                return (
                  <article
                    className="candidate-card"
                    key={candidate.id}
                  >

                    {/* CARD TOP */}

                    <div className="candidate-card-top">

                      <div className="candidate-avatar">
                        {getInitials(
                          candidate.name
                        )}
                      </div>

                      <div className="candidate-main-info">

                        <h3>
                          {candidate.name}
                        </h3>

                        <p>
                          {candidate.email ||
                            "Email not available"}
                        </p>

                      </div>

                      <span
                        className={getStatusClass(
                          candidate.latestStatus
                        )}
                      >
                        {candidate.latestStatus}
                      </span>

                    </div>


                    {/* JOB */}

                    <div className="candidate-job-box">

                      <div className="job-mini-icon">
                        <FaBriefcase />
                      </div>

                      <div>

                        <span>
                          APPLIED ROLE
                        </span>

                        <strong>
                          {candidate.latestJob
                            ?.title ||
                            "Job information unavailable"}
                        </strong>

                        <small>
                          {candidate.latestJob
                            ?.company ||
                            candidate.latestJob
                              ?.companyName ||
                            "Company unavailable"}
                        </small>

                      </div>

                    </div>


                    {/* DETAILS */}

                    <div className="candidate-detail-row">

                      <span>
                        <FaLocationDot />

                        {candidate.latestJob
                          ?.location ||
                          "Location unavailable"}
                      </span>

                      <span>
                        <FaBriefcase />

                        {candidate.applicationCount}
                        {" "}
                        application
                        {candidate.applicationCount !==
                        1
                          ? "s"
                          : ""}
                      </span>

                    </div>


                    {/* ATS */}

                    <div className="candidate-ats-box">

                      <div>

                        <span>
                          TALENTIQ ATS MATCH
                        </span>

                        <strong
                          className={getATSClass(
                            atsScore
                          )}
                        >
                          {atsScore}%
                        </strong>

                      </div>

                      <div className="candidate-ats-description">

                        <span>
                          {getATSLabel(
                            atsScore
                          )}
                        </span>

                        <div className="candidate-ats-bar">
                          <span
                            style={{
                              width: `${Math.min(
                                100,
                                atsScore
                              )}%`,
                            }}
                          ></span>
                        </div>

                      </div>

                    </div>


                    {/* DATE */}

                    <div className="candidate-applied-date">

                      <FaClock />

                      Applied
                      {" "}
                      {formatDate(
                        candidate.latestAppliedAt
                      )}

                    </div>


                    {/* ACTIONS */}

                    <div className="candidate-actions">

                      <button
                        type="button"
                        className="candidate-view-button"
                        onClick={() =>
                          openCandidate(
                            candidate
                          )
                        }
                      >
                        View Candidate
                        <FaArrowRight />
                      </button>

                      <button
                        type="button"
                        className="candidate-ats-button"
                        onClick={() =>
                          handleATS(
                            candidate
                          )
                        }
                      >
                        ATS
                      </button>

                    </div>

                  </article>
                );
              }
            )}

          </section>
        )}


      {/* ======================================================
          CANDIDATE DETAILS MODAL
      ====================================================== */}

      {selectedCandidate && (
        <div
          className="candidate-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeCandidate();
            }
          }}
        >

          <div className="candidate-modal">

            {/* MODAL HEADER */}

            <div className="candidate-modal-header">

              <div className="candidate-modal-person">

                <div className="candidate-modal-avatar">
                  {getInitials(
                    selectedCandidate.name
                  )}
                </div>

                <div>

                  <span>
                    CANDIDATE PROFILE
                  </span>

                  <h2>
                    {selectedCandidate.name}
                  </h2>

                  <p>
                    {selectedCandidate.email}
                  </p>

                </div>

              </div>

              <button
                type="button"
                className="candidate-modal-close"
                onClick={
                  closeCandidate
                }
              >
                <FaXmark />
              </button>

            </div>


            {/* MODAL BODY */}

            <div className="candidate-modal-body">

              {/* CONTACT */}

              <div className="candidate-modal-section">

                <div className="modal-section-heading">

                  <FaUserTie />

                  <h3>
                    Candidate Information
                  </h3>

                </div>

                <div className="candidate-contact-grid">

                  <div>
                    <span>
                      <FaEnvelope />
                      Email
                    </span>

                    <strong>
                      {selectedCandidate.email ||
                        "Not available"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      <FaPhone />
                      Phone
                    </span>

                    <strong>
                      {selectedCandidate.phone ||
                        "Not available"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      <FaBriefcase />
                      Latest Role
                    </span>

                    <strong>
                      {selectedCandidate
                        .latestJob
                        ?.title ||
                        "Not available"}
                    </strong>
                  </div>

                  <div>
                    <span>
                      <FaLocationDot />
                      Location
                    </span>

                    <strong>
                      {selectedCandidate
                        .latestJob
                        ?.location ||
                        "Not available"}
                    </strong>
                  </div>

                </div>

              </div>


              {/* ATS */}

              <div className="candidate-modal-section">

                <div className="modal-section-heading">

                  <FaChartLine />

                  <h3>
                    ATS Overview
                  </h3>

                </div>

                <div className="modal-ats-panel">

                  <div className="modal-ats-score">

                    <strong
                      className={getATSClass(
                        selectedCandidate.averageATS
                      )}
                    >
                      {
                        selectedCandidate.averageATS
                      }%
                    </strong>

                    <span>
                      {
                        getATSLabel(
                          selectedCandidate.averageATS
                        )
                      }
                    </span>

                  </div>

                  <div className="modal-ats-info">

                    <p>
                      TalentIQ ATS analysis is
                      calculated from the candidate's
                      application resume information
                      and the requirements of the
                      applied job.
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        handleATS(
                          selectedCandidate
                        )
                      }
                    >
                      Open Full ATS Analysis
                      <FaArrowRight />
                    </button>

                  </div>

                </div>

              </div>


              {/* APPLICATIONS */}

              <div className="candidate-modal-section">

                <div className="modal-section-heading">

                  <FaFileLines />

                  <h3>
                    Applications
                  </h3>

                </div>

                <div className="candidate-application-list">

                  {selectedCandidate
                    .applications
                    .map(
                      (application) => (
                        <div
                          className="candidate-application-item"
                          key={
                            application._id
                          }
                        >

                          <div>

                            <strong>
                              {application
                                .job
                                ?.title ||
                                "Job title unavailable"}
                            </strong>

                            <span>
                              {application
                                .job
                                ?.company ||
                                application
                                  .job
                                  ?.companyName ||
                                "Company unavailable"}
                            </span>

                          </div>

                          <div className="candidate-application-meta">

                            <span
                              className={getStatusClass(
                                application.status
                              )}
                            >
                              {
                                application.status
                              }
                            </span>

                            <strong
                              className={getATSClass(
                                application
                                  .ats
                                  ?.score
                              )}
                            >
                              {Number(
                                application
                                  .ats
                                  ?.score ||
                                  0
                              )}
                              %
                            </strong>

                          </div>

                        </div>
                      )
                    )}

                </div>

              </div>


              {/* LINKS */}

              {(selectedCandidate.linkedin ||
                selectedCandidate.portfolio) && (
                <div className="candidate-modal-links">

                  {selectedCandidate.linkedin && (
                    <a
                      href={
                        selectedCandidate.linkedin
                      }
                      target="_blank"
                      rel="noreferrer"
                    >
                      LinkedIn
                      <FaArrowRight />
                    </a>
                  )}

                  {selectedCandidate.portfolio && (
                    <a
                      href={
                        selectedCandidate.portfolio
                      }
                      target="_blank"
                      rel="noreferrer"
                    >
                      Portfolio
                      <FaArrowRight />
                    </a>
                  )}

                </div>
              )}

            </div>


            {/* MODAL FOOTER */}

            <div className="candidate-modal-footer">

              <button
                type="button"
                className="modal-secondary-button"
                onClick={
                  closeCandidate
                }
              >
                Close
              </button>

              <button
                type="button"
                className="modal-primary-button"
                onClick={() =>
                  handleATS(
                    selectedCandidate
                  )
                }
              >
                View ATS Analysis
                <FaChartLine />
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default Candidates;