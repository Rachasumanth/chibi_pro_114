/**
 * Sloane's Viperfish (Chauliodus sloani) — Bespoke 2D Top-Down Expressive Chibi Asset
 * Dimensions: 125 x 36 | Native HTML5 Canvas 2D API | Zero external dependencies
 */

const VALID_STATES = new Set([
  'breathing', 'swimming', 'relax', 'left_turn', 'right_turn',
  'eating', 'hungry', 'stress', 'fear', 'shock', 'happy', 'sad'
]);

const ALIASES = { idle: 'breathing', hunger: 'hungry' };

const ONE_SHOT_DURATIONS = {
  left_turn: 0.48,
  right_turn: 0.48,
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
  breathing:  { freq: 2.3, amp: 0.07,  turn: 0,     finSpread: 1.0,  mouth: 0.2,  jitter: 0,   droop: 0,    bounce: 0    },
  swimming:   { freq: 6.2, amp: 0.19,  turn: 0,     finSpread: 0.86, mouth: 0.25, jitter: 0,   droop: 0,    bounce: 0    },
  relax:      { freq: 1.1, amp: 0.04,  turn: 0,     finSpread: 1.15, mouth: 0.08, jitter: 0,   droop: 0.1,  bounce: 0    },
  left_turn:  { freq: 4.4, amp: 0.12,  turn: -0.55, finSpread: 1.15, mouth: 0.22, jitter: 0,   droop: 0,    bounce: 0    },
  right_turn: { freq: 4.4, amp: 0.12,  turn: 0.55,  finSpread: 1.15, mouth: 0.22, jitter: 0,   droop: 0,    bounce: 0    },
  eating:     { freq: 7.4, amp: 0.15,  turn: 0,     finSpread: 1.25, mouth: 1.0,  jitter: 0.5, droop: 0,    bounce: 0.12 },
  hungry:     { freq: 5.0, amp: 0.14,  turn: 0,     finSpread: 1.1,  mouth: 0.72, jitter: 0,   droop: 0,    bounce: 0.06 },
  stress:     { freq: 9.8, amp: 0.1,   turn: 0,     finSpread: 0.72, mouth: 0.3,  jitter: 1.6, droop: 0.05, bounce: 0    },
  fear:       { freq: 12.8,amp: 0.13,  turn: 0,     finSpread: 0.56, mouth: 0.35, jitter: 2.6, droop: 0.2,  bounce: 0    },
  shock:      { freq: 14.2,amp: 0.04,  turn: 0,     finSpread: 1.35, mouth: 0.92, jitter: 3.1, droop: 0,    bounce: -0.1 },
  happy:      { freq: 6.4, amp: 0.18,  turn: 0,     finSpread: 1.22, mouth: 0.32, jitter: 0,   droop: -0.1, bounce: 0.16 },
  sad:        { freq: 1.3, amp: 0.04,  turn: 0,     finSpread: 0.68, mouth: 0.05, jitter: 0,   droop: 0.32, bounce: 0    }
};

