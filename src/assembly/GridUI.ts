import { AssemblyGrid, GRID_SIZE } from './Grid';
import { drawShape } from './Shape';
import { MachineType, Direction, InventoryItem, PlayerStats, ScrapPerks } from '../types';
import { SoundManager } from '../audio/SoundManager';

export interface PerkDef {
  key: keyof ScrapPerks;
  name: string;
  cost: number;
  icon: string;
  effect: string;
}

export const SCRAP_PERKS_LIST: PerkDef[] = [
  { key: 'magnetShrapnel', name: 'SCRAP MAGNET & SHRAPNEL', cost: 25, icon: '🧲', effect: 'Triples vacuum range. Scrap drops launch homing shards!' },
  { key: 'conveyorTurbo', name: 'CONVEYOR TURBOCHARGER', cost: 30, icon: '⚡', effect: '+40% conveyor belt speed in grid (skyrocketing fire rate)!' },
  { key: 'reactivePlating', name: 'REACTIVE NANO-PLATING', cost: 35, icon: '🛡️', effect: '+25 Max HP & emits 360° bullet-clearing blast when hurt!' },
  { key: 'sentryBuddy', name: 'BUDDY BOT SENTRY', cost: 40, icon: '🤖', effect: 'Automated companion drone that shoots enemies & fetches loot!' },
  { key: 'superSlide', name: 'SUPER SLIDE BLAST', cost: 25, icon: '🚀', effect: 'Slide leaves fire treads and blows through enemies for 75 damage!' },
];

export class GridUI {
  public selectedMachine: MachineType | null = 'BELT';
  public selectedDirection: Direction = 'DOWN';
  public hoveredCell: { x: number; y: number } | null = null;
  public hoveredItemIndex: number = -1;
  public activeTab: 'COMPONENTS' | 'SCRAP_ARSENAL' = 'COMPONENTS';

  public isDragging: boolean = false;
  public dragMouseButton: number = 0;
  public lastDraggedCell: { x: number; y: number } | null = null;
  public showCodex: boolean = false;

  public inventory: InventoryItem[] = [
    { type: 'BELT', count: 25, name: 'Conveyor Belt', category: 'BELT', description: 'Moves shapes in facing direction' },
    { type: 'EMITTER_CIRCLE', count: 2, name: 'Circle Node', category: 'NODE', description: 'Emits smooth steel circles every 1.0s' },
    { type: 'EMITTER_SQUARE', count: 1, name: 'Square Node', category: 'NODE', description: 'Emits heavy square slugs every 1.2s' },
    { type: 'EMITTER_STAR', count: 1, name: 'Star Node', category: 'NODE', description: 'Emits razor bouncing stars every 1.2s' },
    { type: 'CUTTER', count: 2, name: 'Laser Cutter', category: 'PROCESSOR', description: 'Slices shapes into sharp piercing shards' },
    { type: 'DYE_VAT_RED', count: 1, name: 'Red Dye Vat', category: 'PROCESSOR', description: 'Infuses shapes with Explosive Thermal damage' },
    { type: 'DYE_VAT_BLUE', count: 1, name: 'Blue Dye Vat', category: 'PROCESSOR', description: 'Infuses shapes with Cryo Freeze & Slow' },
    { type: 'DYE_VAT_YELLOW', count: 1, name: 'Yellow Dye Vat', category: 'PROCESSOR', description: 'Infuses shapes with Chain Lightning shock' },
    { type: 'DYE_VAT_PURPLE', count: 1, name: 'Void Dye Vat', category: 'PROCESSOR', description: 'Infuses shapes with Gravity Singularity & Implosion' },
    { type: 'OVERCLOCKER', count: 1, name: 'Hyper Overclocker', category: 'PROCESSOR', description: 'Accelerates belt feed & upgrades shape tier (+45% DMG, +30% Speed)' },
    { type: 'EXPANDER', count: 1, name: 'Barrel Expander', category: 'PROCESSOR', description: 'Enlarges projectile size & deals massive concussive splash damage' },
    { type: 'MERGER', count: 2, name: 'Merger Funnel', category: 'PROCESSOR', description: 'Combines multiple belt streams for rapid burst fire' },
    { type: 'SPLITTER', count: 1, name: 'Splitter', category: 'PROCESSOR', description: 'Alternates shapes into dual output streams' },
    { type: 'STACKER', count: 1, name: 'Hydraulic Stacker', category: 'PROCESSOR', description: 'Stacks two shapes into a heavy compound cluster bomb' },
  ];

