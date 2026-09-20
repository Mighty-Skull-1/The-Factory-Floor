import { MachTier } from '../types';

export class PlayerRenderer {
  private walkCycle: number = 0;
  private recoil: number = 0;
  private blinkTimer: number = 2.0;
  private isBlinking: boolean = false;
  public tauntTimer: number = 0;

  public triggerTaunt() {
    this.tauntTimer = 0.45;
  }

  public update(dt: number, isMoving: boolean, isShooting: boolean) {
    if (this.tauntTimer > 0) {
      this.tauntTimer -= dt;
    }

    if (isMoving) {
      this.walkCycle += dt * 14;
    } else {
      this.walkCycle = 0;
    }

    if (isShooting) {
      this.recoil = 1.0;
    } else if (this.recoil > 0) {
      this.recoil = Math.max(0, this.recoil - dt * 5);
    }

    this.blinkTimer -= dt;
    if (this.blinkTimer <= 0) {
      this.isBlinking = true;
      if (this.blinkTimer <= -0.15) {
        this.isBlinking = false;
        this.blinkTimer = 2.0 + Math.random() * 2.5;
      }
    }
  }

  public render(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    angle: number,
    machTier: MachTier,
    isSliding: boolean,
    isInvuln: boolean,
    mouseDist: number,
    isTaunting: boolean = false
  ) {
    const tauntActive = isTaunting || this.tauntTimer > 0;
    ctx.save();
    ctx.translate(x, y);

    // Invulnerability flashing
    if (isInvuln && Math.floor(Date.now() / 60) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    // Shadow on floor
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 18, 20, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Taunt heroic pose
    if (tauntActive) {
      ctx.scale(1.25, 1.25);
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 25;
      // Radiating comic spark stars
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('⚡', -26, -26);
      ctx.fillText('⚡', 20, -26);
    } else if (machTier === 3) {
      ctx.shadowColor = '#ec4899';
      ctx.shadowBlur = 20;
    }

    // Sliding squash
    if (isSliding) {
      ctx.scale(1.4, 0.55);
    }

    // Bobbing walk cycle
    const bobY = Math.abs(Math.sin(this.walkCycle)) * 4;

    // --- LEGS / BOOTS ---
    const legSwing = Math.sin(this.walkCycle) * 12;
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;

    // Left Boot
    ctx.save();
    ctx.translate(-8, 12 - (legSwing > 0 ? legSwing * 0.4 : 0));
    ctx.fillRect(-5, 0, 10, 8);
    ctx.strokeRect(-5, 0, 10, 8);
    // Boot sole
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-6, 6, 12, 3);
    ctx.strokeRect(-6, 6, 12, 3);
    ctx.restore();

    // Right Boot
    ctx.save();
    ctx.translate(8, 12 - (legSwing < 0 ? -legSwing * 0.4 : 0));
    ctx.fillStyle = '#334155';
    ctx.fillRect(-5, 0, 10, 8);
    ctx.strokeRect(-5, 0, 10, 8);
    // Boot sole
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-6, 6, 12, 3);
    ctx.strokeRect(-6, 6, 12, 3);
    ctx.restore();

    // --- BACKPACK CONVEYOR GENERATOR ---
    ctx.save();
    ctx.translate(-14, -bobY);
    ctx.fillStyle = '#d97706';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.fillRect(-8, -12, 12, 22);
    ctx.strokeRect(-8, -12, 12, 22);
    // Conveyor gear wheel
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.arc(-2, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Steam pipe chimney
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(-6, -18, 6, 7);
    ctx.strokeRect(-6, -18, 6, 7);
    ctx.restore();

    // Rotate torso & head towards mouse
    ctx.rotate(angle);

    // --- CHUNKY SHAPE BLASTER (GUN) ---
    ctx.save();
    const recoilOffset = -this.recoil * 10;
    const recoilStretch = 1.0 + this.recoil * 0.3;
    ctx.translate(14 + recoilOffset, 10);
    ctx.scale(recoilStretch, 1.0 / recoilStretch);

    // Gun body (Industrial chunky steam-blaster)
    ctx.fillStyle = '#475569';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.fillRect(0, -6, 22, 12);
    ctx.strokeRect(0, -6, 22, 12);

    // Brass barrel muzzle
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(20, -8, 8, 16);
    ctx.strokeRect(20, -8, 8, 16);

    // Pressure dial gauge on weapon
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(8, -6, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();

    // --- TORSO & HEAD (CHASSIS) ---
    ctx.save();
    ctx.translate(0, -bobY);

    // Main robot boiler body (Vibrant cyan/teal with bold cartoon outlines)
    ctx.fillStyle = '#0284c7';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 19, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Belly plate / rivet panel
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(0, 4, 12, 0, Math.PI);
    ctx.fill();

    // Antenna on head with blinking hazard light
    ctx.fillStyle = '#64748b';
    ctx.fillRect(-2, -26, 4, 9);
    ctx.strokeRect(-2, -26, 4, 9);

    const isLightOn = machTier >= 2 ? Math.floor(Date.now() / 100) % 2 === 0 : Math.floor(Date.now() / 400) % 2 === 0;
    ctx.fillStyle = isLightOn ? (machTier === 3 ? '#ec4899' : '#facc15') : '#78350f';
    ctx.beginPath();
    ctx.arc(0, -28, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // --- EXPRESSIVE CARTOON EYES ---
    if (this.isBlinking && machTier < 2) {
      // Blinking lines
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-9, -2);
      ctx.lineTo(-2, -2);
      ctx.moveTo(3, -2);
      ctx.lineTo(10, -2);
      ctx.stroke();
    } else {
      // Big white cartoon googly eyes
      const eyeR = machTier === 3 ? 9 : 7; // Bulge eyes in Mach 3!
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;

      // Left eye
      ctx.beginPath();
      ctx.arc(-6, -2, eyeR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Right eye
      ctx.beginPath();
      ctx.arc(6, -2, eyeR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Pupils (track towards front / target)
      ctx.fillStyle = '#000000';
      const pupilShift = machTier === 3 ? 3 : 2;
      ctx.beginPath();
      ctx.arc(-6 + pupilShift, -2, eyeR * 0.42, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(6 + pupilShift, -2, eyeR * 0.42, 0, Math.PI * 2);
      ctx.fill();

      // Eye shine highlights
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-7 + pupilShift, -4, eyeR * 0.18, 0, Math.PI * 2);
      ctx.arc(5 + pupilShift, -4, eyeR * 0.18, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- MOUTH / EXPRESSION ---
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;

    if (machTier === 3) {
      // Pizza Tower screaming panic/manic grin!
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.ellipse(0, 8, 9, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Sharp cartoon teeth
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-6, 3, 12, 3);
    } else if (this.recoil > 0.2) {
      // Grit teeth while shooting!
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-6, 7, 12, 4);
      ctx.strokeRect(-6, 7, 12, 4);
    } else {
      // Confident cartoon smile
      ctx.beginPath();
      ctx.arc(0, 5, 6, 0.1, Math.PI - 0.1);
      ctx.stroke();
    }

    // Sweat drop flying in high Mach!
    if (machTier >= 2) {
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(-16, -14, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.restore();
    ctx.restore();
  }
}
