const express = require("express");
const cors    = require("cors");
const jwt     = require("jsonwebtoken");
const bcrypt  = require("bcryptjs");
const { store, save } = require("./db");

const app        = express();
const PORT       = process.env.PORT || 3001;
const JWT_SECRET = "samadhan_jwt_secret_2024";

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "https://frontend-ov79.onrender.com",
  ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",").map(s => s.trim()) : []),
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS: " + origin));
  },
  credentials: true,
}));
app.use(express.json());

// ══════════════════════════════════════════════════════════════
//  MIDDLEWARE
// ══════════════════════════════════════════════════════════════
function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

function adminOnly(req, res, next) {
  if (!req.user?.isAdmin)
    return res.status(403).json({ error: "Admin access required" });
  next();
}

// ── Module permission check: admin bypasses everything ────────
function hasModule(mod) {
  return (req, res, next) => {
    if (req.user?.isAdmin || (req.user?.permissions || []).includes(mod))
      return next();
    return res.status(403).json({ error: `No access to ${mod}` });
  };
}

const canSeeMoney = (user) => !!(user?.isAdmin || user?.canSeeMoney);

// ── Helper: strip password before sending user to client ──────
function safeUser(u) {
  const { password, ...rest } = u;
  return rest;
}

// ── Helper: find index or return 404 ─────────────────────────
function findOrFail(res, collection, id) {
  const idx = store[collection].findIndex((x) => x.id === id);
  if (idx === -1) { res.status(404).json({ error: "Not found" }); return -1; }
  return idx;
}

// ══════════════════════════════════════════════════════════════
//  AUTH
// ══════════════════════════════════════════════════════════════
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password)
    return res.status(400).json({ error: "Username and password required" });

  const user = store.users.find((u) => u.username === username);
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: "Incorrect username or password" });

  const payload = safeUser(user);
  const token   = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, user: payload });
});

// ══════════════════════════════════════════════════════════════
//  DATA  — single endpoint: returns all collections at once
// ══════════════════════════════════════════════════════════════
app.get("/api/data", auth, (req, res) => {
  const seeMoney = canSeeMoney(req.user);
  res.json({
    clients:  store.clients,
    income:   seeMoney ? store.income   : [],
    expenses: seeMoney ? store.expenses : [],
    team:     seeMoney ? store.team : store.team.map(({ salary, ...rest }) => rest),
  });
});

// ══════════════════════════════════════════════════════════════
//  CLIENTS
// ══════════════════════════════════════════════════════════════
// ── Helper: clean an incentive split map to numbers, only for given team ids ──
function cleanSplits(splits, teamIds) {
  const out = {};
  if (!splits) return out;
  (teamIds || []).forEach((id) => {
    if (splits[id] != null && splits[id] !== "") out[id] = Number(splits[id]) || 0;
  });
  return out;
}

app.post("/api/clients", auth, hasModule("clients"), (req, res) => {
  const teamIds = req.body.teamIds || [];
  const client = {
    id: req.body.id, name: req.body.name,
    services: req.body.services || "", source: req.body.source || "Other",
    billingType: req.body.billingType || "retainer",
    amount: Number(req.body.amount) || 0,
    dueDate: req.body.dueDate || "", dueDay: req.body.dueDay || 1,
    active: req.body.active !== false,
    projectManagerId: req.body.projectManagerId || "",
    teamIds,
    paid: req.body.paid || {},
    hasIncentive: Boolean(req.body.hasIncentive),
    incentivePercent: Number(req.body.incentivePercent) || 0,
    incentiveSplits: cleanSplits(req.body.incentiveSplits, teamIds),
  };
  store.clients.push(client);
  save();
  res.status(201).json(client);
});

app.put("/api/clients/:id", auth, hasModule("clients"), (req, res) => {
  const idx = findOrFail(res, "clients", req.params.id);
  if (idx === -1) return;
  const teamIds = req.body.teamIds || [];
  store.clients[idx] = {
    ...store.clients[idx],
    name:             req.body.name,
    services:         req.body.services         || "",
    source:           req.body.source           || "Other",
    billingType:      req.body.billingType,
    amount:           Number(req.body.amount)   || 0,
    dueDate:          req.body.dueDate          || "",
    dueDay:           req.body.dueDay           || 1,
    active:           req.body.active           !== false,
    projectManagerId: req.body.projectManagerId || "",
    teamIds,
    paid:             req.body.paid             || {},
    hasIncentive:     Boolean(req.body.hasIncentive),
    incentivePercent: Number(req.body.incentivePercent) || 0,
    incentiveSplits:  cleanSplits(req.body.incentiveSplits, teamIds),
  };
  save();
  res.json(store.clients[idx]);
});

app.delete("/api/clients/:id", auth, adminOnly, (req, res) => {
  const idx = findOrFail(res, "clients", req.params.id);
  if (idx === -1) return;
  store.clients.splice(idx, 1);
  save();
  res.json({ ok: true });
});

// ══════════════════════════════════════════════════════════════
//  INCOME
// ══════════════════════════════════════════════════════════════
app.post("/api/income", auth, hasModule("income"), (req, res) => {
  const item = {
    id: req.body.id, type: req.body.type || "", label: req.body.label || "",
    amount: Number(req.body.amount) || 0, date: req.body.date || "",
    clientId: req.body.clientId || "", period: req.body.period || "",
  };
  store.income.unshift(item);          // newest first
  save();
  res.status(201).json(item);
});

app.put("/api/income/:id", auth, adminOnly, (req, res) => {
  const idx = findOrFail(res, "income", req.params.id);
  if (idx === -1) return;
  store.income[idx] = {
    ...store.income[idx],
    type: req.body.type || "", label: req.body.label || "",
    amount: Number(req.body.amount) || 0, date: req.body.date || "",
  };
  save();
  res.json(store.income[idx]);
});

