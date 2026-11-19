/**
 * Amethyst Geode Boulder — Standalone 2D Top-Down Expressive Chibi Game Asset ES Module
 * Category: pebble_rock | Base Size: 92x86px
 * Zero external dependencies — native HTML5 Canvas 2D API only.
 */

export class Crystalgeoderock {
  static metadata = {
    name: 'Amethyst Geode Boulder',
    category: 'pebble_rock',
    baseLength: 92,
    baseWidth: 86
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

  _traceRoundedPoly(ctx, pts, radius = 6) {
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

  _drawCrystalPoint(ctx, cx, cy, length, width, rot, palette) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);

    // 4-plane faceted crystal prism pointing along +X
    const tipX = length;
    const midX = length * 0.56;
    const hw = width * 0.5;

    // Crystal base shadow inside geode pocket
    ctx.fillStyle = 'rgba(26, 8, 52, 0.35)';
    ctx.beginPath();
    ctx.moveTo(0, -hw * 0.9);
    ctx.lineTo(midX + 1.2, -hw + 1.2);
    ctx.lineTo(tipX + 1.5, 1.4);
    ctx.lineTo(midX + 1.2, hw + 1.2);
    ctx.lineTo(0, hw * 0.9);
    ctx.closePath();
    ctx.fill();

    // Left/Top sunlit facet
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -hw * 0.85);
    ctx.lineTo(midX, -hw);
    ctx.lineTo(tipX, 0);
    ctx.closePath();
    ctx.fillStyle = palette.light;
    ctx.fill();

    // Right/Bottom shaded facet
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(tipX, 0);
    ctx.lineTo(midX, hw);
    ctx.lineTo(0, hw * 0.85);
    ctx.closePath();
    ctx.fillStyle = palette.dark;
    ctx.fill();

    // Tip bright lavender-white diamond bevel
    ctx.beginPath();
    ctx.moveTo(midX * 0.82, 0);
    ctx.lineTo(midX, -hw * 0.65);
    ctx.lineTo(tipX, 0);
    ctx.lineTo(midX, hw * 0.32);
    ctx.closePath();
    ctx.fillStyle = palette.tip;
    ctx.fill();

