/**
 * Guppyfish ("Fancy Cobra Guppy") — Standalone 2D Top-Down Expressive Chibi ES Module
 * Dimensions: 48x24 | Category: fish | Zero external dependencies (Canvas 2D API)
 */

const VALID_STATES = new Set([
  'breathing', 'swimming', 'relax', 'left_turn', 'right_turn',
  'eating', 'hungry', 'stress', 'fear', 'shock', 'happy', 'sad'
]);
const STATE_ALIASES = { idle: 'breathing', hunger: 'hungry' };
const ONE_SHOT_DURATIONS = { left_turn: 0.65, right_turn: 0.65, eating: 0.55, shock: 0.8 };
const BLEND_DURATION = 0.15;

function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
function lerp(a, b, t) { return a + (b - a) * t; }
function easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

function normalizeState(name) {
  if (typeof name !== 'string') return null;
  const k = name.trim().toLowerCase();
  const mapped = STATE_ALIASES[k] || k;
  return VALID_STATES.has(mapped) ? mapped : null;
}

function canTransition(fromState, toState) {
  if (!toState) return false;
  if (fromState === 'shock') return toState === 'fear' || toState === 'stress';
  if (fromState === 'fear') {
    if (
      toState === 'left_turn' || toState === 'right_turn' ||
      toState === 'relax' || toState === 'happy' ||
      toState === 'eating' || toState === 'hungry' || toState === 'sad'
    ) return false;
  }
  return true;
}

function samplePose(state, t, p) {
  const pose = {
    waveAmp: 0.12, waveFreq: 4.0, turnBend: 0, finSweep: 0.22, finFreq: 4.2,
    squashX: 1, squashY: 1, mouthOpen: 0, shiver: 0, bobY: 0, eyeScale: 1
  };
  switch (state) {
    case 'breathing':
      pose.waveAmp = 0.07; pose.waveFreq = 2.6;
      pose.squashX = 1 + Math.sin(t * 3.0) * 0.025;
      pose.squashY = 1 - Math.sin(t * 3.0) * 0.025;
      break;
    case 'swimming':
      pose.waveAmp = 0.22; pose.waveFreq = 8.4; pose.finSweep = 0.38; pose.finFreq = 8.0;
      break;
    case 'relax':
      pose.waveAmp = 0.04; pose.waveFreq = 1.6; pose.finSweep = 0.09;
      break;
    case 'left_turn': {
      const env = Math.sin(clamp(p, 0, 1) * Math.PI);
      pose.waveAmp = 0.14; pose.waveFreq = 6.2; pose.turnBend = -0.66 * env;
      break;
    }
    case 'right_turn': {
      const env = Math.sin(clamp(p, 0, 1) * Math.PI);
      pose.waveAmp = 0.14; pose.waveFreq = 6.2; pose.turnBend = 0.66 * env;
      break;
    }
    case 'eating': {
      const ch = Math.max(0, Math.sin(clamp(p, 0, 1) * Math.PI * 3));
      pose.mouthOpen = ch; pose.waveAmp = 0.16; pose.waveFreq = 7.0;
      pose.squashX = 1 + ch * 0.07; pose.squashY = 1 - ch * 0.05;
      break;
    }
    case 'hungry':
      pose.waveAmp = 0.17; pose.waveFreq = 6.4; pose.mouthOpen = Math.max(0, Math.sin(t * 9.0)) * 0.85; pose.eyeScale = 1.14;
      break;
    case 'stress':
      pose.waveAmp = 0.18; pose.waveFreq = 13.0; pose.shiver = 1.0;
      break;
    case 'fear':
      pose.waveAmp = 0.25; pose.waveFreq = 15.0; pose.shiver = 1.6; pose.eyeScale = 1.24;
      break;
    case 'shock': {
      const env = Math.sin(clamp(p, 0, 1) * Math.PI);
      pose.waveAmp = 0.03; pose.shiver = 1.5 * env; pose.eyeScale = 1.34; pose.mouthOpen = 0.9 * env;
      pose.squashX = 0.86 + (1 - env) * 0.14; pose.squashY = 1.15 - (1 - env) * 0.15;
      break;
    }
    case 'happy':
      pose.waveAmp = 0.20; pose.waveFreq = 9.0; pose.finSweep = 0.40; pose.bobY = Math.sin(t * 8.0) * 1.2;
      break;
    case 'sad':
      pose.waveAmp = 0.04; pose.waveFreq = 1.8; pose.finSweep = 0.07;
      break;
  }
  return pose;
}

