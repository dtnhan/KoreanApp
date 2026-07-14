import { PrismaClient, QuestionType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const prisma = new PrismaClient();

async function main() {
  // ---------- Admin user ----------
  // Production: đặt SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD trong env để không dùng mật khẩu mặc định.
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin123";
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash, role: "ADMIN", name: "Quản trị viên" },
    create: {
      email: adminEmail,
      name: "Quản trị viên",
      passwordHash,
      role: "ADMIN",
    },
  });

  // ---------- Reset nội dung khóa học (giữ nguyên user) ----------
  await prisma.course.deleteMany();

  // ---------- 6 khóa học ----------
  const courses = [
    { slug: "so-cap-1", title: "Sơ cấp 1", order: 1, description: "Bảng chữ Hangeul, chào hỏi, giới thiệu bản thân và các mẫu câu cơ bản nhất." },
    { slug: "so-cap-2", title: "Sơ cấp 2", order: 2, description: "Mở rộng từ vựng đời sống, thì quá khứ/tương lai và giao tiếp hằng ngày." },
    { slug: "trung-cap-1", title: "Trung cấp 1", order: 3, description: "Ngữ pháp trung cấp, diễn đạt ý kiến và hội thoại trong nhiều tình huống." },
    { slug: "trung-cap-2", title: "Trung cấp 2", order: 4, description: "Cấu trúc câu phức, từ vựng chuyên đề và kỹ năng đọc hiểu nâng cao." },
    { slug: "cao-cap-1", title: "Cao cấp 1", order: 5, description: "Văn phong trang trọng, thành ngữ và chủ đề xã hội, học thuật." },
    { slug: "cao-cap-2", title: "Cao cấp 2", order: 6, description: "Tiếng Hàn cao cấp toàn diện, luyện thi TOPIK II và giao tiếp chuyên sâu." },
  ];

  const courseBySlug: Record<string, string> = {};
  for (const c of courses) {
    const created = await prisma.course.create({ data: c });
    courseBySlug[c.slug] = created.id;
  }

  const soCap1 = courseBySlug["so-cap-1"];

  // ================= BÀI 1: Chào hỏi (인사) =================
  await prisma.lesson.create({
    data: {
      courseId: soCap1,
      slug: "bai-1",
      title: "Chào hỏi (인사)",
      order: 1,
      vocabulary: {
        create: [
          { order: 1, korean: "안녕하세요", romanization: "annyeonghaseyo", vietnamese: "Xin chào", exampleKr: "안녕하세요, 만나서 반갑습니다.", exampleVi: "Xin chào, rất vui được gặp bạn." },
          { order: 2, korean: "감사합니다", romanization: "gamsahamnida", vietnamese: "Cảm ơn", exampleKr: "도와주셔서 감사합니다.", exampleVi: "Cảm ơn vì đã giúp đỡ." },
          { order: 3, korean: "죄송합니다", romanization: "joesonghamnida", vietnamese: "Xin lỗi", exampleKr: "늦어서 죄송합니다.", exampleVi: "Xin lỗi vì đã đến muộn." },
          { order: 4, korean: "저", romanization: "jeo", vietnamese: "Tôi (khiêm nhường)", exampleKr: "저는 학생이에요.", exampleVi: "Tôi là học sinh." },
          { order: 5, korean: "이름", romanization: "ireum", vietnamese: "Tên", exampleKr: "이름이 뭐예요?", exampleVi: "Tên bạn là gì?" },
          { order: 6, korean: "네", romanization: "ne", vietnamese: "Vâng, dạ", exampleKr: "네, 맞아요.", exampleVi: "Vâng, đúng rồi." },
          { order: 7, korean: "아니요", romanization: "aniyo", vietnamese: "Không", exampleKr: "아니요, 괜찮아요.", exampleVi: "Không, không sao đâu." },
          { order: 8, korean: "만나서 반갑습니다", romanization: "mannaseo bangapseumnida", vietnamese: "Rất vui được gặp bạn", exampleKr: "만나서 반갑습니다.", exampleVi: "Rất vui được gặp bạn." },
          { order: 9, korean: "안녕히 가세요", romanization: "annyeonghi gaseyo", vietnamese: "Tạm biệt (nói với người đi)", exampleKr: "안녕히 가세요.", exampleVi: "Tạm biệt (chào người ra về)." },
          { order: 10, korean: "안녕히 계세요", romanization: "annyeonghi gyeseyo", vietnamese: "Tạm biệt (nói với người ở lại)", exampleKr: "안녕히 계세요.", exampleVi: "Tạm biệt (chào người ở lại)." },
        ],
      },
      grammar: {
        create: [
          {
            order: 1,
            pattern: "N + 이에요/예요",
            explanation: "Dùng để nói \"là ~\" ở thể lịch sự. Danh từ kết thúc bằng phụ âm (có batchim) dùng 이에요; danh từ kết thúc bằng nguyên âm (không batchim) dùng 예요.",
            examples: [
              { kr: "저는 학생이에요.", vi: "Tôi là học sinh." },
              { kr: "이거는 책이에요.", vi: "Cái này là quyển sách." },
              { kr: "저는 의사예요.", vi: "Tôi là bác sĩ." },
            ],
          },
          {
            order: 2,
            pattern: "N + 은/는 (trợ từ chủ đề)",
            explanation: "Đánh dấu chủ đề của câu. Danh từ có batchim dùng 은; danh từ không batchim dùng 는.",
            examples: [
              { kr: "저는 베트남 사람이에요.", vi: "Tôi là người Việt Nam." },
              { kr: "이름은 민수예요.", vi: "Tên (thì) là Minsu." },
            ],
          },
        ],
      },
      dialogues: {
        create: [
          {
            order: 1,
            title: "자기소개 (Giới thiệu bản thân)",
            lines: [
              { speaker: "민수", kr: "안녕하세요! 저는 민수예요.", vi: "Xin chào! Tôi là Minsu." },
              { speaker: "흐엉", kr: "안녕하세요! 저는 흐엉이에요.", vi: "Xin chào! Tôi là Hương." },
              { speaker: "민수", kr: "만나서 반갑습니다.", vi: "Rất vui được gặp bạn." },
              { speaker: "흐엉", kr: "네, 만나서 반갑습니다.", vi: "Vâng, rất vui được gặp bạn." },
            ],
          },
        ],
      },
      quizQuestions: {
        create: [
          { order: 1, type: QuestionType.MCQ_KR_VN, prompt: "'감사합니다' có nghĩa là gì?", options: ["Xin chào", "Cảm ơn", "Xin lỗi", "Tạm biệt"], answer: "Cảm ơn" },
          { order: 2, type: QuestionType.MCQ_VN_KR, prompt: "'Xin chào' trong tiếng Hàn là gì?", options: ["감사합니다", "죄송합니다", "안녕하세요", "아니요"], answer: "안녕하세요" },
          { order: 3, type: QuestionType.FILL_BLANK, prompt: "Điền trợ từ chủ đề: 저(__) 학생이에요.", options: [], answer: "는", explanation: "저 kết thúc bằng nguyên âm nên dùng 는." },
          { order: 4, type: QuestionType.MCQ_KR_VN, prompt: "'안녕히 가세요' được dùng khi nào?", options: ["Chào người đang ở lại khi mình rời đi", "Chào người rời đi khi mình ở lại", "Khi cảm ơn ai đó", "Khi xin lỗi ai đó"], answer: "Chào người rời đi khi mình ở lại" },
          { order: 5, type: QuestionType.FILL_BLANK, prompt: "Điền 이에요/예요: 이름이 민수(__).", options: [], answer: "예요", explanation: "민수 kết thúc bằng nguyên âm nên dùng 예요." },
        ],
      },
    },
  });

  // ================= BÀI 2: Trường học (학교) =================
  await prisma.lesson.create({
    data: {
      courseId: soCap1,
      slug: "bai-2",
      title: "Trường học (학교)",
      order: 2,
      vocabulary: {
        create: [
          { order: 1, korean: "학교", romanization: "hakgyo", vietnamese: "Trường học", exampleKr: "저는 학교에 가요.", exampleVi: "Tôi đi đến trường." },
          { order: 2, korean: "학생", romanization: "haksaeng", vietnamese: "Học sinh", exampleKr: "저는 학생이에요.", exampleVi: "Tôi là học sinh." },
          { order: 3, korean: "선생님", romanization: "seonsaengnim", vietnamese: "Giáo viên", exampleKr: "선생님, 안녕하세요.", exampleVi: "Em chào thầy/cô ạ." },
          { order: 4, korean: "교실", romanization: "gyosil", vietnamese: "Phòng học", exampleKr: "교실이 커요.", exampleVi: "Phòng học rộng." },
          { order: 5, korean: "책", romanization: "chaek", vietnamese: "Sách", exampleKr: "이 책은 재미있어요.", exampleVi: "Quyển sách này thú vị." },
          { order: 6, korean: "공부하다", romanization: "gongbuhada", vietnamese: "Học (bài)", exampleKr: "저는 한국어를 공부해요.", exampleVi: "Tôi học tiếng Hàn." },
          { order: 7, korean: "친구", romanization: "chingu", vietnamese: "Bạn bè", exampleKr: "친구를 만나요.", exampleVi: "(Tôi) gặp bạn." },
          { order: 8, korean: "대학교", romanization: "daehakgyo", vietnamese: "Trường đại học", exampleKr: "대학교에 다녀요.", exampleVi: "(Tôi) đang học đại học." },
        ],
      },
      grammar: {
        create: [
          {
            order: 1,
            pattern: "N + 이/가 (trợ từ chủ ngữ)",
            explanation: "Đánh dấu chủ ngữ của câu. Danh từ có batchim dùng 이; danh từ không batchim dùng 가.",
            examples: [
              { kr: "학생이 많아요.", vi: "Có nhiều học sinh." },
              { kr: "친구가 와요.", vi: "Bạn (tôi) đến." },
            ],
          },
          {
            order: 2,
            pattern: "이/그/저 (này / đó / kia)",
            explanation: "Từ chỉ định: 이 = này (gần người nói), 그 = đó (gần người nghe hoặc đã được nhắc tới), 저 = kia (xa cả hai người).",
            examples: [
              { kr: "이 책은 제 거예요.", vi: "Quyển sách này là của tôi." },
              { kr: "그 사람은 선생님이에요.", vi: "Người đó là giáo viên." },
              { kr: "저 건물은 학교예요.", vi: "Tòa nhà kia là trường học." },
            ],
          },
        ],
      },
      dialogues: {
        create: [
          {
            order: 1,
            title: "학교에서 (Ở trường)",
            lines: [
              { speaker: "민수", kr: "흐엉 씨, 이 사람은 누구예요?", vi: "Hương ơi, người này là ai vậy?" },
              { speaker: "흐엉", kr: "이 사람은 제 친구예요.", vi: "Người này là bạn của mình." },
              { speaker: "민수", kr: "학생이에요?", vi: "Là học sinh à?" },
              { speaker: "흐엉", kr: "네, 대학교 학생이에요.", vi: "Vâng, là sinh viên đại học." },
            ],
          },
        ],
      },
      quizQuestions: {
        create: [
          { order: 1, type: QuestionType.MCQ_KR_VN, prompt: "'선생님' có nghĩa là gì?", options: ["Học sinh", "Giáo viên", "Bạn bè", "Trường học"], answer: "Giáo viên" },
          { order: 2, type: QuestionType.MCQ_VN_KR, prompt: "'Sách' trong tiếng Hàn là gì?", options: ["책", "교실", "친구", "학교"], answer: "책" },
          { order: 3, type: QuestionType.FILL_BLANK, prompt: "Điền trợ từ chủ ngữ: 친구(__) 와요.", options: [], answer: "가", explanation: "친구 kết thúc bằng nguyên âm nên dùng 가." },
          { order: 4, type: QuestionType.MCQ_KR_VN, prompt: "'이 책' có nghĩa là gì?", options: ["Quyển sách này", "Quyển sách đó", "Quyển sách kia", "Nhiều sách"], answer: "Quyển sách này" },
        ],
      },
    },
  });

  // ================= BÀI 3: Số đếm (숫자) =================
  await prisma.lesson.create({
    data: {
      courseId: soCap1,
      slug: "bai-3",
      title: "Số đếm (숫자)",
      order: 3,
      vocabulary: {
        create: [
          { order: 1, korean: "일", romanization: "il", vietnamese: "Một (số Hán-Hàn)", exampleKr: "일 층에 있어요.", exampleVi: "Ở tầng 1." },
          { order: 2, korean: "이", romanization: "i", vietnamese: "Hai (số Hán-Hàn)", exampleKr: "이 번 버스를 타요.", exampleVi: "Đi xe buýt số 2." },
          { order: 3, korean: "삼", romanization: "sam", vietnamese: "Ba (số Hán-Hàn)", exampleKr: "삼 월이에요.", exampleVi: "Là tháng 3." },
          { order: 4, korean: "사", romanization: "sa", vietnamese: "Bốn (số Hán-Hàn)", exampleKr: "사 층에 살아요.", exampleVi: "(Tôi) sống ở tầng 4." },
          { order: 5, korean: "오", romanization: "o", vietnamese: "Năm (số Hán-Hàn)", exampleKr: "오 분 남았어요.", exampleVi: "Còn lại 5 phút." },
          { order: 6, korean: "하나", romanization: "hana", vietnamese: "Một (số thuần Hàn)", exampleKr: "사과 하나 주세요.", exampleVi: "Cho tôi một quả táo." },
          { order: 7, korean: "둘", romanization: "dul", vietnamese: "Hai (số thuần Hàn)", exampleKr: "둘 다 좋아요.", exampleVi: "Cả hai đều tốt." },
          { order: 8, korean: "셋", romanization: "set", vietnamese: "Ba (số thuần Hàn)", exampleKr: "하나, 둘, 셋!", exampleVi: "Một, hai, ba!" },
          { order: 9, korean: "몇", romanization: "myeot", vietnamese: "Mấy, bao nhiêu", exampleKr: "몇 살이에요?", exampleVi: "Bạn bao nhiêu tuổi?" },
        ],
      },
      grammar: {
        create: [
          {
            order: 1,
            pattern: "Số Hán-Hàn và số thuần Hàn",
            explanation: "Tiếng Hàn có hai hệ số đếm. Số Hán-Hàn (일, 이, 삼...) dùng cho ngày tháng, phút, tiền, số điện thoại, địa chỉ. Số thuần Hàn (하나, 둘, 셋...) dùng để đếm số lượng đồ vật, người và nói tuổi.",
            examples: [
              { kr: "삼 월 오 일이에요.", vi: "Là ngày 5 tháng 3. (dùng số Hán-Hàn)" },
              { kr: "사과 세 개 주세요.", vi: "Cho tôi ba quả táo. (dùng số thuần Hàn)" },
            ],
          },
          {
            order: 2,
            pattern: "Đơn vị đếm 개 / 명",
            explanation: "개 đếm đồ vật, 명 đếm người và đứng sau số thuần Hàn. Lưu ý: 하나 → 한, 둘 → 두, 셋 → 세 khi đứng trước đơn vị đếm.",
            examples: [
              { kr: "사과 한 개 주세요.", vi: "Cho tôi một quả táo." },
              { kr: "학생 두 명이 있어요.", vi: "Có hai học sinh." },
            ],
          },
        ],
      },
      dialogues: {
        create: [
          {
            order: 1,
            title: "나이 (Tuổi tác)",
            lines: [
              { speaker: "민수", kr: "흐엉 씨, 몇 살이에요?", vi: "Hương ơi, bạn bao nhiêu tuổi?" },
              { speaker: "흐엉", kr: "저는 스무 살이에요.", vi: "Mình hai mươi tuổi." },
              { speaker: "민수", kr: "가족이 몇 명이에요?", vi: "Gia đình bạn có mấy người?" },
              { speaker: "흐엉", kr: "네 명이에요.", vi: "Có bốn người." },
            ],
          },
        ],
      },
      quizQuestions: {
        create: [
          { order: 1, type: QuestionType.MCQ_KR_VN, prompt: "Số '삼' là số mấy?", options: ["Một", "Hai", "Ba", "Bốn"], answer: "Ba" },
          { order: 2, type: QuestionType.MCQ_VN_KR, prompt: "Số 'Năm' (Hán-Hàn) trong tiếng Hàn là gì?", options: ["오", "사", "셋", "일"], answer: "오" },
          { order: 3, type: QuestionType.FILL_BLANK, prompt: "Đếm đồ vật (một): 사과 (__) 개 주세요.", options: [], answer: "한", explanation: "하나 đổi thành 한 khi đứng trước đơn vị đếm 개." },
          { order: 4, type: QuestionType.MCQ_KR_VN, prompt: "'몇 명이에요?' hỏi về điều gì?", options: ["Bao nhiêu tuổi", "Mấy giờ", "Mấy người", "Bao nhiêu tiền"], answer: "Mấy người" },
        ],
      },
    },
  });

  // ---------- Gắn audio phát âm (nếu đã sinh file, xem scripts/sync-audio.mjs) ----------
  const manifestPath = join(process.cwd(), "prisma", "audio-manifest.json");
  if (existsSync(manifestPath)) {
    const manifest: Record<string, string> = JSON.parse(readFileSync(manifestPath, "utf8"));
    const urlFor = (t?: string | null) => {
      const s = (t ?? "").trim();
      return s ? manifest[s] ?? null : null;
    };

    const items = await prisma.vocabularyItem.findMany({
      select: { id: true, korean: true, exampleKr: true },
    });
    let audioCount = 0;
    for (const v of items) {
      await prisma.vocabularyItem.update({
        where: { id: v.id },
        data: {
          audioUrl: urlFor(v.korean),
          exampleAudioUrl: urlFor(v.exampleKr),
        },
      });
      audioCount++;
    }

    const dialogues = await prisma.dialogue.findMany({ select: { id: true, lines: true } });
    for (const d of dialogues) {
      const lines = (Array.isArray(d.lines) ? d.lines : []).map((line) => {
        const l = line as { kr?: string } & Record<string, unknown>;
        return { ...l, audioUrl: urlFor(l.kr) };
      });
      await prisma.dialogue.update({ where: { id: d.id }, data: { lines } });
    }

    console.log(`Đã gắn audio cho ${audioCount} từ vựng và ${dialogues.length} hội thoại.`);
  }

  const courseCount = await prisma.course.count();
  const lessonCount = await prisma.lesson.count();
  console.log(`Seed hoàn tất: ${courseCount} khóa học, ${lessonCount} bài học.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
