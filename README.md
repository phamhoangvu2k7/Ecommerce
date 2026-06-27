# ⚡ Website Bán Hàng & Quản Lý Sản Phẩm (E-Commerce)

Đây là một dự án website bán hàng hoàn chỉnh gồm hai phần:
- **Phần xử lý dữ liệu (Backend)**: Chạy bằng **Nitro v3** (nhanh và nhẹ).
- **Phần giao diện hiển thị (Frontend)**: Chạy bằng **Vue 3** (mượt mà, tốc độ tải trang nhanh như Nuxt).

Dự án đã được thiết lập sẵn cấu hình để chạy chung trên một cổng ở môi trường phát triển, và dễ dàng đóng gói để chạy thực tế chỉ với một câu lệnh.

---

## 🚀 Các tính năng chính

### 🛒 Dành cho Khách mua hàng (Giao diện Cửa hàng)
- **Tự động gộp giỏ hàng**: Khi khách hàng đăng nhập, những sản phẩm họ đã thêm vào giỏ hàng trước đó (lúc chưa đăng nhập) sẽ tự động được gộp chung vào tài khoản cá nhân.
- **Mua hàng an toàn, không lo lệch kho**: Hệ thống tự động kiểm tra số lượng hàng trong kho trước khi xác nhận đơn. Nếu nhiều người cùng mua một sản phẩm tại một thời điểm, hệ thống sẽ xử lý tuần tự để không bị bán quá số lượng thực tế. Nếu quá trình đặt hàng bị lỗi giữa chừng, số lượng hàng sẽ tự động được trả lại kho.
- **Hủy đơn hàng chờ duyệt**: Khách hàng có thể hủy đơn khi chưa được admin xác nhận, số lượng sản phẩm trong đơn hủy sẽ tự động được cộng trả lại vào kho.
- **Quên mật khẩu bằng mã OTP**: Gửi mã OTP xác nhận về email của khách hàng. Mã OTP này chỉ có hiệu lực trong vòng 3 phút rồi tự động tự xóa.
- **Tìm kiếm và bộ lọc tiện lợi**: Tìm kiếm sản phẩm theo tên, lọc sản phẩm theo danh mục và lọc theo giá bán thực tế (giá sau khi đã trừ đi phần trăm giảm giá).

### ⚙️ Dành cho Quản trị viên (Trang Quản lý - Admin)
- **Trang thống kê tổng quan**: Xem nhanh tổng doanh thu thực tế, số lượng đơn hàng đã bán, số lượng khách hàng đăng ký và số lượng sản phẩm đang hiển thị trên web.
- **Quản lý danh mục cha - con**: Tạo và quản lý danh mục sản phẩm theo nhiều cấp. Hệ thống sẽ chặn không cho xóa danh mục cha nếu bên trong vẫn còn danh mục con hoặc sản phẩm đang hoạt động (tránh lỗi hiển thị ngoài trang chủ).
- **Tải ảnh trực tiếp lên đám mây Cloudinary**: Tích hợp sẵn nút upload ảnh khi thêm mới hoặc chỉnh sửa sản phẩm. Bạn chỉ cần chọn file ảnh từ máy tính, ảnh sẽ được tự động tải lên tài khoản Cloudinary của bạn và điền link ảnh vào ô nhập liệu.
- **Thùng rác & Khôi phục dữ liệu**: Sản phẩm hoặc danh mục bị xóa sẽ được đưa vào thùng rác để tránh xóa nhầm. Khi khôi phục một sản phẩm, hệ thống tự động khôi phục cả danh mục cha của sản phẩm đó nếu danh mục cha cũng đang nằm trong thùng rác.

---

## 🛠️ Công nghệ sử dụng

- **Server (Backend)**: Nitro v3, h3
- **Giao diện (Frontend)**: Vue 3, Vite, Pinia (quản lý trạng thái), Vue Router (chuyển trang)
- **Cơ sở dữ liệu**: MongoDB (thông qua thư viện Mongoose)
- **Bảo mật**: JWT (tạo token đăng nhập), Bcrypt (mã hóa mật khẩu người dùng trước khi lưu vào database)
- **Gửi mail**: Nodemailer
- **Lưu trữ ảnh**: Cloudinary

---

## 📁 Cấu trúc thư mục dự án

