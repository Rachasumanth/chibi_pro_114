/**
 * Villain Scrawled Filefish — 2D Top-Down Expressive Chibi Villain Fish
 * Dark smoky-charcoal leaf silhouette covered in glowing cursed neon-magenta
 * rune squiggles and a tattered broom tail.
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

function easeOutCubic(t) {
  const c = Math.max(0, Math.min(1, t));
  return 1 - (1 - c) * (1 - c) * (1 - c);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function getPose(state) {
  switch (state) {
    case 'swimming':
      return { freq: 6.2, amp: 0.25, bend: 0, runeGlow: 1.0, horn: 0.55, mouth: 0.12, shake: 0 };
    case 'relax':
      return { freq: 1.7, amp: 0.06, bend: 0, runeGlow: 0.55, horn: 0.2, mouth: 0.04, shake: 0 };
    case 'left_turn':
      return { freq: 5.4, amp: 0.18, bend: -0.42, runeGlow: 1.05, horn: 0.75, mouth: 0.14, shake: 0 };
    case 'right_turn':
      return { freq: 5.4, amp: 0.18, bend: 0.42, runeGlow: 1.05, horn: 0.75, mouth: 0.14, shake: 0 };
    case 'eating':
      return { freq: 5.0, amp: 0.14, bend: 0, runeGlow: 1.25, horn: 0.9, mouth: 0.94, shake: 0.02 };
    case 'hungry':
      return { freq: 4.8, amp: 0.18, bend: 0, runeGlow: 1.22, horn: 0.85, mouth: 0.54, shake: 0.015 };
    case 'stress':
      return { freq: 9.0, amp: 0.12, bend: 0, runeGlow: 1.35, horn: 1.1, mouth: 0.28, shake: 0.06 };
    case 'fear':
      return { freq: 10.8, amp: 0.16, bend: 0, runeGlow: 0.48, horn: 1.15, mouth: 0.46, shake: 0.085 };
    case 'shock':
      return { freq: 12.2, amp: 0.09, bend: 0, runeGlow: 1.4, horn: 1.25, mouth: 0.78, shake: 0.1 };
    case 'happy':
      return { freq: 3.7, amp: 0.13, bend: 0.05, runeGlow: 1.1, horn: 0.45, mouth: 0.22, shake: 0 };
    case 'sad':
      return { freq: 1.4, amp: 0.04, bend: -0.05, runeGlow: 0.35, horn: 0.1, mouth: 0.02, shake: 0 };
    case 'breathing':
    default:
      return { freq: 2.3, amp: 0.08, bend: 0, runeGlow: 0.82, horn: 0.38, mouth: 0.08, shake: 0 };
  }
}

export class VillainFilefish {
  static metadata = {
    name: 'Villain Scrawled Filefish',
    category: 'villain_fish',
    baseLength: 120,
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
    this._from = getPose('breathing');
    this._to = getPose('breathing');
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
    this._to = getPose(next);
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
      const t = easeOutCubic(this._blendElapsed / this._blendDur);
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
        this._to = getPose(ret);
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
    const glow = (0.72 + 0.28 * Math.sin(t * 4.4)) * p.runeGlow;
    const sx = p.shake ? Math.sin(t * 60) * p.shake * 22 : 0;
    const sy = p.shake ? Math.cos(t * 64) * p.shake * 22 : 0;

    ctx.save();
    ctx.translate(this.x + sx, this.y + sy);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Cursed smoky-magenta shadow aura
    const aura = ctx.createRadialGradient(-4, 0, 8, -4, 0, 66);
    aura.addColorStop(0, `rgba(18, 9, 26, ${0.5 * Math.min(1.2, p.runeGlow)})`);
    aura.addColorStop(0.55, `rgba(214, 34, 184, ${0.22 * glow})`);
    aura.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.ellipse(-4, 0, 64, 32, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Oversized tattered cursed broom tail
    ctx.save();
    ctx.translate(-34, bend * 14);
    ctx.rotate(-bend * 0.85 - wag * 1.25);
    const broomGrad = ctx.createLinearGradient(0, 0, -34, 0);
    broomGrad.addColorStop(0, '#2B2433');
    broomGrad.addColorStop(0.55, '#1B1424');
    broomGrad.addColorStop(1, '#7D1268');
    ctx.fillStyle = broomGrad;
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(4, -5);
    ctx.lineTo(-26, -18);
    ctx.lineTo(-19, -9);
    ctx.lineTo(-34, -10);
    ctx.lineTo(-22, -2);
    ctx.lineTo(-36, 2);
    ctx.lineTo(-21, 7);
    ctx.lineTo(-32, 15);
    ctx.lineTo(-18, 12);
    ctx.lineTo(-24, 19);
    ctx.lineTo(4, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing cursed magenta broom strands
    ctx.strokeStyle = `rgba(255, 62, 226, ${0.75 * glow})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-2, -2);
    ctx.quadraticCurveTo(-15, -9, -29, -9);
    ctx.moveTo(-2, 0);
    ctx.quadraticCurveTo(-18, 2, -32, 2);
    ctx.moveTo(-2, 2);
    ctx.quadraticCurveTo(-15, 10, -27, 13);
    ctx.stroke();
    ctx.restore();

    // 3. Delicate tattered pectoral fins
    for (const side of [-1, 1]) {
      ctx.save();
      const flap = Math.sin(this._phase * 1.25 + side) * 0.16;
      ctx.translate(10, side * 17);
      ctx.rotate(side * (0.45 + flap) + bend * 0.22);
      ctx.fillStyle = '#251D2E';
      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 2.1;
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.lineTo(2, side * 12);
      ctx.lineTo(-3, side * 9);
      ctx.lineTo(-8, side * 13);
      ctx.lineTo(-10, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 4. Smoky-charcoal elongated chibi leaf body
    const breath = 1 + Math.sin(t * 2.8) * 0.02;
    ctx.save();
    ctx.scale(breath, breath);
    const bodyGrad = ctx.createLinearGradient(52, -18, -36, 18);
    bodyGrad.addColorStop(0, '#443B4F');
    bodyGrad.addColorStop(0.45, '#2A2333');
    bodyGrad.addColorStop(0.85, '#1B1424');
    bodyGrad.addColorStop(1, '#140B1C');

    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 3.0;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(56, 0);
    ctx.quadraticCurveTo(44, -14, 24, -20);
    ctx.quadraticCurveTo(2, -23, -18, -14);
    ctx.quadraticCurveTo(-28, -9, -36, -5 + bend * 10);
    ctx.lineTo(-36, 5 + bend * 10);
    ctx.quadraticCurveTo(-28, 9, -18, 14);
    ctx.quadraticCurveTo(2, 23, 24, 20);
    ctx.quadraticCurveTo(44, 14, 56, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Dark cel-shaded lower rim
    ctx.fillStyle = 'rgba(14, 7, 22, 0.45)';
    ctx.beginPath();
    ctx.moveTo(52, 2);
    ctx.quadraticCurveTo(24, 18, -34, 4 + bend * 9);
    ctx.lineTo(-34, 0 + bend * 6);
    ctx.quadraticCurveTo(18, 10, 52, 2);
    ctx.closePath();
    ctx.fill();

    // 5. Glowing cursed neon-magenta rune squiggles & arcane glyphs
    ctx.save();
    ctx.strokeStyle = `rgba(255, 58, 220, ${0.9 * glow})`;
    ctx.shadowColor = '#FF2ED6';
    ctx.shadowBlur = 7 * glow;
    ctx.lineWidth = 2.0;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Top-side scrawled cursed runes
    ctx.beginPath();
    ctx.moveTo(36, -6);
    ctx.bezierCurveTo(28, -15, 16, -8, 10, -16);
    ctx.bezierCurveTo(2, -20, -6, -8, -16, -12);
    ctx.bezierCurveTo(-22, -14, -24, -5, -30, -4 + bend * 7);
    ctx.stroke();

    // Bottom-side scrawled cursed runes
    ctx.beginPath();
    ctx.moveTo(36, 6);
    ctx.bezierCurveTo(28, 15, 16, 8, 10, 16);
    ctx.bezierCurveTo(2, 20, -6, 8, -16, 12);
    ctx.bezierCurveTo(-22, 14, -24, 5, -30, 4 + bend * 7);
    ctx.stroke();

    // Glowing arcane sigil dots & rune cross
    ctx.shadowBlur = 0;
    ctx.fillStyle = `rgba(255, 180, 246, ${0.9 * glow})`;
    const dots = [[18, -11], [18, 11], [-2, -13], [-2, 13], [-18, -6], [-18, 6]];
    for (const [dx, dy] of dots) {
      ctx.beginPath();
      ctx.arc(dx, dy, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Glossy top-left sheen
    ctx.fillStyle = 'rgba(220, 185, 255, 0.16)';
    ctx.beginPath();
    ctx.ellipse(22, -9, 14, 4, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // 6. Cursed dorsal file-spine horn along forehead
    const hornLen = 14 + p.horn * 7;
    ctx.fillStyle = '#2B1136';
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 2.1;
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(8, -3.5);
    ctx.lineTo(8 - hornLen, 0);
    ctx.lineTo(8, 3.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Neon magenta tip on dorsal spine
    ctx.fillStyle = '#FF42E0';
    ctx.beginPath();
    ctx.arc(8 - hornLen + 1, 0, 2.0, 0, Math.PI * 2);
    ctx.fill();

    // 7. Narrow wicked beak-snout with needle fangs
    const snap = this._state === 'eating'
      ? 0.4 + 0.6 * Math.abs(Math.sin(this._stateTime * 20))
      : this._state === 'hungry'
        ? 0.4 + 0.25 * Math.sin(t * 10)
        : p.mouth;
    ctx.save();
    ctx.translate(54, 0);
    ctx.fillStyle = '#38092E';
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.ellipse(-2, 0, 4.5, 4.2 + snap * 3.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFF5FD';
    ctx.lineWidth = 1.0;
    for (const fy of [-2.4, 2.4]) {
      ctx.beginPath();
      ctx.moveTo(-1, fy - 1.3);
      ctx.lineTo(3.2 + snap * 1.6, fy);
      ctx.lineTo(-1, fy + 1.3);
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
      const ex = 27;
      const ey = side * 11.2;

      if (st === 'stress') {
        ctx.strokeStyle = '#FF42E0';
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(ex - 3.5, ey - side * 2.8);
        ctx.lineTo(ex + 3.0, ey);
        ctx.lineTo(ex - 3.5, ey + side * 2.8);
        ctx.stroke();
        continue;
      }

      const r = st === 'shock' ? 5.8 : 4.9;
      ctx.fillStyle = st === 'shock' ? '#FFFFFF' : '#1A0824';
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
        ig.addColorStop(0, '#FFB8F8');
        ig.addColorStop(0.55, '#FF2AD4');
        ig.addColorStop(1, '#66086E');
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
        ctx.arc(ex + 2.1, ey - side * 1.2, 1.2, 0, Math.PI * 2);
        ctx.arc(ex - 0.5, ey + side * 1.2, 0.65, 0, Math.PI * 2);
        ctx.fill();
      }

      if (st === 'relax' || st === 'happy') {
        ctx.fillStyle = '#2B2236';
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
        ctx.moveTo(ex - 3.6, ey + side * 3.6);
        ctx.lineTo(ex + 4.0, ey + side * 5.6);
      } else if (st === 'shock') {
        ctx.moveTo(ex - 3, ey + side * 6.4);
        ctx.lineTo(ex + 3.8, ey + side * 6.4);
      } else {
        ctx.moveTo(ex + 4.5, ey - side * 2.0);
        ctx.lineTo(ex - 3.8, ey + side * 5.0);
      }
      ctx.stroke();

      if (st === 'hungry') {
        ctx.strokeStyle = `rgba(255, 58, 220, ${0.72 * glow})`;
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
        const a = t * 2.6 + i * 1.57;
        const x = 14 + Math.cos(a) * 38;
        const y = Math.sin(a) * 24;
        const s = 3.2 + Math.sin(t * 8 + i) * 1.0;
        ctx.fillStyle = i % 2 === 0 ? '#FF38D4' : '#9B42FF';
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
      ctx.translate(42 + b, -20);
      ctx.fillStyle = '#FF38D4';
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
        const dx = 22 - i * 18;
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
      ctx.translate(28, -20);
      ctx.scale(s, s);
      ctx.strokeStyle = '#FF2A62';
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
      ctx.moveTo(27, 16 + d * 0.4);
      ctx.quadraticCurveTo(30.5, 20 + d * 0.4, 27, 23 + d * 0.4);
      ctx.quadraticCurveTo(23.5, 20 + d * 0.4, 27, 16 + d * 0.4);
      ctx.fill();
      ctx.stroke();
    }
  }
}

export default VillainFilefish;
