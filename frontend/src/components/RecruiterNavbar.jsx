import React, { useState } from "react";
import {
  NavLink,
  Link,
  useNavigate,
} from "react-router-dom";

import {
  FiHome,
  FiBriefcase,
  FiPlusCircle,
  FiFileText,
  FiUsers,
  FiUser,
  FiLogOut,
  FiMenu,
  FiX,
} from "react-icons/fi";

import "../styles/recruiterNavbar.css";

const RecruiterNavbar = () => {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);

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
  // CLOSE MOBILE MENU
  // ============================================================

  const closeMenu = () => {
    setMenuOpen(false);
  };

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("accessToken");

    localStorage.removeItem("user");
    localStorage.removeItem("role");
    localStorage.removeItem("userRole");

    localStorage.removeItem("rememberMe");

    closeMenu();

    navigate("/login", {
      replace: true,
    });
  };

  // ============================================================
  // PROTECT NAVBAR
  // ============================================================

  const token = getToken();

  /*
   * If the recruiter token does not exist,
   * do not show recruiter navigation.
   *
   * App.jsx / ProtectedRoute should normally handle this,
   * but this is an additional safety check.
   */

  if (!token) {
    return null;
  }

  // ============================================================
  // NAV LINK CLASS
  // ============================================================

  const getNavLinkClass = ({ isActive }) => {
    return isActive
      ? "recruiter-nav-link active"
      : "recruiter-nav-link";
  };

  // ============================================================
  // JSX
  // ============================================================

  return (
    <nav className="recruiter-navbar">

      {/* ======================================================
          LEFT - BRAND
      ======================================================= */}

      <div className="recruiter-navbar-brand">

        <Link
          to="/home"
          className="recruiter-brand"
          onClick={closeMenu}
        >
          <div className="recruiter-logo-box">

            <img
              src="/images/TalentIQ_Logo.png"
              alt="TalentIQ"
            />

          </div>

          <div className="recruiter-brand-name">
            Talent<span>IQ</span>
          </div>
        </Link>

      </div>

      {/* ======================================================
          NAVIGATION LINKS
      ======================================================= */}

      <div
        className={`recruiter-navbar-links ${
          menuOpen ? "open" : ""
        }`}
      >

        {/* DASHBOARD */}

        <NavLink
          to="/recruiter-dashboard"
          className={getNavLinkClass}
          onClick={closeMenu}
          end
        >
          <FiHome />

          <span>
            Dashboard
          </span>
        </NavLink>

        {/* MANAGE JOBS */}

        <NavLink
          to="/recruiter/jobs"
          className={getNavLinkClass}
          onClick={closeMenu}
        >
          <FiBriefcase />

          <span>
            Manage Jobs
          </span>
        </NavLink>

        {/* POST JOBS */}

        <NavLink
          to="/recruiter/jobs/post"
          className={getNavLinkClass}
          onClick={closeMenu}
        >
          <FiPlusCircle />

          <span>
            Post Jobs
          </span>
        </NavLink>

        {/* APPLICATIONS */}

        <NavLink
          to="/recruiter/applications"
          className={getNavLinkClass}
          onClick={closeMenu}
        >
          <FiFileText />

          <span>
            Applications
          </span>
        </NavLink>

        {/* CANDIDATES */}

        <NavLink
          to="/recruiter/candidates"
          className={getNavLinkClass}
          onClick={closeMenu}
        >
          <FiUsers />

          <span>
            Candidates
          </span>
        </NavLink>

      </div>

      {/* ======================================================
          RIGHT SIDE
      ======================================================= */}

      <div className="recruiter-navbar-actions">

        {/* PROFILE */}

        <Link
          to="/recruiter/profile"
          className="recruiter-profile-button"
          onClick={closeMenu}
        >
          <FiUser />

          <span>
            Profile
          </span>
        </Link>

        {/* LOGOUT */}

        <button
          type="button"
          className="recruiter-logout-button"
          onClick={handleLogout}
        >
          <FiLogOut />

          <span>
            Logout
          </span>
        </button>

      </div>

      {/* ======================================================
          MOBILE MENU BUTTON
      ======================================================= */}

      <button
        type="button"
        className="recruiter-mobile-menu"
        onClick={() =>
          setMenuOpen((previous) => !previous)
        }
        aria-label="Toggle recruiter navigation"
        aria-expanded={menuOpen}
      >
        {menuOpen ? (
          <FiX />
        ) : (
          <FiMenu />
        )}
      </button>

    </nav>
  );
};

export default RecruiterNavbar;