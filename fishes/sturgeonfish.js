/**
 * Lake Sturgeon (Sturgeonfish) — Standalone 2D Top-Down Expressive Chibi ES Module
 * Category: fish | Base Size: 205x64px
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

function sampleSturgeonPose(state, t) {
  const p = {
    waveAmp: 0.04, phase: t * 2.2, turn: 0, tailWag: 0,
    pecSweep: 0, barbelWag: Math.sin(t * 3.5) * 3.5,
    eyeScale: 1, pulse: 1, jitterX: 0, jitterY: 0, bobY: 0
  };
  switch (state) {
    case 'breathing':
      p.waveAmp = 0.032; p.phase = t * 1.9;
      p.pecSweep = Math.sin(t * 2.0) * 0.12;
      p.pulse = 1 + Math.sin(t * 2.2) * 0.022;
      break;
    case 'swimming':
      p.waveAmp = 0.14; p.phase = t * 7.6;
      p.tailWag = Math.sin(t * 7.6) * 0.38;
      p.pecSweep = -0.22 + Math.sin(t * 7.6) * 0.1;
      break;
    case 'relax':
      p.waveAmp = 0.02; p.phase = t * 1.1;
      p.bobY = Math.sin(t * 1.3) * 1.5;
      break;
    case 'left_turn': {
      const k = Math.sin(clamp(t / ONE_SHOTS.left_turn, 0, 1) * Math.PI);
      p.turn = -0.28 * k; p.tailWag = -0.44 * k;
      break;
    }
    case 'right_turn': {
      const k = Math.sin(clamp(t / ONE_SHOTS.right_turn, 0, 1) * Math.PI);
      p.turn = 0.28 * k; p.tailWag = 0.44 * k;
      break;
    }
    case 'eating': {
      const k = Math.sin(clamp(t / ONE_SHOTS.eating, 0, 1) * Math.PI);
      p.pulse = 1 + k * 0.06; p.barbelWag = Math.sin(t * 12) * 6;
      break;
    }
    case 'hungry':
      p.barbelWag = Math.sin(t * 10) * 6.5; p.eyeScale = 1.12;
      break;
    case 'stress':
      p.jitterX = Math.sin(t * 44) * 1.4; p.jitterY = Math.cos(t * 40) * 1.2;
      break;
    case 'fear':
      p.jitterX = Math.sin(t * 52) * 1.9; p.jitterY = Math.cos(t * 48) * 1.6;
      p.eyeScale = 1.26;
      break;
    case 'shock': {
      const k = 1 - clamp(t / ONE_SHOTS.shock, 0, 1);
      p.jitterX = Math.sin(t * 58) * 2.2 * k; p.jitterY = Math.cos(t * 54) * 1.8 * k;
      p.eyeScale = 1.35; p.pulse = 1 + 0.06 * k;
      break;
    }
    case 'happy':
      p.bobY = -Math.abs(Math.sin(t * 5.8)) * 2.8;
      p.tailWag = Math.sin(t * 6.8) * 0.34;
      break;
    case 'sad':
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

export class Sturgeonfish {
  static metadata = {
    name: 'Lake Sturgeon',
    category: 'fish',
    baseLength: 205,
    baseWidth: 64
  };

  constructor(x = 0, y = 0, scale = 1) {
    this.x = x; this.y = y; this.scale = scale; this.angle = 0;
    this._state = 'breathing';
    this._prevState = 'breathing';
    this._stateTime = 0;
    this._totalTime = 0;
    this._blendElapsed = BLEND_TIME;
    this._fromPose = sampleSturgeonPose('breathing', 0);
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

    const target = sampleSturgeonPose(this._state, this._stateTime);
    if (this._blendElapsed < BLEND_TIME) {
      this._blendElapsed = Math.min(BLEND_TIME, this._blendElapsed + step);
      this._pose = blendPose(this._fromPose, target, easeCubic(this._blendElapsed / BLEND_TIME));
    } else {
      this._pose = target;
    }
  }

  _computeSpine(pose) {
    const L = 205;
    const xs = [64, 38, 10, -18, -46, -70, -88];
    const ws = [16.0, 24.5, 25.5, 21.5, 15.5, 9.5, 5.2];
    const nodes = [];
    for (let i = 0; i < xs.length; i++) {
      const u = i / (xs.length - 1);
      const env = Math.pow(u, 1.48);
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

  _drawSnoutBarbels(ctx, spine, pose) {
    const h = spine[0];
    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.rotate(Math.atan2(h.ty, h.tx));
    ctx.lineCap = 'round';
    for (const side of [-1, 1]) {
      for (const [bx, by, len] of [[16, 7.5, 11], [23, 4.5, 9]]) {
        ctx.beginPath();
        ctx.moveTo(bx, by * side);
        ctx.quadraticCurveTo(bx + len * 0.5, (by + len * 0.8 + pose.barbelWag * 0.4) * side, bx + len * 0.7, (by + len * 1.2 + pose.barbelWag) * side);
        ctx.strokeStyle = '#24201A'; ctx.lineWidth = 3.2; ctx.stroke();
        ctx.strokeStyle = '#D6CBB8'; ctx.lineWidth = 1.6; ctx.stroke();
      }
    }
    ctx.restore();
  }

  _drawBroadPectoralsAndHeterocercalTail(ctx, spine, pose) {
    const pNode = spine[1];
    const pAng = Math.atan2(pNode.ty, pNode.tx);
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(pNode.x + pNode.nx * pNode.halfW * 0.75 * side, pNode.y + pNode.ny * pNode.halfW * 0.75 * side);
      ctx.rotate(pAng + pose.pecSweep * side);
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.bezierCurveTo(2, 24 * side, -20, 32 * side, -34, 22 * side);
      ctx.quadraticCurveTo(-22, 10 * side, -14, 0);
      ctx.closePath();
      const pg = ctx.createLinearGradient(0, 0, -32, 26 * side);
      pg.addColorStop(0, '#8C8170');
      pg.addColorStop(1, '#574F44');
      ctx.fillStyle = pg;
      ctx.fill();
      ctx.strokeStyle = '#24201A';
      ctx.lineWidth = 2.4;
      ctx.stroke();
      ctx.restore();
    }

    // SIGNATURE HETEROCERCAL SHARK-LIKE TAIL (asymmetric upper lobe longer than lower lobe!)
    const tail = spine[spine.length - 1];
    const tAng = Math.atan2(tail.ty, tail.tx) + pose.tailWag * 0.55;
    ctx.save();
    ctx.translate(tail.x, tail.y);
    ctx.rotate(tAng);
    ctx.beginPath();
    ctx.moveTo(2, -5.0);
    // Elongated swept upper shark-like lobe
    ctx.bezierCurveTo(-12, -16, -26, -28, -38, -26);
    ctx.quadraticCurveTo(-24, -10, -14, 0);
    // Shorter lower lobe
    ctx.quadraticCurveTo(-18, 10, -24, 18);
    ctx.quadraticCurveTo(-10, 14, 2, 5.0);
    ctx.closePath();
    const tg = ctx.createLinearGradient(0, -24, -36, 18);
    tg.addColorStop(0, '#786E5E');
    tg.addColorStop(0.5, '#5C5448');
    tg.addColorStop(1, '#443E35');
    ctx.fillStyle = tg;
    ctx.fill();
    ctx.strokeStyle = '#24201A';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  _traceSturgeonBody(ctx, spine) {
    const h = spine[0], tail = spine[spine.length - 1];
    ctx.beginPath();
    // Pointed armored prehistoric sturgeon snout
    ctx.moveTo(h.x + h.tx * 34, h.y + h.ty * 34);
    ctx.bezierCurveTo(
      h.x + h.tx * 22 + h.nx * 10, h.y + h.ty * 22 + h.ny * 10,
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
      h.x + h.tx * 22 - h.nx * 10, h.y + h.ty * 22 - h.ny * 10,
      h.x + h.tx * 34, h.y + h.ty * 34
    );
    ctx.closePath();
  }

  _drawStarScute(ctx, x, y, ang, size) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(size * 1.4, 0);
    ctx.lineTo(size * 0.35, size * 0.55);
    ctx.lineTo(-size * 0.2, size * 1.0);
    ctx.lineTo(-size * 0.55, size * 0.35);
    ctx.lineTo(-size * 1.35, 0);
    ctx.lineTo(-size * 0.55, -size * 0.35);
    ctx.lineTo(-size * 0.2, -size * 1.0);
    ctx.lineTo(size * 0.35, -size * 0.55);
    ctx.closePath();
    ctx.fillStyle = '#E5DCCB';
    ctx.fill();
    ctx.strokeStyle = '#24201A';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.restore();
  }

  _drawArmoredBodyAndScutes(ctx, spine) {
    // Shadow
    ctx.save();
    ctx.translate(4, 8);
    this._traceSturgeonBody(ctx, spine);
    ctx.fillStyle = 'rgba(36, 32, 26, 0.24)';
    ctx.fill();
    ctx.restore();

    // Armored prehistoric brownish-grey gradient
    this._traceSturgeonBody(ctx, spine);
    const bg = ctx.createLinearGradient(90, -24, -88, 24);
    bg.addColorStop(0, '#A89F91');
    bg.addColorStop(0.35, '#857B6C');
    bg.addColorStop(0.75, '#625A4E');
    bg.addColorStop(1, '#474138');
    ctx.fillStyle = bg;
    ctx.fill();

    ctx.save();
    this._traceSturgeonBody(ctx, spine);
    ctx.clip();

    // Soft cel-shading & glossy highlight
    ctx.fillStyle = 'rgba(36, 32, 26, 0.28)';
    ctx.beginPath(); ctx.ellipse(-10, 18, 78, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(245, 240, 230, 0.36)';
    ctx.beginPath(); ctx.ellipse(26, -7, 24, 5.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    this._traceSturgeonBody(ctx, spine);
    ctx.strokeStyle = '#24201A';
    ctx.lineWidth = 3.0;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // SIGNATURE 3 ROWS OF BONY STAR-SHAPED SCUTES (1 dorsal row + 2 lateral rows)!
    for (let i = 1; i < spine.length - 1; i++) {
      const a = spine[i], b = spine[i + 1];
      const ang = Math.atan2(a.ty, a.tx);
      for (const frac of [0.1, 0.6]) {
        const cx = lerp(a.x, b.x, frac);
        const cy = lerp(a.y, b.y, frac);
        const hw = lerp(a.halfW, b.halfW, frac);
        // Center dorsal star scute
        this._drawStarScute(ctx, cx, cy, ang, 4.8 * (1 - a.u * 0.35));
        // Left & right lateral star scutes
        for (const side of [-1, 1]) {
          this._drawStarScute(ctx, cx + a.nx * hw * 0.72 * side, cy + a.ny * hw * 0.72 * side, ang, 3.6 * (1 - a.u * 0.35));
        }
      }
    }
  }

  _drawEyesAndEmote(ctx, spine, pose) {
    const h = spine[0];
    const headAngle = Math.atan2(h.ty, h.tx);
    const st = this._state;

    for (const side of [-1, 1]) {
      const cx = h.x - h.tx * 7 + h.nx * 16.5 * side;
      const cy = h.y - h.ty * 7 + h.ny * 16.5 * side;
      ctx.fillStyle = st === 'happy' ? 'rgba(255, 108, 142, 0.56)' : 'rgba(255, 132, 152, 0.36)';
      ctx.beginPath(); ctx.ellipse(cx, cy, 4.8, 2.8, headAngle, 0, Math.PI * 2); ctx.fill();
    }

    for (const side of [-1, 1]) {
      const ex = h.x + h.tx * 2 + h.nx * 12.2 * side;
      const ey = h.y + h.ty * 2 + h.ny * 12.2 * side;
      const r = 5.8 * pose.eyeScale;

      ctx.save();
      ctx.translate(ex, ey);
      ctx.rotate(headAngle);
      if (st === 'happy') {
        ctx.strokeStyle = '#24201A'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(0, 1.4, r * 0.72, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      } else if (st === 'stress') {
        ctx.strokeStyle = '#24201A'; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(-3.2, -3.2 * side); ctx.lineTo(2.4, 0); ctx.lineTo(-3.2, 3.2 * side); ctx.stroke();
      } else {
        ctx.fillStyle = '#FFFDF7'; ctx.strokeStyle = '#24201A'; ctx.lineWidth = 2.0;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        const ir = st === 'shock' ? r * 0.38 : (st === 'fear' ? r * 0.48 : r * 0.74);
        const ig = ctx.createRadialGradient(0.5, 0, 0.5, 0, 0, ir);
        ig.addColorStop(0, '#FCD34D'); ig.addColorStop(0.65, '#B45309'); ig.addColorStop(1, '#451A03');
        ctx.fillStyle = ig;
        ctx.beginPath(); ctx.arc(0.9, 0, ir, 0, Math.PI * 2); ctx.fill();

        const pr = st === 'shock' ? r * 0.22 : (st === 'fear' ? r * 0.28 : r * 0.44);
        ctx.fillStyle = '#181410';
        ctx.beginPath(); ctx.arc(1.1, 0, pr, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(2.4, -1.7 * side, r * 0.26, 0, Math.PI * 2); ctx.fill();
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
          ctx.fillStyle = '#857B6C';
          ctx.beginPath(); ctx.arc(0, 0, r + 0.4, Math.PI * 0.9, Math.PI * 2.1); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = '#24201A'; ctx.lineWidth = 1.8;
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
      ctx.translate(h.x + 14, h.y - 26);
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
        ctx.fillStyle = '#EF4444'; ctx.strokeStyle = '#24201A'; ctx.lineWidth = 1.5;
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

    this._drawSnoutBarbels(ctx, spine, pose);
    this._drawBroadPectoralsAndHeterocercalTail(ctx, spine, pose);
    this._drawArmoredBodyAndScutes(ctx, spine);
    this._drawEyesAndEmote(ctx, spine, pose);

    ctx.restore();
  }
}

export default Sturgeonfish;
