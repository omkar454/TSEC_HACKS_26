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
        status: {
            type: String,
            enum: ["RECEIVED", "DISTRIBUTED"], // Has it been split yet?
            default: "RECEIVED",
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