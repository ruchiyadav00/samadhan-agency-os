# Samadhan Agency OS

A lightweight internal operations dashboard for a marketing/creative agency — manage clients, income, expenses, team members, incentives, and user access from a single workspace, with role-based permissions and an admin-controlled login system.

## Features

- **Clients** — add/edit clients, retainer or one-time billing, assign a project manager and team, track payments.
- **Income & Expenses** — log entries by type and date; monthly salaries are pulled automatically from the Team tab.
- **Team** — manage team members, roles, salaries, responsibilities, and the clients each works on.
- **Incentives** — configure a per-client incentive pool and split it across the assigned team members.
- **Users & access control** — admin creates logins with either full (Admin) access or Staff access limited to chosen modules. A separate "can see money figures" flag hides all amounts for roles like Sales or Project Manager.
- **Auth** — username/password login with bcrypt-hashed passwords and JWT tokens.

## Tech stack

- **Frontend:** React 18 + Vite, `lucide-react` icons, single-file UI in `frontend/src/AgencyOS.jsx`.
- **Backend:** Node.js + Express, JWT (`jsonwebtoken`), password hashing (`bcryptjs`), CORS.
- **Storage:** flat-file JSON (`backend/data.json`) via a small `db.js` helper — no database server required.

## Project structure

```
samadhan-full/
├── backend/
│   ├── server.js        # Express API (auth + CRUD routes)
│   ├── db.js            # loads/saves data.json
│   ├── data.json        # app data (users, clients, income, expenses, team)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── AgencyOS.jsx # entire app UI
│   │   ├── api.js       # API client
│   │   └── main.jsx
│   └── package.json
├── START-APP.bat        # start backend + frontend together (Windows)
├── start-backend.bat
└── start-frontend.bat
```

## Getting started

### 1. Backend (API — port 3001)

```bash
cd backend
npm install
npm start        # or: npm run dev  (nodemon, auto-reload)
```

Runs at `http://localhost:3001`.

### 2. Frontend (Vite — port 5173)

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

> On Windows you can also just run `START-APP.bat` to launch both at once.

### Default login

```
username: admin
password: admin123
```

Change this after first login. The admin account (`admin_root`) cannot be deleted.

## API overview

All routes are prefixed with `/api`. Every route except login requires an `Authorization: Bearer <token>` header. Non-admin users are further restricted by their assigned modules.

| Method | Route | Access |
|--------|-------|--------|
| POST | `/auth/login` | public |
| GET | `/data` | any logged-in user |
| POST/PUT | `/clients`, `/clients/:id` | `clients` module |
| DELETE | `/clients/:id` | admin |
| POST | `/income`, `/expenses` | matching module |
| PUT/DELETE | `/income/:id`, `/expenses/:id` | admin |
| POST/PUT | `/team`, `/team/:id` | `team` module |
| DELETE | `/team/:id` | admin |
| GET/POST/PUT/DELETE | `/users`, `/users/:id` | admin |

## Notes

- `backend/data.json` holds live application data (including bcrypt password hashes). Treat it as sensitive and avoid committing real client/financial data to a public repository.
- The frontend API base URL is set in `frontend/src/api.js` (`BASE`). Update it when deploying to a different backend host.
- CORS allowed origins are configured in `backend/server.js`.
