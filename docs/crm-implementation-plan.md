# CRM Implementation Plan

> Phased plan to build the CRM business system on top of the existing enterprise backend core
> (NestJS 11 + Prisma/PostgreSQL + Redis/BullMQ + Firebase Auth, DDD bounded contexts + CQRS,
> multi-tenant, RBAC + granular permissions).
>
> Status: **Draft** · Owner: Cristian · Last updated: 2026-06-13

---

## 1. Goal & Scope

Build a multi-tenant CRM on the existing platform core. The product is split into five
functional areas requested by the business:

1. **Contacts & Accounts** — central database of people (contacts) and companies (accounts),
   with full relationship history.
2. **Sales & Opportunities (Pipeline)** — visual sales funnel; track each deal through its
   stage (new lead → meeting → proposal → won/lost).
3. **Tasks & Activities** — calls, meetings, emails and reminders linked to specific records.
4. **Dashboard** — landing screen with key metrics: today's tasks, open opportunity value,
   deals closed this month.
5. **Configuration & Security** — user roles (Admin, Sales Manager, Agent), access permissions
   and general settings.

### What already exists (do not rebuild)

The platform core already delivers most of **area 5 (Configuration & Security)**:

- **IAM** context: `auth` (Firebase), `users`, `roles`, `permissions` — RBAC + granular
  permissions, role/permission assignment with privilege-escalation guards.
- **Tenancy** context: `tenants`, per-tenant system roles (ADMIN / MANAGER / USER) seeded on
  tenant creation.
- **Audit** context: audit trail fed by the transactional outbox.
- Cross-cutting mechanics: response envelope, exception hierarchy, request context
  (AsyncLocalStorage), tenant-aware Prisma facade, Unit of Work, domain events → outbox → audit.

So area 5 is **configuration of new CRM roles/permissions**, not a new security system. CRM
permissions are added to the catalog incrementally in every phase and wired into the existing
role seeding.

---

## 2. Architectural Decisions (resolved)

These were decided up front because they shape the data model and module boundaries.

| #   | Decision                | Choice                            | Rationale                                                                                                                                                                                                                                                      |
| --- | ----------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Bounded-context layout  | **Two contexts: `crm` + `sales`** | Clean separation of relationship data vs. selling process. `crm` owns accounts, contacts and activities; `sales` owns pipelines and opportunities. Contexts integrate via domain events on the EventBus, never by importing internals.                         |
| D2  | Sales pipeline stages   | **Configurable per tenant**       | Each tenant defines its own `Pipeline` + ordered `Stage`s (name, order, probability %, won/lost flags). Real CRM behaviour; supports multiple pipelines per tenant. Adds a `Pipeline` aggregate.                                                               |
| D3  | Activity ↔ record links | **Typed polymorphic reference**   | `Activity` carries `(relatedToType, relatedToId)` so one activity can attach to an account, contact or opportunity. Referential integrity enforced in the application layer (the related record must exist and belong to the tenant), not via DB foreign keys. |
| D4  | Dashboard metrics       | **On-demand aggregation queries** | Dashboard query handlers run `COUNT`/`SUM` aggregations through Prisma at request time, cached briefly in Redis. Always fresh, minimal code; can evolve to event-driven projections later if scale demands it.                                                 |

### Resulting context / module map

```text
src/contexts/
  crm/                         ← NEW bounded context (relationship data)
    crm-context.module.ts
    accounts/                  ← Phase 1
    contacts/                  ← Phase 1
    activities/                ← Phase 3
  sales/                       ← NEW bounded context (selling process)
    sales-context.module.ts
    pipelines/                 ← Phase 2 (config: pipelines + stages)
    opportunities/             ← Phase 2
    dashboard/                 ← Phase 4 (query-only, read-side aggregation)
```

Each module follows the canonical four-layer vertical-slice layout (`domain` / `application` /
`infrastructure` / `presentation`) exactly like the IAM `users` module. Use the `/new-module`
skill to scaffold each one, and run the `arch-guardian` agent before every commit.

### Cross-context integration rules (apply throughout)

- A context **never imports another context's internals**. `sales` reacting to a contact being
  deleted listens for the `crm` domain event on the EventBus; it does not import crm classes.
