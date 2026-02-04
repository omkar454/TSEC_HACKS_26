import express from "express";
import {
    createProject,
    getProjects,
    getProjectById,
    updateProjectStatus,
    deleteProject,
    submitMilestone,
} from "../controllers/projectController.js";
import { protect, creator } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/")
    .get(getProjects)
    .post(protect, creator, createProject);

router.route("/:id")
    .get(getProjectById)
    .delete(protect, deleteProject);

router.route("/:id/status")
    .patch(protect, updateProjectStatus);

router.route("/:id/milestones/:milestoneId/submit")
    .patch(protect, creator, submitMilestone);

export default router;
