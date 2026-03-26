---
stepsCompleted: [step-01-init, step-02-discovery, step-02b-vision, step-02c-executive-summary, step-03-success, step-04-journeys, step-05-domain, step-06-innovation, step-07-project-type, step-08-scoping, step-09-functional, step-10-nonfunctional, step-11-polish, step-12-complete, step-e-01-discovery, step-e-02-review, step-e-03-edit]
inputDocuments:
  - _bmad-reversed-docs/product-brief.md
  - _bmad-reversed-docs/research/technical-pinchy-research-2026-03-26.md
  - _bmad-reversed-docs/project-docs/project-overview.md
  - _bmad-reversed-docs/project-docs/api-contracts.md
  - _bmad-reversed-docs/project-docs/data-models.md
  - CLAUDE.md
  - git log (sha/reverse branch, 54 commits since main divergence)
workflowType: 'prd'
workflow: 'edit'
classification:
  projectType: saas_b2b
  domain: enterprise_ai_governance
  complexity: high
  projectContext: brownfield
documentCounts:
  briefCount: 1
  researchCount: 1
  brainstormingCount: 0
  projectDocsCount: 3
lastEdited: '2026-03-26'
editHistory:
  - date: '2026-03-26'
    changes: 'Added Telegram integration (FR63-FR72), Skills Hub (FR73-FR76), chat UI enhancements (FR77-FR79), session migration (FR80), z.ai provider, NFR23-26 for OpenClaw config reliability, 2 new user journeys, updated scope/permissions/innovation sections'
  - date: '2026-03-26'
    changes: 'Post-validation edits: Added Journey 8 (Skills Hub), added EU AI Act Article 19(1)(d) and GDPR Articles 17/25/35 references, added SOC 2/ISO 27001 posture, cleaned implementation leakage from FR7/FR9/FR14/FR30/FR48/FR50 and NFR23/NFR25/NFR26, removed FR80 (reclassified as migration task)'
---

# Product Requirements Document - Pinchy

**Author:** Max
**Date:** 2026-03-26
**Last Edited:** 2026-03-26
**Status:** Reverse-engineered from production codebase, updated to reflect `sha/reverse` branch (725+ commits)

## Executive Summary

Pinchy is the enterprise governance layer for the OpenClaw AI agent runtime. It wraps the most popular open-source agent runtime (247K GitHub stars) with the controls that regulated organizations require: allow-list agent permissions, HMAC-SHA256 signed audit trails, invite-based user management, group-based access control, usage tracking, and full data sovereignty through self-hosted Docker Compose deployment.

The platform targets IT leaders and CTOs at EU-regulated enterprises (50-500 employees) in financial services, healthcare, legal, and government sectors where data cannot leave company infrastructure. Cloud AI platforms (Dust, Glean, Copilot Studio) are eliminated by data sovereignty requirements. Workflow builders (n8n, Dify) lack autonomous agent governance. Agent frameworks (CrewAI, LangChain) are libraries without deployment, UI, or permissions. OpenClaw itself has no concept of teams, permissions, or audit.

Pinchy does not replace OpenClaw -- it governs it. The platform operates as a WebSocket bridge between browser clients and the OpenClaw Gateway, intercepting every interaction to enforce permission checks and audit logging. Multi-channel delivery is supported: agents are accessible via web UI and Telegram, with unified sessions across channels via identity links. A private Skills Hub enables admins to create and manage reusable prompt-based skills. A user goes from `docker compose up` to first agent conversation in under 10 minutes.

### What Makes This Special

No competitor offers the combination of self-hosted + open-source (AGPL-3.0) + agent-level RBAC + cryptographic audit trail + multi-channel agent delivery (web + Telegram) + model-agnostic deployment built on top of the most popular agent runtime.

The core differentiator is the allow-list permission model: agents start with zero tools and are explicitly granted specific capabilities by administrators. This aligns with the emerging zero-trust AI agent security standards (Microsoft ZT4AI, Cisco agent identity framework) that the industry is converging on. Safe tools (list/read approved directories) are separated from powerful tools (shell, write, web) -- the same tiered permission model recommended by the Cloud Security Alliance.

The HMAC-SHA256 signed audit trail provides cryptographic tamper evidence for every admin action, with CSV export and integrity verification. This is designed to meet EU AI Act Article 19 retention requirements (6+ months) and GDPR audit expectations -- a compliance posture that cloud-hosted competitors cannot replicate for on-premises data.

## Project Classification

- **Project Type:** SaaS B2B (self-hosted enterprise platform)
- **Domain:** Enterprise AI agent governance
- **Complexity:** High (regulated industries, cryptographic security, real-time WebSocket communication, multi-user agent permissions)
- **Project Context:** Brownfield -- production-ready core with 671 commits, 167 test files, 20 database migrations, and Docker Compose deployment

## Success Criteria

### User Success

- Time from `docker compose up` to first agent conversation: under 10 minutes
- New users complete Smithers onboarding interview and have personalized context saved automatically
- Knowledge workers interact with agents without understanding OpenClaw, Docker, or underlying infrastructure
- Administrators configure agent permissions, create invites, and review audit logs through the web UI without CLI access

### Business Success

- Active users per deployment: 10+ per organization (targeting team adoption, not individual use)
- Enterprise license conversions (ES256 JWT gated features: groups, restricted visibility)
- Deployments in regulated industries (finance, healthcare, legal) where cloud platforms are eliminated
- Community growth: GitHub stars, contributor count, documentation engagement at docs.heypinchy.com

### Technical Success

