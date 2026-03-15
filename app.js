const STORAGE_KEY = "mindtrip_state_v1";
const ROUTE_PROFILES = ["driving", "cycling", "walking"];
const ROUTE_COLORS = {
  driving: "#1f78ff",
  cycling: "#2b9f4a",
  walking: "#8b5fbf",
};
const DEFAULT_LLM_CONFIG = {
  endpoint: "https://openrouter.ai/api/v1/chat/completions",
  model: "openai/gpt-4o-mini",
  apiKey: "",
  enabled: false,
};
const DETAIL_CATEGORY_HINTS = [
  "hike",
  "hiking",
  "shop",
  "shopping",
  "bar",
  "bars",
  "concert",
  "concerts",
  "event",
  "events",
  "architecture",
  "museum",
  "museums",
  "gallery",
  "food",
  "restaurant",
];

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

const SEED_MAIN_LOCATIONS = [
  { id: "ml1", title: "Eiffel Tower", city: "Paris", lat: 48.8584, lng: 2.2945, category: "landmark", tags: ["landmark", "architecture", "viewpoint"] },
  { id: "ml2", title: "Louvre Museum", city: "Paris", lat: 48.8606, lng: 2.3376, category: "museum", tags: ["museum", "art", "culture"] },
  { id: "ml3", title: "Colosseum", city: "Rome", lat: 41.8902, lng: 12.4922, category: "history", tags: ["history", "landmark", "architecture"] },
  { id: "ml4", title: "Sagrada Familia", city: "Barcelona", lat: 41.4036, lng: 2.1744, category: "architecture", tags: ["architecture", "culture", "landmark"] },
  { id: "ml5", title: "Brandenburg Gate", city: "Berlin", lat: 52.5163, lng: 13.3777, category: "landmark", tags: ["history", "landmark"] },
  { id: "ml6", title: "Shibuya Crossing", city: "Tokyo", lat: 35.6595, lng: 139.7005, category: "city-icon", tags: ["city", "nightlife", "photography"] },
  { id: "ml7", title: "Grand Canal", city: "Venice", lat: 45.44, lng: 12.3155, category: "waterfront", tags: ["relax", "culture", "romantic"] },
  { id: "ml8", title: "Table Mountain", city: "Cape Town", lat: -33.9628, lng: 18.4098, category: "nature", tags: ["nature", "hiking", "viewpoint"] },
];

const SEED_TRIP_IDEAS = [
  { id: "tr1", title: "Versailles day trip", city: "Paris", lat: 48.8049, lng: 2.1204, category: "day-trip", tags: ["history", "architecture", "day-trip"], description: "Palace and gardens with half-day planning." },
  { id: "tr2", title: "Lake Como scenic train", city: "Milan", lat: 45.8081, lng: 9.0852, category: "scenic-route", tags: ["nature", "train", "trip"], description: "Relaxed full-day lakeside escape." },
  { id: "tr3", title: "Nikko cultural side trip", city: "Tokyo", lat: 36.7198, lng: 139.6982, category: "day-trip", tags: ["history", "culture", "trip"], description: "Shrines and mountain views with rail access." },
  { id: "tr4", title: "Sintra castles loop", city: "Lisbon", lat: 38.8029, lng: -9.3817, category: "day-trip", tags: ["architecture", "history", "trip"], description: "UNESCO hill town with palace circuit." },
  { id: "tr5", title: "Blue Mountains route", city: "Sydney", lat: -33.7128, lng: 150.3119, category: "nature-trip", tags: ["nature", "hiking", "trip"], description: "Lookouts and forest walks outside the city." },
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
    routeSets: [],
    plannedStops: [],
    customSuggestions: [],
    lastPlaces: [],
    lastEvents: [],
    lastLlmResults: [],
    lastUnifiedSearch: {
      query: "",
      routeNodes: [],
      detailStops: [],
      generatedAt: "",
    },
    routeComparison: null,
    llm: {
      ...DEFAULT_LLM_CONFIG,
    },
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
      routeSets: Array.isArray(parsed.routeSets) ? parsed.routeSets : [],
      plannedStops: Array.isArray(parsed.plannedStops) ? parsed.plannedStops : [],
      customSuggestions: Array.isArray(parsed.customSuggestions) ? parsed.customSuggestions : [],
      lastPlaces: Array.isArray(parsed.lastPlaces) ? parsed.lastPlaces : [],
      lastEvents: Array.isArray(parsed.lastEvents) ? parsed.lastEvents : [],
      lastLlmResults: Array.isArray(parsed.lastLlmResults) ? parsed.lastLlmResults : [],
      lastUnifiedSearch: {
        ...defaults.lastUnifiedSearch,
        ...(parsed.lastUnifiedSearch || {}),
        routeNodes: Array.isArray(parsed?.lastUnifiedSearch?.routeNodes) ? parsed.lastUnifiedSearch.routeNodes : [],
        detailStops: Array.isArray(parsed?.lastUnifiedSearch?.detailStops) ? parsed.lastUnifiedSearch.detailStops : [],
      },
      llm: { ...DEFAULT_LLM_CONFIG, ...(parsed.llm || {}) },
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
    "routeSetForm",
    "routeSetName",
    "routeSetDescription",
    "routeNodeForm",
    "routeNodeSet",
    "routeNodeTitle",
    "routeNodeType",
    "routeNodeLocation",
    "routeNodeStart",
    "routeNodeNotes",
    "routeSetList",
    "unifiedSearchForm",
    "unifiedQuery",
    "unifiedLocation",
    "unifiedDate",
    "unifiedRadius",
    "unifiedUseLlm",
    "unifiedRouteResults",
    "unifiedDetailResults",
    "routeCompareForm",
    "routeMode",
    "routeOrigin",
    "routeDestination",
    "routeResults",
    "placeForm",
    "placeLocation",
    "placeMode",
    "placeRadius",
    "placeInterleaveTime",
    "placeResults",
    "llmConfigForm",
    "llmApiEndpoint",
    "llmModel",
    "llmApiKey",
    "llmEnabled",
    "llmSearchForm",
    "llmQuery",
    "llmSearchLocation",
    "llmSearchDate",
    "llmResultCount",
    "llmSearchResults",
    "eventForm",
    "eventLocation",
    "eventDate",
    "eventRadius",
    "eventInterleaveTime",
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
    routeNodes: L.layerGroup().addTo(map),
    plannedStops: L.layerGroup().addTo(map),
    itineraryPath: L.layerGroup().addTo(map),
    routes: L.layerGroup().addTo(map),
    events: L.layerGroup().addTo(map),
    unified: L.layerGroup().addTo(map),
    llm: L.layerGroup().addTo(map),
  };
}

