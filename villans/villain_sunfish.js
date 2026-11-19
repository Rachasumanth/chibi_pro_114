/**
 * Villain Ocean Sunfish — 2D Top-Down Expressive Chibi Villain ES Module
 * Colossal eclipse-black moon-disc body with glowing blood-moon corona rim, jagged scalloped clavus, scarred paddle fins.
 */

const OUTLINE = '#140B1C';
const VALID_STATES = new Set([
  'breathing', 'swimming', 'relax', 'left_turn', 'right_turn',
  'eating', 'hungry', 'stress', 'fear', 'shock', 'happy', 'sad'
]);
const ONE_SHOT_DURATIONS = {
  left_turn: 0.58,
  right_turn: 0.58,
  eating: 0.68,
  shock: 0.8
};
const LOCKED_REJECT = new Set(['left_turn', 'right_turn', 'relax', 'happy', 'eating']);

function normalizeState(name) {
  if (name === 'idle') return 'breathing';
  if (name === 'hunger') return 'hungry';
  return VALID_STATES.has(name) ? name : null;
}

function poseForState(state) {
  switch (state) {
    case 'swimming':
      return { paddleFreq: 4.8, paddleAmp: 1.0, turnBend: 0, coronaGlow: 1.0, jawOpen: 0.2, jitter: 0 };
    case 'relax':
      return { paddleFreq: 1.5, paddleAmp: 0.25, turnBend: 0, coronaGlow: 0.45, jawOpen: 0.0, jitter: 0 };
    case 'left_turn':
      return { paddleFreq: 4.0, paddleAmp: 0.65, turnBend: -0.65, coronaGlow: 1.15, jawOpen: 0.2, jitter: 0 };
    case 'right_turn':
      return { paddleFreq: 4.0, paddleAmp: 0.65, turnBend: 0.65, coronaGlow: 1.15, jawOpen: 0.2, jitter: 0 };
    case 'eating':
      return { paddleFreq: 5.8, paddleAmp: 0.8, turnBend: 0, coronaGlow: 1.55, jawOpen: 1.0, jitter: 0.25 };
    case 'hungry':
      return { paddleFreq: 4.4, paddleAmp: 0.78, turnBend: 0, coronaGlow: 1.35, jawOpen: 0.65, jitter: 0.12 };
    case 'stress':
      return { paddleFreq: 7.4, paddleAmp: 0.5, turnBend: 0, coronaGlow: 1.3, jitter: 1.15 };
    case 'fear':
      return { paddleFreq: 8.8, paddleAmp: 0.55, turnBend: 0, coronaGlow: 0.6, jitter: 1.45 };
    case 'shock':
      return { paddleFreq: 10.2, paddleAmp: 0.35, turnBend: 0, coronaGlow: 1.65, jitter: 1.75 };
    case 'happy':
      return { paddleFreq: 3.6, paddleAmp: 0.7, turnBend: 0, coronaGlow: 1.2, jitter: 0 };
    case 'sad':
      return { paddleFreq: 1.3, paddleAmp: 0.2, turnBend: 0, coronaGlow: 0.3, jitter: 0 };
    case 'breathing':
    default:
      return { paddleFreq: 2.2, paddleAmp: 0.42, turnBend: 0, coronaGlow: 0.85, jitter: 0 };
  }
}

export class VillainSunfish {
  static metadata = {
    name: 'Villain Ocean Sunfish',
    category: 'villain_fish',
    baseLength: 230,
    baseWidth: 165
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
    this._blendTime = 0.15;
    this._blendDuration = 0.15;
    this._fromPose = poseForState('breathing');
    this._targetPose = poseForState('breathing');
    this._pose = { ...this._targetPose };
    this._listeners = new Map();
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
    const canonical = normalizeState(name);
    if (!canonical || typeof callback !== 'function') return;
    if (!this._listeners.has(canonical)) this._listeners.set(canonical, []);
    this._listeners.get(canonical).push(callback);
  }

  _emitFinished(stateName) {
    const cbs = this._listeners.get(stateName);
    if (!cbs) return;
    for (const cb of cbs.slice()) cb(stateName, this);
  }

