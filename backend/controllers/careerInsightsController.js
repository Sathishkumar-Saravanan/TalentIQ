const User = require("../models/User");
const Application = require("../models/Application");
const Job = require("../models/Job");

/*
============================================================
GET CAREER INSIGHTS
GET /api/career-insights
============================================================
*/

const getCareerInsights = async (req, res) => {
  try {
    /*
    ========================================================
    AUTHENTICATION
    ========================================================
    */

    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    /*
    ========================================================
    GET LOGGED-IN USER
    ========================================================
    */

    const user = await User.findById(req.user._id)
      .select("-password -resetPasswordToken -resetPasswordExpires");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    /*
    ========================================================
    USER PROFILE DATA
    ========================================================
    */

    const skills = Array.isArray(user.skills)
      ? user.skills
      : [];

    const education =
      user.education &&
      typeof user.education === "object"
        ? user.education
        : {};

    const experience =
      user.experience &&
      typeof user.experience === "object"
        ? user.experience
        : {};

    const careerPreferences =
      user.careerPreferences &&
      typeof user.careerPreferences === "object"
        ? user.careerPreferences
        : {};

    /*
    ========================================================
    USER NAME
    ========================================================
    */

    const userName =
      user.fullName ||
      user.name ||
      user.username ||
      "Candidate";

    /*
    ========================================================
    TARGET ROLE
    ========================================================
    */

    const targetRole =
      careerPreferences.targetRole ||
      user.targetRole ||
      user.headline ||
      "Software Developer";

    /*
    ========================================================
    RESUME DATA
    ========================================================
    */

    const resumeAvailable = Boolean(
      user.resume ||
      user.resumeFileId ||
      user.resumeOriginalName
    );

    /*
    ========================================================
    PROFILE COMPLETION
    ========================================================
    */

    const profileFields = [
      user.fullName || user.name,
      user.email,
      user.phone,
      user.location,
      user.headline,
      user.bio,

      education.degree,
      education.college,
      education.graduationYear,

      experience.jobTitle,
      experience.company,

      skills.length > 0,

      careerPreferences.targetRole,
      careerPreferences.preferredLocation,

      resumeAvailable,
    ];

    const completedFields =
      profileFields.filter(Boolean).length;

    const profileCompletion = Math.round(
      (completedFields / profileFields.length) * 100
    );

    /*
    ========================================================
    EXPERIENCE
    ========================================================
    */

    const yearsOfExperience = Number(
      experience.years || user.yearsOfExperience || 0
    );

    let careerLevel = "Entry Level";

    if (yearsOfExperience >= 8) {
      careerLevel = "Senior Level";
    } else if (yearsOfExperience >= 4) {
      careerLevel = "Mid Level";
    } else if (yearsOfExperience >= 1) {
      careerLevel = "Junior Level";
    }

    /*
    ========================================================
    SKILL STATUS
    ========================================================
    */

    const skillCount = skills.length;

    let skillStatus = "Needs Improvement";

    if (skillCount >= 10) {
      skillStatus = "Strong";
    } else if (skillCount >= 5) {
      skillStatus = "Good";
    }

    /*
    ========================================================
    RESUME STATUS
    ========================================================
    */

    const resumeStatus = resumeAvailable
      ? "Resume Available"
      : "Resume Missing";

    /*
    ========================================================
    CAREER READINESS SCORE
    ========================================================
    */

    let careerReadiness = profileCompletion;

    if (resumeAvailable) {
      careerReadiness += 5;
    }

    if (skillCount >= 5) {
      careerReadiness += 5;
    }

    if (careerReadiness > 100) {
      careerReadiness = 100;
    }

    /*
    ========================================================
    CAREER SCORE LABEL
    ========================================================
    */

    let careerScoreLabel = "Needs Improvement";

    if (careerReadiness >= 85) {
      careerScoreLabel = "Excellent";
    } else if (careerReadiness >= 70) {
      careerScoreLabel = "Career Ready";
    } else if (careerReadiness >= 50) {
      careerScoreLabel = "Good Progress";
    }

    /*
    ========================================================
    APPLICATION DATA
    ========================================================
    */

    let applications = {
      total: 0,
      pending: 0,
      shortlisted: 0,
      selected: 0,
    };

    try {
      const userApplications = await Application.find({
        candidate: user._id,
      }).lean();

      applications.total = userApplications.length;

      userApplications.forEach((application) => {
        const status = String(
          application.status || ""
        ).toLowerCase();

        if (
          status === "pending" ||
          status === "applied"
        ) {
          applications.pending++;
        }

        if (
          status === "shortlisted" ||
          status === "shortlist"
        ) {
          applications.shortlisted++;
        }

        if (
          status === "selected" ||
          status === "accepted"
        ) {
          applications.selected++;
        }
      });
    } catch (applicationError) {
      console.log(
        "Career Insights Application Analysis:",
        applicationError.message
      );
    }

    /*
    ========================================================
    JOB MARKET DATA
    ========================================================
    */

    let allJobs = [];

    try {
      allJobs = await Job.find({
        status: "Active",
      }).lean();
    } catch (jobError) {
      console.log(
        "Career Insights Job Analysis:",
        jobError.message
      );
    }

    /*
    ========================================================
    POPULAR ROLES
    ========================================================
    */

    const roleMap = {};

    allJobs.forEach((job) => {
      const title = String(job.title || "").trim();

      if (!title) {
        return;
      }

      roleMap[title] =
        (roleMap[title] || 0) + 1;
    });

    const popularRoles = Object.entries(roleMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([title, openings]) => ({
        title,
        openings,
      }));

    /*
    ========================================================
    SKILL GAP ANALYSIS
    ========================================================
    */

    const userSkillSet = new Set(
      skills.map((skill) =>
        String(skill).trim().toLowerCase()
      )
    );

    const skillDemand = {};

    allJobs.forEach((job) => {
      const jobSkills = Array.isArray(job.skills)
        ? job.skills
        : [];

      jobSkills.forEach((skill) => {
        const normalizedSkill = String(skill)
          .trim()
          .toLowerCase();

        if (!normalizedSkill) {
          return;
        }

        if (!userSkillSet.has(normalizedSkill)) {
          if (!skillDemand[normalizedSkill]) {
            skillDemand[normalizedSkill] = {
              skill: skill,
              demand: 0,
            };
          }

          skillDemand[normalizedSkill].demand++;
        }
      });
    });

    const skillGaps = Object.values(skillDemand)
      .sort((a, b) => b.demand - a.demand)
      .slice(0, 6);

    /*
    ========================================================
    LEARNING RECOMMENDATIONS
    ========================================================
    */

    const learningRecommendations = skillGaps
      .slice(0, 5)
      .map((item) => ({
        skill: item.skill,
        reason:
          `This skill appears in ${item.demand} active job ${
            item.demand > 1 ? "postings" : "posting"
          } and could improve your job matching opportunities.`,
      }));

    /*
    ========================================================
    DEFAULT LEARNING RECOMMENDATIONS
    ========================================================
    */

    if (learningRecommendations.length === 0) {
      if (!userSkillSet.has("javascript")) {
        learningRecommendations.push({
          skill: "JavaScript",
          reason:
            "JavaScript is a core skill for modern web development roles.",
        });
      }

      if (!userSkillSet.has("react")) {
        learningRecommendations.push({
          skill: "React",
          reason:
            "React can strengthen your frontend development opportunities.",
        });
      }

      if (!userSkillSet.has("node.js")) {
        learningRecommendations.push({
          skill: "Node.js",
          reason:
            "Node.js can strengthen your backend and full-stack development profile.",
        });
      }
    }

    /*
    ========================================================
    RECOMMENDATION
    ========================================================
    */

    let recommendation = {
      title: "Keep improving your profile",
      description:
        "Continue improving your skills, resume and career profile to increase your job opportunities.",
      direction: targetRole,
    };

    if (!resumeAvailable) {
      recommendation = {
        title: "Complete your resume",
        description:
          "Upload your latest resume so TalentIQ can provide stronger career analysis and job matching.",
        direction: targetRole,
      };
    } else if (skillCount < 5) {
      recommendation = {
        title: "Strengthen your technical skills",
        description:
          "Add more relevant technical skills to improve your career readiness and job matching.",
        direction: targetRole,
      };
    } else if (careerReadiness >= 85) {
      recommendation = {
        title: "You are ready to explore opportunities",
        description:
          "Your profile has a strong foundation. Focus on applying to relevant roles and continuing your learning.",
        direction: targetRole,
      };
    } else {
      recommendation = {
        title: "Build toward your target role",
        description:
          `Continue improving the skills and experience required for ${targetRole}.`,
        direction: targetRole,
      };
    }

    /*
    ========================================================
    INSIGHT CARDS
    ========================================================
    */

    const insights = [
      {
        title: "Profile Completion",
        value: `${profileCompletion}%`,
        description:
          "How complete your TalentIQ career profile is.",
      },
      {
        title: "Technical Skills",
        value: skillCount,
        description:
          "Technical skills currently available in your profile.",
      },
      {
        title: "Target Role",
        value: targetRole,
        description:
          "The career direction currently selected in your profile.",
      },
      {
        title: "Applications",
        value: applications.total,
        description:
          "Total job applications submitted through TalentIQ.",
      },
    ];

    /*
    ========================================================
    ADDITIONAL RECOMMENDATIONS
    ========================================================
    */

    const recommendations = [];

    if (!resumeAvailable) {
      recommendations.push({
        type: "resume",
        title: "Upload your resume",
        description:
          "Upload your latest resume so TalentIQ can provide better career analysis and job matching.",
        priority: "high",
      });
    }

    if (skillCount < 5) {
      recommendations.push({
        type: "skills",
        title: "Add more skills",
        description:
          "Add relevant technical and professional skills to improve your job matching accuracy.",
        priority: "high",
      });
    }

    if (!experience.jobTitle) {
      recommendations.push({
        type: "experience",
        title: "Add your experience",
        description:
          "Add your current or previous job title and experience details.",
        priority: "medium",
      });
    }

    if (!education.degree) {
      recommendations.push({
        type: "education",
        title: "Complete your education",
        description:
          "Add your degree and education information to strengthen your career profile.",
        priority: "medium",
      });
    }

    if (!careerPreferences.targetRole) {
      recommendations.push({
        type: "career",
        title: "Set your target role",
        description:
          "Choose the role you want to pursue so TalentIQ can personalize your career recommendations.",
        priority: "high",
      });
    }

    if (profileCompletion >= 85 && resumeAvailable) {
      recommendations.push({
        type: "success",
        title: "Your profile is career ready",
        description:
          "Your profile contains strong information for personalized job recommendations.",
        priority: "low",
      });
    }

    /*
    ========================================================
    FINAL DATA OBJECT
    ========================================================
    */

    const data = {
      candidate: {
        id: user._id,
        name: userName,
        email: user.email || "",
        targetRole,
        preferredLocation:
          careerPreferences.preferredLocation ||
          user.preferredLocation ||
          "",
        skills,
        careerLevel,
        yearsOfExperience,
      },

      careerScore: {
        score: careerReadiness,
        label: careerScoreLabel,
      },

      recommendation,

      applications,

      skillGaps,

      learningRecommendations,

      popularRoles,

      insights,

      profile: {
        completion: profileCompletion,
        headline: user.headline || "",
        bio: user.bio || "",
        location: user.location || "",
        phone: user.phone || "",
      },

      education: {
        degree: education.degree || "",
        college: education.college || "",
        graduationYear:
          education.graduationYear || "",
        percentage:
          education.percentage || "",
      },

      experience: {
        jobTitle: experience.jobTitle || "",
        company: experience.company || "",
        years: yearsOfExperience,
      },

      careerPreferences: {
        targetRole,
        preferredLocation:
          careerPreferences.preferredLocation || "",
        employmentType:
          careerPreferences.employmentType || "",
        expectedSalary:
          careerPreferences.expectedSalary || "",
        remotePreference:
          careerPreferences.remotePreference || "",
      },

      resume: {
        available: resumeAvailable,
        fileId: user.resumeFileId || null,
        originalName:
          user.resumeOriginalName || "",
        mimeType:
          user.resumeMimeType || "",
        uploadedAt:
          user.resumeUploadedAt || null,
      },

      recommendations,
    };

    /*
    ========================================================
    RESPONSE
    ========================================================
    */

    return res.status(200).json({
      success: true,
      message:
        "Career insights generated successfully",
      data,
    });
  } catch (error) {
    console.error(
      "CAREER INSIGHTS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to generate career insights",
      error: error.message,
    });
  }
};

module.exports = {
  getCareerInsights,
};