function bindEvents() {
  els.profileForm.addEventListener("submit", handleSaveProfile);
  els.hardPointForm.addEventListener("submit", handleAddHardPoint);
  els.hardPointList.addEventListener("click", handleHardPointAction);
  els.routeSetForm.addEventListener("submit", handleAddRouteSet);
  els.routeNodeForm.addEventListener("submit", handleAddRouteNode);
  els.routeSetList.addEventListener("click", handleRouteSetAction);
  els.unifiedSearchForm.addEventListener("submit", handleUnifiedSearch);
  els.unifiedRouteResults.addEventListener("click", handleUnifiedRouteAction);
  els.unifiedDetailResults.addEventListener("click", handleUnifiedDetailAction);
  els.routeCompareForm.addEventListener("submit", handleRouteCompare);
  els.placeForm.addEventListener("submit", handlePlaceSearch);
  els.placeResults.addEventListener("click", handlePlaceAction);
  els.llmConfigForm.addEventListener("submit", handleSaveLlmConfig);
  els.llmSearchForm.addEventListener("submit", handleLlmSearch);
  els.llmSearchResults.addEventListener("click", handleLlmAction);
  els.eventForm.addEventListener("submit", handleEventSearch);
  els.eventResults.addEventListener("click", handleEventAction);
  els.itineraryList.addEventListener("click", handleItineraryAction);
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

function hydrateLlmForm() {
  els.llmApiEndpoint.value = state.llm.endpoint || DEFAULT_LLM_CONFIG.endpoint;
  els.llmModel.value = state.llm.model || DEFAULT_LLM_CONFIG.model;
  els.llmApiKey.value = state.llm.apiKey || "";
  els.llmEnabled.checked = Boolean(state.llm.enabled && state.llm.apiKey);
}

function renderAll() {
  renderMemorySummary();
  renderHardPoints();
  renderRouteSets();
  renderRouteNodeSetOptions();
  renderUnifiedResults();
  renderRouteSelectors();
  renderItinerary();
  renderSuggestions();
  renderPlaceResults();
  renderLlmResults();
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

function handleAddRouteSet(event) {
  event.preventDefault();
  const name = els.routeSetName.value.trim();
  const description = els.routeSetDescription.value.trim();
  if (!name) {
    setStatus("Route set requires a name.", true);
    return;
  }

  const routeSet = {
    id: generateId("set"),
    name,
    description,
    active: state.routeSets.length === 0,
    createdAt: new Date().toISOString(),
    nodes: [],
  };
  state.routeSets.push(routeSet);
  saveState();
  els.routeSetForm.reset();
  renderAll();
  setStatus(`Created route set "${name}".`);
}

async function handleAddRouteNode(event) {
  event.preventDefault();
  const setId = els.routeNodeSet.value;
  const set = state.routeSets.find((entry) => entry.id === setId);
  if (!set) {
    setStatus("Create/select a route set first.", true);
    return;
  }

  const title = els.routeNodeTitle.value.trim();
  const type = els.routeNodeType.value;
  const location = els.routeNodeLocation.value.trim();
  const start = els.routeNodeStart.value || suggestInterleaveStart();
  const notes = els.routeNodeNotes.value.trim();

  if (!title || !location) {
    setStatus("Route node needs title and location.", true);
    return;
  }

  setStatus(`Geocoding route node "${title}"...`);
  try {
    const geo = await geocodeLocation(location);
    addRouteNodeToSet(set.id, {
      title,
      type,
      city: geo.city,
      locationLabel: geo.label,
      lat: geo.lat,
      lng: geo.lng,
      start,
      notes,
      sourceKind: "route-node",
    });
    els.routeNodeForm.reset();
    setStatus(`Added node "${title}" to set "${set.name}".`);
  } catch (error) {
    console.error(error);
    setStatus(`Could not geocode route node: ${error.message}`, true);
  }
}

function addRouteNodeToSet(setId, nodeInput) {
  state.routeSets = state.routeSets.map((set) => {
    if (set.id !== setId) return set;
    const node = {
      id: generateId("node"),
      title: nodeInput.title,
      type: nodeInput.type || "main-location",
      city: nodeInput.city || "",
      locationLabel: nodeInput.locationLabel || nodeInput.city || nodeInput.title,
      lat: Number.isFinite(nodeInput.lat) ? nodeInput.lat : 0,
      lng: Number.isFinite(nodeInput.lng) ? nodeInput.lng : 0,
      start: nodeInput.start || suggestInterleaveStart(),
      end: "",
      notes: nodeInput.notes || "",
      tags: nodeInput.tags || [nodeInput.type || "route-node"],
      sourceKind: nodeInput.sourceKind || "route-node",
      createdAt: new Date().toISOString(),
    };
    const nodes = Array.isArray(set.nodes) ? [...set.nodes, node] : [node];
    return {
      ...set,
      nodes: nodes.sort((a, b) => (Date.parse(a.start) || 0) - (Date.parse(b.start) || 0)),
    };
  });
  saveState();
  renderAll();
}

function renderRouteNodeSetOptions() {
  if (!state.routeSets.length) {
    els.routeNodeSet.innerHTML = "<option value=''>No route set</option>";
    return;
  }
  els.routeNodeSet.innerHTML = state.routeSets
    .map((set) => `<option value="${set.id}">${htmlEscape(set.name)}${set.active ? " (active)" : ""}</option>`)
    .join("");
}

function renderRouteSets() {
  if (!state.routeSets.length) {
    els.routeSetList.innerHTML = "<li class='list-item'>No route sets yet. Create one above.</li>";
    return;
  }

  els.routeSetList.innerHTML = state.routeSets
    .map((set) => {
      const nodes = Array.isArray(set.nodes) ? set.nodes : [];
      const nodeList = nodes.length
        ? nodes.map((node) => `
            <li class="meta">
              ${htmlEscape(node.title)} (${formatDateTime(node.start)})
              <span class="item-actions">
                <button type="button" data-action="focus-route-node" data-set-id="${set.id}" data-node-id="${node.id}">Map</button>
                <button type="button" data-action="remove-route-node" data-set-id="${set.id}" data-node-id="${node.id}">Remove</button>
              </span>
            </li>
          `).join("")
        : "<li class='meta'>No nodes yet.</li>";
      return `
        <li class="list-item">
          <h4>${htmlEscape(set.name)} ${set.active ? "<small>(active)</small>" : "<small>(inactive)</small>"}</h4>
          ${set.description ? `<div class="meta">${htmlEscape(set.description)}</div>` : ""}
          <div class="item-actions">
            <button type="button" data-action="toggle-route-set" data-set-id="${set.id}">${set.active ? "Deactivate" : "Activate"}</button>
            <button type="button" data-action="activate-only-route-set" data-set-id="${set.id}">Use only this set</button>
            <button type="button" data-action="remove-route-set" data-set-id="${set.id}">Remove set</button>
          </div>
          <ul class="list">${nodeList}</ul>
        </li>
      `;
    })
    .join("");
}

function handleRouteSetAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  const setId = button.dataset.setId;
  const nodeId = button.dataset.nodeId;
  const set = state.routeSets.find((entry) => entry.id === setId);
  if (!set) return;

  if (action === "toggle-route-set") {
    state.routeSets = state.routeSets.map((entry) => (entry.id === setId ? { ...entry, active: !entry.active } : entry));
    saveState();
    renderAll();
    setStatus(`Route set "${set.name}" ${set.active ? "deactivated" : "activated"}.`);
    return;
  }

  if (action === "activate-only-route-set") {
    state.routeSets = state.routeSets.map((entry) => ({ ...entry, active: entry.id === setId }));
    saveState();
    renderAll();
    setStatus(`Using only route set "${set.name}".`);
    return;
  }

  if (action === "remove-route-set") {
    state.routeSets = state.routeSets.filter((entry) => entry.id !== setId);
    saveState();
    renderAll();
    setStatus(`Removed route set "${set.name}".`);
    return;
  }

  if (!nodeId) return;
  const node = (set.nodes || []).find((entry) => entry.id === nodeId);
  if (!node) return;

  if (action === "focus-route-node") {
    map.setView([node.lat, node.lng], 12);
    setStatus(`Map centered on route node "${node.title}".`);
    return;
  }

  if (action === "remove-route-node") {
    state.routeSets = state.routeSets.map((entry) => {
      if (entry.id !== setId) return entry;
      return {
        ...entry,
        nodes: (entry.nodes || []).filter((item) => item.id !== nodeId),
      };
    });
    saveState();
    renderAll();
    setStatus(`Removed route node "${node.title}".`);
  }
}

function getSortedActiveRouteNodes() {
  return state.routeSets
    .filter((set) => set.active)
    .flatMap((set) => (set.nodes || []).map((node) => ({
      ...node,
      routeSetId: set.id,
      routeSetName: set.name,
    })))
    .sort((a, b) => (Date.parse(a.start) || 0) - (Date.parse(b.start) || 0));
}

function getPlanningAnchors() {
  return [...getSortedHardPoints(), ...getSortedActiveRouteNodes()]
    .sort((a, b) => (Date.parse(a.start) || 0) - (Date.parse(b.start) || 0));
}

async function handleUnifiedSearch(event) {
  event.preventDefault();
  const query = els.unifiedQuery.value.trim();
  const location = els.unifiedLocation.value.trim();
  const date = els.unifiedDate.value;
  const radiusKm = Number(els.unifiedRadius.value || 35);
  const blendLlm = Boolean(els.unifiedUseLlm.checked);

  if (!query || !location) {
    setStatus("Combined search requires query and anchor location.", true);
    return;
  }

  setStatus("Running two-level combined search...");
  try {
    const geo = await geocodeLocation(location);
    const preferredTags = extractPreferredTagsFromQuery(query);

    const [routeMain, routeTrips, eventSeed, eventVenues, detailPlaces] = await Promise.all([
      getMainLocationsNear(geo.lat, geo.lng, radiusKm),
      Promise.resolve(getTripIdeasNear(geo.lat, geo.lng, radiusKm)),
      Promise.resolve(getSeedEventsNear(geo.lat, geo.lng, date || new Date().toISOString().slice(0, 10), radiusKm)),
      getVenueEventsNear(geo.lat, geo.lng, date || new Date().toISOString().slice(0, 10), radiusKm),
      getDetailPlacesNear(geo.lat, geo.lng, radiusKm),
    ]);

    const routeCandidates = dedupeGenericItems([...routeMain, ...routeTrips]).map((item) => ({
      ...item,
      level: "route",
      relevance: scoreByQuery(item, preferredTags),
    }));
    const detailCandidates = dedupeGenericItems([...eventSeed, ...eventVenues, ...detailPlaces]).map((item) => ({
      ...item,
      level: "detail",
      relevance: scoreByQuery(item, preferredTags),
    }));

    if (blendLlm && state.llm.enabled && state.llm.apiKey) {
      try {
        const llm = await callLlmSearch({
          query,
          location,
          date,
          resultCount: 12,
        });
        llm.forEach((item) => {
          if (item.kind === "event") {
            detailCandidates.push({
              ...item,
              level: "detail",
              relevance: scoreByQuery(item, preferredTags) + 2,
            });
          } else {
            routeCandidates.push({
              ...item,
              level: "route",
              relevance: scoreByQuery(item, preferredTags) + 2,
            });
          }
        });
      } catch (error) {
        console.warn("LLM blending failed", error);
      }
    }

    const sortedRoute = dedupeGenericItems(routeCandidates)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 14);
    const sortedDetail = dedupeGenericItems(detailCandidates)
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 20);

    state.lastUnifiedSearch = {
      query,
      routeNodes: sortedRoute,
      detailStops: sortedDetail,
      generatedAt: new Date().toISOString(),
    };
    saveState();
    renderUnifiedResults();
    renderMap();
    setStatus(`Combined search ready: ${sortedRoute.length} route nodes + ${sortedDetail.length} detail stops.`);
  } catch (error) {
    console.error(error);
    setStatus(`Combined search failed: ${error.message}`, true);
  }
}

