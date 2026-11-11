# Sweety — Blood Glucose Tracker

A full-stack web application built for diabetes patients to record up to **4 blood glucose readings per day** and analyze **daily**, **month-to-date**, and **previous-month** reports with interactive trend charts.

Built with **Node.js + Express**, **PostgreSQL (Prisma ORM)**, and **React + Vite + Tailwind CSS**.

---

## Features

### Required
- **Authentication:** User sign up and login with `bcryptjs` password hashing and JWT tokens. Each user only sees and manages their own readings.
- **Readings Management:** Add, view, edit, and delete readings with date, time slot (`Morning (fasting)`, `After breakfast`, `After lunch`, `After dinner`), and value in `mg/dl`.
- **Full Validation (Client + Server):**
  - Required glucose value
  - Whole number strictly between `40` and `600 mg/dl`
  - Maximum 1 reading per time slot per day
  - Maximum 4 readings per day
  - Future dates disallowed
- **Reports:** Daily, Month-to-Date (1st of month to selected date), and Monthly (full previous calendar month) summaries showing reading count, highest, lowest, average (rounded to 1 decimal), friendly empty states, and daily slot breakdown.

### Bonus Features Implemented
- **Pagination** on `GET /api/readings?page=1&limit=20`
- **Interactive Trend Charts** using Recharts with low (`70 mg/dl`) and target (`140 mg/dl`) reference lines
- **Automated Tests:** Backend API integration tests (`node --test` + Supertest) and frontend component tests (Vitest + React Testing Library)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Router, Tailwind CSS, Recharts, Axios, react-hot-toast |
| Backend | Node.js, Express, express-validator, JWT, bcryptjs, Helmet |
| Database | PostgreSQL (Supabase) + Prisma ORM (`@prisma/adapter-pg`) |
| Testing | Node Test Runner + Supertest (server), Vitest + React Testing Library (client) |

---

## Project Structure

```
sweety/
├── server/
│   ├── prisma/
│   │   └── schema.prisma         # User & Reading models + Slot enum
│   ├── src/
│   │   ├── config/prisma.js      # Shared Prisma + pg pool instance
│   │   ├── middleware/           # JWT auth & centralized error handler
│   │   ├── modules/
│   │   │   ├── auth/             # Register, login, profile
│   │   │   ├── readings/         # CRUD + business validations
│   │   │   └── reports/          # Daily, month-to-date, monthly reports
│   │   ├── utils/                # AppError & UTC calendar date helpers
│   │   ├── app.js                # Express app configuration
│   │   └── server.js             # Entry point & graceful shutdown
│   ├── tests/api.test.js         # API & validation tests
│   ├── seed.js                   # Demo account + 45 days of sample readings
│   └── .env.example
├── client/
│   ├── src/
│   │   ├── api/axios.js          # Axios client + JWT interceptors
│   │   ├── components/           # Navbar, PrivateRoute, ReadingForm, ReadingCard
│   │   ├── context/AuthContext.jsx
│   │   ├── pages/                # LoginPage, RegisterPage, DashboardPage, ReportsPage
│   │   └── utils/date.js         # Timezone-safe calendar date formatting
│   ├── tests/ReadingForm.test.jsx
│   └── .env.example
├── .env.example
└── README.md
```

---

## Setup & Installation

### Prerequisites
- **Node.js** v20+ (tested on v22.14.0)
- **PostgreSQL** database (local PostgreSQL or cloud like Supabase / Neon)

### 1. Clone the repository
```bash
git clone https://github.com/Happybhai329/kenpact-project.git
cd kenpact-project
```

### 2. Configure Environment Variables

Copy the example files and fill in your credentials:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

#### Backend (`server/.env`)
| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string (use Session Pooler on IPv4-only networks) | `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres` |
| `JWT_SECRET` | Secret key used to sign JWT tokens | `change_this_to_a_secure_random_string` |
| `JWT_EXPIRES_IN` | JWT token expiration window | `7d` |
| `PORT` | Express server port | `5000` |
| `CLIENT_URL` | Allowed CORS origin for frontend | `http://localhost:5173` |

#### Frontend (`client/.env`)
| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Base URL of the backend API | `http://localhost:5000/api` |

### 3. Install Dependencies & Set Up the Database

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

### 4. Run the Application

Open two terminals:

**Terminal 1 — Backend API (`http://localhost:5000`):**
```bash
cd server
npm run dev
```

**Terminal 2 — React Frontend (`http://localhost:5173`):**
```bash
cd client
npm run dev
```

### 5. Demo Account

After running `npm run db:seed`, you can log in immediately with:
- **Email:** `demo@sweety.com`
- **Password:** `demo1234`

*(There is also a one-click **Fill Demo** button on the Login screen.)*

---

## Running Tests

```bash
# Backend API & validation tests
cd server
npm test

# Frontend React Testing Library tests
cd ../client
npm test
```

---

## API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | No | Health check |
| `POST` | `/api/auth/register` | No | Register a new patient |
| `POST` | `/api/auth/login` | No | Authenticate and receive JWT |
| `GET` | `/api/auth/me` | Yes | Get current user profile |
| `GET` | `/api/readings?page=1&limit=20&date=` | Yes | List paginated readings (optional `date` filter) |
| `POST` | `/api/readings` | Yes | Add a reading (enforces all 5 validation rules) |
| `PUT` | `/api/readings/:id` | Yes | Update an existing reading |
| `DELETE` | `/api/readings/:id` | Yes | Delete a reading |
| `GET` | `/api/reports/daily?date=YYYY-MM-DD` | Yes | Daily summary + slot readings |
| `GET` | `/api/reports/month-to-date?date=YYYY-MM-DD` | Yes | 1st of month through selected date |
| `GET` | `/api/reports/monthly?date=YYYY-MM-DD` | Yes | Full previous calendar month summary |

---

## Notes

### Assumptions
- **Whole-number glucose values:** Readings are stored as integers (`40–600 mg/dl`), rejecting decimals such as `95.5`.
- **Calendar dates without timezone shift:** Readings represent a calendar date (`DATE` column in PostgreSQL) rather than an exact timestamp, so date strings (`YYYY-MM-DD`) are parsed and formatted in UTC to avoid off-by-one-day shifts across timezones.
- **"Future date" check:** Validated against the current local calendar date (`YYYY-MM-DD`) so readings recorded shortly after midnight are never mistakenly blocked by UTC lag.
- **Monthly report definition:** Returns all readings for the full previous calendar month relative to the selected date (e.g., selecting `15 Oct 2026` summarizes `1 Sep – 30 Sep 2026`).
- **Averages:** Rounded to 1 decimal place (`toFixed(1)`).

### What I'd Improve With More Time
- **Refresh token rotation + HttpOnly cookies:** Move auth tokens from `localStorage` to `HttpOnly` cookies with short-lived access tokens.
- **CSV / PDF export:** Allow patients to export monthly glucose reports directly to share with their doctor.
- **Redis caching & BullMQ reminders:** Cache aggregated report responses (invalidated on reading mutations) and schedule daily reminders for patients with fewer than 4 logged slots.
- **End-to-end tests:** Add Playwright tests covering real PostgreSQL persistence alongside the current unit/integration suites.
