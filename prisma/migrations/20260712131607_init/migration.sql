-- CreateEnum
CREATE TYPE "League" AS ENUM ('CENTRAL', 'PACIFIC');

-- CreateEnum
CREATE TYPE "Level" AS ENUM ('ICHIGUN', 'NIGUN');

-- CreateEnum
CREATE TYPE "TitleCategory" AS ENUM ('BATTING_AVERAGE', 'HOME_RUNS', 'RBI', 'STOLEN_BASES', 'WINS', 'ERA', 'STRIKEOUTS', 'SAVES', 'HOLDS');

-- CreateEnum
CREATE TYPE "ProspectCategory" AS ENUM ('BATTING', 'PITCHING');

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "league" "League" NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "homeTeamId" TEXT NOT NULL,
    "awayTeamId" TEXT NOT NULL,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "isFinished" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StandingsSnapshot" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "wins" INTEGER NOT NULL,
    "losses" INTEGER NOT NULL,
    "draws" INTEGER NOT NULL,
    "winPct" DOUBLE PRECISION NOT NULL,
    "gamesBehind" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "StandingsSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerBattingStat" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "level" "Level" NOT NULL,
    "season" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "games" INTEGER NOT NULL,
    "plateAppearances" INTEGER NOT NULL,
    "atBats" INTEGER NOT NULL,
    "runs" INTEGER NOT NULL,
    "hits" INTEGER NOT NULL,
    "doubles" INTEGER NOT NULL,
    "triples" INTEGER NOT NULL,
    "homeRuns" INTEGER NOT NULL,
    "totalBases" INTEGER NOT NULL,
    "rbi" INTEGER NOT NULL,
    "stolenBases" INTEGER NOT NULL,
    "caughtStealing" INTEGER NOT NULL,
    "walks" INTEGER NOT NULL,
    "hitByPitch" INTEGER NOT NULL,
    "strikeouts" INTEGER NOT NULL,
    "avg" DOUBLE PRECISION NOT NULL,
    "slg" DOUBLE PRECISION NOT NULL,
    "obp" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PlayerBattingStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerPitchingStat" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "level" "Level" NOT NULL,
    "season" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "appearances" INTEGER NOT NULL,
    "wins" INTEGER NOT NULL,
    "losses" INTEGER NOT NULL,
    "saves" INTEGER NOT NULL,
    "holds" INTEGER NOT NULL,
    "inningsPitched" DOUBLE PRECISION NOT NULL,
    "hits" INTEGER NOT NULL,
    "homeRuns" INTEGER NOT NULL,
    "walks" INTEGER NOT NULL,
    "hitByPitch" INTEGER NOT NULL,
    "strikeouts" INTEGER NOT NULL,
    "runs" INTEGER NOT NULL,
    "earnedRuns" INTEGER NOT NULL,
    "era" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PlayerPitchingStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChampionshipProbability" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "probability" DOUBLE PRECISION NOT NULL,
    "projectedWins" DOUBLE PRECISION NOT NULL,
    "projectedLosses" DOUBLE PRECISION NOT NULL,
    "simulationRuns" INTEGER NOT NULL,

    CONSTRAINT "ChampionshipProbability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TitleLeaderSnapshot" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "category" "TitleCategory" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "rank" INTEGER NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "TitleLeaderSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamInsight" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "pythagoreanWinPct" DOUBLE PRECISION NOT NULL,
    "actualWinPct" DOUBLE PRECISION NOT NULL,
    "eloRating" DOUBLE PRECISION NOT NULL,
    "last10Wins" INTEGER NOT NULL,
    "last10Losses" INTEGER NOT NULL,
    "last10Draws" INTEGER NOT NULL,
    "offenseRank" INTEGER NOT NULL,
    "defenseRank" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "runsScored" INTEGER NOT NULL DEFAULT 0,
    "runsAllowed" INTEGER NOT NULL DEFAULT 0,
    "gamesPlayed" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TeamInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TitleRaceProbability" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "category" "TitleCategory" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "probability" DOUBLE PRECISION NOT NULL,
    "currentValue" DOUBLE PRECISION NOT NULL,
    "projectedValue" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "TitleRaceProbability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProspectRating" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "category" "ProspectCategory" NOT NULL,
    "nigunValue" DOUBLE PRECISION NOT NULL,
    "translatedValue" DOUBLE PRECISION NOT NULL,
    "sampleSize" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,

    CONSTRAINT "ProspectRating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Team_slug_key" ON "Team"("slug");

-- CreateIndex
CREATE INDEX "Game_date_idx" ON "Game"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Game_date_homeTeamId_awayTeamId_key" ON "Game"("date", "homeTeamId", "awayTeamId");

-- CreateIndex
CREATE UNIQUE INDEX "StandingsSnapshot_teamId_date_key" ON "StandingsSnapshot"("teamId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerBattingStat_playerId_level_date_key" ON "PlayerBattingStat"("playerId", "level", "date");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerPitchingStat_playerId_level_date_key" ON "PlayerPitchingStat"("playerId", "level", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ChampionshipProbability_teamId_date_key" ON "ChampionshipProbability"("teamId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "TitleLeaderSnapshot_playerId_category_date_key" ON "TitleLeaderSnapshot"("playerId", "category", "date");

-- CreateIndex
CREATE UNIQUE INDEX "TeamInsight_teamId_date_key" ON "TeamInsight"("teamId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "TitleRaceProbability_playerId_category_date_key" ON "TitleRaceProbability"("playerId", "category", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ProspectRating_playerId_category_date_key" ON "ProspectRating"("playerId", "category", "date");

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandingsSnapshot" ADD CONSTRAINT "StandingsSnapshot_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerBattingStat" ADD CONSTRAINT "PlayerBattingStat_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerPitchingStat" ADD CONSTRAINT "PlayerPitchingStat_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChampionshipProbability" ADD CONSTRAINT "ChampionshipProbability_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TitleLeaderSnapshot" ADD CONSTRAINT "TitleLeaderSnapshot_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamInsight" ADD CONSTRAINT "TeamInsight_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TitleRaceProbability" ADD CONSTRAINT "TitleRaceProbability_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProspectRating" ADD CONSTRAINT "ProspectRating_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
