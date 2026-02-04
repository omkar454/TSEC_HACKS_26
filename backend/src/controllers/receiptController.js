import asyncHandler from "express-async-handler";
import Tesseract from "tesseract.js";
import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

// --- Helper Functions ---

const CATEGORIES = ["Travel", "Equipment", "Editing", "Marketing", "Production"];

// Simple keyword-based categorization
const categorizeText = (text) => {
    const textLower = text.toLowerCase();
    const keywords = {
        "flight": "Travel", "airline": "Travel", "uber": "Travel", "taxi": "Travel", "hotel": "Travel", "aviation": "Travel", "train": "Travel", "railway": "Travel",
        "camera": "Equipment", "lens": "Equipment", "tripod": "Equipment",
        "adobe": "Editing", "edit": "Editing", "software": "Editing",
        "marketing": "Marketing", "ads": "Marketing", "promo": "Marketing",
        "food": "Production", "catering": "Production", "set": "Production", "costume": "Production"
    };

    for (const [word, category] of Object.entries(keywords)) {
        if (textLower.includes(word)) {
            return { category, confidence: 0.95 };
        }
    }
    return { category: "Uncategorized", confidence: 0.0 };
};

const calculateRisk = (text, amountINR) => {
    let score = 0;
    const reasons = [];

    // 1. Text Consistency
    if (!text || text.length < 10) {
        score += 40; // Increased to trigger 'Verify'
        reasons.push("Very little text extracted");
    }

    // 2. Suspicious Keyword Check
    if (text.toLowerCase().includes("game") || text.toLowerCase().includes("casino")) {
        score += 80; // Increased to trigger 'Reject'
        reasons.push("Suspicious keyword found (game/casino)");
    }

    // 3. Amount Check (INR)
    // Threshold set to 5,00,000 INR (approx $6000 USD, similar to previous $5000 check)
    if (amountINR > 500000) {
        score += 40; // Increased to trigger 'Verify'
        reasons.push(`High amount detected (> ₹5,00,000)`);
    }

    return { score: Math.min(100, score), reasons };
};

// Helper: Parse amount
const parseAmount = (str) => {
    if (!str) return 0.0;
    return parseFloat(str.replace(/,/g, '').replace(/[^\d.]/g, ''));
};


// @desc    Analyze receipt image
// @route   POST /api/receipts/analyze
// @access  Public (or Protected if needed)
export const analyzeReceipt = asyncHandler(async (req, res) => {
    if (!req.file) {
        res.status(400);
        throw new Error("No file uploaded");
    }

    const apiKey = process.env.GROQ_API_KEY;

    console.log(`Processing with ${apiKey ? "Groq AI (Llama 3)" : "Local Regex"}...`);

    // 1. Always run Tesseract OCR first (Llama 3.1 8b is text-only)
    const { data: { text } } = await Tesseract.recognize(
        req.file.buffer,
        'eng',
        { logger: m => { } } // silencer logger in prod
    );
    const rawText = text.trim();
    console.log("OCR Raw Text:", rawText);

    let originalAmount = 0.0;
    let dateStr = new Date().toISOString().split('T')[0];
    let category = "Uncategorized";
    let confidence = 0.0;
    let vendor = "Detected Vendor";

    if (apiKey) {
        // --- STRATEGY 1: Groq Llama 3.1 8b (Text Parsing) ---
        const groq = new Groq({ apiKey });

        const prompt = `
        You are an expert receipt parser. Extract data from this OCR text.
        Return ONLY valid JSON with these keys:
        - vendor_name (string, default "Unknown")
        - total_amount (number, find the GRAND TOTAL in INR/Rupees. Ignore currency symbols like ₹ or Rs. Example: 29,000.00 -> 29000.00)
        - date (YYYY-MM-DD string, default today)
        - category (One of: Travel, Equipment, Editing, Marketing, Production)
        - summary (string)

        OCR TEXT:
        """
        ${rawText}
        """
        `;

        try {
            const completion = await groq.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "llama-3.1-8b-instant",
                temperature: 0,
                response_format: { type: "json_object" }
            });

            const jsonStr = completion.choices[0]?.message?.content || "{}";
            console.log("Groq Output:", jsonStr);
            const data = JSON.parse(jsonStr);

            vendor = data.vendor_name || vendor;
            originalAmount = data.total_amount || 0.0;
            dateStr = data.date || dateStr;
            category = data.category || "Uncategorized";
            confidence = 0.95;

        } catch (e) {
            console.error("Groq Parse Error:", e);
            // Fallback to Regex if Groq fails
        }
    }

    if (originalAmount === 0.0) {
        // --- STRATEGY 2: Strict Regex (Fallback) ---
        console.log("Using Regex Fallback...");

        const lines = rawText.split('\n');
        const totalLine = lines.find(line =>
            (line.toLowerCase().includes('total') || line.toLowerCase().includes('amount') || line.toLowerCase().includes('payable'))
            && !line.toLowerCase().includes('tax')
        );

        if (totalLine) {
            const matches = totalLine.match(/[\d,]+\.\d{2}\b/g) || totalLine.match(/[\d,]+/g);
            if (matches) originalAmount = parseAmount(matches[matches.length - 1]);
        }

        if (originalAmount === 0.0) {
            const allMatches = rawText.match(/[\d,]+\.\d{2}\b/g) || [];
            const candidates = allMatches.map(n => parseAmount(n)).filter(n => n > 0 && n < 1000000);
            if (candidates.length > 0) originalAmount = Math.max(...candidates);
        }

        // Categorize fallback
        const catResult = categorizeText(rawText);
        category = catResult.category;
        confidence = catResult.confidence;
    }

    // Force INR logic
    const amountINR = originalAmount; // Assumes receipt is in INR as requested
    const { score: riskScore, reasons: riskReasons } = calculateRisk(rawText, amountINR);

    // Calculate Approval Score
    const approvalScore = Math.max(0, 100 - riskScore);

    // Decision Logic
    let status = "APPROVED";
    if (approvalScore < 30) status = "REJECTED";
    else if (approvalScore < 70) status = "VERIFY_BY_ADMIN";

    res.json({
        raw_text: rawText,
        vendor,
        amountINR, // Changed from amountUSD
        currency: "INR",
        date: dateStr,
        category,
        confidence,
        approval_score: approvalScore,
        risk_reasons: riskReasons,
        status
    });
});
