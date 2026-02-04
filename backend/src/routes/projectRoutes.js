import express from "express";
import {
    createProject,
    getProjects,
    getProjectById,
    updateProjectStatus,
} from "../controllers/projectController.js";
import { protect, creator } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/")
    .get(getProjects)
    .post(protect, creator, createProject);

router.route("/:id")
    .get(getProjectById);

router.route("/:id/status")
    .patch(protect, updateProjectStatus);

export default router;
