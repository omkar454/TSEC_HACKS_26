import mongoose from "mongoose";

const governanceRequestSchema = new mongoose.Schema(
    {
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true,
        },
        creatorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        requestType: {
            type: String,
            enum: ["DEADLINE_EXTENSION"],
            default: "DEADLINE_EXTENSION",
        },
        details: {
            extensionDays: { type: Number, required: true },
            reason: { type: String, required: true },
        },
        votes: [
            {
                voterId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                vote: { type: String, enum: ["YES", "NO"] },
                weight: { type: Number }, // Based on contribution percentage
            }
        ],
        status: {
            type: String,
            enum: ["PENDING", "APPROVED", "REJECTED"],
            default: "PENDING",
        },
        expiresAt: {
            type: Date, // Voting window
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const GovernanceRequest = mongoose.model("GovernanceRequest", governanceRequestSchema);
export default GovernanceRequest;
