import express from "express";
import {
    requestDeadlineExtension,
    voteOnGovernance
} from "../controllers/governanceController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/deadline-request", protect, requestDeadlineExtension);
router.post("/deadline-vote", protect, voteOnGovernance);

export default router;
