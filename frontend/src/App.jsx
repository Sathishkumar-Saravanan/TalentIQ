import React from "react";
import {
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

// ============================================================
// COMPONENTS
// ============================================================

import Navbar from "./components/Navbar";
import RecruiterNavbar from "./components/RecruiterNavbar";
import ProtectedRoute from "./components/ProtectedRoute";
import LoadingOverlay from "./components/LoadingOverlay";

// ============================================================
// CANDIDATE PAGES
// ============================================================

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import FindJobs from "./pages/FindJobs";
import Application from "./pages/Application";
import AIRecommendations from "./pages/AIRecommendations";
import Profile from "./pages/Profile";
import CandidateNotifications from "./pages/CandidateNotifications";
import AIJobSearch from "./pages/AIJobSearch";
import Applications from "./pages/Applications";
import JobDetails from "./pages/JobDetails";
import Resume from "./pages/Resume";
import LearningPath from "./pages/LearningPath";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import JobAlerts from "./pages/JobAlerts";
import HelpCenter from "./pages/HelpCenter";
import Contact from "./pages/Contact";
import AboutTalentIQ from "./pages/AboutTalentIQ";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsConditions from "./pages/TermsConditions";
import CareerInsights from "./pages/CareerInsights";
import SkillGapAnalysis from "./pages/SkillGapAnalysis";
import CareerCopilot from "./pages/CareerCopilot";
import ResumeHealth from "./pages/ResumeHealth";

// ============================================================
// RECRUITER PAGES
// ============================================================

import RecruiterDashboard from "./pages/recruiter/RecruiterDashboard";
import RecruiterProfile from "./pages/recruiter/RecruiterProfile";
import RecruiterPostJob from "./pages/recruiter/RecruiterPostJob";
import ManageJobs from "./pages/recruiter/ManageJobs";
import RecruiterApplication from "./pages/recruiter/RecruiterApplications";
import Candidates from "./pages/recruiter/Candidates";
import RecruiterNotification from "./pages/recruiter/RecruiterNotification";

// ============================================================
// AUTH HELPERS
// ============================================================

const getStoredUser = () => {
  try {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      return null;
    }

    return JSON.parse(storedUser);
  } catch (error) {
    console.error(
      "Unable to parse stored user:",
      error
    );

    return null;
  }
};

// ============================================================
// GET USER ROLE
// ============================================================

const getUserRole = () => {
  const user = getStoredUser();

  const role =
    user?.role ||
    user?.userRole ||
    user?.accountType ||
    localStorage.getItem("role") ||
    localStorage.getItem("userRole") ||
    "";

  return String(role)
    .trim()
    .toLowerCase();
};

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
// APP LAYOUT
// ============================================================

