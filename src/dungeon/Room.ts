import { RoomType, Direction, Door, ShopItem, FloorConveyor, MachineType } from '../types';
import { Enemy, LootDrop } from './Enemy';

export interface Barricade {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  isCracked: boolean;
}

export class Room {
  public id: string;
  public type: RoomType;
  public gridX: number;
  public gridY: number;
  public sector: number = 1;
  public width: number = 1000;
  public height: number = 600;
  public x: number = 100;
  public y: number = 100;

  public doors: Door[] = [];
  public enemies: Enemy[] = [];
  public lootDrops: LootDrop[] = [];
  public barricades: Barricade[] = [];
  public floorConveyors: FloorConveyor[] = [];
  public shopItems: ShopItem[] = [];
  public isCleared: boolean = false;
  public isVisited: boolean = false;

  public hasOverloadTerminal: boolean = false;
  public overloadActivated: boolean = false;
  public hasEscapePod: boolean = false;

  // Lap 2 Objects
  public hasLap2Bell: boolean = false;
  public isLap2BellCollected: boolean = false;
  public isLap2Active: boolean = false;

  private steamTimer: number = 0;

  constructor(id: string, type: RoomType, gridX: number, gridY: number, sector: number = 1) {
    this.id = id;
    this.type = type;
    this.gridX = gridX;
    this.gridY = gridY;
    this.sector = sector;

    if (type === 'START' || type === 'WORKSHOP' || type === 'ESCAPE_POD') {
      this.isCleared = true;
    }

    this.setupRoomLayout();
  }

  public setupRoomLayout() {
    if (this.type === 'COMBAT') {
      // 2-3 chunky cartoon crates
      this.barricades.push({
        id: `crate_1`,
        x: this.x + 300,
        y: this.y + 240,
        width: 80,
        height: 80,
        hp: 40,
        maxHp: 40,
        isCracked: true,
      });
      this.barricades.push({
        id: `crate_2`,
        x: this.x + 620,
        y: this.y + 240,
        width: 80,
        height: 80,
        hp: 40,
        maxHp: 40,
        isCracked: true,
      });
    } else if (this.type === 'WORKSHOP') {
      // Setup Rusty's Scrap Vending Shop with rotating upgraders & rebalanced prices!
      let item2Type: MachineType = 'CUTTER';
      let item2Name = 'Laser Cutter';
      let item2Cost = 20;

      let item3Type: MachineType = 'STACKER';
      let item3Name = 'Hydraulic Stacker';
      let item3Cost = 28;

      if (this.sector === 2) {
        item2Type = 'OVERCLOCKER';
        item2Name = 'Hyper Overclocker';
        item2Cost = 30;

        item3Type = 'DYE_VAT_PURPLE';
        item3Name = 'Void Dye Vat';
        item3Cost = 35;
      } else if (this.sector >= 3) {
        item2Type = 'EXPANDER';
        item2Name = 'Barrel Expander';
        item2Cost = 32;

        item3Type = 'OVERCLOCKER';
        item3Name = 'Hyper Overclocker';
        item3Cost = 30;
      }

      this.shopItems = [
        { id: 'shop_1', name: 'Nanite Repair (+35 HP)', price: 15, type: 'HEALTH', amount: 35, x: this.x + 320, y: this.y + 340, width: 80, height: 70, isPurchased: false },
        { id: 'shop_2', name: item2Name, price: item2Cost, type: 'COMPONENT', componentType: item2Type, amount: 1, x: this.x + 460, y: this.y + 340, width: 80, height: 70, isPurchased: false },
        { id: 'shop_3', name: item3Name, price: item3Cost, type: 'COMPONENT', componentType: item3Type, amount: 1, x: this.x + 600, y: this.y + 340, width: 80, height: 70, isPurchased: false },
        { id: 'shop_4', name: 'Star Node', price: 42, type: 'COMPONENT', componentType: 'EMITTER_STAR', amount: 1, x: this.x + 740, y: this.y + 340, width: 80, height: 70, isPurchased: false },
      ];
    } else if (this.type === 'CORE_OVERSEER') {
      this.hasOverloadTerminal = true;
    } else if (this.type === 'ESCAPE_POD') {
      this.hasEscapePod = true;
    }

    // Sector 2 & 3 Moving Floor Conveyors in combat rooms!
    if (this.sector === 2 && this.type === 'COMBAT') {
      if (Math.abs(this.gridY) % 2 === 1) {
        // Vertical conveyors in alternating rooms
        this.floorConveyors.push({
          x: this.x + 280,
          y: this.y + 100,
          width: 60,
          height: 400,
          direction: 'UP',
          speed: 160,
        });
        this.floorConveyors.push({
          x: this.x + 660,
          y: this.y + 100,
          width: 60,
          height: 400,
          direction: 'DOWN',
          speed: 160,
        });
      } else {
        // Horizontal conveyors
        this.floorConveyors.push({
          x: this.x + 180,
          y: this.y + 160,
          width: 640,
          height: 55,
          direction: 'RIGHT',
          speed: 160,
        });
        this.floorConveyors.push({
          x: this.x + 180,
          y: this.y + 390,
          width: 640,
          height: 55,
          direction: 'LEFT',
          speed: 160,
        });
      }
    } else if (this.sector === 3 && this.type === 'COMBAT') {
      // Sector 3: High-speed parallel conveyor lanes (positioned clear of doorways!)
      this.floorConveyors.push({
        x: this.x + 180,
        y: this.y + 150,
        width: 640,
        height: 50,
        direction: (this.gridX + this.gridY) % 2 === 0 ? 'RIGHT' : 'LEFT',
        speed: 130,
      });
      this.floorConveyors.push({
        x: this.x + 180,
        y: this.y + 400,
        width: 640,
        height: 50,
        direction: (this.gridX + this.gridY) % 2 === 0 ? 'LEFT' : 'RIGHT',
        speed: 130,
      });
    }
  }

