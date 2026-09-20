import { MachineType } from '../types';
import { ParticleSystem } from './ParticleSystem';
import { SoundManager } from '../audio/SoundManager';

export type EnemyType = 
  | 'TARGET_DUMMY' 
  | 'SCRAP_DRONE' 
  | 'LASER_TURRET' 
  | 'ROLLER_SENTRY' 
  | 'SPARK_DRONE'
  | 'TESLA_TURRET'
  | 'BITE_BOT'
  | 'ENFORCER_ELITE'
  | 'OVERSEER_BOSS'
  | 'VOLT_WARDEN'
  | 'OVERLORD_CORE';

export interface LootDrop {
  x: number;
  y: number;
  type: 'COMPONENT' | 'HEALTH' | 'SCRAP';
  componentType?: MachineType;
  amount: number;
}

export class Enemy {
  public id: string;
  public type: EnemyType;
  public x: number;
  public y: number;
  public vx: number = 0;
  public vy: number = 0;
  public radius: number;
  public hp: number;
  public maxHp: number;
  public isDead: boolean = false;
  public attackCooldown: number = 0;
  public freezeTimer: number = 0;
  public angle: number = 0;

  // Cartoon animation state
  public animTimer: number = Math.random() * 10;
  public hitFlashTimer: number = 0;
  public squashScaleX: number = 1.0;
  public squashScaleY: number = 1.0;

  // Attack state
  public chargeTimer: number = 0;
  public burstRemaining: number = 0;
  public burstInterval: number = 0;
  public isChargingDash: boolean = false;
  public dashTarget = { x: 0, y: 0 };

  // Boss & Elite state
  public isBoss: boolean = false;
  public isElite: boolean = false;
  public isEnraged: boolean = false;
  public hasSpawnedPhase2Minions: boolean = false;
  public bossAttackPattern: number = 0;
  public bossStage: 1 | 2 | 3 = 1;
  public announcedStage: number = 1;
  public recenterCooldown: number = 0;

  constructor(type: EnemyType, x: number, y: number) {
    this.id = `enemy_${Math.random().toString(36).substr(2, 9)}`;
    this.type = type;
    this.x = x;
    this.y = y;

    switch (type) {
      case 'TARGET_DUMMY':
        this.radius = 24;
        this.maxHp = 60;
        this.hp = 60;
        this.attackCooldown = 2.5;
        break;
      case 'SCRAP_DRONE':
        this.radius = 20;
        this.maxHp = 45;
        this.hp = 45;
        this.attackCooldown = 1.6 + Math.random() * 0.6;
        break;
      case 'SPARK_DRONE':
        this.radius = 22;
        this.maxHp = 50;
        this.hp = 50;
        this.attackCooldown = 1.4 + Math.random() * 0.5;
        break;
      case 'LASER_TURRET':
        this.radius = 26;
        this.maxHp = 65;
        this.hp = 65;
        this.attackCooldown = 1.4 + Math.random() * 0.4;
        break;
      case 'TESLA_TURRET':
        this.radius = 28;
        this.maxHp = 70;
        this.hp = 70;
        this.attackCooldown = 1.5 + Math.random() * 0.4;
        break;
      case 'BITE_BOT':
        this.radius = 28;
        this.maxHp = 80;
        this.hp = 80;
        this.attackCooldown = 2.4;
        break;
      case 'ENFORCER_ELITE':
        this.radius = 42;
        this.maxHp = 260;
        this.hp = 260;
        this.isElite = true;
        this.attackCooldown = 1.8 + Math.random() * 0.8;
        const randAngle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(randAngle) * 190;
        this.vy = Math.sin(randAngle) * 190;
        break;
      case 'ROLLER_SENTRY':
        this.radius = 22;
        this.maxHp = 60;
        this.hp = 60;
        this.attackCooldown = 1.8 + Math.random() * 0.8;
        const randAngle2 = Math.random() * Math.PI * 2;
        this.vx = Math.cos(randAngle2) * 190;
        this.vy = Math.sin(randAngle2) * 190;
        break;
      case 'OVERSEER_BOSS':
        this.radius = 58;
        this.maxHp = 850;
        this.hp = 850;
        this.isBoss = true;
        this.attackCooldown = 1.0;
        break;
      case 'VOLT_WARDEN':
        this.radius = 60;
        this.maxHp = 1400;
        this.hp = 1400;
        this.isBoss = true;
        this.attackCooldown = 0.9;
        break;
      case 'OVERLORD_CORE':
        this.radius = 66;
        this.maxHp = 2200;
        this.hp = 2200;
        this.isBoss = true;
        this.attackCooldown = 0.8;
        break;
    }
  }

  public getSatelliteShieldPlates(): { x: number; y: number; radius: number }[] {
    if (this.type !== 'OVERLORD_CORE' || this.isDead) return [];
    const orbitRadius = this.radius * 1.35;
    const plates: { x: number; y: number; radius: number }[] = [];
    const speed = this.isEnraged ? 2.8 : 1.6;
    for (let i = 0; i < 4; i++) {
      const orbitAngle = this.animTimer * speed + (i * Math.PI) / 2;
      plates.push({
        x: this.x + Math.cos(orbitAngle) * orbitRadius,
        y: this.y + Math.sin(orbitAngle) * orbitRadius,
        radius: 16,
      });
    }
    return plates;
  }

  public takeDamage(
    amount: number,
    knockbackX: number = 0,
    knockbackY: number = 0,
    particles: ParticleSystem,
    sound: SoundManager
  ): LootDrop[] {
    this.hp -= amount;

    // Boss heavy knockback resistance!
    if (this.isBoss) {
      if (this.type === 'OVERLORD_CORE') {
        this.vx = 0;
        this.vy = 0;
      } else {
        this.vx += knockbackX * 0.04;
        this.vy += knockbackY * 0.04;
        const currentSpeed = Math.hypot(this.vx, this.vy);
        if (currentSpeed > 35) {
          this.vx = (this.vx / currentSpeed) * 35;
          this.vy = (this.vy / currentSpeed) * 35;
        }
      }
    } else {
      this.vx += knockbackX;
      this.vy += knockbackY;
      // Retaliate: When attacked by player, immediately prepare counter-attack!
      if (this.type !== 'TARGET_DUMMY') {
        if (this.attackCooldown > 0.25) {
          this.attackCooldown = 0.25;
        }
      }
    }

    this.hitFlashTimer = 0.12;
    this.squashScaleX = 1.35;
    this.squashScaleY = 0.7;

    sound.playEnemyHurt();
    particles.spawnHitSparks(this.x, this.y, '#facc15', 6);

    if (this.isBoss) {
      const hpPct = this.hp / this.maxHp;
      if (hpPct <= 0.33) {
        this.bossStage = 3;
        this.isEnraged = true;
      } else if (hpPct <= 0.66) {
        this.bossStage = 2;
      } else {
        this.bossStage = 1;
      }
    }

    if (this.hp <= 0 && !this.isDead) {
      this.isDead = true;
      particles.spawnExplosion(this.x, this.y, this.isBoss ? 95 : 40);
      sound.playExplosion();
      return this.generateDrops();
    }
    return [];
  }

  public applyFreeze(duration: number) {
    const maxDur = this.isBoss ? 0.25 : duration;
    this.freezeTimer = Math.max(this.freezeTimer, maxDur);
  }

