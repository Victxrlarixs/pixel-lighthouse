// ============================================================
// Agent Manager — PERFORMANCE & INFRA ROLES
// ============================================================

import {
  type Agent,
  type SystemSnapshot,
  AgentRole,
  AgentState,
  SystemState,
  TileType,
} from "../core/types";
import { DATA_CENTER_MAP, MAP_COLS, MAP_ROWS } from "../renderer/map";

const DESK_BEHAVIORS: Record<string, string[]> = {
  INITIAL: [
    "Lighthouse engine: IDLE.",
    "Monitoring CWV budget.",
    "Ready for audit run.",
  ],
  SCAN_PHASE_1: [
    "Cold start initialized.",
    "Bypassing Service Workers.",
    "Establishing HTTP/2 connection.",
  ],
  SCAN_PHASE_2: [
    "Tracing FCP...",
    "Analyzing Critical Path CSS.",
    "Measuring DOM size.",
  ],
  SCAN_PHASE_3: [
    "Largest Contentful Paint detected.",
    "Checking Image Optimizations.",
    "Evaluating script blocking.",
  ],
  SCAN_PHASE_4: [
    "Calculating Total Blocking Time.",
    "CLS stability check...",
    "Finalizing audit report.",
  ],
  STABLE: [
    "Score: 100. Core Web Vitals PASSED.",
    "P99 Latency is optimal.",
    "Bundle size under budget.",
  ],
  ALERT: [
    "$#!% LCP regression detected!",
    "Hydration mismatch?",
    "CPU throttling at 4x!",
  ],
  RUNNING: [
    "*** PRODUCTION INCIDENT ***",
    "SITE IS UNRESPONSIVE!",
    "PERFORMANCE DEGRADATION!",
  ],
};

const FIELD_BEHAVIORS: Record<string, string[]> = {
  INITIAL: ["Patching Node 4.", "Rack humidity: 35%.", "Cabling check OK."],
  SCAN_PHASE: [
    "Throughput spiking.",
    "I/O Wait rising...",
    "Server fan speed: 100%.",
  ],
  STABLE: [
    "Infrastructure is stable.",
    "Cooling system optimized.",
    "SSD health: 100%.",
  ],
  ALERT: [
    "#%&$ Node failure!",
    "Check the fiber switch!",
    "Memory leak detected!",
  ],
  RUNNING: [
    "*** CRITICAL OVERHEAT ***",
    "EVACUATE RACK 2!",
    "FIRE EXTINGUISHER READY!",
  ],
};const LOCATIONS = {
  DESKS: [
    { x: 1, y: 9 }, { x: 2, y: 9 }, { x: 3, y: 9 },
    { x: 5, y: 9 }, { x: 6, y: 9 }, { x: 7, y: 9 }
  ],
  // Targets are now one tile in front of the object
  RACKS: [
    { x: 2, y: 6 }, { x: 6, y: 6 }, { x: 10, y: 6 }, { x: 14, y: 6 }
  ],
  SERVERS: [
    { x: 2, y: 4 }, { x: 8, y: 4 }, { x: 14, y: 4 }
  ],
  DOORS: [{ x: 8, y: 12 }],
  COFFEE: [{ x: 15, y: 10 }]
};

function isWalkable(x: number, y: number): boolean {
  if (isNaN(x) || isNaN(y)) return false;
  const col = Math.floor(x);
  const row = Math.floor(y);
  if (col < 0 || col >= MAP_COLS || row < 0 || row >= MAP_ROWS) return false;
  const tile = DATA_CENTER_MAP[row][col];
  
  // Stricter walkable areas: Floor, Carpet, and interaction spots
  return [
    TileType.FLOOR,
    TileType.CARPET,
    TileType.CABLE_H,
    TileType.SLIDING_DOOR,
    TileType.CHAIR
  ].includes(tile);
}

export function createAgents(): Agent[] {
  return [
    makeAgent("lead", AgentRole.PERFORMANCE_LEAD, LOCATIONS.DESKS[0].x, LOCATIONS.DESKS[0].y, { skin: "#ffcc99", hair: "#1a1b26", body: "normal", isWoman: true }),
    makeAgent("analyst", AgentRole.SYSTEM_ANALYST, LOCATIONS.DESKS[1].x, LOCATIONS.DESKS[1].y, { skin: "#8d5524", hair: "#4d2600", body: "slim", isWoman: false }),
    makeAgent("sre", AgentRole.SRE, LOCATIONS.DESKS[4].x, LOCATIONS.DESKS[4].y, { skin: "#f1c27d", hair: "#1a1b26", body: "large", isWoman: true }),
    makeAgent("infra", AgentRole.INFRA_ENGINEER, LOCATIONS.RACKS[0].x, LOCATIONS.RACKS[0].y, { skin: "#ffcc99", hair: "#e0af68", body: "large", isWoman: false }),
    makeAgent("net", AgentRole.NETWORK_SPECIALIST, LOCATIONS.SERVERS[1].x, LOCATIONS.SERVERS[1].y, { skin: "#8d5524", hair: "#1a1b26", body: "slim", isWoman: true }),
    makeAgent("dba", AgentRole.DBA, LOCATIONS.RACKS[2].x, LOCATIONS.RACKS[2].y, { skin: "#f1c27d", hair: "#4d2600", body: "normal", isWoman: false }),
    makeAgent("fire", AgentRole.FIREFIGHTER, LOCATIONS.DOORS[0].x, LOCATIONS.DOORS[0].y, { skin: "#ffcc99", hair: "#1a1b26", body: "normal", isWoman: false }),
  ];
}

