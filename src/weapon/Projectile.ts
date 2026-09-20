import { ShapeData } from '../types';
import { drawShape } from '../assembly/Shape';

export interface AcidPuddle {
  x: number;
  y: number;
  radius: number;
  life: number;
  maxLife: number;
  damagePerSec: number;
}

export class Projectile {
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public angle: number;
  public shape: ShapeData;
  public damage: number;
  public speed: number;
  public radius: number;
  public life: number;
  public maxLife: number;
  public pierceRemaining: number;
  public bouncesRemaining: number;
  public isDead: boolean = false;
  public hitEnemyIds: Set<string> = new Set();
  public spin: number = 0;

  constructor(
    x: number,
    y: number,
    targetX: number,
    targetY: number,
    shape: ShapeData
  ) {
    this.x = x;
    this.y = y;
    this.shape = shape;

    const dx = targetX - x;
    const dy = targetY - y;
    const dist = Math.hypot(dx, dy) || 1;
    this.angle = Math.atan2(dy, dx);

    // Compute base stats based on shape kind
    this.damage = 12;
    this.speed = 600;
    this.radius = 12;
    this.pierceRemaining = 1;
    this.bouncesRemaining = 0;
    this.maxLife = 1.4;

    switch (shape.kind) {
      case 'circle':
        this.speed = 620;
        this.damage = 14;
        this.radius = 11;
        break;
      case 'semi-circle': // Piercing shard
        this.speed = 880;
        this.damage = 12;
        this.radius = 10;
        this.pierceRemaining = 3;
        break;
      case 'square': // Heavy slug
        this.speed = 420;
        this.damage = 28;
        this.radius = 16;
        this.pierceRemaining = 1;
        break;
      case 'star': // Bouncing razor
        this.speed = 580;
        this.damage = 16;
        this.radius = 13;
        this.bouncesRemaining = 3;
        break;
      case 'triangle':
        this.speed = 750;
        this.damage = 18;
        this.radius = 10;
        break;
      case 'compound': // Heavy cluster
        this.speed = 480;
        this.damage = 36;
        this.radius = 18;
        this.pierceRemaining = 1;
        break;
    }

    // Color multiplier
    if (shape.color !== 'raw') {
      this.damage = Math.round(this.damage * 1.35);
    }
    if (shape.color === 'purple') {
      this.damage = Math.round(this.damage * 1.25); // Void singularity bonus
    }

    // Upgrader Tier Multipliers (from Overclocker / Expander)
    if (shape.tier > 1) {
      this.damage = Math.round(this.damage * (1 + (shape.tier - 1) * 0.45));
      this.speed = Math.round(this.speed * (1 + (shape.tier - 1) * 0.3));
      this.radius = Math.round(this.radius * (1 + (shape.tier - 1) * 0.25));
    }

    this.life = this.maxLife;
    this.vx = (dx / dist) * this.speed;
    this.vy = (dy / dist) * this.speed;
  }

  public update(dt: number) {
    this.life -= dt;
    if (this.life <= 0) {
      this.isDead = true;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.shape.kind === 'star' || this.shape.kind === 'semi-circle') {
      this.spin += dt * 14;
    }
  }

  public bounce(normalX: number, normalY: number) {
    if (this.bouncesRemaining > 0) {
      this.bouncesRemaining--;
      if (normalX !== 0) this.vx = -this.vx;
      if (normalY !== 0) this.vy = -this.vy;
      this.angle = Math.atan2(this.vy, this.vx);
    } else {
      this.isDead = true;
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    drawShape(ctx, this.shape, this.x, this.y, this.radius * 2, this.angle + this.spin);
  }
}
