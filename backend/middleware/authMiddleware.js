const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET =
    process.env.JWT_SECRET || "talentiq_secret_key";

const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        if (!authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Invalid authorization format",
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            JWT_SECRET
        );

        const userId =
            decoded.id ||
            decoded.userId ||
            decoded._id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication token",
            });
        }

        const user = await User.findById(userId)
            .select("-password");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found",
            });
        }

        if (user.isActive === false) {
            return res.status(403).json({
                success: false,
                message: "Your account has been deactivated",
            });
        }

        req.user = user;

        next();

    } catch (error) {
        console.error("AUTH ERROR:", error);

        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Authentication token has expired",
            });
        }

        return res.status(401).json({
            success: false,
            message: "Invalid authentication token",
        });
    }
};

const authorize = (...allowedRoles) => {
    return (req, res, next) => {

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        const userRole =
            String(req.user.role || "")
                .toLowerCase()
                .trim();

        const roles =
            allowedRoles.map((role) =>
                String(role)
                    .toLowerCase()
                    .trim()
            );

        if (!roles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to access this resource",
            });
        }

        next();
    };
};

module.exports = {
    protect,
    authorize,
};