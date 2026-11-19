/**
 * Spawning Sockeye Salmon (Oncorhynchus nerka) — Bespoke 2D Top-Down Expressive Chibi Asset
 * Dimensions: 135 x 46 | Native HTML5 Canvas 2D API | Zero external dependencies
 */

const VALID_STATES = new Set([
  'breathing', 'swimming', 'relax', 'left_turn', 'right_turn',
  'eating', 'hungry', 'stress', 'fear', 'shock', 'happy', 'sad'
]);

const ALIASES = { idle: 'breathing', hunger: 'hungry' };

const ONE_SHOT_DURATIONS = {
  left_turn: 0.5,
  right_turn: 0.5,
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
  breathing:  { freq: 2.4, amp: 0.068, turn: 0,     finSpread: 1.0,  mouth: 0.08, jitter: 0,   droop: 0,    bounce: 0    },
  swimming:   { freq: 6.4, amp: 0.175, turn: 0,     finSpread: 0.88, mouth: 0.1,  jitter: 0,   droop: 0,    bounce: 0    },
  relax:      { freq: 1.2, amp: 0.036, turn: 0,     finSpread: 1.16, mouth: 0.04, jitter: 0,   droop: 0.12, bounce: 0    },
  left_turn:  { freq: 4.4, amp: 0.11,  turn: -0.5,  finSpread: 1.15, mouth: 0.08, jitter: 0,   droop: 0,    bounce: 0    },
  right_turn: { freq: 4.4, amp: 0.11,  turn: 0.5,   finSpread: 1.15, mouth: 0.08, jitter: 0,   droop: 0,    bounce: 0    },
  eating:     { freq: 7.4, amp: 0.14,  turn: 0,     finSpread: 1.24, mouth: 0.96, jitter: 0.3, droop: 0,    bounce: 0.12 },
  hungry:     { freq: 5.2, amp: 0.13,  turn: 0,     finSpread: 1.1,  mouth: 0.58, jitter: 0,   droop: 0,    bounce: 0.07 },
  stress:     { freq: 9.8, amp: 0.09,  turn: 0,     finSpread: 0.72, mouth: 0.14, jitter: 1.6, droop: 0.05, bounce: 0    },
  fear:       { freq: 12.6,amp: 0.12,  turn: 0,     finSpread: 0.56, mouth: 0.28, jitter: 2.6, droop: 0.2,  bounce: 0    },
  shock:      { freq: 14.0,amp: 0.04,  turn: 0,     finSpread: 1.35, mouth: 0.88, jitter: 3.1, droop: 0,    bounce: -0.1 },
  happy:      { freq: 6.6, amp: 0.17,  turn: 0,     finSpread: 1.22, mouth: 0.22, jitter: 0,   droop: -0.1, bounce: 0.16 },
  sad:        { freq: 1.4, amp: 0.036, turn: 0,     finSpread: 0.68, mouth: 0.04, jitter: 0,   droop: 0.32, bounce: 0    }
};