```text
├── .env                              # Cấu hình kết nối CSDL, Email, Cloudinary
├── index.html                        # File HTML chính của ứng dụng
├── package.json                      # Các thư viện đã cài đặt và lệnh chạy dự án
├── tsconfig.json                     # Cấu hình TypeScript
├── vite.config.ts                    # File cấu hình Vite (gộp chung cả Vue và Nitro)
├── server/                           # Thư mục Backend (API Server)
│   ├── middleware/
│   │   └── auth.ts                   # Kiểm tra đăng nhập và phân quyền (Admin / Khách hàng)
│   ├── plugins/
│   │   └── db.ts                     # Tự động kết nối cơ sở dữ liệu MongoDB khi chạy server
│   ├── utils/
│   │   ├── helpers.ts                # Các hàm phụ trợ (gửi mail, mã hóa mật khẩu, upload ảnh)
│   │   ├── models.ts                 # Cấu trúc bảng dữ liệu (Sản phẩm, Danh mục, Đơn hàng, Giỏ hàng,...)
│   │   ├── services.ts               # Logic xử lý chính (Đặt hàng, đồng bộ giỏ hàng)
│   │   └── validation.ts             # Kiểm tra định dạng dữ liệu đầu vào (tên, email, số điện thoại)
│   └── api/                          # Các đường dẫn API gọi dữ liệu
│       ├── seed.get.ts               # API tạo nhanh dữ liệu mẫu để chạy thử
│       ├── admin/                    # Các API phục vụ cho trang quản lý
│       └── client/                   # Các API phục vụ cho trang bán hàng
├── src/                              # Thư mục Frontend (Giao diện Vue 3)
│   ├── main.ts                       # File khởi tạo ứng dụng Vue
│   ├── router.ts                     # Cài đặt chuyển trang và chặn truy cập nếu chưa đăng nhập
│   ├── style.css                     # File CSS thiết kế giao diện (Dark-mode, hiệu ứng mượt)
│   ├── App.vue                       # File giao diện gốc
│   ├── components/
│   │   └── CategoryNode.vue          # Hiển thị danh mục dạng cây cha - con
│   ├── layouts/
│   │   ├── ClientLayout.vue          # Khung giao diện trang bán hàng
│   │   └── AdminLayout.vue           # Khung giao diện trang quản trị admin
│   ├── stores/
│   │   ├── auth.ts                   # Lưu thông tin đăng nhập tạm thời
│   │   └── cart.ts                   # Lưu thông tin giỏ hàng tạm thời
│   └── pages/                        # Các trang giao diện chi tiết (Home, Cart, Products, Admin,...)
```

---

## 💻 Hướng dẫn Cài đặt & Chạy thử

### 1. Chuẩn bị
- Máy tính đã cài đặt **Node.js** (khuyên dùng bản v20 trở lên).
- Có tài khoản hoặc đã cài đặt **MongoDB** (chạy trên máy hoặc dùng đám mây Atlas).

### 2. Cấu hình file `.env`
Tạo một file tên là `.env` ở thư mục gốc của dự án và điền các thông tin sau:
```env
PORT=3000

# Đường dẫn kết nối CSDL MongoDB
MONGO_URL=đường_dẫn_kết_nối_mongodb_của_bạn
MONGO_NAME=product-management

# Cấu hình gửi mail OTP bằng Gmail
EMAIL_USER=địa_chỉ_gmail_của_bạn@gmail.com
EMAIL_PASSWORD=mật_khẩu_ứng_dụng_gmail_của_bạn

# Cấu hình tài khoản Cloudinary để tải ảnh lên
CLOUD_NAME=tên_cloudinary_của_bạn
CLOUD_KEY=mã_key_cloudinary_của_bạn
CLOUD_SECRET=mã_secret_cloudinary_của_bạn

# Chuỗi ký tự bảo mật (để chạy JWT)
SESSION_SECRET=chuỗi_kí_tự_ngẫu_nhiên_bất_kì
JWT_SECRET=chuỗi_kí_tự_ngẫu_nhiên_bất_kì
```

### 3. Cài đặt và khởi chạy (Chế độ Dev)
Mở terminal tại thư mục dự án và chạy các lệnh sau:

1. Cài đặt các thư viện:
   ```bash
   npm install --legacy-peer-deps
   ```
2. Khởi chạy dự án:
   ```bash
   npm run dev
   ```
Mở trình duyệt truy cập: `http://localhost:5173` để xem giao diện web.

*Lưu ý: Nếu VS Code báo gạch đỏ lỗi ở các hàm như `defineEventHandler`, bạn hãy nhấn phím `Ctrl + Shift + P` -> gõ chọn `TypeScript: Restart TS Server` là sẽ hết.*

### 4. Tạo nhanh dữ liệu mẫu để dùng thử
Truy cập đường dẫn sau trên trình duyệt để hệ thống tự động tạo các tài khoản test và sản phẩm mẫu vào database:
`http://localhost:5173/api/seed`

**Các tài khoản đăng nhập mẫu sau khi tạo:**
- **Tài khoản Admin**: `admin@example.com` / Mật khẩu: `admin123`
- **Tài khoản Biên tập viên (Editor)**: `editor@example.com` / Mật khẩu: `editor123`
- **Tài khoản Khách mua hàng**: `customer@example.com` / Mật khẩu: `customer123`

---

## 📦 Đóng gói chạy thực tế (Production Build)

Khi muốn chạy website ở môi trường thực tế (không phải môi trường lập trình):

1. Chạy lệnh biên dịch và đóng gói:
   ```bash
   npm run build
   ```
Hệ thống sẽ tạo ra một thư mục tên là `.output/` ở ngoài cùng.

2. Khởi chạy máy chủ độc lập:
   ```bash
   node .output/server/index.mjs
   ```
Website sẽ hoạt động trên cổng bạn đã cấu hình trong tệp `.env` (mặc định là `3000`).
