import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";

import qs from "qs";
import crypto from "node:crypto";
import moment from "moment";

const vnp_TmnCode = process.env.VNPAY_TMN_CODE;
const vnp_HashSecret = process.env.VNPAY_HASH_SECRET;
const vnp_Url = process.env.VNPAY_URL;
const vnp_ReturnUrl = process.env.VNPAY_RETURN_URL;
const vnp_IpnUrl = process.env.VNPAY_IPN_URL;

// Status (Vietnamese)
const ORDER_STATUS = {
  NEW: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  PACKING: "Đang đóng gói",
  SHIPPING: "Đang giao hàng",
  DELIVERED: "Đã giao",
  CANCELLED: "Đã hủy",
  RETURNED: "Đã trả hàng",
};

const PAYMENT_STATUS = {
  PENDING: "Chưa thanh toán",
  PAID: "Đã thanh toán",
  FAILED: "Thanh toán thất bại",
};

const normalizeOrderItems = (items = []) => {
  return (items || []).map((it) => ({
    productId: String(it._id || it.productId || ""),
    name: it.name,
    price: Number(it.price) || 0, // will be overwritten from variant price
    costPrice: 0,
    image: Array.isArray(it.image) ? it.image : [],
    size: it.size,
    color: it.color,
    quantity: Number(it.quantity) || 0,
  }));
};

const fillVariantSnapshotForOrderItems = async (orderItems) => {
  // Fill price (sale price) and costPrice from current variant data
  for (const it of orderItems) {
    if (!it.productId || !it.size || !it.color) continue;
    const product = await productModel.findById(it.productId);
    const variant = product?.variants?.find(
      (v) => v.size === it.size && v.color === it.color
    );

    // Snapshot
    // If variant price not set, fallback to product base price
    it.price = Number(variant?.price) || Number(product?.price) || 0;
    it.costPrice = Number(variant?.cost) || 0;
  }
};

const decreaseVariantStockForOrder = async (orderItems) => {
  for (const it of orderItems) {
    if (!it.productId || !it.size || !it.color) {
      throw new Error("Thiếu thông tin biến thể để trừ kho (productId/size/color)");
    }

    const qty = Number(it.quantity) || 0;
    if (qty <= 0) continue;

    const product = await productModel.findById(it.productId);
    if (!product) throw new Error("Sản phẩm không tồn tại để trừ kho");

    const variant = product.variants?.find(
      (v) => v.size === it.size && v.color === it.color
    );

    if (!variant) throw new Error("Biến thể (size/màu) không tồn tại");
    if ((variant.stock || 0) < qty) {
      throw new Error(
        `Không đủ tồn kho cho ${product.name} (${it.color} - ${it.size})`
      );
    }

    const updated = await productModel.updateOne(
      {
        _id: it.productId,
        "variants.size": it.size,
        "variants.color": it.color,
        "variants.stock": { $gte: qty },
      },
      { $inc: { "variants.$.stock": -qty } }
    );

    if (!updated.modifiedCount) {
      throw new Error(
        `Không đủ tồn kho cho ${product.name} (${it.color} - ${it.size})`
      );
    }
  }
};

const increaseVariantStockForOrder = async (orderItems) => {
  for (const it of orderItems) {
    const qty = Number(it.quantity) || 0;
    if (!it.productId || !it.size || !it.color || qty <= 0) continue;

    await productModel.updateOne(
      { _id: it.productId, "variants.size": it.size, "variants.color": it.color },
      { $inc: { "variants.$.stock": qty } }
    );
  }
};

