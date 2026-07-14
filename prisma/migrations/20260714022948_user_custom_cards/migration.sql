-- AlterTable
ALTER TABLE "Flashcard" ADD COLUMN     "customExampleKr" TEXT,
ADD COLUMN     "customExampleVi" TEXT,
ADD COLUMN     "customKorean" TEXT,
ADD COLUMN     "customRomanization" TEXT,
ADD COLUMN     "customVietnamese" TEXT,
ALTER COLUMN "vocabularyItemId" DROP NOT NULL;
