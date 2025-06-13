import React, { useState, useEffect } from "react";
import axios from "axios";
import { backendUrl } from "../App";
import { toast } from "react-toastify";

const ManageUsers = ({ token }) => {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editUserId, setEditUserId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [searchParams, setSearchParams] = useState({
    name: "",
    email: "",
  });

  // Lấy danh sách người dùng
  const fetchUsers = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/user/list", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setUsers(response.data.users);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  // Tìm kiếm người dùng
  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        backendUrl + "/api/user/search",
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
      console.log(error);
      toast.error("Lỗi khi tìm kiếm người dùng");
    }
  };

  // Xóa bộ lọc
  const handleClearSearch = () => {
    setSearchParams({ name: "", email: "" });
    fetchUsers();
  };

  // Xử lý thêm người dùng
  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        backendUrl + "/api/user/add-user",
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        toast.success("Thêm người dùng thành công");
        setFormData({ name: "", email: "", password: "" });
        setShowForm(false);
        fetchUsers();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  // Xử lý sửa người dùng
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        backendUrl + "/api/user/update-user",
        { ...formData, userId: editUserId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        toast.success("Cập nhật người dùng thành công");
        setFormData({ name: "", email: "", password: "" });
        setShowForm(false);
        setEditUserId(null);
        fetchUsers();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  // Xử lý xóa người dùng
  const handleDeleteUser = async (userId) => {
    if (window.confirm("Bạn có chắc muốn xóa người dùng này?")) {
      try {
        const response = await axios.post(
          backendUrl + "/api/user/delete-user",
          { userId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.data.success) {
          toast.success("Xóa người dùng thành công");
          fetchUsers();
        } else {
          toast.error(response.data.message);
        }
      } catch (error) {
        console.log(error);
        toast.error(error.message);
      }
    }
  };

  // Xử lý chỉnh sửa: điền dữ liệu vào form
  const handleEditClick = (user) => {
    setFormData({
      name: user.name,
      email: user.email,
      password: "", // Không điền mật khẩu cũ để bảo mật
    });
    setEditUserId(user._id);
    setShowForm(true);
  };

  // Xử lý thay đổi input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Xử lý thay đổi input tìm kiếm
  const handleSearchInputChange = (e) => {
    const { name, value } = e.target;
    setSearchParams((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  return (
    <div className="p-4">
      <h2 className="text-2xl mb-4">Quản lý người dùng</h2>

      {/* Form tìm kiếm */}
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
              onChange={handleSearchInputChange}
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
              onChange={handleSearchInputChange}
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
            onClick={handleClearSearch}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Xóa bộ lọc
          </button>
        </div>
      </form>

      {/* Nút mở form thêm người dùng */}
      <button
        onClick={() => {
          setShowForm(true);
          setEditUserId(null);
          setFormData({ name: "", email: "", password: "" });
        }}
        className="mb-4 bg-blue-500 text-white p-2 rounded"
      >
        Thêm người dùng
      </button>

      {/* Form thêm/sửa người dùng */}
      {showForm && (
        <form
          onSubmit={editUserId ? handleUpdateUser : handleAddUser}
          className="flex flex-col gap-4 mb-6 p-4 bg-gray-100 rounded"
        >
          <div>
            <label className="block mb-1">Tên</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="border p-2 w-full"
              required
            />
          </div>
          <div>
            <label className="block mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="border p-2 w-full"
              required
            />
          </div>
          <div>
            <label className="block mb-1">
              {editUserId
                ? "Mật khẩu mới (bỏ trống nếu không đổi)"
                : "Mật khẩu"}
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="border p-2 w-full"
              required={!editUserId}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-blue-500 text-white p-2 rounded"
            >
              {editUserId ? "Cập nhật" : "Thêm"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="bg-gray-500 text-white p-2 rounded"
            >
              Hủy
            </button>
          </div>
        </form>
      )}

      {/* Bảng danh sách người dùng */}
      <div className="flex flex-col gap-2">
        <div className="hidden md:grid grid-cols-[1fr_2fr_2fr_1fr] items-center py-1 px-2 border bg-gray-100 text-sm">
          <b>ID</b>
          <b>Tên</b>
          <b>Email</b>
          <b className="text-center">Hành động</b>
        </div>
        {users.length === 0 ? (
          <p className="text-gray-500 py-2">Không có người dùng để hiển thị</p>
        ) : (
          users.map((user) => (
            <div
              className="grid grid-cols-1 md:grid-cols-[1fr_2fr_2fr_1fr] items-start gap-2 py-1 px-2 border text-sm"
              key={user._id}
            >
              <div className="md:flex md:items-center">
                <span className="md:hidden font-bold">ID: </span>
                <span>{user._id}</span>
              </div>
              <div className="md:flex md:items-center">
                <span className="md:hidden font-bold">Tên: </span>
                <span>{user.name}</span>
              </div>
              <div className="md:flex md:items-center">
                <span className="md:hidden font-bold">Email: </span>
                <span>{user.email}</span>
              </div>
              <div className="flex justify-start md:justify-center gap-2">
                <button
                  onClick={() => handleEditClick(user)}
                  className="text-blue-500"
                >
                  Sửa
                </button>
                <button
                  onClick={() => handleDeleteUser(user._id)}
                  className="text-red-500"
                >
                  X
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ManageUsers;
