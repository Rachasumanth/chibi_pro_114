/**
 * Red-Bellied Piranha (Pygocentrus nattereri) — Bespoke 2D Top-Down Expressive Chibi Asset
 * Dimensions: 75 x 44 | Native HTML5 Canvas 2D API | Zero external dependencies
 */

const VALID_STATES = new Set([
  'breathing', 'swimming', 'relax', 'left_turn', 'right_turn',
  'eating', 'hungry', 'stress', 'fear', 'shock', 'happy', 'sad'
]);

const ALIASES = { idle: 'breathing', hunger: 'hungry' };

const ONE_SHOT_DURATIONS = {
  left_turn: 0.45,
  right_turn: 0.45,
  eating: 0.55,
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
  breathing:  { freq: 2.8, amp: 0.08,  turn: 0,     finSpread: 1.0,  mouth: 0.22, jitter: 0,   droop: 0,    bounce: 0    },
  swimming:   { freq: 7.2, amp: 0.19,  turn: 0,     finSpread: 0.9,  mouth: 0.26, jitter: 0,   droop: 0,    bounce: 0    },
  relax:      { freq: 1.4, amp: 0.04,  turn: 0,     finSpread: 1.12, mouth: 0.08, jitter: 0,   droop: 0.1,  bounce: 0    },
  left_turn:  { freq: 5.0, amp: 0.12,  turn: -0.5,  finSpread: 1.15, mouth: 0.25, jitter: 0,   droop: 0,    bounce: 0    },
  right_turn: { freq: 5.0, amp: 0.12,  turn: 0.5,   finSpread: 1.15, mouth: 0.25, jitter: 0,   droop: 0,    bounce: 0    },
  eating:     { freq: 9.0, amp: 0.16,  turn: 0,     finSpread: 1.25, mouth: 1.0,  jitter: 0.8, droop: 0,    bounce: 0.14 },
  hungry:     { freq: 6.4, amp: 0.14,  turn: 0,     finSpread: 1.1,  mouth: 0.78, jitter: 0.4, droop: 0,    bounce: 0.08 },
  stress:     { freq: 10.5,amp: 0.1,   turn: 0,     finSpread: 0.75, mouth: 0.3,  jitter: 1.5, droop: 0.05, bounce: 0    },
  fear:       { freq: 13.0,amp: 0.13,  turn: 0,     finSpread: 0.58, mouth: 0.35, jitter: 2.5, droop: 0.2,  bounce: 0    },
  shock:      { freq: 14.0,amp: 0.05,  turn: 0,     finSpread: 1.35, mouth: 0.85, jitter: 3.0, droop: 0,    bounce: -0.1 },
  happy:      { freq: 6.8, amp: 0.18,  turn: 0,     finSpread: 1.22, mouth: 0.35, jitter: 0,   droop: -0.1, bounce: 0.18 },
  sad:        { freq: 1.6, amp: 0.04,  turn: 0,     finSpread: 0.7,  mouth: 0.05, jitter: 0,   droop: 0.32, bounce: 0    }
};

