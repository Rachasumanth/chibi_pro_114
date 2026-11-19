/**
 * Villain Longhorn Cowfish — 2D Top-Down Expressive Chibi Villain ES Module
 * Demonic obsidian-and-crimson boxy carapace with wicked curved fiery demon horns above glowing eyes, barbed tail.
 */

const OUTLINE = '#140B1C';
const VALID_STATES = new Set([
  'breathing', 'swimming', 'relax', 'left_turn', 'right_turn',
  'eating', 'hungry', 'stress', 'fear', 'shock', 'happy', 'sad'
]);
const ONE_SHOT_DURATIONS = {
  left_turn: 0.5,
  right_turn: 0.5,
  eating: 0.62,
  shock: 0.76
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
      return { swimFreq: 8.6, swimAmp: 1.0, turnBend: 0, hornGlow: 1.0, jitter: 0 };
    case 'relax':
      return { swimFreq: 2.1, swimAmp: 0.25, turnBend: 0, hornGlow: 0.4, jitter: 0 };
    case 'left_turn':
      return { swimFreq: 7.2, swimAmp: 0.62, turnBend: -0.68, hornGlow: 1.15, jitter: 0 };
    case 'right_turn':
      return { swimFreq: 7.2, swimAmp: 0.62, turnBend: 0.68, hornGlow: 1.15, jitter: 0 };
    case 'eating':
      return { swimFreq: 9.2, swimAmp: 0.7, turnBend: 0, hornGlow: 1.6, jitter: 0.25 };
    case 'hungry':
      return { swimFreq: 7.4, swimAmp: 0.75, turnBend: 0, hornGlow: 1.4, jitter: 0.14 };
    case 'stress':
      return { swimFreq: 11.0, swimAmp: 0.5, turnBend: 0, hornGlow: 1.35, jitter: 1.15 };
    case 'fear':
      return { swimFreq: 12.8, swimAmp: 0.55, turnBend: 0, hornGlow: 0.55, jitter: 1.45 };
    case 'shock':
      return { swimFreq: 14.2, swimAmp: 0.35, turnBend: 0, hornGlow: 1.65, jitter: 1.75 };
    case 'happy':
      return { swimFreq: 5.6, swimAmp: 0.7, turnBend: 0, hornGlow: 1.25, jitter: 0 };
    case 'sad':
      return { swimFreq: 1.7, swimAmp: 0.2, turnBend: 0, hornGlow: 0.25, jitter: 0 };
    case 'breathing':
    default:
      return { swimFreq: 3.3, swimAmp: 0.4, turnBend: 0, hornGlow: 0.85, jitter: 0 };
  }
}

