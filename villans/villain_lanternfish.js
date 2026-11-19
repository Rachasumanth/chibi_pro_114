/**
 * Villain Bioluminescent Lanternfish (Myctophum — Abyssal-Black Ghostly Lantern Variant)
 * 2D Top-Down Expressive Chibi Villain Fish
 * Dark abyssal-black chibi body with wicked glowing neon-crimson eyes and rows of eerie ghostly-green & red villain flank lanterns.
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
  breathing:  { bend: 0,     finFlare: 0.20, jaw: 0.05, lantern: 0.65, wagFreq: 2.6,  wagAmp: 0.12 },
  swimming:   { bend: 0,     finFlare: 0.55, jaw: 0.10, lantern: 0.90, wagFreq: 8.6,  wagAmp: 0.34 },
  relax:      { bend: 0.05,  finFlare: 0.08, jaw: 0.0,  lantern: 0.35, wagFreq: 1.5,  wagAmp: 0.06 },
  left_turn:  { bend: -0.60, finFlare: 0.78, jaw: 0.10, lantern: 0.85, wagFreq: 6.2,  wagAmp: 0.24 },
  right_turn: { bend: 0.60,  finFlare: 0.78, jaw: 0.10, lantern: 0.85, wagFreq: 6.2,  wagAmp: 0.24 },
  eating:     { bend: 0,     finFlare: 0.88, jaw: 1.0,  lantern: 1.0,  wagFreq: 10.0, wagAmp: 0.24 },
  hungry:     { bend: 0,     finFlare: 0.65, jaw: 0.55, lantern: 0.98, wagFreq: 6.8,  wagAmp: 0.26 },
  stress:     { bend: 0,     finFlare: 0.72, jaw: 0.28, lantern: 0.95, wagFreq: 15.0, wagAmp: 0.16 },
  fear:       { bend: 0,     finFlare: 0.92, jaw: 0.32, lantern: 0.22, wagFreq: 17.0, wagAmp: 0.20 },
  shock:      { bend: 0,     finFlare: 1.0,  jaw: 0.85, lantern: 1.0,  wagFreq: 19.0, wagAmp: 0.14 },
  happy:      { bend: 0,     finFlare: 0.55, jaw: 0.24, lantern: 0.95, wagFreq: 5.6,  wagAmp: 0.24 },
  sad:        { bend: -0.06, finFlare: -0.1, jaw: 0.0,  lantern: 0.20, wagFreq: 1.3,  wagAmp: 0.05 },
};

const ONE_SHOT_DURATIONS = {
  left_turn: 0.58,
  right_turn: 0.58,
  eating: 0.52,
  shock: 0.68,
};

function easeCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export class VillainLanternfish {
  static metadata = {
    name: 'Villain Bioluminescent Lanternfish',
    category: 'villain_fish',
    baseLength: 58,
    baseWidth: 28,
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
      const mag = st === 'shock' ? 1.3 : 0.65;
      ctx.translate(Math.sin(t * 60) * mag, Math.cos(t * 66) * mag);
    }

    const wag = Math.sin(t * p.wagFreq) * p.wagAmp;
    const bend = p.bend + wag;

    // 1. Eerie Ghostly-Green & Crimson Miasma Aura
    this._drawMiasma(ctx, t, p.lantern);

    // 2. Forked Notched Abyssal Tail Fin + Glowing Caudal Lantern
    this._drawTail(ctx, bend, p.lantern);

    // 3. Swept Chibi Pectoral Fins
    this._drawPectorals(ctx, p.finFlare, wag);

    // 4. Dark Abyssal-Black Chibi Body + Ghostly-Green & Red Flank Lanterns
    this._drawBody(ctx, bend, p.jaw, p.lantern, t);

    // 5. Wicked Glowing Neon-Crimson Oversized Chibi Eyes
    this._drawEyes(ctx, st, t);

    // 6. Mood FX & Snapping Fangs
    this._drawMoodFX(ctx, st, p.jaw, t);

    ctx.restore();
  }

  _drawMiasma(ctx, t, lantern) {
    ctx.save();
    const rx = 32 + Math.sin(t * 4) * 2;
    const grad = ctx.createRadialGradient(2, 0, 5, 0, 0, rx);
    grad.addColorStop(0, 'rgba(12, 8, 22, 0.56)');
    grad.addColorStop(0.55, `rgba(42, 255, 138, ${0.12 + lantern * 0.14})`);
    grad.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, 19, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawTail(ctx, bend, lantern) {
    ctx.save();
    ctx.translate(-20, bend * 4.5);
    ctx.rotate(bend * 0.72);

    const g = ctx.createLinearGradient(0, 0, -13, 0);
    g.addColorStop(0, '#1A1328');
    g.addColorStop(0.6, '#2E183E');
    g.addColorStop(1, '#26E88A');

    ctx.fillStyle = g;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.9;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(2, -3);
    ctx.lineTo(-12.5, -11.5);
    ctx.lineTo(-9.5, -5.5);
    ctx.lineTo(-12, -3); // notch
    ctx.lineTo(-7, 0);
    ctx.lineTo(-12.5, 11.5);
    ctx.lineTo(2, 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing ghostly-green tail-base photophore
    ctx.fillStyle = `rgba(60, 255, 148, ${0.55 + lantern * 0.45})`;
    ctx.beginPath();
    ctx.arc(-2, 0, 2.0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawPectorals(ctx, flare, wag) {
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(6, side * 10.5);
      ctx.rotate(side * (0.35 + flare * 0.48) + wag * 0.25);

      ctx.fillStyle = '#241838';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.8;
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.lineTo(-2, side * 10);
      ctx.lineTo(-9, side * 8.5);
      ctx.lineTo(-6.5, side * 4.5);
      ctx.lineTo(-2, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawBody(ctx, bend, jaw, lantern, t) {
    ctx.save();
    const snout = 27 + jaw * 1.8;

    const buildBody = () => {
      ctx.beginPath();
      ctx.moveTo(snout, 0);
      // Plump front-heavy chibi lanternfish silhouette
      ctx.bezierCurveTo(25, -10.5, 13, -14.5, 0, -13.0);
      ctx.bezierCurveTo(-10, -11.5, -16, -6.0 + bend * 2.5, -21, -3.0 + bend * 4.5);
      ctx.lineTo(-21, 3.0 + bend * 4.5);
      ctx.bezierCurveTo(-16, 6.0 + bend * 2.5, -10, 11.5, 0, 13.0);
      ctx.bezierCurveTo(13, 14.5, 25, 10.5, snout, 0);
      ctx.closePath();
    };

    const g = ctx.createRadialGradient(8, -4, 3, 0, 0, 28);
    g.addColorStop(0, '#2B223D');
    g.addColorStop(0.5, '#171024');
    g.addColorStop(1, '#0D0816');

    buildBody();
    ctx.fillStyle = g;
    ctx.fill();

    ctx.save();
    buildBody();
    ctx.clip();

    // Rows of eerie ghostly-green & neon-red villain flank lanterns
    const lanterns = [
      [11, 9.2, true], [4, 9.8, false], [-3, 8.8, true], [-10, 6.8, false], [-16, 4.4, true],
    ];
    for (let i = 0; i < lanterns.length; i++) {
      const [lx, ly, isGreen] = lanterns[i];
      const wave = 0.6 + 0.4 * Math.sin(t * 6.5 - i * 0.9);
      const a = Math.min(1, (0.4 + lantern * 0.6) * wave);
      for (const side of [-1, 1]) {
        const yPos = side * ly + (lx < -4 ? bend * 2.5 : 0);
        // Outer lantern glow
        ctx.fillStyle = isGreen
          ? `rgba(48, 255, 142, ${a * 0.45})`
          : `rgba(255, 34, 72, ${a * 0.45})`;
        ctx.beginPath();
        ctx.arc(lx, yPos, 3.2, 0, Math.PI * 2);
        ctx.fill();

        // Bright lantern core
        ctx.fillStyle = isGreen
          ? `rgba(180, 255, 212, ${a})`
          : `rgba(255, 130, 152, ${a})`;
        ctx.beginPath();
        ctx.arc(lx, yPos, 1.35, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Eerie ghostly-green headlight photophore on snout tip
    ctx.fillStyle = `rgba(66, 255, 155, ${0.55 + lantern * 0.4})`;
    ctx.beginPath();
    ctx.arc(24.5, 0, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Glossy abyssal highlight
    ctx.fillStyle = 'rgba(180, 165, 235, 0.22)';
    ctx.beginPath();
    ctx.ellipse(6, -6.0, 9.5, 2.4, -0.08, 0, Math.PI * 2);
    ctx.fill();

    // Tiny battle scar
    ctx.strokeStyle = '#FF99B2';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(4, -9.5);
    ctx.lineTo(8.5, -5.5);
    ctx.stroke();

    ctx.restore();

    buildBody();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.2;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  _drawEyes(ctx, st, t) {
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(16.8, side * 7.8);

      if (st === 'stress') {
        ctx.strokeStyle = '#FF204E';
        ctx.lineWidth = 2.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-2.4, side * -2.0);
        ctx.lineTo(1.8, 0);
        ctx.lineTo(-2.4, side * 2.0);
        ctx.stroke();
        ctx.restore();
        continue;
      }

      const r = st === 'shock' ? 4.6 : 3.9;
      // Subtle neon-crimson eye glow
      if (st !== 'shock') {
        ctx.fillStyle = 'rgba(255, 24, 68, 0.25)';
        ctx.beginPath();
        ctx.arc(0.4, 0, r * 1.45, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = st === 'shock' ? '#FFF5F8' : '#160720';
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
        // Wicked glowing neon-crimson iris
        ctx.fillStyle = st === 'hungry' ? '#FF0A38' : '#FF2452';
        ctx.beginPath();
        ctx.arc(0.4, 0, r * 0.74, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#140B1C';
        ctx.beginPath();
        ctx.ellipse(0.6, 0, 0.78, r * 0.58, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(1.4, -1.0, 0.9, 0, Math.PI * 2);
        ctx.arc(-0.5, 1.0, 0.45, 0, Math.PI * 2);
        ctx.fill();

        if (st === 'relax' || st === 'happy') {
          ctx.fillStyle = '#171024';
          ctx.beginPath();
          ctx.arc(0, 0, r + 0.2, Math.PI * 0.95, Math.PI * 2.05);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Angled V-shaped villain brow
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.0;
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (st === 'sad' || st === 'fear') {
        ctx.moveTo(-2.6, side * 4.0);
        ctx.lineTo(3.0, side * 2.2);
      } else {
        ctx.moveTo(-2.6, side * 2.0);
        ctx.lineTo(3.2, side * 4.4);
      }
      ctx.stroke();

      ctx.restore();
    }
  }

  _drawMoodFX(ctx, st, jaw, t) {
    ctx.save();
    if (st === 'eating' || st === 'hungry') {
      const snap = Math.abs(Math.sin(t * 24));
      ctx.fillStyle = '#FFF5F8';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.0;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(25.5 + jaw * 1.8, side * (2.6 + snap));
        ctx.lineTo(30 + jaw * 1.8 + snap, side * 1.2);
        ctx.lineTo(25.5 + jaw * 1.8, side * 0.6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    if (st === 'happy') {
      for (let i = 0; i < 3; i++) {
        const a = t * 3.0 + i * 2.1;
        const sx = 10 + Math.cos(a) * 15;
        const sy = Math.sin(a) * 15;
        const s = 2.2 + Math.sin(t * 8 + i) * 0.7;
        ctx.fillStyle = i % 2 === 0 ? '#FF2452' : '#32FF96';
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
      const b = Math.abs(Math.sin(t * 16)) * 2.4;
      ctx.fillStyle = '#FF2452';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.roundRect(18, -22 - b, 3.2, 8.0, 1.4);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(19.6, -11 - b, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (st === 'fear') {
      const drop = (t * 20) % 10;
      ctx.fillStyle = '#7CE8FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(11, -18 - drop * 0.3);
      ctx.quadraticCurveTo(14.5, -14, 11, -12.5);
      ctx.quadraticCurveTo(7.5, -14, 11, -18 - drop * 0.3);
      ctx.fill();
      ctx.stroke();
    } else if (st === 'stress') {
      const sc = 1 + Math.sin(t * 24) * 0.16;
      ctx.save();
      ctx.translate(10, -15);
      ctx.scale(sc, sc);
      ctx.strokeStyle = '#FF2A4B';
      ctx.lineWidth = 1.9;
      ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(1.1, 1.1);
        ctx.quadraticCurveTo(2.2, 2.2, 3.8, 1.3);
        ctx.stroke();
      }
      ctx.restore();
    } else if (st === 'sad') {
      const fall = (t * 8) % 6;
      ctx.fillStyle = '#60C5FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(16.8, 12 + fall * 0.4);
      ctx.quadraticCurveTo(19, 14.5 + fall * 0.4, 16.8, 16 + fall * 0.4);
      ctx.quadraticCurveTo(14.6, 14.5 + fall * 0.4, 16.8, 12 + fall * 0.4);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
}

export default VillainLanternfish;