  public getBounds() {
    return {
      minX: this.x + 28,
      maxX: this.x + this.width - 28,
      minY: this.y + 28,
      maxY: this.y + this.height - 28,
    };
  }

  public update(dt: number) {
    if (!this.isCleared && this.enemies.length > 0) {
      const boss = this.enemies.find(e => e.isBoss);
      if (boss && boss.isDead) {
        for (const e of this.enemies) {
          if (!e.isDead) {
            e.hp = 0;
            e.isDead = true;
          }
        }
        this.isCleared = true;
      } else if (this.enemies.every(e => e.isDead)) {
        this.isCleared = true;
      }
    }
    this.steamTimer += dt;
  }

  public checkDoorTriggers(playerX: number, playerY: number, isMeltdown: boolean): Door | null {
    const canPass = this.isCleared || isMeltdown;
    if (!canPass) return null;

    // Check generous trigger zones
    for (const door of this.doors) {
      // A trigger zone that extends well into the room
      let tx = door.x;
      let ty = door.y;
      let tw = door.width;
      let th = door.height;

      const buffer = 40;
      switch (door.direction) {
        case 'UP':
          tx -= 15;
          tw += 30;
          th += buffer;
          break;
        case 'DOWN':
          tx -= 15;
          tw += 30;
          ty -= buffer;
          th += buffer;
          break;
        case 'LEFT':
          ty -= 15;
          th += 30;
          tw += buffer;
          break;
        case 'RIGHT':
          ty -= 15;
          th += 30;
          tx -= buffer;
          tw += buffer;
          break;
      }

      if (
        playerX >= tx &&
        playerX <= tx + tw &&
        playerY >= ty &&
        playerY <= ty + th
      ) {
        return door;
      }
    }
    return null;
  }