function lerp(a, b, t) { return a + (b - a) * t; }
function cubicBlend(t) {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

export class Piranhafish {
  static metadata = {
    name: 'Red-Bellied Piranha',
    category: 'fish',
    baseLength: 75,
    baseWidth: 44
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
    // 7-segment compact chunky bulldog-shaped chibi piranha spine
    const L = 75;
    const W = 44;
    const segs = 7;
    const widths = [0.62, 0.96, 1.00, 0.88, 0.66, 0.40, 0.22];
    const pts = [];
    const p = this._currPose;
    const jx = p.jitter > 0 ? Math.sin(this._time * 62) * p.jitter * 0.4 : 0;
    const jy = p.jitter > 0 ? Math.cos(this._time * 70) * p.jitter : 0;

    for (let i = 0; i < segs; i++) {
      const u = i / (segs - 1);
      const x = L * 0.36 - u * L * 0.72 + jx;
      const flex = Math.pow(u, 1.5);
      const wave = Math.sin(this._phase - u * 3.2) * (W * 0.42) * p.amp * 4.5 * flex;
      const turnCurve = p.turn * L * 0.28 * Math.pow(u, 1.45);
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

  _drawBulldogJawAndTeeth(ctx, noseFrame) {
    // Prominent bulldog underbite jaw with serrated white cartoon teeth!
    const p = this._currPose;
    const chompOsc = (this._state === 'eating' || this._state === 'hungry')
      ? Math.abs(Math.sin(this._time * (this._state === 'eating' ? 18 : 11)))
      : 0.35;
    const jawOut = 3.5 + p.mouth * 5.2 * chompOsc;

    ctx.save();
    ctx.translate(noseFrame.x, noseFrame.y);
    ctx.rotate(Math.atan2(noseFrame.ty, noseFrame.tx));

    // Fiery red-orange underbite chin protruding forward
    const chinGrad = ctx.createLinearGradient(0, 0, 14 + jawOut, 0);
    chinGrad.addColorStop(0, '#EA580C');
    chinGrad.addColorStop(1, '#DC2626');
    ctx.fillStyle = chinGrad;
    ctx.beginPath();
    ctx.moveTo(2, -13);
    ctx.bezierCurveTo(10 + jawOut, -14, 14 + jawOut, -7, 14 + jawOut, 0);
    ctx.bezierCurveTo(14 + jawOut, 7, 10 + jawOut, 14, 2, 13);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#1E1B24';
    ctx.lineWidth = 2.4;
    ctx.stroke();

    // Dark mouth cavity
    ctx.fillStyle = '#450A0A';
    ctx.beginPath();
    ctx.ellipse(7.5 + jawOut * 0.45, 0, 4.2 + jawOut * 0.35, 9.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Row of razor-sharp cartoon triangular white teeth curving along underbite!
    const toothCount = 5;
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#1E1B24';
    ctx.lineWidth = 1.4;
    for (let i = 0; i < toothCount; i++) {
      const frac = (i / (toothCount - 1)) * 2 - 1; // -1..1
      const ty = frac * 8.2;
      const tx = 10.5 + jawOut * 0.72 - Math.abs(frac) * 2.5;
      ctx.beginPath();
      ctx.moveTo(tx + 1.8, ty - 2.1);
      ctx.lineTo(tx - 3.6, ty);
      ctx.lineTo(tx + 1.8, ty + 2.1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  _drawPectoralFin(ctx, frame, side) {
    const p = this._currPose;
    const flap = Math.sin(this._phase * 1.1 + (side > 0 ? 0 : 0.7)) * 0.25;
    const angle = Math.atan2(frame.ty, frame.tx) + side * (Math.PI * 0.58 + flap + p.turn * side * 0.35);

    ctx.save();
    ctx.translate(frame.x + frame.nx * side * (frame.r * 0.8), frame.y + frame.ny * side * (frame.r * 0.8));
    ctx.rotate(angle);
    ctx.scale(0.85 + 0.2 * p.finSpread, 1);

    const g = ctx.createLinearGradient(0, 0, 16, 0);
    g.addColorStop(0, '#EA580C');
    g.addColorStop(1, 'rgba(251, 146, 60, 0.75)');
    ctx.beginPath();
    ctx.moveTo(0, -3.5 * side);
    ctx.quadraticCurveTo(10, -8 * side, 16, 1 * side);
    ctx.quadraticCurveTo(9, 8 * side, -2, 3.5 * side);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = '#1E1B24';
    ctx.lineWidth = 2.0;
    ctx.stroke();
    ctx.restore();
  }

  _drawForkedTail(ctx, tailFrame) {
    const wag = Math.sin(this._phase - 3.3) * 0.35 + this._currPose.turn * 0.55;
    ctx.save();
    ctx.translate(tailFrame.x, tailFrame.y);
    ctx.rotate(Math.atan2(-tailFrame.ty, -tailFrame.tx) + wag);

    const g = ctx.createLinearGradient(0, 0, 21, 0);
    g.addColorStop(0, '#475569');
    g.addColorStop(0.55, '#334155');
    g.addColorStop(1, '#0F172A');

    ctx.beginPath();
    ctx.moveTo(-2, -5);
    ctx.quadraticCurveTo(10, -15, 21, -13);
    ctx.quadraticCurveTo(14, -4, 11, 0);
    ctx.quadraticCurveTo(14, 4, 21, 13);
    ctx.quadraticCurveTo(10, 15, -2, 5);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();

    ctx.strokeStyle = 'rgba(226, 232, 240, 0.45)';
    ctx.lineWidth = 1;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(1, i * 1.4);
      ctx.lineTo(17, i * 4.6);
      ctx.stroke();
    }

    ctx.strokeStyle = '#1E1B24';
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

    // Rosy fiery blushes
    ctx.fillStyle = 'rgba(251, 113, 133, 0.45)';
    ctx.beginPath();
    ctx.ellipse(-3, -15, 4.8, 2.8, -0.2, 0, Math.PI * 2);
    ctx.ellipse(-3, 15, 4.8, 2.8, 0.2, 0, Math.PI * 2);
    ctx.fill();

    for (const side of [-1, 1]) {
      const ex = 4.5;
      const ey = side * 12.2;
      const r = st === 'shock' ? 7.6 : 6.4;

      ctx.save();
      ctx.translate(ex, ey);

      if (st === 'happy') {
        ctx.strokeStyle = '#1E1B24';
        ctx.lineWidth = 2.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, side, 4.5, side > 0 ? Math.PI * 1.15 : Math.PI * 0.15, side > 0 ? Math.PI * 1.85 : Math.PI * 0.85);
        ctx.stroke();
      } else if (st === 'stress') {
        ctx.strokeStyle = '#1E1B24';
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-3.2, -3.2 * side);
        ctx.lineTo(2.4, 0);
        ctx.lineTo(-3.2, 3.2 * side);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#1E1B24';
        ctx.lineWidth = 1.9;
        ctx.stroke();

        const irisR = st === 'shock' ? r * 0.42 : r * 0.72;
        const sx = st === 'fear' ? Math.sin(t * 58) * 1.0 : 0;
        const sy = st === 'fear' ? Math.cos(t * 64) * 1.0 : 0;
        // Fiery crimson-gold piranha iris
        const ig = ctx.createRadialGradient(1 + sx, -1 + sy, 0.6, sx, sy, irisR);
        ig.addColorStop(0, '#FDE047');
        ig.addColorStop(0.5, '#EF4444');
        ig.addColorStop(1, '#7F1D1D');
        ctx.fillStyle = ig;
        ctx.beginPath();
        ctx.arc(1 + sx, sy, irisR, 0, Math.PI * 2);
        ctx.fill();

        const pr = st === 'shock' ? 1.7 : (st === 'fear' ? 2.1 : irisR * 0.54);
        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        ctx.arc(1.3 + sx, sy, pr, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(2.4, -1.9, 2.0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-0.9, 1.8, 0.95, 0, Math.PI * 2);
        ctx.fill();

        // Cheeky fierce chibi brow when hungry/eating
        if (st === 'hungry' || st === 'eating') {
          ctx.strokeStyle = '#1E1B24';
          ctx.lineWidth = 2.2;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(-4, -5.5 * side);
          ctx.lineTo(4.5, -2.5 * side);
          ctx.stroke();

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
          ctx.fillStyle = '#64748B';
          ctx.beginPath();
          ctx.arc(0, 0, r + 0.4, Math.PI, Math.PI * 2);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#1E1B24';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(-r, 0);
          ctx.quadraticCurveTo(0, 1.6, r, 0);
          ctx.stroke();
        }

        if (st === 'sad' || st === 'fear') {
          ctx.fillStyle = 'rgba(125, 211, 252, 0.78)';
          ctx.beginPath();
          ctx.ellipse(-1.8, 2.6 * side, 3.0, 1.6, 0.2 * side, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    if (st === 'shock') {
      ctx.save();
      ctx.translate(15, -21);
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
      ctx.translate(-4, -22 + Math.sin(t * 10) * 1.8);
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
        const rad = k % 2 === 0 ? 5.5 : 1.9;
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
    ctx.translate(0, 5);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 28, 19, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Prominent bulldog jaw with cartoon teeth
    this._drawBulldogJawAndTeeth(ctx, noseFrame);
    this._drawPectoralFin(ctx, pecFrame, -1);
    this._drawPectoralFin(ctx, pecFrame, 1);
    this._drawForkedTail(ctx, tailFrame);

    // Plump compact body silhouette
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
      ctx.moveTo(n.x + nf.tx * 7, n.y + nf.ty * 7);
      for (let i = 0; i < leftPts.length; i++) {
        const p1 = leftPts[i];
        if (i === 0) ctx.quadraticCurveTo(n.x + nf.tx * 8 + nf.nx * 10, n.y + nf.ty * 8 + nf.ny * 10, p1.x, p1.y);
        else {
          const p0 = leftPts[i - 1];
          ctx.quadraticCurveTo(p0.x, p0.y, (p0.x + p1.x) * 0.5, (p0.y + p1.y) * 0.5);
        }
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
    // Silver-grey metallic back + fiery red-orange flanks peeking from below
    const bodyGrad = ctx.createLinearGradient(0, -24, 0, 24);
    bodyGrad.addColorStop(0, '#DC2626');
    bodyGrad.addColorStop(0.18, '#F97316');
    bodyGrad.addColorStop(0.32, '#94A3B8');
    bodyGrad.addColorStop(0.5, '#64748B');
    bodyGrad.addColorStop(0.68, '#94A3B8');
    bodyGrad.addColorStop(0.82, '#F97316');
    bodyGrad.addColorStop(1, '#DC2626');
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.clip();

    // Iridescent metallic silver flecks along flanks
    ctx.fillStyle = 'rgba(241, 245, 249, 0.55)';
    const flecks = [
      [10, -8], [4, -12], [-4, -10], [-11, -7], [8, 8], [2, 12], [-5, 10], [-12, 6], [0, -5], [-7, 2]
    ];
    for (const [fx, fy] of flecks) {
      ctx.beginPath();
      ctx.ellipse(fx, fy, 2.2, 1.2, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Glossy jelly-bean chibi dorsal highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
    ctx.beginPath();
    ctx.ellipse(3, -3.5, 14, 5.5, -0.05, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    traceBody();
    ctx.strokeStyle = '#1E1B24';
    ctx.lineWidth = 2.6;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Compact dusky dorsal fin + tiny adipose nub
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pts[2].x, pts[2].y);
    ctx.quadraticCurveTo(pts[3].x, pts[3].y + Math.sin(this._phase - 1.5) * 3.5, pts[4].x, pts[4].y);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    this._drawEyesAndEmotes(ctx, headFrame);
    ctx.restore();
  }
}

export default Piranhafish;
