/**
 * Pacific Halibut (Hippoglossus stenolepis) — Bespoke 2D Top-Down Expressive Chibi Asset
 * Dimensions: 175 x 115 | Native HTML5 Canvas 2D API | Zero external dependencies
 */

const VALID_STATES = new Set([
  'breathing', 'swimming', 'relax', 'left_turn', 'right_turn',
  'eating', 'hungry', 'stress', 'fear', 'shock', 'happy', 'sad'
]);

const ALIASES = { idle: 'breathing', hunger: 'hungry' };

const ONE_SHOT_DURATIONS = {
  left_turn: 0.56,
  right_turn: 0.56,
  eating: 0.65,
  shock: 0.78
};

const BLOCKED_IN_SHOCK = new Set([
  'left_turn', 'right_turn', 'relax', 'happy', 'eating',
  'breathing', 'swimming', 'hungry', 'sad'
]);

const BLOCKED_IN_FEAR = new Set([
  'left_turn', 'right_turn', 'relax', 'happy', 'eating'
]);

const POSE_TARGETS = {
  breathing:  { freq: 1.9, amp: 0.065, turn: 0,     mouth: 0.06, jitter: 0,   droop: 0,    bounce: 0    },
  swimming:   { freq: 5.0, amp: 0.18,  turn: 0,     mouth: 0.08, jitter: 0,   droop: 0,    bounce: 0    },
  relax:      { freq: 0.95,amp: 0.035, turn: 0,     mouth: 0.03, jitter: 0,   droop: 0.12, bounce: 0    },
  left_turn:  { freq: 3.6, amp: 0.13,  turn: -0.45, mouth: 0.08, jitter: 0,   droop: 0,    bounce: 0    },
  right_turn: { freq: 3.6, amp: 0.13,  turn: 0.45,  mouth: 0.08, jitter: 0,   droop: 0,    bounce: 0    },
  eating:     { freq: 6.2, amp: 0.14,  turn: 0,     mouth: 0.94, jitter: 0,   droop: 0,    bounce: 0.12 },
  hungry:     { freq: 4.5, amp: 0.12,  turn: 0,     mouth: 0.55, jitter: 0,   droop: 0,    bounce: 0.06 },
  stress:     { freq: 9.0, amp: 0.1,   turn: 0,     mouth: 0.12, jitter: 1.6, droop: 0.05, bounce: 0    },
  fear:       { freq: 11.8,amp: 0.13,  turn: 0,     mouth: 0.25, jitter: 2.6, droop: 0.2,  bounce: 0    },
  shock:      { freq: 13.5,amp: 0.04,  turn: 0,     mouth: 0.88, jitter: 3.1, droop: 0,    bounce: -0.1 },
  happy:      { freq: 5.6, amp: 0.18,  turn: 0,     mouth: 0.22, jitter: 0,   droop: -0.1, bounce: 0.16 },
  sad:        { freq: 1.1, amp: 0.035, turn: 0,     mouth: 0.03, jitter: 0,   droop: 0.34, bounce: 0    }
};

