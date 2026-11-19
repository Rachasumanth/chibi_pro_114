/**
 * Peacock Flounder (Bothus mancus) — Bespoke 2D Top-Down Expressive Chibi Asset
 * Dimensions: 105 x 72 | Native HTML5 Canvas 2D API | Zero external dependencies
 */

const VALID_STATES = new Set([
  'breathing', 'swimming', 'relax', 'left_turn', 'right_turn',
  'eating', 'hungry', 'stress', 'fear', 'shock', 'happy', 'sad'
]);

const ALIASES = { idle: 'breathing', hunger: 'hungry' };

const ONE_SHOT_DURATIONS = {
  left_turn: 0.52,
  right_turn: 0.52,
  eating: 0.6,
  shock: 0.74
};

const BLOCKED_IN_SHOCK = new Set([
  'left_turn', 'right_turn', 'relax', 'happy', 'eating',
  'breathing', 'swimming', 'hungry', 'sad'
]);

const BLOCKED_IN_FEAR = new Set([
  'left_turn', 'right_turn', 'relax', 'happy', 'eating'
]);

const POSE_TARGETS = {
  breathing:  { freq: 2.2, amp: 0.075, turn: 0,     mouth: 0.06, jitter: 0,   droop: 0,    bounce: 0    },
  swimming:   { freq: 5.8, amp: 0.20,  turn: 0,     mouth: 0.08, jitter: 0,   droop: 0,    bounce: 0    },
  relax:      { freq: 1.0, amp: 0.04,  turn: 0,     mouth: 0.03, jitter: 0,   droop: 0.12, bounce: 0    },
  left_turn:  { freq: 4.0, amp: 0.14,  turn: -0.45, mouth: 0.08, jitter: 0,   droop: 0,    bounce: 0    },
  right_turn: { freq: 4.0, amp: 0.14,  turn: 0.45,  mouth: 0.08, jitter: 0,   droop: 0,    bounce: 0    },
  eating:     { freq: 6.4, amp: 0.15,  turn: 0,     mouth: 0.92, jitter: 0,   droop: 0,    bounce: 0.12 },
  hungry:     { freq: 4.8, amp: 0.13,  turn: 0,     mouth: 0.52, jitter: 0,   droop: 0,    bounce: 0.06 },
  stress:     { freq: 9.4, amp: 0.11,  turn: 0,     mouth: 0.12, jitter: 1.5, droop: 0.05, bounce: 0    },
  fear:       { freq: 12.2,amp: 0.14,  turn: 0,     mouth: 0.25, jitter: 2.5, droop: 0.2,  bounce: 0    },
  shock:      { freq: 13.8,amp: 0.05,  turn: 0,     mouth: 0.85, jitter: 3.0, droop: 0,    bounce: -0.1 },
  happy:      { freq: 6.0, amp: 0.19,  turn: 0,     mouth: 0.2,  jitter: 0,   droop: -0.1, bounce: 0.16 },
  sad:        { freq: 1.2, amp: 0.04,  turn: 0,     mouth: 0.03, jitter: 0,   droop: 0.34, bounce: 0    }
};

