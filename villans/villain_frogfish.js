/**
 * Villain Warty Frogfish — 2D Top-Down Expressive Chibi Villain ES Module
 * Corrupted magma-black & scorched-orange lumpy body, clawed gripping pectoral fins, sinister glowing crimson skull-lure on snout.
 */

const OUTLINE = '#140B1C';
const VALID_STATES = new Set([
  'breathing', 'swimming', 'relax', 'left_turn', 'right_turn',
  'eating', 'hungry', 'stress', 'fear', 'shock', 'happy', 'sad'
]);
const ONE_SHOT_DURATIONS = {
  left_turn: 0.52,
  right_turn: 0.52,
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
      return { swimFreq: 7.4, swimAmp: 1.0, turnBend: 0, lureWave: 1.0, jawGape: 0.25, magmaGlow: 1.0, jitter: 0 };
    case 'relax':
      return { swimFreq: 1.8, swimAmp: 0.22, turnBend: 0, lureWave: 0.35, jawGape: 0.0, magmaGlow: 0.4, jitter: 0 };
    case 'left_turn':
      return { swimFreq: 6.2, swimAmp: 0.58, turnBend: -0.68, lureWave: 1.15, jawGape: 0.25, magmaGlow: 1.1, jitter: 0 };
    case 'right_turn':
      return { swimFreq: 6.2, swimAmp: 0.58, turnBend: 0.68, lureWave: 1.15, jawGape: 0.25, magmaGlow: 1.1, jitter: 0 };
    case 'eating':
      return { swimFreq: 8.6, swimAmp: 0.7, turnBend: 0, lureWave: 1.5, jawGape: 1.0, magmaGlow: 1.6, jitter: 0.28 };
    case 'hungry':
      return { swimFreq: 6.4, swimAmp: 0.72, turnBend: 0, lureWave: 1.4, jawGape: 0.7, magmaGlow: 1.4, jitter: 0.14 };
    case 'stress':
      return { swimFreq: 10.2, swimAmp: 0.45, turnBend: 0, lureWave: 1.2, jawGape: 0.4, magmaGlow: 1.3, jitter: 1.15 };
    case 'fear':
      return { swimFreq: 12.0, swimAmp: 0.5, turnBend: 0, lureWave: 0.4, jawGape: 0.5, magmaGlow: 0.55, jitter: 1.45 };
    case 'shock':
      return { swimFreq: 13.5, swimAmp: 0.3, turnBend: 0, lureWave: 0.25, jawGape: 0.9, magmaGlow: 1.65, jitter: 1.75 };
    case 'happy':
      return { swimFreq: 5.0, swimAmp: 0.65, turnBend: 0, lureWave: 1.2, jawGape: 0.35, magmaGlow: 1.2, jitter: 0 };
    case 'sad':
      return { swimFreq: 1.6, swimAmp: 0.2, turnBend: 0, lureWave: 0.2, jawGape: 0.05, magmaGlow: 0.28, jitter: 0 };
    case 'breathing':
    default:
      return { swimFreq: 2.9, swimAmp: 0.38, turnBend: 0, lureWave: 0.8, jawGape: 0.12, magmaGlow: 0.85, jitter: 0 };
  }
}

