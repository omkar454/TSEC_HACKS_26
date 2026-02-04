# Creator Platform (TSEC Hacks 26)

A MERN stack application for Creators to manage projects, expenses, and funding with transparency. Features AI-powered receipt analysis and wallet management.

## Features
*   **Project Management:** Creators can create and manage funding projects.
*   **Wallet System:** Integrated wallet for adding funds and distributing revenue.
*   **Expense Verification:** AI-powered OCR to extract data from receipts (Vendor, Amount, Risk Score).
*   **Transparent Funding:** Backers can see how funds are utilized.

## Prerequisites
*   [Node.js](https://nodejs.org/) (v16 or higher)
*   [MongoDB](https://www.mongodb.com/) (Local or Atlas)
*   [Groq API Key](https://console.groq.com/) (For Llama 3 powered Receipt Analysis)

## Installation

### 1. Clone the repository
```bash
git clone <repository_url>
cd TSEC_HACKS_26
```

### 2. Backend Setup
Navigate to the backend folder and install dependencies:
```bash
cd backend
npm install
```

**Required Environment Variables:**
Create a `.env` file in the `backend` directory:
```env
PORT=3000
MONGO_URI=mongodb+srv://<your_mongo_url>
JWT_SECRET=your_jwt_secret_key
GROQ_API_KEY=your_groq_api_key  # Required for AI Receipt Analysis
```

### 3. Frontend Setup
Navigate to the frontend folder and install dependencies:
```bash
cd ../frontend
npm install
```

## Running the Application

### Start Backend
In the `backend` directory:
```bash
npm start
```
*   Server runs on: `http://localhost:3000`

### Start Frontend
In the `frontend` directory:
```bash
npm run dev
```
*   App runs on: `http://localhost:5173` (or similar)

## Tech Stack
*   **Frontend:** React, Vite, TailwindCSS, Lucide Icons
*   **Backend:** Node.js, Express, MongoDB, Mongoose
*   **AI/OCR:** Tesseract.js (OCR), Groq SDK (Llama 3.1 analysis)
*   **Authentication:** JWT

## Troubleshooting
*   **MongoDB Connection Error:** Ensure your IP is whitelisted in MongoDB Atlas Network Access.
*   **Receipt Analysis Failed:** Check if `GROQ_API_KEY` is set in `backend/.env` and the backend was restarted.
