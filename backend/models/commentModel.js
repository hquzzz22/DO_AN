import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "product",
    required: true,
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  comment: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, required: true }, // Đánh giá từ 1-5
  date: { type: Number, required: true, default: Date.now },
});

const commentModel =
  mongoose.models.comment || mongoose.model("comment", commentSchema);

export default commentModel;
