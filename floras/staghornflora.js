// Staghorn Coral — 2D Top-Down Expressive Chibi Flora Module
// Standalone ES Module (HTML5 Canvas 2D API only)

const INK = '#1E142B';
const TAU = Math.PI * 2;

export class Staghornflora {
  static metadata = {
    name: 'Staghorn Coral',
    category: 'flora',
    baseLength: 135,
    baseWidth: 135,
  };

  constructor(x = 0, y = 0, scale = 1) {
    this.x = x;
    this.y = y;
    this.scale = scale;
    this.angle = 0;
    this.time = 0;
    this._state = 'idle';

    // Lower darker branches + upper bright coral-orange & amber antler branches
    this._arms = [
      // Lower tier (5 deep terracotta-coral branches)
      { angle: -2.65, len: 50, baseW: 11, layer: 0, phase: 0.2, forks: [{ at: 0.45, da: -0.58, len: 24 }, { at: 0.62, da: 0.52, len: 21 }] },
      { angle: -1.40, len: 53, baseW: 11.5, layer: 0, phase: 1.4, forks: [{ at: 0.42, da: 0.56, len: 25 }, { at: 0.66, da: -0.50, len: 20 }] },
      { angle: -0.15, len: 49, baseW: 10.8, layer: 0, phase: 2.6, forks: [{ at: 0.46, da: -0.54, len: 22 }, { at: 0.64, da: 0.58, len: 22 }] },
      { angle: 1.12, len: 52, baseW: 11.2, layer: 0, phase: 3.8, forks: [{ at: 0.44, da: 0.55, len: 24 }, { at: 0.65, da: -0.52, len: 21 }] },
      { angle: 2.38, len: 51, baseW: 11.0, layer: 0, phase: 5.0, forks: [{ at: 0.48, da: -0.56, len: 23 }, { at: 0.66, da: 0.50, len: 19 }] },
      // Upper tier (6 vibrant coral-orange & amber antlers)
      { angle: -2.02, len: 52, baseW: 12.2, layer: 1, phase: 0.8, forks: [{ at: 0.42, da: -0.52, len: 25 }, { at: 0.64, da: 0.54, len: 22 }] },
      { angle: -0.96, len: 55, baseW: 12.6, layer: 1, phase: 1.9, forks: [{ at: 0.40, da: 0.50, len: 26 }, { at: 0.66, da: -0.48, len: 21 }] },
      { angle: 0.14, len: 50, baseW: 11.8, layer: 1, phase: 3.0, forks: [{ at: 0.45, da: -0.54, len: 23 }, { at: 0.68, da: 0.50, len: 19 }] },
      { angle: 1.18, len: 54, baseW: 12.4, layer: 1, phase: 4.1, forks: [{ at: 0.42, da: 0.54, len: 25 }, { at: 0.64, da: -0.50, len: 22 }] },
      { angle: 2.22, len: 51, baseW: 12.0, layer: 1, phase: 5.2, forks: [{ at: 0.46, da: -0.50, len: 24 }, { at: 0.66, da: 0.52, len: 20 }] },
      { angle: 3.02, len: 48, baseW: 11.4, layer: 1, phase: 6.0, forks: [{ at: 0.44, da: 0.52, len: 22 }, { at: 0.65, da: -0.54, len: 19 }] },
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

  _drawSegment(ctx, x0, y0, cx, cy, x1, y1, w0, w1, isUpper, t, phase) {
    // Pass 1: Bold dark-plum chibi ink outline
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(cx, cy, x1, y1);
    ctx.strokeStyle = INK;
    ctx.lineWidth = w0 + 4.4;
    ctx.stroke();

    // Pass 2: Warm coral-orange to amber gradient body
    const grad = ctx.createLinearGradient(x0, y0, x1, y1);
    if (isUpper) {
      grad.addColorStop(0, '#C83E2B');
      grad.addColorStop(0.55, '#F46B38');
      grad.addColorStop(0.88, '#FFA84C');
      grad.addColorStop(1, '#FFE8B6');
    } else {
      grad.addColorStop(0, '#8A2622');
      grad.addColorStop(0.58, '#C6462E');
      grad.addColorStop(0.90, '#E87E3E');
      grad.addColorStop(1, '#F7CE8C');
    }
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(cx, cy, x1, y1);
    ctx.strokeStyle = grad;
    ctx.lineWidth = w0;
    ctx.stroke();

    // Pass 3: Soft candy-gloss top-ridge highlight
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(cx - 1.0, cy - 1.2, x1, y1);
    ctx.strokeStyle = isUpper ? 'rgba(255, 236, 186, 0.55)' : 'rgba(255, 198, 146, 0.30)';
    ctx.lineWidth = Math.max(1.8, w1 * 0.42);
    ctx.stroke();

    // Pass 4: Pale calcifying axial growth tip with chibi shine
    const tipR = Math.max(2.6, w1 * 0.58);
    const tipGrad = ctx.createRadialGradient(x1 - tipR * 0.28, y1 - tipR * 0.28, 0.5, x1, y1, tipR * 1.1);
    tipGrad.addColorStop(0, '#FFFFFF');
    tipGrad.addColorStop(0.5, '#FFF2C8');
    tipGrad.addColorStop(1, '#F7B764');
    ctx.fillStyle = tipGrad;
    ctx.beginPath();
    ctx.arc(x1, y1, tipR, 0, TAU);
    ctx.fill();

    // Pass 5: Tiny corallite cups & swaying translucent polyps along the branch
    const polypCount = isUpper ? 3 : 2;
    for (let i = 1; i <= polypCount; i++) {
      const u = i / (polypCount + 1);
      const inv = 1 - u;
      const px = inv * inv * x0 + 2 * inv * u * cx + u * u * x1;
      const py = inv * inv * y0 + 2 * inv * u * cy + u * u * y1;

      // Tiny pitted corallite rim
      ctx.fillStyle = isUpper ? 'rgba(136, 32, 22, 0.45)' : 'rgba(72, 16, 18, 0.45)';
      ctx.beginPath();
      ctx.arc(px, py, 2.0, 0, TAU);
      ctx.fill();

      // Swaying micro-polyp tentacles
      const pPulse = 0.65 + 0.35 * Math.sin(t * 2.9 + phase + i * 1.3);
      const pr = 2.6 * pPulse;
      ctx.strokeStyle = `rgba(255, 244, 196, ${(0.55 + 0.35 * pPulse).toFixed(3)})`;
      ctx.lineWidth = 0.9;
      for (let k = 0; k < 5; k++) {
        const ka = (k / 5) * TAU + Math.sin(t * 2.4 + phase + k) * 0.28;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + Math.cos(ka) * pr, py + Math.sin(ka) * pr);
        ctx.stroke();
      }
      ctx.fillStyle = '#FFFCE0';
      ctx.beginPath();
      ctx.arc(px, py, 0.95, 0, TAU);
      ctx.fill();
    }
  }

  _drawArm(ctx, arm, t) {
    const isUpper = arm.layer === 1;
    const sway = Math.sin(t * 1.65 + arm.phase) * 0.045;
    const a = arm.angle + sway;
    const cosA = Math.cos(a);
    const sinA = Math.sin(a);
    const perpX = -sinA;
    const perpY = cosA;

    const x0 = cosA * 6;
    const y0 = sinA * 6;
    const bend = Math.sin(t * 1.5 + arm.phase) * 2.8;
    const cx = cosA * (arm.len * 0.54) + perpX * bend;
    const cy = sinA * (arm.len * 0.54) + perpY * bend;
    const x1 = cosA * arm.len + perpX * (bend * 1.25);
    const y1 = sinA * arm.len + perpY * (bend * 1.25);

    // Draw side forks first so main antler merges smoothly over their joints
    for (let i = 0; i < arm.forks.length; i++) {
      const f = arm.forks[i];
      const u = f.at;
      const inv = 1 - u;
      const fx0 = inv * inv * x0 + 2 * inv * u * cx + u * u * x1;
      const fy0 = inv * inv * y0 + 2 * inv * u * cy + u * u * y1;
      const fa = a + f.da + Math.sin(t * 1.85 + arm.phase + i) * 0.05;
      const fcx = fx0 + Math.cos(fa + f.da * 0.12) * (f.len * 0.55);
      const fcy = fy0 + Math.sin(fa + f.da * 0.12) * (f.len * 0.55);
      const fx1 = fx0 + Math.cos(fa) * f.len;
      const fy1 = fy0 + Math.sin(fa) * f.len;
      this._drawSegment(ctx, fx0, fy0, fcx, fcy, fx1, fy1, arm.baseW * 0.62, arm.baseW * 0.42, isUpper, t, arm.phase + i * 1.7);
    }

    // Draw primary antler stem
    this._drawSegment(ctx, x0, y0, cx, cy, x1, y1, arm.baseW * 0.78, arm.baseW * 0.52, isUpper, t, arm.phase);
  }

  draw(ctx) {
    const t = this.time;
    const breath = 1 + Math.sin(t * 1.9) * 0.022;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.scale(this.scale * breath, this.scale * breath);

    // 1. Ambient occlusion seabed shadow
    const aoGrad = ctx.createRadialGradient(3, 5, 10, 3, 5, 65);
    aoGrad.addColorStop(0, 'rgba(22, 10, 28, 0.48)');
    aoGrad.addColorStop(0.58, 'rgba(24, 12, 30, 0.22)');
    aoGrad.addColorStop(1, 'rgba(24, 12, 30, 0)');
    ctx.fillStyle = aoGrad;
    ctx.beginPath();
    ctx.arc(3, 5, 65, 0, TAU);
    ctx.fill();

    // 2. Warm sunlit coral-amber subsurface glow
    const glowGrad = ctx.createRadialGradient(0, 0, 12, 0, 0, 62);
    glowGrad.addColorStop(0, 'rgba(255, 148, 72, 0.22)');
    glowGrad.addColorStop(0.65, 'rgba(255, 112, 58, 0.08)');
    glowGrad.addColorStop(1, 'rgba(255, 112, 58, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 62, 0, TAU);
    ctx.fill();

    // 3. Lower darker antler branches
    for (let i = 0; i < this._arms.length; i++) {
      if (this._arms[i].layer === 0) {
        this._drawArm(ctx, this._arms[i], t);
      }
    }

    // 4. Encrusted calcified coral holdfast hub
    const hubGrad = ctx.createRadialGradient(-4, -4, 2, 0, 0, 18);
    hubGrad.addColorStop(0, '#FFA352');
    hubGrad.addColorStop(0.55, '#D84B2E');
    hubGrad.addColorStop(1, '#842420');
    ctx.fillStyle = hubGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 16.5, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.4;
    ctx.stroke();

    // 5. Upper bright coral-orange & amber antler branches
    for (let i = 0; i < this._arms.length; i++) {
      if (this._arms[i].layer === 1) {
        this._drawArm(ctx, this._arms[i], t);
      }
    }

    // 6. Central glossy crown dome capping the branching hub
    const capGrad = ctx.createRadialGradient(-3.5, -3.5, 1, 0, 0, 11.5);
    capGrad.addColorStop(0, '#FFF1C2');
    capGrad.addColorStop(0.45, '#FF9344');
    capGrad.addColorStop(1, '#CC3E2A');
    ctx.fillStyle = capGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 10.5, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Candy-gloss highlight on hub crown
    ctx.fillStyle = 'rgba(255, 255, 240, 0.80)';
    ctx.beginPath();
    ctx.ellipse(-3.4, -3.4, 3.6, 2.0, -0.7, 0, TAU);
    ctx.fill();

    ctx.restore();
  }
}

export default Staghornflora;