export class VillainCowfish {
  static metadata = {
    name: 'Villain Longhorn Cowfish',
    category: 'villain_fish',
    baseLength: 75,
    baseWidth: 46
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
    const breath = Math.sin(t * 3.4) * 0.03;
    const jx = p.jitter > 0 ? Math.sin(t * 61) * p.jitter * 1.2 : 0;
    const jy = p.jitter > 0 ? Math.cos(t * 67) * p.jitter * 1.3 : 0;

    ctx.save();
    ctx.translate(this.x + jx, this.y + jy);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Hellfire crimson-obsidian aura
    const aura = ctx.createRadialGradient(0, 0, 8, 0, 0, 48);
    aura.addColorStop(0, 'rgba(255, 42, 34, 0.30)');
    aura.addColorStop(0.55, 'rgba(24, 9, 24, 0.25)');
    aura.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.ellipse(0, 3, 46, 30, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Barbed demon tail (spade-tipped whip tail)
    const tailY = wag * 7 + p.turnBend * 12;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 4.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-20, 0);
    ctx.quadraticCurveTo(-30, tailY * 0.6, -37, tailY);
    ctx.stroke();

    ctx.strokeStyle = '#9E142D';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Demon spade barb at tail tip
    ctx.fillStyle = '#FF2A3C';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-34, tailY);
    ctx.lineTo(-42, tailY - 7);
    ctx.lineTo(-45, tailY);
    ctx.lineTo(-42, tailY + 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Rear lower cowfish spines
    for (const side of [-1, 1]) {
      ctx.fillStyle = '#FF5522';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-18, side * 12);
      ctx.lineTo(-29, side * 17);
      ctx.lineTo(-21, side * 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // 3. Fluttering crimson pectoral fins
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(2, side * 18);
      ctx.rotate(side * (0.2 + Math.sin(t * p.swimFreq * 1.3) * 0.32 - p.turnBend * 0.24 * side));
      ctx.fillStyle = '#8F162D';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(-2, side * 6, 5.5, 8.5, side * 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 4. Demonic obsidian-and-crimson boxy carapace
    ctx.save();
    ctx.scale(1 + breath, 1 - breath * 0.4);
    const bodyGrad = ctx.createLinearGradient(24, -18, -22, 18);
    bodyGrad.addColorStop(0, '#3D1528');
    bodyGrad.addColorStop(0.5, '#200D1B');
    bodyGrad.addColorStop(1, '#140814');
    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3.6;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(20, -14);
    ctx.quadraticCurveTo(25, -12, 24, 0);
    ctx.quadraticCurveTo(25, 12, 20, 14);
    ctx.lineTo(10, 18);
    ctx.lineTo(-15, 17);
    ctx.quadraticCurveTo(-22, 15, -22, 0);
    ctx.quadraticCurveTo(-22, -15, -15, -17);
    ctx.lineTo(10, -18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing crimson demonic runes on carapace back
    const glow = Math.min(1, 0.55 + 0.35 * p.hornGlow + 0.14 * Math.sin(t * 5.5));
    ctx.strokeStyle = `rgba(255, 58, 46, ${glow})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(6, 0);
    ctx.lineTo(-4, -9);
    ctx.lineTo(-14, 0);
    ctx.lineTo(-4, 9);
    ctx.closePath();
    ctx.stroke();

    // 5. Wicked curved fiery demon horns jutting forward above eyes!
    for (const side of [-1, 1]) {
      const hornGrad = ctx.createLinearGradient(16, side * 12, 42, side * 16);
      hornGrad.addColorStop(0, '#2B0D1A');
      hornGrad.addColorStop(0.55, '#E6222E');
      hornGrad.addColorStop(1, '#FFCC33');
      ctx.fillStyle = hornGrad;
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.6;
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(15, side * 9);
      ctx.bezierCurveTo(26, side * 16, 36, side * 19, 42, side * 11);
      ctx.bezierCurveTo(34, side * 13, 26, side * 10, 20, side * 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // 6. Snapping demonic grin / fangs
    const chomp = state === 'eating' ? Math.abs(Math.sin(t * 22)) * 4 : (state === 'hungry' ? Math.abs(Math.sin(t * 10)) * 2 : 0);
    ctx.fillStyle = '#2B0616';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.ellipse(25 + chomp * 0.4, 0, 4 + chomp * 0.4, 5.5, 0, 0, Math.PI * 2);
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
      ctx.translate(15, side * 10.5);

      if (state === 'stress') {
        ctx.strokeStyle = '#FF5522';
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

        ctx.fillStyle = (isShock || isFear) ? '#FFF4EB' : '#FF3326';
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
          ctx.fillStyle = '#200D1B';
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
        const sx = 10 + i * 12;
        const sy = i % 2 === 0 ? -27 : 27;
        ctx.fillStyle = i === 1 ? '#FF4422' : '#D24DFF';
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
      ctx.translate(42, -20);
      ctx.fillStyle = '#FF3326';
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
        ctx.moveTo(8, side * (25 + d * 0.4));
        ctx.quadraticCurveTo(1, side * (22 + d * 0.4), -1, side * (25 + d * 0.4));
        ctx.quadraticCurveTo(1, side * (28 + d * 0.4), 8, side * (25 + d * 0.4));
        ctx.fill();
        ctx.stroke();
      }
    } else if (state === 'stress') {
      const pulse = 1 + Math.sin(t * 32) * 0.14;
      ctx.save();
      ctx.translate(4, -26);
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
      ctx.moveTo(18, 16 + d * 0.4);
      ctx.quadraticCurveTo(14, 21 + d * 0.4, 18, 24 + d * 0.4);
      ctx.quadraticCurveTo(22, 21 + d * 0.4, 18, 16 + d * 0.4);
      ctx.fill();
      ctx.stroke();
    }
  }
}

export default VillainCowfish;
