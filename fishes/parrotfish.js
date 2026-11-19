/**
 * Rainbow Parrotfish (Parrotfish) — Standalone 2D Top-Down Expressive Chibi ES Module
 * Category: fish | Base Size: 130x56px
 * Bespoke HTML5 Canvas 2D renderer — zero external dependencies.
 */

const VALID_STATES = new Set([
  'breathing', 'swimming', 'relax', 'left_turn', 'right_turn',
  'eating', 'hungry', 'stress', 'fear', 'shock', 'happy', 'sad'
]);
const ALIASES = { idle: 'breathing', hunger: 'hungry' };
const ONE_SHOTS = { left_turn: 0.65, right_turn: 0.65, eating: 0.55, shock: 0.8 };
const BLEND_TIME = 0.15;

function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
function easeCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

function normalizeState(name) {
  if (typeof name !== 'string') return null;
  const k = name.trim().toLowerCase();
  const s = ALIASES[k] || k;
  return VALID_STATES.has(s) ? s : null;
}

function canTransition(from, to) {
  if (!to) return false;
  if (from === 'shock') return to === 'fear';
  if (from === 'fear') {
    return !(to === 'left_turn' || to === 'right_turn' || to === 'relax' || to === 'happy' || to === 'eating' || to === 'hungry' || to === 'sad');
  }
  if (from === 'left_turn' || from === 'right_turn' || from === 'eating') {
    return to === 'shock' || to === 'fear' || to === 'stress';
  }
  return true;
}

function sampleParrotPose(state, t) {
  const p = {
    waveAmp: 0.04, phase: t * 2.4, turn: 0, tailWag: 0,
    pecSweep: 0, beakChomp: 0, eyeScale: 1,
    pulse: 1, jitterX: 0, jitterY: 0, bobY: 0
  };
  switch (state) {
    case 'breathing':
      p.waveAmp = 0.03; p.phase = t * 2.1;
      p.pecSweep = Math.sin(t * 2.2) * 0.18;
      p.pulse = 1 + Math.sin(t * 2.3) * 0.025;
      break;
    case 'swimming':
      p.waveAmp = 0.14; p.phase = t * 8.2;
      p.tailWag = Math.sin(t * 8.2) * 0.4;
      p.pecSweep = Math.sin(t * 8.2) * 0.42;
      break;
    case 'relax':
      p.waveAmp = 0.02; p.phase = t * 1.2;
      p.pecSweep = 0.16; p.bobY = Math.sin(t * 1.4) * 1.6;
      break;
    case 'left_turn': {
      const k = Math.sin(clamp(t / ONE_SHOTS.left_turn, 0, 1) * Math.PI);
      p.turn = -0.28 * k; p.tailWag = -0.45 * k;
      break;
    }
    case 'right_turn': {
      const k = Math.sin(clamp(t / ONE_SHOTS.right_turn, 0, 1) * Math.PI);
      p.turn = 0.28 * k; p.tailWag = 0.45 * k;
      break;
    }
    case 'eating': {
      const k = Math.sin(clamp(t / ONE_SHOTS.eating, 0, 1) * Math.PI);
      p.beakChomp = k * 0.9; p.pulse = 1 + k * 0.06;
      break;
    }
    case 'hungry':
      p.beakChomp = 0.2 + Math.abs(Math.sin(t * 9.0)) * 0.5;
      p.eyeScale = 1.14;
      break;
    case 'stress':
      p.jitterX = Math.sin(t * 46) * 1.4; p.jitterY = Math.cos(t * 42) * 1.2;
      break;
    case 'fear':
      p.jitterX = Math.sin(t * 52) * 1.9; p.jitterY = Math.cos(t * 48) * 1.6;
      p.eyeScale = 1.26;
      break;
    case 'shock': {
      const k = 1 - clamp(t / ONE_SHOTS.shock, 0, 1);
      p.jitterX = Math.sin(t * 58) * 2.2 * k; p.jitterY = Math.cos(t * 54) * 1.8 * k;
      p.eyeScale = 1.35; p.beakChomp = 0.65 * k;
      break;
    }
    case 'happy':
      p.bobY = -Math.abs(Math.sin(t * 6.2)) * 2.8;
      p.pecSweep = Math.sin(t * 7.0) * 0.35; p.tailWag = Math.sin(t * 7.0) * 0.32;
      break;
    case 'sad':
      p.pecSweep = -0.22; p.bobY = 1.6 + Math.sin(t * 1.5) * 0.8;
      break;
  }
  return p;
}

