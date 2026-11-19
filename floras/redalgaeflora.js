// Crimson Dulse Bush — 2D Top-Down Expressive Chibi Flora Module
// Standalone ES Module (HTML5 Canvas 2D API only)

const INK = '#1E142B';
const TAU = Math.PI * 2;

export class Redalgaeflora {
  static metadata = {
    name: 'Crimson Dulse Bush',
    category: 'flora',
    baseLength: 92,
    baseWidth: 92,
  };

  constructor(x = 0, y = 0, scale = 1) {
    this.x = x;
    this.y = y;
    this.scale = scale;
    this.angle = 0;
    this.time = 0;
    this._state = 'idle';

    // Three tiers of ruffled lettuce-like crimson & magenta leafy folds
    this._leaves = [];
    this._addTier(7, 38, 23, 0, 0.0, 1.55); // Outer broad deep-ruby folds
    this._addTier(6, 29, 19, 1, 0.48, 1.85); // Middle vibrant crimson-magenta folds
    this._addTier(5, 19, 14, 2, 0.92, 2.15); // Inner bright coral-rose ruffled crown
  }

  _addTier(count, length, width, tier, offset, freq) {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * TAU + offset + Math.sin(i * 2.1 + tier) * 0.09;
      this._leaves.push({
        angle: a,
        length: length * (0.90 + 0.16 * Math.abs(Math.sin(i * 1.7 + tier))),
        width: width * (0.92 + 0.14 * Math.cos(i * 2.3)),
        tier,
        phase: i * 0.85 + tier * 1.4,
        freq,
        ruffles: 5 + (i % 2),
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

  _drawRuffledLeaf(ctx, leaf, t) {
    const sway = Math.sin(t * leaf.freq + leaf.phase) * 0.11;
    const stretch = 1 + Math.sin(t * (leaf.freq * 1.15) + leaf.phase + 0.6) * 0.05;
    const len = leaf.length * stretch;
    const wid = leaf.width;

    ctx.save();
    ctx.rotate(leaf.angle + sway);

    // Build ruffled lettuce-like fan frond path
    const pts = [];
    const steps = 24;
    for (let i = 0; i <= steps; i++) {
      const u = i / steps; // 0 -> 1 around fan perimeter
      const theta = -Math.PI * 0.52 + u * Math.PI * 1.04;
      const baseDist = Math.pow(Math.cos(theta * 0.85), 0.55) * len;
      const ruffle =
        1 +
        0.13 * Math.sin(u * leaf.ruffles * TAU + t * 2.2 + leaf.phase) +
        0.05 * Math.cos(u * (leaf.ruffles * 2) * Math.PI - t * 1.7);
      const px = Math.cos(theta) * baseDist * ruffle;
      const py = Math.sin(theta) * (wid * 0.72) * ruffle;
      pts.push({ x: px, y: py });
    }

    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let i = 0; i < pts.length; i++) {
      const curr = pts[i];
      if (i === 0) {
        ctx.lineTo(curr.x, curr.y);
      } else {
        const prev = pts[i - 1];
        ctx.quadraticCurveTo(prev.x, prev.y, (prev.x + curr.x) * 0.5, (prev.y + curr.y) * 0.5);
      }
    }
    const last = pts[pts.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.closePath();

    // Rich layered ruby-red & translucent magenta gradient
    const grad = ctx.createRadialGradient(len * 0.15, 0, 2, len * 0.35, 0, len * 0.95);
    if (leaf.tier === 0) {
      grad.addColorStop(0, '#5A0D2A');
      grad.addColorStop(0.55, '#A81848');
      grad.addColorStop(0.88, '#DF326B');
      grad.addColorStop(1, '#FF689B');
    } else if (leaf.tier === 1) {
      grad.addColorStop(0, '#781038');
      grad.addColorStop(0.5, '#CC215C');
      grad.addColorStop(0.86, '#F44B86');
      grad.addColorStop(1, '#FF8FB8');
    } else {
      grad.addColorStop(0, '#9E1A4A');
      grad.addColorStop(0.5, '#E83A7A');
      grad.addColorStop(0.86, '#FF76AA');
      grad.addColorStop(1, '#FFC4DC');
    }

    ctx.fillStyle = grad;
    ctx.fill();

    // Translucent bright backlit ruffle rim
    ctx.strokeStyle = leaf.tier === 2 ? 'rgba(255, 224, 238, 0.65)' : 'rgba(255, 168, 206, 0.45)';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Bold dark-plum chibi ink outline
    ctx.strokeStyle = INK;
    ctx.lineWidth = leaf.tier === 2 ? 1.75 : 2.0;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Delicate fan-like pale-rose veins radiating across the frond
    ctx.strokeStyle = 'rgba(255, 204, 226, 0.38)';
    ctx.lineWidth = 1.05;
    ctx.lineCap = 'round';
    for (let v = -1; v <= 1; v++) {
      const va = v * 0.34;
      ctx.beginPath();
      ctx.moveTo(3, 0);
      ctx.quadraticCurveTo(
        Math.cos(va) * len * 0.45,
        Math.sin(va) * wid * 0.32,
        Math.cos(va) * len * 0.78,
        Math.sin(va) * wid * 0.46
      );
      ctx.stroke();
    }

    ctx.restore();
  }

  draw(ctx) {
    const t = this.time;
    const breath = 1 + Math.sin(t * 2.0) * 0.028;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.scale(this.scale * breath, this.scale * breath);

    // 1. Ambient occlusion seabed shadow
    const aoGrad = ctx.createRadialGradient(2.5, 4, 10, 2.5, 4, 45);
    aoGrad.addColorStop(0, 'rgba(24, 8, 26, 0.48)');
    aoGrad.addColorStop(0.65, 'rgba(28, 10, 30, 0.22)');
    aoGrad.addColorStop(1, 'rgba(28, 10, 30, 0)');
    ctx.fillStyle = aoGrad;
    ctx.beginPath();
    ctx.arc(2.5, 4, 45, 0, TAU);
    ctx.fill();

    // 2. Warm crimson-magenta translucent subsurface glow
    const glowGrad = ctx.createRadialGradient(0, 0, 8, 0, 0, 44);
    glowGrad.addColorStop(0, 'rgba(255, 84, 146, 0.24)');
    glowGrad.addColorStop(0.68, 'rgba(208, 36, 98, 0.10)');
    glowGrad.addColorStop(1, 'rgba(208, 36, 98, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 44, 0, TAU);
    ctx.fill();

    // 3. Outer ruby-red leafy tier
    for (let i = 0; i < this._leaves.length; i++) {
      if (this._leaves[i].tier === 0) {
        this._drawRuffledLeaf(ctx, this._leaves[i], t);
      }
    }

    // 4. Middle shaded bowl depth + crimson-magenta tier
    const midShadow = ctx.createRadialGradient(0, 0, 3, 0, 0, 22);
    midShadow.addColorStop(0, 'rgba(42, 6, 24, 0.52)');
    midShadow.addColorStop(1, 'rgba(42, 6, 24, 0)');
    ctx.fillStyle = midShadow;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, TAU);
    ctx.fill();

    for (let i = 0; i < this._leaves.length; i++) {
      if (this._leaves[i].tier === 1) {
        this._drawRuffledLeaf(ctx, this._leaves[i], t);
      }
    }

    // 5. Inner bright coral-rose ruffled crown
    for (let i = 0; i < this._leaves.length; i++) {
      if (this._leaves[i].tier === 2) {
        this._drawRuffledLeaf(ctx, this._leaves[i], t);
      }
    }

    // 6. Central glossy ruby heart bud
    const budGrad = ctx.createRadialGradient(-1.5, -1.5, 0.6, 0, 0, 6.2);
    budGrad.addColorStop(0, '#FFE4F0');
    budGrad.addColorStop(0.45, '#FF68A2');
    budGrad.addColorStop(1, '#961242');
    ctx.fillStyle = budGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 5.5, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.7;
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.arc(-1.8, -1.8, 1.4, 0, TAU);
    ctx.fill();

    ctx.restore();
  }
}

export default Redalgaeflora;
