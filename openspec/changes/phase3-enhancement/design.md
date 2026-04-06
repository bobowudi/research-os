# Phase 3: 增强 — Design

> Status: proposed
> Phase: 3 — Enhancement (~1 week)

## Decision 1: Signal Detection Worker

信号检测 Worker 定期扫描证据库，使用 AI 分析异常、趋势和机会。

```typescript
class SignalWorker extends BaseWorker<{ tenantId: string }> {
  async process(job): Promise<void> {
    // 1. Fetch recent evidence (last 24h) for the tenant
    // 2. Group by sourceCategory + sourceType
    // 3. Claude API: analyze for patterns/anomalies/trends
    //    Prompt: given these recent evidence items, identify risks, opportunities, trends, anomalies
    //    Output: { signals: [{ title, description, type, severity, evidenceIds[] }] }
    // 4. Deduplicate against existing unresolved signals
    // 5. Create Signal records
    // 6. Auto-generate Insight if signal severity >= 'high'
  }
}
```

运行频率: 每个租户每 6 小时运行一次 (可配置)。使用 BullMQ repeatable job，与现有 Worker 基础设施一致。

**为什么选择定期批量而非实时流？**
- 证据入库量不大（每天几十到几百条），实时分析性价比低
- 批量分析可以识别跨证据的趋势/关联，单条实时分析做不到
- 降低 AI API 调用成本

## Decision 2: Signal→Insight→Issue Pipeline

信号与现有闭环系统的集成策略：

- **High severity signal** → 自动创建 Insight (source: `'ai_signal'`)
- **Critical signal** → 自动创建 Issue (如果没有匹配的活跃议题)
- **用户手动操作**: 可将信号关联到已有议题

```typescript
// signal-to-insight flow
async function processHighSeveritySignal(signal: Signal): Promise<void> {
  if (signal.severity === 'critical' || signal.severity === 'high') {
    const insight = await insightService.create({
      tenantId: signal.tenantId,
      title: `[Signal] ${signal.title}`,
      content: signal.description,
      source: 'ai_signal',
      sourceId: signal.id,
      evidenceIds: signal.evidenceIds,
    })
    await signalService.update(signal.id, { insightId: insight.id })
  }

  if (signal.severity === 'critical') {
    const existingIssue = await issueService.findByKeywords(signal.tenantId, signal.title)
    if (!existingIssue) {
      const issue = await issueService.create({
        tenantId: signal.tenantId,
        title: `[Auto] ${signal.title}`,
        description: signal.description,
        priority: 'high',
        source: 'signal',
      })
      await signalService.update(signal.id, { issueId: issue.id })
    }
  }
}
```

**为什么 high 不自动创建 Issue？**
- Issue 代表需要团队投入的工作项，门槛应更高
- High severity 生成 Insight 供人类审阅，由人决定是否升级为 Issue

## Decision 3: API Integration Source

API 集成数据源支持从外部 REST API 拉取数据并转化为证据。

```typescript
class ApiSourceWorker extends BaseWorker<{ dataSourceId: string; tenantId: string }> {
  async process(job): Promise<void> {
    // 1. Read DataSource config (endpoint, auth type, headers, field mapping)
    // 2. HTTP request with configured auth (bearer/api_key/basic)
    // 3. Apply field mapping to extract evidence fields
    // 4. Deduplicate + create Evidence records
  }
}
```

支持的鉴权类型:
- `none` — 无鉴权（公开 API）
- `bearer_token` — Authorization: Bearer xxx
- `api_key` — 可放在 header 或 query parameter
- `basic_auth` — username:password

```typescript
interface ApiSourceConfig {
  endpoint: string
  method: 'GET' | 'POST'
  headers?: Record<string, string>
  auth: {
    type: 'none' | 'bearer_token' | 'api_key' | 'basic_auth'
    token?: string        // for bearer_token
    apiKey?: string       // for api_key
    apiKeyName?: string   // header/query param name
    apiKeyIn?: 'header' | 'query'
    username?: string     // for basic_auth
    password?: string     // for basic_auth
  }
  fieldMapping: {
    title: string       // JSON path to title field
    content: string     // JSON path to content field
    url?: string        // JSON path to URL field
    publishedAt?: string // JSON path to date field
  }
  responseDataPath?: string // JSON path to the array of items (e.g., 'data.items')
}
```

## Decision 4: Sync Scheduler

