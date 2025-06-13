import axios from "axios";
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { backendUrl } from "../App";
import { toast } from "react-toastify";

const Edit = ({ token }) => {
  const { id } = useParams(); // Lấy productId từ URL
  const navigate = useNavigate();

  const [product, setProduct] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    subCategory: "",
    sizes: [],
    bestseller: false,
    image: [],
  });

  const [imageFiles, setImageFiles] = useState({
    image1: null,
    image2: null,
    image3: null,
    image4: null,
  });

  const [previewImages, setPreviewImages] = useState({
    image1: null,
    image2: null,
    image3: null,
    image4: null,
  });

  // Lấy thông tin sản phẩm hiện tại
  const fetchProduct = async () => {
    try {
      const response = await axios.post(backendUrl + "/api/product/single", {
        productId: id,
      });
      if (response.data.success) {
        setProduct(response.data.product);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  // Xử lý thay đổi input
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProduct((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Xử lý thay đổi file hình ảnh
  const handleImageChange = (e, imageKey) => {
    const file = e.target.files[0];
    if (file) {
      setImageFiles((prev) => ({
        ...prev,
        [imageKey]: file,
      }));
      // Tạo URL tạm thời để hiển thị ảnh mới
      const previewUrl = URL.createObjectURL(file);
      setPreviewImages((prev) => ({
        ...prev,
        [imageKey]: previewUrl,
      }));
    }
  };

  // Xử lý gửi form
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("productId", id);
      if (product.name) formData.append("name", product.name);
      if (product.description)
        formData.append("description", product.description);
      if (product.price) formData.append("price", product.price);
      if (product.category) formData.append("category", product.category);
      if (product.subCategory)
        formData.append("subCategory", product.subCategory);
      if (product.sizes.length > 0)
        formData.append("sizes", JSON.stringify(product.sizes));
      formData.append("bestseller", product.bestseller.toString());

      // Thêm hình ảnh nếu có
      if (imageFiles.image1) formData.append("image1", imageFiles.image1);
      if (imageFiles.image2) formData.append("image2", imageFiles.image2);
      if (imageFiles.image3) formData.append("image3", imageFiles.image3);
      if (imageFiles.image4) formData.append("image4", imageFiles.image4);

      const response = await axios.post(
        backendUrl + "/api/product/edit",
        formData,
        {
          headers: { token, "Content-Type": "multipart/form-data" },
        }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        navigate("/list");
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-2xl mb-4">Chỉnh sửa sản phẩm</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label>Tên sản phẩm</label>
          <input
            type="text"
            name="name"
            value={product.name}
            onChange={handleChange}
            className="border p-2 w-full"
          />
        </div>
        <div>
          <label>Mô tả</label>
          <textarea
            name="description"
            value={product.description}
            onChange={handleChange}
            className="border p-2 w-full"
          />
        </div>
        <div>
          <label>Giá</label>
          <input
            type="number"
            name="price"
            value={product.price}
            onChange={handleChange}
            className="border p-2 w-full"
          />
        </div>
        <div>
          <label>Danh mục</label>
          <input
            type="text"
            name="category"
            value={product.category}
            onChange={handleChange}
            className="border p-2 w-full"
          />
        </div>
        <div>
          <label>Danh mục phụ</label>
          <input
            type="text"
            name="subCategory"
            value={product.subCategory}
            onChange={handleChange}
            className="border p-2 w-full"
          />
        </div>
        <div>
          <label>Kích cỡ (cách nhau bằng dấu phẩy)</label>
          <input
            type="text"
            name="sizes"
            value={product.sizes.join(",")}
            onChange={(e) =>
              setProduct((prev) => ({
                ...prev,
                sizes: e.target.value.split(","),
              }))
            }
            className="border p-2 w-full"
          />
        </div>
        <div>
          <label>
            <input
              type="checkbox"
              name="bestseller"
              checked={product.bestseller}
              onChange={handleChange}
            />
            Bestseller
          </label>
        </div>
        <div>
          <label>Hình ảnh 1</label>
          <input type="file" onChange={(e) => handleImageChange(e, "image1")} />
          {previewImages.image1 ? (
            <img
              src={previewImages.image1}
              alt="Hình 1"
              className="w-20 mt-2"
            />
          ) : product.image[0] ? (
            <img src={product.image[0]} alt="Hình 1" className="w-20 mt-2" />
          ) : null}
        </div>
        <div>
          <label>Hình ảnh 2</label>
          <input type="file" onChange={(e) => handleImageChange(e, "image2")} />
          {previewImages.image2 ? (
            <img
              src={previewImages.image2}
              alt="Hình 2"
              className="w-20 mt-2"
            />
          ) : product.image[1] ? (
            <img src={product.image[1]} alt="Hình 2" className="w-20 mt-2" />
          ) : null}
        </div>
        <div>
          <label>Hình ảnh 3</label>
          <input type="file" onChange={(e) => handleImageChange(e, "image3")} />
          {previewImages.image3 ? (
            <img
              src={previewImages.image3}
              alt="Hình 3"
              className="w-20 mt-2"
            />
          ) : product.image[2] ? (
            <img src={product.image[2]} alt="Hình 3" className="w-20 mt-2" />
          ) : null}
        </div>
        <div>
          <label>Hình ảnh 4</label>
          <input type="file" onChange={(e) => handleImageChange(e, "image4")} />
          {previewImages.image4 ? (
            <img
              src={previewImages.image4}
              alt="Hình 4"
              className="w-20 mt-2"
            />
          ) : product.image[3] ? (
            <img src={product.image[3]} alt="Hình 4" className="w-20 mt-2" />
          ) : null}
        </div>
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Cập nhật sản phẩm
        </button>
      </form>
    </div>
  );
};

export default Edit;
