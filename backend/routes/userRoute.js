import express from "express";
import {
  loginUser,
  registerUser,
  adminLogin,
  forgotPassword,
  resetPassword,
  authenticateAdmin,
  addUser,
  updateUser,
  deleteUser,
  listUsers,
  searchUsers,
  updateProfile,
  getUserProfile,
} from "../controllers/userController.js";
import authUser from "../middleware/auth.js";

const userRouter = express.Router();

// User routes
userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/forgot-password", forgotPassword);
userRouter.post("/reset-password", resetPassword);
userRouter.post("/update-profile", authUser, updateProfile);
userRouter.get("/profile", authUser, getUserProfile);

// Admin routes
userRouter.post("/admin", adminLogin);
userRouter.post("/add-user", authenticateAdmin, addUser);
userRouter.post("/update-user", authenticateAdmin, updateUser);
userRouter.post("/delete-user", authenticateAdmin, deleteUser);
userRouter.get("/list", authenticateAdmin, listUsers);
userRouter.post("/search", authenticateAdmin, searchUsers);

export default userRouter;
