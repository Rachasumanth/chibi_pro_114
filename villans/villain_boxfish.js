/**
 * Villain Yellow Boxfish — 2D Top-Down Expressive Chibi Villain ES Module
 * Hazard-striped black-and-toxic-gold armored cube carapace with iron corner rivets and grumpily puckered scowl.
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
      return { swimFreq: 9.0, swimAmp: 1.0, turnBend: 0, pucker: 0.2, hazardGlow: 0.95, jitter: 0 };
    case 'relax':
      return { swimFreq: 2.2, swimAmp: 0.25, turnBend: 0, pucker: 0.0, hazardGlow: 0.4, jitter: 0 };
    case 'left_turn':
      return { swimFreq: 7.4, swimAmp: 0.65, turnBend: -0.65, pucker: 0.25, hazardGlow: 1.05, jitter: 0 };
    case 'right_turn':
      return { swimFreq: 7.4, swimAmp: 0.65, turnBend: 0.65, pucker: 0.25, hazardGlow: 1.05, jitter: 0 };
    case 'eating':
      return { swimFreq: 9.5, swimAmp: 0.7, turnBend: 0, pucker: 1.0, hazardGlow: 1.45, jitter: 0.22 };
    case 'hungry':
      return { swimFreq: 7.5, swimAmp: 0.75, turnBend: 0, pucker: 0.65, hazardGlow: 1.3, jitter: 0.12 };
    case 'stress':
      return { swimFreq: 11.2, swimAmp: 0.5, turnBend: 0, pucker: 0.45, hazardGlow: 1.25, jitter: 1.15 };
    case 'fear':
      return { swimFreq: 13.0, swimAmp: 0.55, turnBend: 0, pucker: 0.55, hazardGlow: 0.55, jitter: 1.45 };
    case 'shock':
      return { swimFreq: 14.2, swimAmp: 0.35, turnBend: 0, pucker: 0.85, hazardGlow: 1.55, jitter: 1.7 };
    case 'happy':
      return { swimFreq: 5.8, swimAmp: 0.7, turnBend: 0, pucker: 0.3, hazardGlow: 1.15, jitter: 0 };
    case 'sad':
      return { swimFreq: 1.8, swimAmp: 0.2, turnBend: 0, pucker: 0.1, hazardGlow: 0.28, jitter: 0 };
    case 'breathing':
    default:
      return { swimFreq: 3.4, swimAmp: 0.4, turnBend: 0, pucker: 0.15, hazardGlow: 0.8, jitter: 0 };
  }
}

export class VillainBoxfish {
  static metadata = {
    name: 'Villain Yellow Boxfish',
    category: 'villain_fish',
    baseLength: 65,
    baseWidth: 48
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
    const breath = Math.sin(t * 3.5) * 0.028;
    const jx = p.jitter > 0 ? Math.sin(t * 60) * p.jitter * 1.2 : 0;
    const jy = p.jitter > 0 ? Math.cos(t * 66) * p.jitter * 1.3 : 0;

    ctx.save();
    ctx.translate(this.x + jx, this.y + jy);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Toxic-gold & dark hazard aura
    const aura = ctx.createRadialGradient(0, 0, 8, 0, 0, 44);
    aura.addColorStop(0, 'rgba(255, 204, 24, 0.28)');
    aura.addColorStop(0.55, 'rgba(20, 11, 28, 0.25)');
    aura.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.ellipse(0, 3, 42, 32, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Stubby rudder tail fin protruding from armored cube rear
    const tailY = wag * 6 + p.turnBend * 10;
    ctx.fillStyle = '#E0A814';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.8;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(-22, -4);
    ctx.quadraticCurveTo(-31, tailY - 10, -35, tailY - 6);
    ctx.lineTo(-33, tailY + 6);
    ctx.quadraticCurveTo(-31, tailY + 10, -22, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 3. Fluttering stubby side fins
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(2, side * 19);
      ctx.rotate(side * (0.2 + Math.sin(t * p.swimFreq * 1.3) * 0.32 - p.turnBend * 0.25 * side));
      ctx.fillStyle = '#D99E12';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(-2, side * 6, 5.5, 8.5, side * 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 4. Armored rounded-cube carapace (hazard-striped black & toxic gold)
    ctx.save();
    ctx.scale(1 + breath, 1 - breath * 0.4);

    // Build rounded cube path
    const drawCubePath = () => {
      ctx.beginPath();
      ctx.moveTo(22, -14);
      ctx.quadraticCurveTo(26, -14, 26, -10);
      ctx.lineTo(26, 10);
      ctx.quadraticCurveTo(26, 14, 22, 14);
      ctx.lineTo(14, 19);
      ctx.lineTo(-16, 19);
      ctx.quadraticCurveTo(-23, 19, -23, 12);
      ctx.lineTo(-23, -12);
      ctx.quadraticCurveTo(-23, -19, -16, -19);
      ctx.lineTo(14, -19);
      ctx.closePath();
    };

    const boxGrad = ctx.createLinearGradient(26, -19, -23, 19);
    boxGrad.addColorStop(0, '#FFD426');
    boxGrad.addColorStop(0.55, '#D9A010');
    boxGrad.addColorStop(1, '#7A5408');
    ctx.fillStyle = boxGrad;
    drawCubePath();
    ctx.fill();

    // Clip to carapace to paint bold diagonal industrial hazard stripes!
    ctx.save();
    drawCubePath();
    ctx.clip();
    ctx.fillStyle = '#1B1522';
    for (let s = -40; s <= 32; s += 14) {
      ctx.beginPath();
      ctx.moveTo(s, -24);
      ctx.lineTo(s + 7, -24);
      ctx.lineTo(s - 9, 24);
      ctx.lineTo(s - 16, 24);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Bold outline around cube carapace
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3.6;
    ctx.lineJoin = 'round';
    drawCubePath();
    ctx.stroke();

    // Raised inner armored carapace plate border
    ctx.strokeStyle = 'rgba(20, 11, 28, 0.72)';
    ctx.lineWidth = 2;
    ctx.strokeRect(-16, -12, 32, 24);

    // 4 Iron corner rivets on the armored box corners
    const rivets = [[14, -14], [14, 14], [-17, -14], [-17, 14]];
    for (const [rx, ry] of rivets) {
      ctx.fillStyle = '#6C7385';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(rx, ry, 2.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Glossy toxic-gold top specular highlight
    ctx.fillStyle = 'rgba(255, 250, 200, 0.30)';
    ctx.beginPath();
    ctx.ellipse(2, -8, 12, 3.8, -0.1, 0, Math.PI * 2);
    ctx.fill();

    // 5. Grumpily puckered scowl snout protruding from front face
    const puckerExt = 2 + p.pucker * 4.5 + (state === 'eating' ? Math.abs(Math.sin(t * 22)) * 3.5 : 0);
    ctx.fillStyle = '#2B1528';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.ellipse(27 + puckerExt * 0.5, 0, 4.5 + puckerExt * 0.4, 6.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Grumpy mini-fangs in puckered scowl
    ctx.fillStyle = '#FFFCE6';
    ctx.beginPath();
    ctx.moveTo(27, -3);
    ctx.lineTo(31 + puckerExt * 0.4, -1.5);
    ctx.lineTo(27, 0);
    ctx.lineTo(31 + puckerExt * 0.4, 1.5);
    ctx.lineTo(27, 3);
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
      ctx.translate(18, side * 11);

      if (state === 'stress') {
        ctx.strokeStyle = '#FFD426';
        ctx.lineWidth = 2.8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-3.8, -3 * side);
        ctx.lineTo(3.5, 0);
        ctx.lineTo(-3.8, 3 * side);
        ctx.stroke();
      } else {
        const isShock = state === 'shock';
        const isFear = state === 'fear';
        const rx = isShock ? 6.4 : (isFear ? 5.8 : 5.2);
        const ry = isShock ? 5.8 : (isFear ? 5.2 : 4.5);

        ctx.fillStyle = OUTLINE;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx + 1.5, ry + 1.5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = (isShock || isFear) ? '#FFFCEB' : (state === 'hungry' || state === 'eating' ? '#FF2E4D' : '#FFBF00');
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#140B1C';
        if (isShock || isFear) {
          ctx.beginPath();
          ctx.arc(0.8 + Math.sin(t * 48) * 0.9, 0, 1.8, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.ellipse(1.2, 0, 1.5, ry * 0.72, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(2.3, -1.5 * side, 1.5, 0, Math.PI * 2);
        ctx.arc(-1.2, 1.2 * side, 0.85, 0, Math.PI * 2);
        ctx.fill();

        if (state === 'relax') {
          ctx.fillStyle = '#1B1522';
          ctx.beginPath();
          ctx.ellipse(-1.6, 0, rx + 0.8, ry + 0.8, 0, Math.PI * 0.5, Math.PI * 1.5);
          ctx.fill();
        }
      }

      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (state === 'sad' || state === 'fear') {
        ctx.moveTo(-4.2, -4 * side);
        ctx.lineTo(5.2, -6.5 * side);
      } else if (state === 'shock') {
        ctx.moveTo(-4.8, -6.5 * side);
        ctx.lineTo(4.8, -6.5 * side);
      } else {
        ctx.moveTo(-4.2, -6.2 * side);
        ctx.lineTo(5.8, -2.0 * side);
      }
      ctx.stroke();

      ctx.restore();
    }
  }

  _drawMoodVFX(ctx, state, t) {
    if (state === 'happy') {
      for (let i = 0; i < 3; i++) {
        const s = 3.2 + Math.sin(t * 6 + i * 2) * 2;
        const sx = 8 + i * 12;
        const sy = i % 2 === 0 ? -28 : 28;
        ctx.fillStyle = i === 1 ? '#FFD426' : '#C84DFF';
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
      ctx.translate(36, -18);
      ctx.fillStyle = '#FFD426';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-2.8, -10);
      ctx.lineTo(2.8, -10);
      ctx.lineTo(1.6, 1.5);
      ctx.lineTo(-1.6, 1.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 6, 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (state === 'fear') {
      const d = (t * 22) % 10;
      for (const side of [-1, 1]) {
        ctx.fillStyle = '#8CE8FF';
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(10, side * (26 + d * 0.4));
        ctx.quadraticCurveTo(3, side * (23 + d * 0.4), 1, side * (26 + d * 0.4));
        ctx.quadraticCurveTo(3, side * (29 + d * 0.4), 10, side * (26 + d * 0.4));
        ctx.fill();
        ctx.stroke();
      }
    } else if (state === 'stress') {
      const pulse = 1 + Math.sin(t * 32) * 0.14;
      ctx.save();
      ctx.translate(6, -26);
      ctx.scale(pulse, pulse);
      ctx.strokeStyle = '#FF3355';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      for (let q = 0; q < 4; q++) {
        ctx.save();
        ctx.rotate((q * Math.PI) / 2);
        ctx.beginPath();
        ctx.moveTo(1.8, 1.8);
        ctx.quadraticCurveTo(3.5, 5.5, 7, 6.5);
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    } else if (state === 'sad') {
      const d = (t * 14) % 9;
      ctx.fillStyle = '#7CE0FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(20, 17 + d * 0.4);
      ctx.quadraticCurveTo(16, 22 + d * 0.4, 20, 25 + d * 0.4);
      ctx.quadraticCurveTo(24, 22 + d * 0.4, 20, 17 + d * 0.4);
      ctx.fill();
      ctx.stroke();
    }
  }
}

export default VillainBoxfish;
