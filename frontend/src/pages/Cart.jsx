import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import { assets } from "../assets/assets";
import CartTotal from "../components/CartTotal";

const Cart = () => {
  // Sử dụng context để lấy dữ liệu và hàm từ ShopContext
  const { products, currency, cartItems, updateQuantity, navigate } =
    useContext(ShopContext);

  // State để lưu trữ dữ liệu giỏ hàng đã được xử lý
  // Mảng này sẽ chứa các sản phẩm trong giỏ hàng với thông tin chi tiết
  const [cartData, setCartData] = useState([]);

  // Sử dụng useEffect để cập nhật cartData mỗi khi cartItems hoặc products thay đổi
  // Lặp qua cartItems và tìm sản phẩm tương ứng trong products
  //   useEffect chạy khi cartItems hoặc products thay đổi.
  // Kiểm tra xem products có dữ liệu không (products.length > 0).
  // Nếu có, tạo một mảng tempData rỗng.
  // Lặp qua các sản phẩm trong cartItems (dựa trên ID sản phẩm).
  // Với mỗi sản phẩm, lặp qua các kích cỡ (S, M, L, ...).
  // Nếu số lượng của kích cỡ đó lớn hơn 0, tạo một object chứa _id, size, và quantity, rồi thêm vào tempData.
  // Cập nhật state cartData với tempData.
  useEffect(() => {
    if (products.length > 0) {
      const tempData = [];
      for (const items in cartItems) {
        for (const item in cartItems[items]) {
          if (cartItems[items][item] > 0) {
            const [size, color] = String(item).split("|");
            tempData.push({
              _id: items,
              size,
              color,
              quantity: cartItems[items][item],
            });
          }
        }
      }
      setCartData(tempData);
    }
  }, [cartItems, products]);

  return (
    <div className="border-t pt-14">
      <div className=" text-2xl mb-3">
        <Title text1={"GIỎ HÀNG"} text2={"CỦA BẠN"} />
      </div>

      <div>
        {cartData.map((item, index) => {
          const productData = products.find(
            (product) => product._id === item._id
          );

          return (
            <div
              key={index}
              className="py-4 border-t border-b text-gray-700 grid grid-cols-[4fr_0.5fr_0.5fr] sm:grid-cols-[4fr_2fr_0.5fr] items-center gap-4"
            >
              <div className=" flex items-start gap-6">
                <img
                  className="w-16 sm:w-20"
                  src={(productData.colorImages?.[item.color]?.[0]) || productData.image[0]}
                  alt=""
                />
                <div>
                  <p className="text-xs sm:text-lg font-medium">
                    {productData.name}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <p>
                      {currency}
                      {productData.price}
                    </p>
                    <p className="px-2 sm:px-3 sm:py-1 border bg-slate-50 text-xs sm:text-sm">
                      Size: {item.size}
                    </p>
                    <p className="px-2 sm:px-3 sm:py-1 border bg-slate-50 text-xs sm:text-sm">
                      Màu: {item.color}
                    </p>
                  </div>
                </div>
              </div>
              <input
                onChange={(e) =>
                  e.target.value === "" || e.target.value === "0"
                    ? null
                    : updateQuantity(
                        item._id,
                        item.size,
                        item.color,
                        Number(e.target.value)
                      )
                }
                className="border max-w-10 sm:max-w-20 px-1 sm:px-2 py-1"
                type="number"
                min={1}
                defaultValue={item.quantity}
              />
              <img
                onClick={() => updateQuantity(item._id, item.size, item.color, 0)}
                className="w-4 mr-4 sm:w-5 cursor-pointer"
                src={assets.bin_icon}
                alt=""
              />
            </div>
          );
        })}
      </div>

      <div className="flex justify-end my-20">
        <div className="w-full sm:w-[450px]">
          <CartTotal />
          <div className=" w-full text-end">
            <button
              onClick={() => navigate("/place-order")}
              className="bg-black text-white text-sm my-8 px-8 py-3"
            >
              THANH TOÁN
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
