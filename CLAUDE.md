# money-flow-frontend — Agent Context

## What This Is
React + TypeScript + MUI v5 frontend for Money Flow, a personal transaction tracking app.

## Stack
- React 18 + TypeScript 5 (strict mode)
- MUI v5 (Material UI) — design system
- React Router v6
- Axios for API calls
- @mui/x-date-pickers for date inputs

## Project Structure
```
src/
  App.tsx               ← Router + layout (AppBar + Tabs)
  axiosInstance.ts      ← Axios config (reads REACT_APP_API_URL)
  types.ts              ← Shared types: ExpenseRequest, ExpenseResponse
  theme.ts              ← MUI theme (minimal for Phase 1)
  components/
    AddExpense.tsx       ← Add expense page
    AddExpenseForm.tsx   ← Dialog form for adding expense
    EditExpense.tsx      ← Edit expense page (stub — needs implementation)
    ExpenseList.tsx      ← List all expenses
  services/
    api.ts              ← API calls: createExpense, getExpenses, updateExpense, deleteExpense
```

## Environment Variables
```
REACT_APP_API_URL=http://localhost:3001
```
Create `.env.local` for local dev. Never commit it.

## API
All calls go through `src/services/api.ts` → `src/axiosInstance.ts`.
Backend base URL comes from `REACT_APP_API_URL` env var.

## Design Rules (MUI v5)
- Primary color: #1976d2 (MUI default blue)
- All inputs: `<TextField fullWidth />` with `label` prop
- Buttons: `variant="contained"` for primary, `variant="outlined"` for secondary
- No custom CSS — use MUI `sx` prop or `style` only when necessary
- Icons: `@mui/icons-material` only

## Dev Commands
```bash
yarn install
yarn start      # dev server on http://localhost:3000
yarn build      # production build
yarn test       # run tests
```

## Coding Rules
- No `any` types — use types from `src/types.ts`
- No hardcoded API URLs — always use axiosInstance
- No third-party UI libraries — MUI only
- Keep components in `src/components/`
- Keep API calls in `src/services/api.ts`

## Branch Strategy
- `main` ← production only
- `develop` ← integration
- `feature/*` ← your working branch, open PRs to develop

## Phase 1 Scope
- [x] AddExpense + AddExpenseForm
- [x] ExpenseList
- [x] axiosInstance with env var
- [ ] EditExpense (needs implementation)
- [ ] Login + Register pages (JWT auth)
- [ ] Deploy to Vercel
