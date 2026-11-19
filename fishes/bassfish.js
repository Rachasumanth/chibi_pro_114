/**
 * Largemouth Bass (Micropterus salmoides) — Bespoke 2D Top-Down Expressive Chibi Asset
 * Dimensions: 115 x 48 | Native HTML5 Canvas 2D API | Zero external dependencies
 */

const VALID_STATES = new Set([
  'breathing', 'swimming', 'relax', 'left_turn', 'right_turn',
  'eating', 'hungry', 'stress', 'fear', 'shock', 'happy', 'sad'
]);

const ALIASES = { idle: 'breathing', hunger: 'hungry' };

const ONE_SHOT_DURATIONS = {
  left_turn: 0.5,
  right_turn: 0.5,
  eating: 0.62,
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
  breathing:  { freq: 2.3, amp: 0.065, turn: 0,     finSpread: 1.0,  mouth: 0.1,  jitter: 0,   droop: 0,    bounce: 0    },
  swimming:   { freq: 6.0, amp: 0.165, turn: 0,     finSpread: 0.88, mouth: 0.12, jitter: 0,   droop: 0,    bounce: 0    },
  relax:      { freq: 1.2, amp: 0.035, turn: 0,     finSpread: 1.15, mouth: 0.04, jitter: 0,   droop: 0.12, bounce: 0    },
  left_turn:  { freq: 4.2, amp: 0.11,  turn: -0.48, finSpread: 1.14, mouth: 0.1,  jitter: 0,   droop: 0,    bounce: 0    },
  right_turn: { freq: 4.2, amp: 0.11,  turn: 0.48,  finSpread: 1.14, mouth: 0.1,  jitter: 0,   droop: 0,    bounce: 0    },
  eating:     { freq: 7.2, amp: 0.14,  turn: 0,     finSpread: 1.25, mouth: 1.0,  jitter: 0.4, droop: 0,    bounce: 0.12 },
  hungry:     { freq: 5.0, amp: 0.13,  turn: 0,     finSpread: 1.08, mouth: 0.62, jitter: 0,   droop: 0,    bounce: 0.06 },
  stress:     { freq: 9.5, amp: 0.09,  turn: 0,     finSpread: 0.74, mouth: 0.15, jitter: 1.5, droop: 0.05, bounce: 0    },
  fear:       { freq: 12.2,amp: 0.12,  turn: 0,     finSpread: 0.58, mouth: 0.3,  jitter: 2.6, droop: 0.2,  bounce: 0    },
  shock:      { freq: 13.8,amp: 0.04,  turn: 0,     finSpread: 1.36, mouth: 0.92, jitter: 3.1, droop: 0,    bounce: -0.1 },
  happy:      { freq: 6.4, amp: 0.16,  turn: 0,     finSpread: 1.22, mouth: 0.24, jitter: 0,   droop: -0.1, bounce: 0.16 },
  sad:        { freq: 1.4, amp: 0.035, turn: 0,     finSpread: 0.7,  mouth: 0.04, jitter: 0,   droop: 0.32, bounce: 0    }
};

