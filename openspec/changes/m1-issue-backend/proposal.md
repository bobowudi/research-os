## Why

后端议题 API 已有基础实现（`backend/src/modules/issues/service.ts` + route handlers），但存在以下问题需要修复：

1. **owner_name 为空**: `create()` 方法中 `owner_name: ''` 硬编码为空字符串，前端卡片显示负责人为空
2. **缺少搜索功能**: `list()` 方法不支持 `search` 参数，PRD 要求标题模糊搜索
3. **sortBy 无白名单**: 排序字段直接拼入 SQL，存在注入风险
4. **缺少配额校验**: PRD 要求创建议题时检查租户配额限制

这些修复是前端模块正常运行的前置条件。

## What Changes

- 修复 `issueService.create()` — 从 users 表查询 owner_name
- 修复 `issueService.list()` — 添加 search 参数支持 (SQL LIKE)
- 修复 `issueService.list()` — sortBy 白名单校验
- 新增 `issueService.checkQuota()` — 租户配额校验
- 修改 route handler GET — 传递 search 参数
- 修改 route handler POST — 增加配额校验调用
- 新增 `constants.ts` — ALLOWED_SORT_BY 白名单

## Capabilities

### New Capabilities

- `issue-quota-check`: 创建议题时的租户配额校验 (free:10, pro:100, enterprise:1000)
- `issue-search`: 议题标题模糊搜索 (SQL LIKE)
- `issue-sort-whitelist`: 排序字段白名单校验防注入

### Modified Capabilities

- `issueService.create()`: 修复 owner_name 从 users 表查询
- `issueService.list()`: 添加 search + sortBy 白名单

## Impact

- **修改文件**:
  - `backend/src/modules/issues/service.ts` — 修复 create/list，新增 checkQuota
  - `backend/app/api/issues/route.ts` — GET 增加 search 解析，POST 增加配额校验
- **新增文件**:
  - `backend/src/modules/issues/constants.ts` — ALLOWED_SORT_BY 白名单
- **无需修改**:
  - `backend/app/api/issues/[id]/route.ts` — 已满足需求
  - `shared/src/validators/entities.ts` — Zod schema 已完整
  - `shared/src/constants/status.ts` — 状态机已定义
