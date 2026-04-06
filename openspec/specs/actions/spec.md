# M7 行动管理 (Action) — 基线规格

> 最后更新: 2026-04-05

## 状态: 未实现

行动项（Action）是决策卡采纳后的执行落地单元。每个行动项关联到一个已采纳的决策卡和议题，支持分配责任人、设置截止日期、追踪执行进度。AI 可基于决策卡的 `suggestedActions` 自动生成行动项。支持子任务树形结构。

当前状态：类型定义 (`shared/src/types/action.ts`)、数据库表结构 (`actions` / `action_items`) 已完成。前端有 stub 列表页，后端无业务逻辑。

---

## 模块定位

```
DecisionCard(M6) ──(adopted)──▶ Action(M7) ──(完成后)──▶ Review(M8)
                                    │
                                    ├── 手动创建
                                    ├── AI 自动生成
                                    └── 子任务 (parentActionId)
```

- **上游**：决策管理 (M6) — 从已采纳的决策卡派生行动项
- **下游**：回看闭环 (M8) — 行动完成后创建回看记录评估效果
- **仪表盘**：Dashboard (M11) 展示行动进度和逾期统计

---

## 需求规格

### 核心能力

| # | 功能 | 说明 | 状态 |
|---|------|------|------|
| F1 | 行动项 CRUD | 创建/查看/编辑/删除行动项 | ❌ 未实现 |
| F2 | 行动项列表 | 按 `status`, `priority`, `assigneeId` 筛选 + 分页 | ❌ 未实现 |
| F3 | 状态流转 | 5 种状态之间的流转 | ❌ 未实现 |
| F4 | AI 生成行动项 | 基于决策卡的 `suggestedActions` 自动生成 | ❌ 未实现 |
| F5 | 责任人分配 | 指定 `assigneeId` + `assigneeName` | ❌ 未实现 |
| F6 | 截止日期管理 | 设置 `dueAt`，逾期自动标记 `overdue` | ❌ 未实现 |
| F7 | 子任务 | 通过 `parentActionId` 支持层级任务 | ❌ 未实现 |
| F8 | 完成备注 | 完成时记录 `completionNote` | ❌ 未实现 |

### 业务规则

1. 行动项必须关联 `issueId` 和 `decisionCardId`
2. AI 生成行动项时 `createdBy` 设为 `system`，`status` 初始化为 `pending`
3. 手动创建行动项时 `status` 初始化为 `pending`
4. 逾期检测：当 `dueAt` 已过且 `status` 仍为 `pending` 或 `in_progress` 时，自动标记为 `overdue`
5. 完成行动项时自动记录 `completedAt` 时间戳
6. 子任务的 `issueId` 和 `decisionCardId` 继承自父任务
7. 取消父任务时，子任务也应同步取消

---

## 数据模型

### `actions` 表

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string (UUID) | 主键 |
| `tenant_id` | string | 租户 ID |
| `issue_id` | string | 所属议题 ID (FK → issues) |
| `decision_card_id` | string | 关联决策卡 ID (FK → decision_cards) |
| `parent_action_id` | string? | 父任务 ID（支持子任务树） |
| `title` | string | 行动项标题 |
| `description` | string | 行动项描述 |
| `status` | enum | 状态 (5 种) |
| `priority` | enum | 优先级 (4 种) |
| `assignee_id` | string? | 责任人 ID |
| `assignee_name` | string? | 责任人姓名 |
| `due_at` | datetime? | 截止时间 |
| `completed_at` | datetime? | 完成时间 |
| `completion_note` | string? | 完成备注 |
| `created_by` | string | 创建者 ID |
| `created_at` | datetime | 创建时间 |
| `updated_at` | datetime | 更新时间 |

### TypeScript 类型定义

```typescript
// shared/src/types/action.ts
export type ActionStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue'
export type ActionPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Action {
  id: string
  tenantId: string
  issueId: string
  decisionCardId: string
  parentActionId?: string
  title: string
  description: string
  status: ActionStatus
  priority: ActionPriority
  assigneeId?: string
  assigneeName?: string
  dueAt?: string
  completedAt?: string
  completionNote?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}
```

---

## 状态机

```
  pending ──▶ in_progress ──┬──▶ completed
     │             │         │
     │             │         └──▶ cancelled
     │             │
     └─────────────┴──▶ overdue (自动/定时检测)
     │
     └──▶ cancelled
```

| 转换 | 说明 |
|------|------|
| `pending` → `in_progress` | 开始执行 |
| `pending` → `cancelled` | 取消行动 |
| `pending` → `overdue` | 截止日期已过（自动） |
| `in_progress` → `completed` | 执行完成 |
| `in_progress` → `cancelled` | 取消行动 |
| `in_progress` → `overdue` | 截止日期已过（自动） |
| `overdue` → `in_progress` | 重新激活 |
| `overdue` → `completed` | 逾期完成 |
| `overdue` → `cancelled` | 取消 |

---

## API 接口 (规划)

### 行动项 CRUD

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| `POST` | `/api/actions` | 创建行动项 | analyst+ |
| `GET` | `/api/actions` | 行动项列表（跨议题） | viewer+ |
| `GET` | `/api/actions/:id` | 行动项详情 | viewer+ |
| `PATCH` | `/api/actions/:id` | 更新行动项 | analyst+ |
| `DELETE` | `/api/actions/:id` | 删除行动项 | analyst+ |

### 议题维度

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| `GET` | `/api/issues/:id/actions` | 获取议题下所有行动项 | viewer+ |

### AI 生成

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| `POST` | `/api/decision-cards/:id/generate-actions` | AI 从决策卡生成行动项 | analyst+ |

### 查询参数

列表接口 `GET /api/actions` 支持：
- `status`: `pending` / `in_progress` / `completed` / `cancelled` / `overdue`
- `priority`: `low` / `medium` / `high` / `urgent`
- `assigneeId`: 责任人筛选
- `issueId`: 议题筛选
- `decisionCardId`: 决策卡筛选
- `page`, `pageSize`, `sortBy`, `sortOrder`

---

## 前端 (规划)

### 当前状态

- `ActionListPage` — stub 列表页，使用 `any[]` 类型

### 规划组件

| 组件 | 说明 | 状态 |
|------|------|------|
| `ActionListPage` | 行动项列表页（含筛选、搜索、优先级标记） | ❌ 仅 stub |
| `ActionCard` | 行动项卡片（显示状态、优先级、责任人、截止日期） | ❌ 未实现 |
| `ActionDetailPanel` | 行动项详情面板 | ❌ 未实现 |
| `ActionCreateDialog` | 创建行动项对话框 | ❌ 未实现 |
| `ActionGenerateButton` | AI 生成行动项按钮 | ❌ 未实现 |
| `ActionSubtaskList` | 子任务列表 | ❌ 未实现 |
| `ActionProgressBar` | 行动进度条（completed / total） | ❌ 未实现 |

---

## 相关文件

| 文件 | 说明 |
|------|------|
| `shared/src/types/action.ts` | TypeScript 类型定义 |
| `shared/src/validators/entities.ts` | Zod 校验 schema（待补充） |
| `database/src/migrations/001_initial.ts` | `actions` / `action_items` 建表 |
| `docs/03-API设计文档.md` § 九 | API 详细设计 |
| `docs/01-功能模块拆解.md` § M7 | 模块功能点定义 |
| `frontend/src/features/actions/` | 前端模块目录（仅 stub） |
