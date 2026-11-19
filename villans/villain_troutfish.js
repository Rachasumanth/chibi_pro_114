/**
 * Villain Rainbow Trout — 2D Top-Down Expressive Chibi Villain Fish
 * Storm-grey speckled body slashed by a crackling neon-magenta villain stripe,
 * scarred gill plate, and sharp forked tail.
 */

const VALID_STATES = new Set([
  'breathing', 'swimming', 'relax', 'left_turn', 'right_turn',
  'eating', 'hungry', 'stress', 'fear', 'shock', 'happy', 'sad'
]);
const ONE_SHOTS = new Set(['left_turn', 'right_turn', 'eating', 'shock']);
const LOCKED = new Set(['shock', 'fear']);
const BLOCKED = new Set(['left_turn', 'right_turn', 'relax', 'happy', 'eating']);
const ALIASES = { idle: 'breathing', hunger: 'hungry' };
const ONE_SHOT_DUR = { left_turn: 0.54, right_turn: 0.54, eating: 0.6, shock: 0.7 };

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
      return { freq: 7.4, amp: 0.26, bend: 0, bolt: 1.0, mouth: 0.14, fin: 0.32, shake: 0 };
    case 'relax':
      return { freq: 1.9, amp: 0.06, bend: 0, bolt: 0.58, mouth: 0.04, fin: 0.08, shake: 0 };
    case 'left_turn':
      return { freq: 6.2, amp: 0.19, bend: -0.4, bolt: 1.1, mouth: 0.16, fin: 0.45, shake: 0 };
    case 'right_turn':
      return { freq: 6.2, amp: 0.19, bend: 0.4, bolt: 1.1, mouth: 0.16, fin: 0.45, shake: 0 };
    case 'eating':
      return { freq: 5.4, amp: 0.15, bend: 0, bolt: 1.35, mouth: 0.94, fin: 0.54, shake: 0.02 };
    case 'hungry':
      return { freq: 5.2, amp: 0.18, bend: 0, bolt: 1.28, mouth: 0.56, fin: 0.44, shake: 0.015 };
    case 'stress':
      return { freq: 9.6, amp: 0.12, bend: 0, bolt: 1.45, mouth: 0.3, fin: 0.68, shake: 0.06 };
    case 'fear':
      return { freq: 11.2, amp: 0.15, bend: 0, bolt: 0.5, mouth: 0.46, fin: 0.78, shake: 0.085 };
    case 'shock':
      return { freq: 12.8, amp: 0.09, bend: 0, bolt: 1.5, mouth: 0.82, fin: 0.9, shake: 0.1 };
    case 'happy':
      return { freq: 4.1, amp: 0.14, bend: 0.05, bolt: 1.16, mouth: 0.24, fin: 0.36, shake: 0 };
    case 'sad':
      return { freq: 1.5, amp: 0.04, bend: -0.05, bolt: 0.35, mouth: 0.02, fin: -0.18, shake: 0 };
    case 'breathing':
    default:
      return { freq: 2.6, amp: 0.08, bend: 0, bolt: 0.85, mouth: 0.08, fin: 0.16, shake: 0 };
  }
}

const SPECKLES = [
  [14, -10], [4, -13], [-6, -11], [-18, -8], [-28, -5],
  [14, 10], [4, 13], [-6, 11], [-18, 8], [-28, 5],
  [8, -3], [-4, 2], [-14, -2], [-24, 2]
];

