import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";

const makeVariantKey = (size, color) => `${size}|${color}`;

const findVariant = (product, size, color) => {
  if (!product?.variants?.length) return null;
  return product.variants.find((v) => v.size === size && v.color === color);
};

// add products to user cart (variant-aware: size + color)
const addToCart = async (req, res) => {
  try {
    const { userId, itemId, size, color } = req.body;

    if (!itemId || !size || !color) {
      return res.json({
        success: false,
        message: "Thiếu thông tin sản phẩm (itemId/size/color)",
      });
    }

    const product = await productModel.findById(itemId);
    if (!product) {
      return res.json({ success: false, message: "Sản phẩm không tồn tại" });
    }

    const variant = findVariant(product, size, color);
    if (!variant) {
      return res.json({
        success: false,
        message: "Biến thể (size/màu) không tồn tại",
      });
    }

    const userData = await userModel.findById(userId);
    let cartData = userData.cartData || {};

    const key = makeVariantKey(size, color);

    const currentQty = cartData?.[itemId]?.[key] || 0;
    if (variant.stock <= 0 || currentQty + 1 > variant.stock) {
      return res.json({
        success: false,
        message: "Sản phẩm (biến thể) không đủ tồn kho",
      });
    }

    if (!cartData[itemId]) cartData[itemId] = {};
    cartData[itemId][key] = currentQty + 1;

    await userModel.findByIdAndUpdate(userId, { cartData });

    res.json({ success: true, message: "Added To Cart" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// update user cart (variant-aware)
const updateCart = async (req, res) => {
  try {
    const { userId, itemId, size, color, quantity } = req.body;

    if (!itemId || !size || !color) {
      return res.json({
        success: false,
        message: "Thiếu thông tin sản phẩm (itemId/size/color)",
      });
    }

    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty < 0) {
      return res.json({ success: false, message: "Số lượng không hợp lệ" });
    }

    const product = await productModel.findById(itemId);
    if (!product) {
      return res.json({ success: false, message: "Sản phẩm không tồn tại" });
    }

    const variant = findVariant(product, size, color);
    if (!variant) {
      return res.json({
        success: false,
        message: "Biến thể (size/màu) không tồn tại",
      });
    }

    if (qty > variant.stock) {
      return res.json({
        success: false,
        message: "Sản phẩm (biến thể) không đủ tồn kho",
      });
    }

    const userData = await userModel.findById(userId);
    let cartData = userData.cartData || {};

    const key = makeVariantKey(size, color);

    if (!cartData[itemId]) cartData[itemId] = {};
    cartData[itemId][key] = qty;

    // Clean up zeros
    if (cartData[itemId][key] === 0) delete cartData[itemId][key];
    if (Object.keys(cartData[itemId]).length === 0) delete cartData[itemId];

    await userModel.findByIdAndUpdate(userId, { cartData });
    res.json({ success: true, message: "Cart Updated" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// get user cart data
const getUserCart = async (req, res) => {
  try {
    const { userId } = req.body;

    const userData = await userModel.findById(userId);
    let cartData = await userData.cartData;

    res.json({ success: true, cartData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export { addToCart, updateCart, getUserCart };
