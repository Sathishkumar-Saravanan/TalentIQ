const mongoose = require("mongoose");

const Job = require("../models/Job");
const RecruiterProfile = require("../models/RecruiterProfile");

// ============================================================
// HELPER FUNCTIONS
// ============================================================

const cleanString = (value, fallback = "") => {
    if (value === undefined || value === null) {
        return fallback;
    }

    return String(value).trim();
};

// ============================================================
// CLEAN ARRAY
// ============================================================

const cleanArray = (value) => {
    if (Array.isArray(value)) {
        return value
            .map((item) => {
                if (item === undefined || item === null) {
                    return "";
                }

                return String(item).trim();
            })
            .filter(Boolean);
    }

    if (typeof value === "string") {
        return value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
    }

    return [];
};

// ============================================================
// GET COMPANY NAME
// ============================================================

const getCompanyName = (recruiterProfile, recruiter) => {
    return (
        recruiterProfile?.companyName ||
        recruiterProfile?.company ||
        recruiter?.companyName ||
        recruiter?.company ||
        "Company"
    );
};

// ============================================================
// VERIFY RECRUITER
// ============================================================

const verifyRecruiter = (req, res) => {
    const recruiterId = req.user?._id;

    if (!recruiterId) {
        res.status(401).json({
            success: false,
            message: "Authentication required",
        });

        return null;
    }

    if (
        req.user.role &&
        String(req.user.role).toLowerCase() !== "recruiter"
    ) {
        res.status(403).json({
            success: false,
            message: "Only recruiters can manage jobs",
        });

        return null;
    }

    return recruiterId;
};

// ============================================================
// VERIFY JOB OWNERSHIP
// ============================================================

const verifyJobOwnership = (job, recruiterId) => {
    if (!job || !job.recruiter) {
        return false;
    }

    return (
        job.recruiter.toString() ===
        recruiterId.toString()
    );
};

// ============================================================
// FORMAT JOB RESPONSE
// ============================================================

const formatJob = (job) => {
    if (!job) {
        return null;
    }

    const jobObject =
        typeof job.toObject === "function"
            ? job.toObject()
            : job;

    return {
        ...jobObject,

        company:
            jobObject.company ||
            "Company",

        companyName:
            jobObject.company ||
            jobObject.companyName ||
            "Company",

        type:
            jobObject.type ||
            jobObject.jobType ||
            "Full Time",

        jobType:
            jobObject.type ||
            jobObject.jobType ||
            "Full Time",

        mode:
            jobObject.mode ||
            jobObject.workMode ||
            "On-site",

        workMode:
            jobObject.mode ||
            jobObject.workMode ||
            "On-site",

        experience:
            jobObject.experience ||
            "Not specified",

        salary:
            jobObject.salary ||
            "Not disclosed",

        location:
            jobObject.location ||
            "Location not specified",

        description:
            jobObject.description ||
            "No job description available.",

        skills:
            Array.isArray(jobObject.skills)
                ? jobObject.skills
                : [],

        requirements:
            Array.isArray(jobObject.requirements)
                ? jobObject.requirements
                : [],

        responsibilities:
            Array.isArray(jobObject.responsibilities)
                ? jobObject.responsibilities
                : [],

        benefits:
            Array.isArray(jobObject.benefits)
                ? jobObject.benefits
                : [],

        status:
            jobObject.status ||
            "Active",
    };
};

// ============================================================
// GET ALL JOBS
// GET /api/jobs
// ============================================================

const getJobs = async (req, res) => {
    try {
        const jobs = await Job.find()
            .sort({
                createdAt: -1,
            })
            .populate(
                "recruiter",
                "name fullName username email"
            );

        const formattedJobs =
            jobs.map(formatJob);

        return res.status(200).json({
            success: true,
            count: formattedJobs.length,
            jobs: formattedJobs,
        });
    } catch (error) {
        console.error(
            "GET JOBS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch jobs",
            error: error.message,
        });
    }
};

// ============================================================
// GET SINGLE JOB
// GET /api/jobs/:jobId
// ============================================================

