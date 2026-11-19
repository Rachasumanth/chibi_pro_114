/**
 * Giant Oarfish (Regalecus glesne) — Bespoke 2D Top-Down Expressive Chibi Asset
 * Dimensions: 250 x 36 | Native HTML5 Canvas 2D API | Zero external dependencies
 */

const VALID_STATES = new Set([
  'breathing', 'swimming', 'relax', 'left_turn', 'right_turn',
  'eating', 'hungry', 'stress', 'fear', 'shock', 'happy', 'sad'
]);

const ALIASES = { idle: 'breathing', hunger: 'hungry' };

const ONE_SHOT_DURATIONS = {
  left_turn: 0.56,
  right_turn: 0.56,
  eating: 0.64,
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
  breathing:  { freq: 1.9, amp: 0.09,  turn: 0,     crestFlare: 1.0,  mouth: 0.05, jitter: 0,   droop: 0,    bounce: 0    },
  swimming:   { freq: 5.0, amp: 0.23,  turn: 0,     crestFlare: 0.9,  mouth: 0.07, jitter: 0,   droop: 0,    bounce: 0    },
  relax:      { freq: 0.95,amp: 0.05,  turn: 0,     crestFlare: 1.18, mouth: 0.02, jitter: 0,   droop: 0.12, bounce: 0    },
  left_turn:  { freq: 3.6, amp: 0.14,  turn: -0.52, crestFlare: 1.15, mouth: 0.06, jitter: 0,   droop: 0,    bounce: 0    },
  right_turn: { freq: 3.6, amp: 0.14,  turn: 0.52,  crestFlare: 1.15, mouth: 0.06, jitter: 0,   droop: 0,    bounce: 0    },
  eating:     { freq: 6.0, amp: 0.15,  turn: 0,     crestFlare: 1.25, mouth: 0.92, jitter: 0,   droop: 0,    bounce: 0.1  },
  hungry:     { freq: 4.4, amp: 0.14,  turn: 0,     crestFlare: 1.12, mouth: 0.48, jitter: 0,   droop: 0,    bounce: 0.05 },
  stress:     { freq: 9.0, amp: 0.12,  turn: 0,     crestFlare: 0.72, mouth: 0.1,  jitter: 1.5, droop: 0.05, bounce: 0    },
  fear:       { freq: 11.8,amp: 0.15,  turn: 0,     crestFlare: 0.55, mouth: 0.25, jitter: 2.5, droop: 0.2,  bounce: 0    },
  shock:      { freq: 13.5,amp: 0.05,  turn: 0,     crestFlare: 1.42, mouth: 0.85, jitter: 3.0, droop: 0,    bounce: -0.1 },
  happy:      { freq: 5.8, amp: 0.21,  turn: 0,     crestFlare: 1.28, mouth: 0.18, jitter: 0,   droop: -0.1, bounce: 0.14 },
  sad:        { freq: 1.1, amp: 0.05,  turn: 0,     crestFlare: 0.66, mouth: 0.03, jitter: 0,   droop: 0.34, bounce: 0    }
};

