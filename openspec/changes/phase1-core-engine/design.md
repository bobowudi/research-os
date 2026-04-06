# Phase 1 — 核心引擎 技术设计

## 概述

Phase 1 涵盖五大子系统：证据管理、数据采集、Embedding 基础设施、对抗推理引擎、决策卡生成。各子系统通过 BullMQ 任务队列解耦，通过 Redis pub/sub 实现进度广播，通过 SSE 向前端推送实时状态。

---

## Decision 1: Evidence Service — 证据管理服务

### 设计理由

证据是整个系统的数据基石。EvidenceService 采用标准 Repository + Service 分层，上层 API route 调用 Service，Service 通过 Kysely 操作 `evidence` 和 `issue_evidence` 表。摘要生成通过已有的 AI client 调用 Claude API，异步执行避免阻塞 CRUD 操作。

搜索使用 Kysely 的 SQL LIKE 而非 Elasticsearch 全文检索——MVP 阶段数据量有限，LIKE 足够满足需求，避免引入额外复杂度。

### 接口签名

```typescript
// backend/src/modules/evidence/service.ts

import { Kysely } from 'kysely'
import { DB } from '@/database/types'
import { Evidence, IssueEvidence } from '@research-os/shared/types/evidence'
import { PaginatedResponse } from '@research-os/shared/types/common'

interface EvidenceCreateInput {
  title: string
  content: string
  sourceUrl?: string
  sourceCategory: 'internal' | 'external'
  sourceType: string
  metadata?: Record<string, unknown>
}

interface EvidenceListParams {
  search?: string
  sourceCategory?: 'internal' | 'external'
  sourceType?: string
  page: number
  pageSize: number
  sortBy?: 'createdAt' | 'updatedAt' | 'title'
  sortOrder?: 'asc' | 'desc'
}

interface EvidenceUpdateInput {
  title?: string
  content?: string
  sourceUrl?: string
  sourceCategory?: 'internal' | 'external'
  sourceType?: string
  metadata?: Record<string, unknown>
}

class EvidenceService {
  constructor(
    private db: Kysely<DB>,
    private aiClient: AIClient
  ) {}

  /** 创建证据记录，入库后自动触发 embedding job */
  async create(
    tenantId: string,
    data: EvidenceCreateInput,
    createdBy: string
  ): Promise<Evidence>

  /** 列表查询，支持搜索 (SQL LIKE on title+content)、筛选、分页 */
  async list(
    tenantId: string,
    params: EvidenceListParams
  ): Promise<PaginatedResponse<Evidence>>

  /** 按 ID 获取单条证据，含关联议题列表 */
  async getById(
    tenantId: string,
    id: string
  ): Promise<Evidence & { linkedIssues: Array<{ issueId: string; stance: string; relevanceScore: number }> }>

  /** 更新证据，更新后重新触发 embedding job */
  async update(
    tenantId: string,
    id: string,
    data: EvidenceUpdateInput
  ): Promise<Evidence>

  /** 软删除证据 (设 deletedAt) */
  async delete(
    tenantId: string,
    id: string
  ): Promise<void>

  /** 关联证据到议题，可选指定 relevanceScore */
  async linkToIssue(
    tenantId: string,
    evidenceId: string,
    issueId: string,
    relevanceScore?: number
  ): Promise<IssueEvidence>

  /** 取消关联 */
  async unlinkFromIssue(
    tenantId: string,
    evidenceId: string,
    issueId: string
  ): Promise<void>

  /** 调用 Claude API 为证据生成摘要，写入 evidence.summary 字段 */
  async generateSummary(
    tenantId: string,
    evidenceId: string
  ): Promise<string>
}
```

### 常量定义

```typescript
// backend/src/modules/evidence/constants.ts

export const SOURCE_CATEGORIES = ['internal', 'external'] as const
export type SourceCategory = typeof SOURCE_CATEGORIES[number]

export const SOURCE_TYPES = [
  'report', 'memo', 'email', 'meeting_notes', 'survey',  // internal
  'news', 'academic', 'government', 'industry', 'social'  // external
] as const
export type SourceType = typeof SOURCE_TYPES[number]

export const ALLOWED_SORT_BY = ['createdAt', 'updatedAt', 'title'] as const

export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100
```

### API 路由

```typescript
// backend/app/api/evidence/route.ts
// GET  /api/evidence?search=&sourceCategory=&sourceType=&page=1&pageSize=20
// POST /api/evidence  { title, content, sourceUrl?, sourceCategory, sourceType, metadata? }

// backend/app/api/evidence/[id]/route.ts
// GET    /api/evidence/:id
// PATCH  /api/evidence/:id  { title?, content?, ... }
// DELETE /api/evidence/:id

// backend/app/api/issues/[id]/evidence/route.ts
// GET  /api/issues/:id/evidence  — 获取议题关联的所有证据
// POST /api/issues/:id/evidence  { evidenceId, relevanceScore? } — 关联证据到议题
```

### 搜索实现

```typescript
// 在 list() 方法内
let query = this.db.selectFrom('evidence')
  .where('tenant_id', '=', tenantId)
  .where('deleted_at', 'is', null)

if (params.search) {
  const searchTerm = `%${params.search}%`
  query = query.where((eb) =>
    eb.or([
      eb('title', 'like', searchTerm),
      eb('content', 'like', searchTerm),
    ])
  )
}

if (params.sourceCategory) {
  query = query.where('source_category', '=', params.sourceCategory)
}

if (params.sourceType) {
  query = query.where('source_type', '=', params.sourceType)
}
```

---

## Decision 2: RSS Worker — RSS 数据源抓取

### 设计理由

RSS Worker 基于 Phase 0 建立的 BullMQ BaseWorker 框架，处理定时和手动触发的 RSS 源抓取。通过 `deduplication_key`（由 RSS entry 的 `guid` 或 `link` 派生）实现去重，避免重复入库。每条新证据入库后自动触发 Embedding job，实现"采集 → 向量化 → 自动关联"的自动化管道。

### 接口签名

