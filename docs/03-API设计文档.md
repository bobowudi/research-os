# ResearchOS API 设计文档 v3.1

> RESTful API 接口设计 — 无公网搜索版本

---

## 一、API 概览

### 基础信息

- **Base URL**: `/api`
- **认证**: Bearer Token (JWT)
- **租户隔离**: 通过 Token 中的 tenantId 隔离
- **分页**: `?page=1&pageSize=20`
- **版本**: API 无显式版本前缀，通过文档版本管理

### 通用响应格式

```typescript
// 成功响应
interface SuccessResponse<T> {
  success: true
  data: T
}

// 分页响应
interface PaginatedResponse<T> {
  success: true
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

// 错误响应
interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}
```

### API 端点总览

| 模块 | 前缀 | 说明 |
|------|------|------|
| P1 认证与用户 | `/api/auth`, `/api/users`, `/api/tenants` | 认证、用户管理、租户管理 |
| M1 议题管理 | `/api/issues` | 议题 CRUD + 状态流转 |
| M2 证据管理 | `/api/evidence` | 证据 CRUD + 搜索 |
| M3 立场分析 | `/api/issues/:id/evidence` | 议题-证据关联 + 立场分析 |
| M4 洞察管理 | `/api/issues/:issueId/insights`, `/api/insights` | 洞察 CRUD + 确认/争议 |
| M5 对抗推理 | `/api/issues/:id/reasoning` | 推理触发 + 结果查询 |
| M6 决策管理 | `/api/decision-cards` | 决策卡查看 + 采纳/拒绝 |
| M7 行动管理 | `/api/actions` | 行动项 CRUD + AI 生成 |
| M8 回看闭环 | `/api/actions/:id/review`, `/api/reviews` | 回看记录 + 效果评估 |
| M9 信号检测 | `/api/signals` | 信号列表 + 状态管理 |
| M10 数据源管理 | `/api/data-sources` | 数据源配置 + 同步调度 |
| M11 仪表盘 | `/api/dashboard` | 数据概览 |

---

## 二、认证与用户 API (P1)

### 2.1 认证

```
POST   /api/auth/login                        # 用户登录
POST   /api/auth/register                     # 用户注册
POST   /api/auth/logout                       # 用户登出
POST   /api/auth/refresh                      # 刷新令牌
GET    /api/auth/me                           # 获取当前用户信息
```

#### 用户登录

```typescript
// POST /api/auth/login
// Request
{
  email: "user@example.com",
  password: "********"
}

// Response
{
  success: true,
  data: {
    token: "eyJhbGciOiJIUzI1NiIs...",
    refreshToken: "refresh_token_value",
    expiresIn: 3600,
    user: {
      id: "u-001",
      tenantId: "t-001",
      email: "user@example.com",
      name: "张三",
      role: "analyst",
      avatarUrl: "https://..."
    }
  }
}
```

### 2.2 用户管理

```
GET    /api/users                              # 用户列表（管理员）
GET    /api/users/:id                          # 用户详情
PATCH  /api/users/:id                          # 更新用户信息
DELETE /api/users/:id                          # 停用用户
```

### 2.3 租户管理

```
GET    /api/tenants/current                    # 当前租户信息
PATCH  /api/tenants/current/settings           # 更新租户设置
```

---

## 三、议题管理 API (M1)

### 3.1 议题 CRUD

```
POST   /api/issues                             # 创建议题
GET    /api/issues                             # 议题列表
GET    /api/issues/:id                         # 议题详情
PATCH  /api/issues/:id                         # 更新议题
DELETE /api/issues/:id                         # 删除议题（软删除）
```

#### 创建议题

```typescript
// POST /api/issues
// Request
{
  title: "Q3 NPS 下降 5 分，原因是什么？",
  description: "Q3 调研显示 NPS 从 45 分下降到 40 分...",
  domain: "brand",                              // brand | product | market | strategy | operations
  decisionDueAt: "2026-04-15T00:00:00Z"
}

// Response
{
  success: true,
  data: {
    id: "i-001",
    tenantId: "t-001",
    title: "Q3 NPS 下降 5 分，原因是什么？",
    description: "Q3 调研显示 NPS 从 45 分下降到 40 分...",
    domain: "brand",
    status: "draft",
    ownerId: "u-001",
    ownerName: "张三",
    tags: [],
    decisionDueAt: "2026-04-15T00:00:00Z",
    evidenceCount: 0,
    insightCount: 0,
    decisionCardCount: 0,
    createdAt: "2026-03-25T10:00:00Z",
    updatedAt: "2026-03-25T10:00:00Z"
  }
}
```

> **v3.1 变更**：移除 `triggerSearch`、`searchTriggered`、`searchedAt` 字段。系统不再支持公网实时搜索。

#### 议题详情 (含关联数据)

```typescript
// GET /api/issues/:id
// Response
{
  success: true,
  data: {
    issue: {
      id: "i-001",
      tenantId: "t-001",
      title: "Q3 NPS 下降 5 分，原因是什么？",
      description: "...",
      domain: "brand",
      status: "analyzing",
      ownerId: "u-001",
      ownerName: "张三",
      tags: ["NPS", "品牌"],
      decisionDueAt: "2026-04-15T00:00:00Z",
      evidenceCount: 8,
      insightCount: 3,
      decisionCardCount: 1,
      createdAt: "...",
      updatedAt: "..."
    },
    evidence: [
      {
        id: "e-001",
        sourceCategory: "internal",
        sourceType: "survey",
        sourceLabel: "2024Q3品牌调研",
        content: "62%的用户认为产品价格偏高...",
        summary: "...",
        tags: ["价格", "NPS"],
        confidence: 75,
        // 相对于此议题的立场
        issueStance: {
          stance: "pro",
          source: "ai",
          confidence: 85,
          reason: "用户反馈价格高，支持降价",
          version: 1,
          analyzedAt: "2026-03-25T10:30:00Z"
        },
        relevanceScore: 0.92,
        relationType: "manual",
        createdAt: "..."
      }
    ],
    insights: [
      {
        id: "ins-001",
        title: "用户价格敏感度显著上升",
        description: "...",
        type: "finding",
        status: "confirmed",
        source: "ai_reasoning",
        confidence: 82,
        evidenceIds: ["e-001", "e-003", "e-007"],
        createdAt: "..."
      }
    ],
    decisionCards: [ ... ],
    actions: [ ... ],
    reviews: [ ... ],
    signals: [ ... ]
  }
}
```

### 3.2 议题状态流转

```
PATCH  /api/issues/:id/status                  # 状态流转
GET    /api/issues/:id/timeline                # 议题时间线
```

```typescript
// PATCH /api/issues/:id/status
// Request
{
  toStatus: "analyzing",                        // draft → collecting → analyzing → pending_decision → decided → closed
  reason?: "证据收集完成，开始分析"
}

// Response
{
  success: true,
  data: {
    id: "i-001",
    status: "analyzing",
    updatedAt: "2026-03-25T11:00:00Z"
  }
}
```

---

## 四、证据管理 API (M2)

### 4.1 证据 CRUD

```
POST   /api/evidence                           # 创建证据
GET    /api/evidence                           # 证据列表（支持 sourceCategory/sourceType 筛选）
GET    /api/evidence/:id                       # 证据详情
PATCH  /api/evidence/:id                       # 更新证据
DELETE /api/evidence/:id                       # 删除证据（软删除）
```

#### 创建证据

