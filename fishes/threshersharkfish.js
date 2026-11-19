/**
 * Threshersharkfish ("Pelagic Thresher Shark") — Standalone 2D Top-Down Expressive Chibi ES Module
 * Dimensions: 215x76 | Category: fish | Zero external dependencies (Canvas 2D API)
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
    waveAmp: 0.09, waveFreq: 2.9, turnBend: 0, finSweep: 0.09, finFreq: 2.4, whipAmp: 1.0,
    squashX: 1, squashY: 1, mouthOpen: 0, shiver: 0, bobY: 0, eyeScale: 1
  };
  switch (state) {
    case 'breathing':
      pose.waveAmp = 0.05; pose.waveFreq = 1.9; pose.whipAmp = 0.65;
      pose.squashX = 1 + Math.sin(t * 2.2) * 0.015;
      pose.squashY = 1 - Math.sin(t * 2.2) * 0.015;
      break;
    case 'swimming':
      pose.waveAmp = 0.17; pose.waveFreq = 5.8; pose.finSweep = 0.16; pose.whipAmp = 1.45;
      break;
    case 'relax':
      pose.waveAmp = 0.03; pose.waveFreq = 1.2; pose.whipAmp = 0.45;
      break;
    case 'left_turn': {
      const env = Math.sin(clamp(p, 0, 1) * Math.PI);
      pose.waveAmp = 0.10; pose.waveFreq = 4.8; pose.turnBend = -0.62 * env; pose.whipAmp = 1.35;
      break;
    }
    case 'right_turn': {
      const env = Math.sin(clamp(p, 0, 1) * Math.PI);
      pose.waveAmp = 0.10; pose.waveFreq = 4.8; pose.turnBend = 0.62 * env; pose.whipAmp = 1.35;
      break;
    }
    case 'eating': {
      const ch = Math.max(0, Math.sin(clamp(p, 0, 1) * Math.PI * 3));
      pose.mouthOpen = ch; pose.waveAmp = 0.13; pose.waveFreq = 5.6; pose.whipAmp = 1.5;
      pose.squashX = 1 + ch * 0.04; pose.squashY = 1 - ch * 0.03;
      break;
    }
    case 'hungry':
      pose.waveAmp = 0.14; pose.waveFreq = 4.8; pose.mouthOpen = Math.max(0, Math.sin(t * 7.5)) * 0.85; pose.eyeScale = 1.12;
      break;
    case 'stress':
      pose.waveAmp = 0.14; pose.waveFreq = 11.0; pose.shiver = 1.6;
      break;
    case 'fear':
      pose.waveAmp = 0.20; pose.waveFreq = 13.0; pose.shiver = 2.4; pose.eyeScale = 1.24; pose.whipAmp = 1.55;
      break;
    case 'shock': {
      const env = Math.sin(clamp(p, 0, 1) * Math.PI);
      pose.waveAmp = 0.02; pose.shiver = 2.2 * env; pose.eyeScale = 1.34; pose.mouthOpen = 0.9 * env;
      pose.squashX = 0.90 + (1 - env) * 0.10; pose.squashY = 1.12 - (1 - env) * 0.12;
      break;
    }
    case 'happy':
      pose.waveAmp = 0.15; pose.waveFreq = 6.6; pose.bobY = Math.sin(t * 6.2) * 1.6; pose.whipAmp = 1.35;
      break;
    case 'sad':
      pose.waveAmp = 0.03; pose.waveFreq = 1.3; pose.whipAmp = 0.45;
      break;
  }
  return pose;
}

export class Threshersharkfish {
  static metadata = {
    name: 'Pelagic Thresher Shark',
    category: 'fish',
    baseLength: 215,
    baseWidth: 76
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
    // Sleek compact metallic-blue shark body (front 52% of L) leaving 48% for dramatic whip tail!
    const count = 8;
    const bodyL = L * 0.52;
    const noseX = L * 0.48;
    const trunkW = W * 0.52;
    const widths = [0.0, 0.30, 0.45, 0.46, 0.38, 0.27, 0.17, 0.09];
    const pts = [];
    for (let i = 0; i < count; i++) {
      const u = i / (count - 1);
      const x = noseX - u * bodyL;
      const wave = Math.sin(this.phase - u * 2.8) * this._pose.waveAmp * L * (0.04 + u * u * 0.72);
      const bend = this._pose.turnBend * trunkW * (u * u * 0.85);
      pts.push({ x, y: wave + bend, hw: widths[i] * trunkW, u });
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
    ctx.bezierCurveTo(pts[0].x - 1, pts[0].y - W * 0.12, top[0].x + 8, top[0].y - 2, top[0].x, top[0].y);
    for (let i = 0; i < top.length - 1; i++) {
      ctx.quadraticCurveTo(top[i].x, top[i].y, (top[i].x + top[i + 1].x) * 0.5, (top[i].y + top[i + 1].y) * 0.5);
    }
    ctx.lineTo(top[top.length - 1].x, top[top.length - 1].y);
    ctx.lineTo(bot[bot.length - 1].x, bot[bot.length - 1].y);
    for (let i = bot.length - 1; i > 0; i--) {
      ctx.quadraticCurveTo(bot[i].x, bot[i].y, (bot[i].x + bot[i - 1].x) * 0.5, (bot[i].y + bot[i - 1].y) * 0.5);
    }
    ctx.bezierCurveTo(bot[0].x + 8, bot[0].y + 2, pts[0].x - 1, pts[0].y + W * 0.12, pts[0].x, pts[0].y);
    ctx.closePath();
  }

  _drawDramaticWhipTail(ctx, pts, L, W) {
    // Signature extra-long scythe/whip upper tail lobe that curves dramatically during swimming!
    const tail = pts[pts.length - 1];
    const prev = pts[pts.length - 2];
    const dir = Math.atan2(tail.y - prev.y, tail.x - prev.x);

    ctx.save();
    ctx.translate(tail.x, tail.y);
    ctx.rotate(dir);

    const whipL = L * 0.52;
    const amp = this._pose.whipAmp;
    const w1 = Math.sin(this.phase - 3.2) * 16 * amp + this._pose.turnBend * 18;
    const w2 = Math.sin(this.phase - 4.8) * 32 * amp + this._pose.turnBend * 34;
    const w3 = Math.sin(this.phase - 6.2) * 42 * amp + this._pose.turnBend * 44;

    const grad = ctx.createLinearGradient(0, 0, whipL, w3);
    grad.addColorStop(0, '#3C7EC4');
    grad.addColorStop(0.55, '#245A9E');
    grad.addColorStop(1, '#15376B');

    // Short lower lobe + extra-long curving whip upper lobe
    ctx.beginPath();
    ctx.moveTo(-2, -4);
    ctx.bezierCurveTo(whipL * 0.25, -14 + w1 * 0.7, whipL * 0.65, -18 + w2, whipL, -4 + w3);
    ctx.bezierCurveTo(whipL * 0.68, -2 + w2 * 0.9, whipL * 0.30, 3 + w1 * 0.5, whipL * 0.14, 7 + w1 * 0.2);
    // Compact lower ventral lobe
    ctx.quadraticCurveTo(whipL * 0.26, 20 + w1 * 0.3, whipL * 0.22, 24 + w1 * 0.3);
    ctx.quadraticCurveTo(whipL * 0.08, 16, -2, 4);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Metallic blue specular rib along whip
    ctx.strokeStyle = 'rgba(175, 228, 255, 0.55)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(2, -1);
    ctx.bezierCurveTo(whipL * 0.28, -8 + w1 * 0.7, whipL * 0.66, -11 + w2, whipL * 0.94, -4 + w3);
    ctx.stroke();

    ctx.strokeStyle = '#10223E';
    ctx.lineWidth = 2.1;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  _drawLongPectoralWings(ctx, pts, L, W) {
    // Long curved pelagic pectoral wings
    const pAnchor = pts[2];
    const sweep = Math.sin(this.time * this._pose.finFreq) * this._pose.finSweep;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(pAnchor.x + 2, pAnchor.y + side * pts[2].hw * 0.76);
      ctx.rotate(side * sweep * 0.45);
      const g = ctx.createLinearGradient(0, 0, -L * 0.16, side * W * 0.44);
      g.addColorStop(0, '#448AE0');
      g.addColorStop(1, '#1B4682');
      ctx.beginPath();
      ctx.moveTo(8, -side * 3);
      ctx.bezierCurveTo(4, side * W * 0.24, -L * 0.06, side * W * 0.44, -L * 0.18, side * W * 0.42);
      ctx.quadraticCurveTo(-L * 0.10, side * W * 0.18, -L * 0.12, -side * 3);
      ctx.closePath();
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = '#10223E';
      ctx.lineWidth = 2.1;
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawEyesAndEmotes(ctx, pts, L, W) {
    // Thresher sharks are famous for their huge adorable dark pelagic eyes!
    const head = pts[1];
    const ex = head.x + 6;
    const sep = pts[1].hw * 0.72;
    const baseR = 6.8 * this._pose.eyeScale;
    const st = this.state;

    for (const side of [-1, 1]) {
      const bg = ctx.createRadialGradient(ex - 6, head.y + side * (sep + 3), 0.6, ex - 6, head.y + side * (sep + 3), 6);
      bg.addColorStop(0, 'rgba(255, 118, 152, 0.58)');
      bg.addColorStop(1, 'rgba(255, 118, 152, 0)');
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.ellipse(ex - 6, head.y + side * (sep + 3), 5.6, 3.4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this._pose.mouthOpen > 0.05) {
      const m = this._pose.mouthOpen;
      ctx.fillStyle = '#4B1424';
      ctx.beginPath();
      ctx.ellipse(pts[0].x - 3, pts[0].y, 3.0 * m + 1.2, 4.5 * m + 1.2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const side of [-1, 1]) {
      const ey = head.y + side * sep;
      ctx.save();
      ctx.translate(ex, ey);
      if (st === 'happy') {
        ctx.strokeStyle = '#10223E'; ctx.lineWidth = 2.8; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(0, 0, baseR * 0.78, -Math.PI * 0.42, Math.PI * 0.42); ctx.stroke();
      } else if (st === 'stress') {
        ctx.strokeStyle = '#10223E'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-baseR * 0.55, -baseR * 0.55); ctx.lineTo(baseR * 0.45, 0); ctx.lineTo(-baseR * 0.55, baseR * 0.55); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.arc(0, 0, baseR, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFDF9'; ctx.fill();
        ctx.strokeStyle = '#10223E'; ctx.lineWidth = 1.9; ctx.stroke();

        const irisR = st === 'shock' ? baseR * 0.35 : baseR * 0.78;
        const ig = ctx.createRadialGradient(0.5, -0.5, 0.7, 0, 0, irisR);
        ig.addColorStop(0, '#08142A');
        ig.addColorStop(0.55, '#102854');
        ig.addColorStop(0.84, '#44C8FF');
        ig.addColorStop(1, '#B4F0FF');
        ctx.beginPath(); ctx.arc(0.5, 0, irisR, 0, Math.PI * 2); ctx.fillStyle = ig; ctx.fill();

        if (st === 'hungry') {
          ctx.fillStyle = '#FFF8B4';
          this._star(ctx, 0.9, -0.3, baseR * 0.55);
        } else {
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath(); ctx.arc(baseR * 0.28, -baseR * 0.30, baseR * 0.32, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(-baseR * 0.24, baseR * 0.26, baseR * 0.14, 0, Math.PI * 2); ctx.fill();
        }
        if (st === 'relax') {
          ctx.fillStyle = '#3678C4';
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
      this._star(ctx, pts[0].x + 10, -22, 6.0 * pulse);
      this._star(ctx, pts[2].x, 28, 4.8 * pulse);
    } else if (st === 'shock') {
      ctx.font = 'bold 18px sans-serif';
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2.6;
      ctx.strokeText('!', pts[0].x + 12, -14);
      ctx.fillStyle = '#FF3344'; ctx.fillText('!', pts[0].x + 12, -14);
    } else if (st === 'fear' || st === 'stress') {
      ctx.fillStyle = '#7CE4FF'; ctx.strokeStyle = '#1D5486'; ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(pts[1].x + 3, -26);
      ctx.quadraticCurveTo(pts[1].x - 7, -32, pts[1].x - 11, -26);
      ctx.quadraticCurveTo(pts[1].x - 7, -20, pts[1].x + 3, -26);
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
    const L = Threshersharkfish.metadata.baseLength;
    const W = Threshersharkfish.metadata.baseWidth;
    const shX = this._pose.shiver ? Math.sin(this.time * 58) * this._pose.shiver : 0;
    const shY = this._pose.shiver ? Math.cos(this.time * 66) * this._pose.shiver : 0;

    ctx.save();
    ctx.translate(this.x + shX, this.y + this._pose.bobY + shY);
    ctx.rotate(this.angle);
    ctx.scale(this.scale * this._pose.squashX, this.scale * this._pose.squashY);

    const pts = this._buildSpine(L, W);

    // Shadow
    ctx.save();
    ctx.translate(-3, 5);
    this._traceBody(ctx, pts, L, W);
    ctx.fillStyle = 'rgba(8, 22, 46, 0.24)';
    ctx.fill();
    ctx.restore();

    this._drawDramaticWhipTail(ctx, pts, L, W);
    this._drawLongPectoralWings(ctx, pts, L, W);

    // Sleek metallic-blue shark body
    this._traceBody(ctx, pts, L, W);
    const bg = ctx.createLinearGradient(pts[0].x, -W * 0.3, pts[0].x, W * 0.3);
    bg.addColorStop(0, '#72B8FF');
    bg.addColorStop(0.32, '#347AD6');
    bg.addColorStop(0.75, '#2056A4');
    bg.addColorStop(1, '#123468');
    ctx.fillStyle = bg;
    ctx.fill();

    // Clipped silver belly edge + glossy pelagic highlight
    ctx.save();
    this._traceBody(ctx, pts, L, W);
    ctx.clip();
    ctx.strokeStyle = 'rgba(220, 242, 255, 0.65)';
    ctx.lineWidth = 6.0;
    this._traceBody(ctx, pts, L, W);
    ctx.stroke();

    const hl = ctx.createLinearGradient(pts[1].x, -12, pts[5].x, 6);
    hl.addColorStop(0, 'rgba(235, 250, 255, 0.56)');
    hl.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = hl;
    ctx.beginPath();
    ctx.ellipse(pts[3].x + 2, pts[3].y - 6, L * 0.16, 6.5, -0.04, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    this._traceBody(ctx, pts, L, W);
    ctx.strokeStyle = '#10223E';
    ctx.lineWidth = 2.3;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // 5 gill slits
    ctx.strokeStyle = '#10223E';
    ctx.lineWidth = 1.5;
    for (const side of [-1, 1]) {
      for (let g = 0; g < 5; g++) {
        const gx = pts[2].x + 8 - g * 3.8;
        const gy = pts[2].y + side * (pts[2].hw * 0.78);
        ctx.beginPath();
        ctx.moveTo(gx, gy - side * 3);
        ctx.lineTo(gx - 1.5, gy + side * 3);
        ctx.stroke();
      }
    }

    // Tall pelagic dorsal fin
    const sway = Math.sin(this.phase - 1.4) * 5.5;
    ctx.beginPath();
    ctx.moveTo(pts[3].x + 8, pts[3].y);
    ctx.bezierCurveTo(pts[4].x + 2, pts[4].y - 9 + sway, pts[5].x - 5, pts[5].y - 10 + sway * 1.2, pts[5].x - 14, pts[5].y + sway);
    ctx.bezierCurveTo(pts[4].x - 2, pts[4].y + 7 + sway * 0.4, pts[3].x, pts[3].y + 5, pts[3].x + 8, pts[3].y);
    ctx.closePath();
    ctx.fillStyle = '#245A9E';
    ctx.fill();
    ctx.strokeStyle = '#10223E';
    ctx.lineWidth = 1.9;
    ctx.stroke();

    this._drawEyesAndEmotes(ctx, pts, L, W);
    ctx.restore();
  }
}

export default Threshersharkfish;
