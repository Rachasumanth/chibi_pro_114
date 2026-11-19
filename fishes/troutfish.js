/**
 * Rainbow Trout (Oncorhynchus mykiss) — Bespoke 2D Top-Down Expressive Chibi Asset
 * Dimensions: 110 x 40 | Native HTML5 Canvas 2D API | Zero external dependencies
 */

const VALID_STATES = new Set([
  'breathing', 'swimming', 'relax', 'left_turn', 'right_turn',
  'eating', 'hungry', 'stress', 'fear', 'shock', 'happy', 'sad'
]);

const ALIASES = { idle: 'breathing', hunger: 'hungry' };

const ONE_SHOT_DURATIONS = {
  left_turn: 0.48,
  right_turn: 0.48,
  eating: 0.58,
  shock: 0.72
};

const BLOCKED_IN_SHOCK = new Set([
  'left_turn', 'right_turn', 'relax', 'happy', 'eating',
  'breathing', 'swimming', 'hungry', 'sad'
]);

const BLOCKED_IN_FEAR = new Set([
  'left_turn', 'right_turn', 'relax', 'happy', 'eating'
]);

const POSE_TARGETS = {
  breathing:  { freq: 2.5, amp: 0.068, turn: 0,     finSpread: 1.0,  mouth: 0.06, jitter: 0,   droop: 0,    bounce: 0    },
  swimming:   { freq: 6.6, amp: 0.175, turn: 0,     finSpread: 0.88, mouth: 0.08, jitter: 0,   droop: 0,    bounce: 0    },
  relax:      { freq: 1.2, amp: 0.036, turn: 0,     finSpread: 1.15, mouth: 0.03, jitter: 0,   droop: 0.1,  bounce: 0    },
  left_turn:  { freq: 4.5, amp: 0.11,  turn: -0.5,  finSpread: 1.14, mouth: 0.08, jitter: 0,   droop: 0,    bounce: 0    },
  right_turn: { freq: 4.5, amp: 0.11,  turn: 0.5,   finSpread: 1.14, mouth: 0.08, jitter: 0,   droop: 0,    bounce: 0    },
  eating:     { freq: 7.4, amp: 0.14,  turn: 0,     finSpread: 1.22, mouth: 0.92, jitter: 0,   droop: 0,    bounce: 0.12 },
  hungry:     { freq: 5.2, amp: 0.13,  turn: 0,     finSpread: 1.08, mouth: 0.52, jitter: 0,   droop: 0,    bounce: 0.06 },
  stress:     { freq: 9.8, amp: 0.09,  turn: 0,     finSpread: 0.74, mouth: 0.12, jitter: 1.5, droop: 0.05, bounce: 0    },
  fear:       { freq: 12.6,amp: 0.12,  turn: 0,     finSpread: 0.58, mouth: 0.26, jitter: 2.5, droop: 0.2,  bounce: 0    },
  shock:      { freq: 14.0,amp: 0.04,  turn: 0,     finSpread: 1.35, mouth: 0.85, jitter: 3.0, droop: 0,    bounce: -0.1 },
  happy:      { freq: 6.8, amp: 0.17,  turn: 0,     finSpread: 1.22, mouth: 0.2,  jitter: 0,   droop: -0.1, bounce: 0.16 },
  sad:        { freq: 1.4, amp: 0.036, turn: 0,     finSpread: 0.7,  mouth: 0.03, jitter: 0,   droop: 0.32, bounce: 0    }
};

