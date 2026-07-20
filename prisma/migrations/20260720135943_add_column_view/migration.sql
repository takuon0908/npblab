-- CreateTable
CREATE TABLE "ColumnView" (
    "slug" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ColumnView_pkey" PRIMARY KEY ("slug")
);
