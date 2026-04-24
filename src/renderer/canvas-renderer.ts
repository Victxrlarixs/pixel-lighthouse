import {
  type SystemSnapshot,
  type Agent,
  SystemState,
  TileType,
} from "../core/types";
import { DATA_CENTER_MAP, MAP_COLS, MAP_ROWS } from "./map";
import {
  drawFloor,
  drawTileBase,
  drawTileTop,
  drawTileLights,
} from "./tile-sprites";
import {
  drawAgentBody,
  drawAgentDialogue,
  drawAgentMood,
} from "./agent-sprites";
import {
  drawSmoke,
  drawFire,
  drawTrendGraph,
  drawMetricHighlight,
  drawLCPWeight,
  applyCLSJitter,
} from "./ui-sprites";
import { TILE_SIZE } from "./render-constants";
import { $hoveredMetric, $selectedMetric } from "../store/systemStore";

/**
 * Main rendering engine for the Pixel Insights simulation.
 */
export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private tick = 0;
  private scale = 1.1;
  public isNightMode = false;
  public isFeverMode = false;
  private mapBuffer: HTMLCanvasElement | null = null;
  private lastBufferState: SystemState | null = null;

  /**
   * Initializes the renderer with a canvas element.
   * @param canvas - The HTML canvas element to render onto.
   */
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false })!;
    this.canvas.width = Math.floor(MAP_COLS * TILE_SIZE * this.scale);
    this.canvas.height = Math.floor(MAP_ROWS * TILE_SIZE * this.scale);
    this.ctx.imageSmoothingEnabled = false;
  }

  /**
   * Toggles night mode rendering.
   * @param on - Whether night mode is enabled.
   */
  setNightMode(on: boolean) {
    this.isNightMode = on;
  }

  /**
   * Toggles fever mode (high performance state) rendering.
   * @param on - Whether fever mode is enabled.
   */
  setFeverMode(on: boolean) {
    this.isFeverMode = on;
  }

  /**
   * Pre-renders the static map into a buffer.
   * @param state - The system state for floor/wall colors.
   */
  private preRenderMap(state: SystemState) {
    if (!this.mapBuffer) {
      this.mapBuffer = document.createElement("canvas");
      this.mapBuffer.width = MAP_COLS * TILE_SIZE;
      this.mapBuffer.height = MAP_ROWS * TILE_SIZE;
    }
    const mCtx = this.mapBuffer.getContext("2d")!;
    mCtx.clearRect(0, 0, this.mapBuffer.width, this.mapBuffer.height);

    for (let row = 0; row < MAP_ROWS; row++) {
      for (let col = 0; col < MAP_COLS; col++) {
        drawFloor(mCtx, DATA_CENTER_MAP[row][col], col, row, state);
        drawTileBase(mCtx, DATA_CENTER_MAP[row][col], col, row, state, [], 0, false);
        drawTileTop(mCtx, DATA_CENTER_MAP[row][col], col, row, state, 0, false);
      }
    }
    this.lastBufferState = state;
  }

  /**
   * Main render loop for active simulation.
   * @param snapshot - Current system snapshot data.
   * @param agents - List of active agents.
   * @param history - Performance score history.
   */
  render(snapshot: SystemSnapshot, agents: Agent[], history: number[]) {
    this.tick++;
    const { ctx } = this;
    const { state } = snapshot;
    const lcpScore = snapshot.metrics.performanceScore;
    const clsScore = 100;
    const selected = $selectedMetric.get();
    const hovered = $hoveredMetric.get();

    if (this.lastBufferState !== state) {
      this.preRenderMap(state);
    }

    ctx.save();
    if (state === SystemState.FIRE)
      ctx.translate(Math.random() * 4 - 2, Math.random() * 4 - 2);
    ctx.scale(this.scale, this.scale);

    if (this.mapBuffer) {
      ctx.drawImage(this.mapBuffer, 0, 0);
    }

    ctx.save();
    if (selected === "CLS" || hovered === "CLS")
      applyCLSJitter(ctx, 40, this.tick);
    else if (clsScore < 90) applyCLSJitter(ctx, clsScore, this.tick);

    for (let row = 0; row < MAP_ROWS; row++) {
      if (row === 4 && (lcpScore < 85 || selected === "LCP" || hovered === "LCP")) {
        drawLCPWeight(ctx, 5, 4, lcpScore, this.tick);
      }

      const agentsInRow = agents.filter(a => Math.floor(a.y) === row);
      for (const agent of agentsInRow) {
        agent.metadata = { ...agent.metadata, tbtScore: snapshot.metrics.performanceScore };
        drawAgentBody(ctx, agent, state, this.tick);
      }

      for (let col = 0; col < MAP_COLS; col++) {
        drawTileLights(ctx, DATA_CENTER_MAP[row][col], col, row, state, this.tick, this.isNightMode);
      }
    }
    ctx.restore();

    if (hovered === "LCP" || selected === "LCP")
      drawMetricHighlight(ctx, "LCP", 5, 4, this.tick);
    if (hovered === "FCP" || selected === "FCP")
      drawMetricHighlight(ctx, "FCP", 10, 2, this.tick);

    if (this.isFeverMode) {
      const hue = (this.tick * 2) % 360;
      ctx.fillStyle = `hsla(${hue}, 70%, 50%, 0.15)`;
      ctx.fillRect(0, 0, MAP_COLS * TILE_SIZE, MAP_ROWS * TILE_SIZE);
    } else if (this.isNightMode) {
      ctx.fillStyle = "rgba(0, 0, 30, 0.6)";
      ctx.fillRect(0, 0, MAP_COLS * TILE_SIZE, MAP_ROWS * TILE_SIZE);

      for (let row = 0; row < MAP_ROWS; row++) {
        for (let col = 0; col < MAP_COLS; col++) {
          drawTileLights(
            ctx,
            DATA_CENTER_MAP[row][col],
            col,
            row,
            state,
            this.tick,
            true,
          );
        }
      }
    }

    for (const agent of agents) {
      drawAgentDialogue(ctx, agent, this.tick);
      drawAgentMood(ctx, agent, this.tick);
    }

    if (state === SystemState.FIRE || state === SystemState.CHAOS) {
      this.renderEmergencyEffects(state);
    }

    drawTrendGraph(ctx, 10, MAP_ROWS * TILE_SIZE - 75, history);

    ctx.restore();
    this.drawScanlines();
  }

  /**
   * Render loop for idle/waiting state.
   * @param agents - List of active agents.
   * @param tick - Animation tick.
   * @param isScanning - Whether a scan is currently running.
   * @param history - Performance score history.
   */
  renderIdle(
    agents: Agent[],
    tick: number,
    isScanning: boolean,
    history: number[],
  ) {
    this.tick = tick;
    const { ctx } = this;
    const state = SystemState.STABLE;
    if (this.lastBufferState !== state) {
      this.preRenderMap(state);
    }

    ctx.save();
    ctx.scale(this.scale, this.scale);

    if (this.mapBuffer) {
      ctx.drawImage(this.mapBuffer, 0, 0);
    }

    const sorted = [...agents].sort((a, b) => a.y - b.y);
    for (const agent of sorted) {
      drawAgentBody(ctx, agent, state, this.tick);
    }

    for (let row = 0; row < MAP_ROWS; row++) {
      for (let col = 0; col < MAP_COLS; col++) {
        drawTileLights(
          ctx,
          DATA_CENTER_MAP[row][col],
          col,
          row,
          state,
          this.tick,
          this.isNightMode,
        );
      }
    }

    if (this.isNightMode) {
      ctx.fillStyle = "rgba(0, 0, 30, 0.6)";
      ctx.fillRect(0, 0, MAP_COLS * TILE_SIZE, MAP_ROWS * TILE_SIZE);

      for (let row = 0; row < MAP_ROWS; row++) {
        for (let col = 0; col < MAP_COLS; col++) {
          drawTileLights(
            ctx,
            DATA_CENTER_MAP[row][col],
            col,
            row,
            state,
            this.tick,
            true,
          );
        }
      }
    }

    for (const agent of agents) {
      drawAgentDialogue(ctx, agent, this.tick);
      drawAgentMood(ctx, agent, this.tick);
    }

    ctx.restore();
    
    if (!isScanning && history.length > 0) {
      drawTrendGraph(ctx, 10, MAP_ROWS * TILE_SIZE - 75, history);
    }

    if (!isScanning) {
      ctx.fillStyle = "rgba(0,0,0,0.85)";
      ctx.fillRect(0, this.canvas.height / 2 - 60, this.canvas.width, 120);
      ctx.fillStyle = "#fff";
      ctx.font = '16px "Press Start 2P"';
      ctx.textAlign = "center";
      ctx.fillText(
        "AWAITING URL...",
        this.canvas.width / 2,
        this.canvas.height / 2 - 15,
      );
      ctx.font = '12px "Press Start 2P"';
      ctx.fillText(
        "ENTER TARGET TO AUDIT",
        this.canvas.width / 2,
        this.canvas.height / 2 + 25,
      );
    }

    this.drawScanlines();
  }

  private renderEmergencyEffects(state: SystemState) {
    const { ctx } = this;
    for (let row = 0; row < MAP_ROWS; row++) {
      for (let col = 0; col < MAP_COLS; col++) {
        const isServer = DATA_CENTER_MAP[row][col] === TileType.SERVER;
        if (isServer) {
          const showFire =
            state === SystemState.FIRE ||
            (state === SystemState.CHAOS && Math.random() > 0.8);
          if (showFire && Math.random() > 0.5) {
            drawFire(
              ctx,
              col * TILE_SIZE + 24,
              row * TILE_SIZE + 10,
              this.tick + col,
            );
          }
          if (Math.random() > 0.8) {
            drawSmoke(
              ctx,
              col * TILE_SIZE + 24,
              row * TILE_SIZE,
              this.tick + row,
            );
          }
        }
      }
    }
  }

  private drawScanlines() {
    const { ctx } = this;
    ctx.fillStyle = "rgba(0,0,0,0.04)";
    for (let y = 0; y < this.canvas.height; y += 4)
      ctx.fillRect(0, y, this.canvas.width, 2);
    const g = ctx.createRadialGradient(
      this.canvas.width / 2,
      this.canvas.height / 2,
      0,
      this.canvas.width / 2,
      this.canvas.height / 2,
      this.canvas.width,
    );
    g.addColorStop(0, "transparent");
    g.addColorStop(1, "rgba(0,0,0,0.2)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
