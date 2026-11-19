/**
 * Villain Largetooth Sawfish — 2D Top-Down Expressive Chibi Villain ES Module
 * Dark rust-iron flattened shark trunk, jagged metallic chainsaw-like rostrum lined with glowing ember teeth, battle-notched wings.
 */

const OUTLINE = '#140B1C';
const VALID_STATES = new Set([
  'breathing', 'swimming', 'relax', 'left_turn', 'right_turn',
  'eating', 'hungry', 'stress', 'fear', 'shock', 'happy', 'sad'
]);
const ONE_SHOT_DURATIONS = {
  left_turn: 0.54,
  right_turn: 0.54,
  eating: 0.66,
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
      return { swimFreq: 5.8, swimAmp: 1.0, turnBend: 0, sawRev: 0.8, emberGlow: 0.9, wingFlare: 0.35, jitter: 0 };
    case 'relax':
      return { swimFreq: 1.7, swimAmp: 0.24, turnBend: 0, sawRev: 0.1, emberGlow: 0.35, wingFlare: -0.1, jitter: 0 };
    case 'left_turn':
      return { swimFreq: 4.8, swimAmp: 0.5, turnBend: -0.65, sawRev: 1.1, emberGlow: 1.0, wingFlare: 0.65, jitter: 0 };
    case 'right_turn':
      return { swimFreq: 4.8, swimAmp: 0.5, turnBend: 0.65, sawRev: 1.1, emberGlow: 1.0, wingFlare: 0.65, jitter: 0 };
    case 'eating':
      return { swimFreq: 6.5, swimAmp: 0.6, turnBend: 0, sawRev: 2.2, emberGlow: 1.5, wingFlare: 0.75, jitter: 0.45 };
    case 'hungry':
      return { swimFreq: 5.0, swimAmp: 0.7, turnBend: 0, sawRev: 1.4, emberGlow: 1.35, wingFlare: 0.5, jitter: 0.2 };
    case 'stress':
      return { swimFreq: 8.5, swimAmp: 0.4, turnBend: 0, sawRev: 1.2, emberGlow: 1.2, wingFlare: 0.6, jitter: 1.1 };
    case 'fear':
      return { swimFreq: 10.2, swimAmp: 0.45, turnBend: 0, sawRev: 0.2, emberGlow: 0.5, wingFlare: 0.85, jitter: 1.4 };
    case 'shock':
      return { swimFreq: 11.5, swimAmp: 0.25, turnBend: 0, sawRev: 0.15, emberGlow: 1.45, wingFlare: 1.0, jitter: 1.7 };
    case 'happy':
      return { swimFreq: 4.5, swimAmp: 0.65, turnBend: 0, sawRev: 0.9, emberGlow: 1.1, wingFlare: 0.45, jitter: 0 };
    case 'sad':
      return { swimFreq: 1.5, swimAmp: 0.2, turnBend: 0, sawRev: 0.05, emberGlow: 0.25, wingFlare: -0.35, jitter: 0 };
    case 'breathing':
    default:
      return { swimFreq: 2.5, swimAmp: 0.36, turnBend: 0, sawRev: 0.35, emberGlow: 0.7, wingFlare: 0.08, jitter: 0 };
  }
}

