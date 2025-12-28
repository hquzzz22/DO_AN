import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { backendUrl, currency } from "../App";
import { toast } from "react-toastify";
import { assets } from "../assets/assets";

// Some legacy orders in DB may have items saved as string like "@{name=...; size=L; quantity=1}"
// This helper attempts to parse them into an object so UI won't break.
const parseLegacyItemString = (str) => {
  if (typeof str !== "string") return null;
  const cleaned = str.replace(/^@\{/, "").replace(/\}$/, "");
  const obj = {};
  cleaned.split(";").forEach((part) => {
    const p = part.trim();
    if (!p) return;
    const idx = p.indexOf("=");
    if (idx === -1) return;
    const k = p.slice(0, idx).trim();
    const v = p.slice(idx + 1).trim();
    obj[k] = v;
  });

  if (obj.quantity) obj.quantity = Number(obj.quantity) || obj.quantity;
  if (obj.price) obj.price = Number(obj.price) || obj.price;
  if (obj.image && typeof obj.image === "string") obj.image = [];
  return obj;
};

const normalizeItem = (item) => {
  if (!item) return null;
  if (typeof item === "string") {
    const parsed = parseLegacyItemString(item);
    return parsed
      ? {
          name: parsed.name,
          quantity: parsed.quantity || 1,
          size: parsed.size,
          color: parsed.color,
        }
      : { name: item, quantity: 1 };
  }

  return {
    productId: item.productId || item._id,
    name: item.name,
    price: item.price,
    image: Array.isArray(item.image) ? item.image : [],
    size: item.size,
    color: item.color,
    quantity: item.quantity,
  };
};

const STATUS_OPTIONS_VI = [
  "Chờ xác nhận",
  "Đã xác nhận",
  "Đang đóng gói",
  "Đang giao hàng",
  "Đã giao",
  "Đã hủy",
  "Đã trả hàng",
];

const Orders = ({ token }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAllOrders = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await axios.post(
        backendUrl + "/api/order/list",
        {},
        { headers: { token } }
      );

      if (response.data.success) {
        setOrders((response.data.orders || []).slice().reverse());
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, status) => {
    try {
      const response = await axios.post(
        backendUrl + "/api/order/status",
        { orderId, status },
        { headers: { token } }
      );
      if (response.data.success) {
        await fetchAllOrders();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const restock = async (orderId, action) => {
    try {
      const response = await axios.post(
        backendUrl + "/api/order/restock",
        { orderId, action },
        { headers: { token } }
      );
      if (response.data.success) {
        toast.success(response.data.message || "Đã xử lý");
        await fetchAllOrders();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || error.message);
    }
  };

  useEffect(() => {
    fetchAllOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const statusOptions = useMemo(() => STATUS_OPTIONS_VI, []);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xl font-semibold">Đơn hàng</h3>
        <button
          onClick={fetchAllOrders}
          className="border px-3 py-2 text-sm rounded bg-white"
          disabled={loading}
        >
          {loading ? "Đang tải..." : "Tải lại"}
        </button>
      </div>

      <div className="mt-4">
        {loading && <p>Loading...</p>}
        {!loading && orders.length === 0 && (
          <p className="text-sm text-gray-500">Chưa có đơn hàng.</p>
        )}

        {orders.map((order, index) => {
          const items = Array.isArray(order.items)
            ? order.items.map(normalizeItem).filter(Boolean)
            : [];

          return (
            <div
              key={order._id || index}
              className="grid grid-cols-1 sm:grid-cols-[0.5fr_2fr_1fr] lg:grid-cols-[0.5fr_2fr_1fr_1fr_1.2fr] gap-3 items-start border-2 border-gray-200 bg-white p-5 md:p-8 my-3 md:my-4 text-xs sm:text-sm text-gray-700"
            >
              <img className="w-12" src={assets.parcel_icon} alt="" />

              <div>
                <div>
                  {items.map((it, idx) => (
                    <p className="py-0.5" key={idx}>
                      {it.name || "(Không tên)"} x {it.quantity || 0}
                      {it.size ? (
                        <span className="ml-2">Size: {it.size}</span>
                      ) : null}
                      {it.color ? (
                        <span className="ml-2">Màu: {it.color}</span>
                      ) : null}
                    </p>
                  ))}
                </div>

                <p className="mt-3 mb-2 font-medium">
                  {(order.address?.firstName || "") +
                    " " +
                    (order.address?.lastName || "")}
                </p>
                <div>
                  <p>{(order.address?.street || "") + ","}</p>
                  <p>
                    {(order.address?.city || "") +
                      ", " +
                      (order.address?.state || "") +
                      ", " +
                      (order.address?.country || "") +
                      ", " +
                      (order.address?.zipcode || "")}
                  </p>
                </div>
                <p>{order.address?.phone}</p>
              </div>

              <div>
                <p className="text-sm sm:text-[15px]">
                  Số SP: {items.length}
                </p>
                <p className="mt-3">Phương thức: {order.paymentMethod}</p>
                <p>
                  Thanh toán: {order.payment ? "Đã thanh toán" : "Chưa thanh toán"}
                </p>
                <p>Ngày: {new Date(order.date).toLocaleDateString()}</p>
              </div>

              <p className="text-sm sm:text-[15px]">
                {currency}
                {order.amount}
              </p>

              <div className="flex flex-col gap-2">
                <select
                  onChange={(event) => updateStatus(order._id, event.target.value)}
                  value={order.status}
                  className="p-2 font-semibold border bg-white"
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => restock(order._id, "cancel")}
                    className="px-3 py-2 text-xs rounded border bg-white hover:bg-gray-50"
                  >
                    Hủy đơn (+hoàn kho)
                  </button>
                  <button
                    type="button"
                    onClick={() => restock(order._id, "return")}
                    className="px-3 py-2 text-xs rounded border bg-white hover:bg-gray-50"
                  >
                    Trả hàng (+hoàn kho)
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Orders;
