# Money Flow Web — Product Document

## Overview

**What:** Money Flow Web is the React + Vite + MUI single-page app that runs in the browser. It is the desktop-first companion to the Money Flow mobile app — same backend, same account, optimised for keyboard-driven entry and wide-screen analytics.

**Who:** Individuals who manage money on a laptop. Users who prefer typing over tapping for bulk entry, monthly review, and reporting workflows.

**Core problem:** Mobile is great for capturing one expense in five seconds, but reviewing a month, reconciling a bank statement, or exploring trends needs more screen real estate, multi-column tables, and keyboard shortcuts. The web app makes Money Flow practical for the "Sunday afternoon money review" use case.

**Repo role:** Browser SPA only. All persistence lives in `money-flow-backend`. Authentication, transaction CRUD, budgets, goals, reports — every write hits the API. The frontend never owns canonical state.

---

## Features

### 1. Authentication

**Description:** Sign in via email/password, Google OAuth, or Apple Sign-In.

**User flow:**
1. Land on `/login` (unauthenticated users redirected here)
2. Enter email + password OR click Google/Apple button
3. JWT stored in `localStorage` (`token` key)
4. Redirect to dashboard (`/`)
5. Sign-out from Settings shows a confirmation dialog (PR #204)

**Acceptance criteria:**
- [ ] `/login` and `/register` routes exist and render the corresponding pages
- [ ] Login/register submits to `POST /auth/login` / `POST /auth/register`
- [ ] Google + Apple OAuth buttons present and functional
- [ ] Successful login persists JWT to `localStorage` and redirects to dashboard
- [ ] Protected routes redirect to `/login` when no JWT
- [ ] Sign-out shows a confirmation dialog before clearing token
- [ ] `/privacy` route serves the App Store / Play Store privacy URL

---

### 2. Dashboard (Home tab)

**Description:** At-a-glance summary of the current month's financial state — net spend, summary cards with month-over-month deltas, near-budget warnings, savings goal progress, recurring bills due, and the AI-generated Spending Pulse narrative.

**User flow:**
1. Sign in → land on `/` (Home tab)
2. Read the month-to-date summary cards (income, expenses, net) with MoM delta chips
3. Skim the Spending Pulse card for AI narrative
4. See near-budget warnings if any category > 80%
5. Tap Quick Add or use the FAB to log a transaction

**Acceptance criteria:**
- [ ] Summary cards show MTD income, expenses, net (PR #238)
- [ ] Each card displays a comparison delta vs previous month (PR #238)
- [ ] Near-budget warning alerts surface when any category exceeds threshold (PR #237)
- [ ] Spending Pulse narrative card renders for current week (PR #240/#241)
- [ ] Empty state handled gracefully (no crash on a fresh account)

---

### 3. Transactions CRUD

**Description:** Create, edit, delete expenses and incomes. Includes NLP sentence input, smart auto-suggest, multi-currency, payment method, tags, split-bill / treat / participate options, and group expenses.

**User flow:**
1. Click `+` (FAB) or open Transactions tab → "Add"
2. Either type a sentence ("lunch at subway 12.50") for NLP parsing OR fill structured fields
3. Optionally attach tags, mark as split bill / treat / participate
4. Save — new row appears at top of transactions list

**Acceptance criteria:**
- [ ] Add Transaction modal accepts amount, description, category, date, paymentMethod, type (expense/income), notes
- [ ] NLP sentence input parses to structured fields via `POST /api/transactions/parse-text` (PR #216)
- [ ] Smart auto-suggest ranks recent participants and time-aware items (PR #215)
- [ ] Tags multi-select with autocomplete from historical tags (PR #271)
- [ ] Split-bill / My-Treat / Participate toggle with active-state colors (PR #220, #221, #217)
- [ ] Edit and delete operations update list optimistically
- [ ] Keyboard accessibility on the type selector (PR #203)
- [ ] Payment-method enum aligned with backend snake_case (PR #208)
- [ ] Delete background remains hidden at rest on transaction cards (PR #206)

---

### 4. Transaction Tags

**Description:** Custom tags ("business", "client-alpha", "reimbursable") for cross-cutting expense organization. Complements categories.

**User flow:**
1. Open Add/Edit Transaction
2. In the Tags field, type → existing tags autocomplete; press Enter to create new tag inline
3. Tags appear as chips on transaction cards in the list
4. Use the FilterBar tag filter to narrow the list to tagged transactions
5. Manage tags (rename, delete, change color) from Settings → Tags

**Acceptance criteria:**
- [ ] `TagPicker` autocomplete on Add/Edit forms, fetches `GET /api/tags`
- [ ] Inline tag creation (type + Enter) calls `POST /api/tags`
- [ ] Tag chips render on transaction cards and desktop table rows
- [ ] FilterBar includes tag-based multi-select filter
- [ ] Tag names match in transaction search
- [ ] Settings → Tags screen supports rename, delete, color-set
- [ ] All tag state managed via `useTags` hook (PR #271, commit `061a92c`)

---

### 5. Budgets

**Description:** Monthly category budgets with progress bars, near-budget alerts, and budget-vs-actual summary.

**User flow:**
1. Settings → Budgets → set monthly limit per category
2. Dashboard shows progress relative to budget for each tracked category
3. Near-budget warning surfaces when any category passes 80%
4. Reports tab shows budget-vs-actual breakdown for the chosen month

**Acceptance criteria:**
- [ ] Set, update, delete budget per category
- [ ] Summary endpoint (`GET /budgets/summary`) drives progress bars
- [ ] Near-budget alerts on dashboard (PR #237)
- [ ] Budgets persist via backend API

---

### 6. Recurring Transactions

**Description:** Track subscriptions and recurring bills as a dedicated tab — start date picker, frequency, edit, pause/resume.

**User flow:**
1. Open Recurring tab from main nav
2. Add a recurring item with start date and frequency (daily/weekly/monthly/yearly)
3. Backend auto-creates expenses on schedule
4. Mark as paid one-tap from dashboard

**Acceptance criteria:**
- [ ] Recurring tab dedicated with start-date picker (PR #213)
- [ ] CRUD operations against `GET/POST/PUT/DELETE /api/recurring`
- [ ] Frequency: daily / weekly / monthly / yearly

---

### 7. Savings Goals

**Description:** Named savings targets with progress tracking, manual contributions, and backend sync.

**User flow:**
1. Open Goals tab
2. Create a goal: name, target amount, target date
3. Add manual contributions over time
4. View progress bar and remaining amount

**Acceptance criteria:**
- [ ] Goals tab in main nav with `SavingsIcon`
- [ ] CRUD against `GET/POST/PUT/DELETE /api/goals` (PR #233)
- [ ] Manual contribution entry
- [ ] Progress visualisation (current vs target amount)

---

### 8. Net Worth Tracking

**Description:** Periodic snapshots of total assets minus liabilities, with historical trend chart.

**User flow:**
1. Open Net Worth tab
2. Add a snapshot (assets total, liabilities total, optional notes)
3. Chart shows historical trend across snapshots

**Acceptance criteria:**
- [ ] Net Worth tab in main nav
- [ ] CRUD against `GET/POST/PUT/DELETE /api/net-worth`
- [ ] Historical trend visible in chart form

---

### 9. Reports — Monthly + PDF Export

**Description:** Dedicated Reports tab with month picker, summary cards (income/expenses/net), category breakdown pie chart, top-5 categories with MoM deltas, budget-vs-actual bars, empty state, and PDF export via `window.print()`.

**User flow:**
1. Open Reports tab
2. Pick the month from the picker
3. Review summary cards, category pie, top-5 categories with delta chips, budget-vs-actual bars
4. Click "Download PDF" → styled print window opens for save-as-PDF

**Acceptance criteria:**
- [ ] Month picker drives the report
- [ ] Summary cards: income, expenses, net
- [ ] Category breakdown pie chart
- [ ] Top-5 categories with month-over-month % chips
- [ ] Budget vs actual progress bars
- [ ] Empty state for months with no data
- [ ] PDF download via styled print window
- [ ] Lazy-loaded chunk, ~14 kB raw / 4.5 kB gzipped (PR #272)
- [ ] 9 unit tests cover loading / error / empty / data-present paths

---

### 10. Insights

**Description:** Trend visualisations, encouraging empty-state messaging when not enough history exists, and weekly Spending Pulse narrative.

**User flow:**
1. Open Insights tab
2. View trend chart for the chosen period
3. If less than 2 months of data, show an encouraging "keep tracking" message instead of an empty chart

**Acceptance criteria:**
- [ ] Trends chart renders when data exists
- [ ] Encouraging copy displayed when trends have < 2 months data (PR #268)
- [ ] Spending Pulse narrative surfaces here and on dashboard (PR #240)

---

### 11. NLP Sentence Input

**Description:** Type a free-text sentence describing an expense; the parser extracts amount, description, category. Supports CJK and AI fallback for ambiguous inputs.

**User flow:**
1. From any add-transaction surface, type a full sentence ("coffee 4.50 at Starbucks")
2. System parses into structured fields (amount, description, category) via `POST /api/transactions/parse-text`
3. User can correct any field before saving

**Acceptance criteria:**
- [ ] NLP input field on Add Transaction (PR #216)
- [ ] Calls `POST /api/transactions/parse-text`
- [ ] Smart auto-suggest works alongside NLP for participants and items (PR #215)
- [ ] Auto-categorisation suggestions visible

---

### 12. Bank Statement Reconciliation

**Description:** Upload a bank statement (CSV/PDF), parse transactions, reconcile against existing expenses, deduplicate, bulk import.

**User flow:**
1. Settings → Bank Statement Import
2. Upload CSV or PDF
3. Preview parsed rows; deduplication highlights matches against existing expenses
4. Confirm to import the unmatched rows

**Acceptance criteria:**
- [ ] Settings → Bank Statement Reconciliation section (PR #243)
- [ ] CSV and PDF parsing supported
- [ ] Preview before commit
- [ ] Deduplication against existing expenses

---

### 13. Templates (Quick-Add)

**Description:** Save frequently-used expenses as templates for one-tap logging. Synced to backend.

**User flow:**
1. Save a current expense as a template
2. From Add screen, choose template → expense pre-filled with current date
3. Templates synced to backend via `POST /api/templates`

**Acceptance criteria:**
- [ ] Template CRUD synced to backend (PR #202)
- [ ] Apply template creates expense with today's date

---

### 14. Friends System

**Description:** Add friends for future expense splitting workflows.

**User flow:**
1. Settings → Friends
2. Send friend request via email or username
3. Pending requests visible until accepted/rejected
4. Friends list visible for future split-bill linking

**Acceptance criteria:**
- [ ] Friends section in Settings (PR #192)
- [ ] Send / accept / reject / remove flows
- [ ] Pending vs confirmed lists visible

---

### 15. Item Price History

**Description:** Track and compare prices of named items across purchases (e.g. "milk 4L"). Server-side hints reduce friction.

**User flow:**
1. While entering an expense, the description field surfaces past amounts for the same item
2. Insights tab shows price-history sparklines for recently-purchased items

**Acceptance criteria:**
- [ ] Server-side price hints integrated (PR #187)
- [ ] Last-amount and price-history endpoints both supported (`getLastAmounts`, `getPriceHistory`)
- [ ] Price-alert toggle surfaces for items with significant price changes (PR #191)

---

### 16. Settings

**Description:** Profile, currency preference, tag management, friends, bank statement import, theme, sign-out, privacy link.

**User flow:**
1. Open Settings tab
2. Update profile fields, base currency
3. Manage tags, friends, bank statement reconciliation, etc.
4. Sign out (with confirmation dialog)

**Acceptance criteria:**
- [ ] Profile settings persist via `PATCH /users/me`
- [ ] Base currency selector
- [ ] Tag management (rename, delete, color)
- [ ] Bank statement reconciliation entry point
- [ ] Sign-out confirmation dialog (PR #204)

---

### 17. Performance & Build

**Description:** The app is built with Vite (migrated from CRA) and uses route + tab + vendor code-splitting to keep the initial bundle small.

**Acceptance criteria:**
- [ ] Vite-based build (PR #269)
- [ ] Routes lazy-loaded (PR #270)
- [ ] Tabs lazy-loaded
- [ ] Vendor chunks split out
- [ ] Production build passes (`yarn build` succeeds)
- [ ] Docker support for local dev and production (PR #197)
- [ ] Playwright E2E tests cover critical user flows (PR #198)

---

## Out of Scope (Phase 1 boundaries)

The following are deliberately **not** in Phase 1. Do not ship without explicit CEO approval to expand scope.

- **Bill splitting / Split-expense settlement** — friends system exists, but no IOU ledger, no settle-up flow, no Venmo-style payment links. Tracked under `money-flow-backend#81` (Todo).
- **Investment portfolio tracking** — net worth captures totals only. No per-stock, per-crypto, per-account brokerage integration.
- **Bill payment** — Money Flow tracks expenses; it does not move money or pay bills.
- **Tax filing / receipts for accountants** — categorisation exists, but no Schedule C export, no CRA/IRS form generation.
- **Multi-user shared accounts** — every account is single-user. Friends are read-only references for future splitting, not co-owners.
- **Real-time bank account sync (Plaid / TrueLayer)** — bank statement reconciliation is upload-based only.
- **Native desktop app** — web is delivered as an SPA in the browser; no Electron / Tauri build.
- **Offline-first PWA** — service worker exists for caching but the app expects an online connection for reads/writes.
