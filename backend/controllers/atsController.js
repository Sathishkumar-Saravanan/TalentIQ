const fs = require("fs");
const path = require("path");

const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

const Application = require("../models/Application");
const Job = require("../models/Job");

// ============================================================
// TEXT HELPERS
// ============================================================

const cleanText = (value) => {
    if (value === null || value === undefined) {
        return "";
    }

    if (typeof value === "string") {
        return value
            .replace(/\s+/g, " ")
            .trim();
    }

    if (typeof value === "number") {
        return String(value);
    }

    if (Array.isArray(value)) {
        return value
            .map((item) => cleanText(item))
            .filter(Boolean)
            .join(" ");
    }

    if (typeof value === "object") {
        return Object.values(value)
            .map((item) => cleanText(item))
            .filter(Boolean)
            .join(" ");
    }

    return "";
};

// ============================================================
// NORMALIZE TEXT
// ============================================================

const normalizeText = (value) => {
    return cleanText(value)
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^\w+#.\- ]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
};

// ============================================================
// NORMALIZE SKILL
// ============================================================

const normalizeSkill = (skill) => {
    return normalizeText(skill)
        .replace(/\./g, "")
        .trim();
};

// ============================================================
// UNIQUE ARRAY
// ============================================================

const uniqueArray = (items) => {
    const map = new Map();

    for (const item of items) {
        const original = cleanText(item);

        if (!original) {
            continue;
        }

        const normalized = normalizeText(original);

        if (!normalized) {
            continue;
        }

        if (!map.has(normalized)) {
            map.set(normalized, original);
        }
    }

    return Array.from(map.values());
};

// ============================================================
// GET ARRAY FIELD
// ============================================================

const getArrayField = (...values) => {
    for (const value of values) {
        if (Array.isArray(value)) {
            return value
                .map((item) => cleanText(item))
                .filter(Boolean);
        }
    }

    return [];
};

// ============================================================
// JOB SKILLS
// ============================================================

const getJobSkills = (job) => {
    return uniqueArray(
        getArrayField(
            job?.skills,
            job?.requiredSkills,
            job?.technicalSkills,
            job?.requirements?.skills,
            job?.requirements?.requiredSkills
        )
    );
};

// ============================================================
// JOB TITLE
// ============================================================

const getJobTitle = (job) => {
    return cleanText(
        job?.title ||
        job?.jobTitle ||
        job?.role ||
        job?.position ||
        ""
    );
};

// ============================================================
// JOB DESCRIPTION
// ============================================================

const getJobDescription = (job) => {
    return cleanText(
        job?.description ||
        job?.jobDescription ||
        job?.roleDescription ||
        job?.responsibilities ||
        job?.requirements?.description ||
        ""
    );
};

// ============================================================
// JOB EXPERIENCE
// ============================================================

const getJobExperienceText = (job) => {
    return cleanText(
        job?.experience ||
        job?.experienceRequired ||
        job?.requiredExperience ||
        job?.experienceLevel ||
        job?.requirements?.experience ||
        ""
    );
};

// ============================================================
// EXTRACT YEARS FROM TEXT
// ============================================================

const extractYears = (text) => {
    const normalized = normalizeText(text);

    if (!normalized) {
        return null;
    }

    const patterns = [
        /(\d+(?:\.\d+)?)\s*(?:\+)?\s*years?/i,
        /(\d+(?:\.\d+)?)\s*(?:to|-)\s*(\d+(?:\.\d+)?)\s*years?/i,
    ];

    let match = normalized.match(patterns[1]);

    if (match) {
        return {
            min: Number(match[1]),
            max: Number(match[2]),
        };
    }

    match = normalized.match(patterns[0]);

    if (match) {
        return {
            min: Number(match[1]),
            max: Number(match[1]),
        };
    }

    if (
        normalized.includes("fresher") ||
        normalized.includes("entry level") ||
        normalized.includes("0-1") ||
        normalized.includes("0 - 1") ||
        normalized.includes("0 to 1")
    ) {
        return {
            min: 0,
            max: 1,
        };
    }

    if (
        normalized.includes("0-2") ||
        normalized.includes("0 - 2") ||
        normalized.includes("0 to 2")
    ) {
        return {
            min: 0,
            max: 2,
        };
    }

    if (
        normalized.includes("1-2") ||
        normalized.includes("1 - 2") ||
        normalized.includes("1 to 2")
    ) {
        return {
            min: 1,
            max: 2,
        };
    }

    return null;
};

