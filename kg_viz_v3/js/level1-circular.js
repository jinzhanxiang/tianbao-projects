/**
 * level1-circular.js — Level 1: 环形行业全景图 v4 (科幻化增强)
 * 
 * 全量显示 + 科幻动画:
 * - 六边形节点 + 霓虹辉光
 * - 中心行业总数脉冲环
 * - 行业间弧形连接 + 流动粒子
 * - 节点悬浮呼吸动画
 * - 网格背景 HUD
 */
const Level1Circular = (function() {
  let network = null;
  let nodes = null;
  let edges = null;
  let data = null;
  let animFrameId = null;
  let totalEntitiesCache = 0;

  // 行业类型到图标的映射
  const IND_ICONS = {
    '半导体': '⚡', '人工智能': '🤖', '医药': '💊', '新能源电池行业': '🔋',
    '电力设备': '⚙️', '军工': '🎖️', '低空经济': '🚁', '光伏设备': '☀️',
    '消费': '🛒', '机械': '⛓️', '汽车零部件': '🚗', '地产': '🏢',
    '证券': '📈', '宏观分析': '📊', '科技-主题研究': '🔬', '金融-主题研究': '💰',
    '有色金属': '🪙', '电力': '💡', '机械-主题研究': '⚙️', '消费-食品饮料': '🍴',
  };

  // vis-network 配置 (科幻化)
  const NETWORK_OPTIONS = {
    nodes: {
      font: {
        size: 13,
        color: '#00d4ff',
        face: 'FangSong, 仿宋, serif',
        strokeWidth: 2,
        strokeColor: '#0a0e1a',
        align: 'center',
      },
      borderWidth: 2,
      shadow: {
        enabled: true,
        size: 25,
        x: 0,
        y: 0,
        color: 'rgba(0, 212, 255, 0.5)',
      },
      size: 35,
      shape: 'hexagon',
      margin: 8,
    },
    edges: {
      smooth: { type: 'curvedCW', roundness: 0.3 },
      font: { size: 10, color: '#7a8aaa', face: 'monospace' },
      arrows: { to: { enabled: true, scaleFactor: 1.0 } },
      color: {
        color: 'rgba(0, 212, 255, 0.3)',
        highlight: '#00d4ff',
        hover: '#a78bfa',
        inherit: 'from',
      },
    },
    physics: {
      solver: 'forceAtlas2Based',
      forceAtlas2Based: {
        gravitationalConstant: -100,
        centralGravity: 0.01,
        springLength: 280,
        springConstant: 0.005,
        damping: 0.5,
        avoidOverlap: 1.0,
      },
      stabilization: { iterations: 250, fit: true },
    },
    interaction: {
      hover: true,
      tooltipDelay: 150,
      navigationButtons: true,
      keyboard: { enabled: true },
    },
    layout: { randomSeed: 42 },
    autoResize: true,
    height: '100%',
    width: '100%',
    clickToUse: false,
  };

  // 行业环形布局位置计算
  function computeCircularPositions(count, radius = 380) {
    const positions = [];
    const cx = 0, cy = 0;
    for (let i = 0; i < count; i++) {
      const angle = (2 * Math.PI * i / count) - Math.PI / 2;
      positions.push({
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
        angle: angle,
      });
    }
    return positions;
  }

  // 行业颜色 (基于实体数, cyan→purple gradient)
  function getIndustryColor(count, maxCount) {
    const intensity = Math.min(count / maxCount, 1);
    // Cyan (0,212,255) → Purple (167,139,250) gradient
    const r = Math.round(0 + intensity * 167);
    const g = Math.round(212 + intensity * (139 - 212));
    const b = Math.round(255 + intensity * 0);
    return `rgb(${r},${g},${b})`;
  }

  // 构建 Level 1 数据
  function buildLevel1Data(summary) {
    const industryNodes = [];
    const industryEdges = [];
    const totalEntities = summary.industries.reduce((s, i) => s + i.count, 0);
    const maxCount = Math.max(...summary.industries.map(i => i.count));

    const positions = computeCircularPositions(summary.industries.length);

    // 中心节点 — 行业总数
    industryNodes.push({
      id: 'center',
      label: `知识图谱\n${totalEntities}\n实体总数`,
      title: `知识图谱全景\n总实体数：${totalEntities}`,
      shape: 'hexagon',
      size: 70,
      x: 0,
      y: 0,
      level: 0,
      type: 'center',
      color: {
        background: 'linear-gradient(135deg, #00d4ff, #a78bfa)',
        border: '#00d4ff',
        highlight: { background: '#00d4ff', border: '#fff' },
      },
      font: {
        size: 16,
        color: '#00d4ff',
        face: 'FangSong, 仿宋, serif',
        strokeWidth: 2,
        strokeColor: '#0a0e1a',
        bold: { size: 16, color: '#a78bfa' },
      },
      shadow: {
        enabled: true,
        size: 40,
        x: 0,
        y: 0,
        color: 'rgba(0, 212, 255, 0.6)',
      },
      fixed: true,
      icon: '🌐',
    });

    summary.industries.forEach((ind, i) => {
      const pos = positions[i];
      const intensity = Math.min(ind.count / maxCount, 1);
      const size = Math.max(30, Math.min(60, 25 + intensity * 30));
      const color = getIndustryColor(ind.count, maxCount);
      const icon = IND_ICONS[ind.name] || '🏭';

      industryNodes.push({
        id: `ind_${i}`,
        label: `${icon} ${ind.name}\n(${ind.count})`,
        title: `行业：${ind.name}\n实体数量：${ind.count}`,
        shape: 'hexagon',
        color: {
          background: color,
          border: '#00d4ff',
          highlight: { background: color, border: '#fff' },
          hover: { background: color, border: '#00d4ff' },
        },
        size: size,
        x: pos.x,
        y: pos.y,
        level: 0,
        type: 'industry',
        name: ind.name,
        count: ind.count,
        index: i,
        icon: icon,
        angle: pos.angle,
        font: {
          size: 12,
          color: '#0a0e1a',
          face: 'FangSong, 仿宋, serif',
          strokeWidth: 1,
          strokeColor: 'rgba(255,255,255,0.3)',
        },
        shadow: {
          enabled: true,
          size: 20,
          x: 0,
          y: 0,
          color: `rgba(${color.replace('rgb(','').split(',').map(Number).join(',')}, 0.4)`,
        },
        fixed: true,
      });

      // 连接到中心节点
      industryEdges.push({
        from: 'center',
        to: `ind_${i}`,
        color: {
          color: 'rgba(0, 212, 255, 0.15)',
          highlight: '#00d4ff',
        },
        width: 0.5,
        smooth: { type: 'straight' },
        dashes: [2, 4],
        arrows: { to: { enabled: false } },
      });
    });

    // 行业之间弧形连接 (相邻行业)
    for (let i = 0; i < summary.industries.length; i++) {
      const j = (i + 1) % summary.industries.length;
      industryEdges.push({
        from: `ind_${i}`,
        to: `ind_${j}`,
        color: {
          color: 'rgba(167, 139, 250, 0.2)',
          highlight: '#a78bfa',
        },
        width: 0.8,
        smooth: { type: 'curvedCW', roundness: 0.15 },
        dashes: [3, 3],
        arrows: { to: { enabled: false } },
      });
    }

    return {
      nodes: industryNodes,
      edges: industryEdges,
      totalEntities: totalEntities,
    };
  }

  // 初始化
  function init(container, summary, fullData) {
    data = fullData;
    const l1Data = buildLevel1Data(summary);

    nodes = new vis.DataSet(l1Data.nodes);
    edges = new vis.DataSet(l1Data.edges);

    const containerEl = document.getElementById(container);
    containerEl.innerHTML = '';

    // 添加网格背景
    addGridBackground(containerEl);

    network = new vis.Network(containerEl, { nodes, edges }, NETWORK_OPTIONS);

    // 节点点击事件
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

    // 双击节点放大
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

    // 悬浮效果
    network.on('hoverNode', function(params) {
      const nodeId = params.node;
      const node = nodes.get(nodeId);
      if (node && node.type === 'industry') {
        network.focus(nodeId, {
          scale: 1.8,
          animation: { duration: 400, easingFunction: 'easeInOutQuad' },
        });
      }
    });

    // 窗口自适应
    window.addEventListener('resize', () => network.fit({ animation: { duration: 300 } }));

    // 启动动画循环
    startAnimationLoop();

    return network;
  }

  // 添加网格背景
  function addGridBackground(containerEl) {
    const bgCanvas = document.createElement('canvas');
    bgCanvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;z-index:0;opacity:0.3;pointer-events:none;';
    containerEl.appendChild(bgCanvas);

    function drawGrid() {
      const rect = containerEl.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      // 处理高 DPI 屏幕
      const dpr = window.devicePixelRatio || 1;
      bgCanvas.width = rect.width * dpr;
      bgCanvas.height = rect.height * dpr;
      bgCanvas.style.width = rect.width + 'px';
      bgCanvas.style.height = rect.height + 'px';

      const ctx = bgCanvas.getContext('2d');
      ctx.scale(dpr, dpr);

      // 背景渐变
      const bgGrad = ctx.createRadialGradient(rect.width/2, rect.height/2, 0, rect.width/2, rect.height/2, Math.max(rect.width, rect.height));
      bgGrad.addColorStop(0, 'rgba(10, 14, 26, 0.8)');
      bgGrad.addColorStop(0.5, 'rgba(5, 5, 15, 0.9)');
      bgGrad.addColorStop(1, 'rgba(0, 0, 0, 1)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, rect.width, rect.height);

      // 网格
      const gridSize = 40;
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.03)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < rect.width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, rect.height);
      }
      for (let y = 0; y < rect.height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(rect.width, y);
      }
      ctx.stroke();

      // 中心光晕
      const glow = ctx.createRadialGradient(rect.width/2, rect.height/2, 0, rect.width/2, rect.height/2, 200);
      glow.addColorStop(0, 'rgba(0, 212, 255, 0.15)');
      glow.addColorStop(0.5, 'rgba(167, 139, 250, 0.05)');
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, rect.width, rect.height);
    }

    drawGrid();
    window.addEventListener('resize', drawGrid);
  }

  // 动画循环 — 脉冲效果
  function startAnimationLoop() {
    if (animFrameId) cancelAnimationFrame(animFrameId);

    let pulsePhase = 0;

    function animate() {
      if (!network || !nodes) return;

      pulsePhase += 0.02;
      const pulse = Math.sin(pulsePhase) * 0.3 + 0.7;

      // 中心节点脉冲
      const centerNode = nodes.get('center');
      if (centerNode) {
        const size = 65 + pulse * 10;
        nodes.update({
          id: 'center',
          size: size,
          shadow: {
            enabled: true,
            size: 30 + pulse * 15,
            x: 0,
            y: 0,
            color: `rgba(0, 212, 255, ${0.4 + pulse * 0.2})`,
          },
        });
      }

      // 行业节点呼吸效果 (轻微)
      const industryNodes = nodes.get({ filter: n => n.type === 'industry' });
      industryNodes.forEach((node, i) => {
        const phase = pulsePhase + i * 0.3;
        const breathe = Math.sin(phase) * 2;
        nodes.update({
          id: node.id,
          size: node.size + breathe,
        });
      });

      animFrameId = requestAnimationFrame(animate);
    }

    animate();
  }

  // 获取当前选中的行业
  function getSelectedIndustry() {
    const selected = network.getSelection().nodes;
    if (selected.length > 0) {
      return nodes.get(selected[0]);
    }
    return null;
  }

  // 聚焦到特定行业
  function focusOnIndustry(industryName) {
    const nodesArr = nodes.get({ filter: n => n.name === industryName });
    if (nodesArr.length > 0) {
      network.focus(nodesArr[0].id, {
        scale: 1.5,
        animation: { duration: 500, easingFunction: 'easeInOutQuad' },
      });
    }
  }

  // 更新状态
  function updateStatus() {
    const selected = getSelectedIndustry();
    if (selected) {
      return `选中行业: ${selected.name} (${selected.count} 实体)`;
    }
    const total = summary.industries.reduce((s, i) => s + i.count, 0);
    return `Level 1 · 行业全景 · ${summary.industries.length} 个行业 · ${total} 实体`;
  }

  // 停止动画
  function stopAnimation() {
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
  }

  // 获取中心节点总数
  function getTotalEntities() {
    return data ? l1Data.totalEntities : 0;
  }

  return {
    init,
    getSelectedIndustry,
    focusOnIndustry,
    updateStatus,
    stopAnimation,
  };
})();