import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FaGithub,
  FaInstagram,
  FaLinkedinIn,
  FaTwitter,
  FaMapMarkerAlt,
  FaBriefcase,
  FaGraduationCap,
  FaEnvelope,
  FaPhone,
  FaEdit,
  FaSave,
  FaTimes,
  FaTrash,
  FaUpload,
  FaCheckCircle,
  FaGlobe,
  FaLink,
  FaUser,
  FaBrain,
  FaBullseye,
  FaFileAlt,
  FaSearch,
  FaPlus,
  FaArrowLeft,
  FaSignOutAlt,
  FaMagic,
} from "react-icons/fa";

import "../styles/profile.css";

const PROFILE_API = "http://localhost:5000/api/profile";
const RESUME_API = "http://localhost:5000/api/profile/resume";

const emptyProfile = {
  fullName: "",
  email: "",
  phone: "",
  location: "",
  headline: "",
  bio: "",
  dateOfBirth: "",
  gender: "",
  portfolio: "",
  linkedin: "",
  github: "",

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

const trendingSkills = [
  "JavaScript",
  "React",
  "Node.js",
  "Express.js",
  "MongoDB",
  "HTML",
  "CSS",
  "TypeScript",
  "Python",
  "Java",
  "C++",
  "C",
  "SQL",
  "Git",
  "GitHub",
  "REST API",
  "Next.js",
  "Angular",
  "Vue.js",
  "Tailwind CSS",
  "Bootstrap",
  "Figma",
  "AWS",
  "Docker",
  "Machine Learning",
  "Artificial Intelligence",
  "Data Structures",
  "Algorithms",
  "Firebase",
  "MySQL",
  "PostgreSQL",
  "Redux",
  "React Native",
  "Material UI",
  "GraphQL",
  "Jest",
  "Selenium",
  "Spring Boot",
  "Django",
  "Flask",
];

const Profile = () => {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(emptyProfile);
  const [originalProfile, setOriginalProfile] =
    useState(emptyProfile);

  const [newSkill, setNewSkill] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingResume, setUploadingResume] =
    useState(false);

  const [editMode, setEditMode] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ============================================================
  // GET TOKEN
  // ============================================================

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("accessToken")
    );
  };

  // ============================================================
  // AUTH HEADERS
  // ============================================================

  const getHeaders = () => {
    const token = getToken();

    return {
      "Content-Type": "application/json",
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    };
  };

  // ============================================================
  // LOGOUT / CLEAR AUTH
  // ============================================================

  const clearAuth = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");

    navigate("/login");
  };

  // ============================================================
  // NORMALIZE PROFILE
  // ============================================================

  const normalizeProfile = (user = {}) => {
    return {
      ...emptyProfile,
      ...user,

      dateOfBirth: user.dateOfBirth
        ? String(user.dateOfBirth).substring(0, 10)
        : "",

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

      resume: user.resume || "",
      resumeFileId: user.resumeFileId || null,
      resumeOriginalName:
        user.resumeOriginalName || "",
      resumeMimeType:
        user.resumeMimeType || "",
      resumeUploadedAt:
        user.resumeUploadedAt || null,
    };
  };

  // ============================================================
  // FETCH PROFILE
  // ============================================================

  const fetchProfile = async () => {
    setLoading(true);
    setError("");

    try {
      const token = getToken();

      if (!token) {
        clearAuth();
        return;
      }

      const response = await fetch(PROFILE_API, {
        method: "GET",
        headers: getHeaders(),
      });

      if (response.status === 401) {
        clearAuth();
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load profile"
        );
      }

      const user =
        data.user ||
        data.profile ||
        data;

      const normalizedProfile =
        normalizeProfile(user);

      setProfile(normalizedProfile);
      setOriginalProfile(normalizedProfile);
    } catch (err) {
      console.error(
        "Profile loading error:",
        err
      );

      setError(
        err.message ||
          "Unable to connect to TalentIQ server. Please make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // LOAD PROFILE
  // ============================================================

  useEffect(() => {
    fetchProfile();
  }, []);

  // ============================================================
  // HANDLE BASIC INPUT
  // ============================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ============================================================
  // HANDLE NESTED INPUT
  // ============================================================

  const handleNestedChange = (
    section,
    field,
    value
  ) => {
    setProfile((previous) => ({
      ...previous,

      [section]: {
        ...previous[section],
        [field]: value,
      },
    }));
  };

  // ============================================================
  // ADD SKILL
  // ============================================================

  const addSkill = (skillValue) => {
    const skill = String(skillValue || "").trim();

    if (!skill) {
      return;
    }

    const alreadyExists =
      profile.skills.some(
        (existingSkill) =>
          String(existingSkill).toLowerCase() ===
          skill.toLowerCase()
      );

    if (alreadyExists) {
      setNewSkill("");
      return;
    }

    setProfile((previous) => ({
      ...previous,

      skills: [
        ...previous.skills,
        skill,
      ],
    }));

    setNewSkill("");
  };

  // ============================================================
  // ADD CUSTOM SKILL
  // ============================================================

  const handleAddTypedSkill = () => {
    addSkill(newSkill);
  };

  // ============================================================
  // REMOVE SKILL
  // ============================================================

  const removeSkill = (skillToRemove) => {
    setProfile((previous) => ({
      ...previous,

      skills: previous.skills.filter(
        (skill) =>
          skill !== skillToRemove
      ),
    }));
  };

  // ============================================================
  // FILTER SKILL SUGGESTIONS
  // ============================================================

  const filteredSkills = useMemo(() => {
    const search =
      newSkill.trim().toLowerCase();

    if (!search) {
      return [];
    }

    return trendingSkills
      .filter((skill) =>
        skill
          .toLowerCase()
          .includes(search)
      )
      .filter(
        (skill) =>
          !profile.skills.some(
            (existingSkill) =>
              String(existingSkill).toLowerCase() ===
              skill.toLowerCase()
          )
      )
      .slice(0, 8);
  }, [newSkill, profile.skills]);

  // ============================================================
  // SAVE PROFILE
  // ============================================================

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const token = getToken();

      if (!token) {
        clearAuth();
        return;
      }

      const response = await fetch(
        PROFILE_API,
        {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify(profile),
        }
      );

      if (response.status === 401) {
        clearAuth();
        return;
      }

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to update profile"
        );
      }

      const updatedUser =
        data.user ||
        data.profile ||
        data;

      const normalizedProfile =
        normalizeProfile(
          updatedUser
        );

      setProfile(
        normalizedProfile
      );

      setOriginalProfile(
        normalizedProfile
      );

      setEditMode(false);

      setMessage(
        "Profile updated successfully."
      );

      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (err) {
      console.error(
        "Profile update error:",
        err
      );

      setError(
        err.message ||
          "Unable to save your profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // CANCEL EDIT
  // ============================================================

  const handleCancelEdit = () => {
    setProfile(originalProfile);
    setNewSkill("");
    setEditMode(false);
    setError("");
  };

  // ============================================================
  // RESUME UPLOAD
  // ============================================================

  const handleResumeChange = async (e) => {
    const file =
      e.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {
      setError(
        "Please upload a PDF, DOC, or DOCX resume."
      );

      e.target.value = "";
      return;
    }

    const maxSize =
      5 * 1024 * 1024;

    if (file.size > maxSize) {
      setError(
        "Resume file size must be less than 5MB."
      );

      e.target.value = "";
      return;
    }

    setUploadingResume(true);
    setError("");
    setMessage("");

    try {
      const token = getToken();

      if (!token) {
        clearAuth();
        return;
      }

      const formData =
        new FormData();

      formData.append(
        "resume",
        file
      );

      const response =
        await fetch(
          RESUME_API,
          {
            method: "POST",

            headers: {
              Authorization: `Bearer ${token}`,
            },

            body: formData,
          }
        );

      if (response.status === 401) {
        clearAuth();
        return;
      }

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to upload resume"
        );
      }

      const updatedUser =
        data.user ||
        data.profile ||
        data;

      const normalizedProfile =
        normalizeProfile(
          updatedUser
        );

      setProfile(
        normalizedProfile
      );

      setOriginalProfile(
        normalizedProfile
      );

      setMessage(
        "Resume uploaded successfully."
      );

      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (err) {
      console.error(
        "Resume upload error:",
        err
      );

      setError(
        err.message ||
          "Unable to upload resume."
      );
    } finally {
      setUploadingResume(false);
      e.target.value = "";
    }
  };

  // ============================================================
  // PROFILE COMPLETION
  // ============================================================

  const completion = useMemo(() => {
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

    const completed =
      fields.filter(Boolean).length;

    return Math.round(
      (completed /
        fields.length) *
        100
    );
  }, [profile]);

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {
    clearAuth();
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="profile-loader">
          <div className="loader-orbit"></div>

          <span>
            Loading your TalentIQ profile...
          </span>
        </div>
      </div>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="profile-page">

      {/* ======================================================
          HERO
      ====================================================== */}

      <section className="profile-hero">

        <div className="profile-hero-background">
          <span className="hero-orb orb-one"></span>
          <span className="hero-orb orb-two"></span>
          <span className="hero-grid"></span>
        </div>

        <div className="profile-container profile-hero-content">

          <div className="hero-profile-left">

            <div className="large-profile-avatar">
              {profile.fullName
                ? profile.fullName
                    .charAt(0)
                    .toUpperCase()
                : "S"}
            </div>

            <div className="hero-profile-info">

              <span className="hero-badge">
                <FaMagic />
                TALENTIQ PROFILE
              </span>

              <h1>
                {profile.fullName ||
                  "Complete Your Profile"}
              </h1>

              <p>
                {profile.headline ||
                  "Build a stronger professional profile and get discovered by the right opportunities."}
              </p>

              <div className="hero-meta">

                <span>
                  <FaMapMarkerAlt />
                  {profile.location ||
                    "Location not added"}
                </span>

                <span className="hero-meta-dot">
                  •
                </span>

                <span>
                  <FaBriefcase />
                  {profile
                    .careerPreferences
                    ?.targetRole ||
                    "Target role not set"}
                </span>

              </div>

            </div>
          </div>

          <div className="hero-profile-right">

            <div className="profile-completion-card">

              <div className="completion-top">

                <span>
                  Profile Completion
                </span>

                <strong>
                  {completion}%
                </strong>

              </div>

              <div className="completion-progress">

                <div
                  style={{
                    width: `${completion}%`,
                  }}
                ></div>

              </div>

              <small>
                Complete your profile to
                improve recruiter visibility.
              </small>

            </div>

            {!editMode ? (

              <button
                className="hero-edit-btn"
                onClick={() => {
                  setEditMode(true);
                  setError("");
                }}
              >
                <FaEdit />
                Edit Profile
              </button>

            ) : (

              <div className="hero-edit-actions">

                <button
                  className="cancel-btn"
                  onClick={
                    handleCancelEdit
                  }
                  disabled={saving}
                >
                  <FaTimes />
                  Cancel
                </button>

                <button
                  className="save-profile-btn"
                  onClick={handleSave}
                  disabled={saving}
                >
                  <FaSave />

                  {saving
                    ? "Saving..."
                    : "Save Profile"}
                </button>

              </div>

            )}

          </div>

        </div>
      </section>

      {/* ======================================================
          MAIN
      ====================================================== */}

      <main className="profile-container profile-main">

        {/* SUCCESS */}

        {message && (
          <div className="profile-alert success">

            <FaCheckCircle />

            <span>
              {message}
            </span>

          </div>
        )}

        {/* ERROR */}

        {error && (
          <div className="profile-alert error">

            <div className="alert-error-icon">
              !
            </div>

            <div>

              <strong>
                Something went wrong
              </strong>

              <p>
                {error}
              </p>

              <button
                onClick={fetchProfile}
              >
                Try Again
              </button>

            </div>

          </div>
        )}

        {/* ======================================================
            PERSONAL INFORMATION
        ====================================================== */}

        <section className="profile-card">

          <div className="profile-section-heading">

            <div className="heading-icon purple">
              <FaUser />
            </div>

            <div>

              <span>
                PERSONAL INFORMATION
              </span>

              <h2>
                About You
              </h2>

              <p>
                Keep your personal
                information up to date.
              </p>

            </div>

          </div>

          <div className="profile-form-grid">

            <div className="profile-field">

              <label>
                Full Name
              </label>

              <div className="field-input-wrapper">
                <FaUser />

                <input
                  type="text"
                  name="fullName"
                  value={
                    profile.fullName
                  }
                  onChange={
                    handleChange
                  }
                  disabled={!editMode}
                  placeholder="Enter your full name"
                />
              </div>

            </div>

            <div className="profile-field">

              <label>
                Email Address
              </label>

              <div className="field-input-wrapper">
                <FaEnvelope />

                <input
                  type="email"
                  name="email"
                  value={
                    profile.email
                  }
                  onChange={
                    handleChange
                  }
                  disabled={!editMode}
                  placeholder="Enter your email"
                />
              </div>

            </div>

            <div className="profile-field">

              <label>
                Phone Number
              </label>

              <div className="field-input-wrapper">
                <FaPhone />

                <input
                  type="tel"
                  name="phone"
                  value={
                    profile.phone
                  }
                  onChange={
                    handleChange
                  }
                  disabled={!editMode}
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>

            </div>

            <div className="profile-field">

              <label>
                Location
              </label>

              <div className="field-input-wrapper">
                <FaMapMarkerAlt />

                <input
                  type="text"
                  name="location"
                  value={
                    profile.location
                  }
                  onChange={
                    handleChange
                  }
                  disabled={!editMode}
                  placeholder="City, State"
                />
              </div>

            </div>

            <div className="profile-field">

              <label>
                Date of Birth
              </label>

              <input
                type="date"
                name="dateOfBirth"
                value={
                  profile.dateOfBirth
                }
                onChange={
                  handleChange
                }
                disabled={!editMode}
              />

            </div>

            <div className="profile-field">

              <label>
                Gender
              </label>

              <select
                name="gender"
                value={
                  profile.gender
                }
                onChange={
                  handleChange
                }
                disabled={!editMode}
              >
                <option value="">
                  Select Gender
                </option>

                <option value="Male">
                  Male
                </option>

                <option value="Female">
                  Female
                </option>

                <option value="Other">
                  Other
                </option>

                <option value="Prefer not to say">
                  Prefer not to say
                </option>
              </select>

            </div>

            <div className="profile-field full-field">

              <label>
                Professional Headline
              </label>

              <input
                type="text"
                name="headline"
                value={
                  profile.headline
                }
                onChange={
                  handleChange
                }
                disabled={!editMode}
                placeholder="e.g. Full Stack Developer | MERN | AI"
              />

            </div>

            <div className="profile-field full-field">

              <label>
                Professional Bio
              </label>

              <textarea
                name="bio"
                value={
                  profile.bio
                }
                onChange={
                  handleChange
                }
                disabled={!editMode}
                placeholder="Tell recruiters about yourself..."
                rows="5"
              ></textarea>

            </div>

          </div>

        </section>

        {/* ======================================================
            PROFESSIONAL LINKS
        ====================================================== */}

        <section className="profile-card">

          <div className="profile-section-heading">

            <div className="heading-icon blue">
              <FaLink />
            </div>

            <div>

              <span>
                ONLINE PRESENCE
              </span>

              <h2>
                Professional Links
              </h2>

              <p>
                Help recruiters explore
                your work.
              </p>

            </div>

          </div>

          <div className="profile-form-grid">

            <div className="profile-field">

              <label>
                Portfolio Website
              </label>

              <div className="input-with-icon">
                <FaGlobe />

                <input
                  type="url"
                  name="portfolio"
                  value={
                    profile.portfolio
                  }
                  onChange={
                    handleChange
                  }
                  disabled={!editMode}
                  placeholder="https://yourportfolio.com"
                />

              </div>

            </div>

            <div className="profile-field">

              <label>
                LinkedIn
              </label>

              <div className="input-with-icon">
                <FaLinkedinIn />

                <input
                  type="url"
                  name="linkedin"
                  value={
                    profile.linkedin
                  }
                  onChange={
                    handleChange
                  }
                  disabled={!editMode}
                  placeholder="https://linkedin.com/in/username"
                />

              </div>

            </div>

            <div className="profile-field">

              <label>
                GitHub
              </label>

              <div className="input-with-icon">
                <FaGithub />

                <input
                  type="url"
                  name="github"
                  value={
                    profile.github
                  }
                  onChange={
                    handleChange
                  }
                  disabled={!editMode}
                  placeholder="https://github.com/username"
                />

              </div>

            </div>

          </div>

        </section>

        {/* ======================================================
            EDUCATION
        ====================================================== */}

        <section className="profile-card">

          <div className="profile-section-heading">

            <div className="heading-icon green">
              <FaGraduationCap />
            </div>

            <div>

              <span>
                EDUCATION
              </span>

              <h2>
                Academic Background
              </h2>

              <p>
                Add your educational
                qualifications.
              </p>

            </div>

          </div>

          <div className="profile-form-grid">

            <div className="profile-field">

              <label>
                Degree
              </label>

              <input
                type="text"
                value={
                  profile.education.degree
                }
                onChange={(e) =>
                  handleNestedChange(
                    "education",
                    "degree",
                    e.target.value
                  )
                }
                disabled={!editMode}
                placeholder="e.g. Bachelor of Computer Applications"
              />

            </div>

            <div className="profile-field">

              <label>
                College / University
              </label>

              <input
                type="text"
                value={
                  profile.education.college
                }
                onChange={(e) =>
                  handleNestedChange(
                    "education",
                    "college",
                    e.target.value
                  )
                }
                disabled={!editMode}
                placeholder="College or University"
              />

            </div>

            <div className="profile-field">

              <label>
                Graduation Year
              </label>

              <input
                type="text"
                value={
                  profile.education
                    .graduationYear
                }
                onChange={(e) =>
                  handleNestedChange(
                    "education",
                    "graduationYear",
                    e.target.value
                  )
                }
                disabled={!editMode}
                placeholder="2025"
              />

            </div>

            <div className="profile-field">

              <label>
                Percentage / CGPA
              </label>

              <input
                type="text"
                value={
                  profile.education
                    .percentage
                }
                onChange={(e) =>
                  handleNestedChange(
                    "education",
                    "percentage",
                    e.target.value
                  )
                }
                disabled={!editMode}
                placeholder="e.g. 66.5%"
              />

            </div>

          </div>

        </section>

        {/* ======================================================
            EXPERIENCE
        ====================================================== */}

        <section className="profile-card">

          <div className="profile-section-heading">

            <div className="heading-icon orange">
              <FaBriefcase />
            </div>

            <div>

              <span>
                EXPERIENCE
              </span>

              <h2>
                Professional Experience
              </h2>

              <p>
                Tell recruiters about
                your work experience.
              </p>

            </div>

          </div>

          <div className="profile-form-grid">

            <div className="profile-field">

              <label>
                Job Title
              </label>

              <input
                type="text"
                value={
                  profile.experience
                    .jobTitle
                }
                onChange={(e) =>
                  handleNestedChange(
                    "experience",
                    "jobTitle",
                    e.target.value
                  )
                }
                disabled={!editMode}
                placeholder="e.g. Full Stack Developer"
              />

            </div>

            <div className="profile-field">

              <label>
                Company
              </label>

              <input
                type="text"
                value={
                  profile.experience
                    .company
                }
                onChange={(e) =>
                  handleNestedChange(
                    "experience",
                    "company",
                    e.target.value
                  )
                }
                disabled={!editMode}
                placeholder="Company name"
              />

            </div>

            <div className="profile-field">

              <label>
                Experience Level
              </label>

              <select
                value={
                  profile.experience
                    .experienceLevel
                }
                onChange={(e) =>
                  handleNestedChange(
                    "experience",
                    "experienceLevel",
                    e.target.value
                  )
                }
                disabled={!editMode}
              >

                <option value="">
                  Select experience level
                </option>

                <option value="Fresher">
                  Fresher
                </option>

                <option value="0-1 Years">
                  0-1 Years
                </option>

                <option value="1-2 Years">
                  1-2 Years
                </option>

                <option value="2-3 Years">
                  2-3 Years
                </option>

                <option value="3-5 Years">
                  3-5 Years
                </option>

                <option value="5+ Years">
                  5+ Years
                </option>

              </select>

            </div>

            <div className="profile-field">

              <label>
                Total Experience
              </label>

              <input
                type="text"
                value={
                  profile.experience
                    .years
                }
                onChange={(e) =>
                  handleNestedChange(
                    "experience",
                    "years",
                    e.target.value
                  )
                }
                disabled={!editMode}
                placeholder="e.g. 1 year"
              />

            </div>

          </div>

        </section>

        {/* ======================================================
            SKILLS
        ====================================================== */}

        <section className="profile-card">

          <div className="profile-section-heading">

            <div className="heading-icon purple">
              <FaBrain />
            </div>

            <div>

              <span>
                TECHNICAL SKILLS
              </span>

              <h2>
                Your Skills
              </h2>

              <p>
                Add the skills you want
                TalentIQ AI to use for
                job matching.
              </p>

            </div>

          </div>

          <div className="skills-area">

            {editMode && (

              <div className="skill-input-wrapper">

                <div className="skill-input-row">

                  <div className="skill-input-container">

                    <FaSearch className="skill-input-icon" />

                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) =>
                        setNewSkill(
                          e.target.value
                        )
                      }
                      onKeyDown={(e) => {

                        if (
                          e.key ===
                          "Enter"
                        ) {
                          e.preventDefault();
                          handleAddTypedSkill();
                        }

                      }}
                      placeholder="Search or add a skill..."
                      autoComplete="off"
                    />

                    {newSkill.trim() && (

                      <button
                        type="button"
                        className="clear-skill-input"
                        onClick={() =>
                          setNewSkill("")
                        }
                      >
                        <FaTimes />
                      </button>

                    )}

                  </div>

                  <button
                    type="button"
                    className="add-skill-main-btn"
                    onClick={
                      handleAddTypedSkill
                    }
                  >
                    <FaPlus />
                    Add Skill
                  </button>

                </div>

                {newSkill.trim() && (

                  <div className="skill-suggestions">

                    <div className="suggestions-header">

                      <span className="suggestions-title">
                        <FaMagic />
                        Suggested Skills
                      </span>

                      <span className="suggestions-hint">
                        Click a skill to add
                      </span>

                    </div>

                    <div className="suggestion-list">

                      {filteredSkills.length >
                      0 ? (

                        filteredSkills.map(
                          (skill) => (

                            <button
                              type="button"
                              key={skill}
                              className="skill-suggestion"
                              onClick={() =>
                                addSkill(
                                  skill
                                )
                              }
                            >

                              <span className="suggestion-plus">
                                <FaPlus />
                              </span>

                              <span>
                                {skill}
                              </span>

                            </button>

                          )
                        )

                      ) : (

                        <div className="no-suggestion">

                          <FaSearch />

                          <span>
                            No matching
                            trending skill found.
                          </span>

                        </div>

                      )}

                      {!profile.skills.some(
                        (skill) =>
                          String(skill).toLowerCase() ===
                          newSkill
                            .trim()
                            .toLowerCase()
                      ) && (

                        <button
                          type="button"
                          className="skill-suggestion custom-suggestion"
                          onClick={
                            handleAddTypedSkill
                          }
                        >

                          <span className="suggestion-plus">
                            <FaPlus />
                          </span>

                          <span>
                            Add "{newSkill.trim()}"
                          </span>

                        </button>

                      )}

                    </div>

                  </div>

                )}

              </div>

            )}

            <div className="selected-skills-container">

              <div className="selected-skills-header">

                <div>

                  <span className="selected-skills-title">
                    Your Skills
                  </span>

                  <span className="skills-count">
                    {profile.skills.length}{" "}
                    {profile.skills.length ===
                    1
                      ? "skill"
                      : "skills"}
                  </span>

                </div>

                {profile.skills.length >
                  0 && (

                  <span className="skills-status">
                    <FaCheckCircle />
                    Added to your profile
                  </span>

                )}

              </div>

              <div className="skills-list">

                {profile.skills.length >
                0 ? (

                  profile.skills.map(
                    (skill, index) => (

                      <div
                        className="profile-skill"
                        key={`${skill}-${index}`}
                      >

                        <span className="skill-check">
                          <FaCheckCircle />
                        </span>

                        <span className="skill-name">
                          {skill}
                        </span>

                        {editMode && (

                          <button
                            type="button"
                            className="remove-skill-btn"
                            onClick={() =>
                              removeSkill(
                                skill
                              )
                            }
                            aria-label={`Remove ${skill}`}
                            title={`Remove ${skill}`}
                          >
                            <FaTimes />
                          </button>

                        )}

                      </div>

                    )
                  )

                ) : (

                  <div className="no-skills">

                    <div className="no-skills-icon">
                      <FaBrain />
                    </div>

                    <div>

                      <strong>
                        No skills added yet
                      </strong>

                      <p>
                        Add your technical
                        skills to improve
                        AI job matching.
                      </p>

                    </div>

                  </div>

                )}

              </div>

              {editMode && (

                <div className="skill-ai-tip">

                  <div className="skill-ai-tip-icon">
                    <FaMagic />
                  </div>

                  <div>

                    <strong>
                      TalentIQ AI Skill Matching
                    </strong>

                    <p>
                      Add relevant technical
                      and professional skills
                      to improve your job
                      recommendations and
                      resume matching score.
                    </p>

                  </div>

                </div>

              )}

            </div>

          </div>

        </section>

        {/* ======================================================
            CAREER PREFERENCES
        ====================================================== */}

        <section className="profile-card">

          <div className="profile-section-heading">

            <div className="heading-icon pink">
              <FaBullseye />
            </div>

            <div>

              <span>
                CAREER PREFERENCES
              </span>

              <h2>
                What Are You Looking For?
              </h2>

              <p>
                These preferences help
                TalentIQ recommend relevant
                jobs.
              </p>

            </div>

          </div>

          <div className="profile-form-grid">

            <div className="profile-field">

              <label>
                Target Role
              </label>

              <input
                type="text"
                value={
                  profile
                    .careerPreferences
                    .targetRole
                }
                onChange={(e) =>
                  handleNestedChange(
                    "careerPreferences",
                    "targetRole",
                    e.target.value
                  )
                }
                disabled={!editMode}
                placeholder="e.g. Full Stack Developer"
              />

            </div>

            <div className="profile-field">

              <label>
                Preferred Location
              </label>

              <input
                type="text"
                value={
                  profile
                    .careerPreferences
                    .preferredLocation
                }
                onChange={(e) =>
                  handleNestedChange(
                    "careerPreferences",
                    "preferredLocation",
                    e.target.value
                  )
                }
                disabled={!editMode}
                placeholder="e.g. Bangalore, Chennai"
              />

            </div>

            <div className="profile-field">

              <label>
                Employment Type
              </label>

              <select
                value={
                  profile
                    .careerPreferences
                    .employmentType
                }
                onChange={(e) =>
                  handleNestedChange(
                    "careerPreferences",
                    "employmentType",
                    e.target.value
                  )
                }
                disabled={!editMode}
              >

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

                <option value="Freelance">
                  Freelance
                </option>

              </select>

            </div>

            <div className="profile-field">

              <label>
                Expected Salary
              </label>

              <input
                type="text"
                value={
                  profile
                    .careerPreferences
                    .expectedSalary
                }
                onChange={(e) =>
                  handleNestedChange(
                    "careerPreferences",
                    "expectedSalary",
                    e.target.value
                  )
                }
                disabled={!editMode}
                placeholder="e.g. ₹6L - ₹10L"
              />

            </div>

            <div className="profile-field">

              <label>
                Work Preference
              </label>

              <select
                value={
                  profile
                    .careerPreferences
                    .remotePreference
                }
                onChange={(e) =>
                  handleNestedChange(
                    "careerPreferences",
                    "remotePreference",
                    e.target.value
                  )
                }
                disabled={!editMode}
              >

                <option value="">
                  Select preference
                </option>

                <option value="On-site">
                  On-site
                </option>

                <option value="Remote">
                  Remote
                </option>

                <option value="Hybrid">
                  Hybrid
                </option>

                <option value="Flexible">
                  Flexible
                </option>

              </select>

            </div>

          </div>

        </section>

        {/* ======================================================
            RESUME
        ====================================================== */}

        <section className="profile-card resume-profile-card">

          <div className="profile-section-heading">

            <div className="heading-icon red">
              <FaFileAlt />
            </div>

            <div>

              <span>
                RESUME
              </span>

              <h2>
                Your Resume
              </h2>

              <p>
                Keep your latest resume
                available for recruiters
                and AI analysis.
              </p>

            </div>

          </div>

          <div className="resume-box">

            <div className="resume-icon">
              <FaFileAlt />
            </div>

            <div className="resume-content">

              <strong>
                {profile.resume ||
                profile.resumeOriginalName
                  ? "Resume uploaded"
                  : "No resume uploaded"}
              </strong>

              <span>
                {profile.resumeOriginalName ||
                  profile.resume ||
                  "Upload your resume to improve your AI profile analysis."}
              </span>

              {profile.resumeUploadedAt && (

                <small>
                  Uploaded{" "}
                  {new Date(
                    profile.resumeUploadedAt
                  ).toLocaleDateString()}
                </small>

              )}

            </div>

            <input
              id="profile-resume-upload"
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={
                handleResumeChange
              }
              style={{
                display: "none",
              }}
            />

            <button
              type="button"
              onClick={() =>
                document
                  .getElementById(
                    "profile-resume-upload"
                  )
                  ?.click()
              }
              disabled={
                uploadingResume
              }
            >

              <FaUpload />

              {uploadingResume
                ? "Uploading..."
                : profile.resume ||
                  profile.resumeOriginalName
                ? "Replace Resume"
                : "Upload Resume"}

            </button>

          </div>

        </section>

        {/* ======================================================
            AI PROFILE SCORE
        ====================================================== */}

        <section className="ai-profile-score">

          <div className="ai-score-content">

            <span className="ai-score-badge">
              <FaMagic />
              TALENTIQ AI
            </span>

            <h2>

              Your profile is{" "}

              <span>
                {completion >= 85
                  ? "ready"
                  : "almost ready"}
              </span>

              .

            </h2>

            <p>
              TalentIQ uses your skills,
              experience, education and
              career preferences to
              personalize job recommendations
              and improve your AI job-match
              score.
            </p>

            <div className="ai-score-points">

              <span>
                <FaCheckCircle />
                Better job recommendations
              </span>

              <span>
                <FaCheckCircle />
                Improved recruiter visibility
              </span>

              <span>
                <FaCheckCircle />
                More accurate AI matching
              </span>

            </div>

          </div>

          <div className="ai-score-circle">

            <strong>
              {completion}%
            </strong>

            <span>
              Profile
              <br />
              Complete
            </span>

          </div>

        </section>

        {/* ======================================================
            BOTTOM ACTIONS
        ====================================================== */}

        <div className="profile-bottom-actions">

          <button
            className="back-dashboard-btn"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            <FaArrowLeft />
            Back to Dashboard
          </button>

          {!editMode && (

            <button
              className="bottom-edit-btn"
              onClick={() => {
                setEditMode(true);
                setError("");
              }}
            >
              <FaEdit />
              Edit My Profile
            </button>

          )}

          {editMode && (

            <button
              className="bottom-save-btn"
              onClick={handleSave}
              disabled={saving}
            >
              <FaSave />

              {saving
                ? "Saving Profile..."
                : "Save Changes"}

            </button>

          )}

        </div>

      </main>

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <footer className="profile-footer">

        <div className="profile-container footer-main">

          {/* BRAND */}

          <div className="footer-brand">

            <div className="footer-brand-row">

              <div className="footer-logo-box">

                <img
                  src="/images/TalentIQ_Logo.png"
                  alt="TalentIQ"
                />

              </div>

              <strong>
                Talent
                <span>IQ</span>
              </strong>

            </div>

            <p>
              AI-powered career intelligence
              helping job seekers discover
              better opportunities and build
              stronger careers.
            </p>

            {/* SOCIAL ICONS */}

            <div
              className="footer-socials"
              aria-label="TalentIQ social links"
            >

              <a
                href={
                  profile.linkedin ||
                  "https://www.linkedin.com"
                }
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                title="LinkedIn"
              >
                <FaLinkedinIn />
              </a>

              <a
                href={
                  profile.github ||
                  "https://github.com"
                }
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                title="GitHub"
              >
                <FaGithub />
              </a>

              <a
                href="https://www.instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                title="Instagram"
              >
                <FaInstagram />
              </a>

              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Twitter"
                title="Twitter"
              >
                <FaTwitter />
              </a>

            </div>

          </div>

          {/* CANDIDATES */}

          <div className="footer-column">

            <h4>
              For Candidates
            </h4>

            <button
              onClick={() =>
                navigate("/dashboard")
              }
            >
              Dashboard
            </button>

            <button
              onClick={() =>
                navigate("/find-jobs")
              }
            >
              Find Jobs
            </button>

            <button
              onClick={() =>
                navigate(
                  "/ai-recommendations"
                )
              }
            >
              AI Recommendations
            </button>

            <button
              onClick={() =>
                navigate("/applications")
              }
            >
              Applications
            </button>

          </div>

          {/* CAREER TOOLS */}

          <div className="footer-column">

            <h4>
              Career Tools
            </h4>

            <button
              onClick={() =>
                navigate("/resume")
              }
            >
              Resume Analyzer
            </button>

            <button type="button"
            onClick={()=>
              navigate("/career-insights")
            }
            >
              AI Career Insights
            </button>

            <button type="button"
            onClick={()=>
              navigate("/skill-gap-analysis")
            }
            >
              Skill Gap Analysis
            </button>

            <button type="button"
            onClick={()=>
              navigate("/career-copilot")
            }
            >
              Career Copilot
            </button>

          </div>

          {/* TALENTIQ */}

          <div className="footer-column">

            <h4>
              TalentIQ
            </h4>

            <button type="button"
             onClick={() =>
                navigate("/about-talentiq")
              }
            >
              About Us
            </button>

            <button type="button"
             onClick={() =>
                navigate("/contact")
              }
            >
              Contact
            </button>

            <button type="button"
             onClick={() =>
                navigate("/privacy-policy")
              }
            >
              Privacy Policy
            </button>

            <button type="button"
             onClick={() =>
                navigate("/terms-conditions")
              }
            >
              Terms of Service
            </button>

            <button type="button"
             onClick={() =>
                navigate("/help-center")
              }
            >
              Help Center
            </button>

            <button
              type="button"
              onClick={handleLogout}
            >
              <FaSignOutAlt />
              Logout
            </button>

          </div>

        </div>

        <div className="footer-bottom">

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

export default Profile;