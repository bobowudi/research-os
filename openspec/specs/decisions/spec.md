# M6 决策管理 (Decision) — 基线规格

> 最后更新: 2026-04-05

## 状态: 未实现

决策卡（DecisionCard）是对抗推理引擎的最终产出物。每张决策卡包含推荐方案、置信度、关键因素、风险评估、反对意见和建议行动。团队成员可对决策卡投票、评论，最终由决策者采纳或拒绝。支持导出 PDF/Markdown 和分享链接。

当前状态：类型定义 (`shared/src/types/decision.ts`)、数据库表结构 (`decision_cards`, `decision_votes`) 已完成。前端有 stub 列表页和详情页，后端无业务逻辑。

---

## 模块定位

```
Reasoning(M5) ──(生成)──▶ DecisionCard(M6) ──(派生)──▶ Action(M7)
                               │
                               ├── Vote (团队投票)
                               ├── Comment (评论讨论)
                               ├── Export (PDF/Markdown)
                               └── Share (分享链接)
```

- **上游**：对抗推理引擎 (M5) 自动生成决策卡
- **下游**：行动管理 (M7) 从已采纳的决策卡派生行动项
- **关联**：回看闭环 (M8) 通过 `decisionCardId` 评估决策效果

---

## 需求规格

### 核心能力

| # | 功能 | 说明 | 状态 |
|---|------|------|------|
| F1 | 决策卡查看 | 查看决策卡详情（含推荐方案、风险、证据摘要） | ❌ 未实现 |
| F2 | 决策卡列表 | 按议题查看决策卡列表 | ❌ 未实现 |
| F3 | 决策卡编辑 | 编辑决策卡内容（推荐方案、建议行动等） | ❌ 未实现 |
| F4 | 采纳决策 | 将 `pending_review` 状态卡采纳为 `adopted` | ❌ 未实现 |
| F5 | 拒绝决策 | 将 `pending_review` 状态卡拒绝为 `rejected` | ❌ 未实现 |
| F6 | 版本取代 | 新版决策卡将旧版标记为 `superseded` | ❌ 未实现 |
| F7 | 投票 | 团队成员对决策卡投票（approve/reject/abstain） | ❌ 未实现 |
| F8 | 评论 | 对决策卡添加评论和讨论 | ❌ 未实现 |
| F9 | 版本对比 | 对比同议题不同版本决策卡差异 | ❌ 未实现 |
| F10 | 导出 | 导出为 PDF 或 Markdown 格式 | ❌ 未实现 |
| F11 | 分享 | 生成带 token 的分享链接（可设置过期时间） | ❌ 未实现 |

### 业务规则

1. 决策卡由推理引擎 (M5) 自动生成，初始状态为 `draft` 或 `pending_review`
2. 同一议题可有多个版本的决策卡（每次推理生成新版本，`version` 自增）
3. 采纳操作记录 `adoptedBy` + `adoptedAt` + `decisionNote`
4. 拒绝操作记录 `rejectedBy` + `rejectedAt` + `decisionNote`
5. 新版被采纳时，旧的 `adopted` 版本自动转为 `superseded`
6. 分享链接通过 `shareToken` 实现，可设置过期时间 `shareExpiresAt`
7. `confidence` 范围 0-100，由推理引擎 Judge Agent 输出
8. `evidenceSummary` 统计正/反/中立证据数量

### 决策卡内容结构

```
┌─────────────────────────────────────────────┐
│  📋 决策卡 v1                               │
├─────────────────────────────────────────────┤
│  推荐方案: recommendation                    │
│  置信度: confidence (0-100)                  │
│                                              │
│  关键因素:                                   │
│    - keyFactors[0]                           │
│    - keyFactors[1]                           │
│                                              │
│  风险评估:                                   │
│    - risks[0]: description + severity +      │
│      likelihood + evidenceIds                │
│                                              │
│  反对意见: dissent                           │
│                                              │
│  建议行动:                                   │
│    - suggestedActions[0]                     │
│    - suggestedActions[1]                     │
│                                              │
│  证据摘要:                                   │
│    pro: N | con: N | neutral: N | total: N   │
├─────────────────────────────────────────────┤
│  投票: 👍 approve  👎 reject  🤷 abstain    │
└─────────────────────────────────────────────┘
```

---

## 数据模型

### `decision_cards` 表

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string (UUID) | 主键 |
| `tenant_id` | string | 租户 ID |
| `issue_id` | string | 所属议题 ID (FK → issues) |
| `reasoning_run_id` | string | 关联推理运行 ID (FK → reasoning_runs) |
| `version` | number | 版本号 |
| `recommendation` | string | 推荐方案 |
| `confidence` | number | 置信度 (0-100) |
| `key_factors` | JSON | 关键因素 `string[]` |
| `risks` | JSON | 风险列表 `RiskItem[]` |
| `dissent` | string | 反对意见摘要 |
| `suggested_actions` | JSON | 建议行动 `string[]` |
| `evidence_summary` | JSON | 证据摘要 `{ proCount, conCount, neutralCount, totalEvidenceUsed }` |
| `status` | enum | 状态 (5 种) |
| `adopted_by` | string? | 采纳者 ID |
| `adopted_at` | datetime? | 采纳时间 |
| `rejected_by` | string? | 拒绝者 ID |
| `rejected_at` | datetime? | 拒绝时间 |
| `decision_note` | string? | 决策备注 |
| `share_token` | string? | 分享令牌 |
| `share_expires_at` | datetime? | 分享过期时间 |
| `created_at` | datetime | 创建时间 |
| `updated_at` | datetime | 更新时间 |

