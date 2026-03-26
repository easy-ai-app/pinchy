---
title: "Product Brief: Pinchy"
status: "complete"
created: "2026-03-26"
updated: "2026-03-26"
inputs:
  - CLAUDE.md
  - PERSONALITY.md
  - _bmad-reversed-docs/research/technical-pinchy-research-2026-03-26.md
  - packages/web/ (codebase analysis)
---

# Product Brief: Pinchy

## Executive Summary

Every enterprise wants AI agents. Almost none of them can deploy them responsibly. Cloud platforms force data off-premises -- a non-starter for EU regulated industries bound by GDPR and the EU AI Act. Workflow builders chain steps visually but do not produce autonomous, reasoning agents. Agent frameworks like CrewAI and LangChain are libraries, not platforms -- they ship without UI, authentication, permissions, or deployment. And OpenClaw, the most popular open-source AI agent runtime (247K GitHub stars), is built for individual power users with no concept of teams, permissions, or audit.

Pinchy is the enterprise governance layer for OpenClaw. It wraps the most powerful open-source agent runtime with the controls that organizations require: allow-list agent permissions, HMAC-SHA256 signed audit trails, user management with invite-based onboarding, group-based access control, and full data sovereignty through self-hosted Docker Compose deployment. Pinchy does not replace OpenClaw -- it governs it. Your server, your data, your models.

The timing is structural. Over 80% of organizations are deploying AI agents, but fewer than half have security policies in place. The Cloud Security Alliance reports that two-thirds of organizations cannot distinguish AI agent actions from human actions. EU regulatory pressure (AI Act Article 19, GDPR) is creating a market segment where cloud-hosted platforms simply cannot compete. Pinchy is built for that segment.

## The Problem

A CTO at a European financial services firm wants to deploy AI agents for her team. She faces four bad options:

1. **Cloud SaaS** (Dust at 29 EUR/user/month, Glean, StackAI): Capable platforms, but client data leaves her servers. Her compliance officer says no. Her regulator agrees.

2. **Vendor lock-in** (Microsoft Copilot Studio, Google Gemini Enterprise): Tied to one ecosystem, one model provider, proprietary and cloud-only. She needs model flexibility and data sovereignty.

3. **Workflow builders** (n8n, Dify): Self-hostable, but these chain steps visually. She needs autonomous agents that reason, use tools, and remember context -- not flowchart automation.

4. **OpenClaw directly**: The best agent runtime available. But it is single-user. No way to manage who can access which agents, no way to restrict what tools agents can use, no audit trail for compliance, no invite system for her team. She would need to build all of that herself.

The result: her team uses AI agents informally, without governance, without audit trails, without permission controls. Or they do not use them at all. Both outcomes are unacceptable.

## The Solution

Pinchy adds the enterprise layer that OpenClaw lacks, without replacing what OpenClaw does well.

**What is implemented today (production-ready core):**

- **Setup wizard** -- first admin creation, provider configuration, guided onboarding. `docker compose up` and the platform is running.
- **Authentication** -- email/password via Better Auth, database sessions, admin and member roles.
- **Provider configuration** -- Anthropic, OpenAI, Google with encrypted API key storage (AES-256-GCM) and live validation.
- **Agent chat** -- streaming conversations via OpenClaw WebSocket bridge with real-time tool execution.
- **Agent permissions (allow-list model)** -- agents start with zero tools. Admins explicitly grant specific capabilities. Safe tools (list files, read approved directories) are separated from powerful tools (shell access, web requests, file writes).
- **Knowledge Base agents** -- template-based creation with scoped read-only file access via the pinchy-files plugin.
- **User management** -- invite system with token-based onboarding, role assignment, deactivation/reactivation.
- **Groups** -- group-based agent visibility for enterprise access control.
- **Personal and shared agents** -- every user gets Smithers (personal assistant); admins control shared agent access.
- **Smithers onboarding interview** -- new users are greeted by Smithers, a personal AI assistant who learns about them through conversation and saves context via plugin tools. This is not a form -- it is a conversation. Admins are additionally asked about their organization. The result: every user gets a personalized agent experience from minute one.
- **Audit trail** -- every admin action logged with HMAC-SHA256 signed rows, integrity verification, and CSV export. Designed to meet EU AI Act Article 19 retention requirements (6+ months). Compliance-ready.
- **Usage tracking** -- per-user and per-agent token counts with cost estimation.
- **Docker Compose deployment** -- single command to run the full stack (Next.js, PostgreSQL 17, OpenClaw runtime).

## What Makes This Different

No competitor offers the combination of self-hosted + open-source + agent-level RBAC + cryptographic audit trail + model-agnostic deployment built on top of the most popular agent runtime.

