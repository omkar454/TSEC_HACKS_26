import Project from "../models/Project.js";
import { refundProjectService } from "../services/financeService.js";
import AuditLog from "../models/AuditLog.js";

/**
 * Trust Worker
 * Runs periodically to enforce project deadlines and tiered funding rules.
 */
export const startTrustWorker = () => {
    console.log("🛠️ Trust Worker initialized. Monitoring and enforcing platform integrity...");

    // Run every 2 minutes for high-responsiveness in this environment
    setInterval(async () => {
        try {
            const now = new Date();

            // 1. Find ACTIVE projects past their deadline
            const expiredProjects = await Project.find({
                status: "ACTIVE",
                deadline: { $lt: now }
            });

            for (const project of expiredProjects) {
                const fundingPercent = (project.currentFunding / project.fundingGoal) * 100;

                // RULE: If Seed Tier (30%) not reached -> Automatic Refund
                if (fundingPercent < 30) {
                    console.log(`[TrustWorker] Project "${project.title}" failed Seed Tier (${fundingPercent.toFixed(2)}%). Triggering auto-refund...`);

                    await refundProjectService(
                        project._id,
                        `System: Seed Tier (30%) not reached by deadline ${project.deadline.toLocaleString()}`
                    );
                } else {
                    // REACHED SEED TIER: Mark as FUNDED (even if not 100%, since it's "tiered unlocks")
                    console.log(`[TrustWorker] Project "${project.title}" reached Seed Tier (${fundingPercent.toFixed(2)}%). Moving to FUNDED status.`);

                    project.status = "FUNDED";
                    await project.save();

                    await AuditLog.create({
                        action: "PROJECT_AUTO_STATUS_FUNDED",
                        actorId: project.creatorId,
                        resourceId: project._id,
                        resourceModel: "Project",
                        details: {
                            finalFunding: project.currentFunding,
                            percentage: fundingPercent,
                            reason: "Reached minimum seed tier at deadline."
                        }
                    });
                }
            }
        } catch (error) {
            console.error("[TrustWorker] Critical Error in background processing:", error);
        }
    }, 120000); // 2 minutes
};
