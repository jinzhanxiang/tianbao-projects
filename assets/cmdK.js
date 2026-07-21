// cmdK.js · v3.5 · ⌘K 全局命令面板 + counter-up + 3D 倾斜
// 由 index / page / detail / all_reports 4 页共享引入
(function(){
  'use strict';

  // ============ 工具：counter-up 数字滚动 ============
  function counterUp(el, target, opts){
    opts = opts || {};
    var duration = opts.duration || 1200;
    var start = performance.now();
    var from = 0;
    var isInt = Number.isInteger(target);
    function tick(now){
      var t = Math.min(1, (now - start) / duration);
      // easeOutCubic
      var eased = 1 - Math.pow(1 - t, 3);
      var v = from + (target - from) * eased;
      el.textContent = isInt ? Math.round(v) : v.toFixed(1);
      if(t < 1) requestAnimationFrame(tick);
      else el.textContent = isInt ? target : target.toFixed(1);
    }
    requestAnimationFrame(tick);
  }
  function counterUpAll(){
    document.querySelectorAll('[data-counter-up]').forEach(function(el){
      var t = parseFloat(el.getAttribute('data-counter-up'));
      if(!isNaN(t)) counterUp(el, t, {duration: 1100});
    });
  }

  // ============ 工具：3D 倾斜 ============
  function bindTilt(selector, opts){
    opts = opts || {};
    var max = opts.max || 5; // 最大倾斜角度
    document.querySelectorAll(selector).forEach(function(el){
      if(el.dataset.tiltBound) return;
      el.dataset.tiltBound = '1';
      el.style.transformStyle = 'preserve-3d';
      el.style.willChange = 'transform';
      el.style.transition = 'transform .15s ease-out, box-shadow .2s';
      el.addEventListener('mousemove', function(e){
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;  // 0~1
        var py = (e.clientY - r.top) / r.height;  // 0~1
        var rx = (py - 0.5) * -2 * max;
        var ry = (px - 0.5) * 2 * max;
        el.style.transform = 'perspective(800px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) translateY(-3px)';
        el.style.boxShadow = '0 12px 28px rgba(26,26,26,.12), 0 2px 8px rgba(192,57,43,.18)';
      });
      el.addEventListener('mouseleave', function(){
        el.style.transform = '';
        el.style.boxShadow = '';
      });
    });
  }
  function tiltAll(){
    bindTilt('.v3-rtl-i');
    bindTilt('.v3-ar-item');
    bindTilt('.v3-recent-card', {max: 4});
    bindTilt('.v3-entry', {max: 4});
  }

  // ============ ⌘K 全局搜索面板 ============
  function ensurePanel(){
    if(document.getElementById('cmdkPanel')) return;
    var css = document.createElement('style');
    css.id = 'cmdkCss';
    css.textContent = [
      '#cmdkPanel{position:fixed;inset:0;background:rgba(26,26,26,.55);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);z-index:9999;display:none;align-items:flex-start;justify-content:center;padding:14vh 24px 24px;animation:fadeIn .18s}',
      '#cmdkPanel.open{display:flex}',
      '#cmdkBox{background:var(--paper,#FFFCF0);border:1px solid var(--border,rgba(26,26,26,.18));border-radius:12px;width:100%;max-width:680px;box-shadow:0 24px 64px rgba(0,0,0,.35);overflow:hidden;animation:slideDown .2s cubic-bezier(.2,.8,.2,1)}',
      '#cmdkInput{width:100%;padding:18px 22px;font-size:18px;font-family:"FangSong","STFangsong",serif;background:transparent;border:none;border-bottom:1px solid var(--border,rgba(26,26,26,.18));color:var(--ink,#1A1A1A);outline:none}',
      '#cmdkInput::placeholder{color:var(--ink-3,#6B6B6B);font-family:"FangSong","STFangsong",serif}',
      '#cmdkList{max-height:54vh;overflow-y:auto;padding:8px 0}',
      '#cmdkEmpty{padding:32px 22px;text-align:center;color:var(--ink-3,#6B6B6B);font-family:"FangSong",serif;font-size:14px;text-indent:0}',
      '.cmdkItem{display:flex;align-items:center;gap:12px;padding:11px 22px;cursor:pointer;transition:.1s;border-left:3px solid transparent;text-decoration:none;color:inherit}',
      '.cmdkItem:hover,.cmdkItem.active{background:rgba(192,57,43,.06);border-left-color:var(--seal,#C0392B)}',
      '.cmdkItem.active{background:rgba(192,57,43,.1)}',
      '.cmdkEmoji{font-size:18px;flex-shrink:0;width:22px;text-align:center}',
      '.cmdkMain{flex:1;min-width:0}',
      '.cmdkName{font-family:"FangSong",serif;font-size:15px;font-weight:700;color:var(--ink,#1A1A1A);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.cmdkSub{font-size:11px;color:var(--ink-3,#6B6B6B);margin-top:2px;font-family:ui-monospace,monospace;letter-spacing:.5px}',
      '.cmdkBadge{font-size:10px;padding:2px 8px;border-radius:4px;font-weight:700;letter-spacing:1px;flex-shrink:0;background:var(--chip-bg,rgba(21,101,192,.08));color:var(--blue,#1565C0)}',
      '#cmdkFoot{padding:8px 22px;border-top:1px dashed var(--border,rgba(26,26,26,.18));font-size:11px;color:var(--ink-3,#6B6B6B);font-family:ui-monospace,monospace;display:flex;gap:14px;align-items:center}',
      '#cmdkFoot kbd{display:inline-block;padding:1px 6px;background:var(--bg-2,#EFE6CF);border:1px solid var(--border,rgba(26,26,26,.18));border-radius:3px;font-family:ui-monospace,monospace;font-size:10px;color:var(--ink,#1A1A1A)}',
      '@keyframes fadeIn{from{opacity:0}to{opacity:1}}',
      '@keyframes slideDown{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)}}',
      '@media (max-width:760px){#cmdkPanel{padding:8vh 16px 16px}#cmdkInput{padding:14px 18px;font-size:16px}}'
    ].join('');
    document.head.appendChild(css);

    var panel = document.createElement('div');
    panel.id = 'cmdkPanel';
    panel.innerHTML = [
      '<div id="cmdkBox">',
        '<input id="cmdkInput" placeholder="搜索项目 / 行业 / 报告标题... (Esc 关闭)" autocomplete="off" spellcheck="false">',
        '<div id="cmdkList"><div id="cmdkEmpty">输入关键字开始搜索</div></div>',
        '<div id="cmdkFoot"><kbd>↑↓</kbd> 切换 · <kbd>Enter</kbd> 跳转 · <kbd>Esc</kbd> 关闭</div>',
      '</div>'
    ].join('');
    document.body.appendChild(panel);
  }

  var _index = []; // [{kind, code, name, sub, url, badge, emoji, score}]
  function rebuildIndex(){
    _index = [];
    try {
      // 项目
      (window.PROJECTS || []).forEach(function(p){
        _index.push({
          kind: 'project',
          code: p.code,
          name: p.name_cn || p.code,
          sub: (p.industry || '') + ' · ' + (p.stage_v3 || '') + ' · ' + (p.iss || ''),
          url: 'detail.html?code=' + encodeURIComponent(p.code),
          badge: p.code,
          emoji: emojiFor(p.industry),
          keywords: (p.name_cn + ' ' + p.code + ' ' + (p.industry||'') + ' ' + (p.name_full||'')).toLowerCase()
        });
      });
      // 报告（按 code 索引）
      var REPORTS = window.REPORTS || {};
      Object.keys(REPORTS).forEach(function(code){
        var proj = (window.PROJECTS || []).find(function(x){return x.code===code;});
        var projName = proj ? proj.name_cn : code;
        (REPORTS[code] || []).forEach(function(r){
          _index.push({
            kind: 'report',
            code: code,
            name: r.title || '(无标题)',
            sub: projName + ' · ' + (r.date||'') + ' · ' + (r.category||'未分类'),
            url: r.url || ('detail.html?code=' + encodeURIComponent(code)),
            badge: r.category || '报告',
            emoji: '📄',
            keywords: (r.title + ' ' + projName + ' ' + (r.category||'')).toLowerCase()
          });
        });
      });
    } catch(e){ console.warn('cmdK index build failed', e); }
  }

  function emojiFor(industry){
    if(!industry) return '🏢';
    if(industry.includes('电池')) return '🔋';
    if(industry.includes('医疗')) return '🏥';
    if(industry.includes('芯片')) return '💎';
    if(industry.includes('航天')) return '🛰️';
    if(industry.includes('数据')) return '🖥️';
    if(industry.includes('智能体')) return '🧠';
    if(industry.includes('碳纤维') || industry.includes('材料')) return '⚙️';
    if(industry.includes('电驱')) return '⚡';
    return '🏢';
  }

  function score(item, q){
    if(!q) return 1;
    var name = item.name.toLowerCase();
    var kw = item.keywords;
    if(name.startsWith(q)) return 100;
    if(name.includes(q)) return 60;
    if(kw.includes(q)) return 30;
    // 行业 / 类目
    if((item.sub||'').toLowerCase().includes(q)) return 20;
    return 0;
  }

  var _activeIdx = 0;
  var _results = [];
  function render(q){
    if(!q){ _results = []; _activeIdx = 0; renderList(); return; }
    var ql = q.toLowerCase().trim();
    _results = _index
      .map(function(it){ return {it:it, s:score(it, ql)}; })
      .filter(function(x){ return x.s > 0; })
      .sort(function(a,b){ return b.s - a.s; })
      .slice(0, 30)
      .map(function(x){ return x.it; });
    _activeIdx = 0;
    renderList();
  }

  function renderList(){
    var host = document.getElementById('cmdkList');
    if(!host) return;
    if(!_results.length){
      var q = (document.getElementById('cmdkInput')||{}).value || '';
      host.innerHTML = '<div id="cmdkEmpty">' + (q ? '无匹配项 · 试试别的关键字' : '输入关键字开始搜索') + '</div>';
      return;
    }
    host.innerHTML = _results.map(function(it, i){
      return '<a class="cmdkItem' + (i===_activeIdx?' active':'') + '" data-idx="' + i + '" href="' + it.url + '" target="' + (it.kind==='report'?'_blank':'_self') + '" rel="noopener">'
        + '<span class="cmdkEmoji">' + it.emoji + '</span>'
        + '<div class="cmdkMain"><div class="cmdkName">' + escapeHtml(it.name) + '</div><div class="cmdkSub">' + escapeHtml(it.sub) + '</div></div>'
        + '<span class="cmdkBadge">' + escapeHtml(it.badge||'') + '</span>'
        + '</a>';
    }).join('');
    host.querySelectorAll('.cmdkItem').forEach(function(el){
      el.addEventListener('mouseenter', function(){
        _activeIdx = parseInt(el.dataset.idx, 10) || 0;
        updateActive();
      });
      el.addEventListener('click', function(e){
        // 允许默认跳转，但同时关闭面板
        closePanel();
      });
    });
    // 滚动到 active
    var act = host.querySelector('.cmdkItem.active');
    if(act) act.scrollIntoView({block:'nearest'});
  }

  function updateActive(){
    var items = document.querySelectorAll('.cmdkItem');
    items.forEach(function(el, i){
      el.classList.toggle('active', i === _activeIdx);
    });
  }

  function escapeHtml(s){return (s||'').replace(/[&<>"']/g,c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));}

  function openPanel(){
    ensurePanel();
    rebuildIndex();
    var panel = document.getElementById('cmdkPanel');
    var input = document.getElementById('cmdkInput');
    panel.classList.add('open');
    input.value = '';
    input.focus();
    render('');
  }
  function closePanel(){
    var panel = document.getElementById('cmdkPanel');
    if(panel) panel.classList.remove('open');
  }
  function isOpen(){ var p=document.getElementById('cmdkPanel'); return p && p.classList.contains('open'); }

  function bindKeys(){
    document.addEventListener('keydown', function(e){
      // ⌘K / Ctrl+K
      var isMac = navigator.platform.toUpperCase().includes('MAC');
      if((isMac && e.metaKey && e.key.toLowerCase()==='k') || (!isMac && e.ctrlKey && e.key.toLowerCase()==='k')){
        e.preventDefault();
        if(isOpen()) closePanel(); else openPanel();
        return;
      }
      // 仅在面板打开时处理其他键
      if(!isOpen()) return;
      if(e.key === 'Escape'){ e.preventDefault(); closePanel(); return; }
      if(e.key === 'ArrowDown'){
        e.preventDefault();
        if(_results.length){ _activeIdx = (_activeIdx+1) % _results.length; updateActive(); }
        return;
      }
      if(e.key === 'ArrowUp'){
        e.preventDefault();
        if(_results.length){ _activeIdx = (_activeIdx-1+_results.length) % _results.length; updateActive(); }
        return;
      }
      if(e.key === 'Enter'){
        if(_results.length){
          e.preventDefault();
          var it = _results[_activeIdx];
          closePanel();
          // 跳转
          setTimeout(function(){ window.location.href = it.url; }, 50);
        }
        return;
      }
    });

    // 点背景关闭
    document.addEventListener('click', function(e){
      var panel = document.getElementById('cmdkPanel');
      if(panel && panel.classList.contains('open') && e.target === panel){
        closePanel();
      }
    });
  }

  function bindInput(){
    document.addEventListener('input', function(e){
      if(e.target && e.target.id === 'cmdkInput'){
        render(e.target.value);
      }
    });
  }

  // ============ 公开 API ============
  window.cmdK = {
    open: openPanel,
    close: closePanel,
    rebuildIndex: rebuildIndex,  // 数据加载完后手动调
    counterUp: counterUp,
    counterUpAll: counterUpAll,
    bindTilt: bindTilt,
    tiltAll: tiltAll
  };

  // 自动初始化
  function init(){
    bindKeys();
    bindInput();
    // counter-up 首次执行（在 DOMContentLoaded 后由页面自己触发，确保 data-counter-up 已写入）
    if(document.readyState !== 'loading'){
      setTimeout(counterUpAll, 200);
      setTimeout(tiltAll, 300);
    } else {
      document.addEventListener('DOMContentLoaded', function(){
        setTimeout(counterUpAll, 200);
        setTimeout(tiltAll, 300);
      });
    }
  }
  init();
})();