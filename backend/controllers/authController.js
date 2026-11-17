const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const User = require("../models/User");

// ============================================================
// JWT SECRET
// ============================================================

const JWT_SECRET =
    process.env.JWT_SECRET || "talentiq_secret_key";

// ============================================================
// GENERATE JWT
// ============================================================

const generateToken = (userId) => {
    return jwt.sign(
        {
            id: userId.toString(),
            userId: userId.toString(),
        },
        JWT_SECRET,
        {
            expiresIn: "7d",
        }
    );
};

// ============================================================
// EMAIL TRANSPORTER
// ============================================================

const createEmailTransporter = () => {
    if (
        !process.env.EMAIL_HOST ||
        !process.env.EMAIL_PORT ||
        !process.env.EMAIL_USER ||
        !process.env.EMAIL_PASSWORD
    ) {
        return null;
    }

    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,

        port: Number(process.env.EMAIL_PORT),

        secure:
            String(process.env.EMAIL_SECURE).toLowerCase() ===
            "true",

        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });
};

// ============================================================
// NORMALIZE ROLE
// ============================================================

const normalizeRole = (role) => {
    const normalizedRole = String(role || "")
        .trim()
        .toLowerCase();

    if (normalizedRole === "recruiter") {
        return "recruiter";
    }

    return "candidate";
};

// ============================================================
// REGISTER USER
// POST /api/auth/register
// ============================================================

const registerUser = async (req, res) => {
    try {
        console.log("==========================================");
        console.log("REGISTER REQUEST");
        console.log("BODY:", req.body);
        console.log("==========================================");

        const {
            fullName,
            name,
            username,
            email,
            password,
            role,
            accountType,
        } = req.body;

        // --------------------------------------------------------
        // NAME
        // --------------------------------------------------------

        const finalName = String(
            fullName || name || ""
        ).trim();

        // --------------------------------------------------------
        // EMAIL
        // --------------------------------------------------------

        const normalizedEmail = String(
            email || ""
        )
            .toLowerCase()
            .trim();

        // --------------------------------------------------------
        // USERNAME
        // --------------------------------------------------------

        const normalizedUsername = String(
            username || ""
        )
            .toLowerCase()
            .trim();

        // --------------------------------------------------------
        // ROLE
        // --------------------------------------------------------

        const requestedRole =
            role || accountType || "candidate";

        const accountRole =
            normalizeRole(requestedRole);

        console.log(
            "REQUESTED ROLE:",
            requestedRole
        );

        console.log(
            "FINAL ROLE:",
            accountRole
        );

        // --------------------------------------------------------
        // VALIDATION
        // --------------------------------------------------------

        if (!finalName) {
            return res.status(400).json({
                success: false,
                message: "Full name is required",
            });
        }

        if (!normalizedUsername) {
            return res.status(400).json({
                success: false,
                message: "Username is required",
            });
        }

        if (!normalizedEmail) {
            return res.status(400).json({
                success: false,
                message: "Email is required",
            });
        }

        if (!password) {
            return res.status(400).json({
                success: false,
                message: "Password is required",
            });
        }

        if (String(password).length < 6) {
            return res.status(400).json({
                success: false,
                message:
                    "Password must contain at least 6 characters",
            });
        }

        // --------------------------------------------------------
        // CHECK EXISTING USER
        // --------------------------------------------------------

        const existingUser = await User.findOne({
            $or: [
                {
                    email: normalizedEmail,
                },
                {
                    username: normalizedUsername,
                },
            ],
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message:
                    "Username or email already exists",
            });
        }

        // --------------------------------------------------------
        // HASH PASSWORD
        // --------------------------------------------------------

        const hashedPassword =
            await bcrypt.hash(
                String(password),
                10
            );

        // --------------------------------------------------------
        // CREATE USER
        // --------------------------------------------------------

        const user = await User.create({
            fullName: finalName,

            username: normalizedUsername,

            email: normalizedEmail,

            password: hashedPassword,

            role: accountRole,
        });

        console.log("USER CREATED:");

        console.log({
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
        });

        // --------------------------------------------------------
        // GENERATE JWT
        // --------------------------------------------------------

        const token =
            generateToken(user._id);

        // --------------------------------------------------------
        // RESPONSE
        // --------------------------------------------------------

        return res.status(201).json({
            success: true,

            message:
                "Account created successfully",

            token,

            user: {
                id: user._id,

                fullName:
                    user.fullName || "",

                username:
                    user.username || "",

                email:
                    user.email || "",

                role:
                    user.role || "candidate",
            },
        });
    } catch (error) {
        console.error(
            "REGISTER ERROR:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                "Unable to create account",

            error: error.message,
        });
    }
};

