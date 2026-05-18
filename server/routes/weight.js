const express = require('express');
const router = express.Router();
const db = require('../database');
const authMiddleware = require('../middleware/auth');

// Додати запис ваги
router.post('/', authMiddleware, (req, res) => {
  const { weight, date } = req.body;
  const user_id = req.user.id;

  const result = db.prepare(`
    INSERT INTO weight_logs (user_id, weight, date)
    VALUES (?, ?, ?)
  `).run(user_id, weight, date);

  res.json({ id: result.lastInsertRowid, message: 'Вагу записано!' });
});

// Отримати всю історію ваги
router.get('/', authMiddleware, (req, res) => {
  const user_id = req.user.id;

  const logs = db.prepare(`
    SELECT * FROM weight_logs WHERE user_id = ?
    ORDER BY date ASC
  `).all(user_id);

  res.json(logs);
});

// Прогноз ваги з урахуванням калорій та тренувань
router.get('/predict', authMiddleware, (req, res) => {
  const user_id = req.user.id;

  // Отримуємо дані користувача
  const user = db.prepare(`
    SELECT age, weight, height, goal_calories FROM users WHERE id = ?
  `).get(user_id);

  // Отримуємо історію ваги
  const weightLogs = db.prepare(`
    SELECT * FROM weight_logs WHERE user_id = ?
    ORDER BY date ASC
  `).all(user_id);

  if (weightLogs.length < 2) {
    return res.status(400).json({ message: 'Потрібно мінімум 2 записи ваги для прогнозу' });
  }

  // Поточна вага (остання)
  const currentWeight = weightLogs[weightLogs.length - 1].weight;

  // Вік, зріст з профілю (або дефолтні)
  const age = user.age || 25;
  const height = user.height || 175;

  // Розрахунок BMR за формулою Міффліна-Сан Жеора (для чоловіків)
  // BMR = 10 × вага + 6.25 × зріст - 5 × вік + 5
  const BMR = 10 * currentWeight + 6.25 * height - 5 * age + 5;

  // Коефіцієнт активності (помірна активність)
  const activityFactor = 1.375;
  const dailyExpenditure = BMR * activityFactor;

  // Отримуємо середні калорії за останні 14 днів
  const last14Days = db.prepare(`
    SELECT AVG(daily_total) as avg_calories
    FROM (
      SELECT date, SUM(calories) as daily_total
      FROM food_logs
      WHERE user_id = ?
      AND date >= date('now', '-14 days')
      GROUP BY date
    )
  `).get(user_id);

  // Отримуємо середні спалені калорії за останні 14 днів
  const last14DaysWorkout = db.prepare(`
    SELECT AVG(calories_burned) as avg_burned
    FROM workout_logs
    WHERE user_id = ?
    AND date >= date('now', '-14 days')
  `).get(user_id);

  const avgCalories = last14Days.avg_calories || user.goal_calories || 2000;
  const avgBurned = last14DaysWorkout.avg_burned || 0;

  // Щоденний енергетичний баланс
  // Баланс = спожиті - (витрати організму + тренування)
  const dailyBalance = avgCalories - dailyExpenditure;

  // Зміна ваги: 1 кг жиру = 7700 ккал
  const weightChangePerDay = dailyBalance / 7700;

  // Прогноз на N днів
  const predict = (days) => +(currentWeight + weightChangePerDay * days).toFixed(1);

  // Визначення тенденції
  let trend = 'стабільна';
  if (weightChangePerDay > 0.01) trend = 'зростання';
  else if (weightChangePerDay < -0.01) trend = 'зниження';

  res.json({
    current: currentWeight,
    bmr: +BMR.toFixed(0),
    dailyExpenditure: +dailyExpenditure.toFixed(0),
    avgCalories: +avgCalories.toFixed(0),
    avgBurned: +avgBurned.toFixed(0),
    dailyBalance: +dailyBalance.toFixed(0),
    weightChangePerDay: +weightChangePerDay.toFixed(3),
    trend,
    predictions: {
      days7: predict(7),
      days14: predict(14),
      days30: predict(30),
    }
  });
});

// Видалити запис ваги
router.delete('/:id', authMiddleware, (req, res) => {
  const user_id = req.user.id;
  const { id } = req.params;

  db.prepare(`
    DELETE FROM weight_logs WHERE id = ? AND user_id = ?
  `).run(id, user_id);

  res.json({ message: 'Запис видалено!' });
});

module.exports = router;