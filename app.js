import {
  DEFAULT_LLM_CONFIG,
  DETAIL_CATEGORY_HINTS,
  ROUTE_COLORS,
  ROUTE_PROFILES,
  SEED_EVENTS,
  SEED_MAIN_LOCATIONS,
  SEED_TRIP_IDEAS,
  STORAGE_KEY,
  SUGGESTION_CATALOG,
} from "./src/constants.js";
import {
  dateDiffDays,
  formatDateTime,
  formatDurationMinutes,
  formatShortDate,
  generateId,
  haversineKm,
  htmlEscape,
  normalizeCity,
  parseDateInput,
  parseTags,
} from "./src/utils.js";

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
    tripContext: {
      startDate: "",
      endDate: "",
      primaryDestination: "",
      mustInclude: [],
      avoid: [],
      styleNotes: "",
      likedExamples: [],
      inferredIdeas: [],
    },
    conversation: {
      mode: "main-planning",
      sideTrackTopic: "",
      messages: [],
      learnedLikes: {},
      learnedDislikes: {},
    },
    hardPoints: [],
    softPois: [],
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
    outlineDraft: {
      blocks: [],
      strategies: [],
      generalStrategy: null,
      blockTweaks: {},
      focusedBlockId: "",
      updatedAt: "",
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
      tripContext: {
        ...defaults.tripContext,
        ...(parsed.tripContext || {}),
        likedExamples: Array.isArray(parsed?.tripContext?.likedExamples) ? parsed.tripContext.likedExamples : [],
        inferredIdeas: Array.isArray(parsed?.tripContext?.inferredIdeas) ? parsed.tripContext.inferredIdeas : [],
      },
      softPois: Array.isArray(parsed.softPois) ? parsed.softPois : [],
      conversation: {
        ...defaults.conversation,
        ...(parsed.conversation || {}),
        messages: Array.isArray(parsed?.conversation?.messages) ? parsed.conversation.messages : [],
        learnedLikes: parsed?.conversation?.learnedLikes || {},
        learnedDislikes: parsed?.conversation?.learnedDislikes || {},
      },
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
      outlineDraft: {
        ...defaults.outlineDraft,
        ...(parsed.outlineDraft || {}),
        blocks: Array.isArray(parsed?.outlineDraft?.blocks) ? parsed.outlineDraft.blocks : [],
        strategies: Array.isArray(parsed?.outlineDraft?.strategies) ? parsed.outlineDraft.strategies : [],
        blockTweaks: parsed?.outlineDraft?.blockTweaks || {},
        generalStrategy: parsed?.outlineDraft?.generalStrategy || null,
        focusedBlockId: parsed?.outlineDraft?.focusedBlockId || "",
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
    "tripContextForm",
    "tripStartDate",
    "tripEndDate",
    "tripPrimaryDestination",
    "tripMustInclude",
    "tripAvoid",
    "tripStyleNotes",
    "tripLikedExamples",
    "llmItineraryForm",
    "itineraryGenerationRequest",
    "itineraryGenerationLimit",
    "itineraryReplaceGenerated",
    "tripContextSummary",
    "conversationForm",
    "conversationInput",
    "sideTrackTopic",
    "startSideTrackBtn",
    "returnMainPlanningBtn",
    "generateOutlineBtn",
    "suggestFillStrategiesBtn",
    "showUnderstandingBtn",
    "conversationTranscript",
    "conversationInsights",
    "softPoiList",
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
    "llmProvider",
    "llmApiEndpoint",
    "llmModel",
    "llmDeployment",
    "llmApiVersion",
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
    "phaseVisual",
    "routeStripVisual",
    "activityMixVisual",
    "tripPulseVisual",
    "mapLegend",
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
  els.tripContextForm.addEventListener("submit", handleSaveTripContext);
  els.llmItineraryForm.addEventListener("submit", handleGenerateLlmItineraryParts);
  els.conversationForm.addEventListener("submit", handleConversationSubmit);
  els.startSideTrackBtn.addEventListener("click", handleStartSideTrack);
  els.returnMainPlanningBtn.addEventListener("click", handleReturnToMainPlanning);
  els.generateOutlineBtn.addEventListener("click", handleGenerateRoughOutline);
  els.suggestFillStrategiesBtn.addEventListener("click", handleSuggestFillStrategies);
  els.showUnderstandingBtn.addEventListener("click", handleShowUnderstandingSnapshot);
  els.conversationTranscript.addEventListener("click", handleConversationAction);
  els.softPoiList.addEventListener("click", handleSoftPoiAction);
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

function hydrateTripContextForm() {
  els.tripStartDate.value = state.tripContext.startDate || "";
  els.tripEndDate.value = state.tripContext.endDate || "";
  els.tripPrimaryDestination.value = state.tripContext.primaryDestination || "";
  els.tripMustInclude.value = (state.tripContext.mustInclude || []).join(", ");
  els.tripAvoid.value = (state.tripContext.avoid || []).join(", ");
  els.tripStyleNotes.value = state.tripContext.styleNotes || "";
  els.tripLikedExamples.value = (state.tripContext.likedExamples || []).join("\n");
}

function hydrateLlmForm() {
  els.llmProvider.value = state.llm.provider || DEFAULT_LLM_CONFIG.provider;
  els.llmApiEndpoint.value = state.llm.endpoint || DEFAULT_LLM_CONFIG.endpoint;
  els.llmModel.value = state.llm.model || DEFAULT_LLM_CONFIG.model;
  els.llmDeployment.value = state.llm.deployment || DEFAULT_LLM_CONFIG.deployment;
  els.llmApiVersion.value = state.llm.apiVersion || DEFAULT_LLM_CONFIG.apiVersion;
  els.llmApiKey.value = state.llm.apiKey || "";
  els.llmEnabled.checked = Boolean(state.llm.enabled && state.llm.apiKey);
}

function renderAll() {
  renderMemorySummary();
  renderTripContextSummary();
  renderConversation();
  renderConversationInsights();
  renderSoftPois();
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
  renderExperienceVisuals();
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

function handleSaveTripContext(event) {
  event.preventDefault();
  const likedExamples = String(els.tripLikedExamples.value || "")
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);
  state.tripContext = {
    startDate: els.tripStartDate.value || "",
    endDate: els.tripEndDate.value || "",
    primaryDestination: els.tripPrimaryDestination.value.trim(),
    mustInclude: parseTags(els.tripMustInclude.value),
    avoid: parseTags(els.tripAvoid.value),
    styleNotes: els.tripStyleNotes.value.trim(),
    likedExamples,
    inferredIdeas: state.tripContext.inferredIdeas || [],
  };
  applyLikedExamplesToMemory(likedExamples);
  saveState();
  renderTripContextSummary();
  setStatus("Trip context saved for itinerary generation.");
}

function renderTripContextSummary() {
  const hardCount = state.hardPoints.length;
  const generatedCount = state.plannedStops.filter((stop) => stop.sourceKind === "llm-itinerary").length;
  const windows = calculatePlanningWindows();
  els.tripContextSummary.innerHTML = `
    <div><strong>Trip range:</strong> ${htmlEscape(state.tripContext.startDate || "not set")} ${state.tripContext.endDate ? `to ${htmlEscape(state.tripContext.endDate)}` : ""}</div>
    <div><strong>Primary destination:</strong> ${htmlEscape(state.tripContext.primaryDestination || "not set")}</div>
    <div><strong>Must include:</strong> ${htmlEscape((state.tripContext.mustInclude || []).join(", ") || "none")}</div>
    <div><strong>Avoid:</strong> ${htmlEscape((state.tripContext.avoid || []).join(", ") || "none")}</div>
    <div><strong>Loved examples:</strong> ${htmlEscape((state.tripContext.likedExamples || []).slice(0, 3).join(" | ") || "none")}</div>
    <div><strong>Inferred trip ideas:</strong> ${htmlEscape((state.tripContext.inferredIdeas || []).slice(0, 4).join(" | ") || "none yet")}</div>
    <div><strong>Hard points:</strong> ${hardCount} | <strong>LLM-generated parts:</strong> ${generatedCount}</div>
    <div><strong>Fill windows detected:</strong> ${windows.length}</div>
  `;
}

function applyLikedExamplesToMemory(examples) {
  const parsedExamples = Array.isArray(examples) ? examples : [];
  const extractedTags = [];
  parsedExamples.forEach((entry) => {
    extractedTags.push(...extractPreferenceTagsFromText(entry));
    const geoTags = parseTags(entry).filter((token) => token.length > 3);
    extractedTags.push(...geoTags.slice(0, 3));
  });
  const unique = [...new Set(extractedTags.map((tag) => normalizePreferenceTag(tag)).filter(Boolean))];
  if (!unique.length) return;
  applyConversationPreference(unique, 1, "liked-examples");
}

function storeTripIdeasFromMessage(text, { onlyIfInitial = false } = {}) {
  const ideas = extractTripIdeasFromMessage(text);
  if (!ideas.length) return false;

  const existing = state.tripContext.inferredIdeas || [];
  if (onlyIfInitial && existing.length) {
    return false;
  }

  const merged = [...new Set([...existing, ...ideas])].slice(0, 30);
  if (merged.length === existing.length) {
    return false;
  }

  state.tripContext.inferredIdeas = merged;
  applyLikedExamplesToMemory(ideas);
  return true;
}

function extractTripIdeasFromMessage(text) {
  const raw = String(text || "");
  if (!raw.trim()) return [];

  const markerMatch = raw.match(/(?:things i like(?: would be)?|for example|examples?)[^:]*:\s*([\s\S]+)/i);
  const source = markerMatch ? markerMatch[1] : raw;
  const normalized = source.replace(/\band\b/gi, ",");
  const chunks = normalized
    .split(/,|;|\n/)
    .map((chunk) => chunk.trim().replace(/^[-*]\s*/, ""))
    .filter((chunk) => chunk.length >= 4);

  const blacklist = new Set([
    "trip context",
    "user context",
    "hard points",
    "no planning",
    "show context",
    "rough outline",
  ]);

  return [...new Set(chunks)]
    .filter((chunk) => !blacklist.has(chunk.toLowerCase()))
    .slice(0, 12);
}

function ensureConversationInitialized() {
  if (state.conversation.messages.length) return;
  const seedOptions = getPersonalizedSuggestions(3).map((item) => ({
    id: generateId("conv-opt"),
    title: item.title,
    kind: item.type || "activity",
    city: item.city,
    tags: item.tags || [],
    reason: item.description || "Starter option from your current profile.",
    locationQuery: `${item.title}${item.city ? `, ${item.city}` : ""}`,
    lat: item.lat,
    lng: item.lng,
  }));
  pushConversationMessage(
    "assistant",
    "Let us plan together. Tell me what you like/dislike and I will keep learning. I can also go deep on side-tracks and then fold it back into your main trip plan.",
    seedOptions
  );
}

function pushConversationMessage(role, text, options = []) {
  state.conversation.messages.push({
    id: generateId("msg"),
    role,
    text,
    when: new Date().toISOString(),
    options: options.map((option) => ({
      ...option,
      id: option.id || generateId("conv-opt"),
      tags: Array.isArray(option.tags) ? option.tags : [],
    })),
  });
  state.conversation.messages = state.conversation.messages.slice(-80);
}

function renderConversation() {
  if (!state.conversation.messages.length) {
    els.conversationTranscript.innerHTML = "<div class='chat-message assistant'>No conversation yet.</div>";
    return;
  }
  els.conversationTranscript.innerHTML = state.conversation.messages
    .map((message) => {
      const options = Array.isArray(message.options) ? message.options : [];
      const optionsHtml = options.length
        ? `<div class="results">
            ${options.map((option) => `
              <div class="result-card">
                <strong>${htmlEscape(option.title)}</strong>
                <div class="meta">${htmlEscape(option.kind || "option")} | ${htmlEscape(option.city || "city not set")}</div>
                <div class="meta">${htmlEscape(option.reason || option.description || "")}</div>
                <div class="chip-list">${(option.tags || []).map((tag) => `<span class="chip">${htmlEscape(tag)}</span>`).join("")}</div>
                <div class="item-actions">
                  <button type="button" data-action="option-feedback" data-message-id="${message.id}" data-option-id="${option.id}" data-feedback="love">Love</button>
                  <button type="button" data-action="option-feedback" data-message-id="${message.id}" data-option-id="${option.id}" data-feedback="maybe">Maybe</button>
                  <button type="button" data-action="option-feedback" data-message-id="${message.id}" data-option-id="${option.id}" data-feedback="no">No</button>
                  ${option.kind === "outline-block"
                    ? `<button type="button" data-action="option-dive-block" data-message-id="${message.id}" data-option-id="${option.id}">Dive into this point</button>`
                    : option.kind === "strategy"
                    ? `<button type="button" data-action="option-use-strategy" data-message-id="${message.id}" data-option-id="${option.id}">Use strategy</button>`
                    : `<button type="button" data-action="option-soft-poi" data-message-id="${message.id}" data-option-id="${option.id}">Soft add POI</button>
                       <button type="button" data-action="option-interleave" data-message-id="${message.id}" data-option-id="${option.id}">Interleave</button>
                       <button type="button" data-action="option-lock" data-message-id="${message.id}" data-option-id="${option.id}">Lock</button>`
                  }
                </div>
              </div>
            `).join("")}
          </div>`
        : "";
      return `
        <article class="chat-message ${message.role === "user" ? "user" : "assistant"}">
          <div class="meta"><strong>${message.role === "user" ? "You" : "Planner"}</strong> | ${formatDateTime(message.when)}</div>
          <div>${htmlEscape(message.text)}</div>
          ${optionsHtml}
        </article>
      `;
    })
    .join("");
  els.conversationTranscript.scrollTop = els.conversationTranscript.scrollHeight;
}

function renderConversationInsights() {
  const likeEntries = Object.entries(state.conversation.learnedLikes || {}).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const dislikeEntries = Object.entries(state.conversation.learnedDislikes || {}).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const mode = state.conversation.mode || "main-planning";
  const sideTrack = state.conversation.sideTrackTopic || "";
  const generalStrategy = state.outlineDraft.generalStrategy?.title || "none";
  const focusedBlock = state.outlineDraft.focusedBlockId || "none";
  const tweakCount = Object.keys(state.outlineDraft.blockTweaks || {}).length;
  els.conversationInsights.innerHTML = `
    <div><strong>Conversation mode:</strong> ${htmlEscape(mode)}${sideTrack ? ` (${htmlEscape(sideTrack)})` : ""}</div>
    <div><strong>General strategy:</strong> ${htmlEscape(generalStrategy)} | <strong>Focused point:</strong> ${htmlEscape(focusedBlock)} | <strong>Point tweaks:</strong> ${tweakCount}</div>
    <div><strong>Learned likes:</strong> ${htmlEscape(likeEntries.map(([tag]) => tag).join(", ") || "none yet")}</div>
    <div><strong>Learned dislikes:</strong> ${htmlEscape(dislikeEntries.map(([tag]) => tag).join(", ") || "none yet")}</div>
  `;
}

function addSoftPoiFromSource(source, { sourceKind, type, notes, startHint }) {
  const item = {
    id: generateId("poi"),
    title: source.title,
    kind: type || source.kind || source.category || "poi",
    sourceKind: sourceKind || source.sourceKind || "soft-poi",
    city: source.city || "",
    locationQuery: source.locationQuery || source.locationLabel || source.venue || source.title || "",
    startHint: startHint || source.startHint || "",
    notes: notes || source.notes || "",
    tags: Array.isArray(source.tags) ? source.tags : parseTags(source.tags || source.kind || "poi"),
    lat: Number(source.lat),
    lng: Number(source.lng),
    createdAt: new Date().toISOString(),
  };
  state.softPois.unshift(item);
  state.softPois = state.softPois.slice(0, 120);
  saveState();
  renderSoftPois();
}

function renderSoftPois() {
  if (!state.softPois.length) {
    els.softPoiList.innerHTML = "<li class='list-item'>No tentative POIs yet.</li>";
    return;
  }
  els.softPoiList.innerHTML = state.softPois
    .map((poi) => `
      <li class="list-item">
        <h4>${htmlEscape(poi.title)}</h4>
        <div class="meta">${htmlEscape(poi.kind)} | ${htmlEscape(poi.city || "Unknown city")}</div>
        ${poi.notes ? `<div class="meta">${htmlEscape(poi.notes)}</div>` : ""}
        <div class="item-actions">
          <button type="button" data-action="poi-interleave" data-id="${poi.id}">Interleave</button>
          <button type="button" data-action="poi-lock" data-id="${poi.id}">Lock</button>
          <button type="button" data-action="poi-rate" data-id="${poi.id}" data-rating="4">Rate 4</button>
          <button type="button" data-action="poi-rate" data-id="${poi.id}" data-rating="5">Rate 5</button>
          <button type="button" data-action="poi-remove" data-id="${poi.id}">Remove</button>
        </div>
      </li>
    `)
    .join("");
}

async function handleSoftPoiAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  const poiId = button.dataset.id;
  const poi = state.softPois.find((entry) => entry.id === poiId);
  if (!poi) return;

  if (action === "poi-remove") {
    state.softPois = state.softPois.filter((entry) => entry.id !== poiId);
    saveState();
    renderSoftPois();
    setStatus(`Removed tentative POI "${poi.title}".`);
    return;
  }

  if (action === "poi-rate") {
    const rating = Number(button.dataset.rating);
    applyRating({
      itemId: poi.id,
      title: poi.title,
      city: poi.city,
      tags: poi.tags || [poi.kind || "poi"],
      kind: "soft-poi",
    }, rating);
    return;
  }

  try {
    const enriched = await ensureCoordinatesForGenericItem(poi);
    if (action === "poi-interleave") {
      addPlannedStopFromSource(enriched, {
        sourceKind: "soft-poi",
        type: enriched.kind || "poi",
        start: enriched.startHint || suggestInterleaveStart(),
        notes: "Promoted from tentative POI",
      });
      setStatus(`Interleaved "${enriched.title}" from tentative POIs.`);
      return;
    }
    if (action === "poi-lock") {
      pinAsHardPoint({
        title: enriched.title,
        type: enriched.kind || "poi",
        city: enriched.city,
        locationLabel: enriched.locationQuery || enriched.title,
        lat: enriched.lat,
        lng: enriched.lng,
        notes: "Locked from tentative POIs",
        start: enriched.startHint || suggestInterleaveStart(),
      });
      setStatus(`Locked "${enriched.title}" from tentative POIs.`);
    }
  } catch (error) {
    console.error(error);
    setStatus(`Could not use tentative POI: ${error.message}`, true);
  }
}

async function handleConversationSubmit(event) {
  event.preventDefault();
  const text = els.conversationInput.value.trim();
  if (!text) return;

  const hadUserMessages = state.conversation.messages.some((message) => message.role === "user");
  pushConversationMessage("user", text);
  els.conversationForm.reset();
  applyDirectPreferenceFromMessage(text);
  storeTripIdeasFromMessage(text, { onlyIfInitial: !hadUserMessages });
  const quickHandled = await tryHandleQuickConversationCommands(text);
  if (quickHandled) {
    saveState();
    renderAll();
    setStatus("Applied requested context/hard-point update.");
    return;
  }
  renderConversation();
  renderConversationInsights();

  setStatus("Planner is thinking through your preferences...");
  try {
    const reply = await generateConversationReply(text);
    applyConversationInference(reply.inferredLikes || [], reply.inferredDislikes || [], "conversation-inference");
    if (reply.mode && reply.mode !== state.conversation.mode) {
      state.conversation.mode = reply.mode;
    }
    const fullMessage = [reply.assistantMessage, reply.followUpQuestion].filter(Boolean).join(" ");
    pushConversationMessage("assistant", fullMessage || "Noted. Tell me more so I can tune your itinerary.", reply.options || []);
    saveState();
    renderAll();
    setStatus("Conversation updated. Feedback on options to fine-tune memory.");
  } catch (error) {
    console.error(error);
    pushConversationMessage("assistant", "I could not generate a rich response right now. Tell me one thing you love and one thing you want to avoid.");
    saveState();
    renderConversation();
    setStatus(`Conversation response fallback used: ${error.message}`, true);
  }
}

async function tryHandleQuickConversationCommands(text) {
  const lowered = String(text || "").toLowerCase();
  const wantsUser = lowered.includes("user context");
  const wantsTrip = lowered.includes("trip context");
  const wantsHard = lowered.includes("hard point") || lowered.includes("hardpoint");
  const wantsShow = lowered.includes("show") || lowered.includes("what do you understand") || lowered.includes("understanding");
  const wantsCheck = wantsShow || lowered.includes("?") || lowered.includes("what") || lowered.includes("status");
  if (wantsCheck && (wantsUser || wantsTrip || wantsHard || lowered.includes("context"))) {
    pushConversationMessage("assistant", getUnderstandingSnapshotText({ user: true, trip: true, hard: true }));
    return true;
  }

  if (lowered.includes("rough outline")) {
    handleGenerateRoughOutline();
    return true;
  }

  if (lowered.includes("fill") && lowered.includes("option")) {
    handleSuggestFillStrategies();
    return true;
  }

  if (lowered.includes("general strategy") || lowered.includes("back to general")) {
    returnToGeneralStrategyMode("Switched back to general strategy mode.");
    return true;
  }

  if (lowered.includes("no planning")) {
    const created = await tryCreateNoPlanningHardPointFromText(text);
    if (created) return true;
  }

  return false;
}

function handleGenerateRoughOutline() {
  const outline = generateRoughOutline();
  state.outlineDraft.blocks = outline.blocks;
  state.outlineDraft.blockTweaks = {};
  state.outlineDraft.focusedBlockId = "";
  state.outlineDraft.updatedAt = new Date().toISOString();
  const options = outline.blocks.slice(0, 4).map((block) => ({
    id: generateId("outline-opt"),
    title: `${block.label}: ${block.theme}`,
    kind: "outline-block",
    blockId: block.id,
    city: block.city || "",
    reason: block.reason,
    tags: block.tags || [],
    locationQuery: block.city || state.tripContext.primaryDestination || "",
  }));
  pushConversationMessage(
    "assistant",
    `Rough outline ready with ${outline.blocks.length} blocks. Tell me what to tweak, then I can suggest multiple ways to fill each gap.`,
    options
  );
  saveState();
  renderAll();
  setStatus("Generated rough outline and requested feedback.");
}

function handleSuggestFillStrategies(targetBlockId = "") {
  const targetBlock = targetBlockId ? getOutlineBlockById(targetBlockId) : null;
  const strategies = generateFillStrategies(targetBlock);
  state.outlineDraft.strategies = strategies;
  state.outlineDraft.focusedBlockId = targetBlock?.id || "";
  state.outlineDraft.updatedAt = new Date().toISOString();
  const options = strategies.map((strategy) => ({
    id: strategy.id,
    title: strategy.title,
    kind: "strategy",
    blockId: targetBlock?.id || "",
    city: state.tripContext.primaryDestination || "",
    reason: strategy.reason,
    tags: strategy.tags,
    locationQuery: state.tripContext.primaryDestination || "",
  }));
  pushConversationMessage(
    "assistant",
    targetBlock
      ? `Here are strategy tweaks for ${targetBlock.label}. Choose one and I will return to the general strategy afterwards.`
      : "Here are multiple ways to fill your available space. Give feedback or choose one strategy, and I will refine the itinerary iteratively.",
    options
  );
  saveState();
  renderAll();
  setStatus(targetBlock ? `Suggested point-level strategy tweaks for ${targetBlock.label}.` : "Suggested multiple fill strategies.");
}

function handleShowUnderstandingSnapshot() {
  pushConversationMessage("assistant", getUnderstandingSnapshotText({ user: true, trip: true, hard: true }));
  saveState();
  renderAll();
  setStatus("Shared current understanding snapshot.");
}

function getOutlineBlockById(blockId) {
  if (!blockId) return null;
  return (state.outlineDraft.blocks || []).find((block) => block.id === blockId) || null;
}

function returnToGeneralStrategyMode(message) {
  state.outlineDraft.focusedBlockId = "";
  state.conversation.mode = "main-planning";
  state.conversation.sideTrackTopic = "";
  if (message) {
    pushConversationMessage("assistant", message);
  }
  saveState();
  renderAll();
}

function generateRoughOutline() {
  const windows = calculatePlanningWindows();
  const preferredTags = Object.entries(state.memory.tagScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tag]) => tag);

  const blocks = windows.map((window, index) => {
    const theme = preferredTags[index % Math.max(1, preferredTags.length)] || "balanced discovery";
    const cityHint = inferCityForWindow(window);
    return {
      id: `outline-${index + 1}`,
      label: `Block ${index + 1}`,
      start: window.startIso,
      end: window.endIso,
      hours: window.hours,
      city: cityHint,
      theme,
      reason: `Fits free window (${window.hours}h) between ${window.beforeHardPoint || "trip start"} and ${window.afterHardPoint || "trip end"}.`,
      tags: [theme, "outline"],
    };
  });
  return { blocks };
}

