import React, { useState, useContext } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { ShopContext } from "../context/ShopContext";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { backendUrl } = useContext(ShopContext);
  const token = searchParams.get("token");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    try {
      if (newPassword.length < 8) {
        toast.error("Mật khẩu phải có ít nhất 8 ký tự");
        setIsLoading(false);
        return;
      }

      const response = await axios.post(
        `${backendUrl}/api/user/reset-password`,
        {
          token,
          newPassword,
        }
      );
      if (response.data.success) {
        toast.success("Đặt lại mật khẩu thành công");
        navigate("/login");
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-14 gap-4 text-gray-800"
    >
      <div className="inline-flex items-center gap-2 mb-2 mt-10">
        <p className="prata-regular text-3xl">Đặt Lại Mật Khẩu</p>
        <hr className="border-none h-[1.5px] w-8 bg-gray-800" />
      </div>
      <input
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        className="w-full px-3 py-2 border border-gray-800"
        placeholder="Nhập mật khẩu mới"
        required
      />
      <button
        className="bg-black text-white font-light px-8 py-2 mt-4 disabled:bg-gray-500"
        disabled={isLoading}
      >
        {isLoading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
      </button>
    </form>
  );
};

export default ResetPassword;
