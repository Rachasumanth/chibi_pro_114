/**
 * Villain Regal Blue Tang — Standalone 2D Top-Down Expressive Chibi Villain ES Module
 * Concept: Storm-indigo body, wicked jagged black tribal palette marking,
 * toxic neon-chartreuse barbed tail with black trim & venomous caudal scalpel spines.
 */

const OUTLINE = '#140B1C';
const ONE_SHOT_STATES = new Set(['left_turn', 'right_turn', 'eating', 'shock']);
const LOCKED_BLOCK = new Set(['left_turn', 'right_turn', 'relax', 'happy', 'eating']);
const ALIASES = { idle: 'breathing', hunger: 'hungry' };
const ONE_SHOT_TIME = { left_turn: 0.54, right_turn: 0.54, eating: 0.62, shock: 0.74 };

const POSES = {
  breathing:  { hz: 3.1, amp: 0.19, fin: 0.44, bend: 0.0,  mouth: 0.10, brow: 0.48, eye: 1.0,  aura: 0.48, shake: 0.0 },
  swimming:   { hz: 7.8, amp: 0.38, fin: 0.26, bend: 0.0,  mouth: 0.18, brow: 0.60, eye: 1.0,  aura: 0.72, shake: 0.0 },
  relax:      { hz: 1.7, amp: 0.11, fin: 0.64, bend: 0.0,  mouth: 0.06, brow: 0.25, eye: 0.48, aura: 0.35, shake: 0.0 },
  left_turn:  { hz: 6.8, amp: 0.30, fin: 0.58, bend: -0.60, mouth: 0.15, brow: 0.55, eye: 1.0,  aura: 0.65, shake: 0.0 },
  right_turn: { hz: 6.8, amp: 0.30, fin: 0.58, bend: 0.60,  mouth: 0.15, brow: 0.55, eye: 1.0,  aura: 0.65, shake: 0.0 },
  eating:     { hz: 8.6, amp: 0.28, fin: 0.60, bend: 0.0,  mouth: 1.0,  brow: 0.84, eye: 1.06, aura: 0.88, shake: 0.16 },
  hungry:     { hz: 5.6, amp: 0.25, fin: 0.48, bend: 0.0,  mouth: 0.72, brow: 0.86, eye: 1.12, aura: 0.92, shake: 0.12 },
  stress:     { hz: 9.4, amp: 0.16, fin: 0.36, bend: 0.0,  mouth: 0.32, brow: 0.94, eye: 0.28, aura: 0.80, shake: 1.18 },
  fear:       { hz: 10.6, amp: 0.24, fin: 0.78, bend: 0.0, mouth: 0.54, brow: -0.46, eye: 1.35, aura: 0.24, shake: 1.40 },
  shock:      { hz: 1.8, amp: 0.06, fin: 0.88, bend: 0.0,  mouth: 0.82, brow: -0.58, eye: 1.46, aura: 0.20, shake: 1.64 },
  happy:      { hz: 5.8, amp: 0.32, fin: 0.68, bend: 0.0,  mouth: 0.60, brow: 0.36, eye: 0.72, aura: 0.95, shake: 0.0 },
  sad:        { hz: 1.3, amp: 0.08, fin: 0.18, bend: 0.0,  mouth: 0.04, brow: -0.34, eye: 0.66, aura: 0.22, shake: 0.0 },
};

