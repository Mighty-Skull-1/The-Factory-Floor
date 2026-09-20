import { Enemy, LootDrop } from './Enemy';
import { ParticleSystem } from './ParticleSystem';
import { SoundManager } from '../audio/SoundManager';

export class BuddyDrone {
  public x: number = 0;
  public y: number = 0;
  public angle: number = 0;
  private animTimer: number = 0;
  private shootCooldown: number = 0.5;

  constructor() {}

  public update(
    dt: number,
    playerX: number,
    playerY: number,
    enemies: Enemy[],
    lootDrops: LootDrop[],
    particles: ParticleSystem,
    sound: SoundManager
  ): {
    bulletsToSpawn: { x: number; y: number; vx: number; vy: number; radius: number; color: string; damage: number }[];
    collectedScrap: number;
  } {
    this.animTimer += dt;

    // Hover-orbit around the player
    const orbitRadius = 62;
    const orbitAngle = this.animTimer * 2.2;
    const targetX = playerX + Math.cos(orbitAngle) * orbitRadius;
    const targetY = playerY + Math.sin(orbitAngle) * (orbitRadius * 0.7) - 15;

    this.x += (targetX - this.x) * dt * 8;
    this.y += (targetY - this.y) * dt * 8;

    const bulletsToSpawn: { x: number; y: number; vx: number; vy: number; radius: number; color: string; damage: number }[] = [];
    let collectedScrap = 0;

    // 1. Auto-collect nearby scrap within vacuum radius
    for (let i = lootDrops.length - 1; i >= 0; i--) {
      const drop = lootDrops[i];
      if (drop.type === 'SCRAP') {
        const d = Math.hypot(drop.x - this.x, drop.y - this.y);
        if (d < 180) {
          // Magnet pull toward drone
          const pullAngle = Math.atan2(playerY - drop.y, playerX - drop.x);
          drop.x += Math.cos(pullAngle) * 320 * dt;
          drop.y += Math.sin(pullAngle) * 320 * dt;

          const toPlayerDist = Math.hypot(drop.x - playerX, drop.y - playerY);
          if (toPlayerDist < 35) {
            collectedScrap += drop.amount;
            lootDrops.splice(i, 1);
            particles.spawnHitSparks(playerX, playerY, '#facc15', 6);
            sound.playPlace();
          }
        }
      }
    }

    // 2. Auto-target nearest living enemy with scrap darts
    this.shootCooldown -= dt;
    if (this.shootCooldown <= 0) {
      let closestEnemy: Enemy | null = null;
      let minDist = 440;

      for (const e of enemies) {
        if (e.isDead || e.type === 'TARGET_DUMMY') continue;
        const d = Math.hypot(e.x - this.x, e.y - this.y);
        if (d < minDist) {
          minDist = d;
          closestEnemy = e;
        }
      }

      if (closestEnemy) {
        this.shootCooldown = 0.85;
        this.angle = Math.atan2(closestEnemy.y - this.y, closestEnemy.x - this.x);
        const speed = 720;
        bulletsToSpawn.push({
          x: this.x,
          y: this.y,
          vx: Math.cos(this.angle) * speed,
          vy: Math.sin(this.angle) * speed,
          radius: 7,
          color: '#facc15',
          damage: 22,
        });
        sound.playShoot();
        particles.spawnHitSparks(this.x, this.y, '#facc15', 5);
      }
    }

    return { bulletsToSpawn, collectedScrap };
  }

  public render(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const bob = Math.sin(this.animTimer * 6) * 3;
    ctx.translate(0, bob);

    // Drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 18 - bob, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Drone Antenna
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(0, -20);
    ctx.stroke();

    // Antenna Blinking Tip
    ctx.fillStyle = Math.sin(this.animTimer * 8) > 0 ? '#ef4444' : '#22c55e';
    ctx.beginPath();
    ctx.arc(0, -21, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Drone Body (Spherical Cartoon Bot)
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Metallic Visor Glass
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(-8, -4, 16, 9, 4);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Glowing Yellow Camera Eye
    const eyeOffsetX = Math.cos(this.angle) * 3;
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(eyeOffsetX, 0.5, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Cute side thrusters
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-16, -2, 3, 6);
    ctx.fillRect(13, -2, 3, 6);

    // Thruster Flame Puffs
    if (Math.sin(this.animTimer * 20) > 0) {
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(-14.5, 7, 2, 0, Math.PI * 2);
      ctx.arc(14.5, 7, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
