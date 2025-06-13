import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import userModel from "../models/userModel.js";

const authUser = (req, res, next) => {
  try {
    // Lấy token từ header Authorization
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res
        .status(401)
        .json({
          success: false,
          message: "Không tìm thấy token, vui lòng đăng nhập lại",
        });
    }

    // Xác minh token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.id) {
      return res
        .status(401)
        .json({ success: false, message: "Token không chứa ID người dùng" });
    }

    // Kiểm tra ID hợp lệ
    if (!mongoose.Types.ObjectId.isValid(decoded.id)) {
      return res
        .status(401)
        .json({ success: false, message: "ID người dùng không hợp lệ" });
    }

    // Gắn userId vào req.body để sử dụng trong controller
    req.body.userId = decoded.id;
    next();
  } catch (error) {
    console.error("Lỗi trong authUser:", error.message, error.stack);
    return res
      .status(401)
      .json({
        success: false,
        message: "Token không hợp lệ",
        error: error.message,
      });
  }
};

export default authUser;