function cubicEase(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export class VillainBluetangfish {
  static metadata = {
    name: 'Villain Regal Blue Tang',
    category: 'villain_fish',
    baseLength: 85,
    baseWidth: 44,
  };

  constructor(x = 0, y = 0, scale = 1) {
    this.x = x;
    this.y = y;
    this.scale = scale;
    this.angle = 0;

    this._state = 'breathing';
    this._prevState = 'breathing';
    this._stateTime = 0;
    this._time = 0;
    this._phase = 0;

    this._blendDur = 0.15;
    this._blendTime = 0.15;
    this._from = { ...POSES.breathing };
    this._to = { ...POSES.breathing };
    this._cur = { ...POSES.breathing };
    this._callbacks = new Map();
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
    const key = ALIASES[name] || name;
    if (!this._callbacks.has(key)) this._callbacks.set(key, []);
    this._callbacks.get(key).push(callback);
  }

  play(name) {
    const next = ALIASES[name] || name;
    if (!POSES[next]) return;

    if ((this._state === 'shock' || this._state === 'fear') && LOCKED_BLOCK.has(next)) {
      return;
    }
    if (next === this._state && !ONE_SHOT_STATES.has(next)) return;

    if (ONE_SHOT_STATES.has(next) && !ONE_SHOT_STATES.has(this._state)) {
      this._prevState = this._state;
    }
    this._state = next;
    this._stateTime = 0;
    this._from = { ...this._cur };
    this._to = { ...POSES[next] };
    this._blendTime = 0;
  }

  update(dt) {
    const d = Number.isFinite(dt) && dt > 0 ? dt : 0;
    this._time += d;
    this._stateTime += d;

    if (this._blendTime < this._blendDur) {
      this._blendTime = Math.min(this._blendDur, this._blendTime + d);
      const u = cubicEase(this._blendTime / this._blendDur);
      for (const k of Object.keys(this._cur)) {
        this._cur[k] = this._from[k] + (this._to[k] - this._from[k]) * u;
      }
    } else {
      for (const k of Object.keys(this._cur)) {
        this._cur[k] = this._to[k];
      }
    }

    this._phase += d * this._cur.hz;

    if (ONE_SHOT_STATES.has(this._state) && this._stateTime >= ONE_SHOT_TIME[this._state]) {
      const done = this._state;
      const ret = POSES[this._prevState] && !ONE_SHOT_STATES.has(this._prevState) ? this._prevState : 'breathing';
      this._state = ret;
      this._stateTime = 0;
      this._from = { ...this._cur };
      this._to = { ...POSES[ret] };
      this._blendTime = 0;

      const list = this._callbacks.get(done);
      if (list) for (const fn of list) fn(done);
    }
  }

  draw(ctx) {
    const p = this._cur;
    const t = this._time;
    const halfL = VillainBluetangfish.metadata.baseLength * 0.5;
    const halfW = VillainBluetangfish.metadata.baseWidth * 0.5;

    const wag = Math.sin(this._phase) * p.amp + p.bend * 0.65;
    const sway = Math.sin(this._phase - 0.7) * p.amp * 0.26 + p.bend * 0.3;
    const jx = p.shake > 0 ? Math.sin(t * 58) * p.shake * 1.1 : 0;
    const jy = p.shake > 0 ? Math.cos(t * 64) * p.shake * 1.25 : 0;

    ctx.save();
    ctx.translate(this.x + jx, this.y + jy);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Storm-indigo & toxic-chartreuse shadow aura
    this._drawToxicAura(ctx, halfL, halfW, p.aura, t);

    // 2. Barbed toxic neon-chartreuse tail with black trim
    this._drawBarbedChartreuseTail(ctx, -halfL * 0.60, sway * 8, wag, t);

    // 3. Notched indigo-chartreuse pectoral fins
    this._drawTangPectoral(ctx, 8, -halfW * 0.68, -1, p.fin, t);
    this._drawTangPectoral(ctx, 8, halfW * 0.68, 1, p.fin, t);

    // 4. Chunky storm-indigo body with jagged black tribal palette marking
    this._drawStormBody(ctx, halfL, halfW, sway, t);

    // 5. Toxic chartreuse venomous caudal scalpel spines (surgeonfish weapon!)
    this._drawCaudalScalpels(ctx, -halfL * 0.52, sway * 7, t);

    // 6. Spiked dorsal ridge
    this._drawDorsalRidge(ctx, sway, wag);

    // 7. Fanged beak mouth
    this._drawTangMouth(ctx, halfL, p.mouth, t);

    // 8. Glowing toxic-chartreuse villain eyes with V-brows
    this._drawTangEyes(ctx, halfL, halfW, p, t);

    // 9. Mood FX
    this._drawMoodFX(ctx, halfL, halfW, t);

    ctx.restore();
  }

  _drawToxicAura(ctx, halfL, halfW, aura, t) {
    const r = halfL * (1.06 + Math.sin(t * 2.4) * 0.04);
    const g = ctx.createRadialGradient(-4, 0, 5, -4, 0, r);
    g.addColorStop(0, `rgba(18, 12, 40, ${0.46 * aura})`);
    g.addColorStop(0.58, `rgba(155, 255, 24, ${0.18 * aura})`);
    g.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(-4, 0, r, halfW * 1.28, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawBarbedChartreuseTail(ctx, tx, ty, wag, t) {
    ctx.save();
    ctx.translate(tx, ty * 0.4);
    ctx.rotate(wag * 0.92);

    const g = ctx.createLinearGradient(0, 0, -21, 0);
    g.addColorStop(0, '#B8FF1A');
    g.addColorStop(0.65, '#8CFF00');
    g.addColorStop(1, '#3D8800');

    ctx.fillStyle = g;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.6;
    ctx.lineJoin = 'round';

    // Iconic yellow-tang wedge tail corrupted into wicked barbed crescent
    ctx.beginPath();
    ctx.moveTo(3, -4.5);
    ctx.lineTo(-19, -15.5);
    ctx.lineTo(-13, -7.0);
    ctx.lineTo(-18, -2.5);
    ctx.lineTo(-12.5, 0);
    ctx.lineTo(-18, 2.5);
    ctx.lineTo(-13, 7.0);
    ctx.lineTo(-19, 15.5);
    ctx.lineTo(3, 4.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Thick wicked black trim along outer tail edges
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(2, -4.5);
    ctx.lineTo(-18, -14.8);
    ctx.moveTo(2, 4.5);
    ctx.lineTo(-18, 14.8);
    ctx.stroke();

    // Toxic glowing acid core vein
    ctx.strokeStyle = `rgba(235, 255, 140, ${0.65 + Math.sin(t * 6) * 0.25})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-12, 0);
    ctx.stroke();
    ctx.restore();
  }

  _drawTangPectoral(ctx, ox, oy, side, spread, t) {
    ctx.save();
    ctx.translate(ox, oy);
    const flutter = Math.sin(this._phase * 0.9 + side) * 0.18;
    ctx.rotate(side * (0.32 + spread * 0.56 + flutter));

    const g = ctx.createLinearGradient(0, 0, -10, side * 18);
    g.addColorStop(0, '#222F88');
    g.addColorStop(0.6, '#141336');
    g.addColorStop(1, '#B4FF1A');

    ctx.fillStyle = g;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.0;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(5, 0);
    ctx.quadraticCurveTo(4, side * 13, -4, side * 18);
    ctx.lineTo(-6, side * 12);
    ctx.lineTo(-11, side * 15);
    ctx.quadraticCurveTo(-14, side * 8, -7, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = `rgba(186, 255, 36, ${0.55 + Math.sin(t * 5) * 0.2})`;
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(1, side * 3);
    ctx.lineTo(-4, side * 15);
    ctx.stroke();
    ctx.restore();
  }

  _drawStormBody(ctx, halfL, halfW, sway, t) {
    const sy = sway * 5.2;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(halfL * 0.88, 0);
    ctx.bezierCurveTo(halfL * 0.80, -halfW * 0.90, halfL * 0.14, -halfW * 0.98, -halfL * 0.26, -halfW * 0.62 + sy * 0.45);
    ctx.quadraticCurveTo(-halfL * 0.50, -halfW * 0.34 + sy, -halfL * 0.62, -halfW * 0.18 + sy);
    ctx.lineTo(-halfL * 0.62, halfW * 0.18 + sy);
    ctx.quadraticCurveTo(-halfL * 0.50, halfW * 0.34 + sy, -halfL * 0.26, halfW * 0.62 + sy * 0.45);
    ctx.bezierCurveTo(halfL * 0.14, halfW * 0.98, halfL * 0.80, halfW * 0.90, halfL * 0.88, 0);
    ctx.closePath();

    // Storm-indigo body gradient
    const bg = ctx.createLinearGradient(halfL * 0.85, -halfW, -halfL * 0.6, halfW);
    bg.addColorStop(0, '#2E4BFF');
    bg.addColorStop(0.45, '#1D298A');
    bg.addColorStop(0.82, '#15144D');
    bg.addColorStop(1, '#0F0B26');
    ctx.fillStyle = bg;
    ctx.fill();

    ctx.save();
    ctx.clip();

    // Dark cel-shade underside
    ctx.fillStyle = 'rgba(14, 6, 26, 0.36)';
    ctx.beginPath();
    ctx.ellipse(2, halfW * 0.65, halfL * 0.85, halfW * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wicked jagged black tribal palette marking (Regal Blue Tang signature, corrupted)
    for (const side of [-1, 1]) {
      ctx.fillStyle = '#120A1E';
      ctx.strokeStyle = '#536DFF';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(22, side * 5);
      ctx.lineTo(13, side * 14);
      ctx.lineTo(5, side * 10);
      ctx.lineTo(-4, side * 16);
      ctx.lineTo(-16, side * 11);
      ctx.lineTo(-26, side * 5);
      ctx.lineTo(-14, side * 4);
      ctx.lineTo(-5, side * 8);
      ctx.lineTo(6, side * 4);
      ctx.lineTo(14, side * 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Toxic chartreuse glowing rune bolt along spine
    ctx.strokeStyle = `rgba(182, 255, 26, ${0.55 + Math.sin(t * 4.8) * 0.25})`;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(6, -3);
    ctx.lineTo(-2, 2.5);
    ctx.lineTo(-12, -2);
    ctx.lineTo(-20, 0);
    ctx.stroke();

    // Wet chibi highlight
    ctx.fillStyle = 'rgba(175, 205, 255, 0.32)';
    ctx.beginPath();
    ctx.ellipse(11, -halfW * 0.38, 15, 4.4, -0.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.4;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  _drawCaudalScalpels(ctx, px, py, t) {
    // Razor-sharp toxic chartreuse spines flanking tail peduncle
    ctx.save();
    ctx.translate(px, py * 0.5);
    ctx.fillStyle = `rgba(188, 255, 20, ${0.85 + Math.sin(t * 7) * 0.15})`;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.5;

    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(4, side * 4);
      ctx.lineTo(-3, side * 11.5);
      ctx.lineTo(-5, side * 4.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawDorsalRidge(ctx, sway, wag) {
    ctx.save();
    ctx.fillStyle = '#140B24';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(5, -2.8 + sway * 1.5);
    ctx.lineTo(-4, -3.2 + sway * 3);
    ctx.lineTo(-16, -2.5 + wag * 4);
    ctx.lineTo(-22, wag * 5);
    ctx.lineTo(-16, 2.5 + wag * 4);
    ctx.lineTo(-4, 3.2 + sway * 3);
    ctx.lineTo(5, 2.8 + sway * 1.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  _drawTangMouth(ctx, halfL, mouth, t) {
    const mx = halfL * 0.82;
    const open = this._state === 'eating' || this._state === 'hungry'
      ? Math.abs(Math.sin(t * 14)) * 0.45 + mouth * 0.55
      : mouth;

    if (open > 0.2 || this._state === 'happy') {
      const w = 2.6 + open * 3.8;
      ctx.save();
      ctx.fillStyle = '#1E0826';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(mx + 1.2, 0, 2.0 + open * 2.5, w, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#EEFFCC';
      for (const fy of [-w * 0.52, 0, w * 0.52]) {
        ctx.beginPath();
        ctx.moveTo(mx + 0.6, fy - 1.1);
        ctx.lineTo(mx + 4.1 + open, fy);
        ctx.lineTo(mx + 0.6, fy + 1.1);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
  }

  _drawTangEyes(ctx, halfL, halfW, p, t) {
    const ex = halfL * 0.52;
    const ey = halfW * 0.46;

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

      ctx.fillStyle = '#F5FFE6';
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, side * 0.14, 0, Math.PI * 2);
      ctx.fill();

      const ir = this._state === 'shock' ? 1.4 : 2.6;
      const ig = ctx.createRadialGradient(0.5, 0, 0.3, 0.5, 0, ir);
      ig.addColorStop(0, '#E8FF75');
      ig.addColorStop(0.55, '#92FF00');
      ig.addColorStop(1, '#265E00');
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
        ctx.fillStyle = '#181E5C';
        ctx.beginPath();
        ctx.ellipse(-0.9, 0, rx + 0.4, ry * 0.56, side * 0.14, Math.PI * 0.5, Math.PI * 1.5);
        ctx.fill();
      }

      const tilt = p.brow * 0.55;
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-4.2, -side * (2.6 - tilt * 2.5));
      ctx.lineTo(4.6, -side * (1.4 + tilt * 2.6));
      ctx.stroke();

      if (this._state === 'hungry' || this._state === 'eating') {
        ctx.strokeStyle = `rgba(182, 255, 36, ${0.65 + Math.sin(t * 14) * 0.3})`;
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
        const sx = 5 + Math.cos(a) * (halfL * 0.7);
        const sy = Math.sin(a) * (halfW * 1.05);
        const r = 2.8 + Math.sin(t * 7 + i) * 0.9;
        ctx.fillStyle = i % 2 === 0 ? '#A6FF00' : '#9B30FF';
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
      ctx.translate(halfL * 0.62, -halfW * 0.98);
      ctx.fillStyle = '#FF2855';
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
        const d = (t * 26 + i * 6) % 9;
        const x = 15 - i * 8;
        const y = -halfW * 0.85 - d * 0.55;
        ctx.fillStyle = '#7CE8FF';
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x, y - 3.5);
        ctx.quadraticCurveTo(x + 2.7, y + 1, x, y + 3);
        ctx.quadraticCurveTo(x - 2.7, y + 1, x, y - 3.5);
        ctx.fill();
        ctx.stroke();
      }
    } else if (this._state === 'stress') {
      const s = 1 + Math.sin(t * 20) * 0.18;
      ctx.save();
      ctx.translate(13, -halfW * 0.82);
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

export default VillainBluetangfish;
