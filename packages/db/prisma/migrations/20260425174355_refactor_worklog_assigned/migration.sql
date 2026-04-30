/*
  Warnings:

  - You are about to drop the column `jira_account_id` on the `developers` table. All the data in the column will be lost.
  - You are about to drop the column `jira_account_id` on the `worklogs` table. All the data in the column will be lost.
  - You are about to drop the column `jira_issue_id` on the `worklogs` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[ticket_key]` on the table `worklogs` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `assigned` to the `worklogs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ticket_key` to the `worklogs` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "developers_jira_account_id_key";

-- DropIndex
DROP INDEX "worklogs_jira_account_id_date_idx";

-- DropIndex
DROP INDEX "worklogs_jira_issue_id_key";

-- AlterTable
ALTER TABLE "developers" DROP COLUMN "jira_account_id";

-- AlterTable
ALTER TABLE "worklogs" DROP COLUMN "jira_account_id",
DROP COLUMN "jira_issue_id",
ADD COLUMN     "assigned" TEXT NOT NULL,
ADD COLUMN     "ticket_key" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "worklogs_ticket_key_key" ON "worklogs"("ticket_key");

-- CreateIndex
CREATE INDEX "worklogs_assigned_date_idx" ON "worklogs"("assigned", "date");
