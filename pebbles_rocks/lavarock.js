/**
 * Magma-Veined Scoria Lava Rock — Standalone 2D Top-Down Expressive Chibi Game Asset ES Module
 * Category: pebble_rock | Base Size: 112x98px
 * Zero external dependencies — native HTML5 Canvas 2D API only.
 */

export class Lavarock {
  static metadata = {
    name: 'Magma-Veined Scoria Lava Rock',
    category: 'pebble_rock',
    baseLength: 112,
    baseWidth: 98
  };

  constructor(x = 0, y = 0, scale = 1) {
    this.x = x;
    this.y = y;
    this.scale = scale;
    this.angle = 0;
  }

  play(_name) {}
  update(_dt) {}

  setAngle(radians) {
    if (Number.isFinite(radians)) this.angle = radians;
  }

  setDirection(dx, dy) {
    if ((dx !== 0 || dy !== 0) && Number.isFinite(dx) && Number.isFinite(dy)) {
      this.angle = Math.atan2(dy, dx);
    }
  }

  getState() {
    return 'static';
  }

  onFinished(_name, _callback) {}

  _traceRoundedPoly(ctx, pts, radius = 7) {
    const n = pts.length;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n];
      const p1 = pts[i];
      const p2 = pts[(i + 1) % n];
      const v1x = p0[0] - p1[0];
      const v1y = p0[1] - p1[1];
      const v2x = p2[0] - p1[0];
      const v2y = p2[1] - p1[1];
      const l1 = Math.hypot(v1x, v1y) || 1;
      const l2 = Math.hypot(v2x, v2y) || 1;
      const r = Math.min(radius, l1 * 0.36, l2 * 0.36);
      const sx = p1[0] + (v1x / l1) * r;
      const sy = p1[1] + (v1y / l1) * r;
      const ex = p1[0] + (v2x / l2) * r;
      const ey = p1[1] + (v2y / l2) * r;
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
      ctx.quadraticCurveTo(p1[0], p1[1], ex, ey);
    }
    ctx.closePath();
  }

  _drawMagmaVein(ctx, pts, coreWidth) {
    const trace = () => {
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i][0], pts[i][1]);
      }
    };

    // 1. Soft molten orange-red heat bloom onto surrounding charcoal crust
    trace();
    ctx.strokeStyle = 'rgba(234, 88, 12, 0.24)';
    ctx.lineWidth = coreWidth + 9.0;
    ctx.stroke();

    // 2. Intense crimson-orange fissure halo
    trace();
    ctx.strokeStyle = 'rgba(249, 115, 22, 0.55)';
    ctx.lineWidth = coreWidth + 4.4;
    ctx.stroke();

    // 3. Dark charred fissure rim
    trace();
    ctx.strokeStyle = '#7C1D12';
    ctx.lineWidth = coreWidth + 2.2;
    ctx.stroke();

    // 4. Molten orange-red magma body
    trace();
    ctx.strokeStyle = '#FB923C';
    ctx.lineWidth = coreWidth + 0.6;
    ctx.stroke();

    // 5. Incandescent yellow-white core
    trace();
    ctx.strokeStyle = '#FEF08A';
    ctx.lineWidth = Math.max(1.1, coreWidth * 0.56);
    ctx.stroke();
  }

  draw(ctx) {
    if (!ctx) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // Chunky craggy volcanic scoria boulder silhouette (fits within 112x98)
    const outerRock = [
      [-50, -8], [-40, -36], [-10, -45], [24, -40],
      [48, -18], [51, 12], [34, 39], [2, 44], [-32, 36], [-49, 16]
    ];

    // Subtle molten underglow cast onto surrounding ground
    const heatHalo = ctx.createRadialGradient(2, 2, 16, 2, 2, 58);
    heatHalo.addColorStop(0, 'rgba(234, 88, 12, 0.30)');
    heatHalo.addColorStop(0.68, 'rgba(185, 28, 28, 0.14)');
    heatHalo.addColorStop(1, 'rgba(185, 28, 28, 0)');
    ctx.fillStyle = heatHalo;
    ctx.beginPath();
    ctx.ellipse(2, 3, 56, 48, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ground cast shadow
    ctx.save();
    ctx.translate(4, 5.5);
    this._traceRoundedPoly(ctx, outerRock, 9);
    ctx.fillStyle = 'rgba(16, 10, 24, 0.34)';
    ctx.fill();
    ctx.restore();

    // Base dark-charcoal volcanic scoria body
    this._traceRoundedPoly(ctx, outerRock, 8);
    const bodyGrad = ctx.createRadialGradient(-16, -18, 6, 4, 6, 58);
    bodyGrad.addColorStop(0, '#4B4854');
    bodyGrad.addColorStop(0.55, '#302D38');
    bodyGrad.addColorStop(1, '#1A1722');
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    // Clipped scoria facets, porous craters, cooling magma veins & embers
    ctx.save();
    this._traceRoundedPoly(ctx, outerRock, 8);
    ctx.clip();

    // Angular cooled basalt-scoria crust planes
    ctx.fillStyle = 'rgba(118, 114, 134, 0.24)';
    ctx.beginPath();
    ctx.moveTo(-48, -8); ctx.lineTo(-38, -36); ctx.lineTo(-8, -44); ctx.lineTo(-2, -16); ctx.lineTo(-24, -4);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(14, 10, 22, 0.42)';
    ctx.beginPath();
    ctx.moveTo(48, -14); ctx.lineTo(52, 16); ctx.lineTo(32, 42); ctx.lineTo(-2, 46); ctx.lineTo(8, 18); ctx.lineTo(28, 4);
    ctx.closePath();
    ctx.fill();

    // Sunlit rim bevel along top-left crust edge
    ctx.strokeStyle = 'rgba(168, 162, 186, 0.30)';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(-44, 10);
    ctx.lineTo(-46, -8);
    ctx.lineTo(-36, -32);
    ctx.lineTo(-10, -40);
    ctx.stroke();

    // Porous volcanic scoria craters & gas vesicles
    const craters = [
      [-32, -20, 4.4, false], [-20, -30, 3.2, false], [18, -28, 4.0, false],
      [34, -12, 4.6, false], [32, 14, 3.8, false], [14, 28, 4.2, false],
      [-24, 22, 4.5, false], [-36, 6, 3.4, false], [-10, 14, 3.6, true],
      [14, -4, 3.8, true], [-4, -16, 2.8, false], [24, 24, 2.6, false],
      [-34, -6, 2.2, false], [4, 34, 2.9, false]
    ];

    for (const [cx, cy, cr, hot] of craters) {
      // Raised cool rim highlight on bottom-right
      ctx.fillStyle = 'rgba(130, 124, 148, 0.25)';
      ctx.beginPath();
      ctx.arc(cx + 0.7, cy + 0.8, cr + 0.6, 0, Math.PI * 2);
      ctx.fill();

      // Crater bowl interior
      ctx.fillStyle = hot ? '#4A1814' : '#191520';
      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx.fill();

      // Deep top-left pit shadow
      ctx.fillStyle = '#0E0B14';
      ctx.beginPath();
      ctx.arc(cx - cr * 0.16, cy - cr * 0.16, cr * 0.68, 0, Math.PI * 2);
      ctx.fill();

      // Glowing ember pool inside select active vents
      if (hot) {
        const ventGrad = ctx.createRadialGradient(cx, cy, 0.3, cx, cy, cr * 0.75);
        ventGrad.addColorStop(0, '#FEF08A');
        ventGrad.addColorStop(0.5, '#F97316');
        ventGrad.addColorStop(1, 'rgba(220, 38, 38, 0)');
        ctx.fillStyle = ventGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, cr * 0.75, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Glowing cooling magma fissure network traversing the boulder
    // Primary central magma canyon
    this._drawMagmaVein(ctx, [
      [-40, -14], [-22, -6], [-6, -12], [6, 2], [22, -4], [40, 8]
    ], 3.0);

    // Upper volcanic split branch
    this._drawMagmaVein(ctx, [
      [-6, -12], [0, -26], [10, -38]
    ], 2.2);

    // Lower molten crack branch
    this._drawMagmaVein(ctx, [
      [6, 2], [-2, 18], [6, 30], [2, 41]
    ], 2.4);

    // Side ember hairline crack
    this._drawMagmaVein(ctx, [
      [-22, -6], [-28, 8], [-38, 16]
    ], 1.7);

    // Bright molten hotspot pools at fissure junctions
    const hotspots = [[-6, -12, 4.6], [6, 2, 5.2], [-22, -6, 3.6]];
    for (const [hx, hy, hr] of hotspots) {
      const hGrad = ctx.createRadialGradient(hx, hy, 0.5, hx, hy, hr * 1.9);
      hGrad.addColorStop(0, '#FFFFFF');
      hGrad.addColorStop(0.35, '#FEF08A');
      hGrad.addColorStop(0.7, 'rgba(249, 115, 22, 0.55)');
      hGrad.addColorStop(1, 'rgba(234, 88, 12, 0)');
      ctx.fillStyle = hGrad;
      ctx.beginPath();
      ctx.arc(hx, hy, hr * 1.9, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore(); // end scoria clip

    // Bold expressive chibi outline (#1E142B)
    this._traceRoundedPoly(ctx, outerRock, 8);
    ctx.strokeStyle = '#1E142B';
    ctx.lineWidth = 2.9;
    ctx.stroke();

    ctx.restore();
  }
}

export default Lavarock;