// ============================================================
// CANDIDATE EXPERIENCE
// ============================================================

const getCandidateExperienceText = (application) => {
    return cleanText(
        application?.experience ||
        application?.yearsOfExperience ||
        application?.candidateExperience ||
        application?.resume?.experience ||
        application?.candidate?.experience ||
        application?.candidate?.yearsOfExperience ||
        ""
    );
};

// ============================================================
// CANDIDATE YEARS
// ============================================================

const getCandidateYears = (application, resumeText = "") => {
    const directExperience =
        getCandidateExperienceText(application);

    const directYears = extractYears(
        directExperience
    );

    if (directYears) {
        return directYears.min;
    }

    const combinedText = [
        directExperience,
        resumeText,
    ].join(" ");

    const extracted = extractYears(
        combinedText
    );

    if (extracted) {
        return extracted.min;
    }

    return null;
};

// ============================================================
// RESUME URL
// ============================================================

const getResumeUrl = (application) => {
    return cleanText(
        application?.resume?.fileUrl ||
        application?.resume?.url ||
        application?.resumeUrl ||
        application?.fileUrl ||
        ""
    );
};

// ============================================================
// RESUME FILE NAME
// ============================================================

const getResumeFileName = (application) => {
    return cleanText(
        application?.resume?.fileName ||
        application?.resume?.name ||
        application?.resumeName ||
        ""
    );
};

// ============================================================
// RESUME TEXT ALREADY STORED
// ============================================================

const getStoredResumeText = (application) => {
    return cleanText(
        application?.resume?.text ||
        application?.resume?.parsedText ||
        application?.resume?.extractedText ||
        application?.resumeText ||
        application?.parsedResumeText ||
        ""
    );
};

// ============================================================
// RESOLVE LOCAL RESUME PATH
// ============================================================

const resolveResumePath = (fileUrl) => {
    if (!fileUrl) {
        return "";
    }

    let cleanUrl = String(fileUrl)
        .split("?")[0]
        .trim();

    // Ignore external URL for local filesystem parsing.
    if (
        cleanUrl.startsWith("http://") ||
        cleanUrl.startsWith("https://")
    ) {
        return "";
    }

    cleanUrl = cleanUrl.replace(/^[/\\]+/, "");

    const possiblePaths = [
        path.join(process.cwd(), cleanUrl),
        path.join(
            process.cwd(),
            "uploads",
            cleanUrl.replace(/^uploads[/\\]/i, "")
        ),
        path.join(
            process.cwd(),
            "public",
            cleanUrl
        ),
    ];

    for (const possiblePath of possiblePaths) {
        if (fs.existsSync(possiblePath)) {
            return possiblePath;
        }
    }

    return "";
};

// ============================================================
// EXTRACT RESUME TEXT
// ============================================================

const extractResumeText = async (application) => {
    // --------------------------------------------------------
    // First use text already stored in MongoDB.
    // --------------------------------------------------------

    const storedText =
        getStoredResumeText(application);

    if (storedText) {
        return storedText;
    }

    // --------------------------------------------------------
    // Try local uploaded file.
    // --------------------------------------------------------

    const fileUrl =
        getResumeUrl(application);

    const filePath =
        resolveResumePath(fileUrl);

    if (!filePath) {
        return "";
    }

    const extension =
        path.extname(filePath).toLowerCase();

    try {
        const buffer =
            await fs.promises.readFile(
                filePath
            );

        // ----------------------------------------------------
        // PDF
        // ----------------------------------------------------

        if (extension === ".pdf") {
            const parsed =
                await pdfParse(buffer);

            return cleanText(
                parsed?.text || ""
            );
        }

        // ----------------------------------------------------
        // DOCX
        // ----------------------------------------------------

        if (extension === ".docx") {
            const result =
                await mammoth.extractRawText({
                    buffer,
                });

            return cleanText(
                result?.value || ""
            );
        }

        // ----------------------------------------------------
        // TXT
        // ----------------------------------------------------

        if (extension === ".txt") {
            return cleanText(
                buffer.toString("utf8")
            );
        }

        return "";
    } catch (error) {
        console.error(
            "RESUME TEXT EXTRACTION ERROR:",
            error
        );

        return "";
    }
};

// ============================================================
// TOKENIZE
// ============================================================