function generateFillStrategies(targetBlock = null) {
  const likes = Object.entries(state.conversation.learnedLikes || {}).sort((a, b) => b[1] - a[1]).map(([tag]) => tag);
  const mustInclude = state.tripContext.mustInclude || [];
  const baseTags = [...new Set([...mustInclude, ...likes].filter(Boolean))];
  const primary = baseTags[0] || "culture";
  const secondary = baseTags[1] || "food";
  const blockContextText = targetBlock ? ` for ${targetBlock.label}` : "";
  const blockTheme = targetBlock?.theme || primary;
  return [
    {
      id: generateId("strategy"),
      title: `Focused depth${blockContextText}: ${blockTheme}`,
      reason: `Concentrate this segment on one strong theme (${blockTheme}) plus one light counterpoint.`,
      tags: [blockTheme, "deep-dive"],
    },
    {
      id: generateId("strategy"),
      title: `Balanced mix${blockContextText}: ${primary} + ${secondary}`,
      reason: targetBlock
        ? `Use the ${targetBlock.hours}h window with a morning/afternoon split and low-risk transitions.`
        : "Split days into morning/afternoon themes and keep evenings flexible.",
      tags: [primary, secondary, "balanced"],
    },
    {
      id: generateId("strategy"),
      title: `Event-led evenings${blockContextText}`,
      reason: targetBlock
        ? "Keep this point flexible: anchor one daytime stop and test evening events via soft POIs first."
        : "Use daytime for anchor places and reserve evenings for events you can rate/soft-add first.",
      tags: ["event", "nightlife", secondary],
    },
  ];
}

