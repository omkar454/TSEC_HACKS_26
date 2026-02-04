import asyncHandler from "express-async-handler";
import * as adminService from "../services/adminService.js";

// @desc    Freeze/Unfreeze Wallet
// @route   PATCH /api/admin/projects/:id/freeze
// @access  Admin only
export const toggleFreeze = asyncHandler(async (req, res) => {
    const { freeze, reason } = req.body; // freeze: true/false
    if (typeof freeze !== "boolean") {
        res.status(400);
        throw new Error("Freeze status must be boolean");
    }
    const result = await adminService.toggleProjectWalletFreezeService(req.user, req.params.id, freeze, reason);
    res.json(result);
});

// @desc    Get Governance Timeline
// @route   GET /api/admin/projects/:id/governance
// @access  Admin / Auditor (Public Read-Only also acceptable for transparency?)
//          Let's restrict to Admin for now, maybe expose specific parts later.
export const getGovernanceTimeline = asyncHandler(async (req, res) => {
    const timeline = await adminService.getGovernanceTimelineService(req.params.id);
    res.json(timeline);
});

// @desc    Get Risk Report
// @route   GET /api/admin/risks
// @access  Admin
export const getRiskReport = asyncHandler(async (req, res) => {
    const report = await adminService.getRiskReportService();
    res.json(report);
});
