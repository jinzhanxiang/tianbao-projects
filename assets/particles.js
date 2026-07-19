/**
 * particles.js — 共享粒子系统 + 科幻效果
 * 用法: 在页面中引入 <script src="assets/particles.js"></script>
 * 自动初始化，无需手动调用。
 */
(function() {
  'use strict';

  // ─── 1. 粒子系统 ───
  function initParticles() {
    // 检查是否已有粒子 canvas
    if (document.getElementById('hermes-particles')) return;
    const canvas = document.createElement('canvas');
    canvas.id = 'hermes-particles';
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:0;pointer-events:none';
    document.body.prepend(canvas);

    const ctx = canvas.getContext('2d');
    let particles = [];
    let w, h, animationId;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    class Particle {
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.size = Math.random() * 1.5 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = (Math.random() - 0.5) * 0.3;
        this.opacity = Math.random() * 0.35 + 0.08;
        this.hue = Math.random() < 0.55 ? 190 : 260;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x < 0 || this.x > w) this.speedX *= -1;
        if (this.y < 0 || this.y > h) this.speedY *= -1;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.hue}, 80%, 60%, ${this.opacity})`;
        ctx.fill();
      }
    }

    const count = Math.min(100, Math.floor(w * h / 14000));
    for (let i = 0; i < count; i++) particles.push(new Particle());

    let connections = [];
    function updateConnections() {
      connections = [];
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) connections.push({ i, j, opacity: (1 - dist / 150) * 0.12 });
        }
      }
    }

    function animate() {
      ctx.clearRect(0, 0, w, h);
      particles.forEach(p => { p.update(); p.draw(); });
      connections.forEach(c => {
        ctx.beginPath();
        ctx.moveTo(particles[c.i].x, particles[c.i].y);
        ctx.lineTo(particles[c.j].x, particles[c.j].y);
        ctx.strokeStyle = `rgba(0,212,255,${c.opacity})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      });
      updateConnections();
      animationId = requestAnimationFrame(animate);
    }
    animate();
  }

  // ─── 2. 扫描线 ───
  function initScanline() {
    if (document.getElementById('hermes-scanline')) return;
    const div = document.createElement('div');
    div.id = 'hermes-scanline';
    div.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:1;pointer-events:none;' +
      'background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,212,255,0.012) 2px,rgba(0,212,255,0.012) 4px)';
    const beam = document.createElement('div');
    beam.style.cssText = 'position:absolute;top:-5%;left:0;width:100%;height:5%;' +
      'background:linear-gradient(180deg,transparent,rgba(0,212,255,0.03),transparent);' +
      'animation:hermesScanMove 4s linear infinite';
    div.appendChild(beam);
    document.body.prepend(div);

    // Add keyframes if not already defined
    if (!document.getElementById('hermes-scan-keyframes')) {
      const style = document.createElement('style');
      style.id = 'hermes-scan-keyframes';
      style.textContent = '@keyframes hermesScanMove{0%{top:-5%}100%{top:105%}}';
      document.head.appendChild(style);
    }
  }

  // ─── 3. 数据流浮动粒子 ───
  function initDataFlow(container) {
    if (!container) return;
    for (let i = 0; i < 10; i++) {
      const dot = document.createElement('div');
      dot.style.cssText = 'position:absolute;width:2px;height:2px;background:#00d4ff;border-radius:50%;' +
        `left:${Math.random()*100}%;top:${Math.random()*100}%;` +
        `animation:hermesFloat ${4+Math.random()*4}s ease-in-out ${Math.random()*6}s infinite;opacity:0`;
      container.appendChild(dot);
    }
    // Add keyframes
    if (!document.getElementById('hermes-float-keyframes')) {
      const style = document.createElement('style');
      style.id = 'hermes-float-keyframes';
      style.textContent = '@keyframes hermesFloat{0%{opacity:0;transform:translateY(0) translateX(0)}20%{opacity:0.5}80%{opacity:0.5}100%{opacity:0;transform:translateY(-150px) translateX(20px)}}';
      document.head.appendChild(style);
    }
  }

  // ─── 4. 自动初始化 ───
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initParticles();
      initScanline();
    });
  } else {
    initParticles();
    initScanline();
  }

  // Expose for manual use
  window.HermesFX = { initParticles, initScanline, initDataFlow };
})();