// COD order: snapshot variant price/cost and decrement stock immediately
const placeOrder = async (req, res) => {
  try {
    const { userId, items, amount, address } = req.body;

    const orderItems = normalizeOrderItems(items);

    await fillVariantSnapshotForOrderItems(orderItems);

    // Safety: if still no price after fallback, refuse
    if (orderItems.some((it) => !it.price || it.price <= 0)) {
      return res.json({
        success: false,
        message: "Sản phẩm/biến thể chưa có giá bán, vui lòng kiểm tra lại",
      });
    }

    await decreaseVariantStockForOrder(orderItems);

    const orderData = {
      userId,
      items: orderItems,
      address,
      amount,
      paymentMethod: "COD",
      payment: false,
      status: ORDER_STATUS.NEW,
      date: Date.now(),
    };

    const newOrder = new orderModel(orderData);
    await newOrder.save();

    await userModel.findByIdAndUpdate(userId, { cartData: {} });

    res.json({ success: true, message: "Đặt hàng thành công" });
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

const updateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;

    await orderModel.findByIdAndUpdate(orderId, { status });
    res.json({ success: true, message: "Cập nhật trạng thái thành công" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const searchOrders = async (req, res) => {
  try {
    const { userId, status, startDate, endDate } = req.body;

    let query = {};

    if (userId) query.userId = userId;
    if (status) query.status = status;

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate).getTime(),
        $lte: new Date(endDate).getTime(),
      };
    }

    const orders = await orderModel.find(query);

    if (orders.length === 0) {
      return res.json({
        success: true,
        orders: [],
        message: "Không tìm thấy đơn hàng",
      });
    }

    res.json({ success: true, orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// VNPay helpers
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
    .map((key) => {
      const value = sorted[key];
      return `${key}=${encodeURIComponent(String(value)).replace(/%20/g, "+")}`;
    })
    .join("&");
}

function buildVnpQueryString(params) {
  const sorted = sortObject(params);
  return Object.keys(sorted)
    .map((key) => {
      const value = sorted[key];
      return `${key}=${encodeURIComponent(String(value)).replace(/%20/g, "+")}`;
    })
    .join("&");
}

const placeOrderVNPay = async (req, res) => {
  try {
    const { userId, items, amount, address } = req.body;

    if (!vnp_TmnCode || !vnp_HashSecret || !vnp_Url) {
      return res.json({
        success: false,
        message: "Cấu hình VNPay trên server chưa hoàn tất (thiếu TMN_CODE hoặc HASH_SECRET)",
      });
    }

    const createDate = moment().format("YYYYMMDDHHmmss");
    const orderId = moment().format("HHmmss") + Math.floor(Math.random() * 10000);
    const amountStr = Math.round(Number(amount) * 100);

    const forwarded = req.headers["x-forwarded-for"];
    let ipAddr = (Array.isArray(forwarded) ? forwarded[0] : forwarded)
      ? String(Array.isArray(forwarded) ? forwarded[0] : forwarded)
          .split(",")[0]
          .trim()
      : req.socket.remoteAddress || "127.0.0.1";

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
    const signData = buildVnpSignData(sortedParams);

    const secureHash = crypto
      .createHmac("sha512", vnp_HashSecret)
      .update(Buffer.from(signData, "utf-8"))
      .digest("hex");

    sortedParams.vnp_SecureHash = secureHash;

    const paymentUrl = `${vnp_Url}?${buildVnpQueryString(sortedParams)}`;

    const orderItems = normalizeOrderItems(items);
    await fillVariantSnapshotForOrderItems(orderItems);

    if (orderItems.some((it) => !it.price || it.price <= 0)) {
      return res.json({
        success: false,
        message: "Sản phẩm/biến thể chưa có giá bán, vui lòng kiểm tra lại",
      });
    }

    await new orderModel({
      userId,
      items: orderItems,
      address,
      amount,
      paymentMethod: "VNPay",
      payment: false,
      paymentStatus: PAYMENT_STATUS.PENDING,
      status: ORDER_STATUS.NEW,
      date: Date.now(),
      vnpayTxnRef: orderId,
    }).save();

    res.json({ success: true, paymentUrl });
  } catch (error) {
    console.error("Lỗi VNPay:", error);
    res.json({ success: false, message: "Lỗi tạo link thanh toán VNPay" });
  }
};

const vnpayReturn = async (req, res) => {
  try {
    let vnp_Params = { ...req.query };
    const secureHash = vnp_Params.vnp_SecureHash;

    delete vnp_Params.vnp_SecureHash;
    delete vnp_Params.vnp_SecureHashType;

    const signData = buildVnpSignData(vnp_Params);

    const hashCheck = crypto
      .createHmac("sha512", vnp_HashSecret)
      .update(Buffer.from(signData, "utf-8"))
      .digest("hex");

    if (secureHash !== hashCheck) {
      return res.status(400).send("Chữ ký không hợp lệ!");
    }

    const isSuccess = vnp_Params.vnp_ResponseCode === "00";

    const order = await orderModel.findOne({ vnpayTxnRef: vnp_Params.vnp_TxnRef });
    if (!order) return res.status(404).send("Order not found");

    if (isSuccess) {
      const updated = await orderModel.findOneAndUpdate(
        { _id: order._id, payment: false },
        {
          $set: {
            payment: true,
            paymentStatus: PAYMENT_STATUS.PAID,
            vnpayTransactionNo: vnp_Params.vnp_TransactionNo,
          },
        },
        { new: true }
      );

      if (updated) {
        await decreaseVariantStockForOrder(order.items);
      }
    } else {
      await orderModel.updateOne(
        { _id: order._id },
        {
          $set: {
            payment: false,
            paymentStatus: PAYMENT_STATUS.FAILED,
            vnpayTransactionNo: vnp_Params.vnp_TransactionNo,
          },
        }
      );
    }

    // If order was already marked paid earlier (e.g. IPN processed first), persist transaction no if missing
    if (isSuccess && order.payment === true && !order.vnpayTransactionNo) {
      await orderModel.updateOne(
        { _id: order._id },
        { $set: { vnpayTransactionNo: vnp_Params.vnp_TransactionNo } }
      );
     
    }

    const frontendSuccessUrl =
      process.env.FRONTEND_SUCCESS_URL || "http://localhost:5173/thank-you";
    const frontendFailUrl =
      process.env.FRONTEND_FAIL_URL || "http://localhost:5173/payment-failed";

    return res.redirect(isSuccess ? frontendSuccessUrl : frontendFailUrl);
  } catch (error) {
    console.error("VNPay return error:", error);
    res.status(500).send("Lỗi server.");
  }
};

const vnpayIpn = async (req, res) => {
  try {
    let vnp_Params = { ...req.query };
    const secureHash = vnp_Params.vnp_SecureHash;

    delete vnp_Params.vnp_SecureHash;
    delete vnp_Params.vnp_SecureHashType;

    const signData = buildVnpSignData(vnp_Params);

    const hashCheck = crypto
      .createHmac("sha512", vnp_HashSecret)
      .update(Buffer.from(signData, "utf-8"))
      .digest("hex");

    let rspCode, message;

    if (secureHash !== hashCheck) {
      rspCode = "97";
      message = "Fail checksum";
    } else {
      const isSuccess = vnp_Params.vnp_ResponseCode === "00";
      const order = await orderModel.findOne({ vnpayTxnRef: vnp_Params.vnp_TxnRef });

      if (!order) {
        rspCode = "01";
        message = "Order not found";
      } else {
        if (isSuccess) {
          const updated = await orderModel.findOneAndUpdate(
            { _id: order._id, payment: false },
            {
              $set: {
                payment: true,
                paymentStatus: PAYMENT_STATUS.PAID,
                vnpayTransactionNo: vnp_Params.vnp_TransactionNo,
              },
            },
            { new: true }
          );

          if (updated) {
            await decreaseVariantStockForOrder(order.items);
          }
        } else {
          await orderModel.updateOne(
            { _id: order._id },
            {
              $set: {
                payment: false,
                paymentStatus: PAYMENT_STATUS.FAILED,
                vnpayTransactionNo: vnp_Params.vnp_TransactionNo,
              },
            }
          );
        }

        rspCode = "00";
        message = "Confirm success";
      }
    }

    return res.type("text/plain").send(`RspCode=${rspCode}&Message=${message}`);
  } catch (error) {
    console.error("VNPay IPN error:", error);
    res.type("text/plain").send("RspCode=99&Message=System error");
  }
};

const restockOrder = async (req, res) => {
  try {
    const { orderId, action } = req.body;
    if (!orderId) {
      return res.json({ success: false, message: "Thiếu orderId" });
    }

    const nextStatus =
      action === "return" ? ORDER_STATUS.RETURNED : ORDER_STATUS.CANCELLED;

    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.json({ success: false, message: "Không tìm thấy đơn hàng" });
    }

    if (
      order.status === ORDER_STATUS.CANCELLED ||
      order.status === ORDER_STATUS.RETURNED
    ) {
      return res.json({ success: true, message: "Đơn đã được xử lý trước đó" });
    }

    const shouldRestock =
      order.paymentMethod === "COD" ||
      (order.paymentMethod === "VNPay" && order.payment === true);

    if (shouldRestock) {
      await increaseVariantStockForOrder(order.items);
    }

    order.status = nextStatus;
    await order.save();

    return res.json({ success: true, message: `Đã cập nhật: ${nextStatus}` });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
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
  restockOrder,
  ORDER_STATUS,
  PAYMENT_STATUS,
};
