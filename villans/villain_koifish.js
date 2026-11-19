/**
 * Villain Kohaku Koi — Standalone 2D Top-Down Expressive Chibi Villain ES Module
 * Concept: Smoky ash-grey muscular body with blood-crimson demon-mask patches,
 * scar across eye, sharp glowing barbels, notched fins.
 */

const OUTLINE = '#140B1C';
const ONE_SHOTS = new Set(['left_turn', 'right_turn', 'eating', 'shock']);
const LOCK_BLOCKED = new Set(['left_turn', 'right_turn', 'relax', 'happy', 'eating']);
const ALIASES = { idle: 'breathing', hunger: 'hungry' };
const DURATIONS = { left_turn: 0.62, right_turn: 0.62, eating: 0.68, shock: 0.78 };

const POSES = {
  breathing:  { hz: 2.3, amp: 0.17, fin: 0.48, bend: 0.0,  mouth: 0.10, brow: 0.58, eye: 1.0,  aura: 0.56, jit: 0.0 },
  swimming:   { hz: 5.8, amp: 0.36, fin: 0.28, bend: 0.0,  mouth: 0.16, brow: 0.68, eye: 1.0,  aura: 0.78, jit: 0.0 },
  relax:      { hz: 1.3, amp: 0.10, fin: 0.68, bend: 0.0,  mouth: 0.06, brow: 0.30, eye: 0.46, aura: 0.42, jit: 0.0 },
  left_turn:  { hz: 5.2, amp: 0.28, fin: 0.62, bend: -0.58, mouth: 0.15, brow: 0.62, eye: 1.0,  aura: 0.72, jit: 0.0 },
  right_turn: { hz: 5.2, amp: 0.28, fin: 0.62, bend: 0.58,  mouth: 0.15, brow: 0.62, eye: 1.0,  aura: 0.72, jit: 0.0 },
  eating:     { hz: 7.2, amp: 0.28, fin: 0.66, bend: 0.0,  mouth: 1.0,  brow: 0.86, eye: 1.06, aura: 0.92, jit: 0.18 },
  hungry:     { hz: 4.8, amp: 0.24, fin: 0.54, bend: 0.0,  mouth: 0.74, brow: 0.90, eye: 1.14, aura: 0.95, jit: 0.14 },
  stress:     { hz: 8.4, amp: 0.15, fin: 0.38, bend: 0.0,  mouth: 0.34, brow: 0.95, eye: 0.28, aura: 0.84, jit: 1.25 },
  fear:       { hz: 9.6, amp: 0.23, fin: 0.80, bend: 0.0,  mouth: 0.54, brow: -0.45, eye: 1.35, aura: 0.24, jit: 1.48 },
  shock:      { hz: 1.6, amp: 0.06, fin: 0.90, bend: 0.0,  mouth: 0.84, brow: -0.60, eye: 1.48, aura: 0.22, jit: 1.72 },
  happy:      { hz: 4.8, amp: 0.32, fin: 0.76, bend: 0.0,  mouth: 0.62, brow: 0.40, eye: 0.72, aura: 1.0,  jit: 0.0 },
  sad:        { hz: 1.1, amp: 0.08, fin: 0.18, bend: 0.0,  mouth: 0.04, brow: -0.35, eye: 0.66, aura: 0.22, jit: 0.0 },
};

function cubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export class VillainKoifish {
  static metadata = {
    name: 'Villain Kohaku Koi',
    category: 'villain_fish',
    baseLength: 145,
    baseWidth: 58,
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
    const halfL = VillainKoifish.metadata.baseLength * 0.5;
    const halfW = VillainKoifish.metadata.baseWidth * 0.5;

    const wag = Math.sin(this._phase) * p.amp + p.bend * 0.65;
    const sway = Math.sin(this._phase - 0.8) * p.amp * 0.28 + p.bend * 0.34;
    const jx = p.jit > 0 ? Math.sin(t * 56) * p.jit * 1.25 : 0;
    const jy = p.jit > 0 ? Math.cos(t * 62) * p.jit * 1.4 : 0;

    ctx.save();
    ctx.translate(this.x + jx, this.y + jy);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Smoky ink & blood-crimson oni aura
    this._drawOniAura(ctx, halfL, halfW, p.aura, t);

    // 2. Broad notched koi pectoral fins (smoky ash with crimson war markings)
    this._drawKoiPectoral(ctx, 20, -halfW * 0.66, -1, p.fin);
    this._drawKoiPectoral(ctx, 20, halfW * 0.66, 1, p.fin);

    // 3. Smaller notched pelvic fins
    this._drawKoiPelvic(ctx, -12, -halfW * 0.44 + sway * 5, -1, p.fin);
    this._drawKoiPelvic(ctx, -12, halfW * 0.44 + sway * 5, 1, p.fin);

    // 4. Sweeping notched koi tail
    this._drawKoiTail(ctx, -halfL * 0.62, sway * 11, wag);

    // 5. Sharp glowing crimson-tipped koi barbels (whiskers)
    this._drawGlowingBarbels(ctx, halfL, t);

    // 6. Muscular smoky ash-grey koi body with blood-crimson demon-mask patches
    this._drawKoiBody(ctx, halfL, halfW, sway, t);

    // 7. Flowing dorsal ridge
    this._drawKoiDorsal(ctx, sway, wag);

    // 8. Snapping fanged koi maw
    this._drawKoiMouth(ctx, halfL, p.mouth, t);

    // 9. Expressive villain eyes + battle scar across left eye
    this._drawKoiEyes(ctx, halfL, halfW, p, t);

    // 10. Mood FX
    this._drawMoodFX(ctx, halfL, halfW, t);

    ctx.restore();
  }

  _drawOniAura(ctx, halfL, halfW, aura, t) {
    const r = halfL * (1.04 + Math.sin(t * 2.0) * 0.04);
    const g = ctx.createRadialGradient(-4, 0, 10, -4, 0, r);
    g.addColorStop(0, `rgba(22, 10, 26, ${0.48 * aura})`);
    g.addColorStop(0.55, `rgba(182, 14, 34, ${0.22 * aura})`);
    g.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(-4, 0, r, halfW * 1.22, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawKoiPectoral(ctx, ox, oy, side, fin) {
    ctx.save();
    ctx.translate(ox, oy);
    const flut = Math.sin(this._phase * 0.85 + side) * 0.16;
    ctx.rotate(side * (0.26 + fin * 0.52 + flut));

    const g = ctx.createLinearGradient(0, 0, -14, side * 26);
    g.addColorStop(0, '#A5A8B5');
    g.addColorStop(0.55, '#595C6B');
    g.addColorStop(1, '#1B1424');

    ctx.fillStyle = g;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.2;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.quadraticCurveTo(8, side * 20, -6, side * 27);
    ctx.lineTo(-9, side * 19);
    ctx.lineTo(-16, side * 23);
    ctx.quadraticCurveTo(-20, side * 12, -10, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Blood-crimson war streak on pectoral
    ctx.fillStyle = '#C91632';
    ctx.beginPath();
    ctx.moveTo(4, side * 5);
    ctx.lineTo(-4, side * 19);
    ctx.lineTo(-7, side * 13);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  _drawKoiPelvic(ctx, ox, oy, side, fin) {
    ctx.save();
    ctx.translate(ox, oy);
    ctx.rotate(side * (0.4 + fin * 0.35));
    ctx.fillStyle = '#4B4E5E';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(4, 0);
    ctx.quadraticCurveTo(0, side * 11, -8, side * 13);
    ctx.lineTo(-9, side * 8);
    ctx.lineTo(-12, side * 9);
    ctx.quadraticCurveTo(-11, side * 3, -5, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  _drawKoiTail(ctx, tx, ty, wag) {
    ctx.save();
    ctx.translate(tx, ty * 0.45);
    ctx.rotate(wag * 0.88);

    const g = ctx.createLinearGradient(0, 0, -32, 0);
    g.addColorStop(0, '#787B8C');
    g.addColorStop(0.55, '#B81430');
    g.addColorStop(1, '#1A0D20');

    ctx.fillStyle = g;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.3;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(3, -6.5);
    ctx.quadraticCurveTo(-12, -18, -30, -23);
    ctx.lineTo(-22, -11);
    ctx.lineTo(-28, -5);
    ctx.lineTo(-20, 0);
    ctx.lineTo(-28, 5);
    ctx.lineTo(-22, 11);
    ctx.lineTo(-30, 23);
    ctx.quadraticCurveTo(-12, 18, 3, 6.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  _drawGlowingBarbels(ctx, halfL, t) {
    const wave = Math.sin(t * 5.2) * 3.0;
    const pulse = 0.78 + Math.sin(t * 6.5) * 0.22;

    for (const side of [-1, 1]) {
      ctx.save();
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 4.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(halfL * 0.78, side * 7);
      ctx.quadraticCurveTo(halfL * 0.94, side * (16 + wave * 0.4), halfL * 0.86, side * (25 + wave));
      ctx.stroke();

      ctx.strokeStyle = `rgba(255, 56, 78, ${pulse})`;
      ctx.lineWidth = 2.0;
      ctx.stroke();

      // Razor glowing tip
      ctx.fillStyle = '#FFE08A';
      ctx.beginPath();
      ctx.arc(halfL * 0.86, side * (25 + wave), 1.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  _drawKoiBody(ctx, halfL, halfW, sway, t) {
    const sy = sway * 8.0;
    ctx.save();
    ctx.beginPath();
    // Muscular front-heavy chibi koi torpedo
    ctx.moveTo(halfL * 0.86, 0);
    ctx.bezierCurveTo(halfL * 0.80, -halfW * 0.86, halfL * 0.22, -halfW * 0.92, -halfL * 0.22, -halfW * 0.56 + sy * 0.42);
    ctx.quadraticCurveTo(-halfL * 0.50, -halfW * 0.30 + sy, -halfL * 0.64, -halfW * 0.18 + sy);
    ctx.lineTo(-halfL * 0.64, halfW * 0.18 + sy);
    ctx.quadraticCurveTo(-halfL * 0.50, halfW * 0.30 + sy, -halfL * 0.22, halfW * 0.56 + sy * 0.42);
    ctx.bezierCurveTo(halfL * 0.22, halfW * 0.92, halfL * 0.80, halfW * 0.86, halfL * 0.86, 0);
    ctx.closePath();

    // Smoky ash-grey base
    const bg = ctx.createLinearGradient(halfL, -halfW, -halfL * 0.6, halfW);
    bg.addColorStop(0, '#B8BCC9');
    bg.addColorStop(0.45, '#7F8394');
    bg.addColorStop(0.82, '#4A4C5E');
    bg.addColorStop(1, '#231F30');
    ctx.fillStyle = bg;
    ctx.fill();

    ctx.save();
    ctx.clip();

    // Subtle smoky muscular scale arcs
    ctx.strokeStyle = 'rgba(26, 18, 36, 0.26)';
    ctx.lineWidth = 1.1;
    for (let sx = 28; sx >= -34; sx -= 8) {
      for (let syOff = -16; syOff <= 16; syOff += 8) {
        ctx.beginPath();
        ctx.arc(sx, syOff, 4.2, -Math.PI * 0.5, Math.PI * 0.5);
        ctx.stroke();
      }
    }

    // Blood-crimson demon-mask (Kohaku Oni) patch 1 on head/forehead
    ctx.fillStyle = '#C91430';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(50, 0);
    ctx.lineTo(36, -13);
    ctx.lineTo(28, -5);
    ctx.lineTo(22, -11);
    ctx.lineTo(25, 0);
    ctx.lineTo(22, 11);
    ctx.lineTo(28, 5);
    ctx.lineTo(36, 13);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Blood-crimson demon-mask patch 2 across mid-back (horned oni silhouette)
    ctx.beginPath();
    ctx.moveTo(14, -6);
    ctx.bezierCurveTo(6, -24, -12, -22, -16, -8 + sy * 0.3);
    ctx.lineTo(-6, -3 + sy * 0.2);
    ctx.lineTo(-18, 2 + sy * 0.35);
    ctx.bezierCurveTo(-12, 22, 8, 20, 14, 6);
    ctx.lineTo(6, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Blood-crimson patch 3 near tail peduncle
    ctx.beginPath();
    ctx.ellipse(-30, sy * 0.72, 10, 8, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Dark cel-shade lower flank
    ctx.fillStyle = 'rgba(18, 8, 26, 0.34)';
    ctx.beginPath();
    ctx.ellipse(4, halfW * 0.64, halfL * 0.85, halfW * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();

    // Glossy specular sheen
    ctx.fillStyle = 'rgba(242, 245, 255, 0.32)';
    ctx.beginPath();
    ctx.ellipse(14, -halfW * 0.36, 26, 5.8, -0.1, 0, Math.PI * 2);
    ctx.fill();

    // Faint glowing crimson forehead ember mark
    ctx.fillStyle = `rgba(255, 195, 72, ${0.65 + Math.sin(t * 4.8) * 0.25})`;
    ctx.beginPath();
    ctx.arc(36, 0, 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.6;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  _drawKoiDorsal(ctx, sway, wag) {
    ctx.save();
    ctx.fillStyle = '#332C3F';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.9;
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.quadraticCurveTo(-4, -4.5 + sway * 3, -34, wag * 7);
    ctx.quadraticCurveTo(-4, 4.5 + sway * 3, 16, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#D91A38';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.quadraticCurveTo(-8, sway * 2.5, -31, wag * 6.5);
    ctx.stroke();
    ctx.restore();
  }

  _drawKoiMouth(ctx, halfL, mouth, t) {
    const mx = halfL * 0.82;
    const snap = this._state === 'eating' || this._state === 'hungry'
      ? Math.abs(Math.sin(t * 13)) * 0.45 + mouth * 0.55
      : mouth;

    if (snap > 0.2 || this._state === 'happy') {
      const w = 3.6 + snap * 5.0;
      ctx.save();
      ctx.fillStyle = '#240718';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.7;
      ctx.beginPath();
      ctx.ellipse(mx + 1.5, 0, 2.5 + snap * 3.0, w, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FFF5F0';
      for (const fy of [-w * 0.55, 0, w * 0.55]) {
        ctx.beginPath();
        ctx.moveTo(mx + 0.8, fy - 1.4);
        ctx.lineTo(mx + 5.2 + snap * 1.4, fy);
        ctx.lineTo(mx + 0.8, fy + 1.4);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
  }

  _drawKoiEyes(ctx, halfL, halfW, p, t) {
    const ex = halfL * 0.56;
    const ey = halfW * 0.44;

    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(ex, side * ey);

      if (this._state === 'stress') {
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 2.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-3.0, -side * 3.0);
        ctx.lineTo(2.6, 0);
        ctx.lineTo(-3.0, side * 3.0);
        ctx.stroke();
        ctx.restore();
        continue;
      }

      const rx = 5.0 * (this._state === 'shock' ? 1.24 : 1.0);
      const ry = 4.4 * Math.max(0.45, Math.min(1.36, p.eye));

      ctx.fillStyle = OUTLINE;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx + 1.4, ry + 1.2, side * 0.14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFF4EE';
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, side * 0.14, 0, Math.PI * 2);
      ctx.fill();

      const ir = this._state === 'shock' ? 1.6 : 3.0;
      const ig = ctx.createRadialGradient(0.5, 0, 0.3, 0.5, 0, ir);
      ig.addColorStop(0, '#FFD452');
      ig.addColorStop(0.55, '#E61E3C');
      ig.addColorStop(1, '#5A0618');
      ctx.fillStyle = ig;
      ctx.beginPath();
      ctx.arc(0.8, side * 0.3, ir, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = OUTLINE;
      ctx.beginPath();
      ctx.ellipse(1.0, side * 0.3, 1.0, ir * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(1.9, side * 0.3 - 1.2, 1.15, 0, Math.PI * 2);
      ctx.arc(-0.5, side * 0.3 + 1.1, 0.6, 0, Math.PI * 2);
      ctx.fill();

      if (this._state === 'relax' || this._state === 'happy') {
        ctx.fillStyle = '#38384A';
        ctx.beginPath();
        ctx.ellipse(-1.0, 0, rx + 0.5, ry * 0.56, side * 0.14, Math.PI * 0.5, Math.PI * 1.5);
        ctx.fill();
      }

      // Dramatic diagonal battle scar slicing across the left (-1) eye!
      if (side === -1) {
        ctx.strokeStyle = '#FF2A4A';
        ctx.lineWidth = 2.0;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-6.5, -5.5);
        ctx.lineTo(6.5, 5.5);
        ctx.stroke();
        ctx.strokeStyle = '#FFE4D8';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-6.0, -5.2);
        ctx.lineTo(6.0, 5.2);
        ctx.stroke();
      }

      const tilt = p.brow * 0.55;
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-5.0, -side * (3.2 - tilt * 2.8));
      ctx.lineTo(5.6, -side * (1.6 + tilt * 2.9));
      ctx.stroke();

      if (this._state === 'hungry' || this._state === 'eating') {
        ctx.strokeStyle = `rgba(255, 65, 85, ${0.65 + Math.sin(t * 14) * 0.3})`;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(1.0, -5.5);
        ctx.lineTo(1.0, 5.5);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  _drawMoodFX(ctx, halfL, halfW, t) {
    if (this._state === 'happy') {
      for (let i = 0; i < 4; i++) {
        const a = t * 2.1 + i * 1.57;
        const sx = 8 + Math.cos(a) * (halfL * 0.62);
        const sy = Math.sin(a) * (halfW * 0.98);
        const r = 3.5 + Math.sin(t * 7 + i) * 1.1;
        ctx.fillStyle = i % 2 === 0 ? '#E61C42' : '#9B30FF';
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
      ctx.translate(halfL * 0.62, -halfW * 0.92);
      ctx.fillStyle = '#FF204E';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.roundRect(-2.4, -12, 4.8, 9.0, 1.6);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 1.8, 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (this._state === 'fear') {
      for (let i = 0; i < 2; i++) {
        const d = (t * 25 + i * 7) % 11;
        const x = 32 - i * 12;
        const y = -halfW * 0.80 - d * 0.6;
        ctx.fillStyle = '#7CE8FF';
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(x, y - 4.2);
        ctx.quadraticCurveTo(x + 3.2, y + 1.2, x, y + 3.6);
        ctx.quadraticCurveTo(x - 3.2, y + 1.2, x, y - 4.2);
        ctx.fill();
        ctx.stroke();
      }
    } else if (this._state === 'stress') {
      const s = 1 + Math.sin(t * 20) * 0.18;
      ctx.save();
      ctx.translate(28, -halfW * 0.78);
      ctx.scale(s, s);
      ctx.strokeStyle = '#FF244C';
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      for (let q = 0; q < 4; q++) {
        ctx.rotate(Math.PI * 0.5);
        ctx.beginPath();
        ctx.moveTo(2.1, 2.1);
        ctx.quadraticCurveTo(2.3, 5.2, 6.0, 5.6);
        ctx.stroke();
      }
      ctx.restore();
    } else if (this._state === 'sad') {
      const dy = (t * 14) % 8;
      ctx.fillStyle = '#72D6FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(halfL * 0.52, halfW * 0.64 + dy * 0.5);
      ctx.quadraticCurveTo(halfL * 0.52 + 2.8, halfW * 0.64 + 4.5 + dy * 0.5, halfL * 0.52, halfW * 0.64 + 6.5 + dy * 0.5);
      ctx.quadraticCurveTo(halfL * 0.52 - 2.8, halfW * 0.64 + 4.5 + dy * 0.5, halfL * 0.52, halfW * 0.64 + dy * 0.5);
      ctx.fill();
      ctx.stroke();
    }
  }
}

export default VillainKoifish;
