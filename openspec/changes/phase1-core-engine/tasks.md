# Phase 1 — 核心引擎 任务清单

- **预估总时间**: ~2.5 周
- **前置依赖**: Phase 0 全部完成
- **每任务上限**: ≤2 小时

---

## 1. M2 证据管理 — 后端

> 依赖: Phase 0 完成 (RBAC 中间件可用)
> 预估: 2 天

- [ ] 1.1 创建 `backend/src/modules/evidence/constants.ts` — SOURCE_CATEGORIES, SOURCE_TYPES, ALLOWED_SORT_BY, 分页默认值
  - 输出: 常量文件，被 service 和 API route 引用
  - 预估: 30 分钟

- [ ] 1.2 创建 `backend/src/modules/evidence/service.ts` — EvidenceService 类: create/list/getById/update/delete
  - Kysely 操作 `evidence` 表
  - list() 实现 SQL LIKE 搜索 (title + content)、sourceCategory/sourceType 筛选、分页排序
  - delete() 为软删除 (设 deleted_at)
  - create() 结束时 enqueue embedding job
  - 预估: 2 小时

- [ ] 1.3 实现 `service.linkToIssue()` / `unlinkFromIssue()` — 创建/删除 issue_evidence 记录
  - 支持可选的 relevanceScore 参数
  - stance 字段暂设为 'neutral'，Phase 2 再实现 AI 自动立场分析
  - 预估: 1 小时

- [ ] 1.4 实现 `service.generateSummary()` — 调用已有 AI client (Claude API) 生成证据摘要
  - 输入: evidence.title + evidence.content
  - 输出: 200 字以内摘要，写入 evidence.summary 字段
  - 使用已有的 prompt template engine
  - 预估: 1 小时

- [ ] 1.5 创建 `app/api/evidence/route.ts` — GET (list + search + filter) / POST (create)
  - GET: 解析 query params → 调用 service.list() → 返回分页结果
  - POST: Zod 校验 body → 调用 service.create() → 201
  - 接入 RBAC 中间件
  - 预估: 1.5 小时

- [ ] 1.6 创建 `app/api/evidence/[id]/route.ts` — GET / PATCH / DELETE
  - GET: service.getById() 含关联议题列表
  - PATCH: Zod partial 校验 → service.update()
  - DELETE: service.delete() (软删除)
  - 预估: 1 小时

- [ ] 1.7 创建 `app/api/issues/[id]/evidence/route.ts` — GET / POST
  - GET: 获取议题关联的所有证据 (join issue_evidence + evidence)
  - POST: 关联证据到议题 { evidenceId, relevanceScore? } → service.linkToIssue()
  - DELETE: 取消关联 → service.unlinkFromIssue()
  - 预估: 1 小时

- [ ] 1.8 手动测试: 证据 CRUD + 关联 + 摘要生成
  - 使用 curl / REST client 测试所有 API 端点
  - 验证: 创建→列表→搜索→更新→关联议题→生成摘要→删除
  - 预估: 1 小时

---

## 2. M2 证据管理 — 前端

> 依赖: 1.x 后端完成
> 预估: 2 天

- [ ] 2.1 创建 `features/evidence/api/evidence.ts` — API 请求封装
  - 封装所有证据相关 API 调用 (list, getById, create, update, delete, linkToIssue)
  - 使用已有的 axios/fetch 封装
  - 预估: 45 分钟

- [ ] 2.2 完善 `EvidenceListPage.vue` — 接入真实 API
  - 替换 stub 数据为真实 API 调用
  - 添加搜索栏 (el-input + debounce)
  - 添加筛选 (sourceCategory 下拉, sourceType 下拉)
  - 添加分页 (el-pagination)
  - 添加 "创建证据" 按钮
  - 预估: 2 小时

- [ ] 2.3 创建 `EvidenceCreateDialog.vue` — 证据创建弹窗
  - El-dialog + el-form (title, content, sourceUrl, sourceCategory, sourceType)
  - Zod 前端校验
  - 提交成功后刷新列表 + 关闭弹窗
  - 预估: 1.5 小时

