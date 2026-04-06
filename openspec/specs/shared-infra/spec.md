# 共享基础设施 — 基线规格

> 最后更新: 2026-04-05

## 状态: Implemented

共享基础设施涵盖 Monorepo 工程结构、共享类型/常量/验证器、数据库层、后端服务基础设施、前端框架基础设施以及本地开发环境（Docker Compose），已全部实现并投入使用。

---

## 需求规格

### 1. Monorepo 结构

- **包管理器**: pnpm workspaces
- **包列表与依赖链**:

  ```
  shared (@research-os/shared)
    ↓
  database (@research-os/database)
    ↓
  backend (@research-os/backend)
    ↓
  frontend (@research-os/frontend)
  ```

- **依赖方向**: 单向依赖，上游包不依赖下游包
- `shared` 为最底层基础包，被所有其他包引用
- `database` 依赖 `shared`，提供数据库访问层
- `backend` 依赖 `shared` + `database`
- `frontend` 依赖 `shared`

### 2. Shared 包 (@research-os/shared)

#### 2.1 类型定义（12 个文件）

| 文件 | 覆盖领域 | 说明 |
|------|----------|------|
| `types/auth.ts` | 认证与授权 | User, Tenant, Role, Token 等类型 |
| `types/issue.ts` | 研究议题 | Issue 及其状态、优先级类型 |
| `types/evidence.ts` | 证据管理 | Evidence, Source, Attachment 类型 |
| `types/insight.ts` | 洞察分析 | Insight, Tag, Category 类型 |
| `types/decision.ts` | 决策记录 | Decision, Option, Criteria 类型 |
| `types/action.ts` | 行动项 | Action, Assignment, Deadline 类型 |
| `types/review.ts` | 评审流程 | Review, Comment, Approval 类型 |
| `types/signal.ts` | 信号监测 | Signal, AlertRule, Threshold 类型 |
| `types/data-source.ts` | 数据源 | DataSource, Connection, SyncConfig 类型 |
| `types/chat.ts` | AI 对话 | ChatMessage, Conversation, Context 类型 |
| `types/dashboard.ts` | 仪表盘 | Dashboard, Widget, Layout 类型 |
| `types/api.ts` | API 通用 | ApiResponse, PaginatedResult, ErrorResponse 类型 |

#### 2.2 常量定义（3 个文件）

| 文件 | 内容 | 关键导出 |
|------|------|----------|
| `constants/status.ts` | 状态流转规则 | `canTransition(entityType, fromStatus, toStatus): boolean` — 校验状态转换是否合法 |
| `constants/business.ts` | 业务常量 | 配额限制（quotas）、认证参数（auth: token 过期时间等）、AI 参数（模型配置、token 上限等） |
| `constants/roles.ts` | 角色与权限 | 角色定义（admin/analyst/viewer）、权限映射、等级数值 |

#### 2.3 验证器（2 个文件）

| 文件 | 内容 | 关键导出 |
|------|------|----------|
| `validators/auth.ts` | 认证相关 Zod Schemas | `registerSchema`, `loginSchema`, `resetPasswordSchema`, `inviteSchema` 等 |
| `validators/entity.ts` | 业务实体 Zod Schemas | 各业务实体（Issue, Evidence, Insight 等）的创建/更新校验 schema |

### 3. Database 包 (@research-os/database)

#### 3.1 数据库选型

- **数据库**: TiDB（MySQL 兼容协议）
- **端口**: 4000
- **ORM/Query Builder**: Kysely（类型安全的 SQL 查询构建器）

#### 3.2 Schema 定义

共计 **21 张表**，覆盖以下领域：

| 领域 | 表名 | 说明 |
|------|------|------|
| 认证 | `tenants`, `users`, `refresh_tokens`, `password_history`, `invitations` | 多租户认证体系 |
| 研究 | `issues`, `evidence`, `insights` | 核心研究实体 |
| 决策 | `decisions`, `decision_options`, `decision_criteria` | 决策管理 |
| 行动 | `actions` | 行动项跟踪 |
| 评审 | `reviews`, `review_comments` | 评审流程 |
| 信号 | `signals`, `signal_rules` | 信号监测 |
| 数据源 | `data_sources`, `data_source_syncs` | 外部数据源管理 |
| AI | `chat_conversations`, `chat_messages` | AI 对话记录 |
| 仪表盘 | `dashboards`, `dashboard_widgets` | 仪表盘配置 |

