/* responsive-tables.js
 * 通用移动端表格响应式处理
 * - 屏幕 < 768px：表格包裹在横滑容器内，可左右滑动
 * - 屏幕 < 480px：表格转换为「卡片列表」（每行→一张卡片）
 * 自动适配，不需修改原 HTML 结构
 */
(function() {
  if (typeof window === 'undefined') return;

  // 移动端判断（也兼容 iPad 横屏）
  function isMobile() {
    return window.innerWidth <= 768;
  }
  function isSmallMobile() {
    return window.innerWidth <= 480;
  }

  // 折叠表格为卡片列表（仅极小屏幕）
  function collapseTablesToCards() {
    if (!isSmallMobile()) {
      // 极小屏幕但未启用，先恢复原表格
      document.querySelectorAll('table').forEach(function(t) {
        if (t.dataset.origHtml !== undefined) {
          t.outerHTML = t.dataset.origHtml;
        }
      });
      document.querySelectorAll('.table-cards-replacement').forEach(function(el) {
        el.remove();
      });
      return;
    }

    // 单次循环处理 - 仅标记 collapsed 状态
    // 注：实际折叠在 showCardsIfSmall 中处理
    document.querySelectorAll('table').forEach(function(t) {
      if (t.dataset.collapsed) return;

      // 跳过已经是 card-table 类的（summary.html 特殊表）
      // 跳过 colspan 表格（通常是表头行）
      if (t.querySelector('th[colspan]') && t.querySelectorAll('tr').length <= 2) return;

      var headers = [];
      var headerCells = t.querySelectorAll('thead th');
      headerCells.forEach(function(th) { headers.push(th.textContent.trim()); });

      // 如果没有 thead，尝试第一行作为表头
      if (headers.length === 0) {
        var firstRow = t.querySelector('tr');
        if (firstRow) {
          firstRow.querySelectorAll('th, td').forEach(function(c) {
            headers.push(c.textContent.trim());
          });
        }
      }
      if (headers.length === 0) return;

      // 收集数据行
      var rows = [];
      var trs = t.querySelectorAll('tbody tr');
      if (trs.length === 0) trs = t.querySelectorAll('tr');
      // 跳过表头
      if (t.querySelector('thead')) trs = t.querySelectorAll('tbody tr');
      else trs = Array.from(t.querySelectorAll('tr')).slice(1);

      trs.forEach(function(tr) {
        var cells = tr.querySelectorAll('td');
        if (cells.length === 0) return;
        var row = {};
        cells.forEach(function(c, i) {
          row[headers[i] || ('col' + i)] = c.innerHTML;
        });
        rows.push(row);
      });

      // 不再深处理：仅标记 + 等真正切换的函数执行（避免重复构建）
      t.dataset.collapsed = '1';
      t.dataset.headers = JSON.stringify(headers);
      t.dataset.dataRows = JSON.stringify(rows);
    });
  }

  // 把折叠后的表格替换为卡片列表
  function showCardsIfSmall() {
    // 移除之前替换的卡片列表
    document.querySelectorAll('.table-cards-replacement').forEach(function(el) {
      el.remove();
    });

    if (!isSmallMobile()) {
      // 把被替换的 table 恢复（如果存在 origHtml）
      document.querySelectorAll('table[data-orig-html]').forEach(function(t) {
        if (!t.parentNode) {
          // 已从 DOM 移除，跳过
          return;
        }
        // 包裹在原容器内
      });
      return;
    }

    document.querySelectorAll('table[data-collapsed="1"]').forEach(function(t) {
      // 避免重复替换
      if (t.dataset.replaced === '1') return;
      t.dataset.replaced = '1';

      var headers = JSON.parse(t.dataset.headers || '[]');
      var rows = JSON.parse(t.dataset.dataRows || '[]');

      var container = document.createElement('div');
      container.className = 'table-cards-replacement';
      container.style.cssText = 'margin:14px 0;display:flex;flex-direction:column;gap:10px';

      rows.forEach(function(row) {
        var card = document.createElement('div');
        card.style.cssText = 'background:#f7fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px 14px;font-size:14px';

        var html = '<div style="font-weight:700;color:#1a365d;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #e2e8f0;font-size:15px">' + (row[headers[0]] || '—') + '</div>';

        for (var i = 1; i < headers.length; i++) {
          var headerLabel = headers[i];
          var cellValue = row[headerLabel] || '—';
          html += '<div style="display:flex;gap:8px;margin-bottom:6px;line-height:1.55"><span style="color:#718096;flex:0 0 80px;font-size:12px;text-align:right">' + headerLabel + '</span><span style="flex:1;word-break:break-word">' + cellValue + '</span></div>';
        }

        card.innerHTML = html;
        container.appendChild(card);
      });

      // 把 table 替换为 container
      t.style.display = 'none';
      t.parentNode.insertBefore(container, t.nextSibling);
    });
  }

  // 给所有表格加横向滚动包裹（中等屏幕如平板 768-1024）
  function wrapTablesForScroll() {
    document.querySelectorAll('table').forEach(function(t) {
      // 跳过已经被替换为卡片列表的
      if (t.style.display === 'none') return;
      // 跳过已包裹的
      if (t.parentNode && t.parentNode.classList.contains('table-scroll-wrapper')) return;

      var wrapper = document.createElement('div');
      wrapper.className = 'table-scroll-wrapper';
      wrapper.style.cssText = 'overflow-x:auto;-webkit-overflow-scrolling:touch;margin:14px 0;border-radius:8px;border:1px solid #e2e8f0';

      t.parentNode.insertBefore(wrapper, t);
      wrapper.appendChild(t);
    });
  }

  // 主入口：iPad / 手机宽度给表格加横滑
  function processTables() {
    document.querySelectorAll('table').forEach(function(t) {
      if (t.dataset.processed) return;
      t.dataset.processed = '1';
    });

    // 中等屏幕：加横滑
    if (window.innerWidth <= 1024 && window.innerWidth > 480) {
      wrapTablesForScroll();
    }

    // 极小屏幕：折叠为卡片列表
    if (isSmallMobile()) {
      collapseTablesToCards();
      showCardsIfSmall();
    } else {
      // 恢复
      document.querySelectorAll('.table-cards-replacement').forEach(function(el) { el.remove(); });
      document.querySelectorAll('table[data-replaced="1"]').forEach(function(t) {
        t.style.display = '';
        t.dataset.replaced = '0';
      });
    }
  }

  // 防抖
  var resizeTimer;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(processTables, 200);
  }

  // 初始化（DOM ready 后）
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', processTables);
  } else {
    processTables();
  }

  window.addEventListener('resize', onResize);
})();
