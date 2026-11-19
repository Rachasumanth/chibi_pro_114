/**
 * Villain Balloon Porcupinefish — 2D Top-Down Expressive Chibi Villain ES Module
 * Obsidian-maroon spiky menace covered in razor crimson-tipped spikes that shoot out in shock/fear, blazing villain eyes.
 */

const OUTLINE = '#140B1C';
const VALID_STATES = new Set([
  'breathing', 'swimming', 'relax', 'left_turn', 'right_turn',
  'eating', 'hungry', 'stress', 'fear', 'shock', 'happy', 'sad'
]);
const ONE_SHOT_DURATIONS = {
  left_turn: 0.52,
  right_turn: 0.52,
  eating: 0.62,
  shock: 0.84
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
      return { swimFreq: 8.0, swimAmp: 1.0, turnBend: 0, inflate: 0.1, spikeShoot: 0.25, emberGlow: 0.9, jitter: 0 };
    case 'relax':
      return { swimFreq: 2.0, swimAmp: 0.25, turnBend: 0, inflate: -0.05, spikeShoot: 0.08, emberGlow: 0.4, jitter: 0 };
    case 'left_turn':
      return { swimFreq: 6.8, swimAmp: 0.6, turnBend: -0.65, inflate: 0.14, spikeShoot: 0.35, emberGlow: 1.0, jitter: 0 };
    case 'right_turn':
      return { swimFreq: 6.8, swimAmp: 0.6, turnBend: 0.65, inflate: 0.14, spikeShoot: 0.35, emberGlow: 1.0, jitter: 0 };
    case 'eating':
      return { swimFreq: 8.8, swimAmp: 0.7, turnBend: 0, inflate: 0.22, spikeShoot: 0.45, emberGlow: 1.45, jitter: 0.25 };
    case 'hungry':
      return { swimFreq: 7.0, swimAmp: 0.75, turnBend: 0, inflate: 0.2, spikeShoot: 0.4, emberGlow: 1.35, jitter: 0.14 };
    case 'stress':
      return { swimFreq: 10.8, swimAmp: 0.45, turnBend: 0, inflate: 0.5, spikeShoot: 0.7, emberGlow: 1.3, jitter: 1.2 };
    case 'fear':
      return { swimFreq: 12.8, swimAmp: 0.5, turnBend: 0, inflate: 0.95, spikeShoot: 1.25, emberGlow: 1.4, jitter: 1.55 };
    case 'shock':
      return { swimFreq: 14.5, swimAmp: 0.35, turnBend: 0, inflate: 1.1, spikeShoot: 1.5, emberGlow: 1.65, jitter: 1.85 };
    case 'happy':
      return { swimFreq: 5.5, swimAmp: 0.7, turnBend: 0, inflate: 0.12, spikeShoot: 0.28, emberGlow: 1.15, jitter: 0 };
    case 'sad':
      return { swimFreq: 1.7, swimAmp: 0.2, turnBend: 0, inflate: -0.08, spikeShoot: 0.06, emberGlow: 0.25, jitter: 0 };
    case 'breathing':
    default:
      return { swimFreq: 3.2, swimAmp: 0.4, turnBend: 0, inflate: 0.0, spikeShoot: 0.18, emberGlow: 0.8, jitter: 0 };
  }
}

