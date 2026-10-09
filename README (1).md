# FinManage

A personal finance management web app built on the MERN stack (MongoDB, Express, React, Node.js). Users track money across several accounts (cash, bank, credit card, savings), record income and expenses, and see where their money goes. An admin role manages default categories and users.

## Features

**For every user**
- Register, log in, log out (JWT authentication, bcrypt password hashing)
- Password reset with a 6-digit OTP sent by email (Nodemailer, valid 10 minutes, 5 attempts)
- Multiple accounts per user (cash, bank, credit card, savings) with an opening balance
- Account balance is computed on read: `openingBalance + income - expense`
- Add, edit, delete and filter transactions (date range, type, account, category)
- Default categories plus custom categories
- Dashboard and Reports: income vs expense, category breakdown (pie), 6-month trend (bar)
- CSV export of all transactions
- Each user's data is private; protected routes redirect to login

**For admins**
- App statistics (users, accounts, transactions)
- View users, deactivate / activate accounts (a deactivated user cannot log in or use the API)
- Add, rename and delete default categories (a category used by transactions cannot be deleted)

**Out of scope:** live bank feeds, real payments, investment tracking, tax filing, shared/household accounts.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router, Axios, Recharts, plain CSS |
| Backend | Node.js, Express 5 |
| Database | MongoDB Atlas, Mongoose |
| Auth | JWT, bcrypt |
| Email | Nodemailer (SMTP) |

## Project structure

```
FinManage/
  backend/
    controllers/   request logic (auth, account, category, transaction, analytics, admin)
    middleware/    authMiddleware.js (JWT + active check), adminMiddleware.js (role check)
    models/        Mongoose schemas (user, account, category, transaction)
    routes/        URL-to-controller mapping
    services/      balanceService, analyticsService, emailService
    app.js         Express setup and route mounting
    connection.js  MongoDB connection
    seedCategories.js   inserts default categories (run once)
    seedAdmin.js        creates the admin user from .env (run once)
  frontend/
    src/api/        axios client (token + auto-logout) and one function per endpoint
    src/context/    AuthContext (login state, restores session from /auth/me)
    src/components/ Layout, ProtectedRoute, PublicRoute, Modal, TransactionForm, Charts
    src/pages/      Login, Register, ForgotPassword, ResetPassword, Dashboard, Accounts,
                    Transactions, Reports, Landing
    src/pages/admin/ AdminUsers, AdminCategories
```

## How to run locally

### 1. Backend

```bash
cd backend
npm install
```

Create `backend/.env` (never commit this file):

```
PORT=5000
MONGO_URI=<your MongoDB Atlas connection string ending in /finmanage>
JWT_SECRET=<a long random string>
JWT_EXPIRES_IN=1d

# Email (password reset OTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=<your email>
SMTP_PASS=<app password>
EMAIL_FROM=FinManage <your email>

# First admin account
ADMIN_EMAIL=admin@finmanage.com
ADMIN_PASSWORD=<choose a password>
```

Then, once:

```bash
node seedCategories.js
node seedAdmin.js
```

Start the server:

```bash
npm run dev
```

Check `http://localhost:5000/api/v1/health` returns `{"status":"ok"}`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. In development Vite proxies `/api` to `http://localhost:5000`, so no CORS setup or frontend `.env` is needed. For a production build set `VITE_API_URL` (see `frontend/.env.example`) and run `npm run build`.

## API (base URL `/api/v1`)

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| POST | /auth/register | Create a user (always role `user`) | Public |
| POST | /auth/login | Log in, receive JWT | Public |
| POST | /auth/forgot-password | Email a reset OTP | Public |
| POST | /auth/reset-password | Set a new password with the OTP | Public |
| GET | /auth/me | Current user | Logged in |
| GET, POST | /accounts | List (with balance) / create | Logged in |
| PUT, DELETE | /accounts/:id | Edit name or type / delete (blocked if it has transactions) | Logged in |
| GET, POST | /categories | List default + own / add custom | Logged in |
| GET, POST | /transactions | List with filters (from, to, type, accountId, categoryId) / create | Logged in |
| PUT, DELETE | /transactions/:id | Edit / delete | Logged in |
| GET | /analytics/summary | Income, expense, net savings for a period | Logged in |
| GET | /analytics/category-breakdown | Expense total per category | Logged in |
| GET | /analytics/trend?months=6 | Income vs expense per month | Logged in |
| GET | /analytics/export | CSV of all the user's transactions | Logged in |
| GET | /admin/stats | App statistics | Admin |
| GET | /admin/users | List users | Admin |
| PATCH | /admin/users/:id/activate, /deactivate | Enable / disable a user | Admin |
| GET, POST | /admin/categories | List / add default categories | Admin |
| PUT, DELETE | /admin/categories/:id | Rename / delete a default category | Admin |

Errors are returned as JSON `{ "message": "..." }` with a suitable status code (400 validation, 401 not logged in, 403 deactivated or not admin, 404 not found, 409 conflict).

## Design notes

- **Balance is never stored.** It is calculated from the transactions on every read, so it always matches the transaction log. For the same reason an account's opening balance can't be edited after creation; corrections are recorded as transactions.
- **Roles are enforced on the server.** The React app only hides admin links; the `requireAdmin` middleware is the real protection. Registration never accepts a role from the request.
- **Passwords and OTPs are hashed with bcrypt.** Plain text is never stored.
- **Secrets live in `.env`**, which is git-ignored.

## Testing status

| Area | Status |
|---|---|
| Backend APIs | Tested manually with Thunder Client |
| React flows (auth, CRUD, filters, reports, admin, OTP reset) | Tested manually in the browser against MongoDB Atlas |
| Automated tests (Jest) | Not written yet |

## Known limitations

- Logout deletes the token on the client only; there is no server-side token revocation, so a token stays valid until it expires.
- Admin statistics count the admin account as a user.
- No transfer between accounts (record one expense and one income).
- No Docker / AWS deployment yet.

## Documentation

The Software Requirements Specification is in `FinManage_SRS_final.pdf` (v1.4). The admin role and emailed OTP reset were added after v1.4 and are not yet reflected in it.
