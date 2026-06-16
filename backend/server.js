import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { connection } from "./connectDB.js";

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// ==================== РЕГИСТРАЦИЯ ====================
app.post("/register", async (req, res) => {
  const { login, password, full_name, phone, email } = req.body;

  try {
    // Проверка уникальности логина
    const [existingUser] = await connection.promise().query(
      "SELECT id FROM user WHERE login = ?",
      [login]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ error: "Пользователь с таким логином уже существует" });
    }

    const sql = `
      INSERT INTO user(id_role, login, password, full_name, phone, email) 
      VALUES(1, ?, ?, ?, ?, ?)
    `;
    const values = [login, password, full_name, phone, email];

    const [results] = await connection.promise().query(sql, values);
    res.json({ success: true, userId: results.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== АВТОРИЗАЦИЯ ====================
app.post("/login", async (req, res) => {
  const { login, password } = req.body;

  try {
    const sql = "SELECT * FROM user WHERE login = ? AND password = ?";
    const [results] = await connection.promise().query(sql, [login, password]);

    if (results.length === 0) {
      return res.status(401).json({ error: "Неверный логин или пароль" });
    }

    const user = results[0];
    // Не возвращаем пароль в ответе
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== КУРСЫ ====================
app.get("/courses", (req, res) => {
  connection.query("SELECT id, name FROM course", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// ==================== СПОСОБЫ ОПЛАТЫ ====================
app.get("/payment-methods", (req, res) => {
  connection.query("SELECT id, name FROM payment_method", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// ==================== МАСТЕРА/ПРЕПОДАВАТЕЛИ ====================
app.get("/masters", (req, res) => {
  connection.query("SELECT id, name FROM master", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// ==================== СТАТУСЫ ====================
app.get("/statuses", (req, res) => {
  connection.query("SELECT id, code, name FROM status", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// ==================== СОЗДАНИЕ ЗАЯВКИ ====================
app.post("/requests", (req, res) => {
  const { id_user, id_master, id_course, id_payment_method, booking_datetime } = req.body;
  
  const sql = `
    INSERT INTO request (id_user, id_master, id_course, id_payment_method, id_status, booking_datetime) 
    VALUES (?, ?, ?, ?, 1, ?)
  `;
  
  connection.query(
    sql,
    [id_user, id_master, id_course, id_payment_method, booking_datetime],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, requestId: results.insertId });
    }
  );
});

// ==================== ЗАЯВКИ ПОЛЬЗОВАТЕЛЯ ====================
app.get("/requests/user/:userId", (req, res) => {
  const sql = `
    SELECT r.id, r.booking_datetime, 
           c.name as course_name, 
           m.name as master_name, 
           s.name as status_name,
           pm.name as payment_method_name
    FROM request r
    JOIN course c ON r.id_course = c.id
    JOIN master m ON r.id_master = m.id
    JOIN status s ON r.id_status = s.id
    JOIN payment_method pm ON r.id_payment_method = pm.id
    WHERE r.id_user = ?
    ORDER BY r.booking_datetime DESC
  `;
  
  connection.query(sql, [req.params.userId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// ==================== ЗАЯВКИ АДМИНА ====================
app.get("/requests/admin", (req, res) => {
  const sql = `
    SELECT r.id, r.booking_datetime, r.id_status,
           u.full_name as user_full_name, u.phone as user_phone,
           c.name as course_name,
           m.name as master_name,
           pm.name as payment_method_name
    FROM request r
    JOIN user u ON r.id_user = u.id
    JOIN course c ON r.id_course = c.id
    JOIN master m ON r.id_master = m.id
    JOIN payment_method pm ON r.id_payment_method = pm.id
    ORDER BY r.booking_datetime DESC
  `;
  
  connection.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// ==================== ИЗМЕНЕНИЕ СТАТУСА ЗАЯВКИ ====================
app.put("/requests/:requestId/status", (req, res) => {
  const { id_status } = req.body;
  const sql = "UPDATE request SET id_status = ? WHERE id = ?";
  
  connection.query(sql, [id_status, req.params.requestId], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.listen(3001, function () {
  console.log("web server listening on port 3001");
});