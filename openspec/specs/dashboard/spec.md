# M11 仪表盘 (Dashboard) — 基线规格

> 最后更新: 2026-04-05

## 状态: 部分实现

仪表盘（Dashboard）是用户进入系统后的首页，提供全局数据概览和个人工作视图。当前已实现基本的 `DashboardPage` 页面，调用 `GET /api/dashboard` 获取概览数据和个人工作项。未实现独立组件拆分和用户自定义配置。

当前状态：类型定义 (`shared/src/types/dashboard.ts`) 已完成。前端 `DashboardPage` 已实现基本功能（6 个指标卡、紧急决策列表、我的议题、我的行动）。后端 dashboard service 已实现聚合查询。未实现配置化能力。

---

## 模块定位

```
所有业务模块 ──(聚合)──▶ Dashboard(M11)
    │
    ├── Issue(M1)      → activeIssues, ownedIssues
    ├── Decision(M6)   → pendingDecisions, urgentDecisions, pendingReviews
    ├── Action(M7)     → openActions, overdueActions, assignedActions, actionProgress
    ├── Signal(M9)     → activeSignals, recentSignals
    ├── Insight(M4)    → recentInsights
    ├── Evidence(M2)   → evidenceTotal
    └── DataSource(M10)→ dataSourceHealth
```

- **上游**：聚合所有业务模块的统计数据
- **只读**：仪表盘仅查询，不写入业务数据

---

## 需求规格

### 核心能力

| # | 功能 | 说明 | 状态 |
|---|------|------|------|
| F1 | 全局指标卡 | 6 个核心指标（活跃议题、待决策、行动中、逾期、活跃信号、近期洞察） | ✅ 已实现 |
| F2 | 紧急决策列表 | 展示 `pending_review` 状态的决策卡 | ✅ 已实现 |
| F3 | 我的议题 | 当前用户拥有的议题列表 | ✅ 已实现 |
| F4 | 我的行动 | 当前用户被分配的行动项 | ✅ 已实现 |
| F5 | 行动进度 | 行动项完成进度统计 | ✅ 已实现 |
| F6 | 近期信号 | 最新检测到的信号列表 | ✅ 已实现 |
| F7 | 近期洞察 | 最新生成的洞察列表 | ✅ 已实现 |
| F8 | 证据总量 | 证据库总量统计 | ✅ 已实现 |
| F9 | 数据源健康度 | 数据源状态分布（健康/警告/错误） | ✅ 已实现 |
| F10 | 独立组件拆分 | 将 DashboardPage 拆分为独立可复用组件 | ❌ 未实现 |
| F11 | 仪表盘配置 | 用户自定义仪表盘布局和显示模块 | ❌ 未实现 |
| F12 | 待审核决策 | 我需要审核/投票的决策卡 | ✅ 已实现 |

### 已实现细节

`DashboardPage` 当前直接调用 `GET /api/dashboard`，在单个页面组件中渲染所有数据区块：
- 指标卡区域：6 张统计卡片
- 紧急决策列表：最多显示 5 条 `pending_review` 决策卡
- 我的工作：Tab 切换（我的议题 / 我的行动 / 待审核）
- 信号和洞察列表：最新 5 条

### 未实现功能

1. **独立组件拆分**：当前全部逻辑在 `DashboardPage` 中，未拆分为 `StatsGrid`, `UrgentDecisionList`, `MyWorkTabs` 等独立组件
2. **仪表盘配置化**：
   - `GET /api/dashboard/config` — 获取用户仪表盘配置
   - `PATCH /api/dashboard/config` — 更新用户仪表盘配置
   - 配置项包括：显示哪些模块、模块排列顺序、每个模块显示条目数

---

## 数据模型

### TypeScript 类型定义

```typescript
// shared/src/types/dashboard.ts
export interface DashboardData {
  overview: {
    activeIssues: number
    pendingDecisions: number
    openActions: number
    overdueActions: number
    activeSignals: number
    recentInsights: number
    evidenceTotal: number
    dataSourceHealth: {
      healthy: number
      warning: number
      error: number
    }
  }
  urgentDecisions: DecisionCardSummary[]
  recentSignals: SignalSummary[]
  actionProgress: {
    completed: number
    inProgress: number
    pending: number
    overdue: number
  }
  recentInsights: InsightSummary[]
  myWorkItems: {
    ownedIssues: IssueSummary[]
    assignedActions: ActionSummary[]
    pendingReviews: DecisionCardSummary[]
  }
}

export interface DecisionCardSummary {
  id: string
  issueId: string
  recommendation: string
  confidence: number
  status: DecisionCardStatus
  createdAt: string
}

export interface SignalSummary {
  id: string
  type: SignalType
  severity: SignalSeverity
  title: string
  detectedAt: string
}

export interface InsightSummary {
  id: string
  issueId: string
  title: string
  type: InsightType
  status: InsightStatus
  confidence: number
  createdAt: string
}

export interface IssueSummary {
  id: string
  title: string
  status: IssueStatus
  decisionDueAt: string
}

export interface ActionSummary {
  id: string
  title: string
  status: ActionStatus
  priority: ActionPriority
  dueAt?: string
}
```

> 仪表盘无独立数据表，所有数据从其他模块聚合查询。

---

## API 接口

### 已实现

| 方法 | 路径 | 说明 | 状态 |
|------|------|------|------|
| `GET` | `/api/dashboard` | 获取仪表盘数据（overview + myWorkItems） | ✅ 已实现 |

### 规划

| 方法 | 路径 | 说明 | 状态 |
|------|------|------|------|
| `GET` | `/api/dashboard/config` | 获取用户仪表盘配置 | ❌ 未实现 |
| `PATCH` | `/api/dashboard/config` | 更新用户仪表盘配置 | ❌ 未实现 |

### 仪表盘配置结构（规划）

```typescript
interface DashboardConfig {
  modules: Array<{
    id: string                    // 模块标识
    visible: boolean              // 是否显示
    order: number                 // 排列顺序
    maxItems?: number             // 最大显示条目数
  }>
  refreshInterval?: number        // 自动刷新间隔（秒）
}
```

---

## 前端

### 已实现

| 组件/页面 | 说明 | 状态 |
|-----------|------|------|
| `DashboardPage` | 仪表盘主页面（包含所有数据区块） | ✅ 已实现（单体页面） |

### 规划拆分组件

| 组件 | 说明 | 状态 |
|------|------|------|
| `DashboardStatsGrid` | 指标卡网格组件（6 卡片） | ❌ 未拆分 |
| `UrgentDecisionList` | 紧急决策列表组件 | ❌ 未拆分 |
| `MyWorkTabs` | 我的工作 Tab 组件 | ❌ 未拆分 |
| `RecentSignalList` | 近期信号列表组件 | ❌ 未拆分 |
| `RecentInsightList` | 近期洞察列表组件 | ❌ 未拆分 |
| `ActionProgressChart` | 行动进度图表组件 | ❌ 未拆分 |
| `DataSourceHealthIndicator` | 数据源健康度指示器 | ❌ 未拆分 |
| `DashboardConfigPanel` | 仪表盘配置面板 | ❌ 未实现 |

---

## 相关文件

| 文件 | 说明 |
|------|------|
| `shared/src/types/dashboard.ts` | TypeScript 类型定义 |
| `backend/src/modules/dashboard/` | 后端 dashboard service（已实现） |
| `frontend/src/features/dashboard/` | 前端 dashboard 页面（已实现基本功能） |
| `docs/03-API设计文档.md` § 十三 | API 详细设计 |
| `docs/01-功能模块拆解.md` § M11 | 模块功能点定义 |
