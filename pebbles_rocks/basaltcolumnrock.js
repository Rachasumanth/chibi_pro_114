/**
 * Hexagonal Basalt Stepping Stones — Standalone 2D Top-Down Expressive Chibi Game Asset ES Module
 * Category: pebble_rock | Base Size: 115x105px
 * Zero external dependencies — native HTML5 Canvas 2D API only.
 */

export class Basaltcolumnrock {
  static metadata = {
    name: 'Hexagonal Basalt Stepping Stones',
    category: 'pebble_rock',
    baseLength: 115,
    baseWidth: 105
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

  _hexPoints(cx, cy, r, rot = Math.PI / 6) {
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const a = rot + (i * Math.PI) / 3;
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    return pts;
  }

  _traceRoundedHex(ctx, pts, corner = 2.6) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const p0 = pts[(i + 5) % 6];
      const p1 = pts[i];
      const p2 = pts[(i + 1) % 6];
      const v1x = p0[0] - p1[0];
      const v1y = p0[1] - p1[1];
      const v2x = p2[0] - p1[0];
      const v2y = p2[1] - p1[1];
      const l1 = Math.hypot(v1x, v1y) || 1;
      const l2 = Math.hypot(v2x, v2y) || 1;
      const c = Math.min(corner, l1 * 0.3, l2 * 0.3);
      const sx = p1[0] + (v1x / l1) * c;
      const sy = p1[1] + (v1y / l1) * c;
      const ex = p1[0] + (v2x / l2) * c;
      const ey = p1[1] + (v2y / l2) * c;
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
      ctx.quadraticCurveTo(p1[0], p1[1], ex, ey);
    }
    ctx.closePath();
  }

  _drawBasaltColumn(ctx, col) {
    const { cx, cy, r, elev, topTone, crackSeed } = col;
    const dropY = elev * 1.15;
    const dropX = elev * 0.35;

    const basePts = this._hexPoints(cx + dropX, cy + dropY, r, Math.PI / 6);
    const topPts = this._hexPoints(cx, cy, r, Math.PI / 6);
    const innerPts = this._hexPoints(cx, cy, r * 0.78, Math.PI / 6);

    // 1. Ambient occlusion shadow cast onto neighboring lower pillars/ground
    ctx.save();
    ctx.translate(dropX + 3.2, dropY + 4.2);
    this._traceRoundedHex(ctx, this._hexPoints(cx, cy, r * 1.03, Math.PI / 6), 3.0);
    ctx.fillStyle = 'rgba(14, 10, 26, 0.34)';
    ctx.fill();
    ctx.restore();

    // 2. Extruded dark volcanic basalt column side walls (visible on lower facets)
    const sideFaces = [
      { idx: [0, 1], shade: '#2D3442' },
      { idx: [1, 2], shade: '#232836' },
      { idx: [2, 3], shade: '#1D212E' }
    ];
    for (const face of sideFaces) {
      const [i0, i1] = face.idx;
      ctx.beginPath();
      ctx.moveTo(topPts[i0][0], topPts[i0][1]);
      ctx.lineTo(topPts[i1][0], topPts[i1][1]);
      ctx.lineTo(basePts[i1][0], basePts[i1][1]);
      ctx.lineTo(basePts[i0][0], basePts[i0][1]);
      ctx.closePath();
      ctx.fillStyle = face.shade;
      ctx.fill();
      ctx.strokeStyle = '#1E142B';
      ctx.lineWidth = 1.9;
      ctx.stroke();

      // Subtle vertical volcanic cooling striation on column side
      const mxTop = (topPts[i0][0] + topPts[i1][0]) * 0.5;
      const myTop = (topPts[i0][1] + topPts[i1][1]) * 0.5;
      const mxBot = (basePts[i0][0] + basePts[i1][0]) * 0.5;
      const myBot = (basePts[i0][1] + basePts[i1][1]) * 0.5;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(mxTop, myTop + 1);
      ctx.lineTo(mxBot, myBot - 1);
      ctx.stroke();
    }

    // 3. Outer beveled basalt crown base
    this._traceRoundedHex(ctx, topPts, 2.5);
    const bevelGrad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    bevelGrad.addColorStop(0, topTone.bevelLight);
    bevelGrad.addColorStop(0.5, topTone.bevelMid);
    bevelGrad.addColorStop(1, topTone.bevelDark);
    ctx.fillStyle = bevelGrad;
    ctx.fill();

    // 4. Individual bevel chamfer wedges for crisp architectural 3D feel
    const chamferColors = [
      'rgba(22, 26, 38, 0.34)',   // bottom-right
      'rgba(18, 22, 34, 0.42)',   // bottom
      'rgba(26, 32, 46, 0.22)',   // bottom-left
      'rgba(215, 232, 248, 0.22)', // top-left (sunlit)
      'rgba(230, 242, 255, 0.30)', // top (sunlit)
      'rgba(180, 198, 220, 0.14)'  // top-right
    ];
    for (let i = 0; i < 6; i++) {
      const ni = (i + 1) % 6;
      ctx.beginPath();
      ctx.moveTo(topPts[i][0], topPts[i][1]);
      ctx.lineTo(topPts[ni][0], topPts[ni][1]);
      ctx.lineTo(innerPts[ni][0], innerPts[ni][1]);
      ctx.lineTo(innerPts[i][0], innerPts[i][1]);
      ctx.closePath();
      ctx.fillStyle = chamferColors[i];
      ctx.fill();
    }

    // 5. Flat-topped volcanic plateau interior
    this._traceRoundedHex(ctx, innerPts, 1.8);
    const topGrad = ctx.createLinearGradient(cx - r * 0.7, cy - r * 0.7, cx + r * 0.7, cy + r * 0.7);
    topGrad.addColorStop(0, topTone.topLight);
    topGrad.addColorStop(1, topTone.topDark);
    ctx.fillStyle = topGrad;
    ctx.fill();

    // Crisp sunlit rim highlight along top-left inner bevel edge
    ctx.strokeStyle = 'rgba(228, 240, 252, 0.42)';
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(innerPts[3][0], innerPts[3][1]);
    ctx.lineTo(innerPts[4][0], innerPts[4][1]);
    ctx.lineTo(innerPts[5][0], innerPts[5][1]);
    ctx.stroke();

    // Volcanic micro-pores & subtle cooling hairline crack
    ctx.fillStyle = 'rgba(18, 20, 32, 0.45)';
    ctx.beginPath();
    ctx.arc(cx - r * 0.25, cy + r * 0.18, 1.1, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.22, cy - r * 0.22, 0.95, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.08, cy + r * 0.30, 0.85, 0, Math.PI * 2);
    ctx.fill();

    if (crackSeed > 0) {
      ctx.strokeStyle = 'rgba(20, 16, 34, 0.55)';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      const ang = crackSeed * 1.4;
      ctx.moveTo(cx + Math.cos(ang) * r * 0.65, cy + Math.sin(ang) * r * 0.65);
      ctx.lineTo(cx + Math.cos(ang + 0.5) * r * 0.16, cy + Math.sin(ang + 0.5) * r * 0.16);
      ctx.lineTo(cx - Math.cos(ang - 0.3) * r * 0.32, cy - Math.sin(ang - 0.3) * r * 0.32);
      ctx.stroke();
    }

    // 6. Bold chibi top outline (#1E142B)
    this._traceRoundedHex(ctx, topPts, 2.5);
    ctx.strokeStyle = '#1E142B';
    ctx.lineWidth = 2.3;
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

    // Shared deep crevice AO bed beneath the 7-column interlocking cluster
    const bedGrad = ctx.createRadialGradient(2, 4, 12, 2, 4, 56);
    bedGrad.addColorStop(0, 'rgba(16, 12, 28, 0.45)');
    bedGrad.addColorStop(0.75, 'rgba(16, 12, 28, 0.18)');
    bedGrad.addColorStop(1, 'rgba(16, 12, 28, 0)');
    ctx.fillStyle = bedGrad;
    ctx.beginPath();
    ctx.ellipse(2, 5, 55, 48, 0, 0, Math.PI * 2);
    ctx.fill();

    const highTone = {
      bevelLight: '#737F92', bevelMid: '#505A6B', bevelDark: '#343B49',
      topLight: '#657083', topDark: '#475061'
    };
    const midTone = {
      bevelLight: '#626D7F', bevelMid: '#444D5D', bevelDark: '#2C3240',
      topLight: '#555F70', topDark: '#3C4454'
    };
    const lowTone = {
      bevelLight: '#525B6B', bevelMid: '#39414F', bevelDark: '#252A36',
      topLight: '#464F5E', topDark: '#313846'
    };

    // 7 interlocking hexagonal volcanic basalt pillars at varying elevations
    // Ordered back-to-front (top-to-bottom & low-to-high) for accurate depth overlap
    const columns = [
      { cx: -17, cy: -26, r: 17.5, elev: 4.5, topTone: lowTone, crackSeed: 1 },
      { cx: 16,  cy: -27, r: 18.0, elev: 7.0, topTone: midTone, crackSeed: 2 },
      { cx: -34, cy: 2,   r: 17.0, elev: 5.5, topTone: midTone, crackSeed: 0 },
      { cx: 33,  cy: 1,   r: 17.5, elev: 4.0, topTone: lowTone, crackSeed: 3 },
      { cx: 0,   cy: -1,  r: 19.5, elev: 9.5, topTone: highTone, crackSeed: 4 },
      { cx: -16, cy: 26,  r: 17.5, elev: 6.5, topTone: midTone, crackSeed: 5 },
      { cx: 17,  cy: 25,  r: 17.0, elev: 8.0, topTone: highTone, crackSeed: 0 }
    ];

    for (const col of columns) {
      this._drawBasaltColumn(ctx, col);
    }

    // Subtle damp mineral sheen across the tallest center pillar
    ctx.fillStyle = 'rgba(220, 236, 255, 0.16)';
    ctx.beginPath();
    ctx.ellipse(-4, -5, 8.5, 4.0, -0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

export default Basaltcolumnrock;
