/**
 * Mandarinfish ("Mandarin Dragonet") — Standalone 2D Top-Down Expressive Chibi ES Module
 * Dimensions: 60x36 | Category: fish | Zero external dependencies (Canvas 2D API)
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
    waveAmp: 0.09, waveFreq: 3.4, turnBend: 0, finSweep: 0.24, finFreq: 4.5,
    squashX: 1, squashY: 1, mouthOpen: 0, shiver: 0, bobY: 0, eyeScale: 1
  };
  switch (state) {
    case 'breathing':
      pose.waveAmp = 0.05; pose.waveFreq = 2.2;
      pose.squashX = 1 + Math.sin(t * 2.8) * 0.025;
      pose.squashY = 1 - Math.sin(t * 2.8) * 0.025;
      break;
    case 'swimming':
      pose.waveAmp = 0.18; pose.waveFreq = 7.2; pose.finSweep = 0.40; pose.finFreq = 8.4;
      break;
    case 'relax':
      pose.waveAmp = 0.03; pose.waveFreq = 1.4; pose.finSweep = 0.10;
      break;
    case 'left_turn': {
      const env = Math.sin(clamp(p, 0, 1) * Math.PI);
      pose.waveAmp = 0.11; pose.waveFreq = 5.4; pose.turnBend = -0.60 * env;
      break;
    }
    case 'right_turn': {
      const env = Math.sin(clamp(p, 0, 1) * Math.PI);
      pose.waveAmp = 0.11; pose.waveFreq = 5.4; pose.turnBend = 0.60 * env;
      break;
    }
    case 'eating': {
      const ch = Math.max(0, Math.sin(clamp(p, 0, 1) * Math.PI * 3));
      pose.mouthOpen = ch; pose.waveAmp = 0.13; pose.waveFreq = 6.0;
      pose.squashX = 1 + ch * 0.06; pose.squashY = 1 - ch * 0.04;
      break;
    }
    case 'hungry':
      pose.waveAmp = 0.14; pose.waveFreq = 5.6; pose.mouthOpen = Math.max(0, Math.sin(t * 8.4)) * 0.85; pose.eyeScale = 1.12;
      break;
    case 'stress':
      pose.waveAmp = 0.15; pose.waveFreq = 12.2; pose.shiver = 1.2;
      break;
    case 'fear':
      pose.waveAmp = 0.22; pose.waveFreq = 14.5; pose.shiver = 1.9; pose.eyeScale = 1.24;
      break;
    case 'shock': {
      const env = Math.sin(clamp(p, 0, 1) * Math.PI);
      pose.waveAmp = 0.02; pose.shiver = 1.7 * env; pose.eyeScale = 1.34; pose.mouthOpen = 0.9 * env;
      pose.squashX = 0.87 + (1 - env) * 0.13; pose.squashY = 1.15 - (1 - env) * 0.15;
      break;
    }
    case 'happy':
      pose.waveAmp = 0.17; pose.waveFreq = 8.4; pose.finSweep = 0.42; pose.bobY = Math.sin(t * 7.5) * 1.4;
      break;
    case 'sad':
      pose.waveAmp = 0.04; pose.waveFreq = 1.6; pose.finSweep = 0.07;
      break;
  }
  return pose;
}

export class Mandarinfish {
  static metadata = {
    name: 'Mandarin Dragonet',
    category: 'fish',
    baseLength: 60,
    baseWidth: 36
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
    // Chubby tadpole-like chibi dragonet head tapering into slender peduncle
    const count = 8;
    const bodyL = L * 0.74;
    const noseX = L * 0.44;
    const widths = [0.0, 0.34, 0.46, 0.42, 0.32, 0.22, 0.14, 0.08];
    const pts = [];
    for (let i = 0; i < count; i++) {
      const u = i / (count - 1);
      const x = noseX - u * bodyL;
      const wave = Math.sin(this.phase - u * 3.1) * this._pose.waveAmp * L * (0.10 + u * u * 0.88);
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
    ctx.bezierCurveTo(pts[0].x + 2, pts[0].y - W * 0.22, top[0].x + 3, top[0].y - 2, top[0].x, top[0].y);
    for (let i = 0; i < top.length - 1; i++) {
      ctx.quadraticCurveTo(top[i].x, top[i].y, (top[i].x + top[i + 1].x) * 0.5, (top[i].y + top[i + 1].y) * 0.5);
    }
    ctx.lineTo(top[top.length - 1].x, top[top.length - 1].y);
    ctx.lineTo(bot[bot.length - 1].x, bot[bot.length - 1].y);
    for (let i = bot.length - 1; i > 0; i--) {
      ctx.quadraticCurveTo(bot[i].x, bot[i].y, (bot[i].x + bot[i - 1].x) * 0.5, (bot[i].y + bot[i - 1].y) * 0.5);
    }
    ctx.bezierCurveTo(bot[0].x + 3, bot[0].y + 2, pts[0].x + 2, pts[0].y + W * 0.22, pts[0].x, pts[0].y);
    ctx.closePath();
  }

  _drawWideSpottedFanPectorals(ctx, pts, L, W) {
    // Wide translucent cyan/emerald fan pectorals covered in neon blue spots
    const anchor = pts[2];
    const flutter = Math.sin(this.time * this._pose.finFreq) * this._pose.finSweep;

    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(anchor.x, anchor.y + side * pts[2].hw * 0.78);
      ctx.rotate(side * (0.36 + flutter * (side > 0 ? 1 : -0.85)));

      const fL = L * 0.28, fW = W * 0.42;
      const g = ctx.createRadialGradient(0, 0, 1, -fL * 0.3, side * fW * 0.45, fW * 1.1);
      g.addColorStop(0, 'rgba(30, 198, 170, 0.90)');
      g.addColorStop(0.55, 'rgba(26, 148, 255, 0.76)');
      g.addColorStop(1, 'rgba(255, 140, 32, 0.72)');

      ctx.beginPath();
      ctx.moveTo(2, 0);
      ctx.bezierCurveTo(fL * 0.35, side * fW * 0.55, -fL * 0.35, side * fW * 1.18, -fL * 0.98, side * fW * 0.68);
      ctx.bezierCurveTo(-fL * 1.02, side * fW * 0.2, -fL * 0.4, -side * fW * 0.06, 2, 0);
      ctx.closePath();
      ctx.fillStyle = g;
      ctx.fill();

      // Spotted iridescent dots + delicate fin rays
      ctx.save();
      ctx.clip();
      ctx.strokeStyle = 'rgba(200, 255, 245, 0.55)';
      ctx.lineWidth = 0.7;
      for (let r = 0; r < 5; r++) {
        const k = r / 4;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-fL * (0.3 + k * 0.62), side * fW * (0.35 + (1 - k) * 0.58));
        ctx.stroke();
      }
      ctx.fillStyle = '#0D224A';
      for (let d = 0; d < 4; d++) {
        ctx.beginPath();
        ctx.arc(-fL * (0.25 + d * 0.18), side * fW * (0.48 + (d % 2) * 0.22), 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      ctx.strokeStyle = '#0D1C36';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawPsychedelicTail(ctx, pts, L, W) {
    const tail = pts[pts.length - 1];
    const prev = pts[pts.length - 2];
    const dir = Math.atan2(tail.y - prev.y, tail.x - prev.x);
    const wag = Math.sin(this.phase - 3.5) * 0.26 + this._pose.turnBend * 0.38;

    ctx.save();
    ctx.translate(tail.x, tail.y);
    ctx.rotate(dir + wag);

    const tL = L * 0.28, tH = W * 0.36;
    const g = ctx.createLinearGradient(0, 0, tL, 0);
    g.addColorStop(0, '#FF7A1A');
    g.addColorStop(0.55, '#FF4C12');
    g.addColorStop(0.84, '#18A0FF');
    g.addColorStop(1, '#0F4EE0');

    ctx.beginPath();
    ctx.moveTo(0, -W * 0.08);
    ctx.bezierCurveTo(tL * 0.45, -tH * 0.92, tL * 1.05, -tH * 0.85, tL * 1.02, 0);
    ctx.bezierCurveTo(tL * 1.05, tH * 0.85, tL * 0.45, tH * 0.92, 0, W * 0.08);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();

    ctx.strokeStyle = '#0D1C36';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();
  }

  _drawPsychedelicSwirls(ctx, pts, L, W) {
    // Psychedelic navy-outlined electric-blue & emerald swirl ribbons over vibrant orange
    const drawSwirl = (x, y, rx, ry, rot, fill) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.fillStyle = fill;
      ctx.strokeStyle = '#0C1A3A';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    };

    // Flowing S-curve neon-blue stripe down the spine
    ctx.save();
    ctx.strokeStyle = '#0C1A3A';
    ctx.lineWidth = 6.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[1].x + 2, pts[1].y);
    ctx.bezierCurveTo(pts[2].x, pts[2].y - 5, pts[4].x, pts[4].y + 5, pts[6].x, pts[6].y);
    ctx.stroke();

    ctx.strokeStyle = '#18A8FF';
    ctx.lineWidth = 3.6;
    ctx.stroke();
    ctx.restore();

    // Emerald-green & cobalt outlined paisley swirl patches on flanks
    drawSwirl(pts[2].x - 1, pts[2].y - 7, 5.5, 3.0, -0.35, '#1CE09A');
    drawSwirl(pts[2].x - 1, pts[2].y + 7, 5.5, 3.0, 0.35, '#1CE09A');
    drawSwirl(pts[4].x, pts[4].y - 5.5, 4.8, 2.5, 0.3, '#2296FF');
    drawSwirl(pts[4].x, pts[4].y + 5.5, 4.8, 2.5, -0.3, '#2296FF');
    drawSwirl(pts[5].x - 1, pts[5].y, 3.8, 2.2, 0, '#1CE09A');
  }

  _drawEyesAndEmotes(ctx, pts, L, W) {
    const head = pts[1];
    const ex = head.x + 3.5;
    const sep = pts[1].hw * 0.72;
    const baseR = 5.2 * this._pose.eyeScale;
    const st = this.state;

    for (const side of [-1, 1]) {
      const bg = ctx.createRadialGradient(ex - 3.5, head.y + side * (sep + 2.5), 0.4, ex - 3.5, head.y + side * (sep + 2.5), 4.2);
      bg.addColorStop(0, 'rgba(255, 96, 146, 0.65)');
      bg.addColorStop(1, 'rgba(255, 96, 146, 0)');
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.ellipse(ex - 3.5, head.y + side * (sep + 2.5), 3.8, 2.4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this._pose.mouthOpen > 0.05) {
      const m = this._pose.mouthOpen;
      ctx.fillStyle = '#4A1424';
      ctx.beginPath();
      ctx.ellipse(pts[0].x - 0.5, pts[0].y, 1.8 * m + 0.8, 2.2 * m + 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const side of [-1, 1]) {
      const ey = head.y + side * sep;
      ctx.save();
      ctx.translate(ex, ey);
      if (st === 'happy') {
        ctx.strokeStyle = '#0C1A3A'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(0, 0, baseR * 0.78, -Math.PI * 0.42, Math.PI * 0.42); ctx.stroke();
      } else if (st === 'stress') {
        ctx.strokeStyle = '#0C1A3A'; ctx.lineWidth = 2.0; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-baseR * 0.52, -baseR * 0.52); ctx.lineTo(baseR * 0.45, 0); ctx.lineTo(-baseR * 0.52, baseR * 0.52); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.arc(0, 0, baseR, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFDF9'; ctx.fill();
        ctx.strokeStyle = '#0C1A3A'; ctx.lineWidth = 1.5; ctx.stroke();

        // Vivid crimson-orange mandarin iris ring
        const irisR = st === 'shock' ? baseR * 0.36 : baseR * 0.76;
        const ig = ctx.createRadialGradient(0.4, -0.4, 0.5, 0, 0, irisR);
        ig.addColorStop(0, '#0D1326');
        ig.addColorStop(0.55, '#191D3A');
        ig.addColorStop(0.84, '#FF5722');
        ig.addColorStop(1, '#FFB833');
        ctx.beginPath(); ctx.arc(0.4, 0, irisR, 0, Math.PI * 2); ctx.fillStyle = ig; ctx.fill();

        if (st === 'hungry') {
          ctx.fillStyle = '#FFF8B4';
          this._star(ctx, 0.6, -0.3, baseR * 0.55);
        } else {
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath(); ctx.arc(baseR * 0.28, -baseR * 0.30, baseR * 0.30, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(-baseR * 0.24, baseR * 0.26, baseR * 0.14, 0, Math.PI * 2); ctx.fill();
        }
        if (st === 'relax') {
          ctx.fillStyle = '#FF7E1A';
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
      this._star(ctx, pts[0].x + 5, -16, 4.0 * pulse);
      this._star(ctx, pts[2].x, 19, 3.0 * pulse);
    } else if (st === 'shock') {
      ctx.font = 'bold 13px sans-serif';
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2;
      ctx.strokeText('!', pts[0].x + 6, -10);
      ctx.fillStyle = '#FF3344'; ctx.fillText('!', pts[0].x + 6, -10);
    } else if (st === 'fear' || st === 'stress') {
      ctx.fillStyle = '#7CE4FF'; ctx.strokeStyle = '#1D5486'; ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(pts[1].x + 1, -18);
      ctx.quadraticCurveTo(pts[1].x - 4, -22, pts[1].x - 7, -18);
      ctx.quadraticCurveTo(pts[1].x - 4, -14, pts[1].x + 1, -18);
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
    const L = Mandarinfish.metadata.baseLength;
    const W = Mandarinfish.metadata.baseWidth;
    const shX = this._pose.shiver ? Math.sin(this.time * 58) * this._pose.shiver : 0;
    const shY = this._pose.shiver ? Math.cos(this.time * 66) * this._pose.shiver : 0;

    ctx.save();
    ctx.translate(this.x + shX, this.y + this._pose.bobY + shY);
    ctx.rotate(this.angle);
    ctx.scale(this.scale * this._pose.squashX, this.scale * this._pose.squashY);

    const pts = this._buildSpine(L, W);

    // Shadow
    ctx.save();
    ctx.translate(-2, 3.5);
    this._traceBody(ctx, pts, L, W);
    ctx.fillStyle = 'rgba(10, 22, 42, 0.22)';
    ctx.fill();
    ctx.restore();

    this._drawPsychedelicTail(ctx, pts, L, W);
    this._drawWideSpottedFanPectorals(ctx, pts, L, W);

    // Vibrant orange-gold base body
    this._traceBody(ctx, pts, L, W);
    const bg = ctx.createLinearGradient(pts[0].x, -W * 0.5, pts[0].x, W * 0.5);
    bg.addColorStop(0, '#FFA828');
    bg.addColorStop(0.5, '#FF6E14');
    bg.addColorStop(1, '#D84208');
    ctx.fillStyle = bg;
    ctx.fill();

    // Clipped psychedelic swirls + jelly highlight
    ctx.save();
    this._traceBody(ctx, pts, L, W);
    ctx.clip();
    this._drawPsychedelicSwirls(ctx, pts, L, W);

    const hl = ctx.createLinearGradient(pts[1].x, -W * 0.28, pts[4].x, W * 0.08);
    hl.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
    hl.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = hl;
    ctx.beginPath();
    ctx.ellipse(pts[2].x + 1, pts[2].y - W * 0.12, L * 0.20, W * 0.10, -0.06, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Bold outline
    this._traceBody(ctx, pts, L, W);
    ctx.strokeStyle = '#0C1A3A';
    ctx.lineWidth = 2.0;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Flowing emerald-blue dorsal filament
    const sway = Math.sin(this.phase - 1.2) * 3.5;
    ctx.beginPath();
    ctx.moveTo(pts[2].x, pts[2].y);
    ctx.quadraticCurveTo(pts[4].x, pts[4].y - 4 + sway, pts[6].x, pts[6].y + sway);
    ctx.strokeStyle = '#1CE09A';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.stroke();

    this._drawEyesAndEmotes(ctx, pts, L, W);
    ctx.restore();
  }
}

export default Mandarinfish;
