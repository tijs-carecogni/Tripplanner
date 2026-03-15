export function htmlEscape(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function generateId(prefix) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export function parseTags(raw) {
  return String(raw || "")
    .split(",")
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
}

export function normalizeCity(city) {
  return String(city || "").trim().toLowerCase();
}

export function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (degrees) => (degrees * Math.PI) / 180;
  const r = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDateTime(value) {
  if (!value) return "No date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export function formatShortDate(value) {
  if (!value) return "No date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

export function formatDurationMinutes(minutes) {
  const safe = Math.max(0, Math.round(minutes));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  if (!h) return `${m}m`;
  return `${h}h ${m}m`;
}

export function dateDiffDays(dateA, dateB) {
  const a = Date.parse(dateA);
  const b = Date.parse(dateB);
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.round((a - b) / (1000 * 60 * 60 * 24));
}

export function parseDateInput(value, endOfDay = false) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  if (endOfDay && String(value).length <= 10) {
    parsed.setHours(23, 59, 59, 999);
  }
  return parsed;
}
