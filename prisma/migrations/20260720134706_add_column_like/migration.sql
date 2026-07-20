-- CreateTable
CREATE TABLE "ColumnLike" (
    "slug" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ColumnLike_pkey" PRIMARY KEY ("slug")
);
