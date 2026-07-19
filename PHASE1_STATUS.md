# M1 Phase 1 现状盘点报告

**创建时间**: 2026-07-19 23:08
**任务**: #task-20260719-tianbao-rebuild

---

## 1. 仓库基本信息

| 指标 | 值 |
|------|-----|
| 仓库路径 | ~/Documents/tianbao-projects |
| 总文件数 | 1,205 |
| HTML 文件 | 14 |
| MD 文件 | 1,056 |
| JSON 文件 | 36 |
| 总大小 | 82M |
| Git 分支 | main |
| 最新 Commit | 1e821b0 (待更新) |

---

## 2. entities/ 目录结构

| 分类 | 文件数 | 说明 |
|------|--------|------|
| 总文件数 | 1,055 | 项目实体文件 |
| .md 文件 | ~1,055 | 每个项目一个 .md 文件 |
| 大小 | 4.5M | 平均 4.3KB/文件 |

**实体类型** (从 frameworks/index.json 分类):
- 并购项目
- 储备项目
- 已完成项目
- 待跟进项目

---

## 3. frameworks/ 目录结构

| 文件 | 说明 |
|------|------|
| index.json | 分类索引，定义项目分类体系 |

---

## 4. kg_viz_v3/ 目录结构 (知识图谱可视化)

| 文件/目录 | 大小 | 说明 |
|-----------|------|------|
| kg_data.json | 26.5MB | 实体数据 (nodes + edges) |
| kg_summary.json | 6.7KB | 汇总信息 |
| industries/ | - | 35 个行业分类目录 |
| index.html | 2.9KB | 入口页面 |
| css/ | - | 样式文件 |
| js/ | - | 脚本文件 |

---

## 5. 核心 HTML 文件关系图

| 文件 | 大小 | 用途 |
|------|------|------|
| index.html | 94KB | 首页/导航 (当前实际是仪表盘) |
| detail.html | 46KB | 项目详情页面 |
| dashboard.html | 1.4KB | 重定向页 (→ huitian-network-report) |
| charts_demo.html | 18KB | 可视化展示 |
| entities-graph.html | 529KB | 交互式关系图谱 |
| entities_index.html | 528KB | 实体索引页面 |

---

## 6. 现有可视化资产

| 资产 | 状态 | 备注 |
|------|------|------|
| Chart.js | 已集成 | 用于 charts_demo.html |
| Mermaid | 待确认 | 用于报告渲染 |
| D3.js | 部分 | entities-graph.html 使用 |
| 知识图谱 | 可用 | kg_viz_v3/ 完整 |

---

## 7. 主公 5 项目标现状

| 目标 | 当前状态 | 待实现 |
|------|----------|--------|
| 1. 分层次版式 | 现有 index→detail 两层 | 需扩展为 5 层 |
| 2. 后台报告库 | 无 data/projects.json | 需新建 |
| 3. 可视化保留 | entities-graph.html 存在 | 保留 |
| 4. 动态更新 | 无动态机制 | 需实现 |
| 5. 时间线 | 无时间线页面 | 需实现 |

---

## 8. 备份信息

- Main 备份: ~/Documents/Recycling station/tianbao-projects-backup-20260719-230319/ (71MB)
- Git Tag: 待创建

---

**状态**: Phase 1 完成，待 commit 和 push