/**
 * Villain Rainbow Parrotfish — 2D Top-Down Expressive Chibi Villain Fish
 * Dark oil-slick iridescent obsidian/violet/emerald scales with a wicked
 * cracked metallic iron beak.
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

function cubicEase(t) {
  const c = Math.max(0, Math.min(1, t));
  return 1 - (1 - c) * (1 - c) * (1 - c);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function poseForState(state) {
  switch (state) {
    case 'swimming':
      return { freq: 6.6, amp: 0.24, bend: 0, beak: 0.14, shimmer: 1.0, fin: 0.3, shake: 0 };
    case 'relax':
      return { freq: 1.8, amp: 0.06, bend: 0, beak: 0.04, shimmer: 0.65, fin: 0.08, shake: 0 };
    case 'left_turn':
      return { freq: 5.8, amp: 0.18, bend: -0.38, beak: 0.16, shimmer: 1.05, fin: 0.45, shake: 0 };
    case 'right_turn':
      return { freq: 5.8, amp: 0.18, bend: 0.38, beak: 0.16, shimmer: 1.05, fin: 0.45, shake: 0 };
    case 'eating':
      return { freq: 5.2, amp: 0.14, bend: 0, beak: 0.96, shimmer: 1.25, fin: 0.55, shake: 0.02 };
    case 'hungry':
      return { freq: 5.0, amp: 0.17, bend: 0, beak: 0.58, shimmer: 1.2, fin: 0.42, shake: 0.015 };
    case 'stress':
      return { freq: 9.2, amp: 0.11, bend: 0, beak: 0.3, shimmer: 1.32, fin: 0.68, shake: 0.06 };
    case 'fear':
      return { freq: 11.0, amp: 0.15, bend: 0, beak: 0.46, shimmer: 0.48, fin: 0.78, shake: 0.085 };
    case 'shock':
      return { freq: 12.4, amp: 0.09, bend: 0, beak: 0.82, shimmer: 1.38, fin: 0.9, shake: 0.1 };
    case 'happy':
      return { freq: 3.9, amp: 0.13, bend: 0.05, beak: 0.24, shimmer: 1.15, fin: 0.36, shake: 0 };
    case 'sad':
      return { freq: 1.4, amp: 0.04, bend: -0.05, beak: 0.02, shimmer: 0.38, fin: -0.18, shake: 0 };
    case 'breathing':
    default:
      return { freq: 2.4, amp: 0.08, bend: 0, beak: 0.08, shimmer: 0.85, fin: 0.16, shake: 0 };
  }
}

export class VillainParrotfish {
  static metadata = {
    name: 'Villain Rainbow Parrotfish',
    category: 'villain_fish',
    baseLength: 130,
    baseWidth: 56
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
    this._from = poseForState('breathing');
    this._to = poseForState('breathing');
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
    this._to = poseForState(next);
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
      const t = cubicEase(this._blendElapsed / this._blendDur);
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
        this._to = poseForState(ret);
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
    const slick = (0.72 + 0.28 * Math.sin(t * 3.8)) * p.shimmer;
    const sx = p.shake ? Math.sin(t * 59) * p.shake * 22 : 0;
    const sy = p.shake ? Math.cos(t * 63) * p.shake * 22 : 0;

    ctx.save();
    ctx.translate(this.x + sx, this.y + sy);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Oil-slick dark iridescent miasma aura
    const aura = ctx.createRadialGradient(-2, 0, 10, -2, 0, 72);
    aura.addColorStop(0, `rgba(16, 10, 28, ${0.52 * Math.min(1.2, p.shimmer)})`);
    aura.addColorStop(0.55, `rgba(18, 196, 142, ${0.18 * slick})`);
    aura.addColorStop(0.78, `rgba(148, 42, 235, ${0.16 * slick})`);
    aura.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.ellipse(-2, 0, 70, 38, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Crescent battle-notched oil-slick tail fin
    ctx.save();
    ctx.translate(-42, bend * 16);
    ctx.rotate(-bend * 0.8 - wag * 1.2);
    const tg = ctx.createLinearGradient(0, -16, -24, 16);
    tg.addColorStop(0, '#1C142B');
    tg.addColorStop(0.45, '#5C1B9E');
    tg.addColorStop(0.8, '#0DA87D');
    tg.addColorStop(1, '#140B1C');
    ctx.fillStyle = tg;
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(4, -7);
    ctx.quadraticCurveTo(-10, -18, -24, -20);
    ctx.lineTo(-16, -8);
    ctx.lineTo(-19, -2); // battle notch
    ctx.lineTo(-14, 2);
    ctx.lineTo(-24, 20);
    ctx.quadraticCurveTo(-10, 18, 4, 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 3. Swept oil-slick emerald/violet pectoral fins
    for (const side of [-1, 1]) {
      ctx.save();
      const flap = p.fin * 0.32 + Math.sin(this._phase + side) * 0.1;
      ctx.translate(14, side * 22);
      ctx.rotate(side * (0.42 + flap) + bend * 0.22);
      const fg = ctx.createLinearGradient(0, 0, -12, side * 18);
      fg.addColorStop(0, '#2B1645');
      fg.addColorStop(0.6, '#0E8F6E');
      fg.addColorStop(1, '#8C2BFF');
      ctx.fillStyle = fg;
      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.quadraticCurveTo(6, side * 14, -4, side * 18);
      ctx.lineTo(-7, side * 13); // notch
      ctx.lineTo(-14, side * 15);
      ctx.lineTo(-12, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 4. Chunky torpedo chibi body with oil-slick obsidian/violet/emerald gradient
    const breath = 1 + Math.sin(t * 2.9) * 0.022;
    ctx.save();
    ctx.scale(breath, breath);
    const bodyGrad = ctx.createLinearGradient(54, -26, -44, 26);
    bodyGrad.addColorStop(0, '#1B2D38');
    bodyGrad.addColorStop(0.28, '#106E5C');
    bodyGrad.addColorStop(0.55, '#471B7A');
    bodyGrad.addColorStop(0.82, '#1A1329');
    bodyGrad.addColorStop(1, '#140B1C');

    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 3.2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(54, 0);
    ctx.quadraticCurveTo(48, -22, 22, -26);
    ctx.quadraticCurveTo(-4, -28, -26, -16);
    ctx.quadraticCurveTo(-36, -11, -44, -7 + bend * 12);
    ctx.lineTo(-44, 7 + bend * 12);
    ctx.quadraticCurveTo(-36, 11, -26, 16);
    ctx.quadraticCurveTo(-4, 28, 22, 26);
    ctx.quadraticCurveTo(48, 22, 54, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Iridescent oil-slick diamond armor scales
    for (let row = -1; row <= 1; row++) {
      for (let col = 0; col < 5; col++) {
        const sxPos = 18 - col * 11;
        const syPos = row * 10 + (col % 2 === 0 ? 0 : row * 1.5) + bend * (col * 1.8);
        if (Math.abs(syPos) > 19 - col * 2.1) continue;
        const shift = Math.sin(t * 2.4 + col * 0.8 + row) * 0.5 + 0.5;
        ctx.fillStyle = shift > 0.5 ? 'rgba(20, 232, 168, 0.28)' : 'rgba(186, 72, 255, 0.28)';
        ctx.strokeStyle = '#140B1C';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(sxPos + 5, syPos);
        ctx.lineTo(sxPos, syPos - 4.5);
        ctx.lineTo(sxPos - 5, syPos);
        ctx.lineTo(sxPos, syPos + 4.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    // Glowing emerald dorsal spine ridge
    ctx.strokeStyle = `rgba(38, 255, 186, ${0.75 * slick})`;
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.quadraticCurveTo(-8, bend * 4, -36, bend * 11);
    ctx.stroke();

    // Glossy oil-slick highlight on crown
    ctx.fillStyle = 'rgba(190, 255, 240, 0.2)';
    ctx.beginPath();
    ctx.ellipse(26, -11, 15, 5, -0.22, 0, Math.PI * 2);
    ctx.fill();

    // 5. Wicked cracked metallic iron parrot beak
    const chomp = this._state === 'eating'
      ? 0.4 + 0.6 * Math.abs(Math.sin(this._stateTime * 18))
      : this._state === 'hungry'
        ? 0.42 + 0.25 * Math.sin(t * 10)
        : p.beak;

    ctx.save();
    ctx.translate(52, 0);
    const beakGrad = ctx.createLinearGradient(-4, -10, 14, 10);
    beakGrad.addColorStop(0, '#9DA6B8');
    beakGrad.addColorStop(0.45, '#596173');
    beakGrad.addColorStop(1, '#262936');
    ctx.fillStyle = beakGrad;
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';

    const spread = 1.5 + chomp * 4.5;
    // Left half of fused iron beak
    ctx.beginPath();
    ctx.moveTo(-4, -10);
    ctx.quadraticCurveTo(9, -8 - spread * 0.3, 13 + chomp * 2, -spread * 0.45);
    ctx.lineTo(-2, -1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Right half of fused iron beak
    ctx.beginPath();
    ctx.moveTo(-4, 10);
    ctx.quadraticCurveTo(9, 8 + spread * 0.3, 13 + chomp * 2, spread * 0.45);
    ctx.lineTo(-2, 1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Metallic cracks & glowing emerald fissure in iron beak
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(2, -7);
    ctx.lineTo(5, -4);
    ctx.lineTo(3, -2);
    ctx.moveTo(3, 7);
    ctx.lineTo(7, 4);
    ctx.stroke();

    if (chomp > 0.2) {
      ctx.fillStyle = '#2A081E';
      ctx.beginPath();
      ctx.ellipse(2, 0, 5, spread * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Battle scar across cheek plate
    ctx.strokeStyle = '#25FFB8';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(36, 7);
    ctx.lineTo(27, 17);
    ctx.stroke();

    // 6. Expressive Villain Chibi Eyes
    this._drawEyes(ctx, t, slick);

    ctx.restore();
    this._drawMoodFX(ctx, t);
    ctx.restore();
  }

  _drawEyes(ctx, t, slick) {
    const st = this._state;
    for (const side of [-1, 1]) {
      const ex = 33;
      const ey = side * 14.5;

      if (st === 'stress') {
        ctx.strokeStyle = '#25FFB8';
        ctx.lineWidth = 2.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(ex - 3.8, ey - side * 3);
        ctx.lineTo(ex + 3.2, ey);
        ctx.lineTo(ex - 3.8, ey + side * 3);
        ctx.stroke();
        continue;
      }

      const r = st === 'shock' ? 6.4 : 5.3;
      ctx.fillStyle = st === 'shock' ? '#FFFFFF' : '#180B24';
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
        const ig = ctx.createRadialGradient(ex + 0.8, ey, 0.5, ex, ey, 3.8);
        ig.addColorStop(0, '#B8FFE6');
        ig.addColorStop(0.55, '#1CE8A8');
        ig.addColorStop(1, '#581296');
        ctx.fillStyle = ig;
        ctx.beginPath();
        ctx.arc(ex + 0.8, ey, 3.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#140B1C';
        ctx.beginPath();
        ctx.ellipse(ex + 1.2, ey, 1.3, 2.8, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(ex + 2.3, ey - side * 1.3, 1.25, 0, Math.PI * 2);
        ctx.arc(ex - 0.5, ey + side * 1.3, 0.7, 0, Math.PI * 2);
        ctx.fill();
      }

      if (st === 'relax' || st === 'happy') {
        ctx.fillStyle = '#2B1745';
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
        ctx.lineTo(ex + 4.4, ey + side * 6.0);
      } else if (st === 'shock') {
        ctx.moveTo(ex - 3.2, ey + side * 6.8);
        ctx.lineTo(ex + 4.0, ey + side * 6.8);
      } else {
        ctx.moveTo(ex + 4.8, ey - side * 2.0);
        ctx.lineTo(ex - 4.2, ey + side * 5.2);
      }
      ctx.stroke();

      if (st === 'hungry') {
        ctx.strokeStyle = `rgba(38, 255, 186, ${0.72 * slick})`;
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
        const x = 14 + Math.cos(a) * 42;
        const y = Math.sin(a) * 28;
        const s = 3.3 + Math.sin(t * 8 + i) * 1.0;
        ctx.fillStyle = i % 2 === 0 ? '#C738FF' : '#FF2E63';
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
      ctx.translate(46 + b, -24);
      ctx.fillStyle = '#FF3852';
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
        const dx = 26 - i * 20;
        const dy = (i === 0 ? -30 : 30) + (i === 0 ? -d * 0.35 : d * 0.35);
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
      ctx.translate(32, -24);
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
      ctx.moveTo(33, 20 + d * 0.4);
      ctx.quadraticCurveTo(36.5, 24 + d * 0.4, 33, 27 + d * 0.4);
      ctx.quadraticCurveTo(29.5, 24 + d * 0.4, 33, 20 + d * 0.4);
      ctx.fill();
      ctx.stroke();
    }
  }
}

export default VillainParrotfish;
