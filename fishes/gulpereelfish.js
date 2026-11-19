/**
 * Pelican Gulper Eel (Eurypharynx pelecanoides) — Bespoke 2D Top-Down Expressive Chibi Asset
 * Dimensions: 165 x 48 | Native HTML5 Canvas 2D API | Zero external dependencies
 */

const VALID_STATES = new Set([
  'breathing', 'swimming', 'relax', 'left_turn', 'right_turn',
  'eating', 'hungry', 'stress', 'fear', 'shock', 'happy', 'sad'
]);

const ALIASES = { idle: 'breathing', hunger: 'hungry' };

const ONE_SHOT_DURATIONS = {
  left_turn: 0.54,
  right_turn: 0.54,
  eating: 0.68,
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
  breathing:  { freq: 2.0, amp: 0.08,  turn: 0,     pouch: 0.12, jitter: 0,   droop: 0,    bounce: 0    },
  swimming:   { freq: 5.4, amp: 0.22,  turn: 0,     pouch: 0.16, jitter: 0,   droop: 0,    bounce: 0    },
  relax:      { freq: 1.0, amp: 0.045, turn: 0,     pouch: 0.05, jitter: 0,   droop: 0.12, bounce: 0    },
  left_turn:  { freq: 3.8, amp: 0.14,  turn: -0.55, pouch: 0.18, jitter: 0,   droop: 0,    bounce: 0    },
  right_turn: { freq: 3.8, amp: 0.14,  turn: 0.55,  pouch: 0.18, jitter: 0,   droop: 0,    bounce: 0    },
  eating:     { freq: 6.4, amp: 0.16,  turn: 0,     pouch: 1.0,  jitter: 0.5, droop: 0,    bounce: 0.12 },
  hungry:     { freq: 4.6, amp: 0.15,  turn: 0,     pouch: 0.68, jitter: 0,   droop: 0,    bounce: 0.06 },
  stress:     { freq: 9.2, amp: 0.12,  turn: 0,     pouch: 0.35, jitter: 1.6, droop: 0.05, bounce: 0    },
  fear:       { freq: 12.2,amp: 0.15,  turn: 0,     pouch: 0.45, jitter: 2.6, droop: 0.2,  bounce: 0    },
  shock:      { freq: 13.8,amp: 0.06,  turn: 0,     pouch: 0.92, jitter: 3.1, droop: 0,    bounce: -0.1 },
  happy:      { freq: 5.8, amp: 0.20,  turn: 0,     pouch: 0.32, jitter: 0,   droop: -0.1, bounce: 0.16 },
  sad:        { freq: 1.2, amp: 0.05,  turn: 0,     pouch: 0.04, jitter: 0,   droop: 0.32, bounce: 0    }
};

