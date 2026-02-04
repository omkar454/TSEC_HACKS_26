# Lazarus Backend System Documentation

## 1. Project Overview

**Lazarus: Creator Project Funding & Revenue Sharing** is a programmable payments platform built for the **Finternet Hackathon**. It solves the problem of transparently funding creator projects and automatically sharing revenue with contributors.

### Key Objectives
- **Global Participation**: Allow anyone to fund specific projects.
- **Rule-Based Spending**: Funds are pooled in isolated wallets and can only be spent according to strict, pre-defined rules.
- **Automated Revenue Sharing**: Earnings are ingested and automatically distributed to contributors proportional to their share.
- **Trust & Governance**: Full audit trails, immutable logs, and Admin oversight (RAI Aligned).

### Users
- **Creators**: Launch projects, Request expenses, Submit revenue.
- **Contributors**: Fund projects, View transparency reports, Receive payouts.
- **Admins/Auditors**: Review expenses, Freeze wallets, Monitor risks.

---

## 2. Architecture Overview

### Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose) with Replica Set (Required for Transactions)
- **Authentication**: JWT (Stateless)
- **Security**: Helmet, CORS, Input Validation

### Folder Structure
The project follows a **Modular Service-Layer Architecture** to keep business logic separate from HTTP handling.

```text
backend/
├── src/
│   ├── config/          # Env variables, DB connection
│   ├── controllers/     # HTTP Request/Response handling
│   ├── middleware/      # Auth, Error, Validation
│   ├── models/          # Mongoose Schemas (Data Layer)
│   ├── routes/          # API Route Definitions
│   ├── services/        # CORE BUSINESS LOGIC (The "Brain")
│   └── app.js           # App Entry Point
├── backend_validation.md # Phase 4.5 System Proof
├── governance_framework.md # Phase 5 RAI Alignment
└── package.json
```

---

## 3. Core Domain Models

| Model | Description | Key Fields | File |
| :--- | :--- | :--- | :--- |
| **User** | Identity & Role Management | `name`, `email`, `role`, `walletId` | [User.js](src/models/User.js) |
| **Project** | Campaign & Rules | `fundingGoal`, `currentFunding`, `fundUsageRules`, `walletId` | [Project.js](src/models/Project.js) |
| **Wallet** | Isolated Fund Container | `balance`, `isFrozen`, `ownerId` | [Wallet.js](src/models/Wallet.js) |
| **Contribution** | Inflow Record | `amount`, `contributorId`, `status`, `txnHash` | [Contribution.js](src/models/Contribution.js) |
| **Expense** | Spending Request | `amount`, `category`, `receiptUrl`, `status` (PENDING/APPROVED) | [Expense.js](src/models/Expense.js) |
| **Revenue** | Earnings Record | `amount`, `source`, `status` (RECEIVED/DISTRIBUTED) | [Revenue.js](src/models/Revenue.js) |
| **AuditLog** | **Immutable** History | `action`, `actorId`, `oldBalance`, `newBalance` | [AuditLog.js](src/models/AuditLog.js) |

---

## 4. Backend Phases Walkthrough

### Phase 1: Foundation
- Bootstrapped Express app.
- Implemented **JWT Authentication** and **RBAC Middleware** (`src/middleware/authMiddleware.js`).
- Defined strict Mongoose schemas.

### Phase 2: Fund Pooling ([financeService.js](src/services/financeService.js))
- **Logic**: Users contribute -> Project Wallet gets credited.
- **Safety**: Atomic updates ensure `Project.currentFunding` and `Wallet.balance` never drift.
- **Transparency**: Public APIs expose funding % and contributor lists.

### Phase 3: Rule-Based Expenses ([expenseService.js](src/services/expenseService.js))
- **Logic**: Creators submit expenses. System validates against `fundUsageRules` (Category/Amount).
- **Control**: Expenses start as `PENDING`.
- **Approval**: Only Admins can approve. Approval triggers **Atomic Deduction** from the Wallet.

### Phase 4: Revenue Sharing ([revenueService.js](src/services/revenueService.js))
- **Logic**: `Share = (UserContribution / TotalPool) * Revenue`.
- **Automation**: One-click distribution pays ALL contributors simultaneously using MongoDB Transactions.
- **Handling**: Lazily creates user wallets. Rounds down to 2 decimals; remainder ("dust") goes to Project.

