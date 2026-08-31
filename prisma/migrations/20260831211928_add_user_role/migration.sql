-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'EDITOR');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'EDITOR';

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");
