import React, { useState } from "react";
import { Grid, Paper, Avatar, TextField, Button } from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Register = () => {
  const paperStyle = {
    padding: 20,
    height: "auto",
    width: 280,
  };
  const avatarStyle = { backgroundColor: "black" };
  const btnStyle = { margin: "15px 0" };
  const marginBottom = { margin: "0 0 15px 0" };

  const [user, setUser] = useState({
    email: "",
    password: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setUser((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleClick = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:8800/register", user);
      navigate("/login");
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <Grid
      style={{
        height: "100vh",
        display: "grid",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Paper elevation={10} style={paperStyle}>
        <Grid align="center">
          <Avatar style={avatarStyle}>
            <LockIcon />
          </Avatar>
          <h2>Registrarse</h2>
        </Grid>
        <TextField
          label="Nombre"
          name="name"
          placeholder="Ingrese su nombre"
          style={marginBottom}
          onChange={handleChange}
          fullWidth
          required
        />
        <TextField
          label="Apellido"
          name="lastname"
          placeholder="Ingrese su apellido"
          style={marginBottom}
          onChange={handleChange}
          fullWidth
          required
        />
        <TextField
          label="Email"
          type="email"
          name="email"
          placeholder="Ingrese su email"
          style={marginBottom}
          onChange={handleChange}
          fullWidth
          required
        />
        <TextField
          label="Contraseña"
          type="password"
          name="password"
          placeholder="Ingrese su contraseña"
          onChange={handleChange}
          fullWidth
          required
        />
        <Button
          type="submit"
          color="primary"
          variant="contained"
          style={btnStyle}
          onClick={handleClick}
          fullWidth
        >
          Registrarse
        </Button>
      </Paper>
    </Grid>
  );
};

export default Register;
