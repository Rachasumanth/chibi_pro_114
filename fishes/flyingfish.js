/**
 * Atlantic Flying Fish (Cheilopogon melanurus) — Bespoke 2D Top-Down Expressive Chibi Asset
 * Dimensions: 90 x 88 | Native HTML5 Canvas 2D API | Zero external dependencies
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
  breathing:  { freq: 2.5, amp: 0.065, turn: 0,     wingSpread: 0.88, mouth: 0.06, jitter: 0,   droop: 0,    bounce: 0    },
  swimming:   { freq: 6.8, amp: 0.175, turn: 0,     wingSpread: 1.08, mouth: 0.08, jitter: 0,   droop: 0,    bounce: 0    },
  relax:      { freq: 1.2, amp: 0.035, turn: 0,     wingSpread: 1.0,  mouth: 0.03, jitter: 0,   droop: 0.1,  bounce: 0    },
  left_turn:  { freq: 4.8, amp: 0.12,  turn: -0.5,  wingSpread: 1.05, mouth: 0.08, jitter: 0,   droop: 0,    bounce: 0    },
  right_turn: { freq: 4.8, amp: 0.12,  turn: 0.5,   wingSpread: 1.05, mouth: 0.08, jitter: 0,   droop: 0,    bounce: 0    },
  eating:     { freq: 7.4, amp: 0.14,  turn: 0,     wingSpread: 1.15, mouth: 0.92, jitter: 0,   droop: 0,    bounce: 0.12 },
  hungry:     { freq: 5.4, amp: 0.13,  turn: 0,     wingSpread: 1.02, mouth: 0.55, jitter: 0,   droop: 0,    bounce: 0.06 },
  stress:     { freq: 10.2,amp: 0.095, turn: 0,     wingSpread: 0.72, mouth: 0.12, jitter: 1.5, droop: 0.05, bounce: 0    },
  fear:       { freq: 13.0,amp: 0.12,  turn: 0,     wingSpread: 0.58, mouth: 0.25, jitter: 2.5, droop: 0.2,  bounce: 0    },
  shock:      { freq: 14.2,amp: 0.04,  turn: 0,     wingSpread: 1.26, mouth: 0.85, jitter: 3.0, droop: 0,    bounce: -0.1 },
  happy:      { freq: 6.8, amp: 0.17,  turn: 0,     wingSpread: 1.18, mouth: 0.2,  jitter: 0,   droop: -0.1, bounce: 0.18 },
  sad:        { freq: 1.4, amp: 0.035, turn: 0,     wingSpread: 0.65, mouth: 0.03, jitter: 0,   droop: 0.34, bounce: 0    }
};

function lerp(a, b, t) { return a + (b - a) * t; }
function cubicBlend(t) {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

export class Flyingfish {
  static metadata = {
    name: 'Atlantic Flying Fish',
    category: 'fish',
    baseLength: 90,
    baseWidth: 88
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
    // 8-segment sleek aerodynamic cobalt-silver torpedo spine
    const L = 90;
    const bodyW = 26;
    const segs = 8;
    const widths = [0.32, 0.84, 1.00, 0.96, 0.82, 0.62, 0.40, 0.24];
    const pts = [];
    const p = this._currPose;
    const jx = p.jitter > 0 ? Math.sin(this._time * 62) * p.jitter * 0.35 : 0;
    const jy = p.jitter > 0 ? Math.cos(this._time * 70) * p.jitter : 0;

    for (let i = 0; i < segs; i++) {
      const u = i / (segs - 1);
      const x = L * 0.40 - u * L * 0.78 + jx;
      const flex = Math.pow(u, 1.48);
      const wave = Math.sin(this._phase - u * 3.8) * (bodyW * 0.48) * p.amp * 4.5 * flex;
      const turnCurve = p.turn * L * 0.26 * Math.pow(u, 1.5);
      pts.push({ x, y: wave + turnCurve + jy, r: widths[i] * (bodyW * 0.5), u });
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

  _drawGliderPectoralWing(ctx, frame, side) {
    // ENORMOUS translucent iridescent-blue veined glider wing pectoral fins!
    const p = this._currPose;
    const shimmer = Math.sin(this._phase * 0.9 + (side > 0 ? 0 : 0.4)) * 0.12;
    const spread = p.wingSpread * (1 - p.droop * 0.32);
    const angle = Math.atan2(frame.ty, frame.tx) + side * (Math.PI * 0.52 + shimmer + p.turn * side * 0.25);

    ctx.save();
    ctx.translate(frame.x + frame.nx * side * (frame.r * 0.72), frame.y + frame.ny * side * (frame.r * 0.72));
    ctx.rotate(angle);
    ctx.scale(spread, 1);

    const wingGrad = ctx.createLinearGradient(0, 0, 44, -6 * side);
    wingGrad.addColorStop(0, 'rgba(37, 99, 235, 0.88)');
    wingGrad.addColorStop(0.45, 'rgba(56, 189, 248, 0.68)');
    wingGrad.addColorStop(0.8, 'rgba(186, 230, 253, 0.56)');
    wingGrad.addColorStop(1, 'rgba(240, 249, 255, 0.45)');

    ctx.beginPath();
    ctx.moveTo(0, -4 * side);
    ctx.bezierCurveTo(16, -15 * side, 36, -12 * side, 46, -1 * side);
    ctx.bezierCurveTo(42, 13 * side, 22, 18 * side, -3, 8 * side);
    ctx.closePath();
    ctx.fillStyle = wingGrad;
    ctx.fill();

    // Crisp translucent aerodynamic wing veins!
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.68)';
    ctx.lineWidth = 1.15;
    for (let r = 0; r < 7; r++) {
      const f = r / 6;
      const startY = (-3 + f * 9) * side;
      const endX = 43 - f * 12;
      const endY = (-7 + f * 20) * side;
      ctx.beginPath();
      ctx.moveTo(2, startY);
      ctx.quadraticCurveTo(endX * 0.55, (startY + endY) * 0.5 - 3 * side, endX, endY);
      ctx.stroke();
    }

    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.9;
    ctx.stroke();
    ctx.restore();
  }

  _drawSecondaryPelvicWing(ctx, frame, side) {
    // Smaller rear stabilizer wing-like pelvic fins (four-wing flying fish!)
    const angle = Math.atan2(frame.ty, frame.tx) + side * (Math.PI * 0.60 + Math.sin(this._phase - 1.2) * 0.14);
    ctx.save();
    ctx.translate(frame.x + frame.nx * side * (frame.r * 0.7), frame.y + frame.ny * side * (frame.r * 0.7));
    ctx.rotate(angle);

    const g = ctx.createLinearGradient(0, 0, 20, 0);
    g.addColorStop(0, 'rgba(56, 189, 248, 0.75)');
    g.addColorStop(1, 'rgba(224, 242, 254, 0.48)');

    ctx.beginPath();
    ctx.moveTo(0, -3 * side);
    ctx.quadraticCurveTo(11, -8 * side, 20, 1 * side);
    ctx.quadraticCurveTo(10, 9 * side, -2, 4 * side);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 0.9;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(2, i * 1.6 * side);
      ctx.lineTo(17, i * 3.5 * side);
      ctx.stroke();
    }

    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();
  }

  _drawDeeplyForkedTail(ctx, tailFrame) {
    const wag = Math.sin(this._phase - 3.9) * 0.36 + this._currPose.turn * 0.55;
    ctx.save();
    ctx.translate(tailFrame.x, tailFrame.y);
    ctx.rotate(Math.atan2(-tailFrame.ty, -tailFrame.tx) + wag);

    const g = ctx.createLinearGradient(0, 0, 24, 0);
    g.addColorStop(0, '#1D4ED8');
    g.addColorStop(0.6, '#38BDF8');
    g.addColorStop(1, 'rgba(186, 230, 253, 0.75)');

    // Asymmetric deeply forked flying fish tail (slightly longer lower/right lobe!)
    ctx.beginPath();
    ctx.moveTo(-2, -4);
    ctx.quadraticCurveTo(11, -15, 23, -13);
    ctx.quadraticCurveTo(13, -3, 10, 0);
    ctx.quadraticCurveTo(14, 3.5, 26, 15.5);
    ctx.quadraticCurveTo(11, 15, -2, 4);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.0;
    ctx.stroke();
    ctx.restore();
  }

  _drawEyesAndEmotes(ctx, headFrame) {
    const st = this._state;
    const t = this._time;

    ctx.save();
    ctx.translate(headFrame.x, headFrame.y);
    ctx.rotate(Math.atan2(headFrame.ty, headFrame.tx));

    ctx.fillStyle = 'rgba(244, 114, 182, 0.38)';
    ctx.beginPath();
    ctx.ellipse(-2.5, -10.5, 3.8, 2.0, -0.15, 0, Math.PI * 2);
    ctx.ellipse(-2.5, 10.5, 3.8, 2.0, 0.15, 0, Math.PI * 2);
    ctx.fill();

    for (const side of [-1, 1]) {
      const ex = 3.5;
      const ey = side * 9.0;
      const r = st === 'shock' ? 6.8 : 5.7;

      ctx.save();
      ctx.translate(ex, ey);

      if (st === 'happy') {
        ctx.strokeStyle = '#F8FAFC';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, side * 0.8, 3.9, side > 0 ? Math.PI * 1.15 : Math.PI * 0.15, side > 0 ? Math.PI * 1.85 : Math.PI * 0.85);
        ctx.stroke();
      } else if (st === 'stress') {
        ctx.strokeStyle = '#F8FAFC';
        ctx.lineWidth = 2.3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-2.8, -2.8 * side);
        ctx.lineTo(2.0, 0);
        ctx.lineTo(-2.8, 2.8 * side);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        const irisR = st === 'shock' ? r * 0.42 : r * 0.72;
        const sx = st === 'fear' ? Math.sin(t * 58) * 0.9 : 0;
        const sy = st === 'fear' ? Math.cos(t * 64) * 0.9 : 0;
        const ig = ctx.createRadialGradient(0.9 + sx, -0.9 + sy, 0.5, sx, sy, irisR);
        ig.addColorStop(0, '#E0F2FE');
        ig.addColorStop(0.55, '#0284C7');
        ig.addColorStop(1, '#1E3A8A');
        ctx.fillStyle = ig;
        ctx.beginPath();
        ctx.arc(1.0 + sx, sy, irisR, 0, Math.PI * 2);
        ctx.fill();

        const pr = st === 'shock' ? 1.5 : (st === 'fear' ? 1.9 : irisR * 0.54);
        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.arc(1.2 + sx, sy, pr, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(2.1, -1.6, 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-0.8, 1.5, 0.85, 0, Math.PI * 2);
        ctx.fill();

        if (st === 'hungry' || st === 'eating') {
          ctx.fillStyle = '#FEF08A';
          ctx.beginPath();
          for (let k = 0; k < 8; k++) {
            const a = (k * Math.PI) / 4;
            const rad = k % 2 === 0 ? 3.0 : 1.0;
            ctx.lineTo(1.1 + Math.cos(a) * rad, Math.sin(a) * rad);
          }
          ctx.closePath();
          ctx.fill();
        }

        if (st === 'relax') {
          ctx.fillStyle = '#2563EB';
          ctx.beginPath();
          ctx.arc(0, 0, r + 0.3, Math.PI, Math.PI * 2);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#F8FAFC';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(-r, 0);
          ctx.quadraticCurveTo(0, 1.4, r, 0);
          ctx.stroke();
        }

        if (st === 'sad' || st === 'fear') {
          ctx.fillStyle = 'rgba(125, 211, 252, 0.85)';
          ctx.beginPath();
          ctx.ellipse(-1.5, 2.3 * side, 2.6, 1.4, 0.2 * side, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    if (st === 'shock') {
      ctx.save();
      ctx.translate(14, -18);
      ctx.fillStyle = '#EF4444';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.7;
      ctx.beginPath();
      ctx.roundRect(-2.3, -11.5, 4.6, 8, 1.8);
      ctx.stroke();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, 2.3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fill();
      ctx.restore();
    } else if (st === 'fear' || st === 'stress') {
      ctx.save();
      ctx.translate(-3, -18 + Math.sin(t * 10) * 1.6);
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
      ctx.translate(8, -18 + Math.sin(t * 8) * 1.6);
      ctx.fillStyle = '#FACC15';
      ctx.strokeStyle = '#B45309';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4;
        const rad = k % 2 === 0 ? 5.0 : 1.7;
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
    const headFrame = this._frame(pts, 1);
    const pecFrame = this._frame(pts, 2);
    const pelvFrame = this._frame(pts, 5);
    const tailFrame = this._frame(pts, pts.length - 1);

    // Shadow
    ctx.save();
    ctx.translate(0, 6);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.18)';
    ctx.beginPath();
    ctx.ellipse(2, 0, 32, 34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Enormous glider wings + secondary pelvic wings + forked tail
    this._drawGliderPectoralWing(ctx, pecFrame, -1);
    this._drawGliderPectoralWing(ctx, pecFrame, 1);
    this._drawSecondaryPelvicWing(ctx, pelvFrame, -1);
    this._drawSecondaryPelvicWing(ctx, pelvFrame, 1);
    this._drawDeeplyForkedTail(ctx, tailFrame);

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
    // Sleek cobalt-blue to gleaming silver torpedo gradient!
    const bodyGrad = ctx.createLinearGradient(0, -14, 0, 14);
    bodyGrad.addColorStop(0, '#E2E8F0');
    bodyGrad.addColorStop(0.24, '#38BDF8');
    bodyGrad.addColorStop(0.5, '#1D4ED8');
    bodyGrad.addColorStop(0.76, '#38BDF8');
    bodyGrad.addColorStop(1, '#E2E8F0');
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.clip();

    // Glossy jelly-bean chibi dorsal highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.44)';
    ctx.beginPath();
    ctx.ellipse(4, -2.5, 19, 3.6, -0.04, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    traceBody();
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.2;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Sleek rear dorsal fin
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pts[4].x, pts[4].y);
    ctx.quadraticCurveTo(pts[5].x, pts[5].y + Math.sin(this._phase - 2.0) * 2.5, pts[6].x, pts[6].y);
    ctx.strokeStyle = '#1E40AF';
    ctx.lineWidth = 3.8;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();

    this._drawEyesAndEmotes(ctx, headFrame);
    ctx.restore();
  }
}

export default Flyingfish;
