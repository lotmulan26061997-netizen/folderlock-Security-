// Futuristic Sci-Fi Cyber Security Radar & Monitoring Background Canvas
(function () {
  const cv = document.getElementById('radarCanvas');
  if (!cv) return;
  const cx2d = cv.getContext('2d');

  function resize() {
    cv.width = window.innerWidth;
    cv.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  let angle = 0;
  const blips = [];
  for (let i = 0; i < 12; i++) {
    blips.push({
      a: Math.random() * Math.PI * 2,
      r: 0.12 + Math.random() * 0.38,
      size: 1.5 + Math.random() * 2.5,
      pulse: Math.random() * Math.PI,
      speed: (Math.random() - 0.5) * 0.003
    });
  }

  // Descending matrix binary & hex rain streams on margins
  const matrixCols = [];
  const matrixChars = '01XF#%&$<>[]{}@*!=';
  function initMatrix() {
    const colCount = Math.floor(window.innerWidth / 24);
    matrixCols.length = 0;
    for (let i = 0; i < colCount; i++) {
      if (i < 3 || i > colCount - 4) { // Only margins
        matrixCols.push({
          x: i * 24 + 10,
          y: Math.random() * -1000,
          speed: 1.5 + Math.random() * 3,
          length: 8 + Math.floor(Math.random() * 12)
        });
      }
    }
  }
  initMatrix();
  window.addEventListener('resize', initMatrix);

  function draw() {
    const W = cv.width, H = cv.height;
    cx2d.fillStyle = 'rgba(4, 8, 12, 0.32)';
    cx2d.fillRect(0, 0, W, H);

    const cx = W * 0.5, cy = H * 0.45;
    const R = Math.min(W, H) * 0.36;

    // Grid lines with tech coordinates
    cx2d.strokeStyle = 'rgba(0, 243, 255, 0.05)';
    cx2d.lineWidth = 1;
    for (let x = 0; x < W; x += 40) {
      cx2d.beginPath(); cx2d.moveTo(x, 0); cx2d.lineTo(x, H); cx2d.stroke();
    }
    for (let y = 0; y < H; y += 40) {
      cx2d.beginPath(); cx2d.moveTo(0, y); cx2d.lineTo(W, y); cx2d.stroke();
    }

    // Concentric Radar HUD Rings & Heading Marks
    for (let i = 1; i <= 4; i++) {
      const r = R * (i / 4);
      cx2d.beginPath();
      cx2d.arc(cx, cy, r, 0, Math.PI * 2);
      cx2d.strokeStyle = i === 4 ? 'rgba(0, 243, 255, 0.25)' : `rgba(0, 243, 255, ${0.04 + i * 0.03})`;
      cx2d.lineWidth = i === 4 ? 1.5 : 0.8;
      cx2d.stroke();
    }

    // Crosshairs
    cx2d.strokeStyle = 'rgba(0, 243, 255, 0.12)';
    cx2d.beginPath();
    cx2d.moveTo(cx - R * 1.1, cy); cx2d.lineTo(cx + R * 1.1, cy);
    cx2d.moveTo(cx, cy - R * 1.1); cx2d.lineTo(cx, cy + R * 1.1);
    cx2d.stroke();

    // Radar Blips with Glowing Rings
    blips.forEach((b) => {
      b.a += b.speed;
      b.pulse += 0.04;
      const x = cx + Math.cos(b.a) * b.r * R;
      const y = cy + Math.sin(b.a) * b.r * R;
      
      const pSize = b.size + Math.sin(b.pulse) * 1.5;
      cx2d.fillStyle = 'rgba(0, 243, 255, 0.6)';
      cx2d.beginPath();
      cx2d.arc(x, y, pSize, 0, Math.PI * 2);
      cx2d.fill();

      cx2d.strokeStyle = 'rgba(0, 243, 255, 0.25)';
      cx2d.beginPath();
      cx2d.arc(x, y, pSize * 2.5, 0, Math.PI * 2);
      cx2d.stroke();
    });

    // Rotating Radar Sweep Fan
    angle = (angle + 0.008) % (Math.PI * 2);
    const trailLen = Math.PI * 0.45;
    for (let t = 0; t < 25; t++) {
      const a = angle - (t / 25) * trailLen;
      const alpha = (1 - t / 25) * 0.1;
      cx2d.beginPath();
      cx2d.moveTo(cx, cy);
      cx2d.arc(cx, cy, R, a, a + 0.025);
      cx2d.closePath();
      cx2d.fillStyle = `rgba(0, 243, 255, ${alpha})`;
      cx2d.fill();
    }

    // Matrix Rain Stream on Margins
    cx2d.font = '10px "Share Tech Mono", monospace';
    matrixCols.forEach((col) => {
      col.y += col.speed;
      if (col.y > H + 100) col.y = -200;
      for (let j = 0; j < col.length; j++) {
        const charY = col.y - j * 14;
        if (charY > 0 && charY < H) {
          const char = matrixChars[Math.floor((col.y + j) % matrixChars.length)];
          cx2d.fillStyle = j === 0 ? 'rgba(255, 255, 255, 0.85)' : `rgba(0, 243, 255, ${0.4 - j * 0.03})`;
          cx2d.fillText(char, col.x, charY);
        }
      }
    });

    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
})();
