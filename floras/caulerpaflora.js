// Feather Caulerpa Algae — 2D Top-Down Expressive Chibi Flora Module
// Standalone ES Module (HTML5 Canvas 2D API only)

const INK = '#1E142B';
const TAU = Math.PI * 2;

export class Caulerpaflora {
  static metadata = {
    name: 'Feather Caulerpa Algae',
    category: 'flora',
    baseLength: 95,
    baseWidth: 95,
  };

  constructor(x = 0, y = 0, scale = 1) {
    this.x = x;
    this.y = y;
    this.scale = scale;
    this.angle = 0;
    this.time = 0;
    this._state = 'idle';

    // Symmetrical feather-fern fronds sprouting along the creeping emerald runner stolon
    this._fronds = [
      { ox: -24, oy: 4, angle: -2.42, length: 30, pairs: 7, phase: 0.2, freq: 1.8, layer: 0 },
      { ox: -14, oy: -2, angle: 2.38, length: 32, pairs: 8, phase: 0.9, freq: 1.7, layer: 0 },
      { ox: 10, oy: 3, angle: -0.78, length: 31, pairs: 8, phase: 2.3, freq: 1.85, layer: 0 },
      { ox: 22, oy: -4, angle: 0.72, length: 28, pairs: 7, phase: 3.1, freq: 1.9, layer: 0 },
      // Upper sunlit hero fronds
      { ox: -18, oy: 1, angle: -1.62, length: 35, pairs: 9, phase: 1.5, freq: 1.75, layer: 1 },
      { ox: -2, oy: -1, angle: 1.48, length: 36, pairs: 9, phase: 2.7, freq: 1.68, layer: 1 },
      { ox: 15, oy: 0, angle: -0.14, length: 33, pairs: 8, phase: 3.9, freq: 1.82, layer: 1 },
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

  _drawFrond(ctx, frond, t) {
    const isUpper = frond.layer === 1;
    const sway = Math.sin(t * frond.freq + frond.phase) * 0.14;
    const a = frond.angle + sway;
    const cosA = Math.cos(a);
    const sinA = Math.sin(a);
    const perpX = -sinA;
    const perpY = cosA;

    // Sample curved frond rachis
    const pts = [];
    const steps = frond.pairs + 1;
    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      const wave = Math.sin(u * 3.2 - t * 2.3 + frond.phase) * (4.2 * u * u);
      const px = frond.ox + cosA * (u * frond.length) + perpX * wave;
      const py = frond.oy + sinA * (u * frond.length) + perpY * wave;
      pts.push({ x: px, y: py, u });
    }

    // 1. Draw paired symmetrical sickle-shaped fern pinnules along both sides
    for (let i = 1; i <= frond.pairs; i++) {
      const p = pts[i];
      const next = pts[Math.min(steps, i + 1)];
      const dx = next.x - p.x;
      const dy = next.y - p.y;
      const dLen = Math.hypot(dx, dy) || 1;
      const tx = dx / dLen;
      const ty = dy / dLen;
      const nx = -ty;
      const ny = tx;

      // Envelope: plump in middle, tapering gracefully at base and apex
      const env = Math.sin(Math.pow(p.u, 0.78) * Math.PI);
      const pinLen = (isUpper ? 9.8 : 8.6) * (0.35 + 0.65 * env);
      const pinW = (isUpper ? 2.5 : 2.2) * (0.6 + 0.4 * env);

      for (const side of [-1, 1]) {
        const tipX = p.x + (nx * side * 0.84 + tx * 0.56) * pinLen;
        const tipY = p.y + (ny * side * 0.84 + ty * 0.56) * pinLen;
        const ctrlX = p.x + (nx * side * 0.72 + tx * 0.18) * (pinLen * 0.62);
        const ctrlY = p.y + (ny * side * 0.72 + ty * 0.18) * (pinLen * 0.62);

        // Plump leaflet silhouette
        ctx.beginPath();
        ctx.moveTo(p.x - tx * (pinW * 0.5), p.y - ty * (pinW * 0.5));
        ctx.quadraticCurveTo(ctrlX - tx * pinW * 0.45, ctrlY - ty * pinW * 0.45, tipX, tipY);
        ctx.quadraticCurveTo(ctrlX + tx * pinW * 0.65, ctrlY + ty * pinW * 0.65, p.x + tx * (pinW * 0.55), p.y + ty * (pinW * 0.55));
        ctx.closePath();

        const pGrad = ctx.createLinearGradient(p.x, p.y, tipX, tipY);
        if (isUpper) {
          pGrad.addColorStop(0, '#1C8E52');
          pGrad.addColorStop(0.6, '#4AD66D');
          pGrad.addColorStop(1, '#B8FF78');
        } else {
          pGrad.addColorStop(0, '#13663E');
          pGrad.addColorStop(0.6, '#2EA858');
          pGrad.addColorStop(1, '#7CE672');
        }
        ctx.fillStyle = pGrad;
        ctx.fill();

        ctx.strokeStyle = INK;
        ctx.lineWidth = 1.25;
        ctx.lineJoin = 'round';
        ctx.stroke();
      }
    }

    // 2. Central emerald midrib rachis with glossy highlight
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i <= steps; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.strokeStyle = INK;
    ctx.lineWidth = isUpper ? 3.5 : 3.0;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    ctx.strokeStyle = isUpper ? '#74F07D' : '#3AB860';
    ctx.lineWidth = isUpper ? 1.8 : 1.4;
    ctx.stroke();

    // Candy-gloss tip highlight on upper fronds
    if (isUpper) {
      const tip = pts[steps];
      ctx.fillStyle = '#E4FFAE';
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 1.5, 0, TAU);
      ctx.fill();
    }
  }

