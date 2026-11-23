CREATE TABLE "UserArtifact" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "entry" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserArtifact_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "googleResourceName" TEXT,
    "email" TEXT,
    "displayName" TEXT,
    "photoUrl" TEXT,
    "birthday" TEXT,
    "phoneNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "UserArtifact_userId_kind_createdAt_idx"
    ON "UserArtifact"("userId", "kind", "createdAt");
CREATE UNIQUE INDEX "Contact_userId_googleResourceName_key"
    ON "Contact"("userId", "googleResourceName");
CREATE INDEX "Contact_userId_email_idx" ON "Contact"("userId", "email");

ALTER TABLE "UserArtifact"
    ADD CONSTRAINT "UserArtifact_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Contact"
    ADD CONSTRAINT "Contact_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

DROP TABLE IF EXISTS "LegacyImport";
DROP TABLE IF EXISTS "LegacyDocument";
