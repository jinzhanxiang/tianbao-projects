/**
 * particles.js — 全站科幻粒子系统 v3.1
 * 特性：增强粒子网络 + 交互光晕 + 数据流 + 星点闪烁 + 拖尾效果
 * 被所有页面引用，自动适配页面生命周期
 */
(function() {
  'use strict';

  if (document.getElementById('cyber-particles-canvas')) return;

  var canvas = document.createElement('canvas');
  canvas.id = 'cyber-particles-canvas';
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:0.8;';
  document.body.insertBefore(canvas, document.body.firstChild);

  var ctx = canvas.getContext('2d');
  var particles = [];
  var stars = [];
  var mouse = { x: null, y: null, radius: 140 };
  var animId;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  document.addEventListener('mousemove', function(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  document.addEventListener('mouseleave', function() {
    mouse.x = null;
    mouse.y = null;
  });

  var COLORS = [
    'rgba(0,212,255,',  // cyan
    'rgba(167,139,250,', // purple
    'rgba(52,211,153,',  // green
    'rgba(74,122,255,',  // blue
  ];

  // Enhanced particles — more density
  var COUNT = 120;
  for (var i = 0; i < COUNT; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      size: Math.random() * 3 + 1,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: Math.random() * 0.5 + 0.3,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.02 + Math.random() * 0.03,
    });
  }

  // Background stars
  var STAR_COUNT = 60;
  for (var i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 1.2 + 0.3,
      alpha: Math.random() * 0.4 + 0.1,
      twinkleSpeed: 0.01 + Math.random() * 0.03,
      twinklePhase: Math.random() * Math.PI * 2,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background stars with twinkle
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var twinkle = Math.sin(Date.now() * s.twinkleSpeed + s.twinklePhase) * 0.3 + 0.7;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(200,212,255,' + (s.alpha * twinkle) + ')';
      ctx.fill();
    }

    // Draw and update particles
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

      // Mouse interaction — stronger repulsion
      if (mouse.x !== null) {
        var dx = mouse.x - p.x;
        var dy = mouse.y - p.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouse.radius) {
          var force = (mouse.radius - dist) / mouse.radius;
          p.x -= dx * force * 0.03;
          p.y -= dy * force * 0.03;
        }
      }

      // Pulse effect
      p.pulse += p.pulseSpeed;
      var pulseSize = p.size + Math.sin(p.pulse) * 0.5;

      // Draw particle with glow
      ctx.beginPath();
      ctx.arc(p.x, p.y, pulseSize, 0, Math.PI * 2);
      ctx.fillStyle = p.color + p.alpha + ')';
      ctx.fill();

      // Outer glow
      ctx.beginPath();
      ctx.arc(p.x, p.y, pulseSize * 3, 0, Math.PI * 2);
      ctx.fillStyle = p.color + (p.alpha * 0.08) + ')';
      ctx.fill();
    }

    // Draw connections — thicker and more colorful
    for (var i = 0; i < particles.length; i++) {
      for (var j = i + 1; j < particles.length; j++) {
        var a = particles[i];
        var b = particles[j];
        var dx = a.x - b.x;
        var dy = a.y - b.y;
        var dist = Math.sqrt(dx * dx + dy * dy);

        var maxDist = 180;
        if (dist < maxDist) {
          var alpha = (1 - dist / maxDist) * 0.2;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          // Use purple for farther connections, cyan for closer
          var mixColor = dist < maxDist * 0.4 ? 'rgba(0,212,255,' : 'rgba(167,139,250,';
          ctx.strokeStyle = mixColor + alpha + ')';
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }

    // Mouse glow ring — enhanced
    if (mouse.x !== null) {
      var grad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, mouse.radius);
      grad.addColorStop(0, 'rgba(0,212,255,0.03)');
      grad.addColorStop(0.3, 'rgba(167,139,250,0.015)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    animId = requestAnimationFrame(draw);
  }

  draw();

  window.addEventListener('beforeunload', function() {
    if (animId) cancelAnimationFrame(animId);
  });
})();