const tokenize = (text) => {
    return new Set(
        normalizeText(text)
            .split(" ")
            .map((word) => word.trim())
            .filter(
                (word) =>
                    word.length >= 3
            )
    );
};

// ============================================================
// JOB KEYWORDS
// ============================================================

const STOP_WORDS = new Set([
    "the",
    "and",
    "for",
    "with",
    "that",
    "this",
    "from",
    "will",
    "your",
    "you",
    "our",
    "are",
    "have",
    "has",
    "been",
    "into",
    "using",
    "use",
    "work",
    "working",
    "job",
    "role",
    "candidate",
    "required",
    "requirements",
    "responsibilities",
    "should",
    "must",
    "about",
    "their",
    "they",
    "them",
    "who",
    "what",
    "where",
    "when",
    "how",
    "all",
    "any",
    "can",
    "able",
    "ability",
    "good",
    "strong",
    "experience",
]);

// ============================================================
// EXTRACT IMPORTANT KEYWORDS
// ============================================================

const extractKeywords = (
    jobTitle,
    jobDescription,
    jobSkills
) => {
    const titleWords =
        normalizeText(
            jobTitle
        )
            .split(" ")
            .filter(
                (word) =>
                    word.length >= 3 &&
                    !STOP_WORDS.has(word)
            );

    const descriptionWords =
        normalizeText(
            jobDescription
        )
            .split(" ")
            .filter(
                (word) =>
                    word.length >= 4 &&
                    !STOP_WORDS.has(word)
            );

    return uniqueArray([
        ...titleWords,
        ...descriptionWords.slice(
            0,
            150
        ),
        ...jobSkills,
    ]);
};

// ============================================================
// SKILL MATCH
// ============================================================

const calculateSkillMatch = (
    jobSkills,
    resumeText,
    application
) => {
    const resumeNormalized =
        normalizeText(
            [
                resumeText,
                application?.coverLetter,
                application?.additionalInformation,
            ].join(" ")
        );

    if (jobSkills.length === 0) {
        return {
            percentage: 100,
            matched: [],
            missing: [],
        };
    }

    const matched = [];
    const missing = [];

    for (const skill of jobSkills) {
        const normalizedSkill =
            normalizeSkill(skill);

        if (!normalizedSkill) {
            continue;
        }

        // Exact phrase match first.
        if (
            resumeNormalized.includes(
                normalizedSkill
            )
        ) {
            matched.push(skill);
            continue;
        }

        // Also handle common variations.
        const skillWords =
            normalizedSkill
                .split(" ")
                .filter(Boolean);

        const allWordsFound =
            skillWords.length > 0 &&
            skillWords.every(
                (word) =>
                    resumeNormalized.includes(
                        word
                    )
            );

        if (allWordsFound) {
            matched.push(skill);
        } else {
            missing.push(skill);
        }
    }

    const percentage =
        jobSkills.length === 0
            ? 100
            : Math.round(
                  (matched.length /
                      jobSkills.length) *
                      100
              );

    return {
        percentage,
        matched: uniqueArray(matched),
        missing: uniqueArray(missing),
    };
};

// ============================================================
// KEYWORD MATCH
// ============================================================

const calculateKeywordMatch = (
    keywords,
    resumeText,
    application
) => {
    const sourceText =
        normalizeText(
            [
                resumeText,
                application?.coverLetter,
                application?.additionalInformation,
            ].join(" ")
        );

    if (keywords.length === 0) {
        return {
            percentage: 100,
            matched: [],
            missing: [],
        };
    }

    const matched = [];
    const missing = [];

    for (const keyword of keywords) {
        const normalizedKeyword =
            normalizeText(keyword);

        if (!normalizedKeyword) {
            continue;
        }

        if (
            sourceText.includes(
                normalizedKeyword
            )
        ) {
            matched.push(keyword);
        } else {
            missing.push(keyword);
        }
    }

    const percentage =
        keywords.length === 0
            ? 100
            : Math.round(
                  (matched.length /
                      keywords.length) *
                      100
              );

    return {
        percentage,
        matched: uniqueArray(
            matched
        ).slice(0, 30),
        missing: uniqueArray(
            missing
        ).slice(0, 30),
    };
};

// ============================================================
// EXPERIENCE MATCH
// ============================================================

