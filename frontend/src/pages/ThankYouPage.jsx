import React from "react";
import { Link } from "react-router-dom";

const ThankYouPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      <FaCheckCircle className="text-green-500 text-6xl mb-6" />
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
