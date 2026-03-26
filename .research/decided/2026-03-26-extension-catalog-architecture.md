# Extension Catalog Architecture: Manifest-first + DB Hybrid

**Status**: decided
**Date**: 2026-03-26
**Project**: Pinchy

## Question

How to organize a self-hosted catalog of skills, plugins, and extensions available to multitenant OpenClaw agents?

## Context

Pinchy needs a plugin/extension catalog that works offline, isolates tenants, handles credentials for third-party APIs, and supports all extension types (MCP servers, OpenClaw plugins, agent templates, skills). Currently has 3 hand-built plugins with no catalog system.

## Options Investigated

### Option A: Git-based Registry
- **Pros**: Fully offline, aligns with OpenClaw's filesystem model, auditable via git history, no new infrastructure
- **Cons**: Credential management unsolved by git, no dependency resolution, tenant-scoped publishing is manual, no semantic search, ClawHub already exists upstream
- **Complexity**: Low-Medium
- **Best for**: 1-20 tenants, tens of extensions, simplicity-first teams
- **Sources**: Homebrew Taps, Helm Plugins, Flux multi-tenancy, ClawHub

### Option B: DB + Filesystem Catalog
- **Pros**: Already fits Pinchy's architecture (evolution, not rewrite), offline-first, tenant isolation via SQL WHERE, credential injection reuses existing AES-256-GCM, OpenClaw hot-reload compatible
- **Cons**: Filesystem+DB drift risk, no atomic install, Docker volume complexity, no built-in dependency resolution
- **Complexity**: Low-Medium
- **Best for**: <500 extensions, single-digit tenants, on-prem enterprise
- **Sources**: Grafana plugin management, WordPress plugin system, Backstage plugin architecture

### Option C: OCI/Container Registry (Harbor/Zot)
- **Pros**: Harbor gives tenant isolation for free, immutable versioning, supply chain security tooling (cosign, Trivy), offline-first
- **Cons**: Zero catalog/marketplace concept (must build all UI), no credential handling, rough DX for plugin authors (ORAS), mismatch with current npm/filesystem plugin format
- **Complexity**: Medium-High
- **Best for**: 10+ tenants, 50+ plugins, when external plugin authors exist
- **Sources**: Harbor RBAC, ORAS, Zot registry
- **Verdict**: Premature for Pinchy today. Clear migration path when needed.

### Option D: Manifest-first Filesystem
- **Pros**: Already half-built (openclaw.plugin.json exists), offline-native, composable with Docker Compose, credential declaration explicit in manifest (auto-generate UI forms), tenant isolation as catalog filter
- **Cons**: Schema evolution painful (Dify lesson: 5 breaking revisions in 12 months), hot-reload deceptively hard on Docker/NFS, credential env var leakage across in-process plugins
- **Complexity**: Low-Medium
- **Best for**: 5-50 plugins, operator-controlled environments
- **Sources**: Dify manifest schema, VS Code extension manifest, Terraform providers

## Decision

**Hybrid of Options B + D: Manifest-first + DB**

- **Manifest on disk** = source of truth for WHAT (type, permissions, required_credentials, schema)
- **DB** = source of truth for WHO (tenant scoping, activation status, stored credentials)
- **Scanner at startup** reconciles filesystem vs DB (Grafana pattern)
- **Credentials** declared in manifest, stored encrypted in DB per-tenant, injected as namespaced env vars

Architecture:
1. `/plugins/{plugin-id}/plugin.json` declares capabilities
2. Scanner reads all plugin dirs, validates against JSON Schema, syncs to `catalog_extensions` table
3. Admin UI shows tenant-scoped catalog, auto-generates credential forms from manifest
4. `regenerateOpenClawConfig()` includes activated plugins with injected credentials
5. OpenClaw hot-reloads via file watcher

Key design decisions:
- Pin `schemaVersion: 1` in manifest from day one
- Startup reconciliation scan (filesystem vs DB)
- Write lock on `regenerateOpenClawConfig()` for concurrent installs
- `activation: "on-agent-start" | "always"` in manifest
- `ON DELETE CASCADE` for credentials on extension removal
- Namespaced env vars (`PLUGIN_{NAME}__{KEY}`) for credential isolation

## Rejected Alternatives

- **Git-based (A)**: Redundant — manifest+DB provides same benefits without git overhead. ClawHub exists upstream for public extensions.
- **OCI Registry (C)**: Premature at current scale (3 plugins). Clear migration path to Harbor when 50+ extensions or external authors emerge.

## Sub-decisions

- **Credential flow**: Under active investigation (see `.research/active/credential-flow.md`)

## Open Questions

- How exactly to inject credentials into MCP servers started by OpenClaw (env vars at spawn time vs. config file)
- Whether OpenClaw supports per-server env var injection or needs wrapper script
- Dependency resolution strategy (skip for v1 or basic `requires` field)
- ClawHub integration path (import from public registry into private catalog)
