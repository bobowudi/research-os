# Phase 3: 增强 — Proposal

> Status: proposed
> Phase: 3 — Enhancement (~1 week)
> Depends on: Phase 2 (Loop Completion) fully operational

## Why

Phase 2 完成了核心闭环。Phase 3 的目标是让系统从"能用"变为"好用"：

1. **M9 信号检测**: 系统应能主动发现证据库中的异常、趋势和机会，而非等用户手动翻阅。这是 AI "主动感知"能力的体现。
2. **M10 数据源增强**: Phase 1 只实现了 RSS 和简单爬虫，现在需要支持 API 集成和文件监听，并完善质量监控。
3. **M11 仪表盘完善**: 从基础统计卡升级为可配置的工作台，展示行动进度、紧急决策、最近信号等。
4. **ES 全文检索**: 替代 SQL LIKE，提供真正的全文搜索能力，覆盖证据、议题、洞察。

## What Changes

### 变更 A: M9 信号检测
- SignalService: CRUD + detect (AI 扫描证据库)
- Signal Detection Worker: 定期运行，分析新入库证据的异常/趋势
- 信号→议题关联 + 信号→洞察自动转化
- 前端信号管理页面

### 变更 B: M10 数据源增强
- API Integration 数据源类型 (配置 API endpoint + auth + field mapping)
- File Watch 数据源类型 (监听文件/目录变更)
- 同步频率调度 (cron-based)
- 导入质量监控 (error rate, dedup rate)
- 前端数据源详情页 + 导入历史

### 变更 C: M11 仪表盘完善
- Dashboard Service 重构: 组件化数据聚合
- 可配置仪表盘 (用户选择展示哪些组件)
- 紧急决策提醒 + 逾期行动提醒 + 最近信号

### 变更 D: ES 全文检索
- ES Index Mapping 定义 (evidence, issues, insights)
- MySQL→ES 数据同步机制 (双写 + 定时全量同步)
- 替换 evidence/issues/insights 的 SQL LIKE 为 ES 查询
- 全局搜索 API

## Capabilities

### New
- signal-detection: AI 主动信号检测 + 管理
- api-data-source: API 类型数据源集成
- file-watch-source: 文件监听数据源
- es-full-text-search: 全文检索基础设施
- configurable-dashboard: 可配置仪表盘
- global-search: 跨模块全局搜索

### Modified
- data-source-management: 增强采集能力
- dashboard: 组件化重构

## Impact

新增文件 (~15):

Backend:
- `backend/src/modules/signals/service.ts`
- `backend/src/modules/signals/prompts/detect-signals.ts`
- `backend/app/api/signals/route.ts` + `[id]/route.ts`
- `backend/src/workers/signal-worker.ts`
- `backend/src/workers/api-source-worker.ts`
- `backend/src/workers/file-watch-worker.ts`
- `backend/src/workers/sync-scheduler.ts`
- `backend/src/modules/search/service.ts`
- `backend/src/modules/search/es-indices.ts`
- `backend/src/modules/search/sync.ts`
- `backend/app/api/search/route.ts`
- `backend/src/modules/dashboard/service.ts` (重构)

Frontend:
- `frontend/src/features/signals/` (完善)
- `frontend/src/features/dashboard/` (重构为组件化)
- `frontend/src/shared/components/GlobalSearch.vue`