```typescript
// POST /api/evidence
// Request
{
  sourceCategory: "internal",                  // internal | external (仅两种)
  sourceType: "survey",                        // survey | interview | internal_data | historical | social | competitor | report | news | manual
  sourceLabel: "2024Q3品牌调研",
  sourceRef: "survey-2024-q3-brand",
  sourceUrl?: "https://...",                   // 可选，external 类型可提供原始 URL
  content: "62%的用户认为产品价格偏高...",
  freshnessAt: "2024-09-30T00:00:00Z",
  citation: "2024Q3品牌调研, n=500",
  confidenceFactors?: {
    sourceReliability: 85,
    dataFreshness: 70,
    sampleSize: 500,
    methodology: "在线问卷"
  }
}

// Response
{
  success: true,
  data: {
    id: "e-001",
    tenantId: "t-001",
    sourceCategory: "internal",
    sourceType: "survey",
    sourceLabel: "2024Q3品牌调研",
    sourceRef: "survey-2024-q3-brand",
    content: "62%的用户认为产品价格偏高...",
    summary: "AI 生成的摘要: 多数用户反映价格偏高",       // AI 自动生成
    tags: ["价格", "NPS"],                                 // AI 自动提取
    confidence: 75,
    freshnessAt: "2024-09-30T00:00:00Z",
    citation: "2024Q3品牌调研, n=500",
    createdBy: "u-001",
    createdAt: "2026-03-25T10:00:00Z",
    updatedAt: "2026-03-25T10:00:00Z"
  }
}
```

> **v3.1 变更**：`sourceCategory` 仅支持 `internal` | `external` 两种，移除 `search`。`sourceType` 增加 `manual` 类型。

### 4.2 证据搜索

```
POST   /api/evidence/search                    # 语义搜索证据库
GET    /api/evidence/conflicts                 # 获取冲突证据列表
```

```typescript
// POST /api/evidence/search
// Request
{
  query: "用户对价格的反馈",
  sourceCategory?: "internal",                 // 可选筛选
  sourceType?: "survey",                       // 可选筛选
  tags?: ["价格"],                             // 可选标签筛选
  page?: 1,
  pageSize?: 20
}

// Response (PaginatedResponse)
{
  success: true,
  data: [
    {
      id: "e-001",
      sourceCategory: "internal",
      sourceType: "survey",
      sourceLabel: "2024Q3品牌调研",
      summary: "...",
      tags: ["价格", "NPS"],
      confidence: 75,
      relevanceScore: 0.95,                    // 搜索相关度
      createdAt: "..."
    }
  ],
  pagination: { page: 1, pageSize: 20, total: 5, totalPages: 1 }
}
```

### 4.3 证据批量导入

```
POST   /api/evidence/import                    # 批量导入
```

```typescript
// POST /api/evidence/import
// Request (multipart/form-data 或 JSON)
{
  sourceCategory: "internal",
  sourceType: "survey",
  sourceLabel: "2024Q3品牌调研",
  format: "csv",                               // csv | json | excel
  file?: File,                                 // 文件上传方式
  records?: [                                  // 或直接传 JSON 数组
    {
      content: "证据内容1",
      citation: "来源引用1",
      freshnessAt: "2024-09-30T00:00:00Z"
    }
  ]
}

// Response
{
  success: true,
  data: {
    importJobId: "job-001",
    status: "running",
    totalRecords: 50,
    processedRecords: 0,
    estimatedTime: "30s"
  }
}
```

### 4.4 AI 摘要生成

```
POST   /api/evidence/:id/summarize             # AI 生成/重新生成摘要
```

```typescript
// POST /api/evidence/:id/summarize
// Response
{
  success: true,
  data: {
    id: "e-001",
    summary: "AI 生成的新摘要...",
    tags: ["价格", "品牌", "NPS"],
    updatedAt: "2026-03-25T11:00:00Z"
  }
}
```

---

## 五、立场分析 API (M3)

### 5.1 议题-证据关联

```
POST   /api/issues/:id/evidence                       # 关联证据到议题（自动触发立场分析）
GET    /api/issues/:id/evidence                       # 获取议题关联的证据列表（含立场信息）
DELETE /api/issues/:id/evidence/:evidenceId            # 取消关联
```

#### 关联证据 (含自动立场分析)

```typescript
// POST /api/issues/:id/evidence
// Request
{
  evidenceId: "e-001",
  stance?: "pro",                              // 可选，不传则 AI 自动分析
  stanceSource?: "manual"                      // manual | ai (默认 ai)
}

// Response (如果 stance 未传，会自动触发 AI 分析)
{
  success: true,
  data: {
    issueId: "i-001",
    evidenceId: "e-001",
    relationType: "manual",
    relevanceScore: 0.85,
    stance: "pro",
    stanceSource: "ai",
    stanceConfidence: 85,
    stanceReason: "用户反馈价格高，支持降价方向",
    stanceVersion: 1,
    stanceAnalyzedAt: "2026-03-25T10:30:00Z",
    createdAt: "2026-03-25T10:30:00Z",
    updatedAt: "2026-03-25T10:30:00Z"
  }
}
```

#### 获取议题关联证据列表

```typescript
// GET /api/issues/:id/evidence?sourceCategory=internal&stance=pro
// Query 参数:
//   sourceCategory?: 'internal' | 'external'   筛选来源分类
//   stance?: 'pro' | 'con' | 'neutral'         筛选立场
//   page?: number
//   pageSize?: number

// Response (PaginatedResponse)
{
  success: true,
  data: [
    {
      issueId: "i-001",
      evidenceId: "e-001",
      relationType: "manual",
      relevanceScore: 0.85,
      stance: "pro",
      stanceSource: "ai",
      stanceConfidence: 85,
      stanceReason: "用户反馈价格高，支持降价方向",
      stanceVersion: 1,
      stanceAnalyzedAt: "2026-03-25T10:30:00Z",
      // 嵌套证据详情
      evidence: {
        id: "e-001",
        sourceCategory: "internal",
        sourceType: "survey",
        sourceLabel: "2024Q3品牌调研",
        summary: "...",
        tags: ["价格", "NPS"],
        confidence: 75,
        createdAt: "..."
      },
      createdAt: "...",
      updatedAt: "..."
    }
  ],
  pagination: { ... }
}
```

### 5.2 立场分析

```
POST   /api/issues/:id/evidence/analyze-stance         # 批量分析立场
POST   /api/issues/:id/evidence/re-analyze-stance      # 批量重新分析立场（version+1）
PATCH  /api/issues/:id/evidence/:evidenceId/stance     # 手动修正单条立场
GET    /api/issues/:id/evidence/:evidenceId/stance-history  # 立场变更历史
```

#### 批量分析立场

```typescript
// POST /api/issues/:id/evidence/analyze-stance
// Request
{
  evidenceIds?: ["e-001", "e-002"]             // 可选，不传则分析所有未分析的关联证据
}

// Response
{
  success: true,
  data: {
    results: [
      {
        evidenceId: "e-001",
        stance: "pro",
        confidence: 85,
        reason: "用户反馈价格高，支持降价",
        version: 1,
        analyzedAt: "2026-03-25T10:30:00Z"
      },
      {
        evidenceId: "e-002",
        stance: "con",
        confidence: 70,
        reason: "品牌溢价能力强，降价可能损害品牌",
        version: 1,
        analyzedAt: "2026-03-25T10:30:00Z"
      }
    ],
    modelUsed: "claude-sonnet-4",
    tokenUsage: {
      input: 500,
      output: 200,
      total: 700,
      estimatedCost: 0.0035
    }
  }
}
```

#### 批量重新分析立场