- **Dashboard is the one read-side exception** and is documented as such: it is a query-only
  module that aggregates across tables it does not own. To keep boundaries honest, it reads via
  **read models / thin query services exported by each context's module**, not by reaching into
  another context's repositories or aggregates. No write path crosses contexts.
- Every new table has `tenant_id` + `created_at/updated_at/deleted_at` (snake_case `@@map`),
  soft-delete only, and every repository/query filters by `tenant_id` and `deletedAt: null`.
- Every mutation emits a domain event from the aggregate, and handlers pass `pullDomainEvents()`
  to `repository.save()` (→ outbox → audit) **and** `eventBus.publishAll(events)`.
- Branded ids for every aggregate (`AccountId`, `ContactId`, `OpportunityId`, `PipelineId`,
  `StageId`, `ActivityId`) added to `@shared/domain/types`.

---

## 3. Phase Breakdown

Phases are ordered by dependency. Each is independently shippable (its own feature branch + PR
via the `/feature` and `/ship` workflow) and leaves `main` green.

### Phase 0 — CRM foundations (thin, enabling)

**Goal:** lay shared primitives so the business phases don't each reinvent them.

- New branded id types in `@shared/domain/types`.
- Shared value objects needed across CRM: `PhoneNumber` (normalised), `Money` (amount + ISO
  currency) and an `Address` VO — in `@shared/domain/value-objects/` following the existing
  `Email` VO pattern.
- Create empty `crm-context.module.ts` and `sales-context.module.ts`, import both in
  `AppModule`.
- Extend the `Perm` catalog skeleton (`@shared/authorization/permissions.ts`) with the CRM
  permission namespaces (codes filled in per phase): `accounts.*`, `contacts.*`,
  `pipelines.*`, `opportunities.*`, `activities.*`, `dashboard.read`.
- Decide the CRM role mapping (applied in seeding from Phase 1 on):
  - **ADMIN** (tenant owner) — all CRM permissions.
  - **MANAGER** → repurposed as **Sales Manager** — full read on everything, manage pipelines,
    read/update all opportunities, reassign owners, read dashboard.
  - **USER** → repurposed as **Sales Agent** — CRUD on their own accounts/contacts/activities,
    manage opportunities they own, read their own dashboard.

**Deliverables:** VOs + branded types with unit tests, empty contexts wired, permission
namespaces reserved.
**Exit criteria:** `pnpm build` + `pnpm test` green; no behavioural change yet.

---

### Phase 1 — Contacts & Accounts (`crm` context) ★ MVP core

**Goal:** the central relationship database. Everything else references these records.

**Modules:** `crm/accounts`, `crm/contacts`.

**Domain model:**

- `Account` aggregate — company record: `name`, `industry?`, `website?`, `phone?` (PhoneNumber),
  `address?` (Address), `ownerId` (UserId), lifecycle (`active`/`archived`). Events:
  `AccountCreated`, `AccountUpdated`, `AccountArchived`, `AccountOwnerChanged`.
- `Contact` aggregate — person record: `firstName`, `lastName`, `email?` (Email),
  `phone?` (PhoneNumber), `jobTitle?`, optional `accountId` (a contact may belong to an
  account), `ownerId`. Events: `ContactCreated`, `ContactUpdated`, `ContactDeleted`,
  `ContactLinkedToAccount`.

**Application slices (per module):** `create-*`, `update-*`, `get-*` (paginated list with
search/filter), `get-*-by-id`, `archive/delete-*`, plus `on-account-mutated` cache invalidation
if we cache lookups. Contacts list supports filtering by `accountId`.

**Infrastructure:** Prisma `Account` + `Contact` models, mappers, repositories writing to outbox.

**Presentation:** REST controllers `/api/v1/accounts`, `/api/v1/contacts`, DTOs, Swagger via
`@ApiStandardResponse` / `@ApiPaginatedResponse`, guarded with `@Permissions(Perm.accounts.*)` /
`@Permissions(Perm.contacts.*)`. Use `@EffectiveTenantId()` where platform admins may cross
tenants.

