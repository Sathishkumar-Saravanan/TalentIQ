import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import "../styles/dashboard.css";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const DASHBOARD_API =
  `${API_BASE}/dashboard/candidate`;

const PROFILE_API =
  `${API_BASE}/profile`;

const RESUME_API =
  `${API_BASE}/resumes`;

const NOTIFICATIONS_API =
  `${API_BASE}/notifications`;

const emptyProfile = {
  fullName: "",
  email: "",
  phone: "",
  location: "",
  headline: "",
  bio: "",

  education: {
    degree: "",
    college: "",
    graduationYear: "",
    percentage: "",
  },

  experience: {
    jobTitle: "",
    company: "",
    experienceLevel: "",
    years: "",
  },

  skills: [],

  careerPreferences: {
    targetRole: "",
    preferredLocation: "",
    employmentType: "Full Time",
    expectedSalary: "",
    remotePreference: "",
  },

  resume: "",
  resumeFileId: null,
  resumeOriginalName: "",
  resumeMimeType: "",
  resumeUploadedAt: null,
};

const emptyResume = {
  personalInfo: {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    portfolio: "",
  },

  headline: "",
  summary: "",
  skills: [],
  education: [],
  experience: [],
  projects: [],
  certifications: [],
  achievements: [],
  languages: [],
};

