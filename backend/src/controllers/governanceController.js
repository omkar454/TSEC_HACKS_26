import asyncHandler from "express-async-handler";
import * as governanceService from "../services/governanceService.js";

// @desc    Request deadline extension
// @route   POST /api/governance/deadline-request
// @access  Creator
export const requestDeadlineExtension = asyncHandler(async (req, res) => {
    const { projectId, extensionDays, reason } = req.body;
    const request = await governanceService.requestDeadlineExtensionService(
        req.user,
        projectId,
        extensionDays,
        reason
    );
    res.status(201).json(request);
});

// @desc    Vote on governance request
// @route   POST /api/governance/deadline-vote
// @access  Contributor
export const voteOnGovernance = asyncHandler(async (req, res) => {
    const { requestId, vote } = req.body;
    const result = await governanceService.voteOnGovernanceService(
        req.user,
        requestId,
        vote
    );
    res.json(result);
});

// @desc    Get all governance requests for a project
// @route   GET /api/governance/project/:projectId
// @access  Public
export const getProjectGovernanceRequests = asyncHandler(async (req, res) => {
    const requests = await governanceService.getProjectGovernanceRequestsService(req.params.projectId);
    res.json(requests);
});
