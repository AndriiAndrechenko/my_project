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

db.prepare('UPDATE users SET age = 22, height = 178, weight = 82, goal_calories = 2200, sex = \'male\' WHERE id = ?').run(USER_ID);
db.prepare('DELETE FROM weight_logs WHERE user_id = ?').run(USER_ID);
db.prepare('DELETE FROM food_logs WHERE user_id = ?').run(USER_ID);
db.prepare('DELETE FROM workout_logs WHERE user_id = ?').run(USER_ID);

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

const weights = [[80.0,14],[80.5,12],[81.0,10],[81.2,8],[81.5,6],[81.8,4],[82.0,2],[82.3,1]];
for (const [w, ago] of weights) {
  db.prepare('INSERT INTO weight_logs (user_id, weight, date) VALUES (?,?,?)').run(USER_ID, w, daysAgo(ago));
}

for (let i = 14; i >= 1; i--) {
  const date = daysAgo(i);
  db.prepare('INSERT INTO food_logs (user_id, name, calories, protein, carbs, fat, date) VALUES (?,?,?,?,?,?,?)').run(USER_ID,'Сніданок',800,30,100,25,date);
  db.prepare('INSERT INTO food_logs (user_id, name, calories, protein, carbs, fat, date) VALUES (?,?,?,?,?,?,?)').run(USER_ID,'Обід',1200,50,150,40,date);
  db.prepare('INSERT INTO food_logs (user_id, name, calories, protein, carbs, fat, date) VALUES (?,?,?,?,?,?,?)').run(USER_ID,'Вечеря',1000,40,120,35,date);
  db.prepare('INSERT INTO food_logs (user_id, name, calories, protein, carbs, fat, date) VALUES (?,?,?,?,?,?,?)').run(USER_ID,'Перекус',200,10,25,8,date);
}

db.prepare('INSERT INTO workout_logs (user_id, name, duration, calories_burned, date) VALUES (?,?,?,?,?)').run(USER_ID,'Прогулянка',20,100,daysAgo(10));
db.prepare('INSERT INTO workout_logs (user_id, name, duration, calories_burned, date) VALUES (?,?,?,?,?)').run(USER_ID,'Прогулянка',20,100,daysAgo(5));

db.close();
console.log('Сценарій 1 завантажено: набір ваги + профіцит -> Зменшити калорійність');