export class Guppyfish {
  static metadata = {
    name: 'Fancy Cobra Guppy',
    category: 'fish',
    baseLength: 48,
    baseWidth: 24
  };

  constructor(x = 0, y = 0, scale = 1) {
    this.x = x; this.y = y; this.scale = scale; this.angle = 0;
    this.state = 'breathing'; this.previousState = 'breathing';
    this.time = 0; this.stateTime = 0; this.phase = 0;
    this._blendElapsed = BLEND_DURATION;
    this._fromPose = samplePose('breathing', 0, 0);
    this._pose = samplePose('breathing', 0, 0);
    this._listeners = new Map();
  }

  getState() { return this.state; }
  setAngle(r) { if (typeof r === 'number' && Number.isFinite(r)) this.angle = r; }
  setDirection(dx, dy) { if (typeof dx === 'number' && typeof dy === 'number' && (dx !== 0 || dy !== 0)) this.angle = Math.atan2(dy, dx); }

  onFinished(name, callback) {
    const norm = normalizeState(name);
    if (!norm || typeof callback !== 'function') return;
    if (!this._listeners.has(norm)) this._listeners.set(norm, []);
    this._listeners.get(norm).push(callback);
  }

  play(name) {
    const next = normalizeState(name);
    if (!next) return false;
    if (next === this.state) {
      if (ONE_SHOT_DURATIONS[next]) this.stateTime = 0;
      return true;
    }
    if (!canTransition(this.state, next)) return false;
    if (!ONE_SHOT_DURATIONS[this.state]) this.previousState = this.state;
    this._fromPose = { ...this._pose };
    this._blendElapsed = 0;
    this.state = next;
    this.stateTime = 0;
    return true;
  }

  update(dt = 0.016) {
    const step = clamp(typeof dt === 'number' && Number.isFinite(dt) ? dt : 0.016, 0, 0.1);
    this.time += step; this.stateTime += step;
    const dur = ONE_SHOT_DURATIONS[this.state];
    const progress = dur ? clamp(this.stateTime / dur, 0, 1) : 0;
    const target = samplePose(this.state, this.time, progress);
    if (this._blendElapsed < BLEND_DURATION) {
      this._blendElapsed = Math.min(BLEND_DURATION, this._blendElapsed + step);
      const k = easeInOutCubic(this._blendElapsed / BLEND_DURATION);
      for (const key in target) this._pose[key] = lerp(this._fromPose[key], target[key], k);
    } else {
      this._pose = target;
    }
    this.phase += step * this._pose.waveFreq;
    if (dur && this.stateTime >= dur) {
      const done = this.state;
      this._fromPose = { ...this._pose };
      this._blendElapsed = 0;
      this.state = this.previousState || 'breathing';
      this.stateTime = 0;
      const cbs = this._listeners.get(done);
      if (cbs) for (const cb of cbs) cb(done);
    }
  }

  _buildSpine(L, W) {
    // Petite 55% front torso leaving 45% for oversized cobra fan tail
    const count = 7;
    const bodyL = L * 0.56;
    const noseX = L * 0.45;
    const widths = [0.0, 0.28, 0.36, 0.31, 0.22, 0.14, 0.09];
    const pts = [];
    for (let i = 0; i < count; i++) {
      const u = i / (count - 1);
      const x = noseX - u * bodyL;
      const wave = Math.sin(this.phase - u * 3.0) * this._pose.waveAmp * L * (0.10 + u * u * 0.85);
      const bend = this._pose.turnBend * W * (u * u * 0.85);
      pts.push({ x, y: wave + bend, hw: widths[i] * W, u });
    }
    return pts;
  }

