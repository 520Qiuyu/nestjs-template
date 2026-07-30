# IP Blacklist Backend Implementation Plan

> **For agentic workers:** Execute task-by-task. Steps use checkbox syntax.

**Goal:** Prisma `IpBlacklist` 表 + `/api/ip-blacklist` CRUD（含 unblock），无拦截/自动拉黑。

**Architecture:** `src/ipBlacklist/` 顶层模块；Zod DTO；Service 用 Prisma；解除用 `POST :id/unblock`。

**Tech Stack:** NestJS + Prisma + Zod + nestjs-zod

**Spec:** `docs/superpowers/specs/2026-07-30-ip-blacklist-backend-design.md`

## Tasks

### Task 1: Prisma model + migrate
- [ ] Add `IpBlacklist` to `prisma/schema.prisma`
- [ ] Run `npx prisma migrate dev --name add-ip-blacklist` (or `db push` if migrate blocked)

### Task 2: Module CRUD
- [ ] Create dto / service / controller / module under `src/ipBlacklist/`
- [ ] Register in `app.module.ts`

### Task 3: Permission sync
- [ ] `sync-permission-resources.ts` + wire into `run-all-sync-permission-resources.ts`
- [ ] PARENT_ID placeholder comment (menu may not exist yet)

### Task 4: Verify
- [ ] `nest build` succeeds
- [ ] dry-run permission sync parses routes
