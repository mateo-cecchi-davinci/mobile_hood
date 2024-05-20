import React from "react";
import { useNavigate } from "react-router-dom";
import { Button, Grid, Box } from "@mui/material";

const Buisnesses = () => {
  const navigate = useNavigate();

  const logout = () => {
    navigate("/logout");
  };

  return (
    <Grid
      container
      direction="column"
      alignItems="center"
      justifyContent="center"
      style={{ height: "100vh" }}
    >
      <Box>
        <div>Holis</div>
      </Box>
      <Box>
        <Button onClick={logout} variant="contained" color="primary">
          Cerrar sesion
        </Button>
      </Box>
    </Grid>
  );
};

export default Buisnesses;
