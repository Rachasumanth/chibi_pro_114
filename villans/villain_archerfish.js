/**
 * Villain Banded Archerfish (Toxotes jaculatrix — Gunmetal Sniper Bandit Variant)
 * 2D Top-Down Expressive Chibi Villain Fish
 * Dark gunmetal body, sharp crimson-edged black bandit bars, laser-like glowing targeting eyes, sneering upturned mouth.
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
  breathing:  { bend: 0,     finFlare: 0.20, targetLock: 0.35, jaw: 0.0,  wagFreq: 2.3,  wagAmp: 0.09 },
  swimming:   { bend: 0,     finFlare: 0.55, targetLock: 0.60, jaw: 0.05, wagFreq: 7.8,  wagAmp: 0.30 },
  relax:      { bend: 0.05,  finFlare: 0.08, targetLock: 0.15, jaw: 0.0,  wagFreq: 1.4,  wagAmp: 0.05 },
  left_turn:  { bend: -0.56, finFlare: 0.78, targetLock: 0.65, jaw: 0.05, wagFreq: 5.8,  wagAmp: 0.22 },
  right_turn: { bend: 0.56,  finFlare: 0.78, targetLock: 0.65, jaw: 0.05, wagFreq: 5.8,  wagAmp: 0.22 },
  eating:     { bend: 0,     finFlare: 0.88, targetLock: 1.0,  jaw: 1.0,  wagFreq: 9.5,  wagAmp: 0.20 },
  hungry:     { bend: 0,     finFlare: 0.60, targetLock: 0.95, jaw: 0.45, wagFreq: 6.5,  wagAmp: 0.22 },
  stress:     { bend: 0,     finFlare: 0.70, targetLock: 0.80, jaw: 0.25, wagFreq: 14.5, wagAmp: 0.14 },
  fear:       { bend: 0,     finFlare: 0.92, targetLock: 0.10, jaw: 0.30, wagFreq: 16.5, wagAmp: 0.18 },
  shock:      { bend: 0,     finFlare: 1.0,  targetLock: 0.0,  jaw: 0.80, wagFreq: 18.0, wagAmp: 0.12 },
  happy:      { bend: 0,     finFlare: 0.52, targetLock: 0.75, jaw: 0.20, wagFreq: 5.2,  wagAmp: 0.22 },
  sad:        { bend: -0.06, finFlare: -0.1, targetLock: 0.10, jaw: 0.0,  wagFreq: 1.2,  wagAmp: 0.05 },
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

export class VillainArcherfish {
  static metadata = {
    name: 'Villain Banded Archerfish',
    category: 'villain_fish',
    baseLength: 78,
    baseWidth: 36,
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
      const mag = st === 'shock' ? 1.4 : 0.7;
      ctx.translate(Math.sin(t * 58) * mag, Math.cos(t * 64) * mag);
    }

    const wag = Math.sin(t * p.wagFreq) * p.wagAmp;
    const bend = p.bend + wag;

    // 1. Dark Miasma Shadow
    this._drawMiasma(ctx, t, p.targetLock);

    // 2. Razor-Edged Gunmetal & Crimson Tail Fin
    this._drawTail(ctx, bend);

    // 3. Swept Tactical Pectoral Fins
    this._drawPectorals(ctx, p.finFlare, wag);

    // 4. Gunmetal Chibi Sniper Body + Crimson-Edged Bandit Bars
    this._drawBody(ctx, bend, p.jaw, t);

    // 5. Rear-Set Spiky Sniper Dorsal Crest
    this._drawDorsal(ctx, bend);

    // 6. Sneering Upturned Sniper Mouth (with water-jet charge on eating/hungry)
    this._drawMouth(ctx, st, p.jaw, t);

    // 7. Laser-Like Glowing Targeting Eyes
    this._drawEyes(ctx, st, p.targetLock, t);

    // 8. Mood FX
    this._drawMoodFX(ctx, st, t);

    ctx.restore();
  }

  _drawMiasma(ctx, t, lock) {
    ctx.save();
    const rx = 41 + Math.sin(t * 3.2) * 2;
    const grad = ctx.createRadialGradient(0, 0, 6, -2, 0, rx);
    grad.addColorStop(0, 'rgba(18, 12, 28, 0.52)');
    grad.addColorStop(0.6, `rgba(210, 24, 48, ${0.12 + lock * 0.14})`);
    grad.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(-2, 0, rx, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawTail(ctx, bend) {
    ctx.save();
    ctx.translate(-26, bend * 5.5);
    ctx.rotate(bend * 0.7);

    const g = ctx.createLinearGradient(0, 0, -15, 0);
    g.addColorStop(0, '#2B3242');
    g.addColorStop(0.7, '#4B5568');
    g.addColorStop(1, '#D61E3A');

    ctx.fillStyle = g;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.1;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(2, -3.5);
    ctx.lineTo(-14, -14);
    ctx.lineTo(-11, -7);
    ctx.lineTo(-13.5, -4); // notch
    ctx.lineTo(-8.5, 0);
    ctx.lineTo(-14, 13.5);
    ctx.lineTo(2, 3.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  _drawPectorals(ctx, flare, wag) {
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(10, side * 12.5);
      ctx.rotate(side * (0.32 + flare * 0.5) + wag * 0.25);

      const g = ctx.createLinearGradient(4, 0, -12, side * 12);
      g.addColorStop(0, '#262C3A');
      g.addColorStop(0.65, '#4A5468');
      g.addColorStop(1, '#C91D38');

      ctx.fillStyle = g;
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.0;
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(5, 0);
      ctx.lineTo(-3, side * 13);
      ctx.lineTo(-11, side * 12.5);
      ctx.lineTo(-8.5, side * 7.5);
      ctx.lineTo(-12, side * 5.5);
      ctx.lineTo(-3, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawBody(ctx, bend, jaw, t) {
    ctx.save();
    const snout = 35 + jaw * 2.0;

    const buildBody = () => {
      ctx.beginPath();
      ctx.moveTo(snout, 0);
      // Sleek pointed sniper snout widening into chunky chibi archerfish shoulders
      ctx.bezierCurveTo(30, -8.5, 19, -17.5, 3, -16.8);
      ctx.bezierCurveTo(-10, -16.0, -19, -8.2 + bend * 3.2, -27, -3.6 + bend * 5.5);
      ctx.lineTo(-27, 3.6 + bend * 5.5);
      ctx.bezierCurveTo(-19, 8.2 + bend * 3.2, -10, 16.0, 3, 16.8);
      ctx.bezierCurveTo(19, 17.5, 30, 8.5, snout, 0);
      ctx.closePath();
    };

    const g = ctx.createLinearGradient(34, -16, -26, 16);
    g.addColorStop(0, '#5E6B80');
    g.addColorStop(0.45, '#3A4354');
    g.addColorStop(0.85, '#242A36');
    g.addColorStop(1, '#171B26');

    buildBody();
    ctx.fillStyle = g;
    ctx.fill();

    ctx.save();
    buildBody();
    ctx.clip();

    // 4 Sharp Crimson-Edged Black Bandit Bars
    const bars = [
      { x: 18, w: 5.5, yShift: 0 },
      { x: 6,  w: 6.5, yShift: 0 },
      { x: -6, w: 6.0, yShift: bend * 1.2 },
      { x: -17, w: 5.0, yShift: bend * 3.0 },
    ];
    for (const b of bars) {
      // Crimson razor edge
      ctx.fillStyle = '#E01E3C';
      ctx.beginPath();
      ctx.moveTo(b.x + b.w * 0.65, -18 + b.yShift);
      ctx.lineTo(b.x + b.w * 0.95, 0 + b.yShift);
      ctx.lineTo(b.x + b.w * 0.65, 18 + b.yShift);
      ctx.lineTo(b.x - b.w * 0.65, 18 + b.yShift);
      ctx.lineTo(b.x - b.w * 0.35, 0 + b.yShift);
      ctx.lineTo(b.x - b.w * 0.65, -18 + b.yShift);
      ctx.closePath();
      ctx.fill();

      // Inner pitch-black bandit bar
      ctx.fillStyle = '#130D1B';
      ctx.beginPath();
      ctx.moveTo(b.x + b.w * 0.42, -18 + b.yShift);
      ctx.lineTo(b.x + b.w * 0.72, 0 + b.yShift);
      ctx.lineTo(b.x + b.w * 0.42, 18 + b.yShift);
      ctx.lineTo(b.x - b.w * 0.42, 18 + b.yShift);
      ctx.lineTo(b.x - b.w * 0.12, 0 + b.yShift);
      ctx.lineTo(b.x - b.w * 0.42, -18 + b.yShift);
      ctx.closePath();
      ctx.fill();
    }

    // Metallic gunmetal cel-shading
    const shade = ctx.createLinearGradient(0, -17, 0, 17);
    shade.addColorStop(0, 'rgba(210, 225, 255, 0.22)');
    shade.addColorStop(0.35, 'rgba(0, 0, 0, 0)');
    shade.addColorStop(0.75, 'rgba(12, 10, 22, 0.35)');
    shade.addColorStop(1, 'rgba(10, 6, 18, 0.55)');
    ctx.fillStyle = shade;
    ctx.fillRect(-32, -20, 72, 40);

    // Glossy steel highlight
    ctx.fillStyle = 'rgba(220, 236, 255, 0.30)';
    ctx.beginPath();
    ctx.ellipse(8, -7.5, 13, 2.8, -0.08, 0, Math.PI * 2);
    ctx.fill();

    // Diagonal combat scratch across gunmetal flank
    ctx.strokeStyle = 'rgba(255, 120, 140, 0.75)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-1, -11);
    ctx.lineTo(5, -6);
    ctx.stroke();

    ctx.restore();

    buildBody();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.4;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  _drawDorsal(ctx, bend) {
    ctx.save();
    ctx.fillStyle = '#B81834';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.8;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.lineTo(-9, -3.5 + bend * 2);
    ctx.lineTo(-14, 0.5 + bend * 3);
    ctx.lineTo(-20, -2.5 + bend * 4.5);
    ctx.lineTo(-18, 2.5 + bend * 4);
    ctx.lineTo(-7, 2.4 + bend * 1.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  _drawMouth(ctx, st, jaw, t) {
    ctx.save();
    const mx = 31.5 + jaw * 1.6;
    // Sneering upturned lower-jaw lip visible from top-down
    ctx.fillStyle = '#1C1424';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(mx + 3.5, 0);
    ctx.quadraticCurveTo(mx + 1, -4.5 - jaw * 1.5, mx - 2.5, -2.8);
    ctx.quadraticCurveTo(mx, 0, mx - 2.5, 2.8);
    ctx.quadraticCurveTo(mx + 1, 4.5 + jaw * 1.5, mx + 3.5, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Sharp villain fangs when hungry / eating / happy
    if (st === 'eating' || st === 'hungry' || st === 'happy') {
      const snap = st === 'eating' ? Math.abs(Math.sin(t * 22)) : 0.4;
      ctx.fillStyle = '#FFF5F8';
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(mx + 1.5, side * (2.5 + snap));
        ctx.lineTo(mx + 4.8 + snap, side * 1.2);
        ctx.lineTo(mx + 1.0, side * 0.7);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Crimson plasma water-jet burst when eating
    if (st === 'eating') {
      const pulse = Math.sin(t * 28) * 0.5 + 0.5;
      ctx.strokeStyle = `rgba(255, 50, 90, ${0.5 + pulse * 0.5})`;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(mx + 4, 0);
      ctx.lineTo(mx + 14 + pulse * 6, 0);
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawEyes(ctx, st, lock, t) {
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(22.5, side * 8.6);

      if (st === 'stress') {
        ctx.strokeStyle = '#FF2B55';
        ctx.lineWidth = 2.3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-2.6, side * -2.2);
        ctx.lineTo(2.0, 0);
        ctx.lineTo(-2.6, side * 2.2);
        ctx.stroke();
        ctx.restore();
        continue;
      }

      const r = st === 'shock' ? 4.5 : 3.8;

      // Subtle laser targeting glow
      if (lock > 0.3 && st !== 'shock') {
        ctx.fillStyle = `rgba(255, 32, 68, ${0.22 + lock * 0.2})`;
        ctx.beginPath();
        ctx.arc(0.4, 0, r * 1.55, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = st === 'shock' ? '#FFF6F8' : '#1A0B1C';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.7;
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
        // Laser targeting neon-crimson iris
        ctx.fillStyle = st === 'sad' ? '#B84A62' : '#FF2448';
        ctx.beginPath();
        ctx.arc(0.4, 0, r * 0.7, 0, Math.PI * 2);
        ctx.fill();

        // Crosshair / sniper reticle ring inside iris
        ctx.strokeStyle = '#FFD2DA';
        ctx.lineWidth = 0.65;
        ctx.beginPath();
        ctx.arc(0.4, 0, r * 0.42, 0, Math.PI * 2);
        ctx.stroke();

        // Sharp pupil
        ctx.fillStyle = '#140B1C';
        ctx.beginPath();
        ctx.arc(0.6, 0, 1.05, 0, Math.PI * 2);
        ctx.fill();

        // Dual catchlights
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(1.5, -1.0, 0.9, 0, Math.PI * 2);
        ctx.arc(-0.5, 1.1, 0.45, 0, Math.PI * 2);
        ctx.fill();

        if (st === 'relax' || st === 'happy') {
          ctx.fillStyle = '#2B3242';
          ctx.beginPath();
          ctx.arc(0, 0, r + 0.2, Math.PI * 0.95, Math.PI * 2.05);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Angled V-shaped villain sniper brow
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.1;
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (st === 'sad' || st === 'fear') {
        ctx.moveTo(-2.8, side * 4.0);
        ctx.lineTo(3.2, side * 2.2);
      } else {
        ctx.moveTo(-2.8, side * 2.2);
        ctx.lineTo(3.5, side * 4.5);
      }
      ctx.stroke();

      ctx.restore();
    }
  }

  _drawMoodFX(ctx, st, t) {
    ctx.save();
    if (st === 'happy') {
      for (let i = 0; i < 3; i++) {
        const a = t * 2.8 + i * 2.1;
        const sx = 12 + Math.cos(a) * 18;
        const sy = Math.sin(a) * 17;
        const s = 2.3 + Math.sin(t * 7 + i) * 0.7;
        ctx.fillStyle = i % 2 === 0 ? '#FF2448' : '#A855F7';
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
      ctx.fillStyle = '#FF2448';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.roundRect(24, -24 - b, 3.4, 8.5, 1.5);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(25.7, -12.5 - b, 1.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (st === 'fear') {
      const drop = (t * 20) % 10;
      ctx.fillStyle = '#7CE8FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(15, -19 - drop * 0.3);
      ctx.quadraticCurveTo(18.5, -15, 15, -13.5);
      ctx.quadraticCurveTo(11.5, -15, 15, -19 - drop * 0.3);
      ctx.fill();
      ctx.stroke();
    } else if (st === 'stress') {
      const sc = 1 + Math.sin(t * 24) * 0.16;
      ctx.save();
      ctx.translate(15, -16);
      ctx.scale(sc, sc);
      ctx.strokeStyle = '#FF2A4B';
      ctx.lineWidth = 1.9;
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
      ctx.moveTo(22.5, 12.5 + fall * 0.4);
      ctx.quadraticCurveTo(25, 15.5 + fall * 0.4, 22.5, 17 + fall * 0.4);
      ctx.quadraticCurveTo(20, 15.5 + fall * 0.4, 22.5, 12.5 + fall * 0.4);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
}

export default VillainArcherfish;
