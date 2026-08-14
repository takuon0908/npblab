-- CreateTable
CREATE TABLE "DraftPick" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "round" INTEGER NOT NULL,
    "isDevelopmental" BOOLEAN NOT NULL DEFAULT false,
    "teamId" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "playerId" TEXT,
    "position" TEXT NOT NULL,
    "previousAffiliation" TEXT,
    "npbDebutMade" BOOLEAN NOT NULL DEFAULT false,
    "careerGames" INTEGER,
    "qualifiedSeasons" INTEGER NOT NULL DEFAULT 0,
    "titles" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,

    CONSTRAINT "DraftPick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DraftPick_year_round_isDevelopmental_teamId_playerName_key" ON "DraftPick"("year", "round", "isDevelopmental", "teamId", "playerName");

-- AddForeignKey
ALTER TABLE "DraftPick" ADD CONSTRAINT "DraftPick_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
