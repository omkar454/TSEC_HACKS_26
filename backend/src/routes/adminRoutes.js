import express from "express";
import { toggleFreeze, getGovernanceTimeline, getRiskReport } from "../controllers/adminController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, admin); // All routes require Admin

router.patch("/projects/:id/freeze", toggleFreeze);
router.get("/projects/:id/governance", getGovernanceTimeline);
router.get("/risks", getRiskReport);

export default router;