- Audit trail integrity: zero undetected tampering across all deployments (HMAC-SHA256 verification passes)
- Zero data exfiltration: all data remains on customer infrastructure (self-hosted, no phone-home, no telemetry)
- OpenClaw compatibility: seamless upgrades when OpenClaw releases new versions (wrapper, not fork)
- Test coverage: 167 test files across API routes (42), lib functions (40), components (35), security (4), server (5), and 4 E2E specs

### Measurable Outcomes

- Setup wizard completion rate: 100% of first-run deployments result in working admin account + configured provider
- Agent permission enforcement: zero unauthorized tool executions (allow-list model verified by test suite)
- Invite flow completion: token generation, email delivery, claim, account creation, personal agent seeding -- end-to-end verified by 16 test assertions
- Audit log integrity verification: recompute HMACs for all rows and confirm zero mismatches
- Telegram pairing flow completion: QR scan → pairing code → identity link created → cross-channel sessions active
- Cross-channel session unification: web and Telegram conversations share same message history per agent-user pair

## Product Scope

### MVP - Minimum Viable Product (Implemented)

The entire MVP is implemented and in production:

- Setup wizard with admin creation and provider configuration
- Email/password authentication with DB sessions
- Provider configuration (Anthropic, OpenAI, Google, z.ai/Zhipu AI) with encrypted API key storage
- Real-time agent chat via WebSocket bridge to OpenClaw
- Agent permissions (allow-list tool model)
- Knowledge Base agents with scoped read-only file access
- User management with invite system
- Personal and shared agents
- Smithers onboarding interview
- Audit trail with HMAC-SHA256 signing
- Usage tracking with cost estimation
- Telegram channel integration (bot setup, agent binding, user pairing with QR codes, multi-bot support, cross-channel session unification via identity links)
- Private Skills Hub (CRUD and management page)
- Slash command autocomplete and quick-action popover in chat composer
- Docker Compose deployment (3-service stack)

### Growth Features (Post-MVP)

- Granular RBAC (per-team, per-role permissions beyond admin/member)
- SSO/SAML integration (enterprise procurement requirement)
- Plugin marketplace (extending beyond pinchy-files and pinchy-context)
- Additional channel integrations (Slack, email -- Telegram implemented, others planned)
- Additional provider integrations (Groq, Ollama, custom OpenAI-compatible endpoints -- partially implemented)

### Vision (Future)

- Cross-channel workflows (input on email, output on Slack -- properly routed and permissioned)
- Agentic RBAC with context-aware, time-bound permission evaluation
- SOC 2 Type II and ISO 27001 compliance certification
- Plugin marketplace with scoped permissions and audit integration

## User Journeys

### Journey 1: First-Time Admin Setup (Happy Path)

**Maria, CTO at a 200-person financial services firm in Vienna.** Her compliance officer has rejected every cloud AI platform. She needs AI agents for her team but cannot send data off-premises.

Maria provisions a Linux server, clones the Pinchy repository, and runs `docker compose up`. The setup wizard appears. She creates her admin account (name, email, password with 8+ character minimum). She configures her Anthropic API key -- the system validates it against the provider's models endpoint before accepting it. Smithers, her personal AI assistant, greets her and conducts an onboarding interview, learning about her and her organization through conversation. The context is saved via plugin tools. Maria is ready to create her first shared agent and invite her team.

**Capabilities revealed:** Setup wizard, provider validation, admin creation, Smithers auto-creation, onboarding interview, organization context collection.

### Journey 2: Team Member Onboarding (Invite Flow)

**Thomas, a financial analyst on Maria's team.** Maria generates an invite token from the admin panel -- 32 random bytes (hex), SHA256 hashed for DB storage, 7-day TTL. Thomas receives the invite link, enters his name, email, and password. His account is created, his personal Smithers agent is auto-seeded, and he is assigned to the "Analysts" group that Maria pre-configured. Smithers greets Thomas and conducts a personal onboarding interview. Thomas's user context is saved for future agent interactions.

**Capabilities revealed:** Invite token generation, token claim, personal agent seeding, group assignment on invite, Smithers onboarding, user context storage.

### Journey 3: Knowledge Worker Using Agents (Daily Use)

**Thomas opens the Pinchy web UI.** He sees his personal Smithers agent and three shared agents: "Company KB" (knowledge base), "Research Assistant" (custom), and "Code Helper" (custom). The Company KB agent has read-only access to `/data/company-docs/` via the pinchy-files plugin. Thomas asks the KB agent about the company's travel policy. He types `/` in the chat composer and sees autocomplete suggestions for available slash commands. The agent uses `pinchy_ls` to list files and `pinchy_read` to retrieve the relevant document. Responses stream in real-time via WebSocket. Thomas can also message the same agent via Telegram -- sessions are unified across web and Telegram via identity links. Token usage is recorded per session for cost tracking.

**Capabilities revealed:** Agent listing (personal + shared), knowledge base file access, streaming chat, slash command autocomplete, tool execution, cross-channel session unification, usage recording.

### Journey 4: Admin Managing Agent Permissions (Governance)

**Maria needs to give the Research Assistant agent web search capability.** She opens the agent settings. The agent currently has zero tools (allow-list model). She grants `web_search` from the tool registry. The tool deny groups are automatically recomputed (inverted for OpenClaw config). She sets the agent's visibility to "restricted" and assigns it to the "Analysts" group. An audit log entry records every change: who, what, when, with before/after diffs for visibility and group assignments. Thomas can now see and use the Research Assistant; colleagues outside the Analysts group cannot.

**Capabilities revealed:** Tool allow-list management, tool deny group computation, visibility control, group-based access, audit logging with structured diffs.

### Journey 5: Admin Reviewing Audit Trail (Compliance)

