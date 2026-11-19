/**
 * Tiger Muskie (Tigermuskiefish) — Standalone 2D Top-Down Expressive Chibi ES Module
 * Category: fish | Base Size: 165x44px
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

function sampleMuskiePose(state, t) {
  const p = {
    waveAmp: 0.045, waveFreq: 2.3, phase: t * 2.3, turn: 0,
    tailWag: 0, pecSweep: 0, jawOpen: 0, eyeScale: 1,
    pulse: 1, jitterX: 0, jitterY: 0, bobY: 0
  };
  switch (state) {
    case 'breathing':
      p.waveAmp = 0.032; p.waveFreq = 2.0; p.phase = t * 2.0;
      p.pecSweep = Math.sin(t * 2.1) * 0.14;
      p.pulse = 1 + Math.sin(t * 2.3) * 0.025;
      break;
    case 'swimming':
      p.waveAmp = 0.15; p.waveFreq = 8.2; p.phase = t * 8.2;
      p.tailWag = Math.sin(t * 8.2) * 0.38;
      p.pecSweep = -0.32 + Math.sin(t * 8.2) * 0.12;
      break;
    case 'relax':
      p.waveAmp = 0.022; p.waveFreq = 1.2; p.phase = t * 1.2;
      p.pecSweep = 0.16; p.bobY = Math.sin(t * 1.4) * 1.5;
      break;
    case 'left_turn': {
      const k = Math.sin(clamp(t / ONE_SHOTS.left_turn, 0, 1) * Math.PI);
      p.waveAmp = 0.10; p.waveFreq = 6.0; p.phase = t * 6.0;
      p.turn = -0.30 * k; p.tailWag = -0.42 * k;
      break;
    }
    case 'right_turn': {
      const k = Math.sin(clamp(t / ONE_SHOTS.right_turn, 0, 1) * Math.PI);
      p.waveAmp = 0.10; p.waveFreq = 6.0; p.phase = t * 6.0;
      p.turn = 0.30 * k; p.tailWag = 0.42 * k;
      break;
    }
    case 'eating': {
      const k = Math.sin(clamp(t / ONE_SHOTS.eating, 0, 1) * Math.PI);
      p.waveAmp = 0.12; p.waveFreq = 7.2; p.phase = t * 7.2;
      p.jawOpen = k * 0.9; p.pulse = 1 + k * 0.06;
      break;
    }
    case 'hungry':
      p.waveAmp = 0.11; p.waveFreq = 5.6; p.phase = t * 5.6;
      p.jawOpen = 0.24 + Math.abs(Math.sin(t * 8.4)) * 0.44;
      p.eyeScale = 1.12;
      break;
    case 'stress':
      p.waveAmp = 0.14; p.waveFreq = 11.5; p.phase = t * 11.5;
      p.jitterX = Math.sin(t * 44) * 1.3; p.jitterY = Math.cos(t * 40) * 1.2;
      break;
    case 'fear':
      p.waveAmp = 0.18; p.waveFreq = 14.5; p.phase = t * 14.5;
      p.jitterX = Math.sin(t * 52) * 1.8; p.jitterY = Math.cos(t * 48) * 1.6;
      p.eyeScale = 1.24; p.pecSweep = 0.36;
      break;
    case 'shock': {
      const k = 1 - clamp(t / ONE_SHOTS.shock, 0, 1);
      p.waveAmp = 0.04; p.waveFreq = 15; p.phase = t * 15;
      p.jitterX = Math.sin(t * 56) * 2.1 * k; p.jitterY = Math.cos(t * 52) * 1.7 * k;
      p.eyeScale = 1.34; p.jawOpen = 0.58 * k;
      break;
    }
    case 'happy':
      p.waveAmp = 0.13; p.waveFreq = 6.4; p.phase = t * 6.4;
      p.bobY = -Math.abs(Math.sin(t * 6.0)) * 2.6;
      p.pecSweep = Math.sin(t * 6.8) * 0.25;
      break;
    case 'sad':
      p.waveAmp = 0.02; p.waveFreq = 1.3; p.phase = t * 1.3;
      p.pecSweep = -0.24; p.bobY = 1.6 + Math.sin(t * 1.5) * 0.8;
      break;
  }
  return p;
}

function blendPose(a, b, t) {
  const out = {};
  for (const k of Object.keys(b)) out[k] = lerp(a[k], b[k], t);
  return out;
}

export class Tigermuskiefish {
  static metadata = {
    name: 'Tiger Muskie',
    category: 'fish',
    baseLength: 165,
    baseWidth: 44
  };

  constructor(x = 0, y = 0, scale = 1) {
    this.x = x; this.y = y; this.scale = scale; this.angle = 0;
    this._state = 'breathing';
    this._prevState = 'breathing';
    this._stateTime = 0;
    this._totalTime = 0;
    this._blendElapsed = BLEND_TIME;
    this._fromPose = sampleMuskiePose('breathing', 0);
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

    const target = sampleMuskiePose(this._state, this._stateTime);
    if (this._blendElapsed < BLEND_TIME) {
      this._blendElapsed = Math.min(BLEND_TIME, this._blendElapsed + step);
      this._pose = blendPose(this._fromPose, target, easeCubic(this._blendElapsed / BLEND_TIME));
    } else {
      this._pose = target;
    }
  }

  _computeSpine(pose) {
    const L = 165;
    const xs = [60, 38, 14, -10, -34, -56, -70];
    const ws = [12.5, 20.5, 21.8, 19.0, 14.4, 9.0, 5.2];
    const nodes = [];
    for (let i = 0; i < xs.length; i++) {
      const u = i / (xs.length - 1);
      const env = Math.pow(u, 1.45);
      const y = Math.sin(pose.phase - u * 3.4) * pose.waveAmp * L * 0.48 * env + pose.turn * L * 0.36 * u * u;
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

  _traceBody(ctx, spine) {
    const h = spine[0], tail = spine[spine.length - 1];
    ctx.beginPath();
    // Duck-bill muskie snout
    ctx.moveTo(h.x + h.tx * 20, h.y + h.ty * 20);
    ctx.bezierCurveTo(
      h.x + h.tx * 19 + h.nx * 10.5, h.y + h.ty * 19 + h.ny * 10.5,
      h.x + h.tx * 6 + h.nx * 12.5, h.y + h.ty * 6 + h.ny * 12.5,
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
      h.x + h.tx * 6 - h.nx * 12.5, h.y + h.ty * 6 - h.ny * 12.5,
      h.x + h.tx * 19 - h.nx * 10.5, h.y + h.ty * 19 - h.ny * 10.5,
      h.x + h.tx * 20, h.y + h.ty * 20
    );
    ctx.closePath();
  }

  _drawCrimsonFin(ctx, x, y, angle, len, wid, side) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(len * 0.45, wid * side * 1.15, len, wid * side * 0.35);
    ctx.quadraticCurveTo(len * 0.72, -wid * side * 0.2, 0, 0);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, 0, len, wid * side);
    g.addColorStop(0, '#E89B7C');
    g.addColorStop(0.55, '#DC4B3E');
    g.addColorStop(1, '#991B1B');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = '#231D18';
    ctx.lineWidth = 2.0;
    ctx.stroke();
    ctx.restore();
  }

  _drawCrimsonForkedTail(ctx, spine, pose) {
    const tail = spine[spine.length - 1];
    const ang = Math.atan2(tail.ty, tail.tx) + pose.tailWag * 0.55;
    ctx.save();
    ctx.translate(tail.x, tail.y);
    ctx.rotate(ang);

    // Forked crimson-tinted tail fin with dark tiger smudges
    ctx.beginPath();
    ctx.moveTo(2, -4.8);
    ctx.quadraticCurveTo(-13, -18, -28, -21);
    ctx.quadraticCurveTo(-22, -7, -15, 0);
    ctx.quadraticCurveTo(-22, 7, -28, 21);
    ctx.quadraticCurveTo(-13, 18, 2, 4.8);
    ctx.closePath();

    const tg = ctx.createLinearGradient(0, 0, -28, 0);
    tg.addColorStop(0, '#D9A78B');
    tg.addColorStop(0.45, '#DC2626');
    tg.addColorStop(1, '#7F1D1D');
    ctx.fillStyle = tg;
    ctx.fill();

    ctx.save();
    ctx.clip();
    ctx.fillStyle = 'rgba(30, 20, 18, 0.35)';
    for (const [bx, by] of [[-12, -9], [-20, -13], [-14, 0], [-12, 9], [-20, 13]]) {
      ctx.beginPath(); ctx.ellipse(bx, by, 3.0, 2.2, 0.3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();

    ctx.strokeStyle = '#231D18';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  _drawBodyAndTigerBars(ctx, spine) {
    // Shadow
    ctx.save();
    ctx.translate(4, 7);
    this._traceBody(ctx, spine);
    ctx.fillStyle = 'rgba(24, 24, 20, 0.22)';
    ctx.fill();
    ctx.restore();

    // Silvery-cream muscular body gradient
    this._traceBody(ctx, spine);
    const bg = ctx.createLinearGradient(74, -22, -70, 22);
    bg.addColorStop(0, '#F5F2E6');
    bg.addColorStop(0.35, '#DDD8C4');
    bg.addColorStop(0.75, '#B8B49E');
    bg.addColorStop(1, '#94917C');
    ctx.fillStyle = bg;
    ctx.fill();

    ctx.save();
    this._traceBody(ctx, spine);
    ctx.clip();

    // Bold dark vertical tiger bars across silvery-cream body!
    for (let i = 1; i < spine.length - 1; i++) {
      const a = spine[i], b = spine[i + 1];
      const ang = Math.atan2(a.ty, a.tx);
      for (const frac of [0.1, 0.58]) {
        const bx = lerp(a.x, b.x, frac);
        const by = lerp(a.y, b.y, frac);
        const hw = lerp(a.halfW, b.halfW, frac);
        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(ang);
        ctx.fillStyle = '#2F3B28';
        ctx.beginPath();
        ctx.moveTo(3.2, -hw * 1.05);
        ctx.quadraticCurveTo(6.0, -hw * 0.3, 2.2, 0);
        ctx.quadraticCurveTo(5.6, hw * 0.4, 3.0, hw * 1.05);
        ctx.lineTo(-3.2, hw * 1.05);
        ctx.quadraticCurveTo(-0.6, hw * 0.4, -3.0, 0);
        ctx.quadraticCurveTo(-0.4, -hw * 0.3, -3.2, -hw * 1.05);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }

    // Soft cel-shading & glossy chibi highlight
    ctx.fillStyle = 'rgba(28, 34, 24, 0.24)';
    ctx.beginPath(); ctx.ellipse(-6, 16, 68, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 250, 0.55)';
    ctx.beginPath(); ctx.ellipse(18, -6, 24, 5.8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    this._traceBody(ctx, spine);
    ctx.strokeStyle = '#231D18';
    ctx.lineWidth = 3.0;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  _drawEyesAndEmote(ctx, spine, pose) {
    const h = spine[0];
    const headAngle = Math.atan2(h.ty, h.tx);
    const st = this._state;

    for (const side of [-1, 1]) {
      const cx = h.x - h.tx * 8 + h.nx * 14.5 * side;
      const cy = h.y - h.ty * 8 + h.ny * 14.5 * side;
      ctx.fillStyle = st === 'happy' ? 'rgba(255, 118, 148, 0.52)' : 'rgba(255, 138, 152, 0.34)';
      ctx.beginPath(); ctx.ellipse(cx, cy, 4.6, 2.7, headAngle, 0, Math.PI * 2); ctx.fill();
    }

    for (const side of [-1, 1]) {
      const ex = h.x - h.tx * 1 + h.nx * 11.2 * side;
      const ey = h.y - h.ty * 1 + h.ny * 11.2 * side;
      const r = 6.0 * pose.eyeScale;

      ctx.save();
      ctx.translate(ex, ey);
      ctx.rotate(headAngle);
      if (st === 'happy') {
        ctx.strokeStyle = '#231D18'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(0, 1.5, r * 0.72, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      } else if (st === 'stress') {
        ctx.strokeStyle = '#231D18'; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(-3.2, -3.2 * side); ctx.lineTo(2.4, 0); ctx.lineTo(-3.2, 3.2 * side); ctx.stroke();
      } else {
        ctx.fillStyle = '#FFFDF5'; ctx.strokeStyle = '#231D18'; ctx.lineWidth = 2.0;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        const ir = st === 'shock' ? r * 0.4 : (st === 'fear' ? r * 0.5 : r * 0.72);
        const ig = ctx.createRadialGradient(0.5, 0, 0.5, 0, 0, ir);
        ig.addColorStop(0, '#FDBA74'); ig.addColorStop(0.65, '#EA580C'); ig.addColorStop(1, '#7C2D12');
        ctx.fillStyle = ig;
        ctx.beginPath(); ctx.arc(0.9, 0, ir, 0, Math.PI * 2); ctx.fill();

        const pr = st === 'shock' ? r * 0.22 : (st === 'fear' ? r * 0.28 : r * 0.44);
        ctx.fillStyle = '#18120E';
        ctx.beginPath(); ctx.arc(1.1, 0, pr, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(2.5, -1.7 * side, r * 0.26, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(-0.9, 1.6 * side, r * 0.13, 0, Math.PI * 2); ctx.fill();

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
          ctx.fillStyle = '#CFCAB5';
          ctx.beginPath(); ctx.arc(0, 0, r + 0.4, Math.PI * 0.9, Math.PI * 2.1); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = '#231D18'; ctx.lineWidth = 1.8;
          ctx.beginPath(); ctx.moveTo(-r, 0.4); ctx.quadraticCurveTo(0, 2.2, r, 0.4); ctx.stroke();
        } else if (st === 'sad' || st === 'fear') {
          ctx.fillStyle = 'rgba(125, 211, 252, 0.85)';
          ctx.beginPath(); ctx.ellipse(-1.4, 2.5 * side, 2.6, 1.6, 0.3 * side, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.restore();
    }

    if (st === 'happy' || st === 'hungry' || st === 'shock' || st === 'fear' || st === 'stress') {
      ctx.save();
      ctx.translate(h.x + 14, h.y - 23);
      if (st === 'happy' || st === 'hungry') {
        ctx.fillStyle = '#FDE047'; ctx.strokeStyle = '#92400E'; ctx.lineWidth = 1.3;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4; const rad = i % 2 === 0 ? 6.5 : 2.5;
          if (i === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
          else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
      } else if (st === 'shock') {
        ctx.fillStyle = '#EF4444'; ctx.strokeStyle = '#231D18'; ctx.lineWidth = 1.5;
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

    const pNode = spine[1], vNode = spine[3];
    const pAng = Math.atan2(pNode.ty, pNode.tx);
    const vAng = Math.atan2(vNode.ty, vNode.tx);
    for (const side of [-1, 1]) {
      this._drawCrimsonFin(ctx, pNode.x + pNode.nx * pNode.halfW * 0.72 * side, pNode.y + pNode.ny * pNode.halfW * 0.72 * side, pAng + Math.PI * 0.72 * side + pose.pecSweep * side, 23, 11, side);
      this._drawCrimsonFin(ctx, vNode.x + vNode.nx * vNode.halfW * 0.65 * side, vNode.y + vNode.ny * vNode.halfW * 0.65 * side, vAng + Math.PI * 0.76 * side, 16, 8.5, side);
    }

    this._drawCrimsonForkedTail(ctx, spine, pose);
    this._drawBodyAndTigerBars(ctx, spine);

    // Rear-set crimson dorsal ridge
    const d0 = spine[4], d1 = spine[5];
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(d0.x + 4, d0.y);
    ctx.lineTo(d1.x - 4, d1.y + pose.tailWag * 9);
    ctx.strokeStyle = '#231D18'; ctx.lineWidth = 6.5; ctx.lineCap = 'round'; ctx.stroke();
    ctx.strokeStyle = '#DC2626'; ctx.lineWidth = 3.5; ctx.stroke();
    ctx.restore();

    this._drawEyesAndEmote(ctx, spine, pose);

    ctx.restore();
  }
}

export default Tigermuskiefish;
