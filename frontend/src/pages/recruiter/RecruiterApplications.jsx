import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import "../../styles/RecruiterApplication.css";

// ============================================================
// API
// ============================================================

const API_BASE_URL =
    "http://localhost:5000";

// ============================================================
// APPLICATION STATUSES
// ============================================================

const APPLICATION_STATUSES = [
    "Applied",
    "Under Review",
    "Under Consideration",
    "Shortlisted",
    "Interview",
    "Selected",
    "Rejected",
    "No Longer Under Consideration",
];

// ============================================================
// INTERVIEW TIME SLOTS
// ============================================================

const INTERVIEW_TIME_SLOTS = [
    {
        value: "09:00",
        label: "09:00 AM - 10:00 AM",
        startTime: "09:00",
        endTime: "10:00",
    },
    {
        value: "10:00",
        label: "10:00 AM - 11:00 AM",
        startTime: "10:00",
        endTime: "11:00",
    },
    {
        value: "11:00",
        label: "11:00 AM - 12:00 PM",
        startTime: "11:00",
        endTime: "12:00",
    },
    {
        value: "13:00",
        label: "01:00 PM - 02:00 PM",
        startTime: "13:00",
        endTime: "14:00",
    },
    {
        value: "14:00",
        label: "02:00 PM - 03:00 PM",
        startTime: "14:00",
        endTime: "15:00",
    },
    {
        value: "15:00",
        label: "03:00 PM - 04:00 PM",
        startTime: "15:00",
        endTime: "16:00",
    },
    {
        value: "16:00",
        label: "04:00 PM - 05:00 PM",
        startTime: "16:00",
        endTime: "17:00",
    },
];

// ============================================================
// EMPTY INTERVIEW FORM
// ============================================================

const emptyInterviewForm = {
    date: "",
    timeSlot: "",
    meetLink: "",
};

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
// RESPONSE PARSER
// ============================================================

const parseResponse = async (
    response
) => {
    const text =
        await response.text();

    if (!text) {
        return {};
    }

    try {
        return JSON.parse(text);
    } catch {
        return {
            success: false,
            message: text,
        };
    }
};

// ============================================================
// SAFE TEXT
// ============================================================

const safeText = (
    value,
    fallback = ""
) => {
    if (
        value === null ||
        value === undefined
    ) {
        return fallback;
    }

    if (
        typeof value === "object"
    ) {
        return fallback;
    }

    const text =
        String(value).trim();

    return text || fallback;
};

// ============================================================
// NUMBER
// ============================================================

const safeNumber = (
    value,
    fallback = 0
) => {
    const number =
        Number(value);

    if (
        !Number.isFinite(
            number
        )
    ) {
        return fallback;
    }

    return Math.max(
        0,
        Math.min(
            100,
            number
        )
    );
};

// ============================================================
// CANDIDATE
// ============================================================

const getCandidateName = (
    application
) => {
    return (
        safeText(
            application?.fullName
        ) ||
        safeText(
            application?.candidate
                ?.fullName
        ) ||
        safeText(
            application?.candidate
                ?.name
        ) ||
        safeText(
            application?.candidate
                ?.username
        ) ||
        "Candidate"
    );
};

// ============================================================
// JOB
// ============================================================

const getJobTitle = (
    application
) => {
    return (
        safeText(
            application?.job
                ?.title
        ) ||
        safeText(
            application?.jobTitle
        ) ||
        "Job Position"
    );
};

// ============================================================
// COMPANY
// ============================================================

const getCompanyName = (
    application
) => {
    return (
        safeText(
            application?.job
                ?.companyName
        ) ||
        safeText(
            application?.job
                ?.company
        ) ||
        safeText(
            application?.company
        ) ||
        "Company"
    );
};

// ============================================================
// LOCATION
// ============================================================

const getLocation = (
    application
) => {
    return (
        safeText(
            application?.job
                ?.location
        ) ||
        safeText(
            application?.location
        ) ||
        "Location not specified"
    );
};

// ============================================================
// EXPERIENCE
// ============================================================

const getExperience = (
    application
) => {
    return (
        safeText(
            application?.job
                ?.experienceRequired
        ) ||
        safeText(
            application?.job
                ?.experience
        ) ||
        "Not specified"
    );
};

// ============================================================
// STATUS CLASS
// ============================================================

const getStatusClass = (
    status
) => {
    return String(
        status || ""
    )
        .toLowerCase()
        .replace(
            /\s+/g,
            "-"
        );
};

// ============================================================
// DATE
// ============================================================

const formatInterviewDate = (
    value
) => {
    if (!value) {
        return "Date not available";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return String(value);
    }

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }
    );
};

// ============================================================
// DAY
// ============================================================

const formatInterviewDay = (
    value
) => {
    if (!value) {
        return "";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }

    return date.toLocaleDateString(
        "en-IN",
        {
            weekday: "long",
        }
    );
};

// ============================================================
// TIME
// ============================================================

const formatTime = (
    value
) => {
    if (!value) {
        return "";
    }

    const parts =
        String(value).split(
            ":"
        );

    if (
        parts.length < 2
    ) {
        return String(value);
    }

    const hours =
        Number(parts[0]);

    const minutes =
        Number(parts[1]);

    if (
        Number.isNaN(
            hours
        ) ||
        Number.isNaN(
            minutes
        )
    ) {
        return String(value);
    }

    const period =
        hours >= 12
            ? "PM"
            : "AM";

    const displayHour =
        hours % 12 === 0
            ? 12
            : hours % 12;

    return `${String(
        displayHour
    ).padStart(
        2,
        "0"
    )}:${String(
        minutes
    ).padStart(
        2,
        "0"
    )} ${period}`;
};

// ============================================================
// INTERVIEW CHECK
// ============================================================

