const STOP_WORDS = new Set([
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "by",
    "for",
    "from",
    "has",
    "have",
    "in",
    "into",
    "is",
    "it",
    "its",
    "of",
    "on",
    "or",
    "our",
    "that",
    "the",
    "their",
    "this",
    "to",
    "using",
    "with",
    "will",
    "you",
    "your",
    "we",
    "they",
    "them",
    "than",
    "then",
    "such",
    "should",
    "must",
    "can",
    "may",
    "also",
    "all",
    "any",
    "about",
    "more",
    "other",
    "some",
    "work",
    "working",
    "works",
    "job",
    "role",
    "candidate",
    "team",
    "teams",
    "company",
    "experience",
    "years",
    "year",
    "required",
    "requirements",
    "responsibilities",
    "responsibility",
    "preferred",
    "including",
    "include",
    "etc",
    "strong",
    "good",
    "excellent",
    "looking",
    "ability",
    "abilities",
    "knowledge",
    "skills",
    "skill",
]);

// ============================================================
// NORMALIZE TEXT
// ============================================================

const normalizeText = (value) => {
    if (value === null || value === undefined) {
        return "";
    }

    if (Array.isArray(value)) {
        return value
            .map((item) => normalizeText(item))
            .filter(Boolean)
            .join(" ");
    }

    if (typeof value === "object") {
        return Object.values(value)
            .map((item) => normalizeText(item))
            .filter(Boolean)
            .join(" ");
    }

    return String(value)
        .toLowerCase()
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9+#.\- ]/gi, " ")
        .replace(/\s+/g, " ")
        .trim();
};

// ============================================================
// NORMALIZE SKILL
// ============================================================

const normalizeSkill = (value) => {
    return normalizeText(value)
        .replace(/\bjs\b/g, "javascript")
        .replace(/\breactjs\b/g, "react")
        .replace(/\breact js\b/g, "react")
        .replace(/\bnodejs\b/g, "node.js")
        .replace(/\bnode js\b/g, "node.js")
        .replace(/\bexpressjs\b/g, "express")
        .replace(/\bexpress js\b/g, "express")
        .replace(/\bmongodb\b/g, "mongodb")
        .replace(/\bmongo db\b/g, "mongodb")
        .replace(/\bpostgresql\b/g, "postgres")
        .replace(/\bpostgres sql\b/g, "postgres")
        .replace(/\btypescript\b/g, "typescript")
        .trim();
};

// ============================================================
// UNIQUE ARRAY
// ============================================================

const unique = (items) => {
    return [
        ...new Set(
            items
                .map((item) => normalizeText(item))
                .filter(Boolean)
        ),
    ];
};

// ============================================================
// ARRAY TO TEXT
// ============================================================

const arrayToText = (value) => {
    if (!Array.isArray(value)) {
        return "";
    }

    return value
        .map((item) => {
            if (typeof item === "string") {
                return item;
            }

            if (item && typeof item === "object") {
                return Object.values(item)
                    .map((field) =>
                        normalizeText(field)
                    )
                    .join(" ");
            }

            return String(item || "");
        })
        .join(" ");
};

// ============================================================
// EXTRACT WORDS
// ============================================================

const extractWords = (text) => {
    const normalized = normalizeText(text);

    if (!normalized) {
        return [];
    }

    return unique(
        normalized
            .split(/\s+/)
            .filter(
                (word) =>
                    word.length >= 3 &&
                    !STOP_WORDS.has(word) &&
                    !/^\d+$/.test(word)
            )
    );
};

// ============================================================
// EXTRACT PHRASES / KEYWORDS
// ============================================================

const extractKeywords = (text) => {
    const normalized = normalizeText(text);

    if (!normalized) {
        return [];
    }

    const words = extractWords(normalized);

    const phrases = [];

    for (let i = 0; i < words.length - 1; i += 1) {
        const first = words[i];
        const second = words[i + 1];

        if (
            first.length >= 3 &&
            second.length >= 3
        ) {
            phrases.push(
                `${first} ${second}`
            );
        }
    }

    return unique([
        ...words,
        ...phrases,
    ]);
};

// ============================================================
// SAFE NUMBER
// ============================================================

const clamp = (value, min = 0, max = 100) => {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return min;
    }

    return Math.max(
        min,
        Math.min(max, number)
    );
};

// ============================================================
// PERCENTAGE
// ============================================================