const calculateExperienceMatch = (
    job,
    application,
    resumeText
) => {
    const jobExperience =
        getJobExperienceText(job);

    const required =
        extractYears(
            jobExperience
        );

    const candidateYears =
        getCandidateYears(
            application,
            resumeText
        );

    // No experience requirement.
    if (!required) {
        return {
            percentage: 100,
            requiredYears: null,
            candidateYears,
        };
    }

    // Candidate experience unavailable.
    if (
        candidateYears === null
    ) {
        return {
            percentage: 30,
            requiredYears:
                required.min,
            candidateYears: null,
        };
    }

    // Candidate meets minimum.
    if (
        candidateYears >=
        required.min
    ) {
        if (
            required.max &&
            candidateYears >
                required.max
        ) {
            return {
                percentage: 100,
                requiredYears:
                    required.min,
                candidateYears,
            };
        }

        return {
            percentage: 100,
            requiredYears:
                required.min,
            candidateYears,
        };
    }

    // Candidate has some relevant experience
    // but below requirement.
    if (candidateYears > 0) {
        const percentage = Math.max(
            20,
            Math.min(
                90,
                Math.round(
                    (candidateYears /
                        required.min) *
                        100
                )
            )
        );

        return {
            percentage,
            requiredYears:
                required.min,
            candidateYears,
        };
    }

    // Fresher against required experience.
    return {
        percentage:
            required.min === 0
                ? 100
                : 20,
        requiredYears:
            required.min,
        candidateYears,
    };
};

// ============================================================
// EDUCATION MATCH
// ============================================================

const calculateEducationMatch = (
    job,
    application,
    resumeText
) => {
    const requiredEducation =
        cleanText(
            job?.education ||
            job?.educationRequirement ||
            job?.requiredEducation ||
            job?.requirements?.education ||
            ""
        );

    const candidateEducation =
        cleanText(
            application?.education ||
            application?.candidate?.education ||
            resumeText
        );

    if (!requiredEducation) {
        return 100;
    }

    if (!candidateEducation) {
        return 0;
    }

    const requiredTokens =
        tokenize(
            requiredEducation
        );

    const candidateNormalized =
        normalizeText(
            candidateEducation
        );

    if (
        candidateNormalized.includes(
            normalizeText(
                requiredEducation
            )
        )
    ) {
        return 100;
    }

    let matches = 0;

    for (const token of requiredTokens) {
        if (
            candidateNormalized.includes(
                token
            )
        ) {
            matches += 1;
        }
    }

    if (
        requiredTokens.size === 0
    ) {
        return 100;
    }

    return Math.round(
        (matches /
            requiredTokens.size) *
            100
    );
};

// ============================================================
// RESUME COMPLETENESS
// ============================================================

const calculateResumeCompleteness = (
    application,
    resumeText
) => {
    const checks = [
        Boolean(
            cleanText(
                application?.fullName ||
                application?.candidate?.fullName
            )
        ),

        Boolean(
            cleanText(
                application?.email ||
                application?.candidate?.email
            )
        ),

        Boolean(
            cleanText(
                application?.phone ||
                application?.candidate?.phone
            )
        ),

        Boolean(
            resumeText
        ),

        Boolean(
            getResumeFileName(
                application
            )
        ),

        Boolean(
            cleanText(
                application?.linkedin
            )
        ),

        Boolean(
            cleanText(
                application?.portfolio
            )
        ),

        Boolean(
            cleanText(
                application?.coverLetter
            )
        ),
    ];

    const completed =
        checks.filter(Boolean)
            .length;

    return Math.round(
        (completed /
            checks.length) *
            100
    );
};

// ============================================================
// ROLE MATCH
// ============================================================

const calculateRoleMatch = (
    jobTitle,
    resumeText
) => {
    const titleTokens =
        normalizeText(
            jobTitle
        )
            .split(" ")
            .filter(
                (word) =>
                    word.length >= 3 &&
                    !STOP_WORDS.has(word)
            );

    if (
        titleTokens.length === 0
    ) {
        return 100;
    }

    const resumeNormalized =
        normalizeText(
            resumeText
        );

    const matched =
        titleTokens.filter(
            (word) =>
                resumeNormalized.includes(
                    word
                )
        );

    return Math.round(
        (matched.length /
            titleTokens.length) *
            100
    );
};

// ============================================================
// OVERALL SCORE
// ============================================================

