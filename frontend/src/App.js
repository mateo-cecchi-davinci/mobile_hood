import { BrowserRouter, Routes, Route } from "react-router-dom";

import Books from "./books/Books";
import Add from "./books/Add";
import Update from "./books/Update";
import "./books/style.css";

import Login from "./login/Login";
import "./login/styles.css";

function App() {
  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/books" element={<Books />} />
          <Route path="/add" element={<Add />} />
          <Route path="/update/:id" element={<Update />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
