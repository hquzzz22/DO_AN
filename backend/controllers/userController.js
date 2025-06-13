import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import nodemailer from "nodemailer";
import crypto from "crypto";

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

// Cấu hình Nodemailer để gửi email
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Middleware xác thực admin
const authenticateAdmin = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.json({ success: false, message: "Không tìm thấy token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded === process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD) {
      next();
    } else {
      res.json({ success: false, message: "Không có quyền admin" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Token không hợp lệ" });
  }
};

// Đăng nhập người dùng
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "Người dùng không tồn tại" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      const token = createToken(user._id);
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Thông tin đăng nhập không đúng" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Đăng ký người dùng
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Kiểm tra người dùng đã tồn tại
    const exists = await userModel.findOne({ email });
    if (exists) {
      return res.json({ success: false, message: "Người dùng đã tồn tại" });
    }

    // Kiểm tra định dạng email và độ mạnh mật khẩu
    if (!validator.isEmail(email)) {
      return res.json({
        success: false,
        message: "Vui lòng nhập email hợp lệ",
      });
    }
    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Vui lòng nhập mật khẩu mạnh (tối thiểu 8 ký tự)",
      });
    }

    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new userModel({
      name,
      email,
      password: hashedPassword,
    });

    const user = await newUser.save();
    const token = createToken(user._id);

    res.json({ success: true, token });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Đăng nhập admin
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = jwt.sign(email + password, process.env.JWT_SECRET);
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Thông tin đăng nhập không đúng" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Quên mật khẩu
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Kiểm tra email hợp lệ
    if (!validator.isEmail(email)) {
      return res.json({
        success: false,
        message: "Vui lòng nhập email hợp lệ",
      });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "Người dùng không tồn tại" });
    }

    // Tạo token đặt lại mật khẩu
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; // Hết hạn sau 1 giờ

    // Lưu token và thời gian hết hạn
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    // Tạo link đặt lại mật khẩu
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // Gửi email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Yêu cầu đặt lại mật khẩu",
      text: `Bạn đã yêu cầu đặt lại mật khẩu. Nhấp vào link để đặt lại: ${resetUrl}\n\nLink này sẽ hết hạn sau 1 giờ.`,
    };

    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: "Link đặt lại mật khẩu đã được gửi đến email của bạn",
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Đặt lại mật khẩu
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Kiểm tra độ mạnh mật khẩu
    if (newPassword.length < 8) {
      return res.json({
        success: false,
        message: "Vui lòng nhập mật khẩu mạnh (tối thiểu 8 ký tự)",
      });
    }

    // Tìm người dùng bằng token và kiểm tra thời gian hết hạn
    const user = await userModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.json({
        success: false,
        message: "Token không hợp lệ hoặc đã hết hạn",
      });
    }

    // Mã hóa mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Cập nhật mật khẩu và xóa token
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ success: true, message: "Đặt lại mật khẩu thành công" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Thêm người dùng mới (chỉ admin)
const addUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Kiểm tra người dùng đã tồn tại
    const exists = await userModel.findOne({ email });
    if (exists) {
      return res.json({ success: false, message: "Người dùng đã tồn tại" });
    }

    // Kiểm tra định dạng email và độ mạnh mật khẩu
    if (!validator.isEmail(email)) {
      return res.json({
        success: false,
        message: "Vui lòng nhập email hợp lệ",
      });
    }
    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Vui lòng nhập mật khẩu mạnh (tối thiểu 8 ký tự)",
      });
    }

    // Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new userModel({
      name,
      email,
      password: hashedPassword,
    });

    const user = await newUser.save();
    res.json({
      success: true,
      message: "Thêm người dùng thành công",
      userId: user._id,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Sửa thông tin người dùng (chỉ admin)
const updateUser = async (req, res) => {
  try {
    const { userId, name, email, password } = req.body;

    // Kiểm tra người dùng tồn tại
    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "Người dùng không tồn tại" });
    }

    // Kiểm tra định dạng email nếu có cập nhật
    if (email && !validator.isEmail(email)) {
      return res.json({
        success: false,
        message: "Vui lòng nhập email hợp lệ",
      });
    }

    // Kiểm tra độ mạnh mật khẩu nếu có cập nhật
    if (password && password.length < 8) {
      return res.json({
        success: false,
        message: "Vui lòng nhập mật khẩu mạnh (tối thiểu 8 ký tự)",
      });
    }

    // Cập nhật thông tin
    if (name) user.name = name;
    if (email) user.email = email;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();
    res.json({ success: true, message: "Cập nhật người dùng thành công" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Chỉnh sửa thông tin cá nhân (người dùng)
const updateProfile = async (req, res) => {
  try {
    const { userId, name, email, password } = req.body;

    // Kiểm tra người dùng tồn tại
    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "Người dùng không tồn tại" });
    }

    // Kiểm tra định dạng email nếu có cập nhật
    if (email && !validator.isEmail(email)) {
      return res.json({
        success: false,
        message: "Vui lòng nhập email hợp lệ",
      });
    }

    // Kiểm tra email có đang được sử dụng bởi người dùng khác
    if (email && email !== user.email) {
      const emailExists = await userModel.findOne({ email });
      if (emailExists) {
        return res.json({ success: false, message: "Email đã được sử dụng" });
      }
    }

    // Kiểm tra độ mạnh mật khẩu nếu có cập nhật
    if (password && password.length < 8) {
      return res.json({
        success: false,
        message: "Vui lòng nhập mật khẩu mạnh (tối thiểu 8 ký tự)",
      });
    }

    // Cập nhật thông tin
    if (name) user.name = name;
    if (email) user.email = email;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();
    res.json({
      success: true,
      message: "Cập nhật thông tin cá nhân thành công",
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Lấy thông tin cá nhân (người dùng)
const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.body;
    console.log("Fetching profile for userId:", userId); // Debugging log
    const user = await userModel.findById(userId, { name: 1, email: 1 });
    if (!user) {
      return res.json({ success: false, message: "Người dùng không tồn tại" });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.log("Error in getUserProfile:", error);
    res.json({ success: false, message: error.message });
  }
};

// Xóa người dùng (chỉ admin)
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.body;

    // Kiểm tra người dùng tồn tại
    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "Người dùng không tồn tại" });
    }

    await userModel.findByIdAndDelete(userId);
    res.json({ success: true, message: "Xóa người dùng thành công" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Lấy danh sách người dùng (chỉ admin)
const listUsers = async (req, res) => {
  try {
    const users = await userModel.find({}, { name: 1, email: 1, _id: 1 });
    res.json({ success: true, users });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Tìm kiếm người dùng (chỉ admin)
const searchUsers = async (req, res) => {
  try {
    const { name, email } = req.body;

    // Tạo object query để tìm kiếm
    let query = {};

    // Nếu có name, tìm kiếm gần đúng (không phân biệt hoa thường)
    if (name) {
      query.name = { $regex: name, $options: "i" };
    }

    // Nếu có email, tìm kiếm gần đúng (không phân biệt hoa thường)
    if (email) {
      query.email = { $regex: email, $options: "i" };
    }

    // Tìm kiếm người dùng
    const users = await userModel.find(query, { name: 1, email: 1, _id: 1 });

    if (users.length === 0) {
      return res.json({ success: true, users: [], message: "No users found" });
    }

    res.json({ success: true, users });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export {
  loginUser,
  registerUser,
  adminLogin,
  forgotPassword,
  resetPassword,
  authenticateAdmin,
  addUser,
  updateUser,
  updateProfile,
  getUserProfile,
  deleteUser,
  listUsers,
  searchUsers,
};
