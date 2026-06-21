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
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== СПРАВОЧНИКИ ====================
app.get("/courses", (req, res) => {
  connection.query("SELECT id, name FROM course", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.get("/payment-methods", (req, res) => {
  connection.query("SELECT id, name FROM payment_method", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.get("/masters", (req, res) => {
  connection.query("SELECT id, name FROM master", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.get("/statuses", (req, res) => {
  connection.query("SELECT id, code, name FROM status", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// ==================== СОЗДАНИЕ ЗАЯВКИ (обновлено под новое ТЗ) ====================
app.post("/requests", (req, res) => {
  const { id_user, course_name, payment_method, booking_datetime } = req.body;

  // Валидация входных данных
  if (!id_user || !course_name || !payment_method || !booking_datetime) {
    return res.status(400).json({ error: "Не все поля заполнены" });
  }

  const sql = `
    INSERT INTO request (id_user, course_name, payment_method, id_status, booking_datetime) 
    VALUES (?, ?, ?, 1, ?)
  `;

  connection.query(
    sql,
    [id_user, course_name, payment_method, booking_datetime],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, requestId: results.insertId });
    }
  );
});

// ==================== ЗАЯВКИ ПОЛЬЗОВАТЕЛЯ ====================
app.get("/requests/user/:userId", (req, res) => {
  const sql = `
    SELECT r.id, r.booking_datetime, r.course_name, r.payment_method,
           s.name as status_name
    FROM request r
    JOIN status s ON r.id_status = s.id
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
           r.course_name, r.payment_method,
           s.code as status_code,
           u.full_name as user_full_name, u.phone as user_phone
    FROM request r
    JOIN user u ON r.id_user = u.id
    JOIN status s ON r.id_status = s.id
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

// ==================== СОЗДАНИЕ ОТЗЫВА ====================
app.post("/reviews", (req, res) => {
  const { id_request, id_user, rating, comment } = req.body;

  // Проверка существования заявки
  const checkRequestSql = "SELECT id FROM request WHERE id = ? AND id_user = ?";
  connection.query(checkRequestSql, [id_request, id_user], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) {
      return res.status(404).json({ error: "Заявка не найдена" });
    }

    // Проверка, что отзыв ещё не оставляли
    const checkReviewSql = "SELECT id FROM review WHERE id_request = ?";
    connection.query(checkReviewSql, [id_request], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (results.length > 0) {
        return res.status(400).json({ error: "Отзыв для этой заявки уже существует" });
      }

      const sql = `
        INSERT INTO review (id_request, id_user, rating, comment) 
        VALUES (?, ?, ?, ?)
      `;

      connection.query(sql, [id_request, id_user, rating, comment], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, reviewId: results.insertId });
      });
    });
  });
});

// ==================== ОТЗЫВЫ ПОЛЬЗОВАТЕЛЯ ====================
app.get("/reviews/user/:userId", (req, res) => {
  const sql = `
    SELECT rev.id, rev.id_request, rev.rating, rev.comment, rev.created_at,
           r.course_name
    FROM review rev
    JOIN request r ON rev.id_request = r.id
    WHERE rev.id_user = ?
    ORDER BY rev.created_at DESC
  `;

  connection.query(sql, [req.params.userId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// ==================== ВСЕ ОТЗЫВЫ ДЛЯ АДМИНА ====================
app.get("/reviews/admin", (req, res) => {
  const sql = `
    SELECT rev.id, rev.rating, rev.comment, rev.created_at,
           u.full_name as user_full_name,
           r.course_name
    FROM review rev
    JOIN user u ON rev.id_user = u.id
    JOIN request r ON rev.id_request = r.id
    ORDER BY rev.created_at DESC
  `;

  connection.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.listen(3001, function () {
  console.log("web server listening on port 3001");
});