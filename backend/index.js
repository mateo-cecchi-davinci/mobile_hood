import express from "express";
import mysql from "mysql2";
import cors from "cors";
import { createRequire } from "module";
import { resolve } from "path";

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

// app.get("/books", (req, res) => {
//   const query = "SELECT * FROM books";

//   db.query(query, (err, data) => {
//     if (err) return res.json(err);
//     return res.json(data);
//   });
// });

// app.post("/books", (req, res) => {
//   const query =
//     "INSERT INTO books (`title`, `description`, `price`, `cover`) VALUES (?)";
//   const values = [
//     req.body.title,
//     req.body.description,
//     req.body.price,
//     req.body.cover,
//   ];

//   db.query(query, [values], (err, data) => {
//     if (err) return res.json(err);
//     return res.json("Book has been created successfully");
//   });
// });

// app.delete("/books/:id", (req, res) => {
//   const bookId = req.params.id;
//   const query = "DELETE FROM books WHERE id = ?";

//   db.query(query, [bookId], (err, data) => {
//     if (err) return res.json(err);
//     return res.json("Book has been deleted successfully");
//   });
// });

// app.put("/books/:id", (req, res) => {
//   const bookId = req.params.id;
//   const query =
//     "UPDATE books SET `title` = ?, `description` = ?, `price` = ?, `cover` = ? WHERE id = ?";
//   const values = [
//     req.body.title,
//     req.body.description,
//     req.body.price,
//     req.body.cover,
//   ];

//   db.query(query, [...values, bookId], (err, data) => {
//     if (err) return res.json(err);
//     return res.json("Book has been updated successfully");
//   });
// });

app.get("/user", authenticateToken, (req, res) => {
  const query = "SELECT 1 FROM users WHERE email = ?";
  db.query(query, [user.email], (err, data) => {
    if (err) return res.json(err);
    return res.json(data);
  });
});

app.post("/register", async (req, res) => {
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
      return res.json("User has been registered successfully");
    });
  } catch {
    res.status(500).send();
  }
});

