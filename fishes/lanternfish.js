/**
 * Bioluminescent Lanternfish (Myctophum punctatum) — Bespoke 2D Top-Down Expressive Chibi Asset
 * Dimensions: 58 x 28 | Native HTML5 Canvas 2D API | Zero external dependencies
 */

const VALID_STATES = new Set([
  'breathing', 'swimming', 'relax', 'left_turn', 'right_turn',
  'eating', 'hungry', 'stress', 'fear', 'shock', 'happy', 'sad'
]);

const ALIASES = { idle: 'breathing', hunger: 'hungry' };

const ONE_SHOT_DURATIONS = {
  left_turn: 0.44,
  right_turn: 0.44,
  eating: 0.55,
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
  breathing:  { freq: 3.0, amp: 0.08,  turn: 0,     glow: 0.85, finSpread: 1.0,  mouth: 0.06, jitter: 0,   droop: 0,    bounce: 0    },
  swimming:   { freq: 7.8, amp: 0.20,  turn: 0,     glow: 1.0,  finSpread: 0.88, mouth: 0.08, jitter: 0,   droop: 0,    bounce: 0    },
  relax:      { freq: 1.4, amp: 0.04,  turn: 0,     glow: 0.55, finSpread: 1.15, mouth: 0.03, jitter: 0,   droop: 0.1,  bounce: 0    },
  left_turn:  { freq: 5.2, amp: 0.13,  turn: -0.52, glow: 0.95, finSpread: 1.14, mouth: 0.08, jitter: 0,   droop: 0,    bounce: 0    },
  right_turn: { freq: 5.2, amp: 0.13,  turn: 0.52,  glow: 0.95, finSpread: 1.14, mouth: 0.08, jitter: 0,   droop: 0,    bounce: 0    },
  eating:     { freq: 8.2, amp: 0.16,  turn: 0,     glow: 1.2,  finSpread: 1.24, mouth: 0.92, jitter: 0,   droop: 0,    bounce: 0.14 },
  hungry:     { freq: 6.2, amp: 0.14,  turn: 0,     glow: 1.1,  finSpread: 1.1,  mouth: 0.55, jitter: 0,   droop: 0,    bounce: 0.08 },
  stress:     { freq: 11.0,amp: 0.11,  turn: 0,     glow: 0.7,  finSpread: 0.72, mouth: 0.12, jitter: 1.3, droop: 0.05, bounce: 0    },
  fear:       { freq: 13.8,amp: 0.13,  turn: 0,     glow: 0.45, finSpread: 0.56, mouth: 0.25, jitter: 2.2, droop: 0.2,  bounce: 0    },
  shock:      { freq: 15.0,amp: 0.04,  turn: 0,     glow: 1.45, finSpread: 1.36, mouth: 0.85, jitter: 2.6, droop: 0,    bounce: -0.1 },
  happy:      { freq: 7.4, amp: 0.19,  turn: 0,     glow: 1.3,  finSpread: 1.24, mouth: 0.2,  jitter: 0,   droop: -0.1, bounce: 0.18 },
  sad:        { freq: 1.5, amp: 0.04,  turn: 0,     glow: 0.35, finSpread: 0.68, mouth: 0.03, jitter: 0,   droop: 0.34, bounce: 0    }
};

