/**
 * Cutlass Ribbonfish (Trichiurus lepturus) — Bespoke 2D Top-Down Expressive Chibi Asset
 * Dimensions: 180 x 32 | Native HTML5 Canvas 2D API | Zero external dependencies
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
  breathing:  { freq: 2.2, amp: 0.08,  turn: 0,     finSpread: 1.0,  mouth: 0.06, jitter: 0,   droop: 0,    bounce: 0    },
  swimming:   { freq: 6.0, amp: 0.22,  turn: 0,     finSpread: 0.86, mouth: 0.08, jitter: 0,   droop: 0,    bounce: 0    },
  relax:      { freq: 1.0, amp: 0.045, turn: 0,     finSpread: 1.15, mouth: 0.03, jitter: 0,   droop: 0.1,  bounce: 0    },
  left_turn:  { freq: 4.2, amp: 0.14,  turn: -0.54, finSpread: 1.14, mouth: 0.08, jitter: 0,   droop: 0,    bounce: 0    },
  right_turn: { freq: 4.2, amp: 0.14,  turn: 0.54,  finSpread: 1.14, mouth: 0.08, jitter: 0,   droop: 0,    bounce: 0    },
  eating:     { freq: 7.0, amp: 0.15,  turn: 0,     finSpread: 1.24, mouth: 0.94, jitter: 0,   droop: 0,    bounce: 0.1  },
  hungry:     { freq: 4.8, amp: 0.14,  turn: 0,     finSpread: 1.08, mouth: 0.55, jitter: 0,   droop: 0,    bounce: 0.06 },
  stress:     { freq: 9.5, amp: 0.11,  turn: 0,     finSpread: 0.72, mouth: 0.12, jitter: 1.5, droop: 0.05, bounce: 0    },
  fear:       { freq: 12.4,amp: 0.14,  turn: 0,     finSpread: 0.56, mouth: 0.25, jitter: 2.5, droop: 0.2,  bounce: 0    },
  shock:      { freq: 14.0,amp: 0.04,  turn: 0,     finSpread: 1.35, mouth: 0.85, jitter: 3.0, droop: 0,    bounce: -0.1 },
  happy:      { freq: 6.2, amp: 0.19,  turn: 0,     finSpread: 1.22, mouth: 0.2,  jitter: 0,   droop: -0.1, bounce: 0.15 },
  sad:        { freq: 1.2, amp: 0.045, turn: 0,     finSpread: 0.68, mouth: 0.03, jitter: 0,   droop: 0.32, bounce: 0    }
};

function lerp(a, b, t) { return a + (b - a) * t; }
function cubicBlend(t) {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

export class Ribbonfish {
  static metadata = {
    name: 'Cutlass Ribbonfish',
    category: 'fish',
    baseLength: 180,
    baseWidth: 32
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
    // 14-segment razor-sleek chrome cutlass blade tapering smoothly to a hair-thin whip tip!
    const L = 180;
    const W = 32;
    const segs = 14;
    const widths = [
      0.22, 0.78, 1.00, 0.92, 0.80, 0.68, 0.56,
      0.44, 0.34, 0.25, 0.17, 0.11, 0.06, 0.02
    ];
    const pts = [];
    const p = this._currPose;
    const jx = p.jitter > 0 ? Math.sin(this._time * 60) * p.jitter * 0.4 : 0;
    const jy = p.jitter > 0 ? Math.cos(this._time * 68) * p.jitter : 0;

    for (let i = 0; i < segs; i++) {
      const u = i / (segs - 1);
      const x = L * 0.44 - u * L * 0.90 + jx;
      const flex = Math.pow(u, 1.25);
      const wave = Math.sin(this._phase - u * 6.4) * (W * 0.78) * p.amp * 4.5 * flex;
      const turnCurve = p.turn * L * 0.25 * Math.pow(u, 1.48);
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
    const angle = Math.atan2(frame.ty, frame.tx) + side * (Math.PI * 0.60 + flap + p.turn * side * 0.32);

    ctx.save();
    ctx.translate(frame.x + frame.nx * side * (frame.r * 0.75), frame.y + frame.ny * side * (frame.r * 0.75));
    ctx.rotate(angle);
    ctx.scale(0.84 + 0.2 * p.finSpread, 1);

    const g = ctx.createLinearGradient(0, 0, 18, 0);
    g.addColorStop(0, 'rgba(226, 232, 240, 0.92)');
    g.addColorStop(1, 'rgba(254, 240, 138, 0.52)');

    ctx.beginPath();
    ctx.moveTo(0, -3 * side);
    ctx.quadraticCurveTo(10, -8 * side, 19, 1 * side);
    ctx.quadraticCurveTo(10, 7 * side, -2, 3 * side);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();
  }

  _drawGoldenChibiEyesAndEmotes(ctx, headFrame) {
    // Signature big gleaming golden chibi eyes of Cutlass Ribbonfish!
    const st = this._state;
    const t = this._time;

    ctx.save();
    ctx.translate(headFrame.x, headFrame.y);
    ctx.rotate(Math.atan2(headFrame.ty, headFrame.tx));

    ctx.fillStyle = 'rgba(251, 146, 60, 0.32)';
    ctx.beginPath();
    ctx.ellipse(-3, -12, 3.8, 2.1, -0.15, 0, Math.PI * 2);
    ctx.ellipse(-3, 12, 3.8, 2.1, 0.15, 0, Math.PI * 2);
    ctx.fill();

    for (const side of [-1, 1]) {
      const ex = 4.0;
      const ey = side * 9.8;
      const r = st === 'shock' ? 7.6 : 6.5;

      ctx.save();
      ctx.translate(ex, ey);

      if (st === 'happy') {
        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 2.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, side, 4.3, side > 0 ? Math.PI * 1.15 : Math.PI * 0.15, side > 0 ? Math.PI * 1.85 : Math.PI * 0.85);
        ctx.stroke();
      } else if (st === 'stress') {
        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-3.0, -3.0 * side);
        ctx.lineTo(2.2, 0);
        ctx.lineTo(-3.0, 3.0 * side);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 1.9;
        ctx.stroke();

        const irisR = st === 'shock' ? r * 0.42 : r * 0.74;
        const sx = st === 'fear' ? Math.sin(t * 58) * 1.0 : 0;
        const sy = st === 'fear' ? Math.cos(t * 64) * 1.0 : 0;
        // Bright gleaming gold iris
        const ig = ctx.createRadialGradient(1 + sx, -1 + sy, 0.7, sx, sy, irisR);
        ig.addColorStop(0, '#FEF9C3');
        ig.addColorStop(0.55, '#FACC15');
        ig.addColorStop(1, '#A16207');
        ctx.fillStyle = ig;
        ctx.beginPath();
        ctx.arc(1.1 + sx, sy, irisR, 0, Math.PI * 2);
        ctx.fill();

        const pr = st === 'shock' ? 1.6 : (st === 'fear' ? 2.0 : irisR * 0.54);
        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        ctx.arc(1.4 + sx, sy, pr, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(2.4, -1.8, 2.0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-0.8, 1.7, 0.95, 0, Math.PI * 2);
        ctx.fill();

        if (st === 'hungry' || st === 'eating') {
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          for (let k = 0; k < 8; k++) {
            const a = (k * Math.PI) / 4;
            const rad = k % 2 === 0 ? 3.3 : 1.1;
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
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-r, 0);
          ctx.quadraticCurveTo(0, 1.5, r, 0);
          ctx.stroke();
        }

        if (st === 'sad' || st === 'fear') {
          ctx.fillStyle = 'rgba(125, 211, 252, 0.82)';
          ctx.beginPath();
          ctx.ellipse(-1.6, 2.5 * side, 2.9, 1.5, 0.2 * side, 0, Math.PI * 2);
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
      ctx.roundRect(-2.4, -12, 4.8, 8.5, 2);
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
    const bounceScale = 1 + Math.sin(this._time * 8.5) * this._currPose.bounce * 0.25;
    ctx.scale(this.scale * bounceScale, this.scale / Math.sqrt(Math.max(0.7, bounceScale)));

    const pts = this._buildSpine();
    const headFrame = this._frame(pts, 1);
    const pecFrame = this._frame(pts, 3);

    // Shadow
    ctx.save();
    ctx.translate(0, 5);
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.18)';
    ctx.lineWidth = 18;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      if (i === 0) ctx.moveTo(pts[i].x, pts[i].y); else ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();
    ctx.restore();

    this._drawPectoralFin(ctx, pecFrame, -1);
    this._drawPectoralFin(ctx, pecFrame, 1);

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
      // Razor-sharp pointed cutlass snout!
      ctx.moveTo(n.x + nf.tx * 16, n.y + nf.ty * 16);
      for (let i = 1; i < leftPts.length; i++) {
        const p0 = leftPts[i - 1];
        const p1 = leftPts[i];
        ctx.quadraticCurveTo(p0.x, p0.y, (p0.x + p1.x) * 0.5, (p0.y + p1.y) * 0.5);
      }
      // Hair-thin whip tail tip extending past final segment!
      const tail = pts[pts.length - 1];
      const tf = this._frame(pts, pts.length - 1);
      ctx.lineTo(tail.x - tf.tx * 14, tail.y - tf.ty * 14);
      for (let i = rightPts.length - 2; i >= 0; i--) {
        const p0 = rightPts[i + 1];
        const p1 = rightPts[i];
        ctx.quadraticCurveTo(p0.x, p0.y, (p0.x + p1.x) * 0.5, (p0.y + p1.y) * 0.5);
      }
      ctx.closePath();
    };

    ctx.save();
    traceBody();
    // Mirror-bright gleaming chrome-silver blade gradient!
    const chromeGrad = ctx.createLinearGradient(0, -16, 0, 16);
    chromeGrad.addColorStop(0, '#475569');
    chromeGrad.addColorStop(0.20, '#CBD5E1');
    chromeGrad.addColorStop(0.45, '#FFFFFF');
    chromeGrad.addColorStop(0.62, '#E0F2FE');
    chromeGrad.addColorStop(0.84, '#94A3B8');
    chromeGrad.addColorStop(1, '#334155');
    ctx.fillStyle = chromeGrad;
    ctx.fill();
    ctx.clip();

    // Animated diagonal chrome sheen glint sliding along the blade!
    const glintX = ((this._time * 95) % 240) - 120;
    const glintGrad = ctx.createLinearGradient(glintX - 24, -18, glintX + 24, 18);
    glintGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    glintGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.72)');
    glintGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = glintGrad;
    ctx.fillRect(-110, -25, 220, 50);

    // Razor mirror highlight streak down the entire dorsal blade
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < pts.length - 1; i++) {
      if (i === 0) ctx.moveTo(pts[i].x + 6, pts[i].y - 2.2);
      else ctx.lineTo(pts[i].x, pts[i].y - 2.2);
    }
    ctx.stroke();

    ctx.restore();

    traceBody();
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2.2;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Translucent pale-gold continuous dorsal fin ribbon
    ctx.save();
    ctx.beginPath();
    for (let i = 2; i < pts.length - 1; i++) {
      const sway = Math.sin(this._phase * 1.2 - i * 0.7) * 3.8;
      if (i === 2) ctx.moveTo(pts[i].x, pts[i].y);
      else ctx.lineTo(pts[i].x, pts[i].y + sway);
    }
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.75)';
    ctx.lineWidth = 3.8;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();

    this._drawGoldenChibiEyesAndEmotes(ctx, headFrame);
    ctx.restore();
  }
}

export default Ribbonfish;
