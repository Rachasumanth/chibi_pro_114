/**
 * Veined White Marble Rock — Standalone 2D Top-Down Expressive Chibi Game Asset ES Module
 * Category: pebble_rock | Base Size: 108x90px
 * Zero external dependencies — native HTML5 Canvas 2D API only.
 */

export class Marbleboulder {
  static metadata = {
    name: 'Veined White Marble Rock',
    category: 'pebble_rock',
    baseLength: 108,
    baseWidth: 90
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

  _traceRoundedPoly(ctx, pts, radius = 9) {
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

  _drawSparkle(ctx, x, y, r) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.quadraticCurveTo(r * 0.14, -r * 0.14, r, 0);
    ctx.quadraticCurveTo(r * 0.14, r * 0.14, 0, r);
    ctx.quadraticCurveTo(-r * 0.14, r * 0.14, -r, 0);
    ctx.quadraticCurveTo(-r * 0.14, -r * 0.14, 0, -r);
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

    // Smooth fractured alabaster-white marble boulder silhouette (fits within 108x90)
    const outerMarble = [
      [-48, -6], [-38, -32], [-10, -41], [24, -36],
      [48, -16], [50, 12], [32, 36], [-2, 41], [-34, 32], [-48, 14]
    ];

    // Layered ground shadow
    ctx.save();
    ctx.translate(4, 5.5);
    this._traceRoundedPoly(ctx, outerMarble, 10);
    ctx.fillStyle = 'rgba(22, 18, 38, 0.20)';
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(1.8, 2.6);
    this._traceRoundedPoly(ctx, outerMarble, 9);
    ctx.fillStyle = 'rgba(18, 14, 34, 0.28)';
    ctx.fill();
    ctx.restore();

    // Base alabaster-white marble fill
    this._traceRoundedPoly(ctx, outerMarble, 9);
    const bodyGrad = ctx.createRadialGradient(-18, -18, 6, 6, 8, 60);
    bodyGrad.addColorStop(0, '#FFFFFF');
    bodyGrad.addColorStop(0.55, '#F3F4F8');
    bodyGrad.addColorStop(1, '#CFD4E0');
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    // Clipped marble facets, smoky grey-charcoal & gold branching mineral veins, and polished highlights
    ctx.save();
    this._traceRoundedPoly(ctx, outerMarble, 9);
    ctx.clip();

    // Smooth sculpted marble planes (subtle warm/cool cel facets)
    // Lower-right cool shaded marble plane
    ctx.fillStyle = 'rgba(156, 166, 188, 0.36)';
    ctx.beginPath();
    ctx.moveTo(4, 16); ctx.lineTo(48, -14); ctx.lineTo(54, 16);
    ctx.lineTo(32, 42); ctx.lineTo(-4, 44); ctx.lineTo(-14, 24);
    ctx.closePath();
    ctx.fill();

    // Soft smoky grey marble clouds (mineral diffusion behind sharp veins)
    const cloud1 = ctx.createRadialGradient(-14, 4, 2, -14, 4, 26);
    cloud1.addColorStop(0, 'rgba(120, 128, 148, 0.22)');
    cloud1.addColorStop(1, 'rgba(120, 128, 148, 0)');
    ctx.fillStyle = cloud1;
    ctx.beginPath();
    ctx.ellipse(-12, 4, 26, 14, -0.45, 0, Math.PI * 2);
    ctx.fill();

    const cloud2 = ctx.createRadialGradient(16, -8, 2, 16, -8, 24);
    cloud2.addColorStop(0, 'rgba(217, 167, 74, 0.16)');
    cloud2.addColorStop(1, 'rgba(217, 167, 74, 0)');
    ctx.fillStyle = cloud2;
    ctx.beginPath();
    ctx.ellipse(16, -8, 24, 12, 0.5, 0, Math.PI * 2);
    ctx.fill();

    // --- DRAMATIC BRANCHING CHARCOAL-GREY MINERAL VEINS ---
    ctx.strokeStyle = 'rgba(71, 80, 98, 0.72)';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(-46, 14);
    ctx.bezierCurveTo(-28, 8, -18, -8, -4, -10);
    ctx.bezierCurveTo(10, -12, 22, -24, 34, -36);
    ctx.stroke();

    // Charcoal secondary tributary veins
    ctx.strokeStyle = 'rgba(84, 94, 114, 0.56)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-22, 2);
    ctx.bezierCurveTo(-12, 14, 4, 20, 18, 36);
    ctx.moveTo(-4, -10);
    ctx.bezierCurveTo(6, -2, 22, 4, 48, 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(100, 110, 130, 0.42)';
    ctx.lineWidth = 1.05;
    ctx.beginPath();
    ctx.moveTo(-36, -24);
    ctx.quadraticCurveTo(-20, -20, -12, -10);
    ctx.moveTo(12, 14);
    ctx.quadraticCurveTo(26, 16, 40, 22);
    ctx.stroke();

    // --- LUXURIOUS BRANCHING GOLD MINERAL VEINS (Calacatta Gold style) ---
    ctx.strokeStyle = 'rgba(217, 155, 42, 0.82)';
    ctx.lineWidth = 1.75;
    ctx.beginPath();
    ctx.moveTo(-44, 16);
    ctx.bezierCurveTo(-26, 10, -16, -6, -2, -8);
    ctx.bezierCurveTo(12, -10, 24, -22, 36, -34);
    ctx.stroke();

    ctx.strokeStyle = '#F5C451';
    ctx.lineWidth = 1.05;
    ctx.beginPath();
    ctx.moveTo(-18, 4);
    ctx.bezierCurveTo(-8, 14, 6, 18, 22, 34);
    ctx.moveTo(4, -8);
    ctx.bezierCurveTo(14, -2, 28, -4, 46, -12);
    ctx.stroke();

    // Crisp hairline gold glint along primary vein
    ctx.strokeStyle = 'rgba(255, 244, 198, 0.85)';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(-16, -4);
    ctx.quadraticCurveTo(-2, -9, 14, -17);
    ctx.stroke();

    // Sculpted top plateau bevel ridge
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-36, -12);
    ctx.lineTo(-26, -26);
    ctx.lineTo(4, -31);
    ctx.lineTo(28, -22);
    ctx.stroke();

    // Polished glossy alabaster-marble specular sheen bands
    ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.beginPath();
    ctx.ellipse(-18, -19, 15, 7.2, -0.34, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.ellipse(18, -14, 9, 4.2, 0.25, 0, Math.PI * 2);
    ctx.fill();

    // Crisp subtle marble fracture notch along bottom-left
    ctx.strokeStyle = '#4B5568';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-32, 30);
    ctx.lineTo(-22, 18);
    ctx.lineTo(-10, 22);
    ctx.stroke();

    ctx.restore(); // end clip

    // Bold expressive chibi outline (#1E142B)
    this._traceRoundedPoly(ctx, outerMarble, 9);
    ctx.strokeStyle = '#1E142B';
    ctx.lineWidth = 2.7;
    ctx.stroke();

    // Polished marble glints
    this._drawSparkle(ctx, -20, -21, 3.6);
    this._drawSparkle(ctx, 18, -16, 2.4);

    ctx.restore();
  }
}

export default Marbleboulder;
