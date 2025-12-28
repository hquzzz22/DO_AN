import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";
import { toast } from "react-toastify";
import validator from "validator";

const Login = () => {
  //Biến currentState có thể có 3 giá trị: "Login", "Sign Up", hoặc "Forgot Password".
  const [currentState, setCurrentState] = useState("Login");
  const { token, setToken, navigate, backendUrl } = useContext(ShopContext);

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    if (isLoading) return; // Ngăn gửi lại khi đang xử lý

    setIsLoading(true);
    try {
      if (currentState === "Sign Up") {
        // Kiểm tra định dạng trước khi gửi
        if (!validator.isEmail(email)) {
          toast.error("Vui lòng nhập email hợp lệ");
          setIsLoading(false);
          return;
        }
        if (password.length < 8) {
          toast.error("Mật khẩu phải có ít nhất 8 ký tự");
          setIsLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          toast.error("Mật khẩu xác nhận không khớp");
          setIsLoading(false);
          return;
        }

        const response = await axios.post(backendUrl + "/api/user/register", {
          name,
          email,
          password,
        });
        if (response.data.success) {
          setToken(response.data.token);
          localStorage.setItem("token", response.data.token);
          toast.success("Đăng ký thành công!");
        } else {
          toast.error(response.data.message);
        }
      } else if (currentState === "Login") {
        // Kiểm tra định dạng trước khi gửi
        if (!validator.isEmail(email)) {
          toast.error("Vui lòng nhập email hợp lệ");
          setIsLoading(false);
          return;
        }
        if (!password) {
          toast.error("Vui lòng nhập mật khẩu");
          setIsLoading(false);
          return;
        }

        const response = await axios.post(backendUrl + "/api/user/login", {
          email,
          password,
        });
        if (response.data.success) {
          setToken(response.data.token);
          localStorage.setItem("token", response.data.token);
          toast.success("Đăng nhập thành công!");
        } else {
          toast.error(response.data.message);
        }
      } else if (currentState === "Forgot Password") {
        // Kiểm tra định dạng email
        if (!validator.isEmail(forgotPasswordEmail)) {
          toast.error("Vui lòng nhập email hợp lệ");
          setIsLoading(false);
          return;
        }

        const response = await axios.post(
          backendUrl + "/api/user/forgot-password",
          { email: forgotPasswordEmail }
        );
        if (response.data.success) {
          toast.success("Link đặt lại mật khẩu đã được gửi đến email của bạn");
          setCurrentState("Login");
          setForgotPasswordEmail("");
        } else {
          toast.error(response.data.message);
        }
      }
    } catch (error) {
      console.log(error);
      toast.error(
        error.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      navigate("/");
    }
  }, [token, navigate]);

  return (
    <form
      onSubmit={onSubmitHandler}
      className="flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-14 gap-4 text-gray-800"
    >
      <div className="inline-flex items-center gap-2 mb-2 mt-10">
        <p className="prata-regular text-3xl">
          {currentState === "Login"
            ? "Đăng nhập"
            : currentState === "Sign Up"
            ? "Đăng ký"
            : "Quên mật khẩu"}
        </p>
        <hr className="border-none h-[1.5px] w-8 bg-gray-800" />
      </div>
      {currentState === "Forgot Password" ? (
        <>
          <input
            onChange={(e) => setForgotPasswordEmail(e.target.value)}
            value={forgotPasswordEmail}
            type="email"
            className="w-full px-3 py-2 border border-gray-800"
            placeholder="Nhập email của bạn"
            required
          />
          <div className="w-full flex justify-between text-sm mt-[-8px]">
            <p
              onClick={() => setCurrentState("Login")}
              className="cursor-pointer hover:text-blue-600"
            >
              Quay lại đăng nhập
            </p>
          </div>
          <button
            className="bg-black text-white font-light px-8 py-2 mt-4 disabled:bg-gray-500"
            disabled={isLoading}
          >
            {isLoading ? "Đang gửi..." : "Gửi link đặt lại"}
          </button>
        </>
      ) : (
        <>
          {currentState === "Sign Up" && (
            <input
              onChange={(e) => setName(e.target.value)}
              value={name}
              type="text"
              className="w-full px-3 py-2 border border-gray-800"
              placeholder="Họ và tên"
              required
            />
          )}
          <input
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            type="email"
            className="w-full px-3 py-2 border border-gray-800"
            placeholder="Email"
            required
          />
          <input
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            type="password"
            className="w-full px-3 py-2 border border-gray-800"
            placeholder="Mật khẩu"
            required
          />
          {currentState === "Sign Up" && (
            <input
              onChange={(e) => setConfirmPassword(e.target.value)}
              value={confirmPassword}
              type="password"
              className="w-full px-3 py-2 border border-gray-800"
              placeholder="Xác nhận mật khẩu"
              required
            />
          )}
          <div className="w-full flex justify-between text-sm mt-[-8px]">
            <p
              onClick={() => setCurrentState("Forgot Password")}
              className="cursor-pointer hover:text-blue-600"
            >
              Quên mật khẩu?
            </p>
            {currentState === "Login" ? (
              <p
                onClick={() => setCurrentState("Sign Up")}
                className="cursor-pointer hover:text-blue-600"
              >
                Tạo tài khoản
              </p>
            ) : (
              <p
                onClick={() => setCurrentState("Login")}
                className="cursor-pointer hover:text-blue-600"
              >
                Đã có tài khoản? Đăng nhập
              </p>
            )}
          </div>
          <button
            className="bg-black text-white font-light px-8 py-2 mt-4 disabled:bg-gray-500"
            disabled={isLoading}
          >
            {isLoading
              ? "Đang xử lý..."
              : currentState === "Login"
              ? "Đăng nhập"
              : "Đăng ký"}
          </button>
        </>
      )}
    </form>
  );
};

export default Login;
