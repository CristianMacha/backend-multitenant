-- AlterTable: domain_event_outbox — capture actor/request metadata at write time
-- so the background outbox processor can attribute audit entries even though it
-- runs outside the request's AsyncLocalStorage context.
ALTER TABLE "domain_event_outbox"
    ADD COLUMN "user_id"        UUID,
    ADD COLUMN "correlation_id" TEXT,
    ADD COLUMN "ip_address"     TEXT,
    ADD COLUMN "user_agent"     TEXT;
