/**
 * Villain Starry Blowfish — 2D Top-Down Expressive Chibi Villain Fish
 * Pitch-black cosmic void balloon body speckled with glowing crimson star-marks;
 * inflates extra round with protruding void spikes in shock/fear.
 */

const VALID_STATES = new Set([
  'breathing', 'swimming', 'relax', 'left_turn', 'right_turn',
  'eating', 'hungry', 'stress', 'fear', 'shock', 'happy', 'sad'
]);
const ONE_SHOTS = new Set(['left_turn', 'right_turn', 'eating', 'shock']);
const LOCKED = new Set(['shock', 'fear']);
const BLOCKED = new Set(['left_turn', 'right_turn', 'relax', 'happy', 'eating']);
const ALIASES = { idle: 'breathing', hunger: 'hungry' };
const ONE_SHOT_DUR = { left_turn: 0.56, right_turn: 0.56, eating: 0.62, shock: 0.74 };

function cubicEaseOut(t) {
  const c = Math.max(0, Math.min(1, t));
  return 1 - (1 - c) * (1 - c) * (1 - c);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function poseFor(state) {
  switch (state) {
    case 'swimming':
      return { freq: 7.2, amp: 0.24, bend: 0, inflate: 1.02, spike: 0.35, mouth: 0.12, starGlow: 0.95, shake: 0 };
    case 'relax':
      return { freq: 1.8, amp: 0.06, bend: 0, inflate: 1.05, spike: 0.15, mouth: 0.04, starGlow: 0.6, shake: 0 };
    case 'left_turn':
      return { freq: 6.0, amp: 0.18, bend: -0.36, inflate: 1.04, spike: 0.45, mouth: 0.14, starGlow: 1.0, shake: 0 };
    case 'right_turn':
      return { freq: 6.0, amp: 0.18, bend: 0.36, inflate: 1.04, spike: 0.45, mouth: 0.14, starGlow: 1.0, shake: 0 };
    case 'eating':
      return { freq: 5.2, amp: 0.14, bend: 0, inflate: 1.12, spike: 0.6, mouth: 0.96, starGlow: 1.22, shake: 0.02 };
    case 'hungry':
      return { freq: 5.0, amp: 0.16, bend: 0, inflate: 1.08, spike: 0.55, mouth: 0.56, starGlow: 1.2, shake: 0.015 };
    case 'stress':
      return { freq: 9.2, amp: 0.1, bend: 0, inflate: 1.22, spike: 0.85, mouth: 0.3, starGlow: 1.3, shake: 0.06 };
    case 'fear':
      return { freq: 11.2, amp: 0.14, bend: 0, inflate: 1.38, spike: 1.25, mouth: 0.48, starGlow: 0.72, shake: 0.09 };
    case 'shock':
      return { freq: 12.8, amp: 0.08, bend: 0, inflate: 1.46, spike: 1.4, mouth: 0.84, starGlow: 1.45, shake: 0.11 };
    case 'happy':
      return { freq: 4.0, amp: 0.12, bend: 0.05, inflate: 1.1, spike: 0.4, mouth: 0.24, starGlow: 1.12, shake: 0 };
    case 'sad':
      return { freq: 1.4, amp: 0.04, bend: -0.05, inflate: 0.94, spike: 0.1, mouth: 0.02, starGlow: 0.38, shake: 0 };
    case 'breathing':
    default:
      return { freq: 2.5, amp: 0.08, bend: 0, inflate: 1.0, spike: 0.28, mouth: 0.08, starGlow: 0.82, shake: 0 };
  }
}

const STAR_MARKS = [
  { x: 6, y: -14, r: 3.1, p: 0.2 },
  { x: -8, y: -18, r: 2.4, p: 1.3 },
  { x: -16, y: -7, r: 2.9, p: 2.1 },
  { x: -4, y: 2, r: 3.4, p: 0.7 },
  { x: 10, y: 15, r: 2.8, p: 3.0 },
  { x: -10, y: 17, r: 2.5, p: 4.1 },
  { x: -20, y: 8, r: 2.2, p: 1.9 },
  { x: 16, y: -4, r: 2.1, p: 5.0 },
  { x: -2, y: -8, r: 2.0, p: 2.8 }
];

export class VillainBlowfish {
  static metadata = {
    name: 'Villain Starry Blowfish',
    category: 'villain_fish',
    baseLength: 82,
    baseWidth: 62
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
      const t = cubicEaseOut(this._blendElapsed / this._blendDur);
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
    const bend = p.bend + wag * 0.3;
    const breath = 1 + Math.sin(t * 3.1) * 0.03;
    const inf = p.inflate * breath;
    const rx = 34 * (1 + (inf - 1) * 0.72);
    const ry = 28 * inf;
    const glow = (0.72 + 0.28 * Math.sin(t * 4.8)) * p.starGlow;
    const sx = p.shake ? Math.sin(t * 62) * p.shake * 22 : 0;
    const sy = p.shake ? Math.cos(t * 68) * p.shake * 22 : 0;

    ctx.save();
    ctx.translate(this.x + sx, this.y + sy);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Cosmic void dark miasma aura
    const aura = ctx.createRadialGradient(-2, 0, 8, -2, 0, 52 * inf);
    aura.addColorStop(0, `rgba(12, 4, 22, ${0.58 * Math.min(1.2, p.starGlow)})`);
    aura.addColorStop(0.58, `rgba(218, 22, 68, ${0.22 * glow})`);
    aura.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.ellipse(-2, 0, 48 * inf, 42 * inf, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Stubby cosmic notched tail fin
    ctx.save();
    ctx.translate(-rx + 2, bend * 10);
    ctx.rotate(-bend * 0.75 - wag * 1.3);
    const tg = ctx.createLinearGradient(0, 0, -16, 0);
    tg.addColorStop(0, '#1B1126');
    tg.addColorStop(1, '#8C1036');
    ctx.fillStyle = tg;
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(3, -5);
    ctx.lineTo(-14, -12);
    ctx.lineTo(-9, -3);
    ctx.lineTo(-15, 2);
    ctx.lineTo(-11, 11);
    ctx.lineTo(3, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 3. Fluttering chibi stubby pectoral fins
    for (const side of [-1, 1]) {
      ctx.save();
      const flap = Math.sin(this._phase * 1.5 + side) * 0.24;
      ctx.translate(4, side * (ry - 3));
      ctx.rotate(side * (0.4 + flap) + bend * 0.2);
      ctx.fillStyle = '#251336';
      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.quadraticCurveTo(3, side * 12, -5, side * 11);
      ctx.lineTo(-9, side * 7);
      ctx.lineTo(-8, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 4. Protruding crimson-tipped void spikes around balloon perimeter (grow dramatically in shock/fear)
    const spikeCount = 12;
    const spikeLen = 4.5 + p.spike * 8.5;
    for (let i = 0; i < spikeCount; i++) {
      const a = (i / spikeCount) * Math.PI * 2;
      if (Math.abs(Math.sin(a)) < 0.22 && Math.cos(a) > 0.7) continue; // keep mouth clear
      const bx = Math.cos(a) * (rx - 2);
      const by = Math.sin(a) * (ry - 2);
      const tx = Math.cos(a) * (rx + spikeLen);
      const ty = Math.sin(a) * (ry + spikeLen);
      const px = -Math.sin(a) * 3.0;
      const py = Math.cos(a) * 3.0;

      ctx.fillStyle = '#1D0F29';
      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(bx + px, by + py);
      ctx.lineTo(tx, ty);
      ctx.lineTo(bx - px, by - py);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FF2A5B';
      ctx.beginPath();
      ctx.arc(tx, ty, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. Pitch-black cosmic void balloon body
    const bodyGrad = ctx.createRadialGradient(8, -8, 4, 0, 0, Math.max(rx, ry) + 6);
    bodyGrad.addColorStop(0, '#2C1B3D');
    bodyGrad.addColorStop(0.42, '#170E24');
    bodyGrad.addColorStop(0.85, '#0C0614');
    bodyGrad.addColorStop(1, '#140B1C');

    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Subtle cosmic nebula swirl inside void belly
    const neb = ctx.createRadialGradient(-6, 4, 2, -6, 4, ry * 0.85);
    neb.addColorStop(0, 'rgba(130, 18, 92, 0.34)');
    neb.addColorStop(0.6, 'rgba(64, 16, 120, 0.18)');
    neb.addColorStop(1, 'rgba(12, 6, 20, 0)');
    ctx.fillStyle = neb;
    ctx.beginPath();
    ctx.ellipse(-4, 2, rx * 0.78, ry * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();

    // 6. Glowing crimson cosmic star-marks speckled across body
    for (const sm of STAR_MARKS) {
      const tw = 0.62 + 0.38 * Math.sin(t * 4.5 + sm.p);
      const x = sm.x * (rx / 34);
      const y = sm.y * (ry / 28);
      const r = sm.r * (0.85 + 0.25 * tw);
      ctx.fillStyle = `rgba(255, 42, 92, ${0.9 * tw * Math.min(1.2, p.starGlow)})`;
      ctx.beginPath();
      ctx.moveTo(x, y - r);
      ctx.lineTo(x + r * 0.34, y - r * 0.34);
      ctx.lineTo(x + r, y);
      ctx.lineTo(x + r * 0.34, y + r * 0.34);
      ctx.lineTo(x, y + r);
      ctx.lineTo(x - r * 0.34, y + r * 0.34);
      ctx.lineTo(x - r, y);
      ctx.lineTo(x - r * 0.34, y - r * 0.34);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#FFD0DC';
      ctx.beginPath();
      ctx.arc(x, y, r * 0.26, 0, Math.PI * 2);
      ctx.fill();
    }

    // Glossy cosmic sphere highlight
    ctx.fillStyle = 'rgba(215, 190, 255, 0.18)';
    ctx.beginPath();
    ctx.ellipse(rx * 0.32, -ry * 0.42, rx * 0.32, ry * 0.16, -0.35, 0, Math.PI * 2);
    ctx.fill();

    // 7. Chibi puffer beak-mouth with villain fangs
    const chomp = this._state === 'eating'
      ? 0.4 + 0.6 * Math.abs(Math.sin(this._stateTime * 20))
      : this._state === 'hungry'
        ? 0.42 + 0.25 * Math.sin(t * 10)
        : p.mouth;
    ctx.save();
    ctx.translate(rx - 1, 0);
    ctx.fillStyle = '#3B0820';
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.ellipse(-1, 0, 4.2, 5.2 + chomp * 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFF5F8';
    ctx.lineWidth = 1.1;
    for (const fy of [-2.8, 2.8]) {
      ctx.beginPath();
      ctx.moveTo(-1, fy - 1.6);
      ctx.lineTo(3.4 + chomp * 1.8, fy);
      ctx.lineTo(-1, fy + 1.6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    // 8. Expressive Villain Chibi Eyes
    this._drawEyes(ctx, t, rx, ry, glow);

    // 9. Mood FX
    this._drawMoodFX(ctx, t, rx, ry);

    ctx.restore();
  }

  _drawEyes(ctx, t, rx, ry, glow) {
    const st = this._state;
    for (const side of [-1, 1]) {
      const ex = rx * 0.56;
      const ey = side * (ry * 0.46);

      if (st === 'stress') {
        ctx.strokeStyle = '#FF2A5B';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(ex - 3.6, ey - side * 2.8);
        ctx.lineTo(ex + 3.0, ey);
        ctx.lineTo(ex - 3.6, ey + side * 2.8);
        ctx.stroke();
        continue;
      }

      const r = st === 'shock' ? 6.5 : 5.4;
      ctx.fillStyle = st === 'shock' ? '#FFFFFF' : '#180514';
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
        ig.addColorStop(0, '#FFD4DC');
        ig.addColorStop(0.55, '#FF2458');
        ig.addColorStop(1, '#680424');
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
        ctx.arc(ex + 2.2, ey - side * 1.3, 1.3, 0, Math.PI * 2);
        ctx.arc(ex - 0.5, ey + side * 1.3, 0.7, 0, Math.PI * 2);
        ctx.fill();
      }

      if (st === 'relax' || st === 'happy') {
        ctx.fillStyle = '#1E112D';
        ctx.beginPath();
        ctx.arc(ex, ey, r + 0.4, -Math.PI * 0.88, Math.PI * 0.12);
        ctx.closePath();
        ctx.fill();
      }

      ctx.strokeStyle = '#FF2A5B';
      ctx.lineWidth = 2.3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (st === 'sad' || st === 'fear') {
        ctx.moveTo(ex - 3.8, ey + side * 4.0);
        ctx.lineTo(ex + 4.2, ey + side * 6.0);
      } else if (st === 'shock') {
        ctx.moveTo(ex - 3.2, ey + side * 7.2);
        ctx.lineTo(ex + 4.0, ey + side * 7.2);
      } else {
        ctx.moveTo(ex + 4.8, ey - side * 2.0);
        ctx.lineTo(ex - 4.0, ey + side * 5.4);
      }
      ctx.stroke();

      if (st === 'hungry') {
        ctx.strokeStyle = `rgba(255, 42, 91, ${0.75 * glow})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(ex, ey, r + 2.1 + Math.sin(t * 15) * 0.7, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  _drawMoodFX(ctx, t, rx, ry) {
    const st = this._state;
    if (st === 'happy') {
      for (let i = 0; i < 4; i++) {
        const a = t * 2.6 + i * 1.57;
        const x = 6 + Math.cos(a) * (rx + 8);
        const y = Math.sin(a) * (ry + 6);
        const s = 3.2 + Math.sin(t * 8 + i) * 1.0;
        ctx.fillStyle = i % 2 === 0 ? '#FF2A5B' : '#B24BFF';
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
      ctx.translate(rx * 0.8 + b, -ry * 0.85);
      ctx.fillStyle = '#FF2A5B';
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
        const dx = rx * 0.45 - i * 18;
        const dy = (i === 0 ? -ry - 8 : ry + 8) + (i === 0 ? -d * 0.35 : d * 0.35);
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
      ctx.translate(rx * 0.55, -ry * 0.82);
      ctx.scale(s, s);
      ctx.strokeStyle = '#FF2A5B';
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
      ctx.moveTo(rx * 0.55, ry * 0.65 + d * 0.4);
      ctx.quadraticCurveTo(rx * 0.55 + 3.5, ry * 0.65 + 4 + d * 0.4, rx * 0.55, ry * 0.65 + 7 + d * 0.4);
      ctx.quadraticCurveTo(rx * 0.55 - 3.5, ry * 0.65 + 4 + d * 0.4, rx * 0.55, ry * 0.65 + d * 0.4);
      ctx.fill();
      ctx.stroke();
    }
  }
}

export default VillainBlowfish;
