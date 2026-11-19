// Giant Bull Kelp — 2D Top-Down Expressive Chibi Flora Module
// Standalone ES Module (HTML5 Canvas 2D API only)

const INK = '#1E142B';
const TAU = Math.PI * 2;

export class Kelpflora {
  static metadata = {
    name: 'Giant Bull Kelp',
    category: 'flora',
    baseLength: 145,
    baseWidth: 145,
  };

  constructor(x = 0, y = 0, scale = 1) {
    this.x = x;
    this.y = y;
    this.scale = scale;
    this.angle = 0;
    this.time = 0;
    this._state = 'idle';

    // Lower darker blades (under-canopy) and upper sunlit blades
    this._blades = [
      // Lower layer (7 lush blades)
      { angle: -2.75, length: 61, width: 13.5, curve: 0.28, phase: 0.2, freq: 1.55, ruffleFreq: 4.5, layer: 0, hueShift: -1 },
      { angle: -1.92, length: 65, width: 14.0, curve: -0.22, phase: 1.1, freq: 1.45, ruffleFreq: 5.0, layer: 0, hueShift: 0 },
      { angle: -1.05, length: 58, width: 12.8, curve: 0.30, phase: 2.0, freq: 1.65, ruffleFreq: 4.2, layer: 0, hueShift: -1 },
      { angle: -0.18, length: 64, width: 14.2, curve: -0.26, phase: 2.9, freq: 1.50, ruffleFreq: 4.8, layer: 0, hueShift: 0 },
      { angle: 0.72, length: 62, width: 13.4, curve: 0.24, phase: 3.8, freq: 1.58, ruffleFreq: 4.6, layer: 0, hueShift: -1 },
      { angle: 1.62, length: 66, width: 14.5, curve: -0.28, phase: 4.7, freq: 1.42, ruffleFreq: 5.2, layer: 0, hueShift: 0 },
      { angle: 2.50, length: 59, width: 13.0, curve: 0.25, phase: 5.5, freq: 1.62, ruffleFreq: 4.4, layer: 0, hueShift: -1 },
      // Upper layer (7 bright sunlit blades)
      { angle: -2.35, length: 56, width: 13.0, curve: -0.20, phase: 0.65, freq: 1.72, ruffleFreq: 4.6, layer: 1, hueShift: 1 },
      { angle: -1.48, length: 60, width: 13.6, curve: 0.24, phase: 1.55, freq: 1.60, ruffleFreq: 5.0, layer: 1, hueShift: 2 },
      { angle: -0.62, length: 54, width: 12.2, curve: -0.25, phase: 2.45, freq: 1.78, ruffleFreq: 4.3, layer: 1, hueShift: 1 },
      { angle: 0.28, length: 59, width: 13.8, curve: 0.22, phase: 3.35, freq: 1.66, ruffleFreq: 4.9, layer: 1, hueShift: 2 },
      { angle: 1.18, length: 55, width: 12.6, curve: -0.24, phase: 4.25, freq: 1.74, ruffleFreq: 4.5, layer: 1, hueShift: 1 },
      { angle: 2.06, length: 58, width: 13.4, curve: 0.20, phase: 5.10, freq: 1.62, ruffleFreq: 4.8, layer: 1, hueShift: 2 },
      { angle: 2.94, length: 53, width: 12.0, curve: -0.22, phase: 5.95, freq: 1.80, ruffleFreq: 4.2, layer: 1, hueShift: 1 },
    ];

    // Tiny golden-aqua micro-bubbles drifting gently near the float bulb
    this._bubbles = [
      { angle: 0.6, dist: 16, r: 2.4, phase: 0.3, speed: 1.4 },
      { angle: 2.1, dist: 20, r: 1.8, phase: 1.9, speed: 1.7 },
      { angle: 3.8, dist: 18, r: 2.1, phase: 3.4, speed: 1.2 },
      { angle: 5.2, dist: 23, r: 1.6, phase: 4.8, speed: 1.6 },
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
    // Safe no-op: flora remains in continuous idle animation
  }

  _drawBlade(ctx, blade, t, currentX, currentY) {
    const segs = 12;
    const baseR = 9.5;
    const swayAngle = blade.angle + Math.sin(t * blade.freq + blade.phase) * 0.11;
    const cosA = Math.cos(swayAngle);
    const sinA = Math.sin(swayAngle);
    const perpX = -sinA;
    const perpY = cosA;

    const spine = [];
    const leftPts = [];
    const rightPts = [];

    for (let i = 0; i <= segs; i++) {
      const u = i / segs;
      const dist = baseR + u * blade.length;

      // Traveling ocean wave along the blade spine
      const wave =
        Math.sin(u * 4.2 - t * (blade.freq * 1.65) + blade.phase) * (5.5 * u * u) +
        blade.curve * 11 * u * u;
      const driftX = currentX * u * u * 3.8;
      const driftY = currentY * u * u * 3.8;

      const sx = cosA * dist + perpX * wave + driftX;
      const sy = sinA * dist + perpY * wave + driftY;
      spine.push({ x: sx, y: sy, u });

      // Tapered kelp blade envelope with organic ruffled margins
      const env = Math.sin(Math.pow(u, 0.72) * Math.PI) * (1 - 0.16 * u);
      const ruffleL = 1 + 0.24 * Math.sin(u * blade.ruffleFreq * Math.PI - t * 2.2 + blade.phase);
      const ruffleR = 1 + 0.24 * Math.sin(u * blade.ruffleFreq * Math.PI - t * 2.2 + blade.phase + 1.4);
      const halfW = Math.max(0.7, blade.width * 0.5 * env);

      // Local normal approximated from radial perpendicular + slight wave tilt
      leftPts.push({ x: sx + perpX * halfW * ruffleL, y: sy + perpY * halfW * ruffleL });
      rightPts.push({ x: sx - perpX * halfW * ruffleR, y: sy - perpY * halfW * ruffleR });
    }

    const tip = spine[segs];
    const start = spine[0];

    // Build smooth ruffled blade path
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    for (let i = 1; i < segs; i++) {
      const curr = leftPts[i];
      const next = leftPts[i + 1];
      ctx.quadraticCurveTo(curr.x, curr.y, (curr.x + next.x) * 0.5, (curr.y + next.y) * 0.5);
    }
    ctx.lineTo(tip.x, tip.y);
    for (let i = segs - 1; i >= 1; i--) {
      const curr = rightPts[i];
      const prev = rightPts[i - 1];
      ctx.quadraticCurveTo(curr.x, curr.y, (curr.x + prev.x) * 0.5, (curr.y + prev.y) * 0.5);
    }
    ctx.closePath();

    // Rich olive-to-amber kelp gradient
    const grad = ctx.createLinearGradient(start.x, start.y, tip.x, tip.y);
    if (blade.layer === 0) {
      grad.addColorStop(0, '#3C4718');
      grad.addColorStop(0.38, '#5C6921');
      grad.addColorStop(0.78, '#8D892B');
      grad.addColorStop(1, '#B89B35');
    } else if (blade.hueShift === 2) {
      grad.addColorStop(0, '#5A671F');
      grad.addColorStop(0.35, '#899629');
      grad.addColorStop(0.75, '#C8AC36');
      grad.addColorStop(1, '#F2CF5E');
    } else {
      grad.addColorStop(0, '#4E5D1D');
      grad.addColorStop(0.4, '#798A28');
      grad.addColorStop(0.78, '#B69D32');
      grad.addColorStop(1, '#E6C252');
    }

    ctx.fillStyle = grad;
    ctx.fill();

    // Translucent sunlit inner rim highlight on upper blades
    if (blade.layer === 1) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 241, 166, 0.42)';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.restore();
    }

