import React, { useEffect, useState } from "react";
import {
    Link,
    NavLink,
    useLocation,
    useNavigate,
} from "react-router-dom";

import "../styles/navbar.css";

const Navbar = ({
    role = "",
    isAuthenticated = false,
    user = null,
}) => {

    const navigate = useNavigate();
    const location = useLocation();

    const [menuOpen, setMenuOpen] = useState(false);

    /*
    |--------------------------------------------------------------------------
    | LOCAL AUTH STATE
    |--------------------------------------------------------------------------
    */

    const getStoredToken = () => {
        return (
            localStorage.getItem("token") ||
            localStorage.getItem("authToken") ||
            localStorage.getItem("accessToken")
        );
    };

    const getStoredUser = () => {
        try {
            const storedUser = localStorage.getItem("user");

            if (!storedUser) {
                return null;
            }

            return JSON.parse(storedUser);
        } catch (error) {
            console.error(
                "Navbar user parse error:",
                error
            );

            return null;
        }
    };

    const getStoredRole = () => {
        const storedUser = getStoredUser();

        return (
            localStorage.getItem("role") ||
            localStorage.getItem("userRole") ||
            storedUser?.role ||
            ""
        );
    };

    /*
    |--------------------------------------------------------------------------
    | AUTH STATE
    |--------------------------------------------------------------------------
    */

    const [localAuth, setLocalAuth] = useState(() => {
        return Boolean(getStoredToken());
    });

    const [localUser, setLocalUser] = useState(() => {
        return getStoredUser();
    });

    const [localRole, setLocalRole] = useState(() => {
        return getStoredRole();
    });

    /*
    |--------------------------------------------------------------------------
    | SYNC AUTHENTICATION
    |--------------------------------------------------------------------------
    */

    const syncAuth = () => {

        const token = getStoredToken();
        const storedUser = getStoredUser();
        const storedRole = getStoredRole();

        setLocalAuth(Boolean(token));
        setLocalUser(storedUser);
        setLocalRole(storedRole);
    };

    /*
    |--------------------------------------------------------------------------
    | INITIAL + ROUTE CHANGE SYNC
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        syncAuth();
    }, [location.pathname]);

    /*
    |--------------------------------------------------------------------------
    | LISTEN FOR LOGIN / LOGOUT
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        const handleStorageChange = () => {
            syncAuth();
        };

        const handleTalentIQAuthChange = () => {
            syncAuth();
        };

        window.addEventListener(
            "storage",
            handleStorageChange
        );

        window.addEventListener(
            "talentiq-auth-change",
            handleTalentIQAuthChange
        );

        return () => {

            window.removeEventListener(
                "storage",
                handleStorageChange
            );

            window.removeEventListener(
                "talentiq-auth-change",
                handleTalentIQAuthChange
            );
        };

    }, []);

    /*
    |--------------------------------------------------------------------------
    | FINAL AUTHENTICATION VALUE
    |--------------------------------------------------------------------------
    */

    const authenticated =
        Boolean(isAuthenticated) ||
        localAuth;

    /*
    |--------------------------------------------------------------------------
    | FINAL USER
    |--------------------------------------------------------------------------
    */

    const currentUser =
        user ||
        localUser;

    /*
    |--------------------------------------------------------------------------
    | FINAL ROLE
    |--------------------------------------------------------------------------
    */

    const normalizedRole = String(
        role ||
        localRole ||
        currentUser?.role ||
        ""
    )
        .trim()
        .toLowerCase();

    /*
    |--------------------------------------------------------------------------
    | DEBUG
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        console.log(
            "TALENTIQ NAVBAR:",
            {
                pathname: location.pathname,
                authenticated,
                propAuthenticated: isAuthenticated,
                localAuth,
                role: normalizedRole,
                user: currentUser,
                tokenExists: Boolean(
                    getStoredToken()
                ),
            }
        );

    }, [
        location.pathname,
        authenticated,
        isAuthenticated,
        localAuth,
        normalizedRole,
        currentUser,
    ]);

    /*
    |--------------------------------------------------------------------------
    | CLOSE MENU
    |--------------------------------------------------------------------------
    */

    const closeMenu = () => {
        setMenuOpen(false);
    };

    /*
    |--------------------------------------------------------------------------
    | LOGOUT
    |--------------------------------------------------------------------------
    */

    const handleLogout = () => {

        console.log(
            "TALENTIQ: Logging out..."
        );

        localStorage.removeItem("token");
        localStorage.removeItem("authToken");
        localStorage.removeItem("accessToken");

        localStorage.removeItem("user");
        localStorage.removeItem("role");
        localStorage.removeItem("userRole");

        setLocalAuth(false);
        setLocalUser(null);
        setLocalRole("");

        setMenuOpen(false);

        /*
        | Tell Navbar / App that authentication changed
        */

        window.dispatchEvent(
            new Event("talentiq-auth-change")
        );

        navigate(
            "/login",
            {
                replace: true,
            }
        );
    };

    /*
    |--------------------------------------------------------------------------
    | NAV LINK CLASS
    |--------------------------------------------------------------------------
    */

    const navLinkClass = ({ isActive }) =>
        isActive
            ? "nav-link active"
            : "nav-link";

    /*
    |--------------------------------------------------------------------------
    | USER NAME
    |--------------------------------------------------------------------------
    */

    const getUserName = () => {

        if (!currentUser) {
            return "";
        }

        return (
            currentUser.fullName ||
            currentUser.name ||
            currentUser.username ||
            currentUser.email ||
            ""
        );
    };

    /*
    |--------------------------------------------------------------------------
    | TALENTIQ LOGO
    |--------------------------------------------------------------------------
    */

    const TalentIQLogo = ({
        destination = "/",
    }) => {

        return (
            <Link
                to={destination}
                className="navbar-logo"
                onClick={closeMenu}
            >

                <div className="logo-box">

                    <img
                        src="/images/TalentIQ_Logo.png"
                        alt="TalentIQ Logo"
                    />

                </div>

                <div className="logo-name">
                    Talent<span>IQ</span>
                </div>

            </Link>
        );
    };

    /*
    |--------------------------------------------------------------------------
    | CANDIDATE NAVBAR
    |--------------------------------------------------------------------------
    */

    if (
        !authenticated ||
        normalizedRole === "candidate"
    ) {

        return (
            <nav className="navbar">

                {/* LOGO */}

                <TalentIQLogo
                    destination={
                        authenticated
                            ? "/dashboard"
                            : "/"
                    }
                />

                {/* CANDIDATE LINKS */}

                <div
                    className={`navbar-menu ${
                        menuOpen
                            ? "active"
                            : ""
                    }`}
                >

                    <NavLink
                        to="/"
                        onClick={closeMenu}
                        className={navLinkClass}
                    >
                        <span className="nav-icon">
                            ⌂
                        </span>
                        Home
                    </NavLink>

                    <NavLink
                        to="/find-jobs"
                        onClick={closeMenu}
                        className={navLinkClass}
                    >
                        <span className="nav-icon">
                            ⌕
                        </span>
                        Find Jobs
                    </NavLink>

                    <NavLink
                        to="/ai-recommendations"
                        onClick={closeMenu}
                        className={navLinkClass}
                    >
                        <span className="nav-icon">
                            ✦
                        </span>
                        AI Recommendations
                    </NavLink>

                    <NavLink
                        to="/ai-job-search"
                        onClick={closeMenu}
                        className={navLinkClass}
                    >
                        <span className="nav-icon">
                            ◈
                        </span>
                        AI Job Search
                    </NavLink>

                    <NavLink
                        to="/applications"
                        onClick={closeMenu}
                        className={navLinkClass}
                    >
                        <span className="nav-icon">
                            ▣
                        </span>
                        Applications
                    </NavLink>

                    <NavLink
                        to="/resume"
                        onClick={closeMenu}
                        className={navLinkClass}
                    >
                        <span className="nav-icon">
                            ▤
                        </span>
                        Resume
                    </NavLink>

                </div>

                {/* RIGHT SIDE */}

                <div className="navbar-actions">

                    {authenticated ? (

                        <>
                            {getUserName() && (
                                <span
                                    className="navbar-user-name"
                                    title={getUserName()}
                                >
                                    {getUserName()}
                                </span>
                            )}

                            <Link
                                to="/profile"
                                className="profile-button"
                                onClick={closeMenu}
                            >
                                <span className="button-icon">
                                    ◉
                                </span>

                                Profile
                            </Link>

                            <button
                                type="button"
                                className="logout-button"
                                onClick={handleLogout}
                            >
                                <span className="button-icon">
                                    ↪
                                </span>

                                Logout
                            </button>
                        </>

                    ) : (

                        <>
                            <Link
                                to="/login"
                                className="login-button"
                                onClick={closeMenu}
                            >
                                Login
                            </Link>

                            <Link
                                to="/register"
                                className="register-button"
                                onClick={closeMenu}
                            >
                                Register
                            </Link>
                        </>

                    )}

                </div>

                {/* MOBILE BUTTON */}

                <button
                    type="button"
                    className={`mobile-menu-button ${
                        menuOpen
                            ? "active"
                            : ""
                    }`}
                    onClick={() =>
                        setMenuOpen(
                            previous =>
                                !previous
                        )
                    }
                    aria-label="Toggle navigation menu"
                    aria-expanded={menuOpen}
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>

            </nav>
        );
    }

    /*
    |--------------------------------------------------------------------------
    | RECRUITER NAVBAR
    |--------------------------------------------------------------------------
    */

    if (
        authenticated &&
        normalizedRole === "recruiter"
    ) {

        return (
            <nav className="navbar">

                <TalentIQLogo
                    destination="/recruiter-dashboard"
                />

                <div
                    className={`navbar-menu ${
                        menuOpen
                            ? "active"
                            : ""
                    }`}
                >

                    <NavLink
                        to="/recruiter-dashboard"
                        onClick={closeMenu}
                        className={navLinkClass}
                    >
                        <span className="nav-icon">
                            ⌂
                        </span>
                        Dashboard
                    </NavLink>

                    <NavLink
                        to="/recruiter/jobs"
                        onClick={closeMenu}
                        className={navLinkClass}
                    >
                        <span className="nav-icon">
                            ▣
                        </span>
                        Manage Jobs
                    </NavLink>

                    <NavLink
                        to="/recruiter/jobs/create"
                        onClick={closeMenu}
                        className={navLinkClass}
                    >
                        <span className="nav-icon">
                            ＋
                        </span>
                        Post Job
                    </NavLink>

                    <NavLink
                        to="/recruiter/applications"
                        onClick={closeMenu}
                        className={navLinkClass}
                    >
                        <span className="nav-icon">
                            ▤
                        </span>
                        Applications
                    </NavLink>

                    <NavLink
                        to="/recruiter/candidates"
                        onClick={closeMenu}
                        className={navLinkClass}
                    >
                        <span className="nav-icon">
                            ◎
                        </span>
                        Candidates
                    </NavLink>

                    <NavLink
                        to="/recruiter/profile"
                        onClick={closeMenu}
                        className={navLinkClass}
                    >
                        <span className="nav-icon">
                            ◉
                        </span>
                        Profile
                    </NavLink>

                </div>

                <div className="navbar-actions">

                    {getUserName() && (
                        <span
                            className="navbar-user-name"
                            title={getUserName()}
                        >
                            {getUserName()}
                        </span>
                    )}

                    <Link
                        to="/recruiter/profile"
                        className="profile-button"
                        onClick={closeMenu}
                    >
                        <span className="button-icon">
                            ◉
                        </span>

                        Profile
                    </Link>

                    <button
                        type="button"
                        className="logout-button"
                        onClick={handleLogout}
                    >
                        <span className="button-icon">
                            ↪
                        </span>

                        Logout
                    </button>

                </div>

                <button
                    type="button"
                    className={`mobile-menu-button ${
                        menuOpen
                            ? "active"
                            : ""
                    }`}
                    onClick={() =>
                        setMenuOpen(
                            previous =>
                                !previous
                        )
                    }
                    aria-label="Toggle navigation menu"
                    aria-expanded={menuOpen}
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>

            </nav>
        );
    }

    return null;
};

export default Navbar;