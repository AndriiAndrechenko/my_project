// seed2.js — СЦЕНАРІЙ 2: Стабільна вага
// Рекомендація: "Підтримувати режим"
// Запускати: node seed2.js (з папки server/)
 
const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'fitness.db'));
 
const EMAIL = 'andrejandrejcenko11@gmail.com';
const userRow = db.prepare('SELECT id FROM users WHERE email = ?').get(EMAIL);
if (!userRow) { console.error('Користувача не знайдено!'); process.exit(1); }
const USER_ID = userRow.id;
console.log('Знайдено користувача: id = ' + USER_ID);
 
db.prepare("UPDATE users SET age = 22, height = 178, weight = 75.0, goal_calories = 2500, sex = 'male' WHERE id = ?").run(USER_ID);
db.prepare('DELETE FROM weight_logs WHERE user_id = ?').run(USER_ID);
db.prepare('DELETE FROM food_logs WHERE user_id = ?').run(USER_ID);
db.prepare('DELETE FROM workout_logs WHERE user_id = ?').run(USER_ID);
 
const dates = [
  '2026-05-24', '2026-05-25', '2026-05-26', '2026-05-27',
  '2026-05-28', '2026-05-29', '2026-05-30', '2026-05-31',
  '2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04',
  '2026-06-05', '2026-06-06', '2026-06-07'
];
 
// Вага стабільна ±0.1 кг
const weights = [
  75.0, 75.1, 74.9, 75.0,
  75.1, 75.0, 74.9, 75.1,
  75.0, 74.9, 75.0, 75.1,
  75.0, 74.9, 75.0
];
 
for (let i = 0; i < dates.length; i++) {
  db.prepare('INSERT INTO weight_logs (user_id, weight, date) VALUES (?,?,?)').run(USER_ID, weights[i], dates[i]);
}
 
// Харчування: ~2500 ккал/день (близько до витрат)
for (const date of dates) {
  db.prepare('INSERT INTO food_logs (user_id, name, calories, protein, carbs, fat, date) VALUES (?,?,?,?,?,?,?)').run(USER_ID, 'Сніданок', 600, 30, 75, 18, date);
  db.prepare('INSERT INTO food_logs (user_id, name, calories, protein, carbs, fat, date) VALUES (?,?,?,?,?,?,?)').run(USER_ID, 'Обід', 900, 45, 110, 30, date);
  db.prepare('INSERT INTO food_logs (user_id, name, calories, protein, carbs, fat, date) VALUES (?,?,?,?,?,?,?)').run(USER_ID, 'Вечеря', 750, 38, 90, 25, date);
  db.prepare('INSERT INTO food_logs (user_id, name, calories, protein, carbs, fat, date) VALUES (?,?,?,?,?,?,?)').run(USER_ID, 'Перекус', 250, 12, 30, 8, date);
}
 
db.close();
console.log('Сценарій 2 завантажено: стабільна вага -> Підтримувати режим');