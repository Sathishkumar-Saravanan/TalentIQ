const JobAlert = require("../models/JobAlert");

/* =========================================================
   CREATE JOB ALERT
========================================================= */

const createJobAlert = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id || req.user.userId;

    const {
      keywords,
      location,
      jobType,
      skills,
      frequency,
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const normalizedSkills = Array.isArray(skills)
      ? skills
          .map((skill) => String(skill).trim())
          .filter(Boolean)
      : typeof skills === "string"
      ? skills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean)
      : [];

    const alert = await JobAlert.create({
      candidate: userId,
      keywords: keywords || "",
      location: location || "",
      jobType: jobType || "Any",
      skills: normalizedSkills,
      frequency: frequency || "Daily",
      isActive: true,
    });

    const populatedAlert = await JobAlert.findById(alert._id).populate(
      "candidate",
      "fullName email username"
    );

    return res.status(201).json({
      success: true,
      message: "Job alert created successfully",
      alert: populatedAlert,
    });
  } catch (error) {
    console.error("CREATE JOB ALERT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create job alert",
      error: error.message,
    });
  }
};

/* =========================================================
   GET MY JOB ALERTS
========================================================= */

const getMyJobAlerts = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id || req.user.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const alerts = await JobAlert.find({
      candidate: userId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      alerts,
    });
  } catch (error) {
    console.error("GET JOB ALERTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch job alerts",
      error: error.message,
    });
  }
};

/* =========================================================
   GET SINGLE ALERT
========================================================= */

const getJobAlert = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id || req.user.userId;

    const alert = await JobAlert.findOne({
      _id: req.params.id,
      candidate: userId,
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Job alert not found",
      });
    }

    return res.status(200).json({
      success: true,
      alert,
    });
  } catch (error) {
    console.error("GET JOB ALERT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch job alert",
      error: error.message,
    });
  }
};

/* =========================================================
   UPDATE JOB ALERT
========================================================= */

const updateJobAlert = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id || req.user.userId;

    const {
      keywords,
      location,
      jobType,
      skills,
      frequency,
      isActive,
    } = req.body;

    const updateData = {};

    if (keywords !== undefined) {
      updateData.keywords = keywords;
    }

    if (location !== undefined) {
      updateData.location = location;
    }

    if (jobType !== undefined) {
      updateData.jobType = jobType;
    }

    if (frequency !== undefined) {
      updateData.frequency = frequency;
    }

    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }

    if (skills !== undefined) {
      updateData.skills = Array.isArray(skills)
        ? skills.map((skill) => String(skill).trim()).filter(Boolean)
        : String(skills)
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean);
    }

    const alert = await JobAlert.findOneAndUpdate(
      {
        _id: req.params.id,
        candidate: userId,
      },
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Job alert not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Job alert updated successfully",
      alert,
    });
  } catch (error) {
    console.error("UPDATE JOB ALERT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update job alert",
      error: error.message,
    });
  }
};

/* =========================================================
   TOGGLE ALERT
========================================================= */

const toggleJobAlert = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id || req.user.userId;

    const alert = await JobAlert.findOne({
      _id: req.params.id,
      candidate: userId,
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Job alert not found",
      });
    }

    alert.isActive = !alert.isActive;

    await alert.save();

    return res.status(200).json({
      success: true,
      message: alert.isActive
        ? "Job alert enabled"
        : "Job alert disabled",
      alert,
    });
  } catch (error) {
    console.error("TOGGLE JOB ALERT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update alert status",
      error: error.message,
    });
  }
};

/* =========================================================
   DELETE JOB ALERT
========================================================= */

const deleteJobAlert = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id || req.user.userId;

    const alert = await JobAlert.findOneAndDelete({
      _id: req.params.id,
      candidate: userId,
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Job alert not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Job alert deleted successfully",
    });
  } catch (error) {
    console.error("DELETE JOB ALERT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete job alert",
      error: error.message,
    });
  }
};

module.exports = {
  createJobAlert,
  getMyJobAlerts,
  getJobAlert,
  updateJobAlert,
  toggleJobAlert,
  deleteJobAlert,
};