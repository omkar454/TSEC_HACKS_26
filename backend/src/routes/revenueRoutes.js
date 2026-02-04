import express from "express";
import {
    submitRevenue,
    distributeRevenue,
    getProjectRevenue
} from "../controllers/revenueController.js";
import { protect, creator } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, creator, submitRevenue);

router.post("/:id/distribute", protect, creator, distributeRevenue);

router.get("/project/:projectId", getProjectRevenue);

export default router;
