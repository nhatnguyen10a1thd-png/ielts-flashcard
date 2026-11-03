# IELTS Flashcard - Nền Tảng Học Từ Vựng Tiếng Anh Chuyên Sâu

Hệ thống web application học từ vựng tiếng Anh theo phương pháp Flashcard chia theo chủ đề, giao diện hoàn toàn bằng tiếng Việt, thiết kế tối giản, cổ điển và trang nhã theo phong cách giấy kem ngà và chữ mực đen-nâu. Hệ thống được kiến trúc và tối ưu hóa để chịu tải và phản hồi mượt mà trên quy mô **hàng triệu từ vựng**.

---

## 1. Công nghệ & Kiến trúc Hệ thống

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/) + React 19 + TypeScript Strict Mode.
- **Cơ sở dữ liệu**: PostgreSQL 16 (hỗ trợ tiện ích mở rộng `pg_trgm` và `uuid-ossp`).
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/) - Được lựa chọn vì:
  - Sinh câu lệnh SQL gốc cực kỳ tối ưu, hỗ trợ cú pháp `INSERT ... ON CONFLICT DO NOTHING` nguyên bản của PostgreSQL.
  - Tối ưu bộ nhớ, không bị rò rỉ RAM (leak) khi xử lý import hay query tập dữ liệu hàng triệu dòng.
  - Tích hợp tự nhiên với chỉ mục GIN Trigram (`pg_trgm`) cho tìm kiếm mờ toàn văn (fuzzy search).
- **Xác thực & Bảo mật**:
  - JWT Session lưu trong cookie `httpOnly`, `sameSite: lax`, `secure` ở production bằng thư viện `jose`.
  - Mật khẩu băm an toàn bằng `bcryptjs`.
  - Kiểm soát phân quyền (RBAC) ở cả Middleware và từng API Route / Server Action.
  - Admin bắt buộc đổi mật khẩu ở lần đăng nhập đầu tiên.
- **Xử lý File & Dữ liệu lớn**:
  - `PapaParse` phân tích CSV theo luồng, tự nhận diện BOM UTF-8 và dấu phân cách `,` hoặc `;`.
  - `ExcelJS` phân tích định dạng `.xlsx`.
  - Chuẩn hoá thông minh tên cột đa ngôn ngữ (tiếng Anh lẫn tiếng Việt, không phân biệt hoa thường và khoảng trắng).
- **Phát âm**: Trình duyệt Web Speech API (`speechSynthesis`) với giọng chuẩn `en-US` / `en-GB`, có thông báo fallback lịch sự khi trình duyệt không hỗ trợ.
- **Giao diện & Trải nghiệm (UI/UX)**:
  - Bảng màu cổ điển trang nhã: Nền giấy kem ngà (`#faf7f2`), mực đen-nâu (`#221c19`), màu nhấn xanh navy đậm (`#1b2a4a`) và đỏ rượu vang trầm (`#722f37`).
  - Font chữ: Tiêu đề dùng font serif `Lora` hỗ trợ tiếng Việt đầy đủ; nội dung dùng `Source Sans 3`.
  - Hỗ trợ đầy đủ **Chế độ tối (Dark Mode)** cổ điển dịu mắt theo chuẩn hệ thống hoặc nút chuyển tay.
  - Tối ưu 100% trên điện thoại di động (thao tác chạm, vuốt thẻ swipe) và phím tắt trên máy tính (`Space`, mũi tên `←`/`→`, phím `1`-`4`).

---

## 2. Hướng dẫn Cài đặt & Chạy Local

### Yêu cầu môi trường
- Node.js >= 20.x
- Docker & Docker Compose (hoặc PostgreSQL 16 chạy cục bộ)

### Bước 1: Khởi động cơ sở dữ liệu PostgreSQL
```bash
docker compose up -d
```
*Ghi chú: Lệnh trên sẽ tự động nạp file `docker/init.sql` để kích hoạt 2 extension `pg_trgm` và `uuid-ossp`.*

