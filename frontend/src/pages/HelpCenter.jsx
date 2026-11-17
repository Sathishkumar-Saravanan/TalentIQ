import React, {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    FaSearch,
    FaBookOpen,
    FaUserCircle,
    FaBriefcase,
    FaFileAlt,
    FaRobot,
    FaUsers,
    FaShieldAlt,
    FaQuestionCircle,
    FaChevronDown,
    FaArrowRight,
    FaHeadset,
    FaPaperPlane,
    FaCheckCircle,
} from "react-icons/fa";

import "../styles/HelpCenter.css";

const API_URL = (
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000"
).replace(/\/$/, "");

const categoryIcons = {
    "Getting Started": <FaBookOpen />,
    Account: <FaUserCircle />,
    Jobs: <FaBriefcase />,
    Applications: <FaFileAlt />,
    "Resume & AI": <FaRobot />,
    Recruiters: <FaUsers />,
    Security: <FaShieldAlt />,
    Other: <FaQuestionCircle />,
};

/*
============================================================
FALLBACK ARTICLES
============================================================
*/

const fallbackArticles = [
    {
        _id: "fallback-1",
        title: "How do I create a TalentIQ account?",
        description:
            "Learn how to create your candidate or recruiter account.",
        content:
            "Go to the Register page, enter your details and create your TalentIQ account.",
        category: "Getting Started",
        popular: true,
    },

    {
        _id: "fallback-2",
        title: "How does AI job matching work?",
        description:
            "Understand how TalentIQ compares your profile with jobs.",
        content:
            "TalentIQ analyzes your profile, skills, resume and job requirements to provide relevant job matches.",
        category: "Resume & AI",
        popular: true,
    },

    {
        _id: "fallback-3",
        title: "How can I upload my resume?",
        description:
            "Learn how to upload and update your resume.",
        content:
            "Open your profile or resume section and upload your latest supported resume document.",
        category: "Resume & AI",
        popular: true,
    },

    {
        _id: "fallback-4",
        title: "How do I apply for a job?",
        description:
            "Learn how to submit applications on TalentIQ.",
        content:
            "Open a job posting, review the requirements and select Apply to Job.",
        category: "Applications",
        popular: true,
    },
];

/*
============================================================
HELP CENTER
============================================================
*/

