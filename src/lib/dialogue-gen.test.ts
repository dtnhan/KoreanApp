import { describe, it, expect } from "vitest";
import {
  hasBatchim,
  topicParticle,
  subjectParticle,
  objectParticle,
  copula,
  isNounCandidate,
  buildDialogue,
  type DialogueVocab,
} from "./dialogue-gen";

function seededRng(seed = 42): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

describe("hasBatchim", () => {
  it("nhận diện đúng batchim", () => {
    expect(hasBatchim("책")).toBe(true);
    expect(hasBatchim("물")).toBe(true);
    expect(hasBatchim("학생")).toBe(true);
    expect(hasBatchim("저")).toBe(false);
    expect(hasBatchim("사과")).toBe(false);
    expect(hasBatchim("학교")).toBe(false);
  });

  it("ký tự cuối không phải Hangul → false", () => {
    expect(hasBatchim("abc")).toBe(false);
    expect(hasBatchim("책1")).toBe(false);
    expect(hasBatchim("")).toBe(false);
  });
});

describe("bộ chọn trợ từ theo batchim", () => {
  it("có batchim → 은/이/을/이에요", () => {
    expect(topicParticle("책")).toBe("은");
    expect(subjectParticle("책")).toBe("이");
    expect(objectParticle("물")).toBe("을");
    expect(copula("학생")).toBe("이에요");
  });

  it("không batchim → 는/가/를/예요", () => {
    expect(topicParticle("학교")).toBe("는");
    expect(subjectParticle("사과")).toBe("가");
    expect(objectParticle("사과")).toBe("를");
    expect(copula("학교")).toBe("예요");
  });
});

describe("isNounCandidate", () => {
  it("loại động từ kết thúc 다 và cụm có dấu cách", () => {
    expect(isNounCandidate("공부하다")).toBe(false);
    expect(isNounCandidate("만나서 반갑습니다")).toBe(false);
  });

  it("loại từ chứa '/', không phải Hangul, quá dài", () => {
    expect(isNounCandidate("은/는")).toBe(false);
    expect(isNounCandidate("abc")).toBe(false);
    expect(isNounCandidate("가나다라마바")).toBe(false); // 6 âm tiết
  });

  it("nhận danh từ hợp lệ", () => {
    expect(isNounCandidate("책")).toBe(true);
    expect(isNounCandidate("학교")).toBe(true);
    expect(isNounCandidate("선생님")).toBe(true);
  });
});

describe("buildDialogue", () => {
  const BOOK: DialogueVocab = { korean: "책", vietnamese: "Quyển sách" };
  const SCHOOL: DialogueVocab = { korean: "학교", vietnamese: "Trường học" };

  function forceTemplate(noun: DialogueVocab, allow: string) {
    // Chặn mọi title trừ khuôn muốn test
    const all = ["Hỏi đồ vật", "Hỏi có không", "Hỏi thích"];
    const existingTitles = all
      .filter((t) => t !== allow)
      .map((t) => `${t}: ${noun.korean}`);
    existingTitles.push("Chào hỏi cơ bản");
    return buildDialogue(
      { vocab: [noun], reviewVocab: [], existingTitles },
      seededRng(),
    );
  }

  it("mọi dòng có speaker/kr/vi, ≥2 dòng", () => {
    const d = buildDialogue(
      { vocab: [BOOK, SCHOOL], existingTitles: [] },
      seededRng(),
    );
    expect(d).not.toBeNull();
    expect(d!.lines.length).toBeGreaterThanOrEqual(2);
    for (const line of d!.lines) {
      expect(line.speaker.length).toBeGreaterThan(0);
      expect(line.kr.length).toBeGreaterThan(0);
      expect(line.vi.length).toBeGreaterThan(0);
    }
  });

  it("copula đúng theo batchim (책이에요 / 학교예요)", () => {
    const d1 = forceTemplate(BOOK, "Hỏi đồ vật");
    expect(d1!.title).toBe("Hỏi đồ vật: 책");
    expect(d1!.lines[1].kr).toBe("책이에요.");
    expect(d1!.lines[1].vi).toBe("Là quyển sách.");

    const d2 = forceTemplate(SCHOOL, "Hỏi đồ vật");
    expect(d2!.lines[1].kr).toBe("학교예요.");
  });

  it("trợ từ chủ ngữ đúng theo batchim (책이 / 학교가)", () => {
    const d1 = forceTemplate(BOOK, "Hỏi có không");
    expect(d1!.lines[0].kr).toBe("책이 있어요?");
    expect(d1!.lines[1].kr).toMatch(/^(네, 있어요\.|아니요, 없어요\.)$/);

    const d2 = forceTemplate(SCHOOL, "Hỏi có không");
    expect(d2!.lines[0].kr).toBe("학교가 있어요?");
  });

  it("trợ từ tân ngữ đúng theo batchim (책을 / 학교를)", () => {
    const d1 = forceTemplate(BOOK, "Hỏi thích");
    expect(d1!.lines[0].kr).toBe("책을 좋아해요?");
    expect(d1!.lines[1].kr).toBe("네, 책을 좋아해요.");

    const d2 = forceTemplate(SCHOOL, "Hỏi thích");
    expect(d2!.lines[0].kr).toBe("학교를 좋아해요?");
  });

  it("dedupe theo existingTitles → chọn khuôn/từ khác", () => {
    const first = buildDialogue({ vocab: [BOOK], existingTitles: [] }, seededRng());
    const second = buildDialogue(
      { vocab: [BOOK], existingTitles: [first!.title] },
      seededRng(),
    );
    expect(second).not.toBeNull();
    expect(second!.title).not.toBe(first!.title);
  });

  it("không có danh từ → dùng khuôn Chào hỏi cơ bản; hết sạch → null", () => {
    const noNouns: DialogueVocab[] = [
      { korean: "공부하다", vietnamese: "Học" },
      { korean: "만나서 반갑습니다", vietnamese: "Rất vui được gặp" },
    ];
    const d = buildDialogue({ vocab: noNouns, existingTitles: [] }, seededRng());
    expect(d).not.toBeNull();
    expect(d!.title).toBe("Chào hỏi cơ bản");

    const none = buildDialogue(
      { vocab: noNouns, existingTitles: ["Chào hỏi cơ bản"] },
      seededRng(),
    );
    expect(none).toBeNull();
  });

  it("hết khuôn cho mọi danh từ → null", () => {
    const all = ["Hỏi đồ vật", "Hỏi có không", "Hỏi thích"];
    const existingTitles = [
      ...all.map((t) => `${t}: 책`),
      "Chào hỏi cơ bản",
    ];
    expect(
      buildDialogue({ vocab: [BOOK], existingTitles }, seededRng()),
    ).toBeNull();
  });

  it("thiếu danh từ ở bài hiện tại → lấy từ reviewVocab", () => {
    const d = buildDialogue(
      {
        vocab: [{ korean: "공부하다", vietnamese: "Học" }],
        reviewVocab: [BOOK],
        existingTitles: ["Chào hỏi cơ bản"],
      },
      seededRng(),
    );
    expect(d).not.toBeNull();
    expect(d!.title).toContain("책");
  });
});
