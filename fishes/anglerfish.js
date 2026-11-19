/**
 * Deep-Sea Anglerfish (Melanocetus johnsonii) — Bespoke 2D Top-Down Expressive Chibi Asset
 * Dimensions: 100 x 64 | Native HTML5 Canvas 2D API | Zero external dependencies
 */

const VALID_STATES = new Set([
  'breathing', 'swimming', 'relax', 'left_turn', 'right_turn',
  'eating', 'hungry', 'stress', 'fear', 'shock', 'happy', 'sad'
]);

const ALIASES = { idle: 'breathing', hunger: 'hungry' };

const ONE_SHOT_DURATIONS = {
  left_turn: 0.54,
  right_turn: 0.54,
  eating: 0.65,
  shock: 0.76
};

const BLOCKED_IN_SHOCK = new Set([
  'left_turn', 'right_turn', 'relax', 'happy', 'eating',
  'breathing', 'swimming', 'hungry', 'sad'
]);

const BLOCKED_IN_FEAR = new Set([
  'left_turn', 'right_turn', 'relax', 'happy', 'eating'
]);

const POSE_TARGETS = {
  breathing:  { freq: 1.9, amp: 0.06,  turn: 0,     finSpread: 1.0,  mouth: 0.25, jitter: 0,   droop: 0,    bounce: 0    },
  swimming:   { freq: 4.8, amp: 0.14,  turn: 0,     finSpread: 0.9,  mouth: 0.3,  jitter: 0,   droop: 0,    bounce: 0    },
  relax:      { freq: 1.0, amp: 0.035, turn: 0,     finSpread: 1.16, mouth: 0.12, jitter: 0,   droop: 0.12, bounce: 0    },
  left_turn:  { freq: 3.6, amp: 0.1,   turn: -0.45, finSpread: 1.15, mouth: 0.28, jitter: 0,   droop: 0,    bounce: 0    },
  right_turn: { freq: 3.6, amp: 0.1,   turn: 0.45,  finSpread: 1.15, mouth: 0.28, jitter: 0,   droop: 0,    bounce: 0    },
  eating:     { freq: 6.4, amp: 0.13,  turn: 0,     finSpread: 1.28, mouth: 1.0,  jitter: 0.5, droop: 0,    bounce: 0.14 },
  hungry:     { freq: 4.4, amp: 0.12,  turn: 0,     finSpread: 1.12, mouth: 0.72, jitter: 0,   droop: 0,    bounce: 0.08 },
  stress:     { freq: 9.0, amp: 0.09,  turn: 0,     finSpread: 0.72, mouth: 0.35, jitter: 1.6, droop: 0.05, bounce: 0    },
  fear:       { freq: 11.8,amp: 0.11,  turn: 0,     finSpread: 0.56, mouth: 0.4,  jitter: 2.6, droop: 0.2,  bounce: 0    },
  shock:      { freq: 13.5,amp: 0.04,  turn: 0,     finSpread: 1.38, mouth: 0.95, jitter: 3.2, droop: 0,    bounce: -0.1 },
  happy:      { freq: 5.8, amp: 0.16,  turn: 0,     finSpread: 1.25, mouth: 0.42, jitter: 0,   droop: -0.1, bounce: 0.18 },
  sad:        { freq: 1.2, amp: 0.035, turn: 0,     finSpread: 0.68, mouth: 0.08, jitter: 0,   droop: 0.34, bounce: 0    }
};

