import asyncHandler from "express-async-handler";
import * as milestoneService from "../services/milestoneService.js";

// @desc    Submit milestone proof
// @route   POST /api/milestones/:projectId/:milestoneId/submit
// @access  Creator
export const submitMilestone = asyncHandler(async (req, res) => {
    const { textProof, mediaUrls, finalLink } = req.body;
    const project = await milestoneService.submitMilestoneProofService(
        req.user,
        req.params.projectId,
        req.params.milestoneId,
        { textProof, mediaUrls, finalLink }
    );
    res.json(project);
});

// @desc    Vote on milestone proof
// @route   POST /api/milestones/:projectId/:milestoneId/vote
// @access  Contributor
export const voteOnMilestone = asyncHandler(async (req, res) => {
    const { vote } = req.body;
    const result = await milestoneService.voteOnMilestoneService(
        req.user,
        req.params.projectId,
        req.params.milestoneId,
        vote
    );
    res.json(result);
});

// @desc    Upload multimedia proof (Images/Videos)
// @route   POST /api/milestones/upload
// @access  Creator
export const uploadProofMedia = asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
        res.status(400);
        throw new Error("No files uploaded");
    }

    const urls = req.files.map(file => file.path); // Cloudinary return path in file.path
    res.json({ urls });
});
