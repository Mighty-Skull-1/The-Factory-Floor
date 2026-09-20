import { AssemblyGrid } from '../assembly/Grid';
import { Projectile } from './Projectile';
import { SoundManager } from '../audio/SoundManager';
import { ParticleSystem } from '../dungeon/ParticleSystem';

export class Blaster {
  public cooldown: number = 0;
  public baseFireRate: number = 0.22; // Seconds per shot

  constructor(
    private grid: AssemblyGrid,
    private sound: SoundManager,
    private particles: ParticleSystem
  ) {}

  public update(dt: number) {
    if (this.cooldown > 0) {
      this.cooldown -= dt;
    }
  }

  public canShoot(): boolean {
    return this.cooldown <= 0;
  }

  public shoot(
    playerX: number,
    playerY: number,
    targetX: number,
    targetY: number
  ): Projectile[] {
    if (!this.canShoot()) return [];

    // Pop the next processed shape from the conveyor backpack hopper!
    const shape = this.grid.popNextShape();
    if (!shape) return [];

    // Sound effect based on shape
    if (shape.kind === 'semi-circle') {
      this.sound.playShoot('shard');
    } else if (shape.kind === 'square') {
      this.sound.playShoot('slug');
    } else if (shape.kind === 'star') {
      this.sound.playShoot('star');
    } else {
      this.sound.playShoot('laser');
    }

    // Adapt cooldown based on shape type
    let shotCooldown = this.baseFireRate;
    if (shape.kind === 'square') shotCooldown = 0.38; // Heavy slug takes longer
    if (shape.kind === 'semi-circle') shotCooldown = 0.16; // Fast shards
    if (shape.kind === 'compound') shotCooldown = 0.45;

    this.cooldown = shotCooldown;

    // Direction vector
    const dx = targetX - playerX;
    const dy = targetY - playerY;
    const angle = Math.atan2(dy, dx);

    // Muzzle position slightly offset from player center
    const muzzleX = playerX + Math.cos(angle) * 25;
    const muzzleY = playerY + Math.sin(angle) * 25;

    // Spawn muzzle flash particles
    this.particles.spawnMuzzleFlash(muzzleX, muzzleY, angle, shape.color);

    const projectiles: Projectile[] = [];

    // If compound or splitter shape, can spawn twin or spread shots
    projectiles.push(new Projectile(muzzleX, muzzleY, targetX, targetY, shape));

    return projectiles;
  }
}
