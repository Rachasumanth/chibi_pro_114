/**
 * Villain Spiny Lumpfish — 2D Top-Down Expressive Chibi Villain ES Module
 * Dark volcanic-indigo warty body studded with glowing amethyst crystal spikes and rugged armored fins.
 */

const OUTLINE = '#140B1C';
const VALID_STATES = new Set([
  'breathing', 'swimming', 'relax', 'left_turn', 'right_turn',
  'eating', 'hungry', 'stress', 'fear', 'shock', 'happy', 'sad'
]);
const ONE_SHOT_DURATIONS = {
  left_turn: 0.5,
  right_turn: 0.5,
  eating: 0.6,
  shock: 0.74
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
      return { swimFreq: 8.2, swimAmp: 1.0, turnBend: 0, crystalGlow: 1.0, jitter: 0 };
    case 'relax':
      return { swimFreq: 2.0, swimAmp: 0.24, turnBend: 0, crystalGlow: 0.4, jitter: 0 };
    case 'left_turn':
      return { swimFreq: 6.8, swimAmp: 0.6, turnBend: -0.65, crystalGlow: 1.1, jitter: 0 };
    case 'right_turn':
      return { swimFreq: 6.8, swimAmp: 0.6, turnBend: 0.65, crystalGlow: 1.1, jitter: 0 };
    case 'eating':
      return { swimFreq: 8.8, swimAmp: 0.7, turnBend: 0, crystalGlow: 1.55, jitter: 0.24 };
    case 'hungry':
      return { swimFreq: 7.0, swimAmp: 0.75, turnBend: 0, crystalGlow: 1.35, jitter: 0.14 };
    case 'stress':
      return { swimFreq: 10.6, swimAmp: 0.48, turnBend: 0, crystalGlow: 1.3, jitter: 1.15 };
    case 'fear':
      return { swimFreq: 12.4, swimAmp: 0.52, turnBend: 0, crystalGlow: 0.55, jitter: 1.45 };
    case 'shock':
      return { swimFreq: 13.8, swimAmp: 0.3, turnBend: 0, crystalGlow: 1.65, jitter: 1.75 };
    case 'happy':
      return { swimFreq: 5.4, swimAmp: 0.7, turnBend: 0, crystalGlow: 1.2, jitter: 0 };
    case 'sad':
      return { swimFreq: 1.7, swimAmp: 0.2, turnBend: 0, crystalGlow: 0.28, jitter: 0 };
    case 'breathing':
    default:
      return { swimFreq: 3.2, swimAmp: 0.4, turnBend: 0, crystalGlow: 0.82, jitter: 0 };
  }
}

