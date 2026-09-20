import { SoundManager } from '../audio/SoundManager';
import { PlayerRenderer } from '../dungeon/PlayerRenderer';
import { drawShape, createShape } from '../assembly/Shape';
import { ShapeData } from '../types';

export interface MenuButton {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  bgColor: string;
  hoverColor: string;
  textColor: string;
  icon?: string;
  scale: number;
  isHovered: boolean;
}

export class MainMenu {
  public showGuideModal: boolean = false;
  public selectedMode: 'STANDARD' | 'HARD' | 'ENDLESS' = 'STANDARD';
  private animTimer: number = 0;
  private mascotRenderer: PlayerRenderer;
  private bgShapes: { shape: ShapeData; x: number; y: number; speed: number; angle: number }[] = [];
  public buttons: MenuButton[] = [];

  constructor(private sound: SoundManager) {
    this.mascotRenderer = new PlayerRenderer();
    this.setupBackgroundShapes();
  }

  private setupBackgroundShapes() {
    const kinds = ['circle', 'square', 'star', 'triangle', 'semi-circle', 'compound'] as const;
    const colors = ['red', 'blue', 'yellow', 'green', 'raw'] as const;

    for (let i = 0; i < 16; i++) {
      const kind = kinds[Math.floor(Math.random() * kinds.length)];
      const color = colors[Math.floor(Math.random() * colors.length)];
      this.bgShapes.push({
        shape: createShape(kind, color),
        x: Math.random() * 1920,
        y: Math.random() * 1080,
        speed: 40 + Math.random() * 60,
        angle: Math.random() * Math.PI * 2,
      });
    }
  }

