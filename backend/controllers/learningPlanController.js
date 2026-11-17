const mongoose = require("mongoose");

const LearningPlan = require("../models/LearningPlan");

// ============================================================
// GET CURRENT USER ID
// ============================================================

const getUserId = (req) => {
  return (
    req.user?.id ||
    req.user?._id ||
    req.user?.userId
  );
};

// ============================================================
// CHECK VALID MONGODB OBJECT ID
// ============================================================

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// ============================================================
// DEFAULT LEARNING STEPS
// ============================================================

const getDefaultSteps = () => {
  return [
    {
      title: "Strengthen JavaScript Fundamentals",

      description:
        "Improve your JavaScript fundamentals including ES6+, asynchronous programming and modern JavaScript patterns.",

      duration: "2 weeks",

      skills: [
        "JavaScript",
        "ES6+",
        "Async Programming",
      ],

      completed: false,
    },

    {
      title: "Master React Development",

      description:
        "Build production-ready React applications using components, hooks, routing and state management.",

      duration: "3 weeks",

      skills: [
        "React",
        "Hooks",
        "React Router",
      ],

      completed: false,
    },

    {
      title: "Improve Node.js & Express",

      description:
        "Develop scalable REST APIs using Node.js, Express and authentication.",

      duration: "3 weeks",

      skills: [
        "Node.js",
        "Express",
        "REST API",
        "JWT",
      ],

      completed: false,
    },

    {
      title: "Master MongoDB",

      description:
        "Learn MongoDB schema design, queries, indexing and data modeling.",

      duration: "2 weeks",

      skills: [
        "MongoDB",
        "Mongoose",
        "Database Design",
      ],

      completed: false,
    },

    {
      title: "Learn Cloud & Deployment",

      description:
        "Learn how to deploy MERN applications using Docker and cloud platforms.",

      duration: "3 weeks",

      skills: [
        "Docker",
        "AWS",
        "Deployment",
      ],

      completed: false,
    },

    {
      title: "System Design & Interview Preparation",

      description:
        "Improve system design, problem solving and software engineering interview skills.",

      duration: "3 weeks",

      skills: [
        "System Design",
        "DSA",
        "Interview Preparation",
      ],

      completed: false,
    },
  ];
};

// ============================================================
// DEFAULT RECOMMENDED SKILLS
// ============================================================

const getDefaultRecommendedSkills = () => {
  return [
    {
      name: "TypeScript",

      priority: "HIGH",

      description:
        "Improve your JavaScript development with strong typing.",
    },

    {
      name: "AWS",

      priority: "MEDIUM",

      description:
        "Learn cloud deployment and infrastructure fundamentals.",
    },

    {
      name: "Docker",

      priority: "MEDIUM",

      description:
        "Learn containerization and modern application deployment.",
    },
  ];
};

// ============================================================
// GET MY LEARNING PLAN
// ============================================================
//
// GET /api/learning-plan
//
// ============================================================

const getLearningPlan = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    const learningPlan =
      await LearningPlan.findOne({
        candidate: userId,
      })
        .populate(
          "targetJob",
          "title jobTitle role company companyName location"
        )
        .populate(
          "basedOnResume",
          "_id"
        );

    if (!learningPlan) {
      return res.status(200).json({
        success: true,
        learningPlan: null,
        message: "No learning plan created yet",
      });
    }

    return res.status(200).json({
      success: true,
      learningPlan,
    });

  } catch (error) {
    console.error(
      "GET LEARNING PLAN ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch learning plan",
      error: error.message,
    });
  }
};

// ============================================================
// GET LEARNING PLAN FOR SELECTED JOB
// ============================================================
//
// GET /api/learning-plan/:jobId
//
// ============================================================

const getLearningPlanByJob = async (
  req,
  res
) => {
  try {
    const userId = getUserId(req);

    const { jobId } = req.params;

    // ========================================================
    // AUTHENTICATION
    // ========================================================

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "User authentication required",
      });
    }

    // ========================================================
    // VALIDATE JOB ID
    // ========================================================

    if (
      !jobId ||
      jobId === "undefined" ||
      jobId === "null" ||
      jobId === "recommendations" ||
      !isValidObjectId(jobId)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "A valid job ID is required for the learning path.",
      });
    }

    // ========================================================
    // FIND CURRENT USER PLAN
    // ========================================================

    let learningPlan =
      await LearningPlan.findOne({
        candidate: userId,
      });

    // ========================================================
    // IF PLAN DOES NOT EXIST
    // ========================================================

    if (!learningPlan) {

      learningPlan =
        await LearningPlan.create({

          candidate: userId,

          targetJob: jobId,

          targetRole:
            "Full Stack Developer",

          currentSkills: [],

          recommendedSkills:
            getDefaultRecommendedSkills(),

          steps:
            getDefaultSteps(),

          currentSkillScore: 0,

          potentialScore: 100,

          progress: 0,
        });

    } else {

      // ======================================================
      // UPDATE TARGET JOB
      // ======================================================
      //
      // The user selected a new AI recommendation.
      //
      // Keep the existing learning plan but associate it
      // with the selected job.
      //
      // ======================================================

      learningPlan.targetJob =
        jobId;

      // If there are no steps, create them.
      if (
        !Array.isArray(
          learningPlan.steps
        ) ||
        learningPlan.steps.length === 0
      ) {
        learningPlan.steps =
          getDefaultSteps();
      }

      if (
        !Array.isArray(
          learningPlan.recommendedSkills
        ) ||
        learningPlan
          .recommendedSkills
          .length === 0
      ) {
        learningPlan.recommendedSkills =
          getDefaultRecommendedSkills();
      }

      await learningPlan.save();
    }

    // ========================================================
    // POPULATE JOB
    // ========================================================

    await learningPlan.populate(
      "targetJob",
      "title jobTitle role company companyName location"
    );

    await learningPlan.populate(
      "basedOnResume",
      "_id"
    );

    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(200).json({
      success: true,

      learningPlan,

      jobId: String(jobId),

      message:
        "Learning path loaded successfully",
    });

  } catch (error) {

    console.error(
      "GET LEARNING PLAN BY JOB ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to load learning path",

      error:
        error.message,
    });
  }
};

