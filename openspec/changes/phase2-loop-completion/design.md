## Context

Phase 1 已完成：Evidence CRUD (`evidenceService`)、M5 对抗推理引擎 (reasoning-worker SSE 流)、M6 决策卡生成、M10 基础爬取、Embedding 管线。后端使用 Next.js 14 App Router + Kysely ORM + TiDB，AI 调用通过 `callLLM()` 统一封装（`@anthropic-ai/sdk`，默认 claude-sonnet-4-20250514）。

数据库表 `insights`、`insight_evidence`、`actions`、`reviews` 已在 `001_initial.ts` 迁移中创建。共享包的 TypeScript 类型（`Insight`、`InsightEvidence`、`Action`、`Review`）和枚举类型已完整定义。前端各模块仅有 stub 页面。

## Goals / Non-Goals

**Goals:**
- 实现 M4 洞察管理完整后端 CRUD + AI 提炼
- 实现 M3 证据立场 AI 分析 + 手动修正
- 实现 M7 行动项 CRUD + AI 从决策卡生成
- 实现 M8 回看闭环 + SummaryWorker 经验转证据自动化
- 增强推理引擎: 推理过程中自动生成洞察
- 前端各模块从 stub 升级为可交互页面

**Non-Goals:**
- 不实现洞察合并 (combining similar insights) — 后续迭代
- 不实现行动依赖关系图可视化 — 子任务层级足够 MVP
- 不实现回看评分/分析仪表盘 — 当前阶段回看数据量不足
- 不实现自动回看触发 (如行动完成自动弹出回看表单) — MVP 手动创建
- 不实现逾期自动检测定时任务 — 后续 cron job 迭代
- 不修改数据库 schema — 所有表结构已就位

## Decisions

### 1. 洞察提炼 Prompt — `extract-insights.ts`

```typescript
// backend/src/modules/insights/prompts/extract-insights.ts
import type { InsightType } from '@research-os/shared'

interface ExtractInsightsInput {
  issue: {
    title: string
    description: string
    domain?: string
  }
  evidenceList: {
    id: string
    content: string
    summary: string
    stance: 'pro' | 'con' | 'neutral'
    confidence: number
    sourceLabel: string
  }[]
}

interface ExtractedInsight {
  title: string
  description: string
  type: InsightType          // finding | risk | opportunity | contradiction
  direction: 'pro' | 'con' | 'neutral'
  confidence: number         // 0-100
  evidenceIds: string[]      // 支撑该洞察的证据 ID
}

interface ExtractInsightsOutput {
  insights: ExtractedInsight[]
}

export function buildExtractInsightsPrompt(input: ExtractInsightsInput): {
  system: string
  user: string
} {
  return {
    system: `你是一位高级研究分析师。你的任务是从一组证据中提炼结构化洞察。

洞察类型说明：
- finding: 关键发现 — 证据揭示的重要事实或趋势
- risk: 风险识别 — 证据指出的潜在威胁或不确定性
- opportunity: 机会发现 — 证据揭示的可利用有利条件
- contradiction: 矛盾发现 — 不同证据之间的冲突或不一致

方向说明：
- pro: 该洞察支持/有利于议题方向
- con: 该洞察反对/不利于议题方向
- neutral: 该洞察不明显偏向任何方向

要求：
1. 每条洞察必须有明确的证据支撑（列出 evidenceIds）
2. 同一条证据可以支撑多条洞察
3. confidence 基于支撑证据的数量和质量（0-100）
4. 避免重复提炼含义相同的洞察
5. 优先提炼高置信度、有实质性价值的洞察
6. 最多提炼 10 条洞察`,

    user: `## 议题
标题: ${input.issue.title}
描述: ${input.issue.description}
${input.issue.domain ? `领域: ${input.issue.domain}` : ''}

## 关联证据 (${input.evidenceList.length} 条)

${input.evidenceList.map((e, i) => `### 证据 ${i + 1} [ID: ${e.id}]
- 来源: ${e.sourceLabel}
- 立场: ${e.stance} | 置信度: ${e.confidence}
- 摘要: ${e.summary}
- 内容: ${e.content.substring(0, 800)}${e.content.length > 800 ? '...' : ''}
`).join('\n')}

