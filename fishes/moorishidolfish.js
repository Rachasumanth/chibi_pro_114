/**
 * Moorishidolfish ("Moorish Idol") — Standalone 2D Top-Down Expressive Chibi ES Module
 * Dimensions: 95x52 | Category: fish | Zero external dependencies (Canvas 2D API)
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
    waveAmp: 0.09, waveFreq: 3.1, turnBend: 0, finSweep: 0.18, finFreq: 3.0,
    squashX: 1, squashY: 1, mouthOpen: 0, shiver: 0, bobY: 0, eyeScale: 1
  };
  switch (state) {
    case 'breathing':
      pose.waveAmp = 0.05; pose.waveFreq = 2.1;
      pose.squashX = 1 + Math.sin(t * 2.6) * 0.02;
      pose.squashY = 1 - Math.sin(t * 2.6) * 0.02;
      break;
    case 'swimming':
      pose.waveAmp = 0.17; pose.waveFreq = 6.6; pose.finSweep = 0.34; pose.finFreq = 6.2;
      break;
    case 'relax':
      pose.waveAmp = 0.03; pose.waveFreq = 1.3; pose.finSweep = 0.08;
      break;
    case 'left_turn': {
      const env = Math.sin(clamp(p, 0, 1) * Math.PI);
      pose.waveAmp = 0.11; pose.waveFreq = 5.0; pose.turnBend = -0.56 * env;
      break;
    }
    case 'right_turn': {
      const env = Math.sin(clamp(p, 0, 1) * Math.PI);
      pose.waveAmp = 0.11; pose.waveFreq = 5.0; pose.turnBend = 0.56 * env;
      break;
    }
    case 'eating': {
      const ch = Math.max(0, Math.sin(clamp(p, 0, 1) * Math.PI * 3));
      pose.mouthOpen = ch; pose.waveAmp = 0.12; pose.waveFreq = 5.8;
      pose.squashX = 1 + ch * 0.06; pose.squashY = 1 - ch * 0.04;
      break;
    }
    case 'hungry':
      pose.waveAmp = 0.14; pose.waveFreq = 5.2; pose.mouthOpen = Math.max(0, Math.sin(t * 8.2)) * 0.85; pose.eyeScale = 1.12;
      break;
    case 'stress':
      pose.waveAmp = 0.15; pose.waveFreq = 11.8; pose.shiver = 1.3;
      break;
    case 'fear':
      pose.waveAmp = 0.22; pose.waveFreq = 14.0; pose.shiver = 2.0; pose.eyeScale = 1.24;
      break;
    case 'shock': {
      const env = Math.sin(clamp(p, 0, 1) * Math.PI);
      pose.waveAmp = 0.03; pose.shiver = 1.8 * env; pose.eyeScale = 1.32; pose.mouthOpen = 0.9 * env;
      pose.squashX = 0.87 + (1 - env) * 0.13; pose.squashY = 1.15 - (1 - env) * 0.15;
      break;
    }
    case 'happy':
      pose.waveAmp = 0.16; pose.waveFreq = 7.6; pose.finSweep = 0.36; pose.bobY = Math.sin(t * 7.0) * 1.4;
      break;
    case 'sad':
      pose.waveAmp = 0.04; pose.waveFreq = 1.5; pose.finSweep = 0.06;
      break;
  }
  return pose;
}

export class Moorishidolfish {
  static metadata = {
    name: 'Moorish Idol',
    category: 'fish',
    baseLength: 95,
    baseWidth: 52
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
    // Protruding tubular snout at index 0 -> plump disc body -> narrow caudal base
    const count = 9;
    const bodyL = L * 0.78;
    const noseX = L * 0.48;
    const widths = [0.06, 0.11, 0.34, 0.48, 0.50, 0.44, 0.31, 0.18, 0.09];
    const pts = [];
    for (let i = 0; i < count; i++) {
      const u = i / (count - 1);
      const x = noseX - u * bodyL;
      const wave = Math.sin(this.phase - u * 3.0) * this._pose.waveAmp * L * (0.06 + u * u * 0.88);
      const bend = this._pose.turnBend * W * (u * u * 0.78);
      pts.push({ x, y: wave + bend, hw: widths[i] * W, u });
    }
    return pts;
  }

  _traceBody(ctx, pts, L, W) {
    const n = pts.length;
    const top = [], bot = [];
    for (let i = 0; i < n; i++) {
      const pr = pts[Math.max(0, i - 1)], cr = pts[i], nx = pts[Math.min(n - 1, i + 1)];
      const dx = nx.x - pr.x, dy = nx.y - pr.y;
      const d = Math.hypot(dx, dy) || 1;
      const ux = -dy / d, uy = dx / d;
      top.push({ x: cr.x + ux * cr.hw, y: cr.y + uy * cr.hw });
      bot.push({ x: cr.x - ux * cr.hw, y: cr.y - uy * cr.hw });
    }
    ctx.beginPath();
    ctx.moveTo(pts[0].x + 2, pts[0].y);
    ctx.quadraticCurveTo(pts[0].x + 2, top[0].y, top[0].x, top[0].y);
    for (let i = 0; i < top.length - 1; i++) {
      ctx.quadraticCurveTo(top[i].x, top[i].y, (top[i].x + top[i + 1].x) * 0.5, (top[i].y + top[i + 1].y) * 0.5);
    }
    ctx.lineTo(top[top.length - 1].x, top[top.length - 1].y);
    ctx.lineTo(bot[bot.length - 1].x, bot[bot.length - 1].y);
    for (let i = bot.length - 1; i > 0; i--) {
      ctx.quadraticCurveTo(bot[i].x, bot[i].y, (bot[i].x + bot[i - 1].x) * 0.5, (bot[i].y + bot[i - 1].y) * 0.5);
    }
    ctx.quadraticCurveTo(pts[0].x + 2, bot[0].y, pts[0].x + 2, pts[0].y);
    ctx.closePath();
  }

  _drawBlackCrescentTail(ctx, pts, L, W) {
    const tail = pts[pts.length - 1];
    const prev = pts[pts.length - 2];
    const dir = Math.atan2(tail.y - prev.y, tail.x - prev.x);
    const wag = Math.sin(this.phase - 3.5) * 0.26 + this._pose.turnBend * 0.36;

    ctx.save();
    ctx.translate(tail.x, tail.y);
    ctx.rotate(dir + wag);

    const tL = L * 0.22;
    const tH = W * 0.38;
    const grad = ctx.createLinearGradient(0, 0, tL, 0);
    grad.addColorStop(0, '#181B24');
    grad.addColorStop(0.8, '#262C3B');
    grad.addColorStop(1, '#12151C');

    ctx.beginPath();
    ctx.moveTo(0, -W * 0.08);
    ctx.bezierCurveTo(tL * 0.45, -tH * 0.85, tL * 0.95, -tH * 1.0, tL * 1.08, -tH * 0.82);
    ctx.quadraticCurveTo(tL * 0.58, 0, tL * 1.08, tH * 0.82);
    ctx.bezierCurveTo(tL * 0.95, tH * 1.0, tL * 0.45, tH * 0.85, 0, W * 0.08);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#0D1018';
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.restore();
  }

  _drawPectorals(ctx, pts, L, W) {
    const anchor = pts[3];
    const flutter = Math.sin(this.time * this._pose.finFreq) * this._pose.finSweep;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(anchor.x, anchor.y + side * pts[3].hw * 0.85);
      ctx.rotate(side * (0.55 + flutter * (side > 0 ? 1 : -0.85)));
      const fL = L * 0.22, fW = W * 0.22;
      const g = ctx.createLinearGradient(0, 0, -fL, side * fW);
      g.addColorStop(0, 'rgba(255, 248, 226, 0.90)');
      g.addColorStop(1, 'rgba(255, 224, 118, 0.55)');
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(fL * 0.2, side * fW * 0.65, -fL * 0.5, side * fW * 1.1, -fL * 0.95, side * fW * 0.55);
      ctx.bezierCurveTo(-fL * 0.9, side * fW * 0.12, -fL * 0.35, -side * fW * 0.05, 0, 0);
      ctx.closePath();
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = '#181B24';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawIdolBands(ctx, pts, L, W) {
    // 1. Orange snout saddle on tubular nose
    ctx.fillStyle = '#FF7E24';
    ctx.beginPath();
    ctx.ellipse(pts[1].x + 2, pts[1].y, 6.2, 5.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#141720';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // 2. Bold jet-black anterior head/eye band
    ctx.fillStyle = '#141720';
    ctx.beginPath();
    ctx.rect(pts[3].x - 2, -W * 0.6, (pts[2].x - pts[3].x) + 12, W * 1.2);
    ctx.fill();

    // 3. Bright golden-yellow mid-body wash blending into crisp white
    const midGrad = ctx.createLinearGradient(pts[4].x + 5, 0, pts[6].x, 0);
    midGrad.addColorStop(0, '#FFFDF7');
    midGrad.addColorStop(0.55, '#FFF1A8');
    midGrad.addColorStop(1, '#FFD22B');
    ctx.fillStyle = midGrad;
    ctx.beginPath();
    ctx.rect(pts[6].x, -W * 0.6, (pts[3].x - pts[6].x) - 1, W * 1.2);
    ctx.fill();

    // 4. Bold jet-black posterior flank band
    ctx.fillStyle = '#141720';
    ctx.beginPath();
    ctx.rect(pts[8].x - 3, -W * 0.6, (pts[6].x - pts[8].x) + 6, W * 1.2);
    ctx.fill();

    // Crisp pearl-white vertical accent seam near tail
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(pts[7].x - 1, -W * 0.5, 2.8, W);
  }

  _drawTrailingDorsalWhip(ctx, pts, L, W) {
    // Signature ultra-long flowing white dorsal streamer whip
    const base = pts[3];
    const s1 = Math.sin(this.phase - 1.4) * W * 0.16;
    const s2 = Math.sin(this.phase - 3.0) * W * 0.28;
    const s3 = Math.sin(this.phase - 4.8) * W * 0.36;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(base.x + 2, base.y - 3.2);
    ctx.bezierCurveTo(
      pts[5].x, pts[5].y - 5 + s1,
      pts[8].x - L * 0.18, pts[8].y - 3 + s2,
      pts[8].x - L * 0.42, pts[8].y + s3
    );
    ctx.bezierCurveTo(
      pts[8].x - L * 0.16, pts[8].y + 4 + s2 * 0.85,
      pts[5].x, pts[5].y + 4.5 + s1 * 0.7,
      base.x + 2, base.y + 3.2
    );
    ctx.closePath();

    const wg = ctx.createLinearGradient(base.x, base.y, pts[8].x - L * 0.42, pts[8].y);
    wg.addColorStop(0, '#FFFFFF');
    wg.addColorStop(0.65, '#FFF8E0');
    wg.addColorStop(1, 'rgba(255, 245, 210, 0.72)');
    ctx.fillStyle = wg;
    ctx.fill();
    ctx.strokeStyle = '#141720';
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  _drawEyesAndEmotes(ctx, pts, L, W) {
    const head = pts[2];
    const ex = head.x + 2;
    const sep = pts[2].hw * 0.68;
    const baseR = 5.4 * this._pose.eyeScale;
    const st = this.state;

    for (const side of [-1, 1]) {
      const bg = ctx.createRadialGradient(ex - 4, head.y + side * (sep + 3), 0.5, ex - 4, head.y + side * (sep + 3), 5);
      bg.addColorStop(0, 'rgba(255, 118, 152, 0.62)');
      bg.addColorStop(1, 'rgba(255, 118, 152, 0)');
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.ellipse(ex - 4, head.y + side * (sep + 3), 4.5, 2.8, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this._pose.mouthOpen > 0.05) {
      const m = this._pose.mouthOpen;
      ctx.fillStyle = '#4B1420';
      ctx.beginPath();
      ctx.ellipse(pts[0].x + 2, pts[0].y, 2.0 * m + 0.9, 2.2 * m + 0.9, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const side of [-1, 1]) {
      const ey = head.y + side * sep;
      ctx.save();
      ctx.translate(ex, ey);
      if (st === 'happy') {
        ctx.strokeStyle = '#FFFDF6'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(0, 0, baseR * 0.76, -Math.PI * 0.42, Math.PI * 0.42); ctx.stroke();
      } else if (st === 'stress') {
        ctx.strokeStyle = '#FFFDF6'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-baseR * 0.55, -baseR * 0.55); ctx.lineTo(baseR * 0.45, 0); ctx.lineTo(-baseR * 0.55, baseR * 0.55); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.arc(0, 0, baseR, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFDF9'; ctx.fill();
        ctx.strokeStyle = '#0D1018'; ctx.lineWidth = 1.6; ctx.stroke();

        const irisR = st === 'shock' ? baseR * 0.36 : baseR * 0.75;
        const ig = ctx.createRadialGradient(0.4, -0.4, 0.5, 0, 0, irisR);
        ig.addColorStop(0, '#10131C');
        ig.addColorStop(0.55, '#1B2133');
        ig.addColorStop(0.84, '#FFD63A');
        ig.addColorStop(1, '#FFF3A8');
        ctx.beginPath(); ctx.arc(0.4, 0, irisR, 0, Math.PI * 2); ctx.fillStyle = ig; ctx.fill();

        if (st === 'hungry') {
          ctx.fillStyle = '#FFF8B4';
          this._star(ctx, 0.7, -0.3, baseR * 0.55);
        } else {
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath(); ctx.arc(baseR * 0.28, -baseR * 0.30, baseR * 0.30, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(-baseR * 0.24, baseR * 0.26, baseR * 0.14, 0, Math.PI * 2); ctx.fill();
        }
        if (st === 'relax') {
          ctx.fillStyle = '#181C28';
          ctx.beginPath(); ctx.arc(0, 0, baseR + 0.3, Math.PI * 0.65, Math.PI * 1.35); ctx.closePath(); ctx.fill();
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
      this._star(ctx, pts[0].x + 6, -18, 4.5 * pulse);
      this._star(ctx, pts[3].x, 24, 3.4 * pulse);
    } else if (st === 'shock') {
      ctx.font = 'bold 14px sans-serif';
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2;
      ctx.strokeText('!', pts[0].x + 8, -12);
      ctx.fillStyle = '#FF3344'; ctx.fillText('!', pts[0].x + 8, -12);
    } else if (st === 'fear' || st === 'stress') {
      ctx.fillStyle = '#7CE4FF'; ctx.strokeStyle = '#1D5486'; ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(pts[2].x + 2, -24);
      ctx.quadraticCurveTo(pts[2].x - 5, -28, pts[2].x - 8, -24);
      ctx.quadraticCurveTo(pts[2].x - 5, -20, pts[2].x + 2, -24);
      ctx.fill(); ctx.stroke();
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
    const L = Moorishidolfish.metadata.baseLength;
    const W = Moorishidolfish.metadata.baseWidth;
    const shX = this._pose.shiver ? Math.sin(this.time * 58) * this._pose.shiver : 0;
    const shY = this._pose.shiver ? Math.cos(this.time * 66) * this._pose.shiver : 0;

    ctx.save();
    ctx.translate(this.x + shX, this.y + this._pose.bobY + shY);
    ctx.rotate(this.angle);
    ctx.scale(this.scale * this._pose.squashX, this.scale * this._pose.squashY);

    const pts = this._buildSpine(L, W);

    // Shadow
    ctx.save();
    ctx.translate(-2, 4);
    this._traceBody(ctx, pts, L, W);
    ctx.fillStyle = 'rgba(10, 14, 24, 0.22)';
    ctx.fill();
    ctx.restore();

    this._drawBlackCrescentTail(ctx, pts, L, W);
    this._drawPectorals(ctx, pts, L, W);

    // Base creamy-white body
    this._traceBody(ctx, pts, L, W);
    ctx.fillStyle = '#FFFDF5';
    ctx.fill();

    // Clipped bands + cel-shading + highlight
    ctx.save();
    this._traceBody(ctx, pts, L, W);
    ctx.clip();
    this._drawIdolBands(ctx, pts, L, W);

    const hl = ctx.createLinearGradient(pts[2].x, -W * 0.28, pts[6].x, W * 0.1);
    hl.addColorStop(0, 'rgba(255, 255, 255, 0.50)');
    hl.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = hl;
    ctx.beginPath();
    ctx.ellipse(pts[4].x + 2, pts[4].y - W * 0.14, L * 0.20, W * 0.11, -0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Bold outline
    this._traceBody(ctx, pts, L, W);
    ctx.strokeStyle = '#12151E';
    ctx.lineWidth = 2.2;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Flowing trailing dorsal whip
    this._drawTrailingDorsalWhip(ctx, pts, L, W);

    this._drawEyesAndEmotes(ctx, pts, L, W);
    ctx.restore();
  }
}

export default Moorishidolfish;
