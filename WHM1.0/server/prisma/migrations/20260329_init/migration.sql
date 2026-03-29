-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phone" TEXT,
    "passwordHash" TEXT,
    "nickname" TEXT,
    "avatarUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" REAL NOT NULL,
    "updatedAt" REAL NOT NULL
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "profession" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "mainBranchId" TEXT,
    "updatedAt" REAL NOT NULL,
    CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "branchNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "profession" TEXT NOT NULL,
    "workplace" TEXT NOT NULL,
    "world" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "bio" TEXT NOT NULL,
    "coverUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "sourceYear" TEXT,
    "sourceDesc" TEXT,
    "timestamp" REAL NOT NULL,
    "createdAt" REAL NOT NULL,
    "updatedAt" REAL NOT NULL,
    CONSTRAINT "Branch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "senderType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentType" TEXT NOT NULL DEFAULT 'text',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" REAL NOT NULL,
    CONSTRAINT "Message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Moment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "imageUrl" TEXT,
    "timestamp" REAL NOT NULL,
    "createdAt" REAL NOT NULL,
    "updatedAt" REAL NOT NULL,
    CONSTRAINT "Moment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Moment_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MomentComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "momentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "branchId" TEXT,
    "userName" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "timestamp" REAL NOT NULL,
    CONSTRAINT "MomentComment_momentId_fkey" FOREIGN KEY ("momentId") REFERENCES "Moment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MomentComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MomentLike" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "momentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "timestamp" REAL NOT NULL,
    CONSTRAINT "MomentLike_momentId_fkey" FOREIGN KEY ("momentId") REFERENCES "Moment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MomentLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FileRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "timestamp" REAL NOT NULL,
    CONSTRAINT "FileRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AiJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "resultJson" TEXT,
    "errorMsg" TEXT,
    "createdAt" REAL NOT NULL,
    "completedAt" REAL,
    CONSTRAINT "AiJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE INDEX "Branch_userId_idx" ON "Branch"("userId");

-- CreateIndex
CREATE INDEX "Branch_timestamp_idx" ON "Branch"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_userId_branchNumber_key" ON "Branch"("userId", "branchNumber");

-- CreateIndex
CREATE INDEX "Message_branchId_timestamp_idx" ON "Message"("branchId", "timestamp");

-- CreateIndex
CREATE INDEX "Moment_branchId_timestamp_idx" ON "Moment"("branchId", "timestamp");

-- CreateIndex
CREATE INDEX "MomentComment_momentId_timestamp_idx" ON "MomentComment"("momentId", "timestamp");

-- CreateIndex
CREATE INDEX "MomentLike_momentId_timestamp_idx" ON "MomentLike"("momentId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "MomentLike_momentId_userName_key" ON "MomentLike"("momentId", "userName");

-- CreateIndex
CREATE INDEX "FileRecord_userId_timestamp_idx" ON "FileRecord"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "AiJob_userId_createdAt_idx" ON "AiJob"("userId", "createdAt");

