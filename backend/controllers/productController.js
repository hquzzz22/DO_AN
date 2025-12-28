import { v2 as cloudinary } from "cloudinary";
import productModel from "../models/productModel.js";
import commentModel from "../models/commentModel.js";

// Hàm thêm sản phẩm
const addProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      subCategory,
      sizes,
      bestseller,
    } = req.body;

    // Support both legacy images (image1..image4) and new color-based images (color_<ColorName>_<index>)
    const files = Array.isArray(req.files) ? req.files : [];

    const legacyNames = new Set(["image1", "image2", "image3", "image4"]);
    const legacyFiles = files.filter((f) => legacyNames.has(f.fieldname));

    let imagesUrl = await Promise.all(
      legacyFiles.map(async (file) => {
        let result = await cloudinary.uploader.upload(file.path, {
          resource_type: "image",
        });
        return result.secure_url;
      })
    );

    // Build colorImages from uploaded files
    // Fieldname format: color_<ColorName>_<index>
    const colorImages = {};
    const colorFiles = files.filter((f) => f.fieldname.startsWith("color_"));

    for (const file of colorFiles) {
      const parts = file.fieldname.split("_");
      // e.g. ["color", "Black", "0"]
      const color = parts[1];
      if (!color) continue;

      let result = await cloudinary.uploader.upload(file.path, {
        resource_type: "image",
      });

      if (!colorImages[color]) colorImages[color] = [];
      colorImages[color].push(result.secure_url);
    }

    const parsedSizes = sizes ? JSON.parse(sizes) : [];
    const parsedColors = req.body.colors ? JSON.parse(req.body.colors) : [];
    const parsedVariants = req.body.variants ? JSON.parse(req.body.variants) : [];

    const productData = {
      name,
      description,
      category,
      price: Number(price),
      subCategory,
      bestseller: bestseller === "true" ? true : false,
      sizes: parsedSizes,
      colors: parsedColors,
      variants: parsedVariants,
      colorImages,
      image: imagesUrl.length ? imagesUrl : [],
      date: Date.now(),
    };

    console.log(productData);

    const product = new productModel(productData);
    await product.save();

    res.json({ success: true, message: "Sản phẩm đã được thêm" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Hàm liệt kê sản phẩm
const listProducts = async (req, res) => {
  try {
    const products = await productModel.find({});
    res.json({ success: true, products });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Hàm xóa sản phẩm
const removeProduct = async (req, res) => {
  try {
    await productModel.findByIdAndDelete(req.body.id);
    res.json({ success: true, message: "Sản phẩm đã được xóa" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Hàm lấy thông tin một sản phẩm
const singleProduct = async (req, res) => {
  try {
    const { productId } = req.body;
    const product = await productModel.findById(productId);
    res.json({ success: true, product });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Hàm sửa sản phẩm
const editProduct = async (req, res) => {
  try {
    const {
      productId,
      name,
      description,
      price,
      category,
      subCategory,
      sizes,
      bestseller,
    } = req.body;

    // Chuẩn bị dữ liệu cập nhật
    const updateData = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (price) updateData.price = Number(price);
    if (category) updateData.category = category;
    if (subCategory) updateData.subCategory = subCategory;
    if (sizes) updateData.sizes = JSON.parse(sizes);
    if (req.body.colors) updateData.colors = JSON.parse(req.body.colors);
    if (req.body.variants) updateData.variants = JSON.parse(req.body.variants);
    if (bestseller)
      updateData.bestseller = bestseller === "true" ? true : false;

    // Support both legacy images (image1..image4) and new color-based images (color_<ColorName>_<index>)
    const files = Array.isArray(req.files) ? req.files : [];

    const legacyNames = new Set(["image1", "image2", "image3", "image4"]);
    const legacyFiles = files.filter((f) => legacyNames.has(f.fieldname));

    if (legacyFiles.length > 0) {
      let imagesUrl = await Promise.all(
        legacyFiles.map(async (file) => {
          let result = await cloudinary.uploader.upload(file.path, {
            resource_type: "image",
          });
          return result.secure_url;
        })
      );
      updateData.image = imagesUrl;
    }

    // Build colorImages from uploaded files
    const colorImages = {};
    const colorFiles = files.filter((f) => f.fieldname.startsWith("color_"));

    for (const file of colorFiles) {
      const parts = file.fieldname.split("_");
      const color = parts[1];
      if (!color) continue;

      let result = await cloudinary.uploader.upload(file.path, {
        resource_type: "image",
      });

      if (!colorImages[color]) colorImages[color] = [];
      colorImages[color].push(result.secure_url);
    }

    if (Object.keys(colorImages).length) {
      // Merge with existing colorImages
      const existing = (await productModel.findById(productId))?.colorImages || {};
      updateData.colorImages = { ...existing, ...colorImages };
    }

    // Cập nhật sản phẩm trong cơ sở dữ liệu
    const updatedProduct = await productModel.findByIdAndUpdate(
      productId,
      { $set: updateData },
      { new: true }
    );

    if (!updatedProduct) {
      return res.json({ success: false, message: "Không tìm thấy sản phẩm" });
    }

    res.json({
      success: true,
      message: "Sản phẩm đã được cập nhật",
      product: updatedProduct,
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Hàm tìm kiếm sản phẩm
const searchProducts = async (req, res) => {
  try {
    const { name, category } = req.body;
    const query = {};

    if (name) {
      query.name = { $regex: name, $options: "i" }; // Tìm kiếm không phân biệt hoa thường
    }
    if (category) {
      query.category = { $regex: category, $options: "i" };
    }

    const products = await productModel.find(query);
    res.json({ success: true, products });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Hàm thêm bình luận
const addComment = async (req, res) => {
  try {
    const { productId, userId, comment, rating } = req.body;

    if (!comment || !rating || rating < 1 || rating > 5) {
      return res.json({
        success: false,
        message: "Dữ liệu bình luận không hợp lệ",
      });
    }

    const newComment = new commentModel({
      productId,
      userId,
      comment,
      rating: Number(rating),
    });

    await newComment.save();

    res.json({ success: true, message: "Bình luận đã được thêm" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Hàm lấy danh sách bình luận của một sản phẩm
const getComments = async (req, res) => {
  try {
    const { productId } = req.body;
    const comments = await commentModel
      .find({ productId })
      .populate("userId", "name");
    res.json({ success: true, comments });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Hàm xóa bình luận
const removeComment = async (req, res) => {
  try {
    const { commentId } = req.body;
    await commentModel.findByIdAndDelete(commentId);
    res.json({ success: true, message: "Bình luận đã được xóa" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export {
  listProducts,
  addProduct,
  removeProduct,
  singleProduct,
  editProduct,
  searchProducts,
  addComment,
  getComments,
  removeComment,
};