export class VillainFrogfish {
  static metadata = {
    name: 'Villain Warty Frogfish',
    category: 'villain_fish',
    baseLength: 78,
    baseWidth: 56
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
    const breath = Math.sin(t * 3.1) * 0.036;
    const jx = p.jitter > 0 ? Math.sin(t * 58) * p.jitter * 1.2 : 0;
    const jy = p.jitter > 0 ? Math.cos(t * 64) * p.jitter * 1.3 : 0;

    ctx.save();
    ctx.translate(this.x + jx, this.y + jy);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Scorched-magma ambush aura
    const aura = ctx.createRadialGradient(0, 0, 10, 0, 0, 50);
    aura.addColorStop(0, 'rgba(255, 78, 22, 0.30)');
    aura.addColorStop(0.55, 'rgba(24, 10, 16, 0.25)');
    aura.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.ellipse(0, 3, 48, 36, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Stubby scorched fan tail
    const tailY = wag * 6 + p.turnBend * 10;
    ctx.fillStyle = '#401A14';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(-22, -6);
    ctx.quadraticCurveTo(-34, tailY - 12, -37, tailY - 7);
    ctx.lineTo(-34, tailY);
    ctx.lineTo(-37, tailY + 7);
    ctx.quadraticCurveTo(-34, tailY + 12, -22, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 3. Clawed gripping arm-like pectoral fins (signature frogfish "walking" claws!)
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(4, side * 19);
      ctx.rotate(side * (0.25 + Math.sin(t * p.swimFreq + (side > 0 ? 1.5 : 0)) * 0.28 - p.turnBend * 0.22 * side));
      ctx.fillStyle = '#381715';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.8;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.lineTo(10, side * 11);
      // 3 Wicked gripping claws
      ctx.lineTo(15, side * 15);
      ctx.lineTo(7, side * 14);
      ctx.lineTo(5, side * 18);
      ctx.lineTo(1, side * 14);
      ctx.lineTo(-5, side * 16);
      ctx.lineTo(-7, side * 8);
      ctx.lineTo(-8, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Molten orange claw tips
      ctx.fillStyle = '#FF6A1A';
      ctx.beginPath();
      ctx.arc(13, side * 14, 1.8, 0, Math.PI * 2);
      ctx.arc(5, side * 17, 1.8, 0, Math.PI * 2);
      ctx.arc(-4, side * 15, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 4. Corrupted magma-black & scorched-orange lumpy frogfish body
    ctx.save();
    ctx.scale(1 + breath, 1 - breath * 0.45);
    const bodyGrad = ctx.createRadialGradient(8, -5, 4, 0, 0, 32);
    bodyGrad.addColorStop(0, '#592318');
    bodyGrad.addColorStop(0.55, '#291314');
    bodyGrad.addColorStop(1, '#160B12');
    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3.8;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(27, 0);
    ctx.bezierCurveTo(28, -19, 12, -26, -8, -23);
    ctx.bezierCurveTo(-22, -20, -28, -11, -26, 0);
    ctx.bezierCurveTo(-28, 11, -22, 20, -8, 23);
    ctx.bezierCurveTo(12, 26, 28, 19, 27, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Scorched-orange glowing volcanic warts & crust patches
    const glow = Math.min(1, 0.55 + 0.35 * p.magmaGlow + 0.14 * Math.sin(t * 5.2));
    const warts = [
      [-15, -11, 4.6], [-15, 11, 4.6], [-4, -16, 4.0], [-4, 16, 4.0],
      [-8, 0, 5.2], [5, -13, 3.4], [5, 13, 3.4], [4, 0, 3.8]
    ];
    for (const [wx, wy, wr] of warts) {
      ctx.fillStyle = `rgba(255, 102, 26, ${glow * 0.85})`;
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(wx, wy, wr, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Wide gaping ambush jaw with sharp fangs
    const chomp = state === 'eating' ? Math.abs(Math.sin(t * 24)) * 6 : (state === 'hungry' ? Math.abs(Math.sin(t * 10)) * 3 : 0);
    const gape = 2 + p.jawGape * 5 + chomp;
    ctx.fillStyle = '#2B0714';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(24, -12);
    ctx.quadraticCurveTo(31 + gape, 0, 24, 12);
    ctx.quadraticCurveTo(27, 0, 24, -12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFF5EB';
    for (const fy of [-7, -2.2, 2.2, 7]) {
      ctx.beginPath();
      ctx.moveTo(25, fy - 1.6);
      ctx.lineTo(29 + gape * 0.55, fy);
      ctx.lineTo(25, fy + 1.6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // 5. Sinister Glowing Crimson Skull-Lure (illicium + esca) dangling ahead of snout!
    const lureSway = Math.sin(t * 5.4) * 7 * p.lureWave;
    const lureX = 44;
    const lureY = lureSway;

    // Stalk
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(22, 0);
    ctx.quadraticCurveTo(33, lureY * 0.5, lureX, lureY);
    ctx.stroke();

    // Glowing crimson aura around skull-lure
    const lureAura = ctx.createRadialGradient(lureX, lureY, 2, lureX, lureY, 13);
    lureAura.addColorStop(0, `rgba(255, 36, 72, ${Math.min(1, 0.7 * p.magmaGlow)})`);
    lureAura.addColorStop(1, 'rgba(255, 36, 72, 0)');
    ctx.fillStyle = lureAura;
    ctx.beginPath();
    ctx.arc(lureX, lureY, 13, 0, Math.PI * 2);
    ctx.fill();

    // Mini glowing crimson cartoon skull esca
    ctx.fillStyle = '#FF385C';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(lureX, lureY, 5.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Tiny dark skull eye sockets
    ctx.fillStyle = OUTLINE;
    ctx.beginPath();
    ctx.arc(lureX + 1.5, lureY - 1.8, 1.2, 0, Math.PI * 2);
    ctx.arc(lureX + 1.5, lureY + 1.8, 1.2, 0, Math.PI * 2);
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
      ctx.translate(16, side * 12);

      if (state === 'stress') {
        ctx.strokeStyle = '#FF7722';
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

        ctx.fillStyle = (isShock || isFear) ? '#FFF7ED' : '#FF551A';
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
          ctx.fillStyle = '#291314';
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
        const sy = i % 2 === 0 ? -32 : 32;
        ctx.fillStyle = i === 1 ? '#FF551A' : '#D24DFF';
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
      ctx.translate(42, -22);
      ctx.fillStyle = '#FF385C';
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
        ctx.moveTo(8, side * (30 + d * 0.4));
        ctx.quadraticCurveTo(1, side * (27 + d * 0.4), -1, side * (30 + d * 0.4));
        ctx.quadraticCurveTo(1, side * (33 + d * 0.4), 8, side * (30 + d * 0.4));
        ctx.fill();
        ctx.stroke();
      }
    } else if (state === 'stress') {
      const pulse = 1 + Math.sin(t * 32) * 0.14;
      ctx.save();
      ctx.translate(6, -30);
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
      ctx.moveTo(18, 20 + d * 0.4);
      ctx.quadraticCurveTo(14, 25 + d * 0.4, 18, 28 + d * 0.4);
      ctx.quadraticCurveTo(22, 25 + d * 0.4, 18, 20 + d * 0.4);
      ctx.fill();
      ctx.stroke();
    }
  }
}

export default VillainFrogfish;
