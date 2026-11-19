/**
 * Villain Silver Arowana — 2D Top-Down Expressive Chibi Villain Fish
 * Dark gunmetal-chrome dragon-like ribbon body with glowing crimson eye-slits,
 * sharp upturned jaw, and fiery chin barbels.
 */

const VALID_STATES = new Set([
  'breathing', 'swimming', 'relax', 'left_turn', 'right_turn',
  'eating', 'hungry', 'stress', 'fear', 'shock', 'happy', 'sad'
]);
const ONE_SHOTS = new Set(['left_turn', 'right_turn', 'eating', 'shock']);
const LOCKED = new Set(['shock', 'fear']);
const BLOCKED = new Set(['left_turn', 'right_turn', 'relax', 'happy', 'eating']);
const ALIASES = { idle: 'breathing', hunger: 'hungry' };
const ONE_SHOT_DUR = { left_turn: 0.58, right_turn: 0.58, eating: 0.62, shock: 0.72 };

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
      return { freq: 6.8, amp: 0.28, bend: 0, fire: 1.0, mouth: 0.14, fin: 0.32, shake: 0 };
    case 'relax':
      return { freq: 1.8, amp: 0.08, bend: 0, fire: 0.58, mouth: 0.04, fin: 0.1, shake: 0 };
    case 'left_turn':
      return { freq: 5.8, amp: 0.2, bend: -0.44, fire: 1.1, mouth: 0.16, fin: 0.45, shake: 0 };
    case 'right_turn':
      return { freq: 5.8, amp: 0.2, bend: 0.44, fire: 1.1, mouth: 0.16, fin: 0.45, shake: 0 };
    case 'eating':
      return { freq: 5.2, amp: 0.16, bend: 0, fire: 1.35, mouth: 0.96, fin: 0.55, shake: 0.02 };
    case 'hungry':
      return { freq: 5.0, amp: 0.2, bend: 0, fire: 1.28, mouth: 0.58, fin: 0.44, shake: 0.015 };
    case 'stress':
      return { freq: 9.4, amp: 0.13, bend: 0, fire: 1.45, mouth: 0.3, fin: 0.68, shake: 0.06 };
    case 'fear':
      return { freq: 11.0, amp: 0.16, bend: 0, fire: 0.5, mouth: 0.46, fin: 0.76, shake: 0.085 };
    case 'shock':
      return { freq: 12.6, amp: 0.1, bend: 0, fire: 1.5, mouth: 0.82, fin: 0.9, shake: 0.1 };
    case 'happy':
      return { freq: 3.9, amp: 0.15, bend: 0.06, fire: 1.16, mouth: 0.24, fin: 0.36, shake: 0 };
    case 'sad':
      return { freq: 1.4, amp: 0.05, bend: -0.05, fire: 0.35, mouth: 0.02, fin: -0.18, shake: 0 };
    case 'breathing':
    default:
      return { freq: 2.5, amp: 0.1, bend: 0, fire: 0.85, mouth: 0.08, fin: 0.18, shake: 0 };
  }
}

