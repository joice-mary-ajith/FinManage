# FinManage

A personal finance management web app built on the MERN stack. Users track money across several accounts (cash, bank, credit card, savings), record income and expenses, and view reports of where their money goes.

## Problem Statement

People who spend from cash, bank accounts and credit cards have no single place to see their full picture. Automatic finance apps read bank SMS or feeds, but they miss cash spending and rarely give one combined view across accounts. FinManage is a manual-entry tracker that fills this gap: the user records transactions, and the system organizes them into accounts, categories and reports.

## Target Users

- Students and salaried individuals who want to track personal income and expenses
- People who use cash alongside bank accounts and credit cards
- Single-user usage: each registered user's data is private and isolated from every other user

## Features

- Register, log in and reset password (JWT authentication, bcrypt password hashing)
- Multiple accounts per user (cash, bank, credit card, savings) with opening balance
- Account balance computed on read: `openingBalance + income - expense`
- Record, edit, delete and filter transactions (date range, category, account, type)
- Default categories plus user-defined categories
- Analytics dashboard: income vs expense, category-wise breakdown, trend chart
- CSV export (stretch goal)

**Out of scope (v1):** live bank feeds, real payments, investment tracking, tax filing, admin role, shared/household accounts.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Axios, React Router |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas, Mongoose |
| Auth | JWT, bcrypt |
| Testing | Jest, Thunder Client (API testing) |
| Deployment (planned) | Docker on AWS EC2 |

## Project Structure

```
backend/
  controllers/   request logic (auth, account, category, transaction)
  middleware/    authMiddleware.js (JWT verification)
  models/        Mongoose schemas
  routes/        URL-to-controller mapping
  services/      balanceService.js (balance aggregation)
  app.js         Express setup and route mounting
  connection.js  MongoDB connection
  seedCategories.js  one-time default category seeding
```

## Database Design

### Collections

**Users**

| Field | Type | Notes |
|---|---|---|
| _id | ObjectId | Primary key |
| name | String | Required |
| email | String | Required, unique |
| passwordHash | String | bcrypt hash, never returned in responses |
| resetPasswordToken | String | Hashed reset token, null when none pending |
| resetPasswordExpires | Date | Reset token expiry |
| createdAt | Date | Auto-generated |

**Accounts**

| Field | Type | Notes |
|---|---|---|
| _id | ObjectId | Primary key |
| userId | ObjectId | References Users |
| name | String | e.g. HDFC Savings |
| type | String | cash, bank, credit_card, savings |
| openingBalance | Number | Required |

**Categories**

| Field | Type | Notes |
|---|---|---|
| _id | ObjectId | Primary key |
| userId | ObjectId | null for system default categories |
| name | String | e.g. Groceries |
| type | String | income or expense |

**Transactions**

| Field | Type | Notes |
|---|---|---|
| _id | ObjectId | Primary key |
| userId | ObjectId | References Users |
| accountId | ObjectId | References Accounts |
| categoryId | ObjectId | References Categories |
| type | String | income or expense |
| amount | Number | Positive |
| date | Date | Indexed for range queries |
| notes | String | Optional |

### Relationships

- One User has many Accounts (1:N)
- One User has many Transactions (1:N)
- One Account has many Transactions (1:N); an account with transactions cannot be deleted
- One Category has many Transactions (1:N)

The account balance is **not stored**. It is calculated from the transactions each time it is requested, so it always matches the transaction log.

## API Requirements

Base URL: `/api/v1`

| Method | Endpoint | Purpose | Login required |
|---|---|---|---|
| POST | /auth/register | Create a user | No |
| POST | /auth/login | Log in, receive JWT | No |
| POST | /auth/forgot-password | Generate reset token | No |
| POST | /auth/reset-password | Set a new password using the token | No |
| GET | /auth/me | Current user profile | Yes |
| POST | /accounts | Create account | Yes |
| GET | /accounts | List accounts with computed balance | Yes |
| PUT | /accounts/:id | Edit account name or type | Yes |
| DELETE | /accounts/:id | Delete account (blocked if it has transactions) | Yes |
| GET | /categories | List default and own categories | Yes |
| POST | /categories | Add a custom category | Yes |
| POST | /transactions | Add transaction | Yes |
| GET | /transactions | List with filters: from, to, categoryId, accountId, type | Yes |
| PUT | /transactions/:id | Edit transaction | Yes |
| DELETE | /transactions/:id | Delete transaction | Yes |

Planned (Analytics module): dashboard summary, category-wise expense breakdown, income-vs-expense trend, CSV export.

## Planned React Pages

| Page | Purpose |
|---|---|
| Login / Register | Authentication |
| Forgot / Reset Password | Password reset flow |
| Dashboard | Summary cards (income, expense, net savings) and charts |
| Accounts | List, create, edit, delete accounts with balances |
| Transactions | List, filters, add/edit form |
| Reports | Category breakdown and trend charts, CSV export |

## How to Run (Backend)

1. Clone the repo and open the `backend` folder
2. `npm install`
3. Create a `.env` file with these variables (use your own values):
   ```
   PORT=5000
   MONGO_URI=<your MongoDB Atlas connection string ending in /finmanage>
   JWT_SECRET=<a long random string>
   JWT_EXPIRES_IN=1d
   ```
4. `node seedCategories.js` (once, to insert default categories)
5. `node app.js` and check `GET http://localhost:5000/api/v1/health`

## Project Status

| Item | Status |
|---|---|
| Project setup, MongoDB connection | Done |
| Authentication module | Done, tested with Thunder Client |
| Accounts module | Done, tested with Thunder Client (create, edit, delete, invalid token) |
| Transactions and Categories module | Not started |
| Analytics module | Not started |
| Jest tests for balance logic | Not started |
| React frontend | Not started |
| Docker and AWS deployment | Not started |

## Documentation

The full Software Requirements Specification is in `FinManage_SRS_final.pdf` (v1.4).
