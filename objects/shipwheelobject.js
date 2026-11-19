/**
 * Broken Captain's Helm Wheel (Top-Down Expressive Chibi Static Prop)
 * Native HTML5 Canvas 2D API — Zero External Dependencies
 */

const OUTLINE = '#1E142B';

export class Shipwheelobject {
  static metadata = {
    name: "Broken Captain's Helm Wheel",
    category: 'object',
    baseLength: 82,
    baseWidth: 82,
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
    this._drawSpokesAndHandles(ctx);
    this._drawMahoganyRim(ctx);
    this._drawSnappedSpokeSplinters(ctx);
    this._drawBrassHub(ctx);
    this._drawStarGlint(ctx);

    ctx.restore();
  }

  _drawAmbientShadow(ctx) {
    const grad = ctx.createRadialGradient(0, 4, 6, 0, 4, 42);
    grad.addColorStop(0, 'rgba(16, 12, 32, 0.5)');
    grad.addColorStop(0.68, 'rgba(16, 12, 32, 0.22)');
    grad.addColorStop(1, 'rgba(16, 12, 32, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 4, 40, 39, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawSpokesAndHandles(ctx) {
    // 8 mahogany spokes around wheel; spoke index 1 (upper-right) is realistically snapped!
    const brokenIndex = 1;
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4 - Math.PI / 2;
      ctx.save();
      ctx.rotate(a);

      if (i === brokenIndex) {
        // Short jagged splintered inner spoke stub only
        const stubGrad = ctx.createLinearGradient(0, -3, 0, 3);
        stubGrad.addColorStop(0, '#B86636');
        stubGrad.addColorStop(1, '#6E3216');
        ctx.fillStyle = stubGrad;
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(6, -3.2);
        ctx.lineTo(17, -2.8);
        ctx.lineTo(20, -0.8);
        ctx.lineTo(16, 1.2);
        ctx.lineTo(19, 3.0);
        ctx.lineTo(6, 3.2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Pale splintered wood tip
        ctx.fillStyle = '#E8BE82';
        ctx.beginPath();
        ctx.moveTo(16, -2.3);
        ctx.lineTo(20, -0.8);
        ctx.lineTo(16, 1.2);
        ctx.lineTo(19, 2.5);
        ctx.lineTo(14.5, 2.0);
        ctx.closePath();
        ctx.fill();
      } else {
        // Full turned mahogany spoke + ergonomic grip handle extending past rim
        const spokeGrad = ctx.createLinearGradient(0, -3.5, 0, 3.5);
        spokeGrad.addColorStop(0, '#C97442');
        spokeGrad.addColorStop(0.5, '#9A4D24');
        spokeGrad.addColorStop(1, '#612B11');

        ctx.fillStyle = spokeGrad;
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 2.2;

        // Inner spoke shaft + outer turned grip bulge
        ctx.beginPath();
        ctx.moveTo(6, -3.1);
        ctx.lineTo(29, -2.5);
        ctx.quadraticCurveTo(33.5, -4.4, 37.5, -2.6);
        ctx.quadraticCurveTo(40, 0, 37.5, 2.6);
        ctx.quadraticCurveTo(33.5, 4.4, 29, 2.5);
        ctx.lineTo(6, 3.1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Turned grip ring collar & brass finial cap on handle tip
        ctx.fillStyle = '#E8B642';
        ctx.beginPath();
        ctx.arc(38.2, 0, 2.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Specular wood highlight along handle bulge
        ctx.strokeStyle = 'rgba(255, 224, 182, 0.55)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(31, -1.6);
        ctx.lineTo(35.5, -1.5);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  _drawMahoganyRim(ctx) {
    ctx.save();
    const rOuter = 27.5;
    const rInner = 20.5;
    const rMid = (rOuter + rInner) / 2;

    // Chunky mahogany wheel rim ring (drawn as thick stroke with crisp inner/outer dark outlines)
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 11.6;
    ctx.beginPath();
    ctx.arc(0, 0, rMid, 0, Math.PI * 2);
    ctx.stroke();

    const rimGrad = ctx.createRadialGradient(-8, -8, 6, 0, 0, rOuter);
    rimGrad.addColorStop(0, '#D47F4A');
    rimGrad.addColorStop(0.55, '#9E4E24');
    rimGrad.addColorStop(1, '#632B10');

    ctx.strokeStyle = rimGrad;
    ctx.lineWidth = 6.8;
    ctx.beginPath();
    ctx.arc(0, 0, rMid, 0, Math.PI * 2);
    ctx.stroke();

    // Wood grain curve & felloes plank joinery seams + brass rivets
    ctx.strokeStyle = 'rgba(30, 20, 43, 0.55)';
    ctx.lineWidth = 1.3;
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4 + Math.PI / 8;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * (rInner + 0.5), Math.sin(a) * (rInner + 0.5));
      ctx.lineTo(Math.cos(a) * (rOuter - 0.5), Math.sin(a) * (rOuter - 0.5));
      ctx.stroke();

      // Brass bolt head on each spoke-rim junction
      const sa = (i * Math.PI) / 4 - Math.PI / 2;
      if (i !== 1) {
        ctx.fillStyle = '#F0C24A';
        ctx.strokeStyle = OUTLINE;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(Math.cos(sa) * rMid, Math.sin(sa) * rMid, 1.9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }

    // Crisp upper-left rim specular highlight arc
    ctx.strokeStyle = 'rgba(255, 224, 185, 0.52)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, rMid + 1.2, -2.6, -1.2);
    ctx.stroke();

    ctx.restore();
  }

  _drawSnappedSpokeSplinters(ctx) {
    ctx.save();
    // Small jagged splinter notch & broken handle stub on the rim at spoke index 1 (-PI/4)
    ctx.rotate(-Math.PI / 4);
    ctx.fillStyle = '#E8BE82';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(27, -2.8);
    ctx.lineTo(31.5, -1.6);
    ctx.lineTo(29.2, 0.5);
    ctx.lineTo(32.2, 2.2);
    ctx.lineTo(27, 2.8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  _drawBrassHub(ctx) {
    ctx.save();
    // Chunky ornate central brass hub plate
    const hubGrad = ctx.createRadialGradient(-3.5, -3.5, 1.5, 0, 0, 11.5);
    hubGrad.addColorStop(0, '#FFF3A8');
    hubGrad.addColorStop(0.5, '#E8B135');
    hubGrad.addColorStop(1, '#9E6410');

    ctx.fillStyle = hubGrad;
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Inner recessed iron axle cap
    const capGrad = ctx.createRadialGradient(-1.5, -1.5, 0.5, 0, 0, 5.2);
    capGrad.addColorStop(0, '#8A98AE');
    capGrad.addColorStop(0.65, '#4A5468');
    capGrad.addColorStop(1, '#262C38');
    ctx.fillStyle = capGrad;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 4.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 6 tiny decorative brass bolts around hub collar
    ctx.fillStyle = '#FFF0A0';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 8, Math.sin(a) * 8, 1.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  _drawStarGlint(ctx) {
    ctx.save();
    ctx.translate(-5.5, -5.5);
    ctx.fillStyle = '#FFFFFF';
    const s = 4.6;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      const r = i % 2 === 0 ? s : s * 0.25;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

export default Shipwheelobject;
