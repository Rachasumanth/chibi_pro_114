/**
 * Layered Blue-Grey Slate Rock — Standalone 2D Top-Down Expressive Chibi Game Asset ES Module
 * Category: pebble_rock | Base Size: 98x84px
 * Zero external dependencies — native HTML5 Canvas 2D API only.
 */

export class Slateflagstonerock {
  static metadata = {
    name: 'Layered Blue-Grey Slate Rock',
    category: 'pebble_rock',
    baseLength: 98,
    baseWidth: 84
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

  _traceSharpPoly(ctx, pts, bevel = 2.4) {
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
      const r = Math.min(bevel, l1 * 0.28, l2 * 0.28);
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

  _drawSlatePlate(ctx, cfg) {
    const {
      pts, thickness, topLight, topDark, edgeColor,
      rimHighlightIndices, striations, outlineW
    } = cfg;

    // 1. Soft cast drop shadow beneath each stepped plate
    ctx.save();
    ctx.translate(2.2, thickness + 2.8);
    this._traceSharpPoly(ctx, pts, 2.5);
    ctx.fillStyle = 'rgba(16, 18, 34, 0.30)';
    ctx.fill();
    ctx.restore();

    // 2. Stepped flaky side thickness rim (extruded slightly down-right)
    ctx.save();
    ctx.translate(0.8, thickness);
    this._traceSharpPoly(ctx, pts, 2.4);
    ctx.fillStyle = edgeColor;
    ctx.fill();
    ctx.strokeStyle = '#1E142B';
    ctx.lineWidth = outlineW;
    ctx.stroke();
    ctx.restore();

    // 3. Flat blue-grey shale plate top surface
    this._traceSharpPoly(ctx, pts, 2.4);
    const topGrad = ctx.createLinearGradient(-42, -34, 42, 34);
    topGrad.addColorStop(0, topLight);
    topGrad.addColorStop(1, topDark);
    ctx.fillStyle = topGrad;
    ctx.fill();

    // Clipped flaky shale striations, chipped mineral veins & crisp sunlit edge highlights
    ctx.save();
    this._traceSharpPoly(ctx, pts, 2.4);
    ctx.clip();

    // Parallel metamorphic cleavage striations
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.26)';
    ctx.lineWidth = 1.0;
    for (const [x1, y1, x2, y2] of striations) {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Subtle cool mineral sheen across top-left of slab
    ctx.fillStyle = 'rgba(226, 238, 252, 0.16)';
    ctx.beginPath();
    ctx.ellipse(-12, -10, 26, 14, -0.25, 0, Math.PI * 2);
    ctx.fill();

    // Crisp razor-sharp sunlit bevel highlights on top-left plate edges
    ctx.strokeStyle = 'rgba(226, 240, 255, 0.65)';
    ctx.lineWidth = 1.75;
    ctx.beginPath();
    for (let k = 0; k < rimHighlightIndices.length; k++) {
      const p = pts[rimHighlightIndices[k]];
      if (k === 0) ctx.moveTo(p[0], p[1] + 0.8);
      else ctx.lineTo(p[0], p[1] + 0.8);
    }
    ctx.stroke();

    ctx.restore();

    // Bold expressive chibi slate plate outline (#1E142B)
    this._traceSharpPoly(ctx, pts, 2.4);
    ctx.strokeStyle = '#1E142B';
    ctx.lineWidth = outlineW;
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

    // Base ambient ground shadow
    const baseShadow = ctx.createRadialGradient(2, 4, 12, 2, 4, 48);
    baseShadow.addColorStop(0, 'rgba(18, 16, 34, 0.28)');
    baseShadow.addColorStop(1, 'rgba(18, 16, 34, 0)');
    ctx.fillStyle = baseShadow;
    ctx.beginPath();
    ctx.ellipse(2, 5, 48, 40, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4 overlapping stepped chipped slate plate layers (bottom to top)
    // Layer 0: Broad bottom flagstone slab
    this._drawSlatePlate(ctx, {
      pts: [
        [-45, -4], [-36, -28], [-6, -36], [30, -30],
        [45, -8], [41, 20], [18, 34], [-18, 35], [-42, 18]
      ],
      thickness: 3.6,
      topLight: '#5C6F87',
      topDark: '#3A485C',
      edgeColor: '#263142',
      rimHighlightIndices: [8, 0, 1, 2, 3],
      striations: [
        [-38, -14, 34, -22],
        [-40, 4, 38, -4],
        [-34, 20, 36, 12]
      ],
      outlineW: 2.4
    });

    // Layer 1: Mid-lower offset flaky slate shelf
    this._drawSlatePlate(ctx, {
      pts: [
        [-35, -8], [-24, -27], [6, -31], [34, -18],
        [36, 8], [14, 24], [-18, 22], [-34, 8]
      ],
      thickness: 3.0,
      topLight: '#6E839C',
      topDark: '#47586E',
      edgeColor: '#2D3A4D',
      rimHighlightIndices: [7, 0, 1, 2, 3],
      striations: [
        [-28, -12, 26, -18],
        [-30, 4, 30, -2],
        [-22, 16, 22, 10]
      ],
      outlineW: 2.1
    });

    // Layer 2: Upper-left stepped slate plate
    this._drawSlatePlate(ctx, {
      pts: [
        [-26, -10], [-14, -23], [14, -22], [24, -4],
        [10, 13], [-16, 12], [-26, 2]
      ],
      thickness: 2.5,
      topLight: '#8299B4',
      topDark: '#586B84',
      edgeColor: '#37465C',
      rimHighlightIndices: [6, 0, 1, 2],
      striations: [
        [-20, -10, 16, -14],
        [-22, 2, 18, -3]
      ],
      outlineW: 1.9
    });

    // Layer 3: Small chipped crown flake perched near top-center
    this._drawSlatePlate(ctx, {
      pts: [
        [-12, -12], [6, -15], [14, -4], [2, 5], [-13, 1]
      ],
      thickness: 2.0,
      topLight: '#99B0C9',
      topDark: '#6C819B',
      edgeColor: '#42536A',
      rimHighlightIndices: [4, 0, 1, 2],
      striations: [
        [-9, -6, 10, -8]
      ],
      outlineW: 1.65
    });

    // Tiny loose chipped slate flake resting beside lower-right edge
    const chip = [[28, 24], [38, 21], [41, 29], [31, 32]];
    this._traceSharpPoly(ctx, chip, 1.4);
    ctx.fillStyle = '#6C819B';
    ctx.fill();
    ctx.strokeStyle = '#1E142B';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    ctx.restore();
  }
}

export default Slateflagstonerock;
