/**
 * Villain Peacock Flounder (Bothus lunatus — Volcanic Hypnotic Eyespot Variant)
 * 2D Top-Down Expressive Chibi Villain Fish
 * Dark volcanic-mud flat oval covered in sinister glowing hypnotic crimson-ringed eyespots and two scheming asymmetric villain eyes on top.
 */

const OUTLINE = '#140B1C';
const ONE_SHOT_STATES = new Set(['left_turn', 'right_turn', 'eating', 'shock']);
const LOCKED_STATES = new Set(['shock', 'fear']);
const BLOCKED_WHEN_LOCKED = new Set(['left_turn', 'right_turn', 'relax', 'happy', 'eating']);

const STATE_ALIASES = {
  idle: 'breathing',
  hunger: 'hungry',
};

const VALID_STATES = new Set([
  'breathing',
  'swimming',
  'relax',
  'left_turn',
  'right_turn',
  'eating',
  'hungry',
  'stress',
  'fear',
  'shock',
  'happy',
  'sad',
]);

const POSE_TARGETS = {
  breathing:  { bend: 0,     fringeAmp: 1.8, hypno: 0.55, wagFreq: 2.2,  wagAmp: 0.10 },
  swimming:   { bend: 0,     fringeAmp: 4.8, hypno: 0.85, wagFreq: 6.8,  wagAmp: 0.28 },
  relax:      { bend: 0.04,  fringeAmp: 1.0, hypno: 0.30, wagFreq: 1.3,  wagAmp: 0.05 },
  left_turn:  { bend: -0.52, fringeAmp: 4.2, hypno: 0.78, wagFreq: 5.0,  wagAmp: 0.22 },
  right_turn: { bend: 0.52,  fringeAmp: 4.2, hypno: 0.78, wagFreq: 5.0,  wagAmp: 0.22 },
  eating:     { bend: 0,     fringeAmp: 5.5, hypno: 1.0,  wagFreq: 8.5,  wagAmp: 0.22 },
  hungry:     { bend: 0,     fringeAmp: 4.0, hypno: 0.95, wagFreq: 5.8,  wagAmp: 0.22 },
  stress:     { bend: 0,     fringeAmp: 4.6, hypno: 0.90, wagFreq: 13.5, wagAmp: 0.14 },
  fear:       { bend: 0,     fringeAmp: 5.8, hypno: 0.20, wagFreq: 15.5, wagAmp: 0.18 },
  shock:      { bend: 0,     fringeAmp: 6.2, hypno: 1.0,  wagFreq: 17.5, wagAmp: 0.12 },
  happy:      { bend: 0,     fringeAmp: 3.8, hypno: 0.92, wagFreq: 4.8,  wagAmp: 0.20 },
  sad:        { bend: -0.05, fringeAmp: 0.6, hypno: 0.18, wagFreq: 1.1,  wagAmp: 0.05 },
};

const ONE_SHOT_DURATIONS = {
  left_turn: 0.62,
  right_turn: 0.62,
  eating: 0.55,
  shock: 0.72,
};

function easeCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export class VillainFlounderfish {
  static metadata = {
    name: 'Villain Peacock Flounder',
    category: 'villain_fish',
    baseLength: 105,
    baseWidth: 72,
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

    this._blendDuration = 0.15;
    this._blendElapsed = 0.15;
    this._fromPose = { ...POSE_TARGETS.breathing };
    this._pose = { ...POSE_TARGETS.breathing };
    this._callbacks = new Map();
  }

  setAngle(radians) {
    this.angle = radians;
  }

  setDirection(dx, dy) {
    if (dx !== 0 || dy !== 0) {
      this.angle = Math.atan2(dy, dx);
    }
  }

  getState() {
    return this._state;
  }

  onFinished(name, callback) {
    if (typeof callback !== 'function') return;
    const normalized = STATE_ALIASES[name] || name;
    if (!this._callbacks.has(normalized)) {
      this._callbacks.set(normalized, []);
    }
    this._callbacks.get(normalized).push(callback);
  }

  play(name) {
    const target = STATE_ALIASES[name] || name;
    if (!VALID_STATES.has(target)) return false;

    if (LOCKED_STATES.has(this._state) && BLOCKED_WHEN_LOCKED.has(target)) {
      return false;
    }

    if (target === this._state && !ONE_SHOT_STATES.has(target)) {
      return true;
    }

    if (!ONE_SHOT_STATES.has(this._state)) {
      this._prevState = this._state;
    }

    this._fromPose = { ...this._pose };
    this._state = target;
    this._stateTime = 0;
    this._blendElapsed = 0;
    return true;
  }

  update(dt) {
    const step = Math.max(0, Math.min(dt || 0, 0.1));
    this._time += step;
    this._stateTime += step;

    if (this._blendElapsed < this._blendDuration) {
      this._blendElapsed = Math.min(this._blendDuration, this._blendElapsed + step);
      const t = easeCubic(this._blendElapsed / this._blendDuration);
      const target = POSE_TARGETS[this._state];
      for (const key of Object.keys(this._pose)) {
        this._pose[key] = lerp(this._fromPose[key], target[key], t);
      }
    } else {
      const target = POSE_TARGETS[this._state];
      for (const key of Object.keys(this._pose)) {
        this._pose[key] = target[key];
      }
    }

    if (ONE_SHOT_STATES.has(this._state)) {
      const dur = ONE_SHOT_DURATIONS[this._state];
      if (this._stateTime >= dur) {
        const finished = this._state;
        const returnTo = this._prevState || 'breathing';
        this._fromPose = { ...this._pose };
        this._state = returnTo;
        this._stateTime = 0;
        this._blendElapsed = 0;

        const list = this._callbacks.get(finished);
        if (list && list.length) {
          for (const cb of [...list]) cb(finished);
        }
      }
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    const t = this._time;
    const p = this._pose;
    const st = this._state;

    if (st === 'stress' || st === 'fear' || st === 'shock') {
      const mag = st === 'shock' ? 1.6 : 0.75;
      ctx.translate(Math.sin(t * 56) * mag, Math.cos(t * 62) * mag);
    }

    const wag = Math.sin(t * p.wagFreq) * p.wagAmp;
    const bend = p.bend + wag;

    // 1. Dark Volcanic Miasma Shadow
    this._drawMiasma(ctx, t, p.hypno);

    // 2. Rounded Notched Flatfish Tail Fin
    this._drawTail(ctx, bend);

    // 3. Rippling Continuous Fringe Fin Border
    this._drawFringeBorder(ctx, p.fringeAmp, bend, t);

    // 4. Dark Volcanic-Mud Flat Oval + Sinister Hypnotic Crimson-Ringed Eyespots
    this._drawFlatBody(ctx, bend, p.hypno, t);

    // 5. Two Scheming Asymmetric Villain Eyes on Top
    this._drawAsymmetricEyes(ctx, st, t);

    // 6. Mood FX & Crooked Fanged Smirk
    this._drawMoodFX(ctx, st, t);

    ctx.restore();
  }

  _drawMiasma(ctx, t, hypno) {
    ctx.save();
    const grad = ctx.createRadialGradient(2, 0, 12, 0, 0, 56);
    grad.addColorStop(0, 'rgba(18, 10, 22, 0.54)');
    grad.addColorStop(0.58, `rgba(190, 22, 54, ${0.14 + hypno * 0.14})`);
    grad.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 54 + Math.sin(t * 3) * 2, 38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawTail(ctx, bend) {
    ctx.save();
    ctx.translate(-38, bend * 5);
    ctx.rotate(bend * 0.65);

    const g = ctx.createLinearGradient(0, 0, -16, 0);
    g.addColorStop(0, '#36272E');
    g.addColorStop(0.65, '#592034');
    g.addColorStop(1, '#CC1E3E');

    ctx.fillStyle = g;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.1;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(2, -5.5);
    ctx.quadraticCurveTo(-7, -14, -15, -13);
    ctx.lineTo(-12.5, -6);
    ctx.lineTo(-15.5, -2.5); // notch
    ctx.lineTo(-12, 1.5);
    ctx.lineTo(-15, 13);
    ctx.quadraticCurveTo(-7, 14, 2, 5.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  _drawFringeBorder(ctx, amp, bend, t) {
    ctx.save();
    ctx.fillStyle = '#381C2E';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.0;

    ctx.beginPath();
    const steps = 32;
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      const ripple = Math.sin(t * 7 - cos * 5) * amp * Math.abs(sin);
      const notch = (i % 7 === 0) ? -3.0 : 0;
      const px = cos * 43;
      const py = sin * (34 + ripple + notch) + (cos < 0 ? bend * 4 * -cos : 0);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  _drawFlatBody(ctx, bend, hypno, t) {
    ctx.save();

    const buildOval = () => {
      ctx.beginPath();
      ctx.moveTo(46, 0);
      ctx.bezierCurveTo(42, -19, 20, -30, -4, -27);
      ctx.bezierCurveTo(-24, -24, -34, -12 + bend * 3, -39, -5 + bend * 5);
      ctx.lineTo(-39, 5 + bend * 5);
      ctx.bezierCurveTo(-34, 12 + bend * 3, -24, 24, -4, 27);
      ctx.bezierCurveTo(20, 30, 42, 19, 46, 0);
      ctx.closePath();
    };

    const g = ctx.createRadialGradient(8, -5, 6, 0, 0, 46);
    g.addColorStop(0, '#4F3C3B');
    g.addColorStop(0.55, '#33252A');
    g.addColorStop(0.9, '#1F161E');
    g.addColorStop(1, '#150D17');

    buildOval();
    ctx.fillStyle = g;
    ctx.fill();

    ctx.save();
    buildOval();
    ctx.clip();

    // Sinister Glowing Hypnotic Crimson-Ringed Peacock Eyespots
    const spots = [
      [14, -15, 6.2], [12, 16, 5.8], [-4, -17, 6.5], [-6, 15, 6.0],
      [-20, -10, 5.2], [-22, 10, 5.2], [-2, 0, 7.0], [-28, 0, 4.4],
    ];
    const pulse = 0.65 + 0.35 * Math.sin(t * 4.5);
    for (const [sx, sy, sr] of spots) {
      // Crimson outer aura
      ctx.fillStyle = `rgba(255, 24, 62, ${(0.22 + hypno * 0.25) * pulse})`;
      ctx.beginPath();
      ctx.arc(sx, sy, sr * 1.4, 0, Math.PI * 2);
      ctx.fill();

      // Crimson hypnotic ring
      ctx.fillStyle = '#1E0D26';
      ctx.strokeStyle = '#FF2A55';
      ctx.lineWidth = 1.9;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Inner hypnotic violet-gold core
      ctx.fillStyle = `rgba(255, 166, 48, ${0.6 + hypno * 0.35})`;
      ctx.beginPath();
      ctx.arc(sx, sy, sr * 0.38, 0, Math.PI * 2);
      ctx.fill();
    }

    // Glossy mud-sheen highlight
    ctx.fillStyle = 'rgba(230, 190, 200, 0.16)';
    ctx.beginPath();
    ctx.ellipse(16, -9, 15, 4.8, -0.1, 0, Math.PI * 2);
    ctx.fill();

    // Battle scar across flank
    ctx.strokeStyle = '#FFB0C2';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(4, -22);
    ctx.lineTo(12, -16);
    ctx.stroke();

    ctx.restore();

    buildOval();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
  }

  _drawAsymmetricEyes(ctx, st, t) {
    // Iconic flatfish: two scheming asymmetric villain eyes clustered on the top-right/top-left dorsal side!
    const eyeSpecs = [
      { x: 32, y: -7.5, r: 4.8, tilt: -0.25 },
      { x: 24, y:  3.8, r: 4.3, tilt:  0.22 },
    ];

    for (let i = 0; i < eyeSpecs.length; i++) {
      const e = eyeSpecs[i];
      ctx.save();
      ctx.translate(e.x, e.y);

      if (st === 'stress') {
        ctx.strokeStyle = '#FF385C';
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-2.8, -2.2);
        ctx.lineTo(2.0, 0);
        ctx.lineTo(-2.8, 2.2);
        ctx.stroke();
        ctx.restore();
        continue;
      }

      const r = st === 'shock' ? e.r + 1.1 : e.r;
      ctx.fillStyle = st === 'shock' ? '#FFF6F0' : '#180B21';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.9;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (st === 'shock') {
        ctx.fillStyle = '#140B1C';
        ctx.beginPath();
        ctx.arc(0.8, 0, 1.4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = st === 'hungry' ? '#FF143C' : '#FFB81C';
        ctx.beginPath();
        ctx.arc(0.5, 0, r * 0.72, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#140B1C';
        ctx.beginPath();
        ctx.ellipse(0.7, 0, 0.85, r * 0.58, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(1.5, -1.1, 1.0, 0, Math.PI * 2);
        ctx.arc(-0.6, 1.1, 0.5, 0, Math.PI * 2);
        ctx.fill();

        if (st === 'relax' || st === 'happy') {
          ctx.fillStyle = '#33252A';
          ctx.beginPath();
          ctx.arc(0, 0, r + 0.2, Math.PI * 0.95, Math.PI * 2.05);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Asymmetric scheming V-brows
      const side = i === 0 ? -1 : 1;
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (st === 'sad' || st === 'fear') {
        ctx.moveTo(-3.2, side * 4.5);
        ctx.lineTo(3.4, side * 2.4);
      } else {
        ctx.moveTo(-3.2, side * 2.2);
        ctx.lineTo(3.6, side * 5.0);
      }
      ctx.stroke();

      ctx.restore();
    }
  }

  _drawMoodFX(ctx, st, t) {
    ctx.save();
    if (st === 'eating' || st === 'hungry') {
      const snap = Math.abs(Math.sin(t * 22));
      ctx.fillStyle = '#FFF5EE';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.2;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(44, side * (3.5 + snap));
        ctx.lineTo(50 + snap * 1.5, side * 1.5);
        ctx.lineTo(44, side * 0.8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    if (st === 'happy') {
      for (let i = 0; i < 3; i++) {
        const a = t * 2.7 + i * 2.1;
        const sx = 22 + Math.cos(a) * 24;
        const sy = Math.sin(a) * 24;
        const s = 2.6 + Math.sin(t * 8 + i) * 0.8;
        ctx.fillStyle = i % 2 === 0 ? '#FF2A55' : '#C084FC';
        ctx.beginPath();
        ctx.moveTo(sx, sy - s);
        ctx.lineTo(sx + s * 0.35, sy - s * 0.35);
        ctx.lineTo(sx + s, sy);
        ctx.lineTo(sx + s * 0.35, sy + s * 0.35);
        ctx.lineTo(sx, sy + s);
        ctx.lineTo(sx - s * 0.35, sy + s * 0.35);
        ctx.lineTo(sx - s, sy);
        ctx.lineTo(sx - s * 0.35, sy - s * 0.35);
        ctx.closePath();
        ctx.fill();
      }
    } else if (st === 'shock') {
      const b = Math.abs(Math.sin(t * 16)) * 2.8;
      ctx.fillStyle = '#FF2A55';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.7;
      ctx.beginPath();
      ctx.roundRect(32, -28 - b, 3.8, 9.5, 1.6);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(33.9, -15.5 - b, 2.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (st === 'fear') {
      const drop = (t * 20) % 10;
      ctx.fillStyle = '#7CE8FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(24, -24 - drop * 0.3);
      ctx.quadraticCurveTo(28, -19.5, 24, -18);
      ctx.quadraticCurveTo(20, -19.5, 24, -24 - drop * 0.3);
      ctx.fill();
      ctx.stroke();
    } else if (st === 'stress') {
      const sc = 1 + Math.sin(t * 24) * 0.16;
      ctx.save();
      ctx.translate(22, -21);
      ctx.scale(sc, sc);
      ctx.strokeStyle = '#FF2A4B';
      ctx.lineWidth = 2.0;
      ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(1.3, 1.3);
        ctx.quadraticCurveTo(2.6, 2.6, 4.6, 1.6);
        ctx.stroke();
      }
      ctx.restore();
    } else if (st === 'sad') {
      const fall = (t * 8) % 6;
      ctx.fillStyle = '#60C5FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(24, 11 + fall * 0.4);
      ctx.quadraticCurveTo(26.5, 14 + fall * 0.4, 24, 15.5 + fall * 0.4);
      ctx.quadraticCurveTo(21.5, 14 + fall * 0.4, 24, 11 + fall * 0.4);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
}

export default VillainFlounderfish;