function lerp(a, b, t) { return a + (b - a) * t; }
function cubicBlend(t) {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

export class Gulpereelfish {
  static metadata = {
    name: 'Pelican Gulper Eel',
    category: 'fish',
    baseLength: 165,
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
    // 14-segment serpentine gulper eel: massive expandable pelican head tapering into whip-thin black eel tail!
    const L = 165;
    const W = 48;
    const segs = 14;
    const pouchBoost = 1 + this._currPose.pouch * 0.42;
    const baseWidths = [
      0.72 * pouchBoost, 1.00 * pouchBoost, 0.92 * pouchBoost, 0.56,
      0.34, 0.27, 0.23, 0.19, 0.16, 0.13, 0.10, 0.08, 0.06, 0.045
    ];
    const pts = [];
    const p = this._currPose;
    const jx = p.jitter > 0 ? Math.sin(this._time * 60) * p.jitter * 0.4 : 0;
    const jy = p.jitter > 0 ? Math.cos(this._time * 68) * p.jitter : 0;

    for (let i = 0; i < segs; i++) {
      const u = i / (segs - 1);
      const x = L * 0.44 - u * L * 0.92 + jx;
      const flex = Math.pow(u, 1.25);
      const wave = Math.sin(this._phase - u * 6.2) * (W * 0.68) * p.amp * 4.4 * flex;
      const turnCurve = p.turn * L * 0.28 * Math.pow(u, 1.45);
      pts.push({ x, y: wave + turnCurve + jy, r: baseWidths[i] * (W * 0.5), u });
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

  _drawGlowingPinkTailOrgan(ctx, tailPt) {
    // Iconic bioluminescent neon-pink tail-tip photophore organ of the Pelican Gulper Eel!
    const pulse = 0.8 + 0.2 * Math.sin(this._time * 6.2);
    ctx.save();
    ctx.translate(tailPt.x, tailPt.y);

    const halo = ctx.createRadialGradient(0, 0, 1, 0, 0, 18 * pulse);
    halo.addColorStop(0, 'rgba(255, 190, 230, 0.98)');
    halo.addColorStop(0.35, 'rgba(244, 114, 182, 0.72)');
    halo.addColorStop(0.72, 'rgba(236, 72, 153, 0.28)');
    halo.addColorStop(1, 'rgba(236, 72, 153, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, 18 * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FDF2F8';
    ctx.beginPath();
    ctx.arc(0, 0, 4.2 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#EC4899';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.restore();
  }

  _drawExpandablePelicanPouch(ctx, headFrame) {
    // Subtle pleated gular pelican pouch ribs & glowing throat rim when inflated!
    const p = this._currPose;
    const inflate = p.pouch;

    ctx.save();
    ctx.translate(headFrame.x, headFrame.y);
    ctx.rotate(Math.atan2(headFrame.ty, headFrame.tx));

    // Curved massive pelican jaw seam
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.36)';
    ctx.lineWidth = 1.6;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(16, s * (10 + inflate * 6));
      ctx.quadraticCurveTo(0, s * (20 + inflate * 9), -18, s * (12 + inflate * 4));
      ctx.stroke();
    }

    // Translucent plum-pink inner pouch glow peeking out during big gulp!
    if (inflate > 0.25) {
      ctx.fillStyle = `rgba(190, 24, 93, ${(inflate - 0.2) * 0.45})`;
      ctx.beginPath();
      ctx.ellipse(2, 0, 14 + inflate * 6, 15 + inflate * 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  _drawEyesAndEmotes(ctx, noseFrame) {
    // Gulper eels have adorable expressive eyes positioned right near the very tip of their giant snout!
    const st = this._state;
    const t = this._time;

    ctx.save();
    ctx.translate(noseFrame.x, noseFrame.y);
    ctx.rotate(Math.atan2(noseFrame.ty, noseFrame.tx));

    ctx.fillStyle = 'rgba(244, 114, 182, 0.40)';
    ctx.beginPath();
    ctx.ellipse(-2, -16, 4.8, 2.6, -0.2, 0, Math.PI * 2);
    ctx.ellipse(-2, 16, 4.8, 2.6, 0.2, 0, Math.PI * 2);
    ctx.fill();

    for (const side of [-1, 1]) {
      const ex = 5.5;
      const ey = side * 12.2;
      const r = st === 'shock' ? 7.6 : 6.4;

      ctx.save();
      ctx.translate(ex, ey);

      if (st === 'happy') {
        ctx.strokeStyle = '#F9A8D4';
        ctx.lineWidth = 2.7;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, side, 4.4, side > 0 ? Math.PI * 1.15 : Math.PI * 0.15, side > 0 ? Math.PI * 1.85 : Math.PI * 0.85);
        ctx.stroke();
      } else if (st === 'stress') {
        ctx.strokeStyle = '#F9A8D4';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-3.2, -3.2 * side);
        ctx.lineTo(2.3, 0);
        ctx.lineTo(-3.2, 3.2 * side);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#09090B';
        ctx.lineWidth = 1.9;
        ctx.stroke();

        const irisR = st === 'shock' ? r * 0.42 : r * 0.72;
        const sx = st === 'fear' ? Math.sin(t * 58) * 1.0 : 0;
        const sy = st === 'fear' ? Math.cos(t * 64) * 1.0 : 0;
        const ig = ctx.createRadialGradient(1 + sx, -1 + sy, 0.6, sx, sy, irisR);
        ig.addColorStop(0, '#FCE7F3');
        ig.addColorStop(0.55, '#EC4899');
        ig.addColorStop(1, '#831843');
        ctx.fillStyle = ig;
        ctx.beginPath();
        ctx.arc(1.1 + sx, sy, irisR, 0, Math.PI * 2);
        ctx.fill();

        const pr = st === 'shock' ? 1.7 : (st === 'fear' ? 2.1 : irisR * 0.55);
        ctx.fillStyle = '#09090B';
        ctx.beginPath();
        ctx.arc(1.4 + sx, sy, pr, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(2.4, -1.8, 2.0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-0.9, 1.7, 0.95, 0, Math.PI * 2);
        ctx.fill();

        if (st === 'hungry' || st === 'eating') {
          ctx.fillStyle = '#FEF08A';
          ctx.beginPath();
          for (let k = 0; k < 8; k++) {
            const a = (k * Math.PI) / 4;
            const rad = k % 2 === 0 ? 3.4 : 1.15;
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
          ctx.strokeStyle = '#F9A8D4';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(-r, 0);
          ctx.quadraticCurveTo(0, 1.6, r, 0);
          ctx.stroke();
        }

        if (st === 'sad' || st === 'fear') {
          ctx.fillStyle = 'rgba(125, 211, 252, 0.85)';
          ctx.beginPath();
          ctx.ellipse(-1.8, 2.6 * side, 3.0, 1.6, 0.2 * side, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    if (st === 'shock') {
      ctx.save();
      ctx.translate(18, -24);
      ctx.fillStyle = '#EF4444';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.9;
      ctx.beginPath();
      ctx.roundRect(-2.6, -13.5, 5.2, 9.5, 2);
      ctx.stroke();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, 2.7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fill();
      ctx.restore();
    } else if (st === 'fear' || st === 'stress') {
      ctx.save();
      ctx.translate(-5, -24 + Math.sin(t * 10) * 1.8);
      ctx.fillStyle = '#38BDF8';
      ctx.strokeStyle = '#0369A1';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(0, -6.2);
      ctx.bezierCurveTo(4.5, 0, 4.5, 5.2, 0, 5.2);
      ctx.bezierCurveTo(-4.5, 5.2, -4.5, 0, 0, -6.2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (st === 'happy') {
      ctx.save();
      ctx.translate(10, -24 + Math.sin(t * 8) * 1.8);
      ctx.fillStyle = '#FACC15';
      ctx.strokeStyle = '#B45309';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4;
        const rad = k % 2 === 0 ? 5.8 : 2.0;
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

    // Shadow
    ctx.save();
    ctx.translate(0, 6);
    ctx.strokeStyle = 'rgba(9, 9, 11, 0.22)';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      if (i === 0) ctx.moveTo(pts[i].x, pts[i].y); else ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();
    ctx.restore();

    // Tiny delicate pectoral fins behind giant pelican head
    const neckF = this._frame(pts, 3);
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(neckF.x + neckF.nx * side * (neckF.r * 0.8), neckF.y + neckF.ny * side * (neckF.r * 0.8));
      ctx.rotate(Math.atan2(neckF.ty, neckF.tx) + side * (Math.PI * 0.58 + Math.sin(this._phase) * 0.22));
      ctx.fillStyle = 'rgba(63, 63, 70, 0.85)';
      ctx.beginPath();
      ctx.ellipse(5, 0, 6, 3.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#09090B';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

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
      ctx.quadraticCurveTo(n.x + nf.tx * 12 + nf.nx * (n.r * 0.85), n.y + nf.ty * 12 + nf.ny * (n.r * 0.85), leftPts[1].x, leftPts[1].y);
      for (let i = 2; i < leftPts.length; i++) {
        const p0 = leftPts[i - 1];
        const p1 = leftPts[i];
        ctx.quadraticCurveTo(p0.x, p0.y, (p0.x + p1.x) * 0.5, (p0.y + p1.y) * 0.5);
      }
      const tail = pts[pts.length - 1];
      ctx.lineTo(tail.x - 4, tail.y);
      for (let i = rightPts.length - 2; i >= 1; i--) {
        const p0 = rightPts[i + 1];
        const p1 = rightPts[i];
        ctx.quadraticCurveTo(p0.x, p0.y, (p0.x + p1.x) * 0.5, (p0.y + p1.y) * 0.5);
      }
      ctx.quadraticCurveTo(n.x + nf.tx * 12 - nf.nx * (n.r * 0.85), n.y + nf.ty * 12 - nf.ny * (n.r * 0.85), n.x + nf.tx * 12, n.y + nf.ty * 12);
      ctx.closePath();
    };

    ctx.save();
    traceBody();
    const bodyGrad = ctx.createRadialGradient(headFrame.x, headFrame.y - 6, 4, headFrame.x - 20, headFrame.y, 85);
    bodyGrad.addColorStop(0, '#3F3F46');
    bodyGrad.addColorStop(0.45, '#18181B');
    bodyGrad.addColorStop(1, '#09090B');
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.clip();

    this._drawExpandablePelicanPouch(ctx, headFrame);

    // Subtle glowing lateral line dots along black whip body
    ctx.strokeStyle = 'rgba(244, 114, 182, 0.32)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let i = 3; i < pts.length; i++) {
      if (i === 3) ctx.moveTo(pts[i].x, pts[i].y); else ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();

    // Glossy jelly-bean chibi highlight on pelican head
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.beginPath();
    ctx.ellipse(headFrame.x + 2, headFrame.y - 6, 16, 6.2, -0.06, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    traceBody();
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Glowing pink tail-tip organ + expressive front-set chibi eyes
    this._drawGlowingPinkTailOrgan(ctx, pts[pts.length - 1]);
    this._drawEyesAndEmotes(ctx, noseFrame);
    ctx.restore();
  }
}

export default Gulpereelfish;