```typescript
// POST /api/issues/:id/evidence/re-analyze-stance
// 议题描述变更后可触发重新分析，stanceVersion 自动 +1
// Request
{
  evidenceIds?: ["e-001", "e-002"]             // 可选，不传则重新分析所有
}

// Response (同 analyze-stance 格式，version 递增)
{
  success: true,
  data: {
    results: [
      {
        evidenceId: "e-001",
        stance: "pro",
        confidence: 88,
        reason: "重新分析后：用户反馈价格高，支持降价方向",
        version: 2,                            // 版本号递增
        analyzedAt: "2026-03-26T09:00:00Z"
      }
    ],
    modelUsed: "claude-sonnet-4",
    tokenUsage: { ... }
  }
}
```

#### 手动修正单条立场

```typescript
// PATCH /api/issues/:id/evidence/:evidenceId/stance
// Request
{
  stance: "con",
  reason?: "经过团队讨论，认为这条证据应该解读为反对"
}

// Response
{
  success: true,
  data: {
    issueId: "i-001",
    evidenceId: "e-001",
    stance: "con",
    stanceSource: "manual",                    // 自动设为 manual
    stanceConfidence: null,                    // 手动设置时置信度为 null
    stanceReason: "经过团队讨论，认为这条证据应该解读为反对",
    stanceVersion: 2,                          // 版本号递增
    stanceAnalyzedAt: "2026-03-25T12:00:00Z",
    updatedAt: "2026-03-25T12:00:00Z"
  }
}
```

---

## 六、洞察管理 API (M4) 🆕

### 6.1 洞察 CRUD

```
POST   /api/issues/:issueId/insights                  # 创建洞察（手动）
GET    /api/issues/:issueId/insights                  # 获取议题下洞察列表
GET    /api/insights/:id                               # 洞察详情
PATCH  /api/insights/:id                               # 更新洞察
DELETE /api/insights/:id                               # 删除洞察
```

#### 手动创建洞察

```typescript
// POST /api/issues/:issueId/insights
// Request
{
  title: "用户价格敏感度显著上升",
  description: "综合多份调研数据发现，用户对价格的敏感度在过去两个季度显著上升...",
  type: "finding",                             // finding | risk | opportunity | contradiction
  confidence: 80,
  evidenceIds: ["e-001", "e-003", "e-007"]     // 关联支撑证据
}

// Response
{
  success: true,
  data: {
    id: "ins-001",
    tenantId: "t-001",
    issueId: "i-001",
    title: "用户价格敏感度显著上升",
    description: "综合多份调研数据发现...",
    type: "finding",
    status: "draft",
    source: "manual",
    confidence: 80,
    score: 75,                                 // 系统自动评分
    evidenceIds: ["e-001", "e-003", "e-007"],
    createdBy: "u-001",
    createdAt: "2026-03-25T14:00:00Z",
    updatedAt: "2026-03-25T14:00:00Z"
  }
}
```

#### 获取议题下洞察列表

```typescript
// GET /api/issues/:issueId/insights?status=confirmed&type=finding
// Query 参数:
//   status?: 'draft' | 'confirmed' | 'disputed' | 'archived'
//   type?: 'finding' | 'risk' | 'opportunity' | 'contradiction'
//   source?: 'ai_reasoning' | 'ai_signal' | 'manual'
//   page?: number
//   pageSize?: number

// Response (PaginatedResponse)
{
  success: true,
  data: [
    {
      id: "ins-001",
      title: "用户价格敏感度显著上升",
      type: "finding",
      status: "confirmed",
      source: "ai_reasoning",
      confidence: 82,
      score: 85,
      evidenceCount: 3,
      confirmedBy: "u-002",
      confirmedAt: "2026-03-25T15:00:00Z",
      createdAt: "..."
    }
  ],
  pagination: { ... }
}
```

### 6.2 洞察确认与争议

```
POST   /api/insights/:id/confirm                      # 确认洞察
POST   /api/insights/:id/dispute                      # 争议洞察
```

#### 确认洞察

```typescript
// POST /api/insights/:id/confirm
// Response
{
  success: true,
  data: {
    id: "ins-001",
    status: "confirmed",
    confirmedBy: "u-001",
    confirmedAt: "2026-03-25T15:00:00Z",
    updatedAt: "2026-03-25T15:00:00Z"
  }
}
```

#### 争议洞察

```typescript
// POST /api/insights/:id/dispute
// Request
{
  reason: "样本量不足以得出此结论，需要更多数据支撑"
}

// Response
{
  success: true,
  data: {
    id: "ins-001",
    status: "disputed",
    disputedBy: "u-002",
    disputedAt: "2026-03-25T16:00:00Z",
    disputeReason: "样本量不足以得出此结论，需要更多数据支撑",
    updatedAt: "2026-03-25T16:00:00Z"
  }
}
```

### 6.3 洞察-证据关联

```
POST   /api/insights/:id/evidence                     # 关联证据到洞察
DELETE /api/insights/:id/evidence/:evidenceId          # 取消证据关联
GET    /api/insights/:id/evidence                     # 获取洞察关联的证据
```

#### 关联证据到洞察

```typescript
// POST /api/insights/:id/evidence
// Request
{
  evidenceId: "e-005",
  supportType: "supports",                     // supports | contradicts | contextual
  note?: "该证据从定价策略角度佐证了此洞察"
}

// Response
{
  success: true,
  data: {
    insightId: "ins-001",
    evidenceId: "e-005",
    supportType: "supports",
    note: "该证据从定价策略角度佐证了此洞察",
    createdAt: "2026-03-25T14:30:00Z"
  }
}
```

### 6.4 洞察合并

```
POST   /api/insights/merge                            # 合并洞察
```

```typescript
// POST /api/insights/merge
// Request
{
  sourceInsightIds: ["ins-001", "ins-002"],     // 要合并的洞察 ID
  mergedTitle: "合并后的洞察标题",
  mergedDescription: "合并后的描述..."
}

// Response
{
  success: true,
  data: {
    id: "ins-003",                             // 新合并后的洞察
    title: "合并后的洞察标题",
    description: "合并后的描述...",
    evidenceIds: ["e-001", "e-003", "e-005"],  // 合并所有来源证据
    status: "draft",
    source: "manual",
    mergedFrom: ["ins-001", "ins-002"],
    createdAt: "..."
  }
}
```

### 6.5 AI 自动生成洞察

```
POST   /api/issues/:issueId/insights/generate           # AI 从关联证据中自动提炼洞察
```

```typescript
// POST /api/issues/:issueId/insights/generate
// Request
{
  maxInsights?: 5,                              // 最大生成数，默认 5
  sourceFilter?: "all"                          // 'all' | 'internal' | 'external'，基于哪类证据生成
}

// Response
{
  success: true,
  data: {
    insights: [
      {
        id: "ins-010",
        issueId: "i-001",
        title: "用户对性价比的关注度持续走高",
        description: "基于多份调研与社交数据，用户在决策过程中越来越看重性价比...",
        type: "finding",                        // finding | risk | opportunity | contradiction
        status: "draft",
        source: "ai_generated",
        confidence: 78,
        score: 72,
        evidenceIds: ["e-001", "e-003", "e-012"],
        createdBy: "system",
        createdAt: "2026-03-26T10:00:00Z"
      },
      {
        id: "ins-011",
        title: "竞品降价引发品牌认知分化风险",
        description: "外部竞品降价信号与内部用户调研交叉分析显示...",
        type: "risk",
        status: "draft",
        source: "ai_generated",
        confidence: 72,
        score: 68,
        evidenceIds: ["e-005", "e-010"],
        createdBy: "system",
        createdAt: "2026-03-26T10:00:00Z"
      }
    ],
    totalGenerated: 2,
    modelUsed: "claude-sonnet-4",
    tokenUsage: {
      input: 1200,
      output: 800,
      total: 2000,
      estimatedCost: 0.0100
    }
  }
}
```

