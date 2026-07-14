// Sinh file MP3 phát âm tiếng Hàn (giọng neural Microsoft qua edge-tts) cho:
//   - từ vựng (VocabularyItem.korean)
//   - câu ví dụ (VocabularyItem.exampleKr)
//   - từng dòng hội thoại (Dialogue.lines[].kr)
// và gán URL vào DB. Idempotent: chỉ sinh file còn thiếu; luôn cập nhật URL + manifest.
// Tự dọn (prune) các file MP3 không còn được nội dung nào tham chiếu.
//
// Chạy:  node scripts/sync-audio.mjs            (dùng DATABASE_URL trong .env — DB local)
//        DATABASE_URL=<neon> node scripts/sync-audio.mjs   (đồng bộ DB Neon)
//
// Yêu cầu: python + edge-tts (pip install edge-tts). File lưu ở public/audio/tts/.

import { PrismaClient } from "@prisma/client";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  rmSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const VOICE = "ko-KR-SunHiNeural"; // giọng nữ tự nhiên
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const audioDir = join(root, "public", "audio", "tts");
const manifestPath = join(root, "prisma", "audio-manifest.json");

const prisma = new PrismaClient();

function fileNameFor(text) {
  return createHash("md5").update(text).digest("hex").slice(0, 16) + ".mp3";
}

function urlFor(text) {
  return `/audio/tts/${fileNameFor(text)}`;
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
    select: { id: true, korean: true, exampleKr: true },
  });
  const dialogues = await prisma.dialogue.findMany({
    select: { id: true, lines: true },
  });

  // ---- Thu thập mọi văn bản Hàn cần audio ----
  const texts = new Set();
  const add = (t) => {
    const s = (t ?? "").trim();
    if (s) texts.add(s);
  };
  for (const v of vocab) {
    add(v.korean);
    add(v.exampleKr);
  }
  for (const d of dialogues) {
    for (const line of Array.isArray(d.lines) ? d.lines : []) {
      add(line?.kr);
    }
  }

  // ---- Sinh file còn thiếu + dựng manifest ----
  const manifest = {};
  let generated = 0;
  for (const text of texts) {
    const name = fileNameFor(text);
    const absPath = join(audioDir, name);
    if (!existsSync(absPath)) {
      generate(text, absPath);
      generated++;
      process.stdout.write(`  ♪ ${text} -> ${name}\n`);
    }
    manifest[text] = `/audio/tts/${name}`;
  }
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");

  // ---- Cập nhật DB ----
  let vocabUpdated = 0;
  for (const v of vocab) {
    const korean = v.korean.trim();
    const example = (v.exampleKr ?? "").trim();
    await prisma.vocabularyItem.update({
      where: { id: v.id },
      data: {
        audioUrl: korean ? manifest[korean] ?? null : null,
        exampleAudioUrl: example ? manifest[example] ?? null : null,
      },
    });
    vocabUpdated++;
  }

  let dialogueUpdated = 0;
  for (const d of dialogues) {
    const lines = (Array.isArray(d.lines) ? d.lines : []).map((line) => {
      const kr = (line?.kr ?? "").trim();
      return { ...line, audioUrl: kr ? manifest[kr] ?? null : null };
    });
    await prisma.dialogue.update({ where: { id: d.id }, data: { lines } });
    dialogueUpdated++;
  }

  // ---- Prune: xóa file mp3 không còn được tham chiếu ----
  const referenced = new Set([...texts].map((t) => fileNameFor(t)));
  let pruned = 0;
  for (const file of readdirSync(audioDir)) {
    if (file.endsWith(".mp3") && !referenced.has(file)) {
      rmSync(join(audioDir, file));
      pruned++;
    }
  }

  console.log(
    `Xong: ${texts.size} đoạn văn bản, sinh mới ${generated} file, xóa ${pruned} file thừa. ` +
      `Cập nhật ${vocabUpdated} từ vựng, ${dialogueUpdated} hội thoại.`,
  );
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
