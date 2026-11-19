/**
 * Villain Channel Catfish — 2D Top-Down Expressive Chibi Villain Fish
 * Battle-scarred dark iron-slate body, pirate eyepatch over one glowing eye,
 * and 4 pairs of wicked lightning-crackling animated barbels.
 */

const VALID_STATES = new Set([
  'breathing', 'swimming', 'relax', 'left_turn', 'right_turn',
  'eating', 'hungry', 'stress', 'fear', 'shock', 'happy', 'sad'
]);
const ONE_SHOTS = new Set(['left_turn', 'right_turn', 'eating', 'shock']);
const LOCKED = new Set(['shock', 'fear']);
const BLOCKED = new Set(['left_turn', 'right_turn', 'relax', 'happy', 'eating']);
const ALIASES = { idle: 'breathing', hunger: 'hungry' };
const ONE_SHOT_DUR = { left_turn: 0.6, right_turn: 0.6, eating: 0.64, shock: 0.72 };

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
      return { freq: 6.4, amp: 0.25, bend: 0, spark: 1.0, mouth: 0.14, fin: 0.3, shake: 0 };
    case 'relax':
      return { freq: 1.7, amp: 0.06, bend: 0, spark: 0.5, mouth: 0.04, fin: 0.08, shake: 0 };
    case 'left_turn':
      return { freq: 5.6, amp: 0.18, bend: -0.4, spark: 1.08, mouth: 0.18, fin: 0.45, shake: 0 };
    case 'right_turn':
      return { freq: 5.6, amp: 0.18, bend: 0.4, spark: 1.08, mouth: 0.18, fin: 0.45, shake: 0 };
    case 'eating':
      return { freq: 5.2, amp: 0.14, bend: 0, spark: 1.3, mouth: 0.96, fin: 0.55, shake: 0.02 };
    case 'hungry':
      return { freq: 4.8, amp: 0.17, bend: 0, spark: 1.25, mouth: 0.58, fin: 0.42, shake: 0.015 };
    case 'stress':
      return { freq: 9.0, amp: 0.11, bend: 0, spark: 1.45, mouth: 0.3, fin: 0.68, shake: 0.06 };
    case 'fear':
      return { freq: 10.8, amp: 0.15, bend: 0, spark: 0.6, mouth: 0.46, fin: 0.76, shake: 0.085 };
    case 'shock':
      return { freq: 12.2, amp: 0.09, bend: 0, spark: 1.6, mouth: 0.82, fin: 0.9, shake: 0.1 };
    case 'happy':
      return { freq: 3.8, amp: 0.13, bend: 0.05, spark: 1.12, mouth: 0.24, fin: 0.35, shake: 0 };
    case 'sad':
      return { freq: 1.4, amp: 0.04, bend: -0.05, spark: 0.32, mouth: 0.02, fin: -0.18, shake: 0 };
    case 'breathing':
    default:
      return { freq: 2.3, amp: 0.08, bend: 0, spark: 0.82, mouth: 0.08, fin: 0.16, shake: 0 };
  }
}

