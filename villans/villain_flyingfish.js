/**
 * Villain Atlantic Flying Fish (Cheilopogon melanurus — Stealth Midnight-Cobalt Bat-Glider Variant)
 * 2D Top-Down Expressive Chibi Villain Fish
 * Stealth midnight-cobalt torpedo with enormous tattered dark-crimson & shadow-violet bat-like glider wings.
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
  breathing:  { bend: 0,     wingSpread: 0.45, jaw: 0.05, wagFreq: 2.4,  wagAmp: 0.10 },
  swimming:   { bend: 0,     wingSpread: 0.95, jaw: 0.10, wagFreq: 8.2,  wagAmp: 0.30 },
  relax:      { bend: 0.05,  wingSpread: 0.25, jaw: 0.0,  wagFreq: 1.4,  wagAmp: 0.06 },
  left_turn:  { bend: -0.58, wingSpread: 0.90, jaw: 0.10, wagFreq: 5.8,  wagAmp: 0.22 },
  right_turn: { bend: 0.58,  wingSpread: 0.90, jaw: 0.10, wagFreq: 5.8,  wagAmp: 0.22 },
  eating:     { bend: 0,     wingSpread: 1.0,  jaw: 1.0,  wagFreq: 9.5,  wagAmp: 0.22 },
  hungry:     { bend: 0,     wingSpread: 0.85, jaw: 0.52, wagFreq: 6.5,  wagAmp: 0.24 },
  stress:     { bend: 0,     wingSpread: 0.88, jaw: 0.28, wagFreq: 14.5, wagAmp: 0.14 },
  fear:       { bend: 0,     wingSpread: 0.15, jaw: 0.32, wagFreq: 16.5, wagAmp: 0.18 },
  shock:      { bend: 0,     wingSpread: 1.0,  jaw: 0.82, wagFreq: 18.0, wagAmp: 0.12 },
  happy:      { bend: 0,     wingSpread: 0.80, jaw: 0.22, wagFreq: 5.2,  wagAmp: 0.22 },
  sad:        { bend: -0.06, wingSpread: 0.10, jaw: 0.0,  wagFreq: 1.2,  wagAmp: 0.05 },
};

const ONE_SHOT_DURATIONS = {
  left_turn: 0.60,
  right_turn: 0.60,
  eating: 0.54,
  shock: 0.70,
};

function easeCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export class VillainFlyingfish {
  static metadata = {
    name: 'Villain Atlantic Flying Fish',
    category: 'villain_fish',
    baseLength: 90,
    baseWidth: 88,
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
      const mag = st === 'shock' ? 1.5 : 0.75;
      ctx.translate(Math.sin(t * 58) * mag, Math.cos(t * 64) * mag);
    }

    const wag = Math.sin(t * p.wagFreq) * p.wagAmp;
    const bend = p.bend + wag;

    // 1. Stealth Shadow-Violet Miasma Aura
    this._drawMiasma(ctx, t, p.wingSpread);

    // 2. Enormous Tattered Dark-Crimson & Shadow-Violet Bat-Like Glider Wings
    this._drawBatGliderWings(ctx, p.wingSpread, bend, t);

    // 3. Secondary Rear Bat-Pelvic Stabilizers
    this._drawRearStabilizers(ctx, p.wingSpread, bend);

    // 4. Deeply Forked Asymmetric Tail Fin
    this._drawTail(ctx, bend);

    // 5. Stealth Midnight-Cobalt Torpedo Body
    this._drawTorpedoBody(ctx, bend, p.jaw, t);

    // 6. Expressive Villain Chibi Eyes
    this._drawEyes(ctx, st, t);

    // 7. Mood FX & Fangs
    this._drawMoodFX(ctx, st, p.jaw, t);

    ctx.restore();
  }

  _drawMiasma(ctx, t, spread) {
    ctx.save();
    const ry = 26 + spread * 20;
    const grad = ctx.createRadialGradient(2, 0, 8, 0, 0, 46);
    grad.addColorStop(0, 'rgba(14, 12, 34, 0.54)');
    grad.addColorStop(0.58, 'rgba(165, 22, 72, 0.16)');
    grad.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 44 + Math.sin(t * 3.5) * 2, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawBatGliderWings(ctx, spread, bend, t) {
    const flutter = Math.sin(t * 7.5) * 0.06;
    const span = 24 + spread * 21;

    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(15, side * 9.5);
      ctx.rotate(side * (-0.18 + (1 - spread) * 0.45 + flutter) + bend * 0.15);

      const g = ctx.createLinearGradient(8, 0, -24, side * span);
      g.addColorStop(0, '#2B1545');
      g.addColorStop(0.52, '#5E1642');
      g.addColorStop(1, '#CC1E3E');

      ctx.fillStyle = g;
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.2;
      ctx.lineJoin = 'round';

      // Enormous scalloped bat-like glider wing with tattered notches
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.quadraticCurveTo(8, side * (span * 0.55), -4, side * span);
      // Scalloped bat-membrane trailing edge
      ctx.quadraticCurveTo(-8, side * (span * 0.72), -14, side * (span * 0.85));
      ctx.lineTo(-16, side * (span * 0.62)); // battle tear notch
      ctx.quadraticCurveTo(-20, side * (span * 0.52), -26, side * (span * 0.56));
      ctx.quadraticCurveTo(-22, side * (span * 0.25), -14, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Bat-wing finger bone struts & glowing crimson veins
      ctx.strokeStyle = 'rgba(255, 76, 108, 0.55)';
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(2, side * 2); ctx.lineTo(-4, side * (span * 0.94));
      ctx.moveTo(-2, side * 2); ctx.lineTo(-14, side * (span * 0.80));
      ctx.moveTo(-6, side * 2); ctx.lineTo(-24, side * (span * 0.52));
      ctx.stroke();

      ctx.restore();
    }
  }

  _drawRearStabilizers(ctx, spread, bend) {
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(-14, side * 7.5 + bend * 2.5);
      ctx.rotate(side * (0.25 + (1 - spread) * 0.3) + bend * 0.3);
      ctx.fillStyle = '#4A1542';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.lineTo(-5, side * (11 + spread * 5));
      ctx.lineTo(-12, side * (8 + spread * 3));
      ctx.lineTo(-6, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawTail(ctx, bend) {
    ctx.save();
    ctx.translate(-32, bend * 6);
    ctx.rotate(bend * 0.72);

    const g = ctx.createLinearGradient(0, 0, -18, 0);
    g.addColorStop(0, '#1D294D');
    g.addColorStop(0.65, '#4A1845');
    g.addColorStop(1, '#D61E42');

    ctx.fillStyle = g;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.1;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(2, -3.2);
    ctx.lineTo(-15, -14.5);
    ctx.lineTo(-10, -5);
    ctx.lineTo(-8, 0);
    ctx.lineTo(-11, 6);
    ctx.lineTo(-17, 17.5); // longer lower gliding lobe
    ctx.lineTo(2, 3.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  _drawTorpedoBody(ctx, bend, jaw, t) {
    ctx.save();
    const snout = 41 + jaw * 2.0;

    const buildBody = () => {
      ctx.beginPath();
      ctx.moveTo(snout, 0);
      ctx.bezierCurveTo(37, -10, 22, -13.5, 4, -12.5);
      ctx.bezierCurveTo(-12, -11.5, -24, -6.5 + bend * 3.5, -33, -3.2 + bend * 6);
      ctx.lineTo(-33, 3.2 + bend * 6);
      ctx.bezierCurveTo(-24, 6.5 + bend * 3.5, -12, 11.5, 4, 12.5);
      ctx.bezierCurveTo(22, 13.5, 37, 10, snout, 0);
      ctx.closePath();
    };

    const g = ctx.createLinearGradient(40, -13, -32, 13);
    g.addColorStop(0, '#2B427A');
    g.addColorStop(0.45, '#19274F');
    g.addColorStop(0.85, '#101836');
    g.addColorStop(1, '#1A0F2E');

    buildBody();
    ctx.fillStyle = g;
    ctx.fill();

    ctx.save();
    buildBody();
    ctx.clip();

    // Stealth cobalt-crimson aerodynamic racing stripes
    ctx.strokeStyle = `rgba(255, 42, 86, ${0.55 + 0.25 * Math.sin(t * 5)})`;
    ctx.lineWidth = 1.6;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(22, side * 5.5);
      ctx.lineTo(-28, side * 3.0 + bend * 5);
      ctx.stroke();
    }

    // Metallic cobalt glossy highlight
    ctx.fillStyle = 'rgba(145, 195, 255, 0.28)';
    ctx.beginPath();
    ctx.ellipse(12, -5.5, 16, 2.6, -0.05, 0, Math.PI * 2);
    ctx.fill();

    // Battle scar across midnight-cobalt fuselage
    ctx.strokeStyle = '#FF99B8';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(6, -9);
    ctx.lineTo(12, -4);
    ctx.stroke();

    ctx.restore();

    buildBody();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.4;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  _drawEyes(ctx, st, t) {
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(29.5, side * 7.8);

      if (st === 'stress') {
        ctx.strokeStyle = '#FF2A5E';
        ctx.lineWidth = 2.3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-2.6, side * -2.0);
        ctx.lineTo(1.9, 0);
        ctx.lineTo(-2.6, side * 2.0);
        ctx.stroke();
        ctx.restore();
        continue;
      }

      const r = st === 'shock' ? 4.6 : 3.8;
      ctx.fillStyle = st === 'shock' ? '#FFF5FF' : '#140B22';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (st === 'shock') {
        ctx.fillStyle = '#140B1C';
        ctx.beginPath();
        ctx.arc(0.7, 0, 1.3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = st === 'hungry' ? '#FF143C' : '#FF3864';
        ctx.beginPath();
        ctx.arc(0.4, 0, r * 0.72, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#140B1C';
        ctx.beginPath();
        ctx.ellipse(0.6, 0, 0.8, r * 0.58, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(1.4, -1.0, 0.9, 0, Math.PI * 2);
        ctx.arc(-0.5, 1.0, 0.45, 0, Math.PI * 2);
        ctx.fill();

        if (st === 'relax' || st === 'happy') {
          ctx.fillStyle = '#19274F';
          ctx.beginPath();
          ctx.arc(0, 0, r + 0.2, Math.PI * 0.95, Math.PI * 2.05);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Stealth V-brow
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.1;
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (st === 'sad' || st === 'fear') {
        ctx.moveTo(-2.8, side * 4.0);
        ctx.lineTo(3.2, side * 2.2);
      } else {
        ctx.moveTo(-2.8, side * 2.0);
        ctx.lineTo(3.4, side * 4.4);
      }
      ctx.stroke();

      ctx.restore();
    }
  }

  _drawMoodFX(ctx, st, jaw, t) {
    ctx.save();
    if (st === 'eating' || st === 'hungry') {
      const snap = Math.abs(Math.sin(t * 22));
      ctx.fillStyle = '#FFF5F8';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.1;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(39 + jaw * 2, side * (3.0 + snap));
        ctx.lineTo(44.5 + jaw * 2 + snap, side * 1.3);
        ctx.lineTo(39 + jaw * 2, side * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    if (st === 'happy') {
      for (let i = 0; i < 3; i++) {
        const a = t * 2.8 + i * 2.1;
        const sx = 22 + Math.cos(a) * 18;
        const sy = Math.sin(a) * 18;
        const s = 2.4 + Math.sin(t * 8 + i) * 0.7;
        ctx.fillStyle = i % 2 === 0 ? '#FF245E' : '#A855F7';
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
      const b = Math.abs(Math.sin(t * 16)) * 2.5;
      ctx.fillStyle = '#FF245E';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.7;
      ctx.beginPath();
      ctx.roundRect(30, -24 - b, 3.6, 8.8, 1.5);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(31.8, -12.2 - b, 1.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (st === 'fear') {
      const drop = (t * 20) % 10;
      ctx.fillStyle = '#7CE8FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(22, -20 - drop * 0.3);
      ctx.quadraticCurveTo(25.5, -16, 22, -14.5);
      ctx.quadraticCurveTo(18.5, -16, 22, -20 - drop * 0.3);
      ctx.fill();
      ctx.stroke();
    } else if (st === 'stress') {
      const sc = 1 + Math.sin(t * 24) * 0.16;
      ctx.save();
      ctx.translate(21, -17);
      ctx.scale(sc, sc);
      ctx.strokeStyle = '#FF2A4B';
      ctx.lineWidth = 2.0;
      ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(1.2, 1.2);
        ctx.quadraticCurveTo(2.4, 2.4, 4.2, 1.4);
        ctx.stroke();
      }
      ctx.restore();
    } else if (st === 'sad') {
      const fall = (t * 8) % 6;
      ctx.fillStyle = '#60C5FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(29.5, 13 + fall * 0.4);
      ctx.quadraticCurveTo(32, 16 + fall * 0.4, 29.5, 17.5 + fall * 0.4);
      ctx.quadraticCurveTo(27, 16 + fall * 0.4, 29.5, 13 + fall * 0.4);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
}

export default VillainFlyingfish;
