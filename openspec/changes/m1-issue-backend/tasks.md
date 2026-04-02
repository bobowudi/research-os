## 1. 常量与配置

- [ ] 1.1 创建 `backend/src/modules/issues/constants.ts` — ALLOWED_SORT_BY 白名单

## 2. Service 修复

- [ ] 2.1 修复 `service.create()` — 从 users 表查询 owner_name 替代空字符串
- [ ] 2.2 修复 `service.list()` — 添加 search 参数支持 (WHERE title LIKE '%keyword%')
- [ ] 2.3 修复 `service.list()` — sortBy 白名单校验，非法值回退 created_at
- [ ] 2.4 新增 `service.checkQuota()` — COUNT 查询 + 配额比对 + 抛出 409

## 3. Route Handler 修改

- [ ] 3.1 修改 `route.ts` GET handler — 解析 search query 参数并传入 service.list()
- [ ] 3.2 修改 `route.ts` POST handler — 在 create 前调用 checkQuota()

## 4. 测试

- [ ] 4.1 手动测试 GET /api/issues?search=xxx 搜索功能
- [ ] 4.2 手动测试 POST /api/issues 创建时 owner_name 正确填充
- [ ] 4.3 手动测试 sortBy 非法值回退行为
- [ ] 4.4 手动测试配额超限返回 409
- [ ] 4.5 验证所有现有功能不回归（PATCH/DELETE/状态流转）