使用 BullMQ repeatable jobs 统一管理所有数据源的同步调度。

```typescript
// sync-scheduler.ts
async function scheduleAllSources(): Promise<void> {
  const sources = await dataSourceService.listActive()
  for (const source of sources) {
    const pattern = frequencyToCron(source.syncFrequency)
    // daily  → '0 2 * * *'  (每天凌晨2点)
    // hourly → '0 * * * *'  (每小时整点)
    // every6h → '0 */6 * * *'
    await queue.add(
      source.type + '-sync',
      { dataSourceId: source.id, tenantId: source.tenantId },
      { repeat: { pattern } }
    )
  }
}

// 启动时调用一次，之后数据源变更时增量更新
async function onDataSourceChanged(source: DataSource): Promise<void> {
  // Remove old repeatable job
  await queue.removeRepeatableByKey(getRepeatableKey(source))
  // Re-add if still active
  if (source.status === 'active') {
    await scheduleAllSources() // or schedule single source
  }
}
```

**为什么不用 node-cron?**
- BullMQ repeatable jobs 与现有队列基础设施统一
- 自动持久化，重启不丢失
- 支持分布式部署（多实例不重复执行）

## Decision 5: ES Index Design

三个索引 (evidence, issues, insights) 使用统一的设计模式。

```typescript
// evidence index
const evidenceMapping = {
  mappings: {
    properties: {
      tenant_id: { type: 'keyword' },
      content: { type: 'text', analyzer: 'ik_max_word' },   // 中文分词
      summary: { type: 'text', analyzer: 'ik_max_word' },
      title: { type: 'text', analyzer: 'ik_max_word' },
      tags: { type: 'keyword' },
      source_category: { type: 'keyword' },
      source_type: { type: 'keyword' },
      embedding: { type: 'dense_vector', dims: 1024, index: true, similarity: 'cosine' },
      created_at: { type: 'date' },
    }
  }
}

// issues index
const issuesMapping = {
  mappings: {
    properties: {
      tenant_id: { type: 'keyword' },
      title: { type: 'text', analyzer: 'ik_max_word' },
      description: { type: 'text', analyzer: 'ik_max_word' },
      status: { type: 'keyword' },
      priority: { type: 'keyword' },
      created_at: { type: 'date' },
      updated_at: { type: 'date' },
    }
  }
}

// insights index
const insightsMapping = {
  mappings: {
    properties: {
      tenant_id: { type: 'keyword' },
      title: { type: 'text', analyzer: 'ik_max_word' },
      content: { type: 'text', analyzer: 'ik_max_word' },
      source: { type: 'keyword' },
      created_at: { type: 'date' },
    }
  }
}
```

**为什么选择 ik_max_word?**
- `ik_max_word` 做最细粒度切分，召回率高，适合搜索场景
- `ik_smart` 切分粒度粗，适合索引阶段（但我们统一用 `ik_max_word` 简化配置）
- 需要在 ES Docker 中安装 IK 分析器插件

## Decision 6: MySQL→ES Sync Strategy

双写 + 定时全量同步，保证最终一致性。

```
MySQL write → success → enqueue ES index job (async)
                          ↓
                    ES Index Worker
                          ↓
                    ES document indexed
```

- **双写 (Dual Write)**: MySQL 写入成功后，通过 BullMQ 异步发送 ES 索引任务。不阻塞主流程。
- **全量同步 (Full Sync)**: 每天凌晨定时全量同步，作为安全网，修复可能的不一致。
- **No ES write-back**: ES 是只读索引，数据真相 (source of truth) 始终是 MySQL。

```typescript
// 双写: 在 Service 层 create/update 后触发
async function afterEvidenceWrite(evidence: Evidence): Promise<void> {
  await esIndexQueue.add('index-document', {
    index: 'evidence',
    id: evidence.id,
    document: mapToEsDocument(evidence),
  })
}

// 全量同步: 每日 scheduled job
async function fullSyncEvidence(tenantId: string): Promise<void> {
  const evidences = await evidenceRepo.findAll({ tenantId })
  const bulkOps = evidences.map(e => [
    { index: { _index: 'evidence', _id: e.id } },
    mapToEsDocument(e),
  ]).flat()
  await esClient.bulk({ body: bulkOps })
}
```