function renderUnifiedResults() {
  const routeNodes = state.lastUnifiedSearch?.routeNodes || [];
  const detailStops = state.lastUnifiedSearch?.detailStops || [];

  if (!routeNodes.length) {
    els.unifiedRouteResults.innerHTML = "<div class='result-card'>No route-level results yet.</div>";
  } else {
    els.unifiedRouteResults.innerHTML = routeNodes
      .map((item) => `
        <article class="result-card">
          <strong>${htmlEscape(item.title)}</strong>
          <div class="meta">${htmlEscape(item.kind || item.category || "route-node")} | ${htmlEscape(item.city || "Unknown city")}</div>
          <div class="meta">${htmlEscape(item.description || item.reason || "Route-level candidate")}</div>
          <div class="item-actions">
            <button type="button" data-action="add-route-node" data-id="${item.id}">Add to active set</button>
            <button type="button" data-action="lock-route-node" data-id="${item.id}">Lock as hard point</button>
            <button type="button" data-action="rate-route-node" data-id="${item.id}" data-rating="4">Rate 4</button>
            <button type="button" data-action="rate-route-node" data-id="${item.id}" data-rating="5">Rate 5</button>
          </div>
        </article>
      `)
      .join("");
  }

  if (!detailStops.length) {
    els.unifiedDetailResults.innerHTML = "<div class='result-card'>No detail-level results yet.</div>";
    return;
  }
  els.unifiedDetailResults.innerHTML = detailStops
    .map((item) => `
      <article class="result-card">
        <strong>${htmlEscape(item.title)}</strong>
        <div class="meta">${htmlEscape(item.kind || item.category || "detail")} | ${htmlEscape(item.city || "Unknown city")}</div>
        <div class="meta">${htmlEscape(item.description || item.reason || "Detail place/event candidate")}</div>
        <div class="item-actions">
          <button type="button" data-action="interleave-detail" data-id="${item.id}">Interleave detail stop</button>
          <button type="button" data-action="lock-detail" data-id="${item.id}">Lock as hard point</button>
          <button type="button" data-action="rate-detail" data-id="${item.id}" data-rating="3">Rate 3</button>
          <button type="button" data-action="rate-detail" data-id="${item.id}" data-rating="4">Rate 4</button>
          <button type="button" data-action="rate-detail" data-id="${item.id}" data-rating="5">Rate 5</button>
        </div>
      </article>
    `)
    .join("");
}

