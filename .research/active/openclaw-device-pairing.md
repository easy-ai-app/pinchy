# OpenClaw Device Pairing for Per-Tenant Containers

## Status: ACTIVE — Blocking per-tenant chat

## Problem
OpenClaw rejects WebSocket connections from Pinchy's `TenantOpenClawPool` with code 1008 (Policy Violation). The `openclaw-node` client in Pinchy has a device identity (`/app/secrets/device-identity.json`) that is NOT approved in per-tenant OpenClaw containers.

## What Works
- OpenClaw containers bind to `0.0.0.0:18789` (fixed with `--bind lan` + OpenClaw latest)
- Network connectivity confirmed: Pinchy can reach OpenClaw via Docker DNS
- Gateway token synced between DB and container
- `auto_approve_devices` loop runs in each container but "No pending device pairing requests" — connections close too fast for pairing to register

## Investigation Needed
1. How does openclaw-node initiate device pairing handshake?
2. Can we pre-register Pinchy's device identity in each tenant container at provisioning time?
3. Is there an OpenClaw config to disable device pairing (e.g., for trusted networks)?
4. Can we use `trustedProxies: ["172.16.0.0/12"]` to bypass device pairing?
5. Should we share device identity across containers (single Pinchy device → approved in all)?

## Possible Solutions
- A) Copy Pinchy's device-identity.json into OpenClaw container at provisioning → pre-approve
- B) Configure `gateway.auth.trustedProxies` in OpenClaw config to skip pairing for Docker IPs
- C) Use `openclaw devices add` CLI to pre-register Pinchy's device in each container
- D) Run openclaw-node client with `autoApprove: true` or similar option

## Related Code
- `packages/web/src/server/tenant-openclaw-pool.ts` — creates OpenClawClient per tenant
- `packages/web/src/lib/tenant-container-manager.ts` — provisions containers
- `config/start-openclaw.sh` — auto_approve_devices loop
- `/app/secrets/device-identity.json` — Pinchy's device identity