**Permissions added:** `accounts.{create,read,update,delete}`, `contacts.{create,read,update,delete}`.

**Relationship history note:** the "full history of the relationship" requirement is satisfied
by the **activities timeline** delivered in Phase 3 — a first-class CRM concept owned by the
`crm` context. It is **not** built on top of `audit_logs`: the audit trail is a separate,
technical/compliance concern (who changed what, for security & traceability) and must not be
repurposed as a user-facing business feature, nor read across contexts. Until Phase 3 lands,
accounts/contacts have no relationship timeline; Phase 1 only owns the records themselves.

**Exit criteria:** create/list/update/archive accounts and contacts end-to-end; contacts linkable
to accounts; permissions seeded; arch-guardian clean; unit + e2e tests green.

---

### Phase 2 — Sales Pipeline & Opportunities (`sales` context) ★ MVP core

**Goal:** the visual sales funnel and deal tracking.

**Modules:** `sales/pipelines` (configuration), `sales/opportunities`.

**Domain model:**

- `Pipeline` aggregate (config) — `name`, `isDefault`, ordered `Stage[]` where each stage has
  `name`, `order`, `probability` (0–100), `type` (`OPEN` | `WON` | `LOST`). Invariants: exactly
  one default pipeline per tenant; at least one WON and one LOST stage; contiguous ordering.
  Events: `PipelineCreated`, `PipelineUpdated`, `StageAdded`, `StageRemoved`, `StagesReordered`.
- `Opportunity` aggregate — the deal: `name`, `accountId`, optional primary `contactId`,
  `pipelineId`, current `stageId`, `amount` (Money), `expectedCloseDate?`, `ownerId`,
  `status` (`OPEN`/`WON`/`LOST` derived from stage type), `closedAt?`. Behaviour:
  `moveToStage(stageId)` (validates the stage belongs to the opportunity's pipeline; sets
  won/lost + `closedAt` when entering a terminal stage). Events: `OpportunityCreated`,
  `OpportunityStageChanged`, `OpportunityWon`, `OpportunityLost`, `OpportunityReassigned`,
  `OpportunityAmountChanged`.

**Cross-context integration (event-driven, no internal imports):**

- `sales` listens for `ContactDeleted` / `AccountArchived` from `crm` to flag/handle dangling
  opportunities (e.g. block, or null the contact reference) — via the EventBus, reading only the
  event payload.
- Validation that `accountId`/`contactId` exist on opportunity creation is done through a thin
  **read service exported by the `crm` context module** (lookup-by-id returning a read model),
  not by importing crm repositories.

**Application slices:** pipelines — `create-pipeline`, `update-pipeline`, `add-stage`,
`reorder-stages`, `get-pipelines`. opportunities — `create-opportunity`, `move-opportunity-stage`,
`update-opportunity`, `reassign-opportunity`, `get-opportunities` (filter by pipeline/stage/owner/
status), `get-opportunity-by-id`, and a **board read model** (`get-pipeline-board`) returning
opportunities grouped by stage for the Kanban/funnel view.

**Presentation:** `/api/v1/pipelines`, `/api/v1/opportunities`. Pipeline configuration guarded by
`@Permissions(Perm.pipelines.*)` (Sales Manager / Admin only). Stage moves guarded by
`@Permissions(Perm.opportunities.update)`. Privilege rules: agents act on opportunities they own;
managers/admins on all (enforce ownership in handlers / via permission granularity).

**Permissions added:** `pipelines.{create,read,update,delete}`,
`opportunities.{create,read,update,delete,reassign}`.

**Exit criteria:** configure a pipeline with stages; create opportunities; drag through stages
to WON/LOST with correct `closedAt`/status; board endpoint returns grouped view; cross-context
events wired; tests green.

---

### Phase 3 — Tasks & Activities (`crm` context)

**Goal:** record calls/meetings/emails and reminders against any record; build the timeline that
completes the "relationship history".

**Module:** `crm/activities`.

**Domain model:**

