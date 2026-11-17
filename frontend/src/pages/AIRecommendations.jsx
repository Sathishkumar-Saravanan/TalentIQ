import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  FaLinkedinIn,
  FaGithub,
  FaInstagram,
  FaCheck,
  FaLocationDot,
  FaBriefcase,
  FaClock,
  FaHeart,
  FaRegHeart,
  FaArrowRight,
  FaFileLines,
  FaRocket,
  FaBullseye,
  FaChartLine,
  FaBolt,
  FaWandMagicSparkles,
} from "react-icons/fa6";

import { FaTwitter } from "react-icons/fa";

import "../styles/AIRecommendations.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

/* ============================================================
   SAFE HELPER FUNCTIONS
============================================================ */

const getInitial = (company) => {
  if (!company) {
    return "T";
  }

  if (typeof company !== "string") {
    return "T";
  }

  const value = company.trim();

  if (!value) {
    return "T";
  }

  return value.charAt(0).toUpperCase();
};

/* ============================================================
   SCORE LABEL
============================================================ */

const getScoreLabel = (score) => {
  const value = Number(score) || 0;

  if (value >= 90) {
    return "Excellent Match";
  }

  if (value >= 80) {
    return "Strong Match";
  }

  if (value >= 70) {
    return "Good Match";
  }

  if (value >= 50) {
    return "Potential Match";
  }

  return "Low Match";
};

/* ============================================================
   SKILL NAME
============================================================ */

const getSkillName = (skill) => {
  if (typeof skill === "string") {
    return skill.trim();
  }

  if (
    typeof skill === "number"
  ) {
    return String(skill);
  }

  if (
    skill &&
    typeof skill === "object"
  ) {
    return (
      skill.name ||
      skill.label ||
      skill.title ||
      skill.skill ||
      skill.value ||
      "Skill"
    );
  }

  return "Skill";
};

/* ============================================================
   JOB ID
============================================================ */

const getJobId = (job) => {
  if (
    !job ||
    typeof job !== "object"
  ) {
    return null;
  }

  const possibleId =
    job._id ||
    job.id ||
    job.jobId ||
    job.job?._id ||
    job.job?.id;

  if (!possibleId) {
    return null;
  }

  return String(possibleId);
};

/* ============================================================
   ARRAY NORMALIZER
============================================================ */

const normalizeArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  return [];
};

/* ============================================================
   NUMBER NORMALIZER
============================================================ */

const normalizeNumber = (
  value,
  fallback = 0
) => {
  const number = Number(value);

  if (
    Number.isFinite(number)
  ) {
    return number;
  }

  return fallback;
};

/* ============================================================
   SAFE TEXT
============================================================ */

const safeText = (
  value,
  fallback = ""
) => {
  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return String(value);
  }

  return fallback;
};

/* ============================================================
   SCORE NORMALIZER
============================================================ */

const getMatchScore = (job) => {
  if (!job) {
    return 0;
  }

  const score =
    job.matchScore ??
    job.match ??
    job.aiScore ??
    job.score ??
    job.compatibilityScore ??
    job.matchPercentage ??
    job.matchPercent;

  return Math.min(
    Math.max(
      normalizeNumber(score, 0),
      0
    ),
    100
  );
};

/* ============================================================
   AI MATCH DETECTION

   Important:
   A normal job should NOT automatically become an AI MATCH.

   Backend can explicitly return:
   - aiMatch
   - isAIRecommendation
   - isAiRecommendation
   - recommended
   - recommendation
   - matched
============================================================ */

const isAIRecommendedJob = (job) => {
  if (!job) {
    return false;
  }

  if (
    job.aiMatch === true ||
    job.isAIRecommendation === true ||
    job.isAiRecommendation === true ||
    job.recommended === true ||
    job.recommendation === true ||
    job.matched === true
  ) {
    return true;
  }

  /*
   * If backend gives actual recommendation data,
   * treat it as an AI recommendation.
   */
  if (
    Array.isArray(job.matchingSkills) &&
    job.matchingSkills.length > 0
  ) {
    return true;
  }

  if (
    Array.isArray(job.matchedSkills) &&
    job.matchedSkills.length > 0
  ) {
    return true;
  }

  if (
    typeof job.matchReason === "string" &&
    job.matchReason.trim()
  ) {
    return true;
  }

  if (
    typeof job.aiReason === "string" &&
    job.aiReason.trim()
  ) {
    return true;
  }

  /*
   * A score by itself is not enough to call something
   * an AI recommendation when it came from the normal
   * /api/jobs endpoint.
   */
  return false;
};

/* ============================================================
   COMPONENT
============================================================ */

