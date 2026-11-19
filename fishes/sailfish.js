/**
 * Indo-Pacific Sailfish (Sailfish) — Standalone 2D Top-Down Expressive Chibi ES Module
 * Category: fish | Base Size: 200x70px
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

function sampleSailPose(state, t) {
  const p = {
    waveAmp: 0.04, waveFreq: 2.5, phase: t * 2.5, turn: 0,
    tailWag: 0, pecSweep: 0, sailFlare: 1.0, sailWave: 0,
    eyeScale: 1, pulse: 1, jitterX: 0, jitterY: 0, bobY: 0
  };
  switch (state) {
    case 'breathing':
      p.waveAmp = 0.032; p.waveFreq = 2.1; p.phase = t * 2.1;
      p.sailFlare = 0.9 + Math.sin(t * 2.0) * 0.1;
      p.sailWave = Math.sin(t * 2.4) * 3.5;
      p.pulse = 1 + Math.sin(t * 2.3) * 0.024;
      break;
    case 'swimming':
      p.waveAmp = 0.14; p.waveFreq = 9.0; p.phase = t * 9.0;
      p.tailWag = Math.sin(t * 9.0) * 0.42;
      p.pecSweep = -0.26 + Math.sin(t * 9.0) * 0.08;
      p.sailFlare = 0.72; p.sailWave = Math.sin(t * 9.0) * 8.0;
      break;
    case 'relax':
      p.waveAmp = 0.022; p.waveFreq = 1.2; p.phase = t * 1.2;
      p.sailFlare = 1.05; p.sailWave = Math.sin(t * 1.4) * 2.5;
      p.bobY = Math.sin(t * 1.4) * 1.6;
      break;
    case 'left_turn': {
      const k = Math.sin(clamp(t / ONE_SHOTS.left_turn, 0, 1) * Math.PI);
      p.waveAmp = 0.09; p.waveFreq = 6.2; p.phase = t * 6.2;
      p.turn = -0.28 * k; p.tailWag = -0.44 * k; p.sailWave = -12 * k;
      break;
    }
    case 'right_turn': {
      const k = Math.sin(clamp(t / ONE_SHOTS.right_turn, 0, 1) * Math.PI);
      p.waveAmp = 0.09; p.waveFreq = 6.2; p.phase = t * 6.2;
      p.turn = 0.28 * k; p.tailWag = 0.44 * k; p.sailWave = 12 * k;
      break;
    }
    case 'eating': {
      const k = Math.sin(clamp(t / ONE_SHOTS.eating, 0, 1) * Math.PI);
      p.waveAmp = 0.11; p.waveFreq = 7.4; p.phase = t * 7.4;
      p.sailFlare = 1.25; p.pulse = 1 + k * 0.05;
      break;
    }
    case 'hungry':
      p.waveAmp = 0.11; p.waveFreq = 6.0; p.phase = t * 6.0;
      p.sailFlare = 1.18 + Math.sin(t * 7) * 0.1; p.eyeScale = 1.12;
      break;
    case 'stress':
      p.waveAmp = 0.14; p.waveFreq = 12; p.phase = t * 12;
      p.jitterX = Math.sin(t * 44) * 1.4; p.jitterY = Math.cos(t * 40) * 1.2;
      p.sailFlare = 1.3;
      break;
    case 'fear':
      p.waveAmp = 0.17; p.waveFreq = 15; p.phase = t * 15;
      p.jitterX = Math.sin(t * 52) * 1.9; p.jitterY = Math.cos(t * 48) * 1.6;
      p.eyeScale = 1.25; p.sailFlare = 1.35;
      break;
    case 'shock': {
      const k = 1 - clamp(t / ONE_SHOTS.shock, 0, 1);
      p.waveAmp = 0.04; p.waveFreq = 16; p.phase = t * 16;
      p.jitterX = Math.sin(t * 58) * 2.2 * k; p.jitterY = Math.cos(t * 54) * 1.8 * k;
      p.eyeScale = 1.35; p.sailFlare = 1.45;
      break;
    }
    case 'happy':
      p.waveAmp = 0.12; p.waveFreq = 6.6; p.phase = t * 6.6;
      p.bobY = -Math.abs(Math.sin(t * 6.0)) * 2.8;
      p.sailFlare = 1.25; p.sailWave = Math.sin(t * 6.6) * 7.5;
      break;
    case 'sad':
      p.waveAmp = 0.02; p.waveFreq = 1.3; p.phase = t * 1.3;
      p.sailFlare = 0.55; p.bobY = 1.8 + Math.sin(t * 1.6) * 0.8;
      break;
  }
  return p;
}

function blendPose(a, b, t) {
  const out = {};
  for (const k of Object.keys(b)) out[k] = lerp(a[k], b[k], t);
  return out;
}

export class Sailfish {
  static metadata = {
    name: 'Indo-Pacific Sailfish',
    category: 'fish',
    baseLength: 200,
    baseWidth: 70
  };

  constructor(x = 0, y = 0, scale = 1) {
    this.x = x; this.y = y; this.scale = scale; this.angle = 0;
    this._state = 'breathing';
    this._prevState = 'breathing';
    this._stateTime = 0;
    this._totalTime = 0;
    this._blendElapsed = BLEND_TIME;
    this._fromPose = sampleSailPose('breathing', 0);
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

    const target = sampleSailPose(this._state, this._stateTime);
    if (this._blendElapsed < BLEND_TIME) {
      this._blendElapsed = Math.min(BLEND_TIME, this._blendElapsed + step);
      this._pose = blendPose(this._fromPose, target, easeCubic(this._blendElapsed / BLEND_TIME));
    } else {
      this._pose = target;
    }
  }

  _computeSpine(pose) {
    const L = 200;
    // Slender iridescent blue-purple body (+X head at 42, needle bill to +102)
    const xs = [42, 20, -4, -28, -50, -70, -84];
    const ws = [13.5, 20.5, 21.5, 17.8, 12.6, 7.6, 4.2];
    const nodes = [];
    for (let i = 0; i < xs.length; i++) {
      const u = i / (xs.length - 1);
      const env = Math.pow(u, 1.45);
      const y = Math.sin(pose.phase - u * 3.5) * pose.waveAmp * L * 0.44 * env + pose.turn * L * 0.34 * u * u;
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

  _drawNeedleBill(ctx, spine) {
    const h = spine[0];
    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.rotate(Math.atan2(h.ty, h.tx));

    // Slender needle-like bill
    ctx.beginPath();
    ctx.moveTo(-2, -3.8);
    ctx.quadraticCurveTo(28, -1.8, 60, 0);
    ctx.quadraticCurveTo(28, 1.8, -2, 3.8);
    ctx.closePath();

    const g = ctx.createLinearGradient(0, 0, 60, 0);
    g.addColorStop(0, '#4338CA');
    g.addColorStop(0.55, '#818CF8');
    g.addColorStop(1, '#E0E7FF');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = '#1E1B4B';
    ctx.lineWidth = 2.1;
    ctx.stroke();
    ctx.restore();
  }

  _drawPectoralsAndTail(ctx, spine, pose) {
    const n = spine[1];
    const pAng = Math.atan2(n.ty, n.tx);
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(n.x + n.nx * n.halfW * 0.72 * side, n.y + n.ny * n.halfW * 0.72 * side);
      ctx.rotate(pAng + pose.pecSweep * side);
      ctx.beginPath();
      ctx.moveTo(2, 0);
      ctx.bezierCurveTo(-4, 22 * side, -22, 32 * side, -40, 26 * side);
      ctx.bezierCurveTo(-24, 18 * side, -14, 9 * side, -10, 0);
      ctx.closePath();
      const pg = ctx.createLinearGradient(0, 0, -38, 26 * side);
      pg.addColorStop(0, '#4F46E5');
      pg.addColorStop(1, '#93C5FD');
      ctx.fillStyle = pg;
      ctx.fill();
      ctx.strokeStyle = '#1E1B4B';
      ctx.lineWidth = 2.1;
      ctx.stroke();
      ctx.restore();
    }

    // Crescent forked tail
    const tail = spine[spine.length - 1];
    const tAng = Math.atan2(tail.ty, tail.tx) + pose.tailWag * 0.55;
    ctx.save();
    ctx.translate(tail.x, tail.y);
    ctx.rotate(tAng);
    ctx.beginPath();
    ctx.moveTo(2, -4.0);
    ctx.bezierCurveTo(-7, -18, -16, -30, -26, -33);
    ctx.bezierCurveTo(-19, -16, -13, -7, -10, 0);
    ctx.bezierCurveTo(-13, 7, -19, 16, -26, 33);
    ctx.bezierCurveTo(-16, 30, -7, 18, 2, 4.0);
    ctx.closePath();
    const tg = ctx.createLinearGradient(0, -32, -26, 32);
    tg.addColorStop(0, '#312E81');
    tg.addColorStop(0.5, '#4F46E5');
    tg.addColorStop(1, '#312E81');
    ctx.fillStyle = tg;
    ctx.fill();
    ctx.strokeStyle = '#1E1B4B';
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.restore();
  }

  _traceBody(ctx, spine) {
    const h = spine[0], tail = spine[spine.length - 1];
    ctx.beginPath();
    ctx.moveTo(h.x + h.tx * 11, h.y + h.ty * 11);
    ctx.quadraticCurveTo(h.x + h.tx * 4 + h.nx * 12, h.y + h.ty * 4 + h.ny * 12, spine[1].x + spine[1].nx * spine[1].halfW, spine[1].y + spine[1].ny * spine[1].halfW);
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
    ctx.quadraticCurveTo(h.x + h.tx * 4 - h.nx * 12, h.y + h.ty * 4 - h.ny * 12, h.x + h.tx * 11, h.y + h.ty * 11);
    ctx.closePath();
  }

  _drawBodyAndOversizedSail(ctx, spine, pose) {
    // Shadow
    ctx.save();
    ctx.translate(4, 8);
    this._traceBody(ctx, spine);
    ctx.fillStyle = 'rgba(30, 27, 75, 0.22)';
    ctx.fill();
    ctx.restore();

    // Iridescent blue-purple body gradient
    this._traceBody(ctx, spine);
    const bg = ctx.createLinearGradient(46, -22, -84, 22);
    bg.addColorStop(0, '#6366F1');
    bg.addColorStop(0.35, '#4338CA');
    bg.addColorStop(0.7, '#312E81');
    bg.addColorStop(1, '#1E1B4B');
    ctx.fillStyle = bg;
    ctx.fill();

    ctx.save();
    this._traceBody(ctx, spine);
    ctx.clip();

    // Iridescent lavender-cyan flank glow + faint vertical bead-lines
    ctx.fillStyle = 'rgba(165, 180, 252, 0.34)';
    ctx.beginPath(); ctx.ellipse(-12, -18, 56, 8.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-12, 18, 56, 8.5, 0, 0, Math.PI * 2); ctx.fill();

    // Glossy jelly-bean highlight
    ctx.fillStyle = 'rgba(224, 231, 255, 0.45)';
    ctx.beginPath(); ctx.ellipse(16, -6, 18, 5.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    this._traceBody(ctx, spine);
    ctx.strokeStyle = '#1E1B4B';
    ctx.lineWidth = 3.0;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // DRAMATIC OVERSIZED SPOTTED SAIL DORSAL FIN with dark ribs (billowing from spine[1] to spine[5])
    const s1 = spine[1], s2 = spine[2], s3 = spine[3], s4 = spine[4], s5 = spine[5];
    const billow = (24 + pose.sailWave * 0.6) * pose.sailFlare;
    const flutter = Math.sin(this._totalTime * 5.2) * 3.5;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(s1.x + 2, s1.y);
    ctx.bezierCurveTo(
      s2.x + 10, s2.y + billow * 1.15 + flutter,
      s3.x - 2, s3.y + billow * 1.32 - flutter,
      s4.x - 6, s4.y + billow * 0.95 + flutter * 0.8
    );
    ctx.quadraticCurveTo(s5.x - 4, s5.y + billow * 0.45, s5.x, s5.y);
    ctx.lineTo(s4.x, s4.y);
    ctx.lineTo(s3.x, s3.y);
    ctx.lineTo(s2.x, s2.y);
    ctx.closePath();

    const sg = ctx.createLinearGradient(s1.x, s1.y, s3.x, s3.y + billow * 1.2);
    sg.addColorStop(0, 'rgba(37, 99, 235, 0.94)');
    sg.addColorStop(0.5, 'rgba(99, 102, 241, 0.90)');
    sg.addColorStop(1, 'rgba(192, 132, 252, 0.88)');
    ctx.fillStyle = sg;
    ctx.fill();

    // Dark ribs & signature dark sapphire spots on the billowing sail membrane
    ctx.save();
    ctx.clip();
    const ribAnchors = [
      [s1.x - 4, s1.y, s2.x + 6, s2.y + billow * 1.08 + flutter],
      [s2.x, s2.y, s2.x - 4, s2.y + billow * 1.2 + flutter * 0.3],
      [s3.x + 4, s3.y, s3.x - 4, s3.y + billow * 1.24 - flutter * 0.5],
      [s3.x - 8, s3.y, s4.x + 2, s4.y + billow * 1.06 - flutter * 0.2],
      [s4.x, s4.y, s4.x - 6, s4.y + billow * 0.85 + flutter * 0.5],
      [s5.x + 6, s5.y, s5.x - 2, s5.y + billow * 0.45]
    ];
    ctx.strokeStyle = '#1E1B4B';
    ctx.lineWidth = 2.0;
    for (const [x0, y0, x1, y1] of ribAnchors) {
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) * 0.5 + 3, (y0 + y1) * 0.5, x1, y1); ctx.stroke();
    }

    // Dark indigo-violet spots scattered across the sail
    ctx.fillStyle = '#1E1B4B';
    for (let i = 0; i < ribAnchors.length - 1; i++) {
      const a = ribAnchors[i], b = ribAnchors[i + 1];
      for (const f of [0.35, 0.62, 0.82]) {
        const px = lerp(lerp(a[0], a[2], f), lerp(b[0], b[2], f), 0.5);
        const py = lerp(lerp(a[1], a[3], f), lerp(b[1], b[3], f), 0.5);
        ctx.beginPath(); ctx.arc(px, py, 2.3, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();

    // Bold scalloped sail edge outline
    ctx.strokeStyle = '#1E1B4B';
    ctx.lineWidth = 2.6;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  _drawEyesAndEmote(ctx, spine, pose) {
    const h = spine[0];
    const headAngle = Math.atan2(h.ty, h.tx);
    const st = this._state;

    for (const side of [-1, 1]) {
      const cx = h.x - h.tx * 7 + h.nx * 14.5 * side;
      const cy = h.y - h.ty * 7 + h.ny * 14.5 * side;
      ctx.fillStyle = st === 'happy' ? 'rgba(255, 118, 152, 0.55)' : 'rgba(255, 138, 162, 0.35)';
      ctx.beginPath(); ctx.ellipse(cx, cy, 4.6, 2.6, headAngle, 0, Math.PI * 2); ctx.fill();
    }

    for (const side of [-1, 1]) {
      const ex = h.x - h.tx * 1 + h.nx * 11.4 * side;
      const ey = h.y - h.ty * 1 + h.ny * 11.4 * side;
      const r = 6.2 * pose.eyeScale;

      ctx.save();
      ctx.translate(ex, ey);
      ctx.rotate(headAngle);
      if (st === 'happy') {
        ctx.strokeStyle = '#1E1B4B'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(0, 1.5, r * 0.72, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      } else if (st === 'stress') {
        ctx.strokeStyle = '#1E1B4B'; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(-3.4, -3.4 * side); ctx.lineTo(2.4, 0); ctx.lineTo(-3.4, 3.4 * side); ctx.stroke();
      } else {
        ctx.fillStyle = '#F8FAFC'; ctx.strokeStyle = '#1E1B4B'; ctx.lineWidth = 2.1;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        const ir = st === 'shock' ? r * 0.4 : (st === 'fear' ? r * 0.5 : r * 0.74);
        const ig = ctx.createRadialGradient(0.5, 0, 0.5, 0, 0, ir);
        ig.addColorStop(0, '#E879F9'); ig.addColorStop(0.65, '#7C3AED'); ig.addColorStop(1, '#312E81');
        ctx.fillStyle = ig;
        ctx.beginPath(); ctx.arc(0.9, 0, ir, 0, Math.PI * 2); ctx.fill();

        const pr = st === 'shock' ? r * 0.22 : (st === 'fear' ? r * 0.28 : r * 0.44);
        ctx.fillStyle = '#0F0D24';
        ctx.beginPath(); ctx.arc(1.1, 0, pr, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(2.6, -1.8 * side, r * 0.27, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(-1.0, 1.6 * side, r * 0.14, 0, Math.PI * 2); ctx.fill();

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
          ctx.fillStyle = '#4F46E5';
          ctx.beginPath(); ctx.arc(0, 0, r + 0.4, Math.PI * 0.9, Math.PI * 2.1); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = '#1E1B4B'; ctx.lineWidth = 1.8;
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
      ctx.translate(h.x + 12, h.y - 24);
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
        ctx.fillStyle = '#EF4444'; ctx.strokeStyle = '#1E1B4B'; ctx.lineWidth = 1.5;
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

    this._drawPectoralsAndTail(ctx, spine, pose);
    this._drawNeedleBill(ctx, spine);
    this._drawBodyAndOversizedSail(ctx, spine, pose);
    this._drawEyesAndEmote(ctx, spine, pose);

    ctx.restore();
  }
}

export default Sailfish;
