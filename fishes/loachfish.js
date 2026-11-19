/**
 * Clown Loach (Chromobotia macracanthus) — Bespoke 2D Top-Down Expressive Chibi Asset
 * Dimensions: 72 x 30 | Native HTML5 Canvas 2D API | Zero external dependencies
 */

const VALID_STATES = new Set([
  'breathing', 'swimming', 'relax', 'left_turn', 'right_turn',
  'eating', 'hungry', 'stress', 'fear', 'shock', 'happy', 'sad'
]);

const ALIASES = { idle: 'breathing', hunger: 'hungry' };

const ONE_SHOT_DURATIONS = {
  left_turn: 0.45,
  right_turn: 0.45,
  eating: 0.56,
  shock: 0.7
};

const BLOCKED_IN_SHOCK = new Set([
  'left_turn', 'right_turn', 'relax', 'happy', 'eating',
  'breathing', 'swimming', 'hungry', 'sad'
]);

const BLOCKED_IN_FEAR = new Set([
  'left_turn', 'right_turn', 'relax', 'happy', 'eating'
]);

const POSE_TARGETS = {
  breathing:  { freq: 2.8, amp: 0.075, turn: 0,     finSpread: 1.0,  mouth: 0.06, jitter: 0,   droop: 0,    bounce: 0    },
  swimming:   { freq: 7.4, amp: 0.19,  turn: 0,     finSpread: 0.9,  mouth: 0.08, jitter: 0,   droop: 0,    bounce: 0    },
  relax:      { freq: 1.3, amp: 0.04,  turn: 0,     finSpread: 1.16, mouth: 0.03, jitter: 0,   droop: 0.12, bounce: 0    },
  left_turn:  { freq: 5.0, amp: 0.12,  turn: -0.52, finSpread: 1.15, mouth: 0.08, jitter: 0,   droop: 0,    bounce: 0    },
  right_turn: { freq: 5.0, amp: 0.12,  turn: 0.52,  finSpread: 1.15, mouth: 0.08, jitter: 0,   droop: 0,    bounce: 0    },
  eating:     { freq: 8.0, amp: 0.15,  turn: 0,     finSpread: 1.24, mouth: 0.9,  jitter: 0,   droop: 0,    bounce: 0.14 },
  hungry:     { freq: 6.0, amp: 0.14,  turn: 0,     finSpread: 1.1,  mouth: 0.55, jitter: 0,   droop: 0,    bounce: 0.08 },
  stress:     { freq: 10.6,amp: 0.1,   turn: 0,     finSpread: 0.72, mouth: 0.12, jitter: 1.4, droop: 0.05, bounce: 0    },
  fear:       { freq: 13.4,amp: 0.13,  turn: 0,     finSpread: 0.56, mouth: 0.25, jitter: 2.4, droop: 0.2,  bounce: 0    },
  shock:      { freq: 14.5,amp: 0.04,  turn: 0,     finSpread: 1.35, mouth: 0.85, jitter: 2.8, droop: 0,    bounce: -0.1 },
  happy:      { freq: 7.2, amp: 0.18,  turn: 0,     finSpread: 1.24, mouth: 0.2,  jitter: 0,   droop: -0.1, bounce: 0.18 },
  sad:        { freq: 1.5, amp: 0.04,  turn: 0,     finSpread: 0.68, mouth: 0.03, jitter: 0,   droop: 0.34, bounce: 0    }
};

