const mongoose = require("mongoose");
const Profile = require("../models/Profile");
const { getGridFSBucket } = require("../config/db");

// =====================================================
// GET PROFILE
// GET /api/profile
// =====================================================

const getProfile = async (req, res) => {
  try {
    const userId =
      req.user?.id ||
      req.user?._id ||
      req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    const profile = await Profile.findOne({
      user: userId,
    }).populate("user", "name email");

    if (!profile) {
      return res.status(200).json({
        success: true,
        profile: null,
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
      message: "Unable to load profile",
    });
  }
};

// =====================================================
// CREATE / UPDATE PROFILE
// PUT /api/profile
// =====================================================

const updateProfile = async (req, res) => {
  try {
    const userId =
      req.user?.id ||
      req.user?._id ||
      req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    const {
      fullName,
      email,
      phone,
      location,
      headline,
      bio,
      dateOfBirth,
      gender,
      portfolio,
      linkedin,
      github,
      education,
      experience,
      skills,
      careerPreferences,
    } = req.body;

    const profile = await Profile.findOneAndUpdate(
      {
        user: userId,
      },
      {
        $set: {
          fullName: fullName || "",
          email: email || "",
          phone: phone || "",
          location: location || "",
          headline: headline || "",
          bio: bio || "",
          dateOfBirth: dateOfBirth || null,
          gender: gender || "",
          portfolio: portfolio || "",
          linkedin: linkedin || "",
          github: github || "",

          education: {
            degree: education?.degree || "",
            college: education?.college || "",
            graduationYear:
              education?.graduationYear || "",
            percentage:
              education?.percentage || "",
          },

          experience: {
            jobTitle:
              experience?.jobTitle || "",
            company:
              experience?.company || "",
            experienceLevel:
              experience?.experienceLevel || "",
            years:
              experience?.years || "",
          },

          skills: Array.isArray(skills)
            ? skills
            : [],

          careerPreferences: {
            targetRole:
              careerPreferences?.targetRole || "",

            preferredLocation:
              careerPreferences?.preferredLocation || "",

            employmentType:
              careerPreferences?.employmentType ||
              "Full Time",

            expectedSalary:
              careerPreferences?.expectedSalary || "",

            remotePreference:
              careerPreferences?.remotePreference || "",
          },
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      profile,
    });
  } catch (error) {
    console.error(
      "Update profile error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Unable to update profile",
      error: error.message,
    });
  }
};

// =====================================================
// UPLOAD RESUME
// POST /api/profile/resume
// =====================================================

const uploadResume = async (req, res) => {
  try {
    const userId =
      req.user?.id ||
      req.user?._id ||
      req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select a resume file",
      });
    }

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message:
          "Only PDF, DOC and DOCX files are supported",
      });
    }

    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message:
          "Resume size must be less than 5 MB",
      });
    }

    const bucket = getGridFSBucket();

    let profile = await Profile.findOne({
      user: userId,
    });

    if (!profile) {
      profile = new Profile({
        user: userId,
      });
    }

    // Delete previous resume
    if (profile.resumeFileId) {
      try {
        await bucket.delete(
          new mongoose.Types.ObjectId(
            profile.resumeFileId
          )
        );

        console.log(
          "Previous resume deleted from GridFS"
        );
      } catch (deleteError) {
        console.log(
          "Previous resume not found in GridFS, continuing..."
        );
      }
    }

    // Upload new resume
    const uploadStream =
      bucket.openUploadStream(
        req.file.originalname,
        {
          contentType: req.file.mimetype,

          metadata: {
            userId: userId.toString(),
            uploadedBy: "TalentIQ",
          },
        }
      );

    uploadStream.end(req.file.buffer);

    uploadStream.on(
      "error",
      (error) => {
        console.error(
          "GridFS upload error:",
          error
        );

        if (!res.headersSent) {
          return res.status(500).json({
            success: false,
            message:
              "Unable to upload resume",
          });
        }
      }
    );

    uploadStream.on(
      "finish",
      async () => {
        try {
          profile.resume =
            req.file.originalname;

          profile.resumeFileId =
            uploadStream.id;

          profile.resumeOriginalName =
            req.file.originalname;

          profile.resumeMimeType =
            req.file.mimetype;

          profile.resumeUploadedAt =
            new Date();

          await profile.save();

          res.status(200).json({
            success: true,
            message:
              "Resume uploaded successfully",

            resume: {
              fileId: uploadStream.id,
              originalName:
                req.file.originalname,
              mimeType:
                req.file.mimetype,
              size: req.file.size,
              uploadedAt:
                profile.resumeUploadedAt,
            },

            profile,
          });
        } catch (error) {
          console.error(
            "Saving resume information error:",
            error
          );

          res.status(500).json({
            success: false,
            message:
              "Resume uploaded but profile could not be updated",
          });
        }
      }
    );
  } catch (error) {
    console.error(
      "Resume upload error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to upload resume",
      error: error.message,
    });
  }
};

// =====================================================
// DOWNLOAD RESUME
// GET /api/profile/resume/:fileId
// =====================================================

const downloadResume = async (req, res) => {
  try {
    const { fileId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        fileId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid resume file ID",
      });
    }

    const bucket = getGridFSBucket();

    const files = await bucket
      .find({
        _id: new mongoose.Types.ObjectId(
          fileId
        ),
      })
      .toArray();

    if (
      !files ||
      files.length === 0
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Resume not found",
      });
    }

    const file = files[0];

    res.set(
      "Content-Type",
      file.contentType ||
        "application/octet-stream"
    );

    res.set(
      "Content-Disposition",
      `inline; filename="${file.filename}"`
    );

    const downloadStream =
      bucket.openDownloadStream(
        file._id
      );

    downloadStream.on(
      "error",
      (error) => {
        console.error(
          "Resume download error:",
          error
        );

        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message:
              "Unable to download resume",
          });
        }
      }
    );

    downloadStream.pipe(res);
  } catch (error) {
    console.error(
      "Download resume error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to download resume",
    });
  }
};

// =====================================================
// DELETE RESUME
// DELETE /api/profile/resume
// =====================================================

const deleteResume = async (req, res) => {
  try {
    const userId =
      req.user?.id ||
      req.user?._id ||
      req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "User authentication required",
      });
    }

    const profile =
      await Profile.findOne({
        user: userId,
      });

    if (
      !profile ||
      !profile.resumeFileId
    ) {
      return res.status(404).json({
        success: false,
        message:
          "No resume found",
      });
    }

    const bucket =
      getGridFSBucket();

    try {
      await bucket.delete(
        new mongoose.Types.ObjectId(
          profile.resumeFileId
        )
      );
    } catch (error) {
      console.log(
        "GridFS file already removed"
      );
    }

    profile.resume = "";
    profile.resumeFileId = null;
    profile.resumeOriginalName = "";
    profile.resumeMimeType = "";
    profile.resumeUploadedAt = null;

    await profile.save();

    res.status(200).json({
      success: true,
      message:
        "Resume deleted successfully",
      profile,
    });
  } catch (error) {
    console.error(
      "Delete resume error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to delete resume",
    });
  }
};

// =====================================================
// EXPORT CONTROLLERS
// =====================================================

module.exports = {
  getProfile,
  updateProfile,
  uploadResume,
  downloadResume,
  deleteResume,
};