  draw(ctx) {
    const t = this.time;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Ambient occlusion seabed shadow
    const aoGrad = ctx.createRadialGradient(2, 4, 8, 2, 4, 46);
    aoGrad.addColorStop(0, 'rgba(14, 24, 26, 0.45)');
    aoGrad.addColorStop(0.65, 'rgba(16, 28, 28, 0.20)');
    aoGrad.addColorStop(1, 'rgba(16, 28, 28, 0)');
    ctx.fillStyle = aoGrad;
    ctx.beginPath();
    ctx.arc(2, 4, 46, 0, TAU);
    ctx.fill();

    // 2. Soft emerald subsurface glow
    const glowGrad = ctx.createRadialGradient(0, 0, 6, 0, 0, 44);
    glowGrad.addColorStop(0, 'rgba(92, 242, 132, 0.20)');
    glowGrad.addColorStop(1, 'rgba(92, 242, 132, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 44, 0, TAU);
    ctx.fill();

    // 3. Lower feather fronds
    for (let i = 0; i < this._fronds.length; i++) {
      if (this._fronds[i].layer === 0) {
        this._drawFrond(ctx, this._fronds[i], t);
      }
    }

    // 4. Creeping emerald runner stolon & anchoring rhizoid rootlets
    const stolonPts = [
      [-32, 7],
      [-16, -2],
      [0, 3],
      [16, -3],
      [31, 4],
    ];

    // Tiny pale fibrous rhizoid tufts clutching the seabed
    ctx.strokeStyle = '#9BC896';
    ctx.lineWidth = 1.2;
    ctx.lineCap = 'round';
    for (let i = 1; i <= 3; i++) {
      const [rx, ry] = stolonPts[i];
      for (let k = -1; k <= 1; k++) {
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx + k * 4.2, ry + 7.5 + Math.abs(k) * 1.5);
        ctx.stroke();
      }
    }

    // Runner stolon outline + gradient body + glossy streak
    ctx.beginPath();
    ctx.moveTo(stolonPts[0][0], stolonPts[0][1]);
    ctx.bezierCurveTo(-20, -8, -8, 10, 0, 3);
    ctx.bezierCurveTo(8, -4, 20, -6, 31, 4);

    ctx.strokeStyle = INK;
    ctx.lineWidth = 7.4;
    ctx.lineCap = 'round';
    ctx.stroke();

    const stGrad = ctx.createLinearGradient(-32, 0, 32, 0);
    stGrad.addColorStop(0, '#1D7D49');
    stGrad.addColorStop(0.5, '#46CC6A');
    stGrad.addColorStop(1, '#8CF27A');
    ctx.strokeStyle = stGrad;
    ctx.lineWidth = 4.2;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(232, 255, 186, 0.72)';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // 5. Upper sunlit hero feather fronds
    for (let i = 0; i < this._fronds.length; i++) {
      if (this._fronds[i].layer === 1) {
        this._drawFrond(ctx, this._fronds[i], t);
      }
    }

    // 6. Glossy growing stolon apex bud
    ctx.fillStyle = '#D4FF8C';
    ctx.beginPath();
    ctx.arc(31, 4, 2.8, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.restore();
  }
}

export default Caulerpaflora;
