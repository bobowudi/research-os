# M9 信号检测 (Signal) — 基线规格

> 最后更新: 2026-04-05

## 状态: 未实现

信号（Signal）是系统从证据库中自动检测出的异常模式和趋势。信号可以是风险预警、市场机会、行业趋势或数据异常。检测到的信号可关联到已有议题，也可基于信号创建新议题，还可直接转化为洞察参与推理。信号检测是系统主动发现问题的能力，与用户被动创建议题形成互补。

当前状态：类型定义 (`shared/src/types/signal.ts`)、数据库表结构 (`signals`) 已完成。前端有 stub 列表页，后端无业务逻辑。

---

## 模块定位

```
Evidence(M2) ──(AI 扫描)──▶ Signal(M9) ──┬──▶ link-issue ──▶ Issue(M1)
    ▲                                      │
    │                                      ├──▶ create-issue ──▶ Issue(M1)
DataSource(M10) ──(导入)──┘                │
                                           └──▶ to-insight ──▶ Insight(M4)
```

- **上游**：证据管理 (M2) + 数据源管理 (M10) 提供检测对象
- **下游**：
  - 议题管理 (M1) — 关联到已有议题或创建新议题
  - 洞察管理 (M4) — 转化为洞察参与推理
- **仪表盘**：Dashboard (M11) 展示活跃信号

---

## 需求规格

### 核心能力

| # | 功能 | 说明 | 状态 |
|---|------|------|------|
| F1 | 信号列表 | 按 `status`, `type`, `severity` 筛选 + 分页 | ❌ 未实现 |
| F2 | 信号详情 | 查看信号详情（含关联证据） | ❌ 未实现 |
| F3 | 信号确认 | 将 `detected` 状态信号标记为 `acknowledged` | ❌ 未实现 |
| F4 | 信号调查 | 将信号标记为 `investigating` | ❌ 未实现 |
| F5 | 信号解决 | 将信号标记为 `resolved` | ❌ 未实现 |
| F6 | 信号忽略 | 将信号标记为 `dismissed` | ❌ 未实现 |
| F7 | 关联议题 | 将信号关联到已有议题 | ❌ 未实现 |
| F8 | 创建议题 | 基于信号自动创建新议题 | ❌ 未实现 |
| F9 | 转化为洞察 | 将信号转化为指定议题下的洞察 | ❌ 未实现 |
| F10 | 手动触发检测 | 手动触发 AI 信号检测扫描 | ❌ 未实现 |
| F11 | 自动检测 | 定时扫描证据库检测新信号（需 BullMQ 调度） | ❌ 未实现 |

### 业务规则

1. 信号由 AI 自动检测产生，初始状态为 `detected`
2. `evidenceIds` 记录触发该信号的证据 ID 列表
3. `relatedIssueIds` 记录关联的议题 ID 列表
4. 信号转化为洞察时：
   - 洞察 `source` 设为 `ai_signal`
   - 洞察 `type` 映射自信号 `type`（risk→risk, opportunity→opportunity, trend→finding, anomaly→finding）
   - 洞察继承信号的 `evidenceIds`
   - 信号状态自动变为 `resolved`
5. 基于信号创建议题时，信号自动关联到新议题并标记为 `acknowledged`
6. 手动触发检测可限定检测范围（`sourceCategories`, `sourceTypes`, `timeRange`）

---

## 数据模型

### `signals` 表

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string (UUID) | 主键 |
| `tenant_id` | string | 租户 ID |
| `type` | enum | 信号类型: `risk` / `opportunity` / `trend` / `anomaly` |
| `severity` | enum | 严重度: `low` / `medium` / `high` / `critical` |
| `status` | enum | 状态 (5 种) |
| `title` | string | 信号标题 |
| `description` | string | 信号描述 |
| `evidence_ids` | JSON | 关联证据 ID 列表 `string[]` |
| `related_issue_ids` | JSON | 关联议题 ID 列表 `string[]` |
| `generated_insight_id` | string? | 转化的洞察 ID |
| `detected_at` | datetime | 检测时间 |
| `acknowledged_by` | string? | 确认者 ID |
| `acknowledged_at` | datetime? | 确认时间 |
| `created_at` | datetime | 创建时间 |
| `updated_at` | datetime | 更新时间 |

### TypeScript 类型定义

