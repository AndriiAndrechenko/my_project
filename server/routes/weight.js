const express = require('express');
const router = express.Router();
const db = require('../database');
const authMiddleware = require('../middleware/auth');
 
// ─── Ridge regression helpers ────────────────────────────────────────────────
 
// Transpose matrix
function transpose(A) {
  return A[0].map((_, j) => A.map(row => row[j]));
}
 
// Matrix multiply A × B
function matMul(A, B) {
  return A.map(row =>
    B[0].map((_, j) => row.reduce((sum, val, k) => sum + val * B[k][j], 0))
  );
}
 
// Add lambda * I to square matrix
function addRidgePenalty(AtA, lambda) {
  return AtA.map((row, i) => row.map((val, j) => (i === j ? val + lambda : val)));
}
 
// Invert matrix using Gaussian elimination
function invertMatrix(M) {
  const n = M.length;
  const aug = M.map((row, i) => {
    const id = Array(n).fill(0);
    id[i] = 1;
    return [...row, ...id];
  });
  for (let col = 0; col < n; col++) {
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) maxRow = row;
    }
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];
    const pivot = aug[col][col];
    if (Math.abs(pivot) < 1e-12) throw new Error('Singular matrix');
    for (let j = 0; j < 2 * n; j++) aug[col][j] /= pivot;
    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = aug[row][col];
      for (let j = 0; j < 2 * n; j++) aug[row][j] -= factor * aug[col][j];
    }
  }
  return aug.map(row => row.slice(n));
}
 
// Standardize columns (z-score), returns { Xn, means, stds }
function standardize(X) {
  const n = X.length;
  const cols = X[0].length;
  const means = Array(cols).fill(0);
  const stds  = Array(cols).fill(1);
 
  for (let j = 1; j < cols; j++) {           // skip bias column (index 0)
    means[j] = X.reduce((s, r) => s + r[j], 0) / n;
    const variance = X.reduce((s, r) => s + (r[j] - means[j]) ** 2, 0) / n;
    stds[j] = Math.sqrt(variance) || 1;
  }
 
  const Xn = X.map(row =>
    row.map((val, j) => (j === 0 ? 1 : (val - means[j]) / stds[j]))
  );
  return { Xn, means, stds };
}
 
// Ridge regression: returns coefficients â
function ridgeFit(X, y, lambda) {
  const Xt  = transpose(X);
  const XtX = matMul(Xt, X);
  const reg = addRidgePenalty(XtX, lambda);
  const inv = invertMatrix(reg);
  const XtY = Xt.map(row => row.reduce((s, v, i) => s + v * y[i], 0));
  return inv.map(row => row.reduce((s, v, i) => s + v * XtY[i], 0));
}
 
// MSE
function mse(yTrue, yPred) {
  return yTrue.reduce((s, v, i) => s + (v - yPred[i]) ** 2, 0) / yTrue.length;
}
 
// k-fold cross-validation — returns best lambda and CV table
function kFoldCV(X, y, lambdas, k) {
  const n = X.length;
  const foldSize = Math.floor(n / k);
  const results = [];
 
  for (const lambda of lambdas) {
    let totalMSE = 0;
    for (let fold = 0; fold < k; fold++) {
      const testStart = fold * foldSize;
      const testEnd   = fold === k - 1 ? n : testStart + foldSize;
      const Xtrain = [...X.slice(0, testStart), ...X.slice(testEnd)];
      const ytrain = [...y.slice(0, testStart), ...y.slice(testEnd)];
      const Xtest  = X.slice(testStart, testEnd);
      const ytest  = y.slice(testStart, testEnd);
      const coef   = ridgeFit(Xtrain, ytrain, lambda);
      const yPred  = Xtest.map(row => row.reduce((s, v, i) => s + v * coef[i], 0));
      totalMSE += mse(ytest, yPred);
    }
    results.push({ lambda, avgMSE: +(totalMSE / k).toFixed(4) });
  }
 
  const best = results.reduce((a, b) => (a.avgMSE < b.avgMSE ? a : b));
  return { best, results };
}
 