**Maria's compliance officer requests evidence of AI agent governance.** Maria opens the audit trail in the admin panel. She filters by event type (`agent.updated`, `auth.login`), actor, and date range. Each row shows actor, event type, resource, structured detail (JSON), and timestamp. She verifies audit integrity -- the system recomputes HMAC-SHA256 signatures for all rows and confirms zero mismatches. She exports the filtered log as CSV for the compliance report.

**Capabilities revealed:** Audit log querying, event type filtering, HMAC integrity verification, CSV export.

### Journey 6: Admin Configuring Telegram Channel (Channel Setup)

**Maria wants her team to interact with agents via Telegram.** She navigates to Settings → Telegram. A guided setup flow walks her through creating a bot via BotFather (with step-by-step instructions). She pastes the bot token -- the system validates it via Telegram's `getMe` API before accepting. The bot username and display name are confirmed. Maria then opens Agent Settings → Channels for the "Company KB" agent and connects the Telegram bot. The system generates OpenClaw config with session bindings and channel configuration. The config file is written; OpenClaw's file watcher detects the change and hot-reloads. Maria can configure multiple bots for different agents (multi-bot support). Each connection/disconnection is logged to the audit trail.

**Capabilities revealed:** BotFather-guided setup, bot token validation via getMe, agent-to-channel binding, OpenClaw config generation with file-based hot-reload, multi-bot management, audit logging for channel changes.

### Journey 7: User Linking Telegram Account (Cross-Channel)

**Thomas wants to message agents from Telegram.** He opens his Profile → Telegram settings. A QR code is displayed linking to the Pinchy Telegram bot. Thomas scans the QR code, opening a conversation with the bot in Telegram. The UI shows a 6-digit pairing code (10-minute TTL) and an example of what to send. Thomas sends the pairing code to the bot. Pinchy validates the code, creates an identity link in the `channelLinks` table mapping Thomas's Telegram user ID to his Pinchy account. The identity link is injected into OpenClaw config as `identityLinks`, enabling session unification. Thomas can now message any Telegram-connected agent and see the same conversation history as in the web UI. His Telegram user ID is added to the native allow-from store (atomic file write) so the bot accepts his messages.

**Capabilities revealed:** QR code pairing flow, 6-digit pairing codes with TTL, identity link creation, cross-channel session unification via identityLinks, native allow-from store management, atomic credential file writes.

### Journey 8: Managing and Using Skills (Skills Hub)

**Maria wants to create reusable prompt-based skills for her team.** She opens the Skills Hub from the sidebar navigation. She creates a new skill called "Summarize Contract" with a description and a prompt template that instructs agents to extract key terms, obligations, and deadlines from legal documents. The skill is saved and immediately available. She creates two more skills: "Draft Email Reply" and "Translate to German."

Thomas opens the Skills Hub and browses available skills. He finds "Summarize Contract" and reads its description. In a chat session with the Company KB agent, Thomas selects the skill -- the prompt is injected into his message. He pastes a contract excerpt and the agent produces a structured summary following the skill's template. Maria later edits the "Summarize Contract" skill to refine the prompt based on team feedback. She deletes the "Translate to German" skill that the team no longer uses.

**Capabilities revealed:** Skill creation with name/description/content, skill browsing and discovery, skill invocation in chat, skill editing and deletion, Skills Hub management page.

### Journey Requirements Summary

| Journey | Primary Capability Areas |
|---------|------------------------|
| Admin Setup | Setup wizard, provider config, admin creation, Smithers onboarding |
| Team Onboarding | Invites, token management, user creation, group assignment |
| Daily Agent Use | Agent chat, knowledge base, streaming, slash commands, cross-channel sessions, usage tracking |
| Permission Management | Tool allow-list, visibility, groups, audit logging |
| Compliance Review | Audit querying, integrity verification, CSV export |
| Telegram Channel Setup | BotFather guided setup, bot validation, agent binding, multi-bot, config hot-reload |
| Telegram Account Linking | QR code pairing, pairing codes, identity links, cross-channel session unification |
| Skills Hub | Skill creation, browsing, invocation in chat, editing, deletion |

## Domain-Specific Requirements

### Compliance and Regulatory

- **EU AI Act Article 19(1)(d)**: Audit trail retention for 6+ months. All AI agent actions must be traceable to a human actor. Logging records must include timestamps, actor identification, and action descriptions per Article 19(1)(d) record-keeping requirements.
- **GDPR Compliance**:
  - **Article 17 (Right to erasure)**: User deactivation soft-deletes personal data; audit trail retains anonymized action records for compliance.
  - **Article 25 (Data protection by design)**: Self-hosted architecture ensures data never leaves customer infrastructure. No cross-border data transfer. Encryption at rest for sensitive values.
  - **Article 35 (DPIA)**: Platform design supports Data Protection Impact Assessments — all data processing is local, auditable, and under customer control.
  - Session data has defined expiry (7-day sessions with 1-day refresh window). No phone-home, no telemetry unless opt-in.
- **Data sovereignty**: Full offline capability with local models via Ollama. No external service dependencies after initial setup.
- **SOC 2 / ISO 27001**: Not yet certified. Architecture designed to support future certification — encrypted storage, signed audit trail, role-based access, session management, and non-root container execution align with SOC 2 Trust Service Criteria and ISO 27001 Annex A controls.

### Technical Constraints

- **Cryptographic audit integrity**: HMAC-SHA256 row signing with canonical JSON sorting. Any modification to audit data is detectable.
- **Encryption at rest**: AES-256-GCM for API keys stored in the settings table. Encryption key management via ENV var > File (mode 0o600) > Auto-generate.
- **Path traversal prevention**: `realpath` validation prevents knowledge base agents from accessing files outside their allowed directories.
- **Token security**: 32 random bytes (hex) for invite tokens, SHA256 hashed before DB storage. Timing-safe comparison for gateway authentication.