async function handleUnifiedRouteAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  const itemId = button.dataset.id;
  const item = (state.lastUnifiedSearch?.routeNodes || []).find((entry) => entry.id === itemId);
  if (!item) return;

  if (action === "rate-route-node") {
    const rating = Number(button.dataset.rating);
    applyRating({
      itemId: item.id,
      title: item.title,
      city: item.city,
      tags: item.tags || [item.kind || "route-node"],
      kind: "route-node-candidate",
    }, rating);
    return;
  }

  try {
    const enriched = await ensureCoordinatesForGenericItem(item);
    if (action === "lock-route-node") {
      pinAsHardPoint({
        title: enriched.title,
        type: enriched.kind || enriched.category || "route-node",
        city: enriched.city,
        locationLabel: enriched.locationQuery || enriched.title,
        lat: enriched.lat,
        lng: enriched.lng,
        notes: "Pinned from combined search route level",
        start: enriched.startHint || suggestInterleaveStart(),
      });
      setStatus(`Locked "${enriched.title}" as hard point.`);
      return;
    }

    if (action === "add-route-node") {
      const set = ensureDefaultRouteSet();
      addRouteNodeToSet(set.id, {
        title: enriched.title,
        type: enriched.kind || enriched.category || "main-location",
        city: enriched.city,
        locationLabel: enriched.locationQuery || enriched.title,
        lat: enriched.lat,
        lng: enriched.lng,
        start: enriched.startHint || suggestInterleaveStart(),
        notes: "Added from combined search (route level)",
        sourceKind: "route-node",
        tags: enriched.tags || [enriched.kind || "route-node"],
      });
      setStatus(`Added "${enriched.title}" to route set "${set.name}".`);
    }
  } catch (error) {
    console.error(error);
    setStatus(`Could not use route-level result: ${error.message}`, true);
  }
}

async function handleUnifiedDetailAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  const itemId = button.dataset.id;
  const item = (state.lastUnifiedSearch?.detailStops || []).find((entry) => entry.id === itemId);
  if (!item) return;

  if (action === "rate-detail") {
    const rating = Number(button.dataset.rating);
    applyRating({
      itemId: item.id,
      title: item.title,
      city: item.city,
      tags: item.tags || [item.kind || item.category || "detail"],
      kind: "detail-stop",
    }, rating);
    return;
  }

  try {
    const enriched = await ensureCoordinatesForGenericItem(item);
    if (action === "lock-detail") {
      pinAsHardPoint({
        title: enriched.title,
        type: enriched.kind || enriched.category || "detail-stop",
        city: enriched.city,
        locationLabel: enriched.locationQuery || enriched.title,
        lat: enriched.lat,
        lng: enriched.lng,
        notes: "Pinned from combined search detail level",
        start: enriched.startHint || suggestInterleaveStart(),
      });
      setStatus(`Locked detail stop "${enriched.title}" as hard point.`);
      return;
    }

    if (action === "interleave-detail") {
      addPlannedStopFromSource(enriched, {
        sourceKind: "detail-stop",
        type: enriched.kind || enriched.category || "detail",
        start: enriched.startHint || suggestInterleaveStart(),
        notes: "Interleaved from combined search detail level",
      });
      setStatus(`Interleaved detail stop "${enriched.title}".`);
    }
  } catch (error) {
    console.error(error);
    setStatus(`Could not use detail-level result: ${error.message}`, true);
  }
}

function ensureDefaultRouteSet() {
  let existing = state.routeSets.find((set) => set.active);
  if (existing) return existing;
  if (!state.routeSets.length) {
    existing = {
      id: generateId("set"),
      name: "Default route set",
      description: "Auto-created for combined search results",
      active: true,
      createdAt: new Date().toISOString(),
      nodes: [],
    };
    state.routeSets.push(existing);
  } else {
    state.routeSets = state.routeSets.map((set, index) => ({ ...set, active: index === 0 }));
    existing = state.routeSets[0];
  }
  saveState();
  renderRouteSets();
  renderRouteNodeSetOptions();
  return existing;
}

function extractPreferredTagsFromQuery(query) {
  const lowered = String(query || "").toLowerCase();
  return DETAIL_CATEGORY_HINTS.filter((token) => lowered.includes(token));
}

function scoreByQuery(item, preferredTags) {
  let score = 20;
  const text = `${item.title || ""} ${item.description || item.reason || ""} ${(item.tags || []).join(" ")} ${item.category || ""}`.toLowerCase();
  preferredTags.forEach((tag) => {
    if (text.includes(tag)) score += 4;
  });
  if ((item.kind || "").includes("trip")) score += preferredTags.includes("trip") ? 4 : 1;
  if ((item.kind || "").includes("event")) score += preferredTags.includes("event") || preferredTags.includes("concert") ? 4 : 1;
  return score;
}

function renderRouteSelectors() {
  const anchors = getPlanningAnchors();
  const options = anchors
    .map((point) => `<option value="${point.id}">${htmlEscape(point.title)} [${htmlEscape(point.sourceKind)}] (${formatShortDate(point.start)})</option>`)
    .join("");

  els.routeOrigin.innerHTML = options || "<option value=''>No route anchors</option>";
  els.routeDestination.innerHTML = options || "<option value=''>No route anchors</option>";

  if (anchors.length >= 2) {
    els.routeOrigin.value = anchors[0].id;
    els.routeDestination.value = anchors[anchors.length - 1].id;
  }
}

