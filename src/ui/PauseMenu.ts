import { SoundManager } from '../audio/SoundManager';
import { GameMode } from '../types';

export interface PauseButton {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  bgColor: string;
  hoverColor: string;
  textColor: string;
  scale: number;
  isHovered: boolean;
}

export class PauseMenu {
  public showCodexModal: boolean = false;
  private animTimer: number = 0;
  private buttons: PauseButton[] = [];

  constructor(private sound: SoundManager) {}

  public update(dt: number, mouseX: number, mouseY: number) {
    this.animTimer += dt;

    for (const btn of this.buttons) {
      const isHover =
        mouseX >= btn.x &&
        mouseX <= btn.x + btn.width &&
        mouseY >= btn.y &&
        mouseY <= btn.y + btn.height;

      if (isHover && !btn.isHovered) {
        this.sound.playRotate();
      }
      btn.isHovered = isHover;

      const targetScale = isHover ? 1.05 : 1.0;
      btn.scale += (targetScale - btn.scale) * dt * 14;
    }
  }

  private layoutButtons(width: number, height: number) {
    const btnW = 360;
    const btnH = 48;
    const centerX = width / 2;
    const startY = height * 0.40;
    const spacing = 58;

    this.buttons = [
      {
        id: 'RESUME',
        label: '▶ RESUME MISSION [ESC / P]',
        x: centerX - btnW / 2,
        y: startY,
        width: btnW,
        height: btnH + 4,
        bgColor: '#10b981',
        hoverColor: '#34d399',
        textColor: '#ffffff',
        scale: 1.0,
        isHovered: false,
      },
      {
        id: 'CODEX',
        label: '📜 WEAPON RECIPES & CODEX',
        x: centerX - btnW / 2,
        y: startY + spacing,
        width: btnW,
        height: btnH,
        bgColor: '#0284c7',
        hoverColor: '#38bdf8',
        textColor: '#ffffff',
        scale: 1.0,
        isHovered: false,
      },
      {
        id: 'AUDIO',
        label: this.sound.isMuted ? '🔇 AUDIO: MUTED' : '🔊 AUDIO: ACTIVE',
        x: centerX - btnW / 2,
        y: startY + spacing * 2,
        width: btnW,
        height: btnH,
        bgColor: '#b45309',
        hoverColor: '#f59e0b',
        textColor: '#ffffff',
        scale: 1.0,
        isHovered: false,
      },
      {
        id: 'FULLSCREEN',
        label: '⛶ TOGGLE FULLSCREEN',
        x: centerX - btnW / 2,
        y: startY + spacing * 3,
        width: btnW,
        height: btnH,
        bgColor: '#334155',
        hoverColor: '#64748b',
        textColor: '#ffffff',
        scale: 1.0,
        isHovered: false,
      },
      {
        id: 'ABORT',
        label: '🚪 ABORT TO MAIN MENU',
        x: centerX - btnW / 2,
        y: startY + spacing * 4,
        width: btnW,
        height: btnH,
        bgColor: '#991b1b',
        hoverColor: '#ef4444',
        textColor: '#ffffff',
        scale: 1.0,
        isHovered: false,
      },
    ];
  }

  public handleClick(mouseX: number, mouseY: number): 'RESUME' | 'ABORT' | 'NONE' {
    if (this.showCodexModal) {
      this.showCodexModal = false;
      this.sound.playPlace();
      return 'NONE';
    }

    for (const btn of this.buttons) {
      if (
        mouseX >= btn.x &&
        mouseX <= btn.x + btn.width &&
        mouseY >= btn.y &&
        mouseY <= btn.y + btn.height
      ) {
        if (btn.id === 'RESUME') {
          this.sound.playPlace();
          return 'RESUME';
        } else if (btn.id === 'CODEX') {
          this.showCodexModal = true;
          this.sound.playPlace();
          return 'NONE';
        } else if (btn.id === 'AUDIO') {
          this.sound.toggleMute();
          return 'NONE';
        } else if (btn.id === 'FULLSCREEN') {
          this.toggleBrowserFullscreen();
          return 'NONE';
        } else if (btn.id === 'ABORT') {
          this.sound.playSmash();
          return 'ABORT';
        }
      }
    }

    return 'NONE';
  }

