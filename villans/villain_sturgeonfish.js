/**
 * Villain Lake Sturgeon — 2D Top-Down Expressive Chibi Villain Fish
 * Blackened iron-armored prehistoric dreadnought with rows of sharp glowing
 * magma scutes and a serrated shark-like tail.
 */

const VALID_STATES = new Set([
  'breathing', 'swimming', 'relax', 'left_turn', 'right_turn',
  'eating', 'hungry', 'stress', 'fear', 'shock', 'happy', 'sad'
]);
const ONE_SHOTS = new Set(['left_turn', 'right_turn', 'eating', 'shock']);
const LOCKED = new Set(['shock', 'fear']);
const BLOCKED = new Set(['left_turn', 'right_turn', 'relax', 'happy', 'eating']);
const ALIASES = { idle: 'breathing', hunger: 'hungry' };
const ONE_SHOT_DUR = { left_turn: 0.62, right_turn: 0.62, eating: 0.66, shock: 0.74 };

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
      return { freq: 5.6, amp: 0.25, bend: 0, magma: 1.0, mouth: 0.14, fin: 0.28, shake: 0 };
    case 'relax':
      return { freq: 1.5, amp: 0.06, bend: 0, magma: 0.55, mouth: 0.04, fin: 0.08, shake: 0 };
    case 'left_turn':
      return { freq: 5.0, amp: 0.18, bend: -0.38, magma: 1.08, mouth: 0.16, fin: 0.42, shake: 0 };
    case 'right_turn':
      return { freq: 5.0, amp: 0.18, bend: 0.38, magma: 1.08, mouth: 0.16, fin: 0.42, shake: 0 };
    case 'eating':
      return { freq: 4.8, amp: 0.14, bend: 0, magma: 1.32, mouth: 0.94, fin: 0.52, shake: 0.02 };
    case 'hungry':
      return { freq: 4.5, amp: 0.17, bend: 0, magma: 1.25, mouth: 0.55, fin: 0.4, shake: 0.015 };
    case 'stress':
      return { freq: 8.6, amp: 0.11, bend: 0, magma: 1.4, mouth: 0.3, fin: 0.66, shake: 0.06 };
    case 'fear':
      return { freq: 10.4, amp: 0.15, bend: 0, magma: 0.48, mouth: 0.46, fin: 0.75, shake: 0.085 };
    case 'shock':
      return { freq: 12.0, amp: 0.09, bend: 0, magma: 1.48, mouth: 0.8, fin: 0.88, shake: 0.1 };
    case 'happy':
      return { freq: 3.4, amp: 0.13, bend: 0.05, magma: 1.15, mouth: 0.24, fin: 0.34, shake: 0 };
    case 'sad':
      return { freq: 1.3, amp: 0.04, bend: -0.05, magma: 0.34, mouth: 0.02, fin: -0.18, shake: 0 };
    case 'breathing':
    default:
      return { freq: 2.1, amp: 0.08, bend: 0, magma: 0.82, mouth: 0.08, fin: 0.16, shake: 0 };
  }
}

