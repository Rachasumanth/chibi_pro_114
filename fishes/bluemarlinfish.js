/**
 * Blue Marlin (Bluemarlinfish) — Standalone 2D Top-Down Expressive Chibi ES Module
 * Category: fish | Base Size: 225x74px
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

function sampleMarlinPose(state, t) {
  const p = {
    waveAmp: 0.036, waveFreq: 2.5, phase: t * 2.5, turn: 0,
    tailWag: 0, pecSweep: 0, stripeGlow: 0.72, jawOpen: 0,
    eyeScale: 1, pulse: 1, jitterX: 0, jitterY: 0, bobY: 0
  };
  switch (state) {
    case 'breathing':
      p.waveAmp = 0.03; p.waveFreq = 2.1; p.phase = t * 2.1;
      p.pecSweep = Math.sin(t * 2.1) * 0.09;
      p.pulse = 1 + Math.sin(t * 2.3) * 0.024;
      break;
    case 'swimming':
      p.waveAmp = 0.13; p.waveFreq = 8.8; p.phase = t * 8.8;
      p.tailWag = Math.sin(t * 8.8) * 0.42;
      p.pecSweep = -0.24 + Math.sin(t * 8.8) * 0.09;
      p.stripeGlow = 0.92;
      break;
    case 'relax':
      p.waveAmp = 0.02; p.waveFreq = 1.2; p.phase = t * 1.2;
      p.pecSweep = 0.14; p.bobY = Math.sin(t * 1.4) * 1.6;
      p.stripeGlow = 0.55;
      break;
    case 'left_turn': {
      const k = Math.sin(clamp(t / ONE_SHOTS.left_turn, 0, 1) * Math.PI);
      p.waveAmp = 0.09; p.waveFreq = 6.2; p.phase = t * 6.2;
      p.turn = -0.28 * k; p.tailWag = -0.44 * k;
      break;
    }
    case 'right_turn': {
      const k = Math.sin(clamp(t / ONE_SHOTS.right_turn, 0, 1) * Math.PI);
      p.waveAmp = 0.09; p.waveFreq = 6.2; p.phase = t * 6.2;
      p.turn = 0.28 * k; p.tailWag = 0.44 * k;
      break;
    }
    case 'eating': {
      const k = Math.sin(clamp(t / ONE_SHOTS.eating, 0, 1) * Math.PI);
      p.waveAmp = 0.11; p.waveFreq = 7.4; p.phase = t * 7.4;
      p.jawOpen = k * 0.85; p.stripeGlow = 1.0; p.pulse = 1 + k * 0.05;
      break;
    }
    case 'hungry':
      p.waveAmp = 0.10; p.waveFreq = 5.8; p.phase = t * 5.8;
      p.jawOpen = 0.22 + Math.abs(Math.sin(t * 8.5)) * 0.4;
      p.eyeScale = 1.12; p.stripeGlow = 0.96;
      break;
    case 'stress':
      p.waveAmp = 0.14; p.waveFreq = 12; p.phase = t * 12;
      p.jitterX = Math.sin(t * 44) * 1.4; p.jitterY = Math.cos(t * 40) * 1.2;
      p.stripeGlow = 0.98;
      break;
    case 'fear':
      p.waveAmp = 0.17; p.waveFreq = 15; p.phase = t * 15;
      p.jitterX = Math.sin(t * 52) * 1.9; p.jitterY = Math.cos(t * 48) * 1.6;
      p.eyeScale = 1.25; p.pecSweep = 0.32;
      break;
    case 'shock': {
      const k = 1 - clamp(t / ONE_SHOTS.shock, 0, 1);
      p.waveAmp = 0.04; p.waveFreq = 16; p.phase = t * 16;
      p.jitterX = Math.sin(t * 58) * 2.3 * k; p.jitterY = Math.cos(t * 54) * 1.8 * k;
      p.eyeScale = 1.35; p.jawOpen = 0.55 * k; p.stripeGlow = 1.0;
      break;
    }
    case 'happy':
      p.waveAmp = 0.11; p.waveFreq = 6.6; p.phase = t * 6.6;
      p.bobY = -Math.abs(Math.sin(t * 6.0)) * 2.8;
      p.pecSweep = Math.sin(t * 6.8) * 0.22; p.stripeGlow = 0.95;
      break;
    case 'sad':
      p.waveAmp = 0.02; p.waveFreq = 1.3; p.phase = t * 1.3;
      p.pecSweep = -0.22; p.bobY = 1.8 + Math.sin(t * 1.6) * 0.8; p.stripeGlow = 0.45;
      break;
  }
  return p;
}

function blendPose(a, b, t) {
  const out = {};
  for (const k of Object.keys(b)) out[k] = lerp(a[k], b[k], t);
  return out;
}

export class Bluemarlinfish {
  static metadata = {
    name: 'Blue Marlin',
    category: 'fish',
    baseLength: 225,
    baseWidth: 74
  };

  constructor(x = 0, y = 0, scale = 1) {
    this.x = x; this.y = y; this.scale = scale; this.angle = 0;
    this._state = 'breathing';
    this._prevState = 'breathing';
    this._stateTime = 0;
    this._totalTime = 0;
    this._blendElapsed = BLEND_TIME;
    this._fromPose = sampleMarlinPose('breathing', 0);
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

    const target = sampleMarlinPose(this._state, this._stateTime);
    if (this._blendElapsed < BLEND_TIME) {
      this._blendElapsed = Math.min(BLEND_TIME, this._blendElapsed + step);
      this._pose = blendPose(this._fromPose, target, easeCubic(this._blendElapsed / BLEND_TIME));
    } else {
      this._pose = target;
    }
  }

  _computeSpine(pose) {
    const L = 225;
    // Muscular cobalt pelagic silhouette (+X nose at 54, conical spear extends to +112)
    const xs = [54, 30, 4, -22, -48, -74, -92];
    const ws = [16.0, 26.5, 28.2, 23.0, 15.8, 9.2, 4.8];
    const nodes = [];
    for (let i = 0; i < xs.length; i++) {
      const u = i / (xs.length - 1);
      const env = Math.pow(u, 1.5);
      const y = Math.sin(pose.phase - u * 3.4) * pose.waveAmp * L * 0.42 * env + pose.turn * L * 0.32 * u * u;
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

  _drawSpearBill(ctx, spine) {
    const h = spine[0];
    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.rotate(Math.atan2(h.ty, h.tx));

    // Pointed conical marlin spear bill
    ctx.beginPath();
    ctx.moveTo(-2, -5.2);
    ctx.quadraticCurveTo(26, -2.8, 60, 0);
    ctx.quadraticCurveTo(26, 2.8, -2, 5.2);
    ctx.closePath();

    const g = ctx.createLinearGradient(0, -4, 60, 4);
    g.addColorStop(0, '#1E40AF');
    g.addColorStop(0.45, '#38BDF8');
    g.addColorStop(1, '#E0F2FE');
    ctx.fillStyle = g;
    ctx.fill();

    ctx.strokeStyle = '#0C1A3A';
    ctx.lineWidth = 2.3;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  _drawScythePectorals(ctx, spine, pose) {
    const n = spine[1];
    const ang = Math.atan2(n.ty, n.tx);
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(n.x + n.nx * n.halfW * 0.72 * side, n.y + n.ny * n.halfW * 0.72 * side);
      ctx.rotate(ang + pose.pecSweep * side);

      // Swept-back cobalt-silver scythe pectoral fins
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.bezierCurveTo(-4, 26 * side, -26, 38 * side, -48, 34 * side);
      ctx.bezierCurveTo(-28, 24 * side, -18, 12 * side, -12, 0);
      ctx.closePath();

      const pg = ctx.createLinearGradient(0, 0, -44, 34 * side);
      pg.addColorStop(0, '#1D4ED8');
      pg.addColorStop(0.55, '#0EA5E9');
      pg.addColorStop(1, '#BAE6FD');
      ctx.fillStyle = pg;
      ctx.fill();

      ctx.strokeStyle = 'rgba(224, 242, 254, 0.5)';
      ctx.lineWidth = 1.1;
      for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-2 * i, 2 * side);
        ctx.quadraticCurveTo(-14 - i * 4, (14 + i * 4) * side, -38 + i * 3, (28 - i * 2) * side);
        ctx.stroke();
      }

      ctx.strokeStyle = '#0C1A3A';
      ctx.lineWidth = 2.4;
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawForkedCrescentTail(ctx, spine, pose) {
    const tail = spine[spine.length - 1];
    const ang = Math.atan2(tail.ty, tail.tx) + pose.tailWag * 0.55;
    ctx.save();
    ctx.translate(tail.x, tail.y);
    ctx.rotate(ang);

    ctx.beginPath();
    ctx.moveTo(2, -4.5);
    ctx.bezierCurveTo(-8, -19, -18, -34, -29, -37);
    ctx.bezierCurveTo(-21, -18, -15, -7, -11, 0);
    ctx.bezierCurveTo(-15, 7, -21, 18, -29, 37);
    ctx.bezierCurveTo(-18, 34, -8, 19, 2, 4.5);
    ctx.closePath();

    const tg = ctx.createLinearGradient(0, -36, -28, 36);
    tg.addColorStop(0, '#1E3A8A');
    tg.addColorStop(0.5, '#2563EB');
    tg.addColorStop(1, '#1E3A8A');
    ctx.fillStyle = tg;
    ctx.fill();

    ctx.strokeStyle = '#0C1A3A';
    ctx.lineWidth = 2.6;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  _traceBody(ctx, spine) {
    const h = spine[0];
    const tail = spine[spine.length - 1];
    ctx.beginPath();
    ctx.moveTo(h.x + h.tx * 12, h.y + h.ty * 12);
    ctx.quadraticCurveTo(h.x + h.tx * 5 + h.nx * 14, h.y + h.ty * 5 + h.ny * 14, spine[1].x + spine[1].nx * spine[1].halfW, spine[1].y + spine[1].ny * spine[1].halfW);
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
    ctx.quadraticCurveTo(h.x + h.tx * 5 - h.nx * 14, h.y + h.ty * 5 - h.ny * 14, h.x + h.tx * 12, h.y + h.ty * 12);
    ctx.closePath();
  }

  _drawBodyAndLuminousStripes(ctx, spine, pose) {
    // Shadow
    ctx.save();
    ctx.translate(4, 8);
    this._traceBody(ctx, spine);
    ctx.fillStyle = 'rgba(12, 26, 58, 0.24)';
    ctx.fill();
    ctx.restore();

    // Cobalt-blue upper body gradient
    this._traceBody(ctx, spine);
    const bg = ctx.createLinearGradient(58, -28, -90, 28);
    bg.addColorStop(0, '#3B82F6');
    bg.addColorStop(0.28, '#1D4ED8');
    bg.addColorStop(0.68, '#1E3A8A');
    bg.addColorStop(1, '#172554');
    ctx.fillStyle = bg;
    ctx.fill();

    ctx.save();
    this._traceBody(ctx, spine);
    ctx.clip();

    // Silvery-white oceanic flank shimmer
    ctx.fillStyle = 'rgba(224, 242, 254, 0.34)';
    ctx.beginPath(); ctx.ellipse(-10, -23, 72, 11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-10, 23, 72, 11, 0, 0, Math.PI * 2); ctx.fill();

    // Signature Blue Marlin luminous electric-silver vertical stripes (lit-up rows across cobalt back!)
    const glow = pose.stripeGlow;
    for (let i = 1; i <= 5; i++) {
      const a = spine[i], b = spine[i + 1];
      for (const frac of [0.15, 0.65]) {
        const sx = lerp(a.x, b.x, frac);
        const sy = lerp(a.y, b.y, frac);
        const hw = lerp(a.halfW, b.halfW, frac);
        const ang = Math.atan2(a.ty, a.tx);
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(ang);
        ctx.strokeStyle = `rgba(186, 230, 253, ${0.78 * glow})`;
        ctx.lineWidth = 3.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, -hw * 0.85);
        ctx.quadraticCurveTo(3.2, 0, 0, hw * 0.85);
        ctx.stroke();

        ctx.strokeStyle = `rgba(255, 255, 255, ${0.65 * glow})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.restore();
      }
    }

    // Glossy jelly-bean chibi highlight
    ctx.fillStyle = 'rgba(224, 242, 254, 0.44)';
    ctx.beginPath(); ctx.ellipse(18, -8, 24, 6.5, -0.05, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
    ctx.beginPath(); ctx.ellipse(32, -9.5, 5.8, 2.3, -0.1, 0, Math.PI * 2); ctx.fill();

    ctx.restore();

    // Bold chibi outline
    this._traceBody(ctx, spine);
    ctx.strokeStyle = '#0C1A3A';
    ctx.lineWidth = 3.2;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Long tapering cobalt dorsal fin ridge along spine[1]..spine[5]
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(spine[1].x + 2, spine[1].y);
    for (let i = 2; i <= 5; i++) {
      ctx.lineTo(spine[i].x, spine[i].y + Math.sin(i * 0.9) * 3.5 + pose.tailWag * i * 1.4);
    }
    ctx.strokeStyle = '#0C1A3A'; ctx.lineWidth = 7.2; ctx.lineCap = 'round'; ctx.stroke();
    ctx.strokeStyle = '#38BDF8'; ctx.lineWidth = 3.8; ctx.stroke();
    ctx.restore();
  }

  _drawEyesAndEmote(ctx, spine, pose) {
    const h = spine[0];
    const headAngle = Math.atan2(h.ty, h.tx);
    const st = this._state;

    for (const side of [-1, 1]) {
      const cx = h.x - h.tx * 9 + h.nx * 18.0 * side;
      const cy = h.y - h.ty * 9 + h.ny * 18.0 * side;
      ctx.fillStyle = st === 'happy' ? 'rgba(255, 118, 152, 0.56)' : 'rgba(255, 138, 162, 0.36)';
      ctx.beginPath(); ctx.ellipse(cx, cy, 5.2, 3.0, headAngle, 0, Math.PI * 2); ctx.fill();
    }

    for (const side of [-1, 1]) {
      const ex = h.x - h.tx * 1 + h.nx * 13.8 * side;
      const ey = h.y - h.ty * 1 + h.ny * 13.8 * side;
      const r = 6.8 * pose.eyeScale;

      ctx.save();
      ctx.translate(ex, ey);
      ctx.rotate(headAngle);
      if (st === 'happy') {
        ctx.strokeStyle = '#0C1A3A'; ctx.lineWidth = 2.8; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(0, 1.5, r * 0.72, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      } else if (st === 'stress') {
        ctx.strokeStyle = '#0C1A3A'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(-3.6, -3.6 * side); ctx.lineTo(2.6, 0); ctx.lineTo(-3.6, 3.6 * side); ctx.stroke();
      } else {
        ctx.fillStyle = '#F8FAFC'; ctx.strokeStyle = '#0C1A3A'; ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        const ir = st === 'shock' ? r * 0.4 : (st === 'fear' ? r * 0.5 : r * 0.74);
        const ig = ctx.createRadialGradient(0.5, 0, 0.5, 0, 0, ir);
        ig.addColorStop(0, '#67E8F9'); ig.addColorStop(0.65, '#0284C7'); ig.addColorStop(1, '#1E3A8A');
        ctx.fillStyle = ig;
        ctx.beginPath(); ctx.arc(1.0, 0, ir, 0, Math.PI * 2); ctx.fill();

        const pr = st === 'shock' ? r * 0.22 : (st === 'fear' ? r * 0.28 : r * 0.44);
        ctx.fillStyle = '#070E20';
        ctx.beginPath(); ctx.arc(1.2, 0, pr, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(2.8, -2.0 * side, r * 0.27, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(-1.1, 1.8 * side, r * 0.14, 0, Math.PI * 2); ctx.fill();

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
          ctx.fillStyle = '#2563EB';
          ctx.beginPath(); ctx.arc(0, 0, r + 0.4, Math.PI * 0.9, Math.PI * 2.1); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = '#0C1A3A'; ctx.lineWidth = 1.9;
          ctx.beginPath(); ctx.moveTo(-r, 0.4); ctx.quadraticCurveTo(0, 2.4, r, 0.4); ctx.stroke();
        } else if (st === 'sad' || st === 'fear') {
          ctx.fillStyle = 'rgba(125, 211, 252, 0.88)';
          ctx.beginPath(); ctx.ellipse(-1.5, 2.8 * side, 2.9, 1.8, 0.3 * side, 0, Math.PI * 2); ctx.fill();
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
          const a = (i * Math.PI) / 4; const rad = i % 2 === 0 ? 7 : 2.8;
          if (i === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
          else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
      } else if (st === 'shock') {
        ctx.fillStyle = '#EF4444'; ctx.strokeStyle = '#0C1A3A'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(-2.5, -12); ctx.lineTo(2.5, -12); ctx.lineTo(1.8, -1); ctx.lineTo(-1.8, -1); ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 3.5, 2.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      } else {
        ctx.fillStyle = '#38BDF8'; ctx.strokeStyle = '#0369A1'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(0, -7.5); ctx.quadraticCurveTo(5.2, 1, 0, 5.8); ctx.quadraticCurveTo(-5.2, 1, 0, -7.5); ctx.closePath();
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

    this._drawScythePectorals(ctx, spine, pose);
    this._drawForkedCrescentTail(ctx, spine, pose);
    this._drawSpearBill(ctx, spine);
    this._drawBodyAndLuminousStripes(ctx, spine, pose);
    this._drawEyesAndEmote(ctx, spine, pose);

    ctx.restore();
  }
}

export default Bluemarlinfish;
