/**
 * Villain Picasso Triggerfish — 2D Top-Down Expressive Chibi Villain Fish
 * Dark obsidian diamond carapace with sharp neon-crimson, toxic-yellow,
 * and purple angular war-paint & spiked trigger blade.
 */

const VALID_STATES = new Set([
  'breathing', 'swimming', 'relax', 'left_turn', 'right_turn',
  'eating', 'hungry', 'stress', 'fear', 'shock', 'happy', 'sad'
]);
const ONE_SHOTS = new Set(['left_turn', 'right_turn', 'eating', 'shock']);
const LOCKED = new Set(['shock', 'fear']);
const BLOCKED = new Set(['left_turn', 'right_turn', 'relax', 'happy', 'eating']);
const ALIASES = { idle: 'breathing', hunger: 'hungry' };
const ONE_SHOT_TIME = { left_turn: 0.55, right_turn: 0.55, eating: 0.6, shock: 0.7 };

function cubicOut(t) {
  const x = Math.max(0, Math.min(1, t));
  return 1 - (1 - x) * (1 - x) * (1 - x);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function targetPose(state) {
  switch (state) {
    case 'swimming':
      return { freq: 7.4, amp: 0.24, bend: 0, blade: 0.65, mouth: 0.14, glow: 0.95, shake: 0 };
    case 'relax':
      return { freq: 1.9, amp: 0.06, bend: 0, blade: 0.15, mouth: 0.04, glow: 0.58, shake: 0 };
    case 'left_turn':
      return { freq: 6.2, amp: 0.18, bend: -0.4, blade: 0.85, mouth: 0.18, glow: 1.0, shake: 0 };
    case 'right_turn':
      return { freq: 6.2, amp: 0.18, bend: 0.4, blade: 0.85, mouth: 0.18, glow: 1.0, shake: 0 };
    case 'eating':
      return { freq: 5.5, amp: 0.14, bend: 0, blade: 1.0, mouth: 0.94, glow: 1.2, shake: 0.02 };
    case 'hungry':
      return { freq: 5.2, amp: 0.17, bend: 0, blade: 0.9, mouth: 0.52, glow: 1.2, shake: 0.015 };
    case 'stress':
      return { freq: 9.6, amp: 0.11, bend: 0, blade: 1.15, mouth: 0.32, glow: 1.32, shake: 0.06 };
    case 'fear':
      return { freq: 11.2, amp: 0.15, bend: 0, blade: 1.2, mouth: 0.46, glow: 0.5, shake: 0.085 };
    case 'shock':
      return { freq: 12.8, amp: 0.09, bend: 0, blade: 1.3, mouth: 0.8, glow: 1.38, shake: 0.1 };
    case 'happy':
      return { freq: 4.1, amp: 0.13, bend: 0.05, blade: 0.55, mouth: 0.22, glow: 1.08, shake: 0 };
    case 'sad':
      return { freq: 1.5, amp: 0.04, bend: -0.05, blade: 0.05, mouth: 0.02, glow: 0.36, shake: 0 };
    case 'breathing':
    default:
      return { freq: 2.6, amp: 0.08, bend: 0, blade: 0.4, mouth: 0.08, glow: 0.8, shake: 0 };
  }
}

export class VillainTriggerfish {
  static metadata = {
    name: 'Villain Picasso Triggerfish',
    category: 'villain_fish',
    baseLength: 92,
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
    this._from = targetPose('breathing');
    this._to = targetPose('breathing');
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
    this._to = targetPose(next);
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
      const dur = ONE_SHOT_TIME[this._state] || 0.6;
      if (this._stateTime >= dur) {
        const done = this._state;
        const ret = this._prevState || 'breathing';
        this._from = { ...this._pose };
        this._to = targetPose(ret);
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
    const bend = p.bend + wag * 0.32;
    const glow = (0.75 + 0.25 * Math.sin(t * 5.0)) * p.glow;
    const sx = p.shake ? Math.sin(t * 62) * p.shake * 20 : 0;
    const sy = p.shake ? Math.cos(t * 66) * p.shake * 20 : 0;

    ctx.save();
    ctx.translate(this.x + sx, this.y + sy);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Dark prism miasma aura
    const aura = ctx.createRadialGradient(0, 0, 6, 0, 0, 52);
    aura.addColorStop(0, `rgba(20, 9, 30, ${0.5 * Math.min(1.2, p.glow)})`);
    aura.addColorStop(0.58, `rgba(162, 34, 255, ${0.2 * glow})`);
    aura.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.ellipse(-2, 0, 52, 34, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Razor-edged angular tail fin
    ctx.save();
    ctx.translate(-36, bend * 12);
    ctx.rotate(-bend * 0.75 - wag * 1.15);
    const tg = ctx.createLinearGradient(0, 0, -18, 0);
    tg.addColorStop(0, '#241530');
    tg.addColorStop(0.65, '#FF1E56');
    tg.addColorStop(1, '#F2FF3B');
    ctx.fillStyle = tg;
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(4, -5);
    ctx.lineTo(-16, -14);
    ctx.lineTo(-10, -4);
    ctx.lineTo(-15, 0);
    ctx.lineTo(-10, 4);
    ctx.lineTo(-16, 14);
    ctx.lineTo(4, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 3. Sharp fluttering pectoral fins (toxic-yellow edged blades)
    for (const side of [-1, 1]) {
      ctx.save();
      const flap = Math.sin(this._phase * 1.3 + side) * 0.16;
      ctx.translate(4, side * 19);
      ctx.rotate(side * (0.45 + flap) + bend * 0.2);
      ctx.fillStyle = '#251433';
      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(7, 0);
      ctx.lineTo(1, side * 14);
      ctx.lineTo(-5, side * 11); // notch
      ctx.lineTo(-10, side * 15);
      ctx.lineTo(-12, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#F2FF3B';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(1, side * 12);
      ctx.lineTo(-9, side * 13);
      ctx.stroke();
      ctx.restore();
    }

    // 4. Dark obsidian diamond carapace
    const breath = 1 + Math.sin(t * 3.0) * 0.02;
    ctx.save();
    ctx.scale(breath, breath);
    const bodyGrad = ctx.createLinearGradient(44, -22, -38, 22);
    bodyGrad.addColorStop(0, '#362148');
    bodyGrad.addColorStop(0.5, '#1D1229');
    bodyGrad.addColorStop(1, '#12091B');

    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 3.1;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(45, 0);
    ctx.lineTo(24, -18);
    ctx.lineTo(2, -24);
    ctx.lineTo(-20, -16);
    ctx.lineTo(-37, -6 + bend * 10);
    ctx.lineTo(-37, 6 + bend * 10);
    ctx.lineTo(-20, 16);
    ctx.lineTo(2, 24);
    ctx.lineTo(24, 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 5. Angular Picasso villain war-paint stripes (crimson, toxic-yellow, neon-purple)
    // Neon-purple geometric chevron
    ctx.fillStyle = '#8C2BFF';
    ctx.beginPath();
    ctx.moveTo(22, -16);
    ctx.lineTo(6, -21);
    ctx.lineTo(-6, -12);
    ctx.lineTo(10, -8);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(22, 16);
    ctx.lineTo(6, 21);
    ctx.lineTo(-6, 12);
    ctx.lineTo(10, 8);
    ctx.closePath();
    ctx.fill();

    // Sharp neon-crimson slash stripes
    ctx.fillStyle = '#FF1E56';
    ctx.beginPath();
    ctx.moveTo(6, -21);
    ctx.lineTo(-4, -20);
    ctx.lineTo(-20, -7);
    ctx.lineTo(-10, -7);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(6, 21);
    ctx.lineTo(-4, 20);
    ctx.lineTo(-20, 7);
    ctx.lineTo(-10, 7);
    ctx.closePath();
    ctx.fill();

    // Toxic-yellow lightning war-paint accents
    ctx.strokeStyle = '#EAFF2B';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'square';
    ctx.beginPath();
    ctx.moveTo(32, -9);
    ctx.lineTo(20, -4);
    ctx.lineTo(26, 0);
    ctx.lineTo(20, 4);
    ctx.lineTo(32, 9);
    ctx.stroke();

    // Tail peduncle triple villain spikes
    ctx.strokeStyle = '#FF1E56';
    ctx.lineWidth = 1.8;
    for (let i = 0; i < 3; i++) {
      const bx = -24 - i * 4;
      ctx.beginPath();
      ctx.moveTo(bx, -8 + bend * 6);
      ctx.lineTo(bx - 3, -4 + bend * 6);
      ctx.moveTo(bx, 8 + bend * 6);
      ctx.lineTo(bx - 3, 4 + bend * 6);
      ctx.stroke();
    }

    // Glossy facet highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.beginPath();
    ctx.moveTo(35, -4);
    ctx.lineTo(18, -14);
    ctx.lineTo(2, -16);
    ctx.lineTo(12, -8);
    ctx.closePath();
    ctx.fill();

    // 6. Wicked spiked dorsal trigger blade (extends dynamically with p.blade)
    const bladeLen = 13 + p.blade * 10;
    ctx.save();
    ctx.translate(4, bend * 2);
    const bladeGrad = ctx.createLinearGradient(6, 0, -bladeLen, 0);
    bladeGrad.addColorStop(0, '#F2FF3B');
    bladeGrad.addColorStop(0.55, '#FF1E56');
    bladeGrad.addColorStop(1, '#2B0A2B');
    ctx.fillStyle = bladeGrad;
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(2, -4.5);
    ctx.lineTo(-bladeLen, 0);
    ctx.lineTo(2, 4.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Secondary locking trigger spike behind main blade
    ctx.fillStyle = '#9D3BFF';
    ctx.beginPath();
    ctx.moveTo(-bladeLen * 0.55, -2.5);
    ctx.lineTo(-bladeLen - 6, 0);
    ctx.lineTo(-bladeLen * 0.55, 2.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 7. Snappy triggerfish beak-mouth with chisel fangs
    const bite = this._state === 'eating'
      ? 0.45 + 0.55 * Math.abs(Math.sin(this._stateTime * 20))
      : this._state === 'hungry'
        ? 0.4 + 0.25 * Math.sin(t * 11)
        : p.mouth;
    ctx.save();
    ctx.translate(44, 0);
    ctx.fillStyle = '#FF1E56';
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.ellipse(-2, 0, 4.5, 5.8 + bite * 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Sharp chisel teeth
    ctx.fillStyle = '#FFFFFF';
    ctx.lineWidth = 1.1;
    for (const fy of [-3.2, 0, 3.2]) {
      ctx.beginPath();
      ctx.moveTo(-1, fy - 1.5);
      ctx.lineTo(3.2 + bite * 1.8, fy);
      ctx.lineTo(-1, fy + 1.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    // 8. Expressive Villain Chibi Eyes
    this._drawEyes(ctx, t, glow);

    ctx.restore();
    this._drawMoodFX(ctx, t);
    ctx.restore();
  }

  _drawEyes(ctx, t, glow) {
    const st = this._state;
    for (const side of [-1, 1]) {
      const ex = 19;
      const ey = side * 12.2;

      if (st === 'stress') {
        ctx.strokeStyle = '#EAFF2B';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(ex - 3.6, ey - side * 2.8);
        ctx.lineTo(ex + 3.0, ey);
        ctx.lineTo(ex - 3.6, ey + side * 2.8);
        ctx.stroke();
        continue;
      }

      const r = st === 'shock' ? 6.0 : 5.0;
      ctx.fillStyle = st === 'shock' ? '#FFFFFF' : '#180822';
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
        const ig = ctx.createRadialGradient(ex + 0.8, ey, 0.5, ex, ey, 3.7);
        ig.addColorStop(0, '#EAFF2B');
        ig.addColorStop(0.6, '#FF1E56');
        ig.addColorStop(1, '#58002E');
        ctx.fillStyle = ig;
        ctx.beginPath();
        ctx.arc(ex + 0.7, ey, 3.7, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#140B1C';
        ctx.beginPath();
        ctx.ellipse(ex + 1.1, ey, 1.3, 2.7, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(ex + 2.2, ey - side * 1.2, 1.2, 0, Math.PI * 2);
        ctx.arc(ex - 0.5, ey + side * 1.2, 0.65, 0, Math.PI * 2);
        ctx.fill();
      }

      if (st === 'relax' || st === 'happy') {
        ctx.fillStyle = '#2B1540';
        ctx.beginPath();
        ctx.arc(ex, ey, r + 0.4, -Math.PI * 0.88, Math.PI * 0.12);
        ctx.closePath();
        ctx.fill();
      }

      // Sharp V-shaped villain brow
      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (st === 'sad' || st === 'fear') {
        ctx.moveTo(ex - 3.8, ey + side * 3.8);
        ctx.lineTo(ex + 4.2, ey + side * 5.8);
      } else if (st === 'shock') {
        ctx.moveTo(ex - 3, ey + side * 6.6);
        ctx.lineTo(ex + 4, ey + side * 6.6);
      } else {
        ctx.moveTo(ex + 4.8, ey - side * 2.0);
        ctx.lineTo(ex - 4.0, ey + side * 5.2);
      }
      ctx.stroke();

      if (st === 'hungry') {
        ctx.strokeStyle = `rgba(234, 255, 43, ${0.72 * glow})`;
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
        const x = 10 + Math.cos(a) * 34;
        const y = Math.sin(a) * 26;
        const s = 3.2 + Math.sin(t * 8 + i) * 1.0;
        ctx.fillStyle = i % 2 === 0 ? '#FF1E56' : '#A54BFF';
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
      ctx.translate(34 + b, -22);
      ctx.fillStyle = '#EAFF2B';
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
        const dy = (i === 0 ? -27 : 27) + (i === 0 ? -d * 0.35 : d * 0.35);
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
      ctx.translate(22, -22);
      ctx.scale(s, s);
      ctx.strokeStyle = '#FF1E56';
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
      ctx.moveTo(19, 17 + d * 0.4);
      ctx.quadraticCurveTo(22.5, 21 + d * 0.4, 19, 24 + d * 0.4);
      ctx.quadraticCurveTo(15.5, 21 + d * 0.4, 19, 17 + d * 0.4);
      ctx.fill();
      ctx.stroke();
    }
  }
}

export default VillainTriggerfish;
