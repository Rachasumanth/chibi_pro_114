/**
 * Prehistoric Coelacanth (Latimeria chalumnae) — Bespoke 2D Top-Down Expressive Chibi Asset
 * Dimensions: 170 x 66 | Native HTML5 Canvas 2D API | Zero external dependencies
 */

const VALID_STATES = new Set([
  'breathing', 'swimming', 'relax', 'left_turn', 'right_turn',
  'eating', 'hungry', 'stress', 'fear', 'shock', 'happy', 'sad'
]);

const ALIASES = { idle: 'breathing', hunger: 'hungry' };

const ONE_SHOT_DURATIONS = {
  left_turn: 0.56,
  right_turn: 0.56,
  eating: 0.65,
  shock: 0.78
};

const BLOCKED_IN_SHOCK = new Set([
  'left_turn', 'right_turn', 'relax', 'happy', 'eating',
  'breathing', 'swimming', 'hungry', 'sad'
]);

const BLOCKED_IN_FEAR = new Set([
  'left_turn', 'right_turn', 'relax', 'happy', 'eating'
]);

const POSE_TARGETS = {
  breathing:  { freq: 1.8, amp: 0.06,  turn: 0,     finSpread: 1.0,  mouth: 0.06, jitter: 0,   droop: 0,    bounce: 0    },
  swimming:   { freq: 4.6, amp: 0.15,  turn: 0,     finSpread: 0.92, mouth: 0.08, jitter: 0,   droop: 0,    bounce: 0    },
  relax:      { freq: 0.9, amp: 0.032, turn: 0,     finSpread: 1.16, mouth: 0.03, jitter: 0,   droop: 0.12, bounce: 0    },
  left_turn:  { freq: 3.4, amp: 0.10,  turn: -0.45, finSpread: 1.14, mouth: 0.08, jitter: 0,   droop: 0,    bounce: 0    },
  right_turn: { freq: 3.4, amp: 0.10,  turn: 0.45,  finSpread: 1.14, mouth: 0.08, jitter: 0,   droop: 0,    bounce: 0    },
  eating:     { freq: 5.8, amp: 0.13,  turn: 0,     finSpread: 1.24, mouth: 0.94, jitter: 0,   droop: 0,    bounce: 0.1  },
  hungry:     { freq: 4.2, amp: 0.12,  turn: 0,     finSpread: 1.08, mouth: 0.52, jitter: 0,   droop: 0,    bounce: 0.06 },
  stress:     { freq: 8.8, amp: 0.09,  turn: 0,     finSpread: 0.74, mouth: 0.12, jitter: 1.6, droop: 0.05, bounce: 0    },
  fear:       { freq: 11.4,amp: 0.11,  turn: 0,     finSpread: 0.58, mouth: 0.25, jitter: 2.6, droop: 0.2,  bounce: 0    },
  shock:      { freq: 13.2,amp: 0.04,  turn: 0,     finSpread: 1.36, mouth: 0.88, jitter: 3.2, droop: 0,    bounce: -0.1 },
  happy:      { freq: 5.4, amp: 0.16,  turn: 0,     finSpread: 1.22, mouth: 0.22, jitter: 0,   droop: -0.1, bounce: 0.16 },
  sad:        { freq: 1.1, amp: 0.035, turn: 0,     finSpread: 0.68, mouth: 0.03, jitter: 0,   droop: 0.34, bounce: 0    }
};

