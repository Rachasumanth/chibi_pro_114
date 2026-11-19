/**
 * Bluetangfish ("Regal Blue Tang") — Standalone 2D Top-Down Expressive Chibi ES Module
 * Dimensions: 85x44 | Category: fish | Zero external dependencies (Canvas 2D API)
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
    waveAmp: 0.10, waveFreq: 3.4, turnBend: 0, finSweep: 0.18, finFreq: 3.4,
    squashX: 1, squashY: 1, mouthOpen: 0, shiver: 0, bobY: 0, eyeScale: 1
  };
  switch (state) {
    case 'breathing':
      pose.waveAmp = 0.06; pose.waveFreq = 2.3;
      pose.squashX = 1 + Math.sin(t * 2.8) * 0.025;
      pose.squashY = 1 - Math.sin(t * 2.8) * 0.025;
      break;
    case 'swimming':
      pose.waveAmp = 0.19; pose.waveFreq = 7.4; pose.finSweep = 0.34; pose.finFreq = 7.0;
      pose.squashX = 1.03; pose.squashY = 0.97;
      break;
    case 'relax':
      pose.waveAmp = 0.04; pose.waveFreq = 1.4; pose.finSweep = 0.08;
      break;
    case 'left_turn': {
      const env = Math.sin(clamp(p, 0, 1) * Math.PI);
      pose.waveAmp = 0.12; pose.waveFreq = 5.4; pose.turnBend = -0.58 * env;
      break;
    }
    case 'right_turn': {
      const env = Math.sin(clamp(p, 0, 1) * Math.PI);
      pose.waveAmp = 0.12; pose.waveFreq = 5.4; pose.turnBend = 0.58 * env;
      break;
    }
    case 'eating': {
      const ch = Math.max(0, Math.sin(clamp(p, 0, 1) * Math.PI * 3));
      pose.mouthOpen = ch; pose.waveAmp = 0.13; pose.waveFreq = 6.0;
      pose.squashX = 1 + ch * 0.06; pose.squashY = 1 - ch * 0.04;
      break;
    }
    case 'hungry':
      pose.waveAmp = 0.15; pose.waveFreq = 5.6; pose.mouthOpen = Math.max(0, Math.sin(t * 8.4)) * 0.85; pose.eyeScale = 1.12;
      break;
    case 'stress':
      pose.waveAmp = 0.16; pose.waveFreq = 12.2; pose.shiver = 1.3;
      break;
    case 'fear':
      pose.waveAmp = 0.23; pose.waveFreq = 14.2; pose.shiver = 2.0; pose.eyeScale = 1.24;
      break;
    case 'shock': {
      const env = Math.sin(clamp(p, 0, 1) * Math.PI);
      pose.waveAmp = 0.03; pose.shiver = 1.8 * env; pose.eyeScale = 1.34; pose.mouthOpen = 0.9 * env;
      pose.squashX = 0.87 + (1 - env) * 0.13; pose.squashY = 1.15 - (1 - env) * 0.15;
      break;
    }
    case 'happy':
      pose.waveAmp = 0.18; pose.waveFreq = 8.2; pose.finSweep = 0.36; pose.bobY = Math.sin(t * 7.2) * 1.5;
      break;
    case 'sad':
      pose.waveAmp = 0.04; pose.waveFreq = 1.6; pose.finSweep = 0.07;
      break;
  }
  return pose;
}

export class Bluetangfish {
  static metadata = {
    name: 'Regal Blue Tang',
    category: 'fish',
    baseLength: 85,
    baseWidth: 44
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
    const count = 8;
    const bodyL = L * 0.74;
    const noseX = L * 0.44;
    const widths = [0.0, 0.30, 0.46, 0.50, 0.45, 0.33, 0.18, 0.10];
    const pts = [];
    for (let i = 0; i < count; i++) {
      const u = i / (count - 1);
      const x = noseX - u * bodyL;
      const wave = Math.sin(this.phase - u * 3.0) * this._pose.waveAmp * L * (0.10 + u * u * 0.88);
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
    ctx.bezierCurveTo(pts[0].x + 2, pts[0].y - W * 0.24, top[0].x + 4, top[0].y - 2, top[0].x, top[0].y);
    for (let i = 0; i < top.length - 1; i++) {
      ctx.quadraticCurveTo(top[i].x, top[i].y, (top[i].x + top[i + 1].x) * 0.5, (top[i].y + top[i + 1].y) * 0.5);
    }
    ctx.lineTo(top[top.length - 1].x, top[top.length - 1].y);
    ctx.lineTo(bot[bot.length - 1].x, bot[bot.length - 1].y);
    for (let i = bot.length - 1; i > 0; i--) {
      ctx.quadraticCurveTo(bot[i].x, bot[i].y, (bot[i].x + bot[i - 1].x) * 0.5, (bot[i].y + bot[i - 1].y) * 0.5);
    }
    ctx.bezierCurveTo(bot[0].x + 4, bot[0].y + 2, pts[0].x + 2, pts[0].y + W * 0.24, pts[0].x, pts[0].y);
    ctx.closePath();
  }

  _drawCanaryWedgeTail(ctx, pts, L, W) {
    // Iconic bright canary-yellow wedge tail with crisp black top/bottom borders
    const tail = pts[pts.length - 1];
    const prev = pts[pts.length - 2];
    const dir = Math.atan2(tail.y - prev.y, tail.x - prev.x);
    const wag = Math.sin(this.phase - 3.5) * 0.26 + this._pose.turnBend * 0.38;

    ctx.save();
    ctx.translate(tail.x, tail.y);
    ctx.rotate(dir + wag);

    const tL = L * 0.28;
    const tH = W * 0.42;

    const grad = ctx.createLinearGradient(0, 0, tL, 0);
    grad.addColorStop(0, '#FFE738');
    grad.addColorStop(0.65, '#FFD000');
    grad.addColorStop(1, '#FFB800');

    ctx.beginPath();
    ctx.moveTo(-2, -W * 0.08);
    ctx.lineTo(tL, -tH * 0.92);
    ctx.quadraticCurveTo(tL * 0.86, 0, tL, tH * 0.92);
    ctx.lineTo(-2, W * 0.08);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Crisp black top & bottom wedge borders
    ctx.save();
    ctx.clip();
    ctx.fillStyle = '#121824';
    ctx.beginPath();
    ctx.moveTo(-2, -W * 0.12);
    ctx.lineTo(tL + 2, -tH * 0.96);
    ctx.lineTo(tL + 2, -tH * 0.64);
    ctx.lineTo(-2, -W * 0.04);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-2, W * 0.12);
    ctx.lineTo(tL + 2, tH * 0.96);
    ctx.lineTo(tL + 2, tH * 0.64);
    ctx.lineTo(-2, W * 0.04);
    ctx.closePath();
    ctx.fill();

    // Fine yellow fin rays
    ctx.strokeStyle = 'rgba(255, 255, 220, 0.55)';
    ctx.lineWidth = 0.8;
    for (let r = -2; r <= 2; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * 0.9);
      ctx.lineTo(tL * 0.88, r * tH * 0.28);
      ctx.stroke();
    }
    ctx.restore();

    ctx.strokeStyle = '#101522';
    ctx.lineWidth = 2.0;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  _drawPectoralFins(ctx, pts, L, W) {
    // Blue pectorals with canary-yellow tips
    const anchor = pts[2];
    const flutter = Math.sin(this.time * this._pose.finFreq) * this._pose.finSweep;

    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(anchor.x + 2, anchor.y + side * W * 0.40);
      ctx.rotate(side * (0.58 + flutter * (side > 0 ? 1 : -0.85)));

      const fL = L * 0.22;
      const fW = W * 0.24;
      const grad = ctx.createLinearGradient(0, 0, -fL, side * fW);
      grad.addColorStop(0, '#1C6CFF');
      grad.addColorStop(0.55, '#144EE0');
      grad.addColorStop(0.82, '#FFE024');
      grad.addColorStop(1, '#FFC400');

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(fL * 0.25, side * fW * 0.6, -fL * 0.45, side * fW * 1.18, -fL * 0.98, side * fW * 0.56);
      ctx.bezierCurveTo(-fL * 0.95, side * fW * 0.14, -fL * 0.35, -side * fW * 0.06, 0, 0);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.strokeStyle = 'rgba(220, 245, 255, 0.45)';
      ctx.lineWidth = 0.75;
      for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-fL * (0.35 + i * 0.18), side * fW * (0.25 + (3 - i) * 0.22));
        ctx.stroke();
      }

      ctx.strokeStyle = '#101522';
      ctx.lineWidth = 1.7;
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawPaintersPaletteMarkings(ctx, pts, L, W) {
    // Iconic Regal Blue Tang black painter's palette saddle + yellow caudal triangle
    ctx.save();
    ctx.fillStyle = '#101624';
    ctx.beginPath();
    ctx.moveTo(pts[1].x + 2, pts[1].y);
    ctx.bezierCurveTo(
      pts[2].x + 4, pts[2].y - W * 0.42,
      pts[5].x - 2, pts[5].y - W * 0.38,
      pts[6].x - 3, pts[6].y - W * 0.12
    );
    ctx.lineTo(pts[6].x - 3, pts[6].y + W * 0.12);
    ctx.bezierCurveTo(
      pts[5].x - 2, pts[5].y + W * 0.38,
      pts[2].x + 4, pts[2].y + W * 0.42,
      pts[1].x + 2, pts[1].y
    );
    ctx.closePath();
    ctx.fill();

    // Electric-blue oval "thumb hole" inside the painter's palette
    const holeGrad = ctx.createRadialGradient(pts[3].x - 2, pts[3].y, 2, pts[3].x - 2, pts[3].y, W * 0.24);
    holeGrad.addColorStop(0, '#3692FF');
    holeGrad.addColorStop(1, '#155AE8');
    ctx.fillStyle = holeGrad;
    ctx.beginPath();
    ctx.ellipse(pts[3].x - 3, pts[3].y, L * 0.135, W * 0.185, 0, 0, Math.PI * 2);
    ctx.fill();

    // Yellow wedge intrusion at tail peduncle
    ctx.fillStyle = '#FFE024';
    ctx.beginPath();
    ctx.moveTo(pts[6].x + 5, pts[6].y);
    ctx.lineTo(pts[7].x - 4, pts[7].y - W * 0.16);
    ctx.lineTo(pts[7].x - 4, pts[7].y + W * 0.16);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  _drawEyesAndEmotes(ctx, pts, L, W) {
    const head = pts[1];
    const ex = head.x + L * 0.04;
    const sep = W * 0.27;
    const baseR = W * 0.145 * this._pose.eyeScale;
    const st = this.state;

    for (const side of [-1, 1]) {
      const bg = ctx.createRadialGradient(ex - 4, head.y + side * (sep + 3.5), 0.5, ex - 4, head.y + side * (sep + 3.5), 5);
      bg.addColorStop(0, 'rgba(255, 108, 152, 0.60)');
      bg.addColorStop(1, 'rgba(255, 108, 152, 0)');
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.ellipse(ex - 4, head.y + side * (sep + 3.5), 4.6, 3.0, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this._pose.mouthOpen > 0.05) {
      const m = this._pose.mouthOpen;
      ctx.fillStyle = '#4B1424';
      ctx.beginPath();
      ctx.ellipse(pts[0].x - 1, pts[0].y, 2.0 * m + 1.0, 2.6 * m + 1.0, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const side of [-1, 1]) {
      const ey = head.y + side * sep;
      ctx.save();
      ctx.translate(ex, ey);
      if (st === 'happy') {
        ctx.strokeStyle = '#0D1322'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(0, 0, baseR * 0.78, -Math.PI * 0.42, Math.PI * 0.42); ctx.stroke();
      } else if (st === 'stress') {
        ctx.strokeStyle = '#0D1322'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-baseR * 0.55, -baseR * 0.55); ctx.lineTo(baseR * 0.45, 0); ctx.lineTo(-baseR * 0.55, baseR * 0.55); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.arc(0, 0, baseR, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFDF9'; ctx.fill();
        ctx.strokeStyle = '#0D1322'; ctx.lineWidth = 1.65; ctx.stroke();

        const irisR = st === 'shock' ? baseR * 0.36 : baseR * 0.75;
        const ig = ctx.createRadialGradient(0.4, -0.4, 0.5, 0, 0, irisR);
        ig.addColorStop(0, '#0C1226');
        ig.addColorStop(0.56, '#142048');
        ig.addColorStop(0.84, '#FFD426');
        ig.addColorStop(1, '#FFF18A');
        ctx.beginPath(); ctx.arc(0.4, 0, irisR, 0, Math.PI * 2); ctx.fillStyle = ig; ctx.fill();

        if (st === 'hungry') {
          ctx.fillStyle = '#FFF8B4';
          this._star(ctx, 0.7, -0.3, baseR * 0.56);
        } else {
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath(); ctx.arc(baseR * 0.28, -baseR * 0.30, baseR * 0.30, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(-baseR * 0.24, baseR * 0.26, baseR * 0.14, 0, Math.PI * 2); ctx.fill();
        }
        if (st === 'relax') {
          ctx.fillStyle = '#1862F2';
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
      this._star(ctx, pts[0].x + 6, -W * 0.40, 4.5 * pulse);
      this._star(ctx, pts[2].x, W * 0.52, 3.4 * pulse);
    } else if (st === 'shock') {
      ctx.font = 'bold 14px sans-serif';
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2;
      ctx.strokeText('!', pts[0].x + 8, -W * 0.30);
      ctx.fillStyle = '#FF3344'; ctx.fillText('!', pts[0].x + 8, -W * 0.30);
    } else if (st === 'fear' || st === 'stress') {
      ctx.fillStyle = '#7CE4FF'; ctx.strokeStyle = '#1D5486'; ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(pts[1].x + 2, -W * 0.48);
      ctx.quadraticCurveTo(pts[1].x - 5, -W * 0.56, pts[1].x - 8, -W * 0.48);
      ctx.quadraticCurveTo(pts[1].x - 5, -W * 0.40, pts[1].x + 2, -W * 0.48);
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
    const L = Bluetangfish.metadata.baseLength;
    const W = Bluetangfish.metadata.baseWidth;
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
    ctx.fillStyle = 'rgba(8, 20, 46, 0.24)';
    ctx.fill();
    ctx.restore();

    this._drawCanaryWedgeTail(ctx, pts, L, W);
    this._drawPectoralFins(ctx, pts, L, W);

    // Electric-blue oval body
    this._traceBody(ctx, pts, L, W);
    const bg = ctx.createLinearGradient(pts[0].x, -W * 0.55, pts[0].x, W * 0.55);
    bg.addColorStop(0, '#3896FF');
    bg.addColorStop(0.32, '#1562F5');
    bg.addColorStop(0.75, '#0F44C8');
    bg.addColorStop(1, '#082684');
    ctx.fillStyle = bg;
    ctx.fill();

    // Clipped markings & jelly highlight
    ctx.save();
    this._traceBody(ctx, pts, L, W);
    ctx.clip();
    this._drawPaintersPaletteMarkings(ctx, pts, L, W);

    const hl = ctx.createLinearGradient(pts[1].x, -W * 0.3, pts[5].x, W * 0.1);
    hl.addColorStop(0, 'rgba(210, 240, 255, 0.58)');
    hl.addColorStop(0.65, 'rgba(210, 240, 255, 0.14)');
    hl.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = hl;
    ctx.beginPath();
    ctx.ellipse(pts[2].x, pts[2].y - W * 0.12, L * 0.22, W * 0.11, -0.06, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Bold outline
    this._traceBody(ctx, pts, L, W);
    ctx.strokeStyle = '#0D1426';
    ctx.lineWidth = 2.2;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Dorsal crest
    const sway = Math.sin(this.phase - 1.2) * W * 0.08;
    ctx.beginPath();
    ctx.moveTo(pts[2].x, pts[2].y);
    ctx.quadraticCurveTo(pts[4].x, pts[4].y - W * 0.10 + sway, pts[6].x, pts[6].y + sway);
    ctx.quadraticCurveTo(pts[4].x, pts[4].y + W * 0.08 + sway * 0.5, pts[2].x, pts[2].y);
    ctx.fillStyle = '#1458E8';
    ctx.fill();
    ctx.strokeStyle = '#0D1426';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    this._drawEyesAndEmotes(ctx, pts, L, W);
    ctx.restore();
  }
}

export default Bluetangfish;