  public update(dt: number, width: number, height: number, mouseX: number, mouseY: number) {
    this.animTimer += dt;
    this.mascotRenderer.update(dt, false, false);

    // Update floating background shapes
    for (const bs of this.bgShapes) {
      bs.x += bs.speed * dt;
      bs.angle += dt * 0.8;
      if (bs.x > width + 50) {
        bs.x = -50;
        bs.y = Math.random() * height;
      }
    }

    // Position buttons responsively
    this.layoutButtons(width, height);

    // Update button hover states and scale
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

      const targetScale = isHover ? 1.06 : 1.0;
      btn.scale += (targetScale - btn.scale) * dt * 14;
    }
  }

  private layoutButtons(width: number, height: number) {
    const btnW = 340;
    const btnH = 50;
    const centerX = width / 2;
    const startY = height * 0.50;
    const spacing = 58;

    const modeW = 108;
    const modeH = 34;
    const modeGap = 8;
    const totalModeW = modeW * 3 + modeGap * 2;
    const modeStartX = centerX - totalModeW / 2;
    const modeY = startY - 48;

    this.buttons = [
      {
        id: 'MODE_STANDARD',
        label: '⚡ STANDARD',
        x: modeStartX,
        y: modeY,
        width: modeW,
        height: modeH,
        bgColor: this.selectedMode === 'STANDARD' ? '#0284c7' : '#1e293b',
        hoverColor: '#38bdf8',
        textColor: '#ffffff',
        scale: 1.0,
        isHovered: false,
      },
      {
        id: 'MODE_HARD',
        label: '💀 HARD',
        x: modeStartX + modeW + modeGap,
        y: modeY,
        width: modeW,
        height: modeH,
        bgColor: this.selectedMode === 'HARD' ? '#dc2626' : '#1e293b',
        hoverColor: '#f87171',
        textColor: '#ffffff',
        scale: 1.0,
        isHovered: false,
      },
      {
        id: 'MODE_ENDLESS',
        label: '♾️ ENDLESS',
        x: modeStartX + (modeW + modeGap) * 2,
        y: modeY,
        width: modeW,
        height: modeH,
        bgColor: this.selectedMode === 'ENDLESS' ? '#7c3aed' : '#1e293b',
        hoverColor: '#c084fc',
        textColor: '#ffffff',
        scale: 1.0,
        isHovered: false,
      },
      {
        id: 'PLAY',
        label: '⚡ DEPLOY (START RUN)',
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
        id: 'GUIDE',
        label: '📜 BLUEPRINT LAB / GUIDE',
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
        bgColor: '#78350f',
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
    ];
  }

  public handleClick(mouseX: number, mouseY: number): 'PLAY' | 'NONE' {
    if (this.showGuideModal) {
      this.showGuideModal = false;
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
        if (btn.id === 'MODE_STANDARD') {
          this.selectedMode = 'STANDARD';
          this.sound.playPlace();
          return 'NONE';
        } else if (btn.id === 'MODE_HARD') {
          this.selectedMode = 'HARD';
          this.sound.playPlace();
          return 'NONE';
        } else if (btn.id === 'MODE_ENDLESS') {
          this.selectedMode = 'ENDLESS';
          this.sound.playPlace();
          return 'NONE';
        } else if (btn.id === 'PLAY') {
          this.sound.playSmash();
          return 'PLAY';
        } else if (btn.id === 'GUIDE') {
          this.showGuideModal = true;
          this.sound.playPlace();
        } else if (btn.id === 'AUDIO') {
          this.sound.toggleMute();
        } else if (btn.id === 'FULLSCREEN') {
          this.toggleBrowserFullscreen();
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

  public render(ctx: CanvasRenderingContext2D, width: number, height: number, mouseX: number, mouseY: number) {
    // 1. CARTOON BACKGROUND WITH CONVEYORS & GEARS
    this.renderAnimatedBackground(ctx, width, height);

    // 2. GIANT CARTOON TITLE LOGO
    this.renderLogo(ctx, width, height);

    // 3. MASCOT GEARHEAD ANIMATION BESIDE TITLE
    const mascotX = width / 2 - 280;
    const mascotY = height * 0.32;
    this.mascotRenderer.render(
      ctx,
      mascotX,
      mascotY,
      Math.atan2(mouseY - mascotY, mouseX - mascotX),
      0,
      false,
      false,
      100
    );

    // Mascot speech bubble
    this.renderMascotSpeech(ctx, mascotX, mascotY);

    // 4. JUICY CARTOON BUTTONS
    for (const btn of this.buttons) {
      this.renderButton(ctx, btn);
    }

    // 5. BLUEPRINT LAB MODAL (IF OPEN)
    if (this.showGuideModal) {
      this.renderGuideModal(ctx, width, height);
    }
  }

  private renderAnimatedBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
    // Deep slate blue base
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    // Industrial grid pattern
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Background rotating cogs
    this.renderCog(ctx, 80, 80, 70, this.animTimer * 0.4, '#172554');
    this.renderCog(ctx, width - 80, 90, 85, -this.animTimer * 0.35, '#1e1b4b');
    this.renderCog(ctx, width - 120, height - 100, 95, this.animTimer * 0.3, '#172554');
    this.renderCog(ctx, 110, height - 110, 80, -this.animTimer * 0.45, '#1e1b4b');

    // Horizontal Conveyor Belt near top
    this.renderConveyorStrip(ctx, 0, 115, width, 24, this.animTimer * 80);
    // Horizontal Conveyor Belt near bottom
    this.renderConveyorStrip(ctx, 0, height - 70, width, 24, -this.animTimer * 80);

    // Floating cartoon shapes moving along conveyors
    for (const bs of this.bgShapes) {
      drawShape(ctx, bs.shape, bs.x, bs.y, 24, bs.angle);
    }
  }

  private renderCog(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, angle: number, color: string) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.fillStyle = color;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;

    const teeth = 10;
    ctx.beginPath();
    for (let i = 0; i < teeth; i++) {
      const a = (i * Math.PI * 2) / teeth;
      const aNext = ((i + 0.5) * Math.PI * 2) / teeth;
      const x1 = Math.cos(a) * r;
      const y1 = Math.sin(a) * r;
      const x2 = Math.cos(aNext) * (r + 14);
      const y2 = Math.sin(aNext) * (r + 14);
      if (i === 0) ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Center axle hole
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = '#090d16';
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  private renderConveyorStrip(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, offset: number) {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);

    // Animated belt treads
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    const spacing = 30;
    const startX = (offset % spacing) - spacing;
    for (let px = startX; px < w + spacing; px += spacing) {
      ctx.beginPath();
      ctx.moveTo(px, y + 4);
      ctx.lineTo(px + 10, y + h / 2);
      ctx.lineTo(px, y + h - 4);
      ctx.stroke();
    }
  }

  private renderLogo(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const cx = width / 2;
    const cy = height * 0.22;

    ctx.save();
    // Bouncy floating animation
    const bob = Math.sin(this.animTimer * 3) * 6;
    ctx.translate(cx, cy + bob);

    // Drop Shadow
    ctx.font = '900 68px "Impact", "Arial Black", Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#000000';
    ctx.fillText('THE FACTORY FLOOR', 0, 10);

    // 3D Layer Extrusion
    for (let off = 6; off >= 1; off--) {
      ctx.fillStyle = '#b45309';
      ctx.fillText('THE FACTORY FLOOR', 0, off);
    }

    // Main Logo Face (Warm Electric Golden-Yellow)
    ctx.fillStyle = '#facc15';
    ctx.fillText('THE FACTORY FLOOR', 0, 0);

    // Thick Cartoon Outline
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 6;
    ctx.strokeText('THE FACTORY FLOOR', 0, 0);

    // Gloss highlights
    ctx.fillStyle = '#fef08a';
    ctx.font = '900 66px "Impact", "Arial Black", Courier New, monospace';
    ctx.fillText('THE FACTORY FLOOR', 0, -2);

    // Subtitle Pill Banner
    const subY = 56;
    const subW = 680;
    const subH = 34;

    ctx.fillStyle = '#0284c7';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.roundRect(-subW / 2, subY - subH / 2, subW, subH, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('1. CLEAR ROOMS  ➔  2. FEED THE GRID  ➔  3. MELTDOWN SPRINT', 0, subY + 5);

    ctx.restore();
  }

  private renderMascotSpeech(ctx: CanvasRenderingContext2D, mx: number, my: number) {
    ctx.save();
    const bx = mx + 60;
    const by = my - 55;
    const bw = 170;
    const bh = 50;

    // Speech bubble
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 12);
    ctx.fill();
    ctx.stroke();

    // Bubble pointer
    ctx.beginPath();
    ctx.moveTo(bx, by + 30);
    ctx.lineTo(bx - 14, by + 40);
    ctx.lineTo(bx + 8, by + 42);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 11px Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('READY TO OVERLOAD,', bx + bw / 2, by + 20);
    ctx.fillText('BOSS? HIT DEPLOY!', bx + bw / 2, by + 36);
    ctx.restore();
  }

  private renderButton(ctx: CanvasRenderingContext2D, btn: MenuButton) {
    ctx.save();
    const cx = btn.x + btn.width / 2;
    const cy = btn.y + btn.height / 2;

    ctx.translate(cx, cy);
    ctx.scale(btn.scale, btn.scale);

    const halfW = btn.width / 2;
    const halfH = btn.height / 2;

    // 3D Button Drop Shadow
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.roundRect(-halfW, -halfH + 6, btn.width, btn.height, 14);
    ctx.fill();

    // Button Face
    ctx.fillStyle = btn.isHovered ? btn.hoverColor : btn.bgColor;
    ctx.beginPath();
    ctx.roundRect(-halfW, -halfH, btn.width, btn.height, 14);
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Top Gloss Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.roundRect(-halfW + 4, -halfH + 4, btn.width - 8, btn.height * 0.38, 8);
    ctx.fill();

    // Text Label
    ctx.fillStyle = btn.textColor;
    ctx.font = 'bold 16px Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(btn.label, 0, 2);

    ctx.restore();
  }

  private renderGuideModal(ctx: CanvasRenderingContext2D, width: number, height: number) {
    // Dim backdrop
    ctx.fillStyle = 'rgba(5, 10, 20, 0.88)';
    ctx.fillRect(0, 0, width, height);

    const mw = Math.min(940, width - 40);
    const mh = Math.min(620, height - 60);
    const mx = width / 2 - mw / 2;
    const my = height / 2 - mh / 2;

    ctx.save();
    // Modal Frame (Cartoon Blueprint Table style)
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 5;
    ctx.fillRect(mx, my, mw, mh);
    ctx.strokeRect(mx, my, mw, mh);

    // Top Header Banner
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(mx + 4, my + 4, mw - 8, 54);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeRect(mx + 4, my + 4, mw - 8, 54);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('⚡ BLUEPRINT LAB: MASTERING THE 3 PHASES', width / 2, my + 38);

    // 3 Cartoon Guide Cards
    const cardW = (mw - 60) / 3;
    const cardH = mh - 160;
    const cardY = my + 75;

    const cards = [
      {
        title: '1. THE DUNGEON',
        sub: '(Binding of Isaac)',
        color: '#ef4444',
        icon: '🔫',
        lines: [
          '• WASD to Move, MOUSE to Aim & Shoot.',
          '• Clear rooms of Bite-Bots & Sentry Turrets.',
          '• Room drops: Ammo Nodes (shapes) & Processors (cutters, belts, dye vats).',
          '• Find the Boss Chamber and destroy the Overseer!',
        ],
      },
      {
        title: '2. THE ASSEMBLY',
        sub: '(shapez Backpack)',
        color: '#38bdf8',
        icon: '⚙',
        lines: [
          '• Press [TAB / E] anytime to open the 8x8 Grid.',
          '• Lay Conveyors feeding your Gun Feed Hopper.',
          '• Cutters: slice circles into Piercing Shards.',
          '• Dye Vats: Red (Explosive), Blue (Freeze), Yellow (Chain Shock), Green (Acid).',
          '• Throughput directly sets your Fire Rate!',
        ],
      },
      {
        title: '3. MELTDOWN SPRINT',
        sub: '(Pizza Tower Escape)',
        color: '#ec4899',
        icon: '🏃',
        lines: [
          '• Smash the CORE OVERLOAD button!',
          '• 50-Second siren countdown begins.',
          '• Run continuously to build Mach 1 ➔ 2 ➔ 3.',
          '• At Mach 3: Smashing through barricades & bots!',
          '• Escape to the Pod fast for P-Rank rewards!',
        ],
      },
    ];

    for (let i = 0; i < 3; i++) {
      const c = cards[i];
      const cx = mx + 20 + i * (cardW + 10);

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(cx, cardY, cardW, cardH);
      ctx.strokeStyle = c.color;
      ctx.lineWidth = 3;
      ctx.strokeRect(cx, cardY, cardW, cardH);

      // Card Header
      ctx.fillStyle = c.color;
      ctx.font = 'bold 16px Courier New, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${c.icon} ${c.title}`, cx + cardW / 2, cardY + 30);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 12px Courier New, monospace';
      ctx.fillText(c.sub, cx + cardW / 2, cardY + 50);

      // Dividing line
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx + 15, cardY + 62);
      ctx.lineTo(cx + cardW - 15, cardY + 62);
      ctx.stroke();

      // Bullet points
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '12px Courier New, monospace';
      ctx.textAlign = 'left';

      let lineY = cardY + 88;
      for (const line of c.lines) {
        this.wrapText(ctx, line, cx + 14, lineY, cardW - 28, 17);
        lineY += 46;
      }
    }

    // Close Button at bottom
    const closeW = 280;
    const closeH = 46;
    const closeX = width / 2 - closeW / 2;
    const closeY = my + mh - 65;

    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.roundRect(closeX, closeY, closeW, closeH, 12);
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GOT IT! CLICK TO CLOSE', width / 2, closeY + 28);

    ctx.restore();
  }

  private wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ) {
    const words = text.split(' ');
    let line = '';

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y);
  }
}