---

## 七、对抗推理 API (M5)

### 7.1 触发推理

```
POST   /api/issues/:id/reasoning                      # 触发对抗推理
GET    /api/issues/:id/reasoning                      # 获取推理运行列表
GET    /api/issues/:id/reasoning/:runId               # 查询推理运行详情/状态
POST   /api/issues/:id/reasoning/:runId/cancel        # 取消推理
GET    /api/issues/:id/reasoning/:runId/stream         # SSE 流式输出推理过程
GET    /api/issues/:id/reasoning/:runId/trace          # 推理链路追踪（可视化用）
```

#### 触发推理

```typescript
// POST /api/issues/:id/reasoning
// Request
{
  regenerateDecisionCard?: true                // 可选，默认 true，是否生成/更新决策卡
}

// Response
{
  success: true,
  data: {
    runId: "run-001",
    issueId: "i-001",
    status: "pending",
    version: 1,
    inputSnapshot: {
      internalEvidenceCount: 5,
      externalEvidenceCount: 3,
      insightCount: 2
    },
    estimatedTime: "20s"
  }
}
```

> **v3.1 变更**：`inputSnapshot` 中移除 `searchEvidenceCount`。正方 Agent 仅使用内部证据，反方 Agent 仅使用外部证据（来自证据库，非实时搜索）。

#### 获取推理结果

```typescript
// GET /api/issues/:id/reasoning/:runId
// Response
{
  success: true,
  data: {
    runId: "run-001",
    issueId: "i-001",
    status: "completed",                       // pending | preparing | advocate_running | critic_running | judge_running | generating_card | completed | failed | cancelled
    version: 1,

    // 正方输出 (基于内部证据)
    advocateOutput: {
      arguments: [
        {
          claim: "62%用户反馈价格偏高",
          evidenceIds: ["e-001"],
          strength: 85,
          reasoning: "大样本调研数据，直接反映用户价格感知"
        },
        {
          claim: "竞品降价后市场份额上升",
          evidenceIds: ["e-003"],
          strength: 80,
          reasoning: "历史数据表明降价策略有效"
        }
      ],
      confidence: 80,
      summary: "内部证据强烈支持降价策略"
    },

    // 反方输出 (基于外部证据)
    criticOutput: {
      rebuttals: [
        {
          claim: "品牌溢价是核心竞争力",
          evidenceIds: ["e-002"],
          strength: 75,
          reasoning: "行业分析显示品牌力是主要护城河"
        }
      ],
      risks: [
        {
          description: "降价可能触发竞品价格战",
          severity: "high",
          likelihood: 60,
          evidenceIds: ["e-005"]
        }
      ],
      blindSpots: ["缺少下沉市场用户的价格接受区间数据"],
      confidence: 70,
      summary: "外部证据提示降价风险不可忽视"
    },

    // 裁判输出
    judgeOutput: {
      recommendation: "建议采取渐进式降价策略（5-8%），先在非核心产品线试点",
      confidence: 75,
      keyFactors: [
        "用户价格敏感度上升趋势明确",
        "品牌溢价仍是重要资产",
        "竞品已开始降价"
      ],
      dissent: "反方提出品牌溢价受损风险值得关注，建议控制降价幅度",
      suggestedActions: [
        "排查 Top 3 价格敏感场景",
        "设计 A/B 测试方案",
        "补充下沉市场调研"
      ],
      summary: "综合内外视角，有限度降价是平衡策略"
    },

    // 生成的洞察
    generatedInsightIds: ["ins-004", "ins-005"],

    // 生成的决策卡
    decisionCardId: "dc-001",

    // 性能指标
    tokenUsage: {
      input: 2000,
      output: 1500,
      total: 3500,
      estimatedCost: 0.0175
    },
    latencyMs: 15000,

    startedAt: "2026-03-25T12:00:00Z",
    completedAt: "2026-03-25T12:00:15Z",
    createdAt: "2026-03-25T12:00:00Z",
    updatedAt: "2026-03-25T12:00:15Z"
  }
}
```

#### SSE 流式输出推理过程

```typescript
// GET /api/issues/:id/reasoning/:runId/stream
// Response: Server-Sent Events

// 事件类型:
// status_change - 推理阶段变化
data: { "type": "status_change", "status": "advocate_running", "message": "正方 Agent 正在分析内部证据..." }

// progress - 中间输出
data: { "type": "progress", "agent": "advocate", "partial": "正在构建第 2 个论据..." }

// agent_complete - 单个 Agent 完成
data: { "type": "agent_complete", "agent": "advocate", "summary": "正方完成，共 3 个论据" }

// insight_generated - 生成了新洞察
data: { "type": "insight_generated", "insightId": "ins-004", "title": "用户价格敏感度上升趋势明确" }

// completed - 推理完成
data: { "type": "completed", "runId": "run-001", "decisionCardId": "dc-001" }

// error - 推理失败
data: { "type": "error", "message": "LLM 服务超时" }
```

---

## 八、决策管理 API (M6)

```
GET    /api/issues/:id/decision-cards                  # 获取议题下决策卡列表
GET    /api/decision-cards/:id                         # 获取决策卡详情
PATCH  /api/decision-cards/:id                         # 更新决策卡
POST   /api/decision-cards/:id/adopt                   # 采纳决策
POST   /api/decision-cards/:id/reject                  # 拒绝决策
GET    /api/decision-cards/:id/compare/:otherId        # 版本对比
POST   /api/decision-cards/:id/vote                    # 投票
GET    /api/decision-cards/:id/votes                   # 获取投票列表
POST   /api/decision-cards/:id/comments                # 添加评论
GET    /api/decision-cards/:id/comments                # 获取评论列表
POST   /api/decision-cards/:id/export                  # 导出（PDF/Markdown）
POST   /api/decision-cards/:id/share                   # 生成分享链接
GET    /api/shared/decision-cards/:shareToken          # 公开访问分享的决策卡
```

#### 获取决策卡详情

```typescript
// GET /api/decision-cards/:id
// Response
{
  success: true,
  data: {
    id: "dc-001",
    tenantId: "t-001",
    issueId: "i-001",
    reasoningRunId: "run-001",
    version: 1,

    // 推荐方案
    recommendation: "建议采取渐进式降价策略（5-8%），先在非核心产品线试点",
    confidence: 75,
    keyFactors: [
      "用户价格敏感度上升趋势明确",
      "品牌溢价仍是重要资产",
      "竞品已开始降价"
    ],

    // 风险
    risks: [
      {
        description: "降价可能触发竞品价格战",
        severity: "high",
        likelihood: 60,
        evidenceIds: ["e-005"]
      }
    ],

    // 反对意见摘要
    dissent: "品牌溢价受损风险值得关注",

    // 建议行动
    suggestedActions: ["排查价格敏感场景", "设计 A/B 测试", "下沉市场调研"],

    // 证据摘要
    evidenceSummary: {
      proCount: 5,
      conCount: 3,
      neutralCount: 2,
      totalEvidenceUsed: 10
    },

    // 状态
    status: "pending_review",                  // draft | pending_review | adopted | rejected | superseded
    adoptedBy: null,
    adoptedAt: null,
    decisionNote: null,

    createdAt: "2026-03-25T12:00:15Z",
    updatedAt: "2026-03-25T12:00:15Z"
  }
}
```

#### 采纳决策

