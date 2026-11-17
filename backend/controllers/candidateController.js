const CandidateProfile = require("../models/CandidateProfile");

// Create Candidate Profile
const createProfile = async (req, res) => {
  try {
    const existingProfile = await CandidateProfile.findOne({
      user: req.user._id,
    });

    if (existingProfile) {
      return res.status(400).json({
        success: false,
        message: "Candidate profile already exists",
      });
    }

    const profile = await CandidateProfile.create({
      user: req.user._id,
      ...req.body,
    });

    res.status(201).json({
      success: true,
      message: "Candidate profile created successfully",
      profile,
    });
  } catch (error) {
    console.error("Create profile error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while creating profile",
    });
  }
};


// Get Candidate Profile
const getProfile = async (req, res) => {
  try {
    const profile = await CandidateProfile.findOne({
      user: req.user._id,
    }).populate("user", "name email role");

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Candidate profile not found",
      });
    }

    res.status(200).json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error("Get profile error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while getting profile",
    });
  }
};


// Update Candidate Profile
const updateProfile = async (req, res) => {
  try {
    const profile = await CandidateProfile.findOne({
      user: req.user._id,
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Candidate profile not found",
      });
    }

    Object.assign(profile, req.body);

    await profile.save();

    res.status(200).json({
      success: true,
      message: "Candidate profile updated successfully",
      profile,
    });
  } catch (error) {
    console.error("Update profile error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while updating profile",
    });
  }
};


// Delete Candidate Profile
const deleteProfile = async (req, res) => {
  try {
    const profile = await CandidateProfile.findOneAndDelete({
      user: req.user._id,
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Candidate profile not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Candidate profile deleted successfully",
    });
  } catch (error) {
    console.error("Delete profile error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while deleting profile",
    });
  }
};


module.exports = {
  createProfile,
  getProfile,
  updateProfile,
  deleteProfile,
};