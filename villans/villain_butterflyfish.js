/**
 * Villain Raccoon Butterflyfish — Standalone 2D Top-Down Expressive Chibi Villain ES Module
 * Concept: Tarnished sulfur-gold body, jagged bandit eye-mask with glowing red eyes,
 * sinister glowing false-eye skull-spot near tail.
 */

const OUTLINE = '#140B1C';
const ONE_SHOTS = new Set(['left_turn', 'right_turn', 'eating', 'shock']);
const LOCK_BLOCKED = new Set(['left_turn', 'right_turn', 'relax', 'happy', 'eating']);
const ALIASES = { idle: 'breathing', hunger: 'hungry' };
const DURATIONS = { left_turn: 0.54, right_turn: 0.54, eating: 0.62, shock: 0.72 };

const POSES = {
  breathing:  { hz: 3.1, amp: 0.18, fin: 0.48, bend: 0.0,  mouth: 0.10, brow: 0.54, eye: 1.0,  aura: 0.50, jit: 0.0 },
  swimming:   { hz: 7.4, amp: 0.36, fin: 0.28, bend: 0.0,  mouth: 0.16, brow: 0.66, eye: 1.0,  aura: 0.72, jit: 0.0 },
  relax:      { hz: 1.7, amp: 0.10, fin: 0.68, bend: 0.0,  mouth: 0.06, brow: 0.28, eye: 0.46, aura: 0.36, jit: 0.0 },
  left_turn:  { hz: 6.4, amp: 0.30, fin: 0.60, bend: -0.60, mouth: 0.14, brow: 0.58, eye: 1.0,  aura: 0.66, jit: 0.0 },
  right_turn: { hz: 6.4, amp: 0.30, fin: 0.60, bend: 0.60,  mouth: 0.14, brow: 0.58, eye: 1.0,  aura: 0.66, jit: 0.0 },
  eating:     { hz: 8.4, amp: 0.28, fin: 0.64, bend: 0.0,  mouth: 1.0,  brow: 0.86, eye: 1.06, aura: 0.90, jit: 0.16 },
  hungry:     { hz: 5.4, amp: 0.25, fin: 0.52, bend: 0.0,  mouth: 0.72, brow: 0.88, eye: 1.12, aura: 0.94, jit: 0.12 },
  stress:     { hz: 9.2, amp: 0.16, fin: 0.38, bend: 0.0,  mouth: 0.32, brow: 0.94, eye: 0.28, aura: 0.82, jit: 1.16 },
  fear:       { hz: 10.4, amp: 0.23, fin: 0.80, bend: 0.0, mouth: 0.54, brow: -0.45, eye: 1.35, aura: 0.22, jit: 1.38 },
  shock:      { hz: 1.8, amp: 0.06, fin: 0.90, bend: 0.0,  mouth: 0.82, brow: -0.58, eye: 1.46, aura: 0.20, jit: 1.62 },
  happy:      { hz: 5.6, amp: 0.32, fin: 0.74, bend: 0.0,  mouth: 0.60, brow: 0.38, eye: 0.72, aura: 0.96, jit: 0.0 },
  sad:        { hz: 1.3, amp: 0.08, fin: 0.18, bend: 0.0,  mouth: 0.04, brow: -0.34, eye: 0.66, aura: 0.22, jit: 0.0 },
};

function cubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export class VillainButterflyfish {
  static metadata = {
    name: 'Villain Raccoon Butterflyfish',
    category: 'villain_fish',
    baseLength: 80,
    baseWidth: 44,
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
    const halfL = VillainButterflyfish.metadata.baseLength * 0.5;
    const halfW = VillainButterflyfish.metadata.baseWidth * 0.5;

    const wag = Math.sin(this._phase) * p.amp + p.bend * 0.65;
    const sway = Math.sin(this._phase - 0.7) * p.amp * 0.25 + p.bend * 0.30;
    const jx = p.jit > 0 ? Math.sin(t * 58) * p.jit * 1.1 : 0;
    const jy = p.jit > 0 ? Math.cos(t * 64) * p.jit * 1.25 : 0;

    ctx.save();
    ctx.translate(this.x + jx, this.y + jy);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Sulfur-gold & bandit-shadow aura
    this._drawBanditAura(ctx, halfL, halfW, p.aura, t);

    // 2. Notched sulfur-gold pectoral fins
    this._drawButterflyPectoral(ctx, 6, -halfW * 0.68, -1, p.fin);
    this._drawButterflyPectoral(ctx, 6, halfW * 0.68, 1, p.fin);

    // 3. Notched sulfur-obsidian fan tail
    this._drawBanditTail(ctx, -halfL * 0.58, sway * 7, wag);

    // 4. Tarnished sulfur-gold chunky body with jagged bandit mask & glowing false-eye skull-spot
    this._drawSulfurBody(ctx, halfL, halfW, sway, t);

    // 5. Dorsal ridge
    this._drawDorsalRidge(ctx, sway, wag);

    // 6. Snapping bandit mouth
    this._drawBanditMouth(ctx, halfL, p.mouth, t);

    // 7. Glowing red bandit eyes peeking through jagged mask
    this._drawBanditEyes(ctx, halfL, halfW, p, t);

    // 8. Mood FX
    this._drawMoodFX(ctx, halfL, halfW, t);

    ctx.restore();
  }

  _drawBanditAura(ctx, halfL, halfW, aura, t) {
    const r = halfL * (1.06 + Math.sin(t * 2.3) * 0.04);
    const g = ctx.createRadialGradient(-3, 0, 5, -3, 0, r);
    g.addColorStop(0, `rgba(24, 12, 30, ${0.46 * aura})`);
    g.addColorStop(0.55, `rgba(218, 168, 18, ${0.20 * aura})`);
    g.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(-3, 0, r, halfW * 1.25, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawButterflyPectoral(ctx, ox, oy, side, fin) {
    ctx.save();
    ctx.translate(ox, oy);
    const flut = Math.sin(this._phase * 0.95 + side) * 0.17;
    ctx.rotate(side * (0.30 + fin * 0.55 + flut));

    const g = ctx.createLinearGradient(0, 0, -10, side * 17);
    g.addColorStop(0, '#E8BA24');
    g.addColorStop(0.65, '#8A5B14');
    g.addColorStop(1, '#1B1124');

    ctx.fillStyle = g;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.0;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(4, 0);
    ctx.quadraticCurveTo(3, side * 13, -5, side * 17);
    ctx.lineTo(-7, side * 11.5);
    ctx.lineTo(-11, side * 14);
    ctx.quadraticCurveTo(-13, side * 7, -7, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  _drawBanditTail(ctx, tx, ty, wag) {
    ctx.save();
    ctx.translate(tx, ty * 0.4);
    ctx.rotate(wag * 0.92);

    const g = ctx.createLinearGradient(0, 0, -18, 0);
    g.addColorStop(0, '#C48A1C');
    g.addColorStop(0.6, '#E8C02C');
    g.addColorStop(1, '#1A0F24');

    ctx.fillStyle = g;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.1;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(2, -4.5);
    ctx.lineTo(-16, -13);
    ctx.lineTo(-12.5, -5.5);
    ctx.lineTo(-17.5, -1);
    ctx.lineTo(-13, 3.5);
    ctx.lineTo(-16, 13);
    ctx.lineTo(2, 4.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  _drawSulfurBody(ctx, halfL, halfW, sway, t) {
    const sy = sway * 5.0;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(halfL * 0.92, 0);
    ctx.bezierCurveTo(halfL * 0.78, -halfW * 0.90, halfL * 0.08, -halfW * 0.98, -halfL * 0.28, -halfW * 0.62 + sy * 0.42);
    ctx.quadraticCurveTo(-halfL * 0.50, -halfW * 0.34 + sy, -halfL * 0.60, -halfW * 0.18 + sy);
    ctx.lineTo(-halfL * 0.60, halfW * 0.18 + sy);
    ctx.quadraticCurveTo(-halfL * 0.50, halfW * 0.34 + sy, -halfL * 0.28, halfW * 0.62 + sy * 0.42);
    ctx.bezierCurveTo(halfL * 0.08, halfW * 0.98, halfL * 0.78, halfW * 0.90, halfL * 0.92, 0);
    ctx.closePath();

    // Tarnished sulfur-gold gradient
    const bg = ctx.createLinearGradient(halfL * 0.9, -halfW, -halfL * 0.6, halfW);
    bg.addColorStop(0, '#F5CE38');
    bg.addColorStop(0.45, '#CFA022');
    bg.addColorStop(0.82, '#7E5418');
    bg.addColorStop(1, '#2D1A18');
    ctx.fillStyle = bg;
    ctx.fill();

    ctx.save();
    ctx.clip();

    // Faint tarnished chevron striations across flanks
    ctx.strokeStyle = 'rgba(72, 42, 12, 0.38)';
    ctx.lineWidth = 1.4;
    for (let sx = 8; sx >= -14; sx -= 5.5) {
      ctx.beginPath();
      ctx.moveTo(sx + 3, -halfW);
      ctx.lineTo(sx - 2, 0);
      ctx.lineTo(sx + 3, halfW);
      ctx.stroke();
    }

    // Jagged black raccoon bandit eye-mask across front head with pale ash rim
    ctx.fillStyle = '#150C20';
    ctx.strokeStyle = '#EAE2D2';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(27, -halfW);
    ctx.lineTo(29, -8);
    ctx.lineTo(25, 0);
    ctx.lineTo(29, 8);
    ctx.lineTo(27, halfW);
    ctx.lineTo(13, halfW);
    ctx.lineTo(16, 10);
    ctx.lineTo(11, 0);
    ctx.lineTo(16, -10);
    ctx.lineTo(13, -halfW);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Sinister glowing false-eye skull-spot near tail peduncle
    const pulse = 0.75 + Math.sin(t * 5.2) * 0.25;
    ctx.save();
    ctx.translate(-14, sy * 0.65);
    ctx.fillStyle = '#140B1C';
    ctx.strokeStyle = `rgba(255, 224, 90, ${pulse})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(0, 0, 6.2, 7.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Tiny glowing skull motif inside the false-eye spot
    ctx.fillStyle = `rgba(255, 240, 210, ${pulse})`;
    ctx.beginPath();
    ctx.arc(0.8, 0, 3.0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-3.2, -1.6, 2.2, 3.2);
    // Glowing red skull sockets
    ctx.fillStyle = '#FF2048';
    ctx.beginPath();
    ctx.arc(1.5, -1.2, 0.85, 0, Math.PI * 2);
    ctx.arc(1.5, 1.2, 0.85, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Dark cel-shade underside
    ctx.fillStyle = 'rgba(20, 10, 28, 0.30)';
    ctx.beginPath();
    ctx.ellipse(2, halfW * 0.65, halfL * 0.82, halfW * 0.40, 0, 0, Math.PI * 2);
    ctx.fill();

    // Glossy specular sheen
    ctx.fillStyle = 'rgba(255, 246, 195, 0.36)';
    ctx.beginPath();
    ctx.ellipse(4, -halfW * 0.38, 13, 4.0, -0.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.4;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  _drawDorsalRidge(ctx, sway, wag) {
    ctx.save();
    ctx.fillStyle = '#201228';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(2, -2.8 + sway * 1.5);
    ctx.lineTo(-10, -2.4 + sway * 3);
    ctx.lineTo(-19, wag * 4.5);
    ctx.lineTo(-10, 2.4 + sway * 3);
    ctx.lineTo(2, 2.8 + sway * 1.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  _drawBanditMouth(ctx, halfL, mouth, t) {
    const mx = halfL * 0.86;
    const snap = this._state === 'eating' || this._state === 'hungry'
      ? Math.abs(Math.sin(t * 14)) * 0.45 + mouth * 0.55
      : mouth;

    if (snap > 0.2 || this._state === 'happy') {
      const w = 2.5 + snap * 3.6;
      ctx.save();
      ctx.fillStyle = '#240718';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(mx + 1, 0, 1.9 + snap * 2.3, w, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FFF7E0';
      for (const fy of [-w * 0.5, 0, w * 0.5]) {
        ctx.beginPath();
        ctx.moveTo(mx + 0.5, fy - 1.0);
        ctx.lineTo(mx + 3.8 + snap, fy);
        ctx.lineTo(mx + 0.5, fy + 1.0);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
  }

  _drawBanditEyes(ctx, halfL, halfW, p, t) {
    const ex = halfL * 0.52;
    const ey = halfW * 0.44;

    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(ex, side * ey);

      if (this._state === 'stress') {
        ctx.strokeStyle = '#FF2A4D';
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

      const rx = 4.2 * (this._state === 'shock' ? 1.24 : 1.0);
      const ry = 3.8 * Math.max(0.45, Math.min(1.36, p.eye));

      ctx.fillStyle = '#2A0A1A';
      ctx.beginPath();
      ctx.ellipse(0, 0, rx + 1.1, ry + 1.0, side * 0.14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFF0F0';
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, side * 0.14, 0, Math.PI * 2);
      ctx.fill();

      // Glowing red bandit iris
      const ir = this._state === 'shock' ? 1.4 : 2.6;
      const rg = ctx.createRadialGradient(0.5, 0, 0.3, 0.5, 0, ir);
      rg.addColorStop(0, '#FF9E9E');
      rg.addColorStop(0.5, '#FF1E38');
      rg.addColorStop(1, '#680514');
      ctx.fillStyle = rg;
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
        ctx.fillStyle = '#1C0E26';
        ctx.beginPath();
        ctx.ellipse(-0.9, 0, rx + 0.4, ry * 0.56, side * 0.14, Math.PI * 0.5, Math.PI * 1.5);
        ctx.fill();
      }

      const tilt = p.brow * 0.55;
      ctx.strokeStyle = '#F5CE38';
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-4.1, -side * (2.6 - tilt * 2.4));
      ctx.lineTo(4.5, -side * (1.4 + tilt * 2.5));
      ctx.stroke();

      if (this._state === 'hungry' || this._state === 'eating') {
        ctx.strokeStyle = `rgba(255, 45, 70, ${0.65 + Math.sin(t * 14) * 0.3})`;
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
        const a = t * 2.3 + i * 1.57;
        const sx = 5 + Math.cos(a) * (halfL * 0.68);
        const sy = Math.sin(a) * (halfW * 1.05);
        const r = 2.8 + Math.sin(t * 7 + i) * 0.9;
        ctx.fillStyle = i % 2 === 0 ? '#FF244C' : '#F5CE38';
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
      ctx.translate(halfL * 0.60, -halfW * 0.96);
      ctx.fillStyle = '#FF204E';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(-2.0, -10, 4.0, 7.6, 1.5);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 1.3, 2.0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (this._state === 'fear') {
      for (let i = 0; i < 2; i++) {
        const d = (t * 25 + i * 6) % 9;
        const x = 14 - i * 8;
        const y = -halfW * 0.85 - d * 0.55;
        ctx.fillStyle = '#7CE8FF';
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x, y - 3.5);
        ctx.quadraticCurveTo(x + 2.6, y + 1, x, y + 3);
        ctx.quadraticCurveTo(x - 2.6, y + 1, x, y - 3.5);
        ctx.fill();
        ctx.stroke();
      }
    } else if (this._state === 'stress') {
      const s = 1 + Math.sin(t * 20) * 0.18;
      ctx.save();
      ctx.translate(12, -halfW * 0.82);
      ctx.scale(s, s);
      ctx.strokeStyle = '#FF244C';
      ctx.lineWidth = 2.0;
      ctx.lineCap = 'round';
      for (let q = 0; q < 4; q++) {
        ctx.rotate(Math.PI * 0.5);
        ctx.beginPath();
        ctx.moveTo(1.7, 1.7);
        ctx.quadraticCurveTo(1.9, 4.4, 5.1, 4.7);
        ctx.stroke();
      }
      ctx.restore();
    } else if (this._state === 'sad') {
      const dy = (t * 14) % 7;
      ctx.fillStyle = '#72D6FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(halfL * 0.48, halfW * 0.68 + dy * 0.5);
      ctx.quadraticCurveTo(halfL * 0.48 + 2.4, halfW * 0.68 + 4 + dy * 0.5, halfL * 0.48, halfW * 0.68 + 5.6 + dy * 0.5);
      ctx.quadraticCurveTo(halfL * 0.48 - 2.4, halfW * 0.68 + 4 + dy * 0.5, halfL * 0.48, halfW * 0.68 + dy * 0.5);
      ctx.fill();
      ctx.stroke();
    }
  }
}

export default VillainButterflyfish;
