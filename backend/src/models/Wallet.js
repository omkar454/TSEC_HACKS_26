import mongoose from "mongoose";

const walletSchema = new mongoose.Schema(
    {
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            // Can be a User or a Project
        },
        ownerModel: {
            type: String,
            required: true,
            enum: ["User", "Project"],
        },
        currency: {
            type: String,
            default: "INR", // Default to INR
        },
        balance: {
            type: Number,
            required: true,
            default: 0,
            min: 0, // Prevent negative balances at the DB level
        },
        isFrozen: {
            type: Boolean,
            default: false, // For safety/governance
        },
    },
    {
        timestamps: true,
    }
);

const Wallet = mongoose.model("Wallet", walletSchema);
export default Wallet;