  public update(
    dt: number,
    playerX: number,
    playerY: number,
    roomBounds: { minX: number; maxX: number; minY: number; maxY: number }
  ): { 
    bulletsToSpawn?: { x: number; y: number; vx: number; vy: number; radius: number; color?: string; damage?: number }[];
    enemiesToSpawn?: Enemy[];
    stageAnnouncement?: string;
    screenShake?: number;
    gravitationalPull?: { x: number; y: number; force: number };
  } {
    if (this.isDead) return {};

    this.animTimer += dt;
    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;

    this.squashScaleX += (1.0 - this.squashScaleX) * dt * 10;
    this.squashScaleY += (1.0 - this.squashScaleY) * dt * 10;

    if (this.freezeTimer > 0) {
      this.freezeTimer -= dt;
      return {};
    }

    if (this.type !== 'ROLLER_SENTRY') {
      this.vx *= Math.pow(0.08, dt);
      this.vy *= Math.pow(0.08, dt);
    }

    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const distToPlayer = Math.hypot(dx, dy) || 1;
    this.angle = Math.atan2(dy, dx);

    const spawnedBullets: { x: number; y: number; vx: number; vy: number; radius: number; color?: string; damage?: number }[] = [];

    // --- AGGRESSIVE ENEMY AI LOGIC ---
    switch (this.type) {
      case 'TARGET_DUMMY': {
        // Training dummy periodically shoots harmless slow foam ball for practice
        this.attackCooldown -= dt;
        if (this.attackCooldown <= 0 && distToPlayer < 520) {
          this.attackCooldown = 1.8;
          const speed = 140;
          spawnedBullets.push({
            x: this.x,
            y: this.y - 10,
            vx: (dx / distToPlayer) * speed,
            vy: (dy / distToPlayer) * speed,
            radius: 8,
            color: '#38bdf8', // Blue foam practice pellet
            damage: 4,
          });
        }
        break;
      }

      case 'BITE_BOT':
      case 'SCRAP_DRONE': {
        // BITE-BOT / SCRAP DRONE: Waddles towards player, shoots scrap bolts from afar & lunges when close!
        this.attackCooldown -= dt;

        if (this.chargeTimer > 0) {
          // Wind-up: wiggles furiously in place before lunging
          this.chargeTimer -= dt;
          if (this.chargeTimer <= 0) {
            // LUNGE DASH!
            const lungeSpeed = 420;
            this.vx = (dx / distToPlayer) * lungeSpeed;
            this.vy = (dy / distToPlayer) * lungeSpeed;

            // Spits 3-way spread of scrap teeth!
            const baseAngle = Math.atan2(dy, dx);
            const toothSpeed = 330;
            for (let off of [-0.28, 0, 0.28]) {
              spawnedBullets.push({
                x: this.x + Math.cos(baseAngle) * 20,
                y: this.y + Math.sin(baseAngle) * 20,
                vx: Math.cos(baseAngle + off) * toothSpeed,
                vy: Math.sin(baseAngle + off) * toothSpeed,
                radius: 8,
                color: '#f87171',
                damage: 10,
              });
            }
          }
        } else {
          // Normal chase movement
          const speed = 195;
          this.x += (dx / distToPlayer) * speed * dt + this.vx * dt;
          this.y += (dy / distToPlayer) * speed * dt + this.vy * dt;

          if (this.attackCooldown <= 0 && distToPlayer < 680) {
            if (distToPlayer < 260) {
              // Close range: Wind up ferocious lunge!
              this.chargeTimer = 0.25;
              this.attackCooldown = 1.8;
            } else {
              // Mid/Long range: Spit scrap bolt immediately towards player!
              this.attackCooldown = 1.1 + Math.random() * 0.35;
              const bulletSpeed = 340;
              spawnedBullets.push({
                x: this.x + Math.cos(this.angle) * 18,
                y: this.y + Math.sin(this.angle) * 18,
                vx: (dx / distToPlayer) * bulletSpeed,
                vy: (dy / distToPlayer) * bulletSpeed,
                radius: 8,
                color: '#f87171',
                damage: 9,
              });
            }
          }
        }
        break;
      }

      case 'SPARK_DRONE': {
        // High-mobility flying spark drone - hover strafes & fires electric spark bolts!
        this.attackCooldown -= dt;

        // Flying hover strafe movement
        const strafeAngle = this.angle + (Math.PI / 2) * Math.sin(this.animTimer * 3);
        const flySpeed = 220;
        const approachDir = distToPlayer > 300 ? 1 : (distToPlayer < 180 ? -1 : 0);
        this.x += (Math.cos(this.angle) * approachDir * 120 + Math.cos(strafeAngle) * flySpeed) * dt + this.vx * dt;
        this.y += (Math.sin(this.angle) * approachDir * 120 + Math.sin(strafeAngle) * flySpeed) * dt + this.vy * dt;

        if (this.attackCooldown <= 0 && distToPlayer < 720) {
          this.attackCooldown = 1.1 + Math.random() * 0.4;
          const sparkSpeed = 390;
          if (Math.random() < 0.6) {
            // Single accurate spark bolt
            spawnedBullets.push({
              x: this.x + Math.cos(this.angle) * 18,
              y: this.y + Math.sin(this.angle) * 18,
              vx: (dx / distToPlayer) * sparkSpeed,
              vy: (dy / distToPlayer) * sparkSpeed,
              radius: 8,
              color: '#facc15',
              damage: 10,
            });
          } else {
            // Twin spark burst
            const baseA = Math.atan2(dy, dx);
            for (const off of [-0.18, 0.18]) {
              spawnedBullets.push({
                x: this.x + Math.cos(baseA) * 18,
                y: this.y + Math.sin(baseA) * 18,
                vx: Math.cos(baseA + off) * sparkSpeed,
                vy: Math.sin(baseA + off) * sparkSpeed,
                radius: 8,
                color: '#facc15',
                damage: 10,
              });
            }
          }
        }
        break;
      }

      case 'LASER_TURRET': {
        // SENTRY CYCLOPS: Charges beam telegraph then fires rapid 3-round laser burst!
        this.attackCooldown -= dt;

        if (this.chargeTimer > 0) {
          this.chargeTimer -= dt;
          if (this.chargeTimer <= 0) {
            this.burstRemaining = 3;
            this.burstInterval = 0;
          }
        } else if (this.burstRemaining > 0) {
          this.burstInterval -= dt;
          if (this.burstInterval <= 0) {
            this.burstInterval = 0.12;
            this.burstRemaining--;
            const bulletSpeed = 360;
            spawnedBullets.push({
              x: this.x + Math.cos(this.angle) * 28,
              y: this.y + Math.sin(this.angle) * 28,
              vx: (dx / distToPlayer) * bulletSpeed,
              vy: (dy / distToPlayer) * bulletSpeed,
              radius: 9,
              color: '#ef4444',
              damage: 12,
            });
          }
        } else if (this.attackCooldown <= 0 && distToPlayer < 750) {
          this.chargeTimer = 0.38; // Telegraph eye glowing before blast!
          this.attackCooldown = 1.6;
        }
        break;
      }

      case 'TESLA_TURRET': {
        // High-voltage stationary coil: charges electric plasma spread or discharges radial shockwaves!
        this.attackCooldown -= dt;

        if (this.chargeTimer > 0) {
          this.chargeTimer -= dt;
          if (this.chargeTimer <= 0) {
            // Unleash 3-way electric plasma spread
            const baseA = Math.atan2(dy, dx);
            const pSpeed = 360;
            for (const off of [-0.25, 0, 0.25]) {
              spawnedBullets.push({
                x: this.x,
                y: this.y - 20,
                vx: Math.cos(baseA + off) * pSpeed,
                vy: Math.sin(baseA + off) * pSpeed,
                radius: 10,
                color: '#38bdf8',
                damage: 13,
              });
            }
          }
        } else if (this.attackCooldown <= 0 && distToPlayer < 750) {
          this.attackCooldown = 1.5 + Math.random() * 0.4;
          if (Math.random() < 0.65) {
            // Charge direct 3-way shockwave
            this.chargeTimer = 0.35;
          } else {
            // Immediate 8-way radial static discharge!
            for (let i = 0; i < 8; i++) {
              const a = (i * Math.PI * 2) / 8;
              spawnedBullets.push({
                x: this.x,
                y: this.y - 20,
                vx: Math.cos(a) * 230,
                vy: Math.sin(a) * 230,
                radius: 8,
                color: '#facc15',
                damage: 9,
              });
            }
          }
        }
        break;
      }

      case 'ROLLER_SENTRY': {
        // BOWLING BOT: Rolls continuously, periodically shoots gyro bolts & rocket-dashes!
        this.attackCooldown -= dt;

        // Ensure rolling speed stays active
        const curSpd = Math.hypot(this.vx, this.vy);
        if (curSpd < 180 && !this.isChargingDash) {
          const a = this.angle || Math.random() * Math.PI * 2;
          this.vx = Math.cos(a) * 220;
          this.vy = Math.sin(a) * 220;
        }

        if (this.isChargingDash) {
          this.chargeTimer -= dt;
          if (this.chargeTimer <= 0) {
            this.isChargingDash = false;
            // Launch across room toward targeted point
            const targetDx = this.dashTarget.x - this.x;
            const targetDy = this.dashTarget.y - this.y;
            const targetDist = Math.hypot(targetDx, targetDy) || 1;
            const rollSpeed = 480;
            this.vx = (targetDx / targetDist) * rollSpeed;
            this.vy = (targetDy / targetDist) * rollSpeed;
          }
        } else {
          this.x += this.vx * dt;
          this.y += this.vy * dt;

          // Wall bounce
          let bounced = false;
          if (this.x - this.radius < roomBounds.minX) {
            this.x = roomBounds.minX + this.radius;
            this.vx = Math.abs(this.vx);
            bounced = true;
          } else if (this.x + this.radius > roomBounds.maxX) {
            this.x = roomBounds.maxX - this.radius;
            this.vx = -Math.abs(this.vx);
            bounced = true;
          }

          if (this.y - this.radius < roomBounds.minY) {
            this.y = roomBounds.minY + this.radius;
            this.vy = Math.abs(this.vy);
            bounced = true;
          } else if (this.y + this.radius > roomBounds.maxY) {
            this.y = roomBounds.maxY - this.radius;
            this.vy = -Math.abs(this.vy);
            bounced = true;
          }

          if (bounced) {
            // Emits 2 spark bullets on wall bounce!
            const spd = 210;
            const bAngle = Math.atan2(this.vy, this.vx) + Math.PI / 2;
            spawnedBullets.push({
              x: this.x,
              y: this.y,
              vx: Math.cos(bAngle) * spd,
              vy: Math.sin(bAngle) * spd,
              radius: 7,
              color: '#facc15',
              damage: 8,
            });
            spawnedBullets.push({
              x: this.x,
              y: this.y,
              vx: -Math.cos(bAngle) * spd,
              vy: -Math.sin(bAngle) * spd,
              radius: 7,
              color: '#facc15',
              damage: 8,
            });
          }

          if (this.attackCooldown <= 0) {
            // Periodically shoots a gyro bolt at the player while rolling!
            if (distToPlayer < 650 && Math.random() < 0.5) {
              const bSpeed = 340;
              spawnedBullets.push({
                x: this.x,
                y: this.y,
                vx: (dx / distToPlayer) * bSpeed,
                vy: (dy / distToPlayer) * bSpeed,
                radius: 8,
                color: '#38bdf8',
                damage: 10,
              });
              this.attackCooldown = 1.3;
            } else {
              // Or charges dash!
              this.isChargingDash = true;
              this.chargeTimer = 0.35;
              this.dashTarget = { x: playerX, y: playerY };
              this.attackCooldown = 2.4;
            }
          }
        }
        break;
      }

      case 'ENFORCER_ELITE': {
        // Heavy Armored Cyber Enforcer: advances and fires heavy plasma mortars + shotgun blasts
        this.attackCooldown -= dt;
        const eSpeed = 155;
        this.x += (dx / distToPlayer) * eSpeed * dt + this.vx * dt;
        this.y += (dy / distToPlayer) * eSpeed * dt + this.vy * dt;

        if (this.attackCooldown <= 0 && distToPlayer < 750) {
          this.attackCooldown = 1.5 + Math.random() * 0.4;
          if (distToPlayer < 320) {
            // Close range: 5-way heavy slag shotgun blast!
            const baseA = Math.atan2(dy, dx);
            const shotSpeed = 380;
            for (let i = -2; i <= 2; i++) {
              spawnedBullets.push({
                x: this.x + Math.cos(baseA) * 30,
                y: this.y + Math.sin(baseA) * 30,
                vx: Math.cos(baseA + i * 0.18) * shotSpeed,
                vy: Math.sin(baseA + i * 0.18) * shotSpeed,
                radius: 10,
                color: '#ef4444',
                damage: 14,
              });
            }
          } else {
            // Long range: Dual heavy void plasma mortars
            const baseA = Math.atan2(dy, dx);
            const mortarSpeed = 340;
            for (const off of [-0.15, 0.15]) {
              spawnedBullets.push({
                x: this.x + Math.cos(baseA) * 26,
                y: this.y + Math.sin(baseA) * 26,
                vx: Math.cos(baseA + off) * mortarSpeed,
                vy: Math.sin(baseA + off) * mortarSpeed,
                radius: 12,
                color: '#c084fc',
                damage: 18,
              });
            }
          }
        }
        break;
      }

      case 'OVERSEER_BOSS': {
        const hpPct = this.hp / this.maxHp;
        this.bossStage = hpPct <= 0.33 ? 3 : (hpPct <= 0.66 ? 2 : 1);
        this.isEnraged = this.bossStage === 3;

        let stageAnnouncement: string | undefined = undefined;
        let screenShake: number | undefined = undefined;
        if (this.bossStage > this.announcedStage) {
          this.announcedStage = this.bossStage;
          screenShake = 16;
          if (this.bossStage === 2) {
            stageAnnouncement = '⚠️ STAGE 2: SUPERHEATED OVERDRIVE! ⚠️';
          } else if (this.bossStage === 3) {
            stageAnnouncement = '🚨 STAGE 3: FURNACE CORE MELTDOWN! 🚨';
          }
        }

        // Check if boss was shoved into walls -> Re-center slam!
        if (this.recenterCooldown > 0) this.recenterCooldown -= dt;
        const wallMargin = 110;
        const isNearWall = (
          this.x < roomBounds.minX + wallMargin ||
          this.x > roomBounds.maxX - wallMargin ||
          this.y < roomBounds.minY + wallMargin ||
          this.y > roomBounds.maxY - wallMargin
        );
        const roomCenterX = (roomBounds.minX + roomBounds.maxX) / 2;
        const roomCenterY = (roomBounds.minY + roomBounds.maxY) / 2;

        if (isNearWall && this.recenterCooldown <= 0) {
          this.recenterCooldown = 5.0;
          const toCenterA = Math.atan2(roomCenterY - this.y, roomCenterX - this.x);
          this.vx = Math.cos(toCenterA) * 520;
          this.vy = Math.sin(toCenterA) * 520;
          this.squashScaleX = 0.6;
          this.squashScaleY = 1.4;
          for (let i = 0; i < 16; i++) {
            const a = (i * Math.PI * 2) / 16;
            spawnedBullets.push({
              x: this.x,
              y: this.y,
              vx: Math.cos(a) * 260,
              vy: Math.sin(a) * 260,
              radius: 10,
              color: '#facc15',
              damage: 14,
            });
          }
          return {
            bulletsToSpawn: spawnedBullets,
            stageAnnouncement: '★ RE-CENTER SLAM! ★',
            screenShake: 15,
          };
        }

        const enemiesToSpawn: Enemy[] = [];
        if (this.bossStage >= 2 && !this.hasSpawnedPhase2Minions) {
          this.hasSpawnedPhase2Minions = true;
          enemiesToSpawn.push(new Enemy('SCRAP_DRONE', this.x - 70, this.y + 30));
          enemiesToSpawn.push(new Enemy('SCRAP_DRONE', this.x + 70, this.y + 30));
        }

        const bossSpeed = this.bossStage === 3 ? 95 : (this.bossStage === 2 ? 75 : 52);
        this.x += (dx / distToPlayer) * bossSpeed * dt + this.vx * dt;
        this.y += (dy / distToPlayer) * bossSpeed * dt + this.vy * dt;

        this.attackCooldown -= dt;
        if (this.attackCooldown <= 0) {
          this.bossAttackPattern = (this.bossAttackPattern + 1) % 4;

          if (this.bossStage === 1) {
            // STAGE 1: Standard tactical pressure
            if (this.bossAttackPattern % 2 === 0) {
              this.attackCooldown = 1.0;
              const baseA = Math.atan2(dy, dx);
              const bSpeed = 270;
              for (const aOff of [-0.4, -0.2, 0, 0.2, 0.4]) {
                spawnedBullets.push({
                  x: this.x + Math.cos(baseA + aOff) * 45,
                  y: this.y + Math.sin(baseA + aOff) * 45,
                  vx: Math.cos(baseA + aOff) * bSpeed,
                  vy: Math.sin(baseA + aOff) * bSpeed,
                  radius: 12,
                  color: '#ef4444',
                  damage: 16,
                });
              }
            } else {
              this.attackCooldown = 1.2;
              for (let i = 0; i < 12; i++) {
                const bAngle = (i * Math.PI * 2) / 12 + this.animTimer * 2.2;
                spawnedBullets.push({
                  x: this.x,
                  y: this.y,
                  vx: Math.cos(bAngle) * 230,
                  vy: Math.sin(bAngle) * 230,
                  radius: 10,
                  color: '#f59e0b',
                  damage: 13,
                });
              }
            }
          } else if (this.bossStage === 2) {
            // STAGE 2: Slag Charge & Dual Gatling
            if (this.bossAttackPattern % 2 === 0) {
              this.attackCooldown = 1.1;
              const chargeAngle = Math.atan2(dy, dx);
              this.vx = Math.cos(chargeAngle) * 520;
              this.vy = Math.sin(chargeAngle) * 520;
              for (let i = 0; i < 16; i++) {
                const a = (i * Math.PI * 2) / 16;
                spawnedBullets.push({
                  x: this.x,
                  y: this.y,
                  vx: Math.cos(a) * 250,
                  vy: Math.sin(a) * 250,
                  radius: 11,
                  color: '#f97316',
                  damage: 16,
                });
              }
            } else {
              this.attackCooldown = 0.9;
              const baseA = Math.atan2(dy, dx);
              for (let i = 0; i < 8; i++) {
                const off = (i - 3.5) * 0.12;
                spawnedBullets.push({
                  x: this.x,
                  y: this.y,
                  vx: Math.cos(baseA + off) * 350,
                  vy: Math.sin(baseA + off) * 350,
                  radius: 10,
                  color: '#ef4444',
                  damage: 15,
                });
              }
            }
          } else {
            // STAGE 3: Double Spiral Firestorm + Homing Steam Rockets + Berserk Leaps
            this.attackCooldown = 0.75;
            if (this.bossAttackPattern === 0) {
              const count = 32;
              for (let i = 0; i < count; i++) {
                const a = (i * Math.PI * 2) / count + this.animTimer * 5.0;
                spawnedBullets.push({
                  x: this.x,
                  y: this.y,
                  vx: Math.cos(a) * 280,
                  vy: Math.sin(a) * 280,
                  radius: 11,
                  color: '#ec4899',
                  damage: 18,
                });
              }
            } else if (this.bossAttackPattern === 1) {
              const baseA = Math.atan2(dy, dx);
              for (const off of [-0.3, 0.3]) {
                spawnedBullets.push({
                  x: this.x,
                  y: this.y,
                  vx: Math.cos(baseA + off) * 380,
                  vy: Math.sin(baseA + off) * 380,
                  radius: 14,
                  color: '#facc15',
                  damage: 22,
                });
              }
            } else {
              const leapA = Math.atan2(dy, dx);
              this.vx = Math.cos(leapA) * 620;
              this.vy = Math.sin(leapA) * 620;
              screenShake = 12;
              for (let i = 0; i < 18; i++) {
                const a = (i * Math.PI * 2) / 18;
                spawnedBullets.push({
                  x: this.x,
                  y: this.y,
                  vx: Math.cos(a) * 260,
                  vy: Math.sin(a) * 260,
                  radius: 11,
                  color: '#ef4444',
                  damage: 16,
                });
              }
            }
          }
        }
        this.x = Math.max(roomBounds.minX + this.radius, Math.min(roomBounds.maxX - this.radius, this.x));
        this.y = Math.max(roomBounds.minY + this.radius, Math.min(roomBounds.maxY - this.radius, this.y));
        return { bulletsToSpawn: spawnedBullets, enemiesToSpawn, stageAnnouncement, screenShake };
      }

      case 'VOLT_WARDEN': {
        const hpPct = this.hp / this.maxHp;
        this.bossStage = hpPct <= 0.33 ? 3 : (hpPct <= 0.66 ? 2 : 1);
        this.isEnraged = this.bossStage === 3;

        let stageAnnouncement: string | undefined = undefined;
        let screenShake: number | undefined = undefined;
        let gravitationalPull: { x: number; y: number; force: number } | undefined = undefined;

        if (this.bossStage > this.announcedStage) {
          this.announcedStage = this.bossStage;
          screenShake = 18;
          if (this.bossStage === 2) {
            stageAnnouncement = '⚡ STAGE 2: HIGH-VOLTAGE SURGE OVERLOAD! ⚡';
          } else if (this.bossStage === 3) {
            stageAnnouncement = '💀 STAGE 3: GIGA-VOLT CATASTROPHIC ARC! 💀';
          }
        }

        // Check wall proximity -> Re-center leap
        if (this.recenterCooldown > 0) this.recenterCooldown -= dt;
        const wallMargin = 110;
        const isNearWall = (
          this.x < roomBounds.minX + wallMargin ||
          this.x > roomBounds.maxX - wallMargin ||
          this.y < roomBounds.minY + wallMargin ||
          this.y > roomBounds.maxY - wallMargin
        );
        const roomCenterX = (roomBounds.minX + roomBounds.maxX) / 2;
        const roomCenterY = (roomBounds.minY + roomBounds.maxY) / 2;

        if (isNearWall && this.recenterCooldown <= 0) {
          this.recenterCooldown = 5.0;
          const toCenterA = Math.atan2(roomCenterY - this.y, roomCenterX - this.x);
          this.vx = Math.cos(toCenterA) * 540;
          this.vy = Math.sin(toCenterA) * 540;
          for (let i = 0; i < 18; i++) {
            const a = (i * Math.PI * 2) / 18;
            spawnedBullets.push({
              x: this.x,
              y: this.y,
              vx: Math.cos(a) * 270,
              vy: Math.sin(a) * 270,
              radius: 11,
              color: '#38bdf8',
              damage: 15,
            });
          }
          return {
            bulletsToSpawn: spawnedBullets,
            stageAnnouncement: '★ VOLT RE-CENTER SLAM! ★',
            screenShake: 15,
          };
        }

        const enemiesToSpawn: Enemy[] = [];
        if (this.bossStage >= 2 && !this.hasSpawnedPhase2Minions) {
          this.hasSpawnedPhase2Minions = true;
          enemiesToSpawn.push(new Enemy('SPARK_DRONE', this.x - 70, this.y));
          enemiesToSpawn.push(new Enemy('SPARK_DRONE', this.x + 70, this.y));
        }

        // Stage 3 EMP vortex pull towards boss
        if (this.bossStage === 3 && distToPlayer < 480) {
          gravitationalPull = {
            x: ((this.x - playerX) / distToPlayer) * 110,
            y: ((this.y - playerY) / distToPlayer) * 110,
            force: 110,
          };
        }

        const wardenSpeed = this.bossStage === 3 ? 115 : (this.bossStage === 2 ? 85 : 60);
        this.x += (dx / distToPlayer) * wardenSpeed * dt + this.vx * dt;
        this.y += (dy / distToPlayer) * wardenSpeed * dt + this.vy * dt;

        this.attackCooldown -= dt;
        if (this.attackCooldown <= 0) {
          this.bossAttackPattern = (this.bossAttackPattern + 1) % 4;

          if (this.bossStage === 1) {
            if (this.bossAttackPattern % 2 === 0) {
              this.attackCooldown = 1.0;
              const baseA = Math.atan2(dy, dx);
              for (let i = -3; i <= 3; i++) {
                const a = baseA + i * 0.16;
                spawnedBullets.push({
                  x: this.x,
                  y: this.y,
                  vx: Math.cos(a) * 320,
                  vy: Math.sin(a) * 320,
                  radius: 11,
                  color: '#38bdf8',
                  damage: 15,
                });
              }
            } else {
              this.attackCooldown = 1.3;
              for (const off of [0.78, 2.35, 3.92, 5.49]) {
                spawnedBullets.push({
                  x: this.x,
                  y: this.y,
                  vx: Math.cos(off) * 260,
                  vy: Math.sin(off) * 260,
                  radius: 12,
                  color: '#facc15',
                  damage: 16,
                });
              }
            }
          } else if (this.bossStage === 2) {
            if (this.bossAttackPattern % 2 === 0) {
              this.attackCooldown = 1.0;
              const dashAngle = Math.atan2(dy, dx);
              this.vx = Math.cos(dashAngle) * 620;
              this.vy = Math.sin(dashAngle) * 620;
              for (const off of [-1.2, -0.6, 0, 0.6, 1.2]) {
                spawnedBullets.push({
                  x: this.x,
                  y: this.y,
                  vx: Math.cos(dashAngle + off) * 260,
                  vy: Math.sin(dashAngle + off) * 260,
                  radius: 11,
                  color: '#facc15',
                  damage: 17,
                });
              }
            } else {
              this.attackCooldown = 0.9;
              for (let i = 0; i < 16; i++) {
                const a = (i * Math.PI * 2) / 16 + this.animTimer * 1.5;
                spawnedBullets.push({
                  x: this.x,
                  y: this.y,
                  vx: Math.cos(a) * 280,
                  vy: Math.sin(a) * 280,
                  radius: 10,
                  color: '#38bdf8',
                  damage: 16,
                });
              }
            }
          } else {
            this.attackCooldown = 0.75;
            if (this.bossAttackPattern % 2 === 0) {
              const count = 24;
              for (let i = 0; i < count; i++) {
                const a = (i * Math.PI * 2) / count + this.animTimer * 2.8;
                spawnedBullets.push({
                  x: this.x,
                  y: this.y,
                  vx: Math.cos(a) * 290,
                  vy: Math.sin(a) * 290,
                  radius: 12,
                  color: '#ec4899',
                  damage: 18,
                });
              }
            } else {
              const baseA = Math.atan2(dy, dx);
              for (const off of [-0.2, 0, 0.2]) {
                spawnedBullets.push({
                  x: this.x,
                  y: this.y,
                  vx: Math.cos(baseA + off) * 440,
                  vy: Math.sin(baseA + off) * 440,
                  radius: 16,
                  color: '#c084fc',
                  damage: 24,
                });
              }
            }
          }
        }
        this.x = Math.max(roomBounds.minX + this.radius, Math.min(roomBounds.maxX - this.radius, this.x));
        this.y = Math.max(roomBounds.minY + this.radius, Math.min(roomBounds.maxY - this.radius, this.y));
        return { bulletsToSpawn: spawnedBullets, enemiesToSpawn, stageAnnouncement, screenShake, gravitationalPull };
      }

      case 'OVERLORD_CORE': {
        const hpPct = this.hp / this.maxHp;
        this.bossStage = hpPct <= 0.33 ? 3 : (hpPct <= 0.66 ? 2 : 1);
        this.isEnraged = this.bossStage === 3;

        let stageAnnouncement: string | undefined = undefined;
        let screenShake: number | undefined = undefined;
        let gravitationalPull: { x: number; y: number; force: number } | undefined = undefined;

        if (this.bossStage > this.announcedStage) {
          this.announcedStage = this.bossStage;
          screenShake = 22;
          if (this.bossStage === 2) {
            stageAnnouncement = '☣️ STAGE 2: MATRIX PROTOCOL CORRUPTION! ☣️';
          } else if (this.bossStage === 3) {
            stageAnnouncement = '🌌 STAGE 3: BLACK HOLE SINGULARITY COLLAPSE! 🌌';
          }
        }

        const enemiesToSpawn: Enemy[] = [];
        if (this.bossStage >= 2 && !this.hasSpawnedPhase2Minions) {
          this.hasSpawnedPhase2Minions = true;
          enemiesToSpawn.push(new Enemy('SPARK_DRONE', this.x - 90, this.y - 50));
          enemiesToSpawn.push(new Enemy('SPARK_DRONE', this.x + 90, this.y - 50));
        }

        // Anchored Titan Core - zero knockback, always hovers around center
        const hoverX = roomBounds.minX + (roomBounds.maxX - roomBounds.minX) / 2 + Math.cos(this.animTimer * 1.5) * 80;
        const hoverY = roomBounds.minY + (roomBounds.maxY - roomBounds.minY) / 2 + Math.sin(this.animTimer * 1.2) * 50;
        this.x += (hoverX - this.x) * dt * (this.bossStage === 3 ? 3.5 : 2.2);
        this.y += (hoverY - this.y) * dt * (this.bossStage === 3 ? 3.5 : 2.2);
        this.vx = 0;
        this.vy = 0;

        // Stage 3: Intense Black Hole Gravitational Pull
        if (this.bossStage === 3) {
          gravitationalPull = {
            x: this.x,
            y: this.y,
            force: 90,
          };
        }

        this.attackCooldown -= dt;
        if (this.attackCooldown <= 0) {
          this.bossAttackPattern = (this.bossAttackPattern + 1) % 4;

          if (this.bossStage === 1) {
            if (this.bossAttackPattern % 2 === 0) {
              this.attackCooldown = 0.95;
              const count = 24;
              for (let i = 0; i < count; i++) {
                const a = (i * Math.PI * 2) / count + this.animTimer * 3.8;
                spawnedBullets.push({
                  x: this.x,
                  y: this.y,
                  vx: Math.cos(a) * 260,
                  vy: Math.sin(a) * 260,
                  radius: 11,
                  color: '#a855f7',
                  damage: 16,
                });
              }
            } else {
              this.attackCooldown = 0.85;
              const baseA = Math.atan2(dy, dx);
              for (const off of [-0.2, -0.1, 0, 0.1, 0.2]) {
                spawnedBullets.push({
                  x: this.x + Math.cos(baseA) * 50,
                  y: this.y + Math.sin(baseA) * 50,
                  vx: Math.cos(baseA + off) * 380,
                  vy: Math.sin(baseA + off) * 380,
                  radius: 12,
                  color: '#ef4444',
                  damage: 18,
                });
              }
            }
          } else if (this.bossStage === 2) {
            this.attackCooldown = 0.75;
            if (this.bossAttackPattern % 2 === 0) {
              const plates = this.getSatelliteShieldPlates();
              for (const plate of plates) {
                const pAngle = Math.atan2(plate.y - this.y, plate.x - this.x);
                for (const aOff of [-0.25, 0, 0.25]) {
                  spawnedBullets.push({
                    x: plate.x,
                    y: plate.y,
                    vx: Math.cos(pAngle + aOff) * 300,
                    vy: Math.sin(pAngle + aOff) * 300,
                    radius: 10,
                    color: '#c084fc',
                    damage: 16,
                  });
                }
              }
            } else {
              const baseA = Math.atan2(dy, dx);
              for (let i = -3.5; i <= 3.5; i += 1.0) {
                const a = baseA + i * 0.09;
                spawnedBullets.push({
                  x: this.x,
                  y: this.y,
                  vx: Math.cos(a) * 420,
                  vy: Math.sin(a) * 420,
                  radius: 12,
                  color: '#ef4444',
                  damage: 19,
                });
              }
            }
          } else {
            this.attackCooldown = 0.65;
            if (this.bossAttackPattern % 2 === 0) {
              const count = 40;
              for (let i = 0; i < count; i++) {
                const a = (i * Math.PI * 2) / count + this.animTimer * 5.2;
                const spd = i % 2 === 0 ? 320 : 230;
                spawnedBullets.push({
                  x: this.x,
                  y: this.y,
                  vx: Math.cos(a) * spd,
                  vy: Math.sin(a) * spd,
                  radius: 12,
                  color: i % 2 === 0 ? '#a855f7' : '#ec4899',
                  damage: 20,
                });
              }
            } else {
              const baseA = Math.atan2(dy, dx);
              for (let i = 0; i < 7; i++) {
                const off = (i - 3) * 0.15;
                spawnedBullets.push({
                  x: this.x,
                  y: this.y,
                  vx: Math.cos(baseA + off) * 460,
                  vy: Math.sin(baseA + off) * 460,
                  radius: 14,
                  color: '#facc15',
                  damage: 22,
                });
              }
            }
          }
        }
        this.x = Math.max(roomBounds.minX + this.radius, Math.min(roomBounds.maxX - this.radius, this.x));
        this.y = Math.max(roomBounds.minY + this.radius, Math.min(roomBounds.maxY - this.radius, this.y));
        return { bulletsToSpawn: spawnedBullets, enemiesToSpawn, stageAnnouncement, screenShake, gravitationalPull };
      }
    }

    this.x = Math.max(roomBounds.minX + this.radius, Math.min(roomBounds.maxX - this.radius, this.x));
    this.y = Math.max(roomBounds.minY + this.radius, Math.min(roomBounds.maxY - this.radius, this.y));

    return { bulletsToSpawn: spawnedBullets };
  }

