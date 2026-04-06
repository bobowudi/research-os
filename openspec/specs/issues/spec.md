# Issue 管理模块 — 基线规格

> 最后更新: 2026-04-05

## 状态: Partial

议题（Issue）是 ResearchOS 的核心研究对象。用户围绕一个议题收集证据、生成洞察、做出决策。本模块提供议题的完整生命周期管理，包括创建、编辑、状态流转、关联证据与洞察。

前端页面与组件已基本完成，后端 CRUD 可用但存在 4 个已知缺陷，RBAC 与共享工具函数尚未实现。

---

## 需求规格

### 核心功能

| # | 功能 | 状态 |
|---|------|------|
| F1 | 议题 CRUD（创建、查看、编辑、删除） | ✅ 已实现 |
| F2 | 议题列表：搜索 + 领域/优先级筛选 + 状态 Tab 切换 | ✅ 前端已实现；后端搜索缺失 |
| F3 | 议题详情：DetailHero + StatCards + Tab 面板 | ✅ 已实现 |
| F4 | 状态机流转（6 状态） | ✅ 已实现 |
| F5 | 删除确认对话框 `IssueDeleteConfirm` | ❌ 未实现 |
| F6 | 独立状态下拉组件 `IssueStatusDropdown` | ❌ 未实现 |
| F7 | RBAC 权限控制（viewer 角色隐藏操作按钮） | ❌ 未实现 |
| F8 | 共享工具函数提取到 `shared/utils/` | ❌ 未实现 |

### 状态机

```
draft → collecting → analyzing → pending_decision → decided → closed
                                                                 │
closed ──(重新激活)──→ collecting                                  │
```

6 个状态，单向流转为主，`closed` 可重新激活回 `collecting`。

状态流转矩阵定义在 `frontend/src/features/issues/constants.ts`。

---

## 数据模型

### `issues` 表

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string (UUID) | 主键 |
| `tenant_id` | string | 租户 ID |
| `title` | string | 议题标题 |
| `description` | string | 议题描述 |
| `domain` | string | 所属领域 |
| `status` | enum | 状态（6 种） |
| `owner_id` | string | 负责人 ID |
| `owner_name` | string | 负责人姓名（⚠️ 后端硬编码空字符串） |
| `tags` | string[] | 标签数组 |
| `decision_due_at` | datetime | 决策截止时间 |
| `evidence_count` | number | 关联证据数 |
| `insight_count` | number | 关联洞察数 |
| `decision_card_count` | number | 关联决策卡片数 |
| `created_at` | datetime | 创建时间 |
| `updated_at` | datetime | 更新时间 |

存储引擎: TiDB，通过 Kysely 构建查询。

### 类型定义

- `IssueDetail` — 议题完整数据（含统计卡片数据）
- `IssueStatCard` — 统计卡片展示结构
- 定义位置: `frontend/src/features/issues/types.ts`, `shared/src/types/issue.ts`
- 校验 Schema: `shared/src/validators/entities.ts` 中的 `createIssueSchema`, `updateIssueSchema`

---

## API 接口

### 已实现

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/issues` | 获取议题列表（⚠️ 缺少搜索 LIKE 查询） |
| `POST` | `/api/issues` | 创建议题 |
| `GET` | `/api/issues/:id` | 获取议题详情 |
| `PATCH` | `/api/issues/:id` | 更新议题 |
| `DELETE` | `/api/issues/:id` | 删除议题 |

状态更新通过 `PATCH /api/issues/:id` 的 `status` 字段触发 `updateStatus` 逻辑。

### 后端 Service 方法

`backend/src/modules/issues/service.ts` 提供:

- `create(data)` — 创建议题
- `list(filters)` — 列表查询
- `getById(id)` — 单条查询
- `update(id, data)` — 更新议题
- `delete(id)` — 删除议题
- `updateStatus(id, status)` — 状态流转

---

## 前端页面

### 页面

| 页面 | 路径 | 说明 |
|------|------|------|
| `IssueListPage` | `/issues` | 列表页：搜索、筛选、状态 Tab、创建/编辑弹窗 |
| `IssueDetailPage` | `/issues/:id` | 详情页：DetailHero + StatCards + 4 个 Tab |

### 组件清单（12 个）

| 组件 | 说明 |
|------|------|
| `IssueCard` | 列表中的议题卡片 |
| `IssueCreateDialog` | 创建议题弹窗 |
| `IssueEditDialog` | 编辑议题弹窗 |
| `IssueDetailHero` | 详情页顶部信息区 |
| `IssueStatCards` | 统计卡片组（证据数/洞察数/决策数） |
| `IssueStatusTabs` | 状态 Tab 切换栏 |
| `IssueListHeader` | 列表页头部（标题 + 创建按钮） |
| `IssueListFilters` | 列表页筛选区（领域/优先级） |
| `IssueDescriptionTab` | 详情-描述 Tab |
| `IssueEvidencePanel` | 详情-证据 Tab |
| `IssueInsightPanel` | 详情-洞察 Tab |
| `IssueDecisionPanel` | 详情-决策 Tab |

### 前端辅助文件

- `constants.ts` — 状态流转矩阵、中文标签映射、领域/优先级选项
- `types.ts` — `IssueDetail`, `IssueStatCard` 等类型
- `utils.ts` — 日期格式化、状态映射工具函数

---

## 已知问题 / 遗留项

### 后端缺陷（4 个，优先修复）

| # | 问题 | 严重程度 | 说明 |
|---|------|----------|------|
| BUG-1 | `owner_name` 硬编码空字符串 | Medium | 应从用户表关联查询 |
| BUG-2 | 列表接口缺少搜索功能 | Medium | 需实现 `LIKE` 查询，前端已有搜索框 |
| BUG-3 | `sortBy` 参数无白名单校验 | **Critical** | SQL 注入风险，必须限制可排序字段 |
| BUG-4 | 缺少租户配额校验 | Medium | 多租户场景下需防止超额创建 |

### 未实现功能

| # | 功能 | 优先级 |
|---|------|--------|
| TODO-1 | `IssueDeleteConfirm` 删除确认组件 | High |
| TODO-2 | `IssueStatusDropdown` 独立状态下拉组件 | Medium |
| TODO-3 | RBAC 权限控制（viewer 隐藏操作按钮） | High |
| TODO-4 | 共享工具函数提取到 `shared/utils/` | Low |

---

## 相关文件

### 后端

- `backend/src/modules/issues/service.ts` — 议题服务层（CRUD + 状态流转）
- `backend/app/api/issues/route.ts` — `GET /api/issues`, `POST /api/issues`
- `backend/app/api/issues/[id]/route.ts` — `GET/PATCH/DELETE /api/issues/:id`

### 前端

- `frontend/src/features/issues/components/` — 12 个 Vue 组件
- `frontend/src/features/issues/pages/` — `IssueListPage`, `IssueDetailPage`
- `frontend/src/features/issues/constants.ts` — 常量定义
- `frontend/src/features/issues/types.ts` — 类型定义
- `frontend/src/features/issues/utils.ts` — 工具函数

### 共享

- `shared/src/types/issue.ts` — 跨端共享类型
- `shared/src/validators/entities.ts` — `createIssueSchema`, `updateIssueSchema`
