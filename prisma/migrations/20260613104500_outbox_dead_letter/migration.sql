-- AlterTable: domain_event_outbox — failure tracking / dead-letter.
-- Rows with a non-null failed_at are dead-lettered: excluded from the drain so
-- a poison message stops being retried forever and never starves newer events.
ALTER TABLE "domain_event_outbox"
    ADD COLUMN "attempts"   INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "last_error" TEXT,
    ADD COLUMN "failed_at"  TIMESTAMPTZ;
