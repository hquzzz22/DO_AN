import React, { useMemo, useState } from "react";
import { assets } from "../assets/assets";
import axios from "axios";
import { backendUrl } from "../App";
import { toast } from "react-toastify";
import "../App.css";

const SIZE_OPTIONS = ["S", "M", "L", "XL", "XXL"];

const Add = ({ token }) => {
  // Legacy images (optional fallback)
  const [image1, setImage1] = useState(false);
  const [image2, setImage2] = useState(false);
  const [image3, setImage3] = useState(false);
  const [image4, setImage4] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [bestseller, setBestseller] = useState(false);
  const [sizes, setSizes] = useState([]);

  // New: colors + images per color + stock per (size,color)
  const [colorInput, setColorInput] = useState("");
  const [colors, setColors] = useState([]); // e.g. ["Black","White"]
  const [colorImageFiles, setColorImageFiles] = useState({});
  // { [color]: File[] }

  const [stockMatrix, setStockMatrix] = useState({});
  // { [color]: { [size]: number } }

  const [isLoading, setIsLoading] = useState(false);

  const selectedSizes = useMemo(
    () => SIZE_OPTIONS.filter((s) => sizes.includes(s)),
    [sizes]
  );

  const addColor = () => {
    const c = colorInput.trim();
    if (!c) return;
    if (colors.includes(c)) {
      toast.error("Màu đã tồn tại");
      return;
    }
    setColors((prev) => [...prev, c]);
    setStockMatrix((prev) => ({ ...prev, [c]: prev[c] || {} }));
    setColorImageFiles((prev) => ({ ...prev, [c]: prev[c] || [] }));
    setColorInput("");
  };

  const removeColor = (c) => {
    setColors((prev) => prev.filter((x) => x !== c));
    setStockMatrix((prev) => {
      const next = { ...prev };
      delete next[c];
      return next;
    });
    setColorImageFiles((prev) => {
      const next = { ...prev };
      delete next[c];
      return next;
    });
  };

  const onChangeColorImages = (color, files) => {
    const arr = Array.from(files || []);
    setColorImageFiles((prev) => ({ ...prev, [color]: arr }));
  };

  const setStock = (color, size, value) => {
    const num = value === "" ? "" : Math.max(0, Number(value));
    setStockMatrix((prev) => ({
      ...prev,
      [color]: {
        ...(prev[color] || {}),
        [size]: num,
      },
    }));
  };

  const buildVariants = () => {
    const variants = [];
    for (const c of colors) {
      for (const s of selectedSizes) {
        const raw = stockMatrix?.[c]?.[s];
        const stock = Number(raw);
        variants.push({
          color: c,
          size: s,
          stock: Number.isFinite(stock) ? stock : 0,
        });
      }
    }
    return variants;
  };

  const validateBeforeSubmit = () => {
    if (!sizes.length) {
      toast.error("Vui lòng chọn ít nhất 1 size");
      return false;
    }
    if (!colors.length) {
      toast.error("Vui lòng thêm ít nhất 1 màu");
      return false;
    }
    for (const c of colors) {
      const imgs = colorImageFiles[c] || [];
      if (!imgs.length) {
        toast.error(`Vui lòng upload ảnh cho màu: ${c}`);
        return false;
      }
    }
    return true;
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if (!validateBeforeSubmit()) return;

    setIsLoading(true);
    try {
      const formData = new FormData();

      formData.append("name", name);
      formData.append("description", description);
      formData.append("price", price);
      formData.append("category", category);
      formData.append("subCategory", subCategory);
      formData.append("bestseller", bestseller);
      formData.append("sizes", JSON.stringify(sizes));
      formData.append("colors", JSON.stringify(colors));

      const variants = buildVariants();
      formData.append("variants", JSON.stringify(variants));

      // Optional legacy images
      image1 && formData.append("image1", image1);
      image2 && formData.append("image2", image2);
      image3 && formData.append("image3", image3);
      image4 && formData.append("image4", image4);

      // Color images: fieldname color_<ColorName>_<index>
      for (const c of colors) {
        const imgs = colorImageFiles[c] || [];
        imgs.forEach((file, idx) => {
          formData.append(`color_${c}_${idx}`, file);
        });
      }

      const response = await axios.post(backendUrl + "/api/product/add", formData, {
        headers: { token },
      });

      if (response.data.success) {
        toast.success(response.data.message);

        // Reset form
        setName("");
        setDescription("");
        setImage1(false);
        setImage2(false);
        setImage3(false);
        setImage4(false);
        setPrice("");
        setCategory("");
        setSubCategory("");
        setSizes([]);
        setColors([]);
        setColorInput("");
        setColorImageFiles({});
        setStockMatrix({});
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmitHandler} className="flex flex-col w-full items-start gap-4">
      {/* Legacy upload (fallback) */}
      <div>
        <p className="mb-2 font-medium">Ảnh chung (tuỳ chọn)</p>
        <div className="flex flex-wrap gap-2">
          <label htmlFor="image1">
            <img className="w-20" src={!image1 ? assets.upload_area : URL.createObjectURL(image1)} alt="" />
            <input onChange={(e) => setImage1(e.target.files[0])} type="file" id="image1" hidden />
          </label>
          <label htmlFor="image2">
            <img className="w-20" src={!image2 ? assets.upload_area : URL.createObjectURL(image2)} alt="" />
            <input onChange={(e) => setImage2(e.target.files[0])} type="file" id="image2" hidden />
          </label>
          <label htmlFor="image3">
            <img className="w-20" src={!image3 ? assets.upload_area : URL.createObjectURL(image3)} alt="" />
            <input onChange={(e) => setImage3(e.target.files[0])} type="file" id="image3" hidden />
          </label>
          <label htmlFor="image4">
            <img className="w-20" src={!image4 ? assets.upload_area : URL.createObjectURL(image4)} alt="" />
            <input onChange={(e) => setImage4(e.target.files[0])} type="file" id="image4" hidden />
          </label>
        </div>
      </div>

      <div className="w-full">
        <p className="mb-2">Tên sản phẩm</p>
        <input
          onChange={(e) => setName(e.target.value)}
          value={name}
          className="w-full max-w-[700px] px-3 py-2 border"
          type="text"
          placeholder="Nhập tên sản phẩm"
          required
        />
      </div>

      <div className="w-full">
        <p className="mb-2">Mô tả sản phẩm</p>
        <textarea
          onChange={(e) => setDescription(e.target.value)}
          value={description}
          className="w-full max-w-[700px] px-3 py-2 border"
          placeholder="Nhập mô tả sản phẩm"
          required
        />
      </div>

      <div className="flex flex-col md:flex-row gap-2 w-full md:gap-6">
        <div className="flex-1">
          <p className="mb-2">Danh mục sản phẩm</p>
          <input
            onChange={(e) => setCategory(e.target.value)}
            value={category}
            className="w-full px-3 py-2 border"
            type="text"
            placeholder="Ví dụ: Nam, Nữ, Trẻ em"
            required
          />
        </div>

        <div className="flex-1">
          <p className="mb-2">Danh mục phụ</p>
          <input
            onChange={(e) => setSubCategory(e.target.value)}
            value={subCategory}
            className="w-full px-3 py-2 border"
            type="text"
            placeholder="Ví dụ: Áo, Quần, Đồ mùa đông"
            required
          />
        </div>

        <div className="md:w-[160px]">
          <p className="mb-2">Giá sản phẩm</p>
          <input
            onChange={(e) => setPrice(e.target.value)}
            value={price}
            className="w-full px-3 py-2 border"
            type="number"
            placeholder="199000"
            required
          />
        </div>
      </div>

      <div className="w-full">
        <p className="mb-2">Size</p>
        <div className="flex flex-wrap gap-2">
          {SIZE_OPTIONS.map((s) => (
            <button
              type="button"
              key={s}
              onClick={() =>
                setSizes((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))
              }
              className={`px-3 py-1 border rounded text-sm ${sizes.includes(s) ? "bg-pink-100 border-pink-300" : "bg-slate-200"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full">
        <p className="mb-2">Màu (Colors)</p>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center max-w-[700px]">
          <input
            value={colorInput}
            onChange={(e) => setColorInput(e.target.value)}
            className="flex-1 px-3 py-2 border"
            placeholder='Nhập màu, ví dụ: Black / Trắng / Đỏ...'
            type="text"
          />
          <button type="button" onClick={addColor} className="px-4 py-2 bg-black text-white rounded">
            Thêm màu
          </button>
        </div>

        {colors.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {colors.map((c) => (
              <span key={c} className="inline-flex items-center gap-2 px-3 py-1 border rounded bg-white">
                <b className="text-sm">{c}</b>
                <button type="button" onClick={() => removeColor(c)} className="text-xs text-red-600">
                  Xoá
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Upload images per color */}
      {colors.length > 0 && (
        <div className="w-full">
          <p className="mb-2 font-medium">Ảnh theo màu (bắt buộc)</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {colors.map((c) => (
              <div key={c} className="border rounded p-3 bg-white">
                <div className="flex items-center justify-between">
                  <p className="font-medium">Màu: {c}</p>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => onChangeColorImages(c, e.target.files)}
                  className="mt-2"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {(colorImageFiles[c] || []).slice(0, 6).map((f, idx) => (
                    <img key={idx} src={URL.createObjectURL(f)} alt="" className="w-16 h-16 object-cover rounded border" />
                  ))}
                  {(colorImageFiles[c] || []).length > 6 && (
                    <span className="text-xs text-gray-500">+{(colorImageFiles[c] || []).length - 6} ảnh</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stock matrix */}
      {colors.length > 0 && selectedSizes.length > 0 && (
        <div className="w-full">
          <p className="mb-2 font-medium">Tồn kho theo Size x Màu</p>
          <div className="overflow-x-auto w-full">
            <table className="min-w-[700px] w-full border-collapse bg-white">
              <thead>
                <tr>
                  <th className="border p-2 text-left">Màu \\ Size</th>
                  {selectedSizes.map((s) => (
                    <th key={s} className="border p-2 text-left">
                      {s}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {colors.map((c) => (
                  <tr key={c}>
                    <td className="border p-2 font-medium">{c}</td>
                    {selectedSizes.map((s) => (
                      <td key={s} className="border p-2">
                        <input
                          type="number"
                          min={0}
                          value={stockMatrix?.[c]?.[s] ?? 0}
                          onChange={(e) => setStock(c, s, e.target.value)}
                          className="w-24 px-2 py-1 border rounded"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Gợi ý: nhập 0 nếu biến thể không bán / hết hàng.
          </p>
        </div>
      )}

      <div className="flex gap-2 mt-2 items-center">
        <input onChange={() => setBestseller((prev) => !prev)} checked={bestseller} type="checkbox" id="bestseller" />
        <label className="cursor-pointer" htmlFor="bestseller">
          Thêm vào danh sách bán chạy
        </label>
      </div>

      <button
        type="submit"
        className={`w-40 py-3 mt-2 bg-black text-white flex items-center justify-center rounded ${
          isLoading ? "opacity-50 cursor-not-allowed" : ""
        }`}
        disabled={isLoading}
      >
        {isLoading ? "Đang thêm..." : "THÊM SẢN PHẨM"}
      </button>
    </form>
  );
};

export default Add;
