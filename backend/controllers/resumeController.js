const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const User = require("../models/User");


// ============================================================
// RESUME UPLOAD DIRECTORY
// ============================================================

const uploadDirectory = path.join(
    process.cwd(),
    "uploads",
    "resumes"
);


// ============================================================
// CREATE DIRECTORY IF NOT EXISTS
// ============================================================

if (!fs.existsSync(uploadDirectory)) {

    fs.mkdirSync(
        uploadDirectory,
        {
            recursive: true,
        }
    );
}


// ============================================================
// RESUME COLLECTION
// ============================================================

const getResumeCollection = () => {

    if (!mongoose.connection.db) {

        throw new Error(
            "MongoDB connection is not available"
        );
    }

    return mongoose.connection.db.collection(
        "resumes"
    );
};


// ============================================================
// USER ID
// ============================================================

const getUserId = (req) => {

    return (
        req.user?._id ||
        req.user?.id
    );
};


// ============================================================
// HAS OWN
// ============================================================

const hasOwn = (
    obj,
    key
) => {

    return Object.prototype.hasOwnProperty.call(
        obj || {},
        key
    );
};


// ============================================================
// CLEAN STRING
// ============================================================

const cleanString = (
    value
) => {

    if (
        value === null ||
        value === undefined
    ) {

        return "";
    }

    return String(value).trim();
};


// ============================================================
// CONVERT USER ID
// ============================================================

const getObjectId = (
    userId
) => {

    if (
        userId instanceof
        mongoose.Types.ObjectId
    ) {

        return userId;
    }

    return new mongoose.Types.ObjectId(
        userId
    );
};


// ============================================================
// BUILD FILE URL
// ============================================================

const buildFileUrl = (
    filename
) => {

    if (!filename) {
        return "";
    }

    return `/uploads/resumes/${filename}`;
};


// ============================================================
// GET RESUME
// GET /api/resumes
// ============================================================

