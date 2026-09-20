import { ShapeData, ShapeKind, ColorType } from '../types';

export const COLOR_PALETTE: Record<ColorType, { fill: string; stroke: string; glow: string; name: string }> = {
  raw: {
    fill: '#94a3b8',
    stroke: '#cbd5e1',
    glow: 'rgba(148, 163, 184, 0.4)',
    name: 'Raw Steel',
  },
  red: {
    fill: '#ef4444',
    stroke: '#fca5a5',
    glow: 'rgba(239, 68, 68, 0.8)',
    name: 'Explosive Thermal',
  },
  blue: {
    fill: '#38bdf8',
    stroke: '#bae6fd',
    glow: 'rgba(56, 189, 248, 0.8)',
    name: 'Cryo Pierce',
  },
  yellow: {
    fill: '#facc15',
    stroke: '#fef08a',
    glow: 'rgba(250, 204, 21, 0.8)',
    name: 'Chain Voltage',
  },
  green: {
    fill: '#22c55e',
    stroke: '#86efac',
    glow: 'rgba(34, 197, 94, 0.8)',
    name: 'Corrosive Acid',
  },
  purple: {
    fill: '#a855f7',
    stroke: '#e9d5ff',
    glow: 'rgba(168, 85, 247, 0.9)',
    name: 'Void Gravity',
  },
};

export function createShape(kind: ShapeKind, color: ColorType = 'raw', tier: number = 1): ShapeData {
  return {
    id: `shape_${Math.random().toString(36).substr(2, 9)}`,
    kind,
    color,
    tier,
  };
}

export function drawShape(
  ctx: CanvasRenderingContext2D,
  shape: ShapeData,
  x: number,
  y: number,
  size: number,
  angle: number = 0
) {
  const pal = COLOR_PALETTE[shape.color] || COLOR_PALETTE.raw;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  ctx.fillStyle = pal.fill;
  ctx.strokeStyle = pal.stroke;
  ctx.lineWidth = Math.max(1.5, size * 0.12);
  ctx.shadowColor = pal.glow;
  ctx.shadowBlur = 6;

  ctx.beginPath();
  const r = size / 2;

  switch (shape.kind) {
    case 'circle': {
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Core ring
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.stroke();
      break;
    }
    case 'square': {
      ctx.rect(-r, -r, size, size);
      ctx.fill();
      ctx.stroke();
      // Inner cross
      ctx.beginPath();
      ctx.moveTo(-r * 0.5, 0);
      ctx.lineTo(r * 0.5, 0);
      ctx.moveTo(0, -r * 0.5);
      ctx.lineTo(0, r * 0.5);
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.stroke();
      break;
    }
    case 'semi-circle': {
      // Pointed shard shape
      ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, false);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Razor line
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(0, r);
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
      break;
    }
    case 'triangle': {
      ctx.moveTo(0, -r);
      ctx.lineTo(r, r);
      ctx.lineTo(-r, r);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'star': {
      const points = 5;
      const innerR = r * 0.48;
      for (let i = 0; i < points * 2; i++) {
        const radius = i % 2 === 0 ? r : innerR;
        const a = (i * Math.PI) / points - Math.PI / 2;
        const px = Math.cos(a) * radius;
        const py = Math.sin(a) * radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }
    case 'compound': {
      // Base square + 4 corner triangles
      ctx.rect(-r * 0.8, -r * 0.8, size * 0.8, size * 0.8);
      ctx.fill();
      ctx.stroke();
      // Star center
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      break;
    }
  }

  // Tier > 1 energized aura / indicators
  if (shape.tier > 1) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.25, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#facc15';
    for (let i = 0; i < shape.tier; i++) {
      const a = (i * Math.PI * 2) / shape.tier;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * r * 1.25, Math.sin(a) * r * 1.25, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}
