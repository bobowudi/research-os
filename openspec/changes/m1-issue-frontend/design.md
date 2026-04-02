## Context

ResearchOS 前端使用 Vue 3 + Vite + TypeScript，采用 feature-based 目录结构。共享包 `@research-os/shared` 提供类型定义和 Zod 校验 schema。已有 Axios HTTP 客户端（`shared/api/client.ts`）支持 JWT 自动刷新、Pinia auth store、Vue Router（路由已定义）、MainLayout 侧边导航。

议题模块需在 `frontend/src/features/issues/` 下从零构建。

## Goals / Non-Goals

**Goals:**
- 实现议题 CRUD 完整前端功能
- 搜索防抖 300ms + 筛选/排序/分页联动
- 复用 shared 包的 Zod schema 做前端校验
- 使用 Composable 模式管理数据（不用 Pinia）
- RBAC 权限控制按钮可见性
- 详情页 Tab 骨架预留后续模块集成点

**Non-Goals:**
- 不实现 Tab 内容（证据/洞察/推理/决策/行动由后续模块完成）
- 不引入第三方 UI 组件库（自建轻量组件）
- 不实现批量操作、导入导出
- 不实现 AI 推理相关功能

## Decisions

### 1. 状态管理：Composable 而非 Pinia Store

议题数据无需跨页面全局共享，使用 Vue 3 Composable 更轻量：
- `useIssues()` — 列表页的完整状态（issues、filters、pagination、loading）
- `useIssueDetail(id)` — 详情页单个议题
- `useIssueForm(initial?)` — 表单校验 + 脏检测 + diff 计算

**理由**: 避免过度设计，Composable 与组件生命周期绑定，自动清理。

### 2. 表单校验：复用 shared 包 Zod Schema

```typescript
import { createIssueSchema } from '@research-os/shared'

function validate(): boolean {
  const result = createIssueSchema.safeParse(form.value)
  if (!result.success) {
    errors.value = flattenZodErrors(result.error)
    return false
  }
  errors.value = {}
  return true
}
```

**理由**: 前后端一致校验规则，避免不同步。

### 3. API 层封装

```typescript
// features/issues/api/issues.ts
export const issueApi = {
  list(params: IssueListParams): Promise<PaginatedResult<Issue>>
  getById(id: string): Promise<{ data: Issue }>
  create(input: CreateIssueInput): Promise<{ data: Issue }>
  update(id: string, input: Partial<UpdateIssueInput>): Promise<{ data: Issue }>
  delete(id: string): Promise<void>
}
```

基于已有的 `apiClient` (Axios instance)，所有请求自动携带 JWT。

### 4. 状态流转交互

基于 shared 包的 `ISSUE_TRANSITIONS` 状态机动态计算可选目标状态：

```typescript
import { ISSUE_TRANSITIONS } from '@research-os/shared'

const availableTransitions = computed(() =>
  ISSUE_TRANSITIONS[currentStatus.value] || []
)
```

流转前弹出确认弹窗，确认后调用 `PATCH /api/issues/:id { status }`。

### 5. 组件 Props/Events 设计

| 组件 | Props | Events |
|------|-------|--------|
| IssueCard | `issue`, `userRole` | `@click`, `@edit`, `@delete`, `@copy-link` |
| IssueCreateModal | `visible` | `@close`, `@created` |
| IssueEditModal | `visible`, `issue` | `@close`, `@updated` |
| IssueDeleteConfirm | `visible`, `issue` | `@close`, `@deleted` |
| IssueStatusDropdown | `currentStatus`, `readonly` | `@change` |
| IssueFilters | `filters` | `@update:search`, `@update:status`, `@update:domain`, `@update:sort` |
| IssueStatusTabs | `activeStatus`, `counts` | `@change` |
| IssueStatCards | `evidenceCount`, `insightCount`, `reasoningCount`, `decisionCardCount` | `@click` |
| IssueDetailTabs | `activeTab`, `issueId` | `@update:activeTab` |

### 6. 常量配置

```typescript
// 状态颜色映射
const STATUS_CONFIG: Record<IssueStatus, { label, color, bgColor, dotColor }>

// 领域选项
const DOMAIN_OPTIONS: { value, label }[]

// 排序选项
const SORT_OPTIONS: { value, label }[]

// 状态流转操作名称
const TRANSITION_LABELS: Record<IssueStatus, Record<string, string>>

// Tab 配置
const DETAIL_TABS: { key, label, icon, countField }[]
```

### 7. 日期处理

使用 dayjs 处理日期格式化和相对时间：

```typescript
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

export function timeAgo(dateStr: string): string { return dayjs(dateStr).fromNow() }
export function formatDate(dateStr: string): string { return dayjs(dateStr).format('YYYY-MM-DD') }
export function daysFromNow(dateStr: string): number { return dayjs(dateStr).diff(dayjs(), 'day') }
```

### 8. CSS 方案

使用 BEM 命名 + CSS 变量，不引入 CSS 框架：

```css
:root {
  --issue-status-draft: #8c8c8c;
  --issue-status-collecting: #1890ff;
  --issue-status-analyzing: #fa8c16;
  --issue-status-pending: #722ed1;
  --issue-status-decided: #52c41a;
  --issue-status-closed: #8c8c8c;
}
```

## Risks / Trade-offs

- **无 UI 组件库**: 需自建 Modal、Select、DatePicker、TagInput 等基础组件 → 初期实现简单版本，后续可替换为成熟组件库
- **搜索性能**: 每次输入触发 API 请求（防抖 300ms） → 初期数据量小可接受
- **详情页 Tab 空壳**: Tab 面板只有骨架和空状态 → 后续模块逐步填充
- **CSS 维护**: 自定义 BEM 样式可能导致冗余 → 后续可引入 TailwindCSS 重构
