-- AlterTable
ALTER TABLE "user_auth" ADD COLUMN     "emailVerificationToken" TEXT,
ADD COLUMN     "emailVerificationTokenExpiry" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "user_auth_emailVerificationToken_idx" ON "user_auth"("emailVerificationToken");
