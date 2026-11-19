/**
 * Villain Great Barracuda — 2D Top-Down Expressive Chibi Villain ES Module
 * Dark chrome-obsidian needle torpedo, jagged glowing crimson chevron scars, wicked underslung fanged jaw.
 */

const OUTLINE = '#140B1C';
const VALID_STATES = new Set([
  'breathing', 'swimming', 'relax', 'left_turn', 'right_turn',
  'eating', 'hungry', 'stress', 'fear', 'shock', 'happy', 'sad'
]);
const ONE_SHOT_DURATIONS = {
  left_turn: 0.48,
  right_turn: 0.48,
  eating: 0.58,
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
      return { swimFreq: 8.2, swimAmp: 1.0, turnBend: 0, jawSnap: 0.25, scarGlow: 0.9, jitter: 0 };
    case 'relax':
      return { swimFreq: 2.1, swimAmp: 0.22, turnBend: 0, jawSnap: 0.0, scarGlow: 0.35, jitter: 0 };
    case 'left_turn':
      return { swimFreq: 6.4, swimAmp: 0.55, turnBend: -0.75, jawSnap: 0.3, scarGlow: 1.0, jitter: 0 };
    case 'right_turn':
      return { swimFreq: 6.4, swimAmp: 0.55, turnBend: 0.75, jawSnap: 0.3, scarGlow: 1.0, jitter: 0 };
    case 'eating':
      return { swimFreq: 9.0, swimAmp: 0.65, turnBend: 0, jawSnap: 1.0, scarGlow: 1.45, jitter: 0.25 };
    case 'hungry':
      return { swimFreq: 7.4, swimAmp: 0.75, turnBend: 0, jawSnap: 0.68, scarGlow: 1.3, jitter: 0.12 };
    case 'stress':
      return { swimFreq: 10.5, swimAmp: 0.4, turnBend: 0, jawSnap: 0.4, scarGlow: 1.2, jitter: 1.1 };
    case 'fear':
      return { swimFreq: 12.0, swimAmp: 0.45, turnBend: 0, jawSnap: 0.35, scarGlow: 0.5, jitter: 1.45 };
    case 'shock':
      return { swimFreq: 13.5, swimAmp: 0.25, turnBend: 0, jawSnap: 0.8, scarGlow: 1.5, jitter: 1.7 };
    case 'happy':
      return { swimFreq: 5.5, swimAmp: 0.68, turnBend: 0, jawSnap: 0.35, scarGlow: 1.05, jitter: 0 };
    case 'sad':
      return { swimFreq: 1.8, swimAmp: 0.18, turnBend: 0, jawSnap: 0.05, scarGlow: 0.25, jitter: 0 };
    case 'breathing':
    default:
      return { swimFreq: 3.2, swimAmp: 0.38, turnBend: 0, jawSnap: 0.12, scarGlow: 0.72, jitter: 0 };
  }
}

