/**
 * Villain Red Lionfish — Standalone 2D Top-Down Expressive Chibi Villain ES Module
 * Concept: Pitch-black & blood-crimson zebra stripes, venomous glowing-acid-tipped
 * pectoral plumes & wicked jagged dorsal spines.
 */

const OUTLINE = '#140B1C';
const ONE_SHOTS = new Set(['left_turn', 'right_turn', 'eating', 'shock']);
const LOCK_IGNORED = new Set(['left_turn', 'right_turn', 'relax', 'happy', 'eating']);
const ALIASES = { idle: 'breathing', hunger: 'hungry' };
const DUR = { left_turn: 0.60, right_turn: 0.60, eating: 0.66, shock: 0.78 };

const POSE_MAP = {
  breathing:  { hz: 2.4, amp: 0.16, plume: 0.58, bend: 0.0,  mouth: 0.14, brow: 0.58, eye: 1.0,  aura: 0.58, jit: 0.0 },
  swimming:   { hz: 5.8, amp: 0.34, plume: 0.36, bend: 0.0,  mouth: 0.22, brow: 0.68, eye: 1.0,  aura: 0.78, jit: 0.0 },
  relax:      { hz: 1.4, amp: 0.10, plume: 0.80, bend: 0.0,  mouth: 0.08, brow: 0.32, eye: 0.46, aura: 0.42, jit: 0.0 },
  left_turn:  { hz: 5.4, amp: 0.28, plume: 0.72, bend: -0.58, mouth: 0.18, brow: 0.62, eye: 1.0,  aura: 0.72, jit: 0.0 },
  right_turn: { hz: 5.4, amp: 0.28, plume: 0.72, bend: 0.58,  mouth: 0.18, brow: 0.62, eye: 1.0,  aura: 0.72, jit: 0.0 },
  eating:     { hz: 7.4, amp: 0.26, plume: 0.92, bend: 0.0,  mouth: 1.0,  brow: 0.86, eye: 1.06, aura: 0.92, jit: 0.18 },
  hungry:     { hz: 4.8, amp: 0.24, plume: 0.76, bend: 0.0,  mouth: 0.74, brow: 0.90, eye: 1.14, aura: 0.95, jit: 0.12 },
  stress:     { hz: 8.6, amp: 0.15, plume: 0.42, bend: 0.0,  mouth: 0.36, brow: 0.95, eye: 0.28, aura: 0.84, jit: 1.22 },
  fear:       { hz: 9.8, amp: 0.22, plume: 0.95, bend: 0.0,  mouth: 0.56, brow: -0.45, eye: 1.35, aura: 0.25, jit: 1.45 },
  shock:      { hz: 1.6, amp: 0.06, plume: 1.05, bend: 0.0,  mouth: 0.84, brow: -0.60, eye: 1.48, aura: 0.22, jit: 1.68 },
  happy:      { hz: 4.8, amp: 0.30, plume: 0.86, bend: 0.0,  mouth: 0.62, brow: 0.40, eye: 0.72, aura: 1.0,  jit: 0.0 },
  sad:        { hz: 1.1, amp: 0.08, plume: 0.20, bend: 0.0,  mouth: 0.05, brow: -0.35, eye: 0.66, aura: 0.22, jit: 0.0 },
};

function cubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export class VillainLionfish {
  static metadata = {
    name: 'Villain Red Lionfish',
    category: 'villain_fish',
    baseLength: 115,
    baseWidth: 85,
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
    this._from = { ...POSE_MAP.breathing };
    this._to = { ...POSE_MAP.breathing };
    this._cur = { ...POSE_MAP.breathing };
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
    if (!POSE_MAP[next]) return;
    if ((this._state === 'shock' || this._state === 'fear') && LOCK_IGNORED.has(next)) return;
    if (next === this._state && !ONE_SHOTS.has(next)) return;

    if (ONE_SHOTS.has(next) && !ONE_SHOTS.has(this._state)) {
      this._prev = this._state;
    }
    this._state = next;
    this._stateT = 0;
    this._from = { ...this._cur };
    this._to = { ...POSE_MAP[next] };
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

    if (ONE_SHOTS.has(this._state) && this._stateT >= DUR[this._state]) {
      const done = this._state;
      const back = POSE_MAP[this._prev] && !ONE_SHOTS.has(this._prev) ? this._prev : 'breathing';
      this._state = back;
      this._stateT = 0;
      this._from = { ...this._cur };
      this._to = { ...POSE_MAP[back] };
      this._blendT = 0;

      const list = this._cbs.get(done);
      if (list) for (const fn of list) fn(done);
    }
  }

  draw(ctx) {
    const p = this._cur;
    const t = this._t;
    const halfL = VillainLionfish.metadata.baseLength * 0.5;
    const halfW = VillainLionfish.metadata.baseWidth * 0.5;

    const wag = Math.sin(this._phase) * p.amp + p.bend * 0.62;
    const sway = Math.sin(this._phase - 0.7) * p.amp * 0.24 + p.bend * 0.28;
    const jx = p.jit > 0 ? Math.sin(t * 56) * p.jit * 1.15 : 0;
    const jy = p.jit > 0 ? Math.cos(t * 63) * p.jit * 1.3 : 0;

    ctx.save();
    ctx.translate(this.x + jx, this.y + jy);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Venomous crimson-acid shadow aura
    this._drawVenomAura(ctx, halfL, halfW, p.aura, t);

    // 2. Massive fanned venomous pectoral plumes with glowing acid-green tips (7 quills each side)
    this._drawVenomousPlumeWing(ctx, 12, -11, -1, p.plume, t);
    this._drawVenomousPlumeWing(ctx, 12, 11, 1, p.plume, t);

    // 3. Banded jagged fan tail
    this._drawBandedTail(ctx, -halfL * 0.54, sway * 9, wag, t);

    // 4. Pitch-black & blood-crimson zebra-striped chunky body
    this._drawZebraBody(ctx, halfL, sway, t);

    // 5. Wicked jagged venomous dorsal spines running along top spine
    this._drawDorsalSpines(ctx, sway, wag, t);

    // 6. Horned brow tentacles & snapping fanged maw
    this._drawLionMouth(ctx, halfL, p.mouth, t);

    // 7. Glowing acid-amber villain eyes with horned V-brows
    this._drawLionEyes(ctx, halfL, p, t);

    // 8. Mood FX
    this._drawMoodFX(ctx, halfL, halfW, t);

    ctx.restore();
  }

  _drawVenomAura(ctx, halfL, halfW, aura, t) {
    const r = halfL * (1.02 + Math.sin(t * 2.1) * 0.04);
    const g = ctx.createRadialGradient(-2, 0, 8, -2, 0, r);
    g.addColorStop(0, `rgba(28, 6, 22, ${0.48 * aura})`);
    g.addColorStop(0.55, `rgba(180, 14, 34, ${0.22 * aura})`);
    g.addColorStop(0.82, `rgba(130, 255, 25, ${0.14 * aura})`);
    g.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(-2, 0, r, halfW * 1.05, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawVenomousPlumeWing(ctx, ox, oy, side, plume, t) {
    ctx.save();
    ctx.translate(ox, oy);
    const quillCount = 6;
    const baseAngle = side * (0.45 + plume * 0.35);

    for (let i = 0; i < quillCount; i++) {
      const frac = i / (quillCount - 1);
      const wave = Math.sin(this._phase * 1.1 - i * 0.55) * 0.09;
      const ang = baseAngle + side * (frac * 1.25 - 0.12) + wave;
      const len = (34 - frac * 8) * (0.85 + plume * 0.25);

      ctx.save();
      ctx.rotate(ang);

      // Tattered crimson-black membrane between quills
      if (i < quillCount - 1) {
        ctx.fillStyle = 'rgba(138, 12, 34, 0.72)';
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(len * 0.72, -side * 1.5);
        ctx.quadraticCurveTo(len * 0.55, side * 5.5, len * 0.65, side * 8.5);
        ctx.lineTo(0, side * 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Banded quill spine
      ctx.fillStyle = '#180D20';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, -2.0);
      ctx.lineTo(len, 0);
      ctx.lineTo(0, 2.0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Blood-crimson stripes on quill
      ctx.fillStyle = '#C91632';
      ctx.fillRect(len * 0.22, -1.3, len * 0.16, 2.6);
      ctx.fillRect(len * 0.52, -1.0, len * 0.15, 2.0);

      // Venomous glowing-acid tip
      const glow = 0.75 + Math.sin(t * 6 + i) * 0.25;
      ctx.fillStyle = `rgba(170, 255, 24, ${glow})`;
      ctx.beginPath();
      ctx.moveTo(len * 0.78, -1.4);
      ctx.lineTo(len + 3.5, 0);
      ctx.lineTo(len * 0.78, 1.4);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
    ctx.restore();
  }

  _drawBandedTail(ctx, tx, ty, wag, t) {
    ctx.save();
    ctx.translate(tx, ty * 0.4);
    ctx.rotate(wag * 0.88);

    const g = ctx.createLinearGradient(0, 0, -26, 0);
    g.addColorStop(0, '#2B0D1F');
    g.addColorStop(0.5, '#A8122E');
    g.addColorStop(1, '#180C20');

    ctx.fillStyle = g;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.1;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(2, -5.5);
    ctx.quadraticCurveTo(-11, -15, -24, -17);
    ctx.lineTo(-18, -8);
    ctx.lineTo(-26, -3);
    ctx.lineTo(-20, 1);
    ctx.lineTo(-26, 7);
    ctx.lineTo(-23, 17);
    ctx.quadraticCurveTo(-11, 15, 2, 5.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Venomous acid speckles on tail
    ctx.fillStyle = `rgba(176, 255, 40, ${0.65 + Math.sin(t * 5) * 0.2})`;
    const spots = [[-10, -6], [-15, 0], [-10, 6], [-19, -11], [-19, 11]];
    for (const [sx, sy] of spots) {
      ctx.beginPath();
      ctx.arc(sx, sy, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  _drawZebraBody(ctx, halfL, sway, t) {
    const bodyHalfW = 19.5;
    const sy = sway * 6;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(halfL * 0.74, 0);
    ctx.bezierCurveTo(halfL * 0.68, -bodyHalfW * 1.05, halfL * 0.12, -bodyHalfW * 1.08, -halfL * 0.24, -bodyHalfW * 0.68 + sy * 0.45);
    ctx.quadraticCurveTo(-halfL * 0.46, -bodyHalfW * 0.36 + sy, -halfL * 0.56, -bodyHalfW * 0.22 + sy);
    ctx.lineTo(-halfL * 0.56, bodyHalfW * 0.22 + sy);
    ctx.quadraticCurveTo(-halfL * 0.46, bodyHalfW * 0.36 + sy, -halfL * 0.24, bodyHalfW * 0.68 + sy * 0.45);
    ctx.bezierCurveTo(halfL * 0.12, bodyHalfW * 1.08, halfL * 0.68, bodyHalfW * 1.05, halfL * 0.74, 0);
    ctx.closePath();

    // Blood-crimson base
    const bg = ctx.createLinearGradient(halfL * 0.74, -bodyHalfW, -halfL * 0.56, bodyHalfW);
    bg.addColorStop(0, '#D9193A');
    bg.addColorStop(0.5, '#9C0E28');
    bg.addColorStop(1, '#3B0818');
    ctx.fillStyle = bg;
    ctx.fill();

    ctx.save();
    ctx.clip();

    // Pitch-black zebra stripes with thin bone-cream rims
    const stripeXs = [26, 15, 4, -7, -18, -28];
    for (let i = 0; i < stripeXs.length; i++) {
      const sx = stripeXs[i];
      const sw = i % 2 === 0 ? 5.0 : 3.4;
      ctx.fillStyle = '#140A1C';
      ctx.strokeStyle = '#F2DCE0';
      ctx.lineWidth = 0.85;
      ctx.beginPath();
      ctx.moveTo(sx - sw * 0.5, -bodyHalfW * 1.2);
      ctx.lineTo(sx - sw * 0.5 + 2.0, 0);
      ctx.lineTo(sx - sw * 0.5, bodyHalfW * 1.2);
      ctx.lineTo(sx + sw * 0.5, bodyHalfW * 1.2);
      ctx.lineTo(sx + sw * 0.5 + 2.0, 0);
      ctx.lineTo(sx + sw * 0.5, -bodyHalfW * 1.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Cel-shaded underside shadow
    ctx.fillStyle = 'rgba(18, 6, 24, 0.35)';
    ctx.beginPath();
    ctx.ellipse(2, bodyHalfW * 0.68, halfL * 0.72, bodyHalfW * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();

    // Glossy top-down highlight
    ctx.fillStyle = 'rgba(255, 210, 220, 0.28)';
    ctx.beginPath();
    ctx.ellipse(14, -bodyHalfW * 0.38, 16, 4.5, -0.12, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  _drawDorsalSpines(ctx, sway, wag, t) {
    // Wicked jagged dorsal spines with venomous acid tips along the center spine
    const spineXs = [18, 10, 2, -6, -14, -22];
    ctx.save();
    for (let i = 0; i < spineXs.length; i++) {
      const sx = spineXs[i];
      const offsetY = (i / spineXs.length) * (sway * 5 + wag * 4);
      const sideBias = i % 2 === 0 ? -1 : 1;
      const tipX = sx - 7;
      const tipY = offsetY + sideBias * (6.5 - i * 0.4);

      ctx.fillStyle = '#180B22';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(sx + 2.5, offsetY);
      ctx.lineTo(tipX, tipY);
      ctx.lineTo(sx - 3.0, offsetY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Acid-green glowing tip
      ctx.fillStyle = `rgba(175, 255, 28, ${0.75 + Math.sin(t * 7 + i) * 0.25})`;
      ctx.beginPath();
      ctx.arc(tipX, tipY, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  _drawLionMouth(ctx, halfL, mouth, t) {
    const mx = halfL * 0.70;
    const snap = this._state === 'eating' || this._state === 'hungry'
      ? Math.abs(Math.sin(t * 13)) * 0.45 + mouth * 0.55
      : mouth;

    if (snap > 0.2 || this._state === 'happy') {
      const w = 3.4 + snap * 4.8;
      ctx.save();
      ctx.fillStyle = '#240618';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(mx + 1.5, 0, 2.4 + snap * 2.8, w, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#F7FFE8';
      for (const fy of [-w * 0.55, 0, w * 0.55]) {
        ctx.beginPath();
        ctx.moveTo(mx + 0.8, fy - 1.3);
        ctx.lineTo(mx + 4.8 + snap * 1.4, fy);
        ctx.lineTo(mx + 0.8, fy + 1.3);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
  }

  _drawLionEyes(ctx, halfL, p, t) {
    const ex = halfL * 0.44;
    const ey = 10.5;

    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(ex, side * ey);

      // Horned villain brow tentacle
      ctx.fillStyle = '#B81430';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-2, side * 3.5);
      ctx.lineTo(6, side * 9.5);
      ctx.lineTo(2, side * 3.0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      if (this._state === 'stress') {
        ctx.strokeStyle = OUTLINE;
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

      ctx.fillStyle = '#FFF5E0';
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, side * 0.14, 0, Math.PI * 2);
      ctx.fill();

      // Venomous acid-gold iris
      const ir = this._state === 'shock' ? 1.5 : 2.8;
      const ig = ctx.createRadialGradient(0.5, 0, 0.3, 0.5, 0, ir);
      ig.addColorStop(0, '#E8FF66');
      ig.addColorStop(0.55, '#9CFF00');
      ig.addColorStop(1, '#3B6E00');
      ctx.fillStyle = ig;
      ctx.beginPath();
      ctx.arc(0.7, side * 0.25, ir, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = OUTLINE;
      ctx.beginPath();
      ctx.ellipse(0.9, side * 0.25, 0.9, ir * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(1.7, side * 0.25 - 1.1, 1.05, 0, Math.PI * 2);
      ctx.arc(-0.4, side * 0.25 + 1.0, 0.55, 0, Math.PI * 2);
      ctx.fill();

      if (this._state === 'relax' || this._state === 'happy') {
        ctx.fillStyle = '#38091C';
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
        ctx.strokeStyle = `rgba(175, 255, 30, ${0.65 + Math.sin(t * 14) * 0.3})`;
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
        const sx = 6 + Math.cos(a) * (halfL * 0.65);
        const sy = Math.sin(a) * (halfW * 0.72);
        const r = 3.2 + Math.sin(t * 7 + i) * 1.0;
        ctx.fillStyle = i % 2 === 0 ? '#D91A42' : '#A8FF1E';
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
      ctx.translate(halfL * 0.56, -28);
      ctx.fillStyle = '#FF204E';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.roundRect(-2.2, -11, 4.4, 8.2, 1.5);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 1.5, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (this._state === 'fear') {
      for (let i = 0; i < 2; i++) {
        const d = (t * 25 + i * 6) % 10;
        const x = 22 - i * 10;
        const y = -23 - d * 0.55;
        ctx.fillStyle = '#7CE8FF';
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x, y - 3.8);
        ctx.quadraticCurveTo(x + 2.9, y + 1, x, y + 3.2);
        ctx.quadraticCurveTo(x - 2.9, y + 1, x, y - 3.8);
        ctx.fill();
        ctx.stroke();
      }
    } else if (this._state === 'stress') {
      const s = 1 + Math.sin(t * 20) * 0.18;
      ctx.save();
      ctx.translate(20, -23);
      ctx.scale(s, s);
      ctx.strokeStyle = '#FF244C';
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      for (let q = 0; q < 4; q++) {
        ctx.rotate(Math.PI * 0.5);
        ctx.beginPath();
        ctx.moveTo(1.9, 1.9);
        ctx.quadraticCurveTo(2.1, 4.8, 5.6, 5.1);
        ctx.stroke();
      }
      ctx.restore();
    } else if (this._state === 'sad') {
      const dy = (t * 14) % 7;
      ctx.fillStyle = '#72D6FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(halfL * 0.42, 19 + dy * 0.5);
      ctx.quadraticCurveTo(halfL * 0.42 + 2.6, 23 + dy * 0.5, halfL * 0.42, 25 + dy * 0.5);
      ctx.quadraticCurveTo(halfL * 0.42 - 2.6, 23 + dy * 0.5, halfL * 0.42, 19 + dy * 0.5);
      ctx.fill();
      ctx.stroke();
    }
  }
}

export default VillainLionfish;
