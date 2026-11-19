/**
 * Villain Turquoise Discus — Standalone 2D Top-Down Expressive Chibi Villain ES Module
 * Concept: Dark magma-maroon ultra-round disc, crackling neon-cyan/violet lightning
 * striations, glowing crimson irises.
 */

const OUTLINE = '#140B1C';
const ONE_SHOTS = new Set(['left_turn', 'right_turn', 'eating', 'shock']);
const LOCK_IGNORED = new Set(['left_turn', 'right_turn', 'relax', 'happy', 'eating']);
const ALIASES = { idle: 'breathing', hunger: 'hungry' };
const DURATIONS = { left_turn: 0.58, right_turn: 0.58, eating: 0.64, shock: 0.74 };

const POSES = {
  breathing:  { hz: 2.6, amp: 0.16, fin: 0.46, bend: 0.0,  mouth: 0.10, brow: 0.54, eye: 1.0,  aura: 0.55, jit: 0.0 },
  swimming:   { hz: 6.2, amp: 0.32, fin: 0.28, bend: 0.0,  mouth: 0.16, brow: 0.66, eye: 1.0,  aura: 0.76, jit: 0.0 },
  relax:      { hz: 1.5, amp: 0.10, fin: 0.68, bend: 0.0,  mouth: 0.06, brow: 0.28, eye: 0.46, aura: 0.40, jit: 0.0 },
  left_turn:  { hz: 5.6, amp: 0.28, fin: 0.60, bend: -0.56, mouth: 0.14, brow: 0.58, eye: 1.0,  aura: 0.68, jit: 0.0 },
  right_turn: { hz: 5.6, amp: 0.28, fin: 0.60, bend: 0.56,  mouth: 0.14, brow: 0.58, eye: 1.0,  aura: 0.68, jit: 0.0 },
  eating:     { hz: 7.6, amp: 0.26, fin: 0.64, bend: 0.0,  mouth: 1.0,  brow: 0.86, eye: 1.06, aura: 0.92, jit: 0.16 },
  hungry:     { hz: 5.0, amp: 0.24, fin: 0.52, bend: 0.0,  mouth: 0.72, brow: 0.88, eye: 1.12, aura: 0.95, jit: 0.12 },
  stress:     { hz: 8.8, amp: 0.15, fin: 0.36, bend: 0.0,  mouth: 0.32, brow: 0.94, eye: 0.28, aura: 0.85, jit: 1.18 },
  fear:       { hz: 10.0, amp: 0.22, fin: 0.78, bend: 0.0, mouth: 0.54, brow: -0.46, eye: 1.35, aura: 0.24, jit: 1.40 },
  shock:      { hz: 1.7, amp: 0.06, fin: 0.88, bend: 0.0,  mouth: 0.82, brow: -0.58, eye: 1.46, aura: 0.22, jit: 1.62 },
  happy:      { hz: 5.0, amp: 0.30, fin: 0.72, bend: 0.0,  mouth: 0.58, brow: 0.38, eye: 0.72, aura: 1.0,  jit: 0.0 },
  sad:        { hz: 1.2, amp: 0.08, fin: 0.18, bend: 0.0,  mouth: 0.04, brow: -0.34, eye: 0.66, aura: 0.22, jit: 0.0 },
};

function cubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export class VillainDiscusfish {
  static metadata = {
    name: 'Villain Turquoise Discus',
    category: 'villain_fish',
    baseLength: 95,
    baseWidth: 62,
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
    const halfL = VillainDiscusfish.metadata.baseLength * 0.5;
    const halfW = VillainDiscusfish.metadata.baseWidth * 0.5;

    const wag = Math.sin(this._phase) * p.amp + p.bend * 0.62;
    const sway = Math.sin(this._phase - 0.7) * p.amp * 0.22 + p.bend * 0.25;
    const jx = p.jit > 0 ? Math.sin(t * 58) * p.jit * 1.15 : 0;
    const jy = p.jit > 0 ? Math.cos(t * 64) * p.jit * 1.3 : 0;

    ctx.save();
    ctx.translate(this.x + jx, this.y + jy);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Electric neon-cyan & abyssal-violet crackling aura
    this._drawElectricAura(ctx, halfL, halfW, p.aura, t);

    // 2. Frilled neon-rimmed disc perimeter fins
    this._drawDiscPectorals(ctx, 8, -halfW * 0.78, -1, p.fin, t);
    this._drawDiscPectorals(ctx, 8, halfW * 0.78, 1, p.fin, t);

    // 3. Compact jagged electric tail
    this._drawDiscTail(ctx, -halfL * 0.56, sway * 7, wag, t);

    // 4. Ultra-round dark magma-maroon disc body with crackling cyan/violet lightning striations
    this._drawMagmaDiscBody(ctx, halfL, halfW, sway, t);

    // 5. Electric dorsal ridge
    this._drawElectricRidge(ctx, sway, wag, t);

    // 6. Snapping villain mouth
    this._drawDiscMouth(ctx, halfL, p.mouth, t);

    // 7. Glowing crimson irises with V-brows
    this._drawDiscEyes(ctx, halfL, halfW, p, t);

    // 8. Mood FX
    this._drawMoodFX(ctx, halfL, halfW, t);

    ctx.restore();
  }

  _drawElectricAura(ctx, halfL, halfW, aura, t) {
    const r = halfL * (1.06 + Math.sin(t * 2.6) * 0.04);
    const g = ctx.createRadialGradient(-2, 0, 6, -2, 0, r);
    g.addColorStop(0, `rgba(26, 8, 32, ${0.46 * aura})`);
    g.addColorStop(0.55, `rgba(18, 224, 255, ${0.20 * aura})`);
    g.addColorStop(0.82, `rgba(155, 42, 255, ${0.15 * aura})`);
    g.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(-2, 0, r, halfW * 1.18, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawDiscPectorals(ctx, ox, oy, side, fin, t) {
    ctx.save();
    ctx.translate(ox, oy);
    const flut = Math.sin(this._phase * 0.9 + side) * 0.16;
    ctx.rotate(side * (0.22 + fin * 0.45 + flut));

    const g = ctx.createLinearGradient(0, 0, -10, side * 16);
    g.addColorStop(0, '#5A102A');
    g.addColorStop(0.65, '#2A0D3A');
    g.addColorStop(1, '#14E6FF');

    ctx.fillStyle = g;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.0;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(5, 0);
    ctx.quadraticCurveTo(4, side * 12, -4, side * 16);
    ctx.lineTo(-6, side * 11);
    ctx.lineTo(-11, side * 13.5);
    ctx.quadraticCurveTo(-13, side * 6, -7, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = `rgba(34, 240, 255, ${0.6 + Math.sin(t * 7 + side) * 0.25})`;
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(1, side * 3);
    ctx.lineTo(-4, side * 13);
    ctx.stroke();
    ctx.restore();
  }

  _drawDiscTail(ctx, tx, ty, wag, t) {
    ctx.save();
    ctx.translate(tx, ty * 0.38);
    ctx.rotate(wag * 0.9);

    const g = ctx.createLinearGradient(0, 0, -21, 0);
    g.addColorStop(0, '#4E0E24');
    g.addColorStop(0.55, '#260C38');
    g.addColorStop(1, '#14E6FF');

    ctx.fillStyle = g;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.1;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(2, -5.5);
    ctx.lineTo(-18, -14.5);
    ctx.lineTo(-13.5, -6);
    ctx.lineTo(-20, 0);
    ctx.lineTo(-13.5, 6);
    ctx.lineTo(-18, 14.5);
    ctx.lineTo(2, 5.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = `rgba(38, 245, 255, ${0.65 + Math.sin(t * 8) * 0.25})`;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(-2, -2.5);
    ctx.lineTo(-14, -10);
    ctx.moveTo(-2, 2.5);
    ctx.lineTo(-14, 10);
    ctx.stroke();
    ctx.restore();
  }

  _drawMagmaDiscBody(ctx, halfL, halfW, sway, t) {
    const sy = sway * 5.0;
    ctx.save();
    // Ultra-round disc silhouette (chibi discus)
    ctx.beginPath();
    ctx.moveTo(halfL * 0.80, 0);
    ctx.bezierCurveTo(halfL * 0.72, -halfW * 0.96, -halfL * 0.16, -halfW * 1.02, -halfL * 0.44, -halfW * 0.56 + sy * 0.45);
    ctx.quadraticCurveTo(-halfL * 0.54, -halfW * 0.30 + sy, -halfL * 0.60, -halfW * 0.18 + sy);
    ctx.lineTo(-halfL * 0.60, halfW * 0.18 + sy);
    ctx.quadraticCurveTo(-halfL * 0.54, halfW * 0.30 + sy, -halfL * 0.44, halfW * 0.56 + sy * 0.45);
    ctx.bezierCurveTo(-halfL * 0.16, halfW * 1.02, halfL * 0.72, halfW * 0.96, halfL * 0.80, 0);
    ctx.closePath();

    // Dark magma-maroon radial disc fill
    const dg = ctx.createRadialGradient(8, -6, 6, 0, 0, halfL * 0.88);
    dg.addColorStop(0, '#8A1732');
    dg.addColorStop(0.55, '#4A0C24');
    dg.addColorStop(1, '#1A081E');
    ctx.fillStyle = dg;
    ctx.fill();

    ctx.save();
    ctx.clip();

    // Subtle dark vertical discus stress bars
    ctx.fillStyle = 'rgba(14, 4, 22, 0.36)';
    for (const bx of [16, 4, -8, -20]) {
      ctx.fillRect(bx - 2.2, -halfW, 4.4, halfW * 2);
    }

    // Crackling neon-cyan & violet lightning striations flowing across the round disc
    const crackle = 0.72 + Math.sin(t * 7.5) * 0.28;
    const boltYs = [-19, -11, -4, 4, 11, 19];
    for (let i = 0; i < boltYs.length; i++) {
      const y0 = boltYs[i];
      ctx.strokeStyle = i % 2 === 0
        ? `rgba(28, 245, 255, ${crackle})`
        : `rgba(182, 78, 255, ${crackle})`;
      ctx.lineWidth = i % 2 === 0 ? 1.8 : 1.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(28, y0 * 0.55);
      ctx.lineTo(15, y0 * 0.88 + Math.sin(t * 9 + i) * 1.4);
      ctx.lineTo(4, y0 * 0.72 - Math.cos(t * 8 + i) * 1.4);
      ctx.lineTo(-8, y0 * 0.92 + Math.sin(t * 10 + i) * 1.2);
      ctx.lineTo(-22, y0 * 0.60);
      ctx.stroke();
    }

    // Cel-shaded lower rim
    ctx.fillStyle = 'rgba(18, 6, 26, 0.32)';
    ctx.beginPath();
    ctx.ellipse(2, halfW * 0.72, halfL * 0.78, halfW * 0.36, 0, 0, Math.PI * 2);
    ctx.fill();

    // Glossy dome highlight
    ctx.fillStyle = 'rgba(195, 245, 255, 0.26)';
    ctx.beginPath();
    ctx.ellipse(8, -halfW * 0.44, 16, 5.0, -0.12, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  _drawElectricRidge(ctx, sway, wag, t) {
    ctx.save();
    ctx.fillStyle = '#240B34';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(2, -3.2 + sway * 1.5);
    ctx.lineTo(-10, -2.8 + sway * 3);
    ctx.lineTo(-24, wag * 5);
    ctx.lineTo(-10, 2.8 + sway * 3);
    ctx.lineTo(2, 3.2 + sway * 1.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = `rgba(38, 248, 255, ${0.7 + Math.sin(t * 8) * 0.25})`;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-22, wag * 4.5);
    ctx.stroke();
    ctx.restore();
  }

  _drawDiscMouth(ctx, halfL, mouth, t) {
    const mx = halfL * 0.76;
    const snap = this._state === 'eating' || this._state === 'hungry'
      ? Math.abs(Math.sin(t * 14)) * 0.45 + mouth * 0.55
      : mouth;

    if (snap > 0.2 || this._state === 'happy') {
      const w = 2.8 + snap * 4.0;
      ctx.save();
      ctx.fillStyle = '#20061B';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(mx + 1.2, 0, 2.0 + snap * 2.5, w, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#E8FFFF';
      for (const fy of [-w * 0.52, 0, w * 0.52]) {
        ctx.beginPath();
        ctx.moveTo(mx + 0.6, fy - 1.1);
        ctx.lineTo(mx + 4.2 + snap, fy);
        ctx.lineTo(mx + 0.6, fy + 1.1);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
  }

  _drawDiscEyes(ctx, halfL, halfW, p, t) {
    const ex = halfL * 0.46;
    const ey = halfW * 0.42;

    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(ex, side * ey);

      if (this._state === 'stress') {
        ctx.strokeStyle = '#24F4FF';
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-2.6, -side * 2.6);
        ctx.lineTo(2.4, 0);
        ctx.lineTo(-2.6, side * 2.6);
        ctx.stroke();
        ctx.restore();
        continue;
      }

      const rx = 4.6 * (this._state === 'shock' ? 1.24 : 1.0);
      const ry = 4.1 * Math.max(0.45, Math.min(1.36, p.eye));

      ctx.fillStyle = OUTLINE;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx + 1.3, ry + 1.2, side * 0.14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFF0F4';
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, side * 0.14, 0, Math.PI * 2);
      ctx.fill();

      // Glowing crimson iris
      const ir = this._state === 'shock' ? 1.5 : 2.9;
      const rg = ctx.createRadialGradient(0.5, 0, 0.3, 0.5, 0, ir);
      rg.addColorStop(0, '#FF8EA8');
      rg.addColorStop(0.5, '#FF123E');
      rg.addColorStop(1, '#5A0418');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(0.7, side * 0.25, ir, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = OUTLINE;
      ctx.beginPath();
      ctx.ellipse(0.9, side * 0.25, 0.95, ir * 0.78, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(1.7, side * 0.25 - 1.1, 1.05, 0, Math.PI * 2);
      ctx.arc(-0.4, side * 0.25 + 1.0, 0.55, 0, Math.PI * 2);
      ctx.fill();

      if (this._state === 'relax' || this._state === 'happy') {
        ctx.fillStyle = '#380922';
        ctx.beginPath();
        ctx.ellipse(-0.9, 0, rx + 0.4, ry * 0.56, side * 0.14, Math.PI * 0.5, Math.PI * 1.5);
        ctx.fill();
      }

      const tilt = p.brow * 0.55;
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-4.6, -side * (2.8 - tilt * 2.5));
      ctx.lineTo(5.0, -side * (1.5 + tilt * 2.6));
      ctx.stroke();

      if (this._state === 'hungry' || this._state === 'eating') {
        ctx.strokeStyle = `rgba(38, 248, 255, ${0.65 + Math.sin(t * 14) * 0.3})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0.8, -5.0);
        ctx.lineTo(0.8, 5.0);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  _drawMoodFX(ctx, halfL, halfW, t) {
    if (this._state === 'happy') {
      for (let i = 0; i < 4; i++) {
        const a = t * 2.2 + i * 1.57;
        const sx = 4 + Math.cos(a) * (halfL * 0.68);
        const sy = Math.sin(a) * (halfW * 0.92);
        const r = 3.0 + Math.sin(t * 7 + i) * 1.0;
        ctx.fillStyle = i % 2 === 0 ? '#1EE8FF' : '#D91C5C';
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
      ctx.translate(halfL * 0.56, -halfW * 0.85);
      ctx.fillStyle = '#FF204E';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.roundRect(-2.1, -10.5, 4.2, 8.0, 1.5);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 1.5, 2.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (this._state === 'fear') {
      for (let i = 0; i < 2; i++) {
        const d = (t * 25 + i * 6) % 10;
        const x = 16 - i * 9;
        const y = -halfW * 0.78 - d * 0.55;
        ctx.fillStyle = '#7CE8FF';
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x, y - 3.6);
        ctx.quadraticCurveTo(x + 2.8, y + 1, x, y + 3.2);
        ctx.quadraticCurveTo(x - 2.8, y + 1, x, y - 3.6);
        ctx.fill();
        ctx.stroke();
      }
    } else if (this._state === 'stress') {
      const s = 1 + Math.sin(t * 20) * 0.18;
      ctx.save();
      ctx.translate(14, -halfW * 0.76);
      ctx.scale(s, s);
      ctx.strokeStyle = '#FF244C';
      ctx.lineWidth = 2.1;
      ctx.lineCap = 'round';
      for (let q = 0; q < 4; q++) {
        ctx.rotate(Math.PI * 0.5);
        ctx.beginPath();
        ctx.moveTo(1.8, 1.8);
        ctx.quadraticCurveTo(2.0, 4.6, 5.4, 4.9);
        ctx.stroke();
      }
      ctx.restore();
    } else if (this._state === 'sad') {
      const dy = (t * 14) % 7;
      ctx.fillStyle = '#72D6FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(halfL * 0.44, halfW * 0.64 + dy * 0.5);
      ctx.quadraticCurveTo(halfL * 0.44 + 2.5, halfW * 0.64 + 4 + dy * 0.5, halfL * 0.44, halfW * 0.64 + 5.8 + dy * 0.5);
      ctx.quadraticCurveTo(halfL * 0.44 - 2.5, halfW * 0.64 + 4 + dy * 0.5, halfL * 0.44, halfW * 0.64 + dy * 0.5);
      ctx.fill();
      ctx.stroke();
    }
  }
}

export default VillainDiscusfish;
