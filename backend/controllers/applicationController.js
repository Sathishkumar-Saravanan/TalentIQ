const mongoose = require("mongoose");

const Application = require("../models/Application");
const Job = require("../models/Job");
const CandidateProfile = require("../models/CandidateProfile");
const User = require("../models/User");

// ============================================================
// CONSTANTS
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

const ATS_WEIGHTS = {
    skills: 0.35,
    roleDescription: 0.25,
    experience: 0.20,
    education: 0.10,
    completeness: 0.10,
};

// ============================================================
// BASIC HELPERS
// ============================================================

const safeString = (value) => {
    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
    ) {
        return String(value).trim();
    }

    return "";
};

const clamp = (
    value,
    min = 0,
    max = 100
) => {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return min;
    }

    return Math.max(
        min,
        Math.min(max, number)
    );
};

const roundNumber = (
    value,
    decimals = 2
) => {
    const factor = 10 ** decimals;

    return (
        Math.round(
            Number(value) * factor
        ) / factor
    );
};

const sameId = (
    first,
    second
) => {
    if (!first || !second) {
        return false;
    }

    return (
        String(first) ===
        String(second)
    );
};

const isValidObjectId = (
    value
) => {
    return mongoose.Types.ObjectId.isValid(
        value
    );
};

// ============================================================
// ARRAY / OBJECT TEXT EXTRACTION
// ============================================================

const flattenValues = (
    value,
    result = []
) => {
    if (
        value === null ||
        value === undefined
    ) {
        return result;
    }

    if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
    ) {
        const text =
            String(value).trim();

        if (text) {
            result.push(text);
        }

        return result;
    }

    if (Array.isArray(value)) {
        value.forEach((item) => {
            flattenValues(
                item,
                result
            );
        });

        return result;
    }

    if (
        typeof value === "object"
    ) {
        const preferredKeys = [
            "name",
            "title",
            "label",
            "skill",
            "value",
            "text",
            "description",
            "role",
            "jobTitle",
            "company",
            "degree",
            "course",
            "qualification",
            "institution",
            "university",
            "level",
            "years",
            "experienceLevel",
        ];

        let foundPreferred =
            false;

        preferredKeys.forEach(
            (key) => {
                if (
                    value[key] !==
                    undefined &&
                    value[key] !==
                    null
                ) {
                    foundPreferred =
                        true;

                    flattenValues(
                        value[key],
                        result
                    );
                }
            }
        );

        if (!foundPreferred) {
            Object.values(value).forEach(
                (nestedValue) => {
                    flattenValues(
                        nestedValue,
                        result
                    );
                }
            );
        }

        return result;
    }

    return result;
};

const uniqueStrings = (
    values
) => {
    const seen =
        new Set();

    const result = [];

    values.forEach(
        (value) => {
            const text =
                safeString(value);

            if (!text) {
                return;
            }

            const key =
                text.toLowerCase();

            if (!seen.has(key)) {
                seen.add(key);
                result.push(text);
            }
        }
    );

    return result;
};

// ============================================================
// NORMALIZE SKILLS
// ============================================================

const normalizeSkill = (
    value
) => {
    let skill =
        safeString(value)
            .toLowerCase()
            .replace(/[()[\]{}]/g, " ")
            .replace(/\s+/g, " ")
            .trim();

    const aliases = {
        "javascript":
            "javascript",
        "java script":
            "javascript",
        "js":
            "javascript",

        "typescript":
            "typescript",
        "type script":
            "typescript",
        "ts":
            "typescript",

        "react.js":
            "react",
        "react js":
            "react",
        "reactjs":
            "react",

        "node.js":
            "node",
        "node js":
            "node",
        "nodejs":
            "node",

        "express.js":
            "express",
        "express js":
            "express",
        "expressjs":
            "express",

        "mongo db":
            "mongodb",
        "mongodb":
            "mongodb",

        "next.js":
            "next",
        "next js":
            "next",
        "nextjs":
            "next",

        "html5":
            "html",
        "css3":
            "css",

        "rest api":
            "rest api",
        "rest apis":
            "rest api",

        "restful api":
            "rest api",
        "restful apis":
            "rest api",

        "machine learning":
            "machine learning",
        "ml":
            "machine learning",

        "artificial intelligence":
            "artificial intelligence",
        "ai":
            "artificial intelligence",

        "tailwind css":
            "tailwind",
        "tailwindcss":
            "tailwind",

        "bootstrap css":
            "bootstrap",
    };

    if (aliases[skill]) {
        return aliases[skill];
    }

    return skill;
};

// ============================================================
// STOP WORDS
// ============================================================

const STOP_WORDS = new Set([
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "by",
    "can",
    "for",
    "from",
    "has",
    "have",
    "in",
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
    "use",
    "with",
    "will",
    "you",
    "your",
    "we",
    "they",
    "them",
    "job",
    "role",
    "work",
    "working",
    "candidate",
    "candidates",
    "team",
    "company",
    "years",
    "year",
    "experience",
    "required",
    "preferred",
    "looking",
    "responsible",
    "responsibilities",
    "including",
    "include",
    "strong",
    "good",
    "excellent",
    "ability",
    "skills",
    "skill",
]);

// ============================================================
// TOKENIZER
// ============================================================

