const Job = require("../models/Job");
const User = require("../models/User");
const Resume = require("../models/Resume");

// ============================================================
// HELPERS
// ============================================================

const normalizeArray = (value) => {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .flatMap((item) => {
            if (typeof item === "string") {
                return [item];
            }

            if (item && typeof item === "object") {
                return Object.values(item);
            }

            return [];
        })
        .filter(Boolean)
        .map((item) =>
            String(item)
                .trim()
                .toLowerCase()
        );
};

const normalizeText = (value) => {
    if (!value) {
        return "";
    }

    return String(value)
        .trim()
        .toLowerCase();
};

const getStringArray = (...values) => {
    return values
        .flatMap((value) => {
            if (Array.isArray(value)) {
                return value;
            }

            if (value) {
                return [value];
            }

            return [];
        })
        .map((value) => normalizeText(value))
        .filter(Boolean);
};

// ============================================================
// CALCULATE MATCH SCORE
// ============================================================

const calculateMatchScore = ({
    job,
    user,
    resume,
}) => {
    // --------------------------------------------------------
    // CANDIDATE DATA
    // --------------------------------------------------------

    const candidateSkills = [
        ...getStringArray(user?.skills),
        ...getStringArray(resume?.skills),
    ];

    const uniqueCandidateSkills = [
        ...new Set(candidateSkills),
    ];

    // --------------------------------------------------------
    // TARGET ROLES
    // --------------------------------------------------------

    const targetRoles = [
        user?.careerPreferences?.targetRole,
        user?.preferredJobRole,
        user?.headline,
        resume?.headline,
    ]
        .map(normalizeText)
        .filter(Boolean);

    // --------------------------------------------------------
    // PREFERRED LOCATION
    // --------------------------------------------------------

    const preferredLocations = [
        user?.careerPreferences?.preferredLocation,
        user?.location,
        resume?.personalInfo?.location,
    ]
        .map(normalizeText)
        .filter(Boolean);

    // --------------------------------------------------------
    // JOB DATA
    // --------------------------------------------------------

    const jobTitle = normalizeText(job.title);

    const jobDescription = normalizeText(
        job.description
    );

    const jobLocation = normalizeText(
        job.location
    );

    const jobSkills = [
        ...getStringArray(
            job.requiredSkills,
            job.skills
        ),
    ];

    const uniqueJobSkills = [
        ...new Set(jobSkills),
    ];

    // --------------------------------------------------------
    // 1. SKILL MATCH
    // --------------------------------------------------------

    let matchedSkills = [];

    uniqueJobSkills.forEach((requiredSkill) => {
        const found = uniqueCandidateSkills.some(
            (candidateSkill) => {
                return (
                    candidateSkill === requiredSkill ||
                    candidateSkill.includes(requiredSkill) ||
                    requiredSkill.includes(candidateSkill)
                );
            }
        );

        if (found) {
            matchedSkills.push(requiredSkill);
        }
    });

    const skillScore =
        uniqueJobSkills.length > 0
            ? Math.round(
                  (matchedSkills.length /
                      uniqueJobSkills.length) *
                      55
              )
            : 0;

    // --------------------------------------------------------
    // 2. ROLE MATCH
    // --------------------------------------------------------

    let roleMatched = false;

    targetRoles.forEach((role) => {
        if (
            role.includes(jobTitle) ||
            jobTitle.includes(role)
        ) {
            roleMatched = true;
        }

        const roleWords = role
            .split(/\s+/)
            .filter((word) => word.length > 2);

        const matchingWords = roleWords.filter(
            (word) =>
                jobTitle.includes(word)
        );

        if (
            roleWords.length > 0 &&
            matchingWords.length /
                roleWords.length >=
                0.5
        ) {
            roleMatched = true;
        }
    });

    const roleScore = roleMatched ? 20 : 0;

    // --------------------------------------------------------
    // 3. LOCATION MATCH
    // --------------------------------------------------------

    let locationMatched = false;

    preferredLocations.forEach((location) => {
        if (
            location &&
            jobLocation &&
            (
                jobLocation.includes(location) ||
                location.includes(jobLocation)
            )
        ) {
            locationMatched = true;
        }
    });

    const locationScore =
        locationMatched ? 10 : 0;

    // --------------------------------------------------------
    // 4. DESCRIPTION / RESUME MATCH
    // --------------------------------------------------------

    const resumeText = normalizeText(
        [
            resume?.headline,
            resume?.summary,
            resume?.skills?.join(" "),
        ].join(" ")
    );

    let descriptionMatches = 0;

    uniqueCandidateSkills.forEach(
        (skill) => {
            if (
                skill.length > 2 &&
                jobDescription.includes(skill)
            ) {
                descriptionMatches++;
            }
        }
    );

    let descriptionScore = 0;

    if (resumeText && jobDescription) {
        const keywordMatches =
            uniqueCandidateSkills.filter(
                (skill) =>
                    jobDescription.includes(skill)
            ).length;

        if (keywordMatches >= 5) {
            descriptionScore = 10;
        } else if (keywordMatches >= 3) {
            descriptionScore = 7;
        } else if (keywordMatches >= 1) {
            descriptionScore = 4;
        }
    }

    // --------------------------------------------------------
    // TOTAL
    // --------------------------------------------------------

    let totalScore =
        skillScore +
        roleScore +
        locationScore +
        descriptionScore;

    // --------------------------------------------------------
    // STRONG ALIGNMENT RULE
    // --------------------------------------------------------
    //
    // A job should NOT be labelled "AI Match" merely because
    // it has some matching skill.
    //
    // It needs meaningful role/skill alignment.
    // --------------------------------------------------------

    const strongSkillMatch =
        uniqueJobSkills.length > 0 &&
        matchedSkills.length >=
            Math.max(
                1,
                Math.ceil(
                    uniqueJobSkills.length * 0.4
                )
            );

    const meaningfulMatch =
        (
            roleMatched &&
            strongSkillMatch
        ) ||
        (
            strongSkillMatch &&
            descriptionScore >= 7
        ) ||
        (
            roleMatched &&
            matchedSkills.length >= 1
        );

    return {
        score: Math.min(
            100,
            Math.round(totalScore)
        ),

        meaningfulMatch,

        roleMatched,

        locationMatched,

        matchedSkills,

        missingSkills:
            uniqueJobSkills.filter(
                (skill) =>
                    !matchedSkills.includes(skill)
            ),
    };
};

