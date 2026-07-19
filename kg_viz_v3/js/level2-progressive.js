/**
 * level2-progressive.js — Level 2: 行业内部渐进加载视图 v6
 *
 * v6 修复（性能优化）：
 * 1. 节点预算 — 最多显示 200 个节点，指示器和逻辑链默认聚类
 * 2. 大图引擎切换 — 超过 200 节点自动切换 BarnesHut（高效）
 * 3. 渐进加载 — 显示 "已加载 X/Y 个节点" 可展开
 * 4. 最大节点数警告 — 超大行业提示用户
 */
const MAX_VISIBLE_NODES = 200;

const Level2Progressive = (function() {
  let network = null;
  let nodes = null;
  let edges = null;
  let currentIndustry = null;
  let currentData = null;
  let fullNodeData = null; // 完整数据（含未加载的）
  let clusteringActive = true;
  let nodeBudget = MAX_VISIBLE_NODES;

  // 大图使用 BarnesHut（高效），小图使用 forceAtlas2Based（美观）
  function getNetworkOptions(nodeCount) {
    const isLarge = nodeCount > 200;
    return {
      nodes: {
        font: { size: 13, color: '#e7e9ea', face: 'FangSong, 仿宋, serif', strokeWidth: 1, strokeColor: '#000' },
        borderWidth: 2,
        shadow: { enabled: !isLarge, size: 15, color: 'rgba(0,212,255,0.5)' },
      },
      edges: {
        smooth: { type: 'continuous', roundness: 0.2 },
        font: { size: 9, color: '#7a8aaa', face: 'FangSong, 仿宋, serif', strokeWidth: 0 },
        arrows: { to: { enabled: true, scaleFactor: 0.6 } },
        color: { color: 'rgba(0,212,255,0.4)', highlight: '#00d4ff' },
      },
      physics: {
        solver: isLarge ? 'barnesHut' : 'forceAtlas2Based',
        barnesHut: isLarge ? {
          gravitationalConstant: -3000,
          centralGravity: 0.3,
          springLength: 95,
          springConstant: 0.04,
          damping: 0.5,
          avoidOverlap: 0.5,
        } : undefined,
        forceAtlas2Based: !isLarge ? {
          gravitationalConstant: -150,
          centralGravity: 0.008,
          springLength: 200,
          springConstant: 0.008,
          damping: 0.6,
          avoidOverlap: 0.8,
        } : undefined,
        stabilization: { iterations: isLarge ? 80 : 200 },
        adaptiveTimestep: true,
      },
      interaction: { hover: true, tooltipDelay: 100, navigationButtons: false },
      groups: {
        entity: { shape: 'dot', size: 14 },
        framework: { shape: 'square', size: 20, borderWidth: 2 },
        logic: { shape: 'triangle', size: 12 },
        indicator: { shape: 'diamond', size: 10 },
      },
    };
  }

  const TYPE_COLORS = {
    ORG: '#4A90D9', PERSON: '#50C878', PRODUCT: '#FFB347',
    TECH: '#FF6B6B', INDUSTRY: '#FFD700', POLICY: '#FF8C42',
    PLACE: '#48C9B0', UNKNOWN: '#95A5A6',
    framework: '#F39C12', indicator: '#2ECC71',
    logic: '#9B59B6', report: '#95A5A6',
  };

  const TYPE_LABELS = {
    ORG: '组织', PERSON: '人物', PRODUCT: '产品',
    TECH: '技术', INDUSTRY: '行业', POLICY: '政策',
    PLACE: '地点', UNKNOWN: '未知',
    framework: '研究框架', indicator: '指标',
    logic: '逻辑链', report: '报告',
  };

  const TYPE_SHAPES = {
    ORG: 'box', PERSON: 'ellipse', PRODUCT: 'hexagon',
    TECH: 'triangle', INDUSTRY: 'star', POLICY: 'square',
    PLACE: 'diamond', UNKNOWN: 'dot',
    framework: 'square', indicator: 'diamond',
    logic: 'triangle', report: 'dot',
  };

  function getEntityColor(type) {
    return TYPE_COLORS[type] || TYPE_COLORS[type.toUpperCase()] || '#95A5A6';
  }
  function getEntityTypeLabel(type) {
    return TYPE_LABELS[type] || TYPE_LABELS[type.toUpperCase()] || type;
  }
  function getShape(type) {
    return TYPE_SHAPES[type] || TYPE_SHAPES[type.toUpperCase()] || 'dot';
  }

  // 构建节点（v6: 按预算截断）
  function buildNodesFromComponents(industryName, industryMap, edgeData, showIsolated, budget) {
    const entities = industryMap.entities || [];
    const relations = industryMap.relations || [];
    const frameworks = industryMap.frameworks || [];
    const logics = industryMap.logics || [];
    const indicators = industryMap.indicators || [];

    const logicEdges = (edgeData.logic_entity_edges || []).filter(e => {
      const targetEntity = entities.find(ent => ent.id === e.to);
      return !!targetEntity;
    });
    const indicatorEdges = (edgeData.indicator_entity_edges || []).filter(e => {
      const targetEntity = entities.find(ent => ent.id === e.to);
      return !!targetEntity;
    });

    const connectedIds = new Set();
    relations.forEach(r => { connectedIds.add(r.from); connectedIds.add(r.to); });
    logicEdges.forEach(e => connectedIds.add(e.from));
    indicatorEdges.forEach(e => connectedIds.add(e.from));

    const entityNodes = [];
    const edgeMap = new Map();

    const totalNodeCount = entities.length + frameworks.length + logics.length + indicators.length;
    const isOverBudget = totalNodeCount > budget;

    // 预算分配：核心实体优先，框架其次，逻辑链/指标按比例截断
    let budgetRemaining = budget;

    // ── 实体节点（核心优先） ──
    const coreEntities = entities.filter(e => e.is_core);
    const normalEntities = entities.filter(e => !e.is_core);

    coreEntities.forEach(e => {
      if (budgetRemaining <= 0) return;
      budgetRemaining--;
      const color = getEntityColor(e.type);
      entityNodes.push({
        id: e.id, label: e.label || e.name || '',
        title: buildTooltip(e, industryMap),
        shape: getShape(e.type), group: 'entity',
        color: { background: color, border: adjustColor(color, -40), highlight: { background: '#fff', border: '#1d9bf0' } },
        size: 22, level: 0, type: e.type, nodeType: 'entity',
        name: e.name, is_core: true, industry: industryName,
      });
    });

    // 普通实体按连通性排序
    const connectedEntities = normalEntities.filter(e => connectedIds.has(e.id));
    const isolatedEntities = normalEntities.filter(e => !connectedIds.has(e.id));

    for (const e of connectedEntities) {
      if (budgetRemaining <= 0) break;
      budgetRemaining--;
      const color = getEntityColor(e.type);
      entityNodes.push({
        id: e.id, label: e.label || e.name || '',
        title: buildTooltip(e, industryMap),
        shape: getShape(e.type), group: 'entity',
        color: { background: color, border: adjustColor(color, -40), highlight: { background: '#fff', border: '#1d9bf0' } },
        size: 14, level: 1, type: e.type, nodeType: 'entity',
        name: e.name, is_core: false, industry: industryName,
      });
    }

    if (showIsolated) {
      for (const e of isolatedEntities) {
        if (budgetRemaining <= 0) break;
        budgetRemaining--;
        const color = getEntityColor(e.type);
        entityNodes.push({
          id: e.id, label: e.label || e.name || '',
          title: buildTooltip(e, industryMap),
          shape: getShape(e.type), group: 'entity',
          color: { background: color, border: adjustColor(color, -40), highlight: { background: '#fff', border: '#1d9bf0' } },
          size: 10, level: 2, type: e.type, nodeType: 'entity',
          name: e.name, is_core: false, industry: industryName,
        });
      }
    }

    // ── 框架节点（高优先级） ──
    const maxFrameworks = Math.min(frameworks.length, Math.max(10, Math.floor(budget * 0.15)));
    frameworks.slice(0, maxFrameworks).forEach(fw => {
      if (budgetRemaining <= 0) return;
      budgetRemaining--;
      entityNodes.push({
        id: fw.id, label: fw.name || '框架',
        title: buildTooltip(fw, industryMap),
        shape: 'square', group: 'framework',
        color: { background: '#F39C12', border: adjustColor('#F39C12', -40), highlight: { background: '#fff', border: '#1d9bf0' } },
        size: 20, type: 'framework', nodeType: 'framework',
        name: fw.name, is_core: true, industry: industryName,
      });
    });

    // ── 逻辑链和指标（默认聚类，仅显示少量） ──
    const maxLogics = Math.min(logics.length, Math.max(5, Math.floor(budget * 0.1)));
    logics.slice(0, maxLogics).forEach(lc => {
      if (budgetRemaining <= 0) return;
      budgetRemaining--;
      entityNodes.push({
        id: lc.id, label: '⚡' + (lc.type || '逻辑'),
        title: buildTooltip(lc, industryMap),
        shape: 'triangle', group: 'logic',
        color: { background: '#9B59B6', border: adjustColor('#9B59B6', -40), highlight: { background: '#fff', border: '#1d9bf0' } },
        size: 12, type: 'logic', nodeType: 'logic',
        name: lc.type || '逻辑链', is_core: false, industry: industryName,
      });
    });

    const maxIndicators = Math.min(indicators.length, Math.max(5, Math.floor(budget * 0.1)));
    indicators.slice(0, maxIndicators).forEach(ind => {
      if (budgetRemaining <= 0) return;
      budgetRemaining--;
      entityNodes.push({
        id: ind.id, label: '📊' + (ind.name || '指标').slice(0, 6),
        title: buildTooltip(ind, industryMap),
        shape: 'diamond', group: 'indicator',
        color: { background: '#2ECC71', border: adjustColor('#2ECC71', -40), highlight: { background: '#fff', border: '#1d9bf0' } },
        size: 10, type: 'indicator', nodeType: 'indicator',
        name: ind.name || '指标', is_core: false, industry: industryName,
      });
    });

    // ── 边 ──
    const addEdge = function(from, to, type, edgeType) {
      const key = `${from}|${to}|${type}`;
      if (!edgeMap.has(key)) {
        edgeMap.set(key, { from, to, type, count: 1, edgeType });
      } else {
        edgeMap.get(key).count++;
      }
    };
    relations.forEach(r => {
      const fromExists = entityNodes.some(n => n.id === r.from);
      const toExists = entityNodes.some(n => n.id === r.to);
      if (fromExists && toExists) addEdge(r.from, r.to, r.type, 'entity_relation');
    });
    logicEdges.forEach(e => {
      const fromExists = entityNodes.some(n => n.id === e.from);
      const toExists = entityNodes.some(n => n.id === e.to);
      if (fromExists && toExists) addEdge(e.from, e.to, e.type, e.edge_type || 'logic_entity');
    });
    indicatorEdges.forEach(e => {
      const fromExists = entityNodes.some(n => n.id === e.from);
      const toExists = entityNodes.some(n => n.id === e.to);
      if (fromExists && toExists) addEdge(e.from, e.to, e.type, e.edge_type || 'indicator_entity');
    });

    const industryEdges = [];
    edgeMap.forEach(edge => {
      const color = getRelationColor(edge.type);
      const isNonEntity = edge.edgeType !== 'entity_relation';
      industryEdges.push({
        from: edge.from,
        to: edge.to,
        label: edge.count > 1 ? `${edge.count}` : '',
        color: { color, highlight: '#1d9bf0', opacity: isNonEntity ? 0.4 : 0.8 },
        width: isNonEntity ? 0.8 : Math.min(edge.count / 2 + 1, 3),
        dashes: isNonEntity ? [5, 3] : false,
        smooth: { type: 'continuous', roundness: 0.15 },
      });
    });

    const visibleCount = entityNodes.length;
    const totalCount = totalNodeCount;
    const hiddenCount = totalCount - visibleCount;

    return {
      nodes: entityNodes,
      edges: industryEdges,
      entityCount: entityNodes.length,
      relationCount: industryEdges.length,
      totalNodeCount: totalCount,
      visibleNodeCount: visibleCount,
      hiddenNodeCount: Math.max(0, hiddenCount),
      isOverBudget,
    };
  }

  function buildTooltip(node, industryMap) {
    let lines = [`${node.label || node.name || ''}`];
    lines.push(`类型: ${getEntityTypeLabel(node.type)}`);
    return lines.join('\n');
  }

  function getRelationColor(type) {
    const REL_PALETTE = ['#E74C3C','#F39C12','#2ECC71','#3498DB','#9B59B6','#1ABC9C','#E67E22','#E91E63','#00BCD4','#FF9800','#8E44AD','#FF7043','#00ACC1','#7E57C2','#27AE60','#D32F2F','#388E3C','#1976D2','#7B1FA2','#00796B'];
    let hash = 0;
    for (let i = 0; i < type.length; i++) hash = type.charCodeAt(i) + ((hash << 5) - hash);
    return REL_PALETTE[Math.abs(hash) % REL_PALETTE.length];
  }

  function adjustColor(hex, amount) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
    return `rgb(${r},${g},${b})`;
  }

  // 加载行业（v6: 预算控制 + 大图引擎切换）
  async function loadIndustry(industryName, edgeData, container, onProgress) {
    currentIndustry = industryName;
    currentData = edgeData;

    if (onProgress) onProgress(`加载 ${industryName} 数据...`);

    let industryData = window._currentIndustryData;
    if (!industryData || industryData.name !== industryName) {
      if (edgeData.industries_map && edgeData.industries_map[industryName]) {
        industryData = edgeData.industries_map[industryName];
      } else {
        console.error('行业数据未加载:', industryName);
        if (onProgress) onProgress('数据未准备');
        return;
      }
    }

    if (onProgress) onProgress(`${industryName}: 构建节点和边...`);
    const showIsolated = window._showIsolatedNodes === true;
    const full = buildNodesFromComponents(industryName, industryData, edgeData, showIsolated, nodeBudget);
    fullNodeData = full;

    const containerEl = document.getElementById(container);
    if (!containerEl) { console.error('容器未找到:', container); return; }

    // 构建阶段：先显示核心
    const coreNodes = full.nodes.filter(n => n.is_core);
    const coreIds = new Set(coreNodes.map(n => n.id));

    nodes = new vis.DataSet(coreNodes);
    edges = new vis.DataSet([]);

    containerEl.innerHTML = '';
    const options = getNetworkOptions(full.nodes.length);
    network = new vis.Network(containerEl, { nodes, edges }, options);

    if (onProgress) onProgress(`已加载 ${coreNodes.length} 个核心节点`);

    // 阶段2：加载全部节点
    await sleep(600);
    const remainingNodes = full.nodes.filter(n => !n.is_core);
    if (remainingNodes.length > 0) {
      nodes.add(remainingNodes);
    }

    // 阶段3：加载边
    await sleep(400);
    if (full.edges.length > 0) {
      edges.add(full.edges);
    }

    // 阶段4：聚类逻辑链和指标（减少视觉杂乱）
    await sleep(800);
    clusterNonEntities(network, nodes);

    // 显示节点预算信息
    if (full.isOverBudget && full.hiddenNodeCount > 0) {
      if (onProgress) onProgress(`已加载 ${full.visibleNodeCount}/${full.totalNodeCount} 个节点 (${full.hiddenNodeCount} 个已隐藏，点击"加载更多"展开)`);
      showNodeBudgetBanner(full);
    } else {
      if (onProgress) onProgress(`已加载 ${full.visibleNodeCount} 个节点`);
      hideNodeBudgetBanner();
    }

    // 节点点击 → Level 3
    network.on('click', function(params) {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        const node = nodes.get(nodeId);
        if (node) {
          if (window.onEnterLevel3) window.onEnterLevel3(node);
        }
      }
    });

    network.on('doubleClick', function(params) {
      if (params.nodes.length > 0) {
        const clusterId = params.nodes[0];
        if (network.isCluster(clusterId)) {
          network.openCluster(clusterId);
          return;
        }
        const node = nodes.get(clusterId);
        if (node && window.onEnterLevel3) window.onEnterLevel3(node);
      }
    });

    network.once('stabilizationIterationsDone', function() {
      network.fit({ animation: { duration: 500 } });
    });

    window.addEventListener('resize', () => network.fit());

    return { network, nodes, edges, data: full };
  }

  // 聚类非实体节点（逻辑链、指标、框架）
  function clusterNonEntities(network, nodes) {
    if (!clusteringActive) return;
    const nodeTypes = {};
    nodes.forEach(n => {
      if (n.nodeType !== 'entity') {
        const typeKey = n.nodeType || 'other';
        if (!nodeTypes[typeKey]) nodeTypes[typeKey] = [];
        nodeTypes[typeKey].push(n.id);
      }
    });

    Object.keys(nodeTypes).forEach(typeKey => {
      const ids = nodeTypes[typeKey];
      if (ids.length < 3) return;
      const typeLabel = TYPE_LABELS[typeKey] || typeKey;
      const color = TYPE_COLORS[typeKey] || '#95A5A6';
      network.cluster({
        joinCondition: (nodeOptions) => ids.includes(nodeOptions.id),
        clusterNodeProperties: {
          id: `cluster_${typeKey}`,
          label: `${typeLabel} (${ids.length})`,
          shape: typeKey === 'framework' ? 'square' : typeKey === 'logic' ? 'triangle' : 'diamond',
          size: Math.min(ids.length * 0.5 + 25, 50),
          color: { background: color, border: adjustColor(color, -40), highlight: { background: '#fff', border: '#1d9bf0' } },
          font: { size: 14, color: '#e7e9ea', face: 'Arial' },
        },
        clusterEdgeProperties: {
          color: { color: adjustColor(color, -20), opacity: 0.3 },
          width: 0.8, dashes: [3, 3],
        },
      });
    });
  }

  // 节点预算提示条
  function showNodeBudgetBanner(data) {
    let banner = document.getElementById('node-budget-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'node-budget-banner';
      banner.className = 'node-budget-banner';
      const canvas = document.getElementById('viz-canvas');
      if (canvas && canvas.parentNode) canvas.parentNode.appendChild(banner);
    }
    banner.innerHTML = `
      <span>📊 已加载 <strong>${data.visibleNodeCount}</strong> / ${data.totalNodeCount} 个节点
      (${data.hiddenNodeCount} 个已隐藏)</span>
      <button class="btn btn-small" onclick="Level2Progressive.loadMoreNodes()">+ 加载更多</button>
      <button class="btn btn-small" onclick="Level2Progressive.loadAllNodes()">+ 加载全部</button>
    `;
    banner.style.display = 'flex';
  }

  function hideNodeBudgetBanner() {
    const banner = document.getElementById('node-budget-banner');
    if (banner) banner.style.display = 'none';
  }

  // 加载更多节点（增加预算 + 50）
  async function loadMoreNodes() {
    nodeBudget += 50;
    if (currentIndustry && currentData) {
      await loadIndustry(currentIndustry, currentData, 'viz-canvas', (msg) => {
        const lt = document.getElementById('loading-text');
        if (lt) lt.textContent = msg;
      });
    }
  }

  // 加载全部节点
  async function loadAllNodes() {
    nodeBudget = 99999;
    if (currentIndustry && currentData) {
      await loadIndustry(currentIndustry, currentData, 'viz-canvas', (msg) => {
        const lt = document.getElementById('loading-text');
        if (lt) lt.textContent = msg;
      });
    }
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  function reset() {
    currentIndustry = null;
    currentData = null;
    fullNodeData = null;
    nodeBudget = MAX_VISIBLE_NODES;
    hideNodeBudgetBanner();
    if (network) { network.destroy(); network = null; }
    nodes = null;
    edges = null;
  }

  function highlightEntity(entityId) {
    if (!network || !nodes) return;
    // 淡化所有节点
    nodes.forEach(n => {
      if (n.id !== entityId) {
        nodes.update({ id: n.id, opacity: 0.2, color: { opacity: 0.2 } });
      } else {
        nodes.update({ id: entityId, opacity: 1, borderWidth: 3,
          color: { background: '#FFD700', border: '#fff', highlight: { background: '#FFD700', border: '#fff' } }
        });
      }
    });
  }

  function clearHighlight() {
    if (!network || !nodes || !edges) return;
    nodes.forEach(n => nodes.update({ id: n.id, opacity: 1, borderWidth: n.is_core ? 2 : 1 }));
    edges.forEach(e => edges.update({ id: e.id, color: { opacity: 0.8 }, width: 1.5 }));
  }

  function getCurrentIndustry() { return currentIndustry; }
  function getNetwork() { return network; }

  // ── 搜索过滤 ──
  function filterBySearch(term) {
    if (!network || !nodes) return;
    if (!term) {
      nodes.forEach(n => nodes.update({ id: n.id, opacity: 1.0, hidden: false }));
      edges.forEach(e => edges.update({ id: e.id, hidden: false }));
      return;
    }
    const lowerTerm = term.toLowerCase();
    nodes.forEach(n => {
      const name = (n.name || n.label || '').toLowerCase();
      const match = name.includes(lowerTerm);
      nodes.update({ id: n.id, opacity: match ? 1.0 : 0.08, hidden: false });
    });
    const visibleNodes = new Set();
    nodes.forEach(n => {
      if ((n.name || n.label || '').toLowerCase().includes(lowerTerm)) visibleNodes.add(n.id);
    });
    edges.forEach(e => {
      const visible = visibleNodes.has(e.from) && visibleNodes.has(e.to);
      edges.update({ id: e.id, hidden: !visible, opacity: visible ? 0.8 : 0 });
    });
    const firstMatch = nodes.get().find(n => (n.name || n.label || '').toLowerCase().includes(lowerTerm));
    if (firstMatch) {
      network.focus(firstMatch.id, { scale: 2.0, animation: { duration: 300 } });
    }
  }

  function filterByType(type, active) {
    if (!network || !nodes) return;
    nodes.forEach(n => {
      const nodeType = (n.type || '').toUpperCase();
      if (nodeType === type.toUpperCase() || nodeType === type) {
        nodes.update({ id: n.id, hidden: !active });
      }
    });
    edges.forEach(e => {
      const fromNode = nodes.get(e.from);
      const toNode = nodes.get(e.to);
      edges.update({ id: e.id, hidden: !fromNode || !toNode || fromNode.hidden || toNode.hidden });
    });
    network.fit({ animation: { duration: 300 } });
  }

  const hiddenRelationTypes = new Set();
  function filterByRelationType(type, active) {
    if (!network || !edges) return;
    if (active) hiddenRelationTypes.delete(type);
    else hiddenRelationTypes.add(type);
    edges.forEach(e => {
      const edgeType = e.type || e.label || '';
      edges.update({ id: e.id, hidden: hiddenRelationTypes.has(edgeType) });
    });
  }

  function highlightConnectedSubgraph(nodeId) {
    if (!network || !nodes || !edges) return;
    const connectedNodes = network.getConnectedNodes(nodeId);
    const connectedEdges = network.getConnectedEdges(nodeId);
    const highlightSet = new Set([nodeId, ...connectedNodes]);
    const edgeSet = new Set(connectedEdges);
    nodes.forEach(n => {
      const isHighlighted = highlightSet.has(n.id);
      const isFocal = n.id === nodeId;
      nodes.update({
        id: n.id, opacity: isHighlighted ? 1.0 : 0.1,
        borderWidth: isFocal ? 4 : 1,
      });
    });
    edges.forEach(e => {
      const isHighlighted = edgeSet.has(e.id);
      edges.update({ id: e.id, opacity: isHighlighted ? 1.0 : 0.05, width: isHighlighted ? 3 : 0.5 });
    });
  }

  return {
    loadIndustry,
    reset,
    highlightEntity,
    clearHighlight,
    getCurrentIndustry,
    getNetwork,
    filterBySearch,
    filterByType,
    filterByRelationType,
    highlightConnectedSubgraph,
    loadMoreNodes,
    loadAllNodes,
  };
})();