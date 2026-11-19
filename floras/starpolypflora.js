// Green Star Polyp Mat — 2D Top-Down Expressive Chibi Flora Module
// Standalone ES Module (HTML5 Canvas 2D API only)

const INK = '#1E142B';
const TAU = Math.PI * 2;

export class Starpolypflora {
  static metadata = {
    name: 'Green Star Polyp Mat',
    category: 'flora',
    baseLength: 110,
    baseWidth: 110,
  };

  constructor(x = 0, y = 0, scale = 1) {
    this.x = x;
    this.y = y;
    this.scale = scale;
    this.angle = 0;
    this.time = 0;
    this._state = 'idle';

    // 25 vibrant neon-green eight-petaled star polyps arranged organically across the purple mat
    this._polyps = [
      // Outer ring (14 polyps)
      { x: -32, y: -14, r: 8.4, rot: 0.2 },
      { x: -21, y: -28, r: 8.8, rot: 0.7 },
      { x: -4, y: -34, r: 8.6, rot: 1.1 },
      { x: 14, y: -30, r: 8.2, rot: 0.4 },
      { x: 29, y: -19, r: 8.8, rot: 0.9 },
      { x: 35, y: -3, r: 8.4, rot: 1.4 },
      { x: 31, y: 14, r: 8.8, rot: 0.3 },
      { x: 19, y: 28, r: 8.5, rot: 0.8 },
      { x: 2, y: 33, r: 8.6, rot: 1.3 },
      { x: -16, y: 29, r: 8.4, rot: 0.5 },
      { x: -30, y: 18, r: 8.8, rot: 1.0 },
      { x: -35, y: 2, r: 8.2, rot: 0.1 },
      // Middle ring (8 polyps)
      { x: -17, y: -12, r: 9.2, rot: 0.6 },
      { x: -2, y: -18, r: 9.4, rot: 1.2 },
      { x: 15, y: -13, r: 9.0, rot: 0.3 },
      { x: 20, y: 3, r: 9.2, rot: 0.9 },
      { x: 13, y: 16, r: 9.0, rot: 1.5 },
      { x: -4, y: 19, r: 9.2, rot: 0.4 },
      { x: -19, y: 13, r: 9.0, rot: 1.1 },
      { x: -21, y: -1, r: 8.8, rot: 0.7 },
      // Central crown (5 hero polyps)
      { x: -6, y: -4, r: 9.6, rot: 0.2 },
      { x: 7, y: -4, r: 9.4, rot: 0.8 },
      { x: 6, y: 7, r: 9.6, rot: 1.4 },
      { x: -7, y: 6, r: 9.2, rot: 0.5 },
      { x: 0, y: 1, r: 10.0, rot: 1.0 },
    ];
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

  _traceMatPath(ctx, r) {
    const steps = 64;
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * TAU;
      const lobe =
        1 +
        0.075 * Math.sin(a * 5 + 0.4) +
        0.045 * Math.cos(a * 8 - 0.8) +
        0.025 * Math.sin(a * 13);
      const px = Math.cos(a) * r * lobe;
      const py = Math.sin(a) * r * lobe;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  _drawStarPolyp(ctx, p, t) {
    // Synchronized traveling ocean wave rippling across the entire colony
    const wavePhase = t * 2.4 - p.x * 0.055 - p.y * 0.04;
    const leanX = Math.sin(wavePhase) * 2.6;
    const leanY = Math.cos(wavePhase * 0.85) * 1.8;
    const pulse = 1 + Math.sin(wavePhase + 0.5) * 0.07;

    // 1. Tiny raised purple calyx cup on the encrusting mat
    ctx.fillStyle = '#4A1E68';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3.2, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(220, 168, 255, 0.35)';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    const cx = p.x + leanX;
    const cy = p.y + leanY;
    const r = p.r * pulse;

    // 2. Eight-petaled neon-green star polyp rosette
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(p.rot + Math.sin(wavePhase) * 0.14);

    // Subtle neon subsurface glow behind each star
    const pGlow = ctx.createRadialGradient(0, 0, 1, 0, 0, r * 1.15);
    pGlow.addColorStop(0, 'rgba(136, 255, 82, 0.40)');
    pGlow.addColorStop(1, 'rgba(136, 255, 82, 0)');
    ctx.fillStyle = pGlow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.15, 0, TAU);
    ctx.fill();

    // Draw all 8 slender star petals in one unified crisp path
    ctx.beginPath();
    const petals = 8;
    for (let i = 0; i < petals; i++) {
      const a = (i / petals) * TAU;
      const aL = a - 0.24;
      const aR = a + 0.24;
      const tipX = Math.cos(a) * r;
      const tipY = Math.sin(a) * r;
      const baseLX = Math.cos(aL) * (r * 0.26);
      const baseLY = Math.sin(aL) * (r * 0.26);
      const baseRX = Math.cos(aR) * (r * 0.26);
      const baseRY = Math.sin(aR) * (r * 0.26);
      const midLX = Math.cos(a - 0.14) * (r * 0.62);
      const midLY = Math.sin(a - 0.14) * (r * 0.62);
      const midRX = Math.cos(a + 0.14) * (r * 0.62);
      const midRY = Math.sin(a + 0.14) * (r * 0.62);

      if (i === 0) ctx.moveTo(baseLX, baseLY);
      else ctx.lineTo(baseLX, baseLY);
      ctx.quadraticCurveTo(midLX, midLY, tipX, tipY);
      ctx.quadraticCurveTo(midRX, midRY, baseRX, baseRY);
    }
    ctx.closePath();

    const starGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, r);
    starGrad.addColorStop(0, '#F6FF9E');
    starGrad.addColorStop(0.35, '#8EFF42');
    starGrad.addColorStop(0.82, '#2BD65E');
    starGrad.addColorStop(1, '#129A52');
    ctx.fillStyle = starGrad;
    ctx.fill();

    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.25;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Bright glowing yellow-white oral center dot
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(0, 0, 1.75, 0, TAU);
    ctx.fill();

    ctx.restore();
  }