  public applyHardMode() {
    this.maxHp = Math.round(this.maxHp * 1.35);
    this.hp = this.maxHp;
    this.attackCooldown *= 0.75;
  }

  private generateDrops(): LootDrop[] {
    const drops: LootDrop[] = [];

    if (this.type === 'TARGET_DUMMY') {
      // Rebalanced scrap + cutter so first room provides initial funds
      drops.push({
        x: this.x - 12,
        y: this.y,
        type: 'SCRAP',
        amount: 15,
      });
      drops.push({
        x: this.x + 12,
        y: this.y,
        type: 'COMPONENT',
        componentType: 'CUTTER',
        amount: 1,
      });
      return drops;
    }

    if (this.isBoss) {
      const legendary: MachineType[] = ['STACKER', 'SPLITTER', 'DYE_VAT_PURPLE', 'OVERCLOCKER', 'EXPANDER', 'MERGER'];
      drops.push({
        x: this.x,
        y: this.y - 15,
        type: 'SCRAP',
        amount: 60 + Math.floor(Math.random() * 20),
      });
      drops.push({
        x: this.x - 20,
        y: this.y + 10,
        type: 'HEALTH',
        amount: 40,
      });
      drops.push({
        x: this.x + 20,
        y: this.y + 10,
        type: 'COMPONENT',
        componentType: legendary[Math.floor(Math.random() * legendary.length)],
        amount: 2,
      });
      return drops;
    }

    if (this.isElite) {
      drops.push({
        x: this.x - 10,
        y: this.y,
        type: 'SCRAP',
        amount: 28,
      });
      const pool: MachineType[] = ['STACKER', 'DYE_VAT_RED', 'DYE_VAT_BLUE', 'DYE_VAT_PURPLE', 'OVERCLOCKER', 'EXPANDER', 'EMITTER_STAR'];
      drops.push({
        x: this.x + 10,
        y: this.y,
        type: 'COMPONENT',
        componentType: pool[Math.floor(Math.random() * pool.length)],
        amount: 1,
      });
      return drops;
    }

    const roll = Math.random();
    if (roll < 0.45) {
      const pool: MachineType[] = [
        'BELT',
        'EMITTER_CIRCLE',
        'EMITTER_SQUARE',
        'EMITTER_STAR',
        'CUTTER',
        'DYE_VAT_RED',
        'DYE_VAT_BLUE',
        'MERGER',
      ];
      drops.push({
        x: this.x,
        y: this.y,
        type: 'COMPONENT',
        componentType: pool[Math.floor(Math.random() * pool.length)],
        amount: 1,
      });
    } else if (roll < 0.7) {
      drops.push({
        x: this.x,
        y: this.y,
        type: 'HEALTH',
        amount: 25,
      });
    } else {
      drops.push({
        x: this.x,
        y: this.y,
        type: 'SCRAP',
        amount: Math.floor(8 + Math.random() * 8),
      });
    }
    return drops;
  }

