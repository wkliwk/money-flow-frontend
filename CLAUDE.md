# money-flow-frontend

React + TypeScript SPA for personal finance tracking.

## Tech stack
- React 18, TypeScript, Create React App
- Material UI (MUI v5)
- Axios for API calls, JWT auth via localStorage (`mf_token`)
- Deployed on Vercel, CI via GitHub Actions

## Key files
- `src/App.tsx` — routing
- `src/components/MainLayout.tsx` — main dashboard
- `src/services/api.ts` — all API calls
- `src/axiosInstance.ts` — axios config with 401 handling
- `src/types.ts` — shared TypeScript types
- `.github/workflows/ci.yml` — build + Telegram notification

## Backend
- Production: https://money-flow-backend-production.up.railway.app
- Dev: http://localhost:3001
- Repo: /Users/ricky/Dev/money-flow-backend

## Product Goal
A simple expense tracking app that lets users log and review their spending. Prioritise simplicity and usability. Do not add features that complicate the core use case.

Anti-goals: no multi-user, no complex analytics, no over-engineering.

## Context
Before starting any task, read the last 10 lines of /Users/ricky/Dev/decisions.jsonl for recent decisions.
After completing any task, append one line to /Users/ricky/Dev/decisions.jsonl:
`{"date":"YYYY-MM-DD","project":"money-flow-frontend","prompt":"...","summary":"..."}`

## Session start workflow
When told to "start working" or similar:
1. `gh project item-list 1 --owner wkliwk --format json` → find status:"Todo" items
2. `gh project item-list 2 --owner wkliwk --format json` → same
3. Read last 10 lines of /Users/ricky/Dev/decisions.jsonl
4. Pick highest priority Todo and start immediately
5. If no Todo items → do genuine product thinking:
   - Read ~/ai-company/docs/PRD-money-flow.md
   - Review current codebase — what exists, what's rough, what's missing
   - Research market: what do YNAB, Copilot, Monarch Money, 1Money do well? Any creative features worth adapting?
   - Think from real user perspective: what friction exists day-to-day? what would make this meaningfully more useful?
   - Prefer ideas that are high user value but simple to build
   - Create GitHub issues with real acceptance criteria, add to project board, start top one
Never ask "what should I work on?"

## Autonomous operation rules
- You are running in a fully automated context with no human in the loop.
- Do not ask for approval. Make decisions and proceed.
- After completing a task: run `CI=false REACT_APP_API_URL=https://money-flow-backend-production.up.railway.app yarn build` to verify, then commit and push.
- Commit format: `type: short description` (feat, fix, refactor, chore)
- If a build or lint fails, fix it before committing. Do not use `--no-verify`.
- Do not add unnecessary comments, docstrings, or TODO markers.
- Prefer editing existing files over creating new ones.
- Keep changes minimal and focused on the task.
- After completing a task, immediately pick the next Todo item and continue without stopping.