### `decision_votes` 表

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string (UUID) | 主键 |
| `decision_card_id` | string | 决策卡 ID (FK → decision_cards) |
| `user_id` | string | 投票者 ID |
| `user_name` | string | 投票者姓名 |
| `vote` | enum | 投票: `approve` / `reject` / `abstain` |
| `comment` | string? | 投票评论 |
| `created_at` | datetime | 投票时间 |

### TypeScript 类型定义

```typescript
// shared/src/types/decision.ts
export type DecisionCardStatus = 'draft' | 'pending_review' | 'adopted' | 'rejected' | 'superseded'

export interface RiskItem {
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  likelihood: number
  evidenceIds: string[]
}

export interface DecisionCard {
  id: string
  tenantId: string
  issueId: string
  reasoningRunId: string
  version: number
  recommendation: string
  confidence: number
  keyFactors: string[]
  risks: RiskItem[]
  dissent: string
  suggestedActions: string[]
  evidenceSummary: {
    proCount: number
    conCount: number
    neutralCount: number
    totalEvidenceUsed: number
  }
  status: DecisionCardStatus
  adoptedBy?: string
  adoptedAt?: string
  rejectedBy?: string
  rejectedAt?: string
  decisionNote?: string
  shareToken?: string
  shareExpiresAt?: string
  createdAt: string
  updatedAt: string
}

export interface DecisionVote {
  id: string
  decisionCardId: string
  userId: string
  userName: string
  vote: 'approve' | 'reject' | 'abstain'
  comment?: string
  createdAt: string
}
```

---

## 状态机

```
  draft ──▶ pending_review ──┬──▶ adopted ──▶ superseded
                              │
                              └──▶ rejected
```

| 转换 | 说明 |
|------|------|
| `draft` → `pending_review` | 推理完成，决策卡进入评审 |
| `pending_review` → `adopted` | 决策者采纳 |
| `pending_review` → `rejected` | 决策者拒绝 |
| `adopted` → `superseded` | 新版决策卡被采纳，旧版自动取代 |

---

## API 接口 (规划)

### 决策卡查询

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| `GET` | `/api/issues/:id/decision-cards` | 获取议题下决策卡列表 | viewer+ |
| `GET` | `/api/decision-cards/:id` | 决策卡详情 | viewer+ |
| `PATCH` | `/api/decision-cards/:id` | 更新决策卡 | analyst+ |

### 采纳与拒绝

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| `POST` | `/api/decision-cards/:id/adopt` | 采纳决策（需 `reason`） | analyst+ |
| `POST` | `/api/decision-cards/:id/reject` | 拒绝决策（需 `reason`） | analyst+ |

### 投票与评论

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| `POST` | `/api/decision-cards/:id/vote` | 投票 | analyst+ |
| `GET` | `/api/decision-cards/:id/votes` | 获取投票列表 | viewer+ |
| `POST` | `/api/decision-cards/:id/comments` | 添加评论 | analyst+ |
| `GET` | `/api/decision-cards/:id/comments` | 获取评论列表 | viewer+ |

### 版本对比、导出与分享

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| `GET` | `/api/decision-cards/:id/compare/:otherId` | 版本对比 | viewer+ |
| `POST` | `/api/decision-cards/:id/export` | 导出 PDF/Markdown | viewer+ |
| `POST` | `/api/decision-cards/:id/share` | 生成分享链接 | analyst+ |
| `GET` | `/api/shared/decision-cards/:shareToken` | 公开访问分享的决策卡 | 无需认证 |

---

## 前端 (规划)

### 当前状态

- `DecisionListPage` — stub 列表页
- `DecisionDetailPage` — stub 详情页

### 规划组件

| 组件 | 说明 | 状态 |
|------|------|------|
| `DecisionListPage` | 决策卡列表页 | ❌ 仅 stub |
| `DecisionDetailPage` | 决策卡详情页 | ❌ 仅 stub |
| `DecisionCardView` | 决策卡展示组件（含推荐方案、风险、证据摘要） | ❌ 未实现 |
| `DecisionVotePanel` | 投票面板 | ❌ 未实现 |
| `DecisionCommentList` | 评论列表 | ❌ 未实现 |
| `DecisionCompareView` | 版本对比视图 | ❌ 未实现 |
| `DecisionExportDialog` | 导出对话框（选择格式） | ❌ 未实现 |
| `DecisionShareDialog` | 分享对话框（生成链接、设置过期） | ❌ 未实现 |
| `DecisionAdoptRejectBar` | 采纳/拒绝操作栏 | ❌ 未实现 |

---

## 相关文件

| 文件 | 说明 |
|------|------|
| `shared/src/types/decision.ts` | TypeScript 类型定义 |
| `shared/src/validators/entities.ts` | Zod 校验 schema（待补充） |
| `database/src/migrations/001_initial.ts` | `decision_cards` + `decision_votes` 建表 |
| `docs/03-API设计文档.md` § 八 | API 详细设计 |
| `docs/01-功能模块拆解.md` § M6 | 模块功能点定义 |
| `frontend/src/features/decisions/` | 前端模块目录（仅 stub） |
