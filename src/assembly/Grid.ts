import {
  GridCell,
  MachineType,
  Direction,
  ShapeData,
  ColorType,
  ShapeKind,
} from '../types';
import { createShape } from './Shape';

export const GRID_SIZE = 8;

export interface HopperStats {
  throughputPerSecond: number;
  lastShapeTypes: ShapeKind[];
  averageDamage: number;
  elementalSummary: Record<ColorType, number>;
}

export class AssemblyGrid {
  public cells: GridCell[][];
  public hopperBuffer: ShapeData[] = [];
  public maxHopperBuffer: number = 30;
  private shapeHistory: { timestamp: number; shape: ShapeData }[] = [];
  public hopperPos = { x: 3, y: 7 };

  constructor() {
    this.cells = [];
    this.resetGrid();
    this.setupStarterLayout();
  }

  public resetGrid() {
    this.cells = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      const row: GridCell[] = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        row.push({
          machine: 'EMPTY',
          direction: 'UP',
          progress: 0,
          heldShape: null,
          heldShape2: null,
          tickCooldown: 0,
        });
      }
      this.cells.push(row);
    }
    // Set default Hopper at bottom center
    this.cells[this.hopperPos.y][this.hopperPos.x] = {
      machine: 'HOPPER',
      direction: 'UP',
      progress: 0,
      heldShape: null,
      tickCooldown: 0,
    };
  }

  public setupStarterLayout() {
    // A nice working starter factory:
    // Circle Emitter at (3, 2) facing DOWN
    // Belt at (3, 3) facing DOWN
    // Cutter at (3, 4) facing DOWN -> semi-circle shard
    // Red Dye Vat at (3, 5) facing DOWN -> explosive red shard
    // Belt at (3, 6) facing DOWN -> feeds directly into Hopper at (3, 7)!
    this.setMachine(3, 2, 'EMITTER_CIRCLE', 'DOWN');
    this.setMachine(3, 3, 'BELT', 'DOWN');
    this.setMachine(3, 4, 'CUTTER', 'DOWN');
    this.setMachine(3, 5, 'DYE_VAT_RED', 'DOWN');
    this.setMachine(3, 6, 'BELT', 'DOWN');
  }

  public getCell(x: number, y: number): GridCell | null {
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return null;
    return this.cells[y][x];
  }

  public setMachine(x: number, y: number, machine: MachineType, direction: Direction = 'UP') {
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return;
    if (x === this.hopperPos.x && y === this.hopperPos.y && machine !== 'HOPPER') return; // Cannot overwrite Hopper

    this.cells[y][x] = {
      machine,
      direction,
      progress: 0,
      heldShape: null,
      heldShape2: null,
      tickCooldown: 0,
    };
  }

  public rotateMachine(x: number, y: number) {
    const cell = this.getCell(x, y);
    if (!cell || cell.machine === 'EMPTY' || cell.machine === 'HOPPER') return;

    const dirs: Direction[] = ['UP', 'RIGHT', 'DOWN', 'LEFT'];
    const idx = dirs.indexOf(cell.direction);
    cell.direction = dirs[(idx + 1) % dirs.length];
  }

  public clearCell(x: number, y: number): MachineType {
    const cell = this.getCell(x, y);
    if (!cell || cell.machine === 'EMPTY' || cell.machine === 'HOPPER') return 'EMPTY';
    const oldType = cell.machine;
    cell.machine = 'EMPTY';
    cell.heldShape = null;
    cell.heldShape2 = null;
    return oldType;
  }

  public getTargetCoords(x: number, y: number, dir: Direction): { x: number; y: number } {
    switch (dir) {
      case 'UP': return { x, y: y - 1 };
      case 'DOWN': return { x, y: y + 1 };
      case 'LEFT': return { x: x - 1, y };
      case 'RIGHT': return { x: x + 1, y };
    }
  }

  // Discrete simulation tick called frequently (e.g. 10 ticks per second)
  public update(dt: number) {
    const tickRate = 2.5; // Conveyor speed cycles per second

    // Update animations and process machines
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const cell = this.cells[y][x];
        if (cell.machine === 'EMPTY') continue;

        cell.progress = (cell.progress + dt * tickRate) % 1;

        if (cell.tickCooldown > 0) {
          cell.tickCooldown -= dt;
        }

        // 1. Emitters produce shapes
        if (cell.machine.startsWith('EMITTER_')) {
          if (cell.tickCooldown <= 0 && !cell.heldShape) {
            let kind: ShapeKind = 'circle';
            if (cell.machine === 'EMITTER_SQUARE') kind = 'square';
            if (cell.machine === 'EMITTER_STAR') kind = 'star';
            if (cell.machine === 'EMITTER_TRIANGLE') kind = 'triangle';

            cell.heldShape = createShape(kind, 'raw');
            cell.tickCooldown = 1.0; // Emits every 1.0s
          }
        }
      }
    }

    // Pass shapes along conveyors / processors
    // To avoid double-advancing shapes, we scan from the target backwards or process sequentially
    for (let y = GRID_SIZE - 1; y >= 0; y--) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const cell = this.cells[y][x];
        if (!cell.heldShape) continue;

        const target = this.getTargetCoords(x, y, cell.direction);
        const targetCell = this.getCell(target.x, target.y);

        if (!targetCell) {
          // Fallen off grid boundary
          cell.heldShape = null;
          continue;
        }

        // Feed directly into Hopper!
        if (targetCell.machine === 'HOPPER') {
          this.enqueueToHopper(cell.heldShape);
          cell.heldShape = null;
          continue;
        }

        // Check if target can accept shape
        if (targetCell.heldShape === null) {
          // Machine transformation upon transfer
          let incoming = cell.heldShape;

          // CUTTER
          if (targetCell.machine === 'CUTTER') {
            if (incoming.kind === 'circle') incoming.kind = 'semi-circle';
            else if (incoming.kind === 'square') incoming.kind = 'triangle';
            else if (incoming.kind === 'star') incoming.kind = 'semi-circle';
          }
          // DYE VATS
          else if (targetCell.machine === 'DYE_VAT_RED') {
            incoming.color = 'red';
          } else if (targetCell.machine === 'DYE_VAT_BLUE') {
            incoming.color = 'blue';
          } else if (targetCell.machine === 'DYE_VAT_YELLOW') {
            incoming.color = 'yellow';
          } else if (targetCell.machine === 'DYE_VAT_GREEN') {
            incoming.color = 'green';
          } else if (targetCell.machine === 'DYE_VAT_PURPLE') {
            incoming.color = 'purple';
          }
          // OVERCLOCKER: accelerates cycle & boosts shape tier
          else if (targetCell.machine === 'OVERCLOCKER') {
            incoming.tier = Math.min(3, incoming.tier + 1);
          }
          // EXPANDER: increases tier for heavy concussive blast
          else if (targetCell.machine === 'EXPANDER') {
            incoming.tier = Math.min(3, incoming.tier + 1);
          }
          // SPLITTER: alternates direction
          else if (targetCell.machine === 'SPLITTER') {
            const dirs: Direction[] = ['UP', 'RIGHT', 'DOWN', 'LEFT'];
            const curIdx = dirs.indexOf(targetCell.direction);
            targetCell.direction = dirs[(curIdx + 1) % dirs.length];
          }

          targetCell.heldShape = incoming;
          cell.heldShape = null;
        } 
        // STACKER: can hold 2 shapes and fuse them into a compound bullet!
        else if (targetCell.machine === 'STACKER' && !targetCell.heldShape2) {
          targetCell.heldShape2 = cell.heldShape;
          // Fuse!
          const compound = createShape('compound', targetCell.heldShape.color === 'raw' ? cell.heldShape.color : targetCell.heldShape.color, 2);
          targetCell.heldShape = compound;
          targetCell.heldShape2 = null;
          cell.heldShape = null;
        }
      }
    }

    // Clean old shape history (> 5 seconds)
    const now = performance.now();
    this.shapeHistory = this.shapeHistory.filter(h => now - h.timestamp < 5000);
  }

  private enqueueToHopper(shape: ShapeData) {
    if (this.hopperBuffer.length >= this.maxHopperBuffer) {
      this.hopperBuffer.shift(); // Evict oldest to keep weapon fresh
    }
    this.hopperBuffer.push(shape);
    this.shapeHistory.push({ timestamp: performance.now(), shape });
  }

  public popNextShape(): ShapeData | null {
    if (this.hopperBuffer.length > 0) {
      return this.hopperBuffer.shift() || null;
    }
    // If hopper buffer is empty, provide default raw circle so player is never helpless
    return createShape('circle', 'raw');
  }

  public peekNextShape(): ShapeData | null {
    if (this.hopperBuffer.length > 0) {
      return this.hopperBuffer[0];
    }
    return null;
  }

  public getHopperStats(): HopperStats {
    const count = this.shapeHistory.length;
    const throughput = count > 0 ? (count / 5.0) : 0;

    const summary: Record<ColorType, number> = {
      raw: 0,
      red: 0,
      blue: 0,
      yellow: 0,
      green: 0,
      purple: 0,
    };

    let totalDmg = 0;
    const kinds: ShapeKind[] = [];

    for (const h of this.shapeHistory) {
      summary[h.shape.color]++;
      kinds.push(h.shape.kind);
      // Rough base damage estimates
      let dmg = 12;
      if (h.shape.kind === 'square') dmg = 22;
      if (h.shape.kind === 'semi-circle') dmg = 10;
      if (h.shape.kind === 'compound') dmg = 32;
      if (h.shape.color !== 'raw') dmg *= 1.3;
      totalDmg += dmg;
    }

    return {
      throughputPerSecond: parseFloat(throughput.toFixed(1)),
      lastShapeTypes: kinds.slice(-5),
      averageDamage: count > 0 ? Math.round(totalDmg / count) : 12,
      elementalSummary: summary,
    };
  }
}
