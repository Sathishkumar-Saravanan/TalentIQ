import React, { useEffect, useState } from "react";
import {
  FaBell,
  FaBriefcase,
  FaMapMarkerAlt,
  FaCode,
  FaClock,
  FaTrash,
  FaToggleOn,
  FaToggleOff,
  FaPlus,
  FaTimes,
  FaCheckCircle,
  FaChartLine,
} from "react-icons/fa";

import "../styles/JobAlerts.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const JobAlerts = () => {
  const [alerts, setAlerts] = useState([]);

  const [showModal, setShowModal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    keywords: "",
    location: "",
    jobType: "Any",
    skills: "",
    frequency: "Daily",
  });

  /* =========================================================
     TOKEN
  ========================================================= */

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("accessToken")
    );
  };

  /* =========================================================
     FETCH ALERTS
  ========================================================= */

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        setError("Please login to manage your job alerts.");
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/job-alerts`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to fetch job alerts"
        );
      }

      setAlerts(Array.isArray(data.alerts) ? data.alerts : []);
    } catch (err) {
      console.error("FETCH JOB ALERTS ERROR:", err);
      setError(err.message || "Unable to fetch job alerts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  /* =========================================================
     FORM CHANGE
  ========================================================= */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /* =========================================================
     CREATE ALERT
  ========================================================= */

  const handleCreateAlert = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const token = getToken();

    if (!token) {
      setError("Please login first.");
      return;
    }

    if (!formData.keywords.trim() && !formData.skills.trim()) {
      setError(
        "Please enter at least a job title, keyword, or skill."
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`${API_URL}/api/job-alerts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          keywords: formData.keywords.trim(),
          location: formData.location.trim(),
          jobType: formData.jobType,
          skills: formData.skills
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean),
          frequency: formData.frequency,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to create job alert"
        );
      }

      setAlerts((previous) => [
        data.alert,
        ...previous,
      ]);

      setFormData({
        keywords: "",
        location: "",
        jobType: "Any",
        skills: "",
        frequency: "Daily",
      });

      setShowModal(false);

      setSuccess("Your job alert has been created successfully.");

      setTimeout(() => {
        setSuccess("");
      }, 3500);
    } catch (err) {
      console.error("CREATE JOB ALERT ERROR:", err);
      setError(err.message || "Unable to create job alert");
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     TOGGLE ALERT
  ========================================================= */

  const toggleAlert = async (id) => {
    try {
      const token = getToken();

      if (!token) {
        setError("Please login first.");
        return;
      }

      const response = await fetch(
        `${API_URL}/api/job-alerts/${id}/toggle`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to update alert"
        );
      }

      setAlerts((previous) =>
        previous.map((alert) =>
          alert._id === id ? data.alert : alert
        )
      );

      setSuccess(data.message);

      setTimeout(() => {
        setSuccess("");
      }, 2500);
    } catch (err) {
      console.error("TOGGLE ALERT ERROR:", err);
      setError(err.message || "Unable to update alert");
    }
  };

  /* =========================================================
     DELETE ALERT
  ========================================================= */

  const deleteAlert = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this job alert?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const token = getToken();

      const response = await fetch(
        `${API_URL}/api/job-alerts/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to delete alert"
        );
      }

      setAlerts((previous) =>
        previous.filter((alert) => alert._id !== id)
      );

      setSuccess("Job alert deleted successfully.");

      setTimeout(() => {
        setSuccess("");
      }, 2500);
    } catch (err) {
      console.error("DELETE ALERT ERROR:", err);
      setError(err.message || "Unable to delete alert");
    }
  };

  /* =========================================================
     FORMAT DATE
  ========================================================= */

  const formatDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="job-alerts-page">

      {/* HERO */}

      <section className="job-alerts-hero">

        <div className="job-alerts-hero-content">

          <div className="job-alert-bell">
            <FaBell />
          </div>

          <span className="job-alerts-label">
            TALENTIQ JOB ALERTS
          </span>

          <h1>
            Never miss a <span>job</span>
          </h1>

          <p>
            Get notified when new jobs matching your
            profile are posted.
          </p>

          <button
            className="create-alert-main-button"
            onClick={() => {
              setError("");
              setShowModal(true);
            }}
          >
            <FaPlus />
            Create Job Alert
          </button>

        </div>

      </section>

      {/* CONTENT */}

      <main className="job-alerts-content">

        {error && (
          <div className="job-alert-message error-message">
            <span>!</span>
            {error}
          </div>
        )}

        {success && (
          <div className="job-alert-message success-message">
            <FaCheckCircle />
            {success}
          </div>
        )}

        {/* EXISTING ALERTS */}

        <section className="alerts-section">

          <div className="section-heading">

            <div>
              <h2>Your Job Alerts</h2>

              <p>
                Manage the jobs you want TalentIQ to
                watch for you.
              </p>
            </div>

            <button
              className="small-create-button"
              onClick={() => setShowModal(true)}
            >
              <FaPlus />
              New Alert
            </button>

          </div>

          {loading ? (
            <div className="alerts-loading">
              <div className="alerts-spinner"></div>
              <p>Loading your job alerts...</p>
            </div>
          ) : alerts.length === 0 ? (

            <div className="empty-alert-card">

              <div className="empty-alert-icon">
                <FaBell />
              </div>

              <h3>No job alerts yet</h3>

              <p>
                Create your first job alert and let
                TalentIQ help you discover relevant
                opportunities.
              </p>

              <button
                onClick={() => setShowModal(true)}
              >
                <FaPlus />
                Create Your First Alert
              </button>

            </div>

          ) : (

            <div className="alerts-list">

              {alerts.map((alert) => (

                <article
                  className={`job-alert-card ${
                    !alert.isActive ? "alert-disabled" : ""
                  }`}
                  key={alert._id}
                >

                  <div className="alert-card-icon">
                    <FaBell />
                  </div>

                  <div className="alert-card-content">

                    <div className="alert-card-top">

                      <div>

                        <h3>
                          {alert.keywords ||
                            "General Job Alert"}
                        </h3>

                        <span className="alert-status">
                          {alert.isActive
                            ? "Active"
                            : "Paused"}
                        </span>

                      </div>

                      <button
                        className="alert-toggle"
                        onClick={() =>
                          toggleAlert(alert._id)
                        }
                        title={
                          alert.isActive
                            ? "Pause alert"
                            : "Enable alert"
                        }
                      >
                        {alert.isActive ? (
                          <FaToggleOn />
                        ) : (
                          <FaToggleOff />
                        )}
                      </button>

                    </div>

                    <div className="alert-details">

                      {alert.location && (
                        <span>
                          <FaMapMarkerAlt />
                          {alert.location}
                        </span>
                      )}

                      <span>
                        <FaBriefcase />
                        {alert.jobType}
                      </span>

                      <span>
                        <FaClock />
                        {alert.frequency}
                      </span>

                    </div>

                    {alert.skills?.length > 0 && (
                      <div className="alert-skills">

                        <FaCode />

                        <div>
                          {alert.skills.map(
                            (skill, index) => (
                              <span key={index}>
                                {skill}
                              </span>
                            )
                          )}
                        </div>

                      </div>
                    )}

                    <div className="alert-card-footer">

                      <small>
                        Created{" "}
                        {formatDate(alert.createdAt)}
                      </small>

                      <button
                        className="delete-alert-button"
                        onClick={() =>
                          deleteAlert(alert._id)
                        }
                      >
                        <FaTrash />
                        Delete
                      </button>

                    </div>

                  </div>

                </article>

              ))}

            </div>

          )}

        </section>

        {/* TRENDING SKILLS */}

        <section className="trending-skills-section">

          <div className="trending-icon">
            <FaChartLine />
          </div>

          <div>

            <h2>Trending Skills</h2>

            <p>
              Add popular skills to your alerts to
              discover more relevant opportunities.
            </p>

          </div>

          <div className="trending-skills">

            <span>React</span>
            <span>JavaScript</span>
            <span>Node.js</span>
            <span>MongoDB</span>
            <span>Express.js</span>
            <span>Python</span>
            <span>Java</span>
            <span>TypeScript</span>

          </div>

        </section>

      </main>

      {/* CREATE ALERT MODAL */}

      {showModal && (

        <div
          className="job-alert-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
            }
          }}
        >

          <div className="job-alert-modal">

            <div className="modal-header">

              <div>
                <span className="modal-icon">
                  <FaBell />
                </span>

                <div>
                  <h2>Create Job Alert</h2>
                  <p>
                    Tell us what kind of jobs you want.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="close-modal-button"
              >
                <FaTimes />
              </button>

            </div>

            <form
              className="job-alert-form"
              onSubmit={handleCreateAlert}
            >

              {/* KEYWORDS */}

              <div className="alert-form-group">

                <label>
                  Job Title / Keywords
                </label>

                <div className="alert-input-wrapper">

                  <FaBriefcase />

                  <input
                    type="text"
                    name="keywords"
                    value={formData.keywords}
                    onChange={handleChange}
                    placeholder="e.g. Frontend Developer"
                  />

                </div>

              </div>

              {/* LOCATION */}

              <div className="alert-form-group">

                <label>Location</label>

                <div className="alert-input-wrapper">

                  <FaMapMarkerAlt />

                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g. Bangalore, Chennai or Remote"
                  />

                </div>

              </div>

              {/* JOB TYPE */}

              <div className="alert-form-row">

                <div className="alert-form-group">

                  <label>Job Type</label>

                  <div className="alert-input-wrapper">

                    <FaBriefcase />

                    <select
                      name="jobType"
                      value={formData.jobType}
                      onChange={handleChange}
                    >
                      <option value="Any">Any</option>
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
                      <option value="Remote">
                        Remote
                      </option>
                    </select>

                  </div>

                </div>

                <div className="alert-form-group">

                  <label>Frequency</label>

                  <div className="alert-input-wrapper">

                    <FaClock />

                    <select
                      name="frequency"
                      value={formData.frequency}
                      onChange={handleChange}
                    >
                      <option value="Instant">
                        Instant
                      </option>
                      <option value="Daily">
                        Daily
                      </option>
                      <option value="Weekly">
                        Weekly
                      </option>
                    </select>

                  </div>

                </div>

              </div>

              {/* SKILLS */}

              <div className="alert-form-group">

                <label>
                  Skills
                  <span>comma separated</span>
                </label>

                <div className="alert-input-wrapper">

                  <FaCode />

                  <input
                    type="text"
                    name="skills"
                    value={formData.skills}
                    onChange={handleChange}
                    placeholder="React, JavaScript, Node.js"
                  />

                </div>

              </div>

              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-alert-button"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-alert-button"
                  disabled={saving}
                >

                  {saving ? (
                    <>
                      <span className="button-spinner"></span>
                      Creating...
                    </>
                  ) : (
                    <>
                      <FaBell />
                      Create Alert
                    </>
                  )}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
};

export default JobAlerts;