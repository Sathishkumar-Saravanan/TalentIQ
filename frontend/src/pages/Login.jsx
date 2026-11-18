```jsx
import React, { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import API from "../services/api";

import "../styles/login.css";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ============================================================
  // FORM
  // ============================================================

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // ============================================================
  // UI STATE
  // ============================================================

  const [showPassword, setShowPassword] = useState(false);

  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  // ============================================================
  // CLEAR OLD AUTH DATA
  // ============================================================

  const clearAuthData = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
  };

  // ============================================================
  // GET USER ROLE
  // ============================================================

  const getUserRole = (user) => {
    if (!user) {
      return "";
    }

    const role =
      user?.role ??
      user?.accountType ??
      user?.userRole ??
      user?.type ??
      "";

    return String(role).trim().toLowerCase();
  };

  // ============================================================
  // GET TOKEN FROM RESPONSE
  // ============================================================

  const getTokenFromResponse = (data) => {
    return (
      data?.token ||
      data?.accessToken ||
      data?.data?.token ||
      data?.data?.accessToken ||
      data?.result?.token ||
      data?.result?.accessToken ||
      ""
    );
  };

  // ============================================================
  // GET USER FROM RESPONSE
  // ============================================================

  const getUserFromResponse = (data) => {
    return (
      data?.user ||
      data?.data?.user ||
      data?.result?.user ||
      data?.account ||
      data?.data?.account ||
      null
    );
  };

  // ============================================================
  // AFTER REGISTRATION
  // ============================================================

  useEffect(() => {
    if (location.state?.registered) {
      setSuccess(
        "Account created successfully. Please sign in."
      );

      if (location.state?.email) {
        setFormData((previous) => ({
          ...previous,
          email: location.state.email,
        }));
      }

      // Clear React Router navigation state
      navigate(location.pathname, {
        replace: true,
        state: {},
      });
    }
  }, [location, navigate]);

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
  };

  // ============================================================
  // REDIRECT BASED ON ROLE
  // ============================================================

  const redirectByRole = (role) => {
    console.log("========================================");
    console.log("TALENTIQ ROLE BASED REDIRECT");
    console.log("========================================");

    console.log("Authenticated role:", role);

    // ==========================================================
    // RECRUITER
    // ==========================================================

    if (role === "recruiter") {
      console.log("Redirecting to RECRUITER dashboard");

      navigate("/recruiter-dashboard", {
        replace: true,
      });

      return;
    }

    // ==========================================================
    // CANDIDATE
    // ==========================================================

    if (role === "candidate") {
      console.log("Redirecting to CANDIDATE dashboard");

      navigate("/dashboard", {
        replace: true,
      });

      return;
    }

    // ==========================================================
    // UNKNOWN
    // ==========================================================

    console.error("Unknown TalentIQ account role:", role);

    setError(
      "Your account role is invalid. Please contact support."
    );
  };

  // ============================================================
  // LOGIN SUBMIT
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent duplicate requests
    if (loading) {
      return;
    }

    setError("");
    setSuccess("");

    // ==========================================================
    // CLEAN INPUT
    // ==========================================================

    const email = formData.email.trim().toLowerCase();

    const password = formData.password;

    // ==========================================================
    // VALIDATION
    // ==========================================================

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoading(true);

      console.log("========================================");
      console.log("TALENTIQ LOGIN REQUEST");
      console.log("========================================");

      console.log("Email:", email);

      // ========================================================
      // LOGIN API - SHARED AXIOS INSTANCE
      // ========================================================

      const response = await API.post("/auth/login", {
        email,
        password,
      });

      const data = response.data;

      console.log("LOGIN API RESPONSE:", data);

      // ========================================================
      // EXTRACT TOKEN
      // ========================================================

      const token = getTokenFromResponse(data);

      // ========================================================
      // EXTRACT USER
      // ========================================================

      const user = getUserFromResponse(data);

      console.log("TOKEN RECEIVED:", Boolean(token));
      console.log("USER RECEIVED:", user);

      // ========================================================
      // TOKEN VALIDATION
      // ========================================================

      if (!token) {
        throw new Error(
          "Login successful, but authentication token was not received from the server."
        );
      }

      // ========================================================
      // USER VALIDATION
      // ========================================================

      if (!user) {
        throw new Error(
          "Login successful, but user information was not received from the server."
        );
      }

      // ========================================================
      // NORMALIZE ROLE
      // ========================================================

      const role = getUserRole(user);

      console.log("NORMALIZED USER ROLE:", role);

      // ========================================================
      // ROLE VALIDATION
      // ========================================================

      if (
        role !== "candidate" &&
        role !== "recruiter"
      ) {
        console.error(
          "Invalid role received from backend:",
          {
            role: user?.role,
            accountType: user?.accountType,
            userRole: user?.userRole,
            type: user?.type,
            completeUser: user,
          }
        );

        throw new Error(
          "Your account has an invalid role. Please contact support."
        );
      }

      // ========================================================
      // CLEAR OLD USER AUTHENTICATION BEFORE SAVING
      // ========================================================

      clearAuthData();

      // ========================================================
      // SAVE TOKEN
      // ========================================================

      localStorage.setItem("token", token);
      localStorage.setItem("authToken", token);
      localStorage.setItem("accessToken", token);

      // ========================================================
      // CREATE CLEAN USER OBJECT
      // ========================================================

      const authenticatedUser = {
        ...user,
        role: role,
      };

      // ========================================================
      // SAVE USER
      // ========================================================

      localStorage.setItem(
        "user",
        JSON.stringify(authenticatedUser)
      );

      // ========================================================
      // SAVE ROLE
      // ========================================================

      localStorage.setItem("role", role);

      // ========================================================
      // REMEMBER ME
      // ========================================================

      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("rememberMe");
      }

      // ========================================================
      // DEBUG AUTH DATA
      // ========================================================

      console.log("========================================");
      console.log("TALENTIQ AUTHENTICATION SAVED");
      console.log("========================================");

      console.log("Role:", localStorage.getItem("role"));

      console.log(
        "User:",
        JSON.parse(localStorage.getItem("user"))
      );

      console.log(
        "Token:",
        Boolean(localStorage.getItem("token"))
      );

      // ========================================================
      // TELL NAVBAR THAT AUTHENTICATION CHANGED
      // ========================================================

      window.dispatchEvent(new Event("authChanged"));

      // ========================================================
      // SMALL DELAY
      // ========================================================

      await new Promise((resolve) =>
        setTimeout(resolve, 100)
      );

      // ========================================================
      // ROLE BASED REDIRECT
      // ========================================================

      redirectByRole(role);

    } catch (err) {
      console.error("========================================");
      console.error("TALENTIQ LOGIN ERROR");
      console.error("========================================");

      console.error(err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Unable to login. Please check your credentials and try again."
      );

    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // JSX
  // ============================================================

  return (
    <div className="login-page">

      {/* ======================================================
          LEFT SECTION
      ======================================================= */}

      <div className="login-left">

        <div className="login-brand">

          <Link
            to="/"
            className="login-logo"
          >

            <div className="login-logo-image">

              <img
                src="/images/TalentIQ_Logo.png"
                alt="TalentIQ Logo"
              />

            </div>

            <span>
              Talent<span>IQ</span>
            </span>

          </Link>

        </div>

        <div className="login-intro">

          <span className="login-badge">
            AI-POWERED RECRUITMENT
          </span>

          <h1>
            Welcome back
            <br />
            to <span>TalentIQ.</span>
          </h1>

          <p>
            Sign in to discover opportunities,
            manage your applications and get
            AI-powered job recommendations.
          </p>

        </div>

        <div className="login-features">

          <div className="login-feature">

            <span>✨</span>

            <div>

              <strong>
                AI Job Matching
              </strong>

              <p>
                Find jobs that match your
                skills and career goals.
              </p>

            </div>

          </div>

          <div className="login-feature">

            <span>📄</span>

            <div>

              <strong>
                Smart Resume Analysis
              </strong>

              <p>
                Improve your resume with
                AI-powered insights.
              </p>

            </div>

          </div>

          <div className="login-feature">

            <span>🎯</span>

            <div>

              <strong>
                Personalized Opportunities
              </strong>

              <p>
                Discover opportunities
                built for you.
              </p>

            </div>

          </div>

        </div>

      </div>

      {/* ======================================================
          RIGHT SECTION
      ======================================================= */}

      <div className="login-right">

        <div className="login-card">

          <div className="login-card-header">

            <h2>
              Sign in
            </h2>

            <p>
              Enter your credentials to access
              your TalentIQ account.
            </p>

          </div>

          {/* ==================================================
              ERROR
          =================================================== */}

          {error && (
            <div
              className="login-error"
              role="alert"
            >

              <span>
                ⚠
              </span>

              <span>
                {error}
              </span>

            </div>
          )}

          {/* ==================================================
              SUCCESS
          =================================================== */}

          {success && (
            <div
              className="login-success"
              role="status"
            >

              <span>
                ✓
              </span>

              <span>
                {success}
              </span>

            </div>
          )}

          {/* ==================================================
              FORM
          =================================================== */}

          <form
            className="login-form"
            onSubmit={handleSubmit}
            noValidate
          >

            {/* =================================================
                EMAIL
            ================================================== */}

            <div className="form-group">

              <label htmlFor="email">
                Email Address
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  👤
                </span>

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  disabled={loading}
                  required
                />

              </div>

            </div>

            {/* =================================================
                PASSWORD
            ================================================== */}

            <div className="form-group">

              <label htmlFor="password">
                Password
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  🔒
                </span>

                <input
                  id="password"
                  name="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  disabled={loading}
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword((previous) => !previous)
                  }
                  disabled={loading}
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? "Hide" : "Show"}
                </button>

              </div>

            </div>

            {/* =================================================
                OPTIONS
            ================================================== */}

            <div className="login-options">

              <label className="remember-me">

                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) =>
                    setRememberMe(e.target.checked)
                  }
                  disabled={loading}
                />

                <span>
                  Remember me
                </span>

              </label>

              <Link to="/forgot-password">
                Forgot password?
              </Link>

            </div>

            {/* =================================================
                LOGIN BUTTON
            ================================================== */}

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >

              {loading ? (
                <>
                  <span className="login-spinner"></span>

                  <span>
                    Signing in...
                  </span>
                </>
              ) : (
                <>
                  <span>
                    Sign In
                  </span>

                  <span>
                    →
                  </span>
                </>
              )}

            </button>

          </form>

          {/* ==================================================
              REGISTER
          =================================================== */}

          <div className="register-link">

            <span>
              Don't have an account?
            </span>

            <Link to="/register">
              Create an account
            </Link>

          </div>

          {/* ==================================================
              SECURITY
          =================================================== */}

          <div className="login-security">

            <span>
              🔒
            </span>

            <span>
              Your information is securely protected.
            </span>

          </div>

        </div>

      </div>

    </div>
  );
};

export default Login;
```