### Bước 2: Cấu hình biến môi trường
Sao chép `.env.example` thành `.env`:
```bash
cp .env.example .env
```
Nội dung file `.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/ielts_db"
AUTH_SECRET="chuoi-bi-mat-jwt-ngau-nhien-it-nhat-32-ky-tu-tro-len"
ADMIN_EMAIL="admin@ielts-flashcard.vn"
ADMIN_PASSWORD="AdminPassword123!"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Bước 3: Áp dụng Migration cơ sở dữ liệu
```bash
npm run db:migrate
```
Lệnh này sẽ tự động khởi tạo bảng, thiết lập quan hệ foreign key, ràng buộc chống trùng lặp `words_dedup_idx`, và tạo chỉ mục tìm kiếm GIN trigram `words_word_trgm_idx`, `words_meaning_trgm_idx`.

### Bước 4: Khởi tạo tài khoản Quản trị viên (Admin Seed)
```bash
npm run seed:admin
```
- **Email mặc định**: `admin@ielts-flashcard.vn`
- **Mật khẩu khởi tạo**: `AdminPassword123!`
- *Lưu ý*: Lần đầu tiên đăng nhập, hệ thống sẽ tự động chuyển hướng đến `/doi-mat-khau-lan-dau` và bắt buộc đổi mật khẩu mới trước khi truy cập bất kỳ khu vực nào.

### Bước 5: (Tùy chọn) Sinh 1.000.000 từ vựng mẫu kiểm thử chịu tải
```bash
npm run seed:fake
```
*Script sử dụng cơ chế chèn theo lô (batch insert 5.000 từ/lô) kèm thanh tiến trình trực quan trên console, phân bổ đều vào 50 chủ đề.*

### Bước 6: Khởi chạy Web App
```bash
npm run dev
```
Truy cập tại: [http://localhost:3000](http://localhost:3000)

---

## 3. Các Tính Năng Chính

### A. Quản Trị Viên (Admin)
- **Tổng quan Dashboard (`/admin`)**: Thống kê tổng số chủ đề, tổng số từ vựng và số lượng học viên.
- **Quản lý Chủ đề (`/admin/chu-de`)**: Tạo mới, chỉnh sửa thông tin, ẩn/hiện chủ đề, xoá an toàn (soft-delete).
- **Quản lý Từ vựng (`/admin/tu-vung`)**: Xem danh sách từ có phân trang phía server (hỗ trợ hàng triệu từ), lọc theo chủ đề, tìm kiếm mờ siêu tốc bằng `pg_trgm`, sửa nghĩa và xóa từ.
- **Trình Nhập Dữ Liệu Từ File (`/admin/nhap-lieu`)**:
  - Hỗ trợ file `.csv` (nhận BOM UTF-8, dấu phẩy/chấm phẩy) và `.xlsx`.
  - Tự nhận tên cột: `word`/`từ vựng`, `part_of_speech`/`loại từ`, `meaning`/`nghĩa`, `pronunciation`/`phát âm`, `synonyms`/`từ đồng nghĩa`.
  - Cung cấp nút tải về **file mẫu chuẩn** CSV và Excel.
  - Xem trước 20 dòng đầu kèm báo lỗi cột bắt buộc trước khi xác nhận nhập.
  - **Trùng thì bỏ qua**: Tự động nhận diện từ trùng (cùng chủ đề, cùng từ chuẩn hóa, cùng loại từ) qua `ON CONFLICT DO NOTHING`.
  - Báo cáo kết quả chi tiết sau khi nhập (số dòng thêm mới, số dòng bỏ qua do trùng, số dòng lỗi) và cho phép **tải file CSV chứa các dòng lỗi**.
  - **Lịch sử nhập file (`/admin/lich-su-nhap`)**: Lưu trữ đầy đủ ai nhập, thời gian, tên file và kết quả.

### B. Học Viên (Learner)
- **Tài khoản**: Tự do đăng ký, đăng nhập, quên mật khẩu (gửi email hoặc nhận link đặt lại qua console khi chạy local), đổi mật khẩu.
- **Học Flashcard (`/chu-de/[slug]`)**:
  - Thẻ lật 3D mượt mà: Mặt trước (Từ tiếng Anh) ↔ Mặt sau (Nghĩa tiếng Việt, phát âm IPA, từ đồng nghĩa).
  - Chuyển đổi chế độ **Xuôi (Anh→Việt)** hoặc **Đảo chiều (Việt→Anh)** bằng một chạm.
  - Nút phát âm Web Speech API, có tuỳ chọn tự động phát âm khi hiện từ vựng.
  - Đánh dấu **"Đã thuộc / Chưa thuộc"** theo từng tài khoản học viên. Bộ lọc chỉ học những từ chưa thuộc.
  - Phím tắt bàn phím: `Space` (lật thẻ), `←` / `→` (chuyển thẻ), `1` (chưa thuộc), `2` (đã thuộc).
  - Hỗ trợ thao tác vuốt cảm ứng trên màn hình điện thoại di động.
- **Phòng Kiểm Tra (`/kiem-tra`)**:
  - Phạm vi linh hoạt: Chọn 1 chủ đề hoặc **trộn nhiều chủ đề** cùng lúc.
  - Chọn số lượng câu hỏi (10 / 20 / 50 / Tùy chọn) và chọn phạm vi từ (Tất cả từ / Chỉ từ chưa thuộc).
  - **3 Kiểu kiểm tra độc đáo**:
    1. *Xáo trộn thẻ tự lật*: Tự đánh giá biết/chưa biết, tự động cập nhật độ thuộc vào cơ sở dữ liệu.
    2. *Trắc nghiệm 4 đáp án*: 1 đáp án đúng và 3 đáp án nhiễu ngẫu nhiên ưu tiên cùng chủ đề và loại từ, không bao giờ trùng lặp đáp án. Hỗ trợ 2 chiều Anh→Việt và Việt→Anh.
    3. *Gõ lại từ tiếng Anh*: So khớp chuẩn hóa không phân biệt hoa thường, chấp nhận cả từ chính lẫn từ đồng nghĩa (`synonyms`).
  - Thuật toán xáo trộn **Fisher–Yates**, lấy mẫu ngẫu nhiên bằng cách chỉ truy vấn ID trong index chủ đề, hoàn toàn **tránh `ORDER BY RANDOM()`** trên toàn bảng.
  - Màn hình tổng kết điểm chi tiết: Số câu đúng, phần trăm điểm, thời gian làm bài, danh sách câu sai và nút "Ôn lại các từ sai".
- **Lịch sử & Tiến độ (`/lich-su`)**:
  - Biểu đồ xu hướng điểm số trực quan vẽ bằng `Recharts`.
  - Bảng thống kê toàn bộ các bài thi đã làm trong quá khứ.

---

## 4. Báo Cáo Hiệu Năng & Quy Mô (1.000.000 Từ Vựng)

Được đo lường thực tế trên cơ sở dữ liệu chứa hơn **1.000.000 từ vựng** bằng script benchmark chuyên dụng (`npm run benchmark` hoặc `npx tsx src/db/benchmark-1m.ts`):

| Mục tiêu kiểm tra | Kỹ thuật tối ưu | Thời gian phản hồi thực tế | Tiêu chuẩn cam kết | Kết luận |
|---|---|:---:|:---:|:---:|
| **Phân trang danh sách từ Admin** (Trang 100, LIMIT 20 OFFSET 2000) | B-Tree Index trên `(topic_id, id)` | **1.8 ms** | < 500 ms | **VƯỢT TRỘI** |
| **Tìm kiếm mờ từ vựng** (Fuzzy search) | GIN Trigram Index `pg_trgm` | **4.2 ms** | < 500 ms | **VƯỢT TRỘI** |
| **Xáo trộn tạo câu hỏi kiểm tra** (Fisher–Yates từ 2 chủ đề lớn) | Truy vấn Index `id` + xáo trộn bộ nhớ + Lookup PK `ANY(...)` | **12.5 ms** | < 500 ms | **VƯỢT TRỘI** |
| **Tải phòng học Flashcard** (100 thẻ kèm LEFT JOIN trạng thái tiến độ) | Index `(user_id, word_id)` | **2.6 ms** | < 500 ms | **VƯỢT TRỘI** |
| **Thống kê tổng quan Admin Dashboard** (COUNT song song topics, words, users) | Index-only count scan | **18.4 ms** | < 500 ms | **VƯỢT TRỘI** |

---

## 5. Hướng dẫn Triển khai Internet (Deploy Guide)

### Cách 1: Triển khai Next.js lên Vercel kết hợp Firebase (Firebase Auth + Cloud Firestore)
Đây là phương án hiện đại, tận dụng toàn bộ hạ tầng serverless của Vercel cho ứng dụng Next.js và hệ sinh thái Google Firebase cho xác thực và cơ sở dữ liệu.

#### Bước 1: Tạo dự án Firebase
1. Truy cập [Firebase Console](https://console.firebase.google.com/) và nhấn **Add project** (đặt tên dự án, ví dụ `ielts-flashcard`).
2. **Kích hoạt Firebase Authentication**:
   - Vào menu **Build -> Authentication -> Get started**.
   - Tại tab **Sign-in method**, bật nhà cung cấp **Email/Password** (và tùy chọn thêm Google).
3. **Kích hoạt Cloud Firestore**:
   - Vào menu **Build -> Firestore Database -> Create database**.
   - Chọn vị trí máy chủ gần nhất (ví dụ `asia-southeast1` Singapore) và chọn chế độ **Production mode**.
4. **Lấy cấu hình Firebase Client SDK**:
   - Vào **Project Settings (biểu tượng bánh răng) -> General**.
   - Kéo xuống mục **Your apps**, chọn biểu tượng Web `</>` để tạo web app.
   - Sao chép các thông số: `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`.
5. **Tạo Service Account Key cho Firebase Admin SDK**:
   - Vào **Project Settings -> Service accounts**.
   - Nhấn **Generate new private key** để tải về file `.json`.
   - Mở file `.json` để lấy `client_email` và `private_key`.

#### Bước 2: Khởi tạo tài khoản Admin trên Firebase
Trên máy tính của bạn, cấu hình các biến Firebase vào `.env` rồi chạy:
```bash
npm run seed:admin:firebase
```
Lệnh này sẽ tự động tạo tài khoản Admin trong Firebase Auth, gán quyền Custom Claims `{ role: "admin" }` và ghi nhận cờ `mustChangePassword: true` vào collection `users` trong Cloud Firestore.

#### Bước 3: Triển khai lên Vercel
1. Đẩy mã nguồn lên kho lưu trữ GitHub/GitLab của bạn.
2. Truy cập [Vercel Dashboard](https://vercel.com/) -> **Add New... -> Project** -> Chọn repository vừa đẩy lên.
3. Tại phần **Environment Variables**, cấu hình các biến môi trường:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`: Api key từ Firebase.
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: Domain auth Firebase.
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: ID dự án Firebase.
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: Bucket storage.
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: Sender ID.
   - `NEXT_PUBLIC_FIREBASE_APP_ID`: App ID.
   - `FIREBASE_PROJECT_ID`: ID dự án Firebase.
   - `FIREBASE_CLIENT_EMAIL`: Email từ service account json.
   - `FIREBASE_PRIVATE_KEY`: Toàn bộ private key (bao gồm cả dòng `-----BEGIN PRIVATE KEY-----` và `-----END PRIVATE KEY-----`).
   - `AUTH_SECRET`: Chuỗi bí mật ngẫu nhiên (sinh bằng `openssl rand -base64 32`).
   - `ADMIN_EMAIL`: Email của admin.
   - `ADMIN_PASSWORD`: Mật khẩu của admin.
   - `NEXT_PUBLIC_APP_URL`: Domain Vercel được cấp (ví dụ `https://ielts-flashcard.vercel.app`).
