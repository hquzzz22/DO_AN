import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";

import qs from "qs";
import crypto from "node:crypto";
import moment from "moment";

const vnp_TmnCode = process.env.VNPAY_TMN_CODE;
const vnp_HashSecret = process.env.VNPAY_HASH_SECRET;
const vnp_Url = process.env.VNPAY_URL;
const vnp_ReturnUrl = process.env.VNPAY_RETURN_URL;
const vnp_IpnUrl = process.env.VNPAY_IPN_URL;

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
// VNPay signature rules are picky:
// - Sort by key ASC
// - Build signData as: key=encode(value)&...
// - encode like encodeURIComponent, but spaces must be '+'
function sortObject(obj) {
  const sorted = {};
  Object.keys(obj)
    .sort()
    .forEach((key) => {
      sorted[key] = obj[key];
    });
  return sorted;
}

function buildVnpSignData(params) {
  const sorted = sortObject(params);
  return Object.keys(sorted)
    .map(
      (key) =>
        `${key}=${encodeURIComponent(String(sorted[key])).replace(/%20/g, "+")}`
    )
    .join("&");
}

const placeOrderVNPay = async (req, res) => {
  try {
    const { userId, items, amount, address } = req.body;

    const createDate = moment().format("YYYYMMDDHHmmss");
    const orderId =
      moment().format("HHmmss") + Math.floor(Math.random() * 10000);
    const amountStr = Math.round(Number(amount) * 100);

    // VNPay expects a clean client IP (prefer IPv4). x-forwarded-for can contain a list.
    const forwarded = req.headers["x-forwarded-for"];
    let ipAddr = (Array.isArray(forwarded) ? forwarded[0] : forwarded)
      ? String(Array.isArray(forwarded) ? forwarded[0] : forwarded).split(",")[0].trim()
      : req.socket.remoteAddress || "127.0.0.1";

    // Handle IPv6 mapped IPv4 like ::ffff:127.0.0.1
    if (ipAddr.startsWith("::ffff:")) ipAddr = ipAddr.replace("::ffff:", "");
    if (ipAddr === "::1") ipAddr = "127.0.0.1";

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
      ...(vnp_IpnUrl ? { vnp_IpnUrl } : {}),
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    const sortedParams = sortObject(vnp_Params);
    const signData = buildVnpSignData(vnp_Params);

    const secureHash = crypto
      .createHmac("sha512", vnp_HashSecret)
      .update(Buffer.from(signData, "utf-8"))
      .digest("hex");

    sortedParams.vnp_SecureHash = secureHash;

    // Build the final payment URL (do NOT double-encode values here)
    const paymentUrl = `${vnp_Url}?${qs.stringify(sortedParams, {
      encode: true,
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
    let vnp_Params = { ...req.query };
    const secureHash = vnp_Params.vnp_SecureHash;

    // Remove fields not used for signature
    delete vnp_Params.vnp_SecureHash;
    delete vnp_Params.vnp_SecureHashType;

    const sortedParams = sortObject(vnp_Params);
    const signData = buildVnpSignData(vnp_Params);

    const hashCheck = crypto
      .createHmac("sha512", vnp_HashSecret)
      .update(Buffer.from(signData, "utf-8"))
      .digest("hex");

    console.log("===== VNPay Return Verify Log =====");
    console.log("SIGN DATA:", signData);
    console.log("FROM VNP:", secureHash);
    console.log("YOUR HASH:", hashCheck);

    if (secureHash !== hashCheck) {
      return res.status(400).send("Chữ ký không hợp lệ!");
    }

    // Only mark paid when VNPay says success
    const isSuccess = vnp_Params.vnp_ResponseCode === "00";

    await orderModel.findOneAndUpdate(
      { vnpayTxnRef: vnp_Params.vnp_TxnRef },
      {
        payment: isSuccess,
        vnpayTransactionNo: vnp_Params.vnp_TransactionNo,
        status: isSuccess ? "Đã thanh toán" : "Thanh toán thất bại",
      }
    );

    // Redirect user back to frontend
    const frontendSuccessUrl = process.env.FRONTEND_SUCCESS_URL ||
      "http://localhost:5173/thank-you";
    const frontendFailUrl = process.env.FRONTEND_FAIL_URL ||
      "http://localhost:5173/payment-failed";

    return res.redirect(isSuccess ? frontendSuccessUrl : frontendFailUrl);
  } catch (error) {
    console.error("VNPay return error:", error);
    res.status(500).send("Lỗi server.");
  }
};

// VNPay IPN (server-to-server) - reliable source of truth
const vnpayIpn = async (req, res) => {
  try {
    let vnp_Params = { ...req.query };
    const secureHash = vnp_Params.vnp_SecureHash;

    // Remove fields not used for signature
    delete vnp_Params.vnp_SecureHash;
    delete vnp_Params.vnp_SecureHashType;

    const sortedParams = sortObject(vnp_Params);
    const signData = buildVnpSignData(vnp_Params);

    const hashCheck = crypto
      .createHmac("sha512", vnp_HashSecret)
      .update(Buffer.from(signData, "utf-8"))
      .digest("hex");

    console.log("===== VNPay IPN Verify Log =====");
    console.log("SIGN DATA:", signData);
    console.log("FROM VNP:", secureHash);
    console.log("YOUR HASH:", hashCheck);

    // Prepare response to VNPay
    let rspCode, message;

    if (secureHash !== hashCheck) {
      rspCode = "97";
      message = "Fail checksum";
    } else {
      const isSuccess = vnp_Params.vnp_ResponseCode === "00";
      const order = await orderModel.findOneAndUpdate(
        { vnpayTxnRef: vnp_Params.vnp_TxnRef },
        {
          payment: isSuccess,
          vnpayTransactionNo: vnp_Params.vnp_TransactionNo,
          status: isSuccess ? "Đã thanh toán" : "Thanh toán thất bại",
        },
        { new: true }
      );

      if (!order) {
        rspCode = "01";
        message = "Order not found";
      } else {
        rspCode = "00";
        message = "Confirm success";
      }
    }

    // VNPay expects plain text response in format: RspCode=xx&Message=xxx
    return res.type("text/plain").send(`RspCode=${rspCode}&Message=${message}`);
  } catch (error) {
    console.error("VNPay IPN error:", error);
    res.type("text/plain").send("RspCode=99&Message=System error");
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
  vnpayIpn,
};