#### 3.3 迁移管理

- **单迁移文件**: `001_initial.ts`
- 包含全部 21 张表的创建语句
- 包含必要的索引定义和外键约束

#### 3.4 BaseRepository

- **强制租户隔离**: 所有查询自动注入 `tenant_id` 条件
- 提供标准 CRUD 方法: `findById()`, `findAll()`, `create()`, `update()`, `delete()`
- 所有业务 Repository 继承自 BaseRepository
- 防止跨租户数据泄露

#### 3.5 种子数据

- **演示组织**: `demo-org`（slug: `demo-org`）
- **预置用户**:
  | 用户 | 角色 | 说明 |
  |------|------|------|
  | admin 用户 | `admin` | 管理员账号，可执行所有操作 |
  | analyst 用户 | `analyst` | 分析师账号，可创建编辑业务资源 |

### 4. Backend 基础设施

#### 4.1 框架

- **框架**: Next.js 14 API Routes
- **端口**: 3001
- **路由模式**: App Router (`app/api/` 目录结构)

#### 4.2 外部服务客户端

| 服务 | 技术栈 | 用途 |
|------|--------|------|
| Redis | Redis client | 缓存、Session 存储、速率限制 |
| 消息队列 | BullMQ (基于 Redis) | 异步任务处理（邮件发送、AI 分析等） |
| 搜索引擎 | Elasticsearch client | 全文检索（Issues, Evidence 等） |
| 邮件 | nodemailer | 发送邮件（邀请、密码重置等） |
| 邮件（开发） | Mailpit | 本地开发环境邮件捕获与预览 |
| 对象存储 | S3 / MinIO client | 文件上传与存储（附件、导出文件等） |
| AI | Claude API client | AI 对话、内容分析、摘要生成 |

#### 4.3 AI 集成

- **API 客户端**: Claude API（Anthropic SDK）
- **Prompt 模板**: 预定义的提示词模板，用于不同分析场景
- 模板存储于后端代码中，支持变量插值

### 5. Frontend 基础设施

#### 5.1 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Vue | 3.5 | 前端框架，使用 Composition API + `<script setup>` |
| Vite | 6 | 构建工具，开发热重载 |
| Element Plus | — | UI 组件库 |
| Pinia | — | 状态管理 |
| Vue Router | — | 路由管理 |

#### 5.2 HTTP 客户端

- **文件**: `frontend/src/shared/api/client.ts`
- **基于**: Axios
- **功能**:
  - 自动附加 JWT Access Token 到请求头 (`Authorization: Bearer <token>`)
  - 401 响应拦截 → 自动触发 Token 刷新
  - 刷新期间并发请求排队，刷新成功后自动重发
  - 刷新失败 → 清除认证状态，重定向至登录页

#### 5.3 布局系统

| 组件 | 功能 |
|------|------|
| `MainLayout` | 应用主布局（侧边栏 + 内容区 + 顶部栏） |
| `AppSidebar` | 左侧导航侧边栏，包含模块导航菜单 |
| `AppWorkspaceHeader` | 工作区顶部栏，显示当前模块标题 + 操作按钮 |

#### 5.4 导航系统

- **文件**: `frontend/src/shared/layout/navigation.ts`
- 集中定义所有导航菜单项（名称、图标、路由、权限要求）
- 根据用户角色动态过滤可见菜单项

#### 5.5 全局样式

- **文件**: `frontend/src/shared/styles/main.css`
- 定义 CSS 自定义属性（CSS Variables）:
  - 颜色体系（主色、辅色、语义色）
  - 间距体系（spacing scale）
  - 字体体系（font family, size scale）
  - 圆角、阴影等设计 Token

### 6. Docker Compose 本地开发环境

| 服务 | 镜像 | 端口 | 说明 |
|------|------|------|------|
| TiDB | pingcap/tidb | 4000 | MySQL 兼容分布式数据库 |
| Elasticsearch | elasticsearch | 9200 | 全文搜索引擎 |
| Redis | redis | 6379 | 缓存 + 消息队列后端 |
| Mailpit | mailpit | 1025 (SMTP) / 8025 (UI) | 本地邮件捕获与 Web 预览 |

---

