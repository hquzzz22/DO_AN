import React from "react";
import { assets } from "../assets/assets";

const Footer = () => {
  return (
    <div>
      <div className="flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm">
        <div>
          <img src={assets.looogo} className="mb-5 w-32" alt="" />
          <p className="w-full md:w-2/3 text-gray-600">
            DC: khu 2 Hướng Đạo - Tam Dương - Vĩnh Phúc
            <br />
            SĐT: +84 325 957 707 <br />
            Email: hoangquyk23hubt@gmail.com
          </p>
        </div>

        <div>
          <p className="text-xl font-medium mb-5">Công Ty</p>
          <ul className="flex flex-col gap-1 text-gray-600">
            <li>Home</li>
            <li>Về Chúng Tôi</li>
            <li>Cửa Hàng</li>
            <li>Hỗ trợ </li>
          </ul>
        </div>

        <div>
          <p className="text-xl font-medium mb-5">Liên Hệ</p>
          <ul className="flex flex-col gap-1 text-gray-600">
            <li>SĐT: +84 325 957 707 </li>
            <li>hoangquyk23hubt@gmail.com</li>
          </ul>
        </div>
      </div>

      <div>
        <hr />
        <p className="py-5 text-sm text-center">
          Bản quyền thuộc về Trần Hoàng Quy TT&MMTK14A
        </p>
      </div>
    </div>
  );
};

export default Footer;
