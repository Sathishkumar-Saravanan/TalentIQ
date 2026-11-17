import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FaArrowLeft,
  FaArrowRight,
  FaBriefcase,
  FaBullseye,
  FaChartLine,
  FaCheck,
  FaCheckCircle,
  FaCode,
  FaGraduationCap,
  FaLightbulb,
  FaRocket,
  FaSpinner,
} from "react-icons/fa";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import "../styles/LearningPath.css";

// ============================================================
// API
// ============================================================

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000"
).replace(/\/$/, "");

const LEARNING_PLAN_API =
  `${API_URL}/api/learning-plan`;

const AI_RECOMMENDATIONS_API =
  `${API_URL}/api/jobs/recommendations`;

// ============================================================
// TOKEN
// ============================================================

const getToken = () => {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("talentIQToken") ||
    ""
  );
};

// ============================================================
// SAFE VALUE
// ============================================================

const getDisplayValue = (
  value,
  fallback = ""
) => {
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
      value.jobTitle ||
      value.role ||
      value.position ||
      value.value ||
      value.company ||
      value.companyName ||
      value.location ||
      fallback
    );
  }

  return fallback;
};

// ============================================================
// SKILL NAME
// ============================================================

const getSkillName = (skill) => {
  if (!skill) {
    return "";
  }

  if (typeof skill === "string") {
    return skill.trim();
  }

  if (typeof skill === "object") {
    return (
      skill.name ||
      skill.label ||
      skill.title ||
      skill.skill ||
      skill.value ||
      ""
    );
  }

  return "";
};

// ============================================================
// ARRAY NORMALIZER
// ============================================================

const normalizeArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (
    value !== null &&
    value !== undefined &&
    value !== ""
  ) {
    return [value];
  }

  return [];
};

// ============================================================
// NUMBER NORMALIZER
// ============================================================

const normalizeNumber = (
  value,
  fallback = 0
) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.max(
    0,
    Math.min(100, number)
  );
};

// ============================================================
// JOB ID
// ============================================================

const getJobId = (job) => {
  if (!job || typeof job !== "object") {
    return null;
  }

  return (
    job._id ||
    job.id ||
    job.jobId ||
    job.job?._id ||
    job.job?.id ||
    null
  );
};

// ============================================================
// MATCH SCORE
// ============================================================

const getMatchScore = (job) => {
  if (!job || typeof job !== "object") {
    return null;
  }

  const values = [
    job.matchScore,
    job.match,
    job.aiScore,
    job.score,
    job.compatibilityScore,
    job.matchPercentage,
    job.jobMatchScore,
  ];

  for (const value of values) {
    if (
      value !== null &&
      value !== undefined &&
      value !== ""
    ) {
      const number = Number(value);

      if (Number.isFinite(number)) {
        return normalizeNumber(number);
      }
    }
  }

  return null;
};

// ============================================================
// JOB NORMALIZER
// ============================================================