const tokenize = (
    value
) => {
    const text =
        safeString(value)
            .toLowerCase()
            .replace(/c\+\+/g, " cpp ")
            .replace(/c#/g, " csharp ")
            .replace(/\.net/g, " dotnet ")
            .replace(/node\.js/g, " node ")
            .replace(/react\.js/g, " react ")
            .replace(/next\.js/g, " next ")
            .replace(/express\.js/g, " express ")
            .replace(/[^a-z0-9+#]+/g, " ");

    return text
        .split(/\s+/)
        .map((word) =>
            word.trim()
        )
        .filter(
            (word) =>
                word.length >= 2 &&
                !STOP_WORDS.has(word)
        );
};

// ============================================================
// PHRASE / TOKEN MATCHING
// ============================================================

const textContainsPhrase = (
    resumeText,
    phrase
) => {
    const resume =
        safeString(resumeText)
            .toLowerCase()
            .replace(
                /[^a-z0-9+#.]+/g,
                " "
            );

    const target =
        safeString(phrase)
            .toLowerCase()
            .replace(
                /[^a-z0-9+#.]+/g,
                " "
            )
            .trim();

    if (!resume || !target) {
        return false;
    }

    if (
        resume.includes(target)
    ) {
        return true;
    }

    const normalized =
        normalizeSkill(target);

    if (
        normalized &&
        normalized !== target
    ) {
        return resume.includes(
            normalized
        );
    }

    return false;
};

// ============================================================
// EXTRACT JOB SKILLS
// ============================================================

const getJobSkills = (
    job
) => {
    const requiredRaw =
        flattenValues(
            job?.requiredSkills
        );

    const preferredRaw =
        flattenValues(
            job?.preferredSkills
        );

    const requiredSkills =
        uniqueStrings(
            requiredRaw
        ).map(
            normalizeSkill
        ).filter(Boolean);

    const preferredSkills =
        uniqueStrings(
            preferredRaw
        ).map(
            normalizeSkill
        ).filter(Boolean);

    return {
        requiredSkills:
            uniqueStrings(
                requiredSkills
            ),

        preferredSkills:
            uniqueStrings(
                preferredSkills
            ),
    };
};

// ============================================================
// EXTRACT CANDIDATE SKILLS
// ============================================================

const getCandidateSkills = (
    profile
) => {
    const profileSkills =
        flattenValues(
            profile?.skills
        );

    return uniqueStrings(
        profileSkills
    )
        .map(normalizeSkill)
        .filter(Boolean);
};

// ============================================================
// RESUME TEXT
// ============================================================

const buildResumeText = ({
    application,
    profile,
    user,
}) => {
    const parts = [];

    if (application?.resumeText) {
        parts.push(
            safeString(
                application.resumeText
            )
        );
    }

    if (profile) {
        parts.push(
            safeString(
                profile.headline
            )
        );

        parts.push(
            safeString(
                profile.bio
            )
        );

        parts.push(
            safeString(
                profile.preferredJobRole
            )
        );

        parts.push(
            ...flattenValues(
                profile.skills
            )
        );

        parts.push(
            ...flattenValues(
                profile.education
            )
        );

        parts.push(
            ...flattenValues(
                profile.experience
            )
        );

        parts.push(
            ...flattenValues(
                profile.projects
            )
        );

        parts.push(
            ...flattenValues(
                profile.certifications
            )
        );

        if (
            profile.resume
        ) {
            parts.push(
                safeString(
                    profile.resume.fileName
                )
            );
        }
    }

    if (user) {
        parts.push(
            safeString(
                user.name
            )
        );

        parts.push(
            safeString(
                user.username
            )
        );

        parts.push(
            safeString(
                user.email
            )
        );
    }

    return parts
        .filter(Boolean)
        .join("\n");
};

// ============================================================
// JOB TEXT
// ============================================================

const buildJobText = (
    job
) => {
    const parts = [
        safeString(
            job?.title
        ),

        safeString(
            job?.description
        ),

        ...flattenValues(
            job?.responsibilities
        ),

        ...flattenValues(
            job?.requirements
        ),

        ...flattenValues(
            job?.qualifications
        ),

        ...flattenValues(
            job?.requiredSkills
        ),

        ...flattenValues(
            job?.preferredSkills
        ),
    ];

    return parts
        .filter(Boolean)
        .join("\n");
};

// ============================================================
// JOB ROLE / DESCRIPTION MATCH
// ============================================================

const calculateRoleDescriptionMatch = ({
    job,
    resumeText,
}) => {
    const jobText =
        buildJobText(job);

    if (!jobText) {
        return {
            percentage: 100,
            matched: [],
            missing: [],
        };
    }

    const jobTokens =
        uniqueStrings(
            tokenize(jobText)
        );

    if (
        jobTokens.length === 0
    ) {
        return {
            percentage: 100,
            matched: [],
            missing: [],
        };
    }

    const resumeLower =
        safeString(
            resumeText
        ).toLowerCase();

    const matched = [];
    const missing = [];

    jobTokens.forEach(
        (keyword) => {
            if (
                resumeLower.includes(
                    keyword
                )
            ) {
                matched.push(
                    keyword
                );
            } else {
                missing.push(
                    keyword
                );
            }
        }
    );

    const percentage =
        (matched.length /
            jobTokens.length) *
        100;

    return {
        percentage: roundNumber(
            clamp(
                percentage
            )
        ),

        matched:
            matched.slice(0, 30),

        missing:
            missing.slice(0, 30),
    };
};

// ============================================================
// SKILL MATCH
// ============================================================

const calculateSkillMatch = ({
    job,
    resumeText,
    profile,
}) => {
    const {
        requiredSkills,
        preferredSkills,
    } = getJobSkills(job);

    const candidateSkills =
        getCandidateSkills(
            profile
        );

    const normalizedResume =
        safeString(
            resumeText
        );

    const allCandidateSkills =
        new Set(
            candidateSkills
        );

    const matchedRequired = [];
    const missingRequired = [];

    requiredSkills.forEach(
        (skill) => {
            const found =
                allCandidateSkills.has(
                    skill
                ) ||
                textContainsPhrase(
                    normalizedResume,
                    skill
                );

            if (found) {
                matchedRequired.push(
                    skill
                );
            } else {
                missingRequired.push(
                    skill
                );
            }
        }
    );

    const matchedPreferred = [];
    const missingPreferred = [];

    preferredSkills.forEach(
        (skill) => {
            const found =
                allCandidateSkills.has(
                    skill
                ) ||
                textContainsPhrase(
                    normalizedResume,
                    skill
                );

            if (found) {
                matchedPreferred.push(
                    skill
                );
            } else {
                missingPreferred.push(
                    skill
                );
            }
        }
    );

    let requiredPercentage = 100;

    if (
        requiredSkills.length > 0
    ) {
        requiredPercentage =
            (matchedRequired.length /
                requiredSkills.length) *
            100;
    }

    let preferredPercentage = 100;

    if (
        preferredSkills.length > 0
    ) {
        preferredPercentage =
            (matchedPreferred.length /
                preferredSkills.length) *
            100;
    }

    let skillPercentage;

    if (
        requiredSkills.length > 0 &&
        preferredSkills.length > 0
    ) {
        skillPercentage =
            requiredPercentage *
                0.8 +
            preferredPercentage *
                0.2;
    } else if (
        requiredSkills.length > 0
    ) {
        skillPercentage =
            requiredPercentage;
    } else if (
        preferredSkills.length > 0
    ) {
        skillPercentage =
            preferredPercentage;
    } else {
        skillPercentage = 100;
    }

    const matchedSkills =
        uniqueStrings([
            ...matchedRequired,
            ...matchedPreferred,
        ]);

    const missingSkills =
        uniqueStrings([
            ...missingRequired,
            ...missingPreferred,
        ]);

    return {
        percentage:
            roundNumber(
                clamp(
                    skillPercentage
                )
            ),

        matchedSkills,

        missingSkills,
    };
};

// ============================================================
// EXPERIENCE PARSER
// ============================================================

const parseYearsFromText = (
    value
) => {
    const text =
        safeString(value)
            .toLowerCase();

    if (!text) {
        return null;
    }

    if (
        /fresher|fresh graduate|entry level|no experience|0\s*year/.test(
            text
        )
    ) {
        return 0;
    }

    const plusMatch =
        text.match(
            /(\d+(?:\.\d+)?)\s*\+/
        );

    if (plusMatch) {
        return Number(
            plusMatch[1]
        );
    }

    const rangeMatch =
        text.match(
            /(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)/
        );

    if (rangeMatch) {
        return Number(
            rangeMatch[1]
        );
    }

    const match =
        text.match(
            /(\d+(?:\.\d+)?)/
        );

    if (match) {
        return Number(
            match[1]
        );
    }

    return null;
};

// ============================================================
// CANDIDATE EXPERIENCE YEARS
// ============================================================

const getCandidateExperienceYears = (
    profile,
    resumeText
) => {
    const experiences =
        Array.isArray(
            profile?.experience
        )
            ? profile.experience
            : profile?.experience
            ? [profile.experience]
            : [];

    if (
        experiences.length ===
        0
    ) {
        const parsed =
            parseYearsFromText(
                resumeText
            );

        return parsed === null
            ? 0
            : parsed;
    }

    let totalYears = 0;

    experiences.forEach(
        (experience) => {
            const directYears =
                parseYearsFromText(
                    experience?.years
                );

            if (
                directYears !==
                null
            ) {
                totalYears +=
                    directYears;

                return;
            }

            const levelYears =
                parseYearsFromText(
                    experience?.experienceLevel
                );

            if (
                levelYears !==
                null
            ) {
                totalYears +=
                    levelYears;
            }
        }
    );

    if (
        totalYears > 0
    ) {
        return Math.min(
            30,
            totalYears
        );
    }

    return 0;
};

// ============================================================
// REQUIRED EXPERIENCE
// ============================================================

const getRequiredExperienceYears = (
    job
) => {
    return (
        parseYearsFromText(
            job?.experienceRequired
        ) ??
        parseYearsFromText(
            job?.experience
        ) ??
        0
    );
};

// ============================================================
// EXPERIENCE MATCH
// ============================================================

const calculateExperienceMatch = ({
    job,
    profile,
    resumeText,
}) => {
    const requiredYears =
        getRequiredExperienceYears(
            job
        );

    const candidateYears =
        getCandidateExperienceYears(
            profile,
            resumeText
        );

    if (
        requiredYears <= 0
    ) {
        return {
            percentage: 100,
            requiredYears: 0,
            candidateYears:
                roundNumber(
                    candidateYears,
                    1
                ),
        };
    }

    if (
        candidateYears >=
        requiredYears
    ) {
        return {
            percentage: 100,
            requiredYears,
            candidateYears:
                roundNumber(
                    candidateYears,
                    1
                ),
        };
    }

    const percentage =
        (candidateYears /
            requiredYears) *
        100;

    return {
        percentage:
            roundNumber(
                clamp(
                    percentage
                )
            ),

        requiredYears,

        candidateYears:
            roundNumber(
                candidateYears,
                1
            ),
    };
};

// ============================================================
// EDUCATION MATCH
// ============================================================

const calculateEducationMatch = ({
    job,
    profile,
    resumeText,
}) => {
    const jobEducationValues =
        uniqueStrings([
            ...flattenValues(
                job?.education
            ),
            ...flattenValues(
                job?.qualification
            ),
            ...flattenValues(
                job?.qualifications
            ),
            ...flattenValues(
                job?.educationRequirement
            ),
        ]);

    const jobEducationText =
        jobEducationValues.join(
            " "
        );

    if (
        !jobEducationText.trim()
    ) {
        return {
            percentage: 100,
        };
    }

    const candidateEducationText =
        [
            ...flattenValues(
                profile?.education
            ),
            safeString(
                resumeText
            ),
        ].join(" ");

    const jobTokens =
        uniqueStrings(
            tokenize(
                jobEducationText
            )
        );

    if (
        jobTokens.length ===
        0
    ) {
        return {
            percentage: 100,
        };
    }

    const candidateLower =
        candidateEducationText.toLowerCase();

    const matched =
        jobTokens.filter(
            (token) =>
                candidateLower.includes(
                    token
                )
        );

    const percentage =
        (matched.length /
            jobTokens.length) *
        100;

    return {
        percentage:
            roundNumber(
                clamp(
                    percentage
                )
            ),
    };
};

// ============================================================
// RESUME COMPLETENESS
// ============================================================

const calculateResumeCompleteness = ({
    application,
    profile,
    resumeText,
}) => {
    const checks = [
        Boolean(
            safeString(
                application?.fullName
            )
        ),

        Boolean(
            safeString(
                application?.email
            )
        ),

        Boolean(
            safeString(
                application?.phone
            )
        ),

        Boolean(
            profile?.skills &&
                flattenValues(
                    profile.skills
                ).length > 0
        ),

        Boolean(
            profile?.education &&
                flattenValues(
                    profile.education
                ).length > 0
        ),

        Boolean(
            profile?.experience &&
                flattenValues(
                    profile.experience
                ).length > 0
        ),

        Boolean(
            profile?.projects &&
                flattenValues(
                    profile.projects
                ).length > 0
        ),

        Boolean(
            safeString(
                resumeText
            )
        ),
    ];

    const completed =
        checks.filter(
            Boolean
        ).length;

    const percentage =
        (completed /
            checks.length) *
        100;

    return roundNumber(
        clamp(
            percentage
        )
    );
};

// ============================================================
// ATS STRENGTH
// ============================================================

const getATSStrength = (
    score
) => {
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
// ATS RECOMMENDATION
// ============================================================

const getATSRecommendation = (
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
// ATS SUMMARY
// ============================================================

const buildATSSummary = ({
    score,
    skillPercentage,
    rolePercentage,
    experiencePercentage,
    educationPercentage,
    completenessPercentage,
}) => {
    if (score >= 80) {
        return (
            `Strong overall match. The resume aligns well with the job skills and role description. ` +
            `Skills: ${skillPercentage}%, role/description: ${rolePercentage}%, ` +
            `experience: ${experiencePercentage}%, education: ${educationPercentage}%, ` +
            `resume completeness: ${completenessPercentage}%.`
        );
    }

    if (score >= 65) {
        return (
            `Good overall match. The candidate meets a substantial portion of the job requirements, ` +
            `but some areas can still be improved. Skills: ${skillPercentage}%, ` +
            `role/description: ${rolePercentage}%, experience: ${experiencePercentage}%, ` +
            `education: ${educationPercentage}%, resume completeness: ${completenessPercentage}%.`
        );
    }

    if (score >= 50) {
        return (
            `Moderate match. The resume has some relevant alignment with the posted role, ` +
            `but several requirements may need attention. Skills: ${skillPercentage}%, ` +
            `role/description: ${rolePercentage}%, experience: ${experiencePercentage}%, ` +
            `education: ${educationPercentage}%, resume completeness: ${completenessPercentage}%.`
        );
    }

    return (
        `Weak overall match. The resume has limited alignment with the current job requirements. ` +
        `Skills: ${skillPercentage}%, role/description: ${rolePercentage}%, ` +
        `experience: ${experiencePercentage}%, education: ${educationPercentage}%, ` +
        `resume completeness: ${completenessPercentage}%.`
    );
};

// ============================================================
// ATS IMPROVEMENTS
// ============================================================

const buildATSImprovements = ({
    missingSkills,
    missingKeywords,
    experiencePercentage,
    educationPercentage,
    completenessPercentage,
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
            `Improve role-description alignment by including relevant keywords such as: ${missingKeywords
                .slice(0, 8)
                .join(", ")}.`
        );
    }

    if (
        experiencePercentage <
        100
    ) {
        improvements.push(
            "The candidate's documented experience is below the minimum experience requirement for this job."
        );
    }

    if (
        educationPercentage <
        100
    ) {
        improvements.push(
            "Review the education or qualification requirement and make relevant qualifications clear in the resume."
        );
    }

    if (
        completenessPercentage <
        100
    ) {
        improvements.push(
            "Complete missing resume/profile sections such as skills, education, experience, projects, or resume text."
        );
    }

    if (
        improvements.length ===
        0
    ) {
        improvements.push(
            "No major ATS improvement areas were detected."
        );
    }

    return improvements;
};

// ============================================================
// CALCULATE COMPLETE ATS RESULT
// ============================================================

const calculateATSResult = ({
    application,
    job,
    profile,
    user,
}) => {
    const resumeText =
        buildResumeText({
            application,
            profile,
            user,
        });

    const skillResult =
        calculateSkillMatch({
            job,
            resumeText,
            profile,
        });

    const roleResult =
        calculateRoleDescriptionMatch(
            {
                job,
                resumeText,
            }
        );

    const experienceResult =
        calculateExperienceMatch({
            job,
            profile,
            resumeText,
        });

    const educationResult =
        calculateEducationMatch({
            job,
            profile,
            resumeText,
        });

    const completenessPercentage =
        calculateResumeCompleteness({
            application,
            profile,
            resumeText,
        });

    // ========================================================
    // EXACT WEIGHTED SCORE
    // ========================================================

    const rawScore =
        skillResult.percentage *
            ATS_WEIGHTS.skills +
        roleResult.percentage *
            ATS_WEIGHTS.roleDescription +
        experienceResult.percentage *
            ATS_WEIGHTS.experience +
        educationResult.percentage *
            ATS_WEIGHTS.education +
        completenessPercentage *
            ATS_WEIGHTS.completeness;

    const score =
        roundNumber(
            clamp(
                rawScore
            )
        );

    const strength =
        getATSStrength(
            score
        );

    const recommendation =
        getATSRecommendation(
            score
        );

    const improvements =
        buildATSImprovements({
            missingSkills:
                skillResult.missingSkills,

            missingKeywords:
                roleResult.missing,

            experiencePercentage:
                experienceResult.percentage,

            educationPercentage:
                educationResult.percentage,

            completenessPercentage,
        });

    const summary =
        buildATSSummary({
            score,

            skillPercentage:
                skillResult.percentage,

            rolePercentage:
                roleResult.percentage,

            experiencePercentage:
                experienceResult.percentage,

            educationPercentage:
                educationResult.percentage,

            completenessPercentage,
        });

    return {
        score,

        strength,

        recommendation,

        matchedKeywords:
            roleResult.matched,

        missingKeywords:
            roleResult.missing,

        matchedSkills:
            skillResult.matchedSkills,

        missingSkills:
            skillResult.missingSkills,

        keywordMatchPercentage:
            roleResult.percentage,

        skillMatchPercentage:
            skillResult.percentage,

        experienceMatchPercentage:
            experienceResult.percentage,

        educationMatchPercentage:
            educationResult.percentage,

        resumeCompletenessPercentage:
            completenessPercentage,

        summary,

        checkedAt:
            new Date(),

        // ----------------------------------------------------
        // These fields are intentionally NOT saved because your
        // current MongoDB ATS schema does not define them.
        //
        // The score is already calculated from:
        //
        // Skills       = 35%
        // Role         = 25%
        // Experience   = 20%
        // Education    = 10%
        // Completeness = 10%
        // ----------------------------------------------------

        improvements,
    };
};

// ============================================================
// GET CANDIDATE PROFILE
// ============================================================

const getCandidateProfile =
    async (
        candidateId
    ) => {
        try {
            return await CandidateProfile.findOne(
                {
                    user: candidateId,
                }
            ).lean();
        } catch (error) {
            console.error(
                "CANDIDATE PROFILE LOOKUP ERROR:",
                error
            );

            return null;
        }
    };

// ============================================================
// GET USER
// ============================================================

const getCandidateUser =
    async (
        candidateId
    ) => {
        try {
            return await User.findById(
                candidateId
            ).lean();
        } catch (error) {
            console.error(
                "USER LOOKUP ERROR:",
                error
            );

            return null;
        }
    };

// ============================================================
// GET APPLICATION + JOB
// ============================================================

const getApplicationWithJob =
    async (
        applicationId
    ) => {
        if (
            !isValidObjectId(
                applicationId
            )
        ) {
            return null;
        }

        const application =
            await Application.findById(
                applicationId
            );

        if (!application) {
            return null;
        }

        const job =
            await Job.findById(
                application.job
            ).lean();

        if (!job) {
            return {
                application,
                job: null,
            };
        }

        return {
            application,
            job,
        };
    };

// ============================================================
// RECRUITER OWNERSHIP
// ============================================================

const recruiterOwnsJob = (
    job,
    recruiterId
) => {
    if (
        !job ||
        !recruiterId
    ) {
        return false;
    }

    const jobRecruiter =
        job.recruiter?._id ||
        job.recruiter;

    return sameId(
        jobRecruiter,
        recruiterId
    );
};

// ============================================================
// SUBMIT APPLICATION
// ============================================================

const submitApplication =
    async (
        req,
        res
    ) => {
        try {
            const candidateId =
                req.user?._id ||
                req.user?.id;

            const {
                job: jobId,
                coverLetter,
                fullName,
                email,
                phone,
                linkedin,
                portfolio,
                resumeText,
                resume,
            } = req.body || {};

            if (!candidateId) {
                return res
                    .status(401)
                    .json({
                        success: false,
                        message:
                            "Authentication required.",
                    });
            }

            if (!jobId) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Job ID is required.",
                    });
            }

            if (
                !isValidObjectId(
                    jobId
                )
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Invalid job ID.",
                    });
            }

            const job =
                await Job.findById(
                    jobId
                ).lean();

            if (!job) {
                return res
                    .status(404)
                    .json({
                        success: false,
                        message:
                            "Job not found.",
                    });
            }

            const existing =
                await Application.findOne(
                    {
                        candidate:
                            candidateId,
                        job: jobId,
                    }
                );

            if (existing) {
                return res
                    .status(409)
                    .json({
                        success: false,
                        message:
                            "You have already applied for this job.",
                        application:
                            existing,
                    });
            }

            const profile =
                await getCandidateProfile(
                    candidateId
                );

            const user =
                await getCandidateUser(
                    candidateId
                );

            const resolvedFullName =
                safeString(
                    fullName
                ) ||
                safeString(
                    profile?.fullName
                ) ||
                safeString(
                    user?.name
                ) ||
                safeString(
                    user?.username
                ) ||
                "Candidate";

            const resolvedEmail =
                safeString(
                    email
                ) ||
                safeString(
                    user?.email
                );

            const resolvedPhone =
                safeString(
                    phone
                ) ||
                safeString(
                    profile?.phone
                );

            if (!resolvedEmail) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Candidate email is required.",
                    });
            }

            if (!resolvedPhone) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Candidate phone number is required.",
                    });
            }

            // ------------------------------------------------
            // RESUME TEXT
            // ------------------------------------------------

            const temporaryApplication =
                {
                    fullName:
                        resolvedFullName,
                    email:
                        resolvedEmail,
                    phone:
                        resolvedPhone,
                    resumeText:
                        safeString(
                            resumeText
                        ),
                };

            const resolvedResumeText =
                buildResumeText({
                    application:
                        temporaryApplication,
                    profile,
                    user,
                });

            // ------------------------------------------------
            // CREATE APPLICATION
            // ------------------------------------------------

            const application =
                new Application({
                    candidate:
                        candidateId,

                    job: jobId,

                    fullName:
                        resolvedFullName,

                    email:
                        resolvedEmail
                            .toLowerCase(),

                    phone:
                        resolvedPhone,

                    linkedin:
                        safeString(
                            linkedin
                        ),

                    portfolio:
                        safeString(
                            portfolio
                        ),

                    resume: {
                        fileName:
                            safeString(
                                resume?.fileName
                            ),

                        fileUrl:
                            safeString(
                                resume?.fileUrl
                            ),
                    },

                    resumeText:
                        resolvedResumeText,

                    coverLetter:
                        safeString(
                            coverLetter
                        ),

                    status:
                        "Applied",

                    statusUpdatedAt:
                        new Date(),
                });

            // ------------------------------------------------
            // CALCULATE ATS IMMEDIATELY
            // ------------------------------------------------

            const ats =
                calculateATSResult({
                    application,
                    job,
                    profile,
                    user,
                });

            // ------------------------------------------------
            // IMPORTANT:
            //
            // Your ATS schema does not contain `improvements`.
            // Therefore only save the fields that actually exist
            // in the schema.
            // ------------------------------------------------

            application.ats = {
                score:
                    ats.score,

                strength:
                    ats.strength,

                recommendation:
                    ats.recommendation,

                matchedKeywords:
                    ats.matchedKeywords,

                missingKeywords:
                    ats.missingKeywords,

                matchedSkills:
                    ats.matchedSkills,

                missingSkills:
                    ats.missingSkills,

                keywordMatchPercentage:
                    ats.keywordMatchPercentage,

                skillMatchPercentage:
                    ats.skillMatchPercentage,

                experienceMatchPercentage:
                    ats.experienceMatchPercentage,

                educationMatchPercentage:
                    ats.educationMatchPercentage,

                resumeCompletenessPercentage:
                    ats.resumeCompletenessPercentage,

                summary:
                    ats.summary,

                checkedAt:
                    ats.checkedAt,
            };

            await application.save();

            const populatedApplication =
                await Application.findById(
                    application._id
                )
                    .populate(
                        "job"
                    )
                    .populate(
                        "candidate",
                        "name username email role"
                    );

            return res
                .status(201)
                .json({
                    success: true,

                    message:
                        "Application submitted successfully.",

                    application:
                        populatedApplication,

                    ats: application.ats,
                });
        } catch (error) {
            console.error(
                "SUBMIT APPLICATION ERROR:",
                error
            );

            if (
                error?.code === 11000
            ) {
                return res
                    .status(409)
                    .json({
                        success: false,
                        message:
                            "You have already applied for this job.",
                    });
            }

            return res
                .status(500)
                .json({
                    success: false,
                    message:
                        error?.message ||
                        "Failed to submit application.",
                });
        }
    };

