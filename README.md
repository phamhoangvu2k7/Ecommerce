# ⚡ Hệ thống Quản lý Cửa hàng & Sản phẩm E-Commerce

Hệ thống E-Commerce hoàn chỉnh tích hợp giữa **Backend API Server (Nitro v3)** và **Frontend Storefront/Admin Portal (Vue 3 SPA)**. Ứng dụng được xây dựng theo mô hình kiến trúc Nuxt gọn nhẹ, hiệu năng cao và có thể triển khai đóng gói (self-contained) ở môi trường production chỉ với một câu lệnh.

---

## 🚀 Tính năng nổi bật

### 🛒 Dành cho Khách hàng (Client Storefront)
- **Đồng bộ giỏ hàng thông minh (Cart Merging)**: Tự động gộp giỏ hàng vãng lai (guest cart lưu ở cookie) vào giỏ hàng thành viên của người dùng ngay khi đăng nhập.
- **Thanh toán an toàn chống Race Condition**: Sử dụng MongoDB Transactions (hoặc cơ chế Fallback nguyên tử) để kiểm tra tồn kho và trừ số lượng sản phẩm chính xác, tự động rollback (hoàn kho) nếu xảy ra lỗi.
- **Hủy đơn & Hoàn kho**: Hỗ trợ hủy các đơn hàng đang chờ duyệt và tự động cộng trả số lượng sản phẩm lại kho.
- **Khôi phục mật khẩu qua Email OTP**: Sinh OTP ngẫu nhiên gửi tới Email, tự động hết hạn sau 3 phút nhờ cơ chế TTL Index trong MongoDB.
- **Lọc & Tìm kiếm**: Tìm kiếm an toàn chống SQL/Regex Injection, bộ lọc khoảng giá hoạt động chính xác dựa trên giá bán thực tế sau khi đã tính phần trăm khuyến mãi.

### ⚙️ Dành cho Quản trị viên (Admin Portal)
- **Dashboard phân tích tổng hợp**: Thống kê doanh thu thực tế, số lượng đơn hàng, số khách đăng ký, tỷ lệ sản phẩm đang hoạt động trực quan bằng MongoDB Aggregation.
- **Quản lý danh mục dạng Cây (Category Tree)**: Hiển thị phân cấp danh mục đệ quy không giới hạn, hỗ trợ kéo thả thứ tự sắp xếp và cơ chế chống xóa (cascade protection) khi danh mục vẫn chứa sản phẩm hoạt động.
- **Tải ảnh trực tiếp lên Cloudinary**: Tích hợp sẵn nút upload ảnh trong form CRUD sản phẩm. Ảnh tải lên từ máy tính được lưu trữ trực tiếp trên đám mây Cloudinary và trả về URL tự động điền vào form.
- **Thùng rác tập trung & Khôi phục thông minh**: Khôi phục sản phẩm sẽ tự động khôi phục cả danh mục cha liên quan nếu danh mục đó cũng bị xóa.

---

## 🛠️ Công nghệ sử dụng

