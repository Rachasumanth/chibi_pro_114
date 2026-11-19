/**
 * Alligator Gar (Alligatorgarfish) — Standalone 2D Top-Down Expressive Chibi ES Module
 * Category: fish | Base Size: 185x44px
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

function sampleGarPose(state, t) {
  const p = {
    waveAmp: 0.04, waveFreq: 2.2, phase: t * 2.2, turn: 0,
    tailWag: 0, pecSweep: 0, jawOpen: 0.06, eyeScale: 1,
    pulse: 1, jitterX: 0, jitterY: 0, bobY: 0
  };
  switch (state) {
    case 'breathing':
      p.waveAmp = 0.032; p.waveFreq = 1.9; p.phase = t * 1.9;
      p.pecSweep = Math.sin(t * 2.1) * 0.14;
      p.pulse = 1 + Math.sin(t * 2.2) * 0.022;
      break;
    case 'swimming':
      p.waveAmp = 0.14; p.waveFreq = 7.4; p.phase = t * 7.4;
      p.tailWag = Math.sin(t * 7.4) * 0.34;
      p.pecSweep = -0.32 + Math.sin(t * 7.4) * 0.1;
      break;
    case 'relax':
      p.waveAmp = 0.02; p.waveFreq = 1.1; p.phase = t * 1.1;
      p.pecSweep = 0.16; p.bobY = Math.sin(t * 1.3) * 1.4;
      break;
    case 'left_turn': {
      const k = Math.sin(clamp(t / ONE_SHOTS.left_turn, 0, 1) * Math.PI);
      p.waveAmp = 0.09; p.waveFreq = 5.4; p.phase = t * 5.4;
      p.turn = -0.28 * k; p.tailWag = -0.38 * k;
      break;
    }
    case 'right_turn': {
      const k = Math.sin(clamp(t / ONE_SHOTS.right_turn, 0, 1) * Math.PI);
      p.waveAmp = 0.09; p.waveFreq = 5.4; p.phase = t * 5.4;
      p.turn = 0.28 * k; p.tailWag = 0.38 * k;
      break;
    }
    case 'eating': {
      const k = Math.sin(clamp(t / ONE_SHOTS.eating, 0, 1) * Math.PI);
      p.waveAmp = 0.10; p.waveFreq = 6.5; p.phase = t * 6.5;
      p.jawOpen = 0.15 + k * 0.85; p.pulse = 1 + k * 0.05;
      break;
    }
    case 'hungry':
      p.waveAmp = 0.10; p.waveFreq = 5.2; p.phase = t * 5.2;
      p.jawOpen = 0.25 + Math.abs(Math.sin(t * 8.2)) * 0.42;
      p.eyeScale = 1.12;
      break;
    case 'stress':
      p.waveAmp = 0.13; p.waveFreq = 11; p.phase = t * 11;
      p.jitterX = Math.sin(t * 42) * 1.3; p.jitterY = Math.cos(t * 38) * 1.2;
      break;
    case 'fear':
      p.waveAmp = 0.17; p.waveFreq = 14; p.phase = t * 14;
      p.jitterX = Math.sin(t * 50) * 1.8; p.jitterY = Math.cos(t * 46) * 1.5;
      p.eyeScale = 1.24; p.pecSweep = 0.35;
      break;
    case 'shock': {
      const k = 1 - clamp(t / ONE_SHOTS.shock, 0, 1);
      p.waveAmp = 0.04; p.waveFreq = 15; p.phase = t * 15;
      p.jitterX = Math.sin(t * 56) * 2.1 * k; p.jitterY = Math.cos(t * 52) * 1.7 * k;
      p.eyeScale = 1.34; p.jawOpen = 0.65 * k;
      break;
    }
    case 'happy':
      p.waveAmp = 0.12; p.waveFreq = 6.2; p.phase = t * 6.2;
      p.bobY = -Math.abs(Math.sin(t * 5.8)) * 2.4;
      p.pecSweep = Math.sin(t * 6.8) * 0.25;
      break;
    case 'sad':
      p.waveAmp = 0.02; p.waveFreq = 1.2; p.phase = t * 1.2;
      p.pecSweep = -0.25; p.bobY = 1.6 + Math.sin(t * 1.5) * 0.8;
      break;
  }
  return p;
}

function blendPose(a, b, t) {
  const out = {};
  for (const k of Object.keys(b)) out[k] = lerp(a[k], b[k], t);
  return out;
}

export class Alligatorgarfish {
  static metadata = {
    name: 'Alligator Gar',
    category: 'fish',
    baseLength: 185,
    baseWidth: 44
  };

  constructor(x = 0, y = 0, scale = 1) {
    this.x = x; this.y = y; this.scale = scale; this.angle = 0;
    this._state = 'breathing';
    this._prevState = 'breathing';
    this._stateTime = 0;
    this._totalTime = 0;
    this._blendElapsed = BLEND_TIME;
    this._fromPose = sampleGarPose('breathing', 0);
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

    const target = sampleGarPose(this._state, this._stateTime);
    if (this._blendElapsed < BLEND_TIME) {
      this._blendElapsed = Math.min(BLEND_TIME, this._blendElapsed + step);
      this._pose = blendPose(this._fromPose, target, easeCubic(this._blendElapsed / BLEND_TIME));
    } else {
      this._pose = target;
    }
  }

  _computeSpine(pose) {
    const L = 185;
    // Armored cylindrical prehistoric gar + elongated broad alligator snout
    const xs = [60, 38, 12, -14, -40, -64, -82];
    const ws = [14.5, 20.5, 21.8, 19.6, 15.6, 10.6, 6.2];
    const nodes = [];
    for (let i = 0; i < xs.length; i++) {
      const u = i / (xs.length - 1);
      const env = Math.pow(u, 1.5);
      const y = Math.sin(pose.phase - u * 3.5) * pose.waveAmp * L * 0.45 * env + pose.turn * L * 0.34 * u * u;
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

  _traceGarBody(ctx, spine) {
    const h = spine[0];
    const tail = spine[spine.length - 1];
    ctx.beginPath();
    // Elongated broad alligator snout extending +34px forward from eye level
    ctx.moveTo(h.x + h.tx * 34, h.y + h.ty * 34);
    ctx.bezierCurveTo(
      h.x + h.tx * 33 + h.nx * 9.5, h.y + h.ty * 33 + h.ny * 9.5,
      h.x + h.tx * 14 + h.nx * 10.8, h.y + h.ty * 14 + h.ny * 10.8,
      h.x + h.nx * h.halfW, h.y + h.ny * h.halfW
    );
    for (let i = 1; i < spine.length; i++) {
      const prev = spine[i - 1], cur = spine[i];
      ctx.quadraticCurveTo(
        prev.x + prev.nx * prev.halfW, prev.y + prev.ny * prev.halfW,
        (prev.x + cur.x) * 0.5 + (prev.nx * prev.halfW + cur.nx * cur.halfW) * 0.5,
        (prev.y + cur.y) * 0.5 + (prev.ny * prev.halfW + cur.ny * cur.halfW) * 0.5
      );
    }
    ctx.lineTo(tail.x + tail.nx * tail.halfW, tail.y + tail.ny * tail.halfW);
    ctx.lineTo(tail.x - tail.nx * tail.halfW, tail.y - tail.ny * tail.halfW);
    for (let i = spine.length - 2; i >= 0; i--) {
      const prev = spine[i + 1], cur = spine[i];
      ctx.quadraticCurveTo(
        prev.x - prev.nx * prev.halfW, prev.y - prev.ny * prev.halfW,
        (prev.x + cur.x) * 0.5 - (prev.nx * prev.halfW + cur.nx * cur.halfW) * 0.5,
        (prev.y + cur.y) * 0.5 - (prev.ny * prev.halfW + cur.ny * cur.halfW) * 0.5
      );
    }
    ctx.bezierCurveTo(
      h.x + h.tx * 14 - h.nx * 10.8, h.y + h.ty * 14 - h.ny * 10.8,
      h.x + h.tx * 33 - h.nx * 9.5, h.y + h.ty * 33 - h.ny * 9.5,
      h.x + h.tx * 34, h.y + h.ty * 34
    );
    ctx.closePath();
  }

  _drawSpottedFin(ctx, x, y, angle, len, wid, side) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(len * 0.45, wid * side * 1.15, len, wid * side * 0.35);
    ctx.quadraticCurveTo(len * 0.72, -wid * side * 0.2, 0, 0);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, 0, len, wid * side);
    g.addColorStop(0, '#9E9362');
    g.addColorStop(1, '#68603B');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = '#242214';
    for (const [sx, sy] of [[len * 0.35, wid * side * 0.35], [len * 0.65, wid * side * 0.52], [len * 0.55, wid * side * 0.16]]) {
      ctx.beginPath(); ctx.arc(sx, sy, 2.2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = '#1E1D12';
    ctx.lineWidth = 2.0;
    ctx.stroke();
    ctx.restore();
  }

  _drawSpottedRoundedTail(ctx, spine, pose) {
    // Signature Alligator Gar rounded spotted tail fin (abbreviate heterocercal)
    const tail = spine[spine.length - 1];
    const ang = Math.atan2(tail.ty, tail.tx) + pose.tailWag * 0.55;
    ctx.save();
    ctx.translate(tail.x, tail.y);
    ctx.rotate(ang);

    ctx.beginPath();
    ctx.moveTo(2, -5.5);
    ctx.bezierCurveTo(-8, -16, -24, -18, -28, 0);
    ctx.bezierCurveTo(-24, 18, -8, 16, 2, 5.5);
    ctx.closePath();

    const tg = ctx.createRadialGradient(-10, 0, 2, -12, 0, 24);
    tg.addColorStop(0, '#A69A64');
    tg.addColorStop(0.65, '#7A7044');
    tg.addColorStop(1, '#524B2D');
    ctx.fillStyle = tg;
    ctx.fill();

    ctx.save();
    ctx.clip();
    // Dark ink leopard spots across rounded tail
    ctx.fillStyle = '#242214';
    const spots = [[-9, -6, 2.6], [-16, -9, 2.9], [-21, -2, 2.7], [-14, 2, 2.5], [-19, 8, 2.8], [-9, 7, 2.4]];
    for (const [sx, sy, sr] of spots) {
      ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
    }
    // Fin rays
    ctx.strokeStyle = 'rgba(236, 228, 188, 0.35)';
    ctx.lineWidth = 1.0;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-25, i * 4.5); ctx.stroke();
    }
    ctx.restore();

    ctx.strokeStyle = '#1E1D12';
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.restore();
  }

  _drawToothySnoutTeeth(ctx, spine, pose) {
    const h = spine[0];
    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.rotate(Math.atan2(h.ty, h.tx));

    // Cute protruding alligator teeth peeking along both sides of the broad snout
    const fangScale = 1 + pose.jawOpen * 0.7;
    ctx.fillStyle = '#FFFDF5';
    ctx.strokeStyle = '#1E1D12';
    ctx.lineWidth = 1.2;
    for (const side of [-1, 1]) {
      for (const tx of [14, 20, 26, 31]) {
        const edgeY = (tx > 28 ? 7.2 : 9.4) * side;
        ctx.beginPath();
        ctx.moveTo(tx - 1.8, edgeY);
        ctx.lineTo(tx, edgeY + 3.2 * fangScale * side);
        ctx.lineTo(tx + 1.8, edgeY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  _drawBodyAndGanoidArmor(ctx, spine) {
    // Shadow
    ctx.save();
    ctx.translate(4, 7);
    this._traceGarBody(ctx, spine);
    ctx.fillStyle = 'rgba(24, 26, 14, 0.24)';
    ctx.fill();
    ctx.restore();

    // Armored olive-brown prehistoric base gradient
    this._traceGarBody(ctx, spine);
    const bg = ctx.createLinearGradient(90, -22, -85, 22);
    bg.addColorStop(0, '#9B965E');
    bg.addColorStop(0.32, '#787544');
    bg.addColorStop(0.72, '#575630');
    bg.addColorStop(1, '#3D3D22');
    ctx.fillStyle = bg;
    ctx.fill();

    ctx.save();
    this._traceGarBody(ctx, spine);
    ctx.clip();

    // Interlocking diamond ganoid armor scales across torso (spine[1]..spine[6])
    ctx.lineWidth = 1.15;
    for (let i = 1; i < spine.length - 1; i++) {
      const a = spine[i], b = spine[i + 1];
      const ang = Math.atan2(a.ty, a.tx);
      for (let sub = 0; sub < 2; sub++) {
        const f = sub * 0.5;
        const cx = lerp(a.x, b.x, f);
        const cy = lerp(a.y, b.y, f);
        const hw = lerp(a.halfW, b.halfW, f);
        const rows = 4;
        for (let r = -rows; r <= rows; r++) {
          const offset = (r + (sub % 2 === 0 ? 0 : 0.5)) * (hw * 0.34);
          if (Math.abs(offset) > hw * 0.92) continue;
          const sx = cx + a.nx * offset;
          const sy = cy + a.ny * offset;
          ctx.save();
          ctx.translate(sx, sy);
          ctx.rotate(ang);
          ctx.beginPath();
          ctx.moveTo(6.2, 0);
          ctx.lineTo(0, 4.1);
          ctx.lineTo(-6.2, 0);
          ctx.lineTo(0, -4.1);
          ctx.closePath();
          ctx.fillStyle = (Math.abs(r) % 2 === 0) ? 'rgba(182, 178, 118, 0.24)' : 'rgba(48, 48, 24, 0.22)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(30, 30, 16, 0.42)';
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    // Cel-shaded dorsal ridge darkening & glossy jelly-bean highlight
    ctx.fillStyle = 'rgba(26, 28, 14, 0.32)';
    ctx.beginPath();
    ctx.ellipse(-10, 15, 76, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    // Glossy enamel highlight on armored back & snout bridge
    ctx.fillStyle = 'rgba(248, 245, 205, 0.34)';
    ctx.beginPath();
    ctx.ellipse(22, -5, 26, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 240, 0.55)';
    ctx.beginPath();
    ctx.ellipse(76, -2.5, 9, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Bold chibi outline
    this._traceGarBody(ctx, spine);
    ctx.strokeStyle = '#1E1D12';
    ctx.lineWidth = 3.0;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Alligator snout nostrils at tip
    const h = spine[0];
    for (const side of [-1, 1]) {
      const nx = h.x + h.tx * 29 + h.nx * 3.8 * side;
      const ny = h.y + h.ty * 29 + h.ny * 3.8 * side;
      ctx.fillStyle = '#242214';
      ctx.beginPath();
      ctx.arc(nx, ny, 1.7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _drawEyesAndEmote(ctx, spine, pose) {
    const h = spine[0];
    const headAngle = Math.atan2(h.ty, h.tx);
    const st = this._state;

    // Rosy chibi cheek blushes
    for (const side of [-1, 1]) {
      const cx = h.x - h.tx * 6 + h.nx * 14.5 * side;
      const cy = h.y - h.ty * 6 + h.ny * 14.5 * side;
      ctx.fillStyle = st === 'happy' ? 'rgba(255, 118, 148, 0.52)' : 'rgba(255, 140, 152, 0.34)';
      ctx.beginPath(); ctx.ellipse(cx, cy, 4.5, 2.6, headAngle, 0, Math.PI * 2); ctx.fill();
    }

    // Expressive chibi amber-gold alligator eyes
    for (const side of [-1, 1]) {
      const ex = h.x + h.tx * 2 + h.nx * 11.4 * side;
      const ey = h.y + h.ty * 2 + h.ny * 11.4 * side;
      const r = 5.8 * pose.eyeScale;

      ctx.save();
      ctx.translate(ex, ey);
      ctx.rotate(headAngle);
      if (st === 'happy') {
        ctx.strokeStyle = '#1E1D12'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(0, 1.5, r * 0.72, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      } else if (st === 'stress') {
        ctx.strokeStyle = '#1E1D12'; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(-3.2, -3.2 * side); ctx.lineTo(2.4, 0); ctx.lineTo(-3.2, 3.2 * side); ctx.stroke();
      } else {
        ctx.fillStyle = '#FFFDF5'; ctx.strokeStyle = '#1E1D12'; ctx.lineWidth = 2.0;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        const ir = st === 'shock' ? r * 0.4 : (st === 'fear' ? r * 0.5 : r * 0.72);
        const ig = ctx.createRadialGradient(0.5, 0, 0.5, 0, 0, ir);
        ig.addColorStop(0, '#FCD34D'); ig.addColorStop(0.7, '#B45309'); ig.addColorStop(1, '#451A03');
        ctx.fillStyle = ig;
        ctx.beginPath(); ctx.arc(0.9, 0, ir, 0, Math.PI * 2); ctx.fill();

        const pr = st === 'shock' ? r * 0.22 : (st === 'fear' ? r * 0.28 : r * 0.44);
        ctx.fillStyle = '#18160E';
        ctx.beginPath(); ctx.arc(1.1, 0, pr, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(2.4, -1.7 * side, r * 0.26, 0, Math.PI * 2); ctx.fill();
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
          ctx.fillStyle = '#827E4C';
          ctx.beginPath(); ctx.arc(0, 0, r + 0.4, Math.PI * 0.9, Math.PI * 2.1); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = '#1E1D12'; ctx.lineWidth = 1.8;
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
      ctx.translate(h.x + 18, h.y - 23);
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
        ctx.fillStyle = '#EF4444'; ctx.strokeStyle = '#1E1D12'; ctx.lineWidth = 1.5;
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

    const pNode = spine[1], vNode = spine[4];
    const pAng = Math.atan2(pNode.ty, pNode.tx);
    const vAng = Math.atan2(vNode.ty, vNode.tx);
    for (const side of [-1, 1]) {
      this._drawSpottedFin(ctx, pNode.x + pNode.nx * pNode.halfW * 0.72 * side, pNode.y + pNode.ny * pNode.halfW * 0.72 * side, pAng + Math.PI * 0.74 * side + pose.pecSweep * side, 23, 10.5, side);
      this._drawSpottedFin(ctx, vNode.x + vNode.nx * vNode.halfW * 0.65 * side, vNode.y + vNode.ny * vNode.halfW * 0.65 * side, vAng + Math.PI * 0.78 * side, 16, 8.5, side);
    }

    this._drawSpottedRoundedTail(ctx, spine, pose);
    this._drawToothySnoutTeeth(ctx, spine, pose);
    this._drawBodyAndGanoidArmor(ctx, spine);

    // Rear-set spotted dorsal ridge
    const d0 = spine[4], d1 = spine[5];
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(d0.x, d0.y);
    ctx.lineTo(d1.x, d1.y + pose.tailWag * 8);
    ctx.strokeStyle = '#1E1D12'; ctx.lineWidth = 6.2; ctx.lineCap = 'round'; ctx.stroke();
    ctx.strokeStyle = '#9E9362'; ctx.lineWidth = 3.2; ctx.stroke();
    ctx.restore();

    this._drawEyesAndEmote(ctx, spine, pose);

    ctx.restore();
  }
}

export default Alligatorgarfish;
