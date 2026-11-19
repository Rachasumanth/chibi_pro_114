// Bubble-Tip Sea Anemone — 2D Top-Down Expressive Chibi Flora Module
// Standalone ES Module (HTML5 Canvas 2D API only)

const INK = '#1E142B';
const TAU = Math.PI * 2;

export class Anemoneflora {
  static metadata = {
    name: 'Bubble-Tip Sea Anemone',
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

    // Three concentric rings of plump swaying tentacles
    this._rings = [
      this._buildRing(14, 15, 26.5, 6.2, 5.8, 0.0, 1.85), // Outer ring
      this._buildRing(11, 11, 20.5, 5.6, 5.2, 0.28, 2.15), // Middle ring
      this._buildRing(7, 6.5, 13.5, 5.0, 4.6, 0.55, 2.45), // Inner crown
    ];
  }

  _buildRing(count, baseR, length, stalkW, bulbR, offset, freq) {
    const list = [];
    for (let i = 0; i < count; i++) {
      const a = (i / count) * TAU + offset;
      const jitter = Math.sin(i * 2.37 + offset * 4) * 0.08;
      list.push({
        angle: a + jitter,
        baseR,
        length: length * (0.92 + 0.16 * Math.abs(Math.sin(i * 1.7 + offset))),
        stalkW,
        bulbR: bulbR * (0.92 + 0.14 * Math.cos(i * 2.1)),
        phase: i * 0.68 + offset * 3.1,
        freq,
        bendDir: i % 2 === 0 ? 1 : -1,
      });
    }
    return list;
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

  _drawTentacle(ctx, tent, t, ringIdx) {
    const sway = Math.sin(t * tent.freq + tent.phase) * 0.24;
    const stretch = 1 + Math.sin(t * (tent.freq * 1.2) + tent.phase + 0.8) * 0.07;
    const a = tent.angle + sway * 0.45;
    const cosA = Math.cos(a);
    const sinA = Math.sin(a);
    const perpX = -sinA;
    const perpY = cosA;

    const len = tent.length * stretch;
    const sx = cosA * tent.baseR;
    const sy = sinA * tent.baseR;

    const bend = (Math.sin(t * tent.freq + tent.phase) * 5.2 + tent.bendDir * 2.2) * (ringIdx === 2 ? 0.6 : 1);
    const mx = cosA * (tent.baseR + len * 0.55) + perpX * bend;
    const my = sinA * (tent.baseR + len * 0.55) + perpY * bend;

    const ex = cosA * (tent.baseR + len) + perpX * (bend * 1.15);
    const ey = sinA * (tent.baseR + len) + perpY * (bend * 1.15);

    // Build plump tapered stalk polygon along quadratic curve
    const baseHW = tent.stalkW * 0.58;
    const neckHW = tent.stalkW * 0.34;
    const l0x = sx + perpX * baseHW;
    const l0y = sy + perpY * baseHW;
    const r0x = sx - perpX * baseHW;
    const r0y = sy - perpY * baseHW;
    const lmx = mx + perpX * (baseHW * 0.78);
    const lmy = my + perpY * (baseHW * 0.78);
    const rmx = mx - perpX * (baseHW * 0.78);
    const rmy = my - perpY * (baseHW * 0.78);
    const l1x = ex + perpX * neckHW;
    const l1y = ey + perpY * neckHW;
    const r1x = ex - perpX * neckHW;
    const r1y = ey - perpY * neckHW;

    // Stalk fill with magenta-pink gradient
    const stalkGrad = ctx.createLinearGradient(sx, sy, ex, ey);
    if (ringIdx === 0) {
      stalkGrad.addColorStop(0, '#78184B');
      stalkGrad.addColorStop(0.55, '#C82E7B');
      stalkGrad.addColorStop(1, '#FF68AD');
    } else if (ringIdx === 1) {
      stalkGrad.addColorStop(0, '#961E5C');
      stalkGrad.addColorStop(0.55, '#E43F8F');
      stalkGrad.addColorStop(1, '#FF80BE');
    } else {
      stalkGrad.addColorStop(0, '#B1276D');
      stalkGrad.addColorStop(0.5, '#F554A3');
      stalkGrad.addColorStop(1, '#FF9BD0');
    }

    ctx.beginPath();
    ctx.moveTo(l0x, l0y);
    ctx.quadraticCurveTo(lmx, lmy, l1x, l1y);
    ctx.lineTo(r1x, r1y);
    ctx.quadraticCurveTo(rmx, rmy, r0x, r0y);
    ctx.closePath();

    ctx.fillStyle = stalkGrad;
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.9;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Soft glossy inner streak on stalk
    ctx.beginPath();
    ctx.moveTo(sx + perpX * 0.7, sy + perpY * 0.7);
    ctx.quadraticCurveTo(mx + perpX * 0.6, my + perpY * 0.6, ex, ey);
    ctx.strokeStyle = 'rgba(255, 224, 242, 0.36)';
    ctx.lineWidth = 1.3;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Bulbous glowing neon-green bubble tip
    const bubblePulse = 1 + Math.sin(t * 3.1 + tent.phase) * 0.08;
    const br = tent.bulbR * bubblePulse;

    // Soft neon subsurface halo
    const glowGrad = ctx.createRadialGradient(ex, ey, br * 0.2, ex, ey, br * 1.95);
    glowGrad.addColorStop(0, 'rgba(155, 255, 72, 0.55)');
    glowGrad.addColorStop(0.6, 'rgba(72, 238, 112, 0.18)');
    glowGrad.addColorStop(1, 'rgba(72, 238, 112, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(ex, ey, br * 1.95, 0, TAU);
    ctx.fill();

    // Plump bubble body (slightly pear-shaped ellipse aligned to tentacle)
    ctx.save();
    ctx.translate(ex, ey);
    ctx.rotate(a);

    const tipGrad = ctx.createRadialGradient(-br * 0.22, -br * 0.28, 0.6, 0, 0, br * 1.15);
    tipGrad.addColorStop(0, '#F0FFB8');
    tipGrad.addColorStop(0.32, '#A7FF42');
    tipGrad.addColorStop(0.75, '#34CF63');
    tipGrad.addColorStop(1, '#1A7B47');

    ctx.fillStyle = tipGrad;
    ctx.beginPath();
    ctx.ellipse(br * 0.15, 0, br * 1.12, br * 0.92, 0, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.9;
    ctx.stroke();

    // Candy-gloss jelly highlight dot
    ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
    ctx.beginPath();
    ctx.ellipse(-br * 0.15, -br * 0.32, br * 0.38, br * 0.22, -0.35, 0, TAU);
    ctx.fill();

    ctx.restore();
  }

  draw(ctx) {
    const t = this.time;
    const breath = 1 + Math.sin(t * 2.3) * 0.032;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.scale(this.scale * breath, this.scale * breath);

    // 1. Ambient occlusion seabed shadow
    const aoGrad = ctx.createRadialGradient(2, 4, 12, 2, 4, 48);
    aoGrad.addColorStop(0, 'rgba(20, 10, 30, 0.48)');
    aoGrad.addColorStop(0.65, 'rgba(24, 12, 34, 0.22)');
    aoGrad.addColorStop(1, 'rgba(24, 12, 34, 0)');
    ctx.fillStyle = aoGrad;
    ctx.beginPath();
    ctx.arc(2, 4, 48, 0, TAU);
    ctx.fill();

    // 2. Soft neon-magenta subsurface aura
    const auraGrad = ctx.createRadialGradient(0, 0, 8, 0, 0, 46);
    auraGrad.addColorStop(0, 'rgba(255, 88, 168, 0.22)');
    auraGrad.addColorStop(0.65, 'rgba(130, 255, 92, 0.12)');
    auraGrad.addColorStop(1, 'rgba(130, 255, 92, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 46, 0, TAU);
    ctx.fill();

    // 3. Outer tentacle ring
    for (let i = 0; i < this._rings[0].length; i++) {
      this._drawTentacle(ctx, this._rings[0][i], t, 0);
    }

    // 4. Shaded fleshy oral disc base
    const discR = 17.5;
    const discGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, discR);
    discGrad.addColorStop(0, '#59113B');
    discGrad.addColorStop(0.52, '#9A1F62');
    discGrad.addColorStop(0.88, '#D63D88');
    discGrad.addColorStop(1, '#701446');
    ctx.fillStyle = discGrad;
    ctx.beginPath();
    ctx.arc(0, 0, discR, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Radial mesentery grooves on oral disc
    ctx.strokeStyle = 'rgba(255, 186, 224, 0.26)';
    ctx.lineWidth = 1.0;
    for (let i = 0; i < 12; i++) {
      const ma = (i / 12) * TAU;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ma) * 4.5, Math.sin(ma) * 4.5);
      ctx.lineTo(Math.cos(ma) * (discR - 2.5), Math.sin(ma) * (discR - 2.5));
      ctx.stroke();
    }

    // 5. Middle tentacle ring
    for (let i = 0; i < this._rings[1].length; i++) {
      this._drawTentacle(ctx, this._rings[1][i], t, 1);
    }

    // 6. Central oral mouth cavity with soft sheen
    const mouthGrad = ctx.createRadialGradient(0, 0, 0.8, 0, 0, 7.5);
    mouthGrad.addColorStop(0, '#2A071E');
    mouthGrad.addColorStop(0.65, '#681446');
    mouthGrad.addColorStop(1, 'rgba(154, 31, 98, 0)');
    ctx.fillStyle = mouthGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 7.5, 0, TAU);
    ctx.fill();

    // Cute puckered center slit
    ctx.strokeStyle = '#FFD0E8';
    ctx.lineWidth = 1.3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.ellipse(0, 0, 3.2, 1.5, 0.25, 0, TAU);
    ctx.stroke();

    // 7. Inner bouncy tentacle crown
    for (let i = 0; i < this._rings[2].length; i++) {
      this._drawTentacle(ctx, this._rings[2][i], t, 2);
    }

    ctx.restore();
  }
}

export default Anemoneflora;
