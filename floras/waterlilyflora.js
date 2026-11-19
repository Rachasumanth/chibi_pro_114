// Blooming Water Lily — 2D Top-Down Expressive Chibi Flora Module
// Standalone ES Module (HTML5 Canvas 2D API only)

const INK = '#1E142B';
const TAU = Math.PI * 2;

export class Waterlilyflora {
  static metadata = {
    name: 'Blooming Water Lily',
    category: 'flora',
    baseLength: 105,
    baseWidth: 105,
  };

  constructor(x = 0, y = 0, scale = 1) {
    this.x = x;
    this.y = y;
    this.scale = scale;
    this.angle = 0;
    this.time = 0;
    this._state = 'idle';

    // Glossy chibi water droplets resting on the emerald pad
    this._droplets = [
      { x: -24, y: -15, r: 4.2, phase: 0.4 },
      { x: -16, y: -25, r: 2.4, phase: 1.8 },
      { x: -22, y: 18, r: 3.6, phase: 3.1 },
      { x: 14, y: 26, r: 3.0, phase: 4.5 },
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

  _tracePadPath(ctx, r, notchAngle, notchHalf) {
    const startA = notchAngle + notchHalf;
    const endA = notchAngle + TAU - notchHalf;
    const steps = 48;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      const a = startA + u * (endA - startA);
      // Gentle organic waviness along the floating pad edge
      const wave = 1 + 0.022 * Math.sin(a * 7 + 0.4) + 0.012 * Math.cos(a * 11);
      const px = Math.cos(a) * r * wave;
      const py = Math.sin(a) * r * wave;
      ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  _drawLotusPetal(ctx, angle, length, width, cInner, cMid, cOuter, outlineW) {
    ctx.save();
    ctx.rotate(angle);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(
      length * 0.28, -width * 0.62,
      length * 0.76, -width * 0.46,
      length, 0
    );
    ctx.bezierCurveTo(
      length * 0.76, width * 0.46,
      length * 0.28, width * 0.62,
      0, 0
    );
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, 0, length, 0);
    grad.addColorStop(0, cInner);
    grad.addColorStop(0.55, cMid);
    grad.addColorStop(1, cOuter);
    ctx.fillStyle = grad;
    ctx.fill();

    // Subtle delicate petal mid-vein & side shimmer
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.42)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(length * 0.14, 0);
    ctx.lineTo(length * 0.82, 0);
    ctx.stroke();

    // Bold chibi outline
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(
      length * 0.28, -width * 0.62,
      length * 0.76, -width * 0.46,
      length, 0
    );
    ctx.bezierCurveTo(
      length * 0.76, width * 0.46,
      length * 0.28, width * 0.62,
      0, 0
    );
    ctx.closePath();
    ctx.strokeStyle = INK;
    ctx.lineWidth = outlineW;
    ctx.lineJoin = 'round';
    ctx.stroke();

    ctx.restore();
  }

  draw(ctx) {
    const t = this.time;
    const bobX = Math.sin(t * 1.15) * 1.4;
    const bobY = Math.cos(t * 0.95) * 1.2;
    const padRot = Math.sin(t * 0.85) * 0.045;
    const bloomBreath = 1 + Math.sin(t * 2.1) * 0.042;
    const padR = 45;
    const notchAngle = 0.58;
    const notchHalf = 0.26;

    ctx.save();
    ctx.translate(this.x + bobX, this.y + bobY);
    ctx.rotate(this.angle + padRot);
    ctx.scale(this.scale, this.scale);

    // 1. Gently expanding water ripple rings
    for (let i = 0; i < 2; i++) {
      const phase = ((t * 0.32 + i * 0.5) % 1);
      const rr = padR + 2 + phase * 9;
      const alpha = (1 - phase) * 0.28;
      ctx.strokeStyle = `rgba(210, 248, 255, ${alpha.toFixed(3)})`;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(0, 0, rr, 0, TAU);
      ctx.stroke();
    }

    // 2. Soft water-surface drop shadow under the pad
    ctx.save();
    ctx.translate(2.8, 4.2);
    this._tracePadPath(ctx, padR + 1, notchAngle, notchHalf);
    ctx.fillStyle = 'rgba(14, 24, 34, 0.36)';
    ctx.fill();
    ctx.restore();

    // 3. Emerald-green notched floating lily pad
    ctx.save();
    this._tracePadPath(ctx, padR, notchAngle, notchHalf);

    const padGrad = ctx.createRadialGradient(-10, -12, 4, 0, 0, padR * 1.05);
    padGrad.addColorStop(0, '#96E865');
    padGrad.addColorStop(0.42, '#41B853');
    padGrad.addColorStop(0.84, '#1F8348');
    padGrad.addColorStop(1, '#1A5E3B');
    ctx.fillStyle = padGrad;
    ctx.fill();

    // Subtle warm bronze-emerald outer rim inner glow
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = 'rgba(202, 255, 148, 0.35)';
    ctx.lineWidth = 3.2;
    this._tracePadPath(ctx, padR - 1.5, notchAngle, notchHalf);
    ctx.stroke();

    // Radial branching dichotomous veins
    const veinCount = 13;
    const startA = notchAngle + notchHalf + 0.16;
    const spanA = TAU - notchHalf * 2 - 0.32;
    for (let i = 0; i < veinCount; i++) {
      const va = startA + (i / (veinCount - 1)) * spanA;
      const vx = Math.cos(va) * (padR * 0.88);
      const vy = Math.sin(va) * (padR * 0.88);
      const midX = Math.cos(va) * (padR * 0.56);
      const midY = Math.sin(va) * (padR * 0.56);

      ctx.strokeStyle = 'rgba(186, 252, 138, 0.48)';
      ctx.lineWidth = 1.35;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(vx, vy);
      ctx.stroke();

      // Secondary fork branches
      ctx.strokeStyle = 'rgba(186, 252, 138, 0.30)';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(midX, midY);
      ctx.lineTo(Math.cos(va + 0.16) * (padR * 0.84), Math.sin(va + 0.16) * (padR * 0.84));
      ctx.moveTo(midX, midY);
      ctx.lineTo(Math.cos(va - 0.16) * (padR * 0.84), Math.sin(va - 0.16) * (padR * 0.84));
      ctx.stroke();
    }

    // Soft glossy pad sunlight sheen
    ctx.fillStyle = 'rgba(235, 255, 200, 0.16)';
    ctx.beginPath();
    ctx.ellipse(-15, -16, 20, 11, -0.65, 0, TAU);
    ctx.fill();

    ctx.restore(); // end pad clip

    // Bold dark-plum ink outline around pad
    this._tracePadPath(ctx, padR, notchAngle, notchHalf);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();

    // 4. Glistening chibi water droplets
    for (let i = 0; i < this._droplets.length; i++) {
      const d = this._droplets[i];
      const wobble = 1 + Math.sin(t * 2.6 + d.phase) * 0.06;
      const rx = d.r * wobble;
      const ry = d.r / wobble;

      // Droplet shadow
      ctx.fillStyle = 'rgba(16, 48, 32, 0.38)';
      ctx.beginPath();
      ctx.ellipse(d.x + 1.1, d.y + 1.5, rx, ry, 0.2, 0, TAU);
      ctx.fill();

      // Translucent droplet body
      const dGrad = ctx.createRadialGradient(d.x - rx * 0.3, d.y - ry * 0.3, 0.4, d.x, d.y, rx * 1.1);
      dGrad.addColorStop(0, 'rgba(255, 255, 255, 0.92)');
      dGrad.addColorStop(0.45, 'rgba(184, 245, 255, 0.72)');
      dGrad.addColorStop(1, 'rgba(72, 188, 174, 0.58)');
      ctx.fillStyle = dGrad;
      ctx.beginPath();
      ctx.ellipse(d.x, d.y, rx, ry, 0.2, 0, TAU);
      ctx.fill();

      ctx.strokeStyle = 'rgba(30, 20, 43, 0.65)';
      ctx.lineWidth = 1.0;
      ctx.stroke();

      // Crisp specular glint
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(d.x - rx * 0.32, d.y - ry * 0.32, Math.max(0.9, d.r * 0.28), 0, TAU);
      ctx.fill();
    }

    // 5. Lush multi-layered pastel-pink & cream lotus flower
    ctx.save();
    ctx.translate(4, -3);
    ctx.scale(bloomBreath, bloomBreath);

    // Flower cast shadow on pad
    const flowerShadow = ctx.createRadialGradient(2.5, 3.5, 4, 2.5, 3.5, 28);
    flowerShadow.addColorStop(0, 'rgba(18, 34, 26, 0.44)');
    flowerShadow.addColorStop(1, 'rgba(18, 34, 26, 0)');
    ctx.fillStyle = flowerShadow;
    ctx.beginPath();
    ctx.arc(2.5, 3.5, 28, 0, TAU);
    ctx.fill();

    // Tier 1: Outer rose-pink cupped petals (8 petals)
    for (let i = 0; i < 8; i++) {
      const pa = (i / 8) * TAU + Math.sin(t * 1.7 + i * 0.8) * 0.03;
      this._drawLotusPetal(ctx, pa, 24.5, 13.5, '#D44D86', '#F88BB8', '#FFD2E6', 1.9);
    }

    // Tier 2: Middle pastel-blush petals (8 petals, staggered)
    for (let i = 0; i < 8; i++) {
      const pa = (i / 8) * TAU + Math.PI / 8 + Math.sin(t * 1.9 + i * 0.9 + 0.5) * 0.035;
      this._drawLotusPetal(ctx, pa, 19.5, 11.4, '#E76DA2', '#FFAAD0', '#FFF0F7', 1.75);
    }

    // Tier 3: Inner cream & soft-pink cupped crown (6 petals)
    for (let i = 0; i < 6; i++) {
      const pa = (i / 6) * TAU + 0.25 + Math.sin(t * 2.2 + i) * 0.04;
      this._drawLotusPetal(ctx, pa, 13.5, 8.8, '#FFBE86', '#FFE5C8', '#FFFDF5', 1.6);
    }

    // Golden-amber flower heart & swaying stamens
    const coreGrad = ctx.createRadialGradient(-1.5, -1.5, 1, 0, 0, 7.6);
    coreGrad.addColorStop(0, '#FFF8B0');
    coreGrad.addColorStop(0.55, '#FFCA3A');
    coreGrad.addColorStop(1, '#D97B18');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 6.8, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Radiating golden stamens with glowing pollen anthers
    for (let i = 0; i < 12; i++) {
      const sa = (i / 12) * TAU + Math.sin(t * 2.6 + i * 0.7) * 0.08;
      const sLen = 8.4 + (i % 2) * 1.8;
      const sx = Math.cos(sa) * sLen;
      const sy = Math.sin(sa) * sLen;

      ctx.strokeStyle = '#E69A1C';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(Math.cos(sa) * 3.5, Math.sin(sa) * 3.5);
      ctx.lineTo(sx, sy);
      ctx.stroke();

      ctx.fillStyle = '#FFF176';
      ctx.beginPath();
      ctx.arc(sx, sy, 1.75, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 0.75;
      ctx.stroke();
    }

    // Glossy center highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.arc(-2.0, -2.0, 2.0, 0, TAU);
    ctx.fill();

    ctx.restore();
    ctx.restore();
  }
}

export default Waterlilyflora;