- `Activity` aggregate — `type` (`CALL` | `MEETING` | `EMAIL` | `TASK` | `NOTE` | `SYSTEM`),
  `subject`, `body?`, `dueAt?`, `completedAt?`, `status` (`OPEN`/`DONE`), `ownerId?` (system
  entries have no human owner), `source` (`USER` | `SYSTEM`), and the polymorphic link
  `relatedToType` (`ACCOUNT` | `CONTACT` | `OPPORTUNITY`) + `relatedToId`. Behaviour:
  `complete()`, `reschedule(dueAt)`. Events: `ActivityCreated`, `ActivityCompleted`,
  `ActivityRescheduled`, `ActivityDeleted`.
- **Polymorphic integrity (D3):** on create, validate `relatedToId` exists and belongs to the
  tenant by calling the exported read service of the owning context (`crm` accounts/contacts in
  the same context; `sales` opportunities via the sales context module's read service / a
  validation event). No DB FK on the polymorphic column.

**System-generated timeline entries (relationship history):** the relationship history shown to
the salesperson is the activity timeline — a CRM business concept, **deliberately separate from
`audit_logs`** (which stays a purely technical/compliance trail). Significant business events
become **system activities** (`source: SYSTEM`, `type: SYSTEM`) so they appear in the customer's
history. An event handler in `crm/activities` (e.g. `on-opportunity-changed/`) listens on the
EventBus for relevant cross-context domain events — `OpportunityWon`, `OpportunityLost`,
`OpportunityCreated`, etc. — and creates a system activity linked to the related account/contact.
This reacts to the event payload only (no internal imports), and it means the history is an
explicit, owned CRM feature rather than a by-product of auditing. Only meaningful business events
are projected this way — not every technical field change.

**Reminders:** schedule due-date reminders via **BullMQ** (`platform/jobs`) — on
`ActivityCreated`/`ActivityRescheduled` with a `dueAt`, enqueue a delayed job; on completion,
the reminder is skipped/cancelled. (Delivery channel — in-app/email — is out of scope here; the
job just emits a `ReminderDue` signal for a future notifications module.)

**Application slices:** `create-activity`, `complete-activity`, `reschedule-activity`,
`delete-activity`, `get-activities` (filter by `relatedToType`+`relatedToId`, by owner, by
status, by due-date range → powers the calendar/list), and a **timeline read model**
(`get-record-timeline`) returning a record's chronological activity feed.

**Presentation:** `/api/v1/activities`. Guarded by `@Permissions(Perm.activities.*)`. Timeline
endpoints consumed by account/contact/opportunity detail screens.

**Permissions added:** `activities.{create,read,update,delete}`.

**Exit criteria:** log activities against accounts/contacts/opportunities; complete/reschedule;
filter by due date (calendar) and by record (timeline); reminders enqueued; tests green.

---

### Phase 4 — Dashboard (`sales/dashboard`, query-only)

**Goal:** the landing screen with at-a-glance metrics.

**Module:** `sales/dashboard` — **query-only** (no aggregate, no write path). The documented
read-side cross-context exception (see §2).

**Metrics (on-demand aggregation, D4):**

- **My tasks today** — count + list of `OPEN` activities with `dueAt` in [today] for the user.
- **Open opportunity value** — `SUM(amount)` of `OPEN` opportunities (scoped to owner for agents,
  tenant-wide for managers/admins), optionally weighted by stage probability.
- **Closed-won this month** — count + `SUM(amount)` of opportunities that became `WON` in the
  current month.
- **Funnel snapshot** — count + value per stage of the default pipeline.

**Implementation:** dedicated query handlers running Prisma aggregations, scoped by
`tenant_id`/owner/role, results cached in Redis for a short TTL (e.g. 30–60 s) keyed by
tenant+user+role. Aggregations read activity and opportunity tables via the read-model query
services exposed by `crm`/`sales` (no aggregate access).

**Presentation:** `/api/v1/dashboard` (e.g. `GET /dashboard/summary`), guarded by
`@Permissions(Perm.dashboard.read)`. Swagger documents the metric DTOs.

**Permissions added:** `dashboard.read`.

**Exit criteria:** single summary endpoint returns all metrics correctly scoped by role;
cached; tests cover agent vs. manager scoping; tests green.

---

### Phase 5 — Configuration & Security hardening + polish

