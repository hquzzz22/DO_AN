import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { backendUrl } from "../App";
import { toast } from "react-toastify";

const SIZE_OPTIONS = ["S", "M", "L", "XL", "XXL"];

const Edit = ({ token }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Base fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [bestseller, setBestseller] = useState(false);
  const [sizes, setSizes] = useState([]);

  // Variants UI
  const [colorInput, setColorInput] = useState("");
  const [colors, setColors] = useState([]);
  const [colorImageFiles, setColorImageFiles] = useState({}); // new uploads only
  const [stockMatrix, setStockMatrix] = useState({}); // {color:{size:stock}}
  const [costMatrix, setCostMatrix] = useState({}); // {color:{size:cost}}

  // Restock (increment) matrix
  const [restockMatrix, setRestockMatrix] = useState({}); // {color:{size:increment}}
  const [restocking, setRestocking] = useState(false);

  // Legacy images (optional)
  const [legacyFiles, setLegacyFiles] = useState({
    image1: null,
    image2: null,
    image3: null,
    image4: null,
  });
  const [legacyPreview, setLegacyPreview] = useState({
    image1: null,
    image2: null,
    image3: null,
    image4: null,
  });

  const selectedSizes = useMemo(
    () => SIZE_OPTIONS.filter((s) => sizes.includes(s)),
    [sizes]
  );

  const fetchProduct = async () => {
    try {
      const response = await axios.post(backendUrl + "/api/product/single", {
        productId: id,
      });
      if (!response.data.success) {
        toast.error(response.data.message);
        return;
      }

      const p = response.data.product;
      setProduct(p);

      setName(p.name || "");
      setDescription(p.description || "");
      setPrice(p.price ?? "");
      setCategory(p.category || "");
      setSubCategory(p.subCategory || "");
      setBestseller(!!p.bestseller);

      const initialSizes = Array.isArray(p.sizes) && p.sizes.length ? p.sizes : [];
      setSizes(initialSizes);

      const initialColors =
        Array.isArray(p.colors) && p.colors.length
          ? p.colors
          : Object.keys(p.colorImages || {});
      setColors(initialColors);

      // Build matrices from variants
      const stock = {};
      const cost = {};
      (initialColors || []).forEach((c) => {
        stock[c] = {};
        cost[c] = {};
      });

      (p.variants || []).forEach((v) => {
        if (!stock[v.color]) stock[v.color] = {};
        if (!cost[v.color]) cost[v.color] = {};
        stock[v.color][v.size] = v.stock;
        cost[v.color][v.size] = v.cost ?? 0;
      });

      setStockMatrix(stock);
      setCostMatrix(cost);

      // Reset restock matrix
      const restock = {};
      (initialColors || []).forEach((c) => {
        restock[c] = {};
        (initialSizes || []).forEach((s) => {
          restock[c][s] = 0;
        });
      });
      setRestockMatrix(restock);

      // Reset new uploads
      setColorImageFiles({});
      setColorInput("");

      // Legacy preview from existing images
      setLegacyPreview({
        image1: p.image?.[0] || null,
        image2: p.image?.[1] || null,
        image3: p.image?.[2] || null,
        image4: p.image?.[3] || null,
      });
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addColor = () => {
    const c = colorInput.trim();
    if (!c) return;
    if (colors.includes(c)) {
      toast.error("Màu đã tồn tại");
      return;
    }
    setColors((prev) => [...prev, c]);
    setStockMatrix((prev) => ({ ...prev, [c]: prev[c] || {} }));
    setCostMatrix((prev) => ({ ...prev, [c]: prev[c] || {} }));
    setColorImageFiles((prev) => ({ ...prev, [c]: prev[c] || [] }));
    setRestockMatrix((prev) => ({ ...prev, [c]: prev[c] || {} }));
    setColorInput("");
  };

  const removeColor = (c) => {
    setColors((prev) => prev.filter((x) => x !== c));
    setStockMatrix((prev) => {
      const next = { ...prev };
      delete next[c];
      return next;
    });
    setCostMatrix((prev) => {
      const next = { ...prev };
      delete next[c];
      return next;
    });
    setColorImageFiles((prev) => {
      const next = { ...prev };
      delete next[c];
      return next;
    });
    setRestockMatrix((prev) => {
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

  const setCost = (color, size, value) => {
    const num = value === "" ? "" : Math.max(0, Number(value));
    setCostMatrix((prev) => ({
      ...prev,
      [color]: {
        ...(prev[color] || {}),
        [size]: num,
      },
    }));
  };

  const setRestock = (color, size, value) => {
    const num = value === "" ? "" : Math.max(0, Number(value));
    setRestockMatrix((prev) => ({
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
        const rawStock = stockMatrix?.[c]?.[s];
        const stock = Number(rawStock);
        const rawCost = costMatrix?.[c]?.[s];
        const cost = Number(rawCost);
        variants.push({
          color: c,
          size: s,
          stock: Number.isFinite(stock) ? stock : 0,
          cost: Number.isFinite(cost) ? cost : 0,
        });
      }
    }
    return variants;
  };

  const handleLegacyFile = (key, file) => {
    setLegacyFiles((prev) => ({ ...prev, [key]: file }));
    if (file) {
      setLegacyPreview((prev) => ({ ...prev, [key]: URL.createObjectURL(file) }));
    }
  };

  const submitRestock = async () => {
    try {
      setRestocking(true);

      const restockItems = [];
      for (const c of colors) {
        for (const s of selectedSizes) {
          const qty = Number(restockMatrix?.[c]?.[s] ?? 0);
          if (Number.isFinite(qty) && qty > 0) {
            restockItems.push({ color: c, size: s, quantity: qty });
          }
        }
      }

      if (restockItems.length === 0) {
        toast.info("Chưa nhập số lượng cần cộng thêm");
        return;
      }

      const response = await axios.post(
        backendUrl + "/api/product/restock",
        { productId: id, items: restockItems },
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success(response.data.message || "Nhập kho thành công");
        await fetchProduct();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setRestocking(false);
    }
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
      const hasExisting = !!(product?.colorImages?.[c]?.length);
      const hasNew = (colorImageFiles?.[c] || []).length > 0;
      if (!hasExisting && !hasNew) {
        toast.error(`Màu ${c} chưa có ảnh. Vui lòng upload ảnh cho màu này.`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateBeforeSubmit()) return;

    setIsLoading(true);
    try {
      const formData = new FormData();

      formData.append("productId", id);
      formData.append("name", name);
      formData.append("description", description);
      formData.append("price", price);
      formData.append("category", category);
      formData.append("subCategory", subCategory);
      formData.append("bestseller", bestseller.toString());

      formData.append("sizes", JSON.stringify(sizes));
      formData.append("colors", JSON.stringify(colors));
      formData.append("variants", JSON.stringify(buildVariants()));

      if (legacyFiles.image1) formData.append("image1", legacyFiles.image1);
      if (legacyFiles.image2) formData.append("image2", legacyFiles.image2);
      if (legacyFiles.image3) formData.append("image3", legacyFiles.image3);
      if (legacyFiles.image4) formData.append("image4", legacyFiles.image4);

      for (const c of colors) {
        const imgs = colorImageFiles[c] || [];
        imgs.forEach((file, idx) => {
          formData.append(`color_${c}_${idx}`, file);
        });
      }

      const response = await axios.post(backendUrl + "/api/product/edit", formData, {
        headers: { token, "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        toast.success(response.data.message);
        navigate("/list");
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

  if (!product) {
    return <div className="p-4">Đang tải...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl mb-4">Chỉnh sửa sản phẩm</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block mb-1">Tên sản phẩm</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border p-2 w-full"
            required
          />
        </div>

        <div>
          <label className="block mb-1">Mô tả</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border p-2 w-full"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block mb-1">Giá bán</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="border p-2 w-full"
              required
            />
          </div>
          <div>
            <label className="block mb-1">Danh mục</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="border p-2 w-full"
              required
            />
          </div>
          <div>
            <label className="block mb-1">Danh mục phụ</label>
            <input
              type="text"
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value)}
              className="border p-2 w-full"
              required
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={bestseller}
            onChange={() => setBestseller((prev) => !prev)}
            id="bestseller"
          />
          <label htmlFor="bestseller">Bestseller</label>
        </div>

        <div>
          <p className="mb-2 font-medium">Size</p>
          <div className="flex flex-wrap gap-2">
            {SIZE_OPTIONS.map((s) => (
              <button
                type="button"
                key={s}
                onClick={() =>
                  setSizes((prev) =>
                    prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
                  )
                }
                className={`px-3 py-1 border rounded text-sm ${
                  sizes.includes(s)
                    ? "bg-pink-100 border-pink-300"
                    : "bg-slate-200"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 font-medium">Màu (Colors)</p>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            <input
              value={colorInput}
              onChange={(e) => setColorInput(e.target.value)}
              className="flex-1 px-3 py-2 border"
              placeholder='Nhập màu, ví dụ: Black / Trắng / Đỏ...'
              type="text"
            />
            <button
              type="button"
              onClick={addColor}
              className="px-4 py-2 bg-black text-white rounded"
            >
              Thêm màu
            </button>
          </div>

          {colors.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {colors.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-2 px-3 py-1 border rounded bg-white"
                >
                  <b className="text-sm">{c}</b>
                  <button
                    type="button"
                    onClick={() => removeColor(c)}
                    className="text-xs text-red-600"
                  >
                    Xoá
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Stock matrix */}
        {colors.length > 0 && selectedSizes.length > 0 && (
          <div>
            <p className="mb-2 font-medium">Tồn kho theo Size x Màu (đặt đúng số hiện có)</p>
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
            <p className="text-xs text-gray-500 mt-2">Nhập 0 nếu biến thể không bán / hết hàng.</p>
          </div>
        )}

        {/* Cost matrix */}
        {colors.length > 0 && selectedSizes.length > 0 && (
          <div>
            <p className="mb-2 font-medium">Giá nhập theo Size x Màu</p>
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
                            value={costMatrix?.[c]?.[s] ?? 0}
                            onChange={(e) => setCost(c, s, e.target.value)}
                            className="w-28 px-2 py-1 border rounded"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 mt-2">Nhập giá nhập (VNĐ) cho từng biến thể.</p>
          </div>
        )}

        {/* Restock matrix (increment stock) */}
        {colors.length > 0 && selectedSizes.length > 0 && (
          <div>
            <p className="mb-2 font-medium">Nhập kho (cộng thêm)</p>
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
                            value={restockMatrix?.[c]?.[s] ?? 0}
                            onChange={(e) => setRestock(c, s, e.target.value)}
                            className="w-24 px-2 py-1 border rounded"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={submitRestock}
              className={`mt-3 px-4 py-2 rounded bg-black text-white text-sm ${
                restocking ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={restocking}
            >
              {restocking ? "Đang nhập kho..." : "NHẬP KHO (CỘNG THÊM)"}
            </button>

            <p className="text-xs text-gray-500 mt-2">
              Chỉ nhập số lượng cần cộng thêm. Ô nào để 0 sẽ không thay đổi.
            </p>
          </div>
        )}

        {/* Images per color */}
        {colors.length > 0 && (
          <div>
            <p className="mb-2 font-medium">Ảnh theo màu</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {colors.map((c) => (
                <div key={c} className="border rounded p-3 bg-white">
                  <p className="font-medium">Màu: {c}</p>

                  {(product?.colorImages?.[c]?.length || 0) > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {product.colorImages[c].slice(0, 6).map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt=""
                          className="w-16 h-16 object-cover rounded border"
                        />
                      ))}
                      {product.colorImages[c].length > 6 && (
                        <span className="text-xs text-gray-500">
                          +{product.colorImages[c].length - 6} ảnh
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mt-3">
                    <p className="text-sm text-gray-600">
                      Upload ảnh mới (nếu muốn thay/ghi đè màu này)
                    </p>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => onChangeColorImages(c, e.target.files)}
                      className="mt-2"
                    />
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(colorImageFiles[c] || []).slice(0, 6).map((f, idx) => (
                        <img
                          key={idx}
                          src={URL.createObjectURL(f)}
                          alt=""
                          className="w-16 h-16 object-cover rounded border"
                        />
                      ))}
                      {(colorImageFiles[c] || []).length > 6 && (
                        <span className="text-xs text-gray-500">
                          +{(colorImageFiles[c] || []).length - 6} ảnh
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legacy images (optional) */}
        <div>
          <p className="mb-2 font-medium">Ảnh chung (tuỳ chọn)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(["image1", "image2", "image3", "image4"]).map((k, idx) => (
              <div key={k}>
                <label className="block mb-1">Hình ảnh {idx + 1}</label>
                <input
                  type="file"
                  onChange={(e) =>
                    handleLegacyFile(k, e.target.files?.[0] || null)
                  }
                />
                {legacyPreview[k] ? (
                  <img
                    src={legacyPreview[k]}
                    alt={k}
                    className="w-24 mt-2 border rounded"
                  />
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className={`bg-blue-600 text-white p-2 rounded w-48 ${
            isLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={isLoading}
        >
          {isLoading ? "Đang cập nhật..." : "Cập nhật sản phẩm"}
        </button>
      </form>
    </div>
  );
};

export default Edit;