    // Bold chibi dark-plum outline
    ctx.strokeStyle = INK;
    ctx.lineWidth = blade.layer === 1 ? 2.1 : 1.9;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();

    // Central raised midrib vein
    ctx.beginPath();
    ctx.moveTo(spine[0].x, spine[0].y);
    for (let i = 1; i < segs; i++) {
      ctx.lineTo(spine[i].x, spine[i].y);
    }
    ctx.strokeStyle = blade.layer === 1 ? 'rgba(245, 224, 128, 0.72)' : 'rgba(182, 174, 72, 0.50)';
    ctx.lineWidth = blade.layer === 1 ? 1.55 : 1.15;
    ctx.stroke();

    // Delicate lateral pinnate veins along the midrib
    ctx.beginPath();
    for (let i = 2; i < segs - 1; i += 2) {
      const p = spine[i];
      const lp = leftPts[i];
      const rp = rightPts[i];
      const next = spine[i + 1];
      const lmx = p.x + (lp.x - p.x) * 0.62 + (next.x - p.x) * 0.35;
      const lmy = p.y + (lp.y - p.y) * 0.62 + (next.y - p.y) * 0.35;
      const rmx = p.x + (rp.x - p.x) * 0.62 + (next.x - p.x) * 0.35;
      const rmy = p.y + (rp.y - p.y) * 0.62 + (next.y - p.y) * 0.35;
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(lmx, lmy);
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(rmx, rmy);
    }
    ctx.strokeStyle = blade.layer === 1 ? 'rgba(255, 238, 158, 0.35)' : 'rgba(42, 48, 14, 0.30)';
    ctx.lineWidth = 0.85;
    ctx.stroke();
  }

  draw(ctx) {
    const t = this.time;
    const breath = 1 + Math.sin(t * 2.1) * 0.035;
    const currentX = Math.sin(t * 0.95) * 0.9;
    const currentY = Math.cos(t * 0.75) * 0.7;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Ambient occlusion seabed shadow
    const aoGrad = ctx.createRadialGradient(3, 5, 8, 3, 5, 68);
    aoGrad.addColorStop(0, 'rgba(18, 12, 28, 0.44)');
    aoGrad.addColorStop(0.55, 'rgba(22, 18, 34, 0.22)');
    aoGrad.addColorStop(1, 'rgba(22, 18, 34, 0)');
    ctx.fillStyle = aoGrad;
    ctx.beginPath();
    ctx.arc(3, 5, 68, 0, TAU);
    ctx.fill();

    // 2. Soft underwater golden-olive caustic aura
    const auraGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 62);
    auraGrad.addColorStop(0, 'rgba(244, 208, 92, 0.20)');
    auraGrad.addColorStop(0.6, 'rgba(155, 178, 54, 0.08)');
    auraGrad.addColorStop(1, 'rgba(155, 178, 54, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 62, 0, TAU);
    ctx.fill();

    // 3. Textured gnarled holdfast roots peeking around the base
    ctx.save();
    for (let i = 0; i < 6; i++) {
      const ra = (i / 6) * TAU + 0.35;
      const rLen = 19 + (i % 2) * 4;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ra) * 6, Math.sin(ra) * 6);
      ctx.quadraticCurveTo(
        Math.cos(ra + 0.22) * (rLen * 0.6),
        Math.sin(ra + 0.22) * (rLen * 0.6),
        Math.cos(ra - 0.08) * rLen,
        Math.sin(ra - 0.08) * rLen
      );
      ctx.strokeStyle = INK;
      ctx.lineWidth = 4.6;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.strokeStyle = '#6A4C23';
      ctx.lineWidth = 2.2;
      ctx.stroke();
    }
    ctx.restore();

    // 4. Lower undulating kelp blades
    for (let i = 0; i < this._blades.length; i++) {
      if (this._blades[i].layer === 0) {
        this._drawBlade(ctx, this._blades[i], t, currentX, currentY);
      }
    }

    // 5. Soft shadow collar right under the upper canopy & float bulb
    const collarGrad = ctx.createRadialGradient(0, 1, 5, 0, 1, 27);
    collarGrad.addColorStop(0, 'rgba(26, 18, 32, 0.45)');
    collarGrad.addColorStop(1, 'rgba(26, 18, 32, 0)');
    ctx.fillStyle = collarGrad;
    ctx.beginPath();
    ctx.arc(0, 1, 27, 0, TAU);
    ctx.fill();

    // 6. Upper sunlit kelp blades
    for (let i = 0; i < this._blades.length; i++) {
      if (this._blades[i].layer === 1) {
        this._drawBlade(ctx, this._blades[i], t, currentX, currentY);
      }
    }

    // 7. Central glossy golden-brown pneumatocyst float bulb
    const bulbR = 15.5 * breath;
    const bulbX = Math.sin(t * 1.4) * 1.2;
    const bulbY = Math.cos(t * 1.15) * 1.1;

    ctx.save();
    ctx.translate(bulbX, bulbY);

    // Bulb cast shadow
    ctx.fillStyle = 'rgba(24, 14, 30, 0.34)';
    ctx.beginPath();
    ctx.arc(2.2, 3.0, bulbR + 1.2, 0, TAU);
    ctx.fill();

    // Main bulb body
    const bulbGrad = ctx.createRadialGradient(-bulbR * 0.35, -bulbR * 0.35, 1.5, 0, 0, bulbR * 1.08);
    bulbGrad.addColorStop(0, '#FFF0A8');
    bulbGrad.addColorStop(0.28, '#E4AD3A');
    bulbGrad.addColorStop(0.68, '#A96B1E');
    bulbGrad.addColorStop(1, '#5D3511');
    ctx.fillStyle = bulbGrad;
    ctx.beginPath();
    ctx.arc(0, 0, bulbR, 0, TAU);
    ctx.fill();

    // Subtle organic equatorial texture ring
    ctx.strokeStyle = 'rgba(255, 232, 145, 0.28)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(0, 0, bulbR * 0.72, 0.25, Math.PI * 1.15);
    ctx.stroke();

    // Bold chibi outline on bulb
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(0, 0, bulbR, 0, TAU);
    ctx.stroke();

    // Candy-gloss crescent specular highlight
    ctx.fillStyle = 'rgba(255, 253, 232, 0.85)';
    ctx.beginPath();
    ctx.ellipse(-bulbR * 0.34, -bulbR * 0.34, bulbR * 0.36, bulbR * 0.21, -0.7, 0, TAU);
    ctx.fill();

    // Secondary crisp sparkle dot
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-bulbR * 0.08, -bulbR * 0.56, 1.9, 0, TAU);
    ctx.fill();

    // Cute tiny crown dimple / apex navel
    ctx.strokeStyle = 'rgba(72, 38, 12, 0.55)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(bulbR * 0.16, bulbR * 0.18, 2.5, 0.4, 2.6);
    ctx.stroke();

    ctx.restore();

    // 8. Shimmering micro-bubbles drifting gently near the bulb
    for (let i = 0; i < this._bubbles.length; i++) {
      const b = this._bubbles[i];
      const ba = b.angle + Math.sin(t * b.speed + b.phase) * 0.22;
      const bd = b.dist + Math.sin(t * (b.speed * 1.3) + b.phase) * 2.5;
      const bx = Math.cos(ba) * bd;
      const by = Math.sin(ba) * bd;
      const alpha = 0.55 + 0.3 * Math.sin(t * 2.4 + b.phase);

      ctx.fillStyle = `rgba(220, 252, 245, ${alpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(bx, by, b.r, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = `rgba(30, 20, 43, ${(alpha * 0.65).toFixed(3)})`;
      ctx.lineWidth = 0.9;
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.arc(bx - b.r * 0.3, by - b.r * 0.3, b.r * 0.35, 0, TAU);
      ctx.fill();
    }

    ctx.restore();
  }
}

export default Kelpflora;
