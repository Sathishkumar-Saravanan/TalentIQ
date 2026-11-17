import React, { useEffect, useState } from "react";
import "../styles/Resume.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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
  template: "professional",
};

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("talentIQToken") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("accessToken") ||
  "";

const asArray = (value) => {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return [value];
};

const firstValue = (...values) => {
  for (const value of values) {
    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      return value;
    }
  }
  return "";
};

const toDateInput = (value) => {
  if (!value) return "";

  const stringValue = String(value);

  if (/^\d{4}-\d{2}-\d{2}$/.test(stringValue)) {
    return stringValue;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatDate = (value) => {
  if (!value) return "";

  const stringValue = String(value);

  if (/^\d{4}$/.test(stringValue)) {
    return stringValue;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return stringValue;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
};

const normalizeSkills = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item;
        return item?.name || item?.skill || "";
      })
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const normalizeTechnologies = (value) => {
  return normalizeSkills(value);
};

const normalizeResume = (rawResume = {}, apiUser = {}) => {
  const raw = rawResume || {};

  const rawPersonal = raw.personalInfo || {};

  const personalInfo = {
    ...emptyResume.personalInfo,
    ...rawPersonal,

    fullName: firstValue(
      rawPersonal.fullName,
      rawPersonal.name,
      raw.fullName,
      raw.name,
      apiUser.fullName,
      apiUser.name
    ),

    email: firstValue(
      rawPersonal.email,
      raw.email,
      apiUser.email
    ),

    phone: firstValue(
      rawPersonal.phone,
      raw.phone,
      apiUser.phone
    ),

    location: firstValue(
      rawPersonal.location,
      raw.location,
      apiUser.location
    ),

    linkedin: firstValue(
      rawPersonal.linkedin,
      rawPersonal.linkedIn,
      raw.linkedin,
      raw.linkedIn,
      apiUser.linkedin,
      apiUser.linkedIn
    ),

    github: firstValue(
      rawPersonal.github,
      rawPersonal.gitHub,
      raw.github,
      raw.gitHub,
      apiUser.github,
      apiUser.gitHub
    ),

    portfolio: firstValue(
      rawPersonal.portfolio,
      raw.portfolio,
      apiUser.portfolio
    ),
  };

  const education = asArray(
    firstValue(raw.education, raw.educations)
  ).map((item) => ({
    ...item,

    institution: firstValue(
      item?.institution,
      item?.college,
      item?.school,
      item?.university,
      item?.organization
    ),

    degree: firstValue(
      item?.degree,
      item?.qualification
    ),

    field: firstValue(
      item?.field,
      item?.specialization,
      item?.major,
      item?.stream
    ),

    startDate: firstValue(
      item?.startDate,
      item?.from,
      item?.start,
      item?.startYear
    ),

    endDate: firstValue(
      item?.endDate,
      item?.to,
      item?.end,
      item?.endYear,
      item?.graduationDate,
      item?.graduationYear
    ),

    grade: firstValue(
      item?.grade,
      item?.gpa,
      item?.percentage,
      item?.cgpa
    ),

    description: firstValue(
      item?.description,
      item?.details
    ),
  }));

  const experience = asArray(
    firstValue(raw.experience, raw.workExperience, raw.employment)
  ).map((item) => ({
    ...item,

    company: firstValue(
      item?.company,
      item?.companyName,
      item?.organization
    ),

    position: firstValue(
      item?.position,
      item?.role,
      item?.jobTitle,
      item?.title
    ),

    location: firstValue(item?.location),

    startDate: firstValue(
      item?.startDate,
      item?.from,
      item?.start,
      item?.startYear
    ),

    endDate: firstValue(
      item?.endDate,
      item?.to,
      item?.end,
      item?.endYear
    ),

    current: Boolean(
      item?.current ||
      item?.currentlyWorking ||
      item?.isCurrent
    ),

    description: firstValue(
      item?.description,
      item?.details,
      item?.responsibilities
    ),
  }));

  const projects = asArray(
    firstValue(raw.projects, raw.project)
  ).map((item) => ({
    ...item,

    name: firstValue(
      item?.name,
      item?.projectName,
      item?.title
    ),

    technologies: normalizeTechnologies(
      firstValue(
        item?.technologies,
        item?.techStack,
        item?.skills,
        item?.technology
      )
    ),

    description: firstValue(
      item?.description,
      item?.details
    ),

    liveUrl: firstValue(
      item?.liveUrl,
      item?.liveLink,
      item?.demoUrl,
      item?.demoLink,
      item?.projectUrl,
      item?.url,
      item?.link
    ),

    githubUrl: firstValue(
      item?.githubUrl,
      item?.gitHubUrl,
      item?.github,
      item?.repositoryUrl,
      item?.repoUrl,
      item?.repository
    ),
  }));

  const certifications = asArray(
    firstValue(
      raw.certifications,
      raw.certificates,
      raw.certificate
    )
  ).map((item) => ({
    ...item,

    name: firstValue(
      item?.name,
      item?.title,
      item?.certificateName,
      item?.certificationName
    ),

    issuer: firstValue(
      item?.issuer,
      item?.provider,
      item?.organization,
      item?.issuedBy
    ),

    issueDate: firstValue(
      item?.issueDate,
      item?.issuedDate,
      item?.date,
      item?.startDate
    ),

    expiryDate: firstValue(
      item?.expiryDate,
      item?.expirationDate,
      item?.endDate
    ),

    credentialId: firstValue(
      item?.credentialId,
      item?.certificateId,
      item?.certificationId
    ),

    credentialUrl: firstValue(
      item?.credentialUrl,
      item?.certificateUrl,
      item?.verificationUrl,
      item?.url,
      item?.link
    ),
  }));

  return {
    ...emptyResume,
    ...raw,

    personalInfo,

    headline: firstValue(
      raw.headline,
      raw.title,
      raw.professionalTitle,
      rawPersonal.headline
    ),

    summary: firstValue(
      raw.summary,
      raw.objective,
      raw.profileSummary
    ),

    skills: normalizeSkills(raw.skills),

    education,

    experience,

    projects,

    certifications,

    achievements: asArray(raw.achievements).filter(Boolean),

    languages: asArray(raw.languages).filter(Boolean),

    template: raw.template || "professional",
  };
};

const safeUrl = (url) => {
  if (!url) return "";

  const value = String(url).trim();

  if (!value) return "";

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `https://${value}`;
};

function Resume() {
  const [resume, setResume] = useState(emptyResume);
  const [activeSection, setActiveSection] = useState("personal");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadResume();
  }, []);

  const loadResume = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        setError("Please login to view your resume.");
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/resumes`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to load resume."
        );
      }

      const apiResume =
        data?.resume ||
        data?.data?.resume ||
        {};

      const apiUser =
        data?.user ||
        data?.data?.user ||
        {};

      setResume(normalizeResume(apiResume, apiUser));
    } catch (err) {
      console.error("RESUME LOAD ERROR:", err);

      setError(
        err?.message ||
          "Unable to load your resume."
      );
    } finally {
      setLoading(false);
    }
  };

  const updatePersonalInfo = (field, value) => {
    setResume((previous) => ({
      ...previous,
      personalInfo: {
        ...(previous.personalInfo || emptyResume.personalInfo),
        [field]: value,
      },
    }));
  };

  const updateBasicField = (field, value) => {
    setResume((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const addSkill = (event) => {
    event.preventDefault();

    const input = event.currentTarget.elements.skill;
    const value = input.value.trim();

    if (!value) return;

    setResume((previous) => ({
      ...previous,
      skills: [
        ...(previous.skills || []),
        value,
      ],
    }));

    input.value = "";
  };

  const removeSkill = (index) => {
    setResume((previous) => ({
      ...previous,
      skills: (previous.skills || []).filter(
        (_, itemIndex) => itemIndex !== index
      ),
    }));
  };

  const addEducation = () => {
    setResume((previous) => ({
      ...previous,
      education: [
        ...(previous.education || []),
        {
          institution: "",
          degree: "",
          field: "",
          startDate: "",
          endDate: "",
          grade: "",
          description: "",
        },
      ],
    }));
  };

  const updateEducation = (index, field, value) => {
    setResume((previous) => ({
      ...previous,
      education: (previous.education || []).map(
        (item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                [field]: value,
              }
            : item
      ),
    }));
  };

  const removeEducation = (index) => {
    setResume((previous) => ({
      ...previous,
      education: (previous.education || []).filter(
        (_, itemIndex) => itemIndex !== index
      ),
    }));
  };

  const addExperience = () => {
    setResume((previous) => ({
      ...previous,
      experience: [
        ...(previous.experience || []),
        {
          company: "",
          position: "",
          location: "",
          startDate: "",
          endDate: "",
          current: false,
          description: "",
        },
      ],
    }));
  };

  const updateExperience = (index, field, value) => {
    setResume((previous) => ({
      ...previous,
      experience: (previous.experience || []).map(
        (item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                [field]: value,
              }
            : item
      ),
    }));
  };

  const removeExperience = (index) => {
    setResume((previous) => ({
      ...previous,
      experience: (previous.experience || []).filter(
        (_, itemIndex) => itemIndex !== index
      ),
    }));
  };

  const addProject = () => {
    setResume((previous) => ({
      ...previous,
      projects: [
        ...(previous.projects || []),
        {
          name: "",
          technologies: [],
          description: "",
          liveUrl: "",
          githubUrl: "",
        },
      ],
    }));
  };

  const updateProject = (index, field, value) => {
    setResume((previous) => ({
      ...previous,
      projects: (previous.projects || []).map(
        (item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                [field]: value,
              }
            : item
      ),
    }));
  };

  const updateProjectTechnologies = (index, value) => {
    const technologies = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    updateProject(
      index,
      "technologies",
      technologies
    );
  };

  const removeProject = (index) => {
    setResume((previous) => ({
      ...previous,
      projects: (previous.projects || []).filter(
        (_, itemIndex) => itemIndex !== index
      ),
    }));
  };

  const addCertification = () => {
    setResume((previous) => ({
      ...previous,
      certifications: [
        ...(previous.certifications || []),
        {
          name: "",
          issuer: "",
          issueDate: "",
          expiryDate: "",
          credentialId: "",
          credentialUrl: "",
        },
      ],
    }));
  };

  const updateCertification = (
    index,
    field,
    value
  ) => {
    setResume((previous) => ({
      ...previous,
      certifications: (
        previous.certifications || []
      ).map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      ),
    }));
  };

  const removeCertification = (index) => {
    setResume((previous) => ({
      ...previous,
      certifications: (
        previous.certifications || []
      ).filter(
        (_, itemIndex) => itemIndex !== index
      ),
    }));
  };

  const saveResume = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const token = getToken();

      if (!token) {
        setError("Please login first.");
        return;
      }

      const response = await fetch(`${API_URL}/resumes`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(resume),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to save resume."
        );
      }

      const savedResume =
        data?.resume ||
        data?.data?.resume ||
        resume;

      const savedUser =
        data?.user ||
        data?.data?.user ||
        {};

      setResume(
        normalizeResume(
          savedResume,
          savedUser
        )
      );

      setSuccess(
        data?.message ||
          "Resume saved successfully."
      );
    } catch (err) {
      console.error("RESUME SAVE ERROR:", err);

      setError(
        err?.message ||
          "Unable to save resume."
      );
    } finally {
      setSaving(false);
    }
  };

  const printResume = () => {
    window.print();
  };

  const personal =
    resume?.personalInfo ||
    emptyResume.personalInfo;

  const skills =
    Array.isArray(resume?.skills)
      ? resume.skills
      : [];

  const education =
    Array.isArray(resume?.education)
      ? resume.education
      : [];

  const experience =
    Array.isArray(resume?.experience)
      ? resume.experience
      : [];

  const projects =
    Array.isArray(resume?.projects)
      ? resume.projects
      : [];

  const certifications =
    Array.isArray(resume?.certifications)
      ? resume.certifications
      : [];

  const calculateCompletion = () => {
    const fields = [
      personal.fullName,
      personal.email,
      personal.phone,
      personal.location,
      resume.headline,
      resume.summary,
      skills.length > 0,
      education.length > 0,
      experience.length > 0,
      projects.length > 0,
      certifications.length > 0,
    ];

    const completed = fields.filter(Boolean).length;

    return Math.round(
      (completed / fields.length) * 100
    );
  };

  if (loading) {
    return (
      <div className="resume-loading">
        <div className="resume-spinner"></div>
        <p>Loading your resume...</p>
      </div>
    );
  }

  return (
    <div className="resume-page">
      <div className="resume-header">
        <div>
          <span className="resume-badge">
            TALENTIQ RESUME
          </span>

          <h1>Resume Builder</h1>

          <p>
            Build and manage your professional
            resume using your saved TalentIQ data.
          </p>
        </div>

        <div className="resume-actions">
          <button
            type="button"
            className="preview-btn"
            onClick={printResume}
          >
            🖨 Print
          </button>

          <button
            type="button"
            className="save-btn"
            onClick={saveResume}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Resume"}
          </button>
        </div>
      </div>

      {error && (
        <div className="resume-alert error-alert">
          {error}
        </div>
      )}

      {success && (
        <div className="resume-alert success-alert">
          {success}
        </div>
      )}

      <div className="resume-layout">
        <div className="resume-editor">
          <div className="section-tabs">
            <button
              className={
                activeSection === "personal"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveSection("personal")
              }
            >
              Personal
            </button>

            <button
              className={
                activeSection === "summary"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveSection("summary")
              }
            >
              Summary
            </button>

            <button
              className={
                activeSection === "skills"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveSection("skills")
              }
            >
              Skills
            </button>

            <button
              className={
                activeSection === "education"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveSection("education")
              }
            >
              Education
            </button>

            <button
              className={
                activeSection === "experience"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveSection("experience")
              }
            >
              Experience
            </button>

            <button
              className={
                activeSection === "projects"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveSection("projects")
              }
            >
              Projects
            </button>

            <button
              className={
                activeSection === "certifications"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveSection("certifications")
              }
            >
              Certificates
            </button>
          </div>

          {activeSection === "personal" && (
            <div className="editor-card">
              <h2>Personal Information</h2>

              <p className="section-description">
                Your details are loaded from your
                TalentIQ account and MongoDB resume data.
              </p>

              <div className="form-grid">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={personal.fullName || ""}
                  onChange={(event) =>
                    updatePersonalInfo(
                      "fullName",
                      event.target.value
                    )
                  }
                />

                <input
                  type="email"
                  placeholder="Email"
                  value={personal.email || ""}
                  onChange={(event) =>
                    updatePersonalInfo(
                      "email",
                      event.target.value
                    )
                  }
                />

                <input
                  type="text"
                  placeholder="Phone"
                  value={personal.phone || ""}
                  onChange={(event) =>
                    updatePersonalInfo(
                      "phone",
                      event.target.value
                    )
                  }
                />

                <input
                  type="text"
                  placeholder="Location"
                  value={personal.location || ""}
                  onChange={(event) =>
                    updatePersonalInfo(
                      "location",
                      event.target.value
                    )
                  }
                />

                <input
                  type="text"
                  placeholder="LinkedIn URL"
                  value={personal.linkedin || ""}
                  onChange={(event) =>
                    updatePersonalInfo(
                      "linkedin",
                      event.target.value
                    )
                  }
                />

                <input
                  type="text"
                  placeholder="GitHub URL"
                  value={personal.github || ""}
                  onChange={(event) =>
                    updatePersonalInfo(
                      "github",
                      event.target.value
                    )
                  }
                />
              </div>

              <input
                className="full-input"
                type="text"
                placeholder="Portfolio URL"
                value={personal.portfolio || ""}
                onChange={(event) =>
                  updatePersonalInfo(
                    "portfolio",
                    event.target.value
                  )
                }
              />

              <input
                className="full-input"
                type="text"
                placeholder="Professional Headline"
                value={resume.headline || ""}
                onChange={(event) =>
                  updateBasicField(
                    "headline",
                    event.target.value
                  )
                }
              />
            </div>
          )}

          {activeSection === "summary" && (
            <div className="editor-card">
              <h2>Professional Summary</h2>

              <p className="section-description">
                Write a short professional summary about
                yourself, your skills and your career goals.
              </p>

              <textarea
                rows="9"
                placeholder="Write your professional summary..."
                value={resume.summary || ""}
                onChange={(event) =>
                  updateBasicField(
                    "summary",
                    event.target.value
                  )
                }
              />
            </div>
          )}

          {activeSection === "skills" && (
            <div className="editor-card">
              <h2>Skills</h2>

              <p className="section-description">
                Add your technical and professional skills.
              </p>

              <form
                className="skill-input"
                onSubmit={addSkill}
              >
                <input
                  name="skill"
                  type="text"
                  placeholder="Example: React.js"
                />

                <button type="submit">
                  Add
                </button>
              </form>

              <div className="skills-list">
                {skills.length === 0 ? (
                  <p className="empty-message">
                    No skills added yet.
                  </p>
                ) : (
                  skills.map((skill, index) => (
                    <div
                      className="skill-tag"
                      key={`${skill}-${index}`}
                    >
                      <span>{skill}</span>

                      <button
                        type="button"
                        onClick={() =>
                          removeSkill(index)
                        }
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeSection === "education" && (
            <div className="editor-card">
              <div className="section-title-row">
                <div>
                  <h2>Education</h2>

                  <p className="section-description">
                    Add your education details and dates
                    stored in MongoDB.
                  </p>
                </div>

                <button
                  type="button"
                  className="add-btn"
                  onClick={addEducation}
                >
                  + Add Education
                </button>
              </div>

              {education.map((item, index) => (
                <div
                  className="dynamic-card"
                  key={index}
                >
                  <div className="dynamic-header">
                    <strong>
                      Education #{index + 1}
                    </strong>

                    <button
                      type="button"
                      onClick={() =>
                        removeEducation(index)
                      }
                    >
                      Remove
                    </button>
                  </div>

                  <div className="form-grid">
                    <input
                      type="text"
                      placeholder="Institution / College"
                      value={item.institution || ""}
                      onChange={(event) =>
                        updateEducation(
                          index,
                          "institution",
                          event.target.value
                        )
                      }
                    />

                    <input
                      type="text"
                      placeholder="Degree"
                      value={item.degree || ""}
                      onChange={(event) =>
                        updateEducation(
                          index,
                          "degree",
                          event.target.value
                        )
                      }
                    />

                    <input
                      type="text"
                      placeholder="Field / Specialization"
                      value={item.field || ""}
                      onChange={(event) =>
                        updateEducation(
                          index,
                          "field",
                          event.target.value
                        )
                      }
                    />

                    <input
                      type="text"
                      placeholder="Grade / CGPA / Percentage"
                      value={item.grade || ""}
                      onChange={(event) =>
                        updateEducation(
                          index,
                          "grade",
                          event.target.value
                        )
                      }
                    />
                  </div>

                  <div className="date-grid">
                    <div>
                      <label>
                        Start Date
                      </label>

                      <input
                        type="date"
                        value={toDateInput(
                          item.startDate
                        )}
                        onChange={(event) =>
                          updateEducation(
                            index,
                            "startDate",
                            event.target.value
                          )
                        }
                      />
                    </div>

                    <div>
                      <label>
                        End / Graduation Date
                      </label>

                      <input
                        type="date"
                        value={toDateInput(
                          item.endDate
                        )}
                        onChange={(event) =>
                          updateEducation(
                            index,
                            "endDate",
                            event.target.value
                          )
                        }
                      />
                    </div>
                  </div>

                  <textarea
                    rows="4"
                    placeholder="Education description"
                    value={
                      item.description || ""
                    }
                    onChange={(event) =>
                      updateEducation(
                        index,
                        "description",
                        event.target.value
                      )
                    }
                  />
                </div>
              ))}

              {education.length === 0 && (
                <div className="empty-card">
                  No education records found.
                </div>
              )}
            </div>
          )}

          {activeSection === "experience" && (
            <div className="editor-card">
              <div className="section-title-row">
                <div>
                  <h2>Experience</h2>

                  <p className="section-description">
                    Add your work experience and employment
                    dates.
                  </p>
                </div>

                <button
                  type="button"
                  className="add-btn"
                  onClick={addExperience}
                >
                  + Add Experience
                </button>
              </div>

              {experience.map((item, index) => (
                <div
                  className="dynamic-card"
                  key={index}
                >
                  <div className="dynamic-header">
                    <strong>
                      Experience #{index + 1}
                    </strong>

                    <button
                      type="button"
                      onClick={() =>
                        removeExperience(index)
                      }
                    >
                      Remove
                    </button>
                  </div>

                  <div className="form-grid">
                    <input
                      type="text"
                      placeholder="Company"
                      value={item.company || ""}
                      onChange={(event) =>
                        updateExperience(
                          index,
                          "company",
                          event.target.value
                        )
                      }
                    />

                    <input
                      type="text"
                      placeholder="Position / Role"
                      value={item.position || ""}
                      onChange={(event) =>
                        updateExperience(
                          index,
                          "position",
                          event.target.value
                        )
                      }
                    />

                    <input
                      type="text"
                      placeholder="Location"
                      value={item.location || ""}
                      onChange={(event) =>
                        updateExperience(
                          index,
                          "location",
                          event.target.value
                        )
                      }
                    />
                  </div>

                  <div className="date-grid">
                    <div>
                      <label>
                        Start Date
                      </label>

                      <input
                        type="date"
                        value={toDateInput(
                          item.startDate
                        )}
                        onChange={(event) =>
                          updateExperience(
                            index,
                            "startDate",
                            event.target.value
                          )
                        }
                      />
                    </div>

                    <div>
                      <label>
                        End Date
                      </label>

                      <input
                        type="date"
                        value={toDateInput(
                          item.endDate
                        )}
                        disabled={Boolean(item.current)}
                        onChange={(event) =>
                          updateExperience(
                            index,
                            "endDate",
                            event.target.value
                          )
                        }
                      />
                    </div>
                  </div>

                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={Boolean(
                        item.current
                      )}
                      onChange={(event) =>
                        updateExperience(
                          index,
                          "current",
                          event.target.checked
                        )
                      }
                    />

                    <span>
                      I currently work here
                    </span>
                  </label>

                  <textarea
                    rows="5"
                    placeholder="Describe your responsibilities and achievements"
                    value={
                      item.description || ""
                    }
                    onChange={(event) =>
                      updateExperience(
                        index,
                        "description",
                        event.target.value
                      )
                    }
                  />
                </div>
              ))}

              {experience.length === 0 && (
                <div className="empty-card">
                  No experience records found.
                </div>
              )}
            </div>
          )}

          {activeSection === "projects" && (
            <div className="editor-card">
              <div className="section-title-row">
                <div>
                  <h2>Projects</h2>

                  <p className="section-description">
                    Add projects, technologies and live/GitHub
                    links.
                  </p>
                </div>

                <button
                  type="button"
                  className="add-btn"
                  onClick={addProject}
                >
                  + Add Project
                </button>
              </div>

              {projects.map((item, index) => (
                <div
                  className="dynamic-card"
                  key={index}
                >
                  <div className="dynamic-header">
                    <strong>
                      Project #{index + 1}
                    </strong>

                    <button
                      type="button"
                      onClick={() =>
                        removeProject(index)
                      }
                    >
                      Remove
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Project Name"
                    value={item.name || ""}
                    onChange={(event) =>
                      updateProject(
                        index,
                        "name",
                        event.target.value
                      )
                    }
                  />

                  <input
                    type="text"
                    placeholder="Technologies - React, Node.js, MongoDB"
                    value={(
                      item.technologies || []
                    ).join(", ")}
                    onChange={(event) =>
                      updateProjectTechnologies(
                        index,
                        event.target.value
                      )
                    }
                  />

                  <textarea
                    rows="5"
                    placeholder="Project description"
                    value={
                      item.description || ""
                    }
                    onChange={(event) =>
                      updateProject(
                        index,
                        "description",
                        event.target.value
                      )
                    }
                  />

                  <div className="form-grid">
                    <input
                      type="text"
                      placeholder="Live Project URL"
                      value={item.liveUrl || ""}
                      onChange={(event) =>
                        updateProject(
                          index,
                          "liveUrl",
                          event.target.value
                        )
                      }
                    />

                    <input
                      type="text"
                      placeholder="GitHub Repository URL"
                      value={item.githubUrl || ""}
                      onChange={(event) =>
                        updateProject(
                          index,
                          "githubUrl",
                          event.target.value
                        )
                      }
                    />
                  </div>
                </div>
              ))}

              {projects.length === 0 && (
                <div className="empty-card">
                  No project records found.
                </div>
              )}
            </div>
          )}

          {activeSection === "certifications" && (
            <div className="editor-card">
              <div className="section-title-row">
                <div>
                  <h2>Certifications</h2>

                  <p className="section-description">
                    Add certificates and verification links
                    from your MongoDB resume data.
                  </p>
                </div>

                <button
                  type="button"
                  className="add-btn"
                  onClick={addCertification}
                >
                  + Add Certificate
                </button>
              </div>

              {certifications.map(
                (item, index) => (
                  <div
                    className="dynamic-card"
                    key={index}
                  >
                    <div className="dynamic-header">
                      <strong>
                        Certificate #{index + 1}
                      </strong>

                      <button
                        type="button"
                        onClick={() =>
                          removeCertification(
                            index
                          )
                        }
                      >
                        Remove
                      </button>
                    </div>

                    <div className="form-grid">
                      <input
                        type="text"
                        placeholder="Certificate Name"
                        value={item.name || ""}
                        onChange={(event) =>
                          updateCertification(
                            index,
                            "name",
                            event.target.value
                          )
                        }
                      />

                      <input
                        type="text"
                        placeholder="Issuing Organization"
                        value={item.issuer || ""}
                        onChange={(event) =>
                          updateCertification(
                            index,
                            "issuer",
                            event.target.value
                          )
                        }
                      />

                      <input
                        type="text"
                        placeholder="Credential ID"
                        value={
                          item.credentialId || ""
                        }
                        onChange={(event) =>
                          updateCertification(
                            index,
                            "credentialId",
                            event.target.value
                          )
                        }
                      />
                    </div>

                    <div className="date-grid">
                      <div>
                        <label>
                          Issue Date
                        </label>

                        <input
                          type="date"
                          value={toDateInput(
                            item.issueDate
                          )}
                          onChange={(event) =>
                            updateCertification(
                              index,
                              "issueDate",
                              event.target.value
                            )
                          }
                        />
                      </div>

                      <div>
                        <label>
                          Expiry Date
                        </label>

                        <input
                          type="date"
                          value={toDateInput(
                            item.expiryDate
                          )}
                          onChange={(event) =>
                            updateCertification(
                              index,
                              "expiryDate",
                              event.target.value
                            )
                          }
                        />
                      </div>
                    </div>

                    <input
                      type="text"
                      placeholder="Credential / Verification URL"
                      value={
                        item.credentialUrl || ""
                      }
                      onChange={(event) =>
                        updateCertification(
                          index,
                          "credentialUrl",
                          event.target.value
                        )
                      }
                    />
                  </div>
                )
              )}

              {certifications.length === 0 && (
                <div className="empty-card">
                  No certification records found.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="resume-preview-container">
          <div className="preview-toolbar">
            <span>
              Resume Preview
            </span>

            <span className="completion">
              {calculateCompletion()}% Complete
            </span>
          </div>

          <div className="resume-paper">
            <header className="paper-header">
              <h1>
                {personal.fullName ||
                  "Your Name"}
              </h1>

              <h3>
                {resume.headline ||
                  "Professional Title"}
              </h3>

              <div className="contact-line">
                {personal.email && (
                  <span>
                    {personal.email}
                  </span>
                )}

                {personal.phone && (
                  <span>
                    {personal.phone}
                  </span>
                )}

                {personal.location && (
                  <span>
                    {personal.location}
                  </span>
                )}

                {personal.linkedin && (
                  <a
                    href={safeUrl(
                      personal.linkedin
                    )}
                    target="_blank"
                    rel="noreferrer"
                  >
                    LinkedIn
                  </a>
                )}

                {personal.github && (
                  <a
                    href={safeUrl(
                      personal.github
                    )}
                    target="_blank"
                    rel="noreferrer"
                  >
                    GitHub
                  </a>
                )}

                {personal.portfolio && (
                  <a
                    href={safeUrl(
                      personal.portfolio
                    )}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Portfolio
                  </a>
                )}
              </div>
            </header>

            {resume.summary && (
              <section className="paper-section">
                <h2>
                  PROFESSIONAL SUMMARY
                </h2>

                <p>
                  {resume.summary}
                </p>
              </section>
            )}

            {skills.length > 0 && (
              <section className="paper-section">
                <h2>SKILLS</h2>

                <div className="paper-skills">
                  {skills.map(
                    (skill, index) => (
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

            {experience.length > 0 && (
              <section className="paper-section">
                <h2>
                  EXPERIENCE
                </h2>

                {experience.map(
                  (item, index) => {
                    const start = formatDate(
                      item.startDate
                    );

                    const end = item.current
                      ? "Present"
                      : formatDate(
                          item.endDate
                        );

                    const dateText =
                      start || end
                        ? `${start}${
                            start && end
                              ? " - "
                              : ""
                          }${end}`
                        : "";

                    return (
                      <div
                        className="paper-item"
                        key={index}
                      >
                        <div className="paper-item-heading">
                          <strong>
                            {item.position ||
                              "Position"}
                          </strong>

                          {dateText && (
                            <span>
                              {dateText}
                            </span>
                          )}
                        </div>

                        <div className="paper-company">
                          {item.company || ""}
                          {item.location
                            ? ` | ${item.location}`
                            : ""}
                        </div>

                        {item.description && (
                          <p>
                            {
                              item.description
                            }
                          </p>
                        )}
                      </div>
                    );
                  }
                )}
              </section>
            )}

            {education.length > 0 && (
              <section className="paper-section">
                <h2>
                  EDUCATION
                </h2>

                {education.map(
                  (item, index) => {
                    const start = formatDate(
                      item.startDate
                    );

                    const end = formatDate(
                      item.endDate
                    );

                    const dateText =
                      start || end
                        ? `${start}${
                            start && end
                              ? " - "
                              : ""
                          }${end}`
                        : "";

                    return (
                      <div
                        className="paper-item"
                        key={index}
                      >
                        <div className="paper-item-heading">
                          <strong>
                            {item.degree ||
                              "Degree"}
                            {item.field
                              ? ` - ${item.field}`
                              : ""}
                          </strong>

                          {dateText && (
                            <span>
                              {dateText}
                            </span>
                          )}
                        </div>

                        <div className="paper-company">
                          {
                            item.institution
                          }
                        </div>

                        {item.grade && (
                          <div className="paper-grade">
                            Grade: {item.grade}
                          </div>
                        )}

                        {item.description && (
                          <p>
                            {
                              item.description
                            }
                          </p>
                        )}
                      </div>
                    );
                  }
                )}
              </section>
            )}

            {projects.length > 0 && (
              <section className="paper-section">
                <h2>PROJECTS</h2>

                {projects.map(
                  (item, index) => (
                    <div
                      className="paper-item"
                      key={index}
                    >
                      <div className="paper-item-heading">
                        <strong>
                          {item.name ||
                            "Project"}
                        </strong>
                      </div>

                      {item.technologies?.length >
                        0 && (
                        <div className="paper-tech">
                          <strong>
                            Technologies:
                          </strong>{" "}
                          {item.technologies.join(
                            ", "
                          )}
                        </div>
                      )}

                      {item.description && (
                        <p>
                          {
                            item.description
                          }
                        </p>
                      )}

                      <div className="paper-project-links">
                        {item.liveUrl && (
                          <a
                            href={safeUrl(
                              item.liveUrl
                            )}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Live Project
                          </a>
                        )}

                        {item.githubUrl && (
                          <a
                            href={safeUrl(
                              item.githubUrl
                            )}
                            target="_blank"
                            rel="noreferrer"
                          >
                            GitHub
                          </a>
                        )}
                      </div>
                    </div>
                  )
                )}
              </section>
            )}

            {certifications.length > 0 && (
              <section className="paper-section">
                <h2>
                  CERTIFICATIONS
                </h2>

                {certifications.map(
                  (item, index) => (
                    <div
                      className="paper-item paper-certificate"
                      key={index}
                    >
                      <div className="paper-item-heading">
                        <strong>
                          {item.name ||
                            "Certification"}
                        </strong>

                        {item.issueDate && (
                          <span>
                            {formatDate(
                              item.issueDate
                            )}
                          </span>
                        )}
                      </div>

                      {item.issuer && (
                        <div className="paper-company">
                          {item.issuer}
                        </div>
                      )}

                      {item.credentialId && (
                        <div className="paper-grade">
                          Credential ID:{" "}
                          {
                            item.credentialId
                          }
                        </div>
                      )}

                      {item.expiryDate && (
                        <div className="paper-grade">
                          Expires:{" "}
                          {formatDate(
                            item.expiryDate
                          )}
                        </div>
                      )}

                      {item.credentialUrl && (
                        <div className="paper-project-links">
                          <a
                            href={safeUrl(
                              item.credentialUrl
                            )}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Verify Certificate
                          </a>
                        </div>
                      )}
                    </div>
                  )
                )}
              </section>
            )}

            {Array.isArray(
              resume.achievements
            ) &&
              resume.achievements.length >
                0 && (
                <section className="paper-section">
                  <h2>
                    ACHIEVEMENTS
                  </h2>

                  {resume.achievements.map(
                    (item, index) => (
                      <p
                        key={index}
                        className="paper-achievement"
                      >
                        {typeof item ===
                        "string"
                          ? item
                          : item?.title ||
                            item?.name ||
                            item?.description ||
                            ""}
                      </p>
                    )
                  )}
                </section>
              )}

            {Array.isArray(
              resume.languages
            ) &&
              resume.languages.length >
                0 && (
                <section className="paper-section">
                  <h2>
                    LANGUAGES
                  </h2>

                  <p>
                    {resume.languages
                      .map((item) =>
                        typeof item ===
                        "string"
                          ? item
                          : item?.name ||
                            item?.language ||
                            ""
                      )
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </section>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Resume;