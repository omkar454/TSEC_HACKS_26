import express from "express";
import Groq from "groq-sdk";
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

// AI Setup
const MODEL = 'llama-3.1-8b-instant';
let groqInstance = null;
function getGroq() {
    if (!groqInstance) {
        // Fallback to a hardcoded key if env var missing (CAUTION: don't commit real keys ideally, but for hackathon integration...)
        // Better: Ensure process.env.GROQ_API_KEY is set in backend .env
        groqInstance = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }
    return groqInstance;
}

async function getGroqResponse(systemPrompt, userContent) {
    try {
        const chatCompletion = await getGroq().chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userContent },
            ],
            model: MODEL,
            temperature: 0.7,
            max_tokens: 1024,
            top_p: 1,
            stream: false,
            stop: null,
        });
        return chatCompletion.choices[0].message.content;
    } catch (error) {
        console.error('Groq API Error:', error);
        throw error;
    }
}

// AI Routes
router.post('/ai/rewrite', async (req, res) => {
    const { description } = req.body;
    if (!description) return res.status(400).json({ error: 'Description is required' });
    const systemPrompt = `You are a helpful co-pilot for a crowdfunding campaign creator. Rewrite the campaign description into a clear, structured, and supporter-friendly version. Preserve intent. Output ONLY the rewritten description.`;
    try {
        const refined = await getGroqResponse(systemPrompt, description);
        res.json({ result: refined });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/ai/title', async (req, res) => {
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });
    const systemPrompt = `Rewrite the campaign title to be engaging and clear. Keep it concise. Output ONLY the title.`;
    try {
        const refined = await getGroqResponse(systemPrompt, title);
        res.json({ result: refined });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/ai/simplify', async (req, res) => {
    const { fundDetails } = req.body;
    if (!fundDetails) return res.status(400).json({ error: 'Details required' });
    const systemPrompt = `Explain the following fund usage details in plain language. Output ONLY the explanation.`;
    try {
        const refined = await getGroqResponse(systemPrompt, fundDetails);
        res.json({ result: refined });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.route("/")
    .get(getProjects)
    .post(protect, creator, createProject);

router.route("/:id")
    .get(getProjectById)
    .delete(protect, deleteProject);

router.route("/:id/status")
    .patch(protect, updateProjectStatus);

export default router;
