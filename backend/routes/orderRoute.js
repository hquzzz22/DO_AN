import express from "express";
import {
  placeOrder,
  //   placeOrderStripe,
  //   placeOrderRazorpay,
  allOrders,
  userOrders,
  updateStatus,
  searchOrders,
  placeOrderVNPay,
  vnpayReturn,
} from "../controllers/orderController.js";
import adminAuth from "../middleware/adminAuth.js";
import authUser from "../middleware/auth.js";

const orderRouter = express.Router();

// Admin Features
orderRouter.post("/list", adminAuth, allOrders);
orderRouter.post("/status", adminAuth, updateStatus);
orderRouter.post("/search", adminAuth, searchOrders);

// Payment Features
orderRouter.post("/place", authUser, placeOrder);
// orderRouter.post('/stripe',authUser,placeOrderStripe)
// orderRouter.post('/razorpay',authUser,placeOrderRazorpay)

orderRouter.post("/vnpay", authUser, placeOrderVNPay);
orderRouter.get("/vnpay-return", vnpayReturn);

// User Feature
orderRouter.post("/userorders", authUser, userOrders);

// verify payment
// orderRouter.post('/verifyStripe',authUser, verifyStripe)
// orderRouter.post('/verifyRazorpay',authUser, verifyRazorpay)

export default orderRouter;