function lerp(a, b, t) { return a + (b - a) * t; }
function cubicBlend(t) {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

export class Anglerfish {
  static metadata = {
    name: 'Deep-Sea Anglerfish',
    category: 'fish',
    baseLength: 100,
    baseWidth: 64
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
    // 7-segment bulbous head-heavy abyssal chibi anglerfish
    const L = 100;
    const W = 64;
    const segs = 7;
    const widths = [0.76, 1.00, 0.94, 0.72, 0.48, 0.28, 0.16];
    const pts = [];
    const p = this._currPose;
    const jx = p.jitter > 0 ? Math.sin(this._time * 60) * p.jitter * 0.4 : 0;
    const jy = p.jitter > 0 ? Math.cos(this._time * 68) * p.jitter : 0;

    for (let i = 0; i < segs; i++) {
      const u = i / (segs - 1);
      const x = L * 0.24 - u * L * 0.68 + jx;
      const flex = Math.pow(u, 1.6);
      const wave = Math.sin(this._phase - u * 3.0) * (W * 0.36) * p.amp * 4.5 * flex;
      const turnCurve = p.turn * L * 0.24 * Math.pow(u, 1.5);
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

  _drawToothyGrin(ctx, noseFrame) {
    // Huge crescent toothy abyssal grin with translucent needle fangs!
    const p = this._currPose;
    const osc = (this._state === 'eating' || this._state === 'hungry')
      ? (0.55 + 0.45 * Math.sin(this._time * (this._state === 'eating' ? 16 : 10))) : 0.45;
    const jawPush = 5 + p.mouth * 9 * osc;

    ctx.save();
    ctx.translate(noseFrame.x, noseFrame.y);
    ctx.rotate(Math.atan2(noseFrame.ty, noseFrame.tx));

    // Lower bulbous dark-violet jaw crescent
    ctx.fillStyle = '#3B1D5A';
    ctx.beginPath();
    ctx.moveTo(0, -21);
    ctx.bezierCurveTo(14 + jawPush, -20, 18 + jawPush, -10, 18 + jawPush, 0);
    ctx.bezierCurveTo(18 + jawPush, 10, 14 + jawPush, 20, 0, 21);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#0F071A';
    ctx.lineWidth = 2.6;
    ctx.stroke();

    // Abyssal mouth cavity
    ctx.fillStyle = '#1E0829';
    ctx.beginPath();
    ctx.ellipse(8 + jawPush * 0.45, 0, 5 + jawPush * 0.35, 16.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Curved translucent-white needle fangs!
    const fangPositions = [-14, -9.5, -4.8, 0, 4.8, 9.5, 14];
    for (let i = 0; i < fangPositions.length; i++) {
      const fy = fangPositions[i];
      const fx = 13.5 + jawPush * 0.72 - Math.abs(fy) * 0.25;
      const flen = i % 2 === 0 ? 7.8 : 5.4;

      ctx.fillStyle = 'rgba(240, 249, 255, 0.94)';
      ctx.strokeStyle = '#0F071A';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(fx + 2.2, fy - 1.9);
      ctx.quadraticCurveTo(fx - flen * 0.5, fy - 0.5, fx - flen, fy);
      ctx.quadraticCurveTo(fx - flen * 0.5, fy + 0.5, fx + 2.2, fy + 1.9);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  _drawBioluminescentLure(ctx, headFrame) {
    // Iconic curved illicium stalk holding a glowing neon-cyan esca lantern dangling ahead of snout!
    const t = this._time;
    const swayY = Math.sin(t * 3.4) * 7.5 + this._currPose.turn * 14;
    const pulse = 0.85 + 0.15 * Math.sin(t * 5.8);

    ctx.save();
    ctx.translate(headFrame.x, headFrame.y);
    ctx.rotate(Math.atan2(headFrame.ty, headFrame.tx));

    const lureX = 42;
    const lureY = swayY;

    // Stalk (illicium) arching forward from forehead
    ctx.strokeStyle = '#0F071A';
    ctx.lineWidth = 4.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(2, 0);
    ctx.bezierCurveTo(18, -6 + swayY * 0.3, 32, -4 + swayY * 0.7, lureX, lureY);
    ctx.stroke();

    ctx.strokeStyle = '#7E57C2';
    ctx.lineWidth = 2.0;
    ctx.stroke();

    // Soft radial neon-cyan bioluminescent light halo!
    const halo = ctx.createRadialGradient(lureX, lureY, 2, lureX, lureY, 24 * pulse);
    halo.addColorStop(0, 'rgba(103, 232, 249, 0.95)');
    halo.addColorStop(0.32, 'rgba(34, 211, 238, 0.55)');
    halo.addColorStop(0.68, 'rgba(6, 182, 212, 0.22)');
    halo.addColorStop(1, 'rgba(6, 182, 212, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(lureX, lureY, 24 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Glowing teardrop esca bulb
    const bulbGrad = ctx.createRadialGradient(lureX + 1.5, lureY - 1.5, 1, lureX, lureY, 6.5);
    bulbGrad.addColorStop(0, '#FFFFFF');
    bulbGrad.addColorStop(0.45, '#A5F3FC');
    bulbGrad.addColorStop(1, '#06B6D4');
    ctx.fillStyle = bulbGrad;
    ctx.beginPath();
    ctx.ellipse(lureX, lureY, 6.2 * pulse, 4.8 * pulse, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ECFEFF';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Tiny floating bioluminescent sparkles around the lure
    ctx.fillStyle = '#CFFAFE';
    for (let k = 0; k < 3; k++) {
      const ang = t * 2.4 + k * 2.1;
      const sx = lureX + Math.cos(ang) * (10 + k * 2);
      const sy = lureY + Math.sin(ang) * (9 + k * 1.5);
      ctx.beginPath();
      ctx.arc(sx, sy, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  _drawPectoralFin(ctx, frame, side) {
    const p = this._currPose;
    const flap = Math.sin(this._phase * 1.1 + (side > 0 ? 0 : 0.7)) * 0.26;
    const angle = Math.atan2(frame.ty, frame.tx) + side * (Math.PI * 0.58 + flap + p.turn * side * 0.35);

    ctx.save();
    ctx.translate(frame.x + frame.nx * side * (frame.r * 0.8), frame.y + frame.ny * side * (frame.r * 0.8));
    ctx.rotate(angle);
    ctx.scale(0.84 + 0.22 * p.finSpread, 1);

    const g = ctx.createLinearGradient(0, 0, 18, 0);
    g.addColorStop(0, '#3B1D5A');
    g.addColorStop(1, 'rgba(139, 92, 246, 0.65)');

    ctx.beginPath();
    ctx.moveTo(0, -4 * side);
    ctx.quadraticCurveTo(10, -10 * side, 18, 1 * side);
    ctx.quadraticCurveTo(10, 9 * side, -2, 4 * side);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = '#0F071A';
    ctx.lineWidth = 2.0;
    ctx.stroke();
    ctx.restore();
  }

  _drawAbyssalTail(ctx, tailFrame) {
    const wag = Math.sin(this._phase - 3.2) * 0.35 + this._currPose.turn * 0.5;
    ctx.save();
    ctx.translate(tailFrame.x, tailFrame.y);
    ctx.rotate(Math.atan2(-tailFrame.ty, -tailFrame.tx) + wag);

    const g = ctx.createLinearGradient(0, 0, 22, 0);
    g.addColorStop(0, '#3B1D5A');
    g.addColorStop(0.6, '#5B21B6');
    g.addColorStop(1, 'rgba(167, 139, 250, 0.7)');

    ctx.beginPath();
    ctx.moveTo(-2, -6);
    ctx.bezierCurveTo(9, -17, 21, -15, 23, 0);
    ctx.bezierCurveTo(21, 15, 9, 17, -2, 6);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();

    ctx.strokeStyle = 'rgba(165, 243, 252, 0.38)';
    ctx.lineWidth = 1.1;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(1, i * 1.5);
      ctx.lineTo(19, i * 4.5);
      ctx.stroke();
    }

    ctx.strokeStyle = '#0F071A';
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.restore();
  }

  _drawEyesAndEmotes(ctx, headFrame) {
    const st = this._state;
    const t = this._time;

    ctx.save();
    ctx.translate(headFrame.x, headFrame.y);
    ctx.rotate(Math.atan2(headFrame.ty, headFrame.tx));

    ctx.fillStyle = 'rgba(244, 114, 182, 0.36)';
    ctx.beginPath();
    ctx.ellipse(-4, -22, 5.5, 3.2, -0.2, 0, Math.PI * 2);
    ctx.ellipse(-4, 22, 5.5, 3.2, 0.2, 0, Math.PI * 2);
    ctx.fill();

    for (const side of [-1, 1]) {
      const ex = 6.5;
      const ey = side * 16.5;
      const r = st === 'shock' ? 8.6 : 7.4;

      ctx.save();
      ctx.translate(ex, ey);

      if (st === 'happy') {
        ctx.strokeStyle = '#A5F3FC';
        ctx.lineWidth = 2.9;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, side, 5.0, side > 0 ? Math.PI * 1.15 : Math.PI * 0.15, side > 0 ? Math.PI * 1.85 : Math.PI * 0.85);
        ctx.stroke();
      } else if (st === 'stress') {
        ctx.strokeStyle = '#A5F3FC';
        ctx.lineWidth = 2.6;
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
        ctx.strokeStyle = '#0F071A';
        ctx.lineWidth = 2.1;
        ctx.stroke();

        const irisR = st === 'shock' ? r * 0.42 : r * 0.72;
        const sx = st === 'fear' ? Math.sin(t * 58) * 1.0 : 0;
        const sy = st === 'fear' ? Math.cos(t * 64) * 1.0 : 0;
        // Glowing bioluminescent cyan-teal iris
        const ig = ctx.createRadialGradient(1 + sx, -1 + sy, 0.8, sx, sy, irisR);
        ig.addColorStop(0, '#ECFEFF');
        ig.addColorStop(0.5, '#22D3EE');
        ig.addColorStop(1, '#155E75');
        ctx.fillStyle = ig;
        ctx.beginPath();
        ctx.arc(1.2 + sx, sy, irisR, 0, Math.PI * 2);
        ctx.fill();

        const pr = st === 'shock' ? 1.9 : (st === 'fear' ? 2.3 : irisR * 0.54);
        ctx.fillStyle = '#09090B';
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
            ctx.lineTo(1.4 + Math.cos(a) * rad, Math.sin(a) * rad);
          }
          ctx.closePath();
          ctx.fill();
        }

        if (st === 'relax') {
          ctx.fillStyle = '#4C1D95';
          ctx.beginPath();
          ctx.arc(0, 0, r + 0.4, Math.PI, Math.PI * 2);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#A5F3FC';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(-r, 0);
          ctx.quadraticCurveTo(0, 1.8, r, 0);
          ctx.stroke();
        }

        if (st === 'sad' || st === 'fear') {
          ctx.fillStyle = 'rgba(125, 211, 252, 0.85)';
          ctx.beginPath();
          ctx.ellipse(-2, 3.0 * side, 3.4, 1.8, 0.2 * side, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    if (st === 'shock') {
      ctx.save();
      ctx.translate(18, -28);
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
      ctx.translate(-5, -28 + Math.sin(t * 10) * 2);
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
      ctx.translate(10, -28 + Math.sin(t * 8) * 2);
      ctx.fillStyle = '#FACC15';
      ctx.strokeStyle = '#B45309';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4;
        const rad = k % 2 === 0 ? 6.4 : 2.2;
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
    const pecFrame = this._frame(pts, 2);
    const tailFrame = this._frame(pts, pts.length - 1);

    ctx.save();
    ctx.translate(0, 6);
    ctx.fillStyle = 'rgba(10, 5, 22, 0.28)';
    ctx.beginPath();
    ctx.ellipse(-2, 0, 34, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    this._drawToothyGrin(ctx, noseFrame);
    this._drawPectoralFin(ctx, pecFrame, -1);
    this._drawPectoralFin(ctx, pecFrame, 1);
    this._drawAbyssalTail(ctx, tailFrame);

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
      ctx.quadraticCurveTo(n.x + nf.tx * 12 + nf.nx * 18, n.y + nf.ty * 12 + nf.ny * 18, leftPts[1].x, leftPts[1].y);
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
      ctx.quadraticCurveTo(n.x + nf.tx * 12 - nf.nx * 18, n.y + nf.ty * 12 - nf.ny * 18, n.x + nf.tx * 9, n.y + nf.ty * 9);
      ctx.closePath();
    };

    ctx.save();
    traceBody();
    const bodyGrad = ctx.createRadialGradient(8, -6, 6, 0, 0, 48);
    bodyGrad.addColorStop(0, '#5B21B6');
    bodyGrad.addColorStop(0.5, '#3B1D5A');
    bodyGrad.addColorStop(1, '#1A0B2E');
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.clip();

    // Subtle abyssal dermal bumps & cyan lure reflection on forehead
    ctx.fillStyle = 'rgba(139, 92, 246, 0.34)';
    for (const [bx, by, br] of [[-8, -14, 3.2], [-14, 12, 2.8], [-22, -6, 2.5], [2, -20, 2.4], [0, 20, 2.4]]) {
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
    }

    // Soft cyan bounce light on forehead from the dangling lantern!
    const bounceGlow = ctx.createRadialGradient(26, 0, 2, 24, 0, 24);
    bounceGlow.addColorStop(0, 'rgba(34, 211, 238, 0.42)');
    bounceGlow.addColorStop(1, 'rgba(34, 211, 238, 0)');
    ctx.fillStyle = bounceGlow;
    ctx.fillRect(-10, -35, 50, 70);

    // Glossy jelly-bean chibi highlight
    ctx.fillStyle = 'rgba(233, 213, 255, 0.25)';
    ctx.beginPath();
    ctx.ellipse(2, -7, 15, 7.0, -0.08, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    traceBody();
    ctx.strokeStyle = '#0F071A';
    ctx.lineWidth = 2.8;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Glowing bioluminescent lure arching over snout + expressive chibi eyes
    this._drawBioluminescentLure(ctx, headFrame);
    this._drawEyesAndEmotes(ctx, headFrame);
    ctx.restore();
  }
}

export default Anglerfish;