  private toggleBrowserFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  public render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    mouseX: number,
    mouseY: number,
    sector: number,
    gameMode: GameMode
  ) {
    this.layoutButtons(width, height);
    this.update(0.016, mouseX, mouseY);

    ctx.save();
    // 1. Dimmed backdrop
    ctx.fillStyle = 'rgba(8, 14, 26, 0.85)';
    ctx.fillRect(0, 0, width, height);

    // 2. Pause Card Window
    const mw = Math.min(520, width - 40);
    const mh = Math.min(520, height - 60);
    const mx = width / 2 - mw / 2;
    const my = height / 2 - mh / 2;

    // 3D Shadow
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.roundRect(mx, my + 8, mw, mh, 16);
    ctx.fill();

    // Body
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(mx, my, mw, mh, 16);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Header Banner
    const headH = 64;
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(mx + 4, my + 4, mw - 8, headH, [12, 12, 0, 0]);
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Title
    ctx.fillStyle = '#facc15';
    ctx.font = '900 24px Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeText('⏸️ MISSION PAUSED', width / 2, my + 38);
    ctx.fillText('⏸️ MISSION PAUSED', width / 2, my + 38);

    // Sector and Mode Pill
    const pillY = my + headH + 26;
    let modeLabel = `MODE: ${gameMode}`;
    let modeBg = '#0284c7';
    if (gameMode === 'HARD') {
      modeLabel = '💀 HARD MODE (+35% HP)';
      modeBg = '#dc2626';
    } else if (gameMode === 'ENDLESS') {
      const loop = Math.max(1, Math.floor((sector - 1) / 3) + 1);
      modeLabel = `♾️ ENDLESS LOOP ${loop} (SECTOR 0${sector})`;
      modeBg = '#7c3aed';
    } else {
      modeLabel = `⚡ STANDARD MODE (SECTOR 0${sector})`;
    }

    const pillW = 320;
    const pillH = 26;
    ctx.fillStyle = modeBg;
    ctx.beginPath();
    ctx.roundRect(width / 2 - pillW / 2, pillY - pillH / 2, pillW, pillH, 10);
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(modeLabel, width / 2, pillY + 4);

    // Render Pause Buttons
    for (const btn of this.buttons) {
      this.renderButton(ctx, btn);
    }

    // Render Codex Modal if open
    if (this.showCodexModal) {
      this.renderCodexModal(ctx, width, height);
    }

    ctx.restore();
  }

  private renderButton(ctx: CanvasRenderingContext2D, btn: PauseButton) {
    ctx.save();
    const cx = btn.x + btn.width / 2;
    const cy = btn.y + btn.height / 2;

    ctx.translate(cx, cy);
    ctx.scale(btn.scale, btn.scale);

    const halfW = btn.width / 2;
    const halfH = btn.height / 2;

    // 3D Shadow
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.roundRect(-halfW, -halfH + 4, btn.width, btn.height, 12);
    ctx.fill();

    // Face
    ctx.fillStyle = btn.isHovered ? btn.hoverColor : btn.bgColor;
    ctx.beginPath();
    ctx.roundRect(-halfW, -halfH, btn.width, btn.height, 12);
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // Gloss
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath();
    ctx.roundRect(-halfW + 4, -halfH + 3, btn.width - 8, btn.height * 0.35, 6);
    ctx.fill();

    // Text
    ctx.fillStyle = btn.textColor;
    ctx.font = 'bold 14px Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(btn.label, 0, 1);

    ctx.restore();
  }

  private renderCodexModal(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.fillStyle = 'rgba(5, 10, 20, 0.94)';
    ctx.fillRect(0, 0, width, height);

    const mw = Math.min(840, width - 40);
    const mh = Math.min(620, height - 40);
    const mx = width / 2 - mw / 2;
    const my = height / 2 - mh / 2;

    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.fillRect(mx, my, mw, mh);
    ctx.strokeRect(mx, my, mw, mh);

    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 20px Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('📖 BLASTER RECIPE CODEX & COMBOS', width / 2, my + 35);

    const recipes = [
      { name: 'PIERCING SHARDS', combo: 'Circle ➔ Cutter', effect: '+2 Pierce, Semi-Circle bullets slice through enemies', color: '#38bdf8' },
      { name: 'INCENDIARY CLUSTER', combo: 'Any Shape ➔ Red Dye Vat', effect: 'Explosive burn damage in a 75px blast radius', color: '#ef4444' },
      { name: 'CRYO STASIS', combo: 'Any Shape ➔ Blue Dye Vat', effect: 'Freezes enemies solid in ice blocks for 2.0s', color: '#60a5fa' },
      { name: 'TESLA COIL', combo: 'Any Shape ➔ Yellow Dye Vat', effect: 'Chain lightning strikes up to 4 nearby enemies', color: '#facc15' },
      { name: 'CORROSIVE SLIME', combo: 'Any Shape ➔ Green Dye Vat', effect: 'Spawns acidic melting puddles on impact', color: '#22c55e' },
      { name: 'VOID SINGULARITY', combo: 'Any Shape ➔ Purple Dye Vat', effect: 'Black hole implosion pulls in nearby enemies', color: '#a855f7' },
      { name: 'OVERCLOCKED GATLING', combo: 'Any Shape ➔ Overclocker', effect: 'Supercharged Tier +1: +45% Damage & +30% Speed', color: '#fb923c' },
      { name: 'CONCUSSIVE MORTAR', combo: 'Any Shape ➔ Barrel Expander', effect: 'Expanded heavy shell: +50% Area & Knockback', color: '#e879f9' },
      { name: 'HYPER SPLITTER', combo: 'Shape ➔ Splitter ➔ Feed', effect: 'Simultaneous multi-stream projectile burst', color: '#f43f5e' },
    ];

    const colW = (mw - 50) / 2;
    const rowH = 50;

    for (let i = 0; i < recipes.length; i++) {
      const r = recipes[i];
      const col = i < 5 ? 0 : 1;
      const row = i < 5 ? i : i - 5;

      const rx = mx + 20 + col * (colW + 10);
      const ry = my + 60 + row * (rowH + 8);

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(rx, ry, colW, rowH);
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(rx, ry, colW, rowH);

      ctx.fillStyle = r.color;
      ctx.font = 'bold 12px Courier New, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(r.name, rx + 10, ry + 18);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px Courier New, monospace';
      ctx.fillText(r.combo, rx + 10, ry + 32);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '9.5px Courier New, monospace';
      ctx.fillText(r.effect, rx + 10, ry + 44);
    }

    // Close button
    const cbW = 240;
    const cbH = 40;
    const cbX = width / 2 - cbW / 2;
    const cbY = my + mh - 55;

    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.roundRect(cbX, cbY, cbW, cbH, 10);
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CLOSE CODEX [CLICK]', width / 2, cbY + 25);
  }
}
