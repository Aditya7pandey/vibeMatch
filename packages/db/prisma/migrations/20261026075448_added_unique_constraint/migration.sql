/*
  Warnings:

  - The `role` column on the `conversation_members` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[conversationId,userId]` on the table `conversation_members` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "conversationRole" AS ENUM ('MEMBER', 'ADMIN');

-- AlterTable
ALTER TABLE "conversation_members" DROP COLUMN "role",
ADD COLUMN     "role" "conversationRole" NOT NULL DEFAULT 'MEMBER';

-- CreateIndex
CREATE UNIQUE INDEX "conversation_members_conversationId_userId_key" ON "conversation_members"("conversationId", "userId");