// ============================================================
// GET MY APPLICATIONS
// ============================================================

const getMyApplications =
    async (
        req,
        res
    ) => {
        try {
            const candidateId =
                req.user?._id ||
                req.user?.id;

            if (!candidateId) {
                return res
                    .status(401)
                    .json({
                        success: false,
                        message:
                            "Authentication required.",
                    });
            }

            const applications =
                await Application.find({
                    candidate:
                        candidateId,
                })
                    .populate(
                        "job"
                    )
                    .sort({
                        createdAt:
                            -1,
                    })
                    .lean();

            return res.json({
                success: true,
                applications,
            });
        } catch (error) {
            console.error(
                "GET MY APPLICATIONS ERROR:",
                error
            );

            return res
                .status(500)
                .json({
                    success: false,
                    message:
                        error?.message ||
                        "Failed to fetch applications.",
                });
        }
    };

// ============================================================
// GET SINGLE APPLICATION
// ============================================================

const getApplicationById =
    async (
        req,
        res
    ) => {
        try {
            const applicationId =
                req.params.id;

            if (
                !isValidObjectId(
                    applicationId
                )
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Invalid application ID.",
                    });
            }

            const application =
                await Application.findById(
                    applicationId
                )
                    .populate(
                        "job"
                    )
                    .populate(
                        "candidate",
                        "name username email role"
                    );

            if (!application) {
                return res
                    .status(404)
                    .json({
                        success: false,
                        message:
                            "Application not found.",
                    });
            }

            const currentUserId =
                req.user?._id ||
                req.user?.id;

            const candidateMatches =
                sameId(
                    application.candidate?._id ||
                        application.candidate,
                    currentUserId
                );

            const job =
                await Job.findById(
                    application.job?._id ||
                        application.job
                ).lean();

            const recruiterMatches =
                recruiterOwnsJob(
                    job,
                    currentUserId
                );

            if (
                !candidateMatches &&
                !recruiterMatches
            ) {
                return res
                    .status(403)
                    .json({
                        success: false,
                        message:
                            "You are not authorized to view this application.",
                    });
            }

            return res.json({
                success: true,
                application,
            });
        } catch (error) {
            console.error(
                "GET APPLICATION ERROR:",
                error
            );

            return res
                .status(500)
                .json({
                    success: false,
                    message:
                        error?.message ||
                        "Failed to fetch application.",
                });
        }
    };

