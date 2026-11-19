/**
 * Pirate Skull & Crossbones Relic (Top-Down Expressive Chibi Static Prop)
 * Native HTML5 Canvas 2D API — Zero External Dependencies
 */

const OUTLINE = '#1E142B';

export class Skullpileobject {
  static metadata = {
    name: 'Pirate Skull & Crossbones Relic',
    category: 'object',
    baseLength: 68,
    baseWidth: 64,
  };

  constructor(x = 0, y = 0, scale = 1) {
    this.x = x;
    this.y = y;
    this.scale = scale;
    this.angle = 0;
  }

  play(name) {}
  update(dt) {}

  setAngle(radians) {
    this.angle = radians;
  }

  setDirection(dx, dy) {
    if (dx !== 0 || dy !== 0) {
      this.angle = Math.atan2(dy, dx);
    }
  }

  getState() {
    return 'static';
  }

  onFinished(name, callback) {}

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.scale(this.scale, this.scale);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    this._drawAmbientShadow(ctx);
    this._drawCrossedFemurs(ctx);
    this._drawChibiSkull(ctx);
    this._drawEyepatch(ctx);
    this._drawCracksAndWeathering(ctx);
    this._drawGoldToothSparkle(ctx);

    ctx.restore();
  }

  _drawAmbientShadow(ctx) {
    const grad = ctx.createRadialGradient(0, 4, 6, 0, 4, 34);
    grad.addColorStop(0, 'rgba(16, 14, 34, 0.5)');
    grad.addColorStop(0.68, 'rgba(16, 14, 34, 0.22)');
    grad.addColorStop(1, 'rgba(16, 14, 34, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 4, 33, 30, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawFemur(ctx, rot) {
    ctx.save();
    ctx.rotate(rot);

    const len = 26;
    const grad = ctx.createLinearGradient(0, -6, 0, 6);
    grad.addColorStop(0, '#FAF3E1');
    grad.addColorStop(0.55, '#DFD2B8');
    grad.addColorStop(1, '#B3A286');

    ctx.fillStyle = grad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.4;

    ctx.beginPath();
    // Left twin condyle knobs
    ctx.moveTo(-len + 3, -3.5);
    ctx.arc(-len, -4.5, 4.6, 0.4, Math.PI * 1.6, true);
    ctx.arc(-len, 4.5, 4.6, -Math.PI * 0.6, Math.PI * 0.6, true);
    ctx.lineTo(len - 3, 3.5);
    // Right twin condyle knobs
    ctx.arc(len, 4.5, 4.6, Math.PI * 0.4, -Math.PI * 0.6, true);
    ctx.arc(len, -4.5, 4.6, Math.PI * 0.6, -Math.PI * 0.4, true);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Subtle bone shaft cel-highlight
    ctx.strokeStyle = 'rgba(255, 253, 245, 0.65)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-len + 6, -1.6);
    ctx.lineTo(len - 6, -1.6);
    ctx.stroke();

    ctx.restore();
  }

  _drawCrossedFemurs(ctx) {
    this._drawFemur(ctx, 0.64);
    this._drawFemur(ctx, -0.64);
  }

  _drawChibiSkull(ctx) {
    ctx.save();
    // Cast shadow from skull onto crossbones
    ctx.fillStyle = 'rgba(22, 16, 36, 0.36)';
    ctx.beginPath();
    ctx.ellipse(1.5, 3, 20.5, 19, 0, 0, Math.PI * 2);
    ctx.fill();

    // Expressive chunky chibi cranium + rounded jaw silhouette
    const skullGrad = ctx.createRadialGradient(-6, -8, 3, 0, 0, 23);
    skullGrad.addColorStop(0, '#FFFDF7');
    skullGrad.addColorStop(0.58, '#EFE6D2');
    skullGrad.addColorStop(0.88, '#D2C2A3');
    skullGrad.addColorStop(1, '#AE9C7D');

    ctx.fillStyle = skullGrad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(-11, 13);
    ctx.bezierCurveTo(-19, 10, -21, 1, -19, -8);
    ctx.bezierCurveTo(-17, -19, -7, -23, 0, -23);
    ctx.bezierCurveTo(7, -23, 17, -19, 19, -8);
    ctx.bezierCurveTo(21, 1, 19, 10, 11, 13);
    // Chunky jaw bottom
    ctx.lineTo(10, 20);
    ctx.quadraticCurveTo(0, 23, -10, 20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Soft forehead specular dome highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.beginPath();
    ctx.ellipse(-5.5, -13.5, 7.5, 4.2, -0.35, 0, Math.PI * 2);
    ctx.fill();

    // Cheekbone shading dimples
    ctx.fillStyle = 'rgba(155, 136, 106, 0.35)';
    ctx.beginPath();
    ctx.ellipse(-13.5, 6.5, 3.2, 2.2, 0.4, 0, Math.PI * 2);
    ctx.ellipse(13.5, 6.5, 3.2, 2.2, -0.4, 0, Math.PI * 2);
    ctx.fill();

    // Left eye socket (expressive big chibi dark socket)
    ctx.fillStyle = '#241933';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(-7.5, 0.5, 5.4, 5.8, -0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Subtle inner eye rim depth
    ctx.strokeStyle = 'rgba(175, 158, 130, 0.55)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(-7.5, 0.5, 6.6, 0.4, 2.5);
    ctx.stroke();

    // Cute inverted-heart nasal cavity
    ctx.fillStyle = '#241933';
    ctx.beginPath();
    ctx.moveTo(0, 3.2);
    ctx.bezierCurveTo(2.8, 6.2, 3.2, 9.2, 0.6, 8.8);
    ctx.lineTo(0, 7.8);
    ctx.lineTo(-0.6, 8.8);
    ctx.bezierCurveTo(-3.2, 9.2, -2.8, 6.2, 0, 3.2);
    ctx.closePath();
    ctx.fill();

    // Grinning teeth row with ONE gleaming gold tooth!
    const teeth = [
      { x: -8.2, w: 3.8, gold: false },
      { x: -4.2, w: 4.0, gold: false },
      { x: 0.0, w: 4.0, gold: true },
      { x: 4.2, w: 4.0, gold: false },
    ];
    for (const t of teeth) {
      if (t.gold) {
        const gGrad = ctx.createLinearGradient(t.x, 12.5, t.x + t.w, 19.5);
        gGrad.addColorStop(0, '#FFF5A6');
        gGrad.addColorStop(0.5, '#F5BD2E');
        gGrad.addColorStop(1, '#B3710D');
        ctx.fillStyle = gGrad;
      } else {
        ctx.fillStyle = '#F7F0DF';
      }
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.rect(t.x, 12.8, t.w, 6.8);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  _drawEyepatch(ctx) {
    ctx.save();
    // Diagonal black leather eyepatch strap across cranium
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 4.6;
    ctx.beginPath();
    ctx.moveTo(-16.5, -13);
    ctx.quadraticCurveTo(2, -7, 18.5, 3);
    ctx.stroke();

    ctx.strokeStyle = '#332B42';
    ctx.lineWidth = 2.4;
    ctx.stroke();

    // Chunky stitched black pirate eyepatch over right eye
    const px = 7.8;
    const py = 0.5;
    const patchGrad = ctx.createRadialGradient(px - 2, py - 2, 1, px, py, 7.5);
    patchGrad.addColorStop(0, '#463D59');
    patchGrad.addColorStop(0.7, '#272036');
    patchGrad.addColorStop(1, '#191324');

    ctx.fillStyle = patchGrad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(px, py, 6.8, 6.4, 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Cute pale X-stitch detail on eyepatch
    ctx.strokeStyle = '#D9CBB2';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(px - 2.3, py - 2.1);
    ctx.lineTo(px + 2.3, py + 2.1);
    ctx.moveTo(px + 2.3, py - 2.1);
    ctx.lineTo(px - 2.3, py + 2.1);
    ctx.stroke();
    ctx.restore();
  }

  _drawCracksAndWeathering(ctx) {
    // Weathered cranium fracture crack on upper-left temple
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-7, -21);
    ctx.lineTo(-5.5, -15.5);
    ctx.lineTo(-8.5, -12.5);
    ctx.lineTo(-7.2, -9.5);
    ctx.stroke();

    // Small fork off crack
    ctx.beginPath();
    ctx.moveTo(-5.5, -15.5);
    ctx.lineTo(-2.5, -14);
    ctx.stroke();
  }

  _drawGoldToothSparkle(ctx) {
    // Kawaii 4-point star glint right on the shiny gold tooth!
    ctx.save();
    ctx.translate(2.2, 15.2);
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = 'rgba(255, 224, 102, 0.9)';
    ctx.lineWidth = 0.8;
    const s = 5.4;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      const r = i % 2 === 0 ? s : s * 0.26;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

export default Skullpileobject;
