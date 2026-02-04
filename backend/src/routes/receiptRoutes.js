import express from "express";
import multer from "multer";
import { analyzeReceipt } from "../controllers/receiptController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Configure Multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Analyze receipt route
// Using 'protect' middleware if authentication is required (assuming creators upload receipts)
router.post("/analyze", protect, upload.single("file"), analyzeReceipt);

export default router;
