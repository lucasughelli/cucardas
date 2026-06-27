-- CreateTable
CREATE TABLE "cucarda_events" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "design_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cucarda_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cucarda_events_store_id_created_at_idx" ON "cucarda_events"("store_id", "created_at");

-- CreateIndex
CREATE INDEX "cucarda_events_design_id_created_at_idx" ON "cucarda_events"("design_id", "created_at");

-- AddForeignKey
ALTER TABLE "cucarda_events" ADD CONSTRAINT "cucarda_events_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