app.delete("/api/income/:id", auth, adminOnly, (req, res) => {
  const idx = findOrFail(res, "income", req.params.id);
  if (idx === -1) return;
  store.income.splice(idx, 1);
  save();
  res.json({ ok: true });
});

// ══════════════════════════════════════════════════════════════
//  EXPENSES
// ══════════════════════════════════════════════════════════════
app.post("/api/expenses", auth, hasModule("expenses"), (req, res) => {
  const item = {
    id: req.body.id, type: req.body.type || "", label: req.body.label || "",
    amount: Number(req.body.amount) || 0, date: req.body.date || "",
  };
  store.expenses.unshift(item);
  save();
  res.status(201).json(item);
});

app.put("/api/expenses/:id", auth, adminOnly, (req, res) => {
  const idx = findOrFail(res, "expenses", req.params.id);
  if (idx === -1) return;
  store.expenses[idx] = {
    ...store.expenses[idx],
    type: req.body.type || "", label: req.body.label || "",
    amount: Number(req.body.amount) || 0, date: req.body.date || "",
  };
  save();
  res.json(store.expenses[idx]);
});

app.delete("/api/expenses/:id", auth, adminOnly, (req, res) => {
  const idx = findOrFail(res, "expenses", req.params.id);
  if (idx === -1) return;
  store.expenses.splice(idx, 1);
  save();
  res.json({ ok: true });
});

// ══════════════════════════════════════════════════════════════
//  TEAM
// ══════════════════════════════════════════════════════════════
app.post("/api/team", auth, hasModule("team"), (req, res) => {
  const member = {
    id: req.body.id, name: req.body.name,
    role: req.body.role || "",
    salary: req.user.isAdmin ? Number(req.body.salary) || 0 : 0,
    responsibilities: req.body.responsibilities || "",
  };
  store.team.push(member);
  save();
  res.status(201).json(member);
});

app.put("/api/team/:id", auth, hasModule("team"), (req, res) => {
  const idx = findOrFail(res, "team", req.params.id);
  if (idx === -1) return;
  store.team[idx] = {
    ...store.team[idx],
    name: req.body.name, role: req.body.role || "",
    salary: req.user.isAdmin ? (Number(req.body.salary) || 0) : store.team[idx].salary,
    responsibilities: req.body.responsibilities || "",
  };
  save();
  res.json(store.team[idx]);
});

app.delete("/api/team/:id", auth, adminOnly, (req, res) => {
  const id  = req.params.id;
  const idx = findOrFail(res, "team", id);
  if (idx === -1) return;
  store.team.splice(idx, 1);
  // Clean up client references
  store.clients.forEach((c) => {
    c.teamIds = (c.teamIds || []).filter((x) => x !== id);
    if (c.projectManagerId === id) c.projectManagerId = "";
  });
  save();
  res.json({ ok: true });
});

// ══════════════════════════════════════════════════════════════
//  USERS  (admin only)
// ══════════════════════════════════════════════════════════════
app.get("/api/users", auth, adminOnly, (req, res) => {
  res.json(store.users.map(safeUser));
});

const MODULES = ["clients", "income", "expenses", "team", "users", "incentive"];
const cleanPermissions = (arr) =>
  Array.isArray(arr) ? arr.filter((m) => MODULES.includes(m)) : [];

app.post("/api/users", auth, adminOnly, (req, res) => {
  const { name, designation, username, password, isAdmin, teamMemberId, permissions, canSeeMoney } = req.body;
  if (!name || !username || !password)
    return res.status(400).json({ error: "Name, username and password are required" });
  if (store.users.find((u) => u.username === username.trim()))
    return res.status(400).json({ error: "Username already taken" });

  const newUser = {
    id:           "u_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    name, designation: designation || "",
    username:     username.trim(),
    password:     bcrypt.hashSync(password, 10),
    isAdmin:      Boolean(isAdmin),
    teamMemberId: teamMemberId || "",
    permissions:  cleanPermissions(permissions),
    canSeeMoney:  Boolean(canSeeMoney),
  };
  store.users.push(newUser);
  save();
  res.status(201).json(safeUser(newUser));
});

app.put("/api/users/:id", auth, adminOnly, (req, res) => {
  const idx = findOrFail(res, "users", req.params.id);
  if (idx === -1) return;
  const { name, designation, username, password, isAdmin, teamMemberId, permissions, canSeeMoney } = req.body;
  store.users[idx] = {
    ...store.users[idx],
    name, designation: designation || "",
    username: username.trim(),
    isAdmin: Boolean(isAdmin),
    teamMemberId: teamMemberId || "",
    permissions: cleanPermissions(permissions),
    canSeeMoney: Boolean(canSeeMoney),
    ...(password ? { password: bcrypt.hashSync(password, 10) } : {}),
  };
  save();
  res.json(safeUser(store.users[idx]));
});

app.delete("/api/users/:id", auth, adminOnly, (req, res) => {
  if (req.params.id === "admin_root")
    return res.status(400).json({ error: "Cannot delete the default admin account" });
  const idx = findOrFail(res, "users", req.params.id);
  if (idx === -1) return;
  store.users.splice(idx, 1);
  save();
  res.json({ ok: true });
});

// ══════════════════════════════════════════════════════════════
//  SERVER START
// ══════════════════════════════════════════════════════════════
app.listen(PORT, () => {
  console.log(`\n  Samadhan API running →`);
  console.log(`    http://localhost:${PORT}\n`);
});