export class VillainSturgeonfish {
  static metadata = {
    name: 'Villain Lake Sturgeon',
    category: 'villain_fish',
    baseLength: 205,
    baseWidth: 64
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
      const dur = ONE_SHOT_DUR[this._state] || 0.62;
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
    const magma = (0.72 + 0.28 * Math.sin(t * 4.4)) * p.magma;
    const sx = p.shake ? Math.sin(t * 58) * p.shake * 22 : 0;
    const sy = p.shake ? Math.cos(t * 62) * p.shake * 22 : 0;

    ctx.save();
    ctx.translate(this.x + sx, this.y + sy);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Dreadnought furnace-shadow miasma aura
    const aura = ctx.createRadialGradient(-4, 0, 12, -4, 0, 108);
    aura.addColorStop(0, `rgba(16, 8, 22, ${0.55 * Math.min(1.2, p.magma)})`);
    aura.addColorStop(0.55, `rgba(255, 72, 18, ${0.22 * magma})`);
    aura.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.ellipse(-4, 0, 106, 42, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Serrated dreadnought heterocercal tail fin
    ctx.save();
    ctx.translate(-74, bend * 22);
    ctx.rotate(-bend * 0.85 - wag * 1.25);
    const tg = ctx.createLinearGradient(0, 0, -34, 0);
    tg.addColorStop(0, '#2B2933');
    tg.addColorStop(0.6, '#18141F');
    tg.addColorStop(1, '#FF4D1A');
    ctx.fillStyle = tg;
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(4, -6);
    ctx.lineTo(-10, -14);
    ctx.lineTo(-14, -10);
    ctx.lineTo(-22, -21);
    ctx.lineTo(-24, -13);
    ctx.lineTo(-34, -22);
    ctx.lineTo(-18, -3);
    ctx.lineTo(-24, 15);
    ctx.lineTo(-13, 10);
    ctx.lineTo(4, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 3. Broad iron-plated pectoral & pelvic dreadnought stabilizer fins
    for (const side of [-1, 1]) {
      // Pectoral wing
      ctx.save();
      const flap = p.fin * 0.28 + Math.sin(this._phase + side) * 0.08;
      ctx.translate(32, side * 23);
      ctx.rotate(side * (0.4 + flap) + bend * 0.2);
      ctx.fillStyle = '#2A2835';
      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(4, side * 22);
      ctx.lineTo(-4, side * 16);
      ctx.lineTo(-12, side * 19);
      ctx.lineTo(-16, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Magma trim on leading edge
      ctx.strokeStyle = `rgba(255, 104, 34, ${0.8 * magma})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(11, side * 2);
      ctx.lineTo(4, side * 20);
      ctx.stroke();
      ctx.restore();

      // Smaller pelvic fin
      ctx.save();
      ctx.translate(-32, side * 14 + bend * 10);
      ctx.rotate(side * 0.55);
      ctx.fillStyle = '#242230';
      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(7, 0);
      ctx.lineTo(-2, side * 11);
      ctx.lineTo(-9, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 4. Four armored snout barbels peeking beneath rostrum
    for (const side of [-1, 1]) {
      for (let b = 0; b < 2; b++) {
        const bx = 76 - b * 6;
        const by = side * (9 + b * 4);
        const sway = Math.sin(t * 5.2 + b + side) * 2.5;
        ctx.strokeStyle = '#140B1C';
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.quadraticCurveTo(bx + 4, by + side * 6 + sway, bx - 2, by + side * 11 + sway);
        ctx.stroke();
      }
    }

    // 5. Blackened iron-armored prehistoric dreadnought body
    const breath = 1 + Math.sin(t * 2.6) * 0.018;
    ctx.save();
    ctx.scale(breath, breath);
    const bodyGrad = ctx.createLinearGradient(96, -24, -76, 24);
    bodyGrad.addColorStop(0, '#4E4B5C');
    bodyGrad.addColorStop(0.35, '#2E2C38');
    bodyGrad.addColorStop(0.75, '#1D1A26');
    bodyGrad.addColorStop(1, '#140B1C');

    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 3.2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(96, 0); // pointed armored rostrum
    ctx.lineTo(82, -11);
    ctx.quadraticCurveTo(56, -25, 22, -26);
    ctx.quadraticCurveTo(-18, -24, -52, -13 + bend * 12);
    ctx.lineTo(-76, -6 + bend * 20);
    ctx.lineTo(-76, 6 + bend * 20);
    ctx.lineTo(-52, 13 + bend * 12);
    ctx.quadraticCurveTo(-18, 24, 22, 26);
    ctx.quadraticCurveTo(56, 25, 82, 11);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Riveted iron armor seam lines
    ctx.strokeStyle = 'rgba(18, 10, 26, 0.72)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(58, -19);
    ctx.quadraticCurveTo(52, 0, 58, 19);
    ctx.moveTo(22, -24);
    ctx.quadraticCurveTo(16, 0, 22, 24);
    ctx.moveTo(-16, -20);
    ctx.quadraticCurveTo(-22, 0, -16, 20);
    ctx.stroke();

    // 6. Three rows of sharp glowing magma scutes (dorsal + left/right lateral armor ridges!)
    // Center dorsal magma scutes
    for (let i = 0; i < 8; i++) {
      const sx0 = 42 - i * 14.5;
      const sy0 = bend * (i * 2.6);
      const sz = 6.2 - i * 0.35;
      ctx.fillStyle = '#241F2E';
      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 1.9;
      ctx.beginPath();
      ctx.moveTo(sx0 + sz, sy0);
      ctx.lineTo(sx0, sy0 - sz * 0.72);
      ctx.lineTo(sx0 - sz * 1.4, sy0);
      ctx.lineTo(sx0, sy0 + sz * 0.72);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Glowing magma core on each scute
      ctx.fillStyle = `rgba(255, 102, 24, ${0.9 * magma})`;
      ctx.beginPath();
      ctx.moveTo(sx0 + sz * 0.45, sy0);
      ctx.lineTo(sx0 - sz * 0.85, sy0);
      ctx.lineTo(sx0, sy0 - sz * 0.32);
      ctx.closePath();
      ctx.fill();
    }

    // Left & right lateral scute rows
    for (const side of [-1, 1]) {
      for (let i = 0; i < 6; i++) {
        const sx0 = 26 - i * 14.5;
        const latY = side * (17.5 - i * 1.8) + bend * (i * 2.2);
        ctx.fillStyle = `rgba(255, 92, 22, ${0.82 * magma})`;
        ctx.strokeStyle = '#140B1C';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(sx0 + 4.2, latY);
        ctx.lineTo(sx0 - 4.8, latY + side * 2.6);
        ctx.lineTo(sx0 - 1.5, latY - side * 2.2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    // Glossy blackened-iron highlight on head shield
    ctx.fillStyle = 'rgba(210, 215, 240, 0.16)';
    ctx.beginPath();
    ctx.ellipse(54, -9, 18, 4.5, -0.22, 0, Math.PI * 2);
    ctx.fill();

    // 7. Snapping armored under-jaw flash (visible on eating / hungry)
    const chomp = this._state === 'eating'
      ? 0.4 + 0.6 * Math.abs(Math.sin(this._stateTime * 18))
      : this._state === 'hungry'
        ? 0.42 + 0.25 * Math.sin(t * 10)
        : p.mouth;
    if (chomp > 0.18 || this._state === 'happy') {
      ctx.fillStyle = '#38091A';
      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.ellipse(86, 0, 5 + chomp * 4, 4.5 + chomp * 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FFF3E6';
      for (const fy of [-3.5, 0, 3.5]) {
        ctx.beginPath();
        ctx.moveTo(86, fy - 1.4);
        ctx.lineTo(92 + chomp * 2, fy);
        ctx.lineTo(86, fy + 1.4);
        ctx.closePath();
        ctx.fill();
      }
    }

    // 8. Expressive Villain Chibi Eyes
    this._drawEyes(ctx, t, magma);

    ctx.restore();
    this._drawMoodFX(ctx, t);
    ctx.restore();
  }

  _drawEyes(ctx, t, magma) {
    const st = this._state;
    for (const side of [-1, 1]) {
      const ex = 62;
      const ey = side * 13.5;

      if (st === 'stress') {
        ctx.strokeStyle = '#FF6A1E';
        ctx.lineWidth = 2.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(ex - 3.8, ey - side * 2.8);
        ctx.lineTo(ex + 3.2, ey);
        ctx.lineTo(ex - 3.8, ey + side * 2.8);
        ctx.stroke();
        continue;
      }

      const r = st === 'shock' ? 6.2 : 5.2;
      ctx.fillStyle = st === 'shock' ? '#FFFFFF' : '#180B20';
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
        ig.addColorStop(0, '#FFF29C');
        ig.addColorStop(0.55, '#FF681E');
        ig.addColorStop(1, '#78100A');
        ctx.fillStyle = ig;
        ctx.beginPath();
        ctx.arc(ex + 0.7, ey, 3.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#140B1C';
        ctx.beginPath();
        ctx.ellipse(ex + 1.1, ey, 1.3, 2.7, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(ex + 2.2, ey - side * 1.2, 1.25, 0, Math.PI * 2);
        ctx.arc(ex - 0.5, ey + side * 1.2, 0.65, 0, Math.PI * 2);
        ctx.fill();
      }

      if (st === 'relax' || st === 'happy') {
        ctx.fillStyle = '#2E2C38';
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
        ctx.strokeStyle = `rgba(255, 104, 30, ${0.75 * magma})`;
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
        const x = 32 + Math.cos(a) * 52;
        const y = Math.sin(a) * 30;
        const s = 3.5 + Math.sin(t * 8 + i) * 1.0;
        ctx.fillStyle = i % 2 === 0 ? '#FF4D1A' : '#A442FF';
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
      ctx.translate(76 + b, -24);
      ctx.fillStyle = '#FF4D1A';
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
        const dx = 54 - i * 24;
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
      ctx.translate(60, -24);
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
      ctx.moveTo(62, 19 + d * 0.4);
      ctx.quadraticCurveTo(65.5, 23 + d * 0.4, 62, 26 + d * 0.4);
      ctx.quadraticCurveTo(58.5, 23 + d * 0.4, 62, 19 + d * 0.4);
      ctx.fill();
      ctx.stroke();
    }
  }
}

export default VillainSturgeonfish;