- **Backend Core**: [Nitro v3](https://nitro.build/), [h3](https://h3.dev/)
- **Frontend Core**: [Vue 3](https://vuejs.org/) (Composition API), [Vite 8](https://vite.dev/), [Vue Router](https://router.vuejs.org/), [Pinia](https://pinia.vuejs.org/)
- **Database & ODM**: [MongoDB](https://www.mongodb.com/) & [Mongoose](https://mongoosejs.com/)
- **Xác thực & Mã hóa**: JWT (JSON Web Token), Bcrypt
- **Xác thực Dữ liệu (Validation)**: Zod Schema Validation
- **Dịch vụ đám mây & Tiện ích**: Cloudinary SDK (Upload hình ảnh), Nodemailer (Gửi mail OTP)

---

## 📁 Cấu trúc Thư mục Dự án

```text
├── .env                              # Cấu hình môi trường CSDL & Secrets
├── index.html                        # Điểm neo gắn kết (mount) ứng dụng Vue 3
├── package.json                      # Danh sách dependencies & kịch bản chạy
├── tsconfig.json                     # Cấu hình TypeScript & Path Alias (~/*)
├── vite.config.ts                    # Tích hợp Vue plugin & Nitro plugin trong Vite
├── server/                           # Backend (Nitro v3 API & Services)
│   ├── middleware/
│   │   └── auth.ts                   # Global middleware xác thực JWT & kiểm tra quyền (RBAC)
│   ├── plugins/
│   │   └── db.ts                     # Plugin khởi tạo Mongoose và cấu hình DNS dự phòng
│   ├── utils/
│   │   ├── helpers.ts                # Mã hóa, Mailer, Cloudinary, Slugify
│   │   ├── models.ts                 # Định nghĩa các Mongoose Schemas & Soft Delete plugin
│   │   ├── services.ts               # Core Logic (Checkout, Cart Merge, Category constraints)
│   │   └── validation.ts             # Zod validation schemas đầu vào
│   └── api/                          # Định tuyến API
│       ├── seed.get.ts               # Route seed dữ liệu mẫu
│       ├── admin/                    # Nhóm API quản trị (Dashboard, Products, Categories, Trash, Upload)
│       └── client/                   # Nhóm API khách hàng (Products, Cart, Checkout, Profile, Orders)
├── src/                              # Frontend (Vue 3 Client)
│   ├── main.ts                       # Entrypoint ứng dụng Vue 3
│   ├── router.ts                     # Cấu hình Route khách hàng & Quản trị kèm Route Guards
│   ├── style.css                     # Thiết kế Premium Dark-mode, HSL, Glassmorphism, Animations
│   ├── App.vue                       # Root Component của ứng dụng
│   ├── components/
│   │   └── CategoryNode.vue          # Component đệ quy hiển thị danh mục dạng cây
│   ├── layouts/
│   │   ├── ClientLayout.vue          # Layout storefront bán hàng
│   │   └── AdminLayout.vue           # Layout dashboard quản lý của admin
│   ├── stores/
│   │   ├── auth.ts                   # Store quản lý trạng thái tài khoản
│   │   └── cart.ts                   # Store quản lý giỏ hàng và đồng bộ API
│   └── pages/                        # Toàn bộ view trang Client & Admin
```

---

## 💻 Hướng dẫn Cài đặt & Chạy ứng dụng

### 1. Yêu cầu Hệ thống
- Đã cài đặt **Node.js** (Khuyên dùng bản LTS từ `v20.x` trở lên).
- Đã cài đặt hoặc có liên kết tới cơ sở dữ liệu **MongoDB** (Local hoặc Atlas).

### 2. Cấu hình Biến môi trường
Tạo tệp `.env` tại thư mục gốc của dự án với các nội dung sau:
```env
PORT=3000

# Cấu hình kết nối MongoDB
MONGO_URL=your_mongodb_connection_string
MONGO_NAME=product-management

# Cấu hình gửi mail OTP (Gmail)
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASSWORD=your_gmail_app_password

# Cấu hình tải ảnh lên Cloudinary
CLOUD_NAME=your_cloudinary_cloud_name
CLOUD_KEY=your_cloudinary_api_key
CLOUD_SECRET=your_cloudinary_api_secret

# Secrets
SESSION_SECRET=a_very_secret_session_key_123456
JWT_SECRET=a_very_secret_jwt_key_123456
```

### 3. Khởi chạy Chế độ Phát triển (Development)
Chạy lệnh cài đặt các thư viện liên quan:
```bash
npm install --legacy-peer-deps
```

Chạy dev server:
```bash
npm run dev
```
Mở trình duyệt truy cập: `http://localhost:5173`. 
*Mẹo: Nếu VS Code của bạn hiển thị gạch đỏ ở các hàm auto-import, hãy bấm `Ctrl + Shift + P` -> Chọn `TypeScript: Restart TS Server` để tải lại định nghĩa types.*

### 4. Nạp Dữ liệu mẫu (Seed Data)
Truy cập đường dẫn sau trên trình duyệt để khởi tạo nhanh các tài khoản và danh mục, sản phẩm mẫu:
`http://localhost:5173/api/seed`

**Tài khoản mẫu được tạo sẵn:**
- **Tài khoản Admin**: `admin@example.com` / Mật khẩu: `admin123`
- **Tài khoản Editor**: `editor@example.com` / Mật khẩu: `editor123`
- **Tài khoản Khách hàng**: `customer@example.com` / Mật khẩu: `customer123`

---

## 📦 Triển khai Đóng gói (Production Build)

Khi cần chạy ứng dụng ở môi trường production thực tế, chạy lệnh build để đóng gói toàn bộ Frontend tĩnh và Backend API:
```bash
npm run build
```

Sau khi biên dịch hoàn tất, thư mục `.output/` sẽ được sinh ra ở gốc dự án. Để chạy máy chủ độc lập mà không cần môi trường dev:
```bash
node .output/server/index.mjs
```
Hệ thống sẽ chạy gọn gàng trên cổng bạn đã cấu hình trong tệp `.env` (mặc định là `3000`).
