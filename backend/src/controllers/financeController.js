import asyncHandler from "express-async-handler";
import * as financeService from "../services/financeService.js";

// @desc    Contribute to a project
// @route   POST /api/finance/contribute
// @access  Contributor / Creator
export const contributeToProject = asyncHandler(async (req, res) => {
    const { projectId, amount, currency } = req.body;

    const contribution = await financeService.contributeToProjectService(
        req.user,
        projectId,
        Number(amount),
        currency
    );

    res.status(201).json(contribution);
});

// @desc    Get project fund summary
// @route   GET /api/finance/projects/:projectId/summary
// @access  Public
export const getProjectFundSummary = asyncHandler(async (req, res) => {
    const summary = await financeService.getProjectFundSummaryService(req.params.projectId);
    res.json(summary);
});

// @desc    Get public contributions list for a project
// @route   GET /api/finance/projects/:projectId/contributions
// @access  Public
export const getProjectContributions = asyncHandler(async (req, res) => {
    const list = await financeService.getProjectContributionsService(req.params.projectId);
    res.json(list);
});

// @desc    Get my contributions
// @route   GET /api/finance/my-contributions
// @access  Private
export const getMyContributions = asyncHandler(async (req, res) => {
    const list = await financeService.getUserContributionsService(req.user._id);
    res.json(list);
});