function lerp(a, b, t) { return a + (b - a) * t; }
function cubicBlend(t) {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

export class Halibutfish {
  static metadata = {
    name: 'Pacific Halibut',
    category: 'fish',
    baseLength: 175,
    baseWidth: 115
  };

  constructor(x = 0, y = 0, scale = 1) {
    this.x = x;
    this.y = y;
    this.scale = scale;
    this.angle = 0;

    this._state = 'breathing';
    this._prevState = 'breathing';
    this._stateTime = 0;
    this._time = 0;
    this._phase = 0;

    this._blendElapsed = 0.15;
    this._blendDuration = 0.15;
    this._fromPose = { ...POSE_TARGETS.breathing };
    this._currPose = { ...POSE_TARGETS.breathing };
    this._listeners = new Map();
  }

  setAngle(radians) {
    if (Number.isFinite(radians)) this.angle = radians;
  }

  setDirection(dx, dy) {
    if (!Number.isFinite(dx) || !Number.isFinite(dy)) return;
    if (dx === 0 && dy === 0) return;
    this.angle = Math.atan2(dy, dx);
  }

  getState() { return this._state; }

  onFinished(name, callback) {
    if (typeof callback !== 'function') return;
    const key = ALIASES[name] || name;
    if (!this._listeners.has(key)) this._listeners.set(key, []);
    this._listeners.get(key).push(callback);
  }

  play(name) {
    const next = ALIASES[name] || name;
    if (!VALID_STATES.has(next)) return false;
    if (this._state === 'shock' && BLOCKED_IN_SHOCK.has(next)) return false;
    if (this._state === 'fear' && BLOCKED_IN_FEAR.has(next)) return false;
    if (next === this._state && !ONE_SHOT_DURATIONS[next]) return true;

    if (!ONE_SHOT_DURATIONS[this._state]) this._prevState = this._state;
    this._fromPose = { ...this._currPose };
    this._state = next;
    this._stateTime = 0;
    this._blendElapsed = 0;
    return true;
  }

  update(dt) {
    const safeDt = Math.max(0, Math.min(0.1, Number.isFinite(dt) ? dt : 0));
    this._time += safeDt;
    this._stateTime += safeDt;

    if (this._blendElapsed < this._blendDuration) {
      this._blendElapsed = Math.min(this._blendDuration, this._blendElapsed + safeDt);
    }
    const alpha = cubicBlend(this._blendElapsed / this._blendDuration);
    const target = POSE_TARGETS[this._state] || POSE_TARGETS.breathing;
    for (const k of Object.keys(target)) {
      this._currPose[k] = lerp(this._fromPose[k], target[k], alpha);
    }

    this._phase += safeDt * this._currPose.freq;

    const dur = ONE_SHOT_DURATIONS[this._state];
    if (dur && this._stateTime >= dur) {
      const finished = this._state;
      const returnTo = VALID_STATES.has(this._prevState) && !ONE_SHOT_DURATIONS[this._prevState]
        ? this._prevState : 'breathing';
      this._fromPose = { ...this._currPose };
      this._state = returnTo;
      this._stateTime = 0;
      this._blendElapsed = 0;

      const cbs = this._listeners.get(finished);
      if (cbs) for (const cb of [...cbs]) cb(finished);
    }
  }

  _drawPowerfulCrescentTail(ctx, jx, jy) {
    // Signature broad powerful crescent tail of Pacific Halibut!
    const p = this._currPose;
    const wag = Math.sin(this._phase - 2.3) * (0.32 * p.amp * 4.8) + p.turn * 0.45;
    ctx.save();
    ctx.translate(-54 + jx, jy);
    ctx.rotate(wag);

    const g = ctx.createLinearGradient(0, 0, -34, 0);
    g.addColorStop(0, '#5C4028');
    g.addColorStop(0.6, '#7C583B');
    g.addColorStop(1, '#A67E5B');

    ctx.beginPath();
    ctx.moveTo(4, -10);
    ctx.bezierCurveTo(-10, -26, -26, -32, -33, -28);
    ctx.quadraticCurveTo(-20, 0, -33, 28);
    ctx.bezierCurveTo(-26, 32, -10, 26, 4, 10);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();

    // Fine crescent tail rays
    ctx.strokeStyle = 'rgba(32, 20, 12, 0.44)';
    ctx.lineWidth = 1.3;
    for (let i = -4; i <= 4; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * 1.8);
      ctx.lineTo(-27, i * 5.8);
      ctx.stroke();
    }

    ctx.strokeStyle = '#24160C';
    ctx.lineWidth = 2.6;
    ctx.stroke();
    ctx.restore();
  }

  _drawChocolateMottlingAndLateralArch(ctx, jx, jy) {
    // Rich speckled chocolate-brown & warm umber camouflage mottling
    const mottles = [
      [26, -14, 12, 7, 0.2], [18, 18, 13, 8, -0.25], [2, -26, 15, 9, -0.15],
      [0, 24, 14, 8, 0.25],  [-18, -16, 14, 8, 0.3], [-22, 16, 13, 7, -0.3],
      [-34, -6, 10, 6, 0.1], [12, -2, 11, 6, -0.1],  [-8, 4, 12, 7, 0.15]
    ];
    for (const [mx, my, rx, ry, rot] of mottles) {
      ctx.save();
      ctx.translate(mx + jx, my + jy);
      ctx.rotate(rot);
      ctx.fillStyle = 'rgba(205, 168, 128, 0.28)';
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(42, 26, 14, 0.32)';
      ctx.beginPath();
      ctx.ellipse(2, 1, rx * 0.55, ry * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Fine dark chocolate & cream speckles
    for (let k = 0; k < 34; k++) {
      const sx = Math.sin(k * 17.3) * 52 + jx;
      const sy = Math.cos(k * 11.7) * 34 + jy;
      ctx.fillStyle = k % 2 === 0 ? 'rgba(34, 20, 10, 0.52)' : 'rgba(235, 212, 180, 0.45)';
      ctx.beginPath();
      ctx.arc(sx, sy, 1.3 + (k % 3) * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Signature Pacific Halibut arched lateral line over pectoral region
    ctx.strokeStyle = 'rgba(235, 212, 180, 0.42)';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(42 + jx, -4 + jy);
    ctx.quadraticCurveTo(20 + jx, -22 + jy, 0 + jx, -2 + jy);
    ctx.lineTo(-48 + jx, 0 + jy);
    ctx.stroke();
  }

  _drawAsymmetricTopEyesAndEmotes(ctx, jx, jy) {
    // Asymmetrical right-side chibi eyes mounted on top of the broad diamond halibut head!
    const st = this._state;
    const t = this._time;

    ctx.save();
    ctx.translate(42 + jx, jy);

    // Halibut jaw gape on eating/hungry/shock
    const m = this._currPose.mouth;
    if (m > 0.14) {
      ctx.fillStyle = '#3B151A';
      ctx.beginPath();
      ctx.ellipse(26, 2, 4.5 + m * 3.5, 7 + m * 3.5, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Rosy chibi blushes
    ctx.fillStyle = 'rgba(251, 113, 133, 0.40)';
    ctx.beginPath();
    ctx.ellipse(-2, -22, 5.6, 3.2, -0.2, 0, Math.PI * 2);
    ctx.ellipse(-6, 12, 5.6, 3.2, 0.2, 0, Math.PI * 2);
    ctx.fill();

    const eyes = [
      { ex: 4,  ey: -13.5, side: -1 },
      { ex: 12, ey: 1.5,   side: 1  }
    ];

    for (const eye of eyes) {
      const r = st === 'shock' ? 8.6 : 7.2;
      ctx.save();
      ctx.translate(eye.ex, eye.ey);

      if (st === 'happy') {
        ctx.strokeStyle = '#F5E6D3';
        ctx.lineWidth = 2.9;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, 1, 4.8, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
      } else if (st === 'stress') {
        ctx.strokeStyle = '#F5E6D3';
        ctx.lineWidth = 2.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-3.5, -3.5 * eye.side);
        ctx.lineTo(2.5, 0);
        ctx.lineTo(-3.5, 3.5 * eye.side);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#5C4028';
        ctx.beginPath();
        ctx.arc(0, 0, r + 1.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#24160C';
        ctx.lineWidth = 2.1;
        ctx.stroke();

        const irisR = st === 'shock' ? r * 0.42 : r * 0.72;
        const sx = st === 'fear' ? Math.sin(t * 58) * 1.0 : 0;
        const sy = st === 'fear' ? Math.cos(t * 64) * 1.0 : 0;
        const ig = ctx.createRadialGradient(1 + sx, -1 + sy, 0.7, sx, sy, irisR);
        ig.addColorStop(0, '#FDE68A');
        ig.addColorStop(0.55, '#D97706');
        ig.addColorStop(1, '#451A03');
        ctx.fillStyle = ig;
        ctx.beginPath();
        ctx.arc(1.2 + sx, sy, irisR, 0, Math.PI * 2);
        ctx.fill();

        const pr = st === 'shock' ? 1.9 : (st === 'fear' ? 2.3 : irisR * 0.55);
        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        ctx.arc(1.5 + sx, sy, pr, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(2.6, -2.0, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-1.0, 1.9, 1.05, 0, Math.PI * 2);
        ctx.fill();

        if (st === 'hungry' || st === 'eating') {
          ctx.fillStyle = '#FEF08A';
          ctx.beginPath();
          for (let k = 0; k < 8; k++) {
            const a = (k * Math.PI) / 4;
            const rad = k % 2 === 0 ? 3.8 : 1.3;
            ctx.lineTo(1.3 + Math.cos(a) * rad, Math.sin(a) * rad);
          }
          ctx.closePath();
          ctx.fill();
        }

        if (st === 'relax') {
          ctx.fillStyle = '#6E4C30';
          ctx.beginPath();
          ctx.arc(0, 0, r + 0.4, Math.PI, Math.PI * 2);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#F5E6D3';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(-r, 0);
          ctx.quadraticCurveTo(0, 1.8, r, 0);
          ctx.stroke();
        }

        if (st === 'sad' || st === 'fear') {
          ctx.fillStyle = 'rgba(125, 211, 252, 0.85)';
          ctx.beginPath();
          ctx.ellipse(-2, 3.0, 3.4, 1.8, 0.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    if (st === 'shock') {
      ctx.save();
      ctx.translate(22, -30);
      ctx.fillStyle = '#EF4444';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.1;
      ctx.beginPath();
      ctx.roundRect(-3, -15, 6, 11, 2.4);
      ctx.stroke();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fill();
      ctx.restore();
    } else if (st === 'fear' || st === 'stress') {
      ctx.save();
      ctx.translate(-5, -30 + Math.sin(t * 10) * 2);
      ctx.fillStyle = '#38BDF8';
      ctx.strokeStyle = '#0369A1';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, -7);
      ctx.bezierCurveTo(5, 0, 5, 6, 0, 6);
      ctx.bezierCurveTo(-5, 6, -5, 0, 0, -7);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (st === 'happy') {
      ctx.save();
      ctx.translate(12, -30 + Math.sin(t * 8) * 2);
      ctx.fillStyle = '#FACC15';
      ctx.strokeStyle = '#B45309';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4;
        const rad = k % 2 === 0 ? 6.6 : 2.3;
        ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  draw(ctx) {
    if (!ctx) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    const p = this._currPose;
    const bounceScale = 1 + Math.sin(this._time * 8.0) * p.bounce * 0.22;
    ctx.scale(this.scale * bounceScale, this.scale / Math.sqrt(Math.max(0.7, bounceScale)));

    const jx = p.jitter > 0 ? Math.sin(this._time * 58) * p.jitter * 0.45 : 0;
    const jy = p.jitter > 0 ? Math.cos(this._time * 66) * p.jitter : 0;

    // Broad diamond-shaped Pacific Halibut silhouette with fringed fin borders!
    const waveL = Math.sin(this._phase * 1.2) * (6.2 * p.amp * 4.5);
    const waveR = Math.sin(this._phase * 1.2 + 0.6) * (6.2 * p.amp * 4.5);

    const traceOuterFringe = () => {
      ctx.beginPath();
      ctx.moveTo(72 + jx, jy);
      ctx.bezierCurveTo(54 + jx, -26 + jy, 24 + jx, -56 - waveL + jy, -4 + jx, -56 - waveL + jy);
      ctx.bezierCurveTo(-28 + jx, -54 - waveL * 0.5 + jy, -44 + jx, -24 + jy, -56 + jx, -10 + jy);
      ctx.lineTo(-56 + jx, 10 + jy);
      ctx.bezierCurveTo(-44 + jx, 24 + jy, -28 + jx, 54 + waveR * 0.5 + jy, -4 + jx, 56 + waveR + jy);
      ctx.bezierCurveTo(24 + jx, 56 + waveR + jy, 54 + jx, 26 + jy, 72 + jx, jy);
      ctx.closePath();
    };

    const traceInnerDiamond = () => {
      ctx.beginPath();
      ctx.moveTo(70 + jx, jy);
      ctx.bezierCurveTo(50 + jx, -20 + jy, 22 + jx, -44 - waveL * 0.6 + jy, -4 + jx, -44 - waveL * 0.6 + jy);
      ctx.bezierCurveTo(-24 + jx, -42 + jy, -40 + jx, -18 + jy, -54 + jx, -8 + jy);
      ctx.lineTo(-54 + jx, 8 + jy);
      ctx.bezierCurveTo(-40 + jx, 18 + jy, -24 + jx, 42 + jy, -4 + jx, 44 + waveR * 0.6 + jy);
      ctx.bezierCurveTo(22 + jx, 44 + waveR * 0.6 + jy, 50 + jx, 20 + jy, 70 + jx, jy);
      ctx.closePath();
    };

    // Shadow
    ctx.save();
    ctx.translate(0, 7);
    traceOuterFringe();
    ctx.fillStyle = 'rgba(24, 16, 10, 0.22)';
    ctx.fill();
    ctx.restore();

    this._drawPowerfulCrescentTail(ctx, jx, jy);

    // 1. Fringed fin borders with delicate rays
    ctx.save();
    traceOuterFringe();
    const fGrad = ctx.createRadialGradient(6 + jx, jy, 24, 6 + jx, jy, 68);
    fGrad.addColorStop(0, '#6E4C30');
    fGrad.addColorStop(0.75, '#8F6846');
    fGrad.addColorStop(1, 'rgba(182, 144, 104, 0.85)');
    ctx.fillStyle = fGrad;
    ctx.fill();

    ctx.strokeStyle = 'rgba(36, 22, 12, 0.35)';
    ctx.lineWidth = 1.2;
    for (let x = -40; x <= 44; x += 8) {
      const span = 52 - Math.abs(x) * 0.65;
      if (span < 12) continue;
      ctx.beginPath();
      ctx.moveTo(x + jx, -span * 0.72 + jy);
      ctx.lineTo(x - 3 + jx, -span + jy);
      ctx.moveTo(x + jx, span * 0.72 + jy);
      ctx.lineTo(x - 3 + jx, span + jy);
      ctx.stroke();
    }

    traceOuterFringe();
    ctx.strokeStyle = '#24160C';
    ctx.lineWidth = 2.7;
    ctx.stroke();
    ctx.restore();

    // 2. Main broad diamond chocolate-brown halibut body
    ctx.save();
    traceInnerDiamond();
    const bodyGrad = ctx.createRadialGradient(14 + jx, -6 + jy, 8, 4 + jx, jy, 68);
    bodyGrad.addColorStop(0, '#8C6444');
    bodyGrad.addColorStop(0.55, '#6B482E');
    bodyGrad.addColorStop(1, '#462D1B');
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.clip();

    this._drawChocolateMottlingAndLateralArch(ctx, jx, jy);

    // Glossy jelly-bean chibi highlight
    ctx.fillStyle = 'rgba(255, 245, 230, 0.22)';
    ctx.beginPath();
    ctx.ellipse(14 + jx, -8 + jy, 24, 8.5, -0.05, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    traceInnerDiamond();
    ctx.strokeStyle = 'rgba(36, 22, 12, 0.45)';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Small pectoral fin resting on upper flatfish flank
    ctx.save();
    ctx.translate(22 + jx, 12 + jy);
    ctx.rotate(0.45 + Math.sin(this._phase) * 0.15);
    ctx.fillStyle = 'rgba(130, 94, 62, 0.85)';
    ctx.strokeStyle = '#24160C';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    this._drawAsymmetricTopEyesAndEmotes(ctx, jx, jy);
    ctx.restore();
  }
}

export default Halibutfish;
