# Frontend-Backend Integration Guide

## Overview
This document details the steps taken to integrate the React frontend with the Node.js/Express backend for the Lazarus project.

## 1. Backend Configuration
- **CORS Enabled**: Updated `backend/src/app.js` to allow Cross-Origin Resource Sharing (CORS), enabling the frontend (running on a different port) to communicate with the backend.
- **Port**: Backend runs on `http://localhost:3000`.

## 2. Frontend Configuration
- **Dependencies**: Installed `axios` for HTTP requests.
- **Environment Variables**: Created `.env` in `frontend/` with:
  ```env
  VITE_API_BASE_URL=http://localhost:3000/api
  ```
- **API Utility**: Created `src/utils/api.js` to:
  - Create a central Axios instance.
  - Automatically inject the JWT `Authorization` header from `localStorage`.

## 3. Component Updates

### Authentication
- **AuthContext.jsx**: implementation details updated to:
  - Use `api.post('/auth/login')` for login.
  - Use `api.post('/auth/register')` for signup.
  - Store the JWT token in `localStorage`.
- **Login.jsx & Signup.jsx**: Connected to `AuthContext` to trigger real API calls.

### Projects & Campaigns
- **Home.jsx**:
  - Replaced mock data with `api.get('/projects')` to list real active campaigns.
  - Maps backend data fields (e.g., `fundingGoal`) to frontend UI props.
- **CampaignDetails.jsx**:
  - Fetches project details via `api.get('/projects/:id')`.
  - Fetches project expenses via `api.get('/expenses/project/:id')`.
  - Implemented `handleFund` to call `api.post('/finance/contribute')` for real investments.
- **CreateCampaign.jsx**:
  - Submits new projects to `api.post('/projects')`.
  - Includes default `fundUsageRules` (simulated for MVP) to ensure backend validation passes.

### User Profile & Dashboard
- **Profile.jsx**:
  - Displays user name, email, and wallet address fetched from `/auth/profile`.
  - Lists contribution history fetched from `/finance/my-contributions`.
  - Shows created campaigns by filtering `/projects` by the logged-in user.
- **CreatorDashboard.jsx**:
  - Provides a Project Selector for creators with multiple campaigns.
  - Fetches and displays "Total Raised" stats from backend.
  - Lists expenses via `/expenses/project/:id`.
  - **New Feature**: "Upload New Bill" form now submits real expenses to `/expenses` linked to the selected project.
  - **New Feature**: "Revenue & Returns" tab allows ingesting off-chain revenue and triggering automatic distribution to backers.

### Admin & Governance
- **AdminDashboard.jsx** (New):
  - Accessible only to users with `ADMIN` role.
  - Monitors all projects with "Freeze/Unfreeze" capabilities (`PATCH /admin/projects/:id/freeze`).
  - Displays automated "Risk Reports" from backend analysis.
- **CampaignDetails.jsx**:
  - Unlocked "Approve/Reject" buttons for Pending Expenses for Admin users.
  - Connects to `/expenses/:id/status` to execute fund transfers on approval.

## 4. How to Run Locally

1.  **Start Backend**:
    ```bash
    cd backend
    npm run dev
    # Server running on port 3000
    ```

2.  **Start Frontend**:
    ```bash
    cd frontend
    npm run dev
    # Vite server running on (usually) http://localhost:5173
    ```

3.  **Verify Integration**:
    - **Signup**: Create a new user account.
    - **Login**: Log in with credentials.
    - **Create Project**: Use the "Create Campaign" form.
    - **View**: Go to Home, see the new project.
    - **Fund**: Click the project, invest an amount. Verify the "Raised" bar updates.

## 5. Testing Notes
- **JWT**: Tokens expire after 30 days (dev setting). If you get 401 errors, try logging out and back in.
- **Images**: If using invalid URLs, they verify fallback functionality.
- **Mocking**: Some "Voting" features are simulated on the frontend because approval is technically an "Admin" action in the backend.