```typescript
// POST /api/decision-cards/:id/adopt
// Request
{
  reason: "团队讨论后决定采纳此方案"
}

// Response
{
  success: true,
  data: {
    id: "dc-001",
    status: "adopted",
    adoptedBy: "u-001",
    adoptedAt: "2026-03-25T16:00:00Z",
    decisionNote: "团队讨论后决定采纳此方案",
    updatedAt: "2026-03-25T16:00:00Z"
  }
}
```

#### 拒绝决策

```typescript
// POST /api/decision-cards/:id/reject
// Request
{
  reason: "证据不够充分，需补充下沉市场数据后重新推理"
}

// Response
{
  success: true,
  data: {
    id: "dc-001",
    status: "rejected",
    rejectedBy: "u-001",
    rejectedAt: "2026-03-25T16:00:00Z",
    decisionNote: "证据不够充分，需补充下沉市场数据后重新推理",
    updatedAt: "2026-03-25T16:00:00Z"
  }
}
```

#### 投票

```typescript
// POST /api/decision-cards/:id/vote
// Request
{
  vote: "approve",                             // approve | reject | abstain
  comment?: "同意降价策略，但建议幅度控制在 5% 以内"
}

// Response
{
  success: true,
  data: {
    id: "v-001",
    decisionCardId: "dc-001",
    userId: "u-002",
    userName: "李四",
    vote: "approve",
    comment: "同意降价策略，但建议幅度控制在 5% 以内",
    createdAt: "2026-03-25T15:30:00Z"
  }
}
```

---

## 九、行动管理 API (M7)

```
GET    /api/actions                                    # 行动项列表（支持筛选）
POST   /api/actions                                    # 创建行动项
GET    /api/actions/:id                                # 行动项详情
PATCH  /api/actions/:id                                # 更新行动项
DELETE /api/actions/:id                                # 删除行动项
POST   /api/decision-cards/:id/generate-actions        # AI 从决策卡生成行动项
GET    /api/issues/:id/actions                         # 获取议题下所有行动项
```

#### AI 生成行动项

```typescript
// POST /api/decision-cards/:id/generate-actions
// Request
{
  maxActions?: 5                               // 最大行动项数，默认 5
}

// Response
{
  success: true,
  data: {
    actions: [
      {
        id: "a-001",
        tenantId: "t-001",
        issueId: "i-001",
        decisionCardId: "dc-001",
        title: "排查 Top 3 价格敏感场景",
        description: "分析用户价格敏感度最高的使用场景，找出优先优化点",
        status: "pending",
        priority: "high",
        assigneeName: "产品团队",
        dueAt: "2026-04-10T00:00:00Z",
        createdBy: "system",
        createdAt: "2026-03-25T16:30:00Z"
      },
      {
        id: "a-002",
        title: "设计 A/B 测试方案",
        description: "设计降价 A/B 测试方案，验证降价对转化率和品牌认知的影响",
        status: "pending",
        priority: "high",
        assigneeName: "数据团队",
        dueAt: "2026-04-15T00:00:00Z",
        // ...
      }
    ],
    tokenUsage: {
      input: 300,
      output: 200,
      total: 500,
      estimatedCost: 0.0025
    }
  }
}
```

#### 更新行动项

```typescript
// PATCH /api/actions/:id
// Request
{
  status?: "in_progress",                      // pending | in_progress | completed | cancelled | overdue
  assigneeId?: "u-003",
  assigneeName?: "王五",
  dueAt?: "2026-04-20T00:00:00Z",
  completionNote?: "已完成排查，Top 3 场景为..."
}

// Response
{
  success: true,
  data: {
    id: "a-001",
    status: "in_progress",
    assigneeId: "u-003",
    assigneeName: "王五",
    updatedAt: "2026-03-26T09:00:00Z"
  }
}
```

---

## 十、回看 API (M8)

```
POST   /api/actions/:id/review                         # 创建回看记录
GET    /api/reviews                                    # 回看列表
GET    /api/reviews/:id                                # 回看详情
PATCH  /api/reviews/:id                                # 更新回看
GET    /api/issues/:id/reviews                         # 获取议题下所有回看
POST   /api/reviews/:id/generate-evidence              # 将经验沉淀为新证据（闭环关键！）
POST   /api/issues/:id/review-summary                  # AI 生成回顾总结
```

#### 创建回看

```typescript
// POST /api/actions/:id/review
// Request
{
  outcome: "partially_successful",             // 'successful' | 'partially_successful' | 'unsuccessful' | 'inconclusive'
  actualResult: "NPS 从 40 提升至 43，但未达目标 45",
  expectedResult: "NPS 提升到 45 分以上",
  deviation: "实际提升 3 分，距预期差 2 分，主要是下沉市场转化不及预期",
  lessonsLearned: "降价 5% 对一二线城市用户 NPS 有正向影响，但下沉市场用户更关注功能而非价格",
  tags: ["NPS", "价格策略", "下沉市场"]
}

// Response
{
  success: true,
  data: {
    id: "r-001",
    tenantId: "t-001",
    actionItemId: "a-001",
    issueId: "i-001",
    decisionCardId: "dc-001",
    outcome: "partially_successful",
    actualResult: "NPS 从 40 提升至 43，但未达目标 45",
    expectedResult: "NPS 提升到 45 分以上",
    deviation: "实际提升 3 分，距预期差 2 分，主要是下沉市场转化不及预期",
    lessonsLearned: "降价 5% 对一二线城市用户 NPS 有正向影响...",
    tags: ["NPS", "价格策略", "下沉市场"],
    createdBy: "u-001",
    createdAt: "2026-05-01T10:00:00Z",
    updatedAt: "2026-05-01T10:00:00Z"
  }
}
```

#### 回看列表

```typescript
// GET /api/reviews?outcome=partially_successful&page=1&pageSize=20
// Query 参数:
//   outcome?: 'successful' | 'partially_successful' | 'unsuccessful' | 'inconclusive'
//   issueId?: string
//   tags?: string                             // 逗号分隔
//   page?: number
//   pageSize?: number

// Response (PaginatedResponse)
{
  success: true,
  data: [
    {
      id: "r-001",
      actionItemId: "a-001",
      issueId: "i-001",
      outcome: "partially_successful",
      actualResult: "NPS 从 40 提升至 43，但未达目标 45",
      tags: ["NPS", "价格策略", "下沉市场"],
      createdBy: "u-001",
      createdAt: "2026-05-01T10:00:00Z"
    }
  ],
  pagination: { ... }
}
```

#### 回看详情

```typescript
// GET /api/reviews/:id
// Response
{
  success: true,
  data: {
    id: "r-001",
    tenantId: "t-001",
    actionItemId: "a-001",
    issueId: "i-001",
    decisionCardId: "dc-001",
    outcome: "partially_successful",
    actualResult: "NPS 从 40 提升至 43，但未达目标 45",
    expectedResult: "NPS 提升到 45 分以上",
    deviation: "实际提升 3 分，距预期差 2 分...",
    lessonsLearned: "降价 5% 对一二线城市用户 NPS 有正向影响...",
    tags: ["NPS", "价格策略", "下沉市场"],
    // 关联的行动项信息
    action: {
      id: "a-001",
      title: "排查 Top 3 价格敏感场景",
      status: "completed"
    },
    // 已沉淀的证据
    generatedEvidenceIds: ["e-030"],
    createdBy: "u-001",
    createdAt: "2026-05-01T10:00:00Z",
    updatedAt: "2026-05-01T10:00:00Z"
  }
}
```

#### 更新回看

