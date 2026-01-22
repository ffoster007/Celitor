-- CreateTable
CREATE TABLE "Album" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "repoOwner" TEXT NOT NULL,
    "repoName" TEXT NOT NULL,
    "note" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Album_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlbumGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "note" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "albumId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlbumGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlbumItem" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "note" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "albumId" TEXT NOT NULL,
    "groupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlbumItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Album_repoOwner_repoName_idx" ON "Album"("repoOwner", "repoName");

-- CreateIndex
CREATE UNIQUE INDEX "Album_userId_repoOwner_repoName_name_key" ON "Album"("userId", "repoOwner", "repoName", "name");

-- CreateIndex
CREATE INDEX "AlbumGroup_albumId_idx" ON "AlbumGroup"("albumId");

-- CreateIndex
CREATE INDEX "AlbumItem_albumId_idx" ON "AlbumItem"("albumId");

-- CreateIndex
CREATE INDEX "AlbumItem_groupId_idx" ON "AlbumItem"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "AlbumItem_albumId_path_key" ON "AlbumItem"("albumId", "path");

-- AddForeignKey
ALTER TABLE "Album" ADD CONSTRAINT "Album_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumGroup" ADD CONSTRAINT "AlbumGroup_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumItem" ADD CONSTRAINT "AlbumItem_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "Album"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlbumItem" ADD CONSTRAINT "AlbumItem_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "AlbumGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
