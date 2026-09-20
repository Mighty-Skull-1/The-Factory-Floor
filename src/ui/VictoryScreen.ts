import { MeltdownRank, GameMode } from '../types';

export class VictoryScreen {
  private confetti: { x: number; y: number; vx: number; vy: number; color: string; size: number }[] = [];

  constructor() {
    const colors = ['#f59e0b', '#ef4444', '#38bdf8', '#10b981', '#ec4899', '#facc15'];
    for (let i = 0; i < 70; i++) {
      this.confetti.push({
        x: Math.random() * 1920,
        y: Math.random() * 1080 - 1080,
        vx: (Math.random() - 0.5) * 60,
        vy: 120 + Math.random() * 180,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 6 + Math.random() * 8,
      });
    }
  }

  public update(dt: number, width: number, height: number) {
    for (const c of this.confetti) {
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      if (c.y > height) {
        c.y = -20;
        c.x = Math.random() * width;
      }
    }
  }

  public render(
    ctx: CanvasRenderingContext2D,
    rank: MeltdownRank,
    width: number,
    height: number,
    sector: number = 1,
    gameMode: GameMode = 'STANDARD'
  ) {
    this.update(0.016, width, height);

    ctx.save();
    // Backdrop
    ctx.fillStyle = 'rgba(8, 14, 26, 0.96)';
    ctx.fillRect(0, 0, width, height);

    // Confetti
    for (const c of this.confetti) {
      ctx.fillStyle = c.color;
      ctx.fillRect(c.x, c.y, c.size, c.size * 0.6);
    }

    const cx = width / 2;
    const cy = height * 0.14;

    // Header
    const isEndless = gameMode === 'ENDLESS';
    const isFinalSector = !isEndless && sector >= 3;
    const loopNum = Math.floor((sector - 1) / 3) + 1;

    let headerText = `⚡ SECTOR 0${sector} EVACUATION SUCCESSFUL! ⚡`;
    if (isEndless) {
      headerText = `♾️ ENDLESS LOOP 0${loopNum}: SECTOR 0${sector} ESCAPED! ♾️`;
    } else if (isFinalSector) {
      headerText = '🎉 GRAND VICTORY: FACTORY LIBERATED! 🎉';
    }

    ctx.fillStyle = isEndless ? '#a855f7' : (isFinalSector ? '#facc15' : '#10b981');
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 5;
    ctx.font = '900 36px Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.strokeText(headerText, cx, cy);
    ctx.fillText(headerText, cx, cy);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 16px Courier New, monospace';
    ctx.fillText(rank.title, cx, cy + 34);

    // Pizza Tower Lap 2 Badge
    if (rank.isLap2) {
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.font = '900 18px Courier New, monospace';
      ctx.strokeText('★ PIZZA TOWER LAP 2 COMPLETED! ★', cx, cy + 64);
      ctx.fillText('★ PIZZA TOWER LAP 2 COMPLETED! ★', cx, cy + 64);
    }

    // Giant Cartoon Rank Stamp
    const rankColors: Record<string, string> = {
      P: '#f59e0b',
      S: '#a855f7',
      A: '#38bdf8',
      B: '#10b981',
      C: '#64748b',
    };
    const col = rankColors[rank.rank] || '#ffffff';

    const stampY = cy + (rank.isLap2 ? 175 : 155);
    ctx.font = '900 130px "Impact", "Arial Black", Courier New, monospace';
    ctx.fillStyle = col;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 10;
    ctx.shadowColor = col;
    ctx.shadowBlur = 35;
    ctx.strokeText(rank.rank, cx, stampY);
    ctx.fillText(rank.rank, cx, stampY);
    ctx.shadowBlur = 0;

    // Stats Table Card
    const tableW = Math.min(540, width - 40);
    const tableH = 190;
    const tableX = cx - tableW / 2;
    const tableY = stampY + 30;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(tableX, tableY, tableW, tableH);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeRect(tableX, tableY, tableW, tableH);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 15px Courier New, monospace';

    ctx.textAlign = 'left';
    ctx.fillText(`⏱ ESCAPE TIME:`, tableX + 30, tableY + 42);
    ctx.textAlign = 'right';
    ctx.fillText(`${rank.escapeTime}s`, tableX + tableW - 30, tableY + 42);

    ctx.textAlign = 'left';
    ctx.fillText(`🔥 MAX MACH COMBO:`, tableX + 30, tableY + 82);
    ctx.textAlign = 'right';
    ctx.fillText(`${rank.maxCombo}s`, tableX + tableW - 30, tableY + 82);

    ctx.textAlign = 'left';
    ctx.fillText(`💥 BARRICADES SMASHED:`, tableX + 30, tableY + 122);
    ctx.textAlign = 'right';
    ctx.fillText(`${rank.barricadesSmashed}`, tableX + tableW - 30, tableY + 122);

    ctx.textAlign = 'left';
    ctx.fillText(`🎁 BONUS REWARD:`, tableX + 30, tableY + 162);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`${rank.bonusReward.count}x ${rank.bonusReward.name}`, tableX + tableW - 30, tableY + 162);

    // Call to action button
    const btnW = 460;
    const btnH = 50;
    const btnX = cx - btnW / 2;
    const btnY = tableY + tableH + 30;

    ctx.fillStyle = isEndless ? '#c084fc' : (isFinalSector ? '#10b981' : '#facc15');
    ctx.beginPath();
    ctx.roundRect(btnX, btnY, btnW, btnH, 12);
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 15px Courier New, monospace';
    ctx.textAlign = 'center';
    let btnLabel = `⚡ ADVANCE TO SECTOR 0${sector + 1} [SPACE / CLICK] ➔`;
    if (isEndless) {
      btnLabel = `♾️ SPRINT INTO SECTOR 0${sector + 1}! [SPACE / CLICK] ➔`;
    } else if (isFinalSector) {
      btnLabel = '🎉 RETURN TO MAIN MENU [SPACE / CLICK] 🎉';
    }
    ctx.fillText(btnLabel, cx, btnY + 31);

    ctx.restore();
  }
}
