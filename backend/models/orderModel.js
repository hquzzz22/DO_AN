import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true },

  // Store order items in a consistent structured format
  // NOTE: legacy orders may have different shapes; admin UI will handle them.
  items: {
    type: [
      {
        productId: { type: String },
        name: { type: String },
        price: { type: Number }, // giá bán tại thời điểm mua
        costPrice: { type: Number, default: 0 }, // giá nhập snapshot tại thời điểm mua
        image: { type: [String], default: [] },
        size: { type: String },
        color: { type: String },
        quantity: { type: Number, required: true },
      },
    ],
    required: true,
  },

  amount: { type: Number, required: true },
  address: { type: Object, required: true },
  status: { type: String, required: true, default: "Order Placed" },
  paymentMethod: { type: String, required: true },
  payment: { type: Boolean, required: true, default: false },
  date: { type: Number, required: true },
  vnpayTxnRef: { type: String, required: false }, // Mã tham chiếu giao dịch VNPay
  vnpayTransactionNo: { type: String, required: false }, // Mã giao dịch tại VNPay
});

const orderModel =
  mongoose.models.order || mongoose.model("order", orderSchema);
export default orderModel;
