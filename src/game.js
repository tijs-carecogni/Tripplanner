const RESOURCES = ["wood", "brick", "sheep", "wheat", "ore"];
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
};

const PLAYER_COLORS = ["#f94144", "#577590", "#f9c74f", "#43aa8b"];
const PLAYER_NAMES = ["Aurora AI", "Pioneer AI", "Sage AI", "Vector AI"];

const SQRT3 = Math.sqrt(3);
const BOARD_RADIUS = 2;
const WINNING_POINTS = 10;

function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function sumResources(resources) {
  return RESOURCES.reduce((acc, r) => acc + resources[r], 0);
}

function resourceString(resources) {
  return RESOURCES.map((r) => `${r.slice(0, 2)}:${resources[r]}`).join(" ");
}

function makeEmptyResources() {
  return { wood: 0, brick: 0, sheep: 0, wheat: 0, ore: 0 };
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

function pointKey(point) {
  return `${Math.round(point.x * 10) / 10},${Math.round(point.y * 10) / 10}`;
}

function edgeKey(a, b) {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

function createBoardGeometry(canvasWidth, canvasHeight) {
  const hexSize = 60;
  const centerX = canvasWidth * 0.47;
  const centerY = canvasHeight * 0.49;

  const axialHexes = createAxialHexes(BOARD_RADIUS);
  const nodeByKey = new Map();
  const nodes = [];
  const edgeByKey = new Map();
  const edges = [];
  const hexes = [];

  const createNode = (point) => {
    const key = pointKey(point);
    if (nodeByKey.has(key)) {
      return nodeByKey.get(key);
    }

    const id = nodes.length;
    const node = {
      id,
      x: point.x,
      y: point.y,
      owner: null,
      structure: null,
      adjacentHexes: [],
      edgeIds: [],
      neighbors: [],
    };
    nodes.push(node);
    nodeByKey.set(key, id);
    return id;
  };

  const createEdge = (a, b) => {
    const key = edgeKey(a, b);
    if (edgeByKey.has(key)) {
      return edgeByKey.get(key);
    }
    const id = edges.length;
    edges.push({ id, nodes: [a, b], owner: null });
    edgeByKey.set(key, id);
    nodes[a].edgeIds.push(id);
    nodes[b].edgeIds.push(id);
    return id;
  };

  for (const axial of axialHexes) {
    const center = axialToPixel(axial.q, axial.r, hexSize, centerX, centerY);
    const corners = getHexCorners(center, hexSize);
    const nodeIds = corners.map(createNode);
    const localEdges = [];
    for (let i = 0; i < 6; i += 1) {
      const edgeId = createEdge(nodeIds[i], nodeIds[(i + 1) % 6]);
      localEdges.push(edgeId);
    }
    const hexId = hexes.length;
    nodeIds.forEach((nodeId) => nodes[nodeId].adjacentHexes.push(hexId));
    hexes.push({
      id: hexId,
      q: axial.q,
      r: axial.r,
      center,
      corners,
      nodes: nodeIds,
      edges: localEdges,
      resource: null,
      number: null,
    });
  }

  for (const edge of edges) {
    const [a, b] = edge.nodes;
    if (!nodes[a].neighbors.includes(b)) nodes[a].neighbors.push(b);
    if (!nodes[b].neighbors.includes(a)) nodes[b].neighbors.push(a);
  }

  return { hexSize, centerX, centerY, hexes, nodes, edges, edgeByKey };
}

function assignTiles(geometry) {
  const tileResources = shuffle([
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
  let tokenIndex = 0;
  let robberHexId = 0;

  geometry.hexes.forEach((hex, idx) => {
    hex.resource = tileResources[idx];
    if (hex.resource === "desert") {
      hex.number = null;
      robberHexId = idx;
    } else {
      hex.number = numbers[tokenIndex];
      tokenIndex += 1;
    }
  });

  return robberHexId;
}

function hasResources(resources, cost) {
  return Object.entries(cost).every(([type, amount]) => resources[type] >= amount);
}

function payCost(resources, cost) {
  Object.entries(cost).forEach(([type, amount]) => {
    resources[type] -= amount;
  });
}

function addResource(resources, type, amount) {
  resources[type] += amount;
}

function chooseRandomWeighted(candidates) {
  const total = candidates.reduce((acc, c) => acc + c.weight, 0);
  if (total <= 0) {
    return candidates[Math.floor(Math.random() * candidates.length)];
  }
  let value = Math.random() * total;
  for (const candidate of candidates) {
    value -= candidate.weight;
    if (value <= 0) return candidate;
  }
  return candidates[candidates.length - 1];
}

class ColonistAIGame {
  constructor() {
    this.canvas = document.querySelector("#board");
    this.ctx = this.canvas.getContext("2d");
    this.logContainer = document.querySelector("#log");
    this.scoreboard = document.querySelector("#scoreboard");
    this.statusText = document.querySelector("#statusText");
    this.nextTurnBtn = document.querySelector("#nextTurnBtn");
    this.autoplayBtn = document.querySelector("#autoplayBtn");
    this.resetBtn = document.querySelector("#resetBtn");
    this.speedRange = document.querySelector("#speedRange");

    this.autoplayInterval = null;
    this.maxLogEntries = 220;

    this.bindControls();
    this.resetGame();
  }

  bindControls() {
    this.nextTurnBtn.addEventListener("click", () => {
      this.executeTurn();
    });

    this.autoplayBtn.addEventListener("click", () => {
      if (this.autoplayInterval) {
        this.stopAutoplay();
      } else {
        this.startAutoplay();
      }
    });

    this.speedRange.addEventListener("input", () => {
      if (this.autoplayInterval) {
        this.stopAutoplay();
        this.startAutoplay();
      }
    });

    this.resetBtn.addEventListener("click", () => {
      this.stopAutoplay();
      this.resetGame();
    });
  }

  resetGame() {
    this.geometry = createBoardGeometry(this.canvas.width, this.canvas.height);
    this.robberHexId = assignTiles(this.geometry);
    this.turn = 1;
    this.currentPlayerIndex = 0;
    this.winner = null;
    this.turnLimit = 400;
    this.logEntries = [];

    this.players = PLAYER_NAMES.map((name, id) => ({
      id,
      name,
      color: PLAYER_COLORS[id % PLAYER_COLORS.length],
      resources: makeEmptyResources(),
      roads: new Set(),
      settlements: new Set(),
      cities: new Set(),
      victoryPoints: 0,
    }));

    this.initialPlacement();
    this.recomputeScores();
    this.addLog("Game initialized. Strategic AI opponents are ready.");
    this.render();
  }

  initialPlacement() {
    const order = [0, 1, 2, 3, 3, 2, 1, 0];
    order.forEach((playerId, placementIndex) => {
      const player = this.players[playerId];
      const nodeId = this.getBestInitialSettlementNode(player);
      if (nodeId == null) return;

      this.placeSettlement(player, nodeId, true);
      const edgeId = this.getBestRoadFromNode(player, nodeId);
      if (edgeId != null) this.placeRoad(player, edgeId, true);

      if (placementIndex >= this.players.length) {
        for (const hexId of this.geometry.nodes[nodeId].adjacentHexes) {
          const hex = this.geometry.hexes[hexId];
          if (hex.resource && hex.resource !== "desert") {
            addResource(player.resources, hex.resource, 1);
          }
        }
      }
    });
    this.addLog("Initial settlements and roads placed using weighted evaluation.");
  }

  executeTurn() {
    if (this.winner) return;
    if (this.turn > this.turnLimit) {
      this.winner = this.players.reduce((best, current) =>
        current.victoryPoints > best.victoryPoints ? current : best,
      );
      this.addLog(`Turn limit reached. ${this.winner.name} leads and wins on points.`);
      this.render();
      return;
    }

    const player = this.players[this.currentPlayerIndex];
    const roll = this.rollDice();
    this.addLog(`Turn ${this.turn}: ${player.name} rolled ${roll}.`);

    if (roll === 7) {
      this.resolveRobber(player);
    } else {
      this.distributeResources(roll);
    }

    this.executeAiPlan(player);
    this.recomputeScores();
    if (player.victoryPoints >= WINNING_POINTS) {
      this.winner = player;
      this.addLog(`${player.name} reached ${player.victoryPoints} VP and wins!`);
      this.stopAutoplay();
    }

    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    this.turn += 1;
    this.render();
  }

  rollDice() {
    return 1 + Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6);
  }

  distributeResources(roll) {
    const gainByPlayer = this.players.map(() => makeEmptyResources());

    for (const hex of this.geometry.hexes) {
      if (hex.number !== roll || hex.id === this.robberHexId) continue;
      for (const nodeId of hex.nodes) {
        const node = this.geometry.nodes[nodeId];
        if (node.owner == null || node.structure == null) continue;
        const amount = node.structure === "city" ? 2 : 1;
        addResource(this.players[node.owner].resources, hex.resource, amount);
        addResource(gainByPlayer[node.owner], hex.resource, amount);
      }
    }

    gainByPlayer.forEach((resources, playerId) => {
      const total = sumResources(resources);
      if (total > 0) {
        this.addLog(`${this.players[playerId].name} gains ${resourceString(resources)}.`);
      }
    });
  }

  resolveRobber(currentPlayer) {
    for (const player of this.players) {
      const cardCount = sumResources(player.resources);
      if (cardCount <= 7) continue;
      const toDiscard = Math.floor(cardCount / 2);
      for (let i = 0; i < toDiscard; i += 1) {
        const candidates = RESOURCES.filter((r) => player.resources[r] > 0).map((r) => ({
          resource: r,
          weight: player.resources[r],
        }));
        if (!candidates.length) break;
        const chosen = chooseRandomWeighted(candidates).resource;
        player.resources[chosen] -= 1;
      }
      this.addLog(`${player.name} discards ${toDiscard} cards after rolling 7.`);
    }

    const robberTarget = this.chooseRobberHex(currentPlayer);
    this.robberHexId = robberTarget;
    this.addLog(`${currentPlayer.name} moved the robber to hex #${robberTarget}.`);

    const stealOptions = new Set();
    for (const nodeId of this.geometry.hexes[robberTarget].nodes) {
      const owner = this.geometry.nodes[nodeId].owner;
      if (owner != null && owner !== currentPlayer.id) {
        stealOptions.add(owner);
      }
    }
    const victims = [...stealOptions].filter((id) => sumResources(this.players[id].resources) > 0);
    if (!victims.length) return;
    const victimId = victims[Math.floor(Math.random() * victims.length)];
    const victim = this.players[victimId];
    const available = RESOURCES.filter((r) => victim.resources[r] > 0);
    const stolenType = available[Math.floor(Math.random() * available.length)];
    victim.resources[stolenType] -= 1;
    currentPlayer.resources[stolenType] += 1;
    this.addLog(`${currentPlayer.name} stole 1 ${stolenType} from ${victim.name}.`);
  }

  chooseRobberHex(currentPlayer) {
    let bestHexId = this.robberHexId;
    let bestScore = Number.NEGATIVE_INFINITY;
    for (const hex of this.geometry.hexes) {
      if (hex.id === this.robberHexId) continue;
      let score = 0;
      for (const nodeId of hex.nodes) {
        const node = this.geometry.nodes[nodeId];
        if (node.owner == null || node.structure == null) continue;
        const structureValue = node.structure === "city" ? 2.2 : 1.1;
        const numberValue = hex.number ? DICE_WEIGHT[hex.number] / 6 : 0;
        if (node.owner === currentPlayer.id) {
          score -= structureValue * numberValue;
        } else {
          score += structureValue * numberValue;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestHexId = hex.id;
      }
    }
    return bestHexId;
  }

  executeAiPlan(player) {
    let actions = 0;
    while (actions < 5) {
      if (player.victoryPoints >= WINNING_POINTS) break;
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
      const tradedForMainGoal = this.tryTradeForGoal(player);
      if (tradedForMainGoal) {
        actions += 1;
        continue;
      }
      break;
    }
  }

  tryBuildSettlement(player) {
    const candidates = this.getBuildableSettlementNodes(player);
    if (!candidates.length) return false;
    if (!hasResources(player.resources, COSTS.settlement)) return false;
    candidates.sort((a, b) => b.score - a.score);
    const targetNodeId = candidates[0].nodeId;
    this.placeSettlement(player, targetNodeId, false);
    payCost(player.resources, COSTS.settlement);
    this.addLog(`${player.name} built a settlement.`);
    return true;
  }

  tryBuildCity(player) {
    if (!hasResources(player.resources, COSTS.city)) return false;
    const target = this.getBestCityTarget(player);
    if (target == null) return false;
    this.placeCity(player, target);
    payCost(player.resources, COSTS.city);
    this.addLog(`${player.name} upgraded a settlement to a city.`);
    return true;
  }

  tryBuildRoad(player) {
    if (!hasResources(player.resources, COSTS.road)) return false;
    const edgeId = this.chooseStrategicRoadEdge(player);
    if (edgeId == null) return false;
    this.placeRoad(player, edgeId, false);
    payCost(player.resources, COSTS.road);
    this.addLog(`${player.name} built a road.`);
    return true;
  }

  tryTradeForGoal(player) {
    const goalOrder = [COSTS.settlement, COSTS.city, COSTS.road];
    for (const goalCost of goalOrder) {
      if (hasResources(player.resources, goalCost)) continue;
      const didTrade = this.tradeTowardCost(player, goalCost);
      if (didTrade) return true;
    }
    return false;
  }

  tradeTowardCost(player, goalCost) {
    const deficits = RESOURCES.map((resource) => ({
      resource,
      need: Math.max(0, (goalCost[resource] || 0) - player.resources[resource]),
    }))
      .filter((item) => item.need > 0)
      .sort((a, b) => b.need - a.need);
    if (!deficits.length) return false;

    const incomes = this.getResourceIncomeProfile(player);
    const wanted = deficits[0].resource;
    const gives = RESOURCES.map((resource) => ({
      resource,
      surplus: player.resources[resource] - (goalCost[resource] || 0),
      income: incomes[resource],
    }))
      .filter((entry) => entry.surplus >= 4)
      .sort((a, b) => b.surplus - a.surplus || b.income - a.income);

    if (!gives.length) return false;
    const give = gives[0].resource;
    player.resources[give] -= 4;
    player.resources[wanted] += 1;
    this.addLog(`${player.name} traded 4 ${give} for 1 ${wanted}.`);
    return true;
  }

  recomputeScores() {
    this.players.forEach((player) => {
      player.victoryPoints = player.settlements.size + player.cities.size * 2;
    });
  }

  getResourceIncomeProfile(player) {
    const income = makeEmptyResources();
    for (const nodeId of [...player.settlements, ...player.cities]) {
      const node = this.geometry.nodes[nodeId];
      const amount = node.structure === "city" ? 2 : 1;
      node.adjacentHexes.forEach((hexId) => {
        const hex = this.geometry.hexes[hexId];
        if (!hex.number || hex.resource === "desert") return;
        income[hex.resource] += (DICE_WEIGHT[hex.number] / 36) * amount;
      });
    }
    return income;
  }

  getNodeProductionScore(nodeId, player) {
    const node = this.geometry.nodes[nodeId];
    if (node.structure != null) return Number.NEGATIVE_INFINITY;
    if (node.neighbors.some((neighborId) => this.geometry.nodes[neighborId].structure != null)) {
      return Number.NEGATIVE_INFINITY;
    }

    const income = this.getResourceIncomeProfile(player);
    const seen = new Set();
    let score = 0;
    for (const hexId of node.adjacentHexes) {
      const hex = this.geometry.hexes[hexId];
      if (hex.resource === "desert" || !hex.number) continue;
      const scarcityWeight = 1 + Math.max(0, 0.9 - income[hex.resource]) * 0.7;
      score += (DICE_WEIGHT[hex.number] / 6) * scarcityWeight;
      seen.add(hex.resource);
    }
    score += seen.size * 0.45;

    let blockBonus = 0;
    for (const neighborId of node.neighbors) {
      const owner = this.geometry.nodes[neighborId].owner;
      if (owner != null && owner !== player.id) blockBonus += 0.55;
    }
    score += blockBonus;

    return score;
  }

  getBestInitialSettlementNode(player) {
    let bestNode = null;
    let bestScore = Number.NEGATIVE_INFINITY;
    for (const node of this.geometry.nodes) {
      const score = this.getNodeProductionScore(node.id, player);
      if (!Number.isFinite(score)) continue;
      if (score > bestScore) {
        bestScore = score;
        bestNode = node.id;
      }
    }
    return bestNode;
  }

  getBestRoadFromNode(player, nodeId) {
    const node = this.geometry.nodes[nodeId];
    let bestEdgeId = null;
    let bestScore = Number.NEGATIVE_INFINITY;
    for (const edgeId of node.edgeIds) {
      const edge = this.geometry.edges[edgeId];
      if (edge.owner != null) continue;
      const otherNodeId = edge.nodes[0] === nodeId ? edge.nodes[1] : edge.nodes[0];
      if (this.geometry.nodes[otherNodeId].structure != null) continue;
      const score = this.getNodeProductionScore(otherNodeId, player);
      if (score > bestScore) {
        bestScore = score;
        bestEdgeId = edgeId;
      }
    }
    return bestEdgeId;
  }

  getBuildableSettlementNodes(player) {
    const out = [];
    for (const node of this.geometry.nodes) {
      if (!this.canBuildSettlement(player, node.id, false)) continue;
      out.push({ nodeId: node.id, score: this.getNodeProductionScore(node.id, player) });
    }
    return out;
  }

  getBestCityTarget(player) {
    let bestNodeId = null;
    let bestScore = Number.NEGATIVE_INFINITY;
    for (const nodeId of player.settlements) {
      const node = this.geometry.nodes[nodeId];
      let score = 0;
      node.adjacentHexes.forEach((hexId) => {
        const hex = this.geometry.hexes[hexId];
        if (!hex.number || hex.resource === "desert") return;
        score += DICE_WEIGHT[hex.number] / 6;
      });
      if (score > bestScore) {
        bestScore = score;
        bestNodeId = nodeId;
      }
    }
    return bestNodeId;
  }

  chooseStrategicRoadEdge(player) {
    const targetNode = this.selectRoadExpansionTarget(player);
    if (targetNode == null) return this.getFallbackRoad(player);
    const path = this.pathToNode(player, targetNode);
    if (!path || !path.length) return this.getFallbackRoad(player);
    return path[0];
  }

  selectRoadExpansionTarget(player) {
    let bestTarget = null;
    let bestScore = Number.NEGATIVE_INFINITY;

    for (const node of this.geometry.nodes) {
      if (node.structure != null) continue;
      if (node.neighbors.some((neighborId) => this.geometry.nodes[neighborId].structure != null)) {
        continue;
      }
      const path = this.pathToNode(player, node.id);
      if (!path || !path.length) continue;
      const potential = this.getNodeProductionScore(node.id, player);
      const score = potential - path.length * 0.5;
      if (score > bestScore) {
        bestScore = score;
        bestTarget = node.id;
      }
    }
    return bestTarget;
  }

  pathToNode(player, targetNodeId) {
    const startNodes = this.getRoadNetworkNodes(player);
    if (!startNodes.length) return null;

    const visited = new Set();
    const queue = startNodes.map((nodeId) => ({ nodeId, newEdges: [] }));
    startNodes.forEach((id) => visited.add(id));

    while (queue.length) {
      const current = queue.shift();
      if (current.nodeId === targetNodeId) {
        return current.newEdges;
      }

      for (const edgeId of this.geometry.nodes[current.nodeId].edgeIds) {
        const edge = this.geometry.edges[edgeId];
        if (edge.owner != null && edge.owner !== player.id) continue;
        const nextNodeId = edge.nodes[0] === current.nodeId ? edge.nodes[1] : edge.nodes[0];
        if (visited.has(nextNodeId)) continue;
        const nextNode = this.geometry.nodes[nextNodeId];
        if (nextNode.structure != null && nextNode.owner !== player.id && nextNodeId !== targetNodeId) {
          continue;
        }
        visited.add(nextNodeId);
        queue.push({
          nodeId: nextNodeId,
          newEdges: edge.owner == null ? [...current.newEdges, edgeId] : current.newEdges,
        });
      }
    }
    return null;
  }

  getRoadNetworkNodes(player) {
    const nodes = new Set();
    for (const edgeId of player.roads) {
      const edge = this.geometry.edges[edgeId];
      nodes.add(edge.nodes[0]);
      nodes.add(edge.nodes[1]);
    }
    for (const nodeId of player.settlements) nodes.add(nodeId);
    for (const nodeId of player.cities) nodes.add(nodeId);
    return [...nodes];
  }

  getFallbackRoad(player) {
    const candidates = [];
    for (const edge of this.geometry.edges) {
      if (!this.canBuildRoad(player, edge.id, false)) continue;
      const [a, b] = edge.nodes;
      const score = Math.max(this.getNodeProductionScore(a, player), this.getNodeProductionScore(b, player));
      candidates.push({ edgeId: edge.id, score });
    }
    if (!candidates.length) return null;
    candidates.sort((x, y) => y.score - x.score);
    return candidates[0].edgeId;
  }

  canBuildRoad(player, edgeId, freeBuild = false) {
    const edge = this.geometry.edges[edgeId];
    if (edge.owner != null) return false;

    const [a, b] = edge.nodes;
    const nodeA = this.geometry.nodes[a];
    const nodeB = this.geometry.nodes[b];

    const connectedToA =
      nodeA.owner === player.id ||
      nodeA.edgeIds.some((id) => this.geometry.edges[id].owner === player.id) ||
      false;
    const connectedToB =
      nodeB.owner === player.id ||
      nodeB.edgeIds.some((id) => this.geometry.edges[id].owner === player.id) ||
      false;

    if (!connectedToA && !connectedToB) return false;
    if (!freeBuild && !hasResources(player.resources, COSTS.road)) return false;
    return true;
  }

  canBuildSettlement(player, nodeId, setup = false) {
    const node = this.geometry.nodes[nodeId];
    if (node.structure != null) return false;
    if (node.neighbors.some((neighborId) => this.geometry.nodes[neighborId].structure != null)) {
      return false;
    }

    if (!setup) {
      const hasRoad = node.edgeIds.some((edgeId) => this.geometry.edges[edgeId].owner === player.id);
      if (!hasRoad) return false;
      if (!hasResources(player.resources, COSTS.settlement)) return false;
    }
    return true;
  }

  placeRoad(player, edgeId, freeBuild) {
    if (!this.canBuildRoad(player, edgeId, freeBuild)) return false;
    this.geometry.edges[edgeId].owner = player.id;
    player.roads.add(edgeId);
    return true;
  }

  placeSettlement(player, nodeId, setup) {
    if (!this.canBuildSettlement(player, nodeId, setup)) return false;
    const node = this.geometry.nodes[nodeId];
    node.owner = player.id;
    node.structure = "settlement";
    player.settlements.add(nodeId);
    return true;
  }

  placeCity(player, nodeId) {
    const node = this.geometry.nodes[nodeId];
    if (node.owner !== player.id || node.structure !== "settlement") return false;
    node.structure = "city";
    player.settlements.delete(nodeId);
    player.cities.add(nodeId);
    return true;
  }

  startAutoplay() {
    if (this.winner) return;
    const delay = Number(this.speedRange.value);
    this.autoplayInterval = window.setInterval(() => {
      this.executeTurn();
      if (this.winner) this.stopAutoplay();
    }, delay);
    this.autoplayBtn.textContent = "Stop Autoplay";
  }

  stopAutoplay() {
    if (this.autoplayInterval) {
      window.clearInterval(this.autoplayInterval);
      this.autoplayInterval = null;
      this.autoplayBtn.textContent = "Start Autoplay";
    }
  }

  addLog(text) {
    this.logEntries.push(text);
    if (this.logEntries.length > this.maxLogEntries) {
      this.logEntries = this.logEntries.slice(this.logEntries.length - this.maxLogEntries);
    }
  }

  drawHex(hex) {
    const ctx = this.ctx;
    const corners = hex.corners;

    ctx.beginPath();
    corners.forEach((corner, index) => {
      if (index === 0) ctx.moveTo(corner.x, corner.y);
      else ctx.lineTo(corner.x, corner.y);
    });
    ctx.closePath();
    ctx.fillStyle = RESOURCE_COLORS[hex.resource] || "#888";
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.32)";
    ctx.lineWidth = 2;
    ctx.stroke();

    if (hex.number != null) {
      ctx.beginPath();
      ctx.arc(hex.center.x, hex.center.y, 18, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(246,244,233,0.92)";
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
      ctx.arc(hex.center.x + 22, hex.center.y - 20, 9, 0, Math.PI * 2);
      ctx.fillStyle = "#21252e";
      ctx.fill();
      ctx.strokeStyle = "#90939a";
      ctx.stroke();
    }
  }

  drawRoads() {
    const ctx = this.ctx;
    for (const edge of this.geometry.edges) {
      const [a, b] = edge.nodes;
      const p1 = this.geometry.nodes[a];
      const p2 = this.geometry.nodes[b];
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      if (edge.owner == null) {
        ctx.strokeStyle = "rgba(220, 231, 246, 0.20)";
        ctx.lineWidth = 2;
      } else {
        ctx.strokeStyle = this.players[edge.owner].color;
        ctx.lineWidth = 7;
      }
      ctx.stroke();
    }
  }

  drawStructures() {
    const ctx = this.ctx;
    for (const node of this.geometry.nodes) {
      if (node.owner == null || node.structure == null) continue;
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
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.rect(-9, -6, 18, 12);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-10, -6);
        ctx.lineTo(0, -13);
        ctx.lineTo(10, -6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  renderLog() {
    this.logContainer.innerHTML = "";
    const recent = this.logEntries.slice(-70);
    recent.forEach((entry) => {
      const div = document.createElement("div");
      div.className = "log-entry";
      if (this.winner && entry.includes("wins")) div.classList.add("winner");
      div.textContent = entry;
      this.logContainer.appendChild(div);
    });
    this.logContainer.scrollTop = this.logContainer.scrollHeight;
  }

  renderScoreboard() {
    this.scoreboard.innerHTML = "";
    this.players.forEach((player, idx) => {
      const card = document.createElement("div");
      card.className = "player-card";
      if (idx === this.currentPlayerIndex && !this.winner) {
        card.classList.add("active");
      }

      card.innerHTML = `
        <div class="player-row">
          <span class="player-name" style="color:${player.color}">${player.name}</span>
          <span>${player.victoryPoints} VP</span>
        </div>
        <div class="resource-line">
          Roads ${player.roads.size} · Settlements ${player.settlements.size} · Cities ${player.cities.size}
        </div>
        <div class="resource-line">${resourceString(player.resources)}</div>
      `;
      this.scoreboard.appendChild(card);
    });
  }

  renderStatus() {
    if (this.winner) {
      this.statusText.textContent = `Winner: ${this.winner.name} at turn ${this.turn - 1}.`;
      this.nextTurnBtn.disabled = true;
      return;
    }
    this.nextTurnBtn.disabled = false;
    const active = this.players[this.currentPlayerIndex];
    this.statusText.textContent = `Turn ${this.turn} · Active: ${active.name}`;
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.geometry.hexes.forEach((hex) => this.drawHex(hex));
    this.drawRoads();
    this.drawStructures();
    this.renderScoreboard();
    this.renderLog();
    this.renderStatus();
  }
}

new ColonistAIGame();