```typescript
// backend/src/workers/rss-worker.ts

import { BaseWorker } from './base-worker'
import { Job } from 'bullmq'

interface RssJobData {
  dataSourceId: string
  tenantId: string
  importJobId: string
}

interface RssEntry {
  title: string
  link: string
  content: string
  pubDate: string
  guid?: string
}

class RssWorker extends BaseWorker<RssJobData> {
  readonly queueName = 'rss-feed'

  async process(job: Job<RssJobData>): Promise<void> {
    const { dataSourceId, tenantId, importJobId } = job.data

    // 1. 从 data_sources 表获取配置 (feedUrl, pollInterval, etc.)
    const dataSource = await this.dataSourceService.getById(tenantId, dataSourceId)

    // 2. 使用 rss-parser 库拉取并解析 RSS XML
    const entries: RssEntry[] = await this.fetchAndParse(dataSource.config.feedUrl)

    // 3. 基于 deduplication_key 去重 (key = md5(guid || link))
    const newEntries = await this.deduplicateEntries(tenantId, entries)

    // 4. 批量创建 Evidence 记录
    //    sourceCategory: 'external'
    //    sourceType: 根据 dataSource.config.contentType 映射 ('news' | 'report' | 'industry')
    //    deduplicationKey: md5(entry.guid || entry.link)
    for (const [index, entry] of newEntries.entries()) {
      const evidence = await this.evidenceService.create(tenantId, {
        title: entry.title,
        content: entry.content,
        sourceUrl: entry.link,
        sourceCategory: 'external',
        sourceType: dataSource.config.contentType || 'news',
        metadata: { feedSource: dataSource.name, pubDate: entry.pubDate },
      }, 'system')

      // 5. 更新 ImportJob 进度
      await this.updateImportJobProgress(importJobId, {
        processedCount: index + 1,
        totalCount: newEntries.length,
      })

      // 6. 自动触发 embedding job (通过 BullMQ 入队)
      await this.embeddingQueue.add('embed', {
        entityType: 'evidence',
        entityId: evidence.id,
        tenantId,
      })
    }

    // 7. 更新 ImportJob 状态为 completed
    await this.updateImportJobStatus(importJobId, 'completed')

    // 8. 更新 DataSource.lastSyncAt
    await this.dataSourceService.updateLastSync(tenantId, dataSourceId)
  }

  private async fetchAndParse(feedUrl: string): Promise<RssEntry[]> {
    // 使用 rss-parser 库，设置 timeout: 30s, maxEntries: 100
  }

  private async deduplicateEntries(tenantId: string, entries: RssEntry[]): Promise<RssEntry[]> {
    // 批量查询已存在的 deduplication_keys
    // 返回不存在的 entries
  }
}
```

### 定时调度

```typescript
// 在 DataSourceService.create() / update() 时设置 BullMQ repeatable job
await rssQueue.add('rss-poll', { dataSourceId, tenantId }, {
  repeat: {
    every: dataSource.config.pollInterval * 60 * 1000, // 分钟转毫秒, 默认 30 分钟
  },
  jobId: `rss-poll-${dataSourceId}`, // 唯一 ID, 方便取消
})
```

### Crawler Worker 简述

```typescript
// backend/src/workers/crawler-worker.ts

interface CrawlerJobData {
  dataSourceId: string
  tenantId: string
  importJobId: string
  urls: string[]              // 要抓取的 URL 列表
  cssSelector?: string        // 正文 CSS 选择器, e.g. 'article.content'
}

class CrawlerWorker extends BaseWorker<CrawlerJobData> {
  readonly queueName = 'web-crawler'

  async process(job: Job<CrawlerJobData>): Promise<void> {
    // 1. 对每个 URL: fetch HTML → cheerio 解析 → 按 cssSelector 提取正文
    // 2. 去重 (deduplicationKey = md5(url))
    // 3. 创建 Evidence 记录
    // 4. 触发 embedding
    // 5. 更新 ImportJob 进度
  }
}
```

### DataSourceService

```typescript
// backend/src/modules/data-sources/service.ts

interface DataSourceCreateInput {
  name: string
  type: 'rss_feed' | 'web_crawler' | 'api_integration' | 'file_watch'
  config: Record<string, unknown>  // feedUrl, pollInterval, cssSelector 等
  isActive?: boolean
}

class DataSourceService {
  async create(tenantId: string, data: DataSourceCreateInput, createdBy: string): Promise<DataSource>
  async list(tenantId: string, params: { type?: string; isActive?: boolean; page: number; pageSize: number }): Promise<PaginatedResponse<DataSource>>
  async getById(tenantId: string, id: string): Promise<DataSource>
  async update(tenantId: string, id: string, data: Partial<DataSourceCreateInput>): Promise<DataSource>
  async delete(tenantId: string, id: string): Promise<void>
  async triggerSync(tenantId: string, id: string): Promise<ImportJob>  // 手动触发同步
  async updateLastSync(tenantId: string, id: string): Promise<void>
}
```

---

## Decision 3: Embedding Pipeline — 向量化管道

### 设计理由

Embedding 是自动关联证据与议题的核心基础设施。选用 Voyage AI 的 `voyage-3-lite` 模型（1024 维，性价比高），降级到 OpenAI `text-embedding-3-small`（1536 维）。向量存储在 Elasticsearch 的 `dense_vector` 字段中，利用 ES 的近似最近邻 (ANN) 搜索实现高效相似度检索。

自动关联策略采用三档阈值：
- **≥0.7**: 自动创建 `issue_evidence` 关联记录
- **0.5-0.7**: 创建推荐记录（`status: 'recommended'`），用户可接受/拒绝
- **<0.5**: 忽略

### 接口签名