// ─── Routes ──────────────────────────────────────────────────────────────────
 
// Додати запис ваги
router.post('/', authMiddleware, (req, res) => {
  const { weight, date } = req.body;
  const user_id = req.user.id;
  const result = db.prepare(`
    INSERT INTO weight_logs (user_id, weight, date) VALUES (?, ?, ?)
  `).run(user_id, weight, date);
  res.json({ id: result.lastInsertRowid, message: 'Вагу записано!' });
});
 
// Отримати всю історію ваги
router.get('/', authMiddleware, (req, res) => {
  const user_id = req.user.id;
  const logs = db.prepare(`
    SELECT * FROM weight_logs WHERE user_id = ? ORDER BY date ASC
  `).all(user_id);
  res.json(logs);
});
 
// Прогноз ваги (Ridge regression + k-fold CV + sliding window)
router.get('/predict', authMiddleware, (req, res) => {
  const user_id = req.user.id;
 
  // Дані користувача
  const user = db.prepare(`
    SELECT age, weight, height, goal_calories, sex FROM users WHERE id = ?
  `).get(user_id);
 
  // Вся історія ваги (відсортована за датою)
  const allWeightLogs = db.prepare(`
    SELECT weight, date FROM weight_logs WHERE user_id = ? ORDER BY date ASC
  `).all(user_id);
 
  if (allWeightLogs.length < 2) {
    return res.status(400).json({ message: 'Потрібно мінімум 2 записи ваги для прогнозу' });
  }
 
  // ── Sliding window: беремо останні N записів ──
  const WINDOW_SIZE = Math.min(30, allWeightLogs.length);
  const window = allWeightLogs.slice(-WINDOW_SIZE);
  const windowDates = window.map(r => r.date);
  const oldestDate  = windowDates[0];
  const newestDate  = windowDates[windowDates.length - 1];
 
  // Середнє calories_in за кожен день вікна
  const foodByDate = {};
  db.prepare(`
    SELECT date, SUM(calories) as total
    FROM food_logs
    WHERE user_id = ? AND date >= ? AND date <= ?
    GROUP BY date
  `).all(user_id, oldestDate, newestDate).forEach(r => {
    foodByDate[r.date] = r.total;
  });
 
  // Середнє calories_out (burned) за кожен день вікна
  const workoutByDate = {};
  db.prepare(`
    SELECT date, SUM(calories_burned) as total
    FROM workout_logs
    WHERE user_id = ? AND date >= ? AND date <= ?
    GROUP BY date
  `).all(user_id, oldestDate, newestDate).forEach(r => {
    workoutByDate[r.date] = r.total;
  });
 
  // Формуємо навчальну вибірку: X = [1, wt, cal_in, cal_out], y = wt+1
  const X_train = [];
  const y_train = [];
 
  for (let i = 0; i < window.length - 1; i++) {
    const date   = window[i].date;
    const wt     = window[i].weight;
    const cal_in  = foodByDate[date]    || user.goal_calories || 2000;
    const cal_out = workoutByDate[date] || 0;
    X_train.push([1, wt, cal_in, cal_out]);
    y_train.push(window[i + 1].weight);
  }
 
  // Нормалізація (z-score)
  const { Xn: X_norm, means, stds } = standardize(X_train);
 
  // k-fold CV
  const k = X_norm.length >= 30 ? 5 : 3;
  const LAMBDAS = [0.01, 0.1, 1, 10, 100];
  const { best, results: cvResults } = kFoldCV(X_norm, y_train, LAMBDAS, k);
  const bestLambda = best.lambda;
 
  // Навчання фінальної моделі з найкращим λ
  const coef = ridgeFit(X_norm, y_train, bestLambda);
 
  // Поточний вектор ознак (останній запис)
  const currentWeight = window[window.length - 1].weight;
  const lastDate      = window[window.length - 1].date;
  const cal_in_now    = foodByDate[lastDate]    || user.goal_calories || 2000;
  const cal_out_now   = workoutByDate[lastDate] || 0;
 
  const X_current_raw = [1, currentWeight, cal_in_now, cal_out_now];
  const X_current_norm = X_current_raw.map((v, j) =>
    j === 0 ? 1 : (v - means[j]) / stds[j]
  );
 
  // Прогноз наступного дня
  const predictNext = X_current_norm.reduce((s, v, i) => s + v * coef[i], 0);
  const weightChangePerDay = predictNext - currentWeight;
 
  const predict = (days) => +(currentWeight + weightChangePerDay * days).toFixed(1);
 
  // Тенденція
  let trend = 'стабільна';
  if (weightChangePerDay > 0.01) trend = 'зростання';
  else if (weightChangePerDay < -0.01) trend = 'зниження';
 
  // BMR та баланс (для UI)
  const age    = user.age    || 25;
  const height = user.height || 175;
  const BMR    = 10 * currentWeight + 6.25 * height - 5 * age + 5;
  const dailyExpenditure = BMR * 1.375;
  const avgCalories      = cal_in_now;
  const dailyBalance     = +(avgCalories - dailyExpenditure).toFixed(0);
 
  // ── Консольний лог для контрольних прикладів ──
  console.log('\n===== ML-МОДУЛЬ: КОНТРОЛЬНИЙ ПРИКЛАД =====');
  console.log(`Sliding window: ${WINDOW_SIZE} записів (${oldestDate} → ${newestDate})`);
  console.log(`Навчальна вибірка: ${X_train.length} пар (X, y)`);
  console.log(`\nk-fold CV (k=${k}):`);
  cvResults.forEach(r => console.log(`  λ=${r.lambda} → MSE=${r.avgMSE}`));
  console.log(`  Обраний λ: ${bestLambda}`);
  console.log(`\nКоефіцієнти Ridge â:`);
  console.log(`  a0=${coef[0].toFixed(4)}, a1=${coef[1].toFixed(4)}, a2=${coef[2].toFixed(4)}, a3=${coef[3].toFixed(4)}`);
  console.log(`\nПоточний вектор ознак X (ненормалізований):`);
  console.log(`  [1, ${currentWeight}, ${cal_in_now}, ${cal_out_now}]`);
  console.log(`Поточний вектор ознак X (нормалізований):`);
  console.log(`  [${X_current_norm.map(v => v.toFixed(4)).join(', ')}]`);
  console.log(`\nПрогноз: weightChangePerDay=${weightChangePerDay.toFixed(4)} кг/день`);
  console.log(`  7 днів: ${predict(7)} кг`);
  console.log(`  14 днів: ${predict(14)} кг`);
  console.log(`  30 днів: ${predict(30)} кг`);
  console.log('===========================================\n');
 
  res.json({
    current: currentWeight,
    bmr: +BMR.toFixed(0),
    dailyExpenditure: +dailyExpenditure.toFixed(0),
    avgCalories: +avgCalories.toFixed(0),
    avgBurned: cal_out_now,
    dailyBalance,
    weightChangePerDay: +weightChangePerDay.toFixed(3),
    trend,
    predictions: {
      days7:  predict(7),
      days14: predict(14),
      days30: predict(30),
    },
    // Додаткові дані для розширеного UI (опційно)
    mlDebug: {
      windowSize: WINDOW_SIZE,
      windowPeriod: `${oldestDate} → ${newestDate}`,
      trainSamples: X_train.length,
      kFolds: k,
      cvResults,
      bestLambda,
      coef: coef.map(v => +v.toFixed(4)),
      xCurrentRaw:  X_current_raw,
      xCurrentNorm: X_current_norm.map(v => +v.toFixed(4)),
    }
  });
});
 
// Видалити запис ваги
router.delete('/:id', authMiddleware, (req, res) => {
  const user_id = req.user.id;
  const { id } = req.params;
  db.prepare(`DELETE FROM weight_logs WHERE id = ? AND user_id = ?`).run(id, user_id);
  res.json({ message: 'Запис видалено!' });
});
 
module.exports = router;