## 数据模型

> 数据库层共 21 张表，完整 schema 定义于 `database/src/schema/` 目录。
> 认证相关表的详细字段说明参见 [Auth 模块规格](../auth/spec.md#数据模型)。

### 核心表一览

```
┌─────────────────────────────────────────────────┐
│  认证层                                          │
│  tenants / users / refresh_tokens /              │
│  password_history / invitations                  │
├─────────────────────────────────────────────────┤
│  研究层                                          │
│  issues / evidence / insights                    │
├─────────────────────────────────────────────────┤
│  决策层                                          │
│  decisions / decision_options / decision_criteria │
├─────────────────────────────────────────────────┤
│  行动层                                          │
│  actions                                         │
├─────────────────────────────────────────────────┤
│  评审层                                          │
│  reviews / review_comments                       │
├─────────────────────────────────────────────────┤
│  信号层                                          │
│  signals / signal_rules                          │
├─────────────────────────────────────────────────┤
│  数据源层                                        │
│  data_sources / data_source_syncs                │
├─────────────────────────────────────────────────┤
│  AI 层                                           │
│  chat_conversations / chat_messages              │
├─────────────────────────────────────────────────┤
│  仪表盘层                                        │
│  dashboards / dashboard_widgets                  │
└─────────────────────────────────────────────────┘
```

### 租户隔离策略

- 所有业务表均包含 `tenant_id` 字段
- BaseRepository 在查询时自动注入 `WHERE tenant_id = ?` 条件
- 数据库层面通过复合索引 `(tenant_id, id)` 确保查询性能

---

## 相关文件

### Monorepo 根目录

```
pnpm-workspace.yaml          # pnpm workspace 配置
docker-compose.yml            # 本地开发环境服务编排
```

### Shared 包

```
shared/src/types/auth.ts          # 认证类型
shared/src/types/issue.ts         # 议题类型
shared/src/types/evidence.ts      # 证据类型
shared/src/types/insight.ts       # 洞察类型
shared/src/types/decision.ts      # 决策类型
shared/src/types/action.ts        # 行动项类型
shared/src/types/review.ts        # 评审类型
shared/src/types/signal.ts        # 信号类型
shared/src/types/data-source.ts   # 数据源类型
shared/src/types/chat.ts          # 对话类型
shared/src/types/dashboard.ts     # 仪表盘类型
shared/src/types/api.ts           # API 通用类型
shared/src/constants/status.ts    # 状态流转规则（canTransition）
shared/src/constants/business.ts  # 业务常量（quotas/auth/AI）
shared/src/constants/roles.ts     # 角色与权限定义
shared/src/validators/auth.ts     # 认证 Zod Schemas
shared/src/validators/entity.ts   # 业务实体 Zod Schemas
```

### Database 包

```
database/src/schema/              # 21 张表的 Kysely schema 定义
database/src/migrations/001_initial.ts  # 初始迁移文件
database/src/repositories/base.ts       # BaseRepository（租户隔离）
database/src/seed/                      # 种子数据（demo-org + 用户）
database/src/client.ts                  # Kysely 数据库连接配置
```

### Backend 基础设施

```
backend/src/lib/redis.ts          # Redis 客户端
backend/src/lib/queue.ts          # BullMQ 队列配置
backend/src/lib/elasticsearch.ts  # Elasticsearch 客户端
backend/src/lib/email.ts          # nodemailer 邮件客户端
backend/src/lib/storage.ts        # S3/MinIO 存储客户端
backend/src/lib/claude.ts         # Claude API 客户端
backend/src/lib/prompts/          # AI Prompt 模板目录
```

### Frontend 基础设施

```
frontend/src/shared/api/client.ts              # Axios 客户端 + JWT 拦截器
frontend/src/shared/layout/MainLayout.vue       # 主布局
frontend/src/shared/layout/AppSidebar.vue        # 侧边栏
frontend/src/shared/layout/AppWorkspaceHeader.vue # 工作区顶部栏
frontend/src/shared/layout/navigation.ts         # 导航菜单定义
frontend/src/shared/styles/main.css               # 全局 CSS 变量
```

---

## 变更日志

| 日期 | 变更内容 | 提交者 |
|------|----------|--------|
| 2026-04-05 | 初始基线：完整记录已实现的共享基础设施规格 | — |