  public render(ctx: CanvasRenderingContext2D, isMeltdown: boolean = false) {
    // 1. CARTOON FLOOR TILES
    const tileSize = 50;
    for (let py = this.y; py < this.y + this.height; py += tileSize) {
      for (let px = this.x; px < this.x + this.width; px += tileSize) {
        const isAlt = (Math.floor((px - this.x) / tileSize) + Math.floor((py - this.y) / tileSize)) % 2 === 0;

        if (isMeltdown) {
          ctx.fillStyle = isAlt ? '#3b0d18' : '#260810';
        } else if (this.sector === 1) {
          // Sector 1: Steam Foundry (warm industrial rust & charcoal)
          ctx.fillStyle = isAlt ? '#292524' : '#1c1917';
        } else if (this.sector === 2) {
          // Sector 2: High-Voltage Assembly (electric navy & cyan)
          ctx.fillStyle = isAlt ? '#0f172a' : '#082f49';
        } else {
          // Sector 3: Cybernetic Vault (obsidian & dark neon purple)
          ctx.fillStyle = isAlt ? '#180828' : '#0c0414';
        }
        ctx.fillRect(px, py, tileSize, tileSize);

        // Tile inner border
        if (isMeltdown) {
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.18)';
        } else if (this.sector === 1) {
          ctx.strokeStyle = 'rgba(249, 115, 22, 0.18)';
        } else if (this.sector === 2) {
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.22)';
        } else {
          ctx.strokeStyle = 'rgba(192, 132, 252, 0.22)';
        }
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 2, py + 2, tileSize - 4, tileSize - 4);

