import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { backendUrl, currency } from "../App";
import { toast } from "react-toastify";

const Revenue = ({ token }) => {
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalCost: 0,
    totalProfit: 0,
    ordersCount: 0,
  });
  const [daily, setDaily] = useState([]);

  const fetchReport = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const payload = startDate && endDate ? { startDate, endDate } : {};
      const response = await axios.post(
        backendUrl + "/api/report/revenue",
        payload,
        { headers: { token } }
      );

      if (response.data.success) {
        setSummary(response.data.summary);
        setDaily(response.data.daily || []);
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

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const profitColor = useMemo(() => {
    if (summary.totalProfit > 0) return "text-green-600";
    if (summary.totalProfit < 0) return "text-red-600";
    return "text-gray-700";
  }, [summary.totalProfit]);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xl font-semibold">Doanh thu & Lợi nhuận</h3>
        <button
          onClick={fetchReport}
          className="border px-3 py-2 text-sm rounded bg-white"
          disabled={loading}
        >
          {loading ? "Đang tải..." : "Tải lại"}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="border rounded bg-white p-4">
          <p className="text-xs text-gray-500">Tổng doanh thu (đơn Đã giao)</p>
          <p className="text-lg font-semibold">{currency}{summary.totalRevenue}</p>
        </div>
        <div className="border rounded bg-white p-4">
          <p className="text-xs text-gray-500">Tổng giá vốn</p>
          <p className="text-lg font-semibold">{currency}{summary.totalCost}</p>
        </div>
        <div className="border rounded bg-white p-4">
          <p className="text-xs text-gray-500">Lợi nhuận</p>
          <p className={`text-lg font-semibold ${profitColor}`}>{currency}{summary.totalProfit}</p>
        </div>
      </div>

      <div className="mt-3 border rounded bg-white p-4">
        <p className="text-sm text-gray-600">Số đơn đã giao: <b>{summary.ordersCount}</b></p>

        <div className="mt-3 flex flex-col sm:flex-row gap-2 sm:items-end">
          <div>
            <p className="text-xs text-gray-500 mb-1">Từ ngày</p>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border px-3 py-2 rounded"
            />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Đến ngày</p>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border px-3 py-2 rounded"
            />
          </div>
          <button
            type="button"
            onClick={fetchReport}
            className="px-4 py-2 bg-black text-white rounded"
            disabled={loading}
          >
            Lọc
          </button>
          <button
            type="button"
            onClick={() => {
              setStartDate("");
              setEndDate("");
              setTimeout(fetchReport, 0);
            }}
            className="px-4 py-2 border rounded bg-white"
            disabled={loading}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="mt-4 border rounded bg-white p-4">
        <p className="font-medium mb-2">Theo ngày</p>
        <div className="overflow-x-auto">
          <table className="min-w-[700px] w-full border-collapse">
            <thead>
              <tr>
                <th className="border p-2 text-left">Ngày</th>
                <th className="border p-2 text-left">Doanh thu</th>
                <th className="border p-2 text-left">Giá vốn</th>
                <th className="border p-2 text-left">Lợi nhuận</th>
                <th className="border p-2 text-left">Số đơn</th>
              </tr>
            </thead>
            <tbody>
              {daily.length === 0 ? (
                <tr>
                  <td className="border p-2" colSpan={5}>
                    Chưa có dữ liệu.
                  </td>
                </tr>
              ) : (
                daily.map((d) => (
                  <tr key={d.date}>
                    <td className="border p-2">{d.date}</td>
                    <td className="border p-2">{currency}{d.revenue}</td>
                    <td className="border p-2">{currency}{d.cost}</td>
                    <td className={`border p-2 ${d.profit > 0 ? "text-green-600" : d.profit < 0 ? "text-red-600" : ""}`}>
                      {currency}{d.profit}
                    </td>
                    <td className="border p-2">{d.orders}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Revenue;

