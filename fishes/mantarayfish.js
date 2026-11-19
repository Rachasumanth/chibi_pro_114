/**
 * Giant Manta Ray (Mobula birostris) — Bespoke 2D Top-Down Expressive Chibi Asset
 * Dimensions: 175 x 220 | Native HTML5 Canvas 2D API | Zero external dependencies
 */

const VALID_STATES = new Set([
  'breathing', 'swimming', 'relax', 'left_turn', 'right_turn',
  'eating', 'hungry', 'stress', 'fear', 'shock', 'happy', 'sad'
]);

const ALIASES = { idle: 'breathing', hunger: 'hungry' };

const ONE_SHOT_DURATIONS = {
  left_turn: 0.58,
  right_turn: 0.58,
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
  breathing:  { freq: 1.7, amp: 0.08,  turn: 0,     hornOpen: 0.2,  jitter: 0,   droop: 0,    bounce: 0    },
  swimming:   { freq: 3.8, amp: 0.22,  turn: 0,     hornOpen: 0.35, jitter: 0,   droop: 0,    bounce: 0    },
  relax:      { freq: 0.9, amp: 0.05,  turn: 0,     hornOpen: 0.1,  jitter: 0,   droop: 0.12, bounce: 0    },
  left_turn:  { freq: 2.8, amp: 0.16,  turn: -0.46, hornOpen: 0.3,  jitter: 0,   droop: 0,    bounce: 0    },
  right_turn: { freq: 2.8, amp: 0.16,  turn: 0.46,  hornOpen: 0.3,  jitter: 0,   droop: 0,    bounce: 0    },
  eating:     { freq: 4.6, amp: 0.18,  turn: 0,     hornOpen: 1.0,  jitter: 0,   droop: 0,    bounce: 0.1  },
  hungry:     { freq: 3.4, amp: 0.15,  turn: 0,     hornOpen: 0.75, jitter: 0,   droop: 0,    bounce: 0.05 },
  stress:     { freq: 8.2, amp: 0.12,  turn: 0,     hornOpen: 0.15, jitter: 1.5, droop: 0.05, bounce: 0    },
  fear:       { freq: 10.8,amp: 0.16,  turn: 0,     hornOpen: 0.05, jitter: 2.5, droop: 0.2,  bounce: 0    },
  shock:      { freq: 12.5,amp: 0.05,  turn: 0,     hornOpen: 0.95, jitter: 3.0, droop: 0,    bounce: -0.1 },
  happy:      { freq: 4.4, amp: 0.22,  turn: 0,     hornOpen: 0.55, jitter: 0,   droop: -0.1, bounce: 0.14 },
  sad:        { freq: 1.0, amp: 0.04,  turn: 0,     hornOpen: 0.05, jitter: 0,   droop: 0.32, bounce: 0    }
};

