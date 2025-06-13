import React from "react";
import { NavLink } from "react-router-dom";
import { assets } from "../assets/assets";

const Sidebar = () => {
  return (
    <div className="w-[18%] min-h-screen border-r-2">
      <div className="flex flex-col gap-4 pt-6 pl-[20%] text-[15px]">
        <NavLink
          className="flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l"
          to="/add"
        >
          <img className="w-5 h-5" src={assets.add_icon} alt="Add Product" />
          <p className="hidden md:block">Thêm sản phẩm</p>
        </NavLink>

        <NavLink
          className="flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l"
          to="/list"
        >
          <img className="w-5 h-5" src={assets.order_icon} alt="Product List" />
          <p className="hidden md:block">Danh sách sản phẩm</p>
        </NavLink>

        <NavLink
          className="flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l"
          to="/orders"
        >
          <img className="w-5 h-5" src={assets.order_icon} alt="Orders" />
          <p className="hidden md:block">Đơn hàng</p>
        </NavLink>

        <NavLink
          className="flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l"
          to="/search-orders"
        >
          <img
            className="w-5 h-5"
            src={assets.order_icon}
            alt="Search Orders"
          />
          <p className="hidden md:block">Tìm kiếm đơn hàng</p>
        </NavLink>

        <NavLink
          className="flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l"
          to="/manage-users"
        >
          <img className="w-5 h-5" src={assets.order_icon} alt="Manage Users" />
          <p className="hidden md:block">Quản lý người dùng</p>
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;