```typescript
// PATCH /api/reviews/:id
// Request
{
  outcome?: "unsuccessful",
  actualResult?: "更新后的实际结果",
  lessonsLearned?: "更新后的经验总结",
  tags?: ["NPS", "价格策略"]
}

// Response
{
  success: true,
  data: {
    id: "r-001",
    outcome: "unsuccessful",
    actualResult: "更新后的实际结果",
    lessonsLearned: "更新后的经验总结",
    tags: ["NPS", "价格策略"],
    updatedAt: "2026-05-02T09:00:00Z"
  }
}
```

#### 获取议题下所有回看

```typescript
// GET /api/issues/:id/reviews
// Response (PaginatedResponse)
{
  success: true,
  data: [
    {
      id: "r-001",
      actionItemId: "a-001",
      outcome: "partially_successful",
      actualResult: "NPS 从 40 提升至 43，但未达目标 45",
      tags: ["NPS", "价格策略", "下沉市场"],
      createdBy: "u-001",
      createdAt: "2026-05-01T10:00:00Z"
    }
  ],
  pagination: { ... }
}
```

#### 将经验沉淀为新证据（闭环关键）

```typescript
// POST /api/reviews/:id/generate-evidence
// Response
{
  success: true,
  data: {
    evidence: {
      id: "e-030",
      tenantId: "t-001",
      sourceCategory: "internal",              // 回看沉淀的证据归类为内部
      sourceType: "historical",                // 历史经验类型
      sourceLabel: "回看记录 r-001 经验沉淀",
      sourceRef: "review-r-001",
      content: "降价 5% 对一二线城市用户 NPS 有正向影响（+3 分），但下沉市场用户更关注功能而非价格。实际结果未达预期（目标 45 分，实际 43 分）。",
      summary: "AI 生成的摘要: 价格策略对不同市场用户影响存在差异化效果",
      tags: ["NPS", "价格策略", "下沉市场", "经验沉淀"],
      confidence: 90,                          // 来自实际执行结果，置信度高
      freshnessAt: "2026-05-01T10:00:00Z",
      citation: "回看记录 r-001, 行动项 a-001",
      createdBy: "system",
      createdAt: "2026-05-01T11:00:00Z",
      updatedAt: "2026-05-01T11:00:00Z"
    },
    reviewId: "r-001",
    message: "已从回看记录中沉淀 1 条新证据，可用于后续议题分析"
  }
}
```

#### AI 生成回顾总结

```typescript
// POST /api/issues/:id/review-summary
// Response
{
  success: true,
  data: {
    issueId: "i-001",
    summary: {
      title: "Q3 NPS 下降分析 — 回顾总结",
      overview: "本议题共产生 3 个行动项，完成 2 个，其中 1 个完全达标、1 个部分达标。",
      outcomeBreakdown: {
        successful: 1,
        partiallySuccessful: 1,
        unsuccessful: 0,
        inconclusive: 0,
        total: 2
      },
      keyLessons: [
        "降价策略在一二线城市效果显著，但下沉市场需差异化策略",
        "A/B 测试验证了 5% 降价幅度对转化率有正向影响",
        "品牌认知未受明显负面影响"
      ],
      recommendations: [
        "建议针对下沉市场制定独立的定价策略",
        "可将降价试点范围扩大到其他产品线",
        "后续应补充下沉市场用户调研"
      ],
      generatedAt: "2026-05-10T10:00:00Z"
    },
    tokenUsage: {
      input: 800,
      output: 500,
      total: 1300,
      estimatedCost: 0.0065
    }
  }
}
```

---

## 十一、信号 API (M9)

```
GET    /api/signals                                    # 信号列表
GET    /api/signals/:id                                # 信号详情
PATCH  /api/signals/:id                                # 更新信号状态
POST   /api/signals/:id/acknowledge                    # 确认信号
POST   /api/signals/:id/resolve                        # 解决信号
POST   /api/signals/:id/dismiss                        # 忽略信号
POST   /api/signals/:id/link-issue                     # 关联信号到议题
POST   /api/signals/:id/create-issue                   # 基于信号创建新议题
POST   /api/signals/:id/to-insight                     # 将信号转化为洞察
POST   /api/signals/detect                             # 手动触发信号检测
```

#### 信号列表

```typescript
// GET /api/signals?status=new&type=risk&severity=high
// Query 参数:
//   status?: 'new' | 'acknowledged' | 'resolved' | 'dismissed'
//   type?: 'risk' | 'opportunity' | 'trend' | 'anomaly'
//   severity?: 'critical' | 'high' | 'medium' | 'low'
//   page?: number
//   pageSize?: number

// Response (PaginatedResponse)
{
  success: true,
  data: [
    {
      id: "sig-001",
      tenantId: "t-001",
      type: "risk",
      severity: "high",
      title: "竞品 X 发布降价公告",
      description: "检测到竞品 X 在社交媒体发布降价 10% 公告，可能影响市场格局",
      evidenceIds: ["e-010", "e-011"],
      issueId: null,
      suggestedActions: ["创建竞品应对议题", "监控用户反馈变化"],
      status: "new",
      detectedAt: "2026-03-26T08:00:00Z"
    }
  ],
  pagination: { ... }
}
```

#### 关联信号到议题

```typescript
// POST /api/signals/:id/link-issue
// Request
{
  issueId: "i-001"
}

// Response
{
  success: true,
  data: {
    id: "sig-001",
    issueId: "i-001",
    status: "acknowledged",
    updatedAt: "2026-03-26T09:00:00Z"
  }
}
```

#### 基于信号创建新议题

```typescript
// POST /api/signals/:id/create-issue
// Request
{
  title?: "竞品 X 降价应对策略",                 // 可选，不传则 AI 根据信号自动生成
  description?: "针对竞品 X 降价 10% 的市场变化，分析应对策略"  // 可选
}

// Response
{
  success: true,
  data: {
    signal: {
      id: "sig-001",
      issueId: "i-005",                        // 自动关联到新议题
      status: "acknowledged",
      updatedAt: "2026-03-26T09:30:00Z"
    },
    issue: {
      id: "i-005",
      tenantId: "t-001",
      title: "竞品 X 降价应对策略",
      description: "针对竞品 X 降价 10% 的市场变化，分析应对策略",
      domain: "market",
      status: "draft",
      ownerId: "u-001",
      ownerName: "张三",
      tags: ["竞品", "价格战"],
      evidenceCount: 0,
      insightCount: 0,
      decisionCardCount: 0,
      createdAt: "2026-03-26T09:30:00Z",
      updatedAt: "2026-03-26T09:30:00Z"
    }
  }
}
```

#### 将信号转化为洞察

```typescript
// POST /api/signals/:id/to-insight
// Request
{
  issueId: "i-001"                              // 在哪个议题下创建洞察
}

// Response
{
  success: true,
  data: {
    signal: {
      id: "sig-001",
      status: "resolved",
      updatedAt: "2026-03-26T10:00:00Z"
    },
    insight: {
      id: "ins-020",
      tenantId: "t-001",
      issueId: "i-001",
      title: "竞品 X 降价 10% 可能引发价格战",
      description: "基于信号 sig-001 转化：检测到竞品 X 在社交媒体发布降价 10% 公告...",
      type: "risk",
      status: "draft",
      source: "ai_signal",
      confidence: 70,
      score: 65,
      evidenceIds: ["e-010", "e-011"],          // 继承信号关联的证据
      createdBy: "system",
      createdAt: "2026-03-26T10:00:00Z",
      updatedAt: "2026-03-26T10:00:00Z"
    }
  }
}
```

#### 手动触发信号检测