### Integration Requirements

- **OpenClaw Gateway**: WebSocket bridge to OpenClaw runtime (single-port Gateway carrying HTTP + WebSocket on port 12345). Pinchy connects as a client, not a fork.
- **OpenClaw Plugins**: Three custom plugins (pinchy-files, pinchy-context, pinchy-audit) communicate back to Pinchy via internal HTTP API (`/api/internal/*`) authenticated by gateway token.
- **OpenClaw Config Management**: File-based config generation (Pinchy writes `openclaw.json`, OpenClaw detects via file watcher and hot-reloads). Config write deduplication prevents unnecessary restarts. Startup config push closes the gap when OpenClaw starts before Pinchy writes config.
- **OpenClaw Credential Store**: Native allow-from store (`telegram-allowFrom.json`) managed via atomic file writes for Telegram pairing without triggering config restarts.
- **Telegram Bot API**: Bot token validation via `getMe` endpoint. Bot-to-agent channel bindings in OpenClaw config. Identity links for cross-channel session unification.
- **Provider APIs**: Anthropic, OpenAI, Google (Gemini), z.ai (Zhipu AI) model listing and validation endpoints for API key verification and dynamic model discovery.

### Risk Mitigations

- **OpenClaw upstream changes**: Pinchy wraps and extends, never forks. OpenClaw 3.0's agent pool architecture validates this approach.
- **Enterprise feature degradation**: When enterprise license expires, restricted visibility gracefully degrades to "all" (agents become visible to everyone rather than breaking).
- **Plugin retry logic**: 2 retries for audit POST to internal API. Usage recording is fire-and-forget (non-blocking chat).
- **Telegram config stability**: Evolved from RPC-based `config.patch` to file-based config generation for reliability. Config hash conflict retry for concurrent updates. Debounced writes prevent rapid restart loops.

## Innovation and Novel Patterns

### Detected Innovation Areas

- **Allow-list agent permissions**: Agents start with zero tools. This inverts the traditional deny-list approach and aligns with zero-trust AI security standards published by Microsoft, Cisco, and the Cloud Security Alliance in 2026.
- **Cryptographic audit trail for AI agents**: HMAC-SHA256 signed rows with canonical JSON sorting. No competing open-source platform offers row-level tamper evidence for AI agent actions.
- **Smithers onboarding interview**: AI-driven user context collection through conversation rather than forms. The context is injected into all subsequent agent prompts via workspace files.

### Market Context and Competitive Landscape

| Dimension | Pinchy | Nearest Alternative |
|-----------|--------|-------------------|
| Data sovereignty | Fully self-hosted, offline-capable | n8n/Dify self-host but lack agent governance |
| Agent permissions | Allow-list (zero tools by default) | Copilot Studio has controls but is cloud-only |
| Audit trail | HMAC-SHA256 signed, CSV export, integrity verification | Dust/StackAI have logs but are cloud-hosted |
| Agent runtime | OpenClaw (247K stars, autonomous reasoning) | Dify/n8n use visual workflows, not agent loops |
| Multi-channel | Web + Telegram with unified sessions via identity links | Competitors offer single-channel or require separate config |
| Model support | Any provider or local models via Ollama | Copilot Studio / Gemini Enterprise are vendor-locked |
| License | AGPL-3.0 (prevents proprietary cloud forks) | n8n fair-code, Dify open-source, others proprietary |

### Validation Approach

- Allow-list model validated by test suite: agents with no allowed tools cannot execute any tool calls
- Audit trail integrity verified by recomputing HMACs for all rows via `/api/audit/verify`
- 167 test files covering all critical paths

### Risk Mitigation

- If OpenClaw changes its plugin API: Pinchy's plugins are minimal (3 plugins, each under 200 LOC) and can be adapted quickly
- If enterprise customers need features beyond current RBAC: the group-based access model is extensible to per-team/per-role granular RBAC

## SaaS B2B Specific Requirements

### Project-Type Overview

Pinchy is a self-hosted SaaS B2B platform deployed via Docker Compose. Unlike typical SaaS, the deployment model is on-premises -- customers run their own instance. The platform serves teams of 10-500 users within a single organization.

### Technical Architecture Considerations

- **Custom server.ts**: Extends Next.js 16 with a WebSocket server on the same HTTP port (7777). Manages OpenClaw client connections, session authentication, and rate limiting.
- **WebSocket Bridge Pattern**: Browser clients connect to `/api/ws`. The `ClientRouter` authenticates the session, checks agent access permissions, then proxies messages to OpenClaw via `openclaw-node`.
- **Plugin Architecture**: Three OpenClaw plugins run inside the OpenClaw container and communicate back to Pinchy via internal HTTP API (`/api/internal/*`).
- **Migration-on-Startup**: Drizzle migrations run automatically via `server-preload.cjs` before the app starts. 20 migration files in production.
- **Settings as Key-Value**: Application settings stored in `settings` table with optional AES-256-GCM encryption for sensitive values.
- **Channel Architecture**: Telegram bots configured in settings, bound to agents via channel config. OpenClaw config generated with channels, session bindings, and identity links. File-based hot-reload (write JSON → file watcher → restart). Native credential store for allow-from (avoids config restarts for user pairing).

### Multi-Tenancy Model

Single-tenant deployment (one Docker Compose stack per organization). Multi-user within the tenant via Better Auth sessions and admin/member roles.

### Permission Matrix

