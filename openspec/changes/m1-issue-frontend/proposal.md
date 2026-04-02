## Why

当前 ResearchOS 的议题管理模块只有后端 API 基础实现和路由定义，但前端页面组件 `frontend/src/features/issues/` 目录下完全为空。用户无法通过界面进行任何议题操作。

议题 (Issue) 是 ResearchOS 的核心入口实体 — 一个议题代表一个待决策的业务问题，是「证据 → 洞察 → 推理 → 决策 → 行动 → 回看」闭环的起点。必须优先完成此模块的前端功能。

## What Changes

- 新增议题列表页 (`/issues`)：搜索、状态/领域筛选、排序、分页、状态标签页
- 新增议题详情页 (`/issues/:id`)：基本信息、统计卡片、Tab 骨架（后续模块填充内容）
- 新增创建议题弹窗：5 字段表单 + Zod 校验 + 防重复提交
- 新增编辑议题弹窗：预填数据 + 脏检测 + diff 提交
- 新增删除确认弹窗：二次确认 + 权限限制（仅 admin）
- 新增状态流转交互：基于状态机的下拉选择 + 确认弹窗
- RBAC 权限控制：viewer 隐藏创建/编辑/删除按钮

## Capabilities

### New Capabilities

- `issue-list-page`: 议题列表页完整功能（搜索/筛选/排序/分页/状态标签页/卡片展示）
- `issue-detail-page`: 议题详情页（基本信息/统计卡片/Tab 面板骨架/面包屑导航）
- `issue-create-edit-modals`: 创建和编辑议题弹窗（表单校验/脏检测/API 调用）
- `issue-status-flow`: 状态流转交互（状态机下拉/确认弹窗/合法性校验）
- `issue-composables`: Vue 3 Composable 数据管理层（useIssues/useIssueDetail/useIssueForm）

### Modified Capabilities

- `frontend/package.json`: 新增 dayjs 依赖

## Impact

- **新增文件** (17 个):
  - `features/issues/pages/IssueListPage.vue` — 列表页
  - `features/issues/pages/IssueDetailPage.vue` — 详情页
  - `features/issues/components/IssueCard.vue` — 议题卡片
  - `features/issues/components/IssueCreateModal.vue` — 创建弹窗
  - `features/issues/components/IssueEditModal.vue` — 编辑弹窗
  - `features/issues/components/IssueDeleteConfirm.vue` — 删除确认
  - `features/issues/components/IssueStatusDropdown.vue` — 状态下拉
  - `features/issues/components/IssueFilters.vue` — 筛选工具栏
  - `features/issues/components/IssueStatusTabs.vue` — 状态标签页
  - `features/issues/components/IssueStatCards.vue` — 统计卡片行
  - `features/issues/components/IssueDetailTabs.vue` — Tab 面板骨架
  - `features/issues/composables/useIssues.ts` — 列表数据 composable
  - `features/issues/composables/useIssueDetail.ts` — 详情数据 composable
  - `features/issues/composables/useIssueForm.ts` — 表单逻辑 composable
  - `features/issues/api/issues.ts` — API 请求封装
  - `features/issues/constants/index.ts` — 状态颜色/领域选项/排序选项等常量
  - `features/issues/types/index.ts` — 前端 UI 类型
- **修改文件**:
  - `frontend/package.json` — 添加 dayjs 依赖
- **无需修改**:
  - `frontend/src/app/router.ts` — 路由已定义（`/issues` 和 `/issues/:id`）
