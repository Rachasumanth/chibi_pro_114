/**
 * Villain Yellow Surgeonfish — 2D Top-Down Expressive Chibi Villain Fish
 * Toxic acid-yellow & charcoal body with oversized gleaming crimson-edged
 * razor scalpel blades at the tail base.
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

function easeCubic(t) {
  const c = Math.max(0, Math.min(1, t));
  return 1 - (1 - c) * (1 - c) * (1 - c);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function poseFor(state) {
  switch (state) {
    case 'swimming':
      return { freq: 7.8, amp: 0.25, bend: 0, bladeOut: 0.72, mouth: 0.14, glow: 0.95, shake: 0 };
    case 'relax':
      return { freq: 2.0, amp: 0.06, bend: 0, bladeOut: 0.28, mouth: 0.04, glow: 0.58, shake: 0 };
    case 'left_turn':
      return { freq: 6.4, amp: 0.19, bend: -0.4, bladeOut: 0.95, mouth: 0.16, glow: 1.05, shake: 0 };
    case 'right_turn':
      return { freq: 6.4, amp: 0.19, bend: 0.4, bladeOut: 0.95, mouth: 0.16, glow: 1.05, shake: 0 };
    case 'eating':
      return { freq: 5.6, amp: 0.14, bend: 0, bladeOut: 1.05, mouth: 0.92, glow: 1.22, shake: 0.02 };
    case 'hungry':
      return { freq: 5.4, amp: 0.18, bend: 0, bladeOut: 0.98, mouth: 0.54, glow: 1.2, shake: 0.015 };
    case 'stress':
      return { freq: 9.8, amp: 0.12, bend: 0, bladeOut: 1.2, mouth: 0.3, glow: 1.32, shake: 0.06 };
    case 'fear':
      return { freq: 11.4, amp: 0.15, bend: 0, bladeOut: 1.25, mouth: 0.46, glow: 0.48, shake: 0.085 };
    case 'shock':
      return { freq: 13.0, amp: 0.09, bend: 0, bladeOut: 1.35, mouth: 0.8, glow: 1.4, shake: 0.1 };
    case 'happy':
      return { freq: 4.2, amp: 0.13, bend: 0.05, bladeOut: 0.65, mouth: 0.24, glow: 1.1, shake: 0 };
    case 'sad':
      return { freq: 1.5, amp: 0.04, bend: -0.05, bladeOut: 0.15, mouth: 0.02, glow: 0.38, shake: 0 };
    case 'breathing':
    default:
      return { freq: 2.7, amp: 0.08, bend: 0, bladeOut: 0.5, mouth: 0.08, glow: 0.82, shake: 0 };
  }
}

export class VillainSurgeonfish {
  static metadata = {
    name: 'Villain Yellow Surgeonfish',
    category: 'villain_fish',
    baseLength: 88,
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
      const t = easeCubic(this._blendElapsed / this._blendDur);
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
    const bend = p.bend + wag * 0.34;
    const glow = (0.75 + 0.25 * Math.sin(t * 5.2)) * p.glow;
    const sx = p.shake ? Math.sin(t * 62) * p.shake * 20 : 0;
    const sy = p.shake ? Math.cos(t * 66) * p.shake * 20 : 0;

    ctx.save();
    ctx.translate(this.x + sx, this.y + sy);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Toxic acid-yellow & dark shadow miasma
    const aura = ctx.createRadialGradient(-2, 0, 6, -2, 0, 50);
    aura.addColorStop(0, `rgba(18, 10, 26, ${0.5 * Math.min(1.2, p.glow)})`);
    aura.addColorStop(0.55, `rgba(218, 255, 24, ${0.2 * glow})`);
    aura.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.ellipse(-2, 0, 48, 30, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Sharp notched charcoal-and-acid tail fin
    ctx.save();
    ctx.translate(-34, bend * 12);
    ctx.rotate(-bend * 0.78 - wag * 1.18);
    const tg = ctx.createLinearGradient(0, 0, -18, 0);
    tg.addColorStop(0, '#27232E');
    tg.addColorStop(0.65, '#C8E61E');
    tg.addColorStop(1, '#1A1522');
    ctx.fillStyle = tg;
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(4, -5);
    ctx.lineTo(-17, -14);
    ctx.lineTo(-11, -3);
    ctx.lineTo(-14, 0);
    ctx.lineTo(-11, 3);
    ctx.lineTo(-17, 14);
    ctx.lineTo(4, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 3. Oversized gleaming crimson-edged razor scalpel blades at tail base!
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(-26, side * 9 + bend * 9);
      const bladeAngle = side * (0.28 + p.bladeOut * 0.42);
      ctx.rotate(bladeAngle);
      const bladeLen = 15 + p.bladeOut * 7;

      // Gleaming steel blade
      const bg = ctx.createLinearGradient(0, 0, bladeLen, side * 5);
      bg.addColorStop(0, '#E8EEF5');
      bg.addColorStop(0.55, '#96A0B0');
      bg.addColorStop(1, '#FF1E42');
      ctx.fillStyle = bg;
      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-2, -side * 2);
      ctx.lineTo(bladeLen, side * 2);
      ctx.quadraticCurveTo(bladeLen * 0.6, side * 8, -2, side * 4.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Razor crimson cutting edge + glint
      ctx.strokeStyle = '#FF1E42';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(2, side * 4.2);
      ctx.quadraticCurveTo(bladeLen * 0.65, side * 6.5, bladeLen - 1, side * 2);
      ctx.stroke();

      // Glint star at scalpel tip
      const glint = 0.5 + 0.5 * Math.sin(t * 7 + side);
      ctx.fillStyle = `rgba(255, 255, 255, ${0.85 * glint})`;
      ctx.beginPath();
      ctx.arc(bladeLen - 2, side * 2.2, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 4. Swept acid-yellow & charcoal pectoral fins
    for (const side of [-1, 1]) {
      ctx.save();
      const flap = Math.sin(this._phase * 1.2 + side) * 0.15;
      ctx.translate(6, side * 17);
      ctx.rotate(side * (0.42 + flap) + bend * 0.2);
      ctx.fillStyle = '#C9EB1E';
      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(7, 0);
      ctx.lineTo(1, side * 13);
      ctx.lineTo(-5, side * 10);
      ctx.lineTo(-10, side * 14);
      ctx.lineTo(-10, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 5. Sleek chibi teardrop body (toxic acid-yellow & dark charcoal)
    const breath = 1 + Math.sin(t * 3.1) * 0.022;
    ctx.save();
    ctx.scale(breath, breath);
    const bodyGrad = ctx.createLinearGradient(42, -20, -34, 20);
    bodyGrad.addColorStop(0, '#E8FF26');
    bodyGrad.addColorStop(0.45, '#B2D914');
    bodyGrad.addColorStop(0.75, '#332C3D');
    bodyGrad.addColorStop(1, '#1A1324');

    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 3.0;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(43, 0);
    ctx.quadraticCurveTo(36, -16, 14, -21);
    ctx.quadraticCurveTo(-8, -22, -24, -12);
    ctx.lineTo(-35, -5 + bend * 10);
    ctx.lineTo(-35, 5 + bend * 10);
    ctx.lineTo(-24, 12);
    ctx.quadraticCurveTo(-8, 22, 14, 21);
    ctx.quadraticCurveTo(36, 16, 43, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Charcoal hazard-stripe villain chevron bands
    ctx.fillStyle = '#21192B';
    ctx.beginPath();
    ctx.moveTo(8, -20);
    ctx.lineTo(-2, -19);
    ctx.lineTo(-10, -8);
    ctx.lineTo(0, -8);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(8, 20);
    ctx.lineTo(-2, 19);
    ctx.lineTo(-10, 8);
    ctx.lineTo(0, 8);
    ctx.closePath();
    ctx.fill();

    // Glowing toxic spine ridge & crimson caution stripe
    ctx.strokeStyle = '#FF1E42';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(-28, bend * 9);
    ctx.stroke();

    // Glossy acid highlight
    ctx.fillStyle = 'rgba(255, 255, 210, 0.32)';
    ctx.beginPath();
    ctx.ellipse(20, -9, 12, 4, -0.25, 0, Math.PI * 2);
    ctx.fill();

    // 6. Sharp-toothed surgeonfish snout mouth
    const bite = this._state === 'eating'
      ? 0.4 + 0.6 * Math.abs(Math.sin(this._stateTime * 20))
      : this._state === 'hungry'
        ? 0.4 + 0.25 * Math.sin(t * 11)
        : p.mouth;
    ctx.save();
    ctx.translate(42, 0);
    ctx.fillStyle = '#33081C';
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.ellipse(-2, 0, 4.2, 4.5 + bite * 3.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.lineWidth = 1.0;
    for (const fy of [-2.4, 0, 2.4]) {
      ctx.beginPath();
      ctx.moveTo(-1, fy - 1.3);
      ctx.lineTo(3.0 + bite * 1.5, fy);
      ctx.lineTo(-1, fy + 1.3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    // 7. Expressive Villain Chibi Eyes
    this._drawEyes(ctx, t, glow);

    ctx.restore();
    this._drawMoodFX(ctx, t);
    ctx.restore();
  }

  _drawEyes(ctx, t, glow) {
    const st = this._state;
    for (const side of [-1, 1]) {
      const ex = 21;
      const ey = side * 10.8;

      if (st === 'stress') {
        ctx.strokeStyle = '#FF1E42';
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(ex - 3.5, ey - side * 2.6);
        ctx.lineTo(ex + 3.0, ey);
        ctx.lineTo(ex - 3.5, ey + side * 2.6);
        ctx.stroke();
        continue;
      }

      const r = st === 'shock' ? 5.8 : 4.8;
      ctx.fillStyle = st === 'shock' ? '#FFFFFF' : '#180B22';
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
        ig.addColorStop(0, '#FFF58C');
        ig.addColorStop(0.55, '#FF1E42');
        ig.addColorStop(1, '#5E051E');
        ctx.fillStyle = ig;
        ctx.beginPath();
        ctx.arc(ex + 0.7, ey, 3.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#140B1C';
        ctx.beginPath();
        ctx.ellipse(ex + 1.1, ey, 1.2, 2.6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(ex + 2.1, ey - side * 1.2, 1.15, 0, Math.PI * 2);
        ctx.arc(ex - 0.5, ey + side * 1.2, 0.65, 0, Math.PI * 2);
        ctx.fill();
      }

      if (st === 'relax' || st === 'happy') {
        ctx.fillStyle = '#332C3D';
        ctx.beginPath();
        ctx.arc(ex, ey, r + 0.4, -Math.PI * 0.88, Math.PI * 0.12);
        ctx.closePath();
        ctx.fill();
      }

      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (st === 'sad' || st === 'fear') {
        ctx.moveTo(ex - 3.6, ey + side * 3.6);
        ctx.lineTo(ex + 4.0, ey + side * 5.6);
      } else if (st === 'shock') {
        ctx.moveTo(ex - 3, ey + side * 6.4);
        ctx.lineTo(ex + 3.8, ey + side * 6.4);
      } else {
        ctx.moveTo(ex + 4.6, ey - side * 2.0);
        ctx.lineTo(ex - 3.8, ey + side * 4.8);
      }
      ctx.stroke();

      if (st === 'hungry') {
        ctx.strokeStyle = `rgba(255, 30, 66, ${0.72 * glow})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(ex, ey, r + 2 + Math.sin(t * 15) * 0.7, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  _drawMoodFX(ctx, t) {
    const st = this._state;
    if (st === 'happy') {
      for (let i = 0; i < 4; i++) {
        const a = t * 2.7 + i * 1.57;
        const x = 10 + Math.cos(a) * 32;
        const y = Math.sin(a) * 24;
        const s = 3.1 + Math.sin(t * 8 + i) * 1.0;
        ctx.fillStyle = i % 2 === 0 ? '#FF1E42' : '#A54BFF';
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
      ctx.translate(34 + b, -20);
      ctx.fillStyle = '#FF1E42';
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
        const d = (t * 25 + i * 11) % 14;
        const dx = 16 - i * 16;
        const dy = (i === 0 ? -24 : 24) + (i === 0 ? -d * 0.35 : d * 0.35);
        ctx.fillStyle = '#7CE8FF';
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
      ctx.translate(22, -20);
      ctx.scale(s, s);
      ctx.strokeStyle = '#FF1E42';
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
      ctx.moveTo(21, 15 + d * 0.4);
      ctx.quadraticCurveTo(24.5, 19 + d * 0.4, 21, 22 + d * 0.4);
      ctx.quadraticCurveTo(17.5, 19 + d * 0.4, 21, 15 + d * 0.4);
      ctx.fill();
      ctx.stroke();
    }
  }
}

export default VillainSurgeonfish;
