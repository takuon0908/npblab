-- CreateTable
CREATE TABLE "PlayerValueRating" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "category" "ProspectCategory" NOT NULL,
    "season" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "rawStat" DOUBLE PRECISION NOT NULL,
    "sampleSize" INTEGER NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "rank" INTEGER NOT NULL,

    CONSTRAINT "PlayerValueRating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlayerValueRating_playerId_category_date_key" ON "PlayerValueRating"("playerId", "category", "date");

-- AddForeignKey
ALTER TABLE "PlayerValueRating" ADD CONSTRAINT "PlayerValueRating_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