function lerp(a, b, t) { return a + (b - a) * t; }
function cubicBlend(t) {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

export class Mantarayfish {
  static metadata = {
    name: 'Giant Manta Ray',
    category: 'fish',
    baseLength: 175,
    baseWidth: 220
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

  _drawWhipTail(ctx, jx, jy) {
    // Long graceful articulated whip tail trailing from the rear of the diamond disc
    const p = this._currPose;
    const baseX = -32 + jx;
    const baseY = jy;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(baseX, baseY);
    const segs = 10;
    const pts = [];
    for (let i = 1; i <= segs; i++) {
      const u = i / segs;
      const tx = baseX - u * 62;
      const ty = baseY + Math.sin(this._phase * 1.1 - u * 4.5) * (14 * p.amp * 4.5 * u) + p.turn * 34 * u * u;
      pts.push({ x: tx, y: ty });
      ctx.lineTo(tx, ty);
    }
    ctx.strokeStyle = '#090B14';
    ctx.lineWidth = 4.6;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.strokeStyle = '#312E81';
    ctx.lineWidth = 2.0;
    ctx.stroke();

    // Tiny pelvic fins & dorsal nub at tail base
    for (const side of [-1, 1]) {
      ctx.fillStyle = '#1E1B4B';
      ctx.strokeStyle = '#090B14';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.ellipse(baseX + 2, baseY + side * 12, 12, 6, side * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawCephalicHorns(ctx, jx, jy) {
    // Signature forward-curled cephalic horn lobes flanking the wide filter-feeding mouth!
    const p = this._currPose;
    const open = p.hornOpen;

    ctx.save();
    ctx.translate(46 + jx, jy);

    // Wide plankton-filter mouth glow when eating/hungry/shock
    if (open > 0.35) {
      ctx.fillStyle = `rgba(56, 189, 248, ${(open - 0.3) * 0.38})`;
      ctx.beginPath();
      ctx.ellipse(10, 0, 12 + open * 6, 16 + open * 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const side of [-1, 1]) {
      const flare = side * (16 + open * 11);
      const tipY = side * (12 + open * 16);

      const hornGrad = ctx.createLinearGradient(0, 0, 30, tipY);
      hornGrad.addColorStop(0, '#1E1B4B');
      hornGrad.addColorStop(0.65, '#312E81');
      hornGrad.addColorStop(1, '#CBD5E1');

      ctx.fillStyle = hornGrad;
      ctx.strokeStyle = '#090B14';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(-4, side * 14);
      ctx.bezierCurveTo(10, flare + side * 8, 26, tipY + side * 4, 30, tipY - side * 4);
      ctx.bezierCurveTo(22, tipY - side * 9, 10, side * 12, 2, side * 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  _drawEyesAndEmotes(ctx, jx, jy) {
    const st = this._state;
    const t = this._time;

    ctx.save();
    ctx.translate(36 + jx, jy);

    // Rosy chibi cheek blushes near cephalic base
    ctx.fillStyle = 'rgba(244, 114, 182, 0.36)';
    ctx.beginPath();
    ctx.ellipse(-2, -31, 6.2, 3.5, -0.25, 0, Math.PI * 2);
    ctx.ellipse(-2, 31, 6.2, 3.5, 0.25, 0, Math.PI * 2);
    ctx.fill();

    for (const side of [-1, 1]) {
      const ex = 6;
      const ey = side * 24;
      const r = st === 'shock' ? 8.8 : 7.5;

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
        ctx.strokeStyle = '#090B14';
        ctx.lineWidth = 2.1;
        ctx.stroke();

        const irisR = st === 'shock' ? r * 0.42 : r * 0.72;
        const sx = st === 'fear' ? Math.sin(t * 56) * 1.1 : 0;
        const sy = st === 'fear' ? Math.cos(t * 62) * 1.1 : 0;
        const ig = ctx.createRadialGradient(1 + sx, -1 + sy, 0.8, sx, sy, irisR);
        ig.addColorStop(0, '#BAE6FD');
        ig.addColorStop(0.55, '#38BDF8');
        ig.addColorStop(1, '#1E3A8A');
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
          ctx.fillStyle = '#1E1B4B';
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
      ctx.translate(22, -38);
      ctx.fillStyle = '#EF4444';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.roundRect(-3.2, -16, 6.4, 11.5, 2.5);
      ctx.stroke();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, 3.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fill();
      ctx.restore();
    } else if (st === 'fear' || st === 'stress') {
      ctx.save();
      ctx.translate(-4, -38 + Math.sin(t * 10) * 2.2);
      ctx.fillStyle = '#38BDF8';
      ctx.strokeStyle = '#0369A1';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -7.5);
      ctx.bezierCurveTo(5.5, 0, 5.5, 6.2, 0, 6.2);
      ctx.bezierCurveTo(-5.5, 6.2, -5.5, 0, 0, -7.5);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (st === 'happy') {
      ctx.save();
      ctx.translate(14, -38 + Math.sin(t * 8) * 2.2);
      ctx.fillStyle = '#FACC15';
      ctx.strokeStyle = '#B45309';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4;
        const rad = k % 2 === 0 ? 7.2 : 2.5;
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
    const p = this._currPose;
    const bounceScale = 1 + Math.sin(this._time * 7.5) * p.bounce * 0.2;
    ctx.scale(this.scale * bounceScale, this.scale / Math.sqrt(Math.max(0.7, bounceScale)));

    const jx = p.jitter > 0 ? Math.sin(this._time * 56) * p.jitter * 0.45 : 0;
    const jy = p.jitter > 0 ? Math.cos(this._time * 64) * p.jitter : 0;

    // Wingbeat undulation deformation for left & right diamond wingtips!
    const flapL = Math.sin(this._phase) * (22 * p.amp * 4.5);
    const flapR = Math.sin(this._phase + (p.turn !== 0 ? 0.5 : 0)) * (22 * p.amp * 4.5);
    const wingSpanL = 104 - Math.abs(flapL) * 0.35 + p.turn * 12;
    const wingSpanR = 104 - Math.abs(flapR) * 0.35 - p.turn * 12;
    const tipLagL = -6 - flapL * 0.55;
    const tipLagR = -6 - flapR * 0.55;

    const traceDiamondDisc = () => {
      ctx.beginPath();
      ctx.moveTo(50 + jx, jy);
      // Left leading wing edge sweeping out to graceful pointed wingtip
      ctx.bezierCurveTo(44 + jx, -26 + jy, 24 + jx, -wingSpanL * 0.72 + jy, tipLagL + jx, -wingSpanL + jy);
      // Left scalloped trailing wing edge back to tail base
      ctx.bezierCurveTo(-18 + jx, -wingSpanL * 0.65 + jy, -24 + jx, -34 + jy, -34 + jx, jy);
      // Right scalloped trailing wing edge out to right wingtip
      ctx.bezierCurveTo(-24 + jx, 34 + jy, -18 + jx, wingSpanR * 0.65 + jy, tipLagR + jx, wingSpanR + jy);
      // Right leading wing edge back to snout
      ctx.bezierCurveTo(24 + jx, wingSpanR * 0.72 + jy, 44 + jx, 26 + jy, 50 + jx, jy);
      ctx.closePath();
    };

    // 1. Soft underwater drop shadow
    ctx.save();
    ctx.translate(0, 9);
    traceDiamondDisc();
    ctx.fillStyle = 'rgba(9, 11, 20, 0.22)';
    ctx.fill();
    ctx.restore();

    // 2. Long whip tail & curled cephalic horns
    this._drawWhipTail(ctx, jx, jy);
    this._drawCephalicHorns(ctx, jx, jy);

    // 3. Indigo-black diamond wing disc with bold white shoulder chevrons!
    ctx.save();
    traceDiamondDisc();
    const discGrad = ctx.createRadialGradient(14 + jx, jy, 8, 4 + jx, jy, 112);
    discGrad.addColorStop(0, '#312E81');
    discGrad.addColorStop(0.45, '#1E1B4B');
    discGrad.addColorStop(0.85, '#0F172A');
    discGrad.addColorStop(1, '#334155');
    ctx.fillStyle = discGrad;
    ctx.fill();
    ctx.clip();

    // Iconic bold sweeping white shoulder chevrons of the Giant Manta Ray!
    for (const side of [-1, 1]) {
      const chevGrad = ctx.createLinearGradient(34, side * 12, -10, side * 66);
      chevGrad.addColorStop(0, 'rgba(241, 245, 249, 0.92)');
      chevGrad.addColorStop(0.6, 'rgba(203, 213, 225, 0.75)');
      chevGrad.addColorStop(1, 'rgba(148, 163, 184, 0.15)');
      ctx.fillStyle = chevGrad;
      ctx.beginPath();
      ctx.moveTo(34 + jx, side * 14 + jy);
      ctx.bezierCurveTo(22 + jx, side * 36 + jy, 4 + jx, side * 56 + jy, -8 + jx, side * 62 + jy);
      ctx.bezierCurveTo(0 + jx, side * 38 + jy, 10 + jx, side * 22 + jy, 18 + jx, side * 10 + jy);
      ctx.closePath();
      ctx.fill();
    }

    // Subtle pale-grey wingtip undersides peeking during wingbeat
    ctx.fillStyle = 'rgba(226, 232, 240, 0.25)';
    ctx.beginPath();
    ctx.ellipse(tipLagL + jx, -wingSpanL + 10 + jy, 10, 18, 0.3, 0, Math.PI * 2);
    ctx.ellipse(tipLagR + jx, wingSpanR - 10 + jy, 10, 18, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Central dorsal spine ridge & glossy jelly-bean chibi highlight
    ctx.fillStyle = 'rgba(199, 210, 254, 0.24)';
    ctx.beginPath();
    ctx.ellipse(12 + jx, -4 + jy, 24, 8, -0.05, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    traceDiamondDisc();
    ctx.strokeStyle = '#090B14';
    ctx.lineWidth = 3.0;
    ctx.lineJoin = 'round';
    ctx.stroke();

    this._drawEyesAndEmotes(ctx, jx, jy);
    ctx.restore();
  }
}

export default Mantarayfish;