// ============================================================
// WITHDRAW APPLICATION
// ============================================================

const withdrawApplication =
    async (
        req,
        res
    ) => {
        try {
            const candidateId =
                req.user?._id ||
                req.user?.id;

            const application =
                await Application.findById(
                    req.params.id
                );

            if (!application) {
                return res
                    .status(404)
                    .json({
                        success: false,
                        message:
                            "Application not found.",
                    });
            }

            if (
                !sameId(
                    application.candidate,
                    candidateId
                )
            ) {
                return res
                    .status(403)
                    .json({
                        success: false,
                        message:
                            "You are not authorized to withdraw this application.",
                    });
            }

            await application.deleteOne();

            return res.json({
                success: true,
                message:
                    "Application withdrawn successfully.",
            });
        } catch (error) {
            console.error(
                "WITHDRAW APPLICATION ERROR:",
                error
            );

            return res
                .status(500)
                .json({
                    success: false,
                    message:
                        error?.message ||
                        "Failed to withdraw application.",
                });
        }
    };

// ============================================================
// GET RECRUITER APPLICATIONS
// ============================================================

const getRecruiterApplications =
    async (
        req,
        res
    ) => {
        try {
            const recruiterId =
                req.user?._id ||
                req.user?.id;

            if (!recruiterId) {
                return res
                    .status(401)
                    .json({
                        success: false,
                        message:
                            "Authentication required.",
                    });
            }

            const jobs =
                await Job.find({
                    recruiter:
                        recruiterId,
                })
                    .select(
                        "_id"
                    )
                    .lean();

            const jobIds =
                jobs.map(
                    (job) =>
                        job._id
                );

            if (
                jobIds.length ===
                0
            ) {
                return res.json({
                    success: true,
                    applications: [],
                });
            }

            const applications =
                await Application.find({
                    job: {
                        $in: jobIds,
                    },
                })
                    .populate(
                        "job"
                    )
                    .populate(
                        "candidate",
                        "name username email role"
                    )
                    .sort({
                        createdAt:
                            -1,
                    })
                    .lean();

            return res.json({
                success: true,
                applications,
            });
        } catch (error) {
            console.error(
                "GET RECRUITER APPLICATIONS ERROR:",
                error
            );

            return res
                .status(500)
                .json({
                    success: false,
                    message:
                        error?.message ||
                        "Failed to fetch recruiter applications.",
                });
        }
    };

