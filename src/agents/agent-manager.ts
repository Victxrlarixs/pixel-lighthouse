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
} from '../core/types';
import { DATA_CENTER_MAP, MAP_COLS, MAP_ROWS } from '../renderer/map';

const DESK_BEHAVIORS: Record<string, string[]> = {
  INITIAL: ["Lighthouse engine: IDLE.", "Monitoring CWV budget.", "Ready for audit run."],
  SCAN_PHASE_1: ["Cold start initialized.", "Bypassing Service Workers.", "Establishing HTTP/2 connection."],
  SCAN_PHASE_2: ["Tracing FCP...", "Analyzing Critical Path CSS.", "Measuring DOM size."],
  SCAN_PHASE_3: ["Largest Contentful Paint detected.", "Checking Image Optimizations.", "Evaluating script blocking."],
  SCAN_PHASE_4: ["Calculating Total Blocking Time.", "CLS stability check...", "Finalizing audit report."],
  STABLE: ["Score: 100. Core Web Vitals PASSED.", "P99 Latency is optimal.", "Bundle size under budget."],
  ALERT: ["$#!% LCP regression detected!", "Hydration mismatch?", "CPU throttling at 4x!"],
  RUNNING: ["*** PRODUCTION INCIDENT ***", "SITE IS UNRESPONSIVE!", "PERFORMANCE DEGRADATION!"]
};

const FIELD_BEHAVIORS: Record<string, string[]> = {
  INITIAL: ["Patching Node 4.", "Rack humidity: 35%.", "Cabling check OK."],
  SCAN_PHASE: ["Throughput spiking.", "I/O Wait rising...", "Server fan speed: 100%."],
  STABLE: ["Infrastructure is stable.", "Cooling system optimized.", "SSD health: 100%."],
  ALERT: ["#%&$ Node failure!", "Check the fiber switch!", "Memory leak detected!"],
  RUNNING: ["*** CRITICAL OVERHEAT ***", "EVACUATE RACK 2!", "FIRE EXTINGUISHER READY!"]
};

const LOCATIONS = {
  DESKS: [{ x: 1, y: 9 }, { x: 2, y: 9 }, { x: 3, y: 9 }, { x: 5, y: 9 }, { x: 6, y: 9 }, { x: 7, y: 9 }],
  RACKS: [{ x: 2, y: 5 }, { x: 6, y: 5 }, { x: 10, y: 5 }, { x: 14, y: 5 }],
  SERVERS: [{ x: 2, y: 3 }, { x: 8, y: 3 }, { x: 14, y: 3 }],
  DOORS: [{ x: 8, y: 12 }]
};

function isWalkable(x: number, y: number): boolean {
  if (isNaN(x) || isNaN(y)) return false;
  const col = Math.floor(x); const row = Math.floor(y);
  if (col < 0 || col >= MAP_COLS || row < 0 || row >= MAP_ROWS) return false;
  const tile = DATA_CENTER_MAP[row][col];
  return [TileType.FLOOR, TileType.CARPET, TileType.CABLE_H, TileType.CHAIR, TileType.SLIDING_DOOR].includes(tile);
}

export function createAgents(): Agent[] {
  return [
    // Performance Experts at Desks
    makeAgent('perf-lead', AgentRole.PERFORMANCE_LEAD, LOCATIONS.DESKS[0].x, LOCATIONS.DESKS[0].y, { skin: '#ffcc99', hair: '#1a1b26', body: 'normal', isWoman: true }),
    makeAgent('analyst-1', AgentRole.SYSTEM_ANALYST, LOCATIONS.DESKS[1].x, LOCATIONS.DESKS[1].y, { skin: '#8d5524', hair: '#4d2600', body: 'slim', isWoman: false }),
    makeAgent('sre-1', AgentRole.SRE, LOCATIONS.DESKS[4].x, LOCATIONS.DESKS[4].y, { skin: '#f1c27d', hair: '#1a1b26', body: 'large', isWoman: true }),

    // Infrastructure Engineers in the Field
    makeAgent('infra-1', AgentRole.INFRA_ENGINEER, LOCATIONS.RACKS[0].x, LOCATIONS.RACKS[0].y, { skin: '#ffcc99', hair: '#e0af68', body: 'large', isWoman: false }),
    makeAgent('net-1', AgentRole.NETWORK_SPECIALIST, LOCATIONS.SERVERS[1].x, LOCATIONS.SERVERS[1].y, { skin: '#8d5524', hair: '#1a1b26', body: 'slim', isWoman: true }),
    makeAgent('dba-1', AgentRole.DBA, LOCATIONS.RACKS[2].x, LOCATIONS.RACKS[2].y, { skin: '#f1c27d', hair: '#4d2600', body: 'normal', isWoman: false }),

    // Emergency
    makeAgent('fire-1', AgentRole.FIREFIGHTER, LOCATIONS.DOORS[0].x, LOCATIONS.DOORS[0].y, { skin: '#ffcc99', hair: '#1a1b26', body: 'normal', isWoman: false }),
  ];
}

