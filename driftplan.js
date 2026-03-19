/**
 * Driftplan — Frontend client for the FastAPI planning graph backend.
 * Handles rendering, user interaction, and API calls.
 */

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const API_BASE = window.location.origin;
let userId = localStorage.getItem("dp_user_id") || "default";
let tripId = localStorage.getItem("dp_trip_id") || "default";
let tripState = null;
let map = null;
let mapLayers = {};

// Extract binary/multiple choices from question text
function extractChoices(text) {
  // Look for patterns like "Do you prefer X or Y?" or "Would you rather A or B?"
  const choices = [];
  // Match "prefer X or Y" / "rather X or Y"
  const orPatterns = text.match(/(?:prefer|rather|drawn to|choose|want)\s+(.+?)\s+or\s+(.+?)[\?\.]/gi);
  if (orPatterns) {
    for (const match of orPatterns) {
      const parts = match.match(/(?:prefer|rather|drawn to|choose|want)\s+(.+?)\s+or\s+(.+?)[\?\.]/i);
      if (parts) {
        // Clean up and truncate long choices
        const a = parts[1].replace(/^(to |a |an )/i, "").trim();
        const b = parts[2].replace(/^(to |a |an )/i, "").trim();
        if (a.length < 80) choices.push(a.charAt(0).toUpperCase() + a.slice(1));
        if (b.length < 80) choices.push(b.charAt(0).toUpperCase() + b.slice(1));
      }
    }
  }
  return choices;
}

// ---------------------------------------------------------------------------
// DOM refs
// ---------------------------------------------------------------------------
const $ = (id) => document.getElementById(id);
const els = {
  chatForm: $("chatForm"),
  chatFormWelcome: $("chatFormWelcome"),
  chatInput: $("chatInput"),
  chatInputWelcome: $("chatInputWelcome"),
  chatState: $("chatState"),
  transcript: $("conversationTranscript"),
  welcomeBlock: $("welcomeBlock"),
  graphStatus: $("graphStatus"),
  itineraryList: $("itineraryList"),
  suggestionList: $("suggestionList"),
  softPoiList: $("softPoiList"),
  softPoiSection: $("softPoiSection"),
  gapSummary: $("gapSummary"),
  metaDestination: $("metaDestination"),
  metaDates: $("metaDates"),
  metaAnchors: $("metaAnchors"),
  metaNode: $("metaNode"),
  hardPointForm: $("hardPointForm"),
  settingsDrawer: $("settingsDrawer"),
  settingsBtn: $("settingsBtn"),
  closeDrawerBtn: $("closeDrawerBtn"),
  userId: $("userId"),
  tripId: $("tripId"),
  mapEl: $("map"),
  tripContextDisplay: $("tripContextDisplay"),
  userMemoryDisplay: $("userMemoryDisplay"),
};

// ---------------------------------------------------------------------------
// API client
// ---------------------------------------------------------------------------
async function apiChat(text) {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, trip_id: tripId, text }),
  });
  if (!res.ok) throw new Error(`Chat failed: ${res.status}`);
  return res.json();
}

async function apiGetTrip() {
  const res = await fetch(`${API_BASE}/api/trip/${userId}/${tripId}`);
  if (!res.ok) return null;
  return res.json();
}

