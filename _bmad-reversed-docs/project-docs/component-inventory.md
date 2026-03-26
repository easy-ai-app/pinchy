# Pinchy - Component Inventory

**Date:** 2026-03-26

## Overview

Pinchy's UI is built with React 19, Tailwind CSS v4, shadcn/ui primitives, and assistant-ui for chat. Components are organized into three tiers: shadcn/ui primitives (22), assistant-ui chat components (6), and feature-specific components (35+).

## UI Primitives (shadcn/ui)

Located in `packages/web/src/components/ui/`. These are generated via shadcn CLI and follow Radix UI patterns.

| Component | File | Description |
|-----------|------|-------------|
| AlertDialog | alert-dialog.tsx | Modal confirmation dialogs |
| Alert | alert.tsx | Inline alert messages |
| Avatar | avatar.tsx | User/agent avatars |
| Badge | badge.tsx | Status badges and labels |
| Button | button.tsx | Primary action buttons (CVA variants) |
| Card | card.tsx | Content container cards |
| Checkbox | checkbox.tsx | Checkbox input |
| Collapsible | collapsible.tsx | Expandable content sections |
| Dialog | dialog.tsx | Modal dialogs |
| Form | form.tsx | Form wrapper (react-hook-form integration) |
| Input | input.tsx | Text input fields |
| Label | label.tsx | Form labels |
| Select | select.tsx | Dropdown select |
| Separator | separator.tsx | Visual divider |
| Sheet | sheet.tsx | Slide-out panel |
| Sidebar | sidebar.tsx | Navigation sidebar primitive |
| Skeleton | skeleton.tsx | Loading placeholder |
| Sonner | sonner.tsx | Toast notifications |
| Table | table.tsx | Data table |
| Tabs | tabs.tsx | Tab navigation |
| Textarea | textarea.tsx | Multi-line text input |
| Tooltip | tooltip.tsx | Hover tooltips |

## Chat Components (assistant-ui)

Located in `packages/web/src/components/assistant-ui/`. These integrate with the assistant-ui library for thread-based chat.

| Component | File | Description |
|-----------|------|-------------|
| Thread | thread.tsx | Main chat thread (messages + composer) |
| MarkdownText | markdown-text.tsx | Markdown rendering for assistant messages |
| ChatImage | chat-image.tsx | Image display in chat messages |
| Attachment | attachment.tsx | File attachment handling |
| ToolFallback | tool-fallback.tsx | Fallback UI for tool invocations |
| TooltipIconButton | tooltip-icon-button.tsx | Icon button with tooltip |

## Feature Components

Located in `packages/web/src/components/`. These implement specific features of the Pinchy platform.

### Agent Management

| Component | File | Description |
|-----------|------|-------------|
| AgentList | agent-list.tsx | Grid/list of agents with navigation |
| NewAgentForm | new-agent-form.tsx | Agent creation form |
| DeleteAgentDialog | delete-agent-dialog.tsx | Agent deletion confirmation |
| TemplateSelector | template-selector.tsx | Agent template picker (KB, etc.) |
| AgentSettingsPageContent | agent-settings-page-content.tsx | Agent settings page wrapper |
| AgentSettingsGeneral | agent-settings-general.tsx | General agent settings (name, model, greeting) |
| AgentSettingsPermissions | agent-settings-permissions.tsx | Tool allow-list configuration |
| AgentSettingsAccess | agent-settings-access.tsx | Agent visibility + group access |
| AgentSettingsFile | agent-settings-file.tsx | Knowledge base directory config |
| AgentSettingsPersonality | agent-settings-personality.tsx | Personality preset selection |
| AgentsProvider | agents-provider.tsx | React context for agent data |

### Chat

| Component | File | Description |
|-----------|------|-------------|
| Chat | chat.tsx | Main chat component (WebSocket + assistant-ui) |
| MobileChatHeader | mobile-chat-header.tsx | Mobile-optimized chat header |

