import dotenv from "dotenv";

dotenv.config();

export const config = {
    port: process.env.PORT || 5000,
    mongoUri: process.env.MONGO_URI,
    env: process.env.NODE_ENV || "development",
    jwtSecret: process.env.JWT_SECRET || "default_development_secret", // CHANGE IN PROD
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
};
