/**
 * Tiger Oscar (Astronotus ocellatus) — Bespoke 2D Top-Down Expressive Chibi Asset
 * Dimensions: 95 x 52 | Native HTML5 Canvas 2D API | Zero external dependencies
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
  breathing:  { freq: 2.2, amp: 0.065, turn: 0,     finSpread: 1.0,  mouth: 0.06, jitter: 0,   droop: 0,    bounce: 0    },
  swimming:   { freq: 5.8, amp: 0.16,  turn: 0,     finSpread: 0.9,  mouth: 0.08, jitter: 0,   droop: 0,    bounce: 0    },
  relax:      { freq: 1.2, amp: 0.035, turn: 0,     finSpread: 1.18, mouth: 0.03, jitter: 0,   droop: 0.12, bounce: 0    },
  left_turn:  { freq: 4.0, amp: 0.11,  turn: -0.48, finSpread: 1.15, mouth: 0.08, jitter: 0,   droop: 0,    bounce: 0    },
  right_turn: { freq: 4.0, amp: 0.11,  turn: 0.48,  finSpread: 1.15, mouth: 0.08, jitter: 0,   droop: 0,    bounce: 0    },
  eating:     { freq: 6.5, amp: 0.14,  turn: 0,     finSpread: 1.22, mouth: 0.95, jitter: 0,   droop: 0,    bounce: 0.12 },
  hungry:     { freq: 5.0, amp: 0.13,  turn: 0,     finSpread: 1.1,  mouth: 0.55, jitter: 0,   droop: 0,    bounce: 0.08 },
  stress:     { freq: 9.2, amp: 0.09,  turn: 0,     finSpread: 0.74, mouth: 0.12, jitter: 1.5, droop: 0.05, bounce: 0    },
  fear:       { freq: 12.0,amp: 0.12,  turn: 0,     finSpread: 0.58, mouth: 0.25, jitter: 2.6, droop: 0.2,  bounce: 0    },
  shock:      { freq: 13.5,amp: 0.04,  turn: 0,     finSpread: 1.35, mouth: 0.85, jitter: 3.1, droop: 0,    bounce: -0.1 },
  happy:      { freq: 6.4, amp: 0.17,  turn: 0,     finSpread: 1.24, mouth: 0.22, jitter: 0,   droop: -0.1, bounce: 0.18 },
  sad:        { freq: 1.3, amp: 0.035, turn: 0,     finSpread: 0.68, mouth: 0.04, jitter: 0,   droop: 0.34, bounce: 0    }
};

function lerp(a, b, t) { return a + (b - a) * t; }
function cubicBlend(t) {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

export class Oscarfish {
  static metadata = {
    name: 'Tiger Oscar',
    category: 'fish',
    baseLength: 95,
    baseWidth: 52
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
    // 8-segment plump velvety oval Oscar spine
    const L = 95;
    const W = 52;
    const segs = 8;
    const widths = [0.46, 0.86, 1.00, 0.98, 0.86, 0.66, 0.44, 0.26];
    const pts = [];
    const p = this._currPose;
    const jx = p.jitter > 0 ? Math.sin(this._time * 58) * p.jitter * 0.4 : 0;
    const jy = p.jitter > 0 ? Math.cos(this._time * 66) * p.jitter : 0;

    for (let i = 0; i < segs; i++) {
      const u = i / (segs - 1);
      const x = L * 0.39 - u * L * 0.74 + jx;
      const flex = Math.pow(u, 1.45);
      const wave = Math.sin(this._phase - u * 3.4) * (W * 0.44) * p.amp * 4.8 * flex;
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
    const flap = Math.sin(this._phase * 0.95 + (side > 0 ? 0 : 0.7)) * 0.26;
    const angle = Math.atan2(frame.ty, frame.tx) + side * (Math.PI * 0.56 + flap + p.turn * side * 0.35);

    ctx.save();
    ctx.translate(frame.x + frame.nx * side * (frame.r * 0.8), frame.y + frame.ny * side * (frame.r * 0.8));
    ctx.rotate(angle);
    ctx.scale(0.85 + 0.22 * p.finSpread, 1);

    const g = ctx.createLinearGradient(0, 0, 22, 0);
    g.addColorStop(0, '#18181B');
    g.addColorStop(0.62, '#27272A');
    g.addColorStop(1, 'rgba(255, 107, 26, 0.82)');

    ctx.beginPath();
    ctx.moveTo(0, -5 * side);
    ctx.bezierCurveTo(10, -12 * side, 21, -8 * side, 23, 1 * side);
    ctx.bezierCurveTo(19, 10 * side, 9, 10 * side, -2, 5 * side);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();

    ctx.strokeStyle = 'rgba(253, 186, 116, 0.45)';
    ctx.lineWidth = 1.1;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(2, i * 1.8 * side);
      ctx.lineTo(19 - Math.abs(i) * 1.5, i * 3.4 * side);
      ctx.stroke();
    }

    ctx.strokeStyle = '#09090B';
    ctx.lineWidth = 2.1;
    ctx.stroke();
    ctx.restore();
  }

  _drawRoundedTailWithOcellus(ctx, tailFrame, peduncleFrame) {
    // Broad velvety rounded Oscar paddle tail with neon-orange rim + glowing ocellus tail spot!
    const wag = Math.sin(this._phase - 3.6) * 0.32 + this._currPose.turn * 0.48;
    ctx.save();
    ctx.translate(tailFrame.x, tailFrame.y);
    ctx.rotate(Math.atan2(-tailFrame.ty, -tailFrame.tx) + wag);

    const g = ctx.createRadialGradient(4, 0, 3, 14, 0, 25);
    g.addColorStop(0, '#18181B');
    g.addColorStop(0.7, '#27272A');
    g.addColorStop(0.88, '#F97316');
    g.addColorStop(1, '#FB923C');

    ctx.beginPath();
    ctx.moveTo(-2, -9);
    ctx.bezierCurveTo(10, -20, 26, -18, 27, 0);
    ctx.bezierCurveTo(26, 18, 10, 20, -2, 9);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();

    ctx.strokeStyle = 'rgba(254, 215, 170, 0.35)';
    ctx.lineWidth = 1.1;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(2, i * 1.6);
      ctx.lineTo(23 - Math.abs(i) * 1.5, i * 4.5);
      ctx.stroke();
    }

    ctx.strokeStyle = '#09090B';
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.restore();

    // Signature glowing orange-ringed black ocellus eye-spot at tail base!
    ctx.save();
    ctx.translate(peduncleFrame.x, peduncleFrame.y);
    const pulse = 0.85 + 0.15 * Math.sin(this._time * 4.5);

    const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 11.5 * pulse);
    glow.addColorStop(0, 'rgba(255, 115, 29, 0.95)');
    glow.addColorStop(0.65, 'rgba(249, 115, 22, 0.65)');
    glow.addColorStop(1, 'rgba(249, 115, 22, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 11.5 * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FF6B1A';
    ctx.beginPath();
    ctx.arc(0, 0, 7.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#09090B';
    ctx.beginPath();
    ctx.arc(0, 0, 5.0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.arc(1.5, -1.6, 1.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawTigerBlotches(ctx, pts) {
    // Organic neon-orange tiger marbling blotches splashed across velvety charcoal-black body
    const blotches = [
      { idx: 1, off: -9,  rx: 7.5, ry: 4.8, rot: -0.4 },
      { idx: 1, off: 10,  rx: 6.5, ry: 4.2, rot: 0.35 },
      { idx: 2, off: -13, rx: 9.5, ry: 6.2, rot: 0.25 },
      { idx: 2, off: 6,   rx: 8.2, ry: 5.5, rot: -0.3 },
      { idx: 3, off: -4,  rx: 10.5,ry: 6.0, rot: -0.2 },
      { idx: 3, off: 14,  rx: 8.8, ry: 5.4, rot: 0.4 },
      { idx: 4, off: -12, rx: 9.2, ry: 5.6, rot: 0.3 },
      { idx: 4, off: 5,   rx: 8.0, ry: 4.8, rot: -0.35 },
      { idx: 5, off: -6,  rx: 7.2, ry: 4.5, rot: 0.15 },
      { idx: 5, off: 8,   rx: 6.5, ry: 4.0, rot: -0.2 }
    ];

    for (const b of blotches) {
      const f = this._frame(pts, b.idx);
      const bx = f.x + f.nx * b.off;
      const by = f.y + f.ny * b.off;
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(Math.atan2(f.ty, f.tx) + b.rot);

      const g = ctx.createRadialGradient(0, 0, 1, 0, 0, b.rx * 1.15);
      g.addColorStop(0, '#FF8A1E');
      g.addColorStop(0.62, '#F97316');
      g.addColorStop(1, 'rgba(234, 88, 12, 0.25)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(0, 0, b.rx, b.ry, 0, 0, Math.PI * 2);
      ctx.fill();

      // Inner bright tangerine core
      ctx.fillStyle = 'rgba(254, 215, 170, 0.45)';
      ctx.beginPath();
      ctx.ellipse(-1.2, -0.8, b.rx * 0.42, b.ry * 0.38, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  _drawEyesAndEmotes(ctx, headFrame) {
    const st = this._state;
    const t = this._time;

    ctx.save();
    ctx.translate(headFrame.x, headFrame.y);
    ctx.rotate(Math.atan2(headFrame.ty, headFrame.tx));

    // Cute pouty oscar lips opening on eating/hungry/shock
    const m = this._currPose.mouth;
    const chomp = this._state === 'hungry' ? (0.5 + 0.5 * Math.sin(t * 11)) * m : m;
    if (chomp > 0.12) {
      ctx.fillStyle = '#450A0A';
      ctx.beginPath();
      ctx.ellipse(15 + chomp * 3, 0, 4 + chomp * 3.5, 7 + chomp * 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FB7185';
      ctx.beginPath();
      ctx.ellipse(14 + chomp * 2, 0, 2.2 + chomp * 1.5, 4 + chomp * 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Rosy cheek blushes
    ctx.fillStyle = 'rgba(255, 115, 130, 0.42)';
    ctx.beginPath();
    ctx.ellipse(-4, -17.5, 5.5, 3.2, -0.2, 0, Math.PI * 2);
    ctx.ellipse(-4, 17.5, 5.5, 3.2, 0.2, 0, Math.PI * 2);
    ctx.fill();

    for (const side of [-1, 1]) {
      const ex = 4.5;
      const ey = side * 14.5;
      const r = st === 'shock' ? 8.2 : 6.9;

      ctx.save();
      ctx.translate(ex, ey);

      if (st === 'happy') {
        ctx.strokeStyle = '#FFEDD5';
        ctx.lineWidth = 2.9;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, side, 4.8, side > 0 ? Math.PI * 1.15 : Math.PI * 0.15, side > 0 ? Math.PI * 1.85 : Math.PI * 0.85);
        ctx.stroke();
      } else if (st === 'stress') {
        ctx.strokeStyle = '#FFEDD5';
        ctx.lineWidth = 2.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-3.5, -3.5 * side);
        ctx.lineTo(2.5, 0);
        ctx.lineTo(-3.5, 3.5 * side);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#09090B';
        ctx.lineWidth = 2.0;
        ctx.stroke();

        const irisR = st === 'shock' ? r * 0.42 : r * 0.72;
        const sx = st === 'fear' ? Math.sin(t * 56) * 1.0 : 0;
        const sy = st === 'fear' ? Math.cos(t * 64) * 1.0 : 0;
        const ig = ctx.createRadialGradient(1 + sx, -1 + sy, 0.6, sx, sy, irisR);
        ig.addColorStop(0, '#FED7AA');
        ig.addColorStop(0.5, '#F97316');
        ig.addColorStop(1, '#9A3412');
        ctx.fillStyle = ig;
        ctx.beginPath();
        ctx.arc(1 + sx, sy, irisR, 0, Math.PI * 2);
        ctx.fill();

        const pr = st === 'shock' ? 1.8 : (st === 'fear' ? 2.2 : irisR * 0.55);
        ctx.fillStyle = '#09090B';
        ctx.beginPath();
        ctx.arc(1.3 + sx, sy, pr, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(2.5, -2.0, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-1.0, 1.9, 1.0, 0, Math.PI * 2);
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
          ctx.fillStyle = '#27272A';
          ctx.beginPath();
          ctx.arc(0, 0, r + 0.4, Math.PI, Math.PI * 2);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#FFEDD5';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(-r, 0);
          ctx.quadraticCurveTo(0, 1.7, r, 0);
          ctx.stroke();
        }

        if (st === 'sad' || st === 'fear') {
          ctx.fillStyle = 'rgba(125, 211, 252, 0.8)';
          ctx.beginPath();
          ctx.ellipse(-2, 2.8 * side, 3.2, 1.7, 0.2 * side, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    if (st === 'shock') {
      ctx.save();
      ctx.translate(16, -24);
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
      ctx.translate(10, -24 + Math.sin(t * 8) * 2);
      ctx.fillStyle = '#FACC15';
      ctx.strokeStyle = '#B45309';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4;
        const rad = k % 2 === 0 ? 6.2 : 2.1;
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
    const pecFrame = this._frame(pts, 2);
    const peduncleFrame = this._frame(pts, pts.length - 2);
    const tailFrame = this._frame(pts, pts.length - 1);

    // Shadow
    ctx.save();
    ctx.translate(0, 6);
    ctx.fillStyle = 'rgba(9, 9, 11, 0.24)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 36, 23, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    this._drawPectoralFin(ctx, pecFrame, -1);
    this._drawPectoralFin(ctx, pecFrame, 1);
    this._drawRoundedTailWithOcellus(ctx, tailFrame, peduncleFrame);

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
      ctx.moveTo(n.x + nf.tx * 11, n.y + nf.ty * 11);
      ctx.quadraticCurveTo(n.x + nf.tx * 10 + nf.nx * 10, n.y + nf.ty * 10 + nf.ny * 10, leftPts[1].x, leftPts[1].y);
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
      ctx.quadraticCurveTo(n.x + nf.tx * 10 - nf.nx * 10, n.y + nf.ty * 10 - nf.ny * 10, n.x + nf.tx * 11, n.y + nf.ty * 11);
      ctx.closePath();
    };

    ctx.save();
    traceBody();
    const bodyGrad = ctx.createRadialGradient(8, -4, 4, 0, 0, 48);
    bodyGrad.addColorStop(0, '#3F3F46');
    bodyGrad.addColorStop(0.55, '#27272A');
    bodyGrad.addColorStop(1, '#111113');
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.clip();

    this._drawTigerBlotches(ctx, pts);

    // Glossy jelly-bean chibi dorsal highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.24)';
    ctx.beginPath();
    ctx.ellipse(5, -5, 19, 6.5, -0.05, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    traceBody();
    ctx.strokeStyle = '#09090B';
    ctx.lineWidth = 2.8;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Velvety black-and-orange dorsal fin ridge
    ctx.save();
    ctx.beginPath();
    for (let i = 2; i < pts.length - 1; i++) {
      const sway = Math.sin(this._phase - i * 0.6) * 3.8;
      if (i === 2) ctx.moveTo(pts[i].x, pts[i].y);
      else ctx.lineTo(pts[i].x, pts[i].y + sway);
    }
    ctx.strokeStyle = '#18181B';
    ctx.lineWidth = 6.2;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.strokeStyle = '#FB923C';
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.restore();

    // Re-draw glowing ocellus on top of tail base so it pops cleanly
    this._drawRoundedTailWithOcellus(ctx, tailFrame, peduncleFrame);

    this._drawEyesAndEmotes(ctx, headFrame);
    ctx.restore();
  }
}

export default Oscarfish;
