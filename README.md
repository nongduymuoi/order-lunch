# Đặt Cơm

Web đặt cơm trưa cho team: xem menu trong ngày, chọn món, theo dõi số dư và công nợ.
Next.js 16 (App Router) · Drizzle ORM · Postgres (Neon khi chạy thật, PGlite khi chạy local).

## Tính năng

- Đăng ký bằng username, tên, mật khẩu. Mọi tài khoản mới có role `user`.
- **Hôm nay**: menu ăn và uống, số phần còn lại, đếm ngược giờ chốt, danh sách ai đặt gì.
- Nước giảm 20% khi trong đơn có ít nhất một món ăn (giá gốc bị gạch khi xem chi tiết).
- **Lịch sử** đơn, **Báo cáo** chi tiêu: tiền nạp được trừ dần vào các đơn cũ nhất trước;
  thiếu tiền thì số dư âm và đơn hiện "Chưa thanh toán".
- **Nạp tiền**: user gửi yêu cầu, chỉ `owner` mới duyệt và cộng tiền.
- `admin` / `owner`: quản lý thực đơn và giá, mở menu ngày, đặt giờ chốt, đặt số lượng bán,
  đánh dấu hết món bất cứ lúc nào, khóa và chốt đơn.

## Chạy local

```bash
npm install
npm run db:migrate   # tạo bảng trong ./.pglite
npm run db:seed      # (tuỳ chọn) thêm vài món mẫu
npm run dev
```

Đăng ký một tài khoản, sau đó cấp quyền:

```bash
npm run set-role -- <username> owner   # hoặc admin / user
```

PGlite chỉ cho một tiến trình mở database, nên **tắt `npm run dev` trước khi chạy các lệnh `db:*` hoặc `set-role`**.

## Deploy lên Vercel + Neon (miễn phí)

1. Tạo project tại [neon.tech](https://neon.tech), copy chuỗi kết nối **pooled**.
2. Tạo file `.env.local` với `DATABASE_URL` vừa copy, rồi chạy `npm run db:migrate` để tạo bảng trên Neon.
3. Đẩy code lên GitHub, import vào [vercel.com](https://vercel.com).
4. Trong Vercel → Settings → Environment Variables, thêm:
   - `DATABASE_URL`: chuỗi kết nối Neon
   - `SESSION_SECRET`: chuỗi ngẫu nhiên (`openssl rand -base64 32`)
5. Deploy, đăng ký tài khoản của bạn trên web, rồi cấp quyền owner bằng một trong hai cách:
   - Neon SQL Editor: `update users set role = 'owner' where username = 'ten_cua_ban';`
   - Local (với `.env.local` trỏ tới Neon): `npm run set-role -- ten_cua_ban owner`

## Đổi schema

Sửa `src/db/schema.ts`, chạy `npm run db:generate` để tạo file migration mới trong `drizzle/`, rồi `npm run db:migrate`.