- [ ] 2.4 创建 `EvidenceEditDialog.vue` — 证据编辑弹窗
  - 复用 CreateDialog 结构，加载已有数据
  - 预估: 1 小时

- [ ] 2.5 完善 `IssueEvidencePanel.vue` — 议题详情页的证据关联面板
  - 展示已关联证据列表
  - 搜索并关联新证据 (el-select remote)
  - 取消关联按钮
  - 预估: 1.5 小时

- [ ] 2.6 手动测试: 前后端联调
  - 验证: 列表展示→搜索筛选→创建→编辑→关联议题→取消关联
  - 预估: 1 小时

---

## 3. M10 基础数据采集 — 后端

> 依赖: 1.2 (EvidenceService 可用), Phase 0 BullMQ Worker 框架
> 预估: 2.5 天

- [ ] 3.1 创建 `backend/src/modules/data-sources/service.ts` — DataSourceService
  - CRUD 操作 (create, list, getById, update, delete)
  - triggerSync(): 创建 ImportJob 记录 + 根据 type 入队对应 Worker
  - updateLastSync(): 更新 lastSyncAt 字段
  - create/update 时设置 BullMQ repeatable job (RSS 定时抓取)
  - 预估: 2 小时

- [ ] 3.2 创建 `app/api/data-sources/route.ts` — GET / POST
  - GET: 列表 + 筛选 (type, isActive) + 分页
  - POST: 创建数据源 + 自动设置定时任务
  - 预估: 1 小时

- [ ] 3.3 创建 `app/api/data-sources/[id]/route.ts` — GET / PATCH / DELETE
  - DELETE 时需要移除对应的 BullMQ repeatable job
  - 预估: 1 小时

- [ ] 3.4 创建 `app/api/data-sources/[id]/sync/route.ts` — POST
  - 手动触发同步: 创建 ImportJob → 入队 Worker job
  - 返回 importJobId 供前端轮询进度
  - 预估: 45 分钟

- [ ] 3.5 创建 `backend/src/workers/rss-worker.ts` — RSS Feed 抓取 Worker
  - 依赖: rss-parser npm 包
  - 流程: 拉取 RSS XML → 解析 entries → 去重 (deduplicationKey = md5(guid||link)) → 创建 Evidence → 更新 ImportJob → 触发 embedding
  - 错误处理: 单条 entry 失败不影响其他 entries
  - 预估: 2 小时

- [ ] 3.6 创建 `backend/src/workers/crawler-worker.ts` — 简单网页爬虫 Worker
  - 依赖: cheerio npm 包
  - 流程: fetch HTML → cheerio 解析 → cssSelector 提取正文 → 去重 → 创建 Evidence → 触发 embedding
  - 支持多 URL 串行抓取
  - 超时: 单个 URL 30s timeout
  - 预估: 2 小时

- [ ] 3.7 注册新 Worker 到 `backend/src/workers/index.ts`
  - 注册 RssWorker, CrawlerWorker
  - 预估: 30 分钟

- [ ] 3.8 手动测试: 创建 RSS 数据源 + 触发同步 + 验证证据入库
  - 使用真实 RSS 源 (如 HackerNews) 测试端到端流程
  - 验证: 创建数据源 → 手动触发同步 → ImportJob 状态追踪 → 证据入库
  - 预估: 1 小时

---

## 4. M10 基础数据采集 — 前端

> 依赖: 3.x 后端完成
> 预估: 1 天

- [ ] 4.1 完善 `DataSourceListPage.vue` — 数据源管理页面
  - 表格列表展示 (name, type, isActive, lastSyncAt, status)
  - 创建弹窗: 根据 type 动态渲染 config 表单
    - rss_feed: feedUrl (必填), pollInterval (默认 30 分钟), contentType
    - web_crawler: urls (textarea, 每行一个), cssSelector
  - 每行操作: 编辑、删除、手动同步按钮
  - 同步按钮点击后显示 loading + toast 提示
  - 预估: 2 小时

