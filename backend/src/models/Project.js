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
        imageUrl: {
            type: String,
            required: true,
            default: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&q=80&w=800",
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
        creatorStake: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
            max: 100,
        },
        currentFunding: {
            type: Number,
            default: 0,
        },
        walletId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Wallet", // Each project has a unique wallet
        },
        deadline: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            enum: ["DRAFT", "ACTIVE", "FUNDED", "CANCELLED", "FROZEN", "COMPLETED"],
            default: "DRAFT",
        },
        // Tiered Funding Progress
        tiers: {
            seedMet: { type: Boolean, default: false }, // 30%
            productionMet: { type: Boolean, default: false }, // 70%
            successMet: { type: Boolean, default: false }, // 100%
        },
        // Milestone tracking for tranche releases
        milestones: [
            {
                title: String,
                description: String,
                milestoneType: {
                    type: String,
                    enum: ["KICKOFF", "PRODUCTION", "FINAL_DELIVERY", "RELEASE"],
                    default: "PRODUCTION"
                },
                textProof: String,
                mediaUrls: [String],
                finalLink: String,
                status: {
                    type: String,
                    enum: ["PENDING", "SUBMITTED", "APPROVED", "REJECTED"],
                    default: "PENDING"
                },
                tranchePercent: Number,
                voteStats: {
                    yesWeight: { type: Number, default: 0 },
                    noWeight: { type: Number, default: 0 }
                },
                votes: [
                    {
                        voterId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                        vote: { type: String, enum: ["YES", "NO"] },
                        weight: { type: Number }
                    }
                ],
            }
        ],
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
