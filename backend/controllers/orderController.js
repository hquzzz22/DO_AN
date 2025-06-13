import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";

import qs from "qs";
import crypto from "crypto";
import moment from "moment";

const vnp_TmnCode = process.env.VNPAY_TMN_CODE;
const vnp_HashSecret = process.env.VNPAY_HASH_SECRET;
const vnp_Url = process.env.VNPAY_URL;
const vnp_ReturnUrl = process.env.VNPAY_RETURN_URL;

// global variables
const currency = "vnd";
const deliveryCharge = 10;

// Placing orders using COD Method
const placeOrder = async (req, res) => {
  try {
    const { userId, items, amount, address } = req.body;

    const orderData = {
      userId,
      items,
      address,
      amount,
      paymentMethod: "COD",
      payment: false,
      date: Date.now(),
    };

    const newOrder = new orderModel(orderData);
    await newOrder.save();

    await userModel.findByIdAndUpdate(userId, { cartData: {} });

    res.json({ success: true, message: "Order Placed" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const allOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({});
    res.json({ success: true, orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// User Order Data For Forntend
const userOrders = async (req, res) => {
  try {
    const { userId } = req.body;

    const orders = await orderModel.find({ userId });
    res.json({ success: true, orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// update order status from Admin Panel
const updateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;

    await orderModel.findByIdAndUpdate(orderId, { status });
    res.json({ success: true, message: "Status Updated" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const searchOrders = async (req, res) => {
  try {
    const { userId, status, startDate, endDate } = req.body;

    // Tạo object query để tìm kiếm
    let query = {};

    // Nếu có userId, thêm vào query
    if (userId) {
      query.userId = userId;
    }

    // Nếu có status, thêm vào query
    if (status) {
      query.status = status;
    }

    // Nếu có khoảng thời gian, thêm vào query
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate).getTime(),
        $lte: new Date(endDate).getTime(),
      };
    }

    // Tìm kiếm đơn hàng
    const orders = await orderModel.find(query);

    if (orders.length === 0) {
      return res.json({
        success: true,
        orders: [],
        message: "No orders found",
      });
    }

    res.json({ success: true, orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Tạo URL thanh toán
function sortObject(obj) {
  const sorted = {};
  Object.keys(obj)
    .sort()
    .forEach((key) => {
      sorted[key] = obj[key];
    });
  return sorted;
}

const placeOrderVNPay = async (req, res) => {
  try {
    const { userId, items, amount, address } = req.body;

    const createDate = moment().format("YYYYMMDDHHmmss");
    const orderId =
      moment().format("HHmmss") + Math.floor(Math.random() * 10000);
    const amountStr = amount * 100;

    const ipAddr =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";

    const vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode,
      vnp_Locale: "vn",
      vnp_CurrCode: "VND",
      vnp_TxnRef: orderId,
      vnp_OrderInfo: `Thanh toán đơn hàng ${orderId}`,
      vnp_OrderType: "other",
      vnp_Amount: amountStr,
      vnp_ReturnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    const sortedParams = sortObject(vnp_Params);
    const signData = qs.stringify(sortedParams, { encode: false });

    const secureHash = crypto
      .createHmac("sha512", vnp_HashSecret)
      .update(Buffer.from(signData, "utf-8"))
      .digest("hex");

    sortedParams.vnp_SecureHash = secureHash;

    const paymentUrl = `${vnp_Url}?${qs.stringify(sortedParams, {
      encode: false,
    })}`;

    // Lưu đơn hàng
    await new orderModel({
      userId,
      items,
      address,
      amount,
      paymentMethod: "VNPay",
      payment: false,
      date: Date.now(),
      vnpayTxnRef: orderId,
    }).save();

    res.json({ success: true, paymentUrl });
  } catch (error) {
    console.error("Lỗi VNPay:", error);
    res.json({ success: false, message: "Lỗi tạo link thanh toán VNPay" });
  }
};

// VNPay redirect callback
const vnpayReturn = async (req, res) => {
  try {
    let vnp_Params = req.query;
    const secureHash = vnp_Params.vnp_SecureHash;

    // Bỏ những field không cần ký
    delete vnp_Params.vnp_SecureHash;
    delete vnp_Params.vnp_SecureHashType;

    const sortedParams = sortObject(vnp_Params);
    const signData = qs.stringify(sortedParams, { encode: false });

    const hashCheck = crypto
      .createHmac("sha512", vnp_HashSecret)
      .update(Buffer.from(signData, "utf-8"))
      .digest("hex");

    // Ghi log để bạn kiểm tra
    console.log("===== VNPay Verify Log =====");
    console.log("SIGN DATA:", signData);
    console.log("FROM VNP:", secureHash);
    console.log("YOUR HASH:", hashCheck);

    if (secureHash === hashCheck) {
      await orderModel.findOneAndUpdate(
        { vnpayTxnRef: vnp_Params.vnp_TxnRef },
        {
          payment: true,
          vnpayTransactionNo: vnp_Params.vnp_TransactionNo,
          status: "Đã thanh toán",
        }
      );
      return res.redirect("http://localhost:5173/thank-you");
    } else {
      return res.status(400).send("Chữ ký không hợp lệ!");
    }
  } catch (error) {
    console.error("VNPay callback error:", error);
    res.status(500).send("Lỗi server.");
  }
};

export {
  placeOrder,
  allOrders,
  userOrders,
  updateStatus,
  searchOrders,
  placeOrderVNPay,
  vnpayReturn,
};