const calculatePercentage = (
    matched,
    total
) => {
    if (!total || total <= 0) {
        return 0;
    }

    return Math.round(
        (matched / total) * 100
    );
};

// ============================================================
// MATCH TEXT AGAINST RESUME
// ============================================================

const calculateKeywordMatch = (
    jobKeywords,
    resumeText
) => {
    const resume = normalizeText(
        resumeText
    );

    const keywords = unique(
        jobKeywords
    );

    if (
        keywords.length === 0
    ) {
        return {
            percentage: 0,
            matched: [],
            missing: [],
        };
    }

    const matched = [];
    const missing = [];

    keywords.forEach((keyword) => {
        const normalizedKeyword =
            normalizeText(keyword);

        if (
            normalizedKeyword &&
            resume.includes(
                normalizedKeyword
            )
        ) {
            matched.push(keyword);
        } else {
            missing.push(keyword);
        }
    });

    return {
        percentage: calculatePercentage(
            matched.length,
            keywords.length
        ),
        matched,
        missing,
    };
};

// ============================================================
// SKILL MATCH
// ============================================================

const calculateSkillMatch = (
    requiredSkills,
    resumeText,
    candidateSkills
) => {
    const normalizedResume =
        normalizeText(resumeText);

    const candidateSkillText =
        arrayToText(candidateSkills);

    const combinedCandidateText =
        `${normalizedResume} ${normalizeText(
            candidateSkillText
        )}`;

    const skills = unique(
        requiredSkills.map(
            (skill) =>
                normalizeSkill(skill)
        )
    );

    if (skills.length === 0) {
        return {
            percentage: 0,
            matched: [],
            missing: [],
        };
    }

    const matched = [];
    const missing = [];

    skills.forEach((skill) => {
        if (
            combinedCandidateText.includes(
                skill
            )
        ) {
            matched.push(skill);
        } else {
            missing.push(skill);
        }
    });

    return {
        percentage: calculatePercentage(
            matched.length,
            skills.length
        ),
        matched,
        missing,
    };
};

// ============================================================
// EXPERIENCE NUMBER EXTRACTION
// ============================================================

const extractYears = (value) => {
    const text = normalizeText(value);

    if (!text) {
        return null;
    }

    // 2+ years
    let match = text.match(
        /(\d+(?:\.\d+)?)\s*\+?\s*(?:years|year|yrs|yr)/
    );

    if (match) {
        return Number(match[1]);
    }

    // Range: 2 - 4 years
    match = text.match(
        /(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)\s*(?:years|year|yrs|yr)/
    );

    if (match) {
        return Number(match[1]);
    }

    // Fresher / entry level
    if (
        text.includes("fresher") ||
        text.includes("entry level") ||
        text.includes("entry-level") ||
        text.includes("0 years")
    ) {
        return 0;
    }

    return null;
};

// ============================================================
// EXPERIENCE MATCH
// ============================================================

const calculateExperienceMatch = (
    jobExperience,
    candidateExperience,
    resumeText
) => {
    const requiredYears =
        extractYears(jobExperience);

    const candidateYears =
        extractYears(
            candidateExperience
        );

    const resumeYears =
        extractYears(resumeText);

    let actualCandidateYears =
        candidateYears;

    if (
        actualCandidateYears === null &&
        resumeYears !== null
    ) {
        actualCandidateYears =
            resumeYears;
    }

    // No explicit experience requirement
    if (requiredYears === null) {
        return 100;
    }

    // Candidate has no stated experience
    if (
        actualCandidateYears === null
    ) {
        if (requiredYears === 0) {
            return 100;
        }

        return 0;
    }

    // Fresher requirement
    if (requiredYears === 0) {
        return 100;
    }

    if (
        actualCandidateYears >=
        requiredYears
    ) {
        return 100;
    }

    const percentage =
        (actualCandidateYears /
            requiredYears) *
        100;

    return Math.round(
        clamp(percentage)
    );
};

// ============================================================
// EDUCATION MATCH
// ============================================================

const EDUCATION_TERMS = [
    "bca",
    "bsc",
    "b.sc",
    "btech",
    "b.tech",
    "be",
    "b.e",
    "mca",
    "msc",
    "m.sc",
    "mtech",
    "m.tech",
    "mba",
    "bba",
    "computer science",
    "information technology",
    "information science",
    "software engineering",
    "engineering",
    "computer applications",
];

// ============================================================
// EDUCATION MATCH
// ============================================================

