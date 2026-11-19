/**
 * Villain Tiger Shark — Standalone 2D Top-Down Expressive Chibi Villain ES Module
 * Concept: Dark charcoal-bronze body with jagged blazing-ember tiger stripes,
 * scarred blunt snout with protruding fangs, tattered crescent tail.
 */

const OUTLINE = '#140B1C';
const ONE_SHOTS = new Set(['left_turn', 'right_turn', 'eating', 'shock']);
const LOCK_BLOCKED = new Set(['left_turn', 'right_turn', 'relax', 'happy', 'eating']);
const ALIASES = { idle: 'breathing', hunger: 'hungry' };
const DURATIONS = { left_turn: 0.66, right_turn: 0.66, eating: 0.72, shock: 0.78 };

const POSES = {
  breathing:  { hz: 2.0, amp: 0.16, fin: 0.44, bend: 0.0,  mouth: 0.20, brow: 0.64, eye: 1.0,  aura: 0.62, jit: 0.0 },
  swimming:   { hz: 5.0, amp: 0.36, fin: 0.24, bend: 0.0,  mouth: 0.28, brow: 0.74, eye: 1.0,  aura: 0.85, jit: 0.0 },
  relax:      { hz: 1.2, amp: 0.10, fin: 0.64, bend: 0.0,  mouth: 0.12, brow: 0.34, eye: 0.46, aura: 0.44, jit: 0.0 },
  left_turn:  { hz: 4.5, amp: 0.28, fin: 0.56, bend: -0.56, mouth: 0.24, brow: 0.68, eye: 1.0,  aura: 0.76, jit: 0.0 },
  right_turn: { hz: 4.5, amp: 0.28, fin: 0.56, bend: 0.56,  mouth: 0.24, brow: 0.68, eye: 1.0,  aura: 0.76, jit: 0.0 },
  eating:     { hz: 6.5, amp: 0.28, fin: 0.64, bend: 0.0,  mouth: 1.0,  brow: 0.90, eye: 1.08, aura: 1.0,  jit: 0.22 },
  hungry:     { hz: 4.3, amp: 0.24, fin: 0.52, bend: 0.0,  mouth: 0.78, brow: 0.92, eye: 1.15, aura: 0.98, jit: 0.16 },
  stress:     { hz: 7.9, amp: 0.15, fin: 0.36, bend: 0.0,  mouth: 0.40, brow: 0.96, eye: 0.28, aura: 0.88, jit: 1.38 },
  fear:       { hz: 9.1, amp: 0.22, fin: 0.78, bend: 0.0,  mouth: 0.58, brow: -0.45, eye: 1.36, aura: 0.25, jit: 1.62 },
  shock:      { hz: 1.5, amp: 0.06, fin: 0.88, bend: 0.0,  mouth: 0.86, brow: -0.60, eye: 1.48, aura: 0.22, jit: 1.88 },
  happy:      { hz: 4.3, amp: 0.32, fin: 0.72, bend: 0.0,  mouth: 0.68, brow: 0.44, eye: 0.72, aura: 1.0,  jit: 0.0 },
  sad:        { hz: 1.0, amp: 0.08, fin: 0.18, bend: 0.0,  mouth: 0.06, brow: -0.35, eye: 0.66, aura: 0.24, jit: 0.0 },
};

function cubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export class VillainTigersharkfish {
  static metadata = {
    name: 'Villain Tiger Shark',
    category: 'villain_fish',
    baseLength: 220,
    baseWidth: 88,
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
    const halfL = VillainTigersharkfish.metadata.baseLength * 0.5;
    const halfW = VillainTigersharkfish.metadata.baseWidth * 0.5;

    const wag = Math.sin(this._phase) * p.amp + p.bend * 0.62;
    const sway = Math.sin(this._phase - 0.84) * p.amp * 0.28 + p.bend * 0.34;
    const jx = p.jit > 0 ? Math.sin(t * 55) * p.jit * 1.45 : 0;
    const jy = p.jit > 0 ? Math.cos(t * 61) * p.jit * 1.65 : 0;

    ctx.save();
    ctx.translate(this.x + jx, this.y + jy);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Charcoal-bronze & blazing-ember aura
    this._drawTigerAura(ctx, halfL, halfW, p.aura, t);

    // 2. Battle-tattered shark pectorals with ember war-stripes
    this._drawTigerPectoral(ctx, 20, -24, -1, p.fin);
    this._drawTigerPectoral(ctx, 20, 24, 1, p.fin);

    // 3. Notched pelvic fins
    this._drawTigerPelvic(ctx, -30, -14 + sway * 8, -1);
    this._drawTigerPelvic(ctx, -30, 14 + sway * 8, 1);

    // 4. Tattered crescent tail
    this._drawTatteredCrescentTail(ctx, -halfL * 0.66, sway * 15, wag, t);

    // 5. Dark charcoal-bronze muscular body with jagged blazing-ember tiger stripes & scarred blunt snout
    this._drawTigerBody(ctx, halfL, halfW, sway, t);

    // 6. Notched dorsal fin
    this._drawTigerDorsal(ctx, sway, wag);

    // 7. Always-visible protruding fangs along scarred blunt snout (amplified when snapping!)
    this._drawProtrudingFangs(ctx, halfL, p.mouth, t);

    // 8. Blazing ember-gold villain eyes with V-brows
    this._drawTigerEyes(ctx, halfL, p, t);

    // 9. Mood FX
    this._drawMoodFX(ctx, halfL, halfW, t);

    ctx.restore();
  }

  _drawTigerAura(ctx, halfL, halfW, aura, t) {
    const r = halfL * (1.05 + Math.sin(t * 2.0) * 0.04);
    const g = ctx.createRadialGradient(-5, 0, 15, -5, 0, r);
    g.addColorStop(0, `rgba(28, 12, 16, ${0.50 * aura})`);
    g.addColorStop(0.55, `rgba(235, 92, 18, ${0.24 * aura})`);
    g.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(-5, 0, r, halfW * 1.15, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawTigerPectoral(ctx, ox, oy, side, fin) {
    ctx.save();
    ctx.translate(ox, oy);
    const flut = Math.sin(this._phase * 0.82 + side) * 0.11;
    ctx.rotate(side * (0.15 + fin * 0.26 + flut));

    const g = ctx.createLinearGradient(12, 0, -22, side * 42);
    g.addColorStop(0, '#59463B');
    g.addColorStop(0.55, '#2E2324');
    g.addColorStop(1, '#140D1B');

    ctx.fillStyle = g;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.6;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.quadraticCurveTo(9, side * 24, -22, side * 44);
    // Battle-tattered notches
    ctx.lineTo(-19, side * 31);
    ctx.lineTo(-27, side * 26);
    ctx.lineTo(-18, side * 16);
    ctx.lineTo(-24, side * 11);
    ctx.lineTo(-18, side * 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Blazing ember stripe on pectoral
    ctx.strokeStyle = '#FF6418';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(4, side * 9);
    ctx.lineTo(-12, side * 25);
    ctx.stroke();
    ctx.restore();
  }

  _drawTigerPelvic(ctx, ox, oy, side) {
    ctx.save();
    ctx.translate(ox, oy);
    ctx.fillStyle = '#332728';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(7, 0);
    ctx.quadraticCurveTo(-1, side * 14, -13, side * 18);
    ctx.lineTo(-11, side * 9);
    ctx.lineTo(-15, side * 6);
    ctx.lineTo(-9, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  _drawTatteredCrescentTail(ctx, tx, ty, wag, t) {
    ctx.save();
    ctx.translate(tx, ty * 0.45);
    ctx.rotate(wag * 0.86);

    const g = ctx.createLinearGradient(0, 0, -42, 0);
    g.addColorStop(0, '#4F3E34');
    g.addColorStop(0.55, '#271E22');
    g.addColorStop(1, '#120B1C');

    ctx.fillStyle = g;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.7;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(4, -6.5);
    ctx.quadraticCurveTo(-13, -21, -41, -35);
    // Heavily tattered battle-worn crescent trailing edge
    ctx.lineTo(-28, -20);
    ctx.lineTo(-35, -14);
    ctx.lineTo(-24, -8);
    ctx.lineTo(-30, -3);
    ctx.lineTo(-20, 0);
    ctx.lineTo(-30, 3);
    ctx.lineTo(-24, 8);
    ctx.lineTo(-35, 14);
    ctx.lineTo(-28, 20);
    ctx.lineTo(-41, 35);
    ctx.quadraticCurveTo(-13, 21, 4, 6.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Blazing ember edge glow
    ctx.strokeStyle = `rgba(255, 108, 24, ${0.65 + Math.sin(t * 5) * 0.25})`;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-24, -22);
    ctx.lineTo(-39, -33);
    ctx.moveTo(-24, 22);
    ctx.lineTo(-39, 33);
    ctx.stroke();
    ctx.restore();
  }

  _drawTigerBody(ctx, halfL, halfW, sway, t) {
    const sy = sway * 13.5;
    const bodyW = halfW * 0.70;

    ctx.save();
    ctx.beginPath();
    // Blunt broad tiger shark snout + muscular chunky chibi torso
    ctx.moveTo(halfL * 0.86, -12);
    ctx.quadraticCurveTo(halfL * 0.92, 0, halfL * 0.86, 12);
    ctx.bezierCurveTo(halfL * 0.74, bodyW * 0.96, halfL * 0.16, bodyW * 1.04, -halfL * 0.24, bodyW * 0.60 + sy * 0.42);
    ctx.quadraticCurveTo(-halfL * 0.54, bodyW * 0.30 + sy, -halfL * 0.68, bodyW * 0.18 + sy);
    ctx.lineTo(-halfL * 0.68, -bodyW * 0.18 + sy);
    ctx.quadraticCurveTo(-halfL * 0.54, -bodyW * 0.30 + sy, -halfL * 0.24, -bodyW * 0.60 + sy * 0.42);
    ctx.bezierCurveTo(halfL * 0.16, -bodyW * 1.04, halfL * 0.74, -bodyW * 0.96, halfL * 0.86, -12);
    ctx.closePath();

    // Dark charcoal-bronze metallic gradient
    const bg = ctx.createLinearGradient(halfL * 0.9, -bodyW, -halfL * 0.7, bodyW);
    bg.addColorStop(0, '#6B5544');
    bg.addColorStop(0.40, '#3F312D');
    bg.addColorStop(0.78, '#231A22');
    bg.addColorStop(1, '#140D1B');
    ctx.fillStyle = bg;
    ctx.fill();

    ctx.save();
    ctx.clip();

    // Jagged blazing-ember tiger stripes along both flanks!
    const emberPulse = 0.78 + Math.sin(t * 5.0) * 0.22;
    const stripeXs = [36, 20, 4, -12, -28, -44, -58];
    for (let i = 0; i < stripeXs.length; i++) {
      const sx = stripeXs[i];
      const depth = i < 4 ? 19 : 13;
      for (const side of [-1, 1]) {
        ctx.fillStyle = '#140B1C';
        ctx.strokeStyle = `rgba(255, 112, 20, ${emberPulse})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(sx + 4, side * bodyW * 1.1);
        ctx.lineTo(sx - 2, side * (bodyW * 0.62));
        ctx.lineTo(sx + 3, side * (bodyW * 0.42));
        ctx.lineTo(sx - 5, side * (bodyW - depth));
        ctx.lineTo(sx - 9, side * (bodyW * 0.55));
        ctx.lineTo(sx - 5, side * bodyW * 1.1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    // 5 glowing ember gill slits per side
    for (const side of [-1, 1]) {
      for (let g = 0; g < 5; g++) {
        const gx = 46 - g * 5.8;
        ctx.strokeStyle = `rgba(255, 128, 28, ${emberPulse})`;
        ctx.lineWidth = 1.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(gx + 1.2, side * 24);
        ctx.lineTo(gx - 1.2, side * 16);
        ctx.stroke();
      }
    }

    // Criss-cross battle scars across blunt snout
    ctx.strokeStyle = '#FF6A24';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(86, -12);
    ctx.lineTo(68, 6);
    ctx.moveTo(84, 8);
    ctx.lineTo(70, -8);
    ctx.stroke();
    ctx.strokeStyle = '#FFE2C2';
    ctx.lineWidth = 0.85;
    ctx.beginPath();
    ctx.moveTo(85, -11);
    ctx.lineTo(69, 5);
    ctx.stroke();

    // Dark cel-shade lower flank
    ctx.fillStyle = 'rgba(16, 6, 22, 0.34)';
    ctx.beginPath();
    ctx.ellipse(4, bodyW * 0.68, halfL * 0.84, bodyW * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bronze-charcoal specular highlight
    ctx.fillStyle = 'rgba(255, 224, 192, 0.25)';
    ctx.beginPath();
    ctx.ellipse(22, -bodyW * 0.36, 38, 6.8, -0.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.9;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  _drawTigerDorsal(ctx, sway, wag) {
    ctx.save();
    ctx.fillStyle = '#312525';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.4;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.quadraticCurveTo(2, -6.8 + sway * 3, -24, -4.0 + sway * 6);
    ctx.lineTo(-18, -1 + sway * 5);
    ctx.lineTo(-30, wag * 9);
    ctx.lineTo(-18, 1 + sway * 5);
    ctx.lineTo(-24, 4.0 + sway * 6);
    ctx.quadraticCurveTo(2, 6.8 + sway * 3, 18, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#FF6E1E';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(-26, wag * 8);
    ctx.stroke();
    ctx.restore();
  }

  _drawProtrudingFangs(ctx, halfL, mouth, t) {
    const mx = halfL * 0.85;
    const snap = this._state === 'eating' || this._state === 'hungry'
      ? Math.abs(Math.sin(t * 13)) * 0.45 + mouth * 0.55
      : mouth;

    ctx.save();
    if (snap > 0.22 || this._state === 'happy') {
      const w = 7.0 + snap * 8.5;
      ctx.fillStyle = '#330816';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.ellipse(mx + 2, 0, 4.0 + snap * 4.5, w, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Protruding overbite tiger-shark fangs always visible on the blunt snout!
    ctx.fillStyle = '#FFF7EB';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.2;
    const fangYs = [-11, -5.5, 0, 5.5, 11];
    for (let i = 0; i < fangYs.length; i++) {
      const fy = fangYs[i];
      const fLen = (i === 0 || i === 4 ? 7.5 : 5.5) + snap * 3.0;
      ctx.beginPath();
      ctx.moveTo(mx + 1, fy - 2.1);
      ctx.lineTo(mx + 2 + fLen, fy);
      ctx.lineTo(mx + 1, fy + 2.1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawTigerEyes(ctx, halfL, p, t) {
    const ex = halfL * 0.60;
    const ey = 17.5;

    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(ex, side * ey);

      if (this._state === 'stress') {
        ctx.strokeStyle = '#FF6E1E';
        ctx.lineWidth = 3.0;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-3.8, -side * 3.8);
        ctx.lineTo(3.4, 0);
        ctx.lineTo(-3.8, side * 3.8);
        ctx.stroke();
        ctx.restore();
        continue;
      }

      const rx = 5.9 * (this._state === 'shock' ? 1.24 : 1.0);
      const ry = 5.1 * Math.max(0.45, Math.min(1.36, p.eye));

      ctx.fillStyle = OUTLINE;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx + 1.7, ry + 1.5, side * 0.14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFF5E6';
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, side * 0.14, 0, Math.PI * 2);
      ctx.fill();

      // Blazing tiger-ember iris
      const ir = this._state === 'shock' ? 1.9 : 3.6;
      const ig = ctx.createRadialGradient(0.6, 0, 0.4, 0.6, 0, ir);
      ig.addColorStop(0, '#FFF67A');
      ig.addColorStop(0.5, '#FF6800');
      ig.addColorStop(1, '#780D08');
      ctx.fillStyle = ig;
      ctx.beginPath();
      ctx.arc(0.9, side * 0.35, ir, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = OUTLINE;
      ctx.beginPath();
      ctx.ellipse(1.1, side * 0.35, 1.2, ir * 0.82, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(2.2, side * 0.35 - 1.4, 1.35, 0, Math.PI * 2);
      ctx.arc(-0.55, side * 0.35 + 1.3, 0.7, 0, Math.PI * 2);
      ctx.fill();

      if (this._state === 'relax' || this._state === 'happy') {
        ctx.fillStyle = '#3B2C28';
        ctx.beginPath();
        ctx.ellipse(-1.1, 0, rx + 0.55, ry * 0.56, side * 0.14, Math.PI * 0.5, Math.PI * 1.5);
        ctx.fill();
      }

      const tilt = p.brow * 0.58;
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 3.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-6.2, -side * (3.8 - tilt * 3.3));
      ctx.lineTo(6.8, -side * (1.9 + tilt * 3.5));
      ctx.stroke();

      if (this._state === 'hungry' || this._state === 'eating') {
        ctx.strokeStyle = `rgba(255, 165, 36, ${0.7 + Math.sin(t * 14) * 0.3})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(1.1, -6.6);
        ctx.lineTo(1.1, 6.6);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  _drawMoodFX(ctx, halfL, halfW, t) {
    if (this._state === 'happy') {
      for (let i = 0; i < 4; i++) {
        const a = t * 2.0 + i * 1.57;
        const sx = 12 + Math.cos(a) * (halfL * 0.62);
        const sy = Math.sin(a) * (halfW * 0.88);
        const r = 4.4 + Math.sin(t * 7 + i) * 1.3;
        ctx.fillStyle = i % 2 === 0 ? '#FF6A14' : '#C9184A';
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
      ctx.translate(halfL * 0.66, -halfW * 0.78);
      ctx.fillStyle = '#FF204E';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.1;
      ctx.beginPath();
      ctx.roundRect(-3.0, -15, 6.0, 11.2, 1.9);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 2.3, 3.0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (this._state === 'fear') {
      for (let i = 0; i < 2; i++) {
        const d = (t * 25 + i * 8) % 13;
        const x = 58 - i * 17;
        const y = -halfW * 0.68 - d * 0.68;
        ctx.fillStyle = '#7CE8FF';
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, y - 5.2);
        ctx.quadraticCurveTo(x + 4.0, y + 1.4, x, y + 4.5);
        ctx.quadraticCurveTo(x - 4.0, y + 1.4, x, y - 5.2);
        ctx.fill();
        ctx.stroke();
      }
    } else if (this._state === 'stress') {
      const s = 1 + Math.sin(t * 20) * 0.18;
      ctx.save();
      ctx.translate(54, -halfW * 0.66);
      ctx.scale(s, s);
      ctx.strokeStyle = '#FF244C';
      ctx.lineWidth = 2.9;
      ctx.lineCap = 'round';
      for (let q = 0; q < 4; q++) {
        ctx.rotate(Math.PI * 0.5);
        ctx.beginPath();
        ctx.moveTo(2.5, 2.5);
        ctx.quadraticCurveTo(2.9, 6.4, 7.5, 6.9);
        ctx.stroke();
      }
      ctx.restore();
    } else if (this._state === 'sad') {
      const dy = (t * 14) % 9;
      ctx.fillStyle = '#72D6FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(halfL * 0.56, 30 + dy * 0.6);
      ctx.quadraticCurveTo(halfL * 0.56 + 3.4, 36 + dy * 0.6, halfL * 0.56, 39 + dy * 0.6);
      ctx.quadraticCurveTo(halfL * 0.56 - 3.4, 36 + dy * 0.6, halfL * 0.56, 30 + dy * 0.6);
      ctx.fill();
      ctx.stroke();
    }
  }
}

export default VillainTigersharkfish;