function lerp(a, b, t) { return a + (b - a) * t; }
function cubicBlend(t) {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

export class Loachfish {
  static metadata = {
    name: 'Clown Loach',
    category: 'fish',
    baseLength: 72,
    baseWidth: 30
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
    // 8-segment adorable tapered torpedo Clown Loach
    const L = 72;
    const W = 30;
    const segs = 8;
    const widths = [0.28, 0.72, 0.98, 1.00, 0.88, 0.68, 0.45, 0.26];
    const pts = [];
    const p = this._currPose;
    const jx = p.jitter > 0 ? Math.sin(this._time * 64) * p.jitter * 0.35 : 0;
    const jy = p.jitter > 0 ? Math.cos(this._time * 72) * p.jitter : 0;

    for (let i = 0; i < segs; i++) {
      const u = i / (segs - 1);
      const x = L * 0.40 - u * L * 0.76 + jx;
      const flex = Math.pow(u, 1.45);
      const wave = Math.sin(this._phase - u * 3.8) * (W * 0.5) * p.amp * 4.8 * flex;
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

  _drawWhiskeredSnout(ctx, noseFrame) {
    // Cute whiskered loach snout with 4 pairs of sensory barbels!
    const wig = Math.sin(this._time * 9.5) * 2.2;
    ctx.save();
    ctx.translate(noseFrame.x, noseFrame.y);
    ctx.rotate(Math.atan2(noseFrame.ty, noseFrame.tx));

    for (const side of [-1, 1]) {
      // Longer outer whisker
      ctx.beginPath();
      ctx.moveTo(6, side * 3.5);
      ctx.quadraticCurveTo(12, side * (6 + wig * 0.5), 16, side * (8.5 + wig * 0.7));
      ctx.strokeStyle = '#18181B';
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.strokeStyle = '#FDBA74';
      ctx.lineWidth = 1.1;
      ctx.stroke();

      // Shorter inner whisker
      ctx.beginPath();
      ctx.moveTo(8, side * 1.8);
      ctx.quadraticCurveTo(12, side * (3.2 - wig * 0.4), 15, side * (4.0 - wig * 0.5));
      ctx.strokeStyle = '#18181B';
      ctx.lineWidth = 2.0;
      ctx.stroke();
      ctx.strokeStyle = '#FDBA74';
      ctx.lineWidth = 0.9;
      ctx.stroke();
    }

    ctx.restore();
  }

  _drawVibrantRedFin(ctx, frame, side) {
    const p = this._currPose;
    const flap = Math.sin(this._phase * 1.1 + (side > 0 ? 0 : 0.7)) * 0.28;
    const angle = Math.atan2(frame.ty, frame.tx) + side * (Math.PI * 0.58 + flap + p.turn * side * 0.35);

    ctx.save();
    ctx.translate(frame.x + frame.nx * side * (frame.r * 0.78), frame.y + frame.ny * side * (frame.r * 0.78));
    ctx.rotate(angle);
    ctx.scale(0.85 + 0.22 * p.finSpread, 1);

    const g = ctx.createLinearGradient(0, 0, 16, 0);
    g.addColorStop(0, '#EA580C');
    g.addColorStop(0.55, '#EF4444');
    g.addColorStop(1, '#FB7185');

    ctx.beginPath();
    ctx.moveTo(0, -3 * side);
    ctx.quadraticCurveTo(9, -8 * side, 16, 1 * side);
    ctx.quadraticCurveTo(9, 7 * side, -2, 3 * side);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = '#18181B';
    ctx.lineWidth = 1.9;
    ctx.stroke();
    ctx.restore();
  }

  _drawRedForkedTail(ctx, tailFrame) {
    // Vibrant red-orange deeply forked Clown Loach tail
    const wag = Math.sin(this._phase - 3.9) * 0.36 + this._currPose.turn * 0.55;
    ctx.save();
    ctx.translate(tailFrame.x, tailFrame.y);
    ctx.rotate(Math.atan2(-tailFrame.ty, -tailFrame.tx) + wag);

    const g = ctx.createLinearGradient(0, 0, 21, 0);
    g.addColorStop(0, '#DC2626');
    g.addColorStop(0.55, '#F97316');
    g.addColorStop(1, '#EF4444');

    ctx.beginPath();
    ctx.moveTo(-2, -4.5);
    ctx.quadraticCurveTo(10, -14, 21, -12.5);
    ctx.quadraticCurveTo(12, -3.5, 9, 0);
    ctx.quadraticCurveTo(12, 3.5, 21, 12.5);
    ctx.quadraticCurveTo(10, 14, -2, 4.5);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 237, 213, 0.5)';
    ctx.lineWidth = 1;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(1, i * 1.2);
      ctx.lineTo(17, i * 4.2);
      ctx.stroke();
    }

    ctx.strokeStyle = '#18181B';
    ctx.lineWidth = 2.1;
    ctx.stroke();
    ctx.restore();
  }

  _drawThreeBlackSaddleWedges(ctx, pts) {
    // Signature 3 bold velvety-black Clown Loach saddle wedges (eye band, mid-body, tail peduncle)
    const wedgeIndices = [
      { idx: 1, w: 6.2 },
      { idx: 3, w: 9.2 },
      { idx: 6, w: 8.6 }
    ];

    for (const w of wedgeIndices) {
      const f = this._frame(pts, w.idx);
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(Math.atan2(f.ty, f.tx));

      ctx.fillStyle = '#18181B';
      ctx.beginPath();
      ctx.moveTo(w.w * 0.55, -f.r * 1.15);
      ctx.quadraticCurveTo(w.w * 0.15, 0, w.w * 0.55, f.r * 1.15);
      ctx.lineTo(-w.w * 0.55, f.r * 1.15);
      ctx.quadraticCurveTo(-w.w * 0.85, 0, -w.w * 0.55, -f.r * 1.15);
      ctx.closePath();
      ctx.fill();

      // Subtle glossy indigo rim inside black wedge
      ctx.fillStyle = 'rgba(148, 163, 184, 0.16)';
      ctx.beginPath();
      ctx.ellipse(0, -f.r * 0.35, w.w * 0.25, f.r * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  _drawEyesAndEmotes(ctx, headFrame) {
    const st = this._state;
    const t = this._time;

    ctx.save();
    ctx.translate(headFrame.x, headFrame.y);
    ctx.rotate(Math.atan2(headFrame.ty, headFrame.tx));

    ctx.fillStyle = 'rgba(251, 113, 133, 0.45)';
    ctx.beginPath();
    ctx.ellipse(-2.5, -10.5, 3.6, 2.0, -0.15, 0, Math.PI * 2);
    ctx.ellipse(-2.5, 10.5, 3.6, 2.0, 0.15, 0, Math.PI * 2);
    ctx.fill();

    for (const side of [-1, 1]) {
      const ex = 2.5;
      const ey = side * 8.6;
      const r = st === 'shock' ? 6.2 : 5.2;

      ctx.save();
      ctx.translate(ex, ey);

      if (st === 'happy') {
        ctx.strokeStyle = '#FFF7ED';
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, side * 0.8, 3.6, side > 0 ? Math.PI * 1.15 : Math.PI * 0.15, side > 0 ? Math.PI * 1.85 : Math.PI * 0.85);
        ctx.stroke();
      } else if (st === 'stress') {
        ctx.strokeStyle = '#FFF7ED';
        ctx.lineWidth = 2.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-2.6, -2.6 * side);
        ctx.lineTo(2.0, 0);
        ctx.lineTo(-2.6, 2.6 * side);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#18181B';
        ctx.lineWidth = 1.7;
        ctx.stroke();

        const irisR = st === 'shock' ? r * 0.42 : r * 0.72;
        const sx = st === 'fear' ? Math.sin(t * 60) * 0.9 : 0;
        const sy = st === 'fear' ? Math.cos(t * 66) * 0.9 : 0;
        const ig = ctx.createRadialGradient(0.8 + sx, -0.8 + sy, 0.5, sx, sy, irisR);
        ig.addColorStop(0, '#FEF08A');
        ig.addColorStop(0.55, '#F97316');
        ig.addColorStop(1, '#7C2D12');
        ctx.fillStyle = ig;
        ctx.beginPath();
        ctx.arc(0.9 + sx, sy, irisR, 0, Math.PI * 2);
        ctx.fill();

        const pr = st === 'shock' ? 1.4 : (st === 'fear' ? 1.8 : irisR * 0.55);
        ctx.fillStyle = '#09090B';
        ctx.beginPath();
        ctx.arc(1.1 + sx, sy, pr, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(1.9, -1.5, 1.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-0.8, 1.4, 0.8, 0, Math.PI * 2);
        ctx.fill();

        if (st === 'hungry' || st === 'eating') {
          ctx.fillStyle = '#FEF08A';
          ctx.beginPath();
          for (let k = 0; k < 8; k++) {
            const a = (k * Math.PI) / 4;
            const rad = k % 2 === 0 ? 2.8 : 1.0;
            ctx.lineTo(1.0 + Math.cos(a) * rad, Math.sin(a) * rad);
          }
          ctx.closePath();
          ctx.fill();
        }

        if (st === 'relax') {
          ctx.fillStyle = '#FB923C';
          ctx.beginPath();
          ctx.arc(0, 0, r + 0.3, Math.PI, Math.PI * 2);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#18181B';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(-r, 0);
          ctx.quadraticCurveTo(0, 1.4, r, 0);
          ctx.stroke();
        }

        if (st === 'sad' || st === 'fear') {
          ctx.fillStyle = 'rgba(125, 211, 252, 0.82)';
          ctx.beginPath();
          ctx.ellipse(-1.4, 2.2 * side, 2.5, 1.3, 0.2 * side, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    if (st === 'shock') {
      ctx.save();
      ctx.translate(12, -17);
      ctx.fillStyle = '#EF4444';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.roundRect(-2.2, -11, 4.4, 8, 1.8);
      ctx.stroke();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fill();
      ctx.restore();
    } else if (st === 'fear' || st === 'stress') {
      ctx.save();
      ctx.translate(-3, -17 + Math.sin(t * 10) * 1.5);
      ctx.fillStyle = '#38BDF8';
      ctx.strokeStyle = '#0369A1';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, -5.2);
      ctx.bezierCurveTo(3.8, 0, 3.8, 4.4, 0, 4.4);
      ctx.bezierCurveTo(-3.8, 4.4, -3.8, 0, 0, -5.2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (st === 'happy') {
      ctx.save();
      ctx.translate(7, -17 + Math.sin(t * 8) * 1.5);
      ctx.fillStyle = '#FACC15';
      ctx.strokeStyle = '#B45309';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4;
        const rad = k % 2 === 0 ? 4.8 : 1.6;
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
    const bounceScale = 1 + Math.sin(this._time * 9.5) * this._currPose.bounce * 0.25;
    ctx.scale(this.scale * bounceScale, this.scale / Math.sqrt(Math.max(0.7, bounceScale)));

    const pts = this._buildSpine();
    const noseFrame = this._frame(pts, 0);
    const headFrame = this._frame(pts, 1);
    const pecFrame = this._frame(pts, 2);
    const tailFrame = this._frame(pts, pts.length - 1);

    // Shadow
    ctx.save();
    ctx.translate(0, 4.5);
    ctx.fillStyle = 'rgba(24, 16, 12, 0.2)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 27, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    this._drawWhiskeredSnout(ctx, noseFrame);
    this._drawVibrantRedFin(ctx, pecFrame, -1);
    this._drawVibrantRedFin(ctx, pecFrame, 1);
    this._drawRedForkedTail(ctx, tailFrame);

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
      ctx.moveTo(n.x + nf.tx * 9, n.y + nf.ty * 9);
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
    const bodyGrad = ctx.createLinearGradient(0, -16, 0, 16);
    bodyGrad.addColorStop(0, '#EA580C');
    bodyGrad.addColorStop(0.28, '#FB923C');
    bodyGrad.addColorStop(0.5, '#FDBA74');
    bodyGrad.addColorStop(0.72, '#FB923C');
    bodyGrad.addColorStop(1, '#EA580C');
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.clip();

    this._drawThreeBlackSaddleWedges(ctx, pts);

    // Glossy jelly-bean chibi highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.36)';
    ctx.beginPath();
    ctx.ellipse(2, -2.8, 15, 3.6, -0.04, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    traceBody();
    ctx.strokeStyle = '#18181B';
    ctx.lineWidth = 2.3;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Cute dorsal fin (black base with orange tip)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pts[3].x, pts[3].y);
    ctx.quadraticCurveTo(pts[4].x, pts[4].y + Math.sin(this._phase - 1.6) * 2.8, pts[5].x, pts[5].y);
    ctx.strokeStyle = '#18181B';
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.strokeStyle = '#FB923C';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.restore();

    this._drawEyesAndEmotes(ctx, headFrame);
    ctx.restore();
  }
}

export default Loachfish;