### Settings

| Component | File | Description |
|-----------|------|-------------|
| SettingsPageContent | settings-page-content.tsx | Settings page tab container |
| SettingsProfile | settings-profile.tsx | User profile settings |
| SettingsUsers | settings-users.tsx | User management (admin) |
| SettingsGroups | settings-groups.tsx | Group management (enterprise) |
| SettingsContext | settings-context.tsx | Organization context editor |
| SettingsLicense | settings-license.tsx | Enterprise license key input |

### User Management

| Component | File | Description |
|-----------|------|-------------|
| InviteDialog | invite-dialog.tsx | User invite dialog (email, role, groups) |
| UserDetailSheet | user-detail-sheet.tsx | Slide-out user detail panel |

### Provider Configuration

| Component | File | Description |
|-----------|------|-------------|
| ProviderKeyForm | provider-key-form.tsx | AI provider API key input form |
| RestartProvider | restart-provider.tsx | Provider connection restart trigger |

### Navigation & Layout

| Component | File | Description |
|-----------|------|-------------|
| AppShell | app-shell.tsx | Authenticated layout (sidebar + content) |
| Sidebar | sidebar.tsx | Main navigation sidebar |
| BottomTabBar | bottom-tab-bar.tsx | Mobile bottom navigation |

### Audit & Usage

| Component | File | Description |
|-----------|------|-------------|
| AuditLogTable | audit-log-table.tsx | Paginated audit log with filters |
| UsageDashboard | usage-dashboard.tsx | Usage charts and summary (recharts) |

### Shared / Utility

| Component | File | Description |
|-----------|------|-------------|
| SetupForm | setup-form.tsx | Setup wizard form |
| PasswordInput | password-input.tsx | Password field with visibility toggle |
| MarkdownEditor | markdown-editor.tsx | Markdown editing with preview |
| DirectoryPicker | directory-picker.tsx | File directory selection for KB agents |
| StatusBadge | status-badge.tsx | Colored status indicator |
| DocsLink | docs-link.tsx | Link to documentation site |
| ReportIssueLink | report-issue-link.tsx | GitHub issue creation link |
| LogoutButton | logout-button.tsx | Sign-out button |
| DevToolbar | dev-toolbar.tsx | Development-only toolbar |
| EnterpriseBanner | enterprise-banner.tsx | Enterprise upsell banner |
| EnterpriseFeatureCard | enterprise-feature-card.tsx | Enterprise feature gating card |

## React Hooks

Located in `packages/web/src/hooks/`.

| Hook | File | Description |
|------|------|-------------|
| useAgents | use-agents.ts | Fetches and caches agent list, provides CRUD helpers |
| useWsRuntime | use-ws-runtime.ts | Manages WebSocket connection + assistant-ui runtime |
| useMobile | use-mobile.ts | Responsive breakpoint detection |
| useTabParam | use-tab-param.ts | URL search param-based tab state |

## State Management

### Client-Side (zustand)
- **draft-store.ts:** Persists chat message drafts per agent across navigation. Uses zustand with no persistence middleware (memory only).

### Context Providers
- **AgentsProvider:** React context providing agent list and mutation functions to child components
- **RestartProvider:** Context for triggering and tracking OpenClaw restart state

## Design System Notes

- **Color scheme:** Dark/light mode via `next-themes`
- **Typography:** System font stack via Tailwind defaults
- **Icons:** Lucide React icon library
- **Avatars:** Generated via DiceBear (fun-emoji collection) with per-agent seeds
- **Toasts:** Sonner for non-blocking notifications
- **Forms:** react-hook-form + zod for validation, shadcn/ui Form wrapper
- **Responsive:** Mobile-first with `useMobile` hook for breakpoint detection, bottom tab bar for mobile, sidebar for desktop

---

_Generated using BMAD Method `document-project` workflow_
