/**
 * Villain Tassled Scorpionfish — 2D Top-Down Expressive Chibi Villain Fish
 * Blood-crimson & pitch-black spiky menace with jagged shadow tassels
 * and venomous glowing-tipped fan plumes.
 */

const VALID_STATES = new Set([
  'breathing', 'swimming', 'relax', 'left_turn', 'right_turn',
  'eating', 'hungry', 'stress', 'fear', 'shock', 'happy', 'sad'
]);
const ONE_SHOT_STATES = new Set(['left_turn', 'right_turn', 'eating', 'shock']);
const LOCKED_STATES = new Set(['shock', 'fear']);
const BLOCKED_IN_LOCKED = new Set(['left_turn', 'right_turn', 'relax', 'happy', 'eating']);

const ALIASES = { idle: 'breathing', hunger: 'hungry' };
const DURATIONS = { left_turn: 0.56, right_turn: 0.56, eating: 0.62, shock: 0.7 };

function easeCubic(t) {
  const c = Math.max(0, Math.min(1, t));
  return 1 - Math.pow(1 - c, 3);
}

function mix(a, b, t) {
  return a + (b - a) * t;
}

function poseFor(state) {
  switch (state) {
    case 'swimming':
      return { freq: 6.8, amp: 0.24, bend: 0, plumeSpread: 0.3, mouth: 0.14, aura: 0.9, jitter: 0 };
    case 'relax':
      return { freq: 1.8, amp: 0.06, bend: 0, plumeSpread: 0.1, mouth: 0.05, aura: 0.55, jitter: 0 };
    case 'left_turn':
      return { freq: 5.8, amp: 0.18, bend: -0.38, plumeSpread: 0.48, mouth: 0.16, aura: 0.95, jitter: 0 };
    case 'right_turn':
      return { freq: 5.8, amp: 0.18, bend: 0.38, plumeSpread: 0.48, mouth: 0.16, aura: 0.95, jitter: 0 };
    case 'eating':
      return { freq: 5.4, amp: 0.14, bend: 0, plumeSpread: 0.62, mouth: 0.96, aura: 1.2, jitter: 0.02 };
    case 'hungry':
      return { freq: 5.0, amp: 0.17, bend: 0, plumeSpread: 0.5, mouth: 0.55, aura: 1.18, jitter: 0.015 };
    case 'stress':
      return { freq: 9.2, amp: 0.12, bend: 0, plumeSpread: 0.76, mouth: 0.3, aura: 1.28, jitter: 0.06 };
    case 'fear':
      return { freq: 11.0, amp: 0.15, bend: 0, plumeSpread: 0.85, mouth: 0.48, aura: 0.45, jitter: 0.085 };
    case 'shock':
      return { freq: 12.5, amp: 0.09, bend: 0, plumeSpread: 0.95, mouth: 0.82, aura: 1.35, jitter: 0.1 };
    case 'happy':
      return { freq: 3.9, amp: 0.13, bend: 0.06, plumeSpread: 0.4, mouth: 0.25, aura: 1.05, jitter: 0 };
    case 'sad':
      return { freq: 1.5, amp: 0.04, bend: -0.05, plumeSpread: -0.22, mouth: 0.02, aura: 0.35, jitter: 0 };
    case 'breathing':
    default:
      return { freq: 2.5, amp: 0.08, bend: 0, plumeSpread: 0.2, mouth: 0.08, aura: 0.78, jitter: 0 };
  }
}

export class VillainScorpionfish {
  static metadata = {
    name: 'Villain Tassled Scorpionfish',
    category: 'villain_fish',
    baseLength: 105,
    baseWidth: 74
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
    this._blendTime = 0.15;
    this._from = poseFor('breathing');
    this._to = poseFor('breathing');
    this._pose = { ...this._to };
    this._callbacks = new Map();
  }

  play(name) {
    const next = ALIASES[name] || name;
    if (!VALID_STATES.has(next)) return this;
    if (LOCKED_STATES.has(this._state) && BLOCKED_IN_LOCKED.has(next)) return this;
    if (next === this._state && !ONE_SHOT_STATES.has(next)) return this;

    if (!ONE_SHOT_STATES.has(this._state)) {
      this._prevState = this._state;
    }
    this._from = { ...this._pose };
    this._to = poseFor(next);
    this._blendTime = 0;
    this._state = next;
    this._stateTime = 0;
    return this;
  }

