-- CreateEnum
CREATE TYPE "store_user_role" AS ENUM ('ADMIN', 'EDITOR', 'VIEWER');

-- CreateTable
CREATE TABLE "store_users" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password_hash" TEXT NOT NULL,
    "role" "store_user_role" NOT NULL DEFAULT 'EDITOR',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "store_users_store_id_idx" ON "store_users"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "store_users_store_id_email_key" ON "store_users"("store_id", "email");

-- AddForeignKey
ALTER TABLE "store_users" ADD CONSTRAINT "store_users_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