function renderItinerary() {
  const timeline = getTimelineItems();
  if (!timeline.length) {
    els.itineraryList.innerHTML = "Add hard points and interleaved items to build your timeline.";
    return;
  }

  const blocks = [];
  for (let i = 0; i < timeline.length; i += 1) {
    const point = timeline[i];
    let lockLabel = "Interleaved flexible stop";
    if (point.locked) {
      lockLabel = "Locked hard point";
    } else if (String(point.sourceKind || "").startsWith("route-node:")) {
      lockLabel = "Route node (main stop)";
    }
    blocks.push(`
      <article class="itinerary-stop">
        <strong>${i + 1}. ${htmlEscape(point.title)}</strong>
        <div class="meta">${lockLabel} (${htmlEscape(point.type || point.sourceKind || "stop")})</div>
        <div class="meta">${formatDateTime(point.start)} ${point.end ? `-> ${formatDateTime(point.end)}` : ""}</div>
        <div class="meta">${htmlEscape(point.city || point.locationLabel)}</div>
        ${(!point.locked && !String(point.sourceKind || "").startsWith("route-node:")) ? `<div class="item-actions"><button type="button" data-action="remove-planned-stop" data-id="${point.id}">Remove interleaved stop</button></div>` : ""}
      </article>
    `);
    const next = timeline[i + 1];
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

function handleItineraryAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  if (action !== "remove-planned-stop") return;
  const itemId = button.dataset.id;
  const point = state.plannedStops.find((entry) => entry.id === itemId);
  if (!point) return;
  state.plannedStops = state.plannedStops.filter((entry) => entry.id !== itemId);
  saveState();
  renderAll();
  setStatus(`Removed interleaved stop "${point.title}".`);
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

async function handlePlaceSearch(event) {
  event.preventDefault();
  const location = els.placeLocation.value.trim();
  const mode = els.placeMode.value;
  const radiusKm = Number(els.placeRadius.value || 25);
  if (!location) {
    setStatus("Location/trip search requires a city or area.", true);
    return;
  }

  setStatus("Searching main locations and trip ideas...");
  try {
    const geo = await geocodeLocation(location);
    const searches = [];
    if (mode !== "trip") {
      searches.push(getMainLocationsNear(geo.lat, geo.lng, radiusKm));
    }
    if (mode !== "main") {
      searches.push(Promise.resolve(getTripIdeasNear(geo.lat, geo.lng, radiusKm)));
    }
    const groups = await Promise.all(searches);
    const merged = dedupeGenericItems(groups.flat());
    state.lastPlaces = merged;
    saveState();
    renderPlaceResults();
    renderMap();
    setStatus(`Found ${merged.length} locations/trips near ${geo.city || location}.`);
  } catch (error) {
    console.error(error);
    setStatus(`Location/trip search failed: ${error.message}`, true);
  }
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

function dedupeGenericItems(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.title}-${item.city}-${item.kind || item.category}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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

async function getMainLocationsNear(lat, lng, radiusKm) {
  const fromSeed = SEED_MAIN_LOCATIONS
    .filter((entry) => haversineKm(lat, lng, entry.lat, entry.lng) <= radiusKm + 200)
    .map((entry) => ({
      ...entry,
      kind: "main-location",
      description: "Popular main location",
    }));

  const fromOverpass = await getOsmMainLocationsNear(lat, lng, radiusKm);
  return dedupeGenericItems([...fromSeed, ...fromOverpass]);
}

async function getOsmMainLocationsNear(lat, lng, radiusKm) {
  const radiusMeters = Math.round(Math.max(1, radiusKm) * 1000);
  const overpassQuery = `
    [out:json][timeout:25];
    (
      node(around:${radiusMeters},${lat},${lng})[tourism~"attraction|museum|gallery|viewpoint|zoo|theme_park"];
      way(around:${radiusMeters},${lat},${lng})[tourism~"attraction|museum|gallery|viewpoint|zoo|theme_park"];
      node(around:${radiusMeters},${lat},${lng})[historic];
      way(around:${radiusMeters},${lat},${lng})[historic];
    );
    out center 35;
  `;

  try {
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: overpassQuery,
    });
    if (!response.ok) return [];
    const payload = await response.json();
    return (payload.elements || []).slice(0, 18).map((entry) => {
      const latitude = Number(entry.lat ?? entry.center?.lat);
      const longitude = Number(entry.lon ?? entry.center?.lon);
      const name = entry.tags?.name || "Main location";
      const category = entry.tags?.tourism || entry.tags?.historic || "location";
      return {
        id: `place-${entry.type}-${entry.id}`,
        title: name,
        city: "Near search area",
        lat: latitude,
        lng: longitude,
        category,
        kind: "main-location",
        description: "Discovered nearby main location.",
        tags: [category, "main-location", "sightseeing"],
      };
    });
  } catch (error) {
    console.warn("Main location lookup failed", error);
    return [];
  }
}

function getTripIdeasNear(lat, lng, radiusKm) {
  const seeded = SEED_TRIP_IDEAS
    .filter((entry) => haversineKm(lat, lng, entry.lat, entry.lng) <= radiusKm + 350)
    .map((entry) => ({ ...entry, kind: "trip" }));

  const catalogTripIdeas = SUGGESTION_CATALOG
    .filter((entry) => ["route", "day-trip", "tour", "walking-tour"].includes(entry.type))
    .filter((entry) => Number.isFinite(entry.lat) && Number.isFinite(entry.lng))
    .filter((entry) => haversineKm(lat, lng, entry.lat, entry.lng) <= radiusKm + 400)
    .map((entry) => ({
      id: `suggestion-trip-${entry.id}`,
      title: entry.title,
      city: entry.city,
      lat: entry.lat,
      lng: entry.lng,
      category: entry.type,
      kind: "trip",
      description: entry.description || "Trip idea from recommendation engine.",
      tags: entry.tags || ["trip"],
    }));

  return dedupeGenericItems([...seeded, ...catalogTripIdeas]);
}

async function getDetailPlacesNear(lat, lng, radiusKm) {
  const radiusMeters = Math.round(Math.max(1, radiusKm) * 1000);
  const overpassQuery = `
    [out:json][timeout:25];
    (
      node(around:${radiusMeters},${lat},${lng})[amenity~"bar|pub|cafe|restaurant|nightclub|arts_centre|theatre|music_venue"];
      way(around:${radiusMeters},${lat},${lng})[amenity~"bar|pub|cafe|restaurant|nightclub|arts_centre|theatre|music_venue"];
      node(around:${radiusMeters},${lat},${lng})[tourism~"museum|gallery|attraction|viewpoint"];
      way(around:${radiusMeters},${lat},${lng})[tourism~"museum|gallery|attraction|viewpoint"];
      node(around:${radiusMeters},${lat},${lng})[shop];
      way(around:${radiusMeters},${lat},${lng})[shop];
      node(around:${radiusMeters},${lat},${lng})[leisure~"park|garden|nature_reserve"];
      way(around:${radiusMeters},${lat},${lng})[leisure~"park|garden|nature_reserve"];
      node(around:${radiusMeters},${lat},${lng})[natural~"peak|cliff"];
      way(around:${radiusMeters},${lat},${lng})[natural~"peak|cliff"];
    );
    out center 60;
  `;

  try {
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: overpassQuery,
    });
    if (!response.ok) return [];
    const payload = await response.json();
    return (payload.elements || []).slice(0, 30).map((entry) => {
      const latitude = Number(entry.lat ?? entry.center?.lat);
      const longitude = Number(entry.lon ?? entry.center?.lon);
      const name = entry.tags?.name || "Interesting place";
      const category = entry.tags?.amenity || entry.tags?.tourism || entry.tags?.shop || entry.tags?.leisure || entry.tags?.natural || "detail";
      const tags = [
        category,
        entry.tags?.tourism,
        entry.tags?.shop ? "shop" : "",
        entry.tags?.amenity ? "venue" : "",
        entry.tags?.natural ? "hike" : "",
      ].filter(Boolean).map((tag) => String(tag).toLowerCase());
      return {
        id: `detail-${entry.type}-${entry.id}`,
        title: name,
        city: "Near search area",
        lat: latitude,
        lng: longitude,
        kind: "detail-place",
        category,
        description: `Detail stop candidate (${category})`,
        tags: tags.length ? tags : ["detail-place"],
      };
    });
  } catch (error) {
    console.warn("Detail places lookup failed", error);
    return [];
  }
}