const getResume = async (
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


        const objectId =
            getObjectId(
                userId
            );


        const resumeCollection =
            getResumeCollection();


        // --------------------------------------------------------
        // FIND USER
        // --------------------------------------------------------

        const user =
            await User.collection.findOne(
                {
                    _id: objectId,
                },
                {
                    projection: {
                        password: 0,
                        __v: 0,
                    },
                }
            );


        if (!user) {

            return res.status(404).json({
                success: false,
                message:
                    "User not found",
            });
        }


        // --------------------------------------------------------
        // FIND RESUME
        // --------------------------------------------------------

        const resume =
            await resumeCollection.findOne({
                $or: [
                    {
                        user: objectId,
                    },
                    {
                        userId: objectId,
                    },
                    {
                        user:
                            objectId.toString(),
                    },
                    {
                        userId:
                            objectId.toString(),
                    },
                    {
                        candidate: objectId,
                    },
                    {
                        candidateId: objectId,
                    },
                    {
                        email:
                            user.email,
                    },
                ],
            });


        // --------------------------------------------------------
        // USER PERSONAL INFO
        // --------------------------------------------------------

        const userPersonalInfo = {

            fullName:
                user.fullName ||
                user.name ||
                user.username ||
                "",

            email:
                user.email ||
                "",

            phone:
                user.phone ||
                "",

            location:
                user.location ||
                "",

            linkedin:
                user.linkedin ||
                "",

            github:
                user.github ||
                "",

            portfolio:
                user.portfolio ||
                "",
        };


        // ========================================================
        // RESUME EXISTS
        // ========================================================

        if (resume) {

            const resumePersonalInfo =
                resume.personalInfo ||
                {};


            const mergedPersonalInfo = {

                fullName:
                    resumePersonalInfo.fullName ||
                    userPersonalInfo.fullName,

                email:
                    resumePersonalInfo.email ||
                    userPersonalInfo.email,

                phone:
                    hasOwn(
                        resumePersonalInfo,
                        "phone"
                    )
                        ? resumePersonalInfo.phone
                        : userPersonalInfo.phone,

                location:
                    hasOwn(
                        resumePersonalInfo,
                        "location"
                    )
                        ? resumePersonalInfo.location
                        : userPersonalInfo.location,

                linkedin:
                    hasOwn(
                        resumePersonalInfo,
                        "linkedin"
                    )
                        ? resumePersonalInfo.linkedin
                        : userPersonalInfo.linkedin,

                github:
                    hasOwn(
                        resumePersonalInfo,
                        "github"
                    )
                        ? resumePersonalInfo.github
                        : userPersonalInfo.github,

                portfolio:
                    hasOwn(
                        resumePersonalInfo,
                        "portfolio"
                    )
                        ? resumePersonalInfo.portfolio
                        : userPersonalInfo.portfolio,
            };


            const finalResume = {

                ...resume,

                personalInfo:
                    mergedPersonalInfo,

                phone:
                    resume.phone !== undefined
                        ? resume.phone
                        : userPersonalInfo.phone,

                location:
                    resume.location !== undefined
                        ? resume.location
                        : userPersonalInfo.location,

                linkedin:
                    resume.linkedin !== undefined
                        ? resume.linkedin
                        : userPersonalInfo.linkedin,

                github:
                    resume.github !== undefined
                        ? resume.github
                        : userPersonalInfo.github,

                portfolio:
                    resume.portfolio !== undefined
                        ? resume.portfolio
                        : userPersonalInfo.portfolio,

                // ------------------------------------------------
                // FILE INFORMATION
                // ------------------------------------------------

                fileId:
                    resume.fileId ||
                    null,

                fileName:
                    resume.fileName ||
                    resume.originalName ||
                    "",

                fileUrl:
                    resume.fileUrl ||
                    (
                        resume.fileStoredName
                            ? buildFileUrl(
                                resume.fileStoredName
                            )
                            : ""
                    ),

                mimeType:
                    resume.mimeType ||
                    "",

                fileSize:
                    resume.fileSize ||
                    0,

                uploadedAt:
                    resume.uploadedAt ||
                    null,
            };


            const responseUser = {

                id:
                    user._id,

                fullName:
                    userPersonalInfo.fullName,

                email:
                    userPersonalInfo.email,

                phone:
                    userPersonalInfo.phone,

                location:
                    userPersonalInfo.location,

                linkedin:
                    userPersonalInfo.linkedin,

                github:
                    userPersonalInfo.github,

                portfolio:
                    userPersonalInfo.portfolio,
            };


            return res.status(200).json({

                success: true,

                message:
                    "Resume loaded successfully",

                resume:
                    finalResume,

                user:
                    responseUser,

                data: {

                    resume:
                        finalResume,

                    user:
                        responseUser,
                },
            });
        }


        // ========================================================
        // NO RESUME DOCUMENT
        // ========================================================

        const fallbackResume = {

            available:
                Boolean(
                    user.resume ||
                    user.resumeFileId ||
                    user.resumeOriginalName
                ),

            fileId:
                user.resumeFileId ||
                null,

            fileName:
                user.resumeOriginalName ||
                "",

            originalName:
                user.resumeOriginalName ||
                "",

            fileUrl:
                user.resumeFileUrl ||
                "",

            mimeType:
                user.resumeMimeType ||
                "",

            fileSize:
                user.resumeFileSize ||
                0,

            uploadedAt:
                user.resumeUploadedAt ||
                null,

            resume:
                user.resume ||
                "",

            personalInfo:
                userPersonalInfo,

            headline:
                user.headline ||
                "",

            summary:
                user.summary ||
                "",

            skills:
                user.skills ||
                [],

            education:
                user.education ||
                [],

            experience:
                user.experience ||
                [],

            projects:
                user.projects ||
                [],

            certifications:
                user.certifications ||
                [],

            achievements:
                user.achievements ||
                [],

            languages:
                user.languages ||
                [],

            template:
                user.template ||
                "modern",
        };


        const responseUser = {

            id:
                user._id,

            fullName:
                userPersonalInfo.fullName,

            email:
                userPersonalInfo.email,

            phone:
                userPersonalInfo.phone,

            location:
                userPersonalInfo.location,

            linkedin:
                userPersonalInfo.linkedin,

            github:
                userPersonalInfo.github,

            portfolio:
                userPersonalInfo.portfolio,
        };


        return res.status(200).json({

            success: true,

            message:
                "Resume loaded successfully",

            resume:
                fallbackResume,

            user:
                responseUser,

            data: {

                resume:
                    fallbackResume,

                user:
                    responseUser,
            },
        });


    } catch (error) {

        console.error(
            "GET RESUME ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to load resume",

            error:
                error.message,
        });
    }
};


