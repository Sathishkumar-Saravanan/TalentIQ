const User = require("../models/User");
const Resume = require("../models/Resume");
const Job = require("../models/Job");
const Application = require("../models/Application");


// =====================================================
// 1. CANDIDATE DASHBOARD
// =====================================================

const getCandidateDashboard = async (req, res) => {
    try {

        const candidateId = req.user._id;

        // ---------------------------------------------
        // Candidate profile
        // ---------------------------------------------

        const candidate = await User.findById(candidateId)
            .select("-password");

        if (!candidate) {
            return res.status(404).json({
                success: false,
                message: "Candidate not found",
            });
        }


        // ---------------------------------------------
        // Candidate resume
        // ---------------------------------------------

        const resume = await Resume.findOne({
            candidate: candidateId,
        });


        // ---------------------------------------------
        // All applications
        // ---------------------------------------------

        const applications = await Application.find({
            candidate: candidateId,
        })
            .populate(
                "job",
                "title companyName location jobType"
            )
            .sort({
                createdAt: -1,
            });


        // ---------------------------------------------
        // Application statistics
        // ---------------------------------------------

        const totalApplications =
            applications.length;

        const applied =
            applications.filter(
                (application) =>
                    application.status === "Applied"
            ).length;

        const underReview =
            applications.filter(
                (application) =>
                    application.status === "Under Review"
            ).length;

        const shortlisted =
            applications.filter(
                (application) =>
                    application.status === "Shortlisted"
            ).length;

        const interviews =
            applications.filter(
                (application) =>
                    application.status === "Interview"
            ).length;

        const selected =
            applications.filter(
                (application) =>
                    application.status === "Selected"
            ).length;

        const rejected =
            applications.filter(
                (application) =>
                    application.status === "Rejected"
            ).length;


        // ---------------------------------------------
        // Resume score
        // ---------------------------------------------

        let resumeScore = null;

        if (resume) {

            // If your Resume model stores ATS score
            // use that value.

            resumeScore =
                resume.atsScore ||
                resume.resumeScore ||
                null;
        }


        // ---------------------------------------------
        // Recent applications
        // ---------------------------------------------

        const recentApplications =
            applications.slice(0, 5);


        // ---------------------------------------------
        // Response
        // ---------------------------------------------

        return res.status(200).json({

            success: true,

            dashboard: {

                candidate: {
                    id: candidate._id,
                    name: candidate.name,
                    email: candidate.email,
                    role: candidate.role,
                },

                resume: {
                    exists: !!resume,
                    score: resumeScore,
                },

                statistics: {

                    totalApplications,

                    applied,

                    underReview,

                    shortlisted,

                    interviews,

                    selected,

                    rejected,
                },

                recentApplications,
            },
        });

    } catch (error) {

        console.error(
            "Candidate Dashboard Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to load candidate dashboard",

            error:
                error.message,
        });
    }
};



// =====================================================
// 2. RECRUITER DASHBOARD
// =====================================================

const getRecruiterDashboard = async (req, res) => {
    try {

        const recruiterId = req.user._id;


        // ---------------------------------------------
        // Recruiter profile
        // ---------------------------------------------

        const recruiter = await User.findById(
            recruiterId
        ).select("-password");


        if (!recruiter) {

            return res.status(404).json({

                success: false,

                message:
                    "Recruiter not found",
            });
        }


        // ---------------------------------------------
        // Recruiter's jobs
        // ---------------------------------------------

        const jobs = await Job.find({
            recruiter: recruiterId,
        }).sort({
            createdAt: -1,
        });


        // ---------------------------------------------
        // Job statistics
        // ---------------------------------------------

        const totalJobs =
            jobs.length;

        const activeJobs =
            jobs.filter(
                (job) =>
                    job.status === "Active"
            ).length;

        const closedJobs =
            jobs.filter(
                (job) =>
                    job.status === "Closed"
            ).length;

        const draftJobs =
            jobs.filter(
                (job) =>
                    job.status === "Draft"
            ).length;


        // ---------------------------------------------
        // Find applications for recruiter's jobs
        // ---------------------------------------------

        const jobIds =
            jobs.map(
                (job) => job._id
            );


        const applications =
            await Application.find({
                job: {
                    $in: jobIds,
                },
            })
                .populate(
                    "candidate",
                    "name email"
                )
                .populate(
                    "job",
                    "title companyName"
                )
                .sort({
                    createdAt: -1,
                });


        // ---------------------------------------------
        // Application statistics
        // ---------------------------------------------

        const totalApplications =
            applications.length;

        const applied =
            applications.filter(
                (application) =>
                    application.status === "Applied"
            ).length;

        const underReview =
            applications.filter(
                (application) =>
                    application.status === "Under Review"
            ).length;

        const shortlisted =
            applications.filter(
                (application) =>
                    application.status === "Shortlisted"
            ).length;

        const interviews =
            applications.filter(
                (application) =>
                    application.status === "Interview"
            ).length;

        const selected =
            applications.filter(
                (application) =>
                    application.status === "Selected"
            ).length;

        const rejected =
            applications.filter(
                (application) =>
                    application.status === "Rejected"
            ).length;


        // ---------------------------------------------
        // Recent applications
        // ---------------------------------------------

        const recentApplications =
            applications.slice(0, 10);


        // ---------------------------------------------
        // Recent jobs
        // ---------------------------------------------

        const recentJobs =
            jobs.slice(0, 5);


        // ---------------------------------------------
        // Response
        // ---------------------------------------------

        return res.status(200).json({

            success: true,

            dashboard: {

                recruiter: {

                    id:
                        recruiter._id,

                    name:
                        recruiter.name,

                    email:
                        recruiter.email,

                    role:
                        recruiter.role,
                },


                jobStatistics: {

                    totalJobs,

                    activeJobs,

                    closedJobs,

                    draftJobs,
                },


                applicationStatistics: {

                    totalApplications,

                    applied,

                    underReview,

                    shortlisted,

                    interviews,

                    selected,

                    rejected,
                },


                recentJobs,

                recentApplications,
            },
        });

    } catch (error) {

        console.error(
            "Recruiter Dashboard Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to load recruiter dashboard",

            error:
                error.message,
        });
    }
};



module.exports = {
    getCandidateDashboard,
    getRecruiterDashboard,
};