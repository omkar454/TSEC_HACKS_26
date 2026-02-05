import mongoose from "mongoose";

const revenueSchema = new mongoose.Schema(
    {
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true,
        },
        source: {
            type: String, // e.g. "YOUTUBE_ADS", "SPOTIFY_STREAM"
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        period: {
            startDate: Date,
            endDate: Date,
        },
        explanation: {
            type: String,
        },
        proofUrls: [
            {
                type: String,
            },
        ],
        status: {
            type: String,
            enum: ["PENDING_APPROVAL", "APPROVED", "REJECTED", "DISTRIBUTED"],
            default: "PENDING_APPROVAL",
        },
        distributionDate: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

const Revenue = mongoose.model("Revenue", revenueSchema);
export default Revenue;