// ============================================================
// UPLOAD RESUME
// POST /api/resumes/upload
// ============================================================

const uploadResume = async (
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


        if (!req.file) {

            return res.status(400).json({

                success: false,

                message:
                    "Please select a resume file.",
            });
        }


        const objectId =
            getObjectId(
                userId
            );


        const resumeCollection =
            getResumeCollection();


        const file =
            req.file;


        // --------------------------------------------------------
        // FILE URL
        // --------------------------------------------------------

        const fileUrl =
            buildFileUrl(
                file.filename
            );


        // --------------------------------------------------------
        // FIND EXISTING RESUME
        // --------------------------------------------------------

        const existingResume =
            await resumeCollection.findOne({

                $or: [

                    {
                        user:
                            objectId,
                    },

                    {
                        userId:
                            objectId,
                    },

                    {
                        user:
                            objectId.toString(),
                    },

                    {
                        userId:
                            objectId.toString(),
                    },

                    {
                        candidate:
                            objectId,
                    },

                    {
                        candidateId:
                            objectId,
                    },

                    ...(req.user?.email
                        ? [
                            {
                                email:
                                    req.user.email,
                            },
                        ]
                        : []),
                ],
            });


        // --------------------------------------------------------
        // DELETE OLD FILE
        // --------------------------------------------------------

        if (
            existingResume?.fileStoredName &&
            existingResume.fileStoredName !==
                file.filename
        ) {

            const oldFilePath =
                path.join(
                    uploadDirectory,
                    existingResume.fileStoredName
                );


            if (
                fs.existsSync(
                    oldFilePath
                )
            ) {

                try {

                    fs.unlinkSync(
                        oldFilePath
                    );

                } catch (deleteError) {

                    console.error(
                        "OLD RESUME DELETE ERROR:",
                        deleteError
                    );
                }
            }
        }


        // --------------------------------------------------------
        // RESUME FILE DATA
        // --------------------------------------------------------

        const fileData = {

            fileId:
                existingResume?.fileId ||
                new mongoose.Types.ObjectId(),

            fileName:
                file.originalname,

            originalName:
                file.originalname,

            fileStoredName:
                file.filename,

            fileUrl:
                fileUrl,

            mimeType:
                file.mimetype,

            fileSize:
                file.size,

            uploadedAt:
                new Date(),
        };


        // --------------------------------------------------------
        // SAVE RESUME
        // --------------------------------------------------------

        let savedResume;


        if (existingResume) {

            await resumeCollection.updateOne(

                {
                    _id:
                        existingResume._id,
                },

                {
                    $set: {

                        ...fileData,

                        user:
                            objectId,

                        userId:
                            objectId,

                        updatedAt:
                            new Date(),
                    },
                }
            );


            savedResume =
                await resumeCollection.findOne(
                    {
                        _id:
                            existingResume._id,
                    }
                );

        } else {

            const newResume = {

                user:
                    objectId,

                userId:
                    objectId,

                email:
                    req.user?.email ||
                    "",

                ...fileData,

                personalInfo: {

                    fullName:
                        req.user?.fullName ||
                        req.user?.name ||
                        req.user?.username ||
                        "",

                    email:
                        req.user?.email ||
                        "",

                    phone:
                        "",

                    location:
                        "",

                    linkedin:
                        "",

                    github:
                        "",

                    portfolio:
                        "",
                },

                createdAt:
                    new Date(),

                updatedAt:
                    new Date(),
            };


            const result =
                await resumeCollection.insertOne(
                    newResume
                );


            savedResume =
                await resumeCollection.findOne(
                    {
                        _id:
                            result.insertedId,
                    }
                );
        }


        // --------------------------------------------------------
        // UPDATE USER
        // --------------------------------------------------------

        await User.collection.updateOne(

            {
                _id:
                    objectId,
            },

            {
                $set: {

                    resumeFileId:
                        fileData.fileId,

                    resumeOriginalName:
                        file.originalname,

                    resumeFileUrl:
                        fileUrl,

                    resumeMimeType:
                        file.mimetype,

                    resumeFileSize:
                        file.size,

                    resumeUploadedAt:
                        new Date(),

                    updatedAt:
                        new Date(),
                },
            }
        );


        // --------------------------------------------------------
        // RESPONSE
        // --------------------------------------------------------

        const responseResume = {

            _id:
                savedResume?._id,

            fileId:
                fileData.fileId,

            fileName:
                file.originalname,

            originalName:
                file.originalname,

            fileUrl:
                fileUrl,

            mimeType:
                file.mimetype,

            fileSize:
                file.size,

            uploadedAt:
                fileData.uploadedAt,
        };


        return res.status(200).json({

            success: true,

            message:
                "Resume uploaded successfully.",

            resume:
                responseResume,

            data: {

                resume:
                    responseResume,
            },
        });


    } catch (error) {

        console.error(
            "UPLOAD RESUME ERROR:",
            error
        );


        // --------------------------------------------------------
        // DELETE FILE IF DATABASE SAVE FAILED
        // --------------------------------------------------------

        if (req.file?.filename) {

            const uploadedFilePath =
                path.join(
                    uploadDirectory,
                    req.file.filename
                );


            if (
                fs.existsSync(
                    uploadedFilePath
                )
            ) {

                try {

                    fs.unlinkSync(
                        uploadedFilePath
                    );

                } catch (deleteError) {

                    console.error(
                        "UPLOAD CLEANUP ERROR:",
                        deleteError
                    );
                }
            }
        }


        return res.status(500).json({

            success: false,

            message:
                "Failed to upload resume.",

            error:
                error.message,
        });
    }
};


