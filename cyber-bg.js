// Ambient glow & cyber particle background canvas for lock/unlock screens
(function () {
  function attach(canvasId, screenId) {
    const cv = document.getElementById(canvasId);
    const screen = document.getElementById(screenId);
    if (!cv || !screen) return;
    const cx = cv.getContext('2d');

    function resize() {
      cv.width = window.innerWidth;
      cv.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const particles = [];
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        r: 1 + Math.random() * 2,
        alpha: 0.2 + Math.random() * 0.5
      });
    }

    function frame() {
      if (screen.classList.contains('hidden')) {
        requestAnimationFrame(frame);
        return;
      }
      const W = cv.width, H = cv.height;
      cx.fillStyle = 'rgba(2, 6, 10, 0.25)';
      cx.fillRect(0, 0, W, H);

      // Radial cyan glow
      const g = cx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, H * 0.6);
      g.addColorStop(0, 'rgba(0, 243, 255, 0.08)');
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      cx.fillStyle = g;
      cx.fillRect(0, 0, W, H);

      // Floating cyan particles & network lines
      particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;

        cx.fillStyle = `rgba(0, 243, 255, ${p.alpha})`;
        cx.beginPath();
        cx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        cx.fill();

        for (let j = idx + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 100) {
            cx.strokeStyle = `rgba(0, 243, 255, ${0.15 * (1 - dist / 100)})`;
            cx.lineWidth = 0.5;
            cx.beginPath();
            cx.moveTo(p.x, p.y);
            cx.lineTo(p2.x, p2.y);
            cx.stroke();
          }
        }
      });

      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  attach('lockBgCv', 'lockScreen');
  attach('unlockBgCv', 'unlockScreen');
  attach('termBgCv', 'terminalScreen');
})();

