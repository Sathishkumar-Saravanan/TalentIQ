const User = require("../models/User");
const Resume = require("../models/Resume");
const Job = require("../models/Job");

/*
============================================================
HELPERS
============================================================
*/

const normalizeText = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim().toLowerCase();
  }

  if (typeof value === "number") {
    return String(value).toLowerCase();
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

  return "";
};

const toArray = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === "string") {
        return item.trim();
      }

      if (item && typeof item === "object") {
        return (
          item.name ||
          item.title ||
          item.skill ||
          item.value ||
          ""
        );
      }

      return "";
    })
    .filter(Boolean);
};

const getUserId = (req) => {
  return (
    req.user?.id ||
    req.user?._id ||
    req.user?.userId
  );
};

/*
============================================================
EXPERIENCE MATCH
============================================================
*/

const getExperienceNumber = (value) => {
  const text = normalizeText(value);

  if (!text) {
    return 0;
  }

  if (text.includes("fresher")) {
    return 0;
  }

  const plusMatch = text.match(/(\d+)\s*\+/);

  if (plusMatch) {
    return Number(plusMatch[1]);
  }

  const rangeMatch = text.match(
    /(\d+)\s*[-to]+\s*(\d+)/
  );

  if (rangeMatch) {
    return Number(rangeMatch[1]);
  }

  const numberMatch = text.match(/(\d+)/);

  return numberMatch
    ? Number(numberMatch[1])
    : 0;
};

/*
============================================================
SKILL MATCH
============================================================
*/

const calculateSkillMatch = (
  candidateSkills,
  jobSkills
) => {
  const candidate = candidateSkills.map((skill) =>
    normalizeText(skill)
  );

  const required = jobSkills.map((skill) =>
    normalizeText(skill)
  );

  if (!required.length) {
    return {
      score: 50,
      matchingSkills: [],
      missingSkills: [],
    };
  }

  const matchingSkills = [];
  const missingSkills = [];

  required.forEach((requiredSkill) => {
    const matched = candidate.some(
      (candidateSkill) =>
        candidateSkill === requiredSkill ||
        candidateSkill.includes(requiredSkill) ||
        requiredSkill.includes(candidateSkill)
    );

    if (matched) {
      matchingSkills.push(requiredSkill);
    } else {
      missingSkills.push(requiredSkill);
    }
  });

  const score =
    (matchingSkills.length / required.length) *
    100;

  return {
    score: Math.round(score),
    matchingSkills,
    missingSkills,
  };
};

/*
============================================================
KEYWORD MATCH
============================================================
*/

const calculateKeywordMatch = (
  keyword,
  job,
  profile,
  resume
) => {
  const search = normalizeText(keyword);

  if (!search) {
    return 50;
  }

  const searchableText = [
    job.title,
    job.companyName,
    job.company,
    job.description,
    job.category,
    job.jobCategory,
    job.department,
    job.requiredSkills,
    job.skills,

    profile?.headline,
    profile?.bio,
    profile?.careerPreferences?.targetRole,

    resume?.headline,
    resume?.summary,
    resume?.skills,
    resume?.experience,
    resume?.projects,
  ]
    .map(normalizeText)
    .join(" ");

  const words = search
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) {
    return 50;
  }

  const matchedWords = words.filter((word) =>
    searchableText.includes(word)
  );

  return Math.round(
    (matchedWords.length / words.length) * 100
  );
};

/*
============================================================
LOCATION MATCH
============================================================
*/

const calculateLocationMatch = (
  searchLocation,
  jobLocation,
  preferredLocation,
  remotePreference
) => {
  const search = normalizeText(searchLocation);
  const job = normalizeText(jobLocation);
  const preferred = normalizeText(preferredLocation);
  const remote = normalizeText(remotePreference);

  if (
    remote &&
    remotePreference &&
    job.includes("remote")
  ) {
    return 100;
  }

  if (!search) {
    if (
      preferred &&
      job &&
      job.includes(preferred)
    ) {
      return 100;
    }

    return 50;
  }

  if (
    job.includes(search) ||
    search.includes(job)
  ) {
    return 100;
  }

  return 0;
};

