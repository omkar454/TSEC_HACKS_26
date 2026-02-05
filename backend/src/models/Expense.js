import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
    {
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        category: {
            type: String,
            enum: ["EQUIPMENT", "TRAVEL", "PRODUCTION", "MARKETING", "MISCELLANEOUS"],
            required: true,
        },
        description: {
            type: String,
        },
        receiptUrl: {
            type: String, // URL to uploaded receipt image
        },
        status: {
            type: String,
            enum: ["PENDING", "APPROVED", "REJECTED", "PAID"],
            default: "PENDING",
        },
        submittedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", // Admin or Auditor who approved it
        },
    },
    {
        timestamps: true,
    }
);

const Expense = mongoose.model("Expense", expenseSchema);
export default Expense;