```typescript
// backend/src/modules/embedding/service.ts

interface SimilarResult {
  id: string
  score: number
  entityType: 'evidence' | 'issue'
}

class EmbeddingService {
  constructor(
    private esClient: ElasticsearchClient,
    private aiClient: AIClient,  // 已有的 AI client，扩展支持 embedding API
    private db: Kysely<DB>
  ) {}

  /**
   * 将文本向量化
   * 优先使用 voyage-3-lite (1024 dims)，失败则降级到 text-embedding-3-small (1536 dims)
   * 输入文本做预处理: 截断到 8000 tokens, 去除多余空白
   */
  async embed(text: string): Promise<number[]>

  /**
   * 将向量存储到 ES index
   * index pattern: `{tenant_id}_embeddings`
   * document: { entity_type, entity_id, vector, text_preview, updated_at }
   */
  async storeVector(
    tenantId: string,
    entityType: 'evidence' | 'issue',
    entityId: string,
    vector: number[]
  ): Promise<void>

  /**
   * 在 ES 中执行 KNN 搜索，返回相似实体
   * 使用 cosine similarity
   */
  async findSimilar(
    tenantId: string,
    vector: number[],
    entityType: 'evidence' | 'issue',
    threshold: number,
    limit: number
  ): Promise<SimilarResult[]>

  /**
   * 自动关联: 新证据入库后，查找与之匹配的活跃议题
   * ≥0.7: 自动创建 issue_evidence (status: 'auto_linked')
   * 0.5-0.7: 创建推荐 (status: 'recommended')
   */
  async autoAssociateEvidence(
    tenantId: string,
    evidenceId: string
  ): Promise<{
    autoLinked: Array<{ issueId: string; score: number }>
    recommended: Array<{ issueId: string; score: number }>
  }>

  /**
   * 自动关联: 新议题创建后，查找与之匹配的已有证据
   */
  async autoAssociateIssue(
    tenantId: string,
    issueId: string
  ): Promise<{
    autoLinked: Array<{ evidenceId: string; score: number }>
    recommended: Array<{ evidenceId: string; score: number }>
  }>
}
```

### ES Index Mapping

```typescript
// backend/src/modules/embedding/es-mapping.ts

export const EMBEDDING_INDEX_MAPPING = {
  mappings: {
    properties: {
      entity_type: { type: 'keyword' },
      entity_id: { type: 'keyword' },
      tenant_id: { type: 'keyword' },
      vector: {
        type: 'dense_vector',
        dims: 1024,              // voyage-3-lite 默认; OpenAI fallback 时需动态处理
        index: true,
        similarity: 'cosine',
      },
      text_preview: { type: 'text', index: false },  // 仅存储，不索引
      updated_at: { type: 'date' },
    },
  },
  settings: {
    number_of_shards: 1,     // MVP 阶段单分片足够
    number_of_replicas: 0,   // 开发阶段不需要副本
  },
}

/**
 * 初始化 ES index (幂等操作，启动时调用)
 */
export async function ensureEmbeddingIndex(
  esClient: ElasticsearchClient,
  tenantId: string
): Promise<void> {
  const indexName = `${tenantId}_embeddings`
  const exists = await esClient.indices.exists({ index: indexName })
  if (!exists) {
    await esClient.indices.create({
      index: indexName,
      body: EMBEDDING_INDEX_MAPPING,
    })
  }
}
```

### Embedding Worker

```typescript
// backend/src/workers/embedding-worker.ts

interface EmbeddingJobData {
  entityType: 'evidence' | 'issue'
  entityId: string
  tenantId: string
}

class EmbeddingWorker extends BaseWorker<EmbeddingJobData> {
  readonly queueName = 'embedding'

  async process(job: Job<EmbeddingJobData>): Promise<void> {
    const { entityType, entityId, tenantId } = job.data

    // 1. 从 DB 获取实体文本
    const text = await this.getEntityText(entityType, entityId, tenantId)
    if (!text) return

    // 2. 向量化
    const vector = await this.embeddingService.embed(text)

    // 3. 存储到 ES
    await this.embeddingService.storeVector(tenantId, entityType, entityId, vector)

    // 4. 自动关联
    if (entityType === 'evidence') {
      await this.embeddingService.autoAssociateEvidence(tenantId, entityId)
    } else {
      await this.embeddingService.autoAssociateIssue(tenantId, entityId)
    }
  }

  private async getEntityText(entityType: string, entityId: string, tenantId: string): Promise<string | null> {
    if (entityType === 'evidence') {
      const evidence = await this.evidenceService.getById(tenantId, entityId)
      return evidence ? `${evidence.title}\n\n${evidence.content}` : null
    } else {
      const issue = await this.issueService.getById(tenantId, entityId)
      return issue ? `${issue.title}\n\n${issue.description || ''}` : null
    }
  }
}
```

---

## Decision 4: Reasoning Engine State Machine — 推理引擎状态机

### 设计理由

对抗推理是一个长时间运行的异步流程（总耗时可达 30-60s），需要可靠的状态管理来处理成功、失败、取消等场景。采用显式状态机模式，9 个状态覆盖完整生命周期，每次状态转移都持久化到数据库并通过 Redis pub/sub 广播。

### 状态流转图

```
pending → preparing → advocate_running → critic_running → judge_running → generating_card → completed
                                                                                            → failed
Any state → cancelled
```

### 实现