export class VillainSawfish {
  static metadata = {
    name: 'Villain Largetooth Sawfish',
    category: 'villain_fish',
    baseLength: 205,
    baseWidth: 78
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
    const breath = Math.sin(t * 2.9) * 0.03;
    const wag = Math.sin(t * p.swimFreq) * p.swimAmp;
    const sawSlash = state === 'eating' ? Math.sin(t * 26) * 0.16 : Math.sin(t * 14) * p.sawRev * 0.025;
    const jx = p.jitter > 0 ? Math.sin(t * 57) * p.jitter * 1.4 : 0;
    const jy = p.jitter > 0 ? Math.cos(t * 63) * p.jitter * 1.5 : 0;

    ctx.save();
    ctx.translate(this.x + jx, this.y + jy);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Dark molten-ash shadow aura
    const aura = ctx.createRadialGradient(-4, 0, 14, -4, 0, 108);
    aura.addColorStop(0, 'rgba(214, 72, 26, 0.26)');
    aura.addColorStop(0.55, 'rgba(20, 11, 28, 0.25)');
    aura.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.ellipse(-4, 4, 104, 46, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Jagged metallic chainsaw rostrum with glowing ember teeth
    ctx.save();
    ctx.translate(34, 0);
    ctx.rotate(sawSlash + p.turnBend * 0.12);

    const bladeGrad = ctx.createLinearGradient(0, -10, 74, 10);
    bladeGrad.addColorStop(0, '#4E3834');
    bladeGrad.addColorStop(0.5, '#2E2324');
    bladeGrad.addColorStop(1, '#5F443E');
    ctx.fillStyle = bladeGrad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3.2;
    ctx.lineJoin = 'round';

    // Rostrum armored metal core
    ctx.beginPath();
    ctx.moveTo(-4, -9.5);
    ctx.lineTo(66, -4.8);
    ctx.lineTo(72, 0);
    ctx.lineTo(66, 4.8);
    ctx.lineTo(-4, 9.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Central industrial weld groove + rivets
    ctx.strokeStyle = '#181014';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(2, 0);
    ctx.lineTo(63, 0);
    ctx.stroke();

    for (let r = 0; r < 4; r++) {
      ctx.fillStyle = '#FF7A2F';
      ctx.beginPath();
      ctx.arc(10 + r * 14, 0, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Glowing ember chainsaw teeth on both edges
    const toothCount = 7;
    const emberPulse = 0.7 + 0.3 * Math.sin(t * 7);
    for (const side of [-1, 1]) {
      for (let i = 0; i < toothCount; i++) {
        const tx = 8 + i * 8.4;
        const baseY = side * (8.5 - i * 0.52);
        const toothLen = (i % 2 === 0 ? 8.8 : 6.6);
        const shift = ((t * 16 * p.sawRev) % 1) * 1.2 * side;

        const tGrad = ctx.createLinearGradient(tx, baseY, tx + 2, baseY + side * toothLen);
        tGrad.addColorStop(0, '#36211F');
        tGrad.addColorStop(0.55, '#FF551A');
        tGrad.addColorStop(1, `rgba(255, 224, 102, ${Math.min(1, emberPulse * p.emberGlow)})`);
        ctx.fillStyle = tGrad;
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(tx - 2.6, baseY);
        ctx.lineTo(tx + 3.2 + shift * 0.3, baseY + side * toothLen);
        ctx.lineTo(tx + 3.0, baseY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.restore();

    // 3. Tail & caudal fin (asymmetric rust-iron shark tail)
    const tailX = -68;
    const tailY = wag * 14 + p.turnBend * 22;
    ctx.fillStyle = '#3B2826';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3.2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(-46, wag * 4 + p.turnBend * 7 - 7);
    ctx.quadraticCurveTo(-76, tailY - 22, -100, tailY - 20);
    ctx.lineTo(-92, tailY - 7);
    // Battle notch
    ctx.lineTo(-84, tailY - 4);
    ctx.lineTo(-90, tailY + 4);
    ctx.lineTo(-84, tailY + 13);
    ctx.quadraticCurveTo(-66, tailY + 10, -46, wag * 4 + p.turnBend * 7 + 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 4. Battle-notched broad pectoral ray-like wings
    const wingBeat = wag * 0.08 + p.wingFlare * 0.16;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(4, side * 14);
      ctx.rotate(side * (wingBeat - p.turnBend * 0.2 * side));
      const wGrad = ctx.createLinearGradient(14, 0, -28, side * 34);
      wGrad.addColorStop(0, '#5A3B35');
      wGrad.addColorStop(0.55, '#372423');
      wGrad.addColorStop(1, '#23161B');
      ctx.fillStyle = wGrad;
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 3.4;
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(22, 0);
      ctx.bezierCurveTo(14, side * 26, -8, side * 36, -26, side * 32);
      // Two wicked battle notches on trailing wing edge
      ctx.lineTo(-19, side * 22);
      ctx.lineTo(-27, side * 18);
      ctx.lineTo(-20, side * 11);
      ctx.lineTo(-26, side * 3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Rusty riveted armor seam & ember crack on wing
      ctx.strokeStyle = `rgba(255, 110, 42, ${0.4 + 0.3 * p.emberGlow})`;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(8, side * 7);
      ctx.lineTo(-8, side * 18);
      ctx.lineTo(-16, side * 24);
      ctx.stroke();
      ctx.restore();
    }

    // Pelvic wings
    for (const side of [-1, 1]) {
      ctx.fillStyle = '#332121';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(-26, side * 10);
      ctx.quadraticCurveTo(-36, side * 24, -48, side * 19);
      ctx.lineTo(-42, side * 7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // 5. Flattened dark rust-iron chibi trunk
    ctx.save();
    ctx.scale(1 + breath, 1 - breath * 0.5);
    const trunkGrad = ctx.createLinearGradient(40, -24, -54, 24);
    trunkGrad.addColorStop(0, '#6B463C');
    trunkGrad.addColorStop(0.45, '#472D2B');
    trunkGrad.addColorStop(1, '#25181C');
    ctx.fillStyle = trunkGrad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3.8;

    ctx.beginPath();
    ctx.moveTo(42, 0);
    ctx.bezierCurveTo(40, -22, 16, -28, -10, -22);
    ctx.bezierCurveTo(-30, -17, -48, -11 + wag * 3, -60, wag * 6 + p.turnBend * 10 - 6);
    ctx.lineTo(-60, wag * 6 + p.turnBend * 10 + 6);
    ctx.bezierCurveTo(-48, 11 + wag * 3, -30, 17, -10, 22);
    ctx.bezierCurveTo(16, 28, 40, 22, 42, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Iron plate seams & rivets across back
    ctx.strokeStyle = '#1B0F18';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(14, -20);
    ctx.quadraticCurveTo(8, 0, 14, 20);
    ctx.moveTo(-14, -18);
    ctx.quadraticCurveTo(-20, 0, -14, 18);
    ctx.stroke();

    // Glowing furnace vents (spiracles behind eyes)
    for (const side of [-1, 1]) {
      ctx.fillStyle = `rgba(255, 102, 34, ${0.55 + 0.3 * Math.sin(t * 5)})`;
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(8, side * 12, 4.2, 2.4, side * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Two dorsal ridges along spine
    for (const dx of [-18, -42]) {
      ctx.fillStyle = '#2B1B1D';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(dx + 10, 0);
      ctx.quadraticCurveTo(dx, -4 + wag * 2, dx - 12, wag * 3);
      ctx.quadraticCurveTo(dx, 4 + wag * 2, dx + 10, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Glossy metallic highlight
    ctx.fillStyle = 'rgba(255, 204, 176, 0.22)';
    ctx.beginPath();
    ctx.ellipse(22, -7, 13, 4.5, -0.15, 0, Math.PI * 2);
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
      ctx.translate(23, side * 12.5);

      if (state === 'stress') {
        ctx.strokeStyle = '#FF7733';
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
        const rx = isShock ? 7.2 : (isFear ? 6.5 : 5.8);
        const ry = isShock ? 6.5 : (isFear ? 5.8 : 4.9);

        ctx.fillStyle = OUTLINE;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx + 1.6, ry + 1.6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = (isShock || isFear) ? '#FFF7EB' : (state === 'hungry' || state === 'eating' ? '#FF2A1F' : '#FF8C1A');
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#140B1C';
        if (isShock || isFear) {
          ctx.beginPath();
          ctx.arc(1 + Math.sin(t * 45) * 1.1, 0, 2.0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.ellipse(1.5, 0, 1.8, ry * 0.72, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        // Dual catchlights
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(2.6, -1.8 * side, 1.7, 0, Math.PI * 2);
        ctx.arc(-1.5, 1.5 * side, 0.9, 0, Math.PI * 2);
        ctx.fill();

        if (state === 'relax') {
          ctx.fillStyle = '#472D2B';
          ctx.beginPath();
          ctx.ellipse(-2, 0, rx + 1, ry + 1, 0, Math.PI * 0.5, Math.PI * 1.5);
          ctx.fill();
        }
      }

      // Iron-plated angled villain brow
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 3.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (state === 'sad' || state === 'fear') {
        ctx.moveTo(-5, -5 * side);
        ctx.lineTo(6, -8 * side);
      } else if (state === 'shock') {
        ctx.moveTo(-6, -8 * side);
        ctx.lineTo(6, -8 * side);
      } else {
        ctx.moveTo(-5, -7.2 * side);
        ctx.lineTo(7, -2.5 * side);
      }
      ctx.stroke();

      ctx.restore();
    }
  }

  _drawMoodVFX(ctx, state, t) {
    if (state === 'happy') {
      for (let i = 0; i < 3; i++) {
        const s = 4 + Math.sin(t * 6 + i * 2) * 2.5;
        const sx = 28 + i * 18;
        const sy = (i % 2 === 0 ? -32 : 32);
        ctx.fillStyle = i === 1 ? '#FF5522' : '#D44DFF';
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 1.4;
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
      ctx.translate(46, -28);
      ctx.fillStyle = '#FF3B2F';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-3.5, -13);
      ctx.lineTo(3.5, -13);
      ctx.lineTo(2, 2);
      ctx.lineTo(-2, 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 8, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (state === 'fear') {
      for (const side of [-1, 1]) {
        const d = (t * 24) % 14;
        ctx.fillStyle = '#8BE8FF';
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(18, side * (28 + d * 0.4));
        ctx.quadraticCurveTo(10, side * (24 + d * 0.4), 8, side * (28 + d * 0.4));
        ctx.quadraticCurveTo(10, side * (32 + d * 0.4), 18, side * (28 + d * 0.4));
        ctx.fill();
        ctx.stroke();
      }
    } else if (state === 'stress') {
      const pulse = 1 + Math.sin(t * 30) * 0.15;
      ctx.save();
      ctx.translate(12, -30);
      ctx.scale(pulse, pulse);
      ctx.strokeStyle = '#FF3355';
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
      const d = (t * 16) % 12;
      ctx.fillStyle = '#7CE0FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(26, 20 + d * 0.5);
      ctx.quadraticCurveTo(21, 27 + d * 0.5, 26, 30 + d * 0.5);
      ctx.quadraticCurveTo(31, 27 + d * 0.5, 26, 20 + d * 0.5);
      ctx.fill();
      ctx.stroke();
    } else if (state === 'hungry' || state === 'eating') {
      // Flying forge sparks off chainsaw teeth
      for (let i = 0; i < 4; i++) {
        const a = t * 10 + i * 1.6;
        const sx = 64 + Math.cos(a) * 28;
        const sy = Math.sin(a * 1.4) * 16;
        ctx.fillStyle = '#FFAA33';
        ctx.beginPath();
        ctx.arc(sx, sy, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

export default VillainSawfish;
