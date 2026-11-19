/**
 * Villain Marbled Electric Ray (Torpedo marmorata — Volatile Crimson & Violet Lightning Variant)
 * 2D Top-Down Expressive Chibi Villain Fish
 * Scorched obsidian-charcoal paddle disc crackling with volatile crimson-and-electric-violet lightning arcs across wings.
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
  breathing:  { bend: 0,     charge: 0.45, wagFreq: 2.2,  wagAmp: 0.14 },
  swimming:   { bend: 0,     charge: 0.72, wagFreq: 6.4,  wagAmp: 0.34 },
  relax:      { bend: 0.04,  charge: 0.20, wagFreq: 1.3,  wagAmp: 0.08 },
  left_turn:  { bend: -0.52, charge: 0.75, wagFreq: 4.8,  wagAmp: 0.24 },
  right_turn: { bend: 0.52,  charge: 0.75, wagFreq: 4.8,  wagAmp: 0.24 },
  eating:     { bend: 0,     charge: 1.0,  wagFreq: 8.5,  wagAmp: 0.24 },
  hungry:     { bend: 0,     charge: 0.92, wagFreq: 5.8,  wagAmp: 0.25 },
  stress:     { bend: 0,     charge: 1.0,  wagFreq: 14.0, wagAmp: 0.18 },
  fear:       { bend: 0,     charge: 0.35, wagFreq: 16.0, wagAmp: 0.22 },
  shock:      { bend: 0,     charge: 1.0,  wagFreq: 18.0, wagAmp: 0.14 },
  happy:      { bend: 0,     charge: 0.88, wagFreq: 4.6,  wagAmp: 0.25 },
  sad:        { bend: -0.05, charge: 0.15, wagFreq: 1.1,  wagAmp: 0.06 },
};

const ONE_SHOT_DURATIONS = {
  left_turn: 0.64,
  right_turn: 0.64,
  eating: 0.56,
  shock: 0.72,
};

function easeCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export class VillainElectricrayfish {
  static metadata = {
    name: 'Villain Marbled Electric Ray',
    category: 'villain_fish',
    baseLength: 115,
    baseWidth: 95,
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
      const mag = st === 'shock' ? 1.8 : 0.85;
      ctx.translate(Math.sin(t * 58) * mag, Math.cos(t * 64) * mag);
    }

    const wag = Math.sin(t * p.wagFreq) * p.wagAmp;
    const bend = p.bend + wag;

    // 1. Crackling Electric Miasma Aura
    this._drawMiasma(ctx, t, p.charge);

    // 2. Thick Muscular Torpedo Tail + Notched Paddle Caudal Fin
    this._drawPaddleTail(ctx, bend, p.charge);

    // 3. Pelvic Wing Flaps
    this._drawPelvicFlaps(ctx, bend);

    // 4. Scorched Obsidian-Charcoal Paddle Disc + Marbled Electric Organs
    this._drawPaddleDisc(ctx, p.charge, t);

    // 5. Volatile Crimson & Electric-Violet Lightning Arcs Across Wings
    this._drawLightningArcs(ctx, p.charge, t);

    // 6. Expressive Villain Chibi Eyes
    this._drawEyes(ctx, st, t);

    // 7. Mood FX
    this._drawMoodFX(ctx, st, t);

    ctx.restore();
  }

  _drawMiasma(ctx, t, charge) {
    ctx.save();
    const grad = ctx.createRadialGradient(8, 0, 12, 4, 0, 56);
    grad.addColorStop(0, 'rgba(18, 8, 28, 0.54)');
    grad.addColorStop(0.55, `rgba(165, 32, 255, ${0.14 + charge * 0.16})`);
    grad.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(6, 0, 52 + Math.sin(t * 6) * 2, 50, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawPaddleTail(ctx, bend, charge) {
    ctx.save();
    ctx.translate(-22, 0);
    ctx.rotate(bend * 0.55);

    // Broad triangular notched caudal paddle
    const g = ctx.createLinearGradient(0, 0, -40, 0);
    g.addColorStop(0, '#241B2E');
    g.addColorStop(0.65, '#381B45');
    g.addColorStop(1, '#B31942');

    ctx.fillStyle = g;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.3;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(4, -9.5);
    ctx.lineTo(-18, -5.5);
    ctx.lineTo(-34, -17.5);
    ctx.lineTo(-31, -8);
    ctx.lineTo(-35, -3.5); // notch
    ctx.lineTo(-30, 0);
    ctx.lineTo(-34, 17.5);
    ctx.lineTo(-18, 5.5);
    ctx.lineTo(4, 9.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing tail dorsal fins
    ctx.fillStyle = `rgba(180, 76, 255, ${0.5 + charge * 0.4})`;
    ctx.beginPath();
    ctx.ellipse(-10, 0, 5, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawPelvicFlaps(ctx, bend) {
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(-16, side * 14);
      ctx.rotate(bend * 0.25);
      ctx.fillStyle = '#201829';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.quadraticCurveTo(0, side * 14, -14, side * 13);
      ctx.quadraticCurveTo(-12, side * 4, -6, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawPaddleDisc(ctx, charge, t) {
    ctx.save();

    const buildDisc = () => {
      ctx.beginPath();
      // Blunt front torpedo paddle shape
      ctx.moveTo(48, -14);
      ctx.quadraticCurveTo(53, 0, 48, 14);
      ctx.bezierCurveTo(44, 34, 24, 46, 2, 44);
      ctx.bezierCurveTo(-18, 42, -26, 24, -22, 0);
      ctx.bezierCurveTo(-26, -24, -18, -42, 2, -44);
      ctx.bezierCurveTo(24, -46, 44, -34, 48, -14);
      ctx.closePath();
    };

    const g = ctx.createRadialGradient(14, -6, 6, 10, 0, 52);
    g.addColorStop(0, '#3B3047');
    g.addColorStop(0.55, '#221A2B');
    g.addColorStop(0.9, '#150F1E');
    g.addColorStop(1, '#2D143B');

    buildDisc();
    ctx.fillStyle = g;
    ctx.fill();

    ctx.save();
    buildDisc();
    ctx.clip();

    // Scorched marbled scorch-patches across wings
    ctx.fillStyle = 'rgba(14, 8, 22, 0.55)';
    const blotches = [
      [26, -24, 11, 7], [26, 24, 11, 7], [4, -30, 12, 8], [4, 30, 12, 8],
      [-10, -16, 10, 6], [-10, 16, 10, 6], [10, 0, 9, 12],
    ];
    for (const [bx, by, brx, bry] of blotches) {
      ctx.beginPath();
      ctx.ellipse(bx, by, brx, bry, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Twin glowing kidney-shaped bio-electric organ coils on left & right wings
    const pulse = 0.65 + 0.35 * Math.sin(t * 10);
    for (const side of [-1, 1]) {
      ctx.fillStyle = `rgba(176, 66, 255, ${(0.20 + charge * 0.30) * pulse})`;
      ctx.strokeStyle = `rgba(255, 46, 98, ${0.45 + charge * 0.45})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(12, side * 24, 16, 9.5, side * -0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Glossy obsidian specular highlight
    ctx.fillStyle = 'rgba(205, 175, 255, 0.18)';
    ctx.beginPath();
    ctx.ellipse(22, -10, 16, 5.2, -0.1, 0, Math.PI * 2);
    ctx.fill();

    // Battle scar across snout
    ctx.strokeStyle = '#FF99B8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(30, -16);
    ctx.lineTo(38, -10);
    ctx.stroke();

    ctx.restore();

    buildDisc();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.6;
    ctx.stroke();
    ctx.restore();
  }

  _drawLightningArcs(ctx, charge, t) {
    if (charge < 0.12) return;
    ctx.save();
    const seed = Math.floor(t * 18);
    const pseudo = (n) => Math.sin(seed * 12.9898 + n * 78.233) * 43758.5453 % 1;

    const drawBolt = (x1, y1, x2, y2, color, width) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      const segs = 4;
      for (let i = 1; i < segs; i++) {
        const f = i / segs;
        const jx = (pseudo(i * 3 + x1) - 0.5) * 9;
        const jy = (pseudo(i * 7 + y2) - 0.5) * 9;
        ctx.lineTo(lerp(x1, x2, f) + jx, lerp(y1, y2, f) + jy);
      }
      ctx.lineTo(x2, y2);
      ctx.stroke();
    };

    // Volatile crimson & electric-violet arcs jumping across both wings
    for (const side of [-1, 1]) {
      drawBolt(28, side * 16, -2, side * 34, `rgba(196, 78, 255, ${0.5 + charge * 0.45})`, 2.6);
      drawBolt(28, side * 16, -2, side * 34, '#FFFFFF', 1.0);

      if (charge > 0.55) {
        drawBolt(16, side * 26, -12, side * 18, `rgba(255, 36, 86, ${0.55 + charge * 0.45})`, 2.2);
        drawBolt(16, side * 26, -12, side * 18, '#FFE0EC', 0.9);
      }
    }
    ctx.restore();
  }

  _drawEyes(ctx, st, t) {
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(31, side * 10.5);

      if (st === 'stress') {
        ctx.strokeStyle = '#C966FF';
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-2.8, side * -2.2);
        ctx.lineTo(2.0, 0);
        ctx.lineTo(-2.8, side * 2.2);
        ctx.stroke();
        ctx.restore();
        continue;
      }

      const r = st === 'shock' ? 5.0 : 4.2;
      ctx.fillStyle = st === 'shock' ? '#FFF5FF' : '#180B24';
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
        // High-voltage violet-crimson iris
        ctx.fillStyle = st === 'hungry' ? '#FF245E' : '#B84CFF';
        ctx.beginPath();
        ctx.arc(0.4, 0, r * 0.72, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#140B1C';
        ctx.beginPath();
        ctx.ellipse(0.7, 0, 0.85, r * 0.58, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(1.5, -1.0, 1.0, 0, Math.PI * 2);
        ctx.arc(-0.6, 1.1, 0.48, 0, Math.PI * 2);
        ctx.fill();

        if (st === 'relax' || st === 'happy') {
          ctx.fillStyle = '#221A2B';
          ctx.beginPath();
          ctx.arc(0, 0, r + 0.2, Math.PI * 0.95, Math.PI * 2.05);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Angled V-shaped villain brow
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (st === 'sad' || st === 'fear') {
        ctx.moveTo(-3.2, side * 4.5);
        ctx.lineTo(3.4, side * 2.4);
      } else {
        ctx.moveTo(-3.2, side * 2.2);
        ctx.lineTo(3.6, side * 4.8);
      }
      ctx.stroke();

      ctx.restore();
    }
  }

  _drawMoodFX(ctx, st, t) {
    ctx.save();
    if (st === 'eating' || st === 'hungry') {
      const snap = Math.abs(Math.sin(t * 22));
      ctx.fillStyle = '#FFF5FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.2;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(49, side * (4.2 + snap));
        ctx.lineTo(54.5 + snap * 1.5, side * 1.8);
        ctx.lineTo(49, side * 0.9);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    if (st === 'happy') {
      for (let i = 0; i < 4; i++) {
        const a = t * 2.8 + i * 1.57;
        const sx = 24 + Math.cos(a) * 30;
        const sy = Math.sin(a) * 30;
        const s = 2.8 + Math.sin(t * 8 + i) * 0.8;
        ctx.fillStyle = i % 2 === 0 ? '#FF245E' : '#C084FC';
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
      const b = Math.abs(Math.sin(t * 16)) * 3;
      ctx.fillStyle = '#FF245E';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.roundRect(32, -30 - b, 4.0, 10, 1.8);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(34, -17 - b, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (st === 'fear') {
      const drop = (t * 20) % 10;
      ctx.fillStyle = '#7CE8FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(24, -26 - drop * 0.3);
      ctx.quadraticCurveTo(28.5, -21, 24, -19.5);
      ctx.quadraticCurveTo(19.5, -21, 24, -26 - drop * 0.3);
      ctx.fill();
      ctx.stroke();
    } else if (st === 'stress') {
      const sc = 1 + Math.sin(t * 24) * 0.16;
      ctx.save();
      ctx.translate(23, -23);
      ctx.scale(sc, sc);
      ctx.strokeStyle = '#FF2A4B';
      ctx.lineWidth = 2.1;
      ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(1.4, 1.4);
        ctx.quadraticCurveTo(2.8, 2.8, 4.8, 1.7);
        ctx.stroke();
      }
      ctx.restore();
    } else if (st === 'sad') {
      const fall = (t * 8) % 6;
      ctx.fillStyle = '#60C5FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(31, 16.5 + fall * 0.4);
      ctx.quadraticCurveTo(34, 20 + fall * 0.4, 31, 21.5 + fall * 0.4);
      ctx.quadraticCurveTo(28, 20 + fall * 0.4, 31, 16.5 + fall * 0.4);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
}

export default VillainElectricrayfish;
