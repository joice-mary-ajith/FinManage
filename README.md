# FinManage

A personal finance management web app built on the MERN stack (MongoDB, Express, React, Node.js). Users track money across several accounts (cash, bank, credit card, savings), record income and expenses, set monthly budgets per category, and see where their money goes. An admin role manages default categories and users.

## Features

**For every user**
- Register, log in, log out (JWT authentication, bcrypt password hashing)
- Password reset with a 6-digit OTP sent by email (Nodemailer, valid 10 minutes, 5 attempts)
- Multiple accounts per user (cash, bank, credit card, savings) with an opening balance
- Account balance is computed on read: `openingBalance + income - expense`
- Add, edit, delete and filter transactions (date range, type, account, category)
- Default categories plus custom categories
- **Budgets:** set a monthly limit per expense category (for example Groceries: 5,000)
  - Category-wise progress bars on the Budgets page that turn red when a category goes over its limit
  - Immediate red warning when a saved expense pushes a category over budget, for example: *"Over budget: Groceries is ₹5,300 of ₹5,000"*
  - Dashboard banner listing every over-budget category
  - Automatic monthly reset: only the current month's expenses are counted, and the limits themselves are kept
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
    controllers/   request logic (auth, account, category, transaction, budget, analytics, admin)
    middleware/    authMiddleware.js (JWT + active check), adminMiddleware.js (role check)
    models/        Mongoose schemas (user, account, category, transaction, budget)
    routes/        URL-to-controller mapping
    services/      balanceService, analyticsService, budgetService, emailService
    app.js         Express setup and route mounting
    connection.js  MongoDB connection
    seedCategories.js   inserts default categories (run once)
    seedAdmin.js        creates the admin user from .env (run once)
  frontend/
    public/         favicon and logo (SVG)
    src/api/        axios client (token + auto-logout) and one function per endpoint
    src/context/    AuthContext (login state, restores session from /auth/me)
    src/components/ Layout, ProtectedRoute, PublicRoute, Modal, TransactionForm, Charts
    src/pages/      Login, Register, ForgotPassword, ResetPassword, Dashboard, Accounts,
                    Transactions, Budgets, Reports, Landing
    src/pages/admin/ AdminUsers, AdminCategories
```

## How to run locally

### Prerequisites

- Node.js 18 or newer (includes npm)
- A MongoDB database: a free MongoDB Atlas cluster, or a local MongoDB installation
- An SMTP account for the password-reset email (for Gmail, create an app password; this needs 2-step verification turned on)

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

# Address of the frontend that may call this API (CORS). No trailing slash.
# Development: http://localhost:5173   Production: your deployed frontend address
CLIENT_URL=http://localhost:5173

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

| Variable | Purpose |
|---|---|
| `PORT` | Port the API listens on (default 5000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign login tokens |
| `JWT_EXPIRES_IN` | How long a login token stays valid (default `1d`) |
| `CLIENT_URL` | Address(es) of the frontend allowed to call the API (CORS); comma-separate several. Set it to the deployed frontend address in production |
| `SMTP_*`, `EMAIL_FROM` | Mail server used to send password-reset OTPs |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Credentials for the first admin, used by `seedAdmin.js` |

Then, once per database:

```bash
node seedCategories.js
node seedAdmin.js
```

`seedCategories.js` is safe to run more than once: it only adds default categories that are missing and never changes existing ones, so transactions and budgets keep pointing at the right category.

Start the server:

```bash
npm run dev      # development (restarts on change)
npm start        # production (node app.js)
```

Check `http://localhost:5000/api/v1/health` returns `{"status":"ok"}`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. In development Vite proxies `/api` to `http://localhost:5000`, so no frontend `.env` is needed. For a production build see *Deployment (AWS)* below. 

The backend must be running before the frontend can load any data.

### Troubleshooting

- **MongoDB connection error:** `MONGO_URI` is wrong, or your IP address is not allowed under Network Access in Atlas.
- **Frontend shows "Cannot reach the server":** the backend is not running, or it uses a port other than 5000. If you change `PORT`, also update the proxy target in `frontend/vite.config.js`.
- **Reset emails do not arrive:** check the `SMTP_*` values and use an app password, not your normal email password. Errors are printed in the backend terminal.
- **Browser console says "blocked by CORS policy":** `CLIENT_URL` in the backend `.env` does not match the address of the frontend (check `http` vs `https` and a trailing `/`). Restart the backend after changing it.
- **Seed scripts do nothing or fail:** run them from inside `backend/`, and make sure `MONGO_URI` is set in `.env`.

## Deployment (AWS)

```
Browser  ->  Frontend (React build, static files)  ->  Backend API (Node/Express)  ->  MongoDB Atlas
```

