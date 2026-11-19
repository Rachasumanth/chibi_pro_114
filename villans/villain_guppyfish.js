/**
 * Villain Fancy Cobra Guppy — Standalone 2D Top-Down Expressive Chibi Villain ES Module
 * Concept: Sleek midnight-violet body with oversized toxic-emerald & black cobra-fang
 * patterned tattered fan tail.
 */

const OUTLINE = '#140B1C';
const ONE_SHOTS = new Set(['left_turn', 'right_turn', 'eating', 'shock']);
const LOCK_BLOCKED = new Set(['left_turn', 'right_turn', 'relax', 'happy', 'eating']);
const ALIASES = { idle: 'breathing', hunger: 'hungry' };
const DURATIONS = { left_turn: 0.48, right_turn: 0.48, eating: 0.55, shock: 0.68 };

const POSES = {
  breathing:  { hz: 3.8, amp: 0.24, fin: 0.50, bend: 0.0,  mouth: 0.10, brow: 0.50, eye: 1.0,  aura: 0.48, jit: 0.0 },
  swimming:   { hz: 9.2, amp: 0.44, fin: 0.30, bend: 0.0,  mouth: 0.16, brow: 0.62, eye: 1.0,  aura: 0.72, jit: 0.0 },
  relax:      { hz: 2.0, amp: 0.14, fin: 0.72, bend: 0.0,  mouth: 0.05, brow: 0.24, eye: 0.48, aura: 0.36, jit: 0.0 },
  left_turn:  { hz: 7.8, amp: 0.34, fin: 0.64, bend: -0.64, mouth: 0.14, brow: 0.56, eye: 1.0,  aura: 0.66, jit: 0.0 },
  right_turn: { hz: 7.8, amp: 0.34, fin: 0.64, bend: 0.64,  mouth: 0.14, brow: 0.56, eye: 1.0,  aura: 0.66, jit: 0.0 },
  eating:     { hz: 9.8, amp: 0.32, fin: 0.68, bend: 0.0,  mouth: 1.0,  brow: 0.84, eye: 1.06, aura: 0.90, jit: 0.14 },
  hungry:     { hz: 6.5, amp: 0.28, fin: 0.56, bend: 0.0,  mouth: 0.70, brow: 0.88, eye: 1.12, aura: 0.92, jit: 0.10 },
  stress:     { hz: 10.6, amp: 0.18, fin: 0.38, bend: 0.0, mouth: 0.32, brow: 0.94, eye: 0.28, aura: 0.80, jit: 1.05 },
  fear:       { hz: 11.8, amp: 0.26, fin: 0.82, bend: 0.0, mouth: 0.52, brow: -0.45, eye: 1.34, aura: 0.22, jit: 1.28 },
  shock:      { hz: 2.2, amp: 0.07, fin: 0.92, bend: 0.0,  mouth: 0.80, brow: -0.58, eye: 1.46, aura: 0.20, jit: 1.50 },
  happy:      { hz: 6.8, amp: 0.36, fin: 0.78, bend: 0.0,  mouth: 0.58, brow: 0.36, eye: 0.72, aura: 0.96, jit: 0.0 },
  sad:        { hz: 1.5, amp: 0.09, fin: 0.18, bend: 0.0,  mouth: 0.04, brow: -0.34, eye: 0.66, aura: 0.20, jit: 0.0 },
};

function cubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export class VillainGuppyfish {
  static metadata = {
    name: 'Villain Fancy Cobra Guppy',
    category: 'villain_fish',
    baseLength: 48,
    baseWidth: 24,
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
    const halfL = VillainGuppyfish.metadata.baseLength * 0.5;
    const halfW = VillainGuppyfish.metadata.baseWidth * 0.5;

    const wag = Math.sin(this._phase) * p.amp + p.bend * 0.68;
    const sway = Math.sin(this._phase - 0.7) * p.amp * 0.25 + p.bend * 0.30;
    const jx = p.jit > 0 ? Math.sin(t * 62) * p.jit * 0.9 : 0;
    const jy = p.jit > 0 ? Math.cos(t * 68) * p.jit * 1.0 : 0;

    ctx.save();
    ctx.translate(this.x + jx, this.y + jy);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Toxic-emerald & midnight-violet miasma
    this._drawCobraAura(ctx, halfL, halfW, p.aura, t);

    // 2. Oversized toxic-emerald & black cobra-fang patterned tattered fan tail
    this._drawCobraFanTail(ctx, -halfL * 0.20, sway * 5, wag, p.fin, t);

    // 3. Sleek notched emerald-tipped pectorals
    this._drawGuppyPectoral(ctx, 7, -halfW * 0.56, -1, p.fin);
    this._drawGuppyPectoral(ctx, 7, halfW * 0.56, 1, p.fin);

    // 4. Sleek midnight-violet chibi guppy body with cobra-scale spots
    this._drawGuppyBody(ctx, halfL, halfW, sway, t);

    // 5. Ribbon-like cobra dorsal fin
    this._drawCobraDorsal(ctx, sway, wag);

    // 6. Tiny fanged smirk / snap
    this._drawGuppyMouth(ctx, halfL, p.mouth, t);

    // 7. Expressive glowing emerald villain eyes
    this._drawGuppyEyes(ctx, halfL, halfW, p, t);

    // 8. Mood FX
    this._drawMoodFX(ctx, halfL, halfW, t);

    ctx.restore();
  }

  _drawCobraAura(ctx, halfL, halfW, aura, t) {
    const r = halfL * (1.16 + Math.sin(t * 2.8) * 0.05);
    const g = ctx.createRadialGradient(-4, 0, 3, -4, 0, r);
    g.addColorStop(0, `rgba(24, 8, 42, ${0.44 * aura})`);
    g.addColorStop(0.55, `rgba(18, 224, 118, ${0.22 * aura})`);
    g.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(-4, 0, r, halfW * 1.45, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawCobraFanTail(ctx, tx, ty, wag, fin, t) {
    ctx.save();
    ctx.translate(tx, ty * 0.4);
    ctx.rotate(wag * 0.95);

    const len = 22 + fin * 4;
    const spread = 12 + fin * 5;
    const w = Math.sin(this._phase * 1.2) * 2.2;

    const g = ctx.createLinearGradient(0, 0, -len, 0);
    g.addColorStop(0, '#2B114D');
    g.addColorStop(0.35, '#12D678');
    g.addColorStop(0.75, '#0FA85A');
    g.addColorStop(1, '#120A1E');

    ctx.fillStyle = g;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.9;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(2, -3.2);
    ctx.quadraticCurveTo(-8, -spread * 0.85 + w, -len, -spread + w);
    // Tattered cobra fan trailing edge
    ctx.lineTo(-len * 0.78, -spread * 0.45);
    ctx.lineTo(-len * 1.05, -spread * 0.18 - w * 0.5);
    ctx.lineTo(-len * 0.80, 0.5);
    ctx.lineTo(-len * 1.04, spread * 0.28 + w * 0.5);
    ctx.lineTo(-len * 0.78, spread * 0.55);
    ctx.lineTo(-len, spread - w);
    ctx.quadraticCurveTo(-8, spread * 0.85 - w, 2, 3.2);
    ctx.closePath();
    ctx.fill();

    ctx.save();
    ctx.clip();

    // Wicked black cobra-fang & leopard spots across oversized fan tail
    ctx.fillStyle = '#140B1C';
    const fangMarks = [
      [-8, -5], [-13, -8], [-11, -1], [-16, -3],
      [-10, 4], [-15, 7], [-18, 2], [-7, 2],
    ];
    for (const [fx, fy] of fangMarks) {
      ctx.beginPath();
      ctx.moveTo(fx + 2.5, fy);
      ctx.lineTo(fx - 2.2, fy - 1.6);
      ctx.lineTo(fx - 0.8, fy);
      ctx.lineTo(fx - 2.2, fy + 1.6);
      ctx.closePath();
      ctx.fill();
    }

    // Glowing emerald venom veins
    ctx.strokeStyle = `rgba(110, 255, 175, ${0.55 + Math.sin(t * 6) * 0.25})`;
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(-1, -1.5);
    ctx.lineTo(-len * 0.85, -spread * 0.65);
    ctx.moveTo(-1, 1.5);
    ctx.lineTo(-len * 0.85, spread * 0.65);
    ctx.stroke();

    ctx.restore();
    ctx.stroke();
    ctx.restore();
  }

  _drawGuppyPectoral(ctx, ox, oy, side, fin) {
    ctx.save();
    ctx.translate(ox, oy);
    const flut = Math.sin(this._phase * 1.1 + side) * 0.2;
    ctx.rotate(side * (0.28 + fin * 0.55 + flut));

    const g = ctx.createLinearGradient(0, 0, -6, side * 11);
    g.addColorStop(0, '#3C1666');
    g.addColorStop(0.65, '#14D978');
    g.addColorStop(1, '#140B1C');

    ctx.fillStyle = g;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.6;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(3, 0);
    ctx.quadraticCurveTo(2, side * 9, -3, side * 11);
    ctx.lineTo(-5, side * 7.5);
    ctx.lineTo(-8, side * 9);
    ctx.quadraticCurveTo(-9, side * 4, -5, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  _drawGuppyBody(ctx, halfL, halfW, sway, t) {
    const sy = sway * 3.5;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(halfL * 0.92, 0);
    ctx.bezierCurveTo(halfL * 0.82, -halfW * 0.78, halfL * 0.22, -halfW * 0.80, -halfL * 0.14, -halfW * 0.42 + sy * 0.5);
    ctx.quadraticCurveTo(-halfL * 0.28, -halfW * 0.24 + sy, -halfL * 0.34, -halfW * 0.16 + sy);
    ctx.lineTo(-halfL * 0.34, halfW * 0.16 + sy);
    ctx.quadraticCurveTo(-halfL * 0.28, halfW * 0.24 + sy, -halfL * 0.14, halfW * 0.42 + sy * 0.5);
    ctx.bezierCurveTo(halfL * 0.22, halfW * 0.80, halfL * 0.82, halfW * 0.78, halfL * 0.92, 0);
    ctx.closePath();

    // Sleek midnight-violet gradient
    const bg = ctx.createLinearGradient(halfL, -halfW, -halfL * 0.35, halfW);
    bg.addColorStop(0, '#52228C');
    bg.addColorStop(0.55, '#2A104E');
    bg.addColorStop(1, '#130A22');
    ctx.fillStyle = bg;
    ctx.fill();

    ctx.save();
    ctx.clip();

    // Toxic-emerald cobra herringbone stripes along flanks
    ctx.strokeStyle = `rgba(34, 245, 138, ${0.68 + Math.sin(t * 5) * 0.22})`;
    ctx.lineWidth = 1.25;
    for (let sx = 9; sx >= -5; sx -= 4.2) {
      ctx.beginPath();
      ctx.moveTo(sx + 1.8, -6);
      ctx.lineTo(sx - 1.5, 0);
      ctx.lineTo(sx + 1.8, 6);
      ctx.stroke();
    }

    // Wet specular highlight
    ctx.fillStyle = 'rgba(215, 255, 232, 0.30)';
    ctx.beginPath();
    ctx.ellipse(9, -halfW * 0.32, 8.5, 2.5, -0.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.0;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  _drawCobraDorsal(ctx, sway, wag) {
    ctx.save();
    ctx.fillStyle = '#12CC6E';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(6, 0);
    ctx.quadraticCurveTo(-2, -3.0 + sway * 2, -13, wag * 5);
    ctx.quadraticCurveTo(-2, 3.0 + sway * 2, 6, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  _drawGuppyMouth(ctx, halfL, mouth, t) {
    const mx = halfL * 0.86;
    const snap = this._state === 'eating' || this._state === 'hungry'
      ? Math.abs(Math.sin(t * 14)) * 0.45 + mouth * 0.55
      : mouth;

    if (snap > 0.2 || this._state === 'happy') {
      const w = 1.9 + snap * 2.6;
      ctx.save();
      ctx.fillStyle = '#20061C';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(mx + 0.8, 0, 1.5 + snap * 1.8, w, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#E8FFF2';
      for (const fy of [-w * 0.5, w * 0.5]) {
        ctx.beginPath();
        ctx.moveTo(mx + 0.4, fy - 0.8);
        ctx.lineTo(mx + 3.0 + snap * 0.8, fy);
        ctx.lineTo(mx + 0.4, fy + 0.8);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
  }

  _drawGuppyEyes(ctx, halfL, halfW, p, t) {
    const ex = halfL * 0.56;
    const ey = halfW * 0.42;

    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(ex, side * ey);

      if (this._state === 'stress') {
        ctx.strokeStyle = '#28FF96';
        ctx.lineWidth = 2.0;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-2.0, -side * 2.0);
        ctx.lineTo(1.8, 0);
        ctx.lineTo(-2.0, side * 2.0);
        ctx.stroke();
        ctx.restore();
        continue;
      }

      const rx = 3.4 * (this._state === 'shock' ? 1.25 : 1.0);
      const ry = 3.1 * Math.max(0.45, Math.min(1.36, p.eye));

      ctx.fillStyle = OUTLINE;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx + 1.0, ry + 0.9, side * 0.14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#F0FFF6';
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, side * 0.14, 0, Math.PI * 2);
      ctx.fill();

      const ir = this._state === 'shock' ? 1.1 : 2.1;
      const ig = ctx.createRadialGradient(0.4, 0, 0.2, 0.4, 0, ir);
      ig.addColorStop(0, '#A8FFCC');
      ig.addColorStop(0.55, '#12E678');
      ig.addColorStop(1, '#08522A');
      ctx.fillStyle = ig;
      ctx.beginPath();
      ctx.arc(0.5, side * 0.2, ir, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = OUTLINE;
      ctx.beginPath();
      ctx.ellipse(0.7, side * 0.2, 0.75, ir * 0.78, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(1.3, side * 0.2 - 0.85, 0.8, 0, Math.PI * 2);
      ctx.arc(-0.3, side * 0.2 + 0.75, 0.42, 0, Math.PI * 2);
      ctx.fill();

      if (this._state === 'relax' || this._state === 'happy') {
        ctx.fillStyle = '#2A104E';
        ctx.beginPath();
        ctx.ellipse(-0.7, 0, rx + 0.3, ry * 0.56, side * 0.14, Math.PI * 0.5, Math.PI * 1.5);
        ctx.fill();
      }

      const tilt = p.brow * 0.55;
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.0;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-3.4, -side * (2.2 - tilt * 2.0));
      ctx.lineTo(3.8, -side * (1.2 + tilt * 2.2));
      ctx.stroke();

      if (this._state === 'hungry' || this._state === 'eating') {
        ctx.strokeStyle = `rgba(38, 255, 148, ${0.65 + Math.sin(t * 14) * 0.3})`;
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(0.6, -3.8);
        ctx.lineTo(0.6, 3.8);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  _drawMoodFX(ctx, halfL, halfW, t) {
    if (this._state === 'happy') {
      for (let i = 0; i < 4; i++) {
        const a = t * 2.5 + i * 1.57;
        const sx = 3 + Math.cos(a) * (halfL * 0.75);
        const sy = Math.sin(a) * (halfW * 1.15);
        const r = 2.3 + Math.sin(t * 7 + i) * 0.7;
        ctx.fillStyle = i % 2 === 0 ? '#18FF88' : '#A63DFF';
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
      ctx.translate(halfL * 0.65, -halfW * 1.05);
      ctx.fillStyle = '#FF2055';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.roundRect(-1.7, -8.5, 3.4, 6.2, 1.2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 1.1, 1.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (this._state === 'fear') {
      for (let i = 0; i < 2; i++) {
        const d = (t * 26 + i * 5) % 8;
        const x = 9 - i * 6;
        const y = -halfW * 0.92 - d * 0.5;
        ctx.fillStyle = '#7CE8FF';
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(x, y - 2.8);
        ctx.quadraticCurveTo(x + 2.2, y + 0.8, x, y + 2.4);
        ctx.quadraticCurveTo(x - 2.2, y + 0.8, x, y - 2.8);
        ctx.fill();
        ctx.stroke();
      }
    } else if (this._state === 'stress') {
      const s = 1 + Math.sin(t * 20) * 0.18;
      ctx.save();
      ctx.translate(8, -halfW * 0.88);
      ctx.scale(s, s);
      ctx.strokeStyle = '#FF2455';
      ctx.lineWidth = 1.7;
      ctx.lineCap = 'round';
      for (let q = 0; q < 4; q++) {
        ctx.rotate(Math.PI * 0.5);
        ctx.beginPath();
        ctx.moveTo(1.4, 1.4);
        ctx.quadraticCurveTo(1.6, 3.6, 4.2, 3.9);
        ctx.stroke();
      }
      ctx.restore();
    } else if (this._state === 'sad') {
      const dy = (t * 14) % 6;
      ctx.fillStyle = '#72D6FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 0.95;
      ctx.beginPath();
      ctx.moveTo(halfL * 0.5, halfW * 0.72 + dy * 0.5);
      ctx.quadraticCurveTo(halfL * 0.5 + 1.9, halfW * 0.72 + 3.2 + dy * 0.5, halfL * 0.5, halfW * 0.72 + 4.5 + dy * 0.5);
      ctx.quadraticCurveTo(halfL * 0.5 - 1.9, halfW * 0.72 + 3.2 + dy * 0.5, halfL * 0.5, halfW * 0.72 + dy * 0.5);
      ctx.fill();
      ctx.stroke();
    }
  }
}

export default VillainGuppyfish;
