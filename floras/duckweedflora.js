// Floating Duckweed & Moss Cluster — 2D Top-Down Expressive Chibi Flora Module
// Standalone ES Module (HTML5 Canvas 2D API only)

const INK = '#1E142B';
const TAU = Math.PI * 2;

export class Duckweedflora {
  static metadata = {
    name: 'Floating Duckweed & Moss Cluster',
    category: 'flora',
    baseLength: 65,
    baseWidth: 65,
  };

  constructor(x = 0, y = 0, scale = 1) {
    this.x = x;
    this.y = y;
    this.scale = scale;
    this.angle = 0;
    this.time = 0;
    this._state = 'idle';

    // Tiny submerged feathery moss tufts peeking out beneath the floating leaves
    this._mossTufts = [
      { x: -16, y: 12, angle: 2.3, len: 12, phase: 0.3 },
      { x: 15, y: -11, angle: -0.7, len: 11, phase: 1.5 },
      { x: -12, y: -15, angle: -2.2, len: 10, phase: 2.7 },
      { x: 16, y: 14, angle: 0.8, len: 11.5, phase: 3.9 },
    ];

    // Organic cluster of cute lime-green heart-shaped floating duckweed leaves
    this._leaves = [
      // Lower outer cluster
      { x: -17, y: -7, size: 9.2, rot: -0.6, phase: 0.2, hue: 0 },
      { x: -7, y: -17, size: 8.6, rot: 0.3, phase: 1.1, hue: 1 },
      { x: 12, y: -14, size: 9.4, rot: 0.9, phase: 2.0, hue: 0 },
      { x: 19, y: 1, size: 8.8, rot: 1.7, phase: 2.9, hue: 1 },
      { x: 11, y: 16, size: 9.6, rot: 2.4, phase: 3.8, hue: 0 },
      { x: -9, y: 17, size: 8.4, rot: -2.3, phase: 4.7, hue: 1 },
      { x: -19, y: 7, size: 8.0, rot: -1.4, phase: 5.5, hue: 0 },
      // Upper hero floating hearts
      { x: -6, y: -4, size: 11.2, rot: -0.25, phase: 0.8, hue: 2 },
      { x: 7, y: -3, size: 10.6, rot: 0.75, phase: 1.9, hue: 2 },
      { x: 1, y: 8, size: 10.2, rot: 2.8, phase: 3.2, hue: 1 },
      { x: 1, y: -10, size: 7.4, rot: -0.9, phase: 4.4, hue: 2 },
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

  _drawMossTuft(ctx, tuft, t) {
    const sway = Math.sin(t * 1.8 + tuft.phase) * 0.18;
    const a = tuft.angle + sway;
    const cosA = Math.cos(a);
    const sinA = Math.sin(a);
    const perpX = -sinA;
    const perpY = cosA;

    const ex = tuft.x + cosA * tuft.len;
    const ey = tuft.y + sinA * tuft.len;

    ctx.save();
    ctx.lineCap = 'round';
    // Main moss stem
    ctx.beginPath();
    ctx.moveTo(tuft.x, tuft.y);
    ctx.lineTo(ex, ey);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3.0;
    ctx.stroke();
    ctx.strokeStyle = '#3B8A42';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Feathery mini-frondlets along the moss tuft
    for (let i = 1; i <= 4; i++) {
      const u = i / 4.5;
      const px = tuft.x + cosA * (tuft.len * u);
      const py = tuft.y + sinA * (tuft.len * u);
      const flen = 3.8 * (1 - u * 0.35);
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + (perpX * side * 0.8 + cosA * 0.5) * flen, py + (perpY * side * 0.8 + sinA * 0.5) * flen);
        ctx.strokeStyle = '#62B848';
        ctx.lineWidth = 1.3;
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  _drawHeartLeaf(ctx, leaf, t) {
    const bobX = Math.sin(t * 1.6 + leaf.phase) * 1.1;
    const bobY = Math.cos(t * 1.35 + leaf.phase) * 0.9;
    const tilt = Math.sin(t * 1.5 + leaf.phase) * 0.08;
    const breath = 1 + Math.sin(t * 2.2 + leaf.phase) * 0.035;
    const s = leaf.size * breath;

    ctx.save();
    ctx.translate(leaf.x + bobX, leaf.y + bobY);
    ctx.rotate(leaf.rot + tilt);

    // Subtle water-surface drop shadow
    ctx.save();
    ctx.translate(1.2, 2.0);
    this._traceChibiHeart(ctx, s);
    ctx.fillStyle = 'rgba(14, 34, 28, 0.30)';
    ctx.fill();
    ctx.restore();

    // Plump lime-green heart-shaped floating leaf
    this._traceChibiHeart(ctx, s);
    const grad = ctx.createRadialGradient(-s * 0.22, -s * 0.22, s * 0.1, 0, 0, s * 1.1);
    if (leaf.hue === 2) {
      grad.addColorStop(0, '#EAFF8A');
      grad.addColorStop(0.5, '#8CE848');
      grad.addColorStop(1, '#3CA63E');
    } else if (leaf.hue === 1) {
      grad.addColorStop(0, '#D4FF78');
      grad.addColorStop(0.52, '#6CD642');
      grad.addColorStop(1, '#2D8C3C');
    } else {
      grad.addColorStop(0, '#B8F268');
      grad.addColorStop(0.55, '#52BE40');
      grad.addColorStop(1, '#237538');
    }
    ctx.fillStyle = grad;
    ctx.fill();

    // Bold dark-plum chibi ink outline
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.75;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Delicate central leaf vein crease
    ctx.strokeStyle = 'rgba(232, 255, 168, 0.55)';
    ctx.lineWidth = 0.95;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.35);
    ctx.lineTo(0, s * 0.55);
    ctx.stroke();

    // Candy-gloss water-surface highlight
    ctx.fillStyle = 'rgba(255, 255, 240, 0.82)';
    ctx.beginPath();
    ctx.ellipse(-s * 0.30, -s * 0.22, s * 0.24, s * 0.13, -0.5, 0, TAU);
    ctx.fill();

    ctx.restore();
  }

  _traceChibiHeart(ctx, s) {
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.42);
    ctx.bezierCurveTo(s * 0.55, -s * 0.95, s * 1.18, -s * 0.12, 0, s * 0.88);
    ctx.bezierCurveTo(-s * 1.18, -s * 0.12, -s * 0.55, -s * 0.95, 0, -s * 0.42);
    ctx.closePath();
  }

  draw(ctx) {
    const t = this.time;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Subtle expanding surface water ripple
    const rippleP = (t * 0.36) % 1;
    const rippleR = 23 + rippleP * 9;
    ctx.strokeStyle = `rgba(218, 252, 255, ${((1 - rippleP) * 0.26).toFixed(3)})`;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(0, 0, rippleR, 0, TAU);
    ctx.stroke();

    // 2. Soft pooled water-surface shadow
    const aoGrad = ctx.createRadialGradient(1.5, 3, 6, 1.5, 3, 31);
    aoGrad.addColorStop(0, 'rgba(14, 30, 26, 0.36)');
    aoGrad.addColorStop(0.68, 'rgba(14, 30, 26, 0.14)');
    aoGrad.addColorStop(1, 'rgba(14, 30, 26, 0)');
    ctx.fillStyle = aoGrad;
    ctx.beginPath();
    ctx.arc(1.5, 3, 31, 0, TAU);
    ctx.fill();

    // 3. Tiny feathery moss tufts peeking from underneath
    for (let i = 0; i < this._mossTufts.length; i++) {
      this._drawMossTuft(ctx, this._mossTufts[i], t);
    }

    // 4. Organic cluster of cute lime-green heart-shaped floating leaves
    for (let i = 0; i < this._leaves.length; i++) {
      this._drawHeartLeaf(ctx, this._leaves[i], t);
    }

    ctx.restore();
  }
}

export default Duckweedflora;
