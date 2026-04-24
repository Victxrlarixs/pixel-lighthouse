import {
  type Agent,
  type SystemSnapshot,
  AgentRole,
  AgentState,
  SystemState,
  TileType,
} from "../core/types";
import { DATA_CENTER_MAP, MAP_COLS, MAP_ROWS } from "../renderer/map";

const FIELD_BEHAVIORS: Record<string, string[]> = {
  INITIAL: ["Patching Node 4.", "Rack humidity: 35%.", "Cabling check OK."],
  SCAN_PHASE: ["Throughput spiking.", "I/O Wait rising...", "Fan speed: 100%."],
  STABLE: ["Infrastructure stable.", "Cooling optimized.", "SSD health: 100%."],
  ALERT: ["#%&$ Node failure!", "Check fiber switch!", "Memory leak!"],
  RUNNING: ["*** CRITICAL OVERHEAT ***", "EVACUATE RACK 2!"],
};

export const LOCATIONS = {
  DESKS: [
    { x: 6, y: 5 }, { x: 7, y: 5 }, { x: 8, y: 5 }, { x: 9, y: 5 }, { x: 10, y: 5 },
    { x: 6, y: 8 }, { x: 7, y: 8 }, { x: 8, y: 8 }, { x: 9, y: 8 }, { x: 10, y: 8 },
  ],
  RACKS: [
    { x: 6, y: 2 }, { x: 7, y: 2 }, { x: 8, y: 2 }, { x: 9, y: 2 }, { x: 10, y: 2 },
    { x: 1, y: 5 }, { x: 2, y: 5 }, { x: 14, y: 5 }, { x: 15, y: 5 },
    { x: 1, y: 8 }, { x: 2, y: 8 }, { x: 14, y: 8 }, { x: 15, y: 8 },
  ],
  SERVERS: [
    { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 13, y: 2 }, { x: 14, y: 2 },
    { x: 1, y: 6 }, { x: 2, y: 6 }, { x: 14, y: 6 }, { x: 15, y: 6 },
  ],
  COFFEE: [{ x: 3, y: 11 }, { x: 13, y: 11 }],
  DOORS: [{ x: 8, y: 12 }],
};

/**
 * Checks if a tile coordinate is walkable.
 */
export function isWalkable(x: number, y: number): boolean {
  const tx = Math.floor(x);
  const ty = Math.floor(y);
  if (tx < 0 || tx >= MAP_COLS || ty < 0 || ty >= MAP_ROWS) return false;
  const tile = DATA_CENTER_MAP[ty][tx];
  return [TileType.FLOOR, TileType.CABLE_H].includes(tile);
}

/**
 * Initializes the list of simulation agents.
 */
export function createAgents(): Agent[] {
  return [
    makeAgent("lead", AgentRole.PERFORMANCE_LEAD, LOCATIONS.DESKS[0].x, LOCATIONS.DESKS[0].y, { skin: "#ffcc99", hair: "#1a1b26", body: "normal", isWoman: true }),
    makeAgent("analyst", AgentRole.SYSTEM_ANALYST, LOCATIONS.DESKS[1].x, LOCATIONS.DESKS[1].y, { skin: "#8d5524", hair: "#4d2600", body: "slim", isWoman: false }),
    makeAgent("sre", AgentRole.SRE, LOCATIONS.DESKS[2].x, LOCATIONS.DESKS[2].y, { skin: "#f1c27d", hair: "#1a1b26", body: "large", isWoman: true }),
    makeAgent("infra", AgentRole.INFRA_ENGINEER, LOCATIONS.RACKS[0].x, LOCATIONS.RACKS[0].y, { skin: "#ffcc99", hair: "#e0af68", body: "large", isWoman: false }),
    makeAgent("net", AgentRole.NETWORK_SPECIALIST, LOCATIONS.SERVERS[1].x, LOCATIONS.SERVERS[1].y, { skin: "#8d5524", hair: "#1a1b26", body: "slim", isWoman: true }),
    makeAgent("dba", AgentRole.DBA, LOCATIONS.RACKS[2].x, LOCATIONS.RACKS[2].y, { skin: "#f1c27d", hair: "#4d2600", body: "normal", isWoman: false }),
    makeAgent("fire", AgentRole.FIREFIGHTER, LOCATIONS.DOORS[0].x, LOCATIONS.DOORS[0].y, { skin: "#ffcc99", hair: "#1a1b26", body: "normal", isWoman: false }),
  ];
}

function makeAgent(id: string, role: AgentRole, x: number, y: number, physical: any): Agent {
  return {
    id, role, state: AgentState.IDLE,
    x, y, targetX: x, targetY: y, homeX: x, homeY: y,
    animationFrame: 0, direction: "up", dialogueTimer: 0,
    isSitting: true, skinColor: physical.skin, hairColor: physical.hair,
    bodyType: physical.body, isWoman: physical.isWoman,
    metadata: { taskTimer: 0 },
  };
}

export const LIGHTHOUSE_STEPS = [
  "WARMING UP CHROME...", "NAVIGATING...", "MEASURING FCP...",
  "ANALYZING LCP...", "TRACING MAIN THREAD...", "CALCULATING CLS...",
  "ESTIMATING TBT...", "GENERATING JSON...", "COMPILING SCORE...",
];

