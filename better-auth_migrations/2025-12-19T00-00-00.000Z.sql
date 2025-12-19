-- Add reviewer metadata for submission status changes

ALTER TABLE "sell_submission" ADD COLUMN "statusUpdatedByUserId" TEXT;
ALTER TABLE "sell_submission" ADD COLUMN "statusUpdatedAt" TEXT;

ALTER TABLE "lessor_submission" ADD COLUMN "statusUpdatedByUserId" TEXT;
ALTER TABLE "lessor_submission" ADD COLUMN "statusUpdatedAt" TEXT;
