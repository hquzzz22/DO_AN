import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export const ShopContext = createContext();

const ShopContextProvider = (props) => {
  const currency = "VND";
  const delivery_fee = 30000;
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [cartItems, setCartItems] = useState({});
  const [products, setProducts] = useState([]);
  const [token, setToken] = useState("");
  const navigate = useNavigate();

  const makeVariantKey = (size, color) => `${size}|${color}`;

  const getVariant = (itemId, size, color) => {
    const p = products.find((x) => x._id === itemId);
    return p?.variants?.find((vv) => vv.size === size && vv.color === color) || null;
  };

  const getVariantStock = (itemId, size, color) => {
    const v = getVariant(itemId, size, color);
    return typeof v?.stock === "number" ? v.stock : null;
  };

  const getVariantPrice = (itemId, size, color) => {
    const p = products.find((x) => x._id === itemId);
    const v = getVariant(itemId, size, color);
    // Fallback: if variant price is missing/0, use product base price
    const vp = typeof v?.price === "number" ? v.price : null;
    if (vp !== null && vp > 0) return vp;
    const base = typeof p?.price === "number" ? p.price : null;
    return base;
  };

  const addToCart = async (itemId, size, color) => {
    if (!size || !color) {
      toast.error("Vui lòng chọn size và màu");
      return;
    }

    const key = makeVariantKey(size, color);

    const price = getVariantPrice(itemId, size, color);
    if (price === null || price <= 0) {
      toast.error("Sản phẩm/biến thể này chưa có giá bán");
      return;
    }

    const stock = getVariantStock(itemId, size, color);
    const currentQty = cartItems?.[itemId]?.[key] || 0;
    if (stock !== null && (stock <= 0 || currentQty + 1 > stock)) {
      toast.error("Biến thể này đã hết hàng");
      return;
    }

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
          setCartItems(prevCart);
          toast.error(res.data?.message || "Không thể thêm vào giỏ hàng");
        }
      } catch (error) {
        setCartItems(prevCart);
        console.error("Lỗi trong addToCart:", error.response?.data || error);
        toast.error(error.response?.data?.message || error.message);
      }
    }
  };

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

  const updateQuantity = async (itemId, size, color, quantity) => {
    const key = makeVariantKey(size, color);

    const price = getVariantPrice(itemId, size, color);
    if (price === null || price <= 0) {
      toast.error("Sản phẩm/biến thể này chưa có giá bán");
      return;
    }

    const stock = getVariantStock(itemId, size, color);
    if (stock !== null && Number(quantity) > stock) {
      toast.error("Số lượng vượt quá tồn kho");
      return;
    }

    const prevCart = structuredClone(cartItems);
    const nextCart = structuredClone(cartItems);

    if (!nextCart[itemId]) nextCart[itemId] = {};
    nextCart[itemId][key] = quantity;

    if (nextCart[itemId][key] === 0) delete nextCart[itemId][key];
    if (nextCart[itemId] && Object.keys(nextCart[itemId]).length === 0)
      delete nextCart[itemId];

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
        console.error("Lỗi trong updateQuantity:", error.response?.data || error);
        toast.error(error.response?.data?.message || error.message);
      }
    }
  };

  // Compute cart total using variant price
  const getCartAmount = () => {
    let totalAmount = 0;

    for (const productId in cartItems) {
      for (const key in cartItems[productId]) {
        const qty = cartItems[productId][key];
        if (!qty || qty <= 0) continue;

        const [size, color] = String(key).split("|");
        const price = getVariantPrice(productId, size, color);
        if (price === null) continue;

        totalAmount += price * qty;
      }
    }

    return totalAmount;
  };

  const getProductsData = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/product/list");
      if (response.data.success) {
        setProducts(response.data.products.reverse());
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Lỗi trong getProductsData:", error.response?.data || error);
      toast.error(error.response?.data?.message || error.message);
    }
  };

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
      console.error("Lỗi trong getAverageRating:", error.response?.data || error);
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

  return <ShopContext.Provider value={value}>{props.children}</ShopContext.Provider>;
};

export default ShopContextProvider;
