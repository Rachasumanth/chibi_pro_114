/**
 * Villain Blue Marlin — 2D Top-Down Expressive Chibi Villain ES Module
 * Abyssal storm-blue body with crackling electric-purple stripes, barbed obsidian spear bill, wicked scythe pectorals.
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
      return { swimFreq: 7.8, swimAmp: 1.0, turnBend: 0, boltGlow: 1.0, finFlare: 0.35, jitter: 0 };
    case 'relax':
      return { swimFreq: 1.9, swimAmp: 0.22, turnBend: 0, boltGlow: 0.4, finFlare: -0.15, jitter: 0 };
    case 'left_turn':
      return { swimFreq: 6.2, swimAmp: 0.55, turnBend: -0.72, boltGlow: 1.2, finFlare: 0.7, jitter: 0 };
    case 'right_turn':
      return { swimFreq: 6.2, swimAmp: 0.55, turnBend: 0.72, boltGlow: 1.2, finFlare: 0.7, jitter: 0 };
    case 'eating':
      return { swimFreq: 8.8, swimAmp: 0.65, turnBend: 0, boltGlow: 1.6, finFlare: 0.85, jitter: 0.3 };
    case 'hungry':
      return { swimFreq: 7.0, swimAmp: 0.78, turnBend: 0, boltGlow: 1.4, finFlare: 0.58, jitter: 0.14 };
    case 'stress':
      return { swimFreq: 10.0, swimAmp: 0.42, turnBend: 0, boltGlow: 1.35, finFlare: 0.72, jitter: 1.15 };
    case 'fear':
      return { swimFreq: 11.6, swimAmp: 0.45, turnBend: 0, boltGlow: 0.5, finFlare: 0.9, jitter: 1.45 };
    case 'shock':
      return { swimFreq: 13.0, swimAmp: 0.25, turnBend: 0, boltGlow: 1.65, finFlare: 1.0, jitter: 1.75 };
    case 'happy':
      return { swimFreq: 5.2, swimAmp: 0.68, turnBend: 0, boltGlow: 1.25, finFlare: 0.5, jitter: 0 };
    case 'sad':
      return { swimFreq: 1.6, swimAmp: 0.2, turnBend: 0, boltGlow: 0.28, finFlare: -0.35, jitter: 0 };
    case 'breathing':
    default:
      return { swimFreq: 3.0, swimAmp: 0.38, turnBend: 0, boltGlow: 0.82, finFlare: 0.12, jitter: 0 };
  }
}

export class VillainBluemarlinfish {
  static metadata = {
    name: 'Villain Blue Marlin',
    category: 'villain_fish',
    baseLength: 225,
    baseWidth: 74
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
    const thrust = state === 'eating' ? Math.sin(t * 24) * 5 : 0;
    const jx = p.jitter > 0 ? Math.sin(t * 58) * p.jitter * 1.3 : 0;
    const jy = p.jitter > 0 ? Math.cos(t * 64) * p.jitter * 1.4 : 0;

    ctx.save();
    ctx.translate(this.x + jx, this.y + jy);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Crackling storm-blue & electric-purple miasma aura
    const aura = ctx.createRadialGradient(-4, 0, 14, -4, 0, 114);
    aura.addColorStop(0, 'rgba(138, 62, 255, 0.28)');
    aura.addColorStop(0.55, 'rgba(15, 22, 52, 0.25)');
    aura.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.ellipse(-4, 4, 112, 42, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Barbed obsidian spear bill with crackling purple arc
    ctx.save();
    ctx.translate(36 + thrust, 0);
    ctx.rotate(p.turnBend * 0.1);

    const spearGrad = ctx.createLinearGradient(0, -6, 76, 6);
    spearGrad.addColorStop(0, '#1D294D');
    spearGrad.addColorStop(0.55, '#131526');
    spearGrad.addColorStop(1, '#7A3BFF');
    ctx.fillStyle = spearGrad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3.2;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(-4, -7.5);
    ctx.lineTo(44, -4);
    // Wicked harpoon-like barbs near spear tip
    ctx.lineTo(40, -8.5);
    ctx.lineTo(54, -3.5);
    ctx.lineTo(76, 0);
    ctx.lineTo(54, 3.5);
    ctx.lineTo(40, 8.5);
    ctx.lineTo(44, 4);
    ctx.lineTo(-4, 7.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Crackling electric-purple arc coiling around the obsidian spear
    const boltAlpha = Math.min(1, 0.55 + 0.35 * p.boltGlow);
    ctx.strokeStyle = `rgba(188, 112, 255, ${boltAlpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= 6; i++) {
      const bx = 6 + i * 11;
      const by = (i % 2 === 0 ? -1 : 1) * (4.5 - i * 0.4) * Math.sin(t * 18 + i);
      if (i === 0) ctx.moveTo(bx, by);
      else ctx.lineTo(bx, by);
    }
    ctx.stroke();
    ctx.restore();

    // 3. Giant storm-sliced crescent marlin tail
    const tailX = -72;
    const tailY = wag * 6 + p.turnBend * 10;
    const tipY = wag * 16 + p.turnBend * 26;

    const tailGrad = ctx.createLinearGradient(tailX, tailY, -110, tipY);
    tailGrad.addColorStop(0, '#1C366B');
    tailGrad.addColorStop(0.6, '#121C3A');
    tailGrad.addColorStop(1, '#8438FF');
    ctx.fillStyle = tailGrad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3.2;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(tailX + 5, tailY - 4.5);
    ctx.quadraticCurveTo(-88, tipY - 29, -112, tipY - 34);
    ctx.quadraticCurveTo(-96, tipY - 12, -88, tipY);
    ctx.quadraticCurveTo(-96, tipY + 12, -112, tipY + 34);
    ctx.quadraticCurveTo(-88, tipY + 29, tailX + 5, tailY + 4.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 4. Wicked scythe pectoral fins (long razor-curved marlin blades)
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(12, side * 21);
      ctx.rotate(side * (0.26 + p.finFlare * 0.18 + wag * 0.08 - p.turnBend * 0.26 * side));
      const scytheGrad = ctx.createLinearGradient(10, 0, -34, side * 38);
      scytheGrad.addColorStop(0, '#22417D');
      scytheGrad.addColorStop(0.65, '#131D3B');
      scytheGrad.addColorStop(1, '#984DFF');
      ctx.fillStyle = scytheGrad;
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 3.2;
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(12, 0);
      ctx.bezierCurveTo(2, side * 26, -16, side * 38, -36, side * 38);
      ctx.quadraticCurveTo(-20, side * 24, -18, side * 16);
      ctx.lineTo(-10, side * 14);
      ctx.lineTo(-14, side * 7);
      ctx.lineTo(-10, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 5. Abyssal storm-blue muscular chibi trunk
    ctx.save();
    ctx.scale(1 + breath, 1 - breath * 0.5);
    const bodyGrad = ctx.createLinearGradient(48, -30, -72, 30);
    bodyGrad.addColorStop(0, '#29549E');
    bodyGrad.addColorStop(0.45, '#182F63');
    bodyGrad.addColorStop(1, '#101730');
    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3.8;

    ctx.beginPath();
    ctx.moveTo(50, 0);
    ctx.bezierCurveTo(44, -24, 18, -32, -12, -25);
    ctx.bezierCurveTo(-40, -18, -58, -9 + tailY * 0.4, tailX, tailY - 4.5);
    ctx.lineTo(tailX, tailY + 4.5);
    ctx.bezierCurveTo(-58, 9 + tailY * 0.4, -40, 18, -12, 25);
    ctx.bezierCurveTo(18, 32, 44, 24, 50, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Crackling electric-purple vertical storm stripes across back
    ctx.strokeStyle = `rgba(182, 92, 255, ${boltAlpha})`;
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const stripeXs = [16, 2, -12, -26, -40, -52];
    for (let i = 0; i < stripeXs.length; i++) {
      const sx = stripeXs[i];
      const h = 22 - i * 2.6;
      const z = Math.sin(t * 12 + i * 1.7) * 2.2;
      ctx.beginPath();
      ctx.moveTo(sx, -h);
      ctx.lineTo(sx + 3.5 + z, -h * 0.45);
      ctx.lineTo(sx - 3.5 - z, 0);
      ctx.lineTo(sx + 3.5 + z, h * 0.45);
      ctx.lineTo(sx, h);
      ctx.stroke();
    }

    // Long ridged marlin dorsal crest
    ctx.fillStyle = '#172854';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.quadraticCurveTo(-8, -5 + wag * 2.5, -48, wag * 4);
    ctx.quadraticCurveTo(-8, 5 + wag * 2.5, 18, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glossy storm-blue brow highlight
    ctx.fillStyle = 'rgba(154, 210, 255, 0.26)';
    ctx.beginPath();
    ctx.ellipse(24, -10, 14, 5, -0.15, 0, Math.PI * 2);
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
      ctx.translate(32, side * 14.5);

      if (state === 'stress') {
        ctx.strokeStyle = '#C966FF';
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

        ctx.fillStyle = (isShock || isFear) ? '#F7F0FF' : (state === 'hungry' || state === 'eating' ? '#FF2E7A' : '#B95CFF');
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
          ctx.fillStyle = '#182F63';
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
        const sx = 34 + i * 18;
        const sy = i % 2 === 0 ? -34 : 34;
        ctx.fillStyle = i === 1 ? '#FF337A' : '#B95CFF';
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
      ctx.translate(58, -28);
      ctx.fillStyle = '#C966FF';
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
        ctx.moveTo(24, side * (31 + d * 0.4));
        ctx.quadraticCurveTo(16, side * (28 + d * 0.4), 14, side * (31 + d * 0.4));
        ctx.quadraticCurveTo(16, side * (34 + d * 0.4), 24, side * (31 + d * 0.4));
        ctx.fill();
        ctx.stroke();
      }
    } else if (state === 'stress') {
      const pulse = 1 + Math.sin(t * 32) * 0.15;
      ctx.save();
      ctx.translate(20, -32);
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
      ctx.moveTo(34, 23 + d * 0.4);
      ctx.quadraticCurveTo(29, 30 + d * 0.4, 34, 33 + d * 0.4);
      ctx.quadraticCurveTo(39, 30 + d * 0.4, 34, 23 + d * 0.4);
      ctx.fill();
      ctx.stroke();
    }
  }
}

export default VillainBluemarlinfish;
