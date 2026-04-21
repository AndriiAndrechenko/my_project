const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // Отримуємо токен з заголовку
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Немає доступу, токен відсутній' });
  }

  try {
    // Перевіряємо токен
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Невірний або прострочений токен' });
  }
};