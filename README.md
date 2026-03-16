# Colonist-Style Full Game

This project is a Catan/Colonist-inspired browser game with a human player and strategic AI opponents.

## Demo (GitHub Pages)

After enabling Pages for the repository, the game is published at:

- https://tijs-carecogni.github.io/Tripplanner/

If this is the first deployment, open repository **Settings -> Pages** and set the source to
**GitHub Actions**. (GitHub Actions tokens usually cannot enable Pages automatically on first run.)
The workflow file is:

- `.github/workflows/deploy-pages.yml`

Deployments run on pushes to `main` and `cursor/colonist-game-ai-351c`, and can also be started
manually from the Actions tab.

## Features

### Core board/rules

- 19-hex generated board (radius 2)
- resource distribution + number tokens
- desert + robber
- node/edge graph with full adjacency validation
- settlement distance rule
- turn phases:
  - roll phase
  - main phase
- resource production from settlements/cities
- robber flow on 7:
  - hand discard
  - robber relocation
  - random steal

### Building and economy

- roads, settlements, cities
- bank trade with dynamic rates:
  - base 4:1
  - 3:1 generic ports
  - 2:1 resource ports
- clickable board building for human turns

### Development cards

- deck with:
  - Knight
  - Road Building
  - Year of Plenty
  - Monopoly
  - Victory Point
- one dev card play per turn rule
- newly bought action cards become usable on later turns

### Awards and scoring

- Longest Road (+2 VP)
- Largest Army (+2 VP)
- hidden VP from development cards
- win condition at 10 VP

### AI improvements

- weighted settlement placement by expected production and diversity
- road path planning to high-value expansion nodes
- city-upgrade targeting
- tactical robber targeting
- dynamic bank-trade planning toward goal costs
- development-card usage heuristics

## Run

```bash
python3 -m http.server 8000
```

Open:

`http://localhost:8000`

## Controls

- **Roll Dice / End Turn**: manual human turn flow
- **Play AI Turns**: resolves AI turns until it is the human player turn again
- **Start/Stop Autoplay**: continuously simulates turns
- **Build buttons**: choose action, then click board target
- **Buy/Play Dev Cards**: manage development card strategy
- **Bank Trade**: select give/get resources and trade by current rate
