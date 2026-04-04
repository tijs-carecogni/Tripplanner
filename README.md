# Tripplanner - MindTrip Hard-Point Planner

A lightweight MindTrip-like travel planner focused on:

- **Hard points first** (flights, booked hotels, fixed appointments, paid tickets)
- **Route node sets** (main stops you can activate one-by-one or combine)
- **Memory development** (learns your likes/dislikes from ratings)
- **Personalized suggestions** (and custom ideas you can add/rate)
- **Map + itinerary visualization**
- **Visual journey board** (phase tracker, route strip, activity mix, trip pulse)
- **Mobile-first layout** (workspace-first flow on small screens, desktop expansion on larger screens)
- **Main location + trip discovery**
- **Event discovery**
- **Interleaving flexible stops between hard points**
- **LLM-based natural-language search**
- **Context-driven LLM itinerary builder** (fills windows around hard points)
- **Conversational preference loop** (clarify, suggest options, collect feedback, refine memory)
- **Route comparison** (driving/cycling/walking, including alternatives where available)

## Features

### 1) Hard Point Planning (Most Important)
- Add locked trip points with date/time, location, booking reference, and notes.
- Designed for non-negotiable plans (flight departures, check-ins, booked tours).
- Hard points are sorted into a timeline itinerary and connected on the map.

### 2) Traveler Memory Model
- Save traveler profile: name, home base, budget style, travel pace, interests.
- Rate hard points, suggestions, and events (1-5).
- Memory engine updates preference weights by tag and city.
- Personalized recommendations improve over time from rating history.

### 3) Suggestion System
- Seeded catalog of trip ideas with tags and travel style metadata.
- Personalized ranking score based on memory + profile match.
- Add your own custom suggestions and rate them.
- Pin suggestions directly as new hard points.

### 4) Main Locations, Trips, and Interleaving
- Search for major locations (POIs) and trip ideas around a city/area.
- Results can be either:
  - **interleaved** as flexible stops in the timeline, or
  - **locked** as hard points.
- Interleaved locations/trips/events are merged chronologically with hard points in one itinerary.

### Visual Layer (Beyond Map)
- Animated workflow phase tracker (discover -> anchor -> outline -> rate -> refine).
- Country/region route strip with transport icons and segment distances.
- Activity-mix bars and trip pulse timeline for day density.
- Styled map legs with transport-aware lines (flight arcs, rail/road/walk styles) and icon markers.
- Design-grade UI system: glassmorphism cards, premium gradients, richer depth/shadows, and stronger typography hierarchy.

### 5) Two-level Route Planning (MindTrip-style)
- **Level 1 (Route level):** create route node sets (main stops/hubs).
- Activate a single set or combine multiple sets to build alternative route skeletons.
- Active route nodes are:
  - shown on the map,
  - merged into itinerary timeline,
  - usable as route planner anchors.
- **Level 2 (Detail level):** search and add specific places/events (hikes, shops, bars, concerts, architecture, museums, etc.) around your route.
- Combined search returns both levels together so planning stays coherent.

### 6) Event Finder
- Search by city/area, date, and radius.
- Combines seeded event data with nearby venue discovery.
- Rate events to improve memory.
- Add events either as interleaved stops or locked hard points.

### 7) LLM-based Search
- Configure either:
  - OpenAI-compatible endpoint + model + API key, or
  - Azure OpenAI endpoint + deployment + API version + API key.
- Ask natural language queries (e.g. "interleave food spots and evening music between my hard points").
- LLM returns mixed suggestions (`main-location`, `event`, `trip`) that can be:
  - interleaved in itinerary,
  - locked as hard points, or
  - rated for memory learning.

### 8) User + Trip Context Driven Itinerary Generation
- Save explicit trip context (trip range, destination, must-include, avoid, style notes).
- Planner computes **free windows around hard points**.
- LLM can generate itinerary parts specifically for those windows while preserving hard-point constraints.
- Generated items are inserted as flexible itinerary stops and can replace prior generated parts.