export class VillainCatfish {
  static metadata = {
    name: 'Villain Channel Catfish',
    category: 'villain_fish',
    baseLength: 150,
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
    const spark = (0.72 + 0.28 * Math.sin(t * 7.5)) * p.spark;
    const sx = p.shake ? Math.sin(t * 60) * p.shake * 22 : 0;
    const sy = p.shake ? Math.cos(t * 64) * p.shake * 22 : 0;

    ctx.save();
    ctx.translate(this.x + sx, this.y + sy);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Stormy dark iron-electric shadow miasma
    const aura = ctx.createRadialGradient(-4, 0, 10, -4, 0, 82);
    aura.addColorStop(0, `rgba(14, 10, 26, ${0.52 * Math.min(1.2, p.spark)})`);
    aura.addColorStop(0.55, `rgba(72, 188, 255, ${0.2 * spark})`);
    aura.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.ellipse(-4, 0, 80, 42, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Deeply forked battle-notched tail fin
    ctx.save();
    ctx.translate(-52, bend * 18);
    ctx.rotate(-bend * 0.85 - wag * 1.25);
    const tg = ctx.createLinearGradient(0, 0, -26, 0);
    tg.addColorStop(0, '#363D4E');
    tg.addColorStop(0.65, '#1D202C');
    tg.addColorStop(1, '#36B8FF');
    ctx.fillStyle = tg;
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(4, -6);
    ctx.lineTo(-24, -20);
    ctx.lineTo(-14, -7);
    ctx.lineTo(-17, -2); // battle notch
    ctx.lineTo(-12, 0);
    ctx.lineTo(-24, 20);
    ctx.lineTo(4, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 3. Spined iron-slate pectoral fins
    for (const side of [-1, 1]) {
      ctx.save();
      const flap = p.fin * 0.3 + Math.sin(this._phase + side) * 0.1;
      ctx.translate(18, side * 23);
      ctx.rotate(side * (0.45 + flap) + bend * 0.22);
      ctx.fillStyle = '#2B3140';
      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(4, side * 19);
      ctx.lineTo(-3, side * 14);
      ctx.lineTo(-10, side * 17);
      ctx.lineTo(-12, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Leading iron fin spine
      ctx.strokeStyle = '#8FA4C2';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(8, side * 1);
      ctx.lineTo(4, side * 18);
      ctx.stroke();
      ctx.restore();
    }

    // 4. 4 pairs of wicked lightning-crackling animated barbels!
    for (const side of [-1, 1]) {
      const barbels = [
        { ox: 56, oy: side * 12, len: 34, ang: side * 0.95, w: 2.5 }, // long maxillary whip
        { ox: 60, oy: side * 6, len: 18, ang: side * 0.45, w: 2.0 },  // nasal barbel
        { ox: 52, oy: side * 16, len: 22, ang: side * 1.32, w: 2.0 }, // outer chin barbel
        { ox: 48, oy: side * 19, len: 15, ang: side * 1.62, w: 1.7 }  // inner chin barbel
      ];
      for (let i = 0; i < barbels.length; i++) {
        const b = barbels[i];
        const wave1 = Math.sin(t * 6.5 + i * 1.3 + side) * 5;
        const wave2 = Math.cos(t * 7.8 + i * 1.7) * 7;
        const dx = Math.cos(b.ang) * b.len;
        const dy = Math.sin(b.ang) * b.len;
        const mx = b.ox + dx * 0.55 + wave1 * 0.4;
        const my = b.oy + dy * 0.55 + wave2 * 0.4;
        const ex = b.ox + dx + wave2 * 0.6;
        const ey = b.oy + dy + wave1 * 0.6;

        // Dark whip outline
        ctx.strokeStyle = '#140B1C';
        ctx.lineWidth = b.w + 1.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(b.ox, b.oy);
        ctx.quadraticCurveTo(mx, my, ex, ey);
        ctx.stroke();

        // Steel-blue core
        ctx.strokeStyle = '#6D7E99';
        ctx.lineWidth = b.w * 0.7;
        ctx.stroke();

        // Crackling electric-cyan lightning arcs along the barbel
        ctx.strokeStyle = `rgba(104, 224, 255, ${0.82 * spark})`;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        const jx1 = b.ox + dx * 0.35 + Math.sin(t * 32 + i * 3) * 3.5;
        const jy1 = b.oy + dy * 0.35 + Math.cos(t * 28 + i * 2) * 3.5;
        const jx2 = b.ox + dx * 0.72 + Math.cos(t * 36 + i * 5) * 4.0;
        const jy2 = b.oy + dy * 0.72 + Math.sin(t * 30 + i * 4) * 4.0;
        ctx.moveTo(b.ox, b.oy);
        ctx.lineTo(jx1, jy1);
        ctx.lineTo(jx2, jy2);
        ctx.lineTo(ex, ey);
        ctx.stroke();
      }
    }

    // 5. Broad, front-heavy battle-scarred dark iron-slate chibi body
    const breath = 1 + Math.sin(t * 2.8) * 0.022;
    ctx.save();
    ctx.scale(breath, breath);
    const bodyGrad = ctx.createRadialGradient(24, -6, 6, 0, 0, 68);
    bodyGrad.addColorStop(0, '#5A657C');
    bodyGrad.addColorStop(0.45, '#343C4D');
    bodyGrad.addColorStop(0.82, '#1E222E');
    bodyGrad.addColorStop(1, '#140B1C');

    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 3.2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(64, 0);
    ctx.quadraticCurveTo(62, -20, 38, -26);
    ctx.quadraticCurveTo(10, -28, -20, -17);
    ctx.quadraticCurveTo(-38, -11, -54, -6 + bend * 14);
    ctx.lineTo(-54, 6 + bend * 14);
    ctx.quadraticCurveTo(-38, 11, -20, 17);
    ctx.quadraticCurveTo(10, 28, 38, 26);
    ctx.quadraticCurveTo(62, 20, 64, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Dark iron cel-shading & metallic flank plates
    ctx.fillStyle = 'rgba(15, 10, 24, 0.42)';
    ctx.beginPath();
    ctx.moveTo(58, 8);
    ctx.quadraticCurveTo(22, 24, -52, 5 + bend * 13);
    ctx.lineTo(-52, 0 + bend * 10);
    ctx.quadraticCurveTo(16, 14, 58, 8);
    ctx.closePath();
    ctx.fill();

    // Channel catfish dark villainous ink-spots & battle scars
    ctx.fillStyle = '#191426';
    const spots = [[-4, -12, 3.2], [-16, 10, 2.8], [-28, -6, 2.5], [4, 14, 3.0], [-36, 5, 2.2]];
    for (const [sx0, sy0, sr] of spots) {
      ctx.beginPath();
      ctx.arc(sx0, sy0 + bend * 4, sr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Deep X-shaped battle scar on back
    ctx.strokeStyle = '#D98C8C';
    ctx.lineWidth = 2.0;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(10, -10);
    ctx.lineTo(-2, -1);
    ctx.moveTo(8, -1);
    ctx.lineTo(0, -10);
    ctx.stroke();

    // Dorsal iron spine ridge + small adipose fin
    ctx.fillStyle = '#232836';
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(2, -4.5);
    ctx.lineTo(-14, bend * 3);
    ctx.lineTo(2, 4.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glossy slate highlight
    ctx.fillStyle = 'rgba(205, 224, 255, 0.18)';
    ctx.beginPath();
    ctx.ellipse(28, -12, 16, 4.5, -0.18, 0, Math.PI * 2);
    ctx.fill();

    // 6. Broad scowling catfish mouth with jagged fangs
    const bite = this._state === 'eating'
      ? 0.4 + 0.6 * Math.abs(Math.sin(this._stateTime * 19))
      : this._state === 'hungry'
        ? 0.45 + 0.25 * Math.sin(t * 10)
        : p.mouth;
    ctx.save();
    ctx.translate(62, 0);
    if (bite > 0.14 || this._state === 'happy') {
      const mh = 7 + bite * 9;
      ctx.fillStyle = '#33081C';
      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 2.1;
      ctx.beginPath();
      ctx.moveTo(-4, -mh * 0.78);
      ctx.quadraticCurveTo(6 + bite * 3.5, 0, -4, mh * 0.78);
      ctx.quadraticCurveTo(-8, 0, -4, -mh * 0.78);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FFF7F0';
      ctx.lineWidth = 1.1;
      for (const fy of [-mh * 0.48, -mh * 0.16, mh * 0.16, mh * 0.48]) {
        ctx.beginPath();
        ctx.moveTo(-3, fy - 1.8);
        ctx.lineTo(2.8 + bite * 1.6, fy);
        ctx.lineTo(-3, fy + 1.8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    } else {
      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-2, -11);
      ctx.quadraticCurveTo(3, 0, -2, 11);
      ctx.stroke();
    }
    ctx.restore();

    // 7. Expressive Villain Eyes + Pirate Eyepatch over left eye (side = -1)
    this._drawEyesWithEyepatch(ctx, t, spark);

    ctx.restore();
    this._drawMoodFX(ctx, t);
    ctx.restore();
  }

  _drawEyesWithEyepatch(ctx, t, spark) {
    const st = this._state;

    // Right eye (side = +1): fully visible glowing electric-amber villain eye
    const ex = 42;
    const ey = 14.5;
    if (st === 'stress') {
      ctx.strokeStyle = '#5CE1FF';
      ctx.lineWidth = 2.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(ex - 3.8, ey - 3.0);
      ctx.lineTo(ex + 3.2, ey);
      ctx.lineTo(ex - 3.8, ey + 3.0);
      ctx.stroke();
    } else {
      const r = st === 'shock' ? 6.4 : 5.4;
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
        ctx.arc(ex + 1, ey, 1.7, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const ig = ctx.createRadialGradient(ex + 0.8, ey, 0.5, ex, ey, 3.9);
        ig.addColorStop(0, '#E8FFFF');
        ig.addColorStop(0.55, '#38C8FF');
        ig.addColorStop(1, '#10388C');
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
        ctx.arc(ex + 2.3, ey - 1.3, 1.3, 0, Math.PI * 2);
        ctx.arc(ex - 0.5, ey + 1.3, 0.7, 0, Math.PI * 2);
        ctx.fill();
      }

      if (st === 'relax' || st === 'happy') {
        ctx.fillStyle = '#343C4D';
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
        ctx.moveTo(ex - 4, ey + 3.8);
        ctx.lineTo(ex + 4.4, ey + 6.0);
      } else if (st === 'shock') {
        ctx.moveTo(ex - 3.2, ey + 6.8);
        ctx.lineTo(ex + 4.0, ey + 6.8);
      } else {
        ctx.moveTo(ex + 4.8, ey - 2.0);
        ctx.lineTo(ex - 4.2, ey + 5.2);
      }
      ctx.stroke();

      if (st === 'hungry') {
        ctx.strokeStyle = `rgba(56, 200, 255, ${0.75 * spark})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(ex, ey, r + 2.1 + Math.sin(t * 15) * 0.7, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Left eye (side = -1): Pirate eyepatch strap + leather patch with glowing red eye peeking beneath!
    const px = 42;
    const py = -14.5;
    // Strap running diagonally across forehead
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.moveTo(49, -23);
    ctx.lineTo(31, 4);
    ctx.stroke();

    // Subtle crimson glow leaking from under the eyepatch
    ctx.fillStyle = `rgba(255, 42, 74, ${0.55 * spark})`;
    ctx.beginPath();
    ctx.arc(px + 2, py, 5.2, 0, Math.PI * 2);
    ctx.fill();

    // Pirate leather eyepatch shield
    ctx.fillStyle = '#1C1124';
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(px, py, 6.8, 5.8, -0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Gold/crimson skull-cross stitch on eyepatch
    ctx.strokeStyle = '#FF385C';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(px - 2.4, py - 2.2);
    ctx.lineTo(px + 2.4, py + 2.2);
    ctx.moveTo(px + 2.4, py - 2.2);
    ctx.lineTo(px - 2.4, py + 2.2);
    ctx.stroke();
  }

  _drawMoodFX(ctx, t) {
    const st = this._state;
    if (st === 'happy') {
      for (let i = 0; i < 4; i++) {
        const a = t * 2.6 + i * 1.57;
        const x = 18 + Math.cos(a) * 46;
        const y = Math.sin(a) * 30;
        const s = 3.4 + Math.sin(t * 8 + i) * 1.0;
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
      ctx.translate(54 + b, -26);
      ctx.fillStyle = '#38C8FF';
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
        const dx = 34 - i * 22;
        const dy = (i === 0 ? -32 : 32) + (i === 0 ? -d * 0.35 : d * 0.35);
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
      ctx.translate(42, -26);
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
      ctx.moveTo(42, 20 + d * 0.4);
      ctx.quadraticCurveTo(45.5, 24 + d * 0.4, 42, 27 + d * 0.4);
      ctx.quadraticCurveTo(38.5, 24 + d * 0.4, 42, 20 + d * 0.4);
      ctx.fill();
      ctx.stroke();
    }
  }
}

export default VillainCatfish;
