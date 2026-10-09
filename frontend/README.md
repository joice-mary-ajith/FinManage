# FinManage Frontend

React + Vite + React Router + Axios + Recharts. Talks to the Express backend at `/api/v1`.

## Run

1. Start the backend first (`cd backend && node app.js`, port 5000).
2. In this folder: `npm install` then `npm run dev` and open http://localhost:5173.

In development, Vite proxies `/api` to `http://localhost:5000` (see `vite.config.js`), so no CORS setup or `.env` is needed.
For a production build set `VITE_API_URL` (see `.env.example`) and run `npm run build`.

## Folders

- `src/api` axios client (token + auto-logout) and one function per backend endpoint
- `src/context` AuthContext (login state, restores session from `/auth/me`)
- `src/components` Layout, route guards, Modal, TransactionForm, Charts, small UI pieces
- `src/pages` Login, Register, ForgotPassword, ResetPassword, Dashboard, Accounts, Transactions, Reports
- `src/pages/admin` AdminUsers (stats + activate/deactivate), AdminCategories (default categories)
- `src/utils` money/date formatting and validators (currency is set in `format.js`)
