# Hàn Ngữ — Website học tiếng Hàn

Website học tiếng Hàn giao diện tiếng Việt theo giáo trình **Tiếng Hàn Tổng Hợp**:

- 6 khóa học (Sơ cấp 1 → Cao cấp 2), mỗi bài gồm **Từ vựng · Ngữ pháp · Hội thoại**
- Đăng ký / đăng nhập (email + mật khẩu, tùy chọn Google OAuth)
- Theo dõi tiến độ học từng khóa
- **Flashcard SRS** (thuật toán SM-2, múi giờ Việt Nam) để ôn từ vựng
- **Bài kiểm tra** trắc nghiệm + điền khuyết, chấm điểm phía server, lưu lịch sử
- **Trang quản trị** (role ADMIN): CRUD khóa học, bài học, từ vựng, ngữ pháp, hội thoại, câu hỏi

Công nghệ: Next.js 16 (App Router, Server Actions) · React 19 · TypeScript · Tailwind CSS 4 · Prisma 6 · PostgreSQL · Auth.js (NextAuth v5) · Zod · Vitest.

## Yêu cầu

- Node.js 24+ và npm 11+
- PostgreSQL (đã tạo sẵn một database trống, ví dụ `hanngu`)

## Cài đặt

```bash
npm install
```

> **Lưu ý npm 11**: npm chặn install scripts mặc định. Nếu Prisma báo thiếu engine, chạy:
> `npm approve-scripts @prisma/client @prisma/engines prisma esbuild sharp unrs-resolver`

Tạo file cấu hình môi trường từ mẫu:

```bash
cp .env.example .env
```

Sửa `.env`:

- `DATABASE_URL` — chuỗi kết nối PostgreSQL của bạn
- `DIRECT_URL` — ở local để **giống hệt** `DATABASE_URL` (chỉ khác khi deploy lên Neon)
- `AUTH_SECRET` — sinh chuỗi ngẫu nhiên: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — để trống nếu chưa dùng Google OAuth

Khởi tạo database + dữ liệu mẫu:

```bash
npx prisma migrate dev
npx prisma db seed
```

Chạy dev server:

```bash
npm run dev
```

Mở http://localhost:3000

## Tài khoản mặc định (seed)

| Vai trò | Email               | Mật khẩu   |
| ------- | ------------------- | ---------- |
| ADMIN   | `admin@example.com` | `admin123` |

Đăng nhập bằng tài khoản trên để vào **Quản trị** (`/admin`).

## Lệnh hữu ích

```bash
npm run dev      # chạy development
npm run build    # build production
npm test         # unit test (thuật toán SRS)
npm run lint     # eslint
npx prisma studio  # xem/sửa dữ liệu trực quan
```

## Cấu trúc thư mục

```
prisma/
  schema.prisma        # toàn bộ data model
  seed.ts              # dữ liệu mẫu (6 khóa, 3 bài Sơ cấp 1, admin)
src/
  app/
    (public)/          # trang chủ, khóa học, bài học, kiểm tra
    (auth)/            # đăng nhập, đăng ký
    (user)/            # ôn tập (flashcard), tiến độ — cần đăng nhập
    admin/             # quản trị nội dung — cần role ADMIN
    api/auth/          # NextAuth route handler
  actions/             # server actions (auth, progress, flashcards, quiz, admin/*)
  components/          # Navbar, LessonTabs, FlashcardReviewer, QuizRunner, admin/*
  lib/
    prisma.ts          # Prisma client singleton
    auth.ts            # cấu hình NextAuth v5
    srs.ts             # thuật toán SM-2 (có unit test)
    labels.ts          # chuỗi UI tiếng Việt tập trung
    validation/        # zod schemas
```

## Bật đăng nhập Google (tùy chọn)

1. Vào [console.cloud.google.com](https://console.cloud.google.com) → tạo project → **APIs & Services → Credentials**.
2. **Create Credentials → OAuth client ID** (loại *Web application*).
3. Thêm **Authorized redirect URI**: `http://localhost:3000/api/auth/callback/google`
4. (Khi deploy) thêm cả redirect URI production: `https://<domain>/api/auth/callback/google`
5. Điền `AUTH_GOOGLE_ID` và `AUTH_GOOGLE_SECRET` trong `.env` rồi khởi động lại server.

Nút "Đăng nhập bằng Google" tự động xuất hiện khi hai biến trên được cấu hình.

## Deploy lên web thật (Vercel + Neon)

Postgres trên máy không truy cập được từ internet nên bản deploy dùng một Postgres đám mây (Neon). Toàn bộ build tự chạy `prisma migrate deploy` + `prisma generate` (đã cấu hình trong `package.json`).

### 1. Tạo database Neon

- Đăng ký [neon.tech](https://neon.tech) → tạo project (chọn region gần, ví dụ Singapore).
- Trong phần **Connection string**, lấy 2 chuỗi:
  - **Pooled** (host chứa `-pooler`) → dùng cho `DATABASE_URL`
  - **Direct connection** (không có `-pooler`) → dùng cho `DIRECT_URL`
  - Cả hai giữ nguyên `?sslmode=require` ở cuối.

### 2. Đẩy schema + dữ liệu mẫu lên Neon (chạy 1 lần từ máy)

Tạm sửa `.env` cho `DATABASE_URL`/`DIRECT_URL` trỏ tới Neon, rồi:

```bash
npx prisma migrate deploy
SEED_ADMIN_PASSWORD="mật-khẩu-admin-mạnh" npx prisma db seed
```

> ⚠️ **Chỉ seed MỘT LẦN.** `seed.ts` xóa & tạo lại toàn bộ khóa học (cascade xóa cả tiến độ/flashcard/quiz của người học). Đừng chạy lại seed sau khi đã có người dùng thật.

Xong thì trả `.env` local về Postgres trên máy.

### 3. OAuth Google cho production

Làm theo mục **Bật đăng nhập Google** ở trên, nhớ thêm redirect URI `https://<domain>.vercel.app/api/auth/callback/google`.

### 4. Đưa code lên GitHub

```bash
git remote add origin https://github.com/<user>/<repo>.git
git branch -M main
git push -u origin main
```

(`.env` đã nằm trong `.gitignore` — không lo lộ khóa.)

### 5. Deploy trên Vercel

- [vercel.com](https://vercel.com) → **New Project** → import repo → Vercel tự nhận Next.js.
- Thêm **Environment Variables** (Production):

  | Biến                 | Giá trị                                             |
  | -------------------- | --------------------------------------------------- |
  | `DATABASE_URL`       | chuỗi **pooled** của Neon                           |
  | `DIRECT_URL`         | chuỗi **direct** của Neon                           |
  | `AUTH_SECRET`        | sinh mới bằng lệnh ở trên                           |
  | `AUTH_URL`           | `https://<domain>.vercel.app`                       |
  | `AUTH_GOOGLE_ID`     | Client ID Google                                    |
  | `AUTH_GOOGLE_SECRET` | Client secret Google                                |

- **Deploy**. Build tự tạo bảng (migrate deploy) và sinh Prisma client.
- Sau khi có domain thật: bổ sung redirect URI production trong Google Console nếu chưa; cập nhật `AUTH_URL` nếu dùng custom domain.
