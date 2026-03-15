const STORAGE_KEY = "mindtrip_state_v1";
const ROUTE_PROFILES = ["driving", "cycling", "walking"];
const ROUTE_COLORS = {
  driving: "#1f78ff",
  cycling: "#2b9f4a",
  walking: "#8b5fbf",
};

const SUGGESTION_CATALOG = [
  { id: "s1", title: "Street food tasting walk", city: "Bangkok", tags: ["food", "culture", "walking"], budget: "budget", pace: "balanced", type: "experience", lat: 13.7563, lng: 100.5018, description: "Sample local dishes with a guide in old neighborhoods." },
  { id: "s2", title: "Sunrise photography viewpoint", city: "Lisbon", tags: ["photography", "nature", "walking"], budget: "budget", pace: "slow", type: "outdoor", lat: 38.7223, lng: -9.1393, description: "Early morning city panorama with calm crowds." },
  { id: "s3", title: "Modern art museum stop", city: "Berlin", tags: ["art", "museum", "culture"], budget: "mid", pace: "slow", type: "museum", lat: 52.52, lng: 13.405, description: "Explore contemporary exhibitions and installations." },
  { id: "s4", title: "Historic quarter bike loop", city: "Copenhagen", tags: ["cycling", "history", "architecture"], budget: "budget", pace: "fast", type: "route", lat: 55.6761, lng: 12.5683, description: "Ride through iconic districts and canals." },
  { id: "s5", title: "Rooftop dinner reservation", city: "Barcelona", tags: ["food", "nightlife", "romantic"], budget: "premium", pace: "slow", type: "dining", lat: 41.3851, lng: 2.1734, description: "Book a skyline dinner around sunset." },
  { id: "s6", title: "Half-day mountain detour", city: "Zurich", tags: ["nature", "hiking", "adventure"], budget: "mid", pace: "fast", type: "outdoor", lat: 47.3769, lng: 8.5417, description: "Short train + trail combo with alpine views." },
  { id: "s7", title: "Jazz basement venue", city: "New York", tags: ["music", "nightlife", "culture"], budget: "mid", pace: "balanced", type: "event", lat: 40.7128, lng: -74.006, description: "Evening live set in a classic jazz club." },
  { id: "s8", title: "Temple and tea ceremony", city: "Kyoto", tags: ["culture", "history", "food"], budget: "mid", pace: "slow", type: "experience", lat: 35.0116, lng: 135.7681, description: "Visit a shrine and complete a tea ritual." },
  { id: "s9", title: "Tech district coworking day", city: "Seoul", tags: ["work", "technology", "food"], budget: "budget", pace: "fast", type: "work", lat: 37.5665, lng: 126.978, description: "Flexible desk plus cafe-hopping nearby." },
  { id: "s10", title: "Canal evening cruise", city: "Amsterdam", tags: ["relax", "romantic", "culture"], budget: "mid", pace: "slow", type: "tour", lat: 52.3676, lng: 4.9041, description: "Low-stress way to see city highlights." },
  { id: "s11", title: "Day trip to nearby vineyards", city: "Porto", tags: ["food", "nature", "relax"], budget: "premium", pace: "slow", type: "day-trip", lat: 41.1579, lng: -8.6291, description: "Wine tasting with scenic countryside route." },
  { id: "s12", title: "Street art exploration route", city: "Melbourne", tags: ["art", "walking", "photography"], budget: "budget", pace: "balanced", type: "route", lat: -37.8136, lng: 144.9631, description: "Self-guided route through mural-heavy lanes." },
  { id: "s13", title: "Sci-fi and gaming cafe stop", city: "Tokyo", tags: ["technology", "gaming", "nightlife"], budget: "mid", pace: "balanced", type: "indoor", lat: 35.6762, lng: 139.6503, description: "Themed lounge with immersive setups." },
  { id: "s14", title: "Coastal sunrise run", city: "Sydney", tags: ["fitness", "nature", "running"], budget: "budget", pace: "fast", type: "outdoor", lat: -33.8688, lng: 151.2093, description: "Morning route with ocean views and cafe finish." },
  { id: "s15", title: "Old town architecture walk", city: "Prague", tags: ["history", "architecture", "walking"], budget: "budget", pace: "balanced", type: "walking-tour", lat: 50.0755, lng: 14.4378, description: "Focused route through landmarks and hidden corners." },
];

