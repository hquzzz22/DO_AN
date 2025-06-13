import commentModel from "../models/commentModel.js";
import productModel from "../models/productModel.js";
import userModel from "../models/userModel.js";
import mongoose from "mongoose";

export const addComment = async (req, res) => {
  try {
    const { productId, comment, rating, userId } = req.body;

    if (!productId || !userId || !comment || !rating) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu thông tin bắt buộc" });
    }

    if (
      !mongoose.Types.ObjectId.isValid(productId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({
        success: false,
        message: "productId hoặc userId không hợp lệ",
      });
    }

    const product = await productModel.findById(productId);
    const user = await userModel.findById(userId);
    if (!product || !user) {
      return res.status(404).json({
        success: false,
        message: "Sản phẩm hoặc người dùng không tồn tại",
      });
    }

    if (rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ success: false, message: "Rating phải từ 1 đến 5" });
    }

    const newComment = new commentModel({
      productId,
      userId,
      comment,
      rating,
      date: Date.now(),
    });

    await newComment.save();

    // Populate userId để trả về tên người dùng
    const populatedComment = await commentModel
      .findById(newComment._id)
      .populate("userId", "name");

    res.status(201).json({
      success: true,
      message: "Comment đã được thêm",
      data: populatedComment,
    });
  } catch (error) {
    console.error("Lỗi trong addComment:", error.message, error.stack);
    res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: error.message });
  }
};

export const getCommentsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res
        .status(400)
        .json({ success: false, message: "productId không hợp lệ" });
    }

    const comments = await commentModel
      .find({ productId })
      .populate("userId", "name") // Populate trường name của userId
      .sort({ date: -1 });

    res.status(200).json({ success: true, data: comments });
  } catch (error) {
    console.error(
      "Lỗi trong getCommentsByProduct:",
      error.message,
      error.stack
    );
    res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: error.message });
  }
};

export const getAverageRating = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res
        .status(400)
        .json({ success: false, message: "productId không hợp lệ" });
    }

    const comments = await commentModel.find({ productId });

    if (comments.length === 0) {
      return res.status(200).json({ success: true, averageRating: 0 });
    }

    const averageRating =
      comments.reduce((sum, c) => sum + c.rating, 0) / comments.length;
    res.status(200).json({ success: true, averageRating });
  } catch (error) {
    console.error("Lỗi trong getAverageRating:", error.message, error.stack);
    res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: error.message });
  }
};
