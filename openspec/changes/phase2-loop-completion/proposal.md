## Why

Phase 1 实现了"证据→推理→决策"的正向链路，但系统仍然是一个"一次性分析工具"。Phase 2 的使命是完成闭环的后半段——让决策执行的结果回流为新知识，使系统具备"自我进化"能力。

具体地：
1. **M4 洞察层缺失**: 当前推理引擎直接从碎片证据跳到决策卡，缺少中间的"结构化观点提炼"层。用户无法理解 AI 为什么得出这个结论。
2. **M3 立场分析缺失**: `IssueEvidence.stance` 目前只有手动设置（`stanceSource: 'manual'`，`stanceConfidence: 0`），没有 AI 自动分析。推理引擎的正反方划分缺少数据支撑。
3. **M7 行动项缺失**: 决策卡生成后无法转化为可追踪的任务。`suggestedActions` 是纯文本数组，没有结构化的 Action 实体。
4. **M8 回看闭环缺失**: 行动执行后的业务结果无法记录和回流。这是整个 ResearchOS 的"命门"——没有它，系统不具备学习能力。`Review.generatedEvidenceId` 字段已预设，但从未被填充。

## What Changes

### 变更 A: M4 洞察管理
- InsightService CRUD + AI 自动提炼 (从议题证据中生成洞察)
- 洞察确认/质疑工作流 (`draft` → `confirmed` / `disputed`)
- 洞察与证据的关联 (`InsightEvidence`: supports/contradicts/contextual)
- 推理引擎增强: 推理过程自动生成洞察 (`insight_generated` SSE event)
- 前端洞察管理页面

### 变更 B: M3 证据立场分析
- StanceService: AI 自动分析证据对议题的立场 (pro/con/neutral)
- 手动修正立场 (覆盖 AI 结果，`stanceSource` 切为 `manual`)
- 立场版本控制 (`stanceVersion` 递增, 议题描述变更后可重分析)
- 在 `evidenceService.linkToIssue()` 中自动触发立场分析

### 变更 C: M7 行动项管理
- ActionService CRUD + AI 从决策卡 `suggestedActions` + `risks` 自动生成结构化行动项
- 支持子任务 (`parentActionId`)
- 前端行动列表 + 状态变更 (pending → in_progress → completed)

### 变更 D: M8 回看闭环 (核心)
- ReviewService CRUD
- SummaryWorker: 将 Review 结果自动合成为 historical internal evidence
  - 输入: Review (`actualResult`, `expectedResult`, `deviation`, `lessonsLearned`) + 关联的 Issue/DecisionCard 上下文
  - 输出: 一条结构化的 Evidence (`sourceType: 'historical'`, `sourceCategory: 'internal'`)
  - 自动写入 `Review.generatedEvidenceId`
- 前端回看页面

## Capabilities

### New
- `insight-management`: 洞察 CRUD + AI 提炼 + 确认/质疑
- `stance-analysis`: AI 立场分析 + 手动修正 + 版本控制
- `action-management`: 行动项 CRUD + AI 生成 + 子任务
- `review-learning-loop`: 回看 CRUD + 经验转证据自动化

### Modified
- `adversarial-reasoning`: 推理过程中自动生成洞察 (调用 `InsightService.extractFromEvidence()`)
- `evidence-crud`: `linkToIssue()` 关联议题时自动触发立场分析 (异步，不阻塞关联操作)
- `issue-detail-page`: 集成洞察/行动/回看 Tab 面板

## Impact

新增文件 (~20):

**Backend:**
- `backend/src/modules/insights/service.ts` — InsightService: CRUD + extractFromEvidence + confirm/dispute
- `backend/src/modules/insights/prompts/extract-insights.ts` — 洞察提炼 prompt 模板
- `backend/app/api/insights/route.ts` — GET (列表) + POST (创建)
- `backend/app/api/insights/[id]/route.ts` — GET/PATCH/DELETE (单条操作) + POST confirm/dispute
- `backend/app/api/issues/[id]/insights/generate/route.ts` — POST 触发 AI 洞察生成
- `backend/src/modules/stance/service.ts` — StanceService: analyzeStance/manualOverride/reAnalyze
- `backend/src/modules/stance/prompts/analyze-stance.ts` — 立场分析 prompt 模板
- `backend/app/api/issues/[id]/evidence/[evidenceId]/stance/route.ts` — GET/PUT 查看/修正立场
- `backend/src/modules/actions/service.ts` — ActionService: CRUD + generateFromDecision + updateStatus
- `backend/app/api/actions/route.ts` — GET + POST
- `backend/app/api/actions/[id]/route.ts` — GET/PATCH/DELETE
- `backend/src/modules/reviews/service.ts` — ReviewService: CRUD + triggerSummary
- `backend/app/api/reviews/route.ts` — GET + POST
- `backend/app/api/reviews/[id]/route.ts` — GET/PATCH
- `backend/src/workers/summary-worker.ts` — 回看结果合成为 historical evidence

**Frontend:**
- `frontend/src/features/insights/` — InsightListPage 完善 + InsightCard + 确认/质疑按钮
- `frontend/src/features/actions/` — ActionListPage 完善 + 状态变更 + AI 生成入口
- `frontend/src/features/reviews/` — ReviewListPage 完善 + 表单 + 生成证据预览

**修改文件:**
- `backend/src/modules/evidence/service.ts` — `linkToIssue()` 增加异步立场分析触发
- `frontend/src/features/issues/pages/IssueDetailPage.vue` — 集成洞察/行动/回看 Tab
