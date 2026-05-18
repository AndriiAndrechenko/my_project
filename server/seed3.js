// seed3.js — СЦЕНАРІЙ 3: Дефіцит калорій
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

db.prepare('UPDATE users SET age = 22, height = 178, weight = 78, goal_calories = 2200, sex = \'male\' WHERE id = ?').run(USER_ID);
db.prepare('DELETE FROM weight_logs WHERE user_id = ?').run(USER_ID);
db.prepare('DELETE FROM food_logs WHERE user_id = ?').run(USER_ID);
db.prepare('DELETE FROM workout_logs WHERE user_id = ?').run(USER_ID);

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

const weights = [[78.0,14],[77.5,12],[77.0,10],[76.8,8],[76.5,6],[76.2,4],[76.0,2],[75.7,1]];
for (const [w, ago] of weights) {
  db.prepare('INSERT INTO weight_logs (user_id, weight, date) VALUES (?,?,?)').run(USER_ID, w, daysAgo(ago));
}

for (let i = 14; i >= 1; i--) {
  const date = daysAgo(i);
  db.prepare('INSERT INTO food_logs (user_id, name, calories, protein, carbs, fat, date) VALUES (?,?,?,?,?,?,?)').run(USER_ID,'Сніданок',300,20,35,10,date);
  db.prepare('INSERT INTO food_logs (user_id, name, calories, protein, carbs, fat, date) VALUES (?,?,?,?,?,?,?)').run(USER_ID,'Обід',500,35,55,15,date);
  db.prepare('INSERT INTO food_logs (user_id, name, calories, protein, carbs, fat, date) VALUES (?,?,?,?,?,?,?)').run(USER_ID,'Вечеря',400,30,45,12,date);
  db.prepare('INSERT INTO workout_logs (user_id, name, duration, calories_burned, date) VALUES (?,?,?,?,?)').run(USER_ID,'Біг',60,500,date);
}

db.close();
console.log('Сценарій 3 завантажено: дефіцит калорій -> Збільшити калорійність');
