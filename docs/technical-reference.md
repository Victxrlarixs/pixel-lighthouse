# Technical Reference — Pixel Insights

## Overview

Pixel Insights is a server-side rendered Astro application that performs real Lighthouse audits and translates their results into a reactive pixel-art simulation. The architecture separates three distinct concerns: **metric acquisition** (server-side, via Lighthouse and Chrome), **state interpretation** (a finite state machine that converts raw scores into simulation states), and **visual output** (a Canvas API rendering engine with agent-based simulation).

The project has no UI framework, no component library, and no runtime DOM abstraction. All interactivity is written in vanilla TypeScript. State is managed through NanoStores atoms that connect the audit pipeline to the renderer without coupling them directly.

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Technology Stack](#2-technology-stack)
3. [Architecture Overview](#3-architecture-overview)
4. [Server Layer — Lighthouse API Route](#4-server-layer--lighthouse-api-route)
5. [Client Entry Point](#5-client-entry-point)
6. [Core — SimulationController](#6-core--simulationcontroller)
7. [State Management — NanoStores](#7-state-management--nanostores)
8. [State Machine](#8-state-machine)
9. [Agent System](#9-agent-system)
10. [Rendering Pipeline](#10-rendering-pipeline)
11. [Sound Engine](#11-sound-engine)
12. [Type System](#12-type-system)
13. [Data Flow — End to End](#13-data-flow--end-to-end)
14. [Performance Considerations](#14-performance-considerations)
15. [Extension Points](#15-extension-points)

---

## 1. Project Structure

```
pixel-insights/
├── astro.config.mjs          # Astro config — SSR + Node adapter
├── tsconfig.json             # Strict TypeScript config
├── package.json
├── src/
│   ├── pages/
│   │   ├── index.astro       # Single-page shell, all HTML structure
│   │   └── api/
│   │       └── lighthouse.ts # GET endpoint — runs Lighthouse audit
│   ├── client/
│   │   └── main.ts           # Browser entry point, DOM event wiring
│   ├── core/
│   │   ├── types.ts          # All shared enums and interfaces
│   │   ├── simulation.ts     # SimulationController — central orchestrator
│   │   ├── audio.ts          # Singleton SoundEngine export
│   │   └── sound-engine.ts   # Web Audio API wrapper
│   ├── state/
│   │   └── state-machine.ts  # Score-to-SystemState interpreter + history
│   ├── store/
│   │   └── systemStore.ts    # NanoStores atoms — global reactive state
│   ├── agents/
│   │   └── agent-manager.ts  # Agent creation, FSM behaviors, tick physics
│   ├── lighthouse/
│   │   └── lighthouse-client.ts  # Client-side fetch wrapper for /api/lighthouse
│   ├── renderer/
│   │   ├── canvas-renderer.ts    # Main CanvasRenderer class
│   │   ├── map.ts                # 17x13 tile grid definition
│   │   ├── render-constants.ts   # TILE_SIZE, STATE_COLORS, ROLE_SHIRT_COLORS
│   │   ├── tile-sprites.ts       # Floor, wall, furniture, light drawing functions
│   │   ├── agent-sprites.ts      # Agent body, dialogue, mood, miniature drawing
│   │   └── ui-sprites.ts         # Fire, smoke, metric highlights, trend graph
│   └── styles/
│       └── global.css            # All application CSS
└── public/                       # Static assets (none currently)
```

---

## 2. Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Astro 6 (SSR, Node adapter) | Page rendering, API routes, build pipeline |
| Language | TypeScript 5 (strict) | All source files |
| State | NanoStores 1.3 | Atomic reactive global state |
| Rendering | Canvas API (2D) | Pixel-art simulation engine |
| Audio | Web Audio API | Procedural sound effects |
| Audit | Lighthouse 13 + chrome-launcher 1.2 | Real performance measurement |
| Styling | Vanilla CSS | Animations, layout, theming |
| Dev tooling | Prettier + prettier-plugin-astro | Formatting |

There are no client-side routing libraries, no reactive UI frameworks, and no third-party rendering engines. Everything visual is drawn programmatically onto a single `<canvas>` element.

---

## 3. Architecture Overview

The application follows a unidirectional data flow:

```
URL input
  --> SimulationController.runScan()
    --> lighthouse-client.fetchMetrics()         [HTTP GET /api/lighthouse]
      --> API route: launches Chrome + Lighthouse [server process]
      <-- PerformanceMetrics JSON
    --> state-machine.interpret()
      --> SystemSnapshot (metrics + SystemState)
    --> NanoStores atoms updated
      --> HUD (DOM, subscribed)
      --> CanvasRenderer.render() (called by rAF loop, reads snapshot)
      --> SoundEngine (called by rAF loop, reads state)
```

The `requestAnimationFrame` loop runs continuously and independently of the audit. It renders whatever state is currently in memory. When new data arrives from an audit, it is written to the store and the renderer picks it up on the next frame — no explicit render trigger is needed.

---

## 4. Server Layer — Lighthouse API Route

**File:** `src/pages/api/lighthouse.ts`

This is an Astro API route that handles `GET /api/lighthouse?url=<target>`. It is executed server-side only, never shipped to the browser. The Astro config marks `lighthouse` and `chrome-launcher` as SSR-external to prevent them from being bundled into the client.

```typescript
// astro.config.mjs
vite: {
  ssr: {
    external: ['lighthouse', 'chrome-launcher']
  }
}
```

### Execution sequence

1. Validate that the `url` query parameter is present. Return `400` if missing.
2. Ensure `.lighthouse-profile/` exists in the project root. This is a dedicated Chrome user data directory that prevents profile collisions between concurrent runs.
3. Launch Chrome headlessly via `chromeLauncher.launch()` with `--no-sandbox` and `--disable-gpu` flags.
4. Run `lighthouse(targetUrl, options)` on the open port with `onlyCategories: ['performance']` to skip accessibility, SEO, and best-practices audits and reduce runtime.
5. Extract the six values that the simulation uses: `performanceScore`, `fcp`, `lcp`, `cls`, `tbt`, and `timestamp`.
6. Kill the Chrome instance in the `finally` block unconditionally.
7. Return the metrics object as JSON with status `200`, or an error object with status `500`.

### Concurrency note

The current implementation has no request queuing. If two audit requests arrive simultaneously, two Chrome instances will launch. This is intentional for simplicity but would need a semaphore or queue for production use.

### Metric extraction

```typescript
const metrics = {
  performanceScore: Math.round((perf?.score ?? 0) * 100),
  fcp: audits["first-contentful-paint"]?.numericValue ?? 0,
  lcp: audits["largest-contentful-paint"]?.numericValue ?? 0,
  cls: audits["cumulative-layout-shift"]?.numericValue ?? 0,
  tbt: audits["total-blocking-time"]?.numericValue ?? 0,
  timestamp: Date.now(),
  url: targetUrl,
};
```

Lighthouse returns `score` as a float in `[0, 1]`. It is multiplied by 100 and rounded. All timing metrics are in milliseconds. CLS is unitless.

---

## 5. Client Entry Point

**File:** `src/client/main.ts`

This file is loaded via `<script src="../client/main.ts">` in `index.astro`. Astro handles the TypeScript compilation and bundling. It is the only script tag in the page.

Responsibilities:

- Instantiate `SimulationController` and call `.init(canvas)` to start the render loop
- Wire all DOM event listeners (URL input, run button, night mode toggle, simulator slider, metric HUD rows, canvas mouse events)
- Subscribe to NanoStores atoms to update the HUD, progress bar, and terminal prompt reactively

### Store subscriptions in main.ts

```typescript
$systemSnapshot.subscribe((snapshot) => {
  // Shows/hides HUD and updates all metric bars and score display
});

$scanProgress.subscribe((progress) => {
  progressFill.style.width = `${progress}%`;
});

$scanStep.subscribe((step) => {
  // Updates the terminal prompt text during scanning
});
```

These subscriptions mean the DOM updates are entirely driven by store changes. The controller never touches DOM elements directly — it only updates the store.

### Metric HUD interactivity

Each `.hud-row` element gets `mouseenter`, `mouseleave`, and `click` listeners that write to `$hoveredMetric` and `$selectedMetric`. The renderer reads these stores on every frame to decide which metric highlight to draw on the canvas. This creates the bidirectional link between the DOM panel and the canvas without any shared mutable state.

### Tooltip system

Canvas mouse coordinates are forwarded to `controller.getTooltipAt()`, which applies the canvas scaling transform in reverse to convert screen pixels to canvas pixels, then to tile grid coordinates. The method checks agent bounding boxes first, then tile types, and returns a string or null.

---

## 6. Core — SimulationController

**File:** `src/core/simulation.ts`

`SimulationController` is the central class. It owns the render loop, coordinates all subsystems, and exposes a minimal public API to `main.ts`.

### Public API

| Method | Description |
|--------|-------------|
| `init(canvas)` | Sets up the renderer and starts the `requestAnimationFrame` loop |
| `runScan(url)` | Triggers a Lighthouse audit, returns `Promise<SystemSnapshot>` |
| `forceScore(score)` | Bypasses the API and directly injects a synthetic snapshot |
| `toggleNightMode(on)` | Passes night mode flag to the renderer and plays a tone |
| `getTooltipAt(x, y, rect)` | Converts screen coordinates and delegates to the renderer's hit test |
| `getSnapshot()` | Returns the current snapshot (used internally) |
| `destroy()` | Cancels the rAF loop and frees resources |

### The render loop

```typescript
private loop = (time: number) => {
  if (!this.running) return;

  let dt = (time - this.lastTime) / 1000;
  if (isNaN(dt) || dt <= 0 || dt > 0.1) dt = 0.016;  // clamp to ~60fps delta
  this.lastTime = time;
  this.tickCount++;

  // Agent behavior update (FSM decisions)
  updateAgents(this.agents, this.snapshot, this.scanning, scanElapsed);
  // Agent physics tick (movement, animation frames)
  tickAgents(this.agents, dt, this.snapshot?.state ?? null);

  // Audio intensity control
  audio.setAmbienceIntensity(...);

  // Rendering
  if (this.snapshot) {
    this.renderer.render(this.snapshot, this.agents, history);
  } else {
    this.renderer.renderIdle(this.agents, this.tickCount, this.scanning, history);
  }

  this.animFrameId = requestAnimationFrame(this.loop);
};
```

Delta time is capped at `0.1` seconds (equivalent to 10 fps) to prevent physics from tunneling through walls if the tab is backgrounded and then foregrounded.

### Scan progress simulation

During a scan, the controller does not receive progress events from Lighthouse — the audit is a single `await` with no streaming output. To give the user feedback, the controller calculates elapsed time since scan start and derives a simulated step index and progress percentage:

```typescript
const stepIndex = Math.min(Math.floor(scanElapsed / 1.5), LIGHTHOUSE_STEPS.length - 1);
const progress = Math.min(95, (scanElapsed / (LIGHTHOUSE_STEPS.length * 1.5)) * 100);
```

Progress is capped at 95% until the real result arrives, at which point it jumps to 100%.

### forceScore synthetic metrics

When the simulator slider is used, `forceScore()` constructs a `PerformanceMetrics` object with derived values based on the score:

```typescript
{
  performanceScore: score,
  fcp: 200 + (100 - score) * 50,
  lcp: 400 + (100 - score) * 100,
  cls: (100 - score) / 400,
  tbt: (100 - score) * 10,
}
```

This gives the HUD bars plausible values that scale realistically with the score.

---

## 7. State Management — NanoStores

**File:** `src/store/systemStore.ts`

All global state is stored as NanoStores atoms. NanoStores are framework-agnostic and extremely lightweight (no virtual DOM, no diffing). Each atom is an independent observable value.

```typescript
export const $performanceScore  = atom<number>(0);
export const $systemSnapshot    = atom<SystemSnapshot | null>(null);
export const $agents            = atom<Agent[]>([]);
export const $isNightMode       = atom<boolean>(false);
export const $isScanning        = atom<boolean>(false);
export const $scanProgress      = atom<number>(0);
export const $scanStep          = atom<string>("");
export const $history           = atom<number[]>([]);
export const $hoveredMetric     = atom<string | null>(null);
export const $selectedMetric    = atom<string | null>(null);
```

### Subscription pattern

DOM subscribers are set up in `main.ts` using `.subscribe()`. The renderer reads `$hoveredMetric` and `$selectedMetric` synchronously inside each frame using `.get()` — it does not subscribe, because the rAF loop already runs continuously.

```typescript
// In the render loop (canvas-renderer.ts)
const selected = $selectedMetric.get();
const hovered  = $hoveredMetric.get();
```

This distinction — `.subscribe()` for DOM, `.get()` for the render loop — keeps the renderer stateless with respect to the store.

---

## 8. State Machine

**File:** `src/state/state-machine.ts`

The state machine converts raw `PerformanceMetrics` into a `SystemSnapshot`. It contains no animation logic — only classification.

```typescript
export function interpret(metrics: PerformanceMetrics): SystemSnapshot {
  let state = SystemState.STABLE;
  const score = metrics.performanceScore;

  if (score < 20)      state = SystemState.FIRE;
  else if (score < 50) state = SystemState.CHAOS;
  else if (score < 90) state = SystemState.WARNING;

  const snapshot: SystemSnapshot = { metrics, state };

  history.push({ snapshot });
  if (history.length > 50) history.shift();

  return snapshot;
}
```

### State thresholds

| Score | SystemState |
|-------|-------------|
| >= 90 | `STABLE` |
| 50–89 | `WARNING` |
| 20–49 | `CHAOS` |
| < 20 | `FIRE` |

History is stored as a module-level array capped at 50 entries, accessible via `getHistory()`. This is used by the renderer to draw the trend graph.

---

## 9. Agent System

**File:** `src/agents/agent-manager.ts`

The agent system is the most complex behavioral subsystem. It implements a hybrid of a finite state machine (for decision-making) and simple Newtonian physics (for movement).

### Agent roster

Seven agents are created at startup, each with a fixed role, position, skin color, hair color, and body type. Roles determine shirt color via `ROLE_SHIRT_COLORS` and influence visual accessories.

| ID | Role | Home position |
|----|------|--------------|
| lead | Performance Lead | Desk (6, 5) |
| analyst | System Analyst | Desk (7, 5) |
| sre | SRE Architect | Desk (8, 5) |
| infra | Infrastructure Specialist | Rack (6, 2) |
| net | Network Specialist | Server (2, 5) |
| dba | DBA | Rack (14, 5) |
| fire | Firefighter | Door (8, 12) |

### Agent FSM states

```
AgentState.IDLE
  --> (70% chance) WORKING  --> walk to random rack/server, work for 5-15s
  --> (30% chance) COFFEE_BREAK --> walk to coffee machine, stay 8-16s
  --> (both) return to IDLE when taskTimer reaches 0

Override states (system-wide):
  SCANNING  --> triggered when an audit is running, all agents return home
  RUNNING   --> triggered in CHAOS/FIRE, agents sprint between racks randomly
```

### Walkability check

Agent movement uses a simple tile-based walkability check:

```typescript
export function isWalkable(x: number, y: number): boolean {
  const tx = Math.floor(x);
  const ty = Math.floor(y);
  if (tx < 0 || tx >= MAP_COLS || ty < 0 || ty >= MAP_ROWS) return false;
  const tile = DATA_CENTER_MAP[ty][tx];
  return [TileType.FLOOR, TileType.CABLE_H].includes(tile);
}
```

Movement is attempted axis-by-axis: horizontal first, then vertical. If the horizontal step is blocked, only the vertical component is applied (and vice versa). This gives agents simple wall-sliding behavior without pathfinding.

### Physics tick

```typescript
export function tickAgents(agents: Agent[], dt: number, state: SystemState | null): void {
  for (const agent of agents) {
    // Dialogue timer countdown
    if (agent.dialogueTimer > 0) {
      agent.dialogueTimer -= dt;
      if (agent.dialogueTimer <= 0) agent.dialogue = undefined;
    }

    // Movement
    const dx = agent.targetX - agent.x;
    const dy = agent.targetY - agent.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0.05) {
      let speed = 1.6;
      if (state === SystemState.WARNING) speed = 2.4;
      else if (state === SystemState.CHAOS || state === SystemState.FIRE) speed = 3.5;

      // Attempt horizontal then vertical step, respecting walkability
      // Update direction and animation frame
    } else {
      agent.x = agent.targetX;
      agent.y = agent.targetY;
      agent.isSitting = agent.state === AgentState.WORKING || agent.state === AgentState.SCANNING;
    }
  }
}
```

Speed is expressed in tiles per second and scales with system severity.

### Dialogue system

Agents display floating speech bubbles via `drawDialogueBubble()`. Dialogue text is selected from `FIELD_BEHAVIORS`, a record keyed by state name:

```typescript
const FIELD_BEHAVIORS: Record<string, string[]> = {
  INITIAL:    ["Patching Node 4.", "Rack humidity: 35%.", ...],
  STABLE:     ["Infrastructure stable.", "Cooling optimized.", ...],
  WARNING:    ["High load on Node 2.", "Check latency!", ...],
  CHAOS:      ["#%&$ Node failure!", "Check fiber switch!", ...],
  FIRE:       ["*** CRITICAL OVERHEAT ***", "EVACUATE RACK 2!"],
};
```

In chaos and fire states, a separate `CHAOS_DIALOGUES` array with glitched text is used instead.

---

## 10. Rendering Pipeline

**Files:** `src/renderer/canvas-renderer.ts`, `tile-sprites.ts`, `agent-sprites.ts`, `ui-sprites.ts`

### Canvas setup

The canvas dimensions are computed from the map size and a fixed scale factor:

```typescript
this.canvas.width  = Math.floor(MAP_COLS * TILE_SIZE * this.scale);  // 17 * 48 * 1.1 = 897px
this.canvas.height = Math.floor(MAP_ROWS * TILE_SIZE * this.scale);  // 13 * 48 * 1.1 = 686px
this.ctx.imageSmoothingEnabled = false;  // Preserves pixel-art crispness
```

`TILE_SIZE` is 48 pixels. The 1.1 scale factor upscales the art slightly to fill more screen area.

### Map buffer (offscreen pre-rendering)

The static map — floors, walls, and furniture bases — is pre-rendered into an offscreen `HTMLCanvasElement` and cached. It is only re-rendered when the `SystemState` changes (which changes the wall color palette):

```typescript
private preRenderMap(state: SystemState) {
  if (!this.mapBuffer) {
    this.mapBuffer = document.createElement("canvas");
    this.mapBuffer.width  = MAP_COLS * TILE_SIZE;
    this.mapBuffer.height = MAP_ROWS * TILE_SIZE;
  }
  // Draw all floor, base, and top tiles into mapBuffer
  this.lastBufferState = state;
}
```

On each frame, the buffer is drawn with a single `ctx.drawImage(this.mapBuffer, 0, 0)` call, which is significantly cheaper than re-drawing 221 tiles individually.

### Render layer order

The main `render()` method draws in this strict order to handle depth correctly:

1. **Map buffer** — floors, walls, furniture (static, cached)
2. **CLS jitter transform** — `ctx.translate()` applied to all subsequent layers if CLS metric is active
3. **LCP weight** — oversized crate drawn above row 4 if score is below 85 or LCP is selected
4. **Agents** — drawn sorted by Y coordinate (row by row) so southern agents appear in front
5. **Tile lights** — LED indicators, monitor screens, laptop screens (animated)
6. **Fever mode overlay** — cycling hue fill at 15% opacity when score = 100
7. **Night mode overlay** — dark blue fill at 60% opacity, then re-draws tile lights with glow shadows
8. **Agent dialogues and mood icons** — drawn after all agents to always appear on top
9. **Emergency effects** — fire and smoke on server tiles in CHAOS and FIRE states
10. **Trend graph** — bottom-left corner
11. **CRT scanlines** — full-canvas pass, drawn last

### CRT scanlines

```typescript
private drawScanlines() {
  // Horizontal lines every 4px at 4% opacity
  ctx.fillStyle = "rgba(0,0,0,0.04)";
  for (let y = 0; y < this.canvas.height; y += 4)
    ctx.fillRect(0, y, this.canvas.width, 2);

  // Radial vignette
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, this.canvas.width);
  g.addColorStop(0, "transparent");
  g.addColorStop(1, "rgba(0,0,0,0.2)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
}
```

This runs every frame and adds a subtle CRT monitor aesthetic without requiring post-processing shaders.

### Metric visual representations

Each metric is physically represented in the scene:

| Metric | Visual representation |
|--------|----------------------|
| LCP | `drawLCPWeight()` — a heavy labeled box that vibrates with `Math.sin(tick * 0.5) * severity * 5` amplitude |
| FCP | `drawMetricHighlight()` — animated dashed border with shadow glow on tile (10, 2) |
| CLS | `applyCLSJitter()` — `ctx.translate()` with sinusoidal offset on the entire scene |
| TBT | Per-agent stutter — in `drawAgentBody()`, a red overlay flickers based on `tbtScore` |

### Hit testing

```typescript
getHitTarget(cx: number, cy: number, agents: Agent[]): string | null {
  const x = cx / this.scale;
  const y = cy / this.scale;

  // Check agent bounding boxes first
  for (const agent of agents) {
    const ax = agent.x * TILE_SIZE;
    const ay = agent.y * TILE_SIZE;
    if (x >= ax && x < ax + TILE_SIZE && y >= ay - TILE_SIZE/2 && y < ay + TILE_SIZE) {
      return `[AGENT]\nROLE: ${agent.role}\nSTATE: ${agent.state}`;
    }
  }

  // Check tile type
  const col = Math.floor(x / TILE_SIZE);
  const row = Math.floor(y / TILE_SIZE);
  const tile = DATA_CENTER_MAP[row][col];
  // Return string based on TileType
}
```

The canvas is scaled by 1.1 in the transform, but the DOM reports mouse coordinates relative to the CSS layout. The `getTooltipAt()` method in `SimulationController` accounts for the additional CSS object-fit scaling by computing `scaleX` and `scaleY` from the canvas element's `getBoundingClientRect()`.

### Tile sprite system

Tiles are drawn in three passes, each a separate function call:

- `drawFloor()` — checkerboard fill (`floor1`/`floor2` from `STATE_COLORS`) and cable tiles
- `drawTileBase()` — furniture and equipment bodies (server chassis, desk surfaces, chair seats)
- `drawTileTop()` — tops of 3D objects (server rack tops, monitor screens, wall faces)
- `drawTileLights()` — animated LEDs, monitor glow, laptop screens

The three-pass approach allows agent sprites (drawn between passes two and three of the agent row) to appear behind furniture tops, creating a basic depth illusion without a full isometric engine.

### Agent sprite system

`drawAgentBody()` is the most complex drawing function in the project. It constructs a pixel-art human figure entirely from `fillRect` calls, with procedural animation:

- **Walk cycle** — leg Y offset driven by `Math.sin(walkPhase)`, alternating per leg
- **Idle sway** — body Y driven by `Math.sin(tick * 0.1) * 2`
- **Arm swing** — arm Y offset driven by `Math.sin(walkPhase)`, opposing the legs
- **Shadow** — ellipse drawn below the agent, sized based on sitting/standing state
- **TBT stutter** — a red overlay rectangle flickers at a rate proportional to `(100 - tbtScore) / 10`
- **Role accessories** — hardhat for SRE/Infrastructure, clipboard for Performance Lead, tablet for DBA

---

## 11. Sound Engine

**File:** `src/core/sound-engine.ts`

The sound engine wraps the Web Audio API with three capabilities.

### Ambience oscillator

A persistent sine oscillator at 60 Hz (the fundamental frequency of AC hum) is connected to a gain node. The gain is modulated via `setTargetAtTime` with a 0.5-second smoothing constant to prevent audible clicks:

```typescript
startAmbience() {
  this.ambienceOsc = this.ctx.createOscillator();
  this.ambienceOsc.type = "sine";
  this.ambienceOsc.frequency.value = 60;
  // ...
}

setAmbienceIntensity(intensity: number) {
  this.ambienceGain.gain.setTargetAtTime(intensity * 0.1, this.ctx.currentTime, 0.5);
}
```

Maximum gain is `0.1` (10% of full scale) to keep it subtle.

### Beep tones

`playBeep()` creates a disposable square-wave oscillator that is connected, started, and scheduled for stop in a single call. The gain uses `exponentialRampToValueAtTime` to fade out naturally:

```typescript
playBeep(freq: number, duration: number) {
  const osc  = this.ctx.createOscillator();
  const gain = this.ctx.createGain();
  osc.type = "square";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(this.ctx.destination);
  osc.start();
  osc.stop(this.ctx.currentTime + duration);
}
```

Square waves are used because they sound more like retro game audio than sine waves.

### Alarm

`playAlarm()` plays two beeps with a 150ms offset between them (880 Hz then 440 Hz), creating a classic two-tone alarm pattern.

---

## 12. Type System

**File:** `src/core/types.ts`

All shared types are centralized here. Nothing in the project uses `any` outside of the Lighthouse API integration (where the `lhr` type requires runtime narrowing).

### Key enums

```typescript
enum SystemState  { STABLE, WARNING, CHAOS, FIRE }
enum AgentRole    { PERFORMANCE_LEAD, SRE, INFRA_ENGINEER, NETWORK_SPECIALIST, SYSTEM_ANALYST, DBA, FIREFIGHTER }
enum AgentState   { IDLE, WORKING, RUNNING, SCANNING, COFFEE_BREAK }
enum TileType     { FLOOR, WALL_TOP, ..., SERVER, RACK, DESK, CHAIR, PLANT, CABLE_H, MONITOR, LAPTOP, SLIDING_DOOR, SERVER_LARGE, COFFEE_MACHINE }
```

### Key interfaces

```typescript
interface PerformanceMetrics {
  performanceScore: number;
  fcp: number;
  lcp: number;
  cls: number;
  tbt: number;
  timestamp: number;
  url: string;
}

interface SystemSnapshot {
  metrics: PerformanceMetrics;
  state: SystemState;
}

interface Agent {
  id: string;
  role: AgentRole;
  state: AgentState;
  x: number; y: number;
  targetX: number; targetY: number;
  homeX: number; homeY: number;
  animationFrame: number;
  direction: "down" | "up" | "left" | "right";
  dialogue?: string;
  dialogueTimer: number;
  isSitting: boolean;
  skinColor: string;
  hairColor: string;
  bodyType: "slim" | "normal" | "large";
  isWoman: boolean;
  metadata: AgentMetadata;
}
```

---

## 13. Data Flow — End to End

This section traces the complete lifecycle of a single audit from URL submission to canvas update.

**Step 1 — User submits URL**

`main.ts` captures the click event on `btn-run` and calls `controller.runScan(url)`.

**Step 2 — Controller validates and prepares**

`runScan()` resets the current snapshot to `null`, clears agent dialogues, sets `$isScanning` to `true`, and records `scanStartTime`.

**Step 3 — Client fetch**

`lighthouse-client.fetchMetrics(url)` validates the URL format (throws `INVALID_URL` if malformed) then calls `GET /api/lighthouse?url=...`.

**Step 4 — Server audit**

The Astro API route launches Chrome, runs Lighthouse, extracts metrics, kills Chrome, and returns JSON.

**Step 5 — State interpretation**

The returned `PerformanceMetrics` object is passed to `state-machine.interpret()`, which classifies the score into a `SystemState` and produces a `SystemSnapshot`. The snapshot is added to the 50-entry history buffer.

**Step 6 — Store update**

`SimulationController` writes the snapshot to `$systemSnapshot` and the score to `$performanceScore`. `$isScanning` is set to `false`, `$scanProgress` to 100.

**Step 7 — DOM reaction**

`main.ts` subscriptions fire: the HUD becomes visible, score and metric bars update, the progress bar fills to 100%.

**Step 8 — Canvas reaction**

On the next `requestAnimationFrame`, the loop reads the new snapshot, passes it to `updateAgents()` and `tickAgents()`, then calls `this.renderer.render(snapshot, agents, history)`. The renderer reads `SystemState` to select colors, draws the map buffer if the state changed, applies metric highlights from `$hoveredMetric`/`$selectedMetric`, and draws all effects.

**Step 9 — Audio reaction**

The loop's audio block reads `snapshot.state` and calls `audio.setAmbienceIntensity()` with the appropriate level. If the state is `FIRE`, `audio.playAlarm()` is called every 120 ticks.

---

## 14. Performance Considerations

### Map buffer caching

The most important optimization. Re-drawing 221 tiles per frame at 60 fps would be approximately 13,000 fill operations per second. The offscreen buffer reduces this to a single `drawImage` call per frame. The buffer is invalidated only when `SystemState` changes, which happens at most once per audit.

### Agent render sort

Agents are drawn in Y-sorted order (row by row within the main render loop). This is O(n) over tiles rather than O(n log n) over agents, since the loop already iterates rows sequentially.

### Delta time clamping

The physics tick clamps `dt` to a maximum of 0.1 seconds. Without this, a tab that was backgrounded for several seconds and then re-focused would simulate multiple seconds of physics in a single frame, launching agents through walls.

### Audio disposal

`playBeep()` creates a new `OscillatorNode` on each call. The Web Audio API garbage-collects stopped nodes automatically, so this does not leak. The ambience oscillator is a single long-lived node.

### Canvas coordinate system

The canvas is drawn at its native pixel resolution (`MAP_COLS * TILE_SIZE * scale` logical pixels). CSS `object-fit: contain` is applied via styling to scale it to its container. This means the canvas resolution is fixed regardless of window size, which keeps rendering cost predictable.

---

## 15. Extension Points

### Adding a new metric visual

1. Add the metric key to `HIGHLIGHT_COLORS` in `render-constants.ts`
2. Implement a drawing function in `ui-sprites.ts` following the signature `(ctx, x, y, score, tick) => void`
3. Call it inside `CanvasRenderer.render()` when `hovered === 'YOUR_METRIC' || selected === 'YOUR_METRIC'`
4. Add a `.hud-row` entry in `index.astro` with the correct metric label

### Adding a new agent

1. Add a new `AgentRole` value to the enum in `types.ts`
2. Add a shirt color mapping in `ROLE_SHIRT_COLORS` in `render-constants.ts`
3. Call `makeAgent()` with the new role inside `createAgents()` in `agent-manager.ts`
4. Optionally add a visual accessory in the accessories block of `drawAgentBody()` in `agent-sprites.ts`

### Adding a new system state

1. Add the value to the `SystemState` enum in `types.ts`
2. Add a color palette entry to `STATE_COLORS` in `render-constants.ts`
3. Add a threshold condition to `state-machine.interpret()`
4. Add behavior handling in `updateAgents()` and `tickAgents()` in `agent-manager.ts`
5. Add audio behavior in the `SimulationController` loop

### Adding a new tile type

1. Add the value to the `TileType` enum in `types.ts`
2. Place the tile value in `DATA_CENTER_MAP` in `map.ts`
3. Implement drawing in the appropriate `drawTileBase()`, `drawTileTop()`, and `drawTileLights()` switch cases in `tile-sprites.ts`
4. Decide whether the tile is walkable and update the `isWalkable()` check in `agent-manager.ts` if needed
5. Add a tooltip case in `CanvasRenderer.getHitTarget()` if the tile should be inspectable

### Replacing the audit backend

The client and server are connected only through the `PerformanceMetrics` interface. To replace Lighthouse with a different audit tool (PageSpeed Insights API, WebPageTest, etc.):

1. Modify `src/pages/api/lighthouse.ts` to call the new tool and return a JSON body matching `PerformanceMetrics`
2. No other file needs to change

The client-side `lighthouse-client.ts` fetches from `/api/lighthouse` and parses whatever JSON the endpoint returns. The field names in `PerformanceMetrics` are the only contract.
