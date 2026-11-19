// Ribbon Seagrass Tuft — 2D Top-Down Expressive Chibi Flora Module
// Standalone ES Module (HTML5 Canvas 2D API only)

const INK = '#1E142B';
const TAU = Math.PI * 2;

export class Seagrassflora {
  static metadata = {
    name: 'Ribbon Seagrass Tuft',
    category: 'flora',
    baseLength: 90,
    baseWidth: 90,
  };

  constructor(x = 0, y = 0, scale = 1) {
    this.x = x;
    this.y = y;
    this.scale = scale;
    this.angle = 0;
    this.time = 0;
    this._state = 'idle';

    // Three layered rosettes of slender ribbon grass blades
    this._blades = [];
    this._addRing(12, 37, 6.0, 0, 0.0, 1.75); // Outer long deep-emerald blades
    this._addRing(9, 30, 5.4, 1, 0.34, 2.05); // Middle vibrant grass blades
    this._addRing(6, 21, 4.6, 2, 0.62, 2.35); // Inner bright lime-chartreuse shoots

    // Textured sand pebbles around the root crown
    this._pebbles = [
      { x: -10, y: -6, rx: 4.0, ry: 2.8, rot: 0.4, color: '#D8BE8C' },
      { x: 9, y: -8, rx: 3.4, ry: 2.4, rot: -0.5, color: '#C9AD79' },
      { x: 11, y: 7, rx: 3.8, ry: 2.5, rot: 0.8, color: '#E3CC9D' },
      { x: -8, y: 10, rx: 3.2, ry: 2.3, rot: -0.3, color: '#BFA270' },
      { x: -2, y: -12, rx: 2.6, ry: 2.0, rot: 0.2, color: '#E8D4AA' },
    ];
  }