export class VillainBarracudafish {
  static metadata = {
    name: 'Villain Great Barracuda',
    category: 'villain_fish',
    baseLength: 160,
    baseWidth: 38
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
    const breath = Math.sin(t * 3.4) * 0.028;
    const jx = p.jitter > 0 ? Math.sin(t * 59) * p.jitter * 1.2 : 0;
    const jy = p.jitter > 0 ? Math.cos(t * 67) * p.jitter * 1.3 : 0;

    ctx.save();
    ctx.translate(this.x + jx, this.y + jy);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Dark crimson-obsidian miasma aura
    const aura = ctx.createRadialGradient(0, 0, 10, 0, 0, 86);
    aura.addColorStop(0, 'rgba(210, 24, 58, 0.24)');
    aura.addColorStop(0.55, 'rgba(20, 11, 28, 0.24)');
    aura.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.ellipse(-2, 3, 84, 24, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Razor-forked barracuda caudal tail
    const tailBaseX = -56;
    const tailBaseY = wag * 6 + p.turnBend * 10;
    const tailTipY = wag * 15 + p.turnBend * 22;

    const tailGrad = ctx.createLinearGradient(tailBaseX, tailBaseY, -82, tailTipY);
    tailGrad.addColorStop(0, '#303444');
    tailGrad.addColorStop(0.65, '#191926');
    tailGrad.addColorStop(1, '#9E1436');
    ctx.fillStyle = tailGrad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(tailBaseX + 4, tailBaseY - 4);
    ctx.lineTo(-82, tailTipY - 17);
    ctx.lineTo(-73, tailTipY - 5);
    ctx.lineTo(-66, tailTipY);
    ctx.lineTo(-73, tailTipY + 5);
    ctx.lineTo(-82, tailTipY + 17);
    ctx.lineTo(tailBaseX + 4, tailBaseY + 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 3. Sharp dagger pectoral & pelvic fins
    for (const side of [-1, 1]) {
      // Pectoral
      ctx.save();
      ctx.translate(22, side * 12);
      ctx.rotate(side * (0.28 + wag * 0.1 - p.turnBend * 0.25 * side));
      ctx.fillStyle = '#292D3C';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(-14, side * 16);
      ctx.lineTo(-9, side * 7);
      ctx.lineTo(-14, side * 4);
      ctx.lineTo(-8, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Rear pelvic
      ctx.fillStyle = '#222534';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-22, side * 8);
      ctx.lineTo(-34, side * 14);
      ctx.lineTo(-30, side * 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // 4. Wicked underslung fanged jaw protruding ahead of snout
    const chomp = state === 'eating' ? Math.abs(Math.sin(t * 25)) : (state === 'hungry' ? Math.abs(Math.sin(t * 12)) * 0.45 : 0);
    const jawExt = 4 + p.jawSnap * 6 + chomp * 5;

    ctx.fillStyle = '#1D1E2A';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(64, -7.5);
    ctx.lineTo(78 + jawExt, -3.5);
    ctx.lineTo(82 + jawExt, 0);
    ctx.lineTo(78 + jawExt, 3.5);
    ctx.lineTo(64, 7.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing crimson-rimmed snapping barracuda fangs jutting out sideways
    ctx.fillStyle = '#FFF5F8';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.6;
    for (const side of [-1, 1]) {
      for (let f = 0; f < 4; f++) {
        const fx = 66 + f * 3.6 + jawExt * 0.55;
        const fy = side * (6.8 - f * 0.9);
        ctx.beginPath();
        ctx.moveTo(fx - 1.5, fy);
        ctx.lineTo(fx + 1.8, fy + side * (4.2 + p.jawSnap * 1.8));
        ctx.lineTo(fx + 2.0, fy);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    // 5. Dark chrome-obsidian needle torpedo body (front-heavy chibi torpedo)
    ctx.save();
    ctx.scale(1 + breath, 1 - breath * 0.5);
    const bodyGrad = ctx.createLinearGradient(72, -19, -58, 19);
    bodyGrad.addColorStop(0, '#596178');
    bodyGrad.addColorStop(0.28, '#2F3445');
    bodyGrad.addColorStop(0.7, '#1B1D2A');
    bodyGrad.addColorStop(1, '#12121D');
    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3.5;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(74, 0);
    ctx.bezierCurveTo(66, -15, 34, -20, 4, -17);
    ctx.bezierCurveTo(-22, -14, -42, -9 + tailBaseY * 0.4, tailBaseX, tailBaseY - 4.5);
    ctx.lineTo(tailBaseX, tailBaseY + 4.5);
    ctx.bezierCurveTo(-42, 9 + tailBaseY * 0.4, -22, 14, 4, 17);
    ctx.bezierCurveTo(34, 20, 66, 15, 74, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Metallic chrome dorsal highlight strip
    ctx.fillStyle = 'rgba(204, 222, 255, 0.24)';
    ctx.beginPath();
    ctx.ellipse(24, -6, 32, 4.5, -0.05, 0, Math.PI * 2);
    ctx.fill();

    // Jagged glowing crimson chevron scars along torpedo flanks
    const glow = Math.min(1, 0.48 + 0.35 * p.scarGlow + 0.14 * Math.sin(t * 5.2));
    ctx.strokeStyle = `rgba(255, 36, 78, ${glow})`;
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const chevrons = [20, 4, -12, -28, -42];
    for (let i = 0; i < chevrons.length; i++) {
      const cx = chevrons[i];
      const halfH = 13.5 - i * 1.8;
      ctx.beginPath();
      ctx.moveTo(cx - 5, -halfH);
      ctx.lineTo(cx + 3, 0);
      ctx.lineTo(cx - 5, halfH);
      ctx.stroke();
    }

    // Two sharp dorsal ridges
    for (const dx of [-4, -34]) {
      ctx.fillStyle = '#1E202E';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(dx + 7, 0);
      ctx.lineTo(dx - 8, wag * 2.5);
      ctx.lineTo(dx + 2, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

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
      ctx.translate(46, side * 9.5);

      if (state === 'stress') {
        ctx.strokeStyle = '#FF335C';
        ctx.lineWidth = 2.8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-4, -3 * side);
        ctx.lineTo(3.5, 0);
        ctx.lineTo(-4, 3 * side);
        ctx.stroke();
      } else {
        const isShock = state === 'shock';
        const isFear = state === 'fear';
        const rx = isShock ? 6.4 : (isFear ? 5.8 : 5.2);
        const ry = isShock ? 5.6 : (isFear ? 5.0 : 4.2);

        ctx.fillStyle = OUTLINE;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx + 1.5, ry + 1.5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = (isShock || isFear) ? '#FFF2F5' : '#FF244C';
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#140B1C';
        if (isShock || isFear) {
          ctx.beginPath();
          ctx.arc(1 + Math.sin(t * 48) * 0.9, 0, 1.8, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.ellipse(1.4, 0, 1.6, ry * 0.72, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        // Dual catchlights
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(2.4, -1.5 * side, 1.5, 0, Math.PI * 2);
        ctx.arc(-1.4, 1.2 * side, 0.85, 0, Math.PI * 2);
        ctx.fill();

        if (state === 'relax') {
          ctx.fillStyle = '#2F3445';
          ctx.beginPath();
          ctx.ellipse(-1.8, 0, rx + 0.8, ry + 0.8, 0, Math.PI * 0.5, Math.PI * 1.5);
          ctx.fill();
        }
      }

      // Sharp V-brow
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (state === 'sad' || state === 'fear') {
        ctx.moveTo(-4.5, -4 * side);
        ctx.lineTo(5.5, -6.5 * side);
      } else if (state === 'shock') {
        ctx.moveTo(-5, -6.5 * side);
        ctx.lineTo(5, -6.5 * side);
      } else {
        ctx.moveTo(-4.5, -6.2 * side);
        ctx.lineTo(6.2, -2.0 * side);
      }
      ctx.stroke();

      ctx.restore();
    }
  }

  _drawMoodVFX(ctx, state, t) {
    if (state === 'happy') {
      for (let i = 0; i < 3; i++) {
        const s = 3.5 + Math.sin(t * 6.5 + i * 2) * 2.2;
        const sx = 46 + i * 16;
        const sy = i % 2 === 0 ? -24 : 24;
        ctx.fillStyle = i === 1 ? '#FF2E5C' : '#C94DFF';
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
      ctx.translate(82, -20);
      ctx.fillStyle = '#FF244C';
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
      ctx.arc(0, 6.5, 2.5, 0, Math.PI * 2);
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
        ctx.moveTo(36, side * (22 + d * 0.4));
        ctx.quadraticCurveTo(28, side * (19 + d * 0.4), 26, side * (22 + d * 0.4));
        ctx.quadraticCurveTo(28, side * (25 + d * 0.4), 36, side * (22 + d * 0.4));
        ctx.fill();
        ctx.stroke();
      }
    } else if (state === 'stress') {
      const pulse = 1 + Math.sin(t * 32) * 0.14;
      ctx.save();
      ctx.translate(34, -24);
      ctx.scale(pulse, pulse);
      ctx.strokeStyle = '#FF244C';
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
      ctx.moveTo(48, 16 + d * 0.4);
      ctx.quadraticCurveTo(44, 22 + d * 0.4, 48, 25 + d * 0.4);
      ctx.quadraticCurveTo(52, 22 + d * 0.4, 48, 16 + d * 0.4);
      ctx.fill();
      ctx.stroke();
    }
  }
}

export default VillainBarracudafish;
