import { ColorType } from '../types';
import { AcidPuddle } from '../weapon/Projectile';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  alpha: number;
  shape?: 'circle' | 'line' | 'square';
}

export interface SpeedLine {
  x: number;
  y: number;
  length: number;
  vx: number;
  vy: number;
  alpha: number;
}

export class ParticleSystem {
  public particles: Particle[] = [];
  public speedLines: SpeedLine[] = [];
  public acidPuddles: AcidPuddle[] = [];

  public update(dt: number) {
    // 1. Regular particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha = Math.max(0, p.life / p.maxLife);
      p.size = Math.max(0.5, p.size * (1 - dt * 0.5));
    }

    // 2. Speed lines (for Mach sprint)
    for (let i = this.speedLines.length - 1; i >= 0; i--) {
      const s = this.speedLines[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.alpha -= dt * 2.5;
      if (s.alpha <= 0) {
        this.speedLines.splice(i, 1);
      }
    }

    // 3. Acid puddles
    for (let i = this.acidPuddles.length - 1; i >= 0; i--) {
      const puddle = this.acidPuddles[i];
      puddle.life -= dt;
      if (puddle.life <= 0) {
        this.acidPuddles.splice(i, 1);
      }
    }
  }

  public spawnMuzzleFlash(x: number, y: number, angle: number, color: ColorType) {
    const colMap: Record<ColorType, string> = {
      raw: '#cbd5e1',
      red: '#f87171',
      blue: '#67e8f9',
      yellow: '#fde047',
      green: '#86efac',
      purple: '#c084fc',
    };
    const col = colMap[color] || '#ffffff';

    for (let i = 0; i < 6; i++) {
      const spread = (Math.random() - 0.5) * 0.8;
      const speed = 120 + Math.random() * 180;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle + spread) * speed,
        vy: Math.sin(angle + spread) * speed,
        color: col,
        size: 3 + Math.random() * 3,
        life: 0.1 + Math.random() * 0.1,
        maxLife: 0.2,
        alpha: 1.0,
      });
    }
  }

  public spawnHitSparks(x: number, y: number, color: string = '#f59e0b', count: number = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 200;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 2 + Math.random() * 3,
        life: 0.15 + Math.random() * 0.25,
        maxLife: 0.4,
        alpha: 1.0,
      });
    }
  }

  public spawnExplosion(x: number, y: number, radius: number = 50) {
    // Blast core
    for (let i = 0; i < 24; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * (radius * 5);
      const isFire = Math.random() > 0.3;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: isFire ? '#ef4444' : '#fbbf24',
        size: 5 + Math.random() * 7,
        life: 0.25 + Math.random() * 0.35,
        maxLife: 0.6,
        alpha: 1.0,
      });
    }

    // Smoke
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 20 + Math.random() * 40;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: '#475569',
        size: 8 + Math.random() * 10,
        life: 0.4 + Math.random() * 0.4,
        maxLife: 0.8,
        alpha: 0.7,
      });
    }
  }

  public spawnFreezeShatter(x: number, y: number) {
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 180;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: '#bae6fd',
        size: 3 + Math.random() * 4,
        life: 0.3 + Math.random() * 0.3,
        maxLife: 0.6,
        alpha: 1.0,
        shape: 'square',
      });
    }
  }

  public spawnSpeedLines(playerX: number, playerY: number, playerVx: number, playerVy: number) {
    const angle = Math.atan2(playerVy, playerVx);
    for (let i = 0; i < 2; i++) {
      const offsetDist = (Math.random() - 0.5) * 80;
      const perpAngle = angle + Math.PI / 2;
      const startX = playerX + Math.cos(perpAngle) * offsetDist - Math.cos(angle) * 30;
      const startY = playerY + Math.sin(perpAngle) * offsetDist - Math.sin(angle) * 30;

      this.speedLines.push({
        x: startX,
        y: startY,
        length: 40 + Math.random() * 60,
        vx: -Math.cos(angle) * 300,
        vy: -Math.sin(angle) * 300,
        alpha: 0.8,
      });
    }
  }

  public spawnAcidPuddle(x: number, y: number, radius: number = 38) {
    this.acidPuddles.push({
      x,
      y,
      radius,
      life: 3.5,
      maxLife: 3.5,
      damagePerSec: 15,
    });
  }

  public render(ctx: CanvasRenderingContext2D) {
    // 1. Render acid puddles
    for (const puddle of this.acidPuddles) {
      const alpha = Math.min(1.0, puddle.life / 0.5) * 0.55;
      ctx.fillStyle = `rgba(34, 197, 94, ${alpha})`;
      ctx.beginPath();
      ctx.arc(puddle.x, puddle.y, puddle.radius, 0, Math.PI * 2);
      ctx.fill();

      // Inner toxic bubbles
      ctx.fillStyle = `rgba(134, 239, 172, ${alpha * 1.5})`;
      ctx.beginPath();
      ctx.arc(puddle.x + Math.sin(puddle.life * 5) * 8, puddle.y + Math.cos(puddle.life * 5) * 8, puddle.radius * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Render speed lines
    for (const line of this.speedLines) {
      ctx.strokeStyle = `rgba(255, 255, 255, ${line.alpha})`;
      ctx.lineWidth = 2;
      const angle = Math.atan2(line.vy, line.vx);
      ctx.beginPath();
      ctx.moveTo(line.x, line.y);
      ctx.lineTo(line.x + Math.cos(angle) * line.length, line.y + Math.sin(angle) * line.length);
      ctx.stroke();
    }

    // 3. Render particles
    for (const p of this.particles) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;

      if (p.shape === 'square') {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1.0;
  }
}
