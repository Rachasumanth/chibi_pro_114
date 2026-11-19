/**
 * Villain Largemouth Bass — 2D Top-Down Expressive Chibi Villain Fish
 * Dark swamp-obsidian brute with jagged toxic-green lateral scar band,
 * massive toothy bucket-mouth, and notched tail.
 */

const VALID_STATES = new Set([
  'breathing', 'swimming', 'relax', 'left_turn', 'right_turn',
  'eating', 'hungry', 'stress', 'fear', 'shock', 'happy', 'sad'
]);
const ONE_SHOTS = new Set(['left_turn', 'right_turn', 'eating', 'shock']);
const LOCKED = new Set(['shock', 'fear']);
const BLOCKED = new Set(['left_turn', 'right_turn', 'relax', 'happy', 'eating']);
const ALIASES = { idle: 'breathing', hunger: 'hungry' };
const ONE_SHOT_DUR = { left_turn: 0.56, right_turn: 0.56, eating: 0.64, shock: 0.72 };

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
      return { freq: 6.8, amp: 0.25, bend: 0, tox: 1.0, jaw: 0.18, fin: 0.3, shake: 0 };
    case 'relax':
      return { freq: 1.8, amp: 0.06, bend: 0, tox: 0.58, jaw: 0.06, fin: 0.08, shake: 0 };
    case 'left_turn':
      return { freq: 5.8, amp: 0.18, bend: -0.38, tox: 1.08, jaw: 0.2, fin: 0.44, shake: 0 };
    case 'right_turn':
      return { freq: 5.8, amp: 0.18, bend: 0.38, tox: 1.08, jaw: 0.2, fin: 0.44, shake: 0 };
    case 'eating':
      return { freq: 5.4, amp: 0.15, bend: 0, tox: 1.32, jaw: 1.0, fin: 0.55, shake: 0.025 };
    case 'hungry':
      return { freq: 5.0, amp: 0.18, bend: 0, tox: 1.25, jaw: 0.65, fin: 0.44, shake: 0.015 };
    case 'stress':
      return { freq: 9.4, amp: 0.11, bend: 0, tox: 1.4, jaw: 0.34, fin: 0.68, shake: 0.06 };
    case 'fear':
      return { freq: 11.0, amp: 0.15, bend: 0, tox: 0.48, jaw: 0.48, fin: 0.78, shake: 0.085 };
    case 'shock':
      return { freq: 12.6, amp: 0.09, bend: 0, tox: 1.48, jaw: 0.85, fin: 0.9, shake: 0.1 };
    case 'happy':
      return { freq: 3.9, amp: 0.13, bend: 0.05, tox: 1.15, jaw: 0.28, fin: 0.35, shake: 0 };
    case 'sad':
      return { freq: 1.4, amp: 0.04, bend: -0.05, tox: 0.35, jaw: 0.02, fin: -0.18, shake: 0 };
    case 'breathing':
    default:
      return { freq: 2.4, amp: 0.08, bend: 0, tox: 0.85, jaw: 0.12, fin: 0.16, shake: 0 };
  }
}