  draw(ctx) {
    const t = this.time;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Ambient occlusion seabed shadow
    const aoGrad = ctx.createRadialGradient(2.5, 4.5, 14, 2.5, 4.5, 53);
    aoGrad.addColorStop(0, 'rgba(18, 10, 30, 0.50)');
    aoGrad.addColorStop(0.68, 'rgba(20, 12, 34, 0.22)');
    aoGrad.addColorStop(1, 'rgba(20, 12, 34, 0)');
    ctx.fillStyle = aoGrad;
    ctx.beginPath();
    ctx.arc(2.5, 4.5, 53, 0, TAU);
    ctx.fill();

    // 2. Soft neon-green & violet reef aura
    const auraGrad = ctx.createRadialGradient(0, 0, 14, 0, 0, 54);
    auraGrad.addColorStop(0, 'rgba(116, 255, 92, 0.24)');
    auraGrad.addColorStop(0.65, 'rgba(148, 82, 224, 0.14)');
    auraGrad.addColorStop(1, 'rgba(148, 82, 224, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 54, 0, TAU);
    ctx.fill();

    // 3. Velvety textured purple encrusting stolon mat
    ctx.save();
    this._traceMatPath(ctx, 43.5);

    const matGrad = ctx.createRadialGradient(-10, -12, 6, 0, 0, 48);
    matGrad.addColorStop(0, '#9B56CC');
    matGrad.addColorStop(0.5, '#6C2F9E');
    matGrad.addColorStop(0.85, '#4A1D72');
    matGrad.addColorStop(1, '#2E114A');
    ctx.fillStyle = matGrad;
    ctx.fill();

    // Subtle velvety stipple texture inside the mat
    ctx.clip();
    ctx.fillStyle = 'rgba(214, 158, 255, 0.18)';
    for (let i = 0; i < 18; i++) {
      const a = i * 2.39996; // golden angle distribution
      const d = Math.sqrt(i / 18) * 38;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * d, Math.sin(a) * d, 2.2, 0, TAU);
      ctx.fill();
    }
    ctx.restore();

    // Bold dark-plum ink outline around encrusting mat
    this._traceMatPath(ctx, 43.5);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.6;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // 4. Draw all 25 swaying neon-green eight-petaled star polyps
    for (let i = 0; i < this._polyps.length; i++) {
      this._drawStarPolyp(ctx, this._polyps[i], t);
    }

    ctx.restore();
  }
}

export default Starpolypflora;
