/**
 * Reef Stonefish (Stonefish) — Standalone 2D Top-Down Expressive Chibi ES Module
 * Category: fish | Base Size: 92x64px
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

function sampleStonePose(state, t) {
  const p = {
    pecSweep: 0, tailWag: 0, turn: 0, spineFlare: 1.0,
    mouthOpen: 0, eyeScale: 1, pulse: 1, jitterX: 0, jitterY: 0, bobY: 0
  };
  switch (state) {
    case 'breathing':
      p.pecSweep = Math.sin(t * 1.8) * 0.08;
      p.pulse = 1 + Math.sin(t * 2.0) * 0.025;
      break;
    case 'swimming':
      p.pecSweep = Math.sin(t * 8.0) * 0.35;
      p.tailWag = Math.sin(t * 8.0) * 0.38;
      break;
    case 'relax':
      p.spineFlare = 0.75; p.bobY = Math.sin(t * 1.2) * 1.2;
      break;
    case 'left_turn': {
      const k = Math.sin(clamp(t / ONE_SHOTS.left_turn, 0, 1) * Math.PI);
      p.turn = -0.26 * k; p.tailWag = -0.42 * k;
      break;
    }
    case 'right_turn': {
      const k = Math.sin(clamp(t / ONE_SHOTS.right_turn, 0, 1) * Math.PI);
      p.turn = 0.26 * k; p.tailWag = 0.42 * k;
      break;
    }
    case 'eating': {
      const k = Math.sin(clamp(t / ONE_SHOTS.eating, 0, 1) * Math.PI);
      p.mouthOpen = k * 0.9; p.pulse = 1 + k * 0.06;
      break;
    }
    case 'hungry':
      p.mouthOpen = 0.25 + Math.abs(Math.sin(t * 8.0)) * 0.4;
      p.eyeScale = 1.12;
      break;
    case 'stress':
      p.spineFlare = 1.45;
      p.jitterX = Math.sin(t * 46) * 1.4; p.jitterY = Math.cos(t * 42) * 1.2;
      break;
    case 'fear':
      p.spineFlare = 1.65;
      p.jitterX = Math.sin(t * 52) * 1.9; p.jitterY = Math.cos(t * 48) * 1.6;
      p.eyeScale = 1.26;
      break;
    case 'shock': {
      const k = 1 - clamp(t / ONE_SHOTS.shock, 0, 1);
      p.spineFlare = 1.8;
      p.jitterX = Math.sin(t * 58) * 2.2 * k; p.jitterY = Math.cos(t * 54) * 1.8 * k;
      p.eyeScale = 1.35; p.mouthOpen = 0.65 * k;
      break;
    }
    case 'happy':
      p.bobY = -Math.abs(Math.sin(t * 5.8)) * 2.4;
      p.pecSweep = Math.sin(t * 6.5) * 0.26;
      break;
    case 'sad':
      p.spineFlare = 0.7; p.bobY = 1.6 + Math.sin(t * 1.4) * 0.8;
      break;
  }
  return p;
}

function blendPose(a, b, t) {
  const out = {};
  for (const k of Object.keys(b)) out[k] = lerp(a[k], b[k], t);
  return out;
}

export class Stonefish {
  static metadata = {
    name: 'Reef Stonefish',
    category: 'fish',
    baseLength: 92,
    baseWidth: 64
  };

  constructor(x = 0, y = 0, scale = 1) {
    this.x = x; this.y = y; this.scale = scale; this.angle = 0;
    this._state = 'breathing';
    this._prevState = 'breathing';
    this._stateTime = 0;
    this._totalTime = 0;
    this._blendElapsed = BLEND_TIME;
    this._fromPose = sampleStonePose('breathing', 0);
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

    const target = sampleStonePose(this._state, this._stateTime);
    if (this._blendElapsed < BLEND_TIME) {
      this._blendElapsed = Math.min(BLEND_TIME, this._blendElapsed + step);
      this._pose = blendPose(this._fromPose, target, easeCubic(this._blendElapsed / BLEND_TIME));
    } else {
      this._pose = target;
    }
  }

  _drawBroadRockPectorals(ctx, pose) {
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(6, 20 * side);
      ctx.rotate(pose.pecSweep * side);
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.bezierCurveTo(14, 14 * side, -2, 22 * side, -16, 15 * side);
      ctx.quadraticCurveTo(-18, 6 * side, -10, 0);
      ctx.closePath();

      const pg = ctx.createLinearGradient(0, 0, -14, 18 * side);
      pg.addColorStop(0, '#78716C');
      pg.addColorStop(0.6, '#57534E');
      pg.addColorStop(1, '#44403C');
      ctx.fillStyle = pg;
      ctx.fill();

      ctx.strokeStyle = '#1C1917';
      ctx.lineWidth = 2.2;
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawTail(ctx, pose) {
    ctx.save();
    ctx.translate(-34, pose.turn * 9);
    ctx.rotate(pose.tailWag * 0.65 + pose.turn * 0.5);

    ctx.beginPath();
    ctx.moveTo(4, -6);
    ctx.quadraticCurveTo(-8, -14, -15, -11);
    ctx.quadraticCurveTo(-18, 0, -15, 11);
    ctx.quadraticCurveTo(-8, 14, 4, 6);
    ctx.closePath();

    ctx.fillStyle = '#57534E';
    ctx.fill();
    ctx.strokeStyle = '#1C1917';
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.restore();
  }

  _traceCraggyStoneBody(ctx) {
    // Rugged craggy rock-textured polygonal stonefish silhouette
    ctx.beginPath();
    ctx.moveTo(35, 0);
    ctx.lineTo(31, -13);
    ctx.lineTo(22, -22);
    ctx.lineTo(8, -26);
    ctx.lineTo(-4, -22);
    ctx.lineTo(-17, -23);
    ctx.lineTo(-29, -15);
    ctx.lineTo(-36, -6);
    ctx.lineTo(-36, 6);
    ctx.lineTo(-29, 15);
    ctx.lineTo(-17, 23);
    ctx.lineTo(-4, 22);
    ctx.lineTo(8, 26);
    ctx.lineTo(22, 22);
    ctx.lineTo(31, 13);
    ctx.closePath();
  }

  _drawCraggyBodyAndVenomSpines(ctx, pose) {
    // Shadow
    ctx.save();
    ctx.translate(4, 7);
    this._traceCraggyStoneBody(ctx);
    ctx.fillStyle = 'rgba(28, 25, 23, 0.26)';
    ctx.fill();
    ctx.restore();

    // Rugged brown & stone grey gradient
    this._traceCraggyStoneBody(ctx);
    const bg = ctx.createRadialGradient(8, -8, 4, 0, 0, 42);
    bg.addColorStop(0, '#A8A29E');
    bg.addColorStop(0.38, '#78716C');
    bg.addColorStop(0.75, '#57534E');
    bg.addColorStop(1, '#3F3A36');
    ctx.fillStyle = bg;
    ctx.fill();

    ctx.save();
    this._traceCraggyStoneBody(ctx);
    ctx.clip();

    // Craggy rock facets & mossy algae patches!
    const mossPatches = [
      [-12, -13, 9, 5.5, '#65A30D'],
      [4, -15, 7, 4.5, '#4D7C0F'],
      [-20, 9, 8.5, 5.0, '#65A30D'],
      [8, 14, 7.5, 4.5, '#84CC16'],
      [-4, 4, 10, 6.0, '#78350F']
    ];
    for (const [mx, my, mrx, mry, col] of mossPatches) {
      ctx.fillStyle = col;
      ctx.globalAlpha = 0.48;
      ctx.beginPath(); ctx.ellipse(mx, my, mrx, mry, mx * 0.1, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Craggy stone fracture lines
    ctx.strokeStyle = 'rgba(28, 25, 23, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(12, -20); ctx.lineTo(2, -6); ctx.lineTo(-14, -14);
    ctx.moveTo(10, 20); ctx.lineTo(0, 8); ctx.lineTo(-16, 15);
    ctx.stroke();

    // Subtle glossy stone highlight
    ctx.fillStyle = 'rgba(245, 245, 244, 0.28)';
    ctx.beginPath(); ctx.ellipse(10, -8, 14, 5, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    this._traceCraggyStoneBody(ctx);
    ctx.strokeStyle = '#1C1917';
    ctx.lineWidth = 3.2;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Venomous dorsal spine ridge running down the center back (flares in stress/fear/shock!)
    const flare = pose.spineFlare;
    const spineXs = [8, 0, -8, -16, -24];
    for (let i = 0; i < spineXs.length; i++) {
      const sx = spineXs[i];
      const tilt = (i % 2 === 0 ? -1 : 1) * 4.5 * flare;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(sx + 2.6, 0);
      ctx.lineTo(sx - 6.5 * flare, tilt);
      ctx.lineTo(sx - 2.6, 0);
      ctx.closePath();
      ctx.fillStyle = '#BEF264'; // venomous chartreuse-tipped spines!
      ctx.fill();
      ctx.strokeStyle = '#1C1917';
      ctx.lineWidth = 1.8;
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.restore();
    }

    // Grumpy upturned stonefish mouth at snout!
    ctx.save();
    ctx.translate(33, 0);
    ctx.strokeStyle = '#1C1917';
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    if (pose.mouthOpen > 0.1) {
      ctx.fillStyle = '#9F1239';
      ctx.beginPath();
      ctx.ellipse(1 + pose.mouthOpen * 3, 0, 3 + pose.mouthOpen * 4, 8 + pose.mouthOpen * 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      // Grumpy frowning upturned arc
      ctx.beginPath();
      ctx.moveTo(-2, -9.5);
      ctx.quadraticCurveTo(4.5, 0, -2, 9.5);
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawEyesAndEmote(ctx, pose) {
    const st = this._state;

    // Subtle rosy cheek blushes even on grumpy stonefish!
    for (const side of [-1, 1]) {
      ctx.fillStyle = st === 'happy' ? 'rgba(255, 108, 142, 0.56)' : 'rgba(255, 132, 152, 0.30)';
      ctx.beginPath(); ctx.ellipse(15, 16 * side, 4.6, 2.6, 0.2 * side, 0, Math.PI * 2); ctx.fill();
    }

    // Expressive grumpy-cute chibi eyes under rocky brow ridges
    for (const side of [-1, 1]) {
      const ex = 22;
      const ey = 10.5 * side;
      const r = 5.6 * pose.eyeScale;

      ctx.save();
      ctx.translate(ex, ey);
      if (st === 'happy') {
        ctx.strokeStyle = '#1C1917'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(0, 1.4, r * 0.72, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      } else if (st === 'stress') {
        ctx.strokeStyle = '#1C1917'; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(-3.0, -3.0 * side); ctx.lineTo(2.4, 0); ctx.lineTo(-3.0, 3.0 * side); ctx.stroke();
      } else {
        ctx.fillStyle = '#FEFCE8'; ctx.strokeStyle = '#1C1917'; ctx.lineWidth = 2.0;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        const ir = st === 'shock' ? r * 0.38 : (st === 'fear' ? r * 0.48 : r * 0.72);
        const ig = ctx.createRadialGradient(0.5, 0, 0.5, 0, 0, ir);
        ig.addColorStop(0, '#FDE047'); ig.addColorStop(0.65, '#CA8A04'); ig.addColorStop(1, '#713F12');
        ctx.fillStyle = ig;
        ctx.beginPath(); ctx.arc(0.9, 0, ir, 0, Math.PI * 2); ctx.fill();

        const pr = st === 'shock' ? r * 0.22 : (st === 'fear' ? r * 0.28 : r * 0.44);
        ctx.fillStyle = '#141210';
        ctx.beginPath(); ctx.arc(1.1, 0, pr, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(2.3, -1.6 * side, r * 0.26, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(-0.8, 1.5 * side, r * 0.14, 0, Math.PI * 2); ctx.fill();

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
          ctx.fillStyle = '#78716C';
          ctx.beginPath(); ctx.arc(0, 0, r + 0.4, Math.PI * 0.9, Math.PI * 2.1); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = '#1C1917'; ctx.lineWidth = 1.8;
          ctx.beginPath(); ctx.moveTo(-r, 0.4); ctx.quadraticCurveTo(0, 2.2, r, 0.4); ctx.stroke();
        } else if (st === 'sad' || st === 'fear') {
          ctx.fillStyle = 'rgba(125, 211, 252, 0.88)';
          ctx.beginPath(); ctx.ellipse(-1.4, 2.5 * side, 2.6, 1.6, 0.3 * side, 0, Math.PI * 2); ctx.fill();
        } else if (st === 'breathing') {
          // Cute grumpy rocky eyebrow furrow
          ctx.strokeStyle = '#1C1917'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(-4, -5.5 * side); ctx.lineTo(4, -3.5 * side); ctx.stroke();
        }
      }
      ctx.restore();
    }

    if (st === 'happy' || st === 'hungry' || st === 'shock' || st === 'fear' || st === 'stress') {
      ctx.save();
      ctx.translate(24, -32);
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
        ctx.fillStyle = '#EF4444'; ctx.strokeStyle = '#1C1917'; ctx.lineWidth = 1.5;
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

    this._drawBroadRockPectorals(ctx, pose);
    this._drawTail(ctx, pose);
    this._drawCraggyBodyAndVenomSpines(ctx, pose);
    this._drawEyesAndEmote(ctx, pose);

    ctx.restore();
  }
}

export default Stonefish;
