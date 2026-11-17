const RecruiterProfile = require("../models/RecruiterProfile");

/*
|--------------------------------------------------------------------------
| CREATE RECRUITER PROFILE
|--------------------------------------------------------------------------
*/
const createProfile = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const existingProfile = await RecruiterProfile.findOne({
      user: userId,
    });

    if (existingProfile) {
      return res.status(400).json({
        success: false,
        message: "Recruiter profile already exists",
        profile: existingProfile,
      });
    }

    const {
      companyName,
      designation,
      phone,
      location,
      bio,
      website,
      linkedin,
    } = req.body;

    /*
    |--------------------------------------------------------------------------
    | REQUIRED FIELDS
    |--------------------------------------------------------------------------
    */

    if (!companyName || !companyName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Company name is required",
      });
    }

    if (!designation || !designation.trim()) {
      return res.status(400).json({
        success: false,
        message: "Designation is required",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | BIO VALIDATION
    |--------------------------------------------------------------------------
    */

    const cleanBio = bio
      ? String(bio).trim()
      : "";

    if (cleanBio.length > 3000) {
      return res.status(400).json({
        success: false,
        message: "Bio cannot exceed 3000 characters",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE
    |--------------------------------------------------------------------------
    */

    const profile = await RecruiterProfile.create({
      user: userId,

      companyName: companyName.trim(),

      designation: designation.trim(),

      phone: phone
        ? String(phone).trim()
        : "",

      location: location
        ? String(location).trim()
        : "",

      bio: cleanBio,

      website: website
        ? String(website).trim()
        : "",

      linkedin: linkedin
        ? String(linkedin).trim()
        : "",
    });

    /*
    |--------------------------------------------------------------------------
    | POPULATE USER
    |--------------------------------------------------------------------------
    */

    const populatedProfile =
      await RecruiterProfile.findById(
        profile._id
      ).populate(
        "user",
        "name fullName username email role"
      );

    return res.status(201).json({
      success: true,
      message:
        "Recruiter profile created successfully",
      profile: populatedProfile,
    });
  } catch (error) {
    console.error(
      "CREATE RECRUITER PROFILE ERROR:",
      error
    );

    /*
    |--------------------------------------------------------------------------
    | DUPLICATE PROFILE
    |--------------------------------------------------------------------------
    */

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          "Recruiter profile already exists",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | MONGOOSE VALIDATION ERROR
    |--------------------------------------------------------------------------
    */

    if (error.name === "ValidationError") {
      const messages = Object.values(
        error.errors
      )
        .map((item) => item.message)
        .join(", ");

      return res.status(400).json({
        success: false,
        message: messages || "Validation failed",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Server error while creating recruiter profile",
      error: error.message,
    });
  }
};


/*
|--------------------------------------------------------------------------
| GET RECRUITER PROFILE
|--------------------------------------------------------------------------
*/
const getProfile = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const profile =
      await RecruiterProfile.findOne({
        user: userId,
      }).populate(
        "user",
        "name fullName username email role"
      );

    /*
    |--------------------------------------------------------------------------
    | PROFILE DOES NOT EXIST
    |--------------------------------------------------------------------------
    */

    if (!profile) {
      return res.status(404).json({
        success: false,
        message:
          "Recruiter profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Recruiter profile loaded successfully",
      profile,
    });
  } catch (error) {
    console.error(
      "GET RECRUITER PROFILE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while getting recruiter profile",
      error: error.message,
    });
  }
};


/*
|--------------------------------------------------------------------------
| UPDATE RECRUITER PROFILE
|--------------------------------------------------------------------------
*/
const updateProfile = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const profile =
      await RecruiterProfile.findOne({
        user: userId,
      });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message:
          "Recruiter profile not found",
      });
    }

    const {
      companyName,
      designation,
      phone,
      location,
      bio,
      website,
      linkedin,
    } = req.body;

    /*
    |--------------------------------------------------------------------------
    | UPDATE FIELDS
    |--------------------------------------------------------------------------
    */

    if (companyName !== undefined) {
      const value =
        String(companyName).trim();

      if (!value) {
        return res.status(400).json({
          success: false,
          message:
            "Company name is required",
        });
      }

      profile.companyName = value;
    }

    if (designation !== undefined) {
      const value =
        String(designation).trim();

      if (!value) {
        return res.status(400).json({
          success: false,
          message:
            "Designation is required",
        });
      }

      profile.designation = value;
    }

    if (phone !== undefined) {
      profile.phone =
        String(phone).trim();
    }

    if (location !== undefined) {
      profile.location =
        String(location).trim();
    }

    if (bio !== undefined) {
      const cleanBio =
        String(bio).trim();

      if (cleanBio.length > 3000) {
        return res.status(400).json({
          success: false,
          message:
            "Bio cannot exceed 3000 characters",
        });
      }

      profile.bio = cleanBio;
    }

    if (website !== undefined) {
      profile.website =
        String(website).trim();
    }

    if (linkedin !== undefined) {
      profile.linkedin =
        String(linkedin).trim();
    }

    await profile.save();

    const updatedProfile =
      await RecruiterProfile.findById(
        profile._id
      ).populate(
        "user",
        "name fullName username email role"
      );

    return res.status(200).json({
      success: true,
      message:
        "Recruiter profile updated successfully",
      profile: updatedProfile,
    });
  } catch (error) {
    console.error(
      "UPDATE RECRUITER PROFILE ERROR:",
      error
    );

    if (error.name === "ValidationError") {
      const messages = Object.values(
        error.errors
      )
        .map((item) => item.message)
        .join(", ");

      return res.status(400).json({
        success: false,
        message:
          messages || "Validation failed",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Server error while updating recruiter profile",
      error: error.message,
    });
  }
};


/*
|--------------------------------------------------------------------------
| DELETE RECRUITER PROFILE
|--------------------------------------------------------------------------
*/
const deleteProfile = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const profile =
      await RecruiterProfile.findOneAndDelete({
        user: userId,
      });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message:
          "Recruiter profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Recruiter profile deleted successfully",
    });
  } catch (error) {
    console.error(
      "DELETE RECRUITER PROFILE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while deleting recruiter profile",
      error: error.message,
    });
  }
};


module.exports = {
  createProfile,
  getProfile,
  updateProfile,
  deleteProfile,
};