export class VillainPorcupinefish {
  static metadata = {
    name: 'Villain Balloon Porcupinefish',
    category: 'villain_fish',
    baseLength: 95,
    baseWidth: 76
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
    const breath = Math.sin(t * 3.4) * 0.036;
    const rx = 34 + p.inflate * 11;
    const ry = 28 + p.inflate * 15;
    const jx = p.jitter > 0 ? Math.sin(t * 60) * p.jitter * 1.4 : 0;
    const jy = p.jitter > 0 ? Math.cos(t * 66) * p.jitter * 1.5 : 0;

    ctx.save();
    ctx.translate(this.x + jx, this.y + jy);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Crimson-obsidian menace aura
    const aura = ctx.createRadialGradient(0, 0, 12, 0, 0, rx + 30);
    aura.addColorStop(0, 'rgba(235, 24, 62, 0.28)');
    aura.addColorStop(0.55, 'rgba(24, 10, 24, 0.25)');
    aura.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.ellipse(0, 3, rx + 26, ry + 22, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Stubby maroon tail fin
    const tailBaseX = -rx + 3;
    const tailY = wag * 6 + p.turnBend * 10;
    ctx.fillStyle = '#4A182B';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(tailBaseX, -5);
    ctx.quadraticCurveTo(tailBaseX - 16, tailY - 13, tailBaseX - 20, tailY - 8);
    ctx.lineTo(tailBaseX - 16, tailY);
    ctx.lineTo(tailBaseX - 20, tailY + 8);
    ctx.quadraticCurveTo(tailBaseX - 16, tailY + 13, tailBaseX, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 3. Fluttering pectoral fins
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(4, side * (ry - 4));
      ctx.rotate(side * (0.22 + Math.sin(t * p.swimFreq * 1.4) * 0.3 - p.turnBend * 0.25 * side));
      ctx.fillStyle = '#591D34';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.ellipse(-2, side * 7.5, 7, 10, side * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 4. Outer ring of razor crimson-tipped spikes that shoot out in shock/fear!
    const outerSpikes = 18;
    const spikeLen = 6 + p.spikeShoot * 14;
    for (let i = 0; i < outerSpikes; i++) {
      const a = (i / outerSpikes) * Math.PI * 2;
      if (Math.abs(a) < 0.28 || Math.abs(a - Math.PI * 2) < 0.28) continue;
      const bx = Math.cos(a) * (rx - 3);
      const by = Math.sin(a) * (ry - 3);
      const tx = Math.cos(a) * (rx + spikeLen + (i % 2 === 0 ? 3 : 0));
      const ty = Math.sin(a) * (ry + spikeLen + (i % 2 === 0 ? 3 : 0));
      const px = -Math.sin(a) * 3.1;
      const py = Math.cos(a) * 3.1;

      const sGrad = ctx.createLinearGradient(bx, by, tx, ty);
      sGrad.addColorStop(0, '#2B111E');
      sGrad.addColorStop(0.55, '#8F1634');
      sGrad.addColorStop(1, '#FF2E5C');
      ctx.fillStyle = sGrad;
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bx + px, by + py);
      ctx.lineTo(tx, ty);
      ctx.lineTo(bx - px, by - py);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // 5. Obsidian-maroon rounded balloon body
    ctx.save();
    ctx.scale(1 + breath, 1 - breath * 0.4);
    const bodyGrad = ctx.createRadialGradient(8, -6, 5, 0, 0, rx + 8);
    bodyGrad.addColorStop(0, '#6B243E');
    bodyGrad.addColorStop(0.55, '#3B1426');
    bodyGrad.addColorStop(1, '#1B0B18');
    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3.8;

    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Dorsal crown of shorter crimson-tipped quills across the back
    const dorsalQuills = [
      [-18, -10], [-18, 10], [-8, -16], [-8, 16], [-12, 0], [2, -14], [2, 14], [0, 0]
    ];
    for (const [qx, qy] of dorsalQuills) {
      const sx = qx * (rx / 34);
      const sy = qy * (ry / 28);
      const quillR = 3.2 + p.spikeShoot * 2.4;
      ctx.fillStyle = '#FF2E5C';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(sx - quillR, sy);
      ctx.lineTo(sx - quillR * 1.8, sy + (sy >= 0 ? 1.5 : -1.5));
      ctx.lineTo(sx + quillR * 0.7, sy - quillR * 0.6);
      ctx.lineTo(sx + quillR * 0.7, sy + quillR * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Glossy obsidian-maroon forehead shine
    ctx.fillStyle = 'rgba(255, 190, 210, 0.22)';
    ctx.beginPath();
    ctx.ellipse(12, -10, 10, 4.5, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // 6. Snapping villain beak mouth
    const chomp = state === 'eating' ? Math.abs(Math.sin(t * 22)) * 4 : (state === 'hungry' ? Math.abs(Math.sin(t * 10)) * 2 : 0);
    ctx.fillStyle = '#260818';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.ellipse(rx - 1, 0, 5 + chomp, 7.2 + chomp * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFF5F7';
    ctx.beginPath();
    ctx.moveTo(rx - 1, -4.2);
    ctx.lineTo(rx + 4.5 + chomp * 0.5, -1.8);
    ctx.lineTo(rx - 1, 0);
    ctx.lineTo(rx + 4.5 + chomp * 0.5, 1.8);
    ctx.lineTo(rx - 1, 4.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 7. Blazing Villain Chibi Eyes
    this._drawVillainEyes(ctx, state, t, rx, ry);

    ctx.restore();

    // 8. Mood-reactive VFX
    this._drawMoodVFX(ctx, state, t, rx, ry);

    ctx.restore();
  }

  _drawVillainEyes(ctx, state, t, rx, ry) {
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(rx * 0.54, side * (ry * 0.52));

      if (state === 'stress') {
        ctx.strokeStyle = '#FF5C33';
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
        const erx = isShock ? 7.6 : (isFear ? 6.8 : 6.0);
        const ery = isShock ? 6.8 : (isFear ? 6.2 : 5.4);

        ctx.fillStyle = OUTLINE;
        ctx.beginPath();
        ctx.ellipse(0, 0, erx + 1.6, ery + 1.6, 0, 0, Math.PI * 2);
        ctx.fill();

        const irisGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, erx);
        irisGrad.addColorStop(0, (isShock || isFear) ? '#FFF8EC' : '#FFDD33');
        irisGrad.addColorStop(1, (isShock || isFear) ? '#FFE0E8' : '#FF244C');
        ctx.fillStyle = irisGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, erx, ery, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#140B1C';
        if (isShock || isFear) {
          ctx.beginPath();
          ctx.arc(1 + Math.sin(t * 50) * 1.1, 0, 2.0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.ellipse(1.5, 0, 1.8, ery * 0.72, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(2.6, -1.8 * side, 1.7, 0, Math.PI * 2);
        ctx.arc(-1.5, 1.4 * side, 0.9, 0, Math.PI * 2);
        ctx.fill();

        if (state === 'relax') {
          ctx.fillStyle = '#3B1426';
          ctx.beginPath();
          ctx.ellipse(-1.8, 0, erx + 0.9, ery + 0.9, 0, Math.PI * 0.5, Math.PI * 1.5);
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

  _drawMoodVFX(ctx, state, t, rx, ry) {
    if (state === 'happy') {
      for (let i = 0; i < 3; i++) {
        const s = 3.6 + Math.sin(t * 6 + i * 2) * 2.2;
        const sx = 12 + i * 14;
        const sy = i % 2 === 0 ? -(ry + 15) : (ry + 15);
        ctx.fillStyle = i === 1 ? '#FF2E5C' : '#C84DFF';
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
      ctx.translate(rx + 22, -24);
      ctx.fillStyle = '#FF2E5C';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-3.2, -12);
      ctx.lineTo(3.2, -12);
      ctx.lineTo(1.8, 1.5);
      ctx.lineTo(-1.8, 1.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 7, 2.8, 0, Math.PI * 2);
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
        ctx.moveTo(14, side * (ry + 18 + d * 0.4));
        ctx.quadraticCurveTo(6, side * (ry + 15 + d * 0.4), 4, side * (ry + 18 + d * 0.4));
        ctx.quadraticCurveTo(6, side * (ry + 21 + d * 0.4), 14, side * (ry + 18 + d * 0.4));
        ctx.fill();
        ctx.stroke();
      }
    } else if (state === 'stress') {
      const pulse = 1 + Math.sin(t * 32) * 0.15;
      ctx.save();
      ctx.translate(10, -(ry + 15));
      ctx.scale(pulse, pulse);
      ctx.strokeStyle = '#FF2E5C';
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
      const d = (t * 15) % 10;
      ctx.fillStyle = '#7CE0FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(rx * 0.6, ry * 0.74 + d * 0.4);
      ctx.quadraticCurveTo(rx * 0.6 - 4, ry * 0.74 + 6 + d * 0.4, rx * 0.6, ry * 0.74 + 9 + d * 0.4);
      ctx.quadraticCurveTo(rx * 0.6 + 4, ry * 0.74 + 6 + d * 0.4, rx * 0.6, ry * 0.74 + d * 0.4);
      ctx.fill();
      ctx.stroke();
    }
  }
}

export default VillainPorcupinefish;