// ============================================================
// LOGIN USER
// POST /api/auth/login
// ============================================================

const loginUser = async (req, res) => {
    try {
        const {
            username,
            email,
            password,
            identifier,
        } = req.body;

        const loginValue =
            identifier ||
            email ||
            username;

        // --------------------------------------------------------
        // VALIDATION
        // --------------------------------------------------------

        if (!loginValue) {
            return res.status(400).json({
                success: false,
                message:
                    "Email or username is required",
            });
        }

        if (!password) {
            return res.status(400).json({
                success: false,
                message:
                    "Password is required",
            });
        }

        // --------------------------------------------------------
        // NORMALIZE LOGIN VALUE
        // --------------------------------------------------------

        const normalizedValue =
            String(loginValue)
                .toLowerCase()
                .trim();

        // --------------------------------------------------------
        // FIND USER
        // --------------------------------------------------------

        const user =
            await User.findOne({
                $or: [
                    {
                        email:
                            normalizedValue,
                    },

                    {
                        username:
                            normalizedValue,
                    },
                ],
            }).select("+password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid email/username or password",
            });
        }

        // --------------------------------------------------------
        // CHECK ACTIVE STATUS
        // --------------------------------------------------------

        if (user.isActive === false) {
            return res.status(403).json({
                success: false,
                message:
                    "This account has been deactivated",
            });
        }

        // --------------------------------------------------------
        // CHECK PASSWORD
        // --------------------------------------------------------

        const passwordMatch =
            await bcrypt.compare(
                String(password),
                user.password
            );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid email/username or password",
            });
        }

        // --------------------------------------------------------
        // GENERATE TOKEN
        // --------------------------------------------------------

        const token =
            generateToken(user._id);

        // --------------------------------------------------------
        // RESPONSE
        // --------------------------------------------------------

        return res.status(200).json({
            success: true,

            message:
                "Login successful",

            token,

            user: {
                id: user._id,

                fullName:
                    user.fullName || "",

                username:
                    user.username || "",

                email:
                    user.email || "",

                role:
                    user.role || "candidate",
            },
        });
    } catch (error) {
        console.error(
            "LOGIN ERROR:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                "Server error during login",

            error: error.message,
        });
    }
};

// ============================================================
// GET CURRENT USER
// GET /api/auth/me
// ============================================================

const getCurrentUser = async (req, res) => {
    try {
        const userId =
            req.user?.id ||
            req.user?.userId ||
            req.user?._id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message:
                    "Authentication required",
            });
        }

        const user =
            await User.findById(userId)
                .select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message:
                    "User not found",
            });
        }

        return res.status(200).json({
            success: true,

            user: {
                id: user._id,

                fullName:
                    user.fullName || "",

                username:
                    user.username || "",

                email:
                    user.email || "",

                role:
                    user.role || "candidate",
            },
        });
    } catch (error) {
        console.error(
            "GET CURRENT USER ERROR:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                "Unable to load user",
        });
    }
};

// ============================================================
// GET USER BY ID
// GET /api/auth/users/:id
// ============================================================

const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,

                message:
                    "User ID is required",
            });
        }

        const user =
            await User.findById(id)
                .select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,

                message:
                    "User not found",
            });
        }

        return res.status(200).json({
            success: true,

            user: {
                id: user._id,

                fullName:
                    user.fullName || "",

                username:
                    user.username || "",

                email:
                    user.email || "",

                role:
                    user.role || "candidate",

                isActive:
                    user.isActive,

                createdAt:
                    user.createdAt,

                updatedAt:
                    user.updatedAt,
            },
        });
    } catch (error) {
        console.error(
            "GET USER BY ID ERROR:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                "Unable to load user",
        });
    }
};

