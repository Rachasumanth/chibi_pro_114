/**
 * Speckled Granite Boulder — Standalone 2D Top-Down Expressive Chibi Game Asset ES Module
 * Category: pebble_rock | Base Size: 135x120px
 * Zero external dependencies — native HTML5 Canvas 2D API only.
 */

export class Graniteboulder {
  static metadata = {
    name: 'Speckled Granite Boulder',
    category: 'pebble_rock',
    baseLength: 135,
    baseWidth: 120
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

  _traceRoundedPoly(ctx, pts, radius = 8) {
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
      const r = Math.min(radius, l1 * 0.38, l2 * 0.38);
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

  _fillFacet(ctx, pts, fillStyle) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i][0], pts[i][1]);
    }
    ctx.closePath();
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }

  draw(ctx) {
    if (!ctx) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // Chunky, sculpted angular granite silhouette (fits cleanly within 135x120)
    const outerPoly = [
      [-58, -14],
      [-46, -46],
      [-10, -54],
      [34, -48],
      [58, -22],
      [62, 16],
      [42, 46],
      [4, 54],
      [-38, 48],
      [-60, 22]
    ];

    // Layered ambient ground shadow + tight contact AO
    ctx.save();
    ctx.translate(5, 7);
    this._traceRoundedPoly(ctx, outerPoly, 12);
    ctx.fillStyle = 'rgba(20, 14, 34, 0.22)';
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(2.5, 3.5);
    this._traceRoundedPoly(ctx, outerPoly, 11);
    ctx.fillStyle = 'rgba(18, 12, 32, 0.30)';
    ctx.fill();
    ctx.restore();

    // Base granite body fill
    this._traceRoundedPoly(ctx, outerPoly, 10);
    const baseGrad = ctx.createLinearGradient(-56, -50, 58, 52);
    baseGrad.addColorStop(0, '#DFE4EA');
    baseGrad.addColorStop(0.45, '#B8C1CC');
    baseGrad.addColorStop(1, '#7D8796');
    ctx.fillStyle = baseGrad;
    ctx.fill();

    // Clip to outer silhouette for multi-plane facets, crevices & granite speckles
    ctx.save();
    this._traceRoundedPoly(ctx, outerPoly, 10);
    ctx.clip();

    // Sculpted top-down facet planes
    // 1. Deep shadow lower-right cliff face
    const southEastFacet = [
      [14, 14], [58, -18], [66, 20], [44, 50], [4, 58], [-12, 30]
    ];
    const seGrad = ctx.createLinearGradient(12, 12, 56, 48);
    seGrad.addColorStop(0, '#8D97A6');
    seGrad.addColorStop(1, '#646E7E');
    this._fillFacet(ctx, southEastFacet, seGrad);

    // 2. Mid-shadow lower-left flank
    const southWestFacet = [
      [-62, 22], [-30, 12], [-12, 30], [4, 58], [-42, 52]
    ];
    const swGrad = ctx.createLinearGradient(-46, 16, -8, 52);
    swGrad.addColorStop(0, '#9DA6B4');
    swGrad.addColorStop(1, '#758090');
    this._fillFacet(ctx, southWestFacet, swGrad);

    // 3. Mid-tone north-east shoulder
    const northEastFacet = [
      [10, -24], [36, -52], [62, -22], [58, -18], [14, 14], [2, -6]
    ];
    const neGrad = ctx.createLinearGradient(10, -40, 56, 4);
    neGrad.addColorStop(0, '#C7CFD9');
    neGrad.addColorStop(1, '#9BA5B3');
    this._fillFacet(ctx, northEastFacet, neGrad);

    // 4. Bright sunlit north-west shoulder
    const northWestFacet = [
      [-62, -16], [-48, -50], [-10, -58], [10, -24], [-22, -14], [-30, 12], [-62, 22]
    ];
    const nwGrad = ctx.createLinearGradient(-56, -48, -16, 10);
    nwGrad.addColorStop(0, '#EFF3F7');
    nwGrad.addColorStop(1, '#C5CDD7');
    this._fillFacet(ctx, northWestFacet, nwGrad);

    // 5. Elevated sunlit crown plateau
    const crownPoly = [
      [-32, -26], [-8, -42], [22, -32], [26, -4], [6, 14], [-24, 10], [-38, -8]
    ];
    const crownGrad = ctx.createLinearGradient(-34, -38, 22, 16);
    crownGrad.addColorStop(0, '#F6F8FA');
    crownGrad.addColorStop(0.6, '#DCE2E9');
    crownGrad.addColorStop(1, '#BDC6D2');
    this._traceRoundedPoly(ctx, crownPoly, 5);
    ctx.fillStyle = crownGrad;
    ctx.fill();

    // Subtle secondary step chip on top-left crown
    const chipPoly = [
      [-24, -22], [-6, -32], [10, -24], [4, -10], [-16, -8]
    ];
    this._traceRoundedPoly(ctx, chipPoly, 4);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.34)';
    ctx.fill();

    // Crisp facet ridge highlights (sunlit beveled edges)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(-36, -10);
    ctx.lineTo(-30, -26);
    ctx.lineTo(-8, -41);
    ctx.lineTo(20, -31);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.38)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-30, 11);
    ctx.lineTo(-22, 10);
    ctx.lineTo(6, 14);
    ctx.lineTo(25, -4);
    ctx.stroke();

    // Dense deterministic granite speckles: dark biotite mica, feldspar, and bright quartz flecks
    const speckles = [
      // Dark biotite mica clusters
      [-42, -28, 2.2, '#2B303C'], [-36, -18, 1.6, '#394050'], [-48, -6, 2.0, '#2B303C'],
      [-26, -34, 1.8, '#323846'], [-14, -44, 2.3, '#252A36'], [-4, -36, 1.5, '#3E4656'],
      [8, -42, 2.0, '#2D3340'], [22, -38, 1.9, '#394050'], [34, -30, 2.2, '#2B303C'],
      [44, -18, 1.7, '#323846'], [48, -4, 2.4, '#252A36'], [38, 8, 1.8, '#2D3340'],
      [48, 22, 2.1, '#252A36'], [34, 34, 2.3, '#2B303C'], [18, 40, 1.7, '#323846'],
      [2, 44, 2.0, '#252A36'], [-18, 38, 2.2, '#2B303C'], [-34, 34, 1.9, '#394050'],
      [-46, 18, 2.1, '#2B303C'], [-40, 4, 1.5, '#323846'], [-22, -18, 1.8, '#394050'],
      [-8, -22, 2.1, '#2B303C'], [6, -16, 1.6, '#3E4656'], [16, -8, 2.0, '#2B303C'],
      [-14, -4, 2.3, '#2D3340'], [2, 4, 1.8, '#323846'], [-26, 2, 1.7, '#394050'],
      [14, 20, 2.2, '#252A36'], [-4, 24, 1.9, '#2D3340'], [26, 18, 1.6, '#394050'],
      [-18, 18, 1.5, '#323846'], [30, -14, 1.8, '#2B303C'], [-32, 20, 2.0, '#252A36'],
      // Warm pinkish-tan potassium feldspar grains
      [-28, -12, 1.9, '#C7A99A'], [12, -26, 2.1, '#CFAFA0'], [28, 4, 1.8, '#B89B8D'],
      [-6, 16, 2.0, '#C2A596'], [-38, -12, 1.6, '#D4B7A8'], [20, 30, 1.9, '#A88D80'],
      [40, -10, 1.7, '#B89B8D'], [-22, 32, 1.8, '#B09486'], [4, -6, 1.5, '#D4B7A8'],
      // Bright sparkling quartz crystals
      [-34, -32, 1.4, '#FFFFFF'], [-18, -28, 1.6, '#F8FCFF'], [-4, -14, 1.5, '#FFFFFF'],
      [12, -32, 1.3, '#F8FCFF'], [24, -20, 1.5, '#FFFFFF'], [-26, -4, 1.4, '#F4FAFF'],
      [6, 10, 1.3, '#FFFFFF'], [-12, 28, 1.4, '#EEF6FF'], [34, 14, 1.2, '#E8F2FF'],
      [-44, 10, 1.5, '#F8FCFF'], [18, -2, 1.6, '#FFFFFF'], [-2, -30, 1.3, '#FFFFFF'],
      [38, -24, 1.4, '#F8FCFF'], [-30, 14, 1.2, '#EEF6FF'], [8, 34, 1.3, '#E8F2FF']
    ];
    for (const [sx, sy, sr, col] of speckles) {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.ellipse(sx, sy, sr, sr * 0.78, (sx + sy) * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Deep shaded crevices & fracture cracks with bright micro-bevel edges
    const drawCrevice = (pts, width) => {
      // Soft AO around crevice
      ctx.strokeStyle = 'rgba(28, 22, 46, 0.24)';
      ctx.lineWidth = width + 3.2;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.stroke();

      // Sunlit lip on upper-left side of crack
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(pts[0][0] - 1.2, pts[0][1] - 1.2);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0] - 1.2, pts[i][1] - 1.2);
      ctx.stroke();

      // Deep espresso-slate crevice core
      ctx.strokeStyle = '#251D36';
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.stroke();
    };

    // Main diagonal granite cleavage crack
    drawCrevice([[34, -46], [24, -26], [28, -4], [12, 14], [18, 32], [4, 52]], 2.2);
    // Branching left crevice
    drawCrevice([[12, 14], [-8, 16], [-24, 10], [-42, 22]], 1.7);
    // Upper hairline fissure
    drawCrevice([[-10, -52], [-6, -34], [-18, -22]], 1.4);

    // Subtle cool reflected rim on bottom-right edge
    ctx.strokeStyle = 'rgba(195, 214, 236, 0.28)';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(56, 16);
    ctx.quadraticCurveTo(38, 44, 4, 49);
    ctx.stroke();

    ctx.restore(); // end clip

    // Bold expressive chibi boulder outline (#1E142B)
    this._traceRoundedPoly(ctx, outerPoly, 10);
    ctx.strokeStyle = '#1E142B';
    ctx.lineWidth = 3.0;
    ctx.stroke();

    ctx.restore();
  }
}

export default Graniteboulder;