async function apiFeedback(itemId, feedback, tags = []) {
  await fetch(`${API_BASE}/api/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, trip_id: tripId, item_id: itemId, feedback, tags }),
  });
}

async function apiSoftAdd(optionId) {
  await fetch(`${API_BASE}/api/trip/${userId}/${tripId}/soft-add?option_id=${optionId}`, { method: "POST" });
}

async function apiHardAdd(optionId) {
  await fetch(`${API_BASE}/api/trip/${userId}/${tripId}/hard-add?option_id=${optionId}`, { method: "POST" });
}

async function apiAddHardPoint(hp) {
  await fetch(`${API_BASE}/api/trip/${userId}/${tripId}/hardpoint`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, trip_id: tripId, hard_point: hp }),
  });
}

async function apiResetTrip() {
  await fetch(`${API_BASE}/api/trip/${userId}/${tripId}/reset`, { method: "POST" });
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------
function htmlEscape(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/** Lightweight markdown → HTML for assistant messages (safe: escapes first). */
function renderMd(raw) {
  let s = htmlEscape(raw);
  // Paragraphs: split on double newlines
  s = s.split(/\n{2,}/).map(p => {
    p = p.trim();
    // Unordered list block
    if (/^[-•*]\s/m.test(p)) {
      const items = p.split(/\n/).map(line =>
        line.replace(/^[-•*]\s+/, "").trim()
      ).filter(Boolean);
      return `<ul>${items.map(i => `<li>${inlineMd(i)}</li>`).join("")}</ul>`;
    }
    // Numbered list block
    if (/^\d+[.)]\s/m.test(p)) {
      const items = p.split(/\n/).map(line =>
        line.replace(/^\d+[.)]\s+/, "").trim()
      ).filter(Boolean);
      return `<ol>${items.map(i => `<li>${inlineMd(i)}</li>`).join("")}</ol>`;
    }
    return `<p>${inlineMd(p)}</p>`;
  }).join("");
  return s;
}

function inlineMd(s) {
  // Bold **text** or __text__
  s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/__(.+?)__/g, "<strong>$1</strong>");
  // Italic *text* or _text_ (but not inside words for _)
  s = s.replace(/\*(.+?)\*/g, "<em>$1</em>");
  s = s.replace(/(?<!\w)_(.+?)_(?!\w)/g, "<em>$1</em>");
  // Inline code
  s = s.replace(/`(.+?)`/g, "<code>$1</code>");
  // Line breaks
  s = s.replace(/\n/g, "<br>");
  return s;
}

function fmtDateLong(d) {
  if (!d) return "";
  return new Date(d + "T00:00").toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
}

function renderMetaBar(state) {
  if (!state) return;
  const ctx = state.trip_context || {};
  els.metaDestination.textContent = ctx.primary_destination || "No destination";
  const fmtDate = (d) => d ? new Date(d + "T00:00").toLocaleDateString("nl-NL", { day: "numeric", month: "short" }) : "";
  els.metaDates.textContent = ctx.start_date
    ? `${fmtDate(ctx.start_date)}${ctx.end_date ? ` → ${fmtDate(ctx.end_date)}` : ""}`
    : "No dates";
  els.metaAnchors.textContent = `${(state.hard_points || []).length} anchors`;

  const nodeLabels = {
    scaffold: "Setting up",
    assess: "Assessing",
    preference: "Learning you",
    fill_gaps: "Filling gaps",
    discover: "Discovering",
    refine: "Refining",
    idle: "Ready",
  };
  els.metaNode.textContent = nodeLabels[state.graph_node] || state.graph_node;
}

function renderConversation(state) {
  const layout = document.querySelector(".layout-3col");
  if (!state || !state.conversation || !state.conversation.length) {
    els.welcomeBlock.hidden = false;
    els.chatState.hidden = true;
    els.transcript.innerHTML = "";
    if (layout) layout.classList.add("is-welcome");
    return;
  }
  // Switch to chat state
  els.welcomeBlock.hidden = true;
  els.chatState.hidden = false;
  if (layout) layout.classList.remove("is-welcome");

  // Build scaffold summary card if we have trip context
  const ctx = state.trip_context || {};
  const hps = state.hard_points || [];
  const scaffoldCard = (ctx.primary_destination || hps.length)
    ? `<div class="scaffold-card">
        <div class="scaffold-title">${htmlEscape(ctx.primary_destination || "Your trip")}</div>
        ${ctx.start_date ? `<div class="scaffold-dates">${htmlEscape(fmtDateLong(ctx.start_date))}${ctx.end_date ? ` → ${htmlEscape(fmtDateLong(ctx.end_date))}` : ""}</div>` : ""}
        ${hps.length ? `<div class="scaffold-anchors">
          ${hps.map((hp) => `<span class="scaffold-anchor">${typeIcon(hp.type)} ${htmlEscape(hp.title)}${hp.location ? ` · ${htmlEscape(hp.location)}` : ""}</span>`).join("")}
        </div>` : ""}
        ${(ctx.must_include || []).length ? `<div class="scaffold-prefs"><strong>Must include:</strong> ${ctx.must_include.map((x) => htmlEscape(x)).join(", ")}</div>` : ""}
        ${(ctx.liked_examples || []).length ? `<div class="scaffold-prefs"><strong>Past favorites:</strong> ${ctx.liked_examples.map((x) => htmlEscape(x)).join(", ")}</div>` : ""}
      </div>`
    : "";

  els.transcript.innerHTML = state.conversation.map((msg) => {
    const isUser = msg.role === "user";
    const hasOptions = (msg.options || []).length > 0;
    const text = msg.text || "";

    if (isUser) {
      return `<article class="chat-message user"><div class="msg-text">${htmlEscape(text)}</div></article>`;
    }

    // Detect if this is a question/preference-building message
    const isQuestion = text.includes("?") && (text.includes("prefer") || text.includes("question") || text.includes("skip") || text.includes("tell me"));
    // Detect if this is a scaffold confirmation
    const isScaffold = text.startsWith("Got it") || text.startsWith("Noted");

    if (isScaffold) {
      return `<article class="chat-card scaffold-chat-card">
        <div class="chat-card-icon"><i data-lucide="check-circle"></i></div>
        <div class="chat-card-body">
          <div class="chat-card-title">Trip extracted</div>
          <div class="msg-text">${renderMd(text)}</div>
        </div>
      </article>`;
    }

    if (isQuestion) {
      // Extract question choices from text (look for "or" patterns and "?")
      const choices = extractChoices(text);
      const choiceHtml = choices.length
        ? `<div class="question-choices">${choices.map(c =>
            `<button type="button" class="question-choice" data-reply="${htmlEscape(c)}">${htmlEscape(c)}</button>`
          ).join("")}<button type="button" class="question-choice question-choice-skip" data-reply="skip">Skip</button></div>
          <div class="hint choices-hint">or type your own answer below</div>`
        : "";
      return `<article class="chat-card question-chat-card">
        <div class="chat-card-body">
          <div class="msg-text">${renderMd(text)}</div>
          ${choiceHtml}
          ${hasOptions ? `<div class="meta chat-options-hint">${msg.options.length} suggestions → see sidebar</div>` : ""}
        </div>
      </article>`;
    }

    return `<article class="chat-message assistant">
      <div class="msg-text">${renderMd(text)}</div>
      ${hasOptions ? `<div class="meta chat-options-hint">${msg.options.length} suggestions → see sidebar</div>` : ""}
    </article>`;
  }).join("");

  const chatScroll = document.getElementById("chatScroll");
  if (chatScroll) chatScroll.scrollTop = chatScroll.scrollHeight;
}

function renderOptionCard(opt, msgId) {
  const tags = (opt.tags || []).map((t) => `<span class="chip chip-sm">${htmlEscape(t)}</span>`).join("");
  const reasoning = opt.reasoning ? `<div class="option-reasoning">${htmlEscape(opt.reasoning)}</div>` : "";
  return `
    <div class="option-card" data-option-id="${opt.id}">
      <div class="option-head">
        <strong>${htmlEscape(opt.title)}</strong>
        <span class="meta">${htmlEscape(opt.kind || "")}${opt.city ? ` · ${htmlEscape(opt.city)}` : ""}</span>
      </div>
      ${opt.reason ? `<div class="option-desc">${htmlEscape(opt.reason)}</div>` : ""}
      ${reasoning}
      ${tags ? `<div class="chip-list">${tags}</div>` : ""}
      <div class="option-actions">
        <span class="action-group action-group--rate" aria-label="Rate this idea">
          <button type="button" class="btn-feedback btn-love" data-action="love" data-id="${opt.id}" title="Love this idea — show me more like it"><i data-lucide="heart" style="width:12px;height:12px"></i> Love</button>
          <button type="button" class="btn-feedback btn-maybe" data-action="maybe" data-id="${opt.id}" title="Interesting but not sure yet">Maybe</button>
          <button type="button" class="btn-feedback btn-no" data-action="no" data-id="${opt.id}" title="Not for me — show me fewer like this"><i data-lucide="x" style="width:12px;height:12px"></i> Skip</button>
        </span>
        <span class="action-group action-group--trip" aria-label="Add to trip">
          <button type="button" class="btn-feedback btn-add" data-action="soft-add" data-id="${opt.id}" title="Add to trip — flexible, can be moved or swapped"><i data-lucide="plus" style="width:12px;height:12px"></i> Add to trip</button>
          <button type="button" class="btn-feedback btn-lock" data-action="hard-add" data-id="${opt.id}" title="Lock in — this is a must-do, won't be moved"><i data-lucide="lock" style="width:12px;height:12px"></i> Lock in</button>
        </span>
      </div>
    </div>`;
}

function renderGraphStatus(response) {
  if (!response) { els.graphStatus.innerHTML = ""; return; }
  const action = response.suggested_action || "";
  const node = response.next_node || "";
  const nodeLabels = {
    scaffold: "Gathering trip basics",
    preference: "Learning your preferences",
    fill_gaps: "Filling open gaps",
    discover: "Finding new spots",
    refine: "Adding detail",
    idle: "Ready for your input",
  };
  els.graphStatus.innerHTML = `
    <div class="graph-status-inner">
      <span class="graph-node-badge">${nodeLabels[node] || node}</span>
      ${action ? `<span class="graph-action">${htmlEscape(action)}</span>` : ""}
    </div>`;
}

function renderGapSummary(gaps, state) {
  // Also compute gaps client-side from hard points if backend didn't return them
  let displayGaps = gaps || [];
  if (!displayGaps.length && state && state.hard_points && state.hard_points.length >= 2) {
    const sorted = [...state.hard_points]
      .filter((hp) => hp.start)
      .sort((a, b) => String(a.start).localeCompare(String(b.start)));
    for (let i = 0; i < sorted.length - 1; i++) {
      const from = sorted[i];
      const to = sorted[i + 1];
      const d1 = new Date(from.end || from.start);
      const d2 = new Date(to.start);
      const days = Math.round((d2 - d1) / 86400000 * 10) / 10;
      if (days >= 0.5) {
        displayGaps.push({
          days,
          start: d1.toISOString(),
          end: d2.toISOString(),
          location: from.location || "",
          type: days > 2 ? "open" : "city-stay",
          from_title: from.title,
          to_title: to.title,
        });
      }
    }
  }

  if (!displayGaps.length) {
    els.gapSummary.innerHTML = "<p class='hint'>No open gaps — looking good!</p>";
    return;
  }

  const fmtShort = (d) => d ? new Date(d).toLocaleDateString("nl-NL", { day: "numeric", month: "short" }) : "";

  const gapIcons = {
    open: "circle-alert",
    unspecified: "help-circle",
    "no-activities": "coffee",
    "city-stay": "coffee",
  };
  const gapLabels = {
    open: "Fully open",
    unspecified: "Needs destination",
    "no-activities": "No activities planned",
    "city-stay": "Free time",
  };

  els.gapSummary.innerHTML = `
    <div class="gap-header">${displayGaps.length} gap${displayGaps.length > 1 ? "s" : ""} to fill</div>
    <div class="gap-list">${displayGaps.map((g) => `
      <div class="gap-item gap-${g.type || "open"}">
        <span class="type-icon"><i data-lucide="${gapIcons[g.type] || "help-circle"}"></i></span>
        <div class="gap-body">
          <strong>${g.days}d</strong>
          <span class="gap-label">${gapLabels[g.type] || g.type}</span>
          <span class="meta">${fmtShort(g.start)}${g.end ? ` → ${fmtShort(g.end)}` : ""}${g.location ? ` · ${htmlEscape(g.location.split(",")[0])}` : ""}</span>
        </div>
      </div>
    `).join("")}</div>`;
}

// Map hard-point types to Lucide icon names
const TYPE_LUCIDE = {
  flight: "plane",
  train: "train-front",
  hotel: "bed-double",
  tour: "compass",
  meeting: "users",
  "no-planning": "moon",
  activity: "star",
  restaurant: "utensils",
  event: "calendar",
  museum: "landmark",
  hike: "mountain",
  market: "shopping-bag",
  cafe: "coffee",
  bar: "wine",
  place: "map-pin",
  "day-outline": "calendar-days",
  "route-stop": "flag",
};

function typeIcon(type) {
  const name = TYPE_LUCIDE[type] || TYPE_LUCIDE[type?.split("-")[0]] || "map-pin";
  return `<span class="type-icon"><i data-lucide="${name}"></i></span>`;
}

function renderItinerary(state) {
  if (!state) return;
  const items = [
    ...(state.hard_points || []).map((hp) => ({ ...hp, _kind: "hard", sortDate: hp.start })),
    ...(state.planned_stops || []).map((s) => ({ ...s, _kind: "planned", sortDate: s.date || s.start || "" })),
  ].sort((a, b) => String(a.sortDate).localeCompare(String(b.sortDate)));

  if (!items.length) {
    els.itineraryList.innerHTML = "<p class='hint'>Your itinerary will appear here as you plan.</p>";
    return;
  }

  // Group by day
  const days = {};
  items.forEach((item) => {
    const d = item.sortDate ? new Date(item.sortDate).toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" }) : "Unscheduled";
    if (!days[d]) days[d] = [];
    days[d].push(item);
  });

  els.itineraryList.innerHTML = Object.entries(days).map(([day, dayItems]) => `
    <div class="itinerary-day">
      <div class="itinerary-day-header">${day}</div>
      ${dayItems.map((item) => {
        const icon = typeIcon(item.type || item.kind);
        const loc = item.location || item.city || "";
        return `
          <article class="itinerary-item ${item._kind}">
            ${icon}
            <div class="itinerary-body">
              <strong>${htmlEscape(item.title)}</strong>
              ${loc ? `<div class="meta">${htmlEscape(loc)}</div>` : ""}
            </div>
          </article>`;
      }).join("")}
    </div>
  `).join("");
}

function renderSoftPois(state) {
  const pois = state?.soft_pois || [];
  if (!pois.length) {
    els.softPoiSection.hidden = true;
    return;
  }
  els.softPoiSection.hidden = false;
  els.softPoiList.innerHTML = pois.map((p) =>
    `<li class="soft-poi-item">
      <strong>${htmlEscape(p.title)}</strong>
      <span class="meta">${htmlEscape(p.city || "")}</span>
      ${(p.tags || []).map((t) => `<span class="chip chip-sm">${htmlEscape(t)}</span>`).join("")}
    </li>`
  ).join("");
}

// ---------------------------------------------------------------------------
// Map
// ---------------------------------------------------------------------------
// Transport type between two hard points based on their types
function getTransportBetween(from, to) {
  const ft = (from.type || "").toLowerCase();
  const tt = (to.type || "").toLowerCase();
  if (ft === "flight" || tt === "flight") return "flight";
  if (ft === "train" || tt === "train") return "train";
  return "ground";
}

const TRANSPORT_STYLES = {
  flight: { color: "#e85d3a", weight: 2, dashArray: "8 6", opacity: 0.7 },
  train:  { color: "#4f63d8", weight: 2.5, dashArray: "6 4", opacity: 0.7 },
  ground: { color: "#888", weight: 2, dashArray: "4 4", opacity: 0.5 },
};

const TRANSPORT_LUCIDE = { flight: "plane", train: "train-front", ground: "car" };

function initMap() {
  if (map) return;
  map = L.map(els.mapEl, { zoomControl: true, attributionControl: false }).setView([20, 0], 2);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OSM",
    maxZoom: 18,
  }).addTo(map);
  L.control.attribution({ position: "bottomright", prefix: false }).addTo(map);
  mapLayers.routes = L.layerGroup().addTo(map);
  mapLayers.hardPoints = L.layerGroup().addTo(map);
  mapLayers.planned = L.layerGroup().addTo(map);
  mapLayers.softPois = L.layerGroup().addTo(map);
  mapLayers.transportIcons = L.layerGroup().addTo(map);
  // Ensure map fills container once layout is settled
  requestAnimationFrame(() => map.invalidateSize());
}

function renderMap(state) {
  if (!map || !state) return;
  mapLayers.routes.clearLayers();
  mapLayers.hardPoints.clearLayers();
  mapLayers.planned.clearLayers();
  mapLayers.softPois.clearLayers();
  mapLayers.transportIcons.clearLayers();

  const bounds = [];

  // Collect hard points with coords, sorted by date
  const hpWithCoords = (state.hard_points || [])
    .filter((hp) => hp.lat != null && hp.lng != null)
    .sort((a, b) => String(a.start).localeCompare(String(b.start)));

  // Draw route lines between consecutive hard points
  for (let i = 0; i < hpWithCoords.length - 1; i++) {
    const from = hpWithCoords[i];
    const to = hpWithCoords[i + 1];
    // Skip if same location (e.g. hotel + tour in same city)
    if (Math.abs(from.lat - to.lat) < 0.01 && Math.abs(from.lng - to.lng) < 0.01) continue;

    const transport = getTransportBetween(from, to);
    const style = TRANSPORT_STYLES[transport];

    const line = L.polyline([[from.lat, from.lng], [to.lat, to.lng]], style);
    line.addTo(mapLayers.routes);

    // Transport icon at midpoint
    const midLat = (from.lat + to.lat) / 2;
    const midLng = (from.lng + to.lng) / 2;
    const iconName = TRANSPORT_LUCIDE[transport];
    const transportMarker = L.marker([midLat, midLng], {
      icon: L.divIcon({
        className: "transport-map-icon",
        html: `<i data-lucide="${iconName}"></i>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      }),
      interactive: false,
    });
    transportMarker.addTo(mapLayers.transportIcons);
  }

  // Draw hard point markers with numbered labels
  hpWithCoords.forEach((hp, i) => {
    // Skip duplicates at same location (show only first)
    if (i > 0 && Math.abs(hp.lat - hpWithCoords[i-1].lat) < 0.005 && Math.abs(hp.lng - hpWithCoords[i-1].lng) < 0.005) return;

    const marker = L.marker([hp.lat, hp.lng], {
      icon: L.divIcon({
        className: "hp-map-marker",
        html: `<span class="hp-marker-dot" data-type="${hp.type || ''}"><i data-lucide="${TYPE_LUCIDE[hp.type] || "map-pin"}"></i></span>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      }),
    }).bindPopup(`<b>${htmlEscape(hp.title)}</b><br><span style="color:#666">${htmlEscape(hp.location || "")}</span>`);
    marker.addTo(mapLayers.hardPoints);
    bounds.push([hp.lat, hp.lng]);
  });

  // Planned stops
  for (const stop of state.planned_stops || []) {
    if (stop.lat != null && stop.lng != null) {
      const marker = L.circleMarker([stop.lat, stop.lng], {
        radius: 6, fillColor: "#f0826d", fillOpacity: 0.7, color: "#fff", weight: 1.5,
      }).bindPopup(`<b>${htmlEscape(stop.title)}</b>`);
      marker.addTo(mapLayers.planned);
      bounds.push([stop.lat, stop.lng]);
    }
  }

  // Soft POIs
  for (const poi of state.soft_pois || []) {
    if (poi.lat != null && poi.lng != null) {
      const marker = L.circleMarker([poi.lat, poi.lng], {
        radius: 5, fillColor: "#f7b6a5", fillOpacity: 0.6, color: "#fff", weight: 1,
      }).bindPopup(`<b>${htmlEscape(poi.title)}</b>`);
      marker.addTo(mapLayers.softPois);
      bounds.push([poi.lat, poi.lng]);
    }
  }

  // Fit bounds
  if (bounds.length >= 2) {
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
  } else if (bounds.length === 1) {
    map.setView(bounds[0], 10);
  }

  // Invalidate map size + re-render lucide icons
  setTimeout(() => {
    map.invalidateSize();
    if (typeof lucide !== "undefined") lucide.createIcons();
  }, 50);
}

// ---------------------------------------------------------------------------
// Render all
// ---------------------------------------------------------------------------
function renderSuggestions(state) {
  // Collect latest options from conversation (most recent assistant message with options)
  const msgs = (state?.conversation || []).slice().reverse();
  const latest = msgs.find((m) => m.role === "assistant" && m.options && m.options.length);
  if (!latest) {
    els.suggestionList.innerHTML = "<p class='hint'>Chat to get personalized picks.</p>";
    return;
  }
  els.suggestionList.innerHTML = latest.options.map((opt) => `
    <div class="suggestion-item" data-option-id="${opt.id}">
      <div class="suggestion-head">
        ${typeIcon(opt.kind)} <strong>${htmlEscape(opt.title)}</strong>
      </div>
      ${opt.city ? `<div class="meta">${htmlEscape(opt.kind || "")} · ${htmlEscape(opt.city)}</div>` : ""}
      ${opt.reason ? `<div class="meta">${htmlEscape(opt.reason)}</div>` : ""}
      ${opt.reasoning ? `<div class="suggestion-reasoning">${htmlEscape(opt.reasoning)}</div>` : ""}
      <div class="option-actions">
        <span class="action-group action-group--rate" aria-label="Rate this idea">
          <button type="button" class="btn-feedback btn-love" data-action="love" data-id="${opt.id}" title="Love this idea — show me more like it"><i data-lucide="heart"></i> Love</button>
          <button type="button" class="btn-feedback btn-maybe" data-action="maybe" data-id="${opt.id}" title="Interesting but not sure yet"><i data-lucide="minus"></i> Maybe</button>
          <button type="button" class="btn-feedback btn-no" data-action="no" data-id="${opt.id}" title="Not for me — show me fewer like this"><i data-lucide="x"></i> Skip</button>
        </span>
        <span class="action-group action-group--trip" aria-label="Add to trip">
          <button type="button" class="btn-feedback btn-add" data-action="soft-add" data-id="${opt.id}" title="Add to trip — flexible, can be moved or swapped"><i data-lucide="plus"></i> Add to trip</button>
          <button type="button" class="btn-feedback btn-lock" data-action="hard-add" data-id="${opt.id}" title="Lock in — this is a must-do, won't be moved"><i data-lucide="lock"></i> Lock in</button>
        </span>
      </div>
    </div>
  `).join("");
}

function renderTripContext(state) {
  const el = els.tripContextDisplay;
  if (!el) return;
  const ctx = state.trip_context || {};
  const hps = state.hard_points || [];
  const isEmpty = !ctx.primary_destination && !ctx.start_date && !hps.length;
  if (isEmpty) { el.innerHTML = `<span class="hint">No trip loaded yet</span>`; return; }

  const fmtDate = (d) => d ? new Date(d + "T00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";
  let html = `<dl class="context-dl">`;
  if (ctx.primary_destination) html += `<dt>Destination</dt><dd>${htmlEscape(ctx.primary_destination)}</dd>`;
  if (ctx.start_date) html += `<dt>Dates</dt><dd>${fmtDate(ctx.start_date)}${ctx.end_date ? ` → ${fmtDate(ctx.end_date)}` : ""}</dd>`;
  if (hps.length) html += `<dt>Anchors</dt><dd>${hps.map(hp => htmlEscape(hp.title)).join(", ")}</dd>`;
  if ((ctx.must_include || []).length) html += `<dt>Must include</dt><dd>${ctx.must_include.map(x => htmlEscape(x)).join(", ")}</dd>`;
  if ((ctx.avoid || []).length) html += `<dt>Avoid</dt><dd>${ctx.avoid.map(x => htmlEscape(x)).join(", ")}</dd>`;
  if (ctx.style_notes) html += `<dt>Style</dt><dd>${htmlEscape(ctx.style_notes)}</dd>`;
  html += `</dl>`;
  el.innerHTML = html;
}

async function renderUserMemory() {
  const el = els.userMemoryDisplay;
  if (!el) return;
  try {
    const res = await fetch(`${API_BASE}/api/user/${userId}/memory`);
    if (!res.ok) { el.innerHTML = `<span class="hint">Could not load</span>`; return; }
    const mem = await res.json();
    const likes = Object.entries(mem.learned_likes || {}).sort((a, b) => b[1] - a[1]);
    const dislikes = Object.entries(mem.learned_dislikes || {}).sort((a, b) => b[1] - a[1]);
    const history = mem.ratings_history || [];
    const hasData = likes.length || dislikes.length || history.length;
    if (!hasData) { el.innerHTML = `<span class="hint">No preferences learned yet — rate some suggestions!</span>`; return; }

    let html = "";
    if (likes.length) {
      html += `<div class="context-tags"><strong>Likes:</strong> ${likes.map(([tag, score]) =>
        `<span class="tag tag-like" title="Score: ${score.toFixed(1)}">${htmlEscape(tag)}</span>`).join(" ")}</div>`;
    }
    if (dislikes.length) {
      html += `<div class="context-tags"><strong>Dislikes:</strong> ${dislikes.map(([tag, score]) =>
        `<span class="tag tag-dislike" title="Score: ${score.toFixed(1)}">${htmlEscape(tag)}</span>`).join(" ")}</div>`;
    }
    if (history.length) {
      html += `<div class="context-history"><strong>Recent ratings:</strong> <span class="hint">${history.length} total</span></div>`;
      const recent = history.slice(-5).reverse();
      html += `<ul class="context-history-list">${recent.map(r =>
        `<li><span class="rating-icon rating-${r.feedback}">${r.feedback === "love" ? "♥" : r.feedback === "maybe" ? "~" : "✕"}</span> ${htmlEscape(r.title || r.item_id)}</li>`
      ).join("")}</ul>`;
    }
    el.innerHTML = html;
  } catch { el.innerHTML = `<span class="hint">Could not load</span>`; }
}

function renderAll(state, response) {
  tripState = state;
  renderMetaBar(state);
  renderTripContext(state);
  renderConversation(state);
  renderItinerary(state);
  renderSoftPois(state);
  renderSuggestions(state);
  renderSidebarBadges(state);
  renderMap(state);
  if (response) {
    renderGraphStatus(response);
    renderGapSummary(response.gaps, state);
  } else {
    renderGapSummary(null, state);
  }
  if (typeof lucide !== "undefined") lucide.createIcons();
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------
async function handleChatSubmit(e) {
  e.preventDefault();
  // Get text from whichever input was used
  const isWelcome = e.target.id === "chatFormWelcome";
  const input = isWelcome ? els.chatInputWelcome : els.chatInput;
  const text = input.value.trim();
  if (!text) return;
  input.value = "";

  // Switch to chat state immediately
  els.welcomeBlock.hidden = true;
  els.chatState.hidden = false;
  const layout = document.querySelector(".layout-3col");
  if (layout) layout.classList.remove("is-welcome");

  // Show user message + typing indicator
  const userBubble = `<article class="chat-message user"><div class="msg-text">${htmlEscape(text)}</div></article>`;
  const typingBubble = `<article class="chat-message assistant typing-indicator"><div class="typing-dots"><span></span><span></span><span></span></div><div class="typing-label">Planning...</div></article>`;
  els.transcript.insertAdjacentHTML("beforeend", userBubble + typingBubble);
  const chatScroll = document.getElementById("chatScroll");
  if (chatScroll) chatScroll.scrollTop = chatScroll.scrollHeight;
  els.graphStatus.innerHTML = "";

  try {
    const response = await apiChat(text);
    renderAll(response.trip_state, response);
  } catch (err) {
    console.error(err);
    tripState.conversation.push({ id: `err-${Date.now()}`, role: "assistant", text: "Something went wrong. Please try again.", options: [] });
    renderConversation(tripState);
  }
}

function renderSidebarBadges(state) {
  const anchors = (state?.hard_points || []).length;
  const gapTab = document.querySelector('[data-sidebar="gaps"]');
  const itinTab = document.querySelector('[data-sidebar="itinerary"]');
  if (itinTab) itinTab.textContent = anchors ? `Itinerary (${anchors})` : "Itinerary";
}

function handleSidebarTab(e) {
  const btn = e.target.closest("[data-sidebar]");
  if (!btn) return;
  const target = btn.dataset.sidebar;
  document.querySelectorAll(".sidebar-tab").forEach((t) => t.classList.toggle("is-active", t.dataset.sidebar === target));
  document.querySelectorAll(".sidebar-panel").forEach((p) => p.hidden = p.dataset.sidebarPanel !== target);
}

async function handleOptionAction(e) {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const action = btn.dataset.action;
  const id = btn.dataset.id;

  if (action === "love" || action === "maybe" || action === "no") {
    await apiFeedback(id, action);
    btn.classList.add("is-active");
  } else if (action === "soft-add") {
    await apiSoftAdd(id);
    const fresh = await apiGetTrip();
    if (fresh) renderAll(fresh, null);
  } else if (action === "hard-add") {
    await apiHardAdd(id);
    const fresh = await apiGetTrip();
    if (fresh) renderAll(fresh, null);
  }
}

async function handleAddHardPoint(e) {
  e.preventDefault();
  const hp = {
    id: `hp-${Date.now()}`,
    title: $("hpTitle").value,
    type: $("hpType").value,
    start: new Date($("hpStart").value).toISOString(),
    location: $("hpLocation").value,
    locked: true,
  };
  await apiAddHardPoint(hp);
  e.target.reset();
  const fresh = await apiGetTrip();
  if (fresh) renderAll(fresh, null);
}

function handleQuickPrompt(e) {
  const btn = e.target.closest("[data-prompt]");
  if (!btn) return;
  // Use welcome input if visible, otherwise chat input
  const input = els.chatState.hidden ? els.chatInputWelcome : els.chatInput;
  const form = els.chatState.hidden ? els.chatFormWelcome : els.chatForm;
  input.value = btn.dataset.prompt;
  form.requestSubmit();
}

function handleSettingsToggle() {
  els.settingsDrawer.hidden = !els.settingsDrawer.hidden;
  if (!els.settingsDrawer.hidden) renderUserMemory();
}

function handleMobileTab(e) {
  const btn = e.target.closest("[data-panel]");
  if (!btn) return;
  document.querySelectorAll(".mobile-tab").forEach((t) => t.classList.remove("is-active"));
  btn.classList.add("is-active");
  const panel = btn.dataset.panel;
  document.querySelectorAll(".panel").forEach((p) => {
    p.classList.toggle("mobile-hidden", p.dataset.panel !== panel);
  });
}

// Session persistence
function handleSessionChange() {
  userId = els.userId.value || "default";
  tripId = els.tripId.value || "default";
  localStorage.setItem("dp_user_id", userId);
  localStorage.setItem("dp_trip_id", tripId);
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
async function init() {
  // Bind events
  els.chatForm.addEventListener("submit", handleChatSubmit);
  els.chatFormWelcome.addEventListener("submit", handleChatSubmit);

  // Enter sends message, Shift+Enter for newline
  function enterToSend(textarea, form) {
    textarea.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        form.requestSubmit();
      }
    });
  }
  enterToSend(els.chatInput, els.chatForm);
  enterToSend(els.chatInputWelcome, els.chatFormWelcome);
  els.transcript.addEventListener("click", handleOptionAction);
  // Handle question choice clicks
  els.transcript.addEventListener("click", (e) => {
    const btn = e.target.closest(".question-choice");
    if (!btn) return;
    const reply = btn.dataset.reply;
    els.chatInput.value = reply;
    els.chatForm.requestSubmit();
  });
  els.suggestionList.addEventListener("click", handleOptionAction);
  document.querySelector(".sidebar-tabs")?.addEventListener("click", handleSidebarTab);
  els.hardPointForm.addEventListener("submit", handleAddHardPoint);
  $("resetTripBtn").addEventListener("click", async () => {
    if (!confirm("Reset this trip? All hard points, stops, and conversation will be cleared. Your preference memory is kept.")) return;
    await apiResetTrip();
    const fresh = await apiGetTrip();
    renderAll(fresh, null);
  });
  els.settingsBtn.addEventListener("click", handleSettingsToggle);
  els.closeDrawerBtn.addEventListener("click", handleSettingsToggle);
  document.querySelectorAll(".quick-prompts").forEach(qp => qp.addEventListener("click", handleQuickPrompt));
  document.querySelector(".mobile-tabs")?.addEventListener("click", handleMobileTab);
  els.userId.addEventListener("change", handleSessionChange);
  els.tripId.addEventListener("change", handleSessionChange);

  // Restore session
  els.userId.value = userId;
  els.tripId.value = tripId;

  // Init map
  initMap();

  // Set welcome state initially
  const layout = document.querySelector(".layout-3col");
  if (layout) layout.classList.add("is-welcome");

  // Load existing trip
  const existing = await apiGetTrip();
  if (existing) {
    renderAll(existing, null);
  } else {
    // Ensure welcome is shown
    els.welcomeBlock.hidden = false;
    els.chatState.hidden = true;
  }

  if (typeof lucide !== "undefined") lucide.createIcons();
}

init();