export class VillainBassfish {
  static metadata = {
    name: 'Villain Largemouth Bass',
    category: 'villain_fish',
    baseLength: 115,
    baseWidth: 48
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
    const bend = p.bend + wag * 0.35;
    const tox = (0.74 + 0.26 * Math.sin(t * 4.4)) * p.tox;
    const sx = p.shake ? Math.sin(t * 60) * p.shake * 20 : 0;
    const sy = p.shake ? Math.cos(t * 64) * p.shake * 20 : 0;

    ctx.save();
    ctx.translate(this.x + sx, this.y + sy);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Dark swamp-obsidian toxic miasma
    const aura = ctx.createRadialGradient(-2, 0, 8, -2, 0, 64);
    aura.addColorStop(0, `rgba(14, 16, 20, ${0.55 * Math.min(1.2, p.tox)})`);
    aura.addColorStop(0.55, `rgba(74, 240, 88, ${0.22 * tox})`);
    aura.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.ellipse(-2, 0, 62, 32, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Battle-notched swamp tail fin
    ctx.save();
    ctx.translate(-40, bend * 14);
    ctx.rotate(-bend * 0.82 - wag * 1.2);
    const tg = ctx.createLinearGradient(0, 0, -22, 0);
    tg.addColorStop(0, '#222F28');
    tg.addColorStop(0.65, '#161C1B');
    tg.addColorStop(1, '#3FE856');
    ctx.fillStyle = tg;
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(4, -6);
    ctx.lineTo(-20, -16);
    ctx.lineTo(-14, -7);
    ctx.lineTo(-18, -3); // battle notch
    ctx.lineTo(-12, 0);
    ctx.lineTo(-20, 16);
    ctx.lineTo(4, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 3. Spined swamp pectoral fins
    for (const side of [-1, 1]) {
      ctx.save();
      const flap = p.fin * 0.3 + Math.sin(this._phase + side) * 0.1;
      ctx.translate(12, side * 19);
      ctx.rotate(side * (0.42 + flap) + bend * 0.22);
      ctx.fillStyle = '#202E26';
      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(2, side * 14);
      ctx.lineTo(-4, side * 10);
      ctx.lineTo(-10, side * 13);
      ctx.lineTo(-10, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 4. Muscular dark swamp-obsidian brute body
    const breath = 1 + Math.sin(t * 2.8) * 0.022;
    ctx.save();
    ctx.scale(breath, breath);
    const bodyGrad = ctx.createLinearGradient(50, -22, -42, 22);
    bodyGrad.addColorStop(0, '#364A3D');
    bodyGrad.addColorStop(0.45, '#1F2B26');
    bodyGrad.addColorStop(0.85, '#161A1E');
    bodyGrad.addColorStop(1, '#140B1C');

    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 3.1;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(50, 0);
    ctx.quadraticCurveTo(46, -20, 20, -23);
    ctx.quadraticCurveTo(-6, -22, -26, -12);
    ctx.lineTo(-42, -6 + bend * 12);
    ctx.lineTo(-42, 6 + bend * 12);
    ctx.lineTo(-26, 12);
    ctx.quadraticCurveTo(-6, 22, 20, 23);
    ctx.quadraticCurveTo(46, 20, 50, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 5. Jagged glowing toxic-green lateral scar bands along both flanks
    for (const side of [-1, 1]) {
      ctx.strokeStyle = `rgba(74, 255, 96, ${0.88 * tox})`;
      ctx.lineWidth = 2.6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(22, side * 16);
      ctx.lineTo(12, side * 13);
      ctx.lineTo(4, side * 17);
      ctx.lineTo(-6, side * 12);
      ctx.lineTo(-16, side * 13);
      ctx.lineTo(-28, side * 8 + bend * 8);
      ctx.stroke();

      // Stitch scars crossing the toxic lateral band
      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 1.4;
      for (const sx0 of [14, 0, -14]) {
        ctx.beginPath();
        ctx.moveTo(sx0, side * 11);
        ctx.lineTo(sx0 - 2, side * 17);
        ctx.stroke();
      }
    }

    // Spiky dorsal bass crest
    for (let i = 0; i < 4; i++) {
      const dx = 12 - i * 10;
      const dy = bend * (i * 2.2);
      ctx.fillStyle = '#1E2A24';
      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(dx + 4, dy - 2.6);
      ctx.lineTo(dx - 7, dy);
      ctx.lineTo(dx + 4, dy + 2.6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Glossy swamp-jade highlight
    ctx.fillStyle = 'rgba(180, 255, 200, 0.16)';
    ctx.beginPath();
    ctx.ellipse(22, -10, 14, 4, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // 6. Massive toothy bucket-mouth!
    const gulp = this._state === 'eating'
      ? 0.45 + 0.55 * Math.abs(Math.sin(this._stateTime * 19))
      : this._state === 'hungry'
        ? 0.5 + 0.28 * Math.sin(t * 10)
        : p.jaw;
    ctx.save();
    ctx.translate(48, 0);
    const mw = 8 + gulp * 7;
    const mh = 11 + gulp * 6;
    ctx.fillStyle = '#2B081B';
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-6, -mh);
    ctx.quadraticCurveTo(mw, -mh * 0.72, mw + 1, 0);
    ctx.quadraticCurveTo(mw, mh * 0.72, -6, mh);
    ctx.quadraticCurveTo(-10, 0, -6, -mh);
    ctx.fill();
    ctx.stroke();

    // Wicked bucket-mouth fangs
    ctx.fillStyle = '#F7FFF5';
    ctx.lineWidth = 1.1;
    for (const fy of [-mh * 0.62, -mh * 0.3, 0, mh * 0.3, mh * 0.62]) {
      ctx.beginPath();
      ctx.moveTo(-4, fy - 1.7);
      ctx.lineTo(3.5 + gulp * 2.5, fy);
      ctx.lineTo(-4, fy + 1.7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    // 7. Expressive Toxic-Amber Villain Eyes
    this._drawEyes(ctx, t, tox);

    ctx.restore();
    this._drawMoodFX(ctx, t);
    ctx.restore();
  }

  _drawEyes(ctx, t, tox) {
    const st = this._state;
    for (const side of [-1, 1]) {
      const ex = 29;
      const ey = side * 12.2;

      if (st === 'stress') {
        ctx.strokeStyle = '#52FF68';
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
      ctx.fillStyle = st === 'shock' ? '#FFFFFF' : '#141B16';
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
        ig.addColorStop(0, '#EAFF8C');
        ig.addColorStop(0.55, '#4EFF5C');
        ig.addColorStop(1, '#0F5924');
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
        ctx.fillStyle = '#25362C';
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
        ctx.moveTo(ex - 3.8, ey + side * 3.8);
        ctx.lineTo(ex + 4.2, ey + side * 5.8);
      } else if (st === 'shock') {
        ctx.moveTo(ex - 3.2, ey + side * 6.6);
        ctx.lineTo(ex + 4.0, ey + side * 6.6);
      } else {
        ctx.moveTo(ex + 4.6, ey - side * 2.0);
        ctx.lineTo(ex - 4.0, ey + side * 5.0);
      }
      ctx.stroke();

      if (st === 'hungry') {
        ctx.strokeStyle = `rgba(78, 255, 92, ${0.75 * tox})`;
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
        const x = 14 + Math.cos(a) * 40;
        const y = Math.sin(a) * 25;
        const s = 3.2 + Math.sin(t * 8 + i) * 1.0;
        ctx.fillStyle = i % 2 === 0 ? '#FF2E63' : '#A442FF';
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
      ctx.translate(42 + b, -22);
      ctx.fillStyle = '#4EFF5C';
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
        const dy = (i === 0 ? -26 : 26) + (i === 0 ? -d * 0.35 : d * 0.35);
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
      ctx.translate(29, -22);
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
      ctx.moveTo(29, 17 + d * 0.4);
      ctx.quadraticCurveTo(32.5, 21 + d * 0.4, 29, 24 + d * 0.4);
      ctx.quadraticCurveTo(25.5, 21 + d * 0.4, 29, 17 + d * 0.4);
      ctx.fill();
      ctx.stroke();
    }
  }
}

export default VillainBassfish;
