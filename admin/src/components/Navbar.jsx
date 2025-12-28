import React from "react";
import { assets } from "../assets/assets";

const Navbar = ({ setToken }) => {
  return (
    <div className="flex items-center py-2 px-[4%] justify-between">
      <img className="w-[max(10%,80px)]" src={assets.loogo} alt="" />
      <button
        onClick={() => {
          localStorage.removeItem("adminToken");
          setToken("");
        }}
        className="bg-gray-600 text-white px-5 py-2 sm:px-7 sm:py-2 rounded-full text-xs sm:text-sm"
      >
        Đăng Xuất
      </button>
    </div>
  );
};

export default Navbar;
