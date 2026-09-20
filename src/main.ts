import { GameState, PlayerStats, MeltdownRank, GameMode } from './types';
import { SoundManager } from './audio/SoundManager';
import { AssemblyGrid } from './assembly/Grid';
import { GridUI } from './assembly/GridUI';
import { Blaster } from './weapon/Blaster';
import { Projectile } from './weapon/Projectile';
import { ParticleSystem } from './dungeon/ParticleSystem';
import { Room } from './dungeon/Room';
import { DungeonGenerator } from './dungeon/DungeonGenerator';
import { MeltdownManager } from './meltdown/MeltdownManager';
import { HUD } from './ui/HUD';
import { VictoryScreen } from './ui/VictoryScreen';
import { PlayerRenderer } from './dungeon/PlayerRenderer';
import { MainMenu } from './ui/MainMenu';
import { PauseMenu } from './ui/PauseMenu';
import { BuddyDrone } from './dungeon/BuddyDrone';

interface FloatingText {
  text: string;
  x: number;
  y: number;
  color: string;
  life: number;
  maxLife: number;
  vy: number;
}

class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  public state: GameState = 'TITLE';
  public gameMode: GameMode = 'STANDARD';
  public sound: SoundManager;
  public grid: AssemblyGrid;
  public gridUI: GridUI;
  public particles: ParticleSystem;
  public blaster: Blaster;
  public meltdown: MeltdownManager;
  public hud: HUD;
  public victoryScreen: VictoryScreen;
  public playerRenderer: PlayerRenderer;
  public mainMenu: MainMenu;
  public pauseMenu: PauseMenu;
  public buddyDrone: BuddyDrone;

  public currentSector: number = 1;
  public rooms: Room[] = [];
  public currentRoomIndex: number = 0;

  // Player state
  public player = {
    x: 600,
    y: 380,
    vx: 0,
    vy: 0,
    radius: 20,
    angle: 0,
    speed: 320,
    invulnTimer: 0,
  };

  public stats: PlayerStats = {
    hp: 100,
    maxHp: 100,
    baseSpeed: 320,
    scrap: 20,
    overdriveTimer: 0,
    perks: {
      magnetShrapnel: false,
      conveyorTurbo: false,
      reactivePlating: false,
      sentryBuddy: false,
      superSlide: false,
    },
  };

  public enemyBullets: { x: number; y: number; vx: number; vy: number; radius: number; color?: string; damage?: number }[] = [];
  public playerProjectiles: Projectile[] = [];
  public floatingTexts: FloatingText[] = [];

  // Input states
  public keys: Record<string, boolean> = {};
  public mouse = { x: 600, y: 380, isDown: false };
  public lastTime: number = 0;
  public finalRank: MeltdownRank | null = null;
  public screenShake: number = 0;

  constructor() {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;

    this.sound = new SoundManager();
    this.grid = new AssemblyGrid();
    this.gridUI = new GridUI(this.grid, this.sound);
    this.particles = new ParticleSystem();
    this.blaster = new Blaster(this.grid, this.sound, this.particles);
    this.meltdown = new MeltdownManager(this.sound, this.particles);
    this.hud = new HUD(this.meltdown, this.grid);
    this.victoryScreen = new VictoryScreen();
    this.playerRenderer = new PlayerRenderer();
    this.mainMenu = new MainMenu(this.sound);
    this.pauseMenu = new PauseMenu(this.sound);
    this.buddyDrone = new BuddyDrone();
    (window as any).game = this;

    this.resizeCanvas();
    this.initGame(1, false);
    this.setupEventListeners();

    requestAnimationFrame((t) => this.loop(t));
  }

  private resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    if (this.rooms.length > 0) {
      this.centerRoom(this.rooms[this.currentRoomIndex]);
    }
  }

  private centerRoom(room: Room) {
    const targetX = Math.round((this.canvas.width - room.width) / 2);
    const targetY = Math.round((this.canvas.height - room.height) / 2);
    const dx = targetX - room.x;
    const dy = targetY - room.y;

    if (dx !== 0 || dy !== 0) {
      room.x = targetX;
      room.y = targetY;
      for (const d of room.doors) { d.x += dx; d.y += dy; }
      for (const b of room.barricades) { b.x += dx; b.y += dy; }
      for (const e of room.enemies) { e.x += dx; e.y += dy; }
      for (const l of room.lootDrops) { l.x += dx; l.y += dy; }
      for (const s of room.shopItems) { s.x += dx; s.y += dy; }
      for (const f of room.floorConveyors) { f.x += dx; f.y += dy; }
      this.player.x += dx;
      this.player.y += dy;
    }
  }

  private initGame(sector: number = 1, preserveBackpack: boolean = false) {
    this.currentSector = sector;
    this.meltdown.reset();
    this.rooms = DungeonGenerator.generateSector(this.currentSector, this.gameMode);
    this.currentRoomIndex = 0;
    this.rooms[0].isVisited = true;
    this.centerRoom(this.rooms[0]);

    this.player.x = this.rooms[0].x + this.rooms[0].width / 2;
    this.player.y = this.rooms[0].y + this.rooms[0].height / 2;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.invulnTimer = 0;
    this.stats.hp = this.stats.maxHp;
    this.enemyBullets = [];
    this.playerProjectiles = [];
    this.floatingTexts = [];
    this.finalRank = null;
    this.screenShake = 0;

    if (!preserveBackpack) {
      this.grid = new AssemblyGrid();
      this.gridUI = new GridUI(this.grid, this.sound);
      this.blaster = new Blaster(this.grid, this.sound, this.particles);
      this.hud = new HUD(this.meltdown, this.grid);
      this.stats.scrap = 20;
      this.stats.overdriveTimer = 0;
      this.stats.perks = {
        magnetShrapnel: false,
        conveyorTurbo: false,
        reactivePlating: false,
        sentryBuddy: false,
        superSlide: false,
      };
    }
  }

  public triggerScrapOverdrive() {
    if (this.stats.scrap < 20) {
      this.sound.playRotate();
      this.addFloatingText('NEED 20 SCRAP! ⚙', this.player.x, this.player.y - 35, '#ef4444');
      return;
    }

    this.stats.scrap -= 20;
    this.stats.overdriveTimer = 4.5;
    this.player.invulnTimer = 1.5;

    // Clear all enemy bullets on screen
    const clearedBullets = this.enemyBullets.length;
    this.enemyBullets = [];

    this.sound.playAlarm();
    this.sound.playExplosion();
    this.screenShake = 24;

    this.particles.spawnExplosion(this.player.x, this.player.y, 90);
    this.particles.spawnFreezeShatter(this.player.x, this.player.y);

    // Blast damage 120 to all enemies within 260px
    const currentRoom = this.rooms[this.currentRoomIndex];
    if (currentRoom) {
      for (const enemy of currentRoom.enemies) {
        if (enemy.isDead) continue;
        const d = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y);
        if (d < 260) {
          const drops = enemy.takeDamage(120, (enemy.x - this.player.x) * 1.5, (enemy.y - this.player.y) * 1.5, this.particles, this.sound);
          for (const drop of drops) currentRoom.lootDrops.push(drop);
          this.particles.spawnHitSparks(enemy.x, enemy.y, '#facc15', 16);
        }
      }
    }

    this.addFloatingText(`💥 OVERDRIVE BOMB! (${clearedBullets} WIPED)`, this.player.x, this.player.y - 45, '#facc15');
  }

  public addFloatingText(text: string, x: number, y: number, color: string = '#facc15') {
    this.floatingTexts.push({
      text,
      x,
      y,
      color,
      life: 0.8,
      maxLife: 0.8,
      vy: -60,
    });
  }

  public tryBuyShopItem(item: any) {
    if (item.isPurchased) return;
    if (this.stats.scrap >= item.price) {
      this.stats.scrap -= item.price;
      item.isPurchased = true;
      if (item.type === 'HEALTH') {
        this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + item.amount);
      } else if (item.type === 'COMPONENT' && item.componentType) {
        this.gridUI.addItem(item.componentType, item.amount);
      }
      this.sound.playBuy();
      this.particles.spawnHitSparks(item.x + item.width / 2, item.y + item.height / 2, '#facc15', 16);
      this.addFloatingText(`BOUGHT ${item.name}! ⚙`, this.player.x, this.player.y - 30, '#10b981');
    } else {
      this.sound.playRotate();
      this.addFloatingText('NEED MORE SCRAP! ⚙', this.player.x, this.player.y - 30, '#ef4444');
    }
  }

  public triggerTauntOrParry() {
    this.playerRenderer.triggerTaunt();

    let parriedCount = 0;
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const b = this.enemyBullets[i];
      const dist = Math.hypot(b.x - this.player.x, b.y - this.player.y);
      if (dist < 75) {
        parriedCount++;
        const parriedProj = new Projectile(
          this.player.x,
          this.player.y,
          this.mouse.x,
          this.mouse.y,
          {
            id: `parry_${Date.now()}_${i}`,
            kind: 'star',
            color: 'yellow',
            tier: 3,
          }
        );
        parriedProj.damage = 60;
        parriedProj.speed = 850;
        parriedProj.pierceRemaining = 4;
        parriedProj.bouncesRemaining = 2;
        this.playerProjectiles.push(parriedProj);
        this.enemyBullets.splice(i, 1);
      }
    }

    if (parriedCount > 0) {
      this.sound.playParry();
      this.meltdown.momentum = 100;
      this.screenShake = 18;
      this.particles.spawnFreezeShatter(this.player.x, this.player.y);
      this.addFloatingText('★ PARRY! ★', this.player.x, this.player.y - 35, '#facc15');
    } else {
      this.sound.playRotate();
      this.addFloatingText('TAUNT! ★', this.player.x, this.player.y - 25, '#38bdf8');
    }
  }

  private setupEventListeners() {
    window.addEventListener('resize', () => {
      this.resizeCanvas();
    });

    window.addEventListener('keydown', (e) => {
      this.sound.init();
      this.keys[e.key.toLowerCase()] = true;

      // Pause toggle: Escape or P
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (this.state === 'DUNGEON' || this.state === 'MELTDOWN') {
          this.state = 'PAUSED';
          this.sound.playPlace();
          return;
        } else if (this.state === 'PAUSED') {
          if (this.pauseMenu.showCodexModal) {
            this.pauseMenu.showCodexModal = false;
            this.sound.playPlace();
          } else {
            this.state = this.meltdown.isActive ? 'MELTDOWN' : 'DUNGEON';
            this.sound.playPlace();
          }
          return;
        } else if (this.state === 'ASSEMBLY') {
          if (this.gridUI.showCodex) {
            this.gridUI.showCodex = false;
          } else {
            this.state = this.meltdown.isActive ? 'MELTDOWN' : 'DUNGEON';
          }
          return;
        }
      }

      // Taunt & Parry Mechanic [C] or [F]
      if (e.key === 'c' || e.key === 'C' || e.key === 'f' || e.key === 'F') {
        if (this.state === 'DUNGEON' || this.state === 'MELTDOWN') {
          this.triggerTauntOrParry();
        }
      }

      // Scrap Overdrive Super Bomb [Q]
      if (e.key === 'q' || e.key === 'Q') {
        if (this.state === 'DUNGEON' || this.state === 'MELTDOWN') {
          this.triggerScrapOverdrive();
        }
      }

      if (e.key === 'Tab' || e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        const currentRoom = this.rooms[this.currentRoomIndex];

        // If in Workshop and standing close to an unpurchased pedestal, buy it!
        let boughtItem = false;
        if (currentRoom.type === 'WORKSHOP' && (this.state === 'DUNGEON' || this.state === 'MELTDOWN')) {
          for (const item of currentRoom.shopItems) {
            if (item.isPurchased) continue;
            const dist = Math.hypot(this.player.x - (item.x + item.width / 2), this.player.y - (item.y + item.height / 2));
            if (dist < 65) {
              this.tryBuyShopItem(item);
              boughtItem = true;
              break;
            }
          }
        }

        if (!boughtItem) {
          if (this.state === 'DUNGEON' || this.state === 'MELTDOWN') {
            this.state = 'ASSEMBLY';
          } else if (this.state === 'ASSEMBLY') {
            this.state = this.meltdown.isActive ? 'MELTDOWN' : 'DUNGEON';
          }
        }
      }

      if (e.key === 'm' || e.key === 'M') {
        this.sound.toggleMute();
      }

      if (e.key === ' ' || e.key === 'Shift') {
        if (this.state === 'DUNGEON' || this.state === 'MELTDOWN') {
          if (this.meltdown.triggerSlide()) {
            this.addFloatingText('SLIDE!', this.player.x, this.player.y - 25, '#38bdf8');
          }
        }
      }

      const isActionKey = e.key === ' ' || e.code === 'Space' || e.key === 'Enter' || e.code === 'Enter';
      if (isActionKey) {
        if (this.state === 'TITLE') {
          this.gameMode = this.mainMenu.selectedMode;
          this.initGame(1, false);
          this.state = 'DUNGEON';
          this.sound.startMusic('DUNGEON');
        } else if (this.state === 'VICTORY') {
          e.preventDefault();
          if (this.currentSector < 3 || this.gameMode === 'ENDLESS') {
            this.initGame(this.currentSector + 1, true);
            this.state = 'DUNGEON';
            this.sound.startMusic('DUNGEON');
            this.addFloatingText(`SECTOR 0${this.currentSector} REACHED!`, this.player.x, this.player.y - 30, '#38bdf8');
          } else {
            this.initGame(1, false);
            this.state = 'TITLE';
            this.sound.stopMusic();
          }
          return;
        } else if (this.state === 'GAME_OVER') {
          e.preventDefault();
          this.initGame(1, false);
          this.state = 'TITLE';
          this.sound.stopMusic();
          return;
        }
      }

      if (this.state === 'ASSEMBLY') {
        this.gridUI.handleKeyDown(e);
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    this.canvas.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;

      if (this.state === 'ASSEMBLY') {
        this.gridUI.handleMouseMove(this.mouse.x, this.mouse.y, this.canvas.width, this.canvas.height);
      } else if (this.state === 'PAUSED') {
        this.pauseMenu.update(0.016, this.mouse.x, this.mouse.y);
      }
    });

    this.canvas.addEventListener('mousedown', (e) => {
      this.sound.init();
      if (e.button === 0) {
        this.mouse.isDown = true;
        if (this.state === 'TITLE') {
          const res = this.mainMenu.handleClick(this.mouse.x, this.mouse.y);
          if (res === 'PLAY') {
            this.gameMode = this.mainMenu.selectedMode;
            this.initGame(1, false);
            this.state = 'DUNGEON';
            this.sound.startMusic('DUNGEON');
          }
        } else if (this.state === 'PAUSED') {
          const pRes = this.pauseMenu.handleClick(this.mouse.x, this.mouse.y);
          if (pRes === 'RESUME') {
            this.state = this.meltdown.isActive ? 'MELTDOWN' : 'DUNGEON';
          } else if (pRes === 'ABORT') {
            this.initGame(1, false);
            this.state = 'TITLE';
            this.sound.stopMusic();
          }
          return;
        } else if (this.state === 'VICTORY') {
          if (this.currentSector < 3 || this.gameMode === 'ENDLESS') {
            this.initGame(this.currentSector + 1, true);
            this.state = 'DUNGEON';
            this.sound.startMusic('DUNGEON');
            this.addFloatingText(`SECTOR 0${this.currentSector} REACHED!`, this.player.x, this.player.y - 30, '#38bdf8');
          } else {
            this.initGame(1, false);
            this.state = 'TITLE';
            this.sound.stopMusic();
          }
          return;
        } else if (this.state === 'GAME_OVER') {
          this.initGame(1, false);
          this.state = 'TITLE';
          this.sound.stopMusic();
          return;
        } else if (this.state === 'ASSEMBLY') {
          const res = this.gridUI.handleMouseDown(this.mouse.x, this.mouse.y, false, this.canvas.width, this.canvas.height, this.stats);
          if (res === 'CLOSE') {
            this.state = this.meltdown.isActive ? 'MELTDOWN' : 'DUNGEON';
          }
        } else if (this.state === 'DUNGEON' || this.state === 'MELTDOWN') {
          // Check HUD Bomb button click
          if (this.hud.isBombButtonClicked(this.mouse.x, this.mouse.y)) {
            this.triggerScrapOverdrive();
            return;
          }

          // Check HUD Pause button click
          if (this.hud.isPauseButtonClicked(this.mouse.x, this.mouse.y, this.canvas.width)) {
            this.state = 'PAUSED';
            this.sound.playPlace();
            return;
          }

          // Check shop item pedestal click in Workshop
          const currentRoom = this.rooms[this.currentRoomIndex];
          if (currentRoom.type === 'WORKSHOP') {
            for (const item of currentRoom.shopItems) {
              if (item.isPurchased) continue;
              if (
                this.mouse.x >= item.x &&
                this.mouse.x <= item.x + item.width &&
                this.mouse.y >= item.y &&
                this.mouse.y <= item.y + item.height
              ) {
                this.tryBuyShopItem(item);
                break;
              }
            }
          }
        }
      } else if (e.button === 2) {
        e.preventDefault();
        if (this.state === 'ASSEMBLY') {
          this.gridUI.handleMouseDown(this.mouse.x, this.mouse.y, true, this.canvas.width, this.canvas.height, this.stats);
        }
      }
    });

    this.canvas.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.mouse.isDown = false;
      }
      if (this.state === 'ASSEMBLY') {
        this.gridUI.handleMouseUp();
      }
    });

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private loop(timestamp: number) {
    if (!this.lastTime) this.lastTime = timestamp;
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    try {
      this.update(dt);
      this.render();
    } catch (err) {
      console.error('CRITICAL GAME LOOP ERROR:', err);
    }

    requestAnimationFrame((t) => this.loop(t));
  }

  private update(dt: number) {
    if (this.state === 'PAUSED') {
      this.pauseMenu.update(dt, this.mouse.x, this.mouse.y);
      return;
    }

    const turboMult = this.stats.perks.conveyorTurbo ? 1.4 : 1.0;
    this.grid.update(dt * turboMult);
    this.particles.update(dt);

    if (this.state === 'TITLE') {
      this.mainMenu.update(dt, this.canvas.width, this.canvas.height, this.mouse.x, this.mouse.y);
      return;
    }

    // Update floating comic text
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      ft.y += ft.vy * dt;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    if (this.state === 'DUNGEON' || this.state === 'MELTDOWN') {
      this.updateGameplay(dt);
    }
  }

  private updateGameplay(dt: number) {
    const currentRoom = this.rooms[this.currentRoomIndex];
    currentRoom.update(dt);

    if (currentRoom.type === 'CORE_OVERSEER' && !currentRoom.isCleared && !this.meltdown.isActive) {
      this.sound.startMusic('BOSS');
    }

    // 0. Overdrive Countdown & Visuals
    if (this.stats.overdriveTimer > 0) {
      this.stats.overdriveTimer = Math.max(0, this.stats.overdriveTimer - dt);
      if (Math.random() < 0.35) {
        this.particles.spawnHitSparks(this.player.x + (Math.random() - 0.5) * 20, this.player.y + (Math.random() - 0.5) * 20, '#facc15', 2);
      }
    }

    // 1. Player Movement & Input
    let mx = 0;
    let my = 0;
    if (this.keys['w'] || this.keys['arrowup']) my -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) my += 1;
    if (this.keys['a'] || this.keys['arrowleft']) mx -= 1;
    if (this.keys['d'] || this.keys['arrowright']) mx += 1;

    const isMoving = mx !== 0 || my !== 0;
    if (isMoving) {
      const len = Math.hypot(mx, my);
      mx /= len;
      my /= len;
    }

    // Meltdown momentum
    const oldMach = this.meltdown.currentMach;
    this.meltdown.update(dt, isMoving, this.player.x, this.player.y, this.player.vx, this.player.vy, currentRoom);

    if (this.meltdown.currentMach > oldMach && this.meltdown.currentMach >= 2) {
      this.addFloatingText(`MACH ${this.meltdown.currentMach}!`, this.player.x, this.player.y - 30, '#ec4899');
      this.screenShake = 8;
    }

    let currentSpeed = this.stats.baseSpeed * this.meltdown.getSpeedMultiplier();
    if (this.meltdown.isSliding) currentSpeed *= 1.35;
    if (this.stats.overdriveTimer > 0) currentSpeed *= 1.45;

    this.player.vx = mx * currentSpeed;
    this.player.vy = my * currentSpeed;

    this.player.x += this.player.vx * dt;
    this.player.y += this.player.vy * dt;

    // Floor Conveyors pushing player
    for (const fc of currentRoom.floorConveyors) {
      if (
        this.player.x >= fc.x &&
        this.player.x <= fc.x + fc.width &&
        this.player.y >= fc.y &&
        this.player.y <= fc.y + fc.height
      ) {
        let pushX = 0;
        let pushY = 0;
        if (fc.direction === 'RIGHT') pushX = fc.speed;
        else if (fc.direction === 'LEFT') pushX = -fc.speed;
        else if (fc.direction === 'DOWN') pushY = fc.speed;
        else if (fc.direction === 'UP') pushY = -fc.speed;

        this.player.x += pushX * dt;
        this.player.y += pushY * dt;
      }
    }

    // Super Slide Collision Damage Perk
    if (this.meltdown.isSliding && this.stats.perks.superSlide) {
      for (const enemy of currentRoom.enemies) {
        if (enemy.isDead || enemy.type === 'TARGET_DUMMY') continue;
        const d = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y);
        if (d < enemy.radius + this.player.radius + 8) {
          const drops = enemy.takeDamage(75, this.player.vx * 0.4, this.player.vy * 0.4, this.particles, this.sound);
          for (const drop of drops) currentRoom.lootDrops.push(drop);
          this.sound.playSmash();
          this.screenShake = 10;
          this.particles.spawnExplosion(enemy.x, enemy.y, 45);
          this.addFloatingText('SUPER SLIDE! 💥', enemy.x, enemy.y - 25, '#facc15');
        }
      }
    }

    this.player.angle = Math.atan2(this.mouse.y - this.player.y, this.mouse.x - this.player.x);
    this.playerRenderer.update(dt, isMoving, this.mouse.isDown);

    // Sentry Buddy Drone Update & Auto-Fire
    if (this.stats.perks.sentryBuddy) {
      const droneRes = this.buddyDrone.update(
        dt,
        this.player.x,
        this.player.y,
        currentRoom.enemies,
        currentRoom.lootDrops,
        this.particles,
        this.sound
      );
      if (droneRes.collectedScrap > 0) {
        this.stats.scrap += droneRes.collectedScrap;
        this.addFloatingText(`+${droneRes.collectedScrap} SCRAP (DRONE)`, this.buddyDrone.x, this.buddyDrone.y - 25, '#facc15');
      }
      for (const b of droneRes.bulletsToSpawn) {
        const droneProj = new Projectile(
          b.x,
          b.y,
          b.x + b.vx,
          b.y + b.vy,
          {
            id: `drone_${Date.now()}_${Math.random()}`,
            kind: 'star',
            color: 'yellow',
            tier: 2,
          }
        );
        droneProj.damage = b.damage;
        droneProj.speed = Math.hypot(b.vx, b.vy);
        this.playerProjectiles.push(droneProj);
      }
    }

    // Shooting (2x Firerate during Overdrive)
    this.blaster.update(dt * (this.stats.overdriveTimer > 0 ? 2.0 : 1.0));
    if (this.mouse.isDown && !this.meltdown.isSliding) {
      const newShots = this.blaster.shoot(this.player.x, this.player.y, this.mouse.x, this.mouse.y);
      for (const s of newShots) {
        this.playerProjectiles.push(s);
      }
    }

    if (this.player.invulnTimer > 0) {
      this.player.invulnTimer -= dt;
    }

    // 2. Doorways Check
    const triggeredDoor = currentRoom.checkDoorTriggers(this.player.x, this.player.y, this.meltdown.isActive);
    if (triggeredDoor) {
      this.transitionRoom(triggeredDoor.targetRoomIndex, triggeredDoor.direction);
      return;
    }

    // Clamp within room walls
    const bounds = currentRoom.getBounds();
    this.player.x = Math.max(bounds.minX, Math.min(bounds.maxX, this.player.x));
    this.player.y = Math.max(bounds.minY, Math.min(bounds.maxY, this.player.y));

    // 3. Overload Terminal
    if (currentRoom.type === 'CORE_OVERSEER' && currentRoom.isCleared && !this.meltdown.isActive) {
      const termX = currentRoom.x + currentRoom.width / 2;
      const termY = currentRoom.y + currentRoom.height / 2;
      const dist = Math.hypot(this.player.x - termX, this.player.y - termY);
      if (dist < 60) {
        currentRoom.overloadActivated = true;
        this.meltdown.triggerMeltdown(this.currentSector, this.rooms.length);
        this.state = 'MELTDOWN';
        this.screenShake = 22;
        this.addFloatingText('🚨 CORE OVERLOAD! RUN! 🚨', this.player.x, this.player.y - 40, '#ef4444');
      }
    }

    // 4. Escape Pod & Lap 2
    if (currentRoom.type === 'ESCAPE_POD' && this.meltdown.isActive) {
      const podX = currentRoom.x + currentRoom.width / 2;
      const podY = currentRoom.y + currentRoom.height / 2;
      const dist = Math.hypot(this.player.x - podX, this.player.y - podY);
      if (dist < 65) {
        this.finalRank = this.meltdown.evaluateRank();
        this.gridUI.addItem(this.finalRank.bonusReward.type, this.finalRank.bonusReward.count);
        this.state = 'VICTORY';
        this.sound.stopMusic();
        return;
      }

      // Lap 2 Portal Trigger
      if (!this.meltdown.isLap2) {
        const portalX = podX + 150;
        const portalY = podY;
        const pDist = Math.hypot(this.player.x - portalX, this.player.y - portalY);
        if (pDist < 48) {
          this.meltdown.startLap2(this.rooms.length);
          currentRoom.isLap2Active = true;
          const bossRoom = this.rooms.find(r => r.type === 'CORE_OVERSEER');
          if (bossRoom) {
            bossRoom.hasLap2Bell = true;
            bossRoom.isLap2BellCollected = false;
          }
          this.screenShake = 18;
          this.particles.spawnExplosion(portalX, portalY, 50);
          this.addFloatingText('★ LAP 2 ACTIVATED! RETRIEVE THE BELL! ★', this.player.x, this.player.y - 45, '#facc15');
        }
      }
    }

    // Golden Lap Bell Pickup in Room 5
    if (currentRoom.hasLap2Bell && !currentRoom.isLap2BellCollected) {
      const bellX = currentRoom.x + currentRoom.width / 2;
      const bellY = currentRoom.y + currentRoom.height / 2;
      const bDist = Math.hypot(this.player.x - bellX, this.player.y - bellY);
      if (bDist < 55) {
        currentRoom.isLap2BellCollected = true;
        this.meltdown.hasLapBell = true;
        this.sound.playLap2();
        this.screenShake = 14;
        this.particles.spawnHitSparks(bellX, bellY, '#facc15', 25);
        this.addFloatingText('🔔 GOLDEN BELL COLLECTED! ESCAPE! 🔔', this.player.x, this.player.y - 40, '#facc15');
      }
    }

    // 5. Update Projectiles
    for (let i = this.playerProjectiles.length - 1; i >= 0; i--) {
      const p = this.playerProjectiles[i];
      p.update(dt);

      if (p.x < bounds.minX) { p.bounce(-1, 0); p.x = bounds.minX; }
      else if (p.x > bounds.maxX) { p.bounce(1, 0); p.x = bounds.maxX; }
      if (p.y < bounds.minY) { p.bounce(0, -1); p.y = bounds.minY; }
      else if (p.y > bounds.maxY) { p.bounce(0, 1); p.y = bounds.maxY; }

      // Check Barricades
      for (const b of currentRoom.barricades) {
        if (b.hp <= 0) continue;
        if (p.x > b.x && p.x < b.x + b.width && p.y > b.y && p.y < b.y + b.height) {
          b.hp -= p.damage;
          this.particles.spawnHitSparks(p.x, p.y, '#facc15', 5);
          if (b.hp <= 0) {
            this.sound.playSmash();
            this.particles.spawnExplosion(b.x + b.width / 2, b.y + b.height / 2, 40);
            this.addFloatingText('SMASH!', b.x + b.width / 2, b.y, '#facc15');
          }
          p.isDead = true;
          break;
        }
      }

      // Check Satellite Shield Plates (Overlord Core Boss)
      let blockedByShield = false;
      for (const enemy of currentRoom.enemies) {
        if (enemy.isDead) continue;
        const plates = enemy.getSatelliteShieldPlates();
        for (const plate of plates) {
          if (Math.hypot(p.x - plate.x, p.y - plate.y) < p.radius + plate.radius) {
            this.sound.playParry();
            this.particles.spawnHitSparks(p.x, p.y, '#c084fc', 8);
            this.addFloatingText('BLOCKED!', plate.x, plate.y - 20, '#c084fc');
            p.isDead = true;
            blockedByShield = true;
            break;
          }
        }
        if (blockedByShield) break;
      }

      if (blockedByShield) {
        this.playerProjectiles.splice(i, 1);
        continue;
      }

      // Check Enemies
      for (const enemy of currentRoom.enemies) {
        if (enemy.isDead || p.hitEnemyIds.has(enemy.id)) continue;
        const dist = Math.hypot(p.x - enemy.x, p.y - enemy.y);
        if (dist < p.radius + enemy.radius) {
          p.hitEnemyIds.add(enemy.id);

          if (p.shape.color === 'red') {
            this.particles.spawnExplosion(enemy.x, enemy.y, 65);
            this.sound.playExplosion();
            this.addFloatingText('BOOM!', enemy.x, enemy.y - 20, '#ef4444');
            for (const other of currentRoom.enemies) {
              if (other.isDead) continue;
              if (Math.hypot(other.x - enemy.x, other.y - enemy.y) < 75) {
                const drops = other.takeDamage(p.damage * 0.8, 0, 0, this.particles, this.sound);
                for (const d of drops) currentRoom.lootDrops.push(d);
              }
            }
          } else if (p.shape.color === 'blue') {
            enemy.applyFreeze(2.0);
            this.sound.playFreeze();
            this.particles.spawnFreezeShatter(enemy.x, enemy.y);
            this.addFloatingText('FREEZE!', enemy.x, enemy.y - 20, '#38bdf8');
          } else if (p.shape.color === 'yellow') {
            this.sound.playShock();
            this.addFloatingText('ZAP!', enemy.x, enemy.y - 20, '#facc15');
            for (const other of currentRoom.enemies) {
              if (other.isDead || other.id === enemy.id) continue;
              if (Math.hypot(other.x - enemy.x, other.y - enemy.y) < 140) {
                const drops = other.takeDamage(p.damage * 0.6, 0, 0, this.particles, this.sound);
                for (const d of drops) currentRoom.lootDrops.push(d);
                this.particles.spawnHitSparks(other.x, other.y, '#fde047', 8);
              }
            }
          } else if (p.shape.color === 'green') {
            this.particles.spawnAcidPuddle(enemy.x, enemy.y, 42);
            this.addFloatingText('ACID!', enemy.x, enemy.y - 20, '#22c55e');
          } else if (p.shape.color === 'purple') {
            this.sound.playShock();
            this.particles.spawnHitSparks(enemy.x, enemy.y, '#c084fc', 20);
            this.addFloatingText('VOID IMPLOSION!', enemy.x, enemy.y - 20, '#a855f7');
            for (const other of currentRoom.enemies) {
              if (other.isDead) continue;
              const d = Math.hypot(other.x - enemy.x, other.y - enemy.y);
              if (d < 140) {
                const pullFactor = (140 - d) / 140;
                const angle = Math.atan2(enemy.y - other.y, enemy.x - other.x);
                other.x += Math.cos(angle) * 35 * pullFactor;
                other.y += Math.sin(angle) * 35 * pullFactor;
                if (other.id !== enemy.id) {
                  const drops = other.takeDamage(p.damage * 0.75, 0, 0, this.particles, this.sound);
                  for (const drop of drops) currentRoom.lootDrops.push(drop);
                  this.particles.spawnHitSparks(other.x, other.y, '#a855f7', 6);
                }
              }
            }
          } else {
            this.addFloatingText(`${Math.round(p.damage)}`, enemy.x, enemy.y - 20, '#ffffff');
          }

          const drops = enemy.takeDamage(p.damage, p.vx * 0.25, p.vy * 0.25, this.particles, this.sound);
          for (const d of drops) currentRoom.lootDrops.push(d);

          p.pierceRemaining--;
          if (p.pierceRemaining <= 0) {
            p.isDead = true;
          }
          break;
        }
      }

      if (p.isDead) {
        this.playerProjectiles.splice(i, 1);
      }
    }

    // 6. Update Enemies
    for (const enemy of currentRoom.enemies) {
      if (enemy.isDead) continue;

      const result = enemy.update(dt, this.player.x, this.player.y, bounds);
      if (result.stageAnnouncement) {
        this.sound.playAlarm();
        this.screenShake = 18;
        this.addFloatingText(result.stageAnnouncement, enemy.x, enemy.y - 45, '#ef4444');
      }
      if (result.screenShake && result.screenShake > this.screenShake) {
        this.screenShake = result.screenShake;
      }
      if (result.gravitationalPull) {
        const gx = result.gravitationalPull.x;
        const gy = result.gravitationalPull.y;
        if (Number.isFinite(gx) && Number.isFinite(gy)) {
          const pullAngle = Math.atan2(gy - this.player.y, gx - this.player.x);
          const force = Math.min(result.gravitationalPull.force, 90);
          this.player.x += Math.cos(pullAngle) * force * dt;
          this.player.y += Math.sin(pullAngle) * force * dt;
        }
      }

      if (!Number.isFinite(this.player.x) || !Number.isFinite(this.player.y)) {
        this.player.x = currentRoom.x + currentRoom.width / 2;
        this.player.y = currentRoom.y + currentRoom.height / 2;
      }

      if (result.bulletsToSpawn && result.bulletsToSpawn.length > 0) {
        this.sound.playEnemyShoot();
        for (const b of result.bulletsToSpawn) {
          this.enemyBullets.push(b);
        }
      }

      if (result.enemiesToSpawn && result.enemiesToSpawn.length > 0) {
        this.sound.playAlarm();
        this.screenShake = 10;
        this.addFloatingText('⚠️ REINFORCEMENTS! ⚠️', enemy.x, enemy.y - 30, '#ef4444');
        for (const newEnemy of result.enemiesToSpawn) {
          currentRoom.enemies.push(newEnemy);
        }
      }

      const dist = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y);
      if (dist < enemy.radius + this.player.radius) {
        if (this.meltdown.isActive && this.meltdown.currentMach === 3) {
          const drops = enemy.takeDamage(150, this.player.vx, this.player.vy, this.particles, this.sound);
          for (const d of drops) currentRoom.lootDrops.push(d);
          this.sound.playSmash();
          this.addFloatingText('HYPER CRUSH!', enemy.x, enemy.y, '#ec4899');
          this.screenShake = 12;
        } else if (enemy.type !== 'TARGET_DUMMY') {
          this.damagePlayer(15);
        }
      }
    }

    // 7. Enemy Bullets
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const b = this.enemyBullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      const dist = Math.hypot(b.x - this.player.x, b.y - this.player.y);
      if (dist < b.radius + this.player.radius) {
        this.damagePlayer(b.damage || 12);
        this.enemyBullets.splice(i, 1);
        continue;
      }

      if (b.x < bounds.minX || b.x > bounds.maxX || b.y < bounds.minY || b.y > bounds.maxY) {
        this.enemyBullets.splice(i, 1);
      }
    }

    // 8. Loot Pickup
    for (let i = currentRoom.lootDrops.length - 1; i >= 0; i--) {
      const drop = currentRoom.lootDrops[i];
      const dist = Math.hypot(drop.x - this.player.x, drop.y - this.player.y);

      // Magnet pull toward player if Magnet Shrapnel perk unlocked
      if (this.stats.perks.magnetShrapnel && drop.type === 'SCRAP' && dist < 260 && dist >= this.player.radius + 22) {
        const pullAngle = Math.atan2(this.player.y - drop.y, this.player.x - drop.x);
        drop.x += Math.cos(pullAngle) * 360 * dt;
        drop.y += Math.sin(pullAngle) * 360 * dt;
      }

      if (dist < this.player.radius + 22) {
        if (drop.type === 'COMPONENT' && drop.componentType) {
          this.gridUI.addItem(drop.componentType, drop.amount);
          this.sound.playPlace();
          this.addFloatingText('+1 COMPONENT', drop.x, drop.y, '#38bdf8');
        } else if (drop.type === 'HEALTH') {
          this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + drop.amount);
          this.sound.playFreeze();
          this.addFloatingText('+25 HP', drop.x, drop.y, '#10b981');
        } else if (drop.type === 'SCRAP') {
          this.stats.scrap += drop.amount;
          this.sound.playPlace();
          this.addFloatingText(`+${drop.amount} SCRAP`, drop.x, drop.y, '#facc15');

          // Magnet Shrapnel: Fire 2 shards
          if (this.stats.perks.magnetShrapnel) {
            for (let k = 0; k < 2; k++) {
              const shardAngle = Math.random() * Math.PI * 2;
              const sp = new Projectile(
                this.player.x,
                this.player.y,
                this.player.x + Math.cos(shardAngle) * 200,
                this.player.y + Math.sin(shardAngle) * 200,
                {
                  id: `shrapnel_${Date.now()}_${k}`,
                  kind: 'triangle',
                  color: 'raw',
                  tier: 1,
                }
              );
              sp.damage = 18;
              sp.speed = 700;
              sp.radius = 8;
              this.playerProjectiles.push(sp);
            }
          }
        }
        currentRoom.lootDrops.splice(i, 1);
      }
    }

    if (this.meltdown.isActive && this.meltdown.timeLeft <= 0) {
      this.state = 'GAME_OVER';
      this.sound.playExplosion();
      this.sound.stopMusic();
    }
  }

  private damagePlayer(amount: number) {
    if (this.player.invulnTimer > 0) return;
    this.stats.hp -= amount;
    this.player.invulnTimer = 0.8;
    this.sound.playPlayerHurt();
    this.screenShake = 12;
    this.particles.spawnHitSparks(this.player.x, this.player.y, '#ef4444', 10);
    this.addFloatingText(`-${amount} HP`, this.player.x, this.player.y - 20, '#ef4444');

    // Reactive Plating counter-blast
    if (this.stats.perks.reactivePlating) {
      this.particles.spawnFreezeShatter(this.player.x, this.player.y);
      this.screenShake = 16;
      this.sound.playShock();
      this.addFloatingText('REACTIVE COUNTER-BLAST! 🛡️', this.player.x, this.player.y - 35, '#38bdf8');
      for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
        const b = this.enemyBullets[i];
        if (Math.hypot(b.x - this.player.x, b.y - this.player.y) < 220) {
          this.enemyBullets.splice(i, 1);
        }
      }
      const currentRoom = this.rooms[this.currentRoomIndex];
      if (currentRoom) {
        for (const enemy of currentRoom.enemies) {
          if (enemy.isDead) continue;
          if (Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y) < 220) {
            const drops = enemy.takeDamage(40, (enemy.x - this.player.x) * 1.5, (enemy.y - this.player.y) * 1.5, this.particles, this.sound);
            for (const d of drops) currentRoom.lootDrops.push(d);
          }
        }
      }
    }

    if (this.meltdown.isActive) {
      this.meltdown.damageTakenDuringMeltdown += amount;
      this.meltdown.momentum = Math.max(0, this.meltdown.momentum - 50);
    }

    if (this.stats.hp <= 0) {
      this.state = 'GAME_OVER';
      this.sound.playExplosion();
      this.sound.stopMusic();
    }
  }

  private transitionRoom(targetIndex: number, fromDirection: string) {
    if (targetIndex < 0 || targetIndex >= this.rooms.length) {
      console.error(`Invalid target room index: ${targetIndex}`);
      return;
    }

    const oldRoom = this.rooms[this.currentRoomIndex];
    let carriedScrap = 0;
    if (oldRoom && oldRoom.lootDrops && oldRoom.lootDrops.length > 0) {
      for (let i = oldRoom.lootDrops.length - 1; i >= 0; i--) {
        const drop = oldRoom.lootDrops[i];
        if (drop.type === 'SCRAP') {
          carriedScrap += drop.amount;
          oldRoom.lootDrops.splice(i, 1);
        }
      }
    }

    this.currentRoomIndex = targetIndex;
    const targetRoom = this.rooms[targetIndex];
    if (!targetRoom) return;

    targetRoom.isVisited = true;
    this.centerRoom(targetRoom);

    this.enemyBullets = [];
    this.playerProjectiles = [];

    const padding = 100;
    if (fromDirection === 'RIGHT') {
      this.player.x = targetRoom.x + padding;
      this.player.y = targetRoom.y + targetRoom.height / 2;
    } else if (fromDirection === 'LEFT') {
      this.player.x = targetRoom.x + targetRoom.width - padding;
      this.player.y = targetRoom.y + targetRoom.height / 2;
    } else if (fromDirection === 'DOWN') {
      this.player.x = targetRoom.x + targetRoom.width / 2;
      this.player.y = targetRoom.y + padding;
    } else if (fromDirection === 'UP') {
      this.player.x = targetRoom.x + targetRoom.width / 2;
      this.player.y = targetRoom.y + targetRoom.height - padding;
    }

    if (!Number.isFinite(this.player.x) || !Number.isFinite(this.player.y)) {
      this.player.x = targetRoom.x + targetRoom.width / 2;
      this.player.y = targetRoom.y + targetRoom.height / 2;
    }

    if (carriedScrap > 0) {
      this.stats.scrap += carriedScrap;
      this.sound.playPlace();
      this.addFloatingText(`+${carriedScrap} SCRAP CARRIED OVER!`, this.player.x, this.player.y - 55, '#facc15');
    }

    this.sound.playRotate();
    this.addFloatingText('SECTOR BREACH', this.player.x, this.player.y - 35, '#38bdf8');
  }

  private render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    if (this.screenShake > 0) {
      const sx = (Math.random() - 0.5) * this.screenShake;
      const sy = (Math.random() - 0.5) * this.screenShake;
      this.ctx.translate(sx, sy);
      this.screenShake = Math.max(0, this.screenShake - 0.6);
    }

    if (this.state === 'TITLE') {
      this.mainMenu.render(this.ctx, this.canvas.width, this.canvas.height, this.mouse.x, this.mouse.y);
    } else if (this.state === 'DUNGEON' || this.state === 'MELTDOWN') {
      this.renderGame();
    } else if (this.state === 'ASSEMBLY') {
      this.renderGame();
      this.gridUI.render(this.ctx, this.canvas.width, this.canvas.height, this.stats);
    } else if (this.state === 'PAUSED') {
      this.renderGame();
      this.pauseMenu.render(
        this.ctx,
        this.canvas.width,
        this.canvas.height,
        this.mouse.x,
        this.mouse.y,
        this.currentSector,
        this.gameMode
      );
    } else if (this.state === 'VICTORY' && this.finalRank) {
      this.victoryScreen.render(
        this.ctx,
        this.finalRank,
        this.canvas.width,
        this.canvas.height,
        this.currentSector,
        this.gameMode
      );
    } else if (this.state === 'GAME_OVER') {
      this.renderGameOver();
    }

    this.ctx.restore();
  }

  private renderGame() {
    const currentRoom = this.rooms[this.currentRoomIndex];
    currentRoom.render(this.ctx, this.meltdown.isActive);

    this.particles.render(this.ctx);

    for (const enemy of currentRoom.enemies) {
      enemy.render(this.ctx);
    }

    for (const b of this.enemyBullets) {
      this.ctx.save();
      this.ctx.fillStyle = b.color || '#ef4444';
      this.ctx.strokeStyle = '#000000';
      this.ctx.lineWidth = 2.5;
      this.ctx.beginPath();
      this.ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();

      // Shiny center
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(b.x - 2, b.y - 2, b.radius * 0.4, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    for (const p of this.playerProjectiles) {
      p.render(this.ctx);
    }

    // Companion Sentry Drone
    if (this.stats.perks.sentryBuddy) {
      this.buddyDrone.render(this.ctx);
    }

    const mouseDist = Math.hypot(this.mouse.x - this.player.x, this.mouse.y - this.player.y);
    this.playerRenderer.render(
      this.ctx,
      this.player.x,
      this.player.y,
      this.player.angle,
      this.meltdown.currentMach,
      this.meltdown.isSliding,
      this.player.invulnTimer > 0,
      mouseDist
    );

    for (const ft of this.floatingTexts) {
      this.ctx.save();
      this.ctx.font = 'bold 16px Courier New, monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillStyle = ft.color;
      this.ctx.strokeStyle = '#000000';
      this.ctx.lineWidth = 4;
      this.ctx.strokeText(ft.text, ft.x, ft.y);
      this.ctx.fillText(ft.text, ft.x, ft.y);
      this.ctx.restore();
    }

    this.hud.render(
      this.ctx,
      this.stats,
      this.rooms,
      this.currentRoomIndex,
      this.mouse.isDown,
      this.player.invulnTimer > 0,
      this.meltdown.currentMach,
      this.canvas.width,
      this.canvas.height,
      this.gameMode
    );
  }

  private renderGameOver() {
    this.ctx.fillStyle = 'rgba(10, 15, 26, 0.96)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const cx = this.canvas.width / 2;
    const cy = this.canvas.height * 0.35;

    this.ctx.save();
    // Dizzy Mascot Face
    const faceY = cy - 80;
    this.ctx.fillStyle = '#0284c7';
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.arc(cx, faceY, 32, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();

    // Dizzy swirl eyes
    this.ctx.fillStyle = '#ef4444';
    this.ctx.font = 'bold 22px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('@_@', cx, faceY + 7);

    // Spinning cartoon star
    const starAngle = Date.now() / 250;
    this.ctx.fillStyle = '#facc15';
    this.ctx.font = 'bold 24px monospace';
    this.ctx.fillText('★', cx + Math.cos(starAngle) * 36, faceY - 25 + Math.sin(starAngle) * 8);

    // Title
    this.ctx.fillStyle = '#ef4444';
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 6;
    this.ctx.font = '900 48px Courier New, monospace';
    this.ctx.textAlign = 'center';
    this.ctx.strokeText('FACTORY MELTDOWN: CRITICAL FAILURE', cx, cy);
    this.ctx.fillText('FACTORY MELTDOWN: CRITICAL FAILURE', cx, cy);

    this.ctx.fillStyle = '#94a3b8';
    this.ctx.font = 'bold 16px Courier New, monospace';
    this.ctx.fillText('Consumed by the security bots or sector collapse.', cx, cy + 45);

    // Return to Menu Button
    const btnW = 440;
    const btnH = 56;
    const btnX = cx - btnW / 2;
    const btnY = cy + 105;

    // 3D drop shadow
    this.ctx.fillStyle = '#000000';
    this.ctx.beginPath();
    this.ctx.roundRect(btnX, btnY + 6, btnW, btnH, 14);
    this.ctx.fill();

    // Button body
    this.ctx.fillStyle = '#10b981';
    this.ctx.beginPath();
    this.ctx.roundRect(btnX, btnY, btnW, btnH, 14);
    this.ctx.fill();
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 4;
    this.ctx.stroke();

    // Button label
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '900 18px Courier New, monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('⚡ RETURN TO MAIN MENU [SPACE / CLICK] ⚡', cx, btnY + 34);

    this.ctx.restore();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
