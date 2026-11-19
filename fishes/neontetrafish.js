/**
 * Neontetrafish ("Neon Tetra") — Standalone 2D Top-Down Expressive Chibi ES Module
 * Dimensions: 45x18 | Category: fish | Zero external dependencies (Canvas 2D API)
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
    waveAmp: 0.11, waveFreq: 4.5, turnBend: 0, finSweep: 0.22, finFreq: 4.8,
    squashX: 1, squashY: 1, mouthOpen: 0, shiver: 0, bobY: 0, eyeScale: 1
  };
  switch (state) {
    case 'breathing':
      pose.waveAmp = 0.06; pose.waveFreq = 2.8;
      pose.squashX = 1 + Math.sin(t * 3.2) * 0.025;
      pose.squashY = 1 - Math.sin(t * 3.2) * 0.025;
      break;
    case 'swimming':
      pose.waveAmp = 0.20; pose.waveFreq = 9.4; pose.finSweep = 0.38; pose.finFreq = 9.0;
      break;
    case 'relax':
      pose.waveAmp = 0.035; pose.waveFreq = 1.6; pose.finSweep = 0.09;
      break;
    case 'left_turn': {
      const env = Math.sin(clamp(p, 0, 1) * Math.PI);
      pose.waveAmp = 0.13; pose.waveFreq = 6.8; pose.turnBend = -0.64 * env;
      break;
    }
    case 'right_turn': {
      const env = Math.sin(clamp(p, 0, 1) * Math.PI);
      pose.waveAmp = 0.13; pose.waveFreq = 6.8; pose.turnBend = 0.64 * env;
      break;
    }
    case 'eating': {
      const ch = Math.max(0, Math.sin(clamp(p, 0, 1) * Math.PI * 3));
      pose.mouthOpen = ch; pose.waveAmp = 0.15; pose.waveFreq = 7.4;
      pose.squashX = 1 + ch * 0.06; pose.squashY = 1 - ch * 0.04;
      break;
    }
    case 'hungry':
      pose.waveAmp = 0.16; pose.waveFreq = 6.8; pose.mouthOpen = Math.max(0, Math.sin(t * 9.2)) * 0.85; pose.eyeScale = 1.14;
      break;
    case 'stress':
      pose.waveAmp = 0.17; pose.waveFreq = 13.5; pose.shiver = 0.9;
      break;
    case 'fear':
      pose.waveAmp = 0.24; pose.waveFreq = 15.5; pose.shiver = 1.5; pose.eyeScale = 1.24;
      break;
    case 'shock': {
      const env = Math.sin(clamp(p, 0, 1) * Math.PI);
      pose.waveAmp = 0.02; pose.shiver = 1.4 * env; pose.eyeScale = 1.34; pose.mouthOpen = 0.9 * env;
      pose.squashX = 0.86 + (1 - env) * 0.14; pose.squashY = 1.15 - (1 - env) * 0.15;
      break;
    }
    case 'happy':
      pose.waveAmp = 0.19; pose.waveFreq = 9.6; pose.finSweep = 0.40; pose.bobY = Math.sin(t * 8.4) * 1.1;
      break;
    case 'sad':
      pose.waveAmp = 0.04; pose.waveFreq = 1.8; pose.finSweep = 0.07;
      break;
  }
  return pose;
}

export class Neontetrafish {
  static metadata = {
    name: 'Neon Tetra',
    category: 'fish',
    baseLength: 45,
    baseWidth: 18
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
    // Sleek cute chibi torpedo
    const count = 7;
    const bodyL = L * 0.76;
    const noseX = L * 0.45;
    const widths = [0.0, 0.30, 0.44, 0.42, 0.32, 0.20, 0.10];
    const pts = [];
    for (let i = 0; i < count; i++) {
      const u = i / (count - 1);
      const x = noseX - u * bodyL;
      const wave = Math.sin(this.phase - u * 3.0) * this._pose.waveAmp * L * (0.08 + u * u * 0.88);
      const bend = this._pose.turnBend * W * (u * u * 0.88);
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

  _drawForkedTail(ctx, pts, L, W) {
    const tail = pts[pts.length - 1];
    const prev = pts[pts.length - 2];
    const dir = Math.atan2(tail.y - prev.y, tail.x - prev.x);
    const wag = Math.sin(this.phase - 3.4) * 0.28 + this._pose.turnBend * 0.40;

    ctx.save();
    ctx.translate(tail.x, tail.y);
    ctx.rotate(dir + wag);

    const tL = L * 0.25, tH = W * 0.44;
    const g = ctx.createLinearGradient(0, 0, tL, 0);
    g.addColorStop(0, 'rgba(255, 58, 78, 0.78)');
    g.addColorStop(1, 'rgba(220, 245, 255, 0.32)');

    ctx.beginPath();
    ctx.moveTo(0, -W * 0.08);
    ctx.lineTo(tL, -tH);
    ctx.quadraticCurveTo(tL * 0.55, 0, tL, tH);
    ctx.lineTo(0, W * 0.08);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = '#0D1E36';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
  }

  _drawPectorals(ctx, pts, L, W) {
    const anchor = pts[2];
    const flutter = Math.sin(this.time * this._pose.finFreq) * this._pose.finSweep;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(anchor.x, anchor.y + side * pts[2].hw * 0.85);
      ctx.rotate(side * (0.50 + flutter * (side > 0 ? 1 : -0.85)));
      const fL = L * 0.20, fW = W * 0.28;
      ctx.fillStyle = 'rgba(180, 245, 255, 0.55)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-fL * 0.3, side * fW, -fL, side * fW * 0.45);
      ctx.quadraticCurveTo(-fL * 0.5, side * fW * 0.08, 0, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#0D1E36';
      ctx.lineWidth = 1.0;
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawNeonStripeAndRubyTail(ctx, pts, L, W) {
    // Bright ruby-red posterior half
    const rubyGrad = ctx.createLinearGradient(pts[3].x, 0, pts[6].x, 0);
    rubyGrad.addColorStop(0, 'rgba(255, 28, 62, 0)');
    rubyGrad.addColorStop(0.28, '#FF2048');
    rubyGrad.addColorStop(1, '#D80A32');
    ctx.fillStyle = rubyGrad;
    ctx.fillRect(pts[6].x - 5, -W, (pts[3].x - pts[6].x) + 10, W * 2);

    // Glowing neon-cyan iridescent lateral stripe with outer bloom
    const glowPulse = 0.82 + Math.sin(this.time * 6.0) * 0.18;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < pts.length - 1; i++) {
      if (i === 0) ctx.moveTo(pts[i].x - 2, pts[i].y);
      else ctx.lineTo(pts[i].x, pts[i].y);
    }
    // Outer luminous bloom
    ctx.strokeStyle = `rgba(0, 245, 255, ${0.42 * glowPulse})`;
    ctx.lineWidth = 7.2;
    ctx.stroke();

    // Intense electric neon-cyan core
    ctx.strokeStyle = '#18F4FF';
    ctx.lineWidth = 3.2;
    ctx.stroke();

    // Specular white-cyan center filament
    ctx.strokeStyle = 'rgba(225, 255, 255, 0.85)';
    ctx.lineWidth = 1.1;
    ctx.stroke();
    ctx.restore();
  }

  _drawEyesAndEmotes(ctx, pts, L, W) {
    const head = pts[1];
    const ex = head.x + 2.0;
    const sep = pts[1].hw * 0.74;
    const baseR = 3.2 * this._pose.eyeScale;
    const st = this.state;

    for (const side of [-1, 1]) {
      ctx.fillStyle = 'rgba(255, 110, 152, 0.55)';
      ctx.beginPath();
      ctx.ellipse(ex - 2.2, head.y + side * (sep + 1.5), 2.0, 1.2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this._pose.mouthOpen > 0.05) {
      const m = this._pose.mouthOpen;
      ctx.fillStyle = '#4A1220';
      ctx.beginPath();
      ctx.ellipse(pts[0].x - 0.3, pts[0].y, 1.2 * m + 0.5, 1.5 * m + 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const side of [-1, 1]) {
      const ey = head.y + side * sep;
      ctx.save();
      ctx.translate(ex, ey);
      if (st === 'happy') {
        ctx.strokeStyle = '#0D1E36'; ctx.lineWidth = 1.7; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(0, 0, baseR * 0.76, -Math.PI * 0.42, Math.PI * 0.42); ctx.stroke();
      } else if (st === 'stress') {
        ctx.strokeStyle = '#0D1E36'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-baseR * 0.5, -baseR * 0.5); ctx.lineTo(baseR * 0.45, 0); ctx.lineTo(-baseR * 0.5, baseR * 0.5); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.arc(0, 0, baseR, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFDF9'; ctx.fill();
        ctx.strokeStyle = '#0D1E36'; ctx.lineWidth = 1.2; ctx.stroke();

        const irisR = st === 'shock' ? baseR * 0.36 : baseR * 0.75;
        const ig = ctx.createRadialGradient(0.3, -0.3, 0.4, 0, 0, irisR);
        ig.addColorStop(0, '#0B182E');
        ig.addColorStop(0.6, '#0E2448');
        ig.addColorStop(1, '#1EF2FF');
        ctx.beginPath(); ctx.arc(0.3, 0, irisR, 0, Math.PI * 2); ctx.fillStyle = ig; ctx.fill();

        if (st === 'hungry') {
          ctx.fillStyle = '#FFF8B4';
          this._star(ctx, 0.4, -0.2, baseR * 0.55);
        } else {
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath(); ctx.arc(baseR * 0.28, -baseR * 0.28, baseR * 0.32, 0, Math.PI * 2); ctx.fill();
        }
        if (st === 'relax') {
          ctx.fillStyle = '#18D8FF';
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
      this._star(ctx, pts[0].x + 4, -8, 2.8 * pulse);
    } else if (st === 'shock') {
      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = '#FF3344'; ctx.fillText('!', pts[0].x + 4, -6);
    } else if (st === 'fear' || st === 'stress') {
      ctx.fillStyle = '#7CE4FF';
      ctx.beginPath(); ctx.ellipse(pts[1].x - 2, -10, 2.4, 1.5, 0, 0, Math.PI * 2); ctx.fill();
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
    const L = Neontetrafish.metadata.baseLength;
    const W = Neontetrafish.metadata.baseWidth;
    const shX = this._pose.shiver ? Math.sin(this.time * 58) * this._pose.shiver : 0;
    const shY = this._pose.shiver ? Math.cos(this.time * 66) * this._pose.shiver : 0;

    ctx.save();
    ctx.translate(this.x + shX, this.y + this._pose.bobY + shY);
    ctx.rotate(this.angle);
    ctx.scale(this.scale * this._pose.squashX, this.scale * this._pose.squashY);

    const pts = this._buildSpine(L, W);

    // Shadow
    ctx.save();
    ctx.translate(-1.5, 2.5);
    this._traceBody(ctx, pts, L, W);
    ctx.fillStyle = 'rgba(8, 20, 38, 0.22)';
    ctx.fill();
    ctx.restore();

    this._drawForkedTail(ctx, pts, L, W);
    this._drawPectorals(ctx, pts, L, W);

    // Sleek silver-translucent chibi torpedo base
    this._traceBody(ctx, pts, L, W);
    const bg = ctx.createLinearGradient(pts[0].x, -W * 0.5, pts[0].x, W * 0.5);
    bg.addColorStop(0, '#E8F6FF');
    bg.addColorStop(0.5, '#C4DCF2');
    bg.addColorStop(1, '#8EB0D4');
    ctx.fillStyle = bg;
    ctx.fill();

    // Clipped ruby-red posterior + glowing neon-cyan lateral stripe
    ctx.save();
    this._traceBody(ctx, pts, L, W);
    ctx.clip();
    this._drawNeonStripeAndRubyTail(ctx, pts, L, W);
    ctx.restore();

    this._traceBody(ctx, pts, L, W);
    ctx.strokeStyle = '#0D1E36';
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.stroke();

    this._drawEyesAndEmotes(ctx, pts, L, W);
    ctx.restore();
  }
}

export default Neontetrafish;
