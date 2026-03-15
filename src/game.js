const RESOURCES = ["wood", "brick", "sheep", "wheat", "ore"];
const RESOURCE_SHORT = { wood: "Wd", brick: "Br", sheep: "Sh", wheat: "Wh", ore: "Or" };
const RESOURCE_COLORS = {
  wood: "#2f8f3b",
  brick: "#c66536",
  sheep: "#8ed26b",
  wheat: "#d9bc52",
  ore: "#8b96a8",
  desert: "#d6c28e",
};

const DICE_WEIGHT = {
  2: 1,
  3: 2,
  4: 3,
  5: 4,
  6: 5,
  7: 6,
  8: 5,
  9: 4,
  10: 3,
  11: 2,
  12: 1,
};

const COSTS = {
  road: { wood: 1, brick: 1 },
  settlement: { wood: 1, brick: 1, sheep: 1, wheat: 1 },
  city: { wheat: 2, ore: 3 },
  development: { sheep: 1, wheat: 1, ore: 1 },
};

const PLAYER_CONFIG = [
  { name: "You", color: "#f94144", isHuman: true },
  { name: "Pioneer AI", color: "#577590", isHuman: false },
  { name: "Sage AI", color: "#f9c74f", isHuman: false },
  { name: "Vector AI", color: "#43aa8b", isHuman: false },
];

const DEV_CARD_TYPES = ["knight", "roadBuilding", "yearOfPlenty", "monopoly"];
const SQRT3 = Math.sqrt(3);
const BOARD_RADIUS = 2;
const WINNING_POINTS = 10;
const TURN_LIMIT = 500;

function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function makeEmptyResources() {
  return { wood: 0, brick: 0, sheep: 0, wheat: 0, ore: 0 };
}

function makeEmptyDevCards() {
  return { knight: 0, roadBuilding: 0, yearOfPlenty: 0, monopoly: 0 };
}

function sumResources(resources) {
  return RESOURCES.reduce((acc, resource) => acc + resources[resource], 0);
}

function resourceString(resources) {
  return RESOURCES.map((r) => `${RESOURCE_SHORT[r]}:${resources[r]}`).join(" ");
}

function copyResources(resources) {
  const copy = makeEmptyResources();
  RESOURCES.forEach((r) => {
    copy[r] = resources[r];
  });
  return copy;
}

function hasResources(resources, cost) {
  return Object.entries(cost).every(([type, amount]) => resources[type] >= amount);
}

function payCost(resources, cost) {
  Object.entries(cost).forEach(([type, amount]) => {
    resources[type] -= amount;
  });
}

function pointKey(point) {
  return `${Math.round(point.x * 10) / 10},${Math.round(point.y * 10) / 10}`;
}

function edgeKey(a, b) {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

function axialToPixel(q, r, size, cx, cy) {
  return {
    x: cx + size * SQRT3 * (q + r / 2),
    y: cy + size * 1.5 * r,
  };
}

function getHexCorners(center, size) {
  const corners = [];
  for (let i = 0; i < 6; i += 1) {
    const angle = ((60 * i - 30) * Math.PI) / 180;
    corners.push({
      x: center.x + size * Math.cos(angle),
      y: center.y + size * Math.sin(angle),
    });
  }
  return corners;
}

function createAxialHexes(radius) {
  const hexes = [];
  for (let q = -radius; q <= radius; q += 1) {
    for (let r = -radius; r <= radius; r += 1) {
      const s = -q - r;
      if (Math.abs(s) <= radius) {
        hexes.push({ q, r });
      }
    }
  }
  return hexes;
}

function createBoardGeometry(canvasWidth, canvasHeight) {
  const hexSize = 60;
  const centerX = canvasWidth * 0.47;
  const centerY = canvasHeight * 0.49;

  const nodeByKey = new Map();
  const edgeByKey = new Map();
  const nodes = [];
  const edges = [];
  const hexes = [];

  const createNode = (point) => {
    const key = pointKey(point);
    if (nodeByKey.has(key)) return nodeByKey.get(key);
    const id = nodes.length;
    nodes.push({
      id,
      x: point.x,
      y: point.y,
      owner: null,
      structure: null,
      adjacentHexes: [],
      edgeIds: [],
      neighbors: [],
      ports: [],
    });
    nodeByKey.set(key, id);
    return id;
  };

  const createEdge = (a, b) => {
    const key = edgeKey(a, b);
    if (edgeByKey.has(key)) return edgeByKey.get(key);
    const id = edges.length;
    edges.push({ id, nodes: [a, b], owner: null, hexIds: [] });
    edgeByKey.set(key, id);
    nodes[a].edgeIds.push(id);
    nodes[b].edgeIds.push(id);
    return id;
  };

  for (const axial of createAxialHexes(BOARD_RADIUS)) {
    const center = axialToPixel(axial.q, axial.r, hexSize, centerX, centerY);
    const corners = getHexCorners(center, hexSize);
    const nodeIds = corners.map(createNode);
    const edgeIds = [];
    const hexId = hexes.length;
    for (let i = 0; i < 6; i += 1) {
      const edgeId = createEdge(nodeIds[i], nodeIds[(i + 1) % 6]);
      edgeIds.push(edgeId);
      if (!edges[edgeId].hexIds.includes(hexId)) {
        edges[edgeId].hexIds.push(hexId);
      }
    }
    nodeIds.forEach((nodeId) => nodes[nodeId].adjacentHexes.push(hexId));
    hexes.push({
      id: hexId,
      q: axial.q,
      r: axial.r,
      center,
      corners,
      nodes: nodeIds,
      edges: edgeIds,
      resource: null,
      number: null,
    });
  }

  edges.forEach((edge) => {
    const [a, b] = edge.nodes;
    if (!nodes[a].neighbors.includes(b)) nodes[a].neighbors.push(b);
    if (!nodes[b].neighbors.includes(a)) nodes[b].neighbors.push(a);
  });

  return { hexSize, centerX, centerY, hexes, nodes, edges };
}

function assignTiles(geometry) {
  const resources = shuffle([
    "wood",
    "wood",
    "wood",
    "wood",
    "brick",
    "brick",
    "brick",
    "sheep",
    "sheep",
    "sheep",
    "sheep",
    "wheat",
    "wheat",
    "wheat",
    "wheat",
    "ore",
    "ore",
    "ore",
    "desert",
  ]);
  const numbers = shuffle([2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12]);
  let numberIndex = 0;
  let robberHexId = 0;

  geometry.hexes.forEach((hex, idx) => {
    hex.resource = resources[idx];
    if (hex.resource === "desert") {
      hex.number = null;
      robberHexId = idx;
    } else {
      hex.number = numbers[numberIndex];
      numberIndex += 1;
    }
  });
  return robberHexId;
}

function assignPorts(geometry) {
  const coastalEdges = geometry.edges.filter((edge) => edge.hexIds.length === 1);
  const chosen = shuffle(coastalEdges).slice(0, 9);
  const portTypes = shuffle(["any", "any", "any", "any", "wood", "brick", "sheep", "wheat", "ore"]);

  const ports = [];
  chosen.forEach((edge, idx) => {
    const type = portTypes[idx];
    ports.push({ edgeId: edge.id, type, nodes: edge.nodes });
    edge.nodes.forEach((nodeId) => {
      geometry.nodes[nodeId].ports.push(type);
    });
  });
  return ports;
}

function createDevelopmentDeck() {
  return shuffle([
    ...Array(14).fill("knight"),
    ...Array(2).fill("roadBuilding"),
    ...Array(2).fill("yearOfPlenty"),
    ...Array(2).fill("monopoly"),
    ...Array(5).fill("victoryPoint"),
  ]);
}

function chooseRandomWeighted(candidates) {
  const total = candidates.reduce((acc, c) => acc + c.weight, 0);
  if (total <= 0) return candidates[Math.floor(Math.random() * candidates.length)];
  let value = Math.random() * total;
  for (const candidate of candidates) {
    value -= candidate.weight;
    if (value <= 0) return candidate;
  }
  return candidates[candidates.length - 1];
}

function distancePointToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) return Math.hypot(px - x1, py - y1);
  const t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy);
  const clamped = Math.max(0, Math.min(1, t));
  const x = x1 + clamped * dx;
  const y = y1 + clamped * dy;
  return Math.hypot(px - x, py - y);
}