| Action | Admin | Member |
|--------|-------|--------|
| Create shared agents | Yes | No |
| Update shared agents | Yes | No |
| Delete shared agents | Yes | No |
| Create/manage personal agents | Auto-created | Auto-created |
| View shared agents (visibility: all) | Yes | Yes |
| View shared agents (visibility: restricted) | Yes | Only if in assigned group |
| Read/write agent workspace files | All agents | Personal + visible shared |
| Invite users | Yes | No |
| Manage groups | Yes | No |
| View audit trail | Yes | No |
| View usage dashboards | Yes | No |
| Configure providers | Yes | No |
| Change user roles | Yes (with last-admin protection) | No |
| Update own profile/password | Yes | Yes |
| Configure Telegram bots | Yes | No |
| Connect Telegram to agents | Yes | No |
| Link own Telegram account | Yes | Yes |
| Manage skills | Yes | Yes |

### Subscription and Licensing

- **Community Edition**: Full platform, AGPL-3.0 licensed
- **Enterprise Edition**: ES256 JWT signed license key gates enterprise features (groups, restricted agent visibility)
- Feature check: `GET /api/enterprise/status` returns license validity and feature flags
- Graceful degradation: expired license reverts restricted agents to "all" visibility

### Implementation Considerations

- **Docker Compose Stack**: 3 services (Pinchy web app, OpenClaw runtime, PostgreSQL 17) with health checks
- **Non-root execution**: Pinchy container runs as `pinchy:pinchy` user
- **Development mode**: `docker-compose.dev.yml` override enables hot reload, exposed DB port
- **CI/CD**: GitHub Actions pipeline with lint, format, test, build, E2E, Docker smoke, SBOM generation (Syft), docs deployment

## Project Scoping and Phased Development

### MVP Strategy and Philosophy

**MVP Approach:** Platform MVP -- deliver the complete governance layer that makes OpenClaw deployable in enterprise environments. The MVP must solve the full problem (auth + permissions + audit + deployment) because partial governance is no governance.

### MVP Feature Set (Phase 1) -- Implemented

**Core User Journeys Supported:**
- Admin setup and onboarding
- Team member invitation and onboarding
- Daily agent chat with streaming responses
- Agent permission management (allow-list)
- Audit trail review and export
- Usage monitoring

**Must-Have Capabilities:**
- Setup wizard, authentication, provider configuration
- Agent CRUD with template-based creation
- Allow-list tool permissions
- Knowledge Base agents with scoped file access
- User management with invite system
- Group-based agent access control
- HMAC-SHA256 audit trail
- Usage tracking with cost estimation
- Docker Compose deployment

### Post-MVP Features (Phase 2)

- Granular RBAC (per-team, per-role beyond admin/member)
- SSO/SAML integration
- Plugin marketplace
- Additional provider integrations
- Advanced usage analytics

### Phase 3 (Expansion)

- Cross-channel workflows (email to Slack routing)
- Agentic RBAC with context-aware permissions
- Compliance certifications (SOC 2 Type II, ISO 27001)
- Multi-tenant cloud offering (managed hosting option)

### Risk Mitigation Strategy

- **Technical risk**: OpenClaw API changes -- mitigated by wrapper architecture (not fork) and minimal plugin surface area
- **Market risk**: Enterprise sales cycle length -- mitigated by open-source community adoption creating bottom-up demand
- **Resource risk**: Single-developer project -- mitigated by TDD discipline, comprehensive test suite (167 files), and CI gates

## Functional Requirements

### Setup and Onboarding

- **FR1**: First-time setup wizard creates initial admin user
  - AC: Returns 201 with user data on success; returns 400 for missing/invalid name, email, or short password; returns 403 when setup already complete
- **FR2**: Setup status check reports DB connectivity, OpenClaw health, and provider configuration state
  - AC: Returns composite status object; unauthenticated endpoint
- **FR3**: Provider configuration validates API key against provider's models endpoint before accepting
  - AC: Calls provider models endpoint; rejects invalid keys; stores encrypted key on success
- **FR4**: Smithers personal agent auto-created for every new user
  - AC: `seedDefaultAgent` called with ownerId; sets `isPersonal: true`; returns existing agent if one exists; calls `ensureWorkspace`
- **FR5**: Smithers onboarding interview collects user context via conversation using pinchy-context plugin
  - AC: Context saved via `PUT /api/internal/users/{userId}/context`; authenticated by gateway token
- **FR6**: Admin onboarding additionally collects organization context
  - AC: Org context saved via `PUT /api/internal/settings/context`; only triggered for admin users

### Authentication and Sessions

- **FR7**: Email/password authentication with admin and member roles
  - AC: Authentication framework handles sign-up, sign-in, sign-out, session via catch-all route
- **FR8**: DB-backed sessions with 7-day expiry and 1-day refresh window
  - AC: Session stored in `session` table with `expires_at`; refresh within window extends session
- **FR9**: Secure password hashing with legacy hash migration support
  - AC: New passwords use current hashing algorithm; existing legacy-hashed passwords verified and migrated transparently on login
- **FR10**: Login/logout events logged to audit trail (auth.login, auth.failed, auth.logout)
  - AC: `appendAuditLog` called with correct event type for each auth event
- **FR11**: Password change (self-service) via `PATCH /api/users/me/password`
  - AC: Requires current password verification; minimum 8-character new password
- **FR12**: WebSocket session validation from cookie headers on connection upgrade
  - AC: Session cookie parsed and validated; invalid/expired sessions rejected

### User Management

- **FR13**: Invite-based user onboarding with 7-day token TTL
  - AC: Returns 400 for missing token/password/name; returns 410 for expired/invalid/claimed tokens; returns 201 and creates user on success
- **FR14**: Invite tokens: cryptographically secure random tokens, hashed before DB storage
  - AC: Raw token returned to admin; only hash stored in database
- **FR15**: Admin can generate password reset tokens using the same invite flow with type "reset"
  - AC: Reset type does not create personal agent; updates existing user's password; returns 404 for unknown user
