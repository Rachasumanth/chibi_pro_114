/**
 * Tassled Scorpionfish (Scorpionfish) — Standalone 2D Top-Down Expressive Chibi ES Module
 * Category: fish | Base Size: 105x74px
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

function sampleScorpionPose(state, t) {
  const p = {
    waveAmp: 0.04, phase: t * 2.4, turn: 0, tailWag: 0,
    pecSweep: 0, spineFlare: 1.0, mouthOpen: 0, eyeScale: 1,
    pulse: 1, jitterX: 0, jitterY: 0, bobY: 0
  };
  switch (state) {
    case 'breathing':
      p.waveAmp = 0.03; p.phase = t * 2.0;
      p.pecSweep = Math.sin(t * 2.0) * 0.12;
      p.pulse = 1 + Math.sin(t * 2.2) * 0.025;
      break;
    case 'swimming':
      p.waveAmp = 0.14; p.phase = t * 8.2;
      p.tailWag = Math.sin(t * 8.2) * 0.4;
      p.pecSweep = Math.sin(t * 8.2) * 0.25;
      break;
    case 'relax':
      p.waveAmp = 0.02; p.phase = t * 1.2;
      p.spineFlare = 0.8; p.bobY = Math.sin(t * 1.4) * 1.5;
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
      p.mouthOpen = k * 0.9; p.pulse = 1 + k * 0.06;
      break;
    }
    case 'hungry':
      p.mouthOpen = 0.24 + Math.abs(Math.sin(t * 8.5)) * 0.42;
      p.eyeScale = 1.12;
      break;
    case 'stress':
      p.spineFlare = 1.45;
      p.jitterX = Math.sin(t * 46) * 1.4; p.jitterY = Math.cos(t * 42) * 1.2;
      break;
    case 'fear':
      p.spineFlare = 1.6;
      p.jitterX = Math.sin(t * 52) * 1.9; p.jitterY = Math.cos(t * 48) * 1.6;
      p.eyeScale = 1.26;
      break;
    case 'shock': {
      const k = 1 - clamp(t / ONE_SHOTS.shock, 0, 1);
      p.spineFlare = 1.75;
      p.jitterX = Math.sin(t * 58) * 2.2 * k; p.jitterY = Math.cos(t * 54) * 1.8 * k;
      p.eyeScale = 1.35; p.mouthOpen = 0.6 * k;
      break;
    }
    case 'happy':
      p.bobY = -Math.abs(Math.sin(t * 6.0)) * 2.6;
      p.pecSweep = Math.sin(t * 6.8) * 0.3;
      break;
    case 'sad':
      p.spineFlare = 0.72; p.bobY = 1.6 + Math.sin(t * 1.5) * 0.8;
      break;
  }
  return p;
}

function blendPose(a, b, t) {
  const out = {};
  for (const k of Object.keys(b)) out[k] = lerp(a[k], b[k], t);
  return out;
}

export class Scorpionfish {
  static metadata = {
    name: 'Tassled Scorpionfish',
    category: 'fish',
    baseLength: 105,
    baseWidth: 74
  };

  constructor(x = 0, y = 0, scale = 1) {
    this.x = x; this.y = y; this.scale = scale; this.angle = 0;
    this._state = 'breathing';
    this._prevState = 'breathing';
    this._stateTime = 0;
    this._totalTime = 0;
    this._blendElapsed = BLEND_TIME;
    this._fromPose = sampleScorpionPose('breathing', 0);
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

    const target = sampleScorpionPose(this._state, this._stateTime);
    if (this._blendElapsed < BLEND_TIME) {
      this._blendElapsed = Math.min(BLEND_TIME, this._blendElapsed + step);
      this._pose = blendPose(this._fromPose, target, easeCubic(this._blendElapsed / BLEND_TIME));
    } else {
      this._pose = target;
    }
  }

  _drawWideBandedPectorals(ctx, pose) {
    // Wide banded fan pectoral fins with ragged crimson-ochre tips!
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(10, 17 * side);
      ctx.rotate(pose.pecSweep * side);

      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.bezierCurveTo(16, 18 * side, -2, 32 * side, -22, 24 * side);
      ctx.quadraticCurveTo(-24, 12 * side, -14, 0);
      ctx.closePath();

      const pg = ctx.createRadialGradient(0, 10 * side, 3, -4, 16 * side, 26);
      pg.addColorStop(0, '#DC2626');
      pg.addColorStop(0.45, '#F59E0B');
      pg.addColorStop(0.75, '#991B1B');
      pg.addColorStop(1, '#FDE68A');
      ctx.fillStyle = pg;
      ctx.fill();

      // Banded stripes & fin rays
      ctx.save();
      ctx.clip();
      ctx.strokeStyle = 'rgba(42, 12, 10, 0.55)';
      ctx.lineWidth = 3.2;
      ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 245, 220, 0.45)';
      ctx.lineWidth = 1.2;
      for (let i = -2; i <= 3; i++) {
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-18 + i * 6, 26 * side); ctx.stroke();
      }
      ctx.restore();

      ctx.strokeStyle = '#2B0D0B';
      ctx.lineWidth = 2.2;
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawBandedTail(ctx, pose) {
    ctx.save();
    ctx.translate(-36, pose.turn * 10);
    ctx.rotate(pose.tailWag * 0.65 + pose.turn * 0.55);

    ctx.beginPath();
    ctx.moveTo(4, -6);
    ctx.quadraticCurveTo(-9, -18, -20, -14);
    ctx.quadraticCurveTo(-24, 0, -20, 14);
    ctx.quadraticCurveTo(-9, 18, 4, 6);
    ctx.closePath();

    const tg = ctx.createLinearGradient(0, 0, -22, 0);
    tg.addColorStop(0, '#B91C1C');
    tg.addColorStop(0.5, '#F59E0B');
    tg.addColorStop(1, '#991B1B');
    ctx.fillStyle = tg;
    ctx.fill();

    ctx.strokeStyle = '#2B0D0B';
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.restore();
  }

  _drawRaggedTassels(ctx, pose) {
    // Signature ragged fleshy skin tabs/tassels fluttering around head & flanks!
    const sway = Math.sin(this._totalTime * 4.5) * 2.8;
    const tabs = [
      [34, -10, 42, -16 + sway],
      [34, 10, 42, 16 - sway],
      [22, -19, 26, -28 + sway],
      [22, 19, 26, 28 - sway],
      [-4, -20, -8, -28 - sway],
      [-4, 20, -8, 28 + sway],
      [-22, -14, -28, -21 + sway],
      [-22, 14, -28, 21 - sway]
    ];
    ctx.save();
    ctx.strokeStyle = '#2B0D0B';
    ctx.lineWidth = 3.6;
    ctx.lineCap = 'round';
    for (const [x0, y0, x1, y1] of tabs) {
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo((x0 + x1) * 0.5 + 2, (y0 + y1) * 0.5, x1, y1);
      ctx.stroke();
    }
    ctx.strokeStyle = '#F97316';
    ctx.lineWidth = 1.8;
    for (const [x0, y0, x1, y1] of tabs) {
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo((x0 + x1) * 0.5 + 2, (y0 + y1) * 0.5, x1, y1);
      ctx.stroke();
    }
    ctx.restore();
  }

  _traceBody(ctx) {
    ctx.beginPath();
    ctx.moveTo(39, 0);
    ctx.bezierCurveTo(36, -16, 18, -23, 0, -21);
    ctx.bezierCurveTo(-18, -20, -32, -13, -38, -5);
    ctx.lineTo(-38, 5);
    ctx.bezierCurveTo(-32, 13, -18, 20, 0, 21);
    ctx.bezierCurveTo(18, 23, 36, 16, 39, 0);
    ctx.closePath();
  }

  _drawMottledBodyAndSpines(ctx, pose) {
    // Shadow
    ctx.save();
    ctx.translate(4, 7);
    this._traceBody(ctx);
    ctx.fillStyle = 'rgba(43, 13, 11, 0.24)';
    ctx.fill();
    ctx.restore();

    // Crimson-and-ochre mottled body gradient
    this._traceBody(ctx);
    const bg = ctx.createLinearGradient(40, -22, -40, 22);
    bg.addColorStop(0, '#EF4444');
    bg.addColorStop(0.35, '#DC2626');
    bg.addColorStop(0.7, '#B45309');
    bg.addColorStop(1, '#7F1D1D');
    ctx.fillStyle = bg;
    ctx.fill();

    ctx.save();
    this._traceBody(ctx);
    ctx.clip();

    // Ochre & cream camouflage mottling blotches
    const blotches = [
      [14, -10, 9, 5, '#F59E0B'],
      [-6, -12, 11, 6, '#FDE047'],
      [-22, -6, 8, 5, '#F97316'],
      [10, 11, 9, 5, '#F59E0B'],
      [-12, 10, 10, 5.5, '#FB923C']
    ];
    for (const [bx, by, brx, bry, col] of blotches) {
      ctx.fillStyle = col;
      ctx.globalAlpha = 0.52;
      ctx.beginPath(); ctx.ellipse(bx, by, brx, bry, 0.3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Glossy jelly-bean highlight
    ctx.fillStyle = 'rgba(255, 245, 230, 0.38)';
    ctx.beginPath(); ctx.ellipse(12, -7, 15, 4.8, -0.1, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    this._traceBody(ctx);
    ctx.strokeStyle = '#2B0D0B';
    ctx.lineWidth = 3.0;
    ctx.stroke();

    // Spiky dorsal fin crest spines
    const fl = pose.spineFlare;
    for (let i = 0; i < 6; i++) {
      const sx = 12 - i * 8;
      const side = i % 2 === 0 ? -1 : 1;
      ctx.beginPath();
      ctx.moveTo(sx + 2, 0);
      ctx.lineTo(sx - 7 * fl, 5.5 * side * fl);
      ctx.lineTo(sx - 2, 0);
      ctx.closePath();
      ctx.fillStyle = '#FEF08A';
      ctx.fill();
      ctx.strokeStyle = '#2B0D0B';
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }
  }

  _drawEyesAndEmote(ctx, pose) {
    const st = this._state;

    for (const side of [-1, 1]) {
      ctx.fillStyle = st === 'happy' ? 'rgba(255, 118, 148, 0.56)' : 'rgba(255, 140, 152, 0.34)';
      ctx.beginPath(); ctx.ellipse(17, 15 * side, 4.8, 2.6, 0.15 * side, 0, Math.PI * 2); ctx.fill();
    }

    for (const side of [-1, 1]) {
      const ex = 24;
      const ey = 10.5 * side;
      const r = 6.0 * pose.eyeScale;

      ctx.save();
      ctx.translate(ex, ey);
      if (st === 'happy') {
        ctx.strokeStyle = '#2B0D0B'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(0, 1.4, r * 0.72, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      } else if (st === 'stress') {
        ctx.strokeStyle = '#2B0D0B'; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(-3.2, -3.2 * side); ctx.lineTo(2.4, 0); ctx.lineTo(-3.2, 3.2 * side); ctx.stroke();
      } else {
        ctx.fillStyle = '#FFFDF5'; ctx.strokeStyle = '#2B0D0B'; ctx.lineWidth = 2.0;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        const ir = st === 'shock' ? r * 0.38 : (st === 'fear' ? r * 0.48 : r * 0.72);
        const ig = ctx.createRadialGradient(0.5, 0, 0.5, 0, 0, ir);
        ig.addColorStop(0, '#FEF08A'); ig.addColorStop(0.65, '#EF4444'); ig.addColorStop(1, '#7F1D1D');
        ctx.fillStyle = ig;
        ctx.beginPath(); ctx.arc(0.9, 0, ir, 0, Math.PI * 2); ctx.fill();

        const pr = st === 'shock' ? r * 0.22 : (st === 'fear' ? r * 0.28 : r * 0.44);
        ctx.fillStyle = '#1A0806';
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
          ctx.fillStyle = '#DC2626';
          ctx.beginPath(); ctx.arc(0, 0, r + 0.4, Math.PI * 0.9, Math.PI * 2.1); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = '#2B0D0B'; ctx.lineWidth = 1.8;
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
      ctx.translate(28, -32);
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
        ctx.fillStyle = '#EF4444'; ctx.strokeStyle = '#2B0D0B'; ctx.lineWidth = 1.5;
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

    this._drawWideBandedPectorals(ctx, pose);
    this._drawBandedTail(ctx, pose);
    this._drawRaggedTassels(ctx, pose);
    this._drawMottledBodyAndSpines(ctx, pose);
    this._drawEyesAndEmote(ctx, pose);

    ctx.restore();
  }
}

export default Scorpionfish;
