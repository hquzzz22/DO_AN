import React, { useState } from "react";
import axios from "axios";
import { backendUrl } from "../App";
import { toast } from "react-toastify";

const SearchUsers = ({ token }) => {
  const [searchParams, setSearchParams] = useState({
    name: "",
    email: "",
  });
  const [users, setUsers] = useState([]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchParams((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error("Vui lòng đăng nhập để tìm kiếm người dùng");
      return;
    }

    try {
      const response = await axios.post(
        `${backendUrl}/api/user/search`,
        searchParams,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        setUsers(response.data.users);
        if (response.data.users.length === 0) {
          toast.info("Không tìm thấy người dùng");
        }
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error("Lỗi khi tìm kiếm người dùng");
      console.log(error);
    }
  };

  const handleClear = () => {
    setSearchParams({ name: "", email: "" });
    setUsers([]);
  };

  return (
    <div className="p-4">
      <h3 className="text-xl font-semibold mb-4">Tìm kiếm người dùng</h3>
      <form onSubmit={handleSearch} className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Tên
            </label>
            <input
              type="text"
              name="name"
              value={searchParams.name}
              onChange={handleInputChange}
              placeholder="Nhập tên"
              className="mt-1 p-2 border border-gray-300 rounded w-full text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={searchParams.email}
              onChange={handleInputChange}
              placeholder="Nhập email"
              className="mt-1 p-2 border border-gray-300 rounded w-full text-sm"
            />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Tìm kiếm
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Xóa bộ lọc
          </button>
        </div>
      </form>

      <div>
        {users.length === 0 ? (
          <p className="text-gray-500">Không có người dùng để hiển thị</p>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="hidden md:grid grid-cols-[1fr_2fr_2fr] items-center py-1 px-2 border bg-gray-100 text-sm">
              <b>ID</b>
              <b>Tên</b>
              <b>Email</b>
            </div>
            {users.map((user) => (
              <div
                key={user._id}
                className="grid grid-cols-[1fr_2fr_2fr] items-center gap-2 py-1 px-2 border text-sm"
              >
                <p>{user._id}</p>
                <p>{user.name}</p>
                <p>{user.email}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchUsers;