export class VillainArowanafish {
  static metadata = {
    name: 'Villain Silver Arowana',
    category: 'villain_fish',
    baseLength: 175,
    baseWidth: 46
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
    const bend = p.bend + wag * 0.36;
    const fire = (0.74 + 0.26 * Math.sin(t * 5.8)) * p.fire;
    const sx = p.shake ? Math.sin(t * 60) * p.shake * 20 : 0;
    const sy = p.shake ? Math.cos(t * 64) * p.shake * 20 : 0;

    ctx.save();
    ctx.translate(this.x + sx, this.y + sy);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Dragon chrome-crimson shadow aura
    const aura = ctx.createRadialGradient(-2, 0, 10, -2, 0, 96);
    aura.addColorStop(0, `rgba(18, 10, 26, ${0.52 * Math.min(1.2, p.fire)})`);
    aura.addColorStop(0.55, `rgba(255, 42, 64, ${0.22 * fire})`);
    aura.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.ellipse(-2, 0, 94, 30, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Flowing dragon-flame ribbon tail fin
    ctx.save();
    ctx.translate(-68, bend * 22);
    ctx.rotate(-bend * 0.9 - wag * 1.35);
    const tg = ctx.createLinearGradient(0, 0, -28, 0);
    tg.addColorStop(0, '#59637A');
    tg.addColorStop(0.55, '#262A38');
    tg.addColorStop(1, '#FF2E4C');
    ctx.fillStyle = tg;
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(6, -6);
    ctx.quadraticCurveTo(-12, -16, -26, -12);
    ctx.lineTo(-18, -3);
    ctx.lineTo(-28, 0);
    ctx.lineTo(-18, 3);
    ctx.lineTo(-26, 12);
    ctx.quadraticCurveTo(-12, 16, 6, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 3. Long dragon-wing gunmetal pectoral fins
    for (const side of [-1, 1]) {
      ctx.save();
      const flap = p.fin * 0.3 + Math.sin(this._phase + side) * 0.12;
      ctx.translate(36, side * 16);
      ctx.rotate(side * (0.48 + flap) + bend * 0.22);
      const fg = ctx.createLinearGradient(0, 0, -14, side * 22);
      fg.addColorStop(0, '#8A96B0');
      fg.addColorStop(0.55, '#343A4D');
      fg.addColorStop(1, '#FF2E4C');
      ctx.fillStyle = fg;
      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 2.3;
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.quadraticCurveTo(4, side * 18, -10, side * 24);
      ctx.lineTo(-9, side * 14);
      ctx.lineTo(-16, side * 16);
      ctx.lineTo(-12, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 4. Pair of fiery dragon chin barbels flickering forward from upturned jaw
    for (const side of [-1, 1]) {
      const flick = Math.sin(t * 9.5 + side * 1.4) * 3.2;
      ctx.save();
      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 3.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(76, side * 5);
      ctx.quadraticCurveTo(88, side * 10 + flick, 95, side * 15 + flick);
      ctx.stroke();

      const bg = ctx.createLinearGradient(76, 0, 95, side * 15);
      bg.addColorStop(0, '#FF2E4C');
      bg.addColorStop(1, '#FFCC38');
      ctx.strokeStyle = bg;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Flame ember tip
      ctx.fillStyle = `rgba(255, 210, 72, ${0.9 * fire})`;
      ctx.beginPath();
      ctx.arc(95, side * 15 + flick, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 5. Sleek dark gunmetal-chrome dragon ribbon body
    const breath = 1 + Math.sin(t * 2.9) * 0.02;
    ctx.save();
    ctx.scale(breath, breath);
    const bodyGrad = ctx.createLinearGradient(80, -18, -72, 18);
    bodyGrad.addColorStop(0, '#9DA8C2');
    bodyGrad.addColorStop(0.28, '#535B70');
    bodyGrad.addColorStop(0.65, '#292D3B');
    bodyGrad.addColorStop(1, '#140B1C');

    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 3.0;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(82, 0);
    ctx.quadraticCurveTo(72, -16, 44, -19);
    ctx.quadraticCurveTo(6, -19, -36, -11 + bend * 10);
    ctx.lineTo(-70, -5 + bend * 20);
    ctx.lineTo(-70, 5 + bend * 20);
    ctx.lineTo(-36, 11 + bend * 10);
    ctx.quadraticCurveTo(6, 19, 44, 19);
    ctx.quadraticCurveTo(72, 16, 82, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Large gleaming metallic dragon scales down the ribbon body
    for (let i = 0; i < 8; i++) {
      const sx0 = 38 - i * 13;
      const sy0 = i > 1 ? bend * (i - 1) * 2.5 : 0;
      const rad = Math.max(4.5, 9 - i * 0.55);
      ctx.strokeStyle = 'rgba(215, 228, 255, 0.35)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(sx0, sy0, rad, -Math.PI * 0.48, Math.PI * 0.48);
      ctx.stroke();
    }

    // Fiery crimson dragon-spine streak
    ctx.strokeStyle = `rgba(255, 46, 76, ${0.85 * fire})`;
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(44, 0);
    ctx.quadraticCurveTo(-12, bend * 6, -64, bend * 18);
    ctx.stroke();

    // Chrome specular reflection
    ctx.fillStyle = 'rgba(240, 248, 255, 0.25)';
    ctx.beginPath();
    ctx.ellipse(46, -8, 18, 3.8, -0.14, 0, Math.PI * 2);
    ctx.fill();

    // 6. Sharp upturned dragon jaw with gleaming fangs
    const snap = this._state === 'eating'
      ? 0.4 + 0.6 * Math.abs(Math.sin(this._stateTime * 20))
      : this._state === 'hungry'
        ? 0.45 + 0.25 * Math.sin(t * 11)
        : p.mouth;
    ctx.save();
    ctx.translate(80, 0);
    ctx.fillStyle = '#330616';
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(-4, -7 - snap * 3);
    ctx.lineTo(6 + snap * 3, 0);
    ctx.lineTo(-4, 7 + snap * 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.lineWidth = 1.0;
    for (const fy of [-3.5, 0, 3.5]) {
      ctx.beginPath();
      ctx.moveTo(-2, fy - 1.3);
      ctx.lineTo(3.5 + snap * 1.8, fy);
      ctx.lineTo(-2, fy + 1.3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    // 7. Glowing Crimson Dragon Eye-Slits
    this._drawEyes(ctx, t, fire);

    ctx.restore();
    this._drawMoodFX(ctx, t);
    ctx.restore();
  }

  _drawEyes(ctx, t, fire) {
    const st = this._state;
    for (const side of [-1, 1]) {
      const ex = 58;
      const ey = side * 11.2;

      if (st === 'stress') {
        ctx.strokeStyle = '#FF2E4C';
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(ex - 3.6, ey - side * 2.6);
        ctx.lineTo(ex + 3.0, ey);
        ctx.lineTo(ex - 3.6, ey + side * 2.6);
        ctx.stroke();
        continue;
      }

      const r = st === 'shock' ? 5.8 : 4.8;
      ctx.fillStyle = st === 'shock' ? '#FFFFFF' : '#18050E';
      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.arc(ex, ey, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (st === 'shock') {
        ctx.fillStyle = '#140B1C';
        ctx.beginPath();
        ctx.arc(ex + 1, ey, 1.6, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const ig = ctx.createRadialGradient(ex + 0.8, ey, 0.5, ex, ey, 3.6);
        ig.addColorStop(0, '#FFE48C');
        ig.addColorStop(0.55, '#FF1E42');
        ig.addColorStop(1, '#680216');
        ctx.fillStyle = ig;
        ctx.beginPath();
        ctx.arc(ex + 0.7, ey, 3.6, 0, Math.PI * 2);
        ctx.fill();

        // Sharp dragon vertical slit pupil
        ctx.fillStyle = '#140B1C';
        ctx.beginPath();
        ctx.ellipse(ex + 1.1, ey, 1.0, 2.9, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(ex + 2.1, ey - side * 1.1, 1.15, 0, Math.PI * 2);
        ctx.arc(ex - 0.5, ey + side * 1.1, 0.65, 0, Math.PI * 2);
        ctx.fill();
      }

      if (st === 'relax' || st === 'happy') {
        ctx.fillStyle = '#4B5366';
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
        ctx.moveTo(ex - 3.6, ey + side * 3.5);
        ctx.lineTo(ex + 4.0, ey + side * 5.4);
      } else if (st === 'shock') {
        ctx.moveTo(ex - 3, ey + side * 6.4);
        ctx.lineTo(ex + 3.8, ey + side * 6.4);
      } else {
        ctx.moveTo(ex + 4.6, ey - side * 1.8);
        ctx.lineTo(ex - 3.8, ey + side * 4.8);
      }
      ctx.stroke();

      if (st === 'hungry') {
        ctx.strokeStyle = `rgba(255, 30, 66, ${0.75 * fire})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(ex, ey, r + 2.0 + Math.sin(t * 15) * 0.7, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  _drawMoodFX(ctx, t) {
    const st = this._state;
    if (st === 'happy') {
      for (let i = 0; i < 4; i++) {
        const a = t * 2.6 + i * 1.57;
        const x = 34 + Math.cos(a) * 46;
        const y = Math.sin(a) * 24;
        const s = 3.2 + Math.sin(t * 8 + i) * 1.0;
        ctx.fillStyle = i % 2 === 0 ? '#FF2E4C' : '#A442FF';
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
      ctx.translate(72 + b, -20);
      ctx.fillStyle = '#FF2E4C';
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
        const dx = 48 - i * 22;
        const dy = (i === 0 ? -24 : 24) + (i === 0 ? -d * 0.35 : d * 0.35);
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
      ctx.translate(58, -20);
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
      ctx.moveTo(58, 16 + d * 0.4);
      ctx.quadraticCurveTo(61.5, 20 + d * 0.4, 58, 23 + d * 0.4);
      ctx.quadraticCurveTo(54.5, 20 + d * 0.4, 58, 16 + d * 0.4);
      ctx.fill();
      ctx.stroke();
    }
  }
}

export default VillainArowanafish;
