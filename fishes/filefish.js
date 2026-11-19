/**
 * Scrawled Filefish (Filefish) — Standalone 2D Top-Down Expressive Chibi ES Module
 * Category: fish | Base Size: 120x48px
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

function sampleFilePose(state, t) {
  const p = {
    waveAmp: 0.045, phase: t * 2.3, turn: 0, tailWag: 0,
    pecFlutter: t * 9, glow: 0.85, mouthOpen: 0,
    eyeScale: 1, pulse: 1, jitterX: 0, jitterY: 0, bobY: 0
  };
  switch (state) {
    case 'breathing':
      p.waveAmp = 0.035; p.phase = t * 2.0; p.pecFlutter = t * 8;
      p.tailWag = Math.sin(t * 2.1) * 0.18;
      p.pulse = 1 + Math.sin(t * 2.2) * 0.025;
      break;
    case 'swimming':
      p.waveAmp = 0.15; p.phase = t * 8.0; p.pecFlutter = t * 18;
      p.tailWag = Math.sin(t * 8.0) * 0.42;
      break;
    case 'relax':
      p.waveAmp = 0.02; p.phase = t * 1.2; p.pecFlutter = t * 5;
      p.bobY = Math.sin(t * 1.4) * 1.6;
      break;
    case 'left_turn': {
      const k = Math.sin(clamp(t / ONE_SHOTS.left_turn, 0, 1) * Math.PI);
      p.turn = -0.28 * k; p.tailWag = -0.46 * k;
      break;
    }
    case 'right_turn': {
      const k = Math.sin(clamp(t / ONE_SHOTS.right_turn, 0, 1) * Math.PI);
      p.turn = 0.28 * k; p.tailWag = 0.46 * k;
      break;
    }
    case 'eating': {
      const k = Math.sin(clamp(t / ONE_SHOTS.eating, 0, 1) * Math.PI);
      p.mouthOpen = k * 0.85; p.pulse = 1 + k * 0.06; p.glow = 1.0;
      break;
    }
    case 'hungry':
      p.mouthOpen = 0.22 + Math.abs(Math.sin(t * 8.5)) * 0.42;
      p.eyeScale = 1.12; p.glow = 0.98;
      break;
    case 'stress':
      p.jitterX = Math.sin(t * 46) * 1.3; p.jitterY = Math.cos(t * 42) * 1.2;
      p.glow = 1.0;
      break;
    case 'fear':
      p.jitterX = Math.sin(t * 52) * 1.8; p.jitterY = Math.cos(t * 48) * 1.6;
      p.eyeScale = 1.25;
      break;
    case 'shock': {
      const k = 1 - clamp(t / ONE_SHOTS.shock, 0, 1);
      p.jitterX = Math.sin(t * 58) * 2.1 * k; p.jitterY = Math.cos(t * 54) * 1.7 * k;
      p.eyeScale = 1.35; p.mouthOpen = 0.55 * k; p.glow = 1.0;
      break;
    }
    case 'happy':
      p.bobY = -Math.abs(Math.sin(t * 6.0)) * 2.6;
      p.tailWag = Math.sin(t * 7.0) * 0.35; p.glow = 0.98;
      break;
    case 'sad':
      p.glow = 0.55; p.bobY = 1.6 + Math.sin(t * 1.5) * 0.8;
      break;
  }
  return p;
}

function blendPose(a, b, t) {
  const out = {};
  for (const k of Object.keys(b)) out[k] = lerp(a[k], b[k], t);
  return out;
}

export class Filefish {
  static metadata = {
    name: 'Scrawled Filefish',
    category: 'fish',
    baseLength: 120,
    baseWidth: 48
  };

  constructor(x = 0, y = 0, scale = 1) {
    this.x = x; this.y = y; this.scale = scale; this.angle = 0;
    this._state = 'breathing';
    this._prevState = 'breathing';
    this._stateTime = 0;
    this._totalTime = 0;
    this._blendElapsed = BLEND_TIME;
    this._fromPose = sampleFilePose('breathing', 0);
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

    const target = sampleFilePose(this._state, this._stateTime);
    if (this._blendElapsed < BLEND_TIME) {
      this._blendElapsed = Math.min(BLEND_TIME, this._blendElapsed + step);
      this._pose = blendPose(this._fromPose, target, easeCubic(this._blendElapsed / BLEND_TIME));
    } else {
      this._pose = target;
    }
  }

  _drawBroomTail(ctx, pose) {
    // Signature long broom-like ragged Scrawled Filefish tail!
    ctx.save();
    ctx.translate(-34, pose.turn * 10);
    ctx.rotate(pose.tailWag * 0.65 + pose.turn * 0.55);

    ctx.beginPath();
    ctx.moveTo(3, -5);
    ctx.quadraticCurveTo(-12, -16, -28, -14);
    // Ragged broom bristles along rear edge
    ctx.lineTo(-24, -8);
    ctx.lineTo(-32, -4);
    ctx.lineTo(-26, 0);
    ctx.lineTo(-32, 4);
    ctx.lineTo(-24, 8);
    ctx.lineTo(-28, 14);
    ctx.quadraticCurveTo(-12, 16, 3, 5);
    ctx.closePath();

    const tg = ctx.createLinearGradient(0, 0, -32, 0);
    tg.addColorStop(0, '#9E9362');
    tg.addColorStop(0.55, '#6C6842');
    tg.addColorStop(1, '#38BDF8');
    ctx.fillStyle = tg;
    ctx.fill();

    ctx.strokeStyle = 'rgba(186, 230, 253, 0.5)';
    ctx.lineWidth = 1.1;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-27, i * 4.5); ctx.stroke();
    }

    ctx.strokeStyle = '#1E2216';
    ctx.lineWidth = 2.2;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  _drawPectorals(ctx, pose) {
    for (const side of [-1, 1]) {
      const flap = Math.sin(pose.pecFlutter + side * 0.5) * 0.38;
      ctx.save();
      ctx.translate(8, 17 * side);
      ctx.rotate((0.6 + flap) * side);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(6, 10 * side, -6, 13 * side, -11, 5 * side);
      ctx.closePath();
      ctx.fillStyle = 'rgba(232, 224, 182, 0.82)';
      ctx.fill();
      ctx.strokeStyle = '#1E2216';
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.restore();
    }
  }

  _traceLeafBody(ctx) {
    // Elongated leaf-shaped filefish silhouette with pointed upturned snout
    ctx.beginPath();
    ctx.moveTo(52, 0);
    ctx.bezierCurveTo(36, -11, 16, -22, -4, -20);
    ctx.bezierCurveTo(-20, -18, -30, -11, -35, -5);
    ctx.lineTo(-35, 5);
    ctx.bezierCurveTo(-30, 11, -20, 18, -4, 20);
    ctx.bezierCurveTo(16, 22, 36, 11, 52, 0);
    ctx.closePath();
  }

  _drawBodyAndElectricSquiggles(ctx, pose) {
    // Shadow
    ctx.save();
    ctx.translate(4, 7);
    this._traceLeafBody(ctx);
    ctx.fillStyle = 'rgba(30, 34, 22, 0.22)';
    ctx.fill();
    ctx.restore();

    // Olive-tan leaf gradient
    this._traceLeafBody(ctx);
    const bg = ctx.createLinearGradient(52, -20, -35, 20);
    bg.addColorStop(0, '#C5BA84');
    bg.addColorStop(0.38, '#A69D64');
    bg.addColorStop(0.78, '#807A48');
    bg.addColorStop(1, '#5D5A34');
    ctx.fillStyle = bg;
    ctx.fill();

    ctx.save();
    this._traceLeafBody(ctx);
    ctx.clip();

    // GLOWING ELECTRIC-BLUE SCRAWLED SQUIGGLES across the leaf body!
    const gAlpha = pose.glow;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const squiggles = [
      [[34, -4], [24, -9], [14, -6], [4, -12], [-8, -9], [-20, -11]],
      [[28, 3], [16, 7], [6, 3], [-6, 10], [-18, 7], [-28, 8]],
      [[10, -15], [0, -16], [-12, -14]],
      [[12, 14], [0, 15], [-14, 13]]
    ];
    for (const pts of squiggles) {
      // Soft neon cyan halo
      ctx.strokeStyle = `rgba(56, 189, 248, ${0.42 * gAlpha})`;
      ctx.lineWidth = 4.6;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.stroke();

      // Bright electric-blue core scrawl
      ctx.strokeStyle = `rgba(125, 211, 252, ${0.95 * gAlpha})`;
      ctx.lineWidth = 2.0;
      ctx.stroke();
    }

    // Dark ink spots scattered between squiggles
    ctx.fillStyle = '#262418';
    const dots = [[18, -2], [2, -5], [-12, -2], [-24, -4], [6, 9], [-10, 4], [-22, 3], [22, 9]];
    for (const [dx, dy] of dots) {
      ctx.beginPath(); ctx.arc(dx, dy, 1.9, 0, Math.PI * 2); ctx.fill();
    }

    // Glossy jelly-bean chibi highlight
    ctx.fillStyle = 'rgba(255, 255, 240, 0.36)';
    ctx.beginPath(); ctx.ellipse(10, -7, 18, 4.5, -0.1, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    this._traceLeafBody(ctx);
    ctx.strokeStyle = '#1E2216';
    ctx.lineWidth = 3.0;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Slender file-like dorsal spine behind head
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-4, -3);
    ctx.strokeStyle = '#1E2216';
    ctx.lineWidth = 3.0;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  _drawEyesAndEmote(ctx, pose) {
    const st = this._state;

    for (const side of [-1, 1]) {
      ctx.fillStyle = st === 'happy' ? 'rgba(255, 108, 142, 0.56)' : 'rgba(255, 132, 152, 0.36)';
      ctx.beginPath(); ctx.ellipse(16, 13 * side, 4.6, 2.5, 0.15 * side, 0, Math.PI * 2); ctx.fill();
    }

    for (const side of [-1, 1]) {
      const ex = 23;
      const ey = 8.8 * side;
      const r = 5.6 * pose.eyeScale;

      ctx.save();
      ctx.translate(ex, ey);
      if (st === 'happy') {
        ctx.strokeStyle = '#1E2216'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(0, 1.4, r * 0.72, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      } else if (st === 'stress') {
        ctx.strokeStyle = '#1E2216'; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(-3.0, -3.0 * side); ctx.lineTo(2.4, 0); ctx.lineTo(-3.0, 3.0 * side); ctx.stroke();
      } else {
        ctx.fillStyle = '#FFFDF7'; ctx.strokeStyle = '#1E2216'; ctx.lineWidth = 2.0;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        const ir = st === 'shock' ? r * 0.38 : (st === 'fear' ? r * 0.48 : r * 0.74);
        const ig = ctx.createRadialGradient(0.5, 0, 0.5, 0, 0, ir);
        ig.addColorStop(0, '#67E8F9'); ig.addColorStop(0.65, '#0284C7'); ig.addColorStop(1, '#0C4A6E');
        ctx.fillStyle = ig;
        ctx.beginPath(); ctx.arc(0.9, 0, ir, 0, Math.PI * 2); ctx.fill();

        const pr = st === 'shock' ? r * 0.22 : (st === 'fear' ? r * 0.28 : r * 0.44);
        ctx.fillStyle = '#12160E';
        ctx.beginPath(); ctx.arc(1.1, 0, pr, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(2.3, -1.6 * side, r * 0.26, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(-0.9, 1.5 * side, r * 0.14, 0, Math.PI * 2); ctx.fill();

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
          ctx.fillStyle = '#A69D64';
          ctx.beginPath(); ctx.arc(0, 0, r + 0.4, Math.PI * 0.9, Math.PI * 2.1); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = '#1E2216'; ctx.lineWidth = 1.8;
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
      ctx.translate(28, -26);
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
        ctx.fillStyle = '#EF4444'; ctx.strokeStyle = '#1E2216'; ctx.lineWidth = 1.5;
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

    ctx.save();
    ctx.translate(this.x + pose.jitterX, this.y + pose.jitterY + pose.bobY);
    ctx.rotate(this.angle + pose.turn * 0.25);
    ctx.scale(this.scale * pose.pulse, this.scale * pose.pulse);

    this._drawPectorals(ctx, pose);
    this._drawBroomTail(ctx, pose);
    this._drawBodyAndElectricSquiggles(ctx, pose);
    this._drawEyesAndEmote(ctx, pose);

    ctx.restore();
  }
}

export default Filefish;
