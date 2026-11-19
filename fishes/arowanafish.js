/**
 * Silver Arowana (Osteoglossum bicirrhosum) — Bespoke 2D Top-Down Expressive Chibi Asset
 * Dimensions: 175 x 46 | Native HTML5 Canvas 2D API | Zero external dependencies
 */

const VALID_STATES = new Set([
  'breathing', 'swimming', 'relax', 'left_turn', 'right_turn',
  'eating', 'hungry', 'stress', 'fear', 'shock', 'happy', 'sad'
]);

const ALIASES = { idle: 'breathing', hunger: 'hungry' };

const ONE_SHOT_DURATIONS = {
  left_turn: 0.52,
  right_turn: 0.52,
  eating: 0.62,
  shock: 0.75
};

const BLOCKED_IN_SHOCK = new Set([
  'left_turn', 'right_turn', 'relax', 'happy', 'eating',
  'breathing', 'swimming', 'hungry', 'sad'
]);

const BLOCKED_IN_FEAR = new Set([
  'left_turn', 'right_turn', 'relax', 'happy', 'eating'
]);

const POSE_TARGETS = {
  breathing:  { freq: 2.2, amp: 0.065, turn: 0,     finSpread: 1.0,  mouth: 0.05, jitter: 0,   droop: 0,    bounce: 0    },
  swimming:   { freq: 5.4, amp: 0.175, turn: 0,     finSpread: 0.88, mouth: 0.06, jitter: 0,   droop: 0,    bounce: 0    },
  relax:      { freq: 1.1, amp: 0.04,  turn: 0,     finSpread: 1.18, mouth: 0.02, jitter: 0,   droop: 0.1,  bounce: 0    },
  left_turn:  { freq: 3.8, amp: 0.11,  turn: -0.52, finSpread: 1.15, mouth: 0.07, jitter: 0,   droop: 0,    bounce: 0    },
  right_turn: { freq: 3.8, amp: 0.11,  turn: 0.52,  finSpread: 1.15, mouth: 0.07, jitter: 0,   droop: 0,    bounce: 0    },
  eating:     { freq: 6.2, amp: 0.13,  turn: 0,     finSpread: 1.2,  mouth: 0.95, jitter: 0,   droop: 0,    bounce: 0.09 },
  hungry:     { freq: 4.5, amp: 0.12,  turn: 0,     finSpread: 1.06, mouth: 0.48, jitter: 0,   droop: 0,    bounce: 0.05 },
  stress:     { freq: 9.2, amp: 0.09,  turn: 0,     finSpread: 0.75, mouth: 0.1,  jitter: 1.5, droop: 0.05, bounce: 0    },
  fear:       { freq: 11.8,amp: 0.12,  turn: 0,     finSpread: 0.6,  mouth: 0.25, jitter: 2.6, droop: 0.18, bounce: 0    },
  shock:      { freq: 13.5,amp: 0.04,  turn: 0,     finSpread: 1.35, mouth: 0.82, jitter: 3.2, droop: 0,    bounce: -0.1 },
  happy:      { freq: 6.0, amp: 0.17,  turn: 0,     finSpread: 1.22, mouth: 0.18, jitter: 0,   droop: -0.1, bounce: 0.15 },
  sad:        { freq: 1.3, amp: 0.04,  turn: 0,     finSpread: 0.7,  mouth: 0.03, jitter: 0,   droop: 0.32, bounce: 0    }
};

