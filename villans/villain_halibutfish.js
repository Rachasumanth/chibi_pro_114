/**
 * Villain Pacific Halibut (Hippoglossus stenolepis — Battle-Scarred Obsidian-Chocolate Diamond Variant)
 * 2D Top-Down Expressive Chibi Villain Fish
 * Battle-scarred dark obsidian-chocolate diamond flatfish with jagged notched fringe borders and fierce glowing asymmetric eyes.
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
  breathing:  { bend: 0,     fringeAmp: 2.0, jaw: 0.08, wagFreq: 2.0,  wagAmp: 0.10 },
  swimming:   { bend: 0,     fringeAmp: 5.2, jaw: 0.14, wagFreq: 6.0,  wagAmp: 0.28 },
  relax:      { bend: 0.04,  fringeAmp: 1.0, jaw: 0.0,  wagFreq: 1.2,  wagAmp: 0.05 },
  left_turn:  { bend: -0.52, fringeAmp: 4.5, jaw: 0.15, wagFreq: 4.6,  wagAmp: 0.22 },
  right_turn: { bend: 0.52,  fringeAmp: 4.5, jaw: 0.15, wagFreq: 4.6,  wagAmp: 0.22 },
  eating:     { bend: 0,     fringeAmp: 6.0, jaw: 1.0,  wagFreq: 8.2,  wagAmp: 0.22 },
  hungry:     { bend: 0,     fringeAmp: 4.4, jaw: 0.55, wagFreq: 5.4,  wagAmp: 0.22 },
  stress:     { bend: 0,     fringeAmp: 5.0, jaw: 0.35, wagFreq: 13.0, wagAmp: 0.14 },
  fear:       { bend: 0,     fringeAmp: 6.4, jaw: 0.30, wagFreq: 15.0, wagAmp: 0.18 },
  shock:      { bend: 0,     fringeAmp: 6.8, jaw: 0.85, wagFreq: 17.0, wagAmp: 0.12 },
  happy:      { bend: 0,     fringeAmp: 4.0, jaw: 0.28, wagFreq: 4.4,  wagAmp: 0.20 },
  sad:        { bend: -0.05, fringeAmp: 0.7, jaw: 0.0,  wagFreq: 1.0,  wagAmp: 0.05 },
};

const ONE_SHOT_DURATIONS = {
  left_turn: 0.64,
  right_turn: 0.64,
  eating: 0.58,
  shock: 0.72,
};

function easeCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export class VillainHalibutfish {
  static metadata = {
    name: 'Villain Pacific Halibut',
    category: 'villain_fish',
    baseLength: 175,
    baseWidth: 115,
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
      ctx.translate(Math.sin(t * 56) * mag, Math.cos(t * 62) * mag);
    }

    const wag = Math.sin(t * p.wagFreq) * p.wagAmp;
    const bend = p.bend + wag;

    // 1. Dark Miasma Aura
    this._drawMiasma(ctx, t);

    // 2. Massive Crescent Notched Halibut Tail
    this._drawTail(ctx, bend);

    // 3. Jagged Notched Fringe Borders
    this._drawJaggedFringe(ctx, p.fringeAmp, bend, t);

    // 4. Battle-Scarred Dark Obsidian-Chocolate Diamond Body
    this._drawDiamondBody(ctx, bend, p.jaw, t);

    // 5. Fierce Glowing Asymmetric Villain Eyes
    this._drawAsymmetricEyes(ctx, st, t);

    // 6. Mood FX & Snapping Fangs
    this._drawMoodFX(ctx, st, p.jaw, t);

    ctx.restore();
  }

  _drawMiasma(ctx, t) {
    ctx.save();
    const grad = ctx.createRadialGradient(4, 0, 16, 0, 0, 82);
    grad.addColorStop(0, 'rgba(18, 10, 20, 0.56)');
    grad.addColorStop(0.58, 'rgba(145, 36, 26, 0.16)');
    grad.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 82 + Math.sin(t * 2.8) * 3, 56, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawTail(ctx, bend) {
    ctx.save();
    ctx.translate(-62, bend * 8);
    ctx.rotate(bend * 0.65);

    const g = ctx.createLinearGradient(0, 0, -24, 0);
    g.addColorStop(0, '#2B1F24');
    g.addColorStop(0.65, '#4A2429');
    g.addColorStop(1, '#B3202E');

    ctx.fillStyle = g;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.4;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(4, -7.5);
    ctx.lineTo(-22, -24);
    ctx.lineTo(-17, -12);
    ctx.lineTo(-22, -6); // battle notch
    ctx.lineTo(-13, 0);
    ctx.lineTo(-22, 24);
    ctx.lineTo(4, 7.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  _drawJaggedFringe(ctx, amp, bend, t) {
    ctx.save();
    ctx.fillStyle = '#3B1E28';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.2;
    ctx.lineJoin = 'round';

    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(52, side * 14);
      const pts = 11;
      for (let i = 1; i < pts; i++) {
        const u = i / pts;
        const x = lerp(52, -56, u);
        // Diamond profile peaking near center
        const peak = Math.sin(u * Math.PI);
        const ripple = Math.sin(t * 6.5 - u * 6.5) * amp;
        const jag = (i % 2 === 0 ? 5.5 : -3.5);
        const y = side * (16 + peak * 39 + jag + ripple) + (u > 0.5 ? bend * 8 * (u - 0.5) : 0);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(-58, side * 8 + bend * 6);
      ctx.lineTo(52, side * 14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawDiamondBody(ctx, bend, jaw, t) {
    ctx.save();
    const snout = 76 + jaw * 2.5;

    const buildBody = () => {
      ctx.beginPath();
      ctx.moveTo(snout, 0);
      ctx.bezierCurveTo(64, -22, 26, -45, -4, -44);
      ctx.bezierCurveTo(-32, -43, -52, -18 + bend * 4, -64, -7.5 + bend * 8);
      ctx.lineTo(-64, 7.5 + bend * 8);
      ctx.bezierCurveTo(-52, 18 + bend * 4, -32, 43, -4, 44);
      ctx.bezierCurveTo(26, 45, 64, 22, snout, 0);
      ctx.closePath();
    };

    const g = ctx.createRadialGradient(14, -8, 10, 0, 0, 74);
    g.addColorStop(0, '#4F3733');
    g.addColorStop(0.45, '#302024');
    g.addColorStop(0.85, '#1C131C');
    g.addColorStop(1, '#120B16');

    buildBody();
    ctx.fillStyle = g;
    ctx.fill();

    ctx.save();
    buildBody();
    ctx.clip();

    // Dark obsidian-chocolate mottled camouflage plates
    ctx.fillStyle = 'rgba(18, 10, 22, 0.45)';
    const mottles = [
      [28, -18, 14, 8], [22, 20, 13, 8], [-4, -26, 16, 9], [-8, 24, 15, 9],
      [-32, -14, 12, 7], [-34, 14, 12, 7], [6, 0, 14, 10],
    ];
    for (const [mx, my, rx, ry] of mottles) {
      ctx.beginPath();
      ctx.ellipse(mx, my, rx, ry, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Glowing molten-ember lateral line arch (iconic halibut lateral arch turned sinister)
    ctx.strokeStyle = `rgba(255, 86, 42, ${0.42 + 0.25 * Math.sin(t * 4)})`;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(46, -2);
    ctx.quadraticCurveTo(28, -16, 12, -2);
    ctx.lineTo(-58, bend * 6);
    ctx.stroke();

    // Heavy cross-hatched battle scars across titan back
    ctx.strokeStyle = '#FFD0BE';
    ctx.lineWidth = 2.0;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(16, -32); ctx.lineTo(30, -14);
    ctx.moveTo(22, -30); ctx.lineTo(34, -18);
    ctx.moveTo(-22, 16); ctx.lineTo(-10, 28);
    ctx.stroke();

    ctx.strokeStyle = '#9E1A2E';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(17, -31); ctx.lineTo(29, -15);
    ctx.stroke();

    // Glossy obsidian dorsal highlight
    ctx.fillStyle = 'rgba(235, 195, 180, 0.16)';
    ctx.beginPath();
    ctx.ellipse(22, -16, 22, 6.2, -0.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    buildBody();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.8;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  _drawAsymmetricEyes(ctx, st, t) {
    // Fierce glowing asymmetric halibut eyes on top
    const specs = [
      { x: 54, y: -11.5, r: 5.5, side: -1 },
      { x: 43, y:   4.5, r: 5.0, side:  1 },
    ];

    for (const e of specs) {
      ctx.save();
      ctx.translate(e.x, e.y);

      if (st === 'stress') {
        ctx.strokeStyle = '#FF5226';
        ctx.lineWidth = 2.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-3.4, -2.6);
        ctx.lineTo(2.4, 0);
        ctx.lineTo(-3.4, 2.6);
        ctx.stroke();
        ctx.restore();
        continue;
      }

      const r = st === 'shock' ? e.r + 1.2 : e.r;
      ctx.fillStyle = st === 'shock' ? '#FFF6EE' : '#190B1E';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (st === 'shock') {
        ctx.fillStyle = '#140B1C';
        ctx.beginPath();
        ctx.arc(0.9, 0, 1.6, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = st === 'hungry' ? '#FF1E2B' : '#FF8C1A';
        ctx.beginPath();
        ctx.arc(0.5, 0, r * 0.72, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#140B1C';
        ctx.beginPath();
        ctx.ellipse(0.8, 0, 0.95, r * 0.58, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(1.7, -1.2, 1.15, 0, Math.PI * 2);
        ctx.arc(-0.7, 1.3, 0.55, 0, Math.PI * 2);
        ctx.fill();

        if (st === 'relax' || st === 'happy') {
          ctx.fillStyle = '#302024';
          ctx.beginPath();
          ctx.arc(0, 0, r + 0.25, Math.PI * 0.95, Math.PI * 2.05);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Fierce V-brows
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (st === 'sad' || st === 'fear') {
        ctx.moveTo(-3.8, e.side * 5.2);
        ctx.lineTo(4.0, e.side * 2.8);
      } else {
        ctx.moveTo(-3.8, e.side * 2.6);
        ctx.lineTo(4.2, e.side * 5.6);
      }
      ctx.stroke();

      ctx.restore();
    }
  }

  _drawMoodFX(ctx, st, jaw, t) {
    ctx.save();
    if (st === 'eating' || st === 'hungry') {
      const snap = Math.abs(Math.sin(t * 22));
      ctx.fillStyle = '#FFF5EE';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.3;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(73 + jaw * 2, side * (4.8 + snap));
        ctx.lineTo(80 + jaw * 2 + snap * 1.6, side * 2.0);
        ctx.lineTo(73 + jaw * 2, side * 1.0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    if (st === 'happy') {
      for (let i = 0; i < 4; i++) {
        const a = t * 2.5 + i * 1.57;
        const sx = 38 + Math.cos(a) * 34;
        const sy = Math.sin(a) * 34;
        const s = 3.0 + Math.sin(t * 8 + i) * 0.9;
        ctx.fillStyle = i % 2 === 0 ? '#FF422E' : '#C084FC';
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
      const b = Math.abs(Math.sin(t * 16)) * 3.2;
      ctx.fillStyle = '#FF3838';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.9;
      ctx.beginPath();
      ctx.roundRect(54, -36 - b, 4.4, 11, 1.8);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(56.2, -21.5 - b, 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (st === 'fear') {
      const drop = (t * 20) % 10;
      ctx.fillStyle = '#7CE8FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(42, -32 - drop * 0.3);
      ctx.quadraticCurveTo(47, -26, 42, -24.5);
      ctx.quadraticCurveTo(37, -26, 42, -32 - drop * 0.3);
      ctx.fill();
      ctx.stroke();
    } else if (st === 'stress') {
      const sc = 1 + Math.sin(t * 24) * 0.16;
      ctx.save();
      ctx.translate(40, -28);
      ctx.scale(sc, sc);
      ctx.strokeStyle = '#FF2A4B';
      ctx.lineWidth = 2.3;
      ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(1.5, 1.5);
        ctx.quadraticCurveTo(3.0, 3.0, 5.4, 1.9);
        ctx.stroke();
      }
      ctx.restore();
    } else if (st === 'sad') {
      const fall = (t * 8) % 6;
      ctx.fillStyle = '#60C5FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(43, 13 + fall * 0.4);
      ctx.quadraticCurveTo(46.5, 17 + fall * 0.4, 43, 18.5 + fall * 0.4);
      ctx.quadraticCurveTo(39.5, 17 + fall * 0.4, 43, 13 + fall * 0.4);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
}

export default VillainHalibutfish;
