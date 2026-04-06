# Evidence 管理模块 — 基线规格

> 最后更新: 2026-04-05

## 状态: Partial

证据（Evidence）是 ResearchOS 中支撑议题分析与决策的核心数据单元。用户可以从多种来源导入证据，对证据进行分类、摘要生成、立场分析，并将其关联到具体议题。

当前仅完成前端列表展示桩代码与后端路由脚手架，完整 CRUD、导入、搜索、AI 摘要、立场分析等功能均未实现。

---

## 需求规格

### 核心功能

| # | 功能 | 状态 |
|---|------|------|
| F1 | 证据列表展示：搜索 + 来源分类/类型过滤 | ⚠️ 前端桩代码（调用 `GET /api/evidence`） |
| F2 | 证据卡片组件：来源图标、置信度进度条、立场标签 | ✅ 前端已实现 |
| F3 | 证据创建弹窗 | ⚠️ 表单 UI 存在但提交无功能（空壳） |
| F4 | 证据 CRUD 完整实现 | ❌ 未实现 |
| F5 | 证据批量导入（文件/API） | ❌ 未实现 |
| F6 | 证据全文搜索（Elasticsearch） | ❌ 未实现 |
| F7 | 证据摘要 AI 生成 | ❌ 未实现 |
| F8 | 证据关联议题（`IssueEvidence`） | ❌ 未实现 |
| F9 | 立场分析（Stance Analysis，独立模块 M3） | ❌ 未实现 |

### 来源分类与类型

证据来源分为两大类共 9 种类型：

- **内部来源（internal）**: 用户笔记、内部报告、会议纪要、实验数据
- **外部来源（external）**: 学术论文、新闻报道、行业报告、专家访谈、社交媒体

### 立场模型

每条证据关联到议题时需标注立场：

- `pro` — 支持
- `con` — 反对
- `neutral` — 中立

立场来源可为 `ai`（自动分析）或 `manual`（人工标注），附带置信度评分与理由说明。

---

## 数据模型

### `evidence` 表

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string (UUID) | 主键 |
| `tenant_id` | string | 租户 ID |
| `source_category` | enum | 来源分类：`internal` / `external` |
| `source_type` | enum | 来源类型（9 种） |
| `source_label` | string | 来源显示标签 |
| `source_ref` | string | 来源引用（URL / DOI 等） |
| `content` | text | 证据原文内容 |
| `summary` | text | 摘要（可由 AI 生成） |
| `tags` | string[] | 标签数组 |
| `confidence` | number (0-1) | 置信度评分 |
| `confidence_factors` | json | 置信度影响因子 |
| `freshness_at` | datetime | 数据新鲜度时间戳 |
| `citation` | string | 引用格式文本 |
| `attachment_urls` | string[] | 附件 URL 列表 |
| `import_job_id` | string | 批量导入任务 ID（可为空） |
| `created_by` | string | 创建者 ID |

### `issue_evidence` 关联表

| 字段 | 类型 | 说明 |
|------|------|------|
| `issue_id` | string (UUID) | 关联议题 ID |
| `evidence_id` | string (UUID) | 关联证据 ID |
| `stance` | enum | 立场：`pro` / `con` / `neutral` |
| `stance_source` | enum | 立场来源：`ai` / `manual` |
| `stance_confidence` | number (0-1) | 立场置信度 |
| `stance_reason` | text | 立场判定理由 |
| `stance_version` | number | 立场版本号（支持多次重新分析） |
| `relevance_score` | number (0-1) | 与议题的相关性评分 |

存储引擎: TiDB，Schema 定义在 `database/src/schema/tables.ts`。

---

## API 接口

### 已实现

| 方法 | 路径 | 说明 | 状态 |
|------|------|------|------|
| `GET` | `/api/evidence` | 获取证据列表 | ⚠️ 路由脚手架，无完整实现 |