function makeAgent(id: string, role: AgentRole, x: number, y: number, physical: any): Agent {
  return {
    id, role, state: AgentState.IDLE,
    currentTask: "Maintenance", x, y, targetX: x, targetY: y, homeX: x, homeY: y,
    animationFrame: 0, direction: 'up', speed: 1.0, dialogueTimer: 0, isSitting: true,
    skinColor: physical.skin, hairColor: physical.hair, bodyType: physical.body, isWoman: physical.isWoman,
    bio: `Expert in ${role === AgentRole.PERFORMANCE_LEAD ? 'Core Web Vitals' : 'Cloud Infrastructure'}.`,
    skills: [role, 'Observability']
  };
}

let lastDialogueTime = 0;

export function updateAgents(agents: Agent[], snapshot: SystemSnapshot | null, isScanning: boolean, scanElapsed: number): void {
  const now = Date.now();
  for (const agent of agents) {
    let phaseKey: string;
    if (isScanning) {
      if (scanElapsed < 3) phaseKey = 'SCAN_PHASE_1';
      else if (scanElapsed < 8) phaseKey = 'SCAN_PHASE_2';
      else if (scanElapsed < 14) phaseKey = 'SCAN_PHASE_3';
      else phaseKey = 'SCAN_PHASE_4';
    } else if (!snapshot) {
      phaseKey = 'INITIAL';
    } else {
      phaseKey = snapshot.state;
      if (phaseKey === SystemState.FIRE && agent.role !== AgentRole.FIREFIGHTER) phaseKey = 'RUNNING';
      if (phaseKey === SystemState.CHAOS) phaseKey = 'ALERT';
    }

    const isDeskStaff = [AgentRole.PERFORMANCE_LEAD, AgentRole.SYSTEM_ANALYST, AgentRole.SRE].includes(agent.role);
    
    if (!agent.dialogue && now - lastDialogueTime > 3000) {
      if (isDeskStaff && Math.random() < 0.005) {
        const pool = DESK_BEHAVIORS[phaseKey] || DESK_BEHAVIORS['INITIAL'];
        agent.dialogue = pool[Math.floor(Math.random() * pool.length)];
        agent.dialogueTimer = 4;
        lastDialogueTime = now;
      } else if (!isDeskStaff && Math.random() < 0.002) {
        const pool = isScanning ? FIELD_BEHAVIORS['SCAN_PHASE'] : (FIELD_BEHAVIORS[phaseKey] || FIELD_BEHAVIORS['INITIAL']);
        agent.dialogue = pool[Math.floor(Math.random() * pool.length)];
        agent.dialogueTimer = 3;
        lastDialogueTime = now;
      }
    }
    agent.speed = (isScanning || phaseKey === 'ALERT' || phaseKey === 'RUNNING') ? 1.8 : 1.0;
  }
}

export function tickAgents(agents: Agent[], dt: number): void {
  for (const agent of agents) {
    if (agent.dialogueTimer > 0) {
      agent.dialogueTimer -= dt;
      if (agent.dialogueTimer <= 0) agent.dialogue = undefined;
    }

    const isDeskStaff = [AgentRole.PERFORMANCE_LEAD, AgentRole.SYSTEM_ANALYST, AgentRole.SRE].includes(agent.role);
    const dx = agent.targetX - agent.x;
    const dy = agent.targetY - agent.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0.1) {
      agent.isSitting = false;
      const step = agent.speed * dt;
      let nextX = agent.x;
      let nextY = agent.y;

      if (Math.abs(dx) > 0.01) {
        const stepX = (dx / Math.abs(dx)) * Math.min(step, Math.abs(dx));
        if (isWalkable(agent.x + stepX, agent.y)) nextX = agent.x + stepX;
      }
      
      if (Math.abs(dy) > 0.01) {
        const stepY = (dy / Math.abs(dy)) * Math.min(step, Math.abs(dy));
        if (isWalkable(nextX, agent.y + stepY)) nextY = agent.y + stepY;
      }

      agent.x = nextX;
      agent.y = nextY;
      agent.direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      agent.animationFrame = (agent.animationFrame + dt * 8) % 4;
    } else {
      agent.x = agent.targetX; agent.y = agent.targetY;
      const wasAtHome = agent.x === agent.homeX && agent.y === agent.homeY;
      if (wasAtHome && isDeskStaff) { agent.isSitting = true; agent.direction = 'up'; }
      else { agent.isSitting = false; }

      if (!isDeskStaff && Math.random() < 0.02) {
        const pools = [LOCATIONS.RACKS, LOCATIONS.SERVERS];
        const pool = pools[Math.floor(Math.random() * pools.length)];
        const target = pool[Math.floor(Math.random() * pool.length)];
        agent.targetX = target.x; agent.targetY = target.y;
      }
    }
  }
}