/*
============================================================
GENERIC FIELD MATCH
============================================================
*/

const calculateFieldMatch = (
  requestedValue,
  actualValue
) => {
  const requested = normalizeText(
    requestedValue
  );

  const actual = normalizeText(actualValue);

  if (!requested) {
    return 50;
  }

  if (!actual) {
    return 0;
  }

  if (
    actual === requested ||
    actual.includes(requested) ||
    requested.includes(actual)
  ) {
    return 100;
  }

  return 0;
};

/*
============================================================
EXPERIENCE MATCH
============================================================
*/

const calculateExperienceMatch = (
  requestedExperience,
  jobExperience,
  resume
) => {
  if (!requestedExperience) {
    return 50;
  }

  const requested =
    getExperienceNumber(requestedExperience);

  const required =
    getExperienceNumber(jobExperience);

  const candidateExperience =
    resume?.experience?.length || 0;

  if (
    requested === 0 &&
    required === 0
  ) {
    return 100;
  }

  if (
    candidateExperience >= required
  ) {
    return 100;
  }

  if (
    requested >= required
  ) {
    return 100;
  }

  if (
    Math.abs(
      candidateExperience - required
    ) <= 1
  ) {
    return 75;
  }

  return 30;
};

/*
============================================================
BUILD MATCH REASON
============================================================
*/

const buildMatchReason = ({
  skillResult,
  keywordScore,
  locationScore,
  typeScore,
  modeScore,
}) => {
  const reasons = [];

  if (skillResult.matchingSkills.length > 0) {
    reasons.push(
      `${skillResult.matchingSkills.length} matching skill${
        skillResult.matchingSkills.length > 1
          ? "s"
          : ""
      }`
    );
  }

  if (keywordScore >= 70) {
    reasons.push("strong keyword relevance");
  }

  if (locationScore >= 80) {
    reasons.push("location preference match");
  }

  if (typeScore >= 80) {
    reasons.push("employment type match");
  }

  if (modeScore >= 80) {
    reasons.push("work mode match");
  }

  if (!reasons.length) {
    return "This opportunity has some relevance to your search and profile.";
  }

  return `Matched through ${reasons.join(", ")}.`;
};

/*
============================================================
AI JOB SEARCH
============================================================
GET /api/jobs/ai-search
============================================================
*/

