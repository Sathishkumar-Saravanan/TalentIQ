import React, {
  useEffect,
  useState,
} from "react";

import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiBriefcase,
  FiGlobe,
  FiLinkedin,
  FiEdit3,
  FiSave,
  FiX,
  FiLoader,
  FiCheckCircle,
  FiAlertCircle,
  FiArrowLeft,
} from "react-icons/fi";

import {
  useNavigate,
} from "react-router-dom";

import "../../styles/recruiterProfile.css";

const API_BASE_URL =
  "http://localhost:5000";

const PROFILE_URL =
  `${API_BASE_URL}/api/recruiters/profile`;


/*
|--------------------------------------------------------------------------
| EMPTY FORM
|--------------------------------------------------------------------------
*/

const EMPTY_FORM = {
  companyName: "",
  fullName: "",
  username: "",
  email: "",
  phone: "",
  location: "",
  designation: "",
  bio: "",
  website: "",
  linkedin: "",
};


/*
|--------------------------------------------------------------------------
| TOKEN
|--------------------------------------------------------------------------
*/

const getToken = () => {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken")
  );
};


/*
|--------------------------------------------------------------------------
| STORED USER
|--------------------------------------------------------------------------
*/

const getStoredUser = () => {
  try {
    const storedUser =
      localStorage.getItem("user");

    if (!storedUser) {
      return null;
    }

    return JSON.parse(storedUser);
  } catch {
    return null;
  }
};


/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

