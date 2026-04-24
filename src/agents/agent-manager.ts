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
};export const LOCATIONS = {
  DESKS: [
    { x: 1, y: 9 }, { x: 2, y: 9 }, { x: 3, y: 9 },
    { x: 5, y: 9 }, { x: 6, y: 9 }, { x: 7, y: 9 },
    { x: 9, y: 9 }, { x: 10, y: 9 }, { x: 11, y: 9 },
    { x: 13, y: 9 }, { x: 14, y: 9 }, { x: 15, y: 9 },
  ],
  RACKS: [
    { x: 1, y: 5 }, { x: 2, y: 5 }, { x: 3, y: 5 },
    { x: 5, y: 5 }, { x: 6, y: 5 }, { x: 7, y: 5 },
    { x: 9, y: 5 }, { x: 10, y: 5 }, { x: 11, y: 5 },
    { x: 13, y: 5 }, { x: 14, y: 5 }, { x: 15, y: 5 },
  ],
  SERVERS: [
    { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 7, y: 3 }, 
    { x: 8, y: 3 }, { x: 14, y: 3 }, { x: 15, y: 3 }
  ],
  COFFEE: [{ x: 1, y: 10 }, { x: 3, y: 10 }],
  DOORS: [{ x: 8, y: 12 }],
  SOFAS: [{ x: 5, y: 10 }, { x: 6, y: 10 }, { x: 13, y: 11 }],
};

export function isWalkable(x: number, y: number): boolean {
  const tx = Math.floor(x);
  const ty = Math.floor(y);
  if (tx < 0 || tx >= MAP_COLS || ty < 0 || ty >= MAP_ROWS) return false;
  const tile = DATA_CENTER_MAP[ty][tx];
  // Strictly FLOOR or CARPET only
  return [
    TileType.FLOOR,
    TileType.CARPET,
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
    metadata: { taskTimer: 0, subState: "resting" },
  };
}

const LIGHTHOUSE_STEPS = [
  "WARMING UP CHROME INSTANCE...",
  "NAVIGATING TO TARGET URL...",
  "MEASURING FIRST CONTENTFUL PAINT...",
  "ANALYZING LARGEST CONTENTFUL PAINT...",
  "TRACING MAIN THREAD ACTIVITY...",
  "CALCULATING CUMULATIVE LAYOUT SHIFT...",
  "ESTIMATING TOTAL BLOCKING TIME...",
  "GENERATING JSON ARTIFACTS...",
  "COMPILING FINAL SCORE...",
];

const CHAOS_DIALOGUES = [
  "@@@@@!!!", "####!!$#", "! ! !!", "SEGFAULT!", 
  "OOM KILLER!", "SYSTEM HALTED!", "#$#@!#!", "STRESS 100%!"
];

let lastDialogueTime = 0;