```typescript
// shared/src/types/signal.ts
export type SignalType = 'risk' | 'opportunity' | 'trend' | 'anomaly'
export type SignalSeverity = 'low' | 'medium' | 'high' | 'critical'
export type SignalStatus = 'detected' | 'acknowledged' | 'investigating' | 'resolved' | 'dismissed'

export interface Signal {
  id: string
  tenantId: string
  type: SignalType
  severity: SignalSeverity
  status: SignalStatus
  title: string
  description: string
  evidenceIds: string[]
  relatedIssueIds: string[]
  generatedInsightId?: string
  detectedAt: string
  acknowledgedBy?: string
  acknowledgedAt?: string
  createdAt: string
  updatedAt: string
}
```

---

## 状态机

```
  detected ──▶ acknowledged ──▶ investigating ──┬──▶ resolved
      │              │                │          │
      │              │                │          └──▶ dismissed
      │              │                │
      └──▶ dismissed └──▶ dismissed   └──▶ dismissed
```

| 转换 | 说明 |
|------|------|
| `detected` → `acknowledged` | 用户确认已知晓信号 |
| `detected` → `dismissed` | 用户忽略信号（误报等） |
| `acknowledged` → `investigating` | 开始调查信号 |
| `acknowledged` → `dismissed` | 确认后仍决定忽略 |
| `investigating` → `resolved` | 调查完成、已处理 |
| `investigating` → `dismissed` | 调查后判定为误报 |

> 注意：关联议题 (`link-issue`) 或转化为洞察 (`to-insight`) 会自动推进状态。

---

## API 接口 (规划)

### 信号查询

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| `GET` | `/api/signals` | 信号列表 | viewer+ |
| `GET` | `/api/signals/:id` | 信号详情 | viewer+ |
| `PATCH` | `/api/signals/:id` | 更新信号状态 | analyst+ |

### 状态操作

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| `POST` | `/api/signals/:id/acknowledge` | 确认信号 | analyst+ |
| `POST` | `/api/signals/:id/resolve` | 解决信号 | analyst+ |
| `POST` | `/api/signals/:id/dismiss` | 忽略信号 | analyst+ |

### 关联操作

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| `POST` | `/api/signals/:id/link-issue` | 关联到已有议题（需 `issueId`） | analyst+ |
| `POST` | `/api/signals/:id/create-issue` | 基于信号创建新议题 | analyst+ |
| `POST` | `/api/signals/:id/to-insight` | 将信号转化为洞察（需 `issueId`） | analyst+ |

### AI 检测

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| `POST` | `/api/signals/detect` | 手动触发信号检测 | analyst+ |

### 查询参数

列表接口 `GET /api/signals` 支持：
- `status`: `detected` / `acknowledged` / `investigating` / `resolved` / `dismissed`
- `type`: `risk` / `opportunity` / `trend` / `anomaly`
- `severity`: `low` / `medium` / `high` / `critical`
- `page`, `pageSize`, `sortBy`, `sortOrder`

---

## 前端 (规划)

### 当前状态

- `SignalListPage` — stub 列表页，使用 `any[]` 类型

### 规划组件

| 组件 | 说明 | 状态 |
|------|------|------|
| `SignalListPage` | 信号列表页（含筛选、严重度标记） | ❌ 仅 stub |
| `SignalCard` | 信号卡片（显示类型、严重度、状态） | ❌ 未实现 |
| `SignalDetailPanel` | 信号详情面板（含关联证据和议题） | ❌ 未实现 |
| `SignalSeverityBadge` | 严重度标识组件（4 色） | ❌ 未实现 |
| `SignalTypeBadge` | 类型标识组件 | ❌ 未实现 |
| `SignalActionDropdown` | 信号操作下拉（确认/忽略/关联/转洞察） | ❌ 未实现 |
| `SignalLinkIssueDialog` | 关联议题对话框 | ❌ 未实现 |
| `SignalCreateIssueDialog` | 基于信号创建议题对话框 | ❌ 未实现 |
| `SignalDetectButton` | 手动触发检测按钮 | ❌ 未实现 |

---

## 相关文件

| 文件 | 说明 |
|------|------|
| `shared/src/types/signal.ts` | TypeScript 类型定义 |
| `shared/src/validators/entities.ts` | Zod 校验 schema（待补充） |
| `database/src/migrations/001_initial.ts` | `signals` 建表 |
| `docs/03-API设计文档.md` § 十一 | API 详细设计 |
| `docs/01-功能模块拆解.md` § M9 | 模块功能点定义 |
| `frontend/src/features/signals/` | 前端模块目录（仅 stub） |