### 待实现（来自 PRD 规划）

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/evidence` | 创建证据 |
| `GET` | `/api/evidence/:id` | 获取证据详情 |
| `PATCH` | `/api/evidence/:id` | 更新证据 |
| `DELETE` | `/api/evidence/:id` | 删除证据 |
| `POST` | `/api/evidence/import` | 批量导入证据（文件/API） |
| `GET` | `/api/evidence/search` | 全文搜索（Elasticsearch） |
| `POST` | `/api/evidence/:id/summarize` | AI 生成证据摘要 |
| `POST` | `/api/issues/:id/evidence` | 将证据关联到议题 |
| `GET` | `/api/issues/:id/evidence` | 查看议题下的所有证据 |

---

## 前端页面

### 页面

| 页面 | 路径 | 说明 |
|------|------|------|
| `EvidenceListPage` | `/evidence` | 列表页：调用 `GET /api/evidence`，搜索 + 来源分类/类型过滤 |

### 组件清单

| 组件 | 说明 | 状态 |
|------|------|------|
| `EvidenceCard` | 证据卡片：来源图标、置信度进度条、立场标签 | ✅ 已实现 |
| 创建弹窗（内嵌于 `EvidenceListPage`） | 证据创建表单 | ⚠️ 空壳（UI 存在，提交无功能） |

### 待实现组件（预期）

| 组件 | 说明 |
|------|------|
| `EvidenceCreateDialog` | 完整创建弹窗（含表单校验与提交） |
| `EvidenceEditDialog` | 编辑弹窗 |
| `EvidenceDetailPage` | 证据详情页 |
| `EvidenceDeleteConfirm` | 删除确认对话框 |
| `EvidenceImportDialog` | 批量导入向导 |
| `EvidenceSearchBar` | 全文搜索输入框（接 Elasticsearch） |
| `EvidenceSummaryCard` | AI 摘要展示卡片 |
| `EvidenceStanceTag` | 立场标签组件（可复用） |

---

## 已知问题 / 遗留项

### 前端问题

| # | 问题 | 严重程度 | 说明 |
|---|------|----------|------|
| BUG-1 | 创建弹窗提交无功能 | High | 表单 UI 已就绪，但缺少 API 调用与校验逻辑 |
| BUG-2 | 列表页依赖的 `GET /api/evidence` 为脚手架 | High | 前端调用后可能返回空数据或错误 |

### 待实现功能

| # | 功能 | 优先级 | 说明 |
|---|------|--------|------|
| TODO-1 | 证据 CRUD 后端完整实现 | **Critical** | 模块核心功能，阻塞所有其他特性 |
| TODO-2 | 证据关联议题 `issue_evidence` | High | 需同步更新 `issues.evidence_count` |
| TODO-3 | 证据批量导入 | High | 支持文件上传与外部 API 拉取 |
| TODO-4 | Elasticsearch 全文搜索 | Medium | 需部署 ES 实例，配置索引映射 |
| TODO-5 | AI 摘要生成 | Medium | 接入 LLM 服务，异步生成 |
| TODO-6 | 立场分析模块（M3） | Medium | 独立模块，AI + 人工混合标注 |
| TODO-7 | 证据详情页 `EvidenceDetailPage` | Medium | 展示完整内容、摘要、关联议题 |
| TODO-8 | 前端创建弹窗对接 API | High | 补全表单校验 + `POST /api/evidence` |

---

## 相关文件

### 前端

- `frontend/src/features/evidence/pages/EvidenceListPage.vue` — 证据列表页
- `frontend/src/features/evidence/components/EvidenceCard.vue` — 证据卡片组件

### 共享

- `shared/src/types/evidence.ts` — 跨端共享证据类型定义
- `shared/src/validators/entities.ts` — `createEvidenceSchema`, `linkEvidenceSchema`

### 数据库

- `database/src/schema/tables.ts` — `evidence` 表与 `issue_evidence` 关联表定义
