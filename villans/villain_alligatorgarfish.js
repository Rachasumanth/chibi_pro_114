/**
 * Villain Alligator Gar — 2D Top-Down Expressive Chibi Villain ES Module
 * Black iron-plated diamond scales with glowing magma cracks, armored toothy alligator snout.
 */

const OUTLINE = '#140B1C';
const VALID_STATES = new Set([
  'breathing', 'swimming', 'relax', 'left_turn', 'right_turn',
  'eating', 'hungry', 'stress', 'fear', 'shock', 'happy', 'sad'
]);
const ONE_SHOT_DURATIONS = {
  left_turn: 0.54,
  right_turn: 0.54,
  eating: 0.64,
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
      return { swimFreq: 6.2, swimAmp: 1.0, turnBend: 0, jawSnap: 0.25, magmaGlow: 0.95, jitter: 0 };
    case 'relax':
      return { swimFreq: 1.7, swimAmp: 0.22, turnBend: 0, jawSnap: 0.0, magmaGlow: 0.4, jitter: 0 };
    case 'left_turn':
      return { swimFreq: 5.0, swimAmp: 0.55, turnBend: -0.68, jawSnap: 0.3, magmaGlow: 1.05, jitter: 0 };
    case 'right_turn':
      return { swimFreq: 5.0, swimAmp: 0.55, turnBend: 0.68, jawSnap: 0.3, magmaGlow: 1.05, jitter: 0 };
    case 'eating':
      return { swimFreq: 7.4, swimAmp: 0.65, turnBend: 0, jawSnap: 1.0, magmaGlow: 1.5, jitter: 0.28 };
    case 'hungry':
      return { swimFreq: 5.8, swimAmp: 0.75, turnBend: 0, jawSnap: 0.68, magmaGlow: 1.35, jitter: 0.14 };
    case 'stress':
      return { swimFreq: 9.0, swimAmp: 0.42, turnBend: 0, jawSnap: 0.4, magmaGlow: 1.25, jitter: 1.1 };
    case 'fear':
      return { swimFreq: 10.6, swimAmp: 0.45, turnBend: 0, jawSnap: 0.35, magmaGlow: 0.55, jitter: 1.4 };
    case 'shock':
      return { swimFreq: 12.0, swimAmp: 0.25, turnBend: 0, jawSnap: 0.85, magmaGlow: 1.5, jitter: 1.65 };
    case 'happy':
      return { swimFreq: 4.6, swimAmp: 0.65, turnBend: 0, jawSnap: 0.35, magmaGlow: 1.15, jitter: 0 };
    case 'sad':
      return { swimFreq: 1.5, swimAmp: 0.18, turnBend: 0, jawSnap: 0.04, magmaGlow: 0.25, jitter: 0 };
    case 'breathing':
    default:
      return { swimFreq: 2.6, swimAmp: 0.36, turnBend: 0, jawSnap: 0.12, magmaGlow: 0.78, jitter: 0 };
  }
}

