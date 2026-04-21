const express = require('express');
const router = express.Router();
const db = require('../database');
const authMiddleware = require('../middleware/auth');

// Додати прийом їжі
router.post('/', authMiddleware, (req, res) => {
  const { name, calories, protein, carbs, fat, date } = req.body;
  const user_id = req.user.id;

  const result = db.prepare(`
    INSERT INTO food_logs (user_id, name, calories, protein, carbs, fat, date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(user_id, name, calories, protein || 0, carbs || 0, fat || 0, date);

  res.json({ id: result.lastInsertRowid, message: 'Прийом їжі додано!' });
});

// Отримати всі прийоми їжі за датою
router.get('/:date', authMiddleware, (req, res) => {
  const user_id = req.user.id;
  const { date } = req.params;

  const logs = db.prepare(`
    SELECT * FROM food_logs WHERE user_id = ? AND date = ?
    ORDER BY created_at DESC
  `).all(user_id, date);

  res.json(logs);
});

// Отримати всю історію їжі
router.get('/', authMiddleware, (req, res) => {
  const user_id = req.user.id;

  const logs = db.prepare(`
    SELECT * FROM food_logs WHERE user_id = ?
    ORDER BY date DESC
  `).all(user_id);

  res.json(logs);
});

// Видалити прийом їжі
router.delete('/:id', authMiddleware, (req, res) => {
  const user_id = req.user.id;
  const { id } = req.params;

  db.prepare(`
    DELETE FROM food_logs WHERE id = ? AND user_id = ?
  `).run(id, user_id);

  res.json({ message: 'Запис видалено!' });
});

module.exports = router;