class ColonistFullGame {
  constructor() {
    this.canvas = document.querySelector("#board");
    this.ctx = this.canvas.getContext("2d");
    this.logContainer = document.querySelector("#log");
    this.scoreboard = document.querySelector("#scoreboard");
    this.statusText = document.querySelector("#statusText");
    this.hintText = document.querySelector("#hintText");

    this.nextTurnBtn = document.querySelector("#nextTurnBtn");
    this.autoplayBtn = document.querySelector("#autoplayBtn");
    this.resetBtn = document.querySelector("#resetBtn");
    this.rollDiceBtn = document.querySelector("#rollDiceBtn");
    this.endTurnBtn = document.querySelector("#endTurnBtn");
    this.buildRoadBtn = document.querySelector("#buildRoadBtn");
    this.buildSettlementBtn = document.querySelector("#buildSettlementBtn");
    this.buildCityBtn = document.querySelector("#buildCityBtn");
    this.buyDevBtn = document.querySelector("#buyDevBtn");
    this.playKnightBtn = document.querySelector("#playKnightBtn");
    this.playRoadBuildingBtn = document.querySelector("#playRoadBuildingBtn");
    this.playYearOfPlentyBtn = document.querySelector("#playYearOfPlentyBtn");
    this.playMonopolyBtn = document.querySelector("#playMonopolyBtn");
    this.tradeBankBtn = document.querySelector("#tradeBankBtn");
    this.giveResourceSelect = document.querySelector("#giveResourceSelect");
    this.getResourceSelect = document.querySelector("#getResourceSelect");
    this.speedRange = document.querySelector("#speedRange");

    this.maxLogEntries = 260;
    this.autoplayInterval = null;

    this.populateResourceSelects();
    this.bindControls();
    this.resetGame();
  }

  populateResourceSelects() {
    [this.giveResourceSelect, this.getResourceSelect].forEach((select) => {
      select.innerHTML = "";
      RESOURCES.forEach((resource) => {
        const option = document.createElement("option");
        option.value = resource;
        option.textContent = resource;
        select.appendChild(option);
      });
    });
    this.giveResourceSelect.value = "wood";
    this.getResourceSelect.value = "brick";
  }

  bindControls() {
    this.nextTurnBtn.addEventListener("click", () => {
      this.autoPlayCurrentTurn();
    });
    this.autoplayBtn.addEventListener("click", () => {
      if (this.autoplayInterval) this.stopAutoplay();
      else this.startAutoplay();
    });
    this.resetBtn.addEventListener("click", () => {
      this.stopAutoplay();
      this.resetGame();
    });
    this.rollDiceBtn.addEventListener("click", () => {
      this.handleHumanRoll();
    });
    this.endTurnBtn.addEventListener("click", () => {
      this.handleHumanEndTurn();
    });
    this.buildRoadBtn.addEventListener("click", () => this.setPendingAction("road"));
    this.buildSettlementBtn.addEventListener("click", () => this.setPendingAction("settlement"));
    this.buildCityBtn.addEventListener("click", () => this.setPendingAction("city"));
    this.buyDevBtn.addEventListener("click", () => this.handleHumanBuyDevCard());
    this.playKnightBtn.addEventListener("click", () => this.handleHumanPlayDevCard("knight"));
    this.playRoadBuildingBtn.addEventListener("click", () =>
      this.handleHumanPlayDevCard("roadBuilding"),
    );
    this.playYearOfPlentyBtn.addEventListener("click", () =>
      this.handleHumanPlayDevCard("yearOfPlenty"),
    );
    this.playMonopolyBtn.addEventListener("click", () => this.handleHumanPlayDevCard("monopoly"));
    this.tradeBankBtn.addEventListener("click", () => this.handleHumanBankTrade());
    this.speedRange.addEventListener("input", () => {
      if (this.autoplayInterval) {
        this.stopAutoplay();
        this.startAutoplay();
      }
    });
    this.canvas.addEventListener("click", (event) => this.handleBoardClick(event));
  }

  get currentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  resetGame() {
    this.geometry = createBoardGeometry(this.canvas.width, this.canvas.height);
    this.robberHexId = assignTiles(this.geometry);
    this.ports = assignPorts(this.geometry);
    this.devDeck = createDevelopmentDeck();

    this.players = PLAYER_CONFIG.map((config, id) => ({
      id,
      name: config.name,
      color: config.color,
      isHuman: config.isHuman,
      resources: makeEmptyResources(),
      roads: new Set(),
      settlements: new Set(),
      cities: new Set(),
      devCards: makeEmptyDevCards(),
      newDevCards: makeEmptyDevCards(),
      devVictoryPoints: 0,
      knightsPlayed: 0,
      longestRoadLength: 0,
      victoryPoints: 0,
    }));

    this.logEntries = [];
    this.turn = 1;
    this.currentPlayerIndex = 0;
    this.phase = "pre_roll";
    this.lastRoll = null;
    this.winner = null;
    this.pendingAction = null;
    this.currentTurnPlayedDevCard = false;
    this.longestRoadHolder = null;
    this.largestArmyHolder = null;

    this.initialPlacement();
    this.recomputeScores();
    this.addLog("Game initialized with full rule set and strategic AI.");
    this.render();
  }