export class VillainAlligatorgarfish {
  static metadata = {
    name: 'Villain Alligator Gar',
    category: 'villain_fish',
    baseLength: 185,
    baseWidth: 44
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
    const breath = Math.sin(t * 2.8) * 0.028;
    const jx = p.jitter > 0 ? Math.sin(t * 56) * p.jitter * 1.2 : 0;
    const jy = p.jitter > 0 ? Math.cos(t * 63) * p.jitter * 1.3 : 0;

    ctx.save();
    ctx.translate(this.x + jx, this.y + jy);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Dark volcanic magma shadow aura
    const aura = ctx.createRadialGradient(-4, 0, 12, -4, 0, 96);
    aura.addColorStop(0, 'rgba(255, 76, 18, 0.28)');
    aura.addColorStop(0.55, 'rgba(20, 11, 28, 0.25)');
    aura.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.ellipse(-4, 3, 94, 28, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Rounded armored gar paddle tail with magma cracks
    const tailX = -62;
    const tailY = wag * 6 + p.turnBend * 10;
    const tipY = wag * 14 + p.turnBend * 22;

    const tailGrad = ctx.createLinearGradient(tailX, tailY, -92, tipY);
    tailGrad.addColorStop(0, '#2B2931');
    tailGrad.addColorStop(0.7, '#191720');
    tailGrad.addColorStop(1, '#B32E12');
    ctx.fillStyle = tailGrad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(tailX + 4, tailY - 6);
    ctx.bezierCurveTo(-78, tipY - 19, -94, tipY - 11, -92, tipY);
    ctx.bezierCurveTo(-94, tipY + 11, -78, tipY + 19, tailX + 4, tailY + 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 3. Iron-armored pectoral & rear pelvic fins
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(16, side * 16);
      ctx.rotate(side * (0.26 + wag * 0.08 - p.turnBend * 0.2 * side));
      ctx.fillStyle = '#2B2832';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(9, 0);
      ctx.quadraticCurveTo(-2, side * 16, -18, side * 16);
      ctx.lineTo(-11, side * 7);
      ctx.lineTo(-14, side * 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = '#24212B';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-28, side * 11);
      ctx.quadraticCurveTo(-39, side * 20, -49, side * 15);
      ctx.lineTo(-42, side * 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // 4. Long armored toothy alligator snout
    const chomp = state === 'eating' ? Math.abs(Math.sin(t * 24)) : (state === 'hungry' ? Math.abs(Math.sin(t * 11)) * 0.45 : 0);
    const snap = p.jawSnap * 5 + chomp * 4;

    const snoutGrad = ctx.createLinearGradient(44, -12, 92, 12);
    snoutGrad.addColorStop(0, '#36333D');
    snoutGrad.addColorStop(1, '#1E1B24');
    ctx.fillStyle = snoutGrad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3.4;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(42, -14);
    ctx.lineTo(82 + snap * 0.4, -8.5);
    ctx.quadraticCurveTo(93 + snap * 0.5, 0, 82 + snap * 0.4, 8.5);
    ctx.lineTo(42, 14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Armored nasal bumps & glowing magma snout seams
    const magmaAlpha = Math.min(1, 0.55 + 0.35 * p.magmaGlow + 0.14 * Math.sin(t * 5.2));
    ctx.strokeStyle = `rgba(255, 92, 24, ${magmaAlpha})`;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(48, 0);
    ctx.lineTo(82, 0);
    ctx.stroke();

    for (const side of [-1, 1]) {
      ctx.fillStyle = '#FF6A1A';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(84, side * 3.4, 2.0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Double row of jagged alligator fangs jutting from armored snout
    ctx.fillStyle = '#FFF5E8';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.4;
    for (const side of [-1, 1]) {
      for (let f = 0; f < 6; f++) {
        const fx = 50 + f * 5.8;
        const fy = side * (12.6 - f * 0.85);
        const len = (f % 2 === 0 ? 4.8 : 3.2) + p.jawSnap * 1.6;
        ctx.beginPath();
        ctx.moveTo(fx - 1.5, fy);
        ctx.lineTo(fx + 1.2, fy + side * len);
        ctx.lineTo(fx + 2.0, fy);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    // 5. Black iron-plated chunky chibi trunk
    ctx.save();
    ctx.scale(1 + breath, 1 - breath * 0.5);
    const bodyGrad = ctx.createLinearGradient(48, -22, -62, 22);
    bodyGrad.addColorStop(0, '#3C3945');
    bodyGrad.addColorStop(0.5, '#222029');
    bodyGrad.addColorStop(1, '#14121A');
    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3.8;

    ctx.beginPath();
    ctx.moveTo(50, 0);
    ctx.bezierCurveTo(44, -20, 18, -23, -12, -20);
    ctx.bezierCurveTo(-36, -17, -50, -11 + tailY * 0.4, tailX, tailY - 6);
    ctx.lineTo(tailX, tailY + 6);
    ctx.bezierCurveTo(-50, 11 + tailY * 0.4, -36, 17, -12, 20);
    ctx.bezierCurveTo(18, 23, 44, 20, 50, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Ganoid iron-plated diamond scale grid with glowing magma cracks between plates
    ctx.strokeStyle = `rgba(255, 88, 20, ${magmaAlpha})`;
    ctx.lineWidth = 1.9;
    const cols = [24, 10, -4, -18, -32, -46];
    for (let c = 0; c < cols.length; c++) {
      const cx = cols[c];
      const maxH = 18 - c * 1.7;
      ctx.beginPath();
      ctx.moveTo(cx + 7, 0);
      ctx.lineTo(cx, -maxH * 0.65);
      ctx.lineTo(cx - 7, 0);
      ctx.lineTo(cx, maxH * 0.65);
      ctx.closePath();
      ctx.stroke();

      // Iron plate highlight bevel inside each diamond
      ctx.fillStyle = 'rgba(130, 128, 152, 0.16)';
      ctx.beginPath();
      ctx.moveTo(cx + 4.5, 0);
      ctx.lineTo(cx, -maxH * 0.42);
      ctx.lineTo(cx - 4.5, 0);
      ctx.lineTo(cx, maxH * 0.42);
      ctx.closePath();
      ctx.fill();
    }

    // Far-back armored dorsal fin
    ctx.fillStyle = '#2A2530';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(-34, wag * 2);
    ctx.quadraticCurveTo(-46, -4 + wag * 4, -56, wag * 5);
    ctx.quadraticCurveTo(-46, 4 + wag * 4, -34, wag * 2);
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
      ctx.translate(38, side * 12);

      if (state === 'stress') {
        ctx.strokeStyle = '#FF6A1A';
        ctx.lineWidth = 2.8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-4, -3 * side);
        ctx.lineTo(3.8, 0);
        ctx.lineTo(-4, 3 * side);
        ctx.stroke();
      } else {
        const isShock = state === 'shock';
        const isFear = state === 'fear';
        const rx = isShock ? 6.5 : (isFear ? 5.9 : 5.3);
        const ry = isShock ? 5.8 : (isFear ? 5.1 : 4.4);

        ctx.fillStyle = OUTLINE;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx + 1.5, ry + 1.5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = (isShock || isFear) ? '#FFF8EE' : (state === 'hungry' || state === 'eating' ? '#FF261B' : '#FF7B1A');
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#140B1C';
        if (isShock || isFear) {
          ctx.beginPath();
          ctx.arc(1 + Math.sin(t * 48) * 0.9, 0, 1.9, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.ellipse(1.4, 0, 1.6, ry * 0.72, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(2.5, -1.6 * side, 1.5, 0, Math.PI * 2);
        ctx.arc(-1.4, 1.3 * side, 0.85, 0, Math.PI * 2);
        ctx.fill();

        if (state === 'relax') {
          ctx.fillStyle = '#222029';
          ctx.beginPath();
          ctx.ellipse(-1.8, 0, rx + 0.8, ry + 0.8, 0, Math.PI * 0.5, Math.PI * 1.5);
          ctx.fill();
        }
      }

      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (state === 'sad' || state === 'fear') {
        ctx.moveTo(-4.5, -4.2 * side);
        ctx.lineTo(5.5, -6.8 * side);
      } else if (state === 'shock') {
        ctx.moveTo(-5, -6.8 * side);
        ctx.lineTo(5, -6.8 * side);
      } else {
        ctx.moveTo(-4.5, -6.5 * side);
        ctx.lineTo(6.2, -2.0 * side);
      }
      ctx.stroke();

      ctx.restore();
    }
  }

  _drawMoodVFX(ctx, state, t) {
    if (state === 'happy') {
      for (let i = 0; i < 3; i++) {
        const s = 3.6 + Math.sin(t * 6 + i * 2) * 2.2;
        const sx = 40 + i * 18;
        const sy = i % 2 === 0 ? -26 : 26;
        ctx.fillStyle = i === 1 ? '#FF6A1A' : '#D24DFF';
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
      ctx.translate(92, -20);
      ctx.fillStyle = '#FF551A';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-3, -11);
      ctx.lineTo(3, -11);
      ctx.lineTo(1.8, 1.5);
      ctx.lineTo(-1.8, 1.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 6.5, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (state === 'fear') {
      const d = (t * 24) % 12;
      for (const side of [-1, 1]) {
        ctx.fillStyle = '#8CE8FF';
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(28, side * (25 + d * 0.4));
        ctx.quadraticCurveTo(20, side * (22 + d * 0.4), 18, side * (25 + d * 0.4));
        ctx.quadraticCurveTo(20, side * (28 + d * 0.4), 28, side * (25 + d * 0.4));
        ctx.fill();
        ctx.stroke();
      }
    } else if (state === 'stress') {
      const pulse = 1 + Math.sin(t * 32) * 0.14;
      ctx.save();
      ctx.translate(26, -27);
      ctx.scale(pulse, pulse);
      ctx.strokeStyle = '#FF3355';
      ctx.lineWidth = 2.6;
      ctx.lineCap = 'round';
      for (let q = 0; q < 4; q++) {
        ctx.save();
        ctx.rotate((q * Math.PI) / 2);
        ctx.beginPath();
        ctx.moveTo(2, 2);
        ctx.quadraticCurveTo(3.5, 6, 7.5, 7);
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    } else if (state === 'sad') {
      const d = (t * 15) % 10;
      ctx.fillStyle = '#7CE0FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(40, 19 + d * 0.4);
      ctx.quadraticCurveTo(36, 25 + d * 0.4, 40, 28 + d * 0.4);
      ctx.quadraticCurveTo(44, 25 + d * 0.4, 40, 19 + d * 0.4);
      ctx.fill();
      ctx.stroke();
    }
  }
}

export default VillainAlligatorgarfish;