const getJobById = async (req, res) => {
    try {
        const { jobId } = req.params;

        if (
            !mongoose.Types.ObjectId.isValid(jobId)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid job ID",
            });
        }

        const job = await Job.findById(jobId)
            .populate(
                "recruiter",
                "name fullName username email"
            );

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found",
            });
        }

        return res.status(200).json({
            success: true,
            job: formatJob(job),
        });
    } catch (error) {
        console.error(
            "GET JOB ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch job",
            error: error.message,
        });
    }
};

// ============================================================
// CREATE JOB
// POST /api/jobs
// RECRUITER ONLY
// ============================================================

const createJob = async (req, res) => {
    try {
        const recruiterId =
            verifyRecruiter(req, res);

        if (!recruiterId) {
            return;
        }

        const recruiterProfile =
            await RecruiterProfile.findOne({
                user: recruiterId,
            });

        if (!recruiterProfile) {
            return res.status(404).json({
                success: false,
                message:
                    "Recruiter profile not found. Please complete your recruiter profile before posting a job.",
            });
        }

        const {
            title,
            location,
            type,
            jobType,
            experience,
            salary,
            mode,
            workMode,
            description,
            skills,
            requirements,
            responsibilities,
            benefits,
            status,
        } = req.body;

        // --------------------------------------------------------
        // NORMALIZE FIELDS
        // --------------------------------------------------------

        const normalizedTitle =
            cleanString(title);

        const normalizedLocation =
            cleanString(location);

        const normalizedExperience =
            cleanString(experience);

        const normalizedDescription =
            cleanString(description);

        const normalizedType =
            cleanString(
                type !== undefined
                    ? type
                    : jobType,
                "Full Time"
            );

        const normalizedMode =
            cleanString(
                mode !== undefined
                    ? mode
                    : workMode,
                "On-site"
            );

        const normalizedSalary =
            cleanString(
                salary,
                "Not disclosed"
            );

        const normalizedStatus =
            cleanString(
                status,
                "Active"
            );

        // --------------------------------------------------------
        // REQUIRED VALIDATION
        // --------------------------------------------------------

        if (!normalizedTitle) {
            return res.status(400).json({
                success: false,
                message: "Job title is required",
            });
        }

        if (!normalizedLocation) {
            return res.status(400).json({
                success: false,
                message:
                    "Job location is required",
            });
        }

        if (!normalizedExperience) {
            return res.status(400).json({
                success: false,
                message:
                    "Experience is required",
            });
        }

        if (!normalizedDescription) {
            return res.status(400).json({
                success: false,
                message:
                    "Job description is required",
            });
        }

        // --------------------------------------------------------
        // COMPANY
        // --------------------------------------------------------

        const companyName =
            getCompanyName(
                recruiterProfile,
                req.user
            );

        if (
            !companyName ||
            companyName === "Company"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Recruiter company name is missing. Please complete your recruiter profile.",
            });
        }

        // --------------------------------------------------------
        // CREATE JOB
        // --------------------------------------------------------

        const job = await Job.create({
            recruiter: recruiterId,

            company: companyName,

            title: normalizedTitle,

            location: normalizedLocation,

            type: normalizedType,

            experience: normalizedExperience,

            salary: normalizedSalary,

            mode: normalizedMode,

            description:
                normalizedDescription,

            skills:
                cleanArray(skills),

            requirements:
                cleanArray(requirements),

            responsibilities:
                cleanArray(responsibilities),

            benefits:
                cleanArray(benefits),

            status: normalizedStatus,
        });

        // --------------------------------------------------------
        // POPULATE
        // --------------------------------------------------------

        const populatedJob =
            await Job.findById(job._id)
                .populate(
                    "recruiter",
                    "name fullName username email"
                );

        return res.status(201).json({
            success: true,

            message:
                "Job posted successfully",

            job:
                formatJob(populatedJob),
        });
    } catch (error) {
        console.error(
            "CREATE JOB ERROR:",
            error
        );

        if (
            error.name ===
            "ValidationError"
        ) {
            const messages =
                Object.values(
                    error.errors || {}
                )
                    .map(
                        (item) =>
                            item.message
                    )
                    .join(", ");

            return res.status(400).json({
                success: false,
                message:
                    messages ||
                    "Job validation failed",
            });
        }

        if (
            error.name ===
            "CastError"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid job or recruiter ID",
            });
        }

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message:
                    "A duplicate job record already exists",
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Failed to create job",
            error: error.message,
        });
    }
};

