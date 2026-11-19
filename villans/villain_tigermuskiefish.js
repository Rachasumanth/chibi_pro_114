/**
 * Villain Tiger Muskie — 2D Top-Down Expressive Chibi Villain ES Module
 * Ashen-steel body with jagged blood-black tiger bars, fierce scarred jaw, tattered crimson forked tail.
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
      return { swimFreq: 7.4, swimAmp: 1.0, turnBend: 0, jawSnap: 0.25, stripeGlow: 0.9, jitter: 0 };
    case 'relax':
      return { swimFreq: 1.8, swimAmp: 0.22, turnBend: 0, jawSnap: 0.0, stripeGlow: 0.35, jitter: 0 };
    case 'left_turn':
      return { swimFreq: 6.0, swimAmp: 0.55, turnBend: -0.72, jawSnap: 0.3, stripeGlow: 1.0, jitter: 0 };
    case 'right_turn':
      return { swimFreq: 6.0, swimAmp: 0.55, turnBend: 0.72, jawSnap: 0.3, stripeGlow: 1.0, jitter: 0 };
    case 'eating':
      return { swimFreq: 8.6, swimAmp: 0.65, turnBend: 0, jawSnap: 1.0, stripeGlow: 1.45, jitter: 0.25 };
    case 'hungry':
      return { swimFreq: 6.6, swimAmp: 0.78, turnBend: 0, jawSnap: 0.7, stripeGlow: 1.3, jitter: 0.14 };
    case 'stress':
      return { swimFreq: 9.8, swimAmp: 0.42, turnBend: 0, jawSnap: 0.4, stripeGlow: 1.2, jitter: 1.1 };
    case 'fear':
      return { swimFreq: 11.4, swimAmp: 0.45, turnBend: 0, jawSnap: 0.38, stripeGlow: 0.5, jitter: 1.45 };
    case 'shock':
      return { swimFreq: 12.8, swimAmp: 0.25, turnBend: 0, jawSnap: 0.85, stripeGlow: 1.5, jitter: 1.7 };
    case 'happy':
      return { swimFreq: 5.0, swimAmp: 0.68, turnBend: 0, jawSnap: 0.35, stripeGlow: 1.1, jitter: 0 };
    case 'sad':
      return { swimFreq: 1.6, swimAmp: 0.2, turnBend: 0, jawSnap: 0.05, stripeGlow: 0.25, jitter: 0 };
    case 'breathing':
    default:
      return { swimFreq: 2.9, swimAmp: 0.36, turnBend: 0, jawSnap: 0.12, stripeGlow: 0.75, jitter: 0 };
  }
}

export class VillainTigermuskiefish {
  static metadata = {
    name: 'Villain Tiger Muskie',
    category: 'villain_fish',
    baseLength: 165,
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
    const breath = Math.sin(t * 3.1) * 0.03;
    const jx = p.jitter > 0 ? Math.sin(t * 57) * p.jitter * 1.2 : 0;
    const jy = p.jitter > 0 ? Math.cos(t * 63) * p.jitter * 1.3 : 0;

    ctx.save();
    ctx.translate(this.x + jx, this.y + jy);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Blood-crimson shadow aura
    const aura = ctx.createRadialGradient(-2, 0, 12, -2, 0, 88);
    aura.addColorStop(0, 'rgba(205, 22, 48, 0.26)');
    aura.addColorStop(0.55, 'rgba(20, 11, 28, 0.25)');
    aura.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.ellipse(-2, 3, 86, 28, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Tattered crimson forked tail
    const tailX = -56;
    const tailY = wag * 6 + p.turnBend * 10;
    const tipY = wag * 15 + p.turnBend * 24;

    const tailGrad = ctx.createLinearGradient(tailX, tailY, -84, tipY);
    tailGrad.addColorStop(0, '#541A28');
    tailGrad.addColorStop(0.5, '#9E1432');
    tailGrad.addColorStop(1, '#E02446');
    ctx.fillStyle = tailGrad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(tailX + 4, tailY - 5);
    ctx.lineTo(-84, tipY - 19);
    // Tattered notches on upper fork
    ctx.lineTo(-76, tipY - 11);
    ctx.lineTo(-81, tipY - 7);
    ctx.lineTo(-68, tipY);
    ctx.lineTo(-81, tipY + 7);
    ctx.lineTo(-76, tipY + 11);
    ctx.lineTo(-84, tipY + 19);
    ctx.lineTo(tailX + 4, tailY + 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 3. Crimson-edged battle-notched fins
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(20, side * 15);
      ctx.rotate(side * (0.25 + wag * 0.08 - p.turnBend * 0.22 * side));
      ctx.fillStyle = '#7A1A2E';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.quadraticCurveTo(-2, side * 17, -17, side * 17);
      ctx.lineTo(-10, side * 9);
      ctx.lineTo(-14, side * 5);
      ctx.lineTo(-8, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = '#6B1729';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-26, side * 11);
      ctx.quadraticCurveTo(-37, side * 20, -47, side * 15);
      ctx.lineTo(-40, side * 7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // 4. Fierce scarred muskie jaw with jagged fangs
    const chomp = state === 'eating' ? Math.abs(Math.sin(t * 24)) : (state === 'hungry' ? Math.abs(Math.sin(t * 11)) * 0.45 : 0);
    const snap = p.jawSnap * 5 + chomp * 4;

    ctx.fillStyle = '#4B505E';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(48, -13);
    ctx.lineTo(78 + snap * 0.5, -7.5);
    ctx.quadraticCurveTo(85 + snap * 0.6, 0, 78 + snap * 0.5, 7.5);
    ctx.lineTo(48, 13);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Crossed battle scar on jaw
    ctx.strokeStyle = '#FF335C';
    ctx.lineWidth = 2.1;
    ctx.beginPath();
    ctx.moveTo(58, -8);
    ctx.lineTo(74, 6);
    ctx.moveTo(72, -6);
    ctx.lineTo(60, 5);
    ctx.stroke();

    // Jagged muskie fangs
    ctx.fillStyle = '#FFF6F8';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.4;
    for (const side of [-1, 1]) {
      for (let f = 0; f < 4; f++) {
        const fx = 57 + f * 5.2;
        const fy = side * (11.5 - f * 1.0);
        ctx.beginPath();
        ctx.moveTo(fx - 1.5, fy);
        ctx.lineTo(fx + 1.5, fy + side * (4.0 + p.jawSnap * 1.8));
        ctx.lineTo(fx + 2.0, fy);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    // 5. Ashen-steel muscular chibi body
    ctx.save();
    ctx.scale(1 + breath, 1 - breath * 0.5);
    const bodyGrad = ctx.createLinearGradient(56, -22, -56, 22);
    bodyGrad.addColorStop(0, '#6B7285');
    bodyGrad.addColorStop(0.45, '#464B59');
    bodyGrad.addColorStop(1, '#262933');
    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3.6;

    ctx.beginPath();
    ctx.moveTo(58, 0);
    ctx.bezierCurveTo(52, -19, 24, -23, -6, -20);
    ctx.bezierCurveTo(-28, -17, -46, -10 + tailY * 0.4, tailX, tailY - 5);
    ctx.lineTo(tailX, tailY + 5);
    ctx.bezierCurveTo(-46, 10 + tailY * 0.4, -28, 17, -6, 20);
    ctx.bezierCurveTo(24, 23, 52, 19, 58, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Jagged blood-black tiger bars across the ashen-steel back
    const barXs = [24, 11, -2, -15, -28, -41];
    for (let i = 0; i < barXs.length; i++) {
      const bx = barXs[i];
      const h = 19.5 - i * 2.1;
      ctx.fillStyle = '#180B14';
      ctx.beginPath();
      ctx.moveTo(bx - 3, -h);
      ctx.lineTo(bx + 4, -h * 0.4);
      ctx.lineTo(bx - 2, 0);
      ctx.lineTo(bx + 4, h * 0.4);
      ctx.lineTo(bx - 3, h);
      ctx.lineTo(bx - 7, h * 0.4);
      ctx.lineTo(bx - 5, 0);
      ctx.lineTo(bx - 7, -h * 0.4);
      ctx.closePath();
      ctx.fill();

      // Glowing crimson trim inside each tiger bar
      ctx.strokeStyle = `rgba(255, 38, 76, ${0.38 + 0.35 * p.stripeGlow})`;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(bx - 2, -h * 0.8);
      ctx.lineTo(bx + 1.5, 0);
      ctx.lineTo(bx - 2, h * 0.8);
      ctx.stroke();
    }

    // Far-back crimson dorsal fin
    ctx.fillStyle = '#871832';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(-28, wag * 2);
    ctx.quadraticCurveTo(-40, -4 + wag * 4, -52, wag * 5);
    ctx.quadraticCurveTo(-40, 4 + wag * 4, -28, wag * 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glossy ashen highlight
    ctx.fillStyle = 'rgba(225, 232, 245, 0.24)';
    ctx.beginPath();
    ctx.ellipse(36, -7, 13, 4.2, -0.1, 0, Math.PI * 2);
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
      ctx.translate(44, side * 11.5);

      if (state === 'stress') {
        ctx.strokeStyle = '#FF335C';
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

        ctx.fillStyle = (isShock || isFear) ? '#FFF2F5' : '#FF294D';
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

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(2.5, -1.6 * side, 1.5, 0, Math.PI * 2);
        ctx.arc(-1.4, 1.3 * side, 0.85, 0, Math.PI * 2);
        ctx.fill();

        if (state === 'relax') {
          ctx.fillStyle = '#464B59';
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
        const sx = 44 + i * 16;
        const sy = i % 2 === 0 ? -26 : 26;
        ctx.fillStyle = i === 1 ? '#FF294D' : '#C94DFF';
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
      ctx.translate(84, -20);
      ctx.fillStyle = '#FF294D';
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
        ctx.moveTo(34, side * (25 + d * 0.4));
        ctx.quadraticCurveTo(26, side * (22 + d * 0.4), 24, side * (25 + d * 0.4));
        ctx.quadraticCurveTo(26, side * (28 + d * 0.4), 34, side * (25 + d * 0.4));
        ctx.fill();
        ctx.stroke();
      }
    } else if (state === 'stress') {
      const pulse = 1 + Math.sin(t * 32) * 0.14;
      ctx.save();
      ctx.translate(32, -26);
      ctx.scale(pulse, pulse);
      ctx.strokeStyle = '#FF294D';
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
      ctx.moveTo(46, 18 + d * 0.4);
      ctx.quadraticCurveTo(42, 24 + d * 0.4, 46, 27 + d * 0.4);
      ctx.quadraticCurveTo(50, 24 + d * 0.4, 46, 18 + d * 0.4);
      ctx.fill();
      ctx.stroke();
    }
  }
}

export default VillainTigermuskiefish;
