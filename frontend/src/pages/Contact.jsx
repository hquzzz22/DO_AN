import React from "react";
import Title from "../components/Title";
import { assets } from "../assets/assets";
import NewsletterBox from "../components/NewsletterBox";

const Contact = () => {
  return (
    <div>
      <div className="text-center text-2xl pt-10 border-t">
        <Title text1={"LIÊN HỆ VỚI"} text2={"CHÚNG TÔI"} />
      </div>

      <div className="my-10 flex flex-col justify-center md:flex-row gap-10 mb-28">
        <img
          className="w-full md:max-w-[480px]"
          src={assets.contact_img}
          alt=""
        />
        <div className="flex flex-col justify-center items-start gap-6">
          <p className="font-semibold text-xl text-gray-600">Cửa Hàng</p>
          <p className=" text-gray-500">
            Cao Hảo, Hướng Đạo <br /> Tam Dương, Vĩnh Phúc, Việt Nam
          </p>
          <p className=" text-gray-500">
            Tel: (+84) 325957707 <br /> Email: hoangquyk23hubt@gmail.com
          </p>
          <p className="font-semibold text-xl text-gray-600">Khám phá Shop</p>

          <button className="border border-black px-8 py-4 text-sm hover:bg-black hover:text-white transition-all duration-500">
            Shop
          </button>
        </div>
      </div>

      <NewsletterBox />
    </div>
  );
};

export default Contact;