// ============================================================
// GET AI RECOMMENDED JOBS
// ============================================================

const getRecommendations = async (
    req,
    res
) => {
    try {
        // ----------------------------------------------------
        // AUTHENTICATED USER
        // ----------------------------------------------------

        const candidateId =
            req.user?._id ||
            req.user?.id;

        if (!candidateId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        // ----------------------------------------------------
        // GET USER
        // ----------------------------------------------------

        const user =
            await User.findById(candidateId)
                .lean();

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Candidate not found",
            });
        }

        // ----------------------------------------------------
        // GET RESUME
        // ----------------------------------------------------

        const resume =
            await Resume.findOne({
                user: candidateId,
            }).lean();

        // ----------------------------------------------------
        // GET ACTIVE JOBS
        // ----------------------------------------------------

        const jobs =
            await Job.find({
                status: {
                    $in: [
                        "active",
                        "open",
                        "published",
                    ],
                },
            })
                .sort({
                    createdAt: -1,
                })
                .lean();

        // ----------------------------------------------------
        // FALLBACK
        //
        // Some existing TalentIQ jobs may not have status.
        // If no jobs were found, get jobs that are not closed.
        // ----------------------------------------------------

        let availableJobs = jobs;

        if (
            availableJobs.length === 0
        ) {
            availableJobs =
                await Job.find({
                    status: {
                        $nin: [
                            "closed",
                            "deleted",
                            "expired",
                        ],
                    },
                })
                    .sort({
                        createdAt: -1,
                    })
                    .lean();
        }

        // ----------------------------------------------------
        // SCORE EVERY JOB
        // ----------------------------------------------------

        const recommendations =
            availableJobs
                .map((job) => {
                    const result =
                        calculateMatchScore({
                            job,
                            user,
                            resume,
                        });

                    return {
                        ...job,

                        matchScore:
                            result.score,

                        aiMatch:
                            result.meaningfulMatch,

                        matchedSkills:
                            result.matchedSkills,

                        missingSkills:
                            result.missingSkills,

                        roleMatched:
                            result.roleMatched,

                        locationMatched:
                            result.locationMatched,
                    };
                })

                // --------------------------------------------
                // ONLY REAL MATCHES
                // --------------------------------------------

                .filter(
                    (job) =>
                        job.aiMatch === true &&
                        job.matchScore >= 35
                )

                // --------------------------------------------
                // HIGHEST MATCH FIRST
                // --------------------------------------------

                .sort(
                    (a, b) =>
                        b.matchScore -
                        a.matchScore
                );

        // ----------------------------------------------------
        // RESPONSE
        // ----------------------------------------------------

        return res.status(200).json({
            success: true,

            count:
                recommendations.length,

            jobs:
                recommendations,
        });
    } catch (error) {
        console.error(
            "AI recommendations error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to generate AI job recommendations",
            error:
                process.env.NODE_ENV ===
                "development"
                    ? error.message
                    : undefined,
        });
    }
};

module.exports = {
    getRecommendations,
};