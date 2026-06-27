-- CreateEnum
CREATE TYPE "ab_test_variant" AS ENUM ('CONTROL', 'VARIANT_A', 'VARIANT_B');

-- AlterTable
ALTER TABLE "assignments" ADD COLUMN "variant" "ab_test_variant" NOT NULL DEFAULT 'CONTROL',
ADD COLUMN "weight" INTEGER;
