import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
    {
        action: {
            type: String, // e.g., "FUND_PROJECT", "CREATE_PROJECT", "RELEASE_FUNDS"
            required: true,
            uppercase: true,
        },
        actorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", // Who performed the action
            required: true,
        },
        resourceId: {
            type: mongoose.Schema.Types.ObjectId, // Affected entity (Project ID, Wallet ID)
            required: true,
        },
        resourceModel: {
            type: String, // "Project", "Wallet", "User"
            required: true,
        },
        details: {
            type: mongoose.Schema.Types.Mixed, // JSON snapshot of changes or metadata
        },
        ipAddress: {
            type: String,
        },
        status: {
            type: String,
            enum: ["SUCCESS", "FAILURE"],
            default: "SUCCESS",
        },
    },
    {
        timestamps: true, // createdAt serves as the timestamp
    }
);

// Prevent updates to audit logs - they must be immutable
auditLogSchema.pre("findOneAndUpdate", function (next) {
    next(new Error("Audit logs are immutable!"));
});

auditLogSchema.pre("updateOne", function (next) {
    next(new Error("Audit logs are immutable!"));
});

const AuditLog = mongoose.model("AuditLog", auditLogSchema);
export default AuditLog;
