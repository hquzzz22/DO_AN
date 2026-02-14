import React, { useContext, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";

const ThankYouPage = () => {
  const { setCartItems } = useContext(ShopContext);

  useEffect(() => {
    // Xóa giỏ hàng cục bộ khi trang cảm ơn được load sau khi thanh toán thành công
    setCartItems({});
  }, [setCartItems]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      <div className="text-green-500 mb-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-16 w-16 mx-auto"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="Status: 9, 5 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h1 className="text-3xl font-bold mb-4">Thanh toán thành công!</h1>
      <p className="text-gray-600 mb-6">
        Cảm ơn bạn đã thanh toán qua VNPay. Đơn hàng của bạn đang được xử lý.
      </p>
      <Link
        to="/orders"
        className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 transition"
      >
        Xem đơn hàng của tôi
      </Link>
    </div>
  );
};

export default ThankYouPage;