function lerp(a, b, t) { return a + (b - a) * t; }
function cubicBlend(t) {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

export class Lanternfish {
  static metadata = {
    name: 'Bioluminescent Lanternfish',
    category: 'fish',
    baseLength: 58,
    baseWidth: 28
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
    // 7-segment adorable stubby big-headed deep-blue chibi lanternfish!
    const L = 58;
    const W = 28;
    const segs = 7;
    const widths = [0.56, 1.00, 0.96, 0.80, 0.58, 0.36, 0.22];
    const pts = [];
    const p = this._currPose;
    const jx = p.jitter > 0 ? Math.sin(this._time * 66) * p.jitter * 0.35 : 0;
    const jy = p.jitter > 0 ? Math.cos(this._time * 74) * p.jitter : 0;

    for (let i = 0; i < segs; i++) {
      const u = i / (segs - 1);
      const x = L * 0.36 - u * L * 0.72 + jx;
      const flex = Math.pow(u, 1.45);
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

  _drawPectoralFin(ctx, frame, side) {
    const p = this._currPose;
    const flap = Math.sin(this._phase * 1.1 + (side > 0 ? 0 : 0.7)) * 0.28;
    const angle = Math.atan2(frame.ty, frame.tx) + side * (Math.PI * 0.56 + flap + p.turn * side * 0.35);

    ctx.save();
    ctx.translate(frame.x + frame.nx * side * (frame.r * 0.78), frame.y + frame.ny * side * (frame.r * 0.78));
    ctx.rotate(angle);
    ctx.scale(0.84 + 0.22 * p.finSpread, 1);

    const g = ctx.createLinearGradient(0, 0, 14, 0);
    g.addColorStop(0, 'rgba(59, 130, 246, 0.78)');
    g.addColorStop(1, 'rgba(190, 242, 100, 0.48)');

    ctx.beginPath();
    ctx.moveTo(0, -2.5 * side);
    ctx.quadraticCurveTo(8, -7 * side, 14, 1 * side);
    ctx.quadraticCurveTo(8, 6 * side, -2, 2.5 * side);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = '#090D22';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();
  }

  _drawForkedTail(ctx, tailFrame) {
    const wag = Math.sin(this._phase - 3.6) * 0.38 + this._currPose.turn * 0.55;
    ctx.save();
    ctx.translate(tailFrame.x, tailFrame.y);
    ctx.rotate(Math.atan2(-tailFrame.ty, -tailFrame.tx) + wag);

    const g = ctx.createLinearGradient(0, 0, 16, 0);
    g.addColorStop(0, '#1E3A8A');
    g.addColorStop(1, 'rgba(163, 230, 53, 0.58)');

    ctx.beginPath();
    ctx.moveTo(-2, -3.5);
    ctx.quadraticCurveTo(8, -11, 16, -9.5);
    ctx.quadraticCurveTo(9, -2.5, 7, 0);
    ctx.quadraticCurveTo(9, 2.5, 16, 9.5);
    ctx.quadraticCurveTo(8, 11, -2, 3.5);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = '#090D22';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.restore();
  }

  _drawGoldenGreenPhotophoreLanterns(ctx, pts) {
    // Rows of softly glowing golden-green photophore lanterns along both flanks!
    const glowStrength = this._currPose.glow;
    const t = this._time;

    for (let i = 1; i < pts.length; i++) {
      const f = this._frame(pts, i);
      const pulse = 0.78 + 0.22 * Math.sin(t * 5.2 - i * 0.7);
      for (const side of [-1, 1]) {
        const lx = f.x + f.nx * side * (f.r * 0.76);
        const ly = f.y + f.ny * side * (f.r * 0.76);
        const rad = (5.2 - pts[i].u * 1.4) * (0.75 + glowStrength * 0.35) * pulse;

        const halo = ctx.createRadialGradient(lx, ly, 0.4, lx, ly, rad);
        halo.addColorStop(0, `rgba(254, 252, 232, ${0.98 * Math.min(1, glowStrength)})`);
        halo.addColorStop(0.38, `rgba(190, 242, 100, ${0.85 * Math.min(1, glowStrength)})`);
        halo.addColorStop(0.72, `rgba(74, 222, 128, ${0.35 * Math.min(1, glowStrength)})`);
        halo.addColorStop(1, 'rgba(74, 222, 128, 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(lx, ly, rad, 0, Math.PI * 2);
        ctx.fill();

        // Crisp lantern bead core
        ctx.fillStyle = '#FEF9C3';
        ctx.beginPath();
        ctx.arc(lx, ly, 1.45, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  _drawOversizedSparklingEyesAndEmotes(ctx, headFrame) {
    // Huge oversized sparkling abyssal chibi eyes!
    const st = this._state;
    const t = this._time;

    ctx.save();
    ctx.translate(headFrame.x, headFrame.y);
    ctx.rotate(Math.atan2(headFrame.ty, headFrame.tx));

    ctx.fillStyle = 'rgba(244, 114, 182, 0.42)';
    ctx.beginPath();
    ctx.ellipse(-2.5, -11.5, 3.4, 1.9, -0.15, 0, Math.PI * 2);
    ctx.ellipse(-2.5, 11.5, 3.4, 1.9, 0.15, 0, Math.PI * 2);
    ctx.fill();

    for (const side of [-1, 1]) {
      const ex = 3.2;
      const ey = side * 9.2;
      const r = st === 'shock' ? 7.2 : 6.1;

      ctx.save();
      ctx.translate(ex, ey);

      if (st === 'happy') {
        ctx.strokeStyle = '#D9F99D';
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, side * 0.8, 3.9, side > 0 ? Math.PI * 1.15 : Math.PI * 0.15, side > 0 ? Math.PI * 1.85 : Math.PI * 0.85);
        ctx.stroke();
      } else if (st === 'stress') {
        ctx.strokeStyle = '#D9F99D';
        ctx.lineWidth = 2.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-2.7, -2.7 * side);
        ctx.lineTo(2.0, 0);
        ctx.lineTo(-2.7, 2.7 * side);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#090D22';
        ctx.lineWidth = 1.7;
        ctx.stroke();

        const irisR = st === 'shock' ? r * 0.42 : r * 0.76;
        const sx = st === 'fear' ? Math.sin(t * 60) * 0.9 : 0;
        const sy = st === 'fear' ? Math.cos(t * 66) * 0.9 : 0;
        // Luminous golden-green sparkling iris
        const ig = ctx.createRadialGradient(0.9 + sx, -0.9 + sy, 0.5, sx, sy, irisR);
        ig.addColorStop(0, '#FEF9C3');
        ig.addColorStop(0.55, '#84CC16');
        ig.addColorStop(1, '#14532D');
        ctx.fillStyle = ig;
        ctx.beginPath();
        ctx.arc(1.0 + sx, sy, irisR, 0, Math.PI * 2);
        ctx.fill();

        const pr = st === 'shock' ? 1.5 : (st === 'fear' ? 1.9 : irisR * 0.52);
        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.arc(1.2 + sx, sy, pr, 0, Math.PI * 2);
        ctx.fill();

        // Extra-sparkly dual catchlights + tiny twinkle star!
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(2.3, -1.8, 2.0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-0.9, 1.7, 1.0, 0, Math.PI * 2);
        ctx.fill();

        if (st === 'hungry' || st === 'eating') {
          ctx.fillStyle = '#FEF08A';
          ctx.beginPath();
          for (let k = 0; k < 8; k++) {
            const a = (k * Math.PI) / 4;
            const rad = k % 2 === 0 ? 3.2 : 1.1;
            ctx.lineTo(1.1 + Math.cos(a) * rad, Math.sin(a) * rad);
          }
          ctx.closePath();
          ctx.fill();
        }

        if (st === 'relax') {
          ctx.fillStyle = '#1E3A8A';
          ctx.beginPath();
          ctx.arc(0, 0, r + 0.3, Math.PI, Math.PI * 2);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#D9F99D';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(-r, 0);
          ctx.quadraticCurveTo(0, 1.4, r, 0);
          ctx.stroke();
        }

        if (st === 'sad' || st === 'fear') {
          ctx.fillStyle = 'rgba(125, 211, 252, 0.85)';
          ctx.beginPath();
          ctx.ellipse(-1.4, 2.4 * side, 2.6, 1.4, 0.2 * side, 0, Math.PI * 2);
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
      ctx.roundRect(-2.1, -10.5, 4.2, 7.5, 1.6);
      ctx.stroke();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, 2.1, 0, Math.PI * 2);
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
      ctx.moveTo(0, -5);
      ctx.bezierCurveTo(3.6, 0, 3.6, 4.2, 0, 4.2);
      ctx.bezierCurveTo(-3.6, 4.2, -3.6, 0, 0, -5);
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
        const rad = k % 2 === 0 ? 4.6 : 1.6;
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
    const headFrame = this._frame(pts, 1);
    const pecFrame = this._frame(pts, 2);
    const tailFrame = this._frame(pts, pts.length - 1);

    // Soft ambient bioluminescent aura around the tiny lanternfish
    const aura = ctx.createRadialGradient(0, 0, 4, 0, 0, 30);
    aura.addColorStop(0, `rgba(163, 230, 53, ${0.22 * this._currPose.glow})`);
    aura.addColorStop(1, 'rgba(74, 222, 128, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.fill();

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
      ctx.moveTo(n.x + nf.tx * 7, n.y + nf.ty * 7);
      ctx.quadraticCurveTo(n.x + nf.tx * 7 + nf.nx * 8, n.y + nf.ty * 7 + nf.ny * 8, leftPts[1].x, leftPts[1].y);
      for (let i = 2; i < leftPts.length; i++) {
        const p0 = leftPts[i - 1];
        const p1 = leftPts[i];
        ctx.quadraticCurveTo(p0.x, p0.y, (p0.x + p1.x) * 0.5, (p0.y + p1.y) * 0.5);
      }
      ctx.lineTo(leftPts[leftPts.length - 1].x, leftPts[leftPts.length - 1].y);
      ctx.lineTo(rightPts[rightPts.length - 1].x, rightPts[rightPts.length - 1].y);
      for (let i = rightPts.length - 2; i >= 1; i--) {
        const p0 = rightPts[i + 1];
        const p1 = rightPts[i];
        ctx.quadraticCurveTo(p0.x, p0.y, (p0.x + p1.x) * 0.5, (p0.y + p1.y) * 0.5);
      }
      ctx.quadraticCurveTo(n.x + nf.tx * 7 - nf.nx * 8, n.y + nf.ty * 7 - nf.ny * 8, n.x + nf.tx * 7, n.y + nf.ty * 7);
      ctx.closePath();
    };

    ctx.save();
    traceBody();
    const bodyGrad = ctx.createRadialGradient(5, -3, 2, 0, 0, 28);
    bodyGrad.addColorStop(0, '#3B82F6');
    bodyGrad.addColorStop(0.55, '#1E3A8A');
    bodyGrad.addColorStop(1, '#0F172A');
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.clip();

    // Glossy jelly-bean chibi highlight
    ctx.fillStyle = 'rgba(224, 242, 254, 0.34)';
    ctx.beginPath();
    ctx.ellipse(2, -2.8, 12, 3.6, -0.05, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    traceBody();
    ctx.strokeStyle = '#090D22';
    ctx.lineWidth = 2.1;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Rows of glowing golden-green photophore lanterns + oversized sparkling eyes
    this._drawGoldenGreenPhotophoreLanterns(ctx, pts);
    this._drawOversizedSparklingEyesAndEmotes(ctx, headFrame);
    ctx.restore();
  }
}

export default Lanternfish;