const RecruiterProfile = () => {
  const navigate = useNavigate();

  const [profile, setProfile] =
    useState(null);

  const [formData, setFormData] =
    useState(EMPTY_FORM);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [editing, setEditing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const user =
    getStoredUser();


  /*
  |--------------------------------------------------------------------------
  | NORMALIZE PROFILE
  |--------------------------------------------------------------------------
  */

  const normalizeProfile = (
    data = {}
  ) => {
    const profileUser =
      data?.user || {};

    return {
      companyName:
        data?.companyName ||
        data?.company ||
        user?.companyName ||
        user?.company ||
        "",

      fullName:
        profileUser?.fullName ||
        profileUser?.name ||
        data?.fullName ||
        data?.name ||
        user?.fullName ||
        user?.name ||
        "",

      username:
        profileUser?.username ||
        data?.username ||
        user?.username ||
        "",

      email:
        profileUser?.email ||
        data?.email ||
        user?.email ||
        "",

      phone:
        data?.phone ||
        data?.phoneNumber ||
        "",

      location:
        data?.location ||
        "",

      designation:
        data?.designation ||
        data?.position ||
        data?.jobTitle ||
        "",

      bio:
        data?.bio ||
        "",

      website:
        data?.website ||
        "",

      linkedin:
        data?.linkedin ||
        data?.linkedinUrl ||
        "",
    };
  };


  /*
  |--------------------------------------------------------------------------
  | LOGOUT
  |--------------------------------------------------------------------------
  */

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");

    navigate("/login", {
      replace: true,
    });
  };


  /*
  |--------------------------------------------------------------------------
  | LOAD PROFILE
  |--------------------------------------------------------------------------
  */

  const loadProfile = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = getToken();

      if (!token) {
        logout();
        return;
      }

      console.log(
        "GET RECRUITER PROFILE:",
        PROFILE_URL
      );

      const response =
        await fetch(PROFILE_URL, {
          method: "GET",

          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        });

      let data = {};

      try {
        data =
          await response.json();
      } catch {
        data = {};
      }

      console.log(
        "RECRUITER PROFILE RESPONSE:",
        data
      );

      /*
      |--------------------------------------------------------------------------
      | UNAUTHORIZED
      |--------------------------------------------------------------------------
      */

      if (response.status === 401) {
        logout();
        return;
      }

      /*
      |--------------------------------------------------------------------------
      | PROFILE DOES NOT EXIST
      |--------------------------------------------------------------------------
      */

      if (response.status === 404) {
        console.log(
          "Recruiter profile does not exist. Opening create mode."
        );

        setProfile(null);

        setFormData(
          normalizeProfile({})
        );

        setEditing(true);

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | OTHER ERROR
      |--------------------------------------------------------------------------
      */

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to load recruiter profile."
        );
      }

      /*
      |--------------------------------------------------------------------------
      | PROFILE
      |--------------------------------------------------------------------------
      */

      const profileData =
        data?.profile ||
        data?.data ||
        data?.recruiter ||
        data;

      setProfile(profileData);

      setFormData(
        normalizeProfile(
          profileData
        )
      );

      setEditing(false);
    } catch (err) {
      console.error(
        "LOAD RECRUITER PROFILE ERROR:",
        err
      );

      setError(
        err?.message ||
          "Unable to load recruiter profile."
      );
    } finally {
      setLoading(false);
    }
  };


  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadProfile();
  }, []);


  /*
  |--------------------------------------------------------------------------
  | INPUT CHANGE
  |--------------------------------------------------------------------------
  */

  const handleChange = (event) => {
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


  /*
  |--------------------------------------------------------------------------
  | SAVE PROFILE
  |--------------------------------------------------------------------------
  */

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    if (saving) {
      return;
    }

    setError("");
    setSuccess("");

    /*
    |--------------------------------------------------------------------------
    | FRONTEND VALIDATION
    |--------------------------------------------------------------------------
    */

    if (
      !formData.companyName.trim()
    ) {
      setError(
        "Company name is required."
      );
      return;
    }

    if (
      !formData.designation.trim()
    ) {
      setError(
        "Designation is required."
      );
      return;
    }

    if (formData.bio.length > 3000) {
      setError(
        "Bio cannot exceed 3000 characters."
      );
      return;
    }

    try {
      setSaving(true);

      const token = getToken();

      if (!token) {
        logout();
        return;
      }

      /*
      |--------------------------------------------------------------------------
      | ONLY SEND PROFILE FIELDS
      |--------------------------------------------------------------------------
      */

      const requestBody = {
        companyName:
          formData.companyName.trim(),

        designation:
          formData.designation.trim(),

        phone:
          formData.phone.trim(),

        location:
          formData.location.trim(),

        bio:
          formData.bio.trim(),

        website:
          formData.website.trim(),

        linkedin:
          formData.linkedin.trim(),
      };

      const method =
        profile
          ? "PUT"
          : "POST";

      console.log(
        `${method} RECRUITER PROFILE:`,
        PROFILE_URL
      );

      const response =
        await fetch(PROFILE_URL, {
          method,

          headers: {
            Authorization:
              `Bearer ${token}`,

            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify(
              requestBody
            ),
        });

      let data = {};

      try {
        data =
          await response.json();
      } catch {
        data = {};
      }

      console.log(
        "SAVE RECRUITER PROFILE RESPONSE:",
        data
      );

      /*
      |--------------------------------------------------------------------------
      | UNAUTHORIZED
      |--------------------------------------------------------------------------
      */

      if (response.status === 401) {
        logout();
        return;
      }

      /*
      |--------------------------------------------------------------------------
      | ERROR
      |--------------------------------------------------------------------------
      */

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to save recruiter profile."
        );
      }

      /*
      |--------------------------------------------------------------------------
      | SUCCESS
      |--------------------------------------------------------------------------
      */

      const savedProfile =
        data?.profile ||
        data?.data ||
        data?.recruiter ||
        data;

      setProfile(
        savedProfile
      );

      setFormData(
        normalizeProfile(
          savedProfile
        )
      );

      setEditing(false);

      setSuccess(
        profile
          ? "Recruiter profile updated successfully."
          : "Recruiter profile created successfully."
      );
    } catch (err) {
      console.error(
        "SAVE RECRUITER PROFILE ERROR:",
        err
      );

      setError(
        err?.message ||
          "Unable to save recruiter profile."
      );
    } finally {
      setSaving(false);
    }
  };


  /*
  |--------------------------------------------------------------------------
  | CANCEL
  |--------------------------------------------------------------------------
  */

  const handleCancel = () => {
    setError("");
    setSuccess("");

    if (!profile) {
      return;
    }

    setFormData(
      normalizeProfile(
        profile
      )
    );

    setEditing(false);
  };


  /*
  |--------------------------------------------------------------------------
  | BACK
  |--------------------------------------------------------------------------
  */

  const handleBack = () => {
    navigate(
      "/recruiter-dashboard"
    );
  };


  /*
  |--------------------------------------------------------------------------
  | DISPLAY NAME
  |--------------------------------------------------------------------------
  */

  const displayName =
    formData.fullName ||
    user?.fullName ||
    user?.name ||
    user?.username ||
    "Recruiter";


  /*
  |--------------------------------------------------------------------------
  | INITIALS
  |--------------------------------------------------------------------------
  */

  const getInitials = () => {
    const name =
      displayName.trim();

    if (!name) {
      return "R";
    }

    const parts =
      name.split(/\s+/);

    if (parts.length === 1) {
      return parts[0]
        .charAt(0)
        .toUpperCase();
    }

    return (
      parts[0].charAt(0) +
      parts[
        parts.length - 1
      ].charAt(0)
    ).toUpperCase();
  };


  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="recruiter-profile-loading">

        <div className="recruiter-profile-loading-card">

          <FiLoader
            className="recruiter-profile-loading-spinner"
          />

          <h3>
            Loading recruiter profile...
          </h3>

          <p>
            Please wait while TalentIQ
            loads your recruiter information.
          </p>

        </div>

      </div>
    );
  }


  /*
  |--------------------------------------------------------------------------
  | JSX
  |--------------------------------------------------------------------------
  */

  return (
    <div className="recruiter-profile-page">

      {/* TOPBAR */}

      <div className="recruiter-profile-topbar">

        <button
          type="button"
          className="recruiter-profile-back"
          onClick={handleBack}
        >
          <FiArrowLeft />

          <span>
            Back to Dashboard
          </span>
        </button>

        <div className="recruiter-profile-heading">

          <span className="recruiter-profile-label">
            TALENTIQ RECRUITER
          </span>

          <h1>
            Recruiter Profile
          </h1>

        </div>

      </div>


      {/* MAIN */}

      <main className="recruiter-profile-container">

        {/* INTRO */}

        <div className="recruiter-profile-intro">

          <div>

            <span className="recruiter-profile-kicker">
              RECRUITER ACCOUNT
            </span>

            <h2>
              Manage your recruiter profile
            </h2>

            <p>
              Keep your recruiter and company
              information updated to manage
              job postings and connect with
              candidates.
            </p>

          </div>

          {profile && !editing && (
            <button
              type="button"
              className="recruiter-profile-edit-button"
              onClick={() => {
                setError("");
                setSuccess("");
                setEditing(true);
              }}
            >
              <FiEdit3 />

              <span>
                Edit Profile
              </span>
            </button>
          )}

        </div>


        {/* ERROR */}

        {error && (
          <div className="recruiter-profile-message recruiter-profile-error">

            <FiAlertCircle />

            <span>
              {error}
            </span>

          </div>
        )}


        {/* SUCCESS */}

        {success && (
          <div className="recruiter-profile-message recruiter-profile-success">

            <FiCheckCircle />

            <span>
              {success}
            </span>

          </div>
        )}


        {/* GRID */}

        <div className="recruiter-profile-grid">

          {/* SIDEBAR */}

          <aside className="recruiter-profile-sidebar">

            <div className="recruiter-profile-avatar">
              {getInitials()}
            </div>

            <h3>
              {displayName}
            </h3>

            <p>
              {formData.designation ||
                "Recruiter"}
            </p>


            <div className="recruiter-profile-sidebar-info">

              <div className="recruiter-profile-info-item">

                <FiBriefcase />

                <div>
                  <span>
                    Company
                  </span>

                  <strong>
                    {formData.companyName ||
                      "Not provided"}
                  </strong>
                </div>

              </div>


              <div className="recruiter-profile-info-item">

                <FiMail />

                <div>
                  <span>
                    Email
                  </span>

                  <strong>
                    {formData.email ||
                      "Not provided"}
                  </strong>
                </div>

              </div>


              <div className="recruiter-profile-info-item">

                <FiMapPin />

                <div>
                  <span>
                    Location
                  </span>

                  <strong>
                    {formData.location ||
                      "Not provided"}
                  </strong>
                </div>

              </div>

            </div>


            {profile && (
              <div className="recruiter-profile-status">

                <FiCheckCircle />

                <div>

                  <strong>
                    Recruiter Profile Active
                  </strong>

                  <span>
                    Your recruiter account is
                    connected to TalentIQ.
                  </span>

                </div>

              </div>
            )}

          </aside>


          {/* FORM CARD */}

          <section className="recruiter-profile-card">

            <div className="recruiter-profile-card-header">

              <div>

                <span>
                  RECRUITER INFORMATION
                </span>

                <h3>
                  {editing
                    ? profile
                      ? "Edit your recruiter profile"
                      : "Create your recruiter profile"
                    : "Your recruiter details"}
                </h3>

              </div>


              {!editing && profile && (
                <button
                  type="button"
                  className="recruiter-profile-small-edit"
                  onClick={() =>
                    setEditing(true)
                  }
                >
                  <FiEdit3 />

                  <span>
                    Edit
                  </span>
                </button>
              )}

            </div>


            <form
              className="recruiter-profile-form"
              onSubmit={handleSubmit}
            >

              {/* COMPANY */}

              <div className="recruiter-profile-form-group">

                <label>
                  Company Name
                  <span>*</span>
                </label>

                <div className="recruiter-profile-input">

                  <FiBriefcase />

                  <input
                    name="companyName"
                    type="text"
                    value={
                      formData.companyName
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Enter company name"
                    disabled={
                      !editing || saving
                    }
                    maxLength={150}
                  />

                </div>

              </div>


              {/* FULL NAME */}

              <div className="recruiter-profile-form-group">

                <label>
                  Full Name
                </label>

                <div className="recruiter-profile-input">

                  <FiUser />

                  <input
                    name="fullName"
                    type="text"
                    value={
                      formData.fullName
                    }
                    disabled
                    placeholder="Recruiter name"
                  />

                </div>

                <small>
                  Name is managed from your account.
                </small>

              </div>


              {/* USERNAME */}

              <div className="recruiter-profile-form-group">

                <label>
                  Username
                </label>

                <div className="recruiter-profile-input">

                  <FiUser />

                  <input
                    name="username"
                    type="text"
                    value={
                      formData.username
                    }
                    disabled
                    placeholder="Username"
                  />

                </div>

              </div>


              {/* EMAIL */}

              <div className="recruiter-profile-form-group">

                <label>
                  Email Address
                </label>

                <div className="recruiter-profile-input">

                  <FiMail />

                  <input
                    name="email"
                    type="email"
                    value={
                      formData.email
                    }
                    disabled
                    placeholder="Recruiter email"
                  />

                </div>

              </div>


              {/* PHONE */}

              <div className="recruiter-profile-form-group">

                <label>
                  Phone Number
                </label>

                <div className="recruiter-profile-input">

                  <FiPhone />

                  <input
                    name="phone"
                    type="tel"
                    value={
                      formData.phone
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Phone number"
                    disabled={
                      !editing || saving
                    }
                    maxLength={30}
                  />

                </div>

              </div>


              {/* LOCATION */}

              <div className="recruiter-profile-form-group">

                <label>
                  Location
                </label>

                <div className="recruiter-profile-input">

                  <FiMapPin />

                  <input
                    name="location"
                    type="text"
                    value={
                      formData.location
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Chennai, Tamil Nadu"
                    disabled={
                      !editing || saving
                    }
                    maxLength={150}
                  />

                </div>

              </div>


              {/* DESIGNATION */}

              <div className="recruiter-profile-form-group">

                <label>
                  Designation
                  <span>*</span>
                </label>

                <div className="recruiter-profile-input">

                  <FiBriefcase />

                  <input
                    name="designation"
                    type="text"
                    value={
                      formData.designation
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="HR Manager / Recruiter"
                    disabled={
                      !editing || saving
                    }
                    maxLength={100}
                  />

                </div>

              </div>


              {/* WEBSITE */}

              <div className="recruiter-profile-form-group">

                <label>
                  Company Website
                </label>

                <div className="recruiter-profile-input">

                  <FiGlobe />

                  <input
                    name="website"
                    type="url"
                    value={
                      formData.website
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="https://company.com"
                    disabled={
                      !editing || saving
                    }
                    maxLength={300}
                  />

                </div>

              </div>


              {/* LINKEDIN */}

              <div className="recruiter-profile-form-group">

                <label>
                  LinkedIn
                </label>

                <div className="recruiter-profile-input">

                  <FiLinkedin />

                  <input
                    name="linkedin"
                    type="url"
                    value={
                      formData.linkedin
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="https://linkedin.com/company/..."
                    disabled={
                      !editing || saving
                    }
                    maxLength={300}
                  />

                </div>

              </div>


              {/* BIO */}

              <div className="recruiter-profile-form-group recruiter-profile-full-width">

                <label>
                  Recruiter / Company Bio
                </label>

                <div className="recruiter-profile-textarea">

                  <FiUser />

                  <textarea
                    name="bio"
                    rows={7}
                    value={
                      formData.bio
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Tell candidates about your company and recruitment role..."
                    disabled={
                      !editing || saving
                    }
                    maxLength={3000}
                  />

                </div>

                <div className="recruiter-profile-character-count">

                  <span>
                    Maximum 3000 characters
                  </span>

                  <strong
                    className={
                      formData.bio.length >
                      2800
                        ? "warning"
                        : ""
                    }
                  >
                    {formData.bio.length}/3000
                  </strong>

                </div>

              </div>


              {/* ACTIONS */}

              {editing && (
                <div className="recruiter-profile-actions">

                  {profile && (
                    <button
                      type="button"
                      className="recruiter-profile-cancel"
                      onClick={
                        handleCancel
                      }
                      disabled={saving}
                    >
                      <FiX />

                      <span>
                        Cancel
                      </span>
                    </button>
                  )}

                  <button
                    type="submit"
                    className="recruiter-profile-save"
                    disabled={
                      saving
                    }
                  >
                    {saving ? (
                      <>
                        <FiLoader className="recruiter-profile-button-spinner" />

                        <span>
                          {profile
                            ? "Updating..."
                            : "Creating..."}
                        </span>
                      </>
                    ) : (
                      <>
                        <FiSave />

                        <span>
                          {profile
                            ? "Update Profile"
                            : "Create Profile"}
                        </span>
                      </>
                    )}
                  </button>

                </div>
              )}

            </form>

          </section>

        </div>

      </main>

    </div>
  );
};

export default RecruiterProfile;