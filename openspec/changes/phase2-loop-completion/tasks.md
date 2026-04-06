## 1. M4 洞察管理 — 后端

- [ ] 1.1 创建 `backend/src/modules/insights/service.ts` — InsightService: create/list/getById/update/confirm/dispute
- [ ] 1.2 创建 `backend/src/modules/insights/prompts/extract-insights.ts` — 洞察提炼 prompt 模板 + buildExtractInsightsPrompt()
- [ ] 1.3 实现 `insightService.extractFromEvidence(tenantId, issueId, opts)` — 从议题证据中 AI 提炼洞察 + 写入 InsightEvidence 关联
- [ ] 1.4 创建 `backend/app/api/insights/route.ts` + `[id]/route.ts` — CRUD API (GET 列表/POST 创建/GET 详情/PATCH 更新/DELETE 删除)
- [ ] 1.5 创建 `backend/app/api/insights/[id]/confirm/route.ts` + `dispute/route.ts` — POST 确认/质疑操作
- [ ] 1.6 创建 `backend/app/api/issues/[id]/insights/generate/route.ts` — POST 触发 AI 洞察生成
- [ ] 1.7 增强 reasoning-worker.ts — 推理过程中自动调用 extractFromEvidence() + 发送 SSE insight_generated event

## 2. M3 立场分析

- [ ] 2.1 创建 `backend/src/modules/stance/service.ts` — StanceService: analyzeStance/manualOverride/reAnalyze
- [ ] 2.2 创建 `backend/src/modules/stance/prompts/analyze-stance.ts` — 立场分析 prompt 模板 (输出 stance/confidence/reason JSON)
- [ ] 2.3 修改 `backend/src/modules/evidence/service.ts` — linkToIssue() 末尾添加异步立场分析触发 (catch 静默处理)
- [ ] 2.4 创建 `backend/app/api/issues/[id]/evidence/[evidenceId]/stance/route.ts` — GET 查看立场 / PUT 手动修正
- [ ] 2.5 手动测试: 关联证据 → 自动 AI 分析立场 → 手动修正立场 → stanceVersion 递增 → reAnalyze 验证

## 3. M7 行动项管理

- [ ] 3.1 创建 `backend/src/modules/actions/service.ts` — ActionService: create/list/getById/update/delete/updateStatus
- [ ] 3.2 实现 `actionService.generateFromDecision(tenantId, decisionCardId, createdBy)` — AI 从决策卡自动生成结构化 Action 列表
- [ ] 3.3 创建 `backend/app/api/actions/route.ts` + `[id]/route.ts` — CRUD API
- [ ] 3.4 创建 `backend/app/api/decision-cards/[id]/generate-actions/route.ts` — POST 触发 AI 行动项生成
- [ ] 3.5 完善 `frontend/src/features/actions/pages/ActionListPage.vue` — 列表 + 状态列分组 + 优先级标签 + 状态变更按钮

## 4. M8 回看闭环 (核心)

- [ ] 4.1 创建 `backend/src/modules/reviews/service.ts` — ReviewService: create/list/getById/update + triggerSummary
- [ ] 4.2 创建 `backend/app/api/reviews/route.ts` + `[id]/route.ts` — CRUD API (POST 创建/GET 列表/GET 详情/PATCH 更新)
- [ ] 4.3 创建 `backend/src/workers/summary-worker.ts` — 回看结果合成为 historical evidence (含幂等保护)
- [ ] 4.4 注册 SummaryWorker 到 workers/index.ts + 定义 SUMMARY BullMQ 队列
- [ ] 4.5 在 ReviewService.create() 中自动推送 SummaryWorker job (reviewId + tenantId)
- [ ] 4.6 手动测试: 创建 Review → SummaryWorker 执行 → 新 Evidence 入库 → Review.generatedEvidenceId 回填

## 5. 前端集成

- [ ] 5.1 完善 `InsightListPage.vue` — 类型/状态/来源筛选 + InsightCard 组件 + 确认/质疑操作按钮
- [ ] 5.2 对接 `IssueInsightPanel.vue` — 接入 `GET /api/issues/:id/insights` + 确认/质疑按钮 + AI 提炼按钮
- [ ] 5.3 完善 `IssueDecisionPanel.vue` — 添加"生成行动项"按钮 (调用 `POST /api/decision-cards/:id/generate-actions`)
- [ ] 5.4 完善 `ReviewListPage.vue` — 回看表单 (outcome选择器 + 必填文本域) + 结果记录 + 已生成证据预览链接
- [ ] 5.5 在 IssueDetailPage 添加行动项 Tab + 回看 Tab (复用 ActionListPage/ReviewListPage 组件，过滤 issueId)
- [ ] 5.6 端到端手动测试: 议题 → 关联证据(自动立场分析) → 推理(自动洞察生成) → 决策卡 → 生成行动项 → 行动完成 → 创建回看 → 新证据入库 → 验证完整闭环
