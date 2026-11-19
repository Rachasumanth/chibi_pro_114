/**
 * Blue-Spotted Ribbontail Ray (Taeniura lymma) — Bespoke 2D Top-Down Expressive Chibi Asset
 * Dimensions: 135 x 115 | Native HTML5 Canvas 2D API | Zero external dependencies
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
  shock: 0.76
};

const BLOCKED_IN_SHOCK = new Set([
  'left_turn', 'right_turn', 'relax', 'happy', 'eating',
  'breathing', 'swimming', 'hungry', 'sad'
]);

const BLOCKED_IN_FEAR = new Set([
  'left_turn', 'right_turn', 'relax', 'happy', 'eating'
]);

const POSE_TARGETS = {
  breathing:  { freq: 2.0, amp: 0.08,  turn: 0,     jitter: 0,   droop: 0,    bounce: 0    },
  swimming:   { freq: 5.2, amp: 0.22,  turn: 0,     jitter: 0,   droop: 0,    bounce: 0    },
  relax:      { freq: 1.0, amp: 0.045, turn: 0,     jitter: 0,   droop: 0.12, bounce: 0    },
  left_turn:  { freq: 3.6, amp: 0.15,  turn: -0.48, jitter: 0,   droop: 0,    bounce: 0    },
  right_turn: { freq: 3.6, amp: 0.15,  turn: 0.48,  jitter: 0,   droop: 0,    bounce: 0    },
  eating:     { freq: 5.8, amp: 0.16,  turn: 0,     jitter: 0,   droop: 0,    bounce: 0.12 },
  hungry:     { freq: 4.4, amp: 0.14,  turn: 0,     jitter: 0,   droop: 0,    bounce: 0.06 },
  stress:     { freq: 9.0, amp: 0.12,  turn: 0,     jitter: 1.5, droop: 0.05, bounce: 0    },
  fear:       { freq: 11.8,amp: 0.15,  turn: 0,     jitter: 2.5, droop: 0.2,  bounce: 0    },
  shock:      { freq: 13.5,amp: 0.05,  turn: 0,     jitter: 3.0, droop: 0,    bounce: -0.1 },
  happy:      { freq: 5.4, amp: 0.20,  turn: 0,     jitter: 0,   droop: -0.1, bounce: 0.16 },
  sad:        { freq: 1.2, amp: 0.04,  turn: 0,     jitter: 0,   droop: 0.32, bounce: 0    }
};

function lerp(a, b, t) { return a + (b - a) * t; }
function cubicBlend(t) {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

export class Stingrayfish {
  static metadata = {
    name: 'Blue-Spotted Ribbontail Ray',
    category: 'fish',
    baseLength: 135,
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

  _drawBlueStripedRibbontail(ctx, jx, jy) {
    // Signature long ribbontail with twin glowing electric-blue racing stripes & venomous spine barb!
    const p = this._currPose;
    const baseX = -26 + jx;
    const baseY = jy;
    const segs = 10;
    const pts = [];

    for (let i = 0; i <= segs; i++) {
      const u = i / segs;
      const x = baseX - u * 54;
      const y = baseY + Math.sin(this._phase * 1.1 - u * 4.4) * (12 * p.amp * 4.4 * u) + p.turn * 28 * u * u;
      pts.push({ x, y, r: lerp(6.8, 1.5, u) });
    }

    // Pelvic lobes flanking tail base
    for (const side of [-1, 1]) {
      ctx.fillStyle = '#C89B54';
      ctx.strokeStyle = '#3B2612';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.ellipse(baseX + 2, baseY + side * 14, 11, 7.5, side * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Main tapered golden-tan ribbontail stroke
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      if (i === 0) ctx.moveTo(pts[i].x, pts[i].y); else ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.strokeStyle = '#3B2612';
    ctx.lineWidth = 10.5;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.strokeStyle = '#D6A85C';
    ctx.lineWidth = 6.8;
    ctx.stroke();

    // Twin electric-blue stripes running down both sides of the ribbontail!
    for (const side of [-1, 1]) {
      ctx.beginPath();
      for (let i = 0; i < pts.length - 1; i++) {
        const off = side * lerp(2.5, 0.9, i / segs);
        if (i === 0) ctx.moveTo(pts[i].x, pts[i].y + off); else ctx.lineTo(pts[i].x, pts[i].y + off);
      }
      ctx.strokeStyle = '#00D4FF';
      ctx.lineWidth = 1.9;
      ctx.stroke();
    }

    // Cute venomous tail barb spine
    const bPt = pts[4];
    ctx.fillStyle = '#F8FAFC';
    ctx.strokeStyle = '#3B2612';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(bPt.x + 2, bPt.y - 2);
    ctx.lineTo(bPt.x - 10, bPt.y - 5);
    ctx.lineTo(bPt.x - 1, bPt.y + 1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  _drawElectricBluePolkaDots(ctx, jx, jy) {
    // Glowing electric-blue ringed polka dots scattered symmetrically across the golden-tan disc!
    const pulse = 0.85 + 0.15 * Math.sin(this._time * 4.5);
    const spots = [
      [26, -16, 4.4], [26, 16, 4.4],
      [14, -30, 5.2], [14, 30, 5.2],
      [2, -18, 4.8],  [2, 18, 4.8],
      [-2, -38, 4.6], [-2, 38, 4.6],
      [-14, -26, 5.0],[-14, 26, 5.0],
      [-18, -10, 4.2],[-18, 10, 4.2],
      [-24, -32, 3.8],[-24, 32, 3.8],
      [8, 0, 4.5],    [-8, 0, 4.8],
      [24, -34, 3.5], [24, 34, 3.5]
    ];

    for (const [sx, sy, sr] of spots) {
      const x = sx + jx;
      const y = sy + jy;

      // Soft electric-blue bioluminescent ring halo
      const halo = ctx.createRadialGradient(x, y, sr * 0.4, x, y, sr * 1.65 * pulse);
      halo.addColorStop(0, 'rgba(56, 189, 248, 0.95)');
      halo.addColorStop(0.55, 'rgba(14, 165, 233, 0.45)');
      halo.addColorStop(1, 'rgba(14, 165, 233, 0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(x, y, sr * 1.65 * pulse, 0, Math.PI * 2);
      ctx.fill();

      // Deep sapphire outer ring + bright electric-cyan center
      ctx.fillStyle = '#0284C7';
      ctx.beginPath();
      ctx.arc(x, y, sr, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#38BDF8';
      ctx.beginPath();
      ctx.arc(x, y, sr * 0.72, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#E0F2FE';
      ctx.beginPath();
      ctx.arc(x - sr * 0.25, y - sr * 0.25, sr * 0.28, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _drawEyesAndEmotes(ctx, jx, jy) {
    // Raised top-mounted chibi stingray eyes + tiny spiracle breathing vents behind them!
    const st = this._state;
    const t = this._time;

    ctx.save();
    ctx.translate(22 + jx, jy);

    // Spiracles behind eyes
    ctx.fillStyle = '#5C3A1B';
    ctx.beginPath();
    ctx.ellipse(-9, -11, 3.2, 1.8, -0.3, 0, Math.PI * 2);
    ctx.ellipse(-9, 11, 3.2, 1.8, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Rosy cheek blushes
    ctx.fillStyle = 'rgba(251, 113, 133, 0.42)';
    ctx.beginPath();
    ctx.ellipse(-1, -21, 5.2, 3.0, -0.2, 0, Math.PI * 2);
    ctx.ellipse(-1, 21, 5.2, 3.0, 0.2, 0, Math.PI * 2);
    ctx.fill();

    for (const side of [-1, 1]) {
      const ex = 2.5;
      const ey = side * 12.5;
      const r = st === 'shock' ? 8.2 : 6.9;

      ctx.save();
      ctx.translate(ex, ey);

      if (st === 'happy') {
        ctx.strokeStyle = '#3B2612';
        ctx.lineWidth = 2.8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, side, 4.6, side > 0 ? Math.PI * 1.15 : Math.PI * 0.15, side > 0 ? Math.PI * 1.85 : Math.PI * 0.85);
        ctx.stroke();
      } else if (st === 'stress') {
        ctx.strokeStyle = '#3B2612';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-3.4, -3.4 * side);
        ctx.lineTo(2.4, 0);
        ctx.lineTo(-3.4, 3.4 * side);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#3B2612';
        ctx.lineWidth = 2.0;
        ctx.stroke();

        const irisR = st === 'shock' ? r * 0.42 : r * 0.72;
        const sx = st === 'fear' ? Math.sin(t * 58) * 1.0 : 0;
        const sy = st === 'fear' ? Math.cos(t * 64) * 1.0 : 0;
        const ig = ctx.createRadialGradient(1 + sx, -1 + sy, 0.7, sx, sy, irisR);
        ig.addColorStop(0, '#FEF08A');
        ig.addColorStop(0.55, '#F59E0B');
        ig.addColorStop(1, '#78350F');
        ctx.fillStyle = ig;
        ctx.beginPath();
        ctx.arc(1.1 + sx, sy, irisR, 0, Math.PI * 2);
        ctx.fill();

        const pr = st === 'shock' ? 1.8 : (st === 'fear' ? 2.2 : irisR * 0.55);
        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        ctx.arc(1.4 + sx, sy, pr, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(2.5, -1.9, 2.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-0.9, 1.8, 1.0, 0, Math.PI * 2);
        ctx.fill();

        if (st === 'hungry' || st === 'eating') {
          ctx.fillStyle = '#FEF08A';
          ctx.beginPath();
          for (let k = 0; k < 8; k++) {
            const a = (k * Math.PI) / 4;
            const rad = k % 2 === 0 ? 3.5 : 1.2;
            ctx.lineTo(1.2 + Math.cos(a) * rad, Math.sin(a) * rad);
          }
          ctx.closePath();
          ctx.fill();
        }

        if (st === 'relax') {
          ctx.fillStyle = '#C89B54';
          ctx.beginPath();
          ctx.arc(0, 0, r + 0.4, Math.PI, Math.PI * 2);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#3B2612';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(-r, 0);
          ctx.quadraticCurveTo(0, 1.7, r, 0);
          ctx.stroke();
        }

        if (st === 'sad' || st === 'fear') {
          ctx.fillStyle = 'rgba(125, 211, 252, 0.85)';
          ctx.beginPath();
          ctx.ellipse(-1.8, 2.8 * side, 3.2, 1.7, 0.2 * side, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    if (st === 'shock') {
      ctx.save();
      ctx.translate(18, -28);
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
      ctx.translate(-5, -28 + Math.sin(t * 10) * 2);
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
      ctx.translate(10, -28 + Math.sin(t * 8) * 2);
      ctx.fillStyle = '#FACC15';
      ctx.strokeStyle = '#B45309';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4;
        const rad = k % 2 === 0 ? 6.2 : 2.1;
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

    // Build undulating rippled oval stingray wing-disc contour!
    const discPts = [];
    const steps = 40;
    const rx = 46;
    const ry = 54;
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const cosA = Math.cos(a);
      const sinA = Math.sin(a);
      // Traveling ripple wave along the outer disc margins (strongest on sides)
      const sideFactor = Math.abs(sinA);
      const ripple = Math.sin(this._phase * 1.4 - cosA * 5.2) * (6.8 * p.amp * 4.5) * sideFactor;
      const turnBias = p.turn * 8 * sinA * cosA;
      const px = 8 + cosA * (rx + ripple * 0.35) + jx;
      const py = sinA * (ry + ripple) + turnBias + jy;
      discPts.push({ x: px, y: py });
    }

    const traceDisc = () => {
      ctx.beginPath();
      for (let i = 0; i < discPts.length; i++) {
        const p0 = discPts[i];
        const p1 = discPts[(i + 1) % discPts.length];
        const mx = (p0.x + p1.x) * 0.5;
        const my = (p0.y + p1.y) * 0.5;
        if (i === 0) ctx.moveTo(mx, my);
        else ctx.quadraticCurveTo(p0.x, p0.y, mx, my);
      }
      ctx.closePath();
    };

    // 1. Soft underwater drop shadow
    ctx.save();
    ctx.translate(0, 7);
    traceDisc();
    ctx.fillStyle = 'rgba(30, 22, 14, 0.22)';
    ctx.fill();
    ctx.restore();

    // 2. Blue-striped ribbontail
    this._drawBlueStripedRibbontail(ctx, jx, jy);

    // 3. Round-oval golden-tan stingray disc
    ctx.save();
    traceDisc();
    const discGrad = ctx.createRadialGradient(14 + jx, -6 + jy, 8, 6 + jx, jy, 58);
    discGrad.addColorStop(0, '#F3D289');
    discGrad.addColorStop(0.55, '#D4A553');
    discGrad.addColorStop(0.88, '#A97834');
    discGrad.addColorStop(1, '#E6C27A');
    ctx.fillStyle = discGrad;
    ctx.fill();
    ctx.clip();

    // Glowing electric-blue ringed polka dots!
    this._drawElectricBluePolkaDots(ctx, jx, jy);

    // Glossy jelly-bean chibi highlight on central crown
    ctx.fillStyle = 'rgba(255, 251, 235, 0.34)';
    ctx.beginPath();
    ctx.ellipse(10 + jx, -6 + jy, 20, 9.5, -0.06, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    traceDisc();
    ctx.strokeStyle = '#3B2612';
    ctx.lineWidth = 2.8;
    ctx.lineJoin = 'round';
    ctx.stroke();

    this._drawEyesAndEmotes(ctx, jx, jy);
    ctx.restore();
  }
}

export default Stingrayfish;
