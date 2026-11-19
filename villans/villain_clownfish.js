/**
 * Villain Clownfish — Standalone 2D Top-Down Expressive Chibi Villain ES Module
 * Concept: Charred volcanic-orange & obsidian body, jagged cracked ash-white bands
 * with crimson borders, notched fins, wicked fanged grin, glowing ember eyes.
 */

const OUTLINE = '#140B1C';
const ONE_SHOT_STATES = new Set(['left_turn', 'right_turn', 'eating', 'shock']);
const LOCKED_IGNORED = new Set(['left_turn', 'right_turn', 'relax', 'happy', 'eating']);

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

const ONE_SHOT_DURATIONS = {
  left_turn: 0.55,
  right_turn: 0.55,
  eating: 0.65,
  shock: 0.75,
};

const POSES = {
  breathing:  { tailFreq: 3.2, tailAmp: 0.18, finRate: 2.6, finSpread: 0.45, bend: 0.0,  mouth: 0.12, brow: 0.42, eyeOpen: 1.0,  aura: 0.45, jitter: 0.0 },
  swimming:   { tailFreq: 7.4, tailAmp: 0.36, finRate: 6.2, finSpread: 0.28, bend: 0.0,  mouth: 0.18, brow: 0.52, eyeOpen: 1.0,  aura: 0.65, jitter: 0.0 },
  relax:      { tailFreq: 1.8, tailAmp: 0.11, finRate: 1.6, finSpread: 0.65, bend: 0.0,  mouth: 0.08, brow: 0.25, eyeOpen: 0.48, aura: 0.35, jitter: 0.0 },
  left_turn:  { tailFreq: 6.8, tailAmp: 0.30, finRate: 5.0, finSpread: 0.55, bend: -0.58, mouth: 0.16, brow: 0.50, eyeOpen: 1.0,  aura: 0.60, jitter: 0.0 },
  right_turn: { tailFreq: 6.8, tailAmp: 0.30, finRate: 5.0, finSpread: 0.55, bend: 0.58,  mouth: 0.16, brow: 0.50, eyeOpen: 1.0,  aura: 0.60, jitter: 0.0 },
  eating:     { tailFreq: 8.5, tailAmp: 0.28, finRate: 7.0, finSpread: 0.50, bend: 0.0,  mouth: 1.0,  brow: 0.78, eyeOpen: 1.05, aura: 0.85, jitter: 0.15 },
  hungry:     { tailFreq: 5.5, tailAmp: 0.26, finRate: 4.8, finSpread: 0.42, bend: 0.0,  mouth: 0.72, brow: 0.82, eyeOpen: 1.12, aura: 0.90, jitter: 0.12 },
  stress:     { tailFreq: 9.2, tailAmp: 0.16, finRate: 8.0, finSpread: 0.35, bend: 0.0,  mouth: 0.35, brow: 0.90, eyeOpen: 0.30, aura: 0.80, jitter: 1.10 },
  fear:       { tailFreq: 10.5, tailAmp: 0.24, finRate: 9.5, finSpread: 0.75, bend: 0.0,  mouth: 0.55, brow: -0.45, eyeOpen: 1.32, aura: 0.25, jitter: 1.35 },
  shock:      { tailFreq: 2.0, tailAmp: 0.06, finRate: 2.0, finSpread: 0.85, bend: 0.0,  mouth: 0.78, brow: -0.55, eyeOpen: 1.45, aura: 0.20, jitter: 1.60 },
  happy:      { tailFreq: 5.8, tailAmp: 0.32, finRate: 5.2, finSpread: 0.60, bend: 0.0,  mouth: 0.62, brow: 0.35, eyeOpen: 0.72, aura: 0.95, jitter: 0.0 },
  sad:        { tailFreq: 1.4, tailAmp: 0.09, finRate: 1.2, finSpread: 0.18, bend: 0.0,  mouth: 0.04, brow: -0.32, eyeOpen: 0.68, aura: 0.22, jitter: 0.0 },
};

