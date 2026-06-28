# 📋 Hướng Dẫn Triển Khai (Deploy) Website Lên VPS Ubuntu

Tài liệu này hướng dẫn chi tiết từng bước để chạy website bán hàng của bạn lên máy chủ VPS Ubuntu (phiên bản `18.04` của bạn) đã cài sẵn Nginx, kết hợp sử dụng tên miền `vucaothu.online`.

---

## 📌 Các bước chuẩn bị trước trên VPS

Hiện tại bạn đã kết nối SSH vào VPS thành công. Hãy thực hiện tuần tự các lệnh sau ở cửa sổ terminal của VPS:

### Bước 1: Cập nhật hệ thống và cài đặt công cụ cần thiết

Cập nhật danh sách gói phần mềm:

```bash
sudo apt update
```

Nâng cấp các phần mềm cũ trên VPS:

```bash
sudo apt upgrade -y
```

Cài đặt công cụ `curl` (do VPS chưa có sẵn):

```bash
sudo apt-get install -y curl
```

Cài đặt công cụ Git để tải code:

```bash
sudo apt-get install -y git
```

---

### Bước 2: Cài đặt Node.js (Phiên bản 20 LTS)

Tải script cài đặt Node.js v20:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
```

Cài đặt Node.js và npm vào hệ thống:

```bash
sudo apt-get install -y nodejs
```

Kiểm tra xem cài đặt thành công chưa:

```bash
node -v
```

Kiểm tra phiên bản npm đi kèm:

```bash
npm -v
```

---

### Bước 3: Cài đặt PM2 (Công cụ chạy ẩn Server)

Cài đặt PM2 để chạy dự án dưới nền (chạy ngầm):

```bash
sudo npm install -g pm2
```

---

## 📦 Tải mã nguồn và Build dự án trên VPS

### Bước 4: Tải code từ GitHub về VPS

Tạo thư mục lưu trữ website tại đường dẫn `/var/www/ecommerce`:

```bash
sudo mkdir -p /var/www/ecommerce
```

Phân quyền sở hữu thư mục cho tài khoản đang đăng nhập:

```bash
sudo chown -R $USER:$USER /var/www/ecommerce
```

Di chuyển vào thư mục vừa tạo:

```bash
cd /var/www/ecommerce
```

Tải mã nguồn từ GitHub của bạn về thư mục này:

```bash
git clone https://github.com/phamhoangvu2k7/Ecommerce.git .
```

---

### Bước 5: Cấu hình file môi trường `.env` trên VPS

Tạo và mở file cấu hình `.env` mới bằng trình soạn thảo Nano:

```bash
nano .env
```

Hãy copy toàn bộ nội dung bên dưới, dán vào cửa sổ Nano trên VPS rồi lưu lại:

```env
PORT=3000
MONGO_URL=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?appName=productManager
MONGO_NAME=product-management
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_email_app_password
CLOUD_NAME=your_cloudinary_name
CLOUD_KEY=your_cloudinary_key
CLOUD_SECRET=your_cloudinary_secret
SESSION_SECRET=your_session_secret
JWT_SECRET=your_jwt_secret
```

_(Để lưu trên terminal: Bấm tổ hợp `Ctrl + O` -> Nhấn `Enter` -> Bấm `Ctrl + X` để thoát)._

---

### Bước 6: Cài đặt thư viện và Đóng gói (Build)

Cài đặt các gói thư viện cần thiết cho dự án:

```bash
npm install --legacy-peer-deps
```

Chạy lệnh đóng gói dự án để chạy thực tế:

```bash
npm run build
```

---

## ⚙️ Khởi chạy Server và cấu hình Nginx

### Bước 7: Khởi chạy dự án bằng PM2

Khởi chạy server ngầm bằng PM2:

```bash
pm2 start .output/server/index.mjs --name "ecommerce-app" --node-args="--env-file=.env"
```

Xem danh sách và trạng thái các ứng dụng đang chạy ngầm:

```bash
pm2 list
```

Đăng ký PM2 tự động khởi chạy khi hệ thống VPS reboot:

```bash
pm2 startup
```

_(Sau lệnh trên, PM2 sẽ sinh ra một dòng lệnh bắt đầu bằng `sudo env PATH=...`. Bạn hãy copy dòng lệnh đó chạy trên terminal)._

Lưu lại cấu hình PM2 hiện tại:

```bash
pm2 save
```

---

### Bước 8: Cấu hình Nginx làm Proxy ngược (Reverse Proxy)

Mở file cấu hình mặc định của Nginx để chỉnh sửa:

```bash
sudo nano /etc/nginx/sites-available/default
```

Hãy thay thế toàn bộ nội dung trong file đó bằng nội dung cấu hình trỏ tên miền này:

```nginx
server {
    listen 80;
    server_name vucaothu.online www.vucaothu.online;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Kiểm tra xem cú pháp cấu hình Nginx có chuẩn chưa:

```bash
sudo nginx -t
```

Khởi động lại dịch vụ Nginx để áp dụng:

```bash
sudo nginx -s reload
```

---

## 🔒 Bước 9: Cài đặt SSL miễn phí (HTTPS) (Khuyên dùng)

Cài đặt công cụ cấu hình SSL tự động (Certbot):

```bash
sudo apt install certbot python3-certbot-nginx -y
```

Chạy Certbot để tạo chứng chỉ HTTPS bảo mật cho tên miền:

```bash
sudo certbot --nginx -d vucaothu.online -d www.vucaothu.online
```

_(Nhập email của bạn, chọn Agree và chọn Redirect toàn bộ truy cập sang HTTPS)._

---

## 🚀 Bước 10: Cấu hình CI/CD Tự Động bằng GitHub Actions

Sau khi hoàn thành cài đặt thủ công và chạy thử thành công, bạn hãy làm theo các bước sau để tự động hóa việc deploy mỗi khi `git push` lên nhánh `main`:

### 1. Tạo SSH Key trên VPS để GitHub kết nối
Chạy lệnh sau trên VPS để sinh cặp khóa SSH (nhấn `Enter` liên tiếp khi được hỏi để không đặt mật khẩu):
```bash
ssh-keygen -t ed25519 -f ~/.ssh/github_actions -C "github-actions"
```

Thêm khóa công khai (public key) vào danh sách khóa được phép kết nối của VPS:
```bash
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

Hiển thị khóa bí mật (private key) để copy sang GitHub:
```bash
cat ~/.ssh/github_actions
```
*(Hãy copy toàn bộ nội dung xuất hiện trên màn hình, bao gồm cả dòng `-----BEGIN OPENSSH PRIVATE KEY-----` và `-----END OPENSSH PRIVATE KEY-----`).*

### 2. Cấu hình Secrets trên GitHub
Truy cập vào Repository của bạn trên GitHub (`phamhoangvu2k7/Ecommerce`):
1. Vào mục **Settings** -> **Secrets and variables** -> **Actions**.
2. Nhấn nút **New repository secret** để thêm 3 biến sau:
   - Biến 1: **`VPS_HOST`** là IP của VPS của bạn (hoặc `vucaothu.online`).
   - Biến 2: **`VPS_USER`** là tên tài khoản SSH bạn dùng trên VPS (ví dụ: `phamvu`).
   - Biến 3: **`VPS_SSH_KEY`** là nội dung khóa bí mật (Private Key) bạn vừa copy ở bước trên.

### 3. Tạo file cấu hình Workflow trong dự án
Tạo file cấu hình `.github/workflows/deploy.yml` ngay trong thư mục code dự án của bạn với nội dung sau:

```yaml
name: Deploy to VPS

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /var/www/ecommerce
            git pull origin main
            npm install --legacy-peer-deps
            npm run build
            pm2 reload ecommerce-app || pm2 start .output/server/index.mjs --name "ecommerce-app" --node-args="--env-file=.env"
```

Sau khi tạo xong file này, hãy commit và push lên GitHub. Từ các lần push tiếp theo, GitHub sẽ tự động cập nhật code mới lên VPS và khởi chạy lại dự án cho bạn!