  update(dt) {
    if (!Number.isFinite(dt) || dt <= 0) return;
    const step = Math.min(dt, 0.1);
    this._time += step;
    this._stateTime += step;

    if (this._blendTime < this._blendDur) {
      this._blendTime = Math.min(this._blendDur, this._blendTime + step);
      const t = easeCubic(this._blendTime / this._blendDur);
      for (const k of Object.keys(this._pose)) {
        this._pose[k] = mix(this._from[k], this._to[k], t);
      }
    } else {
      for (const k of Object.keys(this._pose)) {
        this._pose[k] = this._to[k];
      }
    }

    this._phase += step * this._pose.freq;

    if (ONE_SHOT_STATES.has(this._state)) {
      const limit = DURATIONS[this._state] || 0.6;
      if (this._stateTime >= limit) {
        const done = this._state;
        const back = this._prevState || 'breathing';
        this._from = { ...this._pose };
        this._to = poseFor(back);
        this._blendTime = 0;
        this._state = back;
        this._stateTime = 0;
        this._fire(done);
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
    if (!this._callbacks.has(key)) this._callbacks.set(key, []);
    this._callbacks.get(key).push(callback);
    return this;
  }

  _fire(name) {
    const arr = this._callbacks.get(name);
    if (!arr) return;
    for (const fn of arr.slice()) fn(name, this);
  }

  draw(ctx) {
    if (!ctx) return;
    const p = this._pose;
    const t = this._time;
    const wag = Math.sin(this._phase) * p.amp;
    const bend = p.bend + wag * 0.35;
    const pulse = 0.74 + 0.26 * Math.sin(t * 4.6);
    const jx = p.jitter ? Math.sin(t * 60) * p.jitter * 24 : 0;
    const jy = p.jitter ? Math.cos(t * 67) * p.jitter * 24 : 0;

    ctx.save();
    ctx.translate(this.x + jx, this.y + jy);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Dark crimson-violet shadow miasma
    const miasma = ctx.createRadialGradient(-2, 0, 10, -2, 0, 62);
    miasma.addColorStop(0, `rgba(18, 6, 22, ${0.55 * Math.min(1.2, p.aura)})`);
    miasma.addColorStop(0.55, `rgba(196, 18, 52, ${0.24 * pulse * p.aura})`);
    miasma.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = miasma;
    ctx.beginPath();
    ctx.ellipse(-2, 0, 60, 44, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Jagged crimson-black venomous fan plumes (massive pectoral wings)
    for (const side of [-1, 1]) {
      ctx.save();
      const spread = 0.22 + p.plumeSpread * 0.36 + Math.sin(this._phase + side * 0.9) * 0.08;
      ctx.translate(8, side * 16);
      ctx.rotate(side * spread + bend * 0.25);

      const rays = 6;
      // Webbed dark membrane behind venom spines
      const webGrad = ctx.createLinearGradient(0, 0, -10, side * 34);
      webGrad.addColorStop(0, '#4E0C1D');
      webGrad.addColorStop(0.6, '#1C0D1D');
      webGrad.addColorStop(1, '#9E1130');
      ctx.fillStyle = webGrad;
      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(12, 0);
      for (let r = 0; r < rays; r++) {
        const frac = r / (rays - 1);
        const rx = 14 - frac * 30;
        const ry = side * (22 + Math.sin(frac * Math.PI) * 14);
        ctx.lineTo(rx, ry);
        if (r < rays - 1) {
          const mx = rx - 2.8;
          const my = ry * 0.72; // deep ragged notch
          ctx.lineTo(mx, my);
        }
      }
      ctx.lineTo(-16, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Venomous glowing-tipped spines protruding beyond membrane
      for (let r = 0; r < rays; r++) {
        const frac = r / (rays - 1);
        const rx = 14 - frac * 30;
        const ry = side * (25 + Math.sin(frac * Math.PI) * 15);
        ctx.strokeStyle = '#140B1C';
        ctx.lineWidth = 2.1;
        ctx.beginPath();
        ctx.moveTo(8 - frac * 20, side * 2);
        ctx.lineTo(rx, ry);
        ctx.stroke();

        // Neon crimson-violet venom bead at tip
        ctx.fillStyle = r % 2 === 0 ? '#FF2E63' : '#C84BFF';
        ctx.beginPath();
        ctx.arc(rx, ry, 2.3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 3. Tattered spiked scorpion tail fin
    ctx.save();
    ctx.translate(-38, bend * 16);
    ctx.rotate(-bend * 0.8 - wag * 1.2);
    const tailGrad = ctx.createLinearGradient(0, 0, -22, 0);
    tailGrad.addColorStop(0, '#6B0D22');
    tailGrad.addColorStop(0.55, '#1B0D1E');
    tailGrad.addColorStop(1, '#CC183C');
    ctx.fillStyle = tailGrad;
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(4, -6);
    ctx.lineTo(-18, -16);
    ctx.lineTo(-11, -7);
    ctx.lineTo(-22, -2);
    ctx.lineTo(-13, 3);
    ctx.lineTo(-20, 14);
    ctx.lineTo(-9, 10);
    ctx.lineTo(4, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing tail spine tips
    ctx.fillStyle = '#FF3868';
    ctx.beginPath();
    ctx.arc(-18, -16, 2.1, 0, Math.PI * 2);
    ctx.arc(-22, -2, 2.1, 0, Math.PI * 2);
    ctx.arc(-20, 14, 2.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 4. Jagged shadow tassels trailing around cheeks and flanks
    for (const side of [-1, 1]) {
      const tasselPositions = [
        { x: 34, y: side * 14, len: 11, ang: side * 0.65 },
        { x: 24, y: side * 21, len: 13, ang: side * 1.05 },
        { x: -16, y: side * 16, len: 10, ang: side * 2.1 }
      ];
      for (let i = 0; i < tasselPositions.length; i++) {
        const tp = tasselPositions[i];
        const sway = Math.sin(t * 4.5 + i * 1.4 + side) * 0.18;
        ctx.save();
        ctx.translate(tp.x, tp.y);
        ctx.rotate(tp.ang + sway);
        ctx.fillStyle = '#1A0C20';
        ctx.strokeStyle = '#140B1C';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(0, -2.5);
        ctx.quadraticCurveTo(tp.len * 0.6, -4, tp.len, 0);
        ctx.quadraticCurveTo(tp.len * 0.5, 4, 0, 2.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    }

    // 5. Chunky spiky chibi body (blood-crimson & pitch-black armor bands)
    const breath = 1 + Math.sin(t * 3.1) * 0.024;
    ctx.save();
    ctx.scale(breath, breath);
    const bodyGrad = ctx.createRadialGradient(14, -4, 4, 0, 0, 52);
    bodyGrad.addColorStop(0, '#C91839');
    bodyGrad.addColorStop(0.42, '#7D0E26');
    bodyGrad.addColorStop(0.8, '#280D1F');
    bodyGrad.addColorStop(1, '#140B1C');

    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 3.2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(46, 0);
    ctx.quadraticCurveTo(44, -18, 25, -24);
    ctx.quadraticCurveTo(6, -26, -12, -19);
    ctx.quadraticCurveTo(-28, -14, -40, -7 + bend * 12);
    ctx.lineTo(-40, 7 + bend * 12);
    ctx.quadraticCurveTo(-28, 14, -12, 19);
    ctx.quadraticCurveTo(6, 26, 25, 24);
    ctx.quadraticCurveTo(44, 18, 46, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Pitch-black war-paint saddle bands
    ctx.fillStyle = 'rgba(18, 8, 24, 0.72)';
    ctx.beginPath();
    ctx.moveTo(14, -24);
    ctx.quadraticCurveTo(4, -6, 12, 24);
    ctx.lineTo(-2, 21);
    ctx.quadraticCurveTo(-10, -4, -1, -22);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-16, -17);
    ctx.quadraticCurveTo(-22, 0, -16, 17);
    ctx.lineTo(-28, 13);
    ctx.quadraticCurveTo(-32, 0, -28, -13);
    ctx.closePath();
    ctx.fill();

    // Glowing crimson runes etched on head plate
    ctx.strokeStyle = `rgba(255, 72, 118, ${0.8 * pulse})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(32, -5);
    ctx.lineTo(26, 0);
    ctx.lineTo(32, 5);
    ctx.moveTo(23, -6);
    ctx.lineTo(18, 0);
    ctx.lineTo(23, 6);
    ctx.stroke();

    // Glossy chibi highlight on forehead
    ctx.fillStyle = 'rgba(255, 168, 188, 0.24)';
    ctx.beginPath();
    ctx.ellipse(22, -10, 12, 5, -0.25, 0, Math.PI * 2);
    ctx.fill();

    // 6. Dorsal venom crest spines running down center
    for (let i = 0; i < 6; i++) {
      const sx = 12 - i * 8.5;
      const sy = bend * (i * 2.4);
      ctx.fillStyle = i % 2 === 0 ? '#180B20' : '#8F0F2B';
      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 1.9;
      ctx.beginPath();
      ctx.moveTo(sx + 5, sy - 3);
      ctx.lineTo(sx - 9, sy);
      ctx.lineTo(sx + 5, sy + 3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FF3864';
      ctx.beginPath();
      ctx.arc(sx - 8, sy, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // 7. Snapping villain mouth with sharp needle fangs
    const snap = this._state === 'eating'
      ? 0.4 + 0.6 * Math.abs(Math.sin(this._stateTime * 19))
      : this._state === 'hungry'
        ? 0.42 + 0.22 * Math.sin(t * 10)
        : p.mouth;

    ctx.save();
    ctx.translate(44, 0);
    if (snap > 0.14 || this._state === 'happy') {
      const mh = 5 + snap * 8.5;
      ctx.fillStyle = '#330514';
      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(-4, -mh * 0.72);
      ctx.quadraticCurveTo(5 + snap * 3.5, 0, -4, mh * 0.72);
      ctx.quadraticCurveTo(-7, 0, -4, -mh * 0.72);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FFF4F6';
      ctx.lineWidth = 1.1;
      for (const fy of [-mh * 0.42, 0, mh * 0.42]) {
        ctx.beginPath();
        ctx.moveTo(-3.2, fy - 1.8);
        ctx.lineTo(2.8 + snap * 1.6, fy);
        ctx.lineTo(-3.2, fy + 1.8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    } else {
      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 2.3;
      ctx.beginPath();
      ctx.moveTo(-2, -8);
      ctx.quadraticCurveTo(2, 0, -2, 8);
      ctx.stroke();
    }
    ctx.restore();

    // 8. Expressive villain eyes + horned brow ridges
    this._drawEyes(ctx, t, pulse);

    ctx.restore();

    // 9. Mood FX
    this._drawMoodFX(ctx, t);

    ctx.restore();
  }

  _drawEyes(ctx, t, pulse) {
    const st = this._state;
    for (const side of [-1, 1]) {
      const ex = 28;
      const ey = side * 12.5;

      // Spiky supraorbital horn beside eye
      ctx.fillStyle = '#2B0B1E';
      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(ex - 4, ey + side * 5);
      ctx.lineTo(ex - 9, ey + side * 11);
      ctx.lineTo(ex + 2, ey + side * 7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      if (st === 'stress') {
        ctx.strokeStyle = '#FF3864';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(ex - 3.8, ey - side * 3);
        ctx.lineTo(ex + 3.2, ey);
        ctx.lineTo(ex - 3.8, ey + side * 3);
        ctx.stroke();
        continue;
      }

      const r = st === 'shock' ? 6.2 : 5.2;
      ctx.fillStyle = st === 'shock' ? '#FFF8FA' : '#1E0614';
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
        // Toxic-gold / crimson glowing iris
        const ig = ctx.createRadialGradient(ex + 0.8, ey, 0.5, ex, ey, 3.8);
        ig.addColorStop(0, '#FFF599');
        ig.addColorStop(0.55, '#FF365E');
        ig.addColorStop(1, '#7A0622');
        ctx.fillStyle = ig;
        ctx.beginPath();
        ctx.arc(ex + 0.8, ey, 3.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#140B1C';
        ctx.beginPath();
        ctx.ellipse(ex + 1.2, ey, 1.3, 2.8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Dual catchlights
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(ex + 2.3, ey - side * 1.3, 1.25, 0, Math.PI * 2);
        ctx.arc(ex - 0.5, ey + side * 1.3, 0.7, 0, Math.PI * 2);
        ctx.fill();
      }

      if (st === 'relax' || st === 'happy') {
        ctx.fillStyle = '#4E0C1D';
        ctx.beginPath();
        ctx.arc(ex, ey, r + 0.4, -Math.PI * 0.85, Math.PI * 0.15);
        ctx.closePath();
        ctx.fill();
      }

      // Angled V-shaped villain brow
      ctx.strokeStyle = '#140B1C';
      ctx.lineWidth = 2.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (st === 'sad' || st === 'fear') {
        ctx.moveTo(ex - 4, ey + side * 3.8);
        ctx.lineTo(ex + 4.4, ey + side * 6);
      } else if (st === 'shock') {
        ctx.moveTo(ex - 3, ey + side * 6.8);
        ctx.lineTo(ex + 4, ey + side * 6.8);
      } else {
        ctx.moveTo(ex + 4.8, ey - side * 2);
        ctx.lineTo(ex - 4.2, ey + side * 5.2);
      }
      ctx.stroke();

      if (st === 'hungry') {
        ctx.strokeStyle = `rgba(255, 56, 98, ${0.7 * pulse})`;
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
        const a = t * 2.5 + i * 1.57;
        const x = 14 + Math.cos(a) * 38;
        const y = Math.sin(a) * 32;
        const s = 3.4 + Math.sin(t * 8 + i) * 1.0;
        ctx.fillStyle = i % 2 === 0 ? '#FF2E63' : '#B347FF';
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
      ctx.translate(40 + b, -25);
      ctx.fillStyle = '#FF2E54';
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
      ctx.translate(28, -24);
      ctx.scale(s, s);
      ctx.strokeStyle = '#FF2952';
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
      ctx.moveTo(26, 18 + d * 0.4);
      ctx.quadraticCurveTo(29.5, 22 + d * 0.4, 26, 25 + d * 0.4);
      ctx.quadraticCurveTo(22.5, 22 + d * 0.4, 26, 18 + d * 0.4);
      ctx.fill();
      ctx.stroke();
    }
  }
}

export default VillainScorpionfish;