// ============================================================
// CREATE / UPDATE LEARNING PLAN
// ============================================================
//
// POST /api/learning-plan
//
// ============================================================

const createLearningPlan = async (
  req,
  res
) => {
  try {

    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "User authentication required",
      });
    }

    const {
      targetJob,
      targetRole,
      currentSkills,
      recommendedSkills,
      steps,
      basedOnResume,
      currentSkillScore,
      potentialScore,
    } = req.body;

    // ========================================================
    // VALIDATE TARGET JOB IF PROVIDED
    // ========================================================

    if (
      targetJob &&
      !isValidObjectId(targetJob)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid target job ID",
      });
    }

    // ========================================================
    // FIND EXISTING PLAN
    // ========================================================

    let learningPlan =
      await LearningPlan.findOne({
        candidate: userId,
      });

    // ========================================================
    // PLAN DATA
    // ========================================================

    const planData = {

      ...(targetJob
        ? {
            targetJob,
          }
        : {}),

      targetRole:
        targetRole ||
        "Full Stack Developer",

      currentSkills:
        Array.isArray(currentSkills)
          ? currentSkills
          : [],

      recommendedSkills:
        Array.isArray(
          recommendedSkills
        )
          ? recommendedSkills
          : [],

      steps:
        Array.isArray(steps)
          ? steps
          : [],

      basedOnResume:
        basedOnResume || null,

      currentSkillScore:
        Number(currentSkillScore) || 0,

      potentialScore:
        Number(potentialScore) || 0,
    };

    // ========================================================
    // UPDATE EXISTING
    // ========================================================

    if (learningPlan) {

      learningPlan.set(
        planData
      );

      await learningPlan.save();

      await learningPlan.populate(
        "targetJob",
        "title jobTitle role company companyName location"
      );

      return res.status(200).json({
        success: true,

        message:
          "Learning plan updated successfully",

        learningPlan,
      });
    }

    // ========================================================
    // CREATE NEW
    // ========================================================

    learningPlan =
      new LearningPlan({
        candidate: userId,
        ...planData,
      });

    await learningPlan.save();

    await learningPlan.populate(
      "targetJob",
      "title jobTitle role company companyName location"
    );

    return res.status(201).json({
      success: true,

      message:
        "Learning plan created successfully",

      learningPlan,
    });

  } catch (error) {

    console.error(
      "CREATE LEARNING PLAN ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to create learning plan",

      error:
        error.message,
    });
  }
};

// ============================================================
// UPDATE LEARNING STEP
// ============================================================
//
// PUT /api/learning-plan/step/:stepId
//
// ============================================================

const updateLearningStep = async (
  req,
  res
) => {
  try {

    const userId =
      getUserId(req);

    const {
      stepId,
    } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "User authentication required",
      });
    }

    const learningPlan =
      await LearningPlan.findOne({
        candidate: userId,
      });

    if (!learningPlan) {
      return res.status(404).json({
        success: false,
        message:
          "Learning plan not found",
      });
    }

    const step =
      learningPlan.steps.id(
        stepId
      );

    if (!step) {
      return res.status(404).json({
        success: false,
        message:
          "Learning step not found",
      });
    }

    step.completed =
      Boolean(
        req.body.completed
      );

    // ========================================================
    // CALCULATE PROGRESS
    // ========================================================

    const totalSteps =
      learningPlan.steps.length;

    const completedSteps =
      learningPlan.steps.filter(
        (item) =>
          item.completed
      ).length;

    learningPlan.progress =
      totalSteps > 0
        ? Math.round(
            (completedSteps /
              totalSteps) *
              100
          )
        : 0;

    await learningPlan.save();

    return res.status(200).json({
      success: true,

      message:
        "Learning step updated successfully",

      learningPlan,
    });

  } catch (error) {

    console.error(
      "UPDATE LEARNING STEP ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to update learning step",

      error:
        error.message,
    });
  }
};

// ============================================================
// DELETE LEARNING PLAN
// ============================================================
//
// DELETE /api/learning-plan
//
// ============================================================

const deleteLearningPlan = async (
  req,
  res
) => {
  try {

    const userId =
      getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "User authentication required",
      });
    }

    await LearningPlan.findOneAndDelete({
      candidate: userId,
    });

    return res.status(200).json({
      success: true,

      message:
        "Learning plan deleted successfully",
    });

  } catch (error) {

    console.error(
      "DELETE LEARNING PLAN ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to delete learning plan",

      error:
        error.message,
    });
  }
};

// ============================================================
// EXPORT
// ============================================================

module.exports = {

  getLearningPlan,

  getLearningPlanByJob,

  createLearningPlan,

  updateLearningStep,

  deleteLearningPlan,

};