function lerp(a, b, t) { return a + (b - a) * t; }
function cubicBlend(t) {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

export class Flounderfish {
  static metadata = {
    name: 'Peacock Flounder',
    category: 'fish',
    baseLength: 105,
    baseWidth: 72
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

  _drawRoundedFanTail(ctx, jx, jy) {
    const p = this._currPose;
    const wag = Math.sin(this._phase - 2.2) * (0.34 * p.amp * 4.8) + p.turn * 0.45;
    ctx.save();
    ctx.translate(-34 + jx, jy);
    ctx.rotate(wag);

    const g = ctx.createRadialGradient(-6, 0, 2, -12, 0, 20);
    g.addColorStop(0, '#9E9768');
    g.addColorStop(0.65, '#C4BC8B');
    g.addColorStop(1, 'rgba(56, 189, 248, 0.55)');

    ctx.beginPath();
    ctx.moveTo(2, -7);
    ctx.bezierCurveTo(-8, -17, -21, -14, -22, 0);
    ctx.bezierCurveTo(-21, 14, -8, 17, 2, 7);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();

    ctx.strokeStyle = 'rgba(42, 46, 26, 0.42)';
    ctx.lineWidth = 1.1;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(-1, i * 1.6);
      ctx.lineTo(-19, i * 4.2);
      ctx.stroke();
    }

    ctx.strokeStyle = '#2A2E1A';
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.restore();
  }

  _drawPeacockOcelliAndSpeckles(ctx, jx, jy) {
    // Glowing electric-blue ringed peacock ocelli flower-spots across sandy-olive flatfish body!
    const pulse = 0.88 + 0.12 * Math.sin(this._time * 4.2);
    const ocelli = [
      [14, -18, 6.2], [4, 17, 6.0], [-8, -12, 6.8],
      [-14, 14, 5.8], [-24, -4, 5.2], [6, -2, 5.5],
      [20, 8, 4.8],   [-2, -26, 4.6], [-20, -20, 4.4], [-22, 22, 4.4]
    ];

    for (const [ox, oy, r] of ocelli) {
      const x = ox + jx;
      const y = oy + jy;

      // Outer electric-cyan bioluminescent ring
      ctx.strokeStyle = `rgba(56, 189, 248, ${0.9 * pulse})`;
      ctx.lineWidth = 2.1;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();

      // Inner dusky olive-blue core
      ctx.fillStyle = 'rgba(30, 64, 110, 0.55)';
      ctx.beginPath();
      ctx.arc(x, y, r * 0.64, 0, Math.PI * 2);
      ctx.fill();

      // Center bright sky-blue pinpoint
      ctx.fillStyle = '#BAE6FD';
      ctx.beginPath();
      ctx.arc(x, y, r * 0.25, 0, Math.PI * 2);
      ctx.fill();
    }

    // Fine sandy-brown camouflage grain dots
    ctx.fillStyle = 'rgba(54, 58, 32, 0.45)';
    for (let k = 0; k < 22; k++) {
      const sx = Math.sin(k * 13.7) * 32 + jx;
      const sy = Math.cos(k * 9.3) * 22 + jy;
      ctx.beginPath();
      ctx.arc(sx, sy, 1.15, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _drawAsymmetricTopEyesAndEmotes(ctx, jx, jy) {
    // Signature Peacock Flounder trait: BOTH expressive chibi eyes shifted asymmetrically on the top side!
    const st = this._state;
    const t = this._time;

    ctx.save();
    ctx.translate(22 + jx, jy);

    // Cute side-tilted flounder mouth on snout
    const m = this._currPose.mouth;
    if (m > 0.14) {
      ctx.fillStyle = '#3F1D28';
      ctx.beginPath();
      ctx.ellipse(24, 3, 3.5 + m * 3, 5 + m * 3, 0.25, 0, Math.PI * 2);
      ctx.fill();
    }

    // Rosy cheek blushes offset asymmetrically near the top-side eyes
    ctx.fillStyle = 'rgba(251, 113, 133, 0.44)';
    ctx.beginPath();
    ctx.ellipse(0, -18, 4.6, 2.6, -0.2, 0, Math.PI * 2);
    ctx.ellipse(-6, 7, 4.6, 2.6, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Asymmetric eye positions: upper eye slightly further back & higher, lower eye closer to midline & forward!
    const eyes = [
      { ex: 4,  ey: -10.5, side: -1 },
      { ex: 10, ey: 1.5,   side: 1  }
    ];

    for (const eye of eyes) {
      const r = st === 'shock' ? 7.8 : 6.5;
      ctx.save();
      ctx.translate(eye.ex, eye.ey);

      if (st === 'happy') {
        ctx.strokeStyle = '#2A2E1A';
        ctx.lineWidth = 2.7;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, 1, 4.4, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();
      } else if (st === 'stress') {
        ctx.strokeStyle = '#2A2E1A';
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-3.2, -3.2 * eye.side);
        ctx.lineTo(2.3, 0);
        ctx.lineTo(-3.2, 3.2 * eye.side);
        ctx.stroke();
      } else {
        // Raised fleshy eye turret ring
        ctx.fillStyle = '#8F8859';
        ctx.beginPath();
        ctx.arc(0, 0, r + 1.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2A2E1A';
        ctx.lineWidth = 1.9;
        ctx.stroke();

        const irisR = st === 'shock' ? r * 0.42 : r * 0.72;
        const sx = st === 'fear' ? Math.sin(t * 58) * 1.0 : 0;
        const sy = st === 'fear' ? Math.cos(t * 64) * 1.0 : 0;
        const ig = ctx.createRadialGradient(1 + sx, -1 + sy, 0.6, sx, sy, irisR);
        ig.addColorStop(0, '#BAE6FD');
        ig.addColorStop(0.55, '#0284C7');
        ig.addColorStop(1, '#1E3A8A');
        ctx.fillStyle = ig;
        ctx.beginPath();
        ctx.arc(1.1 + sx, sy, irisR, 0, Math.PI * 2);
        ctx.fill();

        const pr = st === 'shock' ? 1.7 : (st === 'fear' ? 2.1 : irisR * 0.55);
        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        ctx.arc(1.4 + sx, sy, pr, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(2.4, -1.8, 2.0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-0.9, 1.7, 0.95, 0, Math.PI * 2);
        ctx.fill();

        if (st === 'hungry' || st === 'eating') {
          ctx.fillStyle = '#FEF08A';
          ctx.beginPath();
          for (let k = 0; k < 8; k++) {
            const a = (k * Math.PI) / 4;
            const rad = k % 2 === 0 ? 3.4 : 1.15;
            ctx.lineTo(1.2 + Math.cos(a) * rad, Math.sin(a) * rad);
          }
          ctx.closePath();
          ctx.fill();
        }

        if (st === 'relax') {
          ctx.fillStyle = '#9E9768';
          ctx.beginPath();
          ctx.arc(0, 0, r + 0.4, Math.PI, Math.PI * 2);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#2A2E1A';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(-r, 0);
          ctx.quadraticCurveTo(0, 1.6, r, 0);
          ctx.stroke();
        }

        if (st === 'sad' || st === 'fear') {
          ctx.fillStyle = 'rgba(125, 211, 252, 0.85)';
          ctx.beginPath();
          ctx.ellipse(-1.8, 2.6, 3.0, 1.6, 0.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    if (st === 'shock') {
      ctx.save();
      ctx.translate(18, -24);
      ctx.fillStyle = '#EF4444';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.9;
      ctx.beginPath();
      ctx.roundRect(-2.6, -13.5, 5.2, 9.5, 2);
      ctx.stroke();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, 2.7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fill();
      ctx.restore();
    } else if (st === 'fear' || st === 'stress') {
      ctx.save();
      ctx.translate(-4, -24 + Math.sin(t * 10) * 1.8);
      ctx.fillStyle = '#38BDF8';
      ctx.strokeStyle = '#0369A1';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.bezierCurveTo(4.5, 0, 4.5, 5, 0, 5);
      ctx.bezierCurveTo(-4.5, 5, -4.5, 0, 0, -6);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (st === 'happy') {
      ctx.save();
      ctx.translate(10, -24 + Math.sin(t * 8) * 1.8);
      ctx.fillStyle = '#FACC15';
      ctx.strokeStyle = '#B45309';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4;
        const rad = k % 2 === 0 ? 5.8 : 2.0;
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
    const bounceScale = 1 + Math.sin(this._time * 8.5) * p.bounce * 0.22;
    ctx.scale(this.scale * bounceScale, this.scale / Math.sqrt(Math.max(0.7, bounceScale)));

    const jx = p.jitter > 0 ? Math.sin(this._time * 60) * p.jitter * 0.45 : 0;
    const jy = p.jitter > 0 ? Math.cos(this._time * 68) * p.jitter : 0;

    // Continuous undulating fringed outer margin wrapping the oval flatfish body!
    const fringePts = [];
    const bodyPts = [];
    const steps = 38;
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const cosA = Math.cos(a);
      const sinA = Math.sin(a);
      const wave = Math.sin(this._phase * 1.3 - cosA * 5.0) * (5.2 * p.amp * 4.5) * Math.abs(sinA);
      const turnOff = p.turn * 7 * sinA * cosA;
      fringePts.push({ x: 4 + cosA * 46 + jx, y: sinA * (36 + wave) + turnOff + jy });
      bodyPts.push({ x: 4 + cosA * 39 + jx, y: sinA * (28 + wave * 0.6) + turnOff * 0.6 + jy });
    }

    const traceLoop = (arr) => {
      ctx.beginPath();
      for (let i = 0; i < arr.length; i++) {
        const p0 = arr[i];
        const p1 = arr[(i + 1) % arr.length];
        const mx = (p0.x + p1.x) * 0.5;
        const my = (p0.y + p1.y) * 0.5;
        if (i === 0) ctx.moveTo(mx, my); else ctx.quadraticCurveTo(p0.x, p0.y, mx, my);
      }
      ctx.closePath();
    };

    // Shadow
    ctx.save();
    ctx.translate(0, 5);
    traceLoop(fringePts);
    ctx.fillStyle = 'rgba(28, 30, 18, 0.2)';
    ctx.fill();
    ctx.restore();

    this._drawRoundedFanTail(ctx, jx, jy);

    // 1. Translucent continuous fringed fin border with delicate radial rays
    ctx.save();
    traceLoop(fringePts);
    const fringeGrad = ctx.createRadialGradient(4 + jx, jy, 18, 4 + jx, jy, 46);
    fringeGrad.addColorStop(0, '#9E9768');
    fringeGrad.addColorStop(0.75, 'rgba(196, 188, 139, 0.85)');
    fringeGrad.addColorStop(1, 'rgba(125, 211, 252, 0.62)');
    ctx.fillStyle = fringeGrad;
    ctx.fill();

    ctx.strokeStyle = 'rgba(42, 46, 26, 0.32)';
    ctx.lineWidth = 1.0;
    for (let i = 0; i < steps; i += 2) {
      ctx.beginPath();
      ctx.moveTo(bodyPts[i].x, bodyPts[i].y);
      ctx.lineTo(fringePts[i].x, fringePts[i].y);
      ctx.stroke();
    }

    traceLoop(fringePts);
    ctx.strokeStyle = '#2A2E1A';
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.restore();

    // 2. Main flat oval sandy-olive body with glowing peacock ocelli spots
    ctx.save();
    traceLoop(bodyPts);
    const bodyGrad = ctx.createRadialGradient(10 + jx, -4 + jy, 4, 4 + jx, jy, 40);
    bodyGrad.addColorStop(0, '#C8C18F');
    bodyGrad.addColorStop(0.6, '#9E9768');
    bodyGrad.addColorStop(1, '#75704A');
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.clip();

    this._drawPeacockOcelliAndSpeckles(ctx, jx, jy);

    // Glossy chibi highlight
    ctx.fillStyle = 'rgba(255, 255, 240, 0.28)';
    ctx.beginPath();
    ctx.ellipse(6 + jx, -5 + jy, 16, 6.2, -0.05, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    traceLoop(bodyPts);
    ctx.strokeStyle = 'rgba(42, 46, 26, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    this._drawAsymmetricTopEyesAndEmotes(ctx, jx, jy);
    ctx.restore();
  }
}

export default Flounderfish;
