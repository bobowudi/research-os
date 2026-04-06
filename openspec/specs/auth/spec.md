# Auth 模块 — 基线规格

> 最后更新: 2026-04-05

## 状态: Implemented

认证与授权模块已完整实现，涵盖注册、登录、Token 管理、邀请系统、密码重置、RBAC 权限控制以及前端全套页面。

---

## 需求规格

### 1. 注册流程

- **接口**: `POST /api/auth/register`
- **功能**: 创建组织（tenant）+ 管理员账号，一步完成
- **请求字段**:
  | 字段 | 类型 | 校验规则 |
  |------|------|----------|
  | `email` | string | 合法邮箱格式 |
  | `password` | string | ≥8 位，必须包含大写字母 + 小写字母 + 数字 + 特殊字符 |
  | `name` | string | 用户显示名称 |
  | `orgName` | string | 组织名称 |
  | `orgSlug` | string | 组织唯一标识（URL-safe） |
- **校验**: 使用 Zod `registerSchema` 进行服务端 + 客户端双重校验
- **密码存储**: `bcrypt`，cost factor = 12
- **Token 签发**:
  - Access Token: JWT，有效期 **15 分钟**
  - Refresh Token: 有效期 **7 天**，存储 SHA-256 哈希值至数据库

### 2. 登录流程

- **接口**: `POST /api/auth/login`
- **请求字段**: `email`, `password`
- **响应结构**:
  ```json
  {
    "accessToken": "eyJhbG...",
    "refreshToken": "abc123...",
    "user": { "id", "email", "name", "role" },
    "tenant": { "id", "name", "slug" }
  }
  ```
- **安全策略**:
  - 登录失败计数器：连续失败累加
  - 账户锁定：连续失败 **5 次**后锁定 **15 分钟**
  - 锁定期间返回 `423 Locked` 状态码

### 3. Token 管理

| 接口 | 方法 | 功能 |
|------|------|------|
| `/api/auth/refresh` | POST | 使用 Refresh Token 换取新的 Access Token + Refresh Token（轮换机制） |
| `/api/auth/logout` | POST | 登出，清除服务端存储的 Refresh Token |
| `/api/auth/me` | GET | 获取当前认证用户信息，需携带有效 Access Token |

- Refresh Token 采用**一次性使用**策略：刷新后旧 Token 即失效
- Logout 同时清除客户端 HttpOnly Cookie 和服务端 Token 记录

### 4. 邀请系统

| 接口 | 方法 | 权限 | 功能 |
|------|------|------|------|
| `/api/auth/invitations` | POST | admin only | 发送邀请邮件，指定被邀请人邮箱和角色 |
| `/api/auth/invite-register` | POST | public | 被邀请人通过邀请链接完成注册 |

- 邀请包含唯一 Token，关联目标组织和预设角色
- 邀请有过期时间，过期后不可使用
- 注册完成后邀请记录标记为已使用

### 5. 密码重置

| 接口 | 方法 | 功能 |
|------|------|------|
| `/api/auth/forgot-password` | POST | 发送密码重置邮件（包含重置链接 + Token） |
| `/api/auth/reset-password` | POST | 验证 Token 并设置新密码 |

- 重置 Token 一次性使用，有过期时间
- 新密码同样需满足复杂度要求（Zod 校验）
- 重置成功后清除该用户所有 Refresh Token（强制重新登录）

### 6. RBAC 三级权限体系

| 角色 | 等级 | 权限范围 |
|------|------|----------|
| `admin` | 3 | 全部 CRUD 操作 + 审计日志查看 + 用户管理 + 邀请管理 |
| `analyst` | 2 | 创建/编辑/查看业务资源（issues, evidence, insights 等） |
| `viewer` | 1 | 只读访问所有业务资源 |

- 权限检查基于角色等级数值比较：`userRole.level >= requiredLevel`
- 权限定义集中管理于 `shared/src/constants/roles.ts`

### 7. 安全机制

- **Refresh Token 存储**: HttpOnly Cookie，服务端仅存储 SHA-256 哈希值
- **Axios 拦截器**: 自动检测 401 响应，触发 Token 刷新
- **401 重试队列**: 刷新期间的并发请求排队等待，刷新成功后自动重发
- **密码哈希**: bcrypt，cost = 12
- **敏感操作审计**: 管理员操作记录审计日志

---

## 数据模型

### tenants（租户/组织表）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | VARCHAR(36) / UUID | 主键 |
| `name` | VARCHAR | 组织名称 |
| `slug` | VARCHAR | 唯一标识，URL-safe |
| `created_at` | TIMESTAMP | 创建时间 |
| `updated_at` | TIMESTAMP | 更新时间 |

### users（用户表）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | VARCHAR(36) / UUID | 主键 |
| `tenant_id` | VARCHAR(36) | 外键 → tenants.id |
| `email` | VARCHAR | 邮箱，租户内唯一 |
| `password_hash` | VARCHAR | bcrypt 哈希值 |
| `name` | VARCHAR | 显示名称 |
| `role` | ENUM('admin','analyst','viewer') | 角色 |
| `failed_login_attempts` | INT | 连续登录失败次数 |
| `locked_until` | TIMESTAMP | 账户锁定截止时间 |
| `created_at` | TIMESTAMP | 创建时间 |
| `updated_at` | TIMESTAMP | 更新时间 |