- **FR16**: List all users with group memberships (admin only)
  - AC: Returns 401 for unauthenticated; returns 403 for non-admin; returns user list with groups
- **FR17**: Update user role (admin/member) with last-admin protection
  - AC: Cannot demote the last remaining admin; returns 400 if attempted
- **FR18**: Deactivate user (soft-delete via `banned` flag, soft-delete personal agents)
  - AC: Sets `banned: true`; soft-deletes user's personal agents; preserves audit/usage history
- **FR19**: Reactivate deactivated user via `POST /api/users/{userId}/reactivate`
  - AC: Clears ban; does not automatically restore soft-deleted agents
- **FR20**: User self-profile update (name) via `PATCH /api/users/me`
  - AC: Updates display name; does not allow email or role changes
- **FR21**: User personal context (markdown notes) injected into agent prompts via USER.md workspace file
  - AC: Context retrievable via `GET /api/users/me/context`; written to agent workspace files

### Agent Management

- **FR22**: Create shared agents (admin only) via `POST /api/agents`
  - AC: Returns 403 for non-admin; creates agent with owner set to current user; rejects name >30 characters
- **FR23**: Create personal agents -- auto-created on user signup via `seedDefaultAgent`
  - AC: `isPersonal: true`; `ownerId` set to user ID; default name "Smithers"
- **FR24**: Agent templates: Knowledge Base (pinchy_ls/pinchy_read tools + pinchy-files plugin) and Custom
  - AC: KB template sets allowed tools from template; requires `allowed_paths` in plugin config; rejects unknown templates
- **FR25**: Update agent (name, model, tools, visibility, groups) with RBAC
  - AC: Admin can update all fields; members can only update personal agents; visibility changes logged to audit
- **FR26**: Delete shared agent (admin only, soft-delete via `deleted_at` timestamp)
  - AC: Sets `deleted_at`; agent excluded from `active_agents` view; preserves usage/audit references
- **FR27**: Agent workspace files (SOUL.md, AGENTS.md, IDENTITY.md, USER.md, ONBOARDING.md)
  - AC: Files written to agent workspace directory; SOUL.md from personality preset; AGENTS.md generated dynamically
- **FR28**: Read/write agent workspace files via API (`GET /api/agents/{agentId}/files/{filename}`)
  - AC: Admins access all agents; members access personal + visible shared only
- **FR29**: Agent personality presets (butler, professor, etc.) with greeting messages
  - AC: Preset sets `greetingMessage` and `avatarSeed`; writes SOUL.md from preset content
- **FR30**: Procedural agent avatar generation from seed
  - AC: Avatar seed generated during agent creation; seed stored for deterministic avatar rendering
- **FR31**: Agent greeting message and tagline
  - AC: Uses tagline from request body when provided; falls back to template `defaultTagline`
- **FR32**: Dynamic AGENTS.md generation with allowed_paths for knowledge base agents
  - AC: Includes allowed paths in AGENTS.md; includes pinchy_ls usage instructions; written only when template has `defaultAgentsMd`
- **FR33**: List visible agents (personal + shared matching visibility rules) via `GET /api/agents`
  - AC: Returns personal agents + shared agents where visibility is "all" or user is in assigned group

### Agent Permissions and Access Control

- **FR34**: Allow-list tool model -- agents start with zero tools, admins grant specific ones
  - AC: `allowed_tools` defaults to empty array `[]`; agent cannot execute tools not in allow-list
- **FR35**: Tool registry: safe tools (pinchy_ls, pinchy_read) vs powerful tools (shell, fs, web)
  - AC: Tool categorization enforced in agent creation and update flows
- **FR36**: Tool deny groups computed from allowed tools (inverted for OpenClaw config)
  - AC: OpenClaw receives deny groups that block everything except explicitly allowed tools
- **FR37**: Agent visibility: "all" (everyone) or "restricted" (group-based)
  - AC: Admin can set to "all" or "restricted" with groupIds; invalid value returns 400; cannot change on personal agents
- **FR38**: Group-based agent access control -- restricted agents visible only to users in assigned groups
  - AC: Setting groupIds updates `agent_groups` join table; members not in group cannot see agent
- **FR39**: Admins can read/write all agents; members limited to personal + visible shared
  - AC: 403 returned when member attempts to access restricted agent they are not assigned to
- **FR40**: Access denial logged to audit trail
  - AC: `appendAuditLog` called with denial event when access check fails

### Group Management (Enterprise)

- **FR41**: Create groups with name and description via `POST /api/groups`
  - AC: Admin only; returns 403 for non-admin; creates group record
- **FR42**: Update group name/description via `PATCH /api/groups/{groupId}`
  - AC: Admin only; audit log records changes
- **FR43**: Delete group via `DELETE /api/groups/{groupId}`
  - AC: Admin only; cascades to `user_groups` and `agent_groups` join tables
- **FR44**: Add/remove group members via `PUT /api/groups/{groupId}/members`
  - AC: Accepts array of userIds; updates `user_groups` table; audit log records added/removed members with `{id, name}` pairs
- **FR45**: Assign/unassign agents to groups (via agent visibility update)
  - AC: groupIds in agent PATCH update `agent_groups` table; audit log records changes

### Real-Time Agent Chat

- **FR46**: WebSocket bridge routes browser messages to OpenClaw Gateway
  - AC: Client connects to `ws://host:7777/api/ws`; session cookie validated on upgrade; messages proxied to OpenClaw
- **FR47**: Extra system prompt injection (user name + user context + agent greeting)
  - AC: USER.md contains user context; IDENTITY.md contains agent identity; injected into OpenClaw session
- **FR48**: Streaming response chunks from OpenClaw to browser
  - AC: Server sends incremental content chunks to client; stream ends with completion signal including usage data
