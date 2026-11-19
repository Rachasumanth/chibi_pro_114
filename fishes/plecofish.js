/**
 * Bristlenose Pleco (Ancistrus cirrhosus) — Bespoke 2D Top-Down Expressive Chibi Asset
 * Dimensions: 85 x 48 | Native HTML5 Canvas 2D API | Zero external dependencies
 */

const VALID_STATES = new Set([
  'breathing', 'swimming', 'relax', 'left_turn', 'right_turn',
  'eating', 'hungry', 'stress', 'fear', 'shock', 'happy', 'sad'
]);

const ALIASES = { idle: 'breathing', hunger: 'hungry' };

const ONE_SHOT_DURATIONS = {
  left_turn: 0.52,
  right_turn: 0.52,
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
  breathing:  { freq: 2.0, amp: 0.055, turn: 0,     finSpread: 1.0,  mouth: 0.06, jitter: 0,   droop: 0,    bounce: 0    },
  swimming:   { freq: 5.5, amp: 0.15,  turn: 0,     finSpread: 0.92, mouth: 0.08, jitter: 0,   droop: 0,    bounce: 0    },
  relax:      { freq: 1.0, amp: 0.03,  turn: 0,     finSpread: 1.18, mouth: 0.03, jitter: 0,   droop: 0.12, bounce: 0    },
  left_turn:  { freq: 3.8, amp: 0.1,   turn: -0.46, finSpread: 1.15, mouth: 0.08, jitter: 0,   droop: 0,    bounce: 0    },
  right_turn: { freq: 3.8, amp: 0.1,   turn: 0.46,  finSpread: 1.15, mouth: 0.08, jitter: 0,   droop: 0,    bounce: 0    },
  eating:     { freq: 6.2, amp: 0.11,  turn: 0,     finSpread: 1.24, mouth: 0.9,  jitter: 0.4, droop: 0,    bounce: 0.1  },
  hungry:     { freq: 4.5, amp: 0.11,  turn: 0,     finSpread: 1.1,  mouth: 0.52, jitter: 0,   droop: 0,    bounce: 0.06 },
  stress:     { freq: 9.2, amp: 0.085, turn: 0,     finSpread: 0.74, mouth: 0.12, jitter: 1.5, droop: 0.05, bounce: 0    },
  fear:       { freq: 11.8,amp: 0.11,  turn: 0,     finSpread: 0.58, mouth: 0.25, jitter: 2.5, droop: 0.2,  bounce: 0    },
  shock:      { freq: 13.5,amp: 0.04,  turn: 0,     finSpread: 1.38, mouth: 0.8,  jitter: 3.0, droop: 0,    bounce: -0.1 },
  happy:      { freq: 6.0, amp: 0.16,  turn: 0,     finSpread: 1.25, mouth: 0.2,  jitter: 0,   droop: -0.1, bounce: 0.16 },
  sad:        { freq: 1.2, amp: 0.035, turn: 0,     finSpread: 0.68, mouth: 0.03, jitter: 0,   droop: 0.34, bounce: 0    }
};

