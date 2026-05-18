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

db.prepare('UPDATE users SET age = 22, height = 178, weight = 75, goal_calories = 2500, sex = \'male\' WHERE id = ?').run(USER_ID);
db.prepare('DELETE FROM weight_logs WHERE user_id = ?').run(USER_ID);
db.prepare('DELETE FROM food_logs WHERE user_id = ?').run(USER_ID);
db.prepare('DELETE FROM workout_logs WHERE user_id = ?').run(USER_ID);

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

// Вага стабільна ±0.1 кг
const weights = [[75.0,14],[75.1,12],[74.9,10],[75.0,8],[75.1,6],[75.0,4],[74.9,2],[75.0,1]];
for (const [w, ago] of weights) {
  db.prepare('INSERT INTO weight_logs (user_id, weight, date) VALUES (?,?,?)').run(USER_ID, w, daysAgo(ago));
}

// ~2500 ккал/день — близько до витрат BMR×1.375 = ~2440 (для ваги 75кг)
// Баланс = 2500 - 2440 = +60 ккал → стабільна вага
for (let i = 14; i >= 1; i--) {
  const date = daysAgo(i);
  db.prepare('INSERT INTO food_logs (user_id, name, calories, protein, carbs, fat, date) VALUES (?,?,?,?,?,?,?)').run(USER_ID,'Сніданок',600,30,75,18,date);
  db.prepare('INSERT INTO food_logs (user_id, name, calories, protein, carbs, fat, date) VALUES (?,?,?,?,?,?,?)').run(USER_ID,'Обід',900,45,110,30,date);
  db.prepare('INSERT INTO food_logs (user_id, name, calories, protein, carbs, fat, date) VALUES (?,?,?,?,?,?,?)').run(USER_ID,'Вечеря',750,38,90,25,date);
  db.prepare('INSERT INTO food_logs (user_id, name, calories, protein, carbs, fat, date) VALUES (?,?,?,?,?,?,?)').run(USER_ID,'Перекус',250,12,30,8,date);
}

db.close();
console.log('Сценарій 2 завантажено: стабільна вага -> Підтримувати режим');
console.log('BMR(75кг) ~1828 * 1.375 = ~2438, споживання 2500, баланс ~+60 ккал');