function renderPlaceResults() {
  if (!state.lastPlaces.length) {
    els.placeResults.innerHTML = "<div class='result-card'>No location/trip search yet.</div>";
    return;
  }

  els.placeResults.innerHTML = state.lastPlaces
    .map((item) => `
      <article class="result-card">
        <strong>${htmlEscape(item.title)}</strong>
        <div class="meta">${htmlEscape(item.city || "Unknown city")} | ${htmlEscape(item.kind || item.category || "location")}</div>
        <div class="meta">${htmlEscape(item.description || "Suggested place/trip")}</div>
        <div class="item-actions">
          <button type="button" data-action="interleave-place" data-id="${item.id}">Interleave in itinerary</button>
          <button type="button" data-action="lock-place" data-id="${item.id}">Lock as hard point</button>
          <button type="button" data-action="rate-place" data-id="${item.id}" data-rating="3">Rate 3</button>
          <button type="button" data-action="rate-place" data-id="${item.id}" data-rating="4">Rate 4</button>
          <button type="button" data-action="rate-place" data-id="${item.id}" data-rating="5">Rate 5</button>
        </div>
      </article>
    `)
    .join("");
}

function handlePlaceAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const itemId = button.dataset.id;
  const action = button.dataset.action;
  const place = state.lastPlaces.find((entry) => entry.id === itemId);
  if (!place) return;

  if (action === "interleave-place") {
    const requestedStart = els.placeInterleaveTime.value || suggestInterleaveStart();
    addPlannedStopFromSource(place, {
      sourceKind: place.kind || "main-location",
      type: place.category || place.kind || "location",
      start: requestedStart,
      notes: "Interleaved from location/trip finder",
    });
    setStatus(`Interleaved "${place.title}" into itinerary timeline.`);
    return;
  }

  if (action === "lock-place") {
    pinAsHardPoint({
      title: place.title,
      type: place.kind || place.category || "location",
      city: place.city,
      locationLabel: place.title,
      lat: place.lat,
      lng: place.lng,
      notes: "Pinned from main location/trip finder",
      start: els.placeInterleaveTime.value || suggestInterleaveStart(),
    });
    setStatus(`Locked "${place.title}" as hard point.`);
    return;
  }

  if (action === "rate-place") {
    const rating = Number(button.dataset.rating);
    applyRating({
      itemId: place.id,
      title: place.title,
      city: place.city,
      tags: place.tags || [place.kind || "location"],
      kind: place.kind || "main-location",
    }, rating);
  }
}

function handleSaveLlmConfig(event) {
  event.preventDefault();
  state.llm = {
    endpoint: (els.llmApiEndpoint.value || DEFAULT_LLM_CONFIG.endpoint).trim(),
    model: (els.llmModel.value || DEFAULT_LLM_CONFIG.model).trim(),
    apiKey: els.llmApiKey.value.trim(),
    enabled: Boolean(els.llmEnabled.checked),
  };
  saveState();
  setStatus("LLM search settings saved.");
}

async function handleLlmSearch(event) {
  event.preventDefault();
  const query = els.llmQuery.value.trim();
  const location = els.llmSearchLocation.value.trim();
  const date = els.llmSearchDate.value;
  const resultCount = Number(els.llmResultCount.value || 8);

  if (!query) {
    setStatus("LLM search requires a natural-language query.", true);
    return;
  }
  if (!state.llm.enabled) {
    setStatus("Enable LLM search first in the settings above.", true);
    return;
  }
  if (!state.llm.apiKey) {
    setStatus("Add an API key before running LLM search.", true);
    return;
  }

  setStatus("Running LLM-based search...");
  try {
    const llmItems = await callLlmSearch({ query, location, date, resultCount });
    state.lastLlmResults = dedupeGenericItems(llmItems);
    saveState();
    renderLlmResults();
    renderMap();
    setStatus(`LLM search returned ${state.lastLlmResults.length} results.`);
  } catch (error) {
    console.error(error);
    setStatus(`LLM search failed: ${error.message}`, true);
  }
}

async function callLlmSearch({ query, location, date, resultCount }) {
  const hardPointContext = getSortedHardPoints().slice(0, 10).map((point) => ({
    title: point.title,
    city: point.city,
    start: point.start,
    type: point.type,
  }));

  const payload = {
    model: state.llm.model,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content: [
          "You are a trip planning assistant.",
          "Return ONLY valid JSON.",
          "Generate recommendations for main locations, events, and trips that can be interleaved in an itinerary.",
          "Prefer results relevant to traveler profile and hard-point timing.",
          "Output either a JSON object with key 'results' or a JSON array.",
          "Each result item fields:",
          "title (string), kind ('main-location'|'event'|'trip'), city (string), date (YYYY-MM-DD optional),",
          "startHint (YYYY-MM-DDTHH:mm optional), tags (array of strings), reason (string), locationQuery (string optional), lat (number optional), lng (number optional).",
        ].join(" "),
      },
      {
        role: "user",
        content: JSON.stringify({
          userQuery: query,
          anchorLocation: location || null,
          targetDate: date || null,
          maxResults: Math.min(20, Math.max(1, resultCount)),
          travelerProfile: state.profile,
          memoryTopTags: Object.entries(state.memory.tagScores).sort((a, b) => b[1] - a[1]).slice(0, 8),
          hardPoints: hardPointContext,
          existingRecentPlaceResults: state.lastPlaces.slice(0, 15),
          existingRecentEventResults: state.lastEvents.slice(0, 15),
        }),
      },
    ],
  };

  const response = await fetch(state.llm.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${state.llm.apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`LLM provider returned ${response.status}: ${details.slice(0, 240)}`);
  }

  const responseJson = await response.json();
  const rawContent = responseJson.choices?.[0]?.message?.content;
  let content = "";
  if (Array.isArray(rawContent)) {
    content = rawContent.map((part) => (typeof part === "string" ? part : part?.text || "")).join("\n");
  } else {
    content = String(rawContent || "");
  }
  if (!content.trim()) {
    throw new Error("LLM provider returned an empty answer.");
  }

  const parsed = parseJsonFromLlmText(content);
  const rawItems = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed.results)
      ? parsed.results
      : Array.isArray(parsed.items)
        ? parsed.items
        : [];

  if (!rawItems.length) {
    throw new Error("LLM response contained no result items.");
  }

  return normalizeLlmResults(rawItems, { location, date, resultCount });
}

function parseJsonFromLlmText(text) {
  const candidates = [text.trim()];
  const codeBlock = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/```([\s\S]*?)```/);
  if (codeBlock?.[1]) candidates.push(codeBlock[1].trim());

  const objectStart = text.indexOf("{");
  const objectEnd = text.lastIndexOf("}");
  if (objectStart !== -1 && objectEnd > objectStart) {
    candidates.push(text.slice(objectStart, objectEnd + 1).trim());
  }

  const arrayStart = text.indexOf("[");
  const arrayEnd = text.lastIndexOf("]");
  if (arrayStart !== -1 && arrayEnd > arrayStart) {
    candidates.push(text.slice(arrayStart, arrayEnd + 1).trim());
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      // Keep trying alternate extraction strategies.
    }
  }
  throw new Error("LLM output was not valid JSON.");
}