**Goal:** finalise the role/permission story and operational concerns. Much of this is folded
into earlier phases; Phase 5 closes the gaps.

- **Final role seeding:** confirm ADMIN / Sales Manager (MANAGER) / Sales Agent (USER) permission
  sets in `prisma/seed.ts`, including all CRM permissions accumulated across phases. Verify
  privilege-escalation guard (`assertCanGrantPermissions`) coverage for any new role-assignment
  surface.
- **Ownership & visibility rules:** consolidate "agents see/act on their own records, managers see
  all" into a consistent, tested policy across accounts/contacts/opportunities/activities.
- **General settings (optional):** a small per-tenant `crm_settings` (default pipeline, default
  currency, business timezone for "today"/"this month" boundaries) if needed by Dashboard/reminders.
- **Cross-cutting QA:** arch-guardian full pass, `pnpm test:cov` ≥ 80 %, e2e happy-path for each
  area, Swagger review, performance sanity on list/board/dashboard endpoints (indexes on
  `tenant_id`, `ownerId`, `stageId`, `relatedTo*`, `dueAt`).

**Exit criteria:** role matrix verified by tests; coverage threshold met; arch-guardian clean;
docs (this file + README) updated.

---

## 4. Cross-cutting concerns & conventions (every phase)

- **Multi-tenancy:** every table has `tenant_id`; every repo/query filters by it and
  `deletedAt: null`. Soft delete only.
- **Events → outbox → audit:** emit events from aggregates; pass `pullDomainEvents()` to
  `repository.save()` (writes outbox in the same tx) and `eventBus.publishAll(events)`.
- **Branded ids & VOs:** cast raw strings at boundaries; use `Money`/`PhoneNumber`/`Address`/`Email`.
- **Read vs write paths:** commands → repository + aggregate; queries → PrismaService → read model.
- **Swagger envelope:** `@ApiStandardResponse` / `@ApiPaginatedResponse`.
- **Workflow:** scaffold with `/new-module <context> <module>`; branch+issue with `/feature`;
  validate + commit + PR with `/ship`; run `arch-guardian` before committing.
- **Migrations:** `pnpm prisma:migrate` + `pnpm prisma:generate` after each schema change; keep
  path aliases in tsconfig + jest + e2e in sync if any are added.

---

## 5. Phase summary & sequencing

| Phase | Area                        | Context / modules                        | New permissions                  | Depends on          |
| ----- | --------------------------- | ---------------------------------------- | -------------------------------- | ------------------- |
| 0     | Foundations                 | shared VOs, branded ids, empty contexts  | namespaces reserved              | core                |
| 1     | Contacts & Accounts ★       | `crm/accounts`, `crm/contacts`           | `accounts.*`, `contacts.*`       | 0                   |
| 2     | Pipeline & Opportunities ★  | `sales/pipelines`, `sales/opportunities` | `pipelines.*`, `opportunities.*` | 1                   |
| 3     | Tasks & Activities          | `crm/activities`                         | `activities.*`                   | 1 (2 for opp links) |
| 4     | Dashboard                   | `sales/dashboard` (query-only)           | `dashboard.read`                 | 2, 3                |
| 5     | Config & Security hardening | seeding, settings, QA                    | —                                | 1–4                 |

★ = minimum viable CRM. Phases 1–2 deliver a usable sales tool; 3–4 complete the requested
feature set; 5 hardens it.

---

## 6. Open questions (to revisit before/while building)

- **Pipeline weighting:** should "open opportunity value" be raw or probability-weighted by
  default? (Plan assumes raw, weighted optional.)
- **Activity reminder delivery:** which channel (in-app, email)? Out of scope now; a future
  `notifications` module would consume `ReminderDue`.
- **Multiple pipelines:** support several active pipelines per tenant from day one, or one
  default first? (Model supports many; UI may start with the default.)
- **Lead vs. Contact:** do we need a separate `Lead` concept, or is "new lead" simply the first
  stage of an opportunity tied to a contact? (Plan assumes the latter — no separate Lead entity.)
- **"Today"/"this month" boundaries:** per-tenant timezone needed for accurate dashboard buckets
  (see Phase 5 settings).
