/**
 * Villain Green Moray Eel — 2D Top-Down Expressive Chibi Villain ES Module
 * Toxic-venomous black-and-acid-green serpentine body, spiked fin ridge, snapping neon-fanged jaws with glowing poison drool.
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
      return { waveFreq: 6.8, waveAmp: 11.5, turnBend: 0, jawOpen: 0.35, venomGlow: 0.95, jitter: 0 };
    case 'relax':
      return { waveFreq: 2.0, waveAmp: 3.8, turnBend: 0, jawOpen: 0.08, venomGlow: 0.45, jitter: 0 };
    case 'left_turn':
      return { waveFreq: 5.2, waveAmp: 7.0, turnBend: -0.85, jawOpen: 0.4, venomGlow: 1.05, jitter: 0 };
    case 'right_turn':
      return { waveFreq: 5.2, waveAmp: 7.0, turnBend: 0.85, jawOpen: 0.4, venomGlow: 1.05, jitter: 0 };
    case 'eating':
      return { waveFreq: 7.6, waveAmp: 8.5, turnBend: 0, jawOpen: 1.0, venomGlow: 1.5, jitter: 0.25 };
    case 'hungry':
      return { waveFreq: 6.0, waveAmp: 9.2, turnBend: 0, jawOpen: 0.72, venomGlow: 1.35, jitter: 0.14 };
    case 'stress':
      return { waveFreq: 9.8, waveAmp: 6.2, turnBend: 0, jawOpen: 0.48, venomGlow: 1.25, jitter: 1.1 };
    case 'fear':
      return { waveFreq: 11.8, waveAmp: 7.5, turnBend: 0, jawOpen: 0.52, venomGlow: 0.6, jitter: 1.45 };
    case 'shock':
      return { waveFreq: 13.0, waveAmp: 4.5, turnBend: 0, jawOpen: 0.88, venomGlow: 1.45, jitter: 1.7 };
    case 'happy':
      return { waveFreq: 5.0, waveAmp: 8.4, turnBend: 0, jawOpen: 0.42, venomGlow: 1.15, jitter: 0 };
    case 'sad':
      return { waveFreq: 1.6, waveAmp: 2.8, turnBend: 0, jawOpen: 0.06, venomGlow: 0.3, jitter: 0 };
    case 'breathing':
    default:
      return { waveFreq: 3.1, waveAmp: 5.8, turnBend: 0, jawOpen: 0.22, venomGlow: 0.8, jitter: 0 };
  }
}

export class VillainMorayeelfish {
  static metadata = {
    name: 'Villain Green Moray Eel',
    category: 'villain_fish',
    baseLength: 195,
    baseWidth: 34
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
    const jx = p.jitter > 0 ? Math.sin(t * 58) * p.jitter * 1.2 : 0;
    const jy = p.jitter > 0 ? Math.cos(t * 64) * p.jitter * 1.3 : 0;

    ctx.save();
    ctx.translate(this.x + jx, this.y + jy);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Toxic emerald-black miasma aura beneath eel
    const aura = ctx.createRadialGradient(-8, 0, 12, -8, 0, 102);
    aura.addColorStop(0, 'rgba(72, 255, 86, 0.24)');
    aura.addColorStop(0.55, 'rgba(20, 11, 28, 0.25)');
    aura.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.ellipse(-6, 3, 98, 28, 0, 0, Math.PI * 2);
    ctx.fill();

    // Compute serpentine spine control points from head (x=68) to tail (x=-98)
    const segs = 14;
    const pts = [];
    for (let i = 0; i <= segs; i++) {
      const f = i / segs; // 0 = head, 1 = tail tip
      const sx = 64 - f * 162;
      const env = Math.pow(f, 1.15);
      const wave = Math.sin(t * p.waveFreq - f * 4.8) * p.waveAmp * env;
      const bend = p.turnBend * 26 * f * f;
      const halfW = f < 0.18
        ? 14.5 + Math.sin((f / 0.18) * Math.PI) * 3.5
        : Math.max(1.8, 15.5 * Math.pow(1 - f, 0.72));
      pts.push({ x: sx, y: wave + bend, w: halfW });
    }

    // 2. Serpentine body silhouette (black & acid-green toxic gradient)
    const bodyGrad = ctx.createLinearGradient(68, -16, -96, 16);
    bodyGrad.addColorStop(0, '#2B4229');
    bodyGrad.addColorStop(0.35, '#19291C');
    bodyGrad.addColorStop(0.75, '#121819');
    bodyGrad.addColorStop(1, '#265E22');

    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3.6;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[0].x + 14, pts[0].y);
    for (let i = 0; i <= segs; i++) {
      ctx.lineTo(pts[i].x, pts[i].y - pts[i].w);
    }
    ctx.lineTo(pts[segs].x - 8, pts[segs].y);
    for (let i = segs; i >= 0; i--) {
      ctx.lineTo(pts[i].x, pts[i].y + pts[i].w);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 3. Toxic acid-green blotches & venomous tiger bands along serpentine body
    const venomAlpha = Math.min(1, 0.55 + 0.3 * p.venomGlow + 0.12 * Math.sin(t * 5));
    for (let i = 2; i < segs - 1; i++) {
      const pt = pts[i];
      ctx.fillStyle = i % 2 === 0
        ? `rgba(114, 255, 58, ${venomAlpha * 0.75})`
        : `rgba(42, 185, 78, ${venomAlpha * 0.55})`;
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y - pt.w * 0.45, 5.2, pt.w * 0.36, 0.3, 0, Math.PI * 2);
      ctx.ellipse(pt.x - 3, pt.y + pt.w * 0.45, 4.8, pt.w * 0.34, -0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Spiked dorsal fin ridge running down the entire serpentine spine
    ctx.fillStyle = '#5BFF38';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    for (let i = 1; i < segs; i++) {
      const pt = pts[i];
      const next = pts[i + 1];
      const mx = (pt.x + next.x) * 0.5;
      const my = (pt.y + next.y) * 0.5;
      const spikeOffset = (i % 2 === 0 ? -1 : 1) * (3.5 + (1 - i / segs) * 2.5);
      if (i === 1) ctx.moveTo(pt.x, pt.y);
      ctx.lineTo(mx, my + spikeOffset);
      ctx.lineTo(next.x, next.y);
    }
    ctx.stroke();

    // Acid-glow spine crest beads
    for (let i = 1; i < segs - 1; i++) {
      const pt = pts[i];
      ctx.fillStyle = `rgba(155, 255, 72, ${venomAlpha})`;
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(pt.x + 4, pt.y);
      ctx.lineTo(pt.x - 3, pt.y - 3.6);
      ctx.lineTo(pt.x - 7, pt.y);
      ctx.lineTo(pt.x - 3, pt.y + 3.6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // 5. Snapping neon-fanged jaws + glowing poison drool
    const chomp = state === 'eating' ? Math.abs(Math.sin(t * 24)) : (state === 'hungry' ? Math.abs(Math.sin(t * 10)) * 0.4 : 0);
    const open = 3 + p.jawOpen * 8 + chomp * 5;

    ctx.fillStyle = '#240B29';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(74, -10);
    ctx.quadraticCurveTo(85 + open, 0, 74, 10);
    ctx.quadraticCurveTo(79, 0, 74, -10);
    ctx.fill();
    ctx.stroke();

    // Neon-green venomous fangs
    ctx.fillStyle = '#CCFF4D';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.6;
    for (const fy of [-6.5, -2.2, 2.2, 6.5]) {
      ctx.beginPath();
      ctx.moveTo(75, fy - 1.8);
      ctx.lineTo(82 + open * 0.65, fy);
      ctx.lineTo(75, fy + 1.8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Glowing poison drool bubbles drifting from jaw
    for (let d = 0; d < 3; d++) {
      const phase = (t * 2.2 + d * 0.9) % 1;
      const dx = 82 + open * 0.4 + phase * 14;
      const dy = (d - 1) * 7 + Math.sin(t * 5 + d) * 2.5;
      const r = (1 - phase) * 3.4 + 0.8;
      ctx.fillStyle = `rgba(124, 255, 52, ${(1 - phase) * 0.85})`;
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(dx, dy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Glossy chibi head highlight
    ctx.fillStyle = 'rgba(182, 255, 160, 0.25)';
    ctx.beginPath();
    ctx.ellipse(58, -5, 11, 4, -0.15, 0, Math.PI * 2);
    ctx.fill();

    // 6. Expressive Villain Chibi Eyes
    this._drawVillainEyes(ctx, state, t);

    // 7. Mood-reactive VFX
    this._drawMoodVFX(ctx, state, t);

    ctx.restore();
  }

  _drawVillainEyes(ctx, state, t) {
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(60, side * 9.5);

      if (state === 'stress') {
        ctx.strokeStyle = '#9BFF38';
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
        const rx = isShock ? 6.4 : (isFear ? 5.8 : 5.2);
        const ry = isShock ? 5.6 : (isFear ? 5.0 : 4.2);

        ctx.fillStyle = OUTLINE;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx + 1.5, ry + 1.5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = (isShock || isFear) ? '#F7FFE8' : (state === 'hungry' || state === 'eating' ? '#FF385C' : '#9DFF2E');
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#140B1C';
        if (isShock || isFear) {
          ctx.beginPath();
          ctx.arc(1 + Math.sin(t * 46) * 1.0, 0, 1.8, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.ellipse(1.4, 0, 1.5, ry * 0.75, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(2.4, -1.5 * side, 1.5, 0, Math.PI * 2);
        ctx.arc(-1.3, 1.2 * side, 0.85, 0, Math.PI * 2);
        ctx.fill();

        if (state === 'relax') {
          ctx.fillStyle = '#2B4229';
          ctx.beginPath();
          ctx.ellipse(-1.8, 0, rx + 0.8, ry + 0.8, 0, Math.PI * 0.5, Math.PI * 1.5);
          ctx.fill();
        }
      }

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
        const s = 3.5 + Math.sin(t * 6 + i * 2) * 2.2;
        const sx = 54 + i * 16;
        const sy = i % 2 === 0 ? -24 : 24;
        ctx.fillStyle = i === 1 ? '#80FF33' : '#C84DFF';
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
      ctx.translate(88, -22);
      ctx.fillStyle = '#9BFF2E';
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
        ctx.moveTo(48, side * (22 + d * 0.4));
        ctx.quadraticCurveTo(40, side * (19 + d * 0.4), 38, side * (22 + d * 0.4));
        ctx.quadraticCurveTo(40, side * (25 + d * 0.4), 48, side * (22 + d * 0.4));
        ctx.fill();
        ctx.stroke();
      }
    } else if (state === 'stress') {
      const pulse = 1 + Math.sin(t * 30) * 0.14;
      ctx.save();
      ctx.translate(46, -24);
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
      ctx.moveTo(62, 16 + d * 0.4);
      ctx.quadraticCurveTo(58, 22 + d * 0.4, 62, 25 + d * 0.4);
      ctx.quadraticCurveTo(66, 22 + d * 0.4, 62, 16 + d * 0.4);
      ctx.fill();
      ctx.stroke();
    }
  }
}

export default VillainMorayeelfish;
