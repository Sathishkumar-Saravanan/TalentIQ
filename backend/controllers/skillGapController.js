const mongoose = require("mongoose");

const User = require("../models/User");
const Job = require("../models/Job");

/*
============================================================
SKILL GAP ANALYSIS
GET /api/skill-gap-analysis
============================================================
*/

const getSkillGapAnalysis = async (req, res) => {
  try {
    /*
    ========================================================
    1. AUTHENTICATED USER
    ========================================================
    */

    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const userId = req.user._id;

    /*
    ========================================================
    2. GET USER
    ========================================================
    */

    const user = await User.findById(userId)
      .select("-password -resetPasswordToken -resetPasswordExpires")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    /*
    ========================================================
    3. GET PROFILE
    ========================================================

    Your TalentIQ project already uses a separate
    profiles collection.

    We intentionally use MongoDB's collection here so this
    module does not create another Profile model or interfere
    with your existing Profile implementation.
    */

    let profile = null;

    try {
      profile = await mongoose.connection
        .collection("profiles")
        .findOne({
          $or: [
            { user: new mongoose.Types.ObjectId(userId) },
            { userId: new mongoose.Types.ObjectId(userId) },
            { candidate: new mongoose.Types.ObjectId(userId) },
            { candidateId: new mongoose.Types.ObjectId(userId) },
          ],
        });
    } catch (profileError) {
      console.log(
        "PROFILE LOOKUP WARNING:",
        profileError.message
      );
    }

    /*
    ========================================================
    4. GET RESUME
    ========================================================

    Resume information is also checked so the analysis can
    use skills detected/stored with the candidate's resume.
    */

    let resume = null;

    try {
      resume = await mongoose.connection
        .collection("resumes")
        .findOne(
          {
            $or: [
              {
                user: new mongoose.Types.ObjectId(userId),
              },
              {
                userId: new mongoose.Types.ObjectId(userId),
              },
              {
                candidate: new mongoose.Types.ObjectId(userId),
              },
              {
                candidateId:
                  new mongoose.Types.ObjectId(userId),
              },
            ],
          },
          {
            sort: {
              createdAt: -1,
            },
          }
        );
    } catch (resumeError) {
      console.log(
        "RESUME LOOKUP WARNING:",
        resumeError.message
      );
    }

    /*
    ========================================================
    5. COLLECT SKILLS
    ========================================================
    */

    const collectedSkills = [];

    const addSkills = (value) => {
      if (!Array.isArray(value)) {
        return;
      }

      value.forEach((skill) => {
        if (typeof skill === "string") {
          const cleanedSkill = skill.trim();

          if (cleanedSkill) {
            collectedSkills.push(cleanedSkill);
          }
        }

        if (
          skill &&
          typeof skill === "object"
        ) {
          const skillName =
            skill.name ||
            skill.skill ||
            skill.title ||
            skill.label;

          if (skillName) {
            collectedSkills.push(
              String(skillName).trim()
            );
          }
        }
      });
    };

    /*
    USER SKILLS
    */

    addSkills(user.skills);

    /*
    PROFILE SKILLS
    */

    if (profile) {
      addSkills(profile.skills);
      addSkills(profile.technicalSkills);
      addSkills(profile.skillsList);

      if (profile.profile) {
        addSkills(profile.profile.skills);
        addSkills(
          profile.profile.technicalSkills
        );
      }
    }

    /*
    RESUME SKILLS
    */

    if (resume) {
      addSkills(resume.skills);
      addSkills(resume.technicalSkills);
      addSkills(resume.extractedSkills);

      if (resume.analysis) {
        addSkills(resume.analysis.skills);
        addSkills(
          resume.analysis.technicalSkills
        );
      }

      if (resume.aiAnalysis) {
        addSkills(
          resume.aiAnalysis.skills
        );

        addSkills(
          resume.aiAnalysis.technicalSkills
        );
      }
    }

    /*
    REMOVE DUPLICATES
    */

    const uniqueSkills = [];

    const skillSet = new Set();

    collectedSkills.forEach((skill) => {
      const normalized = skill
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();

      if (
        normalized &&
        !skillSet.has(normalized)
      ) {
        skillSet.add(normalized);
        uniqueSkills.push(skill);
      }
    });

    /*
    ========================================================
    6. NORMALIZED CANDIDATE SKILLS
    ========================================================
    */

    const candidateSkillSet = new Set(
      uniqueSkills.map((skill) =>
        skill
          .toLowerCase()
          .replace(/\s+/g, " ")
          .trim()
      )
    );

    /*
    ========================================================
    7. TARGET ROLE
    ========================================================
    */

    const careerPreferences =
      user.careerPreferences || {};

    const profileCareerPreferences =
      profile?.careerPreferences || {};

    const targetRole =
      careerPreferences.targetRole ||
      profileCareerPreferences.targetRole ||
      profile?.targetRole ||
      user.targetRole ||
      "Software Developer";

    /*
    ========================================================
    8. ACTIVE JOBS
    ========================================================
    */

    const activeJobs = await Job.find({
      status: "Active",
    })
      .select(
        "_id title company location type mode skills experience"
      )
      .lean();

    /*
    ========================================================
    9. SKILL MARKET DEMAND
    ========================================================
    */

    const marketSkillMap = {};

    activeJobs.forEach((job) => {
      if (!Array.isArray(job.skills)) {
        return;
      }

      /*
      Prevent the same skill from being counted twice
      inside one job.
      */

      const jobSkillSet = new Set();

      job.skills.forEach((skill) => {
        const originalSkill =
          typeof skill === "string"
            ? skill.trim()
            : "";

        if (!originalSkill) {
          return;
        }

        const normalizedSkill =
          originalSkill
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();

        if (
          !normalizedSkill ||
          jobSkillSet.has(normalizedSkill)
        ) {
          return;
        }

        jobSkillSet.add(normalizedSkill);

        if (!marketSkillMap[normalizedSkill]) {
          marketSkillMap[normalizedSkill] = {
            skill: originalSkill,
            demand: 0,
            jobs: [],
          };
        }

        marketSkillMap[
          normalizedSkill
        ].demand++;

        if (
          marketSkillMap[
            normalizedSkill
          ].jobs.length < 5
        ) {
          marketSkillMap[
            normalizedSkill
          ].jobs.push({
            id: job._id,
            title: job.title,
            company: job.company,
          });
        }
      });
    });

    /*
    ========================================================
    10. SKILL GAPS
    ========================================================
    */

    const skillGaps = Object.values(
      marketSkillMap
    )
      .filter(
        (item) =>
          !candidateSkillSet.has(
            item.skill
              .toLowerCase()
              .replace(/\s+/g, " ")
              .trim()
          )
      )
      .sort(
        (a, b) =>
          b.demand - a.demand
      )
      .map((item) => {
        let priority = "Low";

        if (item.demand >= 8) {
          priority = "High";
        } else if (item.demand >= 4) {
          priority = "Medium";
        }

        return {
          skill: item.skill,
          demand: item.demand,
          priority,
          jobs: item.jobs,
        };
      });

    /*
    ========================================================
    11. MATCHING JOBS
    ========================================================
    */

    let matchingJobs = 0;

    const analyzedJobs = activeJobs.map(
      (job) => {
        const jobSkills = Array.isArray(
          job.skills
        )
          ? job.skills
          : [];

        const matchedSkills = [];
        const missingSkills = [];

        jobSkills.forEach(
          (skill) => {
            const normalizedSkill =
              String(skill)
                .toLowerCase()
                .replace(/\s+/g, " ")
                .trim();

            if (
              candidateSkillSet.has(
                normalizedSkill
              )
            ) {
              matchedSkills.push(skill);
            } else {
              missingSkills.push(skill);
            }
          }
        );

        if (matchedSkills.length > 0) {
          matchingJobs++;
        }

        return {
          id: job._id,
          title: job.title,
          company: job.company,
          matchedSkills,
          missingSkills,
          matchCount:
            matchedSkills.length,
          totalSkills:
            jobSkills.length,
        };
      }
    );

    /*
    ========================================================
    12. SKILL MATCH SCORE
    ========================================================
    */

    const skillMatchScore =
      activeJobs.length > 0
        ? Math.round(
            (matchingJobs /
              activeJobs.length) *
              100
          )
        : 0;

    /*
    ========================================================
    13. TOP SKILL GAPS
    ========================================================
    */

    const topSkillGaps =
      skillGaps.slice(0, 10);

    /*
    ========================================================
    14. LEARNING RECOMMENDATIONS
    ========================================================
    */

    const learningRecommendations =
      topSkillGaps
        .slice(0, 5)
        .map((item) => ({
          skill: item.skill,

          priority: item.priority,

          demand: item.demand,

          reason:
            `${item.skill} is currently requested in ${item.demand} active TalentIQ ${
              item.demand === 1
                ? "job"
                : "jobs"
            }. Learning this skill can improve your opportunities for ${targetRole} and related roles.`,
        }));

    /*
    ========================================================
    15. PROFILE / RESUME STATUS
    ========================================================
    */

    const profileAvailable =
      Boolean(profile);

    const resumeAvailable =
      Boolean(resume);

    /*
    ========================================================
    16. SUMMARY
    ========================================================
    */

    let summary =
      "TalentIQ compared your current skills with skills requested by active jobs.";

    if (activeJobs.length === 0) {
      summary =
        "There are currently no active jobs available for skill gap analysis.";
    } else if (
      topSkillGaps.length === 0
    ) {
      summary =
        "Excellent! No major skill gaps were detected against the current active jobs.";
    } else {
      summary =
        `TalentIQ found ${topSkillGaps.length} skills that could strengthen your profile based on current job demand.`;
    }

    /*
    ========================================================
    17. RESPONSE
    ========================================================
    */

    return res.status(200).json({
      success: true,

      message:
        "Skill gap analysis generated successfully",

      data: {
        candidate: {
          id: user._id,

          name:
            user.fullName ||
            user.name ||
            user.username ||
            "Candidate",

          email:
            user.email || "",

          targetRole,

          skills: uniqueSkills,
        },

        source: {
          profileConnected:
            profileAvailable,

          resumeConnected:
            resumeAvailable,

          activeJobsAnalyzed:
            activeJobs.length,
        },

        overview: {
          totalActiveJobs:
            activeJobs.length,

          matchingJobs,

          skillMatchScore,

          totalSkillGaps:
            topSkillGaps.length,
        },

        summary,

        skillGaps:
          topSkillGaps,

        learningRecommendations,

        jobs: analyzedJobs.slice(
          0,
          20
        ),
      },
    });
  } catch (error) {
    console.error(
      "SKILL GAP ANALYSIS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to generate skill gap analysis",
      error: error.message,
    });
  }
};

module.exports = {
  getSkillGapAnalysis,
};