/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `archived` on the `Property` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[intakeToken]` on the table `Client` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('AVAILABLE', 'SOLD', 'PENDING', 'OFF_MARKET');

-- AlterTable
ALTER TABLE "Client" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "agentOnJob" TEXT,
ADD COLUMN     "intakeToken" TEXT,
ADD COLUMN     "movingOutDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Property" DROP COLUMN "archived",
ADD COLUMN     "status" "ListingStatus" NOT NULL DEFAULT 'AVAILABLE',
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE UNIQUE INDEX "Client_intakeToken_key" ON "Client"("intakeToken");
