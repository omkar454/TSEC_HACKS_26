import User from "../models/User.js";
import Wallet from "../models/Wallet.js";
import Project from "../models/Project.js";

/**
 * Create a new wallet for the user.
 * Ensures strict 1:1 relationship.
 */
export const createWalletService = async (userId) => {
    // 1. Check if user exists
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    // 2. Check if wallet already exists (idempotency)
    if (user.walletId) {
        const existing = await Wallet.findById(user.walletId);
        if (existing) return existing;
    }

    // 3. Create Wallet
    const wallet = await Wallet.create({
        ownerId: user._id,
        ownerModel: "User",
        balance: 0,
        currency: "INR"
    });

    // 4. Link to User (Direct Update to bypass hooks)
    await User.findByIdAndUpdate(userId, { walletId: wallet._id });

    return wallet;
};

/**
 * Get user's wallet.
 */
export const getWalletService = async (userId) => {
    const user = await User.findById(userId);
    if (!user || !user.walletId) return null; // Or throw custom error "No wallet linked"

    return await Wallet.findById(user.walletId);
};

/**
 * Add funds (Simulation).
 */
export const addFundsService = async (userId, amount) => {
    if (amount <= 0) throw new Error("Amount must comprise positive value");

    const user = await User.findById(userId);
    if (!user || !user.walletId) throw new Error("Wallet not linked");

    const wallet = await Wallet.findById(user.walletId);
    if (!wallet) throw new Error("Wallet not found");

    wallet.balance += Number(amount);
    await wallet.save();
    return wallet;
};

/**
 * Withdraw funds (Simulation).
 */
export const withdrawFundsService = async (userId, amount) => {
    if (amount <= 0) throw new Error("Amount must be positive");

    const user = await User.findById(userId);
    if (!user || !user.walletId) throw new Error("Wallet not linked");

    const wallet = await Wallet.findById(user.walletId);
    if (!wallet) throw new Error("Wallet not found");

    if (wallet.balance < amount) throw new Error("Insufficient funds");

    wallet.balance -= Number(amount);
    await wallet.save();
    return wallet;
};

/**
 * Get project wallet (Public Transparency).
 */
export const getProjectWalletService = async (projectId) => {
    const wallet = await Wallet.findOne({ ownerId: projectId, ownerModel: "Project" });
    if (!wallet) throw new Error("Project wallet not found");
    return wallet;
};

/**
 * Get Creator's wallet for a project (Public Transparency).
 */
export const getCreatorWalletByProjectIdService = async (projectId) => {
    const project = await Project.findById(projectId);
    if (!project) throw new Error("Project not found");

    const creator = await User.findById(project.creatorId);
    if (!creator || !creator.walletId) throw new Error("Creator wallet not found");

    return await Wallet.findById(creator.walletId);
};
