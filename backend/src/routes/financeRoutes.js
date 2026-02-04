import express from "express";
import {
    getMyContributions,
    releaseTranche,
    contributeToProject,
    getProjectFundSummary,
    getProjectContributions
} from "../controllers/financeController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public Routes
router.get("/projects/:projectId/summary", getProjectFundSummary);
router.get("/projects/:projectId/contributions", getProjectContributions);

// Private Routes
router.post("/contribute", protect, contributeToProject);
router.get("/my-contributions", protect, getMyContributions);
router.post("/projects/:projectId/milestones/:milestoneId/release", protect, releaseTranche);

export default router;