const hasInterviewScheduled = (
    application
) => {
    const interview =
        application?.interview;

    return Boolean(
        interview?.scheduled ===
            true &&
            interview?.date &&
            interview?.startTime &&
            interview?.endTime &&
            interview?.meetLink
    );
};

// ============================================================
// ATS METRIC
// ============================================================

const ATSMetric = ({
    label,
    value,
    weight,
}) => {
    const numericValue =
        safeNumber(value);

    return (
        <div className="ats-metric-card">
            <div className="ats-metric-top">
                <div>
                    <span>
                        {label}
                    </span>

                    {weight && (
                        <small>
                            Weight{" "}
                            {weight}%
                        </small>
                    )}
                </div>

                <strong>
                    {Number.isInteger(
                        numericValue
                    )
                        ? numericValue
                        : numericValue.toFixed(
                              2
                          )}
                    %
                </strong>
            </div>

            <div className="ats-progress">
                <div
                    className="ats-progress-bar"
                    style={{
                        width: `${numericValue}%`,
                    }}
                />
            </div>
        </div>
    );
};

// ============================================================
// ATS LIST
// ============================================================

const ATSListSection = ({
    title,
    items,
    danger = false,
}) => {
    const safeItems =
        Array.isArray(items)
            ? items
            : [];

    return (
        <div className="ats-list-section">
            <div className="ats-section-title">
                <span>
                    {title}
                </span>

                <span className="ats-item-count">
                    {
                        safeItems.length
                    }
                </span>
            </div>

            {safeItems.length ===
            0 ? (
                <div className="ats-empty-list">
                    No items found.
                </div>
            ) : (
                <div className="tag-list">
                    {safeItems.map(
                        (
                            item,
                            index
                        ) => (
                            <span
                                key={`${item}-${index}`}
                                className={
                                    danger
                                        ? "tag tag-danger"
                                        : "tag"
                                }
                            >
                                {safeText(
                                    item,
                                    "Unknown"
                                )}
                            </span>
                        )
                    )}
                </div>
            )}
        </div>
    );
};

// ============================================================
// MAIN
// ============================================================

