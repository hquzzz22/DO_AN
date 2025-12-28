import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Tạo context cho Shop
// Context này sẽ chứa các dữ liệu và hàm cần thiết cho toàn bộ ứng dụng
export const ShopContext = createContext();

const ShopContextProvider = (props) => {
  const currency = "VND";
  const delivery_fee = 30000; // Phí giao hàng
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [cartItems, setCartItems] = useState({});
  const [products, setProducts] = useState([]);
  const [token, setToken] = useState("");
  const navigate = useNavigate();

  const makeVariantKey = (size, color) => `${size}|${color}`;

  const getVariantStock = (itemId, size, color) => {
    const p = products.find((x) => x._id === itemId);
    const v = p?.variants?.find((vv) => vv.size === size && vv.color === color);
    return typeof v?.stock === "number" ? v.stock : null;
  };

  //Thêm vào giỏ (variant-aware)
  const addToCart = async (itemId, size, color) => {
    if (!size || !color) {
      toast.error("Vui lòng chọn size và màu");
      return;
    }

    const key = makeVariantKey(size, color);

    // Frontend-side stock guard (UX). Backend will still validate.
    const stock = getVariantStock(itemId, size, color);
    const currentQty = cartItems?.[itemId]?.[key] || 0;
    if (stock !== null && (stock <= 0 || currentQty + 1 > stock)) {
      toast.error("Biến thể này đã hết hàng");
      return;
    }

    // Optimistic update
    const prevCart = structuredClone(cartItems);
    const nextCart = structuredClone(cartItems);

    if (!nextCart[itemId]) nextCart[itemId] = {};
    nextCart[itemId][key] = (nextCart[itemId][key] || 0) + 1;
    setCartItems(nextCart);

    if (token) {
      try {
        const res = await axios.post(
          backendUrl + "/api/cart/add",
          { itemId, size, color },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!res.data?.success) {
          // Rollback if backend rejects (e.g. out-of-stock)
          setCartItems(prevCart);
          toast.error(res.data?.message || "Không thể thêm vào giỏ hàng");
        }
      } catch (error) {
        // Rollback on network/server error
        setCartItems(prevCart);
        console.error("Lỗi trong addToCart:", error.response?.data || error);
        toast.error(error.response?.data?.message || error.message);
      }
    }
  };

  //Lấy tổng số lượng trong giỏ:
  const getCartCount = () => {
    let totalCount = 0;
    for (const items in cartItems) {
      for (const item in cartItems[items]) {
        try {
          if (cartItems[items][item] > 0) {
            totalCount += cartItems[items][item];
          }
        } catch (error) {}
      }
    }
    return totalCount;
  };

  // Cập nhật số lượng sản phẩm trong giỏ:
  const updateQuantity = async (itemId, size, color, quantity) => {
    const key = makeVariantKey(size, color);

    // Frontend-side stock guard
    const stock = getVariantStock(itemId, size, color);
    if (stock !== null && Number(quantity) > stock) {
      toast.error("Số lượng vượt quá tồn kho");
      return;
    }

    const prevCart = structuredClone(cartItems);
    const nextCart = structuredClone(cartItems);

    if (!nextCart[itemId]) nextCart[itemId] = {};
    nextCart[itemId][key] = quantity;

    // clean up
    if (nextCart[itemId][key] === 0) delete nextCart[itemId][key];
    if (nextCart[itemId] && Object.keys(nextCart[itemId]).length === 0) delete nextCart[itemId];

    setCartItems(nextCart);

    if (token) {
      try {
        const res = await axios.post(
          backendUrl + "/api/cart/update",
          { itemId, size, color, quantity },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!res.data?.success) {
          setCartItems(prevCart);
          toast.error(res.data?.message || "Không thể cập nhật giỏ hàng");
        }
      } catch (error) {
        setCartItems(prevCart);
        console.error(
          "Lỗi trong updateQuantity:",
          error.response?.data || error
        );
        toast.error(error.response?.data?.message || error.message);
      }
    }
  };

  //Tính tổng tiền hàng:
  const getCartAmount = () => {
    let totalAmount = 0;
    for (const items in cartItems) {
      let itemInfo = products.find((product) => product._id === items);
      for (const item in cartItems[items]) {
        try {
          if (cartItems[items][item] > 0) {
            totalAmount += itemInfo.price * cartItems[items][item];
          }
        } catch (error) {}
      }
    }
    return totalAmount;
  };

  // Lấy danh sách sản phẩm từ backend:
  const getProductsData = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/product/list");
      if (response.data.success) {
        setProducts(response.data.products.reverse());
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(
        "Lỗi trong getProductsData:",
        error.response?.data || error
      );
      toast.error(error.response?.data?.message || error.message);
    }
  };

  //Lấy giỏ hàng người dùng (đã đăng nhập):
  const getUserCart = async (token) => {
    try {
      const response = await axios.post(
        backendUrl + "/api/cart/get",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setCartItems(response.data.cartData);
      }
    } catch (error) {
      console.error("Lỗi trong getUserCart:", error.response?.data || error);
      toast.error(error.response?.data?.message || error.message);
    }
  };

  //7. Bình luận sản phẩm:
  const addComment = async (productId, comment, rating) => {
    if (!token) {
      toast.error("Vui lòng đăng nhập để bình luận");
      navigate("/login");
      return;
    }

    try {
      const response = await axios.post(
        backendUrl + "/api/comment/add",
        { productId, comment, rating },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        toast.success("Bình luận đã được thêm");
        return response.data.data;
      } else {
        toast.error(response.data.message);
        return null;
      }
    } catch (error) {
      console.error("Lỗi trong addComment:", error.response?.data || error);
      toast.error(error.response?.data?.message || error.message);
      return null;
    }
  };

  // Lấy bình luận của sản phẩm:
  const getComments = async (productId) => {
    try {
      const response = await axios.get(
        backendUrl + `/api/comment/product/${productId}`
      );
      if (response.data.success) {
        return response.data.data;
      } else {
        toast.error(response.data.message);
        return [];
      }
    } catch (error) {
      console.error("Lỗi trong getComments:", error.response?.data || error);
      toast.error(error.response?.data?.message || error.message);
      return [];
    }
  };

  // Lấy đánh giá trung bình của sản phẩm:
  const getAverageRating = async (productId) => {
    try {
      const response = await axios.get(
        backendUrl + `/api/comment/product/${productId}/average-rating`
      );
      if (response.data.success) {
        return response.data.averageRating;
      } else {
        toast.error(response.data.message);
        return 0;
      }
    } catch (error) {
      console.error(
        "Lỗi trong getAverageRating:",
        error.response?.data || error
      );
      toast.error(error.response?.data?.message || error.message);
      return 0;
    }
  };

  useEffect(() => {
    getProductsData();
  }, []);

  useEffect(() => {
    if (!token && localStorage.getItem("token")) {
      setToken(localStorage.getItem("token"));
      getUserCart(localStorage.getItem("token"));
    }
    if (token) {
      getUserCart(token);
    }
  }, [token]);

  const value = {
    products,
    currency,
    delivery_fee,
    search,
    setSearch,
    showSearch,
    setShowSearch,
    cartItems,
    addToCart,
    setCartItems,
    getCartCount,
    updateQuantity,
    getCartAmount,
    navigate,
    backendUrl,
    setToken,
    token,
    addComment,
    getComments,
    getAverageRating,
  };

  return (
    <ShopContext.Provider value={value}>{props.children}</ShopContext.Provider>
  );
};

export default ShopContextProvider;
