/**
 * Villain Clown Loach (Chromobotia macracanthus — Corrupted Ember Variant)
 * 2D Top-Down Expressive Chibi Villain Fish
 * Scorched-ember orange body, 3 jagged pitch-black spike bands, dark whiskered snout, crimson notched fins.
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
  breathing:  { bend: 0,    finFlare: 0.15, jaw: 0.0,  wagFreq: 2.2,  wagAmp: 0.10, barbSpread: 0.05, pulse: 0.15 },
  swimming:   { bend: 0,    finFlare: 0.45, jaw: 0.05, wagFreq: 7.5,  wagAmp: 0.34, barbSpread: 0.12, pulse: 0.30 },
  relax:      { bend: 0.06, finFlare: 0.05, jaw: 0.0,  wagFreq: 1.3,  wagAmp: 0.06, barbSpread: -0.05, pulse: 0.08 },
  left_turn:  { bend: -0.58, finFlare: 0.72, jaw: 0.05, wagFreq: 5.5, wagAmp: 0.22, barbSpread: 0.22, pulse: 0.28 },
  right_turn: { bend: 0.58,  finFlare: 0.72, jaw: 0.05, wagFreq: 5.5, wagAmp: 0.22, barbSpread: 0.22, pulse: 0.28 },
  eating:     { bend: 0,    finFlare: 0.85, jaw: 1.0,  wagFreq: 9.0,  wagAmp: 0.24, barbSpread: 0.55, pulse: 0.55 },
  hungry:     { bend: 0,    finFlare: 0.55, jaw: 0.42, wagFreq: 6.2,  wagAmp: 0.26, barbSpread: 0.42, pulse: 0.65 },
  stress:     { bend: 0,    finFlare: 0.65, jaw: 0.25, wagFreq: 14.0, wagAmp: 0.16, barbSpread: 0.35, pulse: 0.55 },
  fear:       { bend: 0,    finFlare: 0.90, jaw: 0.30, wagFreq: 16.5, wagAmp: 0.20, barbSpread: -0.25, pulse: 0.40 },
  shock:      { bend: 0,    finFlare: 1.0,  jaw: 0.75, wagFreq: 18.0, wagAmp: 0.12, barbSpread: 0.65, pulse: 0.85 },
  happy:      { bend: 0,    finFlare: 0.50, jaw: 0.18, wagFreq: 5.0,  wagAmp: 0.25, barbSpread: 0.25, pulse: 0.50 },
  sad:        { bend: -0.08, finFlare: -0.15, jaw: 0.0, wagFreq: 1.1, wagAmp: 0.05, barbSpread: -0.30, pulse: 0.05 },
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

export class VillainLoachfish {
  static metadata = {
    name: 'Villain Clown Loach',
    category: 'villain_fish',
    baseLength: 72,
    baseWidth: 30,
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
          for (const cb of [...list]) {
            cb(finished);
          }
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

    const jitterX = (st === 'stress' || st === 'fear' || st === 'shock')
      ? Math.sin(t * 58) * (st === 'shock' ? 1.4 : 0.75)
      : 0;
    const jitterY = (st === 'stress' || st === 'fear' || st === 'shock')
      ? Math.cos(t * 64) * (st === 'shock' ? 1.2 : 0.65)
      : 0;
    ctx.translate(jitterX, jitterY);

    const wag = Math.sin(t * p.wagFreq) * p.wagAmp;
    const tailBend = p.bend + wag;
    const breathe = Math.sin(t * 3.2) * 0.65;

    // 1. Dark Miasma Aura Beneath
    this._drawMiasmaAura(ctx, t, p.pulse, tailBend);

    // 2. Crimson Notched Caudal (Tail) Fin
    this._drawTailFin(ctx, tailBend, t);

    // 3. Battle-Scarred Crimson Pectoral & Pelvic Fins
    this._drawSideFins(ctx, p.finFlare, wag, t);

    // 4. Snout Whiskers (Dark Barbs with Ember Tips)
    this._drawWhiskers(ctx, p.barbSpread, t);

    // 5. Chunky Chibi Scorched-Ember Body + 3 Jagged Pitch-Black Spike Bands
    this._drawBody(ctx, tailBend, breathe, p.jaw, t);

    // 6. Spiky Crimson Dorsal Fin Ridge (Top-Down Crest)
    this._drawDorsalRidge(ctx, tailBend, t);

    // 7. Expressive Villain Chibi Eyes & V-Brows
    this._drawEyes(ctx, st, t);

    // 8. Villain Mouth / Fangs & Mood Overlays
    this._drawMoodFX(ctx, st, p.jaw, t);

    ctx.restore();
  }

  _drawMiasmaAura(ctx, t, pulse, bend) {
    ctx.save();
    const auraR = 38 + Math.sin(t * 3.5) * 2.5 + pulse * 5;
    const grad = ctx.createRadialGradient(-2, 0, 6, -4, bend * 6, auraR);
    grad.addColorStop(0, 'rgba(30, 8, 42, 0.52)');
    grad.addColorStop(0.55, 'rgba(130, 18, 28, 0.20)');
    grad.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(-3, bend * 3, auraR, 21 + pulse * 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Subtle rising ember motes around aura
    ctx.fillStyle = `rgba(255, 90, 32, ${0.28 + 0.15 * Math.sin(t * 5)})`;
    for (let i = 0; i < 4; i++) {
      const a = t * 1.4 + i * 1.57;
      const mx = Math.cos(a) * 28 - 4;
      const my = Math.sin(a) * 14;
      ctx.beginPath();
      ctx.arc(mx, my, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  _drawTailFin(ctx, bend, t) {
    ctx.save();
    const baseX = -24;
    const baseY = bend * 5;
    ctx.translate(baseX, baseY);
    ctx.rotate(bend * 0.72);

    const grad = ctx.createLinearGradient(0, 0, -16, 0);
    grad.addColorStop(0, '#7A1120');
    grad.addColorStop(0.55, '#D92626');
    grad.addColorStop(1, '#FF6A2B');

    ctx.fillStyle = grad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.1;
    ctx.lineJoin = 'round';

    // Forked crimson tail with battle notch on upper lobe
    ctx.beginPath();
    ctx.moveTo(2, -3.5);
    ctx.quadraticCurveTo(-6, -12, -14.5, -14.5);
    ctx.lineTo(-11.5, -9.5);
    ctx.lineTo(-14.0, -7.2); // battle notch
    ctx.lineTo(-10.2, -5.0);
    ctx.quadraticCurveTo(-7.5, 0, -10.2, 5.0);
    ctx.lineTo(-14.5, 13.5);
    ctx.quadraticCurveTo(-6, 11.5, 2, 3.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Fin rays
    ctx.strokeStyle = 'rgba(20, 11, 28, 0.45)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(-1, -2); ctx.lineTo(-11, -10);
    ctx.moveTo(-1, 2);  ctx.lineTo(-11, 10);
    ctx.stroke();

    // Glowing edge flicker
    ctx.strokeStyle = `rgba(255, 145, 50, ${0.4 + 0.25 * Math.sin(t * 7)})`;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(-13.5, -13.5);
    ctx.lineTo(-11.5, -9.5);
    ctx.stroke();
    ctx.restore();
  }

  _drawSideFins(ctx, flare, wag, t) {
    const flutter = Math.sin(t * 6.5) * 0.08;
    const drawPec = (side) => {
      ctx.save();
      ctx.translate(10, side * 11.5);
      const rot = side * (0.35 + flare * 0.55 + flutter) + wag * 0.25;
      ctx.rotate(rot);

      const g = ctx.createLinearGradient(0, 0, -12, side * 10);
      g.addColorStop(0, '#590C19');
      g.addColorStop(0.6, '#C91E2A');
      g.addColorStop(1, '#FF682C');

      ctx.fillStyle = g;
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.0;
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.quadraticCurveTo(-1, side * 11, -10, side * 12.5);
      // Notched tear
      ctx.lineTo(-8.5, side * 8.5);
      ctx.lineTo(-11.5, side * 6.5);
      ctx.quadraticCurveTo(-8, side * 2, -2, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 190, 90, 0.35)';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(1, side * 2);
      ctx.lineTo(-7, side * 9.5);
      ctx.stroke();
      ctx.restore();
    };

    const drawPelvic = (side) => {
      ctx.save();
      ctx.translate(-8, side * 9.2);
      ctx.rotate(side * (0.5 + flare * 0.35) + wag * 0.3);
      ctx.fillStyle = '#B81B2A';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.7;
      ctx.beginPath();
      ctx.moveTo(2, 0);
      ctx.quadraticCurveTo(-2, side * 7, -8.5, side * 7.5);
      ctx.quadraticCurveTo(-6, side * 2, -2, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    };

    drawPec(-1);
    drawPec(1);
    drawPelvic(-1);
    drawPelvic(1);
  }

  _drawWhiskers(ctx, spread, t) {
    ctx.save();
    const twitch = Math.sin(t * 11) * 0.08;
    const drawPair = (side) => {
      const s = side;
      ctx.strokeStyle = OUTLINE;
      ctx.lineCap = 'round';

      // Outer long whisker
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(29, s * 3.5);
      ctx.quadraticCurveTo(34, s * (7.5 + spread * 5), 37.5, s * (10.5 + spread * 6 + twitch * 4));
      ctx.stroke();

      ctx.strokeStyle = '#FF5722';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(33.5, s * (7.2 + spread * 4.5));
      ctx.lineTo(37.2, s * (10.3 + spread * 5.8 + twitch * 4));
      ctx.stroke();

      // Inner shorter whisker
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.9;
      ctx.beginPath();
      ctx.moveTo(31.5, s * 2.0);
      ctx.quadraticCurveTo(35.5, s * (4.2 + spread * 3), 38.5, s * (5.2 + spread * 4));
      ctx.stroke();
    };
    drawPair(-1);
    drawPair(1);
    ctx.restore();
  }

  _drawBody(ctx, bend, breathe, jaw, t) {
    ctx.save();
    const wMod = 1 + breathe * 0.03;
    const snoutExtend = jaw * 2.2;

    // Define chunky chibi loach silhouette (front-heavy torpedo)
    const buildBodyPath = () => {
      ctx.beginPath();
      ctx.moveTo(33 + snoutExtend, 0);
      // Upper flank
      ctx.bezierCurveTo(31 + snoutExtend, -9.5 * wMod, 19, -15.5 * wMod, 4, -14.2 * wMod);
      ctx.bezierCurveTo(-9, -13.0 * wMod, -18, -7.2 + bend * 3.2, -25, -3.6 + bend * 5.2);
      // Tail peduncle
      ctx.lineTo(-25, 3.6 + bend * 5.2);
      // Lower flank
      ctx.bezierCurveTo(-18, 7.2 + bend * 3.2, -9, 13.0 * wMod, 4, 14.2 * wMod);
      ctx.bezierCurveTo(19, 15.5 * wMod, 31 + snoutExtend, 9.5 * wMod, 33 + snoutExtend, 0);
      ctx.closePath();
    };

    // Base scorched-ember gradient
    const bodyGrad = ctx.createLinearGradient(32, -14, -24, 14);
    bodyGrad.addColorStop(0, '#FF7B24');
    bodyGrad.addColorStop(0.45, '#E8491B');
    bodyGrad.addColorStop(0.85, '#9E1F16');
    bodyGrad.addColorStop(1, '#5A1014');

    buildBodyPath();
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    // Clip inside body for jagged bands, cel-shading, battle scars, and glossy highlight
    ctx.save();
    buildBodyPath();
    ctx.clip();

    // 3 Jagged Pitch-Black Spike Bands
    ctx.fillStyle = '#190E22';
    // Band 1: Mask across eye/forehead
    ctx.beginPath();
    ctx.moveTo(22, -17);
    ctx.lineTo(25.5, -9);
    ctx.lineTo(22.5, -3);
    ctx.lineTo(25.5, 0);
    ctx.lineTo(22.5, 3);
    ctx.lineTo(25.5, 9);
    ctx.lineTo(22, 17);
    ctx.lineTo(13.5, 17);
    ctx.lineTo(16.5, 8);
    ctx.lineTo(13.5, 0);
    ctx.lineTo(16.5, -8);
    ctx.lineTo(13.5, -17);
    ctx.closePath();
    ctx.fill();

    // Band 2: Thick central spiked saddle
    ctx.beginPath();
    ctx.moveTo(5, -17);
    ctx.lineTo(8.5, -8);
    ctx.lineTo(4.8, -2);
    ctx.lineTo(8.2, 2);
    ctx.lineTo(5.2, 9);
    ctx.lineTo(4, 17);
    ctx.lineTo(-5.5, 17);
    ctx.lineTo(-2.5, 8.5);
    ctx.lineTo(-6.2, 0);
    ctx.lineTo(-2.5, -8.5);
    ctx.lineTo(-5.5, -17);
    ctx.closePath();
    ctx.fill();

    // Band 3: Posterior jagged band
    ctx.beginPath();
    ctx.moveTo(-12.5, -14 + bend * 2);
    ctx.lineTo(-9.5, -4 + bend * 2.5);
    ctx.lineTo(-13, 0 + bend * 3);
    ctx.lineTo(-9.5, 4 + bend * 3.5);
    ctx.lineTo(-12.5, 14 + bend * 4);
    ctx.lineTo(-20.5, 14 + bend * 5);
    ctx.lineTo(-17.8, 3 + bend * 4.5);
    ctx.lineTo(-20.5, -14 + bend * 4);
    ctx.closePath();
    ctx.fill();

    // Sinister ember rune trim along middle band
    const glowAlpha = 0.55 + 0.3 * Math.sin(t * 4.5);
    ctx.strokeStyle = `rgba(255, 118, 36, ${glowAlpha})`;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(0.5, -5.5);
    ctx.lineTo(3.2, 0);
    ctx.lineTo(0.5, 5.5);
    ctx.lineTo(-2.2, 0);
    ctx.closePath();
    ctx.stroke();

    // Dark cel-shading on lower/outer flanks
    const shadeGrad = ctx.createLinearGradient(0, -15, 0, 15);
    shadeGrad.addColorStop(0, 'rgba(255, 200, 120, 0.14)');
    shadeGrad.addColorStop(0.32, 'rgba(0, 0, 0, 0)');
    shadeGrad.addColorStop(0.75, 'rgba(20, 8, 30, 0.28)');
    shadeGrad.addColorStop(1, 'rgba(14, 5, 24, 0.52)');
    ctx.fillStyle = shadeGrad;
    ctx.fillRect(-30, -18, 70, 36);

    // Glossy dorsal highlight strip
    ctx.fillStyle = 'rgba(255, 224, 168, 0.34)';
    ctx.beginPath();
    ctx.ellipse(9, -6.5, 11.5, 2.8, -0.08, 0, Math.PI * 2);
    ctx.fill();

    // Battle scar across left shoulder
    ctx.strokeStyle = '#FFD2B8';
    ctx.lineWidth = 1.25;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(8, -10);
    ctx.lineTo(12.5, -5.5);
    ctx.stroke();
    ctx.strokeStyle = '#8F1622';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(8.5, -9.2);
    ctx.lineTo(12.0, -5.8);
    ctx.stroke();

    ctx.restore(); // end clip

    // Bold dark-obsidian outline
    buildBodyPath();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.4;
    ctx.lineJoin = 'round';
    ctx.stroke();

    ctx.restore();
  }

  _drawDorsalRidge(ctx, bend, t) {
    ctx.save();
    const sway = Math.sin(t * 5.2) * 0.8 + bend * 2.5;
    ctx.fillStyle = '#C91D28';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.8;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(6, 0);
    ctx.lineTo(1, -2.5 + sway * 0.3);
    ctx.lineTo(-3, 0.4 + sway * 0.5);
    ctx.lineTo(-7, -2.2 + sway * 0.7);
    ctx.lineTo(-12, 0.6 + sway * 0.9);
    ctx.lineTo(-16, -1.6 + sway);
    ctx.lineTo(-14, 2.2 + sway * 0.8);
    ctx.lineTo(-4, 2.6 + sway * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  _drawEyes(ctx, st, t) {
    const drawSingleEye = (side) => {
      ctx.save();
      const ex = 21.5;
      const ey = side * 8.0;
      ctx.translate(ex, ey);

      if (st === 'stress') {
        // Scrunched > < eyes
        ctx.strokeStyle = '#FF5232';
        ctx.lineWidth = 2.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-2.5, side * -2.2);
        ctx.lineTo(1.8, 0);
        ctx.lineTo(-2.5, side * 2.2);
        ctx.stroke();
        ctx.restore();
        return;
      }

      const r = st === 'shock' ? 4.4 : 3.5;

      // Sclera / glowing socket
      ctx.fillStyle = st === 'shock' ? '#FFF5E6' : '#260E1F';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.7;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (st === 'shock') {
        // Tiny rattled O-pupil
        ctx.fillStyle = '#140B1C';
        ctx.beginPath();
        ctx.arc(0.8, 0, 1.25, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Glowing ember iris
        const irisColor = st === 'hungry' ? '#FF2A1F' : (st === 'sad' ? '#D46B3B' : '#FFAE19');
        ctx.fillStyle = irisColor;
        ctx.beginPath();
        ctx.arc(0.4, 0, r * 0.68, 0, Math.PI * 2);
        ctx.fill();

        // Sharp slit pupil
        ctx.fillStyle = '#140B1C';
        ctx.beginPath();
        ctx.ellipse(0.6, 0, 0.75, r * 0.56, 0, 0, Math.PI * 2);
        ctx.fill();

        // Dual catchlights
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(1.3, -1.0, 0.9, 0, Math.PI * 2);
        ctx.arc(-0.5, 1.1, 0.45, 0, Math.PI * 2);
        ctx.fill();

        // Half-lidded relax / happy smugness
        if (st === 'relax' || st === 'happy') {
          ctx.fillStyle = '#1A0E24';
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
        ctx.moveTo(-2.5, side * 3.8);
        ctx.lineTo(3.2, side * 2.2);
      } else {
        ctx.moveTo(-2.8, side * 2.0);
        ctx.lineTo(3.2, side * 4.2);
      }
      ctx.stroke();

      ctx.restore();
    };

    drawSingleEye(-1);
    drawSingleEye(1);
  }

  _drawMoodFX(ctx, st, jaw, t) {
    ctx.save();

    // Snapping fangs during eating / hungry
    if (st === 'eating' || st === 'hungry') {
      const snap = st === 'eating' ? Math.abs(Math.sin(t * 24)) : (0.5 + 0.5 * Math.sin(t * 10));
      const mx = 32 + jaw * 1.8;
      ctx.fillStyle = '#FFF7EE';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.1;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(mx - 1.5, side * (2.6 + snap * 1.4));
        ctx.lineTo(mx + 2.8 + snap * 1.6, side * (1.2 + snap * 0.6));
        ctx.lineTo(mx - 1.5, side * 0.6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    if (st === 'happy') {
      // Smug evil cackle smirk + dark purple/red sparkles
      ctx.strokeStyle = '#FF5A36';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(28, 0, 3.2, -0.8, 0.8);
      ctx.stroke();

      for (let i = 0; i < 3; i++) {
        const a = t * 3 + i * 2.1;
        const sx = 14 + Math.cos(a) * 16;
        const sy = Math.sin(a) * 16;
        const s = 2.2 + Math.sin(t * 8 + i) * 0.8;
        ctx.fillStyle = i % 2 === 0 ? '#D92662' : '#A855F7';
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
      // Exclamation mark '!'
      const bounce = Math.abs(Math.sin(t * 16)) * 2.5;
      ctx.fillStyle = '#FF3B30';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.roundRect(24, -22 - bounce, 3.4, 8.5, 1.5);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(25.7, -10.5 - bounce, 1.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (st === 'fear') {
      // Panicking villain sweat drops
      const drop = (t * 20) % 10;
      ctx.fillStyle = '#7CE8FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(15, -16 - drop * 0.3);
      ctx.quadraticCurveTo(18.5, -12, 15, -10.5);
      ctx.quadraticCurveTo(11.5, -12, 15, -16 - drop * 0.3);
      ctx.fill();
      ctx.stroke();
    } else if (st === 'stress') {
      // Twitching anime anger/stress vein mark
      const pulse = 1 + Math.sin(t * 24) * 0.16;
      ctx.save();
      ctx.translate(14, -14);
      ctx.scale(pulse, pulse);
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
      // Sulking teardrop
      const fall = (t * 8) % 6;
      ctx.fillStyle = '#60C5FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(22, 11 + fall * 0.4);
      ctx.quadraticCurveTo(24.5, 14 + fall * 0.4, 22, 15.5 + fall * 0.4);
      ctx.quadraticCurveTo(19.5, 14 + fall * 0.4, 22, 11 + fall * 0.4);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }
}

export default VillainLoachfish;