```typescript
// backend/src/modules/reasoning/state-machine.ts

export const REASONING_STATES = [
  'pending',
  'preparing',
  'advocate_running',
  'critic_running',
  'judge_running',
  'generating_card',
  'completed',
  'failed',
  'cancelled',
] as const

export type ReasoningState = typeof REASONING_STATES[number]

/** 合法的状态转移定义 */
const VALID_TRANSITIONS: Record<ReasoningState, ReasoningState[]> = {
  pending:           ['preparing', 'cancelled', 'failed'],
  preparing:         ['advocate_running', 'cancelled', 'failed'],
  advocate_running:  ['critic_running', 'cancelled', 'failed'],
  critic_running:    ['judge_running', 'cancelled', 'failed'],
  judge_running:     ['generating_card', 'cancelled', 'failed'],
  generating_card:   ['completed', 'failed'],
  completed:         [],  // 终态
  failed:            [],  // 终态
  cancelled:         [],  // 终态
}

export class ReasoningStateMachine {
  constructor(
    private db: Kysely<DB>,
    private redis: Redis
  ) {}

  /**
   * 执行状态转移，更新 DB + 广播事件
   * @throws InvalidTransitionError 如果转移不合法
   */
  async transition(
    runId: string,
    fromState: ReasoningState,
    toState: ReasoningState,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    if (!VALID_TRANSITIONS[fromState]?.includes(toState)) {
      throw new InvalidTransitionError(fromState, toState)
    }

    // 乐观锁: UPDATE WHERE state = fromState
    const result = await this.db.updateTable('reasoning_runs')
      .set({
        status: toState,
        ...(toState === 'completed' ? { completed_at: new Date() } : {}),
        ...(toState === 'failed' ? { error_message: metadata?.error as string } : {}),
        updated_at: new Date(),
      })
      .where('id', '=', runId)
      .where('status', '=', fromState)
      .executeTakeFirst()

    if (result.numUpdatedRows === BigInt(0)) {
      throw new ConcurrentModificationError(runId)
    }

    // Redis pub/sub 广播状态变更
    await this.redis.publish(`reasoning:${runId}`, JSON.stringify({
      event: 'status_change',
      data: { runId, fromState, toState, metadata, timestamp: Date.now() },
    }))
  }

  /** 检查是否处于终态 */
  isTerminal(state: ReasoningState): boolean {
    return VALID_TRANSITIONS[state]?.length === 0
  }
}

export class InvalidTransitionError extends Error {
  constructor(from: ReasoningState, to: ReasoningState) {
    super(`Invalid state transition: ${from} → ${to}`)
  }
}

export class ConcurrentModificationError extends Error {
  constructor(runId: string) {
    super(`Concurrent modification detected for reasoning run: ${runId}`)
  }
}
```

### Preflight Check — 预检逻辑

```typescript
// backend/src/modules/reasoning/service.ts (部分)

export type PreflightMode = 'standard' | 'degraded' | 'single_side' | 'refused'

export interface PreflightResult {
  mode: PreflightMode
  proCount: number
  conCount: number
  totalCount: number
  message: string
  confidenceModifier: number  // 对最终置信度的修正值, e.g. -20
}

class ReasoningService {
  /**
   * 推理前预检: 评估证据充分性，决定推理模式
   *
   * standard:    双方各 ≥3 条证据，正常推理
   * degraded:    一方 1-2 条证据，可推理但置信度 -20%
   * single_side: 一方 0 条证据，仅能做单方论证
   * refused:     总证据 < 2 条，拒绝推理
   */
  async preflight(
    tenantId: string,
    issueId: string
  ): Promise<PreflightResult> {
    // 查询 issue_evidence 表，按 stance 分组计数
    const stanceCounts = await this.db.selectFrom('issue_evidence')
      .select([
        'stance',
        this.db.fn.count<number>('id').as('count'),
      ])
      .where('issue_id', '=', issueId)
      .where('tenant_id', '=', tenantId)
      .groupBy('stance')
      .execute()

    const proCount = stanceCounts.find(s => s.stance === 'pro')?.count ?? 0
    const conCount = stanceCounts.find(s => s.stance === 'con')?.count ?? 0
    const totalCount = proCount + conCount

    if (totalCount < 2) {
      return { mode: 'refused', proCount, conCount, totalCount, message: '证据不足，至少需要 2 条证据才能启动推理', confidenceModifier: 0 }
    }
    if (proCount === 0 || conCount === 0) {
      return { mode: 'single_side', proCount, conCount, totalCount, message: `缺少${proCount === 0 ? '正方' : '反方'}证据，仅能进行单方论证`, confidenceModifier: -40 }
    }
    if (proCount < 3 || conCount < 3) {
      return { mode: 'degraded', proCount, conCount, totalCount, message: '证据偏少，推理结果置信度将降低 20%', confidenceModifier: -20 }
    }
    return { mode: 'standard', proCount, conCount, totalCount, message: '证据充分，可启动标准对抗推理', confidenceModifier: 0 }
  }

  /** 触发推理运行 */
  async trigger(
    tenantId: string,
    issueId: string,
    triggeredBy: string
  ): Promise<{ runId: string; preflight: PreflightResult }> {
    const preflight = await this.preflight(tenantId, issueId)

    if (preflight.mode === 'refused') {
      throw new InsufficientEvidenceError(preflight.message)
    }

    // 创建 reasoning_run 记录
    const run = await this.db.insertInto('reasoning_runs')
      .values({
        id: generateId(),
        tenant_id: tenantId,
        issue_id: issueId,
        status: 'pending',
        mode: preflight.mode,
        triggered_by: triggeredBy,
        metadata: JSON.stringify({ preflight }),
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    // 入队 BullMQ reasoning job
    await this.reasoningQueue.add('reasoning', {
      runId: run.id,
      tenantId,
      issueId,
      mode: preflight.mode,
      confidenceModifier: preflight.confidenceModifier,
    })

    return { runId: run.id, preflight }
  }

  /** 获取推理运行状态 + 结果 */
  async getStatus(tenantId: string, runId: string): Promise<ReasoningRunWithResults>

  /** 取消推理运行 */
  async cancel(tenantId: string, runId: string): Promise<void>
}
```

---

## Decision 5: Three-Agent Prompt Architecture — 三方 Agent Prompt 架构

### 设计理由

对抗推理的核心是三方辩论结构——正方 (Advocate)、反方 (Critic)、裁判 (Judge)。每个 Agent 有严格隔离的信息边界：正方只看内部/正方证据，反方只看外部/反方证据，裁判看全部。这种信息隔离是"对抗性"的关键——如果所有 Agent 看同样的信息，就没有对抗效果。

温度设置：正方/反方使用 0.7（鼓励创造性论证），裁判使用 0.3（保守准确的判断）。

### Advocate Prompt — 正方 Agent

```typescript
// backend/src/modules/reasoning/prompts/advocate.ts

export interface AdvocateInput {
  issueTitle: string
  issueDescription: string
  hypothesis: string         // 议题的核心假设
  evidenceList: Array<{
    id: string
    title: string
    content: string
    sourceType: string
    summary?: string
  }>
  mode: 'standard' | 'degraded' | 'single_side'
}

export interface AdvocateOutput {
  mainArgument: string                        // 核心论点 (1-2 句)
  supportingPoints: Array<{
    point: string                              // 论点描述
    evidenceIds: string[]                      // 支撑该论点的证据 ID
    strength: 'strong' | 'moderate' | 'weak'  // 论点强度
    reasoning: string                          // 推理过程
  }>
  confidence: number                           // 0-100, 正方对自身论点的置信度
  caveats: string[]                            // 正方自身承认的局限性
}

export function buildAdvocatePrompt(input: AdvocateInput): string {
  return `你是一位研究分析中的 **正方辩手 (Advocate)**。你的角色是基于提供的证据，为以下假设构建最有力的支持论证。