```typescript
// POST /api/signals/detect
// Request
{
  scope?: {
    sourceCategories?: ["external"],            // 可选，限定检测的证据来源分类
    sourceTypes?: ["social", "competitor"],     // 可选，限定检测的证据类型
    timeRange?: {
      from: "2026-03-01T00:00:00Z",
      to: "2026-03-26T23:59:59Z"
    }
  }
}

// Response
{
  success: true,
  data: {
    detectedCount: 3,
    signals: [
      {
        id: "sig-005",
        type: "trend",
        severity: "medium",
        title: "社交平台负面评价增长趋势",
        description: "近 7 天负面评价量较上周增长 35%...",
        evidenceIds: ["e-015", "e-016", "e-017"],
        detectedAt: "2026-03-26T11:00:00Z"
      }
    ],
    modelUsed: "claude-sonnet-4",
    tokenUsage: {
      input: 1500,
      output: 600,
      total: 2100,
      estimatedCost: 0.0105
    }
  }
}
```

---

## 十二、数据源管理 API (M10) 🆕

### 12.1 数据源 CRUD

```
POST   /api/data-sources                               # 创建数据源
GET    /api/data-sources                               # 数据源列表
GET    /api/data-sources/:id                           # 数据源详情
PATCH  /api/data-sources/:id                           # 更新数据源
DELETE /api/data-sources/:id                           # 删除数据源
```

#### 创建数据源

```typescript
// POST /api/data-sources
// Request
{
  name: "小红书舆情监控",
  type: "web_crawler",                         // web_crawler | rss_feed | api_integration | file_watch
  category: "external",                        // internal | external (与 Evidence.sourceCategory 对应)
  config: {
    platform: "xiaohongshu",
    keywords: ["品牌名", "产品名"],
    crawlDepth: 2,
    maxResults: 100,
    proxyPool: "pool-01"
  },
  syncFrequency: "0 2 * * *",                 // cron 表达式: 每天凌晨 2 点
  defaultSourceType: "social",                 // 采集的证据默认 sourceType
  enabled: true
}

// Response
{
  success: true,
  data: {
    id: "ds-001",
    tenantId: "t-001",
    name: "小红书舆情监控",
    type: "web_crawler",
    category: "external",
    config: { ... },
    syncFrequency: "0 2 * * *",
    defaultSourceType: "social",
    status: "active",                          // active | inactive | error
    enabled: true,
    lastSyncAt: null,
    nextSyncAt: "2026-03-26T02:00:00Z",
    createdAt: "2026-03-25T18:00:00Z",
    updatedAt: "2026-03-25T18:00:00Z"
  }
}
```

### 12.2 同步管理

```
POST   /api/data-sources/:id/sync                     # 手动触发同步
GET    /api/data-sources/:id/jobs                     # 导入任务列表
GET    /api/data-sources/:id/jobs/:jobId              # 导入任务详情
POST   /api/data-sources/:id/test                     # 测试数据源连接
```

#### 手动触发同步

```typescript
// POST /api/data-sources/:id/sync
// Request (可选)
{
  fullSync?: false                             // 是否全量同步，默认增量
}

// Response
{
  success: true,
  data: {
    jobId: "job-001",
    dataSourceId: "ds-001",
    status: "pending",                         // pending | running | completed | failed
    type: "incremental",                       // incremental | full
    totalRecords: 0,
    processedRecords: 0,
    failedRecords: 0,
    createdAt: "2026-03-25T18:30:00Z"
  }
}
```

#### 查看导入任务

```typescript
// GET /api/data-sources/:id/jobs?status=completed
// Response (PaginatedResponse)
{
  success: true,
  data: [
    {
      jobId: "job-001",
      dataSourceId: "ds-001",
      status: "completed",
      type: "incremental",
      totalRecords: 50,
      processedRecords: 48,
      failedRecords: 2,
      newEvidenceCount: 12,                    // 新增的证据数
      duplicateCount: 36,                      // 去重跳过的数量
      errorLog: "2 条记录内容为空被跳过",
      startedAt: "2026-03-26T02:00:00Z",
      completedAt: "2026-03-26T02:03:25Z",
      createdAt: "2026-03-26T02:00:00Z"
    }
  ],
  pagination: { ... }
}
```

#### 测试数据源连接

```typescript
// POST /api/data-sources/:id/test
// Response
{
  success: true,
  data: {
    reachable: true,
    latencyMs: 350,
    sampleData: ["样本数据 1", "样本数据 2"],
    message: "连接成功，可获取数据"
  }
}
```

### 12.3 导入任务管理

```
GET    /api/import-jobs                                # 导入任务列表（跨数据源）
GET    /api/import-jobs/:id                            # 导入任务详情
POST   /api/import-jobs/:id/cancel                     # 取消导入任务
GET    /api/import-jobs/:id/logs                       # 导入任务日志
POST   /api/import-jobs/manual                         # 手动创建导入任务（文件上传）
```

#### 导入任务列表

```typescript
// GET /api/import-jobs?status=running&page=1&pageSize=20
// Query 参数:
//   status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
//   dataSourceId?: string
//   page?: number
//   pageSize?: number

// Response (PaginatedResponse)
{
  success: true,
  data: [
    {
      id: "job-001",
      dataSourceId: "ds-001",
      dataSourceName: "小红书舆情监控",
      status: "completed",
      type: "incremental",
      totalRecords: 50,
      processedRecords: 48,
      failedRecords: 2,
      newEvidenceCount: 12,
      duplicateCount: 36,
      startedAt: "2026-03-26T02:00:00Z",
      completedAt: "2026-03-26T02:03:25Z",
      createdAt: "2026-03-26T02:00:00Z"
    }
  ],
  pagination: { ... }
}
```

#### 导入任务详情

```typescript
// GET /api/import-jobs/:id
// Response
{
  success: true,
  data: {
    id: "job-001",
    dataSourceId: "ds-001",
    dataSourceName: "小红书舆情监控",
    status: "completed",
    type: "incremental",
    totalRecords: 50,
    processedRecords: 48,
    failedRecords: 2,
    newEvidenceCount: 12,
    duplicateCount: 36,
    errorLog: "2 条记录内容为空被跳过",
    createdEvidenceIds: ["e-020", "e-021", "e-022"],  // 新创建的证据 ID
    startedAt: "2026-03-26T02:00:00Z",
    completedAt: "2026-03-26T02:03:25Z",
    createdAt: "2026-03-26T02:00:00Z",
    updatedAt: "2026-03-26T02:03:25Z"
  }
}
```

#### 取消导入任务

```typescript
// POST /api/import-jobs/:id/cancel
// Response
{
  success: true,
  data: {
    id: "job-001",
    status: "cancelled",
    processedRecords: 25,                      // 取消前已处理的记录数
    totalRecords: 50,
    cancelledAt: "2026-03-26T02:01:30Z",
    updatedAt: "2026-03-26T02:01:30Z"
  }
}

// 错误场景：任务已完成
// Response (400)
{
  success: false,
  error: {
    code: "IMPORT_JOB_NOT_CANCELLABLE",
    message: "导入任务已完成，无法取消"
  }
}
```

#### 导入任务日志

```typescript
// GET /api/import-jobs/:id/logs?level=error&page=1&pageSize=50
// Query 参数:
//   level?: 'info' | 'warn' | 'error'
//   page?: number
//   pageSize?: number

// Response (PaginatedResponse)
{
  success: true,
  data: [
    {
      timestamp: "2026-03-26T02:00:01Z",
      level: "info",
      message: "开始增量同步，上次同步时间：2026-03-25T02:00:00Z"
    },
    {
      timestamp: "2026-03-26T02:01:15Z",
      level: "warn",
      message: "第 23 条记录内容为空，已跳过"
    },
    {
      timestamp: "2026-03-26T02:03:25Z",
      level: "info",
      message: "同步完成，共处理 50 条，成功 48 条，失败 2 条，新增证据 12 条"
    }
  ],
  pagination: { ... }
}
```