const AppLayout = () => {
  const location = useLocation();

  const pathname = location.pathname;

  const token = getToken();

  const role = getUserRole();

  // ==========================================================
  // USER TYPES
  // ==========================================================

  const isRecruiter =
    Boolean(token) &&
    role === "recruiter";

  const isCandidate =
    Boolean(token) &&
    role === "candidate";

  // ==========================================================
  // PUBLIC AUTH PAGES
  // ==========================================================

  const hideNavbar =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password";

  // ==========================================================
  // DEBUG
  // ==========================================================

  console.log(
    "================================================"
  );

  console.log(
    "TALENTIQ APP ROUTER"
  );

  console.log({
    pathname,
    tokenExists: Boolean(token),
    role,
    isRecruiter,
    isCandidate,
  });

  console.log(
    "================================================"
  );

  // ==========================================================
  // JSX
  // ==========================================================

  return (
    <>
      {/* ====================================================
          NAVBAR
      ===================================================== */}

      {!hideNavbar && (
        <>
          {isRecruiter ? (
            <RecruiterNavbar />
          ) : (
            <Navbar />
          )}
        </>
      )}

      {/* ====================================================
          ROUTES
      ===================================================== */}

      <Routes>

        {/* ==================================================
            PUBLIC ROUTES
        ================================================== */}

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />

        <Route
          path="/about-talentiq"
          element={<AboutTalentIQ />}
        />

        <Route
          path="/privacy-policy"
          element={<PrivacyPolicy />}
        />

        <Route
          path="/terms-conditions"
          element={<TermsConditions />}
        />

        <Route
          path="/help-center"
          element={<HelpCenter />}
        />

        <Route
          path="/contact"
          element={<Contact />}
        />

        {/* ==================================================
            CANDIDATE DASHBOARD
        ================================================== */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute
              allowedRoles={["candidate"]}
            >
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* ==================================================
            CANDIDATE JOBS
        ================================================== */}

        <Route
          path="/find-jobs"
          element={
            <ProtectedRoute
              allowedRoles={["candidate"]}
            >
              <FindJobs />
            </ProtectedRoute>
          }
        />

        <Route
          path="/jobs/:jobId"
          element={
            <ProtectedRoute
              allowedRoles={["candidate"]}
            >
              <JobDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/apply/:jobId"
          element={
            <ProtectedRoute
              allowedRoles={["candidate"]}
            >
              <Application />
            </ProtectedRoute>
          }
        />

        <Route
          path="/applications"
          element={
            <ProtectedRoute
              allowedRoles={["candidate"]}
            >
              <Applications />
            </ProtectedRoute>
          }
        />

        {/* ==================================================
            CANDIDATE AI
        ================================================== */}

        <Route
          path="/ai-recommendations"
          element={
            <ProtectedRoute
              allowedRoles={["candidate"]}
            >
              <AIRecommendations />
            </ProtectedRoute>
          }
        />

        <Route
          path="/ai-job-search"
          element={
            <ProtectedRoute
              allowedRoles={["candidate"]}
            >
              <AIJobSearch />
            </ProtectedRoute>
          }
        />

        <Route
          path="/career-insights"
          element={
            <ProtectedRoute
              allowedRoles={["candidate"]}
            >
              <CareerInsights />
            </ProtectedRoute>
          }
        />

        <Route
          path="/skill-gap-analysis"
          element={
            <ProtectedRoute
              allowedRoles={["candidate"]}
            >
              <SkillGapAnalysis />
            </ProtectedRoute>
          }
        />

        <Route
          path="/career-copilot"
          element={
            <ProtectedRoute
              allowedRoles={["candidate"]}
            >
              <CareerCopilot />
            </ProtectedRoute>
          }
        />

        <Route
          path="/resume-health"
          element={
            <ProtectedRoute
              allowedRoles={["candidate"]}
            >
              <ResumeHealth />
            </ProtectedRoute>
          }
        />

        {/* ==================================================
            CANDIDATE PROFILE
        ================================================== */}

        <Route
          path="/profile"
          element={
            <ProtectedRoute
              allowedRoles={["candidate"]}
            >
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/resume"
          element={
            <ProtectedRoute
              allowedRoles={["candidate"]}
            >
              <Resume />
            </ProtectedRoute>
          }
        />

        <Route
          path="/learning"
          element={
            <ProtectedRoute
              allowedRoles={["candidate"]}
            >
              <LearningPath />
            </ProtectedRoute>
          }
        />

        <Route
          path="/job-alerts"
          element={
            <ProtectedRoute
              allowedRoles={["candidate"]}
            >
              <JobAlerts />
            </ProtectedRoute>
          }
        />

        <Route
          path="/candidate-notifications"
          element={
            <ProtectedRoute
              allowedRoles={["candidate"]}
            >
              <CandidateNotifications />
            </ProtectedRoute>
          }
        />

        {/* ==================================================
            RECRUITER DASHBOARD
        ================================================== */}

        <Route
          path="/recruiter-dashboard"
          element={
            <ProtectedRoute
              allowedRoles={["recruiter"]}
            >
              <RecruiterDashboard />
            </ProtectedRoute>
          }
        />

        {/* ==================================================
            RECRUITER PROFILE
        ================================================== */}

        <Route
          path="/recruiter/profile"
          element={
            <ProtectedRoute
              allowedRoles={["recruiter"]}
            >
              <RecruiterProfile />
            </ProtectedRoute>
          }
        />

        {/* ==================================================
            RECRUITER MANAGE JOBS
        ==================================================
        
        This page is connected to:

        GET    /api/jobs/recruiter/my
        PUT    /api/jobs/:jobId
        DELETE /api/jobs/:jobId

        The actual API calls are handled inside
        ManageJobs.jsx.
        ================================================== */}

        <Route
          path="/recruiter/jobs"
          element={
            <ProtectedRoute
              allowedRoles={["recruiter"]}
            >
              <ManageJobs />
            </ProtectedRoute>
          }
        />

        {/* ==================================================
            RECRUITER POST JOB
        ================================================== */}

        <Route
          path="/recruiter/jobs/post"
          element={
            <ProtectedRoute
              allowedRoles={["recruiter"]}
            >
              <RecruiterPostJob />
            </ProtectedRoute>
          }
        />

        {/* ==================================================
            RECRUITER APPLICATIONS
        ================================================== */}

        <Route
    path="/recruiter/applications"
    element={
        <ProtectedRoute
            allowedRoles={["recruiter"]}
        >
            <RecruiterApplication />
        </ProtectedRoute>
    }
/>

        {/* ==================================================
    RECRUITER CANDIDATES
================================================== */}

<Route
  path="/recruiter/candidates"
  element={
    <ProtectedRoute
      allowedRoles={["recruiter"]}
    >
      <Candidates />
    </ProtectedRoute>
  }
/>

<Route
  path="/recruiter-notifications"
  element={<RecruiterNotification />}
/>

        {/* ==================================================
            FALLBACK
        ================================================== */}

        <Route
          path="*"
          element={<Home />}
        />

      </Routes>

      {/* ====================================================
          GLOBAL LOADING
      ===================================================== */}

      <LoadingOverlay />
    </>
  );
};

// ============================================================
// APP
// ============================================================

const App = () => {
  return (
    <AppLayout />
  );
};

export default App;