## 议题
标题: ${input.issueTitle}
描述: ${input.issueDescription}
假设: ${input.hypothesis}

## 你的证据 (仅限以下证据)
${input.evidenceList.map((e, i) => `
### 证据 ${i + 1}: ${e.title}
ID: ${e.id}
类型: ${e.sourceType}
${e.summary ? `摘要: ${e.summary}` : ''}
内容: ${e.content}
`).join('\n')}

## 任务
1. 仔细分析所有证据
2. 构建支持假设的核心论点
3. 为每个论点标注支撑证据和强度
4. 诚实评估你论证的置信度
5. 列出你论证中的局限性

## 输出格式
严格按以下 JSON 格式输出:
${JSON.stringify({
  mainArgument: 'string',
  supportingPoints: [{ point: 'string', evidenceIds: ['string'], strength: 'strong|moderate|weak', reasoning: 'string' }],
  confidence: 'number (0-100)',
  caveats: ['string'],
}, null, 2)}

注意: 
- 你只能使用上面提供的证据，不要引用或编造其他证据
- 论点强度评估要客观
- ${input.mode === 'degraded' ? '证据数量有限，请在置信度评估中体现这一点' : ''}
- ${input.mode === 'single_side' ? '这是单方论证模式，对方没有提供反驳证据' : ''}`
}

export const ADVOCATE_CONFIG = {
  model: 'claude-sonnet-4-20250514',
  temperature: 0.7,
  maxTokens: 4000,
}
```

### Critic Prompt — 反方 Agent

```typescript
// backend/src/modules/reasoning/prompts/critic.ts

export interface CriticInput {
  issueTitle: string
  issueDescription: string
  hypothesis: string
  evidenceList: Array<{       // 反方/外部证据
    id: string
    title: string
    content: string
    sourceType: string
    summary?: string
  }>
  advocateOutput: AdvocateOutput   // 正方论点 (裁判模式下传入，single_side 下为 null)
  mode: 'standard' | 'degraded' | 'single_side'
}

export interface CriticOutput {
  mainRebuttal: string                         // 核心反驳 (1-2 句)
  counterPoints: Array<{
    targetPoint: string                         // 针对正方的哪个论点
    rebuttal: string                            // 反驳内容
    evidenceIds: string[]                       // 支撑反驳的证据 ID
    strength: 'strong' | 'moderate' | 'weak'
    reasoning: string
  }>
  independentArguments: Array<{                // 独立的反对论点
    point: string
    evidenceIds: string[]
    reasoning: string
  }>
  confidence: number                            // 0-100
  acknowledgedStrengths: string[]               // 承认正方论点中的合理之处
}

export function buildCriticPrompt(input: CriticInput): string {
  // ... 类似 Advocate 的模板结构，角色改为反方辩手
}

export const CRITIC_CONFIG = {
  model: 'claude-sonnet-4-20250514',
  temperature: 0.7,
  maxTokens: 4000,
}
```

### Judge Prompt — 裁判 Agent

```typescript
// backend/src/modules/reasoning/prompts/judge.ts

export interface JudgeInput {
  issueTitle: string
  issueDescription: string
  hypothesis: string
  allEvidence: Array<{
    id: string
    title: string
    content: string
    sourceType: string
    sourceCategory: string
    stance: string
    summary?: string
  }>
  advocateOutput: AdvocateOutput
  criticOutput: CriticOutput
  mode: 'standard' | 'degraded' | 'single_side'
  confidenceModifier: number
}

export interface JudgeOutput {
  verdict: 'support' | 'oppose' | 'insufficient' | 'mixed'
  recommendation: string                        // 1-3 句总结
  confidence: {
    overall: number                              // 0-100, 已应用 confidenceModifier
    dimensions: {
      evidenceQuality: number                    // 证据质量 0-100
      evidenceQuantity: number                   // 证据数量 0-100
      argumentCoherence: number                  // 论证逻辑性 0-100
      consensusLevel: number                     // 双方共识程度 0-100
      externalValidity: number                   // 外部效度 0-100
      practicalFeasibility: number               // 实际可行性 0-100
    }
  }
  keyFactors: Array<{
    factor: string
    impact: 'positive' | 'negative' | 'neutral'
    weight: number  // 0-10
  }>
  risks: string[]
  dissent: string                                // 少数意见 / 裁判的保留意见
  suggestedActions: string[]                     // 建议下一步行动
}

export function buildJudgePrompt(input: JudgeInput): string {
  // ... 裁判模板，强调中立、客观、结构化输出
}

export const JUDGE_CONFIG = {
  model: 'claude-sonnet-4-20250514',
  temperature: 0.3,    // 裁判使用更低温度以确保判断的稳定性
  maxTokens: 6000,
}
```

---

## Decision 6: SSE Streaming — 流式推理进度推送

### 设计理由

三方对抗推理总耗时 30-60 秒，如果用户只看到 loading spinner 体验极差。SSE（Server-Sent Events）比 WebSocket 更轻量，不需要额外的连接管理基础设施，且兼容 Next.js API Routes。

推理 Worker 通过 Redis pub/sub 发布进度事件，SSE endpoint 订阅并转发给前端。6 种事件类型覆盖推理全程。

### 事件类型

```typescript
// 6 种 SSE 事件类型

type SSEEventType =
  | 'status_change'       // 状态转移: { fromState, toState }
  | 'progress'            // 当前 Agent 执行进度: { agent, step, message }
  | 'agent_complete'      // 某个 Agent 执行完成: { agent, output (摘要, 非完整输出) }
  | 'insight_generated'   // 推理过程中的中间洞察: { type, content }
  | 'completed'           // 推理完成: { runId, decisionCardId, summary }
  | 'error'               // 错误: { code, message }
```

