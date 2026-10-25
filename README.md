# RupeeWise AI

**Every rupee has a purpose.**

RupeeWise AI is a money-management and scam-awareness prototype for Indian
college students. It helps students understand their allowance and expenses,
build savings habits, and inspect suspicious money messages before acting on
them.

> RupeeWise AI is an educational prototype. It does **not** connect to a bank
> account, move money, or contact anyone on your behalf. All financial data in
> the app is fictional sample data or data you enter yourself.

## Features

- **Landing page** — product overview with a preview of the dashboard.
- **Overview dashboard** — allowance, income, expenses, remaining balance,
  category spending, budget health and goal progress in one view.
- **Transactions** — add, edit, delete, search, filter and sort income and
  expense entries. Amounts, dates, descriptions, categories and notes are
  validated.
- **Budgets** — one limit per category with safe, near-limit and over-limit
  states, plus remaining/overspent amounts.
- **Savings goals** — target amount, saved amount, target date, progress, and
  add/withdraw activity. Goal savings are self-reported and do not change
  income, expense or budget totals.
- **Insights** — monthly income, expense and category breakdowns, budget
  warnings, month-over-month comparisons and an affordability calculator.
- **AI Money Coach** (`/coach`) — context-aware guidance with conversation
  history, suggested questions, explained figures, and a transparent rule-based
  mode that works with no API key.
- **Scam Check** (`/scam-check`) — local rule-based analysis of pasted
  messages, with warning signs, explanations, practical next steps, official
  verification channels, and an indicative-only disclaimer.
- **Settings** (`/settings`) — clearly labelled placeholder for a later stage.

All demo content is marked as fictional sample data, and the app says so in the
UI.

## Technology

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, `cacheComponents`) |
| UI | React 19, TypeScript 5 |
| Styling | Tailwind CSS 4 via `@tailwindcss/turbopack`, plus a hand-written design system in `src/app/globals.css` |
| Icons | Lucide React |
| Charts | Recharts |
| Persistence | Browser `localStorage` (no database, no accounts) |
| AI (optional) | Server-side OpenAI-compatible chat-completions adapter |

There is no authentication, no database, no bank integration and no payment
processing.

## Requirements

- Node.js **20.9 or newer** (required by Next.js 16)
- npm

## Run locally

```bash
git clone https://github.com/faroqkhan38329-dotcom/RupeeWise-AI.git
cd RupeeWise-AI
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

No environment variables are required to run the app. Without an AI provider,
the coach and Scam Check run entirely on local rules.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build (also type-checks the project) |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run `tsc --noEmit` |

### Checks

```bash
npm run lint
npm run typecheck
npm run build
```

## Routes

| Route | Description |
| --- | --- |
| `/` | Landing page |
| `/dashboard` | Money overview |
| `/transactions` | Income and expense entries |
| `/budgets` | Category budgets |
| `/goals` | Savings goals |
| `/insights` | Spending patterns and affordability calculator |
| `/coach` | AI Money Coach |
| `/scam-check` | Scam awareness and message check |
| `/settings` | Planned for a later stage |

API routes:

| Route | Methods | Description |
| --- | --- | --- |
| `/api/coach` | `GET`, `POST` | Provider status; coach answers (rules or AI) |
| `/api/scam-check` | `GET`, `POST` | Provider status; optional consent-gated AI note |

## Environment variables

All variables are server-only. None use the `NEXT_PUBLIC_` prefix, so no key or
model name is sent to the browser.

| Variable | Required | Purpose |
| --- | --- | --- |
| `AI_PROVIDER_API_KEY` | Yes, to enable AI | Server-side API key |
| `AI_PROVIDER_MODEL` | Yes, to enable AI | Model identifier accepted by your provider |
| `AI_PROVIDER_BASE_URL` | No | Defaults to `https://api.openai.com/v1`. HTTPS is required, except for localhost testing |
| `AI_PROVIDER_TIMEOUT_MS` | No | Provider timeout, clamped to 5–45 seconds. Defaults to 20 seconds |

Copy the template and fill in real values locally:

```bash
cp .env.example .env.local
```

```dotenv
AI_PROVIDER_API_KEY=your-key-here
AI_PROVIDER_MODEL=your-model-id
AI_PROVIDER_BASE_URL=https://api.openai.com/v1
AI_PROVIDER_TIMEOUT_MS=20000
```

Rules:

- `.env.local` is ignored by Git. Never commit a real key.
- Restart the server after changing environment variables.
- If the variables are missing or incomplete, the app stays fully usable in
  rule-based mode and says so in the UI.

## AI Money Coach

The coach always has a working rule-based mode. It reads **aggregate figures**
from this browser's saved data: starting allowance, recorded income and
expenses, category totals, budget limits and goal totals. Transaction
descriptions, transaction notes, goal names and goal descriptions are never
included in the coach context.

- Rule-based answers are labelled **Rule-based guide** and are generated from
  code, not by a model.