### 9) Conversational Copilot (Long-form preference discovery)
- Multi-turn conversation to clarify ambiguous user preferences.
- Suggests multiple options in each turn and captures feedback (`Love / Maybe / No`).
- Feedback updates user memory (likes/dislikes tags) and fine-tunes future suggestions.
- Supports **side-track mode** for deep dives into activities, then returning to **main planning** while carrying learned signals.
- Conversation insights are included in the itinerary generation context.
- Includes **rough-outline-first** generation and **multiple fill strategies** you can choose/feedback on.
- Supports **soft-added POIs** (tentative places) that can later be interleaved, locked, rated, or removed.
- Supports context checks on demand so you can ask what the planner currently understands about:
  - user context
  - trip context
  - hard points
- Supports no-planning hard-point blocks (e.g., overnight village stays where planner should not fill activities).
- Learns trip ideas from the user’s initial/early conversation messages and stores them in trip context.
- Supports point-level strategy deep dives: tweak a specific outline point, then return to general strategy mode.

### 10) Route Comparison (Google Maps-style concept)
- Compare multiple route profiles: driving, cycling, walking.
- Support:
  - point-to-point hard point comparison
  - whole-trip hard point route comparison
- Shows distance and ETA per profile and visualizes all routes on map.

## Run Locally

### Option A (recommended): run backend + frontend together

This mode enables persisted user/trip saves via `/api/state`.

```bash
cd backend
npm install
npm start
```

Then open:

`http://localhost:8787`

### Option B: static frontend only (no backend persistence)

```bash
python3 -m http.server 8000
```

Then open:

`http://localhost:8000`

## Try a hosted demo

Yes — the repo is now deployment-ready.

### Fastest path: Render (with persistence disk)

1. Push this branch to GitHub (already done).
2. In Render, choose **New + Blueprint** and select this repo.
3. Render will pick up `render.yaml` and create:
   - a Node web service
   - a persistent disk mounted at `/var/data`
4. Open the generated URL (for example `https://tripmind-demo.onrender.com`).

The app + API run together on one service, so cloud trip save works from the same URL.

### Docker deploy (any container host)

This repo also includes a root `Dockerfile`. Example:

```bash
docker build -t tripmind-demo .
docker run -p 8787:8787 -e TRIPMIND_DATA_DIR=/app/backend/data tripmind-demo
```

Then open `http://localhost:8787`.

### Azure (Container Apps)

The **GitHub Actions deploy workflow does not create Azure resources** (no Container App, no ACR, no Container Apps environment). It assumes they already exist and only **updates** the app image. If your resource group is **empty** or only has the RG shell, create infrastructure first with **Terraform** (`infra/terraform/azure/`) or **`scripts/deploy_azure_containerapp.sh`**, then align GitHub Variables with the real names.

You can deploy directly to Azure with one script:

```bash
bash ./scripts/deploy_azure_containerapp.sh
```

Optional environment variables:

```bash
APP_NAME=tripmind-demo \
RESOURCE_GROUP=tripmind-demo-rg \
LOCATION=westeurope \
ENV_NAME=tripmind-demo-env \
bash ./scripts/deploy_azure_containerapp.sh
```

This creates/updates an Azure Container App from this repo and prints a public HTTPS URL.
For production-grade durable server-side saves, mount Azure Files and set `TRIPMIND_DATA_DIR`.

### GitHub Actions deploy (push to `main`)

The workflow `.github/workflows/deploy.yml` logs in with **azure/login@v3**, pushes the image to **Azure Container Registry (ACR)**, then runs `az containerapp update` on a **Container App** in a **resource group**. If your Azure resources use other names or regions (for example **`wagenaarlabs_tripplanner_rg`** in **Sweden Central**), set the repository **Variables** below so CI targets the same subscription and resources as the portal.

#### Repository Variables (deployment target)

GitHub: **Settings → Secrets and variables → Actions → Variables**.

| Variable | Example | Purpose |
|----------|---------|---------|
| `AZURE_RESOURCE_GROUP` | `wagenaarlabs_tripplanner_rg` | Resource group that contains the Container App |
| `AZURE_CONTAINER_APP` | *(your app name in that RG)* | App to update |
| `ACR_NAME` | *(registry name only, no `.azurecr.io`)* | `az acr login` and image host |
| `ACR_IMAGE_NAME` | `tripplanner` | Image repository inside ACR |