// ============================================================
// SAVE RESUME DATA
// POST /api/resumes
// ============================================================

const saveResume = async (
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


        const objectId =
            getObjectId(
                userId
            );


        const resumeCollection =
            getResumeCollection();


        const body =
            req.body || {};


        const {

            _id,

            user,

            userId: bodyUserId,

            candidate,

            candidateId,

            createdAt,

            updatedAt,

            phone: rootPhone,

            location: rootLocation,

            linkedin: rootLinkedin,

            github: rootGithub,

            portfolio: rootPortfolio,

            ...resumeData

        } = body;


        const incomingPersonalInfo =
            body.personalInfo ||
            {};


        const personalInfo = {

            fullName:
                hasOwn(
                    incomingPersonalInfo,
                    "fullName"
                )
                    ? cleanString(
                        incomingPersonalInfo.fullName
                    )
                    : cleanString(
                        body.fullName
                    ),

            email:
                hasOwn(
                    incomingPersonalInfo,
                    "email"
                )
                    ? cleanString(
                        incomingPersonalInfo.email
                    )
                    : cleanString(
                        body.email
                    ),

            phone:
                hasOwn(
                    incomingPersonalInfo,
                    "phone"
                )
                    ? cleanString(
                        incomingPersonalInfo.phone
                    )
                    : cleanString(
                        rootPhone
                    ),

            location:
                hasOwn(
                    incomingPersonalInfo,
                    "location"
                )
                    ? cleanString(
                        incomingPersonalInfo.location
                    )
                    : cleanString(
                        rootLocation
                    ),

            linkedin:
                hasOwn(
                    incomingPersonalInfo,
                    "linkedin"
                )
                    ? cleanString(
                        incomingPersonalInfo.linkedin
                    )
                    : cleanString(
                        rootLinkedin
                    ),

            github:
                hasOwn(
                    incomingPersonalInfo,
                    "github"
                )
                    ? cleanString(
                        incomingPersonalInfo.github
                    )
                    : cleanString(
                        rootGithub
                    ),

            portfolio:
                hasOwn(
                    incomingPersonalInfo,
                    "portfolio"
                )
                    ? cleanString(
                        incomingPersonalInfo.portfolio
                    )
                    : cleanString(
                        rootPortfolio
                    ),
        };


        const existingResume =
            await resumeCollection.findOne({

                $or: [

                    {
                        user:
                            objectId,
                    },

                    {
                        userId:
                            objectId,
                    },

                    {
                        user:
                            objectId.toString(),
                    },

                    {
                        userId:
                            objectId.toString(),
                    },

                    {
                        candidate:
                            objectId,
                    },

                    {
                        candidateId:
                            objectId,
                    },

                    ...(req.user?.email
                        ? [
                            {
                                email:
                                    req.user.email,
                            },
                        ]
                        : []),
                ],
            });


        const finalResumeData = {

            ...resumeData,

            user:
                objectId,

            userId:
                objectId,

            email:
                personalInfo.email ||
                req.user?.email ||
                "",

            personalInfo: {

                ...personalInfo,
            },

            phone:
                personalInfo.phone,

            location:
                personalInfo.location,

            linkedin:
                personalInfo.linkedin,

            github:
                personalInfo.github,

            portfolio:
                personalInfo.portfolio,

            updatedAt:
                new Date(),
        };


        // --------------------------------------------------------
        // IMPORTANT:
        // PRESERVE UPLOADED FILE INFORMATION
        // --------------------------------------------------------

        if (existingResume) {

            if (
                existingResume.fileId &&
                !finalResumeData.fileId
            ) {

                finalResumeData.fileId =
                    existingResume.fileId;
            }


            if (
                existingResume.fileName &&
                !finalResumeData.fileName
            ) {

                finalResumeData.fileName =
                    existingResume.fileName;
            }


            if (
                existingResume.fileUrl &&
                !finalResumeData.fileUrl
            ) {

                finalResumeData.fileUrl =
                    existingResume.fileUrl;
            }


            if (
                existingResume.fileStoredName &&
                !finalResumeData.fileStoredName
            ) {

                finalResumeData.fileStoredName =
                    existingResume.fileStoredName;
            }


            if (
                existingResume.mimeType &&
                !finalResumeData.mimeType
            ) {

                finalResumeData.mimeType =
                    existingResume.mimeType;
            }


            if (
                existingResume.fileSize &&
                !finalResumeData.fileSize
            ) {

                finalResumeData.fileSize =
                    existingResume.fileSize;
            }


            if (
                existingResume.uploadedAt &&
                !finalResumeData.uploadedAt
            ) {

                finalResumeData.uploadedAt =
                    existingResume.uploadedAt;
            }
        }


        let savedResume;


        if (existingResume) {

            await resumeCollection.updateOne(

                {
                    _id:
                        existingResume._id,
                },

                {
                    $set:
                        finalResumeData,
                }
            );


            savedResume =
                await resumeCollection.findOne(
                    {
                        _id:
                            existingResume._id,
                    }
                );

        } else {

            finalResumeData.createdAt =
                new Date();


            const insertResult =
                await resumeCollection.insertOne(
                    finalResumeData
                );


            savedResume =
                await resumeCollection.findOne(
                    {
                        _id:
                            insertResult.insertedId,
                    }
                );
        }


        // --------------------------------------------------------
        // UPDATE USER
        // --------------------------------------------------------

        const userUpdate = {

            updatedAt:
                new Date(),
        };


        if (
            hasOwn(
                incomingPersonalInfo,
                "fullName"
            )
        ) {

            userUpdate.fullName =
                personalInfo.fullName;
        }


        if (
            hasOwn(
                incomingPersonalInfo,
                "phone"
            )
        ) {

            userUpdate.phone =
                personalInfo.phone;
        }


        if (
            hasOwn(
                incomingPersonalInfo,
                "location"
            )
        ) {

            userUpdate.location =
                personalInfo.location;
        }


        if (
            hasOwn(
                incomingPersonalInfo,
                "linkedin"
            )
        ) {

            userUpdate.linkedin =
                personalInfo.linkedin;
        }


        if (
            hasOwn(
                incomingPersonalInfo,
                "github"
            )
        ) {

            userUpdate.github =
                personalInfo.github;
        }


        if (
            hasOwn(
                incomingPersonalInfo,
                "portfolio"
            )
        ) {

            userUpdate.portfolio =
                personalInfo.portfolio;
        }


        if (
            hasOwn(
                body,
                "skills"
            )
        ) {

            userUpdate.skills =
                body.skills;
        }


        if (
            hasOwn(
                body,
                "education"
            )
        ) {

            userUpdate.education =
                body.education;
        }


        if (
            hasOwn(
                body,
                "experience"
            )
        ) {

            userUpdate.experience =
                body.experience;
        }


        if (
            hasOwn(
                body,
                "projects"
            )
        ) {

            userUpdate.projects =
                body.projects;
        }


        if (
            hasOwn(
                body,
                "certifications"
            )
        ) {

            userUpdate.certifications =
                body.certifications;
        }


        if (
            hasOwn(
                body,
                "achievements"
            )
        ) {

            userUpdate.achievements =
                body.achievements;
        }


        if (
            hasOwn(
                body,
                "languages"
            )
        ) {

            userUpdate.languages =
                body.languages;
        }


        if (
            hasOwn(
                body,
                "headline"
            )
        ) {

            userUpdate.headline =
                body.headline;
        }


        if (
            hasOwn(
                body,
                "summary"
            )
        ) {

            userUpdate.summary =
                body.summary;
        }


        await User.collection.updateOne(

            {
                _id:
                    objectId,
            },

            {
                $set:
                    userUpdate,
            }
        );


        const updatedUser =
            await User.collection.findOne(

                {
                    _id:
                        objectId,
                },

                {
                    projection: {
                        password: 0,
                        __v: 0,
                    },
                }
            );


        const responseUser = {

            id:
                updatedUser?._id ||
                objectId,

            fullName:
                updatedUser?.fullName ||
                updatedUser?.name ||
                "",

            email:
                updatedUser?.email ||
                personalInfo.email ||
                "",

            phone:
                updatedUser?.phone ||
                "",

            location:
                updatedUser?.location ||
                "",

            linkedin:
                updatedUser?.linkedin ||
                "",

            github:
                updatedUser?.github ||
                "",

            portfolio:
                updatedUser?.portfolio ||
                "",
        };


        return res.status(200).json({

            success: true,

            message:
                "Resume saved successfully",

            resume:
                savedResume,

            user:
                responseUser,

            data: {

                resume:
                    savedResume,

                user:
                    responseUser,
            },
        });


    } catch (error) {

        console.error(
            "SAVE RESUME ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to save resume",

            error:
                error.message,
        });
    }
};