function lerp(a, b, t) { return a + (b - a) * t; }
function cubicBlend(t) {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

export class Viperfish {
  static metadata = {
    name: "Sloane's Viperfish",
    category: 'fish',
    baseLength: 125,
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
    // 11-segment slender serpentine midnight-blue viperfish with big chibi head
    const L = 125;
    const W = 36;
    const segs = 11;
    const widths = [0.62, 1.00, 0.90, 0.74, 0.62, 0.52, 0.44, 0.36, 0.28, 0.20, 0.13];
    const pts = [];
    const p = this._currPose;
    const jx = p.jitter > 0 ? Math.sin(this._time * 62) * p.jitter * 0.4 : 0;
    const jy = p.jitter > 0 ? Math.cos(this._time * 70) * p.jitter : 0;

    for (let i = 0; i < segs; i++) {
      const u = i / (segs - 1);
      const x = L * 0.40 - u * L * 0.80 + jx;
      const flex = Math.pow(u, 1.35);
      const wave = Math.sin(this._phase - u * 4.8) * (W * 0.62) * p.amp * 5.0 * flex;
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

  _drawHingedCurvedFangs(ctx, noseFrame) {
    // Iconic oversized hinged curved viperfish fangs jutting prominently past the snout!
    const p = this._currPose;
    const snap = (this._state === 'eating' || this._state === 'hungry')
      ? (0.5 + 0.5 * Math.sin(this._time * 15)) : 0.4;
    const open = 4 + p.mouth * 6 * snap;

    ctx.save();
    ctx.translate(noseFrame.x, noseFrame.y);
    ctx.rotate(Math.atan2(noseFrame.ty, noseFrame.tx));

    // Hinged lower jaw plate
    ctx.fillStyle = '#1E3A8A';
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(0, -10.5);
    ctx.bezierCurveTo(10 + open, -10, 14 + open, -4, 14 + open, 0);
    ctx.bezierCurveTo(14 + open, 4, 10 + open, 10, 0, 10.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Giant twin outer curved saber-fangs + inner needle fangs
    for (const side of [-1, 1]) {
      // Giant saber fang
      ctx.fillStyle = 'rgba(224, 242, 254, 0.96)';
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(9 + open * 0.6, side * 8.5);
      ctx.quadraticCurveTo(18 + open * 0.8, side * 10.5, 22 + open * 0.9, side * 5.2);
      ctx.quadraticCurveTo(15 + open * 0.6, side * 6.5, 9 + open * 0.6, side * 4.8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Secondary needle fang
      ctx.beginPath();
      ctx.moveTo(11 + open * 0.7, side * 3.8);
      ctx.lineTo(18.5 + open * 0.85, side * 2.1);
      ctx.lineTo(11 + open * 0.7, side * 1.4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  _drawLongDorsalFilament(ctx, pts) {
    // Signature ultra-long trailing dorsal fin filament with glowing cyan lure tip!
    const start = pts[2];
    const t = this._time;
    const tipX = pts[pts.length - 1].x - 16;
    const tipY = pts[pts.length - 1].y + Math.sin(this._phase - 4.5) * 14;
    const midX = (start.x + tipX) * 0.5;
    const midY = (start.y + tipY) * 0.5 - 12 + Math.sin(this._phase - 2.2) * 8;

    ctx.save();
    ctx.strokeStyle = 'rgba(125, 211, 252, 0.82)';
    ctx.lineWidth = 2.1;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.quadraticCurveTo(midX, midY, tipX, tipY);
    ctx.stroke();

    // Glowing cyan filament tip
    const pulse = 0.8 + 0.2 * Math.sin(t * 7);
    const glow = ctx.createRadialGradient(tipX, tipY, 0.5, tipX, tipY, 7 * pulse);
    glow.addColorStop(0, '#FFFFFF');
    glow.addColorStop(0.4, 'rgba(34, 211, 238, 0.9)');
    glow.addColorStop(1, 'rgba(34, 211, 238, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(tipX, tipY, 7 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawPhotophoreRows(ctx, pts) {
    // Glowing cyan photophore spots neatly aligned along both midnight-blue flanks!
    const pulse = 0.72 + 0.28 * Math.sin(this._time * 5.2);
    for (let i = 2; i < pts.length - 1; i++) {
      const f = this._frame(pts, i);
      for (const side of [-1, 1]) {
        const px = f.x + f.nx * side * (f.r * 0.72);
        const py = f.y + f.ny * side * (f.r * 0.72);

        const g = ctx.createRadialGradient(px, py, 0.3, px, py, 4.4 * pulse);
        g.addColorStop(0, '#FFFFFF');
        g.addColorStop(0.45, 'rgba(34, 211, 238, 0.9)');
        g.addColorStop(1, 'rgba(6, 182, 212, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, 4.4 * pulse, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  _drawPectoralFin(ctx, frame, side) {
    const p = this._currPose;
    const flap = Math.sin(this._phase * 1.0 + (side > 0 ? 0 : 0.7)) * 0.24;
    const angle = Math.atan2(frame.ty, frame.tx) + side * (Math.PI * 0.58 + flap + p.turn * side * 0.35);

    ctx.save();
    ctx.translate(frame.x + frame.nx * side * (frame.r * 0.78), frame.y + frame.ny * side * (frame.r * 0.78));
    ctx.rotate(angle);
    ctx.scale(0.84 + 0.2 * p.finSpread, 1);

    const g = ctx.createLinearGradient(0, 0, 18, 0);
    g.addColorStop(0, 'rgba(30, 58, 138, 0.9)');
    g.addColorStop(1, 'rgba(56, 189, 248, 0.52)');

    ctx.beginPath();
    ctx.moveTo(0, -3 * side);
    ctx.quadraticCurveTo(10, -8 * side, 19, 1 * side);
    ctx.quadraticCurveTo(10, 7 * side, -2, 3 * side);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 1.7;
    ctx.stroke();
    ctx.restore();
  }

  _drawForkedTail(ctx, tailFrame) {
    const wag = Math.sin(this._phase - 5.0) * 0.38 + this._currPose.turn * 0.55;
    ctx.save();
    ctx.translate(tailFrame.x, tailFrame.y);
    ctx.rotate(Math.atan2(-tailFrame.ty, -tailFrame.tx) + wag);

    const g = ctx.createLinearGradient(0, 0, 22, 0);
    g.addColorStop(0, '#1E3A8A');
    g.addColorStop(1, 'rgba(56, 189, 248, 0.72)');

    ctx.beginPath();
    ctx.moveTo(-2, -4);
    ctx.quadraticCurveTo(10, -14, 22, -12);
    ctx.quadraticCurveTo(12, -3, 9, 0);
    ctx.quadraticCurveTo(12, 3, 22, 12);
    ctx.quadraticCurveTo(10, 14, -2, 4);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 1.9;
    ctx.stroke();
    ctx.restore();
  }

  _drawEyesAndEmotes(ctx, headFrame) {
    const st = this._state;
    const t = this._time;

    ctx.save();
    ctx.translate(headFrame.x, headFrame.y);
    ctx.rotate(Math.atan2(headFrame.ty, headFrame.tx));

    ctx.fillStyle = 'rgba(244, 114, 182, 0.32)';
    ctx.beginPath();
    ctx.ellipse(-3, -13, 4.2, 2.3, -0.18, 0, Math.PI * 2);
    ctx.ellipse(-3, 13, 4.2, 2.3, 0.18, 0, Math.PI * 2);
    ctx.fill();

    for (const side of [-1, 1]) {
      const ex = 4.2;
      const ey = side * 10.6;
      const r = st === 'shock' ? 7.2 : 6.0;

      ctx.save();
      ctx.translate(ex, ey);

      if (st === 'happy') {
        ctx.strokeStyle = '#7DD3FC';
        ctx.lineWidth = 2.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, side, 4.2, side > 0 ? Math.PI * 1.15 : Math.PI * 0.15, side > 0 ? Math.PI * 1.85 : Math.PI * 0.85);
        ctx.stroke();
      } else if (st === 'stress') {
        ctx.strokeStyle = '#7DD3FC';
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
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 1.9;
        ctx.stroke();

        const irisR = st === 'shock' ? r * 0.42 : r * 0.72;
        const sx = st === 'fear' ? Math.sin(t * 58) * 1.0 : 0;
        const sy = st === 'fear' ? Math.cos(t * 64) * 1.0 : 0;
        const ig = ctx.createRadialGradient(1 + sx, -1 + sy, 0.6, sx, sy, irisR);
        ig.addColorStop(0, '#ECFEFF');
        ig.addColorStop(0.55, '#06B6D4');
        ig.addColorStop(1, '#0F172A');
        ctx.fillStyle = ig;
        ctx.beginPath();
        ctx.arc(1.1 + sx, sy, irisR, 0, Math.PI * 2);
        ctx.fill();

        const pr = st === 'shock' ? 1.6 : (st === 'fear' ? 2.0 : irisR * 0.54);
        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.arc(1.4 + sx, sy, pr, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(2.3, -1.7, 1.9, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-0.8, 1.6, 0.9, 0, Math.PI * 2);
        ctx.fill();

        if (st === 'hungry' || st === 'eating') {
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
          ctx.fillStyle = '#1E3A8A';
          ctx.beginPath();
          ctx.arc(0, 0, r + 0.4, Math.PI, Math.PI * 2);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#7DD3FC';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-r, 0);
          ctx.quadraticCurveTo(0, 1.5, r, 0);
          ctx.stroke();
        }

        if (st === 'sad' || st === 'fear') {
          ctx.fillStyle = 'rgba(125, 211, 252, 0.85)';
          ctx.beginPath();
          ctx.ellipse(-1.6, 2.5 * side, 2.9, 1.5, 0.2 * side, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    if (st === 'shock') {
      ctx.save();
      ctx.translate(16, -20);
      ctx.fillStyle = '#EF4444';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.roundRect(-2.4, -12.5, 4.8, 9, 2);
      ctx.stroke();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fill();
      ctx.restore();
    } else if (st === 'fear' || st === 'stress') {
      ctx.save();
      ctx.translate(-4, -20 + Math.sin(t * 10) * 1.7);
      ctx.fillStyle = '#38BDF8';
      ctx.strokeStyle = '#0369A1';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, -5.8);
      ctx.bezierCurveTo(4.2, 0, 4.2, 4.8, 0, 4.8);
      ctx.bezierCurveTo(-4.2, 4.8, -4.2, 0, 0, -5.8);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (st === 'happy') {
      ctx.save();
      ctx.translate(8, -20 + Math.sin(t * 8) * 1.7);
      ctx.fillStyle = '#FACC15';
      ctx.strokeStyle = '#B45309';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4;
        const rad = k % 2 === 0 ? 5.4 : 1.8;
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
    ctx.translate(0, 5);
    ctx.fillStyle = 'rgba(2, 6, 23, 0.24)';
    ctx.beginPath();
    ctx.ellipse(-2, 0, 48, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    this._drawHingedCurvedFangs(ctx, noseFrame);
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
    bodyGrad.addColorStop(0, '#0F172A');
    bodyGrad.addColorStop(0.24, '#1E3A8A');
    bodyGrad.addColorStop(0.5, '#312E81');
    bodyGrad.addColorStop(0.76, '#1E3A8A');
    bodyGrad.addColorStop(1, '#0F172A');
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.clip();

    // Iridescent metallic hexagonal scale facets
    ctx.strokeStyle = 'rgba(125, 211, 252, 0.24)';
    ctx.lineWidth = 1.0;
    for (let i = 2; i < pts.length - 1; i++) {
      const f = this._frame(pts, i);
      ctx.beginPath();
      ctx.moveTo(f.x + 3, f.y - f.r * 0.8);
      ctx.lineTo(f.x - 3, f.y);
      ctx.lineTo(f.x + 3, f.y + f.r * 0.8);
      ctx.stroke();
    }

    // Glossy iridescent dorsal highlight
    ctx.fillStyle = 'rgba(186, 230, 253, 0.30)';
    ctx.beginPath();
    ctx.ellipse(8, -3, 24, 3.8, -0.04, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    traceBody();
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 2.4;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Glowing photophores + long trailing dorsal filament + expressive eyes
    this._drawPhotophoreRows(ctx, pts);
    this._drawLongDorsalFilament(ctx, pts);
    this._drawEyesAndEmotes(ctx, headFrame);
    ctx.restore();
  }
}

export default Viperfish;
