// seed3.js — СЦЕНАРІЙ 3: Дефіцит калорій (зниження ваги)
// Рекомендація: "Збільшити калорійність"
// Запускати: node seed3.js (з папки server/)
 
const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'fitness.db'));
 
const EMAIL = 'andrejandrejcenko11@gmail.com';
const userRow = db.prepare('SELECT id FROM users WHERE email = ?').get(EMAIL);
if (!userRow) { console.error('Користувача не знайдено!'); process.exit(1); }
const USER_ID = userRow.id;
console.log('Знайдено користувача: id = ' + USER_ID);
 
db.prepare("UPDATE users SET age = 22, height = 178, weight = 75.7, goal_calories = 2200, sex = 'male' WHERE id = ?").run(USER_ID);
db.prepare('DELETE FROM weight_logs WHERE user_id = ?').run(USER_ID);
db.prepare('DELETE FROM food_logs WHERE user_id = ?').run(USER_ID);
db.prepare('DELETE FROM workout_logs WHERE user_id = ?').run(USER_ID);
 
const dates = [
  '2026-05-24', '2026-05-25', '2026-05-26', '2026-05-27',
  '2026-05-28', '2026-05-29', '2026-05-30', '2026-05-31',
  '2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04',
  '2026-06-05', '2026-06-06', '2026-06-07'
];
 
// Вага поступово знижується
const weights = [
  78.0, 77.8, 77.6, 77.4,
  77.2, 77.0, 76.8, 76.6,
  76.4, 76.2, 76.0, 75.9,
  75.8, 75.7, 75.7
];
 
for (let i = 0; i < dates.length; i++) {
  db.prepare('INSERT INTO weight_logs (user_id, weight, date) VALUES (?,?,?)').run(USER_ID, weights[i], dates[i]);
}
 
// Харчування: ~1200 ккал/день (дефіцит) + активні тренування
for (const date of dates) {
  db.prepare('INSERT INTO food_logs (user_id, name, calories, protein, carbs, fat, date) VALUES (?,?,?,?,?,?,?)').run(USER_ID, 'Сніданок', 300, 20, 35, 10, date);
  db.prepare('INSERT INTO food_logs (user_id, name, calories, protein, carbs, fat, date) VALUES (?,?,?,?,?,?,?)').run(USER_ID, 'Обід', 500, 35, 55, 15, date);
  db.prepare('INSERT INTO food_logs (user_id, name, calories, protein, carbs, fat, date) VALUES (?,?,?,?,?,?,?)').run(USER_ID, 'Вечеря', 400, 30, 45, 12, date);
  db.prepare('INSERT INTO workout_logs (user_id, name, duration, calories_burned, date) VALUES (?,?,?,?,?)').run(USER_ID, 'Біг', 60, 500, date);
}
 
db.close();
console.log('Сценарій 3 завантажено: дефіцит калорій -> Збільшити калорійність');