const normalizeJob = (job) => {
  if (!job || typeof job !== "object") {
    return null;
  }

  const id = getJobId(job);

  if (!id) {
    return null;
  }

  const nestedJob =
    job.job &&
    typeof job.job === "object"
      ? job.job
      : {};

  const matchScore =
    getMatchScore(job) ??
    getMatchScore(nestedJob);

  const skills = normalizeArray(
    job.skills ||
      job.requiredSkills ||
      nestedJob.skills ||
      nestedJob.requiredSkills
  )
    .map(getSkillName)
    .filter(Boolean);

  const matchingSkills =
    normalizeArray(
      job.matchingSkills ||
        job.matchedSkills ||
        job.matchedSkillsList ||
        nestedJob.matchingSkills ||
        nestedJob.matchedSkills
    )
      .map(getSkillName)
      .filter(Boolean);

  const missingSkills =
    normalizeArray(
      job.missingSkills ||
        job.skillsToImprove ||
        job.gapSkills ||
        nestedJob.missingSkills ||
        nestedJob.skillsToImprove
    )
      .map(getSkillName)
      .filter(Boolean);

  const role = getDisplayValue(
    job.title ||
      job.jobTitle ||
      job.role ||
      job.position ||
      nestedJob.title ||
      nestedJob.jobTitle ||
      nestedJob.role,
    "Job Opportunity"
  );

  const company = getDisplayValue(
    job.company ||
      job.companyName ||
      job.recruiterCompany ||
      job.recruiter?.companyName ||
      nestedJob.company ||
      nestedJob.companyName,
    "Company"
  );

  const location = getDisplayValue(
    job.location ||
      job.jobLocation ||
      job.city ||
      nestedJob.location ||
      nestedJob.jobLocation,
    "Location not specified"
  );

  const salary = getDisplayValue(
    job.salary ||
      job.salaryRange ||
      job.ctc ||
      job.package ||
      nestedJob.salary ||
      nestedJob.salaryRange,
    "Salary not disclosed"
  );

  const type = getDisplayValue(
    job.type ||
      job.jobType ||
      job.employmentType ||
      nestedJob.type ||
      nestedJob.jobType,
    "Full Time"
  );

  const experience = getDisplayValue(
    job.experience ||
      job.experienceLevel ||
      job.experienceRequired ||
      nestedJob.experience ||
      nestedJob.experienceLevel,
    "Not specified"
  );

  const mode = getDisplayValue(
    job.mode ||
      job.workMode ||
      job.workType ||
      nestedJob.mode ||
      nestedJob.workMode,
    "On-site"
  );

  const description = getDisplayValue(
    job.description ||
      nestedJob.description,
    ""
  );

  const reason = getDisplayValue(
    job.matchReason ||
      job.reason ||
      job.aiReason ||
      nestedJob.matchReason ||
      nestedJob.reason,
    "TalentIQ AI selected this opportunity based on your profile and resume."
  );

  return {
    ...nestedJob,
    ...job,

    id: String(id),
    _id:
      job._id ||
      nestedJob._id ||
      String(id),

    role,
    company,
    location,
    salary,
    type,
    experience,
    mode,
    description,

    skills,
    matchingSkills,
    missingSkills,

    matchScore,

    reason,

    /*
     * IMPORTANT:
     * A job is considered an AI recommendation only when
     * it has a valid match score.
     */
    isAIRecommendation:
      matchScore !== null,
  };
};

// ============================================================
// EXTRACT LEARNING PLAN
// ============================================================

const extractLearningPlan = (data) => {
  if (!data) {
    return null;
  }

  if (
    data.learningPlan &&
    typeof data.learningPlan === "object"
  ) {
    return data.learningPlan;
  }

  if (
    data.plan &&
    typeof data.plan === "object"
  ) {
    return data.plan;
  }

  if (
    data.data &&
    typeof data.data === "object"
  ) {
    if (data.data.learningPlan) {
      return data.data.learningPlan;
    }

    if (data.data.plan) {
      return data.data.plan;
    }

    return data.data;
  }

  return data;
};

// ============================================================
// NORMALIZE ROADMAP
// ============================================================

const normalizeRoadmap = (plan) => {
  if (!plan) {
    return [];
  }

  const roadmap =
    plan.roadmap ||
    plan.steps ||
    plan.learningRoadmap ||
    plan.learningSteps ||
    plan.path ||
    [];

  if (!Array.isArray(roadmap)) {
    return [];
  }

  return roadmap.map(
    (step, index) => {
      if (
        typeof step === "string"
      ) {
        return {
          id: `step-${index + 1}`,
          title: step,
          description:
            "Complete this learning step to improve your job readiness.",
          skills: [],
          duration: "1-2 weeks",
          completed: false,
        };
      }

      const skills =
        normalizeArray(
          step.skills ||
            step.skill ||
            step.topics
        )
          .map(getSkillName)
          .filter(Boolean);

      return {
        ...step,

        id:
          step._id ||
          step.id ||
          `step-${index + 1}`,

        title:
          getDisplayValue(
            step.title ||
              step.name ||
              step.topic ||
              step.skill ||
              step.learningGoal,
            `Learning Step ${index + 1}`
          ),

        description:
          getDisplayValue(
            step.description ||
              step.details ||
              step.summary ||
              step.goal,
            "Complete this learning step to improve your job readiness."
          ),

        skills,

        duration:
          getDisplayValue(
            step.duration ||
              step.time ||
              step.estimatedTime,
            "1-2 weeks"
          ),

        completed:
          Boolean(
            step.completed ||
              step.isCompleted
          ),
      };
    }
  );
};

// ============================================================
// DEFAULT ROADMAP
// ============================================================

