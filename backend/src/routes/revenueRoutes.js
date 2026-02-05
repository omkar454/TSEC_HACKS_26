import express from "express";
import multer from "multer";
import { storage } from "../config/cloudinary.js";
import {
    submitRevenue,
    distributeRevenue,
    getProjectRevenue,
    approveRevenue,
    rejectRevenue,
    getAllPendingRevenue
} from "../controllers/revenueController.js";
import { protect, creator, admin } from "../middleware/authMiddleware.js";

const router = express.Router();
const upload = multer({ storage });

router.post("/", protect, creator, upload.array("proofs", 5), submitRevenue);

router.post("/:id/approve", protect, admin, approveRevenue);
router.post("/:id/reject", protect, admin, rejectRevenue);
router.post("/:id/distribute", protect, admin, distributeRevenue);
router.get("/pending", protect, admin, getAllPendingRevenue);

router.get("/project/:projectId", getProjectRevenue);

export default router;