### SSE Endpoint 实现

```typescript
// backend/app/api/issues/[id]/reasoning/route.ts

import { NextRequest } from 'next/server'
import Redis from 'ioredis'

// POST /api/issues/:id/reasoning — 触发推理
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { tenantId, userId } = await extractAuth(req)
  const issueId = params.id

  const result = await reasoningService.trigger(tenantId, issueId, userId)

  return NextResponse.json({
    runId: result.runId,
    preflight: result.preflight,
  }, { status: 201 })
}

// GET /api/issues/:id/reasoning?runId=xxx — SSE 流
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { tenantId } = await extractAuth(req)
  const runId = req.nextUrl.searchParams.get('runId')

  if (!runId) {
    // 无 runId 时返回最近的推理运行状态
    const latestRun = await reasoningService.getLatestRun(tenantId, params.id)
    return NextResponse.json(latestRun)
  }

  // SSE 流
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      const subscriber = new Redis(process.env.REDIS_URL!)

      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        )
      }

      // 先发送当前状态
      const currentRun = await reasoningService.getStatus(tenantId, runId)
      send('status_change', {
        fromState: null,
        toState: currentRun.status,
        timestamp: Date.now(),
      })

      // 如果已经是终态，发送完成/错误事件并关闭
      if (stateMachine.isTerminal(currentRun.status)) {
        if (currentRun.status === 'completed') {
          send('completed', { runId, summary: currentRun.result?.recommendation })
        } else if (currentRun.status === 'failed') {
          send('error', { code: 'REASONING_FAILED', message: currentRun.errorMessage })
        }
        controller.close()
        await subscriber.quit()
        return
      }

      // 订阅 Redis channel
      await subscriber.subscribe(`reasoning:${runId}`)
      subscriber.on('message', (channel, message) => {
        try {
          const event = JSON.parse(message)
          send(event.event, event.data)

          // 终态时关闭连接
          if (['completed', 'failed', 'cancelled'].includes(event.data?.toState)) {
            controller.close()
            subscriber.unsubscribe()
            subscriber.quit()
          }
        } catch (e) {
          // 忽略解析错误
        }
      })

      // 心跳保活 (每 15 秒)
      const heartbeat = setInterval(() => {
        try {
          send('heartbeat', { timestamp: Date.now() })
        } catch {
          clearInterval(heartbeat)
        }
      }, 15000)

      // 超时自动关闭 (5 分钟)
      setTimeout(() => {
        clearInterval(heartbeat)
        controller.close()
        subscriber.unsubscribe()
        subscriber.quit()
      }, 5 * 60 * 1000)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',   // 禁用 Nginx 缓冲
    },
  })
}
```

### Reasoning Worker — 推理执行 Worker

```typescript
// backend/src/workers/reasoning-worker.ts

interface ReasoningJobData {
  runId: string
  tenantId: string
  issueId: string
  mode: PreflightMode
  confidenceModifier: number
}

class ReasoningWorker extends BaseWorker<ReasoningJobData> {
  readonly queueName = 'reasoning'

  async process(job: Job<ReasoningJobData>): Promise<void> {
    const { runId, tenantId, issueId, mode, confidenceModifier } = job.data

    try {
      // === Phase 1: Preparing ===
      await this.stateMachine.transition(runId, 'pending', 'preparing')
      const issue = await this.issueService.getById(tenantId, issueId)
      const allEvidence = await this.evidenceService.getByIssue(tenantId, issueId)
      const proEvidence = allEvidence.filter(e => e.stance === 'pro')
      const conEvidence = allEvidence.filter(e => e.stance === 'con')

      // === Phase 2: Advocate ===
      await this.stateMachine.transition(runId, 'preparing', 'advocate_running')
      await this.publishProgress(runId, { agent: 'advocate', step: 'running', message: '正方辩手正在分析证据...' })

      const advocateOutput: AdvocateOutput = await this.aiClient.chat({
        ...ADVOCATE_CONFIG,
        messages: [{ role: 'user', content: buildAdvocatePrompt({
          issueTitle: issue.title,
          issueDescription: issue.description,
          hypothesis: issue.hypothesis,
          evidenceList: proEvidence,
          mode,
        })}],
      })

      await this.saveAgentOutput(runId, 'advocate', advocateOutput)
      await this.publishAgentComplete(runId, 'advocate', advocateOutput.mainArgument)

      // === Phase 3: Critic ===
      await this.stateMachine.transition(runId, 'advocate_running', 'critic_running')
      await this.publishProgress(runId, { agent: 'critic', step: 'running', message: '反方辩手正在准备反驳...' })

      const criticOutput: CriticOutput = await this.aiClient.chat({
        ...CRITIC_CONFIG,
        messages: [{ role: 'user', content: buildCriticPrompt({
          issueTitle: issue.title,
          issueDescription: issue.description,
          hypothesis: issue.hypothesis,
          evidenceList: conEvidence,
          advocateOutput,
          mode,
        })}],
      })

      await this.saveAgentOutput(runId, 'critic', criticOutput)
      await this.publishAgentComplete(runId, 'critic', criticOutput.mainRebuttal)

      // === Phase 4: Judge ===
      await this.stateMachine.transition(runId, 'critic_running', 'judge_running')
      await this.publishProgress(runId, { agent: 'judge', step: 'running', message: '裁判正在综合评判...' })

      const judgeOutput: JudgeOutput = await this.aiClient.chat({
        ...JUDGE_CONFIG,
        messages: [{ role: 'user', content: buildJudgePrompt({
          issueTitle: issue.title,
          issueDescription: issue.description,
          hypothesis: issue.hypothesis,
          allEvidence,
          advocateOutput,
          criticOutput,
          mode,
          confidenceModifier,
        })}],
      })

      await this.saveAgentOutput(runId, 'judge', judgeOutput)
      await this.publishAgentComplete(runId, 'judge', judgeOutput.recommendation)

      // === Phase 5: Generate Decision Card ===
      await this.stateMachine.transition(runId, 'judge_running', 'generating_card')
      const decisionCard = await this.decisionService.createFromJudgeOutput(
        tenantId, issueId, runId, judgeOutput
      )

      // === Phase 6: Complete ===
      await this.stateMachine.transition(runId, 'generating_card', 'completed')
      await this.publishCompleted(runId, decisionCard.id, judgeOutput.recommendation)

    } catch (error) {
      // 任何阶段失败都转到 failed 状态
      const currentState = await this.getCurrentState(runId)
      if (!this.stateMachine.isTerminal(currentState)) {
        await this.stateMachine.transition(runId, currentState, 'failed', {
          error: error.message,
        })
      }
      throw error  // BullMQ 会记录失败
    }
  }

  private async publishProgress(runId: string, data: unknown): Promise<void> {
    await this.redis.publish(`reasoning:${runId}`, JSON.stringify({
      event: 'progress',
      data: { ...data, timestamp: Date.now() },
    }))
  }

  private async publishAgentComplete(runId: string, agent: string, summary: string): Promise<void> {
    await this.redis.publish(`reasoning:${runId}`, JSON.stringify({
      event: 'agent_complete',
      data: { agent, summary, timestamp: Date.now() },
    }))
  }

  private async publishCompleted(runId: string, decisionCardId: string, summary: string): Promise<void> {
    await this.redis.publish(`reasoning:${runId}`, JSON.stringify({
      event: 'completed',
      data: { runId, decisionCardId, summary, timestamp: Date.now() },
    }))
  }
}
```

