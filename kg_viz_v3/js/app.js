/**
 * app.js — 知识图谱分层可视化主应用 v5 (力导向 + 搜索过滤)
 *
 * v5 改进：
 * - 搜索实体功能
 * - 类型/关系过滤
 * - 连通子图高亮
 * - 力导向布局参数优化
 */
(function() {
  'use strict';

  // ── 全局状态 ──
  let summaryData = null;
  let fullData = null;
  let currentLevel = 1;
  let currentIndustryData = null;
  let breadcrumbPath = [];

  // ── DOM 元素 ──
  const els = {
    levelBadge: document.getElementById('level-badge'),
    industryList: document.getElementById('industry-nav-list'),
    statsList: document.getElementById('stats-list'),
    typeLegend: document.getElementById('type-legend'),
    relFilters: document.getElementById('rel-filters'),
    loading: document.getElementById('loading'),
    loadingText: document.getElementById('loading-text'),
    statusBarLeft: document.getElementById('status-left'),
    statusBarRight: document.getElementById('status-right'),
    breadcrumb: document.getElementById('breadcrumb'),
    btnReset: document.getElementById('btn-reset'),
    btnPhysics: document.getElementById('btn-physics'),
    btnFit: document.getElementById('btn-fit'),
    btnExport: document.getElementById('btn-export'),
    btnCloseDetail: document.getElementById('btn-close-detail'),
  };

  // ── 工具 ──
  function showLoading(msg) {
    if (els.loadingText) els.loadingText.textContent = msg || '加载中...';
    if (els.loading) els.loading.classList.add('visible');
  }
  function hideLoading() {
    if (els.loading) els.loading.classList.remove('visible');
  }
  function setStatus(left, right) {
    if (els.statusBarLeft) els.statusBarLeft.textContent = left;
    if (els.statusBarRight) els.statusBarRight.textContent = right || '天保控股 · 项目中心';
  }
  function setLevelBadge(level, label) {
    if (els.levelBadge) els.levelBadge.textContent = label;
  }
  function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function safeIndustryName(name) {
    return name.replace(/\//g, '_').replace(/\\/g, '_').replace(/ /g, '_');
  }

  // ── 数据加载 ──
  async function loadSummary() {
    showLoading('加载数据摘要...');
    const resp = await fetch('kg_summary.json');
    if (!resp.ok) throw new Error('摘要加载失败');
    return resp.json();
  }

  async function loadFullInBackground() {
    try {
      const resp = await fetch('kg_data.json');
      if (resp.ok) {
        fullData = await resp.json();
        console.log('✅ 完整数据后台加载完成');
      }
    } catch(e) {
      console.warn('完整数据后台加载失败:', e);
    }
  }

  async function loadIndustryData(indName) {
    const safeName = safeIndustryName(indName);
    const resp = await fetch(`industries/${safeName}.json`);
    if (!resp.ok) throw new Error(`行业数据加载失败: ${indName} (${resp.status})`);
    return resp.json();
  }

  // ── 导航渲染 ──
  function renderIndustryNav(data) {
    if (!els.industryList) return;
    els.industryList.innerHTML = '';
    const maxCount = Math.max(...data.industries.map(i => i.count));
    data.industries.forEach(ind => {
      const item = document.createElement('div');
      item.className = 'nav-item industry-nav-item';
      item.dataset.industry = ind.name;
      item.onclick = () => navigateTo(2, ind.name);
      const intensity = ind.count / maxCount;
      const r = Math.round(29 + intensity * 168);
      const g = Math.round(155 + intensity * 41);
      const color = `rgb(${r},${g},240)`;
      item.innerHTML = `
        <span class="nav-indicator" style="background:${color}"></span>
        <span class="nav-name">${escapeHtml(ind.name)}</span>
        <span class="nav-count">${ind.count}</span>
      `;
      item.title = `点击查看 ${ind.name} 实体图谱`;
      els.industryList.appendChild(item);
    });
  }

  function renderStats(data) {
    if (!els.statsList) return;
    const totalEnt = data.meta.total_entities || 0;
    const totalRel = data.meta.total_relations || 0;
    const totalInd = data.industries.length || 0;
    const totalFw = data.meta.total_frameworks || 0;
    const totalLc = data.meta.total_logic_chains || 0;
    const totalIndicators = data.meta.total_indicators || 0;
    els.statsList.innerHTML = `
      <div class="attr-row"><span class="attr-key">📦 实体</span><span class="attr-val">${totalEnt}</span></div>
      <div class="attr-row"><span class="attr-key">🔗 关系</span><span class="attr-val">${totalRel}</span></div>
      <div class="attr-row"><span class="attr-key">🏭 行业</span><span class="attr-val">${totalInd}</span></div>
      <div class="attr-row"><span class="attr-key">📐 框架</span><span class="attr-val" style="color:#F39C12">${totalFw}</span></div>
      <div class="attr-row"><span class="attr-key">🧠 逻辑链</span><span class="attr-val" style="color:#9B59B6">${totalLc}</span></div>
      <div class="attr-row"><span class="attr-key">📊 指标</span><span class="attr-val" style="color:#2ECC71">${totalIndicators}</span></div>
    `;
  }

  function renderTypeLegend(data) {
    if (!els.typeLegend) return;
    els.typeLegend.innerHTML = '';
    const typeMap = {
      ORG: '组织', PERSON: '人物', PRODUCT: '产品',
      TECH: '技术', INDUSTRY: '行业', POLICY: '政策',
      PLACE: '地点', UNKNOWN: '未知',
      framework: '框架', indicator: '指标', logic: '逻辑链',
    };
    data.entity_types.forEach(t => {
      const item = document.createElement('label');
      item.className = 'type-legend-item';
      const checked = true;
      item.innerHTML = `
        <input type="checkbox" checked onchange="window.onToggleTypeFilter('${t.type.toUpperCase()}')">
        <span class="type-legend-dot" style="background:${t.color}"></span>
        <span>${typeMap[t.type] || t.type}</span>
        <span class="type-legend-count">${t.count}</span>
      `;
      els.typeLegend.appendChild(item);
    });
  }

  function renderRelFilters(data) {
    if (!els.relFilters) return;
    els.relFilters.innerHTML = '';
    data.relation_types.forEach(rt => {
      const chip = document.createElement('span');
      chip.className = 'filter-chip active';
      chip.dataset.type = rt.type;
      chip.innerHTML = `<span class="fc-dot" style="background:${rt.color}"></span>${escapeHtml(rt.type)} (${rt.count})`;
      chip.onclick = () => {
        chip.classList.toggle('active');
        const active = chip.classList.contains('active');
        if (currentLevel === 2) {
          Level2Progressive.filterByRelationType(rt.type, active);
        }
      };
      els.relFilters.appendChild(chip);
    });
  }

  function updateBreadcrumb() {
    if (!els.breadcrumb) return;
    if (breadcrumbPath.length === 0) {
      els.breadcrumb.style.display = 'none';
      return;
    }
    els.breadcrumb.style.display = 'flex';
    els.breadcrumb.innerHTML = breadcrumbPath.map((item, i) => {
      const sep = i > 0 ? '<span class="breadcrumb-sep">›</span>' : '';
      const clickable = i < breadcrumbPath.length - 1;
      const cls = clickable ? 'breadcrumb-item' : 'breadcrumb-item';
      const style = clickable ? '' : 'color:#e7e9ea; cursor:default';
      return `${sep}<span class="${cls}" style="${style}" data-lvl="${item.level}" data-name="${escapeHtml(item.name)}">${escapeHtml(item.name)}</span>`;
    }).join('');
    document.querySelectorAll('.breadcrumb-item').forEach(item => {
      item.onclick = function() {
        const lvl = parseInt(this.dataset.lvl);
        const name = this.dataset.name;
        navigateTo(lvl, name);
      };
    });
  }

  // ── 行业Wiki摘要（右侧面板） ──
  function showIndustryWikiSummary(name, indData) {
    const bodyEl = document.getElementById('detail-body');
    const titleEl = document.getElementById('detail-title');
    const panel = document.getElementById('detail-panel');
    if (!bodyEl || !titleEl || !panel) return;

    titleEl.textContent = `🏭 ${name} · 行业概览`;
    titleEl.style.color = '#1d9bf0';
    panel.classList.remove('hidden');

    const entities = indData.entities || [];
    const relations = indData.relations || [];
    const frameworks = indData.frameworks || [];
    const logics = indData.logics || [];
    const indicators = indData.indicators || [];
    const counts = indData.counts || {};
    const entityTypes = {};
    entities.forEach(e => {
      const t = e.type || 'UNKNOWN';
      entityTypes[t] = (entityTypes[t] || 0) + 1;
    });
    const typeEntries = Object.entries(entityTypes).sort((a,b) => b[1]-a[1]);

    const relTypes = {};
    relations.forEach(r => {
      relTypes[r.type] = (relTypes[r.type] || 0) + 1;
    });
    const relEntries = Object.entries(relTypes).sort((a,b) => b[1]-a[1]);

    // 核心实体
    const coreEntities = entities.filter(e => e.is_core).slice(0, 15);

    bodyEl.innerHTML = `
      <div class="detail-card">
        <h5>📊 数据概览</h5>
        <div class="attr-row"><span class="attr-key">实体</span><span class="attr-val">${counts.entity_count || entities.length}</span></div>
        <div class="attr-row"><span class="attr-key">关系</span><span class="attr-val">${counts.relation_count || relations.length}</span></div>
        <div class="attr-row"><span class="attr-key">研究框架</span><span class="attr-val" style="color:#F39C12">${counts.framework_count || frameworks.length}</span></div>
        <div class="attr-row"><span class="attr-key">逻辑链</span><span class="attr-val" style="color:#9B59B6">${counts.logic_count || logics.length}</span></div>
        <div class="attr-row"><span class="attr-key">指标</span><span class="attr-val" style="color:#2ECC71">${counts.indicator_count || indicators.length}</span></div>
      </div>
      <div class="detail-card">
        <h5>🔖 实体类型分布</h5>
        ${typeEntries.slice(0, 8).map(([t, c]) => {
          const colors = {ORG:'#4A90D9',PERSON:'#50C878',PRODUCT:'#FFB347',TECH:'#FF6B6B',INDUSTRY:'#FFD700',POLICY:'#FF8C42',PLACE:'#48C9B0',UNKNOWN:'#95A5A6'};
          const labels = {ORG:'组织',PERSON:'人物',PRODUCT:'产品',TECH:'技术',INDUSTRY:'行业',POLICY:'政策',PLACE:'地点',UNKNOWN:'未知'};
          return `<div class="attr-row"><span class="attr-key" style="color:${colors[t]||'#95A5A6'}">${labels[t]||t}</span><span class="attr-val">${c}</span></div>`;
        }).join('')}
      </div>
      <div class="detail-card">
        <h5>🔗 主要关系类型</h5>
        ${relEntries.slice(0, 8).map(([t, c]) => {
          return `<div class="attr-row"><span class="attr-key">${t}</span><span class="attr-val">${c}</span></div>`;
        }).join('')}
      </div>
      ${coreEntities.length > 0 ? `
      <div class="detail-card">
        <h5>⭐ 核心实体</h5>
        ${coreEntities.map(e => `<div class="attr-row"><span class="attr-key" style="color:#FFD700">${e.name || e.label}</span><span class="attr-val" style="font-size:11px;color:#71767b">${(e.type||'')}</span></div>`).join('')}
        ${entities.filter(e => e.is_core).length > 15 ? `<div style="font-size:11px;color:#71767b;padding:4px 0">… 还有 ${entities.filter(e=>e.is_core).length - 15} 个核心实体</div>` : ''}
      </div>` : ''}
      <div class="detail-card" style="text-align:center;padding:12px">
        <span style="font-size:12px;color:#71767b">点击图谱中的节点查看详细实体信息</span>
      </div>
    `;
  }

  // ── 导航 ──
  async function navigateTo(level, name) {
    breadcrumbPath = breadcrumbPath.slice(0, level - 1);
    // 清空搜索
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';

    if (level === 1) {
      Level1Circular.init('viz-canvas', summaryData, fullData);
      currentLevel = 1;
      currentIndustryData = null;
      setLevelBadge(1, 'Level 1 · 行业全景');
      breadcrumbPath.push({ level: 1, name: '行业全景', type: 'root' });
      setStatus('Level 1 · 行业全景', `${summaryData.industries.length} 个行业 | ${summaryData.meta.total_entities} 实体`);
      Level3Detail.hide();
      renderIndustryNav(summaryData);
      updateBreadcrumb();

    } else if (level === 2) {
      // 淡出过渡（防止闪白）
      const overlay = document.getElementById('level-transition-overlay');
      if (overlay) { overlay.style.opacity = '1'; overlay.style.pointerEvents = 'auto'; }

      showLoading(`加载 ${name} ...`);
      try {
        const indData = await loadIndustryData(name);
        currentIndustryData = indData;
        window._currentIndustryData = indData;
        Level3Detail.setIndustryData(indData);
        const fakeFullData = {
          logic_entity_edges: indData.logic_entity_edges || [],
          indicator_entity_edges: indData.indicator_entity_edges || [],
        };
        await Level2Progressive.loadIndustry(name, fakeFullData, 'viz-canvas', (msg) => {
          if (els.loadingText) els.loadingText.textContent = msg;
        });
        hideLoading();

        // 淡入恢复
        if (overlay) { overlay.style.opacity = '0'; setTimeout(() => { overlay.style.pointerEvents = 'none'; }, 300); }

        currentLevel = 2;
        setLevelBadge(2, `Level 2 · ${name}`);
        if (breadcrumbPath.length === 0) {
          breadcrumbPath.push({ level: 1, name: '行业全景', type: 'root' });
        }
        breadcrumbPath.push({ level: 2, name: name, type: 'industry' });
        const c = indData.counts || {};
        setStatus(`Level 2 · ${name}`,
          `${c.entity_count || 0} 实体 · ${c.relation_count || 0} 关系 · ${c.framework_count || 0} 框架 · ${c.logic_count || 0} 逻辑 · ${c.indicator_count || 0} 指标`);
        Level3Detail.hide();
        updateBreadcrumb();
        document.querySelectorAll('.industry-nav-item').forEach(item => {
          item.classList.toggle('active', item.dataset.industry === name);
        });

        // 在右侧面板显示行业Wiki摘要
        showIndustryWikiSummary(name, indData);
      } catch(err) {
        hideLoading();
        if (overlay) { overlay.style.opacity = '0'; setTimeout(() => { overlay.style.pointerEvents = 'none'; }, 300); }
        console.error('行业数据加载失败:', err);
        setStatus('错误', err.message);
        alert('行业数据加载失败: ' + err.message);
      }
    } else if (level === 3) {
      updateBreadcrumb();
    }
  }

  function navigateBack() {
    if (currentLevel > 1) {
      navigateTo(currentLevel - 1, breadcrumbPath[breadcrumbPath.length - 2]?.name || '行业全景');
    }
  }

  // ── 全局事件 ──
  window.onEnterLevel2 = function(industryName, count) {
    navigateTo(2, industryName);
  };
  window.onEnterLevel3 = function(entity) {
    Level3Detail.showDetail(entity, 'detail-body', () => {
      breadcrumbPath.push({ level: 3, name: entity.name, type: 'entity' });
      updateBreadcrumb();
    });
  };
  window.onToggleIsolatedNodes = function() {
    window._showIsolatedNodes = document.getElementById('toggle-isolated').checked;
    if (currentLevel === 2 && breadcrumbPath.length >= 2) {
      navigateTo(2, breadcrumbPath[breadcrumbPath.length - 1]?.name);
    }
  };
  window.onHighlightEntity = function(entityId, relType) {
    Level2Progressive.highlightEntity(entityId);
    document.querySelectorAll('.relation-item').forEach(item => {
      if (item.dataset.entityId === entityId && item.dataset.relType === relType) {
        item.style.background = 'rgba(29,155,240,0.3)';
      } else {
        item.style.background = '';
      }
    });
  };
  // 搜索
  window.onSearchNodes = function() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;
    const term = searchInput.value.trim();
    if (currentLevel === 2) {
      Level2Progressive.filterBySearch(term);
    }
  };
  // 类型过滤
  window.onToggleTypeFilter = function(type) {
    const checkbox = document.getElementById(`type-filter-${type}`);
    if (!checkbox) return;
    const active = checkbox.checked;
    if (currentLevel === 2) {
      Level2Progressive.filterByType(type, active);
    }
  };

  // ── 按钮 ──
  els.btnReset.onclick = () => navigateTo(1, null);
  els.btnPhysics.onclick = function() {
    if (currentLevel === 1 && Level1Circular.restartPhysics) {
      Level1Circular.restartPhysics();
      setStatus('引力动画已重启', '');
    }
  };
  els.btnFit.onclick = function() {
    if (currentLevel === 1 && Level1Circular.getNetwork()) {
      Level1Circular.getNetwork().fit({ animation: { duration: 400 } });
    } else if (currentLevel === 2 && Level2Progressive.getNetwork()) {
      Level2Progressive.getNetwork().fit({ animation: { duration: 400 } });
    }
  };
  els.btnExport.onclick = function() {
    const canvas = document.querySelector('#viz-canvas canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = `kg_viz_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };
  els.btnCloseDetail.onclick = function() {
    Level3Detail.close();
    Level2Progressive.clearHighlight();
  };

  // ── 初始化 ──
  async function init() {
    try {
      summaryData = await loadSummary();
      Level3Detail.setData(null);
      renderIndustryNav(summaryData);
      renderStats(summaryData);
      renderTypeLegend(summaryData);
      renderRelFilters(summaryData);
      Level1Circular.init('viz-canvas', summaryData, null);
      currentLevel = 1;
      setLevelBadge(1, 'Level 1 · 行业全景');
      breadcrumbPath = [{ level: 1, name: '行业全景', type: 'root' }];
      setStatus('就绪', `${summaryData.industries.length} 行业 | ${summaryData.meta.total_entities} 实体`);
      updateBreadcrumb();
      hideLoading();
      loadFullInBackground();
      console.log('✅ 知识图谱 v5 力导向 + 搜索过滤已就绪');
    } catch (err) {
      hideLoading();
      console.error('❌ 初始化失败:', err);
      setStatus('错误', err.message);
      if (els.breadcrumb) els.breadcrumb.style.display = 'none';
    }
  }

  init();
})();