function lerp(a, b, t) { return a + (b - a) * t; }
function cubicBlend(t) {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

export class Coelacanthfish {
  static metadata = {
    name: 'Prehistoric Coelacanth',
    category: 'fish',
    baseLength: 170,
    baseWidth: 66
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
    // 10-segment chunky prehistoric lobe-finned coelacanth spine
    const L = 170;
    const W = 66;
    const segs = 10;
    const widths = [0.42, 0.82, 1.00, 0.98, 0.90, 0.78, 0.64, 0.50, 0.36, 0.25];
    const pts = [];
    const p = this._currPose;
    const jx = p.jitter > 0 ? Math.sin(this._time * 58) * p.jitter * 0.45 : 0;
    const jy = p.jitter > 0 ? Math.cos(this._time * 66) * p.jitter : 0;

    for (let i = 0; i < segs; i++) {
      const u = i / (segs - 1);
      const x = L * 0.42 - u * L * 0.76 + jx;
      const flex = Math.pow(u, 1.48);
      const wave = Math.sin(this._phase - u * 3.5) * (W * 0.44) * p.amp * 4.8 * flex;
      const turnCurve = p.turn * L * 0.26 * Math.pow(u, 1.5);
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

  _drawFleshyLobedFin(ctx, frame, side, scaleLen, phaseOff) {
    // Signature prehistoric Coelacanth fleshy limb-like stalk + fan fin fringe!
    // Coelacanths move their paired lobed fins in an alternating tetrapod-like gait!
    const p = this._currPose;
    const gait = Math.sin(this._phase * 1.1 + phaseOff) * 0.30;
    const angle = Math.atan2(frame.ty, frame.tx) + side * (Math.PI * 0.56 + gait + p.turn * side * 0.3);

    ctx.save();
    ctx.translate(frame.x + frame.nx * side * (frame.r * 0.78), frame.y + frame.ny * side * (frame.r * 0.78));
    ctx.rotate(angle);
    ctx.scale(scaleLen * (0.85 + 0.2 * p.finSpread), scaleLen);

    // Translucent sapphire-blue rayed fan fringe surrounding the fleshy lobe
    const fanGrad = ctx.createLinearGradient(6, 0, 32, 0);
    fanGrad.addColorStop(0, 'rgba(30, 64, 175, 0.92)');
    fanGrad.addColorStop(0.6, 'rgba(59, 130, 246, 0.78)');
    fanGrad.addColorStop(1, 'rgba(191, 219, 254, 0.65)');

    ctx.beginPath();
    ctx.moveTo(4, -7 * side);
    ctx.bezierCurveTo(16, -15 * side, 30, -11 * side, 33, 0);
    ctx.bezierCurveTo(30, 11 * side, 16, 15 * side, 4, 7 * side);
    ctx.closePath();
    ctx.fillStyle = fanGrad;
    ctx.fill();

    ctx.strokeStyle = 'rgba(224, 242, 254, 0.55)';
    ctx.lineWidth = 1.1;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(10, i * 2.0 * side);
      ctx.lineTo(30 - Math.abs(i) * 1.6, i * 4.4 * side);
      ctx.stroke();
    }

    ctx.strokeStyle = '#0B1733';
    ctx.lineWidth = 2.1;
    ctx.stroke();

    // Fleshy scaly muscular limb stalk inside the fin!
    ctx.fillStyle = '#1E3A8A';
    ctx.beginPath();
    ctx.ellipse(9, 0, 10, 5.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0B1733';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Shimmering white fleck on fleshy limb
    ctx.fillStyle = 'rgba(240, 249, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(10, -1.2 * side, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  _drawTripleLobedTail(ctx, tailFrame) {
    // Iconic signature TRIPLE-LOBED prehistoric epicaudal tail of Coelacanth!
    const wag = Math.sin(this._phase - 3.7) * 0.30 + this._currPose.turn * 0.45;
    ctx.save();
    ctx.translate(tailFrame.x, tailFrame.y);
    ctx.rotate(Math.atan2(-tailFrame.ty, -tailFrame.tx) + wag);

    const g = ctx.createLinearGradient(0, 0, 36, 0);
    g.addColorStop(0, '#1E3A8A');
    g.addColorStop(0.6, '#2563EB');
    g.addColorStop(1, 'rgba(147, 197, 253, 0.8)');

    // Upper & lower broad fan lobes
    ctx.beginPath();
    ctx.moveTo(-2, -9);
    ctx.bezierCurveTo(10, -26, 26, -24, 28, -8);
    // Middle protruding epicaudal third lobe!
    ctx.bezierCurveTo(35, -7, 40, -3, 41, 0);
    ctx.bezierCurveTo(40, 3, 35, 7, 28, 8);
    // Lower broad fan lobe
    ctx.bezierCurveTo(26, 24, 10, 26, -2, 9);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();

    // Prehistoric tail rays
    ctx.strokeStyle = 'rgba(224, 242, 254, 0.5)';
    ctx.lineWidth = 1.2;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(2, i * 1.8);
      ctx.lineTo(i === 0 ? 37 : 25, i * 5.2);
      ctx.stroke();
    }

    ctx.strokeStyle = '#0B1733';
    ctx.lineWidth = 2.6;
    ctx.stroke();

    // Central fleshy caudal stalk running into middle lobe
    ctx.fillStyle = '#1E3A8A';
    ctx.beginPath();
    ctx.ellipse(12, 0, 14, 5.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0B1733';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.restore();
  }

  _drawHeavyCosmoidScalesAndWhiteFlecks(ctx, pts) {
    // Heavy prehistoric cosmoid armor scales + shimmering chalk-white flecks
    for (let i = 2; i < pts.length - 1; i++) {
      const f = this._frame(pts, i);
      const rows = Math.max(2, Math.round(f.r / 9.2));
      const sr = 6.8 - pts[i].u * 1.8;

      for (let r = -rows + 0.5; r <= rows - 0.5; r += 1) {
        const off = r * (sr * 1.35);
        if (Math.abs(off) > f.r * 0.82) continue;
        const stagger = Math.round(r) % 2 === 0 ? 0 : 3.8;
        const sx = f.x + f.nx * off - f.tx * stagger;
        const sy = f.y + f.ny * off - f.ty * stagger;

        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(Math.atan2(f.ty, f.tx));
        ctx.strokeStyle = 'rgba(11, 23, 51, 0.44)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(0, 0, sr, Math.PI * 0.58, Math.PI * 1.42);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(147, 197, 253, 0.34)';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.arc(1.2, 0, sr * 0.9, Math.PI * 0.62, Math.PI * 1.38);
        ctx.stroke();
        ctx.restore();
      }
    }

    // Iconic shimmering chalk-white flecks scattered across sapphire-blue armor!
    const flecks = [
      [26, -12, 3.2], [18, 16, 2.8], [8, -20, 3.5], [2, 10, 3.0],
      [-8, -14, 3.4], [-14, 18, 2.9], [-24, -6, 3.2], [-32, 12, 2.6],
      [-40, -10, 2.4], [14, -4, 2.6], [-4, 22, 2.5], [-20, -22, 2.6]
    ];
    ctx.fillStyle = 'rgba(240, 249, 255, 0.85)';
    for (const [fx, fy, fr] of flecks) {
      ctx.beginPath();
      ctx.ellipse(fx, fy, fr, fr * 0.65, 0.25, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _drawEyesAndEmotes(ctx, headFrame) {
    const st = this._state;
    const t = this._time;

    ctx.save();
    ctx.translate(headFrame.x, headFrame.y);
    ctx.rotate(Math.atan2(headFrame.ty, headFrame.tx));

    ctx.fillStyle = 'rgba(244, 114, 182, 0.34)';
    ctx.beginPath();
    ctx.ellipse(-4, -20, 5.8, 3.2, -0.2, 0, Math.PI * 2);
    ctx.ellipse(-4, 20, 5.8, 3.2, 0.2, 0, Math.PI * 2);
    ctx.fill();

    for (const side of [-1, 1]) {
      const ex = 4.5;
      const ey = side * 16.5;
      const r = st === 'shock' ? 8.8 : 7.4;

      ctx.save();
      ctx.translate(ex, ey);

      if (st === 'happy') {
        ctx.strokeStyle = '#E0F2FE';
        ctx.lineWidth = 3.0;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, side, 5.0, side > 0 ? Math.PI * 1.15 : Math.PI * 0.15, side > 0 ? Math.PI * 1.85 : Math.PI * 0.85);
        ctx.stroke();
      } else if (st === 'stress') {
        ctx.strokeStyle = '#E0F2FE';
        ctx.lineWidth = 2.7;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-3.6, -3.6 * side);
        ctx.lineTo(2.6, 0);
        ctx.lineTo(-3.6, 3.6 * side);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0B1733';
        ctx.lineWidth = 2.1;
        ctx.stroke();

        const irisR = st === 'shock' ? r * 0.42 : r * 0.72;
        const sx = st === 'fear' ? Math.sin(t * 58) * 1.0 : 0;
        const sy = st === 'fear' ? Math.cos(t * 64) * 1.0 : 0;
        // Glowing golden-emerald ancient eye iris
        const ig = ctx.createRadialGradient(1 + sx, -1 + sy, 0.7, sx, sy, irisR);
        ig.addColorStop(0, '#FEF08A');
        ig.addColorStop(0.55, '#10B981');
        ig.addColorStop(1, '#064E3B');
        ctx.fillStyle = ig;
        ctx.beginPath();
        ctx.arc(1.2 + sx, sy, irisR, 0, Math.PI * 2);
        ctx.fill();

        const pr = st === 'shock' ? 1.9 : (st === 'fear' ? 2.3 : irisR * 0.54);
        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.arc(1.5 + sx, sy, pr, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(2.7, -2.1, 2.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-1.0, 2.0, 1.1, 0, Math.PI * 2);
        ctx.fill();

        if (st === 'hungry' || st === 'eating') {
          ctx.fillStyle = '#FEF08A';
          ctx.beginPath();
          for (let k = 0; k < 8; k++) {
            const a = (k * Math.PI) / 4;
            const rad = k % 2 === 0 ? 3.8 : 1.3;
            ctx.lineTo(1.3 + Math.cos(a) * rad, Math.sin(a) * rad);
          }
          ctx.closePath();
          ctx.fill();
        }

        if (st === 'relax') {
          ctx.fillStyle = '#1E3A8A';
          ctx.beginPath();
          ctx.arc(0, 0, r + 0.4, Math.PI, Math.PI * 2);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#E0F2FE';
          ctx.lineWidth = 1.7;
          ctx.beginPath();
          ctx.moveTo(-r, 0);
          ctx.quadraticCurveTo(0, 1.8, r, 0);
          ctx.stroke();
        }

        if (st === 'sad' || st === 'fear') {
          ctx.fillStyle = 'rgba(125, 211, 252, 0.85)';
          ctx.beginPath();
          ctx.ellipse(-2, 3.0 * side, 3.5, 1.8, 0.2 * side, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    if (st === 'shock') {
      ctx.save();
      ctx.translate(20, -28);
      ctx.fillStyle = '#EF4444';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.1;
      ctx.beginPath();
      ctx.roundRect(-3, -15, 6, 11, 2.4);
      ctx.stroke();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fill();
      ctx.restore();
    } else if (st === 'fear' || st === 'stress') {
      ctx.save();
      ctx.translate(-5, -28 + Math.sin(t * 10) * 2);
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
      ctx.translate(12, -28 + Math.sin(t * 8) * 2);
      ctx.fillStyle = '#FACC15';
      ctx.strokeStyle = '#B45309';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4;
        const rad = k % 2 === 0 ? 6.6 : 2.3;
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
    const bounceScale = 1 + Math.sin(this._time * 8.0) * this._currPose.bounce * 0.22;
    ctx.scale(this.scale * bounceScale, this.scale / Math.sqrt(Math.max(0.7, bounceScale)));

    const pts = this._buildSpine();
    const headFrame = this._frame(pts, 1);
    const pecFrame = this._frame(pts, 3);
    const pelvFrame = this._frame(pts, 6);
    const tailFrame = this._frame(pts, pts.length - 1);

    // Shadow
    ctx.save();
    ctx.translate(0, 7);
    ctx.fillStyle = 'rgba(11, 23, 51, 0.24)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 62, 29, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 4 fleshy limb-like lobed fins moving in alternating tetrapod gait + triple-lobed tail!
    this._drawFleshyLobedFin(ctx, pecFrame, -1, 1.0, 0);
    this._drawFleshyLobedFin(ctx, pecFrame, 1, 1.0, Math.PI);
    this._drawFleshyLobedFin(ctx, pelvFrame, -1, 0.84, Math.PI);
    this._drawFleshyLobedFin(ctx, pelvFrame, 1, 0.84, 0);
    this._drawTripleLobedTail(ctx, tailFrame);

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
      ctx.quadraticCurveTo(n.x + nf.tx * 12 + nf.nx * 14, n.y + nf.ty * 12 + nf.ny * 14, leftPts[1].x, leftPts[1].y);
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
      ctx.quadraticCurveTo(n.x + nf.tx * 12 - nf.nx * 14, n.y + nf.ty * 12 - nf.ny * 14, n.x + nf.tx * 12, n.y + nf.ty * 12);
      ctx.closePath();
    };

    ctx.save();
    traceBody();
    const bodyGrad = ctx.createRadialGradient(14, -6, 6, 0, 0, 74);
    bodyGrad.addColorStop(0, '#3B82F6');
    bodyGrad.addColorStop(0.5, '#1D4ED8');
    bodyGrad.addColorStop(1, '#0F172A');
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.clip();

    this._drawHeavyCosmoidScalesAndWhiteFlecks(ctx, pts);

    // Glossy jelly-bean chibi highlight
    ctx.fillStyle = 'rgba(224, 242, 254, 0.28)';
    ctx.beginPath();
    ctx.ellipse(8, -6, 28, 7.5, -0.04, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    traceBody();
    ctx.strokeStyle = '#0B1733';
    ctx.lineWidth = 2.9;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Twin prehistoric dorsal fins (spiny first + fleshy lobed second)
    ctx.save();
    for (const [sIdx, eIdx] of [[2, 4], [5, 7]]) {
      ctx.beginPath();
      ctx.moveTo(pts[sIdx].x, pts[sIdx].y);
      ctx.quadraticCurveTo(pts[sIdx + 1].x, pts[sIdx + 1].y + Math.sin(this._phase - sIdx) * 4.0, pts[eIdx].x, pts[eIdx].y);
      ctx.strokeStyle = '#1E3A8A';
      ctx.lineWidth = 6.2;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.strokeStyle = '#93C5FD';
      ctx.lineWidth = 2.2;
      ctx.stroke();
    }
    ctx.restore();

    this._drawEyesAndEmotes(ctx, headFrame);
    ctx.restore();
  }
}

export default Coelacanthfish;