const createDefaultRoadmap = (
  currentSkills,
  missingSkills,
  recommendedJob
) => {
  const targetRole =
    recommendedJob?.role ||
    "Full Stack Developer";

  const targetSkills =
    missingSkills.length > 0
      ? missingSkills
      : [
          "TypeScript",
          "System Design",
          "AWS",
          "Docker",
        ];

  const steps = [];

  if (targetSkills[0]) {
    steps.push({
      id: "step-1",
      title: `Master ${targetSkills[0]}`,
      description:
        `Build practical knowledge of ${targetSkills[0]} and apply it to projects related to ${targetRole}.`,
      skills: [
        targetSkills[0],
      ],
      duration: "1-2 weeks",
      completed: false,
    });
  }

  if (targetSkills[1]) {
    steps.push({
      id: "step-2",
      title: `Strengthen ${targetSkills[1]}`,
      description:
        `Learn the fundamentals of ${targetSkills[1]} and understand how it is used in production applications.`,
      skills: [
        targetSkills[1],
      ],
      duration: "1-2 weeks",
      completed: false,
    });
  }

  if (targetSkills[2]) {
    steps.push({
      id: "step-3",
      title: `Build with ${targetSkills[2]}`,
      description:
        `Create a practical project using ${targetSkills[2]} to demonstrate job-ready skills.`,
      skills: [
        targetSkills[2],
      ],
      duration: "2-3 weeks",
      completed: false,
    });
  }

  if (targetSkills[3]) {
    steps.push({
      id: "step-4",
      title: `Apply ${targetSkills[3]} in a project`,
      description:
        `Use ${targetSkills[3]} together with your existing ${currentSkills.slice(0, 3).join(", ") || "technical"} skills.`,
      skills: [
        targetSkills[3],
      ],
      duration: "2-3 weeks",
      completed: false,
    });
  }

  return steps;
};

// ============================================================
// MAIN COMPONENT
// ============================================================

