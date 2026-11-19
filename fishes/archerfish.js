/**
 * Banded Archerfish (Toxotes jaculatrix) — Bespoke 2D Top-Down Expressive Chibi Asset
 * Dimensions: 78 x 36 | Native HTML5 Canvas 2D API | Zero external dependencies
 */

const VALID_STATES = new Set([
  'breathing', 'swimming', 'relax', 'left_turn', 'right_turn',
  'eating', 'hungry', 'stress', 'fear', 'shock', 'happy', 'sad'
]);

const ALIASES = { idle: 'breathing', hunger: 'hungry' };

const ONE_SHOT_DURATIONS = {
  left_turn: 0.46,
  right_turn: 0.46,
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
  breathing:  { freq: 2.6, amp: 0.068, turn: 0,     finSpread: 1.0,  mouth: 0.06, jitter: 0,   droop: 0,    bounce: 0    },
  swimming:   { freq: 6.8, amp: 0.175, turn: 0,     finSpread: 0.88, mouth: 0.08, jitter: 0,   droop: 0,    bounce: 0    },
  relax:      { freq: 1.2, amp: 0.036, turn: 0,     finSpread: 1.15, mouth: 0.03, jitter: 0,   droop: 0.1,  bounce: 0    },
  left_turn:  { freq: 4.8, amp: 0.11,  turn: -0.5,  finSpread: 1.14, mouth: 0.08, jitter: 0,   droop: 0,    bounce: 0    },
  right_turn: { freq: 4.8, amp: 0.11,  turn: 0.5,   finSpread: 1.14, mouth: 0.08, jitter: 0,   droop: 0,    bounce: 0    },
  eating:     { freq: 7.5, amp: 0.13,  turn: 0,     finSpread: 1.24, mouth: 0.96, jitter: 0,   droop: 0,    bounce: 0.14 },
  hungry:     { freq: 5.4, amp: 0.12,  turn: 0,     finSpread: 1.08, mouth: 0.65, jitter: 0,   droop: 0,    bounce: 0.08 },
  stress:     { freq: 10.2,amp: 0.095, turn: 0,     finSpread: 0.72, mouth: 0.12, jitter: 1.5, droop: 0.05, bounce: 0    },
  fear:       { freq: 13.0,amp: 0.12,  turn: 0,     finSpread: 0.56, mouth: 0.26, jitter: 2.4, droop: 0.2,  bounce: 0    },
  shock:      { freq: 14.2,amp: 0.04,  turn: 0,     finSpread: 1.35, mouth: 0.85, jitter: 2.9, droop: 0,    bounce: -0.1 },
  happy:      { freq: 6.8, amp: 0.17,  turn: 0,     finSpread: 1.24, mouth: 0.2,  jitter: 0,   droop: -0.1, bounce: 0.16 },
  sad:        { freq: 1.4, amp: 0.036, turn: 0,     finSpread: 0.68, mouth: 0.03, jitter: 0,   droop: 0.34, bounce: 0    }
};

