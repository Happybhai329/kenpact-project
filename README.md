# Sweety — Blood Glucose Tracker

A production-ready full-stack web application built for diabetes patients to record up to **4 blood glucose readings per day** and analyze **daily**, **month-to-date**, and **previous-month** reports with interactive trend charts.

Built with **Node.js + Express 5**, **PostgreSQL (Prisma ORM)**, and **React 19 + Vite + Tailwind CSS**.

---

## Features

### Required Core Features
- **Authentication:** User sign up and login with `bcryptjs` password hashing and JWT tokens. Each user only sees and manages their own readings (full multi-tenant data isolation).
- **Readings Management:** Add, view, edit, and delete readings with date, time slot (`Morning (fasting)`, `After breakfast`, `After lunch`, `After dinner`), and value in `mg/dl`.
- **Full Validation (Client + Server):**
  - Required glucose value
  - Whole number strictly between `40` and `600 mg/dl`
  - Maximum 1 reading per time slot per day
  - Maximum 4 readings per day
  - Future dates disallowed
- **Reports:** Daily, Month-to-Date (1st of month to selected date), and Monthly (full previous calendar month) summaries showing reading count, highest, lowest, average (rounded to 1 decimal), friendly empty states, and daily slot breakdown.

### Bonus Features Implemented
- 🐳 **Docker & Docker Compose:** Multi-stage Dockerfiles for client (Nginx) & server + `docker-compose.yml` for 1-command startup.
- 📄 **Pagination** on `GET /api/readings?page=1&limit=20` with page metadata.
- 📈 **Interactive Trend Charts** using Recharts with low (`70 mg/dl`) and target (`140 mg/dl`) clinical reference lines.
- 🛡️ **Rate Limiting & Security:** `express-rate-limit` on auth (20 req/15m) and general API (100 req/m), plus `helmet` security headers.
- 📥 **CSV Data Export:** One-click download of report readings to CSV spreadsheet for sharing with physicians.
- 🚦 **Password Strength Indicator:** Real-time visual entropy meter on registration.
- 🧱 **Error Boundary & Skeleton Loaders:** React 19 Error Boundary for graceful crash handling and pulse skeletons for loading states.
- 📱 **Responsive Navbar:** Sticky navbar with active route indicators and mobile collapsible menu.
- 🧪 **Comprehensive Automated Tests (50 Tests Total):**
  - **23 Backend Integration Tests** (`node --test` + Supertest) covering health, auth, full CRUD, all 5 business validation rules, pagination, boundary conditions, and report aggregations.
  - **27 Frontend Component Tests** (Vitest + React Testing Library) covering `ReadingForm`, `ReadingCard`, `LoginPage`, `RegisterPage`, and `Navbar`.
- ⚡ **Optimized Vendor Code-Splitting:** Custom Rolldown chunking for React core and Recharts with zero oversized chunk warnings.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, React Router 7, Tailwind CSS v4, Recharts, Axios, react-hot-toast |
| Backend | Node.js, Express 5, express-validator, express-rate-limit, JWT, bcryptjs, Helmet, Morgan |
| Database | PostgreSQL (Supabase) + Prisma ORM (`@prisma/adapter-pg` + `pg` pool) |
| Container | Docker + Docker Compose + Nginx Alpine |
| Testing | Node Test Runner + Supertest (server: 23 tests), Vitest + React Testing Library (client: 27 tests) |

---

## Project Structure

```
sweety/
├── docker-compose.yml            # Multi-container orchestration (DB + Server + Client)
├── .dockerignore
├── server/
│   ├── Dockerfile                # Production Node.js Alpine container
│   ├── prisma/
│   │   └── schema.prisma         # User & Reading models + Slot enum
│   ├── src/
│   │   ├── config/prisma.js      # Shared Prisma + pg pool adapter instance
│   │   ├── middleware/           # JWT auth, rate limiter & centralized error handler
│   │   ├── modules/
│   │   │   ├── auth/             # Register, login, profile (/me)
│   │   │   ├── readings/         # CRUD + 5 assignment business validations
│   │   │   └── reports/          # Daily, month-to-date, monthly reports
│   │   ├── utils/                # AppError & UTC calendar date helpers
│   │   ├── app.js                # Express app configuration & middleware
│   │   └── server.js             # Entry point & graceful shutdown
│   ├── tests/
│   │   ├── api.test.js           # Core API & validation integration tests
│   │   ├── auth.test.js          # Auth edge cases, /me, & security tests
│   │   └── readings-extra.test.js# Pagination, boundaries, & filter tests
│   ├── seed.js                   # Demo account + 45 days of sample readings
│   └── .env.example
├── client/
│   ├── Dockerfile                # Multi-stage build + Nginx Alpine server
│   ├── nginx.conf                # SPA routing & caching configuration
│   ├── src/
│   │   ├── api/axios.js          # Axios client + JWT interceptors
│   │   ├── components/           # Navbar, PrivateRoute, ReadingForm, ReadingCard, Skeleton, ErrorBoundary
│   │   ├── context/AuthContext.jsx
│   │   ├── pages/                # LoginPage, RegisterPage, DashboardPage, ReportsPage
│   │   └── utils/                # Date helpers & CSV export
│   ├── tests/
│   │   ├── ReadingForm.test.jsx  # Form validations & submissions
│   │   ├── ReadingCard.test.jsx  # Card badges & delete confirmations
│   │   ├── LoginPage.test.jsx    # Login validations & Fill Demo
│   │   ├── RegisterPage.test.jsx # Register validations & submissions
│   │   └── Navbar.test.jsx       # Navigation & mobile menu
│   └── .env.example
├── .env.example
└── README.md
```