  constructor(private grid: AssemblyGrid, private sound: SoundManager) {}

  public addItem(type: MachineType, count: number = 1) {
    const item = this.inventory.find(i => i.type === type);
    if (item) {
      item.count += count;
    }
  }

  public handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape' && this.showCodex) {
      this.showCodex = false;
      this.sound.playRotate();
      return;
    }
    if (e.key === 'r' || e.key === 'R') {
      const dirs: Direction[] = ['UP', 'RIGHT', 'DOWN', 'LEFT'];
      const idx = dirs.indexOf(this.selectedDirection);
      this.selectedDirection = dirs[(idx + 1) % dirs.length];
      this.sound.playRotate();

      if (this.hoveredCell) {
        this.grid.rotateMachine(this.hoveredCell.x, this.hoveredCell.y);
      }
    }
    const num = parseInt(e.key);
    if (!isNaN(num) && num >= 1 && num <= this.inventory.length) {
      this.selectItem(num - 1);
    }
  }

  public selectItem(index: number) {
    if (index >= 0 && index < this.inventory.length) {
      const item = this.inventory[index];
      if (item.count > 0) {
        this.selectedMachine = item.type;
        this.sound.playPlace();
      }
    }
  }

  public handleClick(x: number, y: number, isRightClick: boolean = false, width: number, height: number, stats?: PlayerStats): 'CLOSE' | 'PERK_BOUGHT' | 'NONE' {
    return this.handleMouseDown(x, y, isRightClick, width, height, stats);
  }

  public handleMouseDown(x: number, y: number, isRightClick: boolean = false, width: number, height: number, stats?: PlayerStats): 'CLOSE' | 'PERK_BOUGHT' | 'NONE' {
    if (this.showCodex) {
      this.showCodex = false;
      this.sound.playRotate();
      return 'NONE';
    }

    const codexB = this.getCodexButtonBounds(width, height);
    if (x >= codexB.x && x <= codexB.x + codexB.width && y >= codexB.y && y <= codexB.y + codexB.height) {
      this.showCodex = true;
      this.sound.playPlace();
      return 'NONE';
    }

    const gb = this.getGridBounds(width, height);
    if (
      x >= gb.x &&
      x < gb.x + gb.width &&
      y >= gb.y &&
      y < gb.y + gb.height
    ) {
      const cellX = Math.floor((x - gb.x) / gb.cellSize);
      const cellY = Math.floor((y - gb.y) / gb.cellSize);
      this.isDragging = true;
      this.dragMouseButton = isRightClick ? 2 : 0;
      this.lastDraggedCell = { x: cellX, y: cellY };

      if (isRightClick) {
        const removed = this.grid.clearCell(cellX, cellY);
        if (removed !== 'EMPTY') {
          this.addItem(removed, 1);
          this.sound.playRotate();
        }
      } else {
        if (this.selectedMachine) {
          const invItem = this.inventory.find(i => i.type === this.selectedMachine);
          if (invItem && invItem.count > 0) {
            const old = this.grid.clearCell(cellX, cellY);
            if (old !== 'EMPTY') {
              this.addItem(old, 1);
            }
            this.grid.setMachine(cellX, cellY, this.selectedMachine, this.selectedDirection);
            invItem.count--;
            this.sound.playPlace();
          }
        }
      }
      return 'NONE';
    }

    // Toolbar tab switching & item click
    const tb = this.getToolbarBounds(width, height);
    if (x >= tb.x && x < tb.x + tb.width && y >= tb.y && y < tb.y + tb.height) {
      const tabH = 34;
      if (y >= tb.y + 6 && y <= tb.y + 6 + tabH) {
        if (x < tb.x + tb.width / 2) {
          this.activeTab = 'COMPONENTS';
          this.sound.playRotate();
        } else {
          this.activeTab = 'SCRAP_ARSENAL';
          this.sound.playRotate();
        }
        return 'NONE';
      }

      if (this.activeTab === 'COMPONENTS') {
        const itemIdx = Math.floor((y - (tb.y + 44)) / 45);
        if (itemIdx >= 0 && itemIdx < this.inventory.length) {
          this.selectItem(itemIdx);
        }
      } else if (this.activeTab === 'SCRAP_ARSENAL') {
        const perkIdx = Math.floor((y - (tb.y + 76)) / 72);
        if (perkIdx >= 0 && perkIdx < SCRAP_PERKS_LIST.length && stats) {
          const perk = SCRAP_PERKS_LIST[perkIdx];
          if (!stats.perks[perk.key] && stats.scrap >= perk.cost) {
            stats.scrap -= perk.cost;
            stats.perks[perk.key] = true;
            if (perk.key === 'reactivePlating') {
              stats.maxHp += 25;
              stats.hp += 25;
            }
            this.sound.playBuy();
            return 'PERK_BOUGHT';
          }
        }
      }
      return 'NONE';
    }

    // Close Button click
    const cb = this.getCloseButtonBounds(width, height);
    if (x >= cb.x && x <= cb.x + cb.width && y >= cb.y && y <= cb.y + cb.height) {
      this.sound.playPlace();
      return 'CLOSE';
    }

    return 'NONE';
  }

  public handleMouseUp() {
    this.isDragging = false;
    this.lastDraggedCell = null;
  }

  public handleMouseMove(x: number, y: number, width: number, height: number) {
    const gb = this.getGridBounds(width, height);
    if (
      x >= gb.x &&
      x < gb.x + gb.width &&
      y >= gb.y &&
      y < gb.y + gb.height
    ) {
      const cellX = Math.floor((x - gb.x) / gb.cellSize);
      const cellY = Math.floor((y - gb.y) / gb.cellSize);
      this.hoveredCell = { x: cellX, y: cellY };

      if (this.isDragging && this.lastDraggedCell) {
        if (this.lastDraggedCell.x !== cellX || this.lastDraggedCell.y !== cellY) {
          const dx = cellX - this.lastDraggedCell.x;
          const dy = cellY - this.lastDraggedCell.y;

          if (this.dragMouseButton === 2) {
            const removed = this.grid.clearCell(cellX, cellY);
            if (removed !== 'EMPTY') {
              this.addItem(removed, 1);
              this.sound.playRotate();
            }
          } else if (this.dragMouseButton === 0) {
            if (this.selectedMachine === 'BELT') {
              let moveDir: Direction = this.selectedDirection;
              if (dx === 1 && dy === 0) moveDir = 'RIGHT';
              else if (dx === -1 && dy === 0) moveDir = 'LEFT';
              else if (dx === 0 && dy === 1) moveDir = 'DOWN';
              else if (dx === 0 && dy === -1) moveDir = 'UP';

              const prevCell = this.grid.cells[this.lastDraggedCell.y][this.lastDraggedCell.x];
              if (prevCell && prevCell.machine === 'BELT') {
                prevCell.direction = moveDir;
              }

              const invItem = this.inventory.find(i => i.type === 'BELT');
              if (invItem && invItem.count > 0) {
                const old = this.grid.clearCell(cellX, cellY);
                if (old !== 'EMPTY') this.addItem(old, 1);
                this.grid.setMachine(cellX, cellY, 'BELT', moveDir);
                invItem.count--;
                this.selectedDirection = moveDir;
                this.sound.playPlace();
              }
            }
          }
          this.lastDraggedCell = { x: cellX, y: cellY };
        }
      }
    } else {
      this.hoveredCell = null;
    }

    const tb = this.getToolbarBounds(width, height);
    if (
      x >= tb.x &&
      x < tb.x + tb.width &&
      y >= tb.y &&
      y < tb.y + tb.height
    ) {
      this.hoveredItemIndex = Math.floor((y - tb.y) / tb.itemHeight);
    } else {
      this.hoveredItemIndex = -1;
    }
  }

  public getCodexButtonBounds(width: number, height: number) {
    const gb = this.getGridBounds(width, height);
    return {
      x: gb.x + gb.width - 210,
      y: gb.y - 48,
      width: 210,
      height: 36,
    };
  }

  public getGridBounds(width: number, height: number) {
    const totalW = 1040;
    const originX = Math.max(40, width / 2 - totalW / 2);
    const cellSize = 66;
    return {
      x: originX,
      y: Math.max(90, height * 0.15),
      cellSize,
      width: cellSize * GRID_SIZE,
      height: cellSize * GRID_SIZE,
    };
  }

  public getToolbarBounds(width: number, height: number) {
    const gb = this.getGridBounds(width, height);
    return {
      x: gb.x + gb.width + 30,
      y: gb.y,
      width: 440,
      height: gb.height,
      itemHeight: 48,
    };
  }

  public getCloseButtonBounds(width: number, height: number) {
    const gb = this.getGridBounds(width, height);
    return {
      x: gb.x,
      y: gb.y + gb.height + 95,
      width: 220,
      height: 42,
    };
  }

  public render(ctx: CanvasRenderingContext2D, width: number, height: number, stats?: PlayerStats) {
    // Dimmed cartoon backdrop
    ctx.fillStyle = 'rgba(8, 14, 26, 0.94)';
    ctx.fillRect(0, 0, width, height);

    const gb = this.getGridBounds(width, height);
    const tb = this.getToolbarBounds(width, height);

    // Title banner
    ctx.save();
    ctx.font = '900 28px Courier New, monospace';
    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeText('⚡ CARTOON INVENTOR WORKBENCH (shapez simplified)', gb.x, gb.y - 45);
    ctx.fillText('⚡ CARTOON INVENTOR WORKBENCH (shapez simplified)', gb.x, gb.y - 45);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 13px Courier New, monospace';
    ctx.fillText('Route shapes through processors to feed your blaster chamber. Shapes = Bullet Stats!', gb.x, gb.y - 20);
    ctx.restore();

    // 1. CARTOON BLUEPRINT GRID FRAME
    ctx.save();

    // Weapon Recipe Codex Button
    const codexB = this.getCodexButtonBounds(width, height);
    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.roundRect(codexB.x, codexB.y, codexB.width, codexB.height, 8);
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('📖 WEAPON RECIPES', codexB.x + codexB.width / 2, codexB.y + 23);

    // Heavy wooden/metal frame
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(gb.x - 8, gb.y - 8, gb.width + 16, gb.height + 16);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 5;
    ctx.strokeRect(gb.x - 8, gb.y - 8, gb.width + 16, gb.height + 16);

    // Corner brass bolts
    this.renderBolt(ctx, gb.x - 3, gb.y - 3);
    this.renderBolt(ctx, gb.x + gb.width + 3, gb.y - 3);
    this.renderBolt(ctx, gb.x - 3, gb.y + gb.height + 3);
    this.renderBolt(ctx, gb.x + gb.width + 3, gb.y + gb.height + 3);

    // Grid Cells
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const cell = this.grid.cells[y][x];
        const cx = gb.x + x * gb.cellSize;
        const cy = gb.y + y * gb.cellSize;

        // Blueprint tile pattern
        ctx.fillStyle = (x + y) % 2 === 0 ? '#0f243e' : '#0c1e34';
        ctx.fillRect(cx, cy, gb.cellSize, gb.cellSize);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(cx, cy, gb.cellSize, gb.cellSize);

        // Machine rendering
        this.renderMachineCell(ctx, cell.machine, cell.direction, cx, cy, gb.cellSize, cell.progress);

        // Held shape
        if (cell.heldShape) {
          drawShape(ctx, cell.heldShape, cx + gb.cellSize / 2, cy + gb.cellSize / 2, 28);
        }

        // Hover highlight
        if (this.hoveredCell && this.hoveredCell.x === x && this.hoveredCell.y === y) {
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 3;
          ctx.strokeRect(cx + 2, cy + 2, gb.cellSize - 4, gb.cellSize - 4);

          if (this.selectedMachine && cell.machine === 'EMPTY') {
            ctx.globalAlpha = 0.55;
            this.renderMachineCell(ctx, this.selectedMachine, this.selectedDirection, cx, cy, gb.cellSize, 0);
            ctx.globalAlpha = 1.0;
          }
        }
      }
    }
    ctx.restore();

    // 2. TOOLBAR (COLLECTIBLE GADGET CARDS & SCRAP ARSENAL)
    this.renderToolbar(ctx, tb, stats);

    // 3. STATS & BLASTER FEED QUEUE
    this.renderStatsPanel(ctx, gb);

    // 4. CLOSE BUTTON
    this.renderCloseButton(ctx, width, height);

    // 5. WEAPON RECIPES MODAL
    if (this.showCodex) {
      this.renderRecipeCodex(ctx, width, height);
    }
  }

  private renderBolt(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.fillStyle = '#f59e0b';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  private renderMachineCell(
    ctx: CanvasRenderingContext2D,
    type: MachineType,
    dir: Direction,
    x: number,
    y: number,
    size: number,
    progress: number
  ) {
    const half = size / 2;
    ctx.save();
    ctx.translate(x + half, y + half);

    let angle = 0;
    if (dir === 'RIGHT') angle = Math.PI / 2;
    if (dir === 'DOWN') angle = Math.PI;
    if (dir === 'LEFT') angle = -Math.PI / 2;
    ctx.rotate(angle);

    switch (type) {
      case 'BELT': {
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.5;
        ctx.fillRect(-half + 4, -half + 2, size - 8, size - 4);
        ctx.strokeRect(-half + 4, -half + 2, size - 8, size - 4);

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        const offset = (progress * 16) % 16;
        for (let py = -half + 10 + offset; py < half - 4; py += 16) {
          ctx.beginPath();
          ctx.moveTo(-11, py + 6);
          ctx.lineTo(0, py);
          ctx.lineTo(11, py + 6);
          ctx.stroke();
        }
        break;
      }

      case 'EMITTER_CIRCLE':
      case 'EMITTER_SQUARE':
      case 'EMITTER_STAR':
      case 'EMITTER_TRIANGLE': {
        ctx.fillStyle = '#4338ca';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.fillRect(-half + 3, -half + 3, size - 6, size - 6);
        ctx.strokeRect(-half + 3, -half + 3, size - 6, size - 6);

        ctx.beginPath();
        ctx.arc(0, 0, 11, 0, Math.PI * 2);
        ctx.fillStyle = '#a5b4fc';
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('NODE', 0, 0);
        break;
      }

      case 'CUTTER': {
        ctx.fillStyle = '#7c3aed';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.fillRect(-half + 4, -half + 4, size - 8, size - 8);
        ctx.strokeRect(-half + 4, -half + 4, size - 8, size - 8);

        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-half + 6, 0);
        ctx.lineTo(half - 6, 0);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('CUT', 0, -8);
        break;
      }

      case 'DYE_VAT_RED':
      case 'DYE_VAT_BLUE':
      case 'DYE_VAT_YELLOW':
      case 'DYE_VAT_GREEN':
      case 'DYE_VAT_PURPLE': {
        let vatColor = '#ef4444';
        let label = 'RED';
        if (type === 'DYE_VAT_BLUE') { vatColor = '#38bdf8'; label = 'BLU'; }
        if (type === 'DYE_VAT_YELLOW') { vatColor = '#eab308'; label = 'YEL'; }
        if (type === 'DYE_VAT_GREEN') { vatColor = '#22c55e'; label = 'GRN'; }
        if (type === 'DYE_VAT_PURPLE') { vatColor = '#a855f7'; label = 'VOID'; }

        ctx.fillStyle = '#1c1917';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.fillRect(-half + 4, -half + 4, size - 8, size - 8);
        ctx.strokeRect(-half + 4, -half + 4, size - 8, size - 8);

        ctx.beginPath();
        ctx.arc(0, 0, half - 10, 0, Math.PI * 2);
        ctx.fillStyle = vatColor;
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, 0, 0);
        break;
      }

      case 'OVERCLOCKER': {
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 3;
        ctx.fillRect(-half + 4, -half + 4, size - 8, size - 8);
        ctx.strokeRect(-half + 4, -half + 4, size - 8, size - 8);

        // Lightning bolt icon
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.moveTo(2, -12);
        ctx.lineTo(-6, 0);
        ctx.lineTo(0, 0);
        ctx.lineTo(-2, 12);
        ctx.lineTo(6, -2);
        ctx.lineTo(0, -2);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('OC', 0, 10);
        break;
      }

      case 'EXPANDER': {
        ctx.fillStyle = '#451a03';
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 3;
        ctx.fillRect(-half + 4, -half + 4, size - 8, size - 8);
        ctx.strokeRect(-half + 4, -half + 4, size - 8, size - 8);

        // Flared expansion horn
        ctx.fillStyle = '#fb923c';
        ctx.beginPath();
        ctx.moveTo(-8, 8);
        ctx.lineTo(8, 8);
        ctx.lineTo(14, -8);
        ctx.lineTo(-14, -8);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('WIDE', 0, 0);
        break;
      }

      case 'MERGER': {
        ctx.fillStyle = '#059669';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.fillRect(-half + 4, -half + 4, size - 8, size - 8);
        ctx.strokeRect(-half + 4, -half + 4, size - 8, size - 8);

        ctx.beginPath();
        ctx.moveTo(-15, 10);
        ctx.lineTo(0, -10);
        ctx.lineTo(15, 10);
        ctx.strokeStyle = '#a7f3d0';
        ctx.lineWidth = 3;
        ctx.stroke();
        break;
      }

      case 'SPLITTER': {
        ctx.fillStyle = '#9d174d';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.fillRect(-half + 4, -half + 4, size - 8, size - 8);
        ctx.strokeRect(-half + 4, -half + 4, size - 8, size - 8);

        ctx.beginPath();
        ctx.moveTo(0, 10);
        ctx.lineTo(-12, -8);
        ctx.moveTo(0, 10);
        ctx.lineTo(12, -8);
        ctx.strokeStyle = '#fbcfe8';
        ctx.lineWidth = 3;
        ctx.stroke();
        break;
      }

      case 'STACKER': {
        ctx.fillStyle = '#b45309';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.fillRect(-half + 4, -half + 4, size - 8, size - 8);
        ctx.strokeRect(-half + 4, -half + 4, size - 8, size - 8);

        ctx.fillStyle = '#fef3c7';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('STACK', 0, 0);
        break;
      }

      case 'HOPPER': {
        ctx.fillStyle = '#d97706';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.fillRect(-half + 2, -half + 2, size - 4, size - 4);
        ctx.strokeRect(-half + 2, -half + 2, size - 4, size - 4);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('GUN HOPPER', 0, 0);
        break;
      }
    }
    ctx.restore();
  }

  private renderToolbar(ctx: CanvasRenderingContext2D, tb: { x: number; y: number; width: number; height: number; itemHeight: number }, stats?: PlayerStats) {
    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(tb.x, tb.y, tb.width, tb.height);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeRect(tb.x, tb.y, tb.width, tb.height);

    // Dual Tabs
    const tabW = (tb.width - 24) / 2;
    const tabH = 32;
    const tabY = tb.y + 8;

    // Tab 0: GADGETS
    ctx.fillStyle = this.activeTab === 'COMPONENTS' ? '#0284c7' : '#1e293b';
    ctx.beginPath();
    ctx.roundRect(tb.x + 8, tabY, tabW, tabH, 8);
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('⚙ GADGETS', tb.x + 8 + tabW / 2, tabY + 20);

    // Tab 1: SCRAP ARSENAL
    ctx.fillStyle = this.activeTab === 'SCRAP_ARSENAL' ? '#f59e0b' : '#1e293b';
    ctx.beginPath();
    ctx.roundRect(tb.x + 16 + tabW, tabY, tabW, tabH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = this.activeTab === 'SCRAP_ARSENAL' ? '#000000' : '#ffffff';
    ctx.fillText('💥 SCRAP PERKS', tb.x + 16 + tabW + tabW / 2, tabY + 20);

    if (this.activeTab === 'COMPONENTS') {
      let currY = tb.y + 48;
      for (let i = 0; i < this.inventory.length; i++) {
        const item = this.inventory[i];
        const isSelected = this.selectedMachine === item.type;
        const isHovered = this.hoveredItemIndex === i;

        if (isSelected) {
          ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
          ctx.fillRect(tb.x + 8, currY, tb.width - 16, 40);
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.5;
          ctx.strokeRect(tb.x + 8, currY, tb.width - 16, 40);
        } else if (isHovered) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
          ctx.fillRect(tb.x + 8, currY, tb.width - 16, 40);
        }

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(tb.x + 14, currY + 9, 22, 22);
        ctx.strokeStyle = '#000000';
        ctx.strokeRect(tb.x + 14, currY + 9, 22, 22);

        ctx.fillStyle = '#facc15';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${i + 1}`, tb.x + 25, currY + 25);

        ctx.textAlign = 'left';
        ctx.fillStyle = item.count > 0 ? '#f8fafc' : '#64748b';
        ctx.font = 'bold 13px Courier New, monospace';
        ctx.fillText(item.name, tb.x + 46, currY + 18);

        ctx.fillStyle = item.count > 0 ? '#10b981' : '#ef4444';
        ctx.font = 'bold 12px monospace';
        ctx.fillText(`x${item.count}`, tb.x + tb.width - 50, currY + 18);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px Courier New, monospace';
        ctx.fillText(item.description, tb.x + 46, currY + 33);

        currY += 45;
      }
    } else {
      // SCRAP ARSENAL TAB
      const playerScrap = stats ? stats.scrap : 0;
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 13px Courier New, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`⚙ CURRENT SCRAP: ${playerScrap} ⚙`, tb.x + tb.width / 2, tb.y + 60);

      let perkY = tb.y + 76;
      for (let i = 0; i < SCRAP_PERKS_LIST.length; i++) {
        const perk = SCRAP_PERKS_LIST[i];
        const isOwned = stats ? stats.perks[perk.key] : false;
        const canAfford = playerScrap >= perk.cost;

        ctx.fillStyle = isOwned ? 'rgba(16, 185, 129, 0.12)' : 'rgba(30, 41, 59, 0.7)';
        ctx.fillRect(tb.x + 8, perkY, tb.width - 16, 64);
        ctx.strokeStyle = isOwned ? '#10b981' : (canAfford ? '#f59e0b' : '#334155');
        ctx.lineWidth = 2;
        ctx.strokeRect(tb.x + 8, perkY, tb.width - 16, 64);

        // Icon & Name
        ctx.textAlign = 'left';
        ctx.fillStyle = isOwned ? '#10b981' : '#ffffff';
        ctx.font = 'bold 13px Courier New, monospace';
        ctx.fillText(`${perk.icon} ${perk.name}`, tb.x + 16, perkY + 20);

        // Effect
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px Courier New, monospace';
        ctx.fillText(perk.effect, tb.x + 16, perkY + 38);

        // Purchase Button / Active Badge
        const btnW = 110;
        const btnH = 22;
        const btnX = tb.x + tb.width - btnW - 14;
        const btnY = perkY + 12;

        ctx.fillStyle = isOwned ? '#10b981' : (canAfford ? '#f59e0b' : '#334155');
        ctx.beginPath();
        ctx.roundRect(btnX, btnY, btnW, btnH, 6);
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = isOwned ? '#ffffff' : (canAfford ? '#000000' : '#94a3b8');
        ctx.font = 'bold 11px Courier New, monospace';
        ctx.textAlign = 'center';
        const label = isOwned ? 'ACTIVE ★' : `BUY (${perk.cost}⚙)`;
        ctx.fillText(label, btnX + btnW / 2, btnY + 15);

        perkY += 72;
      }
    }
    ctx.restore();
  }

  private renderStatsPanel(ctx: CanvasRenderingContext2D, gb: { x: number; y: number; width: number; height: number; cellSize: number }) {
    const stats = this.grid.getHopperStats();
    const panelY = gb.y + gb.height + 16;
    const panelW = gb.width + 470;
    const panelH = 72;

    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(gb.x, panelY, panelW, panelH);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3.5;
    ctx.strokeRect(gb.x, panelY, panelW, panelH);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px Courier New, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('BLASTER FEED HOPPER QUEUE:', gb.x + 16, panelY + 20);

    // Draw Queue shapes
    for (let i = 0; i < 10; i++) {
      const sx = gb.x + 24 + i * 40;
      const sy = panelY + 45;

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(sx - 15, sy - 15, 30, 30);
      ctx.strokeStyle = '#475569';
      ctx.strokeRect(sx - 15, sy - 15, 30, 30);

      if (i < this.grid.hopperBuffer.length) {
        drawShape(ctx, this.grid.hopperBuffer[i], sx, sy, 18);
      }
    }

    // Stats
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 13px Courier New, monospace';
    ctx.fillText(`THROUGHPUT: ${stats.throughputPerSecond} shapes/s`, gb.x + 460, panelY + 28);
    ctx.fillText(`AVG DAMAGE: ~${stats.averageDamage} HP`, gb.x + 460, panelY + 52);

    ctx.fillText(`ELEMENTS: 🔴 ${stats.elementalSummary.red} | 🔵 ${stats.elementalSummary.blue} | 🟡 ${stats.elementalSummary.yellow} | 🟢 ${stats.elementalSummary.green}`, gb.x + 720, panelY + 40);
    ctx.restore();
  }

  private renderCloseButton(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const cb = this.getCloseButtonBounds(width, height);
    ctx.save();
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.roundRect(cb.x, cb.y, cb.width, cb.height, 10);
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('✔ CLOSE WORKBENCH [TAB]', cb.x + cb.width / 2, cb.y + 26);
    ctx.restore();
  }

  private renderRecipeCodex(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.save();
    ctx.fillStyle = 'rgba(5, 10, 20, 0.88)';
    ctx.fillRect(0, 0, width, height);

    const modalW = Math.min(840, width - 40);
    const modalH = Math.min(640, height - 60);
    const mx = width / 2 - modalW / 2;
    const my = height / 2 - modalH / 2;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(mx, my, modalW, modalH);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 4;
    ctx.strokeRect(mx, my, modalW, modalH);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(mx + 10, my + 10, modalW - 20, 60);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeRect(mx + 10, my + 10, modalW - 20, 60);

    ctx.fillStyle = '#facc15';
    ctx.font = '900 24px Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('📖 WEAPON RECIPE CODEX (SECRET COMBOS)', mx + modalW / 2, my + 38);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 12px Courier New, monospace';
    ctx.fillText('Route raw shapes into processors on your conveyor grid to forge these weapons!', mx + modalW / 2, my + 56);

    const recipes = [
      {
        name: '⚡ RAZOR SHARDGUN',
        formula: 'Circle Node ➔ Laser Cutter',
        desc: 'Piercing razor shards that slice through multiple enemies.',
        badge: 'PIERCING SHARDS',
        color: '#38bdf8',
      },
      {
        name: '🔥 NAPALM SLUG CANNON',
        formula: 'Square Node ➔ Red Dye Vat',
        desc: 'Heavy thermal slug triggering devastating explosive AOE damage.',
        badge: 'EXPLOSIVE AOE',
        color: '#ef4444',
      },
      {
        name: '❄ CRYO AVALANCHE RAM',
        formula: 'Square Node ➔ Blue Dye Vat',
        desc: 'Dense cryo slug that freezes security bots solid.',
        badge: 'CRYO FREEZE',
        color: '#60a5fa',
      },
      {
        name: '⚡ TESLA STORM GATLING',
        formula: 'Star Node ➔ Yellow Dye Vat',
        desc: 'Bouncing stars discharging chain lightning arcs.',
        badge: 'CHAIN LIGHTNING',
        color: '#facc15',
      },
      {
        name: '💣 CLUSTER DEMOLISHER',
        formula: 'Circle + Square ➔ Hydraulic Stacker',
        desc: 'High-payload compound bomb dealing massive kinetic burst.',
        badge: 'BOSS BUSTER',
        color: '#ec4899',
      },
      {
        name: '🚀 TWIN-BURST SALVO',
        formula: 'Dual Conveyors ➔ Merger Funnel',
        desc: 'Merges 2 shape streams into your blaster chamber.',
        badge: 'DOUBLE SPEED',
        color: '#10b981',
      },
      {
        name: '🌌 SINGULARITY CANNON',
        formula: 'Any Shape ➔ Void Dye Vat',
        desc: 'Fires void plasma creating a black hole that pulls in enemies & implodes.',
        badge: 'VOID IMPLOSION',
        color: '#c084fc',
      },
      {
        name: '⚡ OVERCLOCKED GATLING',
        formula: 'Any Shape ➔ Hyper Overclocker',
        desc: 'Supercharges belt tick rate and grants +45% DMG & +30% bullet speed.',
        badge: 'OVERCLOCK +45%',
        color: '#fde047',
      },
      {
        name: '💥 CONCUSSIVE MORTAR',
        formula: 'Square / Compound ➔ Barrel Expander',
        desc: 'Doubles bullet size, adding massive concussive shockwaves on hit.',
        badge: 'CONCUSSIVE BLAST',
        color: '#fb923c',
      },
    ];

    const colW = (modalW - 50) / 2;
    const cardH = 74;
    for (let i = 0; i < recipes.length; i++) {
      const r = recipes[i];
      const col = i < 5 ? 0 : 1;
      const row = i < 5 ? i : i - 5;
      const cardX = mx + 20 + col * (colW + 10);
      const cardY = my + 80 + row * (cardH + 8);

      ctx.fillStyle = '#172554';
      ctx.fillRect(cardX, cardY, colW, cardH);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(cardX, cardY, colW, cardH);

      ctx.fillStyle = r.color;
      ctx.font = '900 13px Courier New, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(r.name, cardX + 12, cardY + 20);

      // Badge
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cardX + colW - 130, cardY + 7, 120, 18);
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 1;
      ctx.strokeRect(cardX + colW - 130, cardY + 7, 120, 18);

      ctx.fillStyle = r.color;
      ctx.font = 'bold 9px Courier New, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(r.badge, cardX + colW - 70, cardY + 19);

      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 11px Courier New, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`RECIPE: ${r.formula}`, cardX + 12, cardY + 38);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '10px Courier New, monospace';
      ctx.fillText(r.desc, cardX + 12, cardY + 54);
    }

    const closeW = 280;
    const closeH = 40;
    const closeX = mx + modalW / 2 - closeW / 2;
    const closeY = my + modalH - 52;

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.roundRect(closeX, closeY, closeW, closeH, 8);
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('✖ CLOSE RECIPES [ESC / CLICK]', closeX + closeW / 2, closeY + 25);

    ctx.restore();
  }
}
