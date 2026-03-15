export const STORAGE_KEY = "mindtrip_state_v1";

export const ROUTE_PROFILES = ["driving", "cycling", "walking"];

export const ROUTE_COLORS = {
  driving: "#1f78ff",
  cycling: "#2b9f4a",
  walking: "#8b5fbf",
};

export const DEFAULT_LLM_CONFIG = {
  provider: "openai-compatible",
  endpoint: "https://openrouter.ai/api/v1/chat/completions",
  model: "openai/gpt-5-mini",
  deployment: "",
  apiVersion: "2025-01-01-preview",
  apiKey: "",
  enabled: false,
};

export const DETAIL_CATEGORY_HINTS = [
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

export const SUGGESTION_CATALOG = [
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

export const SEED_EVENTS = [
  { id: "e1", title: "Open-air jazz session", city: "Paris", date: "2026-04-12", category: "music", venue: "Riverside Stage", lat: 48.8566, lng: 2.3522, tags: ["music", "nightlife", "culture"] },
  { id: "e2", title: "Food truck festival", city: "Berlin", date: "2026-05-03", category: "food", venue: "East Market Square", lat: 52.52, lng: 13.405, tags: ["food", "culture"] },
  { id: "e3", title: "Night museum program", city: "Rome", date: "2026-06-18", category: "culture", venue: "Capitol Museums", lat: 41.9028, lng: 12.4964, tags: ["museum", "history", "culture"] },
  { id: "e4", title: "Design week spotlight", city: "Milan", date: "2026-04-21", category: "design", venue: "Brera District", lat: 45.4642, lng: 9.19, tags: ["art", "design", "culture"] },
  { id: "e5", title: "Weekend city marathon expo", city: "Tokyo", date: "2026-03-28", category: "sports", venue: "Harbor Expo Hall", lat: 35.6762, lng: 139.6503, tags: ["fitness", "running"] },
  { id: "e6", title: "Indie film night", city: "Barcelona", date: "2026-07-02", category: "film", venue: "Cine Garden", lat: 41.3851, lng: 2.1734, tags: ["film", "culture", "nightlife"] },
];

export const SEED_MAIN_LOCATIONS = [
  { id: "ml1", title: "Eiffel Tower", city: "Paris", lat: 48.8584, lng: 2.2945, category: "landmark", tags: ["landmark", "architecture", "viewpoint"] },
  { id: "ml2", title: "Louvre Museum", city: "Paris", lat: 48.8606, lng: 2.3376, category: "museum", tags: ["museum", "art", "culture"] },
  { id: "ml3", title: "Colosseum", city: "Rome", lat: 41.8902, lng: 12.4922, category: "history", tags: ["history", "landmark", "architecture"] },
  { id: "ml4", title: "Sagrada Familia", city: "Barcelona", lat: 41.4036, lng: 2.1744, category: "architecture", tags: ["architecture", "culture", "landmark"] },
  { id: "ml5", title: "Brandenburg Gate", city: "Berlin", lat: 52.5163, lng: 13.3777, category: "landmark", tags: ["history", "landmark"] },
  { id: "ml6", title: "Shibuya Crossing", city: "Tokyo", lat: 35.6595, lng: 139.7005, category: "city-icon", tags: ["city", "nightlife", "photography"] },
  { id: "ml7", title: "Grand Canal", city: "Venice", lat: 45.44, lng: 12.3155, category: "waterfront", tags: ["relax", "culture", "romantic"] },
  { id: "ml8", title: "Table Mountain", city: "Cape Town", lat: -33.9628, lng: 18.4098, category: "nature", tags: ["nature", "hiking", "viewpoint"] },
];

export const SEED_TRIP_IDEAS = [
  { id: "tr1", title: "Versailles day trip", city: "Paris", lat: 48.8049, lng: 2.1204, category: "day-trip", tags: ["history", "architecture", "day-trip"], description: "Palace and gardens with half-day planning." },
  { id: "tr2", title: "Lake Como scenic train", city: "Milan", lat: 45.8081, lng: 9.0852, category: "scenic-route", tags: ["nature", "train", "trip"], description: "Relaxed full-day lakeside escape." },
  { id: "tr3", title: "Nikko cultural side trip", city: "Tokyo", lat: 36.7198, lng: 139.6982, category: "day-trip", tags: ["history", "culture", "trip"], description: "Shrines and mountain views with rail access." },
  { id: "tr4", title: "Sintra castles loop", city: "Lisbon", lat: 38.8029, lng: -9.3817, category: "day-trip", tags: ["architecture", "history", "trip"], description: "UNESCO hill town with palace circuit." },
  { id: "tr5", title: "Blue Mountains route", city: "Sydney", lat: -33.7128, lng: 150.3119, category: "nature-trip", tags: ["nature", "hiking", "trip"], description: "Lookouts and forest walks outside the city." },
];
