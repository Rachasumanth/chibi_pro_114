/**
 * Villain Sloane's Viperfish (Chauliodus sloani — Abyssal Obsidian Fang Variant)
 * 2D Top-Down Expressive Chibi Villain Fish
 * Abyssal obsidian-black slender body, huge gleaming crimson-tipped hinged fangs, glowing neon-red photophore rows along flanks.
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
  breathing:  { bend: 0,     finFlare: 0.20, jaw: 0.12, glow: 0.55, wagFreq: 2.2,  wagAmp: 0.14 },
  swimming:   { bend: 0,     finFlare: 0.55, jaw: 0.20, glow: 0.80, wagFreq: 7.4,  wagAmp: 0.36 },
  relax:      { bend: 0.06,  finFlare: 0.08, jaw: 0.02, glow: 0.30, wagFreq: 1.3,  wagAmp: 0.08 },
  left_turn:  { bend: -0.62, finFlare: 0.78, jaw: 0.25, glow: 0.75, wagFreq: 5.5,  wagAmp: 0.24 },
  right_turn: { bend: 0.62,  finFlare: 0.78, jaw: 0.25, glow: 0.75, wagFreq: 5.5,  wagAmp: 0.24 },
  eating:     { bend: 0,     finFlare: 0.90, jaw: 1.0,  glow: 1.0,  wagFreq: 9.2,  wagAmp: 0.24 },
  hungry:     { bend: 0,     finFlare: 0.65, jaw: 0.65, glow: 0.95, wagFreq: 6.0,  wagAmp: 0.26 },
  stress:     { bend: 0,     finFlare: 0.72, jaw: 0.40, glow: 0.90, wagFreq: 14.5, wagAmp: 0.16 },
  fear:       { bend: 0,     finFlare: 0.92, jaw: 0.35, glow: 0.22, wagFreq: 16.5, wagAmp: 0.20 },
  shock:      { bend: 0,     finFlare: 1.0,  jaw: 0.85, glow: 1.0,  wagFreq: 18.0, wagAmp: 0.12 },
  happy:      { bend: 0,     finFlare: 0.52, jaw: 0.35, glow: 0.88, wagFreq: 4.8,  wagAmp: 0.25 },
  sad:        { bend: -0.08, finFlare: -0.1, jaw: 0.0,  glow: 0.18, wagFreq: 1.1,  wagAmp: 0.06 },
};

const ONE_SHOT_DURATIONS = {
  left_turn: 0.62,
  right_turn: 0.62,
  eating: 0.56,
  shock: 0.72,
};

function easeCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export class VillainViperfish {
  static metadata = {
    name: "Villain Sloane's Viperfish",
    category: 'villain_fish',
    baseLength: 125,
    baseWidth: 36,
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

  _spineY(u, t, p) {
    // u from 0 (head) to 1 (tail)
    const wave = Math.sin(t * p.wagFreq - u * 4.2) * p.wagAmp * 18 * u * u;
    const turn = p.bend * 22 * u * u;
    return wave + turn;
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
      const mag = st === 'shock' ? 1.5 : 0.75;
      ctx.translate(Math.sin(t * 58) * mag, Math.cos(t * 64) * mag);
    }

    // Build 9-node spine from x=+46 (head) to x=-50 (tail peduncle)
    const nodes = [];
    const widths = [13.5, 16.2, 13.8, 11.2, 9.2, 7.4, 5.8, 4.2, 2.8];
    for (let i = 0; i < widths.length; i++) {
      const u = i / (widths.length - 1);
      const nx = lerp(44, -48, u);
      const ny = this._spineY(u, t, p);
      nodes.push({ x: nx, y: ny, w: widths[i], u });
    }

    // 1. Dark Abyssal Miasma Aura
    this._drawMiasma(ctx, t, p.glow);

    // 2. Forked Needle-Spiked Tail Fin
    this._drawTail(ctx, nodes[nodes.length - 1], nodes[nodes.length - 2]);

    // 3. Sharp Swept Pectoral & Pelvic Fins
    this._drawSideFins(ctx, nodes, p.finFlare, t);

    // 4. Huge Gleaming Crimson-Tipped Hinged Fangs
    this._drawHingedFangs(ctx, p.jaw, st, t);

    // 5. Abyssal Obsidian-Black Slender Body + Photophore Rows
    this._drawSegmentedBody(ctx, nodes, p.glow, t);

    // 6. Long Whip-Like Dorsal Spine Filament
    this._drawDorsalFilament(ctx, nodes, p.glow, t);

    // 7. Expressive Villain Chibi Eyes
    this._drawEyes(ctx, st, t);

    // 8. Mood FX
    this._drawMoodFX(ctx, st, t);

    ctx.restore();
  }

  _drawMiasma(ctx, t, glow) {
    ctx.save();
    const rx = 58 + Math.sin(t * 3) * 3;
    const grad = ctx.createRadialGradient(4, 0, 8, -4, 0, rx);
    grad.addColorStop(0, 'rgba(14, 6, 22, 0.56)');
    grad.addColorStop(0.55, `rgba(180, 12, 36, ${0.14 + glow * 0.14})`);
    grad.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(-2, 0, rx, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawTail(ctx, tip, prev) {
    ctx.save();
    const ang = Math.atan2(tip.y - prev.y, tip.x - prev.x) - Math.PI;
    ctx.translate(tip.x, tip.y);
    ctx.rotate(ang);

    const g = ctx.createLinearGradient(0, 0, -18, 0);
    g.addColorStop(0, '#1B1426');
    g.addColorStop(0.65, '#3E1529');
    g.addColorStop(1, '#D61838');

    ctx.fillStyle = g;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.0;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(2, -2.5);
    ctx.lineTo(-16, -13);
    ctx.lineTo(-12, -5.5);
    ctx.lineTo(-15, -3);
    ctx.lineTo(-9, 0);
    ctx.lineTo(-16, 13);
    ctx.lineTo(2, 2.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  _drawSideFins(ctx, nodes, flare, t) {
    const flutter = Math.sin(t * 7) * 0.08;
    const nPec = nodes[1];
    const nPel = nodes[3];

    for (const side of [-1, 1]) {
      // Long sabre pectoral fin
      ctx.save();
      ctx.translate(nPec.x - 4, nPec.y + side * (nPec.w - 2));
      ctx.rotate(side * (0.4 + flare * 0.45 + flutter));
      ctx.fillStyle = '#2A1838';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.9;
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.lineTo(-6, side * 14);
      ctx.lineTo(-13, side * 12);
      ctx.lineTo(-9, side * 6);
      ctx.lineTo(-12, side * 4);
      ctx.lineTo(-2, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Slender pelvic fin
      ctx.save();
      ctx.translate(nPel.x, nPel.y + side * (nPel.w - 1));
      ctx.rotate(side * (0.5 + flare * 0.3));
      ctx.fillStyle = '#3A1734';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(2, 0);
      ctx.lineTo(-8, side * 9);
      ctx.lineTo(-10, side * 4);
      ctx.lineTo(-3, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawHingedFangs(ctx, jaw, st, t) {
    ctx.save();
    const chomp = st === 'eating' ? Math.abs(Math.sin(t * 24)) * 5 : jaw * 4.5;
    const jx = 46 + chomp;

    // Lower hinged jaw protruding forward
    ctx.fillStyle = '#181022';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(35, -12.5);
    ctx.quadraticCurveTo(jx + 6, -11, jx + 9, 0);
    ctx.quadraticCurveTo(jx + 6, 11, 35, 12.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Huge gleaming crimson-tipped hinged fangs (iconic viperfish tusks)
    const drawTusk = (side, ox, oy, len, spread) => {
      const grad = ctx.createLinearGradient(ox, oy, ox + len, oy + spread);
      grad.addColorStop(0, '#FFFFFF');
      grad.addColorStop(0.6, '#FFE3E8');
      grad.addColorStop(1, '#FF1A43');

      ctx.fillStyle = grad;
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(ox, oy - side * 2.2);
      ctx.quadraticCurveTo(ox + len * 0.65, oy + spread * 0.35, ox + len, oy + spread);
      ctx.quadraticCurveTo(ox + len * 0.4, oy + side * 1.6, ox, oy + side * 1.4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    };

    // Primary mega-fangs curving outward & forward
    drawTusk(-1, jx + 1, -8.5, 14.5 + chomp * 0.6, -5.5);
    drawTusk(1,  jx + 1,  8.5, 14.5 + chomp * 0.6,  5.5);
    // Secondary inner fangs
    drawTusk(-1, jx + 4, -4.0, 9.5 + chomp * 0.4, -2.0);
    drawTusk(1,  jx + 4,  4.0, 9.5 + chomp * 0.4,  2.0);

    ctx.restore();
  }

  _drawSegmentedBody(ctx, nodes, glow, t) {
    ctx.save();

    const buildBody = () => {
      ctx.beginPath();
      // Chunky viperfish chibi snout
      ctx.moveTo(52, 0);
      ctx.quadraticCurveTo(50, -11.5, nodes[0].x, nodes[0].y - nodes[0].w);
      for (let i = 1; i < nodes.length; i++) {
        ctx.lineTo(nodes[i].x, nodes[i].y - nodes[i].w);
      }
      for (let i = nodes.length - 1; i >= 0; i--) {
        ctx.lineTo(nodes[i].x, nodes[i].y + nodes[i].w);
      }
      ctx.quadraticCurveTo(50, 11.5, 52, 0);
      ctx.closePath();
    };

    const g = ctx.createLinearGradient(50, -16, -48, 16);
    g.addColorStop(0, '#2B223A');
    g.addColorStop(0.35, '#171124');
    g.addColorStop(0.8, '#0E0A17');
    g.addColorStop(1, '#1E0D26');

    buildBody();
    ctx.fillStyle = g;
    ctx.fill();

    ctx.save();
    buildBody();
    ctx.clip();

    // Hexagonal obsidian scale sheen
    ctx.strokeStyle = 'rgba(130, 105, 185, 0.22)';
    ctx.lineWidth = 1.0;
    for (let i = 1; i < nodes.length - 1; i++) {
      const n = nodes[i];
      ctx.beginPath();
      ctx.moveTo(n.x + 4, n.y - n.w);
      ctx.lineTo(n.x - 2, n.y);
      ctx.lineTo(n.x + 4, n.y + n.w);
      ctx.stroke();
    }

    // Glowing neon-red photophore rows along both flanks
    for (let i = 1; i < nodes.length; i++) {
      const n = nodes[i];
      const waveGlow = 0.55 + 0.45 * Math.sin(t * 6 - i * 0.7);
      const alpha = Math.min(1, (0.35 + glow * 0.65) * waveGlow);
      for (const side of [-1, 1]) {
        const px = n.x;
        const py = n.y + side * (n.w * 0.66);
        ctx.fillStyle = `rgba(255, 24, 62, ${alpha * 0.45})`;
        ctx.beginPath();
        ctx.arc(px, py, 2.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(255, 120, 140, ${alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, 1.25, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Glossy dorsal ridge highlight
    ctx.fillStyle = 'rgba(170, 145, 225, 0.20)';
    ctx.beginPath();
    ctx.ellipse(24, -5.5, 16, 2.8, -0.05, 0, Math.PI * 2);
    ctx.fill();

    // Battle scar across cheek
    ctx.strokeStyle = '#FF7A94';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(29, -11);
    ctx.lineTo(35, -6);
    ctx.stroke();

    ctx.restore();

    buildBody();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.4;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  _drawDorsalFilament(ctx, nodes, glow, t) {
    ctx.save();
    const n1 = nodes[1];
    const n4 = nodes[4];
    const tipX = n4.x - 10;
    const tipY = n4.y + Math.sin(t * 5) * 4.5;

    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(n1.x, n1.y);
    ctx.quadraticCurveTo(nodes[2].x, nodes[2].y - 5, tipX, tipY);
    ctx.stroke();

    ctx.strokeStyle = '#E01E42';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(n1.x, n1.y);
    ctx.quadraticCurveTo(nodes[2].x, nodes[2].y - 5, tipX, tipY);
    ctx.stroke();

    // Glowing red photophore tip on dorsal whip
    ctx.fillStyle = `rgba(255, 42, 82, ${0.6 + glow * 0.4})`;
    ctx.beginPath();
    ctx.arc(tipX, tipY, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawEyes(ctx, st, t) {
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(39.5, side * 9.8);

      if (st === 'stress') {
        ctx.strokeStyle = '#FF1E4B';
        ctx.lineWidth = 2.3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-2.8, side * -2.2);
        ctx.lineTo(2.0, 0);
        ctx.lineTo(-2.8, side * 2.2);
        ctx.stroke();
        ctx.restore();
        continue;
      }

      const r = st === 'shock' ? 4.8 : 3.9;
      ctx.fillStyle = st === 'shock' ? '#FFF5F7' : '#14081E';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (st === 'shock') {
        ctx.fillStyle = '#140B1C';
        ctx.beginPath();
        ctx.arc(0.8, 0, 1.35, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = st === 'hungry' ? '#FF0F38' : '#FF3858';
        ctx.beginPath();
        ctx.arc(0.4, 0, r * 0.72, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#140B1C';
        ctx.beginPath();
        ctx.ellipse(0.7, 0, 0.8, r * 0.58, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(1.5, -1.0, 0.95, 0, Math.PI * 2);
        ctx.arc(-0.5, 1.1, 0.45, 0, Math.PI * 2);
        ctx.fill();

        if (st === 'relax' || st === 'happy') {
          ctx.fillStyle = '#1C1329';
          ctx.beginPath();
          ctx.arc(0, 0, r + 0.2, Math.PI * 0.95, Math.PI * 2.05);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Wicked angled V-brow
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (st === 'sad' || st === 'fear') {
        ctx.moveTo(-3.0, side * 4.2);
        ctx.lineTo(3.4, side * 2.4);
      } else {
        ctx.moveTo(-3.0, side * 2.2);
        ctx.lineTo(3.6, side * 4.6);
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
        const sx = 28 + Math.cos(a) * 18;
        const sy = Math.sin(a) * 18;
        const s = 2.4 + Math.sin(t * 8 + i) * 0.7;
        ctx.fillStyle = i % 2 === 0 ? '#FF1E4B' : '#A855F7';
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
      ctx.fillStyle = '#FF1E4B';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.7;
      ctx.beginPath();
      ctx.roundRect(40, -25 - b, 3.6, 9, 1.6);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(41.8, -13 - b, 2.0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (st === 'fear') {
      const drop = (t * 20) % 10;
      ctx.fillStyle = '#7CE8FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(32, -21 - drop * 0.3);
      ctx.quadraticCurveTo(35.5, -17, 32, -15.5);
      ctx.quadraticCurveTo(28.5, -17, 32, -21 - drop * 0.3);
      ctx.fill();
      ctx.stroke();
    } else if (st === 'stress') {
      const sc = 1 + Math.sin(t * 24) * 0.16;
      ctx.save();
      ctx.translate(31, -18);
      ctx.scale(sc, sc);
      ctx.strokeStyle = '#FF2A4B';
      ctx.lineWidth = 2.0;
      ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(1.3, 1.3);
        ctx.quadraticCurveTo(2.5, 2.5, 4.4, 1.5);
        ctx.stroke();
      }
      ctx.restore();
    } else if (st === 'sad') {
      const fall = (t * 8) % 6;
      ctx.fillStyle = '#60C5FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(39.5, 14 + fall * 0.4);
      ctx.quadraticCurveTo(42, 17 + fall * 0.4, 39.5, 18.5 + fall * 0.4);
      ctx.quadraticCurveTo(37, 17 + fall * 0.4, 39.5, 14 + fall * 0.4);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
}

export default VillainViperfish;