function inferCityForWindow(window) {
  const anchors = getPlanningAnchors();
  const startTime = Date.parse(window.startIso);
  const nearest = anchors
    .filter((anchor) => anchor.city)
    .map((anchor) => ({
      city: anchor.city,
      diff: Math.abs((Date.parse(anchor.start) || 0) - startTime),
    }))
    .sort((a, b) => a.diff - b.diff)[0];
  return nearest?.city || state.tripContext.primaryDestination || "";
}

function getUnderstandingSnapshotText({ user, trip, hard }) {
  const parts = [];
  if (user) {
    const likes = Object.entries(state.conversation.learnedLikes || {}).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([tag]) => tag);
    const dislikes = Object.entries(state.conversation.learnedDislikes || {}).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([tag]) => tag);
    parts.push(`User context -> name: ${state.profile.name || "n/a"}, budget: ${state.profile.budget}, pace: ${state.profile.pace}, interests: ${(state.profile.interests || []).join(", ") || "n/a"}, learned likes: ${likes.join(", ") || "n/a"}, learned dislikes: ${dislikes.join(", ") || "n/a"}.`);
  }
  if (trip) {
    const strategy = state.outlineDraft.generalStrategy?.title || "none";
    const tweakCount = Object.keys(state.outlineDraft.blockTweaks || {}).length;
    parts.push(`Trip context -> ${state.tripContext.startDate || "?"} to ${state.tripContext.endDate || "?"}, destination: ${state.tripContext.primaryDestination || "n/a"}, must include: ${(state.tripContext.mustInclude || []).join(", ") || "n/a"}, avoid: ${(state.tripContext.avoid || []).join(", ") || "n/a"}, liked examples: ${(state.tripContext.likedExamples || []).slice(0, 4).join(" | ") || "n/a"}, inferred ideas: ${(state.tripContext.inferredIdeas || []).slice(0, 5).join(" | ") || "n/a"}, general strategy: ${strategy}, point tweaks: ${tweakCount}.`);
  }
  if (hard) {
    const hardPoints = getSortedHardPoints().map((point) => `${point.title} (${formatDateTime(point.start)})`).slice(0, 12);
    parts.push(`Hard points -> ${hardPoints.length ? hardPoints.join("; ") : "none yet"}.`);
  }
  return parts.join(" ");
}