function lerp(a, b, t) { return a + (b - a) * t; }
function cubicBlend(t) {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

export class Bassfish {
  static metadata = {
    name: 'Largemouth Bass',
    category: 'fish',
    baseLength: 115,
    baseWidth: 48
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
    // 9-segment chunky bass torso with wide bucket-mouth front
    const L = 115;
    const W = 48;
    const segs = 9;
    const widths = [0.54, 0.88, 1.00, 0.98, 0.88, 0.72, 0.54, 0.36, 0.24];
    const pts = [];
    const p = this._currPose;
    const jx = p.jitter > 0 ? Math.sin(this._time * 60) * p.jitter * 0.4 : 0;
    const jy = p.jitter > 0 ? Math.cos(this._time * 68) * p.jitter : 0;

    for (let i = 0; i < segs; i++) {
      const u = i / (segs - 1);
      const x = L * 0.40 - u * L * 0.78 + jx;
      const flex = Math.pow(u, 1.48);
      const wave = Math.sin(this._phase - u * 3.5) * (W * 0.48) * p.amp * 4.8 * flex;
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

  _drawBucketMouth(ctx, noseFrame) {
    // Oversized largemouth bass bucket-jaw protruding forward
    const p = this._currPose;
    const osc = (this._state === 'hungry') ? (0.55 + 0.45 * Math.sin(this._time * 10)) : 1;
    const gape = p.mouth * osc;

    ctx.save();
    ctx.translate(noseFrame.x, noseFrame.y);
    ctx.rotate(Math.atan2(noseFrame.ty, noseFrame.tx));

    const jawReach = 9 + gape * 8;
    const jawHalfW = 12 + gape * 4.5;

    // Lower bucket lip
    const lipGrad = ctx.createLinearGradient(0, 0, jawReach + 4, 0);
    lipGrad.addColorStop(0, '#84A955');
    lipGrad.addColorStop(1, '#D9E8B7');
    ctx.fillStyle = lipGrad;
    ctx.beginPath();
    ctx.moveTo(0, -jawHalfW);
    ctx.bezierCurveTo(jawReach, -jawHalfW * 0.95, jawReach + 3, -jawHalfW * 0.4, jawReach + 3, 0);
    ctx.bezierCurveTo(jawReach + 3, jawHalfW * 0.4, jawReach, jawHalfW * 0.95, 0, jawHalfW);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#1A2815';
    ctx.lineWidth = 2.3;
    ctx.stroke();

    // Deep bucket gullet when gaping
    if (gape > 0.14) {
      ctx.fillStyle = '#2B1117';
      ctx.beginPath();
      ctx.ellipse(6 + gape * 3.5, 0, 3.8 + gape * 4.2, jawHalfW * 0.72, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#F472B6';
      ctx.beginPath();
      ctx.ellipse(4 + gape * 2, 0, 2.2 + gape * 2, jawHalfW * 0.36, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  _drawPectoralFin(ctx, frame, side) {
    const p = this._currPose;
    const flap = Math.sin(this._phase * 0.95 + (side > 0 ? 0 : 0.7)) * 0.24;
    const angle = Math.atan2(frame.ty, frame.tx) + side * (Math.PI * 0.56 + flap + p.turn * side * 0.35);

    ctx.save();
    ctx.translate(frame.x + frame.nx * side * (frame.r * 0.8), frame.y + frame.ny * side * (frame.r * 0.8));
    ctx.rotate(angle);
    ctx.scale(0.82 + 0.22 * p.finSpread, 1);

    const g = ctx.createLinearGradient(0, 0, 23, 0);
    g.addColorStop(0, 'rgba(101, 134, 62, 0.92)');
    g.addColorStop(1, 'rgba(217, 232, 183, 0.65)');

    ctx.beginPath();
    ctx.moveTo(0, -4.5 * side);
    ctx.bezierCurveTo(10, -11 * side, 21, -8 * side, 24, 1 * side);
    ctx.bezierCurveTo(19, 10 * side, 9, 10 * side, -2, 4.5 * side);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();

    ctx.strokeStyle = 'rgba(26, 40, 21, 0.38)';
    ctx.lineWidth = 1.1;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(2, i * 1.7 * side);
      ctx.lineTo(20 - Math.abs(i) * 1.5, i * 3.3 * side);
      ctx.stroke();
    }

    ctx.strokeStyle = '#1A2815';
    ctx.lineWidth = 2.0;
    ctx.stroke();
    ctx.restore();
  }

  _drawBroadVeinedTail(ctx, tailFrame) {
    // Broad slightly notched veined bass tail
    const wag = Math.sin(this._phase - 3.6) * 0.32 + this._currPose.turn * 0.5;
    ctx.save();
    ctx.translate(tailFrame.x, tailFrame.y);
    ctx.rotate(Math.atan2(-tailFrame.ty, -tailFrame.tx) + wag);

    const g = ctx.createLinearGradient(0, 0, 27, 0);
    g.addColorStop(0, '#4D6B31');
    g.addColorStop(0.6, '#6B8E42');
    g.addColorStop(1, 'rgba(132, 169, 85, 0.78)');

    ctx.beginPath();
    ctx.moveTo(-2, -7);
    ctx.bezierCurveTo(10, -18, 22, -19, 27, -14);
    ctx.quadraticCurveTo(22, -5, 20, 0);
    ctx.quadraticCurveTo(22, 5, 27, 14);
    ctx.bezierCurveTo(22, 19, 10, 18, -2, 7);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();

    // Rich branching tail veins
    ctx.strokeStyle = 'rgba(26, 40, 21, 0.48)';
    ctx.lineWidth = 1.25;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(1, i * 1.6);
      ctx.lineTo(23 - Math.abs(i) * 0.8, i * 4.4);
      ctx.stroke();
    }

    ctx.strokeStyle = '#1A2815';
    ctx.lineWidth = 2.3;
    ctx.stroke();
    ctx.restore();
  }

  _drawJaggedLateralBlotches(ctx, pts) {
    // Signature jagged dark-olive lateral blotch band running down both flanks
    for (const side of [-1, 1]) {
      for (let i = 1; i < pts.length - 1; i++) {
        const f = this._frame(pts, i);
        const off = side * (f.r * 0.62);
        const bx = f.x + f.nx * off;
        const by = f.y + f.ny * off;
        const rx = 5.5 + (i % 2 === 0 ? 2.4 : 0.6);
        const ry = 3.2 + (i % 2 === 1 ? 1.8 : 0.5);

        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(Math.atan2(f.ty, f.tx) + side * (i % 2 === 0 ? 0.35 : -0.25));
        ctx.fillStyle = 'rgba(24, 42, 18, 0.72)';
        ctx.beginPath();
        ctx.moveTo(-rx, 0);
        ctx.lineTo(-rx * 0.3, -ry);
        ctx.lineTo(rx * 0.4, -ry * 0.6);
        ctx.lineTo(rx, 0);
        ctx.lineTo(rx * 0.3, ry);
        ctx.lineTo(-rx * 0.4, ry * 0.65);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }
  }

  _drawEyesAndEmotes(ctx, headFrame) {
    const st = this._state;
    const t = this._time;

    ctx.save();
    ctx.translate(headFrame.x, headFrame.y);
    ctx.rotate(Math.atan2(headFrame.ty, headFrame.tx));

    ctx.fillStyle = 'rgba(248, 113, 113, 0.36)';
    ctx.beginPath();
    ctx.ellipse(-4, -16, 5.2, 3.0, -0.2, 0, Math.PI * 2);
    ctx.ellipse(-4, 16, 5.2, 3.0, 0.2, 0, Math.PI * 2);
    ctx.fill();

    for (const side of [-1, 1]) {
      const ex = 4.5;
      const ey = side * 13.5;
      const r = st === 'shock' ? 8.0 : 6.7;

      ctx.save();
      ctx.translate(ex, ey);

      if (st === 'happy') {
        ctx.strokeStyle = '#1A2815';
        ctx.lineWidth = 2.8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, side, 4.7, side > 0 ? Math.PI * 1.15 : Math.PI * 0.15, side > 0 ? Math.PI * 1.85 : Math.PI * 0.85);
        ctx.stroke();
      } else if (st === 'stress') {
        ctx.strokeStyle = '#1A2815';
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
        ctx.strokeStyle = '#1A2815';
        ctx.lineWidth = 2.0;
        ctx.stroke();

        const irisR = st === 'shock' ? r * 0.42 : r * 0.72;
        const sx = st === 'fear' ? Math.sin(t * 56) * 1.0 : 0;
        const sy = st === 'fear' ? Math.cos(t * 62) * 1.0 : 0;
        const ig = ctx.createRadialGradient(1 + sx, -1 + sy, 0.6, sx, sy, irisR);
        ig.addColorStop(0, '#FEF08A');
        ig.addColorStop(0.55, '#CA8A04');
        ig.addColorStop(1, '#713F12');
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
        ctx.arc(2.4, -1.9, 2.1, 0, Math.PI * 2);
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
          ctx.fillStyle = '#587836';
          ctx.beginPath();
          ctx.arc(0, 0, r + 0.4, Math.PI, Math.PI * 2);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#1A2815';
          ctx.lineWidth = 1.7;
          ctx.beginPath();
          ctx.moveTo(-r, 0);
          ctx.quadraticCurveTo(0, 1.7, r, 0);
          ctx.stroke();
        }

        if (st === 'sad' || st === 'fear') {
          ctx.fillStyle = 'rgba(125, 211, 252, 0.78)';
          ctx.beginPath();
          ctx.ellipse(-1.8, 2.8 * side, 3.2, 1.7, 0.2 * side, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    if (st === 'shock') {
      ctx.save();
      ctx.translate(18, -23);
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
      ctx.translate(-5, -24 + Math.sin(t * 10) * 2);
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
      ctx.translate(10, -23 + Math.sin(t * 8) * 2);
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
    ctx.fillStyle = 'rgba(15, 28, 14, 0.22)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 44, 21, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    this._drawBucketMouth(ctx, noseFrame);
    this._drawPectoralFin(ctx, pecFrame, -1);
    this._drawPectoralFin(ctx, pecFrame, 1);
    this._drawBroadVeinedTail(ctx, tailFrame);

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
    const bodyGrad = ctx.createLinearGradient(0, -25, 0, 25);
    bodyGrad.addColorStop(0, '#B5C98E');
    bodyGrad.addColorStop(0.24, '#65883D');
    bodyGrad.addColorStop(0.5, '#3F5D24');
    bodyGrad.addColorStop(0.76, '#65883D');
    bodyGrad.addColorStop(1, '#B5C98E');
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.clip();

    this._drawJaggedLateralBlotches(ctx, pts);

    // Glossy jelly-bean chibi dorsal highlight
    ctx.fillStyle = 'rgba(247, 254, 231, 0.36)';
    ctx.beginPath();
    ctx.ellipse(6, -4, 24, 6.2, -0.04, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    traceBody();
    ctx.strokeStyle = '#1A2815';
    ctx.lineWidth = 2.7;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Two-part bass dorsal ridge (spiny anterior + soft posterior)
    ctx.save();
    ctx.beginPath();
    for (let i = 2; i < pts.length - 1; i++) {
      const sway = Math.sin(this._phase - i * 0.65) * 3.2;
      if (i === 2) ctx.moveTo(pts[i].x, pts[i].y);
      else ctx.lineTo(pts[i].x, pts[i].y + sway);
    }
    ctx.strokeStyle = '#2F481B';
    ctx.lineWidth = 5.4;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.strokeStyle = '#A3C46C';
    ctx.lineWidth = 2.0;
    ctx.stroke();
    ctx.restore();

    this._drawEyesAndEmotes(ctx, headFrame);
    ctx.restore();
  }
}

export default Bassfish;
