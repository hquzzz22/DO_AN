import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: Array, required: true }, // fallback images (optional when using colorImages)
  category: { type: String, required: true },
  subCategory: { type: String, required: true },

  // Legacy/simple lists (kept for filtering/UI)
  sizes: { type: Array, required: true },
  colors: { type: Array, default: [] },

  // Images by color, e.g. { "Black": [url1, url2], "White": [url3] }
  colorImages: { type: Object, default: {} },

  // Variant stock by (size + color)
  variants: {
    type: [
      {
        size: { type: String, required: true },
        color: { type: String, required: true },
        stock: { type: Number, required: true, default: 0 },
        sku: { type: String },
      },
    ],
    default: [],
  },

  bestseller: { type: Boolean },
  date: { type: Number, required: true },
});

const productModel =
  mongoose.models.product || mongoose.model("product", productSchema);

export default productModel;
