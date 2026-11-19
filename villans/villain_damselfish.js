/**
 * Villain Yellowtail Damselfish — Standalone 2D Top-Down Expressive Chibi Villain ES Module
 * Concept: Deep abyssal-cobalt body, fierce notched fins, blazing molten-amber
 * spiked forked tail.
 */

const OUTLINE = '#140B1C';
const ONE_SHOTS = new Set(['left_turn', 'right_turn', 'eating', 'shock']);
const LOCK_BLOCKED = new Set(['left_turn', 'right_turn', 'relax', 'happy', 'eating']);
const ALIASES = { idle: 'breathing', hunger: 'hungry' };
const DURATIONS = { left_turn: 0.50, right_turn: 0.50, eating: 0.58, shock: 0.70 };

const POSES = {
  breathing:  { hz: 3.5, amp: 0.19, fin: 0.48, bend: 0.0,  mouth: 0.12, brow: 0.56, eye: 1.0,  aura: 0.50, jit: 0.0 },
  swimming:   { hz: 8.2, amp: 0.38, fin: 0.28, bend: 0.0,  mouth: 0.18, brow: 0.68, eye: 1.0,  aura: 0.74, jit: 0.0 },
  relax:      { hz: 1.8, amp: 0.11, fin: 0.68, bend: 0.0,  mouth: 0.06, brow: 0.28, eye: 0.48, aura: 0.36, jit: 0.0 },
  left_turn:  { hz: 7.2, amp: 0.30, fin: 0.60, bend: -0.60, mouth: 0.15, brow: 0.60, eye: 1.0,  aura: 0.66, jit: 0.0 },
  right_turn: { hz: 7.2, amp: 0.30, fin: 0.60, bend: 0.60,  mouth: 0.15, brow: 0.60, eye: 1.0,  aura: 0.66, jit: 0.0 },
  eating:     { hz: 9.0, amp: 0.28, fin: 0.64, bend: 0.0,  mouth: 1.0,  brow: 0.86, eye: 1.06, aura: 0.90, jit: 0.15 },
  hungry:     { hz: 6.0, amp: 0.26, fin: 0.54, bend: 0.0,  mouth: 0.72, brow: 0.88, eye: 1.12, aura: 0.94, jit: 0.12 },
  stress:     { hz: 9.8, amp: 0.16, fin: 0.38, bend: 0.0,  mouth: 0.34, brow: 0.94, eye: 0.28, aura: 0.82, jit: 1.12 },
  fear:       { hz: 11.0, amp: 0.24, fin: 0.80, bend: 0.0, mouth: 0.54, brow: -0.45, eye: 1.35, aura: 0.22, jit: 1.35 },
  shock:      { hz: 2.0, amp: 0.06, fin: 0.90, bend: 0.0,  mouth: 0.82, brow: -0.58, eye: 1.46, aura: 0.20, jit: 1.56 },
  happy:      { hz: 6.2, amp: 0.34, fin: 0.74, bend: 0.0,  mouth: 0.60, brow: 0.38, eye: 0.72, aura: 0.96, jit: 0.0 },
  sad:        { hz: 1.4, amp: 0.08, fin: 0.18, bend: 0.0,  mouth: 0.04, brow: -0.34, eye: 0.66, aura: 0.22, jit: 0.0 },
};

function cubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export class VillainDamselfish {
  static metadata = {
    name: 'Villain Yellowtail Damselfish',
    category: 'villain_fish',
    baseLength: 58,
    baseWidth: 30,
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
    if ((this._state === 'shock' || this._state === 'fear') && LOCK_BLOCKED.has(next)) return;
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
    const halfL = VillainDamselfish.metadata.baseLength * 0.5;
    const halfW = VillainDamselfish.metadata.baseWidth * 0.5;

    const wag = Math.sin(this._phase) * p.amp + p.bend * 0.65;
    const sway = Math.sin(this._phase - 0.7) * p.amp * 0.25 + p.bend * 0.30;
    const jx = p.jit > 0 ? Math.sin(t * 60) * p.jit * 1.0 : 0;
    const jy = p.jit > 0 ? Math.cos(t * 66) * p.jit * 1.15 : 0;

    ctx.save();
    ctx.translate(this.x + jx, this.y + jy);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Abyssal-cobalt & molten-amber aura
    this._drawCobaltAura(ctx, halfL, halfW, p.aura, t);

    // 2. Blazing molten-amber spiked forked tail
    this._drawMoltenForkedTail(ctx, -halfL * 0.56, sway * 6, wag, t);

    // 3. Fierce notched abyssal-cobalt pectoral fins
    this._drawDamselPectoral(ctx, 5, -halfW * 0.70, -1, p.fin);
    this._drawDamselPectoral(ctx, 5, halfW * 0.70, 1, p.fin);

    // 4. Deep abyssal-cobalt chunky chibi body with electric cobalt rune speckles
    this._drawCobaltBody(ctx, halfL, halfW, sway, t);

    // 5. Spiky dorsal ridge
    this._drawDamselDorsal(ctx, sway, wag);

    // 6. Snapping villain mouth
    this._drawDamselMouth(ctx, halfL, p.mouth, t);

    // 7. Blazing molten-amber eyes with V-brows
    this._drawDamselEyes(ctx, halfL, halfW, p, t);

    // 8. Mood FX
    this._drawMoodFX(ctx, halfL, halfW, t);

    ctx.restore();
  }

  _drawCobaltAura(ctx, halfL, halfW, aura, t) {
    const r = halfL * (1.10 + Math.sin(t * 2.6) * 0.04);
    const g = ctx.createRadialGradient(-3, 0, 4, -3, 0, r);
    g.addColorStop(0, `rgba(14, 14, 48, ${0.46 * aura})`);
    g.addColorStop(0.55, `rgba(255, 165, 18, ${0.22 * aura})`);
    g.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(-3, 0, r, halfW * 1.38, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawMoltenForkedTail(ctx, tx, ty, wag, t) {
    ctx.save();
    ctx.translate(tx, ty * 0.4);
    ctx.rotate(wag * 0.95);

    const g = ctx.createLinearGradient(0, 0, -18, 0);
    g.addColorStop(0, '#FF6A00');
    g.addColorStop(0.55, '#FFB800');
    g.addColorStop(1, '#FFF066');

    ctx.fillStyle = g;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.1;
    ctx.lineJoin = 'round';

    // Spiked blazing forked tail
    ctx.beginPath();
    ctx.moveTo(2, -4.0);
    ctx.lineTo(-17, -13.5);
    ctx.lineTo(-11, -6.5);
    ctx.lineTo(-15, -3.5);
    ctx.lineTo(-9, 0);
    ctx.lineTo(-15, 3.5);
    ctx.lineTo(-11, 6.5);
    ctx.lineTo(-17, 13.5);
    ctx.lineTo(2, 4.0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing molten ember veins
    ctx.strokeStyle = `rgba(255, 250, 195, ${0.65 + Math.sin(t * 7) * 0.25})`;
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(-1, -2);
    ctx.lineTo(-13, -9.5);
    ctx.moveTo(-1, 2);
    ctx.lineTo(-13, 9.5);
    ctx.stroke();
    ctx.restore();
  }

  _drawDamselPectoral(ctx, ox, oy, side, fin) {
    ctx.save();
    ctx.translate(ox, oy);
    const flut = Math.sin(this._phase * 1.0 + side) * 0.18;
    ctx.rotate(side * (0.30 + fin * 0.55 + flut));

    const g = ctx.createLinearGradient(0, 0, -8, side * 14);
    g.addColorStop(0, '#1B38B8');
    g.addColorStop(0.65, '#101446');
    g.addColorStop(1, '#FF9E18');

    ctx.fillStyle = g;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.8;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(4, 0);
    ctx.quadraticCurveTo(3, side * 10, -4, side * 14);
    ctx.lineTo(-6, side * 9.5);
    ctx.lineTo(-10, side * 11.5);
    ctx.quadraticCurveTo(-11, side * 5, -6, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  _drawCobaltBody(ctx, halfL, halfW, sway, t) {
    const sy = sway * 4.2;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(halfL * 0.92, 0);
    ctx.bezierCurveTo(halfL * 0.84, -halfW * 0.94, halfL * 0.14, -halfW * 1.02, -halfL * 0.26, -halfW * 0.62 + sy * 0.45);
    ctx.quadraticCurveTo(-halfL * 0.48, -halfW * 0.34 + sy, -halfL * 0.60, -halfW * 0.20 + sy);
    ctx.lineTo(-halfL * 0.60, halfW * 0.20 + sy);
    ctx.quadraticCurveTo(-halfL * 0.48, halfW * 0.34 + sy, -halfL * 0.26, halfW * 0.62 + sy * 0.45);
    ctx.bezierCurveTo(halfL * 0.14, halfW * 1.02, halfL * 0.84, halfW * 0.94, halfL * 0.92, 0);
    ctx.closePath();

    // Deep abyssal-cobalt gradient
    const bg = ctx.createLinearGradient(halfL, -halfW, -halfL * 0.6, halfW);
    bg.addColorStop(0, '#1D4AFF');
    bg.addColorStop(0.45, '#12228F');
    bg.addColorStop(0.82, '#0C104A');
    bg.addColorStop(1, '#1A0B24');
    ctx.fillStyle = bg;
    ctx.fill();

    ctx.save();
    ctx.clip();

    // Blazing molten-amber transition glow near tail peduncle
    const tg = ctx.createLinearGradient(-8, 0, -halfL * 0.65, 0);
    tg.addColorStop(0, 'rgba(255, 130, 0, 0)');
    tg.addColorStop(1, 'rgba(255, 168, 16, 0.85)');
    ctx.fillStyle = tg;
    ctx.fillRect(-halfL * 0.65, -halfW, halfL * 0.48, halfW * 2);

    // Electric cobalt war-scale chevron runes
    ctx.strokeStyle = `rgba(82, 185, 255, ${0.52 + Math.sin(t * 5) * 0.22})`;
    ctx.lineWidth = 1.2;
    for (let sx = 10; sx >= -8; sx -= 5.2) {
      ctx.beginPath();
      ctx.moveTo(sx + 2, -7.5);
      ctx.lineTo(sx - 2, 0);
      ctx.lineTo(sx + 2, 7.5);
      ctx.stroke();
    }

    // Cel-shade lower flank
    ctx.fillStyle = 'rgba(12, 6, 28, 0.34)';
    ctx.beginPath();
    ctx.ellipse(2, halfW * 0.66, halfL * 0.82, halfW * 0.40, 0, 0, Math.PI * 2);
    ctx.fill();

    // Glossy highlight
    ctx.fillStyle = 'rgba(175, 220, 255, 0.34)';
    ctx.beginPath();
    ctx.ellipse(8, -halfW * 0.38, 11, 3.2, -0.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.2;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  _drawDamselDorsal(ctx, sway, wag) {
    ctx.save();
    ctx.fillStyle = '#0F185A';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(1, -2.5 + sway * 1.5);
    ctx.lineTo(-8, -2.2 + sway * 2.5);
    ctx.lineTo(-15, wag * 4);
    ctx.lineTo(-8, 2.2 + sway * 2.5);
    ctx.lineTo(1, 2.5 + sway * 1.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  _drawDamselMouth(ctx, halfL, mouth, t) {
    const mx = halfL * 0.86;
    const snap = this._state === 'eating' || this._state === 'hungry'
      ? Math.abs(Math.sin(t * 14)) * 0.45 + mouth * 0.55
      : mouth;

    if (snap > 0.2 || this._state === 'happy') {
      const w = 2.2 + snap * 3.2;
      ctx.save();
      ctx.fillStyle = '#20061C';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.ellipse(mx + 1, 0, 1.7 + snap * 2.1, w, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FFF8DC';
      for (const fy of [-w * 0.5, 0, w * 0.5]) {
        ctx.beginPath();
        ctx.moveTo(mx + 0.4, fy - 0.9);
        ctx.lineTo(mx + 3.4 + snap, fy);
        ctx.lineTo(mx + 0.4, fy + 0.9);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
  }

  _drawDamselEyes(ctx, halfL, halfW, p, t) {
    const ex = halfL * 0.54;
    const ey = halfW * 0.48;

    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(ex, side * ey);

      if (this._state === 'stress') {
        ctx.strokeStyle = '#FFB818';
        ctx.lineWidth = 2.1;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-2.2, -side * 2.2);
        ctx.lineTo(2.0, 0);
        ctx.lineTo(-2.2, side * 2.2);
        ctx.stroke();
        ctx.restore();
        continue;
      }

      const rx = 3.9 * (this._state === 'shock' ? 1.24 : 1.0);
      const ry = 3.5 * Math.max(0.45, Math.min(1.36, p.eye));

      ctx.fillStyle = OUTLINE;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx + 1.1, ry + 1.0, side * 0.14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFF8E6';
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, side * 0.14, 0, Math.PI * 2);
      ctx.fill();

      const ir = this._state === 'shock' ? 1.3 : 2.4;
      const ig = ctx.createRadialGradient(0.5, 0, 0.25, 0.5, 0, ir);
      ig.addColorStop(0, '#FFF58C');
      ig.addColorStop(0.55, '#FFA800');
      ig.addColorStop(1, '#8A2800');
      ctx.fillStyle = ig;
      ctx.beginPath();
      ctx.arc(0.6, side * 0.22, ir, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = OUTLINE;
      ctx.beginPath();
      ctx.ellipse(0.8, side * 0.22, 0.85, ir * 0.78, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(1.5, side * 0.22 - 0.95, 0.9, 0, Math.PI * 2);
      ctx.arc(-0.35, side * 0.22 + 0.85, 0.48, 0, Math.PI * 2);
      ctx.fill();

      if (this._state === 'relax' || this._state === 'happy') {
        ctx.fillStyle = '#121E72';
        ctx.beginPath();
        ctx.ellipse(-0.8, 0, rx + 0.35, ry * 0.56, side * 0.14, Math.PI * 0.5, Math.PI * 1.5);
        ctx.fill();
      }

      const tilt = p.brow * 0.55;
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-3.8, -side * (2.4 - tilt * 2.2));
      ctx.lineTo(4.2, -side * (1.3 + tilt * 2.3));
      ctx.stroke();

      if (this._state === 'hungry' || this._state === 'eating') {
        ctx.strokeStyle = `rgba(255, 210, 48, ${0.65 + Math.sin(t * 14) * 0.3})`;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(0.7, -4.2);
        ctx.lineTo(0.7, 4.2);
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
        const sy = Math.sin(a) * (halfW * 1.15);
        const r = 2.6 + Math.sin(t * 7 + i) * 0.8;
        ctx.fillStyle = i % 2 === 0 ? '#FFB800' : '#9B30FF';
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
      ctx.translate(halfL * 0.62, -halfW * 1.05);
      ctx.fillStyle = '#FF204E';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.roundRect(-1.9, -9.2, 3.8, 6.8, 1.3);
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
        const x = 10 - i * 7;
        const y = -halfW * 0.92 - d * 0.55;
        ctx.fillStyle = '#7CE8FF';
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(x, y - 3.2);
        ctx.quadraticCurveTo(x + 2.4, y + 0.9, x, y + 2.7);
        ctx.quadraticCurveTo(x - 2.4, y + 0.9, x, y - 3.2);
        ctx.fill();
        ctx.stroke();
      }
    } else if (this._state === 'stress') {
      const s = 1 + Math.sin(t * 20) * 0.18;
      ctx.save();
      ctx.translate(9, -halfW * 0.90);
      ctx.scale(s, s);
      ctx.strokeStyle = '#FF2455';
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';
      for (let q = 0; q < 4; q++) {
        ctx.rotate(Math.PI * 0.5);
        ctx.beginPath();
        ctx.moveTo(1.5, 1.5);
        ctx.quadraticCurveTo(1.7, 4.0, 4.6, 4.3);
        ctx.stroke();
      }
      ctx.restore();
    } else if (this._state === 'sad') {
      const dy = (t * 14) % 7;
      ctx.fillStyle = '#72D6FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(halfL * 0.48, halfW * 0.74 + dy * 0.5);
      ctx.quadraticCurveTo(halfL * 0.48 + 2.1, halfW * 0.74 + 3.6 + dy * 0.5, halfL * 0.48, halfW * 0.74 + 5.0 + dy * 0.5);
      ctx.quadraticCurveTo(halfL * 0.48 - 2.1, halfW * 0.74 + 3.6 + dy * 0.5, halfL * 0.48, halfW * 0.74 + dy * 0.5);
      ctx.fill();
      ctx.stroke();
    }
  }
}

export default VillainDamselfish;
