## 1. 基础设施

- [ ] 1.1 安装 dayjs 依赖 (`cd frontend && pnpm add dayjs`)
- [ ] 1.2 创建 `features/issues/api/issues.ts` — API 请求封装 (list/getById/create/update/delete)
- [ ] 1.3 创建 `features/issues/constants/index.ts` — STATUS_CONFIG、DOMAIN_OPTIONS、SORT_OPTIONS、TRANSITION_LABELS、DETAIL_TABS、TAB_EMPTY_STATES
- [ ] 1.4 创建 `features/issues/types/index.ts` — re-export shared types + IssueListParams 等 UI 类型
- [ ] 1.5 创建 `shared/utils/date.ts` — timeAgo/formatDate/daysFromNow 日期工具函数
- [ ] 1.6 创建 `shared/utils/toast.ts` — showToast 轻量通知函数
- [ ] 1.7 创建 `shared/utils/error-handler.ts` — handleApiError 统一错误处理

## 2. Composable 数据层

- [ ] 2.1 实现 `composables/useIssueForm.ts` — 表单状态 + Zod 校验 + 脏检测 + getDiff
- [ ] 2.2 实现 `composables/useIssues.ts` — 列表数据 + 筛选/排序/分页状态 + fetchIssues/setFilter/setPage
- [ ] 2.3 实现 `composables/useIssueDetail.ts` — 单议题详情 + refresh + 404 处理

## 3. 基础组件

- [ ] 3.1 实现 `components/IssueCard.vue` — 卡片（状态色/截止日期样式/标签/更多菜单）
- [ ] 3.2 实现 `components/IssueFilters.vue` — 搜索框 + 状态/领域/排序下拉
- [ ] 3.3 实现 `components/IssueStatusTabs.vue` — 状态标签页（含各状态计数）
- [ ] 3.4 实现 `components/IssueStatusDropdown.vue` — 状态流转下拉（动态合法目标 + 确认弹窗）
- [ ] 3.5 实现 `components/IssueStatCards.vue` — 详情页统计卡片行（证据/洞察/推理/决策卡）
- [ ] 3.6 实现 `components/IssueDetailTabs.vue` — Tab 面板骨架（5 个 Tab + 空状态占位）

## 4. 弹窗组件

- [ ] 4.1 实现 `components/IssueCreateModal.vue` — 创建弹窗（表单 + 校验 + 提交 + 关闭脏检测）
- [ ] 4.2 实现 `components/IssueEditModal.vue` — 编辑弹窗（预填 + diff 提交 + 无变更禁用）
- [ ] 4.3 实现 `components/IssueDeleteConfirm.vue` — 删除确认弹窗（红色确认按钮 + 警告文案）

## 5. 页面组装

- [ ] 5.1 实现 `pages/IssueListPage.vue` — 组装 Filters + StatusTabs + Card列表 + Pagination + CreateModal + EditModal
- [ ] 5.2 实现 `pages/IssueDetailPage.vue` — 面包屑 + 头部 + StatusDropdown + 基本信息 + StatCards + DetailTabs + EditModal + DeleteConfirm

## 6. 联调测试

- [ ] 6.1 联调列表页：搜索/筛选/排序/分页完整流程
- [ ] 6.2 联调创建/编辑/删除完整流程
- [ ] 6.3 联调状态流转完整流程
- [ ] 6.4 验证 RBAC 权限控制 (admin/analyst/viewer)
- [ ] 6.5 验证异常场景 (网络错误/404/权限不足)