const aiJobSearch = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required.",
      });
    }

    const {
      keyword = "",
      location = "",
      experience = "",
      jobType = "",
      workMode = "",
    } = req.query;

    if (!keyword.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide a job title, skill or keyword.",
      });
    }

    /*
    ========================================================
    LOAD USER PROFILE
    ========================================================
    */

    const profile = await User.findById(userId)
      .select("-password")
      .lean();

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "User profile not found.",
      });
    }

    /*
    ========================================================
    LOAD RESUME
    ========================================================
    */

    const resume = await Resume.findOne({
      user: userId,
    }).lean();

    /*
    ========================================================
    CANDIDATE SKILLS
    ========================================================
    */

    const profileSkills = toArray(
      profile.skills
    );

    const resumeSkills = toArray(
      resume?.skills
    );

    const candidateSkills = [
      ...profileSkills,
      ...resumeSkills,
    ].filter(
      (skill, index, array) =>
        array.findIndex(
          (item) =>
            normalizeText(item) ===
            normalizeText(skill)
        ) === index
    );

    /*
    ========================================================
    USER PREFERENCES
    ========================================================
    */

    const preferredLocation =
      profile?.careerPreferences
        ?.preferredLocation || "";

    const preferredJobType =
      profile?.careerPreferences
        ?.employmentType || "";

    const preferredWorkMode =
      profile?.careerPreferences
        ?.remotePreference || "";

    const targetRole =
      profile?.careerPreferences
        ?.targetRole || "";

    /*
    ========================================================
    GET ACTIVE RECRUITER JOBS
    ========================================================
    */

    const jobs = await Job.find({
      status: "Active",
    })
      .sort({
        createdAt: -1,
      })
      .lean();

    /*
    ========================================================
    SCORE EACH JOB
    ========================================================
    */

    const rankedJobs = jobs
      .map((job) => {
        const jobSkills = toArray(
          job.requiredSkills
        ).length
          ? toArray(job.requiredSkills)
          : toArray(job.skills);

        const skillResult =
          calculateSkillMatch(
            candidateSkills,
            jobSkills
          );

        const keywordScore =
          calculateKeywordMatch(
            keyword,
            job,
            profile,
            resume
          );

        const locationScore =
          calculateLocationMatch(
            location,
            job.location ||
              job.jobLocation ||
              "",
            preferredLocation,
            preferredWorkMode
          );

        const typeScore =
          calculateFieldMatch(
            jobType || preferredJobType,
            job.jobType ||
              job.type ||
              job.employmentType ||
              ""
          );

        const modeScore =
          calculateFieldMatch(
            workMode || preferredWorkMode,
            job.workMode ||
              job.mode ||
              job.remotePreference ||
              ""
          );

        const experienceScore =
          calculateExperienceMatch(
            experience,
            job.experience ||
              job.experienceRequired ||
              job.experienceLevel ||
              "",
            resume
          );

        /*
        ----------------------------------------------------
        WEIGHTED TALENTIQ MATCH SCORE
        ----------------------------------------------------
        */

        let matchScore =
          skillResult.score * 0.45 +
          keywordScore * 0.25 +
          locationScore * 0.10 +
          typeScore * 0.08 +
          modeScore * 0.07 +
          experienceScore * 0.05;

        /*
        Target role bonus
        */

        const roleText = normalizeText(
          targetRole
        );

        const jobTitle = normalizeText(
          job.title ||
            job.role ||
            job.position ||
            ""
        );

        if (
          roleText &&
          jobTitle &&
          (jobTitle.includes(roleText) ||
            roleText.includes(jobTitle))
        ) {
          matchScore += 5;
        }

        matchScore = Math.min(
          100,
          Math.max(
            0,
            Math.round(matchScore)
          )
        );

        const company =
          job.companyName ||
          job.company ||
          job.recruiterCompany ||
          "Company";

        const title =
          job.title ||
          job.role ||
          job.position ||
          "Job Opportunity";

        const skills =
          jobSkills.length > 0
            ? jobSkills
            : [];

        return {
          ...job,

          id: job._id,

          title,

          companyName: company,

          location:
            job.location ||
            job.jobLocation ||
            "Location not specified",

          jobType:
            job.jobType ||
            job.type ||
            job.employmentType ||
            "Full Time",

          workMode:
            job.workMode ||
            job.mode ||
            job.remotePreference ||
            "Not specified",

          experience:
            job.experience ||
            job.experienceRequired ||
            job.experienceLevel ||
            "Not specified",

          skills,

          matchScore,

          match: matchScore,

          matchingSkills:
            skillResult.matchingSkills,

          missingSkills:
            skillResult.missingSkills,

          matchReason: buildMatchReason({
            skillResult,
            keywordScore,
            locationScore,
            typeScore,
            modeScore,
          }),
        };
      })
      .filter((job) => job.matchScore > 0)
      .sort(
        (a, b) =>
          b.matchScore - a.matchScore
      );

    /*
    ========================================================
    RESPONSE
    ========================================================
    */

    return res.status(200).json({
      success: true,

      search: {
        keyword,
        location,
        experience,
        jobType,
        workMode,
      },

      candidate: {
        hasProfile: !!profile,
        hasResume: !!resume,
        skillsAnalyzed:
          candidateSkills.length,
      },

      totalJobs: rankedJobs.length,

      jobs: rankedJobs.slice(0, 30),
    });
  } catch (error) {
    console.error(
      "AI Job Search Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to perform AI job search.",
      error: error.message,
    });
  }
};

module.exports = {
  aiJobSearch,
};