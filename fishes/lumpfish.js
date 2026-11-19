/**
 * Spiny Lumpfish (Lumpfish) — Standalone 2D Top-Down Expressive Chibi ES Module
 * Category: fish | Base Size: 72x54px
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

function sampleLumpPose(state, t) {
  const p = {
    pecFlap: 0, tailWag: 0, turn: 0, mouthOpen: 0,
    eyeScale: 1, pulse: 1, jitterX: 0, jitterY: 0, bobY: 0
  };
  switch (state) {
    case 'breathing':
      p.pecFlap = Math.sin(t * 2.4) * 0.18;
      p.tailWag = Math.sin(t * 2.2) * 0.16;
      p.pulse = 1 + Math.sin(t * 2.4) * 0.032;
      break;
    case 'swimming':
      p.pecFlap = Math.sin(t * 9.5) * 0.48;
      p.tailWag = Math.sin(t * 9.5) * 0.42;
      break;
    case 'relax':
      p.pecFlap = 0.15 + Math.sin(t * 1.4) * 0.08;
      p.bobY = Math.sin(t * 1.4) * 1.6;
      break;
    case 'left_turn': {
      const k = Math.sin(clamp(t / ONE_SHOTS.left_turn, 0, 1) * Math.PI);
      p.turn = -0.26 * k; p.tailWag = -0.46 * k; p.pecFlap = 0.3 * k;
      break;
    }
    case 'right_turn': {
      const k = Math.sin(clamp(t / ONE_SHOTS.right_turn, 0, 1) * Math.PI);
      p.turn = 0.26 * k; p.tailWag = 0.46 * k; p.pecFlap = 0.3 * k;
      break;
    }
    case 'eating': {
      const k = Math.sin(clamp(t / ONE_SHOTS.eating, 0, 1) * Math.PI);
      p.mouthOpen = k * 0.85; p.pulse = 1 + k * 0.07;
      break;
    }
    case 'hungry':
      p.mouthOpen = 0.25 + Math.abs(Math.sin(t * 8.5)) * 0.45;
      p.eyeScale = 1.12; p.pecFlap = Math.sin(t * 6) * 0.25;
      break;
    case 'stress':
      p.jitterX = Math.sin(t * 46) * 1.4; p.jitterY = Math.cos(t * 42) * 1.2;
      p.pecFlap = Math.sin(t * 16) * 0.35;
      break;
    case 'fear':
      p.jitterX = Math.sin(t * 52) * 1.9; p.jitterY = Math.cos(t * 48) * 1.6;
      p.eyeScale = 1.26; p.pecFlap = 0.4;
      break;
    case 'shock': {
      const k = 1 - clamp(t / ONE_SHOTS.shock, 0, 1);
      p.jitterX = Math.sin(t * 58) * 2.2 * k; p.jitterY = Math.cos(t * 54) * 1.8 * k;
      p.eyeScale = 1.35; p.mouthOpen = 0.6 * k; p.pulse = 1 + 0.08 * k;
      break;
    }
    case 'happy':
      p.bobY = -Math.abs(Math.sin(t * 6.4)) * 2.8;
      p.pecFlap = Math.sin(t * 7.4) * 0.38; p.tailWag = Math.sin(t * 7.4) * 0.35;
      break;
    case 'sad':
      p.pecFlap = -0.22; p.bobY = 1.6 + Math.sin(t * 1.5) * 0.8;
      break;
  }
  return p;
}

function blendPose(a, b, t) {
  const out = {};
  for (const k of Object.keys(b)) out[k] = lerp(a[k], b[k], t);
  return out;
}

export class Lumpfish {
  static metadata = {
    name: 'Spiny Lumpfish',
    category: 'fish',
    baseLength: 72,
    baseWidth: 54
  };

  constructor(x = 0, y = 0, scale = 1) {
    this.x = x; this.y = y; this.scale = scale; this.angle = 0;
    this._state = 'breathing';
    this._prevState = 'breathing';
    this._stateTime = 0;
    this._totalTime = 0;
    this._blendElapsed = BLEND_TIME;
    this._fromPose = sampleLumpPose('breathing', 0);
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

    const target = sampleLumpPose(this._state, this._stateTime);
    if (this._blendElapsed < BLEND_TIME) {
      this._blendElapsed = Math.min(BLEND_TIME, this._blendElapsed + step);
      this._pose = blendPose(this._fromPose, target, easeCubic(this._blendElapsed / BLEND_TIME));
    } else {
      this._pose = target;
    }
  }

  _drawWideFanPectorals(ctx, rx, ry, pose) {
    // Wide rounded translucent blue-teal fan pectoral fins!
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(rx * 0.2, ry * 0.8 * side);
      ctx.rotate((0.45 + pose.pecFlap) * side);

      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.bezierCurveTo(10, 15 * side, -8, 22 * side, -16, 12 * side);
      ctx.quadraticCurveTo(-10, 2 * side, -6, 0);
      ctx.closePath();

      const pg = ctx.createRadialGradient(0, 8 * side, 2, -2, 10 * side, 18);
      pg.addColorStop(0, '#5EEAD4');
      pg.addColorStop(0.65, 'rgba(45, 212, 191, 0.78)');
      pg.addColorStop(1, 'rgba(153, 246, 228, 0.65)');
      ctx.fillStyle = pg;
      ctx.fill();

      ctx.strokeStyle = 'rgba(15, 118, 110, 0.45)';
      ctx.lineWidth = 1.1;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath(); ctx.moveTo(-1, 0); ctx.lineTo(-4 + i * 3.5, 15 * side); ctx.stroke();
      }

      ctx.strokeStyle = '#113032';
      ctx.lineWidth = 2.0;
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawTail(ctx, rx, pose) {
    ctx.save();
    ctx.translate(-rx * 0.92, pose.turn * 8);
    ctx.rotate(pose.tailWag * 0.7 + pose.turn * 0.55);

    ctx.beginPath();
    ctx.moveTo(4, -5);
    ctx.quadraticCurveTo(-7, -14, -16, -11);
    ctx.quadraticCurveTo(-18, 0, -16, 11);
    ctx.quadraticCurveTo(-7, 14, 4, 5);
    ctx.closePath();
    ctx.fillStyle = 'rgba(94, 234, 212, 0.82)';
    ctx.fill();
    ctx.strokeStyle = '#113032';
    ctx.lineWidth = 2.1;
    ctx.stroke();
    ctx.restore();
  }

  _traceBulbousBody(ctx, rx, ry) {
    // Plump head-heavy teardrop-bulbous lumpfish silhouette
    ctx.beginPath();
    ctx.moveTo(rx, 0);
    ctx.bezierCurveTo(rx * 0.96, -ry * 0.98, -rx * 0.25, -ry * 1.12, -rx, -ry * 0.36);
    ctx.quadraticCurveTo(-rx * 1.06, 0, -rx, ry * 0.36);
    ctx.bezierCurveTo(-rx * 0.25, ry * 1.12, rx * 0.96, ry * 0.98, rx, 0);
    ctx.closePath();
  }

  _drawBulbousWartyBody(ctx, rx, ry, pose) {
    // Shadow
    ctx.save();
    ctx.translate(4, 7);
    this._traceBulbousBody(ctx, rx, ry);
    ctx.fillStyle = 'rgba(17, 48, 50, 0.22)';
    ctx.fill();
    ctx.restore();

    // Rich blue-green seafoam gradient
    this._traceBulbousBody(ctx, rx, ry);
    const bg = ctx.createRadialGradient(rx * 0.2, -ry * 0.22, 4, 0, 0, rx * 1.15);
    bg.addColorStop(0, '#5EEAD4');
    bg.addColorStop(0.38, '#14B8A6');
    bg.addColorStop(0.75, '#0F766E');
    bg.addColorStop(1, '#115E59');
    ctx.fillStyle = bg;
    ctx.fill();

    ctx.save();
    this._traceBulbousBody(ctx, rx, ry);
    ctx.clip();

    // Cel-shading rim
    ctx.fillStyle = 'rgba(13, 54, 58, 0.34)';
    ctx.beginPath(); ctx.ellipse(-4, ry * 0.65, rx * 0.9, ry * 0.42, 0, 0, Math.PI * 2); ctx.fill();

    // Neat rows of rounded warty tubercles along back & flanks (signature lumpfish anatomy!)
    const rows = [
      // Center dorsal crest row
      [[-20, 0, 3.2], [-12, 0, 3.8], [-3, 0, 4.0], [6, 0, 3.6]],
      // Upper lateral tubercle row
      [[-18, -11, 2.8], [-8, -14, 3.2], [2, -14, 3.0]],
      // Lower lateral tubercle row
      [[-18, 11, 2.8], [-8, 14, 3.2], [2, 14, 3.0]]
    ];
    for (const row of rows) {
      for (const [tx, ty, tr] of row) {
        ctx.fillStyle = '#0D524E';
        ctx.beginPath(); ctx.arc(tx, ty + 1, tr + 0.6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#99F6E4';
        ctx.beginPath(); ctx.arc(tx, ty, tr, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#113032';
        ctx.lineWidth = 1.4;
        ctx.stroke();
        // Tiny shiny dot on each tubercle
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(tx + tr * 0.25, ty - tr * 0.25, tr * 0.3, 0, Math.PI * 2); ctx.fill();
      }
    }

    // Glossy jelly-bean highlight
    ctx.fillStyle = 'rgba(240, 253, 250, 0.42)';
    ctx.beginPath(); ctx.ellipse(rx * 0.24, -ry * 0.3, rx * 0.32, ry * 0.14, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // Bold chibi outline
    this._traceBulbousBody(ctx, rx, ry);
    ctx.strokeStyle = '#113032';
    ctx.lineWidth = 3.0;
    ctx.stroke();

    // Cute plump lumpfish mouth
    if (pose.mouthOpen > 0.05) {
      ctx.save();
      ctx.translate(rx - 1, 0);
      ctx.fillStyle = '#FB7185'; ctx.strokeStyle = '#113032'; ctx.lineWidth = 1.9;
      ctx.beginPath(); ctx.ellipse(2 + pose.mouthOpen * 3, 0, 2.8 + pose.mouthOpen * 3, 4.2 + pose.mouthOpen * 2, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.restore();
    }
  }

  _drawEyesAndEmote(ctx, rx, ry, pose) {
    const st = this._state;

    for (const side of [-1, 1]) {
      ctx.fillStyle = st === 'happy' ? 'rgba(255, 108, 142, 0.6)' : 'rgba(255, 132, 152, 0.4)';
      ctx.beginPath(); ctx.ellipse(rx * 0.36, ry * 0.68 * side, 5.0, 2.9, 0.2 * side, 0, Math.PI * 2); ctx.fill();
    }

    for (const side of [-1, 1]) {
      const ex = rx * 0.6;
      const ey = ry * 0.44 * side;
      const r = 6.6 * pose.eyeScale;

      ctx.save();
      ctx.translate(ex, ey);
      if (st === 'happy') {
        ctx.strokeStyle = '#113032'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(0, 1.4, r * 0.72, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      } else if (st === 'stress') {
        ctx.strokeStyle = '#113032'; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(-3.2, -3.2 * side); ctx.lineTo(2.4, 0); ctx.lineTo(-3.2, 3.2 * side); ctx.stroke();
      } else {
        ctx.fillStyle = '#FFFDF7'; ctx.strokeStyle = '#113032'; ctx.lineWidth = 2.1;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        const ir = st === 'shock' ? r * 0.38 : (st === 'fear' ? r * 0.48 : r * 0.74);
        const ig = ctx.createRadialGradient(0.5, 0, 0.5, 0, 0, ir);
        ig.addColorStop(0, '#FDBA74'); ig.addColorStop(0.65, '#EA580C'); ig.addColorStop(1, '#7C2D12');
        ctx.fillStyle = ig;
        ctx.beginPath(); ctx.arc(1.0, 0, ir, 0, Math.PI * 2); ctx.fill();

        const pr = st === 'shock' ? r * 0.22 : (st === 'fear' ? r * 0.28 : r * 0.45);
        ctx.fillStyle = '#0C1A1C';
        ctx.beginPath(); ctx.arc(1.2, 0, pr, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(2.7, -1.9 * side, r * 0.27, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(-1.0, 1.7 * side, r * 0.14, 0, Math.PI * 2); ctx.fill();

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
          ctx.fillStyle = '#14B8A6';
          ctx.beginPath(); ctx.arc(0, 0, r + 0.4, Math.PI * 0.9, Math.PI * 2.1); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = '#113032'; ctx.lineWidth = 1.8;
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
      ctx.translate(rx * 0.72, -ry - 12);
      if (st === 'happy' || st === 'hungry') {
        ctx.fillStyle = '#FDE047'; ctx.strokeStyle = '#92400E'; ctx.lineWidth = 1.3;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4; const rad = i % 2 === 0 ? 6.4 : 2.5;
          if (i === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
          else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
      } else if (st === 'shock') {
        ctx.fillStyle = '#EF4444'; ctx.strokeStyle = '#113032'; ctx.lineWidth = 1.5;
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
    const rx = 27 * pose.pulse;
    const ry = 23.5 * pose.pulse;

    ctx.save();
    ctx.translate(this.x + pose.jitterX, this.y + pose.jitterY + pose.bobY);
    ctx.rotate(this.angle + pose.turn * 0.25);
    ctx.scale(this.scale, this.scale);

    this._drawWideFanPectorals(ctx, rx, ry, pose);
    this._drawTail(ctx, rx, pose);
    this._drawBulbousWartyBody(ctx, rx, ry, pose);
    this._drawEyesAndEmote(ctx, rx, ry, pose);

    ctx.restore();
  }
}

export default Lumpfish;
