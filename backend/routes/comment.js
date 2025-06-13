import express from "express";
import {
  addComment,
  getCommentsByProduct,
  getAverageRating,
} from "../controllers/commentController.js";
import authUser from "../middleware/auth.js";

const router = express.Router();

// Thêm comment (yêu cầu xác thực)
router.post("/add", authUser, addComment);

// Lấy danh sách comment của sản phẩm
router.get("/product/:productId", getCommentsByProduct);

// Lấy trung bình rating của sản phẩm
router.get("/product/:productId/average-rating", getAverageRating);

export default router;