- **FR49**: Message history fetch from OpenClaw sessions
  - AC: Server sends `{type: "history", messages: [...]}` on reconnect
- **FR50**: Unique session per agent-user pair
  - AC: Each agent-user combination has a dedicated persistent session; sessions persist across reconnections
- **FR51**: First-visit detection with greeting fallback
  - AC: If no message history exists, greeting message from agent config is displayed

### Provider and Model Configuration

- **FR52**: Multi-provider support: Anthropic, OpenAI, Google (Gemini), z.ai (Zhipu AI)
  - AC: Provider type stored in settings; API key encrypted with AES-256-GCM; z.ai uses Zhipu AI models endpoint for validation
- **FR53**: API key validation by calling provider's models endpoint
  - AC: Invalid key rejected before storage; provider-specific endpoint called
- **FR54**: Dynamic model list fetching with 1-hour cache
  - AC: `GET /api/providers/models` returns cached list; cache invalidated after 1 hour
- **FR55**: Default model selection per provider (Haiku for Anthropic, gpt-4o-mini for OpenAI, gemini-2.5-flash for Google)
  - AC: `getDefaultModel` selects appropriate model based on configured provider
- **FR56**: Provider removal with agent migration to remaining provider
  - AC: Agents using removed provider's models are migrated to new provider's default model

### Audit Trail

- **FR57**: Every admin state-change logged with actor, event type, resource, detail (JSON), timestamp
  - AC: `appendAuditLog` called in all POST/PUT/PATCH/DELETE handlers; detail contains `{id, name}` entity references
- **FR58**: HMAC-SHA256 row signing with canonical JSON sorting
  - AC: `row_hmac` computed from timestamp, actor_type, actor_id, event_type, resource, detail; canonical JSON ensures deterministic signing
- **FR59**: Audit trail integrity verification via `POST /api/audit/verify`
  - AC: Returns 403 for non-admin; recomputes HMACs; returns `{valid: true}` or list of invalid row IDs; supports fromId/toId range parameters
- **FR60**: CSV export of audit log with filtering via `GET /api/audit/export`
  - AC: Admin only; supports event type and date range filters; returns CSV with all audit fields

### Usage Tracking (Enterprise)

- **FR61**: Token usage recording per session (input, output, cache tokens, estimated cost)
  - AC: Usage record created with `user_id`, `agent_id`, `agent_name` (snapshot), `session_key`, `model`, token counts, `estimated_cost_usd`
- **FR62**: Usage dashboards: by-agent summary, by-user, timeseries, CSV/JSON export
  - AC: `GET /api/usage/summary` returns aggregated per-agent data; supports `?days=7|30|0|all` and `?agentId=` filters; returns 401 for unauthenticated; returns 403 for non-admin; returns 400 for invalid days; returns empty array when no data

### Telegram Channel Configuration (Admin)

- **FR63**: Admin configures Telegram bot token via guided BotFather setup flow at `POST /api/settings/telegram`
  - AC: Bot token validated via Telegram `getMe` API before accepting; stores bot username, display name; rejects invalid tokens with descriptive error; audit log records `settings.telegram_configured`
- **FR64**: List all configured Telegram bots via `GET /api/settings/telegram/bots`
  - AC: Returns 401 for unauthenticated; returns 403 for non-admin; returns array of `{botToken, botUsername, botDisplayName}`
- **FR65**: Global Telegram configuration status via `GET /api/settings/telegram/all`
  - AC: Returns combined bot config + agent channel bindings + linked user count; admin only

### Telegram Agent Channels

- **FR66**: Connect Telegram bot to agent via `PUT /api/agents/{agentId}/channels/telegram`
  - AC: Admin only; validates bot token exists in settings; generates OpenClaw config with channel and session bindings; writes config file (OpenClaw hot-reloads via file watcher); audit log records `channel.configured` with agent and bot details
- **FR67**: Disconnect Telegram bot from agent via `DELETE /api/agents/{agentId}/channels/telegram`
  - AC: Admin only; removes channel config from OpenClaw config; removes session bindings; audit log records `channel.deleted` with agent name
- **FR68**: Agent-to-channel session bindings generated in OpenClaw config
  - AC: Binding format maps agent ID to Telegram channel; enables OpenClaw to route Telegram messages to correct agent

### Telegram User Account Linking

- **FR69**: Pairing code generation for Telegram account linking (6-digit code, 10-minute TTL)
  - AC: Code generated per user request; stored with expiry; single-use (consumed on successful pairing)
- **FR70**: User links Telegram account by sending pairing code to bot
  - AC: QR code displayed in Profile → Telegram settings linking to bot; user sends code in Telegram; system validates code and creates identity link
- **FR71**: Identity links stored in `channelLinks` table, injected into OpenClaw config as `identityLinks`
  - AC: Maps Telegram user ID to Pinchy user ID; enables cross-channel session unification (web and Telegram share same agent sessions)
- **FR72**: Telegram allow-from managed via native OpenClaw credential store
  - AC: Paired user's Telegram ID added to `telegram-allowFrom.json` via atomic file write (temp + rename); unpaired user removed; no config restart triggered

### Skills Hub

- **FR73**: Create private skills via `POST /api/skills`
  - AC: Returns 401 for unauthenticated; stores skill with name, description, content; returns created skill with ID
- **FR74**: List skills via `GET /api/skills`
  - AC: Returns all skills accessible to current user
- **FR75**: Read/update/delete individual skill via `/api/skills/[id]` (GET/PUT/DELETE)
  - AC: Standard REST CRUD; returns 404 for unknown ID; returns 403 for unauthorized access
