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
export const distributeRevenue = asyncHandler(async (req, res) => {
    const result = await revenueService.distributeRevenueService(req.user, req.params.id);
    res.json(result);
});

// @desc    Get Project Revenue
// @route   GET /api/revenue/project/:projectId
// @access  Public/Private
export const getProjectRevenue = asyncHandler(async (req, res) => {
    const list = await revenueService.getProjectRevenueService(req.user, req.params.projectId);
    res.json(list);
});