const RecruiterApplications =
    () => {
        const [
            applications,
            setApplications,
        ] = useState([]);

        const [
            loading,
            setLoading,
        ] = useState(true);

        const [
            pageError,
            setPageError,
        ] = useState("");

        // ====================================================
        // ATS
        // ====================================================

        const [
            atsModalOpen,
            setAtsModalOpen,
        ] = useState(false);

        const [
            atsLoading,
            setAtsLoading,
        ] = useState(false);

        const [
            atsError,
            setAtsError,
        ] = useState("");

        const [
            atsResult,
            setAtsResult,
        ] = useState(null);

        const [
            atsDetails,
            setAtsDetails,
        ] = useState(null);

        const [
            selectedApplication,
            setSelectedApplication,
        ] = useState(null);

        // ====================================================
        // INTERVIEW
        // ====================================================

        const [
            interviewModalOpen,
            setInterviewModalOpen,
        ] = useState(false);

        const [
            interviewApplication,
            setInterviewApplication,
        ] = useState(null);

        const [
            interviewForm,
            setInterviewForm,
        ] = useState(
            emptyInterviewForm
        );

        const [
            interviewFormError,
            setInterviewFormError,
        ] = useState("");

        const [
            schedulingInterview,
            setSchedulingInterview,
        ] = useState(false);

        // ====================================================
        // STATUS
        // ====================================================

        const [
            updatingStatusId,
            setUpdatingStatusId,
        ] = useState(null);

        // ====================================================
        // FETCH
        // ====================================================

        const fetchApplications =
            useCallback(
                async () => {
                    const token =
                        getToken();

                    if (!token) {
                        setApplications(
                            []
                        );

                        setLoading(
                            false
                        );

                        setPageError(
                            "Authentication token not found. Please login again."
                        );

                        return;
                    }

                    try {
                        setPageError(
                            ""
                        );

                        const response =
                            await fetch(
                                `${API_BASE_URL}/api/applications/recruiter`,
                                {
                                    headers: {
                                        Authorization: `Bearer ${token}`,
                                        "Content-Type":
                                            "application/json",
                                    },
                                }
                            );

                        const data =
                            await parseResponse(
                                response
                            );

                        if (
                            !response.ok
                        ) {
                            throw new Error(
                                data?.message ||
                                    `Failed to fetch applications (${response.status})`
                            );
                        }

                        setApplications(
                            Array.isArray(
                                data?.applications
                            )
                                ? data.applications
                                : []
                        );
                    } catch (error) {
                        console.error(
                            "GET RECRUITER APPLICATIONS ERROR:",
                            error
                        );

                        setPageError(
                            error?.message ||
                                "Failed to load applications."
                        );
                    } finally {
                        setLoading(
                            false
                        );
                    }
                },
                []
            );

        useEffect(() => {
            fetchApplications();
        }, [
            fetchApplications,
        ]);

        // ====================================================
        // OPEN ATS
        // ====================================================

        const openATS = async (
            application
        ) => {
            const token =
                getToken();

            if (!token) {
                alert(
                    "Authentication token not found. Please login again."
                );
                return;
            }

            setSelectedApplication(
                application
            );

            setAtsModalOpen(
                true
            );

            setAtsLoading(
                true
            );

            setAtsError(
                ""
            );

            setAtsResult(
                null
            );

            setAtsDetails(
                null
            );

            try {
                const response =
                    await fetch(
                        `${API_BASE_URL}/api/applications/${application._id}/ats`,
                        {
                            method: "GET",
                            headers: {
                                Authorization: `Bearer ${token}`,
                                "Content-Type":
                                    "application/json",
                            },
                        }
                    );

                const data =
                    await parseResponse(
                        response
                    );

                if (
                    !response.ok
                ) {
                    throw new Error(
                        data?.message ||
                            `ATS request failed (${response.status})`
                    );
                }

                setAtsResult(
                    data?.ats ||
                        data?.result ||
                        null
                );

                setAtsDetails(
                    data?.details ||
                        null
                );
            } catch (error) {
                console.error(
                    "ATS ANALYSIS ERROR:",
                    error
                );

                setAtsError(
                    error?.message ||
                        "Failed to analyze resume."
                );
            } finally {
                setAtsLoading(
                    false
                );
            }
        };

        // ====================================================
        // CLOSE ATS
        // ====================================================

        const closeATS = () => {
            setAtsModalOpen(
                false
            );

            setAtsLoading(
                false
            );

            setAtsError(
                ""
            );

            setAtsResult(
                null
            );

            setAtsDetails(
                null
            );

            setSelectedApplication(
                null
            );
        };

        // ====================================================
        // RECHECK ATS
        // ====================================================

        const recheckATS =
            async () => {
                if (
                    !selectedApplication?._id
                ) {
                    return;
                }

                const token =
                    getToken();

                if (!token) {
                    setAtsError(
                        "Authentication token not found."
                    );
                    return;
                }

                setAtsLoading(
                    true
                );

                setAtsError(
                    ""
                );

                try {
                    const response =
                        await fetch(
                            `${API_BASE_URL}/api/applications/${selectedApplication._id}/ats`,
                            {
                                method: "PATCH",
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                    "Content-Type":
                                        "application/json",
                                },
                            }
                        );

                    const data =
                        await parseResponse(
                            response
                        );

                    if (
                        !response.ok
                    ) {
                        throw new Error(
                            data?.message ||
                                `ATS recheck failed (${response.status})`
                        );
                    }

                    setAtsResult(
                        data?.ats ||
                            data?.result ||
                            null
                    );

                    setAtsDetails(
                        data?.details ||
                            null
                    );

                    await fetchApplications();
                } catch (error) {
                    console.error(
                        "ATS RECHECK ERROR:",
                        error
                    );

                    setAtsError(
                        error?.message ||
                            "Failed to recheck ATS."
                    );
                } finally {
                    setAtsLoading(
                        false
                    );
                }
            };

        // ====================================================
        // STATUS
        // ====================================================

        const updateApplicationStatus =
            async (
                applicationId,
                newStatus
            ) => {
                const token =
                    getToken();

                if (!token) {
                    alert(
                        "Authentication token not found. Please login again."
                    );
                    return;
                }

                setUpdatingStatusId(
                    applicationId
                );

                try {
                    const response =
                        await fetch(
                            `${API_BASE_URL}/api/applications/${applicationId}/status`,
                            {
                                method: "PATCH",
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                    "Content-Type":
                                        "application/json",
                                },
                                body: JSON.stringify(
                                    {
                                        status:
                                            newStatus,
                                    }
                                ),
                            }
                        );

                    const data =
                        await parseResponse(
                            response
                        );

                    if (
                        !response.ok
                    ) {
                        throw new Error(
                            data?.message ||
                                `Failed to update status (${response.status})`
                        );
                    }

                    await fetchApplications();
                } catch (error) {
                    console.error(
                        "UPDATE STATUS ERROR:",
                        error
                    );

                    alert(
                        error?.message ||
                            "Failed to update application status."
                    );
                } finally {
                    setUpdatingStatusId(
                        null
                    );
                }
            };

        // ====================================================
        // OPEN INTERVIEW
        // ====================================================

        const openInterviewModal =
            (
                application
            ) => {
                if (
                    String(
                        application?.status ||
                            ""
                    ).trim() !==
                    "Interview"
                ) {
                    alert(
                        'Interview scheduling is available only when the application status is "Interview".'
                    );

                    return;
                }

                const existing =
                    application?.interview;

                let dateValue =
                    "";

                if (
                    existing?.date
                ) {
                    const date =
                        new Date(
                            existing.date
                        );

                    if (
                        !Number.isNaN(
                            date.getTime()
                        )
                    ) {
                        dateValue =
                            date
                                .toISOString()
                                .slice(
                                    0,
                                    10
                                );
                    }
                }

                const startTime =
                    safeText(
                        existing?.startTime
                    );

                const matchingSlot =
                    INTERVIEW_TIME_SLOTS.find(
                        (
                            slot
                        ) =>
                            slot.startTime ===
                            startTime
                    );

                setInterviewApplication(
                    application
                );

                setInterviewForm({
                    date: dateValue,
                    timeSlot:
                        matchingSlot
                            ? matchingSlot.value
                            : startTime,
                    meetLink:
                        safeText(
                            existing?.meetLink
                        ),
                });

                setInterviewFormError(
                    ""
                );

                setInterviewModalOpen(
                    true
                );
            };

        // ====================================================
        // CLOSE INTERVIEW
        // ====================================================

        const closeInterviewModal =
            () => {
                if (
                    schedulingInterview
                ) {
                    return;
                }

                setInterviewModalOpen(
                    false
                );

                setInterviewApplication(
                    null
                );

                setInterviewForm(
                    emptyInterviewForm
                );

                setInterviewFormError(
                    ""
                );
            };

        // ====================================================
        // FORM CHANGE
        // ====================================================

        const handleInterviewFormChange =
            (
                event
            ) => {
                const {
                    name,
                    value,
                } =
                    event.target;

                setInterviewForm(
                    (
                        previous
                    ) => ({
                        ...previous,
                        [name]:
                            value,
                    })
                );

                setInterviewFormError(
                    ""
                );
            };

        // ====================================================
        // SCHEDULE INTERVIEW
        // ====================================================

        const handleScheduleInterview =
            async (
                event
            ) => {
                event.preventDefault();

                if (
                    !interviewApplication?._id
                ) {
                    setInterviewFormError(
                        "Application information is missing."
                    );
                    return;
                }

                if (
                    String(
                        interviewApplication?.status ||
                            ""
                    ).trim() !==
                    "Interview"
                ) {
                    setInterviewFormError(
                        'The application must have status "Interview" before scheduling.'
                    );

                    return;
                }

                if (
                    !interviewForm.date
                ) {
                    setInterviewFormError(
                        "Please select an interview date."
                    );

                    return;
                }

                if (
                    !interviewForm.timeSlot
                ) {
                    setInterviewFormError(
                        "Please select an interview time."
                    );

                    return;
                }

                const selectedSlot =
                    INTERVIEW_TIME_SLOTS.find(
                        (
                            slot
                        ) =>
                            slot.value ===
                            interviewForm.timeSlot
                    );

                if (
                    !selectedSlot
                ) {
                    setInterviewFormError(
                        "Please select a valid interview time."
                    );

                    return;
                }

                const meetLink =
                    String(
                        interviewForm.meetLink ||
                            ""
                    ).trim();

                if (
                    !meetLink
                ) {
                    setInterviewFormError(
                        "Please enter the Google Meet link."
                    );

                    return;
                }

                try {
                    const url =
                        new URL(
                            meetLink
                        );

                    if (
                        url.protocol !==
                            "https:" ||
                        url.hostname !==
                            "meet.google.com"
                    ) {
                        throw new Error(
                            "invalid"
                        );
                    }
                } catch {
                    setInterviewFormError(
                        "Please enter a valid Google Meet URL."
                    );

                    return;
                }

                const token =
                    getToken();

                if (!token) {
                    setInterviewFormError(
                        "Authentication token not found. Please login again."
                    );

                    return;
                }

                setSchedulingInterview(
                    true
                );

                try {
                    const response =
                        await fetch(
                            `${API_BASE_URL}/api/applications/${interviewApplication._id}/interview`,
                            {
                                method: "PATCH",
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                    "Content-Type":
                                        "application/json",
                                },
                                body: JSON.stringify(
                                    {
                                        role:
                                            getJobTitle(
                                                interviewApplication
                                            ),

                                        company:
                                            getCompanyName(
                                                interviewApplication
                                            ),

                                        location:
                                            getLocation(
                                                interviewApplication
                                            ),

                                        date:
                                            interviewForm.date,

                                        startTime:
                                            selectedSlot.startTime,

                                        endTime:
                                            selectedSlot.endTime,

                                        meetLink,
                                    }
                                ),
                            }
                        );

                    const data =
                        await parseResponse(
                            response
                        );

                    if (
                        !response.ok
                    ) {
                        throw new Error(
                            data?.message ||
                                "Failed to schedule interview."
                        );
                    }

                    setInterviewModalOpen(
                        false
                    );

                    setInterviewApplication(
                        null
                    );

                    setInterviewForm(
                        emptyInterviewForm
                    );

                    setInterviewFormError(
                        ""
                    );

                    await fetchApplications();
                } catch (error) {
                    console.error(
                        "SCHEDULE INTERVIEW ERROR:",
                        error
                    );

                    setInterviewFormError(
                        error?.message ||
                            "Failed to schedule interview."
                    );
                } finally {
                    setSchedulingInterview(
                        false
                    );
                }
            };

        // ====================================================
        // START INTERVIEW
        // ====================================================

        const startInterview = (
            application
        ) => {
            const meetLink =
                application
                    ?.interview
                    ?.meetLink;

            if (!meetLink) {
                alert(
                    "Interview meeting link is not available."
                );

                return;
            }

            try {
                const url =
                    new URL(
                        meetLink
                    );

                if (
                    url.protocol !==
                        "https:" ||
                    url.hostname !==
                        "meet.google.com"
                ) {
                    throw new Error(
                        "Invalid Google Meet URL"
                    );
                }

                window.open(
                    url.toString(),
                    "_blank",
                    "noopener,noreferrer"
                );
            } catch {
                alert(
                    "The saved interview link is invalid."
                );
            }
        };

        // ====================================================
        // COUNT
        // ====================================================

        const applicationCount =
            useMemo(
                () =>
                    applications.length,
                [applications]
            );

        // ====================================================
        // LOADING
        // ====================================================

        if (loading) {
            return (
                <div className="recruiter-applications-page">
                    <div className="applications-loading">
                        <div className="loading-spinner" />

                        <p>
                            Loading
                            applications...
                        </p>
                    </div>
                </div>
            );
        }

        // ====================================================
        // PAGE
        // ====================================================

        return (
            <div className="recruiter-applications-page">

                {/* HEADER */}

                <div className="applications-page-header">
                    <div>
                        <div className="applications-eyebrow">
                            RECRUITER
                            APPLICATIONS
                        </div>

                        <h1>
                            Candidate
                            Applications
                        </h1>
                    </div>

                    <div className="applications-count">
                        {
                            applicationCount
                        }{" "}
                        {applicationCount ===
                        1
                            ? "Application"
                            : "Applications"}
                    </div>
                </div>

                {/* ERROR */}

                {pageError && (
                    <div className="applications-empty">
                        <div className="empty-icon">
                            ⚠️
                        </div>

                        <h3>
                            Unable to load
                            applications
                        </h3>

                        <p>
                            {pageError}
                        </p>

                        <button
                            type="button"
                            onClick={() => {
                                setLoading(
                                    true
                                );

                                fetchApplications();
                            }}
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* EMPTY */}

                {!pageError &&
                    applications.length ===
                        0 && (
                        <div className="applications-empty">
                            <div className="empty-icon">
                                📄
                            </div>

                            <h3>
                                No
                                applications
                                yet
                            </h3>

                            <p>
                                Applications
                                from
                                candidates
                                will
                                appear
                                here.
                            </p>
                        </div>
                    )}

                {/* APPLICATIONS */}

                {!pageError &&
                    applications.length >
                        0 && (
                        <div className="applications-list">
                            {applications.map(
                                (
                                    application
                                ) => {
                                    const candidateName =
                                        getCandidateName(
                                            application
                                        );

                                    const jobTitle =
                                        getJobTitle(
                                            application
                                        );

                                    const company =
                                        getCompanyName(
                                            application
                                        );

                                    const location =
                                        getLocation(
                                            application
                                        );

                                    const experience =
                                        getExperience(
                                            application
                                        );

                                    const isInterviewStatus =
                                        String(
                                            application?.status ||
                                                ""
                                        ).trim() ===
                                        "Interview";

                                    const interviewScheduled =
                                        hasInterviewScheduled(
                                            application
                                        );

                                    const statusClass =
                                        getStatusClass(
                                            application?.status
                                        );

                                    const initials =
                                        candidateName
                                            .split(
                                                " "
                                            )
                                            .filter(
                                                Boolean
                                            )
                                            .slice(
                                                0,
                                                2
                                            )
                                            .map(
                                                (
                                                    item
                                                ) =>
                                                    item.charAt(
                                                        0
                                                    )
                                            )
                                            .join(
                                                ""
                                            )
                                            .toUpperCase();

                                    return (
                                        <div
                                            className="application-card"
                                            key={
                                                application._id
                                            }
                                        >
                                            {/* HEADER */}

                                            <div className="application-card-header">
                                                <div className="candidate-main-info">
                                                    <div className="candidate-avatar">
                                                        {initials ||
                                                            "C"}
                                                    </div>

                                                    <div>
                                                        <h2>
                                                            {
                                                                candidateName
                                                            }
                                                        </h2>

                                                        <p>
                                                            {safeText(
                                                                application?.email ||
                                                                    application?.candidate
                                                                        ?.email,
                                                                "Email not provided"
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div
                                                    className={`application-status ${statusClass}`}
                                                >
                                                    {safeText(
                                                        application?.status,
                                                        "Applied"
                                                    )}
                                                </div>
                                            </div>

                                            {/* JOB */}

                                            <div className="application-job-info">
                                                <div>
                                                    <span>
                                                        APPLIED
                                                        FOR
                                                    </span>

                                                    <strong>
                                                        {
                                                            jobTitle
                                                        }
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>
                                                        COMPANY
                                                    </span>

                                                    <strong>
                                                        {
                                                            company
                                                        }
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>
                                                        LOCATION
                                                    </span>

                                                    <strong>
                                                        {
                                                            location
                                                        }
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>
                                                        EXPERIENCE
                                                    </span>

                                                    <strong>
                                                        {
                                                            experience
                                                        }
                                                    </strong>
                                                </div>
                                            </div>

                                            {/* CONTACT */}

                                            <div className="candidate-contact-row">
                                                <div>
                                                    <span>
                                                        PHONE
                                                    </span>

                                                    <strong>
                                                        {safeText(
                                                            application?.phone,
                                                            "Not provided"
                                                        )}
                                                    </strong>
                                                </div>

                                                <div>
                                                    <span>
                                                        LINKEDIN
                                                    </span>

                                                    {application?.linkedin ? (
                                                        <a
                                                            href={
                                                                application.linkedin
                                                            }
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            View
                                                            Profile
                                                        </a>
                                                    ) : (
                                                        <strong>
                                                            Not
                                                            provided
                                                        </strong>
                                                    )}
                                                </div>

                                                <div>
                                                    <span>
                                                        PORTFOLIO
                                                    </span>

                                                    {application?.portfolio ? (
                                                        <a
                                                            href={
                                                                application.portfolio
                                                            }
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            View
                                                            Portfolio
                                                        </a>
                                                    ) : (
                                                        <strong>
                                                            Not
                                                            provided
                                                        </strong>
                                                    )}
                                                </div>
                                            </div>

                                            {/* INTERVIEW */}

                                            {isInterviewStatus && (
                                                <div className="interview-card-section">
                                                    {interviewScheduled ? (
                                                        <div className="interview-scheduled-card">
                                                            <div className="interview-scheduled-header">
                                                                <div>
                                                                    <div className="interview-success-icon">
                                                                        ✓
                                                                    </div>

                                                                    <div>
                                                                        <span>
                                                                            INTERVIEW
                                                                            STATUS
                                                                        </span>

                                                                        <h3>
                                                                            Interview
                                                                            Scheduled
                                                                        </h3>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="interview-details-grid">
                                                                <div>
                                                                    <span>
                                                                        DATE
                                                                    </span>

                                                                    <strong>
                                                                        {formatInterviewDate(
                                                                            application
                                                                                ?.interview
                                                                                ?.date
                                                                        )}
                                                                    </strong>

                                                                    <small>
                                                                        {formatInterviewDay(
                                                                            application
                                                                                ?.interview
                                                                                ?.date
                                                                        )}
                                                                    </small>
                                                                </div>

                                                                <div>
                                                                    <span>
                                                                        TIME
                                                                    </span>

                                                                    <strong>
                                                                        {formatTime(
                                                                            application
                                                                                ?.interview
                                                                                ?.startTime
                                                                        )}{" "}
                                                                        -
                                                                        {" "}
                                                                        {formatTime(
                                                                            application
                                                                                ?.interview
                                                                                ?.endTime
                                                                        )}
                                                                    </strong>
                                                                </div>

                                                                <div>
                                                                    <span>
                                                                        ROLE
                                                                    </span>

                                                                    <strong>
                                                                        {safeText(
                                                                            application
                                                                                ?.interview
                                                                                ?.role,
                                                                            jobTitle
                                                                        )}
                                                                    </strong>
                                                                </div>

                                                                <div>
                                                                    <span>
                                                                        LOCATION
                                                                    </span>

                                                                    <strong>
                                                                        {safeText(
                                                                            application
                                                                                ?.interview
                                                                                ?.location,
                                                                            location
                                                                        )}
                                                                    </strong>
                                                                </div>
                                                            </div>

                                                            <div className="interview-card-actions">
                                                                <button
                                                                    type="button"
                                                                    className="start-interview-button"
                                                                    onClick={() =>
                                                                        startInterview(
                                                                            application
                                                                        )
                                                                    }
                                                                >
                                                                    🎥
                                                                    Start
                                                                    Interview
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    className="edit-interview-button"
                                                                    onClick={() =>
                                                                        openInterviewModal(
                                                                            application
                                                                        )
                                                                    }
                                                                >
                                                                    ✏️
                                                                    Edit
                                                                    Interview
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="interview-pending-card">
                                                            <div>
                                                                <span>
                                                                    INTERVIEW
                                                                    STATUS
                                                                </span>

                                                                <h3>
                                                                    Ready
                                                                    to
                                                                    schedule
                                                                </h3>

                                                                <p>
                                                                    Select
                                                                    an
                                                                    interview
                                                                    date,
                                                                    time
                                                                    and
                                                                    Google
                                                                    Meet
                                                                    link.
                                                                </p>
                                                            </div>

                                                            <button
                                                                type="button"
                                                                className="schedule-interview-button"
                                                                onClick={() =>
                                                                    openInterviewModal(
                                                                        application
                                                                    )
                                                                }
                                                            >
                                                                📅
                                                                Schedule
                                                                Interview
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* ACTIONS */}

                                            <div className="application-actions">
                                                <button
                                                    type="button"
                                                    className="ats-analysis-button"
                                                    onClick={() =>
                                                        openATS(
                                                            application
                                                        )
                                                    }
                                                >
                                                    <span className="ats-button-icon">
                                                        ✦
                                                    </span>

                                                    ATS
                                                    Analysis
                                                </button>

                                                <select
                                                    className="application-status-select"
                                                    value={
                                                        application?.status ||
                                                        "Applied"
                                                    }
                                                    disabled={
                                                        updatingStatusId ===
                                                        application._id
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        updateApplicationStatus(
                                                            application._id,
                                                            event
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                >
                                                    {APPLICATION_STATUSES.map(
                                                        (
                                                            status
                                                        ) => (
                                                            <option
                                                                key={
                                                                    status
                                                                }
                                                                value={
                                                                    status
                                                                }
                                                            >
                                                                {
                                                                    status
                                                                }
                                                            </option>
                                                        )
                                                    )}
                                                </select>

                                                {isInterviewStatus &&
                                                    interviewScheduled && (
                                                        <button
                                                            type="button"
                                                            className="interview-action-button"
                                                            onClick={() =>
                                                                startInterview(
                                                                    application
                                                                )
                                                            }
                                                        >
                                                            📅
                                                            Interview
                                                        </button>
                                                    )}
                                            </div>
                                        </div>
                                    );
                                }
                            )}
                        </div>
                    )}

                {/* ==================================================
                    INTERVIEW MODAL
                ================================================== */}

                {interviewModalOpen &&
                    interviewApplication && (
                        <div
                            className="interview-modal-overlay"
                            onMouseDown={(
                                event
                            ) => {
                                if (
                                    event.target ===
                                    event.currentTarget
                                ) {
                                    closeInterviewModal();
                                }
                            }}
                        >
                            <div className="interview-modal">
                                <div className="interview-modal-header">
                                    <div>
                                        <div className="interview-modal-eyebrow">
                                            INTERVIEW
                                            SCHEDULING
                                        </div>

                                        <h2>
                                            {hasInterviewScheduled(
                                                interviewApplication
                                            )
                                                ? "Edit Interview"
                                                : "Schedule Interview"}
                                        </h2>

                                        <p>
                                            Set the
                                            interview
                                            date,
                                            time and
                                            Google
                                            Meet
                                            link.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        className="interview-modal-close"
                                        onClick={
                                            closeInterviewModal
                                        }
                                        disabled={
                                            schedulingInterview
                                        }
                                    >
                                        ×
                                    </button>
                                </div>

                                <form
                                    className="interview-form"
                                    onSubmit={
                                        handleScheduleInterview
                                    }
                                >
                                    <div className="interview-job-preview">
                                        <div className="interview-job-preview-icon">
                                            💼
                                        </div>

                                        <div>
                                            <strong>
                                                {getJobTitle(
                                                    interviewApplication
                                                )}
                                            </strong>

                                            <span>
                                                {getCompanyName(
                                                    interviewApplication
                                                )}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="interview-form-grid">
                                        <div className="interview-field">
                                            <label htmlFor="interview-date">
                                                Interview
                                                Date
                                            </label>

                                            <input
                                                id="interview-date"
                                                type="date"
                                                name="date"
                                                value={
                                                    interviewForm.date
                                                }
                                                min={new Date()
                                                    .toISOString()
                                                    .slice(
                                                        0,
                                                        10
                                                    )}
                                                onChange={
                                                    handleInterviewFormChange
                                                }
                                                disabled={
                                                    schedulingInterview
                                                }
                                                required
                                            />
                                        </div>

                                        <div className="interview-field">
                                            <label htmlFor="interview-time">
                                                Interview
                                                Time
                                            </label>

                                            <select
                                                id="interview-time"
                                                name="timeSlot"
                                                value={
                                                    interviewForm.timeSlot
                                                }
                                                onChange={
                                                    handleInterviewFormChange
                                                }
                                                disabled={
                                                    schedulingInterview
                                                }
                                                required
                                            >
                                                <option value="">
                                                    Select
                                                    time
                                                </option>

                                                {INTERVIEW_TIME_SLOTS.map(
                                                    (
                                                        slot
                                                    ) => (
                                                        <option
                                                            key={
                                                                slot.value
                                                            }
                                                            value={
                                                                slot.value
                                                            }
                                                        >
                                                            {
                                                                slot.label
                                                            }
                                                        </option>
                                                    )
                                                )}
                                            </select>

                                            <small className="interview-field-help">
                                                Interview
                                                duration:
                                                1 hour
                                            </small>
                                        </div>

                                        <div className="interview-field">
                                            <label htmlFor="interview-meet-link">
                                                Google
                                                Meet
                                                Link
                                            </label>

                                            <div className="meet-input-wrapper">
                                                <span>
                                                    🔗
                                                </span>

                                                <input
                                                    id="interview-meet-link"
                                                    type="url"
                                                    name="meetLink"
                                                    value={
                                                        interviewForm.meetLink
                                                    }
                                                    onChange={
                                                        handleInterviewFormChange
                                                    }
                                                    placeholder="https://meet.google.com/xxx-xxxx-xxx"
                                                    disabled={
                                                        schedulingInterview
                                                    }
                                                    required
                                                />
                                            </div>

                                            <small className="interview-field-help">
                                                Enter
                                                the
                                                Google
                                                Meet
                                                URL
                                                created
                                                for
                                                this
                                                interview.
                                            </small>
                                        </div>
                                    </div>

                                    {interviewFormError && (
                                        <div className="interview-form-error">
                                            ⚠️{" "}
                                            {
                                                interviewFormError
                                            }
                                        </div>
                                    )}

                                    <div className="interview-modal-actions">
                                        <button
                                            type="button"
                                            className="interview-cancel-button"
                                            onClick={
                                                closeInterviewModal
                                            }
                                            disabled={
                                                schedulingInterview
                                            }
                                        >
                                            Cancel
                                        </button>

                                        <button
                                            type="submit"
                                            className="interview-schedule-button"
                                            disabled={
                                                schedulingInterview
                                            }
                                        >
                                            {schedulingInterview ? (
                                                <>
                                                    <span className="button-spinner" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    📅{" "}
                                                    {hasInterviewScheduled(
                                                        interviewApplication
                                                    )
                                                        ? "Update Interview"
                                                        : "Schedule Interview"}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                {/* ==================================================
                    ATS MODAL
                ================================================== */}

                {atsModalOpen && (
                    <div
                        className="ats-modal-overlay"
                        onMouseDown={(
                            event
                        ) => {
                            if (
                                event.target ===
                                event.currentTarget
                            ) {
                                closeATS();
                            }
                        }}
                    >
                        <div className="ats-modal">
                            <div className="ats-modal-header">
                                <div>
                                    <div className="ats-modal-eyebrow">
                                        RESUME
                                        MATCH
                                        ANALYSIS
                                    </div>

                                    <h2>
                                        ATS Analysis
                                    </h2>

                                    {selectedApplication && (
                                        <p>
                                            {
                                                getCandidateName(
                                                    selectedApplication
                                                )
                                            }{" "}
                                            •{" "}
                                            {
                                                getJobTitle(
                                                    selectedApplication
                                                )
                                            }
                                        </p>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    className="ats-modal-close"
                                    onClick={
                                        closeATS
                                    }
                                >
                                    ×
                                </button>
                            </div>

                            {atsLoading && (
                                <div className="ats-loading">
                                    <div className="ats-loading-circle" />

                                    <h3>
                                        Calculating
                                        ATS
                                        score...
                                    </h3>

                                    <p>
                                        Comparing
                                        the
                                        candidate
                                        resume
                                        with
                                        the
                                        actual
                                        job
                                        role,
                                        skills,
                                        experience
                                        and
                                        education.
                                    </p>
                                </div>
                            )}

                            {!atsLoading &&
                                atsError && (
                                    <div className="ats-error-box">
                                        <div className="ats-error-icon">
                                            ⚠️
                                        </div>

                                        <div>
                                            <strong>
                                                ATS
                                                analysis
                                                failed
                                            </strong>

                                            <p>
                                                {
                                                    atsError
                                                }
                                            </p>
                                        </div>
                                    </div>
                                )}

                            {!atsLoading &&
                                !atsError &&
                                atsResult && (
                                    <div className="ats-result">

                                        {/* SCORE */}

                                        <div className="ats-score-section">
                                            <div
                                                className={`ats-score-ring ${
                                                    Number(
                                                        atsResult.score
                                                    ) >=
                                                    80
                                                        ? "ats-score-excellent"
                                                        : Number(
                                                              atsResult.score
                                                          ) >=
                                                          65
                                                        ? "ats-score-good"
                                                        : Number(
                                                              atsResult.score
                                                          ) >=
                                                          50
                                                        ? "ats-score-moderate"
                                                        : "ats-score-low"
                                                }`}
                                            >
                                                <div className="ats-score-ring-inner">
                                                    <strong>
                                                        {
                                                            atsResult.score
                                                        }
                                                    </strong>

                                                    <span>
                                                        /100
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="ats-score-details">
                                                <span className="ats-result-label">
                                                    OVERALL
                                                    ATS
                                                    SCORE
                                                </span>

                                                <h3>
                                                    {safeText(
                                                        atsResult.strength,
                                                        "Weak"
                                                    )}
                                                </h3>

                                                <p className="ats-recommendation">
                                                    {safeText(
                                                        atsResult.recommendation,
                                                        "No recommendation available"
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        {/* SCORE FORMULA */}

                                        <div className="ats-score-formula">
                                            <div className="ats-formula-title">
                                                <span>
                                                    Score
                                                    calculated
                                                    from
                                                </span>

                                                <strong>
                                                    Job
                                                    Requirements
                                                    +
                                                    Candidate
                                                    Resume
                                                </strong>
                                            </div>

                                            <div className="ats-formula-grid">
                                                <div>
                                                    <strong>
                                                        35%
                                                    </strong>

                                                    <span>
                                                        Skills
                                                    </span>
                                                </div>

                                                <div>
                                                    <strong>
                                                        25%
                                                    </strong>

                                                    <span>
                                                        Role
                                                        &
                                                        Description
                                                    </span>
                                                </div>

                                                <div>
                                                    <strong>
                                                        20%
                                                    </strong>

                                                    <span>
                                                        Experience
                                                    </span>
                                                </div>

                                                <div>
                                                    <strong>
                                                        10%
                                                    </strong>

                                                    <span>
                                                        Education
                                                    </span>
                                                </div>

                                                <div>
                                                    <strong>
                                                        10%
                                                    </strong>

                                                    <span>
                                                        Resume
                                                        Completeness
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* SUMMARY */}

                                        {atsResult.summary && (
                                            <div className="ats-summary-section">
                                                <div className="ats-summary-card">
                                                    <strong>
                                                        Match
                                                        Summary
                                                    </strong>

                                                    <p>
                                                        {
                                                            atsResult.summary
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* MATCH STRENGTH */}

                                        <div
                                            className={`ats-strength ${
                                                String(
                                                    atsResult.strength ||
                                                        ""
                                                ).toLowerCase() ===
                                                "strong"
                                                    ? "strength-strong"
                                                    : String(
                                                          atsResult.strength ||
                                                              ""
                                                      ).toLowerCase() ===
                                                      "good"
                                                    ? "strength-good"
                                                    : String(
                                                          atsResult.strength ||
                                                              ""
                                                          ).toLowerCase() ===
                                                      "moderate"
                                                    ? "strength-moderate"
                                                    : "strength-weak"
                                            }`}
                                        >
                                            <strong>
                                                Match
                                                Strength:
                                            </strong>{" "}
                                            {safeText(
                                                atsResult.strength,
                                                "Weak"
                                            )}
                                        </div>

                                        {/* IMPROVEMENTS */}

                                        {Array.isArray(
                                            atsDetails?.improvements
                                        ) &&
                                            atsDetails
                                                .improvements
                                                .length >
                                                0 && (
                                                <div className="ats-improvement-box">
                                                    <div className="improvement-heading">
                                                        <span className="improvement-icon">
                                                            💡
                                                        </span>

                                                        <strong>
                                                            Improvement
                                                            Areas
                                                        </strong>
                                                    </div>

                                                    <ul className="improvement-list">
                                                        {atsDetails.improvements.map(
                                                            (
                                                                item,
                                                                index
                                                            ) => (
                                                                <li
                                                                    key={
                                                                        index
                                                                    }
                                                                    className="improvement-item"
                                                                >
                                                                    {
                                                                        item
                                                                    }
                                                                </li>
                                                            )
                                                        )}
                                                    </ul>
                                                </div>
                                            )}

                                        {/* MATCHED KEYWORDS */}

                                        <ATSListSection
                                            title="Matched Role Keywords"
                                            items={
                                                atsResult.matchedKeywords
                                            }
                                        />

                                        {/* MISSING KEYWORDS */}

                                        <ATSListSection
                                            title="Missing Role Keywords"
                                            items={
                                                atsResult.missingKeywords
                                            }
                                            danger
                                        />

                                        {/* SKILLS */}

                                        <ATSListSection
                                            title="Matched Skills"
                                            items={
                                                atsResult.matchedSkills
                                            }
                                        />

                                        <ATSListSection
                                            title="Missing Skills"
                                            items={
                                                atsResult.missingSkills
                                            }
                                            danger
                                        />

                                        {/* METRICS */}

                                        <div className="ats-metrics-grid">
                                            <ATSMetric
                                                label="Skills Match"
                                                value={
                                                    atsResult.skillMatchPercentage
                                                }
                                                weight={
                                                    35
                                                }
                                            />

                                            <ATSMetric
                                                label="Role & Description Match"
                                                value={
                                                    atsResult.keywordMatchPercentage
                                                }
                                                weight={
                                                    25
                                                }
                                            />

                                            <ATSMetric
                                                label="Experience Match"
                                                value={
                                                    atsResult.experienceMatchPercentage
                                                }
                                                weight={
                                                    20
                                                }
                                            />

                                            <ATSMetric
                                                label="Education Match"
                                                value={
                                                    atsResult.educationMatchPercentage
                                                }
                                                weight={
                                                    10
                                                }
                                            />

                                            <ATSMetric
                                                label="Resume Completeness"
                                                value={
                                                    atsResult.resumeCompletenessPercentage
                                                }
                                                weight={
                                                    10
                                                }
                                            />
                                        </div>

                                        {/* FINAL SCORE EXPLANATION */}

                                        <div className="ats-final-score-box">
                                            <div className="ats-final-score-icon">
                                                ✓
                                            </div>

                                            <div>
                                                <strong>
                                                    Final
                                                    ATS
                                                    Score:{" "}
                                                    {
                                                        atsResult.score
                                                    }
                                                    /100
                                                </strong>

                                                <p>
                                                    This
                                                    score
                                                    is
                                                    calculated
                                                    from
                                                    the
                                                    candidate's
                                                    submitted
                                                    resume/profile
                                                    against
                                                    the
                                                    requirements
                                                    of
                                                    this
                                                    specific
                                                    job.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                            {!atsLoading && (
                                <div className="ats-modal-footer">
                                    <button
                                        type="button"
                                        className="ats-recheck-button"
                                        onClick={
                                            recheckATS
                                        }
                                        disabled={
                                            atsLoading
                                        }
                                    >
                                        ↻
                                        Recalculate
                                        ATS
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    };

export default RecruiterApplications;