    // Specular ridge line along center spine
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.82)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(length * 0.14, 0);
    ctx.lineTo(tipX * 0.92, 0);
    ctx.stroke();

    // Crisp crystal outline
    ctx.beginPath();
    ctx.moveTo(0, -hw * 0.85);
    ctx.lineTo(midX, -hw);
    ctx.lineTo(tipX, 0);
    ctx.lineTo(midX, hw);
    ctx.lineTo(0, hw * 0.85);
    ctx.closePath();
    ctx.strokeStyle = '#2E1065';
    ctx.lineWidth = 1.35;
    ctx.stroke();

    ctx.restore();
  }

  _drawStarSparkle(ctx, x, y, r) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.quadraticCurveTo(r * 0.15, -r * 0.15, r, 0);
    ctx.quadraticCurveTo(r * 0.15, r * 0.15, 0, r);
    ctx.quadraticCurveTo(-r * 0.15, r * 0.15, -r, 0);
    ctx.quadraticCurveTo(-r * 0.15, -r * 0.15, 0, -r);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  draw(ctx) {
    if (!ctx) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // Rough cracked-open outer basaltic boulder silhouette (fits within 92x86)
    const outerRock = [
      [-41, -6], [-32, -31], [-4, -39], [26, -33],
      [42, -10], [39, 18], [20, 38], [-12, 39], [-36, 23]
    ];

    // Cracked cavity contour (white agate banding -> amethyst pocket)
    const agateOuter = [
      [-28, -5], [-21, -22], [0, -27], [20, -21],
      [29, -4], [25, 14], [10, 26], [-13, 25], [-26, 13]
    ];
    const agateInner = [
      [-22, -4], [-16, -17], [0, -21], [15, -16],
      [22, -3], [19, 11], [7, 20], [-10, 19], [-20, 10]
    ];

    // Layered ground shadow
    ctx.save();
    ctx.translate(3.8, 5.2);
    this._traceRoundedPoly(ctx, outerRock, 9);
    ctx.fillStyle = 'rgba(20, 12, 36, 0.24)';
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(1.8, 2.6);
    this._traceRoundedPoly(ctx, outerRock, 8);
    ctx.fillStyle = 'rgba(18, 10, 32, 0.34)';
    ctx.fill();
    ctx.restore();

    // Rough grey volcanic outer shell
    this._traceRoundedPoly(ctx, outerRock, 8);
    const shellGrad = ctx.createLinearGradient(-40, -36, 40, 38);
    shellGrad.addColorStop(0, '#9CA3AF');
    shellGrad.addColorStop(0.5, '#6B7280');
    shellGrad.addColorStop(1, '#3F4654');
    ctx.fillStyle = shellGrad;
    ctx.fill();

    // Clipped rough outer boulder facets, pits & cracks
    ctx.save();
    this._traceRoundedPoly(ctx, outerRock, 8);
    ctx.clip();

    // Rough weathered facets on outer shell rim
    ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.beginPath();
    ctx.moveTo(-42, -8); ctx.lineTo(-32, -34); ctx.lineTo(0, -40); ctx.lineTo(-6, -18); ctx.lineTo(-26, -6);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(20, 16, 36, 0.32)';
    ctx.beginPath();
    ctx.moveTo(42, -6); ctx.lineTo(42, 22); ctx.lineTo(18, 42); ctx.lineTo(-16, 42); ctx.lineTo(6, 22); ctx.lineTo(26, 8);
    ctx.closePath();
    ctx.fill();

    // Shell surface pits & fractures
    ctx.fillStyle = 'rgba(30, 34, 46, 0.45)';
    const pits = [
      [-33, -14, 2.0], [-26, 22, 2.2], [28, -22, 1.8], [33, 8, 2.1],
      [-8, -33, 1.9], [16, 31, 2.0], [-34, 8, 1.7]
    ];
    for (const [px, py, pr] of pits) {
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = '#252136';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-36, -18); ctx.lineTo(-24, -12);
    ctx.moveTo(28, -26); ctx.lineTo(20, -16);
    ctx.moveTo(22, 32); ctx.lineTo(14, 20);
    ctx.stroke();

    ctx.restore();

    // Bold outer boulder outline (#1E142B)
    this._traceRoundedPoly(ctx, outerRock, 8);
    ctx.strokeStyle = '#1E142B';
    ctx.lineWidth = 2.8;
    ctx.stroke();

    // --- CONCENTRIC WHITE & PALE-LAVENDER AGATE BANDING ---
    this._traceRoundedPoly(ctx, agateOuter, 5);
    const agateGrad = ctx.createLinearGradient(-26, -24, 26, 24);
    agateGrad.addColorStop(0, '#FFFFFF');
    agateGrad.addColorStop(0.55, '#E9E4F5');
    agateGrad.addColorStop(1, '#C4B5DC');
    ctx.fillStyle = agateGrad;
    ctx.fill();
    ctx.strokeStyle = '#3B2F52';
    ctx.lineWidth = 1.7;
    ctx.stroke();

    // Secondary thin lilac-grey agate ring
    ctx.save();
    this._traceRoundedPoly(ctx, agateOuter, 5);
    ctx.clip();
    this._traceRoundedPoly(ctx, agateInner, 4);
    ctx.strokeStyle = '#A78BFA';
    ctx.lineWidth = 3.2;
    ctx.stroke();
    ctx.restore();

    // --- DEEP AMETHYST GEODE CAVITY ---
    this._traceRoundedPoly(ctx, agateInner, 4);
    const cavityGrad = ctx.createRadialGradient(-4, -4, 3, 2, 2, 26);
    cavityGrad.addColorStop(0, '#5B21B6');
    cavityGrad.addColorStop(0.6, '#3B0764');
    cavityGrad.addColorStop(1, '#1E0838');
    ctx.fillStyle = cavityGrad;
    ctx.fill();
    ctx.strokeStyle = '#2E1065';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Soft violet luminescence glowing from inside the crystal bed
    const glowGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 22);
    glowGrad.addColorStop(0, 'rgba(216, 180, 254, 0.42)');
    glowGrad.addColorStop(0.65, 'rgba(139, 92, 246, 0.16)');
    glowGrad.addColorStop(1, 'rgba(139, 92, 246, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fill();

    // Faceted amethyst crystal clusters pointing inward & radially across cavity
    const deepViolet = { light: '#A855F7', dark: '#6B21A8', tip: '#E9D5FF' };
    const brightLavender = { light: '#C084FC', dark: '#7E22CE', tip: '#F5F3FF' };
    const royalAmethyst = { light: '#9333EA', dark: '#581C87', tip: '#DDD6FE' };

    const crystals = [
      // Back rim crystals
      [-17, -9, 14, 8.2, 0.35, royalAmethyst],
      [-5, -18, 15, 8.6, 1.38, deepViolet],
      [11, -15, 14, 8.0, 2.22, brightLavender],
      [20, -2, 14.5, 8.2, 3.02, royalAmethyst],
      [14, 13, 14, 8.4, -2.28, deepViolet],
      [-4, 17, 15, 8.6, -1.48, brightLavender],
      [-18, 8, 13.5, 7.8, -0.45, deepViolet],
      // Prominent hero central cluster crystals
      [-8, -2, 16.5, 9.6, -0.32, brightLavender],
      [5, -6, 15.5, 9.0, 1.95, deepViolet],
      [-1, 7, 14.5, 8.8, -0.95, brightLavender],
      [8, 5, 12.5, 7.4, -2.65, royalAmethyst]
    ];

    for (const [cx, cy, len, wid, rot, pal] of crystals) {
      this._drawCrystalPoint(ctx, cx, cy, len, wid, rot, pal);
    }

    // Dazzling 4-point star sparkles dancing across amethyst tips
    this._drawStarSparkle(ctx, 7, -7, 5.2);
    this._drawStarSparkle(ctx, -10, -10, 3.6);
    this._drawStarSparkle(ctx, 10, 7, 3.2);
    this._drawStarSparkle(ctx, -4, 4, 2.6);

    ctx.restore();
  }
}

export default Crystalgeoderock;
