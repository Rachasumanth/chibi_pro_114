/**
 * Villain Indo-Pacific Sailfish — 2D Top-Down Expressive Chibi Villain ES Module
 * Dark shadow-violet body, tattered bat-wing-like oversized sail dorsal fin with glowing eye-spots, needle lance bill.
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
      return { swimFreq: 7.4, swimAmp: 1.0, turnBend: 0, sailSpread: 0.9, eyeSpotGlow: 0.95, jitter: 0 };
    case 'relax':
      return { swimFreq: 1.8, swimAmp: 0.22, turnBend: 0, sailSpread: 0.35, eyeSpotGlow: 0.4, jitter: 0 };
    case 'left_turn':
      return { swimFreq: 5.8, swimAmp: 0.55, turnBend: -0.72, sailSpread: 1.15, eyeSpotGlow: 1.1, jitter: 0 };
    case 'right_turn':
      return { swimFreq: 5.8, swimAmp: 0.55, turnBend: 0.72, sailSpread: 1.15, eyeSpotGlow: 1.1, jitter: 0 };
    case 'eating':
      return { swimFreq: 8.6, swimAmp: 0.65, turnBend: 0, sailSpread: 1.25, eyeSpotGlow: 1.5, jitter: 0.28 };
    case 'hungry':
      return { swimFreq: 6.6, swimAmp: 0.78, turnBend: 0, sailSpread: 1.1, eyeSpotGlow: 1.35, jitter: 0.14 };
    case 'stress':
      return { swimFreq: 9.8, swimAmp: 0.42, turnBend: 0, sailSpread: 1.2, eyeSpotGlow: 1.25, jitter: 1.1 };
    case 'fear':
      return { swimFreq: 11.4, swimAmp: 0.45, turnBend: 0, sailSpread: 1.35, eyeSpotGlow: 0.55, jitter: 1.45 };
    case 'shock':
      return { swimFreq: 12.8, swimAmp: 0.25, turnBend: 0, sailSpread: 1.45, eyeSpotGlow: 1.55, jitter: 1.7 };
    case 'happy':
      return { swimFreq: 5.0, swimAmp: 0.68, turnBend: 0, sailSpread: 1.05, eyeSpotGlow: 1.2, jitter: 0 };
    case 'sad':
      return { swimFreq: 1.6, swimAmp: 0.2, turnBend: 0, sailSpread: 0.25, eyeSpotGlow: 0.25, jitter: 0 };
    case 'breathing':
    default:
      return { swimFreq: 2.9, swimAmp: 0.38, turnBend: 0, sailSpread: 0.65, eyeSpotGlow: 0.8, jitter: 0 };
  }
}

export class VillainSailfish {
  static metadata = {
    name: 'Villain Indo-Pacific Sailfish',
    category: 'villain_fish',
    baseLength: 200,
    baseWidth: 70
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
    const thrust = state === 'eating' ? Math.sin(t * 24) * 5 : 0;
    const jx = p.jitter > 0 ? Math.sin(t * 59) * p.jitter * 1.3 : 0;
    const jy = p.jitter > 0 ? Math.cos(t * 65) * p.jitter * 1.4 : 0;

    ctx.save();
    ctx.translate(this.x + jx, this.y + jy);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Shadow-violet phantom aura
    const aura = ctx.createRadialGradient(-6, 0, 14, -6, 0, 106);
    aura.addColorStop(0, 'rgba(154, 42, 232, 0.28)');
    aura.addColorStop(0.55, 'rgba(20, 11, 28, 0.25)');
    aura.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.ellipse(-6, 4, 104, 42, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Needle lance bill (slender, wicked purple-tipped rapier)
    ctx.save();
    ctx.translate(34 + thrust, 0);
    ctx.rotate(p.turnBend * 0.1);
    const lanceGrad = ctx.createLinearGradient(0, 0, 68, 0);
    lanceGrad.addColorStop(0, '#362354');
    lanceGrad.addColorStop(0.65, '#19102A');
    lanceGrad.addColorStop(1, '#E052FF');
    ctx.fillStyle = lanceGrad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(-4, -5.5);
    ctx.lineTo(68, 0);
    ctx.lineTo(-4, 5.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 3. Crescent shadow-violet caudal tail
    const tailX = -64;
    const tailY = wag * 6 + p.turnBend * 10;
    const tipY = wag * 16 + p.turnBend * 25;

    ctx.fillStyle = '#25173D';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(tailX + 5, tailY - 4);
    ctx.quadraticCurveTo(-80, tipY - 26, -100, tipY - 28);
    ctx.quadraticCurveTo(-86, tipY - 10, -78, tipY);
    ctx.quadraticCurveTo(-86, tipY + 10, -100, tipY + 28);
    ctx.quadraticCurveTo(-80, tipY + 26, tailX + 5, tailY + 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 4. Swept pectoral fins
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(10, side * 17);
      ctx.rotate(side * (0.28 + wag * 0.08 - p.turnBend * 0.24 * side));
      ctx.fillStyle = '#2E1C4D';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.quadraticCurveTo(-4, side * 18, -24, side * 24);
      ctx.lineTo(-16, side * 12);
      ctx.lineTo(-10, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 5. Dark shadow-violet chibi trunk
    ctx.save();
    ctx.scale(1 + breath, 1 - breath * 0.5);
    const bodyGrad = ctx.createLinearGradient(44, -24, -64, 24);
    bodyGrad.addColorStop(0, '#4E2E7A');
    bodyGrad.addColorStop(0.45, '#2C194A');
    bodyGrad.addColorStop(1, '#160E26');
    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3.6;

    ctx.beginPath();
    ctx.moveTo(46, 0);
    ctx.bezierCurveTo(40, -20, 16, -25, -12, -20);
    ctx.bezierCurveTo(-36, -15, -52, -8 + tailY * 0.4, tailX, tailY - 4);
    ctx.lineTo(tailX, tailY + 4);
    ctx.bezierCurveTo(-52, 8 + tailY * 0.4, -36, 15, -12, 20);
    ctx.bezierCurveTo(16, 25, 40, 20, 46, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 6. Signature Tattered Bat-Wing-Like Oversized Sail Dorsal Fin billowing to side with glowing eye-spots!
    const sailWave = Math.sin(t * (p.swimFreq * 0.65)) * 6;
    const sailReach = (24 + p.sailSpread * 16);
    const sailDir = p.turnBend < -0.1 ? 1 : -1; // Billows dramatically to the outer curve

    const sailGrad = ctx.createLinearGradient(16, 0, -48, sailDir * sailReach);
    sailGrad.addColorStop(0, '#5A228F');
    sailGrad.addColorStop(0.6, '#2A1247');
    sailGrad.addColorStop(1, '#150924');
    ctx.fillStyle = sailGrad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(22, 0);
    // Scalloped bat-wing rib tips
    ctx.quadraticCurveTo(14, sailDir * (sailReach * 0.75) + sailWave * 0.3, 6, sailDir * sailReach + sailWave * 0.4);
    ctx.quadraticCurveTo(-2, sailDir * (sailReach * 0.68) + sailWave * 0.5, -12, sailDir * (sailReach * 0.96) + sailWave * 0.6);
    ctx.quadraticCurveTo(-20, sailDir * (sailReach * 0.62) + sailWave * 0.7, -30, sailDir * (sailReach * 0.85) + sailWave * 0.8);
    ctx.quadraticCurveTo(-38, sailDir * (sailReach * 0.5) + sailWave * 0.9, -46, sailDir * (sailReach * 0.62) + sailWave);
    ctx.lineTo(-52, wag * 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Bat-wing bony sail rays
    ctx.strokeStyle = '#140B1C';
    ctx.lineWidth = 1.8;
    const ribs = [[14, 6, sailReach], [2, -12, sailReach * 0.96], [-12, -30, sailReach * 0.85], [-28, -46, sailReach * 0.62]];
    for (const [bx, tx, rLen] of ribs) {
      ctx.beginPath();
      ctx.moveTo(bx, 0);
      ctx.lineTo(tx, sailDir * rLen + sailWave * 0.6);
      ctx.stroke();
    }

    // Sinister glowing eye-spots across the bat-wing sail!
    const spotGlow = Math.min(1, 0.55 + 0.35 * p.eyeSpotGlow + 0.14 * Math.sin(t * 5));
    const eyeSpots = [
      [2, sailDir * (sailReach * 0.52) + sailWave * 0.4, 4.4],
      [-16, sailDir * (sailReach * 0.48) + sailWave * 0.6, 4.0],
      [-32, sailDir * (sailReach * 0.38) + sailWave * 0.8, 3.3]
    ];
    for (const [ex, ey, er] of eyeSpots) {
      ctx.fillStyle = `rgba(255, 64, 214, ${spotGlow})`;
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(ex, ey, er, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Slit pupil inside sail eye-spot
      ctx.fillStyle = OUTLINE;
      ctx.beginPath();
      ctx.ellipse(ex, ey, er * 0.35, er * 0.72, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Glossy forehead highlight
    ctx.fillStyle = 'rgba(218, 176, 255, 0.25)';
    ctx.beginPath();
    ctx.ellipse(24, -8, 12, 4.2, -0.15, 0, Math.PI * 2);
    ctx.fill();

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
      ctx.translate(28, side * 12.2);

      if (state === 'stress') {
        ctx.strokeStyle = '#FF52D9';
        ctx.lineWidth = 2.8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-4, -3.2 * side);
        ctx.lineTo(3.8, 0);
        ctx.lineTo(-4, 3.2 * side);
        ctx.stroke();
      } else {
        const isShock = state === 'shock';
        const isFear = state === 'fear';
        const rx = isShock ? 6.8 : (isFear ? 6.0 : 5.4);
        const ry = isShock ? 6.0 : (isFear ? 5.2 : 4.6);

        ctx.fillStyle = OUTLINE;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx + 1.5, ry + 1.5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = (isShock || isFear) ? '#FFF0FC' : (state === 'hungry' || state === 'eating' ? '#FF2965' : '#EB4DFF');
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#140B1C';
        if (isShock || isFear) {
          ctx.beginPath();
          ctx.arc(1 + Math.sin(t * 48) * 1.0, 0, 1.9, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.ellipse(1.4, 0, 1.6, ry * 0.72, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(2.5, -1.6 * side, 1.6, 0, Math.PI * 2);
        ctx.arc(-1.4, 1.3 * side, 0.85, 0, Math.PI * 2);
        ctx.fill();

        if (state === 'relax') {
          ctx.fillStyle = '#2C194A';
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
        ctx.moveTo(-4.5, -4.5 * side);
        ctx.lineTo(5.8, -7 * side);
      } else if (state === 'shock') {
        ctx.moveTo(-5, -7 * side);
        ctx.lineTo(5, -7 * side);
      } else {
        ctx.moveTo(-4.5, -6.8 * side);
        ctx.lineTo(6.4, -2.2 * side);
      }
      ctx.stroke();

      ctx.restore();
    }
  }

  _drawMoodVFX(ctx, state, t) {
    if (state === 'happy') {
      for (let i = 0; i < 3; i++) {
        const s = 3.8 + Math.sin(t * 6 + i * 2) * 2.2;
        const sx = 32 + i * 16;
        const sy = i % 2 === 0 ? -30 : 30;
        ctx.fillStyle = i === 1 ? '#FF40C6' : '#B84DFF';
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
      ctx.translate(54, -24);
      ctx.fillStyle = '#FF40C6';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-3.2, -11);
      ctx.lineTo(3.2, -11);
      ctx.lineTo(1.8, 1.5);
      ctx.lineTo(-1.8, 1.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 6.8, 2.6, 0, Math.PI * 2);
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
        ctx.moveTo(22, side * (26 + d * 0.4));
        ctx.quadraticCurveTo(14, side * (23 + d * 0.4), 12, side * (26 + d * 0.4));
        ctx.quadraticCurveTo(14, side * (29 + d * 0.4), 22, side * (26 + d * 0.4));
        ctx.fill();
        ctx.stroke();
      }
    } else if (state === 'stress') {
      const pulse = 1 + Math.sin(t * 32) * 0.14;
      ctx.save();
      ctx.translate(18, -28);
      ctx.scale(pulse, pulse);
      ctx.strokeStyle = '#FF2958';
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
      ctx.moveTo(30, 19 + d * 0.4);
      ctx.quadraticCurveTo(26, 25 + d * 0.4, 30, 28 + d * 0.4);
      ctx.quadraticCurveTo(34, 25 + d * 0.4, 30, 19 + d * 0.4);
      ctx.fill();
      ctx.stroke();
    }
  }
}

export default VillainSailfish;