  public render(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const isFrozen = this.freezeTimer > 0;
    const isFlash = this.hitFlashTimer > 0;

    // Telegraph laser beam for Sentry Turret when charging!
    if (this.type === 'LASER_TURRET' && this.chargeTimer > 0) {
      ctx.save();
      ctx.rotate(this.angle);
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(25, 0);
      ctx.lineTo(600, 0);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    ctx.scale(this.squashScaleX, this.squashScaleY);

    // Floor Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(0, this.radius * 0.85, this.radius * 0.9, this.radius * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    switch (this.type) {
      case 'TARGET_DUMMY': {
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, this.radius * 0.8);
        ctx.lineTo(-6, this.radius * 0.5);
        ctx.lineTo(6, this.radius * 0.2);
        ctx.lineTo(0, 0);
        ctx.stroke();

        ctx.fillStyle = isFlash ? '#ffffff' : '#f59e0b';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(0, -6, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(0, -6, this.radius * 0.65, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, -6, this.radius * 0.35, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('TRAIN', 0, -22);
        break;
      }

      case 'BITE_BOT':
      case 'SCRAP_DRONE': {
        ctx.rotate(this.angle);

        // Waddling feet
        const footWaddle = Math.sin(this.animTimer * 18) * 7;
        ctx.fillStyle = '#334155';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.5;
        ctx.fillRect(-12, 10 + footWaddle, 8, 6);
        ctx.strokeRect(-12, 10 + footWaddle, 8, 6);
        ctx.fillRect(4, 10 - footWaddle, 8, 6);
        ctx.strokeRect(4, 10 - footWaddle, 8, 6);

        // Body
        ctx.fillStyle = isFlash ? '#ffffff' : isFrozen ? '#38bdf8' : '#dc2626';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3.5;
        ctx.fillRect(-this.radius, -this.radius * 0.8, this.radius * 2, this.radius * 1.6);
        ctx.strokeRect(-this.radius, -this.radius * 0.8, this.radius * 2, this.radius * 1.6);

        // Snapping teeth jaw
        const chomp = Math.abs(Math.sin(this.animTimer * 14)) * 9;
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, -chomp / 2, this.radius, chomp);

        ctx.fillStyle = '#ffffff';
        for (let i = 2; i < this.radius - 2; i += 6) {
          ctx.beginPath();
          ctx.moveTo(i, -chomp / 2);
          ctx.lineTo(i + 3, -chomp / 2 + 4);
          ctx.lineTo(i + 6, -chomp / 2);
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(i, chomp / 2);
          ctx.lineTo(i + 3, chomp / 2 - 4);
          ctx.lineTo(i + 6, chomp / 2);
          ctx.fill();
        }

        // Cartoon Googly Eye
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(-4, -6, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(-2, -6, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Propeller
        ctx.save();
        ctx.translate(0, -this.radius * 0.8 - 4);
        ctx.rotate(this.animTimer * 25);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-12, -2, 24, 4);
        ctx.restore();
        break;
      }

      case 'ROLLER_SENTRY': {
        ctx.rotate(this.angle);

        ctx.fillStyle = isFlash ? '#ffffff' : isFrozen ? '#38bdf8' : '#0284c7';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.beginPath();
        ctx.arc(-6, -6, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#78350f';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.5;
        ctx.fillRect(0, -8, 14, 16);
        ctx.strokeRect(0, -8, 14, 16);

        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(7, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(4, 7, 5, 0.2, Math.PI - 0.2);
        ctx.stroke();
        break;
      }

      case 'LASER_TURRET': {
        ctx.fillStyle = '#facc15';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.fillRect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);
        ctx.strokeRect(-this.radius, -this.radius, this.radius * 2, this.radius * 2);

        ctx.fillStyle = '#000000';
        ctx.fillRect(-this.radius + 6, -this.radius, 6, this.radius * 2);
        ctx.fillRect(this.radius - 12, -this.radius, 6, this.radius * 2);

        ctx.save();
        ctx.rotate(this.angle);

        ctx.fillStyle = '#475569';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.fillRect(8, -6, 20, 12);
        ctx.strokeRect(8, -6, 20, 12);

        // Blinking charging eye
        const isCharging = this.chargeTimer > 0;
        ctx.fillStyle = isFlash ? '#ffffff' : isCharging ? '#ef4444' : isFrozen ? '#38bdf8' : '#e11d48';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, isCharging ? 16 : 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(5, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(6, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
        break;
      }

      case 'OVERSEER_BOSS': {
        // Dual Chimneys
        ctx.fillStyle = '#78350f';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.fillRect(-38, -this.radius - 18, 18, 24);
        ctx.strokeRect(-38, -this.radius - 18, 18, 24);
        ctx.fillRect(20, -this.radius - 18, 18, 24);
        ctx.strokeRect(20, -this.radius - 18, 18, 24);

        const smokeBob = (this.animTimer * 30) % 20;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(-29, -this.radius - 24 - smokeBob, 8 + smokeBob * 0.4, 0, Math.PI * 2);
        ctx.arc(29, -this.radius - 24 - smokeBob, 8 + smokeBob * 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Boiler Body
        ctx.fillStyle = isFlash ? '#ffffff' : isFrozen ? '#38bdf8' : '#b91c1c';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.78, 0, Math.PI * 2);
        ctx.stroke();

        // Roaring Furnace Mouth
        const mouthOpen = 14 + Math.sin(this.animTimer * 8) * 6;
        ctx.fillStyle = '#000000';
        ctx.fillRect(-28, 4, 56, mouthOpen);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeRect(-28, 4, 56, mouthOpen);

        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(0, 4 + mouthOpen / 2, 14, 0, Math.PI);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        for (let x = -26; x <= 22; x += 8) {
          ctx.beginPath();
          ctx.moveTo(x, 4);
          ctx.lineTo(x + 4, 10);
          ctx.lineTo(x + 8, 4);
          ctx.fill();
        }

        // Eyes
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(-16, -18, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(16, -18, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ef4444';
        const eyeOffset = Math.sin(this.angle) * 4;
        ctx.beginPath();
        ctx.arc(-16 + Math.cos(this.angle) * 4, -18 + eyeOffset, 6, 0, Math.PI * 2);
        ctx.arc(16 + Math.cos(this.angle) * 4, -18 + eyeOffset, 6, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'SPARK_DRONE': {
        const hoverBob = Math.sin(this.animTimer * 10) * 4;
        ctx.translate(0, hoverBob);
        ctx.rotate(this.angle);

        // Hover wings
        ctx.fillStyle = '#0284c7';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, -this.radius);
        ctx.lineTo(-this.radius * 0.8, -this.radius * 1.3);
        ctx.lineTo(this.radius * 0.8, -this.radius * 1.3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Main Drone Body (Speedy Diamond)
        ctx.fillStyle = isFlash ? '#ffffff' : isFrozen ? '#38bdf8' : '#facc15';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(this.radius * 1.1, 0);
        ctx.lineTo(-this.radius * 0.8, this.radius * 0.8);
        ctx.lineTo(-this.radius * 0.4, 0);
        ctx.lineTo(-this.radius * 0.8, -this.radius * 0.8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Lightning Antenna on Top
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(4, -14);
        ctx.lineTo(0, -18);
        ctx.lineTo(8, -26);
        ctx.stroke();

        // Spark spark ball on antenna tip
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(8, -26, 4, 0, Math.PI * 2);
        ctx.fill();

        // Googly Eye
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(2, 0, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.arc(4, 0, 3.5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'TESLA_TURRET': {
        // Base
        ctx.fillStyle = '#334155';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.fillRect(-this.radius, -this.radius * 0.4, this.radius * 2, this.radius * 1.4);
        ctx.strokeRect(-this.radius, -this.radius * 0.4, this.radius * 2, this.radius * 1.4);

        // Hazard stripes
        ctx.fillStyle = '#facc15';
        for (let x = -this.radius + 6; x < this.radius - 6; x += 16) {
          ctx.fillRect(x, -this.radius * 0.4 + 4, 8, this.radius * 1.4 - 8);
        }

        // Copper Coils Stack
        for (let i = 0; i < 3; i++) {
          const coilY = -this.radius * 0.4 - (i + 1) * 10;
          ctx.fillStyle = '#b45309';
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2.5;
          ctx.fillRect(-this.radius * 0.6, coilY, this.radius * 1.2, 8);
          ctx.strokeRect(-this.radius * 0.6, coilY, this.radius * 1.2, 8);
        }

        // Plasma Globe at top
        const globeY = -this.radius * 0.4 - 42;
        ctx.fillStyle = isFlash ? '#ffffff' : isFrozen ? '#38bdf8' : '#0284c7';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(0, globeY, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Pulsing electric plasma center
        const plasmaPulse = Math.sin(this.animTimer * 15) * 3;
        ctx.fillStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(0, globeY, 8 + plasmaPulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Animated sparks
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-6, globeY - 6);
        ctx.lineTo(0, globeY + 4);
        ctx.lineTo(6, globeY - 4);
        ctx.stroke();
        break;
      }

      case 'VOLT_WARDEN': {
        // SECTOR 2 BOSS: Heavy Iron Titan with Dual Tesla Pylons
        // Shoulder Tesla Pylons
        for (let side of [-1, 1]) {
          const px = side * 44;
          const py = -this.radius * 0.5;

          ctx.fillStyle = '#475569';
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 3;
          ctx.fillRect(px - 10, py - 20, 20, 30);
          ctx.strokeRect(px - 10, py - 20, 20, 30);

          // Glowing pylon tip
          ctx.fillStyle = '#38bdf8';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.arc(px, py - 24, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // Heavy Torso
        ctx.fillStyle = isFlash ? '#ffffff' : isFrozen ? '#38bdf8' : '#1e293b';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.roundRect(-this.radius, -this.radius * 0.7, this.radius * 2, this.radius * 1.5, 14);
        ctx.fill();
        ctx.stroke();

        // Electric lightning chest emblem
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.moveTo(0, -16);
        ctx.lineTo(12, 0);
        ctx.lineTo(2, 0);
        ctx.lineTo(6, 20);
        ctx.lineTo(-12, 4);
        ctx.lineTo(-2, 4);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Visor Eye Strip
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-30, -32, 60, 14);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(-30, -32, 60, 14);

        // Scanning eye
        const scanX = Math.sin(this.animTimer * 6) * 20;
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 10;
        ctx.fillRect(scanX - 5, -30, 10, 10);
        ctx.shadowBlur = 0;
        break;
      }

      case 'OVERLORD_CORE': {
        // SECTOR 3 GRAND FINALE BOSS: Cybernetic Hive Core
        // Orbiting Satellite Shield Plates (4 plates)
        const orbitRadius = this.radius * 1.35;
        const orbitSpeed = this.isEnraged ? 2.8 : 1.6;
        for (let i = 0; i < 4; i++) {
          const orbitAngle = this.animTimer * orbitSpeed + (i * Math.PI) / 2;
          const sx = Math.cos(orbitAngle) * orbitRadius;
          const sy = Math.sin(orbitAngle) * orbitRadius;

          ctx.save();
          ctx.translate(sx, sy);
          ctx.rotate(orbitAngle);

          ctx.fillStyle = this.isEnraged ? '#701a75' : '#4c1d95';
          ctx.strokeStyle = this.isEnraged ? '#ef4444' : '#facc15';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(-14, -8, 28, 16, 4);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = this.isEnraged ? '#f43f5e' : '#38bdf8';
          ctx.fillRect(-6, -3, 12, 6);
          ctx.restore();
        }

        // Shield energy ring
        ctx.strokeStyle = this.isEnraged ? 'rgba(239, 68, 68, 0.45)' : 'rgba(192, 132, 252, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, orbitRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Core Outer Chassis
        ctx.fillStyle = isFlash ? '#ffffff' : isFrozen ? '#38bdf8' : '#312e81';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Inner Gear Teeth Ring
        ctx.save();
        ctx.rotate(this.animTimer * 0.8);
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 4;
        ctx.setLineDash([12, 10]);
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.75, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Central Reactor Eye
        const eyePulse = Math.sin(this.animTimer * 8) * 4;
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 25;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.45 + eyePulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Pupil tracking player
        ctx.fillStyle = '#000000';
        const pDist = 8;
        const px = Math.cos(this.angle) * pDist;
        const py = Math.sin(this.angle) * pDist;
        ctx.beginPath();
        ctx.arc(px, py, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(px - 3, py - 3, 4, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'ENFORCER_ELITE': {
        // Heavy Cyber Enforcer Brute
        ctx.rotate(this.angle);

        // Heavy armor tread tracks
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.fillRect(-this.radius * 0.9, -this.radius * 0.9, this.radius * 1.8, 12);
        ctx.strokeRect(-this.radius * 0.9, -this.radius * 0.9, this.radius * 1.8, 12);
        ctx.fillRect(-this.radius * 0.9, this.radius * 0.9 - 12, this.radius * 1.8, 12);
        ctx.strokeRect(-this.radius * 0.9, this.radius * 0.9 - 12, this.radius * 1.8, 12);

        // Heavy armored torso
        ctx.fillStyle = isFlash ? '#ffffff' : isFrozen ? '#38bdf8' : '#475569';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.fillRect(-this.radius * 0.75, -this.radius * 0.65, this.radius * 1.5, this.radius * 1.3);
        ctx.strokeRect(-this.radius * 0.75, -this.radius * 0.65, this.radius * 1.5, this.radius * 1.3);

        // Front cannon barrel
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(this.radius * 0.4, -8, 20, 16);
        ctx.strokeRect(this.radius * 0.4, -8, 20, 16);

        // Glowing red visor
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 10;
        ctx.fillRect(-4, -5, 14, 10);
        ctx.shadowBlur = 0;
        break;
      }
    }

    // Comic Health Bar & Badges
    if (this.isBoss || this.isElite || this.hp < this.maxHp) {
      const barW = this.isBoss ? this.radius * 2.8 : this.radius * 2.2;
      const barH = this.isBoss ? 10 : 7;
      const barY = -this.radius - (this.isBoss ? 20 : 14);

      ctx.fillStyle = '#000000';
      ctx.fillRect(-barW / 2 - 2, barY - 2, barW + 4, barH + 4);

      const hpFrac = Math.max(0, this.hp / this.maxHp);
      ctx.fillStyle = this.isEnraged ? '#f97316' : '#ef4444';
      ctx.fillRect(-barW / 2, barY, barW * hpFrac, barH);

      if (this.isBoss) {
        ctx.fillStyle = this.isEnraged ? '#ef4444' : '#ffffff';
        ctx.font = '900 12px Courier New, monospace';
        ctx.textAlign = 'center';
        const bossName = this.isEnraged ? '🔥 ENRAGED BOSS 🔥' : 'BOSS OVERSEER';
        ctx.fillText(bossName, 0, barY - 6);
      } else if (this.isElite) {
        ctx.fillStyle = '#facc15';
        ctx.font = '900 11px Courier New, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('★ ELITE ★', 0, barY - 4);
      }
    }

    // Enraged fiery aura ring
    if (this.isBoss && this.isEnraged) {
      const auraPulse = Math.sin(this.animTimer * 14) * 6;
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3.5;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 14 + auraPulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }
}