// ============================================================
// GET RECRUITER JOBS
// GET /api/jobs/recruiter/my
// RECRUITER ONLY
// ============================================================

const getMyRecruiterJobs = async (
    req,
    res
) => {
    try {
        const recruiterId =
            verifyRecruiter(req, res);

        if (!recruiterId) {
            return;
        }

        const jobs =
            await Job.find({
                recruiter: recruiterId,
            })
                .sort({
                    createdAt: -1,
                })
                .populate(
                    "recruiter",
                    "name fullName username email"
                );

        const formattedJobs =
            jobs.map(formatJob);

        return res.status(200).json({
            success: true,

            count:
                formattedJobs.length,

            jobs:
                formattedJobs,
        });
    } catch (error) {
        console.error(
            "GET RECRUITER JOBS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch recruiter jobs",
            error: error.message,
        });
    }
};

// ============================================================
// UPDATE JOB
// PUT /api/jobs/:jobId
// RECRUITER ONLY
// ============================================================

const updateJob = async (req, res) => {
    try {
        const recruiterId =
            verifyRecruiter(req, res);

        if (!recruiterId) {
            return;
        }

        const { jobId } =
            req.params;

        if (
            !mongoose.Types.ObjectId.isValid(
                jobId
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid job ID",
            });
        }

        const job =
            await Job.findById(jobId);

        if (!job) {
            return res.status(404).json({
                success: false,
                message:
                    "Job not found",
            });
        }

        if (
            !verifyJobOwnership(
                job,
                recruiterId
            )
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You are not authorized to update this job",
            });
        }

        // --------------------------------------------------------
        // TITLE
        // --------------------------------------------------------

        if (
            req.body.title !==
            undefined
        ) {
            const value =
                cleanString(
                    req.body.title
                );

            if (!value) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Job title cannot be empty",
                });
            }

            job.title = value;
        }

        // --------------------------------------------------------
        // LOCATION
        // --------------------------------------------------------

        if (
            req.body.location !==
            undefined
        ) {
            const value =
                cleanString(
                    req.body.location
                );

            if (!value) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Job location cannot be empty",
                });
            }

            job.location = value;
        }

        // --------------------------------------------------------
        // EXPERIENCE
        // --------------------------------------------------------

        if (
            req.body.experience !==
            undefined
        ) {
            job.experience =
                cleanString(
                    req.body.experience
                );
        }

        // --------------------------------------------------------
        // DESCRIPTION
        // --------------------------------------------------------

        if (
            req.body.description !==
            undefined
        ) {
            job.description =
                cleanString(
                    req.body.description
                );
        }

        // --------------------------------------------------------
        // JOB TYPE
        // --------------------------------------------------------

        if (
            req.body.type !==
                undefined ||
            req.body.jobType !==
                undefined
        ) {
            const typeValue =
                req.body.type !==
                undefined
                    ? req.body.type
                    : req.body.jobType;

            job.type =
                cleanString(
                    typeValue
                );
        }

        // --------------------------------------------------------
        // WORK MODE
        // --------------------------------------------------------

        if (
            req.body.mode !==
                undefined ||
            req.body.workMode !==
                undefined
        ) {
            const modeValue =
                req.body.mode !==
                undefined
                    ? req.body.mode
                    : req.body.workMode;

            job.mode =
                cleanString(
                    modeValue
                );
        }

        // --------------------------------------------------------
        // SALARY
        // --------------------------------------------------------

        if (
            req.body.salary !==
            undefined
        ) {
            job.salary =
                cleanString(
                    req.body.salary,
                    "Not disclosed"
                );
        }

        // --------------------------------------------------------
        // ARRAYS
        // --------------------------------------------------------

        if (
            req.body.skills !==
            undefined
        ) {
            job.skills =
                cleanArray(
                    req.body.skills
                );
        }

        if (
            req.body.requirements !==
            undefined
        ) {
            job.requirements =
                cleanArray(
                    req.body.requirements
                );
        }

        if (
            req.body.responsibilities !==
            undefined
        ) {
            job.responsibilities =
                cleanArray(
                    req.body.responsibilities
                );
        }

        if (
            req.body.benefits !==
            undefined
        ) {
            job.benefits =
                cleanArray(
                    req.body.benefits
                );
        }

        // --------------------------------------------------------
        // STATUS
        // --------------------------------------------------------

        if (
            req.body.status !==
            undefined
        ) {
            job.status =
                cleanString(
                    req.body.status,
                    "Active"
                );
        }

        await job.save();

        const updatedJob =
            await Job.findById(
                job._id
            ).populate(
                "recruiter",
                "name fullName username email"
            );

        return res.status(200).json({
            success: true,

            message:
                "Job updated successfully",

            job:
                formatJob(
                    updatedJob
                ),
        });
    } catch (error) {
        console.error(
            "UPDATE JOB ERROR:",
            error
        );

        if (
            error.name ===
            "ValidationError"
        ) {
            const messages =
                Object.values(
                    error.errors || {}
                )
                    .map(
                        (item) =>
                            item.message
                    )
                    .join(", ");

            return res.status(400).json({
                success: false,
                message:
                    messages ||
                    "Job validation failed",
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Failed to update job",
            error: error.message,
        });
    }
};