  _traceBody(ctx, pts, L, W) {
    const n = pts.length;
    const top = [], bot = [];
    for (let i = 1; i < n; i++) {
      const pr = pts[i - 1], cr = pts[i], nx = pts[Math.min(n - 1, i + 1)];
      const dx = nx.x - pr.x, dy = nx.y - pr.y;
      const d = Math.hypot(dx, dy) || 1;
      const ux = -dy / d, uy = dx / d;
      top.push({ x: cr.x + ux * cr.hw, y: cr.y + uy * cr.hw });
      bot.push({ x: cr.x - ux * cr.hw, y: cr.y - uy * cr.hw });
    }
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    ctx.bezierCurveTo(pts[0].x + 1, pts[0].y - W * 0.20, top[0].x + 2, top[0].y - 1, top[0].x, top[0].y);
    for (let i = 0; i < top.length - 1; i++) {
      ctx.quadraticCurveTo(top[i].x, top[i].y, (top[i].x + top[i + 1].x) * 0.5, (top[i].y + top[i + 1].y) * 0.5);
    }
    ctx.lineTo(top[top.length - 1].x, top[top.length - 1].y);
    ctx.lineTo(bot[bot.length - 1].x, bot[bot.length - 1].y);
    for (let i = bot.length - 1; i > 0; i--) {
      ctx.quadraticCurveTo(bot[i].x, bot[i].y, (bot[i].x + bot[i - 1].x) * 0.5, (bot[i].y + bot[i - 1].y) * 0.5);
    }
    ctx.bezierCurveTo(bot[0].x + 2, bot[0].y + 1, pts[0].x + 1, pts[0].y + W * 0.20, pts[0].x, pts[0].y);
    ctx.closePath();
  }

