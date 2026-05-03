-- AlterTable
ALTER TABLE "Contribution" ADD COLUMN     "receiptFileName" TEXT,
ADD COLUMN     "receiptFileSize" INTEGER,
ADD COLUMN     "receiptFileType" TEXT,
ADD COLUMN     "receiptKey" TEXT,
ADD COLUMN     "receiptUploadedAt" TIMESTAMP(3),
ADD COLUMN     "rejectionCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "cooperativeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "recipientType" TEXT NOT NULL DEFAULT 'ALL',
    "recipientRole" TEXT,
    "agmDate" TIMESTAMP(3),
    "agmLocation" TEXT,
    "allowRsvp" BOOLEAN NOT NULL DEFAULT false,
    "isPinned" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnouncementRsvp" (
    "id" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rsvpStatus" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnnouncementRsvp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Announcement_cooperativeId_idx" ON "Announcement"("cooperativeId");

-- CreateIndex
CREATE INDEX "Announcement_isActive_isPinned_idx" ON "Announcement"("isActive", "isPinned");

-- CreateIndex
CREATE INDEX "AnnouncementRsvp_announcementId_idx" ON "AnnouncementRsvp"("announcementId");

-- CreateIndex
CREATE UNIQUE INDEX "AnnouncementRsvp_announcementId_userId_key" ON "AnnouncementRsvp"("announcementId", "userId");

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_cooperativeId_fkey" FOREIGN KEY ("cooperativeId") REFERENCES "Cooperative"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementRsvp" ADD CONSTRAINT "AnnouncementRsvp_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "Announcement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementRsvp" ADD CONSTRAINT "AnnouncementRsvp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