function cubicEaseInOut(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export class VillainClownfish {
  static metadata = {
    name: 'Villain Clownfish',
    category: 'villain_fish',
    baseLength: 65,
    baseWidth: 34,
  };

  constructor(x = 0, y = 0, scale = 1) {
    this.x = x;
    this.y = y;
    this.scale = scale;
    this.angle = 0;

    this._state = 'breathing';
    this._previousState = 'breathing';
    this._stateTime = 0;
    this._time = 0;
    this._phase = 0;
    this._finPhase = 0;

    this._blendDuration = 0.15;
    this._blendElapsed = 0.15;
    this._fromPose = { ...POSES.breathing };
    this._targetPose = { ...POSES.breathing };
    this._pose = { ...POSES.breathing };

    this._callbacks = new Map();
  }

  getState() {
    return this._state;
  }

  setAngle(radians) {
    if (Number.isFinite(radians)) this.angle = radians;
  }

  setDirection(dx, dy) {
    if ((dx !== 0 || dy !== 0) && Number.isFinite(dx) && Number.isFinite(dy)) {
      this.angle = Math.atan2(dy, dx);
    }
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
    const next = STATE_ALIASES[name] || name;
    if (!VALID_STATES.has(next)) return;

    if ((this._state === 'shock' || this._state === 'fear') && LOCKED_IGNORED.has(next)) {
      return;
    }

    if (next === this._state && !ONE_SHOT_STATES.has(next)) return;

    if (ONE_SHOT_STATES.has(next) && !ONE_SHOT_STATES.has(this._state)) {
      this._previousState = this._state;
    }

    this._state = next;
    this._stateTime = 0;
    this._fromPose = { ...this._pose };
    this._targetPose = { ...POSES[next] };
    this._blendElapsed = 0;
  }

  _emitFinished(stateName) {
    const list = this._callbacks.get(stateName);
    if (!list) return;
    for (const cb of list) {
      cb(stateName);
    }
  }

  update(dt) {
    const delta = Number.isFinite(dt) && dt > 0 ? dt : 0;
    this._time += delta;
    this._stateTime += delta;

    if (this._blendElapsed < this._blendDuration) {
      this._blendElapsed = Math.min(this._blendDuration, this._blendElapsed + delta);
      const t = cubicEaseInOut(this._blendElapsed / this._blendDuration);
      for (const k of Object.keys(this._pose)) {
        this._pose[k] = lerp(this._fromPose[k], this._targetPose[k], t);
      }
    } else {
      for (const k of Object.keys(this._pose)) {
        this._pose[k] = this._targetPose[k];
      }
    }

    this._phase += delta * this._pose.tailFreq;
    this._finPhase += delta * this._pose.finRate;

    if (ONE_SHOT_STATES.has(this._state)) {
      const dur = ONE_SHOT_DURATIONS[this._state];
      if (this._stateTime >= dur) {
        const finished = this._state;
        const returnTo = VALID_STATES.has(this._previousState) && !ONE_SHOT_STATES.has(this._previousState)
          ? this._previousState
          : 'breathing';
        this._state = returnTo;
        this._stateTime = 0;
        this._fromPose = { ...this._pose };
        this._targetPose = { ...POSES[returnTo] };
        this._blendElapsed = 0;
        this._emitFinished(finished);
      }
    }
  }

  draw(ctx) {
    const p = this._pose;
    const t = this._time;
    const L = VillainClownfish.metadata.baseLength;
    const W = VillainClownfish.metadata.baseWidth;
    const halfL = L * 0.5;
    const halfW = W * 0.5;

    const tailWag = Math.sin(this._phase) * p.tailAmp + p.bend * 0.65;
    const bodySway = Math.sin(this._phase - 0.7) * p.tailAmp * 0.25 + p.bend * 0.32;
    const finFlutter = Math.sin(this._finPhase) * 0.26;
    const jitterX = p.jitter > 0 ? Math.sin(t * 58) * p.jitter * 1.1 : 0;
    const jitterY = p.jitter > 0 ? Math.cos(t * 64) * p.jitter * 1.3 : 0;
    const breathPulse = 1 + Math.sin(t * 3.1) * 0.025;

    ctx.save();
    ctx.translate(this.x + jitterX, this.y + jitterY);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Subtle dark volcanic miasma & shadow aura beneath
    this._drawVolcanicAura(ctx, halfL, halfW, p.aura, t);

    // 2. Notched pectoral fins (charred orange with obsidian jagged rims)
    this._drawPectoralFin(ctx, 5, -halfW * 0.72, -1, p.finSpread + finFlutter, bodySway);
    this._drawPectoralFin(ctx, 5, halfW * 0.72, 1, p.finSpread - finFlutter, bodySway);

    // 3. Notched volcanic tail fin (multi-segment sway)
    this._drawNotchedTail(ctx, -halfL * 0.66, tailWag * 14, tailWag, t);

    // 4. Chunky front-heavy chibi clownfish body
    ctx.save();
    ctx.scale(1, breathPulse);
    this._drawCharredBody(ctx, halfL, halfW, bodySway, t);

    // 5. Jagged dorsal spine ridge (top-down central fin)
    this._drawDorsalCrest(ctx, bodySway, tailWag);

    // 6. Wicked fanged snout grin / snapping mouth
    this._drawWickedSnout(ctx, halfL, p.mouth, t);

    // 7. Expressive villain chibi eyes with angled V-brows & glowing ember irises
    this._drawVillainEyes(ctx, halfL, halfW, p, t);
    ctx.restore();

    // 8. Mood-reactive overlays (sparkles, sweat drops, stress vein, shock !, teardrop)
    this._drawMoodFX(ctx, halfL, halfW, t);

    ctx.restore();
  }

  _drawVolcanicAura(ctx, halfL, halfW, intensity, t) {
    const r = halfL * (1.05 + Math.sin(t * 2.5) * 0.05);
    const grad = ctx.createRadialGradient(-2, 0, 4, -2, 0, r);
    grad.addColorStop(0, `rgba(28, 8, 36, ${0.42 * intensity})`);
    grad.addColorStop(0.55, `rgba(180, 32, 24, ${0.22 * intensity})`);
    grad.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(-3, 0, r, halfW * 1.45, 0, 0, Math.PI * 2);
    ctx.fill();

    // Orbiting dark ember wisps
    for (let i = 0; i < 3; i++) {
      const a = t * 1.6 + i * 2.1;
      const ex = -6 + Math.cos(a) * (halfL * 0.78);
      const ey = Math.sin(a) * (halfW * 1.05);
      ctx.fillStyle = i % 2 === 0 ? `rgba(255, 90, 20, ${0.45 * intensity})` : `rgba(45, 16, 62, ${0.5 * intensity})`;
      ctx.beginPath();
      ctx.arc(ex, ey, 1.8 + Math.sin(t * 5 + i) * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _drawPectoralFin(ctx, ox, oy, side, spread, bodySway) {
    ctx.save();
    ctx.translate(ox, oy + bodySway * 4);
    ctx.rotate(side * (0.35 + spread * 0.65));

    const grad = ctx.createLinearGradient(0, 0, -10, side * 15);
    grad.addColorStop(0, '#D94B14');
    grad.addColorStop(0.6, '#7E1A18');
    grad.addColorStop(1, '#1E1128');

    ctx.fillStyle = grad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.0;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(4, 0);
    ctx.quadraticCurveTo(3, side * 12, -4, side * 15);
    // Battle notch on outer edge
    ctx.lineTo(-5.5, side * 10.5);
    ctx.lineTo(-9, side * 13.5);
    ctx.quadraticCurveTo(-13, side * 8, -7, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing ember fin rays
    ctx.strokeStyle = 'rgba(255, 130, 45, 0.55)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(1, side * 2);
    ctx.lineTo(-3, side * 11);
    ctx.moveTo(-2, side * 2);
    ctx.lineTo(-8, side * 9);
    ctx.stroke();
    ctx.restore();
  }

  _drawNotchedTail(ctx, tx, ty, wag, t) {
    ctx.save();
    ctx.translate(tx, ty * 0.35);
    ctx.rotate(wag * 0.95);

    const grad = ctx.createLinearGradient(0, 0, -17, 0);
    grad.addColorStop(0, '#2B1426');
    grad.addColorStop(0.45, '#E34E18');
    grad.addColorStop(0.85, '#991822');
    grad.addColorStop(1, '#140B1C');

    ctx.fillStyle = grad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.1;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(2, -4.5);
    ctx.quadraticCurveTo(-7, -11, -15, -12.5);
    // Jagged villain notches along trailing tail edge
    ctx.lineTo(-11.5, -5.5);
    ctx.lineTo(-16.5, -1.5);
    ctx.lineTo(-12.5, 2.5);
    ctx.lineTo(-15.5, 11.5);
    ctx.quadraticCurveTo(-7, 10.5, 2, 4.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing crimson trim vein
    ctx.strokeStyle = `rgba(255, 85, 35, ${0.55 + Math.sin(t * 6) * 0.2})`;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(-1, -2);
    ctx.lineTo(-11, -8);
    ctx.moveTo(-1, 2);
    ctx.lineTo(-11, 7.5);
    ctx.stroke();
    ctx.restore();
  }

  _drawCharredBody(ctx, halfL, halfW, bodySway, t) {
    const sy = bodySway * 5;

    ctx.save();
    // Clip path for chunky chibi clownfish silhouette
    ctx.beginPath();
    ctx.moveTo(halfL * 0.92, 0);
    ctx.bezierCurveTo(halfL * 0.88, -halfW * 0.95, halfL * 0.15, -halfW * 1.05, -halfL * 0.28, -halfW * 0.65 + sy * 0.4);
    ctx.quadraticCurveTo(-halfL * 0.58, -halfW * 0.36 + sy, -halfL * 0.70, -halfW * 0.22 + sy);
    ctx.lineTo(-halfL * 0.70, halfW * 0.22 + sy);
    ctx.quadraticCurveTo(-halfL * 0.58, halfW * 0.36 + sy, -halfL * 0.28, halfW * 0.65 + sy * 0.4);
    ctx.bezierCurveTo(halfL * 0.15, halfW * 1.05, halfL * 0.88, halfW * 0.95, halfL * 0.92, 0);
    ctx.closePath();

    // Base volcanic-orange to charred-obsidian gradient
    const bodyGrad = ctx.createLinearGradient(halfL, -halfW, -halfL * 0.7, halfW);
    bodyGrad.addColorStop(0, '#FF681E');
    bodyGrad.addColorStop(0.38, '#D93B12');
    bodyGrad.addColorStop(0.74, '#4B1522');
    bodyGrad.addColorStop(1, '#1A0D20');
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    ctx.save();
    ctx.clip();

    // Layered dark cel-shading along flanks
    ctx.fillStyle = 'rgba(20, 8, 28, 0.36)';
    ctx.beginPath();
    ctx.ellipse(0, halfW * 0.72, halfL * 0.95, halfW * 0.48, 0, 0, Math.PI * 2);
    ctx.fill();

    // Band 1 (behind head) — jagged cracked ash-white band with crimson-obsidian borders
    this._drawCrackedBand(ctx, 11, halfW * 1.15, 5.2, '#E5DCE2', '#B5172D');

    // Band 2 (mid-body) — wider jagged volcanic ash band
    this._drawCrackedBand(ctx, -3, halfW * 1.1, 6.2, '#DDD2DA', '#C81D32');

    // Band 3 (peduncle) — narrow ember-cracked band
    this._drawCrackedBand(ctx, -16, halfW * 0.65, 3.6, '#CFC3CC', '#A81428');

    // Battle scar across forehead/shoulder
    ctx.strokeStyle = '#FF3850';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(19, -5.5);
    ctx.lineTo(13, 1.5);
    ctx.stroke();
    ctx.strokeStyle = '#FFD3B6';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(18.7, -5.2);
    ctx.lineTo(13.3, 1.2);
    ctx.stroke();

    // Glossy chibi top-down specular highlight
    const gloss = ctx.createLinearGradient(halfL * 0.5, -halfW * 0.65, halfL * 0.1, 0);
    gloss.addColorStop(0, 'rgba(255, 224, 196, 0.42)');
    gloss.addColorStop(1, 'rgba(255, 160, 110, 0)');
    ctx.fillStyle = gloss;
    ctx.beginPath();
    ctx.ellipse(7, -halfW * 0.42, 13, 4.5, -0.18, 0, Math.PI * 2);
    ctx.fill();

    // Glowing magma crack pulse on nape
    ctx.strokeStyle = `rgba(255, 110, 30, ${0.55 + Math.sin(t * 4.2) * 0.25})`;
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(3, -3);
    ctx.lineTo(-1, 0);
    ctx.lineTo(2, 3.5);
    ctx.stroke();

    ctx.restore();

    // Bold dark-obsidian chibi outline
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.4;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  _drawCrackedBand(ctx, cx, halfH, width, fillColor, crimsonBorder) {
    const hw = width * 0.5;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - hw, -halfH);
    ctx.lineTo(cx - hw + 1.8, -halfH * 0.45);
    ctx.lineTo(cx - hw - 1.4, 0);
    ctx.lineTo(cx - hw + 1.6, halfH * 0.5);
    ctx.lineTo(cx - hw, halfH);
    ctx.lineTo(cx + hw, halfH);
    ctx.lineTo(cx + hw + 1.5, halfH * 0.45);
    ctx.lineTo(cx + hw - 1.2, 0);
    ctx.lineTo(cx + hw + 1.8, -halfH * 0.45);
    ctx.lineTo(cx + hw, -halfH);
    ctx.closePath();

    // Outer obsidian shadow border
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3.2;
    ctx.stroke();

    // Inner crimson border
    ctx.strokeStyle = crimsonBorder;
    ctx.lineWidth = 1.7;
    ctx.stroke();

    // Ash-white fill
    ctx.fillStyle = fillColor;
    ctx.fill();

    // Cracked magma hairline fractures inside band
    ctx.strokeStyle = '#331224';
    ctx.lineWidth = 0.85;
    ctx.beginPath();
    ctx.moveTo(cx - hw * 0.3, -halfH * 0.55);
    ctx.lineTo(cx + hw * 0.2, -halfH * 0.15);
    ctx.lineTo(cx - hw * 0.4, halfH * 0.25);
    ctx.stroke();
    ctx.restore();
  }

  _drawDorsalCrest(ctx, bodySway, tailWag) {
    ctx.save();
    ctx.fillStyle = '#24102A';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.7;
    ctx.lineJoin = 'round';

    const sway = bodySway * 3.5;
    ctx.beginPath();
    ctx.moveTo(9, 0);
    ctx.lineTo(4, -2.5 + sway * 0.2);
    ctx.lineTo(1, 0.5 + sway * 0.3);
    ctx.lineTo(-4, -3.0 + sway * 0.5);
    ctx.lineTo(-8, 0.5 + sway * 0.6);
    ctx.lineTo(-14, -2.5 + tailWag * 3);
    ctx.lineTo(-18, sway * 0.8);
    ctx.lineTo(-14, 2.5 + tailWag * 3);
    ctx.lineTo(-4, 2.2 + sway * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Crimson spine highlight
    ctx.strokeStyle = '#FF4D2E';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(7, 0);
    ctx.lineTo(-15, sway * 0.7);
    ctx.stroke();
    ctx.restore();
  }

  _drawWickedSnout(ctx, halfL, mouthOpen, t) {
    const chomp = this._state === 'eating' || this._state === 'hungry'
      ? Math.abs(Math.sin(t * 14)) * 0.45 + mouthOpen * 0.55
      : mouthOpen;
    const mx = halfL * 0.84;

    if (chomp > 0.18 || this._state === 'happy') {
      const openW = 3.2 + chomp * 4.5;
      ctx.save();
      ctx.fillStyle = '#2B0818';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(mx + 1.2, 0, 2.2 + chomp * 2.8, openW, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Sharp cartoon fangs protruding along villain grin
      ctx.fillStyle = '#FFF5F0';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 0.9;
      const fangPositions = [-openW * 0.55, 0, openW * 0.55];
      for (const fy of fangPositions) {
        ctx.beginPath();
        ctx.moveTo(mx + 0.8, fy - 1.3);
        ctx.lineTo(mx + 4.4 + chomp * 1.4, fy);
        ctx.lineTo(mx + 0.8, fy + 1.3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    } else if (this._state === 'sad') {
      // Sulking scheming pout
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(mx - 0.5, 0, 3.0, -0.7, 0.7);
      ctx.stroke();
    }
  }

  _drawVillainEyes(ctx, halfL, halfW, p, t) {
    const ex = halfL * 0.54;
    const ey = halfW * 0.50;

    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(ex, side * ey);

      if (this._state === 'stress') {
        // Scrunched > < villain eyes
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 2.3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-2.5, -side * 2.5);
        ctx.lineTo(2.2, 0);
        ctx.lineTo(-2.5, side * 2.5);
        ctx.stroke();
        ctx.restore();
        continue;
      }

      const rx = 4.2 * (this._state === 'shock' ? 1.25 : 1.0);
      const ry = 3.8 * Math.max(0.45, Math.min(1.35, p.eyeOpen));

      // Dark socket outline
      ctx.fillStyle = '#140B1C';
      ctx.beginPath();
      ctx.ellipse(0, 0, rx + 1.2, ry + 1.1, side * 0.15, 0, Math.PI * 2);
      ctx.fill();

      // Sclera (warm pale ember-tint)
      ctx.fillStyle = this._state === 'hungry' ? '#FFE4B5' : '#FFF4E8';
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, side * 0.15, 0, Math.PI * 2);
      ctx.fill();

      // Glowing ember iris
      const irisR = this._state === 'shock' ? 1.4 : (this._state === 'hungry' ? 2.9 : 2.5);
      const irisGrad = ctx.createRadialGradient(0.5, 0, 0.3, 0.5, 0, irisR);
      irisGrad.addColorStop(0, '#FFF066');
      irisGrad.addColorStop(0.55, '#FF5E1A');
      irisGrad.addColorStop(1, '#9E0B1E');
      ctx.fillStyle = irisGrad;
      ctx.beginPath();
      ctx.arc(0.7, side * 0.3, irisR, 0, Math.PI * 2);
      ctx.fill();

      // Slit pupil
      ctx.fillStyle = '#140B1C';
      ctx.beginPath();
      ctx.ellipse(0.9, side * 0.3, this._state === 'shock' ? 0.7 : 0.9, irisR * 0.75, 0, 0, Math.PI * 2);
      ctx.fill();

      // Dual catchlights
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(1.7, side * 0.3 - 1.1, 1.0, 0, Math.PI * 2);
      ctx.arc(-0.4, side * 0.3 + 1.0, 0.55, 0, Math.PI * 2);
      ctx.fill();

      // Half-lidded smug scheming eyelid for relax / happy
      if (this._state === 'relax' || this._state === 'happy') {
        ctx.fillStyle = '#3A1120';
        ctx.beginPath();
        ctx.ellipse(-0.8, 0, rx + 0.5, ry * 0.55, side * 0.15, Math.PI * 0.5, Math.PI * 1.5);
        ctx.fill();
      }

      // Angled V-shaped villain brow
      const browTilt = p.brow * 0.55;
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-4.2, -side * (2.6 - browTilt * 2.5));
      ctx.lineTo(4.5, -side * (1.5 + browTilt * 2.5));
      ctx.stroke();

      // Blazing hungry eye glint
      if (this._state === 'hungry' || this._state === 'eating') {
        ctx.strokeStyle = `rgba(255, 220, 60, ${0.6 + Math.sin(t * 14) * 0.3})`;
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(0.8, side * 0.3 - 4.5);
        ctx.lineTo(0.8, side * 0.3 + 4.5);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  _drawMoodFX(ctx, halfL, halfW, t) {
    if (this._state === 'happy') {
      // Dark purple & crimson evil cackle sparkles
      for (let i = 0; i < 4; i++) {
        const a = t * 2.4 + i * 1.57;
        const sx = 6 + Math.cos(a) * (halfL * 0.72);
        const sy = Math.sin(a) * (halfW * 1.15);
        const sz = 2.6 + Math.sin(t * 7 + i) * 1.0;
        ctx.fillStyle = i % 2 === 0 ? '#D92659' : '#9B30FF';
        ctx.beginPath();
        ctx.moveTo(sx, sy - sz);
        ctx.quadraticCurveTo(sx, sy, sx + sz, sy);
        ctx.quadraticCurveTo(sx, sy, sx, sy + sz);
        ctx.quadraticCurveTo(sx, sy, sx - sz, sy);
        ctx.quadraticCurveTo(sx, sy, sx, sy - sz);
        ctx.fill();
      }
    } else if (this._state === 'shock') {
      // Rattled cartoon '!' mark
      ctx.save();
      ctx.translate(halfL * 0.65, -halfW * 1.15);
      ctx.fillStyle = '#FF2E4D';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.roundRect(-2.0, -10, 4.0, 7.5, 1.5);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 1.2, 2.0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (this._state === 'fear') {
      // Panicking villain sweat drops
      for (let i = 0; i < 2; i++) {
        const dropOffset = ((t * 28 + i * 7) % 10);
        const dx = 10 - i * 8;
        const dy = -halfW * 0.95 - dropOffset * 0.55;
        ctx.fillStyle = '#7CE8FF';
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(dx, dy - 3.5);
        ctx.quadraticCurveTo(dx + 2.8, dy + 1, dx, dy + 3);
        ctx.quadraticCurveTo(dx - 2.8, dy + 1, dx, dy - 3.5);
        ctx.fill();
        ctx.stroke();
      }
    } else if (this._state === 'stress') {
      // Twitching anime anger/stress vein mark
      const pulse = 1 + Math.sin(t * 20) * 0.18;
      ctx.save();
      ctx.translate(10, -halfW * 0.95);
      ctx.scale(pulse, pulse);
      ctx.strokeStyle = '#FF244C';
      ctx.lineWidth = 2.0;
      ctx.lineCap = 'round';
      for (let q = 0; q < 4; q++) {
        ctx.rotate(Math.PI * 0.5);
        ctx.beginPath();
        ctx.moveTo(1.8, 1.8);
        ctx.quadraticCurveTo(2.0, 4.5, 5.2, 4.8);
        ctx.stroke();
      }
      ctx.restore();
    } else if (this._state === 'sad') {
      // Glossy scheming teardrop
      const dropY = (t * 14) % 7;
      ctx.fillStyle = '#72D6FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(halfL * 0.45, halfW * 0.72 + dropY * 0.5);
      ctx.quadraticCurveTo(halfL * 0.45 + 2.4, halfW * 0.72 + 4 + dropY * 0.5, halfL * 0.45, halfW * 0.72 + 5.5 + dropY * 0.5);
      ctx.quadraticCurveTo(halfL * 0.45 - 2.4, halfW * 0.72 + 4 + dropY * 0.5, halfL * 0.45, halfW * 0.72 + dropY * 0.5);
      ctx.fill();
      ctx.stroke();
    }
  }
}

export default VillainClownfish;