export default function Dashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [dashboard, setDashboard] =
    useState(null);

  const [profile, setProfile] =
    useState(emptyProfile);

  const [resume, setResume] =
    useState(emptyResume);

  /* ============================================================
     NOTIFICATIONS
  ============================================================ */

  const [unreadNotificationCount, setUnreadNotificationCount] =
    useState(0);

  const [notificationLoading, setNotificationLoading] =
    useState(false);

  /* ============================================================
     TOKEN
  ============================================================ */

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("accessToken")
    );
  };

  /* ============================================================
     HEADERS
  ============================================================ */

  const getHeaders = () => {
    const token = getToken();

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

  /* ============================================================
     LOGOUT
  ============================================================ */

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");

    navigate("/login");
  };

  /* ============================================================
     LOAD NOTIFICATIONS
     
     Backend:
     GET /api/notifications
     
     Response:
     {
       success: true,
       unreadCount: number,
       notifications: [...]
     }
  ============================================================ */

  const loadNotifications = async () => {
    const token = getToken();

    if (!token) {
      return;
    }

    try {
      setNotificationLoading(true);

      const response = await fetch(
        `${NOTIFICATIONS_API}?page=1&limit=20`,
        {
          method: "GET",
          headers: getHeaders(),
        }
      );

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok) {
        /*
         * Notification failure should not
         * prevent the dashboard from loading.
         */
        setUnreadNotificationCount(0);
        return;
      }

      const data =
        await response.json();

      const unreadCount = Number(
        data?.unreadCount || 0
      );

      setUnreadNotificationCount(
        Number.isFinite(unreadCount)
          ? Math.max(0, unreadCount)
          : 0
      );
    } catch (err) {
      console.error(
        "Notification loading error:",
        err
      );

      /*
       * Keep dashboard working even if
       * notification API is unavailable.
       */
      setUnreadNotificationCount(0);
    } finally {
      setNotificationLoading(false);
    }
  };

  /* ============================================================
     OPEN NOTIFICATIONS
  ============================================================ */

  const openNotifications = () => {
    navigate("/candidate-notifications");
  };

  /* ============================================================
     NORMALIZE PROFILE
  ============================================================ */

  const normalizeProfile = (
    user = {}
  ) => {
    return {
      ...emptyProfile,
      ...user,

      education: {
        ...emptyProfile.education,
        ...(user.education || {}),
      },

      experience: {
        ...emptyProfile.experience,
        ...(user.experience || {}),
      },

      careerPreferences: {
        ...emptyProfile.careerPreferences,
        ...(user.careerPreferences || {}),
      },

      skills: Array.isArray(user.skills)
        ? user.skills
        : [],

      resume:
        user.resume || "",

      resumeFileId:
        user.resumeFileId || null,

      resumeOriginalName:
        user.resumeOriginalName || "",

      resumeMimeType:
        user.resumeMimeType || "",

      resumeUploadedAt:
        user.resumeUploadedAt || null,
    };
  };

  /* ============================================================
     NORMALIZE RESUME
  ============================================================ */

  const normalizeResume = (
    data = {}
  ) => {
    return {
      ...emptyResume,
      ...data,

      personalInfo: {
        ...emptyResume.personalInfo,
        ...(data.personalInfo || {}),
      },

      skills: Array.isArray(data.skills)
        ? data.skills
        : [],

      education: Array.isArray(data.education)
        ? data.education
        : [],

      experience: Array.isArray(data.experience)
        ? data.experience
        : [],

      projects: Array.isArray(data.projects)
        ? data.projects
        : [],

      certifications:
        Array.isArray(data.certifications)
          ? data.certifications
          : [],

      achievements:
        Array.isArray(data.achievements)
          ? data.achievements
          : [],

      languages:
        Array.isArray(data.languages)
          ? data.languages
          : [],
    };
  };

  /* ============================================================
     LOAD DASHBOARD
  ============================================================ */

  const loadDashboard = async () => {
    const token = getToken();

    if (!token) {
      logout();
      return;
    }

    setLoading(true);
    setError("");

    try {
      const responses =
        await Promise.all([
          fetch(DASHBOARD_API, {
            method: "GET",
            headers: getHeaders(),
          }),

          fetch(PROFILE_API, {
            method: "GET",
            headers: getHeaders(),
          }),

          fetch(RESUME_API, {
            method: "GET",
            headers: getHeaders(),
          }),

          /*
           * Notification API is loaded together
           * with the dashboard.
           */
          fetch(
            `${NOTIFICATIONS_API}?page=1&limit=20`,
            {
              method: "GET",
              headers: getHeaders(),
            }
          ),
        ]);

      const [
        dashboardResponse,
        profileResponse,
        resumeResponse,
        notificationResponse,
      ] = responses;

      /* ========================================================
         AUTH ERROR
      ======================================================== */

      if (
        dashboardResponse.status === 401 ||
        profileResponse.status === 401 ||
        resumeResponse.status === 401 ||
        notificationResponse.status === 401
      ) {
        logout();
        return;
      }

      /* ========================================================
         DASHBOARD
      ======================================================== */

      if (dashboardResponse.ok) {
        const dashboardData =
          await dashboardResponse.json();

        const dashboardValue =
          dashboardData.dashboard ||
          dashboardData.data ||
          dashboardData;

        setDashboard(
          dashboardValue || null
        );
      }

      /* ========================================================
         PROFILE
      ======================================================== */

      if (profileResponse.ok) {
        const profileData =
          await profileResponse.json();

        const user =
          profileData.user ||
          profileData.profile ||
          profileData.data ||
          profileData;

        setProfile(
          normalizeProfile(user)
        );
      }

      /* ========================================================
         RESUME

         Supports:

         {
           resume: {...}
         }

         and

         {
           data: {
             resume: {...}
           }
         }
      ======================================================== */

      if (resumeResponse.ok) {
        const resumeData =
          await resumeResponse.json();

        const resumeValue =
          resumeData.resume ||
          resumeData.data?.resume ||
          resumeData.data;

        if (resumeValue) {
          setResume(
            normalizeResume(
              resumeValue
            )
          );
        }
      }

      /* ========================================================
         NOTIFICATIONS
      ======================================================== */

      if (notificationResponse.ok) {
        const notificationData =
          await notificationResponse.json();

        const unreadCount =
          Number(
            notificationData?.unreadCount || 0
          );

        setUnreadNotificationCount(
          Number.isFinite(unreadCount)
            ? Math.max(
                0,
                unreadCount
              )
            : 0
        );
      } else {
        /*
         * Do not display an error over
         * the whole dashboard if only the
         * notification API has a problem.
         */
        setUnreadNotificationCount(0);
      }
    } catch (err) {
      console.error(
        "Dashboard loading error:",
        err
      );

      setError(
        err.message ||
          "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ============================================================
     INITIAL LOAD
  ============================================================ */

  useEffect(() => {
    loadDashboard();
  }, []);

  /* ============================================================
     REFRESH NOTIFICATIONS
     
     Refresh periodically so the bell can show
     newly-created recruiter notifications.
  ============================================================ */

  useEffect(() => {
    const token = getToken();

    if (!token) {
      return undefined;
    }

    const interval =
      window.setInterval(() => {
        loadNotifications();
      }, 30000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  /* ============================================================
     CANDIDATE NAME

     Checks profile + resume + dashboard + localStorage
  ============================================================ */

  const candidateName =
    useMemo(() => {
      let localUser = {};

      try {
        localUser =
          JSON.parse(
            localStorage.getItem(
              "user"
            ) || "{}"
          );
      } catch {
        localUser = {};
      }

      return (
        profile.fullName?.trim() ||
        resume.personalInfo?.fullName?.trim() ||
        dashboard?.candidate?.fullName?.trim() ||
        dashboard?.candidate?.name?.trim() ||
        dashboard?.user?.fullName?.trim() ||
        dashboard?.user?.name?.trim() ||
        localUser.fullName?.trim() ||
        localUser.name?.trim() ||
        "Candidate"
      );
    }, [
      profile,
      resume,
      dashboard,
    ]);

  /* ============================================================
     EMAIL
  ============================================================ */

  const candidateEmail =
    useMemo(() => {
      return (
        profile.email ||
        resume.personalInfo?.email ||
        dashboard?.candidate?.email ||
        dashboard?.user?.email ||
        ""
      );
    }, [
      profile,
      resume,
      dashboard,
    ]);

  /* ============================================================
     TARGET ROLE
  ============================================================ */

  const targetRole =
    useMemo(() => {
      return (
        profile.careerPreferences
          ?.targetRole ||
        profile.headline ||
        resume.headline ||
        dashboard?.candidate?.role ||
        "Full Stack Developer"
      );
    }, [
      profile,
      resume,
      dashboard,
    ]);

  /* ============================================================
     EDUCATION CHECK
  ============================================================ */

  const hasProfileEducation =
    useMemo(() => {
      const education =
        profile.education;

      if (!education) {
        return false;
      }

      return Boolean(
        String(
          education.degree || ""
        ).trim() ||
          String(
            education.college || ""
          ).trim() ||
          String(
            education.graduationYear ||
              ""
          ).trim() ||
          String(
            education.percentage || ""
          ).trim()
      );
    }, [profile.education]);

  const hasResumeEducation =
    useMemo(() => {
      return (
        Array.isArray(
          resume.education
        ) &&
        resume.education.some(
          (item) => {
            if (!item) {
              return false;
            }

            return Boolean(
              String(
                item.degree || ""
              ).trim() ||
                String(
                  item.institution ||
                    ""
                ).trim() ||
                String(
                  item.field || ""
                ).trim() ||
                String(
                  item.endDate || ""
                ).trim() ||
                String(
                  item.grade || ""
                ).trim()
            );
          }
        )
      );
    }, [resume.education]);

  const hasEducation =
    hasProfileEducation ||
    hasResumeEducation;

  /* ============================================================
     SKILLS CHECK
  ============================================================ */

  const hasSkills =
    useMemo(() => {
      return (
        (
          Array.isArray(
            profile.skills
          ) &&
          profile.skills.length > 0
        ) ||
        (
          Array.isArray(
            resume.skills
          ) &&
          resume.skills.length > 0
        )
      );
    }, [
      profile.skills,
      resume.skills,
    ]);

  /* ============================================================
     EXPERIENCE CHECK
  ============================================================ */

  const hasExperience =
    useMemo(() => {
      const experience =
        profile.experience;

      const profileExperience =
        Boolean(
          String(
            experience?.jobTitle ||
              ""
          ).trim() ||
            String(
              experience?.company ||
                ""
            ).trim() ||
            String(
              experience
                ?.experienceLevel ||
                ""
            ).trim() ||
            String(
              experience?.years ||
                ""
            ).trim()
        );

      const resumeExperience =
        Array.isArray(
          resume.experience
        ) &&
        resume.experience.some(
          (item) => {
            if (!item) {
              return false;
            }

            return Boolean(
              String(
                item.position || ""
              ).trim() ||
                String(
                  item.company || ""
                ).trim() ||
                String(
                  item.description ||
                    ""
                ).trim()
            );
          }
        );

      return (
        profileExperience ||
        resumeExperience
      );
    }, [
      profile.experience,
      resume.experience,
    ]);

  /* ============================================================
     RESUME CHECK

     Resume can be complete even when no uploaded PDF exists.
  ============================================================ */

  const hasResume =
    useMemo(() => {
      return Boolean(
        profile.resume ||
          profile.resumeOriginalName ||
          resume.personalInfo?.fullName ||
          resume.personalInfo?.email ||
          resume.headline ||
          resume.summary ||
          resume.skills?.length ||
          resume.education?.length ||
          resume.experience?.length ||
          resume.projects?.length ||
          resume.certifications?.length ||
          resume.achievements?.length ||
          resume.languages?.length
      );
    }, [
      profile,
      resume,
    ]);

  /* ============================================================
     PERSONAL INFORMATION
  ============================================================ */

  const hasPersonalInformation =
    useMemo(() => {
      const nameExists =
        candidateName &&
        candidateName !==
          "Candidate";

      return Boolean(
        nameExists &&
          (
            candidateEmail ||
            profile.phone ||
            profile.location ||
            resume.personalInfo
              ?.phone ||
            resume.personalInfo
              ?.location
          )
      );
    }, [
      candidateName,
      candidateEmail,
      profile.phone,
      profile.location,
      resume.personalInfo,
    ]);

  /* ============================================================
     TARGET ROLE
  ============================================================ */

  const hasTargetRole =
    Boolean(
      profile.careerPreferences
        ?.targetRole ||
        profile.headline ||
        resume.headline
    );

  /* ============================================================
     PROFILE COMPLETION
  ============================================================ */

  const profileCompletion =
    useMemo(() => {
      const checklist = [
        hasPersonalInformation,
        hasEducation,
        hasSkills,
        hasExperience,
        hasResume,
        hasTargetRole,
      ];

      const completed =
        checklist.filter(
          Boolean
        ).length;

      return Math.round(
        (
          completed /
          checklist.length
        ) * 100
      );
    }, [
      hasPersonalInformation,
      hasEducation,
      hasSkills,
      hasExperience,
      hasResume,
      hasTargetRole,
    ]);

  /* ============================================================
     STATISTICS
  ============================================================ */

  const statistics =
    dashboard?.statistics ||
    dashboard?.applicationStatistics ||
    {};

  const totalApplications =
    Number(
      statistics.totalApplications ||
        0
    );

  const shortlisted =
    Number(
      statistics.shortlisted ||
        0
    );

  const interviews =
    Number(
      statistics.interviews ||
        0
    );

  const selected =
    Number(
      statistics.selected ||
        0
    );

  const responseRate =
    totalApplications > 0
      ? Math.min(
          100,
          Math.round(
            (
              (
                shortlisted +
                interviews +
                selected
              ) /
              totalApplications
            ) * 100
          )
        )
      : 0;

  /* ============================================================
     RESUME SCORE
  ============================================================ */

  const resumeScore =
    useMemo(() => {
      const score =
        dashboard?.resume?.score ??
        dashboard?.resume?.atsScore ??
        resume?.atsScore ??
        resume?.resumeScore ??
        null;

      if (
        score === null ||
        score === undefined ||
        score === ""
      ) {
        return 0;
      }

      const numericScore =
        Number(score);

      if (
        Number.isNaN(
          numericScore
        )
      ) {
        return 0;
      }

      return Math.max(
        0,
        Math.min(
          100,
          numericScore
        )
      );
    }, [
      dashboard,
      resume,
    ]);

  /* ============================================================
     EDUCATION DISPLAY
  ============================================================ */

  const educationText =
    useMemo(() => {
      if (hasProfileEducation) {
        return [
          profile.education?.degree,
          profile.education?.college,
          profile.education
            ?.graduationYear,
        ]
          .filter(Boolean)
          .join(" • ");
      }

      const education =
        resume.education?.find(
          (item) =>
            item &&
            (
              item.degree ||
              item.institution ||
              item.field
            )
        );

      if (education) {
        return [
          education.degree,
          education.institution,
          education.field,
          education.endDate,
          education.grade,
        ]
          .filter(Boolean)
          .join(" • ");
      }

      return "";
    }, [
      hasProfileEducation,
      profile.education,
      resume.education,
    ]);

  /* ============================================================
     RESUME DATA HELPERS
  ============================================================ */

  const resumePersonalInfo =
    resume.personalInfo || {};

  const resumeSkills =
    Array.isArray(
      resume.skills
    )
      ? resume.skills
      : [];

  const resumeEducation =
    Array.isArray(
      resume.education
    )
      ? resume.education
      : [];

  const resumeExperience =
    Array.isArray(
      resume.experience
    )
      ? resume.experience
      : [];

  const resumeProjects =
    Array.isArray(
      resume.projects
    )
      ? resume.projects
      : [];

  const resumeCertifications =
    Array.isArray(
      resume.certifications
    )
      ? resume.certifications
      : [];

  const resumeAchievements =
    Array.isArray(
      resume.achievements
    )
      ? resume.achievements
      : [];

  const resumeLanguages =
    Array.isArray(
      resume.languages
    )
      ? resume.languages
      : [];

  /* ============================================================
     CHECKLIST
  ============================================================ */

  const checklist = [
    {
      label:
        "Personal Information",
      completed:
        hasPersonalInformation,
      icon: "👤",
    },
    {
      label: "Education",
      completed:
        hasEducation,
      icon: "🎓",
    },
    {
      label: "Skills",
      completed:
        hasSkills,
      icon: "🧠",
    },
    {
      label: "Experience",
      completed:
        hasExperience,
      icon: "💼",
    },
    {
      label: "Resume",
      completed:
        hasResume,
      icon: "📄",
    },
    {
      label: "Target Role",
      completed:
        hasTargetRole,
      icon: "🎯",
    },
  ];

  /* ============================================================
     LOADING
  ============================================================ */

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="dashboard-loader">
          <div className="loader-ring"></div>

          <h3>
            Loading your TalentIQ dashboard...
          </h3>

          <p>
            Syncing your profile, resume and
            career information.
          </p>
        </div>
      </div>
    );
  }

  /* ============================================================
     PAGE
  ============================================================ */

  return (
    <div className="dashboard-page">

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="dashboard-error">
          <span className="error-symbol">
            !
          </span>

          <div>
            <strong>
              Unable to load some dashboard data
            </strong>

            <p>
              {error}
            </p>

            <button
              type="button"
              onClick={
                loadDashboard
              }
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* ======================================================
          HERO
      ====================================================== */}

      <section className="dashboard-hero">

        <div className="hero-decoration hero-decoration-one"></div>

        <div className="hero-decoration hero-decoration-two"></div>

        <div className="dashboard-container hero-inner">

          <div className="hero-content">

            {/* ==================================================
                PLATFORM BADGE + NOTIFICATION
            ================================================== */}

            <div className="hero-platform-row">

              <span className="platform-badge">
                ✨ AI-POWERED CAREER PLATFORM
              </span>

              <button
                type="button"
                className="dashboard-notification-btn"
                onClick={
                  openNotifications
                }
                aria-label={
                  unreadNotificationCount > 0
                    ? `${unreadNotificationCount} unread notifications`
                    : "Notifications"
                }
                title="Notifications"
              >

                <svg
                  className="dashboard-notification-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M18 8C18 4.686 15.314 2 12 2C8.686 2 6 4.686 6 8C6 13 4 15 3 16.5C2.5 17.25 3.04 18 4 18H20C20.96 18 21.5 17.25 21 16.5C20 15 18 13 18 8Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  <path
                    d="M9.5 21C10.12 21.62 11 22 12 22C13 22 13.88 21.62 14.5 21"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>

                {unreadNotificationCount > 0 && (
                  <span className="dashboard-notification-count">
                    {unreadNotificationCount >
                    99
                      ? "99+"
                      : unreadNotificationCount}
                  </span>
                )}

              </button>

            </div>

            <h1>
              Welcome back{" "}
              <span>
                {candidateName}
              </span>{" "}
              <span className="wave">
                👋
              </span>
            </h1>

            <p>
              Track your applications, discover
              opportunities and improve your career
              with TalentIQ AI.
            </p>

            <div className="hero-status">

              <span>
                🎯 Profile strength:{" "}
                <strong>
                  {profileCompletion >=
                  85
                    ? "Excellent"
                    : profileCompletion >=
                      60
                    ? "Good"
                    : "Needs Improvement"}
                </strong>
              </span>

              <span className="status-dot">
                •
              </span>

              <span>
                🔥 {totalApplications} AI
                opportunities
              </span>

            </div>

          </div>

          <button
            type="button"
            className="explore-jobs-btn"
            onClick={() =>
              navigate(
                "/find-jobs"
              )
            }
          >
            Explore Jobs
            <span>
              →
            </span>
          </button>

        </div>
      </section>

      {/* ======================================================
          MAIN
      ====================================================== */}

      <main className="dashboard-container">

        {/* ====================================================
            STATISTICS
        ==================================================== */}

        <section className="dashboard-stat-grid">

          <div className="stat-card">

            <div className="stat-icon purple">
              📄
            </div>

            <div className="stat-content">

              <span>
                Applications
              </span>

              <strong>
                {totalApplications}
              </strong>

              <small>
                Total submitted
              </small>

            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon blue">
              🎯
            </div>

            <div className="stat-content">

              <span>
                Profile Match
              </span>

              <strong>
                {profileCompletion}%
              </strong>

              <small>
                AI profile match
              </small>

            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon green">
              💼
            </div>

            <div className="stat-content">

              <span>
                Shortlisted
              </span>

              <strong>
                {shortlisted}
              </strong>

              <small>
                {interviews} interviews
              </small>

            </div>

          </div>

          <div className="stat-card">

            <div className="stat-icon orange">
              📊
            </div>

            <div className="stat-content">

              <span>
                Response Rate
              </span>

              <strong>
                {responseRate}%
              </strong>

              <small>
                Interview response rate
              </small>

            </div>

          </div>

        </section>

        {/* ====================================================
            PROFILE
        ==================================================== */}

        <section className="dashboard-card professional-profile-card">

          <div className="card-heading">

            <div>

              <span className="section-label">
                PROFILE
              </span>

              <h2>
                👤 Professional Profile
              </h2>

              <p>
                Information connected from your
                TalentIQ profile.
              </p>

            </div>

            <button
              type="button"
              className="edit-profile-link"
              onClick={() =>
                navigate(
                  "/profile"
                )
              }
            >
              Edit Profile →
            </button>

          </div>

          <div className="profile-overview">

            <div className="profile-identity">

              <div className="profile-avatar">
                {candidateName
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="identity-details">

                <h3>
                  {candidateName}
                </h3>

                <strong>
                  {targetRole}
                </strong>

                {candidateEmail && (
                  <p>
                    ✉️ {candidateEmail}
                  </p>
                )}

              </div>

            </div>

            <div className="profile-info-box">

              <span>
                📍 Location
              </span>

              <strong>
                {profile.location ||
                  resumePersonalInfo.location ||
                  "Location not added"}
              </strong>

            </div>

            <div className="profile-info-box">

              <span>
                💼 Experience
              </span>

              <strong>
                {profile.experience?.experienceLevel ||
                  profile.experience?.years ||
                  (
                    hasExperience
                      ? "Experience Added"
                      : "Not added"
                  )}
              </strong>

            </div>

            <div className="profile-info-box">

              <span>
                🎓 Education
              </span>

              <strong>
                {educationText ||
                  "No education added"}
              </strong>

            </div>

            <div className="profile-info-box">

              <span>
                🎯 Target Role
              </span>

              <strong>
                {targetRole}
              </strong>

            </div>

          </div>

          <div className="dashboard-skills">

            <h4>
              Skills
            </h4>

            <div className="dashboard-skill-list">

              {(profile.skills?.length
                ? profile.skills
                : resumeSkills
              ).map(
                (
                  skill,
                  index
                ) => (
                  <span
                    key={`${skill}-${index}`}
                    className="dashboard-skill"
                  >
                    {skill}
                  </span>
                )
              )}

              {!hasSkills && (
                <span className="empty-text">
                  No skills added
                </span>
              )}

            </div>

          </div>

          <div className="profile-progress-section">

            <div className="progress-heading">

              <span>
                Profile Completion
              </span>

              <strong>
                {profileCompletion}%
              </strong>

            </div>

            <div className="progress-track">

              <div
                className="progress-fill"
                style={{
                  width:
                    `${profileCompletion}%`,
                }}
              />

            </div>

          </div>

        </section>

        {/* ====================================================
            AI ANALYSIS + PROFILE COMPLETION
        ==================================================== */}

        <section className="dashboard-lower-grid">

          {/* AI ANALYSIS */}

          <div className="dashboard-card ai-analysis-card">

            <div className="card-heading">

              <div>

                <span className="section-label">
                  AI ANALYSIS
                </span>

                <h2>
                  📄 Resume Health
                </h2>

              </div>

              <span className="score-pill">
                {resumeScore}/100
              </span>

            </div>

            <div className="resume-health-box">

              <div
                className="resume-score-circle"
                style={{
                  "--score":
                    `${resumeScore * 3.6}deg`,
                }}
              >

                <div>

                  <strong>
                    {resumeScore}
                  </strong>

                  <span>
                    /100
                  </span>

                </div>

              </div>

              <div className="resume-health-content">

                <h3>
                  {resumeScore >=
                  80
                    ? "Excellent resume"
                    : resumeScore >=
                      60
                    ? "Resume looks good"
                    : "Resume needs improvement"}
                </h3>

                <p>
                  Your resume is evaluated against
                  ATS compatibility, skills and
                  job-market keywords.
                </p>

              </div>

            </div>

            <div className="analysis-progress">

              <div>

                <span>
                  ATS Compatibility
                </span>

                <strong>
                  {resumeScore}%
                </strong>

              </div>

              <div className="analysis-track">

                <div
                  style={{
                    width:
                      `${resumeScore}%`,
                  }}
                />

              </div>

            </div>

            <div className="analysis-progress">

              <div>

                <span>
                  Skills Relevance
                </span>

                <strong>
                  {hasSkills
                    ? "100%"
                    : "0%"}
                </strong>

              </div>

              <div className="analysis-track">

                <div
                  style={{
                    width:
                      hasSkills
                        ? "100%"
                        : "0%",
                  }}
                />

              </div>

            </div>

            <div className="analysis-progress">

              <div>

                <span>
                  Keyword Optimization
                </span>

                <strong>
                  {hasSkills &&
                  hasTargetRole
                    ? "100%"
                    : "0%"}
                </strong>

              </div>

              <div className="analysis-track">

                <div
                  style={{
                    width:
                      hasSkills &&
                      hasTargetRole
                        ? "100%"
                        : "0%",
                  }}
                />

              </div>

            </div>

            <div className="ai-tip-box">

              <div className="ai-tip-icon">
                ✨
              </div>

              <div>

                <strong>
                  AI Resume Analysis
                </strong>

                <p>
                  Open Resume Analyzer to receive
                  personalized AI recommendations.
                </p>

              </div>

            </div>

            <button
              type="button"
              className="primary-dashboard-btn"
              onClick={() =>
                navigate(
                  "/resume"
                )
              }
            >
              Improve Resume with AI →
            </button>

          </div>

          {/* PROFILE COMPLETION */}

          <div className="dashboard-card profile-completion-panel">

            <div className="card-heading">

              <div>

                <span className="section-label">
                  PROFILE
                </span>

                <h2>
                  👤 Profile Completion
                </h2>

              </div>

              <strong className="completion-number">
                {profileCompletion}%
              </strong>

            </div>

            <div className="profile-completion-progress">

              <div
                style={{
                  width:
                    `${profileCompletion}%`,
                }}
              />

            </div>

            <p className="completion-description">
              Complete your profile to improve
              recruiter visibility.
            </p>

            <div className="completion-checklist">

              {checklist.map(
                (item) => (
                  <div
                    className={`checklist-item ${
                      item.completed
                        ? "completed"
                        : "pending"
                    }`}
                    key={
                      item.label
                    }
                  >

                    <span className="check-circle">
                      {item.completed
                        ? "✓"
                        : "!"}
                    </span>

                    <span className="checklist-icon">
                      {item.icon}
                    </span>

                    <span>
                      {item.label}
                    </span>

                  </div>
                )
              )}

            </div>

            {profileCompletion ===
            100 ? (
              <div className="profile-completed-message">
                ✓ Profile Completed
              </div>
            ) : (
              <button
                type="button"
                className="complete-profile-btn"
                onClick={() =>
                  navigate(
                    "/profile"
                  )
                }
              >
                Complete Profile →
              </button>
            )}

          </div>

        </section>

        {/* ====================================================
            A4 RESUME PREVIEW
        ==================================================== */}

        <section className="dashboard-card dashboard-resume-card">

          <div className="card-heading resume-dashboard-heading">

            <div>

              <span className="section-label">
                RESUME
              </span>

              <h2>
                📄 Your Resume
              </h2>

              <p>
                Your latest TalentIQ resume displayed
                in a professional A4 format.
              </p>

            </div>

            <div className="resume-heading-actions">

              <button
                type="button"
                className="edit-profile-link"
                onClick={() =>
                  navigate(
                    "/resume"
                  )
                }
              >
                Edit Resume →
              </button>

            </div>

          </div>

          {!hasResume ? (
            <div className="resume-empty-state">

              <div className="resume-empty-icon">
                📄
              </div>

              <h3>
                No resume created yet
              </h3>

              <p>
                Create your resume to display it
                here in A4 format.
              </p>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/resume"
                  )
                }
              >
                Create Resume →
              </button>

            </div>
          ) : (
            <div className="resume-preview-wrapper">

              <div className="resume-preview-toolbar">

                <div>

                  <strong>
                    Live Resume Preview
                  </strong>

                  <span>
                    A4 • Professional Resume
                  </span>

                </div>

                <div className="resume-preview-status">
                  ✓ Saved Resume
                </div>

              </div>

              <article
                className="resume-a4-paper"
                id="resume-paper"
              >

                <header className="a4-header">

                  <h1>
                    {resumePersonalInfo.fullName ||
                      candidateName ||
                      "Your Name"}
                  </h1>

                  <h2>
                    {resume.headline ||
                      targetRole ||
                      "Professional Title"}
                  </h2>

                  <div className="a4-contact">

                    {resumePersonalInfo.email && (
                      <span>
                        {resumePersonalInfo.email}
                      </span>
                    )}

                    {resumePersonalInfo.phone && (
                      <span>
                        {resumePersonalInfo.phone}
                      </span>
                    )}

                    {resumePersonalInfo.location && (
                      <span>
                        {resumePersonalInfo.location}
                      </span>
                    )}

                  </div>

                  <div className="a4-links">

                    {resumePersonalInfo.linkedin && (
                      <span>
                        LinkedIn:{" "}
                        {resumePersonalInfo.linkedin}
                      </span>
                    )}

                    {resumePersonalInfo.github && (
                      <span>
                        GitHub:{" "}
                        {resumePersonalInfo.github}
                      </span>
                    )}

                    {resumePersonalInfo.portfolio && (
                      <span>
                        Portfolio:{" "}
                        {resumePersonalInfo.portfolio}
                      </span>
                    )}

                  </div>

                </header>

                {resume.summary && (
                  <section className="a4-section">

                    <h3>
                      PROFESSIONAL SUMMARY
                    </h3>

                    <div className="a4-divider"></div>

                    <p className="a4-summary">
                      {resume.summary}
                    </p>

                  </section>
                )}

                {resumeSkills.length > 0 && (
                  <section className="a4-section">

                    <h3>
                      SKILLS
                    </h3>

                    <div className="a4-divider"></div>

                    <div className="a4-skills">

                      {resumeSkills.map(
                        (
                          skill,
                          index
                        ) => (
                          <span
                            key={`${skill}-${index}`}
                          >
                            {skill}
                          </span>
                        )
                      )}

                    </div>

                  </section>
                )}

                {resumeExperience.length > 0 && (
                  <section className="a4-section">

                    <h3>
                      EXPERIENCE
                    </h3>

                    <div className="a4-divider"></div>

                    {resumeExperience.map(
                      (
                        item,
                        index
                      ) => (
                        <div
                          className="a4-item"
                          key={
                            item._id ||
                            index
                          }
                        >

                          <div className="a4-item-header">

                            <div>

                              <strong>
                                {item.position ||
                                  item.jobTitle ||
                                  "Position"}
                              </strong>

                              <span className="a4-company">
                                {item.Company ||
                                  item.company ||
                                  "Company"}

                                {item.location
                                  ? ` • ${item.location}`
                                  : ""}
                              </span>

                            </div>

                            <span className="a4-date">

                              {item.startDate ||
                                ""}

                              {(item.startDate ||
                                item.endDate ||
                                item.current) &&
                                " - "}

                              {item.current
                                ? "Present"
                                : item.endDate ||
                                  ""}

                            </span>

                          </div>

                          {item.description && (
                            <p>
                              {item.description}
                            </p>
                          )}

                        </div>
                      )
                    )}

                  </section>
                )}

                {resumeProjects.length > 0 && (
                  <section className="a4-section">

                    <h3>
                      PROJECTS
                    </h3>

                    <div className="a4-divider"></div>

                    {resumeProjects.map(
                      (
                        project,
                        index
                      ) => (
                        <div
                          className="a4-item"
                          key={
                            project._id ||
                            index
                          }
                        >

                          <div className="a4-project-title">

                            <strong>
                              {project.name ||
                                project.title ||
                                "Project"}
                            </strong>

                          </div>

                          {project.technologies && (
                            <span className="a4-project-tech">
                              {Array.isArray(
                                project.technologies
                              )
                                ? project.technologies.join(
                                    " • "
                                  )
                                : project.technologies}
                            </span>
                          )}

                          {project.description && (
                            <p>
                              {project.description}
                            </p>
                          )}

                          <div className="a4-project-links">

                            {project.liveUrl && (
                              <span>
                                Live:{" "}
                                {project.liveUrl}
                              </span>
                            )}

                            {project.githubUrl && (
                              <span>
                                GitHub:{" "}
                                {project.githubUrl}
                              </span>
                            )}

                          </div>

                        </div>
                      )
                    )}

                  </section>
                )}

                {resumeEducation.length > 0 && (
                  <section className="a4-section">

                    <h3>
                      EDUCATION
                    </h3>

                    <div className="a4-divider"></div>

                    {resumeEducation.map(
                      (
                        item,
                        index
                      ) => (
                        <div
                          className="a4-item"
                          key={
                            item._id ||
                            index
                          }
                        >

                          <div className="a4-item-header">

                            <div>

                              <strong>
                                {item.degree ||
                                  "Degree"}
                              </strong>

                              <span className="a4-company">
                                {item.institution ||
                                  item.college ||
                                  ""}
                              </span>

                            </div>

                            <span className="a4-date">
                              {item.endDate ||
                                item.graduationYear ||
                                ""}
                            </span>

                          </div>

                          <div className="a4-education-meta">

                            {item.field && (
                              <span>
                                {item.field}
                              </span>
                            )}

                            {item.grade && (
                              <span>
                                Grade:{" "}
                                {item.grade}
                              </span>
                            )}

                          </div>

                        </div>
                      )
                    )}

                  </section>
                )}

                {resumeCertifications.length > 0 && (
                  <section className="a4-section">

                    <h3>
                      CERTIFICATIONS
                    </h3>

                    <div className="a4-divider"></div>

                    {resumeCertifications.map(
                      (
                        item,
                        index
                      ) => (
                        <div
                          className="a4-simple-item"
                          key={
                            item._id ||
                            index
                          }
                        >

                          <strong>
                            {item.name ||
                              item.title ||
                              item.certification ||
                              "Certification"}
                          </strong>

                          {(item.issuer ||
                            item.organization) && (
                            <span>
                              {" "}
                              —{" "}
                              {item.issuer ||
                                item.organization}
                            </span>
                          )}

                        </div>
                      )
                    )}

                  </section>
                )}

                {resumeAchievements.length > 0 && (
                  <section className="a4-section">

                    <h3>
                      ACHIEVEMENTS
                    </h3>

                    <div className="a4-divider"></div>

                    {resumeAchievements.map(
                      (
                        item,
                        index
                      ) => (
                        <div
                          className="a4-simple-item"
                          key={
                            item._id ||
                            index
                          }
                        >
                          {typeof item ===
                          "string"
                            ? item
                            : item.title ||
                              item.name ||
                              item.description ||
                              ""}
                        </div>
                      )
                    )}

                  </section>
                )}

                {resumeLanguages.length > 0 && (
                  <section className="a4-section">

                    <h3>
                      LANGUAGES
                    </h3>

                    <div className="a4-divider"></div>

                    <p className="a4-language-list">
                      {resumeLanguages
                        .map(
                          (
                            language
                          ) =>
                            typeof language ===
                            "string"
                              ? language
                              : language.name ||
                                language.language ||
                                ""
                        )
                        .filter(Boolean)
                        .join(
                          " • "
                        )}
                    </p>

                  </section>
                )}

              </article>

            </div>
          )}

        </section>

        {/* ====================================================
            EDUCATION SUMMARY
        ==================================================== */}

        {hasEducation && (
          <section className="dashboard-card education-summary-card">

            <div className="card-heading">

              <div>

                <span className="section-label">
                  EDUCATION
                </span>

                <h2>
                  🎓 Academic Background
                </h2>

              </div>

              <button
                type="button"
                className="edit-profile-link"
                onClick={() =>
                  navigate(
                    "/profile"
                  )
                }
              >
                Edit →
              </button>

            </div>

            <div className="education-summary">

              <div className="education-icon">
                🎓
              </div>

              <div>

                <h3>
                  {hasProfileEducation
                    ? profile.education?.degree
                    : resumeEducation?.[0]
                        ?.degree ||
                      "Education"}
                </h3>

                <p>
                  {hasProfileEducation
                    ? profile.education?.college
                    : resumeEducation?.[0]
                        ?.institution ||
                      ""}
                </p>

                <span>
                  {hasProfileEducation
                    ? [
                        profile.education
                          ?.graduationYear,
                        profile.education
                          ?.percentage,
                      ]
                        .filter(
                          Boolean
                        )
                        .join(
                          " • "
                        )
                    : [
                        resumeEducation?.[0]
                          ?.field,
                        resumeEducation?.[0]
                          ?.endDate,
                        resumeEducation?.[0]
                          ?.grade,
                      ]
                        .filter(
                          Boolean
                        )
                        .join(
                          " • "
                        )}
                </span>

              </div>

            </div>

          </section>
        )}

        {/* ====================================================
            APPLICATIONS
        ==================================================== */}

        <section className="dashboard-card applications-card">

          <div className="card-heading">

            <div>

              <span className="section-label">
                APPLICATIONS
              </span>

              <h2>
                📋 Recent Applications
              </h2>

              <p>
                Track your latest job applications.
              </p>

            </div>

            <button
              type="button"
              className="edit-profile-link"
              onClick={() =>
                navigate(
                  "/applications"
                )
              }
            >
              View All →
            </button>

          </div>

          <div className="applications-list">

            {dashboard?.recentApplications
              ?.length > 0 ? (
              dashboard.recentApplications.map(
                (
                  application,
                  index
                ) => {
                  const job =
                    application.job ||
                    {};

                  return (
                    <div
                      className="application-row"
                      key={
                        application._id ||
                        index
                      }
                    >

                      <div className="application-icon">
                        💼
                      </div>

                      <div className="application-info">

                        <strong>
                          {job.title ||
                            "Job Application"}
                        </strong>

                        <span>
                          {job.company ||
                            job.companyName ||
                            "Company"}
                        </span>

                      </div>

                      <span
                        className={`application-status ${String(
                          application.status ||
                            "Applied"
                        )
                          .toLowerCase()
                          .replace(
                            /\s+/g,
                            "-"
                          )}`}
                      >
                        {application.status ||
                          "Applied"}
                      </span>

                    </div>
                  );
                }
              )
            ) : (
              <div className="empty-applications">

                <div className="empty-application-icon">
                  📄
                </div>

                <h3>
                  No applications yet
                </h3>

                <p>
                  Explore jobs and apply to your
                  first opportunity.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/find-jobs"
                    )
                  }
                >
                  Find Jobs →
                </button>

              </div>
            )}

          </div>

        </section>

      </main>

      {/* ======================================================
          ASK AI
      ====================================================== */}

      <button
        type="button"
        className="ask-ai-floating-btn"
        onClick={() =>
          navigate(
            "/ai-assistant"
          )
        }
      >
        ✨ Ask TalentIQ AI
      </button>

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <footer className="profile-footer">

        <div className="dashboard-container footer-main">

          <div className="footer-brand">

            <div className="footer-brand-row">

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
              better opportunities and build
              stronger careers.
            </p>

            <div className="footer-socials">

              <a
                href={
                  resumePersonalInfo.linkedin ||
                  "#"
                }
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
              >
                in
              </a>

              <a
                href={
                  resumePersonalInfo.github ||
                  "#"
                }
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
              >
                GH
              </a>

              <a
                href="#instagram"
                aria-label="Instagram"
              >
                ◎
              </a>

              <a
                href="#twitter"
                aria-label="X"
              >
                𝕏
              </a>

            </div>

          </div>

          <div className="footer-column">

            <h4>
              For Candidates
            </h4>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/dashboard"
                )
              }
            >
              Dashboard
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
                  "/applications"
                )
              }
            >
              Applications
            </button>

          </div>

          <div className="footer-column">

            <h4>
              Career Tools
            </h4>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/resume"
                )
              }
            >
              Resume Analyzer
            </button>

            <button type="button">
              AI Career Insights
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/skill-gap-analysis"
                )
              }
            >
              Skill Gap Analysis
            </button>

            <button type="button">
              Career Copilot
            </button>

          </div>

          <div className="footer-column">

            <h4>
              TalentIQ
            </h4>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/profile"
                )
              }
            >
              My Profile
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/resume"
                )
              }
            >
              My Resume
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/ai-assistant"
                )
              }
            >
              AI Assistant
            </button>

            <button
              type="button"
              onClick={
                logout
              }
            >
              Logout
            </button>

          </div>

        </div>

        <div className="footer-bottom">

          <div className="dashboard-container footer-bottom-inner">

            <span>
              © 2026 TalentIQ. All rights reserved.
            </span>

            <span>
              AI-powered career intelligence
            </span>

          </div>

        </div>

      </footer>

    </div>
  );
}