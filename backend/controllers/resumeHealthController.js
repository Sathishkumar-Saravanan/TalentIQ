const mongoose = require("mongoose");
const User = require("../models/User");

// ============================================================
// RESUME HEALTH CONTROLLER
// GET /api/resume-health
//
// REAL DATA:
//
// User
// profiles collection
// resumes collection
//
// No mock data.
// No demo data.
// No separate service.
// ============================================================

const normalizeArray = (value) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const firstValue = (...values) => {
  for (const value of values) {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      return value;
    }
  }

  return "";
};

// ============================================================
// GET RESUME HEALTH
// GET /api/resume-health
// ============================================================

const getResumeHealth = async (req, res) => {
  try {
    // ========================================================
    // AUTHENTICATION
    // ========================================================

    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const userId = req.user._id.toString();

    // ========================================================
    // USER
    // ========================================================

    const user = await User.findById(userId)
      .select(
        "-password -resetPasswordToken -resetPasswordExpires"
      )
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ========================================================
    // DATABASE
    // ========================================================

    const db = mongoose.connection.db;

    if (!db) {
      return res.status(500).json({
        success: false,
        message: "Database connection is not available",
      });
    }

    // ========================================================
    // PROFILE
    // ========================================================

    const profilesCollection =
      db.collection("profiles");

    const objectId =
      new mongoose.Types.ObjectId(userId);

    const profileQueries = [
      {
        user: objectId,
      },
      {
        userId: objectId,
      },
      {
        userId: userId,
      },
      {
        user: userId,
      },
      {
        email: user.email,
      },
    ];

    let profile = null;

    for (const query of profileQueries) {
      try {
        profile =
          await profilesCollection.findOne(query);

        if (profile) {
          break;
        }
      } catch (error) {
        // Continue
      }
    }

    // ========================================================
    // RESUME
    // ========================================================

    const resumesCollection =
      db.collection("resumes");

    const resumeQueries = [
      {
        user: objectId,
      },
      {
        userId: objectId,
      },
      {
        userId: userId,
      },
      {
        user: userId,
      },
      {
        candidate: objectId,
      },
      {
        candidateId: objectId,
      },
      {
        email: user.email,
      },
    ];

    let resume = null;

    for (const query of resumeQueries) {
      try {
        resume =
          await resumesCollection.findOne(
            query,
            {
              sort: {
                updatedAt: -1,
                createdAt: -1,
              },
            }
          );

        if (resume) {
          break;
        }
      } catch (error) {
        // Continue
      }
    }

    // ========================================================
    // PROFILE DATA
    // ========================================================

    const profileData =
      profile || {};

    const education =
      profileData.education ||
      user.education ||
      {};

    const experience =
      profileData.experience ||
      user.experience ||
      {};

    const careerPreferences =
      profileData.careerPreferences ||
      user.careerPreferences ||
      {};

    // ========================================================
    // BASIC INFORMATION
    // ========================================================

    const fullName = firstValue(
      profileData.fullName,
      user.fullName,
      user.name
    );

    const email = firstValue(
      profileData.email,
      user.email
    );

    const phone = firstValue(
      profileData.phone,
      user.phone
    );

    const location = firstValue(
      profileData.location,
      user.location
    );

    const headline = firstValue(
      profileData.headline,
      user.headline
    );

    const bio = firstValue(
      profileData.bio,
      user.bio
    );

    // ========================================================
    // SKILLS
    // ========================================================

    const skills = normalizeArray(
      firstValue(
        profileData.skills,
        user.skills,
        resume?.skills
      )
    );

    // ========================================================
    // EDUCATION
    // ========================================================

    const degree = firstValue(
      education.degree,
      education.course,
      education.qualification
    );

    const college = firstValue(
      education.college,
      education.institution,
      education.university
    );

    const graduationYear = firstValue(
      education.graduationYear,
      education.year,
      education.passingYear
    );

    // ========================================================
    // EXPERIENCE
    // ========================================================

    const jobTitle = firstValue(
      experience.jobTitle,
      experience.title,
      experience.role
    );

    const company = firstValue(
      experience.company,
      experience.companyName
    );

    const yearsOfExperience = Number(
      firstValue(
        experience.years,
        experience.yearsOfExperience,
        user.yearsOfExperience,
        0
      )
    );

    // ========================================================
    // CAREER PREFERENCES
    // ========================================================

    const targetRole = firstValue(
      careerPreferences.targetRole,
      user.targetRole
    );

    const preferredLocation =
      firstValue(
        careerPreferences.preferredLocation,
        user.preferredLocation
      );

    // ========================================================
    // RESUME INFORMATION
    // ========================================================

    const resumeFileId = firstValue(
      resume?.fileId,
      resume?.resumeFileId,
      resume?.file_id,
      user.resumeFileId
    );

    const resumeOriginalName =
      firstValue(
        resume?.originalName,
        resume?.resumeOriginalName,
        resume?.filename,
        resume?.fileName,
        user.resumeOriginalName
      );

    const resumeMimeType =
      firstValue(
        resume?.mimeType,
        resume?.resumeMimeType,
        resume?.mimetype,
        user.resumeMimeType
      );

    const resumeUploadedAt =
      firstValue(
        resume?.uploadedAt,
        resume?.createdAt,
        resume?.updatedAt,
        user.resumeUploadedAt
      );

    const resumeText = firstValue(
      resume?.text,
      resume?.content,
      resume?.resumeText,
      resume?.extractedText,
      resume?.parsedText,
      ""
    );

    // ========================================================
    // RESUME AVAILABLE
    // ========================================================

    const resumeAvailable = Boolean(
      resume ||
      resumeFileId ||
      resumeOriginalName ||
      user.resume ||
      user.resumeFileId ||
      user.resumeOriginalName
    );

    // ========================================================
    // PROFILE / RESUME SECTIONS
    // ========================================================

    const sections = [
      {
        key: "contact",
        title: "Contact Information",
        description:
          "Your name, email, phone and location.",
        completed:
          Boolean(fullName) &&
          Boolean(email) &&
          Boolean(phone),
        points: 15,
      },

      {
        key: "headline",
        title: "Professional Headline",
        description:
          "A clear headline describing your professional direction.",
        completed: Boolean(headline),
        points: 10,
      },

      {
        key: "summary",
        title: "Professional Summary",
        description:
          "A short summary explaining your background and career goals.",
        completed: Boolean(bio),
        points: 10,
      },

      {
        key: "skills",
        title: "Technical Skills",
        description:
          "Relevant technical skills for your target career.",
        completed: skills.length >= 3,
        points: 20,
      },

      {
        key: "education",
        title: "Education",
        description:
          "Your degree, institution and graduation information.",
        completed:
          Boolean(degree) &&
          Boolean(college),
        points: 15,
      },

      {
        key: "experience",
        title: "Experience",
        description:
          "Professional or project experience.",
        completed:
          Boolean(jobTitle) ||
          yearsOfExperience > 0,
        points: 15,
      },

      {
        key: "career",
        title: "Career Target",
        description:
          "Your target role and preferred career direction.",
        completed: Boolean(targetRole),
        points: 10,
      },

      {
        key: "resume",
        title: "Resume File",
        description:
          "A resume uploaded to your TalentIQ account.",
        completed: resumeAvailable,
        points: 5,
      },
    ];

    // ========================================================
    // COMPLETENESS SCORE
    // ========================================================

    const earnedPoints =
      sections
        .filter(
          (section) =>
            section.completed
        )
        .reduce(
          (total, section) =>
            total + section.points,
          0
        );

    const completenessScore =
      Math.min(
        100,
        earnedPoints
      );

    // ========================================================
    // SKILLS SCORE
    // ========================================================

    let skillsScore = 0;

    if (skills.length >= 10) {
      skillsScore = 100;
    } else if (skills.length >= 7) {
      skillsScore = 90;
    } else if (skills.length >= 5) {
      skillsScore = 75;
    } else if (skills.length >= 3) {
      skillsScore = 60;
    } else if (skills.length > 0) {
      skillsScore = 35;
    }

    // ========================================================
    // CONTENT SCORE
    // ========================================================

    let contentScore = 0;

    if (bio) contentScore += 25;
    if (headline) contentScore += 20;
    if (degree) contentScore += 15;
    if (jobTitle) contentScore += 15;
    if (company) contentScore += 10;
    if (targetRole) contentScore += 15;

    contentScore =
      Math.min(
        100,
        contentScore
      );

    // ========================================================
    // RESUME FILE SCORE
    // ========================================================

    let resumeFileScore = 0;

    if (resumeAvailable) {
      resumeFileScore += 60;
    }

    if (resumeOriginalName) {
      resumeFileScore += 20;
    }

    if (resumeMimeType) {
      resumeFileScore += 10;
    }

    if (resumeUploadedAt) {
      resumeFileScore += 10;
    }

    resumeFileScore =
      Math.min(
        100,
        resumeFileScore
      );

    // ========================================================
    // CAREER TARGET SCORE
    // ========================================================

    let targetRoleScore = 0;

    if (targetRole) {
      targetRoleScore += 70;
    }

    if (preferredLocation) {
      targetRoleScore += 30;
    }

    // ========================================================
    // FINAL SCORE
    // ========================================================

    const resumeHealthScore =
      Math.round(
        completenessScore * 0.35 +
        skillsScore * 0.25 +
        contentScore * 0.20 +
        resumeFileScore * 0.10 +
        targetRoleScore * 0.10
      );

    // ========================================================
    // HEALTH LABEL
    // ========================================================

    let healthLabel =
      "Needs Improvement";

    if (resumeHealthScore >= 85) {
      healthLabel = "Excellent";
    } else if (resumeHealthScore >= 70) {
      healthLabel = "Strong";
    } else if (resumeHealthScore >= 50) {
      healthLabel = "Good";
    }

    // ========================================================
    // IMPROVEMENTS
    // ========================================================

    const improvements = [];

    if (!resumeAvailable) {
      improvements.push({
        priority: "high",
        title: "Upload your resume",
        description:
          "Upload your latest resume so TalentIQ can analyze your resume health.",
      });
    }

    if (!phone) {
      improvements.push({
        priority: "high",
        title: "Add your phone number",
        description:
          "Add a valid phone number to complete your contact information.",
      });
    }

    if (!headline) {
      improvements.push({
        priority: "medium",
        title:
          "Add a professional headline",
        description:
          "Create a short headline describing your professional direction.",
      });
    }

    if (!bio) {
      improvements.push({
        priority: "medium",
        title:
          "Add a professional summary",
        description:
          "Write a concise summary describing your background and career goals.",
      });
    }

    if (skills.length < 5) {
      improvements.push({
        priority: "high",
        title:
          "Add more relevant skills",
        description:
          "Add at least five relevant technical or professional skills.",
      });
    }

    if (!degree || !college) {
      improvements.push({
        priority: "medium",
        title:
          "Complete your education",
        description:
          "Add your degree and institution information.",
      });
    }

    if (
      !jobTitle &&
      yearsOfExperience === 0
    ) {
      improvements.push({
        priority: "medium",
        title:
          "Add experience or projects",
        description:
          "Add your professional experience or relevant project experience.",
      });
    }

    if (!targetRole) {
      improvements.push({
        priority: "high",
        title:
          "Set your target role",
        description:
          "Set the role you are targeting so TalentIQ can personalize your career recommendations.",
      });
    }

    // ========================================================
    // SECTION RESULT
    // ========================================================

    const sectionResults =
      sections.map(
        (section) => ({
          key: section.key,
          title: section.title,
          description:
            section.description,
          completed:
            section.completed,
          status:
            section.completed
              ? "Complete"
              : "Needs Attention",
        })
      );

    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(200).json({
      success: true,

      message:
        "Resume health generated successfully",

      data: {
        score:
          resumeHealthScore,

        label:
          healthLabel,

        candidate: {
          id: user._id,
          name: fullName,
          email,
          targetRole,
          preferredLocation,
        },

        resume: {
          available:
            resumeAvailable,

          fileId:
            resumeFileId || null,

          originalName:
            resumeOriginalName || "",

          mimeType:
            resumeMimeType || "",

          uploadedAt:
            resumeUploadedAt || null,

          hasText:
            Boolean(resumeText),
        },

        profile: {
          completion:
            completenessScore,

          headline,

          bio,

          phone,

          location,

          degree,

          college,

          graduationYear,

          jobTitle,

          company,

          yearsOfExperience,

          targetRole,

          preferredLocation,
        },

        skills: {
          total:
            skills.length,

          list:
            skills,

          score:
            skillsScore,
        },

        scores: {
          overall:
            resumeHealthScore,

          completeness:
            completenessScore,

          skills:
            skillsScore,

          content:
            contentScore,

          resumeFile:
            resumeFileScore,

          careerTarget:
            targetRoleScore,
        },

        sections:
          sectionResults,

        improvements,

        summary: {
          totalSections:
            sections.length,

          completedSections:
            sections.filter(
              (section) =>
                section.completed
            ).length,

          incompleteSections:
            sections.filter(
              (section) =>
                !section.completed
            ).length,

          recommendation:
            resumeHealthScore >= 85
              ? "Your resume profile is in excellent shape. Keep your skills and experience updated."
              : resumeHealthScore >= 70
              ? "Your resume profile is strong. A few improvements can make it even better."
              : resumeHealthScore >= 50
              ? "Your resume profile has a good foundation but needs some improvements."
              : "Complete your profile and upload your resume to improve your Resume Health score.",
        },
      },
    });
  } catch (error) {
    console.error(
      "RESUME HEALTH ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to generate resume health",
      error: error.message,
    });
  }
};

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  getResumeHealth,
};