// ============================================================
// DELETE USER
// DELETE /api/auth/users/:id
// ============================================================

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,

                message:
                    "User ID is required",
            });
        }

        const user =
            await User.findById(id);

        if (!user) {
            return res.status(404).json({
                success: false,

                message:
                    "User not found",
            });
        }

        await User.findByIdAndDelete(id);

        console.log(
            `USER DELETED: ${id}`
        );

        return res.status(200).json({
            success: true,

            message:
                "User deleted successfully",

            deletedUserId: id,
        });
    } catch (error) {
        console.error(
            "DELETE USER ERROR:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                "Unable to delete user",

            error: error.message,
        });
    }
};

// ============================================================
// FORGOT PASSWORD
// POST /api/auth/forgot-password
// ============================================================

const forgotPassword = async (req, res) => {
    try {
        console.log(
            "=========================================="
        );

        console.log(
            "FORGOT PASSWORD REQUEST"
        );

        console.log(
            "BODY:",
            req.body
        );

        console.log(
            "=========================================="
        );

        // --------------------------------------------------------
        // GET EMAIL
        // --------------------------------------------------------

        const email = String(
            req.body?.email || ""
        )
            .toLowerCase()
            .trim();

        if (!email) {
            return res.status(400).json({
                success: false,

                message:
                    "Email address is required",
            });
        }

        // --------------------------------------------------------
        // FIND USER
        // --------------------------------------------------------

        const user =
            await User.findOne({
                email: email,
            });

        // --------------------------------------------------------
        // SECURITY
        //
        // Do not reveal whether the email exists.
        // --------------------------------------------------------

        if (!user) {
            return res.status(200).json({
                success: true,

                message:
                    "If an account exists with this email, a password reset link has been sent.",
            });
        }

        // --------------------------------------------------------
        // CREATE RESET TOKEN
        // --------------------------------------------------------

        const resetToken =
            crypto
                .randomBytes(32)
                .toString("hex");

        // --------------------------------------------------------
        // HASH TOKEN
        // --------------------------------------------------------

        const hashedResetToken =
            crypto
                .createHash("sha256")
                .update(resetToken)
                .digest("hex");

        // --------------------------------------------------------
        // EXPIRATION
        //
        // 15 minutes
        // --------------------------------------------------------

        const resetTokenExpires =
            new Date(
                Date.now() +
                15 * 60 * 1000
            );

        console.log(
            "RESET TOKEN CREATED FOR:",
            user.email
        );

        // ========================================================
        // IMPORTANT FIX
        // ========================================================
        //
        // DO NOT use:
        //
        // user.resetPasswordToken = ...
        // user.resetPasswordExpires = ...
        // await user.save();
        //
        // because old users may not contain required fields such
        // as username.
        //
        // findOneAndUpdate changes only the required fields and
        // avoids validating the entire legacy user document.
        // ========================================================

        const updatedUser =
            await User.findByIdAndUpdate(
                user._id,

                {
                    $set: {
                        resetPasswordToken:
                            hashedResetToken,

                        resetPasswordExpires:
                            resetTokenExpires,
                    },
                },

                {
                    new: true,
                    runValidators: false,
                }
            );

        if (!updatedUser) {
            console.error(
                "FAILED TO UPDATE RESET TOKEN"
            );

            return res.status(500).json({
                success: false,

                message:
                    "Unable to create password reset request",
            });
        }

        // --------------------------------------------------------
        // FRONTEND URL
        // --------------------------------------------------------

        const frontendURL =
            process.env.FRONTEND_URL ||
            "http://localhost:5173";

        // --------------------------------------------------------
        // RESET URL
        // --------------------------------------------------------

        const resetURL =
            `${frontendURL}/reset-password?token=${resetToken}`;

        console.log(
            "PASSWORD RESET URL:",
            resetURL
        );

        // --------------------------------------------------------
        // EMAIL TRANSPORTER
        // --------------------------------------------------------

        const transporter =
            createEmailTransporter();

        // ========================================================
        // EMAIL MODE
        // ========================================================

        if (transporter) {
            try {
                await transporter.sendMail({
                    from:
                        process.env.EMAIL_FROM ||
                        process.env.EMAIL_USER,

                    to: user.email,

                    subject:
                        "TalentIQ - Password Reset",

                    text:
                        `Hello ${user.fullName || "User"},\n\n` +

                        `We received a request to reset your TalentIQ password.\n\n` +

                        `Reset your password using the link below:\n\n` +

                        `${resetURL}\n\n` +

                        `This link expires in 15 minutes.\n\n` +

                        `If you did not request this password reset, you can safely ignore this email.\n\n` +

                        `TalentIQ Team`,

                    html: `
                        <!DOCTYPE html>

                        <html>

                        <head>

                            <meta charset="UTF-8">

                            <title>
                                TalentIQ Password Reset
                            </title>

                        </head>

                        <body style="
                            margin:0;
                            padding:0;
                            background:#f5f7fb;
                            font-family:Arial,Helvetica,sans-serif;
                        ">

                            <div style="
                                max-width:600px;
                                margin:40px auto;
                                background:#ffffff;
                                border-radius:16px;
                                padding:40px;
                                box-sizing:border-box;
                                box-shadow:0 10px 30px rgba(0,0,0,0.08);
                            ">

                                <div style="
                                    text-align:center;
                                    margin-bottom:30px;
                                ">

                                    <h2 style="
                                        margin:0;
                                        color:#2864e8;
                                        font-size:28px;
                                    ">
                                        TalentIQ
                                    </h2>

                                    <p style="
                                        margin-top:8px;
                                        color:#667085;
                                    ">
                                        AI-Powered Recruitment Portal
                                    </p>

                                </div>

                                <h1 style="
                                    color:#101828;
                                    font-size:28px;
                                    margin-bottom:20px;
                                ">
                                    Reset your password
                                </h1>

                                <p style="
                                    color:#475467;
                                    font-size:16px;
                                    line-height:1.6;
                                ">
                                    Hello ${user.fullName || "User"},
                                </p>

                                <p style="
                                    color:#475467;
                                    font-size:16px;
                                    line-height:1.6;
                                ">
                                    We received a request to reset
                                    your TalentIQ account password.
                                </p>

                                <div style="
                                    text-align:center;
                                    margin:35px 0;
                                ">

                                    <a
                                        href="${resetURL}"
                                        style="
                                            display:inline-block;
                                            padding:15px 28px;
                                            background:#2864e8;
                                            color:#ffffff;
                                            text-decoration:none;
                                            border-radius:10px;
                                            font-size:16px;
                                            font-weight:bold;
                                        "
                                    >
                                        Reset Password
                                    </a>

                                </div>

                                <p style="
                                    color:#667085;
                                    font-size:14px;
                                    line-height:1.6;
                                ">
                                    This password reset link will expire
                                    in 15 minutes.
                                </p>

                                <p style="
                                    color:#667085;
                                    font-size:14px;
                                    line-height:1.6;
                                ">
                                    If you did not request a password
                                    reset, you can safely ignore this email.
                                </p>

                                <hr style="
                                    border:none;
                                    border-top:1px solid #eaecf0;
                                    margin:30px 0;
                                ">

                                <p style="
                                    color:#98a2b3;
                                    font-size:13px;
                                    text-align:center;
                                ">
                                    TalentIQ Team
                                </p>

                            </div>

                        </body>

                        </html>
                    `,
                });

                console.log(
                    "PASSWORD RESET EMAIL SENT TO:",
                    user.email
                );

                return res.status(200).json({
                    success: true,

                    message:
                        "Password reset link has been sent to your registered email address.",
                });
            } catch (emailError) {
                console.error(
                    "PASSWORD RESET EMAIL ERROR:",
                    emailError
                );

                return res.status(500).json({
                    success: false,

                    message:
                        "Unable to send password reset email. Please try again later.",
                });
            }
        }

        // ========================================================
        // DEVELOPMENT MODE
        // ========================================================

        if (
            String(process.env.NODE_ENV)
                .toLowerCase() !==
            "production"
        ) {
            console.log(
                "=========================================="
            );

            console.log(
                "PASSWORD RESET DEVELOPMENT MODE"
            );

            console.log(
                "EMAIL:",
                user.email
            );

            console.log(
                "RESET URL:",
                resetURL
            );

            console.log(
                "=========================================="
            );

            return res.status(200).json({
                success: true,

                message:
                    "Password reset request created successfully.",

                development: true,

                resetToken,

                resetUrl: resetURL,
            });
        }

        // ========================================================
        // PRODUCTION WITHOUT EMAIL CONFIG
        // ========================================================

        return res.status(500).json({
            success: false,

            message:
                "Password reset email service is not configured.",
        });
    } catch (error) {
        console.error(
            "FORGOT PASSWORD ERROR:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                "Unable to process password reset request",

            error:
                process.env.NODE_ENV !== "production"
                    ? error.message
                    : undefined,
        });
    }
};