const calculateOverallScore = ({
    skillMatch,
    keywordMatch,
    experienceMatch,
    educationMatch,
    resumeCompleteness,
    roleMatch,
}) => {
    /*
     * TalentIQ ATS weighting:
     *
     * Skills              35%
     * Role + Description  25%
     * Experience          20%
     * Education           10%
     * Resume Completeness 10%
     *
     * Role match is included inside
     * the role/description component.
     */

    const roleDescriptionScore =
        Math.round(
            (keywordMatch * 0.7) +
                (roleMatch * 0.3)
        );

    const score =
        skillMatch * 0.35 +
        roleDescriptionScore * 0.25 +
        experienceMatch * 0.20 +
        educationMatch * 0.10 +
        resumeCompleteness * 0.10;

    return Math.max(
        0,
        Math.min(
            100,
            Math.round(score)
        )
    );
};

// ============================================================
// STRENGTH
// ============================================================

const getStrength = (score) => {
    if (score >= 85) {
        return "Excellent";
    }

    if (score >= 70) {
        return "Strong";
    }

    if (score >= 55) {
        return "Good";
    }

    if (score >= 40) {
        return "Moderate";
    }

    return "Weak";
};

// ============================================================
// RECOMMENDATION
// ============================================================

const getRecommendation = ({
    score,
    missingSkills,
    experienceMatch,
    roleMatch,
}) => {
    if (score >= 85) {
        return "The candidate's resume strongly matches the posted role, skills and experience requirements.";
    }

    if (score >= 70) {
        return "The candidate has a strong match with some areas that should be reviewed by the recruiter.";
    }

    if (score >= 55) {
        return "The candidate has a moderate match. Review missing skills and experience before proceeding.";
    }

    if (
        missingSkills.length > 0 &&
        experienceMatch < 50
    ) {
        return "The resume has significant skill and experience gaps compared with the posted position.";
    }

    if (roleMatch < 40) {
        return "The resume shows limited alignment with the selected job role.";
    }

    return "The resume has a limited match with the current job requirements.";
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
        missingSkills.length > 0
    ) {
        improvements.push(
            `Add or demonstrate relevant skills: ${missingSkills
                .slice(0, 6)
                .join(", ")}.`
        );
    }

    if (
        missingKeywords.length > 0
    ) {
        improvements.push(
            `Consider including relevant job terminology such as: ${missingKeywords
                .slice(0, 6)
                .join(", ")}.`
        );
    }

    if (
        experienceMatch < 70
    ) {
        improvements.push(
            "The candidate's experience does not fully meet the posted experience requirement."
        );
    }

    if (
        educationMatch < 70
    ) {
        improvements.push(
            "Review the education requirement and make relevant qualifications clearer in the resume."
        );
    }

    if (
        resumeCompleteness < 75
    ) {
        improvements.push(
            "Complete missing resume/application information such as professional links, contact information or cover letter."
        );
    }

    if (
        improvements.length === 0
    ) {
        improvements.push(
            "The resume is well aligned with the current job requirements."
        );
    }

    return improvements;
};

// ============================================================
// ATS ANALYSIS ENGINE
// ============================================================

