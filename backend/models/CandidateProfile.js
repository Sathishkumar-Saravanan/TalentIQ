const mongoose = require("mongoose");

const candidateProfileSchema = new mongoose.Schema (
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            trim: true,
        },
        phone: {
            type: String,
            trim: true,
        },
        location: {
            type: String,
            trim: true,
        },
        headline: {
            type: String,
            trim: true,
            maxlength: 100,
        },
        bio: {
            type: String,
            trim: true,
            maxlength: 1000,
        },
        skills: [
            {
                type: String,
                trim: true,
            },
        ],
        education: [
            {
                degree: {
                    type: String,
                    trim: true,
                },
                institution: {
                    type: String,
                    trim: true,
                },
                fieldOfstudy: {
                    type: String,
                    trim: true,
                },
                startYear: {
                    type: Number,
                },
                endYear: {
                    type: Number,
                },
            },
        ],
        experience: [
            {
                jobTitle: {
                    type: String,
                    trim: true,
                },
                company: {
                    type: String,
                    trim: true,
                },
                startDate: {
                    type: Date,
                },
                endDate: {
                    type: Date,
                },
                description: {
                    type: String,
                    trim: true,
                },
            },
        ],
        projects: [
            {
                title: {
                    type: String,
                    trim: true,
                },
                destription: {
                    type: String,
                    trim: true,
                },
                technologies: [ 
                {
                    type: String,
                    trim: true,
                },
            ],
            projectUrl: {
                type: String,
                trim: true,
            },
            },
        ],
        certifications: [
            {
                name: {
                    type: String,
                    trim: true,
                },

                issuer: {
                    type: String,
                    trim: true,
                },
                year: {
                    type: Number,
                },
            },
        ],
        resume: {
            fileName: {
                type: String,
            },
            fileUrl: {
                type: String,
            },
        },
        preferredJobRole: {
            type: String,
            trim: true,
        },
        expectedSalary: {
            type: Number,
        },
    },
    {
        timestamps: true,
    }
);
const Candidateprofile = mongoose.model(
    "CandidateProfile",
    candidateProfileSchema
);

module.exports = Candidateprofile;