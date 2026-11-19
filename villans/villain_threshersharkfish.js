/**
 * Villain Pelagic Thresher Shark — 2D Top-Down Expressive Chibi Villain ES Module
 * Midnight-steel shark body with glowing violet flank veins and a serrated razor-bladed whip tail lobe.
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
  shock: 0.78
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
      return { swimFreq: 6.4, swimAmp: 1.0, turnBend: 0, jawOpen: 0.14, finFlare: 0.35, veinGlow: 0.85, whipSnap: 1.0, jitter: 0 };
    case 'relax':
      return { swimFreq: 1.8, swimAmp: 0.25, turnBend: 0, jawOpen: 0.0, finFlare: -0.15, veinGlow: 0.4, whipSnap: 0.2, jitter: 0 };
    case 'left_turn':
      return { swimFreq: 5.2, swimAmp: 0.55, turnBend: -0.68, jawOpen: 0.18, finFlare: 0.65, veinGlow: 0.95, whipSnap: 1.25, jitter: 0 };
    case 'right_turn':
      return { swimFreq: 5.2, swimAmp: 0.55, turnBend: 0.68, jawOpen: 0.18, finFlare: 0.65, veinGlow: 0.95, whipSnap: 1.25, jitter: 0 };
    case 'eating':
      return { swimFreq: 7.2, swimAmp: 0.7, turnBend: 0, jawOpen: 1.0, finFlare: 0.8, veinGlow: 1.3, whipSnap: 1.35, jitter: 0.15 };
    case 'hungry':
      return { swimFreq: 5.6, swimAmp: 0.8, turnBend: 0, jawOpen: 0.62, finFlare: 0.55, veinGlow: 1.25, whipSnap: 0.95, jitter: 0.1 };
    case 'stress':
      return { swimFreq: 8.8, swimAmp: 0.45, turnBend: 0, jawOpen: 0.35, finFlare: 0.7, veinGlow: 1.15, whipSnap: 0.85, jitter: 1.0 };
    case 'fear':
      return { swimFreq: 10.5, swimAmp: 0.5, turnBend: 0, jawOpen: 0.45, finFlare: 0.9, veinGlow: 0.65, whipSnap: 0.4, jitter: 1.35 };
    case 'shock':
      return { swimFreq: 12.0, swimAmp: 0.3, turnBend: 0, jawOpen: 0.85, finFlare: 1.0, veinGlow: 1.4, whipSnap: 0.25, jitter: 1.6 };
    case 'happy':
      return { swimFreq: 4.8, swimAmp: 0.72, turnBend: 0, jawOpen: 0.3, finFlare: 0.5, veinGlow: 1.1, whipSnap: 0.9, jitter: 0 };
    case 'sad':
      return { swimFreq: 1.6, swimAmp: 0.22, turnBend: 0, jawOpen: 0.05, finFlare: -0.35, veinGlow: 0.3, whipSnap: 0.15, jitter: 0 };
    case 'breathing':
    default:
      return { swimFreq: 2.8, swimAmp: 0.42, turnBend: 0, jawOpen: 0.08, finFlare: 0.1, veinGlow: 0.7, whipSnap: 0.45, jitter: 0 };
  }
}

export class VillainThreshersharkfish {
  static metadata = {
    name: 'Villain Pelagic Thresher Shark',
    category: 'villain_fish',
    baseLength: 215,
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
    for (const cb of cbs.slice()) {
      cb(stateName, this);
    }
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
    const breath = Math.sin(t * 3.1) * 0.032;
    const wag = Math.sin(t * p.swimFreq) * p.swimAmp;
    const whipWave = Math.sin(t * p.swimFreq - 1.35) * p.whipSnap;
    const jx = p.jitter > 0 ? Math.sin(t * 53) * p.jitter * 1.4 : 0;
    const jy = p.jitter > 0 ? Math.cos(t * 61) * p.jitter * 1.6 : 0;

    ctx.save();
    ctx.translate(this.x + jx, this.y + jy);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    // 1. Dark violet miasma shadow aura beneath shark
    const auraGrad = ctx.createRadialGradient(-10, 0, 12, -10, 0, 112);
    auraGrad.addColorStop(0, 'rgba(128, 38, 224, 0.30)');
    auraGrad.addColorStop(0.55, 'rgba(20, 11, 28, 0.24)');
    auraGrad.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.ellipse(-12, 4, 108, 44, 0, 0, Math.PI * 2);
    ctx.fill();

    // Orbiting dark miasma wisps
    for (let i = 0; i < 4; i++) {
      const a = t * 1.4 + i * 1.57;
      const wx = -20 + Math.cos(a) * 68;
      const wy = Math.sin(a * 1.3) * 28;
      ctx.fillStyle = 'rgba(164, 72, 255, 0.16)';
      ctx.beginPath();
      ctx.ellipse(wx, wy, 14, 5, a * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Signature serrated razor-bladed whip tail lobe (massive pelagic thresher upper lobe)
    const tailBaseX = -22;
    const tailBaseY = (wag * 5 + p.turnBend * 8);
    const midTailX = -68;
    const midTailY = wag * 14 + p.turnBend * 22;
    const whipTipX = -114;
    const whipTipY = wag * 24 + whipWave * 16 + p.turnBend * 34;

    // Lower stub tail lobe
    ctx.save();
    ctx.fillStyle = '#1E2538';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(tailBaseX - 8, tailBaseY);
    ctx.quadraticCurveTo(tailBaseX - 24, tailBaseY + 14, tailBaseX - 36, tailBaseY + 19);
    ctx.lineTo(tailBaseX - 28, tailBaseY + 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Massive curved razor whip lobe
    const whipGrad = ctx.createLinearGradient(tailBaseX, tailBaseY, whipTipX, whipTipY);
    whipGrad.addColorStop(0, '#2B3552');
    whipGrad.addColorStop(0.55, '#191F33');
    whipGrad.addColorStop(1, '#B34DFF');
    ctx.fillStyle = whipGrad;
    ctx.beginPath();
    ctx.moveTo(tailBaseX, tailBaseY - 7);
    ctx.bezierCurveTo(midTailX + 12, midTailY - 14, midTailX - 18, midTailY - 12, whipTipX, whipTipY - 2);
    // Razor serrated teeth along the trailing edge of the whip
    const teeth = 6;
    for (let i = teeth; i >= 1; i--) {
      const f = i / (teeth + 1);
      const sx = tailBaseX + (whipTipX - tailBaseX) * f;
      const sy = tailBaseY + (whipTipY - tailBaseY) * f;
      ctx.lineTo(sx - 4, sy + 9);
      ctx.lineTo(sx + 4, sy + 3);
    }
    ctx.lineTo(tailBaseX - 2, tailBaseY + 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing violet razor edge along whip
    ctx.strokeStyle = `rgba(196, 112, 255, ${0.55 + 0.35 * Math.sin(t * 5)})`;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(tailBaseX - 6, tailBaseY - 4);
    ctx.quadraticCurveTo(midTailX, midTailY - 9, whipTipX + 2, whipTipY - 1);
    ctx.stroke();
    ctx.restore();

    // 3. Long swept-back pelagic pectoral scythe fins (battle-notched)
    const finSweep = 0.22 * p.finFlare + wag * 0.08;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(22, side * 22);
      ctx.rotate(side * (0.28 + finSweep - p.turnBend * 0.25 * side));
      const finGrad = ctx.createLinearGradient(0, 0, -34, side * 36);
      finGrad.addColorStop(0, '#2D3856');
      finGrad.addColorStop(0.7, '#1B2036');
      finGrad.addColorStop(1, '#4C246E');
      ctx.fillStyle = finGrad;
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 3.2;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.quadraticCurveTo(-2, side * 28, -32, side * 42);
      ctx.lineTo(-24, side * 28);
      // Battle notch
      ctx.lineTo(-16, side * 24);
      ctx.lineTo(-21, side * 18);
      ctx.quadraticCurveTo(-12, side * 10, -14, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Violet energy vein on fin
      ctx.strokeStyle = `rgba(178, 92, 255, ${0.55 * p.veinGlow})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(4, side * 4);
      ctx.quadraticCurveTo(-8, side * 18, -24, side * 33);
      ctx.stroke();
      ctx.restore();
    }

    // Small pelvic fins
    for (const side of [-1, 1]) {
      ctx.fillStyle = '#1E253B';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(-14, side * 12);
      ctx.quadraticCurveTo(-24, side * 23, -32, side * 20);
      ctx.lineTo(-24, side * 9);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // 4. Chunky front-heavy chibi shark trunk (midnight-steel)
    ctx.save();
    ctx.scale(1 + breath, 1 - breath * 0.6);
    const bodyGrad = ctx.createLinearGradient(88, -34, -30, 34);
    bodyGrad.addColorStop(0, '#3C4B72');
    bodyGrad.addColorStop(0.45, '#252E4A');
    bodyGrad.addColorStop(1, '#161A2C');
    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3.8;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(86, 0); // Blunted chibi shark snout
    ctx.bezierCurveTo(84, -26, 48, -36, 12, -31);
    ctx.bezierCurveTo(-12, -27, -26, -15 + tailBaseY * 0.4, tailBaseX, tailBaseY - 7);
    ctx.lineTo(tailBaseX, tailBaseY + 7);
    ctx.bezierCurveTo(-26, 15 + tailBaseY * 0.4, -12, 27, 12, 31);
    ctx.bezierCurveTo(48, 36, 84, 26, 86, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cel-shaded dark metallic flank highlight & ridge
    ctx.fillStyle = 'rgba(130, 165, 235, 0.20)';
    ctx.beginPath();
    ctx.ellipse(34, -12, 34, 11, -0.1, 0, Math.PI * 2);
    ctx.fill();

    // Glossy specular highlight on forehead
    ctx.fillStyle = 'rgba(218, 235, 255, 0.28)';
    ctx.beginPath();
    ctx.ellipse(56, -10, 14, 5.5, -0.22, 0, Math.PI * 2);
    ctx.fill();

    // Glowing violet flank veins (corrupted bio-circuitry)
    const veinAlpha = Math.min(1, 0.45 + 0.35 * p.veinGlow + 0.15 * Math.sin(t * 4.5));
    ctx.strokeStyle = `rgba(186, 92, 255, ${veinAlpha})`;
    ctx.lineWidth = 2.1;
    ctx.lineCap = 'round';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(42, side * 16);
      ctx.lineTo(24, side * 21);
      ctx.lineTo(14, side * 15);
      ctx.lineTo(-4, side * 18);
      ctx.lineTo(-18, side * 10 + tailBaseY * 0.25);
      ctx.stroke();

      // Secondary vein fork
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(24, side * 21);
      ctx.lineTo(18, side * 26);
      ctx.moveTo(-4, side * 18);
      ctx.lineTo(-10, side * 23);
      ctx.stroke();
      ctx.lineWidth = 2.1;
    }

    // 5 Shark gill slits per side with dark shadow
    ctx.strokeStyle = '#0D0814';
    ctx.lineWidth = 2.1;
    for (const side of [-1, 1]) {
      for (let g = 0; g < 4; g++) {
        const gx = 32 - g * 5.5;
        ctx.beginPath();
        ctx.moveTo(gx, side * 24);
        ctx.quadraticCurveTo(gx - 2, side * 28, gx - 4, side * 26);
        ctx.stroke();
      }
    }

    // Battle scar across right shoulder
    ctx.strokeStyle = '#E066FF';
    ctx.lineWidth = 1.9;
    ctx.beginPath();
    ctx.moveTo(26, 8);
    ctx.lineTo(10, 20);
    ctx.stroke();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.2;
    for (let s = 0; s < 3; s++) {
      const sx = 23 - s * 5;
      const sy = 10 + s * 4;
      ctx.beginPath();
      ctx.moveTo(sx - 2, sy - 3);
      ctx.lineTo(sx + 2, sy + 3);
      ctx.stroke();
    }

    // 5. Dorsal fin (top-down silhouette ridge with razor notch)
    ctx.fillStyle = '#1D243C';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(22, 0);
    ctx.quadraticCurveTo(4, -5 + wag * 2.5, -16, wag * 4);
    ctx.quadraticCurveTo(2, 5 + wag * 2.5, 22, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing violet dorsal spine rune
    ctx.strokeStyle = `rgba(204, 128, 255, ${veinAlpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(-10, wag * 3);
    ctx.stroke();

    // 6. Snapping / smirking shark fangs peeking at snout edge
    if (p.jawOpen > 0.12 || state === 'happy' || state === 'hungry' || state === 'eating') {
      const open = Math.min(1, p.jawOpen + (state === 'happy' ? 0.22 : 0));
      const chomp = state === 'eating' ? Math.abs(Math.sin(t * 22)) : (state === 'hungry' ? Math.abs(Math.sin(t * 11)) * 0.5 : 0);
      const ext = 3 + open * 7 + chomp * 4;

      ctx.fillStyle = '#2B0A1E';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(78, -11);
      ctx.quadraticCurveTo(86 + ext, 0, 78, 11);
      ctx.quadraticCurveTo(82, 0, 78, -11);
      ctx.fill();
      ctx.stroke();

      // Sharp cartoon shark fangs
      ctx.fillStyle = '#FFF7FC';
      for (const fy of [-7, -2.5, 2.5, 7]) {
        ctx.beginPath();
        ctx.moveTo(79, fy - 2.1);
        ctx.lineTo(84 + ext * 0.65, fy);
        ctx.lineTo(79, fy + 2.1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    // 7. Expressive Villain Chibi Eyes & Brows (top-down wide-set)
    this._drawVillainEyes(ctx, state, t);

    ctx.restore(); // end breathing scale

    // 8. Mood-reactive floating villain VFX
    this._drawMoodVFX(ctx, state, t);

    ctx.restore();
  }

  _drawVillainEyes(ctx, state, t) {
    for (const side of [-1, 1]) {
      const ex = 58;
      const ey = side * 16.5;

      ctx.save();
      ctx.translate(ex, ey);

      if (state === 'stress') {
        // Scrunched > < villain eyes
        ctx.strokeStyle = '#FF5CE6';
        ctx.lineWidth = 3.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-5, -4 * side);
        ctx.lineTo(4, 0);
        ctx.lineTo(-5, 4 * side);
        ctx.stroke();
      } else {
        const isShock = state === 'shock';
        const isFear = state === 'fear';
        const isRelax = state === 'relax';
        const isSad = state === 'sad';
        const rX = isShock ? 8.2 : (isFear ? 7.4 : 6.6);
        const rY = isShock ? 7.4 : (isFear ? 6.6 : 5.6);

        // Dark eye socket
        ctx.fillStyle = OUTLINE;
        ctx.beginPath();
        ctx.ellipse(0, 0, rX + 1.8, rY + 1.8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Sclera / glowing iris base
        const irisColor = (state === 'hungry' || state === 'eating') ? '#FF3366'
          : (state === 'happy' ? '#D94DFF' : '#B94DFF');
        ctx.fillStyle = isShock || isFear ? '#FFF5FF' : irisColor;
        ctx.beginPath();
        ctx.ellipse(0, 0, rX, rY, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pupil (slit or rattled O-pinpoint)
        ctx.fillStyle = '#12071A';
        if (isShock || isFear) {
          const jitter = Math.sin(t * 42) * 1.1;
          ctx.beginPath();
          ctx.arc(1.2 + jitter, 0, isShock ? 2.1 : 2.6, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Menacing vertical cat/shark slit
          ctx.beginPath();
          ctx.ellipse(1.6, 0, 2.0, rY * 0.72, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        // Dual catchlights
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(3.0, -2.1 * side, 1.9, 0, Math.PI * 2);
        ctx.arc(-1.8, 1.7 * side, 1.0, 0, Math.PI * 2);
        ctx.fill();

        // Eyelid / brow overlays
        if (isRelax) {
          // Half-lidded smug scheming lid
          ctx.fillStyle = '#252E4A';
          ctx.beginPath();
          ctx.ellipse(-2.5, 0, rX + 1, rY + 1, 0, Math.PI * 0.5, Math.PI * 1.5);
          ctx.fill();
        }
        if (isSad) {
          ctx.fillStyle = '#252E4A';
          ctx.beginPath();
          ctx.moveTo(-7, -7 * side);
          ctx.lineTo(7, -2 * side);
          ctx.lineTo(-7, 2 * side);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Angled V-shaped villain brow
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 3.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (state === 'sad' || state === 'fear') {
        ctx.moveTo(-6, -6 * side);
        ctx.lineTo(7, -9 * side);
      } else if (state === 'shock') {
        ctx.moveTo(-7, -9 * side);
        ctx.lineTo(7, -9 * side);
      } else {
        // Sharp menacing V-brow angled inward toward snout center
        ctx.moveTo(-6, -8 * side);
        ctx.lineTo(8, -3.2 * side);
      }
      ctx.stroke();

      ctx.restore();
    }
  }

  _drawMoodVFX(ctx, state, t) {
    if (state === 'happy') {
      // Dark purple/crimson villain sparkles
      for (let i = 0; i < 3; i++) {
        const phase = (t * 2.4 + i * 2.1) % 3.14;
        const s = Math.sin(phase) * 6;
        const sx = 54 + i * 16;
        const sy = (i % 2 === 0 ? -36 : 36) + Math.sin(t * 4 + i) * 4;
        ctx.fillStyle = i === 1 ? '#FF3B7F' : '#C866FF';
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
      // Bold cartoon '!' above snout
      const pop = 1 + Math.sin(t * 28) * 0.14;
      ctx.save();
      ctx.translate(96, -26);
      ctx.scale(pop, pop);
      ctx.fillStyle = '#FF3366';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(-4, -14);
      ctx.lineTo(4, -14);
      ctx.lineTo(2.2, 2);
      ctx.lineTo(-2.2, 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 8, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (state === 'fear') {
      // Panicking anime sweat drops
      for (let i = 0; i < 2; i++) {
        const dropOffset = ((t * 28 + i * 12) % 18);
        const dx = 42 - i * 16;
        const dy = (i === 0 ? -34 : 34) + (i === 0 ? -dropOffset * 0.4 : dropOffset * 0.4);
        ctx.fillStyle = '#80E5FF';
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(dx + 6, dy);
        ctx.quadraticCurveTo(dx - 4, dy - 5, dx - 6, dy);
        ctx.quadraticCurveTo(dx - 4, dy + 5, dx + 6, dy);
        ctx.fill();
        ctx.stroke();
      }
    } else if (state === 'stress') {
      // Twitching anime anger/stress vein mark
      const pulse = 1 + Math.sin(t * 32) * 0.16;
      ctx.save();
      ctx.translate(46, -34);
      ctx.scale(pulse, pulse);
      ctx.strokeStyle = '#FF2E63';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      for (let q = 0; q < 4; q++) {
        ctx.save();
        ctx.rotate((q * Math.PI) / 2);
        ctx.beginPath();
        ctx.moveTo(2.5, 2.5);
        ctx.quadraticCurveTo(4, 7, 9, 8);
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    } else if (state === 'sad') {
      // Sulking teardrop
      const drop = (t * 18) % 14;
      ctx.fillStyle = '#7FD8FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(62, 26 + drop * 0.5);
      ctx.quadraticCurveTo(56, 33 + drop * 0.5, 62, 36 + drop * 0.5);
      ctx.quadraticCurveTo(68, 33 + drop * 0.5, 62, 26 + drop * 0.5);
      ctx.fill();
      ctx.stroke();
    } else if (state === 'hungry' || state === 'eating') {
      // Blazing crimson aura sparks around jaws
      for (let i = 0; i < 3; i++) {
        const a = t * 8 + i * 2.1;
        const fx = 86 + Math.cos(a) * 10;
        const fy = Math.sin(a) * 14;
        ctx.fillStyle = 'rgba(255, 51, 102, 0.78)';
        ctx.beginPath();
        ctx.arc(fx, fy, 2.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

export default VillainThreshersharkfish;
