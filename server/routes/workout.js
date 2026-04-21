const express = require('express');
const router = express.Router();
const db = require('../database');
const authMiddleware = require('../middleware/auth');

// Додати тренування
router.post('/', authMiddleware, (req, res) => {
  const { name, duration, calories_burned, date } = req.body;
  const user_id = req.user.id;

  const result = db.prepare(`
    INSERT INTO workout_logs (user_id, name, duration, calories_burned, date)
    VALUES (?, ?, ?, ?, ?)
  `).run(user_id, name, duration, calories_burned || 0, date);

  res.json({ id: result.lastInsertRowid, message: 'Тренування додано!' });
});

// Отримати всі тренування за датою
router.get('/:date', authMiddleware, (req, res) => {
  const user_id = req.user.id;
  const { date } = req.params;

  const logs = db.prepare(`
    SELECT * FROM workout_logs WHERE user_id = ? AND date = ?
    ORDER BY created_at DESC
  `).all(user_id, date);

  res.json(logs);
});

// Отримати всю історію тренувань
router.get('/', authMiddleware, (req, res) => {
  const user_id = req.user.id;

  const logs = db.prepare(`
    SELECT * FROM workout_logs WHERE user_id = ?
    ORDER BY date DESC
  `).all(user_id);

  res.json(logs);
});

// Видалити тренування
router.delete('/:id', authMiddleware, (req, res) => {
  const user_id = req.user.id;
  const { id } = req.params;

  db.prepare(`
    DELETE FROM workout_logs WHERE id = ? AND user_id = ?
  `).run(id, user_id);

  res.json({ message: 'Запис видалено!' });
});

module.exports = router;