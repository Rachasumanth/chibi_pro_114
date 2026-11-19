/**
 * Villain Spawning Sockeye Salmon — 2D Top-Down Expressive Chibi Villain Fish
 * Blood-crimson battle-scarred body, dark toxic-emerald armored head,
 * and wickedly exaggerated hooked fang kype jaw.
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
      return { freq: 7.2, amp: 0.26, bend: 0, rage: 1.0, kype: 0.22, fin: 0.34, shake: 0 };
    case 'relax':
      return { freq: 1.8, amp: 0.06, bend: 0, rage: 0.58, kype: 0.06, fin: 0.08, shake: 0 };
    case 'left_turn':
      return { freq: 6.0, amp: 0.19, bend: -0.4, rage: 1.08, kype: 0.24, fin: 0.46, shake: 0 };
    case 'right_turn':
      return { freq: 6.0, amp: 0.19, bend: 0.4, rage: 1.08, kype: 0.24, fin: 0.46, shake: 0 };
    case 'eating':
      return { freq: 5.4, amp: 0.15, bend: 0, rage: 1.35, kype: 1.0, fin: 0.58, shake: 0.025 };
    case 'hungry':
      return { freq: 5.2, amp: 0.18, bend: 0, rage: 1.28, kype: 0.65, fin: 0.46, shake: 0.015 };
    case 'stress':
      return { freq: 9.6, amp: 0.12, bend: 0, rage: 1.44, kype: 0.36, fin: 0.7, shake: 0.06 };
    case 'fear':
      return { freq: 11.2, amp: 0.15, bend: 0, rage: 0.5, kype: 0.5, fin: 0.78, shake: 0.085 };
    case 'shock':
      return { freq: 12.8, amp: 0.09, bend: 0, rage: 1.5, kype: 0.86, fin: 0.92, shake: 0.1 };
    case 'happy':
      return { freq: 4.1, amp: 0.14, bend: 0.05, rage: 1.15, kype: 0.3, fin: 0.36, shake: 0 };
    case 'sad':
      return { freq: 1.4, amp: 0.04, bend: -0.05, rage: 0.35, kype: 0.04, fin: -0.18, shake: 0 };
    case 'breathing':
    default:
      return { freq: 2.5, amp: 0.08, bend: 0, rage: 0.86, kype: 0.14, fin: 0.16, shake: 0 };
  }
}

export class VillainSalmonfish {
  static metadata = {
    name: 'Villain Spawning Sockeye Salmon',
    category: 'villain_fish',
    baseLength: 135,
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
    const rage = (0.74 + 0.26 * Math.sin(t * 5.2)) * p.rage;
    const sx = p.shake ? Math.sin(t * 62) * p.shake * 20 : 0;
    const sy = p.shake ? Math.cos(t * 66) * p.shake * 20 : 0;

    ctx.save();
    ctx.translate(this.x + sx, this.y + sy);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Blood-crimson & toxic-emerald spawning rage miasma
    const aura = ctx.createRadialGradient(-2, 0, 8, -2, 0, 74);
    aura.addColorStop(0, `rgba(18, 6, 18, ${0.54 * Math.min(1.2, p.rage)})`);
    aura.addColorStop(0.55, `rgba(218, 18, 42, ${0.24 * rage})`);
    aura.addColorStop(0.8, `rgba(28, 198, 114, ${0.15 * rage})`);
    aura.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.ellipse(-2, 0, 72, 32, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Jagged forked toxic-emerald & crimson tail fin
    ctx.save();
    ctx.translate(-48, bend * 16);
    ctx.rotate(-bend * 0.85 - wag * 1.25);
    const tg = ctx.createLinearGradient(0, 0, -24, 0);
    tg.addColorStop(0, '#9E1224');
    tg.addColorStop(0.55, '#193D30');
    tg.addColorStop(1, '#26E088');
    ctx.fillStyle = tg;
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(4, -6);
    ctx.lineTo(-22, -17);
    ctx.lineTo(-14, -6);
    ctx.lineTo(-17, -2); // battle notch
    ctx.lineTo(-12, 1);
    ctx.lineTo(-22, 17);
    ctx.lineTo(4, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 3. Dark toxic-emerald pectoral fins
    for (const side of [-1, 1]) {
      ctx.save();
      const flap = p.fin * 0.32 + Math.sin(this._phase + side) * 0.12;
      ctx.translate(18, side * 19);
      ctx.rotate(side * (0.44 + flap) + bend * 0.22);
      ctx.fillStyle = '#163D2F';
      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(2, side * 15);
      ctx.lineTo(-4, side * 10);
      ctx.lineTo(-10, side * 13);
      ctx.lineTo(-10, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 4. Blood-crimson battle-scarred spawning salmon body
    const breath = 1 + Math.sin(t * 2.9) * 0.022;
    ctx.save();
    ctx.scale(breath, breath);
    const bodyGrad = ctx.createLinearGradient(56, -20, -50, 20);
    bodyGrad.addColorStop(0, '#D91C36');
    bodyGrad.addColorStop(0.45, '#9E1026');
    bodyGrad.addColorStop(0.85, '#4A0B1C');
    bodyGrad.addColorStop(1, '#140B1C');

    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 3.1;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(56, 0);
    ctx.quadraticCurveTo(48, -19, 18, -22);
    ctx.quadraticCurveTo(-12, -21, -32, -11);
    ctx.lineTo(-50, -5 + bend * 14);
    ctx.lineTo(-50, 5 + bend * 14);
    ctx.lineTo(-32, 11);
    ctx.quadraticCurveTo(-12, 21, 18, 22);
    ctx.quadraticCurveTo(48, 19, 56, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Jagged battle scars slashed across the crimson flanks
    ctx.strokeStyle = '#FFC2B8';
    ctx.lineWidth = 1.9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(6, -15);
    ctx.lineTo(-8, -4);
    ctx.moveTo(0, -16);
    ctx.lineTo(-12, -7);
    ctx.moveTo(-14, 13);
    ctx.lineTo(-26, 4);
    ctx.stroke();

    // Spawning humped dorsal ridge
    ctx.fillStyle = '#6E0A1D';
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(0, -4.5);
    ctx.lineTo(-22, bend * 5);
    ctx.lineTo(0, 4.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 5. Dark toxic-emerald armored spawning head plate!
    const headGrad = ctx.createLinearGradient(60, -16, 16, 16);
    headGrad.addColorStop(0, '#206B4E');
    headGrad.addColorStop(0.55, '#133B2E');
    headGrad.addColorStop(1, '#140B1C');
    ctx.fillStyle = headGrad;
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(58, 0);
    ctx.quadraticCurveTo(52, -18, 24, -20);
    ctx.quadraticCurveTo(18, 0, 24, 20);
    ctx.quadraticCurveTo(52, 18, 58, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Toxic emerald armor veins on head
    ctx.strokeStyle = `rgba(52, 255, 162, ${0.72 * rage})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(46, -8);
    ctx.lineTo(30, -12);
    ctx.moveTo(46, 8);
    ctx.lineTo(30, 12);
    ctx.stroke();

    // Glossy armor sheen
    ctx.fillStyle = 'rgba(180, 255, 224, 0.18)';
    ctx.beginPath();
    ctx.ellipse(38, -8, 12, 3.8, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // 6. Wickedly exaggerated hooked fang kype jaw!
    const snap = this._state === 'eating'
      ? 0.4 + 0.6 * Math.abs(Math.sin(this._stateTime * 20))
      : this._state === 'hungry'
        ? 0.5 + 0.28 * Math.sin(t * 11)
        : p.kype;

    ctx.save();
    ctx.translate(56, 0);
    const kLen = 14 + snap * 5;
    const kSpread = 6.5 + snap * 5.5;

    // Open crimson mouth interior
    ctx.fillStyle = '#330514';
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-4, -kSpread);
    ctx.quadraticCurveTo(kLen * 0.75, -kSpread * 0.65, kLen, 0);
    ctx.quadraticCurveTo(kLen * 0.75, kSpread * 0.65, -4, kSpread);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Armored hooked kype pincers curving inward at snout tip
    ctx.fillStyle = '#1A4F3C';
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 2.0;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(-3, side * (kSpread + 1));
      ctx.quadraticCurveTo(kLen * 0.85, side * (kSpread * 0.8), kLen + 2, side * 2.5);
      ctx.lineTo(kLen - 3, side * 1.0);
      ctx.quadraticCurveTo(kLen * 0.5, side * (kSpread * 0.45), -3, side * (kSpread - 3.5));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Wicked protruding hooked kype fangs
    ctx.fillStyle = '#FFF8EE';
    ctx.lineWidth = 1.1;
    for (const fy of [-kSpread * 0.55, -kSpread * 0.22, kSpread * 0.22, kSpread * 0.55]) {
      ctx.beginPath();
      ctx.moveTo(-1, fy - 1.7);
      ctx.lineTo(5.5 + snap * 2.4, fy * 0.75);
      ctx.lineTo(-1, fy + 1.7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    // 7. Expressive Glowing Amber-Crimson Villain Eyes
    this._drawEyes(ctx, t, rage);

    ctx.restore();
    this._drawMoodFX(ctx, t);
    ctx.restore();
  }

  _drawEyes(ctx, t, rage) {
    const st = this._state;
    for (const side of [-1, 1]) {
      const ex = 38;
      const ey = side * 11.4;

      if (st === 'stress') {
        ctx.strokeStyle = '#FF3848';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(ex - 3.5, ey - side * 2.6);
        ctx.lineTo(ex + 3.0, ey);
        ctx.lineTo(ex - 3.5, ey + side * 2.6);
        ctx.stroke();
        continue;
      }

      const r = st === 'shock' ? 5.8 : 4.9;
      ctx.fillStyle = st === 'shock' ? '#FFFFFF' : '#180A14';
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
        ig.addColorStop(0, '#FFF599');
        ig.addColorStop(0.55, '#FF3248');
        ig.addColorStop(1, '#680518');
        ctx.fillStyle = ig;
        ctx.beginPath();
        ctx.arc(ex + 0.7, ey, 3.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#140B1C';
        ctx.beginPath();
        ctx.ellipse(ex + 1.1, ey, 1.2, 2.7, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(ex + 2.1, ey - side * 1.1, 1.2, 0, Math.PI * 2);
        ctx.arc(ex - 0.5, ey + side * 1.1, 0.65, 0, Math.PI * 2);
        ctx.fill();
      }

      if (st === 'relax' || st === 'happy') {
        ctx.fillStyle = '#194A38';
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
        ctx.moveTo(ex - 3.0, ey + side * 6.4);
        ctx.lineTo(ex + 3.8, ey + side * 6.4);
      } else {
        ctx.moveTo(ex + 4.6, ey - side * 1.9);
        ctx.lineTo(ex - 3.8, ey + side * 4.8);
      }
      ctx.stroke();

      if (st === 'hungry') {
        ctx.strokeStyle = `rgba(255, 50, 72, ${0.76 * rage})`;
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
        const x = 16 + Math.cos(a) * 44;
        const y = Math.sin(a) * 24;
        const s = 3.2 + Math.sin(t * 8 + i) * 1.0;
        ctx.fillStyle = i % 2 === 0 ? '#FF2E48' : '#A442FF';
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
      ctx.translate(52 + b, -22);
      ctx.fillStyle = '#FF2E48';
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
        const dx = 32 - i * 20;
        const dy = (i === 0 ? -25 : 25) + (i === 0 ? -d * 0.35 : d * 0.35);
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
      ctx.translate(38, -21);
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
      ctx.moveTo(38, 16 + d * 0.4);
      ctx.quadraticCurveTo(41.5, 20 + d * 0.4, 38, 23 + d * 0.4);
      ctx.quadraticCurveTo(34.5, 20 + d * 0.4, 38, 16 + d * 0.4);
      ctx.fill();
      ctx.stroke();
    }
  }
}

export default VillainSalmonfish;
