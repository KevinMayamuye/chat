import { useState } from "react";
import { Link } from "react-router-dom";

import { registerUser } from "../services/authService";

import "../styles/auth.css";

const Register = () => {

  const [formData, setFormData] = useState({
    username: "",
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

      const data = await registerUser(formData);

      console.log(data);

      alert("Registration successful");

    } catch (error) {

      alert(
        error.response?.data?.message ||
        "Registration failed"
      );
    }
  };


  return (
    <div className="auth-container">

      <form
        className="auth-form"
        onSubmit={handleSubmit}
      >

        <h2>Register</h2>

        <input
          type="text"
          name="username"
          placeholder="Username"
          onChange={handleChange}
        />

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
          Register
        </button>

        <p>
          Already have an account?
          <Link to="/">
            Login
          </Link>
        </p>

      </form>

    </div>
  );
};

export default Register;