function normalizeLlmResults(rawItems, { location, date, resultCount }) {
  const allowedKinds = new Set(["main-location", "event", "trip"]);
  return rawItems
    .slice(0, Math.min(20, Math.max(1, resultCount)))
    .map((item) => {
      const rawKind = String(item.kind || "main-location").toLowerCase().trim();
      const kind = allowedKinds.has(rawKind) ? rawKind : "main-location";
      const tags = Array.isArray(item.tags)
        ? item.tags.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean)
        : parseTags(item.tags || kind);
      const lat = Number(item.lat);
      const lng = Number(item.lng);
      const fallbackDate = date || "";
      const startHint = String(item.startHint || "").trim()
        || (item.date ? `${item.date}T12:00` : "")
        || (fallbackDate ? `${fallbackDate}T12:00` : "");
      const city = String(item.city || location || "").trim();
      const title = String(item.title || "").trim();
      const locationQuery = String(item.locationQuery || `${title}${city ? `, ${city}` : ""}`).trim();
      return {
        id: generateId("llm"),
        title: title || "Suggested stop",
        kind,
        city,
        date: String(item.date || fallbackDate || "").trim(),
        startHint,
        tags: tags.length ? tags : [kind],
        description: String(item.reason || item.description || "LLM suggested this stop for your trip.").trim(),
        locationQuery,
        lat: Number.isFinite(lat) ? lat : null,
        lng: Number.isFinite(lng) ? lng : null,
      };
    })
    .filter((item) => item.title);
}

function renderLlmResults() {
  if (!state.lastLlmResults.length) {
    els.llmSearchResults.innerHTML = "<div class='result-card'>No LLM search results yet.</div>";
    return;
  }

  els.llmSearchResults.innerHTML = state.lastLlmResults
    .map((item) => `
      <article class="result-card">
        <strong>${htmlEscape(item.title)}</strong>
        <div class="meta">${htmlEscape(item.kind)} | ${htmlEscape(item.city || "City not set")}${item.date ? ` | ${htmlEscape(item.date)}` : ""}</div>
        <div class="meta">${htmlEscape(item.description || "LLM recommendation")}</div>
        <div class="meta">${Number.isFinite(item.lat) && Number.isFinite(item.lng) ? "Map coordinates available" : "Coordinates will be resolved on add"}</div>
        <div class="chip-list">${(item.tags || []).map((tag) => `<span class="chip">${htmlEscape(tag)}</span>`).join("")}</div>
        <div class="item-actions">
          <button type="button" data-action="interleave-llm" data-id="${item.id}">Interleave in itinerary</button>
          <button type="button" data-action="lock-llm" data-id="${item.id}">Lock as hard point</button>
          <button type="button" data-action="rate-llm" data-id="${item.id}" data-rating="3">Rate 3</button>
          <button type="button" data-action="rate-llm" data-id="${item.id}" data-rating="4">Rate 4</button>
          <button type="button" data-action="rate-llm" data-id="${item.id}" data-rating="5">Rate 5</button>
        </div>
      </article>
    `)
    .join("");
}

async function handleLlmAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  const itemId = button.dataset.id;
  const item = state.lastLlmResults.find((entry) => entry.id === itemId);
  if (!item) return;

  if (action === "rate-llm") {
    const rating = Number(button.dataset.rating);
    applyRating({
      itemId: item.id,
      title: item.title,
      city: item.city,
      tags: item.tags || [item.kind],
      kind: `llm-${item.kind}`,
    }, rating);
    return;
  }

  try {
    setStatus(`Resolving location for "${item.title}"...`);
    const enriched = await ensureLlmItemCoordinates(item);
    const suggestedStart = enriched.startHint || suggestInterleaveStart();
    if (action === "interleave-llm") {
      addPlannedStopFromSource(enriched, {
        sourceKind: `llm-${enriched.kind}`,
        type: enriched.kind,
        start: suggestedStart,
        notes: "Interleaved from LLM search",
      });
      setStatus(`Interleaved "${enriched.title}" from LLM search.`);
      return;
    }

    if (action === "lock-llm") {
      pinAsHardPoint({
        title: enriched.title,
        type: enriched.kind,
        city: enriched.city,
        locationLabel: enriched.locationQuery || enriched.city || enriched.title,
        lat: enriched.lat,
        lng: enriched.lng,
        notes: "Pinned from LLM search",
        start: suggestedStart,
      });
      setStatus(`Locked "${enriched.title}" as hard point from LLM search.`);
    }
  } catch (error) {
    console.error(error);
    setStatus(`Could not add LLM result: ${error.message}`, true);
  }
}

async function ensureLlmItemCoordinates(item) {
  if (Number.isFinite(item.lat) && Number.isFinite(item.lng)) {
    return item;
  }
  if (!item.locationQuery) {
    throw new Error("Result does not have enough location info.");
  }

  const geo = await geocodeLocation(item.locationQuery);
  const enriched = {
    ...item,
    city: item.city || geo.city,
    lat: geo.lat,
    lng: geo.lng,
    locationQuery: geo.label || item.locationQuery,
  };
  state.lastLlmResults = state.lastLlmResults.map((entry) => (entry.id === item.id ? enriched : entry));
  saveState();
  renderLlmResults();
  renderMap();
  return enriched;
}

