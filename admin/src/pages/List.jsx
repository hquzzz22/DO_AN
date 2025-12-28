import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { backendUrl, currency } from "../App";
import { toast } from "react-toastify";

const List = ({ token }) => {
  const [list, setList] = useState([]);
  const [searchParams, setSearchParams] = useState({
    name: "",
    category: "",
  });

  const fetchList = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/product/list");
      if (response.data.success) {
        setList(response.data.products.reverse());
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    // Trim khoảng trắng đầu/cuối trước khi gửi đi
    const trimmedParams = {
      name: searchParams.name.trim(),
      category: searchParams.category.trim(),
    };

    // Cập nhật lại form hiển thị (nếu muốn hiển thị lại input đã được trim)
    setSearchParams(trimmedParams);

    try {
      const response = await axios.post(
        backendUrl + "/api/product/search",
        trimmedParams
      );
      if (response.data.success) {
        setList(response.data.products.reverse());
        if (response.data.products.length === 0) {
          toast.info("Không tìm thấy sản phẩm");
        }
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "Lỗi khi tìm kiếm sản phẩm");
    }
  };

  const handleClearSearch = () => {
    setSearchParams({ name: "", category: "" });
    fetchList();
  };

  const removeProduct = async (id) => {
    try {
      const response = await axios.post(
        backendUrl + "/api/product/remove",
        { id },
        { headers: { token } }
      );
      if (response.data.success) {
        toast.success(response.data.message);
        await fetchList();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "Lỗi khi xóa sản phẩm");
    }
  };

  const handleSearchInputChange = (e) => {
    const { name, value } = e.target;
    setSearchParams((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    fetchList();
  }, []);

  return (
    <>
      <p className="mb-2">Danh sách tất cả sản phẩm</p>

      {/* Form tìm kiếm */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Tên sản phẩm
            </label>
            <input
              type="text"
              name="name"
              value={searchParams.name}
              onChange={handleSearchInputChange}
              placeholder="Nhập tên sản phẩm"
              className="mt-1 p-2 border border-gray-300 rounded w-full text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Danh mục
            </label>
            <input
              type="text"
              name="category"
              value={searchParams.category}
              onChange={handleSearchInputChange}
              placeholder="Nhập danh mục"
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

      <div className="flex flex-col gap-2">
        {/* ------- Tiêu đề bảng danh sách ---------- */}
        <div className="hidden md:grid grid-cols-[1fr_3fr_1fr_1fr_1fr] items-center py-1 px-2 border bg-gray-100 text-sm">
          <b>Hình ảnh</b>
          <b>Tên</b>
          <b>Danh mục</b>
          <b>Giá</b>
          <b className="text-center">Hành động</b>
        </div>

        {/* ------ Danh sách sản phẩm ------ */}
        {list.length === 0 ? (
          <p className="text-gray-500 py-2">Không có sản phẩm để hiển thị</p>
        ) : (
          list.map((item, index) => (
            <div
              className="grid grid-cols-1 md:grid-cols-[1fr_3fr_1fr_1fr_1fr] items-start gap-2 py-1 px-2 border text-sm"
              key={item._id}
            >
              <div className="md:flex md:items-center">
                <img className="w-12" src={item.image[0]} alt={item.name} />
              </div>
              <div className="md:flex md:items-center">
                <span className="md:hidden font-bold">Tên: </span>
                <span>{item.name}</span>
              </div>
              <div className="md:flex md:items-center">
                <span className="md:hidden font-bold">Danh mục: </span>
                <span>{item.category}</span>
              </div>
              <div className="md:flex md:items-center">
                <span className="md:hidden font-bold">Giá: </span>
                <span>
                  {item.price}

                  {currency}
                </span>
              </div>
              <div className="flex justify-start md:justify-center gap-2">
                <Link
                  to={`/edit/${item._id}`}
                  className="cursor-pointer text-blue-500"
                >
                  Sửa
                </Link>
                <p
                  onClick={() => removeProduct(item._id)}
                  className="cursor-pointer text-red-500"
                >
                  X
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
};

export default List;
