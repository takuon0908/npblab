-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "awayErrors" INTEGER,
ADD COLUMN     "awayHits" INTEGER,
ADD COLUMN     "awayInnings" INTEGER[],
ADD COLUMN     "homeErrors" INTEGER,
ADD COLUMN     "homeHits" INTEGER,
ADD COLUMN     "homeInnings" INTEGER[];