请以 JSON 格式输出提炼的洞察:
\`\`\`json
{
  "insights": [
    {
      "title": "洞察标题",
      "description": "详细描述（2-3句话）",
      "type": "finding|risk|opportunity|contradiction",
      "direction": "pro|con|neutral",
      "confidence": 75,
      "evidenceIds": ["evidence-id-1", "evidence-id-2"]
    }
  ]
}
\`\`\``
  }
}
```

**设计理由:**
- Temperature 设为 0.5 — 需要一定创造性来发现隐含联系，但不能太发散
- 证据内容截断 800 字符 — 防止 token 溢出，摘要字段提供补充
- 最多 10 条洞察 — 避免低质量 padding，用户可多次调用
- 每条洞察必须引用 evidenceIds — 确保可追溯性

### 2. 立场分析 — `StanceService`

```typescript
// backend/src/modules/stance/service.ts
import { callLLM } from '@/modules/ai/llm/client'
import { getDatabase } from '@research-os/database'

interface StanceResult {
  stance: 'pro' | 'con' | 'neutral'
  confidence: number  // 0-1
  reason: string      // 一句话解释
}

export const stanceService = {
  /**
   * AI 分析证据对议题的立场
   * 更新 issue_evidence 记录，stanceSource 设为 'ai'
   */
  async analyzeStance(tenantId: string, issueId: string, evidenceId: string): Promise<StanceResult> {
    const db = getDatabase()

    // 1. 获取议题信息
    const issue = await db.selectFrom('issues').select(['title', 'description'])
      .where('id', '=', issueId).where('tenant_id', '=', tenantId).executeTakeFirstOrThrow()

    // 2. 获取证据信息
    const evidence = await db.selectFrom('evidence').select(['content', 'summary', 'source_label'])
      .where('id', '=', evidenceId).where('tenant_id', '=', tenantId).executeTakeFirstOrThrow()

    // 3. Claude API 调用
    const prompt = buildStancePrompt(issue, evidence)
    const { text } = await callLLM({
      system: prompt.system,
      messages: [{ role: 'user', content: prompt.user }],
      temperature: 0.2,  // 立场分析需要高确定性
      maxTokens: 512,
    })

    const result: StanceResult = JSON.parse(extractJSON(text))

    // 4. 更新 issue_evidence 记录
    await db.updateTable('issue_evidence')
      .set({
        stance: result.stance,
        stance_source: 'ai',
        stance_confidence: result.confidence,
        stance_reason: result.reason,
        stance_analyzed_at: new Date().toISOString(),
        // stanceVersion 由触发方控制递增
      })
      .where('issue_id', '=', issueId)
      .where('evidence_id', '=', evidenceId)
      .execute()

    return result
  },

  /**
   * 手动修正立场 — 覆盖 AI 结果
   */
  async manualOverride(
    tenantId: string,
    issueId: string,
    evidenceId: string,
    stance: 'pro' | 'con' | 'neutral',
    reason: string,
  ): Promise<void> {
    const db = getDatabase()
    await db.updateTable('issue_evidence')
      .set({
        stance,
        stance_source: 'manual',
        stance_confidence: 1.0,  // 手动判断视为 100% 确定
        stance_reason: reason,
        stance_analyzed_at: new Date().toISOString(),
      })
      .where('issue_id', '=', issueId)
      .where('evidence_id', '=', evidenceId)
      .execute()
  },

  /**
   * 重新分析议题下所有证据的立场
   * 适用于议题描述发生重大变更后
   */
  async reAnalyze(tenantId: string, issueId: string): Promise<void> {
    const db = getDatabase()

    // 获取该议题的所有关联证据（仅限 AI 分析的，手动修正的不覆盖）
    const links = await db.selectFrom('issue_evidence')
      .select(['evidence_id'])
      .where('issue_id', '=', issueId)
      .where('stance_source', '=', 'ai')
      .execute()

    // 递增 stanceVersion
    await db.updateTable('issue_evidence')
      .set((eb: any) => ({ stance_version: eb('stance_version', '+', 1) }))
      .where('issue_id', '=', issueId)
      .where('stance_source', '=', 'ai')
      .execute()

    // 逐条重新分析（串行避免 API 并发限制）
    for (const link of links) {
      await this.analyzeStance(tenantId, issueId, link.evidence_id)
    }
  },
}
```

**Prompt 输出格式:**
```json
{
  "stance": "pro",
  "confidence": 0.85,
  "reason": "该证据直接支持了议题中提出的市场增长假设，提供了具体的数据佐证"
}
```

**设计理由:**
- Temperature 0.2 — 立场判断是分类任务，需要高确定性
- `maxTokens: 512` — 输出简短结构化，无需长文本
- 手动修正不覆盖 `stanceVersion` — 版本控制仅跟踪 AI 重分析周期
- `reAnalyze` 跳过 `stanceSource: 'manual'` — 尊重人工判断
- 串行调用避免 Anthropic API 并发限制

### 3. 行动项生成 — 从决策卡自动展开

```typescript
// backend/src/modules/actions/service.ts (generateFromDecision 部分)
import { callLLM } from '@/modules/ai/llm/client'
import { getDatabase } from '@research-os/database'
import { v4 as uuid } from 'uuid'
import type { Action, ActionPriority } from '@research-os/shared'