async function tryCreateNoPlanningHardPointFromText(text) {
  const lowered = String(text || "").toLowerCase();
  if (!lowered.includes("no planning")) return false;
  const locationMatch = text.match(/\bin\s+([A-Za-z][A-Za-z\s'-]{1,60})/i);
  const location = locationMatch ? locationMatch[1].trim() : (state.tripContext.primaryDestination || "");
  if (!location) return false;

  const dateMatch = text.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  const baseDate = dateMatch ? dateMatch[1] : "";
  const startDate = baseDate ? new Date(`${baseDate}T18:00`) : new Date(suggestInterleaveStart());
  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + (lowered.includes("overnight") ? 14 : 6));

  try {
    const geo = await geocodeLocation(location);
    const point = {
      id: generateId("hp"),
      title: `No planning block - ${geo.city || location}`,
      type: "no-planning",
      start: startDate.toISOString().slice(0, 16),
      end: endDate.toISOString().slice(0, 16),
      locationLabel: geo.label,
      city: geo.city,
      lat: geo.lat,
      lng: geo.lng,
      bookingRef: "",
      notes: "Added from conversation command (no planning needed).",
      createdAt: new Date().toISOString(),
    };
    state.hardPoints.push(point);
    sortHardPointsInPlace();
    pushConversationMessage("assistant", `Added hard point: "${point.title}" from ${formatDateTime(point.start)} to ${formatDateTime(point.end)}. I will avoid planning in this block.`);
    return true;
  } catch (error) {
    pushConversationMessage("assistant", `I understood a no-planning request but could not resolve location "${location}". Please add this block in Hard Points form.`);
    return true;
  }
}

async function generateConversationReply(userText) {
  if (state.llm.enabled && state.llm.apiKey) {
    try {
      return await callLlmConversationReply(userText);
    } catch (error) {
      console.warn("LLM conversation failed, using heuristic fallback.", error);
    }
  }
  return heuristicConversationReply(userText);
}

async function callLlmConversationReply(userText) {
  const recent = state.conversation.messages.slice(-12).map((message) => ({
    role: message.role,
    text: message.text,
  }));
  const messages = [
    {
      role: "system",
      content: [
        "You are a trip-planning copilot with memory refinement behavior.",
        "Return ONLY valid JSON.",
        "Prefer a rough-outline-first approach before detailed planning.",
        "Ask clarifying questions if user intent is unclear.",
        "Offer multiple options and adapt with user feedback.",
        "Support side-track exploration and return to main planning while preserving insights.",
        "Output JSON with keys:",
        "assistantMessage (string), followUpQuestion (string), mode ('main-planning'|'side-track'),",
        "options (array), inferredLikes (array of tags), inferredDislikes (array of tags).",
        "Each option fields: title, kind, city, reason, tags (array), locationQuery (string).",
      ].join(" "),
    },
    {
      role: "user",
      content: JSON.stringify({
        latestUserMessage: userText,
        conversationMode: state.conversation.mode,
        sideTrackTopic: state.conversation.sideTrackTopic,
        context: buildUserTripContextSnapshot(),
        recentMessages: recent,
        candidateOptions: getPersonalizedSuggestions(8).map((item) => ({
          title: item.title,
          city: item.city,
          tags: item.tags,
          type: item.type,
        })),
      }),
    },
  ];

  const parsed = await callLlmJson(messages, 0.45);
  const options = normalizeConversationOptions(parsed.options || []);
  return {
    assistantMessage: String(parsed.assistantMessage || "Thanks, I learned from that.").trim(),
    followUpQuestion: String(parsed.followUpQuestion || "").trim(),
    mode: parsed.mode === "side-track" ? "side-track" : "main-planning",
    options,
    inferredLikes: Array.isArray(parsed.inferredLikes) ? parsed.inferredLikes : [],
    inferredDislikes: Array.isArray(parsed.inferredDislikes) ? parsed.inferredDislikes : [],
  };
}

function heuristicConversationReply(userText) {
  const tags = extractPreferenceTagsFromText(userText);
  const sideTrackTopic = state.conversation.sideTrackTopic;
  const mode = state.conversation.mode;
  const pool = getPersonalizedSuggestions(16)
    .filter((item) => {
      if (mode !== "side-track" || !sideTrackTopic) return true;
      const text = `${item.title} ${item.description} ${(item.tags || []).join(" ")}`.toLowerCase();
      return text.includes(sideTrackTopic.toLowerCase());
    })
    .filter((item) => !tags.length || (item.tags || []).some((tag) => tags.includes(normalizePreferenceTag(tag))))
    .slice(0, 4)
    .map((item) => ({
      title: item.title,
      kind: item.type || "activity",
      city: item.city,
      reason: item.description || "Suggested from your profile and memory.",
      tags: item.tags || [],
      locationQuery: `${item.title}, ${item.city}`,
      lat: item.lat,
      lng: item.lng,
      startHint: suggestInterleaveStart(),
    }));

  const question = mode === "side-track"
    ? "Do you want more options in this side-track, or should we merge these insights back into the main trip?"
    : "Which options feel closest to your taste, and what should I avoid next?";

  return {
    assistantMessage: "I used your current preferences to shortlist options. Give feedback with Love/Maybe/No so I can refine memory.",
    followUpQuestion: question,
    mode,
    options: pool,
    inferredLikes: tags,
    inferredDislikes: [],
  };
}

function normalizeConversationOptions(rawOptions) {
  return rawOptions
    .slice(0, 6)
    .map((item) => ({
      id: generateId("conv-opt"),
      title: String(item.title || "").trim(),
      kind: String(item.kind || item.type || "activity").trim().toLowerCase(),
      city: String(item.city || "").trim(),
      reason: String(item.reason || item.description || "").trim(),
      tags: (Array.isArray(item.tags) ? item.tags : parseTags(item.tags || "")).map((tag) => normalizePreferenceTag(tag)),
      locationQuery: String(item.locationQuery || `${item.title || ""}${item.city ? `, ${item.city}` : ""}`).trim(),
      lat: Number(item.lat),
      lng: Number(item.lng),
      startHint: String(item.startHint || "").trim(),
    }))
    .filter((item) => item.title);
}

async function handleStartSideTrack() {
  const topic = els.sideTrackTopic.value.trim();
  if (!topic) {
    setStatus("Enter a side-track topic first.", true);
    return;
  }
  state.conversation.mode = "side-track";
  state.conversation.sideTrackTopic = topic;
  pushConversationMessage("assistant", `Switching to side-track mode on "${topic}". I will go deeper on this theme, then bring insights back to your main trip plan.`);
  saveState();
  renderConversation();
  renderConversationInsights();
  setStatus(`Side-track started for ${topic}.`);
}

function handleReturnToMainPlanning() {
  const likeEntries = Object.entries(state.conversation.learnedLikes || {}).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const dislikeEntries = Object.entries(state.conversation.learnedDislikes || {}).sort((a, b) => b[1] - a[1]).slice(0, 3);
  state.conversation.mode = "main-planning";
  state.conversation.sideTrackTopic = "";
  state.outlineDraft.focusedBlockId = "";

  const summary = [
    "Back to main planning.",
    likeEntries.length ? `I learned you like: ${likeEntries.map(([tag]) => tag).join(", ")}.` : "I need more feedback on likes.",
    dislikeEntries.length ? `I will avoid: ${dislikeEntries.map(([tag]) => tag).join(", ")}.` : "",
  ].join(" ");
  pushConversationMessage("assistant", summary);
  saveState();
  renderConversation();
  renderConversationInsights();
  setStatus("Returned to main planning with side-track insights applied.");
}

async function handleConversationAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  const messageId = button.dataset.messageId;
  const optionId = button.dataset.optionId;
  const option = getConversationOption(messageId, optionId);
  if (!option) return;

  if (action === "option-feedback") {
    const feedback = button.dataset.feedback;
    const delta = feedback === "love" ? 2 : feedback === "maybe" ? 1 : -2;
    applyConversationPreference(option.tags, delta, option.title);
    pushConversationMessage("assistant", `Noted: ${feedback} for "${option.title}". I updated your memory and will tune next suggestions.`);
    saveState();
    renderAll();
    return;
  }

  if (action === "option-soft-poi") {
    addSoftPoiFromSource(option, {
      sourceKind: "conversation-option",
      type: option.kind || "activity",
      notes: "Soft added from conversation option",
      startHint: option.startHint || suggestInterleaveStart(),
    });
    setStatus(`Soft-added "${option.title}" from conversation.`);
    return;
  }

  if (action === "option-dive-block") {
    const block = getOutlineBlockById(option.blockId);
    if (!block) {
      setStatus("Could not find outline block for deep dive.", true);
      return;
    }
    state.conversation.mode = "side-track";
    state.conversation.sideTrackTopic = block.label;
    state.outlineDraft.focusedBlockId = block.id;
    handleSuggestFillStrategies(block.id);
    return;
  }

  if (action === "option-use-strategy") {
    const strategyTags = option.tags || [];
    const mergedMust = [...new Set([...(state.tripContext.mustInclude || []), ...strategyTags])];
    state.tripContext.mustInclude = mergedMust.slice(0, 25);
    if (option.blockId) {
      const block = getOutlineBlockById(option.blockId);
      const blockLabel = block?.label || option.blockId;
      state.outlineDraft.blockTweaks[option.blockId] = {
        title: option.title,
        tags: strategyTags,
        updatedAt: new Date().toISOString(),
      };
      state.tripContext.styleNotes = [state.tripContext.styleNotes, `Point strategy (${blockLabel}): ${option.title}`]
        .filter(Boolean)
        .join(" | ");
    } else {
      state.outlineDraft.generalStrategy = {
        title: option.title,
        tags: strategyTags,
        updatedAt: new Date().toISOString(),
      };
      state.tripContext.styleNotes = [state.tripContext.styleNotes, `Preferred general strategy: ${option.title}`]
        .filter(Boolean)
        .join(" | ");
    }
    applyConversationPreference(strategyTags, 1, option.title);
    if (option.blockId) {
      const block = getOutlineBlockById(option.blockId);
      returnToGeneralStrategyMode(`Applied point strategy "${option.title}" for ${block?.label || option.blockId}. Returning to general strategy mode.`);
    } else {
      pushConversationMessage("assistant", `Applied strategy "${option.title}". I updated trip context and memory; now ask me to fill itinerary parts with this approach.`);
      saveState();
      renderAll();
    }
    return;
  }

  try {
    const enriched = await ensureCoordinatesForGenericItem(option);
    if (action === "option-interleave") {
      addPlannedStopFromSource(enriched, {
        sourceKind: "conversation-option",
        type: enriched.kind || "activity",
        start: enriched.startHint || suggestInterleaveStart(),
        notes: "Added from conversation options",
      });
      setStatus(`Interleaved "${enriched.title}" from conversation.`);
      return;
    }
    if (action === "option-lock") {
      pinAsHardPoint({
        title: enriched.title,
        type: enriched.kind || "activity",
        city: enriched.city,
        locationLabel: enriched.locationQuery || enriched.title,
        lat: enriched.lat,
        lng: enriched.lng,
        notes: "Locked from conversation options",
        start: enriched.startHint || suggestInterleaveStart(),
      });
      setStatus(`Locked "${enriched.title}" from conversation.`);
    }
  } catch (error) {
    console.error(error);
    setStatus(`Could not use conversation option: ${error.message}`, true);
  }
}

function getConversationOption(messageId, optionId) {
  const message = state.conversation.messages.find((entry) => entry.id === messageId);
  if (!message || !Array.isArray(message.options)) return null;
  return message.options.find((entry) => entry.id === optionId) || null;
}

function extractPreferenceTagsFromText(text) {
  const lowered = String(text || "").toLowerCase();
  const raw = DETAIL_CATEGORY_HINTS.filter((token) => lowered.includes(token));
  return [...new Set(raw.map((token) => normalizePreferenceTag(token)))];
}

function normalizePreferenceTag(tag) {
  const token = String(tag || "").toLowerCase().trim();
  const map = {
    bars: "bar",
    concerts: "concert",
    events: "event",
    museums: "museum",
    shops: "shop",
    shopping: "shop",
    restaurants: "restaurant",
    hiking: "hike",
  };
  return map[token] || token;
}

function applyDirectPreferenceFromMessage(text) {
  const lowered = String(text || "").toLowerCase();
  const tags = extractPreferenceTagsFromText(lowered);
  if (!tags.length) return;

  const negativeSignals = ["don't like", "dont like", "dislike", "hate", "avoid", "not into"];
  const positiveSignals = ["i like", "love", "enjoy", "prefer", "favorite", "favourite"];
  if (negativeSignals.some((token) => lowered.includes(token))) {
    applyConversationPreference(tags, -1, "direct-message");
    return;
  }
  if (positiveSignals.some((token) => lowered.includes(token))) {
    applyConversationPreference(tags, 1, "direct-message");
  }
}

function applyConversationInference(inferredLikes, inferredDislikes, source) {
  const likes = (Array.isArray(inferredLikes) ? inferredLikes : []).map((tag) => normalizePreferenceTag(tag));
  const dislikes = (Array.isArray(inferredDislikes) ? inferredDislikes : []).map((tag) => normalizePreferenceTag(tag));
  if (likes.length) applyConversationPreference(likes, 1, source);
  if (dislikes.length) applyConversationPreference(dislikes, -1, source);
}

function applyConversationPreference(tags, delta, sourceTitle) {
  const validTags = (Array.isArray(tags) ? tags : []).map((tag) => normalizePreferenceTag(tag)).filter(Boolean);
  if (!validTags.length || !delta) return;

  validTags.forEach((tag) => {
    state.memory.tagScores[tag] = (state.memory.tagScores[tag] || 0) + delta;
    if (delta > 0) {
      state.conversation.learnedLikes[tag] = (state.conversation.learnedLikes[tag] || 0) + delta;
    } else {
      state.conversation.learnedDislikes[tag] = (state.conversation.learnedDislikes[tag] || 0) + Math.abs(delta);
    }
  });

  state.memory.ratingsHistory.unshift({
    itemId: generateId("conv-memory"),
    title: sourceTitle || "conversation-feedback",
    rating: delta > 0 ? 4 : 2,
    kind: "conversation-feedback",
    tags: validTags,
    city: "",
    when: new Date().toISOString(),
  });
  state.memory.ratingsHistory = state.memory.ratingsHistory.slice(0, 180);
  saveState();
  renderMemorySummary();
  renderConversationInsights();
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
          <button type="button" data-action="soft-place" data-id="${item.id}">Soft add POI</button>
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

  if (action === "soft-place") {
    addSoftPoiFromSource(place, {
      sourceKind: place.kind || "main-location",
      type: place.category || place.kind || "location",
      notes: "Soft added from location/trip finder",
      startHint: els.placeInterleaveTime.value || suggestInterleaveStart(),
    });
    setStatus(`Soft-added "${place.title}" as tentative POI.`);
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

function calculatePlanningWindows() {
  const hard = getSortedHardPoints();
  const minimumWindowMs = 45 * 60 * 1000;
  let start = parseDateInput(state.tripContext.startDate);
  let end = parseDateInput(state.tripContext.endDate, true);

  if (!start) {
    if (hard.length) {
      start = new Date(hard[0].start);
      start.setHours(start.getHours() - 6);
    } else {
      start = new Date();
      start.setHours(start.getHours() + 2);
    }
  }

  if (!end) {
    if (hard.length) {
      const last = hard[hard.length - 1];
      end = new Date(last.end || last.start);
      end.setHours(end.getHours() + 10);
    } else {
      end = new Date(start);
      end.setDate(end.getDate() + 3);
    }
  }

  if (end <= start) {
    end = new Date(start);
    end.setDate(end.getDate() + 1);
  }

  const anchors = hard.map((point) => {
    const hpStart = new Date(point.start);
    const hpEnd = new Date(point.end || point.start);
    if (hpEnd <= hpStart) hpEnd.setHours(hpEnd.getHours() + 1);
    return {
      id: point.id,
      title: point.title,
      start: hpStart,
      end: hpEnd,
    };
  });

  const windows = [];
  let cursor = start;

  for (let i = 0; i < anchors.length; i += 1) {
    const anchor = anchors[i];
    if (anchor.start.getTime() - cursor.getTime() >= minimumWindowMs) {
      windows.push({
        id: `window-${i}`,
        start: new Date(cursor),
        end: new Date(anchor.start),
        beforeHardPoint: i > 0 ? anchors[i - 1].title : "",
        afterHardPoint: anchor.title,
      });
    }
    if (anchor.end > cursor) cursor = new Date(anchor.end);
  }

  if (end.getTime() - cursor.getTime() >= minimumWindowMs) {
    windows.push({
      id: `window-${windows.length}`,
      start: new Date(cursor),
      end: new Date(end),
      beforeHardPoint: anchors.length ? anchors[anchors.length - 1].title : "",
      afterHardPoint: "",
    });
  }

  return windows.map((window) => ({
    ...window,
    startIso: window.start.toISOString(),
    endIso: window.end.toISOString(),
    hours: Math.round(((window.end - window.start) / (1000 * 60 * 60)) * 10) / 10,
  }));
}

function buildUserTripContextSnapshot() {
  const learnedLikes = Object.entries(state.conversation.learnedLikes || {}).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const learnedDislikes = Object.entries(state.conversation.learnedDislikes || {}).sort((a, b) => b[1] - a[1]).slice(0, 8);
  return {
    travelerProfile: state.profile,
    tripContext: state.tripContext,
    hardPoints: getSortedHardPoints().map((point) => ({
      id: point.id,
      title: point.title,
      type: point.type,
      start: point.start,
      end: point.end,
      city: point.city,
      notes: point.notes,
    })),
    activeRouteNodes: getSortedActiveRouteNodes().map((node) => ({
      title: node.title,
      type: node.type,
      start: node.start,
      city: node.city,
      routeSet: node.routeSetName,
    })),
    softPois: state.softPois.slice(0, 20).map((poi) => ({
      title: poi.title,
      kind: poi.kind,
      city: poi.city,
      tags: poi.tags,
      startHint: poi.startHint,
    })),
    outlineDraft: {
      blocks: state.outlineDraft.blocks.slice(0, 12),
      strategies: state.outlineDraft.strategies.slice(0, 6),
      updatedAt: state.outlineDraft.updatedAt,
    },
    inferredTripIdeas: state.tripContext.inferredIdeas || [],
    memoryTopTags: Object.entries(state.memory.tagScores).sort((a, b) => b[1] - a[1]).slice(0, 8),
    memoryAvoidTags: Object.entries(state.memory.tagScores).sort((a, b) => a[1] - b[1]).slice(0, 6),
    conversationMode: state.conversation.mode,
    sideTrackTopic: state.conversation.sideTrackTopic,
    learnedLikes,
    learnedDislikes,
    recentConversation: state.conversation.messages.slice(-10).map((message) => ({
      role: message.role,
      text: message.text,
    })),
  };
}

async function handleGenerateLlmItineraryParts(event) {
  event.preventDefault();
  const request = els.itineraryGenerationRequest.value.trim();
  const maxItems = Number(els.itineraryGenerationLimit.value || 10);
  const replaceGenerated = Boolean(els.itineraryReplaceGenerated.checked);

  if (!request) {
    setStatus("Please provide itinerary generation instructions.", true);
    return;
  }
  if (!state.llm.enabled || !state.llm.apiKey) {
    setStatus("Enable and configure LLM settings first.", true);
    return;
  }

  const windows = calculatePlanningWindows();
  if (!windows.length) {
    setStatus("No free windows found around hard points. Add trip dates or adjust hard points.", true);
    return;
  }

  setStatus("Generating itinerary parts with LLM using hard-point windows...");
  try {
    const generated = await callLlmItineraryBuilder({
      request,
      maxItems,
      windows,
      context: buildUserTripContextSnapshot(),
    });

    const normalized = normalizeLlmItineraryParts(generated, windows, maxItems);
    if (!normalized.length) {
      setStatus("LLM returned no usable itinerary parts.", true);
      return;
    }

    const preparedStops = [];
    for (const item of normalized) {
      try {
        const enriched = await ensureCoordinatesForGenericItem(item);
        preparedStops.push(createPlannedStopEntry(enriched, {
          sourceKind: "llm-itinerary",
          type: enriched.kind || "detail-stop",
          start: enriched.startHint || suggestInterleaveStart(),
          end: enriched.endHint || "",
          notes: enriched.description || "Generated by LLM itinerary builder",
        }));
      } catch (error) {
        console.warn("Skipping generated item due to location failure:", item.title, error);
      }
    }

    if (!preparedStops.length) {
      setStatus("Generated items could not be geocoded. Try adding clearer location hints.", true);
      return;
    }

    if (replaceGenerated) {
      state.plannedStops = state.plannedStops.filter((stop) => stop.sourceKind !== "llm-itinerary");
    }
    state.plannedStops.push(...preparedStops);
    sortPlannedStopsInPlace();
    saveState();
    renderAll();
    setStatus(`Added ${preparedStops.length} LLM-generated itinerary parts around hard points.`);
  } catch (error) {
    console.error(error);
    setStatus(`LLM itinerary generation failed: ${error.message}`, true);
  }
}

async function callLlmItineraryBuilder({ request, maxItems, windows, context }) {
  const messages = [
    {
      role: "system",
      content: [
        "You are an itinerary construction assistant.",
        "Return ONLY valid JSON.",
        "You must respect fixed hard points by planning only inside provided free windows.",
        "Output JSON object with key 'parts' that is an array.",
        "Each part fields:",
        "title (string), kind (string), city (string), start (ISO datetime), end (ISO datetime optional),",
        "locationQuery (string), tags (array of strings), notes (string), windowId (string).",
        "Do not place items outside windows.",
      ].join(" "),
    },
    {
      role: "user",
      content: JSON.stringify({
        request,
        maxItems: Math.min(30, Math.max(1, maxItems)),
        windows: windows.map((window) => ({
          id: window.id,
          start: window.startIso,
          end: window.endIso,
          hours: window.hours,
          beforeHardPoint: window.beforeHardPoint,
          afterHardPoint: window.afterHardPoint,
        })),
        context,
      }),
    },
  ];

  const parsed = await callLlmJson(messages, 0.25);
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed.parts)) return parsed.parts;
  if (Array.isArray(parsed.results)) return parsed.results;
  if (Array.isArray(parsed.items)) return parsed.items;
  return [];
}

function normalizeLlmItineraryParts(rawItems, windows, maxItems) {
  const max = Math.min(30, Math.max(1, maxItems));
  return rawItems
    .slice(0, max)
    .map((item) => {
      const title = String(item.title || "").trim();
      if (!title) return null;
      const kind = String(item.kind || "detail-stop").trim().toLowerCase();
      const city = String(item.city || state.tripContext.primaryDestination || "").trim();
      const tags = Array.isArray(item.tags) ? item.tags.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean) : parseTags(item.tags || kind);
      const window = resolveWindowForGeneratedItem(item, windows);
      if (!window) return null;
      const startDate = parseDateInput(item.start) || parseDateInput(item.startHint) || new Date(window.startIso);
      const endDate = parseDateInput(item.end) || parseDateInput(item.endHint) || new Date(startDate.getTime() + 90 * 60 * 1000);
      const clampedStart = clampDateToWindow(startDate, window.start, window.end);
      const clampedEnd = clampDateToWindow(endDate > clampedStart ? endDate : new Date(clampedStart.getTime() + 60 * 60 * 1000), clampedStart, window.end);

      return {
        id: generateId("llm-part"),
        title,
        kind,
        city,
        startHint: clampedStart.toISOString(),
        endHint: clampedEnd.toISOString(),
        locationQuery: String(item.locationQuery || `${title}${city ? `, ${city}` : ""}`).trim(),
        tags: tags.length ? tags : [kind],
        description: String(item.notes || item.reason || "Generated from user + trip context").trim(),
        lat: Number(item.lat),
        lng: Number(item.lng),
      };
    })
    .filter(Boolean);
}

