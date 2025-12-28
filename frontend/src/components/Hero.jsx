import React from "react";
import { assets } from "../assets/assets";
import { NavLink } from "react-router-dom";
// Thành phần này hiển thị hình ảnh nền và văn bản chào mừng cho trang chủ.
const Hero = () => {
  return (
    <div className="relative w-full h-screen overflow-hidden ">
      {/* Hero Image */}
      <img
        className="absolute inset-0 w-full h-full object-cover z-0"
        src={assets.bgr11}
        alt="Hero Background"
      />
      {/* Hero Text */}
      <div className="absolute inset-0 z-10 flex items-center justify-center sm:justify-start sm:pl-10 md:pl-16 lg:pl-20">
        <div className="text-white flex flex-col items-center sm:items-start text-center sm:text-left bg-black bg-opacity-40 p-4 rounded-md">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <p className="w-8 md:w-11 h-[2px] bg-white"></p>
            <p className="font-medium text-sm md:text-base">OUR BESTSELLERS</p>
          </div>
          <h1 className="prata-regular text-3xl sm:py-3 lg:text-5xl leading-relaxed">
            SẢN PHẨM MỚI
          </h1>
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <NavLink
              to="/collection"
              className="flex btn flex-col items-center gap-1 bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow"
            >
              <p className="font-semibold text-sm  md:text-base">CỬA HÀNG</p>
              <hr className="w-2/4 border-none h-[1.5px] bg-gray-300 sm:hidden" />
            </NavLink>
            <p className="w-8 md:w-11 h-[1px] bg-white"></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