function lerp(a, b, t) { return a + (b - a) * t; }
function cubicBlend(t) {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

export class Archerfish {
  static metadata = {
    name: 'Banded Archerfish',
    category: 'fish',
    baseLength: 78,
    baseWidth: 36
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
    // 8-segment sleek pointed-snout sharpshooter Banded Archerfish spine
    const L = 78;
    const W = 36;
    const segs = 8;
    const widths = [0.24, 0.72, 0.98, 1.00, 0.88, 0.66, 0.42, 0.24];
    const pts = [];
    const p = this._currPose;
    const jx = p.jitter > 0 ? Math.sin(this._time * 62) * p.jitter * 0.35 : 0;
    const jy = p.jitter > 0 ? Math.cos(this._time * 70) * p.jitter : 0;

    for (let i = 0; i < segs; i++) {
      const u = i / (segs - 1);
      const x = L * 0.40 - u * L * 0.76 + jx;
      const flex = Math.pow(u, 1.45);
      const wave = Math.sin(this._phase - u * 3.7) * (W * 0.48) * p.amp * 4.8 * flex;
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

  _drawSpittingMouth(ctx, noseFrame) {
    // Upturned sharpshooter spitting mouth + animated sparkling water jet droplet when eating/hungry!
    const st = this._state;
    const m = this._currPose.mouth;

    ctx.save();
    ctx.translate(noseFrame.x, noseFrame.y);
    ctx.rotate(Math.atan2(noseFrame.ty, noseFrame.tx));

    // Pointed silver-gold upturned jaw tip
    ctx.fillStyle = '#E2E8F0';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(4, -5.5);
    ctx.quadraticCurveTo(13, -4, 15, 0);
    ctx.quadraticCurveTo(13, 4, 4, 5.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Water-spit nozzle & flying droplet during eating / hungry!
    if (st === 'eating' || st === 'hungry') {
      const prog = (this._time * 3.8) % 1;
      const dropX = 16 + prog * 24;
      const dropAlpha = 1 - prog * 0.7;

      ctx.fillStyle = `rgba(56, 189, 248, ${dropAlpha})`;
      ctx.strokeStyle = `rgba(224, 242, 254, ${dropAlpha})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(dropX + 5, 0);
      ctx.quadraticCurveTo(dropX, -3.4, dropX - 4, 0);
      ctx.quadraticCurveTo(dropX, 3.4, dropX + 5, 0);
      ctx.fill();
      ctx.stroke();
    } else if (m > 0.25) {
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.arc(12, 0, 3.5 * m, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  _drawPectoralFin(ctx, frame, side) {
    const p = this._currPose;
    const flap = Math.sin(this._phase * 1.0 + (side > 0 ? 0 : 0.7)) * 0.25;
    const angle = Math.atan2(frame.ty, frame.tx) + side * (Math.PI * 0.56 + flap + p.turn * side * 0.35);

    ctx.save();
    ctx.translate(frame.x + frame.nx * side * (frame.r * 0.78), frame.y + frame.ny * side * (frame.r * 0.78));
    ctx.rotate(angle);
    ctx.scale(0.85 + 0.22 * p.finSpread, 1);

    const g = ctx.createLinearGradient(0, 0, 19, 0);
    g.addColorStop(0, 'rgba(226, 232, 240, 0.92)');
    g.addColorStop(1, 'rgba(254, 240, 138, 0.55)');

    ctx.beginPath();
    ctx.moveTo(0, -3.5 * side);
    ctx.quadraticCurveTo(11, -9 * side, 20, 1 * side);
    ctx.quadraticCurveTo(10, 8 * side, -2, 3.5 * side);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.restore();
  }

  _drawTailFin(ctx, tailFrame) {
    const wag = Math.sin(this._phase - 3.8) * 0.35 + this._currPose.turn * 0.52;
    ctx.save();
    ctx.translate(tailFrame.x, tailFrame.y);
    ctx.rotate(Math.atan2(-tailFrame.ty, -tailFrame.tx) + wag);

    const g = ctx.createLinearGradient(0, 0, 20, 0);
    g.addColorStop(0, '#CBD5E1');
    g.addColorStop(0.6, '#FEF08A');
    g.addColorStop(1, '#334155');

    ctx.beginPath();
    ctx.moveTo(-2, -5);
    ctx.quadraticCurveTo(9, -14, 20, -12);
    ctx.quadraticCurveTo(15, 0, 20, 12);
    ctx.quadraticCurveTo(9, 14, -2, 5);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.0;
    ctx.stroke();
    ctx.restore();
  }

  _drawBlackSaddleBars(ctx, pts) {
    // 5 bold glossy black dorsal saddle bars across bright silver-white archerfish back
    const bars = [
      { idx: 1, w: 4.5, span: 0.72 },
      { idx: 2, w: 6.2, span: 0.88 },
      { idx: 4, w: 6.4, span: 0.90 },
      { idx: 5, w: 5.5, span: 0.82 },
      { idx: 6, w: 4.6, span: 0.74 }
    ];
    for (const b of bars) {
      const f = this._frame(pts, b.idx);
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(Math.atan2(f.ty, f.tx));
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.ellipse(0, 0, b.w * 0.55, f.r * b.span, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  _drawForwardAimedEyesAndEmotes(ctx, headFrame) {
    // Large forward-aimed binocular sharpshooter chibi eyes!
    const st = this._state;
    const t = this._time;

    ctx.save();
    ctx.translate(headFrame.x, headFrame.y);
    ctx.rotate(Math.atan2(headFrame.ty, headFrame.tx));

    ctx.fillStyle = 'rgba(244, 114, 182, 0.36)';
    ctx.beginPath();
    ctx.ellipse(-3, -12, 4.0, 2.2, -0.18, 0, Math.PI * 2);
    ctx.ellipse(-3, 12, 4.0, 2.2, 0.18, 0, Math.PI * 2);
    ctx.fill();

    for (const side of [-1, 1]) {
      const ex = 5.2;
      const ey = side * 9.8;
      const r = st === 'shock' ? 7.2 : 6.2;

      ctx.save();
      ctx.translate(ex, ey);

      if (st === 'happy') {
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, side * 0.8, 4.2, side > 0 ? Math.PI * 1.15 : Math.PI * 0.15, side > 0 ? Math.PI * 1.85 : Math.PI * 0.85);
        ctx.stroke();
      } else if (st === 'stress') {
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 2.3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-2.8, -2.8 * side);
        ctx.lineTo(2.2, 0);
        ctx.lineTo(-2.8, 2.8 * side);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 1.9;
        ctx.stroke();

        // Forward-aimed pupils shifted toward +x snout!
        const irisR = st === 'shock' ? r * 0.42 : r * 0.72;
        const sx = st === 'fear' ? Math.sin(t * 58) * 1.0 : 0.8;
        const sy = st === 'fear' ? Math.cos(t * 64) * 1.0 : 0;
        const ig = ctx.createRadialGradient(1.4 + sx, -0.8 + sy, 0.6, sx, sy, irisR);
        ig.addColorStop(0, '#FEF08A');
        ig.addColorStop(0.55, '#EAB308');
        ig.addColorStop(1, '#713F12');
        ctx.fillStyle = ig;
        ctx.beginPath();
        ctx.arc(1.5 + sx, sy, irisR, 0, Math.PI * 2);
        ctx.fill();

        const pr = st === 'shock' ? 1.6 : (st === 'fear' ? 2.0 : irisR * 0.56);
        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.arc(1.9 + sx, sy, pr, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(2.8, -1.8, 1.9, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-0.5, 1.7, 0.9, 0, Math.PI * 2);
        ctx.fill();

        if (st === 'hungry' || st === 'eating') {
          ctx.fillStyle = '#FEF08A';
          ctx.beginPath();
          for (let k = 0; k < 8; k++) {
            const a = (k * Math.PI) / 4;
            const rad = k % 2 === 0 ? 3.2 : 1.1;
            ctx.lineTo(1.8 + Math.cos(a) * rad, Math.sin(a) * rad);
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
          ctx.strokeStyle = '#0F172A';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-r, 0);
          ctx.quadraticCurveTo(0, 1.5, r, 0);
          ctx.stroke();
        }

        if (st === 'sad' || st === 'fear') {
          ctx.fillStyle = 'rgba(125, 211, 252, 0.8)';
          ctx.beginPath();
          ctx.ellipse(-1.4, 2.4 * side, 2.8, 1.5, 0.2 * side, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    if (st === 'shock') {
      ctx.save();
      ctx.translate(15, -19);
      ctx.fillStyle = '#EF4444';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.7;
      ctx.beginPath();
      ctx.roundRect(-2.3, -12, 4.6, 8.5, 2);
      ctx.stroke();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, 2.4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fill();
      ctx.restore();
    } else if (st === 'fear' || st === 'stress') {
      ctx.save();
      ctx.translate(-4, -19 + Math.sin(t * 10) * 1.6);
      ctx.fillStyle = '#38BDF8';
      ctx.strokeStyle = '#0369A1';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, -5.5);
      ctx.bezierCurveTo(4.0, 0, 4.0, 4.6, 0, 4.6);
      ctx.bezierCurveTo(-4.0, 4.6, -4.0, 0, 0, -5.5);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (st === 'happy') {
      ctx.save();
      ctx.translate(8, -19 + Math.sin(t * 8) * 1.6);
      ctx.fillStyle = '#FACC15';
      ctx.strokeStyle = '#B45309';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4;
        const rad = k % 2 === 0 ? 5.2 : 1.8;
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
    const bounceScale = 1 + Math.sin(this._time * 9.0) * this._currPose.bounce * 0.25;
    ctx.scale(this.scale * bounceScale, this.scale / Math.sqrt(Math.max(0.7, bounceScale)));

    const pts = this._buildSpine();
    const noseFrame = this._frame(pts, 0);
    const headFrame = this._frame(pts, 1);
    const pecFrame = this._frame(pts, 2);
    const tailFrame = this._frame(pts, pts.length - 1);

    ctx.save();
    ctx.translate(0, 5);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.18)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 29, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    this._drawSpittingMouth(ctx, noseFrame);
    this._drawPectoralFin(ctx, pecFrame, -1);
    this._drawPectoralFin(ctx, pecFrame, 1);
    this._drawTailFin(ctx, tailFrame);

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
      ctx.moveTo(n.x + nf.tx * 8, n.y + nf.ty * 8);
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
    const bodyGrad = ctx.createLinearGradient(0, -18, 0, 18);
    bodyGrad.addColorStop(0, '#94A3B8');
    bodyGrad.addColorStop(0.24, '#F1F5F9');
    bodyGrad.addColorStop(0.5, '#FFFFFF');
    bodyGrad.addColorStop(0.76, '#F1F5F9');
    bodyGrad.addColorStop(1, '#94A3B8');
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.clip();

    this._drawBlackSaddleBars(ctx, pts);

    // Glossy jelly-bean chibi highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.ellipse(2, -3, 17, 4.0, -0.04, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    traceBody();
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.4;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Rear-shifted archerfish dorsal fin
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pts[4].x, pts[4].y);
    ctx.quadraticCurveTo(pts[5].x, pts[5].y + Math.sin(this._phase - 2.0) * 3.0, pts[6].x, pts[6].y);
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 4.4;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.strokeStyle = '#FEF08A';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();

    this._drawForwardAimedEyesAndEmotes(ctx, headFrame);
    ctx.restore();
  }
}

export default Archerfish;
