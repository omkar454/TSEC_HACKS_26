import mongoose from "mongoose";

const contributionSchema = new mongoose.Schema(
    {
        contributorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        transactionHash: {
            type: String, // Mock or Real payment gateway reference
        },
        status: {
            type: String,
            enum: ["PENDING", "COMPLETED", "FAILED", "REFUNDED"],
            default: "PENDING",
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for quick lookups of a user's contributions to a project
contributionSchema.index({ contributorId: 1, projectId: 1 });

const Contribution = mongoose.model("Contribution", contributionSchema);
export default Contribution;
