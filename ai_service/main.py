from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import pytesseract
from PIL import Image
import io
import datetime
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with specific origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Config & Mock Data ---

# Predefined categories
CATEGORIES = ["Travel", "Equipment", "Editing", "Marketing", "Production"]

# Mock dataset for TF-IDF (Ideally this would be larger and persistent)
# In a real app, load this from a file or train a model.
TRAINING_DATA = [
    ("flight ticket airline air travel", "Travel"),
    ("uber taxi cab ride transportation", "Travel"),
    ("hotel stay accommodation lodging", "Travel"),
    ("camera lens tripod lighting gear", "Equipment"),
    ("video editing software adobe premiere", "Editing"),
    ("facebook ads instagram promotion marketing", "Marketing"),
    ("set design props costumes production", "Production"),
    ("food catering lunch dinner", "Production"), # Assuming production includes catering
]

# Train a simple classifier on startup
corpus = [text for text, cat in TRAINING_DATA]
labels = [cat for text, cat in TRAINING_DATA]
vectorizer = TfidfVectorizer()
tfidf_matrix = vectorizer.fit_transform(corpus)

# --- Data Models ---

class ExpenseAnalysisResult(BaseModel):
    raw_text: str
    vendor: Optional[str] = None
    amount: Optional[float] = None
    date: Optional[str] = None
    category: str
    confidence: float
    is_fraud_risk: bool
    risk_score: float
    risk_reasons: List[str]
    status: str # APPROVED, FLAGGED, REJECTED

# --- Helper Functions ---

def extract_metadata(image: Image.Image) -> dict:
    """Extract EXIF metadata if available."""
    try:
        exif_data = image._getexif()
        return exif_data if exif_data else {}
    except Exception:
        return {}

def categorize_text(text: str) -> tuple[str, float]:
    """Categorize text using simple Keyword + TF-IDF approach."""
    # 1. Keyword Mapping (Fastest)
    text_lower = text.lower()
    keywords = {
        "flight": "Travel", "airline": "Travel", "uber": "Travel", "taxi": "Travel",
        "camera": "Equipment", "lens": "Equipment",
        "adobe": "Editing", "edit": "Editing",
        "marketing": "Marketing", "ads": "Marketing",
    }
    
    for word, category in keywords.items():
        if word in text_lower:
            return category, 0.95 # High confidence for direct keyword match

    # 2. TF-IDF Cosine Similarity (Fallback)
    query_vec = vectorizer.transform([text_lower])
    similarities = cosine_similarity(query_vec, tfidf_matrix)
    best_idx = np.argmax(similarities)
    best_score = float(similarities[0, best_idx])
    
    if best_score > 0.1:
        return labels[best_idx], best_score
    else:
        return "Uncategorized", 0.0

def calculate_risk(metadata, text, vendor, amount) -> tuple[float, List[str]]:
    score = 0
    reasons = []

    # 1. Metadata Check
    if not metadata:
        score += 30
        reasons.append("Missing EXIF metadata")
    
    # 2. Vendor Consistency (Mock check)
    if vendor and "fake" in vendor.lower():
        score += 50
        reasons.append("Suspicious vendor name")

    # 3. Text Consistency
    if len(text.strip()) < 10:
        score += 20
        reasons.append("Very little text extracted")
        
    return min(100, score), reasons

# --- Routes ---

@app.post("/analyze-receipt", response_model=ExpenseAnalysisResult)
async def analyze_receipt(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # 1. OCR Extraction
        # NOTE: This requires Tesseract to be installed on the system.
        # If running on windows, you might need to specify path:
        # pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
        try:
             raw_text = pytesseract.image_to_string(image)
        except pytesseract.TesseractNotFoundError:
             # Fallback for demo if Tesseract isn't installed
             raw_text = "Error: Tesseract not found. Please install Tesseract-OCR. Mocking text for demo: Uber Ride to Airport 45.00 USD"
             print("WARNING: Tesseract not found.")

        # 2. Extract Data (Regex/NLP would go here)
        # Simple regex for amount
        amount_match = re.search(r'\$?(\d+\.\d{2})', raw_text)
        amount = float(amount_match.group(1)) if amount_match else 0.0
        
        # Simple regex for date
        date_match = re.search(r'(\d{4}-\d{2}-\d{2})', raw_text)
        date_str = date_match.group(1) if date_match else datetime.date.today().isoformat()
        
        vendor = "Unknown Vendor" 
        lines = [l for l in raw_text.split('\n') if l.strip()]
        if lines:
            vendor = lines[0] # Naive assumption: first line is vendor

        # 3. Categorization
        category, confidence = categorize_text(raw_text)

        # 4. Anti-Fraud & Risk
        metadata = extract_metadata(image)
        risk_score, risk_reasons = calculate_risk(metadata, raw_text, vendor, amount)

        # 5. Decision
        status = "APPROVED"
        if risk_score > 60:
            status = "REJECTED"
        elif risk_score > 30:
            status = "FLAGGED"

        return ExpenseAnalysisResult(
            raw_text=raw_text,
            vendor=vendor,
            amount=amount,
            date=date_str,
            category=category,
            confidence=confidence,
            is_fraud_risk=(risk_score > 30),
            risk_score=risk_score,
            risk_reasons=risk_reasons,
            status=status
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def home():
    return {"message": "Lazarus AI Service Running"}