---

## Decision 7: Decision Card Auto-Generation — 决策卡自动生成

### 设计理由

决策卡是对抗推理的最终产物，直接从 Judge Agent 的结构化输出生成。不需要额外的 AI 调用——Judge 输出本身已经包含了决策卡所需的所有字段。后续用户可以对决策卡进行投票、评论、采纳/拒绝。

### 接口签名

```typescript
// backend/src/modules/decisions/service.ts

import { JudgeOutput } from '../reasoning/prompts/judge'

interface DecisionCardCreateInput {
  title: string
  recommendation: string
  verdict: 'support' | 'oppose' | 'insufficient' | 'mixed'
  confidence: JudgeOutput['confidence']
  keyFactors: JudgeOutput['keyFactors']
  risks: string[]
  dissent: string
  suggestedActions: string[]
}

interface VoteInput {
  userId: string
  vote: 'agree' | 'disagree' | 'abstain'
  comment?: string
}

class DecisionService {
  /**
   * 从 Judge 输出自动创建决策卡
   * 直接映射 JudgeOutput 字段到 DecisionCard
   */
  async createFromJudgeOutput(
    tenantId: string,
    issueId: string,
    reasoningRunId: string,
    judgeOutput: JudgeOutput
  ): Promise<DecisionCard> {
    return this.db.insertInto('decision_cards')
      .values({
        id: generateId(),
        tenant_id: tenantId,
        issue_id: issueId,
        reasoning_run_id: reasoningRunId,
        title: `决策: ${judgeOutput.recommendation.substring(0, 100)}`,
        recommendation: judgeOutput.recommendation,
        verdict: judgeOutput.verdict,
        confidence: JSON.stringify(judgeOutput.confidence),
        key_factors: JSON.stringify(judgeOutput.keyFactors),
        risks: JSON.stringify(judgeOutput.risks),
        dissent: judgeOutput.dissent,
        suggested_actions: JSON.stringify(judgeOutput.suggestedActions),
        status: 'pending_review',  // pending_review → adopted | rejected
        vote_summary: JSON.stringify({ agree: 0, disagree: 0, abstain: 0 }),
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returningAll()
      .executeTakeFirstOrThrow()
  }

  /** CRUD 操作 */
  async list(tenantId: string, params: { issueId?: string; status?: string; page: number; pageSize: number }): Promise<PaginatedResponse<DecisionCard>>
  async getById(tenantId: string, id: string): Promise<DecisionCard & { votes: Vote[]; reasoningRun: ReasoningRun }>
  async update(tenantId: string, id: string, data: Partial<DecisionCardCreateInput>): Promise<DecisionCard>
  async delete(tenantId: string, id: string): Promise<void>

  /** 投票 */
  async vote(tenantId: string, cardId: string, input: VoteInput): Promise<Vote> {
    // 1. upsert vote (一个用户只能投一票，可更改)
    // 2. 更新 decision_card.vote_summary 聚合
    // 3. 返回 vote 记录
  }

  /** 采纳/拒绝 */
  async adopt(tenantId: string, cardId: string, adoptedBy: string): Promise<DecisionCard>
  async reject(tenantId: string, cardId: string, rejectedBy: string, reason?: string): Promise<DecisionCard>
}
```

### API 路由

```typescript
// backend/app/api/decisions/route.ts
// GET  /api/decisions?issueId=&status=&page=1&pageSize=20
// POST /api/decisions (手动创建，一般不用)

// backend/app/api/decisions/[id]/route.ts
// GET    /api/decisions/:id (含投票详情 + 推理过程)
// PATCH  /api/decisions/:id
// DELETE /api/decisions/:id

// backend/app/api/decisions/[id]/vote/route.ts
// POST /api/decisions/:id/vote  { vote: 'agree'|'disagree'|'abstain', comment? }

// backend/app/api/decisions/[id]/adopt/route.ts
// POST /api/decisions/:id/adopt

// backend/app/api/decisions/[id]/reject/route.ts
// POST /api/decisions/:id/reject { reason? }
```

---

## Decision 8: Frontend Strategy — 前端策略

### 设计理由

Phase 1 前端以"功能完备"为首要目标，不追求复杂 UI。大量使用 Element Plus 现有组件（ElDialog、ElForm、ElTable、ElPagination），减少自定义组件开发工作量。推理 SSE 流展示使用最简文本流方式。

### 证据模块

