/**
 * Khu vực dành cho người dùng đã đăng nhập.
 * Việc chặn truy cập thực hiện ở từng trang qua requireUser("/duong-dan")
 * để chuyển hướng /dang-nhap kèm callbackUrl chính xác.
 * (Mọi trang thêm vào nhóm này BẮT BUỘC phải gọi requireUser/requireAdmin.)
 */
export default function UserLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