---

## Setup & Installation

### Option A: Local Development

#### Prerequisites
- **Node.js** v20+ (tested on v22.14.0)
- **PostgreSQL** database (e.g. Supabase, Neon, or local PostgreSQL)

#### 1. Clone the repository
```bash
git clone https://github.com/Happybhai329/kenpact-project.git
cd kenpact-project
```

#### 2. Configure Environment Variables
```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

**Backend (`server/.env`):**
```env
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
JWT_SECRET="sweety_super_secret_jwt_key_2026"
JWT_EXPIRES_IN="7d"
PORT=5000
CLIENT_URL="http://localhost:5173"
```

**Frontend (`client/.env`):**
```env
VITE_API_URL="http://localhost:5000/api"
```

#### 3. Install Dependencies & Seed Database
```bash
# Server setup
cd server
npm install
npx prisma generate
npx prisma db push
npm run db:seed

# Client setup
cd ../client
npm install
```

#### 4. Run the Application
Open two terminals:

```bash
# Terminal 1 — Backend API (http://localhost:5000)
cd server
npm run dev

# Terminal 2 — React Frontend (http://localhost:5173)
cd client
npm run dev
```

---

### Option B: Docker Compose (Bonus)

Run the entire stack (PostgreSQL + Server + Client) with a single command:

```bash
docker-compose up --build
```

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **PostgreSQL:** localhost:5433

---

## Demo Account

After running `npm run db:seed`, you can log in immediately with:
- **Email:** `demo@sweety.com`
- **Password:** `demo1234`

*(There is also a convenient **Fill Demo** button on the Login screen).*

---

## Running Tests

Sweety includes **50 automated tests** across both backend and frontend:

```bash
# Run backend tests (23 tests: auth, CRUD, validation rules, reports, pagination)
cd server
npm test

# Run frontend tests (27 tests: ReadingForm, ReadingCard, LoginPage, RegisterPage, Navbar)
cd ../client
npm test
```

---

## API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | No | Service health check |
| `POST` | `/api/auth/register` | No (Rate-limited) | Register a new patient |
| `POST` | `/api/auth/login` | No (Rate-limited) | Authenticate and receive JWT |
| `GET` | `/api/auth/me` | Yes | Get authenticated user profile |
| `GET` | `/api/readings?page=1&limit=20&date=` | Yes | List paginated readings (optional `date` filter) |
| `POST` | `/api/readings` | Yes | Add reading (enforces all 5 validation rules) |
| `PUT` | `/api/readings/:id` | Yes | Update existing reading |
| `DELETE` | `/api/readings/:id` | Yes | Delete reading |
| `GET` | `/api/reports/daily?date=YYYY-MM-DD` | Yes | Daily summary + slot breakdown |
| `GET` | `/api/reports/month-to-date?date=YYYY-MM-DD` | Yes | 1st of month through selected date |
| `GET` | `/api/reports/monthly?date=YYYY-MM-DD` | Yes | Full previous calendar month summary |

---

## Notes & Engineering Decisions

### Assumptions & Implementation Details
- **Whole-number glucose values:** Readings are stored as integers (`40–600 mg/dl`), rejecting decimals such as `95.5`.
- **Timezone-safe calendar dates:** Readings represent calendar dates (`DATE` column in PostgreSQL). Dates are parsed and formatted in UTC to prevent off-by-one calendar shifts across timezones.
- **Future date validation:** Validated against the user's local calendar date (`YYYY-MM-DD`) so readings logged shortly after midnight are never mistakenly rejected.
- **Monthly report definition:** Returns all readings for the full previous calendar month relative to the selected reference date (e.g., selecting `15 Oct 2026` summarizes `1 Sep – 30 Sep 2026`).
- **Averages:** Rounded to 1 decimal place (`toFixed(1)`).
- **Graceful Error Handling:** Centralized operational errors using custom `AppError` class with consistent JSON payloads `{ status: 'error', message: '...' }`.

### What I'd Improve With More Time
- **Refresh Token Rotation & HttpOnly Cookies:** Transition from localStorage to secure `HttpOnly` cookie-based sessions with short-lived access tokens.
- **Redis Caching:** Cache aggregated report results and invalidate the cache upon reading creations, updates, or deletions.
- **BullMQ Background Reminder Job:** Schedule a daily reminder for patients who have logged fewer than 4 readings by evening.
- **Playwright End-to-End Suite:** Add full browser automation tests running against live PostgreSQL in CI.
