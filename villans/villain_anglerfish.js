/**
 * Villain Deep-Sea Anglerfish (Melanocetus — Pitch-Violet Nightmare Chibi Variant)
 * 2D Top-Down Expressive Chibi Villain Fish
 * Pitch-violet nightmare chibi head, massive double-row razor grin, hypnotic blood-crimson glowing lure with sinister radial aura.
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
  breathing:  { bend: 0,     finFlare: 0.20, jaw: 0.15, lureGlow: 0.65, wagFreq: 2.0,  wagAmp: 0.10 },
  swimming:   { bend: 0,     finFlare: 0.55, jaw: 0.25, lureGlow: 0.80, wagFreq: 6.4,  wagAmp: 0.28 },
  relax:      { bend: 0.05,  finFlare: 0.08, jaw: 0.05, lureGlow: 0.40, wagFreq: 1.2,  wagAmp: 0.05 },
  left_turn:  { bend: -0.52, finFlare: 0.78, jaw: 0.20, lureGlow: 0.75, wagFreq: 4.8,  wagAmp: 0.20 },
  right_turn: { bend: 0.52,  finFlare: 0.78, jaw: 0.20, lureGlow: 0.75, wagFreq: 4.8,  wagAmp: 0.20 },
  eating:     { bend: 0,     finFlare: 0.90, jaw: 1.0,  lureGlow: 1.0,  wagFreq: 8.5,  wagAmp: 0.20 },
  hungry:     { bend: 0,     finFlare: 0.65, jaw: 0.72, lureGlow: 1.0,  wagFreq: 5.5,  wagAmp: 0.22 },
  stress:     { bend: 0,     finFlare: 0.75, jaw: 0.45, lureGlow: 0.90, wagFreq: 13.5, wagAmp: 0.14 },
  fear:       { bend: 0,     finFlare: 0.92, jaw: 0.35, lureGlow: 0.20, wagFreq: 15.5, wagAmp: 0.18 },
  shock:      { bend: 0,     finFlare: 1.0,  jaw: 0.85, lureGlow: 1.0,  wagFreq: 17.5, wagAmp: 0.12 },
  happy:      { bend: 0,     finFlare: 0.55, jaw: 0.40, lureGlow: 0.92, wagFreq: 4.6,  wagAmp: 0.22 },
  sad:        { bend: -0.06, finFlare: -0.1, jaw: 0.0,  lureGlow: 0.22, wagFreq: 1.1,  wagAmp: 0.05 },
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

export class VillainAnglerfish {
  static metadata = {
    name: 'Villain Deep-Sea Anglerfish',
    category: 'villain_fish',
    baseLength: 100,
    baseWidth: 64,
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
    const breathe = Math.sin(t * 2.8) * 1.1;

    // 1. Abyssal Miasma Aura
    this._drawMiasma(ctx, t, p.lureGlow);

    // 2. Tattered Violet-Black Tail Fin
    this._drawTail(ctx, bend);

    // 3. Spiky Side Pectoral Fins
    this._drawPectorals(ctx, p.finFlare, wag);

    // 4. Massive Double-Row Razor Grin (Protruding Chibi Jaw)
    this._drawRazorJaw(ctx, p.jaw, st, t);

    // 5. Pitch-Violet Nightmare Chibi Bulbous Body
    this._drawBody(ctx, bend, breathe, t);

    // 6. Spiky Dorsal Spine & Glowing Runes
    this._drawBackSpines(ctx, bend, t);

    // 7. Expressive Villain Chibi Eyes
    this._drawEyes(ctx, st, t);

    // 8. Hypnotic Blood-Crimson Glowing Lure Stalk & Sinister Radial Aura
    this._drawLure(ctx, p.lureGlow, bend, t);

    // 9. Mood Overlays
    this._drawMoodFX(ctx, st, t);

    ctx.restore();
  }

  _drawMiasma(ctx, t, glow) {
    ctx.save();
    const rx = 50 + Math.sin(t * 2.5) * 2.5;
    const grad = ctx.createRadialGradient(4, 0, 12, 0, 0, rx);
    grad.addColorStop(0, 'rgba(18, 6, 32, 0.62)');
    grad.addColorStop(0.62, `rgba(120, 14, 58, ${0.18 + glow * 0.14})`);
    grad.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, 34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawTail(ctx, bend) {
    ctx.save();
    ctx.translate(-34, bend * 6.5);
    ctx.rotate(bend * 0.72);

    const g = ctx.createLinearGradient(0, 0, -18, 0);
    g.addColorStop(0, '#27133B');
    g.addColorStop(0.65, '#4A1B59');
    g.addColorStop(1, '#B3193B');

    ctx.fillStyle = g;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.2;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(2, -4.5);
    ctx.quadraticCurveTo(-8, -14, -17, -16);
    ctx.lineTo(-13, -8.5);
    ctx.lineTo(-16.5, -4);
    ctx.lineTo(-11, 0);
    ctx.lineTo(-16.5, 5.5);
    ctx.lineTo(-13, 9.5);
    ctx.lineTo(-17, 15.5);
    ctx.quadraticCurveTo(-8, 13.5, 2, 4.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  _drawPectorals(ctx, flare, wag) {
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(-2, side * 22);
      ctx.rotate(side * (0.35 + flare * 0.45) + wag * 0.25);

      const g = ctx.createLinearGradient(0, 0, -14, side * 12);
      g.addColorStop(0, '#2D1542');
      g.addColorStop(0.7, '#581E61');
      g.addColorStop(1, '#C41C44');

      ctx.fillStyle = g;
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.1;
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(5, 0);
      ctx.quadraticCurveTo(0, side * 11, -11, side * 12);
      ctx.lineTo(-9, side * 7.5);
      ctx.lineTo(-13, side * 5);
      ctx.quadraticCurveTo(-7, side * 2, -2, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawRazorJaw(ctx, jaw, st, t) {
    ctx.save();
    const chomp = st === 'eating' ? Math.abs(Math.sin(t * 22)) * 4.5 : jaw * 4.2;
    const jx = 27 + chomp;

    // Underbite lower jaw crescent
    ctx.fillStyle = '#1E0D2E';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(15, -20.5);
    ctx.bezierCurveTo(31 + chomp, -19, 36 + chomp, -8, 36 + chomp, 0);
    ctx.bezierCurveTo(36 + chomp, 8, 31 + chomp, 19, 15, 20.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner glowing crimson mouth cavern
    ctx.fillStyle = '#4A081E';
    ctx.beginPath();
    ctx.ellipse(23 + chomp * 0.6, 0, 9.5, 16.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Double-row gleaming needle fangs
    const outerFangs = [-15, -10.5, -5.5, 0, 5.5, 10.5, 15];
    ctx.fillStyle = '#FFF5F7';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.25;
    for (let i = 0; i < outerFangs.length; i++) {
      const fy = outerFangs[i];
      const fx = jx + 5.5 - Math.abs(fy) * 0.35;
      const len = (i % 2 === 0 ? 7.2 : 5.0) + jaw * 1.4;
      ctx.beginPath();
      ctx.moveTo(fx - 2.2, fy - 1.8);
      ctx.lineTo(fx + len, fy * 0.85);
      ctx.lineTo(fx - 2.2, fy + 1.8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Inner crimson-tinted second row of smaller fangs
    const innerFangs = [-12, -7.5, -2.5, 2.5, 7.5, 12];
    ctx.fillStyle = '#FFD1DC';
    for (const fy of innerFangs) {
      const fx = jx + 1.5 - Math.abs(fy) * 0.32;
      ctx.beginPath();
      ctx.moveTo(fx - 1.5, fy - 1.2);
      ctx.lineTo(fx + 4.2, fy * 0.88);
      ctx.lineTo(fx - 1.5, fy + 1.2);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  _drawBody(ctx, bend, breathe, t) {
    ctx.save();
    const w = 1 + breathe * 0.025;

    const buildBody = () => {
      ctx.beginPath();
      // Massive round chibi nightmare head tapering abruptly to short tail
      ctx.moveTo(29, 0);
      ctx.bezierCurveTo(28, -16 * w, 16, -26.5 * w, -2, -23.5 * w);
      ctx.bezierCurveTo(-17, -20.5 * w, -25, -10 + bend * 3.5, -35, -4.5 + bend * 6.5);
      ctx.lineTo(-35, 4.5 + bend * 6.5);
      ctx.bezierCurveTo(-25, 10 + bend * 3.5, -17, 20.5 * w, -2, 23.5 * w);
      ctx.bezierCurveTo(16, 26.5 * w, 28, 16 * w, 29, 0);
      ctx.closePath();
    };

    const g = ctx.createRadialGradient(8, -6, 4, -2, 0, 38);
    g.addColorStop(0, '#49226B');
    g.addColorStop(0.5, '#2A1242');
    g.addColorStop(0.88, '#170926');
    g.addColorStop(1, '#0F061A');

    buildBody();
    ctx.fillStyle = g;
    ctx.fill();

    ctx.save();
    buildBody();
    ctx.clip();

    // Glowing sinister runes along flanks
    const rAlpha = 0.45 + 0.35 * Math.sin(t * 4.0);
    ctx.strokeStyle = `rgba(255, 38, 86, ${rAlpha})`;
    ctx.lineWidth = 1.4;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(10, side * 16);
      ctx.lineTo(4, side * 13);
      ctx.lineTo(-3, side * 16.5);
      ctx.lineTo(-9, side * 12);
      ctx.stroke();
    }

    // Cel-shading shadow on lower/back edge
    ctx.fillStyle = 'rgba(10, 4, 18, 0.36)';
    ctx.beginPath();
    ctx.ellipse(-4, 15, 34, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Glossy abyssal dome highlight
    ctx.fillStyle = 'rgba(182, 130, 255, 0.20)';
    ctx.beginPath();
    ctx.ellipse(6, -10, 14, 5.2, -0.15, 0, Math.PI * 2);
    ctx.fill();

    // Battle scar across brow
    ctx.strokeStyle = '#FF9EB5';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(11, -14);
    ctx.lineTo(18, -8);
    ctx.stroke();

    ctx.restore();

    buildBody();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.6;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  _drawBackSpines(ctx, bend, t) {
    ctx.save();
    ctx.fillStyle = '#3B1652';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.8;
    const sway = Math.sin(t * 4.2) * 0.8 + bend * 2.5;

    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.lineTo(-10, -4.2 + sway * 0.5);
    ctx.lineTo(-15, 0.5 + sway * 0.7);
    ctx.lineTo(-22, -3.5 + sway);
    ctx.lineTo(-28, 0.5 + sway * 1.2);
    ctx.lineTo(-20, 3.2 + sway * 0.9);
    ctx.lineTo(-9, 3.0 + sway * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  _drawEyes(ctx, st, t) {
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(16.5, side * 12.2);

      if (st === 'stress') {
        ctx.strokeStyle = '#FF2A5E';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-3.2, side * -2.6);
        ctx.lineTo(2.4, 0);
        ctx.lineTo(-3.2, side * 2.6);
        ctx.stroke();
        ctx.restore();
        continue;
      }

      const r = st === 'shock' ? 5.6 : 4.5;
      ctx.fillStyle = st === 'shock' ? '#FFF5F8' : '#160721';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.9;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (st === 'shock') {
        ctx.fillStyle = '#140B1C';
        ctx.beginPath();
        ctx.arc(0.8, 0, 1.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Hypnotic blazing crimson/amber iris
        ctx.fillStyle = st === 'hungry' ? '#FF143C' : '#FF3B5C';
        ctx.beginPath();
        ctx.arc(0.5, 0, r * 0.72, 0, Math.PI * 2);
        ctx.fill();

        // Menacing slit pupil
        ctx.fillStyle = '#140B1C';
        ctx.beginPath();
        ctx.ellipse(0.8, 0, 0.9, r * 0.58, 0, 0, Math.PI * 2);
        ctx.fill();

        // Dual catchlights
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(1.7, -1.2, 1.1, 0, Math.PI * 2);
        ctx.arc(-0.7, 1.4, 0.55, 0, Math.PI * 2);
        ctx.fill();

        if (st === 'relax' || st === 'happy') {
          ctx.fillStyle = '#2A1242';
          ctx.beginPath();
          ctx.arc(0, 0, r + 0.25, Math.PI * 0.95, Math.PI * 2.05);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Heavy V-shaped villain brow
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (st === 'sad' || st === 'fear') {
        ctx.moveTo(-3.5, side * 5.0);
        ctx.lineTo(3.8, side * 2.8);
      } else {
        ctx.moveTo(-3.5, side * 2.5);
        ctx.lineTo(4.0, side * 5.4);
      }
      ctx.stroke();

      ctx.restore();
    }
  }

  _drawLure(ctx, glow, bend, t) {
    ctx.save();
    const bobY = Math.sin(t * 3.8) * 3.2 - bend * 6;
    const tipX = 45.5;
    const tipY = bobY;

    // Sinister radial crimson aura around lure bulb
    const auraR = 16 + glow * 10 + Math.sin(t * 6) * 2.5;
    const grad = ctx.createRadialGradient(tipX, tipY, 2, tipX, tipY, auraR);
    grad.addColorStop(0, `rgba(255, 36, 78, ${0.55 + glow * 0.35})`);
    grad.addColorStop(0.45, `rgba(210, 14, 52, ${0.22 + glow * 0.2})`);
    grad.addColorStop(1, 'rgba(210, 14, 52, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(tipX, tipY, auraR, 0, Math.PI * 2);
    ctx.fill();

    // Hypnotic pulsing ring
    const ringR = 5.5 + ((t * 10) % 10);
    ctx.strokeStyle = `rgba(255, 70, 110, ${Math.max(0, 0.5 - (ringR - 5.5) * 0.05) * glow})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(tipX, tipY, ringR, 0, Math.PI * 2);
    ctx.stroke();

    // Curved armored stalk (illicium) from forehead to lure
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.quadraticCurveTo(28, bobY * 0.55, tipX - 3, tipY);
    ctx.stroke();

    ctx.strokeStyle = '#6B2A82';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.quadraticCurveTo(28, bobY * 0.55, tipX - 3, tipY);
    ctx.stroke();

    // Blood-crimson glowing lure bulb (esca) with wicked spikes
    ctx.fillStyle = '#FF1E4B';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(tipX, tipY, 4.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Hot white-pink inner core
    ctx.fillStyle = '#FFE4EB';
    ctx.beginPath();
    ctx.arc(tipX + 0.8, tipY - 0.8, 1.9, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  _drawMoodFX(ctx, st, t) {
    ctx.save();
    if (st === 'happy') {
      for (let i = 0; i < 4; i++) {
        const a = t * 2.5 + i * 1.57;
        const sx = 6 + Math.cos(a) * 26;
        const sy = Math.sin(a) * 26;
        const s = 2.6 + Math.sin(t * 8 + i) * 0.8;
        ctx.fillStyle = i % 2 === 0 ? '#FF1E56' : '#C084FC';
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
      ctx.fillStyle = '#FF264E';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.roundRect(18, -32 - b, 4.0, 10, 1.8);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(20, -19 - b, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (st === 'fear') {
      const drop = (t * 18) % 10;
      ctx.fillStyle = '#7CE8FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(10, -27 - drop * 0.3);
      ctx.quadraticCurveTo(14.5, -22, 10, -20.5);
      ctx.quadraticCurveTo(5.5, -22, 10, -27 - drop * 0.3);
      ctx.fill();
      ctx.stroke();
    } else if (st === 'stress') {
      const sc = 1 + Math.sin(t * 24) * 0.16;
      ctx.save();
      ctx.translate(10, -24);
      ctx.scale(sc, sc);
      ctx.strokeStyle = '#FF2A4B';
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(1.5, 1.5);
        ctx.quadraticCurveTo(3, 3, 5.2, 1.8);
        ctx.stroke();
      }
      ctx.restore();
    } else if (st === 'sad') {
      const fall = (t * 8) % 6;
      ctx.fillStyle = '#60C5FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(16.5, 18 + fall * 0.4);
      ctx.quadraticCurveTo(19.5, 21.5 + fall * 0.4, 16.5, 23 + fall * 0.4);
      ctx.quadraticCurveTo(13.5, 21.5 + fall * 0.4, 16.5, 18 + fall * 0.4);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
}

export default VillainAnglerfish;