const SEED_EVENTS = [
  { id: "e1", title: "Open-air jazz session", city: "Paris", date: "2026-04-12", category: "music", venue: "Riverside Stage", lat: 48.8566, lng: 2.3522, tags: ["music", "nightlife", "culture"] },
  { id: "e2", title: "Food truck festival", city: "Berlin", date: "2026-05-03", category: "food", venue: "East Market Square", lat: 52.52, lng: 13.405, tags: ["food", "culture"] },
  { id: "e3", title: "Night museum program", city: "Rome", date: "2026-06-18", category: "culture", venue: "Capitol Museums", lat: 41.9028, lng: 12.4964, tags: ["museum", "history", "culture"] },
  { id: "e4", title: "Design week spotlight", city: "Milan", date: "2026-04-21", category: "design", venue: "Brera District", lat: 45.4642, lng: 9.19, tags: ["art", "design", "culture"] },
  { id: "e5", title: "Weekend city marathon expo", city: "Tokyo", date: "2026-03-28", category: "sports", venue: "Harbor Expo Hall", lat: 35.6762, lng: 139.6503, tags: ["fitness", "running"] },
  { id: "e6", title: "Indie film night", city: "Barcelona", date: "2026-07-02", category: "film", venue: "Cine Garden", lat: 41.3851, lng: 2.1734, tags: ["film", "culture", "nightlife"] },
];

const els = {};
let map;
let layers;
let state = loadState();

function createDefaultState() {
  return {
    profile: {
      name: "",
      homeBase: "",
      budget: "mid",
      pace: "balanced",
      interests: [],
    },
    hardPoints: [],
    customSuggestions: [],
    lastEvents: [],
    routeComparison: null,
    memory: {
      itemRatings: {},
      ratingsHistory: [],
      tagScores: {},
      cityScores: {},
    },
  };
}

function loadState() {
  const defaults = createDefaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return {
      ...defaults,
      ...parsed,
      profile: { ...defaults.profile, ...(parsed.profile || {}) },
      memory: { ...defaults.memory, ...(parsed.memory || {}) },
      hardPoints: Array.isArray(parsed.hardPoints) ? parsed.hardPoints : [],
      customSuggestions: Array.isArray(parsed.customSuggestions) ? parsed.customSuggestions : [],
      lastEvents: Array.isArray(parsed.lastEvents) ? parsed.lastEvents : [],
    };
  } catch (error) {
    console.error("Unable to load state:", error);
    return defaults;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function setStatus(message, isError = false) {
  els.statusMessage.textContent = message;
  els.statusMessage.classList.toggle("warning", isError);
}

function htmlEscape(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function generateId(prefix) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function parseTags(raw) {
  return String(raw || "")
    .split(",")
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
}

function normalizeCity(city) {
  return String(city || "").trim().toLowerCase();
}

function bindElements() {
  const ids = [
    "statusMessage",
    "profileForm",
    "profileName",
    "homeBase",
    "budgetStyle",
    "travelPace",
    "interests",
    "memorySummary",
    "hardPointForm",
    "hardPointList",
    "hpTitle",
    "hpType",
    "hpStart",
    "hpEnd",
    "hpLocation",
    "hpRef",
    "hpNotes",
    "routeCompareForm",
    "routeMode",
    "routeOrigin",
    "routeDestination",
    "routeResults",
    "eventForm",
    "eventLocation",
    "eventDate",
    "eventRadius",
    "eventResults",
    "itineraryList",
    "refreshSuggestionsBtn",
    "customSuggestionForm",
    "customSuggestionTitle",
    "customSuggestionCity",
    "customSuggestionTags",
    "suggestionList",
  ];

  ids.forEach((id) => {
    els[id] = document.getElementById(id);
  });
}

function initMap() {
  map = L.map("map", { zoomControl: true }).setView([20, 0], 2);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19,
  }).addTo(map);

  layers = {
    hardPoints: L.layerGroup().addTo(map),
    itineraryPath: L.layerGroup().addTo(map),
    routes: L.layerGroup().addTo(map),
    events: L.layerGroup().addTo(map),
  };
}

function bindEvents() {
  els.profileForm.addEventListener("submit", handleSaveProfile);
  els.hardPointForm.addEventListener("submit", handleAddHardPoint);
  els.hardPointList.addEventListener("click", handleHardPointAction);
  els.routeCompareForm.addEventListener("submit", handleRouteCompare);
  els.eventForm.addEventListener("submit", handleEventSearch);
  els.eventResults.addEventListener("click", handleEventAction);
  els.refreshSuggestionsBtn.addEventListener("click", () => {
    renderSuggestions();
    setStatus("Suggestions refreshed from memory.");
  });
  els.customSuggestionForm.addEventListener("submit", handleAddCustomSuggestion);
  els.suggestionList.addEventListener("click", handleSuggestionAction);
}

