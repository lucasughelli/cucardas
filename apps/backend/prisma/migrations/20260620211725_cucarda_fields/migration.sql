-- CreateEnum
CREATE TYPE "cucarda_type" AS ENUM ('IMAGE', 'TEXT');

-- CreateEnum
CREATE TYPE "cucarda_location" AS ENUM ('PRODUCT_PAGE', 'PRODUCT_GRID', 'BOTH');

-- CreateEnum
CREATE TYPE "cucarda_position" AS ENUM ('TOP_LEFT', 'TOP_RIGHT', 'BOTTOM_LEFT', 'BOTTOM_RIGHT', 'CENTER');

-- CreateEnum
CREATE TYPE "cucarda_animation" AS ENUM ('NONE', 'PULSE', 'BLINK', 'BOUNCE', 'SHAKE');

-- CreateEnum
CREATE TYPE "cucarda_size" AS ENUM ('SMALL', 'MEDIUM', 'LARGE');

-- CreateEnum
CREATE TYPE "cucarda_condition" AS ENUM ('NONE', 'ON_SALE', 'OUT_OF_STOCK', 'IN_STOCK', 'NEW');

-- AlterTable
ALTER TABLE "designs" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "animation" "cucarda_animation" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "background_color" TEXT DEFAULT '#e0353b',
ADD COLUMN     "condition" "cucarda_condition" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "hide_native_badges" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "location" "cucarda_location" NOT NULL DEFAULT 'PRODUCT_PAGE',
ADD COLUMN     "position" "cucarda_position" NOT NULL DEFAULT 'TOP_LEFT',
ADD COLUMN     "size" "cucarda_size" NOT NULL DEFAULT 'SMALL',
ADD COLUMN     "text" TEXT,
ADD COLUMN     "text_color" TEXT DEFAULT '#ffffff',
ADD COLUMN     "type" "cucarda_type" NOT NULL DEFAULT 'IMAGE',
ALTER COLUMN "canvas_json" DROP NOT NULL;