- [ ] 4.2 手动测试: 前后端联调
  - 验证: 创建 RSS 源 → 列表展示 → 手动同步 → 状态更新
  - 预估: 45 分钟

---

## 5. Embedding 基础设施

> 依赖: 1.2 (EvidenceService), ES client 已存在
> 预估: 2 天

- [ ] 5.1 创建 `backend/src/modules/embedding/service.ts` — EmbeddingService
  - embed(): 调用 Voyage AI API (voyage-3-lite, 1024 dims)，失败降级到 OpenAI text-embedding-3-small (1536 dims)
  - 文本预处理: 截断到 8000 tokens，去除多余空白
  - storeVector(): 写入 ES dense_vector index
  - findSimilar(): ES KNN 搜索 (cosine similarity)
  - 预估: 2 小时

- [ ] 5.2 创建 `backend/src/modules/embedding/es-mapping.ts` — ES index mapping 定义
  - dense_vector 字段 (1024 dims, cosine similarity)
  - ensureEmbeddingIndex() 幂等初始化函数
  - 启动时调用确保 index 存在
  - 预估: 1 小时

- [ ] 5.3 创建 `backend/src/workers/embedding-worker.ts` — Embedding Worker
  - 从 DB 获取实体文本 (evidence: title+content, issue: title+description)
  - 调用 embeddingService.embed() 向量化
  - 调用 embeddingService.storeVector() 存储
  - 调用 autoAssociate 自动关联
  - 注册到 workers/index.ts
  - 预估: 1.5 小时

- [ ] 5.4 实现 `autoAssociateEvidence()` / `autoAssociateIssue()` — 向量匹配 + 阈值关联
  - 新证据: 搜索相似议题 → ≥0.7 自动创建 issue_evidence → 0.5-0.7 创建推荐
  - 新议题: 搜索相似证据 → 同上逻辑
  - 自动关联记录标记 source: 'auto_linked' 或 'recommended'
  - 预估: 1.5 小时

- [ ] 5.5 在 EvidenceService.create() 和 IssueService.create()/update() 后触发 embedding job
  - 在现有的 create/update 方法末尾添加 embeddingQueue.add()
  - update 时也要重新向量化 (内容可能变化)
  - 预估: 45 分钟

- [ ] 5.6 手动测试: 创建证据 → 自动向量化 → 匹配议题 → 关联
  - 创建一个议题 + 几条相关/不相关证据
  - 验证: embedding job 执行 → ES 存储向量 → 自动关联/推荐
  - 预估: 1 小时

---

## 6. M5 对抗推理引擎

> 依赖: 1.x (EvidenceService), 5.x (EmbeddingService), AI client 已存在
> 预估: 3 天 (Phase 1 最核心最复杂部分)

- [ ] 6.1 创建 `backend/src/modules/reasoning/state-machine.ts` — 9 状态流转机
  - REASONING_STATES 常量
  - VALID_TRANSITIONS 转移矩阵
  - ReasoningStateMachine 类: transition() 乐观锁更新 + Redis pub/sub 广播
  - InvalidTransitionError, ConcurrentModificationError
  - 预估: 1.5 小时

- [ ] 6.2 创建 `backend/src/modules/reasoning/service.ts` — ReasoningService
  - preflight(): 查询 issue_evidence 按 stance 分组计数 → 判定 mode
  - trigger(): preflight → 创建 reasoning_run 记录 → 入队 BullMQ job → 返回 runId
  - getStatus(): 查询 reasoning_run + 已完成 Agent 的输出
  - getLatestRun(): 获取议题最近一次推理运行
  - cancel(): 状态转移到 cancelled + 取消 BullMQ job
  - 预估: 2 小时

- [ ] 6.3 设计 `prompts/advocate.ts` — 正方 Agent prompt 模板
  - 输入: 议题 (title, description, hypothesis) + 正方证据列表
  - 输出 JSON schema: mainArgument, supportingPoints[], confidence, caveats[]
  - 模板包含: 角色说明、证据列表、任务描述、输出格式、注意事项
  - ADVOCATE_CONFIG: claude-sonnet-4-20250514, temperature 0.7, maxTokens 4000
  - 预估: 1.5 小时