  _drawCobraFanTail(ctx, pts, L, W) {
    // Oversized cobra snakeskin-patterned golden delta fan tail
    const tail = pts[pts.length - 1];
    const prev = pts[pts.length - 2];
    const dir = Math.atan2(tail.y - prev.y, tail.x - prev.x);
    const wag = Math.sin(this.phase - 3.4) * 0.30 + this._pose.turnBend * 0.42;

    ctx.save();
    ctx.translate(tail.x, tail.y);
    ctx.rotate(dir + wag);

    const tL = L * 0.46, tH = W * 0.62;
    const grad = ctx.createLinearGradient(0, 0, tL, 0);
    grad.addColorStop(0, '#FFE44D');
    grad.addColorStop(0.55, '#FFB81C');
    grad.addColorStop(1, '#FF8C14');

    ctx.beginPath();
    ctx.moveTo(0, -W * 0.08);
    ctx.bezierCurveTo(tL * 0.35, -tH * 0.78, tL * 0.86, -tH * 1.05, tL, -tH * 0.62);
    ctx.quadraticCurveTo(tL * 1.08, 0, tL, tH * 0.62);
    ctx.bezierCurveTo(tL * 0.86, tH * 1.05, tL * 0.35, tH * 0.78, 0, W * 0.08);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Cobra snakeskin dark rosette / filigree pattern clipped inside fan
    ctx.save();
    ctx.clip();
    ctx.fillStyle = '#1D1824';
    for (let c = 1; c <= 4; c++) {
      const rx = tL * (c * 0.21);
      for (let r = -c; r <= c; r++) {
        const ry = r * (tH * 0.22);
        ctx.beginPath();
        ctx.ellipse(rx, ry, 1.8, 1.1, (r % 2) * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Delicate golden rays
    ctx.strokeStyle = 'rgba(255, 250, 215, 0.48)';
    ctx.lineWidth = 0.65;
    for (let r = -3; r <= 3; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * 0.5);
      ctx.lineTo(tL * 0.96, r * tH * 0.24);
      ctx.stroke();
    }
    ctx.restore();

    ctx.strokeStyle = '#1B1526';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  _drawPectorals(ctx, pts, L, W) {
    const anchor = pts[2];
    const flutter = Math.sin(this.time * this._pose.finFreq) * this._pose.finSweep;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(anchor.x, anchor.y + side * pts[2].hw * 0.82);
      ctx.rotate(side * (0.50 + flutter * (side > 0 ? 1 : -0.85)));
      const fL = L * 0.22, fW = W * 0.24;
      ctx.fillStyle = 'rgba(130, 232, 255, 0.72)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(fL * 0.2, side * fW * 0.6, -fL * 0.5, side * fW * 1.1, -fL * 0.95, side * fW * 0.5);
      ctx.bezierCurveTo(-fL * 0.9, side * fW * 0.1, -fL * 0.35, -side * fW * 0.05, 0, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#1B1526';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawRibbonDorsal(ctx, pts, L, W) {
    // Flowing golden cobra ribbon dorsal
    const s1 = Math.sin(this.phase - 1.5) * W * 0.20;
    const s2 = Math.sin(this.phase - 3.0) * W * 0.28;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pts[2].x, pts[2].y);
    ctx.bezierCurveTo(pts[4].x, pts[4].y - 3 + s1, pts[6].x - 5, pts[6].y - 3 + s2, pts[6].x - 10, pts[6].y + s2);
    ctx.bezierCurveTo(pts[5].x, pts[5].y + 2 + s1 * 0.6, pts[3].x, pts[3].y + 2, pts[2].x, pts[2].y);
    ctx.closePath();
    ctx.fillStyle = '#FFD038';
    ctx.fill();
    ctx.strokeStyle = '#1B1526';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
  }

  _drawEyesAndEmotes(ctx, pts, L, W) {
    const head = pts[1];
    const ex = head.x + 2.5;
    const sep = pts[1].hw * 0.76;
    const baseR = 3.8 * this._pose.eyeScale;
    const st = this.state;

    for (const side of [-1, 1]) {
      ctx.fillStyle = 'rgba(255, 110, 158, 0.58)';
      ctx.beginPath();
      ctx.ellipse(ex - 2.5, head.y + side * (sep + 1.8), 2.5, 1.6, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this._pose.mouthOpen > 0.05) {
      const m = this._pose.mouthOpen;
      ctx.fillStyle = '#4B1424';
      ctx.beginPath();
      ctx.ellipse(pts[0].x - 0.5, pts[0].y, 1.4 * m + 0.6, 1.8 * m + 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const side of [-1, 1]) {
      const ey = head.y + side * sep;
      ctx.save();
      ctx.translate(ex, ey);
      if (st === 'happy') {
        ctx.strokeStyle = '#1B1526'; ctx.lineWidth = 1.9; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(0, 0, baseR * 0.76, -Math.PI * 0.42, Math.PI * 0.42); ctx.stroke();
      } else if (st === 'stress') {
        ctx.strokeStyle = '#1B1526'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-baseR * 0.5, -baseR * 0.5); ctx.lineTo(baseR * 0.45, 0); ctx.lineTo(-baseR * 0.5, baseR * 0.5); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.arc(0, 0, baseR, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFDF9'; ctx.fill();
        ctx.strokeStyle = '#1B1526'; ctx.lineWidth = 1.3; ctx.stroke();

        const irisR = st === 'shock' ? baseR * 0.36 : baseR * 0.74;
        ctx.beginPath(); ctx.arc(0.3, 0, irisR, 0, Math.PI * 2);
        ctx.fillStyle = '#131630'; ctx.fill();

        if (st === 'hungry') {
          ctx.fillStyle = '#FFF8B4';
          this._star(ctx, 0.5, -0.2, baseR * 0.56);
        } else {
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath(); ctx.arc(baseR * 0.28, -baseR * 0.28, baseR * 0.32, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(-baseR * 0.22, baseR * 0.24, baseR * 0.14, 0, Math.PI * 2); ctx.fill();
        }
        if (st === 'relax') {
          ctx.fillStyle = '#38A2FF';
          ctx.beginPath(); ctx.arc(0, 0, baseR + 0.2, Math.PI * 0.65, Math.PI * 1.35); ctx.closePath(); ctx.fill();
        } else if (st === 'sad' || st === 'fear') {
          ctx.fillStyle = 'rgba(130, 232, 255, 0.88)';
          ctx.beginPath(); ctx.ellipse(-baseR * 0.3, side * baseR * 0.45, baseR * 0.36, baseR * 0.22, 0.25, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.restore();
    }

    if (st === 'happy') {
      const pulse = 0.8 + Math.sin(this.time * 8) * 0.25;
      ctx.fillStyle = '#FFE45E';
      this._star(ctx, pts[0].x + 4, -10, 3.2 * pulse);
    } else if (st === 'shock') {
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#FF3344'; ctx.fillText('!', pts[0].x + 4, -7);
    } else if (st === 'fear' || st === 'stress') {
      ctx.fillStyle = '#7CE4FF';
      ctx.beginPath();
      ctx.ellipse(pts[1].x - 2, -12, 2.8, 1.8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _star(ctx, cx, cy, r) {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      const rad = i % 2 === 0 ? r : r * 0.34;
      const px = cx + Math.cos(a) * rad, py = cy + Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  draw(ctx) {
    if (!ctx) return;
    const L = Guppyfish.metadata.baseLength;
    const W = Guppyfish.metadata.baseWidth;
    const shX = this._pose.shiver ? Math.sin(this.time * 58) * this._pose.shiver : 0;
    const shY = this._pose.shiver ? Math.cos(this.time * 66) * this._pose.shiver : 0;

    ctx.save();
    ctx.translate(this.x + shX, this.y + this._pose.bobY + shY);
    ctx.rotate(this.angle);
    ctx.scale(this.scale * this._pose.squashX, this.scale * this._pose.squashY);

    const pts = this._buildSpine(L, W);

    // Shadow
    ctx.save();
    ctx.translate(-1.5, 3);
    this._traceBody(ctx, pts, L, W);
    ctx.fillStyle = 'rgba(10, 18, 36, 0.22)';
    ctx.fill();
    ctx.restore();

    this._drawCobraFanTail(ctx, pts, L, W);
    this._drawPectorals(ctx, pts, L, W);

    // Petite iridescent sky-blue-to-gold body
    this._traceBody(ctx, pts, L, W);
    const bg = ctx.createLinearGradient(pts[0].x, 0, pts[pts.length - 1].x, 0);
    bg.addColorStop(0, '#5AD8FF');
    bg.addColorStop(0.55, '#2E8EFF');
    bg.addColorStop(1, '#FFD43B');
    ctx.fillStyle = bg;
    ctx.fill();

    // Clipped cobra flank flecks & jelly highlight
    ctx.save();
    this._traceBody(ctx, pts, L, W);
    ctx.clip();
    ctx.fillStyle = 'rgba(26, 22, 42, 0.55)';
    for (let i = 3; i <= 5; i++) {
      ctx.beginPath(); ctx.arc(pts[i].x, pts[i].y - 2.2, 1.1, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(pts[i].x, pts[i].y + 2.2, 1.1, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.beginPath();
    ctx.ellipse(pts[2].x, pts[2].y - 2.5, L * 0.16, 2.2, -0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    this._traceBody(ctx, pts, L, W);
    ctx.strokeStyle = '#1B1526';
    ctx.lineWidth = 1.7;
    ctx.lineJoin = 'round';
    ctx.stroke();

    this._drawRibbonDorsal(ctx, pts, L, W);
    this._drawEyesAndEmotes(ctx, pts, L, W);
    ctx.restore();
  }
}

export default Guppyfish;