function hydrateProfileForm() {
  els.profileName.value = state.profile.name;
  els.homeBase.value = state.profile.homeBase;
  els.budgetStyle.value = state.profile.budget;
  els.travelPace.value = state.profile.pace;
  els.interests.value = state.profile.interests.join(", ");
}

function renderAll() {
  renderMemorySummary();
  renderHardPoints();
  renderRouteSelectors();
  renderItinerary();
  renderSuggestions();
  renderEventResults();
  renderRouteResults();
  renderMap();
}

function handleSaveProfile(event) {
  event.preventDefault();
  state.profile = {
    name: els.profileName.value.trim(),
    homeBase: els.homeBase.value.trim(),
    budget: els.budgetStyle.value,
    pace: els.travelPace.value,
    interests: parseTags(els.interests.value),
  };
  saveState();
  renderMemorySummary();
  renderSuggestions();
  setStatus("Traveler profile and memory preferences saved.");
}

async function handleAddHardPoint(event) {
  event.preventDefault();
  const title = els.hpTitle.value.trim();
  const type = els.hpType.value;
  const start = els.hpStart.value;
  const end = els.hpEnd.value;
  const location = els.hpLocation.value.trim();
  const bookingRef = els.hpRef.value.trim();
  const notes = els.hpNotes.value.trim();

  if (!title || !start || !location) {
    setStatus("Hard point requires title, start time, and location.", true);
    return;
  }

  setStatus("Geocoding hard point...");
  try {
    const geo = await geocodeLocation(location);
    const hardPoint = {
      id: generateId("hp"),
      title,
      type,
      start,
      end: end || "",
      locationLabel: geo.label,
      city: geo.city,
      lat: geo.lat,
      lng: geo.lng,
      bookingRef,
      notes,
      createdAt: new Date().toISOString(),
    };
    state.hardPoints.push(hardPoint);
    sortHardPointsInPlace();
    saveState();
    els.hardPointForm.reset();
    renderAll();
    setStatus(`Hard point "${title}" locked into the trip plan.`);
  } catch (error) {
    console.error(error);
    setStatus(`Could not geocode location: ${error.message}`, true);
  }
}

function handleHardPointAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const hardPointId = button.dataset.id;
  const action = button.dataset.action;
  const point = state.hardPoints.find((entry) => entry.id === hardPointId);
  if (!point) return;

  if (action === "remove") {
    state.hardPoints = state.hardPoints.filter((entry) => entry.id !== hardPointId);
    saveState();
    renderAll();
    setStatus(`Removed hard point "${point.title}".`);
    return;
  }

  if (action === "focus") {
    map.setView([point.lat, point.lng], 12);
    setStatus(`Map centered on ${point.title}.`);
    return;
  }

  if (action === "rate") {
    const rating = Number(button.dataset.rating);
    applyRating({
      itemId: point.id,
      title: point.title,
      city: point.city,
      tags: [point.type, "hard-point"],
      kind: "hard-point",
    }, rating);
    renderAll();
  }
}

function renderHardPoints() {
  if (!state.hardPoints.length) {
    els.hardPointList.innerHTML = "<li class='list-item'>No hard points yet.</li>";
    return;
  }

  els.hardPointList.innerHTML = state.hardPoints
    .map((point) => {
      const rating = state.memory.itemRatings[point.id];
      const ratingText = rating ? `Current rating: ${rating}/5` : "Rate after booking or experience";
      return `
      <li class="list-item">
        <h4>${htmlEscape(point.title)} <small>(${htmlEscape(point.type)})</small></h4>
        <div class="meta">${formatDateTime(point.start)} ${point.end ? `-> ${formatDateTime(point.end)}` : ""}</div>
        <div class="meta">${htmlEscape(point.locationLabel || point.city || "Unknown location")}</div>
        ${point.bookingRef ? `<div class="meta">Booking ref: ${htmlEscape(point.bookingRef)}</div>` : ""}
        ${point.notes ? `<div class="meta">${htmlEscape(point.notes)}</div>` : ""}
        <div class="meta">${ratingText}</div>
        <div class="item-actions">
          <button type="button" data-action="focus" data-id="${point.id}">Show on map</button>
          <button type="button" data-action="remove" data-id="${point.id}">Remove</button>
          <button type="button" data-action="rate" data-id="${point.id}" data-rating="3">Rate 3</button>
          <button type="button" data-action="rate" data-id="${point.id}" data-rating="4">Rate 4</button>
          <button type="button" data-action="rate" data-id="${point.id}" data-rating="5">Rate 5</button>
        </div>
      </li>`;
    })
    .join("");
}