async function ensureCoordinatesForGenericItem(item) {
  if (Number.isFinite(item.lat) && Number.isFinite(item.lng)) {
    return item;
  }
  const lookup = item.locationQuery || [item.title, item.city].filter(Boolean).join(", ");
  if (!lookup.trim()) {
    throw new Error("No location text available for geocoding.");
  }
  const geo = await geocodeLocation(lookup);
  return {
    ...item,
    city: item.city || geo.city,
    lat: geo.lat,
    lng: geo.lng,
    locationQuery: geo.label || lookup,
  };
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
          <button type="button" data-action="interleave-event" data-id="${event.id}">Interleave in itinerary</button>
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

  if (action === "interleave-event") {
    const requestedStart = els.eventInterleaveTime.value || `${eventData.date}T19:00`;
    addPlannedStopFromSource(eventData, {
      sourceKind: "event",
      type: "event",
      start: requestedStart,
      notes: "Interleaved from event finder",
    });
    setStatus(`Interleaved event "${eventData.title}" into itinerary timeline.`);
    return;
  }

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
  if (getPlanningAnchors().length < 2) {
    setStatus("Need at least two route anchors (hard points and/or active route nodes).", true);
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
  const points = getPlanningAnchors().filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng));
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
  layers.routeNodes.clearLayers();
  layers.plannedStops.clearLayers();
  layers.itineraryPath.clearLayers();
  layers.routes.clearLayers();
  layers.events.clearLayers();
  layers.unified.clearLayers();
  layers.llm.clearLayers();

  const mapElements = [];
  const sorted = getSortedHardPoints();
  sorted.forEach((point, index) => {
    if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng)) return;
    const marker = L.marker([point.lat, point.lng], { title: point.title })
      .bindPopup(`<strong>${htmlEscape(point.title)}</strong><br>${htmlEscape(point.locationLabel || point.city || "")}<br>Hard point #${index + 1}`);
    marker.addTo(layers.hardPoints);
    mapElements.push(marker);
  });

  const activeRouteNodes = getSortedActiveRouteNodes();
  activeRouteNodes.forEach((node) => {
    if (!Number.isFinite(node.lat) || !Number.isFinite(node.lng)) return;
    const marker = L.circleMarker([node.lat, node.lng], {
      radius: 7,
      color: "#18667f",
      fillColor: "#3aa0bf",
      fillOpacity: 0.85,
    }).bindPopup(`<strong>${htmlEscape(node.title)}</strong><br>Route node (${htmlEscape(node.routeSetName || "set")})`);
    marker.addTo(layers.routeNodes);
    mapElements.push(marker);
  });

  const plannedStops = getSortedPlannedStops();
  plannedStops.forEach((stop) => {
    if (!Number.isFinite(stop.lat) || !Number.isFinite(stop.lng)) return;
    const marker = L.circleMarker([stop.lat, stop.lng], {
      radius: 6,
      color: "#7555c8",
      fillColor: "#9a7cf3",
      fillOpacity: 0.8,
    }).bindPopup(`<strong>${htmlEscape(stop.title)}</strong><br>Interleaved ${htmlEscape(stop.sourceKind || "stop")}`);
    marker.addTo(layers.plannedStops);
    mapElements.push(marker);
  });

  const timelineCoords = getTimelineItems()
    .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng))
    .map((point) => [point.lat, point.lng]);
  if (timelineCoords.length >= 2) {
    const path = L.polyline(timelineCoords, { color: "#355f9e", weight: 3, dashArray: "6,6" }).addTo(layers.itineraryPath);
    mapElements.push(path);
  } else if (sorted.length >= 2) {
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

  (state.lastUnifiedSearch?.routeNodes || []).forEach((item) => {
    if (!Number.isFinite(item.lat) || !Number.isFinite(item.lng)) return;
    const marker = L.circleMarker([item.lat, item.lng], {
      radius: 5,
      color: "#0f7f95",
      fillColor: "#4cb5ca",
      fillOpacity: 0.75,
    }).bindPopup(`<strong>${htmlEscape(item.title)}</strong><br>Combined route-level candidate`);
    marker.addTo(layers.unified);
    mapElements.push(marker);
  });
  (state.lastUnifiedSearch?.detailStops || []).forEach((item) => {
    if (!Number.isFinite(item.lat) || !Number.isFinite(item.lng)) return;
    const marker = L.circleMarker([item.lat, item.lng], {
      radius: 4,
      color: "#99570d",
      fillColor: "#f09a35",
      fillOpacity: 0.75,
    }).bindPopup(`<strong>${htmlEscape(item.title)}</strong><br>Combined detail candidate`);
    marker.addTo(layers.unified);
    mapElements.push(marker);
  });

  state.lastLlmResults.forEach((item) => {
    if (!Number.isFinite(item.lat) || !Number.isFinite(item.lng)) return;
    const marker = L.circleMarker([item.lat, item.lng], {
      radius: 5,
      color: "#0d8a6b",
      fillColor: "#22b78f",
      fillOpacity: 0.85,
    }).bindPopup(`<strong>${htmlEscape(item.title)}</strong><br>LLM ${htmlEscape(item.kind)}`);
    marker.addTo(layers.llm);
    mapElements.push(marker);
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

function getSortedPlannedStops() {
  return [...state.plannedStops].sort((a, b) => {
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

function sortPlannedStopsInPlace() {
  state.plannedStops.sort((a, b) => {
    const da = Date.parse(a.start) || 0;
    const db = Date.parse(b.start) || 0;
    return da - db;
  });
}

function getTimelineItems() {
  const hard = getSortedHardPoints().map((point) => ({
    ...point,
    locked: true,
    sourceKind: "hard-point",
  }));
  const routeNodes = getSortedActiveRouteNodes().map((node) => ({
    ...node,
    locked: false,
    sourceKind: `route-node:${node.routeSetName || "set"}`,
  }));
  const planned = getSortedPlannedStops().map((point) => ({
    ...point,
    locked: false,
    sourceKind: point.sourceKind || "interleave",
  }));
  return [...hard, ...routeNodes, ...planned].sort((a, b) => {
    const da = Date.parse(a.start) || 0;
    const db = Date.parse(b.start) || 0;
    if (da === db) {
      return Number(b.locked) - Number(a.locked);
    }
    return da - db;
  });
}

function suggestInterleaveStart() {
  const timeline = getTimelineItems();
  const now = new Date();
  if (!timeline.length) {
    now.setHours(now.getHours() + 4);
    return now.toISOString().slice(0, 16);
  }

  const firstFuture = timeline.find((entry) => Date.parse(entry.start) > Date.now());
  if (firstFuture) {
    const start = new Date(firstFuture.start);
    start.setHours(start.getHours() - 2);
    return start.toISOString().slice(0, 16);
  }

  const last = timeline[timeline.length - 1];
  const next = new Date(last.start);
  next.setHours(next.getHours() + 3);
  return next.toISOString().slice(0, 16);
}

function addPlannedStopFromSource(source, { sourceKind, type, start, notes }) {
  const plannedStop = {
    id: generateId("plan"),
    title: source.title,
    type: type || source.category || source.kind || "stop",
    sourceKind: sourceKind || source.kind || "interleave",
    start: start || suggestInterleaveStart(),
    end: "",
    city: source.city || "",
    locationLabel: source.venue || source.title || source.city || "",
    lat: Number.isFinite(source.lat) ? source.lat : 0,
    lng: Number.isFinite(source.lng) ? source.lng : 0,
    bookingRef: "",
    notes: notes || "",
    createdAt: new Date().toISOString(),
  };
  state.plannedStops.push(plannedStop);
  sortPlannedStopsInPlace();
  saveState();
  renderAll();
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
  if (!els.unifiedDate.value) {
    els.unifiedDate.value = date.toISOString().slice(0, 10);
  }
  if (!els.llmSearchDate.value) {
    els.llmSearchDate.value = date.toISOString().slice(0, 10);
  }
  const eventStart = new Date(date);
  eventStart.setHours(19, 0, 0, 0);
  els.eventInterleaveTime.value = eventStart.toISOString().slice(0, 16);
  const placeStart = new Date();
  placeStart.setHours(placeStart.getHours() + 6);
  els.placeInterleaveTime.value = placeStart.toISOString().slice(0, 16);
  if (!els.routeNodeStart.value) {
    const routeNodeStart = new Date();
    routeNodeStart.setHours(routeNodeStart.getHours() + 5);
    els.routeNodeStart.value = routeNodeStart.toISOString().slice(0, 16);
  }
}

function init() {
  bindElements();
  initMap();
  bindEvents();
  hydrateProfileForm();
  hydrateLlmForm();
  setDefaultEventDate();
  renderAll();
  setStatus("MindTrip planner ready. Add hard points to begin.");
}

window.addEventListener("DOMContentLoaded", init);
