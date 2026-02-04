import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
    {
        creatorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            enum: ["FILM", "DOCUMENTARY", "PODCAST", "MUSIC", "OTHER"],
            default: "OTHER",
        },
        fundingGoal: {
            type: Number,
            required: true,
            min: 1,
        },
        currentFunding: {
            type: Number,
            default: 0,
        },
        walletId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Wallet", // Each project has a unique wallet
        },
        status: {
            type: String,
            enum: ["DRAFT", "ACTIVE", "FUNDED", "IN_PRODUCTION", "COMPLETED", "CANCELLED"],
            default: "DRAFT",
        },
        // Rules for fund release (simplified for MVP)
        fundUsageRules: [
            {
                category: String, // e.g. "Production", "Marketing"
                maxAmount: Number,
                requiresReceipt: { type: Boolean, default: true },
            },
        ],
        publishedContentUrl: {
            type: String, // Link to final content (YouTube, Spotify)
        },
    },
    {
        timestamps: true,
    }
);

const Project = mongoose.model("Project", projectSchema);
export default Project;
