# Phase 1 — 核心引擎 (Core Engine)

- **阶段**: Phase 1
- **预估时间**: ~2.5 周
- **前置依赖**: Phase 0 (M1 修复 + RBAC 中间件 + BullMQ Worker 框架)

## Why

Phase 1 构建 MVP 闭环的核心引擎——从证据管理到对抗推理到决策生成。这是产品核心价值的载体：没有对抗推理，ResearchOS 只是一个数据管理工具；有了它，才是一个 AI 决策系统。

当前状态：
- M2 证据管理：前端仅有 stub 列表页 + EvidenceCard 组件，后端无 CRUD 服务
- M10 数据源：完全未实现，但数据库表已就绪
- M5 对抗推理：完全未实现，是产品核心差异化能力
- M6 决策卡：完全未实现

Phase 0 提供的基础：BullMQ Worker 框架 + RBAC 中间件 + M1 修复

## What Changes

### 变更 A: M2 证据管理完整实现
- 后端 evidenceService CRUD + 关联议题 + AI 摘要生成
- 前端证据列表页完善 + 创建/编辑弹窗 + 详情面板
- 证据搜索 (Kysely LIKE, MVP 阶段不用 ES 全文检索)

### 变更 B: M10 基础数据采集
- DataSource CRUD 后端服务
- RSS Feed Worker (BullMQ) — 自动定期抓取 RSS 源
- 简单网页爬虫 Worker — 支持 URL + CSS 选择器提取
- ImportJob 状态追踪
- 前端数据源管理页面 (基础 CRUD)

### 变更 C: Embedding 基础设施
- Embedding Worker (BullMQ) — 新证据入库时自动向量化
- ES dense_vector index mapping 定义
- 证据/议题双向向量化
- 自动关联: 新证据 → 匹配活跃议题 (cosine similarity, 阈值 ≥0.7 自动/0.5-0.7 推荐)

### 变更 D: M5 对抗推理引擎 MVP
- ReasoningRun 状态机 (9 states)
- Preflight check (standard/degraded/single_side/refused)
- 三方 Agent: Advocate (内部证据) → Critic (外部证据) → Judge (综合裁判)
- SSE 流式输出 (6 event types)
- Prompt 模板设计 (三方各一套)
- Reasoning Worker (BullMQ)
- 前端: 触发推理按钮 + SSE 流式展示 (最简 UI)

### 变更 E: M6 决策卡自动生成
- 从 Judge 输出自动生成 DecisionCard
- 决策卡后端 CRUD + 投票
- 前端: 决策卡详情页 (展示推理过程 + 投票)

## Capabilities

### New
- **evidence-crud**: 证据完整 CRUD + 议题关联
- **data-source-management**: 数据源 CRUD + RSS/爬虫 Worker
- **embedding-pipeline**: 向量化 + 自动关联
- **adversarial-reasoning**: 三方对抗推理引擎
- **decision-card-generation**: 决策卡自动生成 + 投票

### Modified
- **evidence-list-page**: 从 stub 升级为完整功能
- **data-sources-page**: 从 stub 升级为基础 CRUD
- **decisions-page**: 从 stub 升级为决策卡展示 + 投票

## Impact

新增文件 (~30+):

**Backend:**
- `backend/src/modules/evidence/service.ts`
- `backend/src/modules/evidence/constants.ts`
- `backend/app/api/evidence/route.ts` (完整重写)
- `backend/app/api/evidence/[id]/route.ts`
- `backend/app/api/issues/[id]/evidence/route.ts`
- `backend/src/modules/data-sources/service.ts`
- `backend/app/api/data-sources/route.ts`
- `backend/app/api/data-sources/[id]/route.ts`
- `backend/app/api/data-sources/[id]/sync/route.ts`
- `backend/src/workers/rss-worker.ts`
- `backend/src/workers/crawler-worker.ts`
- `backend/src/workers/embedding-worker.ts`
- `backend/src/workers/reasoning-worker.ts`
- `backend/src/modules/embedding/service.ts`
- `backend/src/modules/embedding/es-mapping.ts`
- `backend/src/modules/reasoning/service.ts`
- `backend/src/modules/reasoning/prompts/advocate.ts`
- `backend/src/modules/reasoning/prompts/critic.ts`
- `backend/src/modules/reasoning/prompts/judge.ts`
- `backend/src/modules/reasoning/state-machine.ts`
- `backend/src/modules/decisions/service.ts`
- `backend/app/api/decisions/route.ts` (完整重写)
- `backend/app/api/decisions/[id]/route.ts`
- `backend/app/api/decisions/[id]/vote/route.ts`
- `backend/app/api/issues/[id]/reasoning/route.ts` (trigger + SSE)

**Frontend:**
- `frontend/src/features/evidence/` (完善: 创建弹窗/编辑弹窗/详情)
- `frontend/src/features/data-sources/` (完善: CRUD 页面)
- `frontend/src/features/decisions/` (完善: 详情页+投票)
- `frontend/src/features/issues/components/IssueReasoningPanel.vue` (推理触发+SSE流)

**修改文件:**
- `frontend/src/features/evidence/pages/EvidenceListPage.vue`
- `frontend/src/features/data-sources/pages/DataSourceListPage.vue`
- `frontend/src/features/decisions/pages/DecisionListPage.vue`
- `frontend/src/features/decisions/pages/DecisionDetailPage.vue`
- `backend/src/workers/index.ts` (注册新 Workers)
