// Bioluminescent Abyssal Flora — 2D Top-Down Expressive Chibi Flora Module
// Standalone ES Module (HTML5 Canvas 2D API only)

const INK = '#1E142B';
const TAU = Math.PI * 2;

export class Glowfungusflora {
  static metadata = {
    name: 'Bioluminescent Abyssal Flora',
    category: 'flora',
    baseLength: 82,
    baseWidth: 82,
  };

  constructor(x = 0, y = 0, scale = 1) {
    this.x = x;
    this.y = y;
    this.scale = scale;
    this.angle = 0;
    this.time = 0;
    this._state = 'idle';

    // Cluster of translucent indigo-and-cyan bell caps viewed from above (back to front)
    this._caps = [
      { x: -18, y: -14, r: 12.0, phase: 0.3, lobes: 9, spots: 5 },
      { x: 17, y: -15, r: 11.2, phase: 1.5, lobes: 8, spots: 5 },
      { x: -20, y: 12, r: 10.6, phase: 2.6, lobes: 8, spots: 4 },
      { x: 18, y: 13, r: 12.6, phase: 3.7, lobes: 9, spots: 5 },
      { x: 2, y: 21, r: 9.4, phase: 4.8, lobes: 7, spots: 4 },
      // Central hero bell cap
      { x: -1, y: -2, r: 17.5, phase: 0.9, lobes: 11, spots: 7 },
    ];

    // Drifting luminous cyan spore motes
    this._spores = [
      { angle: 0.5, dist: 28, r: 1.9, phase: 0.4, speed: 1.5 },
      { angle: 1.8, dist: 32, r: 1.5, phase: 1.6, speed: 1.8 },
      { angle: 3.1, dist: 29, r: 2.1, phase: 2.9, speed: 1.3 },
      { angle: 4.4, dist: 34, r: 1.6, phase: 4.1, speed: 1.7 },
      { angle: 5.5, dist: 27, r: 1.8, phase: 5.2, speed: 1.4 },
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

  _traceBellCap(ctx, cx, cy, r, lobes, seed) {
    const steps = 40;
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * TAU;
      const flute = 1 + 0.042 * Math.sin(a * lobes + seed);
      const px = cx + Math.cos(a) * r * flute;
      const py = cy + Math.sin(a) * r * flute;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  _drawCap(ctx, cap, t) {
    const pulse = 1 + Math.sin(t * 2.4 + cap.phase) * 0.055;
    const glow = 0.68 + 0.32 * Math.sin(t * 2.8 + cap.phase);
    const swayX = Math.sin(t * 1.5 + cap.phase) * 0.9;
    const swayY = Math.cos(t * 1.3 + cap.phase) * 0.8;
    const cx = cap.x + swayX;
    const cy = cap.y + swayY;
    const r = cap.r * pulse;

    // 1. Cap-level bioluminescent cyan halo
    const capHalo = ctx.createRadialGradient(cx, cy, r * 0.4, cx, cy, r * 1.65);
    capHalo.addColorStop(0, `rgba(54, 244, 255, ${(0.34 * glow).toFixed(3)})`);
    capHalo.addColorStop(0.6, `rgba(72, 138, 255, ${(0.14 * glow).toFixed(3)})`);
    capHalo.addColorStop(1, 'rgba(72, 138, 255, 0)');
    ctx.fillStyle = capHalo;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.65, 0, TAU);
    ctx.fill();

    // 2. Cap cast shadow
    ctx.fillStyle = 'rgba(12, 8, 28, 0.46)';
    ctx.beginPath();
    ctx.arc(cx + 1.8, cy + 2.4, r + 0.8, 0, TAU);
    ctx.fill();

    // 3. Translucent indigo-to-cyan bell cap body
    ctx.save();
    this._traceBellCap(ctx, cx, cy, r, cap.lobes, cap.phase);

    const bodyGrad = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.2, r * 0.1, cx, cy, r * 1.06);
    bodyGrad.addColorStop(0, '#1B1648');
    bodyGrad.addColorStop(0.45, '#2E328A');
    bodyGrad.addColorStop(0.76, '#238BD8');
    bodyGrad.addColorStop(0.94, '#5CF5FF');
    bodyGrad.addColorStop(1, '#C4FFFF');
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    ctx.clip();

    // 4. Delicate radial translucent gills visible through the bell cap
    const gillCount = cap.lobes * 2;
    ctx.strokeStyle = `rgba(128, 248, 255, ${(0.30 * glow).toFixed(3)})`;
    ctx.lineWidth = 0.95;
    for (let i = 0; i < gillCount; i++) {
      const ga = (i / gillCount) * TAU + cap.phase;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(ga) * (r * 0.24), cy + Math.sin(ga) * (r * 0.24));
      ctx.lineTo(cx + Math.cos(ga) * (r * 0.96), cy + Math.sin(ga) * (r * 0.96));
      ctx.stroke();
    }

    // 5. Pulsing bioluminescent cyan ring inside the cap
    ctx.strokeStyle = `rgba(146, 255, 255, ${(0.72 * glow).toFixed(3)})`;
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.64, 0, TAU);
    ctx.stroke();