        // Corner rivets
        if (isMeltdown) {
          ctx.fillStyle = '#7f1d1d';
        } else if (this.sector === 1) {
          ctx.fillStyle = '#78350f';
        } else if (this.sector === 2) {
          ctx.fillStyle = '#0e7490';
        } else {
          ctx.fillStyle = '#7e22ce';
        }
        ctx.fillRect(px + 4, py + 4, 3, 3);
        ctx.fillRect(px + tileSize - 7, py + 4, 3, 3);
        ctx.fillRect(px + 4, py + tileSize - 7, 3, 3);
        ctx.fillRect(px + tileSize - 7, py + tileSize - 7, 3, 3);
      }
    }

    // Dynamic sector floor details / circuit lines / steam vents
    if (!isMeltdown) {
      if (this.sector === 1) {
        // Sector 1: Steam vents in corners emitting steam
        const vents = [
          { x: this.x + 80, y: this.y + 80 },
          { x: this.x + this.width - 80, y: this.y + 80 },
          { x: this.x + 80, y: this.y + this.height - 80 },
          { x: this.x + this.width - 80, y: this.y + this.height - 80 },
        ];
        for (const v of vents) {
          ctx.save();
          ctx.fillStyle = '#44403c';
          ctx.strokeStyle = '#f97316';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(v.x, v.y, 18, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Grate slats
          ctx.strokeStyle = '#1c1917';
          ctx.lineWidth = 2;
          for (let i = -10; i <= 10; i += 5) {
            ctx.beginPath();
            ctx.moveTo(v.x + i, v.y - 10);
            ctx.lineTo(v.x + i, v.y + 10);
            ctx.stroke();
          }

          // Animated steam puff
          const steamAnim = ((this.steamTimer * 1.5 + v.x * 0.1) % 2);
          ctx.fillStyle = 'rgba(251, 146, 60, 0.2)';
          ctx.beginPath();
          ctx.arc(v.x, v.y - steamAnim * 12, 10 + steamAnim * 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      } else if (this.sector === 2) {
        // Sector 2: Glowing cyan circuit conduits
        ctx.save();
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x + 100, this.y + 120);
        ctx.lineTo(this.x + this.width - 100, this.y + 120);
        ctx.moveTo(this.x + 100, this.y + this.height - 120);
        ctx.lineTo(this.x + this.width - 100, this.y + this.height - 120);
        ctx.stroke();

        const pulse = Math.sin(this.steamTimer * 4) * 2;
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.arc(this.x + 100, this.y + 120, 5 + pulse, 0, Math.PI * 2);
        ctx.arc(this.x + this.width - 100, this.y + 120, 5 + pulse, 0, Math.PI * 2);
        ctx.arc(this.x + 100, this.y + this.height - 120, 5 + pulse, 0, Math.PI * 2);
        ctx.arc(this.x + this.width - 100, this.y + this.height - 120, 5 + pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (this.sector === 3) {
        // Sector 3: Glowing violet matrix & moving red scanner line
        ctx.save();
        ctx.strokeStyle = 'rgba(192, 132, 252, 0.2)';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x + 80, this.y + 60, this.width - 160, this.height - 120);

        const sweepX = this.x + 90 + ((this.steamTimer * 120) % (this.width - 180));
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sweepX, this.y + 60);
        ctx.lineTo(sweepX, this.y + this.height - 60);
        ctx.stroke();
        ctx.restore();
      }
    }

    // Floor stencils / room labels
    ctx.save();
    let stencilColor = 'rgba(56, 189, 248, 0.14)';
    if (isMeltdown) stencilColor = 'rgba(239, 68, 68, 0.25)';
    else if (this.sector === 1) stencilColor = 'rgba(251, 146, 60, 0.16)';
    else if (this.sector === 2) stencilColor = 'rgba(6, 182, 212, 0.2)';
    else if (this.sector === 3) stencilColor = 'rgba(232, 121, 249, 0.2)';

    ctx.fillStyle = stencilColor;
    ctx.font = 'bold 30px Courier New, monospace';
    ctx.textAlign = 'center';

    let sectorName = 'STEAM FOUNDRY';
    if (this.sector === 2) sectorName = 'POWER GRID';
    if (this.sector === 3) sectorName = 'CYBER VAULT';

    let roomTag = `SECTOR 0${this.sector} : ${sectorName} [TESTING WING]`;
    if (this.type === 'START') roomTag = `SECTOR 0${this.sector} : SPAWN BAY [TRAINING]`;
    if (this.type === 'WORKSHOP') roomTag = `SECTOR 0${this.sector} : RUSTY'S SCRAP DEPOT`;
    if (this.type === 'CORE_OVERSEER') roomTag = `SECTOR 0${this.sector} : CORE FACILITY`;
    if (this.type === 'ESCAPE_POD') roomTag = `SECTOR 0${this.sector} : EVACUATION DOCK`;
    ctx.fillText(roomTag, this.x + this.width / 2, this.y + this.height / 2 + 10);
    ctx.restore();

    // 2. INDUSTRIAL HAZARD STRIPE BORDER WALLS
    ctx.save();
    this.renderHazardWalls(ctx, isMeltdown);
    ctx.restore();

    // 3. DOORS
    for (const door of this.doors) {
      this.renderCartoonDoor(ctx, door, isMeltdown);
    }

    // 4. FLOOR CONVEYORS (Sector 2+)
    for (const fc of this.floorConveyors) {
      this.renderFloorConveyor(ctx, fc);
    }

    // 5. BARRICADES (Cartoon Wooden / Metal Crates)
    for (const b of this.barricades) {
      if (b.hp <= 0) continue;
      this.renderCrate(ctx, b);
    }

    // 6. SCRAP VENDING SHOP (Workshop Room)
    if (this.type === 'WORKSHOP') {
      this.renderShop(ctx);
    }

    // 7. GOLDEN LAP 2 BELL (Boss Room when Lap 2 active)
    if (this.hasLap2Bell && !this.isLap2BellCollected) {
      this.renderLap2Bell(ctx);
    }

    // 8. OVERLOAD TERMINAL (Boss Room)
    if (this.hasOverloadTerminal) {
      this.renderOverloadTerminal(ctx);
    }

    // 9. ESCAPE POD (Escape Room)
    if (this.hasEscapePod) {
      this.renderEscapePod(ctx, isMeltdown);
    }

    // 10. LOOT DROPS (Cartoon Shiny Items)
    for (const drop of this.lootDrops) {
      this.renderCartoonDrop(ctx, drop);
    }
  }

  private renderHazardWalls(ctx: CanvasRenderingContext2D, isMeltdown: boolean) {
    const wallThick = 24;
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;

    // Top Wall
    ctx.fillRect(this.x, this.y, this.width, wallThick);
    ctx.strokeRect(this.x, this.y, this.width, wallThick);

    // Bottom Wall
    ctx.fillRect(this.x, this.y + this.height - wallThick, this.width, wallThick);
    ctx.strokeRect(this.x, this.y + this.height - wallThick, this.width, wallThick);

    // Left Wall
    ctx.fillRect(this.x, this.y, wallThick, this.height);
    ctx.strokeRect(this.x, this.y, wallThick, this.height);

    // Right Wall
    ctx.fillRect(this.x + this.width - wallThick, this.y, wallThick, this.height);
    ctx.strokeRect(this.x + this.width - wallThick, this.y, wallThick, this.height);

    // Diagonal hazard stripes on walls
    let stripeColor = '#facc15';
    if (isMeltdown) stripeColor = '#ef4444';
    else if (this.sector === 1) stripeColor = '#f97316';
    else if (this.sector === 2) stripeColor = '#06b6d4';
    else if (this.sector === 3) stripeColor = '#ec4899';

    ctx.fillStyle = stripeColor;
    for (let x = this.x + 30; x < this.x + this.width - 30; x += 36) {
      // Don't draw over doors
      ctx.beginPath();
      ctx.moveTo(x, this.y + 4);
      ctx.lineTo(x + 12, this.y + 4);
      ctx.lineTo(x + 2, this.y + wallThick - 4);
      ctx.lineTo(x - 10, this.y + wallThick - 4);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(x, this.y + this.height - wallThick + 4);
      ctx.lineTo(x + 12, this.y + this.height - wallThick + 4);
      ctx.lineTo(x + 2, this.y + this.height - 4);
      ctx.lineTo(x - 10, this.y + this.height - 4);
      ctx.fill();
    }
  }

  private renderCartoonDoor(ctx: CanvasRenderingContext2D, door: Door, isMeltdown: boolean) {
    const isOpen = this.isCleared || isMeltdown;
    ctx.save();

    // Floor runway / arrow indicating travel when open
    if (isOpen) {
      ctx.fillStyle = isMeltdown ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.35)';
      ctx.fillRect(door.x, door.y, door.width, door.height);

      // Flashing cartoon chevron arrow pointing into door
      const animOffset = (Math.floor(Date.now() / 150) % 3) * 6;
      ctx.fillStyle = isMeltdown ? '#ef4444' : '#22c55e';
      ctx.beginPath();

      if (door.direction === 'RIGHT') {
        const ax = door.x + 10 + animOffset;
        const ay = door.y + door.height / 2;
        ctx.moveTo(ax - 10, ay - 14);
        ctx.lineTo(ax + 10, ay);
        ctx.lineTo(ax - 10, ay + 14);
      } else if (door.direction === 'LEFT') {
        const ax = door.x + door.width - 10 - animOffset;
        const ay = door.y + door.height / 2;
        ctx.moveTo(ax + 10, ay - 14);
        ctx.lineTo(ax - 10, ay);
        ctx.lineTo(ax + 10, ay + 14);
      } else if (door.direction === 'UP') {
        const ax = door.x + door.width / 2;
        const ay = door.y + door.height - 10 - animOffset;
        ctx.moveTo(ax - 14, ay + 10);
        ctx.lineTo(ax, ay - 10);
        ctx.lineTo(ax + 14, ay + 10);
      } else if (door.direction === 'DOWN') {
        const ax = door.x + door.width / 2;
        const ay = door.y + 10 + animOffset;
        ctx.moveTo(ax - 14, ay - 10);
        ctx.lineTo(ax, ay + 10);
        ctx.lineTo(ax + 14, ay - 10);
      }
      ctx.fill();

      // Bold green exit lights on door sides
      ctx.fillStyle = '#22c55e';
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 12;
      ctx.fillRect(door.x - 4, door.y - 4, 8, 8);
      ctx.fillRect(door.x + door.width - 4, door.y + door.height - 4, 8, 8);
      ctx.shadowBlur = 0;
    } else {
      // LOCKED: Heavy blast door shut with cartoon lock sign
      ctx.fillStyle = '#475569';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.fillRect(door.x, door.y, door.width, door.height);
      ctx.strokeRect(door.x, door.y, door.width, door.height);

      // Warning red padlock / skull
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(door.x + door.width / 2, door.y + door.height / 2, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🔒', door.x + door.width / 2, door.y + door.height / 2);
    }

    ctx.restore();
  }

  private renderCrate(ctx: CanvasRenderingContext2D, b: Barricade) {
    ctx.save();
    // Wooden / metal reinforced crate
    ctx.fillStyle = '#b45309';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.fillRect(b.x, b.y, b.width, b.height);
    ctx.strokeRect(b.x, b.y, b.width, b.height);

    // Diagonal wooden slats
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x + b.width, b.y + b.height);
    ctx.moveTo(b.x + b.width, b.y);
    ctx.lineTo(b.x, b.y + b.height);
    ctx.stroke();

    // Corner metal brackets
    ctx.fillStyle = '#64748b';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    const cw = 14;
    ctx.fillRect(b.x, b.y, cw, cw);
    ctx.strokeRect(b.x, b.y, cw, cw);
    ctx.fillRect(b.x + b.width - cw, b.y, cw, cw);
    ctx.strokeRect(b.x + b.width - cw, b.y, cw, cw);
    ctx.fillRect(b.x, b.y + b.height - cw, cw, cw);
    ctx.strokeRect(b.x, b.y + b.height - cw, cw, cw);
    ctx.fillRect(b.x + b.width - cw, b.y + b.height - cw, cw, cw);
    ctx.strokeRect(b.x + b.width - cw, b.y + b.height - cw, cw, cw);

    // Cartoon TNT / Cracked label
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SMASH', b.x + b.width / 2, b.y + b.height / 2);

    ctx.restore();
  }

  private renderOverloadTerminal(ctx: CanvasRenderingContext2D) {
    const tx = this.x + this.width / 2;
    const ty = this.y + this.height / 2;

    ctx.save();
    // Heavy pedestal
    ctx.fillStyle = '#1e1b4b';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.fillRect(tx - 60, ty - 60, 120, 120);
    ctx.strokeRect(tx - 60, ty - 60, 120, 120);

    // Hazard border
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3;
    ctx.strokeRect(tx - 52, ty - 52, 104, 104);

    // GIANT CARTOON RED OVERLOAD BUTTON
    const isPulsing = Math.sin(Date.now() / 150) * 4;
    const btnRadius = 38 + (this.overloadActivated ? 0 : isPulsing);

    ctx.beginPath();
    ctx.arc(tx, ty, btnRadius, 0, Math.PI * 2);
    ctx.fillStyle = this.overloadActivated ? '#22c55e' : '#ef4444';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 25;
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Shiny button gloss highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.ellipse(tx, ty - 12, btnRadius * 0.6, btnRadius * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.overloadActivated ? 'ACTIVE!' : 'SMASH ME!', tx, ty);

    ctx.restore();
  }

  private renderEscapePod(ctx: CanvasRenderingContext2D, isMeltdown: boolean) {
    const px = this.x + this.width / 2;
    const py = this.y + this.height / 2;

    ctx.save();
    // Launch pad ring
    ctx.fillStyle = isMeltdown ? '#064e3b' : '#1e293b';
    ctx.strokeStyle = isMeltdown ? '#34d399' : '#475569';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(px, py, 68, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Rocket capsule
    ctx.fillStyle = isMeltdown ? '#34d399' : '#64748b';
    ctx.beginPath();
    ctx.arc(px, py, 45, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Porthole window
    ctx.fillStyle = isMeltdown ? '#38bdf8' : '#334155';
    ctx.beginPath();
    ctx.arc(px, py - 10, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ESCAPE POD', px, py + 18);

    // If Meltdown NOT active: Draw clear cartoon lock barrier & guidance
    if (!isMeltdown) {
      // Hologram barrier circle
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.arc(px, py, 88, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Cartoon Warning Sign
      const signW = 340;
      const signH = 34;
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(px - signW / 2, py + 70, signW, signH);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeRect(px - signW / 2, py + 70, signW, signH);

      ctx.fillStyle = '#000000';
      ctx.font = 'bold 12px Courier New, monospace';
      ctx.fillText('🔒 POD LOCKED! OVERLOAD CORE FIRST [➔ RIGHT]', px, py + 87);
    } else if (!this.isLap2Active) {
      // Pizza Tower LAP 2 PORTAL (Right of the escape pod)
      const portalX = px + 150;
      const portalY = py;

      ctx.save();
      ctx.translate(portalX, portalY);
      const swirlAngle = Date.now() / 220;
      ctx.rotate(swirlAngle);

      // Outer galaxy glow
      ctx.fillStyle = '#a855f7';
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 24;
      ctx.beginPath();
      ctx.ellipse(0, 0, 48, 30, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Inner spiral core
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.ellipse(0, 0, 26, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Comic label above portal
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.font = '900 13px Courier New, monospace';
      ctx.strokeText('★ LAP 2 PORTAL ★', portalX, portalY - 45);
      ctx.fillText('★ LAP 2 PORTAL ★', portalX, portalY - 45);
      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 11px Courier New, monospace';
      ctx.fillText('[ENTER FOR P-RANK!]', portalX, portalY - 30);
    }

    ctx.restore();
  }

  private renderFloorConveyor(ctx: CanvasRenderingContext2D, fc: FloorConveyor) {
    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(fc.x, fc.y, fc.width, fc.height);
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 3;
    ctx.strokeRect(fc.x, fc.y, fc.width, fc.height);

    // Animated chevron treads
    const animOffset = (Math.floor(Date.now() / 60) % 24);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;

    const isHorizontal = fc.direction === 'RIGHT' || fc.direction === 'LEFT';
    if (isHorizontal) {
      for (let px = fc.x + (fc.direction === 'RIGHT' ? animOffset : -animOffset); px < fc.x + fc.width; px += 28) {
        if (px < fc.x) continue;
        ctx.beginPath();
        if (fc.direction === 'RIGHT') {
          ctx.moveTo(px, fc.y + 6);
          ctx.lineTo(px + 10, fc.y + fc.height / 2);
          ctx.lineTo(px, fc.y + fc.height - 6);
        } else {
          ctx.moveTo(px + 10, fc.y + 6);
          ctx.lineTo(px, fc.y + fc.height / 2);
          ctx.lineTo(px + 10, fc.y + fc.height - 6);
        }
        ctx.stroke();
      }
    } else {
      for (let py = fc.y + (fc.direction === 'DOWN' ? animOffset : -animOffset); py < fc.y + fc.height; py += 28) {
        if (py < fc.y) continue;
        ctx.beginPath();
        if (fc.direction === 'DOWN') {
          ctx.moveTo(fc.x + 6, py);
          ctx.lineTo(fc.x + fc.width / 2, py + 10);
          ctx.lineTo(fc.x + fc.width - 6, py);
        } else {
          ctx.moveTo(fc.x + 6, py + 10);
          ctx.lineTo(fc.x + fc.width / 2, py);
          ctx.lineTo(fc.x + fc.width - 6, py + 10);
        }
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  private renderShop(ctx: CanvasRenderingContext2D) {
    const rx = this.x + this.width / 2;
    const ry = this.y + 190;

    ctx.save();
    // Shop Counter
    ctx.fillStyle = '#78350f';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.fillRect(rx - 160, ry + 15, 320, 36);
    ctx.strokeRect(rx - 160, ry + 15, 320, 36);

    // Shopkeeper "Rusty"
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(rx, ry - 10, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Aviator / merchant glasses
    ctx.fillStyle = '#facc15';
    ctx.fillRect(rx - 16, ry - 16, 32, 12);
    ctx.strokeRect(rx - 16, ry - 16, 32, 12);

    // Friendly speech bubble
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(rx - 100, ry - 75, 200, 36);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeRect(rx - 100, ry - 75, 200, 36);

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 12px Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.fillText("RUSTY'S SCRAP DEPOT", rx, ry - 59);
    ctx.fillText("[E] or CLICK TO BUY", rx, ry - 44);

    // Render 4 Shop Item Pedestals
    for (const item of this.shopItems) {
      if (item.isPurchased) {
        ctx.fillStyle = '#334155';
        ctx.fillRect(item.x, item.y, item.width, item.height);
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SOLD OUT', item.x + item.width / 2, item.y + item.height / 2);
        continue;
      }

      // Pedestal Base
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(item.x, item.y, item.width, item.height);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 3;
      ctx.strokeRect(item.x, item.y, item.width, item.height);

      // Item Icon / Label
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px Courier New, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(item.name, item.x + item.width / 2, item.y + 24);

      // Price in scrap
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 14px Courier New, monospace';
      ctx.fillText(`⚙ ${item.price}`, item.x + item.width / 2, item.y + 50);
    }
    ctx.restore();
  }

  private renderLap2Bell(ctx: CanvasRenderingContext2D) {
    const bx = this.x + this.width / 2;
    const by = this.y + this.height / 2;

    ctx.save();
    // Floating Golden Bell
    const bob = Math.sin(Date.now() / 200) * 8;
    ctx.translate(bx, by + bob);

    ctx.fillStyle = '#facc15';
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 25;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;

    // Bell shape
    ctx.beginPath();
    ctx.arc(0, -10, 20, Math.PI, 0);
    ctx.lineTo(24, 18);
    ctx.lineTo(-24, 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Clapper
    ctx.beginPath();
    ctx.arc(0, 22, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 13px Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('LAP 2 BELL!', 0, -32);
    ctx.restore();
  }

  private renderCartoonDrop(ctx: CanvasRenderingContext2D, drop: LootDrop) {
    ctx.save();
    ctx.translate(drop.x, drop.y);

    // Floating bobbing effect
    const floatY = Math.sin((Date.now() / 250) + drop.x) * 4;
    ctx.translate(0, floatY);

    if (drop.type === 'COMPONENT') {
      // Golden / cyan shiny crate
      ctx.fillStyle = '#38bdf8';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.fillRect(-14, -14, 28, 28);
      ctx.strokeRect(-14, -14, 28, 28);

      ctx.fillStyle = '#facc15';
      ctx.fillRect(-4, -14, 8, 28);
      ctx.fillRect(-14, -4, 28, 8);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚙', 0, 0);
    } else if (drop.type === 'HEALTH') {
      // Cartoon shiny red heart
      ctx.fillStyle = '#ef4444';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(-6, -4, 7, Math.PI, 0);
      ctx.arc(6, -4, 7, Math.PI, 0);
      ctx.lineTo(0, 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      // Shiny gold coin / scrap nut
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#78350f';
      ctx.fillText('⚙', 0, 0);
    }

    ctx.restore();
  }
}