- **FR76**: Skills management page with UI for browsing, creating, editing, and deleting skills
  - AC: Accessible from sidebar navigation; supports full CRUD operations

### Chat UI Enhancements

- **FR77**: Slash command autocomplete in chat composer
  - AC: Typing `/` triggers autocomplete popup with available commands; selection inserts command text
- **FR78**: Popover menu with quick actions on + button in chat input
  - AC: Clicking + button opens popover with contextual actions
- **FR79**: "Connecting..." status indicator during initial WebSocket handshake
  - AC: Displayed when WebSocket connection is being established; replaced by chat UI once connected

## Non-Functional Requirements

### Security

- **NFR1**: AES-256-GCM encryption for API keys at rest in the settings table
  - AC: Encrypted values stored with `encrypted: true` flag; decryption requires `ENCRYPTION_KEY` env var (64 hex chars)
- **NFR2**: Secret management chain: ENV var > File (mode 0o600) > Auto-generate
  - AC: Encryption key sourced in priority order; file permissions validated; auto-generated key persisted for consistency
- **NFR3**: HMAC-SHA256 audit trail integrity with canonical JSON sorting
  - AC: Deterministic JSON serialization (sorted keys); HMAC secret derived from encryption key; verification endpoint recomputes all signatures
- **NFR4**: Audit detail payload sanitization -- redacts passwords, tokens, API keys
  - AC: Sensitive fields stripped before logging; detail payload max 2048 bytes with auto-truncation
- **NFR5**: Timing-safe token comparison for gateway authentication
  - AC: Internal API routes use constant-time comparison to prevent timing attacks
- **NFR6**: Path traversal prevention via realpath validation for knowledge base file access
  - AC: `realpath` resolves symlinks and `..` before checking against allowed directories; rejects paths outside boundaries
- **NFR7**: Rate limiting on WebSocket connections (IP-based upgrade rate + per-user connection limit)
  - AC: Excessive connection attempts from same IP rejected; per-user connection cap enforced
- **NFR8**: Non-root Docker execution (pinchy:pinchy user)
  - AC: Dockerfile specifies non-root user; container process runs without root privileges

### Performance

- **NFR9**: In-memory TTL session cache (30-second default)
  - AC: Repeated session lookups within 30s served from cache; reduces DB queries during active chat
- **NFR10**: Provider model cache (1-hour TTL)
  - AC: Model list fetched from provider API cached for 1 hour; stale cache triggers refresh
- **NFR11**: Usage pricing cache (5-minute TTL)
  - AC: Model pricing data cached to avoid repeated lookups during cost estimation
- **NFR12**: PDF processing cache (3-level: size+mtime, SHA256, content)
  - AC: Knowledge base PDF extraction cached at three levels to avoid re-processing unchanged files
- **NFR13**: Audit detail max 2048 bytes with auto-truncation
  - AC: Payloads exceeding limit truncated with `_truncated: true` flag appended

### Reliability

- **NFR14**: Fire-and-forget usage recording (non-blocking chat)
  - AC: Usage recording does not block message delivery; errors in recording do not affect chat flow
- **NFR15**: Per-session serialization prevents usage race conditions
  - AC: Concurrent usage writes for same session are serialized; no duplicate or lost records
- **NFR16**: Plugin retry logic (2 retries for audit POST)
  - AC: Failed POST to `/api/internal/audit/tool-use` retried up to 2 times before giving up
- **NFR17**: Graceful enterprise feature degradation (restricted visibility reverts to "all" when license expires)
  - AC: Expired license does not break agent visibility; agents become visible to everyone

### Compatibility

- **NFR18**: Docker Compose deployment (PostgreSQL 17 + OpenClaw + Pinchy as 3-service stack)
  - AC: `docker compose up` starts all services with health checks; migrations run on startup
- **NFR19**: Self-hosted, offline-capable (works with Ollama local models without internet)
  - AC: No external service dependencies required after initial setup; Ollama provider supported
- **NFR20**: Model-agnostic (Anthropic, OpenAI, Google, local models)
  - AC: Provider abstraction layer supports multiple backends; new providers addable without core changes

### OpenClaw Integration Reliability

- **NFR23**: File-based config hot-reload (Pinchy writes config, OpenClaw detects changes and restarts)
  - AC: Config changes applied without manual restart; file watcher detects config file modifications automatically
- **NFR24**: Config write deduplication (skip write if content unchanged)
  - AC: `regenerateOpenClawConfig` compares new config with existing file; skips write when identical; prevents unnecessary OpenClaw restarts
- **NFR25**: Atomic credential store writes for Telegram allow-from
  - AC: Credential file writes are atomic (no partial reads possible); allow-from store always contains valid data
- **NFR26**: Startup config push (closes gap when OpenClaw starts before Pinchy writes config)
  - AC: Full config pushed to OpenClaw on first connection if file-based config was not yet written; ensures OpenClaw always has current configuration

### Developer Experience

- **NFR21**: TDD mandatory -- failing test first, then implementation
  - AC: 167 test files; CI pipeline gates on test pass; custom ESLint rule enforces audit log coverage
- **NFR22**: Conventional Commits, CI gates (lint, format, test, build, E2E)
  - AC: Husky + lint-staged pre-commit hooks; GitHub Actions runs full pipeline; `feat:`, `fix:`, `docs:`, `refactor:`, `test:` prefixes enforced

---

*Reverse-engineered from production codebase and updated from `sha/reverse` branch (54 commits). FR1-FR62 extracted from main branch code. FR63-FR79 added from branch commits and code analysis. FR80 (session migration) reclassified as migration task and removed from FRs. Acceptance Criteria derived from test assertions and API route implementations. Post-validation edits applied: Journey 8 added, implementation leakage cleaned, domain compliance references strengthened.*
