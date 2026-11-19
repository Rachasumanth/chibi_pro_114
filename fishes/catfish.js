/**
 * Channel Catfish (Catfish) — Standalone 2D Top-Down Expressive Chibi ES Module
 * Category: fish | Base Size: 150x62px
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

function sampleCatfishPose(state, t) {
  const p = {
    waveAmp: 0.045, phase: t * 2.4, turn: 0, tailWag: 0,
    pecSweep: 0, whiskerSpeed: 3.5, whiskerAmp: 4.5, mouthOpen: 0,
    eyeScale: 1, pulse: 1, jitterX: 0, jitterY: 0, bobY: 0
  };
  switch (state) {
    case 'breathing':
      p.waveAmp = 0.032; p.phase = t * 2.1;
      p.pecSweep = Math.sin(t * 2.1) * 0.14;
      p.whiskerSpeed = 3.2; p.whiskerAmp = 4.2;
      p.pulse = 1 + Math.sin(t * 2.3) * 0.025;
      break;
    case 'swimming':
      p.waveAmp = 0.15; p.phase = t * 8.0;
      p.tailWag = Math.sin(t * 8.0) * 0.4;
      p.pecSweep = -0.25 + Math.sin(t * 8.0) * 0.12;
      p.whiskerSpeed = 7.5; p.whiskerAmp = 6.5;
      break;
    case 'relax':
      p.waveAmp = 0.02; p.phase = t * 1.2;
      p.whiskerSpeed = 1.6; p.whiskerAmp = 2.5;
      p.bobY = Math.sin(t * 1.4) * 1.6;
      break;
    case 'left_turn': {
      const k = Math.sin(clamp(t / ONE_SHOTS.left_turn, 0, 1) * Math.PI);
      p.turn = -0.30 * k; p.tailWag = -0.45 * k;
      break;
    }
    case 'right_turn': {
      const k = Math.sin(clamp(t / ONE_SHOTS.right_turn, 0, 1) * Math.PI);
      p.turn = 0.30 * k; p.tailWag = 0.45 * k;
      break;
    }
    case 'eating': {
      const k = Math.sin(clamp(t / ONE_SHOTS.eating, 0, 1) * Math.PI);
      p.mouthOpen = k * 0.9; p.pulse = 1 + k * 0.06;
      p.whiskerSpeed = 10; p.whiskerAmp = 8.0;
      break;
    }
    case 'hungry':
      p.mouthOpen = 0.25 + Math.abs(Math.sin(t * 8.5)) * 0.45;
      p.whiskerSpeed = 9.0; p.whiskerAmp = 8.5; p.eyeScale = 1.14;
      break;
    case 'stress':
      p.jitterX = Math.sin(t * 46) * 1.4; p.jitterY = Math.cos(t * 42) * 1.2;
      p.whiskerSpeed = 14; p.whiskerAmp = 7.5;
      break;
    case 'fear':
      p.jitterX = Math.sin(t * 52) * 1.9; p.jitterY = Math.cos(t * 48) * 1.6;
      p.eyeScale = 1.26; p.whiskerSpeed = 16; p.whiskerAmp = 9;
      break;
    case 'shock': {
      const k = 1 - clamp(t / ONE_SHOTS.shock, 0, 1);
      p.jitterX = Math.sin(t * 58) * 2.2 * k; p.jitterY = Math.cos(t * 54) * 1.8 * k;
      p.eyeScale = 1.35; p.mouthOpen = 0.65 * k; p.whiskerAmp = 10 * k + 3;
      break;
    }
    case 'happy':
      p.bobY = -Math.abs(Math.sin(t * 6.2)) * 2.8;
      p.whiskerSpeed = 8.5; p.whiskerAmp = 8.0; p.tailWag = Math.sin(t * 7.0) * 0.35;
      break;
    case 'sad':
      p.whiskerSpeed = 1.2; p.whiskerAmp = 1.8;
      p.bobY = 1.8 + Math.sin(t * 1.5) * 0.8;
      break;
  }
  return p;
}

function blendPose(a, b, t) {
  const out = {};
  for (const k of Object.keys(b)) out[k] = lerp(a[k], b[k], t);
  return out;
}

export class Catfish {
  static metadata = {
    name: 'Channel Catfish',
    category: 'fish',
    baseLength: 150,
    baseWidth: 62
  };

  constructor(x = 0, y = 0, scale = 1) {
    this.x = x; this.y = y; this.scale = scale; this.angle = 0;
    this._state = 'breathing';
    this._prevState = 'breathing';
    this._stateTime = 0;
    this._totalTime = 0;
    this._blendElapsed = BLEND_TIME;
    this._fromPose = sampleCatfishPose('breathing', 0);
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

    const target = sampleCatfishPose(this._state, this._stateTime);
    if (this._blendElapsed < BLEND_TIME) {
      this._blendElapsed = Math.min(BLEND_TIME, this._blendElapsed + step);
      this._pose = blendPose(this._fromPose, target, easeCubic(this._blendElapsed / BLEND_TIME));
    } else {
      this._pose = target;
    }
  }

  _computeSpine(pose) {
    const L = 150;
    // Broad flat chibi catfish head tapering smoothly into muscular sleek tail
    const xs = [44, 22, 0, -22, -44, -62];
    const ws = [23.5, 25.0, 21.5, 16.5, 10.5, 5.5];
    const nodes = [];
    for (let i = 0; i < xs.length; i++) {
      const u = i / (xs.length - 1);
      const env = Math.pow(u, 1.45);
      const y = Math.sin(pose.phase - u * 3.3) * pose.waveAmp * L * 0.48 * env + pose.turn * L * 0.35 * u * u;
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

  _draw4PairsWigglyBarbels(ctx, spine, pose) {
    // Signature 4 PAIRS OF INDEPENDENTLY ANIMATED WIGGLY WHISKERS/BARBELS!
    const h = spine[0];
    const ang = Math.atan2(h.ty, h.tx);
    const t = this._totalTime * pose.whiskerSpeed;
    const amp = pose.whiskerAmp;

    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.rotate(ang);
    ctx.lineCap = 'round';

    const pairs = [
      // Pair 1: Long sweeping maxillary whiskers (outer corners of wide flat mouth)
      { bx: 10, by: 16, cx: 22, cy: 30, ex: 14, ey: 44, phase: 0.0, w: 2.6 },
      // Pair 2: Forward nasal whiskers near nostrils
      { bx: 15, by: 9, cx: 29, cy: 16, ex: 36, ey: 24, phase: 1.4, w: 2.0 },
      // Pair 3: Mid chin barbels peeking forward-outward
      { bx: 17, by: 12, cx: 30, cy: 22, ex: 32, ey: 33, phase: 2.7, w: 1.9 },
      // Pair 4: Short inner chin feelers
      { bx: 18, by: 5, cx: 28, cy: 8, ex: 35, ey: 12, phase: 4.1, w: 1.7 }
    ];

    for (const side of [-1, 1]) {
      for (const b of pairs) {
        const w1 = Math.sin(t + b.phase + side * 0.6) * amp;
        const w2 = Math.cos(t * 1.15 + b.phase - side * 0.4) * amp * 1.2;
        ctx.beginPath();
        ctx.moveTo(b.bx, b.by * side);
        ctx.quadraticCurveTo(b.cx + w1 * 0.4, (b.cy + w1) * side, b.ex + w2 * 0.4, (b.ey + w2) * side);
        ctx.strokeStyle = '#1B221E';
        ctx.lineWidth = b.w + 1.6;
        ctx.stroke();
        ctx.strokeStyle = '#94A39B';
        ctx.lineWidth = b.w;
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  _drawFins(ctx, spine, pose) {
    const pNode = spine[1];
    const pAng = Math.atan2(pNode.ty, pNode.tx);
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(pNode.x + pNode.nx * pNode.halfW * 0.78 * side, pNode.y + pNode.ny * pNode.halfW * 0.78 * side);
      ctx.rotate(pAng + (0.45 + pose.pecSweep) * side);
      ctx.beginPath();
      ctx.moveTo(3, 0);
      ctx.bezierCurveTo(6, 16 * side, -12, 24 * side, -22, 14 * side);
      ctx.quadraticCurveTo(-14, 5 * side, -10, 0);
      ctx.closePath();
      ctx.fillStyle = '#6B7D73';
      ctx.fill();
      ctx.strokeStyle = '#1B221E';
      ctx.lineWidth = 2.2;
      ctx.stroke();
      ctx.restore();
    }

    // Deeply forked channel catfish tail
    const tail = spine[spine.length - 1];
    const tAng = Math.atan2(tail.ty, tail.tx) + pose.tailWag * 0.55;
    ctx.save();
    ctx.translate(tail.x, tail.y);
    ctx.rotate(tAng);
    ctx.beginPath();
    ctx.moveTo(2, -5);
    ctx.quadraticCurveTo(-12, -19, -28, -22);
    ctx.quadraticCurveTo(-20, -7, -14, 0);
    ctx.quadraticCurveTo(-20, 7, -28, 22);
    ctx.quadraticCurveTo(-12, 19, 2, 5);
    ctx.closePath();
    const tg = ctx.createLinearGradient(0, 0, -28, 0);
    tg.addColorStop(0, '#5B6D62');
    tg.addColorStop(1, '#3A4940');
    ctx.fillStyle = tg;
    ctx.fill();
    ctx.strokeStyle = '#1B221E';
    ctx.lineWidth = 2.4;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  _traceCatfishBody(ctx, spine) {
    const h = spine[0], tail = spine[spine.length - 1];
    ctx.beginPath();
    // Broad flat rounded chibi catfish head
    ctx.moveTo(h.x + h.tx * 18, h.y + h.ty * 18);
    ctx.bezierCurveTo(
      h.x + h.tx * 17 + h.nx * 20, h.y + h.ty * 17 + h.ny * 20,
      h.x + h.tx * 2 + h.nx * h.halfW, h.y + h.ty * 2 + h.ny * h.halfW,
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
      h.x + h.tx * 2 - h.nx * h.halfW, h.y + h.ty * 2 - h.ny * h.halfW,
      h.x + h.tx * 17 - h.nx * 20, h.y + h.ty * 17 - h.ny * 20,
      h.x + h.tx * 18, h.y + h.ty * 18
    );
    ctx.closePath();
  }

  _drawSmoothSlateBody(ctx, spine) {
    // Shadow
    ctx.save();
    ctx.translate(4, 7);
    this._traceCatfishBody(ctx, spine);
    ctx.fillStyle = 'rgba(27, 34, 30, 0.22)';
    ctx.fill();
    ctx.restore();

    // Smooth scaleless slate-olive gradient
    this._traceCatfishBody(ctx, spine);
    const bg = ctx.createLinearGradient(60, -24, -62, 24);
    bg.addColorStop(0, '#8FA397');
    bg.addColorStop(0.35, '#687C70');
    bg.addColorStop(0.75, '#4A5D52');
    bg.addColorStop(1, '#34443B');
    ctx.fillStyle = bg;
    ctx.fill();

    ctx.save();
    this._traceCatfishBody(ctx, spine);
    ctx.clip();

    // Dark Channel Catfish flank spots
    ctx.fillStyle = '#242F28';
    const spots = [
      [12, -14, 2.6], [-4, -15, 2.9], [-20, -11, 2.5], [-36, -7, 2.2],
      [10, 14, 2.6], [-6, 15, 2.8], [-22, 11, 2.5], [-38, 7, 2.2],
      [-12, -4, 2.3], [-28, 2, 2.4]
    ];
    for (const [sx, sy, sr] of spots) {
      ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
    }

    // Glossy jelly-bean highlight on smooth broad head
    ctx.fillStyle = 'rgba(236, 248, 242, 0.42)';
    ctx.beginPath(); ctx.ellipse(24, -8, 18, 6.2, -0.05, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.68)';
    ctx.beginPath(); ctx.ellipse(35, -9, 5, 2.2, -0.1, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    this._traceCatfishBody(ctx, spine);
    ctx.strokeStyle = '#1B221E';
    ctx.lineWidth = 3.0;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Cute adipose fin + dorsal fin nubs
    ctx.beginPath();
    ctx.moveTo(spine[1].x, spine[1].y);
    ctx.lineTo(spine[2].x, spine[2].y);
    ctx.strokeStyle = '#1B221E'; ctx.lineWidth = 6.2; ctx.lineCap = 'round'; ctx.stroke();
    ctx.strokeStyle = '#8FA397'; ctx.lineWidth = 3.2; ctx.stroke();
  }

  _drawEyesAndEmote(ctx, spine, pose) {
    const h = spine[0];
    const headAngle = Math.atan2(h.ty, h.tx);
    const st = this._state;

    for (const side of [-1, 1]) {
      const cx = h.x - h.tx * 5 + h.nx * 18.5 * side;
      const cy = h.y - h.ty * 5 + h.ny * 18.5 * side;
      ctx.fillStyle = st === 'happy' ? 'rgba(255, 108, 142, 0.58)' : 'rgba(255, 132, 152, 0.38)';
      ctx.beginPath(); ctx.ellipse(cx, cy, 5.2, 3.0, headAngle, 0, Math.PI * 2); ctx.fill();
    }

    for (const side of [-1, 1]) {
      const ex = h.x + h.tx * 4 + h.nx * 14.5 * side;
      const ey = h.y + h.ty * 4 + h.ny * 14.5 * side;
      const r = 6.0 * pose.eyeScale;

      ctx.save();
      ctx.translate(ex, ey);
      ctx.rotate(headAngle);
      if (st === 'happy') {
        ctx.strokeStyle = '#1B221E'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(0, 1.4, r * 0.72, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      } else if (st === 'stress') {
        ctx.strokeStyle = '#1B221E'; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(-3.2, -3.2 * side); ctx.lineTo(2.4, 0); ctx.lineTo(-3.2, 3.2 * side); ctx.stroke();
      } else {
        ctx.fillStyle = '#FFFDF7'; ctx.strokeStyle = '#1B221E'; ctx.lineWidth = 2.0;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        const ir = st === 'shock' ? r * 0.38 : (st === 'fear' ? r * 0.48 : r * 0.74);
        const ig = ctx.createRadialGradient(0.5, 0, 0.5, 0, 0, ir);
        ig.addColorStop(0, '#FDE047'); ig.addColorStop(0.65, '#CA8A04'); ig.addColorStop(1, '#713F12');
        ctx.fillStyle = ig;
        ctx.beginPath(); ctx.arc(0.9, 0, ir, 0, Math.PI * 2); ctx.fill();

        const pr = st === 'shock' ? r * 0.22 : (st === 'fear' ? r * 0.28 : r * 0.44);
        ctx.fillStyle = '#101612';
        ctx.beginPath(); ctx.arc(1.1, 0, pr, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(2.5, -1.7 * side, r * 0.26, 0, Math.PI * 2); ctx.fill();
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
          ctx.fillStyle = '#758A7E';
          ctx.beginPath(); ctx.arc(0, 0, r + 0.4, Math.PI * 0.9, Math.PI * 2.1); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = '#1B221E'; ctx.lineWidth = 1.8;
          ctx.beginPath(); ctx.moveTo(-r, 0.4); ctx.quadraticCurveTo(0, 2.2, r, 0.4); ctx.stroke();
        } else if (st === 'sad' || st === 'fear') {
          ctx.fillStyle = 'rgba(125, 211, 252, 0.88)';
          ctx.beginPath(); ctx.ellipse(-1.4, 2.5 * side, 2.6, 1.6, 0.3 * side, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.restore();
    }

    if (st === 'happy' || st === 'hungry' || st === 'shock' || st === 'fear' || st === 'stress') {
      ctx.save();
      ctx.translate(h.x + 14, h.y - 28);
      if (st === 'happy' || st === 'hungry') {
        ctx.fillStyle = '#FDE047'; ctx.strokeStyle = '#92400E'; ctx.lineWidth = 1.3;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4; const rad = i % 2 === 0 ? 6.6 : 2.6;
          if (i === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
          else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
      } else if (st === 'shock') {
        ctx.fillStyle = '#EF4444'; ctx.strokeStyle = '#1B221E'; ctx.lineWidth = 1.5;
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

    this._draw4PairsWigglyBarbels(ctx, spine, pose);
    this._drawFins(ctx, spine, pose);
    this._drawSmoothSlateBody(ctx, spine);
    this._drawEyesAndEmote(ctx, spine, pose);

    ctx.restore();
  }
}

export default Catfish;
