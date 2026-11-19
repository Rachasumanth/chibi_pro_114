/**
 * Villain Spotted Pufferfish — 2D Top-Down Expressive Chibi Villain ES Module
 * Dark purple-charcoal sea-mine-like balloon body with glowing toxic-green spots & angry villain scowl;
 * inflates extra round like a spiked naval mine in shock/fear.
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
  shock: 0.82
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
      return { swimFreq: 8.5, swimAmp: 1.0, turnBend: 0, inflate: 0.08, spikeOut: 0.18, toxicGlow: 0.9, jitter: 0 };
    case 'relax':
      return { swimFreq: 2.2, swimAmp: 0.28, turnBend: 0, inflate: -0.05, spikeOut: 0.05, toxicGlow: 0.45, jitter: 0 };
    case 'left_turn':
      return { swimFreq: 7.0, swimAmp: 0.65, turnBend: -0.65, inflate: 0.12, spikeOut: 0.25, toxicGlow: 1.0, jitter: 0 };
    case 'right_turn':
      return { swimFreq: 7.0, swimAmp: 0.65, turnBend: 0.65, inflate: 0.12, spikeOut: 0.25, toxicGlow: 1.0, jitter: 0 };
    case 'eating':
      return { swimFreq: 9.0, swimAmp: 0.7, turnBend: 0, inflate: 0.2, spikeOut: 0.35, toxicGlow: 1.4, jitter: 0.2 };
    case 'hungry':
      return { swimFreq: 7.2, swimAmp: 0.75, turnBend: 0, inflate: 0.18, spikeOut: 0.3, toxicGlow: 1.3, jitter: 0.12 };
    case 'stress':
      return { swimFreq: 11.0, swimAmp: 0.5, turnBend: 0, inflate: 0.45, spikeOut: 0.55, toxicGlow: 1.25, jitter: 1.2 };
    case 'fear':
      return { swimFreq: 13.0, swimAmp: 0.55, turnBend: 0, inflate: 1.0, spikeOut: 1.0, toxicGlow: 1.35, jitter: 1.5 };
    case 'shock':
      return { swimFreq: 14.5, swimAmp: 0.35, turnBend: 0, inflate: 1.2, spikeOut: 1.15, toxicGlow: 1.6, jitter: 1.8 };
    case 'happy':
      return { swimFreq: 5.8, swimAmp: 0.7, turnBend: 0, inflate: 0.12, spikeOut: 0.2, toxicGlow: 1.15, jitter: 0 };
    case 'sad':
      return { swimFreq: 1.8, swimAmp: 0.2, turnBend: 0, inflate: -0.08, spikeOut: 0.05, toxicGlow: 0.3, jitter: 0 };
    case 'breathing':
    default:
      return { swimFreq: 3.4, swimAmp: 0.42, turnBend: 0, inflate: 0.0, spikeOut: 0.12, toxicGlow: 0.8, jitter: 0 };
  }
}

export class VillainPufferfish {
  static metadata = {
    name: 'Villain Spotted Pufferfish',
    category: 'villain_fish',
    baseLength: 85,
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
    const breath = Math.sin(t * 3.5) * 0.04;
    const rx = 31 + p.inflate * 11;
    const ry = 25 + p.inflate * 16; // Inflates extra round like a spiked naval mine in shock/fear!
    const jx = p.jitter > 0 ? Math.sin(t * 61) * p.jitter * 1.4 : 0;
    const jy = p.jitter > 0 ? Math.cos(t * 67) * p.jitter * 1.5 : 0;

    ctx.save();
    ctx.translate(this.x + jx, this.y + jy);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Toxic-green & dark-plum sea-mine aura
    const aura = ctx.createRadialGradient(0, 0, 10, 0, 0, rx + 26);
    aura.addColorStop(0, 'rgba(92, 255, 76, 0.28)');
    aura.addColorStop(0.55, 'rgba(32, 14, 46, 0.25)');
    aura.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.ellipse(0, 3, rx + 22, ry + 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Stubby fluttering puffer tail
    const tailBaseX = -rx + 3;
    const tailY = wag * 6 + p.turnBend * 10;
    ctx.fillStyle = '#3B284D';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.8;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(tailBaseX, -5);
    ctx.quadraticCurveTo(tailBaseX - 14, tailY - 12, tailBaseX - 18, tailY - 8);
    ctx.lineTo(tailBaseX - 15, tailY);
    ctx.lineTo(tailBaseX - 18, tailY + 8);
    ctx.quadraticCurveTo(tailBaseX - 14, tailY + 12, tailBaseX, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 3. Fluttering stubby side fins
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(4, side * (ry - 3));
      ctx.rotate(side * (0.2 + Math.sin(t * p.swimFreq * 1.4) * 0.32 - p.turnBend * 0.25 * side));
      ctx.fillStyle = '#4B3261';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.ellipse(-2, side * 7, 6.5, 9.5, side * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 4. Naval-mine detonator spikes around perimeter (expand dramatically in shock/fear)
    const spikeCount = 12;
    const spikeLen = 4.5 + p.spikeOut * 11.5;
    for (let i = 0; i < spikeCount; i++) {
      const a = (i / spikeCount) * Math.PI * 2;
      if (Math.abs(a) < 0.35 || Math.abs(a - Math.PI * 2) < 0.35) continue; // Keep snout mouth clear
      const bx = Math.cos(a) * (rx - 2);
      const by = Math.sin(a) * (ry - 2);
      const tx = Math.cos(a) * (rx + spikeLen);
      const ty = Math.sin(a) * (ry + spikeLen);
      const px = -Math.sin(a) * 3.6;
      const py = Math.cos(a) * 3.6;

      ctx.fillStyle = p.spikeOut > 0.6 ? '#76FF33' : '#2C2038';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(bx + px, by + py);
      ctx.lineTo(tx, ty);
      ctx.lineTo(bx - px, by - py);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // 5. Dark purple-charcoal sea-mine balloon body
    ctx.save();
    ctx.scale(1 + breath, 1 - breath * 0.4);
    const bodyGrad = ctx.createRadialGradient(8, -6, 4, 0, 0, rx + 8);
    bodyGrad.addColorStop(0, '#533B6B');
    bodyGrad.addColorStop(0.55, '#2E213D');
    bodyGrad.addColorStop(1, '#1A1324');
    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3.8;

    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Sea-mine riveted equatorial band
    ctx.strokeStyle = 'rgba(20, 11, 28, 0.55)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx * 0.55, ry * 0.92, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Glowing toxic-green spots across the back
    const glow = Math.min(1, 0.55 + 0.35 * p.toxicGlow + 0.14 * Math.sin(t * 5.2));
    const spots = [
      [-14, -10, 4.4], [-18, 8, 4.0], [-4, -14, 3.8], [-2, 13, 4.2],
      [6, 0, 4.8], [-10, 0, 3.6], [10, -13, 3.2], [10, 13, 3.2]
    ];
    for (const [sx, sy, sr] of spots) {
      ctx.fillStyle = `rgba(116, 255, 64, ${glow})`;
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(sx * (rx / 31), sy * (ry / 25), sr, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Glossy balloon specular highlight
    ctx.fillStyle = 'rgba(218, 200, 255, 0.25)';
    ctx.beginPath();
    ctx.ellipse(10, -10, 10, 4.8, -0.25, 0, Math.PI * 2);
    ctx.fill();

    // 6. Angry puckered villain scowl / chomping beak at snout
    const chomp = state === 'eating' ? Math.abs(Math.sin(t * 22)) * 4 : (state === 'hungry' ? Math.abs(Math.sin(t * 10)) * 2 : 0);
    ctx.fillStyle = '#2A0B24';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.ellipse(rx - 1, 0, 5 + chomp, 7.5 + chomp * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Fused puffer villain buck-fangs
    ctx.fillStyle = '#F7FFE8';
    ctx.beginPath();
    ctx.moveTo(rx - 1, -4.5);
    ctx.lineTo(rx + 4.5 + chomp * 0.5, -2);
    ctx.lineTo(rx - 1, 0);
    ctx.lineTo(rx + 4.5 + chomp * 0.5, 2);
    ctx.lineTo(rx - 1, 4.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 7. Expressive Villain Chibi Eyes
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
        ctx.strokeStyle = '#8CFF38';
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
        const erx = isShock ? 7.4 : (isFear ? 6.6 : 5.8);
        const ery = isShock ? 6.8 : (isFear ? 6.0 : 5.2);

        ctx.fillStyle = OUTLINE;
        ctx.beginPath();
        ctx.ellipse(0, 0, erx + 1.6, ery + 1.6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = (isShock || isFear) ? '#F7FFE8' : (state === 'hungry' || state === 'eating' ? '#FF335C' : '#8CFF2E');
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
          ctx.fillStyle = '#2E213D';
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
        const sy = i % 2 === 0 ? -(ry + 12) : (ry + 12);
        ctx.fillStyle = i === 1 ? '#8CFF2E' : '#C84DFF';
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
      ctx.translate(rx + 18, -22);
      ctx.fillStyle = '#8CFF2E';
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
        ctx.moveTo(14, side * (ry + 14 + d * 0.4));
        ctx.quadraticCurveTo(6, side * (ry + 11 + d * 0.4), 4, side * (ry + 14 + d * 0.4));
        ctx.quadraticCurveTo(6, side * (ry + 17 + d * 0.4), 14, side * (ry + 14 + d * 0.4));
        ctx.fill();
        ctx.stroke();
      }
    } else if (state === 'stress') {
      const pulse = 1 + Math.sin(t * 32) * 0.15;
      ctx.save();
      ctx.translate(10, -(ry + 12));
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
      const d = (t * 15) % 10;
      ctx.fillStyle = '#7CE0FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(rx * 0.6, ry * 0.72 + d * 0.4);
      ctx.quadraticCurveTo(rx * 0.6 - 4, ry * 0.72 + 6 + d * 0.4, rx * 0.6, ry * 0.72 + 9 + d * 0.4);
      ctx.quadraticCurveTo(rx * 0.6 + 4, ry * 0.72 + 6 + d * 0.4, rx * 0.6, ry * 0.72 + d * 0.4);
      ctx.fill();
      ctx.stroke();
    }
  }
}

export default VillainPufferfish;