  play(name) {
    const canonical = normalizeState(name);
    if (!canonical) return;
    if ((this._state === 'shock' || this._state === 'fear') && LOCKED_REJECT.has(canonical)) {
      return;
    }
    if (canonical === this._state && !ONE_SHOT_DURATIONS[canonical]) return;

    if (ONE_SHOT_DURATIONS[canonical] && !ONE_SHOT_DURATIONS[this._state]) {
      this._prevState = this._state;
    }
    this._fromPose = { ...this._pose };
    this._targetPose = poseForState(canonical);
    this._blendTime = 0;
    this._state = canonical;
    this._stateTime = 0;
  }

  update(dt) {
    const step = Math.max(0, Number.isFinite(dt) ? dt : 0);
    this._time += step;
    this._stateTime += step;

    if (this._blendTime < this._blendDuration) {
      this._blendTime = Math.min(this._blendDuration, this._blendTime + step);
      const u = this._blendTime / this._blendDuration;
      const ease = 1 - Math.pow(1 - u, 3);
      for (const k of Object.keys(this._targetPose)) {
        this._pose[k] = this._fromPose[k] + (this._targetPose[k] - this._fromPose[k]) * ease;
      }
    } else {
      for (const k of Object.keys(this._targetPose)) {
        this._pose[k] = this._targetPose[k];
      }
    }

    const dur = ONE_SHOT_DURATIONS[this._state];
    if (dur && this._stateTime >= dur) {
      const finished = this._state;
      const next = VALID_STATES.has(this._prevState) && !ONE_SHOT_DURATIONS[this._prevState]
        ? this._prevState
        : 'breathing';
      this._fromPose = { ...this._pose };
      this._targetPose = poseForState(next);
      this._blendTime = 0;
      this._state = next;
      this._stateTime = 0;
      this._emitFinished(finished);
    }
  }

