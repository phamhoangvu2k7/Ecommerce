import { defineEventHandler } from "h3";
import { Role, Account, ProductCategory, Product, User } from "../utils/models.ts";
import { hashPassword } from "../utils/helpers.ts";

export default defineEventHandler(async (event) => {
  // Clear collections
  await Promise.all([
    Role.deleteMany({}),
    Account.deleteMany({}),
    ProductCategory.deleteMany({}),
    Product.deleteMany({}),
    User.deleteMany({})
  ]);

  // Create Roles
  const superAdminRole = new Role({
    title: "Super Admin",
    description: "Quản trị viên tối cao",
    permissions: [
      "dashboard_view",
      "products_view", "products_create", "products_edit", "products_delete",
      "categories_view", "categories_create", "categories_edit", "categories_delete",
      "roles_view", "roles_permissions",
      "accounts_view", "accounts_create", "accounts_edit", "accounts_delete",
      "trash_view", "trash_restore"
    ]
  });

  const editorRole = new Role({
    title: "Editor",
    description: "Biên tập viên nội dung",
    permissions: [
      "dashboard_view",
      "products_view", "products_create", "products_edit",
      "categories_view", "categories_create", "categories_edit",
      "trash_view"
    ]
  });

  await Promise.all([superAdminRole.save(), editorRole.save()]);

  // Create Admins
  const adminAccount = new Account({
    fullName: "Nguyễn Văn Admin",
    email: "admin@example.com",
    password: hashPassword("admin123"),
    role_id: superAdminRole._id,
    phone: "0987654321",
    status: "active"
  });

  const editorAccount = new Account({
    fullName: "Trần Thị Editor",
    email: "editor@example.com",
    password: hashPassword("editor123"),
    role_id: editorRole._id,
    phone: "0912345678",
    status: "active"
  });

  await Promise.all([adminAccount.save(), editorAccount.save()]);

  // Create Client Users
  const clientUser = new User({
    fullName: "Khách Hàng A",
    email: "customer@example.com",
    password: hashPassword("customer123"),
    phone: "0900000001",
    status: "active"
  });
  await clientUser.save();

  // Create Categories
  const phoneCat = new ProductCategory({
    title: "Điện thoại",
    slug: "dien-thoai",
    description: "Các loại smartphone mới nhất",
    status: "active",
    position: 1
  });
  const laptopCat = new ProductCategory({
    title: "Laptop",
    slug: "laptop",
    description: "Máy tính xách tay văn phòng và gaming",
    status: "active",
    position: 2
  });
  const accessoryCat = new ProductCategory({
    title: "Phụ kiện",
    slug: "phu-kien",
    description: "Cáp sạc, tai nghe, pin dự phòng",
    status: "active",
    position: 3
  });

  await Promise.all([phoneCat.save(), laptopCat.save(), accessoryCat.save()]);

  // Create Products
  const products = [
    new Product({
      title: "iPhone 15 Pro Max",
      slug: "iphone-15-pro-max",
      product_category_id: phoneCat._id,
      description: "iPhone 15 Pro Max 256GB chính hãng Việt Nam",
      price: 32000000,
      discountPercentage: 10,
      stock: 50,
      thumbnail: "v1782806960/products/khuvetxll0lpkkg3kzsv.webp",
      status: "active",
      position: 1
    }),
    new Product({
      title: "Samsung Galaxy S24 Ultra",
      slug: "samsung-galaxy-s24-ultra",
      product_category_id: phoneCat._id,
      description: "Samsung Galaxy S24 Ultra 12GB/256GB",
      price: 28000000,
      discountPercentage: 15,
      stock: 40,
      thumbnail: "v1782806930/products/wriwuz2mznhxgwal05nq.webp",
      status: "active",
      position: 2
    }),
    new Product({
      title: "MacBook Air M3",
      slug: "macbook-air-m3",
      product_category_id: laptopCat._id,
      description: "MacBook Air M3 8GB/256GB 2024",
      price: 27990000,
      discountPercentage: 5,
      stock: 30,
      thumbnail: "v1782807044/products/fex0j6t83fjtnk8dmlrq.webp",
      status: "active",
      position: 3
    }),
    new Product({
      title: "Dell XPS 13 Plus",
      slug: "dell-xps-13-plus",
      product_category_id: laptopCat._id,
      description: "Dell XPS 13 Plus 9320 Core i7-1360P",
      price: 45000000,
      discountPercentage: 20,
      stock: 15,
      thumbnail: "v1782807018/products/qzurwujesh7ezjp9ku7p.webp",
      status: "active",
      position: 4
    }),
    new Product({
      title: "Tai nghe Apple AirPods Pro 2",
      slug: "tai-nghe-apple-airpods-pro-2",
      product_category_id: accessoryCat._id,
      description: "Tai nghe chống ồn chủ động AirPods Pro thế hệ 2",
      price: 5990000,
      discountPercentage: 12,
      stock: 100,
      thumbnail: "v1782806859/products/mty05la5cdugoziulp3f.webp",
      status: "active",
      position: 5
    })
  ];

  await Promise.all(products.map(p => p.save()));

  return {
    success: true,
    message: "Dữ liệu mẫu đã được seed thành công!"
  };
});
