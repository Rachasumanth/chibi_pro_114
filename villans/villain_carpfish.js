/**
 * Villain Mirror Carp — 2D Top-Down Expressive Chibi Villain Fish
 * Tarnished dark-bronze body with jagged cracked obsidian mirror-armor scales,
 * glowing amber eyes, and dark barbels.
 */

const VALID_STATES = new Set([
  'breathing', 'swimming', 'relax', 'left_turn', 'right_turn',
  'eating', 'hungry', 'stress', 'fear', 'shock', 'happy', 'sad'
]);
const ONE_SHOTS = new Set(['left_turn', 'right_turn', 'eating', 'shock']);
const LOCKED = new Set(['shock', 'fear']);
const BLOCKED = new Set(['left_turn', 'right_turn', 'relax', 'happy', 'eating']);
const ALIASES = { idle: 'breathing', hunger: 'hungry' };
const ONE_SHOT_DUR = { left_turn: 0.58, right_turn: 0.58, eating: 0.64, shock: 0.72 };

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
      return { freq: 6.4, amp: 0.24, bend: 0, glint: 1.0, mouth: 0.14, fin: 0.3, shake: 0 };
    case 'relax':
      return { freq: 1.7, amp: 0.06, bend: 0, glint: 0.58, mouth: 0.04, fin: 0.08, shake: 0 };
    case 'left_turn':
      return { freq: 5.6, amp: 0.18, bend: -0.38, glint: 1.05, mouth: 0.16, fin: 0.44, shake: 0 };
    case 'right_turn':
      return { freq: 5.6, amp: 0.18, bend: 0.38, glint: 1.05, mouth: 0.16, fin: 0.44, shake: 0 };
    case 'eating':
      return { freq: 5.0, amp: 0.14, bend: 0, glint: 1.25, mouth: 0.96, fin: 0.54, shake: 0.02 };
    case 'hungry':
      return { freq: 4.8, amp: 0.17, bend: 0, glint: 1.22, mouth: 0.56, fin: 0.42, shake: 0.015 };
    case 'stress':
      return { freq: 9.2, amp: 0.11, bend: 0, glint: 1.35, mouth: 0.3, fin: 0.68, shake: 0.06 };
    case 'fear':
      return { freq: 11.0, amp: 0.15, bend: 0, glint: 0.48, mouth: 0.46, fin: 0.76, shake: 0.085 };
    case 'shock':
      return { freq: 12.4, amp: 0.09, bend: 0, glint: 1.4, mouth: 0.82, fin: 0.9, shake: 0.1 };
    case 'happy':
      return { freq: 3.8, amp: 0.13, bend: 0.05, glint: 1.15, mouth: 0.24, fin: 0.34, shake: 0 };
    case 'sad':
      return { freq: 1.4, amp: 0.04, bend: -0.05, glint: 0.36, mouth: 0.02, fin: -0.18, shake: 0 };
    case 'breathing':
    default:
      return { freq: 2.3, amp: 0.08, bend: 0, glint: 0.82, mouth: 0.08, fin: 0.16, shake: 0 };
  }
}

const MIRROR_PLATES = [
  { x: 16, y: -15, rx: 9, ry: 5.5, rot: -0.25 },
  { x: 16, y: 15, rx: 9, ry: 5.5, rot: 0.25 },
  { x: 0, y: -18, rx: 10.5, ry: 6, rot: -0.1 },
  { x: 0, y: 18, rx: 10.5, ry: 6, rot: 0.1 },
  { x: -16, y: -13, rx: 8.5, ry: 5, rot: 0.2 },
  { x: -16, y: 13, rx: 8.5, ry: 5, rot: -0.2 },
  { x: -6, y: 0, rx: 11, ry: 5.5, rot: 0 }
];

