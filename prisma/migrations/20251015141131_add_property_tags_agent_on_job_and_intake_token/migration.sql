/*
  Warnings:

  - A unique constraint covering the columns `[intakeToken]` on the table `Client` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "agentOnJob" TEXT,
ADD COLUMN     "intakeToken" TEXT;

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE UNIQUE INDEX "Client_intakeToken_key" ON "Client"("intakeToken");