function HelpCenter() {

    const [articles, setArticles] =
        useState([]);

    const [search, setSearch] =
        useState("");

    const [activeCategory, setActiveCategory] =
        useState("All");

    const [openArticle, setOpenArticle] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [showContact, setShowContact] =
        useState(false);

    const [submitted, setSubmitted] =
        useState(false);

    const [submitting, setSubmitting] =
        useState(false);

    const [formData, setFormData] =
        useState({
            name: "",
            email: "",
            subject: "",
            category: "Other",
            message: "",
        });

    /*
    ============================================================
    FETCH HELP ARTICLES
    ============================================================
    */

    const fetchArticles = async () => {

        try {

            setLoading(true);
            setError("");

            const response =
                await fetch(
                    `${API_URL}/api/help`
                );

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Unable to load Help Center"
                );
            }

            if (
                Array.isArray(
                    data.articles
                ) &&
                data.articles.length > 0
            ) {

                setArticles(
                    data.articles
                );

            } else {

                setArticles(
                    fallbackArticles
                );
            }

        } catch (err) {

            console.error(
                "Help Center Error:",
                err
            );

            setError(
                "Unable to connect to Help Center. Showing common help topics."
            );

            setArticles(
                fallbackArticles
            );

        } finally {

            setLoading(false);
        }
    };

    /*
    ============================================================
    INITIAL LOAD
    ============================================================
    */

    useEffect(() => {

        fetchArticles();

    }, []);

    /*
    ============================================================
    CATEGORIES
    ============================================================
    */

    const categories = useMemo(() => {

        const values = [
            "All",
            ...articles
                .map(
                    (article) =>
                        article.category
                )
                .filter(Boolean),
        ];

        return [
            ...new Set(values),
        ];

    }, [articles]);

    /*
    ============================================================
    FILTER ARTICLES
    ============================================================
    */

    const filteredArticles =
        useMemo(() => {

            const searchValue =
                search
                    .trim()
                    .toLowerCase();

            return articles.filter(
                (article) => {

                    const categoryMatch =
                        activeCategory ===
                            "All" ||
                        article.category ===
                            activeCategory;

                    const searchMatch =
                        !searchValue ||
                        article.title
                            ?.toLowerCase()
                            .includes(
                                searchValue
                            ) ||
                        article.description
                            ?.toLowerCase()
                            .includes(
                                searchValue
                            ) ||
                        article.content
                            ?.toLowerCase()
                            .includes(
                                searchValue
                            );

                    return (
                        categoryMatch &&
                        searchMatch
                    );
                }
            );

        }, [
            articles,
            search,
            activeCategory,
        ]);

    /*
    ============================================================
    SHOW ALL
    ============================================================
    */

    const handleShowAll = async () => {

        setActiveCategory("All");
        setSearch("");
        setOpenArticle(null);

        /*
        Reload from MongoDB.
        */

        await fetchArticles();

        setTimeout(() => {

            document
                .getElementById(
                    "help-articles"
                )
                ?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });

        }, 100);
    };

    /*
    ============================================================
    CATEGORY CLICK
    ============================================================
    */

    const handleCategoryClick =
        (category) => {

            setActiveCategory(
                category
            );

            setOpenArticle(null);

            setTimeout(() => {

                document
                    .getElementById(
                        "help-articles"
                    )
                    ?.scrollIntoView({
                        behavior:
                            "smooth",
                        block: "start",
                    });

            }, 100);
        };

    /*
    ============================================================
    CONTACT FORM CHANGE
    ============================================================
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
    };

    /*
    ============================================================
    CONTACT FORM SUBMIT
    ============================================================
    */

    const handleSubmit =
        async (event) => {

            event.preventDefault();

            try {

                setSubmitting(true);

                const response =
                    await fetch(
                        `${API_URL}/api/help/contact`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",
                            },

                            body:
                                JSON.stringify(
                                    formData
                                ),
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Unable to submit request"
                    );
                }

                setSubmitted(true);

                setFormData({
                    name: "",
                    email: "",
                    subject: "",
                    category: "Other",
                    message: "",
                });

            } catch (err) {

                console.error(
                    "Support Request Error:",
                    err
                );

                alert(
                    err.message ||
                    "Unable to submit support request"
                );

            } finally {

                setSubmitting(false);
            }
        };

    /*
    ============================================================
    RETURN
    ============================================================
    */

    return (
        <div className="help-page">

            {/* =================================================
                HERO
            ================================================= */}

            <section className="help-hero">

                <div className="help-hero-decoration help-circle-one"></div>

                <div className="help-hero-decoration help-circle-two"></div>

                <div className="help-hero-content">

                    <span className="help-eyebrow">
                        TALENTIQ SUPPORT
                    </span>

                    <h1>
                        How can we
                        <span>
                            {" "}
                            help you?
                        </span>
                    </h1>

                    <p>
                        Find answers, learn how
                        TalentIQ works, or contact
                        our support team.
                    </p>

                    <div className="help-search">

                        <FaSearch />

                        <input
                            type="text"
                            placeholder="Search for help..."
                            value={search}
                            onChange={(event) =>
                                setSearch(
                                    event.target.value
                                )
                            }
                        />

                        {search && (
                            <button
                                type="button"
                                onClick={() =>
                                    setSearch("")
                                }
                            >
                                Clear
                            </button>
                        )}

                    </div>

                </div>

            </section>

            {/* =================================================
                MAIN
            ================================================= */}

            <main className="help-main">

                {error && (
                    <div className="help-notice">
                        {error}
                    </div>
                )}

                {/* =================================================
                    CATEGORY CARDS
                ================================================= */}

                <section className="help-category-section">

                    <div className="help-section-heading">

                        <div>

                            <span>
                                EXPLORE HELP
                            </span>

                            <h2>
                                What can we
                                <strong>
                                    {" "}
                                    help with?
                                </strong>
                            </h2>

                        </div>

                    </div>

                    <div className="help-category-grid">

                        {categories
                            .filter(
                                (category) =>
                                    category !==
                                    "All"
                            )
                            .map(
                                (category) => {

                                    const count =
                                        articles.filter(
                                            (article) =>
                                                article.category ===
                                                category
                                        ).length;

                                    return (
                                        <button
                                            key={
                                                category
                                            }
                                            type="button"
                                            className={`help-category-card ${
                                                activeCategory ===
                                                category
                                                    ? "active"
                                                    : ""
                                            }`}
                                            onClick={() =>
                                                handleCategoryClick(
                                                    category
                                                )
                                            }
                                        >

                                            <div className="help-category-icon">

                                                {
                                                    categoryIcons[
                                                        category
                                                    ] ||
                                                    <FaQuestionCircle />
                                                }

                                            </div>

                                            <div>

                                                <h3>
                                                    {
                                                        category
                                                    }
                                                </h3>

                                                <p>
                                                    {
                                                        count
                                                    }{" "}
                                                    {
                                                        count ===
                                                        1
                                                            ? "article"
                                                            : "articles"
                                                    }
                                                </p>

                                            </div>

                                            <FaArrowRight className="category-arrow" />

                                        </button>
                                    );
                                }
                            )}

                    </div>

                </section>

                {/* =================================================
                    ARTICLES
                ================================================= */}

                <section
                    className="help-articles-section"
                    id="help-articles"
                >

                    <div className="help-section-heading article-heading">

                        <div>

                            <span>
                                KNOWLEDGE BASE
                            </span>

                            <h2>
                                Popular
                                <strong>
                                    {" "}
                                    help topics
                                </strong>
                            </h2>

                        </div>

                        <button
                            type="button"
                            className="show-all-button"
                            onClick={
                                handleShowAll
                            }
                        >
                            Show all
                        </button>

                    </div>

                    {/* =================================================
                        LOADING
                    ================================================= */}

                    {loading ? (

                        <div className="help-loading">

                            <div className="help-spinner"></div>

                            <p>
                                Loading Help Center...
                            </p>

                        </div>

                    ) : filteredArticles.length ===
                      0 ? (

                        <div className="help-empty">

                            <FaQuestionCircle />

                            <h3>
                                No articles found
                            </h3>

                            <p>
                                Try another search
                                term or category.
                            </p>

                            <button
                                type="button"
                                className="show-all-button"
                                onClick={
                                    handleShowAll
                                }
                            >
                                Show all articles
                            </button>

                        </div>

                    ) : (

                        <div className="help-article-list">

                            {filteredArticles.map(
                                (article) => {

                                    const isOpen =
                                        openArticle ===
                                        article._id;

                                    return (
                                        <div
                                            className={`help-article ${
                                                isOpen
                                                    ? "open"
                                                    : ""
                                            }`}
                                            key={
                                                article._id
                                            }
                                        >

                                            <button
                                                type="button"
                                                className="help-article-question"
                                                onClick={() =>
                                                    setOpenArticle(
                                                        isOpen
                                                            ? null
                                                            : article._id
                                                    )
                                                }
                                            >

                                                <div className="article-question-left">

                                                    <div className="article-icon">

                                                        {
                                                            categoryIcons[
                                                                article.category
                                                            ] ||
                                                            <FaQuestionCircle />
                                                        }

                                                    </div>

                                                    <div>

                                                        <span>
                                                            {
                                                                article.category
                                                            }
                                                        </span>

                                                        <h3>
                                                            {
                                                                article.title
                                                            }
                                                        </h3>

                                                        <p>
                                                            {
                                                                article.description
                                                            }
                                                        </p>

                                                    </div>

                                                </div>

                                                <FaChevronDown />

                                            </button>

                                            {isOpen && (

                                                <div className="help-article-answer">

                                                    <p>
                                                        {
                                                            article.content
                                                        }
                                                    </p>

                                                </div>

                                            )}

                                        </div>
                                    );
                                }
                            )}

                        </div>

                    )}

                </section>

                {/* =================================================
                    CONTACT SUPPORT
                ================================================= */}

                <section className="help-contact-section">

                    <div className="help-contact-info">

                        <div className="contact-icon">
                            <FaHeadset />
                        </div>

                        <span>
                            STILL NEED HELP?
                        </span>

                        <h2>
                            Talk to our
                            <strong>
                                {" "}
                                support team.
                            </strong>
                        </h2>

                        <p>
                            Can't find the answer
                            you're looking for?
                            Send us a message and
                            our team will help you.
                        </p>

                        <button
                            type="button"
                            onClick={() => {

                                setShowContact(
                                    true
                                );

                                setSubmitted(
                                    false
                                );

                                setTimeout(() => {

                                    document
                                        .getElementById(
                                            "contact-support"
                                        )
                                        ?.scrollIntoView({
                                            behavior:
                                                "smooth",
                                        });

                                }, 100);

                            }}
                        >
                            Contact Support
                            <FaArrowRight />
                        </button>

                    </div>

                </section>

                {/* =================================================
                    CONTACT FORM
                ================================================= */}

                {showContact && (

                    <section
                        className="contact-form-section"
                        id="contact-support"
                    >

                        <div className="contact-form-card">

                            {submitted ? (

                                <div className="contact-success">

                                    <div className="success-icon">
                                        <FaCheckCircle />
                                    </div>

                                    <h2>
                                        Request submitted!
                                    </h2>

                                    <p>
                                        Thanks for contacting
                                        TalentIQ support.
                                        Our team will review
                                        your request.
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setSubmitted(
                                                false
                                            )
                                        }
                                    >
                                        Send another request
                                    </button>

                                </div>

                            ) : (

                                <>

                                    <div className="contact-form-header">

                                        <span>
                                            CONTACT SUPPORT
                                        </span>

                                        <h2>
                                            How can we
                                            help?
                                        </h2>

                                        <p>
                                            Tell us what
                                            you're experiencing
                                            and we'll get back
                                            to you.
                                        </p>

                                    </div>

                                    <form
                                        onSubmit={
                                            handleSubmit
                                        }
                                    >

                                        <div className="form-row">

                                            <div className="help-form-group">

                                                <label>
                                                    Your name
                                                </label>

                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={
                                                        formData.name
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                    placeholder="Enter your name"
                                                    required
                                                />

                                            </div>

                                            <div className="help-form-group">

                                                <label>
                                                    Email address
                                                </label>

                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={
                                                        formData.email
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                    placeholder="Enter your email"
                                                    required
                                                />

                                            </div>

                                        </div>

                                        <div className="form-row">

                                            <div className="help-form-group">

                                                <label>
                                                    Subject
                                                </label>

                                                <input
                                                    type="text"
                                                    name="subject"
                                                    value={
                                                        formData.subject
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                    placeholder="What do you need help with?"
                                                    required
                                                />

                                            </div>

                                            <div className="help-form-group">

                                                <label>
                                                    Category
                                                </label>

                                                <select
                                                    name="category"
                                                    value={
                                                        formData.category
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                >

                                                    <option value="Account">
                                                        Account
                                                    </option>

                                                    <option value="Jobs">
                                                        Jobs
                                                    </option>

                                                    <option value="Applications">
                                                        Applications
                                                    </option>

                                                    <option value="Resume & AI">
                                                        Resume & AI
                                                    </option>

                                                    <option value="Recruiters">
                                                        Recruiters
                                                    </option>

                                                    <option value="Security">
                                                        Security
                                                    </option>

                                                    <option value="Other">
                                                        Other
                                                    </option>

                                                </select>

                                            </div>

                                        </div>

                                        <div className="help-form-group">

                                            <label>
                                                Message
                                            </label>

                                            <textarea
                                                name="message"
                                                value={
                                                    formData.message
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                placeholder="Describe your issue..."
                                                rows="6"
                                                required
                                            />

                                        </div>

                                        <button
                                            type="submit"
                                            className="submit-support-button"
                                            disabled={
                                                submitting
                                            }
                                        >

                                            {submitting ? (

                                                <>
                                                    <span className="small-spinner"></span>
                                                    Sending...
                                                </>

                                            ) : (

                                                <>
                                                    Send Message
                                                    <FaPaperPlane />
                                                </>

                                            )}

                                        </button>

                                    </form>

                                </>

                            )}

                        </div>

                    </section>

                )}

            </main>

        </div>
    );
}

export default HelpCenter;