export class VillainCarpfish {
  static metadata = {
    name: 'Villain Mirror Carp',
    category: 'villain_fish',
    baseLength: 135,
    baseWidth: 58
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
    const glint = (0.72 + 0.28 * Math.sin(t * 4.2)) * p.glint;
    const sx = p.shake ? Math.sin(t * 60) * p.shake * 22 : 0;
    const sy = p.shake ? Math.cos(t * 64) * p.shake * 22 : 0;

    ctx.save();
    ctx.translate(this.x + sx, this.y + sy);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Tarnished bronze-amber dark miasma
    const aura = ctx.createRadialGradient(-2, 0, 10, -2, 0, 74);
    aura.addColorStop(0, `rgba(18, 10, 22, ${0.52 * Math.min(1.2, p.glint)})`);
    aura.addColorStop(0.56, `rgba(218, 138, 28, ${0.2 * glint})`);
    aura.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.ellipse(-2, 0, 72, 38, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Broad battle-notched tarnished-bronze tail fin
    ctx.save();
    ctx.translate(-44, bend * 16);
    ctx.rotate(-bend * 0.8 - wag * 1.2);
    const tg = ctx.createLinearGradient(0, 0, -24, 0);
    tg.addColorStop(0, '#5E4222');
    tg.addColorStop(0.6, '#2C1E1C');
    tg.addColorStop(1, '#C47D22');
    ctx.fillStyle = tg;
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(4, -7);
    ctx.quadraticCurveTo(-10, -18, -24, -19);
    ctx.lineTo(-15, -6);
    ctx.lineTo(-18, -2); // battle notch
    ctx.lineTo(-13, 2);
    ctx.lineTo(-24, 19);
    ctx.quadraticCurveTo(-10, 18, 4, 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 3. Swept dark-bronze pectoral fins
    for (const side of [-1, 1]) {
      ctx.save();
      const flap = p.fin * 0.3 + Math.sin(this._phase + side) * 0.1;
      ctx.translate(16, side * 23);
      ctx.rotate(side * (0.45 + flap) + bend * 0.22);
      const fg = ctx.createLinearGradient(0, 0, -12, side * 18);
      fg.addColorStop(0, '#5A3D1E');
      fg.addColorStop(1, '#22151C');
      ctx.fillStyle = fg;
      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.quadraticCurveTo(6, side * 16, -4, side * 19);
      ctx.lineTo(-7, side * 13);
      ctx.lineTo(-13, side * 15);
      ctx.lineTo(-12, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 4. Dark villainous carp barbels curving from mouth corners
    for (const side of [-1, 1]) {
      const sway = Math.sin(t * 5.4 + side) * 3.2;
      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 2.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(52, side * 10);
      ctx.quadraticCurveTo(62, side * 18 + sway, 54, side * 26 + sway);
      ctx.stroke();

      ctx.strokeStyle = '#9C682B';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    // 5. Plump front-heavy tarnished dark-bronze chibi body
    const breath = 1 + Math.sin(t * 2.8) * 0.022;
    ctx.save();
    ctx.scale(breath, breath);
    const bodyGrad = ctx.createRadialGradient(18, -6, 6, 0, 0, 62);
    bodyGrad.addColorStop(0, '#8A5E2B');
    bodyGrad.addColorStop(0.45, '#54381E');
    bodyGrad.addColorStop(0.82, '#2B1B1B');
    bodyGrad.addColorStop(1, '#140B1C');

    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 3.2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(58, 0);
    ctx.quadraticCurveTo(54, -22, 26, -27);
    ctx.quadraticCurveTo(-2, -29, -26, -16);
    ctx.lineTo(-46, -7 + bend * 14);
    ctx.lineTo(-46, 7 + bend * 14);
    ctx.lineTo(-26, 16);
    ctx.quadraticCurveTo(-2, 29, 26, 27);
    ctx.quadraticCurveTo(54, 22, 58, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 6. Jagged cracked obsidian mirror-armor scales!
    for (let i = 0; i < MIRROR_PLATES.length; i++) {
      const mp = MIRROR_PLATES[i];
      ctx.save();
      ctx.translate(mp.x, mp.y + bend * (mp.x < 0 ? -mp.x * 0.25 : 0));
      ctx.rotate(mp.rot);

      const mg = ctx.createLinearGradient(-mp.rx, -mp.ry, mp.rx, mp.ry);
      mg.addColorStop(0, '#4E4166');
      mg.addColorStop(0.35, '#191124');
      mg.addColorStop(0.55, '#9E8DC2'); // mirror gleam
      mg.addColorStop(1, '#140B1C');
      ctx.fillStyle = mg;
      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(mp.rx, 0);
      ctx.lineTo(mp.rx * 0.2, -mp.ry);
      ctx.lineTo(-mp.rx, -mp.ry * 0.55);
      ctx.lineTo(-mp.rx * 0.75, mp.ry * 0.75);
      ctx.lineTo(mp.rx * 0.3, mp.ry);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Glowing amber crack inside obsidian mirror plate
      ctx.strokeStyle = `rgba(255, 184, 52, ${0.75 * glint})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-mp.rx * 0.5, -mp.ry * 0.2);
      ctx.lineTo(0, mp.ry * 0.15);
      ctx.lineTo(mp.rx * 0.45, -mp.ry * 0.3);
      ctx.stroke();
      ctx.restore();
    }

    // Glossy tarnished-bronze forehead sheen
    ctx.fillStyle = 'rgba(255, 220, 150, 0.22)';
    ctx.beginPath();
    ctx.ellipse(28, -11, 14, 4.5, -0.22, 0, Math.PI * 2);
    ctx.fill();

    // 7. Fanged grumpy carp mouth
    const bite = this._state === 'eating'
      ? 0.4 + 0.6 * Math.abs(Math.sin(this._stateTime * 19))
      : this._state === 'hungry'
        ? 0.42 + 0.25 * Math.sin(t * 10)
        : p.mouth;
    ctx.save();
    ctx.translate(56, 0);
    ctx.fillStyle = '#38091B';
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 2.1;
    ctx.beginPath();
    ctx.ellipse(-2, 0, 4.8, 5.5 + bite * 4.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFF7EB';
    ctx.lineWidth = 1.0;
    for (const fy of [-3.0, 0, 3.0]) {
      ctx.beginPath();
      ctx.moveTo(-1, fy - 1.5);
      ctx.lineTo(3.2 + bite * 1.6, fy);
      ctx.lineTo(-1, fy + 1.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    // 8. Expressive Glowing Amber Villain Eyes
    this._drawEyes(ctx, t, glint);

    ctx.restore();
    this._drawMoodFX(ctx, t);
    ctx.restore();
  }

  _drawEyes(ctx, t, glint) {
    const st = this._state;
    for (const side of [-1, 1]) {
      const ex = 36;
      const ey = side * 14.5;

      if (st === 'stress') {
        ctx.strokeStyle = '#FFB833';
        ctx.lineWidth = 2.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(ex - 3.8, ey - side * 2.8);
        ctx.lineTo(ex + 3.2, ey);
        ctx.lineTo(ex - 3.8, ey + side * 2.8);
        ctx.stroke();
        continue;
      }

      const r = st === 'shock' ? 6.4 : 5.3;
      ctx.fillStyle = st === 'shock' ? '#FFFFFF' : '#1E0D14';
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
        const ig = ctx.createRadialGradient(ex + 0.8, ey, 0.5, ex, ey, 3.9);
        ig.addColorStop(0, '#FFF8B8');
        ig.addColorStop(0.55, '#FFAE22');
        ig.addColorStop(1, '#8C3806');
        ctx.fillStyle = ig;
        ctx.beginPath();
        ctx.arc(ex + 0.7, ey, 3.9, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#140B1C';
        ctx.beginPath();
        ctx.ellipse(ex + 1.1, ey, 1.3, 2.8, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(ex + 2.2, ey - side * 1.2, 1.25, 0, Math.PI * 2);
        ctx.arc(ex - 0.5, ey + side * 1.2, 0.7, 0, Math.PI * 2);
        ctx.fill();
      }

      if (st === 'relax' || st === 'happy') {
        ctx.fillStyle = '#4A311A';
        ctx.beginPath();
        ctx.arc(ex, ey, r + 0.4, -Math.PI * 0.88, Math.PI * 0.12);
        ctx.closePath();
        ctx.fill();
      }

      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 2.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (st === 'sad' || st === 'fear') {
        ctx.moveTo(ex - 4, ey + side * 3.8);
        ctx.lineTo(ex + 4.4, ey + side * 5.8);
      } else if (st === 'shock') {
        ctx.moveTo(ex - 3.2, ey + side * 6.8);
        ctx.lineTo(ex + 4.0, ey + side * 6.8);
      } else {
        ctx.moveTo(ex + 4.8, ey - side * 2.0);
        ctx.lineTo(ex - 4.2, ey + side * 5.2);
      }
      ctx.stroke();

      if (st === 'hungry') {
        ctx.strokeStyle = `rgba(255, 174, 34, ${0.75 * glint})`;
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
        const x = 14 + Math.cos(a) * 44;
        const y = Math.sin(a) * 28;
        const s = 3.3 + Math.sin(t * 8 + i) * 1.0;
        ctx.fillStyle = i % 2 === 0 ? '#FF2E63' : '#A54BFF';
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
      ctx.translate(48 + b, -24);
      ctx.fillStyle = '#FFAE22';
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
        const dx = 30 - i * 20;
        const dy = (i === 0 ? -30 : 30) + (i === 0 ? -d * 0.35 : d * 0.35);
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
      ctx.translate(36, -24);
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
      ctx.moveTo(36, 20 + d * 0.4);
      ctx.quadraticCurveTo(39.5, 24 + d * 0.4, 36, 27 + d * 0.4);
      ctx.quadraticCurveTo(32.5, 24 + d * 0.4, 36, 20 + d * 0.4);
      ctx.fill();
      ctx.stroke();
    }
  }
}

export default VillainCarpfish;
