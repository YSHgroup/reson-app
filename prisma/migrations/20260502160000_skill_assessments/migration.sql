ALTER TABLE "SkillAttempt"
ADD COLUMN "category" TEXT NOT NULL DEFAULT '',
ADD COLUMN "questionIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "expiresAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "SkillAttempt"
ALTER COLUMN "category" DROP DEFAULT,
ALTER COLUMN "expiresAt" DROP DEFAULT;

CREATE INDEX "SkillQuestion_category_idx" ON "SkillQuestion"("category");

DROP INDEX IF EXISTS "SkillAttempt_userId_startedAt_idx";
CREATE INDEX "SkillAttempt_userId_category_startedAt_idx"
ON "SkillAttempt"("userId", "category", "startedAt");
