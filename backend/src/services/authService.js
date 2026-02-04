import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { config } from "../config/env.js";

const generateToken = (id) => {
    return jwt.sign({ id }, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn,
    });
};

export const registerUserService = async (name, email, password, role) => {
    const userExists = await User.findOne({ email });

    if (userExists) {
        throw new Error("User already exists");
    }

    // Create user
    // Note: Wallet creation would ideally happen here or be triggered by an event
    const user = await User.create({
        name,
        email,
        password,
        role,
    });

    if (user) {
        return {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            walletId: user.walletId,
            token: generateToken(user._id),
        };
    } else {
        throw new Error("Invalid user data");
    }
};

export const loginUserService = async (email, password) => {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        return {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            walletId: user.walletId,
            token: generateToken(user._id),
        };
    } else {
        throw new Error("Invalid email or password");
    }
};