function resolveWindowForGeneratedItem(item, windows) {
  const windowId = String(item.windowId || "").trim();
  if (windowId) {
    const direct = windows.find((window) => window.id === windowId);
    if (direct) return direct;
  }
  const start = parseDateInput(item.start) || parseDateInput(item.startHint);
  if (start) {
    const byDate = windows.find((window) => start >= window.start && start <= window.end);
    if (byDate) return byDate;
  }
  return windows[0] || null;
}

function clampDateToWindow(value, minDate, maxDate) {
  const date = new Date(value);
  if (date < minDate) return new Date(minDate);
  if (date > maxDate) return new Date(maxDate);
  return date;
}

async function callLlmJson(messages, temperature = 0.2) {
  const requestConfig = buildLlmRequestConfig(messages, temperature);
  const response = await fetch(requestConfig.url, {
    method: "POST",
    headers: requestConfig.headers,
    body: JSON.stringify(requestConfig.payload),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`LLM provider returned ${response.status}: ${details.slice(0, 240)}`);
  }

  const responseJson = await response.json();
  const rawContent = responseJson.choices?.[0]?.message?.content;
  const content = Array.isArray(rawContent)
    ? rawContent.map((part) => (typeof part === "string" ? part : part?.text || "")).join("\n")
    : String(rawContent || "");

  if (!content.trim()) {
    throw new Error("LLM provider returned an empty answer.");
  }

  return parseJsonFromLlmText(content);
}

