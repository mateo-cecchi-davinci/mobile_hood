import express from "express";
import mysql from "mysql2";
import cors from "cors";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const app = express();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

let user = null;

require("dotenv").config();

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Mateocecchi112324",
  database: "mobile_hood",
});

//middlewares
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.json("hello this is the backend");
});

app.listen(8800, () => {
  console.log("Connected to backend");
});

app.get("/books", (req, res) => {
  const query = "SELECT * FROM books";

  db.query(query, (err, data) => {
    if (err) return res.json(err);
    return res.json(data);
  });
});

app.post("/books", (req, res) => {
  const query =
    "INSERT INTO books (`title`, `description`, `price`, `cover`) VALUES (?)";
  const values = [
    req.body.title,
    req.body.description,
    req.body.price,
    req.body.cover,
  ];

  db.query(query, [values], (err, data) => {
    if (err) return res.json(err);
    return res.json("Book has been created successfully");
  });
});

app.delete("/books/:id", (req, res) => {
  const bookId = req.params.id;
  const query = "DELETE FROM books WHERE id = ?";

  db.query(query, [bookId], (err, data) => {
    if (err) return res.json(err);
    return res.json("Book has been deleted successfully");
  });
});

app.put("/books/:id", (req, res) => {
  const bookId = req.params.id;
  const query =
    "UPDATE books SET `title` = ?, `description` = ?, `price` = ?, `cover` = ? WHERE id = ?";
  const values = [
    req.body.title,
    req.body.description,
    req.body.price,
    req.body.cover,
  ];

  db.query(query, [...values, bookId], (err, data) => {
    if (err) return res.json(err);
    return res.json("Book has been updated successfully");
  });
});

app.get("/users", authenticateToken, (req, res) => {
  const query = "SELECT * FROM users WHERE email = ?";
  db.query(query, [user.email], (err, data) => {
    if (err) return res.json(err);
    return res.json(data);
  });
});

app.post("/users", async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const values = [
      req.body.name,
      req.body.lastname,
      req.body.email,
      hashedPassword,
      0,
      0,
      0,
      0,
    ];
    const query =
      "INSERT INTO users (`name`, `lastname`, `email`, `password`, `failed_attempts`, `blocked`, `is_admin`, `is_manager`) VALUES (?)";

    db.query(query, [values], (err, data) => {
      if (err) return res.json(err);
      return res.json("User has been created successfully");
    });
  } catch {
    res.status(500).send();
  }
});

app.post("/login", async (req, res) => {
  const query = "SELECT * FROM users WHERE email = ?";
  db.query(query, [req.body.email], async (err, data) => {
    if (err) return res.json(err);
    if (data == null) {
      return res.status(400).send("Cannot find user");
    }

    try {
      if (await bcrypt.compare(req.body.password, data[0].password)) {
        user = data[0];
        const accessToken = generateAccessToken(user);
        const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);
        const query = "UPDATE users SET `refresh_token` = ? WHERE user_id = ?";

        db.query(query, [refreshToken, user.user_id], (err, data) => {
          if (err) return res.json(err);
          return;
        });

        res.json({ accessToken: accessToken, refreshToken: refreshToken }); // ESTO DESPUES HAY QUE SACARLO
      } else {
        res.send("Not Allowed");
      }
    } catch {
      return res.status(500).send();
    }
  });
});

function authenticateToken(req, res, next) {
  const authHeader = req.body.Authorization;
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

function generateAccessToken(user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "30m" });
}

app.post("/token", (req, res) => {
  const query = "SELECT * FROM users WHERE refresh_token = ?";
  const refreshToken = req.body.token;

  if (refreshToken == null) return res.sendStatus(401);

  db.query(query, [refreshToken], (err, data) => {
    if (err) return res.json(err);
    if (data.length <= 0) return res.sendStatus(403);
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
      if (err) return res.sendStatus(403);
      const accessToken = generateAccessToken({ name: user.name });
      res.json({ accessToken: accessToken });
    });
  });
});

app.put("/logout", (req, res) => {
  const query = "UPDATE users SET `refresh_token` = ? WHERE refresh_token = ?";
  db.query(query, [null, req.body.token], (err, data) => {
    if (err) return res.json(err);
    return res.sendStatus(204);
  });
});