const CHAOS_DIALOGUES = ["@@@@@!!!", "####!!$#", "! ! !!", "SEGFAULT!", "OOM KILLER!", "SYSTEM HALTED!"];

let lastDialogueTime = 0;

/**
 * Updates agent behaviors and targets based on a Finite State Machine (FSM).
 */
export function updateAgents(agents: Agent[], snapshot: SystemSnapshot | null, isScanning: boolean, scanElapsed: number): void {
  const now = Date.now();
  const isChaos = snapshot?.state === SystemState.CHAOS || snapshot?.state === SystemState.FIRE;

  for (const agent of agents) {
    const meta = agent.metadata;
    const isAtTarget = Math.abs(agent.x - agent.targetX) < 0.1 && Math.abs(agent.y - agent.targetY) < 0.1;

    if (isScanning) {
      agent.state = AgentState.SCANNING;
      agent.targetX = agent.homeX;
      agent.targetY = agent.homeY;
      meta.mood = "working";
      const stepIndex = Math.min(Math.floor(scanElapsed / 1.5), LIGHTHOUSE_STEPS.length - 1);
      if (now - lastDialogueTime > 2000) {
        agent.dialogue = LIGHTHOUSE_STEPS[stepIndex];
        agent.dialogueTimer = 2;
        lastDialogueTime = now;
      }
      continue;
    }

    if (isChaos) {
      agent.state = AgentState.RUNNING;
      if (isAtTarget || Math.random() < 0.02) {
        const pool = Math.random() > 0.5 ? LOCATIONS.RACKS : LOCATIONS.SERVERS;
        const t = pool[Math.floor(Math.random() * pool.length)];
        agent.targetX = t.x;
        agent.targetY = t.y;
      }
      meta.mood = snapshot?.state === SystemState.FIRE ? "fire" : "chaos";
      if (!agent.dialogue && Math.random() < 0.05) {
        agent.dialogue = CHAOS_DIALOGUES[Math.floor(Math.random() * CHAOS_DIALOGUES.length)];
        agent.dialogueTimer = 1.5;
      }
      continue;
    }

    switch (agent.state) {
      case AgentState.IDLE:
        const roll = Math.random();
        if (roll < 0.7) {
          agent.state = AgentState.WORKING;
          const loc = Math.random() > 0.4 ? LOCATIONS.RACKS : LOCATIONS.SERVERS;
          const t = loc[Math.floor(Math.random() * loc.length)];
          agent.targetX = t.x;
          agent.targetY = t.y;
          meta.taskTimer = 5 + Math.random() * 10;
        } else {
          agent.state = AgentState.COFFEE_BREAK;
          const t = LOCATIONS.COFFEE[Math.floor(Math.random() * LOCATIONS.COFFEE.length)];
          agent.targetX = t.x;
          agent.targetY = t.y;
          meta.taskTimer = 8 + Math.random() * 8;
        }
        break;

      case AgentState.WORKING:
        meta.mood = "working";
        if (isAtTarget) {
          meta.taskTimer -= 0.016; 
          if (meta.taskTimer <= 0) agent.state = AgentState.IDLE;
        }
        break;

      case AgentState.COFFEE_BREAK:
        meta.mood = "coffee";
        if (isAtTarget) {
          meta.taskTimer -= 0.016;
          if (meta.taskTimer <= 0) agent.state = AgentState.IDLE;
        }
        break;
      
      default:
        agent.state = AgentState.IDLE;
    }

    if (!agent.dialogue && now - lastDialogueTime > 4000 && Math.random() < 0.01) {
      const pool = FIELD_BEHAVIORS[snapshot?.state || "INITIAL"];
      agent.dialogue = pool[Math.floor(Math.random() * pool.length)];
      agent.dialogueTimer = 3;
      lastDialogueTime = now;
    }
  }
}

/**
 * Handles frame-by-frame movement and physics.
 */
export function tickAgents(agents: Agent[], dt: number, isChaos: boolean = false): void {
  for (const agent of agents) {
    if (agent.dialogueTimer > 0) {
      agent.dialogueTimer -= dt;
      if (agent.dialogueTimer <= 0) agent.dialogue = undefined;
    }

    const dx = agent.targetX - agent.x;
    const dy = agent.targetY - agent.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0.05) {
      agent.isSitting = false;
      const speed = isChaos ? 3.5 : 1.6;
      const step = speed * dt;
      
      let nextX = agent.x;
      let nextY = agent.y;

      if (Math.abs(dx) > 0.01) {
        const testX = agent.x + Math.sign(dx) * Math.min(step, Math.abs(dx));
        if (isWalkable(testX, agent.y)) nextX = testX;
      }
      if (Math.abs(dy) > 0.01) {
        const testY = agent.y + Math.sign(dy) * Math.min(step, Math.abs(dy));
        if (isWalkable(nextX, testY)) nextY = testY;
      }

      agent.x = nextX;
      agent.y = nextY;
      agent.direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");
      agent.animationFrame = (agent.animationFrame + dt * 15) % 4;
    } else {
      agent.x = agent.targetX;
      agent.y = agent.targetY;
      agent.isSitting = agent.state === AgentState.WORKING || agent.state === AgentState.SCANNING;
    }
  }
}
