const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/auth');
const foodRoutes = require('./routes/food');
const workoutRoutes = require('./routes/workout');
const weightRoutes = require('./routes/weight');
const favoritesRoutes = require('./routes/favorites');

console.log('auth:', typeof authRoutes);
console.log('food:', typeof foodRoutes);
console.log('workout:', typeof workoutRoutes);
console.log('weight:', typeof weightRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/workout', workoutRoutes);
app.use('/api/weight', weightRoutes);
app.use('/api/favorites', favoritesRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Сервер працює!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Сервер запущено на порті ${PORT}`);
});