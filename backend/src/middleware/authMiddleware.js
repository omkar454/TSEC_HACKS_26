import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { config } from "../config/env.js";

// Protect routes
export const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        try {
            token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, config.jwtSecret);

            req.user = await User.findById(decoded.id).select("-password");
            next();
        } catch (error) {
            console.error(error);
            res.status(401);
            throw new Error("Not authorized, token failed");
        }
    }

    if (!token) {
        res.status(401);
        throw new Error("Not authorized, no token");
    }
};

// Admin only
export const admin = (req, res, next) => {
    if (req.user && req.user.role === "ADMIN") {
        next();
    } else {
        res.status(401);
        throw new Error("Not authorized as an admin");
    }
};

// Creator only
export const creator = (req, res, next) => {
    if (req.user && (req.user.role === "CREATOR" || req.user.role === "ADMIN")) {
        next();
    } else {
        res.status(401);
        throw new Error("Not authorized as a creator");
    }
};
