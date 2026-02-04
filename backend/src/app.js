import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { config } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import financeRoutes from "./routes/financeRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import revenueRoutes from "./routes/revenueRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

import walletRoutes from "./routes/walletRoutes.js";

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());

if (config.env === "development") {
  app.use(morgan("dev"));
}

// Routes
app.get("/", (req, res) => {
  res.send("Lazarus API is running 🚀");
});
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date() });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/revenue", revenueRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/wallet", walletRoutes);
import receiptRoutes from "./routes/receiptRoutes.js";
import governanceRoutes from "./routes/governanceRoutes.js";
import milestoneRoutes from "./routes/milestoneRoutes.js";

app.use("/api/receipts", receiptRoutes);
app.use("/api/governance", governanceRoutes);
app.use("/api/milestones", milestoneRoutes);


// Error Handling (Must be last)
app.use(notFound);
app.use(errorHandler);

export default app;

