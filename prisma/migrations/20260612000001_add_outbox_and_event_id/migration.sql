-- CreateTable: domain_event_outbox
CREATE TABLE "domain_event_outbox" (
    "id"           UUID         NOT NULL DEFAULT gen_random_uuid(),
    "aggregate_id" TEXT         NOT NULL,
    "tenant_id"    UUID,
    "event_id"     TEXT         NOT NULL,
    "event_name"   TEXT         NOT NULL,
    "payload"      JSONB        NOT NULL,
    "published_at" TIMESTAMPTZ,
    "created_at"   TIMESTAMPTZ  NOT NULL DEFAULT now(),

    CONSTRAINT "domain_event_outbox_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "domain_event_outbox_event_id_key" ON "domain_event_outbox"("event_id");
CREATE INDEX "domain_event_outbox_published_at_created_at_idx" ON "domain_event_outbox"("published_at", "created_at");
