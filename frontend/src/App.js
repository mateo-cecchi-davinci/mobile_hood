import { BrowserRouter, Routes, Route } from "react-router-dom";

import Books from "./books/Books";
import Add from "./books/Add";
import Update from "./books/Update";
import "./books/style.css";

import Login from "./main/Login/Login";
import Register from "./main/Register/Register";
import Buisnesses from "./main/Buisnesses/Buisnesses";

function App() {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/books" element={<Books />} />
          <Route path="/add" element={<Add />} />
          <Route path="/update/:id" element={<Update />} />

          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/buisnesses" element={<Buisnesses />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
