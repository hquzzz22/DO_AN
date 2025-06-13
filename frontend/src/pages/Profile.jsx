import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import { toast } from "react-toastify";
import axios from "axios";

const Profile = () => {
  const { backendUrl, token, navigate } = useContext(ShopContext);
  const [userData, setUserData] = useState({ name: "", email: "" });
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(backendUrl + "/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success) {
          setUserData(response.data.user);
          setNewName(response.data.user.name);
          setNewEmail(response.data.user.email);
        } else {
          toast.error(response.data.message);
        }
      } catch (error) {
        console.error(
          "Lỗi trong fetchUserData:",
          error.response?.data || error
        );
        toast.error(error.response?.data?.message || error.message);
        navigate("/login");
      }
    };

    if (token) {
      fetchUserData();
    } else {
      navigate("/login");
    }
  }, [token, backendUrl, navigate]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        backendUrl + "/api/user/update-profile",
        { name: newName, email: newEmail, password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        toast.success(response.data.message);
        setUserData({ name: newName, email: newEmail });
        setNewPassword("");
        setIsEditing(false);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(
        "Lỗi trong handleUpdateProfile:",
        error.response?.data || error
      );
      toast.error(error.response?.data?.message || error.message);
    }
  };

  return (
    <div
      className="max-w-_IV
      mx-auto my-10 p-6 bg-white rounded-lg shadow-md"
    >
      <h2 className="text-2xl font-bold mb-6 text-center">Thông Tin Cá Nhân</h2>
      {!isEditing ? (
        <div className="space-y-4">
          <div>
            <p className="text-gray-600">
              <strong>Họ Tên:</strong> {userData.name}
            </p>
            <p className="text-gray-600">
              <strong>Email:</strong> {userData.email}
            </p>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
          >
            Chỉnh Sửa
          </button>
        </div>
      ) : (
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-gray-700">Họ Tên</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700">Email</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700">
              Mật Khẩu Mới (tùy chọn)
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Nhập mật khẩu mới (tối thiểu 8 ký tự)"
            />
          </div>
          <div className="flex gap-4">
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
            >
              Lưu Thay Đổi
            </button>
            <button
              type="button"
              onClick={() => {
                setNewName(userData.name);
                setNewEmail(userData.email);
                setNewPassword("");
                setIsEditing(false);
              }}
              className="w-full bg-gray-500 text-white py-2 rounded hover:bg-gray-600 transition"
            >
              Hủy
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default Profile;