const calculateEducationMatch = (
    job,
    resumeText,
    candidateEducation
) => {
    const jobText = normalizeText(
        [
            job?.description,
            arrayToText(
                job?.requirements
            ),
        ].join(" ")
    );

    const candidateText =
        normalizeText(
            [
                resumeText,
                arrayToText(
                    candidateEducation
                ),
            ].join(" ")
        );

    const requestedEducation =
        EDUCATION_TERMS.filter(
            (term) =>
                jobText.includes(
                    normalizeText(term)
                )
        );

    if (
        requestedEducation.length ===
        0
    ) {
        return 100;
    }

    const matched =
        requestedEducation.filter(
            (term) =>
                candidateText.includes(
                    normalizeText(term)
                )
        );

    return calculatePercentage(
        matched.length,
        requestedEducation.length
    );
};

// ============================================================
// RESUME COMPLETENESS
// ============================================================

const calculateResumeCompleteness = ({
    resumeText,
    candidate,
}) => {
    const fields = [
        candidate?.fullName,
        candidate?.email,
        candidate?.phone,
        candidate?.headline,
        candidate?.summary,
        candidate?.skills,
        candidate?.education,
        candidate?.experience,
        candidate?.projects,
        candidate?.certifications,
        candidate?.achievements,
        candidate?.languages,
        resumeText,
    ];

    const available = fields.filter(
        (field) => {
            if (
                Array.isArray(field)
            ) {
                return field.length > 0;
            }

            return Boolean(
                normalizeText(field)
            );
        }
    );

    return Math.round(
        (available.length /
            fields.length) *
            100
    );
};

// ============================================================
// BUILD RESUME TEXT
// ============================================================

const buildResumeText = ({
    application,
    candidate,
}) => {
    const parts = [];

    // Application-level resume text
    if (application?.resumeText) {
        parts.push(
            application.resumeText
        );
    }

    // Candidate identity
    parts.push(
        candidate?.fullName || ""
    );

    parts.push(
        candidate?.email || ""
    );

    parts.push(
        candidate?.headline || ""
    );

    parts.push(
        candidate?.summary || ""
    );

    // Candidate skills
    parts.push(
        arrayToText(
            candidate?.skills
        )
    );

    // Education
    parts.push(
        arrayToText(
            candidate?.education
        )
    );

    // Experience
    parts.push(
        arrayToText(
            candidate?.experience
        )
    );

    // Projects
    parts.push(
        arrayToText(
            candidate?.projects
        )
    );

    // Certifications
    parts.push(
        arrayToText(
            candidate?.certifications
        )
    );

    // Achievements
    parts.push(
        arrayToText(
            candidate?.achievements
        )
    );

    // Languages
    parts.push(
        arrayToText(
            candidate?.languages
        )
    );

    return parts
        .filter(Boolean)
        .join(" ");
};

// ============================================================
// BUILD JOB ATS TEXT
// ============================================================

const buildJobText = (job) => {
    return [
        job?.title,
        job?.description,
        job?.experience,
        arrayToText(
            job?.skills
        ),
        arrayToText(
            job?.requirements
        ),
        arrayToText(
            job?.responsibilities
        ),
    ]
        .filter(Boolean)
        .join(" ");
};

// ============================================================
// STRENGTH
// ============================================================

const getStrength = (score) => {
    if (score >= 80) {
        return "Strong";
    }

    if (score >= 65) {
        return "Good";
    }

    if (score >= 50) {
        return "Moderate";
    }

    return "Weak";
};

// ============================================================
// RECOMMENDATION
// ============================================================

const getRecommendation = (
    score
) => {
    if (score >= 80) {
        return "Highly Recommended";
    }

    if (score >= 65) {
        return "Recommended";
    }

    if (score >= 50) {
        return "Consider";
    }

    return "Not Recommended";
};

// ============================================================
// SUMMARY
// ============================================================

const createSummary = ({
    score,
    skillMatch,
    keywordMatch,
    experienceMatch,
    educationMatch,
}) => {
    return (
        `Overall ATS score is ${score}/100. ` +
        `Skills match: ${skillMatch}%. ` +
        `Job-description and keyword match: ${keywordMatch}%. ` +
        `Experience match: ${experienceMatch}%. ` +
        `Education match: ${educationMatch}%.`
    );
};

// ============================================================
// IMPROVEMENTS
// ============================================================