export class VillainTroutfish {
  static metadata = {
    name: 'Villain Rainbow Trout',
    category: 'villain_fish',
    baseLength: 110,
    baseWidth: 40
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
      const dur = ONE_SHOT_DUR[this._state] || 0.58;
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
    const bend = p.bend + wag * 0.35;
    const bolt = (0.74 + 0.26 * Math.sin(t * 6.2)) * p.bolt;
    const sx = p.shake ? Math.sin(t * 62) * p.shake * 20 : 0;
    const sy = p.shake ? Math.cos(t * 66) * p.shake * 20 : 0;

    ctx.save();
    ctx.translate(this.x + sx, this.y + sy);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Storm-cloud & neon-magenta shadow miasma
    const aura = ctx.createRadialGradient(-2, 0, 7, -2, 0, 62);
    aura.addColorStop(0, `rgba(18, 12, 26, ${0.52 * Math.min(1.2, p.bolt)})`);
    aura.addColorStop(0.55, `rgba(255, 42, 198, ${0.22 * bolt})`);
    aura.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.ellipse(-2, 0, 60, 28, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Sharp forked storm-grey tail fin with magenta rim
    ctx.save();
    ctx.translate(-38, bend * 14);
    ctx.rotate(-bend * 0.85 - wag * 1.25);
    const tg = ctx.createLinearGradient(0, 0, -22, 0);
    tg.addColorStop(0, '#444C5E');
    tg.addColorStop(0.65, '#202430');
    tg.addColorStop(1, '#FF2EC4');
    ctx.fillStyle = tg;
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(4, -5);
    ctx.lineTo(-21, -15);
    ctx.lineTo(-12, -3);
    ctx.lineTo(-15, 0);
    ctx.lineTo(-12, 3);
    ctx.lineTo(-21, 15);
    ctx.lineTo(4, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 3. Swept storm-steel pectoral fins
    for (const side of [-1, 1]) {
      ctx.save();
      const flap = p.fin * 0.3 + Math.sin(this._phase + side) * 0.12;
      ctx.translate(12, side * 16);
      ctx.rotate(side * (0.44 + flap) + bend * 0.22);
      ctx.fillStyle = '#363D4F';
      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 2.1;
      ctx.beginPath();
      ctx.moveTo(7, 0);
      ctx.lineTo(1, side * 13);
      ctx.lineTo(-4, side * 9);
      ctx.lineTo(-9, side * 12);
      ctx.lineTo(-9, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 4. Sleek storm-grey streamlined chibi trout body
    const breath = 1 + Math.sin(t * 3.0) * 0.02;
    ctx.save();
    ctx.scale(breath, breath);
    const bodyGrad = ctx.createLinearGradient(50, -18, -40, 18);
    bodyGrad.addColorStop(0, '#6B768C');
    bodyGrad.addColorStop(0.42, '#41495C');
    bodyGrad.addColorStop(0.82, '#222633');
    bodyGrad.addColorStop(1, '#140B1C');

    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 3.0;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(50, 0);
    ctx.quadraticCurveTo(44, -16, 18, -19);
    ctx.quadraticCurveTo(-8, -18, -26, -10);
    ctx.lineTo(-40, -5 + bend * 12);
    ctx.lineTo(-40, 5 + bend * 12);
    ctx.lineTo(-26, 10);
    ctx.quadraticCurveTo(-8, 18, 18, 19);
    ctx.quadraticCurveTo(44, 16, 50, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Dark obsidian trout speckles across back
    ctx.fillStyle = '#140B1C';
    for (const [sx0, sy0] of SPECKLES) {
      ctx.beginPath();
      ctx.arc(sx0, sy0 + (sx0 < 0 ? bend * (-sx0 * 0.22) : 0), 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. Crackling neon-magenta villain lightning stripe slashing down both flanks!
    ctx.save();
    ctx.strokeStyle = `rgba(255, 42, 196, ${0.92 * bolt})`;
    ctx.shadowColor = '#FF2AC4';
    ctx.shadowBlur = 7 * bolt;
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const side of [-1, 1]) {
      const jit = Math.sin(t * 28 + side) * 1.1;
      ctx.beginPath();
      ctx.moveTo(28, side * 12);
      ctx.lineTo(14, side * 15 + jit);
      ctx.lineTo(4, side * 11 - jit);
      ctx.lineTo(-8, side * 13 + jit);
      ctx.lineTo(-20, side * 9);
      ctx.lineTo(-34, side * 4 + bend * 10);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    ctx.strokeStyle = `rgba(255, 200, 245, ${0.85 * bolt})`;
    ctx.lineWidth = 1.0;
    ctx.stroke();
    ctx.restore();

    // Scarred gill plate on left/right cheeks
    ctx.strokeStyle = '#FF75A0';
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.moveTo(24, -14);
    ctx.lineTo(18, -6);
    ctx.moveTo(21, -15);
    ctx.lineTo(15, -8);
    ctx.stroke();

    // Glossy storm-silver highlight
    ctx.fillStyle = 'rgba(220, 232, 255, 0.22)';
    ctx.beginPath();
    ctx.ellipse(24, -8, 14, 3.6, -0.18, 0, Math.PI * 2);
    ctx.fill();

    // 6. Sharp-fanged snapping trout mouth
    const chomp = this._state === 'eating'
      ? 0.4 + 0.6 * Math.abs(Math.sin(this._stateTime * 20))
      : this._state === 'hungry'
        ? 0.42 + 0.25 * Math.sin(t * 11)
        : p.mouth;
    ctx.save();
    ctx.translate(48, 0);
    ctx.fillStyle = '#380824';
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.ellipse(-2, 0, 4.4, 4.5 + chomp * 4.0, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.lineWidth = 1.0;
    for (const fy of [-2.4, 0, 2.4]) {
      ctx.beginPath();
      ctx.moveTo(-1, fy - 1.3);
      ctx.lineTo(3.2 + chomp * 1.6, fy);
      ctx.lineTo(-1, fy + 1.3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    // 7. Expressive Neon-Magenta Villain Eyes
    this._drawEyes(ctx, t, bolt);

    ctx.restore();
    this._drawMoodFX(ctx, t);
    ctx.restore();
  }

  _drawEyes(ctx, t, bolt) {
    const st = this._state;
    for (const side of [-1, 1]) {
      const ex = 30;
      const ey = side * 10.2;

      if (st === 'stress') {
        ctx.strokeStyle = '#FF38D4';
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(ex - 3.4, ey - side * 2.5);
        ctx.lineTo(ex + 2.8, ey);
        ctx.lineTo(ex - 3.4, ey + side * 2.5);
        ctx.stroke();
        continue;
      }

      const r = st === 'shock' ? 5.6 : 4.7;
      ctx.fillStyle = st === 'shock' ? '#FFFFFF' : '#180820';
      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.arc(ex, ey, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (st === 'shock') {
        ctx.fillStyle = '#140B1C';
        ctx.beginPath();
        ctx.arc(ex + 1, ey, 1.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const ig = ctx.createRadialGradient(ex + 0.7, ey, 0.5, ex, ey, 3.5);
        ig.addColorStop(0, '#FFD4F8');
        ig.addColorStop(0.55, '#FF2AC4');
        ig.addColorStop(1, '#68085E');
        ctx.fillStyle = ig;
        ctx.beginPath();
        ctx.arc(ex + 0.7, ey, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#140B1C';
        ctx.beginPath();
        ctx.ellipse(ex + 1.1, ey, 1.2, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(ex + 2.0, ey - side * 1.1, 1.15, 0, Math.PI * 2);
        ctx.arc(ex - 0.5, ey + side * 1.1, 0.6, 0, Math.PI * 2);
        ctx.fill();
      }

      if (st === 'relax' || st === 'happy') {
        ctx.fillStyle = '#41495C';
        ctx.beginPath();
        ctx.arc(ex, ey, r + 0.4, -Math.PI * 0.88, Math.PI * 0.12);
        ctx.closePath();
        ctx.fill();
      }

      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (st === 'sad' || st === 'fear') {
        ctx.moveTo(ex - 3.4, ey + side * 3.4);
        ctx.lineTo(ex + 3.8, ey + side * 5.2);
      } else if (st === 'shock') {
        ctx.moveTo(ex - 2.8, ey + side * 6.2);
        ctx.lineTo(ex + 3.6, ey + side * 6.2);
      } else {
        ctx.moveTo(ex + 4.4, ey - side * 1.8);
        ctx.lineTo(ex - 3.6, ey + side * 4.6);
      }
      ctx.stroke();

      if (st === 'hungry') {
        ctx.strokeStyle = `rgba(255, 42, 196, ${0.75 * bolt})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(ex, ey, r + 1.9 + Math.sin(t * 15) * 0.7, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  _drawMoodFX(ctx, t) {
    const st = this._state;
    if (st === 'happy') {
      for (let i = 0; i < 4; i++) {
        const a = t * 2.7 + i * 1.57;
        const x = 12 + Math.cos(a) * 38;
        const y = Math.sin(a) * 22;
        const s = 3.1 + Math.sin(t * 8 + i) * 1.0;
        ctx.fillStyle = i % 2 === 0 ? '#FF2AC4' : '#A442FF';
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
      ctx.translate(42 + b, -19);
      ctx.fillStyle = '#FF2AC4';
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
        const dx = 24 - i * 18;
        const dy = (i === 0 ? -22 : 22) + (i === 0 ? -d * 0.35 : d * 0.35);
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
      ctx.translate(30, -19);
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
      ctx.moveTo(30, 15 + d * 0.4);
      ctx.quadraticCurveTo(33.5, 19 + d * 0.4, 30, 22 + d * 0.4);
      ctx.quadraticCurveTo(26.5, 19 + d * 0.4, 30, 15 + d * 0.4);
      ctx.fill();
      ctx.stroke();
    }
  }
}

export default VillainTroutfish;