export function updateAgents(agents: Agent[], snapshot: SystemSnapshot | null, isScanning: boolean, scanElapsed: number): void {
  const now = Date.now();
  const isChaos = snapshot?.state === SystemState.CHAOS || snapshot?.state === SystemState.FIRE;

  for (const agent of agents) {
    const meta = (agent as any).metadata;
    let phaseKey = snapshot?.state || "INITIAL";
    if (isScanning) phaseKey = "SCAN_PHASE";
    
    // --- Behavioral Choreography ---
    if (isScanning) {
      // 1. DURING AUDIT: All to desks + Lighthouse Dialogues
      if (agent.targetX !== agent.homeX || agent.targetY !== agent.homeY) {
        agent.targetX = agent.homeX;
        agent.targetY = agent.homeY;
        meta.taskTimer = 60; // Locked at desk
      }
      meta.mood = "working";
      
      // Sequential technical dialogues based on progress
      const stepIndex = Math.min(
        Math.floor(scanElapsed / 1.5), 
        LIGHTHOUSE_STEPS.length - 1
      );
      if (now - lastDialogueTime > 1500) {
        agent.dialogue = LIGHTHOUSE_STEPS[stepIndex];
        agent.dialogueTimer = 2;
        lastDialogueTime = now;
      }
      
      meta.wasScanning = true;
    } else {
      if (meta.wasScanning) {
        // 2. JUST FINISHED: All to servers/racks
        const pool = Math.random() > 0.5 ? LOCATIONS.RACKS : LOCATIONS.SERVERS;
        const target = pool[Math.floor(Math.random() * pool.length)];
        agent.targetX = target.x;
        agent.targetY = target.y;
        meta.taskTimer = 5 + Math.random() * 5; // Check for a bit
        meta.wasScanning = false;
        meta.mood = "happy";
      } else {
        // General Moods based on system health
        if (snapshot?.state === SystemState.FIRE) meta.mood = "fire";
        else if (snapshot?.state === SystemState.CHAOS) meta.mood = "chaos";
        else if (snapshot?.metrics && snapshot.metrics.performanceScore > 90) meta.mood = "happy";
        else meta.mood = agent.state === AgentState.IDLE ? "coffee" : null;
      }
    }

    // Logic for triggering dialogues
    const dialogueChance = isChaos ? 0.05 : (isScanning ? 0.03 : 0.01);
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
    agent.speed = isChaos ? 3.5 : (isScanning ? 2.5 : 1.6);
  }
}

export function tickAgents(agents: Agent[], dt: number, isChaos: boolean = false): void {
  // 1. Map of occupied tiles (where agents are OR where they are going)
  const reservedTiles = new Set<string>();
  for (const a of agents) {
    reservedTiles.add(`${Math.floor(a.x)},${Math.floor(a.y)}`);
    if (a.state === AgentState.MOVING) {
      reservedTiles.add(`${Math.floor(a.targetX)},${Math.floor(a.targetY)}`);
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

      // Habbo Logic: Only move if the NEXT tile is NOT reserved by someone else
      if (Math.abs(dx) > 0.01) {
        const testX = agent.x + Math.sign(dx) * Math.min(step, Math.abs(dx));
        const tx = Math.floor(testX);
        const ty = Math.floor(agent.y);
        const key = `${tx},${ty}`;
        const isSelfTile = tx === Math.floor(agent.x) && ty === Math.floor(agent.y);
        
        if (isWalkable(testX, agent.y) && (isSelfTile || !reservedTiles.has(key))) {
          nextX = testX;
        }
      }
      if (Math.abs(dy) > 0.01) {
        const testY = agent.y + Math.sign(dy) * Math.min(step, Math.abs(dy));
        const tx = Math.floor(nextX);
        const ty = Math.floor(testY);
        const key = `${tx},${ty}`;
        const isSelfTile = tx === Math.floor(nextX) && ty === Math.floor(agent.y);

        if (isWalkable(nextX, testY) && (isSelfTile || !reservedTiles.has(key))) {
          nextY = testY;
        }
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
      } else {
        agent.state = AgentState.IDLE;
        const moveChance = isChaos ? 0.9 : 0.4; 

        if (Math.random() < moveChance) {
          const pools = [
            LOCATIONS.RACKS, LOCATIONS.SERVERS, LOCATIONS.DESKS, 
            LOCATIONS.COFFEE, [{x: 5, y: 10}, {x: 6, y: 10}]
          ];
          const pool = pools[Math.floor(Math.random() * pools.length)];
          const t = pool[Math.floor(Math.random() * pool.length)];
          
          const targetKey = `${t.x},${t.y}`;
          // CRITICAL: Only pick target if NO ONE ELSE is there or going there
          if (!reservedTiles.has(targetKey)) {
            agent.targetX = t.x;
            agent.targetY = t.y;
            meta.taskTimer = isChaos ? 0.01 : (0.1 + Math.random() * 0.3);
            reservedTiles.add(targetKey); // Reserve it immediately
          }
        }
      }
    }
  }
}
