// check.js — перевіряє що зараз в базі
// node check.js (з папки server/)

const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'fitness.db'));

const EMAIL = 'andrejandrejcenko11@gmail.com';
const userRow = db.prepare('SELECT * FROM users WHERE email = ?').get(EMAIL);
console.log('Користувач:', userRow.id, userRow.age, userRow.height, userRow.weight);

const avgCal = db.prepare("SELECT AVG(calories) as avg FROM food_logs WHERE user_id = ? AND date >= date('now', '-14 days')").get(userRow.id);
console.log('Середні калорії за 14 днів:', avgCal.avg);

const avgBurned = db.prepare("SELECT AVG(calories_burned) as avg FROM workout_logs WHERE user_id = ? AND date >= date('now', '-14 days')").get(userRow.id);
console.log('Середні спалені за 14 днів:', avgBurned.avg);

const BMR = 10 * userRow.weight + 6.25 * userRow.height - 5 * userRow.age + 5;
const dailyExpenditure = BMR * 1.375;
const balance = (avgCal.avg || 0) - (dailyExpenditure + (avgBurned.avg || 0));
console.log('BMR:', BMR.toFixed(0));
console.log('Витрати:', dailyExpenditure.toFixed(0));
console.log('Баланс:', balance.toFixed(0));

db.close();
