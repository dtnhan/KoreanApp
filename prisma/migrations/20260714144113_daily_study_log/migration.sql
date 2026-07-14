-- CreateTable
CREATE TABLE "DailyStudyLog" (
    "userId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DailyStudyLog_pkey" PRIMARY KEY ("userId","day")
);

-- AddForeignKey
ALTER TABLE "DailyStudyLog" ADD CONSTRAINT "DailyStudyLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
