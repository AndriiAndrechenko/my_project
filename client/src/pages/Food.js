import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

function Food() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState({
    name: '', calories: '', protein: '', carbs: '', fat: '', date: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const headers = { Authorization: `Bearer ${user.token}` };

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/food/${today}`, { headers });
      setLogs(res.data);
    } catch (err) { console.error(err); }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/food', { ...form, date: form.date || today }, { headers });
      setMessage('✅ Прийом їжі додано!');
      setForm({ name: '', calories: '', protein: '', carbs: '', fat: '', date: '' });
      fetchLogs();
      setTimeout(() => setMessage(''), 3000);
    } catch { setMessage('❌ Помилка додавання'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/food/${id}`, { headers });
      fetchLogs();
    } catch (err) { console.error(err); }
  };

  const totalCalories = logs.reduce((sum, f) => sum + f.calories, 0);
  const totalProtein = logs.reduce((sum, f) => sum + f.protein, 0);
  const totalCarbs = logs.reduce((sum, f) => sum + f.carbs, 0);
  const totalFat = logs.reduce((sum, f) => sum + f.fat, 0);

  return (
    <div className="main-content">
      <h1 className="page-title">🍎 Харчування</h1>

      {/* Форма */}
      <div className="card">
        <h2 style={{color:'#fff', fontWeight:'700', marginBottom:'20px'}}>Додати прийом їжі</h2>
        {message && <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-error'}`}>{message}</div>}

        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Назва продукту</label>
              <input type="text" name="name" value={form.name} onChange={handleChange}
                className="form-input" placeholder="Гречка з куркою" required />
            </div>
            <div className="form-group">
              <label className="form-label">Калорії (ккал)</label>
              <input type="number" name="calories" value={form.calories} onChange={handleChange}
                className="form-input" placeholder="350" required />
            </div>
          </div>

          <div className="grid-3">
            <div className="form-group">
              <label className="form-label">Білки (г)</label>
              <input type="number" name="protein" value={form.protein} onChange={handleChange}
                className="form-input" placeholder="30" />
            </div>
            <div className="form-group">
              <label className="form-label">Вуглеводи (г)</label>
              <input type="number" name="carbs" value={form.carbs} onChange={handleChange}
                className="form-input" placeholder="40" />
            </div>
            <div className="form-group">
              <label className="form-label">Жири (г)</label>
              <input type="number" name="fat" value={form.fat} onChange={handleChange}
                className="form-input" placeholder="10" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Дата</label>
            <input type="date" name="date" value={form.date} onChange={handleChange}
              className="form-input" />
          </div>

          <button type="submit" disabled={loading} className="btn btn-green">
            {loading ? 'Додавання...' : '+ Додати'}
          </button>
        </form>
      </div>

      {/* Підсумок */}
      {logs.length > 0 && (
        <div className="card">
          <h2 style={{color:'#fff', fontWeight:'700', marginBottom:'16px'}}>📊 Сьогодні</h2>
          <div className="grid-3" style={{marginBottom:'20px'}}>
            <div className="prediction-card">
              <p className="prediction-label">Калорії</p>
              <p className="prediction-value text-green">{totalCalories}</p>
            </div>
            <div className="prediction-card">
              <p className="prediction-label">Білки</p>
              <p className="prediction-value text-blue">{totalProtein}г</p>
            </div>
            <div className="prediction-card">
              <p className="prediction-label">Вуглеводи</p>
              <p className="prediction-value" style={{color:'#fbbf24'}}>{totalCarbs}г</p>
            </div>
          </div>

          {logs.map(log => (
            <div key={log.id} className="log-item">
              <div>
                <p className="log-name">{log.name}</p>
                <p className="log-sub">Б: {log.protein}г | В: {log.carbs}г | Ж: {log.fat}г</p>
              </div>
              <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                <span className="log-value text-green">{log.calories} ккал</span>
                <button onClick={() => handleDelete(log.id)} className="btn-delete">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Food;