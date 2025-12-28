import React, { useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";
// Thành phần này hiển thị tổng tiền của giỏ hàng, bao gồm tiền sản phẩm và phí ship.
const CartTotal = () => {
  // Sử dụng context để lấy dữ liệu và hàm từ ShopContext
  // Lấy các giá trị cần thiết từ context
  const { currency, delivery_fee, getCartAmount } = useContext(ShopContext);

  return (
    <div className="w-full">
      <div className="text-2xl">
        <Title text1={"TỔNG "} text2={"TIỀN"} />
      </div>

      <div className="flex flex-col gap-2 mt-2 text-sm">
        <div className="flex justify-between">
          <p>Tiền Sản Phẩm</p>
          <p>
            {getCartAmount()}.00 {currency}
          </p>
        </div>
        <hr />
        <div className="flex justify-between">
          <p>Phí Ship</p>
          <p>
            {delivery_fee}.00 {currency}
          </p>
        </div>
        <hr />
        <div className="flex justify-between">
          <b>Tổng</b>
          <b>
            {currency}{" "}
            {getCartAmount() === 0 ? 0 : getCartAmount() + delivery_fee}.00
          </b>
        </div>
      </div>
    </div>
  );
};

export default CartTotal;
