const Application = require("../models/Application");
const Job = require("../models/Job");

// ============================================================
// SCHEDULE INTERVIEW
// ============================================================

const scheduleInterview = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const {
      role,
      company,
      location,
      date,
      startTime,
      endTime,
      meetLink,
    } = req.body;

    if (!applicationId) {
      return res.status(400).json({
        message: "Application ID is required.",
      });
    }

    if (
      !date ||
      !startTime ||
      !endTime ||
      !meetLink
    ) {
      return res.status(400).json({
        message:
          "Date, time and Google Meet link are required.",
      });
    }

    // --------------------------------------------------------
    // VALIDATE GOOGLE MEET LINK
    // --------------------------------------------------------

    let parsedMeetLink;

    try {
      parsedMeetLink = new URL(meetLink);
    } catch {
      return res.status(400).json({
        message: "Invalid Google Meet link.",
      });
    }

    if (
      !parsedMeetLink.hostname.includes(
        "meet.google.com"
      )
    ) {
      return res.status(400).json({
        message:
          "Please provide a valid Google Meet link.",
      });
    }

    // --------------------------------------------------------
    // FIND APPLICATION
    // --------------------------------------------------------

    const application =
      await Application.findById(
        applicationId
      ).populate("job");

    if (!application) {
      return res.status(404).json({
        message: "Application not found.",
      });
    }

    // --------------------------------------------------------
    // OPTIONAL: ENSURE RECRUITER OWNS THE JOB
    // --------------------------------------------------------

    if (
      req.user &&
      application.job &&
      application.job.recruiter
    ) {
      const recruiterId =
        String(application.job.recruiter);

      const currentUserId =
        String(req.user._id);

      if (
        recruiterId !==
        currentUserId
      ) {
        return res.status(403).json({
          message:
            "You are not authorized to schedule this interview.",
        });
      }
    }

    // --------------------------------------------------------
    // VALID TIME SLOTS
    // --------------------------------------------------------

    const allowedSlots = [
      {
        startTime: "09:00",
        endTime: "10:00",
      },
      {
        startTime: "10:00",
        endTime: "11:00",
      },
      {
        startTime: "11:00",
        endTime: "12:00",
      },
      {
        startTime: "13:00",
        endTime: "14:00",
      },
      {
        startTime: "14:00",
        endTime: "15:00",
      },
      {
        startTime: "15:00",
        endTime: "16:00",
      },
      {
        startTime: "16:00",
        endTime: "17:00",
      },
    ];

    const validSlot =
      allowedSlots.some(
        (slot) =>
          slot.startTime === startTime &&
          slot.endTime === endTime
      );

    if (!validSlot) {
      return res.status(400).json({
        message:
          "Invalid interview time. Interview slots are available hourly from 09:00 AM to 05:00 PM, excluding 12:00 PM to 01:00 PM.",
      });
    }

    // --------------------------------------------------------
    // DATE VALIDATION
    // --------------------------------------------------------

    const interviewDate =
      new Date(date);

    if (
      Number.isNaN(
        interviewDate.getTime()
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid interview date.",
      });
    }

    // --------------------------------------------------------
    // SAVE INTERVIEW
    // --------------------------------------------------------

    application.interview = {
      scheduled: true,

      role:
        role ||
        application.job?.title ||
        "",

      company:
        company ||
        application.job?.companyName ||
        application.job?.company ||
        "",

      location:
        location ||
        application.job?.location ||
        "",

      date: interviewDate,

      startTime,

      endTime,

      meetLink:
        parsedMeetLink.toString(),

      scheduledAt: new Date(),
    };

    application.status =
      "Interview";

    application.statusUpdatedAt =
      new Date();

    await application.save();

    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    return res.status(200).json({
      success: true,

      message:
        "Interview scheduled successfully.",

      interview:
        application.interview,

      application,
    });
  } catch (error) {
    console.error(
      "SCHEDULE INTERVIEW ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to schedule interview.",
      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined,
    });
  }
};

// ============================================================
// GET INTERVIEW
// ============================================================

const getInterview = async (req, res) => {
  try {
    const { applicationId } =
      req.params;

    const application =
      await Application.findById(
        applicationId
      ).populate("job");

    if (!application) {
      return res.status(404).json({
        message:
          "Application not found.",
      });
    }

    if (
      !application.interview ||
      !application.interview.scheduled
    ) {
      return res.status(404).json({
        message:
          "No interview has been scheduled.",
      });
    }

    return res.status(200).json({
      success: true,

      interview:
        application.interview,
    });
  } catch (error) {
    console.error(
      "GET INTERVIEW ERROR:",
      error
    );

    return res.status(500).json({
      message:
        "Unable to load interview details.",
    });
  }
};

module.exports = {
  scheduleInterview,
  getInterview,
};