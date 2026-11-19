/**
 * Marbled Electric Ray (Torpedo marmorata) — Bespoke 2D Top-Down Expressive Chibi Asset
 * Dimensions: 115 x 95 | Native HTML5 Canvas 2D API | Zero external dependencies
 */

const VALID_STATES = new Set([
  'breathing', 'swimming', 'relax', 'left_turn', 'right_turn',
  'eating', 'hungry', 'stress', 'fear', 'shock', 'happy', 'sad'
]);

const ALIASES = { idle: 'breathing', hunger: 'hungry' };

const ONE_SHOT_DURATIONS = {
  left_turn: 0.54,
  right_turn: 0.54,
  eating: 0.62,
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
  breathing:  { freq: 2.0, amp: 0.065, turn: 0,     charge: 0.45, jitter: 0,   droop: 0,    bounce: 0    },
  swimming:   { freq: 5.0, amp: 0.17,  turn: 0,     charge: 0.6,  jitter: 0,   droop: 0,    bounce: 0    },
  relax:      { freq: 1.0, amp: 0.035, turn: 0,     charge: 0.2,  jitter: 0,   droop: 0.12, bounce: 0    },
  left_turn:  { freq: 3.6, amp: 0.12,  turn: -0.46, charge: 0.55, jitter: 0,   droop: 0,    bounce: 0    },
  right_turn: { freq: 3.6, amp: 0.12,  turn: 0.46,  charge: 0.55, jitter: 0,   droop: 0,    bounce: 0    },
  eating:     { freq: 6.0, amp: 0.14,  turn: 0,     charge: 0.95, jitter: 0.5, droop: 0,    bounce: 0.12 },
  hungry:     { freq: 4.4, amp: 0.12,  turn: 0,     charge: 0.72, jitter: 0,   droop: 0,    bounce: 0.06 },
  stress:     { freq: 9.2, amp: 0.1,   turn: 0,     charge: 0.92, jitter: 1.6, droop: 0.05, bounce: 0    },
  fear:       { freq: 12.0,amp: 0.12,  turn: 0,     charge: 1.0,  jitter: 2.6, droop: 0.2,  bounce: 0    },
  shock:      { freq: 14.0,amp: 0.05,  turn: 0,     charge: 1.4,  jitter: 3.2, droop: 0,    bounce: -0.1 },
  happy:      { freq: 5.4, amp: 0.17,  turn: 0,     charge: 0.82, jitter: 0,   droop: -0.1, bounce: 0.16 },
  sad:        { freq: 1.2, amp: 0.035, turn: 0,     charge: 0.18, jitter: 0,   droop: 0.34, bounce: 0    }
};