function renderRouteSelectors() {
  const options = state.hardPoints
    .map((point) => `<option value="${point.id}">${htmlEscape(point.title)} (${formatShortDate(point.start)})</option>`)
    .join("");

  els.routeOrigin.innerHTML = options || "<option value=''>No hard points</option>";
  els.routeDestination.innerHTML = options || "<option value=''>No hard points</option>";

  if (state.hardPoints.length >= 2) {
    els.routeOrigin.value = state.hardPoints[0].id;
    els.routeDestination.value = state.hardPoints[state.hardPoints.length - 1].id;
  }
}

function renderItinerary() {
  const trip = getSortedHardPoints();
  if (!trip.length) {
    els.itineraryList.innerHTML = "Add hard points to generate an itinerary timeline.";
    return;
  }

  const blocks = [];
  for (let i = 0; i < trip.length; i += 1) {
    const point = trip[i];
    blocks.push(`
      <article class="itinerary-stop">
        <strong>${i + 1}. ${htmlEscape(point.title)}</strong>
        <div class="meta">${formatDateTime(point.start)} ${point.end ? `-> ${formatDateTime(point.end)}` : ""}</div>
        <div class="meta">${htmlEscape(point.city || point.locationLabel)}</div>
      </article>
    `);
    const next = trip[i + 1];
    if (next) {
      const distance = haversineKm(point.lat, point.lng, next.lat, next.lng);
      const estimateMinutes = Math.round((distance / 70) * 60);
      blocks.push(`
        <article class="itinerary-stop">
          <strong>Transit Segment</strong>
          <div class="meta">${htmlEscape(point.title)} -> ${htmlEscape(next.title)}</div>
          <div class="meta">Approx ${distance.toFixed(1)} km (${formatDurationMinutes(estimateMinutes)} by average road pace)</div>
        </article>
      `);
    }
  }

  els.itineraryList.innerHTML = blocks.join("");
}

function getAllSuggestions() {
  return [...SUGGESTION_CATALOG, ...state.customSuggestions];
}

function scoreSuggestion(suggestion) {
  const normalizedCity = normalizeCity(suggestion.city);
  const rememberedCityScore = state.memory.cityScores[normalizedCity] || 0;
  const rated = state.memory.itemRatings[suggestion.id];
  const interestSet = new Set(state.profile.interests);

  let score = 40;
  score += rememberedCityScore * 2.5;
  if (suggestion.budget === state.profile.budget) score += 4;
  if (suggestion.pace === state.profile.pace) score += 3;

  suggestion.tags.forEach((tag) => {
    score += (state.memory.tagScores[tag] || 0) * 4;
    if (interestSet.has(tag)) score += 2.5;
  });

  if (rated !== undefined) {
    score += rated <= 2 ? -20 : rated * 2;
  }

  return score;
}