function makeAgent(id: string, role: AgentRole, x: number, y: number, physical: any): Agent {
  return {
    id, role, state: AgentState.IDLE, currentTask: "Idle",
    x, y, targetX: x, targetY: y, homeX: x, homeY: y,
    animationFrame: 0, direction: "up", speed: 1.0, dialogueTimer: 0,
    isSitting: true, skinColor: physical.skin, hairColor: physical.hair,
    bodyType: physical.body, isWoman: physical.isWoman,
    metadata: { taskTimer: 0, subState: 'resting' }
  } as any;
}

const CHAOS_DIALOGUES = [
  "@@@@@!!!", "#!$%#!!", "! ! !!", "WHY IS THIS SLOW?!",
  "OOM KILLER INBOUND!", "SEGFAULT!", "KABOOM!", "$#!%^@!!"
];

let lastDialogueTime = 0;

export function updateAgents(agents: Agent[], snapshot: SystemSnapshot | null, isScanning: boolean, scanElapsed: number): void {
  const now = Date.now();
  const isChaos = snapshot?.state === SystemState.CHAOS || snapshot?.state === SystemState.FIRE;

  for (const agent of agents) {
    let phaseKey = snapshot?.state || "INITIAL";
    if (isScanning) phaseKey = "SCAN_PHASE";
    
    // Logic for triggering dialogues (Frequent in Chaos)
    const dialogueChance = isChaos ? 0.05 : 0.01;
    if (!agent.dialogue && now - lastDialogueTime > 1500 && Math.random() < dialogueChance) {
      if (isChaos) {
        agent.dialogue = CHAOS_DIALOGUES[Math.floor(Math.random() * CHAOS_DIALOGUES.length)];
      } else {
        const pool = FIELD_BEHAVIORS[phaseKey] || FIELD_BEHAVIORS["INITIAL"];
        agent.dialogue = pool[Math.floor(Math.random() * pool.length)];
      }
      agent.dialogueTimer = isChaos ? 1.5 : 3;
      lastDialogueTime = now;
    }
    agent.speed = isChaos ? 3.5 : (isScanning ? 2.2 : 1.2);
  }
}

export function tickAgents(agents: Agent[], dt: number): void {
  const occupiedTiles = new Set<string>();
  for (const a of agents) {
    occupiedTiles.add(`${Math.floor(a.x)},${Math.floor(a.y)}`);
    if (a.state === AgentState.MOVING) {
      occupiedTiles.add(`${Math.floor(a.targetX)},${Math.floor(a.targetY)}`);
    }
  }

  for (const agent of agents) {
    const meta = (agent as any).metadata;
    if (agent.dialogueTimer > 0) {
      agent.dialogueTimer -= dt;
      if (agent.dialogueTimer <= 0) agent.dialogue = undefined;
    }

    const dx = agent.targetX - agent.x;
    const dy = agent.targetY - agent.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0.05) {
      agent.state = AgentState.MOVING;
      agent.isSitting = false;
      const step = agent.speed * dt;
      
      let nextX = agent.x;
      let nextY = agent.y;

      if (Math.abs(dx) > 0.01) {
        const testX = agent.x + Math.sign(dx) * Math.min(step, Math.abs(dx));
        const key = `${Math.floor(testX)},${Math.floor(agent.y)}`;
        if (isWalkable(testX, agent.y) && !occupiedTiles.has(key)) nextX = testX;
      }
      if (Math.abs(dy) > 0.01) {
        const testY = agent.y + Math.sign(dy) * Math.min(step, Math.abs(dy));
        const key = `${Math.floor(nextX)},${Math.floor(testY)}`;
        if (isWalkable(nextX, testY) && !occupiedTiles.has(key)) nextY = testY;
      }

      agent.x = nextX;
      agent.y = nextY;
      agent.direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");
      agent.animationFrame = (agent.animationFrame + dt * 15) % 4;
    } else {
      agent.x = agent.targetX;
      agent.y = agent.targetY;
      agent.isSitting = false;
      
      if (meta.taskTimer > 0) {
        meta.taskTimer -= dt;
        agent.state = AgentState.WORKING;
        if (agent.y < 7) agent.direction = "up";
      } else {
        agent.state = AgentState.IDLE;
        const moveChance = 0.02; // More active even in idle

        if (Math.random() < moveChance) {
          const pools = [LOCATIONS.RACKS, LOCATIONS.SERVERS, LOCATIONS.DESKS, LOCATIONS.COFFEE];
          const pool = pools[Math.floor(Math.random() * pools.length)];
          const t = pool[Math.floor(Math.random() * pool.length)];
          
          if (!occupiedTiles.has(`${t.x},${t.y}`)) {
            agent.targetX = t.x;
            agent.targetY = t.y;
            meta.taskTimer = 1 + Math.random() * 3;
          }
        }
      }
    }
  }
}
