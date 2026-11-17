import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaEnvelope,
  FaLock,
  FaCheckCircle,
  FaShieldAlt,
} from "react-icons/fa";
import "../styles/forgotPassword.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setEmail(e.target.value);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Please enter your registered email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/auth/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: normalizedEmail,
          }),
        }
      );

      const data = await response.json();

      console.log("Forgot password response:", data);

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to process your password reset request."
        );
      }

      /*
       * DEVELOPMENT FLOW
       *
       * The backend returns resetToken during local development.
       * In production, this token should be sent through email instead.
       */
      if (data.resetToken) {
        sessionStorage.setItem(
          "talentiq_reset_email",
          normalizedEmail
        );

        sessionStorage.setItem(
          "talentiq_reset_token",
          data.resetToken
        );

        setSuccess(
          "Email verified. Redirecting to reset your password..."
        );

        setTimeout(() => {
          navigate("/reset-password");
        }, 900);

        return;
      }

      setSuccess(
        data.message ||
          "If the email is registered, password reset instructions have been sent."
      );
    } catch (err) {
      console.error("Forgot password error:", err);

      setError(
        err.message ||
          "Unable to connect to TalentIQ server."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-page">

      {/* LEFT SIDE */}
      <section className="forgot-left">

        <div className="forgot-bubbles">
          <span className="bubble bubble-one"></span>
          <span className="bubble bubble-two"></span>
          <span className="bubble bubble-three"></span>
          <span className="bubble bubble-four"></span>
          <span className="bubble bubble-five"></span>
        </div>

        <div className="forgot-left-content">

          <Link to="/" className="forgot-brand">

            <div className="forgot-logo-box">
              <img
                src="/images/TalentIQ_Logo.png"
                alt="TalentIQ"
              />
            </div>

            <span className="forgot-brand-text">
              Talent<span>IQ</span>
            </span>

          </Link>

          <span className="forgot-badge">
            ACCOUNT RECOVERY
          </span>

          <h1>
            Get back to your
            <span> TalentIQ.</span>
          </h1>

          <p>
            Don't worry if you've forgotten your password.
            Enter your registered email address and we'll
            help you securely regain access to your account.
          </p>

          <div className="forgot-features">

            <div className="forgot-feature">
              <div className="forgot-feature-icon">
                <FaEnvelope />
              </div>

              <div>
                <strong>Verify Your Email</strong>
                <span>
                  Use the email address connected to your
                  TalentIQ account.
                </span>
              </div>
            </div>

            <div className="forgot-feature">
              <div className="forgot-feature-icon">
                <FaLock />
              </div>

              <div>
                <strong>Create a New Password</strong>
                <span>
                  Set a secure new password for your account.
                </span>
              </div>
            </div>

            <div className="forgot-feature">
              <div className="forgot-feature-icon">
                <FaShieldAlt />
              </div>

              <div>
                <strong>Secure Account Recovery</strong>
                <span>
                  Your password is securely hashed before
                  being stored.
                </span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* RIGHT SIDE */}
      <section className="forgot-right">

        <div className="forgot-card">

          <Link
            to="/login"
            className="forgot-back-link"
          >
            <FaArrowLeft />
            Back to Sign in
          </Link>

          <div className="forgot-card-header">

            <div className="forgot-card-icon">
              <FaLock />
            </div>

            <span className="forgot-card-kicker">
              ACCOUNT RECOVERY
            </span>

            <h2>
              Forgot your password?
            </h2>

            <p>
              Enter the email address registered with
              your TalentIQ account.
            </p>

          </div>

          {error && (
            <div className="forgot-message forgot-error">
              <span>!</span>
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="forgot-message forgot-success">
              <FaCheckCircle />
              <p>{success}</p>
            </div>
          )}

          <form
            className="forgot-form"
            onSubmit={handleSubmit}
          >

            <div className="forgot-form-group">

              <label htmlFor="forgot-email">
                Registered Email Address
              </label>

              <div className="forgot-input-wrapper">

                <span className="forgot-input-icon">
                  <FaEnvelope />
                </span>

                <input
                  id="forgot-email"
                  name="email"
                  type="email"
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={handleChange}
                  autoComplete="email"
                  disabled={loading}
                />

              </div>

            </div>

            <button
              type="submit"
              className="forgot-submit-button"
              disabled={loading}
            >

              {loading ? (
                <>
                  <span className="forgot-spinner"></span>
                  <span>Checking account...</span>
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <span className="forgot-arrow">
                    →
                  </span>
                </>
              )}

            </button>

          </form>

          <div className="forgot-login">
            <span>
              Remember your password?
            </span>

            <Link to="/login">
              Sign in
            </Link>
          </div>

          <div className="forgot-security">

            <FaShieldAlt />

            <span>
              Your account information is securely protected.
            </span>

          </div>

        </div>

      </section>

    </div>
  );
};

export default ForgotPassword;