If unset, defaults remain `tripmind-demo-rg`, `tripmind-demo`, `tripminddemoacr`, and `tripplanner`. The workflow prints the resolved values in the first step for easier log debugging. **ACR and the Container App can be in different resource groups**; `AZURE_RESOURCE_GROUP` must be the group that contains the Container App.

#### Secrets (authentication)

1. **OIDC (recommended):** Secrets `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID` (subscription ID from the portal, e.g. under *Abonnement*). On the app registration, add a **federated credential** for GitHub Actions for this repo (branch `main` or an [environment](https://docs.github.com/actions/deployment/targeting-different-environments/using-environments-for-deployment)). See [Configure OIDC with Azure](https://docs.github.com/actions/security-for-github-actions/security-hardening-your-deployments/configuring-openid-connect-in-azure).
2. **Service principal secret (fallback):** If `AZURE_CLIENT_ID` is not set as a secret, the workflow uses `AZURE_CREDENTIALS` — JSON with **camelCase** keys: `clientId`, `clientSecret`, `subscriptionId`, `tenantId`. Wrong shape, expired secret, or wrong subscription ID causes login failure.

#### RBAC (after login succeeds)

The CI identity needs **AcrPush** (or equivalent) on the registry and permission to update the Container App (for example **Contributor** on the RG that holds the app). If push or `containerapp update` fails, add the missing role in Azure IAM.

### Azure via Terraform (recommended when `az` CLI is unavailable)

If your environment does not have Azure CLI, use Terraform directly:

```bash
cd infra/terraform/azure
cp terraform.tfvars.example terraform.tfvars
# set container_image in terraform.tfvars
terraform init
terraform apply
terraform output container_app_url
```

Auth is done via ARM environment variables (no Azure CLI required):

- `ARM_SUBSCRIPTION_ID`
- `ARM_TENANT_ID`
- `ARM_CLIENT_ID`
- `ARM_CLIENT_SECRET` (or OIDC in CI)

## Files

- `index.html` - app layout and UI sections
- `theme.css` - design tokens (palette, typography, spacing, motion, elevation, light/dark)
- `styles.css` - styling and responsive layout
- `THEMING_PLAN.md` - consistent styling blueprint and rollout checklist
- `render.yaml` - Render blueprint for one-click hosted demo deployment
- `Dockerfile` - containerized app+API deployment
- `app.js` - app orchestration, state transitions, UI handlers, planner workflows
- `backend/server.js` - Express API + static host for persisted user/trip state
- `backend/data/trip-store.json` - generated on first save (gitignored)
- `frontend/` - React + TypeScript migration scaffold (phase 1 shell + persistence panel)
- `src/constants.js` - static configuration and seeded travel data catalogs
- `src/utils.js` - shared utility helpers (IDs, tags, date/time, distance, formatting)
- `src/interaction.js` - shared interaction primitives (entity-link keys + cross-component highlight controller)
- `scripts/capture_demo_screenshots.sh` - regenerates demo-filled hero screenshots for UI iteration
- `scripts/capture_mobile_screenshots.sh` - captures mobile-first screenshot set for visual QA
- `scripts/deploy_azure_containerapp.sh` - one-command Azure Container Apps deploy for a live demo URL
- `infra/terraform/azure/` - Terraform stack for Azure Container Apps + Azure Files persistence (no `az` CLI required)
- `screenshots/bootstrap-demo.html` - localStorage bootstrap page used by screenshot workflow

## Notes

- Browser `localStorage` remains the immediate state store for UI responsiveness.
- New backend persistence is available via **Cloud Trip Save** (`userId` + `tripId`) and stores full planner state server-side.
- LLM API key is stored in browser localStorage for convenience in this MVP.
- External map/routing/geocoding data depends on availability of public services.
- UI iteration screenshots can be refreshed with `./scripts/capture_demo_screenshots.sh`.
- Mobile-first iteration screenshots can be refreshed with `./scripts/capture_mobile_screenshots.sh`.