// ============================================================
// UPDATE APPLICATION STATUS
// ============================================================

const updateApplicationStatus =
    async (
        req,
        res
    ) => {
        try {
            const recruiterId =
                req.user?._id ||
                req.user?.id;

            const {
                status,
            } =
                req.body || {};

            if (
                !APPLICATION_STATUSES.includes(
                    status
                )
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Invalid application status.",
                    });
            }

            const application =
                await Application.findById(
                    req.params.id
                );

            if (!application) {
                return res
                    .status(404)
                    .json({
                        success: false,
                        message:
                            "Application not found.",
                    });
            }

            const job =
                await Job.findById(
                    application.job
                ).lean();

            if (
                !recruiterOwnsJob(
                    job,
                    recruiterId
                )
            ) {
                return res
                    .status(403)
                    .json({
                        success: false,
                        message:
                            "You are not authorized to update this application.",
                    });
            }

            application.status =
                status;

            application.statusUpdatedAt =
                new Date();

            await application.save();

            return res.json({
                success: true,
                message:
                    "Application status updated successfully.",
                application,
            });
        } catch (error) {
            console.error(
                "UPDATE APPLICATION STATUS ERROR:",
                error
            );

            return res
                .status(500)
                .json({
                    success: false,
                    message:
                        error?.message ||
                        "Failed to update application status.",
                });
        }
    };

