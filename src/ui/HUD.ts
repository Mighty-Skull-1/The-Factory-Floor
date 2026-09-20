import { PlayerStats, MachTier, GameMode } from '../types';
import { Room } from '../dungeon/Room';
import { MeltdownManager } from '../meltdown/MeltdownManager';
import { AssemblyGrid } from '../assembly/Grid';
import { drawShape } from '../assembly/Shape';

export class HUD {
  private tvAnimTimer: number = 0;

  constructor(
    private meltdown: MeltdownManager,
    private grid: AssemblyGrid
  ) {}

  public isPauseButtonClicked(mouseX: number, mouseY: number, width: number): boolean {
    const btnX = width - 265;
    const btnY = 20;
    const btnW = 80;
    const btnH = 34;
    return mouseX >= btnX && mouseX <= btnX + btnW && mouseY >= btnY && mouseY <= btnY + btnH;
  }

  public isBombButtonClicked(mouseX: number, mouseY: number): boolean {
    const bx = 125;
    const by = 74;
    const bw = 150;
    const bh = 24;
    return mouseX >= bx && mouseX <= bx + bw && mouseY >= by && mouseY <= by + bh;
  }

  public render(
    ctx: CanvasRenderingContext2D,
    stats: PlayerStats,
    rooms: Room[],
    currentRoomIndex: number,
    isShooting: boolean,
    isHurt: boolean,
    machTier: MachTier,
    width: number,
    height: number,
    gameMode: GameMode = 'STANDARD'
  ) {
    this.tvAnimTimer += 0.016;

    // 1. TOP-LEFT: PIZZA TOWER REACTION TV + HEALTH + MODE + SCRAP BOMB
    this.renderReactionTV(ctx, isShooting, isHurt, machTier);
    this.renderHealthAndScrap(ctx, stats, gameMode);

    // Overdrive Super HUD Alert
    if (stats.overdriveTimer > 0) {
      this.renderOverdriveHUD(ctx, stats.overdriveTimer, width);
    }

    // 2. TOP-CENTER: AMMO CHAMBER FEED
    this.renderAmmoChamber(ctx, width);

    // 3. TOP-RIGHT: RADAR MINIMAP & PAUSE BUTTON
    this.renderMiniMap(ctx, rooms, currentRoomIndex, width);
    this.renderPauseButton(ctx, width);

    // 4. OBJECTIVE / MELTDOWN ALARM
    if (this.meltdown.isActive) {
      this.renderMeltdownHUD(ctx, width, height);
    } else {
      const sectorNum = (rooms.length > 0 && rooms[0].sector) ? rooms[0].sector : 1;
      ctx.save();
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 13px Courier New, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`MISSION: Sector 0${sectorNum} ➔ Clear Security ➔ Overload Core ➔ Escape`, width / 2, 35);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px Courier New, monospace';
      ctx.fillText('[TAB/E] 8x8 Workbench | [C / F] Taunt & Parry Bullets! | [Shift/Space] Slide', width / 2, 54);
      ctx.restore();
    }
  }

  private renderReactionTV(
    ctx: CanvasRenderingContext2D,
    isShooting: boolean,
    isHurt: boolean,
    machTier: MachTier
  ) {
    const tvX = 25;
    const tvY = 20;
    const tvW = 85;
    const tvH = 75;

    ctx.save();
    // TV Bezel
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.fillRect(tvX, tvY, tvW, tvH);
    ctx.strokeRect(tvX, tvY, tvW, tvH);

    // Antenna
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(tvX + 20, tvY);
    ctx.lineTo(tvX + 8, tvY - 14);
    ctx.moveTo(tvX + 35, tvY);
    ctx.lineTo(tvX + 48, tvY - 14);
    ctx.stroke();

    // CRT Screen Glass
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(tvX + 6, tvY + 6, tvW - 24, tvH - 12);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(tvX + 6, tvY + 6, tvW - 24, tvH - 12);

    // TV knobs
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(tvX + tvW - 10, tvY + 22, 4.5, 0, Math.PI * 2);
    ctx.arc(tvX + tvW - 10, tvY + 45, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Character Face
    const faceX = tvX + 35;
    const faceY = tvY + 38;

    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(faceX, faceY, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    if (isHurt) {
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('@_@', faceX, faceY + 4);

      ctx.fillStyle = '#facc15';
      const starAngle = this.tvAnimTimer * 8;
      ctx.fillText('★', faceX + Math.cos(starAngle) * 14, faceY - 16 + Math.sin(starAngle) * 4);
    } else if (machTier >= 2) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(faceX - 6, faceY - 4, 7, 0, Math.PI * 2);
      ctx.arc(faceX + 6, faceY - 4, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(faceX - 6, faceY - 4, 2.5, 0, Math.PI * 2);
      ctx.arc(faceX + 6, faceY - 4, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.ellipse(faceX, faceY + 8, 8, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (isShooting) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(faceX - 5, faceY - 3, 5, 0, Math.PI * 2);
      ctx.arc(faceX + 5, faceY - 3, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.fillRect(faceX - 6, faceY - 4, 3, 3);
      ctx.fillRect(faceX + 4, faceY - 4, 3, 3);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(faceX - 6, faceY + 5, 12, 4);
      ctx.strokeRect(faceX - 6, faceY + 5, 12, 4);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(faceX - 5, faceY - 3, 5, 0, Math.PI * 2);
      ctx.arc(faceX + 5, faceY - 3, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(faceX - 5, faceY - 3, 2.5, 0, Math.PI * 2);
      ctx.arc(faceX + 5, faceY - 3, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(faceX, faceY + 3, 5, 0.1, Math.PI - 0.1);
      ctx.stroke();
    }
    ctx.restore();
  }

  private renderHealthAndScrap(ctx: CanvasRenderingContext2D, stats: PlayerStats, gameMode: GameMode) {
    const hx = 125;
    const hy = 25;
    const hw = 180;
    const hh = 22;

    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3.5;
    ctx.fillRect(hx, hy, hw, hh);
    ctx.strokeRect(hx, hy, hw, hh);

    const hpFrac = Math.max(0, stats.hp / stats.maxHp);
    ctx.fillStyle = hpFrac > 0.35 ? '#10b981' : '#ef4444';
    ctx.fillRect(hx + 2, hy + 2, (hw - 4) * hpFrac, hh - 4);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.fillRect(hx + 2, hy + 2, (hw - 4) * hpFrac, 5);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`HP ${Math.round(stats.hp)} / ${stats.maxHp}`, hx + hw / 2, hy + 15);

    ctx.fillStyle = '#fbbf24';
    ctx.textAlign = 'left';
    ctx.font = 'bold 13px Courier New, monospace';
    ctx.fillText(`⚙ SCRAP: ${stats.scrap}`, hx, hy + 42);

    // Mode Pill Badge
    let modeText = 'STANDARD';
    let modeBg = '#0284c7';
    if (gameMode === 'HARD') {
      modeText = '💀 HARD';
      modeBg = '#dc2626';
    } else if (gameMode === 'ENDLESS') {
      modeText = '♾️ ENDLESS';
      modeBg = '#7c3aed';
    }

    const pillX = hx + 130;
    const pillY = hy + 29;
    const pillW = 85;
    const pillH = 18;

    ctx.fillStyle = modeBg;
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, 6);
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(modeText, pillX + pillW / 2, pillY + 12);

    // Scrap Bomb Button
    const canBomb = stats.scrap >= 20;
    const bx = hx;
    const by = hy + 49;
    const bw = 145;
    const bh = 24;

    ctx.fillStyle = canBomb ? '#b45309' : '#1e293b';
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 6);
    ctx.fill();
    ctx.strokeStyle = canBomb ? '#facc15' : '#475569';
    ctx.lineWidth = canBomb ? 2.5 : 1.5;
    ctx.stroke();

    ctx.fillStyle = canBomb ? '#ffffff' : '#94a3b8';
    ctx.font = 'bold 11px Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(canBomb ? '💥 [Q] BOMB (20⚙)' : '💥 BOMB (20⚙)', bx + bw / 2, by + 16);

    // Active Perk Badges
    const activePerks: { label: string; color: string }[] = [];
    if (stats.perks.magnetShrapnel) activePerks.push({ label: '🧲 SHRAPNEL', color: '#f59e0b' });
    if (stats.perks.conveyorTurbo) activePerks.push({ label: '⚡ TURBO', color: '#38bdf8' });
    if (stats.perks.reactivePlating) activePerks.push({ label: '🛡️ NANO', color: '#10b981' });
    if (stats.perks.sentryBuddy) activePerks.push({ label: '🤖 SENTRY', color: '#818cf8' });
    if (stats.perks.superSlide) activePerks.push({ label: '🚀 SLIDE', color: '#ec4899' });

    let badgeX = hx;
    const badgeY = by + bh + 6;
    for (const perk of activePerks) {
      ctx.font = 'bold 9px Courier New, monospace';
      const tw = ctx.measureText(perk.label).width + 8;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, tw, 15, 4);
      ctx.fill();
      ctx.strokeStyle = perk.color;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.fillStyle = perk.color;
      ctx.textAlign = 'left';
      ctx.fillText(perk.label, badgeX + 4, badgeY + 11);
      badgeX += tw + 4;
    }

    ctx.restore();
  }

  private renderOverdriveHUD(ctx: CanvasRenderingContext2D, timeLeft: number, width: number) {
    ctx.save();
    const isFlash = Math.floor(Date.now() / 120) % 2 === 0;
    ctx.fillStyle = isFlash ? '#facc15' : '#f59e0b';
    ctx.font = '900 16px Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    const msg = `⚡ OVERDRIVE ACTIVE! 2X FIRE RATE & INVULNERABLE (${timeLeft.toFixed(1)}s) ⚡`;
    ctx.strokeText(msg, width / 2, 80);
    ctx.fillText(msg, width / 2, 80);
    ctx.restore();
  }

  private renderPauseButton(ctx: CanvasRenderingContext2D, width: number) {
    const btnX = width - 265;
    const btnY = 20;
    const btnW = 80;
    const btnH = 34;

    ctx.save();
    // 3D Shadow
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.roundRect(btnX, btnY + 4, btnW, btnH, 8);
    ctx.fill();

    // Button body
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(btnX, btnY, btnW, btnH, 8);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⏸️ ESC', btnX + btnW / 2, btnY + btnH / 2 + 1);

    ctx.restore();
  }

  private renderAmmoChamber(ctx: CanvasRenderingContext2D, width: number) {
    const cx = width / 2 - 80;
    const cy = 20;

    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.fillRect(cx, cy, 160, 52);
    ctx.strokeRect(cx, cy, 160, 52);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 10px Courier New, monospace';
    ctx.fillText('BLASTER CHAMBER:', cx + 8, cy + 14);

    for (let i = 0; i < 3; i++) {
      const sx = cx + 22 + i * 46;
      const sy = cy + 33;

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(sx - 15, sy - 13, 30, 26);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx - 15, sy - 13, 30, 26);

      if (i < this.grid.hopperBuffer.length) {
        drawShape(ctx, this.grid.hopperBuffer[i], sx, sy, 18);
      }
    }
    ctx.restore();
  }

  private renderMiniMap(ctx: CanvasRenderingContext2D, rooms: Room[], currentRoomIndex: number, width: number) {
    const mw = 150;
    const mh = 110;
    const mx = width - mw - 25;
    const my = 20;

    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.fillRect(mx, my, mw, mh);
    ctx.strokeRect(mx, my, mw, mh);

    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 10px Courier New, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`SECTOR RADAR (${rooms.length} ROOMS)`, mx + 8, my + 13);

    if (rooms.length === 0) {
      ctx.restore();
      return;
    }

    const minGx = Math.min(...rooms.map(r => r.gridX));
    const maxGx = Math.max(...rooms.map(r => r.gridX));
    const minGy = Math.min(...rooms.map(r => r.gridY));
    const maxGy = Math.max(...rooms.map(r => r.gridY));

    const totalGridSpanX = maxGx - minGx + 1;
    const totalGridSpanY = maxGy - minGy + 1;

    const gap = 2.5;
    const availW = mw - 18;
    const availH = mh - 28;
    const cellW = Math.max(8, Math.min(18, Math.floor((availW - (totalGridSpanX - 1) * gap) / totalGridSpanX)));
    const cellH = Math.max(6, Math.min(13, Math.floor((availH - (totalGridSpanY - 1) * gap) / totalGridSpanY)));

    const contentW = totalGridSpanX * (cellW + gap) - gap;
    const contentH = totalGridSpanY * (cellH + gap) - gap;

    const originX = mx + (mw - contentW) / 2 - minGx * (cellW + gap);
    const originY = my + 18 + (mh - 18 - contentH) / 2 - minGy * (cellH + gap);

    // Corridor connections
    for (let i = 0; i < rooms.length; i++) {
      const r1 = rooms[i];
      for (const door of r1.doors) {
        if (door.targetRoomIndex > i) {
          const r2 = rooms[door.targetRoomIndex];
          if (r2 && (r1.isVisited || r2.isVisited || this.meltdown.isActive)) {
            const x1 = originX + r1.gridX * (cellW + gap) + cellW / 2;
            const y1 = originY + r1.gridY * (cellH + gap) + cellH / 2;
            const x2 = originX + r2.gridX * (cellW + gap) + cellW / 2;
            const y2 = originY + r2.gridY * (cellH + gap) + cellH / 2;
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          }
        }
      }
    }

    for (let i = 0; i < rooms.length; i++) {
      const r = rooms[i];
      if (!r.isVisited && i !== currentRoomIndex && !this.meltdown.isActive) continue;

      const rx = originX + r.gridX * (cellW + gap);
      const ry = originY + r.gridY * (cellH + gap);

      if (i === currentRoomIndex) {
        ctx.fillStyle = '#38bdf8';
      } else if (r.type === 'CORE_OVERSEER') {
        ctx.fillStyle = '#ef4444';
      } else if (r.type === 'ESCAPE_POD') {
        ctx.fillStyle = '#10b981';
      } else if (r.type === 'WORKSHOP') {
        ctx.fillStyle = '#a855f7';
      } else {
        ctx.fillStyle = r.isCleared ? '#475569' : '#b91c1c';
      }

      ctx.fillRect(rx, ry, cellW, cellH);
      ctx.strokeStyle = i === currentRoomIndex ? '#ffffff' : '#000000';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(rx, ry, cellW, cellH);
    }
    ctx.restore();
  }

  private renderMeltdownHUD(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const isFlash = Math.floor(Date.now() / 180) % 2 === 0;
    ctx.save();

    ctx.fillStyle = isFlash ? '#ef4444' : '#991b1b';
    ctx.font = 'bold 20px Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('🚨 MELTDOWN ACTIVE! SPRINT TO ESCAPE POD! 🚨', width / 2, 32);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Courier New, monospace';
    ctx.fillText(`TIME: ${this.meltdown.timeLeft.toFixed(1)}s`, width / 2, 68);

    // Pizza Tower Mach Meter (Bottom Center)
    const mw = Math.min(480, width - 60);
    const mx = width / 2 - mw / 2;
    const mh = 22;
    const my = height - 60;

    ctx.fillStyle = '#000000';
    ctx.fillRect(mx - 4, my - 24, mw + 8, mh + 30);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.strokeRect(mx - 4, my - 24, mw + 8, mh + 30);

    const fillW = (mw * this.meltdown.momentum) / 100;
    const grad = ctx.createLinearGradient(mx, my, mx + mw, my);
    grad.addColorStop(0, '#f59e0b');
    grad.addColorStop(0.5, '#ef4444');
    grad.addColorStop(1, '#ec4899');
    ctx.fillStyle = grad;
    ctx.fillRect(mx, my, fillW, mh);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Courier New, monospace';
    ctx.textAlign = 'left';
    let machText = 'MACH 0: JOGGING';
    if (this.meltdown.currentMach === 1) machText = 'MACH 1: SPRINTING';
    if (this.meltdown.currentMach === 2) machText = 'MACH 2: SUPER DASH!';
    if (this.meltdown.currentMach === 3) machText = '🔥 MACH 3: HYPER BASH (BARRICADE CRUSH!)';
    ctx.fillText(machText, mx + 4, my - 6);

    ctx.textAlign = 'right';
    ctx.fillText(`SMASHED: ${this.meltdown.barricadesSmashed}`, mx + mw - 4, my - 6);
    ctx.restore();
  }
}