1. **Database:** MongoDB Atlas. Under Network Access, allow the backend server's IP address.
2. **Backend:** on an AWS server, clone the repo, `cd backend`, `npm ci --omit=dev`, create `.env` there (never committed; names are listed in `backend/.env.example`), then run `npm start` under a process manager such as pm2 so it keeps running. Check `/api/v1/health`.
3. **CORS:** in the server `.env`, set `CLIENT_URL` to the exact address of the deployed frontend. Other websites cannot call the API from a browser.
4. **Frontend:** on your computer create `frontend/.env.production` with `VITE_API_URL=<backend address>/api/v1`, run `npm run build`, and upload the contents of `frontend/dist/` to the static host. The value of `VITE_API_URL` is copied into the build, so rebuild after changing it.
5. **Client-side routing:** the static host must return `index.html` for unknown paths (for example the error document on S3), otherwise refreshing `/dashboard` gives a 404.
6. **Environment variables:** development and production use different values: `CLIENT_URL`, `JWT_SECRET` and `MONGO_URI` live only in each server's `.env`; the frontend has only `VITE_API_URL`.

## Using the app

1. **Register** a user (or log in as the admin created by `seedAdmin.js`).
2. **Accounts:** create at least one account, since transactions belong to an account.
3. **Transactions:** add income and expenses, and filter them by date, type, account or category.
4. **Budgets:** click *Set budget*, choose an expense category and enter a monthly limit. Add expenses in that category: the progress bar fills, and once the total passes the limit the bar turns red, a warning appears after saving the expense, and the dashboard lists the category in its banner.
5. **Reports:** view charts for the current period and export all transactions to CSV.

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
| GET | /budgets | List budgets, each with this month's spending | Logged in |
| PUT | /budgets | Create or update the budget of a category (`{ categoryId, amount }`) | Logged in |
| DELETE | /budgets/:id | Remove a budget | Logged in |
| GET | /analytics/summary | Income, expense, net savings for a period | Logged in |
| GET | /analytics/category-breakdown | Expense total per category | Logged in |
| GET | /analytics/trend?months=6 | Income vs expense per month | Logged in |
| GET | /analytics/export | CSV of all the user's transactions | Logged in |
| GET | /admin/stats | App statistics | Admin |
| GET | /admin/users | List users | Admin |
| PATCH | /admin/users/:id/activate, /deactivate | Enable / disable a user | Admin |
| GET, POST | /admin/categories | List / add default categories | Admin |
| PUT, DELETE | /admin/categories/:id | Rename / delete a default category | Admin |

When a transaction is created or edited, the response also contains a `budgetAlert` field. It is `null` normally, or `{ categoryName, spent, amount }` when that expense pushed its category over the monthly budget.

Errors are returned as JSON `{ "message": "..." }` with a suitable status code (400 validation, 401 not logged in, 403 deactivated or not admin, 404 not found, 409 conflict).

## Design notes

- **Balance is never stored.** It is calculated from the transactions on every read, so it always matches the transaction log. For the same reason an account's opening balance can't be edited after creation; corrections are recorded as transactions.
- **Budget spending is never stored either.** Only the monthly limit is saved. "Spent" is calculated from the current month's expenses on every read, which is why spending starts again from zero each month while the limits stay. Nothing needs to run on the 1st of the month.
- **Over-budget check.** After an expense is saved, `budgetService.checkBudget` totals that category's expenses for the current month and compares them to the limit. A failure in this check is logged and never turns an already-saved transaction into an error.
- **Roles are enforced on the server.** The React app only hides admin links; the `requireAdmin` middleware is the real protection. Registration never accepts a role from the request.
- **Passwords and OTPs are hashed with bcrypt.** Plain text is never stored.
- **Secrets live in `.env`**, which is git-ignored.

## Testing status

| Area | Status |
|---|---|
| Backend APIs | Tested manually with Thunder Client, including invalid input and error responses |
| React flows (auth, CRUD, filters, reports, admin, OTP reset) | Tested manually in the browser against MongoDB Atlas |
| Budgets (limits, over-budget warning, dashboard banner, monthly reset) | Tested manually in the browser |
| Automated tests | None yet |

## Known limitations

- Logout deletes the token on the client only; there is no server-side token revocation, so a token stays valid until it expires.
- Admin statistics count the admin account as a user.
- No transfer between accounts (record one expense and one income).
- Budget warnings appear inside the app only (no email or push notification).
- The Budgets page shows the current month only; past months' budget results are not shown.
- Budget months are counted in UTC, which matches how transaction dates are stored (see `currentMonthRange()` in `backend/services/budgetService.js`).
- If the live site is served over plain HTTP, passwords are not encrypted in transit. HTTPS (for example CloudFront with a certificate) is the next step.
- No rate limiting on login or on the password-reset OTP request.
- Money is stored as numbers rounded to two decimals, not as integer paise.

## Documentation

The Software Requirements Specification is in `FinManage_SRS_final.pdf` (v1.4). The admin role, emailed OTP reset and budgets were added after v1.4 and are not yet reflected in it.