// ============================================================
// UPDATE RECRUITER NOTES
// ============================================================

const updateRecruiterNotes =
    async (
        req,
        res
    ) => {
        try {
            const recruiterId =
                req.user?._id ||
                req.user?.id;

            const application =
                await Application.findById(
                    req.params.id
                );

            if (!application) {
                return res
                    .status(404)
                    .json({
                        success: false,
                        message:
                            "Application not found.",
                    });
            }

            const job =
                await Job.findById(
                    application.job
                ).lean();

            if (
                !recruiterOwnsJob(
                    job,
                    recruiterId
                )
            ) {
                return res
                    .status(403)
                    .json({
                        success: false,
                        message:
                            "You are not authorized to update recruiter notes.",
                    });
            }

            application.recruiterNotes =
                safeString(
                    req.body?.recruiterNotes
                );

            await application.save();

            return res.json({
                success: true,
                message:
                    "Recruiter notes updated successfully.",
                application,
            });
        } catch (error) {
            console.error(
                "UPDATE RECRUITER NOTES ERROR:",
                error
            );

            return res
                .status(500)
                .json({
                    success: false,
                    message:
                        error?.message ||
                        "Failed to update recruiter notes.",
                });
        }
    };

// ============================================================
// UPDATE INTERVIEW
// ============================================================