// ============================================================
// RESET PASSWORD
// POST /api/auth/reset-password
// ============================================================

const resetPassword = async (req, res) => {
    try {
        console.log(
            "=========================================="
        );

        console.log(
            "RESET PASSWORD REQUEST"
        );

        console.log(
            "=========================================="
        );

        const {
            token,
            password,
            newPassword,
        } = req.body;

        // --------------------------------------------------------
        // ACCEPT BOTH
        //
        // password
        // newPassword
        // --------------------------------------------------------

        const finalPassword =
            newPassword || password;

        // --------------------------------------------------------
        // VALIDATE TOKEN
        // --------------------------------------------------------

        if (!token) {
            return res.status(400).json({
                success: false,

                message:
                    "Password reset token is required",
            });
        }

        // --------------------------------------------------------
        // VALIDATE PASSWORD
        // --------------------------------------------------------

        if (!finalPassword) {
            return res.status(400).json({
                success: false,

                message:
                    "New password is required",
            });
        }

        if (
            String(finalPassword).length < 6
        ) {
            return res.status(400).json({
                success: false,

                message:
                    "Password must contain at least 6 characters",
            });
        }

        // --------------------------------------------------------
        // HASH RESET TOKEN
        // --------------------------------------------------------

        const hashedToken =
            crypto
                .createHash("sha256")
                .update(String(token))
                .digest("hex");

        // --------------------------------------------------------
        // FIND USER WITH VALID TOKEN
        // --------------------------------------------------------

        const user =
            await User.findOne({
                resetPasswordToken:
                    hashedToken,

                resetPasswordExpires: {
                    $gt: new Date(),
                },
            });

        if (!user) {
            return res.status(400).json({
                success: false,

                message:
                    "Password reset link is invalid or expired",
            });
        }

        // --------------------------------------------------------
        // HASH NEW PASSWORD
        // --------------------------------------------------------

        const hashedPassword =
            await bcrypt.hash(
                String(finalPassword),
                10
            );

        // ========================================================
        // IMPORTANT FIX
        // ========================================================
        //
        // Do NOT use user.save() here either.
        //
        // Legacy users may not have username.
        //
        // Use findByIdAndUpdate() instead.
        // ========================================================

        const updatedUser =
            await User.findByIdAndUpdate(
                user._id,

                {
                    $set: {
                        password:
                            hashedPassword,
                    },

                    $unset: {
                        resetPasswordToken: 1,

                        resetPasswordExpires: 1,
                    },
                },

                {
                    new: true,

                    runValidators: false,
                }
            );

        if (!updatedUser) {
            return res.status(500).json({
                success: false,

                message:
                    "Unable to update password",
            });
        }

        console.log(
            "PASSWORD RESET SUCCESSFUL FOR:",
            user.email
        );

        // --------------------------------------------------------
        // RESPONSE
        // --------------------------------------------------------

        return res.status(200).json({
            success: true,

            message:
                "Password reset successfully. You can now sign in with your new password.",
        });
    } catch (error) {
        console.error(
            "RESET PASSWORD ERROR:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                "Unable to reset password",

            error:
                process.env.NODE_ENV !== "production"
                    ? error.message
                    : undefined,
        });
    }
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
    registerUser,

    loginUser,

    getCurrentUser,

    getUserById,

    deleteUser,

    forgotPassword,

    resetPassword,
};