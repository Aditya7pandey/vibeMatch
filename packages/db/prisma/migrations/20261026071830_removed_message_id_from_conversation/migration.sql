/*
  Warnings:

  - You are about to drop the column `messageId` on the `conversation_members` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "conversation_members" DROP CONSTRAINT "conversation_members_messageId_fkey";

-- AlterTable
ALTER TABLE "conversation_members" DROP COLUMN "messageId";
