/*
  Warnings:

  - A unique constraint covering the columns `[userId,name]` on the table `payment_methods` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `payment_methods` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "payment_methods_name_key";

-- AlterTable
ALTER TABLE "payment_methods" ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSystem" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "payment_methods_userId_idx" ON "payment_methods"("userId");

-- CreateIndex
CREATE INDEX "payment_methods_userId_isDefault_idx" ON "payment_methods"("userId", "isDefault");

-- CreateIndex
CREATE INDEX "payment_methods_userId_isSystem_idx" ON "payment_methods"("userId", "isSystem");

-- CreateIndex
CREATE UNIQUE INDEX "payment_methods_userId_name_key" ON "payment_methods"("userId", "name");

-- AddForeignKey
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
