/**
 * Layered Red Sandstone Rock — Standalone 2D Top-Down Expressive Chibi Game Asset ES Module
 * Category: pebble_rock | Base Size: 95x85px
 * Zero external dependencies — native HTML5 Canvas 2D API only.
 */

export class Sandstonerock {
  static metadata = {
    name: 'Layered Red Sandstone Rock',
    category: 'pebble_rock',
    baseLength: 95,
    baseWidth: 85
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

  _traceMesaLayer(ctx, pts, smooth = 6) {
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
      const r = Math.min(smooth, l1 * 0.4, l2 * 0.4);
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

  draw(ctx) {
    if (!ctx) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // 4 concentric wind-eroded canyon plateau steps
    const tier0 = [
      [-42, -8], [-34, -32], [-6, -39], [28, -33],
      [44, -10], [42, 18], [22, 37], [-12, 39], [-38, 24]
    ];
    const tier1 = [
      [-33, -7], [-25, -25], [-3, -31], [22, -26],
      [34, -8], [32, 14], [16, 28], [-11, 29], [-30, 17]
    ];
    const tier2 = [
      [-23, -6], [-17, -19], [-1, -23], [15, -18],
      [23, -4], [20, 10], [9, 19], [-9, 20], [-21, 10]
    ];
    const tier3 = [
      [-12, -5], [-8, -12], [2, -14], [11, -10],
      [13, 0], [8, 9], [-4, 10], [-12, 4]
    ];

    // Warm desert dust ground shadow
    ctx.save();
    ctx.translate(3.5, 5.0);
    this._traceMesaLayer(ctx, tier0, 9);
    ctx.fillStyle = 'rgba(42, 18, 24, 0.24)';
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(1.6, 2.4);
    this._traceMesaLayer(ctx, tier0, 8);
    ctx.fillStyle = 'rgba(34, 14, 22, 0.34)';
    ctx.fill();
    ctx.restore();

    // --- TIER 0: Base Burnt-Sienna Pedestal ---
    this._traceMesaLayer(ctx, tier0, 8);
    const g0 = ctx.createLinearGradient(-42, -36, 44, 38);
    g0.addColorStop(0, '#C25A38');
    g0.addColorStop(0.55, '#9F4229');
    g0.addColorStop(1, '#752C1D');
    ctx.fillStyle = g0;
    ctx.fill();

    // Fine sedimentary strata lines clipped to Tier 0
    ctx.save();
    this._traceMesaLayer(ctx, tier0, 8);
    ctx.clip();

    const strataLines = [
      [-34, 'rgba(246, 176, 118, 0.32)', 2.0],
      [-24, 'rgba(92, 30, 20, 0.30)', 1.4],
      [-14, 'rgba(235, 145, 92, 0.28)', 1.8],
      [-4,  'rgba(86, 28, 18, 0.26)', 1.2],
      [7,   'rgba(242, 162, 104, 0.25)', 1.6],
      [18,  'rgba(78, 24, 18, 0.32)', 1.8],
      [29,  'rgba(218, 128, 78, 0.24)', 1.4]
    ];
    for (const [sy, col, lw] of strataLines) {
      ctx.strokeStyle = col;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(-48, sy);
      ctx.bezierCurveTo(-18, sy - 4, 16, sy + 5, 48, sy - 2);
      ctx.stroke();
    }

    // Sunlit outer top-left rim bevel on Tier 0
    ctx.strokeStyle = 'rgba(255, 204, 148, 0.52)';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(-39, 10);
    ctx.quadraticCurveTo(-40, -24, -6, -36);
    ctx.quadraticCurveTo(16, -36, 30, -29);
    ctx.stroke();

    ctx.restore();

    // Bold outer sandstone outline (#1E142B)
    this._traceMesaLayer(ctx, tier0, 8);
    ctx.strokeStyle = '#1E142B';
    ctx.lineWidth = 2.8;
    ctx.stroke();

    // Helper to render each concentric eroded plateau step
    const drawStep = (pts, smooth, gradStops, rimColor, lineW, offsetShadow) => {
      // Cast step drop shadow onto lower tier
      ctx.save();
      ctx.translate(offsetShadow[0], offsetShadow[1]);
      this._traceMesaLayer(ctx, pts, smooth);
      ctx.fillStyle = 'rgba(46, 16, 18, 0.42)';
      ctx.fill();
      ctx.restore();

      // Plateau fill
      this._traceMesaLayer(ctx, pts, smooth);
      const grad = ctx.createLinearGradient(-30, -28, 30, 28);
      grad.addColorStop(0, gradStops[0]);
      grad.addColorStop(0.58, gradStops[1]);
      grad.addColorStop(1, gradStops[2]);
      ctx.fillStyle = grad;
      ctx.fill();

      // Clipped fine ochre striations & sunlit step lip
      ctx.save();
      this._traceMesaLayer(ctx, pts, smooth);
      ctx.clip();

      ctx.strokeStyle = 'rgba(255, 224, 174, 0.32)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-36, -6);
      ctx.quadraticCurveTo(0, -11, 36, -4);
      ctx.moveTo(-36, 8);
      ctx.quadraticCurveTo(0, 13, 36, 6);
      ctx.stroke();

      // Sunlit rim highlight along upper-left contour
      ctx.strokeStyle = rimColor;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(pts[0][0] + 1, pts[0][1] + 2);
      ctx.lineTo(pts[1][0] + 1.5, pts[1][1] + 1.5);
      ctx.lineTo(pts[2][0] + 1, pts[2][1] + 1.5);
      ctx.lineTo(pts[3][0], pts[3][1] + 1.5);
      ctx.stroke();

      ctx.restore();

      // Crisp inner step crevice outline
      this._traceMesaLayer(ctx, pts, smooth);
      ctx.strokeStyle = '#3A1922';
      ctx.lineWidth = lineW;
      ctx.stroke();
    };

    // --- TIER 1: Warm Terracotta Step ---
    drawStep(
      tier1, 7,
      ['#DF7C4E', '#C9633B', '#9A4026'],
      'rgba(255, 214, 162, 0.62)',
      2.0,
      [2.2, 2.8]
    );

    // --- TIER 2: Golden Ochre Step ---
    drawStep(
      tier2, 6,
      ['#F2A863', '#DE8349', '#B25731'],
      'rgba(255, 232, 184, 0.72)',
      1.7,
      [1.8, 2.3]
    );

    // --- TIER 3: Sun-Baked Cream-Ochre Crown ---
    drawStep(
      tier3, 5,
      ['#FCD08E', '#EFA662', '#CC733E'],
      'rgba(255, 246, 218, 0.85)',
      1.4,
      [1.3, 1.8]
    );

    // Subtle wind-carved vertical fissure cracks crossing steps
    ctx.strokeStyle = '#2B131E';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(16, -24);
    ctx.lineTo(19, -12);
    ctx.lineTo(26, -6);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-18, 16);
    ctx.lineTo(-14, 26);
    ctx.lineTo(-22, 34);
    ctx.stroke();

    // Fine sandstone grit grains scattered across plateaus
    const grains = [
      [-6, -4, 1.1, '#8C3B23'], [4, -7, 0.9, '#FFF0CC'], [2, 4, 1.0, '#9E4528'],
      [-15, -12, 1.1, '#FFF0CC'], [14, 6, 1.2, '#7E301C'], [-26, 4, 1.1, '#6E2618'],
      [26, -14, 1.0, '#FFDDB0'], [10, 22, 1.2, '#6A2416'], [-8, 24, 1.0, '#F8C482']
    ];
    for (const [gx, gy, gr, col] of grains) {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(gx, gy, gr, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

export default Sandstonerock;