| Dimension | Pinchy | Nearest Alternative |
|-----------|--------|-------------------|
| Data sovereignty | Fully self-hosted, offline-capable with Ollama | n8n/Dify self-host but lack agent governance |
| Agent permissions | Allow-list model (zero tools by default) | Copilot Studio has controls but is cloud-only |
| Audit trail | HMAC-SHA256 signed, CSV export, integrity checks | Dust/StackAI have logs but are cloud-hosted |
| Agent runtime | OpenClaw (247K stars, autonomous reasoning) | Dify/n8n use visual workflows, not agent loops |
| Model support | Any provider or local models via Ollama | Copilot Studio / Gemini Enterprise are vendor-locked |
| License | AGPL-3.0 (open source, prevents proprietary cloud forks) | n8n fair-code, Dify open-source, others proprietary |

**The core moat**: Pinchy's allow-list permission model aligns with the emerging zero-trust AI agent security standards (Microsoft ZT4AI, Cisco agent identity framework). Agents start with nothing and are granted specific tools -- the same principle the industry is converging on, already implemented.

**Why not build it yourself on OpenClaw?** You could. You would need to implement authentication, session management, user invites, role-based access, agent-level tool permissions, encrypted API key storage, HMAC-signed audit logging, a WebSocket bridge, a React UI, database migrations, and Docker orchestration. That is 6-12 months of engineering for a team of two. Pinchy ships it today, maintained and updated as OpenClaw evolves. OpenClaw 3.0's agent pool architecture already validates this approach -- Pinchy leverages upstream improvements without maintaining a fork.

## Who This Serves

**Primary: IT leaders and CTOs at EU regulated enterprises (50-500 employees)**

Industries: financial services, healthcare, legal, government, and any organization where data cannot leave company infrastructure. These buyers need AI agents for productivity but face regulatory constraints that eliminate cloud platforms. They have internal IT capacity to run Docker Compose deployments but do not have the engineering team to build a governance platform from scratch. Deployment requires a Linux server with Docker -- no specialized infrastructure.

**The buyer**: CTO, VP of Engineering, or Head of IT. Evaluates based on compliance, data sovereignty, and operational control. Procurement cycle: 1-3 months.

**The users**: Knowledge workers, analysts, support staff, and developers within the organization. They interact with agents through the web UI. They do not need to understand OpenClaw, Docker, or the underlying infrastructure.

**Secondary: OpenClaw power users who outgrow single-user mode**

Consultants, agencies, and small teams already using OpenClaw who need to share agents across a team with basic access control and audit.

## Success Criteria

**User adoption signals:**
- Time from `docker compose up` to first agent conversation: under 10 minutes
- Active users per deployment: targeting 10+ per organization
- Agent interactions per user per week: sustained usage indicating real workflow integration

**Business signals:**
- Enterprise license conversions (ES256 JWT gated features)
- Deployments in regulated industries (finance, healthcare, legal)
- Community growth: GitHub stars, contributor count, documentation engagement

**Technical signals:**
- Audit trail integrity: zero undetected tampering across all deployments
- Zero data exfiltration: all data remains on customer infrastructure
- OpenClaw compatibility: seamless upgrades when OpenClaw releases new versions

## Scope

**In scope (implemented):**
- Core platform: setup, auth, agent chat, permissions, audit, user management, groups, knowledge base agents, usage tracking, Docker deployment

**In scope (next phase):**
- Granular RBAC (per-team, per-role permissions beyond admin/member)
- SSO/SAML integration (a common enterprise procurement requirement)
- Plugin marketplace (extending beyond pinchy-files and pinchy-context)
- Cross-channel workflows (input on email, output on Slack -- properly routed and permissioned)

**Explicitly out of scope:**
- Managed cloud hosting (Pinchy is self-hosted only -- this is a feature, not a limitation)
- Forking or replacing OpenClaw (Pinchy wraps and governs, it does not reinvent the runtime)
- Building a new agent runtime (OpenClaw is the runtime; Pinchy is the enterprise layer)
- Mobile native apps (web-first, responsive design)

## Vision

If Pinchy succeeds, it becomes the standard way enterprises deploy OpenClaw. Every organization running AI agents on their own infrastructure uses Pinchy to govern them -- the same way organizations use Keycloak for identity or Vault for secrets, but for AI agents.

In 2-3 years:
- **Plugin marketplace**: A curated ecosystem of enterprise-grade agent capabilities, each with scoped permissions and audit integration. Organizations install capabilities like apps, with governance built in.
- **Agentic RBAC**: Dynamic, context-aware permissions that evaluate at execution time -- not just "admin can do X" but "this agent can access HR data only during business hours for users in the HR group."
- **Cross-channel orchestration**: Agents that receive input from email, process it, and respond on Slack -- with every step permissioned, audited, and traceable.
- **Compliance certifications**: SOC 2 Type II, ISO 27001, and EU AI Act compliance built into the platform, making Pinchy the path of least resistance for regulated AI agent deployment.

The endgame: OpenClaw is to AI agents what Linux is to servers. Pinchy is to OpenClaw what Red Hat is to Linux -- the enterprise layer that makes it deployable, governable, and trustworthy at scale.
