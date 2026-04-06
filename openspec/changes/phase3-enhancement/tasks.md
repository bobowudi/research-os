# Phase 3: 增强 — Tasks

> Status: proposed
> Phase: 3 — Enhancement (~1 week)
> 预估: 5-7 天

## 1. M9 信号检测

- [ ] 1.1 创建 `modules/signals/service.ts` — SignalService: CRUD + acknowledge + linkIssue + toInsight
- [ ] 1.2 创建 `modules/signals/prompts/detect-signals.ts` — 信号检测 prompt 模板
- [ ] 1.3 创建 `workers/signal-worker.ts` — 定期扫描证据库检测信号
- [ ] 1.4 创建 `app/api/signals/route.ts` + `[id]/route.ts` — CRUD + acknowledge API
- [ ] 1.5 实现信号→洞察自动转化 (高严重度自动创建 Insight)
- [ ] 1.6 完善 `SignalListPage.vue` — 信号列表 + 严重度筛选 + 确认/关联操作
- [ ] 1.7 手动测试: 创建证据 → 信号检测 → 确认 → 关联议题

## 2. M10 数据源增强

- [ ] 2.1 创建 `workers/api-source-worker.ts` — API 类型数据源 Worker (支持 3 种鉴权)
- [ ] 2.2 创建 `workers/sync-scheduler.ts` — 基于 BullMQ repeatable jobs 的同步调度器
- [ ] 2.3 增强 `DataSourceService` — 同步调度管理 + 质量统计 (errorRate, dedupRate)
- [ ] 2.4 完善 `DataSourceListPage.vue` — 详情页 + 导入历史 + 健康状态指示
- [ ] 2.5 手动测试: API 数据源创建 → 自动调度 → 证据入库

## 3. ES 全文检索

- [ ] 3.1 创建 `modules/search/es-indices.ts` — evidence/issues/insights 三个 index mapping
- [ ] 3.2 创建 `modules/search/sync.ts` — 双写机制 (MySQL 写后异步 index) + 全量同步任务
- [ ] 3.3 创建 `modules/search/service.ts` — SearchService: globalSearch + indexDocument + deleteDocument
- [ ] 3.4 创建 `app/api/search/route.ts` — GET 全局搜索 API
- [ ] 3.5 替换 evidence/issues service 中的 SQL LIKE 为 ES 查询
- [ ] 3.6 更新 docker-compose.yml — 添加 IK 中文分词插件到 ES 配置
- [ ] 3.7 手动测试: 中文全文搜索 + 向量搜索 + 跨实体搜索

## 4. M11 仪表盘完善

- [ ] 4.1 重构 `modules/dashboard/service.ts` — 组件化数据聚合 (每个组件独立查询)
- [ ] 4.2 添加仪表盘配置 API — GET/PATCH dashboard config (存储在 users 表 JSON 字段)
- [ ] 4.3 重构 `DashboardPage.vue` — 组件化布局 + 可配置显示/隐藏 + 排序
- [ ] 4.4 创建仪表盘组件: OverviewStats, UrgentDecisions, MyActions, RecentSignals, ActionProgress
- [ ] 4.5 手动测试: 配置仪表盘 + 数据刷新 + 组件交互

## 5. 全局搜索 — 前端

- [ ] 5.1 创建 `shared/components/GlobalSearch.vue` — 搜索框 + 结果下拉 (evidence/issues/insights 分组)
- [ ] 5.2 集成到 `AppWorkspaceHeader.vue` — 顶部搜索栏
- [ ] 5.3 手动测试: 全局搜索跨实体结果展示 + 点击跳转

---

## 执行顺序建议

```
Day 1-2: ES 全文检索 (Section 3) — 基础设施优先
Day 2-3: M9 信号检测 (Section 1) — 核心新功能
Day 4:   M10 数据源增强 (Section 2) — 扩展采集
Day 5:   M11 仪表盘完善 (Section 4) — 展示层
Day 5-6: 全局搜索前端 (Section 5) — 用户体验
Day 7:   集成测试 + 修复 + 文档
```

## 验收标准

- [ ] 信号检测 Worker 可运行，能从证据库中检测出至少 1 个信号
- [ ] 高严重度信号自动生成 Insight
- [ ] API 数据源可配置并自动调度同步
- [ ] 中文全文搜索在 evidence/issues/insights 上可用
- [ ] 全局搜索框可跨实体搜索并跳转
- [ ] 仪表盘组件可配置显示/隐藏
- [ ] docker-compose.yml 包含 IK 分词插件配置