const AIRecommendations = () => {
  const navigate = useNavigate();

  /* ============================================================
     STATE
  ============================================================ */

  const [activeFilter, setActiveFilter] =
    useState("All");

  const [savedJobs, setSavedJobs] =
    useState([]);

  const [showAllJobs, setShowAllJobs] =
    useState(false);

  const [recommendedJobs, setRecommendedJobs] =
    useState([]);

  const [resume, setResume] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [apiFallbackUsed, setApiFallbackUsed] =
    useState(false);

  /* ============================================================
     AUTH TOKEN
  ============================================================ */

  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken");

  /* ============================================================
     AUTH HEADERS
  ============================================================ */

  const getHeaders = useCallback(() => {
    return {
      "Content-Type": "application/json",

      ...(token
        ? {
            Authorization:
              `Bearer ${token}`,
          }
        : {}),
    };
  }, [token]);

  /* ============================================================
     FETCH NORMAL JOBS FALLBACK

     IMPORTANT:
     These jobs are NOT automatically treated as AI matches.
============================================================ */

  const fetchNormalJobsFallback =
    useCallback(async () => {
      try {
        console.log(
          "TalentIQ: Trying /api/jobs fallback..."
        );

        const response =
          await fetch(
            `${API_URL}/api/jobs`,
            {
              method: "GET",
              headers: getHeaders(),
            }
          );

        let data = {};

        try {
          data =
            await response.json();
        } catch {
          data = {};
        }

        console.log(
          "TalentIQ fallback jobs response:",
          data
        );

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to load jobs."
          );
        }

        let jobs = [];

        if (
          Array.isArray(data)
        ) {
          jobs = data;
        } else if (
          Array.isArray(data.jobs)
        ) {
          jobs = data.jobs;
        } else if (
          Array.isArray(data.data)
        ) {
          jobs = data.data;
        } else if (
          Array.isArray(data.results)
        ) {
          jobs = data.results;
        }

        const validJobs =
          jobs
            .filter(
              (job) =>
                job &&
                typeof job ===
                  "object" &&
                Boolean(
                  getJobId(job)
                )
            )
            .map((job) => ({
              ...job,

              /*
               * Explicitly mark these as normal jobs.
               */
              isAIRecommendation:
                false,

              aiMatch: false,
            }));

        setRecommendedJobs(
          validJobs
        );

        setApiFallbackUsed(
          true
        );

        /*
         * Fallback is not considered a fatal
         * frontend error.
         */
        setError("");

        return validJobs;
      } catch (fallbackError) {
        console.error(
          "TalentIQ jobs fallback failed:",
          fallbackError
        );

        return [];
      }
    }, [getHeaders]);

  /* ============================================================
     FETCH AI RECOMMENDATIONS
============================================================ */

  const fetchRecommendations =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");
        setApiFallbackUsed(false);

        if (!token) {
          setRecommendedJobs([]);

          setError(
            "Please login again to view AI recommendations."
          );

          return;
        }

        console.log(
          "TalentIQ: Fetching AI recommendations..."
        );

        const response =
          await fetch(
            `${API_URL}/api/jobs/recommendations`,
            {
              method: "GET",
              headers: getHeaders(),
            }
          );

        let data = {};

        try {
          data =
            await response.json();
        } catch {
          data = {};
        }

        console.log(
          "TalentIQ AI recommendation response:",
          data
        );

        /* ======================================================
           BACKEND ERROR
        ====================================================== */

        if (!response.ok) {
          console.error(
            "AI recommendation endpoint failed:",
            data.message ||
              "Unknown recommendation error"
          );

          /*
           * The previous backend problem was:
           *
           * 400 Invalid job ID
           *
           * If that still happens, use normal jobs only
           * as a visual fallback.
           */
          if (
            response.status === 400 ||
            response.status === 404 ||
            response.status === 500
          ) {
            const fallbackJobs =
              await fetchNormalJobsFallback();

            if (
              fallbackJobs.length >
              0
            ) {
              return;
            }

            setRecommendedJobs([]);

            setError(
              data.message ||
                "AI recommendations are temporarily unavailable."
            );

            return;
          }

          throw new Error(
            data.message ||
              "Unable to load AI recommendations."
          );
        }

        /* ======================================================
           READ RECOMMENDATION ARRAY
        ====================================================== */

        let jobs = [];

        if (
          Array.isArray(data.jobs)
        ) {
          jobs = data.jobs;
        } else if (
          Array.isArray(
            data.recommendations
          )
        ) {
          jobs =
            data.recommendations;
        } else if (
          Array.isArray(data.data)
        ) {
          jobs = data.data;
        } else if (
          Array.isArray(
            data.results
          )
        ) {
          jobs = data.results;
        }

        /* ======================================================
           RESUME DATA
        ====================================================== */

        if (data.resume) {
          setResume(
            data.resume
          );
        } else if (
          data.data?.resume
        ) {
          setResume(
            data.data.resume
          );
        }

        /* ======================================================
           VALID JOB OBJECTS
        ====================================================== */

        const validJobs =
          jobs.filter(
            (job) =>
              job &&
              typeof job ===
                "object" &&
              Boolean(
                getJobId(job)
              )
          );

        /*
         * Mark jobs returned from the recommendation
         * endpoint as AI recommendation candidates.
         */
        const aiJobs =
          validJobs.map(
            (job) => ({
              ...job,

              isAIRecommendation:
                job.isAIRecommendation ??
                job.isAiRecommendation ??
                job.aiMatch ??
                true,

              aiMatch:
                job.aiMatch ??
                job.isAIRecommendation ??
                job.isAiRecommendation ??
                true,
            })
          );

        setRecommendedJobs(
          aiJobs
        );

        if (
          aiJobs.length ===
          0
        ) {
          console.log(
            "TalentIQ: Recommendation API returned zero jobs."
          );
        }
      } catch (err) {
        console.error(
          "TalentIQ recommendation error:",
          err
        );

        /*
         * Final safety fallback.
         */
        const fallbackJobs =
          await fetchNormalJobsFallback();

        if (
          fallbackJobs.length ===
          0
        ) {
          setRecommendedJobs([]);

          setError(
            err?.message ||
              "Unable to load AI recommendations."
          );
        }
      } finally {
        setLoading(false);
      }
    }, [
      token,
      getHeaders,
      fetchNormalJobsFallback,
    ]);

  /* ============================================================
     LOAD RECOMMENDATIONS
============================================================ */

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  /* ============================================================
     LOAD SAVED JOBS
============================================================ */

  useEffect(() => {
    try {
      const stored =
        localStorage.getItem(
          "talentIQSavedJobs"
        );

      if (!stored) {
        return;
      }

      const parsed =
        JSON.parse(stored);

      if (
        Array.isArray(parsed)
      ) {
        setSavedJobs(
          parsed.map(String)
        );
      }
    } catch (err) {
      console.log(
        "Unable to load saved jobs:",
        err
      );

      setSavedJobs([]);
    }
  }, []);

  /* ============================================================
     SAVE SAVED JOBS
============================================================ */

  useEffect(() => {
    try {
      localStorage.setItem(
        "talentIQSavedJobs",
        JSON.stringify(
          savedJobs
        )
      );
    } catch (err) {
      console.log(
        "Unable to save saved jobs locally:",
        err
      );
    }
  }, [savedJobs]);

  /* ============================================================
     NORMALIZE JOB DATA
============================================================ */

  const normalizedJobs =
    useMemo(() => {
      if (
        !Array.isArray(
          recommendedJobs
        )
      ) {
        return [];
      }

      return recommendedJobs
        .map((job) => {
          if (
            !job ||
            typeof job !==
              "object"
          ) {
            return null;
          }

          const id =
            getJobId(job);

          if (!id) {
            return null;
          }

          const score =
            getMatchScore(job);

          const skills =
            normalizeArray(
              job.skills?.length
                ? job.skills
                : job.requiredSkills
                    ?.length
                ? job.requiredSkills
                : job.technicalSkills
            );

          const matchingSkills =
            normalizeArray(
              job.matchingSkills ??
                job.matchedSkills ??
                job.matchedSkillsList
            );

          const missingSkills =
            normalizeArray(
              job.missingSkills ??
                job.skillsToImprove ??
                job.gapSkills
            );

          /* ====================================================
             COMPANY
          ==================================================== */

          const company =
            typeof job.company ===
            "string"
              ? job.company
              : typeof job.companyName ===
                "string"
              ? job.companyName
              : typeof job.recruiterCompany ===
                "string"
              ? job.recruiterCompany
              : typeof job.recruiter
                    ?.companyName ===
                  "string"
              ? job.recruiter
                  .companyName
              : "Company";

          /* ====================================================
             ROLE
          ==================================================== */

          const role =
            typeof job.title ===
            "string"
              ? job.title
              : typeof job.role ===
                "string"
              ? job.role
              : typeof job.position ===
                "string"
              ? job.position
              : typeof job.jobTitle ===
                "string"
              ? job.jobTitle
              : "Job Opportunity";

          /* ====================================================
             LOCATION
          ==================================================== */

          const location =
            typeof job.location ===
            "string"
              ? job.location
              : typeof job.jobLocation ===
                "string"
              ? job.jobLocation
              : typeof job.city ===
                "string"
              ? job.city
              : "Location not specified";

          /* ====================================================
             SALARY
          ==================================================== */

          const salary =
            typeof job.salary ===
              "string" ||
            typeof job.salary ===
              "number"
              ? job.salary
              : typeof job.salaryRange ===
                "string"
              ? job.salaryRange
              : typeof job.package ===
                "string"
              ? job.package
              : "Salary not disclosed";

          /* ====================================================
             TYPE
          ==================================================== */

          const type =
            typeof job.type ===
            "string"
              ? job.type
              : typeof job.jobType ===
                "string"
              ? job.jobType
              : typeof job.employmentType ===
                "string"
              ? job.employmentType
              : "Full Time";

          /* ====================================================
             EXPERIENCE
          ==================================================== */

          const experience =
            typeof job.experience ===
            "string"
              ? job.experience
              : typeof job.experienceRequired ===
                "string"
              ? job.experienceRequired
              : typeof job.experienceLevel ===
                "string"
              ? job.experienceLevel
              : "Not specified";

          /* ====================================================
             CATEGORY
          ==================================================== */

          const category =
            typeof job.category ===
            "string"
              ? job.category
              : typeof job.jobCategory ===
                "string"
              ? job.jobCategory
              : typeof job.department ===
                "string"
              ? job.department
              : "Other";

          /* ====================================================
             REASON
          ==================================================== */

          const reason =
            typeof job.matchReason ===
            "string"
              ? job.matchReason
              : typeof job.reason ===
                "string"
              ? job.reason
              : typeof job.aiReason ===
                "string"
              ? job.aiReason
              : "This job matches your profile based on the available job information.";

          /* ====================================================
             LOGO
          ==================================================== */

          let logo = null;

          if (
            typeof job.logo ===
            "string"
          ) {
            logo =
              job.logo;
          } else if (
            typeof job.companyLogo ===
            "string"
          ) {
            logo =
              job.companyLogo;
          }

          /* ====================================================
             AI STATUS
          ==================================================== */

          const aiRecommendation =
            isAIRecommendedJob(
              job
            );

          /* ====================================================
             HIGHLIGHT
          ==================================================== */

          let highlight =
            "Potential Match";

          if (score >= 90) {
            highlight =
              "Excellent Match";
          } else if (
            score >= 80
          ) {
            highlight =
              "Strong Match";
          } else if (
            score >= 70
          ) {
            highlight =
              "Good Match";
          }

          return {
            ...job,

            id,

            _id:
              job._id ||
              id,

            role,

            company,

            location,

            salary,

            type,

            experience,

            category,

            skills,

            match: score,

            matchScore: score,

            matchingSkills,

            missingSkills,

            reason,

            highlight,

            logo:

              logo ||
              getInitial(
                company
              ),

            isAIRecommendation:
              aiRecommendation,

            aiMatch:
              aiRecommendation,
          };
        })
        .filter(Boolean);
    }, [recommendedJobs]);

  /* ============================================================
     FILTERS
============================================================ */

  const dynamicCategories =
    useMemo(() => {
      return [
        ...new Set(
          normalizedJobs
            .map(
              (job) =>
                job.category
            )
            .filter(Boolean)
        ),
      ];
    }, [normalizedJobs]);

  const filters =
    useMemo(() => {
      return [
        "All",

        ...dynamicCategories.filter(
          (category) =>
            category !== "All"
        ),
      ];
    }, [
      dynamicCategories,
    ]);

  /* ============================================================
     FILTERED JOBS
============================================================ */

  const filteredJobs =
    useMemo(() => {
      if (
        activeFilter ===
        "All"
      ) {
        return normalizedJobs;
      }

      return normalizedJobs.filter(
        (job) =>
          job.category ===
          activeFilter
      );
    }, [
      normalizedJobs,
      activeFilter,
    ]);

  /* ============================================================
     DISPLAYED JOBS
============================================================ */

  const displayedJobs =
    useMemo(() => {
      if (
        showAllJobs
      ) {
        return filteredJobs;
      }

      return filteredJobs.slice(
        0,
        3
      );
    }, [
      filteredJobs,
      showAllJobs,
    ]);

  /* ============================================================
     RESUME SKILLS
============================================================ */

  const resumeSkills =
    useMemo(() => {
      if (!resume) {
        return [];
      }

      const skills =
        resume.skills ||
        resume.technicalSkills ||
        resume.extractedSkills ||
        resume.skillsList ||
        [];

      if (
        !Array.isArray(
          skills
        )
      ) {
        return [];
      }

      return skills;
    }, [resume]);

  /* ============================================================
     TOTAL JOBS
============================================================ */

  const totalJobs =
    normalizedJobs.length;

  /* ============================================================
     BEST MATCH

     Only meaningful AI recommendations are considered.
============================================================ */

  const aiRecommendedJobs =
    useMemo(() => {
      return normalizedJobs.filter(
        (job) =>
          job.isAIRecommendation ===
          true
      );
    }, [normalizedJobs]);

  const bestMatch =
    useMemo(() => {
      if (
        aiRecommendedJobs.length ===
        0
      ) {
        return 0;
      }

      return Math.max(
        ...aiRecommendedJobs.map(
          (job) =>
            normalizeNumber(
              job.matchScore,
              0
            )
        )
      );
    }, [
      aiRecommendedJobs,
    ]);

  /* ============================================================
     AVERAGE MATCH
============================================================ */

  const averageMatch =
    useMemo(() => {
      if (
        aiRecommendedJobs.length ===
        0
      ) {
        return 0;
      }

      const total =
        aiRecommendedJobs.reduce(
          (sum, job) =>
            sum +
            normalizeNumber(
              job.matchScore,
              0
            ),
          0
        );

      return Math.round(
        total /
          aiRecommendedJobs.length
      );
    }, [
      aiRecommendedJobs,
    ]);

  /* ============================================================
     PROFILE SCORE
============================================================ */

  const profileScore =
    normalizeNumber(
      resume?.profileScore ??
        resume?.resumeScore ??
        resume?.atsScore ??
        resume?.score ??
        averageMatch,
      averageMatch
    );

  /* ============================================================
     CURRENT SKILLS
============================================================ */

  const currentSkills =
    useMemo(() => {
      return [
        ...new Set(
          resumeSkills
            .map(
              getSkillName
            )
            .map((skill) =>
              skill.trim()
            )
            .filter(Boolean)
        ),
      ];
    }, [
      resumeSkills,
    ]);

  /* ============================================================
     AI MISSING SKILLS
============================================================ */

  const aiMissingSkills =
    useMemo(() => {
      const skills =
        aiRecommendedJobs.flatMap(
          (job) =>
            Array.isArray(
              job.missingSkills
            )
              ? job.missingSkills
              : []
        );

      return [
        ...new Set(
          skills
            .map(
              getSkillName
            )
            .map((skill) =>
              skill.trim()
            )
            .filter(Boolean)
        ),
      ];
    }, [
      aiRecommendedJobs,
    ]);

  /* ============================================================
     LEARNING SKILLS
============================================================ */

  const learningSkills =
    useMemo(() => {
      if (
        aiMissingSkills.length >
        0
      ) {
        return aiMissingSkills.slice(
          0,
          8
        );
      }

      return [
        "TypeScript",
        "AWS",
        "Docker",
        "System Design",
      ];
    }, [
      aiMissingSkills,
    ]);

  /* ============================================================
     LEARNING PATH
============================================================ */

  const handleLearningPath =
    () => {
      navigate(
        "/learning",
        {
          state: {
            profileScore,

            currentSkills,

            recommendedSkills:
              learningSkills,

            missingSkills:
              aiMissingSkills,

            recommendedJobs:
              aiRecommendedJobs.slice(
                0,
                5
              ),

            topRole:
              aiRecommendedJobs[0]
                ?.role ||
              "Full Stack Developer",

            bestMatch,

            resumeId:
              resume?._id ||
              resume?.id ||
              null,
          },
        }
      );
    };

  /* ============================================================
     SAVE / UNSAVE JOB
============================================================ */

  const toggleSavedJob =
    async (jobId) => {
      if (!jobId) {
        return;
      }

      const id =
        String(jobId);

      const currentlySaved =
        savedJobs.includes(
          id
        );

      /* ========================================================
         OPTIMISTIC UI
      ======================================================== */

      setSavedJobs(
        (previous) =>
          currentlySaved
            ? previous.filter(
                (savedId) =>
                  savedId !==
                  id
              )
            : [
                ...previous,
                id,
              ]
      );

      try {
        const response =
          await fetch(
            `${API_URL}/api/jobs/${id}/save`,
            {
              method:
                currentlySaved
                  ? "DELETE"
                  : "POST",

              headers:
                getHeaders(),
            }
          );

        if (
          !response.ok
        ) {
          console.log(
            "Saved job API unavailable."
          );
        }
      } catch (err) {
        console.log(
          "Saved job API unavailable:",
          err
        );
      }
    };

  /* ============================================================
     APPLY
============================================================ */

  const handleApply =
    (job) => {
      const jobId =
        getJobId(job);

      if (!jobId) {
        console.warn(
          "Cannot apply: invalid job ID",
          job
        );

        return;
      }

      navigate(
        `/apply/${jobId}`,
        {
          state: {
            job,
          },
        }
      );
    };

  /* ============================================================
     SCROLL
============================================================ */

  const scrollToSection =
    (id) => {
      const element =
        document.getElementById(
          id
        );

      if (element) {
        element.scrollIntoView({
          behavior:
            "smooth",
          block: "start",
        });
      }
    };

  /* ============================================================
     PAGE
============================================================ */

  return (
    <div className="ai-recommendations-page">

      {/* ======================================================
          HERO
      ====================================================== */}

      <section className="ai-hero-section">

        <div className="hero-background-glow glow-one"></div>

        <div className="hero-background-glow glow-two"></div>

        <div className="ai-hero-content">

          <div className="ai-hero-badge">

            <span className="badge-dot"></span>

            POWERED BY TALENTIQ AI

          </div>

          <h1>
            Your Career.
            <br />

            <span>
              Intelligently Recommended.
            </span>
          </h1>

          <p>
            TalentIQ AI analyzes your
            skills, experience, resume
            and career goals to discover
            opportunities posted by
            recruiters that are relevant
            to your profile.
          </p>

          <div className="hero-actions">

            <button
              type="button"
              className="primary-hero-button"
              onClick={() =>
                scrollToSection(
                  "recommended-jobs"
                )
              }
            >
              Explore Recommended Jobs

              <FaArrowRight />

            </button>

            <button
              type="button"
              className="secondary-hero-button"
              onClick={() =>
                scrollToSection(
                  "ai-analysis"
                )
              }
            >
              <FaWandMagicSparkles />

              See My AI Analysis

            </button>

          </div>

          <div className="hero-trust-row">

            <div>

              <strong>
                {Math.min(
                  Math.max(
                    Math.round(
                      profileScore
                    ),
                    0
                  ),
                  100
                )}
                %
              </strong>

              <span>
                Profile Accuracy
              </span>

            </div>

            <div className="hero-divider"></div>

            <div>

              <strong>
                {totalJobs}
              </strong>

              <span>
                Jobs Analyzed
              </span>

            </div>

            <div className="hero-divider"></div>

            <div>

              <strong>
                {bestMatch}%
              </strong>

              <span>
                Best AI Match
              </span>

            </div>

          </div>

        </div>

        {/* ==================================================
            AI VISUAL
        ================================================== */}

        <div className="ai-hero-visual">

          <div className="ai-orb">

            <div className="orb-ring ring-one"></div>

            <div className="orb-ring ring-two"></div>

            <div className="orb-center">

              <FaWandMagicSparkles />

            </div>

          </div>

          <div className="floating-ai-card card-top">

            <span className="floating-icon">

              <FaBullseye />

            </span>

            <div>

              <strong>
                {bestMatch}%
                {" "}
                Match
              </strong>

              <small>
                Best AI job match
              </small>

            </div>

          </div>

          <div className="floating-ai-card card-bottom">

            <span className="floating-icon">

              <FaWandMagicSparkles />

            </span>

            <div>

              <strong>
                AI Analysis
              </strong>

              <small>
                Resume successfully analyzed
              </small>

            </div>

            <span className="success-check">

              <FaCheck />

            </span>

          </div>

        </div>

      </section>

      {/* ======================================================
          AI ANALYSIS
      ====================================================== */}

      <section
        className="recommendation-section"
        id="ai-analysis"
      >

        <div className="section-heading-large">

          <div>

            <span className="section-label">
              PERSONALIZED INTELLIGENCE
            </span>

            <h2>
              Your AI Recommendation
              <span>
                {" "}
                Overview
              </span>
            </h2>

            <p>
              TalentIQ analyzes your
              resume and profile against
              recruiter-posted jobs and
              identifies opportunities
              based on available matching
              signals.
            </p>

          </div>

          <div className="analysis-status">

            <span className="status-pulse"></span>

            {apiFallbackUsed
              ? "Job Matching Mode"
              : "AI Analysis Updated"}

          </div>

        </div>

        <div className="analysis-overview-grid">

          {/* PROFILE SCORE */}

          <div className="ai-score-card">

            <div className="score-card-top">

              <span>
                OVERALL MATCH SCORE
              </span>

              <span className="score-ai-icon">

                <FaWandMagicSparkles />

              </span>

            </div>

            <div className="big-score">

              <strong>
                {Math.round(
                  profileScore
                )}
              </strong>

              <span>
                /100
              </span>

            </div>

            <div className="score-progress">

              <div
                style={{
                  width:
                    `${Math.min(
                      Math.max(
                        Number(
                          profileScore
                        ) || 0,
                        0
                      ),
                      100
                    )}%`,
                }}
              ></div>

            </div>

            <div className="score-footer">

              <span>
                Resume profile alignment
              </span>

              <strong>
                AI
              </strong>

            </div>

          </div>

          {/* RECOMMENDED ROLE */}

          <div className="analysis-info-card">

            <div className="analysis-card-icon purple-icon">

              <FaBriefcase />

            </div>

            <span className="analysis-card-label">
              TOP RECOMMENDED ROLE
            </span>

            <h3>
              {aiRecommendedJobs[0]
                ?.role ||
                "Full Stack Developer"}
            </h3>

            <p>
              This role is based on
              the available AI
              recommendation data
              returned by TalentIQ.
            </p>

            <div className="role-match">

              <span>
                Role compatibility
              </span>

              <strong>
                {bestMatch}%
              </strong>

            </div>

          </div>

          {/* CAREER POTENTIAL */}

          <div className="analysis-info-card">

            <div className="analysis-card-icon blue-icon">

              <FaRocket />

            </div>

            <span className="analysis-card-label">
              CAREER POTENTIAL
            </span>

            <h3>
              {bestMatch >= 90
                ? "Excellent Potential"
                : bestMatch >= 80
                ? "High Growth Potential"
                : bestMatch >= 60
                ? "Growth Opportunity"
                : "Profile Improvement Opportunity"}
            </h3>

            <p>
              Adding relevant
              technologies and
              strengthening your
              resume can increase
              the number of roles
              that match your profile.
            </p>

            <div className="potential-tags">

              {learningSkills
                .slice(0, 3)
                .map(
                  (
                    skill,
                    index
                  ) => (
                    <span
                      key={`${getSkillName(
                        skill
                      )}-${index}`}
                    >
                      {getSkillName(
                        skill
                      )}
                    </span>
                  )
                )}

            </div>

          </div>

        </div>

      </section>

      {/* ======================================================
          WHY AI RECOMMENDS
      ====================================================== */}

      <section className="recommendation-section why-ai-section">

        <div className="section-heading-large">

          <div>

            <span className="section-label">
              HOW TALENTIQ THINKS
            </span>

            <h2>
              Why These Jobs Are
              <span>
                {" "}
                Recommended
              </span>
            </h2>

            <p>
              TalentIQ evaluates
              multiple signals from
              your resume and compares
              them with recruiter
              requirements.
            </p>

          </div>

        </div>

        <div className="ai-factor-grid">

          <div className="ai-factor-card">

            <div className="factor-number">
              01
            </div>

            <div className="factor-icon">

              <FaBolt />

            </div>

            <h3>
              Skills Match
            </h3>

            <p>
              Your technical skills
              are compared with the
              skills specified by
              recruiters in their
              job postings.
            </p>

            <strong>
              Skills analyzed
            </strong>

          </div>

          <div className="ai-factor-card">

            <div className="factor-number">
              02
            </div>

            <div className="factor-icon">

              <FaFileLines />

            </div>

            <h3>
              Resume Analysis
            </h3>

            <p>
              AI analyzes your resume,
              experience, projects,
              education and technical
              profile to determine
              relevance.
            </p>

            <strong>
              Resume relevance
            </strong>

          </div>

          <div className="ai-factor-card">

            <div className="factor-number">
              03
            </div>

            <div className="factor-icon">

              <FaBullseye />

            </div>

            <h3>
              Career Goals
            </h3>

            <p>
              Your preferred role,
              location and career
              direction can influence
              the relevance of
              opportunities.
            </p>

            <strong>
              Profile alignment
            </strong>

          </div>

          <div className="ai-factor-card">

            <div className="factor-number">
              04
            </div>

            <div className="factor-icon">

              <FaChartLine />

            </div>

            <h3>
              Job Requirements
            </h3>

            <p>
              Recruiter requirements
              are compared against
              your profile before
              recommendations are
              generated.
            </p>

            <strong>
              Requirement analysis
            </strong>

          </div>

        </div>

      </section>

      {/* ======================================================
          RECOMMENDED JOBS
      ====================================================== */}

      <section
        className="recommendation-section jobs-section"
        id="recommended-jobs"
      >

        <div className="section-heading-large jobs-heading">

          <div>

            <span className="section-label">
              AI JOB MATCHING
            </span>

            <h2>
              Jobs Picked
              <span>
                {" "}
                For You
              </span>
            </h2>

            <p>
              Recruiter-posted
              opportunities returned
              by TalentIQ and analyzed
              using the available
              recommendation data.
            </p>

          </div>

          <button
            type="button"
            className="view-all-link"
            onClick={() =>
              navigate(
                "/find-jobs"
              )
            }
          >
            View All Jobs

            <FaArrowRight />

          </button>

        </div>

        {/* FILTERS */}

        <div className="recommendation-filters">

          <div className="filter-left">

            <span className="filter-title">
              Recommended for you
            </span>

            <div className="filter-buttons">

              {filters.map(
                (filter) => (
                  <button
                    type="button"
                    key={filter}
                    className={
                      activeFilter ===
                      filter
                        ? "filter-button active"
                        : "filter-button"
                    }
                    onClick={() => {
                      setActiveFilter(
                        filter
                      );

                      setShowAllJobs(
                        false
                      );
                    }}
                  >
                    {filter}
                  </button>
                )
              )}

            </div>

          </div>

          <span className="jobs-count">
            {filteredJobs.length}{" "}
            matches found
          </span>

        </div>

        {/* ====================================================
            LOADING
        ==================================================== */}

        {loading && (

          <div className="ai-loading-state">

            <div className="ai-loading-spinner"></div>

            <h3>
              TalentIQ AI is analyzing
              your resume...
            </h3>

            <p>
              Comparing your profile
              with recruiter-posted
              opportunities.
            </p>

          </div>

        )}

        {/* ====================================================
            ERROR
        ==================================================== */}

        {!loading &&
          error &&
          filteredJobs.length ===
            0 && (

            <div className="ai-error-state">

              <div className="error-icon">
                !
              </div>

              <h3>
                Unable to load
                recommendations
              </h3>

              <p>
                {error}
              </p>

              <button
                type="button"
                onClick={
                  fetchRecommendations
                }
                className="retry-ai-button"
              >
                Try Again
              </button>

            </div>

          )}

        {/* ====================================================
            NO JOBS
        ==================================================== */}

        {!loading &&
          !error &&
          filteredJobs.length ===
            0 && (

            <div className="ai-empty-state">

              <div className="empty-icon">

                <FaWandMagicSparkles />

              </div>

              <h3>
                No matching jobs yet
              </h3>

              <p>
                Recruiter jobs will
                appear here when
                TalentIQ finds
                opportunities matching
                your profile.
              </p>

              <button
                type="button"
                className="primary-hero-button"
                onClick={() =>
                  navigate(
                    "/find-jobs"
                  )
                }
              >
                Explore All Jobs

                <FaArrowRight />

              </button>

            </div>

          )}

        {/* ====================================================
            JOB CARDS
        ==================================================== */}

        {!loading &&
          filteredJobs.length >
            0 && (

            <div className="ai-jobs-grid">

              {displayedJobs.map(
                (job) => {

                  const jobId =
                    getJobId(job);

                  const aiMatch =
                    job.isAIRecommendation ===
                    true;

                  const score =
                    Math.round(
                      normalizeNumber(
                        job.matchScore,
                        0
                      )
                    );

                  return (

                    <article
                      className="ai-job-card"
                      key={jobId}
                    >

                      {/* HEADER */}

                      <div className="job-card-header">

                        <div className="company-logo-ai">

                          {typeof job.logo ===
                            "string" &&
                          (
                            job.logo.startsWith(
                              "http://"
                            ) ||
                            job.logo.startsWith(
                              "https://"
                            ) ||
                            job.logo.startsWith(
                              "/"
                            )
                          ) ? (

                            <img
                              src={
                                job.logo
                              }
                              alt={`${safeText(
                                job.company,
                                "Company"
                              )} logo`}
                              onError={(
                                event
                              ) => {
                                event.currentTarget.style.display =
                                  "none";
                              }}
                            />

                          ) : (

                            safeText(
                              job.logo,
                              getInitial(
                                job.company
                              )
                            )

                          )}

                        </div>

                        <div className="ai-job-company">

                          <h3>
                            {safeText(
                              job.role,
                              "Job Opportunity"
                            )}
                          </h3>

                          <span>
                            {safeText(
                              job.company,
                              "Company"
                            )}
                          </span>

                        </div>

                        <button
                          type="button"
                          className={
                            savedJobs.includes(
                              String(
                                jobId
                              )
                            )
                              ? "job-save-button saved"
                              : "job-save-button"
                          }
                          onClick={() =>
                            toggleSavedJob(
                              jobId
                            )
                          }
                          aria-label={
                            savedJobs.includes(
                              String(
                                jobId
                              )
                            )
                              ? "Unsave job"
                              : "Save job"
                          }
                        >

                          {savedJobs.includes(
                            String(
                              jobId
                            )
                          ) ? (
                            <FaHeart />
                          ) : (
                            <FaRegHeart />
                          )}

                        </button>

                      </div>

                      {/* MATCH */}

                      <div className="job-match-area">

                        <div className="match-circle-small">

                          <strong>
                            {aiMatch
                              ? `${score}%`
                              : "--"}
                          </strong>

                        </div>

                        <div className="match-content">

                          <span className="match-label">

                            {aiMatch
                              ? "AI MATCH"
                              : "JOB MATCH"}

                          </span>

                          <strong>

                            {aiMatch
                              ? getScoreLabel(
                                  job.matchScore
                                )
                              : "Recruiter Job"}

                          </strong>

                          <p>

                            {aiMatch
                              ? safeText(
                                  job.reason,
                                  "This job matches your profile based on the available AI recommendation signals."
                                )
                              : "This recruiter-posted job is available through TalentIQ. It has not been classified as an AI recommendation."}

                          </p>

                        </div>

                      </div>

                      {/* DETAILS */}

                      <div className="ai-job-details">

                        <span>

                          <FaLocationDot />

                          {safeText(
                            job.location,
                            "Location not specified"
                          )}

                        </span>

                        <span>

                          <span className="detail-symbol">
                            ₹
                          </span>

                          {safeText(
                            job.salary,
                            "Salary not disclosed"
                          )}

                        </span>

                        <span>

                          <FaBriefcase />

                          {safeText(
                            job.type,
                            "Full Time"
                          )}

                        </span>

                        <span>

                          <FaClock />

                          {safeText(
                            job.experience,
                            "Not specified"
                          )}

                        </span>

                      </div>

                      {/* SKILLS */}

                      <div className="ai-job-skills">

                        {normalizeArray(
                          job.skills
                        )
                          .slice(
                            0,
                            8
                          )
                          .map(
                            (
                              skill,
                              index
                            ) => {

                              const skillName =
                                getSkillName(
                                  skill
                                );

                              const matched =
                                normalizeArray(
                                  job.matchingSkills
                                ).some(
                                  (
                                    item
                                  ) =>
                                    getSkillName(
                                      item
                                    )
                                      .toLowerCase() ===
                                    skillName.toLowerCase()
                                );

                              return (

                                <span
                                  key={`${skillName}-${index}`}
                                  className={
                                    matched
                                      ? "matched-skill"
                                      : ""
                                  }
                                >
                                  {
                                    skillName
                                  }
                                </span>

                              );
                            }
                          )}

                      </div>

                      {/* MATCHING SKILLS */}

                      {aiMatch &&
                        normalizeArray(
                          job.matchingSkills
                        ).length >
                          0 && (

                        <div className="job-ai-insight">

                          <span>

                            <FaCheck />

                            Matching skills

                          </span>

                          <p>

                            {normalizeArray(
                              job.matchingSkills
                            )
                              .slice(
                                0,
                                5
                              )
                              .map(
                                getSkillName
                              )
                              .join(
                                ", "
                              )}

                          </p>

                        </div>

                      )}

                      {/* MISSING SKILLS */}

                      {aiMatch &&
                        normalizeArray(
                          job.missingSkills
                        ).length >
                          0 && (

                        <div className="job-ai-missing">

                          <span>
                            + Skills to improve
                          </span>

                          <p>

                            {normalizeArray(
                              job.missingSkills
                            )
                              .slice(
                                0,
                                4
                              )
                              .map(
                                getSkillName
                              )
                              .join(
                                ", "
                              )}

                          </p>

                        </div>

                      )}

                      {/* FOOTER */}

                      <div className="job-card-footer">

                        <span>

                          <FaWandMagicSparkles />

                          {aiMatch
                            ? "AI recommended"
                            : "Recruiter posted"}

                        </span>

                        <button
                          type="button"
                          className="apply-now-ai"
                          onClick={() =>
                            handleApply(
                              job
                            )
                          }
                        >

                          Apply Now

                          <FaArrowRight />

                        </button>

                      </div>

                    </article>

                  );
                }
              )}

            </div>

          )}

        {/* ====================================================
            SHOW MORE
        ==================================================== */}

        {filteredJobs.length >
          3 && (

          <div className="show-more-container">

            <button
              type="button"
              className="show-more-button"
              onClick={() =>
                setShowAllJobs(
                  (previous) =>
                    !previous
                )
              }
            >

              {showAllJobs
                ? "Show Less ↑"
                : "View More Recommendations →"}

            </button>

          </div>

        )}

      </section>

      {/* ======================================================
          SKILL INSIGHTS
      ====================================================== */}

      <section
        className="recommendation-section skill-insights-section"
        id="skill-insights"
      >

        <div className="section-heading-large">

          <div>

            <span className="section-label">
              AI CAREER INTELLIGENCE
            </span>

            <h2>
              Skills That Could
              <span>
                {" "}
                Boost Your Career
              </span>
            </h2>

            <p>
              TalentIQ identifies
              technologies that could
              improve your access to
              recruiter opportunities.
            </p>

          </div>

          <div className="skill-insight-score">

            <span>
              Career Improvement
            </span>

            <strong>
              AI
            </strong>

          </div>

        </div>

        <div className="skill-insights-container">

          {/* CURRENT SKILLS */}

          <div className="skills-current-card">

            <div className="skills-card-heading">

              <div>

                <span className="mini-label">
                  YOUR CURRENT PROFILE
                </span>

                <h3>
                  Technical Skill Strength
                </h3>

              </div>

              <strong>
                {resumeSkills.length}
              </strong>

            </div>

            {resumeSkills.length >
            0 ? (

              resumeSkills
                .slice(
                  0,
                  6
                )
                .map(
                  (
                    skill,
                    index
                  ) => {

                    const percentage =
                      Math.max(
                        60,
                        95 -
                          index *
                            6
                      );

                    const skillName =
                      getSkillName(
                        skill
                      );

                    return (

                      <div
                        className="skill-progress-item"
                        key={`${skillName}-${index}`}
                      >

                        <div>

                          <span>
                            {
                              skillName
                            }
                          </span>

                          <strong>
                            {
                              percentage
                            }
                            %
                          </strong>

                        </div>

                        <div className="skill-progress-bar">

                          <span
                            style={{
                              width:
                                `${percentage}%`,
                            }}
                          ></span>

                        </div>

                      </div>

                    );
                  }
                )

            ) : (

              <>

                <div className="resume-skill-empty">

                  <span>

                    <FaFileLines />

                  </span>

                  <p>
                    Upload or update
                    your resume to see
                    your technical
                    skill analysis.
                  </p>

                </div>

                <button
                  type="button"
                  className="learning-plan-button"
                  onClick={() =>
                    navigate(
                      "/resume"
                    )
                  }
                >

                  Update My Resume

                  <FaArrowRight />

                </button>

              </>

            )}

          </div>

          {/* AI SKILLS */}

          <div className="skills-ai-card">

            <div className="skills-ai-header">

              <span className="ai-spark">

                <FaWandMagicSparkles />

              </span>

              <div>

                <span className="mini-label">
                  AI RECOMMENDATION
                </span>

                <h3>
                  Learn These Next
                </h3>

              </div>

            </div>

            {learningSkills
              .slice(
                0,
                3
              )
              .map(
                (
                  skill,
                  index
                ) => {

                  const abbreviations =
                    {
                      TypeScript:
                        "TS",

                      JavaScript:
                        "JS",

                      React:
                        "RE",

                      "React.js":
                        "RE",

                      Node:
                        "ND",

                      "Node.js":
                        "ND",

                      Express:
                        "EX",

                      "Express.js":
                        "EX",

                      MongoDB:
                        "DB",

                      AWS:
                        "AWS",

                      Docker:
                        "DK",

                      Python:
                        "PY",

                      Java:
                        "JV",

                      "System Design":
                        "SD",
                    };

                  const skillName =
                    getSkillName(
                      skill
                    );

                  const icon =
                    abbreviations[
                      skillName
                    ] ||
                    skillName
                      .slice(
                        0,
                        2
                      )
                      .toUpperCase();

                  return (

                    <div
                      className="recommended-skill-row"
                      key={`${skillName}-${index}`}
                    >

                      <div className="recommended-skill-icon">

                        {icon}

                      </div>

                      <div className="recommended-skill-info">

                        <strong>
                          {
                            skillName
                          }
                        </strong>

                        <span>

                          {index ===
                          0
                            ? "High priority based on your job matches"
                            : index ===
                              1
                            ? "Can improve your recruiter opportunities"
                            : "Useful for future career growth"}

                        </span>

                      </div>

                      <div className="skill-demand high">

                        {index ===
                        0
                          ? "HIGH"
                          : "MEDIUM"}

                      </div>

                    </div>

                  );
                }
              )}

            <button
              type="button"
              className="learning-plan-button"
              onClick={
                handleLearningPath
              }
            >

              Build My Learning Plan

              <FaArrowRight />

            </button>

          </div>

        </div>

      </section>

      {/* ======================================================
          CAREER PATH
      ====================================================== */}

      <section
        className="recommendation-section career-path-section"
        id="career-path"
      >

        <div className="section-heading-large">

          <div>

            <span className="section-label">
              AI CAREER PATH
            </span>

            <h2>
              Where Your Career
              <span>
                {" "}
                Could Go Next
              </span>
            </h2>

            <p>
              Based on your resume
              and current job matches,
              TalentIQ identifies
              possible career
              directions.
            </p>

          </div>

        </div>

        <div className="career-path-container">

          <div className="career-path-line"></div>

          <div className="career-step">

            <div className="career-step-number">
              01
            </div>

            <div className="career-step-content">

              <span>
                NOW
              </span>

              <h3>
                Frontend Developer
              </h3>

              <p>
                Your React and
                JavaScript experience
                can help you qualify
                for frontend
                positions.
              </p>

              <div className="career-match">

                <span>
                  Current Match
                </span>

                <strong>
                  {Math.max(
                    averageMatch -
                      2,
                    0
                  )}
                  %
                </strong>

              </div>

            </div>

          </div>

          <div className="career-step active-career">

            <div className="career-step-number">
              02
            </div>

            <div className="career-step-content">

              <span>
                RECOMMENDED NEXT
              </span>

              <h3>
                Full Stack Developer
              </h3>

              <p>
                Your MERN stack
                profile can position
                you for full-stack
                opportunities.
              </p>

              <div className="career-match">

                <span>
                  AI Match
                </span>

                <strong>
                  {bestMatch}%
                </strong>

              </div>

            </div>

          </div>

          <div className="career-step">

            <div className="career-step-number">
              03
            </div>

            <div className="career-step-content">

              <span>
                FUTURE POTENTIAL
              </span>

              <h3>
                Software Engineer
              </h3>

              <p>
                Strengthening system
                design, cloud and
                engineering practices
                can broaden future
                opportunities.
              </p>

              <div className="career-match">

                <span>
                  Potential Match
                </span>

                <strong>
                  {Math.min(
                    Math.max(
                      bestMatch +
                        8,
                      0
                    ),
                    100
                  )}
                  %
                </strong>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ======================================================
          PERSONALIZATION
      ====================================================== */}

      <section className="recommendation-section preference-section">

        <div className="preference-card">

          <div className="preference-content">

            <span className="section-label">
              PERSONALIZE YOUR AI
            </span>

            <h2>
              Make Your
              Recommendations
              <span>
                {" "}
                More Accurate
              </span>
            </h2>

            <p>
              Update your profile and
              preferences so TalentIQ
              can continuously improve
              the recruiter jobs shown
              to you.
            </p>

            <div className="preference-tags">

              <span>

                <FaLocationDot />

                Bengaluru

              </span>

              <span>

                <FaLocationDot />

                Chennai

              </span>

              <span>

                <FaBriefcase />

                Full Time

              </span>

              <span>

                <FaRocket />

                Full Stack

              </span>

              <span>
                ₹6L+
              </span>

            </div>

            <button
              type="button"
              className="preference-button"
              onClick={() =>
                navigate(
                  "/profile"
                )
              }
            >

              Update My Preferences

              <FaArrowRight />

            </button>

          </div>

          <div className="preference-visual">

            <div className="preference-orbit orbit-one"></div>

            <div className="preference-orbit orbit-two"></div>

            <div className="preference-center">

              <FaWandMagicSparkles />

              <strong>
                AI
              </strong>

            </div>

            <div className="preference-floating pf-one">

              <FaBullseye />

            </div>

            <div className="preference-floating pf-two">

              <FaBriefcase />

            </div>

            <div className="preference-floating pf-three">

              <FaChartLine />

            </div>

          </div>

        </div>

      </section>

      {/* ======================================================
          FINAL CTA
      ====================================================== */}

      <section className="ai-final-cta">

        <div className="cta-glow"></div>

        <div className="cta-content">

          <div className="cta-icon">

            <FaWandMagicSparkles />

          </div>

          <span className="section-label">
            YOUR NEXT OPPORTUNITY IS WAITING
          </span>

          <h2>
            Let AI Find the
            <span>
              {" "}
              Right Job for You.
            </span>
          </h2>

          <p>
            Stop searching through
            thousands of jobs manually.
            Let TalentIQ compare your
            resume and skills with
            recruiter opportunities
            relevant to your career.
          </p>

          <div className="cta-buttons">

            <button
              type="button"
              className="cta-primary"
              onClick={() =>
                scrollToSection(
                  "recommended-jobs"
                )
              }
            >

              Find My Dream Job

              <FaArrowRight />

            </button>

            <button
              type="button"
              className="cta-secondary"
              onClick={() =>
                navigate(
                  "/find-jobs"
                )
              }
            >
              Start Applying
            </button>

          </div>

        </div>

      </section>

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <footer className="ai-footer">

        <div className="ai-footer-main">

          {/* BRAND */}

          <div className="ai-footer-brand">

            <div className="ai-footer-logo-row">

              <div className="ai-footer-logo-box">

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
              AI-powered career
              intelligence helping job
              seekers discover relevant
              opportunities and build
              stronger careers.
            </p>

            <div className="ai-footer-socials">

              <a
                href="https://www.linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
              >
                <FaLinkedinIn />
              </a>

              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
              >
                <FaGithub />
              </a>

              <a
                href="https://www.instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <FaInstagram />
              </a>

              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X Twitter"
              >
                <FaTwitter />
              </a>

            </div>

          </div>

          {/* CANDIDATES */}

          <div className="ai-footer-column">

            <h4>
              For Candidates
            </h4>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/find-jobs"
                )
              }
            >
              Find Jobs
            </button>

            <button
              type="button"
              onClick={() =>
                scrollToSection(
                  "recommended-jobs"
                )
              }
            >
              AI Recommendations
            </button>

            <button
              type="button"
              onClick={() =>
                scrollToSection(
                  "ai-analysis"
                )
              }
            >
              AI Analysis
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/find-jobs"
                )
              }
            >
              Apply for Jobs
            </button>

          </div>

          {/* CAREER TOOLS */}

          <div className="ai-footer-column">

            <h4>
              Career Tools
            </h4>

            <button
              type="button"
              onClick={() =>
                scrollToSection(
                  "ai-analysis"
                )
              }
            >
              Career Intelligence
            </button>

            <button
              type="button"
              onClick={() =>
                scrollToSection(
                  "recommended-jobs"
                )
              }
            >
              Job Matching
            </button>

            <button
              type="button"
              onClick={() =>
                scrollToSection(
                  "skill-insights"
                )
              }
            >
              Skill Analysis
            </button>

            <button
              type="button"
              onClick={() =>
                scrollToSection(
                  "career-path"
                )
              }
            >
              Career Path
            </button>

          </div>

          {/* TALENTIQ */}

          <div className="ai-footer-column">

            <h4>
              TalentIQ
            </h4>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/about-talentiq"
                )
              }
            >
              About Us
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/contact"
                )
              }
            >
              Contact
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/privacy-policy"
                )
              }
            >
              Privacy Policy
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/terms-conditions"
                )
              }
            >
              Terms of Service
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/help-center"
                )
              }
            >
              Help Center
            </button>

          </div>

        </div>

        <div className="ai-footer-bottom">

          <span>
            © 2026 TalentIQ. All rights reserved.
          </span>

          <span>
            AI-powered career intelligence
            for modern job seekers.
          </span>

        </div>

      </footer>

    </div>
  );
};

export default AIRecommendations;