function getPersonalizedSuggestions(limit = 12) {
  return getAllSuggestions()
    .map((entry) => ({ ...entry, score: scoreSuggestion(entry) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function renderSuggestions() {
  const personalized = getPersonalizedSuggestions(12);
  if (!personalized.length) {
    els.suggestionList.innerHTML = "<p>No suggestions available.</p>";
    return;
  }

  els.suggestionList.innerHTML = personalized
    .map((item) => {
      const existingRating = state.memory.itemRatings[item.id];
      const ratingText = existingRating ? `Remembered rating ${existingRating}/5` : "Not rated yet";
      return `
      <article class="suggestion-card">
        <h4>${htmlEscape(item.title)}</h4>
        <div class="meta">${htmlEscape(item.city)} | ${htmlEscape(item.type)} | score ${item.score.toFixed(1)}</div>
        <div class="meta">${htmlEscape(item.description || "No description")}</div>
        <div class="chip-list">${item.tags.map((tag) => `<span class="chip">${htmlEscape(tag)}</span>`).join("")}</div>
        <div class="meta">${ratingText}</div>
        <div class="item-actions">
          <button type="button" data-action="rate-suggestion" data-id="${item.id}" data-rating="2">2</button>
          <button type="button" data-action="rate-suggestion" data-id="${item.id}" data-rating="3">3</button>
          <button type="button" data-action="rate-suggestion" data-id="${item.id}" data-rating="4">4</button>
          <button type="button" data-action="rate-suggestion" data-id="${item.id}" data-rating="5">5</button>
          <button type="button" data-action="pin-suggestion" data-id="${item.id}">Pin as hard point</button>
        </div>
      </article>
      `;
    })
    .join("");
}

function handleSuggestionAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  const id = button.dataset.id;
  const suggestion = getAllSuggestions().find((entry) => entry.id === id);
  if (!suggestion) return;

  if (action === "rate-suggestion") {
    const rating = Number(button.dataset.rating);
    applyRating({
      itemId: suggestion.id,
      title: suggestion.title,
      city: suggestion.city,
      tags: suggestion.tags,
      kind: "suggestion",
    }, rating);
    renderSuggestions();
    renderMemorySummary();
    return;
  }

  if (action === "pin-suggestion") {
    pinAsHardPoint({
      title: suggestion.title,
      type: suggestion.type || "activity",
      city: suggestion.city,
      locationLabel: suggestion.city,
      lat: suggestion.lat,
      lng: suggestion.lng,
      notes: "Pinned from smart suggestions",
    });
    setStatus(`Pinned "${suggestion.title}" as a hard point.`);
  }
}

function handleAddCustomSuggestion(event) {
  event.preventDefault();
  const title = els.customSuggestionTitle.value.trim();
  const city = els.customSuggestionCity.value.trim();
  const tags = parseTags(els.customSuggestionTags.value);

  if (!title || !city) {
    setStatus("Custom suggestion requires title and city.", true);
    return;
  }

  const customSuggestion = {
    id: generateId("custom"),
    title,
    city,
    tags: tags.length ? tags : ["custom"],
    budget: state.profile.budget,
    pace: state.profile.pace,
    type: "custom",
    lat: null,
    lng: null,
    description: "User-created suggestion.",
  };

  state.customSuggestions.unshift(customSuggestion);
  saveState();
  els.customSuggestionForm.reset();
  renderSuggestions();
  setStatus(`Added custom suggestion "${title}".`);
}

function applyRating({ itemId, title, city, tags, kind }, rating) {
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) return;
  const delta = rating - 3;
  const normalizedCity = normalizeCity(city);

  state.memory.itemRatings[itemId] = rating;
  tags.forEach((tag) => {
    state.memory.tagScores[tag] = (state.memory.tagScores[tag] || 0) + delta;
  });
  if (normalizedCity) {
    state.memory.cityScores[normalizedCity] = (state.memory.cityScores[normalizedCity] || 0) + delta;
  }
  state.memory.ratingsHistory.unshift({
    itemId,
    title,
    rating,
    kind,
    tags,
    city,
    when: new Date().toISOString(),
  });
  state.memory.ratingsHistory = state.memory.ratingsHistory.slice(0, 150);

  saveState();
  renderMemorySummary();
  setStatus(`Stored rating ${rating}/5 for "${title}". Memory model updated.`);
}

function renderMemorySummary() {
  const topTags = Object.entries(state.memory.tagScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([tag, score]) => `${tag} (${score >= 0 ? "+" : ""}${score})`);

  const lowTags = Object.entries(state.memory.tagScores)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3)
    .map(([tag, score]) => `${tag} (${score})`);

  const topCities = Object.entries(state.memory.cityScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([city, score]) => `${city} (${score >= 0 ? "+" : ""}${score})`);

  const totalRatings = state.memory.ratingsHistory.length;
  const memoryText = `
    <div><strong>Remembered traveler:</strong> ${htmlEscape(state.profile.name || "anonymous planner")}</div>
    <div>Ratings stored: <strong>${totalRatings}</strong></div>
    <div>Top preference tags: ${topTags.length ? htmlEscape(topTags.join(", ")) : "none yet"}</div>
    <div>Tags to avoid: ${lowTags.length ? htmlEscape(lowTags.join(", ")) : "none yet"}</div>
    <div>Preferred cities: ${topCities.length ? htmlEscape(topCities.join(", ")) : "none yet"}</div>
  `;
  els.memorySummary.innerHTML = memoryText;
}

function pinAsHardPoint({ title, type, city, locationLabel, lat, lng, notes, start }) {
  const now = new Date();
  now.setHours(now.getHours() + 4);
  const startTime = start || now.toISOString().slice(0, 16);
  const hardPoint = {
    id: generateId("hp"),
    title,
    type,
    start: startTime,
    end: "",
    city,
    locationLabel: locationLabel || city,
    lat: Number.isFinite(lat) ? lat : 0,
    lng: Number.isFinite(lng) ? lng : 0,
    bookingRef: "",
    notes: notes || "",
    createdAt: new Date().toISOString(),
  };
  state.hardPoints.push(hardPoint);
  sortHardPointsInPlace();
  saveState();
  renderAll();
}

async function handleEventSearch(event) {
  event.preventDefault();
  const location = els.eventLocation.value.trim();
  const date = els.eventDate.value;
  const radiusKm = Number(els.eventRadius.value || 15);
  if (!location || !date) {
    setStatus("Event search requires location and date.", true);
    return;
  }

  setStatus("Searching events (seeded + nearby venues)...");
  try {
    const geo = await geocodeLocation(location);
    const seeded = getSeedEventsNear(geo.lat, geo.lng, date, radiusKm);
    const venues = await getVenueEventsNear(geo.lat, geo.lng, date, radiusKm);
    const merged = dedupeEvents([...seeded, ...venues]);
    state.lastEvents = merged;
    saveState();
    renderEventResults();
    renderMap();
    setStatus(`Found ${merged.length} event options near ${geo.city || location}.`);
  } catch (error) {
    console.error(error);
    setStatus(`Event search failed: ${error.message}`, true);
  }
}

function dedupeEvents(events) {
  const seen = new Set();
  return events.filter((event) => {
    const key = `${event.title}-${event.city}-${event.date}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getSeedEventsNear(lat, lng, targetDate, radiusKm) {
  return SEED_EVENTS.filter((event) => {
    const dateDistance = Math.abs(dateDiffDays(event.date, targetDate));
    const km = haversineKm(lat, lng, event.lat, event.lng);
    return dateDistance <= 10 && km <= radiusKm + 50;
  });
}

async function getVenueEventsNear(lat, lng, date, radiusKm) {
  const radiusMeters = Math.round(Math.max(1, radiusKm) * 1000);
  const overpassQuery = `
    [out:json][timeout:25];
    (
      node(around:${radiusMeters},${lat},${lng})[amenity~"theatre|cinema|arts_centre|music_venue|nightclub"];
      way(around:${radiusMeters},${lat},${lng})[amenity~"theatre|cinema|arts_centre|music_venue|nightclub"];
    );
    out center 30;
  `;

  try {
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: overpassQuery,
    });
    if (!response.ok) {
      return [];
    }
    const payload = await response.json();
    return (payload.elements || []).slice(0, 15).map((entry) => {
      const latitude = Number(entry.lat ?? entry.center?.lat);
      const longitude = Number(entry.lon ?? entry.center?.lon);
      const name = entry.tags?.name || "Local venue";
      const amenity = entry.tags?.amenity || "venue";
      return {
        id: `venue-${entry.type}-${entry.id}`,
        title: `${name} (${amenity})`,
        city: "Near search area",
        date,
        category: amenity,
        venue: name,
        lat: latitude,
        lng: longitude,
        tags: [amenity, "event", "live"],
      };
    });
  } catch (error) {
    console.warn("Venue lookup failed", error);
    return [];
  }
}

function renderEventResults() {
  if (!state.lastEvents.length) {
    els.eventResults.innerHTML = "<div class='result-card'>No events searched yet.</div>";
    return;
  }

  els.eventResults.innerHTML = state.lastEvents
    .map((event) => `
      <article class="result-card">
        <strong>${htmlEscape(event.title)}</strong>
        <div class="meta">${htmlEscape(event.date)} | ${htmlEscape(event.city)} | ${htmlEscape(event.category)}</div>
        <div class="meta">${htmlEscape(event.venue || "Venue pending")}</div>
        <div class="item-actions">
          <button type="button" data-action="pin-event" data-id="${event.id}">Pin as hard point</button>
          <button type="button" data-action="rate-event" data-id="${event.id}" data-rating="3">Rate 3</button>
          <button type="button" data-action="rate-event" data-id="${event.id}" data-rating="4">Rate 4</button>
          <button type="button" data-action="rate-event" data-id="${event.id}" data-rating="5">Rate 5</button>
        </div>
      </article>
    `)
    .join("");
}

function handleEventAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const eventId = button.dataset.id;
  const action = button.dataset.action;
  const eventData = state.lastEvents.find((entry) => entry.id === eventId);
  if (!eventData) return;

  if (action === "pin-event") {
    pinAsHardPoint({
      title: eventData.title,
      type: "event",
      city: eventData.city,
      locationLabel: eventData.venue || eventData.city,
      lat: eventData.lat,
      lng: eventData.lng,
      notes: "Pinned from event finder",
      start: `${eventData.date}T19:00`,
    });
    setStatus(`Pinned event "${eventData.title}" as a hard point.`);
    return;
  }

  if (action === "rate-event") {
    const rating = Number(button.dataset.rating);
    applyRating({
      itemId: eventData.id,
      title: eventData.title,
      city: eventData.city,
      tags: eventData.tags || [eventData.category, "event"],
      kind: "event",
    }, rating);
  }
}

async function handleRouteCompare(event) {
  event.preventDefault();
  if (state.hardPoints.length < 2) {
    setStatus("Need at least two hard points for route comparison.", true);
    return;
  }
  const mode = els.routeMode.value;
  const originId = els.routeOrigin.value;
  const destinationId = els.routeDestination.value;
  const coordinates = getRouteCoordinates(mode, originId, destinationId);

  if (!coordinates || coordinates.length < 2) {
    setStatus("Route comparison needs valid hard points with coordinates.", true);
    return;
  }

  setStatus("Fetching route alternatives (driving/cycling/walking)...");
  const results = await Promise.all(
    ROUTE_PROFILES.map(async (profile) => {
      try {
        const route = await fetchRoute(profile, coordinates, mode === "point-to-point");
        return { profile, ...route };
      } catch (error) {
        return {
          profile,
          error: error.message,
          distanceKm: 0,
          durationMinutes: 0,
          geometry: [],
          alternatives: [],
        };
      }
    })
  );

  state.routeComparison = {
    mode,
    generatedAt: new Date().toISOString(),
    results,
  };
  saveState();
  renderRouteResults();
  renderMap();
  setStatus("Route comparison updated.");
}

function getRouteCoordinates(mode, originId, destinationId) {
  const points = getSortedHardPoints().filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng));
  if (mode === "whole-trip") {
    return points.map((point) => [point.lat, point.lng]);
  }
  const origin = points.find((point) => point.id === originId);
  const destination = points.find((point) => point.id === destinationId);
  if (!origin || !destination) return null;
  if (origin.id === destination.id) return null;
  return [
    [origin.lat, origin.lng],
    [destination.lat, destination.lng],
  ];
}

async function fetchRoute(profile, coordinates, allowAlternatives) {
  const coordString = coordinates.map(([lat, lng]) => `${lng},${lat}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/${profile}/${coordString}?overview=full&geometries=geojson&alternatives=${allowAlternatives ? "true" : "false"}&steps=false`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${profile} route service unavailable`);
  }
  const payload = await response.json();
  if (!payload.routes || !payload.routes.length) {
    throw new Error(`No ${profile} route found`);
  }

  const primary = payload.routes[0];
  const alternatives = payload.routes.slice(1, 3).map((route, index) => ({
    label: `Alt ${index + 1}`,
    distanceKm: route.distance / 1000,
    durationMinutes: route.duration / 60,
  }));

  return {
    distanceKm: primary.distance / 1000,
    durationMinutes: primary.duration / 60,
    geometry: primary.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    alternatives,
  };
}

function renderRouteResults() {
  if (!state.routeComparison || !state.routeComparison.results?.length) {
    els.routeResults.innerHTML = "<div class='result-card'>No route comparison yet.</div>";
    return;
  }

  const cards = state.routeComparison.results.map((result) => {
    if (result.error) {
      return `<article class="result-card warning"><strong>${result.profile}</strong>: ${htmlEscape(result.error)}</article>`;
    }
    const alternativesHtml = result.alternatives.length
      ? `<div class="meta">Alternatives: ${result.alternatives.map((alt) => `${alt.label} ${alt.distanceKm.toFixed(1)}km / ${formatDurationMinutes(alt.durationMinutes)}`).join(" | ")}</div>`
      : "<div class='meta'>Alternatives: none</div>";
    return `
      <article class="result-card">
        <strong style="color:${ROUTE_COLORS[result.profile]}">${htmlEscape(result.profile)}</strong>
        <div class="meta">${result.distanceKm.toFixed(1)} km | ${formatDurationMinutes(result.durationMinutes)}</div>
        ${alternativesHtml}
      </article>
    `;
  });

  els.routeResults.innerHTML = cards.join("");
}

function renderMap() {
  layers.hardPoints.clearLayers();
  layers.itineraryPath.clearLayers();
  layers.routes.clearLayers();
  layers.events.clearLayers();

  const mapElements = [];
  const sorted = getSortedHardPoints();
  sorted.forEach((point, index) => {
    if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng)) return;
    const marker = L.marker([point.lat, point.lng], { title: point.title })
      .bindPopup(`<strong>${htmlEscape(point.title)}</strong><br>${htmlEscape(point.locationLabel || point.city || "")}<br>Hard point #${index + 1}`);
    marker.addTo(layers.hardPoints);
    mapElements.push(marker);
  });

  if (sorted.length >= 2) {
    const coords = sorted
      .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng))
      .map((point) => [point.lat, point.lng]);
    const path = L.polyline(coords, { color: "#355f9e", weight: 3, dashArray: "6,6" }).addTo(layers.itineraryPath);
    mapElements.push(path);
  }

  if (state.routeComparison?.results) {
    state.routeComparison.results.forEach((route) => {
      if (route.error || !route.geometry?.length) return;
      const line = L.polyline(route.geometry, {
        color: ROUTE_COLORS[route.profile] || "#333",
        weight: 4,
        opacity: 0.74,
      })
        .bindPopup(`${route.profile}: ${route.distanceKm.toFixed(1)} km / ${formatDurationMinutes(route.durationMinutes)}`)
        .addTo(layers.routes);
      mapElements.push(line);
    });
  }

  state.lastEvents.forEach((event) => {
    if (!Number.isFinite(event.lat) || !Number.isFinite(event.lng)) return;
    const circle = L.circleMarker([event.lat, event.lng], {
      radius: 6,
      color: "#f27f0c",
      fillColor: "#f39f47",
      fillOpacity: 0.8,
    }).bindPopup(`<strong>${htmlEscape(event.title)}</strong><br>${htmlEscape(event.date)} | ${htmlEscape(event.category)}`);
    circle.addTo(layers.events);
    mapElements.push(circle);
  });

  if (mapElements.length) {
    const group = L.featureGroup(mapElements);
    map.fitBounds(group.getBounds().pad(0.15), { maxZoom: 13 });
  }
}

