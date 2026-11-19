/**
 * Villain Red-Bellied Piranha — 2D Top-Down Expressive Chibi Villain Fish
 * Charcoal-iron bulldog menace with blazing magma-red flanks, oversized
 * jagged steel-trap teeth, and fierce scarred brow.
 */

const VALID_STATES = new Set([
  'breathing', 'swimming', 'relax', 'left_turn', 'right_turn',
  'eating', 'hungry', 'stress', 'fear', 'shock', 'happy', 'sad'
]);
const ONE_SHOTS = new Set(['left_turn', 'right_turn', 'eating', 'shock']);
const LOCKED = new Set(['shock', 'fear']);
const BLOCKED = new Set(['left_turn', 'right_turn', 'relax', 'happy', 'eating']);
const ALIASES = { idle: 'breathing', hunger: 'hungry' };
const ONE_SHOT_DUR = { left_turn: 0.52, right_turn: 0.52, eating: 0.58, shock: 0.7 };

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
      return { freq: 8.2, amp: 0.26, bend: 0, jaw: 0.25, heat: 1.0, fin: 0.35, shake: 0 };
    case 'relax':
      return { freq: 2.0, amp: 0.06, bend: 0, jaw: 0.1, heat: 0.58, fin: 0.1, shake: 0 };
    case 'left_turn':
      return { freq: 6.8, amp: 0.19, bend: -0.4, jaw: 0.28, heat: 1.08, fin: 0.48, shake: 0 };
    case 'right_turn':
      return { freq: 6.8, amp: 0.19, bend: 0.4, jaw: 0.28, heat: 1.08, fin: 0.48, shake: 0 };
    case 'eating':
      return { freq: 6.4, amp: 0.16, bend: 0, jaw: 1.0, heat: 1.38, fin: 0.62, shake: 0.03 };
    case 'hungry':
      return { freq: 6.0, amp: 0.2, bend: 0, jaw: 0.72, heat: 1.32, fin: 0.5, shake: 0.02 };
    case 'stress':
      return { freq: 10.2, amp: 0.12, bend: 0, jaw: 0.42, heat: 1.4, fin: 0.7, shake: 0.065 };
    case 'fear':
      return { freq: 11.8, amp: 0.15, bend: 0, jaw: 0.52, heat: 0.5, fin: 0.8, shake: 0.09 };
    case 'shock':
      return { freq: 13.4, amp: 0.09, bend: 0, jaw: 0.88, heat: 1.48, fin: 0.92, shake: 0.11 };
    case 'happy':
      return { freq: 4.5, amp: 0.14, bend: 0.05, jaw: 0.36, heat: 1.15, fin: 0.38, shake: 0 };
    case 'sad':
      return { freq: 1.6, amp: 0.04, bend: -0.05, jaw: 0.05, heat: 0.36, fin: -0.18, shake: 0 };
    case 'breathing':
    default:
      return { freq: 2.9, amp: 0.09, bend: 0, jaw: 0.18, heat: 0.85, fin: 0.18, shake: 0 };
  }
}

