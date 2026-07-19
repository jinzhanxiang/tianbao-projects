# Phase 2 M2-B + M2-C 进度报告

**Task**: #task-20260719-tianbao-rebuild  
**更新**: 2026-07-19 23:30 GMT+8

---

## 主公 5 项目标达成度

| 目标 | 状态 | 说明 |
|------|------|------|
| 1. 分层次版式 | ✅ | nav 7 入口: 首页/仪表盘/项目/报告库/时间线/知识图谱 |
| 1. 不滑动可看 | ✅ | index.html 6KB, 入口卡片不滚动 |
| 2. 后台报告库动态关联 | ✅ | data/projects.json (306KB, 1055 项目) |
| 3. 保留可视化 | ✅ | entities-graph.html, charts_demo.html |
| 4. 动态内容 | ✅ | fetch JSON 渲染统计和列表 |
| 5. 时间线+报告+目录 | ✅ | project.html 含时间线+报告链接+本地目录 |

---

## 真实文件交付

### A. project.html (项目详情页)
- **大小**: 7,605 bytes
- **功能**: 项目信息 + 时间线 + 报告链接 + 本地目录
- **参数**: `?id={project_id}`
- **动态**: fetch data/projects.json 渲染详情

### B. data/timeline.json (时间线数据)
- **大小**: 25,844 bytes
- **事件数**: 100
- **字段**: id, projectId, projectName, date, event, type, reportUrl, localDir

### C. JS 联动
- **project.html**: `?id=X` 参数解析 + JSON 获取
- **索引页**: 可配置跳转 `project.html?id=xxx`

### D. 本地目录关联
- **字段**: localDir = `entities/{filename}.md`
- **显示**: 完整路径 ~Documents/tianbao-projects/...

### E. nav-links 更新
- 6 页面全部包含 timeline.html 和 project.html

---

## Git Commit 历史

| Commit | 说明 |
|--------|------|
| 333144b | Phase 2 C: 时间线页面 |
| 2f3a01b | Phase 2 M2-A + M3: index + data |
| 8009f5f | fix: 修复 wiki-index.html 死链 |
| 5e49fe9 | Phase 2 A: index.html 重写 |

---

## URL 验证

- **首页**: https://jinzhanxiang.github.io/tianbao-projects/index.html
- **项目详情**: https://jinzhanxiang.github.io/tianbao-projects/project.html?id=xingheng
- **时间线**: https://jinzhanxiang.github.io/tianbao-projects/timeline.html
- **项目列表**: https://jinzhanxiang.github.io/tianbao-projects/projects.html
- **报告库**: https://jinzhanxiang.github.io/tianbao-projects/reports.html
- **数据**: https://jinzhanxiang.github.io/tianbao-projects/data/projects.json
- **时间线数据**: https://jinzhanxiang.github.io/tianbao-projects/data/timeline.json