export class VillainLumpfish {
  static metadata = {
    name: 'Villain Spiny Lumpfish',
    category: 'villain_fish',
    baseLength: 72,
    baseWidth: 54
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
    const wag = Math.sin(t * p.swimFreq) * p.swimAmp;
    const breath = Math.sin(t * 3.3) * 0.032;
    const jx = p.jitter > 0 ? Math.sin(t * 59) * p.jitter * 1.2 : 0;
    const jy = p.jitter > 0 ? Math.cos(t * 65) * p.jitter * 1.3 : 0;

    ctx.save();
    ctx.translate(this.x + jx, this.y + jy);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Amethyst volcanic shadow aura
    const aura = ctx.createRadialGradient(0, 0, 10, 0, 0, 48);
    aura.addColorStop(0, 'rgba(178, 72, 255, 0.30)');
    aura.addColorStop(0.55, 'rgba(22, 12, 36, 0.25)');
    aura.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.ellipse(0, 3, 46, 36, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Stubby rugged volcanic tail
    const tailY = wag * 6 + p.turnBend * 10;
    ctx.fillStyle = '#2B2347';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(-22, -5);
    ctx.quadraticCurveTo(-32, tailY - 11, -36, tailY - 6);
    ctx.lineTo(-33, tailY);
    ctx.lineTo(-36, tailY + 6);
    ctx.quadraticCurveTo(-32, tailY + 11, -22, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 3. Rugged armored fan pectoral fins
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(4, side * 20);
      ctx.rotate(side * (0.2 + Math.sin(t * p.swimFreq * 1.25) * 0.28 - p.turnBend * 0.24 * side));
      ctx.fillStyle = '#362B59';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(4, side * 12);
      ctx.lineTo(-4, side * 14);
      ctx.lineTo(-10, side * 9);
      ctx.lineTo(-8, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 4. Dark volcanic-indigo chunky warty body
    ctx.save();
    ctx.scale(1 + breath, 1 - breath * 0.4);
    const bodyGrad = ctx.createRadialGradient(8, -6, 4, 0, 0, 32);
    bodyGrad.addColorStop(0, '#463870');
    bodyGrad.addColorStop(0.55, '#271E45');
    bodyGrad.addColorStop(1, '#140E26');
    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3.6;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(27, 0);
    ctx.bezierCurveTo(26, -18, 10, -25, -8, -22);
    ctx.bezierCurveTo(-22, -19, -27, -10, -25, 0);
    ctx.bezierCurveTo(-27, 10, -22, 19, -8, 22);
    ctx.bezierCurveTo(10, 25, 26, 18, 27, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Warty volcanic bumps
    const warts = [[-16, -11, 3.8], [-16, 11, 3.8], [-2, -17, 3.4], [-2, 17, 3.4], [8, -14, 3.0], [8, 14, 3.0]];
    for (const [wx, wy, wr] of warts) {
      ctx.fillStyle = '#372B5E';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(wx, wy, wr, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // 5. Glowing Amethyst Crystal Spikes studded in rows along the back!
    const glow = Math.min(1, 0.55 + 0.35 * p.crystalGlow + 0.14 * Math.sin(t * 5));
    const crystals = [
      { x: 4, y: 0, s: 7.5, a: 0 },
      { x: -9, y: 0, s: 8.5, a: 0.1 },
      { x: -20, y: 0, s: 6.0, a: -0.1 },
      { x: -6, y: -13, s: 6.2, a: -0.55 },
      { x: -6, y: 13, s: 6.2, a: 0.55 },
      { x: 6, y: -12, s: 5.0, a: -0.4 },
      { x: 6, y: 12, s: 5.0, a: 0.4 }
    ];
    for (const c of crystals) {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.a);
      const cGrad = ctx.createLinearGradient(-c.s, -c.s, c.s, c.s);
      cGrad.addColorStop(0, `rgba(232, 148, 255, ${glow})`);
      cGrad.addColorStop(0.55, '#9B38FF');
      cGrad.addColorStop(1, '#4B1485');
      ctx.fillStyle = cGrad;
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(c.s, 0);
      ctx.lineTo(0, -c.s * 0.58);
      ctx.lineTo(-c.s * 0.85, 0);
      ctx.lineTo(0, c.s * 0.58);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 6. Grumpy fang scowl at snout
    const chomp = state === 'eating' ? Math.abs(Math.sin(t * 22)) * 4 : (state === 'hungry' ? Math.abs(Math.sin(t * 10)) * 2 : 0);
    ctx.fillStyle = '#260824';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.ellipse(26 + chomp * 0.4, 0, 4 + chomp * 0.4, 6.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 7. Expressive Villain Chibi Eyes
    this._drawVillainEyes(ctx, state, t);

    ctx.restore();

    // 8. Mood-reactive VFX
    this._drawMoodVFX(ctx, state, t);

    ctx.restore();
  }

  _drawVillainEyes(ctx, state, t) {
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(16, side * 11.5);

      if (state === 'stress') {
        ctx.strokeStyle = '#DF73FF';
        ctx.lineWidth = 2.8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-3.8, -3 * side);
        ctx.lineTo(3.5, 0);
        ctx.lineTo(-3.8, 3 * side);
        ctx.stroke();
      } else {
        const isShock = state === 'shock';
        const isFear = state === 'fear';
        const rx = isShock ? 6.4 : (isFear ? 5.8 : 5.2);
        const ry = isShock ? 5.8 : (isFear ? 5.2 : 4.5);

        ctx.fillStyle = OUTLINE;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx + 1.5, ry + 1.5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = (isShock || isFear) ? '#F9F0FF' : (state === 'hungry' || state === 'eating' ? '#FF2E7A' : '#CC66FF');
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#140B1C';
        if (isShock || isFear) {
          ctx.beginPath();
          ctx.arc(0.8 + Math.sin(t * 48) * 0.9, 0, 1.8, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.ellipse(1.2, 0, 1.5, ry * 0.72, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(2.3, -1.5 * side, 1.5, 0, Math.PI * 2);
        ctx.arc(-1.2, 1.2 * side, 0.85, 0, Math.PI * 2);
        ctx.fill();

        if (state === 'relax') {
          ctx.fillStyle = '#271E45';
          ctx.beginPath();
          ctx.ellipse(-1.6, 0, rx + 0.8, ry + 0.8, 0, Math.PI * 0.5, Math.PI * 1.5);
          ctx.fill();
        }
      }

      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (state === 'sad' || state === 'fear') {
        ctx.moveTo(-4.2, -4 * side);
        ctx.lineTo(5.2, -6.5 * side);
      } else if (state === 'shock') {
        ctx.moveTo(-4.8, -6.5 * side);
        ctx.lineTo(4.8, -6.5 * side);
      } else {
        ctx.moveTo(-4.2, -6.2 * side);
        ctx.lineTo(5.8, -2.0 * side);
      }
      ctx.stroke();

      ctx.restore();
    }
  }

  _drawMoodVFX(ctx, state, t) {
    if (state === 'happy') {
      for (let i = 0; i < 3; i++) {
        const s = 3.2 + Math.sin(t * 6 + i * 2) * 2;
        const sx = 8 + i * 12;
        const sy = i % 2 === 0 ? -30 : 30;
        ctx.fillStyle = i === 1 ? '#FF3D9A' : '#CC66FF';
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 1.2;
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
      ctx.translate(38, -20);
      ctx.fillStyle = '#CC66FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-2.8, -10);
      ctx.lineTo(2.8, -10);
      ctx.lineTo(1.6, 1.5);
      ctx.lineTo(-1.6, 1.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 6, 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (state === 'fear') {
      const d = (t * 22) % 10;
      for (const side of [-1, 1]) {
        ctx.fillStyle = '#8CE8FF';
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(8, side * (28 + d * 0.4));
        ctx.quadraticCurveTo(1, side * (25 + d * 0.4), -1, side * (28 + d * 0.4));
        ctx.quadraticCurveTo(1, side * (31 + d * 0.4), 8, side * (28 + d * 0.4));
        ctx.fill();
        ctx.stroke();
      }
    } else if (state === 'stress') {
      const pulse = 1 + Math.sin(t * 32) * 0.14;
      ctx.save();
      ctx.translate(6, -28);
      ctx.scale(pulse, pulse);
      ctx.strokeStyle = '#FF3355';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      for (let q = 0; q < 4; q++) {
        ctx.save();
        ctx.rotate((q * Math.PI) / 2);
        ctx.beginPath();
        ctx.moveTo(1.8, 1.8);
        ctx.quadraticCurveTo(3.5, 5.5, 7, 6.5);
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    } else if (state === 'sad') {
      const d = (t * 14) % 9;
      ctx.fillStyle = '#7CE0FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(18, 19 + d * 0.4);
      ctx.quadraticCurveTo(14, 24 + d * 0.4, 18, 27 + d * 0.4);
      ctx.quadraticCurveTo(22, 24 + d * 0.4, 18, 19 + d * 0.4);
      ctx.fill();
      ctx.stroke();
    }
  }
}

export default VillainLumpfish;
