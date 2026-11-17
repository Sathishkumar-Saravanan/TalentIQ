import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  FiUser,
  FiAtSign,
  FiMail,
  FiBriefcase,
  FiLock,
  FiShield,
  FiCheckCircle,
  FiAlertCircle,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiUsers,
  FiCpu,
  FiSearch,
} from "react-icons/fi";

import "../styles/register.css";

const API_BASE_URL = "http://localhost:5000";

const Register = () => {
  const navigate = useNavigate();

  // ============================================================
  // FORM STATE
  // ============================================================

  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    role: "candidate",
    password: "",
    confirmPassword: "",
  });

  // ============================================================
  // UI STATE
  // ============================================================

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ============================================================
  // INPUT CHANGE
  // ============================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  // ============================================================
  // VALIDATION
  // ============================================================

  const validateForm = () => {
    const fullName = formData.fullName.trim();
    const username = formData.username.trim();
    const email = formData.email.trim().toLowerCase();

    if (!fullName) {
      return "Please enter your full name.";
    }

    if (fullName.length < 2) {
      return "Full name must contain at least 2 characters.";
    }

    if (!username) {
      return "Please choose a username.";
    }

    if (username.length < 3) {
      return "Username must contain at least 3 characters.";
    }

    if (!email) {
      return "Please enter your email address.";
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return "Please enter a valid email address.";
    }

    if (
      formData.role !== "candidate" &&
      formData.role !== "recruiter"
    ) {
      return "Please select Candidate or Recruiter.";
    }

    if (!formData.password) {
      return "Please create a password.";
    }

    if (formData.password.length < 6) {
      return "Password must contain at least 6 characters.";
    }

    if (!formData.confirmPassword) {
      return "Please confirm your password.";
    }

    if (formData.password !== formData.confirmPassword) {
      return "Passwords do not match.";
    }

    return "";
  };

  // ============================================================
  // REGISTER
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) {
      return;
    }

    setError("");
    setSuccess("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);

      const requestBody = {
        fullName: formData.fullName.trim(),

        username: formData.username.trim(),

        email: formData.email.trim().toLowerCase(),

        role: formData.role,

        password: formData.password,
      };

      console.log("=================================");
      console.log("REGISTER REQUEST");
      console.log("=================================");
      console.log(requestBody);

      const response = await fetch(
        `${API_BASE_URL}/api/auth/register`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(requestBody),
        }
      );

      // ========================================================
      // READ RESPONSE SAFELY
      // ========================================================

      const contentType = response.headers.get("content-type");

      let data = {};

      if (
        contentType &&
        contentType.includes("application/json")
      ) {
        data = await response.json();
      } else {
        const text = await response.text();

        console.error("Server returned:", text);

        throw new Error(
          "Server returned an invalid response."
        );
      }

      console.log("REGISTER RESPONSE:");
      console.log(data);

      // ========================================================
      // BACKEND ERROR
      // ========================================================

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Unable to create account."
        );
      }

      // ========================================================
      // IMPORTANT
      //
      // DO NOT SAVE TOKEN HERE
      //
      // Registration is NOT login.
      //
      // After registration:
      //
      // Register
      //    ↓
      // Login
      //    ↓
      // Check role
      //    ↓
      // Candidate Dashboard / Recruiter Dashboard
      // ========================================================

      setSuccess(
        "Account created successfully. Redirecting to login..."
      );

      // Remove old authentication information just in case
      localStorage.removeItem("token");
      localStorage.removeItem("authToken");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      localStorage.removeItem("role");

      // ========================================================
      // REDIRECT TO LOGIN
      // ========================================================

      setTimeout(() => {
        navigate("/login", {
          replace: true,
          state: {
            registered: true,
            email: formData.email.trim().toLowerCase(),
          },
        });
      }, 1000);
    } catch (err) {
      console.error("REGISTER ERROR:", err);

      setError(
        err?.message ||
          "Something went wrong while creating your account."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // JSX
  // ============================================================

  return (
    <div className="register-page">

      {/* ======================================================
          LEFT SECTION
      ======================================================= */}

      <section className="register-left">

        <div className="register-bubbles register-bubbles-top">
          <span className="bubble bubble-1"></span>
          <span className="bubble bubble-2"></span>
          <span className="bubble bubble-3"></span>
          <span className="bubble bubble-4"></span>
        </div>

        <div className="register-bubbles register-bubbles-bottom">
          <span className="bubble bubble-5"></span>
          <span className="bubble bubble-6"></span>
          <span className="bubble bubble-7"></span>
          <span className="bubble bubble-8"></span>
        </div>

        <div className="register-left-content">

          {/* BRAND */}

          <div className="register-brand">

            <Link
              to="/"
              className="register-logo"
            >
              <span className="register-logo-image">
                <img
                  src="/images/TalentIQ_Logo.png"
                  alt="TalentIQ"
                />
              </span>

              <h2 className="register-logo-text">
                Talent<span>IQ</span>
              </h2>
            </Link>

          </div>

          {/* INTRO */}

          <div className="register-intro">

            <span className="register-badge">
              AI-POWERED CAREER PLATFORM
            </span>

            <h1>
              Build your
              <span> career</span>
              {" "}with confidence.
            </h1>

            <p>
              Join TalentIQ and use AI-powered
              tools to discover relevant jobs,
              improve your resume, and take the
              next step in your career.
            </p>

          </div>

          {/* FEATURES */}

          <div className="register-features">

            <div className="register-feature">

              <div className="feature-icon">
                <FiCpu />
              </div>

              <div className="feature-content">

                <strong>
                  AI-Powered Job Recommendations
                </strong>

                <p>
                  Discover job opportunities based
                  on your skills, profile, and career goals.
                </p>

              </div>

            </div>

            <div className="register-feature">

              <div className="feature-icon">
                <FiSearch />
              </div>

              <div className="feature-content">

                <strong>
                  Smarter Job Search
                </strong>

                <p>
                  Search and explore relevant
                  opportunities through a personalized experience.
                </p>

              </div>

            </div>

            <div className="register-feature">

              <div className="feature-icon">
                <FiUsers />
              </div>

              <div className="feature-content">

                <strong>
                  Candidate & Recruiter Accounts
                </strong>

                <p>
                  Select the right account type and
                  access features designed for your role.
                </p>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ======================================================
          RIGHT SECTION
      ======================================================= */}

      <section className="register-right">

        <div className="register-card">

          {/* HEADER */}

          <div className="register-card-header">

            <span className="form-kicker">
              GET STARTED
            </span>

            <h2>
              Create an account
            </h2>

            <p>
              Join TalentIQ and start your journey.
            </p>

          </div>

          {/* ERROR */}

          {error && (
            <div
              className="register-message register-error"
              role="alert"
            >
              <FiAlertCircle size={18} />

              <span>
                {error}
              </span>
            </div>
          )}

          {/* SUCCESS */}

          {success && (
            <div
              className="register-message register-success"
              role="status"
            >
              <FiCheckCircle size={18} />

              <span>
                {success}
              </span>
            </div>
          )}

          {/* FORM */}

          <form
            className="register-form"
            onSubmit={handleSubmit}
          >

            {/* FULL NAME */}

            <div className="form-group">

              <label htmlFor="fullName">
                Full Name
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  <FiUser />
                </span>

                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  disabled={loading}
                />

              </div>

            </div>

            {/* USERNAME */}

            <div className="form-group">

              <label htmlFor="username">
                Username
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  <FiAtSign />
                </span>

                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Choose a username"
                  autoComplete="username"
                  disabled={loading}
                />

              </div>

            </div>

            {/* EMAIL */}

            <div className="form-group">

              <label htmlFor="email">
                Email Address
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  <FiMail />
                </span>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  autoComplete="email"
                  disabled={loading}
                />

              </div>

            </div>

            {/* ROLE */}

            <div className="form-group">

              <label htmlFor="role">
                Account Type
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  <FiBriefcase />
                </span>

                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  disabled={loading}
                >

                  <option value="candidate">
                    Candidate
                  </option>

                  <option value="recruiter">
                    Recruiter
                  </option>

                </select>

              </div>

            </div>

            {/* PASSWORD */}

            <div className="form-group">

              <label htmlFor="password">
                Password
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  <FiLock />
                </span>

                <input
                  id="password"
                  name="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  disabled={loading}
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (previous) => !previous
                    )
                  }
                  disabled={loading}
                >
                  {showPassword ? (
                    <FiEyeOff />
                  ) : (
                    <FiEye />
                  )}

                  <span>
                    {showPassword
                      ? "Hide"
                      : "Show"}
                  </span>
                </button>

              </div>

            </div>

            {/* CONFIRM PASSWORD */}

            <div className="form-group">

              <label htmlFor="confirmPassword">
                Confirm Password
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  <FiLock />
                </span>

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  disabled={loading}
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowConfirmPassword(
                      (previous) => !previous
                    )
                  }
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <FiEyeOff />
                  ) : (
                    <FiEye />
                  )}

                  <span>
                    {showConfirmPassword
                      ? "Hide"
                      : "Show"}
                  </span>
                </button>

              </div>

            </div>

            {/* REGISTER BUTTON */}

            <button
              type="submit"
              className="register-button"
              disabled={loading}
            >

              {loading ? (
                <>
                  <span className="register-spinner"></span>

                  <span>
                    Creating account...
                  </span>
                </>
              ) : (
                <>
                  <span>
                    Create Account
                  </span>

                  <FiArrowRight size={18} />
                </>
              )}

            </button>

          </form>

          {/* LOGIN LINK */}

          <div className="login-link">

            <span>
              Already have an account?
            </span>

            <Link to="/login">
              Sign in
            </Link>

          </div>

          {/* SECURITY */}

          <div className="register-security">

            <FiShield size={13} />

            <span>
              Your account information is securely protected.
            </span>

          </div>

        </div>

      </section>

    </div>
  );
};

export default Register;