import React from "react";
import Title from "../components/Title";
import { assets } from "../assets/assets";
import NewsletterBox from "../components/NewsletterBox";

const About = () => {
  return (
    <div>
      <div className="text-2xl text-center pt-8 border-t">
        <Title text1={"VỀ"} text2={"CHÚNG TÔI"} />
      </div>

      <div className="my-10 flex flex-col md:flex-row gap-16">
        <img
          className="w-full md:max-w-[450px]"
          src={assets.about_img}
          alt=""
        />
        <div className="flex flex-col justify-center gap-6 md:w-2/4 text-gray-600">
          <p>
            SLOOP là tuyên ngôn của những tâm hồn tự do và đầy phong cách. Được
            thành lập với tinh thần phá cách, bền vững và cá tính, SLOOP mang
            đến những thiết kế thời trang hiện đại, tối giản nhưng đầy tinh tế –
            dành cho những ai không ngại thể hiện bản thân theo cách riêng.
          </p>
          <p>
            Chúng tôi tin rằng thời trang không chỉ là lớp vỏ bên ngoài, mà là
            ngôn ngữ của nội tâm, là tuyên ngôn sống động cho cá tính và giá trị
            cá nhân. Mỗi thiết kế của SLOOP là sự kết hợp giữa chất liệu chất
            lượng, phom dáng linh hoạt và cảm hứng nghệ thuật đậm nét đường phố,
            nghệ thuật đương đại và sự tối giản mang bản sắc riêng.
          </p>
          <b className="text-gray-800">Our Mission</b>
          <p>
            SLOOP không chạy theo xu hướng. Chúng tôi tạo nên không gian để bạn
            viết nên phong cách của chính mình.
          </p>
        </div>
      </div>

      <div className=" text-xl py-4">
        <Title text1={"TẠI SAO CHỌN"} text2={"CHÚNG TÔI"} />
      </div>

      <div className="flex flex-col md:flex-row text-sm mb-20">
        <div className="border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5">
          <b>Đảm bảo chất lượng:</b>
          <p className=" text-gray-600">
            Chúng tôi chọn lọc một cách tỉ mỉ kiểm tra kĩ mỗi sản phẩm để đảm
            bảo nó đáp ứng các tiêu chuẩn chất lượng nghiêm ngặt của chúng tôi.
          </p>
        </div>
        <div className="border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5">
          <b>Sự tiện lợi:</b>
          <p className=" text-gray-600">
            Với giao diện thân thiện với người dùng và quy trình đặt hàng không
            rắc rối, mua sắm chưa bao giờ dễ dàng hơn.
          </p>
        </div>
        <div className="border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5">
          <b>Dịch vụ khách hàng đặc biệt:</b>
          <p className=" text-gray-600">
            Our team of dedicated professionals is here to assist you the way,
            ensuring your satisfaction is our top priority.
          </p>
        </div>
      </div>

      <NewsletterBox />
    </div>
  );
};

export default About;
