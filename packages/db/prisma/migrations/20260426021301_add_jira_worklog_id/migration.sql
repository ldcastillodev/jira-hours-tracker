/*
  Warnings:

  - A unique constraint covering the columns `[jira_worklog_id]` on the table `worklogs` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `jira_worklog_id` to the `worklogs` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "worklogs_ticket_key_key";

-- AlterTable
ALTER TABLE "worklogs" ADD COLUMN     "jira_worklog_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "worklogs_jira_worklog_id_key" ON "worklogs"("jira_worklog_id");

-- CreateIndex
CREATE INDEX "worklogs_ticket_key_idx" ON "worklogs"("ticket_key");
