import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function Register() {
  const [form, setForm] = useState({
    username: '', email: '', password: '', age: '', weight: '', height: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', form);
      login(res.data.token, res.data.username);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Помилка реєстрації');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title">💪 Реєстрація</h2>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Ім'я користувача</label>
            <input type="text" name="username" value={form.username} onChange={handleChange}
              className="form-input" placeholder="Andriy" required />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange}
              className="form-input" placeholder="your@email.com" required />
          </div>
          <div className="form-group">
            <label className="form-label">Пароль</label>
            <input type="password" name="password" value={form.password} onChange={handleChange}
              className="form-input" placeholder="••••••••" required />
          </div>

          <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px'}}>
            <div className="form-group">
              <label className="form-label">Вік</label>
              <input type="number" name="age" value={form.age} onChange={handleChange}
                className="form-input" placeholder="25" />
            </div>
            <div className="form-group">
              <label className="form-label">Вага (кг)</label>
              <input type="number" name="weight" value={form.weight} onChange={handleChange}
                className="form-input" placeholder="70" />
            </div>
            <div className="form-group">
              <label className="form-label">Зріст (см)</label>
              <input type="number" name="height" value={form.height} onChange={handleChange}
                className="form-input" placeholder="175" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-blue">
            {loading ? 'Завантаження...' : 'Зареєструватись'}
          </button>
        </form>

        <p className="auth-link">
          Вже є акаунт? <Link to="/login">Увійти</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;