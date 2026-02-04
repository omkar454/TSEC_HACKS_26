import express from "express";
import multer from "multer";
import { storage } from "../config/cloudinary.js";
import {
    submitMilestone,
    voteOnMilestone,
    uploadProofMedia
} from "../controllers/milestoneController.js";
import { protect, creator } from "../middleware/authMiddleware.js";

const router = express.Router();
const upload = multer({ storage });

// Proof submission (Text/Link/JSON)
router.post("/:projectId/:milestoneId/submit", protect, creator, submitMilestone);

// Multimedia upload
router.post("/upload", protect, creator, upload.array("media", 5), uploadProofMedia);

// Voting
router.post("/:projectId/:milestoneId/vote", protect, voteOnMilestone);

export default router;
