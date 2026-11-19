/**
 * Villain Pelican Gulper Eel (Eurypharynx pelecanoides — Shadow-Purple Maw Variant)
 * 2D Top-Down Expressive Chibi Villain Fish
 * Cavernous shadow-purple pelican maw lined with glowing violet teeth, long barbed whip tail with sinister glowing crimson lure tip.
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
  breathing:  { bend: 0,     maw: 0.18, lure: 0.60, wagFreq: 2.0,  wagAmp: 0.16 },
  swimming:   { bend: 0,     maw: 0.25, lure: 0.80, wagFreq: 6.8,  wagAmp: 0.38 },
  relax:      { bend: 0.06,  maw: 0.05, lure: 0.35, wagFreq: 1.2,  wagAmp: 0.09 },
  left_turn:  { bend: -0.60, maw: 0.30, lure: 0.78, wagFreq: 5.0,  wagAmp: 0.25 },
  right_turn: { bend: 0.60,  maw: 0.30, lure: 0.78, wagFreq: 5.0,  wagAmp: 0.25 },
  eating:     { bend: 0,     maw: 1.0,  lure: 1.0,  wagFreq: 8.8,  wagAmp: 0.26 },
  hungry:     { bend: 0,     maw: 0.72, lure: 0.95, wagFreq: 5.8,  wagAmp: 0.28 },
  stress:     { bend: 0,     maw: 0.45, lure: 0.88, wagFreq: 13.8, wagAmp: 0.18 },
  fear:       { bend: 0,     maw: 0.40, lure: 0.20, wagFreq: 16.0, wagAmp: 0.22 },
  shock:      { bend: 0,     maw: 0.90, lure: 1.0,  wagFreq: 17.5, wagAmp: 0.14 },
  happy:      { bend: 0,     maw: 0.48, lure: 0.92, wagFreq: 4.5,  wagAmp: 0.26 },
  sad:        { bend: -0.08, maw: 0.0,  lure: 0.18, wagFreq: 1.1,  wagAmp: 0.07 },
};

const ONE_SHOT_DURATIONS = {
  left_turn: 0.64,
  right_turn: 0.64,
  eating: 0.58,
  shock: 0.72,
};

function easeCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export class VillainGulpereelfish {
  static metadata = {
    name: 'Villain Pelican Gulper Eel',
    category: 'villain_fish',
    baseLength: 165,
    baseWidth: 48,
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
      const mag = st === 'shock' ? 1.6 : 0.8;
      ctx.translate(Math.sin(t * 56) * mag, Math.cos(t * 62) * mag);
    }

    // Build 12-node whip tail from x=+24 (neck) to x=-84 (tail lure tip)
    const tailNodes = [];
    const tailWidths = [11.0, 8.6, 6.8, 5.6, 4.7, 4.0, 3.3, 2.7, 2.2, 1.8, 1.4, 1.0];
    for (let i = 0; i < tailWidths.length; i++) {
      const u = i / (tailWidths.length - 1);
      const nx = lerp(24, -84, u);
      const ny = Math.sin(t * p.wagFreq - u * 5.8) * p.wagAmp * 26 * u + p.bend * 28 * u * u;
      tailNodes.push({ x: nx, y: ny, w: tailWidths[i], u });
    }

    // 1. Abyssal Miasma Aura
    this._drawMiasma(ctx, t, p.lure);

    // 2. Long Barbed Whip Tail + Sinister Crimson Lure Tip
    this._drawWhipTail(ctx, tailNodes, p.lure, t);

    // 3. Tiny Tattered Shadow Pectoral Fins
    this._drawMiniFins(ctx, tailNodes[0], t);

    // 4. Cavernous Shadow-Purple Pelican Maw + Glowing Violet Teeth
    this._drawPelicanHead(ctx, p.maw, st, t);

    // 5. Expressive Villain Chibi Eyes (Forward-Set on Snout Tip)
    this._drawEyes(ctx, st, t);

    // 6. Mood FX
    this._drawMoodFX(ctx, st, t);

    ctx.restore();
  }

  _drawMiasma(ctx, t, lure) {
    ctx.save();
    const grad = ctx.createRadialGradient(34, 0, 10, 12, 0, 56);
    grad.addColorStop(0, 'rgba(22, 6, 38, 0.58)');
    grad.addColorStop(0.6, `rgba(128, 22, 196, ${0.14 + lure * 0.14})`);
    grad.addColorStop(1, 'rgba(20, 11, 28, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(16, 0, 56, 28 + Math.sin(t * 3) * 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawWhipTail(ctx, nodes, lure, t) {
    ctx.save();

    // Barbed dorsal/ventral spikes along whip tail
    ctx.fillStyle = '#53196E';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.4;
    for (let i = 2; i < nodes.length - 1; i += 2) {
      const n = nodes[i];
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(n.x + 3, n.y + side * n.w);
        ctx.lineTo(n.x - 4, n.y + side * (n.w + 4.8));
        ctx.lineTo(n.x - 4, n.y + side * n.w);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    // Main undulating whip body
    ctx.beginPath();
    ctx.moveTo(nodes[0].x, nodes[0].y - nodes[0].w);
    for (let i = 1; i < nodes.length; i++) {
      ctx.lineTo(nodes[i].x, nodes[i].y - nodes[i].w);
    }
    for (let i = nodes.length - 1; i >= 0; i--) {
      ctx.lineTo(nodes[i].x, nodes[i].y + nodes[i].w);
    }
    ctx.closePath();

    const g = ctx.createLinearGradient(24, 0, -84, 0);
    g.addColorStop(0, '#2B1342');
    g.addColorStop(0.65, '#190A28');
    g.addColorStop(1, '#5C1133');

    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.2;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Glowing violet lateral seam along tail
    ctx.strokeStyle = `rgba(182, 82, 255, ${0.35 + lure * 0.35})`;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(nodes[0].x, nodes[0].y);
    for (let i = 1; i < nodes.length; i++) {
      ctx.lineTo(nodes[i].x, nodes[i].y);
    }
    ctx.stroke();

    // Sinister glowing crimson lure bulb at tail tip
    const tip = nodes[nodes.length - 1];
    const auraR = 11 + lure * 7 + Math.sin(t * 7) * 2;
    const rad = ctx.createRadialGradient(tip.x, tip.y, 1, tip.x, tip.y, auraR);
    rad.addColorStop(0, `rgba(255, 28, 76, ${0.65 + lure * 0.3})`);
    rad.addColorStop(0.5, 'rgba(200, 16, 62, 0.22)');
    rad.addColorStop(1, 'rgba(200, 16, 62, 0)');
    ctx.fillStyle = rad;
    ctx.beginPath();
    ctx.arc(tip.x, tip.y, auraR, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FF2052';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(tip.x, tip.y, 3.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFE3EB';
    ctx.beginPath();
    ctx.arc(tip.x + 0.6, tip.y - 0.6, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  _drawMiniFins(ctx, neck, t) {
    const fl = Math.sin(t * 8) * 0.15;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(neck.x - 2, neck.y + side * 10);
      ctx.rotate(side * (0.45 + fl));
      ctx.fillStyle = '#4B1D6B';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(2, 0);
      ctx.lineTo(-4, side * 8);
      ctx.lineTo(-9, side * 5);
      ctx.lineTo(-3, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawPelicanHead(ctx, maw, st, t) {
    ctx.save();
    const swell = (st === 'eating' ? Math.abs(Math.sin(t * 20)) * 5 : maw * 4.5);
    const w = 21 + swell;

    // Expanded cavernous pelican throat pouch beneath head
    const pouchGrad = ctx.createRadialGradient(48, 0, 5, 44, 0, 32);
    pouchGrad.addColorStop(0, '#4E167A');
    pouchGrad.addColorStop(0.6, '#280B42');
    pouchGrad.addColorStop(1, '#140622');

    ctx.fillStyle = pouchGrad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(76 + swell * 0.5, 0);
    ctx.bezierCurveTo(73, -w * 0.85, 52, -w * 1.05, 32, -w * 0.82);
    ctx.quadraticCurveTo(22, -14, 21, 0);
    ctx.quadraticCurveTo(22, 14, 32, w * 0.82);
    ctx.bezierCurveTo(52, w * 1.05, 73, w * 0.85, 76 + swell * 0.5, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing violet needle teeth lining the cavernous pelican rim
    ctx.fillStyle = '#E5B8FF';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.0;
    const teethPositions = [
      [70, 9], [64, 14], [56, 17.5], [47, 19], [38, 17.5],
    ];
    for (const [tx, ty] of teethPositions) {
      for (const side of [-1, 1]) {
        const yPos = side * (ty + swell * 0.65);
        ctx.beginPath();
        ctx.moveTo(tx - 1.5, yPos);
        ctx.lineTo(tx + 2.8, yPos + side * 3.8);
        ctx.lineTo(tx + 1.8, yPos);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }

    // Upper skull dome (slender predator cranium crowning the giant maw)
    const skullPath = () => {
      ctx.beginPath();
      ctx.moveTo(74, 0);
      ctx.bezierCurveTo(70, -10.5, 52, -14.5, 34, -12.5);
      ctx.quadraticCurveTo(24, -10, 22, 0);
      ctx.quadraticCurveTo(24, 10, 34, 12.5);
      ctx.bezierCurveTo(52, 14.5, 70, 10.5, 74, 0);
      ctx.closePath();
    };

    const sg = ctx.createLinearGradient(74, -14, 22, 14);
    sg.addColorStop(0, '#441C66');
    sg.addColorStop(0.55, '#291042');
    sg.addColorStop(1, '#190929');

    skullPath();
    ctx.fillStyle = sg;
    ctx.fill();

    ctx.save();
    skullPath();
    ctx.clip();

    // Glowing violet arcane markings on skull
    ctx.strokeStyle = `rgba(196, 104, 255, ${0.5 + 0.3 * Math.sin(t * 4)})`;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(56, 0);
    ctx.lineTo(48, -5.5);
    ctx.lineTo(40, 0);
    ctx.lineTo(48, 5.5);
    ctx.closePath();
    ctx.stroke();

    // Glossy skull highlight
    ctx.fillStyle = 'rgba(210, 165, 255, 0.22)';
    ctx.beginPath();
    ctx.ellipse(50, -6.5, 13, 3.0, -0.08, 0, Math.PI * 2);
    ctx.fill();

    // Battle scar across snout
    ctx.strokeStyle = '#FF99C8';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(54, -9);
    ctx.lineTo(60, -4);
    ctx.stroke();

    ctx.restore();

    skullPath();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.3;
    ctx.stroke();
    ctx.restore();
  }

  _drawEyes(ctx, st, t) {
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(64.5, side * 6.8);

      if (st === 'stress') {
        ctx.strokeStyle = '#E066FF';
        ctx.lineWidth = 2.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-2.5, side * -2.0);
        ctx.lineTo(1.8, 0);
        ctx.lineTo(-2.5, side * 2.0);
        ctx.stroke();
        ctx.restore();
        continue;
      }

      const r = st === 'shock' ? 4.4 : 3.5;
      ctx.fillStyle = st === 'shock' ? '#FFF5FF' : '#140620';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.7;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (st === 'shock') {
        ctx.fillStyle = '#140B1C';
        ctx.beginPath();
        ctx.arc(0.7, 0, 1.25, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = st === 'hungry' ? '#FF2466' : '#D04BFF';
        ctx.beginPath();
        ctx.arc(0.4, 0, r * 0.72, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#140B1C';
        ctx.beginPath();
        ctx.ellipse(0.6, 0, 0.75, r * 0.56, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(1.3, -0.9, 0.85, 0, Math.PI * 2);
        ctx.arc(-0.5, 1.0, 0.45, 0, Math.PI * 2);
        ctx.fill();

        if (st === 'relax' || st === 'happy') {
          ctx.fillStyle = '#2B1145';
          ctx.beginPath();
          ctx.arc(0, 0, r + 0.2, Math.PI * 0.95, Math.PI * 2.05);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Angled V-shaped villain brow
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.0;
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (st === 'sad' || st === 'fear') {
        ctx.moveTo(-2.5, side * 3.8);
        ctx.lineTo(3.0, side * 2.0);
      } else {
        ctx.moveTo(-2.5, side * 2.0);
        ctx.lineTo(3.2, side * 4.2);
      }
      ctx.stroke();

      ctx.restore();
    }
  }

  _drawMoodFX(ctx, st, t) {
    ctx.save();
    if (st === 'happy') {
      for (let i = 0; i < 3; i++) {
        const a = t * 2.7 + i * 2.1;
        const sx = 52 + Math.cos(a) * 24;
        const sy = Math.sin(a) * 24;
        const s = 2.5 + Math.sin(t * 8 + i) * 0.8;
        ctx.fillStyle = i % 2 === 0 ? '#D946EF' : '#FF245E';
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
      const b = Math.abs(Math.sin(t * 16)) * 2.8;
      ctx.fillStyle = '#FF245E';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.7;
      ctx.beginPath();
      ctx.roundRect(62, -30 - b, 3.8, 9.5, 1.6);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(63.9, -17.5 - b, 2.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (st === 'fear') {
      const drop = (t * 20) % 10;
      ctx.fillStyle = '#7CE8FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(54, -26 - drop * 0.3);
      ctx.quadraticCurveTo(58, -21.5, 54, -20);
      ctx.quadraticCurveTo(50, -21.5, 54, -26 - drop * 0.3);
      ctx.fill();
      ctx.stroke();
    } else if (st === 'stress') {
      const sc = 1 + Math.sin(t * 24) * 0.16;
      ctx.save();
      ctx.translate(54, -22);
      ctx.scale(sc, sc);
      ctx.strokeStyle = '#FF2A4B';
      ctx.lineWidth = 2.0;
      ctx.lineCap = 'round';
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(1.3, 1.3);
        ctx.quadraticCurveTo(2.6, 2.6, 4.6, 1.6);
        ctx.stroke();
      }
      ctx.restore();
    } else if (st === 'sad') {
      const fall = (t * 8) % 6;
      ctx.fillStyle = '#60C5FF';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(64.5, 12 + fall * 0.4);
      ctx.quadraticCurveTo(67, 15 + fall * 0.4, 64.5, 16.5 + fall * 0.4);
      ctx.quadraticCurveTo(62, 15 + fall * 0.4, 64.5, 12 + fall * 0.4);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
}

export default VillainGulpereelfish;
