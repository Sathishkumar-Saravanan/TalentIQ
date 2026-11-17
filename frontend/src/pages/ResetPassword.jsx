import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaLock,
  FaCheckCircle,
  FaShieldAlt,
} from "react-icons/fa";
import "../styles/resetPassword.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const ResetPassword = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const storedEmail = sessionStorage.getItem(
      "talentiq_reset_email"
    );

    const storedToken = sessionStorage.getItem(
      "talentiq_reset_token"
    );

    if (!storedEmail || !storedToken) {
      navigate("/forgot-password");
      return;
    }

    setEmail(storedEmail);
    setResetToken(storedToken);
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!password) {
      setError("Please enter a new password.");
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must contain at least 6 characters."
      );
      return;
    }

    if (!confirmPassword) {
      setError("Please confirm your new password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/auth/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            resetToken,
            password,
          }),
        }
      );

      const data = await response.json();

      console.log("Reset password response:", data);

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to reset your password."
        );
      }

      sessionStorage.removeItem(
        "talentiq_reset_email"
      );

      sessionStorage.removeItem(
        "talentiq_reset_token"
      );

      setPassword("");
      setConfirmPassword("");

      setSuccess(
        "Password reset successfully. Redirecting to sign in..."
      );

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err) {
      console.error("Reset password error:", err);

      setError(
        err.message ||
          "Unable to connect to TalentIQ server."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-page">

      {/* LEFT */}
      <section className="reset-left">

        <div className="reset-bubbles">
          <span className="reset-bubble reset-bubble-one"></span>
          <span className="reset-bubble reset-bubble-two"></span>
          <span className="reset-bubble reset-bubble-three"></span>
          <span className="reset-bubble reset-bubble-four"></span>
        </div>

        <div className="reset-left-content">

          <Link to="/" className="reset-brand">

            <div className="reset-logo-box">
              <img
                src="/images/TalentIQ_Logo.png"
                alt="TalentIQ"
              />
            </div>

            <span>
              Talent<span>IQ</span>
            </span>

          </Link>

          <span className="reset-badge">
            SECURE PASSWORD RESET
          </span>

          <h1>
            Create a new
            <span> password.</span>
          </h1>

          <p>
            Choose a strong password to protect your
            TalentIQ account and continue your career journey.
          </p>

          <div className="reset-info">

            <div className="reset-info-item">
              <FaCheckCircle />
              <span>Password will be securely hashed</span>
            </div>

            <div className="reset-info-item">
              <FaCheckCircle />
              <span>Your existing account remains unchanged</span>
            </div>

            <div className="reset-info-item">
              <FaCheckCircle />
              <span>You'll sign in with your new password</span>
            </div>

          </div>

        </div>
      </section>

      {/* RIGHT */}
      <section className="reset-right">

        <div className="reset-card">

          <Link
            to="/login"
            className="reset-back"
          >
            <FaArrowLeft />
            Back to Sign in
          </Link>

          <div className="reset-header">

            <div className="reset-header-icon">
              <FaLock />
            </div>

            <span>
              RESET PASSWORD
            </span>

            <h2>
              Create a new password
            </h2>

            <p>
              Enter a new password for:
            </p>

            <strong className="reset-email">
              {email}
            </strong>

          </div>

          {error && (
            <div className="reset-error">
              <span>!</span>
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="reset-success">
              <FaCheckCircle />
              <p>{success}</p>
            </div>
          )}

          <form
            className="reset-form"
            onSubmit={handleSubmit}
          >

            {/* PASSWORD */}
            <div className="reset-form-group">

              <label htmlFor="new-password">
                New Password
              </label>

              <div className="reset-input-wrapper">

                <span className="reset-input-icon">
                  <FaLock />
                </span>

                <input
                  id="new-password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Enter your new password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  autoComplete="new-password"
                  disabled={loading}
                />

                <button
                  type="button"
                  className="reset-toggle"
                  onClick={() =>
                    setShowPassword(
                      (previous) => !previous
                    )
                  }
                  disabled={loading}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>

              </div>

            </div>

            {/* CONFIRM PASSWORD */}
            <div className="reset-form-group">

              <label htmlFor="confirm-password">
                Confirm New Password
              </label>

              <div className="reset-input-wrapper">

                <span className="reset-input-icon">
                  <FaLock />
                </span>

                <input
                  id="confirm-password"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(
                      e.target.value
                    );
                    setError("");
                  }}
                  autoComplete="new-password"
                  disabled={loading}
                />

                <button
                  type="button"
                  className="reset-toggle"
                  onClick={() =>
                    setShowConfirmPassword(
                      (previous) => !previous
                    )
                  }
                  disabled={loading}
                >
                  {showConfirmPassword
                    ? "Hide"
                    : "Show"}
                </button>

              </div>

            </div>

            <button
              type="submit"
              className="reset-submit"
              disabled={loading}
            >

              {loading ? (
                <>
                  <span className="reset-spinner"></span>
                  <span>Updating password...</span>
                </>
              ) : (
                <>
                  <span>Reset Password</span>
                  <span>→</span>
                </>
              )}

            </button>

          </form>

          <div className="reset-login">
            <span>
              Remember your password?
            </span>

            <Link to="/login">
              Sign in
            </Link>
          </div>

          <div className="reset-security">
            <FaShieldAlt />
            <span>
              Your password is securely protected.
            </span>
          </div>

        </div>

      </section>

    </div>
  );
};

export default ResetPassword;