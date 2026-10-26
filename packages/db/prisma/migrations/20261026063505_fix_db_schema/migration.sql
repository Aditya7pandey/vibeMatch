/*
  Warnings:

  - You are about to drop the column `senderId` on the `conversation` table. All the data in the column will be lost.
  - Added the required column `created_by` to the `conversation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `conversation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `joined_at` to the `conversation_members` table without a default value. This is not possible if the table is not empty.
  - Added the required column `messageId` to the `conversation_members` table without a default value. This is not possible if the table is not empty.
  - Added the required column `role` to the `conversation_members` table without a default value. This is not possible if the table is not empty.
  - Added the required column `senderId` to the `messages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `user` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "GroupRole" AS ENUM ('DIRECT', 'GROUP');

-- AlterTable
ALTER TABLE "conversation" DROP COLUMN "senderId",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "created_by" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "type" "GroupRole" NOT NULL DEFAULT 'DIRECT';

-- AlterTable
ALTER TABLE "conversation_members" ADD COLUMN     "joined_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "messageId" TEXT NOT NULL,
ADD COLUMN     "role" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "senderId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "name" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "conversation_members" ADD CONSTRAINT "conversation_members_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
