// seed1.js — СЦЕНАРІЙ 1: Набір ваги + профіцит калорій
// Рекомендація: "Зменшити калорійність"
// Запускати: node seed1.js (з папки server/)
 
const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'fitness.db'));
 
const EMAIL = 'andrejandrejcenko11@gmail.com';
const userRow = db.prepare('SELECT id FROM users WHERE email = ?').get(EMAIL);
if (!userRow) { console.error('Користувача не знайдено!'); process.exit(1); }
const USER_ID = userRow.id;
console.log('Знайдено користувача: id = ' + USER_ID);
 
db.prepare("UPDATE users SET age = 22, height = 178, weight = 82.3, goal_calories = 2200, sex = 'male' WHERE id = ?").run(USER_ID);
db.prepare('DELETE FROM weight_logs WHERE user_id = ?').run(USER_ID);
db.prepare('DELETE FROM food_logs WHERE user_id = ?').run(USER_ID);
db.prepare('DELETE FROM workout_logs WHERE user_id = ?').run(USER_ID);
 
// Фіксовані дати червня 2026
const dates = [
  '2026-05-24', '2026-05-25', '2026-05-26', '2026-05-27',
  '2026-05-28', '2026-05-29', '2026-05-30', '2026-05-31',
  '2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04',
  '2026-06-05', '2026-06-06', '2026-06-07'
];
 
// Вага поступово зростає
const weights = [
  80.0, 80.2, 80.4, 80.6,
  80.8, 81.0, 81.2, 81.4,
  81.6, 81.8, 82.0, 82.1,
  82.2, 82.3, 82.3
];
 
for (let i = 0; i < dates.length; i++) {
  db.prepare('INSERT INTO weight_logs (user_id, weight, date) VALUES (?,?,?)').run(USER_ID, weights[i], dates[i]);
}
 
// Харчування: ~3200 ккал/день (профіцит)
for (const date of dates) {
  db.prepare('INSERT INTO food_logs (user_id, name, calories, protein, carbs, fat, date) VALUES (?,?,?,?,?,?,?)').run(USER_ID, 'Сніданок', 800, 30, 100, 25, date);
  db.prepare('INSERT INTO food_logs (user_id, name, calories, protein, carbs, fat, date) VALUES (?,?,?,?,?,?,?)').run(USER_ID, 'Обід', 1200, 50, 150, 40, date);
  db.prepare('INSERT INTO food_logs (user_id, name, calories, protein, carbs, fat, date) VALUES (?,?,?,?,?,?,?)').run(USER_ID, 'Вечеря', 1000, 40, 120, 35, date);
  db.prepare('INSERT INTO food_logs (user_id, name, calories, protein, carbs, fat, date) VALUES (?,?,?,?,?,?,?)').run(USER_ID, 'Перекус', 200, 10, 25, 8, date);
}
 
// Мінімальне тренування
db.prepare('INSERT INTO workout_logs (user_id, name, duration, calories_burned, date) VALUES (?,?,?,?,?)').run(USER_ID, 'Прогулянка', 20, 100, '2026-06-03');
db.prepare('INSERT INTO workout_logs (user_id, name, duration, calories_burned, date) VALUES (?,?,?,?,?)').run(USER_ID, 'Прогулянка', 20, 100, '2026-06-06');
 
db.close();
console.log('Сценарій 1 завантажено: набір ваги + профіцит -> Зменшити калорійність');