function lerp(a, b, t) { return a + (b - a) * t; }
function cubicBlend(t) {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

export class Salmonfish {
  static metadata = {
    name: 'Spawning Sockeye Salmon',
    category: 'fish',
    baseLength: 135,
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
    // 10-segment powerful spawning sockeye salmon with muscular shoulders
    const L = 135;
    const W = 46;
    const segs = 10;
    const widths = [0.32, 0.72, 0.96, 1.00, 0.94, 0.80, 0.64, 0.46, 0.30, 0.20];
    const pts = [];
    const p = this._currPose;
    const jx = p.jitter > 0 ? Math.sin(this._time * 60) * p.jitter * 0.4 : 0;
    const jy = p.jitter > 0 ? Math.cos(this._time * 68) * p.jitter : 0;

    for (let i = 0; i < segs; i++) {
      const u = i / (segs - 1);
      const x = L * 0.42 - u * L * 0.80 + jx;
      const flex = Math.pow(u, 1.45);
      const wave = Math.sin(this._phase - u * 3.9) * (W * 0.5) * p.amp * 4.8 * flex;
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

  _drawHookedKypeJaw(ctx, noseFrame) {
    // Distinctive hooked spawning kype jaw with pale emerald-white tip & small breeding teeth
    const p = this._currPose;
    const chomp = this._state === 'hungry' ? (0.5 + 0.5 * Math.sin(this._time * 11)) * p.mouth : p.mouth;
    const reach = 13 + chomp * 6;

    ctx.save();
    ctx.translate(noseFrame.x, noseFrame.y);
    ctx.rotate(Math.atan2(noseFrame.ty, noseFrame.tx));

    // Emerald-green elongated hooked kype snout
    const kypeGrad = ctx.createLinearGradient(0, 0, reach + 4, 0);
    kypeGrad.addColorStop(0, '#047857');
    kypeGrad.addColorStop(0.65, '#10B981');
    kypeGrad.addColorStop(1, '#A7F3D0');

    ctx.fillStyle = kypeGrad;
    ctx.beginPath();
    ctx.moveTo(0, -8.5);
    ctx.bezierCurveTo(reach * 0.65, -8, reach + 2, -4.5, reach + 4, 0.8);
    ctx.bezierCurveTo(reach + 1, 5.5, reach * 0.55, 8.5, 0, 8.5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#062C22';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Small curved white kype breeding teeth peeking from jaw edge
    if (chomp > 0.08) {
      ctx.fillStyle = '#3B0812';
      ctx.beginPath();
      ctx.ellipse(reach * 0.52, 0, 3.2 + chomp * 3.5, 5.5 + chomp * 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#FFFFFF';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(reach - 1, s * 3.8);
      ctx.lineTo(reach + 2.5, s * 2.2);
      ctx.lineTo(reach - 2.5, s * 1.4);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  _drawPectoralFin(ctx, frame, side) {
    const p = this._currPose;
    const flap = Math.sin(this._phase * 0.95 + (side > 0 ? 0 : 0.7)) * 0.24;
    const angle = Math.atan2(frame.ty, frame.tx) + side * (Math.PI * 0.58 + flap + p.turn * side * 0.35);

    ctx.save();
    ctx.translate(frame.x + frame.nx * side * (frame.r * 0.8), frame.y + frame.ny * side * (frame.r * 0.8));
    ctx.rotate(angle);
    ctx.scale(0.84 + 0.22 * p.finSpread, 1);

    const g = ctx.createLinearGradient(0, 0, 23, 0);
    g.addColorStop(0, '#065F46');
    g.addColorStop(0.6, '#10B981');
    g.addColorStop(1, 'rgba(52, 211, 153, 0.72)');

    ctx.beginPath();
    ctx.moveTo(0, -4 * side);
    ctx.bezierCurveTo(10, -10 * side, 21, -7 * side, 24, 1 * side);
    ctx.bezierCurveTo(18, 9 * side, 8, 9 * side, -2, 4 * side);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();

    ctx.strokeStyle = 'rgba(209, 250, 229, 0.48)';
    ctx.lineWidth = 1.1;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(2, i * 1.6 * side);
      ctx.lineTo(20 - Math.abs(i) * 1.5, i * 3.0 * side);
      ctx.stroke();
    }

    ctx.strokeStyle = '#062C22';
    ctx.lineWidth = 2.0;
    ctx.stroke();
    ctx.restore();
  }

  _drawForkedTail(ctx, tailFrame) {
    // Contrasting dark emerald-green forked sockeye tail
    const wag = Math.sin(this._phase - 4.0) * 0.34 + this._currPose.turn * 0.52;
    ctx.save();
    ctx.translate(tailFrame.x, tailFrame.y);
    ctx.rotate(Math.atan2(-tailFrame.ty, -tailFrame.tx) + wag);

    const g = ctx.createLinearGradient(0, 0, 28, 0);
    g.addColorStop(0, '#991B1B');
    g.addColorStop(0.32, '#065F46');
    g.addColorStop(1, '#047857');

    ctx.beginPath();
    ctx.moveTo(-2, -6.5);
    ctx.quadraticCurveTo(12, -19, 28, -17);
    ctx.quadraticCurveTo(18, -4.5, 14, 0);
    ctx.quadraticCurveTo(18, 4.5, 28, 17);
    ctx.quadraticCurveTo(12, 19, -2, 6.5);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();

    ctx.strokeStyle = 'rgba(167, 243, 208, 0.42)';
    ctx.lineWidth = 1.15;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(2, i * 1.5);
      ctx.lineTo(24 - Math.abs(i) * 1.0, i * 4.8);
      ctx.stroke();
    }

    ctx.strokeStyle = '#062C22';
    ctx.lineWidth = 2.3;
    ctx.stroke();
    ctx.restore();
  }

  _drawEyesAndEmotes(ctx, headFrame) {
    const st = this._state;
    const t = this._time;

    ctx.save();
    ctx.translate(headFrame.x, headFrame.y);
    ctx.rotate(Math.atan2(headFrame.ty, headFrame.tx));

    // Cute rosy blushes on emerald cheeks
    ctx.fillStyle = 'rgba(251, 113, 133, 0.42)';
    ctx.beginPath();
    ctx.ellipse(-4, -14.5, 4.8, 2.7, -0.18, 0, Math.PI * 2);
    ctx.ellipse(-4, 14.5, 4.8, 2.7, 0.18, 0, Math.PI * 2);
    ctx.fill();

    for (const side of [-1, 1]) {
      const ex = 4.2;
      const ey = side * 12.2;
      const r = st === 'shock' ? 7.6 : 6.4;

      ctx.save();
      ctx.translate(ex, ey);

      if (st === 'happy') {
        ctx.strokeStyle = '#062C22';
        ctx.lineWidth = 2.7;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, side, 4.5, side > 0 ? Math.PI * 1.15 : Math.PI * 0.15, side > 0 ? Math.PI * 1.85 : Math.PI * 0.85);
        ctx.stroke();
      } else if (st === 'stress') {
        ctx.strokeStyle = '#062C22';
        ctx.lineWidth = 2.5;
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
        ctx.strokeStyle = '#062C22';
        ctx.lineWidth = 1.9;
        ctx.stroke();

        const irisR = st === 'shock' ? r * 0.42 : r * 0.72;
        const sx = st === 'fear' ? Math.sin(t * 58) * 1.0 : 0;
        const sy = st === 'fear' ? Math.cos(t * 64) * 1.0 : 0;
        const ig = ctx.createRadialGradient(1 + sx, -1 + sy, 0.6, sx, sy, irisR);
        ig.addColorStop(0, '#FEF08A');
        ig.addColorStop(0.55, '#F59E0B');
        ig.addColorStop(1, '#78350F');
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
        ctx.arc(2.3, -1.8, 2.0, 0, Math.PI * 2);
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
          ctx.fillStyle = '#059669';
          ctx.beginPath();
          ctx.arc(0, 0, r + 0.4, Math.PI, Math.PI * 2);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#062C22';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(-r, 0);
          ctx.quadraticCurveTo(0, 1.6, r, 0);
          ctx.stroke();
        }

        if (st === 'sad' || st === 'fear') {
          ctx.fillStyle = 'rgba(125, 211, 252, 0.8)';
          ctx.beginPath();
          ctx.ellipse(-1.8, 2.6 * side, 3.0, 1.6, 0.2 * side, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    if (st === 'shock') {
      ctx.save();
      ctx.translate(18, -22);
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
      ctx.translate(-5, -22 + Math.sin(t * 10) * 1.8);
      ctx.fillStyle = '#38BDF8';
      ctx.strokeStyle = '#0369A1';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(0, -6.2);
      ctx.bezierCurveTo(4.5, 0, 4.5, 5.2, 0, 5.2);
      ctx.bezierCurveTo(-4.5, 5.2, -4.5, 0, 0, -6.2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (st === 'happy') {
      ctx.save();
      ctx.translate(10, -22 + Math.sin(t * 8) * 1.8);
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
    const bounceScale = 1 + Math.sin(this._time * 8.5) * this._currPose.bounce * 0.25;
    ctx.scale(this.scale * bounceScale, this.scale / Math.sqrt(Math.max(0.7, bounceScale)));

    const pts = this._buildSpine();
    const noseFrame = this._frame(pts, 0);
    const headFrame = this._frame(pts, 1);
    const neckFrame = this._frame(pts, 2);
    const pecFrame = this._frame(pts, 3);
    const tailFrame = this._frame(pts, pts.length - 1);

    // Shadow
    ctx.save();
    ctx.translate(0, 6);
    ctx.fillStyle = 'rgba(20, 12, 16, 0.22)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 52, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    this._drawHookedKypeJaw(ctx, noseFrame);
    this._drawPectoralFin(ctx, pecFrame, -1);
    this._drawPectoralFin(ctx, pecFrame, 1);
    this._drawForkedTail(ctx, tailFrame);

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

    // Vivid crimson-red spawning sockeye torso!
    const bodyGrad = ctx.createLinearGradient(0, -24, 0, 24);
    bodyGrad.addColorStop(0, '#991B1B');
    bodyGrad.addColorStop(0.25, '#EF4444');
    bodyGrad.addColorStop(0.5, '#DC2626');
    bodyGrad.addColorStop(0.75, '#EF4444');
    bodyGrad.addColorStop(1, '#991B1B');
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.clip();

    // Sharply contrasting emerald-green spawning head & operculum collar!
    ctx.save();
    ctx.translate(neckFrame.x, neckFrame.y);
    ctx.rotate(Math.atan2(neckFrame.ty, neckFrame.tx));
    const headGrad = ctx.createRadialGradient(14, -4, 4, 10, 0, 34);
    headGrad.addColorStop(0, '#34D399');
    headGrad.addColorStop(0.55, '#059669');
    headGrad.addColorStop(1, '#064E3B');
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.moveTo(45, -30);
    ctx.lineTo(45, 30);
    ctx.lineTo(-4, 30);
    ctx.quadraticCurveTo(-14, 0, -4, -30);
    ctx.closePath();
    ctx.fill();

    // Crisp gill plate seam
    ctx.strokeStyle = 'rgba(6, 44, 34, 0.72)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-4, -26);
    ctx.quadraticCurveTo(-14, 0, -4, 26);
    ctx.stroke();
    ctx.restore();

    // Subtle dark spawning dorsal sheen & glossy jelly-bean highlight
    ctx.fillStyle = 'rgba(255, 235, 235, 0.36)';
    ctx.beginPath();
    ctx.ellipse(-6, -4, 28, 5.5, -0.04, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    traceBody();
    ctx.strokeStyle = '#062C22';
    ctx.lineWidth = 2.6;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Crimson dorsal fin + adipose nub
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pts[3].x, pts[3].y);
    ctx.quadraticCurveTo(pts[4].x, pts[4].y + Math.sin(this._phase - 1.8) * 3.8, pts[6].x, pts[6].y);
    ctx.strokeStyle = '#991B1B';
    ctx.lineWidth = 5.4;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.strokeStyle = '#FCA5A5';
    ctx.lineWidth = 2.0;
    ctx.stroke();

    ctx.fillStyle = '#B91C1C';
    ctx.strokeStyle = '#062C22';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(pts[8].x, pts[8].y, 4.5, 2.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    this._drawEyesAndEmotes(ctx, headFrame);
    ctx.restore();
  }
}

export default Salmonfish;
