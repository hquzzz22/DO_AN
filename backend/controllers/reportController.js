import orderModel from "../models/orderModel.js";

// Revenue & Profit report (admin)
// Only count orders with status = "Đã giao"
// Body: { startDate?: string|number, endDate?: string|number }
const revenueReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.body || {};

    const query = { status: "Đã giao" };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate).getTime(),
        $lte: new Date(endDate).getTime(),
      };
    }

    const orders = await orderModel.find(query).lean();

    let totalRevenue = 0;
    let totalCost = 0;
    let ordersCount = orders.length;

    const byDay = {}; // YYYY-MM-DD -> { revenue, cost, profit, orders }

    for (const o of orders) {
      // Compute revenue from item snapshots (variant price * quantity)
      const itemsRevenue = (o.items || []).reduce((sum, it) => {
        const qty = Number(it.quantity) || 0;
        const price = Number(it.price) || 0;
        return sum + price * qty;
      }, 0);

      const orderRevenue = itemsRevenue;
      totalRevenue += orderRevenue;

      const orderCost = (o.items || []).reduce((sum, it) => {
        const qty = Number(it.quantity) || 0;
        const cost = Number(it.costPrice) || 0;
        return sum + cost * qty;
      }, 0);

      totalCost += orderCost;

      const dayKey = new Date(o.date).toISOString().slice(0, 10);
      if (!byDay[dayKey]) {
        byDay[dayKey] = {
          date: dayKey,
          revenue: 0,
          cost: 0,
          profit: 0,
          orders: 0,
        };
      }
      byDay[dayKey].revenue += orderRevenue;
      byDay[dayKey].cost += orderCost;
      byDay[dayKey].profit += orderRevenue - orderCost;
      byDay[dayKey].orders += 1;
    }

    const totalProfit = totalRevenue - totalCost;

    const daily = Object.values(byDay).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    return res.json({
      success: true,
      summary: {
        totalRevenue,
        totalCost,
        totalProfit,
        ordersCount,
      },
      daily,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export { revenueReport };