    // 6. Glowing bioluminescent cyan spots
    for (let i = 0; i < cap.spots; i++) {
      const sa = (i / cap.spots) * TAU + cap.phase * 1.3;
      const sd = r * (0.42 + (i % 2) * 0.16);
      const sx = cx + Math.cos(sa) * sd;
      const sy = cy + Math.sin(sa) * sd;
      const sr = (cap.r > 15 ? 2.1 : 1.5) * (0.85 + 0.25 * glow);

      ctx.fillStyle = `rgba(196, 255, 255, ${(0.82 * glow).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, TAU);
      ctx.fill();
    }

    // 7. Central luminescent crown umbo + candy-gloss dome specular
    const umboGrad = ctx.createRadialGradient(cx, cy, 0.5, cx, cy, r * 0.34);
    umboGrad.addColorStop(0, `rgba(174, 255, 255, ${(0.88 * glow).toFixed(3)})`);
    umboGrad.addColorStop(0.55, 'rgba(72, 168, 255, 0.35)');
    umboGrad.addColorStop(1, 'rgba(46, 50, 138, 0)');
    ctx.fillStyle = umboGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.34, 0, TAU);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
    ctx.beginPath();
    ctx.ellipse(cx - r * 0.32, cy - r * 0.34, r * 0.24, r * 0.12, -0.7, 0, TAU);
    ctx.fill();

    ctx.restore(); // end clip

    // 8. Bold dark-plum chibi ink outline
    this._traceBellCap(ctx, cx, cy, r, cap.lobes, cap.phase);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.15;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  draw(ctx) {
    const t = this.time;
    const auraPulse = 0.72 + 0.28 * Math.sin(t * 2.2);

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Deep abyssal ambient occlusion shadow
    const aoGrad = ctx.createRadialGradient(2, 3.5, 10, 2, 3.5, 40);
    aoGrad.addColorStop(0, 'rgba(10, 6, 24, 0.54)');
    aoGrad.addColorStop(0.68, 'rgba(14, 10, 32, 0.24)');
    aoGrad.addColorStop(1, 'rgba(14, 10, 32, 0)');
    ctx.fillStyle = aoGrad;
    ctx.beginPath();
    ctx.arc(2, 3.5, 40, 0, TAU);
    ctx.fill();

    // 2. Pulsing bioluminescent cyan & indigo outer aura
    const auraGrad = ctx.createRadialGradient(0, 0, 8, 0, 0, 42);
    auraGrad.addColorStop(0, `rgba(76, 248, 255, ${(0.34 * auraPulse).toFixed(3)})`);
    auraGrad.addColorStop(0.58, `rgba(92, 98, 255, ${(0.18 * auraPulse).toFixed(3)})`);
    auraGrad.addColorStop(1, 'rgba(92, 98, 255, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 42, 0, TAU);
    ctx.fill();

    // 3. Faint glowing mycelial filaments connecting the caps
    ctx.strokeStyle = `rgba(112, 246, 255, ${(0.38 * auraPulse).toFixed(3)})`;
    ctx.lineWidth = 1.4;
    for (let i = 0; i < this._caps.length - 1; i++) {
      const c = this._caps[i];
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(c.x, c.y);
      ctx.stroke();
    }

    // 4. Draw all 6 translucent bell caps
    for (let i = 0; i < this._caps.length; i++) {
      this._drawCap(ctx, this._caps[i], t);
    }

    // 5. Floating luminous cyan spore motes
    for (let i = 0; i < this._spores.length; i++) {
      const s = this._spores[i];
      const sa = s.angle + Math.sin(t * s.speed + s.phase) * 0.22;
      const sd = s.dist + Math.sin(t * (s.speed * 1.4) + s.phase) * 3.0;
      const sx = Math.cos(sa) * sd;
      const sy = Math.sin(sa) * sd;
      const alpha = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * 3.2 + s.phase));

      const sg = ctx.createRadialGradient(sx, sy, 0.3, sx, sy, s.r * 2.6);
      sg.addColorStop(0, `rgba(218, 255, 255, ${alpha.toFixed(3)})`);
      sg.addColorStop(1, 'rgba(54, 244, 255, 0)');
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.arc(sx, sy, s.r * 2.6, 0, TAU);
      ctx.fill();

      ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(sx, sy, s.r * 0.65, 0, TAU);
      ctx.fill();
    }

    ctx.restore();
  }
}

export default Glowfungusflora;
