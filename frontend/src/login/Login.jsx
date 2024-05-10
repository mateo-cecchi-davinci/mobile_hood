import React, { useState } from "react";
import axios from "axios";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    axios
      .post("http://localhost:8800/login", { email, password })
      .then((res) => console.log(res))
      .catch((err) => console.log(err));
  }

  return (
    <div className="login">
      <div className="loginForm">
        <form onSubmit={handleSubmit}>
          <div className="inputHolder">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              placeholder="Enter Email"
              className="input"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="inputHolder">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              placeholder="Enter Password"
              className="input"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button className="loginButton">Login</button>
        </form>
      </div>
    </div>
  );
}

export default Login;