function buildLlmRequestConfig(messages, temperature) {
  const provider = state.llm.provider || DEFAULT_LLM_CONFIG.provider;
  const endpoint = String(state.llm.endpoint || "").trim();

  if (!endpoint) {
    throw new Error("LLM endpoint is missing.");
  }

  if (provider === "azure-openai") {
    const deployment = String(state.llm.deployment || state.llm.model || "").trim();
    if (!deployment) {
      throw new Error("Azure deployment name is required.");
    }
    const apiVersion = String(state.llm.apiVersion || DEFAULT_LLM_CONFIG.apiVersion).trim();
    const url = buildAzureChatCompletionsUrl(endpoint, deployment, apiVersion);
    return {
      url,
      headers: {
        "Content-Type": "application/json",
        "api-key": state.llm.apiKey,
      },
      payload: {
        temperature,
        messages,
      },
    };
  }

  return {
    url: endpoint,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${state.llm.apiKey}`,
    },
    payload: {
      model: state.llm.model,
      temperature,
      messages,
    },
  };
}

function buildAzureChatCompletionsUrl(endpoint, deployment, apiVersion) {
  const trimmed = endpoint.replace(/\/+$/, "");
  const hasDeploymentPath = /\/openai\/deployments\//i.test(trimmed);
  const base = hasDeploymentPath
    ? trimmed
    : `${trimmed}/openai/deployments/${encodeURIComponent(deployment)}/chat/completions`;
  return appendQueryParam(base, "api-version", apiVersion);
}

function appendQueryParam(url, key, value) {
  if (!value) return url;
  const hasQuery = url.includes("?");
  const separator = hasQuery ? "&" : "?";
  const existing = new RegExp(`(?:\\?|&)${key}=`, "i").test(url);
  return existing ? url : `${url}${separator}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
}

function handleSaveLlmConfig(event) {
  event.preventDefault();
  state.llm = {
    provider: els.llmProvider.value || DEFAULT_LLM_CONFIG.provider,
    endpoint: (els.llmApiEndpoint.value || DEFAULT_LLM_CONFIG.endpoint).trim(),
    model: (els.llmModel.value || DEFAULT_LLM_CONFIG.model).trim(),
    deployment: (els.llmDeployment.value || "").trim(),
    apiVersion: (els.llmApiVersion.value || DEFAULT_LLM_CONFIG.apiVersion).trim(),
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

  const messages = [
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
        tripContext: state.tripContext,
        memoryTopTags: Object.entries(state.memory.tagScores).sort((a, b) => b[1] - a[1]).slice(0, 8),
        hardPoints: hardPointContext,
        fillWindows: calculatePlanningWindows().map((window) => ({
          start: window.startIso,
          end: window.endIso,
          hours: window.hours,
        })),
        existingRecentPlaceResults: state.lastPlaces.slice(0, 15),
        existingRecentEventResults: state.lastEvents.slice(0, 15),
      }),
    },
  ];

  const parsed = await callLlmJson(messages, 0.2);
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
          <button type="button" data-action="soft-llm" data-id="${item.id}">Soft add POI</button>
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

  if (action === "soft-llm") {
    addSoftPoiFromSource(item, {
      sourceKind: `llm-${item.kind || "option"}`,
      type: item.kind || "activity",
      notes: "Soft added from LLM search",
      startHint: item.startHint || suggestInterleaveStart(),
    });
    setStatus(`Soft-added "${item.title}" from LLM results.`);
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
          <button type="button" data-action="soft-event" data-id="${event.id}">Soft add POI</button>
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

  if (action === "soft-event") {
    addSoftPoiFromSource(eventData, {
      sourceKind: "event",
      type: "event",
      notes: "Soft added from event finder",
      startHint: els.eventInterleaveTime.value || `${eventData.date}T19:00`,
    });
    setStatus(`Soft-added event "${eventData.title}" as tentative POI.`);
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

function renderExperienceVisuals() {
  renderPhaseVisual();
  renderRouteStripVisual();
  renderActivityMixVisual();
  renderTripPulseVisual();
  renderMapLegend();
}

function renderPhaseVisual() {
  const phases = getWorkflowPhases();
  const html = [];
  phases.forEach((phase, index) => {
    html.push(`
      <div class="phase-step ${phase.done ? "done" : ""} ${phase.active ? "active" : ""}">
        <span>${phase.done ? "✓" : phase.active ? "●" : "○"}</span>
        <span>${htmlEscape(phase.label)}</span>
      </div>
    `);
    if (index < phases.length - 1) {
      html.push("<span class='phase-link'></span>");
    }
  });
  els.phaseVisual.innerHTML = html.join("");
}

function getWorkflowPhases() {
  const hasPref = Boolean(state.profile.name || state.profile.interests.length || state.tripContext.likedExamples?.length);
  const hasHard = state.hardPoints.length > 0;
  const hasOutline = state.outlineDraft.blocks.length > 0;
  const hasFeedback = state.memory.ratingsHistory.length >= 5 || Object.keys(state.conversation.learnedLikes || {}).length >= 2;
  const hasFill = state.plannedStops.length >= 3 || state.softPois.length >= 3;
  const phases = [
    { label: "Discover taste", done: hasPref },
    { label: "Lock anchors", done: hasHard },
    { label: "Outline", done: hasOutline },
    { label: "Rate & learn", done: hasFeedback },
    { label: "Refine fill", done: hasFill },
  ];
  const firstOpen = phases.findIndex((phase) => !phase.done);
  return phases.map((phase, index) => ({
    ...phase,
    active: firstOpen === -1 ? index === phases.length - 1 : index === firstOpen,
  }));
}

function renderRouteStripVisual() {
  const anchors = getPlanningAnchors().filter((entry) => Number.isFinite(entry.lat) && Number.isFinite(entry.lng));
  if (!anchors.length) {
    els.routeStripVisual.innerHTML = "<div class='route-node-chip'>Add hard points/nodes to see route strip.</div>";
    return;
  }
  const parts = [];
  anchors.forEach((point, index) => {
    parts.push(`<span class="route-node-chip">${htmlEscape(point.city || point.title)}</span>`);
    const next = anchors[index + 1];
    if (!next) return;
    const type = getSegmentTransportType(point, next);
    const meta = getTransportMeta(type);
    const km = haversineKm(point.lat, point.lng, next.lat, next.lng);
    parts.push(`<span class="route-segment-chip segment-${meta.css}">${meta.icon} ${km.toFixed(0)}km</span>`);
  });
  els.routeStripVisual.innerHTML = parts.join("");
}

function renderActivityMixVisual() {
  const buckets = {
    art: 0,
    nature: 0,
    food: 0,
    events: 0,
    local: 0,
    transit: 0,
  };
  const combined = [...state.plannedStops, ...state.softPois, ...state.hardPoints];
  combined.forEach((item) => {
    const bucket = classifyActivityBucket(item);
    buckets[bucket] += 1;
  });
  const total = Object.values(buckets).reduce((sum, value) => sum + value, 0) || 1;
  const rows = Object.entries(buckets)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => {
      const pct = Math.round((count / total) * 100);
      return `
        <div class="mix-row">
          <span>${htmlEscape(name)}</span>
          <span class="mix-track"><span class="mix-fill" style="width:${pct}%"></span></span>
          <span>${pct}%</span>
        </div>
      `;
    });
  els.activityMixVisual.innerHTML = rows.join("");
}

function classifyActivityBucket(item) {
  const text = `${item.type || ""} ${item.kind || ""} ${(item.tags || []).join(" ")} ${item.title || ""}`.toLowerCase();
  if (/(art|museum|gallery|architecture|design)/.test(text)) return "art";
  if (/(hike|nature|mountain|park|volcano|trail|outdoor)/.test(text)) return "nature";
  if (/(food|restaurant|sushi|dining|cafe|market)/.test(text)) return "food";
  if (/(event|concert|music|festival|nightlife|film)/.test(text)) return "events";
  if (/(flight|train|transfer|route|transit|airport)/.test(text)) return "transit";
  return "local";
}

function renderTripPulseVisual() {
  const days = getTripSpanDays();
  if (!days.length) {
    els.tripPulseVisual.innerHTML = "<div class='route-node-chip'>Set trip dates or hard points to see trip pulse.</div>";
    return;
  }
  const items = getTimelineItems();
  const bars = days.map((day) => {
    const dayCount = items.filter((entry) => String(entry.start || "").slice(0, 10) === day.key).length;
    const height = Math.max(8, Math.min(56, 8 + dayCount * 10));
    return `
      <div class="pulse-day">
        <span class="pulse-bar" style="height:${height}px"></span>
        <span class="pulse-label">${htmlEscape(day.label)}</span>
      </div>
    `;
  });
  els.tripPulseVisual.innerHTML = bars.join("");
}

function getTripSpanDays() {
  let start = parseDateInput(state.tripContext.startDate);
  let end = parseDateInput(state.tripContext.endDate, true);
  const hard = getSortedHardPoints();
  if (!start && hard.length) start = parseDateInput(hard[0].start);
  if (!end && hard.length) end = parseDateInput(hard[hard.length - 1].end || hard[hard.length - 1].start);
  if (!start || !end || end < start) return [];

  const out = [];
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  const last = new Date(end);
  last.setHours(0, 0, 0, 0);
  while (cursor <= last && out.length <= 120) {
    const key = cursor.toISOString().slice(0, 10);
    const label = `${cursor.getMonth() + 1}/${cursor.getDate()}`;
    out.push({ key, label });
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

function renderMapLegend() {
  els.mapLegend.innerHTML = `
    <span class="legend-chip">✈️ flight leg</span>
    <span class="legend-chip">🚆 rail leg</span>
    <span class="legend-chip">🚗 road leg</span>
    <span class="legend-chip">🚶 short hop</span>
    <span class="legend-chip">📍 hard point</span>
  `;
}

function createStopMarkerIcon(type) {
  const token = String(type || "").toLowerCase();
  let icon = "📍";
  if (token.includes("flight")) icon = "✈️";
  else if (token.includes("train")) icon = "🚆";
  else if (token.includes("hotel")) icon = "🏨";
  else if (token.includes("tour")) icon = "🎟️";
  else if (token.includes("meeting")) icon = "📌";
  else if (token.includes("no-planning")) icon = "🌙";
  return L.divIcon({
    className: "",
    html: `<span class="stop-marker">${icon}</span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

function getSegmentTransportType(from, to) {
  const fromType = String(from.type || from.kind || "").toLowerCase();
  const toType = String(to.type || to.kind || "").toLowerCase();
  const joined = `${fromType} ${toType}`;
  if (joined.includes("flight")) return "flight";
  if (joined.includes("train")) return "train";
  const km = haversineKm(from.lat, from.lng, to.lat, to.lng);
  if (km > 700) return "flight";
  if (km > 180) return "train";
  if (km > 25) return "drive";
  return "walk";
}

function getTransportMeta(type) {
  if (type === "flight") return { icon: "✈️", label: "Flight leg", color: "#d14b88", weight: 3.5, dashArray: "2,8", css: "flight" };
  if (type === "train") return { icon: "🚆", label: "Rail leg", color: "#4f63d8", weight: 3.5, dashArray: "8,8", css: "train" };
  if (type === "drive") return { icon: "🚗", label: "Road leg", color: "#2d8e4a", weight: 3, dashArray: "", css: "drive" };
  return { icon: "🚶", label: "Short hop", color: "#7a55ba", weight: 2.8, dashArray: "4,6", css: "walk" };
}

function createArcCoordinates(from, to, curveFactor = 0.2, points = 24) {
  const lat1 = from[0];
  const lng1 = from[1];
  const lat2 = to[0];
  const lng2 = to[1];
  const midLat = (lat1 + lat2) / 2;
  const midLng = (lng1 + lng2) / 2;
  const dx = lng2 - lng1;
  const dy = lat2 - lat1;
  const curveLat = midLat + (-dx * curveFactor);
  const curveLng = midLng + (dy * curveFactor);

  const coords = [];
  for (let i = 0; i <= points; i += 1) {
    const t = i / points;
    const lat = ((1 - t) * (1 - t) * lat1) + (2 * (1 - t) * t * curveLat) + (t * t * lat2);
    const lng = ((1 - t) * (1 - t) * lng1) + (2 * (1 - t) * t * curveLng) + (t * t * lng2);
    coords.push([lat, lng]);
  }
  return coords;
}

function getPolylineMidpoint(coords) {
  if (!Array.isArray(coords) || !coords.length) return null;
  return coords[Math.floor(coords.length / 2)];
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
    const marker = L.marker([point.lat, point.lng], {
      title: point.title,
      icon: createStopMarkerIcon(point.type),
    })
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

  const timelinePoints = getTimelineItems().filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng));
  if (timelinePoints.length >= 2) {
    for (let i = 0; i < timelinePoints.length - 1; i += 1) {
      const from = timelinePoints[i];
      const to = timelinePoints[i + 1];
      const transportType = getSegmentTransportType(from, to);
      const transport = getTransportMeta(transportType);
      const segmentCoords = transportType === "flight"
        ? createArcCoordinates([from.lat, from.lng], [to.lat, to.lng], 0.2)
        : [[from.lat, from.lng], [to.lat, to.lng]];
      const line = L.polyline(segmentCoords, {
        color: transport.color,
        weight: transport.weight,
        opacity: 0.86,
        dashArray: transport.dashArray,
      }).bindPopup(`${transport.icon} ${transport.label}: ${htmlEscape(from.title)} -> ${htmlEscape(to.title)}`);
      line.addTo(layers.itineraryPath);
      mapElements.push(line);

      const mid = getPolylineMidpoint(segmentCoords);
      if (mid) {
        const marker = L.marker(mid, {
          icon: L.divIcon({
            className: "",
            html: `<span class="transport-marker">${transport.icon}</span>`,
            iconSize: [26, 26],
            iconAnchor: [13, 13],
          }),
          interactive: false,
        });
        marker.addTo(layers.itineraryPath);
        mapElements.push(marker);
      }
    }
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

function createPlannedStopEntry(source, { sourceKind, type, start, end, notes }) {
  return {
    id: generateId("plan"),
    title: source.title,
    type: type || source.category || source.kind || "stop",
    sourceKind: sourceKind || source.kind || "interleave",
    start: start || suggestInterleaveStart(),
    end: end || "",
    city: source.city || "",
    locationLabel: source.venue || source.title || source.city || "",
    lat: Number.isFinite(source.lat) ? source.lat : 0,
    lng: Number.isFinite(source.lng) ? source.lng : 0,
    bookingRef: "",
    notes: notes || "",
    createdAt: new Date().toISOString(),
  };
}

function addPlannedStopFromSource(source, { sourceKind, type, start, end, notes }) {
  const plannedStop = createPlannedStopEntry(source, {
    sourceKind,
    type,
    start,
    end,
    notes,
  });
  state.plannedStops.push(plannedStop);
  sortPlannedStopsInPlace();
  saveState();
  renderAll();
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
  if (!els.tripStartDate.value) {
    const tripStart = new Date();
    tripStart.setDate(tripStart.getDate() + 1);
    els.tripStartDate.value = tripStart.toISOString().slice(0, 10);
  }
  if (!els.tripEndDate.value) {
    const tripEnd = new Date();
    tripEnd.setDate(tripEnd.getDate() + 5);
    els.tripEndDate.value = tripEnd.toISOString().slice(0, 10);
  }
}

function init() {
  bindElements();
  initMap();
  bindEvents();
  hydrateProfileForm();
  hydrateTripContextForm();
  hydrateLlmForm();
  setDefaultEventDate();
  ensureConversationInitialized();
  renderAll();
  setStatus("MindTrip planner ready. Add hard points to begin.");
}

window.addEventListener("DOMContentLoaded", init);