```vue
<!-- frontend/src/features/evidence/components/EvidenceCreateDialog.vue -->
<template>
  <el-dialog v-model="visible" title="添加证据" width="640px">
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-form-item label="标题" prop="title">
        <el-input v-model="form.title" placeholder="证据标题" />
      </el-form-item>
      <el-form-item label="内容" prop="content">
        <el-input v-model="form.content" type="textarea" :rows="6" placeholder="证据详细内容" />
      </el-form-item>
      <el-form-item label="来源 URL" prop="sourceUrl">
        <el-input v-model="form.sourceUrl" placeholder="https://..." />
      </el-form-item>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="来源类别" prop="sourceCategory">
            <el-select v-model="form.sourceCategory" style="width: 100%">
              <el-option label="内部" value="internal" />
              <el-option label="外部" value="external" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="来源类型" prop="sourceType">
            <el-select v-model="form.sourceType" style="width: 100%">
              <el-option v-for="t in sourceTypes" :key="t" :label="t" :value="t" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">创建</el-button>
    </template>
  </el-dialog>
</template>
```

### 推理模块 — SSE 流展示

```vue
<!-- frontend/src/features/issues/components/IssueReasoningPanel.vue -->
<template>
  <div class="reasoning-panel">
    <!-- Preflight 检查 -->
    <div v-if="!isRunning && !result" class="preflight-section">
      <el-button type="primary" :loading="preflightLoading" @click="checkPreflight">
        预检: 检查证据充分性
      </el-button>
      <div v-if="preflight" class="preflight-result">
        <el-tag :type="preflightTagType">{{ preflight.mode }}</el-tag>
        <span>{{ preflight.message }}</span>
        <span>正方 {{ preflight.proCount }} 条 / 反方 {{ preflight.conCount }} 条</span>
      </div>
      <el-button
        v-if="preflight && preflight.mode !== 'refused'"
        type="warning"
        @click="triggerReasoning"
      >
        启动对抗推理
      </el-button>
    </div>

    <!-- SSE 流式展示 -->
    <div v-if="isRunning" class="stream-section">
      <div class="status-bar">
        <el-steps :active="currentStep" finish-status="success" simple>
          <el-step title="准备" />
          <el-step title="正方辩论" />
          <el-step title="反方辩论" />
          <el-step title="裁判评判" />
          <el-step title="生成决策" />
        </el-steps>
      </div>
      <div class="log-output">
        <div v-for="(log, i) in logs" :key="i" class="log-entry" :class="log.type">
          <span class="log-time">{{ log.time }}</span>
          <span class="log-content">{{ log.content }}</span>
        </div>
      </div>
    </div>

    <!-- 结果展示 -->
    <div v-if="result" class="result-section">
      <el-result :icon="resultIcon" :title="result.verdict">
        <template #sub-title>{{ result.recommendation }}</template>
      </el-result>
      <el-button type="primary" @click="goToDecisionCard">查看决策卡</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
// SSE 连接逻辑
function connectSSE(runId: string) {
  const eventSource = new EventSource(`/api/issues/${issueId}/reasoning?runId=${runId}`)

  eventSource.addEventListener('status_change', (e) => {
    const data = JSON.parse(e.data)
    updateStep(data.toState)
    addLog('status', `状态变更: ${data.toState}`)
  })

  eventSource.addEventListener('progress', (e) => {
    const data = JSON.parse(e.data)
    addLog('progress', data.message)
  })

  eventSource.addEventListener('agent_complete', (e) => {
    const data = JSON.parse(e.data)
    addLog('complete', `${data.agent} 完成: ${data.summary}`)
  })

  eventSource.addEventListener('completed', (e) => {
    const data = JSON.parse(e.data)
    isRunning.value = false
    result.value = data
    eventSource.close()
  })

  eventSource.addEventListener('error', (e) => {
    const data = JSON.parse(e.data)
    addLog('error', data.message)
    isRunning.value = false
    eventSource.close()
  })
}
</script>
```

### 决策卡详情页

```vue
<!-- 展示结构: 裁决结果 → 置信度雷达图(6维) → 关键因素 → 风险 → 投票 → 评论 -->
<!-- 使用 Element Plus: ElDescriptions, ElProgress, ElTag, ElButton, ElInput -->
<!-- 投票: 三个按钮 (同意/反对/弃权) + 可选评论 -->
```

### 数据源管理页

```vue
<!-- 基础 CRUD: ElTable 列表 + 创建弹窗 (name, type, config) + 同步按钮 -->
<!-- config 根据 type 动态渲染不同表单字段: -->
<!-- rss_feed: feedUrl, pollInterval, contentType -->
<!-- web_crawler: urls (textarea), cssSelector -->
```

---

## Non-Goals — 非目标

以下功能明确排除在 Phase 1 范围外：

- **ES 全文搜索**: 证据搜索使用 SQL LIKE，不走 Elasticsearch 全文检索（MVP 数据量不需要）
- **实时 WebSocket**: SSE 足够满足推理流式推送需求
- **批量证据导入 UI**: 仅提供 API，前端不做批量导入界面
- **推理历史对比**: 不做多次推理结果的对比分析
- **决策卡导出**: 不做 PDF/Markdown 导出功能
- **复杂 embedding 策略**: 不做 chunk 分割、不做 hybrid search（纯向量搜索）
- **数据源高级调度**: 不做 cron 表达式、不做并发控制
- **前端复杂可视化**: 不做推理过程的图形化展示（如辩论树、论点关系图）

---

## Risks — 风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| Embedding API 调用成本 | 中 — 大量证据入库时成本累积 | 使用 voyage-3-lite（$0.06/1M tokens）；批量请求减少 API 调用次数；缓存已有向量避免重复计算 |
| Claude API 推理延迟 | 高 — 三方 Agent 串行执行约 30-60s | SSE 流式输出让用户感知进度；每个 Agent 设置 60s timeout；Worker 异步执行不阻塞 API |
| RSS/Crawler 可靠性 | 中 — 外部源不可控 | BullMQ retry (3 次, exponential backoff)；ImportJob 记录错误详情；数据源 health status 字段 |
| 状态机并发冲突 | 低 — 同一推理只有一个 Worker 处理 | 乐观锁 (WHERE status = fromState)；ConcurrentModificationError 异常处理 |
| 向量维度不一致 | 低 — Voyage 1024 vs OpenAI 1536 | 固定使用一种模型；如需切换则重建 ES index + 重新向量化 |
