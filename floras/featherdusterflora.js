// Feather Duster Tube Crown — 2D Top-Down Expressive Chibi Flora Module
// Standalone ES Module (HTML5 Canvas 2D API only)

const INK = '#1E142B';
const TAU = Math.PI * 2;

export class Featherdusterflora {
  static metadata = {
    name: 'Feather Duster Tube Crown',
    category: 'flora',
    baseLength: 78,
    baseWidth: 78,
  };

  constructor(x = 0, y = 0, scale = 1) {
    this.x = x;
    this.y = y;
    this.scale = scale;
    this.angle = 0;
    this.time = 0;
    this._state = 'idle';

    // Double-spiral radiolar crown: outer sweeping whorl + inner spiral whorl
    this._outerRadioles = [];
    const outerCount = 16;
    for (let i = 0; i < outerCount; i++) {
      const a = (i / outerCount) * TAU;
      this._outerRadioles.push({
        angle: a,
        length: 28.5 + (i % 2) * 2.4,
        spiralCurve: 0.34,
        phase: i * 0.42,
      });
    }

    this._innerRadioles = [];
    const innerCount = 10;
    for (let i = 0; i < innerCount; i++) {
      const a = (i / innerCount) * TAU + 0.18;
      this._innerRadioles.push({
        angle: a,
        length: 19.5 + (i % 2) * 1.8,
        spiralCurve: -0.32,
        phase: i * 0.62 + 1.2,
      });
    }
  }

  play(_name) {
    this._state = 'idle';
  }

  update(dt) {
    const step = Number.isFinite(dt) ? Math.min(Math.max(dt, 0), 0.1) : 0;
    this.time += step;
  }

  setAngle(radians) {
    if (Number.isFinite(radians)) {
      this.angle = radians;
    }
  }

  setDirection(dx, dy) {
    if (Number.isFinite(dx) && Number.isFinite(dy) && (dx !== 0 || dy !== 0)) {
      this.angle = Math.atan2(dy, dx);
    }
  }

  getState() {
    return 'idle';
  }

  onFinished(_name, _callback) {
    // Safe no-op
  }

