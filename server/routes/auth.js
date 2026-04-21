const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');

// Реєстрація
router.post('/register', (req, res) => {
  const { username, email, password, age, weight, height } = req.body;

  const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (existingUser) {
    return res.status(400).json({ message: 'Користувач з таким email вже існує' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  const result = db.prepare(`
    INSERT INTO users (username, email, password, age, weight, height)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(username, email, hashedPassword, age, weight, height);

  const token = jwt.sign(
    { id: result.lastInsertRowid, username },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ token, username, id: result.lastInsertRowid });
});

// Вхід
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.status(400).json({ message: 'Невірний email або пароль' });
  }

  const isValid = bcrypt.compareSync(password, user.password);
  if (!isValid) {
    return res.status(400).json({ message: 'Невірний email або пароль' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ token, username: user.username, id: user.id });
});

// Отримання профілю
router.get('/profile', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Немає доступу' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = db.prepare('SELECT id, username, email, age, weight, height, goal_calories, goal_protein, goal_fat, goal_carbs, workouts_per_week, sex FROM users WHERE id = ?').get(decoded.id);
    res.json(user);
  } catch {
    res.status(401).json({ message: 'Невірний токен' });
  }
});

// Оновлення профілю
router.put('/profile', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Немає доступу' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { age, weight, height, goal_calories, goal_protein, goal_fat, goal_carbs, workouts_per_week, sex } = req.body;

      db.prepare(`
      UPDATE users SET
        age = ?,
        weight = ?,
        height = ?,
        goal_calories = ?,
        goal_protein = ?,
        goal_fat = ?,
        goal_carbs = ?,
        workouts_per_week = ?,
        sex = ?
      WHERE id = ?
    `).run(age, weight, height, goal_calories, goal_protein, goal_fat, goal_carbs, workouts_per_week, sex, decoded.id);

    const user = db.prepare('SELECT id, username, email, age, weight, height, goal_calories, goal_protein, goal_fat, goal_carbs, workouts_per_week, sex FROM users WHERE id = ?').get(decoded.id);
    res.json(user);
  } catch {
    res.status(401).json({ message: 'Невірний токен' });
  }
});

// Отримання норм користувача
router.get('/goals', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Немає доступу' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = db.prepare('SELECT goal_calories, goal_protein, goal_fat, goal_carbs, workouts_per_week, sex FROM users WHERE id = ?').get(decoded.id);
    res.json(user);
  } catch {
    res.status(401).json({ message: 'Невірний токен' });
  }
});

module.exports = router;