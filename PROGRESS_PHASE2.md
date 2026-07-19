# Phase 2 进度报告

**Task**: #task-20260719-tianbao-rebuild  
**更新**: 2026-07-19 23:25 GMT+8

---

## 主公 5 项目标达成度

| 目标 | 状态 | 说明 |
|------|------|------|
| 1. 分层次版式 | ✅ | nav 6 入口: 首页/仪表盘/项目/报告库/知识图谱/详情 |
| 1. 不滑动可看 | ⚠️ | index.html 6KB, 入口卡片不滚动; 项目列表需滚动 |
| 2. 后台报告库动态关联 | ✅ | data/projects.json (306KB, 1055 项目) |
| 3. 保留可视化 | ✅ | kg.html 链接到 entities-graph.html |
| 4. 动态内容 | ✅ | index.html 从 data/projects.json 读取统计 |
| 5. 时间线 | ⚠️ | 字段已添加, 页面未实现 |

---

## 真实文件交付

### A. index.html (首页导航)
- **大小**: 6,044 bytes
- **功能**: 5 入口卡片 + 动态统计
- **动态**: fetch data/projects.json 渲染统计

### B. data/projects.json (项目数据)
- **大小**: 306,604 bytes (300KB+)
- **项目数**: 1,055
- **字段**: id, name, category, emoji, status, stage, last_updated, localDir, progress
- **分类**: deal: 0, np: 1033, listed: 22

### C. JS 动态关联
- **index.html**: loadStats() 从 JSON 读取
- **reports.html**: 从 JSON 渲染报告列表
- **projects.html**: 预留 filter + 数据

### D. 现有页面
- dashboard.html (5.8KB) - 仪表盘
- projects.html (4.9KB) - 项目列表
- reports.html (3.8KB) - 报告库
- kg.html (3.8KB) - 知识图谱入口
- detail.html (existing) - 项目详情

---

## Git Commit 历史

| Commit | 说明 |
|--------|------|
| 8009f5f | fix: 修复 wiki-index.html 死链 |
| 5e49fe9 | Phase 2 A: index.html 重写 (6KB) |
| e47cfc6 | Phase 2: nav-links 更新 |
| 6f7d21a | Phase 2: 4 新页面 |
| fe4ba3f | M1 Phase 1: 现状盘点 |

---

## 待完成

- [ ] C: 时间线页面 (timeline.html)
- [ ] B: 项目详情页增强 (detail.html 关联 JSON)
- [ ] E: 动态进度环

---

## URL 验证

- **首页**: https://jinzhanxiang.github.io/tianbao-projects/index.html
- **仪表盘**: https://jinzhanxiang.github.io/tianbao-projects/dashboard.html
- **项目列表**: https://jinzhanxiang.github.io/tianbao-projects/projects.html
- **报告库**: https://jinzhanxiang.github.io/tianbao-projects/reports.html
- **知识图谱**: https://jinzhanxiang.github.io/tianbao-projects/kg.html