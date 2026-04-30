-- AlterTable
ALTER TABLE "worklogs" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "worklogs_date_idx" ON "worklogs"("date");