const updateInterview =
    async (
        req,
        res
    ) => {
        try {
            const recruiterId =
                req.user?._id ||
                req.user?.id;

            const application =
                await Application.findById(
                    req.params.id
                );

            if (!application) {
                return res
                    .status(404)
                    .json({
                        success: false,
                        message:
                            "Application not found.",
                    });
            }

            const job =
                await Job.findById(
                    application.job
                ).lean();

            if (
                !recruiterOwnsJob(
                    job,
                    recruiterId
                )
            ) {
                return res
                    .status(403)
                    .json({
                        success: false,
                        message:
                            "You are not authorized to schedule this interview.",
                    });
            }

            if (
                String(
                    application.status ||
                        ""
                ).trim() !==
                "Interview"
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            'Application status must be "Interview" before scheduling.',
                    });
            }

            const {
                role,
                company,
                location,
                date,
                startTime,
                endTime,
                meetLink,
            } =
                req.body || {};

            if (
                !date ||
                !startTime ||
                !endTime ||
                !meetLink
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Date, start time, end time and meeting link are required.",
                    });
            }

            let meetUrl;

            try {
                meetUrl =
                    new URL(
                        String(
                            meetLink
                        ).trim()
                    );
            } catch (error) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Invalid Google Meet URL.",
                    });
            }

            if (
                meetUrl.protocol !==
                    "https:" ||
                meetUrl.hostname !==
                    "meet.google.com"
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Please provide a valid Google Meet URL.",
                    });
            }

            const interviewDate =
                new Date(
                    `${date}T00:00:00`
                );

            if (
                Number.isNaN(
                    interviewDate.getTime()
                )
            ) {
                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Invalid interview date.",
                    });
            }

            application.interview =
                {
                    scheduled:
                        true,

                    role:
                        safeString(
                            role
                        ) ||
                        safeString(
                            job?.title
                        ),

                    company:
                        safeString(
                            company
                        ) ||
                        safeString(
                            job?.companyName
                        ),

                    location:
                        safeString(
                            location
                        ) ||
                        safeString(
                            job?.location
                        ),

                    date:
                        interviewDate,

                    startTime:
                        safeString(
                            startTime
                        ),

                    endTime:
                        safeString(
                            endTime
                        ),

                    meetLink:
                        meetUrl.toString(),

                    scheduledAt:
                        new Date(),
                };

            // Legacy fields kept for compatibility
            application.interviewDate =
                interviewDate;

            application.interviewType =
                "Google Meet";

            application.interviewNotes =
                "Interview scheduled through TalentIQ.";

            await application.save();

            const updatedApplication =
                await Application.findById(
                    application._id
                )
                    .populate(
                        "job"
                    )
                    .populate(
                        "candidate",
                        "name username email role"
                    );

            return res.json({
                success: true,
                message:
                    "Interview scheduled successfully.",
                application:
                    updatedApplication,
            });
        } catch (error) {
            console.error(
                "UPDATE INTERVIEW ERROR:",
                error
            );

            return res
                .status(500)
                .json({
                    success: false,
                    message:
                        error?.message ||
                        "Failed to schedule interview.",
                });
        }
    };

// ============================================================
// REMOVE APPLICATION BY RECRUITER
// ============================================================