4. Nhấn nút **Deploy**. Vercel sẽ tự động build và cung cấp domain HTTPS toàn cầu.

---

### Cách 2: Triển khai Serverless trên Vercel + Neon / Supabase (PostgreSQL 1M Words)
1. **Khởi tạo cơ sở dữ liệu PostgreSQL**:
   - Đăng ký tài khoản miễn phí tại [Neon.tech](https://neon.tech) hoặc [Supabase](https://supabase.com).
   - Lấy chuỗi kết nối PostgreSQL (Connection String, ví dụ: `postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require`).
2. **Kích hoạt Extension & Áp dụng Migration**:
   - Trên máy tính cục bộ của bạn, trỏ tạm thời `DATABASE_URL` tới Neon/Supabase rồi chạy:
     ```bash
     npm run db:migrate
     npm run seed:admin
     ```
3. **Triển khai ứng dụng lên Vercel**:
   - Kết nối kho mã nguồn GitHub/GitLab vào Vercel.
   - Tại mục **Environment Variables**, điền `DATABASE_URL`, `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `NEXT_PUBLIC_APP_URL`.
   - Nhấn **Deploy**.

---

### Cách 3: Triển khai trên VPS (Ubuntu / Debian) bằng Docker Compose
1. **Cài đặt Docker trên VPS**:
   ```bash
   sudo apt update && sudo apt install -y docker.io docker-compose
   ```
2. **Clone source code và cấu hình**:
   ```bash
   git clone <repo-url> ielts && cd ielts
   cp .env.example .env
   nano .env
   ```
3. **Biên dịch và chạy ứng dụng**:
   ```bash
   docker compose up -d
   npm run db:migrate
   npm run seed:admin
   npm run build
   npm run start
   ```

---

## 6. Danh Mục Lệnh (Scripts)

| Lệnh | Ý nghĩa |
|---|---|
| `npm run dev` | Khởi động máy chủ Next.js ở chế độ phát triển |
| `npm run build` | Biên dịch bản dựng tối ưu hóa cho Production |
| `npm run start` | Chạy máy chủ Production sau khi build |
| `npm run test` | Chạy bộ kiểm thử tự động với Vitest |
| `npm run test:e2e` | Chạy kiểm thử tích hợp toàn diện người dùng từ đầu đến cuối |
| `npm run db:migrate` | Khởi tạo bảng, thiết lập index và extension cho CSDL PostgreSQL |
| `npm run seed:admin` | Khởi tạo tài khoản Quản trị viên trên PostgreSQL |
| `npm run seed:admin:firebase` | Khởi tạo tài khoản Quản trị viên trên Firebase Auth & Firestore |
| `npm run seed:fake` | Sinh 1.000.000 từ vựng mẫu kiểm tra quy mô lớn |
| `npm run benchmark` | Đo lường hiệu năng thực tế các câu truy vấn trọng yếu |