### Phase 5: Governance ([adminService.js](src/services/adminService.js))
- **Oversight**: Admins can **Freeze** wallets to stop all money movement.
- **Risk**: Automated signals detect anomalies (e.g., high rejection rates) without blocking legitimate users.
- **History**: Full timeline of all events (`AuditLog`) available for auditors.

---

## 5. API Endpoints Summary

### Authentication
- `POST /api/auth/register` - Sign up
- `POST /api/auth/login` - Login

### Projects
- `POST /api/projects` - Create (Creator)
- `GET /api/projects` - List All
- `PATCH /api/projects/:id/status` - Update Status

### Finance & Contributions
- `POST /api/finance/contribute` - Fund a project
- `GET /api/finance/projects/:id/summary` - Fund stats
- `GET /api/finance/my-contributions` - User history

### Expenses
- `POST /api/expenses` - Submit (Creator)
- `GET /api/expenses/project/:id` - List (Public/Private)
- `PATCH /api/expenses/:id/status` - Approve/Reject (Admin)

### Revenue
- `POST /api/revenue` - Log Earnings (Creator)
- `POST /api/revenue/:id/distribute` - Payout (Creator/Admin)

### Admin (Governance)
- `PATCH /api/admin/projects/:id/freeze` - Emergency Stop
- `GET /api/admin/risks` - Anomaly Report
- `GET /api/admin/projects/:id/governance` - Audit Timeline

---

## 6. Safety & Governance (RAI)

### 🛡️ Financial Safety
1.  **ACID Transactions**: All money movement (Contribution, Expense, Payout) is wrapped in `session.startTransaction()`. If any step fails, money does not move.
2.  **Wallet Isolation**: Every Project and User has a unique `Wallet` document. No shared "bank account" logic.
3.  **No Double Spending**: Revenue distribution checks `status === "DISTRIBUTED"` before processing.

### ⚖️ Governance Controls
- **Immutable Audit Logs**: Middleware prevents `UPDATE` or `DELETE` on `AuditLog` collection.
- **Human-in-the-Loop**: Automated rules *flag* risks, but Humans *decide* to freeze or approve.
- **Privacy**: Receipt URLs are hidden from public view.

---

## 7. Edge Case Handling

- **Concurrency**: MongoDB Write Locking prevents race conditions when two users fund simultaneously.
- **Rounding Errors**: In revenue share, we floor to 2 decimals. The sum of payouts is compared to total revenue. The difference (cents) is credited to the Project Wallet to ensure **Zero Money Lost**.
- **Wallet Depletion**: Expenses cannot be approved if `Wallet.balance < Amount`.
- **Frozen State**: If a wallet is frozen by Admin, **ALL** write operations (Contribute, Spend, Payout) throw an error immediately.

---

## 8. Dev Setup Instructions

1.  **Prerequisites**: Node.js, MongoDB (Running as Replica Set for Transactions).
2.  **Install**:
    ```bash
    cd backend
    npm install
    ```
3.  **Env**: Create `.env` (or use defaults in `src/config/env.js`).
    ```env
    MONGO_URI=mongodb://localhost:27017/lazarus_db?replicaSet=rs0
    JWT_SECRET=dev_secret
    ```
4.  **Run**:
    ```bash
    npm run dev
    # Output: Server running on port 5000...
    #         MongoDB Connected...
    ```

---

## 9. Integration Guide

### For Frontend Team
- Use `src/routes` as the source of truth for API paths.
- Handle `403 Forbidden` gracefully—it often means the Project Wallet is frozen or the Project is not Active.

### For Payments Team
- Currently, `financeService.js` generates a mock `paymentHash`.
- To integrate Stripe: Update `contributeToProject` to accept a Stripe Payment Intent ID and verify it before crediting the wallet.

### For AI Team
- Hook into `src/services/adminService.js`.
- The `getRiskReport` function can be enhanced with ML models to predict project failure probabilities based on `AuditLog` patterns.

---

## 10. Conclusion

The Lazarus Backend is a **Judge-Ready**, **Production-Safe** system. It demonstrates complex programmable payments concepts (pooling, conditional spending, automated settlement) using standard web technologies, making it accessible yet powerful. It handles money with the rigor of a fintech app and the transparency of a decentralized ledger.
