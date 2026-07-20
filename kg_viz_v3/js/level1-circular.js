/**
 * level1-circular.js — Level 1: 行业全景图谱 v6 (持续引力 + 父子行业分组)
 *
 * v6 修复：
 * 1. 持续引力动画 — 物理引擎默认不停止，节点持续缓慢运动
 * 2. 父子行业分组 — 检测"电力设备/储能"等子行业，视觉区分
 * 3. 高可见性引力 — 初始 300 次迭代后转入持续微动模式
 */
const Level1Circular = (function() {
  'use strict';

  let network = null;
  let nodes = null;
  let edges = null;
  let containerEl = null;
  let summaryData = null;

  const IND_ICONS = {
    '半导体': '⚡', '人工智能': '🧠', '医药': '💊',
    '新能源电池行业': '🔋', '电力设备': '⚙️', '军工': '🎖️',
    '低空经济': '🚁', '光伏设备': '☀️', '消费': '🛍️',
    '机械': '🔩', '汽车零部件': '🚗', '地产': '🏢',
    '证券': '📊', '宏观分析': '🌐', '有色金属': '🪙',
    '电力': '💡', '金融': '💰',
  };

  const IND_COLORS = [
    { bg: '#1a8cd8', border: '#1d9bf0' },
    { bg: '#2ecc71', border: '#27ae60' },
    { bg: '#e74c3c', border: '#c0392b' },
    { bg: '#f39c12', border: '#e67e22' },
    { bg: '#9b59b6', border: '#8e44ad' },
    { bg: '#1abc9c', border: '#16a085' },
    { bg: '#e91e63', border: '#c2185b' },
    { bg: '#00bcd4', border: '#0097a7' },
    { bg: '#ff5722', border: '#e64a19' },
    { bg: '#607d8b', border: '#455a64' },
    { bg: '#795548', border: '#5d4037' },
    { bg: '#4caf50', border: '#388e3c' },
    { bg: '#2196f3', border: '#1976d2' },
    { bg: '#ff9800', border: '#f57c00' },
    { bg: '#673ab7', border: '#512da8' },
    { bg: '#009688', border: '#00796b' },
    { bg: '#f44336', border: '#d32f2f' },
    { bg: '#3f51b5', border: '#303f9f' },
    { bg: '#cddc39', border: '#afb42b' },
    { bg: '#ffc107', border: '#ffb300' },
    { bg: '#03a9f4', border: '#0288d1' },
    { bg: '#8bc34a', border: '#689f38' },
    { bg: '#ff4081', border: '#f50057' },
    { bg: '#536dfe', border: '#304ffe' },
    { bg: '#ff6e40', border: '#ff3d00' },
    { bg: '#69f0ae', border: '#00c853' },
    { bg: '#b388ff', border: '#7c4dff' },
    { bg: '#18ffff', border: '#00e5ff' },
  ];

  function getIndustryColor(index) {
    return IND_COLORS[index % IND_COLORS.length];
  }

  // ── 检测父子行业关系 ──
  function detectParentChildRelations(industries) {
    const relations = [];
    const names = industries.map(i => i.name);
    for (const ind of industries) {
      const name = ind.name;
      const children = names.filter(n => n !== name && (n.startsWith(name + '/') || n.startsWith(name + '-')));
      if (children.length > 0) {
        relations.push({ parent: name, children });
      }
    }
    return relations;
  }

  // vis-network 配置（v6: 持续引力 — 默认不停止物理引擎）
  const NETWORK_OPTIONS = {
    nodes: {
      font: { size: 13, color: '#e7e9ea', face: 'FangSong, 仿宋, serif', strokeWidth: 1, strokeColor: '#0a0e1a', align: 'center' },
      borderWidth: 2, borderWidthSelected: 3,
      shadow: { enabled: true, size: 8, x: 0, y: 0, color: 'rgba(0,0,0,0.4)' },
      shape: 'dot', size: 30, margin: 6,
    },
    edges: {
      smooth: { type: 'continuous', roundness: 0.2 },
      font: { size: 9, color: '#71767b', face: 'FangSong, 仿宋, serif' },
      color: { color: 'rgba(48, 68, 85, 0.6)', highlight: '#1d9bf0', hover: '#1d9bf0', opacity: 0.6 },
      width: 1, selectionWidth: 2, hoverWidth: 1.5,
      arrows: { to: { enabled: true, scaleFactor: 0.5 } },
    },
    physics: {
      solver: 'forceAtlas2Based',
      forceAtlas2Based: {
        gravitationalConstant: -120,
        centralGravity: 0.008,
        springLength: 220,
        springConstant: 0.015,
        damping: 0.45,
        avoidOverlap: 0.9,
      },
      stabilization: { iterations: 300, updateInterval: 25, fit: true },
      adaptiveTimestep: true,
      // 稳定后不停止物理引擎 — 持续引力动画
      maxVelocity: 8,
      minVelocity: 0.5,
    },
    interaction: {
      hover: true, tooltipDelay: 150, navigationButtons: true,
      keyboard: true, zoomView: true, dragView: true, hoverConnectedEdges: true,
    },
    layout: { randomSeed: 42, improvedLayout: true },
    groups: {
      industry: { shape: 'dot', size: 35, borderWidth: 2 },
      'industry-child': { shape: 'dot', size: 28, borderWidth: 1 },
      center: { shape: 'star', size: 50, borderWidth: 3, font: { size: 16, color: '#1d9bf0', face: 'FangSong, 仿宋, serif', bold: true } },
    },
  };

  // 构建行业节点数据
  function buildIndustryData(summary) {
    const industryNodes = [];
    const industryEdges = [];
    const totalEntities = summary.industries.reduce((s, i) => s + i.count, 0);
    const maxCount = Math.max(...summary.industries.map(i => i.count));

    const parentChildRels = detectParentChildRelations(summary.industries);
    const childNames = new Set();
    parentChildRels.forEach(r => r.children.forEach(c => childNames.add(c)));

    // 中心节点
    industryNodes.push({
      id: 'center',
      label: `知识图谱\n${totalEntities.toLocaleString()} 实体`,
      title: `知识图谱全景\n总行业数: ${summary.industries.length}\n总实体数: ${totalEntities.toLocaleString()}`,
      group: 'center', shape: 'star', size: 50,
      color: { background: 'rgba(29, 155, 240, 0.3)', border: '#1d9bf0', highlight: { background: 'rgba(29, 155, 240, 0.5)', border: '#fff' } },
      font: { size: 16, color: '#1d9bf0', face: 'FangSong, 仿宋, serif', strokeWidth: 2, strokeColor: '#0a0e1a' },
      fixed: false, level: 0, type: 'center',
    });

    // 行业节点
    const sortedIndustries = [...summary.industries]
      .map((ind, i) => ({ ...ind, index: i }))
      .sort((a, b) => b.count - a.count);

    sortedIndustries.forEach((ind) => {
      const color = getIndustryColor(ind.index);
      const intensity = ind.count / maxCount;
      const size = 20 + intensity * 25;
      const icon = IND_ICONS[ind.name] || '';
      const label = icon ? `${icon} ${ind.name}` : ind.name;
      const isChild = childNames.has(ind.name);

      let parentName = '';
      if (isChild) {
        for (const rel of parentChildRels) {
          if (rel.children.includes(ind.name)) { parentName = rel.parent; break; }
        }
      }

      const tooltip = isChild
        ? `子行业: ${ind.name}\n所属: ${parentName}\n实体数: ${ind.count}\n关系数: ${ind.relation_count || 'N/A'}\n点击查看详情`
        : `行业: ${ind.name}\n实体数: ${ind.count}\n关系数: ${ind.relation_count || 'N/A'}\n点击查看详情`;

      industryNodes.push({
        id: `ind_${ind.name}`,
        label: `${label}\n${ind.count}`,
        title: tooltip,
        group: isChild ? 'industry-child' : 'industry',
        shape: 'dot', size: size,
        color: {
          background: color.bg,
          border: isChild ? 'rgba(255,255,255,0.3)' : color.border,
          highlight: { background: color.bg, border: '#fff' },
          hover: { background: color.bg, border: '#fff' },
        },
        font: { size: isChild ? 11 : 12, color: isChild ? '#9aa0a6' : '#e7e9ea', face: 'FangSong, 仿宋, serif', strokeWidth: 1, strokeColor: '#0a0e1a' },
        level: 0, type: 'industry', isChild, parentName,
        name: ind.name, count: ind.count, index: ind.index, relationCount: ind.relation_count || 0,
      });
    });

    // 边：连接到中心
    industryNodes.forEach(n => {
      if (n.type === 'center') return;
      industryEdges.push({
        from: 'center', to: n.id,
        color: { color: n.isChild ? 'rgba(48, 68, 85, 0.2)' : 'rgba(48, 68, 85, 0.4)', highlight: '#1d9bf0', opacity: n.isChild ? 0.2 : 0.4 },
        width: n.isChild ? 0.5 : 0.8, dashes: n.isChild ? [5, 5] : [3, 3],
        smooth: { type: 'straight' }, arrows: { to: { enabled: false } },
      });
    });

    // 父子行业之间的虚线连接
    parentChildRels.forEach(rel => {
      rel.children.forEach(childName => {
        const childNode = industryNodes.find(n => n.id === `ind_${childName}`);
        const parentNode = industryNodes.find(n => n.id === `ind_${rel.parent}`);
        if (childNode && parentNode) {
          industryEdges.push({
            from: `ind_${rel.parent}`, to: `ind_${childName}`,
            color: { color: 'rgba(100, 180, 255, 0.15)', opacity: 0.15 },
            width: 0.4, dashes: [2, 4],
            smooth: { type: 'curvedCCW', roundness: 0.1 },
            arrows: { to: { enabled: false } },
          });
        }
      });
    });

    return { nodes: industryNodes, edges: industryEdges };
  }

  // 初始化
  function init(container, summary, fullData) {
    summaryData = summary;
    const l1Data = buildIndustryData(summary);

    nodes = new vis.DataSet(l1Data.nodes);
    edges = new vis.DataSet(l1Data.edges);

    containerEl = document.getElementById(container);
    containerEl.innerHTML = '';

    network = new vis.Network(containerEl, { nodes, edges }, NETWORK_OPTIONS);

    // 稳定后居中 → 保持持续引力不停止
    network.once('stabilizationIterationsDone', function() {
      network.fit({ animation: { duration: 500, easingFunction: 'easeInOutQuad' } });

      // 切换到持续微动模式（不停止物理引擎）
      setTimeout(() => {
        if (network) {
          network.setOptions({
            physics: {
              solver: 'forceAtlas2Based',
              forceAtlas2Based: {
                gravitationalConstant: -60,
                centralGravity: 0.003,
                springLength: 250,
                springConstant: 0.01,
                damping: 0.7,
                avoidOverlap: 0.5,
              },
              stabilization: false,
              adaptiveTimestep: true,
              maxVelocity: 8,
              minVelocity: 0.5,
            },
          });
        }
      }, 500);
    });

    // 点击事件 → Level 2
    network.on('click', function(params) {
      if (params.nodes.length > 0) {
        const node = nodes.get(params.nodes[0]);
        if (node && node.type === 'industry') {
          if (window.onEnterLevel2) window.onEnterLevel2(node.name, node.count);
        }
      }
    });

    network.on('doubleClick', function(params) {
      if (params.nodes.length > 0) {
        const node = nodes.get(params.nodes[0]);
        if (node && node.type === 'industry') {
          if (window.onEnterLevel2) window.onEnterLevel2(node.name, node.count);
        }
      }
    });

    // 悬停高亮
    network.on('hoverNode', function(params) {
      const connected = network.getConnectedNodes(params.node);
      if (connected.length > 0) network.selectNodes([params.node, ...connected], false);
    });
    network.on('blurNode', function() { network.unselectAll(); });

    window.addEventListener('resize', () => { network.fit({ animation: { duration: 300 } }); });

    return network;
  }

  // 重启物理引擎（完整引力爆发）
  function restartPhysics() {
    if (!network) return;
    network.setOptions({
      physics: {
        solver: 'forceAtlas2Based',
        forceAtlas2Based: {
          gravitationalConstant: -120,
          centralGravity: 0.01,
          springLength: 250,
          springConstant: 0.02,
          damping: 0.4,
          avoidOverlap: 0.8,
        },
        stabilization: { iterations: 100 },
        adaptiveTimestep: true,
      },
    });
    network.once('stabilizationIterationsDone', function() {
      setTimeout(() => {
        if (network) {
          network.setOptions({
            physics: {
              solver: 'forceAtlas2Based',
              forceAtlas2Based: {
                gravitationalConstant: -60,
                centralGravity: 0.003,
                springLength: 250,
                springConstant: 0.01,
                damping: 0.7,
                avoidOverlap: 0.5,
              },
              stabilization: false,
              adaptiveTimestep: true,
              maxVelocity: 8,
              minVelocity: 0.5,
            },
          });
        }
      }, 1500);
    });
  }

  function focusOnIndustry(industryName) {
    const nodeId = `ind_${industryName}`;
    if (nodes && nodes.get(nodeId)) {
      network.focus(nodeId, { scale: 2.0, animation: { duration: 500, easingFunction: 'easeInOutQuad' } });
    }
  }

  function updateStatus() {
    if (!summaryData) return 'Level 1 · 行业全景';
    const total = summaryData.industries.reduce((s, i) => s + i.count, 0);
    return `Level 1 · 行业全景 · ${summaryData.industries.length} 个行业 · ${total.toLocaleString()} 实体`;
  }

  function getNetwork() { return network; }
  function getSelectedIndustry() {
    if (!network) return null;
    const selected = network.getSelection().nodes;
    if (selected.length > 0) return nodes.get(selected[0]);
    return null;
  }
  function destroy() {
    if (network) { network.destroy(); network = null; }
    nodes = null; edges = null; containerEl = null;
  }

  return { init, focusOnIndustry, getNetwork, getSelectedIndustry, updateStatus, restartPhysics, destroy };
})();