  initialPlacement() {
    const placementOrder = [0, 1, 2, 3, 3, 2, 1, 0];
    placementOrder.forEach((playerId, idx) => {
      const player = this.players[playerId];
      const nodeId = this.getBestInitialSettlementNode(player);
      if (nodeId == null) return;
      this.placeSettlement(player, nodeId, true);
      const roadId = this.getBestRoadFromNode(player, nodeId);
      if (roadId != null) this.placeRoad(player, roadId, { free: true, setupNode: nodeId });
      if (idx >= this.players.length) {
        this.geometry.nodes[nodeId].adjacentHexes.forEach((hexId) => {
          const hex = this.geometry.hexes[hexId];
          if (hex.resource !== "desert") {
            player.resources[hex.resource] += 1;
          }
        });
      }
    });
    this.addLog("Initial placement complete.");
  }

  addLog(text) {
    this.logEntries.push(text);
    if (this.logEntries.length > this.maxLogEntries) {
      this.logEntries = this.logEntries.slice(-this.maxLogEntries);
    }
  }

  rollDice() {
    return 1 + Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6);
  }

  handleHumanRoll() {
    const player = this.currentPlayer;
    if (!player || !player.isHuman || this.winner) return;
    if (this.phase !== "pre_roll") return;
    this.executeRollPhase(player);
    this.render();
  }

  handleHumanEndTurn() {
    const player = this.currentPlayer;
    if (!player || !player.isHuman || this.winner) return;
    if (this.phase !== "main") return;
    this.endTurn();
  }

  setPendingAction(action) {
    const player = this.currentPlayer;
    if (!player || !player.isHuman || this.winner || this.phase !== "main") return;
    this.pendingAction = this.pendingAction === action ? null : action;
    this.render();
  }

  handleHumanBuyDevCard() {
    const player = this.currentPlayer;
    if (!player || !player.isHuman || this.winner || this.phase !== "main") return;
    this.buyDevelopmentCard(player);
    this.recomputeScores();
    this.checkForWinner(player);
    this.render();
  }

  handleHumanPlayDevCard(type) {
    const player = this.currentPlayer;
    if (!player || !player.isHuman || this.winner || this.phase !== "main") return;
    const played = this.playDevelopmentCard(player, type);
    if (played) {
      this.recomputeScores();
      this.checkForWinner(player);
      this.render();
    }
  }

  handleHumanBankTrade() {
    const player = this.currentPlayer;
    if (!player || !player.isHuman || this.winner || this.phase !== "main") return;
    const give = this.giveResourceSelect.value;
    const get = this.getResourceSelect.value;
    if (give === get) {
      this.addLog("Choose two different resources for bank trade.");
      this.render();
      return;
    }
    const ok = this.performBankTrade(player, give, get);
    if (!ok) this.addLog("Bank trade failed (insufficient cards for current rate).");
    this.render();
  }

  handleBoardClick(event) {
    const player = this.currentPlayer;
    if (!player || !player.isHuman || this.phase !== "main" || this.winner || !this.pendingAction) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) * this.canvas.width) / rect.width;
    const y = ((event.clientY - rect.top) * this.canvas.height) / rect.height;

    if (this.pendingAction === "road") {
      const edgeId = this.findEdgeAt(x, y);
      if (edgeId == null) return;
      if (this.placeRoad(player, edgeId, { free: false })) {
        payCost(player.resources, COSTS.road);
        this.addLog(`${player.name} built a road.`);
        this.pendingAction = null;
      } else {
        this.addLog("Cannot build road at this edge.");
      }
    } else {
      const nodeId = this.findNodeAt(x, y);
      if (nodeId == null) return;
      if (this.pendingAction === "settlement") {
        if (this.placeSettlement(player, nodeId, false)) {
          payCost(player.resources, COSTS.settlement);
          this.addLog(`${player.name} built a settlement.`);
          this.pendingAction = null;
        } else {
          this.addLog("Cannot build settlement at this node.");
        }
      } else if (this.pendingAction === "city") {
        if (this.placeCity(player, nodeId, false)) {
          payCost(player.resources, COSTS.city);
          this.addLog(`${player.name} upgraded to a city.`);
          this.pendingAction = null;
        } else {
          this.addLog("Cannot build city at this node.");
        }
      }
    }

    this.recomputeScores();
    this.checkForWinner(player);
    this.render();
  }

  findNodeAt(x, y) {
    let bestId = null;
    let bestDist = 16;
    this.geometry.nodes.forEach((node) => {
      const dist = Math.hypot(x - node.x, y - node.y);
      if (dist < bestDist) {
        bestDist = dist;
        bestId = node.id;
      }
    });
    return bestId;
  }

  findEdgeAt(x, y) {
    let bestId = null;
    let bestDist = 10;
    this.geometry.edges.forEach((edge) => {
      const [a, b] = edge.nodes;
      const p1 = this.geometry.nodes[a];
      const p2 = this.geometry.nodes[b];
      const dist = distancePointToSegment(x, y, p1.x, p1.y, p2.x, p2.y);
      if (dist < bestDist) {
        bestDist = dist;
        bestId = edge.id;
      }
    });
    return bestId;
  }

  executeRollPhase(player) {
    if (this.phase !== "pre_roll") return;
    this.lastRoll = this.rollDice();
    this.phase = "main";
    this.addLog(`Turn ${this.turn}: ${player.name} rolled ${this.lastRoll}.`);
    if (this.lastRoll === 7) this.resolveRobber(player, "rolled a 7");
    else this.distributeResources(this.lastRoll);
  }

  distributeResources(roll) {
    const gainByPlayer = this.players.map(() => makeEmptyResources());
    this.geometry.hexes.forEach((hex) => {
      if (hex.id === this.robberHexId || hex.number !== roll) return;
      hex.nodes.forEach((nodeId) => {
        const node = this.geometry.nodes[nodeId];
        if (node.owner == null || node.structure == null) return;
        const amount = node.structure === "city" ? 2 : 1;
        const owner = this.players[node.owner];
        owner.resources[hex.resource] += amount;
        gainByPlayer[node.owner][hex.resource] += amount;
      });
    });
    gainByPlayer.forEach((gain, playerId) => {
      if (sumResources(gain) > 0) {
        this.addLog(`${this.players[playerId].name} gains ${resourceString(gain)}.`);
      }
    });
  }

  resolveRobber(currentPlayer, reason) {
    this.players.forEach((player) => {
      const total = sumResources(player.resources);
      if (total <= 7) return;
      const discardCount = Math.floor(total / 2);
      for (let i = 0; i < discardCount; i += 1) {
        const candidates = RESOURCES.filter((r) => player.resources[r] > 0).map((r) => ({
          resource: r,
          weight: player.resources[r],
        }));
        if (!candidates.length) break;
        const chosen = chooseRandomWeighted(candidates).resource;
        player.resources[chosen] -= 1;
      }
      this.addLog(`${player.name} discards ${discardCount} cards after ${reason}.`);
    });
    const targetHexId = this.chooseRobberHex(currentPlayer);
    this.moveRobberAndSteal(currentPlayer, targetHexId);
  }

  chooseRobberHex(currentPlayer) {
    let bestHex = this.robberHexId;
    let bestScore = Number.NEGATIVE_INFINITY;
    this.geometry.hexes.forEach((hex) => {
      if (hex.id === this.robberHexId) return;
      let score = 0;
      hex.nodes.forEach((nodeId) => {
        const node = this.geometry.nodes[nodeId];
        if (node.owner == null || node.structure == null || !hex.number) return;
        const base = (node.structure === "city" ? 2 : 1) * (DICE_WEIGHT[hex.number] / 6);
        score += node.owner === currentPlayer.id ? -base : base;
      });
      if (score > bestScore) {
        bestScore = score;
        bestHex = hex.id;
      }
    });
    return bestHex;
  }

  moveRobberAndSteal(currentPlayer, targetHexId) {
    this.robberHexId = targetHexId;
    this.addLog(`${currentPlayer.name} moved robber to hex #${targetHexId}.`);
    const victimOptions = new Set();
    this.geometry.hexes[targetHexId].nodes.forEach((nodeId) => {
      const owner = this.geometry.nodes[nodeId].owner;
      if (owner != null && owner !== currentPlayer.id && sumResources(this.players[owner].resources) > 0) {
        victimOptions.add(owner);
      }
    });
    const victims = [...victimOptions];
    if (!victims.length) return;
    const victimId = victims[Math.floor(Math.random() * victims.length)];
    const victim = this.players[victimId];
    const available = RESOURCES.filter((r) => victim.resources[r] > 0);
    const stolen = available[Math.floor(Math.random() * available.length)];
    victim.resources[stolen] -= 1;
    currentPlayer.resources[stolen] += 1;
    this.addLog(`${currentPlayer.name} stole 1 ${stolen} from ${victim.name}.`);
  }

  canBuildRoad(player, edgeId, options = {}) {
    const edge = this.geometry.edges[edgeId];
    if (!edge || edge.owner != null) return false;
    const { free = false, setupNode = null } = options;
    if (!free && !hasResources(player.resources, COSTS.road)) return false;
    if (setupNode != null) return edge.nodes.includes(setupNode);

    const connected = edge.nodes.some((nodeId) => {
      const node = this.geometry.nodes[nodeId];
      const ownedOrEmpty = node.owner == null || node.owner === player.id;
      if (!ownedOrEmpty) return false;
      return node.owner === player.id || node.edgeIds.some((id) => this.geometry.edges[id].owner === player.id);
    });
    return connected;
  }

  canBuildSettlement(player, nodeId, setup = false) {
    const node = this.geometry.nodes[nodeId];
    if (!node || node.structure != null) return false;
    if (node.neighbors.some((neighborId) => this.geometry.nodes[neighborId].structure != null)) return false;
    if (setup) return true;
    if (!hasResources(player.resources, COSTS.settlement)) return false;
    return node.edgeIds.some((edgeId) => this.geometry.edges[edgeId].owner === player.id);
  }

  canBuildCity(player, nodeId, free = false) {
    const node = this.geometry.nodes[nodeId];
    if (!node || node.owner !== player.id || node.structure !== "settlement") return false;
    if (!free && !hasResources(player.resources, COSTS.city)) return false;
    return true;
  }

  placeRoad(player, edgeId, options = {}) {
    if (!this.canBuildRoad(player, edgeId, options)) return false;
    this.geometry.edges[edgeId].owner = player.id;
    player.roads.add(edgeId);
    return true;
  }

  placeSettlement(player, nodeId, setup = false) {
    if (!this.canBuildSettlement(player, nodeId, setup)) return false;
    const node = this.geometry.nodes[nodeId];
    node.owner = player.id;
    node.structure = "settlement";
    player.settlements.add(nodeId);
    return true;
  }

  placeCity(player, nodeId, free = false) {
    if (!this.canBuildCity(player, nodeId, free)) return false;
    const node = this.geometry.nodes[nodeId];
    node.structure = "city";
    player.settlements.delete(nodeId);
    player.cities.add(nodeId);
    return true;
  }

  getPlayerTradeRate(player, resource) {
    let rate = 4;
    const nodeIds = [...player.settlements, ...player.cities];
    nodeIds.forEach((nodeId) => {
      const ports = this.geometry.nodes[nodeId].ports;
      ports.forEach((type) => {
        if (type === "any") rate = Math.min(rate, 3);
        if (type === resource) rate = Math.min(rate, 2);
      });
    });
    return rate;
  }

  performBankTrade(player, give, get) {
    const rate = this.getPlayerTradeRate(player, give);
    if (player.resources[give] < rate) return false;
    player.resources[give] -= rate;
    player.resources[get] += 1;
    this.addLog(`${player.name} traded ${rate} ${give} for 1 ${get}.`);
    return true;
  }

  buyDevelopmentCard(player) {
    if (!this.devDeck.length) {
      this.addLog("Development deck is empty.");
      return false;
    }
    if (!hasResources(player.resources, COSTS.development)) {
      this.addLog(`${player.name} cannot afford a development card.`);
      return false;
    }
    payCost(player.resources, COSTS.development);
    const card = this.devDeck.pop();
    if (card === "victoryPoint") {
      player.devVictoryPoints += 1;
      this.addLog(`${player.name} bought a hidden Victory Point.`);
    } else {
      player.newDevCards[card] += 1;
      this.addLog(`${player.name} bought a ${card} card.`);
    }
    return true;
  }

  canPlayDevelopmentCard(player, type) {
    if (this.phase !== "main" || this.currentTurnPlayedDevCard || this.winner) return false;
    return player.devCards[type] > 0;
  }

  playDevelopmentCard(player, type) {
    if (!this.canPlayDevelopmentCard(player, type)) return false;
    player.devCards[type] -= 1;
    this.currentTurnPlayedDevCard = true;

    if (type === "knight") {
      player.knightsPlayed += 1;
      this.resolveRobber(player, "playing Knight");
      this.addLog(`${player.name} played Knight.`);
    } else if (type === "roadBuilding") {
      let built = 0;
      for (let i = 0; i < 2; i += 1) {
        const edgeId = this.chooseStrategicRoadEdge(player, true);
        if (edgeId == null) break;
        if (this.placeRoad(player, edgeId, { free: true })) built += 1;
      }
      this.addLog(`${player.name} played Road Building and placed ${built} road(s).`);
    } else if (type === "yearOfPlenty") {
      const picks = this.chooseYearOfPlentyResources(player);
      picks.forEach((resource) => {
        player.resources[resource] += 1;
      });
      this.addLog(`${player.name} played Year of Plenty and gained ${picks.join(" + ")}.`);
    } else if (type === "monopoly") {
      const target = this.chooseBestMonopolyResource(player);
      let collected = 0;
      this.players.forEach((other) => {
        if (other.id === player.id) return;
        collected += other.resources[target];
        other.resources[target] = 0;
      });
      player.resources[target] += collected;
      this.addLog(`${player.name} played Monopoly on ${target} and collected ${collected}.`);
    }

    this.recomputeScores();
    return true;
  }

  chooseYearOfPlentyResources(player) {
    const goals = [COSTS.city, COSTS.settlement, COSTS.development, COSTS.road];
    for (const goal of goals) {
      const deficits = RESOURCES.flatMap((resource) => {
        const need = Math.max(0, (goal[resource] || 0) - player.resources[resource]);
        return Array(need).fill(resource);
      });
      if (deficits.length) {
        if (deficits.length === 1) return [deficits[0], deficits[0]];
        return [deficits[0], deficits[1]];
      }
    }
    return ["wheat", "ore"];
  }

  chooseBestMonopolyResource(player) {
    let bestResource = "wheat";
    let bestScore = Number.NEGATIVE_INFINITY;
    RESOURCES.forEach((resource) => {
      const fromOpponents = this.players.reduce((acc, other) => {
        if (other.id === player.id) return acc;
        return acc + other.resources[resource];
      }, 0);
      const ownNeed = Math.max(
        0,
        2 - player.resources[resource] + (resource === "ore" || resource === "wheat" ? 1 : 0),
      );
      const score = fromOpponents + ownNeed * 0.5;
      if (score > bestScore) {
        bestScore = score;
        bestResource = resource;
      }
    });
    return bestResource;
  }

  autoPlayCurrentTurn() {
    if (this.winner) return;
    const player = this.currentPlayer;
    if (this.phase === "pre_roll") this.executeRollPhase(player);
    if (this.phase === "main") {
      this.executeAiMainPhase(player);
      this.endTurn();
    }
  }

  executeAiMainPhase(player) {
    if (!this.winner) {
      this.maybePlayBestDevCard(player);
    }
    let actions = 0;
    while (actions < 10) {
      if (this.winner) break;
      if (this.tryBuildSettlement(player)) {
        actions += 1;
        continue;
      }
      if (this.tryBuildCity(player)) {
        actions += 1;
        continue;
      }
      if (this.tryBuildRoad(player)) {
        actions += 1;
        continue;
      }
      if (this.buyDevelopmentCard(player)) {
        actions += 1;
        continue;
      }
      if (this.tryTradeForGoal(player)) {
        actions += 1;
        continue;
      }
      break;
    }
    this.recomputeScores();
    this.checkForWinner(player);
  }

  maybePlayBestDevCard(player) {
    if (this.currentTurnPlayedDevCard || this.phase !== "main") return false;
    if (player.devCards.knight > 0 && this.shouldPlayKnight(player)) {
      return this.playDevelopmentCard(player, "knight");
    }
    if (player.devCards.monopoly > 0 && this.shouldPlayMonopoly(player)) {
      return this.playDevelopmentCard(player, "monopoly");
    }
    if (player.devCards.yearOfPlenty > 0 && this.shouldPlayYearOfPlenty(player)) {
      return this.playDevelopmentCard(player, "yearOfPlenty");
    }
    if (player.devCards.roadBuilding > 0 && this.shouldPlayRoadBuilding(player)) {
      return this.playDevelopmentCard(player, "roadBuilding");
    }
    return false;
  }

  shouldPlayKnight(player) {
    const badRobber = this.geometry.hexes[this.robberHexId].nodes.some((nodeId) => {
      const node = this.geometry.nodes[nodeId];
      return node.owner === player.id;
    });
    if (badRobber) return true;
    const target = this.chooseRobberHex(player);
    return target !== this.robberHexId;
  }

  shouldPlayMonopoly(player) {
    const target = this.chooseBestMonopolyResource(player);
    const total = this.players.reduce((acc, other) => {
      if (other.id === player.id) return acc;
      return acc + other.resources[target];
    }, 0);
    return total >= 3;
  }

  shouldPlayYearOfPlenty(player) {
    const picks = this.chooseYearOfPlentyResources(player);
    return picks.length === 2;
  }

  shouldPlayRoadBuilding(player) {
    return this.chooseStrategicRoadEdge(player, true) != null;
  }

  tryBuildSettlement(player) {
    if (!hasResources(player.resources, COSTS.settlement)) return false;
    const candidates = this.getBuildableSettlementNodes(player);
    if (!candidates.length) return false;
    candidates.sort((a, b) => b.score - a.score);
    if (!this.placeSettlement(player, candidates[0].nodeId, false)) return false;
    payCost(player.resources, COSTS.settlement);
    this.addLog(`${player.name} built a settlement.`);
    this.recomputeScores();
    this.checkForWinner(player);
    return true;
  }

  tryBuildCity(player) {
    if (!hasResources(player.resources, COSTS.city)) return false;
    const nodeId = this.getBestCityTarget(player);
    if (nodeId == null) return false;
    if (!this.placeCity(player, nodeId, false)) return false;
    payCost(player.resources, COSTS.city);
    this.addLog(`${player.name} upgraded to a city.`);
    this.recomputeScores();
    this.checkForWinner(player);
    return true;
  }

  tryBuildRoad(player) {
    if (!hasResources(player.resources, COSTS.road)) return false;
    const edgeId = this.chooseStrategicRoadEdge(player, false);
    if (edgeId == null) return false;
    if (!this.placeRoad(player, edgeId, { free: false })) return false;
    payCost(player.resources, COSTS.road);
    this.addLog(`${player.name} built a road.`);
    this.recomputeScores();
    this.checkForWinner(player);
    return true;
  }

  tryTradeForGoal(player) {
    const goals = [COSTS.settlement, COSTS.city, COSTS.development, COSTS.road];
    for (const goal of goals) {
      if (hasResources(player.resources, goal)) continue;
      const deficits = RESOURCES.map((resource) => ({
        resource,
        need: Math.max(0, (goal[resource] || 0) - player.resources[resource]),
      }))
        .filter((entry) => entry.need > 0)
        .sort((a, b) => b.need - a.need);
      if (!deficits.length) continue;

      const wanted = deficits[0].resource;
      const incomes = this.getResourceIncomeProfile(player);
      const donors = RESOURCES.map((resource) => ({
        resource,
        rate: this.getPlayerTradeRate(player, resource),
        surplus: player.resources[resource] - (goal[resource] || 0),
        income: incomes[resource],
      }))
        .filter((entry) => entry.surplus >= entry.rate)
        .sort((a, b) => b.surplus - a.surplus || b.income - a.income);
      if (!donors.length) continue;
      this.performBankTrade(player, donors[0].resource, wanted);
      return true;
    }
    return false;
  }

  getResourceIncomeProfile(player) {
    const income = makeEmptyResources();
    [...player.settlements, ...player.cities].forEach((nodeId) => {
      const node = this.geometry.nodes[nodeId];
      const amount = node.structure === "city" ? 2 : 1;
      node.adjacentHexes.forEach((hexId) => {
        const hex = this.geometry.hexes[hexId];
        if (!hex.number || hex.resource === "desert") return;
        income[hex.resource] += (DICE_WEIGHT[hex.number] / 36) * amount;
      });
    });
    return income;
  }

  getNodeProductionScore(nodeId, player) {
    const node = this.geometry.nodes[nodeId];
    if (node.structure != null) return Number.NEGATIVE_INFINITY;
    if (node.neighbors.some((neighborId) => this.geometry.nodes[neighborId].structure != null)) {
      return Number.NEGATIVE_INFINITY;
    }

    const income = this.getResourceIncomeProfile(player);
    const resourceSeen = new Set();
    let score = 0;
    node.adjacentHexes.forEach((hexId) => {
      const hex = this.geometry.hexes[hexId];
      if (hex.resource === "desert" || !hex.number) return;
      const scarcityWeight = 1 + Math.max(0, 0.85 - income[hex.resource]) * 0.7;
      score += (DICE_WEIGHT[hex.number] / 6) * scarcityWeight;
      resourceSeen.add(hex.resource);
    });
    score += resourceSeen.size * 0.42;

    const ports = node.ports;
    if (ports.includes("any")) score += 0.4;
    if (ports.some((type) => type !== "any" && income[type] > 0.5)) score += 0.4;

    let blockValue = 0;
    node.neighbors.forEach((neighborId) => {
      const owner = this.geometry.nodes[neighborId].owner;
      if (owner != null && owner !== player.id) blockValue += 0.45;
    });
    score += blockValue;
    return score;
  }

  getBestInitialSettlementNode(player) {
    let bestNodeId = null;
    let bestScore = Number.NEGATIVE_INFINITY;
    this.geometry.nodes.forEach((node) => {
      const score = this.getNodeProductionScore(node.id, player);
      if (!Number.isFinite(score)) return;
      if (score > bestScore) {
        bestScore = score;
        bestNodeId = node.id;
      }
    });
    return bestNodeId;
  }

  getBestRoadFromNode(player, nodeId) {
    const node = this.geometry.nodes[nodeId];
    let bestEdge = null;
    let bestScore = Number.NEGATIVE_INFINITY;
    node.edgeIds.forEach((edgeId) => {
      const edge = this.geometry.edges[edgeId];
      if (edge.owner != null) return;
      const other = edge.nodes[0] === nodeId ? edge.nodes[1] : edge.nodes[0];
      if (this.geometry.nodes[other].structure != null) return;
      const score = this.getNodeProductionScore(other, player);
      if (score > bestScore) {
        bestScore = score;
        bestEdge = edgeId;
      }
    });
    return bestEdge;
  }

  getBuildableSettlementNodes(player) {
    const result = [];
    this.geometry.nodes.forEach((node) => {
      if (!this.canBuildSettlement(player, node.id, false)) return;
      result.push({ nodeId: node.id, score: this.getNodeProductionScore(node.id, player) });
    });
    return result;
  }

  getBestCityTarget(player) {
    let best = null;
    let bestScore = Number.NEGATIVE_INFINITY;
    player.settlements.forEach((nodeId) => {
      let score = 0;
      this.geometry.nodes[nodeId].adjacentHexes.forEach((hexId) => {
        const hex = this.geometry.hexes[hexId];
        if (!hex.number || hex.resource === "desert") return;
        score += DICE_WEIGHT[hex.number] / 6;
      });
      if (score > bestScore) {
        bestScore = score;
        best = nodeId;
      }
    });
    return best;
  }

  chooseStrategicRoadEdge(player, freeBuild) {
    const targetNode = this.selectRoadExpansionTarget(player);
    if (targetNode != null) {
      const path = this.pathToNode(player, targetNode);
      if (path && path.length) {
        const candidate = path[0];
        if (this.canBuildRoad(player, candidate, { free: freeBuild })) return candidate;
      }
    }
    return this.getFallbackRoad(player, freeBuild);
  }

  selectRoadExpansionTarget(player) {
    let bestNode = null;
    let bestScore = Number.NEGATIVE_INFINITY;
    this.geometry.nodes.forEach((node) => {
      if (node.structure != null) return;
      if (node.neighbors.some((neighborId) => this.geometry.nodes[neighborId].structure != null)) return;
      const path = this.pathToNode(player, node.id);
      if (!path || !path.length) return;
      const score = this.getNodeProductionScore(node.id, player) - path.length * 0.45;
      if (score > bestScore) {
        bestScore = score;
        bestNode = node.id;
      }
    });
    return bestNode;
  }

  pathToNode(player, targetNodeId) {
    const startNodes = this.getRoadNetworkNodes(player);
    if (!startNodes.length) return null;
    const visited = new Set(startNodes);
    const queue = startNodes.map((nodeId) => ({ nodeId, newEdges: [] }));

    while (queue.length) {
      const current = queue.shift();
      if (current.nodeId === targetNodeId) return current.newEdges;
      for (const edgeId of this.geometry.nodes[current.nodeId].edgeIds) {
        const edge = this.geometry.edges[edgeId];
        if (edge.owner != null && edge.owner !== player.id) continue;
        const next = edge.nodes[0] === current.nodeId ? edge.nodes[1] : edge.nodes[0];
        if (visited.has(next)) continue;
        const nextNode = this.geometry.nodes[next];
        if (nextNode.owner != null && nextNode.owner !== player.id && next !== targetNodeId) continue;
        visited.add(next);
        queue.push({
          nodeId: next,
          newEdges: edge.owner == null ? [...current.newEdges, edgeId] : current.newEdges,
        });
      }
    }
    return null;
  }

  getRoadNetworkNodes(player) {
    const nodes = new Set();
    player.roads.forEach((edgeId) => {
      const edge = this.geometry.edges[edgeId];
      nodes.add(edge.nodes[0]);
      nodes.add(edge.nodes[1]);
    });
    player.settlements.forEach((nodeId) => nodes.add(nodeId));
    player.cities.forEach((nodeId) => nodes.add(nodeId));
    return [...nodes];
  }

  getFallbackRoad(player, freeBuild) {
    const candidates = [];
    this.geometry.edges.forEach((edge) => {
      if (!this.canBuildRoad(player, edge.id, { free: freeBuild })) return;
      const [a, b] = edge.nodes;
      const score = Math.max(this.getNodeProductionScore(a, player), this.getNodeProductionScore(b, player));
      candidates.push({ edgeId: edge.id, score });
    });
    if (!candidates.length) return null;
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0].edgeId;
  }

  computeLongestRoadLength(player) {
    if (!player.roads.size) return 0;
    const playerEdgeIds = [...player.roads];
    const incident = new Map();
    playerEdgeIds.forEach((edgeId) => {
      const edge = this.geometry.edges[edgeId];
      edge.nodes.forEach((nodeId) => {
        if (!incident.has(nodeId)) incident.set(nodeId, []);
        incident.get(nodeId).push(edgeId);
      });
    });

    const blocked = (nodeId) => {
      const owner = this.geometry.nodes[nodeId].owner;
      return owner != null && owner !== player.id;
    };

    const dfs = (nodeId, usedEdges) => {
      if (usedEdges.size > 0 && blocked(nodeId)) return 0;
      let best = 0;
      const options = incident.get(nodeId) || [];
      options.forEach((edgeId) => {
        if (usedEdges.has(edgeId)) return;
        usedEdges.add(edgeId);
        const edge = this.geometry.edges[edgeId];
        const next = edge.nodes[0] === nodeId ? edge.nodes[1] : edge.nodes[0];
        best = Math.max(best, 1 + dfs(next, usedEdges));
        usedEdges.delete(edgeId);
      });
      return best;
    };

    let longest = 0;
    incident.forEach((_, nodeId) => {
      longest = Math.max(longest, dfs(nodeId, new Set()));
    });
    return longest;
  }

  recomputeScores() {
    this.players.forEach((player) => {
      player.longestRoadLength = this.computeLongestRoadLength(player);
    });
    this.updateLongestRoadHolder();
    this.updateLargestArmyHolder();

    this.players.forEach((player, idx) => {
      const base = player.settlements.size + player.cities.size * 2 + player.devVictoryPoints;
      const roadBonus = this.longestRoadHolder === idx ? 2 : 0;
      const armyBonus = this.largestArmyHolder === idx ? 2 : 0;
      player.victoryPoints = base + roadBonus + armyBonus;
    });
  }

  updateLongestRoadHolder() {
    const lengths = this.players.map((p) => p.longestRoadLength);
    const maxLength = Math.max(...lengths);
    if (maxLength < 5) {
      this.longestRoadHolder = null;
      return;
    }
    const leaders = lengths.flatMap((length, idx) => (length === maxLength ? [idx] : []));
    if (leaders.length === 1) {
      this.longestRoadHolder = leaders[0];
      return;
    }
    if (this.longestRoadHolder != null && leaders.includes(this.longestRoadHolder)) return;
    this.longestRoadHolder = null;
  }

  updateLargestArmyHolder() {
    const sizes = this.players.map((p) => p.knightsPlayed);
    const maxSize = Math.max(...sizes);
    if (maxSize < 3) {
      this.largestArmyHolder = null;
      return;
    }
    const leaders = sizes.flatMap((size, idx) => (size === maxSize ? [idx] : []));
    if (leaders.length === 1) {
      this.largestArmyHolder = leaders[0];
      return;
    }
    if (this.largestArmyHolder != null && leaders.includes(this.largestArmyHolder)) return;
    this.largestArmyHolder = null;
  }

  checkForWinner(player) {
    if (player.victoryPoints >= WINNING_POINTS) {
      this.winner = player;
      this.phase = "game_over";
      this.addLog(`${player.name} wins with ${player.victoryPoints} VP!`);
      this.stopAutoplay();
      return true;
    }
    return false;
  }

  endTurn() {
    if (this.winner) return;
    const player = this.currentPlayer;
    DEV_CARD_TYPES.forEach((type) => {
      player.devCards[type] += player.newDevCards[type];
      player.newDevCards[type] = 0;
    });

    this.pendingAction = null;
    this.currentTurnPlayedDevCard = false;
    this.lastRoll = null;

    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    if (this.currentPlayerIndex === 0) this.turn += 1;
    this.phase = "pre_roll";

    if (this.turn > TURN_LIMIT && !this.winner) {
      const leader = this.players.reduce((best, current) =>
        current.victoryPoints > best.victoryPoints ? current : best,
      );
      this.winner = leader;
      this.phase = "game_over";
      this.addLog(`Turn limit reached. ${leader.name} wins by points.`);
      this.stopAutoplay();
    }
    this.render();
  }

  startAutoplay() {
    if (this.winner) return;
    const delay = Number(this.speedRange.value);
    this.autoplayInterval = window.setInterval(() => {
      this.autoPlayCurrentTurn();
      this.render();
    }, delay);
    this.autoplayBtn.textContent = "Stop Autoplay";
  }

  stopAutoplay() {
    if (!this.autoplayInterval) return;
    window.clearInterval(this.autoplayInterval);
    this.autoplayInterval = null;
    this.autoplayBtn.textContent = "Start Autoplay";
  }

  drawHex(hex) {
    const ctx = this.ctx;
    ctx.beginPath();
    hex.corners.forEach((corner, idx) => {
      if (idx === 0) ctx.moveTo(corner.x, corner.y);
      else ctx.lineTo(corner.x, corner.y);
    });
    ctx.closePath();
    ctx.fillStyle = RESOURCE_COLORS[hex.resource];
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = 2;
    ctx.stroke();

    if (hex.number != null) {
      ctx.beginPath();
      ctx.arc(hex.center.x, hex.center.y, 18, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(247,245,236,0.94)";
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.35)";
      ctx.stroke();
      ctx.fillStyle = hex.number === 6 || hex.number === 8 ? "#b61818" : "#19202c";
      ctx.font = "bold 16px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(hex.number), hex.center.x, hex.center.y);
    }

    if (hex.id === this.robberHexId) {
      ctx.beginPath();
      ctx.arc(hex.center.x + 21, hex.center.y - 20, 9, 0, Math.PI * 2);
      ctx.fillStyle = "#232a34";
      ctx.fill();
      ctx.strokeStyle = "#9ba2ac";
      ctx.stroke();
    }
  }

  drawPorts() {
    const ctx = this.ctx;
    this.ports.forEach((port) => {
      const edge = this.geometry.edges[port.edgeId];
      const p1 = this.geometry.nodes[edge.nodes[0]];
      const p2 = this.geometry.nodes[edge.nodes[1]];
      const mx = (p1.x + p2.x) / 2;
      const my = (p1.y + p2.y) / 2;
      const dx = mx - this.geometry.centerX;
      const dy = my - this.geometry.centerY;
      const length = Math.hypot(dx, dy) || 1;
      const ox = (dx / length) * 18;
      const oy = (dy / length) * 18;

      ctx.strokeStyle = "rgba(220,236,255,0.65)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(mx, my);
      ctx.lineTo(mx + ox, my + oy);
      ctx.stroke();

      ctx.fillStyle = "#e0ecff";
      ctx.font = "bold 11px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const label = port.type === "any" ? "3:1" : `2:1 ${RESOURCE_SHORT[port.type]}`;
      ctx.fillText(label, mx + ox * 1.65, my + oy * 1.65);
    });
  }

  drawRoads() {
    const ctx = this.ctx;
    this.geometry.edges.forEach((edge) => {
      const [a, b] = edge.nodes;
      const p1 = this.geometry.nodes[a];
      const p2 = this.geometry.nodes[b];
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      if (edge.owner == null) {
        ctx.strokeStyle = "rgba(219,230,244,0.18)";
        ctx.lineWidth = 2;
      } else {
        ctx.strokeStyle = this.players[edge.owner].color;
        ctx.lineWidth = 7;
      }
      ctx.stroke();
    });

    if (this.pendingAction === "road" && this.currentPlayer.isHuman && this.phase === "main") {
      ctx.strokeStyle = "rgba(112, 214, 255, 0.85)";
      ctx.lineWidth = 4;
      this.geometry.edges.forEach((edge) => {
        if (!this.canBuildRoad(this.currentPlayer, edge.id, { free: false })) return;
        const [a, b] = edge.nodes;
        const p1 = this.geometry.nodes[a];
        const p2 = this.geometry.nodes[b];
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      });
    }
  }

  drawStructures() {
    const ctx = this.ctx;
    this.geometry.nodes.forEach((node) => {
      if (node.owner == null || node.structure == null) return;
      const player = this.players[node.owner];
      ctx.save();
      ctx.translate(node.x, node.y);
      ctx.fillStyle = player.color;
      ctx.strokeStyle = "#111521";
      ctx.lineWidth = 1.2;
      if (node.structure === "settlement") {
        ctx.beginPath();
        ctx.moveTo(-8, 6);
        ctx.lineTo(-8, -2);
        ctx.lineTo(0, -9);
        ctx.lineTo(8, -2);
        ctx.lineTo(8, 6);
        ctx.closePath();
      } else {
        ctx.beginPath();
        ctx.rect(-9, -6, 18, 12);
        ctx.moveTo(-10, -6);
        ctx.lineTo(0, -13);
        ctx.lineTo(10, -6);
        ctx.closePath();
      }
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });

    if (!this.currentPlayer.isHuman || this.phase !== "main") return;
    if (this.pendingAction !== "settlement" && this.pendingAction !== "city") return;
    ctx.fillStyle = "rgba(112, 214, 255, 0.45)";
    this.geometry.nodes.forEach((node) => {
      const buildable =
        this.pendingAction === "settlement"
          ? this.canBuildSettlement(this.currentPlayer, node.id, false)
          : this.canBuildCity(this.currentPlayer, node.id, false);
      if (!buildable) return;
      ctx.beginPath();
      ctx.arc(node.x, node.y, 6, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  renderScoreboard() {
    this.scoreboard.innerHTML = "";
    this.players.forEach((player, idx) => {
      const card = document.createElement("div");
      card.className = "player-card";
      if (idx === this.currentPlayerIndex && !this.winner) card.classList.add("active");

      const tradeRates = RESOURCES.map((resource) => `${RESOURCE_SHORT[resource]}:${this.getPlayerTradeRate(player, resource)}`).join(" ");
      const actionCards = DEV_CARD_TYPES.map((type) => `${type}:${player.devCards[type]}`).join(" ");

      const badges = [];
      if (this.longestRoadHolder === idx) badges.push("Longest Road");
      if (this.largestArmyHolder === idx) badges.push("Largest Army");
      if (player.isHuman) badges.push("Human");

      card.innerHTML = `
        <div class="player-row">
          <span class="player-name" style="color:${player.color}">${player.name}</span>
          <span>${player.victoryPoints} VP</span>
        </div>
        <div class="resource-line">Road ${player.roads.size} · Settle ${player.settlements.size} · City ${player.cities.size}</div>
        <div class="resource-line">${resourceString(player.resources)}</div>
        <div class="resource-line">Dev VP ${player.devVictoryPoints} · Knights ${player.knightsPlayed} · LR ${player.longestRoadLength}</div>
        <div class="resource-line">Dev Cards: ${actionCards}</div>
        <div class="resource-line">Trade rates: ${tradeRates}</div>
        <div class="badge-row">${badges.map((b) => `<span class="badge">${b}</span>`).join("")}</div>
      `;
      this.scoreboard.appendChild(card);
    });
  }

  renderLog() {
    this.logContainer.innerHTML = "";
    this.logEntries.slice(-80).forEach((entry) => {
      const line = document.createElement("div");
      line.className = "log-entry";
      if (entry.includes("wins")) line.classList.add("winner");
      line.textContent = entry;
      this.logContainer.appendChild(line);
    });
    this.logContainer.scrollTop = this.logContainer.scrollHeight;
  }

  renderStatusAndControls() {
    if (this.winner) {
      this.statusText.textContent = `Winner: ${this.winner.name} at turn ${this.turn}.`;
      this.hintText.textContent = "Game over. Reset to play again.";
    } else {
      const active = this.currentPlayer;
      const phaseText = this.phase === "pre_roll" ? "Roll phase" : "Main phase";
      const rollText = this.lastRoll != null ? ` · Roll ${this.lastRoll}` : "";
      this.statusText.textContent = `Turn ${this.turn} · Active: ${active.name} · ${phaseText}${rollText}`;
      this.hintText.textContent =
        this.pendingAction != null
          ? `Selected action: ${this.pendingAction}. Click the board to place.`
          : active.isHuman
            ? "Use build/dev/trade controls during your main phase."
            : "AI turn. Use Auto Current Turn or Autoplay.";
    }

    const humanTurn = this.currentPlayer.isHuman && !this.winner;
    const mainPhase = this.phase === "main";
    const preRoll = this.phase === "pre_roll";
    const noDevPlayed = !this.currentTurnPlayedDevCard;
    const human = this.currentPlayer;

    this.nextTurnBtn.disabled = !!this.winner;
    this.rollDiceBtn.disabled = !(humanTurn && preRoll);
    this.endTurnBtn.disabled = !(humanTurn && mainPhase);
    this.buildRoadBtn.disabled = !(humanTurn && mainPhase);
    this.buildSettlementBtn.disabled = !(humanTurn && mainPhase);
    this.buildCityBtn.disabled = !(humanTurn && mainPhase);
    this.buyDevBtn.disabled = !(humanTurn && mainPhase);
    this.tradeBankBtn.disabled = !(humanTurn && mainPhase);

    this.playKnightBtn.disabled = !(humanTurn && mainPhase && noDevPlayed && human.devCards.knight > 0);
    this.playRoadBuildingBtn.disabled = !(
      humanTurn &&
      mainPhase &&
      noDevPlayed &&
      human.devCards.roadBuilding > 0
    );
    this.playYearOfPlentyBtn.disabled = !(
      humanTurn &&
      mainPhase &&
      noDevPlayed &&
      human.devCards.yearOfPlenty > 0
    );
    this.playMonopolyBtn.disabled = !(humanTurn && mainPhase && noDevPlayed && human.devCards.monopoly > 0);
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.geometry.hexes.forEach((hex) => this.drawHex(hex));
    this.drawPorts();
    this.drawRoads();
    this.drawStructures();
    this.renderScoreboard();
    this.renderLog();
    this.renderStatusAndControls();
  }
}

new ColonistFullGame();