- When a provider is configured, the question, recent conversation and the
  aggregate figures are sent to that provider and the answer is labelled
  **AI-assisted**.
- If the provider fails, the page shows an error with Retry and a rule-based
  fallback. Rule-based output is never presented as model-generated.
- Conversation history lives in page memory only and is not written to browser
  storage.

## Scam Check

Scam Check runs nine local rules in the browser before anything else. It looks
for:

- requests for OTPs, PINs, passwords or card security codes;
- urgent payment or transfer pressure;
- links, including shortened, raw-IP and unusual-domain addresses;
- bank or payment-app impersonation;
- delivery and courier impersonation;
- government, tax, refund or scholarship impersonation;
- unknown-app installs, APK files, screen sharing and remote access;
- guaranteed prizes, lotteries, reward claims and prize fees;
- requests to keep the matter secret.

Results list the warning signs, explain why each one matters, suggest practical
next steps, and point to official verification channels. Every result states
that the check is indicative only and cannot prove a message safe or fraudulent.

The checker never opens links, executes attachments, contacts the sender or
starts a payment. Pasted messages are validated, treated as untrusted data and
are not stored or logged. If an AI provider is configured, the optional AI panel
requires explicit consent before the message is sent; the rule-based result
always appears first and remains the primary analysis. The AI note is separately
labelled and is never mixed into the rule output.

## Data, privacy and safety

- Financial data and theme preference are stored in this browser only, under
  `rupeewise.finance.v1` and `rupeewise-theme`.
- Stored data is validated when loaded. Malformed or unsafe records are dropped
  with a visible notice instead of crashing the page.
- Pasted scam messages and coach conversations are not persisted by the app.
- Provider secrets live in server environment variables, never in client code.
- Suspicious messages and financial details are never logged.
- The app never asks for UPI PINs, OTPs, banking passwords or card security
  codes, and it warns users not to share them.
- Guidance is educational and is not professional financial, legal or security
  advice.

## Accessibility and responsive design

- Semantic landmarks and page headings, with no skipped heading levels.
- Every form control has a visible, programmatically associated label.
- Modals trap focus, close on Escape or backdrop click, and restore focus.
- Icon-only buttons have accessible names.
- Budget and error states use text and icons, not colour alone.
- Animations respect `prefers-reduced-motion`.
- Tested at 390px, 768px and 1280px widths with no horizontal overflow.

## Project structure

```text
src/
  app/
    api/coach/route.ts        Coach endpoint (rules or provider)
    api/scam-check/route.ts   Consent-gated AI second opinion
    coach/page.tsx            Coach page (request-time provider status)
    scam-check/page.tsx       Scam Check page
    ...                       Feature pages, layout and global styles
  components/                 Shared UI, feature views and forms
  lib/
    finance.ts                Types, calculations and validation
    finance-storage.ts        Versioned localStorage load/save
    finance-store.ts          Client store via useSyncExternalStore
    coach.ts                  Coach context, rules, figures and prompt
    scam-rules.ts             Scam rule engine, demos and next steps
    ai-provider.ts            Server-only provider adapter
    api-utils.ts              Request/response helpers
    use-focus-trap.ts         Modal focus management
```

## Deploy to Vercel

1. Push the repository to GitHub (see below).
2. In [Vercel](https://vercel.com/new), choose **Add New → Project** and import
   `faroqkhan38329-dotcom/RupeeWise-AI`.
3. Keep the detected settings:
   - Framework preset: **Next.js**
   - Build command: `npm run build`
   - Output directory: default (`.next`)
   - Install command: `npm install`
   - Root directory: repository root
4. *(Optional)* Add the AI variables under **Settings → Environment Variables**
   for Production and Preview. Leave them unset to deploy in rules-only mode.
5. Select **Deploy**.

Notes:

- `AI_PROVIDER_*` variables are read on the server at request time. Changing
  them requires a redeploy or restart.
- Never add these variables with a `NEXT_PUBLIC_` prefix.
- The API routes run as Node.js functions; no extra configuration is needed.

### Publish to GitHub

The target repository is
`https://github.com/faroqkhan38329-dotcom/RupeeWise-AI.git`.

```bash
git init -b main            # skip if this folder is already a repository
git add .
git status --short          # confirm no node_modules, .next or .env files
git commit -m "RupeeWise AI: stages 1-7"
git remote add origin https://github.com/faroqkhan38329-dotcom/RupeeWise-AI.git
git push -u origin main
```

If the remote already exists, check it with `git remote -v` instead of adding it
again. Never force-push to a repository that already contains work.

## Development roadmap

- [x] Stage 1: Project setup, design system, and navigation
- [x] Stage 2: Financial calculations and working dashboard demo
- [x] Stage 3: Transactions, budgets, and supporting views
- [x] Stage 4: Savings goals, affordability calculator, and insights
- [x] Stage 5: AI Money Coach and scam-awareness features
- [x] Stage 6: Validation, accessibility, responsiveness, and polish
- [x] Stage 7: Repository preparation and deployment documentation
