/**
 * Villain Neon Tetra — Standalone 2D Top-Down Expressive Chibi Villain ES Module
 * Concept: Stealth jet-black chibi torpedo, crackling electric-crimson neon stripe,
 * jagged glowing red tail half.
 */

const OUTLINE = '#140B1C';
const ONE_SHOTS = new Set(['left_turn', 'right_turn', 'eating', 'shock']);
const LOCK_IGNORED = new Set(['left_turn', 'right_turn', 'relax', 'happy', 'eating']);
const ALIASES = { idle: 'breathing', hunger: 'hungry' };
const DURATIONS = { left_turn: 0.46, right_turn: 0.46, eating: 0.52, shock: 0.66 };

const POSES = {
  breathing:  { hz: 4.2, amp: 0.22, fin: 0.45, bend: 0.0,  mouth: 0.10, brow: 0.54, eye: 1.0,  aura: 0.52, jit: 0.0 },
  swimming:   { hz: 10.5, amp: 0.42, fin: 0.24, bend: 0.0, mouth: 0.16, brow: 0.68, eye: 1.0,  aura: 0.78, jit: 0.0 },
  relax:      { hz: 2.1, amp: 0.12, fin: 0.66, bend: 0.0,  mouth: 0.05, brow: 0.26, eye: 0.48, aura: 0.36, jit: 0.0 },
  left_turn:  { hz: 8.6, amp: 0.32, fin: 0.58, bend: -0.62, mouth: 0.14, brow: 0.58, eye: 1.0,  aura: 0.68, jit: 0.0 },
  right_turn: { hz: 8.6, amp: 0.32, fin: 0.58, bend: 0.62,  mouth: 0.14, brow: 0.58, eye: 1.0,  aura: 0.68, jit: 0.0 },
  eating:     { hz: 10.8, amp: 0.30, fin: 0.62, bend: 0.0, mouth: 1.0,  brow: 0.86, eye: 1.06, aura: 0.92, jit: 0.14 },
  hungry:     { hz: 7.2, amp: 0.26, fin: 0.52, bend: 0.0,  mouth: 0.70, brow: 0.88, eye: 1.12, aura: 0.94, jit: 0.10 },
  stress:     { hz: 11.4, amp: 0.16, fin: 0.36, bend: 0.0, mouth: 0.32, brow: 0.94, eye: 0.28, aura: 0.84, jit: 1.00 },
  fear:       { hz: 12.6, amp: 0.24, fin: 0.78, bend: 0.0, mouth: 0.52, brow: -0.45, eye: 1.34, aura: 0.22, jit: 1.24 },
  shock:      { hz: 2.4, amp: 0.06, fin: 0.88, bend: 0.0,  mouth: 0.80, brow: -0.58, eye: 1.46, aura: 0.20, jit: 1.45 },
  happy:      { hz: 7.4, amp: 0.34, fin: 0.72, bend: 0.0,  mouth: 0.58, brow: 0.38, eye: 0.72, aura: 0.98, jit: 0.0 },
  sad:        { hz: 1.6, amp: 0.08, fin: 0.18, bend: 0.0,  mouth: 0.04, brow: -0.34, eye: 0.66, aura: 0.20, jit: 0.0 },
};

function cubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export class VillainNeontetrafish {
  static metadata = {
    name: 'Villain Neon Tetra',
    category: 'villain_fish',
    baseLength: 45,
    baseWidth: 18,
  };

  constructor(x = 0, y = 0, scale = 1) {
    this.x = x;
    this.y = y;
    this.scale = scale;
    this.angle = 0;

    this._state = 'breathing';
    this._prev = 'breathing';
    this._stateT = 0;
    this._t = 0;
    this._phase = 0;

    this._blendDur = 0.15;
    this._blendT = 0.15;
    this._from = { ...POSES.breathing };
    this._to = { ...POSES.breathing };
    this._cur = { ...POSES.breathing };
    this._cbs = new Map();
  }

  getState() {
    return this._state;
  }

  setAngle(radians) {
    if (Number.isFinite(radians)) this.angle = radians;
  }

  setDirection(dx, dy) {
    if ((dx !== 0 || dy !== 0) && Number.isFinite(dx) && Number.isFinite(dy)) {
      this.angle = Math.atan2(dy, dx);
    }
  }

  onFinished(name, callback) {
    if (typeof callback !== 'function') return;
    const k = ALIASES[name] || name;
    if (!this._cbs.has(k)) this._cbs.set(k, []);
    this._cbs.get(k).push(callback);
  }

  play(name) {
    const next = ALIASES[name] || name;
    if (!POSES[next]) return;
    if ((this._state === 'shock' || this._state === 'fear') && LOCK_IGNORED.has(next)) return;
    if (next === this._state && !ONE_SHOTS.has(next)) return;

    if (ONE_SHOTS.has(next) && !ONE_SHOTS.has(this._state)) {
      this._prev = this._state;
    }
    this._state = next;
    this._stateT = 0;
    this._from = { ...this._cur };
    this._to = { ...POSES[next] };
    this._blendT = 0;
  }

  update(dt) {
    const d = Number.isFinite(dt) && dt > 0 ? dt : 0;
    this._t += d;
    this._stateT += d;

    if (this._blendT < this._blendDur) {
      this._blendT = Math.min(this._blendDur, this._blendT + d);
      const u = cubic(this._blendT / this._blendDur);
      for (const k of Object.keys(this._cur)) {
        this._cur[k] = this._from[k] + (this._to[k] - this._from[k]) * u;
      }
    } else {
      for (const k of Object.keys(this._cur)) {
        this._cur[k] = this._to[k];
      }
    }

    this._phase += d * this._cur.hz;

    if (ONE_SHOTS.has(this._state) && this._stateT >= DURATIONS[this._state]) {
      const done = this._state;
      const back = POSES[this._prev] && !ONE_SHOTS.has(this._prev) ? this._prev : 'breathing';
      this._state = back;
      this._stateT = 0;
      this._from = { ...this._cur };
      this._to = { ...POSES[back] };
      this._blendT = 0;

      const list = this._cbs.get(done);
      if (list) for (const fn of list) fn(done);
    }
  }

  draw(ctx) {
    const p = this._cur;
    const t = this._t;
    const halfL = VillainNeontetrafish.metadata.baseLength * 0.5;
    const halfW = VillainNeontetrafish.metadata.baseWidth * 0.5;

    const wag = Math.sin(this._phase) * p.amp + p.bend * 0.65;
    const sway = Math.sin(this._phase - 0.7) * p.amp * 0.25 + p.bend * 0.30;
    const jx = p.jit > 0 ? Math.sin(t * 64) * p.jit * 0.85 : 0;
    const jy = p.jit > 0 ? Math.cos(t * 70) * p.jit * 0.95 : 0;

    ctx.save();
    ctx.translate(this.x + jx, this.y + jy);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Stealth-black & electric-crimson neon aura
    this._drawNeonAura(ctx, halfL, halfW, p.aura, t);

    // 2. Razor stealth pectoral fins
    this._drawTetraPectoral(ctx, 5, -halfW * 0.64, -1, p.fin);
    this._drawTetraPectoral(ctx, 5, halfW * 0.64, 1, p.fin);

    // 3. Jagged glowing red forked tail
    this._drawGlowingTail(ctx, -halfL * 0.60, sway * 5, wag, t);

    // 4. Stealth jet-black chibi torpedo with crackling electric-crimson stripe & glowing red tail half
    this._drawStealthBody(ctx, halfL, halfW, sway, t);

    // 5. Tiny stealth dorsal fin
    this._drawStealthDorsal(ctx, sway, wag);

    // 6. Snapping nano-fangs
    this._drawTetraMouth(ctx, halfL, p.mouth, t);

    // 7. Blazing crimson neon eyes
    this._drawTetraEyes(ctx, halfL, halfW, p, t);

    // 8. Mood FX
    this._drawMoodFX(ctx, halfL, halfW, t);

    ctx.restore();
  }

  _drawNeonAura(ctx, halfL, halfW, aura, t) {
    const r = halfL * (1.16 + Math.sin(t * 3.4) * 0.05);
    const g = ctx.createRadialGradient(-2, 0, 2, -2, 0, r);
    g.addColorStop(0, `rgba(18, 6, 26, ${0.44 * aura})`);
    g.addColorStop(0.55, `rgba(255, 22, 68, ${0.26 * aura})`);
    g.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(-2, 0, r, halfW * 1.65, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawTetraPectoral(ctx, ox, oy, side, fin) {
    ctx.save();
    ctx.translate(ox, oy);
    const flut = Math.sin(this._phase * 1.1 + side) * 0.18;
    ctx.rotate(side * (0.28 + fin * 0.52 + flut));

    ctx.fillStyle = '#1E132A';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(3, 0);
    ctx.lineTo(-2, side * 9.5);
    ctx.lineTo(-4.5, side * 6.5);
    ctx.lineTo(-7.5, side * 8);
    ctx.lineTo(-5, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#FF204E';
    ctx.lineWidth = 0.85;
    ctx.beginPath();
    ctx.moveTo(1, side * 2);
    ctx.lineTo(-2, side * 8.5);
    ctx.stroke();
    ctx.restore();
  }

  _drawGlowingTail(ctx, tx, ty, wag, t) {
    ctx.save();
    ctx.translate(tx, ty * 0.4);
    ctx.rotate(wag * 0.95);

    const g = ctx.createLinearGradient(0, 0, -13, 0);
    g.addColorStop(0, '#FF1E44');
    g.addColorStop(0.65, '#FF4D6D');
    g.addColorStop(1, '#1A0B22');

    ctx.fillStyle = g;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.7;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(2, -3.0);
    ctx.lineTo(-12, -9.5);
    ctx.lineTo(-8.5, -3.5);
    ctx.lineTo(-11, 0);
    ctx.lineTo(-8.5, 3.5);
    ctx.lineTo(-12, 9.5);
    ctx.lineTo(2, 3.0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = `rgba(255, 220, 225, ${0.6 + Math.sin(t * 9) * 0.3})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-1, -1.5);
    ctx.lineTo(-9, -7);
    ctx.moveTo(-1, 1.5);
    ctx.lineTo(-9, 7);
    ctx.stroke();
    ctx.restore();
  }

  _drawStealthBody(ctx, halfL, halfW, sway, t) {
    const sy = sway * 3.2;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(halfL * 0.94, 0);
    ctx.bezierCurveTo(halfL * 0.80, -halfW * 0.88, halfL * 0.14, -halfW * 0.92, -halfL * 0.24, -halfW * 0.56 + sy * 0.45);
    ctx.quadraticCurveTo(-halfL * 0.50, -halfW * 0.32 + sy, -halfL * 0.64, -halfW * 0.20 + sy);
    ctx.lineTo(-halfL * 0.64, halfW * 0.20 + sy);
    ctx.quadraticCurveTo(-halfL * 0.50, halfW * 0.32 + sy, -halfL * 0.24, halfW * 0.56 + sy * 0.45);
    ctx.bezierCurveTo(halfL * 0.14, halfW * 0.92, halfL * 0.80, halfW * 0.88, halfL * 0.94, 0);
    ctx.closePath();

    // Stealth jet-black torpedo base
    const bg = ctx.createLinearGradient(halfL, -halfW, -halfL * 0.6, halfW);
    bg.addColorStop(0, '#261C34');
    bg.addColorStop(0.55, '#150F20');
    bg.addColorStop(1, '#0E0816');
    ctx.fillStyle = bg;
    ctx.fill();

    ctx.save();
    ctx.clip();

    // Jagged glowing red rear tail half (signature Neon Tetra corruption)
    const rg = ctx.createLinearGradient(0, 0, -halfL * 0.65, 0);
    rg.addColorStop(0, '#D91438');
    rg.addColorStop(1, '#FF2E54');
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.moveTo(-1, -halfW * 1.1);
    ctx.lineTo(2, -3);
    ctx.lineTo(-3, 0);
    ctx.lineTo(2, 3);
    ctx.lineTo(-1, halfW * 1.1);
    ctx.lineTo(-halfL, halfW * 1.1);
    ctx.lineTo(-halfL, -halfW * 1.1);
    ctx.closePath();
    ctx.fill();

    // Crackling electric-crimson neon lightning stripe along both flanks
    const pulse = 0.78 + Math.sin(t * 10) * 0.22;
    for (const side of [-1, 1]) {
      ctx.strokeStyle = `rgba(255, 36, 82, ${pulse})`;
      ctx.lineWidth = 2.1;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(15, side * 3.5);
      ctx.lineTo(8, side * 5.2 + Math.sin(t * 14 + side) * 0.7);
      ctx.lineTo(2, side * 3.4);
      ctx.lineTo(-5, side * 4.8 - Math.cos(t * 14) * 0.7);
      ctx.lineTo(-13, side * 2.2 + sy * 0.6);
      ctx.stroke();

      // White-hot neon core
      ctx.strokeStyle = `rgba(255, 225, 232, ${pulse * 0.85})`;
      ctx.lineWidth = 0.75;
      ctx.stroke();
    }

    // Glossy stealth sheen
    ctx.fillStyle = 'rgba(220, 210, 255, 0.22)';
    ctx.beginPath();
    ctx.ellipse(7, -halfW * 0.34, 8, 2.0, -0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.9;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  _drawStealthDorsal(ctx, sway, wag) {
    ctx.save();
    ctx.fillStyle = '#FF204E';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(4, 0);
    ctx.lineTo(-3, -2.0 + sway * 1.5);
    ctx.lineTo(-11, wag * 3.5);
    ctx.lineTo(-3, 2.0 + sway * 1.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  _drawTetraMouth(ctx, halfL, mouth, t) {
    const mx = halfL * 0.88;
    const snap = this._state === 'eating' || this._state === 'hungry'
      ? Math.abs(Math.sin(t * 15)) * 0.45 + mouth * 0.55
      : mouth;

    if (snap > 0.2 || this._state === 'happy') {
      const w = 1.7 + snap * 2.4;
      ctx.save();
      ctx.fillStyle = '#240515';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.ellipse(mx + 0.7, 0, 1.4 + snap * 1.6, w, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      for (const fy of [-w * 0.5, w * 0.5]) {
        ctx.beginPath();
        ctx.moveTo(mx + 0.3, fy - 0.7);
        ctx.lineTo(mx + 2.7 + snap * 0.7, fy);
        ctx.lineTo(mx + 0.3, fy + 0.7);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
  }

  _drawTetraEyes(ctx, halfL, halfW, p, t) {
    const ex = halfL * 0.56;
    const ey = halfW * 0.46;

    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(ex, side * ey);

      if (this._state === 'stress') {
        ctx.strokeStyle = '#FF2A58';
        ctx.lineWidth = 1.8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-1.8, -side * 1.8);
        ctx.lineTo(1.6, 0);
        ctx.lineTo(-1.8, side * 1.8);
        ctx.stroke();
        ctx.restore();
        continue;
      }

      const rx = 3.1 * (this._state === 'shock' ? 1.24 : 1.0);
      const ry = 2.8 * Math.max(0.45, Math.min(1.36, p.eye));

      ctx.fillStyle = OUTLINE;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx + 0.9, ry + 0.8, side * 0.14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFF0F4';
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, side * 0.14, 0, Math.PI * 2);
      ctx.fill();

      const ir = this._state === 'shock' ? 1.0 : 1.9;
      ctx.fillStyle = '#FF1E48';
      ctx.beginPath();
      ctx.arc(0.5, side * 0.2, ir, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = OUTLINE;
      ctx.beginPath();
      ctx.ellipse(0.65, side * 0.2, 0.7, ir * 0.75, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(1.2, side * 0.2 - 0.75, 0.75, 0, Math.PI * 2);
      ctx.arc(-0.3, side * 0.2 + 0.65, 0.4, 0, Math.PI * 2);
      ctx.fill();

      if (this._state === 'relax' || this._state === 'happy') {
        ctx.fillStyle = '#1D122C';
        ctx.beginPath();
        ctx.ellipse(-0.6, 0, rx + 0.3, ry * 0.56, side * 0.14, Math.PI * 0.5, Math.PI * 1.5);
        ctx.fill();
      }

      const tilt = p.brow * 0.55;
      ctx.strokeStyle = '#FF3860';
      ctx.lineWidth = 1.7;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-3.0, -side * (2.0 - tilt * 1.8));
      ctx.lineTo(3.4, -side * (1.0 + tilt * 2.0));
      ctx.stroke();

      if (this._state === 'hungry' || this._state === 'eating') {
        ctx.strokeStyle = `rgba(255, 70, 100, ${0.7 + Math.sin(t * 15) * 0.3})`;
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(0.6, -3.5);
        ctx.lineTo(0.6, 3.5);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  _drawMoodFX(ctx, halfL, halfW, t) {
    if (this._state === 'happy') {
      for (let i = 0; i < 4; i++) {
        const a = t * 2.6 + i * 1.57;
        const sx = 2 + Math.cos(a) * (halfL * 0.75);
        const sy = Math.sin(a) * (halfW * 1.35);
        const r = 2.1 + Math.sin(t * 8 + i) * 0.6;
        ctx.fillStyle = i % 2 === 0 ? '#FF2050' : '#B833FF';
        ctx.beginPath();
        ctx.moveTo(sx, sy - r);
        ctx.quadraticCurveTo(sx, sy, sx + r, sy);
        ctx.quadraticCurveTo(sx, sy, sx, sy + r);
        ctx.quadraticCurveTo(sx, sy, sx - r, sy);
        ctx.quadraticCurveTo(sx, sy, sx, sy - r);
        ctx.fill();
      }
    } else if (this._state === 'shock') {
      ctx.save();
      ctx.translate(halfL * 0.65, -halfW * 1.25);
      ctx.fillStyle = '#FF2050';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(-1.5, -7.8, 3.0, 5.6, 1.0);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 1.0, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (this._state === 'fear') {
      for (let i = 0; i < 2; i++) {
        const d = (t * 26 + i * 5) % 8;
        const x = 8 - i * 5.5;
        const y = -halfW * 1.05 - d * 0.5;
        ctx.fillStyle = '#7CE8FF';
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 0.95;
        ctx.beginPath();
        ctx.moveTo(x, y - 2.6);
        ctx.quadraticCurveTo(x + 2.0, y + 0.8, x, y + 2.2);
        ctx.quadraticCurveTo(x - 2.0, y + 0.8, x, y - 2.6);
        ctx.fill();
        ctx.stroke();
      }
    } else if (this._state === 'stress') {
      const s = 1 + Math.sin(t * 20) * 0.18;
      ctx.save();
      ctx.translate(7, -halfW * 1.05);
      ctx.scale(s, s);
      ctx.strokeStyle = '#FF2455';
      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round';
      for (let q = 0; q < 4; q++) {
        ctx.rotate(Math.PI * 0.5);
        ctx.beginPath();
        ctx.moveTo(1.2, 1.2);
        ctx.quadraticCurveTo(1.4, 3.2, 3.8, 3.5);
        ctx.stroke();
      }
      ctx.restore();
    } else if (this._state === 'sad') {
      const dy = (t * 14) % 6;
      ctx.fillStyle = '#72D6FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(halfL * 0.5, halfW * 0.85 + dy * 0.5);
      ctx.quadraticCurveTo(halfL * 0.5 + 1.8, halfW * 0.85 + 3.0 + dy * 0.5, halfL * 0.5, halfW * 0.85 + 4.2 + dy * 0.5);
      ctx.quadraticCurveTo(halfL * 0.5 - 1.8, halfW * 0.85 + 3.0 + dy * 0.5, halfL * 0.5, halfW * 0.85 + dy * 0.5);
      ctx.fill();
      ctx.stroke();
    }
  }
}

export default VillainNeontetrafish;
