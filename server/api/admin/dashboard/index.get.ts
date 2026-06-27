import { defineEventHandler, createError } from "h3";
import { Product, ProductCategory, User, Order } from "../../../utils/models.ts";

export default defineEventHandler(async (event) => {
  const permissions = event.context.admin?.role_id?.permissions || [];
  if (!permissions.includes("dashboard_view")) {
    throw createError({
      statusCode: 403,
      statusMessage: "Bạn không có quyền truy cập Dashboard."
    });
  }

  // Query counts in parallel
  const [
    totalProductsActive,
    totalProductsInactive,
    totalCategories,
    totalUsers,
    totalOrders
  ] = await Promise.all([
    Product.countDocuments({ status: "active" }),
    Product.countDocuments({ status: "inactive" }),
    ProductCategory.countDocuments({}),
    User.countDocuments({}),
    Order.countDocuments({})
  ]);

  // Aggregate Revenue (excluding cancelled orders)
  const revenueAggregate = await Order.aggregate([
    { $match: { status: { $ne: "cancelled" } } },
    { $unwind: "$products" },
    {
      $group: {
        _id: null,
        totalRevenue: {
          $sum: {
            $multiply: [
              {
                $subtract: [
                  "$products.price",
                  {
                    $multiply: [
                      "$products.price",
                      { $divide: ["$products.discountPercentage", 100] }
                    ]
                  }
                ]
              },
              "$products.quantity"
            ]
          }
        }
      }
    }
  ]);

  const totalRevenue = revenueAggregate.length > 0 ? revenueAggregate[0].totalRevenue : 0;

  return {
    success: true,
    data: {
      products: {
        active: totalProductsActive,
        inactive: totalProductsInactive,
        total: totalProductsActive + totalProductsInactive
      },
      categoriesCount: totalCategories,
      usersCount: totalUsers,
      orders: {
        total: totalOrders,
        revenue: Math.round(totalRevenue)
      }
    }
  };
});
