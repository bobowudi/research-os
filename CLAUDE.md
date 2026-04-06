# ResearchOS - AI Research Decision System

> 多源证据驱动的 AI 调研决策系统（Multi-source Evidence-driven AI Research & Decision System）

## Quick Context

- **What**: 多租户 SaaS 平台，帮助企业将内外部证据转化为可执行决策
- **Core Innovation**: 内外对抗推理 — 三方 Agent 架构（Advocate 正方 / Critic 反方 / Judge 裁判）
- **Status**: 早期开发阶段，认证系统和议题管理模块已实现，其余模块为 scaffold/stub

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vue 3.5 + TypeScript + Vite 6 + Element Plus + Pinia + Less |
| Backend | Next.js 14 API Routes (BFF, port 3001) |
| Database | TiDB (MySQL-compatible, port 4000) + Kysely ORM |
| Search | Elasticsearch 8.x |
| Cache/Queue | Redis 7.x + BullMQ |
| AI | Claude API (claude-sonnet-4-20250514) + Embedding |
| Infra | Docker Compose, pnpm workspaces monorepo |
| Validation | Zod (shared between frontend & backend) |

## Monorepo Structure

```
research-os/
├── shared/          # @research-os/shared — types, constants, Zod validators
├── database/        # @research-os/database — Kysely schema, migrations, repositories
├── backend/         # Next.js API routes, services, middleware
├── frontend/        # Vue 3 SPA
├── docs/            # PRD documents (Chinese)
│   └── prd/         # Module-specific PRDs
├── openspec/        # Spec-driven change management
└── docker-compose.yml
```

**Dependency chain**: `shared` → `database` → `backend` → `frontend`

## Core Domain Model

```
Tenant → User → Issue → IssueEvidence → Evidence
                  ↓
             Insight → ReasoningRun → DecisionCard → Action → Review
                                                       ↓
                                              Signal ← DataSource → ImportJob
```

**Key insight**: Evidence stance is **relative to an Issue** (stored in `IssueEvidence` join table), not a global attribute.

## 12 Modules Overview

| # | Module | Status | Priority |
|---|--------|--------|----------|
| P1 | Auth (登录注册/RBAC/多租户) | ✅ Implemented | P0 |
| M1 | Issues (议题管理) | ⚡ Partially implemented (frontend done, backend has 4 bugs) | P0 |
| M2 | Evidence (证据管理) | ⚡ Partial frontend, backend scaffold | P0 |
| M3 | Stance Analysis (立场分析) | 🔲 Not started | P0 |
| M4 | Insights (洞察管理) | 🔲 Stub only | P0 |
| M5 | Adversarial Reasoning (对抗推理) | 🔲 Not started | P0 |
| M6 | Decisions (决策管理) | 🔲 Stub only | P0 |
| M7 | Actions (行动管理) | 🔲 Stub only | P0 |
| M8 | Reviews (回看闭环) | 🔲 Stub only | P1 |
| M9 | Signals (信号检测) | 🔲 Stub only | P2 |
| M10 | Data Sources (数据源管理) | 🔲 Stub only | P0 |
| M11 | Dashboard (仪表盘) | ⚡ Basic implementation | P1 |

## Frontend Architecture

### Implemented Features
- **Auth**: 5 pages (Login, Register, ForgotPassword, ResetPassword, InviteAccept) with AuthShell split-screen layout
- **Home**: Demo page showcasing adversarial reasoning concept with mock data
- **Issues**: Full module — 12 components, 2 pages, search/filter/CRUD/status transitions
- **Dashboard**: Basic stats overview with API integration
- **Evidence**: List page with search/filter, EvidenceCard component (create dialog is a shell)
- **Layout**: MainLayout + AppSidebar + AppWorkspaceHeader with navigation system

### Patterns & Conventions
- **Directory structure**: Feature-based (`features/<module>/components/`, `pages/`, `composables/`)
- **State management**: Only `useAuthStore` in Pinia; business modules use local `ref()` in components
- **API client**: Centralized Axios instance with JWT interceptor + auto refresh (`shared/api/client.ts`)
- **Routing**: Lazy-loaded routes with `beforeEach` auth guard
- **Styling**: Scoped Less + global CSS variables; BEM naming in issues module

### Known Issues
- `typing.d.ts` global `IssueStatus` conflicts with `features/issues/types.ts` domain-specific status
- Evidence create dialog is a non-functional shell
- 7 stub pages use `any[]` types with no TypeScript constraints
- No unit tests or E2E tests exist

## Backend Architecture

