import React, {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    useNavigate,
    useParams,
} from "react-router-dom";

import "../styles/Application.css";

const API_BASE =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";

const SERVER_BASE =
    API_BASE.replace(/\/api\/?$/, "");


// ============================================================
// TOKEN
// ============================================================

const getToken = () => {
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("accessToken")
    );
};


// ============================================================
// HEADERS
// ============================================================

const getHeaders = () => {

    const token = getToken();

    return {
        "Content-Type": "application/json",

        ...(token
            ? {
                Authorization:
                    `Bearer ${token}`,
            }
            : {}),
    };
};


// ============================================================
// EMPTY FORM
// ============================================================

const emptyForm = {
    fullName: "",
    email: "",
    phone: "",
    linkedin: "",
    portfolio: "",
    coverLetter: "",
};


// ============================================================
// APPLICATION COMPONENT
// ============================================================

export default function Application() {

    const {
        jobId,
    } = useParams();

    const navigate =
        useNavigate();


    // ========================================================
    // STATES
    // ========================================================

    const [job, setJob] =
        useState(null);

    const [form, setForm] =
        useState(emptyForm);

    const [resume, setResume] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [resumeLoading, setResumeLoading] =
        useState(true);

    const [resumeUploading, setResumeUploading] =
        useState(false);

    const [submitting, setSubmitting] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");


    // ========================================================
    // FILE INPUT REF
    // ========================================================

    const resumeInputRef =
        useRef(null);


    // ========================================================
    // LOGOUT
    // ========================================================

    const logout = () => {

        localStorage.removeItem("token");
        localStorage.removeItem("authToken");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");

        navigate("/login");
    };


    // ========================================================
    // LOAD JOB
    // ========================================================

    const loadJob = async () => {

        if (!jobId) {

            setError(
                "Invalid job ID."
            );

            setLoading(false);

            return;
        }

        const token =
            getToken();

        if (!token) {

            logout();

            return;
        }

        try {

            const response =
                await fetch(
                    `${API_BASE}/jobs/${jobId}`,
                    {
                        method: "GET",
                        headers:
                            getHeaders(),
                    }
                );


            if (
                response.status === 401
            ) {

                logout();

                return;
            }


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to load job."
                );
            }


            setJob(
                data.job ||
                data.data ||
                data
            );


        } catch (err) {

            console.error(
                "LOAD JOB ERROR:",
                err
            );

            setError(
                err.message ||
                "Unable to load job."
            );


        } finally {

            setLoading(false);
        }
    };


    // ========================================================
    // EXTRACT RESUME
    // ========================================================

    const extractResume = (
        data
    ) => {

        const possibleResume =
            data?.resume ||
            data?.data?.resume ||
            data?.profile?.resume ||
            data?.data?.profile?.resume ||
            data?.candidate?.resume ||
            data?.user?.resume ||
            null;


        if (
            possibleResume &&
            typeof possibleResume === "object"
        ) {

            return {

                fileId:
                    possibleResume.fileId ||
                    possibleResume._id ||
                    "",

                fileName:
                    possibleResume.fileName ||
                    possibleResume.filename ||
                    possibleResume.originalName ||
                    possibleResume.name ||
                    "",

                fileUrl:
                    possibleResume.fileUrl ||
                    possibleResume.url ||
                    possibleResume.path ||
                    "",

                mimeType:
                    possibleResume.mimeType ||
                    "",

                fileSize:
                    possibleResume.fileSize ||
                    0,

                uploadedAt:
                    possibleResume.uploadedAt ||
                    null,
            };
        }


        return null;
    };


    // ========================================================
    // LOAD CANDIDATE RESUME
    // ========================================================

    const loadResume = async () => {

        const token =
            getToken();

        if (!token) {

            logout();

            return;
        }


        setResumeLoading(true);


        try {

            const response =
                await fetch(
                    `${API_BASE}/resumes`,
                    {
                        method: "GET",
                        headers:
                            getHeaders(),
                    }
                );


            if (
                response.status === 401
            ) {

                logout();

                return;
            }


            const data =
                await response.json();


            console.log(
                "RESUME API RESPONSE:",
                data
            );


            if (!response.ok) {

                setResume(null);

                return;
            }


            const extractedResume =
                extractResume(data);


            setResume(
                extractedResume
            );


        } catch (err) {

            console.error(
                "LOAD RESUME ERROR:",
                err
            );

            setResume(null);


        } finally {

            setResumeLoading(false);
        }
    };


    // ========================================================
    // LOAD USER
    // ========================================================

    const loadUser = () => {

        try {

            const storedUser =
                localStorage.getItem("user");


            if (!storedUser) {
                return;
            }


            const user =
                JSON.parse(
                    storedUser
                );


            setForm(
                (previous) => ({
                    ...previous,

                    fullName:
                        user.fullName ||
                        user.name ||
                        user.username ||
                        previous.fullName,

                    email:
                        user.email ||
                        previous.email,

                    phone:
                        user.phone ||
                        previous.phone,

                    linkedin:
                        user.linkedin ||
                        previous.linkedin,

                    portfolio:
                        user.portfolio ||
                        previous.portfolio,
                })
            );


        } catch (err) {

            console.error(
                "USER PARSE ERROR:",
                err
            );
        }
    };


    // ========================================================
    // INITIAL LOAD
    // ========================================================

    useEffect(() => {

        loadJob();

        loadResume();

        loadUser();

    }, [jobId]);


    // ========================================================
    // FORM CHANGE
    // ========================================================

    const handleChange = (
        event
    ) => {

        const {
            name,
            value,
        } = event.target;


        setForm(
            (previous) => ({
                ...previous,
                [name]: value,
            })
        );
    };


    // ========================================================
    // OPEN FILE EXPLORER
    // ========================================================

    const openResumePicker = () => {

        if (resumeUploading) {
            return;
        }

        if (resumeInputRef.current) {

            resumeInputRef.current.click();
        }
    };


    // ========================================================
    // UPLOAD RESUME
    // ========================================================

    const handleResumeUpload = async (
        event
    ) => {

        const file =
            event.target.files?.[0];


        if (!file) {
            return;
        }


        setError("");
        setSuccess("");


        // ----------------------------------------------------
        // ALLOWED FILE TYPES
        // ----------------------------------------------------

        const allowedTypes = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];


        const fileName =
            file.name.toLowerCase();


        const validExtension =
            fileName.endsWith(".pdf") ||
            fileName.endsWith(".doc") ||
            fileName.endsWith(".docx");


        if (
            !allowedTypes.includes(
                file.type
            ) &&
            !validExtension
        ) {

            setError(
                "Please select a PDF, DOC, or DOCX resume."
            );

            event.target.value = "";

            return;
        }


        // ----------------------------------------------------
        // MAX 5 MB
        // ----------------------------------------------------

        const maxSize =
            5 * 1024 * 1024;


        if (file.size > maxSize) {

            setError(
                "Resume file must be smaller than 5 MB."
            );

            event.target.value = "";

            return;
        }


        const token =
            getToken();


        if (!token) {

            logout();

            return;
        }


        // ----------------------------------------------------
        // UPLOAD
        // ----------------------------------------------------

        const formData =
            new FormData();


        formData.append(
            "resume",
            file
        );


        setResumeUploading(true);


        try {

            const response =
                await fetch(
                    `${API_BASE}/resumes/upload`,
                    {
                        method: "POST",

                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                        },

                        body:
                            formData,
                    }
                );


            if (
                response.status === 401
            ) {

                logout();

                return;
            }


            const data =
                await response.json();


            console.log(
                "RESUME UPLOAD RESPONSE:",
                data
            );


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to upload resume."
                );
            }


            const uploadedResume =
                data.resume ||
                data.data?.resume;


            if (!uploadedResume) {

                throw new Error(
                    "Resume uploaded but no file information was returned."
                );
            }


            setResume({

                fileId:
                    uploadedResume.fileId ||
                    uploadedResume._id ||
                    "",

                fileName:
                    uploadedResume.fileName ||
                    uploadedResume.originalName ||
                    file.name,

                fileUrl:
                    uploadedResume.fileUrl ||
                    "",

                mimeType:
                    uploadedResume.mimeType ||
                    file.type,

                fileSize:
                    uploadedResume.fileSize ||
                    file.size,

                uploadedAt:
                    uploadedResume.uploadedAt ||
                    new Date().toISOString(),
            });


            setSuccess(
                "Resume uploaded successfully."
            );


        } catch (err) {

            console.error(
                "RESUME UPLOAD ERROR:",
                err
            );


            setError(
                err.message ||
                "Unable to upload resume."
            );


        } finally {

            setResumeUploading(false);

            event.target.value = "";
        }
    };


    // ========================================================
    // RESUME URL
    // ========================================================

    const getResumeUrl = () => {

        if (!resume?.fileUrl) {
            return "";
        }


        if (
            resume.fileUrl.startsWith(
                "http://"
            ) ||
            resume.fileUrl.startsWith(
                "https://"
            )
        ) {

            return resume.fileUrl;
        }


        return (
            `${SERVER_BASE}` +
            (
                resume.fileUrl.startsWith("/")
                    ? resume.fileUrl
                    : `/${resume.fileUrl}`
            )
        );
    };


    // ========================================================
    // FORMAT FILE SIZE
    // ========================================================

    const formatFileSize = (
        bytes
    ) => {

        if (!bytes) {
            return "";
        }


        if (bytes < 1024) {
            return `${bytes} B`;
        }


        if (
            bytes <
            1024 * 1024
        ) {

            return `${(
                bytes / 1024
            ).toFixed(1)} KB`;
        }


        return `${(
            bytes /
            (1024 * 1024)
        ).toFixed(1)} MB`;
    };


    // ========================================================
    // DATE
    // ========================================================

    const formatDate = (
        date
    ) => {

        if (!date) {
            return "Recently";
        }


        const parsed =
            new Date(date);


        if (
            Number.isNaN(
                parsed.getTime()
            )
        ) {

            return "Recently";
        }


        return parsed.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
            }
        );
    };


    // ========================================================
    // SUBMIT APPLICATION
    // ========================================================

    const handleSubmit = async (
        event
    ) => {

        event.preventDefault();


        setError("");

        setSuccess("");


        // ----------------------------------------------------
        // VALIDATION
        // ----------------------------------------------------

        if (!form.fullName.trim()) {

            setError(
                "Full name is required."
            );

            return;
        }


        if (!form.email.trim()) {

            setError(
                "Email is required."
            );

            return;
        }


        if (!form.phone.trim()) {

            setError(
                "Phone number is required."
            );

            return;
        }


        if (!jobId) {

            setError(
                "Invalid job."
            );

            return;
        }


        if (
            !resume?.fileId &&
            !resume?.fileUrl
        ) {

            setError(
                "Please add your resume before submitting the application."
            );

            return;
        }


        const token =
            getToken();


        if (!token) {

            logout();

            return;
        }


        // ----------------------------------------------------
        // RESUME DATA
        // ----------------------------------------------------

        const resumeData = {

            fileId:
                resume?.fileId ||
                "",

            fileName:
                resume?.fileName ||
                "",

            fileUrl:
                resume?.fileUrl ||
                "",

            mimeType:
                resume?.mimeType ||
                "",

            fileSize:
                resume?.fileSize ||
                0,

            uploadedAt:
                resume?.uploadedAt ||
                null,
        };


        console.log(
            "SUBMITTING RESUME:",
            resumeData
        );


        // ----------------------------------------------------
        // APPLICATION PAYLOAD
        // ----------------------------------------------------

        const payload = {

            job: jobId,

            fullName:
                form.fullName.trim(),

            email:
                form.email
                    .trim()
                    .toLowerCase(),

            phone:
                form.phone.trim(),

            linkedin:
                form.linkedin.trim(),

            portfolio:
                form.portfolio.trim(),

            resume:
                resumeData,

            coverLetter:
                form.coverLetter.trim(),
        };


        console.log(
            "APPLICATION PAYLOAD:",
            payload
        );


        setSubmitting(true);


        try {

            const response =
                await fetch(
                    `${API_BASE}/applications`,
                    {
                        method: "POST",

                        headers:
                            getHeaders(),

                        body:
                            JSON.stringify(
                                payload
                            ),
                    }
                );


            if (
                response.status === 401
            ) {

                logout();

                return;
            }


            const data =
                await response.json();


            console.log(
                "APPLICATION RESPONSE:",
                data
            );


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Failed to submit application."
                );
            }


            setSuccess(
                "Application submitted successfully!"
            );


            setTimeout(() => {

                navigate(
                    "/applications"
                );

            }, 1200);


        } catch (err) {

            console.error(
                "SUBMIT APPLICATION ERROR:",
                err
            );


            setError(
                err.message ||
                "Unable to submit application."
            );


        } finally {

            setSubmitting(false);
        }
    };


    // ========================================================
    // LOADING
    // ========================================================

    if (loading) {

        return (

            <div className="application-loading">

                <div className="application-loader"></div>

                <h3>
                    Loading application...
                </h3>

                <p>
                    Preparing the job application.
                </p>

            </div>
        );
    }


    // ========================================================
    // PAGE
    // ========================================================

    return (

        <div className="application-page">


            {/* ==================================================
                HEADER
            ================================================== */}

            <section className="application-header">

                <div className="application-container">

                    <button
                        type="button"
                        className="application-back-btn"
                        onClick={() =>
                            navigate(
                                `/jobs/${jobId}`
                            )
                        }
                    >
                        ← Back to Job
                    </button>


                    <span className="application-eyebrow">
                        TALENTIQ APPLICATION
                    </span>


                    <h1>
                        Apply for this position
                    </h1>


                    <p>
                        Complete your application
                        and submit it directly to
                        the recruiter.
                    </p>

                </div>

            </section>


            {/* ==================================================
                MAIN
            ================================================== */}

            <main className="application-container">


                {/* ==================================================
                    ALERTS
                ================================================== */}

                {error && (

                    <div className="application-alert application-alert-error">

                        <span>
                            !
                        </span>

                        <p>
                            {error}
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                setError("")
                            }
                        >
                            ×
                        </button>

                    </div>
                )}


                {success && (

                    <div className="application-alert application-alert-success">

                        <span>
                            ✓
                        </span>

                        <p>
                            {success}
                        </p>

                    </div>
                )}


                <div className="application-layout">


                    {/* ==================================================
                        JOB SUMMARY
                    ================================================== */}

                    <aside className="application-job-card">

                        <div className="application-job-icon">
                            💼
                        </div>


                        <h2>
                            {job?.title ||
                                "Job Position"}
                        </h2>


                        <p className="application-company">

                            {job?.companyName ||
                                job?.company ||
                                "Company"}

                        </p>


                        <div className="application-job-details">

                            <span>
                                📍{" "}
                                {job?.location ||
                                    "Location not specified"}
                            </span>


                            <span>
                                💼{" "}
                                {job?.type ||
                                    job?.jobType ||
                                    "Full Time"}
                            </span>


                            <span>
                                🏠{" "}
                                {job?.mode ||
                                    job?.workMode ||
                                    "On-site"}
                            </span>


                            <span>
                                👤{" "}
                                {job?.experience ||
                                    "Experience not specified"}
                            </span>

                        </div>


                        {job?.salary && (

                            <div className="application-salary">

                                💰 {job.salary}

                            </div>
                        )}

                    </aside>


                    {/* ==================================================
                        FORM
                    ================================================== */}

                    <section className="application-form-card">


                        <div className="application-form-heading">

                            <span>
                                APPLICATION DETAILS
                            </span>


                            <h2>
                                Submit your application
                            </h2>


                            <p>
                                Add your resume and
                                complete your application
                                details.
                            </p>

                        </div>


                        <form
                            onSubmit={
                                handleSubmit
                            }
                        >


                            {/* ==================================================
                                PERSONAL INFORMATION
                            ================================================== */}

                            <div className="application-form-section">

                                <h3>
                                    Personal Information
                                </h3>


                                <div className="application-form-grid">


                                    <div className="application-field full">

                                        <label>
                                            Full Name
                                            <span>*</span>
                                        </label>


                                        <input
                                            type="text"
                                            name="fullName"
                                            value={
                                                form.fullName
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="Enter your full name"
                                        />

                                    </div>


                                    <div className="application-field">

                                        <label>
                                            Email
                                            <span>*</span>
                                        </label>


                                        <input
                                            type="email"
                                            name="email"
                                            value={
                                                form.email
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="you@example.com"
                                        />

                                    </div>


                                    <div className="application-field">

                                        <label>
                                            Phone
                                            <span>*</span>
                                        </label>


                                        <input
                                            type="tel"
                                            name="phone"
                                            value={
                                                form.phone
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="9876543210"
                                        />

                                    </div>

                                </div>

                            </div>


                            {/* ==================================================
                                PROFESSIONAL LINKS
                            ================================================== */}

                            <div className="application-form-section">

                                <h3>
                                    Professional Links
                                </h3>


                                <div className="application-form-grid">


                                    <div className="application-field">

                                        <label>
                                            LinkedIn
                                        </label>


                                        <input
                                            type="url"
                                            name="linkedin"
                                            value={
                                                form.linkedin
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="https://linkedin.com/in/..."
                                        />

                                    </div>


                                    <div className="application-field">

                                        <label>
                                            Portfolio
                                        </label>


                                        <input
                                            type="url"
                                            name="portfolio"
                                            value={
                                                form.portfolio
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="https://yourportfolio.com"
                                        />

                                    </div>

                                </div>

                            </div>


                            {/* ==================================================
                                UPDATED RESUME SECTION
                            ================================================== */}

                            <div className="application-form-section">

                                <h3>
                                    Resume
                                </h3>


                                <input
                                    ref={
                                        resumeInputRef
                                    }
                                    type="file"
                                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                    onChange={
                                        handleResumeUpload
                                    }
                                    style={{
                                        display: "none",
                                    }}
                                />


                                {resumeLoading ? (

                                    <div className="application-resume-loading">

                                        <div className="small-spinner"></div>

                                        <span>
                                            Loading your resume...
                                        </span>

                                    </div>

                                ) : resume?.fileName ? (

                                    <div className="application-resume-card">


                                        <div className="application-resume-left">

                                            <div className="application-resume-icon">
                                                📄
                                            </div>


                                            <div>

                                                <strong>
                                                    {resume.fileName}
                                                </strong>

                                                <span>
                                                    Resume attached to this application
                                                </span>

                                                {resume.fileSize > 0 && (

                                                    <small>
                                                        {formatFileSize(
                                                            resume.fileSize
                                                        )}
                                                    </small>
                                                )}

                                            </div>

                                        </div>


                                        <div className="application-resume-actions">


                                            {resume.fileUrl && (

                                                <a
                                                    href={
                                                        getResumeUrl()
                                                    }
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="application-resume-view"
                                                >
                                                    View Resume
                                                </a>
                                            )}


                                            <button
                                                type="button"
                                                className="application-resume-change"
                                                onClick={
                                                    openResumePicker
                                                }
                                                disabled={
                                                    resumeUploading
                                                }
                                            >
                                                {resumeUploading
                                                    ? "Uploading..."
                                                    : "Change Resume"}
                                            </button>

                                        </div>

                                    </div>

                                ) : (

                                    <div className="application-resume-warning">


                                        <div className="application-resume-warning-icon">
                                            !
                                        </div>


                                        <div className="application-resume-warning-content">

                                            <strong>
                                                No resume added
                                            </strong>


                                            <p>
                                                Upload your resume
                                                file to apply for
                                                this position.
                                            </p>


                                            <button
                                                type="button"
                                                className="application-add-resume-btn"
                                                onClick={
                                                    openResumePicker
                                                }
                                                disabled={
                                                    resumeUploading
                                                }
                                            >

                                                {resumeUploading ? (

                                                    <>
                                                        <span className="small-spinner"></span>
                                                        Uploading Resume...
                                                    </>

                                                ) : (

                                                    <>
                                                        📎 Add Resume File
                                                    </>
                                                )}

                                            </button>


                                            <small>
                                                PDF, DOC or DOCX • Maximum 5 MB
                                            </small>

                                        </div>

                                    </div>
                                )}

                            </div>


                            {/* ==================================================
                                COVER LETTER
                            ================================================== */}

                            <div className="application-form-section">

                                <h3>
                                    Cover Letter
                                </h3>


                                <div className="application-field">

                                    <label>
                                        Cover Letter
                                    </label>


                                    <textarea
                                        name="coverLetter"
                                        value={
                                            form.coverLetter
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        rows="8"
                                        placeholder="Tell the recruiter why you are a good fit for this position..."
                                    />

                                </div>

                            </div>


                            {/* ==================================================
                                SUBMIT
                            ================================================== */}

                            <div className="application-submit-area">


                                <button
                                    type="button"
                                    className="application-cancel-btn"
                                    onClick={() =>
                                        navigate(
                                            `/jobs/${jobId}`
                                        )
                                    }
                                    disabled={
                                        submitting ||
                                        resumeUploading
                                    }
                                >
                                    Cancel
                                </button>


                                <button
                                    type="submit"
                                    className="application-submit-btn"
                                    disabled={
                                        submitting ||
                                        resumeLoading ||
                                        resumeUploading ||
                                        !resume?.fileName
                                    }
                                >

                                    {submitting ? (

                                        <>
                                            <span className="submit-spinner"></span>

                                            Submitting...
                                        </>

                                    ) : (

                                        <>
                                            Submit Application

                                            <span>
                                                →
                                            </span>
                                        </>
                                    )}

                                </button>

                            </div>

                        </form>

                    </section>

                </div>

            </main>

        </div>
    );
}