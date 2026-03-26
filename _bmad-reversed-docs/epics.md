---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-write-stories]
inputDocuments:
  - _bmad-reversed-docs/prd.md
  - _bmad-reversed-docs/architecture.md
  - _bmad-reversed-docs/product-brief.md
workflowType: 'epics-and-stories'
project_name: 'pinchy'
date: '2026-03-26'
status: 'complete'
classification:
  projectType: saas_b2b
  domain: enterprise_ai_governance
  complexity: high
  projectContext: brownfield
note: >
  Reverse-engineered from production codebase (671 commits, ~85K LOC).
  All epics and stories describe what WAS built. Acceptance Criteria
  derived from test assertions across 154 unit test files and 4 E2E specs.
---

# Pinchy - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Pinchy, decomposing the requirements from the PRD and Architecture into implementable stories. All stories describe implemented functionality reverse-engineered from the production codebase.

## Requirements Inventory

### Functional Requirements

- FR1: First-time setup wizard creates initial admin user
- FR2: Setup status check reports DB connectivity, OpenClaw health, and provider configuration state
- FR3: Provider configuration validates API key against provider's models endpoint before accepting
- FR4: Smithers personal agent auto-created for every new user
- FR5: Smithers onboarding interview collects user context via conversation using pinchy-context plugin
- FR6: Admin onboarding additionally collects organization context
- FR7: Email/password authentication via Better Auth with admin and member roles
- FR8: DB-backed sessions with 7-day expiry and 1-day refresh window
- FR9: Scrypt password hashing with bcrypt legacy migration support
- FR10: Login/logout events logged to audit trail
- FR11: Password change (self-service) via PATCH /api/users/me/password
- FR12: WebSocket session validation from cookie headers on connection upgrade
- FR13: Invite-based user onboarding with 7-day token TTL
- FR14: Invite tokens: 32 random bytes (hex), SHA256 hashed for DB storage
- FR15: Admin can generate password reset tokens using the same invite flow with type "reset"
- FR16: List all users with group memberships (admin only)
- FR17: Update user role (admin/member) with last-admin protection
- FR18: Deactivate user (soft-delete via banned flag, soft-delete personal agents)
- FR19: Reactivate deactivated user via POST /api/users/{userId}/reactivate
- FR20: User self-profile update (name) via PATCH /api/users/me
- FR21: User personal context (markdown notes) injected into agent prompts via USER.md workspace file
- FR22: Create shared agents (admin only) via POST /api/agents
- FR23: Create personal agents -- auto-created on user signup via seedDefaultAgent
- FR24: Agent templates: Knowledge Base (pinchy_ls/pinchy_read tools + pinchy-files plugin) and Custom
- FR25: Update agent (name, model, tools, visibility, groups) with RBAC
- FR26: Delete shared agent (admin only, soft-delete via deleted_at timestamp)
- FR27: Agent workspace files (SOUL.md, AGENTS.md, IDENTITY.md, USER.md, ONBOARDING.md)
- FR28: Read/write agent workspace files via API
- FR29: Agent personality presets (butler, professor, etc.) with greeting messages
- FR30: Agent avatar generation from seed via DiceBear
- FR31: Agent greeting message and tagline
- FR32: Dynamic AGENTS.md generation with allowed_paths for knowledge base agents
- FR33: List visible agents (personal + shared matching visibility rules) via GET /api/agents
- FR34: Allow-list tool model -- agents start with zero tools, admins grant specific ones
- FR35: Tool registry: safe tools (pinchy_ls, pinchy_read) vs powerful tools (shell, fs, web)
- FR36: Tool deny groups computed from allowed tools (inverted for OpenClaw config)
- FR37: Agent visibility: "all" (everyone) or "restricted" (group-based)
- FR38: Group-based agent access control -- restricted agents visible only to users in assigned groups
- FR39: Admins can read/write all agents; members limited to personal + visible shared
- FR40: Access denial logged to audit trail
- FR41: Create groups with name and description via POST /api/groups
- FR42: Update group name/description via PATCH /api/groups/{groupId}
- FR43: Delete group via DELETE /api/groups/{groupId}
- FR44: Add/remove group members via PUT /api/groups/{groupId}/members
- FR45: Assign/unassign agents to groups (via agent visibility update)
- FR46: WebSocket bridge routes browser messages to OpenClaw Gateway
- FR47: Extra system prompt injection (user name + user context + agent greeting)
- FR48: Streaming response chunks from OpenClaw to browser
- FR49: Message history fetch from OpenClaw sessions
- FR50: Session key format: agent:{agentId}:user-{userId}
- FR51: First-visit detection with greeting fallback
- FR52: Multi-provider support: Anthropic, OpenAI, Google (Gemini)
- FR53: API key validation by calling provider's models endpoint
- FR54: Dynamic model list fetching with 1-hour cache
- FR55: Default model selection per provider
- FR56: Provider removal with agent migration to remaining provider
- FR57: Every admin state-change logged with actor, event type, resource, detail (JSON), timestamp
- FR58: HMAC-SHA256 row signing with canonical JSON sorting
- FR59: Audit trail integrity verification via POST /api/audit/verify
- FR60: CSV export of audit log with filtering via GET /api/audit/export
- FR61: Token usage recording per session (input, output, cache tokens, estimated cost)
- FR62: Usage dashboards: by-agent summary, by-user, timeseries, CSV/JSON export

### Non-Functional Requirements

- NFR1: AES-256-GCM encryption for API keys at rest in the settings table
- NFR2: Secret management chain: ENV var > File (mode 0o600) > Auto-generate
- NFR3: HMAC-SHA256 audit trail integrity with canonical JSON sorting
- NFR4: Audit detail payload sanitization -- redacts passwords, tokens, API keys
- NFR5: Timing-safe token comparison for gateway authentication
- NFR6: Path traversal prevention via realpath validation for knowledge base file access
- NFR7: Rate limiting on WebSocket connections (IP-based upgrade rate + per-user connection limit)
- NFR8: Non-root Docker execution (pinchy:pinchy user)
- NFR9: In-memory TTL session cache (30-second default)
- NFR10: Provider model cache (1-hour TTL)
- NFR11: Usage pricing cache (5-minute TTL)
- NFR12: PDF processing cache (3-level: size+mtime, SHA256, content)
- NFR13: Audit detail max 2048 bytes with auto-truncation
- NFR14: Fire-and-forget usage recording (non-blocking chat)
- NFR15: Per-session serialization prevents usage race conditions
- NFR16: Plugin retry logic (2 retries for audit POST)
- NFR17: Graceful enterprise feature degradation (restricted visibility reverts to "all" when license expires)
- NFR18: Docker Compose deployment (PostgreSQL 17 + OpenClaw + Pinchy as 3-service stack)
- NFR19: Self-hosted, offline-capable (works with Ollama local models without internet)
- NFR20: Model-agnostic (Anthropic, OpenAI, Google, local models)
- NFR21: TDD mandatory -- failing test first, then implementation
- NFR22: Conventional Commits, CI gates (lint, format, test, build, E2E)