export class VillainPiranhafish {
  static metadata = {
    name: 'Villain Red-Bellied Piranha',
    category: 'villain_fish',
    baseLength: 75,
    baseWidth: 44
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
      const dur = ONE_SHOT_DUR[this._state] || 0.56;
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
    const heat = (0.74 + 0.26 * Math.sin(t * 5.6)) * p.heat;
    const sx = p.shake ? Math.sin(t * 64) * p.shake * 20 : 0;
    const sy = p.shake ? Math.cos(t * 68) * p.shake * 20 : 0;

    ctx.save();
    ctx.translate(this.x + sx, this.y + sy);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Magma-red frenzy shadow aura
    const aura = ctx.createRadialGradient(-2, 0, 5, -2, 0, 44);
    aura.addColorStop(0, `rgba(18, 6, 18, ${0.54 * Math.min(1.2, p.heat)})`);
    aura.addColorStop(0.55, `rgba(255, 42, 24, ${0.25 * heat})`);
    aura.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.ellipse(-2, 0, 44, 30, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Jagged V-forked tail fin
    ctx.save();
    ctx.translate(-26, bend * 10);
    ctx.rotate(-bend * 0.8 - wag * 1.25);
    const tg = ctx.createLinearGradient(0, 0, -16, 0);
    tg.addColorStop(0, '#2B2833');
    tg.addColorStop(0.6, '#A8101E');
    tg.addColorStop(1, '#1A1120');
    ctx.fillStyle = tg;
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(4, -5);
    ctx.lineTo(-15, -14);
    ctx.lineTo(-9, -3);
    ctx.lineTo(-13, 0);
    ctx.lineTo(-9, 3);
    ctx.lineTo(-15, 14);
    ctx.lineTo(4, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 3. Sharp crimson-edged pectoral fins
    for (const side of [-1, 1]) {
      ctx.save();
      const flap = p.fin * 0.32 + Math.sin(this._phase * 1.3 + side) * 0.14;
      ctx.translate(4, side * 17);
      ctx.rotate(side * (0.42 + flap) + bend * 0.22);
      ctx.fillStyle = '#B81822';
      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 2.1;
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.lineTo(1, side * 12);
      ctx.lineTo(-4, side * 9);
      ctx.lineTo(-9, side * 12);
      ctx.lineTo(-9, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 4. Chunky front-heavy charcoal-iron bulldog body with blazing magma-red flanks
    const breath = 1 + Math.sin(t * 3.4) * 0.024;
    ctx.save();
    ctx.scale(breath, breath);
    const bodyGrad = ctx.createRadialGradient(8, -4, 4, 0, 0, 38);
    bodyGrad.addColorStop(0, '#4E4B59');
    bodyGrad.addColorStop(0.48, '#2C2836');
    bodyGrad.addColorStop(0.82, '#1A1522');
    bodyGrad.addColorStop(1, '#140B1C');

    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 3.0;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(33, 0);
    ctx.quadraticCurveTo(32, -17, 14, -21);
    ctx.quadraticCurveTo(-6, -21, -18, -11);
    ctx.lineTo(-27, -5 + bend * 9);
    ctx.lineTo(-27, 5 + bend * 9);
    ctx.lineTo(-18, 11);
    ctx.quadraticCurveTo(-6, 21, 14, 21);
    ctx.quadraticCurveTo(32, 17, 33, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Blazing magma-red flank blazes (iconic Red-Bellied Piranha crimson sides)
    for (const side of [-1, 1]) {
      const fg = ctx.createLinearGradient(22, side * 10, -14, side * 19);
      fg.addColorStop(0, `rgba(255, 62, 24, ${0.9 * Math.min(1.1, heat)})`);
      fg.addColorStop(0.6, '#C41022');
      fg.addColorStop(1, 'rgba(64, 8, 22, 0.3)');
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.moveTo(24, side * 12);
      ctx.quadraticCurveTo(6, side * 20, -16, side * 10);
      ctx.quadraticCurveTo(4, side * 13, 24, side * 12);
      ctx.closePath();
      ctx.fill();
    }

    // Metallic iron speckle sheen
    ctx.fillStyle = 'rgba(210, 220, 240, 0.2)';
    ctx.beginPath();
    ctx.ellipse(12, -8, 10, 4, -0.25, 0, Math.PI * 2);
    ctx.fill();

    // Scar across fierce brow
    ctx.strokeStyle = '#FF9C8A';
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.moveTo(22, -13);
    ctx.lineTo(14, -5);
    ctx.stroke();

    // 5. Oversized jagged steel-trap piranha jaw & razor teeth!
    const snap = this._state === 'eating'
      ? 0.35 + 0.65 * Math.abs(Math.sin(this._stateTime * 22))
      : this._state === 'hungry'
        ? 0.55 + 0.3 * Math.sin(t * 13)
        : p.jaw;

    ctx.save();
    ctx.translate(31, 0);
    const jawW = 7 + snap * 5.5;
    const jawH = 9 + snap * 5.5;

    // Steel-trap lower bulldog jaw rim
    ctx.fillStyle = '#380512';
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-4, -jawH);
    ctx.quadraticCurveTo(jawW, -jawH * 0.55, jawW + 1, 0);
    ctx.quadraticCurveTo(jawW, jawH * 0.55, -4, jawH);
    ctx.quadraticCurveTo(-7, 0, -4, -jawH);
    ctx.fill();
    ctx.stroke();

    // Oversized razor-sharp interlocking steel-trap teeth
    const teethY = [-jawH * 0.65, -jawH * 0.32, 0, jawH * 0.32, jawH * 0.65];
    for (let i = 0; i < teethY.length; i++) {
      const ty = teethY[i];
      const len = (i % 2 === 0 ? 5.2 : 3.8) + snap * 1.8;
      ctx.fillStyle = '#F7FBFF';
      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-2.5, ty - 2.0);
      ctx.lineTo(len, ty);
      ctx.lineTo(-2.5, ty + 2.0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    // 6. Expressive Blazing Villain Eyes
    this._drawEyes(ctx, t, heat);

    ctx.restore();
    this._drawMoodFX(ctx, t);
    ctx.restore();
  }

  _drawEyes(ctx, t, heat) {
    const st = this._state;
    for (const side of [-1, 1]) {
      const ex = 15;
      const ey = side * 11.2;

      if (st === 'stress') {
        ctx.strokeStyle = '#FF3824';
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
      ctx.fillStyle = st === 'shock' ? '#FFFFFF' : '#1E050E';
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
        ig.addColorStop(0, '#FFF599');
        ig.addColorStop(0.55, '#FF321E');
        ig.addColorStop(1, '#780412');
        ctx.fillStyle = ig;
        ctx.beginPath();
        ctx.arc(ex + 0.7, ey, 3.7, 0, Math.PI * 2);
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
        ctx.fillStyle = '#332F3D';
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
        ctx.strokeStyle = `rgba(255, 50, 30, ${0.78 * heat})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(ex, ey, r + 2.0 + Math.sin(t * 16) * 0.7, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  _drawMoodFX(ctx, t) {
    const st = this._state;
    if (st === 'happy') {
      for (let i = 0; i < 4; i++) {
        const a = t * 2.8 + i * 1.57;
        const x = 6 + Math.cos(a) * 30;
        const y = Math.sin(a) * 24;
        const s = 3.0 + Math.sin(t * 8 + i) * 1.0;
        ctx.fillStyle = i % 2 === 0 ? '#FF2E38' : '#A442FF';
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
      ctx.translate(28 + b, -20);
      ctx.fillStyle = '#FF321E';
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
        const dx = 12 - i * 14;
        const dy = (i === 0 ? -24 : 24) + (i === 0 ? -d * 0.35 : d * 0.35);
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
      ctx.translate(16, -20);
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
      ctx.moveTo(15, 16 + d * 0.4);
      ctx.quadraticCurveTo(18.5, 20 + d * 0.4, 15, 23 + d * 0.4);
      ctx.quadraticCurveTo(11.5, 20 + d * 0.4, 15, 16 + d * 0.4);
      ctx.fill();
      ctx.stroke();
    }
  }
}

export default VillainPiranhafish;