function lerp(a, b, t) { return a + (b - a) * t; }
function cubicBlend(t) {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

export class Oarfish {
  static metadata = {
    name: 'Giant Oarfish',
    category: 'fish',
    baseLength: 250,
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
    // 16-segment super-long undulating gleaming silver ribbon Giant Oarfish!
    const L = 250;
    const W = 36;
    const segs = 16;
    const widths = [
      0.42, 0.94, 1.00, 0.90, 0.82, 0.75, 0.69, 0.63,
      0.57, 0.50, 0.43, 0.36, 0.29, 0.22, 0.14, 0.07
    ];
    const pts = [];
    const p = this._currPose;
    const jx = p.jitter > 0 ? Math.sin(this._time * 58) * p.jitter * 0.4 : 0;
    const jy = p.jitter > 0 ? Math.cos(this._time * 66) * p.jitter : 0;

    for (let i = 0; i < segs; i++) {
      const u = i / (segs - 1);
      const x = L * 0.46 - u * L * 0.92 + jx;
      const flex = Math.pow(u, 1.2);
      const wave = Math.sin(this._phase - u * 7.6) * (W * 0.78) * p.amp * 4.5 * flex;
      const turnCurve = p.turn * L * 0.24 * Math.pow(u, 1.45);
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

  _drawOarPelvicStreamers(ctx, neckFrame) {
    // Iconic twin crimson oar-tipped pelvic streamers trailing gracefully on both sides!
    const t = this._time;
    const flare = this._currPose.crestFlare;

    for (const side of [-1, 1]) {
      const baseX = neckFrame.x + neckFrame.nx * side * (neckFrame.r * 0.75);
      const baseY = neckFrame.y + neckFrame.ny * side * (neckFrame.r * 0.75);
      const baseAng = Math.atan2(neckFrame.ty, neckFrame.tx) + side * (Math.PI * 0.68 + Math.sin(this._phase - 0.6) * 0.16);

      ctx.save();
      ctx.translate(baseX, baseY);
      ctx.rotate(baseAng);

      const tipX = 36 * flare;
      const tipY = Math.sin(t * 4.2 + side) * 6;

      ctx.strokeStyle = '#991B1B';
      ctx.lineWidth = 3.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(tipX * 0.5, tipY * 0.5 + side * 4, tipX, tipY);
      ctx.stroke();

      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Cute crimson oar paddle tip!
      ctx.fillStyle = '#EF4444';
      ctx.strokeStyle = '#7F1D1D';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(tipX + 2, tipY, 5.2, 2.8, 0.2 * side, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }
  }

  _drawCrimsonCrestCrownPlumes(ctx, headFrame) {
    // Dramatic bright crimson-red royal crest crown plumes fanning from forehead!
    const flare = this._currPose.crestFlare;
    const wave = Math.sin(this._phase * 0.9) * 0.18;

    ctx.save();
    ctx.translate(headFrame.x, headFrame.y);
    ctx.rotate(Math.atan2(headFrame.ty, headFrame.tx));

    const plumeSpecs = [
      { ang: -0.45, len: 26 },
      { ang: -0.22, len: 34 },
      { ang: 0.0,   len: 38 },
      { ang: 0.22,  len: 34 },
      { ang: 0.45,  len: 26 }
    ];

    for (let i = 0; i < plumeSpecs.length; i++) {
      const ps = plumeSpecs[i];
      const a = Math.PI + ps.ang * flare + wave * (1 - Math.abs(ps.ang));
      const len = ps.len * (0.85 + 0.18 * flare);
      const ex = 6 + Math.cos(a) * len;
      const ey = Math.sin(a) * len;
      const cx = 6 + Math.cos(a - 0.15) * (len * 0.55);
      const cy = Math.sin(a - 0.15) * (len * 0.55) + Math.sin(this._time * 5 + i) * 3;

      ctx.strokeStyle = '#7F1D1D';
      ctx.lineWidth = 4.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.quadraticCurveTo(cx, cy, ex, ey);
      ctx.stroke();

      ctx.strokeStyle = '#F43F5E';
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Glowing scarlet plume tip bead
      ctx.fillStyle = '#FDA4AF';
      ctx.beginPath();
      ctx.arc(ex, ey, 2.3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  _drawUndulatingRedDorsalRibbon(ctx, pts) {
    // Continuous undulating crimson-red dorsal fin ribbon running the ENTIRE length of the oarfish!
    ctx.save();
    ctx.beginPath();
    for (let i = 1; i < pts.length; i++) {
      const sway = Math.sin(this._phase * 1.4 - i * 0.85) * 6.8;
      if (i === 1) ctx.moveTo(pts[i].x, pts[i].y);
      else ctx.lineTo(pts[i].x, pts[i].y + sway);
    }
    ctx.strokeStyle = 'rgba(185, 28, 28, 0.88)';
    ctx.lineWidth = 7.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    ctx.strokeStyle = 'rgba(248, 113, 113, 0.92)';
    ctx.lineWidth = 3.6;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 228, 230, 0.72)';
    ctx.lineWidth = 1.3;
    ctx.stroke();
    ctx.restore();
  }

  _drawEyesAndEmotes(ctx, headFrame) {
    const st = this._state;
    const t = this._time;

    ctx.save();
    ctx.translate(headFrame.x, headFrame.y);
    ctx.rotate(Math.atan2(headFrame.ty, headFrame.tx));

    ctx.fillStyle = 'rgba(244, 63, 94, 0.36)';
    ctx.beginPath();
    ctx.ellipse(-2, -13, 4.2, 2.3, -0.18, 0, Math.PI * 2);
    ctx.ellipse(-2, 13, 4.2, 2.3, 0.18, 0, Math.PI * 2);
    ctx.fill();

    for (const side of [-1, 1]) {
      const ex = 4.2;
      const ey = side * 10.8;
      const r = st === 'shock' ? 7.4 : 6.2;

      ctx.save();
      ctx.translate(ex, ey);

      if (st === 'happy') {
        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 2.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, side, 4.2, side > 0 ? Math.PI * 1.15 : Math.PI * 0.15, side > 0 ? Math.PI * 1.85 : Math.PI * 0.85);
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

        const irisR = st === 'shock' ? r * 0.42 : r * 0.72;
        const sx = st === 'fear' ? Math.sin(t * 58) * 1.0 : 0;
        const sy = st === 'fear' ? Math.cos(t * 64) * 1.0 : 0;
        const ig = ctx.createRadialGradient(1 + sx, -1 + sy, 0.6, sx, sy, irisR);
        ig.addColorStop(0, '#FECDD3');
        ig.addColorStop(0.55, '#E11D48');
        ig.addColorStop(1, '#4C0519');
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
      ctx.translate(16, -21);
      ctx.fillStyle = '#EF4444';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.roundRect(-2.5, -13, 5, 9, 2);
      ctx.stroke();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fill();
      ctx.restore();
    } else if (st === 'fear' || st === 'stress') {
      ctx.save();
      ctx.translate(-4, -21 + Math.sin(t * 10) * 1.7);
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
      ctx.translate(8, -21 + Math.sin(t * 8) * 1.7);
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
    const bounceScale = 1 + Math.sin(this._time * 8.0) * this._currPose.bounce * 0.22;
    ctx.scale(this.scale * bounceScale, this.scale / Math.sqrt(Math.max(0.7, bounceScale)));

    const pts = this._buildSpine();
    const headFrame = this._frame(pts, 1);
    const neckFrame = this._frame(pts, 2);

    // Shadow
    ctx.save();
    ctx.translate(0, 6);
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.18)';
    ctx.lineWidth = 22;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      if (i === 0) ctx.moveTo(pts[i].x, pts[i].y); else ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();
    ctx.restore();

    this._drawOarPelvicStreamers(ctx, neckFrame);

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
      for (let i = 1; i < leftPts.length; i++) {
        const p0 = leftPts[i - 1];
        const p1 = leftPts[i];
        ctx.quadraticCurveTo(p0.x, p0.y, (p0.x + p1.x) * 0.5, (p0.y + p1.y) * 0.5);
      }
      const tail = pts[pts.length - 1];
      ctx.lineTo(tail.x - 8, tail.y);
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
    bodyGrad.addColorStop(0, '#94A3B8');
    bodyGrad.addColorStop(0.24, '#E2E8F0');
    bodyGrad.addColorStop(0.5, '#FFFFFF');
    bodyGrad.addColorStop(0.76, '#E0F2FE');
    bodyGrad.addColorStop(1, '#64748B');
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.clip();

    // Subtle dusky vertical silver-blue zebra flecks along ribbon body
    ctx.fillStyle = 'rgba(71, 85, 105, 0.30)';
    for (let i = 3; i < pts.length - 1; i++) {
      const f = this._frame(pts, i);
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(Math.atan2(f.ty, f.tx));
      ctx.fillRect(-1.5, -f.r * 0.85, 3, f.r * 1.7);
      ctx.restore();
    }

    // Gleaming metallic mirror streak
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.78)';
    ctx.lineWidth = 4.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 1; i < pts.length - 2; i++) {
      if (i === 1) ctx.moveTo(pts[i].x, pts[i].y - 3);
      else ctx.lineTo(pts[i].x, pts[i].y - 3);
    }
    ctx.stroke();

    ctx.restore();

    traceBody();
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2.4;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Continuous crimson dorsal ribbon + royal crimson crest plumes + expressive chibi eyes
    this._drawUndulatingRedDorsalRibbon(ctx, pts);
    this._drawCrimsonCrestCrownPlumes(ctx, headFrame);
    this._drawEyesAndEmotes(ctx, headFrame);
    ctx.restore();
  }
}

export default Oarfish;