### Additional Requirements

- Docker Compose 3-service stack with health checks and startup ordering (db -> openclaw -> pinchy)
- Migration-on-startup via server-preload.cjs (20 migration files)
- Custom server.ts wrapping Next.js with WebSocket server on same port (7777)
- OpenClaw config regeneration from DB state on every agent/provider change
- Plugin callback pattern: plugins inside OpenClaw call back to Pinchy via /api/internal/* routes
- Gateway token authentication for internal plugin API (timing-safe comparison)
- Shared volumes between Pinchy and OpenClaw containers (config, workspaces, extensions, secrets)
- Enterprise features gated by ES256 JWT license key
- Settings stored as key-value table with optional encryption flag
- Soft deletes for agents (deleted_at) to preserve audit trail and usage record references
- Denormalized usage records (agent_name snapshot, no FK) for historical accuracy after deletion
- 14 database tables, 1 custom enum, 1 view (active_agents), organized with Drizzle ORM

### FR Coverage Map

| FR | Epic | Story |
|----|------|-------|
| FR1 | 1 | 1.1 |
| FR2 | 1 | 1.2 |
| FR3 | 1 | 1.3 |
| FR4 | 1 | 1.4 |
| FR5 | 1 | 1.5 |
| FR6 | 1 | 1.5 |
| FR7 | 2 | 2.1 |
| FR8 | 2 | 2.1 |
| FR9 | 2 | 2.1 |
| FR10 | 2 | 2.2 |
| FR11 | 2 | 2.3 |
| FR12 | 2 | 2.4 |
| FR13 | 2 | 2.5 |
| FR14 | 2 | 2.5 |
| FR15 | 2 | 2.6 |
| FR16 | 2 | 2.7 |
| FR17 | 2 | 2.8 |
| FR18 | 2 | 2.9 |
| FR19 | 2 | 2.9 |
| FR20 | 2 | 2.10 |
| FR21 | 2 | 2.11 |
| FR22 | 3 | 3.1 |
| FR23 | 3 | 3.2 |
| FR24 | 3 | 3.3 |
| FR25 | 3 | 3.4 |
| FR26 | 3 | 3.5 |
| FR27 | 3 | 3.6 |
| FR28 | 3 | 3.6 |
| FR29 | 3 | 3.7 |
| FR30 | 3 | 3.7 |
| FR31 | 3 | 3.7 |
| FR32 | 3 | 3.8 |
| FR33 | 3 | 3.9 |
| FR34 | 4 | 4.1 |
| FR35 | 4 | 4.2 |
| FR36 | 4 | 4.3 |
| FR37 | 4 | 4.4 |
| FR38 | 4 | 4.5 |
| FR39 | 4 | 4.6 |
| FR40 | 4 | 4.7 |
| FR41 | 5 | 5.1 |
| FR42 | 5 | 5.2 |
| FR43 | 5 | 5.3 |
| FR44 | 5 | 5.4 |
| FR45 | 5 | 5.5 |
| FR46 | 6 | 6.1 |
| FR47 | 6 | 6.2 |
| FR48 | 6 | 6.3 |
| FR49 | 6 | 6.4 |
| FR50 | 6 | 6.5 |
| FR51 | 6 | 6.6 |
| FR52 | 7 | 7.1 |
| FR53 | 7 | 7.2 |
| FR54 | 7 | 7.3 |
| FR55 | 7 | 7.4 |
| FR56 | 7 | 7.5 |
| FR57 | 8 | 8.1 |
| FR58 | 8 | 8.2 |
| FR59 | 8 | 8.3 |
| FR60 | 8 | 8.4 |
| FR61 | 8 | 8.5 |
| FR62 | 8 | 8.6 |
| NFR1 | 8 | 8.7 |
| NFR2 | 8 | 8.7 |
| NFR3 | 8 | 8.2 |
| NFR4 | 8 | 8.8 |
| NFR5 | 8 | 8.8 |
| NFR6 | 8 | 8.8 |
| NFR7 | 8 | 8.9 |
| NFR8 | 8 | 8.10 |

## Epic List

| Epic | Title | Stories |
|------|-------|---------|
| 1 | Setup and Onboarding | 5 stories |
| 2 | Authentication and User Management | 11 stories |
| 3 | Agent Management | 9 stories |
| 4 | Agent Permissions and RBAC | 7 stories |
| 5 | Group Management (Enterprise) | 5 stories |
| 6 | Real-Time Agent Chat | 6 stories |
| 7 | Provider and Model Configuration | 5 stories |
| 8 | Audit, Usage, and Compliance | 10 stories |

---

## Epic 1: Setup and Onboarding

Enable first-time administrators to go from `docker compose up` to a fully configured platform with an admin account, validated API provider, and personalized onboarding experience in under 10 minutes.

### Story 1.1: First-Time Setup Wizard (Admin Creation)

As an administrator deploying Pinchy for the first time,
I want a setup wizard that creates my admin account,
So that the platform is secured with a named admin from the first interaction.

**Acceptance Criteria:**

**Given** a fresh Pinchy deployment with no existing users
**When** I submit POST /api/setup with name, email, and password (8+ characters)
**Then** the system creates an admin user via Better Auth signUpEmail, sets the admin role, seeds a personal Smithers agent, and returns 201 with user data
**And** the password is hashed with scrypt

**Given** a POST /api/setup request with a missing or whitespace-only name
**When** the request is processed
**Then** the system returns 400 with error "Name is required"

**Given** a POST /api/setup request with an invalid email
**When** the request is processed
**Then** the system returns 400 with error "A valid email address is required"

**Given** a POST /api/setup request with a password shorter than 8 characters
**When** the request is processed
**Then** the system returns 400 with error "Password must be at least 8 characters"

**Given** an existing admin user already exists in the database
**When** POST /api/setup is called again
**Then** the system returns 403 with error "Setup already complete"

**Test files:** `__tests__/api/setup.test.ts`, `__tests__/lib/setup.test.ts`

### Story 1.2: Setup Status Check

As a deploying administrator,
I want the setup wizard to show me the status of the database, OpenClaw runtime, and provider configuration,
So that I can verify all infrastructure is healthy before proceeding.

**Acceptance Criteria:**

**Given** no admin user exists in the database
**When** GET /api/setup/status is called
**Then** the system returns `{ setupComplete: false, infrastructure: { database: "...", openclaw: "..." } }`

**Given** an admin user exists
**When** GET /api/setup/status is called
**Then** `setupComplete` is true

**Given** the database is unreachable
**When** GET /api/setup/status is called
**Then** `infrastructure.database` is "unreachable"

**Given** OpenClaw is unreachable
**When** GET /api/setup/status is called
**Then** `infrastructure.openclaw` is "unreachable"

**Given** any client (no session cookie required)
**When** GET /api/setup/status is called
**Then** the endpoint responds without requiring authentication

**Test files:** `__tests__/api/setup-status.test.ts`

### Story 1.3: Provider Configuration During Setup

As an administrator completing the setup wizard,
I want to configure my AI provider (Anthropic, OpenAI, or Google) with a validated API key,
So that agents have a working model backend before the first conversation.

**Acceptance Criteria:**

**Given** a valid provider name and API key
**When** POST /api/setup/provider is called
**Then** the system validates the key via the provider's models endpoint, stores the encrypted key via setSetting, sets the default provider, regenerates the OpenClaw config, resets the model cache, and returns 200

**Given** an invalid API key
**When** POST /api/setup/provider is called
**Then** the system returns 422 with error containing "Invalid API key"

**Given** an unknown provider name
**When** POST /api/setup/provider is called
**Then** the system returns 400

**Given** a missing apiKey field
**When** POST /api/setup/provider is called
**Then** the system returns 400

**Given** the first provider is being added and a Smithers agent exists
**When** the provider is saved
**Then** the Smithers agent's model is updated to the new provider's default model

**Given** a second provider is being added alongside an existing one
**When** the provider is saved
**Then** agent models are NOT updated (preserving the existing configuration)

**Given** a non-admin user
**When** POST /api/setup/provider is called
**Then** the system returns 403

**Test files:** `__tests__/api/setup-provider.test.ts`

### Story 1.4: Personal Smithers Agent Auto-Creation

As a new user (admin or invited member),
I want a personal Smithers agent automatically created for me on signup,
So that I have a personal AI assistant from my first login.

**Acceptance Criteria:**

**Given** a new user is created (via setup wizard or invite claim)
**When** seedDefaultAgent is called with the user's ID
**Then** a Smithers agent is created with `isPersonal: true`, the user's ID as `ownerId`, and `ensureWorkspace` is called for the agent

**Given** seedDefaultAgent is called without an ownerId
**When** the agent is created
**Then** `isPersonal` is set to false (shared agent mode)

**Given** a personal Smithers agent already exists for the user
**When** seedDefaultAgent is called again
**Then** the existing agent is returned without creating a duplicate and without calling ensureWorkspace

**Test files:** `__tests__/api/setup.test.ts` (seedDefaultAgent section), `__tests__/lib/personal-agent.test.ts`

### Story 1.5: Smithers Onboarding Interview and Context Collection

As a new user,
I want Smithers to interview me about myself (and about my organization if I am an admin),
So that all future agent interactions are personalized with my context.

**Acceptance Criteria:**

**Given** a new user interacts with Smithers for the first time
**When** Smithers conducts the onboarding interview
**Then** user context is saved via PUT /api/internal/users/{userId}/context, authenticated by gateway token

**Given** the user is an admin
**When** Smithers conducts the onboarding interview
**Then** organization context is additionally saved via PUT /api/internal/settings/context

**Given** user context has been saved
**When** the user interacts with any agent
**Then** the context is injected into the agent's USER.md workspace file

**Test files:** `__tests__/api/internal-user-context.test.ts`, `__tests__/api/internal-settings-context.test.ts`, `__tests__/lib/context-sync.test.ts`, `__tests__/lib/onboarding-prompt.test.ts`

---

## Epic 2: Authentication and User Management

Provide secure, session-based authentication with invite-based team onboarding, role management, user lifecycle (activate/deactivate), and self-service profile capabilities.

### Story 2.1: Email/Password Authentication with DB Sessions

As a user,
I want to sign in with email and password,
So that my session is securely managed with database-backed persistence.

**Acceptance Criteria:**

**Given** valid email and password credentials
**When** the user signs in via Better Auth
**Then** a session is created in the `session` table with 7-day expiry

**Given** a session within the 1-day refresh window before expiry
**When** the user makes a request
**Then** the session is extended

**Given** new user passwords
**When** stored in the database
**Then** they are hashed with scrypt

**Given** an existing user with a bcrypt-hashed password
**When** they log in successfully
**Then** their password hash is migrated to scrypt

**Test files:** `__tests__/lib/auth.test.ts`, `__tests__/lib/api-auth.test.ts`

### Story 2.2: Authentication Audit Logging

As a compliance officer,
I want login, failed login, and logout events logged to the audit trail,
So that authentication activity is traceable.

**Acceptance Criteria:**

**Given** a successful login
**When** the auth event fires
**Then** `appendAuditLog` is called with event type `auth.login`

**Given** a failed login attempt
**When** the auth event fires
**Then** `appendAuditLog` is called with event type `auth.failed`

**Given** a user logs out
**When** the auth event fires
**Then** `appendAuditLog` is called with event type `auth.logout`

**Test files:** `__tests__/lib/auth-audit.test.ts`

### Story 2.3: Self-Service Password Change

As a user,
I want to change my own password,
So that I can maintain my account security.

**Acceptance Criteria:**

**Given** an authenticated user with the correct current password
**When** PATCH /api/users/me/password is called with a valid new password (8+ characters)
**Then** the password is updated

**Given** an incorrect current password
**When** PATCH /api/users/me/password is called
**Then** the request is rejected

**Given** a new password shorter than 8 characters
**When** PATCH /api/users/me/password is called
**Then** the request is rejected with a validation error

**Test files:** `__tests__/api/user-self-service.test.ts`, `__tests__/lib/validate-password.test.ts`

### Story 2.4: WebSocket Session Authentication

As a security engineer,
I want WebSocket connections validated against DB sessions on upgrade,
So that only authenticated users can access the real-time chat.

**Acceptance Criteria:**

**Given** an HTTP upgrade request with a valid session cookie
**When** the WebSocket upgrade is processed
**Then** the session is parsed, validated against the database, and the connection proceeds

**Given** an upgrade request with an invalid or expired session cookie
**When** the upgrade is processed
**Then** the connection is rejected

**Test files:** `__tests__/server/ws-auth.test.ts`, `__tests__/server/session-cache.test.ts`

### Story 2.5: Invite-Based User Onboarding

As an administrator,
I want to generate invite tokens for new team members,
So that they can create accounts with predefined roles and group assignments.

**Acceptance Criteria:**

**Given** an admin creates an invite
**When** the token is generated
**Then** 32 random bytes are generated as hex, the SHA-256 hash is stored in `invites.token_hash`, the raw token is returned to the admin, and a 7-day TTL is set

**Given** a valid, unclaimed invite token with name and password (8+ characters)
**When** POST /api/invite/claim is called
**Then** the user is created via Better Auth signUpEmail, a personal Smithers agent is seeded, the invite is marked as claimed, groups from the invite are assigned to the user, OpenClaw config is regenerated, and 201 is returned

**Given** a missing token in the claim request
**When** POST /api/invite/claim is called
**Then** 400 is returned with error "Token is required"

**Given** a missing or short password in the claim request
**When** POST /api/invite/claim is called
**Then** 400 is returned with error "Password must be at least 8 characters"

**Given** a missing name for a new user invite
**When** POST /api/invite/claim is called
**Then** 400 is returned with error "Name is required"

**Given** an expired, invalid, or already claimed token
**When** POST /api/invite/claim is called
**Then** 410 is returned with error "Invalid or expired invite link"

**Given** the invite/claim endpoint
**When** any request is made
**Then** no authentication is required (the endpoint is public)

**Test files:** `__tests__/api/invite-claim.test.ts`, `__tests__/api/invites.test.ts`, `__tests__/lib/invites.test.ts`

### Story 2.6: Password Reset via Invite Flow

As an administrator,
I want to generate password reset tokens for users who forgot their passwords,
So that users can regain access without self-service email flows.

**Acceptance Criteria:**

**Given** a valid reset token (type "reset") and a new password
**When** POST /api/invite/claim is called
**Then** the existing user's password is updated via Better Auth setUserPassword, the invite is claimed, 200 is returned, and no personal agent is seeded

**Given** a reset token for a nonexistent user
**When** POST /api/invite/claim is called
**Then** 404 is returned with error "User not found"

**Given** a reset type invite
**When** it is claimed
**Then** group assignment does NOT happen and OpenClaw config is NOT regenerated

**Test files:** `__tests__/api/invite-claim.test.ts` (reset section), `__tests__/api/user-reset.test.ts`

### Story 2.7: User List with Group Memberships

As an administrator,
I want to see all users with their group memberships,
So that I can manage my team.

**Acceptance Criteria:**

**Given** an authenticated admin
**When** GET /api/users is called
**Then** a list of users with their associated groups is returned

**Given** an unauthenticated request
**When** GET /api/users is called
**Then** 401 is returned

**Given** a non-admin user
**When** GET /api/users is called
**Then** 403 is returned

**Test files:** `__tests__/api/users.test.ts`, `__tests__/lib/user-list.test.ts`

### Story 2.8: User Role Update with Last-Admin Protection

As an administrator,
I want to promote or demote users between admin and member roles,
So that I can delegate platform management while ensuring at least one admin always exists.

**Acceptance Criteria:**

**Given** an admin promoting a member to admin
**When** the role update API is called
**Then** the user's role is updated and an audit log entry is created

**Given** the only remaining admin
**When** an attempt is made to demote them to member
**Then** 400 is returned because the last admin cannot be demoted

**Test files:** `__tests__/api/user-role.test.ts`

### Story 2.9: User Deactivation and Reactivation

As an administrator,
I want to deactivate users who leave the organization and reactivate them if they return,
So that access is managed without losing audit and usage history.

**Acceptance Criteria:**

**Given** an admin deactivates a user
**When** the deactivation endpoint is called
**Then** `banned: true` is set on the user, their personal agents are soft-deleted, and audit/usage history is preserved

**Given** an admin reactivates a deactivated user via POST /api/users/{userId}/reactivate
**When** the reactivation endpoint is called
**Then** the ban is cleared but soft-deleted agents are NOT automatically restored

**Test files:** `__tests__/api/user-reactivate.test.ts`, `__tests__/lib/agents-delete.test.ts`

### Story 2.10: User Self-Profile Update

As a user,
I want to update my display name,
So that my identity is accurate across the platform.

**Acceptance Criteria:**

**Given** an authenticated user
**When** PATCH /api/users/me is called with a new name
**Then** the display name is updated

**Given** a PATCH /api/users/me request
**When** it includes email or role changes
**Then** those fields are NOT updated (only name is allowed)

**Test files:** `__tests__/api/user-self-service.test.ts`

### Story 2.11: User Personal Context Management

As a user,
I want to store and update my personal context notes,
So that agents can personalize their responses to me.

**Acceptance Criteria:**

**Given** a user has saved personal context
**When** GET /api/users/me/context is called
**Then** the context markdown is returned

**Given** user context is saved
**When** the user interacts with any agent
**Then** the context is written to the agent's USER.md workspace file

**Test files:** `__tests__/api/user-context.test.ts`, `__tests__/lib/context-sync.test.ts`

---

## Epic 3: Agent Management

Enable administrators to create, configure, and manage shared AI agents with templates, personality presets, workspace files, and knowledge base capabilities, while auto-creating personal agents for every user.

### Story 3.1: Create Shared Agents (Admin Only)

As an administrator,
I want to create shared agents accessible to my team,
So that the organization has purpose-built AI assistants for specific tasks.

**Acceptance Criteria:**

**Given** an admin user
**When** POST /api/agents is called with a valid name (max 30 characters) and templateId
**Then** the agent is created with ownerId set to the current user, ensureWorkspace is called, OpenClaw config is regenerated, and 201 is returned

**Given** a non-admin user
**When** POST /api/agents is called
**Then** 403 is returned with error "Admin access required"

**Given** a name longer than 30 characters
**When** POST /api/agents is called
**Then** 400 is returned with a name validation error

**Given** an unknown templateId
**When** POST /api/agents is called
**Then** 400 is returned

**Given** a new agent is created
**When** the default visibility is applied
**Then** the agent defaults to "restricted" visibility (schema default, not explicitly set)

**Test files:** `__tests__/api/agents-create.test.ts`

### Story 3.2: Personal Agent Auto-Creation on Signup

As a new user,
I want my personal Smithers agent created automatically,
So that I have a private AI assistant without any admin action.

**Acceptance Criteria:**

**Given** a new user is created (setup or invite claim)
**When** seedPersonalAgent is called
**Then** a Smithers agent is created with `isPersonal: true` and the user's ID as ownerId

**Given** an invite claim of type "invite"
**When** the user account is created
**Then** seedPersonalAgent is called with the new user's ID

**Given** an invite claim of type "reset"
**When** the password is updated
**Then** seedPersonalAgent is NOT called

**Test files:** `__tests__/api/setup.test.ts`, `__tests__/api/invite-claim.test.ts`, `__tests__/lib/personal-agent.test.ts`

### Story 3.3: Agent Templates (Knowledge Base and Custom)

As an administrator,
I want to create agents from templates,
So that common agent types are pre-configured with the right tools and settings.

**Acceptance Criteria:**

**Given** templateId "knowledge-base" with allowed_paths in pluginConfig
**When** the agent is created
**Then** allowedTools is set to `["pinchy_ls", "pinchy_read"]`, the pinchy-files plugin is configured with the allowed paths, SOUL.md is written from the professor preset, and AGENTS.md is generated with the allowed paths

**Given** templateId "knowledge-base" without allowed_paths
**When** POST /api/agents is called
**Then** 400 is returned with error "At least one directory must be selected"

**Given** templateId "custom"
**When** the agent is created
**Then** no pluginConfig is required, no path validation occurs, and allowedTools defaults to empty

**Test files:** `__tests__/api/agents-create.test.ts`, `__tests__/lib/agent-templates.test.ts`, `__tests__/api/templates.test.ts`

### Story 3.4: Update Agent Properties with RBAC

As an administrator,
I want to update agent name, model, tools, visibility, and groups,
So that agents evolve as team needs change.

**Acceptance Criteria:**

**Given** an admin user
**When** PATCH /api/agents/{agentId} is called with valid fields
**Then** the agent is updated and an audit log entry records the changes

**Given** a non-admin member
**When** PATCH /api/agents/{agentId} is called on a shared agent
**Then** 403 is returned

**Given** a member user who owns a personal agent
**When** PATCH is called on their personal agent
**Then** the update is permitted (limited to allowed fields)

**Test files:** `__tests__/api/agents.test.ts`, `__tests__/api/agents-visibility.test.ts`, `__tests__/api/agents-audit.test.ts`

### Story 3.5: Delete Shared Agent (Soft Delete)

As an administrator,
I want to delete shared agents with a soft-delete mechanism,
So that audit trail and usage record references are preserved.

**Acceptance Criteria:**

**Given** an admin deletes a shared agent
**When** DELETE /api/agents/{agentId} is called
**Then** `deleted_at` is set (not hard-deleted), the agent is excluded from the `active_agents` view, and usage/audit references remain intact

**Test files:** `__tests__/api/agents-delete.test.ts`, `__tests__/lib/agents-delete.test.ts`

### Story 3.6: Agent Workspace Files and File API

As a system,
I want agent workspace files (SOUL.md, AGENTS.md, IDENTITY.md, USER.md, ONBOARDING.md) managed on the filesystem,
So that OpenClaw reads agent configuration from standard workspace locations.

**Acceptance Criteria:**

**Given** an agent is created
**When** ensureWorkspace is called
**Then** the workspace directory is created and initial files are written

**Given** an authenticated admin
**When** GET /api/agents/{agentId}/files/{filename} is called
**Then** the workspace file content is returned

**Given** a non-admin member
**When** accessing a shared agent's files
**Then** access is only permitted if the agent is visible to the member (personal + visible shared)

**Test files:** `__tests__/api/agent-files.test.ts`, `__tests__/lib/workspace.test.ts`

### Story 3.7: Agent Personality Presets, Avatars, and Greetings

As an administrator,
I want to assign personality presets (butler, professor, etc.) with auto-generated avatars and greeting messages,
So that agents have distinct visual and conversational identities.

**Acceptance Criteria:**

**Given** an agent is created with a personality preset
**When** the preset is applied
**Then** `greetingMessage` is set with {name} placeholder resolved, `avatarSeed` is generated via generateAvatarSeed, and SOUL.md is written from the preset's soulMd content

**Given** a tagline is provided in the request body
**When** the agent is created
**Then** the provided tagline is used instead of the template's defaultTagline

**Given** no tagline is provided
**When** the agent is created
**Then** the template's defaultTagline is used

**Given** an agent is created
**When** writeIdentityFile is called
**Then** IDENTITY.md is written with the agent's name and tagline

**Test files:** `__tests__/api/agents-create.test.ts`, `__tests__/lib/personality-presets.test.ts`, `__tests__/lib/avatar.test.ts`

### Story 3.8: Dynamic AGENTS.md for Knowledge Base Agents

As a knowledge base agent,
I want AGENTS.md generated with my allowed paths and tool usage instructions,
So that I know which directories I can access and how to use pinchy_ls/pinchy_read.

**Acceptance Criteria:**

**Given** a knowledge-base agent is created with allowed_paths
**When** AGENTS.md is generated
**Then** the file includes the allowed paths, pinchy_ls usage instructions, and references "knowledge base agent"

**Given** a custom template agent (no defaultAgentsMd)
**When** the agent is created
**Then** AGENTS.md is NOT written

**Test files:** `__tests__/api/agents-create.test.ts` (AGENTS.md assertions)

### Story 3.9: List Visible Agents

As a user,
I want to see my personal agents plus shared agents I have access to,
So that I only see agents relevant to me.

**Acceptance Criteria:**

**Given** an admin user
**When** GET /api/agents is called
**Then** all shared agents (visibility "all" and "restricted") plus the admin's own personal agents are returned; other users' personal agents are excluded

**Given** a member user in a specific group
**When** GET /api/agents is called
**Then** personal agents owned by the member, shared agents with visibility "all", and shared agents with visibility "restricted" where the member's group is assigned are returned

**Given** a member user NOT in a restricted agent's group
**When** GET /api/agents is called
**Then** the restricted agent is NOT included in the results

**Test files:** `__tests__/lib/visible-agents.test.ts`, `__tests__/api/agents.test.ts`

---

## Epic 4: Agent Permissions and RBAC

Implement the allow-list tool permission model, group-based agent visibility, and role-based access control to ensure agents operate within explicitly granted boundaries.

### Story 4.1: Allow-List Tool Model

As a security-conscious administrator,
I want agents to start with zero tools and only execute tools I explicitly grant,
So that agents cannot perform unauthorized actions.

**Acceptance Criteria:**

**Given** a newly created agent
**When** its default tool configuration is applied
**Then** `allowed_tools` defaults to an empty array `[]`

**Given** an agent with an empty allowed_tools list
**When** the agent attempts to use any tool
**Then** tool execution is blocked by the deny groups configuration

**Test files:** `__tests__/lib/tool-registry.test.ts`, `__tests__/lib/openclaw-config.test.ts`

### Story 4.2: Tool Registry (Safe vs Powerful)

As a platform,
I want tools categorized as safe (pinchy_ls, pinchy_read) or powerful (shell, fs, web),
So that administrators can make informed decisions about tool grants.

**Acceptance Criteria:**

**Given** the tool registry
**When** it is queried
**Then** it returns tool definitions with categories distinguishing safe tools from powerful tools

**Given** a knowledge-base template
**When** an agent is created from it
**Then** only safe tools (pinchy_ls, pinchy_read) are in the allowed_tools list

**Test files:** `__tests__/lib/tool-registry.test.ts`

### Story 4.3: Tool Deny Group Computation

As the OpenClaw config generator,
I want to compute deny groups from the allowed tools (inverted logic),
So that OpenClaw blocks all tools except those explicitly allowed.

**Acceptance Criteria:**

**Given** an agent with specific allowed tools
**When** the OpenClaw config is regenerated
**Then** deny groups are computed that block everything except the allowed tools

**Given** an agent with all tools allowed
**When** deny groups are computed
**Then** no deny groups are applied

**Test files:** `__tests__/lib/openclaw-config.test.ts`

### Story 4.4: Agent Visibility Modes

As an administrator,
I want to set agent visibility to "all" (everyone) or "restricted" (group-based),
So that I can control which teams have access to which agents.

**Acceptance Criteria:**

**Given** an admin setting visibility to "all"
**When** PATCH /api/agents/{agentId} is called with `{ visibility: "all" }`
**Then** the agent is updated and updateAgent is called with `{ visibility: "all" }`

**Given** an admin setting visibility to "restricted" with groupIds
**When** PATCH /api/agents/{agentId} is called with `{ visibility: "restricted", groupIds: [...] }`
**Then** old agent_groups entries are deleted, new ones are inserted, and 200 is returned

**Given** an invalid visibility value (not "all" or "restricted")
**When** PATCH is called
**Then** 400 is returned with error "Invalid visibility value"

**Given** a personal agent
**When** visibility change is attempted
**Then** 400 is returned with error "Cannot change visibility for personal agents"

**Given** a non-admin user
**When** visibility change is attempted on a shared agent
**Then** 403 is returned

**Test files:** `__tests__/api/agents-visibility.test.ts`

### Story 4.5: Group-Based Agent Access Control

As a member user,
I want to only see restricted agents assigned to groups I belong to,
So that agent access reflects my organizational role.

**Acceptance Criteria:**

**Given** a restricted agent assigned to groups A and B
**When** a member in group A requests agents
**Then** the restricted agent is included in their visible agents

**Given** a restricted agent assigned to group A
**When** a member NOT in group A requests agents
**Then** the restricted agent is excluded from their visible agents

**Given** an enterprise license has expired
**When** a restricted agent's visibility is evaluated
**Then** it degrades to "all" (agent becomes visible to everyone)

**Test files:** `__tests__/lib/visible-agents.test.ts`, `__tests__/lib/agent-access.test.ts`, `__tests__/lib/enterprise.test.ts`

### Story 4.6: Role-Based Agent Read/Write Access

As a platform enforcing RBAC,
I want admins to access all agents and members limited to personal + visible shared agents,
So that unauthorized access is prevented at every layer.

**Acceptance Criteria:**

**Given** an admin user
**When** accessing any agent (including other users' personal agents)
**Then** access is granted

**Given** a member user accessing their own personal agent
**When** assertAgentAccess is called
**Then** access is granted

**Given** a member user accessing another user's personal agent
**When** assertAgentAccess is called
**Then** an "Access denied" error is thrown

**Given** a member user accessing a shared agent with visibility "all"
**When** assertAgentAccess is called
**Then** access is granted

**Given** an admin modifying any agent
**When** assertAgentWriteAccess is called
**Then** write access is granted

**Given** a non-admin member modifying a shared agent
**When** assertAgentWriteAccess is called
**Then** write access is denied

**Test files:** `__tests__/lib/agent-access.test.ts`

### Story 4.7: Access Denial Audit Logging

As a compliance officer,
I want access denials logged to the audit trail,
So that unauthorized access attempts are traceable.

**Acceptance Criteria:**

**Given** a user is denied access to an agent
**When** the access check fails in the WebSocket bridge
**Then** `appendAuditLog` is called with a denial event recording the agent, user, and reason

**Test files:** `__tests__/server/client-router.test.ts` (access denial assertions)

---

## Epic 5: Group Management (Enterprise)

Enable administrators to organize users and agents into groups for enterprise access control, gated by the enterprise license.

### Story 5.1: Create Group

As an administrator,
I want to create groups with a name and description,
So that I can organize users for agent access control.

**Acceptance Criteria:**

**Given** an authenticated admin
**When** POST /api/groups is called with a name and description
**Then** the group is created and an audit log entry is recorded

**Given** a non-admin user
**When** POST /api/groups is called
**Then** 403 is returned

**Given** an unauthenticated request
**When** POST /api/groups is called
**Then** 401 is returned

**Test files:** `__tests__/api/groups.test.ts`

### Story 5.2: Update Group

As an administrator,
I want to update group name and description,
So that group metadata stays accurate.

**Acceptance Criteria:**

**Given** an admin
**When** PATCH /api/groups/{groupId} is called with updated fields
**Then** the group is updated and the audit log records the changes

**Test files:** `__tests__/api/groups.test.ts`

### Story 5.3: Delete Group

As an administrator,
I want to delete groups,
So that unused groups can be cleaned up.

**Acceptance Criteria:**

**Given** an admin deletes a group
**When** DELETE /api/groups/{groupId} is called
**Then** the group is deleted, cascading to `user_groups` and `agent_groups` join tables, and an audit log entry is recorded

**Test files:** `__tests__/api/groups.test.ts`

### Story 5.4: Manage Group Members

As an administrator,
I want to add and remove users from groups,
So that team membership is current.

**Acceptance Criteria:**

**Given** an admin
**When** PUT /api/groups/{groupId}/members is called with an array of userIds
**Then** the `user_groups` table is updated and the audit log records added/removed members with `{id, name}` pairs

**Test files:** `__tests__/api/groups.test.ts`, `__tests__/api/user-groups.test.ts`

### Story 5.5: Assign Agents to Groups

As an administrator,
I want to assign agents to groups via the agent visibility update,
So that restricted agents are visible to the right teams.

**Acceptance Criteria:**

**Given** an admin updates an agent with groupIds
**When** PATCH /api/agents/{agentId} is called with `{ groupIds: [...] }`
**Then** the `agent_groups` join table is updated (old deleted, new inserted) and the audit log records changes

**Test files:** `__tests__/api/agents-visibility.test.ts` (groupIds assertions)

---

## Epic 6: Real-Time Agent Chat

Implement the WebSocket bridge between browser clients and the OpenClaw Gateway, with streaming responses, session management, message history, and system prompt injection.

### Story 6.1: WebSocket Bridge to OpenClaw

As a user,
I want to send messages to agents through a WebSocket connection,
So that I get real-time, streaming AI responses.

**Acceptance Criteria:**

**Given** an authenticated user
**When** connecting to ws://host:7777/api/ws with a valid session cookie
**Then** the ClientRouter authenticates the session, checks agent access permissions, and proxies messages to OpenClaw via openclaw-node

**Given** the user sends a message with type "message" and an agentId
**When** the ClientRouter processes it
**Then** the message is forwarded to the correct OpenClaw session

**Test files:** `__tests__/server/client-router.test.ts`

### Story 6.2: System Prompt Injection

As the platform,
I want to inject user context, agent identity, and greeting information into OpenClaw sessions,
So that agents have the full context for personalized responses.

**Acceptance Criteria:**

**Given** a user interacts with an agent
**When** the OpenClaw session is initialized
**Then** USER.md (user context), IDENTITY.md (agent identity), and onboarding context are injected into the session workspace

**Test files:** `__tests__/lib/workspace.test.ts`, `__tests__/lib/context-sync.test.ts`

### Story 6.3: Streaming Response Chunks

As a user,
I want to see agent responses appear token by token,
So that the conversation feels responsive.

**Acceptance Criteria:**

**Given** an OpenClaw agent generates a response
**When** tokens are streamed
**Then** the server sends `{type: "chunk", content: "...", messageId: "..."}` messages to the browser for each chunk

**Given** the response completes
**When** the stream ends
**Then** the server sends `{type: "done", messageId: "..."}` to the browser

**Test files:** `__tests__/server/client-router.test.ts`

### Story 6.4: Message History Fetch

As a user returning to a conversation,
I want to see my previous messages,
So that context is preserved across sessions.

**Acceptance Criteria:**

**Given** a user reconnects to an agent conversation
**When** a history request is sent
**Then** the server sends `{type: "history", messages: [...]}` with the conversation history from OpenClaw

**Test files:** `__tests__/server/client-router.test.ts`

### Story 6.5: Session Key Format and Persistence

As the system,
I want each agent-user pair to have a unique session key,
So that conversations persist across reconnections.

**Acceptance Criteria:**

**Given** user "user-1" interacts with agent "agent-1"
**When** the session key is computed
**Then** the key follows the format `agent:{agentId}:user-{userId}`

**Given** a user disconnects and reconnects
**When** the session key matches
**Then** the previous conversation context is preserved

**Test files:** `__tests__/server/client-router.test.ts`

### Story 6.6: First-Visit Greeting Fallback

As a new user opening an agent conversation for the first time,
I want to see the agent's greeting message,
So that I know what the agent can do.

**Acceptance Criteria:**

**Given** no message history exists for the agent-user pair
**When** the chat interface loads
**Then** the agent's greeting message from config is displayed

**Test files:** `__tests__/components/thread-welcome.test.tsx`, `__tests__/hooks/use-ws-runtime.test.ts`

---

## Epic 7: Provider and Model Configuration

Support multiple AI providers (Anthropic, OpenAI, Google) with encrypted API key storage, live validation, dynamic model discovery, and automatic agent migration on provider changes.

### Story 7.1: Multi-Provider Support

As an administrator,
I want to configure multiple AI providers simultaneously,
So that the organization has model flexibility and fallback options.

**Acceptance Criteria:**

**Given** provider settings for Anthropic, OpenAI, and Google
**When** each is configured
**Then** the API key is stored encrypted (AES-256-GCM) via setSetting with the provider-specific settings key and `encrypted: true`

**Given** a provider is configured
**When** the OpenClaw config is regenerated
**Then** the provider's API key is included in the config (decrypted at config generation time)

**Test files:** `__tests__/api/settings-providers.test.ts`, `__tests__/lib/providers.test.ts`

### Story 7.2: API Key Validation

As an administrator,
I want API keys validated against the provider's models endpoint before storage,
So that invalid keys are caught immediately.

**Acceptance Criteria:**

**Given** a valid API key for a supported provider
**When** validateProviderKey is called
**Then** the provider's models endpoint is called and true is returned

**Given** an invalid API key
**When** validateProviderKey is called
**Then** false is returned

**Test files:** `__tests__/api/setup-provider.test.ts`, `__tests__/lib/providers.test.ts`

### Story 7.3: Dynamic Model List with Cache

As a user selecting a model for an agent,
I want the model list fetched from the provider with 1-hour caching,
So that model options are current without excessive API calls.

**Acceptance Criteria:**

**Given** a configured provider
**When** GET /api/providers/models is called
**Then** the model list is returned from the provider API

**Given** the model list was fetched within the last hour
**When** GET /api/providers/models is called again
**Then** the cached list is returned without calling the provider API

**Given** the cache is older than 1 hour
**When** GET /api/providers/models is called
**Then** a fresh list is fetched from the provider API

**Test files:** `__tests__/api/provider-models.test.ts`, `__tests__/lib/provider-models.test.ts`

### Story 7.4: Default Model Selection per Provider

As the system,
I want a sensible default model selected for each provider,
So that new agents have a working model without manual selection.

**Acceptance Criteria:**

**Given** Anthropic is the default provider
**When** getDefaultModel is called
**Then** a Haiku-class model is selected

**Given** OpenAI is the default provider
**When** getDefaultModel is called
**Then** gpt-4o-mini is selected

**Given** Google is the default provider
**When** getDefaultModel is called
**Then** gemini-2.5-flash is selected

**Test files:** `__tests__/lib/provider-models.test.ts`

### Story 7.5: Provider Removal with Agent Migration

As an administrator removing a provider,
I want agents using that provider's models migrated to the remaining provider's default model,
So that no agents are left with invalid model references.

**Acceptance Criteria:**

**Given** a provider is removed
**When** agents are using models from the removed provider
**Then** those agents are migrated to the new default provider's default model

**Test files:** `__tests__/api/settings-providers.test.ts`

---

## Epic 8: Audit, Usage, and Compliance

Implement HMAC-SHA256 signed audit trail, usage tracking with cost estimation, encryption at rest, security hardening, and compliance readiness for EU AI Act and GDPR.

### Story 8.1: Audit Trail Logging

As a compliance officer,
I want every admin state-change logged with actor, event type, resource, detail (JSON), and timestamp,
So that all platform changes are traceable.

**Acceptance Criteria:**

**Given** any POST/PUT/PATCH/DELETE handler that changes state
**When** the operation completes
**Then** `appendAuditLog` is called with actor ID, event type (e.g., `agent.created`, `user.invited`), resource identifier, and structured detail containing `{id, name}` entity references

**Given** audit logging
**When** the detail payload references entities
**Then** entities are snapshotted as `{id, name}` pairs (EntityRef) so they remain readable after deletion

**Test files:** `__tests__/lib/audit-append.test.ts`, `__tests__/api/agents-audit.test.ts`, `__tests__/api/user-config-audit.test.ts`

### Story 8.2: HMAC-SHA256 Row Signing

As a security engineer,
I want every audit row signed with HMAC-SHA256 using canonical JSON sorting,
So that tampering with any audit entry is cryptographically detectable.

**Acceptance Criteria:**

**Given** an audit row with timestamp, actorType, actorId, eventType, resource, and detail
**When** computeRowHmac is called
**Then** a 64-character hex string is returned

**Given** the same input values
**When** computeRowHmac is called multiple times
**Then** the same HMAC is produced (deterministic)

**Given** different input values
**When** computeRowHmac is called
**Then** different HMACs are produced

**Given** JSON detail objects with keys in different order (e.g., after PostgreSQL JSONB roundtrip)
**When** computeRowHmac is called
**Then** the same HMAC is produced (canonical JSON sorting ensures order-independence)

**Given** nested objects with reordered keys
**When** computeRowHmac is called
**Then** the same HMAC is produced

**Test files:** `__tests__/lib/audit.test.ts`

### Story 8.3: Audit Trail Integrity Verification

As an administrator,
I want to verify the integrity of the entire audit trail,
So that I can prove to compliance officers that no entries have been tampered with.

**Acceptance Criteria:**

**Given** an admin
**When** GET /api/audit/verify is called
**Then** HMACs are recomputed for all rows and `{valid: true, totalChecked: N, invalidIds: []}` is returned if all match

**Given** tampered audit entries
**When** GET /api/audit/verify is called
**Then** `{valid: false, totalChecked: N, invalidIds: [3, 7]}` is returned listing the tampered row IDs

**Given** a non-admin user
**When** GET /api/audit/verify is called
**Then** 403 is returned

**Test files:** `__tests__/api/audit-verify.test.ts`, `__tests__/lib/audit-verify.test.ts`

### Story 8.4: Audit Trail CSV Export with Filtering

As a compliance officer,
I want to export audit logs as CSV with event type and date range filters,
So that I can produce compliance reports.

**Acceptance Criteria:**

**Given** an admin
**When** GET /api/audit/export is called with optional event type and date range filters
**Then** a CSV file is returned with all audit fields matching the filters

**Given** a non-admin user
**When** GET /api/audit/export is called
**Then** 403 is returned

**Test files:** `__tests__/api/audit-export.test.ts`

### Story 8.5: Usage Recording per Session

As a platform tracking AI costs,
I want token usage (input, output, cache) and estimated cost recorded per session,
So that administrators can monitor and allocate AI spending.

**Acceptance Criteria:**

**Given** an agent conversation completes a turn
**When** usage data is received from OpenClaw
**Then** a usage record is created with user_id, agent_id, agent_name (snapshot), session_key, model, token counts, and estimated_cost_usd

**Given** usage recording
**When** it runs during chat
**Then** it is fire-and-forget (non-blocking -- errors do not affect chat flow)

**Given** concurrent usage writes for the same session
**When** they occur simultaneously
**Then** per-session serialization prevents race conditions

**Test files:** `__tests__/lib/usage.test.ts`, `__tests__/db/usage-schema.test.ts`

### Story 8.6: Usage Dashboards and Export

As an administrator,
I want usage summaries by agent, by user, and over time, with CSV/JSON export,
So that I can track AI consumption across the organization.

**Acceptance Criteria:**

**Given** an admin
**When** GET /api/usage/summary is called
**Then** aggregated per-agent data is returned with total input tokens, output tokens, and cost

**Given** the query parameter `?days=7`
**When** the summary is requested
**Then** only the last 7 days of data are included

**Given** the query parameter `?agentId=X`
**When** the summary is requested
**Then** only data for that agent is returned

**Given** an unauthenticated request
**When** GET /api/usage/summary is called
**Then** 401 is returned

**Given** a non-admin user
**When** GET /api/usage/summary is called
**Then** 403 is returned

**Given** an invalid days parameter
**When** GET /api/usage/summary is called
**Then** 400 is returned

**Given** no usage data
**When** GET /api/usage/summary is called
**Then** an empty array is returned

**Test files:** `__tests__/api/usage-summary.test.ts`, `__tests__/api/usage-by-user.test.ts`, `__tests__/api/usage-timeseries.test.ts`, `__tests__/api/usage-export.test.ts`

### Story 8.7: AES-256-GCM Encryption at Rest

As a security engineer,
I want API keys encrypted with AES-256-GCM before storage,
So that compromised database backups do not expose provider credentials.

**Acceptance Criteria:**

**Given** a plaintext API key
**When** encrypt is called
**Then** the output is in format `{iv_hex}:{auth_tag_hex}:{encrypted_hex}` and is different from the plaintext

**Given** the same plaintext encrypted twice
**When** compared
**Then** the ciphertexts differ (unique IV per encryption)

**Given** valid ciphertext
**When** decrypt is called with the correct key
**Then** the original plaintext is returned

**Given** invalid ciphertext format
**When** decrypt is called
**Then** an error is thrown

**Given** ENCRYPTION_KEY environment variable is set with 64 hex characters
**When** getEncryptionKey is called
**Then** the key is used

**Given** ENCRYPTION_KEY is not set and no key file exists
**When** getEncryptionKey is called
**Then** an error is thrown referencing ENCRYPTION_KEY

**Given** ENCRYPTION_KEY contains non-hex characters
**When** getEncryptionKey is called
**Then** an error is thrown

**Test files:** `__tests__/lib/encryption.test.ts`

### Story 8.8: Security Hardening (Sanitization, Timing-Safe Auth, Path Traversal)

As a security engineer,
I want audit payloads sanitized, gateway tokens compared timing-safely, and knowledge base paths validated against traversal,
So that the platform resists common attack vectors.

**Acceptance Criteria:**

**Given** an audit detail payload containing passwords, tokens, or API keys
**When** the payload is sanitized before logging
**Then** sensitive fields are redacted

**Given** audit detail exceeding 2048 bytes
**When** the payload is processed
**Then** it is auto-truncated with `_truncated: true` appended

**Given** an internal API request with a gateway token
**When** requireGatewayToken validates it
**Then** constant-time comparison is used (preventing timing attacks)

**Given** a knowledge base file path containing ".." or symlinks
**When** realpath validation runs
**Then** the path is resolved and rejected if it falls outside allowed directories

**Test files:** `__tests__/lib/audit-sanitize.test.ts`, `__tests__/lib/gateway-auth.test.ts`, `__tests__/lib/path-validation.test.ts`, `__tests__/security/api-auth-check.test.ts`

### Story 8.9: WebSocket Rate Limiting

As a security engineer,
I want IP-based upgrade rate limiting and per-user connection limits on WebSocket,
So that the platform resists connection-flooding attacks.

**Acceptance Criteria:**

**Given** a rate limiter with maxConnectionsPerUser of 3
**When** a user opens 3 connections
**Then** all 3 are allowed, but the 4th is rejected

**Given** per-user connection tracking
**When** connections are tracked independently per user
**Then** one user hitting the limit does not affect other users

**Given** a connection is closed
**When** releaseConnection is called
**Then** a slot is freed for a new connection

**Given** a rate limiter with maxUpgradesPerIpPerMinute of 3
**When** 3 upgrades from the same IP occur within 60 seconds
**Then** all 3 are allowed, but the 4th is rejected

**Given** the 60-second window expires
**When** a new upgrade is attempted
**Then** the counter resets and the upgrade is allowed

**Test files:** `__tests__/server/ws-rate-limit.test.ts`

### Story 8.10: Non-Root Docker Execution and Infrastructure

As a deployment engineer,
I want the Pinchy container to run as a non-root user with health checks and migration-on-startup,
So that the deployment follows security best practices.

**Acceptance Criteria:**

**Given** the Pinchy Docker image
**When** the container starts
**Then** the process runs as `pinchy:pinchy` user (non-root)

**Given** a fresh database
**When** the container starts
**Then** Drizzle migrations run automatically via server-preload.cjs before the app initializes

**Given** the 3-service Docker Compose stack
**When** `docker compose up` is run
**Then** PostgreSQL starts first (with health check), then OpenClaw, then Pinchy (which depends on both)

**Given** GET /api/health is called
**When** the service is running
**Then** a health status response is returned

**Test files:** `__tests__/server/server-preload.test.ts`, `__tests__/api/health-openclaw.test.ts`, `__tests__/security/security-headers.test.ts`

---

*Reverse-engineered from production codebase (671 commits, ~85K LOC). All stories describe implemented functionality. Acceptance Criteria derived from test assertions across 154 unit test files and 4 E2E specs in packages/web/src/__tests__/ and packages/web/e2e/.*
