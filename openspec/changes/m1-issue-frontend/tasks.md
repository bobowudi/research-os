<!-- Updated 2026-04-05: Synced with actual code state -->
<!-- Architecture deviations from original design:
     1. Used Element Plus Dialog instead of custom Modal components
     2. No composables/ or api/ subdirectories — logic embedded in page components
     3. Files are flat (constants.ts, types.ts, utils.ts) not in subdirectories
     4. Component naming: Dialog vs Modal, IssueListFilters vs IssueFilters
     5. Exceeded original Non-Goals — implemented Evidence/Insight/Decision panels in detail page
-->

## 1. 基础设施

- [x] 1.1 安装 dayjs 依赖 (`cd frontend && pnpm add dayjs`) — *未安装 dayjs，改用原生 Date + 自定义 utils.ts*
- [ ] ~~1.2 创建 `features/issues/api/issues.ts`~~ — **架构调整**：未创建独立 API 文件，API 调用直接在页面组件中通过 `apiClient` 完成
- [x] 1.3 创建 `features/issues/constants.ts` — ✅ 已实现（注意：实际为平铺文件而非 `constants/index.ts` 目录结构）
- [x] 1.4 创建 `features/issues/types.ts` — ✅ 已实现（平铺文件，包含 IssueDetail, IssueStatCard 等类型）
- [ ] ~~1.5 创建 `shared/utils/date.ts`~~ — **架构调整**：日期工具函数在 `features/issues/utils.ts` 中实现
- [ ] ~~1.6 创建 `shared/utils/toast.ts`~~ — **未实现**：使用 Element Plus 的 ElMessage 替代
- [ ] ~~1.7 创建 `shared/utils/error-handler.ts`~~ — **未实现**：错误处理在各组件 catch 块中内联

## 2. Composable 数据层

> **架构偏离说明**：实际实现未采用 composable 模式，数据管理逻辑直接嵌入页面组件中。

- [ ] ~~2.1 实现 `composables/useIssueForm.ts`~~ — **架构调整**：表单逻辑在 IssueCreateDialog 和 IssueEditDialog 组件中直接实现
- [ ] ~~2.2 实现 `composables/useIssues.ts`~~ — **架构调整**：列表数据管理在 IssueListPage.vue 中以 ref() 方式管理
- [ ] ~~2.3 实现 `composables/useIssueDetail.ts`~~ — **架构调整**：详情数据在 IssueDetailPage.vue 中直接管理

## 3. 基础组件

- [x] 3.1 实现 `components/IssueCard.vue` — ✅ 完整实现（状态色标签/截止日期样式/标签/证据洞察统计）
- [x] 3.2 实现 `components/IssueListFilters.vue` — ✅ 已实现（命名为 IssueListFilters 而非 IssueFilters）
- [x] 3.3 实现 `components/IssueStatusTabs.vue` — ✅ 完整实现
- [ ] 3.4 实现 `components/IssueStatusDropdown.vue` — ❌ 未实现（状态流转在 IssueDetailHero 中通过 el-dropdown 实现）
- [x] 3.5 实现 `components/IssueStatCards.vue` — ✅ 完整实现（带趋势指标）
- [ ] ~~3.6 实现 `components/IssueDetailTabs.vue`~~ — **架构调整**：未创建独立组件，Tab 面板拆分为以下 3 个独立面板组件

### 3.x 计划外新增组件

- [x] 3.7 实现 `components/IssueListHeader.vue` — ✅ 页面标题 + 新建按钮（原计划包含在 IssueListPage 中）
- [x] 3.8 实现 `components/IssueDetailHero.vue` — ✅ 详情页顶部横幅（含状态变更下拉、编辑/分享按钮）
- [x] 3.9 实现 `components/IssueDescriptionTab.vue` — ✅ 描述 + 属性面板 + AI 洞察摘要
- [x] 3.10 实现 `components/IssueEvidencePanel.vue` — ✅ 关联证据列表 + 搜索/过滤/多选关联弹窗（**超出原 Non-Goals**）
- [x] 3.11 实现 `components/IssueInsightPanel.vue` — ✅ AI 洞察列表 + 确认/质疑操作（**超出原 Non-Goals**）
- [x] 3.12 实现 `components/IssueDecisionPanel.vue` — ✅ 决策卡列表 + 投票系统（**超出原 Non-Goals**）

## 4. 弹窗组件

- [x] 4.1 实现 `components/IssueCreateDialog.vue` — ✅ 已实现（命名为 Dialog 而非 Modal，使用 Element Plus el-dialog）
- [x] 4.2 实现 `components/IssueEditDialog.vue` — ✅ 已实现（命名为 Dialog 而非 Modal）
- [ ] 4.3 实现 `components/IssueDeleteConfirm.vue` — ❌ 未实现

## 5. 页面组装

- [x] 5.1 实现 `pages/IssueListPage.vue` — ✅ 完整实现（ListHeader + Filters + StatusTabs + Card 列表 + CreateDialog + EditDialog）
- [x] 5.2 实现 `pages/IssueDetailPage.vue` — ✅ 完整实现（面包屑 + DetailHero + StatCards + Tab 面板 + EditDialog）

## 6. 联调测试

- [x] 6.1 联调列表页：搜索/筛选/排序/分页完整流程
- [x] 6.2 联调创建/编辑完整流程
- [ ] 6.3 联调状态流转完整流程 — *部分完成，缺少独立 StatusDropdown 确认弹窗*
- [ ] 6.4 验证 RBAC 权限控制 (admin/analyst/viewer) — *未验证*
- [ ] 6.5 验证异常场景 (网络错误/404/权限不足) — *未验证*

## 7. 待办 / 遗留问题

- [ ] 7.1 IssueDeleteConfirm 组件未实现 — 删除功能缺失
- [ ] 7.2 独立 IssueStatusDropdown 组件未实现 — 状态流转确认弹窗缺失
- [ ] 7.3 typing.d.ts 全局 IssueStatus 与 issues/types.ts 领域 IssueStatus 类型冲突需解决
- [ ] 7.4 共享工具函数（date, toast, error-handler）未提取到 shared/utils/ — 代码复用问题
- [ ] 7.5 RBAC 权限控制未实现（viewer 应隐藏创建/编辑/删除按钮）
