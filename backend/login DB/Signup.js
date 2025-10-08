import React, { useState } from "react";
import axios from "axios";

function Signup() {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    country: "",
    phone_number: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form data:", formData);

    try {
      const response = await axios.post(
        "http://localhost:8000/signup",
        formData,
        { headers: { "Content-Type": "application/json" } }
      );
      console.log("Response:", response.data);
      alert(response.data.message);
    } catch (error) {
      console.error("Error:", error.response ? error.response.data : error);
      alert(error.response?.data?.detail || "Er is iets misgegaan");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="first_name" placeholder="First Name" onChange={handleChange} />
      <input name="last_name" placeholder="Last Name" onChange={handleChange} />
      <input name="email" placeholder="Email" onChange={handleChange} />
      <input name="password" type="password" placeholder="Password" onChange={handleChange} />
      <input name="country" placeholder="Country" onChange={handleChange} />
      <input name="phone_number" placeholder="Phone Number" onChange={handleChange} />
      <button type="submit">Sign Up</button>
    </form>
  );
}

export default Signup;
