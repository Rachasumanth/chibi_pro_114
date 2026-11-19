/**
 * Villain Broadbill Swordfish — 2D Top-Down Expressive Chibi Villain ES Module
 * Obsidian-indigo armored body, jagged dark-steel broadsword bill with glowing crimson edge, notched sickle dorsal fin.
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
      return { swimFreq: 7.6, swimAmp: 1.0, turnBend: 0, bladeGlow: 1.0, lunge: 0.15, finFlare: 0.35, jitter: 0 };
    case 'relax':
      return { swimFreq: 1.9, swimAmp: 0.22, turnBend: 0, bladeGlow: 0.4, lunge: 0, finFlare: -0.15, jitter: 0 };
    case 'left_turn':
      return { swimFreq: 6.0, swimAmp: 0.55, turnBend: -0.7, bladeGlow: 1.15, lunge: 0.1, finFlare: 0.65, jitter: 0 };
    case 'right_turn':
      return { swimFreq: 6.0, swimAmp: 0.55, turnBend: 0.7, bladeGlow: 1.15, lunge: 0.1, finFlare: 0.65, jitter: 0 };
    case 'eating':
      return { swimFreq: 8.5, swimAmp: 0.65, turnBend: 0, bladeGlow: 1.6, lunge: 1.0, finFlare: 0.8, jitter: 0.3 };
    case 'hungry':
      return { swimFreq: 6.8, swimAmp: 0.78, turnBend: 0, bladeGlow: 1.4, lunge: 0.45, finFlare: 0.55, jitter: 0.12 };
    case 'stress':
      return { swimFreq: 9.8, swimAmp: 0.42, turnBend: 0, bladeGlow: 1.25, lunge: 0.2, finFlare: 0.7, jitter: 1.1 };
    case 'fear':
      return { swimFreq: 11.4, swimAmp: 0.45, turnBend: 0, bladeGlow: 0.5, lunge: -0.15, finFlare: 0.9, jitter: 1.45 };
    case 'shock':
      return { swimFreq: 12.8, swimAmp: 0.25, turnBend: 0, bladeGlow: 1.5, lunge: -0.25, finFlare: 1.0, jitter: 1.7 };
    case 'happy':
      return { swimFreq: 5.2, swimAmp: 0.68, turnBend: 0, bladeGlow: 1.2, lunge: 0.1, finFlare: 0.48, jitter: 0 };
    case 'sad':
      return { swimFreq: 1.6, swimAmp: 0.2, turnBend: 0, bladeGlow: 0.28, lunge: 0, finFlare: -0.35, jitter: 0 };
    case 'breathing':
    default:
      return { swimFreq: 3.0, swimAmp: 0.38, turnBend: 0, bladeGlow: 0.8, lunge: 0, finFlare: 0.1, jitter: 0 };
  }
}

export class VillainSwordfish {
  static metadata = {
    name: 'Villain Broadbill Swordfish',
    category: 'villain_fish',
    baseLength: 210,
    baseWidth: 68
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
    const breath = Math.sin(t * 3.0) * 0.03;
    const slash = state === 'eating' ? Math.sin(t * 24) * 0.14 : 0;
    const jx = p.jitter > 0 ? Math.sin(t * 59) * p.jitter * 1.3 : 0;
    const jy = p.jitter > 0 ? Math.cos(t * 65) * p.jitter * 1.4 : 0;

    ctx.save();
    ctx.translate(this.x + jx, this.y + jy);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Obsidian-crimson battle aura beneath swordfish
    const aura = ctx.createRadialGradient(-4, 0, 14, -4, 0, 108);
    aura.addColorStop(0, 'rgba(220, 22, 68, 0.25)');
    aura.addColorStop(0.55, 'rgba(20, 11, 28, 0.25)');
    aura.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.ellipse(-4, 4, 106, 38, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Jagged dark-steel broadsword bill with glowing crimson edge
    ctx.save();
    ctx.translate(32 + p.lunge * 6, 0);
    ctx.rotate(slash + p.turnBend * 0.1);

    const bladeGrad = ctx.createLinearGradient(0, -8, 76, 8);
    bladeGrad.addColorStop(0, '#3B425E');
    bladeGrad.addColorStop(0.5, '#1E2235');
    bladeGrad.addColorStop(1, '#586284');
    ctx.fillStyle = bladeGrad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3.2;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(-4, -9);
    ctx.lineTo(24, -6.5);
    // Jagged broadsword serration notch
    ctx.lineTo(30, -9);
    ctx.lineTo(38, -5.5);
    ctx.lineTo(75, 0);
    ctx.lineTo(38, 5.5);
    ctx.lineTo(30, 9);
    ctx.lineTo(24, 6.5);
    ctx.lineTo(-4, 9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing crimson forged fuller & razor edge
    const glow = Math.min(1, 0.55 + 0.35 * p.bladeGlow + 0.12 * Math.sin(t * 6));
    ctx.strokeStyle = `rgba(255, 38, 82, ${glow})`;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(4, 0);
    ctx.lineTo(70, 0);
    ctx.stroke();

    ctx.strokeStyle = `rgba(255, 92, 128, ${glow * 0.85})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(38, -4.5);
    ctx.lineTo(73, 0);
    ctx.lineTo(38, 4.5);
    ctx.stroke();
    ctx.restore();

    // 3. Swept crescent lunate caudal tail (high-speed predator)
    const tailX = -68;
    const tailY = wag * 6 + p.turnBend * 10;
    const tipY = wag * 16 + p.turnBend * 26;

    const tailGrad = ctx.createLinearGradient(tailX, tailY, -102, tipY);
    tailGrad.addColorStop(0, '#2B3150');
    tailGrad.addColorStop(0.65, '#171A2E');
    tailGrad.addColorStop(1, '#A6173B');
    ctx.fillStyle = tailGrad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3.2;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(tailX + 6, tailY - 4);
    ctx.quadraticCurveTo(-84, tipY - 26, -104, tipY - 30);
    ctx.quadraticCurveTo(-90, tipY - 10, -82, tipY);
    ctx.quadraticCurveTo(-90, tipY + 10, -104, tipY + 30);
    ctx.quadraticCurveTo(-84, tipY + 26, tailX + 6, tailY + 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 4. Swept sickle pectoral fins (battle-notched obsidian steel)
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(10, side * 20);
      ctx.rotate(side * (0.28 + p.finFlare * 0.18 + wag * 0.08 - p.turnBend * 0.25 * side));
      ctx.fillStyle = '#242A45';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 3.2;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.quadraticCurveTo(-4, side * 22, -26, side * 32);
      ctx.lineTo(-19, side * 20);
      ctx.lineTo(-12, side * 16);
      ctx.lineTo(-17, side * 11);
      ctx.lineTo(-10, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 5. Obsidian-indigo armored chunky chibi body
    ctx.save();
    ctx.scale(1 + breath, 1 - breath * 0.5);
    const bodyGrad = ctx.createLinearGradient(44, -27, -68, 27);
    bodyGrad.addColorStop(0, '#3A4370');
    bodyGrad.addColorStop(0.42, '#222848');
    bodyGrad.addColorStop(1, '#131526');
    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3.8;

    ctx.beginPath();
    ctx.moveTo(46, 0);
    ctx.bezierCurveTo(42, -23, 18, -30, -10, -24);
    ctx.bezierCurveTo(-36, -18, -54, -9 + tailY * 0.4, tailX, tailY - 4.5);
    ctx.lineTo(tailX, tailY + 4.5);
    ctx.bezierCurveTo(-54, 9 + tailY * 0.4, -36, 18, -10, 24);
    ctx.bezierCurveTo(18, 30, 42, 23, 46, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Segmented obsidian armor plates on back
    ctx.strokeStyle = '#120E20';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(14, -24);
    ctx.quadraticCurveTo(6, 0, 14, 24);
    ctx.moveTo(-14, -21);
    ctx.quadraticCurveTo(-22, 0, -14, 21);
    ctx.stroke();

    // Crimson glowing armor trim runes
    const runeGlow = Math.min(1, 0.5 + 0.35 * p.bladeGlow);
    ctx.strokeStyle = `rgba(255, 42, 88, ${runeGlow})`;
    ctx.lineWidth = 2;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(6, side * 16);
      ctx.lineTo(-10, side * 14);
      ctx.lineTo(-26, side * 10);
      ctx.stroke();
    }

    // Notched sickle dorsal fin ridge (iconic swordfish fin seen from top-down)
    ctx.fillStyle = '#1D213B';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.quadraticCurveTo(-4, -7 + wag * 3, -24, wag * 4);
    ctx.lineTo(-16, wag * 2.5);
    ctx.quadraticCurveTo(-4, 6 + wag * 3, 12, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glossy indigo armor highlight
    ctx.fillStyle = 'rgba(168, 194, 255, 0.24)';
    ctx.beginPath();
    ctx.ellipse(22, -9, 13, 4.8, -0.15, 0, Math.PI * 2);
    ctx.fill();

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
      ctx.translate(28, side * 14);

      if (state === 'stress') {
        ctx.strokeStyle = '#FF3366';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-4.5, -3.5 * side);
        ctx.lineTo(4, 0);
        ctx.lineTo(-4.5, 3.5 * side);
        ctx.stroke();
      } else {
        const isShock = state === 'shock';
        const isFear = state === 'fear';
        const rx = isShock ? 7.4 : (isFear ? 6.6 : 6.0);
        const ry = isShock ? 6.6 : (isFear ? 5.8 : 5.0);

        ctx.fillStyle = OUTLINE;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx + 1.6, ry + 1.6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = (isShock || isFear) ? '#FFF2F6' : '#FF2958';
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#140B1C';
        if (isShock || isFear) {
          ctx.beginPath();
          ctx.arc(1 + Math.sin(t * 48) * 1.0, 0, 2.0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.ellipse(1.5, 0, 1.8, ry * 0.72, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(2.8, -1.8 * side, 1.7, 0, Math.PI * 2);
        ctx.arc(-1.6, 1.4 * side, 0.9, 0, Math.PI * 2);
        ctx.fill();

        if (state === 'relax') {
          ctx.fillStyle = '#222848';
          ctx.beginPath();
          ctx.ellipse(-2, 0, rx + 0.9, ry + 0.9, 0, Math.PI * 0.5, Math.PI * 1.5);
          ctx.fill();
        }
      }

      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 3.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (state === 'sad' || state === 'fear') {
        ctx.moveTo(-5, -5 * side);
        ctx.lineTo(6, -7.8 * side);
      } else if (state === 'shock') {
        ctx.moveTo(-5.5, -7.8 * side);
        ctx.lineTo(5.5, -7.8 * side);
      } else {
        ctx.moveTo(-5, -7.4 * side);
        ctx.lineTo(6.8, -2.5 * side);
      }
      ctx.stroke();

      ctx.restore();
    }
  }

  _drawMoodVFX(ctx, state, t) {
    if (state === 'happy') {
      for (let i = 0; i < 3; i++) {
        const s = 3.8 + Math.sin(t * 6 + i * 2) * 2.4;
        const sx = 30 + i * 18;
        const sy = i % 2 === 0 ? -32 : 32;
        ctx.fillStyle = i === 1 ? '#FF2958' : '#C94DFF';
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 1.3;
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
      ctx.translate(54, -26);
      ctx.fillStyle = '#FF2958';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-3.5, -12);
      ctx.lineTo(3.5, -12);
      ctx.lineTo(2, 2);
      ctx.lineTo(-2, 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 7.5, 2.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (state === 'fear') {
      const d = (t * 24) % 12;
      for (const side of [-1, 1]) {
        ctx.fillStyle = '#8CE8FF';
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(22, side * (29 + d * 0.4));
        ctx.quadraticCurveTo(14, side * (26 + d * 0.4), 12, side * (29 + d * 0.4));
        ctx.quadraticCurveTo(14, side * (32 + d * 0.4), 22, side * (29 + d * 0.4));
        ctx.fill();
        ctx.stroke();
      }
    } else if (state === 'stress') {
      const pulse = 1 + Math.sin(t * 32) * 0.15;
      ctx.save();
      ctx.translate(16, -30);
      ctx.scale(pulse, pulse);
      ctx.strokeStyle = '#FF2958';
      ctx.lineWidth = 2.8;
      ctx.lineCap = 'round';
      for (let q = 0; q < 4; q++) {
        ctx.save();
        ctx.rotate((q * Math.PI) / 2);
        ctx.beginPath();
        ctx.moveTo(2, 2);
        ctx.quadraticCurveTo(4, 6.5, 8.5, 7.5);
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    } else if (state === 'sad') {
      const d = (t * 15) % 12;
      ctx.fillStyle = '#7CE0FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(30, 22 + d * 0.4);
      ctx.quadraticCurveTo(25, 29 + d * 0.4, 30, 32 + d * 0.4);
      ctx.quadraticCurveTo(35, 29 + d * 0.4, 30, 22 + d * 0.4);
      ctx.fill();
      ctx.stroke();
    }
  }
}

export default VillainSwordfish;
