-- CreateTable
CREATE TABLE "aquarium_notes" (
    "id" TEXT NOT NULL,
    "aquarium_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aquarium_notes_pkey" PRIMARY KEY ("id")
);

-- Migrate legacy single-note field into history entries
INSERT INTO "aquarium_notes" ("id", "aquarium_id", "content", "created_at")
SELECT
    gen_random_uuid()::text,
    "id",
    "notes",
    COALESCE("updated_at", "created_at")
FROM "aquariums"
WHERE "notes" IS NOT NULL AND TRIM("notes") <> '';

-- AddForeignKey
ALTER TABLE "aquarium_notes" ADD CONSTRAINT "aquarium_notes_aquarium_id_fkey" FOREIGN KEY ("aquarium_id") REFERENCES "aquariums"("id") ON DELETE CASCADE ON UPDATE CASCADE;
