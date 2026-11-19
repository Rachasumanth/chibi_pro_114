/**
 * Villain Northern Pike — 2D Top-Down Expressive Chibi Villain ES Module
 * Dark swamp-charcoal ambush predator, glowing toxic-amber spots, scarred duck-bill snout with sharp teeth.
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
      return { swimFreq: 7.4, swimAmp: 1.0, turnBend: 0, jawOpen: 0.2, spotGlow: 0.9, jitter: 0 };
    case 'relax':
      return { swimFreq: 1.8, swimAmp: 0.22, turnBend: 0, jawOpen: 0.0, spotGlow: 0.35, jitter: 0 };
    case 'left_turn':
      return { swimFreq: 6.0, swimAmp: 0.55, turnBend: -0.7, jawOpen: 0.25, spotGlow: 1.0, jitter: 0 };
    case 'right_turn':
      return { swimFreq: 6.0, swimAmp: 0.55, turnBend: 0.7, jawOpen: 0.25, spotGlow: 1.0, jitter: 0 };
    case 'eating':
      return { swimFreq: 8.6, swimAmp: 0.65, turnBend: 0, jawOpen: 1.0, spotGlow: 1.45, jitter: 0.25 };
    case 'hungry':
      return { swimFreq: 6.5, swimAmp: 0.75, turnBend: 0, jawOpen: 0.65, spotGlow: 1.3, jitter: 0.12 };
    case 'stress':
      return { swimFreq: 9.8, swimAmp: 0.42, turnBend: 0, jawOpen: 0.35, spotGlow: 1.15, jitter: 1.05 };
    case 'fear':
      return { swimFreq: 11.4, swimAmp: 0.45, turnBend: 0, jawOpen: 0.4, spotGlow: 0.5, jitter: 1.4 };
    case 'shock':
      return { swimFreq: 12.6, swimAmp: 0.28, turnBend: 0, jawOpen: 0.85, spotGlow: 1.4, jitter: 1.65 };
    case 'happy':
      return { swimFreq: 5.0, swimAmp: 0.65, turnBend: 0, jawOpen: 0.3, spotGlow: 1.1, jitter: 0 };
    case 'sad':
      return { swimFreq: 1.6, swimAmp: 0.2, turnBend: 0, jawOpen: 0.04, spotGlow: 0.25, jitter: 0 };
    case 'breathing':
    default:
      return { swimFreq: 2.9, swimAmp: 0.36, turnBend: 0, jawOpen: 0.1, spotGlow: 0.75, jitter: 0 };
  }
}

export class VillainNorthernpikefish {
  static metadata = {
    name: 'Villain Northern Pike',
    category: 'villain_fish',
    baseLength: 155,
    baseWidth: 42
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
    const breath = Math.sin(t * 3.1) * 0.03;
    const jx = p.jitter > 0 ? Math.sin(t * 55) * p.jitter * 1.2 : 0;
    const jy = p.jitter > 0 ? Math.cos(t * 62) * p.jitter * 1.3 : 0;

    ctx.save();
    ctx.translate(this.x + jx, this.y + jy);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Dark swamp-amber miasma shadow beneath ambush predator
    const aura = ctx.createRadialGradient(-2, 0, 10, -2, 0, 84);
    aura.addColorStop(0, 'rgba(224, 152, 24, 0.24)');
    aura.addColorStop(0.55, 'rgba(20, 11, 28, 0.25)');
    aura.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.ellipse(-2, 3, 82, 27, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Broad ambush tail fin (set far back with charred amber edge)
    const tailX = -52;
    const tailY = wag * 6 + p.turnBend * 10;
    const tipY = wag * 14 + p.turnBend * 22;

    const tailGrad = ctx.createLinearGradient(tailX, tailY, -78, tipY);
    tailGrad.addColorStop(0, '#363C34');
    tailGrad.addColorStop(0.65, '#1D211E');
    tailGrad.addColorStop(1, '#A65214');
    ctx.fillStyle = tailGrad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(tailX + 4, tailY - 5);
    ctx.quadraticCurveTo(-68, tipY - 19, -78, tipY - 14);
    ctx.lineTo(-71, tipY - 4);
    ctx.lineTo(-65, tipY);
    ctx.lineTo(-71, tipY + 4);
    ctx.lineTo(-78, tipY + 14);
    ctx.quadraticCurveTo(-68, tipY + 19, tailX + 4, tailY + 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 3. Battle-scarred reddish-amber swamp fins (pectoral + far-back pelvic)
    for (const side of [-1, 1]) {
      // Pectoral
      ctx.save();
      ctx.translate(20, side * 14);
      ctx.rotate(side * (0.24 + wag * 0.08 - p.turnBend * 0.22 * side));
      ctx.fillStyle = '#523424';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.quadraticCurveTo(-2, side * 16, -16, side * 17);
      ctx.lineTo(-10, side * 9);
      ctx.lineTo(-15, side * 5);
      ctx.lineTo(-9, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Rear-set pelvic fins (classic pike ambush layout)
      ctx.fillStyle = '#472C20';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-24, side * 10);
      ctx.quadraticCurveTo(-34, side * 19, -44, side * 15);
      ctx.lineTo(-37, side * 7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // 4. Scarred flattened duck-bill snout with sharp ambush teeth
    const chomp = state === 'eating' ? Math.abs(Math.sin(t * 24)) : (state === 'hungry' ? Math.abs(Math.sin(t * 11)) * 0.45 : 0);
    const snap = 2 + p.jawOpen * 5 + chomp * 4;

    ctx.fillStyle = '#252B27';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3.2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(46, -13);
    ctx.quadraticCurveTo(66, -12, 76 + snap * 0.5, -7);
    ctx.quadraticCurveTo(81 + snap * 0.6, 0, 76 + snap * 0.5, 7);
    ctx.quadraticCurveTo(66, 12, 46, 13);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Sharp pike teeth peeking along the duck-bill rim
    ctx.fillStyle = '#FFF9E6';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.4;
    for (const side of [-1, 1]) {
      for (let f = 0; f < 4; f++) {
        const fx = 55 + f * 5.2;
        const fy = side * (11.2 - f * 1.1);
        ctx.beginPath();
        ctx.moveTo(fx - 1.4, fy);
        ctx.lineTo(fx + 1.4, fy + side * (3.6 + p.jawOpen * 1.6));
        ctx.lineTo(fx + 2.0, fy);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    // Deep battle slash scar across top of duck-bill snout
    ctx.strokeStyle = '#FF9F1C';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(54, -7);
    ctx.lineTo(70, 5);
    ctx.stroke();

    // 5. Dark swamp-charcoal chunky chibi trunk
    ctx.save();
    ctx.scale(1 + breath, 1 - breath * 0.5);
    const bodyGrad = ctx.createLinearGradient(54, -21, -54, 21);
    bodyGrad.addColorStop(0, '#3C463B');
    bodyGrad.addColorStop(0.45, '#262C29');
    bodyGrad.addColorStop(1, '#161A1B');
    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3.6;

    ctx.beginPath();
    ctx.moveTo(56, 0);
    ctx.bezierCurveTo(50, -18, 24, -22, -4, -19);
    ctx.bezierCurveTo(-26, -16, -42, -10 + tailY * 0.4, tailX, tailY - 5);
    ctx.lineTo(tailX, tailY + 5);
    ctx.bezierCurveTo(-42, 10 + tailY * 0.4, -26, 16, -4, 19);
    ctx.bezierCurveTo(24, 22, 50, 18, 56, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing toxic-amber oval spots in staggered rows
    const glow = Math.min(1, 0.5 + 0.35 * p.spotGlow + 0.14 * Math.sin(t * 4.8));
    const spots = [
      [26, -10, 4.8, 2.5], [14, -13, 5.2, 2.4], [0, -11, 5.0, 2.5], [-16, -10, 4.6, 2.3], [-32, -7, 4.0, 2.0],
      [26, 10, 4.8, 2.5], [14, 13, 5.2, 2.4], [0, 11, 5.0, 2.5], [-16, 10, 4.6, 2.3], [-32, 7, 4.0, 2.0],
      [18, 0, 4.2, 2.2], [-6, 0, 4.4, 2.2], [-24, 0, 3.8, 2.0]
    ];
    for (const [sx, sy, rx, ry] of spots) {
      ctx.fillStyle = `rgba(255, 179, 26, ${glow})`;
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(sx, sy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Far-back single dorsal fin ridge (characteristic of pike)
    ctx.fillStyle = '#4A2E22';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(-26, wag * 2);
    ctx.quadraticCurveTo(-38, -4 + wag * 4, -48, wag * 5);
    ctx.quadraticCurveTo(-38, 4 + wag * 4, -26, wag * 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glossy forehead highlight
    ctx.fillStyle = 'rgba(210, 232, 198, 0.22)';
    ctx.beginPath();
    ctx.ellipse(34, -7, 13, 4.2, -0.1, 0, Math.PI * 2);
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
      ctx.translate(42, side * 11.2);

      if (state === 'stress') {
        ctx.strokeStyle = '#FFB31A';
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
        const ry = isShock ? 5.7 : (isFear ? 5.1 : 4.4);

        ctx.fillStyle = OUTLINE;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx + 1.5, ry + 1.5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = (isShock || isFear) ? '#FFFCEB' : (state === 'hungry' || state === 'eating' ? '#FF3B2F' : '#FFB81C');
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#140B1C';
        if (isShock || isFear) {
          ctx.beginPath();
          ctx.arc(1 + Math.sin(t * 46) * 0.9, 0, 1.8, 0, Math.PI * 2);
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
          ctx.fillStyle = '#262C29';
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
        const sx = 42 + i * 16;
        const sy = i % 2 === 0 ? -25 : 25;
        ctx.fillStyle = i === 1 ? '#FFB81C' : '#C94DFF';
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
      ctx.translate(80, -20);
      ctx.fillStyle = '#FFB81C';
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
        ctx.moveTo(32, side * (24 + d * 0.4));
        ctx.quadraticCurveTo(24, side * (21 + d * 0.4), 22, side * (24 + d * 0.4));
        ctx.quadraticCurveTo(24, side * (27 + d * 0.4), 32, side * (24 + d * 0.4));
        ctx.fill();
        ctx.stroke();
      }
    } else if (state === 'stress') {
      const pulse = 1 + Math.sin(t * 32) * 0.14;
      ctx.save();
      ctx.translate(30, -26);
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
      ctx.moveTo(44, 18 + d * 0.4);
      ctx.quadraticCurveTo(40, 24 + d * 0.4, 44, 27 + d * 0.4);
      ctx.quadraticCurveTo(48, 24 + d * 0.4, 44, 18 + d * 0.4);
      ctx.fill();
      ctx.stroke();
    }
  }
}

export default VillainNorthernpikefish;