async function geocodeLocation(query) {
  const endpoint = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=1&q=${encodeURIComponent(query)}`;
  const response = await fetch(endpoint, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error("Geocoding service unreachable");
  }
  const payload = await response.json();
  if (!payload.length) {
    throw new Error("Location not found");
  }
  const best = payload[0];
  const city = best.address?.city || best.address?.town || best.address?.village || best.address?.county || query;
  return {
    lat: Number(best.lat),
    lng: Number(best.lon),
    label: best.display_name,
    city,
  };
}

function getSortedHardPoints() {
  return [...state.hardPoints].sort((a, b) => {
    const da = Date.parse(a.start) || 0;
    const db = Date.parse(b.start) || 0;
    return da - db;
  });
}

function sortHardPointsInPlace() {
  state.hardPoints.sort((a, b) => {
    const da = Date.parse(a.start) || 0;
    const db = Date.parse(b.start) || 0;
    return da - db;
  });
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (degrees) => (degrees * Math.PI) / 180;
  const r = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDateTime(value) {
  if (!value) return "No date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function formatShortDate(value) {
  if (!value) return "No date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

function formatDurationMinutes(minutes) {
  const safe = Math.max(0, Math.round(minutes));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  if (!h) return `${m}m`;
  return `${h}h ${m}m`;
}

function dateDiffDays(dateA, dateB) {
  const a = Date.parse(dateA);
  const b = Date.parse(dateB);
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.round((a - b) / (1000 * 60 * 60 * 24));
}

function setDefaultEventDate() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  els.eventDate.value = date.toISOString().slice(0, 10);
}

function init() {
  bindElements();
  initMap();
  bindEvents();
  hydrateProfileForm();
  setDefaultEventDate();
  renderAll();
  setStatus("MindTrip planner ready. Add hard points to begin.");
}

window.addEventListener("DOMContentLoaded", init);
