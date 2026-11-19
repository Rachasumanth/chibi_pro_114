/**
 * Barracudafish ("Great Barracuda") — Standalone 2D Top-Down Expressive Chibi ES Module
 * Dimensions: 160x38 | Category: fish | Zero external dependencies (Canvas 2D API)
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
    waveAmp: 0.08, waveFreq: 3.4, turnBend: 0, finSweep: 0.16, finFreq: 3.6,
    squashX: 1, squashY: 1, mouthOpen: 0, shiver: 0, bobY: 0, eyeScale: 1
  };
  switch (state) {
    case 'breathing':
      pose.waveAmp = 0.04; pose.waveFreq = 2.0;
      pose.squashX = 1 + Math.sin(t * 2.4) * 0.015;
      pose.squashY = 1 - Math.sin(t * 2.4) * 0.015;
      break;
    case 'swimming':
      pose.waveAmp = 0.16; pose.waveFreq = 7.4; pose.finSweep = 0.28;
      break;
    case 'relax':
      pose.waveAmp = 0.025; pose.waveFreq = 1.2; pose.finSweep = 0.06;
      break;
    case 'left_turn': {
      const env = Math.sin(clamp(p, 0, 1) * Math.PI);
      pose.waveAmp = 0.10; pose.waveFreq = 5.4; pose.turnBend = -0.62 * env;
      break;
    }
    case 'right_turn': {
      const env = Math.sin(clamp(p, 0, 1) * Math.PI);
      pose.waveAmp = 0.10; pose.waveFreq = 5.4; pose.turnBend = 0.62 * env;
      break;
    }
    case 'eating': {
      const ch = Math.max(0, Math.sin(clamp(p, 0, 1) * Math.PI * 3));
      pose.mouthOpen = ch; pose.waveAmp = 0.13; pose.waveFreq = 6.6;
      pose.squashX = 1 + ch * 0.05; pose.squashY = 1 - ch * 0.03;
      break;
    }
    case 'hungry':
      pose.waveAmp = 0.13; pose.waveFreq = 5.4; pose.mouthOpen = Math.max(0, Math.sin(t * 8.2)) * 0.9; pose.eyeScale = 1.12;
      break;
    case 'stress':
      pose.waveAmp = 0.14; pose.waveFreq = 12.0; pose.shiver = 1.4;
      break;
    case 'fear':
      pose.waveAmp = 0.20; pose.waveFreq = 14.0; pose.shiver = 2.2; pose.eyeScale = 1.24;
      break;
    case 'shock': {
      const env = Math.sin(clamp(p, 0, 1) * Math.PI);
      pose.waveAmp = 0.02; pose.shiver = 2.0 * env; pose.eyeScale = 1.34; pose.mouthOpen = 0.95 * env;
      pose.squashX = 0.90 + (1 - env) * 0.10; pose.squashY = 1.14 - (1 - env) * 0.14;
      break;
    }
    case 'happy':
      pose.waveAmp = 0.15; pose.waveFreq = 7.6; pose.finSweep = 0.30; pose.bobY = Math.sin(t * 7.0) * 1.4;
      break;
    case 'sad':
      pose.waveAmp = 0.03; pose.waveFreq = 1.4; pose.finSweep = 0.06;
      break;
  }
  return pose;
}

export class Barracudafish {
  static metadata = {
    name: 'Great Barracuda',
    category: 'fish',
    baseLength: 160,
    baseWidth: 38
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
    // Ultra-slim gleaming silver needle torpedo
    const count = 10;
    const bodyL = L * 0.78;
    const noseX = L * 0.44;
    const trunkW = W * 0.54;
    const widths = [0.08, 0.24, 0.40, 0.46, 0.45, 0.40, 0.32, 0.24, 0.16, 0.10];
    const pts = [];
    for (let i = 0; i < count; i++) {
      const u = i / (count - 1);
      const x = noseX - u * bodyL;
      const wave = Math.sin(this.phase - u * 3.6) * this._pose.waveAmp * L * (0.04 + u * u * 0.90);
      const bend = this._pose.turnBend * trunkW * (u * u * 0.95);
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
    ctx.moveTo(pts[0].x + 5, pts[0].y);
    ctx.lineTo(top[0].x, top[0].y);
    for (let i = 0; i < top.length - 1; i++) {
      ctx.quadraticCurveTo(top[i].x, top[i].y, (top[i].x + top[i + 1].x) * 0.5, (top[i].y + top[i + 1].y) * 0.5);
    }
    ctx.lineTo(top[top.length - 1].x, top[top.length - 1].y);
    ctx.lineTo(bot[bot.length - 1].x, bot[bot.length - 1].y);
    for (let i = bot.length - 1; i > 0; i--) {
      ctx.quadraticCurveTo(bot[i].x, bot[i].y, (bot[i].x + bot[i - 1].x) * 0.5, (bot[i].y + bot[i - 1].y) * 0.5);
    }
    ctx.lineTo(bot[0].x, bot[0].y);
    ctx.closePath();
  }

  _drawUnderslungToothyJaw(ctx, pts, L, W) {
    // Prominent underslung lower jaw protruding ahead of snout with crisp cartoon fangs
    const nose = pts[0];
    const open = this._pose.mouthOpen;
    const jawLen = 9 + open * 3.5;

    ctx.save();
    ctx.translate(nose.x + 2, nose.y);

    // Lower jaw silhouette
    ctx.fillStyle = '#DCE8F5';
    ctx.strokeStyle = '#182436';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-4, -4.2);
    ctx.quadraticCurveTo(jawLen, -3.5, jawLen + 2, 0);
    ctx.quadraticCurveTo(jawLen, 3.5, -4, 4.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Crisp gleaming white fang-like teeth peeking along jaw rim
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#182436';
    ctx.lineWidth = 0.9;
    for (const side of [-1, 1]) {
      for (let t = 0; t < 3; t++) {
        const tx = 0.5 + t * 3.2;
        ctx.beginPath();
        ctx.moveTo(tx - 1.1, side * 2.8);
        ctx.lineTo(tx, side * (5.2 + open * 1.4));
        ctx.lineTo(tx + 1.1, side * 2.8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  _drawRearSetFins(ctx, pts, L, W) {
    // Sleek pectorals + signature rear-set pelvic & second dorsal fins
    const flutter = Math.sin(this.time * this._pose.finFreq) * this._pose.finSweep;

    // Pectoral fins
    const pAnchor = pts[3];
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(pAnchor.x, pAnchor.y + side * pts[3].hw * 0.84);
      ctx.rotate(side * (0.48 + flutter * (side > 0 ? 1 : -0.85)));
      ctx.fillStyle = 'rgba(176, 202, 228, 0.85)';
      ctx.beginPath();
      ctx.moveTo(2, 0);
      ctx.lineTo(-14, side * 12);
      ctx.quadraticCurveTo(-18, side * 4, -10, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#182436';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    // Rear-set pelvic fins
    const rAnchor = pts[7];
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(rAnchor.x, rAnchor.y + side * pts[7].hw * 0.85);
      ctx.fillStyle = 'rgba(142, 168, 198, 0.88)';
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.lineTo(-10, side * 10);
      ctx.quadraticCurveTo(-12, side * 3, -8, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#182436';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawForkedTail(ctx, pts, L, W) {
    const tail = pts[pts.length - 1];
    const prev = pts[pts.length - 2];
    const dir = Math.atan2(tail.y - prev.y, tail.x - prev.x);
    const wag = Math.sin(this.phase - 4.0) * 0.28 + this._pose.turnBend * 0.42;

    ctx.save();
    ctx.translate(tail.x, tail.y);
    ctx.rotate(dir + wag);

    const tL = L * 0.20, tH = W * 0.46;
    const g = ctx.createLinearGradient(0, 0, tL, 0);
    g.addColorStop(0, '#7890AC');
    g.addColorStop(0.65, '#465D78');
    g.addColorStop(1, '#223248');

    ctx.beginPath();
    ctx.moveTo(-2, -3);
    ctx.lineTo(tL, -tH);
    ctx.quadraticCurveTo(tL * 0.42, 0, tL, tH);
    ctx.lineTo(-2, 3);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = '#182436';
    ctx.lineWidth = 1.9;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  _drawChevronBars(ctx, pts, L, W) {
    // Crisp dark steel-blue chevron flank bars & scattered ink blotches
    ctx.save();
    ctx.strokeStyle = '#253852';
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = 3; i < pts.length - 1; i++) {
      const p = pts[i];
      ctx.beginPath();
      ctx.moveTo(p.x - 4, p.y - p.hw * 0.95);
      ctx.lineTo(p.x + 3, p.y);
      ctx.lineTo(p.x - 4, p.y + p.hw * 0.95);
      ctx.stroke();
    }
    // Signature scattered dark flank ink spots near rear
    ctx.fillStyle = '#1A283C';
    for (const idx of [6, 7, 8]) {
      ctx.beginPath();
      ctx.arc(pts[idx].x - 2, pts[idx].y + (idx % 2 === 0 ? 3.2 : -3.2), 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  _drawEyesAndEmotes(ctx, pts, L, W) {
    const head = pts[1];
    const ex = head.x + 2;
    const sep = pts[1].hw * 0.82;
    const baseR = 4.6 * this._pose.eyeScale;
    const st = this.state;

    for (const side of [-1, 1]) {
      const bg = ctx.createRadialGradient(ex - 4, head.y + side * (sep + 2), 0.4, ex - 4, head.y + side * (sep + 2), 4.2);
      bg.addColorStop(0, 'rgba(255, 110, 148, 0.56)');
      bg.addColorStop(1, 'rgba(255, 110, 148, 0)');
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.ellipse(ex - 4, head.y + side * (sep + 2), 3.8, 2.2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const side of [-1, 1]) {
      const ey = head.y + side * sep;
      ctx.save();
      ctx.translate(ex, ey);
      if (st === 'happy') {
        ctx.strokeStyle = '#182436'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(0, 0, baseR * 0.78, -Math.PI * 0.42, Math.PI * 0.42); ctx.stroke();
      } else if (st === 'stress') {
        ctx.strokeStyle = '#182436'; ctx.lineWidth = 2.0; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-baseR * 0.52, -baseR * 0.52); ctx.lineTo(baseR * 0.45, 0); ctx.lineTo(-baseR * 0.52, baseR * 0.52); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.arc(0, 0, baseR, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFDF9'; ctx.fill();
        ctx.strokeStyle = '#182436'; ctx.lineWidth = 1.5; ctx.stroke();

        // Sharp golden-amber predator iris
        const irisR = st === 'shock' ? baseR * 0.35 : baseR * 0.76;
        const ig = ctx.createRadialGradient(0.4, -0.4, 0.5, 0, 0, irisR);
        ig.addColorStop(0, '#0F1824');
        ig.addColorStop(0.55, '#1A2A3E');
        ig.addColorStop(0.84, '#FFD23A');
        ig.addColorStop(1, '#FFF4A8');
        ctx.beginPath(); ctx.arc(0.4, 0, irisR, 0, Math.PI * 2); ctx.fillStyle = ig; ctx.fill();

        if (st === 'hungry') {
          ctx.fillStyle = '#FFF8B4';
          this._star(ctx, 0.6, -0.2, baseR * 0.55);
        } else {
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath(); ctx.arc(baseR * 0.28, -baseR * 0.28, baseR * 0.30, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(-baseR * 0.22, baseR * 0.24, baseR * 0.14, 0, Math.PI * 2); ctx.fill();
        }
        if (st === 'relax') {
          ctx.fillStyle = '#9FB6CF';
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
      this._star(ctx, pts[0].x + 14, -14, 4.5 * pulse);
      this._star(ctx, pts[2].x, 18, 3.5 * pulse);
    } else if (st === 'shock') {
      ctx.font = 'bold 14px sans-serif';
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2;
      ctx.strokeText('!', pts[0].x + 15, -10);
      ctx.fillStyle = '#FF3344'; ctx.fillText('!', pts[0].x + 15, -10);
    } else if (st === 'fear' || st === 'stress') {
      ctx.fillStyle = '#7CE4FF'; ctx.strokeStyle = '#1D5486'; ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(pts[1].x + 2, -16);
      ctx.quadraticCurveTo(pts[1].x - 5, -20, pts[1].x - 8, -16);
      ctx.quadraticCurveTo(pts[1].x - 5, -12, pts[1].x + 2, -16);
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
    const L = Barracudafish.metadata.baseLength;
    const W = Barracudafish.metadata.baseWidth;
    const shX = this._pose.shiver ? Math.sin(this.time * 58) * this._pose.shiver : 0;
    const shY = this._pose.shiver ? Math.cos(this.time * 66) * this._pose.shiver : 0;

    ctx.save();
    ctx.translate(this.x + shX, this.y + this._pose.bobY + shY);
    ctx.rotate(this.angle);
    ctx.scale(this.scale * this._pose.squashX, this.scale * this._pose.squashY);

    const pts = this._buildSpine(L, W);

    // Shadow
    ctx.save();
    ctx.translate(-3, 4);
    this._traceBody(ctx, pts, L, W);
    ctx.fillStyle = 'rgba(10, 20, 36, 0.22)';
    ctx.fill();
    ctx.restore();

    this._drawForkedTail(ctx, pts, L, W);
    this._drawRearSetFins(ctx, pts, L, W);
    this._drawUnderslungToothyJaw(ctx, pts, L, W);

    // Gleaming metallic silver needle torpedo
    this._traceBody(ctx, pts, L, W);
    const bg = ctx.createLinearGradient(pts[0].x, -W * 0.3, pts[0].x, W * 0.3);
    bg.addColorStop(0, '#F4FAFF');
    bg.addColorStop(0.28, '#C8D9EC');
    bg.addColorStop(0.72, '#8CA4BF');
    bg.addColorStop(1, '#58718F');
    ctx.fillStyle = bg;
    ctx.fill();

    // Clipped dark chevron flank bars & razor chrome specular highlight
    ctx.save();
    this._traceBody(ctx, pts, L, W);
    ctx.clip();
    this._drawChevronBars(ctx, pts, L, W);

    const hl = ctx.createLinearGradient(pts[1].x, -6, pts[7].x, 4);
    hl.addColorStop(0, 'rgba(255, 255, 255, 0.72)');
    hl.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = hl;
    ctx.beginPath();
    ctx.ellipse(pts[4].x, pts[4].y - 3.5, L * 0.28, 3.2, -0.02, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    this._traceBody(ctx, pts, L, W);
    ctx.strokeStyle = '#182436';
    ctx.lineWidth = 2.0;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Twin rear-set dorsal fins
    const sway = Math.sin(this.phase - 1.8) * 3.5;
    for (const idx of [5, 7]) {
      ctx.beginPath();
      ctx.ellipse(pts[idx].x, pts[idx].y + sway * 0.6, 8, 2.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#4B637E';
      ctx.fill();
      ctx.strokeStyle = '#182436';
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }

    this._drawEyesAndEmotes(ctx, pts, L, W);
    ctx.restore();
  }
}

export default Barracudafish;
