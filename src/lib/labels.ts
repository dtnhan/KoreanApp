// Chuỗi giao diện tiếng Việt tập trung một nơi.

export const labels = {
  siteName: "Hàn Ngữ",
  siteTagline: "Học tiếng Hàn theo giáo trình Tiếng Hàn Tổng Hợp",

  nav: {
    home: "Trang chủ",
    courses: "Khóa học",
    review: "Ôn tập",
    progress: "Tiến độ",
    admin: "Quản trị",
    login: "Đăng nhập",
    register: "Đăng ký",
    logout: "Đăng xuất",
  },

  lesson: {
    vocabulary: "Từ vựng",
    grammar: "Ngữ pháp",
    dialogue: "Hội thoại",
    romanization: "Phiên âm",
    showRomanization: "Hiện phiên âm",
    hideRomanization: "Ẩn phiên âm",
    showTranslation: "Hiện bản dịch",
    hideTranslation: "Ẩn bản dịch",
    markComplete: "Đánh dấu hoàn thành",
    addToDeck: "Thêm từ vựng vào bộ thẻ",
    takeQuiz: "Làm bài kiểm tra",
    comingSoon: "Sắp ra mắt",
    stt: "STT",
    korean: "Tiếng Hàn",
    meaning: "Nghĩa",
    example: "Ví dụ",
    pattern: "Cấu trúc",
    explanation: "Giải thích",
  },

  flashcard: {
    showAnswer: "Hiện đáp án",
    again: "Lại",
    hard: "Khó",
    good: "Tốt",
    easy: "Dễ",
    dueToday: (n: number) => `Hôm nay cần ôn ${n} thẻ`,
    empty: "Không còn thẻ nào đến hạn hôm nay 🎉",
  },

  quiz: {
    progress: (x: number, y: number) => `Câu ${x}/${y}`,
    submit: "Nộp bài",
    result: (x: number, y: number) => `Kết quả ${x}/${y} câu đúng`,
    retry: "Làm lại",
  },

  levels: {
    soCap: "Sơ cấp",
    trungCap: "Trung cấp",
    caoCap: "Cao cấp",
  },

  common: {
    lessonCount: (n: number) => `${n} bài học`,
    startLearning: "Bắt đầu học",
    viewCourses: "Xem khóa học",
    backToCourse: "Quay lại khóa học",
    lesson: "Bài",
    notFound: "Không tìm thấy nội dung",
  },
} as const;
