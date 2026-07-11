/* ============================================================
 * dark_toggle.js — V11j 深浅色切换器（2026-07-11）
 * 适配：tianbao-projects/assets/report.css V11j
 *
 * 特性：
 *   - 自动注入切换按钮（无需修改 HTML）
 *   - localStorage 记忆用户选择
 *   - 跟随系统 prefers-color-scheme
 *   - 打印模式自动隐藏按钮
 *   - SVG 双图（chart-light / chart-dark）自动切换
 *
 * 用法：
 *   在报告 HTML 的 </body> 之前引入：
 *   <script src="https://jinzhanxiang.github.io/tianbao-projects/assets/dark_toggle.js"></script>
 * ============================================================ */

(function () {
  'use strict';

  // ---- 1. 读取用户偏好（localStorage > 系统 > 默认浅色） ----
  const STORAGE_KEY = 'tianbao-dark-mode';
  function getPreferred() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) return stored === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  // ---- 2. 应用模式 ----
  function applyDark(dark) {
    if (dark) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    updateBtn(dark);
  }

  // ---- 3. 更新按钮文字 ----
  function updateBtn(dark) {
    const btn = document.getElementById('dark-toggle-btn');
    if (!btn) return;
    btn.innerHTML = dark ? '☀️ 浅色' : '🌙 深色';
    btn.setAttribute('aria-label', dark ? '切换到浅色模式' : '切换到深色模式');
    btn.title = dark ? '切换到浅色模式' : '切换到深色模式';
  }

  // ---- 4. 创建按钮 ----
  function createBtn() {
    if (document.getElementById('dark-toggle-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'dark-toggle-btn';
    btn.className = 'dark-toggle';
    btn.type = 'button';
    btn.onclick = function () {
      const isDark = document.body.classList.contains('dark-mode');
      const next = !isDark;
      applyDark(next);
      try { localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light'); } catch (e) {}
    };
    document.body.appendChild(btn);
  }

  // ---- 5. 启动 ----
  function init() {
    if (!document.body) {
      // body 还未就绪（极早加载），等待
      document.addEventListener('DOMContentLoaded', init);
      return;
    }
    createBtn();
    applyDark(getPreferred());
  }

  // ---- 6. 监听系统主题变化（仅在用户未手动设置时） ----
  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener && mq.addEventListener('change', function (e) {
      if (localStorage.getItem(STORAGE_KEY) === null) {
        applyDark(e.matches);
      }
    });
  }

  // ---- 启动 ----
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();