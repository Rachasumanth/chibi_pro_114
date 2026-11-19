/**
 * Villain Cutlass Ribbonfish (Trichiurus lepturus — Blackened Damascus-Steel Blade Variant)
 * 2D Top-Down Expressive Chibi Villain Fish
 * Blackened Damascus-steel cutlass blade body with glowing crimson razor edge, wicked golden slit eyes.
 */

const OUTLINE = '#140B1C';
const ONE_SHOT_STATES = new Set(['left_turn', 'right_turn', 'eating', 'shock']);
const LOCKED_STATES = new Set(['shock', 'fear']);
const BLOCKED_WHEN_LOCKED = new Set(['left_turn', 'right_turn', 'relax', 'happy', 'eating']);

const STATE_ALIASES = {
  idle: 'breathing',
  hunger: 'hungry',
};

const VALID_STATES = new Set([
  'breathing',
  'swimming',
  'relax',
  'left_turn',
  'right_turn',
  'eating',
  'hungry',
  'stress',
  'fear',
  'shock',
  'happy',
  'sad',
]);

const POSE_TARGETS = {
  breathing:  { bend: 0,     finFlare: 0.18, jaw: 0.08, edgeGlow: 0.55, wagFreq: 2.3,  wagAmp: 0.14 },
  swimming:   { bend: 0,     finFlare: 0.55, jaw: 0.15, edgeGlow: 0.85, wagFreq: 7.0,  wagAmp: 0.38 },
  relax:      { bend: 0.05,  finFlare: 0.06, jaw: 0.0,  edgeGlow: 0.30, wagFreq: 1.3,  wagAmp: 0.08 },
  left_turn:  { bend: -0.60, finFlare: 0.78, jaw: 0.18, edgeGlow: 0.85, wagFreq: 5.2,  wagAmp: 0.24 },
  right_turn: { bend: 0.60,  finFlare: 0.78, jaw: 0.18, edgeGlow: 0.85, wagFreq: 5.2,  wagAmp: 0.24 },
  eating:     { bend: 0,     finFlare: 0.90, jaw: 1.0,  edgeGlow: 1.0,  wagFreq: 9.0,  wagAmp: 0.22 },
  hungry:     { bend: 0,     finFlare: 0.65, jaw: 0.58, edgeGlow: 0.95, wagFreq: 6.0,  wagAmp: 0.25 },
  stress:     { bend: 0,     finFlare: 0.75, jaw: 0.35, edgeGlow: 0.92, wagFreq: 14.0, wagAmp: 0.16 },
  fear:       { bend: 0,     finFlare: 0.92, jaw: 0.30, edgeGlow: 0.25, wagFreq: 16.0, wagAmp: 0.20 },
  shock:      { bend: 0,     finFlare: 1.0,  jaw: 0.85, edgeGlow: 1.0,  wagFreq: 17.5, wagAmp: 0.12 },
  happy:      { bend: 0,     finFlare: 0.50, jaw: 0.28, edgeGlow: 0.88, wagFreq: 4.8,  wagAmp: 0.24 },
  sad:        { bend: -0.06, finFlare: -0.1, jaw: 0.0,  edgeGlow: 0.18, wagFreq: 1.1,  wagAmp: 0.06 },
};

const ONE_SHOT_DURATIONS = {
  left_turn: 0.62,
  right_turn: 0.62,
  eating: 0.55,
  shock: 0.70,
};

function easeCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export class VillainRibbonfish {
  static metadata = {
    name: 'Villain Cutlass Ribbonfish',
    category: 'villain_fish',
    baseLength: 180,
    baseWidth: 32,
  };

  constructor(x = 0, y = 0, scale = 1) {
    this.x = x;
    this.y = y;
    this.scale = scale;
    this.angle = 0;

    this._state = 'breathing';
    this._prevState = 'breathing';
    this._time = 0;
    this._stateTime = 0;

    this._blendDuration = 0.15;
    this._blendElapsed = 0.15;
    this._fromPose = { ...POSE_TARGETS.breathing };
    this._pose = { ...POSE_TARGETS.breathing };
    this._callbacks = new Map();
  }

  setAngle(radians) {
    this.angle = radians;
  }

  setDirection(dx, dy) {
    if (dx !== 0 || dy !== 0) {
      this.angle = Math.atan2(dy, dx);
    }
  }

  getState() {
    return this._state;
  }

  onFinished(name, callback) {
    if (typeof callback !== 'function') return;
    const normalized = STATE_ALIASES[name] || name;
    if (!this._callbacks.has(normalized)) {
      this._callbacks.set(normalized, []);
    }
    this._callbacks.get(normalized).push(callback);
  }

  play(name) {
    const target = STATE_ALIASES[name] || name;
    if (!VALID_STATES.has(target)) return false;

    if (LOCKED_STATES.has(this._state) && BLOCKED_WHEN_LOCKED.has(target)) {
      return false;
    }

    if (target === this._state && !ONE_SHOT_STATES.has(target)) {
      return true;
    }

    if (!ONE_SHOT_STATES.has(this._state)) {
      this._prevState = this._state;
    }

    this._fromPose = { ...this._pose };
    this._state = target;
    this._stateTime = 0;
    this._blendElapsed = 0;
    return true;
  }

  update(dt) {
    const step = Math.max(0, Math.min(dt || 0, 0.1));
    this._time += step;
    this._stateTime += step;

    if (this._blendElapsed < this._blendDuration) {
      this._blendElapsed = Math.min(this._blendDuration, this._blendElapsed + step);
      const t = easeCubic(this._blendElapsed / this._blendDuration);
      const target = POSE_TARGETS[this._state];
      for (const key of Object.keys(this._pose)) {
        this._pose[key] = lerp(this._fromPose[key], target[key], t);
      }
    } else {
      const target = POSE_TARGETS[this._state];
      for (const key of Object.keys(this._pose)) {
        this._pose[key] = target[key];
      }
    }

    if (ONE_SHOT_STATES.has(this._state)) {
      const dur = ONE_SHOT_DURATIONS[this._state];
      if (this._stateTime >= dur) {
        const finished = this._state;
        const returnTo = this._prevState || 'breathing';
        this._fromPose = { ...this._pose };
        this._state = returnTo;
        this._stateTime = 0;
        this._blendElapsed = 0;

        const list = this._callbacks.get(finished);
        if (list && list.length) {
          for (const cb of [...list]) cb(finished);
        }
      }
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);

    const t = this._time;
    const p = this._pose;
    const st = this._state;

    if (st === 'stress' || st === 'fear' || st === 'shock') {
      const mag = st === 'shock' ? 1.5 : 0.7;
      ctx.translate(Math.sin(t * 58) * mag, Math.cos(t * 64) * mag);
    }

    // 14-node cutlass blade spine from x=+74 to x=-90 (razor needle tail)
    const nodes = [];
    const count = 14;
    for (let i = 0; i < count; i++) {
      const u = i / (count - 1);
      const nx = lerp(74, -90, u);
      const wave = Math.sin(t * p.wagFreq - u * 6.0) * p.wagAmp * 22 * Math.pow(u, 1.2);
      const turn = p.bend * 30 * u * u;
      const w = i === 0 ? 12.2 : (i === 1 ? 14.5 : Math.max(0.8, 13.0 * Math.pow(1 - u, 1.05)));
      nodes.push({ x: nx, y: wave + turn, w, u });
    }

    // 1. Dark Miasma Aura
    this._drawMiasma(ctx, nodes, p.edgeGlow);

    // 2. Bladed Swept Pectoral Fins
    this._drawPectorals(ctx, nodes[1], p.finFlare, t);

    // 3. Razor-Fanged Cutlass Snout Tip
    this._drawFangedSnout(ctx, p.jaw, st, t);

    // 4. Blackened Damascus-Steel Cutlass Blade Body + Glowing Crimson Razor Edge
    this._drawDamascusBody(ctx, nodes, p.edgeGlow, t);

    // 5. Glowing Crimson Razor Dorsal Ridge
    this._drawRazorRidge(ctx, nodes, p.edgeGlow, t);

    // 6. Wicked Golden Slit Eyes
    this._drawEyes(ctx, st, t);

    // 7. Mood FX
    this._drawMoodFX(ctx, st, t);

    ctx.restore();
  }

  _drawMiasma(ctx, nodes, glow) {
    ctx.save();
    ctx.strokeStyle = `rgba(185, 16, 42, ${0.14 + glow * 0.14})`;
    ctx.lineWidth = 24;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(nodes[0].x, nodes[0].y);
    for (let i = 1; i < nodes.length; i++) {
      ctx.lineTo(nodes[i].x, nodes[i].y);
    }
    ctx.stroke();
    ctx.restore();
  }

  _drawPectorals(ctx, shoulder, flare, t) {
    const fl = Math.sin(t * 7) * 0.08;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(shoulder.x - 2, shoulder.y + side * 12);
      ctx.rotate(side * (0.35 + flare * 0.45 + fl));

      const g = ctx.createLinearGradient(0, 0, -14, side * 12);
      g.addColorStop(0, '#282E3D');
      g.addColorStop(0.65, '#4A556A');
      g.addColorStop(1, '#E01A38');

      ctx.fillStyle = g;
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.9;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(5, 0);
      ctx.lineTo(-4, side * 14);
      ctx.lineTo(-12, side * 11);
      ctx.lineTo(-8, side * 6);
      ctx.lineTo(-11, side * 3.5);
      ctx.lineTo(-2, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawFangedSnout(ctx, jaw, st, t) {
    ctx.save();
    const snap = st === 'eating' ? Math.abs(Math.sin(t * 24)) * 3.5 : jaw * 3.5;
    const tipX = 88 + snap;

    // Sharp pointed lower jaw sword tip
    ctx.fillStyle = '#1C202E';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(74, -8.5);
    ctx.lineTo(tipX + 4, 0);
    ctx.lineTo(74, 8.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Wicked cutlass fangs jutting from jaw edges
    ctx.fillStyle = '#FFF5F0';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.1;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(81, side * 5.2);
      ctx.lineTo(86 + snap * 0.8, side * (7.2 + snap * 0.4));
      ctx.lineTo(83.5, side * 3.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawDamascusBody(ctx, nodes, edgeGlow, t) {
    ctx.save();

    const buildBlade = () => {
      ctx.beginPath();
      ctx.moveTo(88, 0);
      ctx.lineTo(nodes[0].x, nodes[0].y - nodes[0].w);
      for (let i = 1; i < nodes.length; i++) {
        ctx.lineTo(nodes[i].x, nodes[i].y - nodes[i].w);
      }
      for (let i = nodes.length - 1; i >= 0; i--) {
        ctx.lineTo(nodes[i].x, nodes[i].y + nodes[i].w);
      }
      ctx.closePath();
    };

    const g = ctx.createLinearGradient(88, -14, -90, 14);
    g.addColorStop(0, '#4E586E');
    g.addColorStop(0.3, '#2D3445');
    g.addColorStop(0.75, '#1B202C');
    g.addColorStop(1, '#11131D');

    buildBlade();
    ctx.fillStyle = g;
    ctx.fill();

    ctx.save();
    buildBlade();
    ctx.clip();

    // Blackened Damascus-steel ripple grain waves
    ctx.strokeStyle = 'rgba(175, 195, 225, 0.22)';
    ctx.lineWidth = 1.1;
    for (let k = -2; k <= 2; k++) {
      ctx.beginPath();
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const ry = n.y + k * (n.w * 0.35) + Math.sin(i * 1.4 + k) * 2.2;
        if (i === 0) ctx.moveTo(n.x + 8, ry);
        else ctx.lineTo(n.x, ry);
      }
      ctx.stroke();
    }

    // Glowing crimson razor edge along blade flanks
    const pulse = 0.6 + 0.4 * Math.sin(t * 5);
    ctx.strokeStyle = `rgba(255, 32, 68, ${(0.45 + edgeGlow * 0.55) * pulse})`;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(86, 0);
    for (let i = 0; i < nodes.length; i++) {
      ctx.lineTo(nodes[i].x, nodes[i].y - nodes[i].w + 1);
    }
    ctx.stroke();

    // Steel specular sheen
    ctx.fillStyle = 'rgba(230, 240, 255, 0.28)';
    ctx.beginPath();
    ctx.ellipse(52, -5.5, 18, 2.4, -0.05, 0, Math.PI * 2);
    ctx.fill();

    // Forged battle nick/scar
    ctx.strokeStyle = '#FF95A8';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(46, -10);
    ctx.lineTo(52, -4.5);
    ctx.stroke();

    ctx.restore();

    buildBlade();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.3;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  _drawRazorRidge(ctx, nodes, edgeGlow, t) {
    ctx.save();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(nodes[0].x - 6, nodes[0].y);
    for (let i = 1; i < nodes.length; i++) {
      ctx.lineTo(nodes[i].x, nodes[i].y);
    }
    ctx.stroke();

    ctx.strokeStyle = `rgba(255, 42, 72, ${0.65 + edgeGlow * 0.35 * (0.7 + 0.3 * Math.sin(t * 7))})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(nodes[0].x - 6, nodes[0].y);
    for (let i = 1; i < nodes.length; i++) {
      ctx.lineTo(nodes[i].x, nodes[i].y);
    }
    ctx.stroke();
    ctx.restore();
  }

  _drawEyes(ctx, st, t) {
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(71.5, side * 8.2);

      if (st === 'stress') {
        ctx.strokeStyle = '#FFD026';
        ctx.lineWidth = 2.3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-2.6, side * -2.1);
        ctx.lineTo(1.9, 0);
        ctx.lineTo(-2.6, side * 2.1);
        ctx.stroke();
        ctx.restore();
        continue;
      }

      const r = st === 'shock' ? 4.6 : 3.8;
      ctx.fillStyle = st === 'shock' ? '#FFFDF0' : '#18101E';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (st === 'shock') {
        ctx.fillStyle = '#140B1C';
        ctx.beginPath();
        ctx.arc(0.7, 0, 1.3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Wicked golden slit iris
        ctx.fillStyle = st === 'hungry' ? '#FF3B24' : '#FFCA28';
        ctx.beginPath();
        ctx.arc(0.4, 0, r * 0.72, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#140B1C';
        ctx.beginPath();
        ctx.ellipse(0.6, 0, 0.75, r * 0.62, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(1.4, -1.0, 0.9, 0, Math.PI * 2);
        ctx.arc(-0.5, 1.0, 0.45, 0, Math.PI * 2);
        ctx.fill();

        if (st === 'relax' || st === 'happy') {
          ctx.fillStyle = '#2D3445';
          ctx.beginPath();
          ctx.arc(0, 0, r + 0.2, Math.PI * 0.95, Math.PI * 2.05);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Sharp angled V-brow
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.1;
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (st === 'sad' || st === 'fear') {
        ctx.moveTo(-2.8, side * 4.0);
        ctx.lineTo(3.2, side * 2.2);
      } else {
        ctx.moveTo(-2.8, side * 2.0);
        ctx.lineTo(3.4, side * 4.4);
      }
      ctx.stroke();

      ctx.restore();
    }
  }

  _drawMoodFX(ctx, st, t) {
    ctx.save();
    if (st === 'happy') {
      for (let i = 0; i < 3; i++) {
        const a = t * 2.8 + i * 2.1;
        const sx = 64 + Math.cos(a) * 18;
        const sy = Math.sin(a) * 17;
        const s = 2.4 + Math.sin(t * 8 + i) * 0.7;
        ctx.fillStyle = i % 2 === 0 ? '#FF2448' : '#A855F7';
        ctx.beginPath();
        ctx.moveTo(sx, sy - s);
        ctx.lineTo(sx + s * 0.35, sy - s * 0.35);
        ctx.lineTo(sx + s, sy);
        ctx.lineTo(sx + s * 0.35, sy + s * 0.35);
        ctx.lineTo(sx, sy + s);
        ctx.lineTo(sx - s * 0.35, sy + s * 0.35);
        ctx.lineTo(sx - s, sy);
        ctx.lineTo(sx - s * 0.35, sy - s * 0.35);
        ctx.closePath();
        ctx.fill();
      }
    } else if (st === 'shock') {
      const b = Math.abs(Math.sin(t * 16)) * 2.5;
      ctx.fillStyle = '#FF2448';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.7;
      ctx.beginPath();
      ctx.roundRect(72, -24 - b, 3.6, 8.8, 1.5);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(73.8, -12.2 - b, 1.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (st === 'fear') {
      const drop = (t * 20) % 10;
      ctx.fillStyle = '#7CE8FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(64, -20 - drop * 0.3);
      ctx.quadraticCurveTo(67.5, -16, 64, -14.5);
      ctx.quadraticCurveTo(60.5, -16, 64, -20 - drop * 0.3);
      ctx.fill();
      ctx.stroke();
    } else if (st === 'stress') {
      const sc = 1 + Math.sin(t * 24) * 0.16;
      ctx.save();
      ctx.translate(63, -17);
      ctx.scale(sc, sc);
      ctx.strokeStyle = '#FF2A4B';
      ctx.lineWidth = 2.0;
      ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(1.2, 1.2);
        ctx.quadraticCurveTo(2.4, 2.4, 4.2, 1.4);
        ctx.stroke();
      }
      ctx.restore();
    } else if (st === 'sad') {
      const fall = (t * 8) % 6;
      ctx.fillStyle = '#60C5FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(71.5, 13 + fall * 0.4);
      ctx.quadraticCurveTo(74, 16 + fall * 0.4, 71.5, 17.5 + fall * 0.4);
      ctx.quadraticCurveTo(69, 16 + fall * 0.4, 71.5, 13 + fall * 0.4);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
}

export default VillainRibbonfish;
