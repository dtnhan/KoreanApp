// Sinh file MP3 phát âm tiếng Hàn (giọng neural Microsoft qua edge-tts) cho từ vựng
// và gán audioUrl vào DB. Idempotent: chỉ sinh file còn thiếu, luôn cập nhật audioUrl.
//
// Chạy:  node scripts/sync-audio.mjs            (dùng DATABASE_URL trong .env — DB local)
//        DATABASE_URL=<neon> node scripts/sync-audio.mjs   (đồng bộ DB Neon)
//
// Yêu cầu: python + edge-tts (pip install edge-tts). File lưu ở public/audio/vocab/.

import { PrismaClient } from "@prisma/client";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const VOICE = "ko-KR-SunHiNeural"; // giọng nữ tự nhiên
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const audioDir = join(root, "public", "audio", "vocab");
const manifestPath = join(root, "prisma", "audio-manifest.json");

const prisma = new PrismaClient();

function fileNameFor(text) {
  return createHash("md5").update(text).digest("hex").slice(0, 16) + ".mp3";
}

function generate(text, absPath) {
  execFileSync(
    "python",
    ["-m", "edge_tts", "--voice", VOICE, "--text", text, "--write-media", absPath],
    { stdio: ["ignore", "ignore", "inherit"] },
  );
}

async function main() {
  mkdirSync(audioDir, { recursive: true });

  const vocab = await prisma.vocabularyItem.findMany({
    select: { id: true, korean: true },
  });
  const uniqueKorean = [...new Set(vocab.map((v) => v.korean.trim()).filter(Boolean))];

  const manifest = existsSync(manifestPath)
    ? JSON.parse(readFileSync(manifestPath, "utf8"))
    : {};

  let generated = 0;
  for (const korean of uniqueKorean) {
    const name = fileNameFor(korean);
    const absPath = join(audioDir, name);
    const url = `/audio/vocab/${name}`;
    if (!existsSync(absPath)) {
      generate(korean, absPath);
      generated++;
      process.stdout.write(`  ♪ ${korean} -> ${name}\n`);
    }
    manifest[korean] = url;
  }
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");

  let updated = 0;
  for (const v of vocab) {
    const url = manifest[v.korean.trim()];
    if (url) {
      await prisma.vocabularyItem.update({
        where: { id: v.id },
        data: { audioUrl: url },
      });
      updated++;
    }
  }

  console.log(
    `Xong: ${uniqueKorean.length} từ, sinh mới ${generated} file, cập nhật audioUrl ${updated} bản ghi.`,
  );
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