- [ ] 6.4 设计 `prompts/critic.ts` — 反方 Agent prompt 模板
  - 输入: 议题 + 反方证据列表 + 正方输出 (用于针对性反驳)
  - 输出 JSON schema: mainRebuttal, counterPoints[], independentArguments[], confidence, acknowledgedStrengths[]
  - CRITIC_CONFIG: claude-sonnet-4-20250514, temperature 0.7, maxTokens 4000
  - 预估: 1.5 小时

- [ ] 6.5 设计 `prompts/judge.ts` — 裁判 Agent prompt 模板
  - 输入: 议题 + 全部证据 + 正方输出 + 反方输出 + confidenceModifier
  - 输出 JSON schema: verdict, recommendation, confidence (6 维), keyFactors[], risks[], dissent, suggestedActions[]
  - JUDGE_CONFIG: claude-sonnet-4-20250514, temperature 0.3, maxTokens 6000
  - 预估: 2 小时

- [ ] 6.6 创建 `backend/src/workers/reasoning-worker.ts` — 推理 Worker
  - 串行执行: pending → preparing (加载数据) → advocate_running → critic_running → judge_running → generating_card → completed
  - 每个阶段: 状态转移 + Redis pub/sub 广播进度 + AI 调用 + 保存输出
  - 错误处理: catch → transition to failed + 广播 error event
  - AI 输出 JSON parse 容错: 尝试 JSON.parse → 失败则用 regex 提取
  - 注册到 workers/index.ts
  - 预估: 2 小时

- [ ] 6.7 创建 `app/api/issues/[id]/reasoning/route.ts` — POST (trigger) + GET (SSE stream)
  - POST: 调用 reasoningService.trigger() → 返回 { runId, preflight }
  - GET ?runId=xxx: 建立 SSE 连接 → Redis subscribe → 转发事件 → 终态时关闭
  - GET 无 runId: 返回最近一次推理运行状态
  - SSE headers: Content-Type: text/event-stream, Cache-Control: no-cache
  - 心跳: 每 15 秒发送 heartbeat event
  - 超时: 5 分钟自动关闭 SSE 连接
  - 预估: 2 小时

- [ ] 6.8 实现 Redis pub/sub 推理进度广播
  - Channel: `reasoning:{runId}`
  - 6 种事件: status_change, progress, agent_complete, insight_generated, completed, error
  - Worker 端发布，SSE endpoint 端订阅
  - 预估: 1 小时

- [ ] 6.9 手动测试: 触发推理 → SSE 流式输出 → 查看最终结果
  - 准备: 创建议题 + 关联正反方证据各 3 条
  - 测试: POST trigger → 用 curl/EventSource 监听 SSE → 验证 6 种事件依次到达 → 验证最终 reasoning_run 状态 = completed
  - 边界测试: 证据不足 (refused)、单方证据 (single_side)、cancel
  - 预估: 1.5 小时

---

## 7. M5 推理 — 前端

> 依赖: 6.x 后端完成
> 预估: 1.5 天

- [ ] 7.1 创建 `IssueReasoningPanel.vue` — 推理触发 + SSE 流式展示
  - 三个状态区域: preflight 预检 / running 运行中 / result 结果
  - Preflight: "预检" 按钮 → 显示 mode + 证据计数 + 消息 → "启动推理" 按钮
  - Running: ElSteps 5 步进度条 + 文本日志流
  - SSE 连接: EventSource 监听 6 种事件 → 更新 steps + logs
  - Result: verdict + recommendation + 跳转决策卡链接
  - 组件销毁时关闭 EventSource 连接
  - 预估: 2 小时

- [ ] 7.2 在 `IssueDetailPage.vue` 中集成 ReasoningPanel 到 Tab 面板
  - 新增 "对抗推理" Tab
  - 传入 issueId prop
  - 预估: 45 分钟

- [ ] 7.3 手动测试: 前后端联调
  - 验证: 进入议题详情 → 推理 Tab → 预检 → 启动 → 实时看到进度 → 最终结果
  - 预估: 1 小时

