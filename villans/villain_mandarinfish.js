/**
 * Villain Mandarin Dragonet — Standalone 2D Top-Down Expressive Chibi Villain ES Module
 * Concept: Dark obsidian chibi head, glowing toxic-violet/neon-lime/crimson hypnotic
 * swirl runes, spiky fan pectorals.
 */

const OUTLINE = '#140B1C';
const ONE_SHOTS = new Set(['left_turn', 'right_turn', 'eating', 'shock']);
const LOCKED_IGNORED = new Set(['left_turn', 'right_turn', 'relax', 'happy', 'eating']);
const ALIASES = { idle: 'breathing', hunger: 'hungry' };
const DURATIONS = { left_turn: 0.52, right_turn: 0.52, eating: 0.60, shock: 0.72 };

const POSES = {
  breathing:  { hz: 3.4, amp: 0.18, fan: 0.56, bend: 0.0,  mouth: 0.10, brow: 0.50, eye: 1.0,  aura: 0.55, jit: 0.0 },
  swimming:   { hz: 7.8, amp: 0.36, fan: 0.34, bend: 0.0,  mouth: 0.16, brow: 0.62, eye: 1.0,  aura: 0.78, jit: 0.0 },
  relax:      { hz: 1.8, amp: 0.10, fan: 0.76, bend: 0.0,  mouth: 0.05, brow: 0.24, eye: 0.48, aura: 0.40, jit: 0.0 },
  left_turn:  { hz: 6.8, amp: 0.30, fan: 0.68, bend: -0.60, mouth: 0.14, brow: 0.56, eye: 1.0,  aura: 0.70, jit: 0.0 },
  right_turn: { hz: 6.8, amp: 0.30, fan: 0.68, bend: 0.60,  mouth: 0.14, brow: 0.56, eye: 1.0,  aura: 0.70, jit: 0.0 },
  eating:     { hz: 8.8, amp: 0.28, fan: 0.72, bend: 0.0,  mouth: 1.0,  brow: 0.84, eye: 1.06, aura: 0.92, jit: 0.15 },
  hungry:     { hz: 5.8, amp: 0.25, fan: 0.62, bend: 0.0,  mouth: 0.70, brow: 0.88, eye: 1.12, aura: 0.95, jit: 0.12 },
  stress:     { hz: 9.6, amp: 0.16, fan: 0.40, bend: 0.0,  mouth: 0.32, brow: 0.94, eye: 0.28, aura: 0.84, jit: 1.15 },
  fear:       { hz: 10.8, amp: 0.23, fan: 0.84, bend: 0.0, mouth: 0.52, brow: -0.45, eye: 1.34, aura: 0.24, jit: 1.38 },
  shock:      { hz: 1.9, amp: 0.06, fan: 0.94, bend: 0.0,  mouth: 0.80, brow: -0.58, eye: 1.46, aura: 0.20, jit: 1.60 },
  happy:      { hz: 6.0, amp: 0.32, fan: 0.80, bend: 0.0,  mouth: 0.58, brow: 0.36, eye: 0.72, aura: 1.0,  jit: 0.0 },
  sad:        { hz: 1.4, amp: 0.08, fan: 0.18, bend: 0.0,  mouth: 0.04, brow: -0.34, eye: 0.66, aura: 0.22, jit: 0.0 },
};

function cubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export class VillainMandarinfish {
  static metadata = {
    name: 'Villain Mandarin Dragonet',
    category: 'villain_fish',
    baseLength: 60,
    baseWidth: 36,
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
    if ((this._state === 'shock' || this._state === 'fear') && LOCKED_IGNORED.has(next)) return;
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
    const halfL = VillainMandarinfish.metadata.baseLength * 0.5;
    const halfW = VillainMandarinfish.metadata.baseWidth * 0.5;

    const wag = Math.sin(this._phase) * p.amp + p.bend * 0.65;
    const sway = Math.sin(this._phase - 0.7) * p.amp * 0.25 + p.bend * 0.30;
    const jx = p.jit > 0 ? Math.sin(t * 60) * p.jit * 1.0 : 0;
    const jy = p.jit > 0 ? Math.cos(t * 66) * p.jit * 1.15 : 0;

    ctx.save();
    ctx.translate(this.x + jx, this.y + jy);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Hypnotic toxic-violet & neon-lime aura
    this._drawHypnoticAura(ctx, halfL, halfW, p.aura, t);

    // 2. Spiky wide dragonet fan pectorals
    this._drawSpikyFanPectoral(ctx, 5, -halfW * 0.54, -1, p.fan, t);
    this._drawSpikyFanPectoral(ctx, 5, halfW * 0.54, 1, p.fan, t);

    // 3. Psychedelic rune-etched fan tail
    this._drawMandarinTail(ctx, -halfL * 0.64, sway * 7, wag, t);

    // 4. Chunky dark-obsidian dragonet body with glowing hypnotic swirl runes
    this._drawMandarinBody(ctx, halfL, halfW, sway, t);

    // 5. Spiky dragonet dorsal crest
    this._drawDragonetCrest(ctx, sway, wag, t);

    // 6. Snapping little villain mouth
    this._drawDragonetMouth(ctx, halfL, p.mouth, t);

    // 7. Hypnotic neon-lime & crimson eyes
    this._drawMandarinEyes(ctx, halfL, halfW, p, t);

    // 8. Mood FX
    this._drawMoodFX(ctx, halfL, halfW, t);

    ctx.restore();
  }

  _drawHypnoticAura(ctx, halfL, halfW, aura, t) {
    const r = halfL * (1.12 + Math.sin(t * 2.8) * 0.05);
    const g = ctx.createRadialGradient(-2, 0, 4, -2, 0, r);
    g.addColorStop(0, `rgba(24, 8, 42, ${0.46 * aura})`);
    g.addColorStop(0.5, `rgba(155, 36, 255, ${0.24 * aura})`);
    g.addColorStop(0.82, `rgba(148, 255, 24, ${0.15 * aura})`);
    g.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(-2, 0, r, halfW * 1.32, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawSpikyFanPectoral(ctx, ox, oy, side, fan, t) {
    ctx.save();
    ctx.translate(ox, oy);
    const wave = Math.sin(this._phase * 1.15 + side) * 0.2;
    ctx.rotate(side * (0.20 + fan * 0.52 + wave));

    const g = ctx.createLinearGradient(0, 0, -8, side * 18);
    g.addColorStop(0, '#221036');
    g.addColorStop(0.5, '#8A22E6');
    g.addColorStop(0.85, '#FF1E56');
    g.addColorStop(1, '#A4FF1E');

    ctx.fillStyle = g;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.9;
    ctx.lineJoin = 'round';

    // Spiky 4-point dragonet fan wing
    ctx.beginPath();
    ctx.moveTo(6, 0);
    ctx.lineTo(8, side * 12);
    ctx.lineTo(3, side * 9.5);
    ctx.lineTo(1, side * 16.5);
    ctx.lineTo(-3, side * 11.5);
    ctx.lineTo(-7, side * 16);
    ctx.lineTo(-9, side * 10);
    ctx.lineTo(-13, side * 11);
    ctx.quadraticCurveTo(-11, side * 4, -6, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing neon-lime fin veins
    ctx.strokeStyle = `rgba(170, 255, 38, ${0.65 + Math.sin(t * 6 + side) * 0.2})`;
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(2, side * 2);
    ctx.lineTo(1, side * 14);
    ctx.moveTo(-2, side * 2);
    ctx.lineTo(-6, side * 13);
    ctx.stroke();
    ctx.restore();
  }

  _drawMandarinTail(ctx, tx, ty, wag, t) {
    ctx.save();
    ctx.translate(tx, ty * 0.4);
    ctx.rotate(wag * 0.95);

    const g = ctx.createLinearGradient(0, 0, -16, 0);
    g.addColorStop(0, '#26103A');
    g.addColorStop(0.5, '#D91A52');
    g.addColorStop(1, '#7A1EE6');

    ctx.fillStyle = g;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.0;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(2, -4);
    ctx.lineTo(-14, -11.5);
    ctx.lineTo(-11, -4.5);
    ctx.lineTo(-16, 0);
    ctx.lineTo(-11, 4.5);
    ctx.lineTo(-14, 11.5);
    ctx.lineTo(2, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = `rgba(164, 255, 30, ${0.7 + Math.sin(t * 6) * 0.25})`;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(-2, 0);
    ctx.lineTo(-13, 0);
    ctx.stroke();
    ctx.restore();
  }

  _drawMandarinBody(ctx, halfL, halfW, sway, t) {
    const sy = sway * 4.5;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(halfL * 0.92, 0);
    ctx.bezierCurveTo(halfL * 0.86, -halfW * 0.88, halfL * 0.24, -halfW * 0.92, -halfL * 0.24, -halfW * 0.52 + sy * 0.45);
    ctx.quadraticCurveTo(-halfL * 0.50, -halfW * 0.28 + sy, -halfL * 0.66, -halfW * 0.18 + sy);
    ctx.lineTo(-halfL * 0.66, halfW * 0.18 + sy);
    ctx.quadraticCurveTo(-halfL * 0.50, halfW * 0.28 + sy, -halfL * 0.24, halfW * 0.52 + sy * 0.45);
    ctx.bezierCurveTo(halfL * 0.24, halfW * 0.92, halfL * 0.86, halfW * 0.88, halfL * 0.92, 0);
    ctx.closePath();

    // Dark obsidian chibi body
    const bg = ctx.createLinearGradient(halfL, -halfW, -halfL * 0.6, halfW);
    bg.addColorStop(0, '#231336');
    bg.addColorStop(0.5, '#190D29');
    bg.addColorStop(1, '#10081B');
    ctx.fillStyle = bg;
    ctx.fill();

    ctx.save();
    ctx.clip();

    const pulse = 0.75 + Math.sin(t * 4.8) * 0.25;

    // Hypnotic toxic-violet swirl runes
    ctx.strokeStyle = `rgba(182, 68, 255, ${pulse})`;
    ctx.lineWidth = 2.0;
    ctx.lineCap = 'round';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(14, side * 3);
      ctx.bezierCurveTo(8, side * 12, 0, side * 12, -3, side * 5);
      ctx.bezierCurveTo(-6, side * 10, -14, side * 9, -16, side * 2);
      ctx.stroke();
    }

    // Neon-lime inner hypnotic spirals
    ctx.strokeStyle = `rgba(166, 255, 24, ${pulse})`;
    ctx.lineWidth = 1.4;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(4, side * 7.5, 3.2, 0, Math.PI * 1.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-9, side * 5.2, 2.4, Math.PI * 0.4, Math.PI * 1.9);
      ctx.stroke();
    }

    // Crimson forehead sigil
    ctx.strokeStyle = `rgba(255, 30, 86, ${pulse})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(21, 0);
    ctx.lineTo(15, -3.5);
    ctx.lineTo(12, 0);
    ctx.lineTo(15, 3.5);
    ctx.closePath();
    ctx.stroke();

    // Glossy chibi highlight
    ctx.fillStyle = 'rgba(215, 175, 255, 0.24)';
    ctx.beginPath();
    ctx.ellipse(9, -halfW * 0.34, 11, 3.4, -0.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.3;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  _drawDragonetCrest(ctx, sway, wag, t) {
    ctx.save();
    ctx.fillStyle = '#FF1E56';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(0, -3.2 + sway * 1.5);
    ctx.lineTo(-4, 0.5 + sway * 2);
    ctx.lineTo(-10, -2.8 + sway * 3);
    ctx.lineTo(-16, wag * 4);
    ctx.lineTo(-10, 2.8 + sway * 3);
    ctx.lineTo(0, 2.8 + sway * 1.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = `rgba(170, 255, 30, ${0.7 + Math.sin(t * 5) * 0.25})`;
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(6, 0);
    ctx.lineTo(-14, wag * 3.5);
    ctx.stroke();
    ctx.restore();
  }

  _drawDragonetMouth(ctx, halfL, mouth, t) {
    const mx = halfL * 0.86;
    const snap = this._state === 'eating' || this._state === 'hungry'
      ? Math.abs(Math.sin(t * 14)) * 0.45 + mouth * 0.55
      : mouth;

    if (snap > 0.2 || this._state === 'happy') {
      const w = 2.4 + snap * 3.4;
      ctx.save();
      ctx.fillStyle = '#24071F';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(mx + 1, 0, 1.8 + snap * 2.2, w, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#F2FFE0';
      for (const fy of [-w * 0.5, w * 0.5]) {
        ctx.beginPath();
        ctx.moveTo(mx + 0.5, fy - 1.0);
        ctx.lineTo(mx + 3.6 + snap, fy);
        ctx.lineTo(mx + 0.5, fy + 1.0);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
  }

  _drawMandarinEyes(ctx, halfL, halfW, p, t) {
    const ex = halfL * 0.54;
    const ey = halfW * 0.44;

    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(ex, side * ey);

      if (this._state === 'stress') {
        ctx.strokeStyle = '#A6FF1E';
        ctx.lineWidth = 2.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-2.3, -side * 2.3);
        ctx.lineTo(2.0, 0);
        ctx.lineTo(-2.3, side * 2.3);
        ctx.stroke();
        ctx.restore();
        continue;
      }

      const rx = 4.1 * (this._state === 'shock' ? 1.24 : 1.0);
      const ry = 3.7 * Math.max(0.45, Math.min(1.36, p.eye));

      ctx.fillStyle = OUTLINE;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx + 1.2, ry + 1.1, side * 0.14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#F5FFE6';
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, side * 0.14, 0, Math.PI * 2);
      ctx.fill();

      // Hypnotic concentric crimson & neon-lime iris
      const ir = this._state === 'shock' ? 1.4 : 2.6;
      ctx.fillStyle = '#FF1E56';
      ctx.beginPath();
      ctx.arc(0.6, side * 0.25, ir, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#A6FF1E';
      ctx.lineWidth = 0.85;
      ctx.beginPath();
      ctx.arc(0.6, side * 0.25, ir * 0.62, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = OUTLINE;
      ctx.beginPath();
      ctx.arc(0.8, side * 0.25, ir * 0.36, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(1.6, side * 0.25 - 1.0, 0.95, 0, Math.PI * 2);
      ctx.arc(-0.4, side * 0.25 + 0.9, 0.5, 0, Math.PI * 2);
      ctx.fill();

      if (this._state === 'relax' || this._state === 'happy') {
        ctx.fillStyle = '#26113D';
        ctx.beginPath();
        ctx.ellipse(-0.9, 0, rx + 0.4, ry * 0.55, side * 0.14, Math.PI * 0.5, Math.PI * 1.5);
        ctx.fill();
      }

      const tilt = p.brow * 0.55;
      ctx.strokeStyle = '#B84DFF';
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-4.0, -side * (2.5 - tilt * 2.4));
      ctx.lineTo(4.4, -side * (1.4 + tilt * 2.5));
      ctx.stroke();

      if (this._state === 'hungry' || this._state === 'eating') {
        ctx.strokeStyle = `rgba(170, 255, 36, ${0.65 + Math.sin(t * 14) * 0.3})`;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(0.8, -4.4);
        ctx.lineTo(0.8, 4.4);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  _drawMoodFX(ctx, halfL, halfW, t) {
    if (this._state === 'happy') {
      for (let i = 0; i < 4; i++) {
        const a = t * 2.4 + i * 1.57;
        const sx = 4 + Math.cos(a) * (halfL * 0.72);
        const sy = Math.sin(a) * (halfW * 1.05);
        const r = 2.6 + Math.sin(t * 7 + i) * 0.8;
        ctx.fillStyle = i % 2 === 0 ? '#A8FF1E' : '#B833FF';
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
      ctx.translate(halfL * 0.62, -halfW * 0.95);
      ctx.fillStyle = '#FF2055';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.roundRect(-1.9, -9.5, 3.8, 7.0, 1.4);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 1.2, 1.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (this._state === 'fear') {
      for (let i = 0; i < 2; i++) {
        const d = (t * 26 + i * 6) % 9;
        const x = 11 - i * 7;
        const y = -halfW * 0.85 - d * 0.55;
        ctx.fillStyle = '#7CE8FF';
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(x, y - 3.3);
        ctx.quadraticCurveTo(x + 2.5, y + 1, x, y + 2.8);
        ctx.quadraticCurveTo(x - 2.5, y + 1, x, y - 3.3);
        ctx.fill();
        ctx.stroke();
      }
    } else if (this._state === 'stress') {
      const s = 1 + Math.sin(t * 20) * 0.18;
      ctx.save();
      ctx.translate(10, -halfW * 0.82);
      ctx.scale(s, s);
      ctx.strokeStyle = '#FF2455';
      ctx.lineWidth = 1.9;
      ctx.lineCap = 'round';
      for (let q = 0; q < 4; q++) {
        ctx.rotate(Math.PI * 0.5);
        ctx.beginPath();
        ctx.moveTo(1.6, 1.6);
        ctx.quadraticCurveTo(1.8, 4.2, 4.8, 4.5);
        ctx.stroke();
      }
      ctx.restore();
    } else if (this._state === 'sad') {
      const dy = (t * 14) % 7;
      ctx.fillStyle = '#72D6FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(halfL * 0.46, halfW * 0.66 + dy * 0.5);
      ctx.quadraticCurveTo(halfL * 0.46 + 2.2, halfW * 0.66 + 3.8 + dy * 0.5, halfL * 0.46, halfW * 0.66 + 5.2 + dy * 0.5);
      ctx.quadraticCurveTo(halfL * 0.46 - 2.2, halfW * 0.66 + 3.8 + dy * 0.5, halfL * 0.46, halfW * 0.66 + dy * 0.5);
      ctx.fill();
      ctx.stroke();
    }
  }
}

export default VillainMandarinfish;
