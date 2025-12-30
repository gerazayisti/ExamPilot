-- CreateTable
CREATE TABLE "PlanningSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Schedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "examId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "timeSlotId" TEXT NOT NULL,
    "sessionId" TEXT,
    CONSTRAINT "Schedule_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Schedule_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Schedule_timeSlotId_fkey" FOREIGN KEY ("timeSlotId") REFERENCES "TimeSlot" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Schedule_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "PlanningSession" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Schedule" ("examId", "id", "roomId", "timeSlotId") SELECT "examId", "id", "roomId", "timeSlotId" FROM "Schedule";
DROP TABLE "Schedule";
ALTER TABLE "new_Schedule" RENAME TO "Schedule";
CREATE INDEX "Schedule_examId_idx" ON "Schedule"("examId");
CREATE INDEX "Schedule_roomId_idx" ON "Schedule"("roomId");
CREATE INDEX "Schedule_timeSlotId_idx" ON "Schedule"("timeSlotId");
CREATE INDEX "Schedule_sessionId_idx" ON "Schedule"("sessionId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