const LearningPath = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // ==========================================================
  // NAVIGATION STATE
  // ==========================================================

  const navigationState =
    location.state || {};

  // ==========================================================
  // AI RECOMMENDED JOB
  // ==========================================================

  const stateAIJob =
    navigationState.aiRecommendedJob ||
    navigationState.selectedJob ||
    navigationState.recommendedJob ||
    navigationState.job ||
    null;

  // ==========================================================
  // RECOMMENDED JOBS
  // ==========================================================

  const stateRecommendedJobs =
    Array.isArray(
      navigationState.recommendedJobs
    )
      ? navigationState.recommendedJobs
      : [];

  // ==========================================================
  // INITIAL AI JOB
  // ==========================================================

  const initialAIJob =
    normalizeJob(stateAIJob);

  const initialRecommendedAIJob =
    stateRecommendedJobs
      .map(normalizeJob)
      .find(
        (job) =>
          job &&
          job.isAIRecommendation
      ) || null;

  // ==========================================================
  // STATE
  // ==========================================================

  const [
    aiRecommendedJob,
    setAIRecommendedJob,
  ] = useState(
    initialAIJob?.isAIRecommendation
      ? initialAIJob
      : initialRecommendedAIJob
  );

  const [
    learningPlan,
    setLearningPlan,
  ] = useState(null);

  const [
    roadmap,
    setRoadmap,
  ] = useState([]);

  const [
    currentSkills,
    setCurrentSkills,
  ] = useState(
    normalizeArray(
      navigationState.currentSkills
    )
      .map(getSkillName)
      .filter(Boolean)
  );

  const [
    recommendedSkills,
    setRecommendedSkills,
  ] = useState(
    normalizeArray(
      navigationState.recommendedSkills
    )
      .map(getSkillName)
      .filter(Boolean)
  );

  const [
    missingSkills,
    setMissingSkills,
  ] = useState(
    normalizeArray(
      navigationState.missingSkills
    )
      .map(getSkillName)
      .filter(Boolean)
  );

  const [
    profileScore,
    setProfileScore,
  ] = useState(
    normalizeNumber(
      navigationState.profileScore,
      0
    )
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    planLoading,
    setPlanLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    completedSteps,
    setCompletedSteps,
  ] = useState([]);

  // ==========================================================
  // FETCH AI RECOMMENDATION IF NECESSARY
  // ==========================================================

  const fetchAIRecommendation =
    useCallback(async () => {
      try {
        const token = getToken();

        if (!token) {
          throw new Error(
            "Please login to access your AI learning path."
          );
        }

        const response =
          await fetch(
            AI_RECOMMENDATIONS_API,
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

        let data = {};

        try {
          data =
            await response.json();
        } catch {
          data = {};
        }

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to retrieve AI recommendations."
          );
        }

        const jobs = Array.isArray(
          data.jobs
        )
          ? data.jobs
          : Array.isArray(
              data.recommendations
            )
          ? data.recommendations
          : Array.isArray(
              data.data
            )
          ? data.data
          : Array.isArray(
              data.results
            )
          ? data.results
          : [];

        const aiJobs = jobs
          .map(normalizeJob)
          .filter(
            (job) =>
              job &&
              job.isAIRecommendation
          );

        if (aiJobs.length === 0) {
          throw new Error(
            "No AI recommended job is currently available."
          );
        }

        setAIRecommendedJob(
          aiJobs[0]
        );

        return aiJobs[0];
      } catch (err) {
        console.error(
          "AI Recommendation Fetch Error:",
          err
        );

        throw err;
      }
    }, []);

  // ==========================================================
  // LEARNING PLAN API
  // ==========================================================

  const fetchLearningPlan =
    useCallback(
      async (selectedJob) => {
        try {
          const token = getToken();

          if (!token) {
            throw new Error(
              "Please login again."
            );
          }

          if (!selectedJob) {
            throw new Error(
              "No AI recommended job was selected."
            );
          }

          const jobId =
            getJobId(selectedJob);

          if (!jobId) {
            throw new Error(
              "The AI recommended job does not have a valid job ID."
            );
          }

          // --------------------------------------------------
          // QUERY EXISTING PLAN
          // --------------------------------------------------

          const queryUrl =
            `${LEARNING_PLAN_API}?jobId=${encodeURIComponent(
              jobId
            )}`;

          const getResponse =
            await fetch(
              queryUrl,
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

          let getData = {};

          try {
            getData =
              await getResponse.json();
          } catch {
            getData = {};
          }

          // --------------------------------------------------
          // EXISTING PLAN
          // --------------------------------------------------

          if (
            getResponse.ok &&
            getData
          ) {
            const existingPlan =
              extractLearningPlan(
                getData
              );

            if (existingPlan) {
              return existingPlan;
            }
          }

          // --------------------------------------------------
          // CREATE PLAN
          // --------------------------------------------------

          if (
            getResponse.status === 404 ||
            !getResponse.ok
          ) {
            const postPayload = {
              jobId,

              job: selectedJob,

              aiRecommendedJob:
                selectedJob,

              profileScore,

              currentSkills,

              recommendedSkills,

              missingSkills,

              topRole:
                selectedJob.role,

              bestMatch:
                normalizeNumber(
                  selectedJob.matchScore,
                  0
                ),

              resumeId:
                navigationState.resumeId ||
                null,
            };

            const postResponse =
              await fetch(
                LEARNING_PLAN_API,
                {
                  method: "POST",

                  headers: {
                    Authorization:
                      `Bearer ${token}`,

                    "Content-Type":
                      "application/json",
                  },

                  body:
                    JSON.stringify(
                      postPayload
                    ),
                }
              );

            let postData = {};

            try {
              postData =
                await postResponse.json();
            } catch {
              postData = {};
            }

            if (!postResponse.ok) {
              throw new Error(
                postData.message ||
                  "Unable to create your learning plan."
              );
            }

            const createdPlan =
              extractLearningPlan(
                postData
              );

            if (createdPlan) {
              return createdPlan;
            }
          }

          return null;
        } catch (err) {
          console.error(
            "Learning Plan API Error:",
            err
          );

          throw err;
        }
      },
      [
        currentSkills,
        missingSkills,
        navigationState.resumeId,
        profileScore,
        recommendedSkills,
      ]
    );

  // ==========================================================
  // INITIALIZE PAGE
  // ==========================================================

  useEffect(() => {
    let cancelled = false;

    const initializeLearningPath =
      async () => {
        try {
          setLoading(true);
          setError("");

          let selectedJob =
            aiRecommendedJob;

          // --------------------------------------------------
          // IF NO AI JOB WAS PASSED, FETCH ONE
          // --------------------------------------------------

          if (!selectedJob) {
            selectedJob =
              await fetchAIRecommendation();
          }

          if (
            !selectedJob ||
            !selectedJob.isAIRecommendation
          ) {
            throw new Error(
              "No AI recommended job was selected. Please open Learning Path from an AI recommendation."
            );
          }

          if (cancelled) {
            return;
          }

          setAIRecommendedJob(
            selectedJob
          );

          // --------------------------------------------------
          // SKILLS FROM AI JOB
          // --------------------------------------------------

          const jobMissingSkills =
            Array.isArray(
              selectedJob.missingSkills
            )
              ? selectedJob.missingSkills
              : [];

          const jobMatchingSkills =
            Array.isArray(
              selectedJob.matchingSkills
            )
              ? selectedJob.matchingSkills
              : [];

          if (
            jobMissingSkills.length > 0
          ) {
            setMissingSkills(
              (previous) =>
                previous.length > 0
                  ? previous
                  : jobMissingSkills
            );
          }

          if (
            jobMatchingSkills.length > 0
          ) {
            setCurrentSkills(
              (previous) =>
                previous.length > 0
                  ? previous
                  : jobMatchingSkills
            );
          }

          // --------------------------------------------------
          // FETCH / CREATE LEARNING PLAN
          // --------------------------------------------------

          setPlanLoading(true);

          let plan = null;

          try {
            plan =
              await fetchLearningPlan(
                selectedJob
              );
          } catch (planError) {
            /*
             * The UI still works if the backend
             * learning-plan endpoint is unavailable.
             *
             * A local roadmap is generated from the
             * actual AI recommendation.
             */
            console.warn(
              "Learning plan API unavailable. Creating local learning path:",
              planError
            );
          }

          if (cancelled) {
            return;
          }

          if (plan) {
            setLearningPlan(plan);

            const apiRoadmap =
              normalizeRoadmap(plan);

            if (
              apiRoadmap.length > 0
            ) {
              setRoadmap(
                apiRoadmap
              );

              const completed =
                apiRoadmap
                  .filter(
                    (step) =>
                      step.completed
                  )
                  .map(
                    (step) =>
                      String(step.id)
                  );

              setCompletedSteps(
                completed
              );
            } else {
              setRoadmap(
                createDefaultRoadmap(
                  currentSkills,
                  missingSkills.length >
                    0
                    ? missingSkills
                    : selectedJob.missingSkills ||
                      [],
                  selectedJob
                )
              );
            }
          } else {
            setRoadmap(
              createDefaultRoadmap(
                currentSkills,
                missingSkills.length >
                  0
                  ? missingSkills
                  : selectedJob.missingSkills ||
                    [],
                selectedJob
              )
            );
          }
        } catch (err) {
          if (cancelled) {
            return;
          }

          console.error(
            "Learning Path Error:",
            err
          );

          setError(
            err.message ||
              "Unable to create your learning path."
          );
        } finally {
          if (!cancelled) {
            setPlanLoading(false);
            setLoading(false);
          }
        }
      };

    initializeLearningPath();

    return () => {
      cancelled = true;
    };
  }, [
    aiRecommendedJob,
    fetchAIRecommendation,
    fetchLearningPlan,
    currentSkills,
    missingSkills,
  ]);

  // ==========================================================
  // FINAL CURRENT SKILLS
  // ==========================================================

  const normalizedCurrentSkills =
    useMemo(() => {
      return [
        ...new Set(
          normalizeArray(
            currentSkills
          )
            .map(getSkillName)
            .filter(Boolean)
        ),
      ];
    }, [currentSkills]);

  // ==========================================================
  // FINAL RECOMMENDED SKILLS
  // ==========================================================

  const normalizedRecommendedSkills =
    useMemo(() => {
      const skills =
        normalizeArray(
          recommendedSkills
        )
          .map(getSkillName)
          .filter(Boolean);

      if (skills.length > 0) {
        return [
          ...new Set(skills),
        ];
      }

      const missing =
        normalizeArray(
          missingSkills
        )
          .map(getSkillName)
          .filter(Boolean);

      if (missing.length > 0) {
        return [
          ...new Set(missing),
        ];
      }

      return [
        "TypeScript",
        "System Design",
        "AWS",
        "Docker",
      ];
    }, [
      recommendedSkills,
      missingSkills,
    ]);

  // ==========================================================
  // TARGET ROLE
  // ==========================================================

  const targetRole =
    aiRecommendedJob?.role ||
    navigationState.topRole ||
    "Full Stack Developer";

  // ==========================================================
  // MATCH SCORE
  // ==========================================================

  const matchScore =
    normalizeNumber(
      aiRecommendedJob?.matchScore ??
        navigationState.bestMatch,
      0
    );

  // ==========================================================
  // ROADMAP PROGRESS
  // ==========================================================

  const totalSteps =
    roadmap.length;

  const completedCount =
    roadmap.filter((step) =>
      completedSteps.includes(
        String(step.id)
      )
    ).length;

  const progressPercentage =
    totalSteps > 0
      ? Math.round(
          (completedCount /
            totalSteps) *
            100
        )
      : 0;

  // ==========================================================
  // TOGGLE STEP
  // ==========================================================

  const toggleStep = (
    stepId
  ) => {
    const normalizedId =
      String(stepId);

    setCompletedSteps(
      (previous) => {
        if (
          previous.includes(
            normalizedId
          )
        ) {
          return previous.filter(
            (id) =>
              id !== normalizedId
          );
        }

        return [
          ...previous,
          normalizedId,
        ];
      }
    );

    setRoadmap(
      (previous) =>
        previous.map(
          (step) =>
            String(step.id) ===
            normalizedId
              ? {
                  ...step,
                  completed:
                    !completedSteps.includes(
                      normalizedId
                    ),
                }
              : step
        )
    );
  };

  // ==========================================================
  // GO BACK
  // ==========================================================

  const handleBack = () => {
    navigate(
      "/ai-recommendations"
    );
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <div className="learning-path-page">

        <section className="learning-hero">

          <div className="learning-container">

            <div className="learning-loading">

              <FaSpinner
                className="learning-spinner"
              />

              <h2>
                Building Your Learning Path...
              </h2>

              <p>
                TalentIQ AI is analyzing
                your recommended job,
                current skills and skill gaps.
              </p>

            </div>

          </div>

        </section>

      </div>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (
    error ||
    !aiRecommendedJob
  ) {
    return (
      <div className="learning-path-page">

        <section className="learning-hero">

          <div className="learning-container">

            <div className="learning-error">

              <div className="error-icon">
                !
              </div>

              <h2>
                Learning Path Unavailable
              </h2>

              <p>
                {error ||
                  "No AI recommended job was selected. Please open Learning Path from an AI recommendation."}
              </p>

              <button
                type="button"
                className="back-button"
                onClick={
                  handleBack
                }
              >
                <FaArrowLeft />

                Back to AI Recommendations
              </button>

            </div>

          </div>

        </section>

      </div>
    );
  }

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <div className="learning-path-page">

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="learning-hero">

        <div className="learning-container">

          <button
            type="button"
            className="learning-back-button"
            onClick={
              handleBack
            }
          >
            <FaArrowLeft />

            Back to AI Recommendations
          </button>

          <div className="learning-hero-content">

            <div className="learning-hero-badge">
              <FaRocket />

              TALENTIQ AI LEARNING PATH
            </div>

            <h1>
              Build the Skills
              <span>
                Your Target Job Needs.
              </span>
            </h1>

            <p>
              TalentIQ AI created this
              personalized learning path
              using your profile, current
              skills and the AI-recommended
              opportunity.
            </p>

          </div>

          {/* TARGET JOB */}

          <div className="learning-target-job">

            <div className="target-job-icon">
              <FaBriefcase />
            </div>

            <div className="target-job-content">

              <span>
                AI RECOMMENDED JOB
              </span>

              <h2>
                {aiRecommendedJob.role}
              </h2>

              <p>
                {aiRecommendedJob.company}
              </p>

              <div className="target-job-meta">

                <span>
                  📍{" "}
                  {aiRecommendedJob.location}
                </span>

                <span>
                  💼{" "}
                  {aiRecommendedJob.type}
                </span>

                <span>
                  🏠{" "}
                  {aiRecommendedJob.mode}
                </span>

              </div>

            </div>

            <div className="target-job-match">

              <strong>
                {matchScore}%
              </strong>

              <span>
                AI Match
              </span>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="learning-container">


        {/* ===================================================
            PROGRESS
        =================================================== */}

        <section className="progress-card">

          <div className="progress-card-header">

            <div>

              <span className="mini-label">
                YOUR PROGRESS
              </span>

              <h2>
                Learning Path Progress
              </h2>

              <p>
                Complete each step to
                improve your readiness
                for {targetRole}.
              </p>

            </div>

            <div className="progress-percentage">

              <strong>
                {progressPercentage}%
              </strong>

              <span>
                Complete
              </span>

            </div>

          </div>

          <div className="progress-bar">

            <div
              style={{
                width: `${progressPercentage}%`,
              }}
            ></div>

          </div>

          <div className="progress-footer">

            <span>
              {completedCount} of{" "}
              {totalSteps} steps completed
            </span>

            <span>
              {totalSteps -
                completedCount} remaining
            </span>

          </div>

        </section>


        {/* ===================================================
            CURRENT SKILLS
        =================================================== */}

        <section className="skills-section">

          <div className="section-heading">

            <div>

              <span className="section-label">
                YOUR FOUNDATION
              </span>

              <h2>
                Skills You Already Have
              </h2>

              <p>
                TalentIQ uses your existing
                skills as the foundation
                of your learning path.
              </p>

            </div>

            <div className="section-heading-icon">
              <FaCode />
            </div>

          </div>

          <div className="current-skills-grid">

            {normalizedCurrentSkills.length >
            0 ? (
              normalizedCurrentSkills
                .slice(0, 12)
                .map(
                  (
                    skill,
                    index
                  ) => (
                    <div
                      className="current-skill"
                      key={`${skill}-${index}`}
                    >
                      <FaCheckCircle />

                      <span>
                        {skill}
                      </span>
                    </div>
                  )
                )
            ) : (
              <div className="empty-skills">
                <FaLightbulb />

                <p>
                  Your current resume
                  skills will be used as
                  the foundation of your
                  learning plan.
                </p>
              </div>
            )}

          </div>

        </section>


        {/* ===================================================
            RECOMMENDED SKILLS
        =================================================== */}

        <section className="skills-section recommended-skills-section">

          <div className="section-heading">

            <div>

              <span className="section-label">
                AI SKILL GAP
              </span>

              <h2>
                Skills To Develop
              </h2>

              <p>
                These skills are connected
                to your AI-recommended
                opportunity.
              </p>

            </div>

            <div className="section-heading-icon">
              <FaBullseye />
            </div>

          </div>

          <div className="recommended-skills-grid">

            {normalizedRecommendedSkills
              .slice(0, 8)
              .map(
                (
                  skill,
                  index
                ) => (
                  <div
                    className="recommended-skill"
                    key={`${skill}-${index}`}
                  >

                    <div className="recommended-skill-number">
                      {String(
                        index + 1
                      ).padStart(
                        2,
                        "0"
                      )}
                    </div>

                    <div className="recommended-skill-main">

                      <h3>
                        {skill}
                      </h3>

                      <p>
                        {index === 0
                          ? "Highest priority based on your AI job match."
                          : index === 1
                          ? "Important for improving your recruiter opportunities."
                          : "Useful for strengthening your target-role profile."}
                      </p>

                    </div>

                    <FaArrowRight />

                  </div>
                )
              )}

          </div>

        </section>


        {/* ===================================================
            ROADMAP
        =================================================== */}

        <section className="roadmap-section">

          <div className="section-heading">

            <div>

              <span className="section-label">
                PERSONALIZED ROADMAP
              </span>

              <h2>
                Your Learning Journey
              </h2>

              <p>
                Follow these steps in order
                and build practical skills
                for your target opportunity.
              </p>

            </div>

            <div className="section-heading-icon">
              <FaGraduationCap />
            </div>

          </div>


          <div className="roadmap-container">

            <div className="roadmap-line"></div>

            {roadmap.length === 0 ? (

              <div className="empty-roadmap">

                <FaGraduationCap />

                <h3>
                  Your roadmap is being prepared
                </h3>

                <p>
                  TalentIQ will generate
                  learning steps from your
                  AI recommendation.
                </p>

              </div>

            ) : (

              roadmap.map(
                (
                  step,
                  index
                ) => {

                  const stepId =
                    String(
                      step.id
                    );

                  const isCompleted =
                    completedSteps.includes(
                      stepId
                    );

                  const isCurrent =
                    !isCompleted &&
                    !completedSteps
                      .slice(
                        0,
                        index
                      )
                      .includes(
                        stepId
                      );

                  return (
                    <article
                      className={
                        isCompleted
                          ? "roadmap-step completed-step"
                          : isCurrent
                          ? "roadmap-step active-step"
                          : "roadmap-step"
                      }
                      key={stepId}
                    >

                      <div className="roadmap-step-number">

                        {isCompleted ? (
                          <FaCheck />
                        ) : (
                          String(
                            index + 1
                          ).padStart(
                            2,
                            "0"
                          )
                        )}

                      </div>

                      <div className="roadmap-step-content">

                        <div className="roadmap-step-top">

                          <div>

                            <span className="roadmap-step-label">
                              {isCompleted
                                ? "COMPLETED"
                                : isCurrent
                                ? "CURRENT STEP"
                                : `STEP ${
                                    index +
                                    1
                                  }`}
                            </span>

                            <h3>
                              {step.title}
                            </h3>

                          </div>

                          <span className="roadmap-duration">
                            🕒{" "}
                            {step.duration}
                          </span>

                        </div>

                        <p>
                          {step.description}
                        </p>

                        {step.skills?.length >
                          0 && (
                          <div className="roadmap-skills">

                            {step.skills
                              .slice(
                                0,
                                6
                              )
                              .map(
                                (
                                  skill,
                                  skillIndex
                                ) => (
                                  <span
                                    key={`${skill}-${skillIndex}`}
                                  >
                                    {skill}
                                  </span>
                                )
                              )}

                          </div>
                        )}

                        <div className="roadmap-step-action">

                          <button
                            type="button"
                            className={
                              isCompleted
                                ? "step-complete-button completed"
                                : "step-complete-button"
                            }
                            onClick={() =>
                              toggleStep(
                                stepId
                              )
                            }
                          >

                            {isCompleted ? (
                              <>
                                <FaCheckCircle />

                                Completed
                              </>
                            ) : (
                              <>
                                <FaCheck />

                                Mark as Complete
                              </>
                            )}

                          </button>

                        </div>

                      </div>

                    </article>
                  );
                }
              )

            )}

          </div>

        </section>


        {/* ===================================================
            CAREER INSIGHT
        =================================================== */}

        <section className="career-insight">

          <div className="career-insight-icon">
            <FaChartLine />
          </div>

          <div className="career-insight-content">

            <span className="section-label">
              TALENTIQ AI INSIGHT
            </span>

            <h2>
              Your Learning Path Is
              Connected to a Real Job
            </h2>

            <p>
              This roadmap is based on
              the skills required by your
              AI-recommended opportunity.
              Completing these steps can
              help you strengthen the gap
              between your current profile
              and your target role.
            </p>

            <div className="career-insight-stats">

              <div>

                <strong>
                  {matchScore}%
                </strong>

                <span>
                  Current AI Match
                </span>

              </div>

              <div>

                <strong>
                  {normalizedCurrentSkills.length}
                </strong>

                <span>
                  Existing Skills
                </span>

              </div>

              <div>

                <strong>
                  {
                    normalizedRecommendedSkills.length
                  }
                </strong>

                <span>
                  Skills to Develop
                </span>

              </div>

            </div>

          </div>

        </section>


        {/* ===================================================
            TARGET JOB
        =================================================== */}

        <section className="learning-target-section">

          <div className="target-job-card">

            <div className="target-job-card-icon">
              <FaBriefcase />
            </div>

            <div className="target-job-card-content">

              <span>
                YOUR AI TARGET
              </span>

              <h2>
                {aiRecommendedJob.role}
              </h2>

              <p>
                {aiRecommendedJob.company}
              </p>

              <div className="target-job-card-details">

                <span>
                  📍{" "}
                  {aiRecommendedJob.location}
                </span>

                <span>
                  💼{" "}
                  {aiRecommendedJob.type}
                </span>

                <span>
                  🕒{" "}
                  {aiRecommendedJob.experience}
                </span>

              </div>

            </div>

            <div className="target-job-card-score">

              <strong>
                {matchScore}%
              </strong>

              <span>
                AI Match
              </span>

            </div>

          </div>

        </section>


        {/* ===================================================
            FINAL CTA
        =================================================== */}

        <section className="learning-final-cta">

          <div className="learning-final-cta-icon">
            <FaRocket />
          </div>

          <h2>
            Ready to Build Your
            <span>
              Next-Level Skills?
            </span>
          </h2>

          <p>
            Keep completing your learning
            path and strengthen your profile
            for {targetRole}.
          </p>

          <div className="learning-final-actions">

            <button
              type="button"
              className="learning-primary-button"
              onClick={() => {
                document
                  .getElementById(
                    "learning-roadmap"
                  )
                  ?.scrollIntoView({
                    behavior:
                      "smooth",
                  });
              }}
            >
              Continue Learning

              <FaArrowRight />
            </button>

            <button
              type="button"
              className="learning-secondary-button"
              onClick={
                handleBack
              }
            >
              <FaArrowLeft />

              Back to AI Recommendations
            </button>

          </div>

        </section>

      </main>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="learning-footer">

        <div className="learning-footer-main">

          <div className="learning-footer-brand">

            <div className="learning-footer-logo">

              <img
                src="/images/TalentIQ_Logo.png"
                alt="TalentIQ"
              />

              <strong>
                Talent<span>IQ</span>
              </strong>

            </div>

            <p>
              AI-powered career intelligence
              helping job seekers discover
              opportunities and build
              job-ready skills.
            </p>

          </div>


          <div className="learning-footer-links">

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/ai-recommendations"
                )
              }
            >
              AI Recommendations
            </button>

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
                navigate(
                  "/resume"
                )
              }
            >
              Resume
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/profile"
                )
              }
            >
              Profile
            </button>

          </div>

        </div>

        <div className="learning-footer-bottom">

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

export default LearningPath;