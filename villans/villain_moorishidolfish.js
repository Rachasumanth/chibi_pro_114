/**
 * Villain Moorish Idol — Standalone 2D Top-Down Expressive Chibi Villain ES Module
 * Concept: Charcoal/crimson/tarnished-gold bands, battle-scarred protruding snout,
 * thorny whip-like dorsal streamer.
 */

const OUTLINE = '#140B1C';
const ONE_SHOTS = new Set(['left_turn', 'right_turn', 'eating', 'shock']);
const LOCKED_SET = new Set(['left_turn', 'right_turn', 'relax', 'happy', 'eating']);
const ALIASES = { idle: 'breathing', hunger: 'hungry' };
const DURATIONS = { left_turn: 0.56, right_turn: 0.56, eating: 0.62, shock: 0.74 };

const POSES = {
  breathing:  { hz: 2.9, amp: 0.18, whip: 2.8, fin: 0.48, bend: 0.0,  mouth: 0.10, brow: 0.54, eye: 1.0,  aura: 0.52, jit: 0.0 },
  swimming:   { hz: 6.8, amp: 0.36, whip: 6.4, fin: 0.28, bend: 0.0,  mouth: 0.16, brow: 0.66, eye: 1.0,  aura: 0.74, jit: 0.0 },
  relax:      { hz: 1.6, amp: 0.11, whip: 1.5, fin: 0.68, bend: 0.0,  mouth: 0.06, brow: 0.28, eye: 0.46, aura: 0.38, jit: 0.0 },
  left_turn:  { hz: 6.0, amp: 0.28, whip: 5.5, fin: 0.60, bend: -0.60, mouth: 0.14, brow: 0.58, eye: 1.0,  aura: 0.68, jit: 0.0 },
  right_turn: { hz: 6.0, amp: 0.28, whip: 5.5, fin: 0.60, bend: 0.60,  mouth: 0.14, brow: 0.58, eye: 1.0,  aura: 0.68, jit: 0.0 },
  eating:     { hz: 8.0, amp: 0.28, whip: 7.4, fin: 0.66, bend: 0.0,  mouth: 1.0,  brow: 0.85, eye: 1.06, aura: 0.90, jit: 0.16 },
  hungry:     { hz: 5.2, amp: 0.25, whip: 4.8, fin: 0.52, bend: 0.0,  mouth: 0.70, brow: 0.88, eye: 1.12, aura: 0.92, jit: 0.12 },
  stress:     { hz: 9.0, amp: 0.16, whip: 8.5, fin: 0.36, bend: 0.0,  mouth: 0.34, brow: 0.94, eye: 0.28, aura: 0.80, jit: 1.18 },
  fear:       { hz: 10.2, amp: 0.23, whip: 9.4, fin: 0.80, bend: 0.0, mouth: 0.54, brow: -0.45, eye: 1.35, aura: 0.22, jit: 1.40 },
  shock:      { hz: 1.8, amp: 0.06, whip: 2.0, fin: 0.90, bend: 0.0,  mouth: 0.82, brow: -0.58, eye: 1.46, aura: 0.20, jit: 1.62 },
  happy:      { hz: 5.2, amp: 0.32, whip: 5.0, fin: 0.72, bend: 0.0,  mouth: 0.60, brow: 0.38, eye: 0.72, aura: 0.96, jit: 0.0 },
  sad:        { hz: 1.2, amp: 0.08, whip: 1.1, fin: 0.18, bend: 0.0,  mouth: 0.04, brow: -0.34, eye: 0.66, aura: 0.22, jit: 0.0 },
};

function cubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export class VillainMoorishidolfish {
  static metadata = {
    name: 'Villain Moorish Idol',
    category: 'villain_fish',
    baseLength: 95,
    baseWidth: 52,
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
    this._whipPhase = 0;

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
    if ((this._state === 'shock' || this._state === 'fear') && LOCKED_SET.has(next)) return;
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
    this._whipPhase += d * this._cur.whip;

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
    const halfL = VillainMoorishidolfish.metadata.baseLength * 0.5;
    const halfW = VillainMoorishidolfish.metadata.baseWidth * 0.5;

    const wag = Math.sin(this._phase) * p.amp + p.bend * 0.62;
    const sway = Math.sin(this._phase - 0.7) * p.amp * 0.25 + p.bend * 0.28;
    const jx = p.jit > 0 ? Math.sin(t * 58) * p.jit * 1.1 : 0;
    const jy = p.jit > 0 ? Math.cos(t * 64) * p.jit * 1.25 : 0;

    ctx.save();
    ctx.translate(this.x + jx, this.y + jy);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Tarnished gold & crimson shadow aura
    this._drawIdolAura(ctx, halfL, halfW, p.aura, t);

    // 2. Swept notched pectoral fins
    this._drawIdolPectoral(ctx, 4, -halfW * 0.56, -1, p.fin);
    this._drawIdolPectoral(ctx, 4, halfW * 0.56, 1, p.fin);

    // 3. Sharp obsidian-crimson forked tail
    this._drawIdolTail(ctx, -halfL * 0.52, sway * 8, wag);

    // 4. Chunky banded body with battle-scarred protruding snout
    this._drawIdolBody(ctx, halfL, halfW, sway, t);

    // 5. Iconic thorny whip-like dorsal streamer trailing far behind
    this._drawThornyWhipStreamer(ctx, sway, wag, t);

    // 6. Protruding snout fangs
    this._drawSnoutFangs(ctx, halfL, p.mouth, t);

    // 7. Expressive molten-gold villain eyes
    this._drawIdolEyes(ctx, halfL, halfW, p, t);

    // 8. Mood FX
    this._drawMoodFX(ctx, halfL, halfW, t);

    ctx.restore();
  }

  _drawIdolAura(ctx, halfL, halfW, aura, t) {
    const r = halfL * (1.05 + Math.sin(t * 2.2) * 0.04);
    const g = ctx.createRadialGradient(-4, 0, 6, -4, 0, r);
    g.addColorStop(0, `rgba(26, 10, 28, ${0.46 * aura})`);
    g.addColorStop(0.55, `rgba(184, 130, 22, ${0.20 * aura})`);
    g.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(-4, 0, r, halfW * 1.18, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawIdolPectoral(ctx, ox, oy, side, fin) {
    ctx.save();
    ctx.translate(ox, oy);
    const flut = Math.sin(this._phase * 0.9 + side) * 0.16;
    ctx.rotate(side * (0.28 + fin * 0.52 + flut));

    const g = ctx.createLinearGradient(0, 0, -14, side * 20);
    g.addColorStop(0, '#C99A2E');
    g.addColorStop(0.55, '#5E1528');
    g.addColorStop(1, '#1A0E22');

    ctx.fillStyle = g;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.0;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(5, 0);
    ctx.quadraticCurveTo(3, side * 14, -7, side * 20);
    ctx.lineTo(-9, side * 13);
    ctx.lineTo(-14, side * 15);
    ctx.quadraticCurveTo(-15, side * 7, -8, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  _drawIdolTail(ctx, tx, ty, wag) {
    ctx.save();
    ctx.translate(tx, ty * 0.4);
    ctx.rotate(wag * 0.9);

    ctx.fillStyle = '#1B1124';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.2;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(2, -4.5);
    ctx.lineTo(-18, -15.5);
    ctx.lineTo(-12, -5.5);
    ctx.lineTo(-16, 0);
    ctx.lineTo(-12, 5.5);
    ctx.lineTo(-18, 15.5);
    ctx.lineTo(2, 4.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Crimson inner edge
    ctx.strokeStyle = '#D61C3C';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-16, -13.5);
    ctx.lineTo(-11, -4.5);
    ctx.moveTo(-16, 13.5);
    ctx.lineTo(-11, 4.5);
    ctx.stroke();
    ctx.restore();
  }

  _drawIdolBody(ctx, halfL, halfW, sway, t) {
    const sy = sway * 5.5;
    ctx.save();
    ctx.beginPath();
    // Protruding battle-scarred snout tip
    ctx.moveTo(halfL * 0.96, 0);
    ctx.quadraticCurveTo(halfL * 0.80, -5.5, halfL * 0.62, -halfW * 0.48);
    ctx.bezierCurveTo(halfL * 0.35, -halfW * 0.88, -halfL * 0.05, -halfW * 0.86, -halfL * 0.32, -halfW * 0.50 + sy * 0.4);
    ctx.quadraticCurveTo(-halfL * 0.48, -halfW * 0.28 + sy, -halfL * 0.56, -halfW * 0.16 + sy);
    ctx.lineTo(-halfL * 0.56, halfW * 0.16 + sy);
    ctx.quadraticCurveTo(-halfL * 0.48, halfW * 0.28 + sy, -halfL * 0.32, halfW * 0.50 + sy * 0.4);
    ctx.bezierCurveTo(-halfL * 0.05, halfW * 0.86, halfL * 0.35, halfW * 0.88, halfL * 0.62, halfW * 0.48);
    ctx.quadraticCurveTo(halfL * 0.80, 5.5, halfL * 0.96, 0);
    ctx.closePath();

    // Tarnished gold base
    const bg = ctx.createLinearGradient(halfL, -halfW, -halfL * 0.5, halfW);
    bg.addColorStop(0, '#E0A832');
    bg.addColorStop(0.5, '#A8741E');
    bg.addColorStop(1, '#4F3014');
    ctx.fillStyle = bg;
    ctx.fill();

    ctx.save();
    ctx.clip();

    // Bold charcoal-black head & mid-body Moorish Idol bands with crimson borders
    const bands = [
      { x: 24, w: 12, col: '#1C1426' },
      { x: -1, w: 13, col: '#181022' },
      { x: -20, w: 9, col: '#221428' },
    ];
    for (const b of bands) {
      ctx.fillStyle = b.col;
      ctx.strokeStyle = '#C91638';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(b.x - b.w * 0.5, -halfW * 1.1);
      ctx.lineTo(b.x - b.w * 0.5 + 3, 0);
      ctx.lineTo(b.x - b.w * 0.5, halfW * 1.1);
      ctx.lineTo(b.x + b.w * 0.5, halfW * 1.1);
      ctx.lineTo(b.x + b.w * 0.5 + 3, 0);
      ctx.lineTo(b.x + b.w * 0.5, -halfW * 1.1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Crimson saddle mark on protruding snout
    ctx.fillStyle = '#C91836';
    ctx.beginPath();
    ctx.ellipse(halfL * 0.78, 0, 5.5, 4.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Battle scars stitched across snout
    ctx.strokeStyle = '#FFE4C4';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(39, -3.2);
    ctx.lineTo(33, 2.8);
    ctx.moveTo(37.5, -2.5);
    ctx.lineTo(39.5, -0.5);
    ctx.moveTo(34.5, 0.2);
    ctx.lineTo(36.5, 2.2);
    ctx.stroke();

    // Dark cel-shade lower flank
    ctx.fillStyle = 'rgba(18, 8, 26, 0.34)';
    ctx.beginPath();
    ctx.ellipse(0, halfW * 0.58, halfL * 0.85, halfW * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();

    // Glossy highlight
    ctx.fillStyle = 'rgba(255, 232, 175, 0.32)';
    ctx.beginPath();
    ctx.ellipse(10, -halfW * 0.35, 14, 4.0, -0.15, 0, Math.PI * 2);
    ctx.fill();

    // Glowing gold rune glyph on nape
    ctx.strokeStyle = `rgba(255, 206, 68, ${0.55 + Math.sin(t * 4.2) * 0.25})`;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(14, -4);
    ctx.lineTo(10, 0);
    ctx.lineTo(14, 4);
    ctx.stroke();

    ctx.restore();

    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.4;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  _drawThornyWhipStreamer(ctx, sway, wag, t) {
    // Iconic long whip-like dorsal streamer with sharp thorns trailing back over the tail
    ctx.save();
    const w1 = Math.sin(this._whipPhase) * 6.5 + sway * 5;
    const w2 = Math.sin(this._whipPhase - 1.2) * 10.5 + wag * 12;
    const w3 = Math.sin(this._whipPhase - 2.3) * 14.0 + wag * 16;

    // Base dorsal fin mount
    ctx.fillStyle = '#E0B238';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.0;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.bezierCurveTo(-4, w1 * 0.6, -24, w2 * 0.85, -48, w3);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 4.6;
    ctx.stroke();

    ctx.strokeStyle = '#F2C94C';
    ctx.lineWidth = 2.4;
    ctx.stroke();

    // Wicked crimson thorns along the whip streamer
    const thornPts = [
      { x: -6,  y: w1 * 0.42, dir: -1 },
      { x: -18, y: w2 * 0.58, dir: 1 },
      { x: -30, y: w2 * 0.86, dir: -1 },
      { x: -40, y: w3 * 0.90, dir: 1 },
    ];
    ctx.fillStyle = '#D91A3C';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.2;
    for (const tp of thornPts) {
      ctx.beginPath();
      ctx.moveTo(tp.x + 2, tp.y);
      ctx.lineTo(tp.x - 4, tp.y + tp.dir * 6.5);
      ctx.lineTo(tp.x - 2.5, tp.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Glowing whip tip barb
    ctx.fillStyle = `rgba(255, 58, 92, ${0.8 + Math.sin(t * 7) * 0.2})`;
    ctx.beginPath();
    ctx.arc(-48, w3, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawSnoutFangs(ctx, halfL, mouth, t) {
    const mx = halfL * 0.92;
    const snap = this._state === 'eating' || this._state === 'hungry'
      ? Math.abs(Math.sin(t * 14)) * 0.45 + mouth * 0.55
      : mouth;

    if (snap > 0.2 || this._state === 'happy') {
      const w = 2.4 + snap * 3.4;
      ctx.save();
      ctx.fillStyle = '#240818';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(mx + 1, 0, 2.0 + snap * 2.2, w, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FFF7E8';
      for (const fy of [-w * 0.5, w * 0.5]) {
        ctx.beginPath();
        ctx.moveTo(mx + 0.5, fy - 1.0);
        ctx.lineTo(mx + 4.0 + snap, fy);
        ctx.lineTo(mx + 0.5, fy + 1.0);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
  }

  _drawIdolEyes(ctx, halfL, halfW, p, t) {
    const ex = halfL * 0.48;
    const ey = halfW * 0.36;

    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(ex, side * ey);

      if (this._state === 'stress') {
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 2.3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-2.5, -side * 2.5);
        ctx.lineTo(2.2, 0);
        ctx.lineTo(-2.5, side * 2.5);
        ctx.stroke();
        ctx.restore();
        continue;
      }

      const rx = 4.3 * (this._state === 'shock' ? 1.24 : 1.0);
      const ry = 3.8 * Math.max(0.45, Math.min(1.36, p.eye));

      ctx.fillStyle = OUTLINE;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx + 1.2, ry + 1.1, side * 0.14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFF6E0';
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, side * 0.14, 0, Math.PI * 2);
      ctx.fill();

      const ir = this._state === 'shock' ? 1.4 : 2.6;
      const ig = ctx.createRadialGradient(0.5, 0, 0.3, 0.5, 0, ir);
      ig.addColorStop(0, '#FFF280');
      ig.addColorStop(0.55, '#F29F05');
      ig.addColorStop(1, '#7A1C0A');
      ctx.fillStyle = ig;
      ctx.beginPath();
      ctx.arc(0.7, side * 0.25, ir, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = OUTLINE;
      ctx.beginPath();
      ctx.ellipse(0.9, side * 0.25, 0.9, ir * 0.78, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(1.7, side * 0.25 - 1.0, 1.0, 0, Math.PI * 2);
      ctx.arc(-0.4, side * 0.25 + 0.9, 0.55, 0, Math.PI * 2);
      ctx.fill();

      if (this._state === 'relax' || this._state === 'happy') {
        ctx.fillStyle = '#24182E';
        ctx.beginPath();
        ctx.ellipse(-0.9, 0, rx + 0.4, ry * 0.56, side * 0.14, Math.PI * 0.5, Math.PI * 1.5);
        ctx.fill();
      }

      const tilt = p.brow * 0.55;
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-4.3, -side * (2.6 - tilt * 2.5));
      ctx.lineTo(4.7, -side * (1.4 + tilt * 2.6));
      ctx.stroke();

      if (this._state === 'hungry' || this._state === 'eating') {
        ctx.strokeStyle = `rgba(255, 200, 50, ${0.65 + Math.sin(t * 14) * 0.3})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0.8, -4.6);
        ctx.lineTo(0.8, 4.6);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  _drawMoodFX(ctx, halfL, halfW, t) {
    if (this._state === 'happy') {
      for (let i = 0; i < 4; i++) {
        const a = t * 2.2 + i * 1.57;
        const sx = 6 + Math.cos(a) * (halfL * 0.65);
        const sy = Math.sin(a) * (halfW * 0.92);
        const r = 3.0 + Math.sin(t * 7 + i) * 0.9;
        ctx.fillStyle = i % 2 === 0 ? '#E81A45' : '#F5C43D';
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
      ctx.translate(halfL * 0.56, -halfW * 0.82);
      ctx.fillStyle = '#FF204E';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-2.1, -10.5, 4.2, 7.8, 1.5);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 1.4, 2.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (this._state === 'fear') {
      for (let i = 0; i < 2; i++) {
        const d = (t * 25 + i * 6) % 10;
        const x = 18 - i * 9;
        const y = -halfW * 0.72 - d * 0.55;
        ctx.fillStyle = '#7CE8FF';
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x, y - 3.6);
        ctx.quadraticCurveTo(x + 2.8, y + 1, x, y + 3.1);
        ctx.quadraticCurveTo(x - 2.8, y + 1, x, y - 3.6);
        ctx.fill();
        ctx.stroke();
      }
    } else if (this._state === 'stress') {
      const s = 1 + Math.sin(t * 20) * 0.18;
      ctx.save();
      ctx.translate(15, -halfW * 0.70);
      ctx.scale(s, s);
      ctx.strokeStyle = '#FF244C';
      ctx.lineWidth = 2.0;
      ctx.lineCap = 'round';
      for (let q = 0; q < 4; q++) {
        ctx.rotate(Math.PI * 0.5);
        ctx.beginPath();
        ctx.moveTo(1.8, 1.8);
        ctx.quadraticCurveTo(2.0, 4.6, 5.2, 4.9);
        ctx.stroke();
      }
      ctx.restore();
    } else if (this._state === 'sad') {
      const dy = (t * 14) % 7;
      ctx.fillStyle = '#72D6FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(halfL * 0.44, halfW * 0.56 + dy * 0.5);
      ctx.quadraticCurveTo(halfL * 0.44 + 2.5, halfW * 0.56 + 4 + dy * 0.5, halfL * 0.44, halfW * 0.56 + 5.7 + dy * 0.5);
      ctx.quadraticCurveTo(halfL * 0.44 - 2.5, halfW * 0.56 + 4 + dy * 0.5, halfL * 0.44, halfW * 0.56 + dy * 0.5);
      ctx.fill();
      ctx.stroke();
    }
  }
}

export default VillainMoorishidolfish;