function blendPose(a, b, t) {
  const out = {};
  for (const k of Object.keys(b)) out[k] = lerp(a[k], b[k], t);
  return out;
}

export class Parrotfish {
  static metadata = {
    name: 'Rainbow Parrotfish',
    category: 'fish',
    baseLength: 130,
    baseWidth: 56
  };

  constructor(x = 0, y = 0, scale = 1) {
    this.x = x; this.y = y; this.scale = scale; this.angle = 0;
    this._state = 'breathing';
    this._prevState = 'breathing';
    this._stateTime = 0;
    this._totalTime = 0;
    this._blendElapsed = BLEND_TIME;
    this._fromPose = sampleParrotPose('breathing', 0);
    this._pose = { ...this._fromPose };
    this._listeners = new Map();
  }

  getState() { return this._state; }
  setAngle(radians) { if (Number.isFinite(radians)) this.angle = radians; }
  setDirection(dx, dy) {
    if (Number.isFinite(dx) && Number.isFinite(dy) && (dx !== 0 || dy !== 0)) {
      this.angle = Math.atan2(dy, dx);
    }
  }

  onFinished(name, callback) {
    const s = normalizeState(name);
    if (!s || typeof callback !== 'function') return;
    if (!this._listeners.has(s)) this._listeners.set(s, []);
    this._listeners.get(s).push(callback);
  }

  _emitFinished(state) {
    const list = this._listeners.get(state);
    if (!list) return;
    for (const cb of [...list]) { try { cb(state, this); } catch (_) {} }
  }

  play(name) {
    const next = normalizeState(name);
    if (!next || next === this._state) return false;
    if (!canTransition(this._state, next)) return false;
    if (!ONE_SHOTS[this._state]) this._prevState = this._state;
    this._fromPose = { ...this._pose };
    this._state = next;
    this._stateTime = 0;
    this._blendElapsed = 0;
    return true;
  }

  update(dt) {
    const step = clamp(Number.isFinite(dt) ? dt : 0, 0, 0.1);
    this._stateTime += step;
    this._totalTime += step;

    const dur = ONE_SHOTS[this._state];
    if (dur && this._stateTime >= dur) {
      const done = this._state;
      const ret = VALID_STATES.has(this._prevState) ? this._prevState : 'breathing';
      this._fromPose = { ...this._pose };
      this._state = ret;
      this._stateTime = 0;
      this._blendElapsed = 0;
      this._emitFinished(done);
    }

    const target = sampleParrotPose(this._state, this._stateTime);
    if (this._blendElapsed < BLEND_TIME) {
      this._blendElapsed = Math.min(BLEND_TIME, this._blendElapsed + step);
      this._pose = blendPose(this._fromPose, target, easeCubic(this._blendElapsed / BLEND_TIME));
    } else {
      this._pose = target;
    }
  }

  _computeSpine(pose) {
    const L = 130;
    const xs = [44, 22, 0, -22, -40, -52];
    const ws = [19.5, 25.5, 25.0, 20.5, 13.5, 7.5];
    const nodes = [];
    for (let i = 0; i < xs.length; i++) {
      const u = i / (xs.length - 1);
      const env = Math.pow(u, 1.45);
      const y = Math.sin(pose.phase - u * 3.2) * pose.waveAmp * L * 0.45 * env + pose.turn * L * 0.34 * u * u;
      nodes.push({ x: xs[i], y, u, halfW: ws[i] * pose.pulse });
    }
    for (let i = 0; i < nodes.length; i++) {
      const p0 = nodes[Math.max(0, i - 1)];
      const p1 = nodes[Math.min(nodes.length - 1, i + 1)];
      const dx = p0.x - p1.x, dy = p0.y - p1.y;
      const len = Math.hypot(dx, dy) || 1;
      nodes[i].tx = dx / len; nodes[i].ty = dy / len;
      nodes[i].nx = -dy / len; nodes[i].ny = dx / len;
    }
    return nodes;
  }

