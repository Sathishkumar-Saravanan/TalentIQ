import React, {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import "../../styles/RecruiterPostJob.css";


// ============================================================
// API
// =========================================================

const API_URL =
  "http://localhost:5000";


// ============================================================
// INITIAL FORM
// ============================================================

const initialForm = {
  title: "",
  location: "",
  type: "Full Time",
  experience: "",
  salary: "",
  mode: "On-site",
  description: "",
  skills: "",
  requirements: "",
  responsibilities: "",
  benefits: "",
  status: "Active",
};


// ============================================================
// COMPONENT
// ============================================================

const RecruiterPostJob = () => {

  const navigate =
    useNavigate();


  // ==========================================================
  // STATE
  // ==========================================================

  const [
    formData,
    setFormData,
  ] = useState(initialForm);


  const [
    recruiterProfile,
    setRecruiterProfile,
  ] = useState(null);


  const [
    loadingProfile,
    setLoadingProfile,
  ] = useState(true);


  const [
    submitting,
    setSubmitting,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  const [
    success,
    setSuccess,
  ] = useState("");


  // ==========================================================
  // GET TOKEN
  // ==========================================================

  const getToken = () => {

    return (
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("accessToken") ||
      ""
    );

  };


  // ==========================================================
  // FETCH RECRUITER PROFILE
  // ==========================================================

  const fetchRecruiterProfile =
    async () => {

      try {

        setLoadingProfile(true);

        setError("");


        const token =
          getToken();


        if (!token) {

          throw new Error(
            "Authentication token not found. Please login again."
          );

        }


        // IMPORTANT:
        // /api/recruiters, NOT /api/recruiter

        const response =
          await fetch(
            `${API_URL}/api/recruiters/profile`,
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


        const data =
          await response.json();


        console.log(
          "RECRUITER PROFILE:",
          data
        );


        if (!response.ok) {

          throw new Error(
            data.message ||
              "Unable to load recruiter profile"
          );

        }


        setRecruiterProfile(
          data.profile
        );


      } catch (err) {

        console.error(
          "PROFILE LOAD ERROR:",
          err
        );


        setError(
          err.message ||
            "Unable to load recruiter profile."
        );

      } finally {

        setLoadingProfile(false);

      }

    };


  // ==========================================================
  // LOAD PROFILE
  // ==========================================================

  useEffect(() => {

    fetchRecruiterProfile();

  }, []);


  // ==========================================================
  // HANDLE INPUT
  // ==========================================================

  const handleChange = (
    event
  ) => {

    const {
      name,
      value,
    } = event.target;


    setFormData(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );


    setError("");
    setSuccess("");

  };


  // ==========================================================
  // CONVERT TEXTAREA TO ARRAY
  // ==========================================================

  const convertToArray = (
    value
  ) => {

    return String(value || "")
      .split("\n")
      .map(
        (item) =>
          item.trim()
      )
      .filter(Boolean);

  };


  // ==========================================================
  // SKILLS
  // ==========================================================

  const convertSkills = (
    value
  ) => {

    return String(value || "")
      .split(",")
      .map(
        (item) =>
          item.trim()
      )
      .filter(Boolean);

  };


  // ==========================================================
  // VALIDATION
  // ==========================================================

  const validateForm = () => {

    if (
      !formData.title.trim()
    ) {

      setError(
        "Please enter the job title."
      );

      return false;

    }


    if (
      !formData.location.trim()
    ) {

      setError(
        "Please enter the job location."
      );

      return false;

    }


    if (
      !formData.experience.trim()
    ) {

      setError(
        "Please enter the required experience."
      );

      return false;

    }


    if (
      !formData.description.trim()
    ) {

      setError(
        "Please enter the job description."
      );

      return false;

    }


    if (
      formData.description.trim()
        .length < 30
    ) {

      setError(
        "Job description should contain at least 30 characters."
      );

      return false;

    }


    return true;

  };


  // ==========================================================
  // SUBMIT JOB
  // ==========================================================

  const handleSubmit =
    async (event) => {

      event.preventDefault();


      setError("");
      setSuccess("");


      if (
        !validateForm()
      ) {
        return;
      }


      try {

        setSubmitting(true);


        const token =
          getToken();


        if (!token) {

          throw new Error(
            "Authentication token not found. Please login again."
          );

        }


        // ------------------------------------------------------
        // REQUEST BODY
        // ------------------------------------------------------

        const payload = {

          title:
            formData.title.trim(),

          location:
            formData.location.trim(),

          type:
            formData.type,

          experience:
            formData.experience.trim(),

          salary:
            formData.salary.trim(),

          mode:
            formData.mode,

          description:
            formData.description.trim(),

          skills:
            convertSkills(
              formData.skills
            ),

          requirements:
            convertToArray(
              formData.requirements
            ),

          responsibilities:
            convertToArray(
              formData.responsibilities
            ),

          benefits:
            convertToArray(
              formData.benefits
            ),

          status:
            formData.status,
        };


        console.log(
          "CREATE JOB PAYLOAD:",
          payload
        );


        // ------------------------------------------------------
        // BACKEND REQUEST
        // ------------------------------------------------------

        const response =
          await fetch(
            `${API_URL}/api/jobs`,
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
                  payload
                ),
            }
          );


        const data =
          await response.json();


        console.log(
          "CREATE JOB RESPONSE:",
          data
        );


        if (!response.ok) {

          throw new Error(
            data.message ||
              "Unable to post job"
          );

        }


        // ------------------------------------------------------
        // SUCCESS
        // ------------------------------------------------------

        setSuccess(
          data.message ||
            "Job posted successfully!"
        );


        // ------------------------------------------------------
        // RESET
        // ------------------------------------------------------

        setFormData(
          initialForm
        );


        // ------------------------------------------------------
        // REDIRECT
        // ------------------------------------------------------

        setTimeout(() => {

          navigate(
            "/recruiter-dashboard"
          );

        }, 1200);


      } catch (err) {

        console.error(
          "CREATE JOB ERROR:",
          err
        );


        setError(
          err.message ||
            "Unable to post the job."
        );

      } finally {

        setSubmitting(false);

      }

    };


  // ==========================================================
  // CANCEL
  // ==========================================================

  const handleCancel = () => {

    navigate(
      "/recruiter-dashboard"
    );

  };


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loadingProfile) {

    return (

      <div className="recruiter-post-page">

        <div className="post-loading-card">

          <div className="post-spinner"></div>

          <h2>
            Loading recruiter profile
          </h2>

          <p>
            Please wait while we load your company information...
          </p>

        </div>

      </div>

    );

  }


  // ==========================================================
  // JSX
  // ==========================================================

  return (

    <main className="recruiter-post-page">

      <div className="recruiter-post-container">


        {/* ==================================================
            PAGE HEADER
        ================================================== */}

        <section className="post-page-header">

          <div>

            <span className="post-page-kicker">
              RECRUITER
            </span>

            <h1>
              Create a Job
            </h1>

            <p>
              Publish a new opportunity and connect with qualified candidates through TalentIQ.
            </p>

          </div>


          <button
            type="button"
            className="post-back-button"
            onClick={handleCancel}
          >
            ← Dashboard
          </button>

        </section>


        {/* ==================================================
            COMPANY INFORMATION
        ================================================== */}

        {recruiterProfile && (

          <section className="company-preview-card">

            <div className="company-preview-icon">
              TI
            </div>


            <div className="company-preview-content">

              <span>
                POSTING AS
              </span>

              <h2>
                {
                  recruiterProfile.companyName ||
                  "Company"
                }
              </h2>

              <p>

                {
                  recruiterProfile.designation ||
                  "Recruiter"
                }

                {recruiterProfile.location
                  ? ` • ${recruiterProfile.location}`
                  : ""}

              </p>

            </div>

          </section>

        )}


        {/* ==================================================
            MESSAGES
        ================================================== */}

        {error && (

          <div className="post-message post-error">

            <span className="message-symbol">
              !
            </span>

            <div>

              <strong>
                Unable to post job
              </strong>

              <p>
                {error}
              </p>

            </div>

          </div>

        )}


        {success && (

          <div className="post-message post-success">

            <span className="message-symbol">
              ✓
            </span>

            <div>

              <strong>
                Job posted successfully
              </strong>

              <p>
                {success}
              </p>

            </div>

          </div>

        )}


        {/* ==================================================
            FORM
        ================================================== */}

        <form
          className="recruiter-job-form"
          onSubmit={handleSubmit}
        >


          {/* =================================================
              BASIC INFORMATION
          ================================================= */}

          <section className="post-form-section">

            <div className="section-heading">

              <span className="section-number">
                01
              </span>

              <div>

                <h2>
                  Basic Job Information
                </h2>

                <p>
                  Add the main information candidates will see.
                </p>

              </div>

            </div>


            <div className="post-form-grid">


              {/* JOB TITLE */}

              <div className="post-field post-field-full">

                <label htmlFor="title">
                  Job Title
                  <span>*</span>
                </label>

                <input
                  id="title"
                  name="title"
                  type="text"
                  placeholder="e.g. MERN Stack Developer"
                  value={formData.title}
                  onChange={handleChange}
                  disabled={submitting}
                />

              </div>


              {/* LOCATION */}

              <div className="post-field">

                <label htmlFor="location">
                  Job Location
                  <span>*</span>
                </label>

                <input
                  id="location"
                  name="location"
                  type="text"
                  placeholder="e.g. Chennai, Tamil Nadu"
                  value={formData.location}
                  onChange={handleChange}
                  disabled={submitting}
                />

              </div>


              {/* EXPERIENCE */}

              <div className="post-field">

                <label htmlFor="experience">
                  Experience
                  <span>*</span>
                </label>

                <input
                  id="experience"
                  name="experience"
                  type="text"
                  placeholder="e.g. 0-2 years"
                  value={formData.experience}
                  onChange={handleChange}
                  disabled={submitting}
                />

              </div>


              {/* TYPE */}

              <div className="post-field">

                <label htmlFor="type">
                  Employment Type
                </label>

                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  disabled={submitting}
                >

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


              {/* WORK MODE */}

              <div className="post-field">

                <label htmlFor="mode">
                  Work Mode
                </label>

                <select
                  id="mode"
                  name="mode"
                  value={formData.mode}
                  onChange={handleChange}
                  disabled={submitting}
                >

                  <option value="On-site">
                    On-site
                  </option>

                  <option value="Hybrid">
                    Hybrid
                  </option>

                  <option value="Remote">
                    Remote
                  </option>

                </select>

              </div>


              {/* SALARY */}

              <div className="post-field">

                <label htmlFor="salary">
                  Salary
                </label>

                <input
                  id="salary"
                  name="salary"
                  type="text"
                  placeholder="e.g. ₹4 - ₹7 LPA"
                  value={formData.salary}
                  onChange={handleChange}
                  disabled={submitting}
                />

                <small>
                  Leave empty if salary is not disclosed.
                </small>

              </div>


              {/* STATUS */}

              <div className="post-field">

                <label htmlFor="status">
                  Job Status
                </label>

                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={submitting}
                >

                  <option value="Active">
                    Active
                  </option>

                  <option value="Closed">
                    Closed
                  </option>

                </select>

              </div>

            </div>

          </section>


          {/* =================================================
              DESCRIPTION
          ================================================= */}

          <section className="post-form-section">

            <div className="section-heading">

              <span className="section-number">
                02
              </span>

              <div>

                <h2>
                  Job Description
                </h2>

                <p>
                  Explain the opportunity clearly to candidates.
                </p>

              </div>

            </div>


            <div className="post-field post-field-full">

              <label htmlFor="description">
                Description
                <span>*</span>
              </label>

              <textarea
                id="description"
                name="description"
                rows="8"
                placeholder="Describe the role, team, company environment and what the candidate will work on..."
                value={formData.description}
                onChange={handleChange}
                disabled={submitting}
              />

              <small>
                Minimum recommended length: 30 characters.
              </small>

            </div>

          </section>


          {/* =================================================
              SKILLS
          ================================================= */}

          <section className="post-form-section">

            <div className="section-heading">

              <span className="section-number">
                03
              </span>

              <div>

                <h2>
                  Required Skills
                </h2>

                <p>
                  Add the technologies and skills candidates should know.
                </p>

              </div>

            </div>


            <div className="post-field post-field-full">

              <label htmlFor="skills">
                Skills
              </label>

              <input
                id="skills"
                name="skills"
                type="text"
                placeholder="React.js, Node.js, Express.js, MongoDB, JavaScript"
                value={formData.skills}
                onChange={handleChange}
                disabled={submitting}
              />

              <small>
                Separate skills using commas.
              </small>

            </div>

          </section>


          {/* =================================================
              REQUIREMENTS
          ================================================= */}

          <section className="post-form-section">

            <div className="section-heading">

              <span className="section-number">
                04
              </span>

              <div>

                <h2>
                  Candidate Requirements
                </h2>

                <p>
                  Add one requirement per line.
                </p>

              </div>

            </div>


            <div className="post-field post-field-full">

              <label htmlFor="requirements">
                Requirements
              </label>

              <textarea
                id="requirements"
                name="requirements"
                rows="6"
                placeholder={`Bachelor's degree in Computer Science
Good knowledge of JavaScript
Strong problem-solving skills
Good communication skills`}
                value={
                  formData.requirements
                }
                onChange={handleChange}
                disabled={submitting}
              />

              <small>
                Enter each requirement on a separate line.
              </small>

            </div>

          </section>


          {/* =================================================
              RESPONSIBILITIES
          ================================================= */}

          <section className="post-form-section">

            <div className="section-heading">

              <span className="section-number">
                05
              </span>

              <div>

                <h2>
                  Responsibilities
                </h2>

                <p>
                  Describe what the selected candidate will do.
                </p>

              </div>

            </div>


            <div className="post-field post-field-full">

              <label htmlFor="responsibilities">
                Responsibilities
              </label>

              <textarea
                id="responsibilities"
                name="responsibilities"
                rows="6"
                placeholder={`Develop responsive web applications
Build REST APIs
Work with the development team
Fix bugs and improve application performance`}
                value={
                  formData.responsibilities
                }
                onChange={handleChange}
                disabled={submitting}
              />

              <small>
                Enter each responsibility on a separate line.
              </small>

            </div>

          </section>


          {/* =================================================
              BENEFITS
          ================================================= */}

          <section className="post-form-section">

            <div className="section-heading">

              <span className="section-number">
                06
              </span>

              <div>

                <h2>
                  Benefits
                </h2>

                <p>
                  Tell candidates what your company offers.
                </p>

              </div>

            </div>


            <div className="post-field post-field-full">

              <label htmlFor="benefits">
                Benefits
              </label>

              <textarea
                id="benefits"
                name="benefits"
                rows="5"
                placeholder={`Flexible working environment
Learning opportunities
Career growth
Health benefits`}
                value={
                  formData.benefits
                }
                onChange={handleChange}
                disabled={submitting}
              />

              <small>
                Enter each benefit on a separate line.
              </small>

            </div>

          </section>


          {/* =================================================
              FORM ACTIONS
          ================================================= */}

          <section className="post-form-actions">

            <button
              type="button"
              className="post-cancel-button"
              onClick={handleCancel}
              disabled={submitting}
            >
              Cancel
            </button>


            <button
              type="submit"
              className="post-submit-button"
              disabled={submitting}
            >

              {submitting ? (

                <>
                  <span className="button-spinner"></span>

                  Publishing Job...
                </>

              ) : (

                <>
                  Publish Job
                </>

              )}

            </button>

          </section>

        </form>


        {/* ==================================================
            FOOTER
        ================================================== */}

        <footer className="recruiter-post-footer">

          <div className="footer-brand">

            <img
              src="/images/TalentIQ_Logo.png"
              alt="TalentIQ"
            />

            <div>

              <strong>
                TalentIQ
              </strong>

              <p>
                AI-powered recruitment and talent management platform.
              </p>

            </div>

          </div>


          <div className="footer-links">

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/recruiter-dashboard"
                )
              }
            >
              Dashboard
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/recruiter/jobs/post"
                )
              }
            >
              Post Job
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/recruiter/jobs"
                )
              }
            >
              Manage Jobs
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/recruiter/applications"
                )
              }
            >
              Applications
            </button>

          </div>


          <div className="footer-bottom">

            © {new Date().getFullYear()} TalentIQ. All rights reserved.

          </div>

        </footer>

      </div>

    </main>

  );

};


export default RecruiterPostJob;