import { useState } from "react";
import { Link } from "react-router-dom";

import { loginUser } from "../services/authService";

import "../styles/auth.css";

const Login = () => {

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    try {

      const data = await loginUser(formData);

      console.log(data);

      localStorage.setItem(
        "userInfo",
        JSON.stringify(data)
      );

      alert("Login successful");

    } catch (error) {

      alert(
        error.response?.data?.message ||
        "Login failed"
      );
    }
  };


  return (
    <div className="auth-container">

      <form
        className="auth-form"
        onSubmit={handleSubmit}
      >

        <h2>Login</h2>

        <input
          type="email"
          name="email"
          placeholder="Email"
          onChange={handleChange}
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
        />

        <button type="submit">
          Login
        </button>

        <p>
          Don't have an account?
          <Link to="/register">
            Register
          </Link>
        </p>

      </form>

    </div>
  );
};

export default Login;