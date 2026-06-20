/**
 * db.js  —  Simple JSON file store (no native deps, works on all platforms)
 * Data is kept in memory and written to data.json on every mutation.
 */

const fs     = require("fs");
const path   = require("path");
const bcrypt = require("bcryptjs");

const DB_FILE = path.join(__dirname, "data.json");

// ── Load or initialise ────────────────────────────────────────
function load() {
  try {
    if (fs.existsSync(DB_FILE))
      return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch (e) {
    console.warn("Could not load data.json, starting fresh.", e.message);
  }
  return { users: [], clients: [], income: [], expenses: [], team: [] };
}

const store = load();

// Ensure all collections exist (in case data.json is from an old version)
["users","clients","income","expenses","team"].forEach((k) => {
  if (!Array.isArray(store[k])) store[k] = [];
});

// ── Persist ───────────────────────────────────────────────────
function save() {
  fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2));
}

// ── Seed default admin on first run ──────────────────────────
if (!store.users.find((u) => u.username === "admin")) {
  store.users.push({
    id:           "admin_root",
    name:         "Admin",
    designation:  "Agency Owner",
    username:     "admin",
    password:     bcrypt.hashSync("admin123", 10),
    isAdmin:      true,
    teamMemberId: "",
  });
  save();
  console.log("✓ Default admin created  →  username: admin  |  password: admin123");
}

module.exports = { store, save };
