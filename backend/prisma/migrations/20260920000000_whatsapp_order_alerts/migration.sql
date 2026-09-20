CREATE TABLE IF NOT EXISTS "whatsapp_notification_logs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "order_id" UUID NOT NULL,
  "recipient_phone" VARCHAR(20) NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "sent_at" TIMESTAMPTZ,
  "last_error" TEXT,
  "next_retry_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "whatsapp_notification_logs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "whatsapp_notification_logs_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "whatsapp_notification_logs_order_id_recipient_phone_key"
  ON "whatsapp_notification_logs"("order_id", "recipient_phone");
CREATE INDEX IF NOT EXISTS "whatsapp_notification_logs_status_next_retry_at_idx"
  ON "whatsapp_notification_logs"("status", "next_retry_at");