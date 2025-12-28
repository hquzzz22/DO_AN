import React, { useContext, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import { assets } from "../assets/assets";
import RelatedProducts from "../components/RelatedProducts";
import { toast } from "react-toastify";

const Product = () => {
  const { productId } = useParams();
  const {
    products,
    currency,
    addToCart,
    addComment,
    getComments,
    getAverageRating,
    token,
  } = useContext(ShopContext);

  const [productData, setProductData] = useState(false);
  const [image, setImage] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [activeTab, setActiveTab] = useState("description");
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(1);
  const [comments, setComments] = useState([]);
  const [averageRating, setAverageRating] = useState(0);

  const variants = productData?.variants || [];

  const getStock = (s, c) => {
    if (!s || !c) return null;
    const v = variants.find((vv) => vv.size === s && vv.color === c);
    return typeof v?.stock === "number" ? v.stock : null;
  };

  const selectedStock = useMemo(() => getStock(size, color), [size, color, productData]);

  const availableColors = useMemo(() => {
    if (!productData) return [];
    return productData.colors?.length
      ? productData.colors
      : Object.keys(productData.colorImages || {});
  }, [productData]);

  const isSizeDisabled = (s) => {
    if (!color) return false;
    const stock = getStock(s, color);
    return stock !== null && stock <= 0;
  };

  const isColorDisabled = (c) => {
    if (!size) return false;
    const stock = getStock(size, c);
    return stock !== null && stock <= 0;
  };

  const fetchProductData = async () => {
    products.forEach((item) => {
      if (item._id === productId) {
        setProductData(item);

        const colorImgs = item.colorImages && Object.keys(item.colorImages).length ? item.colorImages : null;
        if (colorImgs) {
          const firstColor = Object.keys(colorImgs)[0];
          const firstImg = colorImgs[firstColor]?.[0];
          setColor(firstColor);
          setImage(firstImg || item.image?.[0] || "");
        } else {
          setImage(item.image?.[0] || "");
        }
      }
    });
  };

  const fetchComments = async () => {
    const commentsData = await getComments(productId);
    setComments(commentsData);
  };

  const fetchAverageRating = async () => {
    const avgRating = await getAverageRating(productId);
    setAverageRating(avgRating);
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!comment || !rating) {
      toast.error("Vui lòng nhập bình luận và chọn đánh giá");
      return;
    }
    const newComment = await addComment(productId, comment, rating);
    if (newComment) {
      setComments([newComment, ...comments]);
      setComment("");
      setRating(1);
      fetchAverageRating();
    }
  };

  const handleAddToCart = () => {
    if (!size || !color) {
      toast.error("Vui lòng chọn size và màu");
      return;
    }

    const stock = getStock(size, color);
    if (stock !== null && stock <= 0) {
      toast.error("Biến thể này đã hết hàng");
      return;
    }

    addToCart(productData._id, size, color);
  };

  useEffect(() => {
    fetchProductData();
    fetchComments();
    fetchAverageRating();
  }, [productId, products]);

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <img
          key={i}
          src={i <= rating ? assets.star_icon : assets.star_dull_icon}
          alt=""
          className="w-3.5"
        />
      );
    }
    return stars;
  };

  return productData ? (
    <div className="border-t-2 pt-10 transition-opacity ease-in duration-500 opacity-100">
      <div className="flex gap-12 sm:gap-12 flex-col sm:flex-row">
        {/* Images */}
        <div className="flex-1 flex flex-col-reverse gap-3 sm:flex-row">
          <div className="flex sm:flex-col overflow-x-auto sm:overflow-y-scroll justify-between sm:justify-normal sm:w-[18.7%] w-full">
            {(productData.colorImages?.[color]?.length
              ? productData.colorImages[color]
              : productData.image
            )?.map((item, index) => (
              <img
                onClick={() => setImage(item)}
                src={item}
                key={index}
                className="w-[24%] sm:w-full sm:mb-3 flex-shrink-0 cursor-pointer"
                alt=""
              />
            ))}
          </div>
          <div className="w-full sm:w-[80%]">
            <img className="w-full h-auto" src={image} alt="" />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1">
          <h1 className="font-medium text-2xl mt-2">{productData.name}</h1>
          <div className="flex items-center gap-1 mt-2">
            {renderStars(Math.round(averageRating))}
            <p className="pl-2">({comments.length})</p>
          </div>
          <p className="mt-5 text-3xl font-medium">
            {currency}
            {productData.price}
          </p>
          <p className="mt-5 text-gray-500 md:w-4/5">{productData.description}</p>

          {/* Color */}
          <div className="flex flex-col gap-2 my-6">
            <p>Chọn màu</p>
            <div className="flex flex-wrap gap-2">
              {availableColors.map((c, index) => {
                const disabled = isColorDisabled(c);
                return (
                  <button
                    type="button"
                    onClick={() => {
                      if (disabled) return;
                      setColor(c);
                      const imgs = productData.colorImages?.[c];
                      if (imgs?.length) setImage(imgs[0]);
                    }}
                    className={`border py-2 px-4 bg-gray-100 text-sm ${
                      c === color ? "border-orange-500" : ""
                    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                    key={index}
                    disabled={disabled}
                    title={disabled ? "Hết hàng" : ""}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size */}
          <div className="flex flex-col gap-2 my-6">
            <p>Chọn size</p>
            <div className="flex flex-wrap gap-2">
              {productData.sizes.map((s, index) => {
                const disabled = isSizeDisabled(s);
                return (
                  <button
                    type="button"
                    onClick={() => {
                      if (disabled) return;
                      setSize(s);
                    }}
                    className={`border py-2 px-4 bg-gray-100 ${
                      s === size ? "border-orange-500" : ""
                    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                    key={index}
                    disabled={disabled}
                    title={disabled ? "Hết hàng" : ""}
                  >
                    {s}
                  </button>
                );
              })}
            </div>

            {size && color && selectedStock !== null && (
              <p className={`text-sm ${selectedStock > 0 ? "text-green-600" : "text-red-600"}`}>
                Tồn kho: {selectedStock}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            className="bg-black text-white px-8 py-3 text-sm active:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={selectedStock !== null && selectedStock <= 0}
          >
            ADD TO CART
          </button>

          <hr className="mt-8 sm:w-4/5" />
          <div className="text-sm text-gray-500 mt-5 flex flex-col gap-1">
            <p>100% Original product.</p>
            <p>Cash on delivery is available on this product.</p>
            <p>Easy return and exchange policy within 7 days.</p>
          </div>
        </div>
      </div>

      {/* Description & Review */}
      <div className="mt-20">
        <div className="flex">
          <b
            onClick={() => setActiveTab("description")}
            className={`border px-5 py-3 text-sm cursor-pointer ${
              activeTab === "description" ? "bg-gray-200" : ""
            }`}
          >
            Description
          </b>
          <p
            onClick={() => setActiveTab("reviews")}
            className={`border px-5 py-3 text-sm cursor-pointer ${
              activeTab === "reviews" ? "bg-gray-200" : ""
            }`}
          >
            Reviews ({comments.length})
          </p>
        </div>
        <div className="flex flex-col gap-4 border px-6 py-6 text-sm text-gray-500">
          {activeTab === "description" ? (
            <p>{productData.description}</p>
          ) : (
            <div>
              {token ? (
                <form onSubmit={handleCommentSubmit} className="mb-6">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Viết bình luận của bạn..."
                    className="w-full p-2 border rounded"
                    rows="4"
                    required
                  />
                  <div className="flex items-center gap-4 mt-2">
                    <select
                      value={rating}
                      onChange={(e) => setRating(Number(e.target.value))}
                      className="border p-2 rounded"
                      required
                    >
                      <option value={1}>1 sao</option>
                      <option value={2}>2 sao</option>
                      <option value={3}>3 sao</option>
                      <option value={4}>4 sao</option>
                      <option value={5}>5 sao</option>
                    </select>
                    <button
                      type="submit"
                      className="bg-black text-white px-4 py-2 text-sm active:bg-gray-700"
                    >
                      Gửi bình luận
                    </button>
                  </div>
                </form>
              ) : (
                <p className="mb-6">
                  Vui lòng{" "}
                  <a href="/login" className="text-blue-500">
                    đăng nhập
                  </a>{" "}
                  để viết bình luận.
                </p>
              )}

              {comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment._id} className="mb-4">
                    <div className="flex items-center gap-2">
                      <b>
                        <p className="font-medium">{comment.userId.name}:</p>
                      </b>
                      <div className="flex">{renderStars(comment.rating)}</div>
                    </div>
                    <p>{comment.comment}</p>
                    <p className="text-xs">
                      {new Date(comment.date).toLocaleDateString()}
                    </p>
                  </div>
                ))
              ) : (
                <p>Chưa có bình luận nào.</p>
              )}
            </div>
          )}
        </div>
      </div>

      <RelatedProducts category={productData.category} subCategory={productData.subCategory} />
    </div>
  ) : (
    <div className="opacity-0"></div>
  );
};

export default Product;