  draw(ctx) {
    const t = this._time;
    const p = this._pose;
    const state = this._state;
    const paddleSwing = Math.sin(t * p.paddleFreq) * p.paddleAmp;
    const breath = Math.sin(t * 2.4) * 0.025;
    const jx = p.jitter > 0 ? Math.sin(t * 54) * p.jitter * 1.5 : 0;
    const jy = p.jitter > 0 ? Math.cos(t * 60) * p.jitter * 1.6 : 0;

    ctx.save();
    ctx.translate(this.x + jx, this.y + jy);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Colossal glowing blood-moon eclipse corona aura beneath moon-disc
    const coronaAlpha = Math.min(1, 0.34 + 0.25 * p.coronaGlow + 0.1 * Math.sin(t * 3.8));
    const aura = ctx.createRadialGradient(0, 0, 56, 0, 0, 126);
    aura.addColorStop(0, `rgba(255, 34, 62, ${coronaAlpha})`);
    aura.addColorStop(0.55, 'rgba(130, 14, 42, 0.28)');
    aura.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.ellipse(0, 0, 122, 92, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Colossal scarred paddle fins (dorsal/anal Mola mola paddles splayed in top-down view)
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(-12, side * 46);
      ctx.rotate(side * (0.12 + paddleSwing * 0.24 - p.turnBend * 0.28 * side));
      const finGrad = ctx.createLinearGradient(0, 0, -24, side * 48);
      finGrad.addColorStop(0, '#2B1626');
      finGrad.addColorStop(0.65, '#180B18');
      finGrad.addColorStop(1, '#B31838');
      ctx.fillStyle = finGrad;
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 4;
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(22, 0);
      ctx.bezierCurveTo(18, side * 26, -2, side * 44, -22, side * 44);
      // Battle scars / notches on paddle trailing edge
      ctx.lineTo(-16, side * 30);
      ctx.lineTo(-24, side * 24);
      ctx.lineTo(-15, side * 14);
      ctx.lineTo(-22, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Crimson battle slash across paddle fin
      ctx.strokeStyle = 'rgba(255, 48, 86, 0.72)';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(6, side * 12);
      ctx.lineTo(-12, side * 28);
      ctx.stroke();
      ctx.restore();
    }

    // 3. Jagged scalloped clavus (rudder-like scalloped tail edge of Mola mola)
    const clavusShift = paddleSwing * 6 + p.turnBend * 14;
    const clavusGrad = ctx.createLinearGradient(-64, 0, -112, 0);
    clavusGrad.addColorStop(0, '#291224');
    clavusGrad.addColorStop(0.7, '#7D1230');
    clavusGrad.addColorStop(1, '#FF294D');
    ctx.fillStyle = clavusGrad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3.8;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(-62, -46);
    const lobes = 6;
    for (let i = 0; i <= lobes; i++) {
      const f = i / lobes;
      const ly = -46 + f * 92;
      const lx = -96 - Math.sin(f * Math.PI) * 18 + (i % 2 === 0 ? 8 : -8);
      ctx.lineTo(lx, ly + clavusShift * 0.4);
    }
    ctx.lineTo(-62, 46);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 4. Colossal Eclipse-Black Moon-Disc Body with glowing Blood-Moon Corona Rim!
    ctx.save();
    ctx.scale(1 + breath, 1 - breath * 0.5);

    const discGrad = ctx.createRadialGradient(18, -12, 12, 0, 0, 96);
    discGrad.addColorStop(0, '#30223A');
    discGrad.addColorStop(0.55, '#191021');
    discGrad.addColorStop(0.88, '#100816');
    discGrad.addColorStop(1, '#8C1232');
    ctx.fillStyle = discGrad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 4.4;

    ctx.beginPath();
    ctx.ellipse(8, 0, 88, 62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Glowing blood-moon corona inner rim ring
    ctx.strokeStyle = `rgba(255, 42, 74, ${Math.min(1, 0.55 + 0.35 * p.coronaGlow)})`;
    ctx.lineWidth = 3.6;
    ctx.beginPath();
    ctx.ellipse(8, 0, 82, 56, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Eclipse lunar craters & sinister blood-moon crescent glyph on back
    ctx.fillStyle = 'rgba(255, 42, 74, 0.22)';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-8, 0, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#140B1C';
    ctx.beginPath();
    ctx.arc(-1, 0, 22, 0, Math.PI * 2);
    ctx.fill();

    // Glossy obsidian moon highlight
    ctx.fillStyle = 'rgba(255, 196, 214, 0.18)';
    ctx.beginPath();
    ctx.ellipse(42, -22, 24, 9, -0.25, 0, Math.PI * 2);
    ctx.fill();

    // 5. Small fierce beak-like Mola mola villain mouth
    const chomp = state === 'eating' ? Math.abs(Math.sin(t * 20)) * 6 : (state === 'hungry' ? Math.abs(Math.sin(t * 10)) * 3 : 0);
    ctx.fillStyle = '#2B0719';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(95 + chomp * 0.4, 0, 6 + chomp * 0.5, 10.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFF2F6';
    ctx.beginPath();
    ctx.moveTo(95, -5.5);
    ctx.lineTo(101 + chomp * 0.5, -2.5);
    ctx.lineTo(95, 0);
    ctx.lineTo(101 + chomp * 0.5, 2.5);
    ctx.lineTo(95, 5.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 6. Expressive Villain Chibi Eyes
    this._drawVillainEyes(ctx, state, t);

    ctx.restore();

    // 7. Mood-reactive VFX
    this._drawMoodVFX(ctx, state, t);

    ctx.restore();
  }

  _drawVillainEyes(ctx, state, t) {
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(64, side * 28);

      if (state === 'stress') {
        ctx.strokeStyle = '#FF2E54';
        ctx.lineWidth = 3.8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-6, -5 * side);
        ctx.lineTo(5.5, 0);
        ctx.lineTo(-6, 5 * side);
        ctx.stroke();
      } else {
        const isShock = state === 'shock';
        const isFear = state === 'fear';
        const rx = isShock ? 10.5 : (isFear ? 9.4 : 8.5);
        const ry = isShock ? 9.5 : (isFear ? 8.5 : 7.4);

        ctx.fillStyle = OUTLINE;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx + 2.2, ry + 2.2, 0, 0, Math.PI * 2);
        ctx.fill();

        const irisGrad = ctx.createRadialGradient(0, 0, 1.5, 0, 0, rx);
        irisGrad.addColorStop(0, (isShock || isFear) ? '#FFF4F6' : '#FFAA33');
        irisGrad.addColorStop(1, (isShock || isFear) ? '#FFDCE4' : '#E6173F');
        ctx.fillStyle = irisGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#140B1C';
        if (isShock || isFear) {
          ctx.beginPath();
          ctx.arc(1.5 + Math.sin(t * 48) * 1.4, 0, 2.8, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.ellipse(2.0, 0, 2.5, ry * 0.72, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(3.8, -2.5 * side, 2.4, 0, Math.PI * 2);
        ctx.arc(-2.2, 2.0 * side, 1.3, 0, Math.PI * 2);
        ctx.fill();

        if (state === 'relax') {
          ctx.fillStyle = '#191021';
          ctx.beginPath();
          ctx.ellipse(-2.8, 0, rx + 1.2, ry + 1.2, 0, Math.PI * 0.5, Math.PI * 1.5);
          ctx.fill();
        }
      }

      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 4.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (state === 'sad' || state === 'fear') {
        ctx.moveTo(-7, -7 * side);
        ctx.lineTo(8.5, -11 * side);
      } else if (state === 'shock') {
        ctx.moveTo(-8, -11 * side);
        ctx.lineTo(8, -11 * side);
      } else {
        ctx.moveTo(-7, -10.5 * side);
        ctx.lineTo(9.5, -3.5 * side);
      }
      ctx.stroke();

      ctx.restore();
    }
  }

  _drawMoodVFX(ctx, state, t) {
    if (state === 'happy') {
      for (let i = 0; i < 3; i++) {
        const s = 5.5 + Math.sin(t * 6 + i * 2) * 3;
        const sx = 54 + i * 24;
        const sy = i % 2 === 0 ? -74 : 74;
        ctx.fillStyle = i === 1 ? '#FF294D' : '#C84DFF';
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 1.6;
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
        ctx.stroke();
      }
    } else if (state === 'shock') {
      ctx.save();
      ctx.translate(108, -42);
      ctx.fillStyle = '#FF294D';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-4.5, -18);
      ctx.lineTo(4.5, -18);
      ctx.lineTo(2.8, 2);
      ctx.lineTo(-2.8, 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 10, 3.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (state === 'fear') {
      const d = (t * 28) % 16;
      for (const side of [-1, 1]) {
        ctx.fillStyle = '#8CE8FF';
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(46, side * (72 + d * 0.5));
        ctx.quadraticCurveTo(34, side * (67 + d * 0.5), 30, side * (72 + d * 0.5));
        ctx.quadraticCurveTo(34, side * (77 + d * 0.5), 46, side * (72 + d * 0.5));
        ctx.fill();
        ctx.stroke();
      }
    } else if (state === 'stress') {
      const pulse = 1 + Math.sin(t * 32) * 0.16;
      ctx.save();
      ctx.translate(42, -70);
      ctx.scale(pulse, pulse);
      ctx.strokeStyle = '#FF294D';
      ctx.lineWidth = 3.6;
      ctx.lineCap = 'round';
      for (let q = 0; q < 4; q++) {
        ctx.save();
        ctx.rotate((q * Math.PI) / 2);
        ctx.beginPath();
        ctx.moveTo(3, 3);
        ctx.quadraticCurveTo(5.5, 9, 12, 10.5);
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    } else if (state === 'sad') {
      const d = (t * 18) % 14;
      ctx.fillStyle = '#7CE0FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(68, 42 + d * 0.5);
      ctx.quadraticCurveTo(61, 51 + d * 0.5, 68, 56 + d * 0.5);
      ctx.quadraticCurveTo(75, 51 + d * 0.5, 68, 42 + d * 0.5);
      ctx.fill();
      ctx.stroke();
    }
  }
}

export default VillainSunfish;