---

## 8. M6 决策卡

> 依赖: 6.6 (reasoning-worker 中调用 DecisionService)
> 预估: 2 天

- [ ] 8.1 创建 `backend/src/modules/decisions/service.ts` — DecisionService
  - createFromJudgeOutput(): 从 JudgeOutput 映射到 decision_cards 表 (recommendation, verdict, confidence JSON, keyFactors JSON, risks JSON, dissent, suggestedActions JSON)
  - list(): 支持 issueId / status 筛选 + 分页
  - getById(): 含投票详情 + 关联 reasoning_run 信息
  - vote(): upsert 投票 + 更新 vote_summary 聚合
  - adopt() / reject(): 更新 status 到 'adopted' / 'rejected'
  - 预估: 2 小时

- [ ] 8.2 创建 API routes: `decisions/route.ts` + `[id]/route.ts` + `[id]/vote/route.ts`
  - GET /api/decisions — 列表
  - GET /api/decisions/:id — 详情 (含投票 + 推理过程)
  - PATCH /api/decisions/:id — 更新
  - DELETE /api/decisions/:id — 删除
  - POST /api/decisions/:id/vote — 投票 { vote, comment? }
  - POST /api/decisions/:id/adopt — 采纳
  - POST /api/decisions/:id/reject — 拒绝 { reason? }
  - 预估: 2 小时

- [ ] 8.3 在 reasoning-worker 推理完成后自动调用 DecisionService.createFromJudgeOutput()
  - 在 reasoning-worker.ts 的 generating_card 阶段调用
  - 将生成的 decisionCardId 写入 reasoning_run.metadata
  - 已在 6.6 中预留位置，此任务确保集成正确
  - 预估: 30 分钟

- [ ] 8.4 完善 `DecisionDetailPage.vue` — 决策卡详情 + 投票 + 评论
  - 顶部: verdict 标签 + recommendation 文字
  - 置信度: 6 维 ElProgress 进度条展示 (evidenceQuality, evidenceQuantity, argumentCoherence, consensusLevel, externalValidity, practicalFeasibility)
  - 关键因素: ElTag 列表 (positive/negative/neutral 颜色区分)
  - 风险: 列表展示
  - 少数意见 (dissent): 折叠面板
  - 建议行动: 列表展示
  - 投票区: 三个按钮 (同意/反对/弃权) + 可选评论 ElInput
  - 当前投票统计: 简单柱状或数字展示
  - 操作: 采纳/拒绝按钮 (需要权限)
  - 预估: 2 小时

- [ ] 8.5 完善 `DecisionListPage.vue` — 决策卡列表
  - 替换 stub 为真实 API
  - 筛选: 状态 (pending_review / adopted / rejected)
  - 每条: verdict 标签 + recommendation 摘要 + 投票统计 + 创建时间
  - 点击跳转详情页
  - 预估: 1 小时

- [ ] 8.6 手动测试: 推理完成 → 决策卡生成 → 投票 → 采纳/拒绝
  - 端到端验证: 触发推理 → 等待完成 → 自动生成决策卡 → 查看详情 → 投票 → 采纳
  - 预估: 1 小时

---

## 依赖关系总览

```
Phase 0 完成
    │
    ├── 1.x 证据后端 ──→ 2.x 证据前端
    │       │
    │       ├── 3.x 数据采集后端 ──→ 4.x 数据采集前端
    │       │
    │       └── 5.x Embedding 基础设施
    │               │
    │               └── 6.x 推理引擎后端 ──→ 7.x 推理前端
    │                       │
    │                       └── 8.x 决策卡 (后端+前端)
```

**关键路径**: 1.x → 5.x → 6.x → 8.x (约 9 天)

**可并行**: 
- 2.x (证据前端) 可与 3.x (数据采集后端) 并行
- 4.x (数据采集前端) 可与 5.x (Embedding) 并行
- 7.x (推理前端) 可与 8.1-8.3 (决策卡后端) 并行
