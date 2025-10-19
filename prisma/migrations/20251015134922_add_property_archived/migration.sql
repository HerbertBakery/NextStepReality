/*
  Warnings:

  - You are about to drop the column `agentOnJob` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `intakeToken` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `movingOutDate` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `postalCode` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `province` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `Property` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Client_intakeToken_key";

-- AlterTable
ALTER TABLE "Client" DROP COLUMN "agentOnJob",
DROP COLUMN "intakeToken",
DROP COLUMN "movingOutDate";

-- AlterTable
ALTER TABLE "Property" DROP COLUMN "postalCode",
DROP COLUMN "province",
DROP COLUMN "status",
DROP COLUMN "tags",
ADD COLUMN     "archived" BOOLEAN NOT NULL DEFAULT false;

-- DropEnum
DROP TYPE "ListingStatus";
