/**
 * Tigersharkfish ("Tiger Shark") — Standalone 2D Top-Down Expressive Chibi ES Module
 * Dimensions: 220x88 | Category: fish | Zero external dependencies (Canvas 2D API)
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
    waveAmp: 0.08, waveFreq: 2.6, turnBend: 0, finSweep: 0.08, finFreq: 2.2,
    squashX: 1, squashY: 1, mouthOpen: 0, shiver: 0, bobY: 0, eyeScale: 1
  };
  switch (state) {
    case 'breathing':
      pose.waveAmp = 0.045; pose.waveFreq = 1.7;
      pose.squashX = 1 + Math.sin(t * 2.1) * 0.015;
      pose.squashY = 1 - Math.sin(t * 2.1) * 0.015;
      break;
    case 'swimming':
      pose.waveAmp = 0.15; pose.waveFreq = 5.2; pose.finSweep = 0.15;
      break;
    case 'relax':
      pose.waveAmp = 0.03; pose.waveFreq = 1.1;
      break;
    case 'left_turn': {
      const env = Math.sin(clamp(p, 0, 1) * Math.PI);
      pose.waveAmp = 0.09; pose.waveFreq = 4.3; pose.turnBend = -0.58 * env;
      break;
    }
    case 'right_turn': {
      const env = Math.sin(clamp(p, 0, 1) * Math.PI);
      pose.waveAmp = 0.09; pose.waveFreq = 4.3; pose.turnBend = 0.58 * env;
      break;
    }
    case 'eating': {
      const ch = Math.max(0, Math.sin(clamp(p, 0, 1) * Math.PI * 3));
      pose.mouthOpen = ch; pose.waveAmp = 0.12; pose.waveFreq = 5.4;
      pose.squashX = 1 + ch * 0.04; pose.squashY = 1 - ch * 0.03;
      break;
    }
    case 'hungry':
      pose.waveAmp = 0.13; pose.waveFreq = 4.5; pose.mouthOpen = Math.max(0, Math.sin(t * 7.0)) * 0.85; pose.eyeScale = 1.12;
      break;
    case 'stress':
      pose.waveAmp = 0.13; pose.waveFreq = 10.4; pose.shiver = 1.8;
      break;
    case 'fear':
      pose.waveAmp = 0.18; pose.waveFreq = 12.4; pose.shiver = 2.5; pose.eyeScale = 1.24;
      break;
    case 'shock': {
      const env = Math.sin(clamp(p, 0, 1) * Math.PI);
      pose.waveAmp = 0.02; pose.shiver = 2.3 * env; pose.eyeScale = 1.34; pose.mouthOpen = 0.9 * env;
      pose.squashX = 0.90 + (1 - env) * 0.10; pose.squashY = 1.12 - (1 - env) * 0.12;
      break;
    }
    case 'happy':
      pose.waveAmp = 0.14; pose.waveFreq = 6.2; pose.bobY = Math.sin(t * 5.8) * 1.8;
      break;
    case 'sad':
      pose.waveAmp = 0.03; pose.waveFreq = 1.3;
      break;
  }
  return pose;
}

export class Tigersharkfish {
  static metadata = {
    name: 'Tiger Shark',
    category: 'fish',
    baseLength: 220,
    baseWidth: 88
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
    // Broad, blunt-snouted muscular tiger shark profile
    const count = 9;
    const bodyL = L * 0.76;
    const noseX = L * 0.45;
    const trunkW = W * 0.56;
    const widths = [0.22, 0.42, 0.49, 0.48, 0.41, 0.30, 0.20, 0.13, 0.08];
    const pts = [];
    for (let i = 0; i < count; i++) {
      const u = i / (count - 1);
      const x = noseX - u * bodyL;
      const wave = Math.sin(this.phase - u * 3.3) * this._pose.waveAmp * L * (0.04 + u * u * 0.92);
      const bend = this._pose.turnBend * trunkW * (u * u * 0.92);
      pts.push({ x, y: wave + bend, hw: widths[i] * trunkW, u });
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
    // Blunt wide rounded tiger-shark snout
    ctx.moveTo(pts[0].x + 8, pts[0].y);
    ctx.bezierCurveTo(pts[0].x + 9, top[0].y, top[0].x + 6, top[0].y, top[0].x, top[0].y);
    for (let i = 0; i < top.length - 1; i++) {
      ctx.quadraticCurveTo(top[i].x, top[i].y, (top[i].x + top[i + 1].x) * 0.5, (top[i].y + top[i + 1].y) * 0.5);
    }
    ctx.lineTo(top[top.length - 1].x, top[top.length - 1].y);
    ctx.lineTo(bot[bot.length - 1].x, bot[bot.length - 1].y);
    for (let i = bot.length - 1; i > 0; i--) {
      ctx.quadraticCurveTo(bot[i].x, bot[i].y, (bot[i].x + bot[i - 1].x) * 0.5, (bot[i].y + bot[i - 1].y) * 0.5);
    }
    ctx.bezierCurveTo(bot[0].x + 6, bot[0].y, pts[0].x + 9, bot[0].y, pts[0].x + 8, pts[0].y);
    ctx.closePath();
  }

  _drawPectorals(ctx, pts, L, W) {
    const pAnchor = pts[3];
    const sweep = Math.sin(this.time * this._pose.finFreq) * this._pose.finSweep;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(pAnchor.x + 6, pAnchor.y + side * pts[3].hw * 0.78);
      ctx.rotate(side * sweep * 0.45);
      const g = ctx.createLinearGradient(0, 0, -L * 0.16, side * W * 0.40);
      g.addColorStop(0, '#7B7465');
      g.addColorStop(1, '#4C463B');
      ctx.beginPath();
      ctx.moveTo(12, -side * 3);
      ctx.bezierCurveTo(4, side * W * 0.22, -L * 0.08, side * W * 0.42, -L * 0.19, side * W * 0.40);
      ctx.quadraticCurveTo(-L * 0.11, side * W * 0.16, -L * 0.15, -side * 3);
      ctx.closePath();
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = '#1E1B16';
      ctx.lineWidth = 2.3;
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawCrescentTail(ctx, pts, L, W) {
    const tail = pts[pts.length - 1];
    const prev = pts[pts.length - 2];
    const dir = Math.atan2(tail.y - prev.y, tail.x - prev.x);
    const wag = Math.sin(this.phase - 3.6) * 0.28 + this._pose.turnBend * 0.42;

    ctx.save();
    ctx.translate(tail.x, tail.y);
    ctx.rotate(dir + wag);

    const tL = L * 0.26, tH = W * 0.44;
    const g = ctx.createLinearGradient(0, 0, tL, 0);
    g.addColorStop(0, '#7B7465');
    g.addColorStop(1, '#3D382E');

    ctx.beginPath();
    ctx.moveTo(-2, -5);
    ctx.bezierCurveTo(tL * 0.35, -tH * 0.74, tL * 0.85, -tH * 1.08, tL * 1.15, -tH * 0.94);
    ctx.quadraticCurveTo(tL * 0.44, 0, tL * 0.84, tH * 0.74);
    ctx.bezierCurveTo(tL * 0.58, tH * 0.82, tL * 0.26, tH * 0.54, -2, 5);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = '#1E1B16';
    ctx.lineWidth = 2.3;
    ctx.stroke();
    ctx.restore();
  }

  _drawTigerStripesAndSpots(ctx, pts, L, W) {
    // Bold dark vertical tiger stripes & spots along flanks
    ctx.save();
    ctx.fillStyle = '#2B2822';
    for (let i = 2; i < pts.length - 1; i++) {
      const p = pts[i];
      const hw = p.hw;
      // Alternating tiger bars tapering toward midline
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(p.x + 5, p.y + side * (hw * 1.05));
        ctx.quadraticCurveTo(p.x - 1, p.y + side * (hw * 0.45), p.x - 4, p.y + side * (hw * 0.14));
        ctx.quadraticCurveTo(p.x - 6, p.y + side * (hw * 0.45), p.x - 3, p.y + side * (hw * 1.05));
        ctx.closePath();
        ctx.fill();

        // Companion dark tiger spots between stripes
        ctx.beginPath();
        ctx.ellipse(p.x + 9, p.y + side * (hw * 0.58), 3.6, 2.2, side * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  _drawEyesAndEmotes(ctx, pts, L, W) {
    const head = pts[1];
    const ex = head.x + 6;
    const sep = pts[1].hw * 0.74;
    const baseR = 7.0 * this._pose.eyeScale;
    const st = this.state;

    // Wide blunt snout nostrils
    for (const side of [-1, 1]) {
      ctx.fillStyle = '#1E1B16';
      ctx.beginPath();
      ctx.ellipse(pts[0].x + 2, pts[0].y + side * 8.5, 2.6, 1.5, side * 0.25, 0, Math.PI * 2);
      ctx.fill();
    }

    // Rosy blushes
    for (const side of [-1, 1]) {
      const bg = ctx.createRadialGradient(ex - 7, head.y + side * (sep + 3.5), 0.8, ex - 7, head.y + side * (sep + 3.5), 7.0);
      bg.addColorStop(0, 'rgba(255, 118, 148, 0.56)');
      bg.addColorStop(1, 'rgba(255, 118, 148, 0)');
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.ellipse(ex - 7, head.y + side * (sep + 3.5), 6.5, 4.0, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this._pose.mouthOpen > 0.05) {
      const m = this._pose.mouthOpen;
      ctx.fillStyle = '#521522';
      ctx.beginPath();
      ctx.ellipse(pts[0].x + 5, pts[0].y, 4.0 * m + 1.5, 7.0 * m + 1.8, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const side of [-1, 1]) {
      const ey = head.y + side * sep;
      ctx.save();
      ctx.translate(ex, ey);
      if (st === 'happy') {
        ctx.strokeStyle = '#1E1B16'; ctx.lineWidth = 2.8; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(0, 0, baseR * 0.78, -Math.PI * 0.42, Math.PI * 0.42); ctx.stroke();
      } else if (st === 'stress') {
        ctx.strokeStyle = '#1E1B16'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-baseR * 0.55, -baseR * 0.55); ctx.lineTo(baseR * 0.45, 0); ctx.lineTo(-baseR * 0.55, baseR * 0.55); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.arc(0, 0, baseR, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFDF9'; ctx.fill();
        ctx.strokeStyle = '#1E1B16'; ctx.lineWidth = 2.0; ctx.stroke();

        const irisR = st === 'shock' ? baseR * 0.35 : baseR * 0.76;
        const ig = ctx.createRadialGradient(0.5, -0.5, 0.7, 0, 0, irisR);
        ig.addColorStop(0, '#12100C');
        ig.addColorStop(0.58, '#262018');
        ig.addColorStop(0.86, '#F5B82E');
        ig.addColorStop(1, '#FFF098');
        ctx.beginPath(); ctx.arc(0.5, 0, irisR, 0, Math.PI * 2); ctx.fillStyle = ig; ctx.fill();

        if (st === 'hungry') {
          ctx.fillStyle = '#FFF8B4';
          this._star(ctx, 0.9, -0.3, baseR * 0.55);
        } else {
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath(); ctx.arc(baseR * 0.28, -baseR * 0.30, baseR * 0.30, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(-baseR * 0.24, baseR * 0.26, baseR * 0.14, 0, Math.PI * 2); ctx.fill();
        }
        if (st === 'relax') {
          ctx.fillStyle = '#7B7465';
          ctx.beginPath(); ctx.arc(0, 0, baseR + 0.4, Math.PI * 0.65, Math.PI * 1.35); ctx.closePath(); ctx.fill();
        } else if (st === 'sad' || st === 'fear') {
          ctx.fillStyle = 'rgba(130, 232, 255, 0.88)';
          ctx.beginPath(); ctx.ellipse(-baseR * 0.3, side * baseR * 0.45, baseR * 0.38, baseR * 0.24, 0.25, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.restore();
    }

    if (st === 'happy') {
      const pulse = 0.8 + Math.sin(this.time * 8) * 0.25;
      ctx.fillStyle = '#FFE45E';
      this._star(ctx, pts[0].x + 14, -26, 6.5 * pulse);
      this._star(ctx, pts[2].x, 34, 5.2 * pulse);
    } else if (st === 'shock') {
      ctx.font = 'bold 20px sans-serif';
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 3;
      ctx.strokeText('!', pts[0].x + 16, -16);
      ctx.fillStyle = '#FF3344'; ctx.fillText('!', pts[0].x + 16, -16);
    } else if (st === 'fear' || st === 'stress') {
      ctx.fillStyle = '#7CE4FF'; ctx.strokeStyle = '#1D5486'; ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(pts[1].x + 4, -32);
      ctx.quadraticCurveTo(pts[1].x - 8, -38, pts[1].x - 13, -32);
      ctx.quadraticCurveTo(pts[1].x - 8, -26, pts[1].x + 4, -32);
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
    const L = Tigersharkfish.metadata.baseLength;
    const W = Tigersharkfish.metadata.baseWidth;
    const shX = this._pose.shiver ? Math.sin(this.time * 58) * this._pose.shiver : 0;
    const shY = this._pose.shiver ? Math.cos(this.time * 66) * this._pose.shiver : 0;

    ctx.save();
    ctx.translate(this.x + shX, this.y + this._pose.bobY + shY);
    ctx.rotate(this.angle);
    ctx.scale(this.scale * this._pose.squashX, this.scale * this._pose.squashY);

    const pts = this._buildSpine(L, W);

    // Shadow
    ctx.save();
    ctx.translate(-4, 6);
    this._traceBody(ctx, pts, L, W);
    ctx.fillStyle = 'rgba(18, 16, 12, 0.24)';
    ctx.fill();
    ctx.restore();

    this._drawCrescentTail(ctx, pts, L, W);
    this._drawPectorals(ctx, pts, L, W);

    // Muscular grey-brown tiger shark body
    this._traceBody(ctx, pts, L, W);
    const bg = ctx.createLinearGradient(pts[0].x, -W * 0.32, pts[0].x, W * 0.32);
    bg.addColorStop(0, '#A59E8E');
    bg.addColorStop(0.32, '#7D7666');
    bg.addColorStop(0.75, '#625C4F');
    bg.addColorStop(1, '#433E35');
    ctx.fillStyle = bg;
    ctx.fill();

    // Clipped tiger stripes + spots + glossy highlight
    ctx.save();
    this._traceBody(ctx, pts, L, W);
    ctx.clip();
    this._drawTigerStripesAndSpots(ctx, pts, L, W);

    const hl = ctx.createLinearGradient(pts[1].x, -16, pts[6].x, 8);
    hl.addColorStop(0, 'rgba(255, 250, 235, 0.42)');
    hl.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = hl;
    ctx.beginPath();
    ctx.ellipse(pts[3].x + 4, pts[3].y - 8, L * 0.22, 8.5, -0.04, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    this._traceBody(ctx, pts, L, W);
    ctx.strokeStyle = '#1E1B16';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // 5 gill slits per side
    ctx.strokeStyle = '#2B261E';
    ctx.lineWidth = 1.7;
    for (const side of [-1, 1]) {
      for (let g = 0; g < 5; g++) {
        const gx = pts[2].x + 10 - g * 4.8;
        const gy = pts[2].y + side * (pts[2].hw * 0.80);
        ctx.beginPath();
        ctx.moveTo(gx, gy - side * 4);
        ctx.lineTo(gx - 2, gy + side * 4);
        ctx.stroke();
      }
    }

    // Swept dorsal fin
    const sway = Math.sin(this.phase - 1.5) * 6.5;
    ctx.beginPath();
    ctx.moveTo(pts[3].x + 10, pts[3].y);
    ctx.bezierCurveTo(pts[4].x + 4, pts[4].y - 10 + sway, pts[5].x - 6, pts[5].y - 12 + sway * 1.2, pts[5].x - 16, pts[5].y + sway);
    ctx.bezierCurveTo(pts[4].x - 2, pts[4].y + 8 + sway * 0.4, pts[3].x, pts[3].y + 6, pts[3].x + 10, pts[3].y);
    ctx.closePath();
    ctx.fillStyle = '#565045';
    ctx.fill();
    ctx.strokeStyle = '#1E1B16';
    ctx.lineWidth = 2.0;
    ctx.stroke();

    this._drawEyesAndEmotes(ctx, pts, L, W);
    ctx.restore();
  }
}

export default Tigersharkfish;
