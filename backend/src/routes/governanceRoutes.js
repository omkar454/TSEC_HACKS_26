import express from "express";
import {
    requestDeadlineExtension,
    voteOnGovernance,
    getProjectGovernanceRequests
} from "../controllers/governanceController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/deadline-request", protect, requestDeadlineExtension);
router.post("/deadline-vote", protect, voteOnGovernance);
router.get("/project/:projectId", getProjectGovernanceRequests);

export default router;
