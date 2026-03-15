# Colonist-Style AI Arena

This repository now contains a **Colonist.io-inspired strategy game prototype** focused on stronger AI decision-making.

## What is implemented

- 19-hex generated board (radius 2) with:
  - resource tiles
  - number tokens
  - desert + robber
- Graph-based map logic:
  - intersections (settlement/city nodes)
  - road edges
  - distance rule for settlements
- Turn loop:
  - dice production
  - robber handling on 7 (discard + move + steal)
  - building roads, settlements, and cities
  - bank trading (4:1)
- 4 strategic AI players that:
  - score intersections by expected production (dice odds)
  - value resource diversity and scarcity balancing
  - path roads toward high-value expansion points
  - choose high-yield city upgrades
  - trade toward unmet build goals

## Run locally

Because this is a static browser game, any local static server works.

### Option A: Python

```bash
python3 -m http.server 8000
```

Then open:

```
http://localhost:8000
```

### Option B: VS Code Live Server

Open `index.html` with a live static server extension.

## Controls

- **Next Turn**: advances one AI turn
- **Start/Stop Autoplay**: runs turns continuously
- **Autoplay Speed**: controls turn frequency
- **Reset Game**: generates a fresh board and restarts the match

## Notes

This project is intentionally streamlined rather than a full Catan rules clone. The main focus is improved AI planning quality over random play.
