import asyncHandler from "express-async-handler";
import * as revenueService from "../services/revenueService.js";

// @desc    Submit Revenue (Ingest)
// @route   POST /api/revenue
// @access  Creator
export const submitRevenue = asyncHandler(async (req, res) => {
    const { projectId, ...data } = req.body;
    const revenue = await revenueService.extractRevenueService(req.user, projectId, data);
    res.status(201).json(revenue);
});

// @desc    Distribute Revenue (Settlement)
// @route   POST /api/revenue/:id/distribute
// @access  Admin/Creator
// @desc    Distribute Revenue (Settlement)
// @route   POST /api/revenue/:id/distribute
// @access  Admin/Creator
export const distributeRevenue = async (req, res, next) => {
    try {
        console.log("Distributing revenue for ID:", req.params.id);
        const result = await revenueService.distributeRevenueService(req.user, req.params.id);
        res.json(result);
    } catch (error) {
        console.error("Distribution Error:", error);
        if (typeof next === 'function') {
            next(error);
        } else {
            console.error("CRITICAL: next is not a function inside distributeRevenue controller");
            res.status(500).json({ message: "Internal Server Error: Middleware failure" });
        }
    }
};


// @desc    Get Project Revenue
// @route   GET /api/revenue/project/:projectId
// @access  Public/Private
export const getProjectRevenue = asyncHandler(async (req, res) => {
    const list = await revenueService.getProjectRevenueService(req.user, req.params.projectId);
    res.json(list);
});
