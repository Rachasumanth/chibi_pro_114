/**
 * Giant Arapaima (Arapaima gigas) — Bespoke 2D Top-Down Expressive Chibi Asset
 * Dimensions: 235 x 68 | Native HTML5 Canvas 2D API | Zero external dependencies
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
  breathing:  { freq: 1.9, amp: 0.055, turn: 0,     speed: 0.25, finSpread: 1.0,  mouth: 0.06, jitter: 0,    droop: 0,    bounce: 0    },
  swimming:   { freq: 4.8, amp: 0.145, turn: 0,     speed: 1.0,  finSpread: 0.85, mouth: 0.08, jitter: 0,    droop: 0,    bounce: 0    },
  relax:      { freq: 1.0, amp: 0.032, turn: 0,     speed: 0.12, finSpread: 1.15, mouth: 0.03, jitter: 0,    droop: 0.12, bounce: 0    },
  left_turn:  { freq: 3.4, amp: 0.09,  turn: -0.44, speed: 0.7,  finSpread: 1.12, mouth: 0.08, jitter: 0,    droop: 0,    bounce: 0    },
  right_turn: { freq: 3.4, amp: 0.09,  turn: 0.44,  speed: 0.7,  finSpread: 1.12, mouth: 0.08, jitter: 0,    droop: 0,    bounce: 0    },
  eating:     { freq: 5.5, amp: 0.12,  turn: 0,     speed: 0.65, finSpread: 1.15, mouth: 0.92, jitter: 0,    droop: 0,    bounce: 0.08 },
  hungry:     { freq: 4.2, amp: 0.11,  turn: 0,     speed: 0.55, finSpread: 1.05, mouth: 0.48, jitter: 0,    droop: 0,    bounce: 0.05 },
  stress:     { freq: 8.6, amp: 0.085, turn: 0,     speed: 0.4,  finSpread: 0.78, mouth: 0.12, jitter: 1.6,  droop: 0.05, bounce: 0    },
  fear:       { freq: 11.2,amp: 0.11,  turn: 0,     speed: 0.35, finSpread: 0.62, mouth: 0.28, jitter: 2.8,  droop: 0.18, bounce: 0    },
  shock:      { freq: 13.0,amp: 0.04,  turn: 0,     speed: 0.1,  finSpread: 1.32, mouth: 0.85, jitter: 3.4,  droop: 0,    bounce: -0.1 },
  happy:      { freq: 5.6, amp: 0.15,  turn: 0,     speed: 0.85, finSpread: 1.2,  mouth: 0.22, jitter: 0,    droop: -0.1, bounce: 0.16 },
  sad:        { freq: 1.2, amp: 0.035, turn: 0,     speed: 0.15, finSpread: 0.72, mouth: 0.04, jitter: 0,    droop: 0.35, bounce: 0    }
};

function lerp(a, b, t) { return a + (b - a) * t; }
function cubicBlend(t) {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

export class Arapaimafish {
  static metadata = {
    name: 'Giant Arapaima',
    category: 'fish',
    baseLength: 235,
    baseWidth: 68
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

  getState() {
    return this._state;
  }

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

    if (!ONE_SHOT_DURATIONS[this._state]) {
      this._prevState = this._state;
    }

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
      if (cbs) {
        for (const cb of [...cbs]) cb(finished);
      }
    }
  }

  _buildSpine() {
    // 11-segment colossal elongated arapaima spine, facing +x (head right, tail left)
    const L = 235;
    const W = 68;
    const segs = 11;
    // Normalized widths: broad flat armored head, thick muscular barrel, gradual rear taper
    const widths = [
      0.34, 0.72, 0.96, 1.00, 0.96, 0.89, 0.80, 0.68, 0.54, 0.39, 0.27
    ];
    const pts = [];
    const p = this._currPose;
    const jx = p.jitter > 0 ? Math.sin(this._time * 54) * p.jitter * 0.45 : 0;
    const jy = p.jitter > 0 ? Math.cos(this._time * 63) * p.jitter : 0;

    for (let i = 0; i < segs; i++) {
      const u = i / (segs - 1); // 0 = snout (+x), 1 = tail base (-x)
      const x = L * 0.46 - u * L * 0.86 + jx;
      const flex = Math.pow(u, 1.45);
      const wave = Math.sin(this._phase - u * 3.8) * (W * 0.52) * p.amp * 5.2 * flex;
      const turnCurve = p.turn * L * 0.28 * Math.pow(u, 1.55);
      const y = wave + turnCurve + jy;
      pts.push({ x, y, r: widths[i] * (W * 0.5), u });
    }
    return pts;
  }

  _spineFrame(pts, idx) {
    const curr = pts[idx];
    const prev = pts[Math.max(0, idx - 1)];
    const next = pts[Math.min(pts.length - 1, idx + 1)];
    const tx = prev.x - next.x;
    const ty = prev.y - next.y;
    const len = Math.hypot(tx, ty) || 1;
    return { x: curr.x, y: curr.y, r: curr.r, tx: tx / len, ty: ty / len, nx: -ty / len, ny: tx / len };
  }

  _drawPectoralFin(ctx, frame, side) {
    // Broad paddle-like arapaima pectoral fins with olive-to-crimson tips
    const p = this._currPose;
    const flap = Math.sin(this._phase * 0.9 + (side > 0 ? 0 : 0.7)) * 0.22;
    const spread = (0.72 + 0.25 * p.finSpread) * (1 - p.droop * 0.3);
    const baseAngle = Math.atan2(frame.ty, frame.tx) + side * (Math.PI * 0.56 + flap + (p.turn * side * 0.35));

    ctx.save();
    ctx.translate(frame.x + frame.nx * side * (frame.r * 0.82), frame.y + frame.ny * side * (frame.r * 0.82));
    ctx.rotate(baseAngle);
    ctx.scale(spread, 1);

    const finGrad = ctx.createLinearGradient(0, 0, 32, 0);
    finGrad.addColorStop(0, 'rgba(72, 94, 58, 0.94)');
    finGrad.addColorStop(0.58, 'rgba(134, 62, 48, 0.86)');
    finGrad.addColorStop(1, 'rgba(220, 56, 48, 0.78)');

    ctx.beginPath();
    ctx.moveTo(0, -6 * side);
    ctx.bezierCurveTo(10, -14 * side, 28, -11 * side, 34, 1 * side);
    ctx.bezierCurveTo(30, 12 * side, 14, 14 * side, -2, 7 * side);
    ctx.closePath();
    ctx.fillStyle = finGrad;
    ctx.fill();

    // Translucent fin rays
    ctx.strokeStyle = 'rgba(254, 215, 195, 0.45)';
    ctx.lineWidth = 1.2;
    for (let r = -2; r <= 2; r++) {
      ctx.beginPath();
      ctx.moveTo(2, r * 2.2 * side);
      ctx.quadraticCurveTo(16, r * 3.8 * side, 30 - Math.abs(r) * 2.2, r * 4.4 * side);
      ctx.stroke();
    }

    ctx.strokeStyle = '#1B2214';
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.restore();
  }

  _drawPelvicFin(ctx, frame, side) {
    const p = this._currPose;
    const sway = Math.sin(this._phase * 0.9 - 1.4) * 0.18;
    const baseAngle = Math.atan2(frame.ty, frame.tx) + side * (Math.PI * 0.68 + sway);
    ctx.save();
    ctx.translate(frame.x + frame.nx * side * (frame.r * 0.78), frame.y + frame.ny * side * (frame.r * 0.78));
    ctx.rotate(baseAngle);

    const g = ctx.createLinearGradient(0, 0, 20, 0);
    g.addColorStop(0, 'rgba(148, 42, 38, 0.9)');
    g.addColorStop(1, 'rgba(239, 68, 68, 0.75)');

    ctx.beginPath();
    ctx.moveTo(0, -4 * side);
    ctx.quadraticCurveTo(14, -8 * side, 21, 1 * side);
    ctx.quadraticCurveTo(12, 9 * side, -2, 4 * side);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = '#1B2214';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  _drawTailFin(ctx, tailFrame) {
    // Arapaima signature broad rounded crimson-rimmed paddle tail
    const tailWag = Math.sin(this._phase - 4.1) * 0.28 + this._currPose.turn * 0.45;
    ctx.save();
    ctx.translate(tailFrame.x, tailFrame.y);
    ctx.rotate(Math.atan2(-tailFrame.ty, -tailFrame.tx) + tailWag);

    const grad = ctx.createRadialGradient(8, 0, 4, 18, 0, 34);
    grad.addColorStop(0, '#7F1D1D');
    grad.addColorStop(0.55, '#DC2626');
    grad.addColorStop(0.86, '#F87171');
    grad.addColorStop(1, '#FCA5A5');

    ctx.beginPath();
    ctx.moveTo(-2, -10);
    ctx.bezierCurveTo(12, -24, 34, -22, 36, 0);
    ctx.bezierCurveTo(34, 22, 12, 24, -2, 10);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Inner dark olive-crimson mottling near tail base
    ctx.fillStyle = 'rgba(40, 24, 18, 0.35)';
    ctx.beginPath();
    ctx.ellipse(9, 0, 9, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    // Fine crimson-gold tail rays
    ctx.strokeStyle = 'rgba(254, 226, 226, 0.48)';
    ctx.lineWidth = 1.25;
    for (let i = -4; i <= 4; i++) {
      const a = i * 0.14;
      ctx.beginPath();
      ctx.moveTo(2, i * 1.6);
      ctx.lineTo(Math.cos(a) * 32, Math.sin(a) * 32);
      ctx.stroke();
    }

    ctx.strokeStyle = '#1B2214';
    ctx.lineWidth = 2.8;
    ctx.stroke();
    ctx.restore();
  }

  _drawMosaicScales(ctx, pts) {
    // Signature heavily rimmed red-edged mosaic scales — olive front transitioning to blazing crimson rear
    for (let i = 3; i < pts.length - 1; i++) {
      const f = this._spineFrame(pts, i);
      const u = pts[i].u;
      const crimsonFactor = Math.max(0, Math.min(1, (u - 0.38) / 0.52));
      const rows = Math.max(2, Math.round(f.r / 9.5));
      const scaleRad = 7.6 - u * 1.8;

      for (let r = -rows + 0.5; r <= rows - 0.5; r += 1) {
        const offset = r * (scaleRad * 1.38);
        if (Math.abs(offset) > f.r * 0.84) continue;
        const stagger = (Math.round(r) % 2 === 0 ? 0 : 4.2);
        const sx = f.x + f.nx * offset - f.tx * stagger;
        const sy = f.y + f.ny * offset - f.ty * stagger;
        const ang = Math.atan2(f.ty, f.tx);

        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(ang);

        // Scale interior
        const cr = Math.round(lerp(76, 178, crimsonFactor));
        const cg = Math.round(lerp(96, 40, crimsonFactor));
        const cb = Math.round(lerp(62, 36, crimsonFactor));
        ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, 0.72)`;
        ctx.beginPath();
        ctx.arc(0, 0, scaleRad, Math.PI * 0.55, Math.PI * 1.45);
        ctx.quadraticCurveTo(scaleRad * 0.65, 0, Math.cos(Math.PI * 0.55) * scaleRad, Math.sin(Math.PI * 0.55) * scaleRad);
        ctx.fill();

        // Bold signature crimson-red mosaic rim on rear edge of every scale
        const rimAlpha = 0.42 + crimsonFactor * 0.52;
        ctx.strokeStyle = crimsonFactor > 0.25
          ? `rgba(248, 86, 74, ${rimAlpha})`
          : `rgba(196, 108, 72, ${rimAlpha * 0.8})`;
        ctx.lineWidth = 1.6 + crimsonFactor * 0.8;
        ctx.beginPath();
        ctx.arc(0, 0, scaleRad, Math.PI * 0.62, Math.PI * 1.38);
        ctx.stroke();

        // Subtle dark mosaic grout shadow
        ctx.strokeStyle = 'rgba(20, 28, 16, 0.36)';
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.arc(-1.1, 0, scaleRad * 0.92, Math.PI * 0.65, Math.PI * 1.35);
        ctx.stroke();

        ctx.restore();
      }
    }
  }

  _drawArmoredHead(ctx, headFrame, neckFrame) {
    // Broad flat bony armored arapaima head with cranial plates & wide cute jaw
    ctx.save();
    ctx.translate(headFrame.x, headFrame.y);
    ctx.rotate(Math.atan2(headFrame.ty, headFrame.tx));

    // Snout/mouth opening when eating, hungry, or shocked
    const m = this._currPose.mouth;
    if (m > 0.14) {
      const chomp = this._state === 'hungry' ? (0.5 + 0.5 * Math.sin(this._time * 11)) * m : m;
      ctx.fillStyle = '#3B0A16';
      ctx.beginPath();
      ctx.ellipse(20 + chomp * 4, 0, 7 + chomp * 5, 11 + chomp * 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#F472B6';
      ctx.beginPath();
      ctx.ellipse(18 + chomp * 2, 0, 4 + chomp * 2, 6 + chomp * 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1B2214';
      ctx.lineWidth = 2.2;
      ctx.stroke();
    }

    // Cranial armor plate seams (iconic flat bony shield of Arapaima gigas)
    ctx.strokeStyle = 'rgba(34, 48, 28, 0.52)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(14, -12);
    ctx.quadraticCurveTo(2, -16, -12, -11);
    ctx.quadraticCurveTo(-20, 0, -12, 11);
    ctx.quadraticCurveTo(2, 16, 14, 12);
    ctx.stroke();

    // Central cranial ridge & subtle bone pores
    ctx.strokeStyle = 'rgba(182, 204, 152, 0.35)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-14, 0);
    ctx.stroke();

    // Cute nostrils near blunt snout
    ctx.fillStyle = '#1B2214';
    ctx.beginPath();
    ctx.ellipse(16, -7.5, 2.3, 1.3, 0.25, 0, Math.PI * 2);
    ctx.ellipse(16, 7.5, 2.3, 1.3, -0.25, 0, Math.PI * 2);
    ctx.fill();

    // Rosy chibi cheek blushes behind eyes
    ctx.fillStyle = 'rgba(248, 113, 113, 0.38)';
    ctx.beginPath();
    ctx.ellipse(-6, -21, 7.5, 4.2, -0.2, 0, Math.PI * 2);
    ctx.ellipse(-6, 21, 7.5, 4.2, 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Gill plate operculum arcs
    ctx.save();
    ctx.translate(neckFrame.x, neckFrame.y);
    ctx.rotate(Math.atan2(neckFrame.ty, neckFrame.tx));
    ctx.strokeStyle = 'rgba(27, 34, 20, 0.65)';
    ctx.lineWidth = 2.4;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(-6, s * 28);
      ctx.quadraticCurveTo(-16, s * 16, -8, s * 6);
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawChibiEyesAndEmotes(ctx, headFrame) {
    const st = this._state;
    const t = this._time;

    ctx.save();
    ctx.translate(headFrame.x, headFrame.y);
    ctx.rotate(Math.atan2(headFrame.ty, headFrame.tx));

    for (const side of [-1, 1]) {
      const ex = 4;
      const ey = side * 19.5;
      const r = st === 'shock' ? 10.4 : 8.8;

      ctx.save();
      ctx.translate(ex, ey);

      if (st === 'happy') {
        // ^ ^ joyful smiling arc eyes
        ctx.strokeStyle = '#1B2214';
        ctx.lineWidth = 3.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(0, side * 1.2, 6.2, side > 0 ? Math.PI * 1.15 : Math.PI * 0.15, side > 0 ? Math.PI * 1.85 : Math.PI * 0.85);
        ctx.stroke();
      } else if (st === 'stress') {
        // > < scrunched eyes
        ctx.strokeStyle = '#1B2214';
        ctx.lineWidth = 2.9;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-4, -4 * side);
        ctx.lineTo(3, 0);
        ctx.lineTo(-4, 4 * side);
        ctx.stroke();
      } else {
        // Glossy oversized chibi eye with golden-amber arapaima iris
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#1B2214';
        ctx.lineWidth = 2.2;
        ctx.stroke();

        const irisR = st === 'shock' ? r * 0.42 : r * 0.72;
        const shiverX = st === 'fear' ? Math.sin(t * 55) * 1.2 : 0;
        const shiverY = st === 'fear' ? Math.cos(t * 62) * 1.2 : 0;
        const irisGrad = ctx.createRadialGradient(1 + shiverX, -1 + shiverY, 1, shiverX, shiverY, irisR);
        irisGrad.addColorStop(0, '#FEF08A');
        irisGrad.addColorStop(0.55, '#F59E0B');
        irisGrad.addColorStop(1, '#78350F');
        ctx.fillStyle = irisGrad;
        ctx.beginPath();
        ctx.arc(1.2 + shiverX, shiverY, irisR, 0, Math.PI * 2);
        ctx.fill();

        const pupilR = st === 'shock' ? 2.2 : (st === 'fear' ? 2.7 : irisR * 0.56);
        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        ctx.arc(1.6 + shiverX, shiverY, pupilR, 0, Math.PI * 2);
        ctx.fill();

        // Dual glossy specular catchlights
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(3.4, -2.6, st === 'shock' ? 2.1 : 2.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-1.2, 2.4, 1.3, 0, Math.PI * 2);
        ctx.fill();

        // Hungry starry sparkles inside eyes
        if (st === 'hungry' || st === 'eating') {
          ctx.fillStyle = '#FEF9C3';
          const sp = 0.7 + 0.3 * Math.sin(t * 14);
          ctx.save();
          ctx.translate(1.5, 0);
          ctx.scale(sp, sp);
          ctx.beginPath();
          for (let k = 0; k < 8; k++) {
            const ang = (k * Math.PI) / 4;
            const rad = k % 2 === 0 ? 4.4 : 1.5;
            ctx.lineTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
          }
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }

        // Relax peaceful half-closed sleepy eyelids
        if (st === 'relax') {
          ctx.fillStyle = '#4E6340';
          ctx.beginPath();
          ctx.arc(0, 0, r + 0.5, Math.PI, Math.PI * 2);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#1B2214';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-r, 0);
          ctx.quadraticCurveTo(0, 2.2, r, 0);
          ctx.stroke();
        }

        // Sad / Fear watery teary eye shine & droplet
        if (st === 'sad' || st === 'fear') {
          ctx.fillStyle = 'rgba(125, 211, 252, 0.72)';
          ctx.beginPath();
          ctx.ellipse(-2.5, 3.8 * side, 4.2, 2.3, 0.2 * side, 0, Math.PI * 2);
          ctx.fill();
          if (st === 'sad') {
            const dropY = ((t * 22 + (side > 0 ? 0 : 7)) % 14);
            ctx.fillStyle = 'rgba(56, 189, 248, 0.85)';
            ctx.beginPath();
            ctx.arc(-5 - dropY * 0.4, side * (8 + dropY * 0.6), 2.3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      ctx.restore();
    }

    // Floating mood emotes
    if (st === 'shock') {
      ctx.save();
      ctx.translate(22, -30);
      ctx.fillStyle = '#EF4444';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.roundRect(-3.5, -18, 7, 13, 3);
      ctx.stroke();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, 3.6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fill();
      ctx.restore();
    } else if (st === 'fear' || st === 'stress') {
      const bob = Math.sin(t * 10) * 2.2;
      ctx.save();
      ctx.translate(-8, -33 + bob);
      ctx.fillStyle = '#38BDF8';
      ctx.strokeStyle = '#0369A1';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.bezierCurveTo(6, 0, 6, 7, 0, 7);
      ctx.bezierCurveTo(-6, 7, -6, 0, 0, -8);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (st === 'happy') {
      for (let i = 0; i < 2; i++) {
        const s = 0.75 + 0.3 * Math.sin(t * 9 + i * 2.1);
        ctx.save();
        ctx.translate(14 - i * 24, (i === 0 ? -32 : 31) + Math.sin(t * 7 + i) * 2.5);
        ctx.scale(s, s);
        ctx.fillStyle = '#FACC15';
        ctx.strokeStyle = '#B45309';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        for (let k = 0; k < 8; k++) {
          const a = (k * Math.PI) / 4;
          const rad = k % 2 === 0 ? 7.5 : 2.6;
          ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    }

    ctx.restore();
  }

  _drawRearDorsalFin(ctx, pts) {
    // Signature far-back arapaima dorsal ridge running along rear 38% of body
    ctx.save();
    ctx.beginPath();
    const startIdx = 5;
    for (let i = startIdx; i < pts.length; i++) {
      const p = pts[i];
      const sway = Math.sin(this._phase - i * 0.65) * 4.5;
      if (i === startIdx) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y + sway);
    }
    ctx.strokeStyle = '#991B1B';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.strokeStyle = '#F87171';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }

  draw(ctx) {
    if (!ctx) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    const bounceScale = 1 + Math.sin(this._time * 8) * this._currPose.bounce * 0.25;
    ctx.scale(this.scale * bounceScale, this.scale / Math.sqrt(Math.max(0.7, bounceScale)));

    const pts = this._buildSpine();
    const headFrame = this._spineFrame(pts, 1);
    const neckFrame = this._spineFrame(pts, 2);
    const pecFrame = this._spineFrame(pts, 3);
    const pelvFrame = this._spineFrame(pts, 6);
    const tailFrame = this._spineFrame(pts, pts.length - 1);

    // 1. Soft underwater drop shadow
    ctx.save();
    ctx.translate(0, 7);
    ctx.fillStyle = 'rgba(12, 22, 16, 0.22)';
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const f = this._spineFrame(pts, i);
      const px = f.x + f.nx * f.r * 0.9;
      const py = f.y + f.ny * f.r * 0.9;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    for (let i = pts.length - 1; i >= 0; i--) {
      const f = this._spineFrame(pts, i);
      ctx.lineTo(f.x - f.nx * f.r * 0.9, f.y - f.ny * f.r * 0.9);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 2. Fins under body
    this._drawPectoralFin(ctx, pecFrame, -1);
    this._drawPectoralFin(ctx, pecFrame, 1);
    this._drawPelvicFin(ctx, pelvFrame, -1);
    this._drawPelvicFin(ctx, pelvFrame, 1);
    this._drawTailFin(ctx, tailFrame);

    // 3. Main articulated body silhouette (clipped for cel-shading & mosaic scales)
    const leftPts = [];
    const rightPts = [];
    for (let i = 0; i < pts.length; i++) {
      const f = this._spineFrame(pts, i);
      leftPts.push({ x: f.x + f.nx * f.r, y: f.y + f.ny * f.r });
      rightPts.push({ x: f.x - f.nx * f.r, y: f.y - f.ny * f.r });
    }

    const traceBody = () => {
      const nose = pts[0];
      const nf = this._spineFrame(pts, 0);
      ctx.beginPath();
      ctx.moveTo(nose.x + nf.tx * 16, nose.y + nf.ty * 16);
      ctx.quadraticCurveTo(
        nose.x + nf.tx * 14 + nf.nx * 14, nose.y + nf.ty * 14 + nf.ny * 14,
        leftPts[1].x, leftPts[1].y
      );
      for (let i = 2; i < leftPts.length; i++) {
        const prev = leftPts[i - 1];
        const curr = leftPts[i];
        ctx.quadraticCurveTo(prev.x, prev.y, (prev.x + curr.x) * 0.5, (prev.y + curr.y) * 0.5);
      }
      const lastL = leftPts[leftPts.length - 1];
      const lastR = rightPts[rightPts.length - 1];
      ctx.lineTo(lastL.x, lastL.y);
      ctx.lineTo(lastR.x, lastR.y);
      for (let i = rightPts.length - 2; i >= 1; i--) {
        const prev = rightPts[i + 1];
        const curr = rightPts[i];
        ctx.quadraticCurveTo(prev.x, prev.y, (prev.x + curr.x) * 0.5, (prev.y + curr.y) * 0.5);
      }
      ctx.quadraticCurveTo(
        nose.x + nf.tx * 14 - nf.nx * 14, nose.y + nf.ty * 14 - nf.ny * 14,
        nose.x + nf.tx * 16, nose.y + nf.ty * 16
      );
      ctx.closePath();
    };

    ctx.save();
    traceBody();
    const bodyGrad = ctx.createLinearGradient(pts[0].x + 16, 0, pts[pts.length - 1].x, 0);
    bodyGrad.addColorStop(0, '#5B724B');
    bodyGrad.addColorStop(0.42, '#4A5D3F');
    bodyGrad.addColorStop(0.72, '#8F312A');
    bodyGrad.addColorStop(1, '#DC2626');
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    ctx.clip();

    // Cel-shaded side shading (deep emerald-olive edges + warm dorsal crown)
    const sideGrad = ctx.createLinearGradient(0, -36, 0, 36);
    sideGrad.addColorStop(0, 'rgba(20, 30, 16, 0.36)');
    sideGrad.addColorStop(0.24, 'rgba(255, 255, 255, 0.08)');
    sideGrad.addColorStop(0.5, 'rgba(255, 245, 210, 0.14)');
    sideGrad.addColorStop(0.76, 'rgba(255, 255, 255, 0.05)');
    sideGrad.addColorStop(1, 'rgba(20, 30, 16, 0.38)');
    ctx.fillStyle = sideGrad;
    ctx.fillRect(-150, -60, 300, 120);

    // Signature red-rimmed mosaic scales
    this._drawMosaicScales(ctx, pts);

    // Glossy jelly-bean chibi dorsal highlight streak
    ctx.strokeStyle = 'rgba(255, 255, 240, 0.36)';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[1].x + 2, pts[1].y - 5);
    ctx.quadraticCurveTo(pts[3].x, pts[3].y - 6, pts[6].x, pts[6].y - 3);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(pts[1].x + 6, pts[1].y - 6);
    ctx.quadraticCurveTo(pts[2].x, pts[2].y - 7, pts[4].x, pts[4].y - 5);
    ctx.stroke();

    // Armored head plates & blushes
    this._drawArmoredHead(ctx, headFrame, neckFrame);

    ctx.restore();

    // 4. Bold tapered chibi ink outline
    traceBody();
    ctx.strokeStyle = '#1B2214';
    ctx.lineWidth = 3.2;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // 5. Rear dorsal ridge & expressive chibi eyes
    this._drawRearDorsalFin(ctx, pts);
    this._drawChibiEyesAndEmotes(ctx, headFrame);

    ctx.restore();
  }
}

export default Arapaimafish;