app.post("/login", async (req, res) => {
  const query = "SELECT 1 FROM users WHERE email = ?";
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
  const query = "SELECT 1 FROM users WHERE refresh_token = ?";
  const refreshToken = req.body.token;

  if (refreshToken == null) return res.sendStatus(401);

  db.query(query, [refreshToken], (err, data) => {
    if (err) return res.json(err);
    if (data.length <= 0) return res.sendStatus(403);
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
      if (err) return res.sendStatus(403);
      const accessToken = generateAccessToken({ name: user.name });
      res.json({ accessToken: accessToken }); // <--- ESTO HAY QUE SACARLO
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

app.get("/buisnesses", (req, res) => {
  const query = "SELECT * FROM buisnesses";
  db.query(query, (err, data) => {
    if (err) return res.json(err);
    return res.json(data);
  });
});

app.post("/buisnesses", (req, res) => {
  const {
    name,
    logo,
    street,
    number,
    category,
    fk_buisnesses_users,
    products,
  } = req.body;

  if (
    !name ||
    !logo ||
    !street ||
    !number ||
    !category ||
    !fk_buisnesses_users ||
    !Array.isArray(products)
  ) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const userCheckQuery = "SELECT 1 FROM users WHERE user_id = ?";
  db.query(userCheckQuery, [fk_buisnesses_users], (err, result) => {
    if (err) return res.json(err);
    if (result.length === 0) return res.json("User not found");

    db.beginTransaction((err) => {
      if (err) return res.json(err);

      const buisness_query =
        "INSERT INTO buisnesses (`name`, `logo`, `street`, `number`, `category`, `fk_buisnesses_users`) VALUES (?)";
      const buisness_values = [
        name,
        logo,
        street,
        number,
        category,
        fk_buisnesses_users,
      ];

      db.query(buisness_query, [buisness_values], (err, data) => {
        if (err)
          return db.rollback(() => {
            res.json(err);
          });

        const inserted_buisness_id = data.insertId;
        const products_queries = products.map((product) => {
          const [product_id, stock] = product;
          return new Promise((resolve, reject) => {
            const productQuery =
              "INSERT INTO buisnesses_products (`fk_buisnesses_products_buisnesses`, `fk_buisnesses_products_products`, `stock`) VALUES (?, ?, ?)";
            db.query(
              productQuery,
              [inserted_buisness_id, product_id, stock],
              (err, result) => {
                if (err) return reject(err);
                resolve(result);
              }
            );
          });
        });

        Promise.all(products_queries)
          .then(() => {
            db.commit((err) => {
              if (err)
                return db.rollback(() => {
                  res.json("Transaction commit error");
                });
              res.json("Business created and products related successfully");
            });
          })
          .catch((err) => {
            db.rollback(() => {
              res.json("Failed to insert products for business: " + err);
            });
          });
      });
    });
  });
});

app.put("/buisnesses/:id", (req, res) => {
  const query =
    "UPDATE buisnesses SET `name` = ?, `logo` = ?, `street` = ?, `number` = ?, `category` = ?, `fk_buisnesses_users` = ? WHERE buisness_id = ?";
  const values = [
    req.body.name,
    req.body.logo,
    req.body.street,
    req.body.number,
    req.body.category,
    req.body.fk_buisnesses_users,
  ];
  db.query(query, [...values, req.params.id], (err, data) => {
    if (err) return res.json(err);
    return res.json("Buisness has been updated successfully");
  });
});

app.delete("/buisnesses/:id", (req, res) => {
  const query = "DELETE FROM buisnesses WHERE buisness_id = ?";
  db.query(query, [req.params.id], (err, data) => {
    if (err) return res.json(err);
    return res.json("Buisness deleted");
  });
});

app.get("/products", (req, res) => {
  const query = "SELECT * FROM products";
  db.query(query, (err, data) => {
    if (err) return res.json(err);
    return res.json(data);
  });
});

app.post("/products", (req, res) => {
  const query =
    "INSERT INTO products (`name`, `image`, `description`, `price`) VALUES (?)";
  const values = [
    req.body.name,
    req.body.image,
    req.body.description,
    req.body.price,
  ];
  db.query(query, [values], (err, data) => {
    if (err) return res.json(err);
    return res.json("Product has been created successfully");
  });
});

app.put("/products/:id", (req, res) => {
  const query =
    "UPDATE products SET `name` = ?, `image` = ?, `description` = ?, `price` = ? WHERE product_id = ?";
  const values = [
    req.body.name,
    req.body.image,
    req.body.description,
    req.body.price,
  ];
  db.query(query, [...values, req.params.id], (err, data) => {
    if (err) return res.json(err);
    return res.json("Product has been updated successfully");
  });
});

app.delete("/products/:id", (req, res) => {
  const query = "DELETE FROM products WHERE product_id = ?";
  db.query(query, [req.params.id], (err, data) => {
    if (err) return res.json(err);
    return res.json("Product deleted");
  });
});

app.get("/users", (req, res) => {
  const query = "SELECT * FROM users";
  db.query(query, (err, data) => {
    if (err) return res.json(err);
    return res.json(data);
  });
});

app.post("/users", async (req, res) => {
  try {
    const { name, lastname, email, password, is_manager } = req.body;

    if (!name || !lastname || !email || !password) {
      return res.json("All fields are required");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user_values = [
      name,
      lastname,
      email,
      hashedPassword,
      0,
      0,
      0,
      is_manager,
    ];

    db.beginTransaction((err) => {
      if (err) return res.json(err);

      const user_query =
        "INSERT INTO users (`name`, `lastname`, `email`, `password`, `failed_attempts`, `blocked`, `is_admin`, `is_manager`) VALUES (?)";

      db.query(user_query, [user_values], (err, data) => {
        if (err) return res.json(err);

        const inserted_user_id = data.insertId;

        const cupons_query = "SELECT cupon_id FROM cupons";
        db.query(cupons_query, (err, cupons) => {
          if (err) return res.json(err);

          const cupons_queries = cupons.map((cupon) => {
            return new Promise((resolve, reject) => {
              const cupons_users_query =
                "INSERT INTO cupons_users (`fk_cupons_users_users`, `fk_cupons_users_cupons`, `state`) VALUES (?, ?, ?)";
              db.query(
                cupons_users_query,
                [inserted_user_id, cupon.cupon_id, 0],
                (err, res) => {
                  if (err) return reject(err);
                  resolve(res);
                }
              );
            });
          });

          Promise.all(cupons_queries)
            .then(() => {
              db.commit((err) => {
                if (err)
                  return db.rollback(() => {
                    res.json("Transaction commit error");
                  });
                res.json("User created successfully");
              });
            })
            .catch((err) => {
              db.rollback(() => {
                res.json("Failed to insert cupons for users: " + err);
              });
            });
        });
      });
    });
  } catch {
    res.status(500).send();
  }
});

app.put("/users/:id", async (req, res) => {
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
      req.body.is_manager,
    ];
    const query =
      "UPDATE users " +
      "SET `name` = ?, `lastname` = ?, `email` = ?, `password` = ?, `failed_attempts` = ?, `blocked` = ?, `is_admin` = ?, `is_manager` = ? " +
      "WHERE user_id = ?";

    db.query(query, [...values, req.params.id], (err, data) => {
      if (err) return res.json(err);
      return res.json("User has been updated successfully");
    });
  } catch {
    res.status(500).send();
  }
});

app.delete("/users/:id", (req, res) => {
  const query = "DELETE FROM users WHERE user_id = ?";
  db.query(query, [req.params.id], (err, data) => {
    if (err) return res.json(err);
    return res.json("User deleted");
  });
});

app.get("/orders", (req, res) => {
  const query = "SELECT * FROM orders";
  db.query(query, (err, data) => {
    if (err) return res.json(err);
    return res.json(data);
  });
});

app.post("/orders", (req, res) => {
  const { code, fk_orders_users, products } = req.body;

  if (!code || !fk_orders_users || !Array.isArray(products)) {
    return res.status(400).json({ error: "All fields are required" });
  }

  db.beginTransaction((err) => {
    if (err) return res.json(err);

    const order_query =
      "INSERT INTO orders (`code`, `state`, `fk_orders_users`) VALUES (?)";
    const order_values = [code, "Pendent", fk_orders_users];
    db.query(order_query, [order_values], (err, data) => {
      if (err) return res.json(err);

      const inserted_order_id = data.insertId;

      const products_queries = products.map((product) => {
        const [product_id, amount] = product;
        return new Promise((resolve, reject) => {
          const product_query =
            "INSERT INTO orders_products (`fk_orders_products_orders`, `fk_orders_products_products`, `amount`) VALUES (?, ?, ?)";
          db.query(
            product_query,
            [inserted_order_id, product_id, amount],
            (err, res) => {
              if (err) return reject(err);
              resolve(res);
            }
          );
        });
      });

      Promise.all(products_queries)
        .then(() => {
          db.commit((err) => {
            if (err)
              return db.rollback(() => {
                res.json("Transaction commit error");
              });
            res.json("Order created successfully");
          });
        })
        .catch((err) => {
          db.rollback(() => {
            res.json("Failed to insert products for orders: " + err);
          });
        });
    });
  });
});

app.put("/orders/:id", (req, res) => {
  const query =
    "UPDATE orders SET `code` = ?, `state` = ?, `fk_orders_users` = ? WHERE order_id = ?";
  const values = [req.body.code, req.body.state, req.body.fk_orders_users];
  db.query(query, [...values, req.params.id], (err, data) => {
    if (err) return res.json(err);
    return res.json("Order has been updated successfully");
  });
});

app.delete("/orders/:id", (req, res) => {
  const query = "DELETE FROM orders WHERE order_id = ?";
  db.query(query, [req.params.id], (err, data) => {
    if (err) return res.json(err);
    return res.json("Order deleted");
  });
});

app.get("/cupons", (req, res) => {
  const query = "SELECT * FROM cupons";
  db.query(query, (err, data) => {
    if (err) return res.json(err);
    return res.json(data);
  });
});

app.post("/cupons", (req, res) => {
  const query = "INSERT INTO cupons (`category`) VALUES (?)";
  const values = [req.body.category];
  db.query(query, [values], (err, data) => {
    if (err) return res.json(err);
    return res.json("Cupon has been created successfully");
  });
});

app.put("/cupons/:id", (req, res) => {
  const query = "UPDATE cupons SET `category` = ? WHERE cupon_id = ?";
  const values = [req.body.category];
  db.query(query, [...values, req.params.id], (err, data) => {
    if (err) return res.json(err);
    return res.json("Cupon has been updated successfully");
  });
});

app.delete("/cupons/:id", (req, res) => {
  const query = "DELETE FROM cupons WHERE cupon_id = ?";
  db.query(query, [req.params.id], (err, data) => {
    if (err) return res.json(err);
    return res.json("Cupon deleted");
  });
});
