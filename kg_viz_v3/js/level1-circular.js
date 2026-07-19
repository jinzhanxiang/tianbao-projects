/**
 * level1-circular.js — Level 1: 行业全景图谱 v5 (力导向布局)
 *
 * 设计原则（基于前沿KG可视化调研）：
 * 1. 力导向布局优先 — 物理引擎参数调优决定可读性
 * 2. 视觉编码清晰 — 颜色=行业类型，大小=实体数，形状=节点角色
 * 3. 交互流畅 — hover高亮、点击下钻、悬停工具提示
 * 4. 极简背景 — 聚焦图谱本身，不堆砌CSS特效
 *
 * 物理引擎策略：
 * - forceAtlas2Based 引擎
 * - 中心引力让节点围绕中心聚集
 * - 弹簧长度控制节点间距
 * - 避免重叠确保节点可见
 */
const Level1Circular = (function() {
  'use strict';

  let network = null;
  let nodes = null;
  let edges = null;
  let containerEl = null;
  let summaryData = null;

  // 行业名称→图标映射（少量，仅用于视觉辅助）
  const IND_ICONS = {
    '半导体': '⚡', '人工智能': '🧠', '医药': '💊',
    '新能源电池行业': '🔋', '电力设备': '⚙️', '军工': '🎖️',
    '低空经济': '🚁', '光伏设备': '☀️', '消费': '🛍️',
    '机械': '🔩', '汽车零部件': '🚗', '地产': '🏢',
    '证券': '📊', '宏观分析': '🌐', '有色金属': '🪙',
    '电力': '💡', '金融': '💰',
  };

  // 配色方案：每个行业一个独特颜色（基于HSL均匀分布，保证视觉区分度）
  const IND_COLORS = [
    { bg: '#1a8cd8', border: '#1d9bf0' },  // 蓝色
    { bg: '#2ecc71', border: '#27ae60' },   // 绿色
    { bg: '#e74c3c', border: '#c0392b' },   // 红色
    { bg: '#f39c12', border: '#e67e22' },   // 橙色
    { bg: '#9b59b6', border: '#8e44ad' },   // 紫色
    { bg: '#1abc9c', border: '#16a085' },   // 青色
    { bg: '#e91e63', border: '#c2185b' },   // 粉色
    { bg: '#00bcd4', border: '#0097a7' },   // 亮青
    { bg: '#ff5722', border: '#e64a19' },   // 深橙
    { bg: '#607d8b', border: '#455a64' },   // 灰蓝
    { bg: '#795548', border: '#5d4037' },   // 棕色
    { bg: '#4caf50', border: '#388e3c' },   // 草绿
    { bg: '#2196f3', border: '#1976d2' },   // 天蓝
    { bg: '#ff9800', border: '#f57c00' },   // 琥珀
    { bg: '#673ab7', border: '#512da8' },   // 深紫
    { bg: '#009688', border: '#00796b' },   // 深青
    { bg: '#f44336', border: '#d32f2f' },   // 亮红
    { bg: '#3f51b5', border: '#303f9f' },   // 靛蓝
    { bg: '#cddc39', border: '#afb42b' },   // 黄绿
    { bg: '#ffc107', border: '#ffb300' },   // 金黄
    { bg: '#03a9f4', border: '#0288d1' },   // 浅蓝
    { bg: '#8bc34a', border: '#689f38' },   // 嫩绿
    { bg: '#ff4081', border: '#f50057' },   // 玫红
    { bg: '#536dfe', border: '#304ffe' },   // 电光蓝
    { bg: '#ff6e40', border: '#ff3d00' },   // 朱红
    { bg: '#69f0ae', border: '#00c853' },   // 翠绿
    { bg: '#b388ff', border: '#7c4dff' },   // 淡紫
    { bg: '#18ffff', border: '#00e5ff' },   // 亮青
  ];

  function getIndustryColor(index) {
    return IND_COLORS[index % IND_COLORS.length];
  }

  // vis-network 配置（经调优的力导向布局参数）
  const NETWORK_OPTIONS = {
    nodes: {
      font: {
        size: 13,
        color: '#e7e9ea',
        face: 'FangSong, 仿宋, serif',
        strokeWidth: 1,
        strokeColor: '#0a0e1a',
        align: 'center',
      },
      borderWidth: 2,
      borderWidthSelected: 3,
      shadow: {
        enabled: true,
        size: 8,
        x: 0,
        y: 0,
        color: 'rgba(0,0,0,0.4)',
      },
      shape: 'dot',
      size: 30,
      margin: 6,
    },
    edges: {
      smooth: {
        type: 'continuous',
        roundness: 0.2,
      },
      font: {
        size: 9,
        color: '#71767b',
        face: 'FangSong, 仿宋, serif',
      },
      color: {
        color: 'rgba(48, 68, 85, 0.6)',
        highlight: '#1d9bf0',
        hover: '#1d9bf0',
        opacity: 0.6,
      },
      width: 1,
      selectionWidth: 2,
      hoverWidth: 1.5,
      arrows: {
        to: { enabled: true, scaleFactor: 0.5 },
      },
    },
    physics: {
      solver: 'forceAtlas2Based',
      forceAtlas2Based: {
        gravitationalConstant: -80,       // 引力强度
        centralGravity: 0.005,            // 中心聚集
        springLength: 250,                 // 弹簧长度（节点间距）
        springConstant: 0.02,              // 弹簧弹性
        damping: 0.5,                      // 阻尼
        avoidOverlap: 0.8,                // 避免重叠
      },
      stabilization: {
        iterations: 200,
        updateInterval: 25,
        fit: true,
      },
      adaptiveTimestep: true,
    },
    interaction: {
      hover: true,
      tooltipDelay: 150,
      navigationButtons: true,
      keyboard: true,
      zoomView: true,
      dragView: true,
      hoverConnectedEdges: true,
    },
    layout: {
      randomSeed: 42,
      improvedLayout: true,
    },
    configure: {
      enabled: false,
    },
    // 高亮配置
    groups: {
      industry: {
        shape: 'dot',
        size: 35,
        borderWidth: 2,
      },
      center: {
        shape: 'star',
        size: 50,
        borderWidth: 3,
        font: {
          size: 16,
          color: '#1d9bf0',
          face: 'FangSong, 仿宋, serif',
          bold: true,
        },
      },
    },
  };

  // 构建行业节点数据
  function buildIndustryData(summary) {
    const industryNodes = [];
    const industryEdges = [];
    const totalEntities = summary.industries.reduce((s, i) => s + i.count, 0);
    const maxCount = Math.max(...summary.industries.map(i => i.count));

    // 中心节点（知识图谱总数）
    industryNodes.push({
      id: 'center',
      label: `知识图谱\n${totalEntities.toLocaleString()} 实体`,
      title: `知识图谱全景\n总行业数: ${summary.industries.length}\n总实体数: ${totalEntities.toLocaleString()}`,
      group: 'center',
      shape: 'star',
      size: 50,
      color: {
        background: 'rgba(29, 155, 240, 0.3)',
        border: '#1d9bf0',
        highlight: { background: 'rgba(29, 155, 240, 0.5)', border: '#fff' },
      },
      font: {
        size: 16,
        color: '#1d9bf0',
        face: 'FangSong, 仿宋, serif',
        strokeWidth: 2,
        strokeColor: '#0a0e1a',
      },
      fixed: false,
      level: 0,
      type: 'center',
    });

    // 行业节点 — 按实体数量排序，最大行业在中心附近
    const sortedIndustries = [...summary.industries]
      .map((ind, i) => ({ ...ind, index: i }))
      .sort((a, b) => b.count - a.count);

    sortedIndustries.forEach((ind) => {
      const color = getIndustryColor(ind.index);
      const intensity = ind.count / maxCount;
      const size = 20 + intensity * 25; // 20~45
      const icon = IND_ICONS[ind.name] || '';
      const label = icon ? `${icon} ${ind.name}` : ind.name;

      industryNodes.push({
        id: `ind_${ind.name}`,
        label: `${label}\n${ind.count}`,
        title: `行业: ${ind.name}\n实体数: ${ind.count}\n关系数: ${ind.relation_count || 'N/A'}\n点击查看详情`,
        group: 'industry',
        shape: 'dot',
        size: size,
        color: {
          background: color.bg,
          border: color.border,
          highlight: { background: color.bg, border: '#fff' },
          hover: { background: color.bg, border: '#fff' },
        },
        font: {
          size: 12,
          color: '#e7e9ea',
          face: 'FangSong, 仿宋, serif',
          strokeWidth: 1,
          strokeColor: '#0a0e1a',
        },
        level: 0,
        type: 'industry',
        name: ind.name,
        count: ind.count,
        index: ind.index,
        relationCount: ind.relation_count || 0,
      });
    });

    // 边：每个行业连接到中心节点
    industryNodes.forEach(n => {
      if (n.type === 'center') return;
      industryEdges.push({
        from: 'center',
        to: n.id,
        color: {
          color: 'rgba(48, 68, 85, 0.4)',
          highlight: '#1d9bf0',
          opacity: 0.4,
        },
        width: 0.8,
        dashes: [3, 3],
        smooth: { type: 'straight' },
        arrows: { to: { enabled: false } },
      });
    });

    // 相邻行业环形连接（减少视觉空白）
    const sortedByName = [...summary.industries].sort((a, b) => a.name.localeCompare(b.name));
    for (let i = 0; i < sortedByName.length; i++) {
      const j = (i + 1) % sortedByName.length;
      if (i > 5) break; // 只连前6个，避免太多边
      industryEdges.push({
        from: `ind_${sortedByName[i].name}`,
        to: `ind_${sortedByName[j].name}`,
        color: {
          color: 'rgba(48, 68, 85, 0.2)',
          opacity: 0.2,
        },
        width: 0.5,
        dashes: [4, 4],
        smooth: { type: 'curvedCW', roundness: 0.1 },
        arrows: { to: { enabled: false } },
      });
    }

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

    // 稳定后居中
    network.once('stabilizationIterationsDone', function() {
      network.fit({
        animation: { duration: 500, easingFunction: 'easeInOutQuad' },
      });
    });

    // 点击事件 → Level 2
    network.on('click', function(params) {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        const node = nodes.get(nodeId);
        if (node && node.type === 'industry') {
          if (window.onEnterLevel2) {
            window.onEnterLevel2(node.name, node.count);
          }
        }
      }
    });

    // 双击展开
    network.on('doubleClick', function(params) {
      if (params.nodes.length > 0) {
        const node = nodes.get(params.nodes[0]);
        if (node && node.type === 'industry') {
          if (window.onEnterLevel2) {
            window.onEnterLevel2(node.name, node.count);
          }
        }
      }
    });

    // 悬停高亮（hover connected edges）
    network.on('hoverNode', function(params) {
      const connected = network.getConnectedNodes(params.node);
      if (connected.length > 0) {
        network.selectNodes([params.node, ...connected], false);
      }
    });

    network.on('blurNode', function() {
      network.unselectAll();
    });

    // 窗口自适应
    window.addEventListener('resize', () => {
      network.fit({ animation: { duration: 300 } });
    });

    return network;
  }

  // 聚焦到特定行业
  function focusOnIndustry(industryName) {
    const nodeId = `ind_${industryName}`;
    if (nodes && nodes.get(nodeId)) {
      network.focus(nodeId, {
        scale: 2.0,
        animation: { duration: 500, easingFunction: 'easeInOutQuad' },
      });
    }
  }

  // 获取选中行业
  function getSelectedIndustry() {
    if (!network) return null;
    const selected = network.getSelection().nodes;
    if (selected.length > 0) {
      return nodes.get(selected[0]);
    }
    return null;
  }

  // 状态文本
  function updateStatus() {
    if (!summaryData) return 'Level 1 · 行业全景';
    const total = summaryData.industries.reduce((s, i) => s + i.count, 0);
    return `Level 1 · 行业全景 · ${summaryData.industries.length} 个行业 · ${total.toLocaleString()} 实体`;
  }

  // 清理
  function destroy() {
    if (network) {
      network.destroy();
      network = null;
    }
    nodes = null;
    edges = null;
    containerEl = null;
  }

  return {
    init,
    focusOnIndustry,
    getSelectedIndustry,
    updateStatus,
    destroy,
  };
})();