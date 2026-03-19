const express = require("express");
const fs = require("fs/promises");
const path = require("path");

const app = express();
const PORT = Number(process.env.PORT || 8787);
const ROOT_DIR = path.resolve(__dirname, "..");
const DATA_DIR = process.env.TRIPMIND_DATA_DIR
  ? path.resolve(process.env.TRIPMIND_DATA_DIR)
  : path.join(__dirname, "data");
const STORE_FILE = path.join(DATA_DIR, "trip-store.json");

app.use(express.json({ limit: "8mb" }));

function normalizeKey(value, fallback) {
  const text = String(value || "").trim();
  return text || fallback;
}

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function loadStore() {
  try {
    const raw = await fs.readFile(STORE_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed;
    return { users: {} };
  } catch {
    return { users: {} };
  }
}

async function saveStore(store) {
  await ensureDataDir();
  const tmpFile = `${STORE_FILE}.tmp`;
  await fs.writeFile(tmpFile, JSON.stringify(store, null, 2), "utf8");
  await fs.rename(tmpFile, STORE_FILE);
}

function getTripRecord(store, userId, tripId) {
  const user = store.users?.[userId];
  if (!user) return null;
  return user.trips?.[tripId] || null;
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "driftplan-backend" });
});

app.get("/api/state", async (req, res) => {
  const userId = normalizeKey(req.query.userId, "");
  const tripId = normalizeKey(req.query.tripId, "");
  if (!userId || !tripId) {
    res.status(400).json({ error: "userId and tripId are required" });
    return;
  }
  const store = await loadStore();
  const record = getTripRecord(store, userId, tripId);
  if (!record) {
    res.json({ found: false });
    return;
  }
  res.json({
    found: true,
    userId,
    tripId,
    updatedAt: record.updatedAt,
    state: record.state,
  });
});

app.put("/api/state", async (req, res) => {
  const userId = normalizeKey(req.body?.userId, "");
  const tripId = normalizeKey(req.body?.tripId, "");
  const incomingState = req.body?.state;
  if (!userId || !tripId) {
    res.status(400).json({ error: "userId and tripId are required" });
    return;
  }
  if (!incomingState || typeof incomingState !== "object") {
    res.status(400).json({ error: "state object is required" });
    return;
  }

  const store = await loadStore();
  if (!store.users[userId]) store.users[userId] = { trips: {} };
  if (!store.users[userId].trips) store.users[userId].trips = {};

  store.users[userId].trips[tripId] = {
    updatedAt: new Date().toISOString(),
    state: incomingState,
  };
  await saveStore(store);
  res.json({ ok: true, userId, tripId });
});

app.get("/api/trips", async (req, res) => {
  const userId = normalizeKey(req.query.userId, "");
  if (!userId) {
    res.status(400).json({ error: "userId is required" });
    return;
  }
  const store = await loadStore();
  const trips = Object.entries(store.users?.[userId]?.trips || {}).map(([tripId, record]) => ({
    tripId,
    updatedAt: record.updatedAt,
  }));
  trips.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  res.json({ userId, trips });
});

app.use(express.static(ROOT_DIR));

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Driftplan backend listening on http://localhost:${PORT}`);
});
