import express from "express";
import {
  listProducts,
  addProduct,
  removeProduct,
  singleProduct,
  editProduct,
  restockProduct,
  searchProducts,
  addComment,
  getComments,
  removeComment,
} from "../controllers/productController.js";
import upload from "../middleware/multer.js";
import adminAuth from "../middleware/adminAuth.js";

const productRouter = express.Router();

productRouter.post(
  "/add",
  adminAuth,
  upload.any(),
  addProduct
);
productRouter.post("/remove", adminAuth, removeProduct);
productRouter.post("/single", singleProduct);
productRouter.get("/list", listProducts);
productRouter.post(
  "/edit",
  adminAuth,
  upload.any(),
  editProduct
);

// Admin: restock (increment stock for variants)
productRouter.post("/restock", adminAuth, restockProduct);

productRouter.post("/search", searchProducts);
productRouter.post("/addComment", addComment);
productRouter.post("/getComments", getComments);
productRouter.post("/removeComment", adminAuth, removeComment);

export default productRouter;