function lerp(a, b, t) { return a + (b - a) * t; }
function cubicBlend(t) {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

export class Electricrayfish {
  static metadata = {
    name: 'Marbled Electric Ray',
    category: 'fish',
    baseLength: 115,
    baseWidth: 95
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

  _drawThickPaddleTail(ctx, jx, jy) {
    // Thick muscular Torpedo electric ray paddle tail with broad rounded caudal fin!
    const p = this._currPose;
    const wag = Math.sin(this._phase - 1.4) * (0.32 * p.amp * 5.0) + p.turn * 0.45;
    ctx.save();
    ctx.translate(-22 + jx, jy);
    ctx.rotate(wag);

    // Broad pelvic fins flanking thick tail base
    for (const side of [-1, 1]) {
      ctx.fillStyle = '#785032';
      ctx.strokeStyle = '#24160B';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(-2, side * 16, 13, 9, side * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Thick muscular tail stalk
    const stalkGrad = ctx.createLinearGradient(0, -10, 0, 10);
    stalkGrad.addColorStop(0, '#5C3A21');
    stalkGrad.addColorStop(0.5, '#8B5E3C');
    stalkGrad.addColorStop(1, '#5C3A21');
    ctx.fillStyle = stalkGrad;
    ctx.beginPath();
    ctx.moveTo(4, -10);
    ctx.quadraticCurveTo(-16, -8, -28, -5);
    ctx.lineTo(-28, 5);
    ctx.quadraticCurveTo(-16, 8, 4, 10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#24160B';
    ctx.lineWidth = 2.4;
    ctx.stroke();

    // Rounded paddle caudal fin
    const finGrad = ctx.createLinearGradient(-24, 0, -44, 0);
    finGrad.addColorStop(0, '#785032');
    finGrad.addColorStop(1, '#B6895B');
    ctx.fillStyle = finGrad;
    ctx.beginPath();
    ctx.moveTo(-25, -5.5);
    ctx.bezierCurveTo(-34, -17, -44, -14, -44, 0);
    ctx.bezierCurveTo(-44, 14, -34, 17, -25, 5.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  _drawMarbledPatternAndElectricArcs(ctx, jx, jy) {
    // Organic mocha/cream marbling across the plump brown paddle disc
    const mottles = [
      [22, -16, 10, 6, 0.3], [22, 16, 10, 6, -0.3],
      [6, -28, 12, 7, -0.2], [6, 28, 12, 7, 0.2],
      [-8, -18, 11, 6, 0.4], [-8, 18, 11, 6, -0.4],
      [14, 0, 9, 5, 0],      [-6, 0, 10, 6, 0.1],
      [-16, -30, 8, 5, -0.3],[-16, 30, 8, 5, 0.3]
    ];
    for (const [mx, my, rx, ry, rot] of mottles) {
      ctx.save();
      ctx.translate(mx + jx, my + jy);
      ctx.rotate(rot);
      ctx.fillStyle = 'rgba(230, 198, 152, 0.42)';
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(66, 38, 18, 0.36)';
      ctx.beginPath();
      ctx.ellipse(2, 1, rx * 0.52, ry * 0.48, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Animated crackling glowing electric-yellow bio-electric arcs on both kidney-shaped wing organs!
    const charge = this._currPose.charge;
    const t = this._time;
    const pulse = 0.72 + 0.28 * Math.sin(t * 14);

    for (const side of [-1, 1]) {
      const ox = 10 + jx;
      const oy = side * 26 + jy;

      // Soft warm electric-yellow organ glow halo
      const halo = ctx.createRadialGradient(ox, oy, 2, ox, oy, 20 * (0.7 + charge * 0.35));
      halo.addColorStop(0, `rgba(254, 240, 138, ${0.58 * charge * pulse})`);
      halo.addColorStop(0.55, `rgba(250, 204, 21, ${0.28 * charge * pulse})`);
      halo.addColorStop(1, 'rgba(250, 204, 21, 0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(ox, oy, 20 * (0.7 + charge * 0.35), 0, Math.PI * 2);
      ctx.fill();

      // Animated zigzag crackling lightning arc across the wing!
      const stepPhase = Math.floor(t * 12);
      ctx.save();
      ctx.beginPath();
      const arcPts = 6;
      for (let k = 0; k < arcPts; k++) {
        const u = k / (arcPts - 1);
        const ax = (24 - u * 34) + jx;
        const jitter = (k === 0 || k === arcPts - 1) ? 0 : Math.sin(stepPhase * 3.7 + k * 5.3 + side * 2) * (4.5 + charge * 3.5);
        const ay = side * (22 + Math.sin(u * Math.PI) * 11) + jitter + jy;
        if (k === 0) ctx.moveTo(ax, ay); else ctx.lineTo(ax, ay);
      }
      ctx.strokeStyle = `rgba(250, 204, 21, ${0.55 * Math.min(1, charge)})`;
      ctx.lineWidth = 4.2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      ctx.strokeStyle = `rgba(254, 252, 232, ${0.95 * Math.min(1, charge)})`;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawEyesAndEmotes(ctx, jx, jy) {
    const st = this._state;
    const t = this._time;

    ctx.save();
    ctx.translate(22 + jx, jy);

    // Spiracles
    ctx.fillStyle = '#3B2312';
    ctx.beginPath();
    ctx.ellipse(-8, -10, 2.8, 1.6, -0.3, 0, Math.PI * 2);
    ctx.ellipse(-8, 10, 2.8, 1.6, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Rosy blushes
    ctx.fillStyle = 'rgba(251, 113, 133, 0.42)';
    ctx.beginPath();
    ctx.ellipse(-1, -18, 4.8, 2.8, -0.2, 0, Math.PI * 2);
    ctx.ellipse(-1, 18, 4.8, 2.8, 0.2, 0, Math.PI * 2);
    ctx.fill();

    for (const side of [-1, 1]) {
      const ex = 2.5;
      const ey = side * 10.5;
      const r = st === 'shock' ? 7.8 : 6.5;

      ctx.save();
      ctx.translate(ex, ey);

      if (st === 'happy') {
        ctx.strokeStyle = '#24160B';
        ctx.lineWidth = 2.7;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, side, 4.4, side > 0 ? Math.PI * 1.15 : Math.PI * 0.15, side > 0 ? Math.PI * 1.85 : Math.PI * 0.85);
        ctx.stroke();
      } else if (st === 'stress') {
        ctx.strokeStyle = '#24160B';
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-3.2, -3.2 * side);
        ctx.lineTo(2.3, 0);
        ctx.lineTo(-3.2, 3.2 * side);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#24160B';
        ctx.lineWidth = 1.9;
        ctx.stroke();

        const irisR = st === 'shock' ? r * 0.42 : r * 0.72;
        const sx = st === 'fear' ? Math.sin(t * 58) * 1.0 : 0;
        const sy = st === 'fear' ? Math.cos(t * 64) * 1.0 : 0;
        // Glowing electric-gold iris
        const ig = ctx.createRadialGradient(1 + sx, -1 + sy, 0.6, sx, sy, irisR);
        ig.addColorStop(0, '#FEF9C3');
        ig.addColorStop(0.55, '#FACC15');
        ig.addColorStop(1, '#854D0E');
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
          ctx.fillStyle = '#8B5E3C';
          ctx.beginPath();
          ctx.arc(0, 0, r + 0.4, Math.PI, Math.PI * 2);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#24160B';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(-r, 0);
          ctx.quadraticCurveTo(0, 1.6, r, 0);
          ctx.stroke();
        }

        if (st === 'sad' || st === 'fear') {
          ctx.fillStyle = 'rgba(125, 211, 252, 0.85)';
          ctx.beginPath();
          ctx.ellipse(-1.8, 2.6 * side, 3.0, 1.6, 0.2 * side, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    if (st === 'shock') {
      ctx.save();
      ctx.translate(18, -26);
      ctx.fillStyle = '#EF4444';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-2.8, -14, 5.6, 10, 2.2);
      ctx.stroke();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, 2.8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fill();
      ctx.restore();
    } else if (st === 'fear' || st === 'stress') {
      ctx.save();
      ctx.translate(-5, -26 + Math.sin(t * 10) * 2);
      ctx.fillStyle = '#38BDF8';
      ctx.strokeStyle = '#0369A1';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, -6.5);
      ctx.bezierCurveTo(4.8, 0, 4.8, 5.5, 0, 5.5);
      ctx.bezierCurveTo(-4.8, 5.5, -4.8, 0, 0, -6.5);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (st === 'happy') {
      ctx.save();
      ctx.translate(10, -26 + Math.sin(t * 8) * 2);
      ctx.fillStyle = '#FACC15';
      ctx.strokeStyle = '#B45309';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4;
        const rad = k % 2 === 0 ? 6.0 : 2.0;
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

    // Plump paddle-shaped circular electric ray disc with gentle front-flat contour
    const traceDisc = () => {
      const ripple = Math.sin(this._phase) * (3.8 * p.amp * 5.0);
      ctx.beginPath();
      ctx.moveTo(46 + jx, -16 + jy);
      ctx.bezierCurveTo(50 + jx, 0 + jy, 50 + jx, 0 + jy, 46 + jx, 16 + jy);
      ctx.bezierCurveTo(40 + jx, 42 + ripple + jy, 12 + jx, 48 + ripple + jy, -12 + jx, 40 + jy);
      ctx.bezierCurveTo(-26 + jx, 34 + jy, -30 + jx, 18 + jy, -26 + jx, jy);
      ctx.bezierCurveTo(-30 + jx, -18 + jy, -26 + jx, -34 + jy, -12 + jx, -40 + jy);
      ctx.bezierCurveTo(12 + jx, -48 - ripple + jy, 40 + jx, -42 - ripple + jy, 46 + jx, -16 + jy);
      ctx.closePath();
    };

    // Shadow
    ctx.save();
    ctx.translate(0, 6);
    traceDisc();
    ctx.fillStyle = 'rgba(26, 16, 10, 0.22)';
    ctx.fill();
    ctx.restore();

    this._drawThickPaddleTail(ctx, jx, jy);

    ctx.save();
    traceDisc();
    const discGrad = ctx.createRadialGradient(14 + jx, -6 + jy, 6, 8 + jx, jy, 52);
    discGrad.addColorStop(0, '#A4754B');
    discGrad.addColorStop(0.55, '#785032');
    discGrad.addColorStop(1, '#4A2F1B');
    ctx.fillStyle = discGrad;
    ctx.fill();
    ctx.clip();

    this._drawMarbledPatternAndElectricArcs(ctx, jx, jy);

    // Glossy jelly-bean chibi highlight
    ctx.fillStyle = 'rgba(255, 250, 235, 0.24)';
    ctx.beginPath();
    ctx.ellipse(12 + jx, -6 + jy, 16, 8, -0.06, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    traceDisc();
    ctx.strokeStyle = '#24160B';
    ctx.lineWidth = 2.7;
    ctx.lineJoin = 'round';
    ctx.stroke();

    this._drawEyesAndEmotes(ctx, jx, jy);
    ctx.restore();
  }
}

export default Electricrayfish;