function lerp(a, b, t) { return a + (b - a) * t; }
function cubicBlend(t) {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

export class Arowanafish {
  static metadata = {
    name: 'Silver Arowana',
    category: 'fish',
    baseLength: 175,
    baseWidth: 46
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
    // 12-segment sleek silver ribbon dragon-fish spine
    const L = 175;
    const W = 46;
    const segs = 12;
    const widths = [0.30, 0.72, 0.98, 1.00, 0.94, 0.84, 0.72, 0.60, 0.48, 0.36, 0.25, 0.15];
    const pts = [];
    const p = this._currPose;
    const jx = p.jitter > 0 ? Math.sin(this._time * 58) * p.jitter * 0.4 : 0;
    const jy = p.jitter > 0 ? Math.cos(this._time * 66) * p.jitter : 0;

    for (let i = 0; i < segs; i++) {
      const u = i / (segs - 1);
      const x = L * 0.45 - u * L * 0.86 + jx;
      const flex = Math.pow(u, 1.35);
      const wave = Math.sin(this._phase - u * 4.6) * (W * 0.65) * p.amp * 5.0 * flex;
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

  _drawLongPectoralWing(ctx, frame, side) {
    // Signature sweeping wing-like dragon pectoral fins of Silver Arowana
    const p = this._currPose;
    const flap = Math.sin(this._phase * 0.95 + (side > 0 ? 0 : 0.6)) * 0.24;
    const spread = (0.8 + 0.25 * p.finSpread) * (1 - p.droop * 0.3);
    const angle = Math.atan2(frame.ty, frame.tx) + side * (Math.PI * 0.60 + flap + p.turn * side * 0.32);

    ctx.save();
    ctx.translate(frame.x + frame.nx * side * (frame.r * 0.75), frame.y + frame.ny * side * (frame.r * 0.75));
    ctx.rotate(angle);
    ctx.scale(spread, 1);

    const g = ctx.createLinearGradient(0, 0, 42, 0);
    g.addColorStop(0, 'rgba(203, 213, 225, 0.92)');
    g.addColorStop(0.55, 'rgba(186, 230, 253, 0.78)');
    g.addColorStop(1, 'rgba(244, 180, 212, 0.58)');

    ctx.beginPath();
    ctx.moveTo(0, -4 * side);
    ctx.bezierCurveTo(14, -12 * side, 34, -8 * side, 44, 4 * side);
    ctx.bezierCurveTo(30, 12 * side, 12, 9 * side, -2, 5 * side);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.lineWidth = 1.1;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(2, (-2 + i * 1.4) * side);
      ctx.quadraticCurveTo(20, (-5 + i * 2.8) * side, 39 - i * 3, (1 + i * 2.2) * side);
      ctx.stroke();
    }

    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2.0;
    ctx.stroke();
    ctx.restore();
  }

  _drawRibbonTail(ctx, tailFrame) {
    // Flowing iridescent teardrop ribbon tail
    const wag = Math.sin(this._phase - 4.8) * 0.34 + this._currPose.turn * 0.5;
    ctx.save();
    ctx.translate(tailFrame.x, tailFrame.y);
    ctx.rotate(Math.atan2(-tailFrame.ty, -tailFrame.tx) + wag);

    const g = ctx.createLinearGradient(0, 0, 32, 0);
    g.addColorStop(0, 'rgba(148, 163, 184, 0.95)');
    g.addColorStop(0.5, 'rgba(186, 230, 253, 0.82)');
    g.addColorStop(1, 'rgba(249, 168, 212, 0.65)');

    ctx.beginPath();
    ctx.moveTo(-2, -6);
    ctx.bezierCurveTo(10, -17, 26, -15, 32, 0);
    ctx.bezierCurveTo(26, 15, 10, 17, -2, 6);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.68)';
    ctx.lineWidth = 1.1;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(1, i * 1.3);
      ctx.lineTo(28 - Math.abs(i) * 2.5, i * 3.8);
      ctx.stroke();
    }

    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.restore();
  }

  _drawCrescentScales(ctx, pts) {
    // Huge iridescent metallic-silver crescent scales with pearl-aqua & pink shimmer
    const shimmerShift = Math.sin(this._time * 2.8) * 0.5 + 0.5;
    for (let i = 3; i < pts.length - 1; i++) {
      const f = this._frame(pts, i);
      const rad = 7.2 - pts[i].u * 2.6;
      const offsets = [-rad * 1.15, 0, rad * 1.15];

      for (let j = 0; j < offsets.length; j++) {
        const off = offsets[j];
        if (Math.abs(off) > f.r * 0.78) continue;
        const stagger = j === 1 ? 0 : 4.2;
        const sx = f.x + f.nx * off - f.tx * stagger;
        const sy = f.y + f.ny * off - f.ty * stagger;

        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(Math.atan2(f.ty, f.tx));

        // Pearl crescent shimmer arc
        ctx.strokeStyle = (i + j) % 2 === 0
          ? `rgba(125, 211, 252, ${0.45 + shimmerShift * 0.35})`
          : `rgba(244, 165, 210, ${0.38 + (1 - shimmerShift) * 0.32})`;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.arc(0, 0, rad, Math.PI * 0.58, Math.PI * 1.42);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(51, 65, 85, 0.35)';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.arc(-1.2, 0, rad * 0.94, Math.PI * 0.62, Math.PI * 1.38);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  _drawUpturnedJawAndBarbels(ctx, noseFrame) {
    // Signature upturned lower jaw + twin sweeping chin barbels of Silver Arowana
    const p = this._currPose;
    const wiggle = Math.sin(this._time * 6.5) * 0.22;

    ctx.save();
    ctx.translate(noseFrame.x, noseFrame.y);
    ctx.rotate(Math.atan2(noseFrame.ty, noseFrame.tx));

    // Twin forward-curving chin barbels
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(14, side * 4.5);
      ctx.bezierCurveTo(
        22, side * (8 + wiggle * 4),
        28, side * (13 + wiggle * 7),
        31, side * (10 + wiggle * 9)
      );
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 3.2;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.strokeStyle = '#F8FAFC';
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }

    // Upturned silver drawbridge jaw
    const m = p.mouth;
    const chomp = this._state === 'hungry' ? (0.5 + 0.5 * Math.sin(this._time * 12)) * m : m;
    if (chomp > 0.12) {
      ctx.fillStyle = '#312E81';
      ctx.beginPath();
      ctx.ellipse(15 + chomp * 3, 0, 5 + chomp * 4, 8 + chomp * 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#F9A8D4';
      ctx.beginPath();
      ctx.ellipse(14 + chomp * 2, 0, 2.5 + chomp * 2, 4.5 + chomp * 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Upturned lip rim highlight
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(11, 0, 7.5, -0.85, 0.85);
    ctx.stroke();

    ctx.restore();
  }

  _drawEyesAndEmotes(ctx, headFrame) {
    const st = this._state;
    const t = this._time;

    ctx.save();
    ctx.translate(headFrame.x, headFrame.y);
    ctx.rotate(Math.atan2(headFrame.ty, headFrame.tx));

    // Rosy cheek blushes
    ctx.fillStyle = 'rgba(244, 114, 182, 0.34)';
    ctx.beginPath();
    ctx.ellipse(-5, -14.5, 5.5, 3.0, -0.15, 0, Math.PI * 2);
    ctx.ellipse(-5, 14.5, 5.5, 3.0, 0.15, 0, Math.PI * 2);
    ctx.fill();

    for (const side of [-1, 1]) {
      const ex = 4.5;
      const ey = side * 13.5;
      const r = st === 'shock' ? 8.2 : 6.9;

      ctx.save();
      ctx.translate(ex, ey);

      if (st === 'happy') {
        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 2.8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, side, 5.0, side > 0 ? Math.PI * 1.15 : Math.PI * 0.15, side > 0 ? Math.PI * 1.85 : Math.PI * 0.85);
        ctx.stroke();
      } else if (st === 'stress') {
        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 2.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-3.5, -3.5 * side);
        ctx.lineTo(2.5, 0);
        ctx.lineTo(-3.5, 3.5 * side);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 2.0;
        ctx.stroke();

        const irisR = st === 'shock' ? r * 0.42 : r * 0.72;
        const sx = st === 'fear' ? Math.sin(t * 54) * 1.0 : 0;
        const sy = st === 'fear' ? Math.cos(t * 60) * 1.0 : 0;
        const ig = ctx.createRadialGradient(1 + sx, -1 + sy, 0.8, sx, sy, irisR);
        ig.addColorStop(0, '#E0F2FE');
        ig.addColorStop(0.55, '#38BDF8');
        ig.addColorStop(1, '#1E3A8A');
        ctx.fillStyle = ig;
        ctx.beginPath();
        ctx.arc(1 + sx, sy, irisR, 0, Math.PI * 2);
        ctx.fill();

        const pr = st === 'shock' ? 1.8 : (st === 'fear' ? 2.2 : irisR * 0.55);
        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        ctx.arc(1.3 + sx, sy, pr, 0, Math.PI * 2);
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
            const rad = k % 2 === 0 ? 3.6 : 1.2;
            ctx.lineTo(1.2 + Math.cos(a) * rad, Math.sin(a) * rad);
          }
          ctx.closePath();
          ctx.fill();
        }

        if (st === 'relax') {
          ctx.fillStyle = '#CBD5E1';
          ctx.beginPath();
          ctx.arc(0, 0, r + 0.4, Math.PI, Math.PI * 2);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#1E293B';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(-r, 0);
          ctx.quadraticCurveTo(0, 1.8, r, 0);
          ctx.stroke();
        }

        if (st === 'sad' || st === 'fear') {
          ctx.fillStyle = 'rgba(125, 211, 252, 0.78)';
          ctx.beginPath();
          ctx.ellipse(-2, 3.0 * side, 3.4, 1.8, 0.2 * side, 0, Math.PI * 2);
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
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-3, -15, 6, 11, 2.5);
      ctx.stroke();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fill();
      ctx.restore();
    } else if (st === 'fear' || st === 'stress') {
      ctx.save();
      ctx.translate(-6, -24 + Math.sin(t * 10) * 2);
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
      ctx.translate(10, -24 + Math.sin(t * 8) * 2);
      ctx.fillStyle = '#FACC15';
      ctx.strokeStyle = '#B45309';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4;
        const rad = k % 2 === 0 ? 6.5 : 2.2;
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
    const noseFrame = this._frame(pts, 0);
    const headFrame = this._frame(pts, 1);
    const pecFrame = this._frame(pts, 3);
    const tailFrame = this._frame(pts, pts.length - 1);

    // Shadow
    ctx.save();
    ctx.translate(0, 6);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.2)';
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const f = this._frame(pts, i);
      if (i === 0) ctx.moveTo(f.x + f.nx * f.r, f.y + f.ny * f.r);
      else ctx.lineTo(f.x + f.nx * f.r, f.y + f.ny * f.r);
    }
    for (let i = pts.length - 1; i >= 0; i--) {
      const f = this._frame(pts, i);
      ctx.lineTo(f.x - f.nx * f.r, f.y - f.ny * f.r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Fins & barbels
    this._drawUpturnedJawAndBarbels(ctx, noseFrame);
    this._drawLongPectoralWing(ctx, pecFrame, -1);
    this._drawLongPectoralWing(ctx, pecFrame, 1);
    this._drawRibbonTail(ctx, tailFrame);

    // Sleek metallic ribbon body
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
      ctx.moveTo(n.x + nf.tx * 15, n.y + nf.ty * 15);
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
    const bodyGrad = ctx.createLinearGradient(0, -24, 0, 24);
    bodyGrad.addColorStop(0, '#64748B');
    bodyGrad.addColorStop(0.22, '#CBD5E1');
    bodyGrad.addColorStop(0.48, '#F8FAFC');
    bodyGrad.addColorStop(0.75, '#BAE6FD');
    bodyGrad.addColorStop(1, '#475569');
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.clip();

    this._drawCrescentScales(ctx, pts);

    // Iridescent dorsal jelly-bean specular highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.lineWidth = 6.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[1].x + 2, pts[1].y - 3);
    ctx.quadraticCurveTo(pts[4].x, pts[4].y - 4, pts[8].x, pts[8].y - 2);
    ctx.stroke();

    ctx.restore();

    traceBody();
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2.6;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Long flowing translucent silver-aqua dorsal fin ribbon along rear 65%
    ctx.save();
    ctx.beginPath();
    for (let i = 4; i < pts.length; i++) {
      const wave = Math.sin(this._phase - i * 0.75) * 4.8;
      if (i === 4) ctx.moveTo(pts[i].x, pts[i].y);
      else ctx.lineTo(pts[i].x, pts[i].y + wave);
    }
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.85)';
    ctx.lineWidth = 5.5;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.strokeStyle = 'rgba(224, 242, 254, 0.9)';
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.restore();

    this._drawEyesAndEmotes(ctx, headFrame);
    ctx.restore();
  }
}

export default Arowanafish;