### refresh_tokens（刷新令牌表）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | VARCHAR(36) / UUID | 主键 |
| `user_id` | VARCHAR(36) | 外键 → users.id |
| `token_hash` | VARCHAR | SHA-256 哈希值 |
| `expires_at` | TIMESTAMP | 过期时间（7 天） |
| `created_at` | TIMESTAMP | 创建时间 |

### password_history（密码历史表）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | VARCHAR(36) / UUID | 主键 |
| `user_id` | VARCHAR(36) | 外键 → users.id |
| `password_hash` | VARCHAR | 历史密码哈希 |
| `created_at` | TIMESTAMP | 记录时间 |

### invitations（邀请表）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | VARCHAR(36) / UUID | 主键 |
| `tenant_id` | VARCHAR(36) | 外键 → tenants.id |
| `email` | VARCHAR | 被邀请人邮箱 |
| `role` | ENUM('admin','analyst','viewer') | 预设角色 |
| `token` | VARCHAR | 邀请唯一 Token |
| `invited_by` | VARCHAR(36) | 外键 → users.id |
| `status` | ENUM('pending','accepted','expired') | 邀请状态 |
| `expires_at` | TIMESTAMP | 过期时间 |
| `created_at` | TIMESTAMP | 创建时间 |

---

## API 接口汇总

| 方法 | 路径 | 认证 | 权限 | 说明 |
|------|------|------|------|------|
| POST | `/api/auth/register` | 无 | public | 注册组织 + 管理员 |
| POST | `/api/auth/login` | 无 | public | 邮箱密码登录 |
| POST | `/api/auth/refresh` | RT | public | 刷新 Token |
| POST | `/api/auth/logout` | AT | authenticated | 登出 |
| GET | `/api/auth/me` | AT | authenticated | 获取当前用户 |
| POST | `/api/auth/invitations` | AT | admin | 发送邀请 |
| POST | `/api/auth/invite-register` | 无 | public（需邀请 Token） | 接受邀请注册 |
| POST | `/api/auth/forgot-password` | 无 | public | 请求密码重置 |
| POST | `/api/auth/reset-password` | 无 | public（需重置 Token） | 执行密码重置 |

> AT = Access Token, RT = Refresh Token

---

## 前端页面

### 页面组件

| 页面 | 组件 | 路由 | 说明 |
|------|------|------|------|
| 登录 | `LoginPage` | `/login` | 邮箱 + 密码登录表单 |
| 注册 | `RegisterPage` | `/register` | 组织 + 管理员注册表单 |
| 忘记密码 | `ForgotPasswordPage` | `/forgot-password` | 输入邮箱发送重置链接 |
| 重置密码 | `ResetPasswordPage` | `/reset-password` | 设置新密码 |
| 接受邀请 | `InviteAcceptPage` | `/invite/:token` | 被邀请人完成注册 |

### 布局组件

- **`AuthShell`**: 认证页面统一外壳，采用分屏布局（左侧表单 / 右侧品牌）
- **`AuthCardFrame`**: 表单卡片容器，统一样式和间距
- **`AuthFeaturePanel`**: 右侧品牌展示面板，展示产品特性

### 状态管理

- **`useAuthStore`**（Pinia）: 唯一的认证状态 Store
  - State: `user`, `tenant`, `accessToken`, `isAuthenticated`
  - Actions: `login()`, `register()`, `logout()`, `refreshToken()`, `fetchMe()`
  - Getters: `isAdmin`, `isAnalyst`, `currentRole`

### 路由守卫

- `router.beforeEach`: 每次路由跳转前检查认证状态
  - 未认证用户访问受保护页面 → 重定向至 `/login`
  - 已认证用户访问认证页面 → 重定向至 `/dashboard`
  - 权限不足 → 重定向至 `/403`

---

## 相关文件

### Backend

```
backend/src/modules/auth/service.ts          # Auth 业务逻辑服务
backend/app/api/auth/register/route.ts       # 注册接口
backend/app/api/auth/login/route.ts          # 登录接口
backend/app/api/auth/refresh/route.ts        # Token 刷新接口
backend/app/api/auth/logout/route.ts         # 登出接口
backend/app/api/auth/me/route.ts             # 当前用户接口
backend/app/api/auth/invitations/route.ts    # 邀请接口
backend/app/api/auth/invite-register/route.ts # 邀请注册接口
backend/app/api/auth/forgot-password/route.ts # 忘记密码接口
backend/app/api/auth/reset-password/route.ts  # 重置密码接口
```

### Frontend

```
frontend/src/features/auth/pages/LoginPage.vue          # 登录页
frontend/src/features/auth/pages/RegisterPage.vue        # 注册页
frontend/src/features/auth/pages/ForgotPasswordPage.vue  # 忘记密码页
frontend/src/features/auth/pages/ResetPasswordPage.vue   # 重置密码页
frontend/src/features/auth/pages/InviteAcceptPage.vue    # 接受邀请页
frontend/src/features/auth/components/AuthShell.vue       # 认证布局外壳
frontend/src/features/auth/components/AuthCardFrame.vue   # 表单卡片容器
frontend/src/features/auth/components/AuthFeaturePanel.vue # 品牌展示面板
frontend/src/shared/stores/auth.ts                        # Pinia Auth Store
```

### Shared

```
shared/src/validators/auth.ts    # Zod 校验 schemas (registerSchema, loginSchema 等)
```

---

## 变更日志

| 日期 | 变更内容 | 提交者 |
|------|----------|--------|
| 2026-04-05 | 初始基线：完整记录已实现的 Auth 模块规格 | — |