// ============================================================
// UPDATE JOB STATUS
// PATCH /api/jobs/:jobId/status
// RECRUITER ONLY
// ============================================================

const updateJobStatus = async (
    req,
    res
) => {
    try {
        const recruiterId =
            verifyRecruiter(req, res);

        if (!recruiterId) {
            return;
        }

        const { jobId } =
            req.params;

        if (
            !mongoose.Types.ObjectId.isValid(
                jobId
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid job ID",
            });
        }

        const status =
            cleanString(
                req.body.status
            );

        if (!status) {
            return res.status(400).json({
                success: false,
                message:
                    "Job status is required",
            });
        }

        const job =
            await Job.findById(jobId);

        if (!job) {
            return res.status(404).json({
                success: false,
                message:
                    "Job not found",
            });
        }

        if (
            !verifyJobOwnership(
                job,
                recruiterId
            )
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You are not authorized to change this job",
            });
        }

        job.status = status;

        await job.save();

        const updatedJob =
            await Job.findById(
                job._id
            ).populate(
                "recruiter",
                "name fullName username email"
            );

        return res.status(200).json({
            success: true,

            message:
                "Job status updated successfully",

            job:
                formatJob(
                    updatedJob
                ),
        });
    } catch (error) {
        console.error(
            "UPDATE JOB STATUS ERROR:",
            error
        );

        if (
            error.name ===
            "ValidationError"
        ) {
            const messages =
                Object.values(
                    error.errors || {}
                )
                    .map(
                        (item) =>
                            item.message
                    )
                    .join(", ");

            return res.status(400).json({
                success: false,
                message:
                    messages ||
                    "Job status validation failed",
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Failed to update job status",
            error: error.message,
        });
    }
};

// ============================================================
// DELETE JOB
// DELETE /api/jobs/:jobId
// RECRUITER ONLY
// ============================================================

const deleteJob = async (
    req,
    res
) => {
    try {
        const recruiterId =
            verifyRecruiter(req, res);

        if (!recruiterId) {
            return;
        }

        const { jobId } =
            req.params;

        if (
            !mongoose.Types.ObjectId.isValid(
                jobId
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid job ID",
            });
        }

        const job =
            await Job.findById(jobId);

        if (!job) {
            return res.status(404).json({
                success: false,
                message:
                    "Job not found",
            });
        }

        if (
            !verifyJobOwnership(
                job,
                recruiterId
            )
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You are not authorized to delete this job",
            });
        }

        await Job.findByIdAndDelete(
            jobId
        );

        return res.status(200).json({
            success: true,
            message:
                "Job deleted successfully",
        });
    } catch (error) {
        console.error(
            "DELETE JOB ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to delete job",
            error: error.message,
        });
    }
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
    getJobs,
    getJobById,
    createJob,
    getMyRecruiterJobs,
    updateJob,
    updateJobStatus,
    deleteJob,
};