import asyncHandler from "express-async-handler";
import * as walletService from "../services/walletService.js";

// @desc    Create a wallet
// @route   POST /api/wallet/create
// @access  Private
export const createWallet = asyncHandler(async (req, res) => {
    const wallet = await walletService.createWalletService(req.user._id);
    res.status(201).json(wallet);
});

// @desc    Get my wallet
// @route   GET /api/wallet
// @access  Private
export const getMyWallet = asyncHandler(async (req, res) => {
    const wallet = await walletService.getWalletService(req.user._id);
    if (!wallet) {
        res.status(404);
        throw new Error("Wallet not found. Please create one.");
    }
    res.json(wallet);
});

// @desc    Add funds
// @route   POST /api/wallet/add-funds
// @access  Private
export const addFunds = asyncHandler(async (req, res) => {
    const { amount } = req.body;
    const wallet = await walletService.addFundsService(req.user._id, amount);
    res.json(wallet);
});

// @desc    Withdraw funds
// @route   POST /api/wallet/withdraw
// @access  Private
export const withdrawFunds = asyncHandler(async (req, res) => {
    const { amount } = req.body;
    const wallet = await walletService.withdrawFundsService(req.user._id, amount);
    res.json(wallet);
});
