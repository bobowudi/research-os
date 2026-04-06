# M8 回看闭环 (Review) — 基线规格

> 最后更新: 2026-04-05

## 状态: 未实现

回看（Review）是 ResearchOS 闭环学习机制的关键模块。在行动项执行完成后，用户记录实际结果、与预期的偏差以及经验教训。核心创新在于 `generatedEvidenceId` —— 回看结论可自动沉淀为新证据，反哺证据库，形成「证据 → 推理 → 决策 → 行动 → 回看 → 新证据」的闭环。

当前状态：类型定义 (`shared/src/types/review.ts`)、数据库表结构 (`reviews`) 已完成。前端有 stub 列表页，后端无业务逻辑。

---

## 模块定位

```
Action(M7) ──(完成后)──▶ Review(M8) ──(沉淀)──▶ Evidence(M2)
                              │                       │
                              │                       ▼
                              │                 可参与下一轮推理
                              │
                              └── AI 生成回顾总结
```

- **上游**：行动管理 (M7) — 行动完成后创建回看记录
- **下游（闭环）**：证据管理 (M2) — 回看结论沉淀为新的内部证据 (`sourceType: historical`)
- **关联**：议题 (M1) + 决策卡 (M6) — 回看关联到具体议题和决策卡

**闭环数据流**：
```
Evidence → IssueEvidence → Insight → Reasoning → DecisionCard → Action → Review
    ▲                                                                        │
    └────────────────── generate-evidence ────────────────────────────────────┘
```

---

## 需求规格

### 核心能力

| # | 功能 | 说明 | 状态 |
|---|------|------|------|
| F1 | 创建回看 | 对已完成的行动项创建回看记录 | ❌ 未实现 |
| F2 | 回看列表 | 按 `outcome`, `issueId`, `tags` 筛选 + 分页 | ❌ 未实现 |
| F3 | 回看详情 | 查看回看完整信息（含关联行动项） | ❌ 未实现 |
| F4 | 更新回看 | 修改回看记录内容 | ❌ 未实现 |
| F5 | 经验沉淀 | 将回看结论转化为新证据（核心闭环功能） | ❌ 未实现 |
| F6 | AI 回顾总结 | AI 生成议题维度的回顾总结报告 | ❌ 未实现 |

### 业务规则

1. 回看必须关联 `issueId` 和 `decisionCardId`，`actionId` 可选
2. `outcome` 有 4 种结果，反映行动效果评估
3. 必须填写 `actualResult`（实际结果）和 `expectedResult`（预期结果）
4. `deviation` 描述实际与预期的偏差
5. `lessonsLearned` 记录经验教训
6. **经验沉淀**（`generate-evidence`）生成的证据：
   - `sourceCategory` 设为 `internal`
   - `sourceType` 设为 `historical`
   - `confidence` 设为 90（来自实际执行结果，置信度高）
   - `sourceRef` 格式为 `review-{reviewId}`
7. `tags` 支持自由标签，便于跨议题检索类似经验

---

## 数据模型

### `reviews` 表

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string (UUID) | 主键 |
| `tenant_id` | string | 租户 ID |
| `issue_id` | string | 关联议题 ID (FK → issues) |
| `decision_card_id` | string | 关联决策卡 ID (FK → decision_cards) |
| `action_id` | string? | 关联行动项 ID (FK → actions) |
| `outcome` | enum | 回看结果 (4 种) |
| `actual_result` | string | 实际结果 |
| `expected_result` | string | 预期结果 |
| `deviation` | string | 偏差描述 |
| `lessons_learned` | string | 经验教训 |
| `tags` | JSON | 标签数组 `string[]` |
| `generated_evidence_id` | string? | 沉淀的证据 ID（闭环关键字段） |
| `reviewed_by` | string | 回看人 ID |
| `reviewed_at` | datetime | 回看时间 |
| `created_at` | datetime | 创建时间 |
| `updated_at` | datetime | 更新时间 |

### TypeScript 类型定义

```typescript
// shared/src/types/review.ts
export type ReviewOutcome = 'successful' | 'partially_successful' | 'unsuccessful' | 'inconclusive'

export interface Review {
  id: string
  tenantId: string
  issueId: string
  decisionCardId: string
  actionId?: string
  outcome: ReviewOutcome
  actualResult: string
  expectedResult: string
  deviation: string
  lessonsLearned: string
  tags: string[]
  generatedEvidenceId?: string
  reviewedBy: string
  reviewedAt: string
  createdAt: string
  updatedAt: string
}
```

---

## 回看结果分类

| 结果 | 英文 | 含义 |
|------|------|------|
| 成功 | `successful` | 实际结果达到或超过预期 |
| 部分成功 | `partially_successful` | 实际结果部分达到预期 |
| 不成功 | `unsuccessful` | 实际结果未达到预期 |
| 不确定 | `inconclusive` | 无法判断效果（数据不足等） |

---

## API 接口 (规划)

### 回看 CRUD

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| `POST` | `/api/actions/:id/review` | 为行动项创建回看记录 | analyst+ |
| `GET` | `/api/reviews` | 回看列表（跨议题） | viewer+ |
| `GET` | `/api/reviews/:id` | 回看详情 | viewer+ |
| `PATCH` | `/api/reviews/:id` | 更新回看 | analyst+ |

### 议题维度

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| `GET` | `/api/issues/:id/reviews` | 获取议题下所有回看 | viewer+ |

### 闭环与 AI 总结

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| `POST` | `/api/reviews/:id/generate-evidence` | 将经验沉淀为新证据（闭环关键） | analyst+ |
| `POST` | `/api/issues/:id/review-summary` | AI 生成议题回顾总结 | analyst+ |

### 查询参数

列表接口 `GET /api/reviews` 支持：
- `outcome`: `successful` / `partially_successful` / `unsuccessful` / `inconclusive`
- `issueId`: 议题筛选
- `tags`: 标签筛选（逗号分隔）
- `page`, `pageSize`, `sortBy`, `sortOrder`

---

## 前端 (规划)

### 当前状态

- `ReviewListPage` — stub 列表页，使用 `any[]` 类型

### 规划组件

| 组件 | 说明 | 状态 |
|------|------|------|
| `ReviewListPage` | 回看列表页（含筛选、搜索） | ❌ 仅 stub |
| `ReviewCard` | 回看卡片（显示结果、偏差摘要） | ❌ 未实现 |
| `ReviewDetailPanel` | 回看详情面板（含关联行动项和决策卡） | ❌ 未实现 |
| `ReviewCreateDialog` | 创建回看对话框 | ❌ 未实现 |
| `ReviewGenerateEvidenceButton` | 经验沉淀按钮（核心闭环 UI） | ❌ 未实现 |
| `ReviewSummaryView` | AI 回顾总结展示 | ❌ 未实现 |
| `ReviewOutcomeBadge` | 结果标识组件（4 种颜色标记） | ❌ 未实现 |

---

## 相关文件

| 文件 | 说明 |
|------|------|
| `shared/src/types/review.ts` | TypeScript 类型定义 |
| `shared/src/validators/entities.ts` | Zod 校验 schema（待补充） |
| `database/src/migrations/001_initial.ts` | `reviews` 建表 |
| `docs/03-API设计文档.md` § 十 | API 详细设计 |
| `docs/01-功能模块拆解.md` § M8 | 模块功能点定义 |
| `frontend/src/features/reviews/` | 前端模块目录（仅 stub） |
