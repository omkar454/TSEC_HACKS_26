import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ["CREATOR", "CONTRIBUTOR", "ADMIN"],
            default: "CONTRIBUTOR",
        },
        isVerified: {
            type: Boolean,
            default: false, // For future Email/KYC verification
        },
        walletId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Wallet", // Reference to their programmable wallet
        },
    },
    {
        timestamps: true,
    }
);

// Encrypt password before saving
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
