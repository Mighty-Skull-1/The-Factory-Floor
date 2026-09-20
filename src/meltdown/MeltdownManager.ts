import { MachTier, MeltdownRank } from '../types';
import { SoundManager } from '../audio/SoundManager';
import { ParticleSystem } from '../dungeon/ParticleSystem';
import { Room } from '../dungeon/Room';

export class MeltdownManager {
  public isActive: boolean = false;
  public timeLeft: number = 50.0;
  public totalTime: number = 50.0;
  public momentum: number = 0; // 0 to 100
  public currentMach: MachTier = 0;
  public isSliding: boolean = false;
  public slideTimer: number = 0;
  public maxCombo: number = 0;
  public currentCombo: number = 0;
  public barricadesSmashed: number = 0;
  public damageTakenDuringMeltdown: number = 0;
  public sirenTimer: number = 0;

  // Lap 2 (Pizza Tower P-Rank mechanism)
  public isLap2: boolean = false;
  public hasLapBell: boolean = false;

  constructor(
    private sound: SoundManager,
    private particles: ParticleSystem
  ) {}

  public triggerMeltdown(sector: number = 1, totalRooms: number = 7) {
    this.isActive = true;
    // Dynamically scale escape time with room count so multi-room dungeons (11-18 rooms) remain intense yet fair!
    const basePerRoom = 6.4;
    this.totalTime = Math.max(50.0, Math.round(totalRooms * basePerRoom));
    this.timeLeft = this.totalTime;
    this.momentum = 0;
    this.currentMach = 0;
    this.maxCombo = 0;
    this.currentCombo = 0;
    this.barricadesSmashed = 0;
    this.damageTakenDuringMeltdown = 0;
    this.isLap2 = false;
    this.hasLapBell = false;
    this.sound.startMusic('MELTDOWN');
    this.sound.playAlarm();
  }

  public startLap2(totalRooms: number = 7) {
    this.isLap2 = true;
    this.hasLapBell = false;
    const extraTime = Math.max(25, Math.round(totalRooms * 2.5));
    this.timeLeft = Math.min(this.totalTime + 20, this.timeLeft + extraTime);
    this.sound.playLap2();
  }

  public reset() {
    this.isActive = false;
    this.timeLeft = this.totalTime;
    this.momentum = 0;
    this.currentMach = 0;
    this.isSliding = false;
    this.slideTimer = 0;
    this.maxCombo = 0;
    this.currentCombo = 0;
    this.barricadesSmashed = 0;
    this.damageTakenDuringMeltdown = 0;
    this.sirenTimer = 0;
    this.isLap2 = false;
    this.hasLapBell = false;
  }

  public update(
    dt: number,
    isMoving: boolean,
    playerX: number,
    playerY: number,
    playerVx: number,
    playerVy: number,
    currentRoom: Room
  ) {
    if (!this.isActive) return;

    // Countdown
    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
    }

    // Periodic Siren
    this.sirenTimer += dt;
    if (this.sirenTimer > 4.5) {
      this.sirenTimer = 0;
      this.sound.playAlarm();
    }

    // Sliding
    if (this.isSliding) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
      }
      this.particles.spawnHitSparks(playerX, playerY + 15, '#cbd5e1', 2);
    }

    // Momentum buildup
    if (isMoving) {
      this.momentum = Math.min(100, this.momentum + dt * 42);
      this.currentCombo += dt;
      if (this.currentCombo > this.maxCombo) {
        this.maxCombo = this.currentCombo;
      }
    } else {
      this.momentum = Math.max(0, this.momentum - dt * 85);
      this.currentCombo = 0;
    }

    // Determine Mach tier
    let newTier: MachTier = 0;
    if (this.momentum > 78) {
      newTier = 3;
    } else if (this.momentum > 35) {
      newTier = 2;
    } else if (this.momentum > 5) {
      newTier = 1;
    }

    if (newTier > this.currentMach) {
      this.sound.playMachTierUp(newTier);
    }
    this.currentMach = newTier;

    // Mach visual effects
    if (this.currentMach >= 2) {
      this.particles.spawnHitSparks(playerX, playerY + 10, this.currentMach === 3 ? '#ef4444' : '#f59e0b', 1);
    }
    if (this.currentMach === 3 && (Math.abs(playerVx) > 50 || Math.abs(playerVy) > 50)) {
      this.particles.spawnSpeedLines(playerX, playerY, playerVx, playerVy);
    }

    // Barricade collision & smashing at Mach 2/3!
    for (const b of currentRoom.barricades) {
      if (b.hp <= 0) continue;

      const playerRadius = 20;
      const collides =
        playerX + playerRadius > b.x &&
        playerX - playerRadius < b.x + b.width &&
        playerY + playerRadius > b.y &&
        playerY - playerRadius < b.y + b.height;

      if (collides) {
        if (this.currentMach >= 2 && b.isCracked) {
          // SMASH!
          b.hp = 0;
          this.barricadesSmashed++;
          this.sound.playSmash();
          this.particles.spawnExplosion(b.x + b.width / 2, b.y + b.height / 2, 45);
        } else {
          // Hard impact slows momentum
          this.momentum = Math.max(0, this.momentum - 40);
        }
      }
    }
  }

  public triggerSlide(): boolean {
    if (!this.isSliding && this.momentum > 25) {
      this.isSliding = true;
      this.slideTimer = 0.45;
      this.sound.playSlide();
      return true;
    }
    return false;
  }

  public getSpeedMultiplier(): number {
    if (this.currentMach === 3) return 2.1;
    if (this.currentMach === 2) return 1.55;
    if (this.currentMach === 1) return 1.15;
    return 1.0;
  }

  public evaluateRank(): MeltdownRank {
    const elapsed = this.totalTime - this.timeLeft;

    let rankLetter: 'P' | 'S' | 'A' | 'B' | 'C' = 'C';
    let title = 'Close Shave Survivor';

    if (this.isLap2 && this.hasLapBell) {
      rankLetter = 'P';
      title = '★ PIZZA TOWER P-RANK: LAP 2 BELL MASTER! ★';
    } else if (
      elapsed <= 26 &&
      this.damageTakenDuringMeltdown === 0 &&
      this.barricadesSmashed >= 2
    ) {
      rankLetter = 'P';
      title = 'HYPER-SONIC PERFECTION (P-RANK!)';
    } else if (elapsed <= 33) {
      rankLetter = 'S';
      title = 'SUPREME ESCAPE ARTIST (S-RANK)';
    } else if (elapsed <= 42) {
      rankLetter = 'A';
      title = 'RAPID EXTRACTION (A-RANK)';
    } else if (this.timeLeft > 0) {
      rankLetter = 'B';
      title = 'TACTICAL SURVIVOR (B-RANK)';
    }

    return {
      rank: rankLetter,
      escapeTime: parseFloat(elapsed.toFixed(1)),
      maxCombo: parseFloat(this.maxCombo.toFixed(1)),
      barricadesSmashed: this.barricadesSmashed,
      isLap2: this.isLap2,
      title,
      bonusReward: {
        type: rankLetter === 'P' ? 'STACKER' : rankLetter === 'S' ? 'DYE_VAT_YELLOW' : 'MERGER',
        count: rankLetter === 'P' ? 3 : 2,
        name: rankLetter === 'P' ? 'Quantum Stacker' : 'High-Cadence Processor',
        category: 'PROCESSOR',
        description: 'Elite factory component awarded for blistering escape speed',
      },
    };
  }
}
