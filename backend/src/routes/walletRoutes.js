import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
    createWallet,
    getMyWallet,
    addFunds,
    withdrawFunds
} from "../controllers/walletController.js";

const router = express.Router();

// All routes here are protected
router.use(protect);

router.post("/create", createWallet); // /api/wallet/create
router.get("/", getMyWallet);         // /api/wallet
router.post("/add-funds", addFunds);  // /api/wallet/add-funds
router.post("/withdraw", withdrawFunds); // /api/wallet/withdraw

export default router;