async function generateFromDecision(
  tenantId: string,
  decisionCardId: string,
  createdBy: string,
): Promise<Action[]> {
  const db = getDatabase()

  // 1. 获取决策卡
  const card = await db.selectFrom('decision_cards')
    .selectAll()
    .where('id', '=', decisionCardId)
    .where('tenant_id', '=', tenantId)
    .executeTakeFirstOrThrow()

  const suggestedActions: string[] = JSON.parse(card.suggested_actions || '[]')
  const risks: any[] = JSON.parse(card.risks || '[]')

  // 2. Claude API: 结构化展开
  const { text } = await callLLM({
    system: `你是一位项目经理。请将决策卡的建议行动和风险转化为结构化的可执行任务列表。

每个任务需要：
- title: 简洁的任务标题（动词开头）
- description: 详细说明如何执行该任务
- priority: low/medium/high/urgent（基于关联风险的严重程度）
- parentIndex: 如果是某个主任务的子任务，填写主任务的索引（从0开始），否则为 null

规则：
1. 每个 suggestedAction 至少展开为 1 个主任务
2. 高严重性风险对应的行动优先级为 high 或 urgent
3. 子任务应该是具体的、可在 1-3 天内完成的工作单元
4. 总任务数不超过 15 个`,
    messages: [{
      role: 'user',
      content: `决策建议: ${card.recommendation}

建议行动:
${suggestedActions.map((a, i) => `${i + 1}. ${a}`).join('\n')}

识别风险:
${risks.map((r, i) => `${i + 1}. [${r.severity}] ${r.description}`).join('\n')}

请以 JSON 格式输出:
\`\`\`json
{
  "actions": [
    {
      "title": "任务标题",
      "description": "详细描述",
      "priority": "high",
      "parentIndex": null
    }
  ]
}
\`\`\``
    }],
    temperature: 0.3,
    maxTokens: 2048,
  })

  const parsed = JSON.parse(extractJSON(text))
  const actions: Action[] = []
  const idMap: Record<number, string> = {}

  // 3. 创建 Action 记录
  for (let i = 0; i < parsed.actions.length; i++) {
    const item = parsed.actions[i]
    const id = uuid()
    idMap[i] = id

    await db.insertInto('actions').values({
      id,
      tenant_id: tenantId,
      issue_id: card.issue_id,
      decision_card_id: decisionCardId,
      parent_action_id: item.parentIndex !== null ? idMap[item.parentIndex] : null,
      title: item.title,
      description: item.description,
      status: 'pending',
      priority: item.priority as ActionPriority,
      created_by: createdBy,
    }).execute()

    actions.push({
      id,
      tenantId,
      issueId: card.issue_id,
      decisionCardId,
      parentActionId: item.parentIndex !== null ? idMap[item.parentIndex] : undefined,
      title: item.title,
      description: item.description,
      status: 'pending',
      priority: item.priority,
      createdBy: createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  return actions
}
```

**设计理由:**
- 用 `parentIndex` 引用而非 ID — AI 生成时 ID 尚不存在，用数组索引建立父子关系
- 顺序插入 — 确保 `idMap` 中父任务 ID 在子任务创建前已就位
- 优先级基于风险严重性 — 符合业务逻辑，高风险项优先处理
- 限制 15 个任务 — 防止 AI 过度展开

### 4. SummaryWorker — 闭环核心

```typescript
// backend/src/workers/summary-worker.ts
import { callLLM } from '@/modules/ai/llm/client'
import { getDatabase } from '@research-os/database'
import { v4 as uuid } from 'uuid'
import type { ReviewOutcome } from '@research-os/shared'

// BullMQ Worker 处理函数
interface SummaryJobData {
  reviewId: string
  tenantId: string
}

/**
 * SummaryWorker: 将回看结果合成为 historical evidence
 *
 * 闭环数据流:
 *   Review → SummaryWorker → Evidence (sourceType: 'historical')
 *                              ↓
 *                       可参与下一轮推理
 */
async function processSummaryJob(job: { data: SummaryJobData }): Promise<void> {
  const { reviewId, tenantId } = job.data
  const db = getDatabase()

  // 1. 获取 Review 完整信息
  const review = await db.selectFrom('reviews').selectAll()
    .where('id', '=', reviewId)
    .where('tenant_id', '=', tenantId)
    .executeTakeFirstOrThrow()

  // 如果已生成过证据，跳过（幂等保护）
  if (review.generated_evidence_id) return

  // 2. 获取关联 Issue 和 DecisionCard 上下文
  const issue = await db.selectFrom('issues').select(['title', 'description', 'domain'])
    .where('id', '=', review.issue_id).executeTakeFirstOrThrow()

  const card = await db.selectFrom('decision_cards').select(['recommendation', 'confidence', 'key_factors'])
    .where('id', '=', review.decision_card_id).executeTakeFirstOrThrow()

  // 3. Claude API: 合成结构化证据内容
  const { text } = await callLLM({
    system: `你是一位经验总结分析师。你的任务是将一次决策回看的结果合成为一条结构化的历史证据记录。

这条证据将被存入证据库，在未来同类议题的推理中被引用。因此需要：
1. 内容客观、结构清晰，聚焦可复用的经验
2. 包含决策背景、预期、实际结果、偏差原因
3. 提炼可泛化的教训，而非仅记录个案细节
4. 输出 JSON 格式`,
    messages: [{
      role: 'user',
      content: `## 决策回看记录

### 议题背景
- 标题: ${issue.title}
- 描述: ${issue.description || '无'}

### 决策卡信息
- 建议: ${card.recommendation}
- 置信度: ${card.confidence}%
- 关键因素: ${JSON.parse(card.key_factors || '[]').join('、')}

### 回看结果
- 结果评估: ${review.outcome}
- 预期结果: ${review.expected_result}
- 实际结果: ${review.actual_result}
- 偏差说明: ${review.deviation}
- 经验教训: ${review.lessons_learned}

请合成为一条历史证据:
\`\`\`json
{
  "content": "完整的证据内容（包含背景、决策、结果、教训，300-600字）",
  "summary": "一句话摘要（50字内）",
  "tags": ["标签1", "标签2"],
  "confidence": 75
}
\`\`\``
    }],
    temperature: 0.3,
    maxTokens: 1024,
  })

  const synthesized = JSON.parse(extractJSON(text))

  // 4. 基于回看结果调整置信度
  const confidenceByOutcome: Record<ReviewOutcome, number> = {
    successful: 90,
    partially_successful: 70,
    unsuccessful: 50,
    inconclusive: 30,
  }
  const finalConfidence = confidenceByOutcome[review.outcome as ReviewOutcome] || synthesized.confidence

  // 5. 创建 Evidence 记录
  const evidenceId = uuid()
  await db.insertInto('evidence').values({
    id: evidenceId,
    tenant_id: tenantId,
    source_category: 'internal',
    source_type: 'historical',
    source_label: `回看经验: ${issue.title}`,
    source_ref: `review-${reviewId}`,
    content: synthesized.content,
    summary: synthesized.summary,
    tags: JSON.stringify([
      ...synthesized.tags,
      ...(typeof review.tags === 'string' ? JSON.parse(review.tags) : review.tags || []),
    ]),
    confidence: finalConfidence,
    confidence_factors: JSON.stringify({
      sourceReliability: review.outcome === 'successful' ? 0.9 : 0.7,
      dataFreshness: 1.0,  // 刚刚发生的实际经验
    }),
    freshness_at: new Date().toISOString(),
    citation: `内部决策回看 — ${issue.title}`,
    created_by: 'system',
  }).execute()

  // 6. 更新 Review.generatedEvidenceId — 闭环完成
  await db.updateTable('reviews')
    .set({ generated_evidence_id: evidenceId })
    .where('id', '=', reviewId)
    .execute()

  // 7. 触发新证据的 embedding（复用现有 embedding 管线）
  // TODO: 推送到 EMBEDDING 队列
  // await embeddingQueue.add('embed-evidence', { evidenceId, tenantId })
}
```

**设计理由:**
- 幂等保护 — 检查 `generatedEvidenceId` 是否已存在，避免重复生成
- 置信度映射 — `successful: 90` 表示实际验证过的经验高度可信；`inconclusive: 30` 表示不确定结果的参考价值有限
- `sourceRef: 'review-{id}'` — 保持溯源能力，可从证据追溯到原始回看记录
- 合并 Review tags — 用户标注的 tags 与 AI 生成的 tags 合并，提高检索覆盖
- `dataFreshness: 1.0` — 回看经验是刚发生的第一手数据

### 5. 推理引擎增强 — 洞察集成

在 `reasoning-worker.ts` 中增加洞察提炼步骤：

```typescript
// reasoning-worker.ts 增强伪代码
// 在 advocate/critic agents 完成后、judge 裁决前

async function enhancedReasoningFlow(issueId: string, tenantId: string, runId: string) {
  // ... 现有 advocate/critic 逻辑 ...

  // === 新增: 洞察提炼 ===
  const insightService = await import('@/modules/insights/service')
  const extractedInsights = await insightService.extractFromEvidence(tenantId, issueId, {
    reasoningRunId: runId,
    source: 'ai_reasoning',
  })

  // 通过 SSE 推送每条提炼的洞察
  for (const insight of extractedInsights) {
    sendSSE({
      type: 'insight_generated',
      data: {
        insightId: insight.id,
        title: insight.title,
        type: insight.type,
        direction: insight.direction,
        confidence: insight.confidence,
      },
    })
  }

  // Judge 阶段: 洞察作为额外输入
  // judge 除了原始证据，还接收 extractedInsights 作为"提炼后的论点"
  const judgeInput = {
    ...existingJudgeInput,
    insights: extractedInsights.map(i => ({
      title: i.title,
      type: i.type,
      direction: i.direction,
      confidence: i.confidence,
    })),
  }

  // ... 现有 judge 逻辑 ...
}
```

**设计理由:**
- 洞察在 advocate/critic 之后、judge 之前提炼 — judge 可以利用结构化洞察做更好的裁决
- SSE event `insight_generated` — 前端实时展示推理过程中的发现
- 洞察自动绑定 `reasoningRunId` — 可追溯到具体的推理运行

### 6. 前端 — 渐进增强策略

#### InsightListPage 完善

```
┌─────────────────────────────────────────────────────────────┐
│ 洞察管理                                    [AI 提炼洞察]  │
├─────────────────────────────────────────────────────────────┤
│ 筛选: [类型 ▼] [状态 ▼] [来源 ▼]                          │
├─────────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────────┐  │
│ │ 🔍 发现  |  市场份额增长趋势与竞争格局变化            │  │
│ │ ➡️ pro   |  ⭐ 85  |  AI推理  |  draft               │  │
│ │ 支撑证据: 3条    [确认] [质疑]                        │  │
│ └───────────────────────────────────────────────────────┘  │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ ⚠️ 风险  |  技术债务积累可能延迟交付                  │  │
│ │ ➡️ con   |  ⭐ 72  |  AI推理  |  confirmed            │  │
│ │ 支撑证据: 2条    [已确认 ✓]                           │  │
│ └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

- 类型图标映射: finding=🔍 risk=⚠️ opportunity=💡 contradiction=⚡
- 确认/质疑操作直接在卡片上完成，无需跳转
- AI 提炼按钮调用 `POST /api/issues/:id/insights/generate`

#### ActionListPage 完善

```
┌─────────────────────────────────────────────────────────────┐
│ 行动项                                                      │
├──────────┬──────────┬──────────┬──────────┬─────────────────┤
│ 待处理(3) │ 进行中(2)│ 已完成(1) │ 已取消(0) │               │
├──────────┴──────────┴──────────┴──────────┴─────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [urgent] 制定风险缓解方案                               │ │
│ │ 负责人: 张三  |  截止: 2026-04-15  |  pending           │ │
│ │ └── 子任务: 识别关键风险触发条件  [in_progress]         │ │
│ │ └── 子任务: 准备备选供应商名单    [pending]             │ │
│ │                                    [开始执行] [取消]    │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

- 状态列按看板式分组展示
- 子任务内联展示在父任务下方
- 状态变更通过下拉或按钮直接操作

#### ReviewListPage 完善

```
┌─────────────────────────────────────────────────────────────┐
│ 回看记录                                    [创建回看]      │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📊 部分成功  |  关于"扩展东南亚市场"的决策回看          │ │
│ │ 预期: 3个月内进入2个新市场                              │ │
│ │ 实际: 1个月进入1个市场，第2个延迟                       │ │
│ │ ────────────────────────────────────────                 │ │
│ │ 📝 已生成证据  [查看生成的证据 →]                       │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ❌ 不成功  |  关于"采用新技术栈"的决策回看              │ │
│ │ 预期: 开发效率提升30%                                   │ │
│ │ 实际: 学习成本高，前3个月效率反降15%                    │ │
│ │ ────────────────────────────────────────                 │ │
│ │ ⏳ 正在生成证据...                                      │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

- 回看创建表单: outcome 选择器 + actualResult/expectedResult/deviation/lessonsLearned 文本域
- 创建后自动触发 SummaryWorker
- 生成的证据可直接点击跳转查看

#### IssueDetailPage Tab 集成

在现有议题详情页增加 3 个 Tab:
- **洞察** Tab — 复用 `IssueInsightPanel`，接入 insights API
- **行动** Tab — 展示该议题下的行动项列表，含状态变更
- **回看** Tab — 展示该议题下的回看记录，含创建入口

### 7. `evidenceService.linkToIssue()` 增强

```typescript
// evidence/service.ts linkToIssue 修改
async linkToIssue(issueId: string, evidenceId: string, input: any, auth: AuthContext) {
  const db = getDatabase()

  await db.insertInto('issue_evidence').values({
    issue_id: issueId,
    evidence_id: evidenceId,
    relation_type: input.relationType || 'manual',
    relevance_score: input.relevanceScore || 0.5,
    stance: 'neutral',
    stance_source: 'manual',
    stance_confidence: 0,
    stance_reason: '',
    stance_version: 0,
    stance_analyzed_at: new Date().toISOString(),
  }).execute()

  // 更新议题证据计数
  await db.updateTable('issues')
    .set((eb: any) => ({ evidence_count: eb('evidence_count', '+', 1) }))
    .where('id', '=', issueId)
    .where('tenant_id', '=', auth.tenantId)
    .execute()

  // === 新增: 异步触发 AI 立场分析 ===
  // 不阻塞关联操作，失败静默处理
  stanceService.analyzeStance(auth.tenantId, issueId, evidenceId)
    .catch((err) => console.error('[Stance] Auto-analyze failed:', err))
}
```

**设计理由:**
- 异步 + catch — 立场分析失败不影响证据关联操作
- 初始 `stance: 'neutral'` + `stanceConfidence: 0` — 在 AI 分析完成前提供合理默认值
- AI 分析完成后自动更新 — 前端轮询或 WebSocket 通知刷新

## Risks / Trade-offs

| 风险 | 影响 | 缓解策略 |
|------|------|----------|
| Claude API 成本累积 — 立场分析 per evidence × per issue | 高频操作场景下费用增长 | 关联时批量分析 (reAnalyze)；缓存已分析结果；立场未变化不重复分析 |
| SummaryWorker 输出质量依赖 Review 完整度 | actualResult 为空时生成低质量证据 | 前端表单 actualResult 设为必填；Worker 校验必填字段 |
| 洞察提炼可能产生重复 | 同一议题多次提炼出类似洞察 | 提炼前检查现有洞察标题相似度（简单字符串匹配）；Prompt 中要求避免重复 |
| 推理过程中洞察提炼增加耗时 | 推理 SSE 流响应时间增加 2-5 秒 | 洞察提炼作为独立步骤，不阻塞 advocate/critic 生成 |
| 行动项 AI 生成的父子关系可能错误 | parentIndex 引用不存在的索引 | 前端允许用户修正父子关系；生成时校验 parentIndex 范围 |