  _drawRainbowPectorals(ctx, spine, pose) {
    const n = spine[1];
    const ang = Math.atan2(n.ty, n.tx);
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(n.x + n.nx * n.halfW * 0.72 * side, n.y + n.ny * n.halfW * 0.72 * side);
      ctx.rotate(ang + (0.35 + pose.pecSweep) * side);
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.bezierCurveTo(6, 18 * side, -12, 26 * side, -22, 16 * side);
      ctx.quadraticCurveTo(-14, 6 * side, -10, 0);
      ctx.closePath();

      const pg = ctx.createLinearGradient(0, 0, -20, 22 * side);
      pg.addColorStop(0, '#2DD4BF');
      pg.addColorStop(0.55, '#38BDF8');
      pg.addColorStop(1, '#F472B6');
      ctx.fillStyle = pg;
      ctx.fill();
      ctx.strokeStyle = '#1E1B3A';
      ctx.lineWidth = 2.2;
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawLunateRainbowTail(ctx, spine, pose) {
    const tail = spine[spine.length - 1];
    const ang = Math.atan2(tail.ty, tail.tx) + pose.tailWag * 0.6;
    ctx.save();
    ctx.translate(tail.x, tail.y);
    ctx.rotate(ang);

    ctx.beginPath();
    ctx.moveTo(2, -6.5);
    ctx.bezierCurveTo(-10, -18, -22, -24, -27, -21);
    ctx.quadraticCurveTo(-18, 0, -27, 21);
    ctx.bezierCurveTo(-22, 24, -10, 18, 2, 6.5);
    ctx.closePath();

    const tg = ctx.createLinearGradient(0, -22, -26, 22);
    tg.addColorStop(0, '#EC4899');
    tg.addColorStop(0.5, '#14B8A6');
    tg.addColorStop(1, '#EC4899');
    ctx.fillStyle = tg;
    ctx.fill();

    ctx.strokeStyle = '#1E1B3A';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  _traceBody(ctx, spine) {
    const h = spine[0], tail = spine[spine.length - 1];
    ctx.beginPath();
    ctx.moveTo(h.x + h.tx * 15, h.y + h.ty * 15);
    ctx.bezierCurveTo(
      h.x + h.tx * 14 + h.nx * 16, h.y + h.ty * 14 + h.ny * 16,
      h.x + h.nx * h.halfW, h.y + h.ny * h.halfW,
      spine[1].x + spine[1].nx * spine[1].halfW, spine[1].y + spine[1].ny * spine[1].halfW
    );
    for (let i = 2; i < spine.length; i++) {
      const prev = spine[i - 1], cur = spine[i];
      ctx.quadraticCurveTo(
        prev.x + prev.nx * prev.halfW, prev.y + prev.ny * prev.halfW,
        (prev.x + cur.x) * 0.5 + (prev.nx * prev.halfW + cur.nx * cur.halfW) * 0.5,
        (prev.y + cur.y) * 0.5 + (prev.ny * prev.halfW + cur.ny * cur.halfW) * 0.5
      );
    }
    ctx.lineTo(tail.x + tail.nx * tail.halfW, tail.y + tail.ny * tail.halfW);
    ctx.lineTo(tail.x - tail.nx * tail.halfW, tail.y - tail.ny * tail.halfW);
    for (let i = spine.length - 2; i >= 1; i--) {
      const prev = spine[i + 1], cur = spine[i];
      ctx.quadraticCurveTo(
        prev.x - prev.nx * prev.halfW, prev.y - prev.ny * prev.halfW,
        (prev.x + cur.x) * 0.5 - (prev.nx * prev.halfW + cur.nx * cur.halfW) * 0.5,
        (prev.y + cur.y) * 0.5 - (prev.ny * prev.halfW + cur.ny * cur.halfW) * 0.5
      );
    }
    ctx.bezierCurveTo(
      h.x - h.nx * h.halfW, h.y - h.ny * h.halfW,
      h.x + h.tx * 14 - h.nx * 16, h.y + h.ty * 14 - h.ny * 16,
      h.x + h.tx * 15, h.y + h.ty * 15
    );
    ctx.closePath();
  }

  _drawBodyAndRainbowScales(ctx, spine, pose) {
    // Shadow
    ctx.save();
    ctx.translate(4, 7);
    this._traceBody(ctx, spine);
    ctx.fillStyle = 'rgba(30, 27, 58, 0.22)';
    ctx.fill();
    ctx.restore();

    // Sturdy turquoise -> emerald -> magenta rainbow gradient body!
    this._traceBody(ctx, spine);
    const bg = ctx.createLinearGradient(56, -24, -52, 24);
    bg.addColorStop(0, '#2DD4BF');
    bg.addColorStop(0.32, '#10B981');
    bg.addColorStop(0.68, '#0EA5E9');
    bg.addColorStop(1, '#D946EF');
    ctx.fillStyle = bg;
    ctx.fill();

    ctx.save();
    this._traceBody(ctx, spine);
    ctx.clip();

    // Magenta & peach reef cheek accent bands
    ctx.fillStyle = 'rgba(244, 114, 182, 0.42)';
    ctx.beginPath(); ctx.ellipse(26, -18, 18, 8, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(26, 18, 18, 8, 0.2, 0, Math.PI * 2); ctx.fill();

    // Scalloped rainbow scales across back & flanks!
    const scaleColors = ['#F472B6', '#FDE047', '#34D399', '#38BDF8', '#C084FC'];
    for (let i = 1; i < spine.length - 1; i++) {
      const n = spine[i];
      const ang = Math.atan2(n.ty, n.tx);
      for (let r = -2; r <= 2; r++) {
        const off = r * (n.halfW * 0.38);
        const sx = n.x + n.nx * off;
        const sy = n.y + n.ny * off;
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(ang);
        ctx.strokeStyle = scaleColors[(i + Math.abs(r)) % scaleColors.length];
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.arc(0, 0, 5.4, Math.PI * 0.55, Math.PI * 1.45);
        ctx.stroke();
        ctx.restore();
      }
    }

    // Glossy jelly-bean chibi highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.44)';
    ctx.beginPath(); ctx.ellipse(16, -8, 18, 5.5, -0.1, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    this._traceBody(ctx, spine);
    ctx.strokeStyle = '#1E1B3A';
    ctx.lineWidth = 3.0;
    ctx.stroke();

    // Distinct cute IVORY PARROT BEAK mouth at snout!
    const h = spine[0];
    const chomp = pose.beakChomp;
    ctx.save();
    ctx.translate(h.x + h.tx * 13, h.y + h.ty * 13);
    ctx.rotate(Math.atan2(h.ty, h.tx));

    ctx.fillStyle = '#FFFBEB';
    ctx.strokeStyle = '#1E1B3A';
    ctx.lineWidth = 2.2;
    // Left & right fused ivory beak plates
    ctx.beginPath();
    ctx.moveTo(0, -6.5);
    ctx.quadraticCurveTo(9 + chomp * 3, -4.5, 8 + chomp * 3, -0.8 - chomp * 1.6);
    ctx.lineTo(1, -0.4);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, 6.5);
    ctx.quadraticCurveTo(9 + chomp * 3, 4.5, 8 + chomp * 3, 0.8 + chomp * 1.6);
    ctx.lineTo(1, 0.4);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.restore();

    // Iridescent dorsal ridge
    ctx.beginPath();
    ctx.moveTo(spine[1].x, spine[1].y);
    for (let i = 2; i <= 4; i++) ctx.lineTo(spine[i].x, spine[i].y);
    ctx.strokeStyle = '#1E1B3A'; ctx.lineWidth = 6.2; ctx.lineCap = 'round'; ctx.stroke();
    ctx.strokeStyle = '#F472B6'; ctx.lineWidth = 3.2; ctx.stroke();
  }

  _drawEyesAndEmote(ctx, spine, pose) {
    const h = spine[0];
    const headAngle = Math.atan2(h.ty, h.tx);
    const st = this._state;

    for (const side of [-1, 1]) {
      const cx = h.x - h.tx * 7 + h.nx * 16.5 * side;
      const cy = h.y - h.ty * 7 + h.ny * 16.5 * side;
      ctx.fillStyle = st === 'happy' ? 'rgba(255, 108, 152, 0.6)' : 'rgba(255, 132, 162, 0.4)';
      ctx.beginPath(); ctx.ellipse(cx, cy, 5.2, 3.0, headAngle, 0, Math.PI * 2); ctx.fill();
    }

    for (const side of [-1, 1]) {
      const ex = h.x + h.tx * 1 + h.nx * 13.0 * side;
      const ey = h.y + h.ty * 1 + h.ny * 13.0 * side;
      const r = 6.4 * pose.eyeScale;

      ctx.save();
      ctx.translate(ex, ey);
      ctx.rotate(headAngle);
      if (st === 'happy') {
        ctx.strokeStyle = '#1E1B3A'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(0, 1.4, r * 0.72, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      } else if (st === 'stress') {
        ctx.strokeStyle = '#1E1B3A'; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(-3.4, -3.4 * side); ctx.lineTo(2.4, 0); ctx.lineTo(-3.4, 3.4 * side); ctx.stroke();
      } else {
        ctx.fillStyle = '#FFFDF7'; ctx.strokeStyle = '#1E1B3A'; ctx.lineWidth = 2.1;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        const ir = st === 'shock' ? r * 0.38 : (st === 'fear' ? r * 0.48 : r * 0.74);
        const ig = ctx.createRadialGradient(0.5, 0, 0.5, 0, 0, ir);
        ig.addColorStop(0, '#FDE047'); ig.addColorStop(0.65, '#EC4899'); ig.addColorStop(1, '#701A75');
        ctx.fillStyle = ig;
        ctx.beginPath(); ctx.arc(1.0, 0, ir, 0, Math.PI * 2); ctx.fill();

        const pr = st === 'shock' ? r * 0.22 : (st === 'fear' ? r * 0.28 : r * 0.45);
        ctx.fillStyle = '#140E26';
        ctx.beginPath(); ctx.arc(1.2, 0, pr, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(2.6, -1.8 * side, r * 0.27, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(-0.9, 1.6 * side, r * 0.14, 0, Math.PI * 2); ctx.fill();

        if (st === 'hungry') {
          ctx.fillStyle = '#FEF08A';
          ctx.beginPath();
          for (let k = 0; k < 8; k++) {
            const a = (k * Math.PI) / 4 + this._totalTime * 4;
            const rad = k % 2 === 0 ? r * 0.52 : r * 0.2;
            if (k === 0) ctx.moveTo(0.8 + Math.cos(a) * rad, Math.sin(a) * rad);
            else ctx.lineTo(0.8 + Math.cos(a) * rad, Math.sin(a) * rad);
          }
          ctx.closePath(); ctx.fill();
        } else if (st === 'relax') {
          ctx.fillStyle = '#2DD4BF';
          ctx.beginPath(); ctx.arc(0, 0, r + 0.4, Math.PI * 0.9, Math.PI * 2.1); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = '#1E1B3A'; ctx.lineWidth = 1.8;
          ctx.beginPath(); ctx.moveTo(-r, 0.4); ctx.quadraticCurveTo(0, 2.2, r, 0.4); ctx.stroke();
        } else if (st === 'sad' || st === 'fear') {
          ctx.fillStyle = 'rgba(125, 211, 252, 0.88)';
          ctx.beginPath(); ctx.ellipse(-1.4, 2.6 * side, 2.7, 1.6, 0.3 * side, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.restore();
    }

    if (st === 'happy' || st === 'hungry' || st === 'shock' || st === 'fear' || st === 'stress') {
      ctx.save();
      ctx.translate(h.x + 12, h.y - 26);
      if (st === 'happy' || st === 'hungry') {
        ctx.fillStyle = '#FDE047'; ctx.strokeStyle = '#92400E'; ctx.lineWidth = 1.3;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4; const rad = i % 2 === 0 ? 6.8 : 2.6;
          if (i === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
          else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
      } else if (st === 'shock') {
        ctx.fillStyle = '#EF4444'; ctx.strokeStyle = '#1E1B3A'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(-2.4, -11); ctx.lineTo(2.4, -11); ctx.lineTo(1.7, -1); ctx.lineTo(-1.7, -1); ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 3.2, 2.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      } else {
        ctx.fillStyle = '#38BDF8'; ctx.strokeStyle = '#0369A1'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(0, -7); ctx.quadraticCurveTo(5, 1, 0, 5.5); ctx.quadraticCurveTo(-5, 1, 0, -7); ctx.closePath();
        ctx.fill(); ctx.stroke();
      }
      ctx.restore();
    }
  }

  draw(ctx) {
    if (!ctx) return;
    const pose = this._pose;
    const spine = this._computeSpine(pose);

    ctx.save();
    ctx.translate(this.x + pose.jitterX, this.y + pose.jitterY + pose.bobY);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    this._drawRainbowPectorals(ctx, spine, pose);
    this._drawLunateRainbowTail(ctx, spine, pose);
    this._drawBodyAndRainbowScales(ctx, spine, pose);
    this._drawEyesAndEmote(ctx, spine, pose);

    ctx.restore();
  }
}

export default Parrotfish;
