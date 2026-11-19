/**
 * Villain Great White Shark — Standalone 2D Top-Down Expressive Chibi Villain ES Module
 * Concept: Armored gunmetal-black muscular torpedo with glowing crimson battle scars
 * across snout, 5 glowing red gill slits per side, spiked iron fin bands, jagged crescent tail.
 */

const OUTLINE = '#140B1C';
const ONE_SHOTS = new Set(['left_turn', 'right_turn', 'eating', 'shock']);
const LOCK_BLOCKED = new Set(['left_turn', 'right_turn', 'relax', 'happy', 'eating']);
const ALIASES = { idle: 'breathing', hunger: 'hungry' };
const DURATIONS = { left_turn: 0.68, right_turn: 0.68, eating: 0.72, shock: 0.80 };

const POSES = {
  breathing:  { hz: 1.9, amp: 0.15, fin: 0.42, bend: 0.0,  mouth: 0.18, brow: 0.64, eye: 1.0,  aura: 0.62, jit: 0.0 },
  swimming:   { hz: 4.8, amp: 0.34, fin: 0.24, bend: 0.0,  mouth: 0.26, brow: 0.74, eye: 1.0,  aura: 0.85, jit: 0.0 },
  relax:      { hz: 1.1, amp: 0.09, fin: 0.62, bend: 0.0,  mouth: 0.10, brow: 0.34, eye: 0.46, aura: 0.45, jit: 0.0 },
  left_turn:  { hz: 4.4, amp: 0.28, fin: 0.56, bend: -0.54, mouth: 0.24, brow: 0.68, eye: 1.0,  aura: 0.78, jit: 0.0 },
  right_turn: { hz: 4.4, amp: 0.28, fin: 0.56, bend: 0.54,  mouth: 0.24, brow: 0.68, eye: 1.0,  aura: 0.78, jit: 0.0 },
  eating:     { hz: 6.4, amp: 0.28, fin: 0.64, bend: 0.0,  mouth: 1.0,  brow: 0.90, eye: 1.08, aura: 1.0,  jit: 0.22 },
  hungry:     { hz: 4.2, amp: 0.24, fin: 0.52, bend: 0.0,  mouth: 0.78, brow: 0.92, eye: 1.15, aura: 0.98, jit: 0.16 },
  stress:     { hz: 7.8, amp: 0.14, fin: 0.36, bend: 0.0,  mouth: 0.40, brow: 0.96, eye: 0.28, aura: 0.88, jit: 1.40 },
  fear:       { hz: 9.0, amp: 0.22, fin: 0.78, bend: 0.0,  mouth: 0.58, brow: -0.45, eye: 1.36, aura: 0.26, jit: 1.65 },
  shock:      { hz: 1.4, amp: 0.06, fin: 0.88, bend: 0.0,  mouth: 0.86, brow: -0.60, eye: 1.48, aura: 0.24, jit: 1.90 },
  happy:      { hz: 4.2, amp: 0.30, fin: 0.70, bend: 0.0,  mouth: 0.68, brow: 0.44, eye: 0.72, aura: 1.0,  jit: 0.0 },
  sad:        { hz: 0.9, amp: 0.08, fin: 0.18, bend: 0.0,  mouth: 0.06, brow: -0.35, eye: 0.66, aura: 0.24, jit: 0.0 },
};

function cubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export class VillainGreatwhitesharkfish {
  static metadata = {
    name: 'Villain Great White Shark',
    category: 'villain_fish',
    baseLength: 240,
    baseWidth: 96,
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
    const halfL = VillainGreatwhitesharkfish.metadata.baseLength * 0.5;
    const halfW = VillainGreatwhitesharkfish.metadata.baseWidth * 0.5;

    const wag = Math.sin(this._phase) * p.amp + p.bend * 0.62;
    const sway = Math.sin(this._phase - 0.85) * p.amp * 0.28 + p.bend * 0.34;
    const jx = p.jit > 0 ? Math.sin(t * 54) * p.jit * 1.5 : 0;
    const jy = p.jit > 0 ? Math.cos(t * 60) * p.jit * 1.7 : 0;

    ctx.save();
    ctx.translate(this.x + jx, this.y + jy);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Dreadnought gunmetal & crimson miasma aura
    this._drawApexAura(ctx, halfL, halfW, p.aura, t);

    // 2. Massive swept shark pectoral wings with spiked iron fin bands
    this._drawArmoredPectoral(ctx, 24, -26, -1, p.fin);
    this._drawArmoredPectoral(ctx, 24, 26, 1, p.fin);

    // 3. Notched pelvic fins
    this._drawSharkPelvic(ctx, -32, -16 + sway * 9, -1);
    this._drawSharkPelvic(ctx, -32, 16 + sway * 9, 1);

    // 4. Jagged crescent shark tail
    this._drawJaggedCrescentTail(ctx, -halfL * 0.68, sway * 16, wag);

    // 5. Armored gunmetal-black muscular chibi torpedo with glowing crimson scars & 5 glowing red gill slits/side
    this._drawArmoredTorpedoBody(ctx, halfL, halfW, sway, t);

    // 6. Iconic tall battle-notched dorsal fin with spiked iron collar band
    this._drawArmoredDorsalFin(ctx, sway, wag);

    // 7. Snapping serrated shark jaws protruding at front snout
    this._drawSharkJaws(ctx, halfL, p.mouth, t);

    // 8. Blazing crimson apex villain eyes with heavy armored V-brows
    this._drawApexEyes(ctx, halfL, p, t);

    // 9. Mood FX
    this._drawMoodFX(ctx, halfL, halfW, t);

    ctx.restore();
  }

  _drawApexAura(ctx, halfL, halfW, aura, t) {
    const r = halfL * (1.05 + Math.sin(t * 1.9) * 0.04);
    const g = ctx.createRadialGradient(-6, 0, 16, -6, 0, r);
    g.addColorStop(0, `rgba(18, 6, 24, ${0.52 * aura})`);
    g.addColorStop(0.55, `rgba(192, 14, 38, ${0.24 * aura})`);
    g.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(-6, 0, r, halfW * 1.15, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawArmoredPectoral(ctx, ox, oy, side, fin) {
    ctx.save();
    ctx.translate(ox, oy);
    const flut = Math.sin(this._phase * 0.8 + side) * 0.1;
    ctx.rotate(side * (0.14 + fin * 0.25 + flut));

    const g = ctx.createLinearGradient(14, 0, -24, side * 46);
    g.addColorStop(0, '#464C5C');
    g.addColorStop(0.55, '#252834');
    g.addColorStop(1, '#140F1E');

    ctx.fillStyle = g;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.8;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.quadraticCurveTo(10, side * 26, -24, side * 48);
    // Battle notches on trailing edge
    ctx.lineTo(-22, side * 34);
    ctx.lineTo(-29, side * 30);
    ctx.lineTo(-21, side * 18);
    ctx.lineTo(-24, side * 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Spiked iron fin band strapped around the pectoral!
    ctx.fillStyle = '#6E7588';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(10, side * 14);
    ctx.lineTo(-17, side * 18);
    ctx.lineTo(-19, side * 25);
    ctx.lineTo(7, side * 21);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Iron spikes protruding from the fin band
    ctx.fillStyle = '#CBD3E6';
    const spikes = [
      { x: 9, y: side * 17, tx: 17, ty: side * 16 },
      { x: -3, y: side * 20, tx: -3, ty: side * 28 },
      { x: -16, y: side * 22, tx: -24, ty: side * 23 },
    ];
    for (const sp of spikes) {
      ctx.beginPath();
      ctx.moveTo(sp.x - 2.5, sp.y - 2);
      ctx.lineTo(sp.tx, sp.ty);
      ctx.lineTo(sp.x + 2.5, sp.y + 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawSharkPelvic(ctx, ox, oy, side) {
    ctx.save();
    ctx.translate(ox, oy);
    ctx.fillStyle = '#2B2E3D';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.quadraticCurveTo(0, side * 16, -14, side * 20);
    ctx.lineTo(-12, side * 10);
    ctx.lineTo(-16, side * 6);
    ctx.lineTo(-10, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  _drawJaggedCrescentTail(ctx, tx, ty, wag) {
    ctx.save();
    ctx.translate(tx, ty * 0.45);
    ctx.rotate(wag * 0.85);

    const g = ctx.createLinearGradient(0, 0, -44, 0);
    g.addColorStop(0, '#3C4052');
    g.addColorStop(0.55, '#1F202E');
    g.addColorStop(1, '#120B1C');

    ctx.fillStyle = g;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.8;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(5, -7);
    ctx.quadraticCurveTo(-14, -22, -42, -38);
    ctx.lineTo(-28, -16);
    ctx.lineTo(-34, -9);
    ctx.lineTo(-21, 0);
    ctx.lineTo(-34, 9);
    ctx.lineTo(-28, 16);
    ctx.lineTo(-42, 38);
    ctx.quadraticCurveTo(-14, 22, 5, 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Crimson battle-trimmed tail tips
    ctx.strokeStyle = '#E01A3E';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(-26, -24);
    ctx.lineTo(-40, -36);
    ctx.moveTo(-26, 24);
    ctx.lineTo(-40, 36);
    ctx.stroke();
    ctx.restore();
  }

  _drawArmoredTorpedoBody(ctx, halfL, halfW, sway, t) {
    const sy = sway * 14;
    const bodyW = halfW * 0.68;

    ctx.save();
    ctx.beginPath();
    // Chunky front-heavy chibi apex Great White silhouette
    ctx.moveTo(halfL * 0.88, 0);
    ctx.bezierCurveTo(halfL * 0.74, -bodyW * 0.92, halfL * 0.16, -bodyW * 1.06, -halfL * 0.24, -bodyW * 0.62 + sy * 0.42);
    ctx.quadraticCurveTo(-halfL * 0.54, -bodyW * 0.30 + sy, -halfL * 0.70, -bodyW * 0.18 + sy);
    ctx.lineTo(-halfL * 0.70, bodyW * 0.18 + sy);
    ctx.quadraticCurveTo(-halfL * 0.54, bodyW * 0.30 + sy, -halfL * 0.24, bodyW * 0.62 + sy * 0.42);
    ctx.bezierCurveTo(halfL * 0.16, bodyW * 1.06, halfL * 0.74, bodyW * 0.92, halfL * 0.88, 0);
    ctx.closePath();

    // Armored gunmetal-black gradient
    const bg = ctx.createLinearGradient(halfL * 0.9, -bodyW, -halfL * 0.7, bodyW);
    bg.addColorStop(0, '#5A6174');
    bg.addColorStop(0.35, '#343848');
    bg.addColorStop(0.75, '#1D1E2C');
    bg.addColorStop(1, '#120D1E');
    ctx.fillStyle = bg;
    ctx.fill();

    ctx.save();
    ctx.clip();

    // Pale ash-grey Great White lower flank countershading
    ctx.fillStyle = 'rgba(205, 212, 226, 0.20)';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(24, side * (bodyW * 0.88), 58, 12, side * 0.08, 0, Math.PI * 2);
      ctx.fill();
    }

    // Riveted iron armor plates across shoulder/back
    ctx.strokeStyle = 'rgba(18, 10, 28, 0.65)';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(42, -26);
    ctx.quadraticCurveTo(32, 0, 42, 26);
    ctx.moveTo(8, -32);
    ctx.quadraticCurveTo(-2, 0, 8, 32);
    ctx.stroke();

    // 5 glowing red gill slits per side (iconic Great White villain detail!)
    const gillPulse = 0.75 + Math.sin(t * 5.0) * 0.25;
    for (const side of [-1, 1]) {
      for (let g = 0; g < 5; g++) {
        const gx = 46 - g * 6.5;
        const gyOuter = side * (25 + g * 0.6);
        const gyInner = side * (16 + g * 0.4);
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 3.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(gx + 1.5, gyOuter);
        ctx.lineTo(gx - 1.5, gyInner);
        ctx.stroke();

        ctx.strokeStyle = `rgba(255, 36, 68, ${gillPulse})`;
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }
    }

    // Glowing crimson battle scars slashing across the snout
    ctx.strokeStyle = `rgba(255, 42, 74, ${gillPulse})`;
    ctx.lineWidth = 2.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(92, -10);
    ctx.lineTo(74, 4);
    ctx.moveTo(88, -14);
    ctx.lineTo(72, -2);
    ctx.moveTo(83, -16);
    ctx.lineTo(70, -7);
    ctx.stroke();

    ctx.strokeStyle = '#FFD4D8';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(91, -9.5);
    ctx.lineTo(75, 3.5);
    ctx.stroke();

    // Cel-shade flank shadow
    ctx.fillStyle = 'rgba(14, 6, 22, 0.34)';
    ctx.beginPath();
    ctx.ellipse(6, bodyW * 0.68, halfL * 0.85, bodyW * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();

    // Metallic gunmetal specular highlight
    ctx.fillStyle = 'rgba(218, 228, 245, 0.28)';
    ctx.beginPath();
    ctx.ellipse(26, -bodyW * 0.36, 42, 7.5, -0.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3.0;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  _drawArmoredDorsalFin(ctx, sway, wag) {
    ctx.save();
    ctx.fillStyle = '#2A2E3E';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(22, 0);
    ctx.quadraticCurveTo(4, -7 + sway * 3, -24, -4 + sway * 6);
    ctx.lineTo(-18, -1 + sway * 5);
    ctx.lineTo(-28, wag * 9);
    ctx.lineTo(-18, 1 + sway * 5);
    ctx.lineTo(-24, 4 + sway * 6);
    ctx.quadraticCurveTo(4, 7 + sway * 3, 22, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Iron clamp band across dorsal fin
    ctx.fillStyle = '#757D94';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.6;
    ctx.fillRect(-4, -5.2 + sway * 4, 8, 10.4);
    ctx.strokeRect(-4, -5.2 + sway * 4, 8, 10.4);
    ctx.restore();
  }

  _drawSharkJaws(ctx, halfL, mouth, t) {
    const mx = halfL * 0.84;
    const snap = this._state === 'eating' || this._state === 'hungry'
      ? Math.abs(Math.sin(t * 12)) * 0.45 + mouth * 0.55
      : mouth;

    if (snap > 0.16 || this._state === 'happy') {
      const w = 6.5 + snap * 9.5;
      ctx.save();
      ctx.fillStyle = '#330616';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(mx + 2, 0, 4.5 + snap * 5.0, w, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Serrated Great White triangular fangs
      ctx.fillStyle = '#FFF7F4';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.1;
      const fangs = [-w * 0.68, -w * 0.34, 0, w * 0.34, w * 0.68];
      for (const fy of fangs) {
        ctx.beginPath();
        ctx.moveTo(mx + 1.5, fy - 2.2);
        ctx.lineTo(mx + 8.5 + snap * 2.5, fy);
        ctx.lineTo(mx + 1.5, fy + 2.2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  _drawApexEyes(ctx, halfL, p, t) {
    const ex = halfL * 0.58;
    const ey = 18.5;

    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(ex, side * ey);

      if (this._state === 'stress') {
        ctx.strokeStyle = '#FF2048';
        ctx.lineWidth = 3.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-4.0, -side * 4.0);
        ctx.lineTo(3.5, 0);
        ctx.lineTo(-4.0, side * 4.0);
        ctx.stroke();
        ctx.restore();
        continue;
      }

      const rx = 6.2 * (this._state === 'shock' ? 1.24 : 1.0);
      const ry = 5.4 * Math.max(0.45, Math.min(1.36, p.eye));

      ctx.fillStyle = OUTLINE;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx + 1.8, ry + 1.6, side * 0.14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFF0F2';
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, side * 0.14, 0, Math.PI * 2);
      ctx.fill();

      // Blazing crimson apex iris
      const ir = this._state === 'shock' ? 2.0 : 3.8;
      const ig = ctx.createRadialGradient(0.6, 0, 0.4, 0.6, 0, ir);
      ig.addColorStop(0, '#FFA8A8');
      ig.addColorStop(0.5, '#FF1236');
      ig.addColorStop(1, '#580414');
      ctx.fillStyle = ig;
      ctx.beginPath();
      ctx.arc(1.0, side * 0.35, ir, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = OUTLINE;
      ctx.beginPath();
      ctx.ellipse(1.2, side * 0.35, 1.3, ir * 0.82, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(2.4, side * 0.35 - 1.5, 1.4, 0, Math.PI * 2);
      ctx.arc(-0.6, side * 0.35 + 1.4, 0.75, 0, Math.PI * 2);
      ctx.fill();

      if (this._state === 'relax' || this._state === 'happy') {
        ctx.fillStyle = '#2B2E3E';
        ctx.beginPath();
        ctx.ellipse(-1.2, 0, rx + 0.6, ry * 0.56, side * 0.14, Math.PI * 0.5, Math.PI * 1.5);
        ctx.fill();
      }

      const tilt = p.brow * 0.58;
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 3.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-6.5, -side * (4.0 - tilt * 3.5));
      ctx.lineTo(7.2, -side * (2.0 + tilt * 3.8));
      ctx.stroke();

      if (this._state === 'hungry' || this._state === 'eating') {
        ctx.strokeStyle = `rgba(255, 50, 75, ${0.7 + Math.sin(t * 14) * 0.3})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(1.2, -7.0);
        ctx.lineTo(1.2, 7.0);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  _drawMoodFX(ctx, halfL, halfW, t) {
    if (this._state === 'happy') {
      for (let i = 0; i < 4; i++) {
        const a = t * 2.0 + i * 1.57;
        const sx = 12 + Math.cos(a) * (halfL * 0.60);
        const sy = Math.sin(a) * (halfW * 0.85);
        const r = 4.6 + Math.sin(t * 7 + i) * 1.4;
        ctx.fillStyle = i % 2 === 0 ? '#FF1E44' : '#9B30FF';
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
      ctx.translate(halfL * 0.66, -halfW * 0.72);
      ctx.fillStyle = '#FF204E';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.roundRect(-3.2, -16, 6.4, 12.0, 2.0);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 2.4, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (this._state === 'fear') {
      for (let i = 0; i < 2; i++) {
        const d = (t * 25 + i * 8) % 14;
        const x = 62 - i * 18;
        const y = -halfW * 0.62 - d * 0.7;
        ctx.fillStyle = '#7CE8FF';
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(x, y - 5.5);
        ctx.quadraticCurveTo(x + 4.2, y + 1.5, x, y + 4.8);
        ctx.quadraticCurveTo(x - 4.2, y + 1.5, x, y - 5.5);
        ctx.fill();
        ctx.stroke();
      }
    } else if (this._state === 'stress') {
      const s = 1 + Math.sin(t * 20) * 0.18;
      ctx.save();
      ctx.translate(58, -halfW * 0.62);
      ctx.scale(s, s);
      ctx.strokeStyle = '#FF244C';
      ctx.lineWidth = 3.0;
      ctx.lineCap = 'round';
      for (let q = 0; q < 4; q++) {
        ctx.rotate(Math.PI * 0.5);
        ctx.beginPath();
        ctx.moveTo(2.6, 2.6);
        ctx.quadraticCurveTo(3.0, 6.8, 7.8, 7.2);
        ctx.stroke();
      }
      ctx.restore();
    } else if (this._state === 'sad') {
      const dy = (t * 14) % 10;
      ctx.fillStyle = '#72D6FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(halfL * 0.54, 32 + dy * 0.6);
      ctx.quadraticCurveTo(halfL * 0.54 + 3.6, 38 + dy * 0.6, halfL * 0.54, 41 + dy * 0.6);
      ctx.quadraticCurveTo(halfL * 0.54 - 3.6, 38 + dy * 0.6, halfL * 0.54, 32 + dy * 0.6);
      ctx.fill();
      ctx.stroke();
    }
  }
}

export default VillainGreatwhitesharkfish;