**为什么不用 Logstash/Debezium?**
- 项目规模小，引入额外中间件增加运维复杂度
- BullMQ 异步队列已经足够可靠
- 全量同步作为兜底，容忍短暂不一致

## Decision 7: Dashboard Components

仪表盘采用组件化架构，每个组件独立获取数据，用户可配置显示/隐藏和排序。

```typescript
interface DashboardConfig {
  components: Array<{
    type: 'overview_stats' | 'urgent_decisions' | 'my_actions' | 'recent_signals' | 'action_progress' | 'my_issues'
    order: number
    visible: boolean
  }>
}
```

存储方案: 在 users 表增加 `dashboard_config` JSON 字段（MVP 方案，轻量）。

```typescript
// dashboard/service.ts — 组件化数据聚合
class DashboardService {
  async getComponentData(tenantId: string, userId: string, componentType: string): Promise<unknown> {
    switch (componentType) {
      case 'overview_stats':
        return this.getOverviewStats(tenantId)
      case 'urgent_decisions':
        return this.getUrgentDecisions(tenantId)
      case 'my_actions':
        return this.getMyActions(tenantId, userId)
      case 'recent_signals':
        return this.getRecentSignals(tenantId)
      case 'action_progress':
        return this.getActionProgress(tenantId)
      case 'my_issues':
        return this.getMyIssues(tenantId, userId)
    }
  }

  async getDashboard(tenantId: string, userId: string): Promise<DashboardData> {
    const config = await this.getUserDashboardConfig(userId)
    const visibleComponents = config.components.filter(c => c.visible).sort((a, b) => a.order - b.order)
    const data = await Promise.all(
      visibleComponents.map(c => this.getComponentData(tenantId, userId, c.type))
    )
    return { components: visibleComponents.map((c, i) => ({ ...c, data: data[i] })) }
  }
}
```

**为什么不用独立的 dashboard_configs 表？**
- MVP 阶段用户量小，JSON 字段足够
- 避免增加额外表和迁移
- 后续如需更复杂配置（多仪表盘、共享）再拆表

## Decision 8: Global Search

全局搜索基于 ES 多索引查询，支持跨实体搜索。

```typescript
// search/service.ts
class SearchService {
  async globalSearch(
    tenantId: string,
    query: string,
    options?: {
      types?: ('evidence' | 'issues' | 'insights')[]
      page?: number
      pageSize?: number
    }
  ): Promise<{
    results: Array<{ type: string; id: string; title: string; snippet: string; score: number }>
    total: number
  }> {
    const indices = (options?.types || ['evidence', 'issues', 'insights']).join(',')
    const response = await this.esClient.search({
      index: indices,
      body: {
        query: {
          bool: {
            must: { multi_match: { query, fields: ['title^2', 'content', 'summary', 'description'] } },
            filter: { term: { tenant_id: tenantId } },
          }
        },
        highlight: { fields: { content: {}, title: {}, summary: {}, description: {} } },
        from: ((options?.page || 1) - 1) * (options?.pageSize || 20),
        size: options?.pageSize || 20,
      }
    })
    return {
      results: response.hits.hits.map(hit => ({
        type: hit._index,
        id: hit._id,
        title: hit._source.title || '',
        snippet: Object.values(hit.highlight || {}).flat()[0] || '',
        score: hit._score,
      })),
      total: response.hits.total.value,
    }
  }
}
```

API 路由: `GET /api/search?q=关键词&types=evidence,issues&page=1&pageSize=20`

## Non-Goals

以下功能不在 Phase 3 范围内：

- **No file_watch implementation** — 仅保留占位，文件系统监听复杂度高，优先级低
- **No real-time signal alerts** — 不实现推送通知/WebSocket，信号通过仪表盘展示
- **No dashboard drag-and-drop layout** — 仅支持显示/隐藏和排序，不支持拖拽布局
- **No cross-tenant search** — 搜索严格按租户隔离

## Risks

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| ES 中文分词器 (ik_max_word) 需要安装 ES 插件 | 搜索功能不可用 | 在 docker-compose.yml 中配置 IK 插件自动安装 |
| 信号检测误报率高 | 用户信任度下降 | severity 阈值 + 用户确认流程 + 逐步调优 prompt |
| API 数据源鉴权凭据存储安全 | 凭据泄露风险 | DB 中加密存储，API 返回时脱敏 |
| 全量同步数据量增长后性能 | 同步耗时过长 | 增量时间戳优化，分批同步 |