  _addRing(count, baseLen, width, layer, offset, freq) {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * TAU + offset + Math.sin(i * 2.7 + layer) * 0.11;
      const lenVar = 0.86 + 0.26 * Math.abs(Math.sin(i * 1.9 + layer * 1.3));
      this._blades.push({
        angle: a,
        length: baseLen * lenVar,
        width: width * (0.9 + 0.18 * Math.cos(i * 2.1)),
        layer,
        phase: i * 0.72 + layer * 1.1,
        freq,
        curve: (i % 2 === 0 ? 1 : -1) * (0.18 + 0.14 * Math.abs(Math.sin(i * 1.4))),
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

  _drawBlade(ctx, b, t, flowX, flowY) {
    const segs = 7;
    const sway = Math.sin(t * b.freq + b.phase) * 0.13;
    const a = b.angle + sway;
    const cosA = Math.cos(a);
    const sinA = Math.sin(a);
    const perpX = -sinA;
    const perpY = cosA;

    const spine = [];
    const leftPts = [];
    const rightPts = [];

    for (let i = 0; i <= segs; i++) {
      const u = i / segs;
      const dist = 3.5 + u * b.length;
      const wave =
        Math.sin(u * 3.4 - t * (b.freq * 1.55) + b.phase) * (4.6 * u * u) +
        b.curve * 10 * u * u;
      const sx = cosA * dist + perpX * wave + flowX * u * u * 3.4;
      const sy = sinA * dist + perpY * wave + flowY * u * u * 3.4;
      spine.push({ x: sx, y: sy });

      // Slender ribbon profile: broad near base/mid, gently rounded-pointed tip
      const taper = u < 0.72 ? (0.85 + 0.15 * Math.sin(u * Math.PI)) : Math.pow((1 - u) / 0.28, 0.75);
      const hw = Math.max(0.45, b.width * 0.5 * taper);
      leftPts.push({ x: sx + perpX * hw, y: sy + perpY * hw });
      rightPts.push({ x: sx - perpX * hw, y: sy - perpY * hw });
    }

    const start = spine[0];
    const tip = spine[segs];

    ctx.beginPath();
    ctx.moveTo(leftPts[0].x, leftPts[0].y);
    for (let i = 1; i < segs; i++) {
      ctx.lineTo(leftPts[i].x, leftPts[i].y);
    }
    ctx.lineTo(tip.x, tip.y);
    for (let i = segs - 1; i >= 0; i--) {
      ctx.lineTo(rightPts[i].x, rightPts[i].y);
    }
    ctx.closePath();

    // Multi-stop vibrant green & lime gradient
    const grad = ctx.createLinearGradient(start.x, start.y, tip.x, tip.y);
    if (b.layer === 0) {
      grad.addColorStop(0, '#1A5E3A');
      grad.addColorStop(0.55, '#2E984B');
      grad.addColorStop(1, '#68CF56');
    } else if (b.layer === 1) {
      grad.addColorStop(0, '#277C40');
      grad.addColorStop(0.5, '#54C44F');
      grad.addColorStop(1, '#A9F05E');
    } else {
      grad.addColorStop(0, '#46A844');
      grad.addColorStop(0.5, '#96E854');
      grad.addColorStop(1, '#E2FF8A');
    }

    ctx.fillStyle = grad;
    ctx.fill();

    // Bold dark-plum chibi outline
    ctx.strokeStyle = INK;
    ctx.lineWidth = b.layer === 2 ? 1.65 : 1.85;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Longitudinal central ribbon sheen vein
    ctx.beginPath();
    ctx.moveTo(spine[1].x, spine[1].y);
    for (let i = 2; i < segs; i++) {
      ctx.lineTo(spine[i].x, spine[i].y);
    }
    ctx.strokeStyle = b.layer === 2 ? 'rgba(255, 255, 220, 0.62)' : 'rgba(204, 255, 148, 0.44)';
    ctx.lineWidth = 1.05;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  draw(ctx) {
    const t = this.time;
    const flowX = Math.sin(t * 1.15) * 1.1;
    const flowY = Math.cos(t * 0.9) * 0.8;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Ambient occlusion seabed shadow
    const aoGrad = ctx.createRadialGradient(2, 4, 8, 2, 4, 44);
    aoGrad.addColorStop(0, 'rgba(18, 24, 28, 0.44)');
    aoGrad.addColorStop(0.65, 'rgba(18, 28, 30, 0.18)');
    aoGrad.addColorStop(1, 'rgba(18, 28, 30, 0)');
    ctx.fillStyle = aoGrad;
    ctx.beginPath();
    ctx.arc(2, 4, 44, 0, TAU);
    ctx.fill();

    // 2. Textured sandy root crown & pebbles
    const sandGrad = ctx.createRadialGradient(-2, -2, 3, 0, 0, 18);
    sandGrad.addColorStop(0, '#E8D3A4');
    sandGrad.addColorStop(0.65, '#B89660');
    sandGrad.addColorStop(1, 'rgba(122, 92, 54, 0)');
    ctx.fillStyle = sandGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, TAU);
    ctx.fill();

    for (let i = 0; i < this._pebbles.length; i++) {
      const p = this._pebbles[i];
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.rx, p.ry, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.25;
      ctx.stroke();
      ctx.restore();
    }

    // 3. Outer deep-emerald grass ring
    for (let i = 0; i < this._blades.length; i++) {
      if (this._blades[i].layer === 0) {
        this._drawBlade(ctx, this._blades[i], t, flowX, flowY);
      }
    }

    // 4. Inner root-collar ambient shadow
    const coreShadow = ctx.createRadialGradient(0, 0, 2, 0, 0, 13);
    coreShadow.addColorStop(0, 'rgba(16, 36, 22, 0.58)');
    coreShadow.addColorStop(1, 'rgba(16, 36, 22, 0)');
    ctx.fillStyle = coreShadow;
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, TAU);
    ctx.fill();

    // 5. Middle vibrant leaf-green blades
    for (let i = 0; i < this._blades.length; i++) {
      if (this._blades[i].layer === 1) {
        this._drawBlade(ctx, this._blades[i], t, flowX, flowY);
      }
    }

    // 6. Inner bright lime-chartreuse crown shoots
    for (let i = 0; i < this._blades.length; i++) {
      if (this._blades[i].layer === 2) {
        this._drawBlade(ctx, this._blades[i], t, flowX, flowY);
      }
    }

    // 7. Cute central glossy shoot bud
    const budPulse = 1 + Math.sin(t * 2.5) * 0.06;
    const budGrad = ctx.createRadialGradient(-1.5, -1.5, 0.5, 0, 0, 5.2 * budPulse);
    budGrad.addColorStop(0, '#F6FFBC');
    budGrad.addColorStop(0.55, '#8EE64A');
    budGrad.addColorStop(1, '#2E8A3E');
    ctx.fillStyle = budGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 4.8 * budPulse, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.6;
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.arc(-1.5, -1.5, 1.3, 0, TAU);
    ctx.fill();

    ctx.restore();
  }
}

export default Seagrassflora;
