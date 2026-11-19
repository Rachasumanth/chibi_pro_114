/**
 * Villain Tiger Oscar — 2D Top-Down Expressive Chibi Villain Fish
 * Pitch-black velvet body slashed with molten-lava orange tiger cracks
 * and a sinister glowing eye-of-fire tail ocellus.
 */

const VALID_STATES = new Set([
  'breathing', 'swimming', 'relax', 'left_turn', 'right_turn',
  'eating', 'hungry', 'stress', 'fear', 'shock', 'happy', 'sad'
]);
const ONE_SHOTS = new Set(['left_turn', 'right_turn', 'eating', 'shock']);
const LOCKED = new Set(['shock', 'fear']);
const BLOCKED = new Set(['left_turn', 'right_turn', 'relax', 'happy', 'eating']);
const ALIASES = { idle: 'breathing', hunger: 'hungry' };
const ONE_SHOT_DUR = { left_turn: 0.56, right_turn: 0.56, eating: 0.62, shock: 0.72 };

function cubicOut(t) {
  const c = Math.max(0, Math.min(1, t));
  return 1 - (1 - c) * (1 - c) * (1 - c);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function poseFor(state) {
  switch (state) {
    case 'swimming':
      return { freq: 6.8, amp: 0.24, bend: 0, lava: 1.0, mouth: 0.14, fin: 0.32, shake: 0 };
    case 'relax':
      return { freq: 1.8, amp: 0.06, bend: 0, lava: 0.58, mouth: 0.04, fin: 0.08, shake: 0 };
    case 'left_turn':
      return { freq: 5.8, amp: 0.18, bend: -0.38, lava: 1.08, mouth: 0.16, fin: 0.45, shake: 0 };
    case 'right_turn':
      return { freq: 5.8, amp: 0.18, bend: 0.38, lava: 1.08, mouth: 0.16, fin: 0.45, shake: 0 };
    case 'eating':
      return { freq: 5.2, amp: 0.14, bend: 0, lava: 1.32, mouth: 0.96, fin: 0.55, shake: 0.02 };
    case 'hungry':
      return { freq: 5.0, amp: 0.18, bend: 0, lava: 1.25, mouth: 0.56, fin: 0.44, shake: 0.015 };
    case 'stress':
      return { freq: 9.4, amp: 0.11, bend: 0, lava: 1.4, mouth: 0.3, fin: 0.68, shake: 0.06 };
    case 'fear':
      return { freq: 11.0, amp: 0.15, bend: 0, lava: 0.5, mouth: 0.46, fin: 0.78, shake: 0.085 };
    case 'shock':
      return { freq: 12.6, amp: 0.09, bend: 0, lava: 1.48, mouth: 0.82, fin: 0.9, shake: 0.1 };
    case 'happy':
      return { freq: 4.0, amp: 0.13, bend: 0.05, lava: 1.15, mouth: 0.24, fin: 0.36, shake: 0 };
    case 'sad':
      return { freq: 1.4, amp: 0.04, bend: -0.05, lava: 0.35, mouth: 0.02, fin: -0.18, shake: 0 };
    case 'breathing':
    default:
      return { freq: 2.5, amp: 0.08, bend: 0, lava: 0.85, mouth: 0.08, fin: 0.16, shake: 0 };
  }
}

export class VillainOscarfish {
  static metadata = {
    name: 'Villain Tiger Oscar',
    category: 'villain_fish',
    baseLength: 95,
    baseWidth: 52
  };

  constructor(x = 0, y = 0, scale = 1) {
    this.x = x;
    this.y = y;
    this.scale = scale;
    this.angle = 0;

    this._state = 'breathing';
    this._prevState = 'breathing';
    this._time = 0;
    this._stateTime = 0;
    this._phase = 0;

    this._blendDur = 0.15;
    this._blendElapsed = 0.15;
    this._from = poseFor('breathing');
    this._to = poseFor('breathing');
    this._pose = { ...this._to };
    this._listeners = new Map();
  }

  play(name) {
    const next = ALIASES[name] || name;
    if (!VALID_STATES.has(next)) return this;
    if (LOCKED.has(this._state) && BLOCKED.has(next)) return this;
    if (next === this._state && !ONE_SHOTS.has(next)) return this;

    if (!ONE_SHOTS.has(this._state)) this._prevState = this._state;
    this._from = { ...this._pose };
    this._to = poseFor(next);
    this._blendElapsed = 0;
    this._state = next;
    this._stateTime = 0;
    return this;
  }

  update(dt) {
    if (!Number.isFinite(dt) || dt <= 0) return;
    const step = Math.min(dt, 0.1);
    this._time += step;
    this._stateTime += step;

    if (this._blendElapsed < this._blendDur) {
      this._blendElapsed = Math.min(this._blendDur, this._blendElapsed + step);
      const t = cubicOut(this._blendElapsed / this._blendDur);
      for (const k of Object.keys(this._pose)) {
        this._pose[k] = lerp(this._from[k], this._to[k], t);
      }
    } else {
      for (const k of Object.keys(this._pose)) {
        this._pose[k] = this._to[k];
      }
    }

    this._phase += step * this._pose.freq;

    if (ONE_SHOTS.has(this._state)) {
      const dur = ONE_SHOT_DUR[this._state] || 0.6;
      if (this._stateTime >= dur) {
        const done = this._state;
        const ret = this._prevState || 'breathing';
        this._from = { ...this._pose };
        this._to = poseFor(ret);
        this._blendElapsed = 0;
        this._state = ret;
        this._stateTime = 0;
        this._emit(done);
      }
    }
  }

  setAngle(radians) {
    if (Number.isFinite(radians)) this.angle = radians;
  }

  setDirection(dx, dy) {
    if (dx !== 0 || dy !== 0) this.angle = Math.atan2(dy, dx);
  }

  getState() {
    return this._state;
  }

  onFinished(name, callback) {
    if (typeof callback !== 'function') return this;
    const key = ALIASES[name] || name;
    if (!this._listeners.has(key)) this._listeners.set(key, []);
    this._listeners.get(key).push(callback);
    return this;
  }

  _emit(name) {
    const arr = this._listeners.get(name);
    if (!arr) return;
    for (const cb of arr.slice()) cb(name, this);
  }

  draw(ctx) {
    if (!ctx) return;
    const p = this._pose;
    const t = this._time;
    const wag = Math.sin(this._phase) * p.amp;
    const bend = p.bend + wag * 0.34;
    const lava = (0.74 + 0.26 * Math.sin(t * 4.6)) * p.lava;
    const sx = p.shake ? Math.sin(t * 60) * p.shake * 20 : 0;
    const sy = p.shake ? Math.cos(t * 64) * p.shake * 20 : 0;

    ctx.save();
    ctx.translate(this.x + sx, this.y + sy);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Velvet-black & molten-orange shadow miasma
    const aura = ctx.createRadialGradient(-2, 0, 8, -2, 0, 56);
    aura.addColorStop(0, `rgba(12, 6, 18, ${0.56 * Math.min(1.2, p.lava)})`);
    aura.addColorStop(0.55, `rgba(255, 112, 24, ${0.24 * lava})`);
    aura.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.ellipse(-2, 0, 54, 34, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Rounded velvet-black Oscar paddle tail with battle notch
    ctx.save();
    ctx.translate(-34, bend * 14);
    ctx.rotate(-bend * 0.8 - wag * 1.2);
    const tg = ctx.createLinearGradient(0, 0, -20, 0);
    tg.addColorStop(0, '#1B1124');
    tg.addColorStop(0.7, '#0E0814');
    tg.addColorStop(1, '#FF6818');
    ctx.fillStyle = tg;
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(4, -9);
    ctx.quadraticCurveTo(-14, -18, -19, -6);
    ctx.lineTo(-14, -2); // battle notch
    ctx.lineTo(-20, 3);
    ctx.quadraticCurveTo(-14, 18, 4, 9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 3. Broad sweeping velvet pectoral fins with lava trim
    for (const side of [-1, 1]) {
      ctx.save();
      const flap = p.fin * 0.3 + Math.sin(this._phase + side) * 0.1;
      ctx.translate(10, side * 20);
      ctx.rotate(side * (0.42 + flap) + bend * 0.22);
      ctx.fillStyle = '#1B1124';
      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 2.3;
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.quadraticCurveTo(5, side * 14, -5, side * 16);
      ctx.lineTo(-10, side * 10);
      ctx.lineTo(-10, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = `rgba(255, 118, 28, ${0.8 * lava})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(4, side * 13);
      ctx.lineTo(-5, side * 15);
      ctx.stroke();
      ctx.restore();
    }

    // 4. Pitch-black velvet chibi body
    const breath = 1 + Math.sin(t * 2.9) * 0.022;
    ctx.save();
    ctx.scale(breath, breath);
    const bodyGrad = ctx.createRadialGradient(12, -5, 5, 0, 0, 48);
    bodyGrad.addColorStop(0, '#32263D');
    bodyGrad.addColorStop(0.42, '#1A1224');
    bodyGrad.addColorStop(0.85, '#0F0917');
    bodyGrad.addColorStop(1, '#140B1C');

    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 3.2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(45, 0);
    ctx.quadraticCurveTo(42, -21, 16, -24);
    ctx.quadraticCurveTo(-8, -25, -26, -13);
    ctx.lineTo(-36, -7 + bend * 12);
    ctx.lineTo(-36, 7 + bend * 12);
    ctx.lineTo(-26, 13);
    ctx.quadraticCurveTo(-8, 25, 16, 24);
    ctx.quadraticCurveTo(42, 21, 45, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 5. Molten-lava orange tiger cracks slashing across the velvet body
    ctx.save();
    ctx.strokeStyle = `rgba(255, 102, 18, ${0.92 * lava})`;
    ctx.shadowColor = '#FF5500';
    ctx.shadowBlur = 6 * lava;
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(22, -21);
    ctx.lineTo(14, -9);
    ctx.lineTo(6, -18);
    ctx.moveTo(14, -9);
    ctx.lineTo(2, -4);
    ctx.lineTo(-8, -19);
    ctx.moveTo(22, 21);
    ctx.lineTo(14, 9);
    ctx.lineTo(6, 18);
    ctx.moveTo(14, 9);
    ctx.lineTo(2, 4);
    ctx.lineTo(-8, 19);
    ctx.stroke();

    // White-hot inner lava core
    ctx.shadowBlur = 0;
    ctx.strokeStyle = `rgba(255, 224, 108, ${0.88 * lava})`;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();

    // 6. Sinister glowing Eye-of-Fire tail ocellus!
    const ox = -26;
    const oy = bend * 9;
    ctx.save();
    ctx.translate(ox, oy);
    const og = ctx.createRadialGradient(0, 0, 1.5, 0, 0, 8.5);
    og.addColorStop(0, '#FFF599');
    og.addColorStop(0.45, '#FF5A14');
    og.addColorStop(0.8, '#8C0B16');
    og.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = og;
    ctx.beginPath();
    ctx.arc(0, 0, 8.5, 0, Math.PI * 2);
    ctx.fill();

    // Black ring + fiery vertical slit inside ocellus
    ctx.fillStyle = '#140B1C';
    ctx.strokeStyle = '#FF7B1C';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, 5.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFAE22';
    ctx.beginPath();
    ctx.ellipse(0, 0, 1.3, 3.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Glossy velvet forehead highlight
    ctx.fillStyle = 'rgba(220, 200, 255, 0.16)';
    ctx.beginPath();
    ctx.ellipse(22, -10, 12, 4.2, -0.22, 0, Math.PI * 2);
    ctx.fill();

    // 7. Chunky fanged Oscar mouth
    const chomp = this._state === 'eating'
      ? 0.4 + 0.6 * Math.abs(Math.sin(this._stateTime * 19))
      : this._state === 'hungry'
        ? 0.45 + 0.25 * Math.sin(t * 10)
        : p.mouth;
    ctx.save();
    ctx.translate(43, 0);
    ctx.fillStyle = '#380814';
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 2.1;
    ctx.beginPath();
    ctx.ellipse(-2, 0, 4.5, 5.8 + chomp * 4.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFF5EB';
    ctx.lineWidth = 1.0;
    for (const fy of [-3.2, 0, 3.2]) {
      ctx.beginPath();
      ctx.moveTo(-1, fy - 1.5);
      ctx.lineTo(3.2 + chomp * 1.6, fy);
      ctx.lineTo(-1, fy + 1.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    // 8. Expressive Fiery Villain Eyes
    this._drawEyes(ctx, t, lava);

    ctx.restore();
    this._drawMoodFX(ctx, t);
    ctx.restore();
  }

  _drawEyes(ctx, t, lava) {
    const st = this._state;
    for (const side of [-1, 1]) {
      const ex = 26;
      const ey = side * 12.8;

      if (st === 'stress') {
        ctx.strokeStyle = '#FF7B1C';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(ex - 3.6, ey - side * 2.8);
        ctx.lineTo(ex + 3.0, ey);
        ctx.lineTo(ex - 3.6, ey + side * 2.8);
        ctx.stroke();
        continue;
      }

      const r = st === 'shock' ? 6.2 : 5.2;
      ctx.fillStyle = st === 'shock' ? '#FFFFFF' : '#1E0810';
      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.arc(ex, ey, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (st === 'shock') {
        ctx.fillStyle = '#140B1C';
        ctx.beginPath();
        ctx.arc(ex + 1, ey, 1.7, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const ig = ctx.createRadialGradient(ex + 0.8, ey, 0.5, ex, ey, 3.8);
        ig.addColorStop(0, '#FFF599');
        ig.addColorStop(0.55, '#FF7214');
        ig.addColorStop(1, '#7D1008');
        ctx.fillStyle = ig;
        ctx.beginPath();
        ctx.arc(ex + 0.7, ey, 3.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#140B1C';
        ctx.beginPath();
        ctx.ellipse(ex + 1.1, ey, 1.3, 2.7, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(ex + 2.2, ey - side * 1.2, 1.25, 0, Math.PI * 2);
        ctx.arc(ex - 0.5, ey + side * 1.2, 0.65, 0, Math.PI * 2);
        ctx.fill();
      }

      if (st === 'relax' || st === 'happy') {
        ctx.fillStyle = '#221830';
        ctx.beginPath();
        ctx.arc(ex, ey, r + 0.4, -Math.PI * 0.88, Math.PI * 0.12);
        ctx.closePath();
        ctx.fill();
      }

      ctx.strokeStyle = '#FF7214';
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (st === 'sad' || st === 'fear') {
        ctx.moveTo(ex - 3.8, ey + side * 3.8);
        ctx.lineTo(ex + 4.2, ey + side * 5.8);
      } else if (st === 'shock') {
        ctx.moveTo(ex - 3.2, ey + side * 6.8);
        ctx.lineTo(ex + 4.0, ey + side * 6.8);
      } else {
        ctx.moveTo(ex + 4.8, ey - side * 2.0);
        ctx.lineTo(ex - 4.0, ey + side * 5.0);
      }
      ctx.stroke();

      if (st === 'hungry') {
        ctx.strokeStyle = `rgba(255, 114, 20, ${0.76 * lava})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(ex, ey, r + 2.1 + Math.sin(t * 15) * 0.7, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  _drawMoodFX(ctx, t) {
    const st = this._state;
    if (st === 'happy') {
      for (let i = 0; i < 4; i++) {
        const a = t * 2.6 + i * 1.57;
        const x = 10 + Math.cos(a) * 36;
        const y = Math.sin(a) * 26;
        const s = 3.2 + Math.sin(t * 8 + i) * 1.0;
        ctx.fillStyle = i % 2 === 0 ? '#FF5500' : '#A442FF';
        ctx.beginPath();
        ctx.moveTo(x, y - s);
        ctx.lineTo(x + s * 0.35, y - s * 0.35);
        ctx.lineTo(x + s, y);
        ctx.lineTo(x + s * 0.35, y + s * 0.35);
        ctx.lineTo(x, y + s);
        ctx.lineTo(x - s * 0.35, y + s * 0.35);
        ctx.lineTo(x - s, y);
        ctx.lineTo(x - s * 0.35, y - s * 0.35);
        ctx.closePath();
        ctx.fill();
      }
    } else if (st === 'shock') {
      const b = Math.abs(Math.sin(t * 18)) * 4;
      ctx.save();
      ctx.translate(38 + b, -22);
      ctx.fillStyle = '#FF6818';
      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.roundRect(-2.5, -13, 5, 11, 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 3.2, 2.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (st === 'fear') {
      for (let i = 0; i < 2; i++) {
        const d = (t * 26 + i * 11) % 14;
        const dx = 20 - i * 16;
        const dy = (i === 0 ? -27 : 27) + (i === 0 ? -d * 0.35 : d * 0.35);
        ctx.fillStyle = '#7EE8FF';
        ctx.strokeStyle = '#140B1C';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(dx, dy - 5);
        ctx.quadraticCurveTo(dx + 4, dy + 1, dx, dy + 4.5);
        ctx.quadraticCurveTo(dx - 4, dy + 1, dx, dy - 5);
        ctx.fill();
        ctx.stroke();
      }
    } else if (st === 'stress') {
      const s = 1 + Math.sin(t * 24) * 0.16;
      ctx.save();
      ctx.translate(26, -22);
      ctx.scale(s, s);
      ctx.strokeStyle = '#FF2A4B';
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      for (let q = 0; q < 4; q++) {
        ctx.save();
        ctx.rotate((q * Math.PI) / 2);
        ctx.beginPath();
        ctx.moveTo(2, 2);
        ctx.quadraticCurveTo(3.5, 5.5, 7, 5);
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    } else if (st === 'sad') {
      const d = (t * 10) % 9;
      ctx.fillStyle = '#75DAFF';
      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(26, 18 + d * 0.4);
      ctx.quadraticCurveTo(29.5, 22 + d * 0.4, 26, 25 + d * 0.4);
      ctx.quadraticCurveTo(22.5, 22 + d * 0.4, 26, 18 + d * 0.4);
      ctx.fill();
      ctx.stroke();
    }
  }
}

export default VillainOscarfish;