function lerp(a, b, t) { return a + (b - a) * t; }
function cubicBlend(t) {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

export class Troutfish {
  static metadata = {
    name: 'Rainbow Trout',
    category: 'fish',
    baseLength: 110,
    baseWidth: 40
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

  _buildSpine() {
    // 9-segment streamlined torpedo Rainbow Trout spine
    const L = 110;
    const W = 40;
    const segs = 9;
    const widths = [0.34, 0.78, 0.98, 1.00, 0.90, 0.72, 0.52, 0.34, 0.21];
    const pts = [];
    const p = this._currPose;
    const jx = p.jitter > 0 ? Math.sin(this._time * 60) * p.jitter * 0.4 : 0;
    const jy = p.jitter > 0 ? Math.cos(this._time * 68) * p.jitter : 0;

    for (let i = 0; i < segs; i++) {
      const u = i / (segs - 1);
      const x = L * 0.42 - u * L * 0.80 + jx;
      const flex = Math.pow(u, 1.45);
      const wave = Math.sin(this._phase - u * 3.8) * (W * 0.52) * p.amp * 4.8 * flex;
      const turnCurve = p.turn * L * 0.28 * Math.pow(u, 1.5);
      pts.push({ x, y: wave + turnCurve + jy, r: widths[i] * (W * 0.5), u });
    }
    return pts;
  }

  _frame(pts, idx) {
    const curr = pts[idx];
    const prev = pts[Math.max(0, idx - 1)];
    const next = pts[Math.min(pts.length - 1, idx + 1)];
    const tx = prev.x - next.x;
    const ty = prev.y - next.y;
    const len = Math.hypot(tx, ty) || 1;
    return { x: curr.x, y: curr.y, r: curr.r, tx: tx / len, ty: ty / len, nx: -ty / len, ny: tx / len };
  }

  _drawPectoralFin(ctx, frame, side) {
    const p = this._currPose;
    const flap = Math.sin(this._phase * 1.0 + (side > 0 ? 0 : 0.7)) * 0.24;
    const angle = Math.atan2(frame.ty, frame.tx) + side * (Math.PI * 0.58 + flap + p.turn * side * 0.35);

    ctx.save();
    ctx.translate(frame.x + frame.nx * side * (frame.r * 0.78), frame.y + frame.ny * side * (frame.r * 0.78));
    ctx.rotate(angle);
    ctx.scale(0.84 + 0.2 * p.finSpread, 1);

    const g = ctx.createLinearGradient(0, 0, 21, 0);
    g.addColorStop(0, 'rgba(190, 174, 152, 0.92)');
    g.addColorStop(1, 'rgba(244, 180, 198, 0.7)');

    ctx.beginPath();
    ctx.moveTo(0, -3.5 * side);
    ctx.bezierCurveTo(9, -9 * side, 19, -6 * side, 22, 1 * side);
    ctx.bezierCurveTo(17, 8 * side, 8, 8 * side, -2, 4 * side);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(2, i * 1.8 * side);
      ctx.lineTo(18, i * 3.2 * side);
      ctx.stroke();
    }

    ctx.strokeStyle = '#1E2A24';
    ctx.lineWidth = 1.9;
    ctx.stroke();
    ctx.restore();
  }

  _drawSpottedForkedTail(ctx, tailFrame) {
    // Signature black-speckled forked Rainbow Trout tail
    const wag = Math.sin(this._phase - 3.9) * 0.34 + this._currPose.turn * 0.52;
    ctx.save();
    ctx.translate(tailFrame.x, tailFrame.y);
    ctx.rotate(Math.atan2(-tailFrame.ty, -tailFrame.tx) + wag);

    const g = ctx.createLinearGradient(0, 0, 25, 0);
    g.addColorStop(0, '#5E7C63');
    g.addColorStop(0.55, '#8FA894');
    g.addColorStop(1, 'rgba(244, 114, 182, 0.58)');

    ctx.beginPath();
    ctx.moveTo(-2, -6);
    ctx.quadraticCurveTo(11, -17, 25, -15);
    ctx.quadraticCurveTo(17, -4, 14, 0);
    ctx.quadraticCurveTo(17, 4, 25, 15);
    ctx.quadraticCurveTo(11, 17, -2, 6);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();

    // Fine trout tail spots
    ctx.fillStyle = '#1E2923';
    const spots = [
      [7, -5], [13, -8], [18, -10], [10, -1], [15, -3], [7, 5], [13, 8], [18, 10], [15, 3]
    ];
    for (const [sx, sy] of spots) {
      ctx.beginPath();
      ctx.arc(sx, sy, 1.25, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = '#1E2A24';
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.restore();
  }

  _drawIridescentStripeAndSpeckles(ctx, pts) {
    // Rosy iridescent pink lateral rainbow band along both flanks
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.beginPath();
      for (let i = 1; i < pts.length; i++) {
        const f = this._frame(pts, i);
        const px = f.x + f.nx * side * (f.r * 0.62);
        const py = f.y + f.ny * side * (f.r * 0.62);
        if (i === 1) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = 'rgba(244, 114, 182, 0.68)';
      ctx.lineWidth = 5.4;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.strokeStyle = 'rgba(251, 207, 232, 0.55)';
      ctx.lineWidth = 2.2;
      ctx.stroke();
      ctx.restore();
    }

    // Fine organic black speckles across olive-silver dorsum
    ctx.fillStyle = 'rgba(22, 34, 26, 0.78)';
    for (let i = 1; i < pts.length - 1; i++) {
      const f = this._frame(pts, i);
      const count = Math.max(3, Math.round(f.r * 0.42));
      for (let k = 0; k < count; k++) {
        const hash = Math.sin(i * 19.3 + k * 7.7);
        const lat = hash * f.r * 0.82;
        const lon = Math.cos(i * 11.1 + k * 5.3) * 4.2;
        const sx = f.x + f.nx * lat + f.tx * lon;
        const sy = f.y + f.ny * lat + f.ty * lon;
        const rad = 1.0 + (k % 3) * 0.35;
        ctx.beginPath();
        ctx.arc(sx, sy, rad, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  _drawEyesAndEmotes(ctx, headFrame) {
    const st = this._state;
    const t = this._time;

    ctx.save();
    ctx.translate(headFrame.x, headFrame.y);
    ctx.rotate(Math.atan2(headFrame.ty, headFrame.tx));

    const m = this._currPose.mouth;
    const chomp = st === 'hungry' ? (0.5 + 0.5 * Math.sin(t * 11)) * m : m;
    if (chomp > 0.14) {
      ctx.fillStyle = '#3F0E1B';
      ctx.beginPath();
      ctx.ellipse(15 + chomp * 3, 0, 3.8 + chomp * 3, 6 + chomp * 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = 'rgba(244, 114, 182, 0.44)';
    ctx.beginPath();
    ctx.ellipse(-3, -13, 4.6, 2.5, -0.18, 0, Math.PI * 2);
    ctx.ellipse(-3, 13, 4.6, 2.5, 0.18, 0, Math.PI * 2);
    ctx.fill();

    for (const side of [-1, 1]) {
      const ex = 4.2;
      const ey = side * 11.5;
      const r = st === 'shock' ? 7.4 : 6.2;

      ctx.save();
      ctx.translate(ex, ey);

      if (st === 'happy') {
        ctx.strokeStyle = '#1E2A24';
        ctx.lineWidth = 2.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, side, 4.3, side > 0 ? Math.PI * 1.15 : Math.PI * 0.15, side > 0 ? Math.PI * 1.85 : Math.PI * 0.85);
        ctx.stroke();
      } else if (st === 'stress') {
        ctx.strokeStyle = '#1E2A24';
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-3.2, -3.2 * side);
        ctx.lineTo(2.2, 0);
        ctx.lineTo(-3.2, 3.2 * side);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#1E2A24';
        ctx.lineWidth = 1.9;
        ctx.stroke();

        const irisR = st === 'shock' ? r * 0.42 : r * 0.72;
        const sx = st === 'fear' ? Math.sin(t * 58) * 1.0 : 0;
        const sy = st === 'fear' ? Math.cos(t * 64) * 1.0 : 0;
        const ig = ctx.createRadialGradient(1 + sx, -1 + sy, 0.6, sx, sy, irisR);
        ig.addColorStop(0, '#FEF08A');
        ig.addColorStop(0.55, '#F472B6');
        ig.addColorStop(1, '#831843');
        ctx.fillStyle = ig;
        ctx.beginPath();
        ctx.arc(1 + sx, sy, irisR, 0, Math.PI * 2);
        ctx.fill();

        const pr = st === 'shock' ? 1.7 : (st === 'fear' ? 2.1 : irisR * 0.55);
        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        ctx.arc(1.3 + sx, sy, pr, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(2.3, -1.8, 1.9, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-0.9, 1.7, 0.9, 0, Math.PI * 2);
        ctx.fill();

        if (st === 'hungry' || st === 'eating') {
          ctx.fillStyle = '#FEF08A';
          ctx.beginPath();
          for (let k = 0; k < 8; k++) {
            const a = (k * Math.PI) / 4;
            const rad = k % 2 === 0 ? 3.2 : 1.1;
            ctx.lineTo(1.2 + Math.cos(a) * rad, Math.sin(a) * rad);
          }
          ctx.closePath();
          ctx.fill();
        }

        if (st === 'relax') {
          ctx.fillStyle = '#6D8C73';
          ctx.beginPath();
          ctx.arc(0, 0, r + 0.4, Math.PI, Math.PI * 2);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#1E2A24';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(-r, 0);
          ctx.quadraticCurveTo(0, 1.6, r, 0);
          ctx.stroke();
        }

        if (st === 'sad' || st === 'fear') {
          ctx.fillStyle = 'rgba(125, 211, 252, 0.8)';
          ctx.beginPath();
          ctx.ellipse(-1.8, 2.5 * side, 3.0, 1.6, 0.2 * side, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    if (st === 'shock') {
      ctx.save();
      ctx.translate(16, -21);
      ctx.fillStyle = '#EF4444';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.roundRect(-2.5, -13, 5, 9, 2);
      ctx.stroke();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, 2.6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fill();
      ctx.restore();
    } else if (st === 'fear' || st === 'stress') {
      ctx.save();
      ctx.translate(-5, -21 + Math.sin(t * 10) * 1.8);
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
      ctx.translate(9, -21 + Math.sin(t * 8) * 1.8);
      ctx.fillStyle = '#FACC15';
      ctx.strokeStyle = '#B45309';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4;
        const rad = k % 2 === 0 ? 5.6 : 1.9;
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
    const bounceScale = 1 + Math.sin(this._time * 8.5) * this._currPose.bounce * 0.25;
    ctx.scale(this.scale * bounceScale, this.scale / Math.sqrt(Math.max(0.7, bounceScale)));

    const pts = this._buildSpine();
    const headFrame = this._frame(pts, 1);
    const pecFrame = this._frame(pts, 3);
    const tailFrame = this._frame(pts, pts.length - 1);

    // Shadow
    ctx.save();
    ctx.translate(0, 5);
    ctx.fillStyle = 'rgba(15, 28, 22, 0.2)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 43, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    this._drawPectoralFin(ctx, pecFrame, -1);
    this._drawPectoralFin(ctx, pecFrame, 1);
    this._drawSpottedForkedTail(ctx, tailFrame);

    const leftPts = [];
    const rightPts = [];
    for (let i = 0; i < pts.length; i++) {
      const f = this._frame(pts, i);
      leftPts.push({ x: f.x + f.nx * f.r, y: f.y + f.ny * f.r });
      rightPts.push({ x: f.x - f.nx * f.r, y: f.y - f.ny * f.r });
    }

    const traceBody = () => {
      const n = pts[0];
      const nf = this._frame(pts, 0);
      ctx.beginPath();
      ctx.moveTo(n.x + nf.tx * 12, n.y + nf.ty * 12);
      for (let i = 1; i < leftPts.length; i++) {
        const p0 = leftPts[i - 1];
        const p1 = leftPts[i];
        ctx.quadraticCurveTo(p0.x, p0.y, (p0.x + p1.x) * 0.5, (p0.y + p1.y) * 0.5);
      }
      ctx.lineTo(leftPts[leftPts.length - 1].x, leftPts[leftPts.length - 1].y);
      ctx.lineTo(rightPts[rightPts.length - 1].x, rightPts[rightPts.length - 1].y);
      for (let i = rightPts.length - 2; i >= 0; i--) {
        const p0 = rightPts[i + 1];
        const p1 = rightPts[i];
        ctx.quadraticCurveTo(p0.x, p0.y, (p0.x + p1.x) * 0.5, (p0.y + p1.y) * 0.5);
      }
      ctx.closePath();
    };

    ctx.save();
    traceBody();
    const bodyGrad = ctx.createLinearGradient(0, -21, 0, 21);
    bodyGrad.addColorStop(0, '#D1D5DB');
    bodyGrad.addColorStop(0.24, '#84A98C');
    bodyGrad.addColorStop(0.5, '#4A6B53');
    bodyGrad.addColorStop(0.76, '#84A98C');
    bodyGrad.addColorStop(1, '#D1D5DB');
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.clip();

    this._drawIridescentStripeAndSpeckles(ctx, pts);

    // Glossy jelly-bean chibi highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.36)';
    ctx.beginPath();
    ctx.ellipse(5, -3.5, 22, 5.0, -0.04, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    traceBody();
    ctx.strokeStyle = '#1E2A24';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Trout dorsal fin + tiny adipose nub
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pts[3].x, pts[3].y);
    ctx.quadraticCurveTo(pts[4].x, pts[4].y + Math.sin(this._phase - 1.8) * 3.4, pts[5].x, pts[5].y);
    ctx.strokeStyle = '#3B5642';
    ctx.lineWidth = 4.6;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Iconic salmonid adipose fin nub near tail
    ctx.fillStyle = '#4A6B53';
    ctx.strokeStyle = '#1E2A24';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(pts[7].x, pts[7].y, 4.2, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    this._drawEyesAndEmotes(ctx, headFrame);
    ctx.restore();
  }
}

export default Troutfish;