### Implemented
- **Auth module**: Full registration/login/JWT/refresh/invitation flow with bcrypt + rate limiting
- **Issues module**: CRUD service + route handlers (has 4 known bugs — see OpenSpec `m1-issue-backend`)
- **Dashboard module**: Aggregation service
- **AI/LLM**: Claude client wrapper, prompt template engine, chat service
- **Infrastructure**: TiDB connection, Redis client, Elasticsearch client, BullMQ queue, email (nodemailer), S3/MinIO storage

### Known Backend Bugs (M1 Issues)
1. `owner_name` hardcoded to `''` in `service.create()`
2. No search support in `service.list()`
3. `sortBy` has no whitelist — SQL injection risk
4. No tenant quota check on issue creation

### Patterns
- Route handlers in `app/api/<resource>/route.ts` (Next.js App Router)
- Business logic in `src/modules/<module>/service.ts`
- Auth middleware via `withAuth()` wrapper
- Zod validation from shared package
- `BaseRepository` in database package enforces tenant isolation

## Database (21 Tables)

Core tables: `tenants`, `users`, `issues`, `evidence`, `issue_evidence`, `insights`, `insight_evidence`, `reasoning_runs`, `decision_cards`, `decision_votes`, `actions`, `reviews`, `signals`, `data_sources`, `import_jobs`, `chat_sessions`, `chat_messages`, `audit_logs`, `refresh_tokens`, `password_history`, `invitations`

- All tables have `tenant_id` for multi-tenancy isolation
- Single migration: `001_initial.ts` creates all tables
- Seed data: Demo org (`demo-org`) with admin + analyst users

## Shared Package Key Exports

- **12 type files**: auth, issue, evidence, insight, decision, action, review, signal, data-source, chat, dashboard, api
- **3 constant files**: status transitions, business constants (quotas/auth/AI config), roles & permissions
- **2 validator files**: auth schemas, entity schemas (all Zod)

## RBAC Model

| Role | Level | Capabilities |
|------|-------|-------------|
| admin | 3 | Full CRUD on all resources + audit logs |
| analyst | 2 | Create/edit issues, evidence, insights, actions, reviews; read+update decisions/signals |
| viewer | 1 | Read-only on all business resources; can create chat messages |

## OpenSpec Status

Active changes in `openspec/changes/`:
- **m1-issue-backend**: 4 bug fixes (0% complete, specs match code)
- **m1-issue-frontend**: Full module build (0% in tasks, but code is actually ~80% complete — OpenSpec is stale)

**No `specs/` baseline yet** — need to create main specs as modules are completed.

## Development Commands

```bash
# Install dependencies
pnpm install

# Start infrastructure (TiDB, ES, Redis, Mailpit)
docker-compose up -d

# Run database migrations
cd database && npm run migrate

# Seed demo data
cd database && npm run seed

# Start backend (port 3001)
cd backend && npm run dev

# Start frontend (port 5173)
cd frontend && npm run dev
```

## Environment Variables

Backend (`backend/.env`):
```
TIDB_HOST, TIDB_PORT, TIDB_USER, TIDB_PASSWORD, TIDB_DATABASE
REDIS_URL
ELASTICSEARCH_URL
ANTHROPIC_API_KEY
JWT_SECRET, JWT_REFRESH_SECRET
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET
```

Frontend (`frontend/.env`):
```
VITE_API_URL=http://localhost:3001
```

## Key Design Decisions

1. **No real-time web search**: External data comes from scheduled crawlers, not live search
2. **Stance is relative**: Same evidence can be pro/con/neutral depending on the issue context
3. **Evidence confidence**: 4-factor scoring (sourceReliability, dataFreshness, sampleSize, methodology)
4. **Decision confidence**: 6-dimension weighted calculation
5. **Degradation strategy**: Reasoning engine handles evidence imbalance gracefully (standard → degraded → single_side → refused)
6. **Closed-loop learning**: Review outcomes can generate new evidence, feeding back into the system

## Documentation

- `docs/00-产品架构总览.md` — Product architecture overview (v3.1)
- `docs/01-功能模块拆解.md` — Detailed module breakdown (12 modules)
- `docs/02-数据模型设计.md` — Database schema design + migration scripts
- `docs/03-API设计文档.md` — Complete RESTful API specification
- `docs/04-实施路线图.md` — 5-phase implementation roadmap (~7 weeks)
- `docs/05-登录注册产品规划.md` — Auth system product spec
- `docs/prd/M1-议题管理模块PRD.md` — Issue management detailed PRD