  _drawRadiole(ctx, rad, t, expand, isInner) {
    const sway = Math.sin(t * 2.0 + rad.phase) * 0.10;
    const baseA = rad.angle + sway;
    const len = rad.length * expand;
    const baseR = isInner ? 4.5 : 7.5;

    const segs = 7;
    const pts = [];
    for (let i = 0; i <= segs; i++) {
      const u = i / segs;
      // Graceful spiral curl characteristic of Sabellidae feather dusters
      const curl = rad.spiralCurve * u * u + Math.sin(u * 2.8 - t * 2.2 + rad.phase) * 0.08 * u;
      const a = baseA + curl;
      const r = baseR + u * len;
      pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, u, a });
    }

    // 1. Soft striped feathery barbules (pinnules) fanning symmetrically along both sides
    ctx.lineCap = 'round';
    for (let i = 1; i < segs; i++) {
      const p = pts[i];
      const next = pts[i + 1];
      const tx = next.x - p.x;
      const ty = next.y - p.y;
      const tLen = Math.hypot(tx, ty) || 1;
      const nx = -ty / tLen;
      const ny = tx / tLen;

      // Striped cream-and-burgundy banding
      const isBurgundy = i % 2 === 1;
      const barbLen = (isInner ? 4.2 : 5.4) * Math.sin(p.u * Math.PI * 0.92 + 0.15);

      ctx.strokeStyle = isBurgundy
        ? (isInner ? '#B82A52' : '#8E1A3D')
        : (isInner ? '#FFF7E6' : '#F8E3BE');
      ctx.lineWidth = isInner ? 1.55 : 1.8;

      // Left barbule swept slightly forward
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + nx * barbLen + (tx / tLen) * 1.9, p.y + ny * barbLen + (ty / tLen) * 1.9);
      // Right barbule swept slightly forward
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - nx * barbLen + (tx / tLen) * 1.9, p.y - ny * barbLen + (ty / tLen) * 1.9);
      ctx.stroke();
    }

    // 2. Central striped rachis outline + cream-and-burgundy segments
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i <= segs; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.strokeStyle = INK;
    ctx.lineWidth = isInner ? 2.6 : 3.0;
    ctx.lineJoin = 'round';
    ctx.stroke();

    for (let i = 0; i < segs; i++) {
      ctx.beginPath();
      ctx.moveTo(pts[i].x, pts[i].y);
      ctx.lineTo(pts[i + 1].x, pts[i + 1].y);
      ctx.strokeStyle = i % 2 === 0 ? '#FFF2D6' : '#A92249';
      ctx.lineWidth = isInner ? 1.4 : 1.7;
      ctx.stroke();
    }

    // 3. Soft glowing cream-gold feather tip dot
    const tip = pts[segs];
    ctx.fillStyle = '#FFF9E8';
    ctx.beginPath();
    ctx.arc(tip.x, tip.y, isInner ? 1.3 : 1.6, 0, TAU);
    ctx.fill();
  }

  draw(ctx) {
    const t = this.time;
    // Soft expansion and contraction of the radiolar crown
    const expand = 0.94 + 0.085 * Math.sin(t * 1.65);

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Ambient occlusion seabed shadow
    const aoGrad = ctx.createRadialGradient(2, 3.5, 6, 2, 3.5, 38);
    aoGrad.addColorStop(0, 'rgba(20, 12, 26, 0.48)');
    aoGrad.addColorStop(0.65, 'rgba(24, 14, 30, 0.22)');
    aoGrad.addColorStop(1, 'rgba(24, 14, 30, 0)');
    ctx.fillStyle = aoGrad;
    ctx.beginPath();
    ctx.arc(2, 3.5, 38, 0, TAU);
    ctx.fill();

    // 2. Subtle warm cream-rose subsurface aura
    const auraGrad = ctx.createRadialGradient(0, 0, 8, 0, 0, 36);
    auraGrad.addColorStop(0, 'rgba(255, 224, 188, 0.24)');
    auraGrad.addColorStop(0.65, 'rgba(186, 54, 96, 0.10)');
    auraGrad.addColorStop(1, 'rgba(186, 54, 96, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, TAU);
    ctx.fill();

    // 3. Parchment-like encrusted worm tube collar beneath the crown
    const tubeGrad = ctx.createRadialGradient(-2, -2, 2, 0, 0, 13.5);
    tubeGrad.addColorStop(0, '#9E7F65');
    tubeGrad.addColorStop(0.65, '#684C3D');
    tubeGrad.addColorStop(1, '#3B2823');
    ctx.fillStyle = tubeGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // 4. Outer sweeping spiral whorl of striped radioles
    for (let i = 0; i < this._outerRadioles.length; i++) {
      this._drawRadiole(ctx, this._outerRadioles[i], t, expand, false);
    }

    // 5. Shaded ring between outer & inner whorls for depth
    const midShadow = ctx.createRadialGradient(0, 0, 3, 0, 0, 14);
    midShadow.addColorStop(0, 'rgba(34, 10, 24, 0.65)');
    midShadow.addColorStop(1, 'rgba(34, 10, 24, 0)');
    ctx.fillStyle = midShadow;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, TAU);
    ctx.fill();

    // 6. Inner counter-spiraling radiolar whorl
    for (let i = 0; i < this._innerRadioles.length; i++) {
      this._drawRadiole(ctx, this._innerRadioles[i], t, expand * 0.98, true);
    }

    // 7. Central oral funnel & glossy burgundy-cream collar
    const funnelGrad = ctx.createRadialGradient(-1.5, -1.5, 1, 0, 0, 7.5);
    funnelGrad.addColorStop(0, '#2B0C1E');
    funnelGrad.addColorStop(0.58, '#7A1A38');
    funnelGrad.addColorStop(1, '#E6C49C');
    ctx.fillStyle = funnelGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 7.2, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Tiny glossy rim highlight on collar
    ctx.strokeStyle = 'rgba(255, 248, 228, 0.78)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, 5.4, -Math.PI * 0.85, -Math.PI * 0.25);
    ctx.stroke();

    ctx.restore();
  }
}

export default Featherdusterflora;
