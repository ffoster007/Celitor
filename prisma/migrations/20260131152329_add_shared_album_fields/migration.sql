-- AlterTable
ALTER TABLE "Album" ADD COLUMN     "isShared" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastSyncedAt" TIMESTAMP(3),
ADD COLUMN     "sourceAlbumId" TEXT,
ADD COLUMN     "sourceRepoName" TEXT,
ADD COLUMN     "sourceRepoOwner" TEXT;

-- CreateIndex
CREATE INDEX "Album_sourceRepoOwner_sourceRepoName_idx" ON "Album"("sourceRepoOwner", "sourceRepoName");