const analyzeApplicationATS = async (
    application,
    job
) => {
    const resumeText =
        await extractResumeText(
            application
        );

    const jobTitle =
        getJobTitle(job);

    const jobDescription =
        getJobDescription(job);

    const jobExperience =
        getJobExperienceText(job);

    const jobSkills =
        getJobSkills(job);

    const keywords =
        extractKeywords(
            jobTitle,
            jobDescription,
            jobSkills
        );

    const skillResult =
        calculateSkillMatch(
            jobSkills,
            resumeText,
            application
        );

    const keywordResult =
        calculateKeywordMatch(
            keywords,
            resumeText,
            application
        );

    const experienceResult =
        calculateExperienceMatch(
            job,
            application,
            resumeText
        );

    const educationMatch =
        calculateEducationMatch(
            job,
            application,
            resumeText
        );

    const resumeCompleteness =
        calculateResumeCompleteness(
            application,
            resumeText
        );

    const roleMatch =
        calculateRoleMatch(
            jobTitle,
            resumeText
        );

    const score =
        calculateOverallScore({
            skillMatch:
                skillResult.percentage,

            keywordMatch:
                keywordResult.percentage,

            experienceMatch:
                experienceResult.percentage,

            educationMatch,

            resumeCompleteness,

            roleMatch,
        });

    const strength =
        getStrength(score);

    const recommendation =
        getRecommendation({
            score,
            missingSkills:
                skillResult.missing,
            experienceMatch:
                experienceResult.percentage,
            roleMatch,
        });

    const improvements =
        createImprovements({
            missingSkills:
                skillResult.missing,

            missingKeywords:
                keywordResult.missing,

            experienceMatch:
                experienceResult.percentage,

            educationMatch,

            resumeCompleteness,
        });

    const summary =
        `The candidate has a ${score}% ATS match for the ${jobTitle || "posted position"}. ` +
        `Skill match is ${skillResult.percentage}%, keyword match is ${keywordResult.percentage}%, ` +
        `experience match is ${experienceResult.percentage}%, education match is ${educationMatch}%, ` +
        `and resume completeness is ${resumeCompleteness}%.`;

    return {
        score,

        strength,

        recommendation,

        summary,

        matchedSkills:
            skillResult.matched,

        missingSkills:
            skillResult.missing,

        matchedKeywords:
            keywordResult.matched,

        missingKeywords:
            keywordResult.missing,

        keywordMatchPercentage:
            keywordResult.percentage,

        skillMatchPercentage:
            skillResult.percentage,

        experienceMatchPercentage:
            experienceResult.percentage,

        educationMatchPercentage:
            educationMatch,

        resumeCompletenessPercentage:
            resumeCompleteness,

        roleMatchPercentage:
            roleMatch,

        requiredExperience:
            jobExperience,

        candidateExperience:
            getCandidateExperienceText(
                application
            ),

        requiredSkills:
            jobSkills,

        jobTitle,

        checkedAt:
            new Date().toISOString(),

        improvements,

        resumeAnalyzed:
            Boolean(resumeText),

        resumeTextLength:
            resumeText.length,
    };
};

// ============================================================
// GET ATS
// GET /api/applications/:id/ats
// ============================================================

const getApplicationATS = async (
    req,
    res
) => {
    try {
        const application =
            await Application.findById(
                req.params.id
            )
                .populate("job")
                .populate("candidate")
                .populate("user");

        if (!application) {
            return res.status(404).json({
                success: false,
                message:
                    "Application not found.",
            });
        }

        const job =
            application.job;

        if (!job) {
            return res.status(404).json({
                success: false,
                message:
                    "The job associated with this application was not found.",
            });
        }

        // ----------------------------------------------------
        // SECURITY:
        // Only the recruiter who owns the job can analyze.
        // ----------------------------------------------------

        const recruiterId =
            job.recruiter?._id ||
            job.recruiter;

        const currentUserId =
            req.user?._id ||
            req.user?.id;

        if (
            recruiterId &&
            currentUserId &&
            String(recruiterId) !==
                String(currentUserId)
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You are not authorized to analyze this application.",
            });
        }

        const ats =
            await analyzeApplicationATS(
                application,
                job
            );

        // ----------------------------------------------------
        // Save latest ATS result.
        //
        // This means the recruiter does not receive a
        // temporary frontend-only 35% value.
        // ----------------------------------------------------

        application.ats = ats;

        await application.save();

        return res.status(200).json({
            success: true,
            ats,
        });
    } catch (error) {
        console.error(
            "GET APPLICATION ATS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to analyze application.",
        });
    }
};

// ============================================================
// RECHECK ATS
// PATCH /api/applications/:id/ats
// ============================================================

const recheckApplicationATS = async (
    req,
    res
) => {
    try {
        const application =
            await Application.findById(
                req.params.id
            )
                .populate("job")
                .populate("candidate")
                .populate("user");

        if (!application) {
            return res.status(404).json({
                success: false,
                message:
                    "Application not found.",
            });
        }

        const job =
            application.job;

        if (!job) {
            return res.status(404).json({
                success: false,
                message:
                    "The job associated with this application was not found.",
            });
        }

        const recruiterId =
            job.recruiter?._id ||
            job.recruiter;

        const currentUserId =
            req.user?._id ||
            req.user?.id;

        if (
            recruiterId &&
            currentUserId &&
            String(recruiterId) !==
                String(currentUserId)
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You are not authorized to recheck this application.",
            });
        }

        const ats =
            await analyzeApplicationATS(
                application,
                job
            );

        application.ats =
            ats;

        await application.save();

        return res.status(200).json({
            success: true,
            message:
                "ATS analysis recalculated successfully.",
            ats,
        });
    } catch (error) {
        console.error(
            "RECHECK APPLICATION ATS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to recheck ATS.",
        });
    }
};

module.exports = {
    getApplicationATS,
    recheckApplicationATS,
    analyzeApplicationATS,
};