// ============================================================
// DELETE RESUME
// DELETE /api/resumes
// ============================================================

const deleteResume = async (
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


        const objectId =
            getObjectId(
                userId
            );


        const resumeCollection =
            getResumeCollection();


        // --------------------------------------------------------
        // FIND RESUME BEFORE DELETE
        // --------------------------------------------------------

        const existingResume =
            await resumeCollection.findOne({

                $or: [

                    {
                        user:
                            objectId,
                    },

                    {
                        userId:
                            objectId,
                    },

                    {
                        user:
                            objectId.toString(),
                    },

                    {
                        userId:
                            objectId.toString(),
                    },

                    {
                        candidate:
                            objectId,
                    },

                    {
                        candidateId:
                            objectId,
                    },
                ],
            });


        // --------------------------------------------------------
        // DELETE PHYSICAL FILE
        // --------------------------------------------------------

        if (
            existingResume?.fileStoredName
        ) {

            const filePath =
                path.join(
                    uploadDirectory,
                    existingResume.fileStoredName
                );


            if (
                fs.existsSync(
                    filePath
                )
            ) {

                try {

                    fs.unlinkSync(
                        filePath
                    );

                } catch (fileError) {

                    console.error(
                        "DELETE RESUME FILE ERROR:",
                        fileError
                    );
                }
            }
        }


        // --------------------------------------------------------
        // DELETE DATABASE RESUME
        // --------------------------------------------------------

        await resumeCollection.deleteMany({

            $or: [

                {
                    user:
                        objectId,
                },

                {
                    userId:
                        objectId,
                },

                {
                    user:
                        objectId.toString(),
                },

                {
                    userId:
                        objectId.toString(),
                },

                {
                    candidate:
                        objectId,
                },

                {
                    candidateId:
                        objectId,
                },
            ],
        });


        // --------------------------------------------------------
        // CLEAR USER RESUME FIELDS
        // --------------------------------------------------------

        await User.collection.updateOne(

            {
                _id:
                    objectId,
            },

            {
                $unset: {

                    resume:
                        "",

                    resumeFileId:
                        "",

                    resumeOriginalName:
                        "",

                    resumeFileUrl:
                        "",

                    resumeMimeType:
                        "",

                    resumeFileSize:
                        "",

                    resumeUploadedAt:
                        "",
                },

                $set: {

                    updatedAt:
                        new Date(),
                },
            }
        );


        return res.status(200).json({

            success: true,

            message:
                "Resume deleted successfully",
        });


    } catch (error) {

        console.error(
            "DELETE RESUME ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to delete resume",

            error:
                error.message,
        });
    }
};


// ============================================================
// EXPORT
// ============================================================

module.exports = {

    getResume,

    saveResume,

    uploadResume,

    deleteResume,
};