const removeApplicationByRecruiter =
    async (
        req,
        res
    ) => {
        try {
            const recruiterId =
                req.user?._id ||
                req.user?.id;

            const application =
                await Application.findById(
                    req.params.id
                );

            if (!application) {
                return res
                    .status(404)
                    .json({
                        success: false,
                        message:
                            "Application not found.",
                    });
            }

            const job =
                await Job.findById(
                    application.job
                ).lean();

            if (
                !recruiterOwnsJob(
                    job,
                    recruiterId
                )
            ) {
                return res
                    .status(403)
                    .json({
                        success: false,
                        message:
                            "You are not authorized to remove this application.",
                    });
            }

            await application.deleteOne();

            return res.json({
                success: true,
                message:
                    "Application removed successfully.",
            });
        } catch (error) {
            console.error(
                "REMOVE APPLICATION BY RECRUITER ERROR:",
                error
            );

            return res
                .status(500)
                .json({
                    success: false,
                    message:
                        error?.message ||
                        "Failed to remove application.",
                });
        }
    };

// ============================================================
// CALCULATE / SAVE ATS
// ============================================================

const calculateAndSaveATS =
    async (
        application
    ) => {
        const job =
            await Job.findById(
                application.job
            ).lean();

        if (!job) {
            throw new Error(
                "Job associated with this application was not found."
            );
        }

        const profile =
            await getCandidateProfile(
                application.candidate
            );

        const user =
            await getCandidateUser(
                application.candidate
            );

        const calculatedATS =
            calculateATSResult({
                application,
                job,
                profile,
                user,
            });

        application.ats =
            {
                score:
                    calculatedATS.score,

                strength:
                    calculatedATS.strength,

                recommendation:
                    calculatedATS.recommendation,

                matchedKeywords:
                    calculatedATS.matchedKeywords,

                missingKeywords:
                    calculatedATS.missingKeywords,

                matchedSkills:
                    calculatedATS.matchedSkills,

                missingSkills:
                    calculatedATS.missingSkills,

                keywordMatchPercentage:
                    calculatedATS.keywordMatchPercentage,

                skillMatchPercentage:
                    calculatedATS.skillMatchPercentage,

                experienceMatchPercentage:
                    calculatedATS.experienceMatchPercentage,

                educationMatchPercentage:
                    calculatedATS.educationMatchPercentage,

                resumeCompletenessPercentage:
                    calculatedATS.resumeCompletenessPercentage,

                summary:
                    calculatedATS.summary,

                checkedAt:
                    calculatedATS.checkedAt,
            };

        await application.save();

        return {
            ats:
                application.ats,

            calculatedDetails:
                {
                    score:
                        calculatedATS.score,

                    weights:
                        {
                            skills:
                                ATS_WEIGHTS.skills *
                                100,

                            roleDescription:
                                ATS_WEIGHTS.roleDescription *
                                100,

                            experience:
                                ATS_WEIGHTS.experience *
                                100,

                            education:
                                ATS_WEIGHTS.education *
                                100,

                            completeness:
                                ATS_WEIGHTS.completeness *
                                100,
                        },

                    improvements:
                        calculatedATS.improvements,
                },
        };
    };

// ============================================================
// GET ATS RESULT
// ============================================================

const getATSResult =
    async (
        req,
        res
    ) => {
        try {
            const recruiterId =
                req.user?._id ||
                req.user?.id;

            const application =
                await Application.findById(
                    req.params.id
                );

            if (!application) {
                return res
                    .status(404)
                    .json({
                        success: false,
                        message:
                            "Application not found.",
                    });
            }

            const job =
                await Job.findById(
                    application.job
                ).lean();

            if (!job) {
                return res
                    .status(404)
                    .json({
                        success: false,
                        message:
                            "Job associated with this application was not found.",
                    });
            }

            if (
                !recruiterOwnsJob(
                    job,
                    recruiterId
                )
            ) {
                return res
                    .status(403)
                    .json({
                        success: false,
                        message:
                            "You are not authorized to view ATS analysis for this application.",
                    });
            }

            // ------------------------------------------------
            // ALWAYS RECALCULATE
            //
            // This prevents the old default 35% from being shown
            // when job/resume/profile data changes.
            // ------------------------------------------------

            const result =
                await calculateAndSaveATS(
                    application
                );

            return res.json({
                success: true,

                ats:
                    result.ats,

                details:
                    result.calculatedDetails,
            });
        } catch (error) {
            console.error(
                "GET ATS RESULT ERROR:",
                error
            );

            return res
                .status(500)
                .json({
                    success: false,
                    message:
                        error?.message ||
                        "Failed to calculate ATS result.",
                });
        }
    };

// ============================================================
// RECHECK ATS
// ============================================================

const recheckATS =
    async (
        req,
        res
    ) => {
        try {
            const recruiterId =
                req.user?._id ||
                req.user?.id;

            const application =
                await Application.findById(
                    req.params.id
                );

            if (!application) {
                return res
                    .status(404)
                    .json({
                        success: false,
                        message:
                            "Application not found.",
                    });
            }

            const job =
                await Job.findById(
                    application.job
                ).lean();

            if (
                !recruiterOwnsJob(
                    job,
                    recruiterId
                )
            ) {
                return res
                    .status(403)
                    .json({
                        success: false,
                        message:
                            "You are not authorized to recheck ATS for this application.",
                    });
            }

            const result =
                await calculateAndSaveATS(
                    application
                );

            application.atsReviewedByRecruiter =
                true;

            application.atsReviewedAt =
                new Date();

            await application.save();

            return res.json({
                success: true,

                message:
                    "ATS analysis recalculated successfully.",

                ats:
                    application.ats,

                details:
                    result.calculatedDetails,
            });
        } catch (error) {
            console.error(
                "RECHECK ATS ERROR:",
                error
            );

            return res
                .status(500)
                .json({
                    success: false,
                    message:
                        error?.message ||
                        "Failed to recheck ATS.",
                });
        }
    };

// ============================================================
// EXPORT
// ============================================================

module.exports = {
    submitApplication,

    getMyApplications,

    getApplicationById,

    withdrawApplication,

    getRecruiterApplications,

    updateApplicationStatus,

    updateRecruiterNotes,

    updateInterview,

    removeApplicationByRecruiter,

    getATSResult,

    recheckATS,
};