#### 手动创建导入任务（文件上传）

```typescript
// POST /api/import-jobs/manual
// Content-Type: multipart/form-data
// Request
{
  file: File,                                  // 上传的文件（CSV / JSON / Excel）
  sourceCategory: "internal",                  // 'internal' | 'external'
  sourceType: "survey",                        // survey | interview | internal_data | historical | social | competitor | report | news | manual
  sourceLabel?: "2024Q4用户满意度调研",
  format?: "csv"                               // csv | json | excel，可选，不传则自动检测
}

// Response
{
  success: true,
  data: {
    id: "job-010",
    dataSourceId: null,                        // 手动上传无关联数据源
    status: "running",
    type: "manual",
    fileName: "2024Q4_survey_results.csv",
    fileSize: 102400,
    sourceCategory: "internal",
    sourceType: "survey",
    sourceLabel: "2024Q4用户满意度调研",
    totalRecords: 120,
    processedRecords: 0,
    estimatedTime: "15s",
    createdAt: "2026-03-26T14:00:00Z"
  }
}
```

---

## 十三、仪表盘 API (M11)

```
GET    /api/dashboard                                  # 仪表盘数据
```

```typescript
// GET /api/dashboard
// Response
{
  success: true,
  data: {
    stats: {
      activeIssues: 5,
      pendingDecisionCards: 3,
      overdueActions: 2,
      completedActions: 10,
      totalActions: 15,
      newSignals: 4,
      totalEvidence: 120,
      totalInsights: 35,
      activeDataSources: 3
    },
    focusDecisions: [
      {
        id: "dc-001",
        issueTitle: "Q3 NPS 下降分析",
        confidenceScore: 75,
        recommendationSummary: "建议渐进式降价 5-8%",
        status: "pending_review",
        createdAt: "..."
      }
    ],
    recentEvidence: [
      {
        id: "e-020",
        sourceCategory: "external",
        sourceType: "social",
        summary: "...",
        createdAt: "..."
      }
    ],
    recentInsights: [
      {
        id: "ins-010",
        title: "用户流失率与价格敏感度正相关",
        confidence: 78,
        status: "confirmed",
        createdAt: "..."
      }
    ],
    activeSignals: [
      {
        id: "sig-001",
        type: "risk",
        severity: "high",
        title: "竞品 X 降价公告",
        detectedAt: "..."
      }
    ],
    actionProgress: {
      completed: 10,
      inProgress: 3,
      pending: 2,
      total: 15,
      percent: 67
    },
    dataSourceStatus: [
      {
        id: "ds-001",
        name: "小红书舆情监控",
        status: "active",
        lastSyncAt: "2026-03-26T02:00:00Z",
        newEvidenceToday: 5
      }
    ]
  }
}
```

---

## 十四、错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|------------|------|
| VALIDATION_ERROR | 400 | 参数验证失败 |
| INVALID_STATUS_TRANSITION | 400 | 无效的状态流转 |
| INVALID_STANCE | 400 | 无效的立场值 |
| DUPLICATE_LINK | 400 | 证据已关联到该议题 |
| MERGE_CONFLICT | 400 | 洞察合并冲突（跨议题不能合并） |
| EVIDENCE_INSUFFICIENT | 400 | 证据不足，无法生成洞察 |
| SIGNAL_ALREADY_LINKED | 400 | 信号已关联到议题 |
| IMPORT_JOB_NOT_CANCELLABLE | 400 | 导入任务已完成，无法取消 |
| UNAUTHORIZED | 401 | 未授权（Token 无效或过期） |
| FORBIDDEN | 403 | 无权限 |
| ISSUE_NOT_FOUND | 404 | 议题不存在 |
| EVIDENCE_NOT_FOUND | 404 | 证据不存在 |
| INSIGHT_NOT_FOUND | 404 | 洞察不存在 |
| DECISION_CARD_NOT_FOUND | 404 | 决策卡不存在 |
| ACTION_NOT_FOUND | 404 | 行动项不存在 |
| SIGNAL_NOT_FOUND | 404 | 信号不存在 |
| REVIEW_NOT_FOUND | 404 | 回看记录不存在 |
| IMPORT_JOB_NOT_FOUND | 404 | 导入任务不存在 |
| DATA_SOURCE_NOT_FOUND | 404 | 数据源不存在 |
| REASONING_FAILED | 500 | 推理失败 |
| LLM_ERROR | 502 | AI 服务错误 |
| LLM_TIMEOUT | 504 | AI 服务超时 |
| CRAWLER_ERROR | 502 | 爬虫执行错误 |
| IMPORT_FAILED | 500 | 数据导入失败 |

---

## 十五、通用查询参数

### 分页

所有列表接口支持以下分页参数：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `page` | number | 1 | 页码 |
| `pageSize` | number | 20 | 每页条数（最大 100） |
| `sortBy` | string | `createdAt` | 排序字段 |
| `sortOrder` | string | `desc` | 排序方向：`asc` / `desc` |

### 筛选

各接口支持的筛选参数见具体端点文档。通用模式：
- 字符串字段：精确匹配，如 `?status=draft`
- 日期字段：范围查询，如 `?createdAfter=2026-01-01&createdBefore=2026-03-31`
- 数组字段：逗号分隔多值，如 `?tags=价格,品牌`

### 包含关联数据

部分详情接口支持 `include` 参数控制返回的关联数据：

```
GET /api/issues/:id?include=evidence,insights,decisionCards
```

---

## 十六、与 v3.0 差异汇总

| 方面 | v3.0 | v3.1 |
|------|------|------|
| **公网搜索 API** | 有 `POST /api/issues/:id/search` 等接口 | ❌ 移除，改为数据源定期爬虫 |
| **数据源管理 API** | 无 | 🆕 新增 `/api/data-sources` 系列接口 |
| **洞察管理 API** | 无 | 🆕 新增 `/api/insights` 系列接口 |
| **证据 sourceCategory** | `internal` / `external` / `search` | 仅 `internal` / `external` |
| **证据 sourceType** | 无 `manual` 类型 | 新增 `manual` 类型 |
| **议题字段** | 含 `triggerSearch`、`searchTriggered`、`searchedAt` | 移除搜索相关字段 |
| **推理输入** | 含 `searchEvidenceCount` | 移除，只统计内部/外部证据 |
| **IssueEvidence** | 无版本追踪 | 新增 `stanceVersion`、`stanceAnalyzedAt` |
| **立场重分析** | 无 | 🆕 新增 `re-analyze-stance` 接口 |
| **立场历史** | 无 | 🆕 新增 `stance-history` 接口 |
| **推理 SSE** | 无 | 🆕 新增流式输出推理过程 |
| **推理状态** | 仅 `running` / `completed` / `failed` | 细化为 9 种状态 |
| **仪表盘** | 基础统计 | 增加数据源状态、洞察统计 |
| **错误码** | `SEARCH_FAILED` 等 | 移除搜索相关，新增洞察、数据源、爬虫相关错误码 |

---

*文档版本：v3.1*
*创建日期：2026-03-25*
*变更说明：移除公网搜索 API（外部数据改为定期爬虫入库），新增数据源管理 API、洞察管理 API，补充 IssueEvidence 版本追踪、推理 SSE 流式输出，完善错误码和通用查询参数*
