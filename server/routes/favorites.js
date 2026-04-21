const express = require('express');
const router = express.Router();
const db = require('../database');
const authMiddleware = require('../middleware/auth');

// Отримати всі улюблені
router.get('/', authMiddleware, (req, res) => {
  const user_id = req.user.id;
  const favorites = db.prepare(`
    SELECT * FROM favorites WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(user_id);
  res.json(favorites);
});

// Додати в улюблене
router.post('/', authMiddleware, (req, res) => {
  const user_id = req.user.id;
  const { type, name, calories, protein, fat, carbs, duration } = req.body;

  // Перевірка чи вже існує
  const existing = db.prepare(`
    SELECT * FROM favorites WHERE user_id = ? AND name = ? AND type = ?
  `).get(user_id, name, type);

  if (existing) {
    return res.status(400).json({ message: 'Вже є в улюбленому!' });
  }

  const result = db.prepare(`
    INSERT INTO favorites (user_id, type, name, calories, protein, fat, carbs, duration)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(user_id, type, name, calories || 0, protein || 0, fat || 0, carbs || 0, duration || 0);

  res.json({ id: result.lastInsertRowid, message: 'Додано в улюблене!' });
});

// Видалити з улюбленого
router.delete('/:id', authMiddleware, (req, res) => {
  const user_id = req.user.id;
  const { id } = req.params;

  db.prepare(`
    DELETE FROM favorites WHERE id = ? AND user_id = ?
  `).run(id, user_id);

  res.json({ message: 'Видалено з улюбленого!' });
});

module.exports = router;