const createImprovements = ({
    missingSkills,
    missingKeywords,
    experienceMatch,
    educationMatch,
    resumeCompleteness,
}) => {
    const improvements = [];

    if (
        missingSkills.length >
        0
    ) {
        improvements.push(
            `Add or demonstrate relevant skills: ${missingSkills
                .slice(0, 8)
                .join(", ")}.`
        );
    }

    if (
        missingKeywords.length >
        0
    ) {
        improvements.push(
            `Include relevant job-description keywords such as: ${missingKeywords
                .slice(0, 8)
                .join(", ")}.`
        );
    }

    if (
        experienceMatch < 100
    ) {
        improvements.push(
            "Clearly mention relevant years of experience and measurable work or project experience."
        );
    }

    if (
        educationMatch < 100
    ) {
        improvements.push(
            "Make the relevant degree, specialization and education details clearly visible in the resume."
        );
    }

    if (
        resumeCompleteness < 80
    ) {
        improvements.push(
            "Complete more resume sections such as summary, skills, education, experience and projects."
        );
    }

    if (
        improvements.length ===
        0
    ) {
        improvements.push(
            "The resume currently contains the major information required for this job."
        );
    }

    return improvements;
};

// ============================================================
// MAIN ATS ANALYSIS
// ============================================================

const analyzeApplicationATS = ({
    application,
    job,
    candidate,
}) => {
    const resumeText =
        buildResumeText({
            application,
            candidate,
        });

    const jobText =
        buildJobText(job);

    // --------------------------------------------------------
    // JOB DESCRIPTION / KEYWORD MATCH
    // --------------------------------------------------------

    const jobKeywords =
        extractKeywords(
            jobText
        );

    const keywordResult =
        calculateKeywordMatch(
            jobKeywords,
            resumeText
        );

    // --------------------------------------------------------
    // SKILL MATCH
    // --------------------------------------------------------

    const requiredSkills =
        Array.isArray(
            job?.skills
        )
            ? job.skills
            : [];

    const skillResult =
        calculateSkillMatch(
            requiredSkills,
            resumeText,
            candidate?.skills
        );

    // --------------------------------------------------------
    // EXPERIENCE
    // --------------------------------------------------------

    const candidateExperience =
        arrayToText(
            candidate?.experience
        );

    const experienceMatch =
        calculateExperienceMatch(
            job?.experience,
            candidateExperience,
            resumeText
        );

    // --------------------------------------------------------
    // EDUCATION
    // --------------------------------------------------------

    const educationMatch =
        calculateEducationMatch(
            job,
            resumeText,
            candidate?.education
        );

    // --------------------------------------------------------
    // RESUME COMPLETENESS
    // --------------------------------------------------------

    const resumeCompleteness =
        calculateResumeCompleteness({
            resumeText,
            candidate,
        });

    // ========================================================
    // FINAL WEIGHTED SCORE
    // ========================================================
    //
    // Skills                    = 35%
    // Job description keywords  = 25%
    // Experience                = 20%
    // Education                 = 10%
    // Resume completeness       = 10%
    //
    // TOTAL                     = 100%
    //
    // ========================================================

    const weightedScore =
        skillResult.percentage *
            0.35 +
        keywordResult.percentage *
            0.25 +
        experienceMatch *
            0.20 +
        educationMatch *
            0.10 +
        resumeCompleteness *
            0.10;

    const score = Math.round(
        clamp(weightedScore)
    );

    const strength =
        getStrength(score);

    const recommendation =
        getRecommendation(
            score
        );

    const summary =
        createSummary({
            score,
            skillMatch:
                skillResult.percentage,
            keywordMatch:
                keywordResult.percentage,
            experienceMatch,
            educationMatch,
        });

    const improvements =
        createImprovements({
            missingSkills:
                skillResult.missing,
            missingKeywords:
                keywordResult.missing,
            experienceMatch,
            educationMatch,
            resumeCompleteness,
        });

    return {
        score,

        strength,

        recommendation,

        matchedKeywords:
            keywordResult.matched,

        missingKeywords:
            keywordResult.missing,

        matchedSkills:
            skillResult.matched,

        missingSkills:
            skillResult.missing,

        keywordMatchPercentage:
            keywordResult.percentage,

        skillMatchPercentage:
            skillResult.percentage,

        experienceMatchPercentage:
            experienceMatch,

        educationMatchPercentage:
            educationMatch,

        resumeCompletenessPercentage:
            resumeCompleteness,

        summary,

        improvements,

        checkedAt: new Date(),
    };
};

module.exports = {
    analyzeApplicationATS,
};