function lerp(a, b, t) { return a + (b - a) * t; }
function cubicBlend(t) {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

export class Plecofish {
  static metadata = {
    name: 'Bristlenose Pleco',
    category: 'fish',
    baseLength: 85,
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
    // 8-segment broad flat armored catfish-shaped pleco spine (wide head tapering to narrow armored tail)
    const L = 85;
    const W = 48;
    const segs = 8;
    const widths = [0.68, 0.96, 1.00, 0.82, 0.60, 0.42, 0.28, 0.18];
    const pts = [];
    const p = this._currPose;
    const jx = p.jitter > 0 ? Math.sin(this._time * 60) * p.jitter * 0.4 : 0;
    const jy = p.jitter > 0 ? Math.cos(this._time * 68) * p.jitter : 0;

    for (let i = 0; i < segs; i++) {
      const u = i / (segs - 1);
      const x = L * 0.36 - u * L * 0.74 + jx;
      const flex = Math.pow(u, 1.55);
      const wave = Math.sin(this._phase - u * 3.4) * (W * 0.42) * p.amp * 4.5 * flex;
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

  _drawBushySnoutTentacles(ctx, noseFrame) {
    // Signature bushy branched Y-shaped Bristlenose Pleco snout tentacles!
    const wig = Math.sin(this._time * 6.5) * 1.8;
    ctx.save();
    ctx.translate(noseFrame.x, noseFrame.y);
    ctx.rotate(Math.atan2(noseFrame.ty, noseFrame.tx));

    const angles = [-0.95, -0.58, -0.25, 0, 0.25, 0.58, 0.95];
    for (let i = 0; i < angles.length; i++) {
      const a = angles[i];
      const baseX = Math.cos(a) * 10;
      const baseY = Math.sin(a) * 14;
      const len = (i % 2 === 0 ? 11.5 : 8.5);
      const tipX = baseX + Math.cos(a) * len;
      const tipY = baseY + Math.sin(a) * len + wig * (i % 2 === 0 ? 0.5 : -0.4);

      // Main tentacle stem
      ctx.strokeStyle = '#1C140E';
      ctx.lineWidth = 3.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(baseX, baseY);
      ctx.quadraticCurveTo((baseX + tipX) * 0.5, (baseY + tipY) * 0.5 + 1.5 * Math.sign(a), tipX, tipY);
      ctx.stroke();

      ctx.strokeStyle = '#785A3F';
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Y-branch prong on longer bristles
      if (i % 2 === 0) {
        const midX = (baseX + tipX) * 0.55;
        const midY = (baseY + tipY) * 0.55;
        const bAngle = a + (a >= 0 ? 0.45 : -0.45);
        ctx.strokeStyle = '#1C140E';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(midX, midY);
        ctx.lineTo(midX + Math.cos(bAngle) * 5.2, midY + Math.sin(bAngle) * 5.2);
        ctx.stroke();
        ctx.strokeStyle = '#A8825E';
        ctx.lineWidth = 1.1;
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  _drawBroadFanPectoral(ctx, frame, side) {
    // Huge spiky armored fan pectoral fins of a pleco
    const p = this._currPose;
    const flap = Math.sin(this._phase * 0.85 + (side > 0 ? 0 : 0.7)) * 0.18;
    const angle = Math.atan2(frame.ty, frame.tx) + side * (Math.PI * 0.50 + flap + p.turn * side * 0.3);

    ctx.save();
    ctx.translate(frame.x + frame.nx * side * (frame.r * 0.78), frame.y + frame.ny * side * (frame.r * 0.78));
    ctx.rotate(angle);
    ctx.scale(0.88 + 0.2 * p.finSpread, 1);

    const g = ctx.createLinearGradient(0, 0, 26, 0);
    g.addColorStop(0, '#3B281B');
    g.addColorStop(0.6, '#5C402C');
    g.addColorStop(1, 'rgba(120, 90, 63, 0.82)');

    ctx.beginPath();
    ctx.moveTo(0, -5 * side);
    ctx.bezierCurveTo(10, -14 * side, 24, -12 * side, 27, 2 * side);
    ctx.bezierCurveTo(21, 12 * side, 10, 12 * side, -2, 6 * side);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();

    // Pale gold pleco fin spots
    ctx.fillStyle = '#E7C898';
    for (const [sx, sy] of [[8, -4], [15, -6], [20, -2], [12, 3], [18, 4]]) {
      ctx.beginPath();
      ctx.arc(sx, sy * side, 1.35, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = '#1C140E';
    ctx.lineWidth = 2.3;
    ctx.stroke();
    ctx.restore();
  }

  _drawPelvicFan(ctx, frame, side) {
    const angle = Math.atan2(frame.ty, frame.tx) + side * (Math.PI * 0.62);
    ctx.save();
    ctx.translate(frame.x + frame.nx * side * (frame.r * 0.75), frame.y + frame.ny * side * (frame.r * 0.75));
    ctx.rotate(angle);

    ctx.fillStyle = '#4B3322';
    ctx.beginPath();
    ctx.moveTo(0, -3.5 * side);
    ctx.quadraticCurveTo(12, -8 * side, 17, 1 * side);
    ctx.quadraticCurveTo(10, 8 * side, -2, 4 * side);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#1C140E';
    ctx.lineWidth = 1.9;
    ctx.stroke();
    ctx.restore();
  }

  _drawCrescentTail(ctx, tailFrame) {
    const wag = Math.sin(this._phase - 3.5) * 0.34 + this._currPose.turn * 0.5;
    ctx.save();
    ctx.translate(tailFrame.x, tailFrame.y);
    ctx.rotate(Math.atan2(-tailFrame.ty, -tailFrame.tx) + wag);

    const g = ctx.createLinearGradient(0, 0, 24, 0);
    g.addColorStop(0, '#3B281B');
    g.addColorStop(0.6, '#5C402C');
    g.addColorStop(1, '#8B6544');

    ctx.beginPath();
    ctx.moveTo(-2, -5.5);
    ctx.bezierCurveTo(10, -17, 21, -17, 25, -13);
    ctx.quadraticCurveTo(17, 0, 25, 13);
    ctx.bezierCurveTo(21, 17, 10, 17, -2, 5.5);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();

    ctx.fillStyle = '#E7C898';
    for (const [sx, sy] of [[8, -6], [15, -9], [11, 0], [8, 6], [15, 9]]) {
      ctx.beginPath();
      ctx.arc(sx, sy, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = '#1C140E';
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.restore();
  }

  _drawArmoredPlatesAndSpots(ctx, pts) {
    // Overlapping bony scute armor plates down torso
    ctx.strokeStyle = 'rgba(24, 16, 10, 0.52)';
    ctx.lineWidth = 1.6;
    for (let i = 2; i < pts.length - 1; i++) {
      const f = this._frame(pts, i);
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(Math.atan2(f.ty, f.tx));
      ctx.beginPath();
      ctx.moveTo(2, -f.r * 0.92);
      ctx.quadraticCurveTo(-5, 0, 2, f.r * 0.92);
      ctx.stroke();
      ctx.restore();
    }

    // Golden-tan polka speckles across dark armored body
    ctx.fillStyle = 'rgba(231, 200, 152, 0.82)';
    for (let i = 0; i < pts.length - 1; i++) {
      const f = this._frame(pts, i);
      const count = Math.max(2, Math.round(f.r * 0.34));
      for (let k = 0; k < count; k++) {
        const lat = Math.sin(i * 13.7 + k * 6.3) * f.r * 0.8;
        const lon = Math.cos(i * 9.1 + k * 4.7) * 3.8;
        ctx.beginPath();
        ctx.arc(f.x + f.nx * lat + f.tx * lon, f.y + f.ny * lat + f.ty * lon, 1.35 + (k % 2) * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  _drawSailDorsalFin(ctx, pts) {
    // Huge billowing sail-like spotted dorsal fin fanning gently to one side in top-down view!
    const sway = Math.sin(this._phase - 1.5) * 6.5;
    const p2 = pts[2];
    const p6 = pts[6];
    const mid = pts[4];

    ctx.save();
    const g = ctx.createLinearGradient(p2.x, p2.y, p6.x, p6.y + sway);
    g.addColorStop(0, 'rgba(69, 46, 30, 0.94)');
    g.addColorStop(0.6, 'rgba(92, 64, 44, 0.88)');
    g.addColorStop(1, 'rgba(139, 101, 68, 0.82)');

    ctx.beginPath();
    ctx.moveTo(p2.x, p2.y);
    ctx.bezierCurveTo(
      mid.x + 6, mid.y - 11 + sway * 0.7,
      p6.x + 8, p6.y - 12 + sway,
      p6.x - 4, p6.y + sway * 0.4
    );
    ctx.quadraticCurveTo(mid.x, mid.y + 3 + sway * 0.25, p2.x, p2.y);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();

    // Spotted sail rays
    ctx.fillStyle = '#F3D8AC';
    for (let k = 0; k < 5; k++) {
      const t = (k + 0.5) / 5;
      const sx = lerp(p2.x, p6.x, t);
      const sy = lerp(p2.y, p6.y, t) - 5.5 + sway * t * 0.65;
      ctx.beginPath();
      ctx.arc(sx, sy, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = '#1C140E';
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

    ctx.fillStyle = 'rgba(248, 113, 113, 0.34)';
    ctx.beginPath();
    ctx.ellipse(-4, -17, 4.8, 2.7, -0.2, 0, Math.PI * 2);
    ctx.ellipse(-4, 17, 4.8, 2.7, 0.2, 0, Math.PI * 2);
    ctx.fill();

    for (const side of [-1, 1]) {
      const ex = 2.5;
      const ey = side * 12.8;
      const r = st === 'shock' ? 7.2 : 6.0;

      ctx.save();
      ctx.translate(ex, ey);

      if (st === 'happy') {
        ctx.strokeStyle = '#F3D8AC';
        ctx.lineWidth = 2.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, side, 4.2, side > 0 ? Math.PI * 1.15 : Math.PI * 0.15, side > 0 ? Math.PI * 1.85 : Math.PI * 0.85);
        ctx.stroke();
      } else if (st === 'stress') {
        ctx.strokeStyle = '#F3D8AC';
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
        ctx.strokeStyle = '#1C140E';
        ctx.lineWidth = 1.9;
        ctx.stroke();

        const irisR = st === 'shock' ? r * 0.42 : r * 0.72;
        const sx = st === 'fear' ? Math.sin(t * 58) * 1.0 : 0;
        const sy = st === 'fear' ? Math.cos(t * 64) * 1.0 : 0;
        const ig = ctx.createRadialGradient(0.8 + sx, -0.8 + sy, 0.6, sx, sy, irisR);
        ig.addColorStop(0, '#FDE68A');
        ig.addColorStop(0.55, '#D97706');
        ig.addColorStop(1, '#451A03');
        ctx.fillStyle = ig;
        ctx.beginPath();
        ctx.arc(1 + sx, sy, irisR, 0, Math.PI * 2);
        ctx.fill();

        const pr = st === 'shock' ? 1.6 : (st === 'fear' ? 2.0 : irisR * 0.55);
        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        ctx.arc(1.2 + sx, sy, pr, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(2.2, -1.7, 1.9, 0, Math.PI * 2);
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
            ctx.lineTo(1.1 + Math.cos(a) * rad, Math.sin(a) * rad);
          }
          ctx.closePath();
          ctx.fill();
        }

        if (st === 'relax') {
          ctx.fillStyle = '#5C402C';
          ctx.beginPath();
          ctx.arc(0, 0, r + 0.4, Math.PI, Math.PI * 2);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#F3D8AC';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-r, 0);
          ctx.quadraticCurveTo(0, 1.5, r, 0);
          ctx.stroke();
        }

        if (st === 'sad' || st === 'fear') {
          ctx.fillStyle = 'rgba(125, 211, 252, 0.8)';
          ctx.beginPath();
          ctx.ellipse(-1.6, 2.4 * side, 2.8, 1.5, 0.2 * side, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    if (st === 'shock') {
      ctx.save();
      ctx.translate(16, -22);
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
      ctx.translate(-5, -22 + Math.sin(t * 10) * 1.8);
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
      ctx.translate(9, -22 + Math.sin(t * 8) * 1.8);
      ctx.fillStyle = '#FACC15';
      ctx.strokeStyle = '#B45309';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4;
        const rad = k % 2 === 0 ? 5.6 : 1.9;
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
    const pelvFrame = this._frame(pts, 4);
    const tailFrame = this._frame(pts, pts.length - 1);

    // Shadow
    ctx.save();
    ctx.translate(0, 5);
    ctx.fillStyle = 'rgba(20, 14, 10, 0.24)';
    ctx.beginPath();
    ctx.ellipse(2, 0, 32, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    this._drawBushySnoutTentacles(ctx, noseFrame);
    this._drawBroadFanPectoral(ctx, pecFrame, -1);
    this._drawBroadFanPectoral(ctx, pecFrame, 1);
    this._drawPelvicFan(ctx, pelvFrame, -1);
    this._drawPelvicFan(ctx, pelvFrame, 1);
    this._drawCrescentTail(ctx, tailFrame);

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
      ctx.quadraticCurveTo(n.x + nf.tx * 12 - nf.nx * 14, n.y + nf.ty * 12 - nf.ny * 14, n.x + nf.tx * 11, n.y + nf.ty * 11);
      ctx.closePath();
    };

    ctx.save();
    traceBody();
    const bodyGrad = ctx.createRadialGradient(8, -4, 4, 0, 0, 44);
    bodyGrad.addColorStop(0, '#6B4E35');
    bodyGrad.addColorStop(0.55, '#4A3423');
    bodyGrad.addColorStop(1, '#261A11');
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.clip();

    this._drawArmoredPlatesAndSpots(ctx, pts);

    // Glossy chibi highlight on broad armored head
    ctx.fillStyle = 'rgba(255, 245, 225, 0.22)';
    ctx.beginPath();
    ctx.ellipse(8, -4, 14, 6.0, -0.05, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    traceBody();
    ctx.strokeStyle = '#1C140E';
    ctx.lineWidth = 2.6;
    ctx.lineJoin = 'round';
    ctx.stroke();

    this._drawSailDorsalFin(ctx, pts);
    this._drawEyesAndEmotes(ctx, headFrame);
    ctx.restore();
  }
}

export default Plecofish;
